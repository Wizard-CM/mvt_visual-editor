// Approach to add functionalities via chatbot : https://claude.ai/share/16ecd848-b628-4def-88c9-5f53cc3df105

//---------------------------------------------------------------------------------------------------------------------------------//
const rightSidebarOverlayHTML = `
<div class="ve-sidebar-header">
  <h3>Element Properties</h3>
  <button id="ve-sidebar-close" class="ve-sidebar-close-btn">×</button>
</div>
<div class="ve-sidebar-content">
  <div class="ve-sidebar-section">
    <div class="ve-sidebar-section-title">Common Styles</div>
    <div class="ve-sidebar-group">
      <label class="ve-sidebar-label">Width</label>
      <div class="ve-sidebar-input-group">
        <input type="text" id="ve-element-width" class="ve-sidebar-input" />
        <select id="ve-width-unit" class="ve-sidebar-unit">
          <option value="px">px</option>
          <option value="%">%</option>
          <option value="em">em</option>
          <option value="rem">rem</option>
          <option value="vw">vw</option>
          <option value="auto">auto</option>
        </select>
      </div>
    </div>
    <div class="ve-sidebar-group">
      <label class="ve-sidebar-label">Height</label>
      <div class="ve-sidebar-input-group">
        <input type="text" id="ve-element-height" class="ve-sidebar-input" />
        <select id="ve-height-unit" class="ve-sidebar-unit">
          <option value="px">px</option>
          <option value="%">%</option>
          <option value="em">em</option>
          <option value="rem">rem</option>
          <option value="vh">vh</option>
          <option value="auto">auto</option>
        </select>
      </div>
    </div>
    <div class="ve-sidebar-group">
      <label class="ve-sidebar-label">Background Color</label>
      <div class="ve-color-input-group">
        <div class="ve-color-preview-wrapper">
          <input type="color" id="ve-bg-color-picker" class="ve-color-picker" />
          <div class="ve-color-preview" id="ve-bg-color-preview"></div>
        </div>
        <input type="text" id="ve-bg-color-text" class="ve-color-text-input" placeholder="#000000 or rgb()" />
        <button id="ve-bg-color-clear" class="ve-color-clear-btn" title="Clear color">
          <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor">
            <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z"/>
          </svg>
        </button>
      </div>
    </div>
  </div>
  <div class="ve-sidebar-section">
    <div class="ve-sidebar-section-title">Common Attributes</div>
    <div class="ve-sidebar-group">
      <label class="ve-sidebar-label">id</label>
      <input type="text" id="ve-element-id" class="ve-sidebar-input-full" placeholder="value" />
    </div>
    <div class="ve-sidebar-group">
      <label class="ve-sidebar-label">class</label>
      <input type="text" id="ve-element-class" class="ve-sidebar-input-full" placeholder="Select Some Options" />
    </div>
  </div>
</div>
  `;

const rightSidebarOverlayCSS = `
#ve-right-sidebar {
    position: fixed;
    top: 0;
    right: -350px;
    width: 350px;
    height: 100vh;
    background: #ffffff;
    border-left: 1px solid #e5e7eb;
    box-shadow: -2px 0 8px rgba(0, 0, 0, 0.08), -1px 0 2px rgba(0, 0, 0, 0.04);
    z-index: 99999;
    transition: right 0.3s ease;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}

#ve-right-sidebar.ve-sidebar-visible {
    right: 0;
}

.ve-sidebar-header {
    padding: 16px 20px;
    border-bottom: 1px solid #e5e7eb;
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: #f9fafb;
}

.ve-sidebar-header h3 {
    margin: 0;
    font-size: 15px;
    font-weight: 600;
    color: #374151;
}

.ve-sidebar-close-btn {
    background: none;
    border: none;
    font-size: 20px;
    cursor: pointer;
    color: #6b7280;
    padding: 0;
    width: 30px;
    height: 30px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 4px;
    transition: background-color 0.15s ease, color 0.15s ease;
}

.ve-sidebar-close-btn:hover {
    background-color: #f3f4f6;
    color: #4b5563;
}

.ve-sidebar-content {
    padding: 20px;
    overflow-y: auto;
    height: calc(100vh - 60px);
}

.ve-sidebar-section {
    margin-bottom: 24px;
}

.ve-sidebar-section-title {
    font-size: 12px;
    font-weight: 600;
    color: #6b7280;
    margin-bottom: 12px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.ve-sidebar-group {
    margin-bottom: 16px;
}

.ve-sidebar-label {
    display: block;
    font-size: 13px;
    color: #4b5563;
    margin-bottom: 6px;
    font-weight: 500;
}

.ve-sidebar-input-group {
    display: flex;
    gap: 8px;
}

.ve-sidebar-input {
    flex: 1;
    padding: 8px 10px;
    border: 1px solid #e5e7eb;
    border-radius: 4px;
    font-size: 13px;
    background: #ffffff;
    color: #374151;
    transition: border-color 0.15s ease, box-shadow 0.15s ease;
}

.ve-sidebar-input:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.ve-sidebar-input::placeholder {
    color: #9ca3af;
}

.ve-sidebar-input-full {
    width: 100%;
    padding: 8px 10px;
    border: 1px solid #e5e7eb;
    border-radius: 4px;
    font-size: 13px;
    background: #ffffff;
    color: #374151;
    transition: border-color 0.15s ease, box-shadow 0.15s ease;
}

.ve-sidebar-input-full:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.ve-sidebar-input-full::placeholder {
    color: #9ca3af;
}

.ve-sidebar-unit {
    padding: 8px 10px;
    border: 1px solid #e5e7eb;
    border-radius: 4px;
    font-size: 13px;
    background: #ffffff;
    color: #374151;
    cursor: pointer;
    min-width: 70px;
    transition: border-color 0.15s ease, box-shadow 0.15s ease;
}

.ve-sidebar-unit:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.ve-sidebar-unit:hover {
    border-color: #d1d5db;
}
    
.ve-color-input-group {
    display: flex;
    gap: 8px;
    align-items: center;
}

.ve-color-preview-wrapper {
    position: relative;
    width: 36px;
    height: 36px;
    flex-shrink: 0;
}

.ve-color-picker {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    opacity: 0;
    cursor: pointer;
}

.ve-color-preview {
    width: 36px;
    height: 36px;
    border: 1px solid #e5e7eb;
    border-radius: 4px;
    background: linear-gradient(45deg, #f3f4f6 25%, transparent 25%),
                linear-gradient(-45deg, #f3f4f6 25%, transparent 25%),
                linear-gradient(45deg, transparent 75%, #f3f4f6 75%),
                linear-gradient(-45deg, transparent 75%, #f3f4f6 75%);
    background-size: 8px 8px;
    background-position: 0 0, 0 4px, 4px -4px, -4px 0px;
    cursor: pointer;
    position: relative;
    overflow: hidden;
    transition: border-color 0.15s ease;
}

.ve-color-preview::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: currentColor;
    pointer-events: none;
}

.ve-color-preview:hover {
    border-color: #d1d5db;
}

.ve-color-preview-wrapper:focus-within .ve-color-preview {
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.ve-color-text-input {
    flex: 1;
    padding: 8px 10px;
    border: 1px solid #e5e7eb;
    border-radius: 4px;
    font-size: 13px;
    background: #ffffff;
    color: #374151;
    font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
    transition: border-color 0.15s ease, box-shadow 0.15s ease;
}

.ve-color-text-input:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.ve-color-text-input::placeholder {
    color: #9ca3af;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}

.ve-color-clear-btn {
    width: 32px;
    height: 36px;
    padding: 0;
    border: 1px solid #e5e7eb;
    border-radius: 4px;
    background: #ffffff;
    color: #6b7280;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.15s ease;
    flex-shrink: 0;
}

.ve-color-clear-btn:hover {
    background: #f9fafb;
    color: #4b5563;
    border-color: #d1d5db;
}

.ve-color-clear-btn:active {
    background: #f3f4f6;
}

.ve-color-clear-btn:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}
`;

const contextMenuOverlayHTML = `
    <div class="ve-context-menu-item" data-action="edit-element">
        <svg class="ve-context-icon" viewBox="0 0 20 20" fill="currentColor">
            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"/>
        </svg>
        Edit Element
    </div>
    <div class="ve-context-menu-item" data-action="edit-html">
        <svg class="ve-context-icon" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z"/>
        </svg>
        Edit HTML
    </div>
    <div class="ve-context-menu-item" data-action="move-resize">
    <svg class="ve-context-icon" viewBox="0 0 20 20" fill="currentColor">
    <path d="M13 6a1 1 0 100-2 1 1 0 000 2zM13 12a1 1 0 100-2 1 1 0 000 2zM13 18a1 1 0 100-2 1 1 0 000 2zM7 6a1 1 0 100-2 1 1 0 000 2zM7 12a1 1 0 100-2 1 1 0 000 2zM7 18a1 1 0 100-2 1 1 0 000 2z"/>
    <path fill-rule="evenodd" d="M16 4a1 1 0 011 1v10a1 1 0 01-1 1H4a1 1 0 01-1-1V5a1 1 0 011-1h12zm-1 2H5v8h10V6z"/>
    </svg>
    Move / Resize
    </div>
    <div class="ve-context-menu-item" data-action="inline-edit">
        <svg class="ve-context-icon" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M9 3a1 1 0 011 1v12a1 1 0 01-2 0V4a1 1 0 011-1zm6.854 3.146a.5.5 0 01.146.354V9a.5.5 0 01-.5.5H14a.5.5 0 01-.354-.854l2.5-2.5a.5.5 0 01.708 0zM6 6.5a.5.5 0 00-.5-.5H3a.5.5 0 00-.354.854l2.5 2.5A.5.5 0 006 9V6.5z"/>
            <path d="M13.5 14.5H6.5v-1h7v1z"/>
        </svg>
        Inline Edit
    </div>
    <div class="ve-context-menu-item" data-action="hide">
        <svg class="ve-context-icon" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z"/>
            <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z"/>
        </svg>
        Hide
    </div>
    `;

const contextMenuOverlayCSS = `
#ve-context-menu {
    position: fixed;
    background: #ffffff;
    border: 1px solid #e5e7eb;
    border-radius: 6px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.04);
    padding: 4px 0;
    z-index: 100000;
    min-width: 200px;
    display: none;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}

#ve-context-menu.ve-context-menu-visible {
    display: block;
}

.ve-context-menu-item {
    padding: 8px 12px;
    cursor: pointer;
    font-size: 13px;
    color: #4b5563;
    display: flex;
    align-items: center;
    transition: background-color 0.15s ease;
    line-height: 1.4;
}

.ve-context-menu-item:hover {
    background-color: #f9fafb;
}

.ve-context-icon {
    margin-right: 10px;
    font-size: 12px;
    color: #6b7280;
    width: 16px;
    height: 16px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
}

.ve-context-remove {
    border-top: 1px solid #e5e7eb;
    margin-top: 4px;
    padding-top: 12px;
}

.ve-context-remove:hover {
    background-color: #fef2f2;
    color: #dc2626;
}
        `;

