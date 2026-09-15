# BUG: section nav links flash pink on load

- **Status:** fixed
- **Date:** 2026-09-10
- **Surface:** live site (first paint)
- **Pages:** `/home-redesign`
- **Related:** [project-nav-theme-delay](2026-09-11-project-nav-theme-delay.md)

## Symptom

On website load, section nav links flash pink (`rgb(255, 74, 118)`) for a few milliseconds, then become gray/white.

## Root cause

Canvas **Pink Link** style painted on first HTML. `withSectionScrollSpy` only applied gray/white after JavaScript.

## What worked

- Switch those links to a **Section Nav Link** style: default gray including visited, hover/active white.
- Inject stylesheet on first paint; do not stamp inline colors after load.

## What did not work

- Painting colors only in a `useEffect` scroll spy (too late for first paint).
