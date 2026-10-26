// End-to-end test: four separate browsers (separate storage, like four phones) play a
// full round through the real UI, then a player refreshes / reopens and resumes.
//
//   BASE_URL=http://localhost:3000 node e2e/play.cjs
//
// Uses the `playwright` package (install it with `npm i -D playwright && npx playwright
// install chromium` if it is not available globally).
const { chromium, devices } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');

const BASE = process.env.BASE_URL || 'http://localhost:3000';
const DEVICE = process.env.DEVICE || 'iPhone 13';
const SHOTS = path.join(__dirname, 'screenshots', DEVICE.replace(/\W+/g, '-').toLowerCase());
const NAMES = ['سارة', 'خالد', 'نورة', 'فهد'];
fs.mkdirSync(SHOTS, { recursive: true });

function assert(cond, msg) {
  if (!cond) throw new Error(`ASSERTION FAILED: ${msg}`);
  console.log(`  ✓ ${msg}`);
}

async function shot(page, name) {
  await page.waitForTimeout(700); // let entrance animations settle
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  assert(overflow <= 0, `${name}: no sideways scrolling (overflow ${overflow}px)`);
  await page.screenshot({ path: path.join(SHOTS, `${name}.png`), fullPage: true });
  fs.mkdirSync(path.join(SHOTS, 'screen'), { recursive: true });
  await page.screenshot({ path: path.join(SHOTS, 'screen', `${name}.png`) });
}

