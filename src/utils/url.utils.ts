import { Injectable } from '@nestjs/common';

/**
 * Interface for URL validation result
 */
export interface UrlValidationResult {
  isValid: boolean;
  reason?: string;
  protocol?: string;
  hostname?: string;
  pathname?: string;
}

/**
 * Interface for URL encoding options
 */
export interface UrlEncodingOptions {
  removePadding?: boolean;
  urlSafe?: boolean;
  encoding?: BufferEncoding;
}

/**
 * Utility class for URL operations
 * Handles URL encoding/decoding, validation, and manipulation
 */
@Injectable()
export class UrlUtils {
  /**
   * Encodes a URL to a URL-safe base64 string
   * Replaces problematic characters with URL-safe alternatives
   * @param {string} url - The URL to encode
   * @param {UrlEncodingOptions} options - Encoding options
   * @returns {string} URL-safe base64 encoded string
   * @example
   * const encoded = urlUtils.encodeUrl('https://example.com/path');
   * // Returns: "aHR0cHM6Ly9leGFtcGxlLmNvbS9wYXRo"
   */
  encodeUrl(url: string, options: UrlEncodingOptions = {}): string {
    const {
      removePadding = true,
      urlSafe = true,
      encoding = 'utf-8',
    } = options;

    let encoded = Buffer.from(url, encoding).toString('base64');

    if (urlSafe) {
      encoded = encoded.replace(/\+/g, '-').replace(/\//g, '_');
    }

    if (removePadding) {
      encoded = encoded.replace(/=/g, '');
    }

    return encoded;
  }

  /**
   * Decodes a URL-safe base64 string back to the original URL
   * Handles padding restoration for proper base64 decoding
   * @param {string} encoded - The encoded string to decode
   * @param {string} encoding - Output encoding (default: utf-8)
   * @returns {string} The decoded original URL
   * @example
   * const decoded = urlUtils.decodeUrl('aHR0cHM6Ly9leGFtcGxlLmNvbS9wYXRo');
   * // Returns: "https://example.com/path"
   */
  decodeUrl(encoded: string, encoding: BufferEncoding = 'utf-8'): string {
    if (!encoded || typeof encoded !== 'string') {
      throw new Error('Encoded string must be a non-empty string');
    }

    // Add padding if needed for proper base64 decoding
    let padded = encoded.replace(/-/g, '+').replace(/_/g, '/');
    const padding = 4 - (padded.length % 4);

    if (padding !== 4) {
      padded += '='.repeat(padding);
    }

    try {
      return Buffer.from(padded, 'base64').toString(encoding);
    } catch (error) {
      throw new Error(`Failed to decode URL: ${error.message}`);
    }
  }

  /**
   * Validates if a URL is safe to proxy
   * Checks for valid protocols and basic security concerns
   * @param {string} url - The URL to validate
   * @returns {UrlValidationResult} Detailed validation result
   * @example
   * const result = urlUtils.isValidProxyUrl('https://example.com');
   * if (result.isValid) {
   *   console.log('Safe to proxy:', result.hostname);
   * } else {
   *   console.log('Not safe:', result.reason);
   * }
   */
  isValidProxyUrl(url: string): UrlValidationResult {
    try {
      const urlObj = new URL(url);

      // Check protocol
      const allowedProtocols = ['http:', 'https:'];
      if (!allowedProtocols.includes(urlObj.protocol)) {
        return {
          isValid: false,
          reason: `Protocol '${urlObj.protocol}' is not allowed. Only HTTP and HTTPS are supported.`,
          protocol: urlObj.protocol,
        };
      }

      // Check if hostname is valid
      if (!urlObj.hostname || urlObj.hostname.length === 0) {
        return {
          isValid: false,
          reason: 'URL must have a valid hostname',
        };
      }

      // Check for localhost/private IP addresses (security measure)
      if (this.isPrivateAddress(urlObj.hostname)) {
        return {
          isValid: false,
          reason:
            'Private/localhost addresses are not allowed for security reasons',
          hostname: urlObj.hostname,
        };
      }

      return {
        isValid: true,
        protocol: urlObj.protocol,
        hostname: urlObj.hostname,
        pathname: urlObj.pathname,
      };
    } catch (error) {
      return {
        isValid: false,
        reason: `Invalid URL format: ${error.message}`,
      };
    }
  }

  /**
   * Checks if a hostname is a private or localhost address
   * @param {string} hostname - The hostname to check
   * @returns {boolean} True if it's a private/localhost address
   * @private
   */
  private isPrivateAddress(hostname: string): boolean {
    const privatePatterns = [
      /^localhost$/i,
      /^127\./,
      /^10\./,
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
      /^192\.168\./,
      /^::1$/,
      /^fc00:/,
      /^fe80:/,
    ];

    return privatePatterns.some((pattern) => pattern.test(hostname));
  }

  /**
   * Creates a proxy URL for a given path and session
   * @param {string} sessionId - The session identifier
   * @param {string} origin - The original origin URL
   * @param {string} path - The path to proxy
   * @returns {string} The complete proxy URL
   * @example
   * const proxyUrl = urlUtils.createProxyUrl('abc123', 'https://example.com', '/api/data');
   * // Returns: "/proxy/editor/abc123/aHR0cHM6Ly9leGFtcGxlLmNvbQ/api/data"
   */
  createProxyUrl(sessionId: string, origin: string, path: string): string {
    if (!sessionId || !origin || !path) {
      throw new Error('Session ID, origin, and path are required');
    }

    const encodedOrigin = this.encodeUrl(origin);
    const cleanPath = path.startsWith('/') ? path : `/${path}`;

    return `/proxy/editor/${sessionId}/${encodedOrigin}${cleanPath}`;
  }

  /**
   * Normalizes a URL by ensuring it has proper protocol and format
   * @param {string} url - The URL to normalize
   * @returns {string} Normalized URL
   * @example
   * const normalized = urlUtils.normalizeUrl('example.com/path');
   * // Returns: "https://example.com/path"
   */
  normalizeUrl(url: string): string {
    if (!url) {
      throw new Error('URL cannot be empty');
    }

    // Add protocol if missing
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = `https://${url}`;
    }

    try {
      const urlObj = new URL(url);
      return urlObj.toString();
    } catch (error) {
      throw new Error(`Invalid URL format: ${error.message}`);
    }
  }

