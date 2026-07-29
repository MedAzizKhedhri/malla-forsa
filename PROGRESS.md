# Workflow Rework — Progress Tracker

> **Read this file first at the start of every session.** It tracks what the app actually
> does right now, deliberate tradeoffs worth knowing about, how to run it locally, and a
> session log of what happened and where things left off. Update the Session Log at the
> end of every session (or whenever work pauses).

## 1. Business context

Malla Forssa is a Shein-import broker operating between Europe and Tunisia. A broker signs
up clients, buys items on their behalf using shared "compte acheteur" (buyer) accounts,
groups purchases into Paniers, and forwards packages via carriers to Tunisia in Colis.

## 2. Current state of the app (as of Session 6)

**Client** (`Client` model / `/clients`)
- Name, phone, address, manual `nombreArticles` count, optional `compteAcheteur`. Just the
  contact record — no payment data lives here directly (see ClientPanier below).
- Client detail page: aggregate Payment Summary (total due / paid / reste, en-dette badge)
  computed from that client's `ClientPanier` records, a "Commandes de ce Client" list, and
  a "Nouvelle Commande" button that creates a `ClientPanier` **inline on this page** — no
  more navigating to `/paniers` to create a client's order. Each commande has its own
  pricing edit / add-payment / payment history / printable agreement, plus a dropdown to
  attach/detach it to/from a global Panier (or leave it unattached if it hasn't been
  batched yet).
- Client list view shows a per-client payment badge ("En dette: X TND" / "À jour") and a
  search box to filter by name/phone, computed server-side by `clientController.getClients`
  (aggregates every `ClientPanier` where `client` matches, returns
  `totalDue`/`totalPaid`/`totalReste`/`panierCount`).

**ClientPanier** (`ClientPanier` model / `/client-paniers` API) — **new in Session 6**.
A client's own order: `client` (required), optional `panier` (which global batch it rides
in, if any) and optional `colis` (which package it shipped in, if tracked that precisely),
`name`, `nombreArticles`, pricing (`estimatedAmountEur/Tnd`, `insuranceFee`),
`paymentStatus`/`paymentHistory`, `status`. This is the single source of truth for what a
client owes and has paid — a client can have several ClientPaniers over time, and several
clients can each have a ClientPanier pointing at the same global Panier. This is the split
requested this session: "client panier" and "global panier" were conflated before (a Panier
could only ever belong to one client), now they're independent and connected by reference.

**Panier** (`OrderSession` model / `/order-sessions` API, `/paniers` page — the
user-facing name is "Panier", the backend kept the old model/collection name to avoid a
migration)
- The shared buying batch only: `name`, `screenshots[]`, `nombreArticles`, `compteAcheteur`,
  `totalPrice`, `nombreColis`. No client field and no payment fields anymore — those moved
  to ClientPanier. `getOrderSessions`/`getOrderSessionById` enrich the response with the
  real list of attached clients (`clients[]` / `clientPaniers[]`, computed by querying
  ClientPanier) instead of the old manual `nombreClients` count. The Panier detail page has
  a "Clients rattachés" panel with a one-click "attach an existing client" action (creates
  a bare ClientPanier already linked to this panier).
- On save → auto-creates `nombreColis` blank `Colis` documents referencing this panier.
  Tracking numbers are left blank for the broker to fill in later.
- Deleting a panier detaches (does not delete) its colis **and** any ClientPaniers that
  pointed at it (they just lose the `panier` ref, nothing about the client's order/payments
  is lost).

**Colis** (`Colis` model / `/colis` API and page) — plain CRUD, no more packing workflow.
- Fields: `trackingNumber` (optional, unique-if-set via a sparse index), `carrier` and
  `location` (free strings, populated from `<select>`s backed by the Credentials lists),
  manual `nombreArticles`, `panier` ref (optional), `status`, `arrivalDate`, `notes`.

**Credentials** (`/credentials` page) — Transporteurs (name, phone, location, route) and
Locations (name, address), simple CRUD, reused as dropdown sources in the Colis form.

**Emails** (`/emails` page) — Buyer accounts (`BuyerAccount` model: email, label, and now
`password`) with show/hide + copy-to-clipboard on each card, so the broker can look up
Shein login credentials instead of hunting for them elsewhere. Plus the existing
"Actions Requises" email log feature (unchanged).

**Dashboard** — stat cards: total clients, clients en dette, total payé, reste à recevoir,
nombre de paniers, colis en transit, actions email. "Paniers Récents" list at the bottom.

