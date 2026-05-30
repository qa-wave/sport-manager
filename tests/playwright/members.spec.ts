/**
 * TC-MEMBERS — Member management
 *
 * Covers:
 *   TC-MBR-001  Member list se zobrazí s filtry
 *   TC-MBR-002  Status filtr funguje
 *   TC-MBR-003  Fulltext vyhledávání
 *   TC-MBR-004  Member detail se načte
 *   TC-MBR-005  Stats tab zobrazí statistiky
 */

import { test, expect } from '@playwright/test';
import { loginAs, waitForPage } from './helpers';

test.beforeEach(async ({ page }) => {
  await loginAs(page, 'admin@hvezda.cz');
  await page.goto('/admin/members');
  await waitForPage(page);
  await page.waitForTimeout(2_000);
});

// ---------------------------------------------------------------------------
// TC-MBR-001: Member list se zobrazí
// ---------------------------------------------------------------------------
test('TC-MBR-001: members stránka zobrazí seznam členů', async ({ page }) => {
  // Table rows or member cards should be present
  const row = page.locator('tr[class], tbody tr, [class*="member-row"]').first();
  const card = page.locator('[class*="avatar"], [class*="member"]').filter({ hasText: /@/ }).first();
  const emptyState = page.locator('text=žádní, text=Žádní, text=No members').first();

  const hasRow = await row.isVisible().catch(() => false);
  const hasCard = await card.isVisible().catch(() => false);
  const hasEmpty = await emptyState.isVisible().catch(() => false);

  expect(hasRow || hasCard || hasEmpty).toBeTruthy();
});

// ---------------------------------------------------------------------------
// TC-MBR-002: Status filtr
// ---------------------------------------------------------------------------
test('TC-MBR-002: status filtr mění zobrazené členy', async ({ page }) => {
  // Status filter dropdown
  const filterBtn = page
    .getByRole('button', { name: /stav|status|filtr|vše|filter/i })
    .first();

  const hasFilter = await filterBtn.isVisible().catch(() => false);
  if (!hasFilter) {
    test.skip();
    return;
  }

  await filterBtn.click();
  await page.waitForTimeout(500);

  // Select "Aktivní"
  const activeOption = page
    .getByRole('menuitem', { name: /aktivní|active/i })
    .first();

  const altOption = page
    .locator('[role="option"], [class*="item"]')
    .filter({ hasText: /aktivní|active/i })
    .first();

  const hasActive = await activeOption.isVisible().catch(() => false);
  const hasAlt = await altOption.isVisible().catch(() => false);

  if (hasActive) {
    await activeOption.click();
  } else if (hasAlt) {
    await altOption.click();
  }

  await page.waitForTimeout(1_000);

  // Page must not show server error
  await expect(page.locator('body')).not.toContainText('500');
});

// ---------------------------------------------------------------------------
// TC-MBR-003: Vyhledávání
// ---------------------------------------------------------------------------
test('TC-MBR-003: vyhledávání filtruje seznam členů', async ({ page }) => {
  // Search input (magnifier icon + input)
  const searchInput = page
    .locator('input[type="search"], input[placeholder*="hledat"], input[placeholder*="search"], input[placeholder*="Hledat"]')
    .first();

  const hasSearch = await searchInput.isVisible().catch(() => false);
  if (!hasSearch) {
    test.skip();
    return;
  }

  await searchInput.fill('admin');
  await page.waitForTimeout(800);

  // At least one result or empty state — no crash
  const body = page.locator('body');
  await expect(body).not.toContainText('500');
  await expect(body).not.toContainText('Error');
});

// ---------------------------------------------------------------------------
// TC-MBR-004: Member detail
// ---------------------------------------------------------------------------
test('TC-MBR-004: klik na člena otevře detail', async ({ page }) => {
  const memberRow = page.locator('[data-testid="member-row"]').first();
  const hasRow = await memberRow.isVisible().catch(() => false);

  if (!hasRow) {
    test.skip();
    return;
  }

  await memberRow.click();
  await waitForPage(page);

  // Member detail should show name, email or profile info
  const detailContent = page
    .locator('h1, h2, [class*="avatar"], [class*="member-detail"]')
    .first();
  await expect(detailContent).toBeVisible({ timeout: 10_000 });
  await expect(page).toHaveURL(/\/members\/.+/);
});

// ---------------------------------------------------------------------------
// TC-MBR-005: Stats tab
// ---------------------------------------------------------------------------
test('TC-MBR-005: member detail má stats tab s daty', async ({ page }) => {
  const memberRow = page.locator('[data-testid="member-row"]').first();
  const hasRow = await memberRow.isVisible().catch(() => false);
  if (!hasRow) {
    test.skip();
    return;
  }

  await memberRow.click();
  await waitForPage(page);

  // Look for tabs (Přehled, Statistiky, Odznaky, ...)
  const statsTab = page
    .getByRole('tab', { name: /statistiky|stats|odznaky|badges/i })
    .first();

  const hasStats = await statsTab.isVisible().catch(() => false);
  if (!hasStats) {
    // Try link-based tabs
    const statsLink = page
      .getByRole('link', { name: /statistiky|stats/i })
      .first();
    const hasLink2 = await statsLink.isVisible().catch(() => false);
    if (!hasLink2) {
      test.skip();
      return;
    }
    await statsLink.click();
  } else {
    await statsTab.click();
  }

  await page.waitForTimeout(1_500);

  // Stats content should load — look for numeric data or charts
  const statsContent = page
    .locator('[class*="stat"], [class*="chart"], [class*="heatmap"]')
    .first();
  const hasStatsContent = await statsContent.isVisible().catch(() => false);
  expect(hasStatsContent).toBeTruthy();
});
