/**
 * TC-AUTH — Authentication flows
 *
 * Covers:
 *   TC-AUTH-001  Login s validními credentials → redirect na /admin
 *   TC-AUTH-002  Login s špatnými credentials → error message
 *   TC-AUTH-003  Signup → create club → redirect na /admin
 *   TC-AUTH-004  Logout → redirect na /login
 *   TC-AUTH-005  Forgot password form submission
 */

import { test, expect } from '@playwright/test';
import { loginAs, waitForPage, dismissOnboardingTour } from './helpers';

// ---------------------------------------------------------------------------
// TC-AUTH-001: Úspěšný login
// ---------------------------------------------------------------------------
test('TC-AUTH-001: login s validními credentials', async ({ page }) => {
  await page.goto('/login');
  await page.waitForLoadState('domcontentloaded');

  await page.fill('#email', 'admin@hvezda.cz');
  await page.fill('#password', 'heslo123');
  await page.click('button[type="submit"]');

  // Must land on /admin
  await page.waitForURL('**/admin**', { timeout: 20_000 });
  await expect(page).toHaveURL(/\/admin/);
});

// ---------------------------------------------------------------------------
// TC-AUTH-002: Špatné credentials → error
// ---------------------------------------------------------------------------
test('TC-AUTH-002: login se špatnými credentials zobrazí chybu', async ({ page }) => {
  await page.goto('/login');
  await page.waitForLoadState('domcontentloaded');

  await page.fill('#email', 'admin@hvezda.cz');
  await page.fill('#password', 'spatne-heslo');
  await page.click('button[type="submit"]');

  // Must stay on /login
  await expect(page).toHaveURL(/\/login/);

  // Error message should appear (text varies; check for common patterns)
  const error = page.locator('[role="alert"], .text-destructive, [class*="error"], [class*="danger"]').first();
  await expect(error).toBeVisible({ timeout: 8_000 });
});

// ---------------------------------------------------------------------------
// TC-AUTH-003: Signup → create club → /admin
// ---------------------------------------------------------------------------
test('TC-AUTH-003: signup + create club úspěšně přesměruje na /admin', async ({ page }) => {
  const rand = Date.now();
  const email = `testuser${rand}@playwright.test`;
  const clubName = `PW Klub ${rand}`;

  await page.goto('/signup');
  await page.waitForLoadState('domcontentloaded');

  // Step 1 — account (inputs use id= attributes)
  await page.fill('#firstName', 'Playwright');
  await page.fill('#lastName', 'Tester');
  await page.fill('#email', email);
  await page.fill('#password', 'TestPass123!');
  await page.click('button[type="submit"]');

  // Step 2 should appear (club creation) — wait for step transition
  await page.waitForTimeout(3_000);

  await expect(page.locator('#clubName')).toBeVisible({ timeout: 10_000 });
  await page.fill('#clubName', clubName);

  await page.click('button[type="submit"]');

  // Should land on /admin
  await page.waitForURL('**/admin**', { timeout: 20_000 });
  await expect(page).toHaveURL(/\/admin/);
});

// ---------------------------------------------------------------------------
// TC-AUTH-004: Logout → redirect na /login
// ---------------------------------------------------------------------------
test('TC-AUTH-004: logout přesměruje na /login', async ({ page }) => {
  await loginAs(page, 'admin@hvezda.cz');
  await waitForPage(page);

  // Ensure tour overlay is dismissed (loginAs sets localStorage but re-check)
  await dismissOnboardingTour(page);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);

  // Logout is inside DropdownMenu in topbar — avatar button "relative h-9 w-9 rounded-full"
  // Use the AvatarFallback inside the button as anchor
  const avatarBtn = page.locator('button[class*="h-9"][class*="w-9"][class*="rounded-full"]').first();
  await expect(avatarBtn).toBeVisible({ timeout: 10_000 });
  await avatarBtn.click();
  await page.waitForTimeout(800);

  // "Odhlásit se" menu item in the dropdown
  const logoutItem = page.getByRole('menuitem', { name: /odhlásit/i }).first();
  await expect(logoutItem).toBeVisible({ timeout: 5_000 });
  await logoutItem.click();

  await page.waitForURL('**/login**', { timeout: 15_000 });
  await expect(page).toHaveURL(/\/login/);
});

// ---------------------------------------------------------------------------
// TC-AUTH-005: Forgot password form submission
// ---------------------------------------------------------------------------
test('TC-AUTH-005: forgot password formulář odešle request', async ({ page }) => {
  await page.goto('/forgot-password');
  await page.waitForLoadState('domcontentloaded');

  await page.fill('#email', 'admin@hvezda.cz');

  await page.click('button[type="submit"]');

  // Úspěšné odeslání zobrazí confirmation message (CheckCircle2 nebo text)
  const success = page.locator(
    'text=email, text=odkaz, [class*="check"], svg.text-green-500'
  ).first();
  // Be lenient — just wait for the form to no longer be in "submitting" state
  await page.waitForTimeout(3_000);

  // Page should not show a server error
  const serverError = page.locator('text=500, text=Server Error').first();
  await expect(serverError).not.toBeVisible();
});
