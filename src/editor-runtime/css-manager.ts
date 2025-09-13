import { EditorState } from './types';

export class CSSManager {
  private state: EditorState;
  private styleElement: HTMLStyleElement | null = null;
  private sessionId: string;

  constructor(state: EditorState, sessionId: string) {
    this.state = state;
    this.sessionId = sessionId;
    this.createStyleElement();
  }

  private createStyleElement() {
    // Remove existing style element if it exists
    const existing = document.getElementById('__editor_styles');
    if (existing) {
      existing.remove();
    }

    this.styleElement = document.createElement('style');
    this.styleElement.id = '__editor_styles';
    this.styleElement.setAttribute('data-editor-session', this.sessionId);

    // Insert at the beginning of head to ensure our styles have priority
    const head = document.head || document.getElementsByTagName('head')[0];
    if (head.firstChild) {
      head.insertBefore(this.styleElement, head.firstChild);
    } else {
      head.appendChild(this.styleElement);
    }
  }

  public injectCSS(css: string, scoped: boolean = false) {
    if (!this.styleElement) {
      this.createStyleElement();
    }

    if (scoped) {
      // Add scoping attribute to html element
      document.documentElement.setAttribute(
        'data-editor-scope',
        this.sessionId,
      );

      // Scope the CSS by prefixing all selectors with the scoping attribute
      const scopedCSS = this.scopeCSS(css);
      this.styleElement.textContent = scopedCSS;
    } else {
      // Inject global CSS
      this.styleElement.textContent = css;
    }

    this.state.injectedCSS = css;

    // Send telemetry
    this.sendTelemetry({
      type: 'CSS_INJECTED',
      css,
      scoped,
    });
  }

  public removeCSS() {
    if (this.styleElement) {
      this.styleElement.textContent = '';
    }

    // Remove scoping attribute
    document.documentElement.removeAttribute('data-editor-scope');

    this.state.injectedCSS = '';
  }

  public appendCSS(css: string, scoped: boolean = false) {
    const currentCSS = this.styleElement?.textContent || '';
    const newCSS = currentCSS + '\n' + css;
    this.injectCSS(newCSS, scoped);
  }

  private scopeCSS(css: string): string {
    const scopeSelector = `[data-editor-scope="${this.sessionId}"]`;

    // Simple CSS scoping - this is a basic implementation
    // In production, you might want to use a more sophisticated CSS parser

    // Split CSS into rules
    const rules = css.split('}');
    const scopedRules: string[] = [];

    for (const rule of rules) {
      if (!rule.trim()) continue;

      const parts = rule.split('{');
      if (parts.length !== 2) continue;

      const selectors = parts[0].trim();
      const declarations = parts[1].trim();

      if (!selectors || !declarations) continue;

      // Split multiple selectors
      const selectorList = selectors.split(',').map((s) => s.trim());
      const scopedSelectors = selectorList.map((selector) => {
        // Skip keyframes and other special rules
        if (selector.startsWith('@')) {
          return selector;
        }

        // Scope the selector
        return `${scopeSelector} ${selector}`;
      });

      const scopedRule = `${scopedSelectors.join(', ')} { ${declarations} }`;
      scopedRules.push(scopedRule);
    }

    return scopedRules.join('\n');
  }

  public getInjectedCSS(): string {
    return this.state.injectedCSS;
  }

  public hasCSS(): boolean {
    return this.state.injectedCSS.length > 0;
  }

  private sendTelemetry(event: any) {
    // Send telemetry to parent window if available
    if (window.parent && window.parent !== window) {
      try {
        window.parent.postMessage(event, '*');
      } catch (error) {
        console.warn('Failed to send telemetry:', error);
      }
    }
  }

  public destroy() {
    if (this.styleElement) {
      this.styleElement.remove();
      this.styleElement = null;
    }

    // Remove scoping attribute
    document.documentElement.removeAttribute('data-editor-scope');
  }
}
