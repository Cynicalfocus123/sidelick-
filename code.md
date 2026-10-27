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
    src/app/                           pages (layout.tsx, page.tsx, globals.css)
    src/components/                    LogoSlot (empty logo space), ApiStatus
    e2e/                               Playwright tests (4 screen sizes)
    scripts/wireframe-shots.mjs        wireframe screenshots -> WebP (wireframes/shots/)
    scripts/wireframe-sheets.mjs       one overview picture per screen (wireframes/sheets/)
  backend/                             NestJS app
    src/main.ts, src/env.ts            boot, loads backend/.env
    src/database/                      DatabaseModule + DatabaseService (pg pool)
    src/app.controller.ts              GET /api/health
    test/                              e2e tests against the real database
  wireframes/                          grey-box wireframes + shots/ (WebP)
  live/                                deploy copy (git-ignored)
  Side Licks task list ... vN.xlsx     task list (git-ignored)
```

## Settings (.env, never in git)

- `backend/.env` (copy from `backend/.env.example`): PORT=4000, CORS_ORIGIN, DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME=sidelick
- `frontend/.env.local` (copy from `frontend/.env.example`): NEXT_PUBLIC_API_URL=http://localhost:4000/api

## Run on localhost (owner starts these)

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

## Git + live/

1. Commit in git, then `git push` (remote `origin` = https://github.com/Cynicalfocus123/sidelick-, branch `main`). Every change, every time.
2. `npm run live:sync` - copies committed files to `live/` byte for byte. Files in live/ that left git are listed, never deleted (hard rule 11).
3. `npm run live:check` - must say "live/ matches git HEAD".

`live/` has source only (no node_modules / builds); the real server runs `npm ci` + build.

## API

| Method | Path | Returns |
|---|---|---|
| GET | /api/health | `{ status: 'ok'|'error', database: 'up'|'down', databaseName, time }` - runs a real query |

## Discover feed algorithm (B110 + F118, owner 2026-10-28 - not built yet)

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
