# Bug log

This folder is the durable history for bugs we debug in this Framer project. Chat transcripts go stale. These files do not.

## When to use

Before investigating or fixing a bug:

1. Read `index.md` for related past bugs (theme, nav, FOUC, variants, overrides).
2. Open any matching case file. Treat **Did not work** as constraints, not suggestions to retry.
3. Copy `_TEMPLATE.md` to `YYYY-MM-DD-short-slug.md` and fill **Status** as `open`.
4. Debug against the environment the user named (live site vs Framer Preview). They often diverge.
5. After each attempt, append a row to **Attempts** in the same file. Do not wait until the bug is closed.
6. Update `index.md` when you create or close a case.

## File layout

| Path | Purpose |
| --- | --- |
| `index.md` | One-line index of every case |
| `_TEMPLATE.md` | New case scaffold |
| `YYYY-MM-DD-slug.md` | One case per file |

## Rules

- One symptom cluster per file. If a new bug is the same flash in a different place, add a **Related** link and a new **Attempts** section rather than starting from zero.
- Record hypotheses as confirmed, rejected, or inconclusive with evidence (logs, timestamps, live HTML), not guesses.
- Prefer live-site evidence when the user says the bug is live. Preview can hide published-only variant/override issues.
- Do not re-try a **Did not work** approach unless the code or Framer runtime has actually changed.
