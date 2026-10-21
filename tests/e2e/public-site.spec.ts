import { expect, test } from '@playwright/test';

test('homepage renders the approved design sections', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle('Leo & Associates — Independent Music Label');
  await expect(page.locator('#heroTitle')).toContainText('SOUND');
  for (const id of ['release', 'experience', 'platforms', 'about', 'connect']) {
    await expect(page.locator(`#${id}`)).toBeAttached();
  }
  // Self-hosted fonts are applied (no Google Fonts request at runtime).
  const display = await page.locator('#heroTitle').evaluate(el => getComputedStyle(el).fontFamily);
  expect(display).toMatch(/Space Grotesk/i);
});

test('no request leaves the site origin on load', async ({ page, baseURL }) => {
  const foreign: string[] = [];
  page.on('request', r => {
    if (!r.url().startsWith(baseURL!) && !r.url().startsWith('data:')) foreign.push(r.url());
  });
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  expect(foreign).toEqual([]);
});

test('no purchase or streaming links are fabricated', async ({ page }) => {
  await page.goto('/');
  const external = await page.locator('a[href^="http"], a[href^="mailto:"]').count();
  expect(external).toBe(0);
  await expect(page.locator('.platform-tag')).toHaveText(['LINK PENDING', 'LINK PENDING']);
});

test('missing audio fails gracefully: the player offers no fake playback', async ({ page }) => {
  await page.goto('/');
  await page.locator('#openPlayer').click();
  const dialog = page.getByRole('dialog', { name: /the music/i });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('button', { name: /audio not yet available/i })).toBeDisabled();
  await expect(page.locator('audio')).toHaveCount(0);
  await expect(page.locator('#closePlayer')).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expect(page.locator('#openPlayer')).toBeFocused();
});

test('security headers are sent', async ({ request }) => {
  const res = await request.get('/');
  const h = res.headers();
  expect(h['content-security-policy']).toContain("frame-ancestors 'none'");
  expect(h['content-security-policy']).toContain("object-src 'none'");
  expect(h['x-content-type-options']).toBe('nosniff');
  expect(h['x-frame-options']).toBe('DENY');
  expect(h['referrer-policy']).toBe('strict-origin-when-cross-origin');
  expect(h['strict-transport-security']).toContain('max-age=');
  expect(h['x-powered-by']).toBeUndefined();
});

test('robots.txt keeps private areas out of search', async ({ request }) => {
  const body = await (await request.get('/robots.txt')).text();
  for (const path of ['/admin', '/sign-in', '/preview', '/api']) expect(body).toContain(`Disallow: ${path}`);
});

test('unknown routes return 404', async ({ request }) => {
  expect((await request.get('/definitely-not-a-page')).status()).toBe(404);
});