  /**
   * Extracts the domain from a URL
   * @param {string} url - The URL to extract domain from
   * @returns {string} The domain name
   * @example
   * const domain = urlUtils.extractDomain('https://sub.example.com/path?query=1');
   * // Returns: "sub.example.com"
   */
  extractDomain(url: string): string {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname;
    } catch (error) {
      throw new Error(`Invalid URL format: ${error.message}`);
    }
  }

  /**
   * Checks if two URLs have the same origin
   * @param {string} url1 - First URL
   * @param {string} url2 - Second URL
   * @returns {boolean} True if URLs have the same origin
   * @example
   * const sameOrigin = urlUtils.sameOrigin('https://example.com/page1', 'https://example.com/page2');
   * // Returns: true
   */
  sameOrigin(url1: string, url2: string): boolean {
    try {
      const obj1 = new URL(url1);
      const obj2 = new URL(url2);

      return obj1.origin === obj2.origin;
    } catch (error) {
      return false;
    }
  }

  /**
   * Safely joins URL parts together
   * @param {...string} parts - URL parts to join
   * @returns {string} Properly joined URL
   * @example
   * const url = urlUtils.joinUrl('https://example.com', 'api', 'users', '123');
   * // Returns: "https://example.com/api/users/123"
   */
  joinUrl(...parts: string[]): string {
    if (parts.length === 0) {
      throw new Error('At least one URL part is required');
    }

    return parts
      .map((part, index) => {
        if (index === 0) {
          return part.replace(/\/+$/, ''); // Remove trailing slashes from first part
        }
        return part.replace(/^\/+|\/+$/g, ''); // Remove leading/trailing slashes
      })
      .filter((part) => part.length > 0)
      .join('/');
  }

  /**
   * Checks if a URL is a data URL
   * @param {string} url - The URL to check
   * @returns {boolean} True if it's a data URL
   * @example
   * const isDataUrl = urlUtils.isDataUrl('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==');
   * // Returns: true
   */
  isDataUrl(url: string): boolean {
    return url && url.startsWith('data:');
  }

  /**
   * Checks if a URL is an absolute URL
   * @param {string} url - The URL to check
   * @returns {boolean} True if it's an absolute URL
   * @example
   * const isAbsolute = urlUtils.isAbsoluteUrl('https://example.com/path');
   * // Returns: true
   */
  isAbsoluteUrl(url: string): boolean {
    return (
      url &&
      (url.startsWith('http://') ||
        url.startsWith('https://') ||
        url.startsWith('//'))
    );
  }

  /**
   * Checks if a URL is a relative URL
   * @param {string} url - The URL to check
   * @returns {boolean} True if it's a relative URL
   * @example
   * const isRelative = urlUtils.isRelativeUrl('/api/users');
   * // Returns: true
   */
  isRelativeUrl(url: string): boolean {
    return url && !this.isAbsoluteUrl(url) && !this.isDataUrl(url);
  }
}
