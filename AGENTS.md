# This workspace

This folder is a sidecar around a **Framer website**. The canvas in Framer is the source of truth. Local files here are notes, bug cases, debug logs, and snapshots — not the site.

**Architecture** (native-first, theme/nav, when code is allowed): `docs/architecture.md`. Read it before changing nav, theme, color, or any code file.

**Design contract:** `docs/design.md` — breakpoints, **single styles table** (colors + text), `p4-theme-tokens` workflow. **Audit** fill is always `#000000`.

**Styles (mandatory):** **Never remove or change styles** (Framer or doc table rows) **without asking Dave first.** Do **not** create or apply Framer styles unless Dave says **“create that style”** or **“apply that style”**. Scanning and reporting gaps is fine; edits wait for approval. See `docs/design.md` agent rules.

## How to edit the site

1. Use **Framer MCP / Framer Agent** (`npx @framer/agent@latest` after loading the Framer skill). Open a session, reuse it for the rest of the conversation, and follow the generated project task map.
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

Theme/nav work is hydration-sensitive: published HTML can be the Light variant while `data-framer-theme` flips earlier. Do not hide layers or remount with React `key` to paper over that.

## Verification and git

Verify the changed flow on the **published** site when the fix is live-dependent (see `.cursor/rules/framer-auto-publish.mdc` — auto-publish after Framer fixes; return the updated URL). Ask before commits and before pushing.
