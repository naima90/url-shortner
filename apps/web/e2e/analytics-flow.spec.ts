// E2E: the full cross-tier round-trip.
// Create a link, visit the short URL directly (recording a click through the
// API), then confirm the dashboard shows the increased click count.
import { test, expect, request as playwrightRequest } from '@playwright/test';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

test('clicking a short link increments its click count on the dashboard', async ({ page }) => {
  const email = `e2e_analytics_${Date.now()}@example.com`;
  const alias = `hit${Date.now().toString().slice(-6)}`;

  // Register + log in.
  await page.goto('/register');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill('password123');
  await page.getByRole('button', { name: 'Sign up' }).click();
  await expect(page).toHaveURL(/\/dashboard/);

  // Shorten a link.
  await page.goto('/');
  await page.getByLabel('URL to shorten').fill('https://example.com/analytics-target');
  await page.getByLabel('Custom alias').fill(alias);
  await page.getByRole('button', { name: 'Shorten' }).click();
  await expect(page.getByText(new RegExp(alias))).toBeVisible();

  // Visit the short link via the API in a separate context that does NOT follow
  // the redirect (we just need the click recorded).
  const apiContext = await playwrightRequest.newContext();
  await apiContext.get(`${API_URL}/${alias}`, { maxRedirects: 0 });
  await apiContext.dispose();

  // Back on the dashboard, the link should now show 1 click.
  await page.goto('/dashboard');
  const row = page.locator('tr', { hasText: `/${alias}` });
  await expect(row).toContainText('1');
});
