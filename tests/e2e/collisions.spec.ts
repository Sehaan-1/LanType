import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

test.describe('Collision Handling', () => {
  test('should handle duplicate filenames by appending (n)', async ({ page }) => {
    await page.goto('/');
    for (const digit of ['1', '2', '3', '4']) {
      await page.getByRole('button', { name: digit, exact: true }).click();
    }
    await expect(page.getByText('Upload')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('section')).toContainText(/No files yet|Loading shared files/i);

    const fileName = 'duplicate.txt';
    const fixtureDir = path.join(__dirname, 'fixtures');
    if (!fs.existsSync(fixtureDir)) fs.mkdirSync(fixtureDir, { recursive: true });

    const file1Path = path.join(fixtureDir, fileName);
    const file2Path = path.join(fixtureDir, `duplicate-2.txt`);

    fs.writeFileSync(file1Path, 'Content 1');
    fs.writeFileSync(file2Path, 'Content 2');

    // Upload first file
    await page.setInputFiles('input[name="files"]', file1Path);
    await expect(page.getByText(fileName)).toBeVisible();

    // Upload second file with same intended name
    // We simulate this by uploading a file that would have the same name if the server renamed it
    // However, the server uses the actual filename of the uploaded file.
    // To test collision, we need to upload two files that have the same name.
    // Since we can't have two files with the same name in the same local dir,
    // we'll upload the same file twice or use different paths but same filename.

    await page.setInputFiles('input[name="files"]', file1Path);

    // Verify both appear
    await expect(page.getByText(fileName)).toBeVisible();
    await expect(page.getByText(`${fileName.split('.')[0]} (1)${path.extname(fileName)}`)).toBeVisible();
  });
});
