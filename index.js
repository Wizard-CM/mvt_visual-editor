import fetch from 'node-fetch';
import express from 'express';
import { Buffer } from 'buffer';
import crypto from 'crypto';
import cors from 'cors';

const app = express();
//enable cors with every allowed origin
app.use(
  cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    credentials: true,
  }),
);

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Utility functions for VWO-style URL handling
function generateSessionId() {
  return crypto.randomBytes(20).toString('hex');
}

function encodeUrl(url) {
  return Buffer.from(url)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

function decodeUrl(encoded) {
  // Add padding if needed
  const padded = encoded.replace(/-/g, '+').replace(/_/g, '/');
  const padding = 4 - (padded.length % 4);
  const finalEncoded = padded + '='.repeat(padding === 4 ? 0 : padding);
  return Buffer.from(finalEncoded, 'base64').toString('utf-8');
}

// URL rewriter - rewrites URLs to go through proxy
function rewriteUrls(html, sessionId, baseUrl) {
  console.log('🔄 [URL REWRITE START]', {
    sessionId: sessionId.substring(0, 8) + '...',
    baseUrl,
    htmlLength: html.length,
  });

  const baseUrlObj = new URL(baseUrl);
  const origin = baseUrlObj.origin;
  const encodedOrigin = encodeUrl(origin);

  // Rewrite various URL attributes to go through proxy
  let rewritten = html;

  // Handle absolute URLs that start with the same origin
  const absoluteUrlRegex = new RegExp(
    `"(${origin.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[^"]*)"`,
    'g',
  );
  let absoluteCount = 0;
  rewritten = rewritten.replace(absoluteUrlRegex, (match, url) => {
    const fullUrl = url;
    const path = fullUrl.replace(origin, '');
    const proxyUrl = `/editorProxy/${sessionId}/${encodedOrigin}${path}`;

    console.log('🔗 [ABSOLUTE URL]', {
      before: url,
      after: proxyUrl,
    });
    absoluteCount++;

    return `"${proxyUrl}"`;
  });

  if (absoluteCount > 0) {
    console.log(`✅ [ABSOLUTE] Processed ${absoluteCount} absolute URLs`);
  }

  // Handle relative URLs in common attributes
  const relativeUrlPatterns = [
    /(?:src|href|srcset|action|data-src|data-href)="([^"]*(?:\/[^"]*)*)"/g,
    /(?:src|href|srcset|action|data-src|data-href)='([^']*(?:\/[^']*)*)'/g,
    /url\(["']?([^"')]*(?:\/[^"')]*)*)["']?\)/g, // CSS url() function
  ];

  let relativeCount = 0;
  relativeUrlPatterns.forEach((pattern, index) => {
    rewritten = rewritten.replace(pattern, (match, url) => {
      console.log(`##########################################`);
      console.log(`🔗 [RELATIVE URL] Found URL`, { url });
      console.log(`##########################################`);

      if (
        url.startsWith('http') ||
        url.startsWith('//') ||
        url.startsWith('data:') ||
        url.startsWith('#')
      ) {
        return match; // Skip absolute URLs, data URLs, and anchors
      }

      if (url.includes('/editorProxy/')) {
        // If the URL is already proxied, just return it
        return match;
      }

      // Handle relative URLs
      let proxyUrl;
      if (url.startsWith('/')) {
        proxyUrl = `/editorProxy/${sessionId}/${encodedOrigin}${url}`;
      } else {
        proxyUrl = `/editorProxy/${sessionId}/${encodedOrigin}/${url}`;
      }

      console.log('🔗 [RELATIVE URL]', {
        pattern: index,
        before: url,
        after: proxyUrl,
        isNextJs: url.includes('/_next/'),
        match: match.substring(0, 50) + '...',
      });
      relativeCount++;

      return match.replace(url, proxyUrl);
    });
  });

  if (relativeCount > 0) {
    console.log(`✅ [RELATIVE] Processed ${relativeCount} relative URLs`);
  }

  return rewritten;
}

// Main page - URL input form
app.get('/', (_, res) => {
  console.log('🏠 [HOME PAGE] Serving URL input form');

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>VWO Proxy - Visual Editor</title>
        <style>
            * { box-sizing: border-box; }
            body { 
                margin: 0; 
                padding: 0; 
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                min-height: 100vh;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            .container {
                background: white;
                border-radius: 16px;
                padding: 40px;
                box-shadow: 0 20px 60px rgba(0,0,0,0.15);
                max-width: 500px;
                width: 90%;
            }
            h1 {
                text-align: center;
                color: #333;
                margin-bottom: 30px;
                font-size: 28px;
                font-weight: 600;
            }
            .form-group {
                margin-bottom: 24px;
            }
            label {
                display: block;
                margin-bottom: 8px;
                color: #555;
                font-weight: 500;
            }
            input[type="url"] {
                width: 100%;
                padding: 16px;
                border: 2px solid #e1e5e9;
                border-radius: 8px;
                font-size: 16px;
                transition: border-color 0.3s;
            }
            input[type="url"]:focus {
                outline: none;
                border-color: #667eea;
            }
            .btn {
                width: 100%;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 16px;
                border: none;
                border-radius: 8px;
                font-size: 16px;
                font-weight: 600;
                cursor: pointer;
                transition: transform 0.2s, box-shadow 0.2s;
            }
            .btn:hover {
                transform: translateY(-2px);
                box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
            }
            .examples {
                margin-top: 24px;
                padding-top: 24px;
                border-top: 1px solid #e1e5e9;
            }
            .examples h3 {
                margin: 0 0 12px 0;
                color: #666;
                font-size: 14px;
                font-weight: 500;
            }
            .example-links {
                display: flex;
                flex-wrap: wrap;
                gap: 8px;
            }
            .example-link {
                background: #f8f9fa;
                color: #667eea;
                text-decoration: none;
                padding: 6px 12px;
                border-radius: 20px;
                font-size: 12px;
                transition: background-color 0.2s;
            }
            .example-link:hover {
                background: #e9ecef;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>🎨 Visual Editor</h1>
            <form method="POST" action="/launch">
                <div class="form-group">
                    <label for="url">Enter Website URL</label>
                    <input 
                        type="url" 
                        id="url" 
                        name="url" 
                        placeholder="https://example.com" 
                        required 
                        value="https://mvtlab.io"
                    >
                </div>
                <button type="submit" class="btn">Launch Visual Editor</button>
            </form>
            
            <div class="examples">
                <h3>Try these examples:</h3>
                <div class="example-links">
                    <a href="#" class="example-link" onclick="setUrl('https://mvtlab.io')">mvtlab.io</a>
                    <a href="#" class="example-link" onclick="setUrl('https://example.com')">example.com</a>
                    <a href="#" class="example-link" onclick="setUrl('https://httpbin.org')">httpbin.org</a>
                    <a href="#" class="example-link" onclick="setUrl('https://github.com')">github.com</a>
                </div>
            </div>
        </div>
        
        <script>
            function setUrl(url) {
                document.getElementById('url').value = url;
            }
        </script>
    </body>
    </html>
    `;

  res.set('content-type', 'text/html; charset=utf-8');
  res.send(html);
});

// Launch endpoint - generates session and returns JSON (or redirects)
app.post('/launch', (req, res) => {
  const targetUrl = req.body.url;
  if (!targetUrl) {
    // Old redirect approach (commented)
    // return res.status(400).send('URL is required');
    return res.status(400).json({ error: 'URL is required' });
  }

  // Validate URL
  try {
    new URL(targetUrl);
  } catch (e) {
    // Old redirect approach (commented)
    // return res.status(400).send('Invalid URL');
    return res.status(400).json({ error: 'Invalid URL' });
  }

  const sessionId = generateSessionId();
  const encodedUrl = encodeUrl(targetUrl);

  console.log('🚀 [LAUNCH] Creating new editor session', {
    sessionId,
    targetUrl,
    encodedUrl,
  });

  // Old redirect approach (commented)
  // res.redirect(`/editorProxy/${sessionId}/${encodedUrl}/`);

  // New JSON response approach
  res.json({
    sessionId,
    targetUrl,
    encodedUrl,
    redirectUrl: `/editorProxy/${sessionId}/${encodedUrl}/`,
  });
});

// VWO-style proxy route - handles all proxied requests
app.get('/editorProxy/:sessionId/:encodedUrl/*?', async (req, res) => {
  const { sessionId, encodedUrl } = req.params;
  const path = req.params[0] ? `/${req.params[0]}` : '';
  const queryString = req.url.includes('?')
    ? req.url.slice(req.url.indexOf('?'))
    : '';

  console.log('🎯 [PROXY REQUEST]', {
    sessionId,
    encodedUrl,
    path,
    queryString,
    method: req.method,
    originalUrl: req.originalUrl,
  });

  try {
    // Decode the base URL
    const baseUrl = decodeUrl(encodedUrl);
    const targetUrl = `${baseUrl}${path}${queryString}`;

    console.log('📡 [FETCHING]', {
      baseUrl,
      targetUrl,
    });

    // Fetch the target URL with proper headers
    const response = await fetch(targetUrl, {
      method: req.method,
      headers: {
        'User-Agent':
          req.headers['user-agent'] ||
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: req.headers.accept || '*/*',
        'Accept-Language': req.headers['accept-language'] || 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Cache-Control': 'no-cache',
        Pragma: 'no-cache',
        // Forward relevant headers but filter out problematic ones
        ...(req.headers.referer && { Referer: baseUrl }),
        ...(req.headers.cookie && { Cookie: req.headers.cookie }),
      },
      redirect: 'follow',
    });

    console.log('📥 [RESPONSE]', {
      status: response.status,
      statusText: response.statusText,
      contentType: response.headers.get('content-type'),
      url: response.url,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    // Get content type
    const contentType = response.headers.get('content-type') || '';

    // Handle HTML responses - inject editor toolbar and rewrite URLs
    if (contentType.includes('text/html')) {
      let html = await response.text();
      console.log('🔧 [HTML PROCESSING] Rewriting URLs and injecting editor');

      // Inject Visual Editor toolbar at the top of the body
      const toolbarHtml = `
<style>
#visual-editor-overlay {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 9999;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "SF Pro Display", Roboto, sans-serif;
  pointer-events: auto;
}

.ve-editor-panel {
  background: #ffffff;
  border-top: 1px solid #e5e5e7;
  box-shadow: 0 -1px 3px rgba(0, 0, 0, 0.08);
  width: 100%;
}

.ve-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 20px;
  min-height: 56px;
  background: #f8f8f9;
}

.ve-left-controls,
.ve-center-status,
.ve-right-controls {
  display: flex;
  align-items: center;
  gap: 8px;
}

.ve-center-status {
  flex: 1;
  justify-content: center;
}

/* NEW: Mode Toggle Buttons - Vertical Layout */
.ve-mode-toggle {
  display: flex;
  flex-direction: column;
  background: #ffffff;
  border: 1px solid #d1d1d6;
  border-radius: 6px;
  overflow: hidden;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
}

.ve-mode-btn {
  background: transparent;
  color: #8e8e93;
  border: none;
  padding: 6px 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 500;
  transition: all 0.15s ease;
  position: relative;
  white-space: nowrap;
  border-bottom: 1px solid #e5e5e7;
}

.ve-mode-btn:last-child {
  border-bottom: none;
}

.ve-mode-btn:hover {
  background: #f2f2f7;
  color: #1c1c1e;
}


.ve-mode-btn .ve-icon {
  font-size: 14px;
}

/* Tool Button Styling */
.ve-tool-btn {
  background: #ffffff;
  color: #3c3c43;
  border: 1px solid #d1d1d6;
  padding: 8px 12px;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 500;
  transition: all 0.15s ease;
  white-space: nowrap;
  min-height: 32px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
}

.ve-tool-btn:hover {
  background: #f2f2f7;
  border-color: #c7c7cc;
  transform: translateY(-0.5px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.08);
}

.ve-tool-btn:active {
  transform: translateY(0);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
}

.ve-tool-btn.active {
  background: #007aff;
  color: white;
  border-color: #007aff;
}

/* Save Button Styling */
.ve-save-btn {
  background: #1c1c1e;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.8px;
  transition: all 0.15s ease;
  text-transform: uppercase;
  min-height: 32px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.ve-save-btn:hover {
  background: #2c2c2e;
  transform: translateY(-0.5px);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
}

.ve-save-btn:before {
  content: '📁';
  font-size: 14px;
}

/* Close Button Styling */
.ve-close-btn {
  background: transparent;
  color: #8e8e93;
  border: none;
  width: 28px;
  height: 28px;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  font-weight: 400;
  transition: all 0.15s ease;
}

.ve-close-btn:hover {
  background: #f2f2f7;
  color: #3c3c43;
}

/* Divider */
.ve-divider {
  width: 1px;
  height: 20px;
  background: #d1d1d6;
  margin: 0 4px;
}

/* Color Controls */
.ve-color-controls {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 0 8px;
}

#ve-color-picker {
  width: 24px;
  height: 24px;
  border: 1px solid #d1d1d6;
  border-radius: 4px;
  cursor: pointer;
  background: white;
}

#ve-color-picker:hover {
  border-color: #007aff;
}

/* Center Status Text */
.ve-center-status p {
  margin: 0;
  color: #8e8e93;
  font-size: 13px;
  text-align: center;
  font-weight: 400;
}

/* Icon Styling */
.ve-icon {
  font-size: 16px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

/* Text Controls */
.ve-text-controls {
  display: flex;
  align-items: center;
  gap: 6px;
}

/* Disabled State */
.ve-tool-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  background: #f2f2f7;
  color: #c7c7cc;
}

.ve-tool-btn:disabled:hover {
  transform: none;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
}

/* Element Targeting Styles */
.ve-hovering {
  outline: 2px solid #007aff !important;
  outline-offset: 2px !important;
  box-shadow: 0 0 0 4px rgba(0, 122, 255, 0.1) !important;
}

.ve-selected {
  outline: 2px solid #ff9500 !important;
  outline-offset: 2px !important;
  box-shadow: 0 0 0 4px rgba(255, 149, 0, 0.15) !important;
}

.ve-editing-text {
  outline: 2px dashed #34c759 !important;
  outline-offset: 2px !important;
  background-color: rgba(52, 199, 89, 0.05) !important;
  cursor: text !important;
}

/* Responsive Design */
@media (max-width: 768px) {
  .ve-toolbar {
    padding: 8px 12px;
    min-height: 48px;
  }

  .ve-left-controls,
  .ve-right-controls {
    gap: 4px;
  }

  .ve-mode-btn,
  .ve-tool-btn {
    padding: 6px 10px;
    font-size: 12px;
    min-height: 28px;
  }

  .ve-save-btn {
    padding: 6px 12px;
    font-size: 10px;
    min-height: 28px;
  }

  .ve-close-btn {
    width: 24px;
    height: 24px;
    font-size: 18px;
  }

  .ve-icon {
    font-size: 14px;
  }

  #ve-color-picker {
    width: 20px;
    height: 20px;
  }
}

/* Additional Polish */
* {
  box-sizing: border-box;
}

button {
  font-family: inherit;
}

button:focus {
  outline: none;
}

button:focus-visible {
  outline: 2px solid #007aff;
  outline-offset: 2px;
}

/* Smooth Animations */
@keyframes slideUp {
  from {
    transform: translateY(100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

#visual-editor-overlay {
  animation: slideUp 0.3s ease-out;
}

/* Screen Size Toggle Container */
.ve-screen-size-toggle {
  display: inline-flex;
  gap: 2px;
  background: #f0f0f2;
  padding: 4px;
  border-radius: 10px;
  align-items: center;
}

/* Screen Size Buttons */
.ve-screen-btn {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  padding: 0;
  background: transparent;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  color: #6b7280;
}

.ve-screen-btn:hover:not(.active) {
  background: rgba(0, 0, 0, 0.05);
  color: #374151;
}

.ve-screen-btn.active {
  background: #1f2937;
  color: #ffffff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

/* SVG Icon Styling */
.ve-screen-btn svg {
  width: 18px;
  height: 18px;
  pointer-events: none;
}

.ve-screen-btn.active svg rect,
.ve-screen-btn.active svg path,
.ve-screen-btn.active svg circle {
  stroke: #ffffff;
}

.ve-screen-btn.active svg rect[fill="currentColor"] {
  fill: #ffffff;
}

.ve-screen-btn.active svg circle[fill="currentColor"] {
  fill: #ffffff;
}

/* Tooltip on hover */
.ve-screen-btn::after {
  content: attr(title);
  position: absolute;
  bottom: -32px;
  left: 50%;
  transform: translateX(-50%) scale(0);
  background: #1f2937;
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 11px;
  white-space: nowrap;
  pointer-events: none;
  opacity: 0;
  transition: all 0.2s ease;
  z-index: 10000;
}

.ve-screen-btn:hover::after {
  transform: translateX(-50%) scale(1);
  opacity: 1;
}

/* Focus styles for accessibility */
.ve-screen-btn:focus-visible {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
}


.ve-mode-toggle {
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 16px;
    background: #ffffff;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
}

.ve-mode-btn {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 0;
    border: none;
    background: none;
    cursor: pointer;
    font-size: 15px;
    color: #333333;
    text-align: left;
    transition: opacity 0.2s ease;
}

.ve-mode-btn:hover {
    opacity: 0.8;
}

.ve-icon {
    display: inline-block;
    width: 18px;
    height: 18px;
    border: 2px solid #d1d5db;
    border-radius: 50%;
    position: relative;
    transition: all 0.2s ease;
}

// .ve-mode-btn.active .ve-icon {
//     border-color: #FF0000;
// }

.ve-mode-btn.active .ve-icon::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #FF0000;
}

.ve-mode-btn:focus {
    outline: none;
}

.ve-mode-btn:focus-visible {
    outline: 2px solid #3b82f6;
    outline-offset: 2px;
    border-radius: 4px;
}

.ve-tool-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  pointer-events: none;
}

.ve-tool-btn {
  transition: opacity 0.2s ease;
}

    </style>

    <!-- HTML Structure with Design/Navigate Mode Buttons -->
<div id="visual-editor-overlay">
    <div class="ve-editor-panel">
        <div class="ve-toolbar">
            <div class="ve-left-controls">
                <!-- NEW: Vertical Mode Toggle Buttons -->
<div class="ve-mode-toggle">
    <button id="ve-design-mode" class="ve-mode-btn">
        <span class="ve-icon"></span>
        Design Mode
    </button>
    <button id="ve-navigate-mode" class="ve-mode-btn active">
        <span class="ve-icon"></span>
        Navigate Mode
    </button>
</div>
            </div>
            
            <div class="ve-center-status">
                <!-- NEW: Screen Size Toggle Buttons -->
                <div class="ve-screen-size-toggle">
                    <button id="ve-desktop-view" class="ve-screen-btn active" title="Desktop View">
                        <svg width="20" height="16" viewBox="0 0 20 16" fill="none">
                            <rect x="1" y="1" width="18" height="12" rx="1" stroke="currentColor" stroke-width="1.5" fill="none"/>
                            <rect x="3" y="3" width="14" height="8" fill="currentColor" opacity="0.3"/>
                            <path d="M7 15H13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                        </svg>
                    </button>
                    <button id="ve-tablet-view" class="ve-screen-btn" title="Tablet View">
                        <svg width="16" height="20" viewBox="0 0 16 20" fill="none">
                            <rect x="1" y="1" width="14" height="18" rx="2" stroke="currentColor" stroke-width="1.5" fill="none"/>
                            <rect x="3" y="3" width="10" height="14" fill="currentColor" opacity="0.3"/>
                            <circle cx="8" cy="17.5" r="0.5" fill="currentColor"/>
                        </svg>
                    </button>
                    <button id="ve-mobile-view" class="ve-screen-btn" title="Mobile View">
                        <svg width="12" height="20" viewBox="0 0 12 20" fill="none">
                            <rect x="1" y="1" width="10" height="18" rx="2" stroke="currentColor" stroke-width="1.5" fill="none"/>
                            <rect x="2.5" y="3" width="7" height="13" fill="currentColor" opacity="0.3"/>
                            <circle cx="6" cy="17.5" r="0.5" fill="currentColor"/>
                        </svg>
                    </button>
                </div>
                <p id="ve-status">Navigate Mode - Normal browsing enabled</p>
            </div>
            
            <div class="ve-right-controls">
                <button class="ve-tool-btn" title="Undo">
                    <span class="ve-icon">↶</span>
                </button>
                
                <button class="ve-tool-btn" title="Redo">
                    <span class="ve-icon">↷</span>
                </button>
                
                <div class="ve-divider"></div>
                
                <button class="ve-tool-btn" title="Settings">
                    <span class="ve-icon">⚙️</span>
                </button>
                
                <button id="ve-save-changes" class="ve-save-btn">
                    SAVE AND CONTINUE
                </button>
                
                <button class="ve-close-btn" id="ve-close" title="Close Editor">×</button>
            </div>
        </div>
    </div>
</div>
            `;


                    //   <div class="ve-color-controls">
                    //     <input type="color" id="ve-color-picker" value="#ff0000" title="Background Color">
                    //     <button id="ve-apply-color" class="ve-tool-btn">Apply Color</button>
                    // </div>

                    // <div class="ve-text-controls">
                    //     <button id="ve-edit-text" class="ve-tool-btn" disabled>
                    //         <span class="ve-icon">✏️</span>
                    //         Edit Text
                    //     </button>
                    // </div>

      // // Insert toolbar after <body> tag
      //   html = html.replace(/<body([^>]*)>/i, `<body$1>${toolbarHtml}`);

      // Inject runtime URL rewriter script
      const runtimeRewriterScript = `
                <script>
                (function() {
                    const sessionId = '${sessionId}';
                    const encodedOrigin = '${encodeUrl(baseUrl)}';
                    const originalOrigin = '${new URL(baseUrl).origin}';

                    console.log('🚀 [RUNTIME REWRITER] Initializing dynamic URL rewriter');

                    // Global error handler to catch client-side exceptions
                    window.addEventListener('error', function(event) {
                        console.error('❌ [CLIENT ERROR] Caught client-side error:', event.error);
                        
                        // Check if it's a network/loading error that might be fixed by reload
                        if (event.error && (
                            event.error.message.includes('Loading chunk') ||
                            event.error.message.includes('Loading CSS chunk') ||
                            event.error.message.includes('ChunkLoadError') ||
                            event.error.message.includes('Failed to fetch') ||
                            event.filename && event.filename.includes('/_next/')
                        )) {
                            console.log('🔄 [AUTO RELOAD] Detected asset loading error, reloading page in 2 seconds...');
                            
                            // Show user-friendly message
                            const errorDiv = document.createElement('div');
                            errorDiv.style.cssText = \`
                                position: fixed;
                                top: 50%;
                                left: 50%;
                                transform: translate(-50%, -50%);
                                background: #fee;
                                border: 2px solid #f66;
                                padding: 20px;
                                border-radius: 8px;
                                z-index: 999999999;
                                font-family: system-ui;
                                text-align: center;
                                box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                                width: calc(100vw - 500px);
                            \`;
                            errorDiv.innerHTML = \`
                                <div style="color: #d33; font-weight: bold; margin-bottom: 10px;">
                                    ⚠️ Loading Error Detected
                                </div>
                                <div style="color: #666; margin-bottom: 15px;">
                                    Automatically reloading page to fix asset loading issues...
                                </div>
                                <div style="font-size: 12px; color: #999;">
                                    Reloading in <span id="countdown">2</span> seconds
                                </div>
                            \`;
                            document.body.appendChild(errorDiv);
                            
                            // Countdown timer
                            let countdown = 2;
                            const countdownEl = document.getElementById('countdown');
                            const timer = setInterval(function() {
                                countdown--;
                                if (countdownEl) countdownEl.textContent = countdown;
                                if (countdown <= 0) {
                                    clearInterval(timer);
                                    window.location.reload();
                                }
                            }, 1000);
                        }
                    });

                    // Handle unhandled promise rejections
                    window.addEventListener('unhandledrejection', function(event) {
                        console.error('❌ [PROMISE REJECTION] Unhandled promise rejection:', event.reason);
                        
                        if (event.reason && (
                            event.reason.message?.includes('Loading chunk') ||
                            event.reason.message?.includes('ChunkLoadError') ||
                            event.reason.toString().includes('/_next/')
                        )) {
                            console.log('🔄 [AUTO RELOAD] Detected promise rejection related to asset loading');
                            setTimeout(() => window.location.reload(), 1000);
                        }
                    });

                    // Monitor for Next.js hydration errors
                    let hydrationErrorCount = 0;
                    const originalConsoleError = console.error;
                    console.error = function(...args) {
                        const message = args.join(' ');
                        if (message.includes('Hydration failed') || 
                            message.includes('Text content does not match') ||
                            message.includes('Expected server HTML')) {
                            hydrationErrorCount++;
                            console.log(\`⚠️ [HYDRATION ERROR] Count: \${hydrationErrorCount}\`);
                            
                            if (hydrationErrorCount >= 3) {
                                console.log('🔄 [AUTO RELOAD] Too many hydration errors, reloading...');
                                setTimeout(() => window.location.reload(), 1000);
                            }
                        }
                        return originalConsoleError.apply(console, args);
                    };

                    // Periodic health check for the page
                    let healthCheckFailures = 0;
                    setInterval(function() {
                        try {
                            // Check if basic DOM operations are working
                            const testDiv = document.createElement('div');
                            document.body.appendChild(testDiv);
                            document.body.removeChild(testDiv);
                            
                            // Reset failure count on success
                            healthCheckFailures = 0;
                        } catch (error) {
                            healthCheckFailures++;
                            console.error('❌ [HEALTH CHECK] DOM operation failed:', error);
                            
                            if (healthCheckFailures >= 3) {
                                console.log('🔄 [AUTO RELOAD] Page appears unresponsive, reloading...');
                                window.location.reload();
                            }
                        }
                    }, 10000); // Check every 10 seconds

                    // Function to rewrite URLs dynamically
                    function rewriteUrl(url) {
                        console.log('🔄 [RUNTIME REWRITE] Processing URL:', url);
                        if (!url || url.includes('/editorProxy/')) return url;

                        if (url.startsWith('/')) {
                            const rewritten = \`/editorProxy/\${sessionId}/\${encodedOrigin}\${url}\`;
                            console.log('🔄 [RUNTIME REWRITE]', { before: url, after: rewritten });
                            return rewritten;
                        }

                        if (url.startsWith(originalOrigin)) {
                            const path = url.replace(originalOrigin, '');
                            const rewritten = \`/editorProxy/\${sessionId}/\${encodedOrigin}\${path}\`;
                            console.log('🔄 [RUNTIME REWRITE]', { before: url, after: rewritten });
                            return rewritten;
                        }

                        return url;
                    }

                    // Override Image constructor to intercept Next.js image loading
                    const OriginalImage = window.Image;
                    window.Image = function() {
                        const img = new OriginalImage();
                        const originalSrcSetter = Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, 'src').set;

                        Object.defineProperty(img, 'src', {
                            set: function(value) {
                                const rewritten = rewriteUrl(value);
                                originalSrcSetter.call(this, rewritten);
                            },
                            get: function() {
                                return this.getAttribute('src');
                            }
                        });

                        return img;
                    };

                    // Function to rewrite all URL attributes in an element
                    function rewriteElementUrls(element) {
                        const urlAttributes = ['src', 'href', 'action', 'data-src', 'data-href', 'srcset', 'poster', 'background'];

                        urlAttributes.forEach(function(attr) {
                            if (element.hasAttribute && element.hasAttribute(attr)) {
                                const value = element.getAttribute(attr);
                                if (value && !value.includes('/editorProxy/')) {
                                    if (attr === 'srcset') {
                                        // Handle srcset which can have multiple URLs
                                        const rewrittenSrcset = value.split(',').map(function(src) {
                                            const parts = src.trim().split(' ');
                                            const url = parts[0];
                                            const descriptor = parts.slice(1).join(' ');
                                            const rewrittenUrl = rewriteUrl(url);
                                            return descriptor ? rewrittenUrl + ' ' + descriptor : rewrittenUrl;
                                        }).join(', ');
                                        element.setAttribute(attr, rewrittenSrcset);
                                    } else {
                                        const rewritten = rewriteUrl(value);
                                        if (rewritten !== value) {
                                            element.setAttribute(attr, rewritten);
                                        }
                                    }
                                }
                            }
                        });

                        // Handle inline styles with background-image, etc.
                        if (element.style && element.style.cssText) {
                            const originalStyle = element.style.cssText;
                            const rewrittenStyle = originalStyle.replace(/url\\s*\\(\\s*["']?([^"')]+)["']?\\s*\\)/gi, function(match, url) {
                                const rewritten = rewriteUrl(url);
                                return match.replace(url, rewritten);
                            });
                            if (rewrittenStyle !== originalStyle) {
                                element.style.cssText = rewrittenStyle;
                            }
                        }

                        // Recursively process child elements
                        if (element.children) {
                            Array.from(element.children).forEach(rewriteElementUrls);
                        }
                    }

                    // Monitor for DOM changes and rewrite URLs in new elements
                    const observer = new MutationObserver(function(mutations) {
                        mutations.forEach(function(mutation) {
                            mutation.addedNodes.forEach(function(node) {
                                if (node.nodeType === Node.ELEMENT_NODE) {
                                    rewriteElementUrls(node);
                                }
                            });

                            // Handle attribute changes
                            if (mutation.type === 'attributes') {
                                const target = mutation.target;
                                if (target.nodeType === Node.ELEMENT_NODE) {
                                    rewriteElementUrls(target);
                                }
                            }
                        });
                    });

                    // Start observing when DOM is ready
                    if (document.readyState === 'loading') {
                        document.addEventListener('DOMContentLoaded', function() {
                            observer.observe(document.body, {
                                childList: true,
                                subtree: true,
                                attributes: true,
                                attributeFilter: ['src', 'href', 'action', 'data-src', 'data-href', 'srcset', 'poster', 'background', 'style']
                            });
                            console.log('🔍 [RUNTIME REWRITER] Started observing DOM changes');
                        });
                    } else {
                        observer.observe(document.body, {
                            childList: true,
                            subtree: true,
                            attributes: true,
                            attributeFilter: ['src', 'href', 'action', 'data-src', 'data-href', 'srcset', 'poster', 'background', 'style']
                        });
                        console.log('🔍 [RUNTIME REWRITER] Started observing DOM changes');
                    }

                    // Also rewrite any existing elements after a short delay
                    setTimeout(function() {
                        console.log('⏰ [RUNTIME REWRITER] Processing existing elements');
                        rewriteElementUrls(document.body);

                        // Also handle any CSS stylesheets
                        Array.from(document.styleSheets).forEach(function(stylesheet) {
                            console.log('🔍[CSS REWRITE] Processing stylesheet: ',stylesheet);
                            try {
                                Array.from(stylesheet.cssRules || stylesheet.rules || []).forEach(function(rule) {
                                    if (rule.style && rule.style.cssText) {
                                        const originalStyle = rule.style.cssText;
                                        const rewrittenStyle = originalStyle.replace(/url\\s*\\(\\s*["']?([^"')]+)["']?\\s*\\)/gi, function(match, url) {
                                            const rewritten = rewriteUrl(url);
                                            if (rewritten !== url) {
                                                console.log('🎨 [CSS REWRITE]', { before: url, after: rewritten });
                                            }
                                            return match.replace(url, rewritten);
                                        });
                                        if (rewrittenStyle !== originalStyle) {
                                            rule.style.cssText = rewrittenStyle;
                                        }
                                    }
                                });
                            } catch (e) {
                                // Cross-origin stylesheets might not be accessible
                                console.log('⚠️ [CSS SKIP] Cannot access stylesheet:', e.message);
                            }
                        });
                    }, 1000);


                })();
                </script>
            `;

    // const runtimeRewriterScript = `
    //             <script>
    //             (function() {
    //                 const sessionId = '${sessionId}';
    //                 const encodedOrigin = '${encodeUrl(baseUrl)}';
    //                 const originalOrigin = '${new URL(baseUrl).origin}';
                    
    //                 // Parse the original URL components
    //                 const originalUrl = new URL('${baseUrl}');
    //                 const originalHost = originalUrl.hostname;
    //                 const originalProtocol = originalUrl.protocol;
    //                 const originalPort = originalUrl.port || (originalProtocol === 'https:' ? '443' : '80');
                    
    //                 // CRITICAL: Define the proxy path pattern that we'll use everywhere
    //                 const PROXY_PATH_PREFIX = '/editorProxy/' + sessionId + '/' + encodedOrigin;
    //                 const PROXY_PATH_PATTERN = new RegExp('^/editorProxy/' + sessionId + '/[^/]+', 'i');
                    
    //                 console.log('🚀 [RUNTIME REWRITER] Initialized', {
    //                     originalHost,
    //                     originalProtocol,
    //                     originalPort,
    //                     proxyPrefix: PROXY_PATH_PREFIX
    //                 });

    //                 // Global state management
    //                 const state = {
    //                     processedNodes: new WeakSet(),
    //                     urlCache: new Map(),
    //                     isProcessing: false,
    //                     observerActive: false,
    //                     mutationQueue: [],
    //                     rewriteCount: 0,
    //                     maxRewritesPerSession: 1000
    //                 };

    //                 // Error handler for debugging
    //                 window.addEventListener('error', function(event) {
    //                     if (event.error && (
    //                         event.error.message.includes('Loading chunk') ||
    //                         event.error.message.includes('ChunkLoadError')
    //                     )) {
    //                         console.log('🔄 [ERROR] Asset loading error, will reload in 3s');
    //                         setTimeout(() => window.location.reload(), 3000);
    //                     }
    //                 });

    //                 // CRITICAL: Strict URL validation to prevent loops
    //                 function isAlreadyProxied(url) {
    //                     if (!url || typeof url !== 'string') return true;
                        
    //                     // Check multiple patterns to be absolutely sure
    //                     if (url.indexOf('/editorProxy/') !== -1) return true;
    //                     if (url.indexOf(sessionId) !== -1) return true;
    //                     if (url.indexOf(encodedOrigin) !== -1) return true;
    //                     if (url.match(PROXY_PATH_PATTERN)) return true;
                        
    //                     // Check if it's already an absolute proxied URL
    //                     if (url.startsWith('http')) {
    //                         try {
    //                             const parsed = new URL(url, window.location.href);
    //                             if (parsed.pathname.indexOf('/editorProxy/') !== -1) return true;
    //                         } catch (e) {
    //                             // Invalid URL, skip it
    //                             return true;
    //                         }
    //                     }
                        
    //                     return false;
    //                 }

    //                 // Check if URL should be rewritten
    //                 function shouldRewrite(url) {
    //                     if (!url || typeof url !== 'string') return false;
                        
    //                     // CRITICAL: Skip if already proxied
    //                     if (isAlreadyProxied(url)) {
    //                         console.log('⏭️ [SKIP] Already proxied:', url);
    //                         return false;
    //                     }
                        
    //                     // Skip special protocols
    //                     if (/^(data:|mailto:|tel:|javascript:|blob:|about:|chrome:|edge:)/i.test(url)) {
    //                         return false;
    //                     }
                        
    //                     // Skip fragments only
    //                     if (url === '#' || url.startsWith('#')) return false;
                        
    //                     // Check rewrite limit
    //                     if (state.rewriteCount >= state.maxRewritesPerSession) {
    //                         console.warn('⚠️ [LIMIT] Rewrite limit reached');
    //                         return false;
    //                     }
                        
    //                     return true;
    //                 }

    //                 // Check if URL is same origin
    //                 function isSameOrigin(url) {
    //                     if (!url) return false;
                        
    //                     try {
    //                         // Handle absolute URLs
    //                         if (/^https?:\\/\\//i.test(url)) {
    //                             const testUrl = new URL(url);
    //                             return testUrl.hostname === originalHost &&
    //                                    testUrl.protocol === originalProtocol;
    //                         }
                            
    //                         // Handle protocol-relative URLs
    //                         if (url.startsWith('//')) {
    //                             const testUrl = new URL(originalProtocol + url);
    //                             return testUrl.hostname === originalHost;
    //                         }
                            
    //                         // Relative URLs are same origin
    //                         return true;
    //                     } catch (e) {
    //                         return false;
    //                     }
    //                 }

    //                 // Main URL rewriting function with caching
    //                 function rewriteUrl(url) {
    //                     // Check cache first
    //                     if (state.urlCache.has(url)) {
    //                         return state.urlCache.get(url);
    //                     }
                        
    //                     if (!shouldRewrite(url)) {
    //                         state.urlCache.set(url, url);
    //                         return url;
    //                     }
                        
    //                     let result = url;
                        
    //                     try {
    //                         // Handle absolute URLs
    //                         if (/^https?:\\/\\//i.test(url)) {
    //                             if (isSameOrigin(url)) {
    //                                 const parsed = new URL(url);
    //                                 result = PROXY_PATH_PREFIX + parsed.pathname + parsed.search + parsed.hash;
    //                                 console.log('✅ [REWRITE] Absolute:', url, '=>', result);
    //                                 state.rewriteCount++;
    //                             }
    //                         }
    //                         // Handle protocol-relative URLs
    //                         else if (url.startsWith('//')) {
    //                             if (isSameOrigin(url)) {
    //                                 const parsed = new URL(originalProtocol + url);
    //                                 result = PROXY_PATH_PREFIX + parsed.pathname + parsed.search + parsed.hash;
    //                                 console.log('✅ [REWRITE] Protocol-relative:', url, '=>', result);
    //                                 state.rewriteCount++;
    //                             }
    //                         }
    //                         // Handle root-relative URLs
    //                         else if (url.startsWith('/')) {
    //                             // CRITICAL: Don't rewrite if it already starts with proxy path
    //                             if (!url.startsWith('/editorProxy/')) {
    //                                 result = PROXY_PATH_PREFIX + url;
    //                                 console.log('✅ [REWRITE] Root-relative:', url, '=>', result);
    //                                 state.rewriteCount++;
    //                             }
    //                         }
    //                         // Handle relative URLs
    //                         else if (!url.includes(':')) {
    //                             // Calculate relative path based on current location
    //                             const currentPath = window.location.pathname.replace(PROXY_PATH_PREFIX, '');
    //                             const basePath = currentPath.substring(0, currentPath.lastIndexOf('/') + 1);
    //                             const resolvedPath = basePath + url;
                                
    //                             // Normalize the path
    //                             const parts = resolvedPath.split('/');
    //                             const normalized = [];
    //                             for (const part of parts) {
    //                                 if (part === '..') {
    //                                     normalized.pop();
    //                                 } else if (part !== '.' && part !== '') {
    //                                     normalized.push(part);
    //                                 }
    //                             }
                                
    //                             result = PROXY_PATH_PREFIX + '/' + normalized.join('/');
    //                             console.log('✅ [REWRITE] Relative:', url, '=>', result);
    //                             state.rewriteCount++;
    //                         }
    //                     } catch (e) {
    //                         console.error('❌ [ERROR] Rewrite failed:', url, e);
    //                     }
                        
    //                     // Cache the result
    //                     state.urlCache.set(url, result);
                        
    //                     // Safety check: if result contains double proxy paths, something went wrong
    //                     if (result.indexOf('/editorProxy/') !== result.lastIndexOf('/editorProxy/')) {
    //                         console.error('❌ [ERROR] Double proxy path detected:', result);
    //                         return url; // Return original to prevent corruption
    //                     }
                        
    //                     return result;
    //                 }

    //                 // Process element attributes
    //                 function processElement(element) {
    //                     // Skip if already processed or currently processing
    //                     if (state.processedNodes.has(element) || state.isProcessing) {
    //                         return;
    //                     }
                        
    //                     // Mark as processed immediately
    //                     state.processedNodes.add(element);
    //                     state.isProcessing = true;
                        
    //                     try {
    //                         const attrs = ['src', 'href', 'action', 'data-src', 'data-href', 'poster'];
                            
    //                         for (const attr of attrs) {
    //                             if (element.hasAttribute && element.hasAttribute(attr)) {
    //                                 const value = element.getAttribute(attr);
    //                                 if (value && !isAlreadyProxied(value)) {
    //                                     const rewritten = rewriteUrl(value);
    //                                     if (rewritten !== value) {
    //                                         // Temporarily disable observer to prevent feedback
    //                                         state.observerActive = false;
    //                                         element.setAttribute(attr, rewritten);
    //                                         setTimeout(() => { state.observerActive = true; }, 50);
    //                                     }
    //                                 }
    //                             }
    //                         }
                            
    //                         // Handle srcset separately (multiple URLs)
    //                         if (element.hasAttribute && element.hasAttribute('srcset')) {
    //                             const srcset = element.getAttribute('srcset');
    //                             if (srcset && !isAlreadyProxied(srcset)) {
    //                                 const rewritten = srcset.split(',').map(src => {
    //                                     const [url, descriptor] = src.trim().split(/\\s+/);
    //                                     if (shouldRewrite(url)) {
    //                                         return rewriteUrl(url) + (descriptor ? ' ' + descriptor : '');
    //                                     }
    //                                     return src;
    //                                 }).join(', ');
                                    
    //                                 if (rewritten !== srcset) {
    //                                     state.observerActive = false;
    //                                     element.setAttribute('srcset', rewritten);
    //                                     setTimeout(() => { state.observerActive = true; }, 50);
    //                                 }
    //                             }
    //                         }
                            
    //                         // Process children
    //                         if (element.children && element.children.length > 0) {
    //                             Array.from(element.children).forEach(child => {
    //                                 if (!state.processedNodes.has(child)) {
    //                                     processElement(child);
    //                                 }
    //                             });
    //                         }
    //                     } finally {
    //                         state.isProcessing = false;
    //                     }
    //                 }

    //                 // Mutation observer with debouncing
    //                 let mutationTimer = null;
    //                 const observer = new MutationObserver(function(mutations) {
    //                     // Skip if observer is not active
    //                     if (!state.observerActive) return;
                        
    //                     // Debounce mutations
    //                     clearTimeout(mutationTimer);
    //                     mutationTimer = setTimeout(() => {
    //                         processMutations(mutations);
    //                     }, 100);
    //                 });

    //                 function processMutations(mutations) {
    //                     if (state.isProcessing) return;
                        
    //                     // Temporarily disable observer
    //                     state.observerActive = false;
                        
    //                     mutations.forEach(mutation => {
    //                         if (mutation.type === 'childList') {
    //                             mutation.addedNodes.forEach(node => {
    //                                 if (node.nodeType === Node.ELEMENT_NODE && !state.processedNodes.has(node)) {
    //                                     processElement(node);
    //                                 }
    //                             });
    //                         }
    //                     });
                        
    //                     // Re-enable observer after delay
    //                     setTimeout(() => {
    //                         state.observerActive = true;
    //                     }, 100);
    //                 }

    //                 // Initialize when DOM is ready
    //                 function initialize() {
    //                     console.log('🔍 [INIT] Starting initial processing');
                        
    //                     // Process existing elements
    //                     processElement(document.body);
                        
    //                     // Start observing
    //                     state.observerActive = true;
    //                     observer.observe(document.body, {
    //                         childList: true,
    //                         subtree: true,
    //                         attributes: false // Don't observe attributes to prevent loops
    //                     });
                        
    //                     console.log('✅ [INIT] Rewriter ready, processed', state.rewriteCount, 'URLs');
    //                 }

    //                 // Start when ready
    //                 if (document.readyState === 'loading') {
    //                     document.addEventListener('DOMContentLoaded', initialize);
    //                 } else {
    //                     // Small delay to let initial page settle
    //                     setTimeout(initialize, 500);
    //                 }

    //                 // Periodic status check
    //                 setInterval(() => {
    //                     console.log('📊 [STATUS] Rewrites:', state.rewriteCount, 'Cache:', state.urlCache.size);
                        
    //                     // Clear cache if too large
    //                     if (state.urlCache.size > 500) {
    //                         state.urlCache.clear();
    //                         console.log('🧹 [CLEANUP] Cache cleared');
    //                     }
    //                 }, 30000);
    //             })();
    //             </script>
    //         `;

      // Insert the runtime rewriter script before closing head tag
      html = html.replace(/<\/head>/i, `${runtimeRewriterScript}</head>`);

      html = html.replace(/<\/body>/i, `${toolbarHtml} <script src="http://localhost:3000/editor.js"></script> </body>`);

      // Rewrite URLs to go through proxy (initial HTML)
      html = rewriteUrls(html, sessionId, baseUrl);

      // Set response headers - strip security headers that prevent embedding
      res.set('Content-Type', 'text/html; charset=utf-8');
      res.removeHeader('X-Frame-Options');
      res.removeHeader('Content-Security-Policy');
      res.removeHeader('X-Content-Security-Policy');
      res.removeHeader('X-WebKit-CSP');
      res.set('X-Content-Type-Options', 'nosniff');
      res.set('Referrer-Policy', 'strict-origin-when-cross-origin');

      console.log(
        '✅ [HTML COMPLETE] Served rewritten HTML with editor toolbar',
      );
      return res.send(html);
    }

    // Handle other resources (CSS, JS, images, etc.)
    console.log('📦 [RESOURCE] Serving non-HTML resource');

    const buffer = Buffer.from(await response.arrayBuffer());

    // Forward appropriate headers
    if (contentType) {
      res.set('Content-Type', contentType);
    }
    if (response.headers.get('cache-control')) {
      res.set('Cache-Control', response.headers.get('cache-control'));
    }
    if (response.headers.get('etag')) {
      res.set('ETag', response.headers.get('etag'));
    }
    if (response.headers.get('last-modified')) {
      res.set('Last-Modified', response.headers.get('last-modified'));
    }

    console.log('✅ [RESOURCE COMPLETE] Served', buffer.length, 'bytes');
    return res.send(buffer);
  } catch (err) {
    console.error('❌ [PROXY ERROR]', {
      message: err.message,
      sessionId,
      encodedUrl,
      path,
    });

    const errorHtml = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Proxy Error</title>
            <style>
                body { 
                    font-family: -apple-system, BlinkMacSystemFont, sans-serif; 
                    margin: 0; 
                    padding: 40px; 
                    background: #f8f9fa; 
                }
                .error { 
                    background: white; 
                    border: 1px solid #e74c3c; 
                    border-radius: 8px; 
                    padding: 24px; 
                    max-width: 600px; 
                    margin: 0 auto; 
                }
                .error h2 { 
                    color: #e74c3c; 
                    margin: 0 0 16px 0; 
                }
                .error p { 
                    margin: 8px 0; 
                    color: #666; 
                }
                .error code { 
                    background: #f1f2f6; 
                    padding: 2px 6px; 
                    border-radius: 3px; 
                    font-family: 'Monaco', 'Menlo', monospace; 
                    font-size: 13px;
                }
            </style>
        </head>
        <body>
            <div class="error">
                <h2>⚠️ Failed to Load Content</h2>
                <p><strong>Session:</strong> <code>${sessionId}</code></p>
                <p><strong>Error:</strong> ${err.message}</p>
                <p><strong>Path:</strong> <code>${path || '/'}</code></p>
            </div>
        </body>
        </html>
        `;

    res
      .status(500)
      .set('content-type', 'text/html; charset=utf-8')
      .send(errorHtml);
  }
});

app.use(express.static('public'));

app.listen(3000, () => {
  console.log(
    '🚀 [SERVER STARTED] VWO-style Visual Editor Proxy running at http://localhost:3000',
  );
  console.log('🔍 [DEBUG MODE] Detailed logging enabled');
  console.log(
    '🎨 [USAGE] Visit: http://localhost:3000 to launch the Visual Editor',
  );
  console.log(
    '📋 [EXAMPLE] URL format: /editorProxy/<sessionId>/<base64-encoded-url>/',
  );
});

