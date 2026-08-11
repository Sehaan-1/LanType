import { describe, it, expect, vi, beforeEach } from 'vitest';
import { verifyPin, createSession, requireAuth } from '@/lib/auth';
import { db } from '@/db';
import { cookies } from 'next/headers';

vi.mock('@/db', () => ({
  db: {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
  },
}));

vi.mock('next/headers', () => ({
  cookies: vi.fn(),
}));

describe('Auth Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('verifyPin', () => {
    it('should return true for the correct PIN', async () => {
      // Mock ensurePin to return a specific PIN
      // Since verifyPin calls ensurePin which uses db.select().from(serverConfig).where().limit()
      (db.limit as any).mockResolvedValueOnce([{ pin: '1234' }]);

      const result = await verifyPin('1234');
      expect(result).toBe(true);
    });

    it('should return false for an incorrect PIN', async () => {
      (db.limit as any).mockResolvedValueOnce([{ pin: '1234' }]);

      const result = await verifyPin('5678');
      expect(result).toBe(false);
    });
  });

  describe('createSession', () => {
    it('should insert a session into the database', async () => {
      (db.values as any).mockResolvedValueOnce({});

      const token = await createSession();

      expect(token).toBeDefined();
      expect(db.insert).toHaveBeenCalled();
      expect(db.values).toHaveBeenCalledWith(expect.objectContaining({
        token: token,
        expiresAt: expect.any(Date),
      }));
    });
  });

  describe('requireAuth', () => {
    it('should return true for a valid session', async () => {
      const mockCookie = {
        get: vi.fn().mockReturnValue({ value: 'valid-token' }),
      };
      (cookies as any).mockResolvedValueOnce(mockCookie);

      // Mock isValidSession check: db.select().from(sessions).where().limit()
      (db.limit as any).mockResolvedValueOnce([{ token: 'valid-token' }]);

      const result = await requireAuth();
      expect(result).toBe(true);
    });

    it('should return false for a missing session', async () => {
      const mockCookie = {
        get: vi.fn().mockReturnValue(undefined),
      };
      (cookies as any).mockResolvedValueOnce(mockCookie);

      const result = await requireAuth();
      expect(result).toBe(false);
    });

    it('should return false for an expired session', async () => {
      const mockCookie = {
        get: vi.fn().mockReturnValue({ value: 'expired-token' }),
      };
      (cookies as any).mockResolvedValueOnce(mockCookie);

      // Mock empty result for expired session
      (db.limit as any).mockResolvedValueOnce([]);

      const result = await requireAuth();
      expect(result).toBe(false);
    });
  });
});
