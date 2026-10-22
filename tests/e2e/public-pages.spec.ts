import { expect, test } from '@playwright/test';

const PAGES: [path: string, emptyState: RegExp | null][] = [
  ['/', null],
  ['/music', /The catalogue opens with the first release/],
  ['/artists', /The roster is introduced with the first release/],
  ['/shop', /Nothing is for sale yet/],
  ['/about', /Leo & Associates is an independent music label/],
  ['/contact', /Address to follow/],
];

for (const [path, empty] of PAGES) {
  test(`${path} renders with navigation, one h1 and the footer credit`, async ({ page }) => {
    const res = await page.goto(path);
    expect(res?.status()).toBe(200);
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.getByRole('navigation', { name: 'Footer' })).toBeVisible();
    if (empty) await expect(page.locator('main')).toContainText(empty);

    const credit = page.locator('.footer-credit');
    await expect(credit).toContainText('Developed by Built by Leverage');
    const link = credit.getByRole('link', { name: /Built by Leverage/ });
    await expect(link).toHaveAttribute('href', 'https://builtbyleverage.com');
    await expect(link).toHaveAttribute('target', '_blank');
    await expect(link).toHaveAttribute('rel', /noopener/);
  });
}

test('header marks the current page', async ({ page, isMobile }) => {
  test.skip(!!isMobile, 'desktop navigation');
  await page.goto('/shop');
  await expect(page.locator('.desktop-nav a[aria-current="page"]')).toHaveText('SHOP');
});

test('client-side navigation between pages works', async ({ page, isMobile }) => {
  test.skip(!!isMobile, 'desktop navigation');
  await page.goto('/');
  await page.locator('.desktop-nav').getByRole('link', { name: 'ARTISTS' }).click();
  await expect(page).toHaveURL(/\/artists$/);
  await expect(page.locator('h1')).toContainText('ARTISTS');
});

test('mobile menu lists every page and closes after navigating', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'mobile navigation');
  await page.goto('/');
  await page.locator('#menuToggle').click();
  const menu = page.locator('#mobileMenu');
  for (const label of ['Home', 'Music', 'Artists', 'Shop', 'About', 'Contact']) await expect(menu.getByRole('link', { name: label, exact: true })).toBeVisible();
  await menu.getByRole('link', { name: 'About', exact: true }).click();
  await expect(page).toHaveURL(/\/about$/);
  await expect(page.locator('#menuToggle')).toHaveAttribute('aria-expanded', 'false');
});

test('development-only routes do not exist without fixtures', async ({ request }) => {
  expect((await request.get('/dev/turntable')).status()).toBe(404);
  expect((await request.get('/dev-fixtures/audio/signal-a.wav')).status()).toBe(404);
  expect((await request.get('/music/dev-fixture-ep')).status()).toBe(404);
});

test('a favicon is served', async ({ request }) => {
  const res = await request.get('/icon.svg');
  expect(res.status()).toBe(200);
  expect(res.headers()['content-type']).toContain('svg');
});

test('sitemap lists every public page', async ({ request }) => {
  const xml = await (await request.get('/sitemap.xml')).text();
  for (const p of ['/music', '/artists', '/shop', '/about', '/contact']) expect(xml).toContain(`${p}</loc>`);
  expect(xml).not.toContain('dev-fixture');
});
