# BUG: rotating icon puck / edge color controls do nothing

- **Status:** fixed (canvas verified; rim needs a Preview pass)
- **Date:** 2026-09-12
- **Surface:** canvas | Framer Preview
- **Pages:** `/data-capture-2`, `/meetings`, `/receptionist`
- **Related:** `2026-09-12-rotating-icon-color-flash.md`, Hero component `W3stuCIdE`, `RotatingIcon.tsx` (`codeFile/bjvMHAu:default`)

## Symptom

Picking any value for **Puck Color Light/Dark** or **Edge Color Light/Dark** on the Hero instance changed nothing. The puck stayed the same near-white shape in every case.

## Repro

1. Select a Hero instance, set Puck Color Light to a saturated color.
2. Screenshot the hero. Puck is unchanged.

## Hypotheses

| ID | Claim | Result | Evidence |
| --- | --- | --- | --- |
| A | A canvas frame behind the icon owns the visible puck, so the control targets nothing | rejected | `serialize W3stuCIdE depth 8` shows only `Nav Scroll Cue` + the `Rotating Icon` instance. No filled wrapper. |
| B | Hardcoded `PUCK_COLOR_ALPHA = 0.05` / `EDGE_COLOR_ALPHA = 0.08` discard the picked color's opacity, so every color renders ~invisible | confirmed | `colorWithAlpha(color, alpha)` kept only the RGB channels and forced the constant alpha. At 5% over white, hue is imperceptible. |
| C | Framer color styles reach the component as `var(--token-…)`, which Three cannot parse | confirmed | DC2 passed `var(--token-5d77bcca-…)` (= `Primary`, white/`rgb(18,18,18)`). `edgeMaterial.color.set("var(--token-…)")` leaves the material color untouched. |
| D | Some numeric controls never reach the component because Framer derives prop names from control **titles** | confirmed | Exposed controls are `dragSmoothing`, `flickMomentum`, `introSpin`; the code read `damping`, `flickDecay`, `introSpinSpeed`. Same class as the earlier `imageUrl` → `logo` bug. |

## Attempts

| When | What we tried | Result | Keep? |
| --- | --- | --- | --- |
| 2026-09-12 | Resolve every incoming color through a DOM probe into `{r,g,b,a}` (`parseColor`) | works for hex, `rgb/rgba`, `color(display-p3 …)` and `var(--token-…)` | yes |
| 2026-09-12 | Use the color's own alpha instead of the two constants | Puck yellow + logo blue rendered as picked | yes |
| 2026-09-12 | Feed the rim `rgb(...)` plus `opacity` from the parsed alpha | applied; rim is WebGL-only so not visible in canvas screenshots | yes |
| 2026-09-12 | Alias the renamed numeric props | drag smoothing / flick / intro spin now reach the loop | yes |

## What worked

- Parsing colors via a hidden probe span and reading `getComputedStyle().color`. A sentinel value (`rgb(1, 2, 3)`) detects unparseable input and falls back instead of silently rendering black.
- Strip the function name before matching digits — `color(display-p3 …)` otherwise yields a bogus `3` from `p3` as the first channel.
- Per-theme logo tint: resolve light and dark up front, pick inside `applyFace(image, nextTheme)`, and pass both into the effect deps so the theme observer repaints correctly.

## What did not work

- Do not retry `SET <variable-id> initialValue="…"` or `DEL <variable-id>` with `{ pagePath }` for variables scoped to a **component**. It fails with "The target does not exist". Call `applyChanges(dsl)` with no page path, and make it the **first** `applyChanges` of that `exec` run — an earlier call carrying `{ pagePath }` in the same run leaves the page scope active and the variable ids stop resolving.
- Do not carry the old 5% / 8% transparency into the control defaults. Reviewing the panel, every color read 0–10% opacity, which looks broken even though it matched the previous render.
- Do not use a fully transparent color to mean "no tint". Use the `Tint Logo` boolean instead, so no control holds a 0% color.
- Do not bind a `type="image"` variable to `$control__logo.src`; bind the whole control (`$control__logo="var(--variable-…)"`).
- Do not pass a `Theme/*` color style into these Light/Dark controls. The token resolves per CSS color scheme while the component also picks light vs dark, so theme is applied twice.

## Root cause

Two independent defects. The renderer discarded the picked color's alpha in favour of hardcoded 5% / 8% constants, so hue changes were invisible; and token colors (`var(--token-…)`) were handed straight to Three, which cannot parse them and keeps the previous color.

## Fix

In `RotatingIcon.tsx`:

- `parseColor` / `resolvePaint` / `rgbaCss` / `rgbCss` replace `colorWithAlpha`. Opacity now comes from the picked color.
- Rim material takes `rgbCss(paint)` + `opacity: paint.a`, updated on theme change.
- New `Tint Logo` boolean plus `Logo Color Light` / `Logo Color Dark`. Tint off keeps the artwork's own colors. The old single `Logo Color` control and its Hero variable are gone.
- `numberOr` coerces numeric controls and aliases `dragSmoothing`/`flickMomentum`/`introSpin`; `isTruthy` coerces the booleans.

Every color control is fully opaque: puck `#EDEDED` / `#2A2A2A`, edge `#F5F5F7` / `#3D3D3D`, logo `#111111` / `#FFFFFF`. The puck now reads as a solid tile in both themes instead of the old near-invisible ghost. Hero variable defaults and all three instances carry these values.

## Follow-up

- Rim color is only drawn by WebGL. Canvas screenshots use the static `StaticPuck` fallback, which has no rim — confirm the edge color in Preview.
- `/meetings` and `/receptionist` use a black Vonage mark, so in dark theme it sits black-on-dark. Turning `Tint Logo` on for those two instances gives a white mark in dark and black in light. Not done — waiting on the user.
- Verification shots: `.cursor/verify/opaque-dc2-light.jpg`, `opaque-dc2-dark.jpg`, `opaque-rec-light.jpg`, `opaque-rec-dark.jpg`. Earlier proof that the controls respond: `rec-color-test.jpg`, `rec-dark-test.jpg`, `rec-light-check.jpg`.
