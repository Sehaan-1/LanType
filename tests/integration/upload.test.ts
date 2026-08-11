import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { POST as uploadHandler } from '@/app/api/upload/route';
import { db } from '@/db';
import { cookies } from 'next/headers';
import { UPLOAD_DIR } from '@/lib/files';
import fs from 'fs';
import path from 'path';

vi.mock('@/db', () => ({
  db: {
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    returning: vi.fn().mockResolvedValueOnce([{
      id: 1,
      originalName: 'test.txt',
      storedName: 'test.txt',
      mimeType: 'text/plain',
      size: 12,
      uploaderIp: '127.0.0.1',
    }]),
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
  },
}));

vi.mock('next/headers', () => ({
  cookies: vi.fn(),
}));

describe('Upload Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    if (!fs.existsSync(UPLOAD_DIR)) {
      fs.mkdirSync(UPLOAD_DIR, { recursive: true });
    }
  });

  afterEach(() => {
    if (fs.existsSync(UPLOAD_DIR)) {
      const files = fs.readdirSync(UPLOAD_DIR);
      for (const file of files) {
        fs.unlinkSync(path.join(UPLOAD_DIR, file));
      }
    }
  });

  async function mockAuth(isValid: boolean) {
    if (isValid) {
      const mockCookie = {
        get: vi.fn().mockReturnValue({ value: 'valid-token' }),
      };
      (cookies as any).mockResolvedValueOnce(mockCookie);
      (db.limit as any).mockResolvedValueOnce([{ token: 'valid-token' }]);
    } else {
      const mockCookie = {
        get: vi.fn().mockReturnValue(undefined),
      };
      (cookies as any).mockResolvedValueOnce(mockCookie);
    }
  }

  it('should successfully upload a file', async () => {
    await mockAuth(true);

    const file = new File(['hello world'], 'test.txt', { type: 'text/plain' });
    const formData = new FormData();
    formData.append('files', file);

    const request = new Request('http://localhost/api/upload', {
      method: 'POST',
      body: formData,
    });

    const response = await uploadHandler(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.ok).toBe(true);
    expect(data.count).toBe(1);
    expect(data.files[0].originalName).toBe('test.txt');

    const storedName = data.files[0].storedName;
    expect(fs.existsSync(path.join(UPLOAD_DIR, storedName))).toBe(true);
    expect(db.insert).toHaveBeenCalled();
  });

  it('should return 400 if no files are provided', async () => {
    await mockAuth(true);

    const formData = new FormData();

    const request = new Request('http://localhost/api/upload', {
      method: 'POST',
      body: formData,
    });

    const response = await uploadHandler(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('No files provided');
  });

  it('should return 401 if unauthorized', async () => {
    await mockAuth(false);

    const formData = new FormData();
    formData.append('files', new File(['test'], 'test.txt'));

    const request = new Request('http://localhost/api/upload', {
      method: 'POST',
      body: formData,
    });

    const response = await uploadHandler(request);
    expect(response.status).toBe(401);
  });
});
