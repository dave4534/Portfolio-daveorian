# BUG: theme toggle does not switch Light/Dark

- **Status:** fixed, confirmed by user
- **Date:** 2026-09-12
- **Surface:** live site | Framer Preview
- **Pages:** `/data-capture-2`
- **Related:** [project-nav-theme-delay](2026-09-11-project-nav-theme-delay.md) · [theme-toggle-icon-spring](2026-09-10-theme-toggle-icon-spring.md) · [theme-toggle-code-component](2026-09-11-theme-toggle-code-component.md)

## Symptom

Clicking the project-nav theme control does not toggle Light/Dark. In dark mode the scrollbar stays white.

## Repro

1. Open `/data-capture-2` (Preview or live).
2. Click the sun/moon control in the project nav.
3. Theme stays the same. Scrollbar stays light.

## Hypotheses

| ID | Claim | Result | Evidence |
| --- | --- | --- | --- |
| D | User is on live/Preview that still runs the old head snippet (canvas script not published / Preview skips custom code) | rejected on live | Live HTML has the new script; `hasToggleFn=true` (`debug-a98596.log` load) |
| E | Click never matches the new Theme pill (no `#p4-theme-toggle`, layers not named, pointer-events none, overlay swallows) | rejected for Playwright | `#p4-theme-toggle` is absent, but Sun Layer and `[data-framer-name=Theme]` clicks both flip light→dark |
| F | Toggle runs and sets `data-framer-theme`, then Framer/hydration resets it back to light | rejected on live | attr still `dark` at +600ms after click |
| G | Attribute flips but tokens/`color-scheme` stay light, so the page and scrollbar look unchanged | rejected on live probe | after click `bodyBg=rgb(24,24,24)`, `htmlScheme=dark` |
| H | `html`/`body` `color-scheme` is light or a scroll container has a hardcoded light `::-webkit-scrollbar` | confirmed | After a working dark toggle, `scrollbarColor` stayed `auto` (`post-repro:after`). No dark scrollbar CSS existed. |
| I | User is clicking in Framer Preview/canvas, where head custom code does not run | likely | Live Playwright click flips the page; visible Theme pill had no `withThemeToggle`. Preview has no head listener. |
| J | The white bar is Preview/editor chrome, not the page viewport scrollbar | open | |

## Attempts

| When | What we tried | Result | Keep? |
| --- | --- | --- | --- |
| 2026-09-12 | Head script storage+targeting fix; Nav Button Theme; hide old switch | User: toggle still fails; dark-mode scrollbar stays white | no until measured live |
| 2026-09-12 | Debug ingest logs in head snippet (`a98596`) | user Proceed sent no page logs (HTTPS→localhost blocked) | keep until verify |
| 2026-09-12 | Live Playwright after user Proceed | Theme click light→dark; nav/body tokens follow; `scrollbar-color: auto` | yes |
| 2026-09-12 | Dark scrollbar CSS in head tokens; `withThemeToggle` on Theme pill; `readStoredTheme` uses live attribute | pending user verify | |

## What worked

-

## What did not work

- Driving theme via React `variant` / `ThemeToggleButton`
- Attaching `withThemeToggle` only to the hidden old switch (Preview never received the click)
- Canvas-only head-script edit without confirming it is what the tested surface runs

## Root cause

Unknown until confirmed by runtime logs.

## Fix

None yet.

## Follow-up

-
