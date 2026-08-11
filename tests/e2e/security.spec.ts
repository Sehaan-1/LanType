import { test, expect } from '@playwright/test';

test.describe('Security Boundary', () => {
  test('should present PinGate when unauthenticated', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('Enter the 4-digit PIN')).toBeVisible();
    await expect(page.getByText('No files yet')).not.toBeVisible();
  });

  test('should deny access with wrong PIN', async ({ page }) => {
    await page.goto('/');
    for (const digit of ['9', '9', '9', '9']) {
      await page.getByRole('button', { name: digit, exact: true }).click();
    }
    // The PinGate shows "Incorrect PIN" or similar error
    await expect(page.getByText(/Incorrect PIN|Network error/i)).toBeVisible({ timeout: 5000 });
    await expect(page.locator('body')).not.toContainText(/No files yet/i);
  });

  test('should block direct access to protected API', async ({ page }) => {
    const response = await page.request.get('/api/files');
    // Should be 401 or redirect. In this app, requireAuth() is used in API routes.
    // Let's check if it returns a non-success code.
    expect(response.status()).not.toBe(200);
  });
});
