# Side Licks - design.md

## Status

| Screen | Wireframe | Owner approval | Built |
|---|---|---|---|
| Register (F10) + "Check your email" popup (F8) | `wireframes/register.html` | **approved 2026-10-28** | **yes - Step 1B, /register (real API + DB)** |
| Log in /login (F11): form, wrong password, email not verified | `wireframes/login.html` | **approved 2026-10-28** | **yes - Step 1B, /login (real API + DB)** |
| After sign-up: Become a creator, 6 steps (F117) | `wireframes/onboarding.html` | **approved 2026-10-28** (v2 centred) | **yes - /onboarding (real API + DB)** |
| Verify email /verify-email (F12), 5 states | `wireframes/verify-email.html` | **approved 2026-10-28** | no |
| Home /home layout v3: left menu + Discover tab (opens first) + Subscribed tab | `wireframes/home.html` | **approved 2026-10-28** (+ continuous scroll) | **yes - Step 1A, /home (sample data)** |
| Start page `/` (setup check only, not a real screen) | - | - | yes |

Rule: no screen is built until its wireframe is approved (hard rule 6). Screenshots of every state at every size: `wireframes/shots/` + `wireframes/index.html`; one overview picture per screen (all states x 4 sizes): `wireframes/sheets/<screen>.webp`. All made by `npm --prefix frontend run wireframes:shots` (WebP via FFmpeg). The sheets are what gets sent to the owner in chat every time.

Wireframe colour code (wireframe only - NOT the site colours): top bar blue, left menu purple, Discover / Subscribed tabs sky blue, Discover videos indigo (creator name chip pink dashed), "Creators you may like" rows pink, post green, locked post orange, promoted post yellow, suggested creators pink, live streams teal, Refer & Earn amber, info panel teal, forms blue outline, popups amber outline, message area green outline, logo space red dashed (empty on the real site), buttons dark blue. Colours + tags live in `wireframes/wf.css` (`data-zone` + `z-*` classes).

## Logo

NO logo on the site until the owner sends it (F5). The header keeps an EMPTY space (`frontend/src/components/LogoSlot.tsx`, 112-144 px wide x 32-40 px high, grows with screen size). Wireframes draw a dashed box there only to show where it goes. Default Next.js / Vercel icons and favicon were moved out of the project (to `D:\dev\tmp\sidelick-held`, not deleted).

## Screen sizes (hard rule 7)

| Name | Width | Test viewport |
|---|---|---|
| phone | < 640 px | 390 x 844 |
| tablet | 640 - 1023 px | 768 x 1024 |
| laptop | 1024 - 1439 px | 1366 x 768 |
| desktop | 1440 px + | 1920 x 1080 |

Tailwind: `sm` = 640 (tablet), `lg` = 1024 (laptop), add `desktop` = 1440 when first needed. No sideways scrolling at any size (checked in tests).

## Colours (neutral placeholder until brand colours arrive with F5)

Defined once in `frontend/src/app/globals.css` as CSS variables + Tailwind colours:

| Token | Value | Use |
|---|---|---|
| `bg` | #f7f7f8 | page background |
| `surface` | #ffffff | cards, top bar |
| `border` | #d9d9de | lines |
| `text` | #1d1d22 | main text |
| `muted` | #6b6b75 | secondary text |
| `accent` | #3f3f46 | buttons (dark grey) |
| `ok` / `bad` | #2f7d4f / #b3261e | status only |

Font: Geist (next/font, self-hosted at build). Change brand colours in one place only (globals.css).

## Wireframe layouts (approved by owner 2026-10-28)

**Register** - phone: full-width form. Tablet: centred white card. Laptop / desktop: grey info panel on the left (short lines about Side Licks; picture / colours after F5) + form card on the right. Form: title "Create your account", Continue with Google, "or", Email, Password (Show, "At least 8 characters"), "I am 18 or older" tick, Terms + Privacy tick, Create account (grey until all filled), "Have an account? Sign in" top right. After sign-up: "Check your email" popup (bottom sheet on phone, centred box on tablet+) with Send again + Change email + X.

**Log in** (approved + built 2026-10-28) - same frame as Register (info panel on laptop+, centred card on tablet, plain form on phone). "Welcome back", Continue with Google, or, Email, Password + Show, "Keep me logged in" tick, "Forgot password?" link, Log in button (grey until both filled), outlined "New to Side Licks? Sign up" button right under it (owner 2026-10-28, like Fanvue) -> Register, "New here? Create account" top right. States: wrong email or password = red box above the form; email not verified yet = yellow box "Please verify your email first" + "Send it again". After log in -> Home (Discover first). Email not verified = no log-in yet (verify first); "Send it again" sends a new link (same 1-minute / 5-an-hour limits). "Keep me logged in" ticked = 30 days, not ticked = until the browser closes (server: 1 day). "Forgot password?" = toast "comes in a later step" (F13). Real pictures: `wireframes/real/login-*.webp`.

