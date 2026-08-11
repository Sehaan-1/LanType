import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import path from 'path';
import * as fs from 'fs/promises';
import { safeFilename, uniquePath, streamToDisk } from '@/lib/files';

vi.mock('fs/promises', async (importOriginal) => {
  const original = await importOriginal<typeof import('fs/promises')>();
  return {
    ...original,
    access: vi.fn().mockImplementation(original.access),
  };
});

describe('File System Logic', () => {
  const testDir = path.join(process.cwd(), 'tests/tmp_files');

  beforeEach(async () => {
    await fs.mkdir(testDir, { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(testDir, { recursive: true, force: true });
  });

  describe('safeFilename', () => {
    it('prevents path traversal', () => {
      expect(safeFilename('../../etc/passwd')).not.toContain('..');
      expect(safeFilename('..\\..\\windows\\system32')).not.toContain('..');
      expect(safeFilename('/etc/passwd')).not.toContain('/');
      expect(safeFilename('C:\\Windows\\System32')).not.toContain(':');
    });

    it('strips illegal characters', () => {
      expect(safeFilename('file\0name.txt')).not.toContain('\0');
      expect(safeFilename('file\x01name.txt')).not.toContain('\x01');
      expect(safeFilename('file<name>.txt')).not.toContain('<');
      expect(safeFilename('file>name.txt')).not.toContain('>');
      expect(safeFilename('file:name.txt')).not.toContain(':');
      expect(safeFilename('file"name.txt')).not.toContain('"');
      expect(safeFilename('file|name.txt')).not.toContain('|');
      expect(safeFilename('file?name.txt')).not.toContain('?');
      expect(safeFilename('file*name.txt')).not.toContain('*');
      expect(safeFilename('file\\name.txt')).not.toContain('\\');
      expect(safeFilename('file/name.txt')).not.toContain('/');
    });

    it('caps length while preserving extension', () => {
      const longName = 'a'.repeat(250) + '.txt';
      const result = safeFilename(longName);
      expect(result.length).toBeLessThanOrEqual(200);
      expect(result.endsWith('.txt')).toBe(true);
    });

    it('handles fallbacks for empty or invalid names', () => {
      expect(safeFilename('')).toMatch(/^file-\d+$/);
      expect(safeFilename('...')).toMatch(/^file-\d+$/);
      expect(safeFilename('..')).toMatch(/^file-\d+$/);
    });
  });

  describe('uniquePath', () => {
    it('returns the safe filename if no collision exists', async () => {
      const name = 'test.txt';
      const result = await uniquePath(testDir, name);
      expect(result.storedName).toBe(name);
      expect(result.fullPath).toBe(path.join(testDir, name));
    });

    it('handles basic collision', async () => {
      const name = 'test.txt';
      await fs.writeFile(path.join(testDir, name), 'content');
      const result = await uniquePath(testDir, name);
      expect(result.storedName).toBe('test (1).txt');
      expect(result.fullPath).toBe(path.join(testDir, 'test (1).txt'));
    });

    it('handles chain collisions', async () => {
      const name = 'test.txt';
      await fs.writeFile(path.join(testDir, 'test.txt'), 'content');
      await fs.writeFile(path.join(testDir, 'test (1).txt'), 'content');
      const result = await uniquePath(testDir, name);
      expect(result.storedName).toBe('test (2).txt');
    });

    it('falls back to timestamp after 10,000 collisions', async () => {
      (fs.access as any).mockImplementation(async (p) => {
        const normalizedP = path.normalize(p);
        const base = path.normalize(path.join(testDir, 'test.txt'));
        if (normalizedP === base) return Promise.resolve();

        const match = normalizedP.match(/test \((\d+)\)\.txt$/);
        if (match) {
          const num = parseInt(match[1], 10);
          if (num >= 1 && num < 10000) return Promise.resolve();
        }
        throw new Error('Not found');
      });

      const result = await uniquePath(testDir, 'test.txt');
      expect(result.storedName).toMatch(/^test-\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}\.txt$/);
      (fs.access as any).mockRestore();
    });
  });

  describe('streamToDisk', () => {
    it('preserves data integrity', async () => {
      const content = 'Hello, World!';
      const blob = new Blob([content], { type: 'text/plain' });
      const file = new File([blob], 'test.txt');
      const destPath = path.join(testDir, 'saved.txt');

      await streamToDisk(file, destPath);
      const savedContent = await fs.readFile(destPath, 'utf8');
      expect(savedContent).toBe(content);
    });

    it('handles large files without crashing', async () => {
      const size = 100 * 1024 * 1024;
      const chunk = Buffer.alloc(1024 * 1024, 'a');

      const webStream = new ReadableStream({
        start(controller) {
          let written = 0;
          while (written < size) {
            controller.enqueue(chunk);
            written += chunk.length;
          }
          controller.close();
        }
      });

      // Mock File object because native File constructor doesn't support ReadableStream as a part
      const mockFile = {
        stream: () => webStream,
        size: size,
      } as unknown as File;

      const destPath = path.join(testDir, 'large_saved.txt');
      await streamToDisk(mockFile, destPath);

      const stats = await fs.stat(destPath);
      expect(stats.size).toBe(size);
    });
  });
});
