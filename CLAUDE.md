# Side Licks - CLAUDE.md

## HARD RULES (mandatory, no excuses)

1. Everything inside `D:\mstar companies\sidelick\side lick new site` only. No extra folders.
2. Update git AND copy the same change to `live/` in the same step (`npm run live:sync` after commit). `live/` is what goes to the real server. Every change is committed AND pushed to GitHub https://github.com/Cynicalfocus123/sidelick- (`git push`, branch `main`) every time. (owner, 2026-10-27)
3. Short, to-the-point replies.
4. Test a few times only. Pass = done. If it keeps failing, stop and explain the error clearly.
5. Always optimized. Use FFmpeg for every video / GIF / image (MP4 + WebM, AVIF / WebP, right sizes, metadata stripped).
6. Wireframe first, owner's approval before any design is built. Every time a wireframe or screen is made or changed, SEND the owner the pictures in chat (overview images in `wireframes/sheets/`). The owner can not see files on disk - no pictures = not shown. Wireframes are COLOUR-CODED: each part of the page has its own colour + name tag (colours are for the wireframe only, not the site). (owner, 2026-10-27)
7. Every screen size: desktop, laptop, tablet, phone. Images, layout, text and positions scale correctly.
8. Update CLAUDE.md, design.md, code.md every task. Not updated = not done.
9. Update the Excel task list every task (Not started -> Pending -> Done only when work really happens).
10. No reminders needed.
11. Never delete anything (file, folder, DB data, git history) without asking the owner first and getting a yes for that exact deletion. Everything else: do not ask permission, just do it. (owner, 2026-10-27)
12. NO logo anywhere on the site until the owner sends it (task F5): no image, no placeholder logo, no made-up logo, no default framework icons. Keep the empty logo space (`LogoSlot`).
13. After the owner approves a wireframe, START CODING the real clickable screens right away (frontend + backend). Do not ask "should I build it?". (owner, 2026-10-28)

Done checklist for every task: works on localhost / tested a few times, passed / desktop + laptop + tablet + phone checked / .md files updated / Excel updated / git committed + pushed to GitHub / live/ matches git (`npm run live:check`).

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

- 2026-10-27 Step 1 (B20 + F6 wireframes): project set up, start page + `/api/health` working, wireframes for register / verify email / home made at 4 sizes - **wireframes APPROVED by owner 2026-10-28** (register, verify email, home; with continuous scroll on Discover). F5 (logo) waits for owner. Git remote `origin` = GitHub repo above; Excel task list now v81. First approval message was withdrawn by the owner (no pictures had been shown); colour-coded pictures sent 2026-10-27. Home redesigned (layout v2: live rings, post grid, suggestions inside the feed; then v3: owner wants the menu ALWAYS on the left on every device, no bottom bar). Discover (2026-10-28) = one-line video row -> "Creators you may like" row -> new video row with different creators -> ... (owner). Feed algorithm changed by owner: Discover tab opens first on every login (videos, tap name = profile), Subscribed tab next to it (only followed / subscribed creators); first-login screen replaced by this. Branded mockups wait for the logo (F5).
- 2026-10-28 **Step 1A DONE: home page built** at http://localhost:3000/home (sample data; real feed API = B110, accounts = B25). Tested 3 runs x 4 sizes. Next: review with the owner which steps come next (owner asked for this), then build register / verify email.
- 2026-10-28 **Step 1B (owner: register + login before "check your email")**: register BUILT (real page + API + database + Check your email popup + toasts). Login wireframe **approved 2026-10-28** and login BUILT (page + `POST /api/auth/login` + "Send it again"); unverified emails can not log in until verified. Sign up button added under Log in (owner); login wireframe approved again with it. After sign-up "Become a creator" steps wireframe (F117, 6 steps from the Excel) made, redone as one centred column, **approved and BUILT** at /onboarding (owner 2026-10-28). Excel v77. Emails only go to the `email_outbox` table until an email service is chosen (E1).

- 2026-10-28 **Main page `/` (signed out, www.sidelicks.com)** wireframe made (F121), v2 = full-width video header with the menu on top, v3 = all sections full width too (owner), **waiting for owner approval**. /home = signed-in only (owner).

## Working notes for Claude

- Diff: after every code change, open the diff pane so the owner sees the code (owner, 2026-10-27).
- Wireframe pictures (owner 2026-10-28): send ONE set only - desktop, tablet, phone side by side (main state) - so the owner can say yes / no fast. No 4-size x every-state sheets in chat.
- Ports (owner 2026-10-28): open localhost ports / previews ONLY when real coding of a screen has started; never for wireframes (send pictures instead). Close them when done.
- Servers: do not leave dev servers running. Tests start and stop their own servers (Playwright `webServer`). Give the owner localhost links and the start commands; the owner starts them.
- Read `frontend/AGENTS.md` before writing Next.js code (Next 16 has breaking changes; docs in `frontend/node_modules/next/dist/docs/`).
- Temp files / screenshots before conversion: `D:\dev\tmp` (never C:).
- Tools on D:: FFmpeg `D:\dev\tools\ffmpeg\bin\ffmpeg.exe`, Playwright browsers `D:\dev\playwright` (set `PLAYWRIGHT_BROWSERS_PATH=D:/dev/playwright`), npm cache `D:\dev\npm-cache`.
- Excel has embedded screenshots: never save it with openpyxl (drops images). Edit it through Excel itself (PowerShell COM: copy to the next vN, open, change, save) - that keeps the images.
