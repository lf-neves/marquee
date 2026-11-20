import { expect, test } from '@playwright/test';

const hasDatabase = Boolean(process.env.DATABASE_URL);

test.describe('home', () => {
  test('billboard shows the top trending pick and switches on demand', async ({ page }) => {
    await page.goto('/');
    const heading = page.getByRole('heading', { level: 1 });
    await expect(heading).toHaveText('Dune: Part Two');

    const picker = page.getByRole('group', { name: 'Top five trending today' });
    const picks = picker.getByRole('button');
    await expect(picks).toHaveCount(5);
    await expect(picks.first()).toHaveAttribute('aria-pressed', 'true');

    await picks.nth(1).click();
    await expect(picks.nth(1)).toHaveAttribute('aria-pressed', 'true');
    await expect(heading).not.toHaveText('Dune: Part Two');
  });

  test('trending row links to movies and to the full list', async ({ page }) => {
    await page.goto('/');
    const row = page.getByRole('region', { name: 'Trending today' });
    await expect(row.getByRole('link', { name: 'See all' })).toBeVisible();
    const movieLinks = row.locator('a[href^="/movie/"]');
    await expect(movieLinks.first()).toBeVisible();
    expect(await movieLinks.count()).toBeGreaterThan(1);
  });
});

test.describe('movie page', () => {
  test('renders the title, details dialog and similar movies link', async ({ page }) => {
    await page.goto('/movie/693134-dune-part-two');
    await expect(page.getByRole('heading', { level: 1, name: 'Dune: Part Two' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'More like this' })).toBeVisible();

    await page.getByRole('button', { name: 'More info' }).click();
    const dialog = page.getByRole('dialog', { name: 'Dune: Part Two' });
    await expect(dialog).toBeVisible();
    await expect(dialog).toContainText('Denis Villeneuve');
  });

  test('redirects an id without a slug to the canonical URL', async ({ page }) => {
    await page.goto('/movie/693134');
    await expect(page).toHaveURL(/\/movie\/693134-dune-part-two$/);
  });

  // A soft 404: the prerendered shell has already been sent with status 200 when the lookup fails,
  // so the page renders the not-found UI and Next.js marks it noindex.
  test('shows a not-found page for an unknown movie', async ({ page }) => {
    await page.goto('/movie/1');
    await expect(page.getByText('isn’t on TMDB')).toBeVisible();
    await expect(page.locator('meta[name="robots"]').first()).toHaveAttribute('content', /noindex/);
  });
});

test.describe('trending', () => {
  test('lists 20 movies, loads the rest on scroll and ends the list', async ({ page }) => {
    await page.goto('/trending');
    await expect(page.getByRole('heading', { level: 1, name: 'Trending' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Today' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await expect(page.getByRole('button', { name: 'This week' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );

    const cards = page.getByRole('article').filter({ has: page.getByRole('link') });
    await expect(cards).toHaveCount(20);

    await expect
      .poll(
        async () => {
          await page.mouse.wheel(0, 100_000);
          return cards.count();
        },
        { timeout: 20_000 },
      )
      .toBe(26);
    await expect(page.getByText('You’ve reached the end')).toBeVisible();
  });

  test('switching to this week changes the first card', async ({ page }) => {
    await page.goto('/trending');
    const firstTitle = page.getByRole('article').first().getByRole('link').first();
    await expect(firstTitle).toBeVisible();
    const todayTitle = await firstTitle.innerText();

    await page.getByRole('button', { name: 'This week' }).click();
    await expect(page.getByRole('button', { name: 'This week' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await expect(firstTitle).not.toHaveText(todayTitle);
  });
});

test.describe('watchlist', () => {
  test.skip(!hasDatabase, 'DATABASE_URL is not set; the watchlist persists to Postgres.');

  test('saves a movie and lists it', async ({ page }) => {
    await page.goto('/movie/693134-dune-part-two');
    const save = page.getByRole('button', { name: 'Save to watchlist' });
    await Promise.all([
      page.waitForResponse((response) => response.url().includes('watchlist.set') && response.ok()),
      save.click(),
    ]);

    await expect(page.getByText('Added “Dune: Part Two” to your watchlist.')).toBeVisible();
    // The label states the action, so the button carries no aria-pressed as well.
    await expect(page.getByRole('button', { name: 'Remove from watchlist' })).toBeVisible();

    const headerLink = page.getByRole('banner').getByRole('link', { name: /Watchlist/ });
    await expect(headerLink).toContainText('1');

    await headerLink.click();
    await page.waitForURL('**/watchlist');
    await expect(page.getByRole('link', { name: /Dune: Part Two/ }).first()).toBeVisible();
  });
});

test.describe('ask', () => {
  test('answers with movie cards linking to movie pages', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('banner').getByRole('button', { name: 'Ask Marquee' }).click();
    const dialog = page.getByRole('dialog', { name: 'Ask Marquee' });
    await expect(dialog).toBeVisible();

    const input = dialog.getByRole('textbox', { name: 'Message Marquee' });
    await input.fill('dune');
    await input.press('Enter');

    const movieLinks = dialog.locator('a[href^="/movie/"]');
    await expect(movieLinks.first()).toBeVisible({ timeout: 15_000 });
  });
});
