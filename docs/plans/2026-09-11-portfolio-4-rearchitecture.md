# Portfolio 4 Re-architecture Implementation Plan

> **For the agent executing this plan:** Work task-by-task. Each step is a checkbox. Do not skip the verification steps — they exist because every bug in `docs/bugs/` was caused by declaring a fix done without measuring the live site.

**Goal:** Rebuild the theme, navigation, and page-scroll foundation of the portfolio so that light/dark is a *token* concern resolved before first paint, then redesign the homepage and the Data Capture project page on top of that foundation — with no CMS.

**Architecture:** Colour and type move to a single theme-aware token set. Every component that currently exists twice (Light/Dark) collapses into one component whose variants describe *device and state only*. The published HTML becomes correct at first paint for whichever theme is stored, so the ~124 React overrides that currently swap variants after hydration can be deleted outright. `/data-capture-2` is built first as the archetype that proves the foundation; the homepage redesign and the remaining project pages then adopt it.

**Tech stack:** Framer canvas (source of truth) · Framer Agent CLI (`npx @framer/agent@latest`) · Framer Custom Site Code for the pre-paint theme snippet · Playwright (`playwright-core`, already vendored in `Archive/screenshots/`) for live verification.

**Project:** Portfolio 4 (duplicate of Portfolio 3). All work happens there. Portfolio 3 is the untouched reference.

---

## Ground rules

These override any habit or default. They are the reason this plan exists.

1. **Edit through the Framer Agent CLI, not Unframer.** Open one session at the start and reuse its id for the whole job. If Framer Agent genuinely cannot do something, say so out loud before falling back.
2. **Native-first.** If a variant, a colour style, a text style, a gesture, or a layout template can express it, use that. Code is only for what the canvas cannot do (storage, clipboard, other browser APIs).
3. **Never re-introduce these patterns.** They are what this plan removes:
   - A React override that sets a component's `variant` in response to theme.
   - Reading `localStorage` during render.
   - CSS that targets `[data-framer-name="..."]` or `:nth-child()` inside Framer's output.
   - Rewriting or scraping Framer's own generated stylesheet at runtime.
   - `setInterval` that re-applies styles.
4. **One export per job.** If an override needs changing, change it. Do not add `projectNavSwitcher8`.
5. **Measure on the published staging site, not Preview.** Framer Preview and the published site diverge; every confirmed bug in `docs/bugs/` was confirmed live.
6. **Ask before deleting anything the plan does not explicitly name for deletion.**

---

## Sequencing note

Dave's stated order is "redesign homepage, then project pages starting with Data Capture-2", with Data Capture-2 as the archetype that settles theme/nav/behaviour.

This plan therefore runs: **foundation proven on `/data-capture-2` → homepage redesign on that foundation → remaining project pages.** The foundation work (Phases 1–6) is what makes the homepage redesign cheap instead of another round of override patching. If you would rather start the homepage design exploration in parallel, do it on a scratch page and land it into Phase 7 — do not start building the homepage on the old colour system.

---

## File and object map

Nothing here is a normal source tree. These are the objects that change.

**In Framer (Portfolio 4):**

| Object | Action |
| --- | --- |
| Colour styles (90 today) | Collapse to one `Theme/*` token set with real light+dark values; delete the unused Tailwind ramp; resolve the three different `Primary` styles |
| Text styles (26 today: 13 + 13 `Dark/` copies) | Collapse to 13 theme-agnostic styles; delete every `Dark/*` style |
| `Nav - Light`, `Nav - Dark`, `Nav - Light New` | Collapse into one `Nav` |
| `Nav Links - Light`, `Nav Links - Dark` | Collapse into one `Nav Links` |
| `Nav - Project` (10 variants) | Reduce to 5: device × scroll state only |
| `Footer`, `Footer 2` | Collapse to one `Footer`; variants for device only |
| `Stat`, `Tag`, `Social Icons`, `Social Link` | Drop the Dark variants |
| `Data Capture Icon - Dark Green` | Delete; fold into `Data Capture Icon` |
| Layout templates (6) | Reduce to 2: `Site` and `Project` |
| `Theme_Toggle.tsx` (33.5 KB, 10 exports) | Reduce to one small persist override, or delete entirely |
| `Examples.tsx` | Delete |
| `Project_Card_Backgrounds.tsx` | Delete the three duplicated boilerplate exports; keep `GradientBackground` only if attached |
| `Work_Menu_Morph.tsx` | Rebuild natively or scope its CSS to a stable hook |
| Pages `/home-3`, `/home-4`, `/data-capture-0`, `/data-capture-1` | Archive or delete after the redesign lands |

**In this sidecar repo:**

| File | Action |
| --- | --- |
| `checks/theme-flash.mjs` | Create — the regression test for the whole plan |
| `checks/override-census.mjs` | Create — structural test that the override layer stays deleted |
| `checks/package.json` | Create |
| `docs/architecture.md` | Update at the end to describe what was actually built |
| `docs/bugs/*.md` | Close the two open bugs with the real resolution |

---

## Phase 0 — Connect and establish the baseline

### Task 0.1: Connect to Portfolio 4

**Files:** none

- [ ] **Step 1: Authorise the project**

Dave needs to supply the Portfolio 4 URL (open the project in Framer and copy the URL from the address bar). Then:

```bash
npx @framer/agent@latest project auth "<portfolio-4-url>"
```

This opens a browser approval prompt. Wait for it to complete.

- [ ] **Step 2: Open the session and keep the id**

```bash
npx @framer/agent@latest session new "<portfolio-4-url-or-id>"
```

It prints a number. Export it and use it for every command in this plan:

```bash
export S=<printed-session-id>
```

- [ ] **Step 3: Read the generated project context**

`session new` writes context to `~/.claude/skills/framer/projects/<projectId>/`. Read `index.md` and follow its task map. Read `project-inventory.md` before using any component name or page path.

- [ ] **Step 4: Confirm this is the duplicate, not Portfolio 3**

```bash
npx @framer/agent@latest exec -s $S -e 'console.log((await framer.getProjectInfo()).name)'
```

Expected: `Portfolio 4`. **If it prints `Portfolio 3`, stop.** You are in the live project.

### Task 0.2: Record the baseline census

**Files:** none (output goes in the commit message / task notes)

- [ ] **Step 1: Count what exists today**

```bash
npx @framer/agent@latest exec -s $S <<'EOF'
const [pages, colors, texts, comps, tpls] = await Promise.all([
  framer.agent.getNodesOfTypes({ types: ["WebPageNode"] }),
  framer.agent.getNodesOfTypes({ types: ["ColorStyleTokenNode"] }),
  framer.agent.getNodesOfTypes({ types: ["TextStylePresetNode"] }),
  framer.agent.getNodesOfTypes({ types: ["ComponentNode"] }),
  framer.agent.getNodesOfTypes({ types: ["LayoutTemplateNode"] }),
]);
console.log({ pages: pages.length, colorStyles: colors.length, textStyles: texts.length, components: comps.length, layoutTemplates: tpls.length });
EOF
```

