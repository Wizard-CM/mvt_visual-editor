import { Controller, Get, Res } from '@nestjs/common';
import { Response } from 'express';
import { HomeService } from './home.service';

@Controller()
export class HomeController {
  constructor(private readonly homeService: HomeService) {}

  /**
   * GET /
   * Serves the main page with URL input form at root URL
   */
  @Get()
  getHomePage(@Res() res: Response) {
    const html = this.homeService.getMainPage();
    res.set('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
  }
}
