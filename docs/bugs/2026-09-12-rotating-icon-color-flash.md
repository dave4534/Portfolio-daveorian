# BUG: rotating icon flashes colors on load

- **Status:** fixed
- **Date:** 2026-09-12
- **Surface:** Framer Preview
- **Pages:** `/data-capture-2`, `/meetings`, `/receptionist`
- **Related:** [hero-rotating-icon-missing](2026-09-11-hero-rotating-icon-missing.md)

## Symptom

On load or refresh, the hero Rotating Icon flashes a few different colors for a millisecond or two, then settles.

## Repro

1. Open Preview on a project page with Rotating Icon in the hero.
2. Reload.
3. Watch the puck for the first one to two frames.

## Hypotheses

| ID | Claim | Result | Evidence |
| --- | --- | --- | --- |
| A | First WebGL texture is `makeProceduralTexture` (purple/pink/blue gradient) until the logo image composites | confirmed | `RotatingIcon.tsx` creates that map, then `image.onload` replaces it |
| B | PMREM env bake after the first `render` changes lighting for a frame | open | `renderer.render` then `tryBakePmrem` then materials `needsUpdate` |
| C | Theme attribute flips after first paint so puck/edge colors swap | open | Theme is `data-framer-theme`; component previously used one puck color |

## Attempts

| When | What we tried | Result | Keep? |
| --- | --- | --- | --- |
| 2026-09-12 | Start from a theme puck-color face (no procedural gradient); bake env before first paint; apply light/dark puck and edge colors from `data-framer-theme` | shipped in `RotatingIcon.tsx` | yes |

## What worked

-

## What did not work

- Do not retry: `@react-three/fiber` / drei on Framer r136 (see hero-rotating-icon-missing).

## Root cause

First paint used a leftover rainbow procedural face texture, then swapped to the logo composite.

## Fix

First face texture is the theme puck color, not the leftover rainbow procedural map. PMREM bakes before the canvas is appended. Light/dark puck and edge colors follow `html[data-framer-theme]`.

## Follow-up

Theme-aware puck/edge controls requested with this fix.
