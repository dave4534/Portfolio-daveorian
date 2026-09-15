# BUG: Selected Work does not close the menu on second click

- **Status:** fixed, confirmed by user
- **Date:** 2026-09-12
- **Surface:** Framer Preview | live
- **Pages:** `/data-capture-2`
- **Related:** [theme-toggle-no-switch](2026-09-12-theme-toggle-no-switch.md)

## Symptom

Selected Work opens Nav Menu. Clicking the button again while open does not collapse it.

## Repro

1. Open `/data-capture-2`.
2. Click Selected Work to open the menu.
3. Click Selected Work again.

## Hypotheses

| ID | Claim | Result | Evidence |
| --- | --- | --- | --- |
| E | Instance only has `SHOW_OVERLAY`; second click shows again instead of dismiss | confirmed | Work Open still fired `TRIGGER_EVENT` → instance `SHOW_OVERLAY`. Live second click left 250×356 menu open. |
| F | Work Open `onTap` still `SET_VARIANT` / does not dismiss | open | |
| G | Overlay click-through hits the button but Framer treats it as outside/re-open | open | |
| U | With the menu as a variant child, nothing dismisses it on an outside click | confirmed | Live: click at (200, 700) after opening left the trigger on `Work Open` |
| U2 | A viewport scrim inside the component can provide outside-dismiss | rejected | `position="fixed"` refused: "Fixed positioning is only supported for direct children of a page breakpoint or top-level frame on a design page"; `100vw` also refused for width |

## Attempts

| When | What we tried | Result | Keep? |
| --- | --- | --- | --- |
| 2026-09-12 | Case file + live second click | menu stayed 250×356 | yes |
| 2026-09-12 | Work Open / Open Hover `onTap` = `DISMISS_OVERLAY` | user: still does not close | no |
| 2026-09-12 | Drop overlay; menu inside Work Open; Closed↔Open `SET_VARIANT` | trigger toggles, but no outside-click dismiss | partly |
| 2026-09-12 | Viewport scrim `FrameNode` inside Nav Button, `position="fixed"` | rejected by Framer, node removed | no |
| 2026-09-12 | Oversized absolute tap scrim `Menu Scrim` (`oy_xy7vnG`, 8000×4000 at `left -4000px / top -400px`, `zIndex 9`, transparent, `onTap` → `SET_VARIANT` Work Closed), hidden in the primary and shown only in Work Open / Work Open Hover | pending live verify after publish | |

## Notes

`SET <id> visible="false"` (quoted) reported "Commands applied cleanly" but did not change the node; `SET <id> visible=false` (unquoted) did. Always read the value back after setting visibility.

## Root cause

Two causes. The trigger re-fired `SHOW_OVERLAY` instead of toggling, so a second click re-showed the menu. After the menu became a variant child, nothing in the component caught clicks landing elsewhere on the page, so it had no outside dismiss.

## Fix

Selected Work is a Nav Button variant toggle: `Work Closed` ↔ `Work Open` via `SET_VARIANT`, mirrored on both hover variants. `Work Open` / `Work Open Hover` show the `Work Menu` instance (`GNigoKpRG`, absolute, `zIndex 10`) plus a transparent `Menu Scrim` frame (`oy_xy7vnG`, 8000×4000 at `left -4000px / top -400px`, `zIndex 9`) whose tap returns to `Work Closed`. The scrim is hidden in the primary variant, so it only exists while the menu is open, and it lives inside the nav's `position: fixed` container so it cannot add scrollable overflow.

## What did not work

- `DISMISS_OVERLAY` on the Work Open variants.
- A `position="fixed"` scrim inside the component: Framer allows fixed only for direct children of a page breakpoint or a top-level frame, and rejects `vw`/`vh` sizing there.
