# BUG: theme switcher stays on sun icon after click

- **Status:** fixed, verified live (`a5fccd322`)
- **Date:** 2026-09-13
- **Surface:** live site
- **Pages:** `/data-capture-2`, `/meetings` (any page using Nav Button / Theme)
- **Related:** [theme-toggle-icon-spring](2026-09-10-theme-toggle-icon-spring.md) · [theme-toggle-no-switch](2026-09-12-theme-toggle-no-switch.md) · [theme-icon-clipped](2026-09-12-theme-icon-clipped.md)

## Symptom

The theme switcher icon remains the sun after clicking. It does not swap to the moon when the theme changes.

## Repro

1. Open `/data-capture-2`.
2. Click the theme control in the project nav.
3. Watch the icon.

## Hypotheses

| ID | Claim | Result | Evidence |
| --- | --- | --- | --- |
| A | Theme attribute never flips, so icon CSS never restyles | rejected | Live click `light` → `dark` → `light`; body follows |
| B | Theme flips, but Sun/Moon CSS does not target the published layers | confirmed | Published head had tokens + click script, **no** Sun/Moon opacity rules. Live `matchingRules: []` |
| C | Moon layer is missing, hidden, or clipped so only sun can show | rejected | Both layers present, 18×18; moon SVG exists; moon opacity stays `0` |
| D | Both icons exist but visibility/opacity/transform leave sun visible in both themes | confirmed (canvas default) | Canvas Theme variant: Sun default, Moon `opacity: 0`. No CSS override |
| E | Click remounts or resets the control to the canvas default (sun) | rejected | Same Sun/Moon nodes before and after click; names unchanged |

## Attempts

| When | What we tried | Result | Keep? |
| --- | --- | --- | --- |
| 2026-09-13 | Live probe + canvas serialize | Theme flips; sun `opacity:1` / moon `0` in both themes; head has no icon CSS | yes |
| 2026-09-13 | Inject Sun/Moon CSS on live page | Light → moon 1 / sun 0; dark → sun 1 / moon 0 | yes |
| 2026-09-13 | Persist `<style id="p4-theme-icons">` in headStart (separate from tokens); publish `a5fccd322` | Live `/data-capture-2` and `/meetings` pass | yes |

## What worked

Head CSS keyed on `html[data-framer-theme]` + `[data-framer-name="Theme Icons"]` Sun/Moon layers. Light shows moon, dark shows sun. Sheet is **not** inside `p4-theme-tokens` so token regen cannot wipe it.

## What did not work

- Driving the icon via React `variant` / `ThemeToggleButton` (see related cases)
- Hiding layers or remounting nav to paper over first-paint mismatch
- Putting icon rules inside `p4-theme-tokens` (that sheet is regenerated from color styles only)

## Root cause

Nav Button / Theme is one canvas tree: Sun visible, Moon `opacity: 0`. Theme look is supposed to come from `html[data-framer-theme]`, not a Light/Dark variant. The click script still flipped the attribute, but the Sun/Moon swap CSS was missing from the published head, so the control stayed on the canvas default (sun).

## Fix

`p4-theme-icons` in Custom Code → Start of `<head>`: light hides sun / shows moon; dark shows sun / hides moon; overflow visible on Theme Icons. Published https://sustained-standards-647886.framer.app (`a5fccd322`).

## Follow-up

Keep icon CSS out of `p4-theme-tokens` when regenerating tokens.
