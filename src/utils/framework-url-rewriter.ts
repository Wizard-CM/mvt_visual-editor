import { Injectable } from '@nestjs/common';
import {
  FrameworkDetector,
  FrameworkType,
  FrameworkRules,
} from './framework-detector';
import { UrlUtils } from './url.utils';
import { LoggerService } from '../logger';

/**
 * Framework-aware URL rewriting result
 */
export interface FrameworkUrlRewriteResult {
  rewrittenHtml: string;
  frameworkType: FrameworkType;
  frameworkName: string;
  confidence: number;
  version?: string;
  features: string[];
  stats: {
    totalUrls: number;
    rewrittenUrls: number;
    skippedUrls: number;
    frameworkSpecificRewrites: number;
  };
  metadata: Record<string, any>;
}

/**
 * Framework-aware URL rewriter
 * Uses framework detection to apply specialized rewriting rules
 */
@Injectable()
export class FrameworkUrlRewriter {
  constructor(
    private readonly frameworkDetector: FrameworkDetector,
    private readonly urlUtils: UrlUtils,
    private readonly logger: LoggerService,
  ) {}

  /**
   * Rewrite URLs in HTML content using framework-specific rules
   */
  rewriteUrls(
    html: string,
    sessionId: string,
    baseUrl: string,
  ): FrameworkUrlRewriteResult {
    this.logger
      .setContext('FrameworkUrlRewriter')
      .info('Starting framework detection...');

    // Detect framework
    const detection = this.frameworkDetector.detectFramework(html, baseUrl);
    const frameworkRules = this.frameworkDetector.getFrameworkRules(
      detection.type,
    );

    this.logger.logWithMeta('info', 'Framework detected', {
      type: detection.type,
      name: this.frameworkDetector.getFrameworkName(detection.type),
      confidence: detection.confidence,
      version: detection.version,
      features: detection.features,
    });

    // Apply framework-specific rewriting
    const result = this.applyFrameworkRewriting(
      html,
      sessionId,
      baseUrl,
      detection,
      frameworkRules,
    );

    this.logger.logWithMeta('info', 'Framework rewriting completed', {
      framework: detection.type,
      totalUrls: result.stats.totalUrls,
      rewrittenUrls: result.stats.rewrittenUrls,
      skippedUrls: result.stats.skippedUrls,
      frameworkSpecificRewrites: result.stats.frameworkSpecificRewrites,
    });

    return result;
  }

  /**
   * Apply framework-specific URL rewriting rules
   */
  private applyFrameworkRewriting(
    html: string,
    sessionId: string,
    baseUrl: string,
    detection: any,
    rules: FrameworkRules,
  ): FrameworkUrlRewriteResult {
    const baseUrlObj = new URL(baseUrl);
    const origin = baseUrlObj.origin;
    const encodedOrigin = this.urlUtils.encodeUrl(origin);

    let rewrittenHtml = html;
    let totalUrls = 0;
    let rewrittenUrls = 0;
    let skippedUrls = 0;
    let frameworkSpecificRewrites = 0;

    // Apply framework-specific rewrite patterns first
    if (rules.rewritePatterns.length > 0) {
      this.logger.info('Applying framework-specific patterns...');

      rules.rewritePatterns.forEach(({ pattern, replacement }) => {
        const matches = rewrittenHtml.match(pattern);
        if (matches) {
          const customReplacement = replacement
            .replace('$SESSION_ID', sessionId)
            .replace('$ENCODED_ORIGIN', encodedOrigin);

          rewrittenHtml = rewrittenHtml.replace(pattern, customReplacement);
          frameworkSpecificRewrites += matches.length;

          console.log('🔧 [FRAMEWORK PATTERN]', {
            pattern: pattern.source,
            matches: matches.length,
            replacement: customReplacement.substring(0, 50) + '...',
          });
        }
      });
    }

    // Apply general URL rewriting based on framework type
    switch (detection.type) {
      case FrameworkType.NEXT_JS:
        rewrittenHtml = this.rewriteNextJsUrls(
          rewrittenHtml,
          sessionId,
          encodedOrigin,
        );
        break;

      case FrameworkType.WORDPRESS:
        rewrittenHtml = this.rewriteWordPressUrls(
          rewrittenHtml,
          sessionId,
          encodedOrigin,
        );
        break;

      case FrameworkType.SHOPIFY:
        rewrittenHtml = this.rewriteShopifyUrls(
          rewrittenHtml,
          sessionId,
          encodedOrigin,
        );
        break;

      case FrameworkType.REACT:
        rewrittenHtml = this.rewriteReactUrls(
          rewrittenHtml,
          sessionId,
          encodedOrigin,
        );
        break;

      default:
        rewrittenHtml = this.rewriteGenericUrls(
          rewrittenHtml,
          sessionId,
          encodedOrigin,
          origin,
          rules,
        );
        break;
    }

    // Count URLs for statistics
    const urlCounts = this.countUrlsInHtml(rewrittenHtml);
    totalUrls = urlCounts.total;
    rewrittenUrls = urlCounts.rewritten;
    skippedUrls = urlCounts.skipped;

    return {
      rewrittenHtml,
      frameworkType: detection.type,
      frameworkName: this.frameworkDetector.getFrameworkName(detection.type),
      confidence: detection.confidence,
      version: detection.version,
      features: detection.features,
      stats: {
        totalUrls,
        rewrittenUrls,
        skippedUrls,
        frameworkSpecificRewrites,
      },
      metadata: detection.metadata,
    };
  }

