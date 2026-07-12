// E2E: log in, shorten a link, and see it appear on the dashboard.
import { test, expect } from '@playwright/test';

test('a logged-in user can shorten a link and see it in the dashboard', async ({ page }) => {
  const email = `e2e_shorten_${Date.now()}@example.com`;
  const alias = `e2e${Date.now().toString().slice(-6)}`;

  // Register (which logs us in).
  await page.goto('/register');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill('password123');
  await page.getByRole('button', { name: 'Sign up' }).click();
  await expect(page).toHaveURL(/\/dashboard/);

  // Go home and shorten a link with a custom alias.
  await page.goto('/');
  await page.getByLabel('URL to shorten').fill('https://example.com/e2e-target');
  await page.getByLabel('Custom alias').fill(alias);
  await page.getByRole('button', { name: 'Shorten' }).click();

  // The result box should show the new short URL containing our alias.
  await expect(page.getByText(new RegExp(alias))).toBeVisible();

  // The dashboard should list it.
  await page.goto('/dashboard');
  await expect(page.getByText(`/${alias}`)).toBeVisible();
});
