import { Test, TestingModule } from '@nestjs/testing';
import { ProxyController } from './proxy.controller';
import { ProxyService } from './proxy.service';

describe('ProxyController', () => {
  let controller: ProxyController;
  let service: ProxyService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProxyController],
      providers: [
        {
          provide: ProxyService,
          useValue: {
            createSession: jest.fn(),
            getStatus: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<ProxyController>(ProxyController);
    service = module.get<ProxyService>(ProxyService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createSession', () => {
    it('should create a new session', () => {
      const mockSessionData = {
        message: 'Session created successfully',
        sessionId: 'test-session-id',
        expiresAt: new Date(),
        shortId: 'test-ses...',
      };

      jest.spyOn(service, 'createSession').mockReturnValue(mockSessionData);

      const result = controller.createSession();

      expect(service.createSession).toHaveBeenCalled();
      expect(result).toEqual(mockSessionData);
    });
  });

  describe('getStatus', () => {
    it('should return service status', () => {
      const mockStatus = {
        service: 'Proxy Service',
        status: 'running',
        timestamp: new Date().toISOString(),
        environment: 'development',
        utilities: {
          session: 'SessionUtils loaded',
          url: 'UrlUtils loaded',
          proxy: 'ProxyUtils loaded',
        },
        configuration: {
          sessionTtl: 3600,
          proxyTimeout: 30000,
          logLevel: 'info',
        },
      };

      jest.spyOn(service, 'getStatus').mockReturnValue(mockStatus);

      const result = controller.getStatus();

      expect(service.getStatus).toHaveBeenCalled();
      expect(result).toEqual(mockStatus);
    });
  });
});