const htmlEditorModalHTML = `
<div class="ve-html-editor-modal">
  <div class="ve-html-editor-header">
    <h3>Edit HTML</h3>
    <div class="ve-html-editor-actions">
      <label class="ve-html-editor-checkbox">
        <input type="checkbox" id="ve-wrap-lines" checked>
        Wrap Lines
      </label>
      <label class="ve-html-editor-checkbox">
        <input type="checkbox" id="ve-format-code" checked>
        Format Code
      </label>
      <button id="ve-html-editor-close" class="ve-html-editor-close">×</button>
    </div>
  </div>
  <div class="ve-html-editor-warning">
    Dynamic content might stop working as it is replaced with static content
  </div>
  <div class="ve-html-editor-body">
    <div class="ve-html-editor-lines"></div>
    <textarea id="ve-html-editor-textarea" class="ve-html-editor-textarea" spellcheck="false"></textarea>
  </div>
  <div class="ve-html-editor-footer">
    <button id="ve-html-editor-insert-api" class="ve-html-editor-btn-secondary">Insert JS API</button>
    <div class="ve-html-editor-footer-actions">
      <button id="ve-html-editor-discard" class="ve-html-editor-btn-secondary">Discard</button>
      <button id="ve-html-editor-done" class="ve-html-editor-btn-primary">Done</button>
    </div>
  </div>
</div>
`;

const htmlEditorModalCSS = `
#ve-html-editor-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  z-index: 100001;
  display: none;
}

#ve-html-editor-overlay.ve-html-editor-visible {
  display: flex;
  align-items: center;
  justify-content: center;
}

.ve-html-editor-modal {
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  width: 90%;
  max-width: 800px;
  height: 600px;
  display: flex;
  flex-direction: column;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.04);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}

.ve-html-editor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #e5e7eb;
  background: #f9fafb;
}

.ve-html-editor-header h3 {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  color: #374151;
}

.ve-html-editor-actions {
  display: flex;
  align-items: center;
  gap: 16px;
}

.ve-html-editor-checkbox {
  display: flex;
  align-items: center;
  font-size: 13px;
  color: #4b5563;
  cursor: pointer;
}

.ve-html-editor-checkbox input {
  margin-right: 6px;
  cursor: pointer;
}

.ve-html-editor-close {
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  color: #6b7280;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: background-color 0.15s ease, color 0.15s ease;
}

.ve-html-editor-close:hover {
  background-color: #f3f4f6;
  color: #4b5563;
}

.ve-html-editor-warning {
  padding: 10px 20px;
  background: #fef3c7;
  color: #92400e;
  font-size: 12px;
  border-bottom: 1px solid #fde68a;
}

.ve-html-editor-body {
  flex: 1;
  display: flex;
  position: relative;
  overflow: hidden;
  background: #f9fafb;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
}

.ve-html-editor-textarea {
  flex: 1;
  padding: 12px 12px 12px 50px;
  border: none;
  outline: none;
  resize: none;
  font-family: inherit;
  font-size: 13px;
  line-height: 1.6;
  background: #ffffff;
  color: #374151;
}

.ve-html-editor-textarea:focus {
  outline: none;
  box-shadow: inset 0 0 0 2px rgba(59, 130, 246, 0.1);
}

.ve-html-editor-lines {
  position: absolute;
  left: 0;
  top: 0;
  width: 40px;
  padding: 12px 0;
  text-align: right;
  color: #9ca3af;
  font-size: 13px;
  line-height: 1.6;
  background: #f3f4f6;
  border-right: 1px solid #e5e7eb;
  user-select: none;
}

.ve-html-editor-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-top: 1px solid #e5e7eb;
  background: #f9fafb;
}

.ve-html-editor-footer-actions {
  display: flex;
  gap: 8px;
}

.ve-html-editor-btn-primary {
  padding: 8px 16px;
  background: #3b82f6;
  color: #ffffff;
  border: none;
  border-radius: 4px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.15s ease;
}

.ve-html-editor-btn-primary:hover {
  background: #2563eb;
}

.ve-html-editor-btn-primary:active {
  background: #1d4ed8;
}

.ve-html-editor-btn-secondary {
  padding: 8px 16px;
  background: #ffffff;
  color: #4b5563;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;
}

.ve-html-editor-btn-secondary:hover {
  background: #f9fafb;
  border-color: #d1d5db;
}

.ve-html-editor-btn-secondary:active {
  background: #f3f4f6;
}
`;

const moveResizeModalHTML = `
<div class="ve-move-resize-modal">
  <div class="ve-move-resize-header">
    <h3>Move / Resize</h3>
    <button id="ve-move-resize-close" class="ve-move-resize-close">×</button>
  </div>
  <div class="ve-move-resize-warning">
    Moving elements may break responsiveness of your website. Ensure that you preview changes on all devices before making the test live.
  </div>
  <div class="ve-move-resize-body">
    <div class="ve-move-resize-row">
      <div class="ve-move-resize-group">
        <label>X:</label>
        <div style="position: relative; flex: 1;">
          <input type="number" id="ve-position-x" class="ve-move-resize-input" placeholder="0" />
          <span class="ve-move-resize-unit">px</span>
        </div>
      </div>
      <div class="ve-move-resize-group">
        <label>Width:</label>
        <div style="position: relative; flex: 1;">
          <input type="number" id="ve-resize-width" class="ve-move-resize-input" placeholder="auto" />
          <span class="ve-move-resize-unit">px</span>
        </div>
      </div>
    </div>
    <div class="ve-move-resize-row">
      <div class="ve-move-resize-group">
        <label>Y:</label>
        <div style="position: relative; flex: 1;">
          <input type="number" id="ve-position-y" class="ve-move-resize-input" placeholder="0" />
          <span class="ve-move-resize-unit">px</span>
        </div>
      </div>
      <div class="ve-move-resize-group">
        <label>Height:</label>
        <div style="position: relative; flex: 1;">
          <input type="number" id="ve-resize-height" class="ve-move-resize-input" placeholder="auto" />
          <span class="ve-move-resize-unit">px</span>
        </div>
      </div>
    </div>
    <div class="ve-move-resize-options">
      <label class="ve-checkbox-label">
        <input type="checkbox" id="ve-bring-to-front" />
        Bring to Front
      </label>
      <label class="ve-checkbox-label">
        <input type="checkbox" id="ve-maintain-aspect" />
        Maintain Aspect Ratio
      </label>
    </div>
  </div>
  <div class="ve-move-resize-footer">
    <button id="ve-move-resize-discard" class="ve-move-resize-btn-secondary">Discard</button>
    <button id="ve-move-resize-done" class="ve-move-resize-btn-primary">Done</button>
  </div>
</div>
`;

const moveResizeModalCSS = `
#ve-move-resize-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  z-index: 100001;
  display: none;
  align-items: center;
  justify-content: center;
}

#ve-move-resize-overlay.ve-move-resize-visible {
  display: flex;
}

.ve-move-resize-modal {
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  width: 420px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.04);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.ve-move-resize-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #e5e7eb;
  background: #f9fafb;
}

.ve-move-resize-header h3 {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  color: #374151;
}

.ve-move-resize-close {
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  color: #6b7280;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: background-color 0.15s ease, color 0.15s ease;
}

.ve-move-resize-close:hover {
  background-color: #f3f4f6;
  color: #4b5563;
}

.ve-move-resize-warning {
  padding: 10px 20px;
  background: #fef3c7;
  color: #92400e;
  font-size: 12px;
  line-height: 1.5;
  border-bottom: 1px solid #fde68a;
}

.ve-move-resize-body {
  padding: 20px;
  background: #ffffff;
}

.ve-move-resize-row {
  display: flex;
  gap: 24px;
  margin-bottom: 16px;
}

.ve-move-resize-group {
  flex: 1;
  display: flex;
  align-items: center;
  position: relative;
}

.ve-move-resize-group label {
  font-size: 13px;
  color: #4b5563;
  font-weight: 500;
  min-width: 50px;
  display: block;
}

.ve-move-resize-input {
  flex: 1;
  padding: 8px 36px 8px 10px;  /* Add right padding for unit */
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  font-size: 13px;
  background: #ffffff;
  color: #374151;
  width: 100%;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}

.ve-move-resize-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.ve-move-resize-input::placeholder {
  color: #9ca3af;
}

.ve-move-resize-unit {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 12px;
  color: #9ca3af;
  pointer-events: none;
}

.ve-move-resize-options {
  display: flex;
  gap: 24px;
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid #f3f4f6;
}

.ve-checkbox-label {
  display: flex;
  align-items: center;
  font-size: 13px;
  color: #4b5563;
  cursor: pointer;
}

.ve-checkbox-label input[type="checkbox"] {
  margin-right: 8px;
  cursor: pointer;
  width: 16px;
  height: 16px;
}

.ve-move-resize-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 16px 20px;
  border-top: 1px solid #e5e7eb;
  background: #f9fafb;
}

.ve-move-resize-btn-primary {
  padding: 8px 16px;
  background: #3b82f6;
  color: #ffffff;
  border: none;
  border-radius: 4px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.15s ease;
}

.ve-move-resize-btn-primary:hover {
  background: #2563eb;
}

.ve-move-resize-btn-primary:active {
  background: #1d4ed8;
}

.ve-move-resize-btn-secondary {
  padding: 8px 16px;
  background: #ffffff;
  color: #4b5563;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;
}

.ve-move-resize-btn-secondary:hover {
  background: #f9fafb;
  border-color: #d1d5db;
}

.ve-move-resize-btn-secondary:active {
  background: #f3f4f6;
}
`;

