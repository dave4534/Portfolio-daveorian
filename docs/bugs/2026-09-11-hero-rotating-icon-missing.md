# BUG: hero rotating icon missing

- **Status:** open (chrome fixed; puck is CSS 3D stand-in; debug logs removed)
- **Date:** 2026-09-11
- **Surface:** Framer Preview | live site
- **Pages:** `/data-capture-2`
- **Related:** rotating icon insert in hero (Salesforce logo replacement)

## Symptom

User does not see the rotating icon in Preview or on the live site. In Light Mode the hero headline is also missing; only the body copy shows.

## Repro

1. Open `/data-capture-2` in Framer Preview.
2. Open the live `/data-capture-2` page.
3. Look at the hero above the headline.

## Hypotheses

| ID | Claim | Result | Evidence |
| --- | --- | --- | --- |
| A | Live site was never published with the component, so production cannot show it; Preview is the only surface that could | **rejected** | Logs on `https://sustained-standards-647886.framer.app/data-capture-2`: module evaluated, Canvas `onCreated`, 96×96 rect |
| B | In Preview, `useIsStaticRenderer` is false and the WebGL Canvas never paints (r3f/three fail, missing packages, or WebGL error), leaving an empty box | **confirmed as empty paint** | Canvas mounts (`branch:canvas`, `onCreated`); default framebuffer stays `[0,0,0,0]` |
| C | The instance is in the tree but clipped, zero-sized, hidden, or off-canvas on the viewed breakpoint | **rejected** | Live rect `{x:904.5,y:357.45,width:96,height:96}`; Preview `{x:544.5,y:343,width:96,height:96}` |
| D | The code component throws on hydrate (SSR `document`, import error, r3f) so React renders nothing | **rejected** | No `window.error` / `unhandledrejection` logs; `onCreated` succeeds |
| E | User is on a replica/page where the instance is missing, or looking at a different data-capture route | **rejected** | href is Preview `preview-module.html` and live `/data-capture-2` |
| F | r3f Canvas is created but the 3D scene draws nothing (0×0 buffer or empty/transparent pixels) | **confirmed** | Preview and live `framebuffer sample` both `{w:96,h:96,center:[0,0,0,0],corner:[0,0,0,0]}` with texture 512 and camZ 2.232 |
| G | Scene draws but pixels are near-white, so the puck disappears on the white hero | **rejected** | Samples are fully transparent, not near-white |
| H | Canvas draws but is covered by another layer (nav overlay, Preview `#work` hash) or CSS opacity 0 | **rejected** as primary | Preview/live `hitIsSelf:true`, `opacity:"1"`, `visibility:"visible"` |
| I | `PMREMGenerator.fromEquirectangular` leaves a render target bound (or dispose() mid-frame), so later r3f frames never write the canvas backbuffer | **rejected** | After `setRenderTarget(null)`, Preview/live `framebuffer sample` still `{center:[0,0,0,0]}`. No `env baked` or `frameProbe` logs — useFrame never ran |
| J | r3f animation loop never starts (`useFrame` never fires), so the scene never draws | **rejected as primary** | post-fix-2: `frameProbe` frame 1 fires with `triangles:0`. Loop runs; render throws |
| L | Hero headline onMount text effect stays at opacity 0.001, so the H1 is in the DOM but invisible | **partial** | Live SSR was 0.001. After from-state 1, Preview spans have empty/1 opacity but H1 still missing |
| P | Framer ships `three@0.146`; `THREE.SRGBColorSpace` is undefined, so textures/PMREM throw WeakMap and the mesh never draws | **confirmed** | Preview: `ga.jspm.io/npm:three@0.146.0`, `env bake failed` length of undefined, `gl.render` WeakMap, `triangles:0` |
| Q | `/Text/Primary (H1)` token is not in the `html[data-framer-theme]` sheet, so Light Mode + OS dark paints white H1 on a white page | **confirmed, and the first sheet add was invalid CSS** | Overlay `h1Color: "rgb(255, 255, 255)"` with `theme: "light"`. Tokens were glued onto the previous property: `rgb(107, 114, 128)--token-020bc62e` (missing `;`) |
| R | Framer's bundled Three cannot paint this puck; a CSS 3D `rotateY` path (no WebGL) can | **confirmed** | post-fix-4: `engine: "css3d"`, `css3d mounted`, `rot` 0 → 5.68 → 8.93 then ~0.5 rad/s. User: puck turns. This is **not** the original three.js mesh. |
| S | Headline stays white because the H1 token declaration never parsed | **confirmed; fixed** | post-fix-4: `h1Color`/`h1Fill` `rgb(0, 0, 0)`, opacity 1, text “Field service forms redesigned for the field”. User: title visible. |
| T | Selected Work chevron is a **stroke** using `--token-69daa11c`, which is white on Light | **confirmed; fixed** | live `theme:"light"` probe: `chevronStroke:"rgb(0, 0, 0)"`, opacity 1. User: chevron visible. |
| U | Chevron is hidden by opacity/transform, not color | **rejected** | `chevronOpacity:"1"`, `visibility:"visible"`, `transform:"none"` |

