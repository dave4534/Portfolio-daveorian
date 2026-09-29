# BUG: hero intro and italic paragraph overlap on short phone screens

- **Status:** fixed, verified live (`b93058a91`)
- **Date:** 2026-09-29
- **Surface:** live site
- **Pages:** `/` (Home, Phone breakpoint); tested first on `/home3`
- **Related:** none

## Symptom

On some phones the hero's italic "I'm fortunate to have worked with…" paragraph prints on top of the intro paragraph ("I'm an Isra-merican living in…").

## Repro

1. Open the page at about 383×639 (Phone breakpoint).
2. Look at the hero. The two paragraphs overlap.

## Hypotheses

| ID | Claim | Result | Evidence |
| --- | --- | --- | --- |
| A | Hero Row is a fixed `80vh`, so on short screens the content does not fit | confirmed | 511px tall at 639px viewport; content needs more |
| B | The italic paragraph is `1fr`, so it gets only the leftover ~50px while its text is ~170px tall | confirmed | Measured box 50px; text is bottom-anchored (`justify-content: flex-end`) so it overflows upward over the intro |

## Attempts

| When | What we tried | Result | Keep? |
| --- | --- | --- | --- |
| 2026-09-29 | DOM test on the live `/home3`: `height:auto` on the italic paragraph, Hero, Left, and Hero Row (`min-height: 80vh`) | overlap gone | yes |
| 2026-09-29 | Same four changes on `/home3` Phone breakpoint, published | overlap gone at 383×639 | yes |
| 2026-09-29 | Same four changes on `/` Phone breakpoint, published | overlap gone at 383×639 | yes |

## What worked

- Phone breakpoint: Hero Row `height: auto` + `minHeight: 80vh`; Hero, Left and the italic Fortunate Paragraph `height: auto`.

## What did not work

- Nothing else tried.

## Root cause

A fixed-height (`1fr`) text box inside a viewport-height container. Text anchored to the bottom of a box shorter than its content grows upward.

## Fix

See "What worked". Tablet already used an auto-height paragraph and was left alone. Only tested at 383×639; other sizes and real devices not checked.

## Follow-up

- Try other phone sizes / real devices.
