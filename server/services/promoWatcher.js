const cheerio = require('cheerio');
const PromoCode = require('../models/PromoCode');

// Watches coupon websites for new Shein / Zalando promo codes (Italy + France)
// and stores them as PromoCode documents. New ones stay `seen: false` so the
// admin's bell lights up.
//
// Only websites that serve their offers in plain HTML are used; most others
// (Coupert, Hotdeals, Wethrift, Dealabs...) block bots or load codes with JS.
// Every parser is best effort: if a website changes its markup, that source
// just returns nothing (or an error in the status) and the others keep going.
// Codes on coupon websites are often expired or fake, so the UI says "à tester".

const SOURCES = [
  // Italy. Scontify puts the code in the page (data-clipboard-text).
  { source: 'Scontify', store: 'shein', country: 'it', url: 'https://www.scontify.net/negozi/shein/', parse: parseScontify },
  { source: 'Scontify', store: 'zalando', country: 'it', url: 'https://www.scontify.net/negozi/zalando/', parse: parseScontify },
  // France. Radins hides the code behind "Voir le code": we get the offer, the
  // admin reveals the code on the website.
  { source: 'Radins', store: 'shein', country: 'fr', url: 'https://www.radins.com/code-promo/shein/', parse: parseRadins },
  { source: 'Radins', store: 'zalando', country: 'fr', url: 'https://www.radins.com/code-promo/zalando/', parse: parseRadins },
  // Not tied to a country (mostly codes that work on several EU sites).
  { source: 'Promocode.ac', store: 'shein', country: 'all', url: 'https://www.promocode.ac/view/shein-coupon-code/', parse: parsePromocodeAc },
  { source: 'Promocode.ac', store: 'zalando', country: 'all', url: 'https://www.promocode.ac/view/zalando-coupon-code/', parse: parsePromocodeAc },
];

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36';
const CODE_RE = /^[A-Za-z0-9][A-Za-z0-9_-]{2,29}$/; // a usable code: one word, no spaces
const clean = (s) => (s || '').replace(/\s+/g, ' ').trim();

// ── Parsers: html -> [{ sourceId, code, title, expiresAt }] (active offers only) ──

function parseScontify(html) {
  const $ = cheerio.load(html);
  const offers = [];
  $('article.scn-card').each((_, el) => {
    const card = $(el);
    const btn = card.find('[data-clipboard-text]').first();
    const code = clean(btn.attr('data-clipboard-text'));
    if (!btn.length || !CODE_RE.test(code)) return; // a promo without code, or "ISCRIZIONE ALLA NEWSLETTER"
    if (card.find('.scn-chip--scaduto').length) return; // expired
    const value = clean(card.find('.scn-valore').text());
    const title = clean(card.find('.scn-card__titolo').text());
    offers.push({
      sourceId: btn.attr('data-codeid') || card.attr('id') || code,
      code,
      title: value && !title.includes(value) ? `${value} · ${title}` : title,
      expiresAt: parseItalianDate(card.find('.scn-chip').text()),
    });
  });
  return offers;
}

function parseRadins(html) {
  const $ = cheerio.load(html);
  const offers = [];
  $('[data-attribute="code"][data-id]').each((_, el) => {
    const card = $(el).parent();
    const title = clean(card.find('[data-testid="vouchers-ui-voucher-card-description"] h3').first().text());
    if (!title) return;
    const m = card.text().match(/Expire le\s*:?\s*(\d{2})\/(\d{2})\/(\d{4})/);
    const expiresAt = m ? new Date(Date.UTC(+m[3], +m[2] - 1, +m[1], 21, 59)) : null;
    if (expiresAt && expiresAt < new Date()) return;
    offers.push({ sourceId: $(el).attr('data-id'), code: '', title, expiresAt });
  });
  return offers;
}

