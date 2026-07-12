// E2E: register, then log out, then log back in.
// Uses a unique email per run so repeated runs do not collide.
import { test, expect } from '@playwright/test';

function uniqueEmail() {
  return `e2e_${Date.now()}@example.com`;
}

test('a user can register, log out, and log in again', async ({ page }) => {
  const email = uniqueEmail();
  const password = 'password123';

  // Register.
  await page.goto('/register');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Sign up' }).click();

  // Should land on the dashboard.
  await expect(page).toHaveURL(/\/dashboard/);
  await expect(page.getByRole('heading', { name: 'Your links' })).toBeVisible();

  // Log out.
  await page.getByRole('button', { name: 'Log out' }).click();
  await expect(page).toHaveURL('/');

  // Log back in.
  await page.goto('/login');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Log in' }).click();
  await expect(page).toHaveURL(/\/dashboard/);
});
