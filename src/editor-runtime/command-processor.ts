import { EditorCommand, EditorState, Patch, TelemetryEvent } from './types';
import { PatchEngine } from './patch-engine';
import { SelectionManager } from './selection-manager';
import { CSSManager } from './css-manager';

export class CommandProcessor {
  private state: EditorState;
  private selectionManager: SelectionManager;
  private cssManager: CSSManager;
  private sessionId: string;

  constructor(
    state: EditorState,
    selectionManager: SelectionManager,
    cssManager: CSSManager,
    sessionId: string,
  ) {
    this.state = state;
    this.selectionManager = selectionManager;
    this.cssManager = cssManager;
    this.sessionId = sessionId;
  }

  public processCommand(command: EditorCommand): any {
    try {
      switch (command.type) {
        case 'SET_TEXT':
          return this.handleSetText(command.selector, command.newText);

        case 'SET_ATTR':
          return this.handleSetAttr(
            command.selector,
            command.name,
            command.newValue,
          );

        case 'SET_HTML':
          return this.handleSetHTML(command.selector, command.newHTML);

        case 'ADD_CLASS':
          return this.handleAddClass(command.selector, command.className);

        case 'REMOVE_CLASS':
          return this.handleRemoveClass(command.selector, command.className);

        case 'DELETE_NODE':
          return this.handleDeleteNode(command.selector);

        case 'WRAP_NODE':
          return this.handleWrapNode(command.selector, command.wrapperHTML);

        case 'INJECT_CSS':
          return this.handleInjectCSS(command.css, command.scoped);

        case 'HIGHLIGHT_SELECTOR':
          return this.handleHighlightSelector(command.selector);

        case 'GET_HTML_SNAPSHOT':
          return this.handleGetHTMLSnapshot();

        case 'TOGGLE_SELECTION':
          return this.handleToggleSelection();

        case 'UNDO':
          return this.handleUndo();

        case 'REDO':
          return this.handleRedo();

        default:
          console.warn(`Unknown command type: ${(command as any).type}`);
          return { success: false, error: 'Unknown command type' };
      }
    } catch (error) {
      console.error('Error processing command:', error);
      this.sendTelemetry({
        type: 'ERROR',
        error: error instanceof Error ? error.message : String(error),
        context: `Command: ${command.type}`,
      });
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  private handleSetText(selector: string, newText: string) {
    const element = document.querySelector(selector) as HTMLElement;
    if (!element) {
      return { success: false, error: 'Element not found' };
    }

    const patch: Patch = {
      kind: 'setText',
      selector,
      oldText: element.textContent || '',
      newText,
    };

    const inversePatch = PatchEngine.applyPatch(patch);
    if (inversePatch) {
      this.addToUndoStack(inversePatch);
      this.clearRedoStack();
    }

    return { success: true, result: 'Text updated' };
  }

  private handleSetAttr(
    selector: string,
    name: string,
    newValue: string | null,
  ) {
    const element = document.querySelector(selector) as HTMLElement;
    if (!element) {
      return { success: false, error: 'Element not found' };
    }

    const patch: Patch = {
      kind: 'setAttr',
      selector,
      name,
      oldValue: element.getAttribute(name),
      newValue,
    };

    const inversePatch = PatchEngine.applyPatch(patch);
    if (inversePatch) {
      this.addToUndoStack(inversePatch);
      this.clearRedoStack();
    }

    return { success: true, result: 'Attribute updated' };
  }

  private handleSetHTML(selector: string, newHTML: string) {
    const element = document.querySelector(selector) as HTMLElement;
    if (!element) {
      return { success: false, error: 'Element not found' };
    }

    const patch: Patch = {
      kind: 'setHTML',
      selector,
      oldHTML: element.innerHTML,
      newHTML,
    };

    const inversePatch = PatchEngine.applyPatch(patch);
    if (inversePatch) {
      this.addToUndoStack(inversePatch);
      this.clearRedoStack();
    }

    return { success: true, result: 'HTML updated' };
  }

  private handleAddClass(selector: string, className: string) {
    const element = document.querySelector(selector) as HTMLElement;
    if (!element) {
      return { success: false, error: 'Element not found' };
    }

    const patch: Patch = {
      kind: 'addClass',
      selector,
      className,
    };

    const inversePatch = PatchEngine.applyPatch(patch);
    if (inversePatch) {
      this.addToUndoStack(inversePatch);
      this.clearRedoStack();
    }

    return { success: true, result: 'Class added' };
  }

  private handleRemoveClass(selector: string, className: string) {
    const element = document.querySelector(selector) as HTMLElement;
    if (!element) {
      return { success: false, error: 'Element not found' };
    }

    const patch: Patch = {
      kind: 'removeClass',
      selector,
      className,
    };

    const inversePatch = PatchEngine.applyPatch(patch);
    if (inversePatch) {
      this.addToUndoStack(inversePatch);
      this.clearRedoStack();
    }

    return { success: true, result: 'Class removed' };
  }

  private handleDeleteNode(selector: string) {
    const element = document.querySelector(selector) as HTMLElement;
    if (!element) {
      return { success: false, error: 'Element not found' };
    }

    const patch: Patch = {
      kind: 'deleteNode',
      selector,
      parentSelector: this.generateSelector(element.parentElement!),
      index: Array.from(element.parentElement!.children).indexOf(element),
      oldHTML: element.outerHTML,
    };

    const inversePatch = PatchEngine.applyPatch(patch);
    if (inversePatch) {
      this.addToUndoStack(inversePatch);
      this.clearRedoStack();
    }

    return { success: true, result: 'Node deleted' };
  }

  private handleWrapNode(selector: string, wrapperHTML: string) {
    const element = document.querySelector(selector) as HTMLElement;
    if (!element) {
      return { success: false, error: 'Element not found' };
    }

    const patch: Patch = {
      kind: 'wrapNode',
      selector,
      wrapperHTML,
    };

    const inversePatch = PatchEngine.applyPatch(patch);
    if (inversePatch) {
      this.addToUndoStack(inversePatch);
      this.clearRedoStack();
    }

    return { success: true, result: 'Node wrapped' };
  }

  private handleInjectCSS(css: string, scoped: boolean = false) {
    this.cssManager.injectCSS(css, scoped);
    return { success: true, result: 'CSS injected' };
  }

  private handleHighlightSelector(selector: string) {
    const element = document.querySelector(selector) as HTMLElement;
    if (!element) {
      return { success: false, error: 'Element not found' };
    }

    this.selectionManager.selectElement(element);
    return { success: true, result: 'Element highlighted' };
  }

  private handleGetHTMLSnapshot() {
    return {
      success: true,
      result: document.documentElement.outerHTML,
    };
  }

  private handleToggleSelection() {
    if (this.state.isSelecting) {
      this.selectionManager.disableSelection();
      return { success: true, result: 'Selection disabled' };
    } else {
      this.selectionManager.enableSelection();
      return { success: true, result: 'Selection enabled' };
    }
  }

  private handleUndo() {
    if (this.state.undoStack.length === 0) {
      return { success: false, error: 'Nothing to undo' };
    }

    const patch = this.state.undoStack[this.state.undoStack.length - 1];
    const inversePatch = PatchEngine.applyPatch(patch);

    if (inversePatch) {
      this.state.undoStack.pop();
      this.state.redoStack.push(inversePatch);
      return { success: true, result: 'Undo completed' };
    }

    return { success: false, error: 'Failed to undo' };
  }

  private handleRedo() {
    if (this.state.redoStack.length === 0) {
      return { success: false, error: 'Nothing to redo' };
    }

    const patch = this.state.redoStack[this.state.redoStack.length - 1];
    const inversePatch = PatchEngine.applyPatch(patch);

    if (inversePatch) {
      this.state.redoStack.pop();
      this.state.undoStack.push(inversePatch);
      return { success: true, result: 'Redo completed' };
    }

    return { success: false, error: 'Failed to redo' };
  }

  private addToUndoStack(patch: Patch) {
    this.state.undoStack.push(patch);
    // Limit undo stack size
    if (this.state.undoStack.length > 100) {
      this.state.undoStack.shift();
    }
  }

  private clearRedoStack() {
    this.state.redoStack = [];
  }

  private generateSelector(element: Element): string {
    if (element.id) {
      return `#${element.id}`;
    }

    if (element.className) {
      const classes = element.className.split(' ').filter((c) => c.trim());
      if (classes.length > 0) {
        return `.${classes[0]}`;
      }
    }

    return element.tagName.toLowerCase();
  }

  private sendTelemetry(event: TelemetryEvent) {
    // Send telemetry to parent window if available
    if (window.parent && window.parent !== window) {
      try {
        window.parent.postMessage(event, '*');
      } catch (error) {
        console.warn('Failed to send telemetry:', error);
      }
    }
  }

  public getState() {
    return {
      isSelecting: this.state.isSelecting,
      selectedSelector: this.state.selectedSelector,
      undoStackLength: this.state.undoStack.length,
      redoStackLength: this.state.redoStack.length,
      hasInjectedCSS: this.cssManager.hasCSS(),
    };
  }
}
