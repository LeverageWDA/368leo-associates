import { expect, test, type Page } from '@playwright/test';

/*
 * Runs against `next dev` with ENABLE_DEV_FIXTURES=1: labelled sample releases
 * and a synthesised test signal (not music) served from /dev-fixtures/audio.
 */

/** Navigate and wait for the dev server to finish compiling and React to hydrate. */
async function open(page: Page, path: string) {
  await page.goto(path);
  await page.waitForLoadState('networkidle');
  await expect(page.locator('main .tt-platter, main .track-play').first()).toBeVisible();
}

/** Centre the record on screen and return its geometry for drag gestures. */
async function grabPoint(page: Page) {
  // Instant: the site uses smooth scrolling, which would move the record mid-measure.
  await platter(page).evaluate(el => el.scrollIntoView({ block: 'center', behavior: 'instant' }));
  const box = (await platter(page).boundingBox())!;
  const cx = box.x + box.width / 2;
  const cy = box.y + box.height / 2;
  const r = box.width * 0.38;
  return (deg: number): [number, number] => [cx + r * Math.cos((deg * Math.PI) / 180), cy + r * Math.sin((deg * Math.PI) / 180)];
}

const deck = (page: Page) => page.locator('main .tt').first();
const platter = (page: Page) => page.locator('main .tt-platter').first();
const mainPlay = (page: Page, name: 'Play' | 'Pause') => page.locator('main').getByRole('button', { name, exact: true });

/** Rotation of the main record, in degrees. */
const angle = (page: Page) =>
  page.locator('main .tt-disc').first().evaluate(el => {
    const m = getComputedStyle(el).transform;
    if (m === 'none') return 0;
    const [a, b] = m.slice(7).split(',').map(Number);
    return (Math.atan2(b!, a!) * 180) / Math.PI;
  });

/** Current playback position read from the main transport, in seconds. */
const position = (page: Page) =>
  page.locator('main .transport-time').first().evaluate(el => {
    const [m, s] = (el.textContent ?? '0:00').split(':').map(Number);
    return m! * 60 + s!;
  });

test('fixture pages are labelled and never indexed', async ({ page }) => {
  await open(page, '/music/dev-fixture-ep');
  await expect(page.locator('.dev-banner')).toContainText('DEVELOPMENT FIXTURES ENABLED');
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
  await expect(page.locator('script[type="application/ld+json"]')).toHaveCount(0);
});

test('test audio is served with byte ranges for seeking', async ({ request }) => {
  const res = await request.get('/dev-fixtures/audio/signal-a.wav', { headers: { Range: 'bytes=0-99' } });
  expect(res.status()).toBe(206);
  expect(res.headers()['content-range']).toMatch(/^bytes 0-99\/\d+$/);
  expect(res.headers()['content-type']).toBe('audio/wav');
  expect((await request.get('/dev-fixtures/audio/..%2Fsecret')).status()).toBe(404);
});

test('a track without authorised audio has no play button', async ({ page }) => {
  await open(page, '/music/dev-fixture-ep');
  const row = page.locator('main .track', { hasText: 'Track Without Audio' });
  await expect(row.getByRole('button')).toHaveCount(0);
  await expect(row).toContainText('Not available to play here');
});

test('Shopify opens externally and the visitor is told they are leaving', async ({ page }) => {
  await open(page, '/music/dev-fixture-ep');
  const buy = page.getByRole('link', { name: /Buy on Shopify/ });
  await expect(buy).toHaveAttribute('href', 'https://example.com/dev-fixture/shopify');
  await expect(buy).toHaveAttribute('target', '_blank');
  await expect(buy).toHaveAttribute('rel', /noopener/);
  await expect(page.locator('main')).toContainText("You'll leave Leo & Associates");
});

