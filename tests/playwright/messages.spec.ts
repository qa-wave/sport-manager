/**
 * TC-MESSAGES — Messaging
 *
 * Covers:
 *   TC-MSG-001  Inbox se načte
 *   TC-MSG-002  Klik na konverzaci otevře chat
 *   TC-MSG-003  Odeslání zprávy
 *   TC-MSG-004  Zpráva se zobrazí v chatu
 */

import { test, expect } from '@playwright/test';
import { loginAs, waitForPage } from './helpers';

test.beforeEach(async ({ page }) => {
  // Coach has access to messages and conversations
  await loginAs(page, 'coach@hvezda.cz');
  await page.goto('/admin/messages');
  await waitForPage(page);
  await page.waitForTimeout(2_000);
});

// ---------------------------------------------------------------------------
// TC-MSG-001: Inbox se načte
// ---------------------------------------------------------------------------
test('TC-MSG-001: inbox stránka se načte', async ({ page }) => {
  // Messages page should show conversation list or empty state
  const convItem = page
    .locator('[class*="conv"], [class*="chat-item"], [class*="message"]')
    .first();
  const emptyState = page
    .locator('text=žádné zprávy, text=Žádné, text=No messages, text=Zatím')
    .first();
  const pageHeader = page
    .locator('h1, h2')
    .filter({ hasText: /zprávy|messages|inbox/i })
    .first();

  const hasList = await convItem.isVisible().catch(() => false);
  const hasEmpty = await emptyState.isVisible().catch(() => false);
  const hasHeader = await pageHeader.isVisible().catch(() => false);

  expect(hasList || hasEmpty || hasHeader).toBeTruthy();
});

// ---------------------------------------------------------------------------
// TC-MSG-002: Klik na konverzaci otevře chat
// ---------------------------------------------------------------------------
test('TC-MSG-002: klik na konverzaci zobrazí chat', async ({ page }) => {
  // Find first conversation item
  const convItem = page
    .locator('[class*="cursor-pointer"], button[class*="conv"], [class*="chat-item"]')
    .first();

  const hasConv = await convItem.isVisible().catch(() => false);
  if (!hasConv) {
    test.skip(); // No conversations in DB
    return;
  }

  await convItem.click();
  await page.waitForTimeout(1_500);

  // Chat area should appear with message input
  const chatInput = page
    .locator('input[placeholder*="zpráv"], input[placeholder*="message"], textarea[placeholder*="zpráv"]')
    .first();
  const chatMessages = page.locator('[class*="message-list"], [class*="chat-messages"]').first();

  const hasInput = await chatInput.isVisible().catch(() => false);
  const hasMessages = await chatMessages.isVisible().catch(() => false);

  expect(hasInput || hasMessages).toBeTruthy();
});

// ---------------------------------------------------------------------------
// TC-MSG-003: Odeslání zprávy
// ---------------------------------------------------------------------------
test('TC-MSG-003: odeslání zprávy funguje', async ({ page }) => {
  // Click on first conversation
  const convItem = page
    .locator('[class*="cursor-pointer"], button[class*="conv"], [class*="chat-item"]')
    .first();

  const hasConv = await convItem.isVisible().catch(() => false);
  if (!hasConv) {
    test.skip();
    return;
  }

  await convItem.click();
  await page.waitForTimeout(1_500);

  // Find message input
  const chatInput = page
    .locator('input[placeholder*="zpráv"], input[placeholder*="message"], textarea[placeholder*="zpráv"]')
    .first();

  const hasInput = await chatInput.isVisible().catch(() => false);
  if (!hasInput) {
    test.skip();
    return;
  }

  const testMsg = `PW test ${Date.now()}`;
  await chatInput.fill(testMsg);

  // Send via Enter
  await chatInput.press('Enter');
  await page.waitForTimeout(2_000);

  // Message should appear in chat
  const sentMessage = page.locator(`text=${testMsg}`).first();
  await expect(sentMessage).toBeVisible({ timeout: 8_000 });
});

// ---------------------------------------------------------------------------
// TC-MSG-004: Zpráva se zobrazí v chatu
// ---------------------------------------------------------------------------
test('TC-MSG-004: existující zprávy jsou viditelné v chatu', async ({ page }) => {
  const convItem = page
    .locator('[class*="cursor-pointer"], button[class*="conv"], [class*="chat-item"]')
    .first();

  const hasConv = await convItem.isVisible().catch(() => false);
  if (!hasConv) {
    test.skip();
    return;
  }

  await convItem.click();
  await page.waitForTimeout(2_000);

  // Chat area with at least one message bubble
  const messageBubble = page
    .locator('[class*="bubble"], [class*="message-item"], [class*="chat-message"]')
    .first();

  // Or just look for any text content in the chat area
  const chatArea = page
    .locator('[class*="chat"], [class*="messages"]')
    .filter({ hasText: /.{5,}/ })  // at least 5 chars of text
    .first();

  const hasBubble = await messageBubble.isVisible().catch(() => false);
  const hasChat = await chatArea.isVisible().catch(() => false);

  expect(hasBubble || hasChat).toBeTruthy();
});
