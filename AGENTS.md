# This workspace

Sidecar for **Portfolio 4 — Light Mode Only** (Framer duplicate). Active iteration to remove dark mode.

**Framer project:** https://framer.com/projects/Portfolio-4-Light-Mode-Only--eU2uwvvrrUqquu9kReKG  
**Git branch:** `light-mode-only`  
**Revert reference:** `../Portfolio 4 - Light and Dark Archive/` · branch `light-and-dark-mode` · original Framer project (Portfolio 4)

The canvas in Framer is the source of truth. Local files here are notes, bug cases, debug logs, and snapshots — not the site.

**Architecture** (native-first, nav, when code is allowed): `docs/architecture.md`. Read it before changing nav, color, or any code file.

**Design contract:** `docs/design.md` — breakpoints, color/token workflow. Style **values** come from the Framer canvas only (not the archived table in that file).

**Styles (mandatory):** **Never remove or change styles** (Framer presets or canvas wiring) **without asking Dave first.** Do **not** create or apply Framer styles unless Dave says **“create that style”** or **“apply that style”**. Scanning and reporting gaps is fine; edits wait for approval. See `docs/design.md` agent rules.

## How to edit the site

1. Use **Framer MCP / Framer Agent** (`npx @framer/agent@latest` after loading the Framer skill). Auth and open a session against the **Light Mode Only** project URL above. Reuse the session for the rest of the conversation.
2. Do **not** use Unframer MCP unless Framer Agent cannot do the task. Say so when you fall back.
3. Do not treat files in this repo as live Framer code. Read and write code files through the Framer Agent code-file APIs.

## Native Framer first

Prefer canvas-native building: frames/stacks, components, variants, gesture variants, appear/scroll effects, layout templates, color/text styles.

Do **not** add a code override or code component for layout, styling, or motion that Framer already supports. Extra code ships JS, hydrates later than the canvas, and has already caused theme/nav flashes.

Code is allowed only when the canvas cannot do it (browser APIs, persistence, logic Framer has no control for). Then:

- Prefer a **code override** on an existing canvas node over a new code component.
- Do not add another numbered override (`projectNavSwitcher8`, etc.) if an existing export can be fixed.
- Ask before creating a new code file.
- Do not rebuild past code-heavy work unless asked; this rule is **forward-looking**.

If a native approach and a code approach both exist, present both and wait unless the user already chose.

## Debugging

Follow `.cursor/rules/bug-log.mdc` and `docs/bugs/`. Live site and Framer Preview often diverge; if the bug is live, measure the live site. Preview is not a substitute.

Nav work is hydration-sensitive. Do not hide layers or remount with React `key` to paper over first-paint mismatches.

## Verification and git

Verify the changed flow on the **published** site when the fix is live-dependent (see `.cursor/rules/framer-auto-publish.mdc` — auto-publish after Framer fixes; return the updated URL). Ask before commits and before pushing.