function parsePromocodeAc(html) {
  const $ = cheerio.load(html);
  const offers = [];
  $('.coupon-item.c-type-code').each((_, el) => {
    const item = $(el);
    if (item.hasClass('coupon-expired') || item.find('.has-expired').length) return;
    const link = item.find('a.coupon-link[data-code]').first();
    const code = clean(link.attr('data-code'));
    if (!CODE_RE.test(code)) return;
    const exp = clean(item.find('.c-type .exp').first().text()).replace(/^Expires\s*/i, '');
    const parsed = exp && !/no expires/i.test(exp) ? new Date(exp) : null;
    offers.push({
      sourceId: link.attr('data-coupon-id') || item.attr('data-id') || code,
      code,
      title: clean(link.attr('title') || link.text()),
      expiresAt: parsed && !isNaN(parsed) ? parsed : null,
    });
  });
  return offers;
}

const IT_MONTHS = ['gennaio', 'febbraio', 'marzo', 'aprile', 'maggio', 'giugno', 'luglio', 'agosto', 'settembre', 'ottobre', 'novembre', 'dicembre'];

// "Scade il 30 novembre 2026" -> Date (null if there's no date).
// Dates are stored as 23:59 Paris/Rome winter time (21:59 UTC), like Radins'
// own endTime, so they don't show as the next day in Tunisia.
function parseItalianDate(text) {
  const m = (text || '').toLowerCase().match(/(\d{1,2})\s+([a-z]+)\s+(\d{4})/);
  if (!m) return null;
  const month = IT_MONTHS.indexOf(m[2]);
  return month === -1 ? null : new Date(Date.UTC(+m[3], month, +m[1], 21, 59));
}

// ── Watcher ──

async function fetchHtml(url) {
  const res = await fetch(url, {
    headers: { 'User-Agent': USER_AGENT, Accept: 'text/html', 'Accept-Language': 'fr-FR,it-IT;q=0.9,en;q=0.8' },
    signal: AbortSignal.timeout(25000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.text();
}

let running = null;
let lastRun = null; // { startedAt, finishedAt, added, sources: [{ source, store, country, found, added, error }] }

// Saves one source's offers. The very first time a source is checked, its
// offers are stored as already seen: they aren't "new", and the admin
// shouldn't get dozens of alerts on day one.
async function saveOffers(src, offers) {
  const firstTime = !(await PromoCode.exists({ source: src.source, store: src.store, country: src.country }));
  let added = 0;
  const now = new Date();
  for (const o of offers) {
    const res = await PromoCode.updateOne(
      { source: src.source, sourceId: String(o.sourceId) },
      {
        $set: { title: o.title, code: o.code, expiresAt: o.expiresAt, lastSeenAt: now },
        $setOnInsert: { store: src.store, country: src.country, sourceUrl: src.url, seen: firstTime },
      },
      { upsert: true }
    );
    if (res.upsertedCount && !firstTime) added++;
  }
  return added;
}

async function runCheck() {
  if (running) return running; // a check is already in progress: share it
  running = (async () => {
    const run = { startedAt: new Date(), finishedAt: null, added: 0, sources: [] };
    for (const src of SOURCES) {
      const result = { source: src.source, store: src.store, country: src.country, found: 0, added: 0, error: null };
      try {
        const offers = src.parse(await fetchHtml(src.url));
        result.found = offers.length;
        result.added = await saveOffers(src, offers);
        run.added += result.added;
      } catch (err) {
        result.error = err.message;
      }
      run.sources.push(result);
    }
    run.finishedAt = new Date();
    lastRun = run;
    console.log(`[promo-watcher] check done: ${run.added} new code(s)`);
    return run;
  })();
  try {
    return await running;
  } finally {
    running = null;
  }
}

// Checks every PROMO_CHECK_INTERVAL_HOURS (default 3h), starting a minute after boot.
// On hosts that sleep when idle (Render free tier) checks only happen while awake;
// the "Vérifier maintenant" button covers the gaps.
function startPromoWatcher() {
  const hours = Number(process.env.PROMO_CHECK_INTERVAL_HOURS) || 3;
  const tick = () => runCheck().catch(err => console.error('[promo-watcher]', err.message));
  setTimeout(tick, 60 * 1000).unref();
  setInterval(tick, hours * 60 * 60 * 1000).unref();
}

module.exports = {
  runCheck,
  startPromoWatcher,
  getLastRun: () => lastRun,
  isRunning: () => !!running,
  // exported for tests
  parseScontify,
  parseRadins,
  parsePromocodeAc,
};
