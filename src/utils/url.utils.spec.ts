import { Test, TestingModule } from '@nestjs/testing';
import { UrlUtils } from './url.utils';

describe('UrlUtils', () => {
  let service: UrlUtils;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UrlUtils],
    }).compile();

    service = module.get<UrlUtils>(UrlUtils);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('encodeUrl', () => {
    it('should encode a simple URL correctly', () => {
      const url = 'https://example.com';
      const encoded = service.encodeUrl(url);

      expect(encoded).toBeDefined();
      expect(encoded).not.toContain('+');
      expect(encoded).not.toContain('/');
      expect(encoded).not.toContain('=');
    });

    it('should encode URLs with special characters', () => {
      const url = 'https://example.com/path with spaces/and+special/chars';
      const encoded = service.encodeUrl(url);

      expect(encoded).toBeDefined();
      expect(encoded).not.toContain('+');
      expect(encoded).not.toContain('/');
      expect(encoded).not.toContain('=');
    });

    it('should produce consistent results for the same input', () => {
      const url = 'https://example.com/test';
      const encoded1 = service.encodeUrl(url);
      const encoded2 = service.encodeUrl(url);

      expect(encoded1).toBe(encoded2);
    });

    it('should handle custom encoding options', () => {
      // Test default behavior (URL-safe, no padding)
      const url = 'https://example.com/test';
      const defaultEncoded = service.encodeUrl(url);
      expect(defaultEncoded).not.toContain('=');
      expect(defaultEncoded).not.toContain('+');
      expect(defaultEncoded).not.toContain('/');

      // Test with a URL that will have padding
      const urlWithPadding = 'https://example.com';
      const encodedWithPadding = service.encodeUrl(urlWithPadding, {
        removePadding: false,
        urlSafe: false,
      });
      expect(encodedWithPadding).toContain('=');
    });
  });

  describe('decodeUrl', () => {
    it('should decode an encoded URL back to original', () => {
      const originalUrl = 'https://example.com/path';
      const encoded = service.encodeUrl(originalUrl);
      const decoded = service.decodeUrl(encoded);

      expect(decoded).toBe(originalUrl);
    });

    it('should handle URLs with special characters', () => {
      const originalUrl =
        'https://example.com/path with spaces/and+special/chars';
      const encoded = service.encodeUrl(originalUrl);
      const decoded = service.decodeUrl(encoded);

      expect(decoded).toBe(originalUrl);
    });

    it('should handle already URL-safe encoded strings', () => {
      const encoded = 'aHR0cHM6Ly9leGFtcGxlLmNvbS90ZXN0';
      const decoded = service.decodeUrl(encoded);

      expect(decoded).toBe('https://example.com/test');
    });

    it('should throw error for invalid input', () => {
      expect(() => service.decodeUrl('')).toThrow(
        'Encoded string must be a non-empty string',
      );
      expect(() => service.decodeUrl(null as any)).toThrow(
        'Encoded string must be a non-empty string',
      );
    });
  });

  describe('isValidProxyUrl', () => {
    it('should return true for valid HTTP URLs', () => {
      const result1 = service.isValidProxyUrl('http://example.com');
      const result2 = service.isValidProxyUrl('https://example.com');
      const result3 = service.isValidProxyUrl(
        'https://sub.example.com/path?query=value',
      );

      expect(result1.isValid).toBe(true);
      expect(result2.isValid).toBe(true);
      expect(result3.isValid).toBe(true);
    });

    it('should return false for invalid protocols', () => {
      const result1 = service.isValidProxyUrl('ftp://example.com');
      const result2 = service.isValidProxyUrl('file:///path/to/file');

      expect(result1.isValid).toBe(false);
      expect(result1.reason).toContain("Protocol 'ftp:' is not allowed");
      expect(result2.isValid).toBe(false);
    });

    it('should return false for private/localhost addresses', () => {
      const result1 = service.isValidProxyUrl('http://localhost');
      const result2 = service.isValidProxyUrl('http://127.0.0.1');
      const result3 = service.isValidProxyUrl('http://192.168.1.1');

      expect(result1.isValid).toBe(false);
      expect(result1.reason).toContain(
        'Private/localhost addresses are not allowed',
      );
      expect(result2.isValid).toBe(false);
      expect(result3.isValid).toBe(false);
    });

    it('should return false for invalid URLs', () => {
      const result = service.isValidProxyUrl('invalid-url');

      expect(result.isValid).toBe(false);
      expect(result.reason).toContain('Invalid URL format');
    });

    it('should return detailed validation information', () => {
      const result = service.isValidProxyUrl('https://example.com/path');

      expect(result.isValid).toBe(true);
      expect(result.protocol).toBe('https:');
      expect(result.hostname).toBe('example.com');
      expect(result.pathname).toBe('/path');
    });
  });

  describe('createProxyUrl', () => {
    it('should create a valid proxy URL for absolute paths', () => {
      const sessionId = 'abc123';
      const origin = 'https://example.com';
      const path = '/api/data';

      const proxyUrl = service.createProxyUrl(sessionId, origin, path);

      expect(proxyUrl).toMatch(
        /^\/proxy\/editor\/abc123\/[a-zA-Z0-9_-]+\/api\/data$/,
      );
    });

    it('should create a valid proxy URL for relative paths', () => {
      const sessionId = 'abc123';
      const origin = 'https://example.com';
      const path = 'relative/path';

      const proxyUrl = service.createProxyUrl(sessionId, origin, path);

      expect(proxyUrl).toMatch(
        /^\/proxy\/editor\/abc123\/[a-zA-Z0-9_-]+\/relative\/path$/,
      );
    });

    it('should handle paths without leading slash', () => {
      const sessionId = 'abc123';
      const origin = 'https://example.com';
      const path = 'noleadingslash';

      const proxyUrl = service.createProxyUrl(sessionId, origin, path);

      expect(proxyUrl).toMatch(
        /^\/proxy\/editor\/abc123\/[a-zA-Z0-9_-]+\/noleadingslash$/,
      );
    });

    it('should throw error for missing parameters', () => {
      expect(() =>
        service.createProxyUrl('', 'https://example.com', '/path'),
      ).toThrow('Session ID, origin, and path are required');
      expect(() => service.createProxyUrl('abc123', '', '/path')).toThrow(
        'Session ID, origin, and path are required',
      );
      expect(() =>
        service.createProxyUrl('abc123', 'https://example.com', ''),
      ).toThrow('Session ID, origin, and path are required');
    });
  });

  describe('normalizeUrl', () => {
    it('should add protocol if missing', () => {
      const normalized = service.normalizeUrl('example.com/path');

      expect(normalized).toBe('https://example.com/path');
    });

    it('should not change URLs with existing protocol', () => {
      const normalized = service.normalizeUrl('https://example.com/path');

      expect(normalized).toBe('https://example.com/path');
    });

    it('should throw error for empty URL', () => {
      expect(() => service.normalizeUrl('')).toThrow('URL cannot be empty');
    });

    it('should handle invalid URL format', () => {
      expect(() => service.normalizeUrl('invalid:url:format')).toThrow(
        'Invalid URL format',
      );
    });
  });

  describe('extractDomain', () => {
    it('should extract domain from URL', () => {
      const domain = service.extractDomain(
        'https://sub.example.com/path?query=1',
      );

      expect(domain).toBe('sub.example.com');
    });

    it('should throw error for invalid URL', () => {
      expect(() => service.extractDomain('invalid-url')).toThrow(
        'Invalid URL format',
      );
    });
  });

  describe('sameOrigin', () => {
    it('should return true for same origin URLs', () => {
      const result = service.sameOrigin(
        'https://example.com/page1',
        'https://example.com/page2',
      );

      expect(result).toBe(true);
    });

    it('should return false for different origins', () => {
      const result = service.sameOrigin(
        'https://example.com/page1',
        'https://other.com/page2',
      );

      expect(result).toBe(false);
    });

    it('should return false for invalid URLs', () => {
      const result = service.sameOrigin(
        'invalid-url',
        'https://example.com/page',
      );

      expect(result).toBe(false);
    });
  });

  describe('joinUrl', () => {
    it('should join URL parts correctly', () => {
      const url = service.joinUrl('https://example.com', 'api', 'users', '123');

      expect(url).toBe('https://example.com/api/users/123');
    });

    it('should handle trailing slashes', () => {
      const url = service.joinUrl('https://example.com/', '/api/', '/users/');

      expect(url).toBe('https://example.com/api/users');
    });

    it('should throw error for empty parts', () => {
      expect(() => service.joinUrl()).toThrow(
        'At least one URL part is required',
      );
    });
  });

  describe('isDataUrl', () => {
    it('should identify data URLs', () => {
      const dataUrl =
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';

      expect(service.isDataUrl(dataUrl)).toBe(true);
      expect(service.isDataUrl('https://example.com')).toBe(false);
      expect(service.isDataUrl('')).toBe('');
    });
  });

  describe('isAbsoluteUrl', () => {
    it('should identify absolute URLs', () => {
      expect(service.isAbsoluteUrl('https://example.com')).toBe(true);
      expect(service.isAbsoluteUrl('http://example.com')).toBe(true);
      expect(service.isAbsoluteUrl('//example.com')).toBe(true);
      expect(service.isAbsoluteUrl('/relative/path')).toBe(false);
      expect(service.isAbsoluteUrl('')).toBe('');
    });
  });

  describe('isRelativeUrl', () => {
    it('should identify relative URLs', () => {
      expect(service.isRelativeUrl('/api/users')).toBe(true);
      expect(service.isRelativeUrl('relative/path')).toBe(true);
      expect(service.isRelativeUrl('https://example.com')).toBe(false);
      expect(service.isRelativeUrl('data:image/png;base64,abc')).toBe(false);
      expect(service.isRelativeUrl('')).toBe('');
    });
  });
});
