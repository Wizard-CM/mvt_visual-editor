import { Body, Controller, Get, Param, Post, Req, Res } from '@nestjs/common';
import { Request, Response } from 'express';
import { LaunchRequestDto } from './dto';
import { ProxyService } from './proxy.service';
import * as fs from 'fs';
import * as path from 'path';

@Controller('proxy')
export class ProxyController {
  constructor(private readonly proxyService: ProxyService) {}

  /**
   * GET /proxy/session
   * Creates a new proxy session
   * @returns {object} Session information
   */
  @Get('session')
  createSession() {
    return this.proxyService.createSession();
  }

  /**
   * GET /proxy/status
   * Gets the proxy service status
   * @returns {object} Service status
   */
  @Get('status')
  getStatus() {
    return this.proxyService.getStatus();
  }

  /**
   * POST /proxy/launch
   * Launches a new editor session and redirects to editor
   * @param body Request body containing URL
   * @param res Express response object
   */
  @Post('launch')
  launchSession(@Body() body: LaunchRequestDto, @Res() res: Response) {
    const url = body.url;
    const result = this.proxyService.launchSession(url);

    // Redirect to the editor with the session
    res.redirect(result.redirectUrl);
  }

  /**
   * GET /proxy/editor/:sessionId/:encodedUrl/:subpath(*)
   * Handles proxy requests for resources.
   *
   * NOTE: The :subpath(*) pattern captures the remainder of the path (including slashes)
   * so you don't need to use @Param('0').
   * @param sessionId Session identifier
   * @param encodedUrl Base64 encoded target URL
   * @param subpath Request subpath (optional)
   * @param res Express response object
   * @param req Express request object
   */
  @Get('editor/:sessionId/:encodedUrl/:subpath(*)')
  async handleProxyRequest(
    @Param('sessionId') sessionId: string,
    @Param('encodedUrl') encodedUrl: string,
    @Param('subpath') subpath: string,
    @Res() res: Response,
    @Req() req: Request,
  ) {
    const queryString = req.url.includes('?')
      ? req.url.slice(req.url.indexOf('?'))
      : '';

    const result = await this.proxyService.handleProxyRequest(
      sessionId,
      encodedUrl,
      subpath,
      queryString,
      req.method,
      req.originalUrl,
      Object.fromEntries(
        Object.entries(req.headers).map(([key, value]) => [
          key,
          Array.isArray(value) ? value[0] : value,
        ]),
      ),
    );

    if (result.type === 'html') {
      Object.entries(result.headers).forEach(([key, value]) => {
        res.set(key, value);
      });
      res.send(result.content);
    } else if (result.type === 'resource') {
      Object.entries(result.headers).forEach(([key, value]) => {
        res.set(key, value);
      });
      res.send(result.content);
    } else if (result.type === 'error') {
      res.status(result.statusCode || 500);
      Object.entries(result.headers).forEach(([key, value]) => {
        res.set(key, value);
      });
      res.send(result.content);
    } else {
      res.json(result);
    }
  }
}

// Editor Runtime Assets Controller - serves runtime files at root level
@Controller('__editor')
export class EditorRuntimeController {
  /**
   * GET /__editor/runtime.js
   * Serves the editor runtime JavaScript
   */
  @Get('runtime.js')
  async getEditorRuntimeJS(@Res() res: Response) {
    try {
      // Use process.cwd() for absolute path resolution
      const runtimePath = path.join(
        process.cwd(),
        'public/__editor/runtime.js',
      );
      const js = fs.readFileSync(runtimePath, 'utf8');
      res.set('Content-Type', 'application/javascript; charset=utf-8');
      res.set('Cache-Control', 'public, max-age=3600');
      res.send(js);
    } catch (error) {
      res.status(404).send(`Editor runtime not found: ${error.message}`);
    }
  }

  /**
   * GET /__editor/runtime.css
   * Serves the editor runtime CSS
   */
  @Get('runtime.css')
  async getEditorRuntimeCSS(@Res() res: Response) {
    try {
      // Use process.cwd() for absolute path resolution
      const cssPath = path.join(process.cwd(), 'public/__editor/runtime.css');
      const css = fs.readFileSync(cssPath, 'utf8');
      res.set('Content-Type', 'text/css; charset=utf-8');
      res.set('Cache-Control', 'public, max-age=3600');
      res.send(css);
    } catch (error) {
      res.status(404).send(`Editor runtime CSS not found: ${error.message}`);
    }
  }

  /**
   * GET /__editor/test
   * Test route to verify controller is working
   */
  @Get('test')
  async testRoute(@Res() res: Response) {
    res.send('Editor runtime controller is working!');
  }
}

// Fallback controller to catch top-level asset requests that escaped rewriting
@Controller()
export class ProxyAssetFallbackController {
  constructor(private readonly proxyService: ProxyService) {}

  @Get(':path(*)')
  async proxyAssetFallback(
    @Param('path') path: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    // Ignore if already under /proxy or /__editor
    if (req.path.startsWith('/proxy') || req.path.startsWith('/__editor')) {
      return res.status(404).send('Not Found');
    }

    const referer = (req.headers.referer as string) || '';
    const m = referer.match(/\/proxy\/editor\/([^/]+)\/([^/]+)\//);
    if (!m) {
      return res.status(404).send('Not Found');
    }
    const sessionId = m[1];
    const encodedUrl = m[2];
    const queryString = req.url.includes('?')
      ? req.url.slice(req.url.indexOf('?'))
      : '';

    const result = await this.proxyService.handleProxyRequest(
      sessionId,
      encodedUrl,
      path,
      queryString,
      req.method,
      req.originalUrl,
      Object.fromEntries(
        Object.entries(req.headers).map(([key, value]) => [
          key,
          Array.isArray(value) ? value[0] : (value as string),
        ]),
      ),
    );

    if (result.type === 'resource' || result.type === 'html') {
      Object.entries(result.headers).forEach(([k, v]) => res.set(k, v));
      return res.send(result.content);
    }
    return res.status(result.statusCode || 500).send(result.content);
  }
}
