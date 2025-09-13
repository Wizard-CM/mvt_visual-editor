console.log('Visual Editor loaded on:', window.location.href);

let isDesignMode = false;
let selectedElement = null;
let overlayElement = null;
let textEditMode = false;
let currentEditingElement = null;
let contextMenuOverlay = null;
let rightSidebarOverlay = null;
let currentViewMode = 'desktop'; // New variable for viewport mode
let viewportContainer = null; // New variable for viewport container

// Change tracking system with improved selector generation
let changesTracker = {
  changes: [],
  originalValues: new WeakMap(),

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
        elementData[propertyType] = element.style.width || window.getComputedStyle(element).width;
      } else if (propertyType === 'height') {
        elementData[propertyType] = element.style.height || window.getComputedStyle(element).height;
      } else if (propertyType === 'id') {
        elementData[propertyType] = element.id;
      } else if (propertyType === 'class') {
        elementData[propertyType] = element.className;
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
};

// Create viewport container for responsive preview
function createViewportContainer() {
  // Remove existing container if it exists
  if (viewportContainer) {
    viewportContainer.remove();
  }

  // Create viewport container
  viewportContainer = document.createElement('div');
  viewportContainer.id = 've-viewport-container';
  
  // Add CSS for viewport container if not already added
  if (!document.getElementById('ve-viewport-styles')) {
    const style = document.createElement('style');
    style.id = 've-viewport-styles';
    style.innerHTML = `
      #ve-viewport-container {
        position: fixed;
        top: 60px; /* Below the toolbar */
        left: 0;
        right: 0;
        bottom: 0;
        background: #f0f0f0;
        z-index: 99990;
        display: none;
        justify-content: center;
        align-items: flex-start;
        padding: 20px;
        overflow: auto;
      }
      
      #ve-viewport-container.ve-viewport-active {
        display: flex;
      }
      
      #ve-viewport-frame {
        background: white;
        box-shadow: 0 0 50px rgba(0,0,0,0.1);
        transition: all 0.3s ease;
        height: calc(100vh - 100px);
        position: relative;
        overflow: auto;
      }
      
      /* Desktop view */
      #ve-viewport-container.ve-desktop #ve-viewport-frame {
        width: 100%;
        max-width: none;
      }
      
      /* Tablet view */
      #ve-viewport-container.ve-tablet #ve-viewport-frame {
        width: 768px;
        max-width: 768px;
        border-radius: 8px;
      }
      
      /* Mobile view */
      #ve-viewport-container.ve-mobile #ve-viewport-frame {
        width: 375px;
        max-width: 375px;
        border-radius: 8px;
      }
      
      /* Device frame decorations */
      #ve-viewport-container.ve-tablet #ve-viewport-frame::before,
      #ve-viewport-container.ve-mobile #ve-viewport-frame::before {
        content: '';
        position: absolute;
        top: -20px;
        left: 50%;
        transform: translateX(-50%);
        width: 60px;
        height: 4px;
        background: #666;
        border-radius: 2px;
      }
      
      #ve-viewport-container.ve-tablet #ve-viewport-frame::after,
      #ve-viewport-container.ve-mobile #ve-viewport-frame::after {
        content: '';
        position: absolute;
        bottom: -20px;
        left: 50%;
        transform: translateX(-50%);
        width: 40px;
        height: 40px;
        border: 3px solid #666;
        border-radius: 50%;
      }
    `;
    document.head.appendChild(style);
  }

  // Create iframe for viewport
  const viewportFrame = document.createElement('iframe');
  viewportFrame.id = 've-viewport-frame';
  viewportFrame.src = window.location.href;
  viewportFrame.style.width = '100%';
  viewportFrame.style.height = '100%';
  viewportFrame.style.border = 'none';
  
  viewportContainer.appendChild(viewportFrame);
  document.body.appendChild(viewportContainer);
}

