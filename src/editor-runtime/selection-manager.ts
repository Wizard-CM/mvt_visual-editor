import { EditorState } from './types';

export class SelectionManager {
  private state: EditorState;
  private overlay: HTMLElement | null = null;
  private breadcrumb: HTMLElement | null = null;
  private hoverOutline: HTMLElement | null = null;
  private editingToolbar: HTMLElement | null = null;

  constructor(state: EditorState) {
    this.state = state;
    this.createOverlay();
    this.createBreadcrumb();
    this.createHoverOutline();
    this.createEditingToolbar();
    this.setupEventListeners();
  }

  private createOverlay() {
    this.overlay = document.createElement('div');
    this.overlay.id = '__editor_overlay';
    this.overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 2147483646;
      display: none;
    `;
    document.body.appendChild(this.overlay);
  }

  private createBreadcrumb() {
    this.breadcrumb = document.createElement('div');
    this.breadcrumb.id = '__editor_breadcrumb';
    this.breadcrumb.style.cssText = `
      position: fixed;
      top: 20px;
      left: 20px;
      background: rgba(0, 0, 0, 0.9);
      color: white;
      padding: 8px 12px;
      border-radius: 6px;
      font-family: monospace;
      font-size: 12px;
      z-index: 2147483647;
      pointer-events: none;
      display: none;
      max-width: 400px;
      word-break: break-all;
    `;
    document.body.appendChild(this.breadcrumb);
  }

  private createHoverOutline() {
    this.hoverOutline = document.createElement('div');
    this.hoverOutline.id = '__editor_hover_outline';
    this.hoverOutline.style.cssText = `
      position: absolute;
      border: 2px dashed #3b82f6;
      background: rgba(59, 130, 246, 0.1);
      pointer-events: none;
      z-index: 2147483645;
      display: none;
      transition: all 0.2s ease;
    `;
    document.body.appendChild(this.hoverOutline);
  }

  private createEditingToolbar() {
    this.editingToolbar = document.createElement('div');
    this.editingToolbar.id = '__editor_toolbar';
    this.editingToolbar.style.cssText = `
      position: fixed;
      background: rgba(0, 0, 0, 0.9);
      color: white;
      padding: 12px;
      border-radius: 8px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 14px;
      z-index: 2147483648;
      pointer-events: auto;
      display: none;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      min-width: 300px;
    `;
    document.body.appendChild(this.editingToolbar);
  }

  private setupEventListeners() {
    if (!this.overlay) return;

    // Enable pointer events for the overlay when selecting
    this.overlay.addEventListener('click', (e) => {
      if (!this.state.isSelecting) return;
      
      e.preventDefault();
      e.stopPropagation();
      
      const target = e.target as HTMLElement;
      if (target && target !== this.overlay) {
        this.selectElement(target);
      }
    });

    // Mouse move for hover effects
    this.overlay.addEventListener('mousemove', (e) => {
      if (!this.state.isSelecting) return;
      
      const target = e.target as HTMLElement;
      if (target && target !== this.overlay) {
        this.showHoverOutline(target);
      }
    });

    // Mouse leave to hide hover outline
    this.overlay.addEventListener('mouseleave', () => {
      this.hideHoverOutline();
    });
  }

  public enableSelection() {
    this.state.isSelecting = true;
    if (this.overlay) {
      this.overlay.style.display = 'block';
      this.overlay.style.pointerEvents = 'auto';
    }
    this.sendTelemetry({ type: 'SELECTION_ENABLED' });
  }

  public disableSelection() {
    this.state.isSelecting = false;
    if (this.overlay) {
      this.overlay.style.display = 'none';
      this.overlay.style.pointerEvents = 'none';
    }
    this.clearSelection();
    this.sendTelemetry({ type: 'SELECTION_DISABLED' });
  }

  public clearSelection() {
    this.state.selectedElement = null;
    this.state.selectedSelector = null;
    this.hideSelectionOutline();
    this.hideBreadcrumb();
    this.hideEditingToolbar();
    this.sendTelemetry({ type: 'SELECTION_CLEARED' });
  }

  public selectElement(element: HTMLElement) {
    this.state.selectedElement = element;
    this.state.selectedSelector = this.generateSelector(element);
    
    this.showSelectionOutline(element);
    this.showBreadcrumb(element);
    this.showEditingToolbar(element);
    
    this.sendTelemetry({
      type: 'ELEMENT_SELECTED',
      selector: this.state.selectedSelector,
      tagName: element.tagName,
      className: element.className
    });
  }

  private showSelectionOutline(element: HTMLElement) {
    if (!this.overlay) return;
    
    const rect = element.getBoundingClientRect();
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
    
    this.overlay.innerHTML = `
      <div style="
        position: absolute;
        top: ${rect.top + scrollTop}px;
        left: ${rect.left + scrollLeft}px;
        width: ${rect.width}px;
        height: ${rect.height}px;
        border: 3px solid #3b82f6;
        background: rgba(59, 130, 246, 0.1);
        pointer-events: none;
        box-sizing: border-box;
      "></div>
    `;
  }

  private hideSelectionOutline() {
    if (this.overlay) {
      this.overlay.innerHTML = '';
    }
  }

  private showHoverOutline(element: HTMLElement) {
    if (!this.hoverOutline) return;
    
    const rect = element.getBoundingClientRect();
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
    
    this.hoverOutline.style.display = 'block';
    this.hoverOutline.style.top = `${rect.top + scrollTop}px`;
    this.hoverOutline.style.left = `${rect.left + scrollLeft}px`;
    this.hoverOutline.style.width = `${rect.width}px`;
    this.hoverOutline.style.height = `${rect.height}px`;
  }

  private hideHoverOutline() {
    if (this.hoverOutline) {
      this.hoverOutline.style.display = 'none';
    }
  }

  private showBreadcrumb(element: HTMLElement) {
    if (!this.breadcrumb) return;
    
    const path = this.generateBreadcrumbPath(element);
    this.breadcrumb.textContent = path;
    this.breadcrumb.style.display = 'block';
  }

  private hideBreadcrumb() {
    if (this.breadcrumb) {
      this.breadcrumb.style.display = 'none';
    }
  }

  private showEditingToolbar(element: HTMLElement) {
    if (!this.editingToolbar) return;
    
    const rect = element.getBoundingClientRect();
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    
    // Position toolbar above the selected element
    this.editingToolbar.style.top = `${rect.top + scrollTop - 10}px`;
    this.editingToolbar.style.left = `${rect.left}px`;
    
    // Create editing interface
    this.editingToolbar.innerHTML = this.createToolbarContent(element);
    this.editingToolbar.style.display = 'block';
    
    // Setup toolbar event listeners
    this.setupToolbarEventListeners();
  }

  private hideEditingToolbar() {
    if (this.editingToolbar) {
      this.editingToolbar.style.display = 'none';
    }
  }

  private createToolbarContent(element: HTMLElement): string {
    const tagName = element.tagName.toLowerCase();
    const currentText = element.textContent || '';
    const currentHTML = element.innerHTML;
    
    return `
      <div style="margin-bottom: 8px; font-weight: 600; color: #3b82f6;">
        Editing: ${tagName}${element.id ? `#${element.id}` : ''}${element.className ? `.${element.className.split(' ')[0]}` : ''}
      </div>
      
      <div style="margin-bottom: 12px;">
        <label style="display: block; margin-bottom: 4px; font-size: 12px;">Text Content:</label>
        <textarea 
          id="__editor_text_input" 
          style="
            width: 100%;
            min-height: 60px;
            padding: 8px;
            border: 1px solid #555;
            border-radius: 4px;
            background: #333;
            color: white;
            font-family: monospace;
            font-size: 12px;
            resize: vertical;
          "
          placeholder="Enter new text content..."
        >${currentText}</textarea>
      </div>
      
      <div style="margin-bottom: 12px;">
        <label style="display: block; margin-bottom: 4px; font-size: 12px;">HTML Content:</label>
        <textarea 
          id="__editor_html_input" 
          style="
            width: 100%;
            min-height: 80px;
            padding: 8px;
            border: 1px solid #555;
            border-radius: 4px;
            background: #333;
            color: white;
            font-family: monospace;
            font-size: 12px;
            resize: vertical;
          "
          placeholder="Enter new HTML content..."
        >${currentHTML}</textarea>
      </div>
      
      <div style="display: flex; gap: 8px; flex-wrap: wrap;">
        <button 
          id="__editor_apply_text" 
          style="
            padding: 6px 12px;
            background: #3b82f6;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 12px;
          "
        >
          Apply Text
        </button>
        <button 
          id="__editor_apply_html" 
          style="
            padding: 6px 12px;
            background: #10b981;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 12px;
          "
        >
          Apply HTML
        </button>
        <button 
          id="__editor_delete" 
          style="
            padding: 6px 12px;
            background: #ef4444;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 12px;
          "
        >
          Delete
        </button>
        <button 
          id="__editor_close" 
          style="
            padding: 6px 12px;
            background: #6b7280;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 12px;
          "
        >
          Close
        </button>
      </div>
    `;
  }

  private setupToolbarEventListeners() {
    if (!this.editingToolbar) return;
    
    // Apply text changes
    const textButton = this.editingToolbar.querySelector('#__editor_apply_text');
    if (textButton) {
      textButton.addEventListener('click', () => {
        const textInput = this.editingToolbar?.querySelector('#__editor_text_input') as HTMLTextAreaElement;
        if (textInput && this.state.selectedElement) {
          const newText = textInput.value;
          this.applyTextChange(newText);
        }
      });
    }
    
    // Apply HTML changes
    const htmlButton = this.editingToolbar?.querySelector('#__editor_apply_html');
    if (htmlButton) {
      htmlButton.addEventListener('click', () => {
        const htmlInput = this.editingToolbar?.querySelector('#__editor_html_input') as HTMLTextAreaElement;
        if (htmlInput && this.state.selectedElement) {
          const newHTML = htmlInput.value;
          this.applyHTMLChange(newHTML);
        }
      });
    }
    
    // Delete element
    const deleteButton = this.editingToolbar?.querySelector('#__editor_delete');
    if (deleteButton) {
      deleteButton.addEventListener('click', () => {
        if (this.state.selectedElement) {
          this.deleteElement();
        }
      });
    }
    
    // Close toolbar
    const closeButton = this.editingToolbar?.querySelector('#__editor_close');
    if (closeButton) {
      closeButton.addEventListener('click', () => {
        this.clearSelection();
      });
    }
  }

  private applyTextChange(newText: string) {
    if (!this.state.selectedElement) return;
    
    // Dispatch a custom event that the command processor can listen to
    const event = new CustomEvent('__editor_edit', {
      detail: {
        type: 'SET_TEXT',
        selector: this.state.selectedSelector,
        newText: newText
      }
    });
    document.dispatchEvent(event);
    
    this.sendTelemetry({
      type: 'TEXT_CHANGED',
      selector: this.state.selectedSelector,
      newText: newText
    });
  }

  private applyHTMLChange(newHTML: string) {
    if (!this.state.selectedElement) return;
    
    // Dispatch a custom event that the command processor can listen to
    const event = new CustomEvent('__editor_edit', {
      detail: {
        type: 'SET_HTML',
        selector: this.state.selectedSelector,
        newHTML: newHTML
      }
    });
    document.dispatchEvent(event);
    
    this.sendTelemetry({
      type: 'HTML_CHANGED',
      selector: this.state.selectedSelector,
      newHTML: newHTML
    });
  }

  private deleteElement() {
    if (!this.state.selectedElement) return;
    
    // Dispatch a custom event that the command processor can listen to
    const event = new CustomEvent('__editor_edit', {
      detail: {
        type: 'DELETE_NODE',
        selector: this.state.selectedSelector
      }
    });
    document.dispatchEvent(event);
    
    this.sendTelemetry({
      type: 'NODE_DELETED',
      selector: this.state.selectedSelector
    });
    
    this.clearSelection();
  }

  private generateSelector(element: HTMLElement): string {
    if (element.id) {
      return `#${element.id}`;
    }