Expected, matching the Portfolio 3 audit: 13 pages, 90 colour styles, 26 text styles, 33 components, 6 layout templates. Write the actual numbers down — they are the before/after scoreboard.

- [ ] **Step 2: Census the override attachments**

```bash
npx @framer/agent@latest exec -s $S <<'EOF'
const pages = await framer.agent.getNodesOfTypes({ types: ["WebPageNode"] });
const uniq = {};
for (const p of pages) {
  const pagePath = p.attributes?.path;
  const nodes = await framer.agent.getNodesOfTypes({ types: ["FrameNode","ComponentInstanceNode","RichTextNode","WebPageNode"] }, { pagePath });
  const ser = await framer.agent.serializeNodes({ ids: nodes.map(n => n.id), depth: 0, attributeFilter: ["codeOverride","name"] }, { pagePath });
  for (const n of ser) {
    const co = n.attributes?.codeOverride;
    if (!co) continue;
    const key = co.split(":")[1];
    (uniq[key] ??= new Set()).add(n.id);
  }
}
console.log(Object.entries(uniq).map(([k, v]) => `${String(v.size).padStart(4)}  ${k}`).sort().join("\n"));
EOF
```

Expected baseline:

```
   1 unique nodes  homePageFrame
   1 unique nodes  withSectionScrollSpy
   4 unique nodes  withCopyEmail
   4 unique nodes  withWorkMenuMorph
   8 unique nodes  projectNavSwitcher
  14 unique nodes  themeSwitcher
 124 unique nodes  variantSwitcher
```

The goal of Phases 1–6 is to get `variantSwitcher`, `themeSwitcher`, `projectNavSwitcher` and `homePageFrame` to zero.

- [ ] **Step 3: Publish a baseline staging build and record the URL**

```bash
npx @framer/agent@latest exec -s $S -e 'console.log(await framer.agent.publish({ target: "staging" }))'
```

Record the `.framer.app` URL. Export it:

```bash
export SITE_URL="https://<portfolio-4-staging>.framer.app"
```

### Task 0.3: Build the regression test before changing anything

This is the single most important task in the plan. It turns "the nav flashes" from a thing you squint at into a thing that passes or fails.

**Files:**
- Create: `checks/package.json`
- Create: `checks/theme-flash.mjs`

- [ ] **Step 1: Create the checks package**

```json
{
  "name": "portfolio-checks",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "dependencies": {
    "playwright-core": "^1.52.0"
  }
}
```

- [ ] **Step 2: Install**

```bash
cd checks && npm install
```

- [ ] **Step 3: Write the flash check**

Create `checks/theme-flash.mjs`:

```js
import { chromium } from "playwright-core"

const SITE = process.env.SITE_URL
const PATH = process.argv[2] ?? "/data-capture-2"
const STORED = process.argv[3] ?? "dark"

if (!SITE) {
    console.error("Set SITE_URL to the staging .framer.app URL")
    process.exit(2)
}

const SAMPLE_MS = [0, 16, 50, 100, 150, 250, 500, 1000]

const browser = await chromium.launch({ channel: "chrome", headless: true })
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })

// Seed the stored theme the way a returning visitor would have it,
// before any page script runs.
await context.addInitScript(theme => {
    try {
        localStorage.setItem("currentToggleState", theme)
        sessionStorage.setItem("currentToggleState", theme)
    } catch {}
}, STORED)

const page = await context.newPage()
const samples = []

await page.goto(SITE + PATH, { waitUntil: "commit", timeout: 60000 })

const start = Date.now()
for (const at of SAMPLE_MS) {
    const wait = at - (Date.now() - start)
    if (wait > 0) await page.waitForTimeout(wait)
    samples.push(
        await page.evaluate(() => {
            const nav = document.querySelector("nav")
            const root = document.documentElement
            return {
                themeAttr:
                    root.getAttribute("data-framer-theme") ??
                    document.body?.getAttribute("data-framer-theme") ??
                    null,
                navName: nav?.getAttribute("data-framer-name") ?? null,
                navBg: nav ? getComputedStyle(nav).backgroundColor : null,
                navOpacity: nav ? getComputedStyle(nav).opacity : null,
                bodyBg: document.body
                    ? getComputedStyle(document.body).backgroundColor
                    : null,
            }
        })
    )
}

await browser.close()

console.table(samples.map((s, i) => ({ ms: SAMPLE_MS[i], ...s })))

// ---- assertions ----
const failures = []
const settled = samples[samples.length - 1]

for (const [i, s] of samples.entries()) {
    const ms = SAMPLE_MS[i]
    if (s.navName === null) continue // nav not in the DOM yet is fine

    if (STORED === "dark" && /light/i.test(s.navName ?? "")) {
        failures.push(`${ms}ms: nav is "${s.navName}" but stored theme is dark`)
    }
    if (s.navOpacity !== null && Number(s.navOpacity) < 1) {
        failures.push(`${ms}ms: nav is hidden (opacity ${s.navOpacity}) — nav must never be hidden to cover a mismatch`)
    }
    if (s.navBg && settled.navBg && s.navBg !== settled.navBg) {
        failures.push(`${ms}ms: nav background ${s.navBg} differs from settled ${settled.navBg}`)
    }
    if (s.bodyBg && settled.bodyBg && s.bodyBg !== settled.bodyBg) {
        failures.push(`${ms}ms: body background ${s.bodyBg} differs from settled ${settled.bodyBg}`)
    }
}

if (failures.length) {
    console.error("\nFAIL\n" + failures.map(f => "  - " + f).join("\n"))
    process.exit(1)
}
console.log("\nPASS — no theme flash on " + PATH + " with stored theme " + STORED)
```

- [ ] **Step 4: Run it against the baseline and confirm it FAILS**

```bash
cd checks && SITE_URL=$SITE_URL node theme-flash.mjs /data-capture-2 dark
```

Expected: **FAIL**, reporting a light nav and/or `opacity 0` in the first ~150ms. This reproduces `docs/bugs/2026-09-11-project-nav-theme-delay.md` as an automated check. If it passes, the seeding is not working — check that the storage key is still `currentToggleState`, and fix the check before continuing.

- [ ] **Step 5: Also confirm the light path**

```bash
cd checks && SITE_URL=$SITE_URL node theme-flash.mjs /data-capture-2 light
```

Record whether this passes today. Light is the SSR default, so it probably does. Both must pass at the end.

- [ ] **Step 6: Commit**

```bash
git add checks/ docs/plans/
git commit -m "Add theme flash regression check and re-architecture plan"
```

---

## Phase 1 — Settle how a manual theme switch actually works

**Why this is first:** everything downstream assumes the published page can be made to render the stored theme *before* first paint. Framer's colour styles are theme-aware, but Framer publishes the dark values inside an `@media (prefers-color-scheme: dark)` block. Whether Framer also honours a `data-framer-theme` attribute on a *published site* (as opposed to inside the plugin UI) is **not documented and must be measured.** The current code assumes it does not — which is why it scrapes and rewrites Framer's stylesheet. Do not inherit that assumption; test it.

