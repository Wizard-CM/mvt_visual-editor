import { Test, TestingModule } from '@nestjs/testing';
import { ProxyService } from './proxy.service';
import {
  SessionUtils,
  UrlUtils,
  ProxyUtils,
  FrameworkUrlRewriter,
} from '../utils';
import { ConfigService } from '../config';
import { LoggerService } from '../logger';

describe('ProxyService', () => {
  let service: ProxyService;
  let sessionUtils: SessionUtils;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProxyService,
        {
          provide: SessionUtils,
          useValue: {
            createSession: jest.fn(),
            getShortSessionId: jest.fn(),
          },
        },
        {
          provide: UrlUtils,
          useValue: {},
        },
        {
          provide: ProxyUtils,
          useValue: {},
        },
        {
          provide: FrameworkUrlRewriter,
          useValue: {
            rewriteUrls: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            sessionTtl: 3600,
            nodeEnv: 'development',
            proxyTimeout: 30000,
            logLevel: 'info',
          },
        },
        {
          provide: LoggerService,
          useValue: {
            setContext: jest.fn().mockReturnThis(),
            debug: jest.fn(),
            info: jest.fn(),
            logSession: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ProxyService>(ProxyService);
    sessionUtils = module.get<SessionUtils>(SessionUtils);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createSession', () => {
    it('should create a new session', () => {
      const mockSession = {
        id: 'test-session-id',
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 3600000),
      };

      const mockShortId = 'test-ses...';

      jest.spyOn(sessionUtils, 'createSession').mockReturnValue(mockSession);
      jest
        .spyOn(sessionUtils, 'getShortSessionId')
        .mockReturnValue(mockShortId);

      const result = service.createSession();

      expect(sessionUtils.createSession).toHaveBeenCalledWith(3600);
      expect(sessionUtils.getShortSessionId).toHaveBeenCalledWith(
        mockSession.id,
      );
      expect(result).toEqual({
        message: 'Session created successfully',
        sessionId: mockSession.id,
        expiresAt: mockSession.expiresAt,
        shortId: mockShortId,
      });
    });
  });

  describe('getStatus', () => {
    it('should return service status', () => {
      const result = service.getStatus();

      expect(result).toHaveProperty('service', 'Proxy Service');
      expect(result).toHaveProperty('status', 'running');
      expect(result).toHaveProperty('timestamp');
      expect(result).toHaveProperty('environment', 'development');
      expect(result).toHaveProperty('utilities');
      expect(result.utilities).toHaveProperty('session', 'SessionUtils loaded');
      expect(result.utilities).toHaveProperty('url', 'UrlUtils loaded');
      expect(result.utilities).toHaveProperty('proxy', 'ProxyUtils loaded');
      expect(result).toHaveProperty('configuration');
      expect(result.configuration).toHaveProperty('sessionTtl', 3600);
      expect(result.configuration).toHaveProperty('proxyTimeout', 30000);
      expect(result.configuration).toHaveProperty('logLevel', 'info');
    });

    it('should return current timestamp', () => {
      const before = new Date();
      const result = service.getStatus();
      const after = new Date();

      const timestamp = new Date(result.timestamp);
      expect(timestamp.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(timestamp.getTime()).toBeLessThanOrEqual(after.getTime());
    });
  });
});
