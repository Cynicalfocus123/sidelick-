# Side Licks - code.md

## Stack

- Frontend: Next.js 16.4 (App Router, React 19, TypeScript, Tailwind CSS 4, ESLint) in `frontend/`
- Backend: NestJS 12 (TypeScript, ESM, Vitest, oxlint) in `backend/`, global prefix `/api`
- Database: PostgreSQL 18.6, driver `pg` (shared pool in `backend/src/database/`). ORM / migrations tool: decide with the first real tables (B25 sign-up).
- Node 24, npm 11. No Docker, no Redis.

## Folders

```
side lick new site/
  CLAUDE.md  design.md  code.md       rules + docs (update every task)
  package.json                         root helper scripts (no dependencies)
  scripts/db.mjs                       start / stop / status PostgreSQL
  scripts/sync-live.mjs                copy git HEAD -> live/ (never deletes)
  frontend/                            Next.js app
    src/app/                           pages: / (setup check), /home (Step 1A), /register (Step 1B), /c/[handle] (profile stub)
    src/components/                    LogoSlot (empty logo space), ApiStatus
    src/components/auth/RegisterForm.tsx  register form + Check your email popup
    src/components/Toaster.tsx         toast messages (F7), mounted in the root layout
    src/lib/api.ts, src/lib/toast.ts   API calls (cookie included), toast()
    src/components/home/               home page: HomeView, SideMenu, DiscoverFeed, Rows, SubscribedFeed, Icon, parts
    src/lib/sample-data.ts             SAMPLE creators / videos / posts (fixed seed) until the real API exists
    src/lib/discover.ts                Discover feed rules (section below) - runs in the browser for now
    e2e/                               Playwright tests (4 screen sizes): start-page, home; screenshots.spec.ts (SHOTS=1 only)
    scripts/wireframe-shots.mjs        wireframe screenshots -> WebP (wireframes/shots/)
    scripts/wireframe-sheets.mjs       one overview picture per screen (wireframes/sheets/)
  backend/                             NestJS app
    src/main.ts, src/env.ts            boot, loads backend/.env
    src/database/                      DatabaseModule + DatabaseService (pg pool)
    src/app.controller.ts              GET /api/health
    src/auth/                          sign-up, session cookie, /me, resend, change email, logout (argon2id)
    src/mail/mail.service.ts           emails -> email_outbox table (no real sending yet)
    src/database/migrations.ts         database tables (applied on startup)
    test/                              e2e tests against the real database
  wireframes/                          grey-box wireframes + shots/ (WebP)
  live/                                deploy copy (git-ignored)
  Side Licks task list ... vN.xlsx     task list (git-ignored)
```

## Settings (.env, never in git)

- `backend/.env` (copy from `backend/.env.example`): PORT=4000, CORS_ORIGIN, DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME=sidelick
- `frontend/.env.local` (copy from `frontend/.env.example`): NEXT_PUBLIC_API_URL=http://localhost:4000/api

## Run on localhost (owner starts these)

- Preview in the Claude app: `.claude/launch.json` -> "sidelick-frontend" (`npm --prefix frontend run start`, port 3000; needs `npm --prefix frontend run build` first) and "sidelick-backend" (`node dist/main.js` in backend/, port 4000; needs the DB running + `npm --prefix backend run build`).

From the project folder:

```
npm run db:start          # PostgreSQL on localhost:5432
npm run dev:backend       # API  http://localhost:4000/api/health
npm run dev:frontend      # site http://localhost:3000
npm run db:stop           # when finished
```

## Tests

- Backend unit: `npm --prefix backend test` (Vitest, mocked DB)
- Backend e2e: `npm --prefix backend run test:e2e` (real PostgreSQL, DB must be running)
- Site e2e: `npm --prefix backend run build`, `npm --prefix frontend run build`, then `npm --prefix frontend run test:e2e` with `PLAYWRIGHT_BROWSERS_PATH=D:/dev/playwright`. Runs at desktop / laptop / tablet / phone; starts + stops its own servers; DB must be running.
- Lint: `npm --prefix frontend run lint`, `npm --prefix backend run lint`
- Playwright runs with 2 workers (more made the first page loads time out on this PC).
- Start the DB with output to a file (`node scripts/db.mjs start > D:/dev/tmp/sidelick-db.log 2>&1`). Piping it (`| tail`) keeps the command waiting forever because postgres holds the pipe; killing that command crashed postgres once (2026-10-28).
- Real-page pictures for the owner: `SHOTS=1 npx playwright test e2e/screenshots.spec.ts` -> D:/dev/tmp/sidelick-real-shots, then FFmpeg -> WebP.

