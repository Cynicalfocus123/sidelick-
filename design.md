# Side Licks - design.md

## Status

| Screen | Wireframe | Owner approval | Built |
|---|---|---|---|
| Register (F10) + "Check your email" popup (F8) | `wireframes/register.html` | waiting | no |
| Verify email /verify-email (F12), 5 states | `wireframes/verify-email.html` | waiting | no |
| Home /home (F1, F20-F29, F110, F111) + empty feed | `wireframes/home.html` | waiting | no |
| Start page `/` (setup check only, not a real screen) | - | - | yes |

Rule: no screen is built until its wireframe is approved (hard rule 6). Screenshots of every state at every size: `wireframes/shots/` + `wireframes/index.html`; one overview picture per screen (all states x 4 sizes): `wireframes/sheets/<screen>.webp`. All made by `npm --prefix frontend run wireframes:shots` (WebP via FFmpeg). The sheets are what gets sent to the owner in chat every time.

Wireframe colour code (wireframe only - NOT the site colours): top bar blue, left menu + phone bottom bar purple, feed tabs sky blue, Made For You indigo, post green, locked post orange, promoted post yellow, suggested creators pink, live streams teal, Refer & Earn amber, info panel teal, forms blue outline, popups amber outline, message area green outline, logo space red dashed (empty on the real site), buttons dark blue. Colours + tags live in `wireframes/wf.css` (`data-zone` + `z-*` classes).

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

**Home** - desktop / laptop: left menu (logo space + collapse, Home, Chat, Notifications, Discover, My Collection, Become a Creator, Promotions, Following, Subscriptions, Wallet + balance, Refer & Earn card at the bottom), top bar (search, help, language, messages + badge, bell + badge, wallet balance, avatar with online dot), feed centre (tabs All / Subscribed / For You + refresh + create post, Made For You video strip, post cards, locked post with Subscribe, Promoted post), right column (Suggested Creators 3 cards + arrows + dots, Streams You Might Like). Tablet: left menu shrinks to icons, right column hidden. Phone: top bar (logo space, search, bell, wallet, avatar), feed full width, bottom bar (Home, Discover, Chat, Alerts, Menu). Empty feed state: "Create your feed" + Discover Creators.

## Media (hard rule 5)

Every image / video / GIF goes through FFmpeg (`D:\dev\tools\ffmpeg\bin\ffmpeg.exe`): images -> AVIF + WebP, video / GIF -> MP4 (H.264) + WebM (VP9), sized per screen, metadata stripped (`-map_metadata -1`). Next.js `<Image>` serves AVIF first, WebP fallback (`next.config.ts`).
