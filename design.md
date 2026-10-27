# Side Licks - design.md

## Status

| Screen | Wireframe | Owner approval | Built |
|---|---|---|---|
| Register (F10) + "Check your email" popup (F8) | `wireframes/register.html` | waiting | no |
| Verify email /verify-email (F12), 5 states | `wireframes/verify-email.html` | waiting | no |
| Home /home layout v3: left menu + Discover tab (opens first) + Subscribed tab | `wireframes/home.html` | waiting | no |
| Start page `/` (setup check only, not a real screen) | - | - | yes |

Rule: no screen is built until its wireframe is approved (hard rule 6). Screenshots of every state at every size: `wireframes/shots/` + `wireframes/index.html`; one overview picture per screen (all states x 4 sizes): `wireframes/sheets/<screen>.webp`. All made by `npm --prefix frontend run wireframes:shots` (WebP via FFmpeg). The sheets are what gets sent to the owner in chat every time.

Wireframe colour code (wireframe only - NOT the site colours): top bar blue, left menu purple, Discover / Subscribed tabs sky blue, Discover videos indigo (creator name chip pink dashed), post green, locked post orange, promoted post yellow, suggested creators pink, live streams teal, Refer & Earn amber, info panel teal, forms blue outline, popups amber outline, message area green outline, logo space red dashed (empty on the real site), buttons dark blue. Colours + tags live in `wireframes/wf.css` (`data-zone` + `z-*` classes).

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

## Wireframe layouts (proposed, waiting for approval)

**Register** - phone: full-width form. Tablet: centred white card. Laptop / desktop: grey info panel on the left (short lines about Side Licks; picture / colours after F5) + form card on the right. Form: title "Create your account", Continue with Google, "or", Email, Password (Show, "At least 8 characters"), "I am 18 or older" tick, Terms + Privacy tick, Create account (grey until all filled), "Have an account? Sign in" top right. After sign-up: "Check your email" popup (bottom sheet on phone, centred box on tablet+) with Send again + Change email + X.

**Verify email** - white page, soft glow top-right (brand colour after F5), logo space centred at top, big "Email Verification". States: Checking (spinner, "Verifying your request..."), Verified (+ Continue, auto to /home in 2-3 s with toast), Expired signed in (Send a new link), Expired signed out (Sign in), Other device signed out (verified + Sign in to continue).

**Home - Side Licks layout v3 (2026-10-27, owner: "menu always on the left side on every device, the bottom bar is not good")** - LEFT MENU on every size, sticky full height: phone = slim 60px icon rail (icons only), tablet = 88px rail with icons + small words, laptop = 232px / desktop = 264px sidebar with icons + words. Menu items: Home, Search, Messages (badge), Notifications (badge), big purple + Create button (creators post / go live; fans: Become a Creator), Subscriptions, Wallet; laptop + desktop also show Following, My Collection, Become a Creator, Promotions, Refer & Earn, Settings and a profile card at the bottom; phone + tablet put those under "More" at the bottom of the rail. Logo space: top of the sidebar on laptop + desktop, in the top bar on phone + tablet. Top bar (right of the menu): **Discover / Subscribed** tabs in the centre (phone: full-width tabs under the top bar), wallet chip, avatar with online dot. No bottom bar. "Live now" row of round creator rings with red LIVE tag + viewer count on both tabs.
**Feed algorithm (owner 2026-10-27)** - **Discover tab opens first on EVERY login** (first time and coming back). It shows videos from all creators in a grid (phone 2, tablet 3, laptop 4, desktop 5 across; rows always full); each video has views + a creator chip (avatar + name). Tap the video = play, tap the avatar / name = the creator's profile. A "Creators you might like" row sits between video blocks; more videos keep loading. **Subscribed tab** (next to Discover) shows only posts from creators the fan subscribes to / follows, newest first, in a post grid (desktop 3, laptop + tablet 2, phone 1), with locked posts, promoted post, suggestions row and Refer & Earn banner. **Subscribed, following nobody** = "No subscriptions yet" + "Go to Discover" button. The old All / For You tabs, Made For You row and the "build your feed" first-login screen are removed.

## Media (hard rule 5)

Every image / video / GIF goes through FFmpeg (`D:\dev\tools\ffmpeg\bin\ffmpeg.exe`): images -> AVIF + WebP, video / GIF -> MP4 (H.264) + WebM (VP9), sized per screen, metadata stripped (`-map_metadata -1`). Next.js `<Image>` serves AVIF first, WebP fallback (`next.config.ts`).
