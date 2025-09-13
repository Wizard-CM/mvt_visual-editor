import { Test, TestingModule } from '@nestjs/testing';
import { SessionUtils, SessionInfo } from './session.utils';

describe('SessionUtils', () => {
  let service: SessionUtils;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SessionUtils],
    }).compile();

    service = module.get<SessionUtils>(SessionUtils);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateSessionId', () => {
    it('should generate a unique session ID', () => {
      const sessionId1 = service.generateSessionId();
      const sessionId2 = service.generateSessionId();

      expect(sessionId1).toBeDefined();
      expect(sessionId1).toHaveLength(40); // 20 bytes = 40 hex characters
      expect(sessionId1).toMatch(/^[a-f0-9]+$/);
      expect(sessionId1).not.toBe(sessionId2);
    });

    it('should generate different IDs on multiple calls', () => {
      const ids = new Set();
      for (let i = 0; i < 100; i++) {
        ids.add(service.generateSessionId());
      }
      expect(ids.size).toBe(100);
    });
  });

  describe('generateSessionIdWithLength', () => {
    it('should generate session ID with custom length', () => {
      const sessionId = service.generateSessionIdWithLength(16);
      expect(sessionId).toHaveLength(32); // 16 bytes = 32 hex characters
      expect(sessionId).toMatch(/^[a-f0-9]+$/);
    });

    it('should throw error for too short length', () => {
      expect(() => service.generateSessionIdWithLength(4)).toThrow(
        'Session ID must be at least 8 bytes long for security',
      );
    });

    it('should use default length when not specified', () => {
      const sessionId = service.generateSessionIdWithLength();
      expect(sessionId).toHaveLength(40);
    });
  });

  describe('createSession', () => {
    it('should create session without TTL', () => {
      const session = service.createSession();

      expect(session.id).toBeDefined();
      expect(session.id).toHaveLength(40);
      expect(session.createdAt).toBeInstanceOf(Date);
      expect(session.expiresAt).toBeUndefined();
    });

    it('should create session with TTL', () => {
      const ttl = 3600; // 1 hour
      const session = service.createSession(ttl);

      expect(session.id).toBeDefined();
      expect(session.createdAt).toBeInstanceOf(Date);
      expect(session.expiresAt).toBeInstanceOf(Date);

      if (session.expiresAt) {
        const expectedExpiry = new Date(Date.now() + ttl * 1000);
        const timeDiff = Math.abs(
          session.expiresAt.getTime() - expectedExpiry.getTime(),
        );
        expect(timeDiff).toBeLessThan(1000); // Within 1 second
      }
    });
  });

  describe('validateSessionId', () => {
    it('should validate correct session ID', () => {
      const validId = 'a'.repeat(40);
      const result = service.validateSessionId(validId);

      expect(result.isValid).toBe(true);
      expect(result.reason).toBeUndefined();
    });

    it('should reject empty session ID', () => {
      const result = service.validateSessionId('');

      expect(result.isValid).toBe(false);
      expect(result.reason).toBe('Session ID must be a non-empty string');
    });

    it('should reject null session ID', () => {
      const result = service.validateSessionId(null as any);

      expect(result.isValid).toBe(false);
      expect(result.reason).toBe('Session ID must be a non-empty string');
    });

    it('should reject too short session ID', () => {
      const result = service.validateSessionId('abc123');

      expect(result.isValid).toBe(false);
      expect(result.reason).toBe(
        'Session ID must be at least 16 characters long',
      );
    });

    it('should reject session ID with invalid characters', () => {
      const result = service.validateSessionId('a'.repeat(20) + 'g');

      expect(result.isValid).toBe(false);
      expect(result.reason).toBe(
        'Session ID must contain only hexadecimal characters',
      );
    });
  });

  describe('isSessionExpired', () => {
    it('should return false for session without expiration', () => {
      const session: SessionInfo = {
        id: 'test123',
        createdAt: new Date(),
      };

      expect(service.isSessionExpired(session)).toBe(false);
    });

    it('should return false for non-expired session', () => {
      const session: SessionInfo = {
        id: 'test123',
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 3600000), // 1 hour from now
      };

      expect(service.isSessionExpired(session)).toBe(false);
    });

    it('should return true for expired session', () => {
      const session: SessionInfo = {
        id: 'test123',
        createdAt: new Date(),
        expiresAt: new Date(Date.now() - 3600000), // 1 hour ago
      };

      expect(service.isSessionExpired(session)).toBe(true);
    });
  });

  describe('getRemainingTime', () => {
    it('should return -1 for session without expiration', () => {
      const session: SessionInfo = {
        id: 'test123',
        createdAt: new Date(),
      };

      expect(service.getRemainingTime(session)).toBe(-1);
    });

    it('should return remaining time for non-expired session', () => {
      const ttl = 3600; // 1 hour
      const session: SessionInfo = {
        id: 'test123',
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + ttl * 1000),
      };

      const remaining = service.getRemainingTime(session);
      expect(remaining).toBeGreaterThan(0);
      expect(remaining).toBeLessThanOrEqual(ttl);
    });

    it('should return 0 for expired session', () => {
      const session: SessionInfo = {
        id: 'test123',
        createdAt: new Date(),
        expiresAt: new Date(Date.now() - 1000), // 1 second ago
      };

      expect(service.getRemainingTime(session)).toBe(0);
    });
  });

  describe('extendSession', () => {
    it('should extend session without expiration', () => {
      const session: SessionInfo = {
        id: 'test123',
        createdAt: new Date(),
      };

      const extended = service.extendSession(session, 1800); // 30 minutes

      expect(extended.expiresAt).toBeDefined();
      expect(extended.expiresAt).toBeInstanceOf(Date);

      if (extended.expiresAt) {
        const now = new Date();
        const timeDiff = extended.expiresAt.getTime() - now.getTime();
        expect(timeDiff).toBeGreaterThan(1799000); // Within 1 second of 30 minutes
        expect(timeDiff).toBeLessThan(1801000);
      }
    });

    it('should extend existing expiration', () => {
      const originalExpiry = new Date(Date.now() + 1800000); // 30 minutes from now
      const session: SessionInfo = {
        id: 'test123',
        createdAt: new Date(),
        expiresAt: originalExpiry,
      };

      const extended = service.extendSession(session, 1800); // Add 30 minutes

      expect(extended.expiresAt).toBeDefined();
      if (extended.expiresAt) {
        const expectedExpiry = new Date(originalExpiry.getTime() + 1800000);
        const timeDiff = Math.abs(
          extended.expiresAt.getTime() - expectedExpiry.getTime(),
        );
        expect(timeDiff).toBeLessThan(1000); // Within 1 second
      }
    });
  });

  describe('getShortSessionId', () => {
    it('should return short version of session ID', () => {
      const sessionId = 'a'.repeat(40);
      const short = service.getShortSessionId(sessionId);

      expect(short).toBe('aaaaaaaa...');
    });

    it('should return full ID if shorter than requested length', () => {
      const sessionId = 'abc123';
      const short = service.getShortSessionId(sessionId, 10);

      expect(short).toBe(sessionId);
    });

    it('should use default length', () => {
      const sessionId = 'a'.repeat(40);
      const short = service.getShortSessionId(sessionId);

      expect(short).toBe('aaaaaaaa...');
    });

    it('should handle empty string', () => {
      const short = service.getShortSessionId('');
      expect(short).toBe('');
    });
  });
});