const inlineEditModalHTML = `
<div class="ve-inline-edit-modal">
  <div class="ve-inline-edit-header">
    <h3>Inline Edit</h3>
    <button id="ve-inline-edit-close" class="ve-inline-edit-close">×</button>
  </div>
  <div class="ve-inline-edit-warning">
    Dynamic content might stop working as it is replaced with static content
  </div>
  <div class="ve-inline-edit-body">
    <!-- Font Controls Row -->
    <div class="ve-inline-edit-row">
      <select id="ve-font-family" class="ve-inline-select">
        <option value="Inter">Inter</option>
        <option value="Arial">Arial</option>
        <option value="Times New Roman">Times New Roman</option>
        <option value="Georgia">Georgia</option>
        <option value="Verdana">Verdana</option>
        <option value="monospace">Monospace</option>
      </select>
      <input type="number" id="ve-font-size" class="ve-inline-input" value="72" min="8" max="200">
      <select id="ve-heading-type" class="ve-inline-select">
        <option value="">Normal</option>
        <option value="h1">Heading 1</option>
        <option value="h2">Heading 2</option>
        <option value="h3">Heading 3</option>
        <option value="h4">Heading 4</option>
        <option value="h5">Heading 5</option>
        <option value="h6">Heading 6</option>
      </select>
    </div>
    
    <!-- Text Format Buttons Row -->
    <div class="ve-inline-edit-row ve-button-row">
      <button id="ve-bold" class="ve-format-btn" title="Bold">
        <svg viewBox="0 0 20 20" fill="currentColor">
          <path d="M10.187 17H5.773c-.637 0-1.092-.138-1.364-.415-.273-.277-.409-.718-.409-1.323V4.738c0-.617.14-1.062.419-1.332.279-.27.73-.406 1.354-.406h4.68c.69 0 1.288.041 1.793.124.506.083.96.242 1.36.477.341.197.644.447.906.75a3.262 3.262 0 01.808 2.162c0 1.401-.722 2.426-2.167 3.075C15.05 10.175 16 11.315 16 13.01c0 .901-.219 1.641-.658 2.22-.439.58-.996 1.02-1.672 1.32-.675.3-1.422.45-2.24.45h-1.243zM7.9 7.576h3.099c.37 0 .703-.033.997-.098.296-.065.55-.177.765-.337.215-.16.374-.366.478-.62.104-.253.156-.549.156-.888 0-.37-.055-.7-.164-.99a1.547 1.547 0 00-.454-.688 1.915 1.915 0 00-.694-.395 3.069 3.069 0 00-.884-.126H7.9v4.142zm0 7.29h3.43c.397 0 .77-.043 1.114-.127.343-.085.623-.217.839-.397.215-.18.38-.405.495-.676.115-.27.173-.57.173-.896 0-.384-.06-.723-.178-1.017a1.854 1.854 0 00-.498-.73 2.08 2.08 0 00-.76-.433 3.284 3.284 0 00-.97-.14H7.9v4.416z"/>
        </svg>
      </button>
      <button id="ve-italic" class="ve-format-btn" title="Italic">
        <svg viewBox="0 0 20 20" fill="currentColor">
          <path d="M8 1v2h2.747l-3.494 12H5v2h8v-2h-2.747l3.494-12H16V1H8z"/>
        </svg>
      </button>
      <button id="ve-underline" class="ve-format-btn" title="Underline">
        <svg viewBox="0 0 20 20" fill="currentColor">
          <path d="M10 17c3.3 0 6-2.7 6-6V3.5a.5.5 0 01-1 0V11c0 2.8-2.2 5-5 5s-5-2.2-5-5V3.5a.5.5 0 00-1 0V11c0 3.3 2.7 6 6 6z"/>
          <path d="M3.5 18.5h13a.5.5 0 010 1h-13a.5.5 0 010-1z"/>
        </svg>
      </button>
      <button id="ve-strikethrough" class="ve-format-btn" title="Strikethrough">
        <svg viewBox="0 0 20 20" fill="currentColor">
          <path d="M10 2c-2.8 0-4.8 1.2-5.7 2.8-.2.4.1.7.5.7h1c.2 0 .4-.1.5-.3.7-.9 1.9-1.5 3.7-1.5 2.2 0 3.3.9 3.3 2.1 0 .7-.3 1.3-1 1.7-.3.2-.7.4-1.2.5H3.5c-.3 0-.5.2-.5.5s.2.5.5.5h13c.3 0 .5-.2.5-.5s-.2-.5-.5-.5h-3.2c.1-.1.2-.1.3-.2.9-.6 1.4-1.6 1.4-2.7C15 3.2 13.1 2 10 2zM7.8 11c-.2.3-.3.7-.3 1.2 0 1.6 1.2 2.8 3.5 2.8 1.9 0 3.1-.9 3.7-1.6.2-.2.2-.5 0-.7l-.7-.7c-.2-.2-.5-.2-.7 0-.3.3-1 .8-2.3.8-1.3 0-1.8-.5-1.8-1.1 0-.2.1-.4.2-.6.1-.2 0-.5-.2-.6l-1-.4c-.2-.1-.4 0-.4.3v.6z"/>
        </svg>
      </button>
    </div>
    
    <!-- Alignment and List Buttons Row -->
    <div class="ve-inline-edit-row ve-button-row">
      <button id="ve-align-left" class="ve-format-btn" title="Align Left">
        <svg viewBox="0 0 20 20" fill="currentColor">
          <path d="M2 4a1 1 0 011-1h14a1 1 0 110 2H3a1 1 0 01-1-1zm0 4a1 1 0 011-1h10a1 1 0 110 2H3a1 1 0 01-1-1zm0 4a1 1 0 011-1h14a1 1 0 110 2H3a1 1 0 01-1-1zm0 4a1 1 0 011-1h10a1 1 0 110 2H3a1 1 0 01-1-1z"/>
        </svg>
      </button>
      <button id="ve-align-center" class="ve-format-btn" title="Align Center">
        <svg viewBox="0 0 20 20" fill="currentColor">
          <path d="M2 4a1 1 0 011-1h14a1 1 0 110 2H3a1 1 0 01-1-1zm3 4a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1zm-3 4a1 1 0 011-1h14a1 1 0 110 2H3a1 1 0 01-1-1zm3 4a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1z"/>
        </svg>
      </button>
      <button id="ve-align-right" class="ve-format-btn" title="Align Right">
        <svg viewBox="0 0 20 20" fill="currentColor">
          <path d="M2 4a1 1 0 011-1h14a1 1 0 110 2H3a1 1 0 01-1-1zm5 4a1 1 0 011-1h10a1 1 0 110 2H7a1 1 0 01-1-1zm-5 4a1 1 0 011-1h14a1 1 0 110 2H3a1 1 0 01-1-1zm5 4a1 1 0 011-1h10a1 1 0 110 2H7a1 1 0 01-1-1z"/>
        </svg>
      </button>
      <button id="ve-align-justify" class="ve-format-btn" title="Justify">
        <svg viewBox="0 0 20 20" fill="currentColor">
          <path d="M2 4a1 1 0 011-1h14a1 1 0 110 2H3a1 1 0 01-1-1zm0 4a1 1 0 011-1h14a1 1 0 110 2H3a1 1 0 01-1-1zm0 4a1 1 0 011-1h14a1 1 0 110 2H3a1 1 0 01-1-1zm0 4a1 1 0 011-1h14a1 1 0 110 2H3a1 1 0 01-1-1z"/>
        </svg>
      </button>
      <div class="ve-separator"></div>
      <button id="ve-list-bullet" class="ve-format-btn" title="Bullet List">
        <svg viewBox="0 0 20 20" fill="currentColor">
          <path d="M7 4a1 1 0 011-1h9a1 1 0 110 2H8a1 1 0 01-1-1zM7 9a1 1 0 011-1h9a1 1 0 110 2H8a1 1 0 01-1-1zm0 5a1 1 0 011-1h9a1 1 0 110 2H8a1 1 0 01-1-1z"/>
          <circle cx="4" cy="4" r="1.5"/>
          <circle cx="4" cy="9" r="1.5"/>
          <circle cx="4" cy="14" r="1.5"/>
        </svg>
      </button>
      <button id="ve-list-numbered" class="ve-format-btn" title="Numbered List">
        <svg viewBox="0 0 20 20" fill="currentColor">
          <path d="M7 4a1 1 0 011-1h9a1 1 0 110 2H8a1 1 0 01-1-1zM7 9a1 1 0 011-1h9a1 1 0 110 2H8a1 1 0 01-1-1zm0 5a1 1 0 011-1h9a1 1 0 110 2H8a1 1 0 01-1-1z"/>
          <path d="M3 2.5v3h1v-2h1v-1H3.5a.5.5 0 00-.5.5zM3 7.5v1h2v1H3v1h2.5a.5.5 0 00.5-.5v-2a.5.5 0 00-.5-.5H3zm0 5v1h2v1H3v1h2.5a.5.5 0 00.5-.5v-2a.5.5 0 00-.5-.5H3z"/>
        </svg>
      </button>
      <button id="ve-indent-increase" class="ve-format-btn" title="Increase Indent">
        <svg viewBox="0 0 20 20" fill="currentColor">
          <path d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"/>
          <path d="M7 8v4l3-2-3-2z"/>
        </svg>
      </button>
      <button id="ve-indent-decrease" class="ve-format-btn" title="Decrease Indent">
        <svg viewBox="0 0 20 20" fill="currentColor">
          <path d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"/>
          <path d="M10 8v4l-3-2 3-2z"/>
        </svg>
      </button>
    </div>
    
    <!-- Additional Options -->
    <div class="ve-inline-edit-row ve-button-row">
      <button id="ve-add-link" class="ve-format-btn" title="Add Link">
        <svg viewBox="0 0 20 20" fill="currentColor">
          <path d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z"/>
        </svg>
      </button>
      <button id="ve-undo" class="ve-format-btn" title="Undo">
        <svg viewBox="0 0 20 20" fill="currentColor">
          <path d="M8 4a5 5 0 00-5 5v1a1 1 0 102 0V9a3 3 0 016 0v6a3 3 0 11-6 0v-1a1 1 0 10-2 0v1a5 5 0 0010 0V9a5 5 0 00-5-5z"/>
        </svg>
      </button>
      <button id="ve-redo" class="ve-format-btn" title="Redo">
        <svg viewBox="0 0 20 20" fill="currentColor" style="transform: scaleX(-1);">
          <path d="M8 4a5 5 0 00-5 5v1a1 1 0 102 0V9a3 3 0 016 0v6a3 3 0 11-6 0v-1a1 1 0 10-2 0v1a5 5 0 0010 0V9a5 5 0 00-5-5z"/>
        </svg>
      </button>
    </div>
  </div>
  <div class="ve-inline-edit-footer">
    <button id="ve-inline-edit-discard" class="ve-inline-edit-btn-secondary">Discard</button>
    <button id="ve-inline-edit-done" class="ve-inline-edit-btn-primary">Done</button>
  </div>
</div>
`;

const inlineEditModalCSS = `
#ve-inline-edit-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  z-index: 100001;
  display: none;
  align-items: center;
  justify-content: center;
}

#ve-inline-edit-overlay.ve-inline-edit-visible {
  display: flex;
}

.ve-inline-edit-modal {
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  width: 600px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.04);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.ve-inline-edit-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #e5e7eb;
  background: #f9fafb;
}

.ve-inline-edit-header h3 {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  color: #374151;
}

.ve-inline-edit-close {
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  color: #6b7280;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: background-color 0.15s ease;
}

.ve-inline-edit-close:hover {
  background-color: #f3f4f6;
  color: #4b5563;
}

.ve-inline-edit-warning {
  padding: 10px 20px;
  background: #fef3c7;
  color: #92400e;
  font-size: 12px;
  border-bottom: 1px solid #fde68a;
}

.ve-inline-edit-body {
  padding: 20px;
  background: #ffffff;
}

.ve-inline-edit-row {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
  align-items: center;
}

.ve-inline-edit-row.ve-button-row {
  flex-wrap: wrap;
}

.ve-inline-select {
  padding: 8px 10px;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  font-size: 13px;
  background: #ffffff;
  color: #374151;
  cursor: pointer;
  min-width: 120px;
  transition: border-color 0.15s ease;
}

.ve-inline-select:hover {
  border-color: #d1d5db;
}

.ve-inline-select:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.ve-inline-input {
  padding: 8px 10px;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  font-size: 13px;
  background: #ffffff;
  color: #374151;
  width: 80px;
  transition: border-color 0.15s ease;
}

.ve-inline-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.ve-format-btn {
  width: 36px;
  height: 36px;
  padding: 0;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  background: #ffffff;
  color: #6b7280;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s ease;
}

.ve-format-btn:hover {
  background: #f9fafb;
  color: #4b5563;
  border-color: #d1d5db;
}

.ve-format-btn:active,
.ve-format-btn.active {
  background: #3b82f6;
  color: #ffffff;
  border-color: #3b82f6;
}

.ve-format-btn svg {
  width: 18px;
  height: 18px;
}

.ve-separator {
  width: 1px;
  height: 24px;
  background: #e5e7eb;
  margin: 0 4px;
}

.ve-inline-edit-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 16px 20px;
  border-top: 1px solid #e5e7eb;
  background: #f9fafb;
}

.ve-inline-edit-btn-primary {
  padding: 8px 16px;
  background: #3b82f6;
  color: #ffffff;
  border: none;
  border-radius: 4px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.15s ease;
}

.ve-inline-edit-btn-primary:hover {
  background: #2563eb;
}

.ve-inline-edit-btn-secondary {
  padding: 8px 16px;
  background: #ffffff;
  color: #4b5563;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;
}

.ve-inline-edit-btn-secondary:hover {
  background: #f9fafb;
  border-color: #d1d5db;
}
`;

//---------------------------------------------------HTML,CSS VARIABLES--------------------------------------------------------//

console.log('Visual Editor loaded on:', window.location.href);

