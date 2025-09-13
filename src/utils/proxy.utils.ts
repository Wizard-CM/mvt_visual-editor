import { Injectable } from '@nestjs/common';
import { UrlUtils } from './url.utils';

/**
 * Interface for URL rewrite statistics
 */
export interface UrlRewriteStats {
  absoluteCount: number;
  relativeCount: number;
  totalProcessed: number;
}

/**
 * Interface for URL rewrite result
 */
export interface UrlRewriteResult {
  rewrittenHtml: string;
  stats: UrlRewriteStats;
}

/**
 * Interface for URL processing context
 */
export interface UrlProcessingContext {
  sessionId: string;
  baseUrl: string;
  origin: string;
  encodedOrigin: string;
}

/**
 * Utility class for proxy server HTML processing operations
 * Handles HTML URL rewriting for proxy functionality
 */
@Injectable()
export class ProxyUtils {
  constructor(private readonly urlUtils: UrlUtils) {}

  /**
   * Creates a URL processing context for rewriting operations
   * @param {string} sessionId - The session identifier
   * @param {string} baseUrl - The base URL being proxied
   * @returns {UrlProcessingContext} Processing context with encoded origin
   * @private
   */
  private createProcessingContext(
    sessionId: string,
    baseUrl: string,
  ): UrlProcessingContext {
    const baseUrlObj = new URL(baseUrl);
    const origin = baseUrlObj.origin;
    const encodedOrigin = this.urlUtils.encodeUrl(origin);

    return {
      sessionId,
      baseUrl,
      origin,
      encodedOrigin,
    };
  }

  /**
   * Rewrites absolute URLs in HTML content to go through the proxy
   * @param {string} html - The HTML content to process
   * @param {string} origin - The original origin URL
   * @param {string} sessionId - The session identifier
   * @param {string} encodedOrigin - The encoded origin for proxy URLs
   * @returns {string} HTML with rewritten absolute URLs
   * @private
   */
  private rewriteAbsoluteUrls(
    html: string,
    origin: string,
    sessionId: string,
    encodedOrigin: string,
  ): { rewritten: string; count: number } {
    // Escape special regex characters in the origin
    const escapedOrigin = origin.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const absoluteUrlRegex = new RegExp(`"(${escapedOrigin}[^"]*)"`, 'g');

    let count = 0;
    const rewritten = html.replace(absoluteUrlRegex, (match, url) => {
      const path = url.replace(origin, '');
      const proxyUrl = `/proxy/editor/${sessionId}/${encodedOrigin}${path}`;

      console.log('🔗 [ABSOLUTE URL]', {
        before: url,
        after: proxyUrl,
      });
      count++;

      return `"${proxyUrl}"`;
    });

    return { rewritten, count };
  }

