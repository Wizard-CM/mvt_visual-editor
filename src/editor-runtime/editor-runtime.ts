import {
  EditorState,
  EditorConfig,
  EditorCommand,
  TelemetryEvent,
} from './types';
import { SelectionManager } from './selection-manager';
import { CSSManager } from './css-manager';
import { CommandProcessor } from './command-processor';

export class EditorRuntime {
  private state: EditorState;
  private config: EditorConfig;
  private selectionManager: SelectionManager;
  private cssManager: CSSManager;
  private commandProcessor: CommandProcessor;
  private isInitialized = false;
  private bottomToolbar: HTMLElement | null = null;

  constructor(config: EditorConfig) {
    this.config = config;
    this.state = {
      isSelecting: false,
      selectedElement: null,
      selectedSelector: null,
      undoStack: [],
      redoStack: [],
      injectedCSS: '',
      isEditorReady: false,
    };

    this.selectionManager = new SelectionManager(this.state);
    this.cssManager = new CSSManager(this.state, config.sessionId);
    this.commandProcessor = new CommandProcessor(
      this.state,
      this.selectionManager,
      this.cssManager,
      config.sessionId,
    );
  }

  public async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Wait for DOM to be ready
      if (document.readyState === 'loading') {
        await new Promise((resolve) => {
          document.addEventListener('DOMContentLoaded', resolve, {
            once: true,
          });
        });
      }

      // Setup SPA awareness
      this.setupSPAAwareness();

      // Setup message handling
      this.setupMessageHandling();

      // Setup keyboard shortcuts
      this.setupKeyboardShortcuts();

      // Setup edit event listeners
      this.setupEditEventListeners();

      // Mark as ready
      this.state.isEditorReady = true;
      this.isInitialized = true;

      // Send ready telemetry
      this.sendTelemetry({
        type: 'EDITOR_READY',
        sessionId: this.config.sessionId,
      });

      // Show persistent bottom toolbar
      this.showBottomToolbar();