### Task 1.1: Find out whether Framer honours the theme attribute on published pages

**Files:** none

- [ ] **Step 1: Create a disposable test page**

```bash
npx @framer/agent@latest exec -s $S <<'EOF'
console.log(await framer.agent.applyChanges(
  `+WebPageNode themeProbe path="/theme-probe" name="Theme Probe";`
));
EOF
```

Add one full-width frame filled with the `Theme/Background` colour style and one text node using `Theme/Text Primary`. Use `applyChanges` with the DSL; read `prompt/updating-the-project.md` for the grammar first.

- [ ] **Step 2: Publish and open it**

```bash
npx @framer/agent@latest exec -s $S -e 'console.log(await framer.agent.publish({ target: "staging" }))'
```

- [ ] **Step 3: Probe the attribute with no JavaScript of ours involved**

```bash
cd checks && node -e '
import("playwright-core").then(async ({ chromium }) => {
  const b = await chromium.launch({ channel: "chrome", headless: true });
  const p = await b.newPage();
  await p.goto(process.env.SITE_URL + "/theme-probe", { waitUntil: "networkidle" });
  const before = await p.evaluate(() => getComputedStyle(document.body).backgroundColor);
  await p.evaluate(() => {
    document.documentElement.setAttribute("data-framer-theme", "dark");
    document.body.setAttribute("data-framer-theme", "dark");
  });
  await p.waitForTimeout(200);
  const after = await p.evaluate(() => getComputedStyle(document.body).backgroundColor);
  console.log({ before, after, honoured: before !== after });
  await b.close();
});
'
```

- [ ] **Step 4: Record the answer and pick the branch**

**If `honoured: true`** — Framer resolves tokens from the attribute. Use **Branch A** in Task 1.2. The theme switch becomes a five-line head snippet and nothing else.

**If `honoured: false`** — Framer only resolves dark inside the media query. Use **Branch B** in Task 1.2: a *static, hand-authored* token stylesheet in Custom Site Code. Still pre-paint, still zero runtime scraping. This is strictly better than what exists today even though it is more work than Branch A.

Write the result into `docs/architecture.md` as a decision record before moving on.

### Task 1.2: Implement the pre-paint theme switch

**Files:**
- Framer → Site Settings → Custom Code → **Start of `<head>`**

- [ ] **Step 1 (both branches): Add the pre-paint snippet**

This must be in `<head>`, not `<body>`, and must be synchronous. It is the only theme JavaScript that survives this plan.

```html
<script>
(function () {
  try {
    var t = localStorage.getItem("portfolio-theme");
    if (t !== "dark" && t !== "light") {
      t = matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    }
    var r = document.documentElement;
    r.setAttribute("data-framer-theme", t);
    r.setAttribute("data-theme", t);
    r.style.colorScheme = t;
  } catch (e) {}
})();
</script>
```

Note the key is `portfolio-theme`, not `currentToggleState`. Update `checks/theme-flash.mjs` to seed both keys during the transition, then drop the old one once nothing reads it.

- [ ] **Step 2 (Branch B only): Extract Framer's token variable names**

Framer compiles each colour style to a CSS custom property. Get the real names from the published page:

```bash
cd checks && node -e '
import("playwright-core").then(async ({ chromium }) => {
  const b = await chromium.launch({ channel: "chrome", headless: true });
  const p = await b.newPage();
  await p.goto(process.env.SITE_URL + "/theme-probe", { waitUntil: "networkidle" });
  const vars = await p.evaluate(() => {
    const out = {};
    for (const sheet of document.styleSheets) {
      let rules; try { rules = sheet.cssRules } catch { continue }
      for (const rule of rules) {
        const grab = r => {
          if (!r.style) return;
          for (const name of r.style) if (name.startsWith("--token")) out[name] = r.style.getPropertyValue(name).trim();
        };
        grab(rule);
        if (rule.cssRules) for (const inner of rule.cssRules) grab(inner);
      }
    }
    return out;
  });
  console.log(JSON.stringify(vars, null, 2));
  await b.close();
});
'
```

Map each `--token-*` to its `Theme/*` style by matching the light value against the values in Task 2.1.

- [ ] **Step 3 (Branch B only): Write the static override stylesheet**

Add to Custom Code → **End of `<head>`**, *after* Framer's own styles. Replace the token names and values with the real ones from Step 2:

```html
<style>
/* Manual theme override. Static values — never generated at runtime.
   If a --token-* name below no longer exists in Framer's output,
   checks/theme-flash.mjs will fail. Regenerate via Task 1.2 Step 2. */
html[data-theme="light"] {
  --token-REPLACE-background: rgb(255, 255, 255);
  --token-REPLACE-surface: rgb(249, 250, 251);
  --token-REPLACE-surface-raised: rgb(243, 244, 246);
  --token-REPLACE-text-primary: rgb(3, 7, 18);
  --token-REPLACE-text-secondary: rgb(31, 41, 55);
  --token-REPLACE-text-muted: rgb(107, 114, 128);
  --token-REPLACE-text-body: rgb(3, 7, 18);
  --token-REPLACE-border: rgb(229, 231, 235);
  --token-REPLACE-accent: rgb(4, 225, 203);
}
html[data-theme="dark"] {
  --token-REPLACE-background: rgb(24, 24, 24);
  --token-REPLACE-surface: rgb(31, 31, 31);
  --token-REPLACE-surface-raised: rgb(41, 41, 41);
  --token-REPLACE-text-primary: rgb(237, 237, 237);
  --token-REPLACE-text-secondary: rgb(176, 176, 176);
  --token-REPLACE-text-muted: rgb(140, 140, 140);
  --token-REPLACE-text-body: rgb(162, 162, 162);
  --token-REPLACE-border: rgb(51, 51, 51);
  --token-REPLACE-accent: rgb(4, 225, 203);
}
</style>
```

The light/dark values above are the real `Theme/*` values already in the project — reuse them rather than inventing new ones.

- [ ] **Step 4: Verify on the probe page**

```bash
npx @framer/agent@latest exec -s $S -e 'console.log(await framer.agent.publish({ target: "staging" }))'
cd checks && SITE_URL=$SITE_URL node theme-flash.mjs /theme-probe dark
```

The probe page has no nav, so the nav assertions skip; the `bodyBg` assertion is the one that matters. Expected: **PASS**, with `bodyBg` dark at 0 ms.

- [ ] **Step 5: Delete the probe page**

```bash
npx @framer/agent@latest exec -s $S -e 'console.log(await framer.agent.applyChanges(`DEL themeProbe;`))'
```

- [ ] **Step 6: Commit the decision**

```bash
git add docs/architecture.md checks/
git commit -m "Settle pre-paint theme mechanism (Branch A/B) and verify on probe page"
```

