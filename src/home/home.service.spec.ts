import { Test, TestingModule } from '@nestjs/testing';
import { HomeService } from './home.service';

describe('HomeService', () => {
  let service: HomeService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [HomeService],
    }).compile();

    service = module.get<HomeService>(HomeService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getMainPage', () => {
    it('should return HTML content', () => {
      const result = service.getMainPage();

      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });

    it('should return valid HTML structure', () => {
      const result = service.getMainPage();

      // Check for HTML document structure
      expect(result).toContain('<!DOCTYPE html>');
      expect(result).toContain('<html');
      expect(result).toContain('</html>');
      expect(result).toContain('<head>');
      expect(result).toContain('</head>');
      expect(result).toContain('<body>');
      expect(result).toContain('</body>');
    });

    it('should contain the correct title', () => {
      const result = service.getMainPage();

      expect(result).toContain('<title>VWO Proxy - Visual Editor</title>');
    });

    it('should contain the form with correct action', () => {
      const result = service.getMainPage();

      expect(result).toContain('<form method="POST" action="/proxy/launch">');
    });

    it('should contain URL input field', () => {
      const result = service.getMainPage();

      expect(result).toContain('<input');
      expect(result).toContain('type="url"');
      expect(result).toContain('name="url"');
      expect(result).toContain('placeholder="https://example.com"');
      expect(result).toContain('required');
    });

    it('should contain submit button', () => {
      const result = service.getMainPage();

      expect(result).toContain('<button type="submit"');
      expect(result).toContain('Launch Visual Editor');
    });

    it('should contain example links', () => {
      const result = service.getMainPage();

      expect(result).toContain('Try these examples:');
      expect(result).toContain('mvtlab.io');
      expect(result).toContain('example.com');
      expect(result).toContain('httpbin.org');
      expect(result).toContain('github.com');
    });

    it('should contain JavaScript function', () => {
      const result = service.getMainPage();

      expect(result).toContain('<script>');
      expect(result).toContain('function setUrl(url)');
      expect(result).toContain("document.getElementById('url').value = url;");
      expect(result).toContain('</script>');
    });

    it('should contain CSS styles', () => {
      const result = service.getMainPage();

      expect(result).toContain('<style>');
      expect(result).toContain('</style>');
      expect(result).toContain('background: linear-gradient');
      expect(result).toContain('border-radius: 16px');
      expect(result).toContain('box-shadow');
    });

    it('should have default URL value', () => {
      const result = service.getMainPage();

      expect(result).toContain('value="https://mvtlab.io"');
    });

    it('should contain proper meta tags', () => {
      const result = service.getMainPage();

      expect(result).toContain('<meta charset="UTF-8">');
      expect(result).toContain('<meta name="viewport"');
      expect(result).toContain('width=device-width, initial-scale=1.0');
    });

    it('should return consistent HTML on multiple calls', () => {
      const firstCall = service.getMainPage();
      const secondCall = service.getMainPage();

      expect(firstCall).toBe(secondCall);
    });
  });
});
