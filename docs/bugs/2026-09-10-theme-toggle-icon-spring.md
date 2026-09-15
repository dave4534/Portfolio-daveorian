# BUG: theme toggle sun/moon spring missing

- **Status:** fixed on Portfolio 4 `/data-capture-2` (CSS icons; nav remount stripped there)
- **Date:** 2026-09-10
- **Surface:** live website
- **Pages:** `/data-capture-2` (other pages still remount via leftover switchers)
- **Related:** [project-nav-theme-delay](2026-09-11-project-nav-theme-delay.md) · chat [theme toggle spring](cf8aec20-78d9-4a96-be8b-30bb5e3e4527)

## Symptom

Clicking the theme switch did not spring sun/moon; the icon cut.

## Confirmed

- Theme did change (`themeChange` light ↔ dark).
- Stats jumped Light Mode → Dark Mode without going through the toggle instance (`isToggle: false`).
- `projectNavSwitcher6` used `key={appliedVariant}`, remounting the whole nav (and toggle) on theme change.

## Attempts

| When | What we tried | Result | Keep? |
| --- | --- | --- | --- |
| 2026-09-10 | Drive toggle `variant` Dark/Light from `themeSwitcher` | No proof the canvas spring ran | no |
| 2026-09-10 | Remove nav remount `key` | Zero `projectNavSwitcher6` logs on the previewed page; reverted | no (not proven) |
| 2026-09-10 | CSS spring on Sun Layer / Moon Layer from `html[data-framer-theme]` | Independent of variant remounts | yes |

## What did not work

- Assuming Framer canvas variant transitions run when React sets `variant`.
- Removing `key={appliedVariant}` without evidence that override mounted on that page.

| 2026-09-11 | CSS on `#p4-theme-toggle` children from `html[data-framer-theme]`; strip nav remount on `/data-capture-2` | Live click restyles in place; no `ThemeToggleButton` | yes |

## Follow-up

`projectNavSwitcher*` remains in `Theme_Toggle.tsx` for other pages. Do not treat `ThemeToggleButton` as the fix.