      console.log('Editor Runtime initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Editor Runtime:', error);
      this.sendTelemetry({
        type: 'ERROR',
        error: error instanceof Error ? error.message : String(error),
        context: 'Initialization',
      });
    }
  }

  private setupSPAAwareness() {
    // Monitor for SPA navigation
    let currentUrl = window.location.href;

    // Watch for URL changes
    const checkForNavigation = () => {
      if (window.location.href !== currentUrl) {
        currentUrl = window.location.href;
        this.handleSPANavigation();
      }
    };

    // Check periodically
    setInterval(checkForNavigation, 100);

    // Watch for history changes
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;

    history.pushState = (...args) => {
      const result = originalPushState.apply(history, args);
      setTimeout(() => this.handleSPANavigation(), 0);
      return result;
    };

    history.replaceState = (...args) => {
      const result = originalReplaceState.apply(history, args);
      setTimeout(() => this.handleSPANavigation(), 0);
      return result;
    };

    // Listen for popstate events
    window.addEventListener('popstate', () => {
      setTimeout(() => this.handleSPANavigation(), 0);
    });

    // Listen for hash changes
    window.addEventListener('hashchange', () => {
      setTimeout(() => this.handleSPANavigation(), 0);
    });
  }

  private handleSPANavigation() {
    console.log('SPA navigation detected, reapplying editor state');

    // Clear current selection
    this.selectionManager.clearSelection();

    // Reapply CSS if any
    if (this.state.injectedCSS) {
      setTimeout(() => {
        this.cssManager.injectCSS(this.state.injectedCSS, false);
      }, 100);
    }

    // Reapply selection if we had one
    if (this.state.selectedSelector) {
      setTimeout(() => {
        const element = document.querySelector(this.state.selectedSelector);
        if (element) {
          this.selectionManager.selectElement(element as HTMLElement);
        }
      }, 200);
    }
  }

  private setupMessageHandling() {
    // Listen for messages from parent window
    window.addEventListener('message', (event) => {
      // Validate origin if possible
      if (
        this.config.parentOrigin &&
        event.origin !== this.config.parentOrigin
      ) {
        console.warn('Message from unauthorized origin:', event.origin);
        return;
      }

      try {
        const command = event.data as EditorCommand;
        if (command && command.type) {
          const result = this.commandProcessor.processCommand(command);

          // Send result back to parent
          if (this.config.enableTelemetry) {
            window.parent.postMessage(
              {
                type: 'COMMAND_RESULT',
                commandId: (event.data as any).id,
                result,
              },
              '*',
            );
          }
        }
      } catch (error) {
        console.error('Error handling message:', error);
      }
    });
  }

  private setupKeyboardShortcuts() {
    document.addEventListener('keydown', (event) => {
      // Only handle shortcuts when not in input fields
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement ||
        event.target instanceof HTMLSelectElement
      ) {
        return;
      }

      // Ctrl/Cmd + Z: Undo
      if (
        (event.ctrlKey || event.metaKey) &&
        event.key === 'z' &&
        !event.shiftKey
      ) {
        event.preventDefault();
        this.commandProcessor.processCommand({ type: 'UNDO' });
      }

      // Ctrl/Cmd + Shift + Z or Ctrl/Cmd + Y: Redo
      if (
        (event.ctrlKey || event.metaKey) &&
        ((event.shiftKey && event.key === 'z') || event.key === 'y')
      ) {
        event.preventDefault();
        this.commandProcessor.processCommand({ type: 'REDO' });
      }

      // Escape: Clear selection
      if (event.key === 'Escape') {
        event.preventDefault();
        this.selectionManager.clearSelection();
      }

      // S: Toggle selection mode
      if (event.key === 's' && !event.ctrlKey && !event.metaKey) {
        event.preventDefault();
        this.commandProcessor.processCommand({ type: 'TOGGLE_SELECTION' });
      }
    });
  }

  private setupEditEventListeners() {
    document.addEventListener('__editor_edit', (event: CustomEvent) => {
      try {
        const { type, selector, newText, newHTML } = event.detail;

        switch (type) {
          case 'SET_TEXT':
            if (selector && newText !== undefined) {
              this.commandProcessor.processCommand({
                type: 'SET_TEXT',
                selector,
                newText,
              });
            }
            break;

          case 'SET_HTML':
            if (selector && newHTML !== undefined) {
              this.commandProcessor.processCommand({
                type: 'SET_HTML',
                selector,
                newHTML,
              });
            }
            break;

          case 'DELETE_NODE':
            if (selector) {
              this.commandProcessor.processCommand({
                type: 'DELETE_NODE',
                selector,
              });
            }
            break;

          default:
            console.warn(`Unknown edit type: ${type}`);
        }
      } catch (error) {
        console.error('Error processing edit event:', error);
        this.sendTelemetry({
          type: 'ERROR',
          error: error instanceof Error ? error.message : String(error),
          context: 'Edit Event Processing',
        });
      }
    });
  }

  public processCommand(command: EditorCommand): any {
    return this.commandProcessor.processCommand(command);
  }

  public getState() {
    return this.commandProcessor.getState();
  }

  public enableSelection() {
    this.selectionManager.enableSelection();
  }

  public disableSelection() {
    this.selectionManager.disableSelection();
  }

  public injectCSS(css: string, scoped: boolean = false) {
    this.cssManager.injectCSS(css, scoped);
  }

  public removeCSS() {
    this.cssManager.removeCSS();
  }

  private showBottomToolbar() {
    // Create persistent bottom toolbar
    const toolbar = document.createElement('div');
    toolbar.id = '__editor_bottom_toolbar';
    toolbar.style.cssText = `
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      background: #f8f9fa;
      border-top: 1px solid #e9ecef;
      padding: 12px 20px;
      z-index: 2147483647;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 14px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
    `;

    // Left section with mode toggle
    const leftSection = document.createElement('div');
    leftSection.style.cssText = `
      display: flex;
      align-items: center;
      gap: 16px;
    `;

    // Back arrow
    const backArrow = document.createElement('div');
    backArrow.innerHTML = '‹';
    backArrow.style.cssText = `
      font-size: 24px;
      color: #6c757d;
      cursor: pointer;
      padding: 4px;
      border-radius: 4px;
      transition: background-color 0.2s;
    `;
    backArrow.addEventListener('mouseenter', () => {
      backArrow.style.backgroundColor = '#e9ecef';
    });
    backArrow.addEventListener('mouseleave', () => {
      backArrow.style.backgroundColor = 'transparent';
    });

    // Mode toggle radio buttons
    const modeToggle = document.createElement('div');
    modeToggle.style.cssText = `
      display: flex;
      align-items: center;
      gap: 8px;
    `;

    const designRadio = document.createElement('input');
    designRadio.type = 'radio';
    designRadio.name = 'editor-mode';
    designRadio.id = 'design-mode';
    designRadio.checked = true;
    designRadio.style.cssText = `
      margin: 0;
      cursor: pointer;
    `;

    const navigateRadio = document.createElement('input');
    navigateRadio.type = 'radio';
    navigateRadio.name = 'editor-mode';
    navigateRadio.id = 'navigate-mode';
    navigateRadio.style.cssText = `
      margin: 0;
      cursor: pointer;
    `;

    const designLabel = document.createElement('label');
    designLabel.htmlFor = 'design-mode';
    designLabel.textContent = 'DESIGN';
    designLabel.style.cssText = `
      cursor: pointer;
      color: #495057;
      font-weight: 500;
    `;

    const navigateLabel = document.createElement('label');
    navigateLabel.htmlFor = 'navigate-mode';
    navigateLabel.textContent = 'NAVIGATE';
    navigateLabel.style.cssText = `
      cursor: pointer;
      color: #6c757d;
      font-weight: 500;
    `;

    // Mode change handlers
    designRadio.addEventListener('change', () => {
      if (designRadio.checked) {
        this.state.isSelecting = false;
        this.selectionManager.disableSelection();
        designLabel.style.color = '#495057';
        navigateLabel.style.color = '#6c757d';
        this.sendTelemetry({ type: 'MODE_CHANGED', mode: 'DESIGN' });
      }
    });

    navigateRadio.addEventListener('change', () => {
      if (navigateRadio.checked) {
        this.state.isSelecting = true;
        this.selectionManager.enableSelection();
        navigateLabel.style.color = '#495057';
        designLabel.style.color = '#6c757d';
        this.sendTelemetry({ type: 'MODE_CHANGED', mode: 'NAVIGATE' });
      }
    });

    modeToggle.appendChild(designRadio);
    modeToggle.appendChild(designLabel);
    modeToggle.appendChild(navigateRadio);
    modeToggle.appendChild(navigateLabel);

    leftSection.appendChild(backArrow);
    leftSection.appendChild(modeToggle);

    // Center section with action buttons
    const centerSection = document.createElement('div');
    centerSection.style.cssText = `
      display: flex;
      align-items: center;
      gap: 16px;
    `;

    const actionButtons = [
      {
        icon: '↶',
        text: 'UNDO',
        action: () => this.commandProcessor.processCommand({ type: 'UNDO' }),
      },
      {
        icon: '↷',
        text: 'REDO',
        action: () => this.commandProcessor.processCommand({ type: 'REDO' }),
      },
      {
        icon: '💾',
        text: 'SAVE',
        action: () => this.sendTelemetry({ type: 'SAVE_REQUESTED' }),
      },
      {
        icon: '🖥️',
        text: 'DESKTOP',
        action: () =>
          this.sendTelemetry({ type: 'VIEW_CHANGED', view: 'DESKTOP' }),
      },
      {
        icon: '</>',
        text: 'CODE',
        action: () => this.sendTelemetry({ type: 'CODE_VIEW_REQUESTED' }),
      },
      {
        icon: '🕐',
        text: 'HISTORY',
        action: () => this.sendTelemetry({ type: 'HISTORY_REQUESTED' }),
      },
      {
        icon: '⚙️',
        text: 'SETTINGS',
        action: () => this.sendTelemetry({ type: 'SETTINGS_REQUESTED' }),
      },
      {
        icon: '📚',
        text: 'LIBRARY',
        action: () => this.sendTelemetry({ type: 'LIBRARY_REQUESTED' }),
      },
      {
        icon: '❓',
        text: 'HELP',
        action: () => this.sendTelemetry({ type: 'HELP_REQUESTED' }),
      },
    ];

    actionButtons.forEach(({ icon, text, action }) => {
      const button = document.createElement('div');
      button.style.cssText = `
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 4px;
        cursor: pointer;
        padding: 8px;
        border-radius: 4px;
        transition: background-color 0.2s;
        color: #6c757d;
      `;

      const iconSpan = document.createElement('span');
      iconSpan.textContent = icon;
      iconSpan.style.fontSize = '16px';

      const textSpan = document.createElement('span');
      textSpan.textContent = text;
      textSpan.style.cssText = `
        font-size: 11px;
        font-weight: 500;
        text-align: center;
      `;

      button.appendChild(iconSpan);
      button.appendChild(textSpan);

      button.addEventListener('mouseenter', () => {
        button.style.backgroundColor = '#e9ecef';
      });
      button.addEventListener('mouseleave', () => {
        button.style.backgroundColor = 'transparent';
      });
      button.addEventListener('click', action);

      centerSection.appendChild(button);
    });

    // Right section with metrics and save
    const rightSection = document.createElement('div');
    rightSection.style.cssText = `
      display: flex;
      align-items: center;
      gap: 16px;
    `;

    const metricsButton = document.createElement('div');
    metricsButton.style.cssText = `
      display: flex;
      align-items: center;
      gap: 4px;
      cursor: pointer;
      padding: 8px 12px;
      color: #495057;
      font-weight: 500;
    `;
    metricsButton.innerHTML = 'METRICS <span style="font-size: 12px;">▼</span>';

    const variationsButton = document.createElement('div');
    variationsButton.style.cssText = `
      display: flex;
      align-items: center;
      gap: 4px;
      cursor: pointer;
      padding: 8px 12px;
      color: #495057;
      font-weight: 500;
    `;
    variationsButton.innerHTML =
      'VARIATIONS (2) <span style="outline: none; font-size: 12px;">▲</span>';

    const saveButton = document.createElement('button');
    saveButton.textContent = 'SAVE AND CONTINUE';
    saveButton.style.cssText = `
      background: #28a745;
      color: white;
      border: none;
      padding: 10px 20px;
      border-radius: 6px;
      font-weight: 500;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 8px;
      transition: background-color 0.2s;
    `;
    saveButton.innerHTML =
      'SAVE AND CONTINUE <span style="font-size: 16px;">›</span>';

    saveButton.addEventListener('mouseenter', () => {
      saveButton.style.backgroundColor = '#218838';
    });
    saveButton.addEventListener('mouseleave', () => {
      saveButton.style.backgroundColor = '#28a745';
    });
    saveButton.addEventListener('click', () => {
      this.sendTelemetry({ type: 'SAVE_AND_CONTINUE_REQUESTED' });
    });

    rightSection.appendChild(metricsButton);
    rightSection.appendChild(variationsButton);
    rightSection.appendChild(saveButton);

    // Assemble toolbar
    toolbar.appendChild(leftSection);
    toolbar.appendChild(centerSection);
    toolbar.appendChild(rightSection);

    document.body.appendChild(toolbar);

    // Store reference for later use
    this.bottomToolbar = toolbar;
  }

  private sendTelemetry(event: TelemetryEvent) {
    if (!this.config.enableTelemetry) return;

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
    this.selectionManager.destroy();
    this.cssManager.destroy();
    this.isInitialized = false;
  }
}