let isDesignMode = false;
let selectedElement = null;
let overlayElement = null;
let textEditMode = false;
let currentEditingElement = null;
let contextMenuOverlay = null;
let rightSidebarOverlay = null; // New variable for right sidebar

// Change tracking system with improved selector generation
let changesTracker = {
  changes: [],
  originalValues: new WeakMap(),
  undoStack: [], // ADD THIS
  redoStack: [], // ADD THIS

  // Track a new change
  trackChange: function (element, propertyType, oldValue, newValue) {
    const selector = this.generatePathSelector(element);
    const existingChangeIndex = this.changes.findIndex(
      (change) =>
        change.selector === selector && change.property === propertyType,
    );

    const changeData = {
      selector: selector,
      property: propertyType,
      originalValue: oldValue,
      newValue: newValue,
      timestamp: new Date().toISOString(),
    };

    if (existingChangeIndex !== -1) {
      // Update existing change but keep the original value
      this.changes[existingChangeIndex].newValue = newValue;
      this.changes[existingChangeIndex].timestamp = changeData.timestamp;
    } else {
      this.changes.push(changeData);
    }

    console.log('Change tracked:', changeData);
    this.saveStateForUndo(element, propertyType, oldValue, newValue);
  },

  // Generate a simplified path selector (main selector now)
  generatePathSelector: function (element) {
    let path = [];
    let current = element;
    let depth = 0;

    while (current && current.nodeType === Node.ELEMENT_NODE && depth < 8) {
      let selector = current.tagName.toLowerCase();

      // Add index if there are siblings with same tag
      if (current.parentNode) {
        const siblings = Array.from(current.parentNode.children).filter(
          (e) => e.tagName === current.tagName,
        );

        if (siblings.length > 1) {
          const index = siblings.indexOf(current) + 1;
          selector += `:nth-of-type(${index})`;
        }
      }

      path.unshift(selector);

      // Stop at body or if element has an ID
      if (current === document.body || current.id) {
        if (current.id) {
          path[0] = '#' + CSS.escape(current.id) + ' > ' + path[0];
        }
        break;
      }

      current = current.parentNode;
      depth++;
    }

    return path.join(' > ');
  },

  // Store original value before modification
  storeOriginalValue: function (element, propertyType) {
    if (!this.originalValues.has(element)) {
      this.originalValues.set(element, {});
    }

    const elementData = this.originalValues.get(element);

    if (!elementData[propertyType]) {
      if (propertyType === 'text') {
        elementData[propertyType] = element.textContent;
      } else if (propertyType === 'backgroundColor') {
        const computedStyle = window.getComputedStyle(element);
        elementData[propertyType] = computedStyle.backgroundColor;
      } else if (propertyType === 'color') {
        const computedStyle = window.getComputedStyle(element);
        elementData[propertyType] = computedStyle.color;
      } else if (propertyType === 'width') {
        elementData[propertyType] =
          element.style.width || window.getComputedStyle(element).width;
      } else if (propertyType === 'height') {
        elementData[propertyType] =
          element.style.height || window.getComputedStyle(element).height;
      } else if (propertyType === 'id') {
        elementData[propertyType] = element.id;
      } else if (propertyType === 'class') {
        elementData[propertyType] = element.className;
      } else if (propertyType === 'display') {
        elementData[propertyType] =
          element.style.display || window.getComputedStyle(element).display;
      }
    }

    return elementData[propertyType];
  },

  // Get all changes for saving
  getChangesForSave: function () {
    return {
      url: window.location.href,
      totalChanges: this.changes.length,
      changes: this.changes,
      timestamp: new Date().toISOString(),
    };
  },

  // Clear all tracked changes
  clearChanges: function () {
    this.changes = [];
    this.originalValues = new WeakMap();
    console.log('All changes cleared');
  },

  //-----------------------------------------------UNDO AND REDO RELATED METHODS-----------------------------------------------//
  saveStateForUndo: function (element, propertyType, oldValue, newValue) {
    this.undoStack.push({
      element: element,
      property: propertyType,
      oldValue: oldValue,
      newValue: newValue,
      timestamp: new Date().toISOString(),
    });

    // Clear redo stack when new change is made
    this.redoStack = [];

    // Update button states
    this.updateUndoRedoButtons();
  },

  // Undo last change
  undo: function () {
    if (this.undoStack.length === 0) return;

    const lastChange = this.undoStack.pop();

    // Apply the undo
    this.applyChange(
      lastChange.element,
      lastChange.property,
      lastChange.oldValue,
    );

    // Add to redo stack
    this.redoStack.push(lastChange);

    // Remove from changes array
    const changeIndex = this.changes.findIndex(
      (c) =>
        c.selector === this.generatePathSelector(lastChange.element) &&
        c.property === lastChange.property,
    );
    if (changeIndex > -1) {
      this.changes.splice(changeIndex, 1);
    }

    this.updateUndoRedoButtons();
    this.updateStatusText(`Undone: ${lastChange.property} change`);
  },

  // Redo last undone change
  redo: function () {
    if (this.redoStack.length === 0) return;

    const changeToRedo = this.redoStack.pop();

    // Apply the redo
    this.applyChange(
      changeToRedo.element,
      changeToRedo.property,
      changeToRedo.newValue,
    );

    // Add back to undo stack
    this.undoStack.push(changeToRedo);

    // Add back to changes array - but WITHOUT calling saveStateForUndo
    const selector = this.generatePathSelector(changeToRedo.element);
    const existingChangeIndex = this.changes.findIndex(
      (change) =>
        change.selector === selector &&
        change.property === changeToRedo.property,
    );

    if (existingChangeIndex !== -1) {
      this.changes[existingChangeIndex].newValue = changeToRedo.newValue;
    } else {
      this.changes.push({
        selector: selector,
        property: changeToRedo.property,
        originalValue: changeToRedo.oldValue,
        newValue: changeToRedo.newValue,
        timestamp: new Date().toISOString(),
      });
    }

    this.updateUndoRedoButtons();
    this.updateStatusText(`Redone: ${changeToRedo.property} change`);
    // REMOVE the incorrect saveStateForUndo line that was here
  },

  // Apply a change to an element
  applyChange: function (element, property, value) {
    switch (property) {
      case 'backgroundColor':
        element.style.backgroundColor = value;
        break;
      case 'color':
        element.style.color = value;
        break;
      case 'width':
        element.style.width = value;
        break;
      case 'height':
        element.style.height = value;
        break;
      case 'text':
        element.textContent = value;
        break;
      case 'id':
        element.id = value;
        break;
      case 'class':
        element.className = value;
        break;
      case 'display':
        element.style.display = value;
        break;
      case 'position':
        // Parse position values
        const positions = value.match(/left:\s*([^,]+),\s*top:\s*(.+)/);
        if (positions) {
          element.style.left = positions[1];
          element.style.top = positions[2];
        }
        break;
      case 'size':
        // Parse size values
        const sizes = value.match(/(\d+px)\s*×\s*(\d+px)/);
        if (sizes) {
          element.style.width = sizes[1];
          element.style.height = sizes[2];
        }
        break;
      // Add other properties as needed
      default:
        if (element.style[property] !== undefined) {
          element.style[property] = value;
        }
    }
  },

  // Update undo/redo button states
  updateUndoRedoButtons: function () {
    const undoBtn = document.querySelector('[title="Undo"]');
    const redoBtn = document.querySelector('[title="Redo"]');

    if (undoBtn) {
      undoBtn.disabled = this.undoStack.length === 0;
      undoBtn.style.opacity = this.undoStack.length === 0 ? '0.5' : '1';
    }

    if (redoBtn) {
      redoBtn.disabled = this.redoStack.length === 0;
      redoBtn.style.opacity = this.redoStack.length === 0 ? '0.5' : '1';
    }
  },

  // Helper to update status text
  updateStatusText: function (text) {
    const statusText = document.getElementById('ve-status');
    if (statusText) {
      statusText.textContent = text;
    }
  },
};

//-------------------------------------RIGHT SIDEBAR RELATED FUNCTIONALITIES-----------------------------------------------------//

// Function That Creates and inject right sidebar overlay
function createRightSidebar() {
  // Remove existing sidebar if it exists
  if (rightSidebarOverlay) {
    rightSidebarOverlay.remove();
  }

  // Create sidebar element
  rightSidebarOverlay = document.createElement('div');
  rightSidebarOverlay.id = 've-right-sidebar';
  rightSidebarOverlay.innerHTML = rightSidebarOverlayHTML;

  // Add CSS if not already added
  if (!document.getElementById('ve-right-sidebar-styles')) {
    const style = document.createElement('style');
    style.id = 've-right-sidebar-styles';
    style.innerHTML = rightSidebarOverlayCSS;
    document.head.appendChild(style);
  }

  document.body.appendChild(rightSidebarOverlay);

  // Setup event listeners for the sidebar
  setupSidebarEventListeners();
}

