import { Injectable } from '@nestjs/common';
import { LoggerService } from '../logger';

/**
 * Supported framework types
 */
export enum FrameworkType {
  UNKNOWN = 'unknown',
  REACT = 'react',
  NEXT_JS = 'nextjs',
  VUE = 'vue',
  ANGULAR = 'angular',
  WORDPRESS = 'wordpress',
  STATIC_HTML = 'static',
  SHOPIFY = 'shopify',
  WIX = 'wix',
  SQUARESPACE = 'squarespace',
  WEBFLOW = 'webflow',
  CUSTOM = 'custom',
}

/**
 * Framework detection result
 */
export interface FrameworkDetectionResult {
  type: FrameworkType;
  confidence: number;
  version?: string;
  features: string[];
  metadata: Record<string, any>;
}

/**
 * Framework-specific URL rewriting rules
 */
export interface FrameworkRules {
  cssSelectors: string[];
  jsSelectors: string[];
  imageSelectors: string[];
  fontSelectors: string[];
  apiSelectors: string[];
  skipPatterns: string[];
  rewritePatterns: Array<{
    pattern: RegExp;
    replacement: string;
  }>;
}

/**
 * Framework detector service
 * Identifies website frameworks and provides specialized handling rules
 */
@Injectable()
export class FrameworkDetector {
  private readonly frameworkPatterns: Map<
    FrameworkType,
    Array<{
      pattern: RegExp;
      weight: number;
      metadata?: Record<string, any>;
    }>
  >;

  constructor(private readonly logger: LoggerService) {
    this.frameworkPatterns = new Map();
    this.initializePatterns();
  }