---

## Phase 2 — Rebuild the colour tokens

### Task 2.1: Complete the `Theme/*` token set

Today `Theme/*` has 9 tokens and only `/data-capture-2` uses any of them. Everything else uses raw colours or the non-theme-aware Tailwind ramp.

**Files:** Framer colour styles

- [ ] **Step 1: List what the archetype page actually needs**

```bash
npx @framer/agent@latest exec -s $S <<'EOF'
const pages = await framer.agent.getNodesOfTypes({ types: ["WebPageNode"] });
const p = pages.find(x => x.attributes?.path === "/data-capture-2");
const refs = await framer.agent.getDescendantReferencesOfTypes(
  { id: p.id, types: ["ColorStyleTokenNode","TextStylePresetNode"] },
  { pagePath: "/data-capture-2" }
);
console.log(refs.map(r => `${r.type}  ${r.name}`).sort().join("\n"));
EOF
```

- [ ] **Step 2: Find every hardcoded colour on that page**

```bash
npx @framer/agent@latest exec -s $S <<'EOF'
const pagePath = "/data-capture-2";
const pages = await framer.agent.getNodesOfTypes({ types: ["WebPageNode"] });
const p = pages.find(x => x.attributes?.path === pagePath);
const nodes = await framer.agent.getDescendantsOfTypes({ id: p.id, types: ["FrameNode","RichTextNode","TextRun"] }, { pagePath });
const ser = await framer.agent.serializeNodes({ ids: nodes.map(n => n.id), depth: 0, attributeFilter: ["fill","textColor","border","name"] }, { pagePath });
const counts = {};
for (const n of ser) {
  for (const key of ["fill","textColor"]) {
    const v = n.attributes?.[key];
    if (typeof v === "string" && /^(rgb|#)/.test(v)) counts[`${key} ${v}`] = (counts[`${key} ${v}`] ?? 0) + 1;
  }
}
console.log(Object.entries(counts).sort((a,b) => b[1]-a[1]).map(([k,v]) => `${String(v).padStart(4)}  ${k}`).join("\n"));
EOF
```

Every line in that output is a value that must become a token or map onto an existing one.

- [ ] **Step 3: Extend the token set**

Add the tokens the audit shows are missing. Create them through `applyChanges`, not the plugin API, so they are immediately usable on the canvas. Every token gets **both** a light and a dark value:

```bash
npx @framer/agent@latest exec -s $S <<'EOF'
console.log(await framer.agent.applyChanges(`
  +ColorStyleTokenNode themeNavFill name="Theme/Nav Fill" light="rgba(255, 255, 255, 0.8)" dark="rgba(24, 24, 24, 0.8)";
  +ColorStyleTokenNode themeNavBorder name="Theme/Nav Border" light="rgba(17, 17, 17, 0.14)" dark="rgba(255, 255, 255, 0.18)";
  +ColorStyleTokenNode themeLinkRest name="Theme/Link Rest" light="rgb(107, 114, 128)" dark="rgb(140, 140, 140)";
  +ColorStyleTokenNode themeLinkActive name="Theme/Link Active" light="rgb(3, 7, 18)" dark="rgb(237, 237, 237)";
`));
EOF
```

Add more as Step 2 requires. Keep the naming flat and purposeful: `Theme/<role>`. No colour names in token names — `Theme/Border`, never `Theme/Gray 200`.

- [ ] **Step 4: Fold `Project/*` into `Theme/*`**

`Project/Background`, `Project/Text`, `Project/Pill Border`, `Project/Pill Fill` duplicate roles that `Theme/*` already covers. Repoint every reference to the `Theme/*` equivalent, then delete the `Project/*` styles. Keep `Project/*` **only** if a project page must genuinely differ from the rest of the site — and if so, write down why in `docs/architecture.md`.

- [ ] **Step 5: Resolve the name collisions**

There are three different colour styles named `Primary` — `rgb(82, 53, 239)`, `rgb(14, 58, 39)`, `rgb(119, 45, 8)` — plus three called `White` and two called `Black`. Find their references, rename each to something unambiguous (`Legacy/Primary Indigo`, etc.), then delete the ones with zero references.

```bash
npx @framer/agent@latest exec -s $S <<'EOF'
const styles = await framer.agent.getNodesOfTypes({ types: ["ColorStyleTokenNode"] });
const byName = {};
for (const s of styles) (byName[s.name] ??= []).push({ id: s.id, light: s.attributes?.light });
console.log(Object.entries(byName).filter(([, v]) => v.length > 1));
EOF
```

- [ ] **Step 6: Delete the unused Tailwind ramp**

`Gray 50–950`, `Indigo 50–950`, `Green 50–950`, `Blue 50–950` all have `light === dark`, so they can never be theme-aware. Check references first, repoint any that exist onto `Theme/*`, then delete. Expect this to remove roughly 44 styles.

- [ ] **Step 7: Verify the count dropped**

```bash
npx @framer/agent@latest exec -s $S -e 'console.log((await framer.agent.getNodesOfTypes({ types: ["ColorStyleTokenNode"] })).length)'
```

Expected: well under 90 — target is roughly 20–25 tokens, all with light and dark values.

### Task 2.2: Collapse the text styles

**Files:** Framer text styles

- [ ] **Step 1: Confirm the duplication**

```bash
npx @framer/agent@latest exec -s $S <<'EOF'
const t = await framer.agent.getNodesOfTypes({ types: ["TextStylePresetNode"] });
console.log(t.map(s => s.name).sort().join("\n"));
EOF
```

Expected: 13 styles plus 13 `Dark/` copies of the same names.

- [ ] **Step 2: Make the 13 base styles theme-agnostic**

For each base style (`Heading 1`, `H0`, `Section`, `Caps Headline`, `H2 (24px)`, `H3 (20px)`, `Body`, `Body 2`, `Small text`, `Bold Body`, `Explainer Text`, `Project Header`, `Tablet Project Header`): set its text colour to the appropriate `Theme/*` token rather than a fixed colour. Size, weight, line-height and tracking stay as they are — those do not change with theme.

- [ ] **Step 3: Repoint every `Dark/*` reference**

For each page, find nodes using a `Dark/*` preset and switch them to the base preset of the same name. `/data-capture-2` has 9 such references; find the rest with:

```bash
npx @framer/agent@latest exec -s $S <<'EOF'
const pages = await framer.agent.getNodesOfTypes({ types: ["WebPageNode"] });
for (const p of pages) {
  const pagePath = p.attributes?.path;
  const refs = await framer.agent.getDescendantReferencesOfTypes({ id: p.id, types: ["TextStylePresetNode"] }, { pagePath });
  const dark = refs.filter(r => /^Dark\//.test(r.name ?? ""));
  if (dark.length) console.log(pagePath, dark.map(d => d.name));
}
EOF
```

- [ ] **Step 4: Delete the 13 `Dark/*` styles**

Only after Step 3 reports nothing.

- [ ] **Step 5: Verify**