// Function That Setups Up Event Listeners for The Elements Inside The right Sidebar
function setupSidebarEventListeners() {
  const closeBtn = document.getElementById('ve-sidebar-close');
  const widthInput = document.getElementById('ve-element-width');
  const heightInput = document.getElementById('ve-element-height');
  const widthUnit = document.getElementById('ve-width-unit');
  const heightUnit = document.getElementById('ve-height-unit');
  const idInput = document.getElementById('ve-element-id');
  const classInput = document.getElementById('ve-element-class');

  // Background color elements
  const bgColorPicker = document.getElementById('ve-bg-color-picker');
  const bgColorText = document.getElementById('ve-bg-color-text');
  const bgColorPreview = document.getElementById('ve-bg-color-preview');
  const bgColorClear = document.getElementById('ve-bg-color-clear');

  if (closeBtn) {
    closeBtn.addEventListener('click', hideRightSidebar);
  }

  // Width change handler
  if (widthInput) {
    widthInput.addEventListener('input', function () {
      if (selectedElement) {
        const unit = widthUnit.value;
        const value = this.value;
        if (value) {
          const originalWidth = changesTracker.storeOriginalValue(
            selectedElement,
            'width',
          );
          selectedElement.style.width = value + unit;
          changesTracker.trackChange(
            selectedElement,
            'width',
            originalWidth,
            value + unit,
          );
        }
      }
    });
  }

  // Height change handler
  if (heightInput) {
    heightInput.addEventListener('input', function () {
      if (selectedElement) {
        const unit = heightUnit.value;
        const value = this.value;
        if (value) {
          const originalHeight = changesTracker.storeOriginalValue(
            selectedElement,
            'height',
          );
          selectedElement.style.height = value + unit;
          changesTracker.trackChange(
            selectedElement,
            'height',
            originalHeight,
            value + unit,
          );
        }
      }
    });
  }

  // Width unit change handler
  if (widthUnit) {
    widthUnit.addEventListener('change', function () {
      const value = widthInput.value;
      if (selectedElement && value) {
        const originalWidth = changesTracker.storeOriginalValue(
          selectedElement,
          'width',
        );
        selectedElement.style.width = value + this.value;
        changesTracker.trackChange(
          selectedElement,
          'width',
          originalWidth,
          value + this.value,
        );
      }
    });
  }

  // Height unit change handler
  if (heightUnit) {
    heightUnit.addEventListener('change', function () {
      const value = heightInput.value;
      if (selectedElement && value) {
        const originalHeight = changesTracker.storeOriginalValue(
          selectedElement,
          'height',
        );
        selectedElement.style.height = value + this.value;
        changesTracker.trackChange(
          selectedElement,
          'height',
          originalHeight,
          value + this.value,
        );
      }
    });
  }

  // ID change handler
  if (idInput) {
    idInput.addEventListener('input', function () {
      if (selectedElement) {
        const originalId = changesTracker.storeOriginalValue(
          selectedElement,
          'id',
        );
        selectedElement.id = this.value;
        changesTracker.trackChange(
          selectedElement,
          'id',
          originalId,
          this.value,
        );
      }
    });
  }

  // Class change handler
  if (classInput) {
    classInput.addEventListener('input', function () {
      if (selectedElement) {
        const originalClass = changesTracker.storeOriginalValue(
          selectedElement,
          'class',
        );
        selectedElement.className = this.value;
        changesTracker.trackChange(
          selectedElement,
          'class',
          originalClass,
          this.value,
        );
      }
    });
  }

  // Background color picker handler
  if (bgColorPicker) {
    bgColorPicker.addEventListener('input', function () {
      if (selectedElement) {
        const color = this.value;
        const originalBgColor = changesTracker.storeOriginalValue(
          selectedElement,
          'backgroundColor',
        );

        // Update element background
        selectedElement.style.backgroundColor = color;

        // Update text input and preview
        bgColorText.value = color;
        bgColorPreview.style.backgroundColor = color;

        changesTracker.trackChange(
          selectedElement,
          'backgroundColor',
          originalBgColor,
          color,
        );
      }
    });
  }

  // Background color text input handler
  if (bgColorText) {
    bgColorText.addEventListener('input', function () {
      if (selectedElement) {
        const color = this.value;

        // Validate color format (basic validation)
        if (isValidColor(color)) {
          const originalBgColor = changesTracker.storeOriginalValue(
            selectedElement,
            'backgroundColor',
          );

          // Update element background
          selectedElement.style.backgroundColor = color;

          // Update color picker and preview
          if (color.startsWith('#') && color.length === 7) {
            bgColorPicker.value = color;
          }
          bgColorPreview.style.backgroundColor = color;

          changesTracker.trackChange(
            selectedElement,
            'backgroundColor',
            originalBgColor,
            color,
          );
        }
      }
    });

    // Handle Enter key to apply color
    bgColorText.addEventListener('keypress', function (e) {
      if (e.key === 'Enter') {
        this.blur();
      }
    });
  }

  // Background color clear button handler
  if (bgColorClear) {
    bgColorClear.addEventListener('click', function () {
      if (selectedElement) {
        const originalBgColor = changesTracker.storeOriginalValue(
          selectedElement,
          'backgroundColor',
        );

        // Clear background color
        selectedElement.style.backgroundColor = '';

        // Clear inputs and preview
        bgColorPicker.value = '#000000';
        bgColorText.value = '';
        bgColorPreview.style.backgroundColor = '';

        changesTracker.trackChange(
          selectedElement,
          'backgroundColor',
          originalBgColor,
          '',
        );
      }
    });
  }
}

// Helper function to validate color format
function isValidColor(color) {
  if (!color) return false;

  // Check for hex color
  if (color.match(/^#([0-9A-F]{3}){1,2}$/i)) {
    return true;
  }

  // Check for rgb/rgba
  if (
    color.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*(\d+(?:\.\d+)?))?\)$/)
  ) {
    return true;
  }

  // Check for named colors (basic check)
  const s = new Option().style;
  s.color = color;
  return s.color !== '';
}
// Function That Gets the Default Properties From The Selected Element
function showRightSidebar() {
  if (!rightSidebarOverlay) {
    createRightSidebar();
  }

  if (selectedElement) {
    // Get computed styles
    const computedStyle = window.getComputedStyle(selectedElement);

    // Get and set width
    const width = selectedElement.style.width || computedStyle.width;
    const widthParsed = parseCSSValue(width);
    const widthInput = document.getElementById('ve-element-width');
    const widthUnitSelect = document.getElementById('ve-width-unit');

    if (widthInput) {
      widthInput.value = widthParsed.number;
    }
    if (widthUnitSelect) {
      // Check if the unit exists in options, otherwise default to px
      const widthUnitOption = Array.from(widthUnitSelect.options).find(
        (opt) => opt.value === widthParsed.unit,
      );
      if (widthUnitOption) {
        widthUnitSelect.value = widthParsed.unit;
      } else {
        widthUnitSelect.value = 'px';
        if (widthInput && widthParsed.number) {
          // If unit not found, show the full value in the input
          widthInput.value = width;
        }
      }
    }

    // Get and set height
    const height = selectedElement.style.height || computedStyle.height;
    const heightParsed = parseCSSValue(height);
    const heightInput = document.getElementById('ve-element-height');
    const heightUnitSelect = document.getElementById('ve-height-unit');

    if (heightInput) {
      heightInput.value = heightParsed.number;
    }
    if (heightUnitSelect) {
      // Check if the unit exists in options, otherwise default to px
      const heightUnitOption = Array.from(heightUnitSelect.options).find(
        (opt) => opt.value === heightParsed.unit,
      );
      if (heightUnitOption) {
        heightUnitSelect.value = heightParsed.unit;
      } else {
        heightUnitSelect.value = 'px';
        if (heightInput && heightParsed.number) {
          // If unit not found, show the full value in the input
          heightInput.value = height;
        }
      }
    }

    // Set ID
    const idInput = document.getElementById('ve-element-id');
    if (idInput) {
      idInput.value = selectedElement.id || '';
    }

    // Set class
    const classInput = document.getElementById('ve-element-class');
    if (classInput) {
      classInput.value = selectedElement.className || '';
    }

    // Get and set background color
    const bgColorPicker = document.getElementById('ve-bg-color-picker');
    const bgColorText = document.getElementById('ve-bg-color-text');
    const bgColorPreview = document.getElementById('ve-bg-color-preview');

    // Get background color from inline style or computed style
    const bgColor =
      selectedElement.style.backgroundColor || computedStyle.backgroundColor;

    if (
      bgColor &&
      bgColor !== 'rgba(0, 0, 0, 0)' &&
      bgColor !== 'transparent'
    ) {
      // Convert RGB/RGBA to hex for color picker
      let colorForPicker = bgColor;
      let colorForText = bgColor;

      // If it's an RGB/RGBA color, convert to hex
      if (bgColor.startsWith('rgb')) {
        const hexColor = rgbToHex(bgColor);
        if (hexColor) {
          colorForPicker = hexColor;
          colorForText = hexColor;
        }
      } else if (bgColor.startsWith('#')) {
        // Already hex
        colorForPicker = bgColor;
        colorForText = bgColor;
      } else {
        // Named color - try to convert to hex
        const tempDiv = document.createElement('div');
        tempDiv.style.color = bgColor;
        document.body.appendChild(tempDiv);
        const rgbColor = window.getComputedStyle(tempDiv).color;
        document.body.removeChild(tempDiv);

        if (rgbColor) {
          const hexColor = rgbToHex(rgbColor);
          if (hexColor) {
            colorForPicker = hexColor;
          }
        }
        colorForText = bgColor; // Keep named color in text field
      }

      if (bgColorPicker) {
        bgColorPicker.value = colorForPicker;
      }
      if (bgColorText) {
        bgColorText.value = colorForText;
      }
      if (bgColorPreview) {
        bgColorPreview.style.backgroundColor = bgColor;
      }
    } else {
      // No background color or transparent
      if (bgColorPicker) {
        bgColorPicker.value = '#ffffff'; // Default to white
      }
      if (bgColorText) {
        bgColorText.value = '';
      }
      if (bgColorPreview) {
        bgColorPreview.style.backgroundColor = '';
      }
    }

    console.log('Element properties loaded:', {
      width: width,
      height: height,
      id: selectedElement.id,
      class: selectedElement.className,
      backgroundColor: bgColor,
    });
  }

  rightSidebarOverlay.classList.add('ve-sidebar-visible');
}
// Helper function to convert RGB/RGBA to Hex
function rgbToHex(rgb) {
  // Handle both rgb and rgba
  const match = rgb.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*[\d.]+)?\)$/);
  if (match) {
    const r = parseInt(match[1]);
    const g = parseInt(match[2]);
    const b = parseInt(match[3]);

    // Convert to hex
    const toHex = (n) => {
      const hex = n.toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    };

    return '#' + toHex(r) + toHex(g) + toHex(b);
  }

  // Return null if not a valid rgb/rgba format
  return null;
}
// Function That Hides right sidebar
function hideRightSidebar() {
  if (rightSidebarOverlay) {
    rightSidebarOverlay.classList.remove('ve-sidebar-visible');
  }
}

// Parse CSS value and unit
function parseCSSValue(value) {
  if (
    !value ||
    value === 'auto' ||
    value === 'inherit' ||
    value === 'initial'
  ) {
    return { number: '', unit: value || 'auto' };
  }

  const match = value.match(/^([\d.]+)(.*)$/);
  if (match) {
    return {
      number: match[1],
      unit: match[2] || 'px',
    };
  }

  return { number: '', unit: 'px' };
}

//---------------------------------------------------------------------------------------------------------------------------------//

//--------------------------------------------------HIDE ELEMENT FUNCTIONALITIES---------------------------------------------------//

// Hide/Show element functions
function hideElement(element) {
  if (!element) return;

  // Store original display value before hiding
  const originalDisplay = changesTracker.storeOriginalValue(element, 'display');

  // Hide the element
  element.style.display = 'none';
  element.setAttribute('data-ve-hidden', 'true');

  // Track the change
  changesTracker.trackChange(
    element,
    'display',
    originalDisplay || 'block',
    'none',
  );

  // Update status
  const statusText = document.getElementById('ve-status');
  if (statusText) {
    statusText.textContent = `Element hidden! (${changesTracker.changes.length} total changes)`;
  }
}

function showElement(element) {
  if (!element) return;

  const originalDisplay =
    changesTracker.originalValues.get(element)?.display || '';
  element.style.display = originalDisplay;
  element.removeAttribute('data-ve-hidden');

  const statusText = document.getElementById('ve-status');
  if (statusText) {
    statusText.textContent = `Element shown!`;
  }
}
//---------------------------------------------------------------------------------------------------------------------------------//
//------------------------------------------------EDIT HTML OVERLAY FUNCTIONALITIES-------------------------------------------------//
let htmlEditorOverlay = null;
let editingElementHTML = null;

function createHTMLEditor() {
  if (htmlEditorOverlay) {
    htmlEditorOverlay.remove();
  }

  htmlEditorOverlay = document.createElement('div');
  htmlEditorOverlay.id = 've-html-editor-overlay';
  htmlEditorOverlay.innerHTML = htmlEditorModalHTML;

  if (!document.getElementById('ve-html-editor-styles')) {
    const style = document.createElement('style');
    style.id = 've-html-editor-styles';
    style.innerHTML = htmlEditorModalCSS;
    document.head.appendChild(style);
  }

  document.body.appendChild(htmlEditorOverlay);
  setupHTMLEditorEventListeners();
}

function setupHTMLEditorEventListeners() {
  const closeBtn = document.getElementById('ve-html-editor-close');
  const discardBtn = document.getElementById('ve-html-editor-discard');
  const doneBtn = document.getElementById('ve-html-editor-done');
  const textarea = document.getElementById('ve-html-editor-textarea');
  const linesDiv = document.querySelector('.ve-html-editor-lines');

  if (closeBtn) closeBtn.addEventListener('click', hideHTMLEditor);
  if (discardBtn) discardBtn.addEventListener('click', hideHTMLEditor);

  if (doneBtn) {
    doneBtn.addEventListener('click', function () {
      applyHTMLChanges();
      hideHTMLEditor();
    });
  }

  if (textarea) {
    textarea.addEventListener('input', updateLineNumbers);
    textarea.addEventListener('scroll', function () {
      linesDiv.scrollTop = textarea.scrollTop;
    });
  }
}