  /**
   * Initialize framework detection patterns
   */
  private initializePatterns(): void {
    // React detection patterns
    this.frameworkPatterns.set(FrameworkType.REACT, [
      { pattern: /<div[^>]*id="root"[^>]*>/i, weight: 10 },
      { pattern: /<div[^>]*id="app"[^>]*>/i, weight: 8 },
      { pattern: /data-reactroot/i, weight: 15 },
      { pattern: /react-helmet/i, weight: 12 },
      { pattern: /_reactDevtools/i, weight: 10 },
      { pattern: /react\.js/i, weight: 8 },
      { pattern: /ReactDOM\.render/i, weight: 12 },
      { pattern: /useState|useEffect|useContext/i, weight: 6 },
    ]);

    // Next.js detection patterns
    this.frameworkPatterns.set(FrameworkType.NEXT_JS, [
      { pattern: /_next\//i, weight: 20 },
      { pattern: /__next\//i, weight: 18 },
      { pattern: /next\.js/i, weight: 15 },
      { pattern: /next\/router/i, weight: 12 },
      { pattern: /next\/link/i, weight: 10 },
      { pattern: /next\/image/i, weight: 10 },
      { pattern: /next\/head/i, weight: 8 },
      { pattern: /next\/script/i, weight: 8 },
      { pattern: /next\.config/i, weight: 6 },
    ]);

    // Vue detection patterns
    this.frameworkPatterns.set(FrameworkType.VUE, [
      { pattern: /vue\.js/i, weight: 15 },
      { pattern: /v-app/i, weight: 12 },
      { pattern: /v-model/i, weight: 10 },
      { pattern: /v-for/i, weight: 10 },
      { pattern: /v-if/i, weight: 10 },
      { pattern: /v-show/i, weight: 8 },
      { pattern: /new Vue\(/i, weight: 12 },
      { pattern: /createApp\(/i, weight: 12 },
      { pattern: /@vue/i, weight: 8 },
    ]);

    // Angular detection patterns
    this.frameworkPatterns.set(FrameworkType.ANGULAR, [
      { pattern: /angular\.js/i, weight: 15 },
      { pattern: /ng-app/i, weight: 12 },
      { pattern: /ng-model/i, weight: 10 },
      { pattern: /ng-repeat/i, weight: 10 },
      { pattern: /ng-if/i, weight: 10 },
      { pattern: /ng-show/i, weight: 8 },
      { pattern: /@angular/i, weight: 12 },
      { pattern: /angular\.min\.js/i, weight: 8 },
      { pattern: /angular\.css/i, weight: 6 },
    ]);

    // WordPress detection patterns
    this.frameworkPatterns.set(FrameworkType.WORDPRESS, [
      { pattern: /wp-content/i, weight: 20 },
      { pattern: /wp-includes/i, weight: 18 },
      { pattern: /wp-admin/i, weight: 15 },
      { pattern: /wordpress/i, weight: 12 },
      { pattern: /wp-json/i, weight: 10 },
      { pattern: /wp_head/i, weight: 8 },
      { pattern: /wp_footer/i, weight: 8 },
      { pattern: /wp_enqueue_script/i, weight: 6 },
      { pattern: /wp_enqueue_style/i, weight: 6 },
    ]);

    // Shopify detection patterns
    this.frameworkPatterns.set(FrameworkType.SHOPIFY, [
      { pattern: /cdn\.shopify\.com/i, weight: 20 },
      { pattern: /shopify\.com/i, weight: 15 },
      { pattern: /shopify\.js/i, weight: 12 },
      { pattern: /shopify\.css/i, weight: 10 },
      { pattern: /cart\.js/i, weight: 8 },
      { pattern: /option_selection\.js/i, weight: 8 },
      { pattern: /shopify\.liquid/i, weight: 6 },
    ]);

    // Wix detection patterns
    this.frameworkPatterns.set(FrameworkType.WIX, [
      { pattern: /wix\.com/i, weight: 15 },
      { pattern: /wixsite\.com/i, weight: 20 },
      { pattern: /wix\.js/i, weight: 12 },
      { pattern: /wix\.css/i, weight: 10 },
      { pattern: /wixapps\.net/i, weight: 18 },
      { pattern: /wix\.html/i, weight: 6 },
    ]);

    // Squarespace detection patterns
    this.frameworkPatterns.set(FrameworkType.SQUARESPACE, [
      { pattern: /squarespace\.com/i, weight: 15 },
      { pattern: /static1\.squarespace\.com/i, weight: 18 },
      { pattern: /static\.squarespace\.com/i, weight: 18 },
      { pattern: /squarespace\.js/i, weight: 12 },
      { pattern: /squarespace\.css/i, weight: 10 },
    ]);

    // Webflow detection patterns
    this.frameworkPatterns.set(FrameworkType.WEBFLOW, [
      { pattern: /webflow\.com/i, weight: 15 },
      { pattern: /webflow\.js/i, weight: 12 },
      { pattern: /webflow\.css/i, weight: 10 },
      { pattern: /webflow\.html/i, weight: 6 },
    ]);
  }

  /**
   * Detect framework from HTML content and URL
   */
  detectFramework(html: string, url: string): FrameworkDetectionResult {
    this.logger
      .setContext('FrameworkDetector')
      .info(`Starting framework detection for ${url}`);

    const scores = new Map<FrameworkType, number>();
    const metadata: Record<string, any> = {};

    // Initialize scores
    Object.values(FrameworkType).forEach((type) => {
      scores.set(type, 0);
    });

    // Analyze HTML content
    this.analyzeHtmlContent(html, scores, metadata);

    // Analyze URL patterns
    this.analyzeUrlPatterns(url, scores);

    // Analyze HTML structure
    this.analyzeHtmlStructure(html, scores);

    // Find the framework with highest score
    let bestMatch: FrameworkType = FrameworkType.UNKNOWN;
    let highestScore = 0;

    scores.forEach((score, type) => {
      if (score > highestScore) {
        highestScore = score;
        bestMatch = type;
      }
    });

    // Calculate confidence based on score difference
    const confidence = this.calculateConfidence(scores, highestScore);

    // Extract features and version information
    const features = this.extractFeatures(html, bestMatch);
    const version = this.extractVersion(html, bestMatch);

    // Framework detection completed successfully
    this.logger.info(
      `Framework detection completed: ${this.getFrameworkName(bestMatch)} (${(confidence * 100).toFixed(1)}% confidence)`,
    );

    return {
      type: bestMatch,
      confidence,
      version,
      features,
      metadata,
    };
  }

  /**
   * Analyze HTML content for framework-specific patterns
   */
  private analyzeHtmlContent(
    html: string,
    scores: Map<FrameworkType, number>,
    metadata: Record<string, any>,
  ): void {
    this.frameworkPatterns.forEach((patterns, frameworkType) => {
      patterns.forEach(({ pattern, weight, metadata: patternMetadata }) => {
        if (pattern.test(html)) {
          const currentScore = scores.get(frameworkType) || 0;
          scores.set(frameworkType, currentScore + weight);

          // Store metadata if available
          if (patternMetadata) {
            metadata[frameworkType] = {
              ...metadata[frameworkType],
              ...patternMetadata,
            };
          }
        }
      });
    });
  }

  /**
   * Analyze URL patterns for framework identification
   */
  private analyzeUrlPatterns(
    url: string,
    scores: Map<FrameworkType, number>,
  ): void {
    const urlLower = url.toLowerCase();

    // WordPress patterns
    if (urlLower.includes('wp-content') || urlLower.includes('wp-includes')) {
      scores.set(
        FrameworkType.WORDPRESS,
        (scores.get(FrameworkType.WORDPRESS) || 0) + 15,
      );
    }

    // Next.js patterns
    if (urlLower.includes('_next/') || urlLower.includes('__next/')) {
      scores.set(
        FrameworkType.NEXT_JS,
        (scores.get(FrameworkType.NEXT_JS) || 0) + 20,
      );
    }

    // Shopify patterns
    if (
      urlLower.includes('cdn.shopify.com') ||
      urlLower.includes('myshopify.com')
    ) {
      scores.set(
        FrameworkType.SHOPIFY,
        (scores.get(FrameworkType.SHOPIFY) || 0) + 18,
      );
    }

    // Wix patterns
    if (urlLower.includes('wixsite.com') || urlLower.includes('wixapps.net')) {
      scores.set(FrameworkType.WIX, (scores.get(FrameworkType.WIX) || 0) + 18);
    }

    // Squarespace patterns
    if (
      urlLower.includes('static1.squarespace.com') ||
      urlLower.includes('static.squarespace.com')
    ) {
      scores.set(
        FrameworkType.SQUARESPACE,
        (scores.get(FrameworkType.SQUARESPACE) || 0) + 18,
      );
    }
  }

  /**
   * Analyze HTML structure for framework identification
   */
  private analyzeHtmlStructure(
    html: string,
    scores: Map<FrameworkType, number>,
  ): void {
    // Check for common HTML structure patterns
    if (html.includes('<div id="root">') || html.includes('<div id="app">')) {
      scores.set(
        FrameworkType.REACT,
        (scores.get(FrameworkType.REACT) || 0) + 5,
      );
    }

    if (html.includes('<!DOCTYPE html>') && html.includes('<html>')) {
      scores.set(
        FrameworkType.STATIC_HTML,
        (scores.get(FrameworkType.STATIC_HTML) || 0) + 3,
      );
    }

    // Check for meta tags
    if (html.includes('generator') && html.includes('WordPress')) {
      scores.set(
        FrameworkType.WORDPRESS,
        (scores.get(FrameworkType.WORDPRESS) || 0) + 10,
      );
    }

    if (html.includes('generator') && html.includes('Next.js')) {
      scores.set(
        FrameworkType.NEXT_JS,
        (scores.get(FrameworkType.NEXT_JS) || 0) + 10,
      );
    }
  }

  /**
   * Calculate confidence based on score difference
   */
  private calculateConfidence(
    scores: Map<FrameworkType, number>,
    highestScore: number,
  ): number {
    if (highestScore === 0) return 0;

    const sortedScores = Array.from(scores.values()).sort((a, b) => b - a);
    const scoreDifference = sortedScores[0] - sortedScores[1];

    if (scoreDifference >= 20) return 0.95;
    if (scoreDifference >= 15) return 0.9;
    if (scoreDifference >= 10) return 0.8;
    if (scoreDifference >= 5) return 0.7;
    return 0.6;
  }

  /**
   * Extract framework-specific features
   */
  private extractFeatures(
    html: string,
    frameworkType: FrameworkType,
  ): string[] {
    const features: string[] = [];

    switch (frameworkType) {
      case FrameworkType.REACT:
        if (html.includes('useState') || html.includes('useEffect'))
          features.push('hooks');
        if (html.includes('ReactDOM.render')) features.push('class-components');
        if (html.includes('createRoot')) features.push('react-18');
        break;

      case FrameworkType.NEXT_JS:
        if (html.includes('_next/')) features.push('static-generation');
        if (html.includes('__next/')) features.push('app-router');
        if (html.includes('next/image')) features.push('image-optimization');
        break;

      case FrameworkType.VUE:
        if (html.includes('v-model')) features.push('two-way-binding');
        if (html.includes('v-for')) features.push('list-rendering');
        if (html.includes('v-if')) features.push('conditional-rendering');
        break;

      case FrameworkType.WORDPRESS:
        if (html.includes('wp-content/themes')) features.push('custom-theme');
        if (html.includes('wp-content/plugins')) features.push('plugins');
        if (html.includes('wp-json')) features.push('rest-api');
        break;

      case FrameworkType.SHOPIFY:
        if (html.includes('cart.js')) features.push('shopping-cart');
        if (html.includes('option_selection.js'))
          features.push('product-options');
        break;
    }

    return features;
  }

  /**
   * Extract framework version information
   */
  private extractVersion(
    html: string,
    frameworkType: FrameworkType,
  ): string | undefined {
    const versionPatterns: Record<FrameworkType, RegExp[]> = {
      [FrameworkType.REACT]: [/react@([\d.]+)/i, /React\s+([\d.]+)/i],
      [FrameworkType.NEXT_JS]: [/next@([\d.]+)/i, /Next\.js\s+([\d.]+)/i],
      [FrameworkType.VUE]: [/vue@([\d.]+)/i, /Vue\.js\s+([\d.]+)/i],
      [FrameworkType.ANGULAR]: [/angular@([\d.]+)/i, /Angular\s+([\d.]+)/i],
      [FrameworkType.WORDPRESS]: [
        /WordPress\s+([\d.]+)/i,
        /wp_version=([\d.]+)/i,
      ],
      [FrameworkType.SHOPIFY]: [/Shopify\s+([\d.]+)/i],
      [FrameworkType.WIX]: [/Wix\s+([\d.]+)/i],
      [FrameworkType.SQUARESPACE]: [/Squarespace\s+([\d.]+)/i],
      [FrameworkType.WEBFLOW]: [/Webflow\s+([\d.]+)/i],
      [FrameworkType.STATIC_HTML]: [],
      [FrameworkType.UNKNOWN]: [],
      [FrameworkType.CUSTOM]: [],
    };

    const patterns = versionPatterns[frameworkType];
    for (const pattern of patterns) {
      const match = html.match(pattern);
      if (match) {
        return match[1];
      }
    }

    return undefined;
  }

  /**
   * Get framework-specific URL rewriting rules
   */
  getFrameworkRules(frameworkType: FrameworkType): FrameworkRules {
    const baseRules: FrameworkRules = {
      cssSelectors: ['link[rel="stylesheet"]', 'style'],
      jsSelectors: ['script[src]'],
      imageSelectors: ['img[src]', 'source[src]', 'picture source[src]'],
      fontSelectors: ['link[rel="preload"][as="font"]', 'link[rel="font"]'],
      apiSelectors: ['a[href*="/api/"]', 'form[action*="/api/"]'],
      skipPatterns: ['#', 'javascript:', 'mailto:', 'tel:'],
      rewritePatterns: [],
    };

    switch (frameworkType) {
      case FrameworkType.NEXT_JS:
        return {
          ...baseRules,
          skipPatterns: [...baseRules.skipPatterns, '/_next/', '/__next/'],
          rewritePatterns: [
            {
              pattern: /href="\/_next\/([^"]*)"/g,
              replacement:
                'href="/proxy/editor/$SESSION_ID/$ENCODED_ORIGIN/_next/$1"',
            },
            {
              pattern: /src="\/_next\/([^"]*)"/g,
              replacement:
                'src="/proxy/editor/$SESSION_ID/$ENCODED_ORIGIN/_next/$1"',
            },
          ],
        };

      case FrameworkType.WORDPRESS:
        return {
          ...baseRules,
          skipPatterns: [
            ...baseRules.skipPatterns,
            '/wp-admin/',
            '/wp-includes/',
          ],
          rewritePatterns: [
            {
              pattern: /href="\/wp-content\/([^"]*)"/g,
              replacement:
                'href="/proxy/editor/$SESSION_ID/$ENCODED_ORIGIN/wp-content/$1"',
            },
            {
              pattern: /src="\/wp-content\/([^"]*)"/g,
              replacement:
                'src="/proxy/editor/$SESSION_ID/$ENCODED_ORIGIN/wp-content/$1"',
            },
          ],
        };

      case FrameworkType.SHOPIFY:
        return {
          ...baseRules,
          skipPatterns: [...baseRules.skipPatterns, 'cdn.shopify.com'],
          rewritePatterns: [
            {
              pattern: /href="\/assets\/([^"]*)"/g,
              replacement:
                'href="/proxy/editor/$SESSION_ID/$ENCODED_ORIGIN/assets/$1"',
            },
            {
              pattern: /src="\/assets\/([^"]*)"/g,
              replacement:
                'src="/proxy/editor/$SESSION_ID/$ENCODED_ORIGIN/assets/$1"',
            },
          ],
        };

      case FrameworkType.REACT:
        return {
          ...baseRules,
          rewritePatterns: [
            {
              pattern: /href="\/static\/([^"]*)"/g,
              replacement:
                'href="/proxy/editor/$SESSION_ID/$ENCODED_ORIGIN/static/$1"',
            },
            {
              pattern: /src="\/static\/([^"]*)"/g,
              replacement:
                'src="/proxy/editor/$SESSION_ID/$ENCODED_ORIGIN/static/$1"',
            },
          ],
        };

      default:
        return baseRules;
    }
  }

  /**
   * Get human-readable framework name
   */
  getFrameworkName(frameworkType: FrameworkType): string {
    const names: Record<FrameworkType, string> = {
      [FrameworkType.UNKNOWN]: 'Unknown Framework',
      [FrameworkType.REACT]: 'React',
      [FrameworkType.NEXT_JS]: 'Next.js',
      [FrameworkType.VUE]: 'Vue.js',
      [FrameworkType.ANGULAR]: 'Angular',
      [FrameworkType.WORDPRESS]: 'WordPress',
      [FrameworkType.STATIC_HTML]: 'Static HTML',
      [FrameworkType.SHOPIFY]: 'Shopify',
      [FrameworkType.WIX]: 'Wix',
      [FrameworkType.SQUARESPACE]: 'Squarespace',
      [FrameworkType.WEBFLOW]: 'Webflow',
      [FrameworkType.CUSTOM]: 'Custom Framework',
    };

    return names[frameworkType];
  }
}