```bash
npx @framer/agent@latest exec -s $S -e 'const t = await framer.agent.getNodesOfTypes({ types: ["TextStylePresetNode"] }); console.log(t.length, t.filter(s => /^Dark\//.test(s.name)).length)'
```

Expected: `13 0`.

- [ ] **Step 6: Publish and re-run the flash check**

```bash
npx @framer/agent@latest exec -s $S -e 'console.log(await framer.agent.publish({ target: "staging" }))'
cd checks && SITE_URL=$SITE_URL node theme-flash.mjs /data-capture-2 dark
```

It will still FAIL on the nav (the nav is still variant-swapped), but `bodyBg` should now be stable from 0 ms. That partial improvement is the signal that the token layer is working.

---

## Phase 3 — Collapse the duplicated components

Do this in dependency order: leaf components first, nav last.

### Task 3.1: Leaf components

**Files:** Framer components `Stat`, `Tag`, `Social Icons`, `Social Link`, `Data Capture Icon`, `Data Capture Icon - Dark Green`

- [ ] **Step 1: `Stat` — 4 variants down to 2**

Current: `Light Mode`, `Dark Mode`, `Dark Mode No Sideline`, `Light Mode - No Sideline`. Theme is not a variant axis; the sideline is. Point every colour inside `Stat` at `Theme/*` tokens, then keep `Default` and `No Sideline` and delete the two dark variants.

- [ ] **Step 2: Repoint instances**

Every `Stat` instance currently pinned to `Dark Mode` needs to move to `Default`, and `Dark Mode No Sideline` to `No Sideline`. Find them:

```bash
npx @framer/agent@latest exec -s $S <<'EOF'
const pages = await framer.agent.getNodesOfTypes({ types: ["WebPageNode"] });
for (const p of pages) {
  const pagePath = p.attributes?.path;
  const nodes = await framer.agent.getDescendantsOfTypes({ id: p.id, types: ["ComponentInstanceNode"] }, { pagePath });
  const ser = await framer.agent.serializeNodes({ ids: nodes.map(n => n.id), depth: 0, attributeFilter: ["component","variant","name"] }, { pagePath });
  const hits = ser.filter(n => /Dark/i.test(String(n.attributes?.variant ?? "")));
  if (hits.length) console.log(pagePath, hits.map(h => `${h.id} ${h.attributes?.variant}`));
}
EOF
```

- [ ] **Step 3: `Tag` — delete the `Dark` variant**, token the colours, repoint instances.

- [ ] **Step 4: `Social Icons` — delete `Dark Mode Icons`**, token the icon colours, repoint instances. Keep `Vertical` and `With github` — those are real layout variants.

- [ ] **Step 5: `Social Link` — delete `Dark Mode Icon`**, repoint instances.

- [ ] **Step 6: `Data Capture Icon - Dark Green` — delete the whole component.** It is an 11-variant clone of `Data Capture Icon` that exists only for colour. Token the colour in `Data Capture Icon` and repoint all instances of the clone.

- [ ] **Step 7: Publish and eyeball both themes**

```bash
npx @framer/agent@latest exec -s $S -e 'console.log(await framer.agent.publish({ target: "staging" }))'
```

Open `/data-capture-2` in both themes and confirm stats, tags, icons and social links all look right. Screenshot both into `docs/bugs/` evidence if anything is off.

### Task 3.2: One `Footer`

**Files:** Framer components `Footer` (8 variants), `Footer 2` (6 variants), `Footer Project`

- [ ] **Step 1: Decide which survives.** Check which is actually placed on the pages that matter (`/`, `/data-capture-2`, `/about-me`) and keep that one.

- [ ] **Step 2: Reduce to three device variants** — `Desktop`, `Tablet`, `Phone`. Delete `Footer Dark`, `Mobile Dark`, `Tablet Dark` (theme is tokens now). Keep `No Social Icons` / `Mobile no social` **only if** a page genuinely needs a social-free footer — that is currently expressed by a whole separate layout template (`Light NoSocial`), which Phase 4 removes. Prefer making social icons a component property (a boolean control) over a variant.

- [ ] **Step 3: Repoint all instances, then delete the losing footer component.**

### Task 3.3: One `Nav`

This is the centre of the whole problem. Do it last and do it carefully.

**Files:** Framer components `Nav - Light`, `Nav - Dark`, `Nav - Light New`, `Nav Links - Light`, `Nav Links - Dark`, `Nav - Project`, `Theme Toggle Switch`

- [ ] **Step 1: Pick the survivor.** `Nav - Light New` is the newest; confirm against the canvas which one the redesign is meant to use. Rename it to `Nav`.

- [ ] **Step 2: Token every colour inside it** — background, border, link rest/hover/active, logo. No fixed colours remain.

- [ ] **Step 3: Reduce the variant axis to device and state only**

Target variant set for `Nav`:

| Variant | Meaning |
| --- | --- |
| `Desktop` | default |
| `Desktop Scrolled` | condensed after scroll |
| `Phone Closed` | |
| `Phone Open` | menu expanded |
| `Tablet` | |

Note what is *absent*: any variant with `Light` or `Dark` in the name. `Nav - Project` currently has 10 variants, which is exactly this 5 × 2 themes. After tokening, the two halves become identical and one half gets deleted.

- [ ] **Step 4: Merge `Nav - Project` into `Nav`** if the structures allow it. If the project nav is genuinely a different layout, keep it as `Nav Project` with the same five state variants — but it must not have theme variants either.

- [ ] **Step 5: Delete `Nav - Light`, `Nav - Dark`, `Nav Links - Light`, `Nav Links - Dark`** after repointing every instance.

- [ ] **Step 6: Rebuild the theme toggle natively**

The `Theme Toggle Switch` component has `Dark` and `Light` variants. Drive it with a **gesture variant plus a click interaction**, not a React `variant` prop — the confirmed finding in `docs/bugs/2026-09-11-theme-toggle-code-component.md` is that Framer's canvas spring does not run when React sets `variant`.

The only code left is a minimal click override that writes storage and flips the attribute:

```tsx
// Theme.tsx — the ONLY theme code in the project
import type { ComponentType } from "react"
import React from "react"

const KEY = "portfolio-theme"

const read = () =>
    document.documentElement.getAttribute("data-theme") === "dark"
        ? "dark"
        : "light"

export function withThemeToggle(
    Component: ComponentType<any>
): ComponentType<any> {
    return props => {
        const toggle = () => {
            const next = read() === "dark" ? "light" : "dark"
            const root = document.documentElement
            root.setAttribute("data-theme", next)
            root.setAttribute("data-framer-theme", next)
            root.style.colorScheme = next
            try {
                localStorage.setItem(KEY, next)
            } catch {}
        }
        return <Component {...props} onClick={toggle} onTap={toggle} />
    }
}
```

That is the entire replacement for `Theme_Toggle.tsx`. No variant resolution, no listeners, no observers, no stylesheet rewriting, no storage reads during render.

