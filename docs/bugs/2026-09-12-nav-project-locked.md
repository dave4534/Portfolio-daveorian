# BUG: Nav - Project variants stay locked

- **Status:** fixed
- **Date:** 2026-09-12
- **Surface:** canvas
- **Pages:** `Nav - Project` (`HWIvXUQkr`)
- **Related:** `docs/architecture.md` (project nav), prior swap of raw Home/Work frames to Nav Button instances

## Symptom

Nav chrome on replica variants (Project Landing, Phone Close/Open) could not be edited freely.

## Repro

1. Open `Nav - Project`.
2. Select **Project Landing**.
3. Try to edit Home / Work / Menu.

## Hypotheses

| ID | Claim | Result | Evidence |
| --- | --- | --- | --- |
| A | Project Landing is a replica of Scroll; Framer locks replica descendants for structure | **confirmed** (part) | Pre-fix: Landing `$isReplica:true`. Replica descendants stay inherited |
| B | Layers have Framer `locked` / `constraintsLocked` set | **rejected** | `locked:null` / plugin `locked:false` |
| C | User is editing the page instance, whose insides are instance-locked | **rejected** | Repro was on the `Nav - Project` component |
| D | Nav Button instances cannot be edited from Nav - Project | **rejected** | User: instances are editable |
| E | Making Landing the primary would unlock it | **rejected as sufficient** | Landing became primary; user still reported lock until instances were replaced |
| L | Existing Home/Work/Menu instances were stale; fresh instances on the primary are editable | **confirmed** | User confirmed after replace |

## Attempts

| When | What we tried | Result | Keep? |
| --- | --- | --- | --- |
| 2026-09-11 | Swap raw frames for Nav Button instances in primary Scroll | Instances existed; Landing still replica-locked | yes (instances) |
| 2026-09-12 | Probe: two FrameNodes, DUPE, SET `$isPrimary`, DEL primary | Only one primary; promote/detach impossible | yes (evidence) |
| 2026-09-12 | Make Project Landing the primary (`uoGuBs61d`) | Did not unlock by itself | yes (Landing stays primary) |
| 2026-09-12 | Replace Home/Work/Menu with new Nav Button instances | User confirmed editable | yes |

## What worked

- Project Landing is the primary variant. Home / Work / Menu are new Nav Button instances on that primary: `W1XNzPQsG`, `X3Isd0Gpp`, `BaHBASSVR`.

## What did not work

- Putting instances only on a Scroll primary does not unlock replica variant canvases.
- `SET $isPrimary`, a second `+FrameNode`, or `DUPE` cannot create a second editable variant.
- Renaming Scroll to Project Landing without replacing the instances.

## Root cause

Replica-variant descendants are inherited and not freely editable. The chrome instances also stayed locked until they were recreated on the primary.

## Fix

Project Landing is the primary (`uoGuBs61d`). Scroll / Phone stay replicas. Home / Work / Menu were replaced with new Nav Button instances. Page scroll-variant IDs map hero → Landing and showcase → Scroll.

## Follow-up

-
