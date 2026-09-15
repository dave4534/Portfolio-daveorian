# Portfolio 4 Foundation runbook

Executable job for proving a no-flash theme on **Portfolio 4** `/data-capture-2` only. Do not open, edit, or publish Portfolio 3.

| | Portfolio 4 | Portfolio 3 (frozen) |
| --- | --- | --- |
| Name | `Portfolio 4` | `Portfolio 3` |
| Live | https://sustained-standards-647886.framer.app | https://silver-founders-702249.framer.app |

Before every mutating batch, print `getProjectInfo().name` and `getPublishInfo().production.url`. Abort if the name is Portfolio 3 or the URL contains `silver-founders-702249`.

## Probe decision (2026-09-11)

Published `Theme/Background` (`c4d2d1a7-4467-44cd-85d5-caac4ee4c651`) is `rgb(255,255,255)` light / `rgb(24,24,24)` dark on the canvas. Live `/theme-probe` with `addInitScript` setting `data-framer-theme=dark` + `currentToggleState` still painted **white** at 100–500ms. Tokens live on `body` via `@media (prefers-color-scheme: dark)`, which does **not** follow `data-framer-theme` or `color-scheme`.

**Branch B:** static `--token-*` sheet in `<head>` keyed to `html[data-framer-theme]` only (not `data-theme`). Do not scrape stylesheets at runtime. Flash check pins `--token-c4d2d1a7-4467-44cd-85d5-caac4ee4c651`.

`/theme-probe` (`KlqW3Sg0J`) is drafted + noindex. Pages cannot be deleted via Agent.

Published `<nav data-framer-name>` is the **variant** name. After Nav 10→5 it is `Project Landing` (was `Project Landing Light`).

## Status (live)

Flash check `checks/theme-flash.mjs` PASSes load and click, both themes, on `/data-capture-2` after Nav collapse (`SITE_URL=https://sustained-standards-647886.framer.app`).

Nav - Project is 5 variants: Project Landing, Scroll, Phone Close, Phone Open, Phone Close Scroll. Footer/Stat dark variants remain. Unused templates Light New / Project Dark are gone.
