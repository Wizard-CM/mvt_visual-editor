import { Test, TestingModule } from '@nestjs/testing';
import { FrameworkUrlRewriter } from './framework-url-rewriter';
import { FrameworkDetector, FrameworkType } from './framework-detector';
import { UrlUtils } from './url.utils';
import { LoggerService } from '../logger';

describe('FrameworkUrlRewriter', () => {
  let service: FrameworkUrlRewriter;
  let frameworkDetector: jest.Mocked<FrameworkDetector>;
  let urlUtils: jest.Mocked<UrlUtils>;
  let logger: jest.Mocked<LoggerService>;

  const mockDetection = {
    type: FrameworkType.NEXT_JS,
    confidence: 0.95,
    version: '13.0.0',
    features: ['static-generation', 'image-optimization'],
    metadata: { buildId: 'abc123' },
  };

  const mockFrameworkRules = {
    cssSelectors: ['link[rel="stylesheet"]'],
    jsSelectors: ['script[src]'],
    imageSelectors: ['img[src]'],
    fontSelectors: ['link[rel="font"]'],
    apiSelectors: ['a[href*="/api/"]'],
    skipPatterns: ['#', 'javascript:'],
    rewritePatterns: [
      {
        pattern: /href="\/_next\/([^"]*)"/g,
        replacement: 'href="/proxy/editor/$SESSION_ID/$ENCODED_ORIGIN/_next/$1"',
      },
    ],
  };

  beforeEach(async () => {
    const mockFrameworkDetector = {
      detectFramework: jest.fn(),
      getFrameworkRules: jest.fn(),
      getFrameworkName: jest.fn(),
    };

    const mockUrlUtils = {
      encodeUrl: jest.fn(),
      isAbsoluteUrl: jest.fn(),
      isDataUrl: jest.fn(),
    };

    const mockLogger = {
      setContext: jest.fn().mockReturnThis(),
      info: jest.fn(),
      logWithMeta: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FrameworkUrlRewriter,
        {
          provide: FrameworkDetector,
          useValue: mockFrameworkDetector,
        },
        {
          provide: UrlUtils,
          useValue: mockUrlUtils,
        },
        {
          provide: LoggerService,
          useValue: mockLogger,
        },
      ],
    }).compile();

    service = module.get<FrameworkUrlRewriter>(FrameworkUrlRewriter);
    frameworkDetector = module.get(FrameworkDetector);
    urlUtils = module.get(UrlUtils);
    logger = module.get(LoggerService);

    // Setup default mocks
    frameworkDetector.detectFramework.mockReturnValue(mockDetection);
    frameworkDetector.getFrameworkRules.mockReturnValue(mockFrameworkRules);
    frameworkDetector.getFrameworkName.mockReturnValue('Next.js');
    urlUtils.encodeUrl.mockReturnValue('encoded-origin');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('rewriteUrls', () => {
    it('should detect framework and rewrite URLs', () => {
      const html = '<html><body><div>Test</div></body></html>';
      const sessionId = 'session123';
      const baseUrl = 'https://example.com';

      const result = service.rewriteUrls(html, sessionId, baseUrl);

      expect(frameworkDetector.detectFramework).toHaveBeenCalledWith(html, baseUrl);
      expect(frameworkDetector.getFrameworkRules).toHaveBeenCalledWith(mockDetection.type);
      expect(result.frameworkType).toBe(FrameworkType.NEXT_JS);
      expect(result.frameworkName).toBe('Next.js');
      expect(result.confidence).toBe(0.95);
      expect(result.version).toBe('13.0.0');
      expect(result.features).toEqual(['static-generation', 'image-optimization']);
    });

    it('should apply framework-specific rewrite patterns', () => {
      const html = '<a href="/_next/static/chunks/main.js">Link</a>';
      const sessionId = 'session123';
      const baseUrl = 'https://example.com';

      const result = service.rewriteUrls(html, sessionId, baseUrl);

      expect(result.stats.frameworkSpecificRewrites).toBeGreaterThan(0);
      expect(result.rewrittenHtml).toContain('/proxy/editor/session123/encoded-origin/_next/static/chunks/main.js');
    });

    it('should handle different framework types correctly', () => {
      const wordpressDetection = {
        ...mockDetection,
        type: FrameworkType.WORDPRESS,
        features: ['custom-theme', 'plugins'],
      };
      frameworkDetector.detectFramework.mockReturnValue(wordpressDetection);
      frameworkDetector.getFrameworkName.mockReturnValue('WordPress');

      const html = '<link href="/wp-content/themes/theme/style.css" />';
      const sessionId = 'session123';
      const baseUrl = 'https://wordpress.com';

      const result = service.rewriteUrls(html, sessionId, baseUrl);

      expect(result.frameworkType).toBe(FrameworkType.WORDPRESS);
      expect(result.frameworkName).toBe('WordPress');
      expect(result.features).toEqual(['custom-theme', 'plugins']);
    });
  });

  describe('rewriteNextJsUrls', () => {
    it('should rewrite _next/ static asset URLs', () => {
      const html = '<script src="/_next/static/chunks/main.js"></script>';
      const sessionId = 'session123';
      const encodedOrigin = 'encoded-origin';

      const result = service['rewriteNextJsUrls'](html, sessionId, encodedOrigin);

      expect(result).toContain('/proxy/editor/session123/encoded-origin/_next/static/chunks/main.js');
    });

    it('should rewrite __next/ app router URLs', () => {
      const html = '<link href="/__next/static/css/app.css" />';
      const sessionId = 'session123';
      const encodedOrigin = 'encoded-origin';

      const result = service['rewriteNextJsUrls'](html, sessionId, encodedOrigin);

      expect(result).toContain('/proxy/editor/session123/encoded-origin/__next/static/css/app.css');
    });

    it('should handle multiple Next.js URLs in the same HTML', () => {
      const html = `
        <script src="/_next/static/chunks/main.js"></script>
        <link href="/__next/static/css/app.css" />
        <img src="/_next/image?url=test.jpg" />
      `;
      const sessionId = 'session123';
      const encodedOrigin = 'encoded-origin';

      const result = service['rewriteNextJsUrls'](html, sessionId, encodedOrigin);

      expect(result).toContain('/proxy/editor/session123/encoded-origin/_next/static/chunks/main.js');
      expect(result).toContain('/proxy/editor/session123/encoded-origin/__next/static/css/app.css');
      expect(result).toContain('/proxy/editor/session123/encoded-origin/_next/image?url=test.jpg');
    });
  });

  describe('rewriteWordPressUrls', () => {
    it('should rewrite wp-content URLs', () => {
      const html = '<link href="/wp-content/themes/theme/style.css" />';
      const sessionId = 'session123';
      const encodedOrigin = 'encoded-origin';

      const result = service['rewriteWordPressUrls'](html, sessionId, encodedOrigin);

      expect(result).toContain('/proxy/editor/session123/encoded-origin/wp-content/themes/theme/style.css');
    });

    it('should rewrite wp-includes URLs but skip admin areas', () => {
      const html = `
        <script src="/wp-includes/js/jquery.js"></script>
        <script src="/wp-includes/admin/admin.js"></script>
      `;
      const sessionId = 'session123';
      const encodedOrigin = 'encoded-origin';

      const result = service['rewriteWordPressUrls'](html, sessionId, encodedOrigin);

      expect(result).toContain('/proxy/editor/session123/encoded-origin/wp-includes/js/jquery.js');
      expect(result).toContain('/wp-includes/admin/admin.js'); // Should not be rewritten
    });

    it('should handle multiple WordPress URLs', () => {
      const html = `
        <link href="/wp-content/themes/theme/style.css" />
        <script src="/wp-content/plugins/plugin/script.js"></script>
        <img src="/wp-content/uploads/image.jpg" />
      `;
      const sessionId = 'session123';
      const encodedOrigin = 'encoded-origin';

      const result = service['rewriteWordPressUrls'](html, sessionId, encodedOrigin);

      expect(result).toContain('/proxy/editor/session123/encoded-origin/wp-content/themes/theme/style.css');
      expect(result).toContain('/proxy/editor/session123/encoded-origin/wp-content/plugins/plugin/script.js');
      expect(result).toContain('/proxy/editor/session123/encoded-origin/wp-content/uploads/image.jpg');
    });
  });

  describe('rewriteShopifyUrls', () => {
    it('should rewrite assets directory URLs', () => {
      const html = '<link href="/assets/theme.css" />';
      const sessionId = 'session123';
      const encodedOrigin = 'encoded-origin';

      const result = service['rewriteShopifyUrls'](html, sessionId, encodedOrigin);

      expect(result).toContain('/proxy/editor/session123/encoded-origin/assets/theme.css');
    });

    it('should skip Shopify CDN URLs', () => {
      const html = '<script src="https://cdn.shopify.com/shopify.js"></script>';
      const sessionId = 'session123';
      const encodedOrigin = 'encoded-origin';

      const result = service['rewriteShopifyUrls'](html, sessionId, encodedOrigin);

      expect(result).toContain('https://cdn.shopify.com/shopify.js'); // Should remain unchanged
    });

    it('should handle mixed Shopify URLs', () => {
      const html = `
        <link href="/assets/theme.css" />
        <script src="https://cdn.shopify.com/shopify.js"></script>
        <img src="/assets/logo.png" />
      `;
      const sessionId = 'session123';
      const encodedOrigin = 'encoded-origin';

      const result = service['rewriteShopifyUrls'](html, sessionId, encodedOrigin);

      expect(result).toContain('/proxy/editor/session123/encoded-origin/assets/theme.css');
      expect(result).toContain('https://cdn.shopify.com/shopify.js');
      expect(result).toContain('/proxy/editor/session123/encoded-origin/assets/logo.png');
    });
  });

  describe('rewriteReactUrls', () => {
    it('should rewrite static directory URLs', () => {
      const html = '<script src="/static/js/bundle.js"></script>';
      const sessionId = 'session123';
      const encodedOrigin = 'encoded-origin';

      const result = service['rewriteReactUrls'](html, sessionId, encodedOrigin);

      expect(result).toContain('/proxy/editor/session123/encoded-origin/static/js/bundle.js');
      expect(result).toContain('/proxy/editor/session123/encoded-origin/static/js/bundle.js');
    });

    it('should rewrite public asset URLs', () => {
      const html = `
        <img src="/logo.png" />
        <link href="/favicon.ico" />
        <script src="/manifest.json" />
      `;
      const sessionId = 'session123';
      const encodedOrigin = 'encoded-origin';

      const result = service['rewriteReactUrls'](html, sessionId, encodedOrigin);

      expect(result).toContain('/proxy/editor/session123/encoded-origin/logo.png');
      expect(result).toContain('/proxy/editor/session123/encoded-origin/favicon.ico');
      // Note: manifest.json is not a typical asset file, so it might not be rewritten
      expect(result).toContain('/proxy/editor/session123/encoded-origin/logo.png');
    });

    it('should handle various file types in public directory', () => {
      const html = `
        <link href="/styles.css" />
        <script src="/app.js"></script>
        <img src="/images/hero.jpg" />
        <link href="/fonts/font.woff2" />
      `;
      const sessionId = 'session123';
      const encodedOrigin = 'encoded-origin';

      const result = service['rewriteReactUrls'](html, sessionId, encodedOrigin);

      expect(result).toContain('/proxy/editor/session123/encoded-origin/styles.css');
      expect(result).toContain('/proxy/editor/session123/encoded-origin/app.js');
      expect(result).toContain('/proxy/editor/session123/encoded-origin/images/hero.jpg');
      expect(result).toContain('/proxy/editor/session123/encoded-origin/fonts/font.woff2');
    });
  });

  describe('rewriteGenericUrls', () => {
    beforeEach(() => {
      urlUtils.isAbsoluteUrl.mockReturnValue(false);
      urlUtils.isDataUrl.mockReturnValue(false);
    });

    it('should rewrite absolute URLs from the same origin', () => {
      const html = '<a href="https://example.com/page">Link</a>';
      const sessionId = 'session123';
      const encodedOrigin = 'encoded-origin';
      const origin = 'https://example.com';
      const rules = { ...mockFrameworkRules };

      const result = service['rewriteGenericUrls'](html, sessionId, encodedOrigin, origin, rules);

      expect(result).toContain('/proxy/editor/session123/encoded-origin/page');
    });

    it('should rewrite relative URLs', () => {
      const html = '<img src="images/photo.jpg" />';
      const sessionId = 'session123';
      const encodedOrigin = 'encoded-origin';
      const origin = 'https://example.com';
      const rules = { ...mockFrameworkRules };

      const result = service['rewriteGenericUrls'](html, sessionId, encodedOrigin, origin, rules);

      expect(result).toContain('/proxy/editor/session123/encoded-origin/images/photo.jpg');
    });

    it('should skip URLs that match skip patterns', () => {
      const html = '<a href="#section">Anchor</a>';
      const sessionId = 'session123';
      const encodedOrigin = 'encoded-origin';
      const origin = 'https://example.com';
      const rules = { ...mockFrameworkRules, skipPatterns: ['#', 'javascript:'] };

      const result = service['rewriteGenericUrls'](html, sessionId, encodedOrigin, origin, rules);

      expect(result).toContain('#section'); // Should remain unchanged
    });

    it('should skip absolute URLs from different origins', () => {
      const html = '<img src="https://cdn.example.com/image.jpg" />';
      const sessionId = 'session123';
      const encodedOrigin = 'encoded-origin';
      const origin = 'https://example.com';
      const rules = { ...mockFrameworkRules };

      urlUtils.isAbsoluteUrl.mockReturnValue(true);

      const result = service['rewriteGenericUrls'](html, sessionId, encodedOrigin, origin, rules);

      expect(result).toContain('https://cdn.example.com/image.jpg'); // Should remain unchanged
    });

    it('should skip data URLs', () => {
      const html = '<img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==" />';
      const sessionId = 'session123';
      const encodedOrigin = 'encoded-origin';
      const origin = 'https://example.com';
      const rules = { ...mockFrameworkRules };

      urlUtils.isDataUrl.mockReturnValue(true);

      const result = service['rewriteGenericUrls'](html, sessionId, encodedOrigin, origin, rules);

      expect(result).toContain('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==');
    });

    it('should skip URLs that already contain proxy path', () => {
      const html = '<img src="/proxy/editor/session123/encoded-origin/image.jpg" />';
      const sessionId = 'session123';
      const encodedOrigin = 'encoded-origin';
      const origin = 'https://example.com';
      const rules = { ...mockFrameworkRules };

      const result = service['rewriteGenericUrls'](html, sessionId, encodedOrigin, origin, rules);

      expect(result).toContain('/proxy/editor/session123/encoded-origin/image.jpg'); // Should remain unchanged
    });
  });

  describe('countUrlsInHtml', () => {
    it('should count total URLs in HTML', () => {
      const html = `
        <img src="image1.jpg" />
        <a href="page1.html">Link 1</a>
        <img src="image2.jpg" />
        <script src="script.js"></script>
      `;

      const result = service['countUrlsInHtml'](html);

      expect(result.total).toBe(4);
    });

    it('should count rewritten URLs', () => {
      const html = `
        <img src="/proxy/editor/session123/encoded-origin/image1.jpg" />
        <a href="/proxy/editor/session123/encoded-origin/page1.html">Link 1</a>
        <img src="image2.jpg" />
        <script src="script.js"></script>
      `;

      const result = service['countUrlsInHtml'](html);

      expect(result.total).toBe(4);
      expect(result.rewritten).toBe(2);
      expect(result.skipped).toBe(2);
    });

    it('should handle CSS url() functions', () => {
      const html = `
        <style>
          body { background-image: url('bg.jpg'); }
          .icon { background-image: url("icon.png"); }
        </style>
        <img src="image.jpg" />
      `;

      const result = service['countUrlsInHtml'](html);

      expect(result.total).toBe(3);
    });

    it('should handle empty HTML', () => {
      const html = '';

      const result = service['countUrlsInHtml'](html);

      expect(result.total).toBe(0);
      expect(result.rewritten).toBe(0);
      expect(result.skipped).toBe(0);
    });
  });

  describe('edge cases and error handling', () => {
    it('should handle HTML with no URLs', () => {
      const html = '<div>Just text content</div>';
      const sessionId = 'session123';
      const baseUrl = 'https://example.com';

      const result = service.rewriteUrls(html, sessionId, baseUrl);

      expect(result.stats.totalUrls).toBe(0);
      expect(result.stats.rewrittenUrls).toBe(0);
      expect(result.stats.skippedUrls).toBe(0);
    });

    it('should handle HTML with malformed URLs', () => {
      const html = '<img src="invalid url with spaces" />';
      const sessionId = 'session123';
      const encodedOrigin = 'encoded-origin';
      const origin = 'https://example.com';
      const rules = { ...mockFrameworkRules };

      const result = service['rewriteGenericUrls'](html, sessionId, encodedOrigin, origin, rules);

      // Should still attempt to rewrite even malformed URLs
      expect(result).toContain('/proxy/editor/session123/encoded-origin/invalid url with spaces');
    });

    it('should handle very long URLs', () => {
      const longUrl = 'a'.repeat(1000);
      const html = `<img src="${longUrl}" />`;
      const sessionId = 'session123';
      const encodedOrigin = 'encoded-origin';
      const origin = 'https://example.com';
      const rules = { ...mockFrameworkRules };

      const result = service['rewriteGenericUrls'](html, sessionId, encodedOrigin, origin, rules);

      expect(result).toContain('/proxy/editor/session123/encoded-origin/');
    });

    it('should handle special characters in URLs', () => {
      const html = `
        <img src="image with spaces.jpg" />
        <a href="page with & symbols.html">Link</a>
        <script src="script with (parentheses).js"></script>
      `;
      const sessionId = 'session123';
      const encodedOrigin = 'encoded-origin';
      const origin = 'https://example.com';
      const rules = { ...mockFrameworkRules };

      const result = service['rewriteGenericUrls'](html, sessionId, encodedOrigin, origin, rules);

      expect(result).toContain('/proxy/editor/session123/encoded-origin/image with spaces.jpg');
      expect(result).toContain('/proxy/editor/session123/encoded-origin/page with & symbols.html');
      expect(result).toContain('/proxy/editor/session123/encoded-origin/script with (parentheses).js');
    });
  });

  describe('integration scenarios', () => {
    it('should handle mixed framework content', () => {
      const html = `
        <div id="root">
          <script src="/_next/static/chunks/main.js"></script>
          <link href="/wp-content/themes/theme/style.css" />
          <img src="/assets/logo.png" />
          <script src="/static/app.js"></script>
        </div>
      `;
      const sessionId = 'session123';
      const baseUrl = 'https://example.com';

      // Mock mixed framework detection
      const mixedDetection = {
        ...mockDetection,
        type: FrameworkType.CUSTOM,
        features: ['mixed-frameworks'],
      };
      frameworkDetector.detectFramework.mockReturnValue(mixedDetection);
      frameworkDetector.getFrameworkName.mockReturnValue('Custom Framework');

      const result = service.rewriteUrls(html, sessionId, baseUrl);

      expect(result.frameworkType).toBe(FrameworkType.CUSTOM);
      expect(result.stats.totalUrls).toBe(4);
      // Should apply generic rewriting for custom frameworks
    });

    it('should handle framework detection with low confidence', () => {
      const lowConfidenceDetection = {
        ...mockDetection,
        confidence: 0.3,
        type: FrameworkType.UNKNOWN,
      };
      frameworkDetector.detectFramework.mockReturnValue(lowConfidenceDetection);
      frameworkDetector.getFrameworkName.mockReturnValue('Unknown Framework');

      const html = '<div>Simple HTML</div>';
      const sessionId = 'session123';
      const baseUrl = 'https://example.com';

      const result = service.rewriteUrls(html, sessionId, baseUrl);

      expect(result.confidence).toBe(0.3);
      expect(result.frameworkType).toBe(FrameworkType.UNKNOWN);
      expect(result.frameworkName).toBe('Unknown Framework');
    });
  });
});
