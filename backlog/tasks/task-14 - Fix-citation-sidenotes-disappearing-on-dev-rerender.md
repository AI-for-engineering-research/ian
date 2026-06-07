---
id: TASK-14
title: Fix citation sidenotes disappearing on dev rerender
status: Done
assignee:
  - '@pi'
created_date: '2026-06-07 14:49'
updated_date: '2026-06-07 14:50'
labels: []
dependencies: []
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Citation sidenotes disappear when the Astro dev server rerenders a page containing citations because citation first-use state should be scoped to a single page render, not persisted across dev rerenders.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Citation first-use state resets for each Astro page render while still suppressing repeated citations within a single rendered page.
- [x] #2 The citation regression is covered by a deterministic test at the citation state-management seam.
- [x] #3 npm run build passes after the fix.
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Reproduce the rerender symptom with a small same-path two-render/state test against the citation helper.
2. Replace globalThis citation seen-state with render-scoped state using Astro.locals in Cite/Citep and citation helpers.
3. Preserve duplicate suppression within one render by sharing the per-render locals set across citations.
4. Add regression tests for same-render suppression and new-render reset.
5. Run citation tests and npm run build, then complete the Backlog task.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
- Reproduced the bug at the state-management seam: global citation seen-state persisted for a pathname beyond a single render.
- Changed citation first-use tracking to store the seen key set on Astro.locals, so each dev-server rerender gets fresh state while citations in the same render still share state.
- Added regression coverage for same-render suppression plus reset across render-state objects.
- Verified node --test test/citations.test.ts and npm run build pass.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Fixed citation sidenotes disappearing after Astro dev-server rerenders.

Root cause:
- Citation first-use suppression used global state keyed by pathname, so a dev rerender of the same page treated all previously rendered citations as already seen and omitted sidenotes.

Changes:
- Moved citation seen-state to per-render `Astro.locals` state passed from `Cite.astro` and `Citep.astro` into `src/lib/citations.ts`.
- Preserved repeated-citation suppression within a single page render.
- Added a regression test proving citation state resets across render-state objects.

Validation:
- `node --test test/citations.test.ts`
- `npm run build`
<!-- SECTION:FINAL_SUMMARY:END -->