## Attempts

| When | What we tried | Result | Keep? |
| --- | --- | --- | --- |
| 2026-09-11 | Live HTML fetch of `sustained-standards-647886.framer.app/data-capture-2` | Live SSR is 2026-09-09; `RotatingIcon` count 0; `Salesforce` count 3. Change was not published. | yes — evidence for A on live |
| 2026-09-11 | Canvas serialize: instance `tiwedPXZ0` exists 96×96 in hero stack; canvas screenshot showed static puck | Canvas has the instance. Preview uses WebGL path (`useIsStaticRenderer` false + `mounted` gate). | yes |
| 2026-09-11 | Added runtime logs in `RotatingIcon.tsx` (module load, render branch, mount/WebGL/rect, r3f onCreated, window errors) | Canvas hydrates in Preview and live; 96×96 on-screen; `onCreated` succeeds. Still invisible. | yes |
| 2026-09-11 | Added scene/texture, `readPixels`, overlay `elementFromPoint` logs (hypotheses F/G/H) | F confirmed empty pixels; G/H rejected | yes |
| 2026-09-11 | Restore default framebuffer after PMREM (`gl.setRenderTarget(null)`); keep frame-45 pixel/triangle probes | **failed** — pixels still `[0,0,0,0]`; no useFrame/pmrem logs | no — RT restore was not the cause |
| 2026-09-11 | Headline from-state opacity 1; 2D puck behind WebGL canvas; wrap PMREM try/catch; explicit `gl.render` | Puck visible (2D). Headline still missing. Rotation fails: three r146 WeakMap | yes — 2D fallback |
| 2026-09-11 | Skip PMREM on three < r152; `sRGBEncoding` instead of `SRGBColorSpace`; add H1/body tokens to theme sheet | **failed** — H1 still white; tokens were concatenated without a semicolon so they never applied. WebGL still `triangles:0` | no — do not retry Three/PMREM |
| 2026-09-11 | Drop three/r3f. CSS 3D `rotateY` puck. Fix missing `;` on H1 tokens. Force H1 color + chevron **stroke** (`--1m973uw`) from `data-framer-theme` | Headline + chevron + spin work. Puck is a flat CSS card, not the original WebGL squircle. | yes — chrome CSS; CSS 3D was a stand-in |
| 2026-09-12 | Rewrite live `RotatingIcon.tsx` as vanilla Three (no Fiber). r136 `encoding`/`outputEncoding`. First paint, then PMREM on a 16×8 mipmapped equirect. | waiting on Preview | yes |

## What worked

-

## What did not work

- Do not retry: restoring the default framebuffer after PMREM (`gl.setRenderTarget(null)`) — pixels stayed empty and `useFrame` never ran
- Do not retry: `PMREMGenerator.fromEquirectangular` on Framer's `three@0.146.0` — throws `length` of undefined / WeakMap
- Do not retry: skip-PMREM + `sRGBEncoding` on Framer Three r136 — still 0 triangles / WeakMap
- Do not retry: appending `--token-020bc62e` immediately before `}` without a leading semicolon — the previous property had no trailing `;`, so the H1 token never parsed

## Root cause

Unknown until confirmed.

## Fix

None yet.

## Follow-up

-
