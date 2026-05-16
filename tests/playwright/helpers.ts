import { Page, expect } from '@playwright/test';

// ---------------------------------------------------------------------------
// Auth helpers
// ---------------------------------------------------------------------------

export async function loginAs(page: Page, email: string, password = 'heslo123') {
  // Pre-set tour-completed in localStorage so the onboarding tour overlay never
  // appears and blocks interactions. We need to do this on the target origin first.
  await page.goto('/login');
  await page.evaluate(() => localStorage.setItem('tour-completed', 'true'));
  await page.waitForLoadState('domcontentloaded');

  // Login page uses id="email" and id="password" (shadcn/ui Input, no `name` attr)
  await page.fill('#email', email);
  await page.fill('#password', password);
  await page.click('button[type="submit"]');

  // Wait for redirect to /admin (allow slugs like /admin/...)
  await page.waitForURL('**/admin**', { timeout: 20_000 });

  // Re-set the key after landing on /admin (next/navigation may clear state)
  await page.evaluate(() => localStorage.setItem('tour-completed', 'true'));
  await page.waitForTimeout(300);
}

/** Dismiss the onboarding tour popover if it is currently shown (fallback). */
export async function dismissOnboardingTour(page: Page) {
  await page.evaluate(() => localStorage.setItem('tour-completed', 'true'));
  await page.waitForTimeout(200);
  // Click the overlay if it's still there to close it
  const overlay = page.locator('div[class*="z-[9997]"], div[class*="z-[9998]"]').first();
  const hasOverlay = await overlay.isVisible().catch(() => false);
  if (hasOverlay) {
    await overlay.click({ force: true });
    await page.waitForTimeout(300);
  }
}

export async function loginAsAdmin(page: Page) {
  return loginAs(page, 'admin@hvezda.cz');
}

export async function loginAsCoach(page: Page) {
  return loginAs(page, 'coach@hvezda.cz');
}

export async function loginAsParent(page: Page) {
  return loginAs(page, 'parent@hvezda.cz');
}

// ---------------------------------------------------------------------------
// Navigation helpers
// ---------------------------------------------------------------------------

/** Wait for the page to settle after navigation (network + animations). */
export async function waitForPage(page: Page) {
  await page.waitForLoadState('networkidle');
}

/** Navigate to an admin sub-page and wait for load. */
export async function gotoAdmin(page: Page, path: string) {
  await page.goto(`/admin${path}`);
  await waitForPage(page);
}

// ---------------------------------------------------------------------------
// Assertion helpers
// ---------------------------------------------------------------------------

/** Assert that at least one element matching `selector` is visible. */
export async function assertVisible(page: Page, selector: string, label?: string) {
  const loc = page.locator(selector).first();
  await expect(loc, label ?? selector).toBeVisible();
}

/** Assert current URL contains `fragment`. */
export async function assertUrl(page: Page, fragment: string) {
  await expect(page).toHaveURL(new RegExp(fragment.replace(/\//g, '\\/')));
}