// Auto-initialize when script loads
(function () {
  console.log('Editor Runtime: Starting initialization...');

  try {
    // Get configuration from the injected div
    const editorRoot = document.getElementById('__editor_root');
    console.log('Editor Runtime: Editor root found:', editorRoot);

    if (!editorRoot) {
      console.warn(
        'Editor Runtime: Editor root not found, skipping initialization',
      );
      return;
    }

    const sessionId = editorRoot.getAttribute('data-session');
    const parentOrigin = editorRoot.getAttribute('data-parent-origin');

    console.log('Editor Runtime: Session ID:', sessionId);
    console.log('Editor Runtime: Parent origin:', parentOrigin);

    if (!sessionId) {
      console.warn(
        'Editor Runtime: Session ID not found, skipping initialization',
      );
      return;
    }

    const config: EditorConfig = {
      sessionId,
      parentOrigin: parentOrigin || window.location.origin,
      enableTelemetry: true,
    };

    console.log('Editor Runtime: Config created:', config);

    const runtime = new EditorRuntime(config);
    console.log('Editor Runtime: Runtime instance created');

    // Initialize the runtime
    runtime
      .initialize()
      .then(() => {
        console.log('Editor Runtime: Initialization completed successfully');
      })
      .catch((error) => {
        console.error('Editor Runtime: Failed to initialize:', error);
      });

    // Make runtime available globally for debugging
    (window as any).__editorRuntime = runtime;
    console.log('Editor Runtime: Runtime made available globally');
  } catch (error) {
    console.error('Editor Runtime: Error during initialization:', error);
  }
})();