test('playback persists across page navigation', async ({ page }) => {
  await open(page, '/music/dev-fixture-ep');
  await page.getByRole('button', { name: 'Play Test Signal A (92 BPM)', exact: true }).click();
  const mini = page.locator('.mini-player.visible');
  await expect(mini).toContainText('Test Signal A');
  await expect(page.locator('.mini-toggle')).toHaveAttribute('aria-label', 'Pause');

  await page.locator('.desktop-nav').getByRole('link', { name: 'ARTISTS' }).click();
  await expect(page).toHaveURL(/\/artists$/);
  await expect(mini).toContainText('Test Signal A');
  await expect(page.locator('.mini-toggle')).toHaveAttribute('aria-label', 'Pause');

  // Still advancing on the new page: open the full player and read the clock.
  await page.locator('.mini-expand').click();
  const clock = page.locator('#playerOverlay .transport-time').first();
  const t1 = await clock.textContent();
  await page.waitForTimeout(1500);
  expect(await clock.textContent()).not.toBe(t1);
});

test('the record spins only while playing and stops after pause', async ({ page }) => {
  await open(page, '/dev/turntable');
  const a0 = await angle(page);
  await page.waitForTimeout(400);
  expect(await angle(page)).toBe(a0);

  await mainPlay(page, 'Play').click();
  await expect(deck(page)).toHaveClass(/tt-armed/);
  await page.waitForTimeout(900);
  const a1 = await angle(page);
  await page.waitForTimeout(300);
  expect(await angle(page)).not.toBe(a1);

  await mainPlay(page, 'Pause').click();
  await page.waitForTimeout(1200); // brakes to a stop in 0.8 s
  const s1 = await angle(page);
  await page.waitForTimeout(400);
  expect(await angle(page)).toBe(s1);
});

test('dragging the record scratches recent audio and playback resumes on release', async ({ page }) => {
  await open(page, '/dev/turntable');
  await mainPlay(page, 'Play').click();
  await page.waitForTimeout(2500); // let a few seconds be recorded

  const at = await grabPoint(page);

  await page.mouse.move(...at(0));
  await page.mouse.down();
  for (let k = 0; k < 2; k++) {
    for (let d = 0; d >= -60; d -= 6) await page.mouse.move(...at(d));
    for (let d = -60; d <= 0; d += 6) await page.mouse.move(...at(d));
  }
  await page.mouse.up();

  await expect(page.locator('main .tt-diag')).toContainText('live scrub of recently played audio');
  const p1 = await position(page);
  await page.waitForTimeout(1500);
  expect(await position(page)).toBeGreaterThan(p1);
});

test('a real touch drag moves the record', async ({ page }) => {
  await open(page, '/dev/turntable');
  const at = await grabPoint(page);
  const cdp = await page.context().newCDPSession(page);
  const touch = async (type: 'touchStart' | 'touchMove' | 'touchEnd', deg: number) => {
    const [x, y] = at(deg);
    await cdp.send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [{ x, y }] });
  };
  const before = await angle(page);
  const scrollBefore = await page.evaluate(() => window.scrollY);
  await touch('touchStart', 0);
  for (let d = 5; d <= 60; d += 5) await touch('touchMove', d);
  await touch('touchEnd', 60);
  // The page must not have scrolled: the platter owns the gesture.
  expect(await page.evaluate(() => window.scrollY)).toBe(scrollBefore);
  expect(Math.abs((await angle(page)) - before)).toBeGreaterThan(30);
});

test('keyboard: Space toggles playback and arrows skip', async ({ page }) => {
  await open(page, '/dev/turntable');
  await platter(page).focus();
  await page.keyboard.press('Space');
  await expect(mainPlay(page, 'Pause')).toBeVisible();
  await page.waitForTimeout(600);
  await page.keyboard.press('ArrowRight');
  await expect.poll(() => position(page)).toBeGreaterThanOrEqual(5);
  await page.keyboard.press('Space');
  await expect(mainPlay(page, 'Play')).toBeVisible();
});

test('reduced motion: the record does not spin by itself', async ({ browser }) => {
  const context = await browser.newContext({ reducedMotion: 'reduce', baseURL: test.info().project.use.baseURL });
  const page = await context.newPage();
  await open(page, '/dev/turntable');
  await mainPlay(page, 'Play').click();
  await expect(mainPlay(page, 'Pause')).toBeVisible();
  const a = await angle(page);
  await page.waitForTimeout(700);
  expect(await angle(page)).toBe(a);
  await context.close();
});
