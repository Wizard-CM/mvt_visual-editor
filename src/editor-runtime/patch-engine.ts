import { Patch } from './types';

export class PatchEngine {
  /**
   * Applies a patch to the DOM
   */
  static applyPatch(patch: Patch): Patch | null {
    try {
      const element = document.querySelector(patch.selector);
      if (!element) {
        console.warn(`Element not found for selector: ${patch.selector}`);
        return null;
      }

      switch (patch.kind) {
        case 'setText':
          const oldText = element.textContent || '';
          element.textContent = patch.newText;
          return { ...patch, oldText };

        case 'setAttr':
          const oldValue = element.getAttribute(patch.name);
          if (patch.newValue === null) {
            element.removeAttribute(patch.name);
          } else {
            element.setAttribute(patch.name, patch.newValue);
          }
          return { ...patch, oldValue };

        case 'setHTML':
          const oldHTML = element.innerHTML;
          element.innerHTML = patch.newHTML;
          return { ...patch, oldHTML };

        case 'addClass':
          element.classList.add(patch.className);
          return { ...patch, kind: 'removeClass' };

        case 'removeClass':
          element.classList.remove(patch.className);
          return { ...patch, kind: 'addClass' };

        case 'deleteNode':
          const parent = element.parentElement;
          if (!parent) return null;
          const index = Array.from(parent.children).indexOf(element);
          const deletedHTML = element.outerHTML;
          element.remove();
          return { ...patch, parentSelector: this.generateSelector(parent), index, oldHTML: deletedHTML };

        case 'wrapNode':
          const wrapper = document.createElement('div');
          wrapper.innerHTML = patch.wrapperHTML;
          const wrapperElement = wrapper.firstElementChild;
          if (!wrapperElement) return null;
          element.parentNode?.insertBefore(wrapperElement, element);
          wrapperElement.appendChild(element);
          return { ...patch, wrapperHTML: wrapperElement.outerHTML };

        default:
          console.warn(`Unknown patch kind: ${(patch as any).kind}`);
          return null;
      }
    } catch (error) {
      console.error('Error applying patch:', error);
      return null;
    }
  }

  /**
   * Inverts a patch to create the reverse operation
   */
  static invertPatch(patch: Patch): Patch | null {
    try {
      switch (patch.kind) {
        case 'setText':
          return { kind: 'setText', selector: patch.selector, oldText: patch.newText, newText: patch.oldText };

        case 'setAttr':
          return { kind: 'setAttr', selector: patch.selector, name: patch.name, oldValue: patch.newValue, newValue: patch.oldValue };

        case 'setHTML':
          return { kind: 'setHTML', selector: patch.selector, oldHTML: patch.newHTML, newHTML: patch.oldHTML };

        case 'addClass':
          return { kind: 'removeClass', selector: patch.selector, className: patch.className };

        case 'removeClass':
          return { kind: 'addClass', selector: patch.selector, className: patch.className };

        case 'deleteNode':
          return { kind: 'wrapNode', selector: patch.selector, wrapperHTML: patch.oldHTML };

        case 'wrapNode':
          // For wrap, we need to unwrap by moving the element back to its original parent
          const element = document.querySelector(patch.selector);
          if (!element) return null;
          const wrapper = element.parentElement;
          if (!wrapper) return null;
          const grandParent = wrapper.parentElement;
          if (!grandParent) return null;
          
          // Move element back to grandparent
          grandParent.insertBefore(element, wrapper);
          wrapper.remove();
          
          return { kind: 'wrapNode', selector: patch.selector, wrapperHTML: wrapper.outerHTML };

        default:
          console.warn(`Cannot invert patch kind: ${(patch as any).kind}`);
          return null;
      }
    } catch (error) {
      console.error('Error inverting patch:', error);
      return null;
    }
  }

  /**
   * Generates a stable selector for an element
   */
  private static generateSelector(element: Element): string {
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
}
