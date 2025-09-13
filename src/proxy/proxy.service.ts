import { Injectable } from '@nestjs/common';
import { SessionUtils, UrlUtils, FrameworkUrlRewriter } from '../utils';
import { ConfigService } from '../config';
import { LoggerService } from '../logger';

@Injectable()
export class ProxyService {
  constructor(
    private readonly sessionUtils: SessionUtils,
    private readonly urlUtils: UrlUtils,
    private readonly frameworkUrlRewriter: FrameworkUrlRewriter,
    private readonly configService: ConfigService,
    private readonly logger: LoggerService,
  ) {}

  /**
   * Creates a new proxy session
   * @returns {object} Session information
   */
  createSession() {
    this.logger.setContext('ProxyService').info('Creating new session');

    const session = this.sessionUtils.createSession(
      this.configService.sessionTtl,
    );

    this.logger.logSession(session.id, 'created', {
      ttl: this.configService.sessionTtl,
      expiresAt: session.expiresAt,
    });

    return {
      message: 'Session created successfully',
      sessionId: session.id,
      expiresAt: session.expiresAt,
      shortId: this.sessionUtils.getShortSessionId(session.id),
    };
  }

  /**
   * Gets proxy service status
   * @returns {object} Service status information
   */
  getStatus() {
    this.logger.setContext('ProxyService').debug('Status requested');
    return {
      service: 'Proxy Service',
      status: 'running',
      timestamp: new Date().toISOString(),
      environment: this.configService.nodeEnv,
      utilities: {
        session: 'SessionUtils loaded',
        url: 'UrlUtils loaded',
      },
      configuration: {
        sessionTtl: this.configService.sessionTtl,
        proxyTimeout: this.configService.proxyTimeout,
        logLevel: this.configService.logLevel,
      },
    };
  }

  /**
   * Creates a new proxy session and redirects to editor
   * @param url Target URL to proxy
   * @returns {object} Session information with redirect URL
   */
  launchSession(url: string) {
    this.logger
      .setContext('ProxyService')
      .info(`Launch session requested for URL: ${url}`);

    const sessionId = this.sessionUtils.createSession(
      this.configService.sessionTtl,
    ).id;
    const encodedUrl = this.urlUtils.encodeUrl(url);

    this.logger.logSession(sessionId, 'launch_created', {
      targetUrl: url,
      encodedUrl,
      ttl: this.configService.sessionTtl,
    });

    return {
      sessionId,
      targetUrl: url,
      encodedUrl,
      redirectUrl: `/proxy/editor/${sessionId}/${encodedUrl}/`,
    };
  }

