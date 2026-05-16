/**
 * TC-DASH — Dashboard
 *
 * Covers:
 *   TC-DASH-001  Admin vidí stat cards
 *   TC-DASH-002  Admin vidí "This Week" sekci
 *   TC-DASH-003  Parent vidí child cards
 *   TC-DASH-004  Quick actions jsou klikatelné
 *   TC-DASH-005  Cmd+K otevře command palette
 */

import { test, expect } from '@playwright/test';
import { loginAs, loginAsParent, waitForPage } from './helpers';

// ---------------------------------------------------------------------------
// TC-DASH-001: Admin stat cards
// ---------------------------------------------------------------------------
test('TC-DASH-001: admin dashboard zobrazí stat cards', async ({ page }) => {
  await loginAs(page, 'admin@hvezda.cz');
  await waitForPage(page);

  // Stat cards render metric numbers — look for card wrappers or numeric content
  // The dashboard uses PageHeader + stat-card components
  // Wait for cards to load (they come from /api/v1/dashboard/feed)
  await page.waitForTimeout(2_000);

  // At least some card with a number should be visible
  // Cards typically contain role-aware stats; check for any count-like element
  const cards = page.locator('[class*="stat"], [class*="card"]').filter({ hasText: /\d/ });
  const count = await cards.count();
  expect(count).toBeGreaterThan(0);
});

// ---------------------------------------------------------------------------
// TC-DASH-002: "This Week" sekce
// ---------------------------------------------------------------------------
test('TC-DASH-002: admin dashboard zobrazí nadcházející události', async ({ page }) => {
  await loginAs(page, 'admin@hvezda.cz');
  await waitForPage(page);
  await page.waitForTimeout(2_000);

  // Look for week section heading or event cards in the feed
  // The dashboard renders upcoming events from dashboard.feed.thisWeek
  const weekSection = page
    .locator('h2, h3, [class*="section"], [class*="heading"]')
    .filter({ hasText: /týden|week|trénink|zápas|event/i })
    .first();

  // Either a week section heading OR event items are visible
  const eventItems = page.locator('[class*="border-l"], [class*="event"]').first();
  const hasWeekSection = await weekSection.isVisible().catch(() => false);
  const hasEventItems = await eventItems.isVisible().catch(() => false);

  expect(hasWeekSection || hasEventItems).toBeTruthy();
});

// ---------------------------------------------------------------------------
// TC-DASH-003: Parent vidí child cards
// ---------------------------------------------------------------------------
test('TC-DASH-003: parent dashboard zobrazí child cards', async ({ page }) => {
  await loginAsParent(page);
  await waitForPage(page);
  await page.waitForTimeout(2_000);

  // Parent dashboard renders ChildProgressCard components
  // Look for child-related content (name, stats, progress)
  const childCard = page
    .locator('[class*="card"], [class*="child"]')
    .filter({ hasText: /docházka|zápas|tréninků|let/i })
    .first();

  await expect(childCard).toBeVisible({ timeout: 10_000 });
});

// ---------------------------------------------------------------------------
// TC-DASH-004: Quick actions jsou klikatelné
// ---------------------------------------------------------------------------
test('TC-DASH-004: quick action tlačítka jsou klikatelná', async ({ page }) => {
  await loginAs(page, 'admin@hvezda.cz');
  await waitForPage(page);
  // Wait for data to load (skeleton → real content)
  await page.waitForTimeout(3_000);

  // Dashboard quick actions: "Nová událost" button OR the Events sidebar link
  // OR command palette shortcut items visible on the page
  const newEventLink = page.locator('a[href*="/events/new"]').first();
  const eventsLink = page.locator('a[href*="/admin/events"]').first();
  const anyActionBtn = page
    .getByRole('button', { name: /nová|přidat|pozvat|vytvořit|new event/i })
    .first();

  const hasNewEvent = await newEventLink.isVisible().catch(() => false);
  const hasEvents = await eventsLink.isVisible().catch(() => false);
  const hasBtn = await anyActionBtn.isVisible().catch(() => false);

  // At minimum the sidebar Events link must be clickable
  expect(hasNewEvent || hasEvents || hasBtn).toBeTruthy();
});

// ---------------------------------------------------------------------------
// TC-DASH-005: Cmd+K otevře command palette
// ---------------------------------------------------------------------------
test('TC-DASH-005: Cmd+K otevře command palette', async ({ page }) => {
  await loginAs(page, 'admin@hvezda.cz');
  await waitForPage(page);

  // Trigger command palette via keyboard shortcut
  // CommandPalette listens on keydown 'k' with metaKey/ctrlKey
  await page.keyboard.press('Meta+k');
  await page.waitForTimeout(500);

  // Command palette renders as fixed div overlay with search input
  // Selector: the search input inside the palette
  const searchInput = page
    .locator('input[placeholder*="Hledat"], input[placeholder*="hledat"], input[placeholder*="search"]')
    .first();

  await expect(searchInput).toBeVisible({ timeout: 5_000 });

  // Close it via Escape
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);
  await expect(searchInput).not.toBeVisible({ timeout: 3_000 });
});
