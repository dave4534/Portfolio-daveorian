# BUG: Selected Work menu renders dark while the page is in Light

- **Status:** fixed, verified live
- **Date:** 2026-09-12
- **Surface:** live
- **Pages:** `/data-capture-2`
- **Related:** [theme-toggle-no-switch](2026-09-12-theme-toggle-no-switch.md), [project-nav-theme-delay](2026-09-11-project-nav-theme-delay.md)

## Symptom

On the live site in Light mode, opening Selected Work shows the Nav Menu card with a dark background.

## Repro

1. OS appearance set to Dark.
2. Open live `/data-capture-2` in Light mode (`data-framer-theme="light"`).
3. Click Selected Work. Card paints `rgb(24, 24, 24)`.

## Hypotheses

| ID | Claim | Result | Evidence |
| --- | --- | --- | --- |
| T | The menu fill token is not overridden by the `html[data-framer-theme]` head sheet, so it keeps Framer's `prefers-color-scheme: dark` value | confirmed | With `data-framer-theme="light"` and OS dark, `--token-5d77bcca…` resolved to `rgb(24, 24, 24)` on both `html` and `body`; card `backgroundColor rgb(24, 24, 24)` while `body` was `rgb(255, 255, 255)` |
| T2 | The head sheet's token declarations lose the cascade and an `!important` override wins | confirmed | Injecting `html[data-framer-theme="light"] { --token-5d77bcca…: rgb(255,255,255) !important }` flipped the resolved value to `rgb(255, 255, 255)` and the card to white in the same session |

Note: the head `<style id="p4-theme-tokens">` was present with 25 parsed rules and its text contained the token, yet no parsed rule carried that declaration, so the hand-maintained token list was not reliably applied.

## Attempts

| When | What we tried | Result | Keep? |
| --- | --- | --- | --- |
| 2026-09-12 | Live probe of token owner + `!important` injection test | both confirmed above | yes |
| 2026-09-12 | Regenerated the whole token sheet from the project's 96 color styles, Light and Dark blocks, every declaration `!important` | fixed | yes |
| 2026-09-12 | Live post-fix check, Light theme with OS dark | token `rgb(255, 255, 255)`, card `rgb(255, 255, 255)` (was `rgb(24, 24, 24)`) | yes |

## Root cause

Published Framer CSS keys color-style tokens to `@media (prefers-color-scheme: dark)`, which does not follow `data-framer-theme`. The head sheet exists to re-key them, but it was hand-maintained and its declarations were not winning, so any token it missed (here `Surface/Primary`) fell back to the OS preference. With OS dark and site Light, the menu painted dark.

## Fix

The `p4-theme-tokens` sheet is now generated from every `ColorStyleTokenNode` in the project (96 tokens) into `html[data-framer-theme="light"]` and `html[data-framer-theme="dark"]` blocks, each declaration `!important`. No token can be missed, and the OS preference can no longer win.
