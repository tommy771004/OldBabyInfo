import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';

const directory = '.scratch/site-redesign/browser-evidence';
await mkdir(directory, { recursive: true });
// Local-only server, no production DB reads/writes or OAuth integration.
const server = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'start', '--hostname', '127.0.0.1', '--port', '3219'], {
  env: { ...process.env, DATABASE_URL: '', SUP_DATABASE_URL: '', AUTH_DATABASE_ENABLED: 'false', COMMUNITY_WRITES_ENABLED: 'false' },
  stdio: ['ignore', 'pipe', 'pipe'],
});
let serverLog = '';
server.stdout.on('data', data => { serverLog += data; });
server.stderr.on('data', data => { serverLog += data; });
let browser;
const checks = [];
try {
  let ready = false;
  for (let attempt = 0; attempt < 60; attempt++) {
    if (server.exitCode !== null) throw new Error(`Server exited: ${serverLog}`);
    try { if ((await fetch('http://127.0.0.1:3219/en/events')).ok) { ready = true; break; } } catch {}
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  if (!ready) throw new Error('Local server did not become ready');
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ reducedMotion: 'reduce' });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  for (const locale of ['zh-TW', 'en', 'ja']) {
    for (const width of [320, 390, 768, 1024, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      for (const route of ['events', 'meta']) {
        const response = await page.goto(`http://127.0.0.1:3219/${locale}/${route}`);
        if (response.status() !== 200) throw new Error(`HTTP ${response.status()}`);
        await page.locator('main h1').waitFor();
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1);
        if (overflow) throw new Error(`Horizontal overflow: ${locale}/${route} at ${width}`);
        if (width < 641) {
          const bar = page.locator('header nav').last();
          for (const link of await bar.locator('a').all()) {
            if (!await link.isVisible() || !(await link.innerText()).trim()) throw new Error('Missing visible navigation label');
            const bounds = await link.boundingBox();
            if (bounds.width < 44 || bounds.height < 44) throw new Error('Small navigation target');
            await link.focus();
            if (!await link.evaluate(element => element === document.activeElement)) throw new Error('Navigation cannot receive focus');
          }
          await page.locator('header a[href$="/combo"]').last().focus();
          await page.keyboard.press('Enter');
          await page.waitForURL(`**/${locale}/combo`);
          await page.goBack();
        }
        if (route === 'meta') {
          const action = page.locator('main a[href$="/combo"]');
          if (!await action.isVisible()) throw new Error('Missing Meta recovery action');
        }
        await page.screenshot({ path: `${directory}/${locale}-${route}-${width}.png`, fullPage: true });
        checks.push({ locale, route, width, reducedMotion: true, status: 'passed' });
      }
    }
  }
  if (errors.length) throw new Error(errors.join('\n'));
  await writeFile(`${directory}/results.json`, JSON.stringify({ checks, pageErrors: errors }, null, 2));
  console.log(`Passed ${checks.length} viewport/route checks; evidence: ${directory}`);
} finally {
  await browser?.close();
  server.kill('SIGTERM');
  await writeFile(`${directory}/server.log`, serverLog);
}
