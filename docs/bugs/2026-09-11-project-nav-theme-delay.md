# BUG: project nav theme delay on land, refresh, and toggle

- **Status:** fixed on Portfolio 4 `/data-capture-2` (live)
- **Date:** 2026-09-11
- **Surface:** live website
- **Pages:** `/data-capture-2` (and other project pages using Nav - Project)
- **Related:** [theme-toggle-icon-spring](2026-09-10-theme-toggle-icon-spring.md) · [section-nav-pink-flash](2026-09-10-section-nav-pink-flash.md)

## Symptom

On `/data-capture-2`, the nav stays on the wrong theme for a few milliseconds, then switches. Happens:

1. After clicking the theme switcher
2. On landing / hard refresh

## Repro

1. Open the live site project page (`/data-capture-2`).
2. Watch the nav on first paint.
3. Click the theme switcher and watch the nav vs the rest of the page.

## Hypotheses

| ID | Claim | Result | Evidence |
| --- | --- | --- | --- |
| A | First paint uses canvas default nav; stored theme applied after hydration (`appliedVariant` starts `null`) | confirmed | Live `/data-capture-2` with stored `dark`: at 50ms nav is still `Project Landing Light` |
| B | `key={appliedVariant}` remounts the whole nav on theme change | confirmed (load) | Name jumps `Project Landing Light` → `Project Landing` (new instance), not an in-place restyle |
| C | Document theme updates before the nav variant | confirmed | At 50ms `data-framer-theme=dark` while nav name is still Light |
| D | `data-pn-nav-ready` hide/reveal delays showing the correct nav | confirmed | At 50ms `navOpacity=0` and `navReady=null`; at 203ms `opacity=1` and `navReady=1` |
| E | SSR HTML is Light (`Project Landing Light`) while storage can be dark | confirmed | Published HTML nav is `Project Landing Light`; head snippet sets `data-framer-theme` from storage |

## Attempts

| When | What we tried | Result | Keep? |
| --- | --- | --- | --- |
| 2026-09-11 | Bug-log scaffold | added `docs/bugs` + `.cursor/rules/bug-log.mdc` | yes |
| 2026-09-11 | Timed live site with stored dark theme | load: Light nav hidden ~150ms, then Dark remount; click: Light nav present by +107ms | yes (measurement only) |
| 2026-09-11 | First-render variant / drop remount `key` | Broke hydration (nav could stay Light and hidden). Do not retry without matching SSR. | no |
| 2026-09-11 | Tokens + static `html[data-framer-theme]` sheet; strip `projectNavSwitcher` / hide flag; one nav tree | Live flash check PASS (load + click, both themes). Nav name stays `Project Landing`; no `data-pn-nav-ready`. | yes |

## What worked

On Portfolio 4 `/data-capture-2` only: Light/Dark as tokens + pre-paint `data-framer-theme`, not a nav variant remount. Click writes storage + the attribute. Measured live 2026-09-11.

## What did not work

From the related toggle-spring case, do not retry as a first move:

- Driving Framer canvas springs via React `variant` on the toggle
- Removing nav `key` / applying the dark variant on the first client render (breaks hydration against SSR Light nav)
- Hiding the Light nav until JS (`data-pn-nav-ready`)

## Root cause

Published SSR always ships **one** nav tree. A head snippet sets `data-framer-theme` immediately from `currentToggleState`. The old path hid that nav until `projectNavSwitcher` hydrated, remounted a Dark variant (`key={appliedVariant}`), and set `data-pn-nav-ready`.

## Fix

Shipped on Portfolio 4 live (`sustained-standards-647886.framer.app`), not via `ThemeToggleButton`. Other project pages still use `variantSwitcher`.
