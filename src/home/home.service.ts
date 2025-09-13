import { Injectable } from '@nestjs/common';

@Injectable()
export class HomeService {
  /**
   * Returns the HTML for the main page with URL input form
   * @returns {string} HTML content for the home page
   */
  getMainPage(): string {
    return `
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
            <form method="POST" action="/proxy/launch">
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
  }
}
