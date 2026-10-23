import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, readdir, stat, mkdir, writeFile } from 'node:fs/promises';
import { resolve, join, extname } from 'node:path';
import { chromium } from 'playwright-core';
import AxeBuilder from '@axe-core/playwright';

// Run after `npm run build`. Use CHROMIUM_PATH for an installed system browser,
// or run `npx playwright-core install chromium` to use Playwright's browser.
const root = resolve('dist');
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.pdf': 'application/pdf', '.xml': 'application/xml' };
const server = createServer(async (request, response) => {
    try {
        let path = resolve(root, `.${decodeURIComponent(new URL(request.url, 'http://localhost').pathname)}`);
        if (path !== root && !path.startsWith(root + '/')) throw new Error('Invalid path');
        if ((await stat(path)).isDirectory()) path = join(path, 'index.html');
        response.setHeader('Content-Type', mime[extname(path)] || 'application/octet-stream');
        response.end(await readFile(path));
    } catch {
        response.statusCode = 404;
        response.setHeader('Content-Type', 'text/html');
        response.end(await readFile(join(root, '404.html')));
    }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const origin = `http://127.0.0.1:${server.address().port}`;
async function routes(directory = root, prefix = '') {
    const found = [];
    for (const entry of await readdir(directory, { withFileTypes: true })) {
        if (entry.isDirectory()) found.push(...await routes(join(directory, entry.name), `${prefix}/${entry.name}`));
        else if (entry.name === 'index.html') found.push(`${prefix}/`);
    }
    return found.sort();
}
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined, args: ['--no-sandbox'] });
const report = { pages: [], flows: [], failures: [] };
const blockExternal = context => context.route('**/*', route => route.request().url().startsWith(origin) ? route.continue() : route.abort());
const errors = [];
try {
    for (const width of [1440, 375, 320]) {
        const context = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: 'reduce' });
        await blockExternal(context);
        await context.addInitScript(() => localStorage.setItem('ultimate_bench_cookie_consent', '{"advertising":false}'));
        const page = await context.newPage();
        page.on('pageerror', error => errors.push(error.message));
        for (const path of [...await routes(), '/404.html']) {
            errors.length = 0;
            await page.goto(origin + path);
            const metadata = await page.evaluate(() => ({
                title: document.title, description: document.querySelector('meta[name="description"]')?.getAttribute('content'),
                canonical: document.querySelectorAll('link[rel="canonical"]').length, h1: document.querySelectorAll('h1').length,
                ids: [...document.querySelectorAll('[id]')].map(element => element.id),
                links: [...document.querySelectorAll('a[href]')].map(element => element.getAttribute('href')).filter(href => href.startsWith('/') || href.startsWith('#')),
                leaderboardWidth: document.querySelector('.ultimate-bench-section')?.getBoundingClientRect().width,
                dialogWidth: document.querySelector('#cookie-preferences-dialog')?.getBoundingClientRect().width,
            }));
            const violations = width === 375 ? (await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()).violations.map(({ id, nodes }) => ({ id, nodes: nodes.map(({ target, failureSummary }) => ({ target, failureSummary })) })) : [];
            const row = { width, path, errors: [...errors], ...metadata, violations };
            report.pages.push(row);
            if (errors.length || violations.length || metadata.h1 !== 1 || metadata.canonical !== 1 || !metadata.description || metadata.leaderboardWidth > width) report.failures.push(row);
            console.log(`${width}px ${path}: ${errors.length} errors, ${violations.length} accessibility rules failing`);
        }
        await context.close();
    }
    const byPath = new Map(report.pages.filter(row => row.width === 1440).map(row => [row.path, row]));
    for (const page of byPath.values()) {
        assert.equal(new Set(page.ids).size, page.ids.length, `Duplicate IDs: ${page.path}`);
        for (const href of new Set(page.links)) {
            const url = new URL(href, origin + page.path);
            const target = byPath.get(url.pathname.endsWith('/') || extname(url.pathname) ? url.pathname : url.pathname + '/');
            if (target && url.hash) assert.ok(target.ids.includes(decodeURIComponent(url.hash.slice(1))), `Missing anchor: ${page.path} → ${href}`);
            else if (!target) assert.ok(await stat(join(root, url.pathname)).catch(() => null), `Missing route: ${page.path} → ${href}`);
        }
    }
    const context = await browser.newContext({ viewport: { width: 375, height: 900 }, reducedMotion: 'reduce' });
    await blockExternal(context);
    const page = await context.newPage();
    page.on('pageerror', error => errors.push(error.message));
    errors.length = 0;
    const check = async (name, callback) => { await callback(); report.flows.push(name); console.log(`PASS ${name}`); };
    await page.goto(origin);
    await check('Consent Escape and focus restoration', async () => {
        await page.locator('#manage-cookies').click();
        assert.ok(await page.locator('#cookie-preferences-dialog').isVisible());
        assert.ok(await page.locator('#main-content').evaluate(element => element.inert));
        assert.ok((await page.locator('#cookie-preferences-dialog').boundingBox()).width <= 343);
        await page.keyboard.press('Escape');
        assert.ok(await page.locator('#cookie-notice').isVisible());
        assert.equal(await page.evaluate(() => document.activeElement.id), 'manage-cookies');
        await page.locator('#reject-cookies').click();
    });
    await check('Mobile visitors see model names and Overall without scrolling sideways', async () => {
        const score = await page.locator('.ultimate-score-cell').first().boundingBox();
        assert.ok(score.x >= 0 && score.x + score.width <= 375, 'Overall is in the initial mobile table viewport');
        assert.ok(score.y < 650, 'The leaderboard starts near the top of the page');
    });
    await check('Mobile navigation is inert while closed and Escape restores focus', async () => {
        assert.ok(await page.locator('#navbar-menu').evaluate(element => element.inert));
        await page.locator('#navbar-toggle').click();
        assert.equal(await page.locator('#navbar-toggle').getAttribute('aria-expanded'), 'true');
        await page.keyboard.press('Escape');
        assert.equal(await page.locator('#navbar-toggle').getAttribute('aria-expanded'), 'false');
        assert.equal(await page.evaluate(() => document.activeElement.id), 'navbar-toggle');
        await page.setViewportSize({ width: 1440, height: 900 });
        assert.equal(await page.locator('#navbar-menu').evaluate(element => element.inert), false);
    });
    await check('Leaderboard filtering, clearing, provider selection and sorting', async () => {
        await page.locator('#ultimate-model-filter').fill('no-such-model-xyz');
        assert.ok(await page.locator('#ultimate-filter-empty').isVisible());
        await page.locator('#ultimate-filter-clear').click();
        await page.locator('[data-provider-filter="Google"]').click();
        assert.ok((await page.locator('.ultimate-table-body tr:visible').count()) > 0);
        assert.ok((await page.locator('.ultimate-table-body tr:visible').evaluateAll(rows => rows.every(row => row.dataset.provider === 'Google'))));
        await page.locator('#ultimate-filter-clear').click();
        await page.locator('#ultimate-sort-btn').click();
        const scores = await page.locator('.ultimate-table-body .ultimate-score-cell').evaluateAll(cells => cells.map(cell => Number(cell.dataset.absoluteScore)));
        assert.deepEqual(scores, [...scores].sort((a, b) => a - b));
    });
    await page.setViewportSize({ width: 375, height: 900 });
    await check('Arena dialogs preserve rows, ranks, focus and cleanup with reduced motion', async () => {
        for (const arena of ['visual', 'data', 'chess']) {
            await page.locator(`.expand-btn[data-target="${arena}"]`).click();
            assert.ok(await page.locator('#benchmark-modal').isVisible());
            assert.ok((await page.locator('#benchmark-modal .modal-content').boundingBox()).width <= 375);
            assert.ok(await page.locator('#home-wrapper').evaluate(element => element.inert));
            const dropdown = page.locator(`#${arena}-ranking-method`);
            const before = await page.locator(`#${arena}-table-body .benchmark-row`).count();
            await dropdown.selectOption('resilience');
            await dropdown.selectOption('canonical');
            assert.equal(await page.locator(`#${arena}-table-body .benchmark-row`).count(), before);
            const violations = (await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()).violations;
            if (violations.length) { report.failures.push({ arena, violations }); console.log(`Dialog ${arena}: ${violations.map(v => v.id).join(', ')}`); }
            await page.locator('#benchmark-modal-close').focus();
            await page.keyboard.press('Shift+Tab');
            assert.ok(await page.evaluate(() => document.activeElement.closest('#benchmark-modal') !== null));
            await page.keyboard.press('Escape');
            assert.equal(await page.locator('#benchmark-modal-body > *').count(), 0);
            assert.equal(await page.locator('#home-wrapper').evaluate(element => element.inert), false);
            assert.equal(await page.evaluate(() => document.activeElement.dataset.target), arena);
        }
    });
    await check('Expandable arena summaries and chart controls', async () => {
        const summaries = page.locator('.arena-summary');
        assert.equal(await summaries.count(), 3);
        assert.equal(await summaries.evaluateAll(items => items.every(item => !item.open)), true);
        await summaries.first().locator('summary').click();
        assert.ok(await summaries.first().locator('table').isVisible());
        await summaries.first().locator('summary').click();
        await page.locator('[data-score-mode="pareto"]').click();
        assert.ok(await page.locator('.pareto-panel').isVisible());
        await page.locator('[data-score-mode="progress"]').click();
        await page.locator('[data-metric="visual"]').click();
        assert.ok(await page.locator('.timeline-point-group').count() > 0);
        await page.locator('[data-range="full"]').click();
        await page.locator('.quiet-toggle').filter({ has: page.locator('[data-full-scale]') }).click();
    });
    await check('Arcade records, idle scrolling, game launch and return', async () => {
        await page.goto(origin + '/arcade/');
        assert.equal(await page.evaluate(() => !dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', cancelable: true }))), false);
        await page.locator('#leaderboard-btn').click();
        assert.ok(await page.locator('#leaderboard-view').isVisible());
        await page.locator('#header-back-btn').click();
        for (const game of ['tictactoe', 'pool', 'snake', 'tetris', 'breakout', 'adventure']) {
            await page.locator(`[data-game="${game}"]`).click();
            assert.ok(await page.locator('#game-area').isVisible());
            if (game === 'tictactoe') {
                const canvas = page.locator('#game-canvas');
                const before = await canvas.evaluate(element => element.toDataURL());
                await canvas.click({ position: { x: 35, y: 35 } });
                assert.notEqual(await canvas.evaluate(element => element.toDataURL()), before, 'Pointer input updates the board');
            }
            await page.locator('#header-back-btn').click();
            assert.ok(await page.locator('#game-menu').isVisible());
        }
    });
    await check('Guide controls and downloadable worksheet', async () => {
        await page.goto(origin + '/guide/');
        await page.locator('#guide-goal').selectOption('private');
        assert.ok(await page.locator('[data-goal="private"]').isVisible());
        await page.locator('#model-a').selectOption('1');
        assert.match(await page.locator('#compare-message').textContent(), /same configuration/);
        const downloaded = page.waitForEvent('download');
        await page.locator('#download-worksheet').click();
        assert.equal((await downloaded).suggestedFilename(), 'ultimate-bench-private-evaluation.csv');
    });
    await check('Release dates refresh using the browser clock', async () => {
        await page.clock.install({ time: new Date('2030-10-23T12:00:00Z') });
        await page.goto(origin);
        assert.match(await page.locator('.ultimate-release-date .release-time-ago').first().textContent(), /years ago/);
        await page.clock.setSystemTime(new Date());
    });
    await check('Withdrawing saved advertising consent stops code after reload', async () => {
        await context.route('https://pagead2.googlesyndication.com/**', route => route.fulfill({ contentType: 'text/javascript', body: 'window.auditAdvertisingLoaded = true;' }));
        await page.goto(origin);
        await page.locator('#reopen-cookie-settings').click();
        await page.locator('#advertising-consent').check();
        await page.locator('#save-cookies').click();
        await page.waitForFunction(() => window.auditAdvertisingLoaded === true);
        await page.locator('#reopen-cookie-settings').click();
        await page.locator('#advertising-consent').uncheck();
        await Promise.all([page.waitForNavigation(), page.locator('#save-cookies').click()]);
        assert.equal(await page.evaluate(() => window.auditAdvertisingLoaded), undefined);
        assert.equal(await page.locator('script[data-consent-service="adsense"]').count(), 0);
        assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('ultimate_bench_cookie_consent')).advertising), false);
    });
    assert.deepEqual(errors, [], 'Runtime errors during interactive flows');
    await context.close();

    const blocked = await browser.newContext();
    await blockExternal(blocked);
    await blocked.addInitScript(() => {
        for (const name of ['localStorage', 'sessionStorage']) Object.defineProperty(window, name, { get() { throw new DOMException('Storage blocked', 'SecurityError'); } });
    });
    const restrictedPage = await blocked.newPage();
    const storageErrors = [];
    restrictedPage.on('pageerror', error => storageErrors.push(error.message));
    await restrictedPage.goto(origin + '/arcade/');
    await restrictedPage.locator('#reject-cookies').click();
    await restrictedPage.locator('#leaderboard-btn').click();
    await restrictedPage.locator('#header-back-btn').click();
    await restrictedPage.locator('[data-game="adventure"]').click();
    await restrictedPage.locator('#adv-save-btn').click();
    assert.match(await restrictedPage.locator('#adv-status-msg').textContent(), /Could not save/);
    assert.deepEqual(storageErrors, []);
    report.flows.push('Blocked localStorage and sessionStorage remain usable');
    await blocked.close();
    const noJavaScript = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 375, height: 900 } });
    await blockExternal(noJavaScript);
    const staticPage = await noJavaScript.newPage();
    await staticPage.goto(origin);
    assert.ok(await staticPage.locator('#navbar-menu a[href="/guide"]').isVisible());
    assert.ok(await staticPage.locator('.ultimate-table-body tr').count() > 0);
    report.flows.push('Navigation and leaderboard remain available without JavaScript');
    await noJavaScript.close();
    assert.equal(report.failures.length, 0, 'See work/browser-audit.json for page failures');
} finally {
    await mkdir('work', { recursive: true });
    await writeFile('work/browser-audit.json', JSON.stringify(report, null, 2));
    await browser.close();
    await new Promise(resolve => server.close(resolve));
}
