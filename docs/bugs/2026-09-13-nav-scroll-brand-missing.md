# BUG: nav scroll brand missing on live `/data-capture-2`

- **Status:** fixed
- **Date:** 2026-09-13
- **Surface:** live site
- **Pages:** `/data-capture-2`
- **Related:** [architecture nav spec](../architecture.md) · [project-nav-chrome](2026-09-11-project-nav-chrome.md) · [nav-project-locked](2026-09-12-nav-project-locked.md)

## Symptom

After scrolling past the hero Rotating Icon, the nav stays on **Project Landing**. Logo + project name never appear centered in the nav. **Brand Clip** publishes empty (no **Brand** child). Selected Work may also be missing from the live DOM.

Expected: when the Rotating Icon / **Nav Scroll Cue** tucks behind the nav, variant switches to **Scroll** and **Brand** shows “Data Capture” with logo + per-word title animation (see architecture **Nav → Scroll**).

## Repro

1. Open live `/data-capture-2` (`https://sustained-standards-647886.framer.app/data-capture-2`).
2. Scroll to ~900px (past hero).
3. Observe nav `data-framer-name` and center content.

## Hypotheses

| ID | Claim | Result | Evidence |
| --- | --- | --- | --- |
| A | Page-local nav instance `TRXibUtE7` was removed or scrollVariantEffect lost | **confirmed** (stale targets) | `scrollVariantEffect` still pointed at deleted ids `w2F_4JceF` / `Agi8ivLki`. Page nav instance was present. |
| B | Scroll variant **Brand** was deleted or never replicated after nav instance replace | **rejected** | Canvas Scroll variant **Brand** (logo + “Data Capture”) was intact; live emptiness was from staying on Landing (`Brand visible=false` strips on publish). |
| C | Template nav is showing instead of page-local nav | **rejected** | Template nav `E4x8h0Y9z` still `visible=false`. Page instance `TRXibUtE7` publishes. |
| D | Legacy `projectNavSwitcher` / `data-pn-scrolled` was removed and native scroll variant not restored | **confirmed** (part) | Native path correct; scroll targets needed rebind after hero restructure. |

## Attempts

| When | What we tried | Result | Keep? |
| --- | --- | --- | --- |
| 2026-09-13 | Live Playwright dump (`checks/nav-dump2.mjs`) at scrollY 0 and 900 | Confirmed regression: navName `Project Landing`, brand null both times | yes |
| 2026-09-13 | Rebound `TRXibUtE7` scroll targets: Hero `hofUn6rvr` → Landing, Showcase `caKU7ST3r` → Scroll; phone replica ids updated. Published **068000f2f**. | Live scrollY 900: navName `Scroll`, brand `Data Capture` | yes |

## What worked

- (Prior fix 2026-09-11) Page instance `TRXibUtE7`, hide template nav `E4x8h0Y9z`, `onScrollTarget` Hero → Landing / Showcase → Scroll. See `docs/bugs/2026-09-11-project-nav-chrome.md`.

## What did not work

- Do not retry template-nav `scrollVariantEffect` — documented as non-binding on publish.
- Do not reattach `projectNavSwitcher*` without user approval (architecture: native first).

## Root cause

Hero restructure (Rotating Icon component) replaced page-level hero frame `w2F_4JceF` with Hero instance `hofUn6rvr`, but `scrollVariantEffect` on page nav `TRXibUtE7` still referenced the deleted ids. Scroll variant never activated; Landing variant published with `Brand visible=false`, so **Brand Clip** was empty on live.

## Fix

Rebound desktop nav `TRXibUtE7`: Hero `hofUn6rvr` → **Project Landing** (`uoGuBs61d`); Showcase `caKU7ST3r` → **Scroll** (`MGs_j6C3W`). Phone nav `WxgoEZ2w8TRXibUtE7` updated similarly. Published production **068000f2f**.

## Follow-up

- Re-run `checks/nav-dump2.mjs` after publish; expect `navName: "Scroll"` and brand text at scrollY ~900.
