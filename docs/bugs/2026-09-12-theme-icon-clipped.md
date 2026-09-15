# BUG: theme toggle icon looks partially hidden

- **Status:** fixed, confirmed by user
- **Date:** 2026-09-12
- **Surface:** live site | Framer Preview
- **Pages:** `/data-capture-2`
- **Related:** [theme-toggle-no-switch](2026-09-12-theme-toggle-no-switch.md)

## Symptom

Theme control works, but the sun/moon icon looks clipped or incomplete (rays missing).

## Repro

1. Open `/data-capture-2` in dark mode.
2. Look at the theme pill in the project nav.

## Hypotheses

| ID | Claim | Result | Evidence |
| --- | --- | --- | --- |
| M | `Theme Icons` `overflow: hidden` clips Lucide Sun/Moon strokes | confirmed | Live: Theme Icons 18×18 `overflow:hidden`; SVG 18×18 viewBox 24. Screenshot shows clipped sun rays. |
| N | 18×18 layer is smaller than the SVG painted box | rejected | 22px inject also works, but overflow-visible at 18px already restores all 8 rays |
| O | CSS theme transition (`scale(0.4)` / rotate) still applied to the visible layer | rejected | Live sun `transform:none` `scale:1` when dark |
| P | Two theme controls overlap; one is clipped | rejected | `themeCount: 1` |
| Q | Hidden 16px Icon in the stack still clips or overlaps the 18px layers | rejected | Not in the clipped box |
| S | User is still seeing the published `overflow:hidden` (canvas overflow fix not on live/Preview bundle) | confirmed | Live still `overflow:hidden` after canvas SET visible. Injecting `overflow:visible` restored a full sun. |

## Attempts

| When | What we tried | Result | Keep? |
| --- | --- | --- | --- |
| 2026-09-12 | Case file + live/canvas measure | Theme Icons `overflow:hidden` on live | yes |
| 2026-09-12 | SET Theme Icons + Theme variant `overflow=visible` | canvas updated; live still hidden | no as only fix |
| 2026-09-12 | Live inject overflow visible vs 22px | overflow-visible at 18px restores full sun | yes |
| 2026-09-12 | Head CSS `overflow: visible !important` on Theme Icons / layers / svgs | pending verify | |

## Root cause

Unknown until confirmed.

## Fix

None yet.