- [ ] **Step 7: Attach `withThemeToggle` to the toggle element only** — not to the nav, and not to 14 nodes. `docs/bugs/2026-09-11-theme-toggle-code-component.md` hypothesis A says `themeSwitcher` never mounted; the audit shows it *was* attached to 14 nodes, including the nav variant instances rather than the toggle. That mis-wiring is what made the toggle's own animation unreachable. Attach to exactly one node.

- [ ] **Step 8: Publish and run the check — this is the moment of truth**

```bash
npx @framer/agent@latest exec -s $S -e 'console.log(await framer.agent.publish({ target: "staging" }))'
cd checks && SITE_URL=$SITE_URL node theme-flash.mjs /data-capture-2 dark
cd checks && SITE_URL=$SITE_URL node theme-flash.mjs /data-capture-2 light
```

Expected: **PASS on both.** If it still fails, do not add JavaScript to paper over it — find which element is still theme-variant-driven and token it.

---

## Phase 4 — Collapse the layout templates

**Files:** Framer layout templates `Light`, `Light NoSocial`, `Dark`, `Light New`, `Project Light`, `Project Dark`

- [ ] **Step 1: Create two templates**

`Site` (nav + footer, used by `/`, `/about-me`) and `Project` (project nav + project footer). Both use the single `Nav` and single `Footer` from Phase 3, and both are theme-neutral because colour comes from tokens.

- [ ] **Step 2: Repoint every page**

Current assignment — note the drift this fixes:

| Page | Today | Target |
| --- | --- | --- |
| `/` | Light NoSocial | Site |
| `/about-me` | Light | Site |
| `/customer-view` | Light | Project |
| `/capacity-planning` | Light | Project |
| `/capacity-planning-3` | Light | Project |
| `/data-capture` | Light | Project |
| `/data-capture-0` | **Dark** | Project |
| `/data-capture-1` | Light | Project |
| `/data-capture-2` | Project Light | Project |
| `/seller-coupons` | Light | Project |
| `/home-redesign` | **none** | Site |

- [ ] **Step 3: Delete the six old templates.**

- [ ] **Step 4: Publish and run the check on two pages**

```bash
cd checks && SITE_URL=$SITE_URL node theme-flash.mjs /data-capture-2 dark
cd checks && SITE_URL=$SITE_URL node theme-flash.mjs /about-me dark
```

---

## Phase 5 — Delete the override layer

Only start this once Phase 3 Step 8 passes. The overrides are load-bearing until then.

### Task 5.1: Remove `variantSwitcher` from all 124 nodes

**Files:** Framer canvas; `Theme_Toggle.tsx`

- [ ] **Step 1: List every node still carrying it**

```bash
npx @framer/agent@latest exec -s $S <<'EOF'
const pages = await framer.agent.getNodesOfTypes({ types: ["WebPageNode"] });
const ids = new Map();
for (const p of pages) {
  const pagePath = p.attributes?.path;
  const nodes = await framer.agent.getNodesOfTypes({ types: ["FrameNode","ComponentInstanceNode","RichTextNode","WebPageNode"] }, { pagePath });
  const ser = await framer.agent.serializeNodes({ ids: nodes.map(n => n.id), depth: 0, attributeFilter: ["codeOverride","name"] }, { pagePath });
  for (const n of ser) {
    const co = n.attributes?.codeOverride ?? "";
    if (co.includes("variantSwitcher")) ids.set(n.id, pagePath);
  }
}
console.log(JSON.stringify([...ids.keys()]));
EOF
```

- [ ] **Step 2: Clear the override on all of them**

```bash
npx @framer/agent@latest exec -s $S <<'EOF'
const ids = JSON.parse(require("fs").readFileSync("/tmp/variant-switcher-ids.json", "utf8"));
const dsl = ids.map(id => `SET ${id} codeOverride="";`).join(" ");
console.log(await framer.agent.applyChanges(dsl));
EOF
```

Save the Step 1 output to `/tmp/variant-switcher-ids.json` first. Work in batches of ~25 ids and read the diagnostics from every `applyChanges` result before continuing.

- [ ] **Step 3: Same for `themeSwitcher` (14 nodes) and `projectNavSwitcher` (8 nodes).**

- [ ] **Step 4: Verify the census is clean**

Re-run the Task 0.2 Step 2 census. Expected remaining: `withCopyEmail`, `withSectionScrollSpy`, `withWorkMenuMorph`, `withThemeToggle` — and nothing else.

### Task 5.2: Delete the dead code files

**Files:** `Examples.tsx`, `Project_Card_Backgrounds.tsx`, `Theme_Toggle.tsx`

- [ ] **Step 1: Confirm zero attachments** for `Examples.tsx` (`withHover`, `withRotate`, `withRandomColor`) and for the three duplicated boilerplate exports in `Project_Card_Backgrounds.tsx`. The audit found zero for all six.

- [ ] **Step 2: Delete `Examples.tsx` entirely.**

- [ ] **Step 3: In `Project_Card_Backgrounds.tsx`, delete `withHover`, `withRotate`, `withRandomColor`.** Keep `GradientBackground` only if it is attached; the audit found it unattached, so it probably goes too.

- [ ] **Step 4: In `Dave_s_Overrides.tsx`, delete the duplicated `withHover`, `withRotate`, `withRandomColor`.** Keep `withCopyEmail` and `withSectionScrollSpy`.

- [ ] **Step 5: Delete `Theme_Toggle.tsx`.** All ten exports are replaced by `Theme.tsx` from Phase 3 Step 6. This removes 33.5 KB including the stylesheet scraper, the `prefers-color-scheme` regex rewriter, `homePageFrame`, and `projectNavSwitcher2` through `7` (six exports that all just called `projectNavSwitcher6` and were attached to nothing).

> **Do this step together with Phase 6 Task 6.1.** `homePageFrame` lives in this file, and deleting it removes the homepage's inset frame and its scroll container. Land the native replacement in the same publish, or the homepage will look broken on staging in between.

- [ ] **Step 6: Add the structural regression check**

Create `checks/override-census.mjs`:

```js
import { execSync } from "node:child_process"

const SESSION = process.env.FRAMER_SESSION
if (!SESSION) {
    console.error("Set FRAMER_SESSION to the framer agent session id")
    process.exit(2)
}

const ALLOWED = new Set([
    "withCopyEmail",
    "withSectionScrollSpy",
    "withWorkMenuMorph",
    "withThemeToggle",
])

const script = `
const pages = await framer.agent.getNodesOfTypes({ types: ["WebPageNode"] });
const uniq = {};
for (const p of pages) {
  const pagePath = p.attributes?.path;
  const nodes = await framer.agent.getNodesOfTypes({ types: ["FrameNode","ComponentInstanceNode","RichTextNode","WebPageNode"] }, { pagePath });
  const ser = await framer.agent.serializeNodes({ ids: nodes.map(n => n.id), depth: 0, attributeFilter: ["codeOverride"] }, { pagePath });
  for (const n of ser) {
    const co = n.attributes?.codeOverride;
    if (!co) continue;
    const key = co.split(":")[1];
    (uniq[key] ??= new Set()).add(n.id);
  }
}
console.log(JSON.stringify(Object.fromEntries(Object.entries(uniq).map(([k, v]) => [k, v.size]))));
`

const raw = execSync(
    `npx @framer/agent@latest exec -s ${SESSION}`,
    { input: script, encoding: "utf8" }
)
const found = JSON.parse(raw.trim().split("\n").pop())

const banned = Object.keys(found).filter(k => !ALLOWED.has(k))
console.table(found)

if (banned.length) {
    console.error(
        "\nFAIL — banned overrides are attached again: " + banned.join(", ")
    )
    process.exit(1)
}
console.log("\nPASS — override layer is clean")
```

