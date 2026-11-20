import { instant } from '@next/playwright';
import { expect, test } from '@playwright/test';

test.describe('instant navigation', () => {
  test('movie page shows its title in the static shell on initial load', async ({
    page,
    baseURL,
  }) => {
    await instant(
      page,
      async () => {
        await page.goto('/movie/693134-dune-part-two');
        await expect(page.getByRole('heading', { level: 1 })).toContainText('Dune: Part Two');
      },
      { baseURL },
    );
  });

  test('movie page shows its title right away on client navigation from home', async ({ page }) => {
    await page.goto('/');
    const firstMovie = page
      .getByRole('region', { name: 'Trending today' })
      .locator('a[href^="/movie/"]')
      .first();
    await expect(firstMovie).toBeVisible();
    // Movie links prefetch their URL-specific content on intent; hover, then let that finish.
    await firstMovie.hover();
    await page.waitForLoadState('networkidle');

    await instant(page, async () => {
      await firstMovie.click();
      await page.waitForURL((url) => url.pathname.startsWith('/movie/'));
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    });
  });
});
