# BUG: project nav chrome vs spec

- **Status:** fixed on `/data-capture-2` (other project pages still use other templates)
- **Date:** 2026-09-11
- **Surface:** live site
- **Pages:** `/data-capture-2` (project nav; not `/home-redesign`)
- **Related:** [architecture project nav spec](../architecture.md) · [project-nav-theme-delay](2026-09-11-project-nav-theme-delay.md) · [theme-toggle-icon-spring](2026-09-10-theme-toggle-icon-spring.md)

## Symptom

Reported on live Portfolio 4 after the foundation extract. Spec is in `docs/architecture.md` (Project nav).

1. Home button is missing its border and arrow icon.
2. Selected Work button is missing entirely (not visible).
3. Theme switch: delay before the theme changes; the button disappears between states.
4. Nav does not follow Default vs Scroll. On landing, logo + project title already appear in the center of the nav (should only happen after the hero logo leaves view).
5. Dark theme footer: text is black; icons are not displayed.

## Repro

1. Open live `/data-capture-2` (`https://sustained-standards-647886.framer.app/data-capture-2`).
2. Compare the nav to Default (no scroll) vs Scroll (hero logo out of view).
3. Click the theme switch.
4. In dark theme, check the footer copy and social icons.

## Hypotheses

| ID | Claim | Result | Evidence |
| --- | --- | --- | --- |
| A | Home/Work chrome was lost when Light variants were deleted or when fills were tokened | **confirmed** | Live `/data-capture-2`: Home is an `<a>` with UA blue text, **no computed border**, arrow SVG fill white (`$control__color rgb(255,255,255)`). Work instance pinned to **Dark Closed**: label `rgb(255,255,255)` on light nav (invisible). Light Closed still exists with dark text + `rgba(17,17,17,0.14)` border. |
| B | Work control is present but zero-opacity / off-canvas / wrong breakpoint variant | **confirmed** (wrong variant / white-on-white, not off-canvas) | Node present at x=1166, 160×45; Trigger fill `rgba(17,17,17,0)`; white label. |
| C | Theme click still hydrates late; CSS icon layers or toggle root unmount between themes | **confirmed** (code component, not CSS) | Visible control is `ThemeToggleButton` (`E4ARX6LKz`, `codeFile/ikA4mfq:default`). Native **Theme Toggle Switch** `qZtNEdTQ1` is `visible=false`. Architecture: do not attach ThemeToggleButton. |
| D | Landing uses the Scroll variant (or center cluster is visible in Default) | **confirmed** (Brand visible in Default; scroll effect incomplete) | Live navName stays `Project Landing` after 900px scroll. Brand at y=0 in both variants. Template nav `scrollVariantEffect` is only `{trigger:onInView, replay, threshold:0}` — **from/to variants missing** after Light-variant delete. |
| E | Footer on the archetype is pinned to a light tree while `data-framer-theme=dark`; social `variantSwitcher` was stripped so dark icons never show | **confirmed** (tokens, not missing Dark variant) | Footer stays **Desktop**. Dark: bg token OK; name uses **Dark Link** → `rgb(2,2,2)`; Phosphor icons fill `rgb(24,24,24)` = dark background. |

## Attempts

