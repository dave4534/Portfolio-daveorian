# RotatingIcon — handoff notes

## What this is

A draggable 3D "app icon puck" — reverse-engineered from the interaction on
[danield.design/case-studies/clocks](https://www.danield.design/case-studies/clocks).
That page uses a `<canvas data-engine="three.js r176">` with `cursor: grab`,
and dragging it genuinely rotates a 3D object (confirmed by inspecting the
live page: real WebGL2 context, drag changes the mesh's rotation, not a CSS
transform). This component reproduces that mechanism from scratch — it's
not copied code, since none was accessible, just the same technique
(a hand-built squircle mesh in three.js + pointer-drag rotation).

## Files

- **`RotatingIcon-Preview.html`** — double-click this one. It's a fully
  self-contained file (three.js is embedded inside it as base64 and loaded
  from a Blob URL, so there's zero network call and zero build step) —
  opens straight in your default browser and auto-rotates on load; drag to
  spin it yourself. This is a plain-JavaScript version of the component,
  built only for viewing — not the file you paste into Framer.
- **`for-framer/RotatingIcon.tsx`** — Framer-targeted source. After the
  Portfolio 4 hero work this is **not** a copy of the sandbox file. The
  live Framer `RotatingIcon.tsx` is edited through Framer Agent. The
  live Framer file is **vanilla Three.js** (no Fiber/drei) against bundled
  **r136** (`texture.encoding` / `renderer.outputEncoding`). PMREM uses a
  16×8 mipmapped equirect, after the first paint. Canvas editor still shows
  a flat 2D puck (`useIsStaticRenderer`).
- **`for-framer/RotatingIcon.framer.tsx`** — original thin
  `addPropertyControls` wrapper for the R3F file. Do not paste this into
  Framer as a second component; the live project already has one code file.
- **`for-framer/logos.ts`** (mirrored as `dev-sandbox/src/logos.ts`) — logo
  artwork as a `data:` URI. **This** pair may still be copied both ways.
- **`dev-sandbox/`** — Vite preview of the **R3F / modern Three** puck
  (`npm install && npm run dev`). Framer does not use this folder.

### Do not re-sync the two `.tsx` files

`dev-sandbox/src/RotatingIcon.tsx` and `for-framer/RotatingIcon.tsx` used
to be kept byte-identical. That rule is **revoked**.

| File | Runtime | Stack |
| --- | --- | --- |
| `dev-sandbox/src/RotatingIcon.tsx` | local Vite | R3F + Three r165-class APIs |
| Framer project `RotatingIcon.tsx` | published / Preview | vanilla Three **r136** (or CSS 3D until that rewrite lands) |

Copying sandbox → Framer (or "sync both copies") will put Fiber back on
Framer's r136 and the mesh will not paint. Copying Framer → sandbox will
break the local R3F preview. Port a change by hand only when the same
behavior is wanted in both runtimes.

## How it works (for context when editing)

The puck is three separate meshes grouped together, not one fused shape:

1. **Front cap** — a flat `ShapeGeometry` (a rounded-rect "squircle" path)
   with the gradient+glyph (or logo) texture mapped on it
   (`MeshPhysicalMaterial`, matte finish per request — see "Lighting and
   material" below).
2. **Back cap** — the same flat shape, flipped 180°, sharing the *same*
   material/texture as the front cap (not a separate plain-color material)
   so the puck shows identical artwork on both faces. This isn't just two
   copies of one image glued on: the local 180° flip combines with the
   puck's own drag rotation so that once the back has fully rotated into
   view, the artwork reads correctly — not mirrored — the same way engraving
   on both sides of a coin reads right-side-up no matter which face is up.
3. **Rim** — a hand-built strip of quads that walks the shape's outline and
   connects the front and back caps, giving the puck actual thickness
   (default `0.14`, a slim ~8% of the face width — matches the reference's
   flat, shallow-depth look).

Rotation is handled by a drag rig: a `pointerdown`/`pointermove`/`pointerup`
listener on the canvas tracks horizontal drag delta only and updates a
target yaw, and the render loop eases the mesh toward that target each
frame (plus an optional idle auto-spin — on by default in the standalone
preview, off by default in the React component). Cursor is set to
`grab`/`grabbing` to match the reference. Rotation is yaw-only (around the
vertical axis) — vertical drag is read and ignored, matching the reference,
so the puck spins side to side like a turntable and can never be tipped
into an upside-down or edge-on-from-above orientation.

## Size, thickness, and motion — measured, not guessed

Everything in this section came from instrumenting the live reference
(danield.design/case-studies/clocks) rather than eyeballing screenshots. Its
`uniformMatrix4fv` calls were intercepted so the actual model-view and
projection matrices it feeds the GPU could be read frame by frame, which
gives the camera, the object's transform, and the exact rotation over time.
Two practical notes if you ever need to repeat this: the site renders on
demand and its render loop is paused while the tab is in the background, so
nothing is captured until frames are forced (a screenshot forces one) or
`requestAnimationFrame` is shimmed onto a timer; and scaling
`performance.now()` down stretches its animations out so they can be sampled
at high resolution.

What that produced:

| | Reference | This component (initial match) | This component (shipped) |
|---|---|---|---|
| Camera field of view | 50° | 50° | 50° |
| Camera distance | 1.8 units from a 0.866-unit face (2.08 face-widths) | 3.53 from a 1.7-unit face (2.08) | 2.743 |
| Face size, face-on | 52.2px inside its 96px canvas (54.3%) | 52.5px (54.7%) | 82.0px (85.4%)* |
| Thickness | 0.182 against a 0.866 face — 21% | 0.357 against 1.7 — 21% | 0.1785 — half that, per request |
| Rotation at rest | constant 0.5 rad/s, never stops | 0.5 rad/s | same |
| Landing spin | starts ~6.9 rad/s above the steady rate, decays exponentially (τ≈1.6s) | same | same |
| Drag | ~0.025 rad per pixel, with momentum after release | same | same |

The "initial match" column reproduced the reference exactly. The "shipped"
column reflects three later, explicit follow-up requests, in order:

1. Make the puck 16px bigger inside the same 96px container (52.5 →
   68.5px) — done by pulling the camera in from 3.53 to 2.743 and leaving
   fov untouched, so the perspective swell and drag feel are unchanged and
   only the size grew. The new distance was solved empirically rather than
   by a straight inverse-distance guess (perspective projection isn't
   perfectly linear that close in): fit a 1/(d − c) curve through two
   measured (distance, size) points, solved for the distance giving exactly
   68.5px, then confirmed it by re-measuring.
2. Halve the thickness (0.357 → 0.1785). This had a small side effect on
   face-on size: the front cap sits at `z = +thickness/2`, so it's the
   plane nearest the camera, and halving thickness moves that plane
   slightly *away* from the lens (by about 0.09 units) — which perspective
   shrinks the projected face-on size, from 68.5px down to 66.0px, even
   though nothing about the face geometry itself changed. This wasn't
   compensated for at the time, since the request was specifically about
   thickness, not size.
3. Make the puck a further 16px bigger (66.0 → 82.0px, marked `*` in the
   table since it's the second size increase and the first happened before
   thickness changed the baseline). Camera distance went from 2.743 to
   2.232, re-derived the same way: measure two (distance, size) points at
   the *current* thickness, fit 1/(d − c), solve for the distance giving
   exactly 82.0px, confirm by re-measuring. The two-point fit was redone
   from scratch rather than reusing the earlier fit's `c`, because `c`
   depends on thickness (it's related to the front cap's z-offset) and
   thickness had changed in step 2 — see "Verification" below for the exact
   method, and reuse it rather than assuming any prior fit still holds if
   thickness or distance changes again.

**Two things here are worth understanding, because both caused wrong
guesses earlier in this project.**

*The field of view is part of the size.* At 50° from barely two face-widths
away, the puck's corners swing measurably closer to the camera as it turns,
so its silhouette **swells about 25% when it's rotated versus face-on** —
that near-macro perspective is a lot of what makes it read as a solid object
rather than a flat sticker. An earlier version used a 30° lens pulled
further back, which flattened that out. Worse, because it's always turning,
almost every screenshot catches it mid-rotation: sizing our face-on puck to
match a *rotated* reference screenshot made it come out about 20% too big,
and it kept "measuring correct" against the same flawed comparison.

*It never comes to rest.* The reference's rotation rate is a flat 0.5 rad/s
forever — its landing animation is simply a faster spin easing down into
that rate, not a spin that settles facing front. An earlier version modeled
it as a damped spring that swung out and stopped, which is why it never
looked like the original no matter how the spring was tuned. `autoRotate`
is therefore on by default here.

The `size` prop is only a fallback `minWidth`/`minHeight` for standalone
use — it has no effect once Framer or a wrapping div gives the component a
real box. **The container's size is what sets the puck's on-screen size**,
and the puck fills ~85% of it (upsized from the reference's own ~54% fill —
see "Size, thickness, and motion" above). In a 96×96 box that's an 82px
puck; in a 200×200 frame the same component draws a ~171px puck. This is why
`RotatingIcon.framer.tsx` declares `@framerIntrinsicWidth/Height 96` — so it
lands on the Framer canvas at the intended 96×96 size instead of Framer's
default 200×200 frame, which renders it about twice as large.

## Dragging

Drag is yaw-only: horizontal movement spins the puck like a turntable and
vertical movement is read and ignored, so it can never be tipped or tumbled
into an upside-down pose. Sensitivity is `0.025` rad/px (measured off the
reference), and releasing mid-swipe hands the pointer's speed to a momentum
term that coasts and decays (`flickDecay`, default 0.6s) — the reference
does this too; a flick there keeps turning for roughly as long again as the
drag itself.

**One detail that matters far more than it looks:** `pointermove` and
`pointerup` are bound to `window`, not to the canvas. The icon is only 96px
across, so a normal drag leaves it almost immediately. An earlier version
bound those listeners (and a `pointerleave` handler) to the canvas element,
so the rotation stopped dead the instant the cursor crossed the icon's edge
— which in practice reads as "dragging doesn't work". If you refactor the
input handling, keep the move/up listeners on `window`.

The continuous spin is written straight onto the mesh each frame, and only
the pointer's contribution runs through the easing (`damping`). Easing the
spin as well made the landing animation ramp up from a standstill instead of
starting at full speed.

## Lighting and material (glossy vs. matte, and why brightness needed a fix)

An earlier version of this component lit the puck with only ambient +
directional lights, to avoid needing an external HDRI/environment asset —
but at the time the material used `MeshPhysicalMaterial`'s `clearcoat` layer
for a glossy look, and clearcoat only produces a visible highlight when
there's an environment map for it to reflect. Without one, the puck
rendered as a flat, evenly-lit gray disc.

The fix at the time: a tiny 2×2 canvas gradient (`buildEnvironmentTexture`
in `RotatingIcon.tsx`, `buildEnvironmentTexture()` in the standalone HTML)
is baked into a PMREM environment map via three.js's own `PMREMGenerator`
and assigned to `scene.environment` — no external file, no network call,
just a few lines of canvas + three.js core. This machinery is still in
place and still runs, but its job changed with a later, explicit request to
switch the puck to a **matte finish** instead of glossy:

- `clearcoat` is now `0` on both `frontMaterial` and `edgeMaterial` (no
  clearcoat layer at all).
- `roughness` went from `0.4` to `0.9` (soft/no specular highlight instead
  of a tight shiny one).
- `metalness` went to `0` (a metallic surface tints its highlight and never
  reads as truly matte, even at high roughness).
- `envMapIntensity` dropped from `0.25`/`0.5` to a shared `0.08` — just
  enough that the puck doesn't look completely flat/unlit, without
  producing a visible reflection.

This was modeled on a specific reference the request pointed at: the orange
sphere (`MeshPhongMaterial`, `shininess: 80`, no environment map at all) on
[threejsdemos.com's material comparison gallery](https://threejsdemos.com/demos/basics/materials-gallery)
— chosen over the shinier white PBR sphere on the same page specifically for
having no visible highlight or reflection. `MeshPhongMaterial` isn't part of
this component's PBR pipeline, so the look was translated into the nearest
`MeshPhysicalMaterial` equivalent (high roughness, no clearcoat, no
metalness) rather than copied as literal numbers, and confirmed by
screenshot against the live component rather than assumed.

The scene's ambient/directional lights were raised in an earlier round
(ambient `0.7 → 1.75`, key light `1.1 → 1.4`) to bring the overall face
brightness up to match the reference's measured ~220-238 (out of 255) face
tone — that's still in effect and is the lever to reach for if the puck
ever looks too dark, since it doesn't wash out a textured logo the way
environment reflections can. The default `logoBackgroundColor` was also
changed from pure `#FFFFFF` to `#EDEDED`, a soft off-white measured
directly off the reference icon's face.

If a future request goes back to a glossy look, the values to restore on
both `frontMaterial` and `edgeMaterial` are: `roughness: 0.4`, `metalness:
0.04`–`0.05`, `clearcoat: 0.5`–`0.6`, `clearcoatRoughness: 0.25`–`0.3`, and
`envMapIntensity: 0.25` (front) / `0.5` (edge).

**Two things that broke during development, worth knowing if you touch the
geometry code:** a hand-rolled `THREE.Shape` path needs to wind
counter-clockwise or its front face gets back-face-culled and disappears;
and if you ever try to rebuild the rim from `ExtrudeGeometry`'s material
groups instead of the manual quad-strip approach used here, don't trust
which group index is "sides" vs "caps" — it isn't consistent across
three.js versions, and got this backwards once already during development
(silently duplicated the front face onto the rim and hid the texture).

## Setting up the dev sandbox (optional, for iterating outside Framer)

```bash
cd dev-sandbox
npm install
npm run dev       # opens a Vite dev server with the icon on screen
```

`npm run build` type-checks and bundles it; both were run and passed before
this was handed off.

## Putting it in Framer

The `/data-capture-2` hero already has a `RotatingIcon` code file
(`bjvMHAu`). Edit that file through Framer Agent. Do **not** add
`@react-three/fiber` or a second numbered code file.

Framer resolves `import … from "three"` to **r136** and inlines it (same
as [rotating3dlogo.framer.website](https://rotating3dlogo.framer.website/)).
A Fiber + r165 paste from `dev-sandbox` will not draw.

Historical paste steps (R3F + `logos.ts` + wrapper) are obsolete for this
project. Keep them only as a record of the original handoff.
3. Drag "RotatingIcon" from the Insert panel onto the canvas. It lands at
   96×96 — the reference icon's real container size — and draws an ~82px
   puck inside that (bigger, thinner, and matte compared to a strict
   reference match, per requests). Property controls (colors, corner
   radius, drag sensitivity, auto-rotate, intro spin, etc.) appear in the
   right panel. Resizing the frame scales the puck with it: the puck always
   fills about 85% of whatever box Framer gives it, so a 200×200 frame
   draws a ~171px puck. If it ever looks too big or small, the frame is the
   thing to change, not a prop.
4. Use the "Custom Artwork" image control to swap in your own logo — see
   "Swapping the logo" below for what makes a logo look right on the puck.

## Swapping the logo

The puck currently ships with the Salesforce cloud logo as its default
front-face artwork (`SALESFORCE_LOGO_DATA_URI` in `logos.ts`), in place of
the original procedural gradient+chevron demo. The component does not map
your image edge-to-edge onto the front face — most real logos are wordmarks
or wide/non-square lockups with transparent padding, and stretching one to
fill a square would look wrong. Instead it composites your image onto a
solid-color square canvas first: scaled to fit (never cropped or
stretched), centered, with a margin around it — then maps *that* square as
the texture. Three props control this:

- **`imageUrl`** — any browser-loadable image source: a PNG/JPG/SVG path,
  or (simplest for a self-contained file) a `data:` URI. In Framer this is
  the "Custom Artwork" control instead of a prop.
- **`logoBackgroundColor`** (default `#FFFFFF`) — the fill behind the logo,
  so a transparent-background SVG/PNG doesn't show a checkerboard.
- **`logoPadding`** (default `0.16`) — margin around the logo as a fraction
  of the square, per side. Raise it for a logo that looks too large/tight;
  lower it for one that looks too small. This value is meant to be the
  *only* margin in play: before fitting, the code first trims any empty
  space baked into the source image itself (see below), so `logoPadding`
  isn't fighting invisible padding you can't see or control.

**Why "contain to fit" isn't quite enough on its own:** a lot of source
logos are authored on a canvas noticeably bigger than the visible artwork —
the Salesforce SVG here declares a 100x100 viewBox, but the cloud+wordmark
shape inside it only actually occupies about 59x42 of that. Naively
"containing" the full 100x100 canvas inside the padded square shrinks the
logo by that same hidden margin on top of `logoPadding`, so it reads much
smaller than intended (this is what made the logo look tiny before this was
fixed). `compositeLogoTexture` in `RotatingIcon.tsx` (and its counterpart in
`RotatingIcon-Preview.html`) works around this with a `getOpaqueBounds`
helper that rasterizes the image to an offscreen canvas, scans its alpha
channel for the actual bounding box of non-transparent pixels, and fits
*that* box — not the image's raw width/height — into the padded square.
That's also why the default `size`/`thickness`/`logoPadding` values in this
handoff were tuned by directly measuring the reference icon on
danield.design/case-studies/clocks (its canvas renders at 96x96 CSS px,
and its glyph fills roughly 65% of the face) rather than guessed.

To use your own logo instead: base64-encode it
(`base64 -i your-logo.svg | pbcopy` on macOS) and replace the value of
`SALESFORCE_LOGO_DATA_URI` in `logos.ts` (or add a new exported constant
and pass it via the `imageUrl` prop / Framer's image control) with
`data:image/svg+xml;base64,<paste>` (swap the MIME type for PNG/JPG). If
you're using the Framer image control instead of a data URI, Framer
resolves that to its own hosted URL automatically — no encoding needed
there, `logoBackgroundColor`/`logoPadding` still apply.

**If you touch this logic:** the loading is asynchronous (needed for `img`
elements, especially SVG data URIs, which don't decode synchronously) —
`useIconTexture` in `RotatingIcon.tsx` shows the procedural gradient while
the image loads, then swaps in the composited texture once ready, via a
`useEffect` + `useState` pair. There's a subtle trap here worth flagging
explicitly: `RotatingIcon`'s top-level function builds a `merged` props
object (`{ ...DEFAULTS, ...props }`) specifically so a default `imageUrl`
works when the caller doesn't pass one — passing `props.imageUrl` (the
*unmerged* value) to `Scene` instead of `merged.imageUrl` anywhere would
silently discard that default and always fall back to the procedural
texture, which is exactly the bug hit and fixed once already during
development.

## Handoff prompt for Claude Code / Cursor

If you want an agent to keep iterating on this before/after it's in Framer,
something like this is a reasonable starting instruction:

> There are two implementations. `dev-sandbox/src/RotatingIcon.tsx` is the
> R3F / modern-Three puck for local Vite preview. The Framer project's
> `RotatingIcon.tsx` is a different file: vanilla Three against r136 (or
> the CSS 3D stand-in until that rewrite). Do not copy one over the other.
> `logos.ts` may still be shared. `RotatingIcon-Preview.html` is a plain-JS
> r176-style preview — port geometry there only if you want the HTML
> preview updated. The Vite sandbox (`npm install && npm run dev`) is for
> the R3F file only. Do not add `@react-three/fiber` to the Framer project. `logos.ts` holds logo artwork as
> `data:` URIs — if you change how the front-face texture is built (see
> "Swapping the logo" above), port the same change to the vanilla-JS
> `compositeLogoTexture`/`loadLogoTexture` functions in
> `RotatingIcon-Preview.html` too. The fov, thickness, rotation rate,
> intro-spin decay and drag sensitivity are all matched to measurements taken
> off the live reference (see "Size, thickness, and motion" above) — don't
> change those values without re-measuring. Camera *distance* is the one
> exception: it's intentionally detuned from the reference's own value (2.743
> instead of the reference-matching 3.53) per an explicit request to render
> the puck 16px bigger inside the same 96px box — if a future request changes
> the target size again, re-derive distance empirically (fit size ≈
> k/(distance − c) through two measured points, don't assume a straight
> inverse-distance scaling) rather than assuming 3.53 is the "correct" value
> to fall back to. Be aware that the puck is always rotating, so a screenshot
> of it is not a face-on view — freeze it first (`autoRotate: false`,
> `introSpinSpeed: 0`) when measuring size.
> [Describe what you want changed here.]

## Verification already done

- `npx tsc --noEmit` on the React component — passes.
- `npm run build` in `dev-sandbox` — passes (one non-blocking chunk-size
  warning from bundling three.js, expected).
- Both the React version (in the Vite sandbox) and the standalone
  `RotatingIcon-Preview.html` were rendered headlessly with Playwright —
  the latter specifically via a `file://` URL, the same way opening it by
  double-click loads it — and visually confirmed: the puck renders with
  `cursor: grab` matching the reference, and dragging visibly rotates the
  puck and reveals the rim.
- The logo-swap path was verified specifically: the Salesforce logo (a
  wide, non-square SVG with a transparent background) renders centered,
  correctly scaled, and on a white background in both the React version and
  the standalone HTML, before and after a simulated drag — confirming the
  aspect-preserving composite (not a raw stretched texture) and that the
  async image load doesn't race the initial render.
- The proportion/thickness/back-face pass was verified by measuring the
  reference icon directly (pixel-analyzing a screenshot of
  danield.design/case-studies/clocks to get its actual on-screen size and
  glyph-to-face ratio), then confirming in both the React version and the
  standalone HTML: the logo now fills a comparable share of the face
  (previously ~40%, now ~65%, matching the reference), the puck reads
  visibly thinner, and dragging a full ~180° reveals the same logo on the
  back, correctly oriented rather than mirrored.
- The camera/size/motion pass was verified against the reference's own
  captured matrices rather than against screenshots (see "Size, thickness,
  and motion" above for why screenshots were misleading). Both the React
  version and the standalone HTML were instrumented the same way the
  reference was — reading the rim mesh's model matrix each frame — and
  measured:
  - face-on size **52.5px inside a 96px box**, against the reference's
    52.2px (previously ~62px, about 20% oversized);
  - steady rotation **0.55 rad/s** at t=8s, against the reference's 0.5,
    with the intro decay tracking the reference's curve at every sampled
    point (3.67 vs 3.20 at 1.5s, 0.85 vs 0.80 at 5s);
  - drag tracking correctly both inside the canvas and **200px outside it**
    (7.5 rad of rotation, i.e. the drag keeps working after the cursor
    leaves the 96px icon — the specific bug that made dragging feel dead);
  - vertical drag still has zero effect (yaw only, no tilt);
  - no console or page errors in either version.
  One measurement trap worth recording, since it produced a wrong reading
  first: when the puck is near ±90°, the front and back caps sit at the same
  camera-space depth as the rim, and the back cap carries a 180° flip — so
  selecting the mesh by depth silently mixes the two and yields nonsense.
  Select it by its model matrix having exactly zero translation instead
  (only the rim does).
- The first size-increase pass (making the puck 16px bigger, once the
  camera/size/motion match above was already confirmed) was verified with
  the same pixel-bounding-box method: rotation frozen face-on
  (`autoRotate: false`, `introSpinSpeed: 0`, temporarily, then reverted), a
  screenshot at 4x device scale, and the ink bounding box measured against a
  sampled background pixel. That confirmed **68.50px in the 96px box**
  (52.5 + 16, exactly) in both the React build and the standalone HTML at a
  camera distance of 2.743. The distance wasn't derived from a straight
  inverse-distance scaling guess — a quick two-point fit of size ≈
  k/(distance − c) (using the 3.53→52.5px point and an initial estimate's
  measured point) was solved for the distance giving exactly 68.5px, since
  perspective size isn't perfectly linear in distance this close to the
  lens. `npx tsc --noEmit` and `npx vite build` both pass clean afterward,
  and the rotation/drag verification above was re-run to confirm the camera
  change didn't disturb them.
- The matte-finish pass was checked visually rather than by pixel
  measurement, since "matte" is a qualitative look rather than a number to
  hit: the reference material (an orange `MeshPhongMaterial` sphere with no
  environment map) was loaded and screenshotted live in a browser first, to
  confirm what "matte" meant concretely rather than guessing from the name,
  then the same look was reproduced by screenshotting the puck at two
  different rotation angles after the change — both show a smooth, even
  diffuse gradient with no bright highlight and no visible environment
  reflection, matching the reference sphere. `npx tsc --noEmit` and
  `npx vite build` both pass clean, and the standalone HTML was screenshotted
  separately to confirm it matches the React build.
- The second size-increase pass (a further 16px, on top of the
  already-thinner, already-matte puck) was verified the same way as the
  first: rotation frozen face-on, 4x-scale screenshot, ink bounding box
  measured. That confirmed **82.00px in the 96px box** (66.0 + 16, exactly)
  in both the React build and the standalone HTML at a camera distance of
  2.232, re-derived from a fresh two-point fit at the current (halved)
  thickness rather than reused from the first size pass's fit (the fit's
  `c` constant shifts with thickness — see "Size, thickness, and motion"
  above). `npx tsc --noEmit` and `npx vite build` both pass clean, and the
  rotation/drag verification was re-run with no regressions.