**After sign-up: Become a creator** (F117, approved + built 2026-10-28 at /onboarding) - shown to every new user right after sign-up, before Home (owner). Full screen, soft glow at the top, empty logo space centred. 6 steps from the Excel (S104-S109): coins "Top creators earn over $X per month", globe "One platform. Built to make creators money", coins "Keep X% for N days after you verify. Then Y%", bar chart "Analytics built to grow your income", pie chart "Refer a creator. Earn X% of their income", tick "Verified fast. Earning faster". Layout v2 (owner 2026-10-28: v1 side-by-side "looked edgy and bleeding out"): ONE centred column on every size (max 420 / 480 / 520 / 560 px phone / tablet / laptop / desktop) - logo space, 3D picture, headline UNDER the picture, arrows at the column edges with dots between (active dot = short bar), terms line, buttons. Arrows (back hidden on step 1, next hidden on step 6), swipe, auto-move until touched; terms line; "Start earning" (creator application F35 - for now a toast "comes in a later step" -> Home) and "Close" (-> Home). Shown once: after the Check your email popup (X or Send again) and on the first log-in if never seen; "Become a Creator" in the menu opens it any time. Numbers only show once the admin sets them; until then the step uses the same idea without a number (e.g. "Top creators earn real money every month"). Pictures = simple line icons on a soft tile until the 3D artwork (after F5).

**Live now row** (owner 2026-10-28): exactly 5 rings in view on every size (each 1/5 of the row, ring 50 / 68 / 80 / 92 px phone / tablet / laptop / desktop), first name + "N watching" (phone: eye icon + N), arrows / swipe move a full 5, left arrow grey at the start, right arrow grey at the end.

**Toasts** (F7, built 2026-10-28) - dark rounded box at the top centre, round icon (green tick / red ! / blue i) + short text, slides in, gone after 3 s, several stack; phones full width with side margins.

**Verify email** - white page, soft glow top-right (brand colour after F5), logo space centred at top, big "Email Verification". States: Checking (spinner, "Verifying your request..."), Verified (+ Continue, auto to /home in 2-3 s with toast), Expired signed in (Send a new link), Expired signed out (Sign in), Other device signed out (verified + Sign in to continue).

**Home - Side Licks layout v3 (2026-10-27, owner: "menu always on the left side on every device, the bottom bar is not good")** - LEFT MENU on every size, sticky full height: phone = slim 60px icon rail (icons only), tablet = 88px rail with icons + small words, laptop = 232px / desktop = 264px sidebar with icons + words. Menu items: Home, Search, Messages (badge), Notifications (badge), big purple + Create button (creators post / go live; fans: Become a Creator), Subscriptions, Wallet; laptop + desktop also show Following, My Collection, Become a Creator, Promotions, Refer & Earn, Settings and a profile card at the bottom; phone + tablet put those under "More" at the bottom of the rail. Logo space: top of the sidebar on laptop + desktop, in the top bar on phone + tablet. Top bar (right of the menu): **Discover / Subscribed** tabs in the centre (phone: full-width tabs under the top bar), wallet chip, avatar with online dot. No bottom bar. "Live now" row of round creator rings with red LIVE tag + viewer count on both tabs.
**Feed algorithm (owner 2026-10-27, Discover layout changed 2026-10-28)** - **Discover tab opens first on EVERY login** (first time and coming back). Discover is a stack of ONE-LINE rows that scroll sideways (arrows on laptop+, swipe on phone/tablet): **video row** -> **"Creators you may like" row** -> **new video row with DIFFERENT creators** -> creators row -> ... **CONTINUOUS scroll** (owner 2026-10-28, like Fansly): no end and no 'load more' button - near the bottom the next creators row + video row load by themselves (spinner 'Loading more creators...'), each row also keeps loading sideways; round **back-to-top** button bottom-right appears after scrolling down. Rows are never shown cut off: while the next videos load, empty spots in the last row show grey placeholder tiles, then real videos swap in. No video repeats in a session and the same creator is spaced out (full rules: code.md "Discover feed algorithm"). Video row shows phone ~2.4, tablet ~3.3, laptop ~4.4, desktop ~6.4 videos (the cut-off one shows there is more). Each video: views + creator chip (avatar + name); tap the video = play, tap avatar / name = creator profile. Creator card: avatar, name, a peek at 3 of their posts (locked ones show a lock), Follow; phone ~1.3, tablet ~2.2, laptop ~3.2, desktop ~4.2 cards per row. **Subscribed tab** (next to Discover) shows only posts from creators the fan subscribes to / follows, newest first, in a post grid (desktop 3, laptop + tablet 2, phone 1), with locked posts, promoted post, suggestions row and Refer & Earn banner. **Subscribed, following nobody** = "No subscriptions yet" + "Go to Discover" button. The old All / For You tabs, Made For You row and the "build your feed" first-login screen are removed.

## Media (hard rule 5)

Every image / video / GIF goes through FFmpeg (`D:\dev\tools\ffmpeg\bin\ffmpeg.exe`): images -> AVIF + WebP, video / GIF -> MP4 (H.264) + WebM (VP9), sized per screen, metadata stripped (`-map_metadata -1`). Next.js `<Image>` serves AVIF first, WebP fallback (`next.config.ts`).