**Removed entirely**: Articles (model, controller, routes, page), `ArticleColis` (the
packing join model), `QuickAddArticle`, `ArticleImageThumb`, the Stock page (it only ever
assigned physical locations to individual Articles — no data source left once Articles
were dropped). The broker no longer tracks individual articles anywhere; "how many
articles" is just a manual number on the Panier and on each Colis.

**Untouched**: Catalog / CatalogManager / Product (the public product catalog — unrelated
to the old Article model despite the similar name), Auth/security.

## 3. Deliberate tradeoffs / things to know

- `BuyerAccount.password` is stored as **plain text**. This is a single-admin local tool
  already gated by JWT auth; adding app-level encryption wasn't worth the complexity for
  the stated need ("remember the Shein login so I don't waste time"). Worth revisiting if
  this app is ever exposed beyond one trusted local admin.
- `Colis.trackingNumber` has a `unique + sparse` index so multiple colis can sit with no
  tracking number yet without colliding. If you ever see an `E11000 duplicate key ...
  trackingNumber: null` error, it means an old non-sparse index survived a schema change —
  fix is `db.colis.dropIndex('trackingNumber_1')` then restart the server so Mongoose
  recreates it correctly. (Changing a Mongoose schema does not retroactively fix an index
  that already exists in the database — only affects fresh environments.) Hit this again in
  Session 6 against the same local `db_data/` and fixed it the same way — this local dev
  database predates the sparse index ever being correct, so it'll keep surfacing on this
  machine specifically until `db_data/` is recreated fresh.
- `ClientPanier.panier` and `.colis` are both optional by design — a client's order can be
  unattached (not yet batched), attached to exactly one global Panier, and/or tied to the
  specific Colis it shipped in. A global Panier itself no longer references any client
  directly; see the ClientPanier section above.

## 4. Running this locally

- **MongoDB**: the Windows "MongoDB" service on this machine is a stale, unrelated install
  (different `dbPath` under `Program Files`, crashed 2026-07-06) — **not** what this
  project uses. Start the real one manually (no admin rights needed):
  `"C:\Program Files\MongoDB\Server\8.0\bin\mongod.exe" --dbpath "<project>\db_data" --port 27017 --bind_ip 127.0.0.1`
- **Admin login**: `admin@mallaforsa.tn` / `Malla@2025!` (seeded via
  `node server/seed/seedAdmin.js`, safe to re-run — it no-ops if the account exists).
- **Dev server**: `npm run dev` from the project root (runs client on `:5173`, server on
  `:5000` via `concurrently`). The Vite dev server proxies both `/api` and `/uploads` to
  the backend — if uploaded images ever show as broken again, check
  `client/vite.config.js`'s proxy config first.

## 5. Session Log (most recent first)

### 2026-07-17 — Session 6
- User feedback: the client's panier and the global (shared-batch) panier were conflated —
  `OrderSession.client` meant a Panier could only ever belong to one client, with no way to
  represent a batch mixing several clients while still tracking each client's own
  articles/pricing/payments. Also asked to fix the Client management UX.
- Split them: added a new `ClientPanier` model/controller/routes (`/api/client-paniers`)
  that owns everything client-specific (articles, pricing, payment history/status) with
  optional refs to a global `Panier` and/or `Colis`. Stripped `client` and all payment
  fields off `OrderSession` — it's now purely the shared-batch record (name, screenshots,
  compteAcheteur, totalPrice, nombreColis/nombreArticles). `nombreClients` (a manual,
  non-relational count) is gone too — client counts/lists are now computed for real from
  `ClientPanier` in `orderSessionController`.
- Migrated existing data with a one-off script (`server/scripts/migrate-client-panier.js`,
  safe to keep for reference, not meant to be re-run): every `OrderSession` that had a
  `client` became a `ClientPanier` carrying over its pricing/paymentHistory, then had those
  fields unset from the OrderSession. Ran it against the local dev DB (2 clients, 5
  sessions/payments) — verified the exact totals (due/paid per client) matched before and
  after via a direct DB query.