- [ ] **Step 7: Run it**

```bash
cd checks && FRAMER_SESSION=$S node override-census.mjs
```

Expected: **PASS**.

- [ ] **Step 8: Commit**

```bash
git add checks/ && git commit -m "Add override census check; theme override layer removed"
```

---

## Phase 6 — Fix the homepage scroll before redesigning it

`homePageFrame` is deleted in Phase 5, which removes the JS scroll container. The inset "frame" look it produced has to come back natively, or the homepage will look wrong.

### Task 6.1: Rebuild the inset frame natively

**Files:** Framer Custom Code → End of `<head>`; the `/` and `/home-redesign` page structure

- [ ] **Step 1: Understand what was removed**

`homePageFrame` injected `html, body { overflow: hidden !important; height: 100% !important }`, pinned `#home-scroll` to `position: fixed; inset: 20px` with its own scrollbar, intercepted `wheel`, captured every anchor click to do manual scrolling, and re-applied all of it on a `setInterval(apply, 300)` that never cleared. The page scrolled inside a div, not the document.

- [ ] **Step 2: Replace it with a fixed border overlay**

The page scrolls natively; a non-interactive overlay draws the frame:

```html
<style>
body::after {
  content: "";
  position: fixed;
  inset: 0;
  border: 20px solid var(--frame-color, rgb(19, 19, 19));
  pointer-events: none;
  z-index: 9;
}
html[data-theme="light"] body::after { --frame-color: rgb(255, 255, 255); }
html[data-theme="dark"]  body::after { --frame-color: rgb(19, 19, 19); }
@media (max-width: 809px) {
  body::after { border-width: 12px; }
}
</style>
```

Scope it to the homepage via Framer's per-page custom code if the frame is homepage-only.

- [ ] **Step 3: Point the scroll spy at the document**

`withSectionScrollSpy` in `Dave_s_Overrides.tsx` currently resolves a custom scroll root via `getHomeScroll()` — `document.getElementById("home-scroll")` or `[data-framer-name="Home Scroll"]`. With native scrolling that logic is dead weight: delete the custom-root branch and listen on `window` only.

- [ ] **Step 4: Replace the anchor-click interception with native smooth scroll**

Delete the `onHashClick` capture-phase listener. Add instead:

```html
<style>
html { scroll-behavior: smooth; }
/* keep anchored sections clear of the fixed nav */
[data-framer-name="Section"] { scroll-margin-top: 96px; }
</style>
```

Adjust `scroll-margin-top` to the real nav height.

- [ ] **Step 5: Verify the things the JS version broke**

On the published staging site, confirm all of these on `/`:
- Page Down, Space, and arrow keys scroll the page (the old `wheel`-only handler ignored them).
- Refreshing mid-page restores the scroll position.
- Anchor links in the section nav still land in the right place.
- On iOS Safari, the address bar collapses on scroll.
- Framer's own scroll/appear effects fire.

- [ ] **Step 6: Commit the finding**

Update `docs/bugs/` with a short note recording that the scroll container was replaced.

### Task 6.2: Give the redesign page real breakpoints

`/home-redesign` currently has **only a Desktop breakpoint**, no layout template, and **zero colour or text style references** — every value is hardcoded per node. That is the same starting condition that produced the pink-flash bug.

**Files:** `/home-redesign` page

- [ ] **Step 1: Add the breakpoints from `Portfolio Spec.md`**

The spec in `Documents/daves-workspace/Work/Design Job Search/Portfolio 3/Portfolio Spec.md` calls for:

| Breakpoint | Range | Behaviour |
| --- | --- | --- |
| Desktop | 1280+ | default view |
| Laptop/Tablet | 769–1279 | anchor links and the fixed footer (book-a-meeting, email) removed from the home page |
| — | below 1130 | project tiles stack vertically; Kayak image + "How I work" + "My squiggly path to design" stack vertically |
| Phone | ≤768 | |

Framer breakpoints are ranges, so express "below 1130" either as a fourth breakpoint or by making those two sections wrap — prefer wrapping if the only change is stacking, since it avoids another breakpoint to maintain.

- [ ] **Step 2: Set the page breakpoint up correctly first**

Per the Framer core principles: on each page breakpoint set `layout="stack"`, `stackDirection="vertical"`, `height="auto"` **before** inserting children.

- [ ] **Step 3: Apply the `Site` layout template.**

- [ ] **Step 4: Replace every hardcoded colour and text size with a token or text style.**

```bash
npx @framer/agent@latest exec -s $S <<'EOF'
const pages = await framer.agent.getNodesOfTypes({ types: ["WebPageNode"] });
const p = pages.find(x => x.attributes?.path === "/home-redesign");
const refs = await framer.agent.getDescendantReferencesOfTypes(
  { id: p.id, types: ["ColorStyleTokenNode","TextStylePresetNode"] },
  { pagePath: "/home-redesign" }
);
console.log("style references:", refs.length);
EOF
```

Expected before: `0`. Target after: every colour and every text block resolves to a style. **Do not build more of this page until that number is non-zero** — hardcoded values are how the theme problem comes back.

- [ ] **Step 5: Verify at all breakpoints and both themes**

```bash
cd checks && SITE_URL=$SITE_URL node theme-flash.mjs /home-redesign dark
cd checks && SITE_URL=$SITE_URL node theme-flash.mjs /home-redesign light
```

Then capture screenshots at 1440 / 1200 / 900 / 390 using the pattern in `Archive/screenshots/capture.mjs`.

---

## Phase 7 — Homepage redesign

The design direction is Dave's. This phase only guarantees the redesign lands on the new foundation instead of recreating the old one.

### Task 7.1: Design constraints for the redesign

**Files:** `/home-redesign`

- [ ] **Step 1: Constraints that are not negotiable**

- Every colour is a `Theme/*` token. Zero hex or rgb values on nodes.
- Every text block uses one of the 13 text styles. No per-node font sizes.
- Sections are direct children of the breakpoint with `maxWidth` set (e.g. `1080px`) unless deliberately full-bleed — horizontal padding alone still spans the viewport on large screens.
- Reuse one spacing scale for `gap` and `padding` across sections. Do not invent per-section values.
- `overflow="clip"` on sections and cards unless a bleed is intentional.
- Theme differences are expressed by tokens only. If something must physically differ between themes (a logo with a different asset, say), stack both layers and toggle their opacity with CSS under `html[data-theme="dark"]` — never with a React variant swap.

