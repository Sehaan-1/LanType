import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GET as listHandler } from '@/app/api/files/route';
import { GET as getHandler } from '@/app/api/files/[id]/route';
import { db } from '@/db';
import { requireAuth } from '@/lib/auth';
import { UPLOAD_DIR } from '@/lib/files';
import fs from 'fs';
import path from 'path';

vi.mock('@/db', () => ({
  db: {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
  },
}));

vi.mock('@/lib/auth', () => ({
  requireAuth: vi.fn(),
}));

describe('Files Integration', () => {
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

  describe('GET /api/files', () => {
    it('should list all files', async () => {
      (requireAuth as any).mockResolvedValueOnce(true);

      const mockFiles = [
        { id: 1, originalName: 'file1.txt', storedName: 'file1.txt', mimeType: 'text/plain', size: 10, uploadedAt: new Date() },
        { id: 2, originalName: 'file2.jpg', storedName: 'file2.jpg', mimeType: 'image/jpeg', size: 20, uploadedAt: new Date() },
      ];
      (db.orderBy as any).mockResolvedValueOnce(mockFiles);

      const request = new Request('http://localhost/api/files');
      const response = await listHandler(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.files).toHaveLength(2);
      expect(data.files[0].originalName).toBe('file1.txt');
    });

    it('should return 401 if unauthorized', async () => {
      (requireAuth as any).mockResolvedValueOnce(false);

      const request = new Request('http://localhost/api/files');
      const response = await listHandler(request);
      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/files/[id]', () => {
    it('should return the file if it exists', async () => {
      (requireAuth as any).mockResolvedValueOnce(true);

      const fileName = 'test-file.txt';
      const filePath = path.join(UPLOAD_DIR, fileName);
      fs.writeFileSync(filePath, 'file content');
      console.log('File written to:', filePath);
      console.log('File exists:', fs.existsSync(filePath));

      const mockFile = {
        id: 123,
        originalName: 'test-file.txt',
        storedName: fileName,
        mimeType: 'text/plain',
        size: 12,
      };
      (db.limit as any).mockResolvedValueOnce([mockFile]);

      const request = new Request('http://localhost/api/files/123');
      const response = await getHandler(request, { params: Promise.resolve({ id: '123' }) });

      expect(response.status).toBe(200);
      const text = await response.text();
      expect(text).toBe('file content');
    });

    it('should return 404 if the file does not exist in DB', async () => {
      (requireAuth as any).mockResolvedValueOnce(true);

      (db.limit as any).mockResolvedValueOnce([]);

      const request = new Request('http://localhost/api/files/999');
      const response = await getHandler(request, { params: Promise.resolve({ id: '999' }) });

      expect(response.status).toBe(404);
    });

    it('should return 404 if the file does not exist on disk', async () => {
      (requireAuth as any).mockResolvedValueOnce(true);

      const mockFile = {
        id: 123,
        originalName: 'missing.txt',
        storedName: 'missing.txt',
        mimeType: 'text/plain',
        size: 12,
      };
      (db.limit as any).mockResolvedValueOnce([mockFile]);

      const request = new Request('http://localhost/api/files/123');
      const response = await getHandler(request, { params: Promise.resolve({ id: '123' }) });

      expect(response.status).toBe(404);
    });

    it('should return 400 for invalid id', async () => {
      (requireAuth as any).mockResolvedValueOnce(true);

      const request = new Request('http://localhost/api/files/abc');
      const response = await getHandler(request, { params: Promise.resolve({ id: 'abc' }) });

      expect(response.status).toBe(400);
    });
  });
});