(async () => {
  const browser = await chromium.launch();
  const phone = devices[DEVICE];
  if (!phone) throw new Error(`unknown DEVICE ${DEVICE}`);
  const contexts = [];
  const pages = [];
  for (let i = 0; i < NAMES.length; i++) {
    const ctx = await browser.newContext({ ...phone, locale: 'ar-SA' });
    // Everyone except the host has "seen" the guide, so it only pops up for the host.
    if (i > 0) await ctx.addInitScript(() => localStorage.setItem('ctl.tutorialSeen', '1'));
    contexts.push(ctx);
    const page = await ctx.newPage();
    page.on('pageerror', (err) => {
      throw new Error(`[${NAMES[i]}] page error: ${err.message}`);
    });
    pages.push(page);
  }
  const [host, ...guests] = pages;

  console.log('1) Home & create room');
  await host.goto(BASE);
  await shot(host, '01-home');
  await host.fill('#nickname', NAMES[0]);
  await host.getByRole('button', { name: /أنشئ غرفة جديدة/ }).click();
  await host.waitForURL(/\/r\/\d{6}$/);
  const code = (await host.getByTestId('room-code').textContent()).trim();
  assert(/^\d{6}$/.test(code), `room created with code ${code}`);

  console.log('1b) First-time guide');
  await host.getByTestId('tutorial').waitFor();
  assert(true, 'the step-by-step guide opens the first time');
  await host.getByTestId('tutorial-next').click();
  await host.getByTestId('tutorial-next').click();
  await shot(host, '01b-tutorial-example');
  for (let i = 0; i < 3; i++) await host.getByTestId('tutorial-next').click();
  await host.getByTestId('tutorial').waitFor({ state: 'detached' });
  assert(true, 'the guide closes with «يلا نلعب»');

  console.log('2) Friends join with the link');
  for (let i = 0; i < guests.length; i++) {
    const g = guests[i];
    await g.goto(`${BASE}/r/${code}`);
    if (i === 0) await shot(g, '02-join-by-link');
    await g.fill('#join-nickname', NAMES[i + 1]);
    await g.getByTestId('join-room').click();
    await g.getByTestId('room-code').waitFor();
  }
  await host.waitForFunction(() => document.querySelectorAll('[data-testid=lobby-players] .player-chip').length === 4);
  assert(true, 'host sees all 4 players live');
  await host.getByRole('button', { name: 'مرة', exact: true }).click(); // one hint each, faster
  await guests[0].waitForFunction(() => document.body.innerText.includes('جولات التلميح'));
  await shot(host, '03-lobby-host');
  await shot(guests[0], '04-lobby-guest');

  console.log('2b) Chat');
  await guests[0].getByTestId('chat-button').click();
  await guests[0].getByTestId('chat-input').fill('هلا والله 👋 جاهزين؟');
  await guests[0].getByTestId('chat-send').click();
  await host.locator('[data-testid=chat-button] .badge-count').waitFor();
  assert(true, 'the host sees an unread badge');
  await host.getByTestId('chat-button').click();
  await host.getByTestId('chat-list').getByText('هلا والله 👋 جاهزين؟').waitFor();
  await host.getByTestId('chat-input').fill('يلا نبدأ 🔥');
  await host.getByTestId('chat-send').click();
  await guests[0].getByTestId('chat-list').getByText('يلا نبدأ 🔥').waitFor();
  assert(true, 'messages arrive live both ways');
  await shot(guests[0], '04b-chat');
  for (const p of [host, guests[0]]) await p.keyboard.press('Escape');

  console.log('3) Start round & secret roles');
  await host.getByTestId('start-round').click();
  for (const p of pages) await p.getByTestId('secret-card').waitFor();
  await shot(host, '05-reveal-hidden');
  let word = null;
  let liarIndex = -1;
  for (let i = 0; i < pages.length; i++) {
    const p = pages[i];
    await p.getByTestId('secret-card').click();
    await p.waitForTimeout(800);
    if (await p.getByTestId('role-liar').isVisible()) {
      assert(liarIndex === -1, `${NAMES[i]} is the only liar`);
      liarIndex = i;
      await shot(p, '06-reveal-liar');
    } else {
      const w = (await p.getByTestId('secret-word').textContent()).trim();
      if (word === null) {
        word = w;
        await shot(p, '07-reveal-civilian');
      }
      assert(w === word, `${NAMES[i]} got the same secret word`);
    }
  }
  assert(liarIndex >= 0, 'exactly one liar was chosen');
  const liarPage = pages[liarIndex];
  const liarHtml = await liarPage.content();
  assert(!liarHtml.includes(word), "the liar's page never contains the secret word");

  for (const p of pages) await p.getByTestId('ready').click();

  console.log('4) Hints in turn');
  for (let turn = 1; turn <= 4; turn++) {
    // The player whose turn it is: input visible AND their page already shows the
    // previous hints (so we never grab the last player's not-yet-updated screen).
    let mine = null;
    for (let tries = 0; tries < 100 && !mine; tries++) {
      for (const p of pages) {
        const ready = await p
          .evaluate((n) => !!document.querySelector('[data-testid=hint-input]') && document.querySelectorAll('[data-testid=hint-feed] .hint').length === n, turn - 1)
          .catch(() => false);
        if (ready) mine = p;
      }
      if (!mine) await host.waitForTimeout(100);
    }
    assert(!!mine, `turn ${turn}: exactly one player can type`);
    if (turn === 2) {
      await shot(mine, '08-hints-my-turn');
      await mine.getByTestId('hint-input').fill('تلميح1');
      await mine.getByTestId('hint-send').click();
      await mine.getByText('انقال قبل', { exact: false }).first().waitFor();
      assert(true, 'repeating an earlier hint is rejected');
    }
    await mine.getByTestId('hint-input').fill(`تلميح${turn}`);
    await mine.getByTestId('hint-send').click();
    await host.waitForFunction((n) => document.querySelectorAll('[data-testid=hint-feed] .hint').length >= n, turn);
  }
  await host.waitForFunction(() => document.body.innerText.includes('مين الكذّاب؟'));

  console.log('5) Voting');
  const liarName = NAMES[liarIndex];
  for (let i = 0; i < pages.length; i++) {
    const p = pages[i];
    const target = i === liarIndex ? NAMES[(i + 1) % NAMES.length] : liarName;
    await p.getByTestId(`vote-${target}`).click();
    if (i === (liarIndex + 1) % NAMES.length) await shot(p, '09-voting');
    await p.getByTestId('cast-vote').click();
  }

  console.log('6) Liar caught → guess');
  await liarPage.getByTestId('submit-guess').waitFor();
  const other = pages[(liarIndex + 1) % pages.length];
  await shot(other, '10-guess-waiting');
  await liarPage.getByRole('radio', { name: word, exact: true }).click();
  await shot(liarPage, '11-guess-liar');
  await liarPage.getByTestId('submit-guess').click();

  console.log('7) Results & scores');
  for (const p of pages) await p.getByTestId('results').waitFor();
  const shownWord = (await host.getByTestId('result-word').textContent()).trim();
  const shownLiar = (await host.getByTestId('liar-name').textContent()).trim();
  assert(shownWord === word, `results reveal the word "${word}"`);
  assert(shownLiar.startsWith(liarName), `results reveal the liar "${liarName}"`);
  await shot(host, '12-results');
  await shot(liarPage, '13-results-liar');

  console.log('8) Refresh and reopen: players come back to the room');
  const refresher = guests[0];
  await refresher.reload();
  await refresher.getByTestId('results').waitFor();
  assert(true, 'a refreshed tab resumes the room automatically');
  const reopened = await contexts[2].newPage();
  await pages[2].close();
  await reopened.goto(`${BASE}/r/${code}`);
  await reopened.getByTestId('continue-as').click();
  await reopened.getByTestId('results').waitFor();
  assert(true, 'a reopened browser resumes with one tap ("كمّل باسم…")');
  pages[2] = reopened;

  console.log('9) Play again in the same room');
  await host.getByTestId('play-again').click();
  for (const p of pages) await p.getByTestId('secret-card').waitFor();
  assert(true, 'round 2 started for everyone');

  console.log('9b) Connection drops and comes back');
  const flaky = guests[2];
  const flakyCtx = contexts[3];
  await flaky.getByTestId('secret-card').click();
  await flaky.waitForTimeout(800);
  const roleBefore = (await flaky.getByTestId('role-liar').isVisible()) ? 'liar' : (await flaky.getByTestId('secret-word').textContent()).trim();
  await flakyCtx.setOffline(true);
  await host.waitForFunction(() => document.body.innerText.includes('غير متصل'), null, { timeout: 60000 });
  assert(true, 'others see the player go offline');
  await flaky.getByText('انقطع الاتصال').waitFor({ timeout: 30000 });
  assert(true, 'the offline player sees a reconnecting banner');
  await flakyCtx.setOffline(false);
  await host.waitForFunction(() => !document.body.innerText.includes('غير متصل'), null, { timeout: 30000 });
  // The round may have moved on while they were away; read the role wherever it is shown.
  let roleAfter;
  if (await flaky.getByTestId('secret-card').isVisible().catch(() => false)) {
    roleAfter = (await flaky.getByTestId('role-liar').isVisible()) ? 'liar' : (await flaky.getByTestId('secret-word').textContent()).trim();
  } else {
    await flaky.locator('.mini-secret').click();
    const txt = await flaky.locator('.mini-secret .value').textContent();
    roleAfter = txt.includes('الكذّاب') ? 'liar' : txt.split('•')[0].trim();
  }
  assert(roleBefore === roleAfter, 'after reconnecting the player keeps the same secret role');

  console.log('10) Desktop layout');
  const desk = await browser.newContext({ viewport: { width: 1366, height: 900 }, locale: 'ar-SA' });
  await desk.addInitScript(() => localStorage.setItem('ctl.tutorialSeen', '1'));
  const deskPage = await desk.newPage();
  await deskPage.goto(BASE);
  await shot(deskPage, '14-home-desktop');
  await deskPage.goto(`${BASE}/r/${code}`);
  await deskPage.fill('#join-nickname', 'ريم');
  await deskPage.getByTestId('join-room').click();
  await deskPage.getByTestId('spectator').first().waitFor();
  assert(true, 'a mid-round joiner becomes a spectator');
  await shot(deskPage, '15-spectator-desktop');

  console.log('11) Host locks the room');
  await host.getByRole('button', { name: 'مشاركة الغرفة' }).click();
  await host.getByTestId('lock-room').click(); // state comes back from the server
  await host.getByText('الغرفة مقفلة', { exact: false }).first().waitFor();
  const outsider = await (await browser.newContext({ ...phone, locale: 'ar-SA' })).newPage();
  await outsider.goto(`${BASE}/r/${code}`);
  await outsider.getByTestId('room-locked').waitFor();
  assert(true, 'a stranger cannot join a locked room');

  await browser.close();
  console.log('\nE2E passed ✅');
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