function showHTMLEditor() {
  if (!htmlEditorOverlay) {
    createHTMLEditor();
  }

  if (selectedElement) {
    editingElementHTML = selectedElement;
    const textarea = document.getElementById('ve-html-editor-textarea');

    // Get the outer HTML and format it
    let htmlContent = selectedElement.outerHTML;

    // Basic formatting (you can enhance this)
    htmlContent = formatHTML(htmlContent);

    if (textarea) {
      textarea.value = htmlContent;
      updateLineNumbers();
    }

    htmlEditorOverlay.classList.add('ve-html-editor-visible');
  }
}

function hideHTMLEditor() {
  if (htmlEditorOverlay) {
    htmlEditorOverlay.classList.remove('ve-html-editor-visible');
  }
}

function formatHTML(html) {
  // Basic HTML formatting - enhance as needed
  let formatted = html;
  let indent = 0;

  formatted = formatted.replace(/></g, '>\n<');
  // Add more formatting logic here

  return formatted;
}

function updateLineNumbers() {
  const textarea = document.getElementById('ve-html-editor-textarea');
  const linesDiv = document.querySelector('.ve-html-editor-lines');

  if (textarea && linesDiv) {
    const lines = textarea.value.split('\n');
    let lineNumbers = '';

    for (let i = 1; i <= lines.length; i++) {
      lineNumbers += i + '\n';
    }

    linesDiv.textContent = lineNumbers;
  }
}

function applyHTMLChanges() {
  const textarea = document.getElementById('ve-html-editor-textarea');

  if (textarea && editingElementHTML) {
    const newHTML = textarea.value;
    const originalHTML = changesTracker.storeOriginalValue(
      editingElementHTML,
      'outerHTML',
    );

    // Create a temporary container to parse the new HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = newHTML;
    const newElement = tempDiv.firstElementChild;

    if (newElement) {
      // Replace the element in the DOM
      editingElementHTML.parentNode.replaceChild(
        newElement,
        editingElementHTML,
      );

      // Update references
      selectedElement = newElement;
      editingElementHTML = newElement;

      // Track the change
      changesTracker.trackChange(
        newElement,
        'outerHTML',
        originalHTML,
        newHTML,
      );

      const statusText = document.getElementById('ve-status');
      if (statusText) {
        statusText.textContent = `HTML updated! (${changesTracker.changes.length} total changes)`;
      }
    }
  }
}

//---------------------------------------------------------------------------------------------------------------------------------//

//----------------------------------------------MOVE/RESIVE RELATED FUNCTIONALITIES-----------------------------------------------//

// Move/Resize Modal Functions
let moveResizeOverlay = null;
let originalPosition = null;
let originalSize = null;

function createMoveResizeModal() {
  if (moveResizeOverlay) {
    moveResizeOverlay.remove();
  }

  moveResizeOverlay = document.createElement('div');
  moveResizeOverlay.id = 've-move-resize-overlay';
  moveResizeOverlay.innerHTML = moveResizeModalHTML;

  if (!document.getElementById('ve-move-resize-styles')) {
    const style = document.createElement('style');
    style.id = 've-move-resize-styles';
    style.innerHTML = moveResizeModalCSS;
    document.head.appendChild(style);
  }

  document.body.appendChild(moveResizeOverlay);
  setupMoveResizeEventListeners();
}

function setupMoveResizeEventListeners() {
  const closeBtn = document.getElementById('ve-move-resize-close');
  const discardBtn = document.getElementById('ve-move-resize-discard');
  const doneBtn = document.getElementById('ve-move-resize-done');
  const xInput = document.getElementById('ve-position-x');
  const yInput = document.getElementById('ve-position-y');
  const widthInput = document.getElementById('ve-resize-width');
  const heightInput = document.getElementById('ve-resize-height');
  const bringToFront = document.getElementById('ve-bring-to-front');
  const maintainAspect = document.getElementById('ve-maintain-aspect');

  // Close handlers
  if (closeBtn) closeBtn.addEventListener('click', hideMoveResizeModal);
  if (discardBtn)
    discardBtn.addEventListener('click', () => {
      restoreOriginalPosition();
      hideMoveResizeModal();
    });
  if (doneBtn)
    doneBtn.addEventListener('click', () => {
      applyMoveResizeChanges();
      hideMoveResizeModal();
    });

  // Real-time position updates
  if (xInput) {
    xInput.addEventListener('input', function () {
      if (selectedElement) {
        // Make sure element has position set
        if (
          !selectedElement.style.position ||
          selectedElement.style.position === 'static'
        ) {
          selectedElement.style.position = 'relative';
        }
        selectedElement.style.left = this.value + 'px';
      }
    });
  }

  if (yInput) {
    yInput.addEventListener('input', function () {
      if (selectedElement) {
        // Make sure element has position set
        if (
          !selectedElement.style.position ||
          selectedElement.style.position === 'static'
        ) {
          selectedElement.style.position = 'relative';
        }
        selectedElement.style.top = this.value + 'px';
      }
    });
  }

  if (widthInput) {
    widthInput.addEventListener('input', function () {
      if (selectedElement) {
        const newWidth = this.value + 'px';
        selectedElement.style.width = newWidth;

        // Maintain aspect ratio if checked
        if (maintainAspect && maintainAspect.checked && originalSize) {
          const aspectRatio = originalSize.height / originalSize.width;
          const newHeight = Math.round(this.value * aspectRatio);
          selectedElement.style.height = newHeight + 'px';
          if (heightInput) heightInput.value = newHeight;
        }
      }
    });
  }

  if (heightInput) {
    heightInput.addEventListener('input', function () {
      if (selectedElement) {
        const newHeight = this.value + 'px';
        selectedElement.style.height = newHeight;

        // Maintain aspect ratio if checked
        if (maintainAspect && maintainAspect.checked && originalSize) {
          const aspectRatio = originalSize.width / originalSize.height;
          const newWidth = Math.round(this.value * aspectRatio);
          selectedElement.style.width = newWidth + 'px';
          if (widthInput) widthInput.value = newWidth;
        }
      }
    });
  }

  if (bringToFront) {
    bringToFront.addEventListener('change', function () {
      if (selectedElement && this.checked) {
        const maxZ = Math.max(
          ...Array.from(document.querySelectorAll('*')).map(
            (el) => parseInt(window.getComputedStyle(el).zIndex) || 0,
          ),
        );
        selectedElement.style.zIndex = maxZ + 1;
      }
    });
  }
}

function showMoveResizeModal() {
  if (!moveResizeOverlay) {
    createMoveResizeModal();
  }

  if (selectedElement) {
    // Store original values
    const computed = window.getComputedStyle(selectedElement);
    const rect = selectedElement.getBoundingClientRect();

    originalPosition = {
      left: selectedElement.style.left || '0px',
      top: selectedElement.style.top || '0px',
      position: selectedElement.style.position || 'static',
    };

    originalSize = {
      width: parseInt(computed.width),
      height: parseInt(computed.height),
    };

    // Set current values in inputs
    const xInput = document.getElementById('ve-position-x');
    const yInput = document.getElementById('ve-position-y');
    const widthInput = document.getElementById('ve-resize-width');
    const heightInput = document.getElementById('ve-resize-height');

    if (xInput) xInput.value = parseInt(selectedElement.style.left) || 0;
    if (yInput) yInput.value = parseInt(selectedElement.style.top) || 0;
    if (widthInput) widthInput.value = originalSize.width;
    if (heightInput) heightInput.value = originalSize.height;

    moveResizeOverlay.classList.add('ve-move-resize-visible');
  }
}

function hideMoveResizeModal() {
  if (moveResizeOverlay) {
    moveResizeOverlay.classList.remove('ve-move-resize-visible');
  }
}

function restoreOriginalPosition() {
  if (selectedElement && originalPosition) {
    selectedElement.style.position = originalPosition.position;
    selectedElement.style.left = originalPosition.left;
    selectedElement.style.top = originalPosition.top;
    if (originalSize) {
      selectedElement.style.width = originalSize.width + 'px';
      selectedElement.style.height = originalSize.height + 'px';
    }
  }
}

function applyMoveResizeChanges() {
  if (selectedElement) {
    // Track position changes
    const newLeft = selectedElement.style.left;
    const newTop = selectedElement.style.top;
    const newWidth = selectedElement.style.width;
    const newHeight = selectedElement.style.height;

    if (
      originalPosition &&
      (newLeft !== originalPosition.left || newTop !== originalPosition.top)
    ) {
      changesTracker.trackChange(
        selectedElement,
        'position',
        `left: ${originalPosition.left}, top: ${originalPosition.top}`,
        `left: ${newLeft}, top: ${newTop}`,
      );
    }

    if (originalSize) {
      const currentWidth = parseInt(newWidth);
      const currentHeight = parseInt(newHeight);
      if (
        currentWidth !== originalSize.width ||
        currentHeight !== originalSize.height
      ) {
        changesTracker.trackChange(
          selectedElement,
          'size',
          `${originalSize.width}px × ${originalSize.height}px`,
          `${currentWidth}px × ${currentHeight}px`,
        );
      }
    }

    const statusText = document.getElementById('ve-status');
    if (statusText) {
      statusText.textContent = `Position and size updated! (${changesTracker.changes.length} total changes)`;
    }
  }
}
//---------------------------------------------------------------------------------------------------------------------------------//

//----------------------------------------------INLINE EDIT RELATED FUNCTIONALITIES-----------------------------------------------//

// Inline Edit Modal Functions
let inlineEditOverlay = null;
let originalStyles = null;

function createInlineEditModal() {
  if (inlineEditOverlay) {
    inlineEditOverlay.remove();
    inlineEditOverlay = null;
  }

  inlineEditOverlay = document.createElement('div');
  inlineEditOverlay.id = 've-inline-edit-overlay';
  inlineEditOverlay.innerHTML = inlineEditModalHTML;

  if (!document.getElementById('ve-inline-edit-styles')) {
    const style = document.createElement('style');
    style.id = 've-inline-edit-styles';
    style.innerHTML = inlineEditModalCSS;
    document.head.appendChild(style);
  }

  document.body.appendChild(inlineEditOverlay);
  setupInlineEditEventListeners();
}

