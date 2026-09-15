# Design

Contract for layout, color, and text styles on Portfolio 4 — Light Mode Only. Read this before changing fills, text color, borders, theme tokens, or text presets.

**Project:** Portfolio 4 — Light Mode Only · Framer: https://framer.com/projects/Portfolio-4-Light-Mode-Only--eU2uwvvrrUqquu9kReKG · Live: *(update after first publish)* · Archetype page: `/data-capture`

**Pages (2026-09-14):** `/` Home · `/data-capture` · `/meetings` · `/receptionist` · `/customer-view` · `/capacity-planning` · `/seller-coupons` (about-me removed)

**Source of truth:** Framer canvas (Assets → Styles, page structure). Style **values** live in Framer only — not in this file.

---

## Agent rules (styles — read first)

- **Never remove or change styles without asking Dave first.** That means Framer color/text/link presets, node `textColor` / fill wiring, and any style already on the canvas. Scanning and reporting gaps is fine; edits wait for explicit approval.
- **Permission gate (Framer):** Do **not** create or apply any Framer style unless Dave explicitly says **“create that style”** or **“apply that style”**. “Scan”, “check”, or “update” alone is **not** permission.
- **Never create new color styles** in Framer (`+ColorStyleTokenNode`, etc.) without **“create that style”**.
- **Do not treat this doc as a style value reference.** Read values from Framer Assets → Colors / Text styles, or from the canvas.

---

## Breakpoints + Nav behavior

| Tier    | Viewport       | Content max-width | Nav max width           |
| ------- | -------------- | ----------------- | ----------------------- |
| Desktop | ≥ 1200px       | 1000px            | Max-width 1000px        |
| Tablet  | 810px – 1199px | 720px             | Spans full width (100%) |
| Phone   | ≤ 809px        | full width        | Spans full width (100%) |

**Exceptions:** `/` adds ≥ 1920px. Pages on layout template **Light** add ≥ 1440px.

**Nav** uses component variants, not page media queries — wire **Tablet Landing** on each page’s tablet breakpoint (see `docs/architecture.md`). **Footer** auto-picks Desktop / Tablet / Phone variants.

---

## Color

| Layer | Where it lives | Role |
| --- | --- | --- |
| **Design** | Framer → **Assets → Styles → Colors** (and text/link presets) | Named styles (`Theme/*`, etc.). **Light mode only** — edit Light values on the canvas. |
| **Runtime (published)** | Custom Code → `<style id="p4-theme-tokens">` in `<head>` | Mirrors color styles as `--token-{uuid}`; head snippet locks `data-framer-theme="light"`. Regenerate after color edits — do not hand-edit. |

**Rule:** Edit in Assets → Colors → regenerate `p4-theme-tokens` → publish → verify live.

---

## Styles (colors + text — archived table)

<!-- Retired: style values are owned by the Framer canvas (Assets → Colors / Text). Do not use this table as a contract or for agent edits.

One table. Do not split into sub-tables without Dave’s approval.

