# Side Licks - CLAUDE.md

## HARD RULES (mandatory, no excuses)

1. Everything inside `D:\mstar companies\sidelick\side lick new site` only. No extra folders.
2. Update git AND copy the same change to `live/` in the same step (`npm run live:sync` after commit). `live/` is what goes to the real server.
3. Short, to-the-point replies.
4. Test a few times only. Pass = done. If it keeps failing, stop and explain the error clearly.
5. Always optimized. Use FFmpeg for every video / GIF / image (MP4 + WebM, AVIF / WebP, right sizes, metadata stripped).
6. Wireframe first, owner's approval before any design is built.
7. Every screen size: desktop, laptop, tablet, phone. Images, layout, text and positions scale correctly.
8. Update CLAUDE.md, design.md, code.md every task. Not updated = not done.
9. Update the Excel task list every task (Not started -> Pending -> Done only when work really happens).
10. No reminders needed.
11. Never delete anything (file, folder, DB data, git history) without asking the owner first and getting a yes for that exact deletion. Everything else: do not ask permission, just do it. (owner, 2026-10-27)
12. NO logo anywhere on the site until the owner sends it (task F5): no image, no placeholder logo, no made-up logo, no default framework icons. Keep the empty logo space (`LogoSlot`).

Done checklist for every task: works on localhost / tested a few times, passed / desktop + laptop + tablet + phone checked / .md files updated / Excel updated / git updated / live/ matches git (`npm run live:check`).

## Project

Fan / creator subscription site (Fansly / Fanvue style). Task list: `Side Licks task list <date> v<N>.xlsx` in this folder (newest version = highest vN; old versions are kept).

- `frontend/` Next.js 16 (App Router, TypeScript, Tailwind 4) - http://localhost:3000
- `backend/` NestJS 12 (TypeScript, Vitest) - http://localhost:4000/api
- PostgreSQL 18 on this PC (portable, no service): binaries `D:\dev\tools\pgsql18`, data `D:\dev\data\pgsql18`, database `sidelick`, port 5432, localhost only
- `wireframes/` grey-box wireframes + screenshots (`wireframes/index.html`)
- `live/` deploy copy of git HEAD (git-ignored, made by `scripts/sync-live.mjs`)
- No Docker, no Redis. Everything runs on localhost.

Details: `code.md` (how to run, structure, tests), `design.md` (screens, sizes, colours, wireframe status).

## Status (update every task)

- 2026-10-27 Step 1 (B20 + F6 wireframes): project set up, start page + `/api/health` working, wireframes for register / verify email / home made at 4 sizes - **waiting for owner approval**. F5 (logo) waits for owner.

## Working notes for Claude

- Servers: do not leave dev servers running. Tests start and stop their own servers (Playwright `webServer`). Give the owner localhost links and the start commands; the owner starts them.
- Read `frontend/AGENTS.md` before writing Next.js code (Next 16 has breaking changes; docs in `frontend/node_modules/next/dist/docs/`).
- Temp files / screenshots before conversion: `D:\dev\tmp` (never C:).
- Tools on D:: FFmpeg `D:\dev\tools\ffmpeg\bin\ffmpeg.exe`, Playwright browsers `D:\dev\playwright` (set `PLAYWRIGHT_BROWSERS_PATH=D:/dev/playwright`), npm cache `D:\dev\npm-cache`.
- Excel has embedded screenshots: never save it with openpyxl (drops images). Edit the sheet XML inside the .xlsx and save as the next vN.
