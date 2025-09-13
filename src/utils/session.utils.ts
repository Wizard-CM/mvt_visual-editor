import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';

/**
 * Interface for session information
 */
export interface SessionInfo {
  id: string;
  createdAt: Date;
  expiresAt?: Date;
}

/**
 * Interface for session validation result
 */
export interface SessionValidationResult {
  isValid: boolean;
  reason?: string;
}

/**
 * Utility class for session management operations
 * Handles session ID generation, validation, and lifecycle management
 */
@Injectable()
export class SessionUtils {
  /**
   * Generates a unique session ID for proxy sessions
   * Uses cryptographically secure random bytes for uniqueness
   * @returns {string} A 40-character hexadecimal session ID
   * @example
   * const sessionId = sessionUtils.generateSessionId();
   * // Returns: "a1b2c3d4e5f6g7h8i9j0..."
   */
  generateSessionId(): string {
    return crypto.randomBytes(20).toString('hex');
  }

  /**
   * Generates a session ID with custom byte length
   * @param {number} bytes - Number of random bytes to use (default: 20)
   * @returns {string} Hexadecimal session ID
   * @example
   * const shortId = sessionUtils.generateSessionIdWithLength(16);
   * // Returns: "a1b2c3d4e5f6g7h8" (32 characters)
   */
  generateSessionIdWithLength(bytes: number = 20): string {
    if (bytes < 8) {
      throw new Error('Session ID must be at least 8 bytes long for security');
    }
    return crypto.randomBytes(bytes).toString('hex');
  }

  /**
   * Creates a complete session info object with timestamps
   * @param {number} ttlSeconds - Time to live in seconds (optional)
   * @returns {SessionInfo} Session information object
   * @example
   * const session = sessionUtils.createSession(3600); // 1 hour TTL
   * console.log(session.id); // Session ID
   * console.log(session.expiresAt); // Expiration timestamp
   */
  createSession(ttlSeconds?: number): SessionInfo {
    const now = new Date();
    const expiresAt = ttlSeconds
      ? new Date(now.getTime() + ttlSeconds * 1000)
      : undefined;

    return {
      id: this.generateSessionId(),
      createdAt: now,
      expiresAt,
    };
  }

  /**
   * Validates if a session ID is properly formatted
   * @param {string} sessionId - The session ID to validate
   * @returns {SessionValidationResult} Validation result with details
   * @example
   * const result = sessionUtils.validateSessionId('abc123');
   * if (result.isValid) {
   *   console.log('Valid session ID');
   * } else {
   *   console.log('Invalid:', result.reason);
   * }
   */
  validateSessionId(sessionId: string): SessionValidationResult {
    if (!sessionId || typeof sessionId !== 'string') {
      return {
        isValid: false,
        reason: 'Session ID must be a non-empty string',
      };
    }

    if (sessionId.length < 16) {
      return {
        isValid: false,
        reason: 'Session ID must be at least 16 characters long',
      };
    }

    if (!/^[a-f0-9]+$/i.test(sessionId)) {
      return {
        isValid: false,
        reason: 'Session ID must contain only hexadecimal characters',
      };
    }

    return { isValid: true };
  }

  /**
   * Checks if a session has expired
   * @param {SessionInfo} session - The session to check
   * @returns {boolean} True if session has expired
   * @example
   * const isExpired = sessionUtils.isSessionExpired(session);
   * if (isExpired) {
   *   console.log('Session expired, creating new one');
   * }
   */
  isSessionExpired(session: SessionInfo): boolean {
    if (!session.expiresAt) {
      return false; // No expiration set
    }
    return new Date() > session.expiresAt;
  }

  /**
   * Gets the remaining time for a session in seconds
   * @param {SessionInfo} session - The session to check
   * @returns {number} Remaining seconds, or -1 if no expiration
   * @example
   * const remaining = sessionUtils.getRemainingTime(session);
   * if (remaining > 0) {
   *   console.log(`Session expires in ${remaining} seconds`);
   * }
   */
  getRemainingTime(session: SessionInfo): number {
    if (!session.expiresAt) {
      return -1; // No expiration set
    }

    const now = new Date();
    const remaining = Math.ceil(
      (session.expiresAt.getTime() - now.getTime()) / 1000,
    );

    return Math.max(0, remaining);
  }

  /**
   * Extends a session's expiration time
   * @param {SessionInfo} session - The session to extend
   * @param {number} additionalSeconds - Additional seconds to add
   * @returns {SessionInfo} Updated session info
   * @example
   * const extended = sessionUtils.extendSession(session, 1800); // Add 30 minutes
   * console.log('New expiration:', extended.expiresAt);
   */
  extendSession(session: SessionInfo, additionalSeconds: number): SessionInfo {
    if (!session.expiresAt) {
      // If no expiration was set, create one from now
      session.expiresAt = new Date(Date.now() + additionalSeconds * 1000);
    } else {
      // Extend existing expiration
      session.expiresAt = new Date(
        session.expiresAt.getTime() + additionalSeconds * 1000,
      );
    }

    return { ...session };
  }

  /**
   * Generates a short session ID for display purposes
   * Useful for logging and debugging without exposing full session ID
   * @param {string} sessionId - Full session ID
   * @param {number} length - Number of characters to show (default: 8)
   * @returns {string} Shortened session ID with ellipsis
   * @example
   * const short = sessionUtils.getShortSessionId(session.id);
   * console.log(`Session ${short} started`); // "Session a1b2c3d4..."
   */
  getShortSessionId(sessionId: string, length: number = 8): string {
    if (!sessionId || sessionId.length <= length) {
      return sessionId;
    }
    return `${sessionId.substring(0, length)}...`;
  }
}