  /**
   * Rewrites relative URLs in HTML content to go through the proxy
   * @param {string} html - The HTML content to process
   * @param {string} sessionId - The session identifier
   * @param {string} encodedOrigin - The encoded origin for proxy URLs
   * @returns {string} HTML with rewritten relative URLs
   * @private
   */
  private rewriteRelativeUrls(
    html: string,
    sessionId: string,
    encodedOrigin: string,
  ): { rewritten: string; count: number } {
    // Patterns for finding URLs in various HTML attributes and CSS
    const relativeUrlPatterns = [
      /(?:src|href|srcset|action|data-src|data-href)="([^"]*(?:\/[^"]*)*)"/g,
      /(?:src|href|srcset|action|data-src|data-href)='([^']*(?:\/[^']*)*)'/g,
      /url\(["']?([^"')]*(?:\/[^"')]*)*)["']?\)/g, // CSS url() function
    ];

    let count = 0;
    let rewritten = html;

    relativeUrlPatterns.forEach((pattern, index) => {
      rewritten = rewritten.replace(pattern, (match, url) => {
        // Skip absolute URLs, data URLs, anchors, and already proxied URLs
        if (
          this.urlUtils.isAbsoluteUrl(url) ||
          this.urlUtils.isDataUrl(url) ||
          url.startsWith('#') ||
          url.includes('/proxy/editor/')
        ) {
          return match;
        }

        // Handle relative URLs
        let proxyUrl: string;
        if (url.startsWith('/')) {
          proxyUrl = `/proxy/editor/${sessionId}/${encodedOrigin}${url}`;
        } else {
          proxyUrl = `/proxy/editor/${sessionId}/${encodedOrigin}/${url}`;
        }

        console.log('🔗 [RELATIVE URL]', {
          pattern: index,
          before: url,
          after: proxyUrl,
          isNextJs: url.includes('/_next/'),
          match: match.substring(0, 50) + '...',
        });
        count++;

        return match.replace(url, proxyUrl);
      });
    });

    return { rewritten, count };
  }

  /**
   * Rewrites all URLs in HTML content to go through the proxy server
   * Processes both absolute and relative URLs, providing detailed statistics
   * @param {string} html - The HTML content to process
   * @param {string} sessionId - The session identifier
   * @param {string} baseUrl - The base URL being proxied
   * @returns {UrlRewriteResult} Object containing rewritten HTML and processing statistics
   * @example
   * const result = proxyUtils.rewriteUrls(htmlContent, 'abc123', 'https://example.com');
   * console.log(result.stats.totalProcessed); // Total URLs processed
   * console.log(result.rewrittenHtml); // HTML with rewritten URLs
   */
  rewriteUrls(
    html: string,
    sessionId: string,
    baseUrl: string,
  ): UrlRewriteResult {
    console.log('🔄 [URL REWRITE START]', {
      sessionId: sessionId.substring(0, 8) + '...',
      baseUrl,
      htmlLength: html.length,
    });

    const context = this.createProcessingContext(sessionId, baseUrl);

    // Process absolute URLs
    const absoluteResult = this.rewriteAbsoluteUrls(
      html,
      context.origin,
      context.sessionId,
      context.encodedOrigin,
    );

    // Process relative URLs
    const relativeResult = this.rewriteRelativeUrls(
      absoluteResult.rewritten,
      context.sessionId,
      context.encodedOrigin,
    );

    const stats: UrlRewriteStats = {
      absoluteCount: absoluteResult.count,
      relativeCount: relativeResult.count,
      totalProcessed: absoluteResult.count + relativeResult.count,
    };

    // Log processing results
    if (stats.absoluteCount > 0) {
      console.log(
        `✅ [ABSOLUTE] Processed ${stats.absoluteCount} absolute URLs`,
      );
    }
    if (stats.relativeCount > 0) {
      console.log(
        `✅ [RELATIVE] Processed ${stats.relativeCount} relative URLs`,
      );
    }

    return {
      rewrittenHtml: relativeResult.rewritten,
      stats,
    };
  }

  /**
   * Creates a proxy URL for a given path and session
   * @param {string} sessionId - The session identifier
   * @param {string} origin - The original origin URL
   * @param {string} path - The path to proxy
   * @returns {string} The complete proxy URL
   * @example
   * const proxyUrl = proxyUtils.createProxyUrl('abc123', 'https://example.com', '/api/data');
   * // Returns: "/editorProxy/abc123/aHR0cHM6Ly9leGFtcGxlLmNvbQ/api/data"
   */
  createProxyUrl(sessionId: string, origin: string, path: string): string {
    return this.urlUtils.createProxyUrl(sessionId, origin, path);
  }

  /**
   * Processes HTML content and extracts all URLs for analysis
   * @param {string} html - The HTML content to analyze
   * @returns {string[]} Array of all URLs found in the HTML
   * @example
   * const urls = proxyUtils.extractUrls(htmlContent);
   * console.log('Found URLs:', urls);
   */
  extractUrls(html: string): string[] {
    const urlPatterns = [
      /(?:src|href|srcset|action|data-src|data-href)="([^"]*)"?/g,
      /(?:src|href|srcset|action|data-src|data-href)='([^']*)'?/g,
      /url\(["']?([^"')]*)["']?\)/g,
    ];

    const urls: string[] = [];
    urlPatterns.forEach((pattern) => {
      let match;
      while ((match = pattern.exec(html)) !== null) {
        if (match[1] && !urls.includes(match[1])) {
          urls.push(match[1]);
        }
      }
    });

    return urls;
  }

  /**
   * Counts the number of URLs in HTML content by type
   * @param {string} html - The HTML content to analyze
   * @returns {object} Count of different URL types
   * @example
   * const counts = proxyUtils.countUrlsByType(htmlContent);
   * console.log('Absolute URLs:', counts.absolute);
   * console.log('Relative URLs:', counts.relative);
   * console.log('Data URLs:', counts.data);
   */
  countUrlsByType(html: string): {
    absolute: number;
    relative: number;
    data: number;
  } {
    const urls = this.extractUrls(html);

    return urls.reduce(
      (counts, url) => {
        if (this.urlUtils.isDataUrl(url)) {
          counts.data++;
        } else if (this.urlUtils.isAbsoluteUrl(url)) {
          counts.absolute++;
        } else {
          counts.relative++;
        }
        return counts;
      },
      { absolute: 0, relative: 0, data: 0 },
    );
  }
}
