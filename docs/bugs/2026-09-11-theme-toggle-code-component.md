# BUG: theme toggle sun/moon spring missing

- **Status:** open
- **Date:** 2026-09-11
- **Surface:** Framer Preview (published site not updated)
- **Pages:** project nav / any page with Theme Toggle
- **Related:** [theme-toggle-icon-spring](2026-09-10-theme-toggle-icon-spring.md) · [project-nav-theme-delay](2026-09-11-project-nav-theme-delay.md)

## Symptom

Clicking the theme switch does not spring sun/moon. The switch can disappear on the live site.

## Repro

1. Open Framer Preview (not the published `.framer.app` URL).
2. Click the theme switch.

## Hypotheses

| ID | Claim | Result | Evidence |
| --- | --- | --- | --- |
| A | `themeSwitcher` override never mounts / never logs, so canvas variant springs never run | confirmed | debug-cf8aec.log: many `variantSwitcher.themeChange` lines, **zero** `themeSwitcher` / `Theme_Toggle.tsx:module` lines before this change |
| B | Framer remounts nav on theme (`key={appliedVariant}`), cutting any in-tree animation | confirmed earlier | `isToggle: false`; stats jump Light→Dark |
| D | Override-driven `variant` IDs apply as a hard swap (~63ms), not a canvas spring | confirmed earlier | `sameAsIncoming: true` after 63ms, user still saw no spring |
| G | A `framer-motion` code component that owns the icons will spring, then broadcast theme | open | pending this run |

## Attempts

| When | What we tried | Result | Keep? |
| --- | --- | --- | --- |
| 2026-09-10 | Drive canvas Dark/Light variant from override | No spring | no |
| 2026-09-10 | Remove nav remount key | Override still didn't log on that page | no (not sufficient) |
| 2026-09-10 | CSS `!important` on Sun/Moon layers | No `themeSwitcher` logs; layers never targeted | no |
| 2026-09-11 | Variant IDs instead of names | IDs applied; still instant swap | no |
| 2026-09-11 | Delay themeChange until CSS transitionend | Still zero themeSwitcher logs in this run | no |
| 2026-09-11 | Replace canvas switch with `ThemeToggleButton` code component | pending | yes |

## What did not work

- Assuming Framer canvas variant transitions run when React sets `variant`.
- CSS/WAAPI on `[data-framer-name="Sun Layer"]` while `themeSwitcher` does not execute.
- Driving the visible icon through the canvas Theme Toggle Switch (`KTHEXxyWd`).

## Root cause

Canvas variant interpolation is not the click path. Runtime logs never show `themeSwitcher`; theme still changes via `themeChange` observed by `variantSwitcher`. Nav remounts replace nested layers. The spring must live in a component Framer will not tear down for a variant swap, or complete before theme broadcast.

## Fix

`ThemeToggleButton.tsx` (`framer-motion` sun/moon). Canvas switch hidden. Theme broadcast after spring `onAnimationComplete`.

## Follow-up

Not the Portfolio 4 foundation path. `/data-capture-2` uses CSS icons + `data-framer-theme`, not `ThemeToggleButton`. Leave this case open until someone explicitly ships or removes that code component.