- [ ] **Step 2: Promote `/home-redesign` to `/` when it is ready.** Keep the old home as `/home-legacy` until the redesign has been live for a week.

- [ ] **Step 3: Delete the stale home drafts.** `/home-3` and `/home-4` are drafts; confirm with Dave, then delete. Four homepages is three too many.

---

## Phase 8 — Roll the archetype out to the remaining project pages

No CMS. Each project page stays a real page; the consistency comes from the shared `Project` layout template and shared components, not from a collection.

### Task 8.1: Resolve the duplicate project pages

**Files:** `/data-capture`, `/data-capture-0`, `/data-capture-1`, `/data-capture-2`, `/capacity-planning`, `/capacity-planning-3`

- [ ] **Step 1: Ask Dave which Data Capture page is canonical.** There are four (`/data-capture`, `-0`, `-1`, `-2`) and they have drifted onto three different layout templates. `-2` is the archetype, so it is the likely survivor.

- [ ] **Step 2: Delete the non-canonical duplicates** once confirmed, and the same for `/capacity-planning` vs `/capacity-planning-3`.

- [ ] **Step 3: Set up redirects** for any deleted path that was ever published, so links do not 404. Framer handles these in site settings.

- [ ] **Step 4: Rename the survivor to a clean path** — `/data-capture`, not `/data-capture-2`, with a redirect from the old path.

### Task 8.2: Bring each remaining project page onto the archetype

Repeat per page: `/customer-view`, `/capacity-planning`, `/seller-coupons`.

- [ ] **Step 1: Apply the `Project` layout template.**
- [ ] **Step 2: Replace hardcoded colours with `Theme/*` tokens**, using the Task 2.1 Step 2 scan to find them.
- [ ] **Step 3: Replace any `Dark/*` text style references** — Task 2.2 should have caught these; verify.
- [ ] **Step 4: Confirm the page has Desktop, Tablet and Phone breakpoints.**
- [ ] **Step 5: Run the flash check on that page in both themes.**

```bash
cd checks && SITE_URL=$SITE_URL node theme-flash.mjs /customer-view dark
```

- [ ] **Step 6: Commit after each page.**

### Task 8.3: The `Home Project Thumbnail` component

- [ ] **Step 1: Review its 11 variants** — one per project plus play/alternate states. Without a CMS this stays a variant set, which is fine. But split the axes: if the variants encode *project × state*, use a component property for the state and keep variants for the project, or vice versa. An 11-variant component where the axes are tangled is the thing that becomes 22 variants next time.

---

## Phase 9 — Lock it down

### Task 9.1: Rewrite the architecture doc

**Files:** `docs/architecture.md`, `AGENTS.md`

- [ ] **Step 1: Replace the "Theme and nav (target)" section** with what was actually built, including the Phase 1 branch decision (A or B) and why.
- [ ] **Step 2: Add the check commands** so the next person knows how to verify:

```bash
cd checks && SITE_URL=<staging> node theme-flash.mjs <path> dark
cd checks && FRAMER_SESSION=<id> node override-census.mjs
```

- [ ] **Step 3: Add a "banned patterns" section to `AGENTS.md`** listing the five patterns from Ground Rules #3, each with a one-line reason drawn from the bug it caused.

### Task 9.2: Close the bugs

**Files:** `docs/bugs/2026-09-11-project-nav-theme-delay.md`, `docs/bugs/2026-09-11-theme-toggle-code-component.md`, `docs/bugs/index.md`

- [ ] **Step 1: Mark both open bugs fixed** with the real root cause: *theme was a component/template axis, so the published HTML was structurally the wrong tree and no amount of hydration timing could fix it.*
- [ ] **Step 2: Correct hypothesis A** in the toggle bug. `themeSwitcher` **was** attached — to 14 nodes, including nav variant instances rather than the toggle itself. It mounted; it was wired to the wrong element. That is why driving the canvas spring never worked.
- [ ] **Step 3: Update `docs/bugs/index.md`.**

### Task 9.3: Final scoreboard

- [ ] **Step 1: Re-run the Task 0.2 census and compare**

| Metric | Before | Target |
| --- | --- | --- |
| Colour styles | 90 | ~20–25, all light+dark |
| Text styles | 26 | 13 |
| Layout templates | 6 | 2 |
| Nav components | 3 (+2 nav-links) | 1 |
| `variantSwitcher` attachments | 124 | 0 |
| `themeSwitcher` attachments | 14 | 0 (replaced by exactly one `withThemeToggle`) |
| `projectNavSwitcher` attachments | 8 | 0 |
| Code files | 9 | 5 |
| `!important` declarations in overrides | 80 | 38 — all in `Work_Menu_Morph.tsx`, or 0 if Task 9.4 rebuilds it |
| Pages | 13 | 7–8 |

- [ ] **Step 2: Run every check on every page, both themes.**
- [ ] **Step 3: Publish to production only after Dave reviews staging.**

### Task 9.4: `Work_Menu_Morph.tsx` — the last fragile coupling

This is the only remaining file that styles the canvas from JavaScript. It carries 38 `!important` declarations and 38 `[data-framer-name="..."]` selectors, so renaming a layer in Framer breaks it silently.

- [ ] **Step 1: Check whether the Selected Work menu is in scope for the homepage redesign.** If it is being redesigned anyway, rebuild it natively with variants and gesture variants, and delete the file. That is the preferred outcome.

- [ ] **Step 2: If it survives as-is, make its selectors stable.** Attach a single stable hook instead of depending on Framer's layer names:

```tsx
// in Work_Menu_Morph.tsx
export function withWorkMenuMorph(Component): ComponentType {
    return forwardRef((props, ref) => (
        <Component ref={ref} {...props} data-work-menu="root" />
    ))
}
```

Then rewrite every selector in the injected stylesheet to hang off `[data-work-menu="root"]` rather than `[data-framer-name="..."]` and `:nth-child()`. Layer renames stop mattering; only the attribute does.

- [ ] **Step 3: Record in `docs/architecture.md`** which option was taken.

---

## What this plan deliberately does not do

- **No CMS.** Project pages stay as pages. Consistency comes from the shared `Project` template and shared components.
- **No redesign of `/about-me`, `/customer-view`, `/seller-coupons` content.** They get the foundation, not a new design.
- **No rebuild of `MinimalIPhoneMockup.tsx`, `Device_Mockups.tsx`, or `TextShimmer.tsx`.** These are real code components doing things the canvas cannot do. They are fine.
- **`Work_Menu_Morph.tsx` is only scoped, not rewritten**, unless the Selected Work menu is part of the homepage redesign — in which case rebuild it natively and delete the file.
