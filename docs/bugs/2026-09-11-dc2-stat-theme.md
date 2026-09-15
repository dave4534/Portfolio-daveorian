# BUG: data-capture-2 stats stay on Light Mode in dark theme

- **Status:** fixed on `/data-capture-2`
- **Date:** 2026-09-11
- **Surface:** live site
- **Pages:** `/data-capture-2`
- **Related:** [architecture](../architecture.md) · [project-nav-chrome](2026-09-11-project-nav-chrome.md)

## Symptom

Statistics grid cards stay on the **Light Mode** variant in dark theme. Sideline is bright teal (`Theme/Stat Sideline` dark) instead of the Dark Mode treatment (5% mint sideline, teal percentage).

## Repro

1. Open live `/data-capture-2` in dark (`currentToggleState=dark`).
2. Scroll to Statistics. Cards are `data-framer-name="Light Mode"`.

## Hypotheses

| ID | Claim | Result | Evidence |
| --- | --- | --- | --- |
| A | Instances pinned to Light Mode; canvas cannot switch Light/Dark from `data-framer-theme` without JS | **confirmed** | Four instances `$control__variant="Light Mode"`. Architecture: do not attach `variantSwitcher`. |
| B | Light Mode texts are already Theme/*; only sideline/number/label differ from Dark Mode | **confirmed** | Live dark: topic muted, H1 primary, body tokened; sideline `rgb(4, 225, 203)`. Dark Mode variant uses Teal/65 number + 5% mint sideline. |

## Attempts

| When | What we tried | Result | Keep? |
| --- | --- | --- | --- |
| 2026-09-11 | Token Light Mode to follow theme (Stat Sideline / Stat Value / Stat Label); do not switch variants | Live **c33e7c6c5**: dark sideline `rgba(185, 231, 210, 0.05)`, label white, value teal `rgb(3, 180, 167)` | yes |

## What did not work

- Do not retry `variantSwitcher` / `themeSwitcher` on Stat.

## Root cause

Theme is tokens, not a variant axis. Stat still has Light/Dark variants; instances are pinned to Light Mode.

## Fix

Tokened Light Mode: `Theme/Stat Sideline`, `Theme/Stat Value`, `Theme/Stat Label`. Head `--token-*` sheet updated. Dark Mode variants remain on the component but are unused on `/data-capture-2`.

## Follow-up

Per-project surfaces (Data Capture mint) may move under `Project/*` later. Global surfaces stay `Theme/Background`, `Theme/Surface`, `Theme/Surface Raised`, `Theme/Nav Fill`.