function setupInlineEditEventListeners() {
  const closeBtn = document.getElementById('ve-inline-edit-close');
  const discardBtn = document.getElementById('ve-inline-edit-discard');
  const doneBtn = document.getElementById('ve-inline-edit-done');

  // Basic controls
  const fontFamily = document.getElementById('ve-font-family');
  const fontSize = document.getElementById('ve-font-size');

  // Format buttons
  const boldBtn = document.getElementById('ve-bold');
  const italicBtn = document.getElementById('ve-italic');
  const underlineBtn = document.getElementById('ve-underline');
  const strikethroughBtn = document.getElementById('ve-strikethrough');

  // Alignment buttons
  const alignLeftBtn = document.getElementById('ve-align-left');
  const alignCenterBtn = document.getElementById('ve-align-center');
  const alignRightBtn = document.getElementById('ve-align-right');
  const alignJustifyBtn = document.getElementById('ve-align-justify');

  // Close handlers
  if (closeBtn) closeBtn.addEventListener('click', hideInlineEditModal);
  if (discardBtn)
    discardBtn.addEventListener('click', () => {
      restoreOriginalStyles();
      hideInlineEditModal();
    });
  if (doneBtn)
    doneBtn.addEventListener('click', () => {
      applyInlineEditChanges();
      hideInlineEditModal();
    });

  // Font family change
  if (fontFamily) {
    fontFamily.addEventListener('change', function () {
      if (selectedElement) {
        selectedElement.style.fontFamily = this.value;
      }
    });
  }

  // Font size change
  if (fontSize) {
    fontSize.addEventListener('input', function () {
      if (selectedElement) {
        selectedElement.style.fontSize = this.value + 'px';
      }
    });
  }

  // Bold button
  if (boldBtn) {
    boldBtn.addEventListener('click', function () {
      if (selectedElement) {
        const currentWeight =
          window.getComputedStyle(selectedElement).fontWeight;
        if (
          currentWeight === 'bold' ||
          currentWeight === '700' ||
          parseInt(currentWeight) >= 600
        ) {
          selectedElement.style.fontWeight = 'normal';
          this.classList.remove('active');
        } else {
          selectedElement.style.fontWeight = 'bold';
          this.classList.add('active');
        }
      }
    });
  }

  // Italic button
  if (italicBtn) {
    italicBtn.addEventListener('click', function () {
      if (selectedElement) {
        const currentStyle = window.getComputedStyle(selectedElement).fontStyle;
        if (currentStyle === 'italic') {
          selectedElement.style.fontStyle = 'normal';
          this.classList.remove('active');
        } else {
          selectedElement.style.fontStyle = 'italic';
          this.classList.add('active');
        }
      }
    });
  }

  // Underline button
  if (underlineBtn) {
    underlineBtn.addEventListener('click', function () {
      if (selectedElement) {
        const currentDecoration =
          window.getComputedStyle(selectedElement).textDecoration;
        if (currentDecoration.includes('underline')) {
          selectedElement.style.textDecoration = 'none';
          this.classList.remove('active');
        } else {
          selectedElement.style.textDecoration = 'underline';
          this.classList.add('active');
        }
      }
    });
  }

  // Strikethrough button
  if (strikethroughBtn) {
    strikethroughBtn.addEventListener('click', function () {
      if (selectedElement) {
        const currentDecoration =
          window.getComputedStyle(selectedElement).textDecoration;
        if (currentDecoration.includes('line-through')) {
          selectedElement.style.textDecoration = 'none';
          this.classList.remove('active');
        } else {
          selectedElement.style.textDecoration = 'line-through';
          this.classList.add('active');
        }
      }
    });
  }

  // Alignment buttons
  const alignmentButtons = [
    { btn: alignLeftBtn, value: 'left' },
    { btn: alignCenterBtn, value: 'center' },
    { btn: alignRightBtn, value: 'right' },
    { btn: alignJustifyBtn, value: 'justify' },
  ];

  alignmentButtons.forEach(({ btn, value }) => {
    if (btn) {
      btn.addEventListener('click', function () {
        if (selectedElement) {
          selectedElement.style.textAlign = value;
          // Remove active class from all alignment buttons
          alignmentButtons.forEach(({ btn: b }) =>
            b?.classList.remove('active'),
          );
          // Add active class to clicked button
          this.classList.add('active');
        }
      });
    }
  });
}

