import { expect, test } from '@playwright/test';

// With authentication unconfigured, every admin surface must fail closed.
for (const path of ['/admin', '/admin/settings', '/admin/releases', '/api/admin/anything']) {
  test(`unauthenticated visitors cannot reach ${path}`, async ({ request }) => {
    const res = await request.get(path, { maxRedirects: 0 });
    expect(res.status()).toBe(503);
    expect(res.headers()['cache-control']).toContain('no-store');
    const body = await res.text();
    expect(body).not.toMatch(/Overview|Administrators|Music Library/);
  });
}

test('admin mutations are rejected without authentication', async ({ request }) => {
  const res = await request.post('/admin/settings', { data: {}, maxRedirects: 0 });
  expect(res.status()).toBe(503);
});

test('sign-in page explains that admin is closed and is not indexable', async ({ page }) => {
  const res = await page.goto('/sign-in');
  expect(res?.headers()['x-robots-tag']).toContain('noindex');
  await expect(page.getByRole('heading', { name: /admin is not configured/i })).toBeVisible();
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
});
