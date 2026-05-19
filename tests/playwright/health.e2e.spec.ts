import { test, expect } from '@playwright/test';

// Resilience-focused E2E. sport-manager's baseURL defaults to the live
// production URL, so this spec only runs when an explicit TEST_URL points
// at a dev/preview server — it must never drive load against prod.
const target = process.env.TEST_URL;

test.describe('health & resilience', () => {
  test.skip(
    !target,
    'set TEST_URL to a dev/preview server to run health E2E',
  );

  test('landing responds and renders a document', async ({ page }) => {
    const res = await page.goto('/');
    expect(res?.status()).toBeLessThan(500);
    await expect(page).toHaveTitle(/.+/);
    expect((await page.locator('body').innerText()).length).toBeGreaterThan(10);
  });

  test('unauthenticated access to an admin route is gated', async ({
    page,
  }) => {
    await page.goto('/admin');
    await expect(page).not.toHaveURL(/\/admin$/);
  });

  test('renders without uncaught page errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(String(e)));
    await page.goto('/');
    expect(errors, errors.join('\n')).toHaveLength(0);
  });
});