| When | What we tried | Result | Keep? |
| --- | --- | --- | --- |
| 2026-09-11 | Wrote spec + this case from user report; did not start a fix | logged | yes |
| 2026-09-11 | Live dump + canvas serialize (session 20, Portfolio 4). Native fix: token Home/Work/toggle/footer chrome; hide Brand on Landing/Phone Close; restore scrollVariant from→to; hide ThemeToggleButton, show native switch | in progress | yes |
| 2026-09-11 | Token Home/Work/toggle/footer; show native Theme Toggle Switch; hide `ThemeToggleButton`; Theme/Nav Link preset; head CSS targets Sun/Moon layer names | Live **c834a074b** / **bf336c175** / **76e242688**: items 1–3 and 5 pass on desktop `/data-capture-2` | yes |
| 2026-09-11 | Restore `scrollVariantEffect` on template nav: `onScrollTarget` Hero→Landing + Showcase→Scroll; also tried `onInView` from/to and `onScrollDirection` | **No live variant change.** navName stays `Project Landing`. `directionTarget` does not persist with `onInView`. | no — do not retry the same template-nav scrollVariantEffect shapes unless the nav is no longer a layout-template child |
| 2026-09-11 | Landing Brand `opacity:0` + `appearEffect.trigger=onScrollDirection` (300ms) | Live Brand stays `opacity:0` after `scrollTo` and mouse `wheel`. Template sticky nav does not run scroll appear. | no — same constraint |
| 2026-09-11 | Template-local scroll trackers `WmiBHGQoC` / `PACYvZSa8` in the same template tree as the nav; `onScrollTarget` to those frames | Trackers published and moved with scroll, but `elementId` did not publish and navName stayed `Project Landing`. | no — template-instance scroll variants still do not bind |
| 2026-09-11 | Native page-local `Nav - Project` `TRXibUtE7` on `/data-capture-2`; hide template nav `E4x8h0Y9z`; `onScrollTarget` Hero `#project-hero` → Landing, Showcase → Scroll. Phone replica Close / Close Scroll. `position: fixed` after layout-template overflow clip killed sticky. | Live **80ac9a304** / **79a742014**: desktop Landing → Scroll at ~900px with Brand `Data Capture`; back to Landing; phone Close → Close Scroll; nav stays at `top: 0`; theme click and dark footer still pass. | yes |

## What worked

- Token `Theme/Border` + `Theme/Text Primary` / `Theme/Link Rest` on Home, Selected Work (Dark Closed), toggle, footer name, social Phosphor color.
- Hide `ThemeToggleButton`; show native Theme Toggle Switch. Click listener already matched `nav button` with ≥2 SVGs. Head CSS now keys off `[data-framer-name="Sun Layer"]` / `Moon Layer` because `elementId=p4-theme-toggle` does not publish.
- Landing center empty: Brand starts at opacity 0 (no longer visible on first paint).
- Default vs Scroll: instance `Nav - Project` on the **page** (not the layout template) with `scrollVariantEffect` `onScrollTarget` mapped to page sections that publish ids. Only `/data-capture-2` uses `Project Light`, so hiding the template nav does not affect other routes. Layout-template page breakpoints own `overflow` and clip sticky; `position: fixed` keeps the bar on screen.

## What did not work

Do not retry from the theme-delay / toggle-spring cases unless the runtime changed:

- Driving canvas springs via React `variant` on the toggle
- Hiding nav with `data-pn-nav-ready`
- Remounting nav with `key={variant}`
- Treating `ThemeToggleButton` as the fix

Do not retry on a layout-template nav instance:

- `scrollVariantEffect` `onScrollTarget` / `onInView` / `onScrollDirection` on `Project Light` nav instance `E4x8h0Y9z`
- `appearEffect` `onScrollDirection` on Landing Brand
- Template-local tracker frames (`Nav Scroll Hero` / `Nav Scroll Rest`) as scroll sections for that template nav
- `overflow: visible` on the **page** breakpoint while a layout template is applied (Framer rejects it; apply overflow on the template breakpoint instead — that still does not unclip the published page-content wrapper)

## Root cause

Items 1–3, 5: leftover Dark-variant hardcoded whites/blacks after the Light-axis delete; Work pinned to Dark Closed; ThemeToggleButton attached; footer **Dark Link** + untokened Phosphor.

Item 4: Framer scroll variant on a **nav instance inside a layout template** does not bind to page (or even template-local) scroll sections on the published site. Canvas variants themselves are correct. Sticky inside the template's page slot is also clipped by a published overflow wrapper we cannot set from the page breakpoint.

## Fix

Shipped natively on `/data-capture-2`. Item 4: page instance `TRXibUtE7` of `Nav - Project`, template instance `E4x8h0Y9z` hidden, footer stays on `Project Light`. Scroll sections are Hero `w2F_4JceF` / Showcase `caKU7ST3r` (phone replica ids on the phone breakpoint). Nav is `position: fixed` so it stays at the top while those variants run.

## Follow-up

Other project pages still use `hYRzjqPrm` / `EI1e7BZTC`, not `Project Light`. When they move to this template, they need their own page-local nav (or Framer must bind template-nav scroll sections). Do not put chrome on every page as a general rule — this is the documented exception because template-nav scroll variants do not run live.
