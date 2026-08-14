# ⚡ Bet Analyzer

Turn your bookmaker bet history into a performance dashboard — net profit/loss, ROI, win rate, odds-range performance, and daily trends.

Works with **football.com** today; more bookmakers (SportyBet, Betano, …) are pluggable via the provider system in `web/`.

There are **two ways to use it**:

| | CLI (`scripts/`) | Web bookmarklet (`web/`) |
|---|---|---|
| Who it's for | You, on your machine | Anyone — including non-technical people |
| How | Paste a scraper into the browser console, run `npm start` | Drag a bookmark once, click it on the bet history page |
| Setup | ~2 minutes | One-time drag-to-bookmarks |
| Data leaves the device? | No | No |

---

## 🖥️ CLI — analyze your own history

1. **Log in** to [football.com](https://www.football.com) and open your **Bet History** page:
   `https://www.football.com/ng/n/my_accounts/open_bets/bet_history`
2. Press `F12` → **Console**, paste the contents of [`scripts/scraper.js`](./scripts/scraper.js), press **Enter**.
   The script calls the same JSON API the site itself uses (the page has no "Next" button — it loads more bets as you scroll), so it works without clicking anything.
3. Move the downloaded `bets_raw.json` into the **project root**.
4. Run the report:

   ```bash
   npm start
   ```

> **Troubleshooting:** if the extracted bets look wrong, the scraper also saves `api_probe.json` (raw API responses) — share that output to fix the field mapping.

### Testing without real data

If `bets_raw.json` is missing, `npm start` asks whether to generate 50 mock bets. You can also force it:

```bash
node scripts/analyze.js --generate
```

---

## 🌐 Web — share with non-technical people

A hosted, no-install version: a **bookmarklet** that reads the user's bet history and opens a full dashboard in a new tab. No console, no files, no uploads — everything runs in their browser.

Everything under `web/` is **TypeScript**. Build with:

```bash
npm run build:web      # bundles + minifies bookmarklets, generates pages into web/dist/
npm run typecheck:web  # tsc --noEmit
```

Build output (`web/dist/`) — host this folder on any static host:

- `index.html` — install page with the **"⚡ Analyze My Bets"** button to drag into the bookmarks bar
- `demo.html` — sample report (preview the dashboard)
- `bookmarklet-<provider>.js` / `.txt` — the built bookmarklet and its `javascript:` URL

**User flow:** drag the button to the bookmarks bar → log in to football.com → click the bookmark on the Bet History page → report opens in a new tab.

### Adding a bookmaker

1. Log in to the site and find its bet-history JSON API (DevTools → Network).
2. Write `web/src/providers/<id>.ts` implementing the shared `Provider` interface (a `fetchBets` that returns normalized `Bet[]` — see `web/src/providers/football.ts` for reference).
3. Add `web/src/entries/<id>.ts` and rebuild — the install page picks the new bookmarklet up automatically.

---

## 📁 Project structure

```
scripts/
  analyze.js        CLI report generator (npm start)
  scraper.js        browser-console extractor for football.com
web/                TypeScript web app (bookmarklet + dashboard)
  src/core.ts       shared analysis math — same numbers as the CLI
  src/render.ts     dashboard HTML renderer
  src/bookmarklet.ts  bookmarklet runner (fetch → analyze → open report tab)
  src/providers/    per-bookmaker collectors
  src/entries/      bookmarklet entry point per provider
  build.mjs         esbuild pipeline: bookmarklets, demo, install page
  dist/             generated output (host this)
bets_raw.json       your extracted bet history (generated)
api_probe.json      raw API dump for debugging (generated)
```

---

## 📊 Metrics

- **Overall:** total stakes, total payouts, net profit/loss, ROI (settled), win rate, Won/Lost/Void/Open breakdown, biggest win & loss
- **By odds range:** Low (< 1.50) · Medium (1.50 – 2.50) · High (2.50 – 5.00) · Exotic (5.00+) — win rate, stakes, net profit, ROI per bucket
- **Daily trends:** net profit per active day for your most recent betting days

## 🔒 Privacy

- **Bookmarklet:** your bets are fetched and analyzed entirely in your browser and are never uploaded or stored anywhere.
- **CLI:** everything runs locally.

## 📝 Notes

- football.com amounts are treated as **NGN (₦)**.
- football.com has no order-level odds field — total odds is computed as the **product of the selections' odds**.
- football.com status codes: `winningStatus` 20 = Won, 30 = Lost, 10 = Void, 40 = Open.