| Style / token                               | Light                                         | Dark                                             | Typical use                                                                                                                            |
| ------------------------------------------- | --------------------------------------------- | ------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------- |
| `Theme/Stat Sideline`                       | `rgb(185, 231, 210)`                          | `rgba(185, 231, 210, 0.05)`                      | Stat accent bar                                                                                                                        |
| `Theme/Accent`                              | `rgb(4, 225, 203)`                            | `rgb(4, 225, 203)`                               | Accent (same both themes)                                                                                                              |
| `Theme/Separator`                           | `rgb(222, 222, 222)` / `#DEDEDE`              | `rgb(43, 43, 43)` / `#2B2B2B`                    | Layers named **Separator** on `/data-capture`                                                                                          |
| Home Project Tile surface color             | `#E8E8E8` / `rgb(232, 232, 232)`              | `#232323` / `rgb(35, 35, 35)`                    | **Project Tile** Default/Hover → `Theme/Surface Raised`                                                                                |
| **Audit** (fill)                            | `#000000` / `rgb(0, 0, 0)`                    | `#000000` / `rgb(0, 0, 0)`                       | Fixed black fill — do **not** tokenize or swap to `Theme/Callout`                                                                      |
|                                             |                                               |                                                  |                                                                                                                                        |
| Nav                                         |                                               |                                                  |                                                                                                                                        |
| `Theme/Button Hover`                        | `rgb(250, 250, 250)` / `#FAFAFA`              | `rgb(36, 36, 36)` / `#242424`                    | **Nav Button** / **Nav Menu Item** hover variants                                                                                      |
| `Theme/Nav Button Border`                   | `#CCCCCC` / `rgb(204, 204, 204)`              | `#424242` / `rgb(66, 66, 66)`                    | Border on all **Nav Button** variants as well as the 'Capacity Persona' border in Capacity Planning                                    |
| Nav project text                            | 000                                           | fff                                              |                                                                                                                                        |
|                                             |                                               |                                                  |                                                                                                                                        |
| Border                                      |                                               |                                                  |                                                                                                                                        |
| Research Bg Color Border                    | DBDBDB                                        | 4D4D4D                                           |                                                                                                                                        |
|                                             |                                               |                                                  |                                                                                                                                        |
| **Text**                                    |                                               |                                                  |                                                                                                                                        |
| `Theme/Link Active`                         | `rgb(3, 7, 18)`                               | `rgb(237, 237, 237)`                             | Active / hover link                                                                                                                    |
| `Theme/Link Rest`                           | `rgb(3, 7, 18)`                               | `rgb(237, 237, 237)`                             | Default nav / footer links                                                                                                             |
| `Theme/Text Body`                           | `rgb(0, 0, 0)` / `#000000`                    | `rgb(162, 162, 162)` / `#A2A2A2`                 | Text: **Body**, **Body x-small**, **Body small**, **Body bold**, **Body medium**, **Body large**, **Explainer Text**, Employment dates |
| Home anchor links text default color        | `#525252` / `rgb(82, 82, 82)` · Regular (500) | `#A2A2A2` / `rgb(162, 162, 162)` · Regular (500) | Section nav · `Dave_s_Overrides.tsx` scroll-spy CSS                                                                                    |
| Home anchor links text hover + active color | `#000000` · Semibold (600)                    | `#FFFFFF` · Semibold (600)                       | Section nav · scroll-spy CSS                                                                                                           |
| `Theme/H1`                                  | `rgb(0, 0, 0)` / `#000000`                    | `rgb(255, 255, 255)` / `#FFFFFF`                 | Text: **Heading 1**                                                                                                                    |
| `Theme/Stat Value`                          | `rgb(3, 7, 18)`                               | `rgb(3, 180, 167)`                               | Stat percentage                                                                                                                        |
| `Theme/Stat Label`                          | `rgb(107, 114, 128)`                          | `rgb(255, 255, 255)`                             | Stat topic label                                                                                                                       |
| Project Tile description (text)             | via `Theme/Text Body`                         | via `Theme/Text Body`                            | Framer preset: **Body - Typewriter** (Default + Hover)                                                                                 |
| Project Tile title (text)                   | fff                                           | 000                                              | Framer preset: **Body large**                                                                                                          |
| **Audit** (text) — Caps / H1 / H3           | `#FFFFFF`                                     | `#FFFFFF`                                        | Presets **Caps Headline**, **Heading 1** or **H3 (20px)**; fixed `textColor` override                                                  |
| **Audit** (text) — Body                     | `#A2A2A2` / `rgb(162, 162, 162)`              | `#A2A2A2` / `rgb(162, 162, 162)`                 | Preset **Body**; fixed `textColor` override — not `Theme/H1` / `Theme/Text Body`                                                       |
| 'Before' text                               | B3102E                                        |                                                  | In Meetings                                                                                                                            |
| 'After' text                                | 0C7354                                        |                                                  | In Meetings                                                                                                                            |
|                                             |                                               |                                                  |                                                                                                                                        |
| Logos                                       |                                               |                                                  |                                                                                                                                        |
| `Theme/Vonage Logo`                         | `rgb(0, 0, 0)` / `#000000`                    | `rgb(255, 255, 255)` / `#FFFFFF`                 | **Vonage** in **Logo - Project Tile**                                                                                                  |
| Vonage logo in Home                         | `#FFFFFF` / `rgb(255, 255, 255)`              | `#FFFFFF` / `rgb(255, 255, 255)`                 | **Vonage** variant in **Logo - Project Tile** on `/` — fixed white both themes (not `Theme/Vonage Logo`)                               |
|                                             |                                               |                                                  |                                                                                                                                        |
| Surface                                     |                                               |                                                  |                                                                                                                                        |
| `Theme/Background`                          | `rgb(255, 255, 255)`                          | `rgb(24, 24, 24)`                                | Page / template fill                                                                                                                   |
| `Theme/Surface Raised`                      | `rgb(232, 232, 232)` / `#E8E8E8`              | `rgb(35, 35, 35)` / `#232323`                    | Raised containers; **Project Tile** on `/` (Home)                                                                                      |
| `Theme/Mobile Screen Background` + Border   | `#E8E8E8` / `rgb(232, 232, 232)`              | `rgb(31, 31, 31)` / `#1F1F1F`                    | **Visual BG** on `/data-capture`; **Video Clipper** border                                                                             |
| Home background color                       | `rgb(255, 255, 255)`                          | `rgb(24, 24, 24)`                                | **Home Scroll** + **Redesign Canvas** on `/` (Home) → `Theme/Background`                                                               |
| `Theme/Nav Fill`                            | `rgba(255, 255, 255, 0.92)`                   | `rgba(24, 24, 24, 0.92)`                         | Project nav bar                                                                                                                        |
| `Theme/Surface`                             | `rgb(249, 250, 251)`                          | `rgb(31, 31, 31)`                                | Inset panels, video frames                                                                                                             |
| `Theme/Callout`                             | `rgb(235, 255, 244)`                          | `rgb(31, 47, 39)`                                | Callout blocks                                                                                                                         |
| `Theme/Meetings Before After`               | `#EBEBEB` / `rgb(235, 235, 235)`              | `#262626` / `rgb(38, 38, 38)`                    | **Before After** layer on `/meetings`                                                                                                  |
| Surface secondary                           | `#EBEBEB` / `rgb(235, 235, 235)`              | `#262626` / `rgb(38, 38, 38)`                    | Capacity planning 'research bg color' fill, 'what we learned' in capacity planning, 'mapping edge cases' in capacity planning          |

Token UUIDs: query Framer `ColorStyleTokenNode` by name, or inspect `--token-*` on the live site.

-->

---

## Workflow

1. **Edit** the color style in Framer Assets → Colors (Light value).
2. **Confirm** nodes reference that style (not raw hex), unless a fixed override is documented on the canvas.
3. **Regenerate** `p4-theme-tokens` from all `ColorStyleTokenNode`s.
4. **Publish** and verify on the live URL.

---

## Do not use

- **Light/Dark component variants** for color.
- **`Dark/*` text style clones** — point text styles at a color style instead.
- **Raw hex/rgb on nodes** — debt; do not copy forward (except documented fixed overrides on the canvas, e.g. Audit).
- **Code overrides for color** — except `p4-theme-tokens`, scroll-spy CSS, and documented Audit overrides.
- **This file’s archived styles table** — Framer canvas only.

---

## Related

- Nav policy: `docs/architecture.md`
- Token sheet bugs: `docs/bugs/2026-09-12-menu-dark-in-light.md`, `docs/bugs/2026-09-12-rotating-icon-color-controls.md`
- Legacy color debt (~97 styles): `docs/plans/2026-09-11-portfolio-4-rearchitecture.md` Phase 2
