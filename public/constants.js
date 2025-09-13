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

  

module.exports = {rightSidebarOverlayHTML}