// Setup screen size toggle functionality
function setupScreenSizeToggle() {
  const desktopBtn = document.getElementById('ve-desktop-view');
  const tabletBtn = document.getElementById('ve-tablet-view');
  const mobileBtn = document.getElementById('ve-mobile-view');
  const statusText = document.getElementById('ve-status');

  if (desktopBtn) {
    desktopBtn.addEventListener('click', function() {
      setViewMode('desktop');
      updateScreenButtons('desktop');
      if (statusText) {
        const modeText = isDesignMode ? 'Design Mode' : 'Navigate Mode';
        statusText.textContent = `${modeText} - Desktop View`;
      }
    });
  }

  if (tabletBtn) {
    tabletBtn.addEventListener('click', function() {
      setViewMode('tablet');
      updateScreenButtons('tablet');
      if (statusText) {
        const modeText = isDesignMode ? 'Design Mode' : 'Navigate Mode';
        statusText.textContent = `${modeText} - Tablet View (768px)`;
      }
    });
  }

  if (mobileBtn) {
    mobileBtn.addEventListener('click', function() {
      setViewMode('mobile');
      updateScreenButtons('mobile');
      if (statusText) {
        const modeText = isDesignMode ? 'Design Mode' : 'Navigate Mode';
        statusText.textContent = `${modeText} - Mobile View (375px)`;
      }
    });
  }
}

// Update screen size buttons active state
function updateScreenButtons(mode) {
  const desktopBtn = document.getElementById('ve-desktop-view');
  const tabletBtn = document.getElementById('ve-tablet-view');
  const mobileBtn = document.getElementById('ve-mobile-view');

  // Remove active class from all buttons
  if (desktopBtn) desktopBtn.classList.remove('active');
  if (tabletBtn) tabletBtn.classList.remove('active');
  if (mobileBtn) mobileBtn.classList.remove('active');

  // Add active class to selected button
  switch(mode) {
    case 'desktop':
      if (desktopBtn) desktopBtn.classList.add('active');
      break;
    case 'tablet':
      if (tabletBtn) tabletBtn.classList.add('active');
      break;
    case 'mobile':
      if (mobileBtn) mobileBtn.classList.add('active');
      break;
  }
}

// Set viewport mode
function setViewMode(mode) {
  currentViewMode = mode;
  
  // Apply viewport sizing using meta viewport tag
  let viewportMeta = document.querySelector('meta[name="viewport"]');
  if (!viewportMeta) {
    viewportMeta = document.createElement('meta');
    viewportMeta.name = 'viewport';
    document.getElementsByTagName('head')[0].appendChild(viewportMeta);
  }

  // Store original body styles if not stored
  if (!document.body.hasAttribute('data-original-style')) {
    document.body.setAttribute('data-original-style', document.body.getAttribute('style') || '');
  }

  switch(mode) {
    case 'desktop':
      // Reset to full width
      viewportMeta.content = 'width=device-width, initial-scale=1.0';
      document.body.style.maxWidth = '';
      document.body.style.margin = document.body.getAttribute('data-original-style') ? 
        document.body.getAttribute('data-original-style').match(/margin:[^;]+/)?.[0]?.split(':')[1] || '' : '';
      document.body.classList.remove('ve-tablet-view', 've-mobile-view');
      document.body.classList.add('ve-desktop-view');
      break;
      
    case 'tablet':
      // Simulate tablet width
      viewportMeta.content = 'width=768, initial-scale=1.0';
      document.body.style.maxWidth = '768px';
      document.body.style.margin = '0 auto';
      document.body.style.boxShadow = '0 0 50px rgba(0,0,0,0.1)';
      document.body.classList.remove('ve-desktop-view', 've-mobile-view');
      document.body.classList.add('ve-tablet-view');
      break;
      
    case 'mobile':
      // Simulate mobile width
      viewportMeta.content = 'width=375, initial-scale=1.0';
      document.body.style.maxWidth = '375px';
      document.body.style.margin = '0 auto';
      document.body.style.boxShadow = '0 0 50px rgba(0,0,0,0.1)';
      document.body.classList.remove('ve-desktop-view', 've-tablet-view');
      document.body.classList.add('ve-mobile-view');
      break;
  }

  console.log('View mode changed to:', mode);
}

