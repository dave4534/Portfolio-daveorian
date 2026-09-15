# BUG: nav button hover background flashes two colors

- **Status:** fixed, verified live
- **Date:** 2026-09-12
- **Surface:** Framer Preview | live
- **Pages:** `/data-capture-2`
- **Related:** [theme-toggle-no-switch](2026-09-12-theme-toggle-no-switch.md)

## Symptom

Nav buttons flash a second hover background color. There should be one hover fill.

## Repro

1. Open `/data-capture-2`.
2. Hover Home, Selected Work, or Theme.
3. Background flashes between colors.

## Hypotheses

| ID | Claim | Result | Evidence |
| --- | --- | --- | --- |
| A | Hover variant fill plus a `hoverEffect.backgroundColor` both run | rejected | No `hoverEffect` on variants |
| B | Hover fill is a raw color / wrong token that disagrees with Light vs Dark | rejected | Hover fill is `Theme/Surface` |
| C | Two gesture variants stack (Hover + Pressed) with different fills | rejected | Only hover gestures |
| D | Framer default hover wash fights the variant fill | confirmed | Live Home hover 80ms `rgba(222,222,223,0.792)` then 330ms `rgb(249,250,251)` Surface |
| V | Head hover CSS paints the wrapper `div`, not the rounded `a`, so hover is a square that bleeds past the pill | confirmed | Live hover of Theme: `div.framer-6n387j-container` `bg rgb(249,250,251)` / `radius 0px`, inner `a` `radius 100px` |

## Attempts

| When | What we tried | Result | Keep? |
| --- | --- | --- | --- |
| 2026-09-12 | Case file + live hover colors | grey then Surface | yes |
| 2026-09-12 | Instant hover transition + tapHighlight transparent + CSS hover = Surface only | user: still flashes | no as only fix |
| 2026-09-12 | Stronger nav hover CSS (no wash, no ::before/after, 0s bg transition) | caused square hover bleed on Theme and Home | no, removed |
| 2026-09-12 | Removed all four nav hover CSS chunks from `p4-theme-tokens`; hover fill is the gesture variant only, `transition="instant"` | fixed | yes |
| 2026-09-12 | Live post-fix samples on Theme at idle / +40 / +90 / +200 / +500ms | wrapper stays `rgba(0,0,0,0)` throughout; anchor goes straight to `rgb(249,250,251)` at `radius 100px`, one color, no square. Home behaves the same | yes |

## Root cause

Two separate causes. The flash was the hover fill tweening from transparent to `Theme/Surface` over 0.15s, whose composite midpoint reads darker than either endpoint. The square bleed was self-inflicted: `nav [data-framer-name="Theme"]:hover` matches the Framer wrapper `div` (`border-radius: 0`) as well as the rounded `a`, so the fill painted a square behind the pill.

## Fix

Hover fill comes only from the gesture variants (`Home Hover`, `Work Closed Hover`, `Work Open Hover`, `Icon Hover`, `Theme Hover`) with `transition="instant"`, so there is no interpolation and no second color. All nav hover CSS is gone from the head sheet, which restores the 100px radius.

## What did not work

- Nav hover CSS keyed on `[data-framer-name="..."]`: the name lands on both the wrapper div and the anchor, so any background rule squares off the pill.
