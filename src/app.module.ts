import { Module } from '@nestjs/common';
import { ConfigModule } from './config';
import { LoggerModule } from './logger';
import { HomeModule } from './home/home.module';
import { ProxyModule } from './proxy/proxy.module';
import { EditorRuntimeController } from './proxy/proxy.controller';

@Module({
  imports: [ConfigModule, LoggerModule, HomeModule, ProxyModule],
  controllers: [EditorRuntimeController],
})
export class AppModule {}