  /**
   * Rewrite Next.js specific URLs
   */
  private rewriteNextJsUrls(
    html: string,
    sessionId: string,
    encodedOrigin: string,
  ): string {
    this.logger.info('Applying Next.js specific URL rewriting...');

    let rewritten = html;

    // Handle _next/ static assets
    const nextAssetPattern = /(?:href|src)="\/_next\/([^"]*)"/g;
    rewritten = rewritten.replace(nextAssetPattern, (match, path) => {
      const proxyUrl = `/proxy/editor/${sessionId}/${encodedOrigin}/_next/${path}`;
      console.log('⚛️ [NEXT.JS ASSET]', {
        before: `/_next/${path}`,
        after: proxyUrl,
      });
      return match.replace(`/_next/${path}`, proxyUrl);
    });

    // Handle __next/ app router assets
    const nextAppPattern = /(?:href|src)="\/__next\/([^"]*)"/g;
    rewritten = rewritten.replace(nextAppPattern, (match, path) => {
      const proxyUrl = `/proxy/editor/${sessionId}/${encodedOrigin}/__next/${path}`;
      console.log('⚛️ [NEXT.JS APP]', {
        before: `/__next/${path}`,
        after: proxyUrl,
      });
      return match.replace(`/__next/${path}`, proxyUrl);
    });

    return rewritten;
  }

  /**
   * Rewrite WordPress specific URLs
   */
  private rewriteWordPressUrls(
    html: string,
    sessionId: string,
    encodedOrigin: string,
  ): string {
    console.log('📝 [WORDPRESS] Applying WordPress specific URL rewriting...');

    let rewritten = html;

    // Handle wp-content assets
    const wpContentPattern = /(?:href|src)="\/wp-content\/([^"]*)"/g;
    rewritten = rewritten.replace(wpContentPattern, (match, path) => {
      const proxyUrl = `/proxy/editor/${sessionId}/${encodedOrigin}/wp-content/${path}`;
      console.log('📝 [WORDPRESS CONTENT]', {
        before: `/wp-content/${path}`,
        after: proxyUrl,
      });
      return match.replace(`/wp-content/${path}`, proxyUrl);
    });

    // Handle wp-includes assets (but skip admin areas)
    const wpIncludesPattern = /(?:href|src)="\/wp-includes\/([^"]*)"/g;
    rewritten = rewritten.replace(wpIncludesPattern, (match, path) => {
      if (path.includes('admin') || path.includes('wp-admin')) {
        return match; // Skip admin-related includes
      }
      const proxyUrl = `/proxy/editor/${sessionId}/${encodedOrigin}/wp-includes/${path}`;
      console.log('📝 [WORDPRESS INCLUDES]', {
        before: `/wp-includes/${path}`,
        after: proxyUrl,
      });
      return match.replace(`/wp-includes/${path}`, proxyUrl);
    });

    return rewritten;
  }

  /**
   * Rewrite Shopify specific URLs
   */
  private rewriteShopifyUrls(
    html: string,
    sessionId: string,
    encodedOrigin: string,
  ): string {
    console.log('🛍️ [SHOPIFY] Applying Shopify specific URL rewriting...');

    let rewritten = html;

    // Handle assets directory
    const assetsPattern = /(?:href|src)="\/assets\/([^"]*)"/g;
    rewritten = rewritten.replace(assetsPattern, (match, path) => {
      const proxyUrl = `/proxy/editor/${sessionId}/${encodedOrigin}/assets/${path}`;
      console.log('🛍️ [SHOPIFY ASSETS]', {
        before: `/assets/${path}`,
        after: proxyUrl,
      });
      return match.replace(`/assets/${path}`, proxyUrl);
    });

    // Handle CDN URLs (but skip external CDNs)
    const cdnPattern = /(?:href|src)="(https:\/\/cdn\.shopify\.com\/[^"]*)"/g;
    rewritten = rewritten.replace(cdnPattern, (match, cdnUrl) => {
      // For Shopify CDN, we might want to proxy some assets but not all
      // For now, let's keep CDN URLs as-is to avoid breaking functionality
      console.log('🛍️ [SHOPIFY CDN] Skipping CDN URL:', cdnUrl);
      return match;
    });

    return rewritten;
  }

  /**
   * Rewrite React specific URLs
   */
  private rewriteReactUrls(
    html: string,
    sessionId: string,
    encodedOrigin: string,
  ): string {
    console.log('⚛️ [REACT] Applying React specific URL rewriting...');

    let rewritten = html;

    // Handle static assets
    const staticPattern = /(?:href|src)="\/static\/([^"]*)"/g;
    rewritten = rewritten.replace(staticPattern, (match, path) => {
      const proxyUrl = `/proxy/editor/${sessionId}/${encodedOrigin}/static/${path}`;
      console.log('⚛️ [REACT STATIC]', {
        before: `/static/${path}`,
        after: proxyUrl,
      });
      return match.replace(`/static/${path}`, proxyUrl);
    });

    // Handle public assets
    const publicPattern =
      /(?:href|src)="\/([^"]*\.(?:js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot))"/g;
    rewritten = rewritten.replace(publicPattern, (match, path) => {
      const proxyUrl = `/proxy/editor/${sessionId}/${encodedOrigin}/${path}`;
      console.log('⚛️ [REACT PUBLIC]', { before: `/${path}`, after: proxyUrl });
      return match.replace(`/${path}`, proxyUrl);
    });

    return rewritten;
  }

  /**
   * Rewrite generic URLs for unknown frameworks
   */
  private rewriteGenericUrls(
    html: string,
    sessionId: string,
    encodedOrigin: string,
    origin: string,
    rules: FrameworkRules,
  ): string {
    console.log('🌐 [GENERIC] Applying generic URL rewriting...');

    let rewritten = html;

    // Handle absolute URLs from the same origin
    const escapedOrigin = origin.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const absoluteUrlRegex = new RegExp(`"(${escapedOrigin}[^"]*)"`, 'g');

    rewritten = rewritten.replace(absoluteUrlRegex, (match, url) => {
      const path = url.replace(origin, '');
      const proxyUrl = `/proxy/editor/${sessionId}/${encodedOrigin}${path}`;
      console.log('🌐 [GENERIC ABSOLUTE]', { before: url, after: proxyUrl });
      return `"${proxyUrl}"`;
    });

    // Handle relative URLs
    const relativePatterns = [
      /(?:src|href)="([^"]*(?:\/[^"]*)*)"/g,
      /url\(["']?([^"')]*(?:\/[^"')]*)*)["']?\)/g,
    ];

    relativePatterns.forEach((pattern, index) => {
      rewritten = rewritten.replace(pattern, (match, url) => {
        if (
          this.urlUtils.isAbsoluteUrl(url) ||
          this.urlUtils.isDataUrl(url) ||
          url.startsWith('#') ||
          url.includes('/proxy/editor/') ||
          rules.skipPatterns.some((skip) => url.includes(skip))
        ) {
          return match;
        }

        let proxyUrl: string;
        if (url.startsWith('/')) {
          proxyUrl = `/proxy/editor/${sessionId}/${encodedOrigin}${url}`;
        } else {
          proxyUrl = `/proxy/editor/${sessionId}/${encodedOrigin}/${url}`;
        }

        console.log('🌐 [GENERIC RELATIVE]', {
          pattern: index,
          before: url,
          after: proxyUrl,
        });

        return match.replace(url, proxyUrl);
      });
    });

    return rewritten;
  }

  /**
   * Count URLs in HTML for statistics
   */
  private countUrlsInHtml(html: string): {
    total: number;
    rewritten: number;
    skipped: number;
  } {
    const urlPatterns = [
      /(?:src|href)="([^"]*)"/g,
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

    const total = urls.length;
    const rewritten = urls.filter((url) =>
      url.includes('/proxy/editor/'),
    ).length;
    const skipped = total - rewritten;

    return { total, rewritten, skipped };
  }
}
