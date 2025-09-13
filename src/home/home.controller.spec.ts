import { Test, TestingModule } from '@nestjs/testing';
import { Response } from 'express';
import { HomeController } from './home.controller';
import { HomeService } from './home.service';

describe('HomeController', () => {
  let controller: HomeController;
  let service: HomeService;
  let mockResponse: Partial<Response>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HomeController],
      providers: [
        {
          provide: HomeService,
          useValue: {
            getMainPage: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<HomeController>(HomeController);
    service = module.get<HomeService>(HomeService);

    // Mock Express response object
    mockResponse = {
      set: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
    };
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getHomePage', () => {
    it('should call home service getMainPage method', () => {
      const mockHtml = '<html><body>Test HTML</body></html>';
      jest.spyOn(service, 'getMainPage').mockReturnValue(mockHtml);

      controller.getHomePage(mockResponse as Response);

      expect(service.getMainPage).toHaveBeenCalled();
    });

    it('should set correct Content-Type header', () => {
      const mockHtml = '<html><body>Test HTML</body></html>';
      jest.spyOn(service, 'getMainPage').mockReturnValue(mockHtml);

      controller.getHomePage(mockResponse as Response);

      expect(mockResponse.set).toHaveBeenCalledWith(
        'Content-Type',
        'text/html; charset=utf-8',
      );
    });

    it('should send HTML content from service', () => {
      const mockHtml = '<html><body>Test HTML</body></html>';
      jest.spyOn(service, 'getMainPage').mockReturnValue(mockHtml);

      controller.getHomePage(mockResponse as Response);

      expect(mockResponse.send).toHaveBeenCalledWith(mockHtml);
    });

    it('should handle HTML with special characters correctly', () => {
      const mockHtml =
        '<html><body>Test &amp; HTML &lt;content&gt;</body></html>';
      jest.spyOn(service, 'getMainPage').mockReturnValue(mockHtml);

      controller.getHomePage(mockResponse as Response);

      expect(mockResponse.send).toHaveBeenCalledWith(mockHtml);
    });

    it('should handle empty HTML content', () => {
      const mockHtml = '';
      jest.spyOn(service, 'getMainPage').mockReturnValue(mockHtml);

      controller.getHomePage(mockResponse as Response);

      expect(mockResponse.send).toHaveBeenCalledWith(mockHtml);
    });

    it('should handle very long HTML content', () => {
      const mockHtml = '<html><body>' + 'x'.repeat(10000) + '</body></html>';
      jest.spyOn(service, 'getMainPage').mockReturnValue(mockHtml);

      controller.getHomePage(mockResponse as Response);

      expect(mockResponse.send).toHaveBeenCalledWith(mockHtml);
    });

    it('should call service method only once per request', () => {
      const mockHtml = '<html><body>Test HTML</body></html>';
      jest.spyOn(service, 'getMainPage').mockReturnValue(mockHtml);

      controller.getHomePage(mockResponse as Response);

      expect(service.getMainPage).toHaveBeenCalledTimes(1);
    });

    it('should set headers before sending response', () => {
      const mockHtml = '<html><body>Test HTML</body></html>';
      jest.spyOn(service, 'getMainPage').mockReturnValue(mockHtml);

      controller.getHomePage(mockResponse as Response);

      // Verify the order: set() should be called before send()
      const setCallIndex = (mockResponse.set as jest.Mock).mock
        .invocationCallOrder[0];
      const sendCallIndex = (mockResponse.send as jest.Mock).mock
        .invocationCallOrder[0];

      expect(setCallIndex).toBeLessThan(sendCallIndex);
    });

    it('should handle service throwing error gracefully', () => {
      jest.spyOn(service, 'getMainPage').mockImplementation(() => {
        throw new Error('Service error');
      });

      expect(() => {
        controller.getHomePage(mockResponse as Response);
      }).toThrow('Service error');
    });

    it('should return void (no return value)', () => {
      const mockHtml = '<html><body>Test HTML</body></html>';
      jest.spyOn(service, 'getMainPage').mockReturnValue(mockHtml);

      const result = controller.getHomePage(mockResponse as Response);

      expect(result).toBeUndefined();
    });
  });
});
