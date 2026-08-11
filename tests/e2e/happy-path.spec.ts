import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

test.describe('Happy Path', () => {
  test('should allow user to upload and download a file', async ({ page }) => {
    // 1. Navigate to root
    await page.goto('/');

    // 2. Enter PIN
    for (const digit of ['1', '2', '3', '4']) {
      await page.getByRole('button', { name: digit, exact: true }).click();
    }

    // Wait for transition to main app (FileGallery should appear)
    // Use a more robust check: look for "Upload" section title or "No files yet"
    await expect(page.getByText('Upload')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('section')).toContainText(/No files yet|Loading shared files/i);

    // 3. Upload a file
    const testFileName = 'happy-path-test.txt';
    const testFilePath = path.join(__dirname, 'fixtures', testFileName);
    const testFileContent = 'Hello LAN Share!';

    // Ensure fixtures directory exists
    if (!fs.existsSync(path.join(__dirname, 'fixtures'))) {
      fs.mkdirSync(path.join(__dirname, 'fixtures'), { recursive: true });
    }
    fs.writeFileSync(testFilePath, testFileContent);

    // Use the hidden file input
    await page.setInputFiles('input[name="files"]', testFilePath);

    // 4. Verify file appears in gallery
    await expect(page.getByText(testFileName)).toBeVisible();

    // 5. Download the file
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('link', { name: /download/i, name: testFileName }).click();
    const download = await downloadPromise;

    // 6. Verify content
    const downloadedPath = await download.path();
    const content = fs.readFileSync(downloadedPath, 'utf8');
    expect(content).toBe(testFileContent);
  });
});