- Clients.jsx: "carts" (OrderSession-based) replaced with `ClientPanier` CRUD — a
  "Nouvelle Commande" button now creates a client's order **inline on the client page**
  (previously required navigating to `/paniers`, which no longer even makes sense since
  Paniers aren't client-owned anymore), with a dropdown to attach/detach it to/from a global
  Panier. Also added a client search box. Paniers.jsx: dropped the single-client field and
  manual "nombre de clients" input from panier creation; the panier detail view now shows a
  real "Clients rattachés" list (from ClientPanier) with a one-click attach action. Updated
  Dashboard's "Paniers Récents" card to show real attached client names instead of the old
  single `panier.client`.
- Verified end-to-end two ways: (1) a full API-level smoke test — create client → create
  ClientPanier attached to a panier → second client attached to the *same* panier (proving
  the mixed-batch case) → payments → `getClients`/`getOrderSessionById` aggregation
  correctness → attach/detach/delete-panier detach behavior, all passed, then cleaned up by
  exact ID; (2) drove the actual UI with Playwright against the dev server (no
  `chromium-cli`/no project run-skill existed yet, so installed the `playwright` npm
  package and pointed it at an already-cached Chromium under `ms-playwright/` to avoid a
  fresh browser download) — screenshotted the full "create client → new commande → payment"
  flow on `/clients` and the "create panier → attach client" flow on `/paniers`, zero
  console errors, then deleted the browser-created test records from the DB. Real seeded
  data (the original 2 clients / 5 ClientPaniers / 5 Paniers / 3 Colis) confirmed untouched
  throughout.
- Re-hit the documented stale `colis.trackingNumber` non-sparse-index bug (section 3) while
  running the smoke test against this machine's `db_data/` — fixed the same way as before
  (drop index, restart server).
- **Next:** nothing outstanding. If a "run this app" project skill gets generated later, it
  should note the Playwright + cached-Chromium approach above since no `chromium-cli` was
  available in this environment.

### 2026-07-09 — Session 5
- Uploaded screenshots were displaying as broken/invalid images. Root cause:
  `client/vite.config.js` only proxied `/api` to the backend — `/uploads` (where multer
  serves the files) was unproxied, so `<img src="/uploads/...">` hit Vite's SPA fallback
  instead of the backend. Fixed by adding an `/uploads` proxy entry. Verified via curl that
  `:5173/uploads/<file>` now returns `200 image/jpeg`. Required a dev-server restart
  (Vite config isn't hot-reloaded).
- Cleaned up this file: removed stale sections that still described the pre-Articles-drop
  world (old plan said Colis packing "stays as-is", old assumptions said everything was
  "additive to Article/ArticleColis" — both false after Session 4). Consolidated into a
  single "current state" description instead of a plan-vs-implementation split, since the
  plan is now just how the app works.
- **Next:** nothing outstanding.

### 2026-07-09 — Session 4
- Scope change: dropped Articles entirely (model, controller, routes, page, Stock page,
  QuickAddArticle, ArticleImageThumb). Colis and Panier now use manual `nombreArticles`
  counts instead. Reworked Clients around payment (aggregate summary card + list badges,
  panier creation moved to `/paniers`). Rebuilt Dashboard around business stats. Added
  `password` to `BuyerAccount` for the Emails page.
- Verified via `require()` checks, `vite build`, and a full live smoke test through the API
  (client with nombreArticles/compteAcheteur → client-owned panier with payment fields →
  auto-colis → payment recorded → `getClients` aggregation confirmed correct: totalDue
  320, totalPaid 100, totalReste 220 after a partial payment). All test data cleaned up by
  exact ID afterward — confirmed real data already created live in the browser (a panier
  with 7 screenshots, a transporteur, a location, a payment) was untouched.

### 2026-07-09 — Session 3
- User reported terminal errors when running the app; traced to two real bugs:
  1. **MongoDB not running** — see section 4 for the fix (the Windows service is stale and
     unrelated; start mongod manually against the project's own `db_data/`).
  2. **Stale non-sparse unique index on `colis.trackingNumber`** — see section 3 for the
     explanation and fix. Only bit us because of pre-existing local dev indexes; a fresh
     environment creates the index correctly from scratch.
- Seeded the admin login (none existed) to be able to test through the actual API.
- Ran the full live smoke test end-to-end successfully, cleaned up all test data after.

### 2026-07-09 — Session 2
- Implemented the original Panier/Colis/Credentials rework end to end: new `Location` and
  `Transporteur` models/CRUD, `Client`/`OrderSession`/`Colis` schema changes, new `Paniers`
  and `Credentials` pages, nav/routes wiring.
- Verified everything short of live DB access — build clean, routes mount correctly.

### 2026-07-09 — Session 1
- Explored the existing codebase to confirm nothing in the plan was implemented yet and to
  understand how the new work would fit alongside the (then still present) Article/
  ArticleColis packing flow.
- Wrote this progress file.