// Create and inject right sidebar overlay
function createRightSidebar() {
  // Remove existing sidebar if it exists
  if (rightSidebarOverlay) {
    rightSidebarOverlay.remove();
  }

  // Create sidebar element
  rightSidebarOverlay = document.createElement('div');
  rightSidebarOverlay.id = 've-right-sidebar';
  rightSidebarOverlay.innerHTML = `
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

  // Add CSS if not already added
  if (!document.getElementById('ve-right-sidebar-styles')) {
    const style = document.createElement('style');
    style.id = 've-right-sidebar-styles';
    style.innerHTML = `
      #ve-right-sidebar {
        position: fixed;
        top: 0;
        right: -350px;
        width: 350px;
        height: 100vh;
        background: #ffffff;
        border-left: 1px solid #e0e0e0;
        box-shadow: -2px 0 10px rgba(0,0,0,0.1);
        z-index: 99999;
        transition: right 0.3s ease;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      }
      
      #ve-right-sidebar.ve-sidebar-visible {
        right: 0;
      }
      
      .ve-sidebar-header {
        padding: 16px 20px;
        border-bottom: 1px solid #e0e0e0;
        display: flex;
        justify-content: space-between;
        align-items: center;
        background: #f5f5f5;
      }
      
      .ve-sidebar-header h3 {
        margin: 0;
        font-size: 16px;
        font-weight: 600;
        color: #333;
      }
      
      .ve-sidebar-close-btn {
        background: none;
        border: none;
        font-size: 24px;
        cursor: pointer;
        color: #666;
        padding: 0;
        width: 30px;
        height: 30px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 4px;
        transition: background-color 0.2s;
      }
      
      .ve-sidebar-close-btn:hover {
        background-color: #e0e0e0;
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
        font-size: 14px;
        font-weight: 600;
        color: #666;
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
        color: #333;
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
        border: 1px solid #d0d0d0;
        border-radius: 4px;
        font-size: 14px;
        background: white;
        color: #333;
        transition: border-color 0.2s;
      }
      
      .ve-sidebar-input:focus {
        outline: none;
        border-color: #4285f4;
      }
      
      .ve-sidebar-input::placeholder {
        color: #999;
      }
      
      .ve-sidebar-input-full {
        width: 100%;
        padding: 8px 10px;
        border: 1px solid #d0d0d0;
        border-radius: 4px;
        font-size: 14px;
        background: white;
        color: #333;
        transition: border-color 0.2s;
      }
      
      .ve-sidebar-input-full:focus {
        outline: none;
        border-color: #4285f4;
      }
      
      .ve-sidebar-input-full::placeholder {
        color: #999;
      }
      
      .ve-sidebar-unit {
        padding: 8px 10px;
        border: 1px solid #d0d0d0;
        border-radius: 4px;
        font-size: 14px;
        background: white;
        color: #333;
        cursor: pointer;
        min-width: 70px;
        transition: border-color 0.2s;
      }
      
      .ve-sidebar-unit:focus {
        outline: none;
        border-color: #4285f4;
      }
    `;
    document.head.appendChild(style);
  }

  document.body.appendChild(rightSidebarOverlay);
  
  // Setup event listeners for the sidebar
  setupSidebarEventListeners();
}

// Setup event listeners for the sidebar
function setupSidebarEventListeners() {
  const closeBtn = document.getElementById('ve-sidebar-close');
  const widthInput = document.getElementById('ve-element-width');
  const heightInput = document.getElementById('ve-element-height');
  const widthUnit = document.getElementById('ve-width-unit');
  const heightUnit = document.getElementById('ve-height-unit');
  const idInput = document.getElementById('ve-element-id');
  const classInput = document.getElementById('ve-element-class');

  if (closeBtn) {
    closeBtn.addEventListener('click', hideRightSidebar);
  }

  // Width change handler
  if (widthInput) {
    widthInput.addEventListener('input', function() {
      if (selectedElement) {
        const unit = widthUnit.value;
        const value = this.value;
        if (value) {
          const originalWidth = changesTracker.storeOriginalValue(selectedElement, 'width');
          selectedElement.style.width = value + unit;
          changesTracker.trackChange(selectedElement, 'width', originalWidth, value + unit);
        }
      }
    });
  }

  // Height change handler
  if (heightInput) {
    heightInput.addEventListener('input', function() {
      if (selectedElement) {
        const unit = heightUnit.value;
        const value = this.value;
        if (value) {
          const originalHeight = changesTracker.storeOriginalValue(selectedElement, 'height');
          selectedElement.style.height = value + unit;
          changesTracker.trackChange(selectedElement, 'height', originalHeight, value + unit);
        }
      }
    });
  }

  // Width unit change handler
  if (widthUnit) {
    widthUnit.addEventListener('change', function() {
      const value = widthInput.value;
      if (selectedElement && value) {
        const originalWidth = changesTracker.storeOriginalValue(selectedElement, 'width');
        selectedElement.style.width = value + this.value;
        changesTracker.trackChange(selectedElement, 'width', originalWidth, value + this.value);
      }
    });
  }

  // Height unit change handler
  if (heightUnit) {
    heightUnit.addEventListener('change', function() {
      const value = heightInput.value;
      if (selectedElement && value) {
        const originalHeight = changesTracker.storeOriginalValue(selectedElement, 'height');
        selectedElement.style.height = value + this.value;
        changesTracker.trackChange(selectedElement, 'height', originalHeight, value + this.value);
      }
    });
  }

  // ID change handler
  if (idInput) {
    idInput.addEventListener('input', function() {
      if (selectedElement) {
        const originalId = changesTracker.storeOriginalValue(selectedElement, 'id');
        selectedElement.id = this.value;
        changesTracker.trackChange(selectedElement, 'id', originalId, this.value);
      }
    });
  }

  // Class change handler
  if (classInput) {
    classInput.addEventListener('input', function() {
      if (selectedElement) {
        const originalClass = changesTracker.storeOriginalValue(selectedElement, 'class');
        selectedElement.className = this.value;
        changesTracker.trackChange(selectedElement, 'class', originalClass, this.value);
      }
    });
  }
}

// Parse CSS value and unit
function parseCSSValue(value) {
  if (!value || value === 'auto' || value === 'inherit' || value === 'initial') {
    return { number: '', unit: value || 'auto' };
  }
  
  const match = value.match(/^([\d.]+)(.*)$/);
  if (match) {
    return {
      number: match[1],
      unit: match[2] || 'px'
    };
  }
  
  return { number: '', unit: 'px' };
}

// Show right sidebar with element properties
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
      const widthUnitOption = Array.from(widthUnitSelect.options).find(opt => opt.value === widthParsed.unit);
      if (widthUnitOption) {
        widthUnitSelect.value = widthParsed.unit;
      } else {
        widthUnitSelect.value = 'px';
        if (widthInput && widthParsed.number) {
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
      const heightUnitOption = Array.from(heightUnitSelect.options).find(opt => opt.value === heightParsed.unit);
      if (heightUnitOption) {
        heightUnitSelect.value = heightParsed.unit;
      } else {
        heightUnitSelect.value = 'px';
        if (heightInput && heightParsed.number) {
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

    console.log('Element properties loaded:', {
      width: width,
      height: height,
      id: selectedElement.id,
      class: selectedElement.className
    });
  }

  rightSidebarOverlay.classList.add('ve-sidebar-visible');
}

// Hide right sidebar
function hideRightSidebar() {
  if (rightSidebarOverlay) {
    rightSidebarOverlay.classList.remove('ve-sidebar-visible');
  }
}

// Create and inject context menu HTML and CSS
function createContextMenu() {
  // Remove existing context menu if it exists
  if (contextMenuOverlay) {
    contextMenuOverlay.remove();
  }

  // Create context menu element
  contextMenuOverlay = document.createElement('div');
  contextMenuOverlay.id = 've-context-menu';
  contextMenuOverlay.innerHTML = `
        <div class="ve-context-menu-item" data-action="edit-element">
            <span class="ve-context-icon">✏️</span> Edit Element
        </div>
        <div class="ve-context-menu-item" data-action="rearrange">
            <span class="ve-context-icon">🔄</span> Rearrange
        </div>
        <div class="ve-context-menu-item" data-action="edit-html">
            <span class="ve-context-icon">📝</span> Edit HTML
        </div>
        <div class="ve-context-menu-item" data-action="inline-edit">
            <span class="ve-context-icon">✏️</span> Inline Edit
        </div>
        <div class="ve-context-menu-item" data-action="move-resize">
            <span class="ve-context-icon">📏</span> Move / Resize
        </div>
        <div class="ve-context-menu-item" data-action="suggest-variations">
            <span class="ve-context-icon">💡</span> Suggest Variations
        </div>
        <div class="ve-context-menu-item" data-action="track-clicks">
            <span class="ve-context-icon">📊</span> Track Clicks
        </div>
        <div class="ve-context-menu-item" data-action="select-relative">
            <span class="ve-context-icon">🎯</span> Select Relative Element
        </div>
        <div class="ve-context-menu-item" data-action="copy">
            <span class="ve-context-icon">📋</span> Copy
        </div>
        <div class="ve-context-menu-item" data-action="hide">
            <span class="ve-context-icon">👁️</span> Hide
        </div>
        <div class="ve-context-menu-item ve-context-remove" data-action="remove">
            <span class="ve-context-icon">🗑️</span> Remove
        </div>
    `;

  // Add CSS if not already added
  if (!document.getElementById('ve-context-menu-styles')) {
    const style = document.createElement('style');
    style.id = 've-context-menu-styles';
    style.innerHTML = `
            #ve-context-menu {
                position: fixed;
                background: white;
                border: 1px solid #e0e0e0;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                padding: 8px 0;
                z-index: 100000;
                min-width: 200px;
                display: none;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            }
            
            #ve-context-menu.ve-context-menu-visible {
                display: block;
            }
            
            .ve-context-menu-item {
                padding: 10px 16px;
                cursor: pointer;
                font-size: 14px;
                color: #333;
                display: flex;
                align-items: center;
                transition: background-color 0.2s;
            }
            
            .ve-context-menu-item:hover {
                background-color: #f5f5f5;
            }
            
            .ve-context-icon {
                margin-right: 10px;
                font-size: 16px;
            }
            
            .ve-context-remove {
                border-top: 1px solid #e0e0e0;
                margin-top: 4px;
                padding-top: 12px;
            }
            
            .ve-context-remove:hover {
                background-color: #ffebee;
                color: #d32f2f;
            }
        `;
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
  const menuWidth = 220;
  const menuHeight = 450;

  // Calculate position
  let left = rect.right + 10;
  let top = rect.top;

  // Check if menu would go off the right edge of viewport
  if (left + menuWidth > window.innerWidth) {
    left = rect.left - menuWidth - 10;
  }

  // Check if menu would go off the left edge
  if (left < 0) {
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
  const menuItems = contextMenuOverlay.querySelectorAll('.ve-context-menu-item');
  menuItems.forEach(item => {
      item.onclick = (e) => {
          e.stopPropagation();
          const action = item.getAttribute('data-action');
          
          if (action === 'edit-element') {
              showRightSidebar();
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

// Initialize the visual editor
function initializeVisualEditor() {
  overlayElement = document.getElementById('visual-editor-overlay');
  if (overlayElement) {
    setupOverlayEventListeners();
    setupScreenSizeToggle(); // Setup screen size toggle functionality
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
  // Reset viewport to desktop mode
  setViewMode('desktop');
  // Remove viewport classes from body
  document.body.classList.remove('ve-desktop-view', 've-tablet-view', 've-mobile-view');
  // Restore original body styles
  if (document.body.hasAttribute('data-original-style')) {
    const originalStyle = document.body.getAttribute('data-original-style');
    if (originalStyle) {
      document.body.setAttribute('style', originalStyle);
    } else {
      document.body.removeAttribute('style');
    }
    document.body.removeAttribute('data-original-style');
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

  if (closeBtn) closeBtn.addEventListener('click', removeOverlay);

  // Design Mode Button Handler
  if (designModeBtn) {
    designModeBtn.addEventListener('click', function () {
      if (!isDesignMode) {
        // Enable Design Mode
        isDesignMode = true;
        designModeBtn.classList.add('active');
        navigateModeBtn.classList.remove('active');

        if (statusText) {
          const viewText = currentViewMode === 'desktop' ? 'Desktop View' : 
                          currentViewMode === 'tablet' ? 'Tablet View (768px)' : 
                          'Mobile View (375px)';
          statusText.textContent = `Design Mode - ${viewText}`;
        }
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

        if (statusText) {
          const viewText = currentViewMode === 'desktop' ? 'Desktop View' : 
                          currentViewMode === 'tablet' ? 'Tablet View (768px)' : 
                          'Mobile View (375px)';
          statusText.textContent = `Navigate Mode - ${viewText}`;
        }

        // Disable text editing button
        if (editTextBtn) {
          editTextBtn.disabled = true;
          textEditMode = false;
          editTextBtn.classList.remove('active');
          editTextBtn.innerHTML = '<span class="ve-icon">✏️</span> Edit Text';
        }

        disableTextEditMode();
        disableDesignMode();
        hideContextMenu();
        hideRightSidebar();
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
  // Add viewport information to save data
  saveData.viewportMode = currentViewMode;

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
  removeAllHighlights();
  selectedElement = null;
}

// Handle global clicks to hide context menu
function handleGlobalClick(event) {
  // Hide context menu if clicking outside of it and not in right sidebar
  if (contextMenuOverlay && 
      !contextMenuOverlay.contains(event.target) && 
      !event.target.closest('#ve-right-sidebar')) {
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
    event.target.closest('#ve-right-sidebar')
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
    event.target.closest('#ve-right-sidebar')
  )
    return;

  const element = event.target;
  if (element !== selectedElement && element !== currentEditingElement) {
    element.classList.remove('ve-hovering');
  }
}

// Handle click
function handleClick(event) {
  if (
    !isDesignMode ||
    event.target.closest('#visual-editor-overlay') ||
    event.target.closest('#ve-context-menu') ||
    event.target.closest('#ve-right-sidebar')
  )
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
  getCurrentViewMode: () => currentViewMode,
  setViewMode: (mode) => setViewMode(mode)
};