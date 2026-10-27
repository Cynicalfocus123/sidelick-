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

## Log

- 2026-10-27 Step 1 (B20): scaffolded both apps, PostgreSQL 18.6 installed portable on D:, database `sidelick` created, health endpoint, start page with empty logo slot, Playwright at 4 sizes, wireframes, live/ sync script.
- 2026-10-27 GitHub remote added (origin -> Cynicalfocus123/sidelick-), all commits pushed. `.env` files and the Excel are git-ignored, so they never go to GitHub.
- 2026-10-27 Added wireframe overview pictures (`wireframes/sheets/`, script `wireframe-sheets.mjs`, runs after `wireframes:shots`). Phone bottom bar now shows at the bottom of full-page screenshots.
- 2026-10-27 Wireframes colour-coded with name tags (`data-zone` + `z-*` classes in `wireframes/wf.css`); register form padded on phone.
- 2026-10-27 Home wireframe rebuilt as Side Licks layout v2 (dock, live rings, post grid, in-feed suggestions, first-login 'build your feed' screen).
