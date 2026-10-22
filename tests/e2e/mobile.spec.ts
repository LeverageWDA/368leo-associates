import { expect, test } from '@playwright/test';

for (const path of ['/', '/music', '/artists', '/shop', '/about', '/contact']) for (const width of [320, 390, 768, 1440]) {
  test(`no horizontal overflow on ${path} at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 800 });
    await page.goto(path);
    await page.evaluate(() => document.fonts.ready);
    // Scroll through so scroll-linked layout states are exercised too.
    await page.evaluate(async () => {
      for (let y = 0; y < document.documentElement.scrollHeight; y += 600) {
        window.scrollTo(0, y);
        await new Promise(r => requestAnimationFrame(r));
      }
    });
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(0);
  });
}

test('mobile menu opens, traps nothing, and closes on Escape', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('/');
  const toggle = page.locator('#menuToggle');
  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  await expect(page.locator('#mobileMenu')).toHaveAttribute('aria-hidden', 'false');
  await page.keyboard.press('Escape');
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
});
