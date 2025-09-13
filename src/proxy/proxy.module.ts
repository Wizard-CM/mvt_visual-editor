import { Module } from '@nestjs/common';
import {
  SessionUtils,
  UrlUtils,
  ProxyUtils,
  FrameworkDetector,
  FrameworkUrlRewriter,
} from '../utils';
import {
  ProxyController,
  ProxyAssetFallbackController,
} from './proxy.controller';
import { ProxyService } from './proxy.service';

@Module({
  controllers: [ProxyController, ProxyAssetFallbackController],
  providers: [
    ProxyService,
    SessionUtils,
    UrlUtils,
    ProxyUtils,
    FrameworkDetector,
    FrameworkUrlRewriter,
  ],
  exports: [ProxyService],
})
export class ProxyModule {}