function showInlineEditModal() {
  if (!inlineEditOverlay) {
    createInlineEditModal();
  }

  if (selectedElement) {
    // Store original styles
    const computed = window.getComputedStyle(selectedElement);
    originalStyles = {
      fontFamily: selectedElement.style.fontFamily || computed.fontFamily,
      fontSize: selectedElement.style.fontSize || computed.fontSize,
      fontWeight: selectedElement.style.fontWeight || computed.fontWeight,
      fontStyle: selectedElement.style.fontStyle || computed.fontStyle,
      textDecoration:
        selectedElement.style.textDecoration || computed.textDecoration,
      textAlign: selectedElement.style.textAlign || computed.textAlign,
    };

    // Set current values in the modal
    const fontFamily = document.getElementById('ve-font-family');
    const fontSize = document.getElementById('ve-font-size');

    if (fontFamily) {
      // Try to match the font family
      const currentFont = computed.fontFamily
        .split(',')[0]
        .replace(/['"]/g, '')
        .trim();
      const option = Array.from(fontFamily.options).find(
        (opt) => opt.value.toLowerCase() === currentFont.toLowerCase(),
      );
      if (option) {
        fontFamily.value = option.value;
      }
    }

    if (fontSize) {
      fontSize.value = parseInt(computed.fontSize);
    }

    // Set active states for format buttons
    const boldBtn = document.getElementById('ve-bold');
    const italicBtn = document.getElementById('ve-italic');
    const underlineBtn = document.getElementById('ve-underline');
    const strikethroughBtn = document.getElementById('ve-strikethrough');

    if (
      boldBtn &&
      (computed.fontWeight === 'bold' ||
        computed.fontWeight === '700' ||
        parseInt(computed.fontWeight) >= 600)
    ) {
      boldBtn.classList.add('active');
    }
    if (italicBtn && computed.fontStyle === 'italic') {
      italicBtn.classList.add('active');
    }
    if (underlineBtn && computed.textDecoration.includes('underline')) {
      underlineBtn.classList.add('active');
    }
    if (strikethroughBtn && computed.textDecoration.includes('line-through')) {
      strikethroughBtn.classList.add('active');
    }

    // Set active alignment button
    const textAlign = computed.textAlign || 'left';
    const alignBtn = document.getElementById(`ve-align-${textAlign}`);
    if (alignBtn) {
      alignBtn.classList.add('active');
    }

    inlineEditOverlay.classList.add('ve-inline-edit-visible');
  }
}

function hideInlineEditModal() {
  if (inlineEditOverlay) {
    inlineEditOverlay.classList.remove('ve-inline-edit-visible');
  }
}

function restoreOriginalStyles() {
  if (selectedElement && originalStyles) {
    Object.keys(originalStyles).forEach((prop) => {
      selectedElement.style[prop] = originalStyles[prop];
    });
  }
}

function applyInlineEditChanges() {
  if (selectedElement && originalStyles) {
    // Track changes for each modified property
    const currentStyles = window.getComputedStyle(selectedElement);

    Object.keys(originalStyles).forEach((prop) => {
      const original = originalStyles[prop];
      const current = selectedElement.style[prop] || currentStyles[prop];

      if (original !== current) {
        changesTracker.trackChange(selectedElement, prop, original, current);
      }
    });

    const statusText = document.getElementById('ve-status');
    if (statusText) {
      statusText.textContent = `Text styles updated! (${changesTracker.changes.length} total changes)`;
    }
  }
}

//---------------------------------------------------------------------------------------------------------------------------------//

//----------------------------------------------CONTEXT MENU RELATED FUNCTIONALITIES-----------------------------------------------//

// Create and inject context menu HTML and CSS
function createContextMenu() {
  // Remove existing context menu if it exists
  if (contextMenuOverlay) {
    contextMenuOverlay.remove();
  }

  // Create context menu element
  contextMenuOverlay = document.createElement('div');
  contextMenuOverlay.id = 've-context-menu';
  contextMenuOverlay.innerHTML = contextMenuOverlayHTML;

  // Add CSS if not already added
  if (!document.getElementById('ve-context-menu-styles')) {
    const style = document.createElement('style');
    style.id = 've-context-menu-styles';
    style.innerHTML = contextMenuOverlayCSS;
    document.head.appendChild(style);
  }

  document.body.appendChild(contextMenuOverlay);
}

// Show context menu at the right position
function showContextMenu(element, event) {
  if (!contextMenuOverlay) {
    createContextMenu();
  }

  // Get element position
  const rect = element.getBoundingClientRect();
  const menuWidth = 220; // Approximate width of context menu
  const menuHeight = 450; // Approximate height of context menu

  // Calculate position
  let left = rect.right + 10; // Default to right side
  let top = rect.top;

  // Check if menu would go off the right edge of viewport
  if (left + menuWidth > window.innerWidth) {
    // Position on left side instead
    left = rect.left - menuWidth - 10;
  }

  // Check if menu would go off the left edge
  if (left < 0) {
    // Center it horizontally if both sides don't work
    left = Math.max(
      10,
      Math.min(window.innerWidth - menuWidth - 10, event.clientX),
    );
  }

  // Check if menu would go off the bottom edge
  if (top + menuHeight > window.innerHeight) {
    top = Math.max(10, window.innerHeight - menuHeight - 10);
  }

  // Position and show the menu
  contextMenuOverlay.style.left = left + 'px';
  contextMenuOverlay.style.top = top + 'px';
  contextMenuOverlay.classList.add('ve-context-menu-visible');

  // Add click handler to menu items
  const menuItems = contextMenuOverlay.querySelectorAll(
    '.ve-context-menu-item',
  );
  menuItems.forEach((item) => {
    item.onclick = (e) => {
      e.stopPropagation();
      const action = item.getAttribute('data-action');

      if (action === 'edit-element') {
        // Show the right sidebar when Edit Element is clicked
        showRightSidebar();
      } else if (action === 'edit-html') {
        showHTMLEditor();
      } else if (action === 'move-resize') {
        // Add this condition
        showMoveResizeModal();
      } else if (action === 'inline-edit') {
        showInlineEditModal();
      } else if (action === 'hide') {
        hideElement(selectedElement);
        selectedElement = null; // Deselect after hiding
        removeAllHighlights();
      } else {
        console.log('Menu item clicked:', item.textContent.trim());
      }

      hideContextMenu();
    };
  });
}

// Hide context menu
function hideContextMenu() {
  if (contextMenuOverlay) {
    contextMenuOverlay.classList.remove('ve-context-menu-visible');
  }
}

//---------------------------------------------------------------------------------------------------------------------------------//

// Initialize the visual editor
function initializeVisualEditor() {
  overlayElement = document.getElementById('visual-editor-overlay');
  if (overlayElement) {
    setupOverlayEventListeners();
    console.log('Visual editor initialized');
  }
}

// Remove overlay from page
function removeOverlay() {
  if (overlayElement) {
    disableDesignMode();
    overlayElement.remove();
    overlayElement = null;
    console.log('Visual editor overlay removed');
  }
  // Also remove context menu
  if (contextMenuOverlay) {
    contextMenuOverlay.remove();
    contextMenuOverlay = null;
  }
  // Also remove right sidebar
  if (rightSidebarOverlay) {
    rightSidebarOverlay.remove();
    rightSidebarOverlay = null;
  }
}

// Setup event listeners for overlay elements
function setupOverlayEventListeners() {
  const closeBtn = document.getElementById('ve-close');
  const designModeBtn = document.getElementById('ve-design-mode');
  const navigateModeBtn = document.getElementById('ve-navigate-mode');
  const colorPicker = document.getElementById('ve-color-picker');
  const applyBtn = document.getElementById('ve-apply-color');
  const saveBtn = document.getElementById('ve-save-changes');
  const statusText = document.getElementById('ve-status');
  const editTextBtn = document.getElementById('ve-edit-text');
  const undoBtn = document.querySelector('[title="Undo"]');
  const redoBtn = document.querySelector('[title="Redo"]');

  if (undoBtn) {
    undoBtn.addEventListener('click', function () {
      changesTracker.undo();
    });
  }

  if (redoBtn) {
    redoBtn.addEventListener('click', function () {
      changesTracker.redo();
    });
  }

  // Initialize button states
  changesTracker.updateUndoRedoButtons();

  if (closeBtn) closeBtn.addEventListener('click', removeOverlay);

  // Design Mode Button Handler
  if (designModeBtn) {
    designModeBtn.addEventListener('click', function () {
      if (!isDesignMode) {
        // Enable Design Mode
        isDesignMode = true;
        designModeBtn.classList.add('active');
        navigateModeBtn.classList.remove('active');

        if (statusText)
          statusText.textContent =
            'Design Mode - Hover over elements to highlight, click to select';
        if (editTextBtn) editTextBtn.disabled = false;

        enableDesignMode();
        console.log('Design Mode enabled');
      }
    });
  }

  // Navigate Mode Button Handler
  if (navigateModeBtn) {
    navigateModeBtn.addEventListener('click', function () {
      if (isDesignMode) {
        // Enable Navigate Mode (disable design features)
        isDesignMode = false;
        navigateModeBtn.classList.add('active');
        designModeBtn.classList.remove('active');

        if (statusText)
          statusText.textContent = 'Navigate Mode - Normal browsing enabled';

        // Disable text editing button
        if (editTextBtn) {
          editTextBtn.disabled = true;
          textEditMode = false;
          editTextBtn.classList.remove('active');
          editTextBtn.innerHTML = '<span class="ve-icon">✏️</span> Edit Text';
        }

        disableTextEditMode();
        disableDesignMode();
        hideContextMenu(); // Hide context menu when switching modes
        hideRightSidebar(); // Hide right sidebar when switching modes
        console.log('Navigate Mode enabled');
      }
    });
  }

  if (editTextBtn) {
    editTextBtn.addEventListener('click', function () {
      if (!isDesignMode) return;

      textEditMode = !textEditMode;

      if (textEditMode) {
        editTextBtn.innerHTML = '<span class="ve-icon">✏️</span> Stop Editing';
        editTextBtn.classList.add('active');
        if (statusText)
          statusText.textContent = 'Click on any text element to start editing';
      } else {
        editTextBtn.innerHTML = '<span class="ve-icon">✏️</span> Edit Text';
        editTextBtn.classList.remove('active');
        if (statusText) statusText.textContent = 'Text editing mode disabled';
        disableTextEditMode();
      }
    });
  }

  if (applyBtn) {
    applyBtn.addEventListener('click', function () {
      const color = colorPicker.value;
      applyColorToSelected(color);
    });
  }

  if (saveBtn) {
    saveBtn.addEventListener('click', function () {
      saveChangesToServer();
    });
  }
}

// Save changes to server
async function saveChangesToServer() {
  const statusText = document.getElementById('ve-status');
  const saveBtn = document.getElementById('ve-save-changes');

  if (changesTracker.changes.length === 0) {
    if (statusText) statusText.textContent = 'No changes to save';
    return;
  }

  const saveData = changesTracker.getChangesForSave();

  if (saveBtn) {
    saveBtn.disabled = true;
    saveBtn.textContent = 'SAVING...';
  }

  console.log(saveData, 'Save Data');
  if (statusText) statusText.textContent = 'Saving changes to server...';

  try {
    // API call placeholder - uncomment when you have the endpoint
    // const response = await fetch("YOUR_API_ENDPOINT", {
    //     method: "POST",
    //     headers: {
    //         "Content-Type": "application/json",
    //     },
    //     body: JSON.stringify(saveData)
    // });

    // Simulating successful save for demo
    console.log('Changes to be saved:', saveData);

    if (statusText)
      statusText.textContent = `✔ ${changesTracker.changes.length} changes saved!`;
    if (saveBtn) saveBtn.textContent = 'SAVED!';

    setTimeout(() => {
      if (saveBtn) {
        saveBtn.disabled = false;
        saveBtn.textContent = 'SAVE AND CONTINUE';
      }
    }, 2000);
  } catch (error) {
    console.error('Error saving to server:', error);
    if (statusText)
      statusText.textContent = '❌ Error saving changes to server.';
    if (saveBtn) {
      saveBtn.disabled = false;
      saveBtn.textContent = 'SAVE AND CONTINUE';
    }
  }
}

// Enable Design Mode
function enableDesignMode() {
  console.log('Design mode enabled - attaching event listeners');
  document.addEventListener('mouseover', handleMouseOver, true);
  document.addEventListener('mouseout', handleMouseOut, true);
  document.addEventListener('click', handleClick, true);
  document.addEventListener('keydown', handleUndoRedoKeyboard, true);

  // Add global click listener to hide context menu when clicking elsewhere
  document.addEventListener('click', handleGlobalClick, true);
}

// Disable Design Mode
function disableDesignMode() {
  console.log('Design mode disabled - removing event listeners');
  document.removeEventListener('mouseover', handleMouseOver, true);
  document.removeEventListener('mouseout', handleMouseOut, true);
  document.removeEventListener('click', handleClick, true);
  document.removeEventListener('click', handleGlobalClick, true);
  document.removeEventListener('keydown', handleUndoRedoKeyboard, true);

  removeAllHighlights();
  selectedElement = null;
}

// Handle global clicks to hide context menu
function handleGlobalClick(event) {
  // Hide context menu if clicking outside of it and not in right sidebar
  if (
    contextMenuOverlay &&
    !contextMenuOverlay.contains(event.target) &&
    !event.target.closest('#ve-right-sidebar')
  ) {
    hideContextMenu();
  }
}

// Disable text edit mode
function disableTextEditMode() {
  if (currentEditingElement) {
    currentEditingElement.contentEditable = false;
    currentEditingElement.classList.remove('ve-editing-text');
    currentEditingElement.removeEventListener('blur', handleTextEditComplete);
    currentEditingElement.removeEventListener('keydown', handleTextEditKeydown);
    currentEditingElement = null;
  }
}

// Handle text edit completion
function handleTextEditComplete() {
  if (currentEditingElement) {
    const newText = currentEditingElement.textContent;
    const originalText = changesTracker.storeOriginalValue(
      currentEditingElement,
      'text',
    );

    if (newText !== originalText) {
      changesTracker.trackChange(
        currentEditingElement,
        'text',
        originalText,
        newText,
      );
    }

    currentEditingElement.classList.remove('ve-editing-text');

    const statusText = document.getElementById('ve-status');
    if (statusText) {
      statusText.textContent =
        newText !== originalText
          ? `Text updated! (${changesTracker.changes.length} total changes)`
          : 'No text changes made';
    }
  }
}

// Handle keydown events during text editing
function handleTextEditKeydown(event) {
  event.stopPropagation();

  if (event.key === 'Escape') {
    const originalText = changesTracker.storeOriginalValue(
      currentEditingElement,
      'text',
    );
    currentEditingElement.textContent = originalText;
    disableTextEditMode();

    const statusText = document.getElementById('ve-status');
    if (statusText) statusText.textContent = 'Text editing cancelled';
  }
}

// Handle mouse over
function handleMouseOver(event) {
  if (
    !isDesignMode ||
    event.target.closest('#visual-editor-overlay') ||
    event.target.closest('#ve-context-menu') ||
    event.target.closest('#ve-right-sidebar') // Prevent hover on right sidebar
  )
    return;

  const element = event.target;
  document.querySelectorAll('.ve-hovering').forEach((el) => {
    if (el !== selectedElement && el !== currentEditingElement) {
      el.classList.remove('ve-hovering');
    }
  });

  if (element !== selectedElement && element !== currentEditingElement) {
    element.classList.add('ve-hovering');
  }
}

// Handle mouse out
function handleMouseOut(event) {
  if (
    !isDesignMode ||
    event.target.closest('#visual-editor-overlay') ||
    event.target.closest('#ve-context-menu') ||
    event.target.closest('#ve-right-sidebar') // Prevent hover on right sidebar
  )
    return;

  const element = event.target;
  if (element !== selectedElement && element !== currentEditingElement) {
    element.classList.remove('ve-hovering');
  }
}

// Handle click - MODIFIED TO PREVENT CONTEXT MENU ON RIGHT SIDEBAR
function handleClick(event) {
  if (
    !isDesignMode ||
    event.target.closest('#visual-editor-overlay') ||
    event.target.closest('#ve-context-menu') ||
    event.target.closest('#ve-right-sidebar') || // Prevent context menu on right sidebar
    event.target.closest('#ve-html-editor-overlay') || // Prevent editHTML overlay
    event.target.closest('#ve-move-resize-overlay') || // prevent Move/Resize Overlay
    event.target.closest('#ve-inline-edit-overlay')
  )
    // prevent inline edit  Overlay
    return;

  event.preventDefault();
  event.stopPropagation();
  event.stopImmediatePropagation();

  console.log(event.target, 'THIS EVENT TARGET IS CLICKED');

  if (textEditMode) {
    disableTextEditMode();
    currentEditingElement = event.target;
    changesTracker.storeOriginalValue(currentEditingElement, 'text');
    currentEditingElement.contentEditable = true;
    currentEditingElement.classList.add('ve-editing-text');
    currentEditingElement.focus();
    currentEditingElement.addEventListener('blur', handleTextEditComplete);
    currentEditingElement.addEventListener('keydown', handleTextEditKeydown);

    const statusText = document.getElementById('ve-status');
    if (statusText)
      statusText.textContent = 'Editing text - Press Escape to cancel';
  } else {
    removeAllHighlights();
    selectedElement = event.target;
    selectedElement.classList.add('ve-selected');

    // Show context menu for the selected element
    showContextMenu(selectedElement, event);

    const statusText = document.getElementById('ve-status');
    if (statusText) {
      const elementInfo =
        selectedElement.tagName.toLowerCase() +
        (selectedElement.id ? '#' + selectedElement.id : '');
      statusText.textContent = '✔ Selected: ' + elementInfo;
    }
  }

  return false;
}

// Apply color to selected element
function applyColorToSelected(color) {
  if (!selectedElement) {
    const statusText = document.getElementById('ve-status');
    if (statusText) statusText.textContent = 'No element selected';
    return;
  }

  const originalColor = changesTracker.storeOriginalValue(
    selectedElement,
    'backgroundColor',
  );
  selectedElement.style.backgroundColor = color;
  changesTracker.trackChange(
    selectedElement,
    'backgroundColor',
    originalColor,
    color,
  );

  const statusText = document.getElementById('ve-status');
  if (statusText) {
    statusText.textContent = `Color ${color} applied! (${changesTracker.changes.length} total changes)`;
  }
}

// Remove all highlights
function removeAllHighlights() {
  document.querySelectorAll('.ve-hovering, .ve-selected').forEach((el) => {
    el.classList.remove('ve-hovering', 've-selected');
  });
}

// UNDO AND REDO RELATED FUNCTION
function handleUndoRedoKeyboard(event) {
  if (
    (event.ctrlKey || event.metaKey) &&
    event.key === 'z' &&
    !event.shiftKey
  ) {
    event.preventDefault();
    changesTracker.undo();
  } else if (
    (event.ctrlKey || event.metaKey) &&
    (event.key === 'y' || (event.key === 'z' && event.shiftKey))
  ) {
    event.preventDefault();
    changesTracker.redo();
  }
}

// Initialize when DOM is ready
function init() {
  setTimeout(() => {
    initializeVisualEditor();
  }, 500);
}

if (document.readyState === 'loading') {
  console.log('Loading State');
  document.addEventListener('DOMContentLoaded', init);
} else {
  console.log('Not Loading State');
  init();
}

// Expose utility functions globally for debugging
window.veDebug = {
  clearChanges: () => changesTracker.clearChanges(),
  showChanges: () => console.log(changesTracker.changes),
  getCurrentMode: () => (isDesignMode ? 'Design Mode' : 'Navigate Mode'),
};
