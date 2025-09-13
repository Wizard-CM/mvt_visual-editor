import { Test, TestingModule } from '@nestjs/testing';
import { ProxyUtils, UrlRewriteResult } from './proxy.utils';
import { UrlUtils } from './url.utils';

// Mock UrlUtils
const mockUrlUtils = {
  encodeUrl: jest.fn(),
  createProxyUrl: jest.fn(),
  isAbsoluteUrl: jest.fn(),
  isDataUrl: jest.fn(),
};

describe('ProxyUtils', () => {
  let service: ProxyUtils;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProxyUtils,
        {
          provide: UrlUtils,
          useValue: mockUrlUtils,
        },
      ],
    }).compile();

    service = module.get<ProxyUtils>(ProxyUtils);

    // Reset mocks
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('rewriteUrls', () => {
    const sampleHtml = `
      <html>
        <head>
          <link href="/css/style.css" rel="stylesheet">
          <script src="/js/app.js"></script>
          <img src="https://example.com/image.jpg" alt="test">
        </head>
        <body>
          <a href="relative/link">Link</a>
          <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==">
          <div style="background-image: url('/images/bg.jpg')"></div>
        </body>
      </html>
    `;

    beforeEach(() => {
      mockUrlUtils.encodeUrl.mockReturnValue('aHR0cHM6Ly9leGFtcGxlLmNvbQ');
      mockUrlUtils.isAbsoluteUrl.mockImplementation(
        (url: string) => url.startsWith('http') || url.startsWith('//'),
      );
      mockUrlUtils.isDataUrl.mockImplementation((url: string) =>
        url.startsWith('data:'),
      );
    });

    it('should rewrite URLs and return statistics', () => {
      const sessionId = 'test123';
      const baseUrl = 'https://example.com';

      const result: UrlRewriteResult = service.rewriteUrls(
        sampleHtml,
        sessionId,
        baseUrl,
      );

      expect(result).toBeDefined();
      expect(result.rewrittenHtml).toBeDefined();
      expect(result.stats).toBeDefined();
      expect(result.stats.absoluteCount).toBeGreaterThanOrEqual(0);
      expect(result.stats.relativeCount).toBeGreaterThanOrEqual(0);
      expect(result.stats.totalProcessed).toBeGreaterThanOrEqual(0);
    });

    it('should rewrite absolute URLs correctly', () => {
      const html = '<img src="https://example.com/image.jpg">';
      const sessionId = 'test123';
      const baseUrl = 'https://example.com';

      const result = service.rewriteUrls(html, sessionId, baseUrl);

      expect(result.stats.absoluteCount).toBe(1);
      expect(result.rewrittenHtml).toContain('/proxy/editor/test123/');
      expect(result.rewrittenHtml).not.toContain(
        'https://example.com/image.jpg',
      );
    });

    it('should rewrite relative URLs correctly', () => {
      const html = '<link href="/css/style.css" rel="stylesheet">';
      const sessionId = 'test123';
      const baseUrl = 'https://example.com';

      const result = service.rewriteUrls(html, sessionId, baseUrl);

      expect(result.stats.relativeCount).toBe(1);
      expect(result.rewrittenHtml).toContain('/proxy/editor/test123/');
      expect(result.rewrittenHtml).toContain('/css/style.css');
    });

    it('should handle CSS url() functions', () => {
      const html =
        '<div style="background-image: url(\'/images/bg.jpg\')"></div>';
      const sessionId = 'test123';
      const baseUrl = 'https://example.com';

      const result = service.rewriteUrls(html, sessionId, baseUrl);

      expect(result.stats.relativeCount).toBe(1);
      expect(result.rewrittenHtml).toContain('/proxy/editor/test123/');
    });

    it('should skip data URLs', () => {
      const html =
        '<img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==">';
      const sessionId = 'test123';
      const baseUrl = 'https://example.com';

      const result = service.rewriteUrls(html, sessionId, baseUrl);

      expect(result.stats.relativeCount).toBe(0);
      expect(result.rewrittenHtml).toContain('data:image/png;base64');
    });

    it('should skip already proxied URLs', () => {
      const html = '<img src="/proxy/editor/abc123/encoded/image.jpg">';
      const sessionId = 'test123';
      const baseUrl = 'https://example.com';

      const result = service.rewriteUrls(html, sessionId, baseUrl);

      expect(result.stats.relativeCount).toBe(0);
      expect(result.rewrittenHtml).toContain(
        '/proxy/editor/abc123/encoded/image.jpg',
      );
    });

    it('should handle empty HTML content', () => {
      const sessionId = 'test123';
      const baseUrl = 'https://example.com';

      const result = service.rewriteUrls('', sessionId, baseUrl);

      expect(result.stats.totalProcessed).toBe(0);
      expect(result.rewrittenHtml).toBe('');
    });

    it('should handle HTML with no URLs', () => {
      const html = '<html><body><h1>Hello World</h1></body></html>';
      const sessionId = 'test123';
      const baseUrl = 'https://example.com';

      const result = service.rewriteUrls(html, sessionId, baseUrl);

      expect(result.stats.totalProcessed).toBe(0);
      expect(result.rewrittenHtml).toBe(html);
    });

    it('should handle complex HTML with mixed URL types', () => {
      const complexHtml = `
        <html>
          <head>
            <link href="/css/style.css" rel="stylesheet">
            <script src="https://cdn.example.com/lib.js"></script>
            <meta property="og:image" content="https://example.com/og-image.jpg">
          </head>
          <body>
            <img src="relative/image.jpg" alt="test">
            <a href="https://external.com">External</a>
            <div style="background: url('/bg.jpg')"></div>
            <iframe src="data:text/html,<html></html>"></iframe>
          </body>
        </html>
      `;

      const sessionId = 'test123';
      const baseUrl = 'https://example.com';

      const result = service.rewriteUrls(complexHtml, sessionId, baseUrl);

      expect(result.stats.totalProcessed).toBeGreaterThan(0);
      expect(result.rewrittenHtml).toContain('/proxy/editor/test123/');
      // External URLs should not be rewritten
      expect(result.rewrittenHtml).toContain('https://external.com');
      // Data URLs should not be rewritten
      expect(result.rewrittenHtml).toContain('data:text/html');
    });
  });

  describe('createProxyUrl', () => {
    it('should delegate to UrlUtils', () => {
      const sessionId = 'abc123';
      const origin = 'https://example.com';
      const path = '/api/data';
      const expectedUrl = '/proxy/editor/abc123/encoded/api/data';

      mockUrlUtils.createProxyUrl.mockReturnValue(expectedUrl);

      const result = service.createProxyUrl(sessionId, origin, path);

      expect(mockUrlUtils.createProxyUrl).toHaveBeenCalledWith(
        sessionId,
        origin,
        path,
      );
      expect(result).toBe(expectedUrl);
    });
  });

  describe('extractUrls', () => {
    it('should extract URLs from HTML content', () => {
      const html = `
        <img src="/image.jpg">
        <a href="https://example.com">Link</a>
        <link href="/css/style.css">
      `;

      const urls = service.extractUrls(html);

      expect(urls).toContain('/image.jpg');
      expect(urls).toContain('https://example.com');
      expect(urls).toContain('/css/style.css');
    });

    it('should not duplicate URLs', () => {
      const html = `
        <img src="/image.jpg">
        <img src="/image.jpg">
        <a href="/image.jpg">Link</a>
      `;

      const urls = service.extractUrls(html);

      expect(urls).toHaveLength(1);
      expect(urls).toContain('/image.jpg');
    });

    it('should handle empty HTML', () => {
      const urls = service.extractUrls('');

      expect(urls).toEqual([]);
    });
  });

  describe('countUrlsByType', () => {
    it('should count URLs by type correctly', () => {
      const html = `
        <img src="/relative.jpg">
        <img src="https://absolute.com/image.jpg">
        <img src="data:image/png;base64,abc">
      `;

      // Mock the URL utility methods
      mockUrlUtils.isDataUrl.mockImplementation((url: string) =>
        url.startsWith('data:'),
      );
      mockUrlUtils.isAbsoluteUrl.mockImplementation((url: string) =>
        url.startsWith('http'),
      );

      const counts = service.countUrlsByType(html);

      expect(counts.relative).toBe(1);
      expect(counts.absolute).toBe(1);
      expect(counts.data).toBe(1);
    });

    it('should return zero counts for HTML with no URLs', () => {
      const html = '<html><body><h1>No URLs</h1></body></html>';

      const counts = service.countUrlsByType(html);

      expect(counts.relative).toBe(0);
      expect(counts.absolute).toBe(0);
      expect(counts.data).toBe(0);
    });
  });

  describe('edge cases and error handling', () => {
    it('should handle URLs with special regex characters', () => {
      const html = '<img src="https://example.com/path[with]special{chars}">';
      const sessionId = 'test123';
      const baseUrl = 'https://example.com';

      const result = service.rewriteUrls(html, sessionId, baseUrl);

      expect(result.stats.absoluteCount).toBe(1);
      expect(result.rewrittenHtml).toContain('/proxy/editor/test123/');
    });

    it('should handle very long URLs', () => {
      const longUrl = 'https://example.com/' + 'a'.repeat(1000);
      const html = `<img src="${longUrl}">`;
      const sessionId = 'test123';
      const baseUrl = 'https://example.com';

      const result = service.rewriteUrls(html, sessionId, baseUrl);

      expect(result.stats.absoluteCount).toBe(1);
      expect(result.rewrittenHtml).toContain('/proxy/editor/test123/');
    });

    it('should handle malformed HTML gracefully', () => {
      const malformedHtml = '<img src="/image.jpg"><div>Unclosed tag';
      const sessionId = 'test123';
      const baseUrl = 'https://example.com';

      const result = service.rewriteUrls(malformedHtml, sessionId, baseUrl);

      expect(result.stats.totalProcessed).toBeGreaterThanOrEqual(0);
      expect(result.rewrittenHtml).toBeDefined();
    });
  });
});