  /**
   * Handles proxy requests for resources
   * @param sessionId Session identifier
   * @param encodedUrl Base64 encoded target URL
   * @param subpath Request subpath (optional)
   * @param queryString Query string from request
   * @param method HTTP method
   * @param originalUrl Original request URL
   * @param headers Request headers
   * @returns {Promise<object>} Proxy response with content and headers
   */
  async handleProxyRequest(
    sessionId: string,
    encodedUrl: string,
    subpath: string,
    queryString: string,
    method: string,
    originalUrl: string,
    headers: Record<string, string>,
  ) {
    this.logger
      .setContext('ProxyService')
      .info(
        `Proxy request received for session: ${sessionId}, URL: ${encodedUrl}, subpath: ${subpath}`,
      );

    try {
      // Decode the base URL
      const baseUrl = this.urlUtils.decodeUrl(encodedUrl);
      const path = subpath ? `/${subpath}` : '';
      const targetUrl = `${baseUrl}${path}${queryString}`;

      this.logger.logProxy(sessionId, 'fetching', baseUrl, {
        originalUrl,
        baseUrl,
        targetUrl,
        method,
        path,
        queryString,
      });

      // Fetch the target URL with proper headers
      const response = await fetch(targetUrl, {
        method,
        headers: {
          'User-Agent':
            headers['user-agent'] ||
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          Accept: headers.accept || '*/*',
          'Accept-Language': headers['accept-language'] || 'en-US,en;q=0.9',
          'Accept-Encoding': 'gzip, deflate, br',
          'Cache-Control': 'no-cache',
          Pragma: 'no-cache',
          // Forward relevant headers but filter out problematic ones
          ...(headers.referer && { Referer: baseUrl }),
          ...(headers.cookie && { Cookie: headers.cookie }),
        },
        redirect: 'follow',
      });

      this.logger.logProxy(sessionId, 'response_received', baseUrl, {
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

      // Handle HTML responses - inject editor runtime and rewrite URLs
      if (contentType.includes('text/html')) {
        let html = await response.text();
        this.logger.logProxy(sessionId, 'html_processing', baseUrl, {
          htmlLength: html.length,
        });

        // Inject editor runtime CSS and JS
        const injectEditorRuntime = () => {
          const runtimeCSS = `<link rel="stylesheet" href="/__editor/runtime.css" id="__editor_css">`;
          const runtimeRoot = `<div id="__editor_root" data-session="${sessionId}" data-parent-origin="http://localhost:3333"></div>`;
          const runtimeScript = `<script id="__editor_js" src="/__editor/runtime.js" defer></script>`;

          try {
            const origin = new URL(baseUrl).origin;
            const encodedOrigin = this.urlUtils.encodeUrl(origin);
            const baseTag = `<base href="/proxy/editor/${sessionId}/${encodedOrigin}/">`;

            // More robust head injection
            if (!/\<base\s+href=/i.test(html)) {
              if (/\<head\>/i.test(html)) {
                html = html.replace(/<head>/i, `<head>${baseTag}${runtimeCSS}`);
              } else if (/\<head\s+[^>]*>/i.test(html)) {
                html = html.replace(
                  /<head([^>]*)>/i,
                  `<head$1>${baseTag}${runtimeCSS}`,
                );
              } else {
                // Insert head tag if it doesn't exist
                html = html.replace(
                  /<body/i,
                  `<head>${baseTag}${runtimeCSS}</head>\n<body`,
                );
              }
            } else {
              if (/\<head\>/i.test(html)) {
                html = html.replace(/<head>/i, `<head>${runtimeCSS}`);
              } else if (/\<head\s+[^>]*>/i.test(html)) {
                html = html.replace(/<head([^>]*)>/i, `<head$1>${runtimeCSS}`);
              } else {
                // Insert head tag if it doesn't exist
                html = html.replace(
                  /<body/i,
                  `<head>${runtimeCSS}</head>\n<body`,
                );
              }
            }

            // More robust body injection
            if (/\<body\>/i.test(html)) {
              html = html.replace(/<body>/i, `<body>${runtimeRoot}`);
            } else if (/\<body\s+[^>]*>/i.test(html)) {
              html = html.replace(/<body([^>]*)>/i, `<body$1>${runtimeRoot}`);
            } else {
              // Insert body tag if it doesn't exist
              html = html.replace(
                /<\/html>/i,
                `<body>${runtimeRoot}</body>\n</html>`,
              );
            }

            // Inject script before closing body
            if (/\<\/body\>/i.test(html)) {
              html = html.replace(/<\/body>/i, `${runtimeScript}</body>`);
            } else {
              // Insert before closing html if no body closing tag
              html = html.replace(/<\/html>/i, `${runtimeScript}\n</html>`);
            }
          } catch (error) {
            console.error('Error injecting editor runtime:', error);
            // Fallback injection
            html = html.replace(/<\/head>/i, `${runtimeCSS}</head>`);
            html = html.replace(/<body([^>]*)>/i, `<body$1>${runtimeRoot}`);
            html = html.replace(/<\/body>/i, `${runtimeScript}</body>`);
          }
        };

        // Inject editor runtime BEFORE framework rewriting to ensure it's not interfered with
        injectEditorRuntime();

        // Rewrite URLs to go through proxy using framework-aware rewriter
        const rewriteResult = this.frameworkUrlRewriter.rewriteUrls(
          html,
          sessionId,
          baseUrl,
        );
        html = rewriteResult.rewrittenHtml;

        // Canonicalize any absolute references to the current host (e.g., http://localhost:3000)
        try {
          const origin = new URL(baseUrl).origin;
          const encodedOrigin = this.urlUtils.encodeUrl(origin);
          const currentHost = headers['host'];
          if (currentHost) {
            const escapedHost = currentHost.replace(
              /[.*+?^${}()|[\]\\]/g,
              '\\$&',
            );
            const hostRegex = new RegExp(`https?:\\/\\/${escapedHost}`, 'g');
            html = html.replace(
              hostRegex,
              `/proxy/editor/${sessionId}/${encodedOrigin}`,
            );
          }
        } catch {}

        this.logger.logProxy(sessionId, 'html_complete', baseUrl, {
          message: 'Served rewritten HTML without toolbar',
        });

        return {
          type: 'html',
          content: html,
          headers: {
            'Content-Type': 'text/html; charset=utf-8',
            'X-Content-Type-Options': 'nosniff',
            'Referrer-Policy': 'strict-origin-when-cross-origin',
            'Content-Security-Policy':
              "default-src 'self' 'unsafe-inline' 'unsafe-eval'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';",
          },
        };
      }

      // Handle other resources (CSS, JS, images, etc.)
      this.logger.logProxy(sessionId, 'resource_serving', baseUrl, {
        message: 'Serving non-HTML resource',
      });

      // Special handling for Next.js/runtime JS to fix publicPath (/_next/)
      if (
        contentType.includes('javascript') ||
        response.url.includes('/_next/static/')
      ) {
        let js = await response.text();

        // Compute public path that points back through the proxy
        const origin = new URL(baseUrl).origin;
        const encodedOrigin = this.urlUtils.encodeUrl(origin);
        const publicPath = `/proxy/editor/${sessionId}/${encodedOrigin}/_next/`;

        // Common patterns to set webpack public path in Next.js bundles
        // 1) r.p="/_next/"
        js = js.replace(
          /([\.;\s])r\.p\s*=\s*"\/_next\/"/g,
          `$1r.p="${publicPath}"`,
        );
        // 2) __webpack_require__.p="/_next/"
        js = js.replace(
          /__webpack_require__\.p\s*=\s*"\/_next\/"/g,
          `__webpack_require__.p="${publicPath}"`,
        );
        // 3) any "/_next/" URL strings used for dynamic loading
        js = js.replace(/"\/_next\//g, `"${publicPath}`);
        // 4) Next 13/14 uses self.__next_require__.p or globalThis.__next_require__
        js = js.replace(
          /(__next_require__\.p\s*=\s*)"\/_next\/"/g,
          `$1"${publicPath}"`,
        );
        js = js.replace(
          /(self|globalThis)\.__next_require__\.p\s*=\s*"\/_next\/"/g,
          `$1.__next_require__.p="${publicPath}"`,
        );

        const jsBuffer = Buffer.from(js, 'utf-8');

        const jsHeaders: Record<string, string> = {
          'Content-Type': contentType.includes('javascript')
            ? 'application/javascript; charset=utf-8'
            : contentType,
        };
        if (response.headers.get('cache-control')) {
          jsHeaders['Cache-Control'] = response.headers.get('cache-control')!;
        }

        this.logger.logProxy(sessionId, 'resource_complete', baseUrl, {
          message: `Served rewritten JS ${jsBuffer.length} bytes`,
        });

        return {
          type: 'resource',
          content: jsBuffer,
          headers: jsHeaders,
        };
      }

      const buffer = Buffer.from(await response.arrayBuffer());

      // Forward appropriate headers
      const responseHeaders: Record<string, string> = {};
      if (contentType) {
        responseHeaders['Content-Type'] = contentType;
      }
      if (response.headers.get('cache-control')) {
        responseHeaders['Cache-Control'] =
          response.headers.get('cache-control')!;
      }
      if (response.headers.get('etag')) {
        responseHeaders['ETag'] = response.headers.get('etag')!;
      }
      if (response.headers.get('last-modified')) {
        responseHeaders['Last-Modified'] =
          response.headers.get('last-modified')!;
      }

      this.logger.logProxy(sessionId, 'resource_complete', baseUrl, {
        message: `Served ${buffer.length} bytes`,
      });

      return {
        type: 'resource',
        content: buffer,
        headers: responseHeaders,
      };
    } catch (err) {
      this.logger.logProxy(sessionId, 'error', encodedUrl, {
        message: err.message,
        sessionId,
        encodedUrl,
        path: subpath,
      });

      // Return a simple error response instead of using the unused getErrorHtml method
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
              <p><strong>Path:</strong> <code>${subpath || '/'}</code></p>
          </div>
      </body>
      </html>
      `;

      return {
        type: 'error',
        content: errorHtml,
        statusCode: 500,
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
        },
      };
    }
  }

  /**
   * Returns CSP-friendly external runtime script content
   */
  public getRuntimeScriptExternal(
    sessionId: string,
    encodedUrl: string,
  ): string {
    const baseUrl = this.urlUtils.decodeUrl(encodedUrl);
    const encodedOrigin = this.urlUtils.encodeUrl(new URL(baseUrl).origin);
    return `
      (function(){
        var sessionId = '${sessionId}';
        var encodedOrigin = '${encodedOrigin}';
        var originalOrigin = '${new URL(baseUrl).origin}';
        // Disable Service Workers that can hijack/cross-cache proxied resources
        try {
          if ('serviceWorker' in navigator) {
            navigator.serviceWorker.getRegistrations().then(function(list){
              try { list.forEach(function(reg){ reg.unregister && reg.unregister(); }); } catch(e){}
            }).catch(function(){});
            try {
              var sw = navigator.serviceWorker;
              var orig = sw.register && sw.register.bind(sw);
              if (orig) { sw.register = function(){ return Promise.reject(new Error('ServiceWorker disabled by proxy runtime')); }; }
            } catch(e){}
          }
        } catch(e){}
        function ensureToolbar(){
          var id='proxy-pill-host';
          var host=document.getElementById(id);
          if(!host){
            host=document.createElement('div');
            host.id=id; host.style.position='fixed'; host.style.bottom='18px'; host.style.right='18px'; host.style.zIndex='2147483647'; host.style.pointerEvents='none'; host.style.display='block'; host.style.opacity='1'; host.style.isolation='isolate'; host.style.contain='content';
            (document.body||document.documentElement).appendChild(host);
            try{
              var root=host.attachShadow?host.attachShadow({mode:'open'}):host;
              var panel=document.createElement('div');
              panel.style.cssText='position:fixed;right:18px;bottom:58px;width:320px;max-height:70vh;background:#111;color:#fff;border:1px solid #2c2c2c;border-radius:8px;box-shadow:0 10px 30px rgba(0,0,0,.4);padding:10px;display:none;gap:8px;font:500 12px/1.4 system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;';
              panel.innerHTML='<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px"><span style="opacity:.85">Visual Editor</span><button id="proxy-close" style="all:unset;cursor:pointer;color:#bbb">✕</button></div><div style="display:flex;flex-wrap:wrap;gap:6px"><button id="proxy-rewrite" style="all:unset;cursor:pointer;background:#1a73e8;color:#fff;border-radius:6px;padding:6px 8px">Rewrite URLs</button><button id="proxy-hide" style="all:unset;cursor:pointer;background:#333;color:#fff;border-radius:6px;padding:6px 8px">Hide</button></div>';
              pill.addEventListener('click',function(e){e.preventDefault();panel.style.display=panel.style.display==='none'?'block':'none';});
              root.appendChild(panel);
              root.appendChild(pill);
              var btnRewrite=panel.querySelector('#proxy-rewrite');
              var btnClose=panel.querySelector('#proxy-close');
              var btnHide=panel.querySelector('#proxy-hide');
              if(btnRewrite){ btnRewrite.addEventListener('click',function(){ try{ rewriteElementUrls(document.documentElement); }catch(err){} }); }
              if(btnClose){ btnClose.addEventListener('click',function(){ panel.style.display='none'; }); }
              if(btnHide){ btnHide.addEventListener('click',function(){ host.style.display='none'; setTimeout(function(){ host.style.display='block'; }, 2000); }); }
              try {
                // If for any reason it is not visible (covered/off-screen), relocate to top-left
                setTimeout(function(){
                  var r=host.getBoundingClientRect();
                  if(r.width===0||r.height===0||r.right<24||r.bottom<24){
                    host.style.bottom='auto'; host.style.right='auto'; host.style.top='18px'; host.style.left='18px';
                  }
                }, 50);
              } catch(e){}
            }catch(e){/* ignore */}
          } else {
            // Ensure host stays attached to body and visible
            if(host.parentNode!==document.body&&document.body){ document.body.appendChild(host); }
            host.style.display='block'; host.style.opacity='1';
          }
        }
        function onRouteChange(){ try{ rewriteElementUrls(document.documentElement); ensureToolbar(); }catch(e){} }
        (function wrapHistory(){
          var _ps=history.pushState, _rs=history.replaceState;
          history.pushState=function(a,b,c){ try{ var r=_ps.apply(this,arguments); setTimeout(onRouteChange, 0); return r; }catch(e){ return _ps.apply(this,arguments);} };
          history.replaceState=function(a,b,c){ try{ var r=_rs.apply(this,arguments); setTimeout(onRouteChange, 0); return r; }catch(e){ return _rs.apply(this,arguments);} };
          window.addEventListener('popstate', onRouteChange);
        })();
        function whenNextReady(cb){
          var tries=0; (function tick(){
            var ok=document.getElementById('__next')||document.querySelector('#__next, [data-nextjs-router]');
            if(ok||tries>200){ cb(); return; } tries++; requestAnimationFrame(tick);
          })();
        }
        function rewriteUrl(url){
          if(!url) return url;
          if(url.indexOf('/proxy/editor/')!==-1) return url;
          if(url.indexOf('data:')===0||url.indexOf('blob:')===0||url.indexOf('javascript:')===0) return url;
          if(url.charAt(0)==='/') return '/proxy/editor/'+sessionId+'/'+encodedOrigin+url;
          if(url.indexOf(originalOrigin)===0){
            var path=url.substring(originalOrigin.length);
            return '/proxy/editor/'+sessionId+'/'+encodedOrigin+path;
          }
          if(url.indexOf('//')===0){
            try{
              var abs=window.location.protocol+url;var u=new URL(abs);
              var oh=new URL(originalOrigin).host; if(u.host===oh){
                return '/proxy/editor/'+sessionId+'/'+encodedOrigin+u.pathname+(u.search||'')+(u.hash||'');
              }
              return abs;
            }catch(e){}
          }
          return url;
        }
        var observer=new MutationObserver(function(m){m.forEach(function(mm){
          ensureToolbar();
          if(mm.type==='attributes'&&mm.target&&mm.target.getAttribute){
            var attrs=['src','href','action'];
            for(var i=0;i<attrs.length;i++){
              var a=attrs[i]; if(mm.target.hasAttribute(a)){
                var v=mm.target.getAttribute(a)||''; var r=rewriteUrl(v); if(r!==v) mm.target.setAttribute(a,r);
              }
            }
          }
          mm.addedNodes&&mm.addedNodes.forEach(function(node){
            if(node.nodeType===1){
              var el=node; var attrs=['src','href','action'];
              for(var i=0;i<attrs.length;i++){
                var a=attrs[i]; if(el.hasAttribute&&el.hasAttribute(a)){
                  var v=el.getAttribute(a)||''; var r=rewriteUrl(v); if(r!==v) el.setAttribute(a,r);
                }
              }
            }
          })
        })});
        var start=function(){ ensureToolbar(); observer.observe(document.documentElement,{subtree:true,childList:true,attributes:true}); };
        if(document.readyState==='loading'){
          document.addEventListener('DOMContentLoaded', function(){ whenNextReady(start); });
        }else{ whenNextReady(start); }
        // Keep toolbar alive but unobtrusive
        setInterval(ensureToolbar, 600);
      })();
    `;
  }
}
