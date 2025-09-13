import { Test, TestingModule } from '@nestjs/testing';
import { FrameworkDetector, FrameworkType } from './framework-detector';
import { LoggerService } from '../logger';

describe('FrameworkDetector', () => {
  let service: FrameworkDetector;

  beforeEach(async () => {
    const mockLogger = {
      setContext: jest.fn().mockReturnThis(),
      info: jest.fn(),
      logWithMeta: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FrameworkDetector,
        {
          provide: LoggerService,
          useValue: mockLogger,
        },
      ],
    }).compile();

    service = module.get<FrameworkDetector>(FrameworkDetector);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('detectFramework', () => {
    it('should detect Next.js correctly', () => {
      const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <script src="/_next/static/chunks/main.js"></script>
            <link rel="stylesheet" href="/_next/static/css/app.css">
          </head>
          <body>
            <div id="__next"></div>
          </body>
        </html>
      `;

      const result = service.detectFramework(html, 'https://example.com');

      expect(result.type).toBe(FrameworkType.NEXT_JS);
      expect(result.confidence).toBeGreaterThan(0.8);
      expect(result.features).toContain('static-generation');
    });

    it('should detect WordPress correctly', () => {
      const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta name="generator" content="WordPress 6.0">
            <link rel="stylesheet" href="/wp-content/themes/theme/style.css">
            <script src="/wp-includes/js/jquery.js"></script>
          </head>
          <body>
            <div class="wp-content"></div>
          </body>
        </html>
      `;

      const result = service.detectFramework(html, 'https://example.com');

      expect(result.type).toBe(FrameworkType.WORDPRESS);
      expect(result.confidence).toBeGreaterThan(0.8);
      expect(result.version).toBe('6.0');
      expect(result.features).toContain('custom-theme');
    });

    it('should detect React correctly', () => {
      const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>React App</title>
          </head>
          <body>
            <div id="root" data-reactroot></div>
            <script>
              ReactDOM.render(<App />, document.getElementById('root'));
            </script>
          </body>
        </html>
      `;

      const result = service.detectFramework(html, 'https://example.com');

      expect(result.type).toBe(FrameworkType.REACT);
      expect(result.confidence).toBeGreaterThan(0.7);
      expect(result.features).toContain('class-components');
    });

    it('should detect Shopify correctly', () => {
      const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <link rel="stylesheet" href="/assets/theme.css">
            <script src="/assets/cart.js"></script>
          </head>
          <body>
            <div class="shopify-section"></div>
          </body>
        </html>
      `;

      const result = service.detectFramework(html, 'https://myshopify.com');

      expect(result.type).toBe(FrameworkType.SHOPIFY);
      expect(result.confidence).toBeGreaterThan(0.7);
      expect(result.features).toContain('shopping-cart');
    });

    it('should return unknown for unrecognized frameworks', () => {
      const html = `
        <div>Hello World</div>
        <p>This is just plain HTML without any framework indicators</p>
      `;

      const result = service.detectFramework(html, 'https://example.com');

      expect(result.type).toBe(FrameworkType.UNKNOWN);
      expect(result.confidence).toBeLessThan(0.6);
    });
  });

  describe('getFrameworkRules', () => {
    it('should return Next.js specific rules', () => {
      const rules = service.getFrameworkRules(FrameworkType.NEXT_JS);

      expect(rules.skipPatterns).toContain('/_next/');
      expect(rules.skipPatterns).toContain('/__next/');
      expect(rules.rewritePatterns).toHaveLength(2);
    });

    it('should return WordPress specific rules', () => {
      const rules = service.getFrameworkRules(FrameworkType.WORDPRESS);

      expect(rules.skipPatterns).toContain('/wp-admin/');
      expect(rules.skipPatterns).toContain('/wp-includes/');
      expect(rules.rewritePatterns).toHaveLength(2);
    });

    it('should return base rules for unknown frameworks', () => {
      const rules = service.getFrameworkRules(FrameworkType.UNKNOWN);

      expect(rules.cssSelectors).toContain('link[rel="stylesheet"]');
      expect(rules.jsSelectors).toContain('script[src]');
      expect(rules.rewritePatterns).toHaveLength(0);
    });
  });

  describe('getFrameworkName', () => {
    it('should return correct framework names', () => {
      expect(service.getFrameworkName(FrameworkType.NEXT_JS)).toBe('Next.js');
      expect(service.getFrameworkName(FrameworkType.WORDPRESS)).toBe(
        'WordPress',
      );
      expect(service.getFrameworkName(FrameworkType.REACT)).toBe('React');
      expect(service.getFrameworkName(FrameworkType.SHOPIFY)).toBe('Shopify');
      expect(service.getFrameworkName(FrameworkType.UNKNOWN)).toBe(
        'Unknown Framework',
      );
    });
  });
});
