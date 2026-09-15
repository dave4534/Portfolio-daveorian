# Architecture

How this Framer site should be built. Agents: read this before changing nav or any code file. Behavior and tooling live in `AGENTS.md`.

## Source of truth

The **Framer canvas** is the site. This repo is a sidecar (bugs, notes, snapshots). Edit via Framer Agent, not Unframer, unless Agent cannot do the job.

## Target

Canvas owns structure, look, and motion:

- Frames, stacks, components, variants, gesture variants
- Appear / scroll effects
- Layout templates
- Color and text styles

**Code is a last resort.** It hydrates after first paint. Using it for layout, styling, or motion has caused flashes and dead springs.

Allowed code: things the canvas cannot do (storage, clipboard, other browser APIs). Then:

1. One **override** on an existing node, not a new code component.
2. One export that is actually attached on the canvas. Do not add `projectNavSwitcher8` (or similar) if an existing export can be fixed.
3. Ask before creating a new code file.

If native and code both work, present both and wait.

## Color

**Light mode only.** Design in Framer **Assets → Colors** and **Assets → Styles** (text/link presets). The canvas is the source of truth for values and wiring.

Published sites still need `<style id="p4-theme-tokens">` in `<head>` so token CSS wins over `prefers-color-scheme`. Regenerate from `ColorStyleTokenNode` Light values after color edits, then publish. Head snippet locks `data-framer-theme="light"`.

Do not use Light/Dark component variants for color, `Dark/*` text clones, or raw hex for new work. Do not reattach legacy theme exports (`projectNavSwitcher*`, `themeSwitcher`, `variantSwitcher`, `withThemeToggle`). `homePageFrame` in `Theme_Toggle.tsx` is for Home scroll/anchors only.

## Nav

Applies to **all project pages** (archetype `/data-capture`; same pattern on `/meetings`, `/receptionist`, etc.). Does **not** apply to `/` (Home).

**One source of truth:** behavior lives in the **`Nav - Project`** component (`HWIvXUQkr`) and this spec. Each page only supplies its own Hero id, post-hero scroll-section id, and `$control__projectName`. Do not fork nav logic per page in code.

Component: `Nav - Project` (`HWIvXUQkr`). Variant axes:

| Axis | Variants | Notes |
| --- | --- | --- |
| Scroll (desktop) | **Project Landing** ↔ **Scroll** | Center brand hidden vs visible |
| Scroll (phone) | **Phone Close** ↔ **Phone Close Scroll** | Same brand behavior on phone |
| Work menu | **Work Closed** ↔ **Work Open** | Gesture variant on Nav Button |
| Device | desktop bar vs phone bar | Separate primary/replica trees |

All chrome in a given state shares the same styling (border color, text style, etc.).

### Default — Project Landing

Hero content (Rotating Icon + project title) is still in view below the nav. Nav center is empty.

- **Left:** Home button (border + arrow icon).
- **Right:** Selected Work (Nav Button variant toggle Work Closed ↔ Work Open; Work Open shows the `Work Menu` instance plus a transparent `Menu Scrim` whose tap returns to Work Closed).
- **Center:** empty. Logo + project name live in the hero, not in the nav.

On Landing, the **Brand** cluster inside **Brand Clip** must be hidden (opacity 0 or absent from the published tree).

### Scroll — logo + project name in nav center

**Trigger:** When the hero **Rotating Icon** scrolls up and tucks **behind** the nav bar, the nav switches from **Project Landing** to **Scroll**. The icon and title that were in the hero effectively “move into” the nav center.

On `/data-capture` the scroll target is the Hero frame on the page (`KlLr2x5pz`, publishes `#project-hero`). The bound scroll sections use Hero → **Project Landing** and the first post-hero section → **Scroll** (switches at ~900px on desktop).

**Scroll variant content (center):**

- Logo + project name (e.g. “Data Capture”) inside **Brand Clip** → **Brand**.
- Logo: opacity 0 → 100, duration **300ms**.
- Project name: Framer **on appear** text effect, **per word**, delay **0.08s**, **Y offset 20**, **spring**.

Scrolling back to the top reverses: **Scroll** → **Project Landing**, brand hides again.

### Implementation (native — required on every project page)

Framer **scroll variant effects do not bind** on a nav instance that only lives inside a layout template on the published site. Apply this checklist per page:

1. **Page-local** `Nav - Project` instance on each breakpoint (duplicate from a working page such as `/data-capture` `TRXibUtE7`). Hide the layout-template nav copy (`visible=false`).
2. `scrollVariantEffect` `onScrollTarget`:
   - **Desktop/tablet:** Hero instance → **Project Landing** (`uoGuBs61d`); first post-hero section (`#project-showcase`) → **Scroll** (`MGs_j6C3W`).
   - **Phone:** same Hero / post-hero ids with **breakpoint prefix** → **Phone Close** (`vkGnEeaBv`) / **Phone Close Scroll** (`XxFypMZAU`).
3. `position: fixed` — the template page-content wrapper clips sticky.
4. `$control__projectName` on the page nav instance (e.g. “Data Capture”, “Meetings”).
5. Do not remount with `key={variant}` or hide nav with `data-pn-nav-ready`.

| Page | Page nav (desktop) | Hero target | Scroll-section target | Project name |
| --- | --- | --- | --- | --- |
| `/data-capture` | `TRXibUtE7` | `KlLr2x5pz` (Hero) | first post-hero section | Data Capture |
| `/meetings` | `iKdatZKKR` | `v7eC9tAT6` | `EnLkrlC0A` (Key Value Container) | Meetings |

Verify live: after scrolling past the hero, `nav[data-framer-name]` should read **Scroll** and **Brand** should show the page project name. Case history: `docs/bugs/2026-09-11-project-nav-chrome.md`, `docs/bugs/2026-09-13-nav-scroll-brand-missing.md`.

### Legacy code (do not attach)

Before the native page-local nav shipped, `projectNavSwitcher*` in `Theme_Toggle.tsx` (rollback copy: `.cursor/p4-rollback/Theme_Toggle.tsx`) drove the same UX in JS:

- `readHeroAtTop()` — compares hero logo (or hero bottom) to nav top.
- Sets `html[data-pn-scrolled="0|1"]`.
- Injects CSS for **Brand Clip** / **Brand** opacity, transform, and per-word title delays.

That path is **deprecated**. Do not reattach it unless native scroll variants cannot be restored and the user explicitly chooses code.

Related cases: `docs/bugs/2026-09-11-project-nav-chrome.md`, `docs/bugs/2026-09-12-nav-project-locked.md`, `docs/bugs/2026-09-12-work-menu-no-toggle.md`.

## Decision gate (every change)

1. Can this be a variant, effect, or color/text style? If yes, do that. Color must use a Framer color style from Assets → Colors.
2. If not, smallest override on the existing node.
3. Do not hide layers or remount to cover a first-paint mismatch.
4. Do not rebuild old code-heavy work unless asked.

## Verify

Live site and Framer Preview diverge. If the bug or change is live, measure live. Preview is not a substitute.