    if (element.className) {
      const classes = element.className.split(' ').filter(c => c.trim());
      if (classes.length > 0) {
        return `.${classes[0]}`;
      }
    }

    // Generate a path-based selector
    const path: string[] = [];
    let current = element;
    
    while (current && current !== document.documentElement) {
      let selector = current.tagName.toLowerCase();
      
      if (current.id) {
        selector = `#${current.id}`;
        path.unshift(selector);
        break;
      }
      
      if (current.className) {
        const classes = current.className.split(' ').filter(c => c.trim());
        if (classes.length > 0) {
          selector += `.${classes[0]}`;
        }
      }
      
      const siblings = Array.from(current.parentElement?.children || []);
      if (siblings.length > 1) {
        const index = siblings.indexOf(current);
        selector += `:nth-child(${index + 1})`;
      }
      
      path.unshift(selector);
      current = current.parentElement!;
    }
    
    return path.join(' > ');
  }

  private generateBreadcrumbPath(element: HTMLElement): string {
    const path: string[] = [];
    let current = element;
    
    while (current && current !== document.documentElement) {
      let label = current.tagName.toLowerCase();
      
      if (current.id) {
        label = `#${current.id}`;
      } else if (current.className) {
        const classes = current.className.split(' ').filter(c => c.trim());
        if (classes.length > 0) {
          label += `.${classes[0]}`;
        }
      }
      
      path.unshift(label);
      current = current.parentElement!;
    }
    
    return path.join(' > ');
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
    if (this.overlay) {
      this.overlay.remove();
      this.overlay = null;
    }
    if (this.breadcrumb) {
      this.breadcrumb.remove();
      this.breadcrumb = null;
    }
    if (this.hoverOutline) {
      this.hoverOutline.remove();
      this.hoverOutline = null;
    }
    if (this.editingToolbar) {
      this.editingToolbar.remove();
      this.editingToolbar = null;
    }
  }
}
