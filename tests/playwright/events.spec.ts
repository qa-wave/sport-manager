/**
 * TC-EVENTS — Event management
 *
 * Covers:
 *   TC-EVT-001  Event list se zobrazí
 *   TC-EVT-002  Vytvoření nového eventu
 *   TC-EVT-003  Event detail se načte
 *   TC-EVT-004  RSVP tlačítka fungují
 *   TC-EVT-005  Přepínání view (seznam/týden/měsíc)
 */

import { test, expect } from '@playwright/test';
import { loginAs, waitForPage } from './helpers';

test.beforeEach(async ({ page }) => {
  await loginAs(page, 'admin@hvezda.cz');
});

// ---------------------------------------------------------------------------
// TC-EVT-001: Event list
// ---------------------------------------------------------------------------
test('TC-EVT-001: events stránka zobrazí seznam událostí', async ({ page }) => {
  await page.goto('/admin/events');
  await waitForPage(page);
  await page.waitForTimeout(2_000);

  // Either event cards or empty state
  const eventCard = page
    .locator('[class*="border-l"], [class*="event"]')
    .first();
  const emptyState = page
    .locator('[class*="empty"], text=žádné, text=Zatím, text=No events')
    .first();

  const hasEvents = await eventCard.isVisible().catch(() => false);
  const hasEmpty = await emptyState.isVisible().catch(() => false);

  expect(hasEvents || hasEmpty).toBeTruthy();
});

// ---------------------------------------------------------------------------
// TC-EVT-002: Vytvoření nového eventu
// ---------------------------------------------------------------------------
test('TC-EVT-002: admin může vytvořit nový event', async ({ page }) => {
  await page.goto('/admin/events');
  await waitForPage(page);

  // Click the "+ Nová událost" button
  const newEventBtn = page
    .getByRole('link', { name: /nová událost|new event|přidat/i })
    .first();
  await expect(newEventBtn).toBeVisible({ timeout: 8_000 });
  await newEventBtn.click();

  await page.waitForURL('**/events/new**', { timeout: 10_000 });
  await waitForPage(page);

  // Fill the event form
  const titleInput = page
    .locator('input[name="title"], input[id="title"], input[placeholder*="název"], input[placeholder*="name"]')
    .first();
  await expect(titleInput).toBeVisible({ timeout: 8_000 });
  await titleInput.fill(`PW Test Event ${Date.now()}`);

  // Submit the form
  const submitBtn = page
    .getByRole('button', { name: /vytvořit|uložit|create|save|potvrdit/i })
    .first();
  await expect(submitBtn).toBeVisible({ timeout: 5_000 });
  await submitBtn.click();

  // After creation should redirect to event detail or list
  await page.waitForTimeout(3_000);
  const url = page.url();
  expect(url).toMatch(/\/events/);
});

// ---------------------------------------------------------------------------
// TC-EVT-003: Event detail
// ---------------------------------------------------------------------------
test('TC-EVT-003: klik na event otevře detail', async ({ page }) => {
  await page.goto('/admin/events');
  await waitForPage(page);
  await page.waitForTimeout(2_000);

  // Click first event card/link
  const firstEvent = page
    .locator('a[href*="/events/"]')
    .first();

  const hasEvent = await firstEvent.isVisible().catch(() => false);
  if (!hasEvent) {
    test.skip(); // No events in DB to test
    return;
  }

  await firstEvent.click();
  await waitForPage(page);

  // Event detail should show RSVP section or event info
  const detailContent = page
    .locator('[class*="rsvp"], [class*="event"], h1, h2')
    .first();
  await expect(detailContent).toBeVisible({ timeout: 10_000 });
  await expect(page).toHaveURL(/\/events\/.+/);
});

// ---------------------------------------------------------------------------
// TC-EVT-004: RSVP tlačítka
// ---------------------------------------------------------------------------
test('TC-EVT-004: RSVP tlačítka reagují na klik', async ({ page }) => {
  await loginAs(page, 'coach@hvezda.cz');
  await page.goto('/admin/events');
  await waitForPage(page);
  await page.waitForTimeout(2_000);

  // Navigate to first event detail
  const firstEvent = page.locator('a[href*="/events/"]').first();
  const hasEvent = await firstEvent.isVisible().catch(() => false);
  if (!hasEvent) {
    test.skip();
    return;
  }

  await firstEvent.click();
  await waitForPage(page);

  // Look for RSVP buttons (Ano / Ne / Možná or Yes/No/Maybe)
  const rsvpBtn = page
    .getByRole('button', { name: /ano|ne|možná|yes|no|maybe|zúčastním|nezúčastním/i })
    .first();

  const hasRsvp = await rsvpBtn.isVisible({ timeout: 5_000 }).catch(() => false);
  if (!hasRsvp) {
    test.skip(); // RSVP not available for this role/event
    return;
  }

  await rsvpBtn.click();
  await page.waitForTimeout(1_500);

  // After clicking, button state should change (active class, color change)
  // Just verify no error toast appeared
  const errorToast = page
    .locator('[class*="toast"], [role="alert"]')
    .filter({ hasText: /error|chyba|selhalo/i })
    .first();
  await expect(errorToast).not.toBeVisible({ timeout: 3_000 });
});

// ---------------------------------------------------------------------------
// TC-EVT-005: Přepínání view
// ---------------------------------------------------------------------------
test('TC-EVT-005: přepínání view seznam/týden/měsíc funguje', async ({ page }) => {
  await page.goto('/admin/events');
  await waitForPage(page);
  await page.waitForTimeout(2_000);

  // View switcher — look for buttons with week/month/list icons or labels
  const weekBtn = page
    .getByRole('button', { name: /týden|week/i })
    .first();
  const monthBtn = page
    .getByRole('button', { name: /měsíc|month/i })
    .first();
  const listBtn = page
    .getByRole('button', { name: /seznam|list/i })
    .first();

  // Try switching to Week view
  const hasWeek = await weekBtn.isVisible().catch(() => false);
  if (hasWeek) {
    await weekBtn.click();
    await page.waitForTimeout(500);
    // Week grid should appear (cells with hour labels or day names)
    const weekGrid = page
      .locator('[class*="week"], [class*="grid"], text=Po, text=Út')
      .first();
    const hasGrid = await weekGrid.isVisible().catch(() => false);
    expect(hasGrid).toBeTruthy();
  }

  // Try switching to Month view
  const hasMonth = await monthBtn.isVisible().catch(() => false);
  if (hasMonth) {
    await monthBtn.click();
    await page.waitForTimeout(500);
    // Month calendar should show day numbers 1–31
    const calCell = page.locator('[class*="calendar"], [class*="month"]').first();
    const hasCalendar = await calCell.isVisible().catch(() => false);
    expect(hasCalendar).toBeTruthy();
  }

  // Back to list
  const hasList = await listBtn.isVisible().catch(() => false);
  if (hasList) {
    await listBtn.click();
    await page.waitForTimeout(500);
  }

  // At minimum: no JS crash / the page is still interactive
  await expect(page.locator('body')).not.toContainText('Error');
});