## Git + live/

1. Commit in git, then `git push` (remote `origin` = https://github.com/Cynicalfocus123/sidelick-, branch `main`). Every change, every time.
2. `npm run live:sync` - copies committed files to `live/` byte for byte. Files in live/ that left git are listed, never deleted (hard rule 11).
3. `npm run live:check` - must say "live/ matches git HEAD".

`live/` has source only (no node_modules / builds); the real server runs `npm ci` + build.

## API

| Method | Path | Returns |
|---|---|---|
| GET | /api/health | `{ status: 'ok'|'error', database: 'up'|'down', databaseName, time }` - runs a real query |
| POST | /api/auth/register | body `{ email, password, isAdult, acceptTerms }` -> 201 `{ id, email, emailVerified:false }` + httpOnly cookie `sl_session` (30 days). 400 `{ message, fields: { email?, password?, terms? } }`, 409 email taken. Saves email (trim + lower case), argon2id hash, 18+, terms time + `TERMS_VERSION`; queues the verify email |
| GET | /api/auth/me | 200 `{ id, email, emailVerified }` or 401 |
| POST | /api/auth/resend-verification | 200 `{ sentTo }`; 429 if < 60 s since the last link or 5 already this hour; 400 if verified |
| PATCH | /api/auth/email | body `{ email }` - change email before verifying; cancels old links, sends a new one; 409 if taken |
| POST | /api/auth/logout | 204, deletes the session |

**Database** (`backend/src/database/migrations.ts`, applied on startup by `MigrationService` behind an advisory lock; never edit an applied one, add a new id): `users`, `sessions` (sha256 of the cookie token), `email_tokens` (sha256 of link tokens, purpose `verify`, 24 h), `email_outbox` (every email; NOTHING is sent until an email service is chosen - E1 - it is only stored + printed in the server log), `schema_migrations`.
**Emails while testing**: read the link from the server log or `SELECT to_email, subject, link FROM email_outbox ORDER BY id DESC LIMIT 5;`.
Test accounts made by the tests use `@example.com` addresses and stay in the local database.

## Discover feed algorithm (B110 + F118, owner 2026-10-28 - rules built in the browser on sample data in Step 1A, `frontend/src/lib/discover.ts`; backend API not built yet)

Goal: Discover never ends, rows never look cut off, and the fan is not worn out by the same creator or video. Numbers below are starting values (tune after launch).

**What counts as "seen"**: a video is seen when at least 50% of it is on screen for 1 second (impression). Saved in `feed_seen (user_id, video_id, creator_id, seen_at)`, kept 30 days. Logged-out visitors: same list kept in the browser for the session.

**Candidate pool** (per request): videos the creator allowed on Discover (B44), not seen by this fan in the last 30 days, not from creators the fan blocked / muted / reported, and not from creators the fan already subscribes to (those are on the Subscribed tab).

**Score per video** = freshness x quality x interest + new-creator boost + small random jitter
- freshness: newer is higher (halves every 3 days)
- quality: watch-through rate, likes per view, follows per view - smoothed so a new video with few views is not punished
- interest: matches tags / creators the fan watched to the end, liked, tipped or followed
- new-creator boost: creators younger than 14 days or with a small audience get a lift, so new people get seen
- jitter: a little randomness so two refreshes never look the same

**Building one page** (one page = 1 video row of 12 + 1 creators row of 8; the cursor carries the session's shown-creator list):
1. Video row: 7 best-scored + 3 new-creator picks + 2 random picks from the pool, then shuffled lightly (best ones still near the left).
2. Same creator rules: max 1 video per creator in a row; a creator in a video row cannot appear again in the next 3 rows; max 3 Discover videos per creator per fan per 24 h.
3. Creators row: 8 creators not shown in any video row of this page, not followed by the fan, not shown in a creators row in the last 7 days (unless the fan tapped them). Each card shows 3 of that creator's posts.
4. Promoted creators (B106): at most 1 slot per row, labelled "Promoted", same repeat rules.
5. A video is NEVER shown twice in one session.
6. Scrolling a row sideways asks for 12 more for that row with the same rules (new creators only).

**When the pool runs low** (so the scroll is still continuous), loosen the rules in this order: allow videos seen more than 7 days ago (oldest first) -> allow a creator again after 2 rows instead of 3 -> allow subscribed creators' Discover videos. Rule 5 is never loosened. Only if all of that is empty: "You're all caught up" + a link to the Subscribed tab.

**No cut-off rows on screen** (front end): ask for the next page when the fan is 1.5 screens from the bottom; while it loads, the empty spots in the last row show grey placeholder tiles (same size as a video) so the row is always full; real videos swap in when they arrive. Back-to-top button after 2 screens of scrolling.

**API (planned)**: `GET /api/feed/discover?cursor=` -> `{ blocks: [{ type: "videos", items: [...] }, { type: "creators", items: [...] }], nextCursor }`; `GET /api/feed/discover/row/:rowId?cursor=` for sideways loading; `POST /api/feed/seen` (batched impressions).

## Log

- 2026-10-27 Step 1 (B20): scaffolded both apps, PostgreSQL 18.6 installed portable on D:, database `sidelick` created, health endpoint, start page with empty logo slot, Playwright at 4 sizes, wireframes, live/ sync script.
- 2026-10-27 GitHub remote added (origin -> Cynicalfocus123/sidelick-), all commits pushed. `.env` files and the Excel are git-ignored, so they never go to GitHub.
- 2026-10-27 Added wireframe overview pictures (`wireframes/sheets/`, script `wireframe-sheets.mjs`, runs after `wireframes:shots`). Phone bottom bar now shows at the bottom of full-page screenshots.
- 2026-10-27 Wireframes colour-coded with name tags (`data-zone` + `z-*` classes in `wireframes/wf.css`); register form padded on phone.
- 2026-10-27 Home wireframe rebuilt as Side Licks layout v2 (dock, live rings, post grid, in-feed suggestions, first-login 'build your feed' screen).
- 2026-10-27 Home tabs changed to Discover (default, every login) + Subscribed; wireframe states now discover / subscribed / subscribed-empty. Old home-feed-* / home-empty-* shots left in wireframes/shots (not deleted, rule 11).
- 2026-10-27 Home wireframe layout v3: bottom dock removed, left menu on every size (phone icon rail, tablet rail with words, laptop/desktop sidebar).
- 2026-10-27 Discover wireframe: grid rows replaced by one scrolling column + mixed-in "Creator you may like" cards.
- 2026-10-28 Discover wireframe: one-line sideways video rows alternating with "Creators you may like" rows (each new video row = different creators).
- 2026-10-28 Wireframes approved by owner. Discover: continuous scroll (next rows load by themselves, loader + back-to-top button).
- 2026-10-28 Discover feed algorithm written (section above): seen list, scoring, creator repeat limits, fallback, no cut-off rows.
- 2026-10-28 Home: Live now shows 5 rings at a time (owner), arrows page by 5 and grey out at the ends; test added (home.spec.ts), 36/36 passed x2.
- 2026-10-28 STEP 1B (part 1): login wireframe made (waiting). Register built for real: /register page + Check your email popup + toasts (F7), backend sign-up / me / resend / change email / logout, migrations, email outbox. argon2 added (backend). Tests: backend e2e 8/8 against the real DB (values checked), Playwright 32/32 at 4 sizes, 2 runs.
- 2026-10-28 STEP 1A: home page built at /home (Next.js, client components): left menu (rail / sidebar), Discover / Subscribed tabs, live rings, Discover video rows + creators rows with continuous scroll (loads 1.5 screens early, placeholder row while loading, sideways loading per row), Subscribed post grid + empty state, follow (sample, saved in the browser), back-to-top, "comes in a later step" notice for menu items not built yet, /c/[handle] profile stub. Sample data only. Playwright home.spec.ts: 4 tests x 4 sizes, passed 3 runs (20/20 with start page).
