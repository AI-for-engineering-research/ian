---
id: TASK-13
title: Add BibTeX-backed MDX citation sidenotes
status: Done
assignee:
  - '@pi'
created_date: '2026-06-07 14:38'
updated_date: '2026-06-07 14:42'
labels: []
dependencies: []
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Add simple citation tooling for MDX content. References live in src/data/references.bib and are rendered as author-year inline citations with full bibliographic entries in page-local sidenotes. Generated citation data should be TypeScript so CI can build without Pandoc.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Citation data is generated from src/data/references.bib into a committed TypeScript module with author labels, years, and full citation HTML.
- [x] #2 MDX authors can use global children-only <Cite>key</Cite> and <Citep>key; other-key</Citep> components without local imports.
- [x] #3 <Cite> renders a single narrative Chicago-style author-year citation, and <Citep> renders parenthetical citations with semicolon-separated multiple refs.
- [x] #4 The first citation of each BibTeX key on a page adds a full bibliographic sidenote; repeated citations on the same page remain inline only.
- [x] #5 Citation components support page locators for single-key citations and reject page locators on multi-key citations.
- [x] #6 Missing citation keys, malformed keys, invalid slot content, unsupported multi-key <Cite>, and incomplete citation metadata fail the build with clear errors.
- [x] #7 Multi-reference sidenotes render as unmarked, spaced semantic lists.
- [x] #8 CI builds do not require Pandoc because npm run build uses the committed generated citation TypeScript module; citation regeneration is a separate npm script.
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Inspect current MDX/global-component and sidenote patterns to fit citation components into the existing Astro build.
2. Add scripts/generate-citations.ts that reads src/data/references.bib, validates BibTeX keys/metadata, normalizes DOI URL forms, invokes Pandoc to produce compact full-reference HTML, and writes src/data/auto/citations.ts.
3. Add citation helper logic in src/lib/citations.ts for key parsing, child-slot validation, inline author-year formatting, per-page first-citation tracking, and build-error messages.
4. Add src/components/Cite.astro and src/components/Citep.astro using children-only keys, existing Sidenote, page locator support, repeated-citation suppression, and combined multi-reference sidenotes.
5. Register Cite and Citep as global MDX components in astro.config.mjs.
6. Add CSS for unmarked spaced multi-citation sidenote lists.
7. Add npm script "citations" without changing npm run build, generate and commit src/data/auto/citations.ts.
8. Add/adjust tests where practical for generator/helpers and run npm test, npm run citations, and npm run build.
9. Mark acceptance criteria complete, add implementation notes/final summary, and set the task Done after verification.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
- Added BibTeX/Pandoc citation generation script with DOI URL normalization and TypeScript output.
- Added generated src/data/auto/citations.ts from current references.bib.
- Added citation helper tests for slot parsing, formatting, validation, and repeated-citation tracking.
- Added global Cite/Citep Astro components and citation list styling.
- Verified npm run citations and npm run build pass; npm test has one pre-existing/session-fixture failure unrelated to citations (dist/sessions/001-first-session missing), while citation tests pass.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Added BibTeX-backed MDX citation sidenotes.

Changes:
- Added `npm run citations` via `scripts/generate-citations.ts`, generating a committed TypeScript citation map from `src/data/references.bib` without changing `npm run build`.
- Added `src/lib/citations.ts` plus global `<Cite>` and `<Citep>` MDX components using children-only citation keys.
- Implemented Chicago-style author-year inline rendering, page locators for single-key citations, same-page duplicate sidenote suppression, strict key/slot validation, and full-reference sidenotes.
- Added unmarked semantic list styling for multi-reference sidenotes.
- Added citation helper tests.

Validation:
- `npm run citations` passes.
- `npm run build` passes with only pre-existing lifecycle deprecation hints.
- Citation tests pass under `npm test`; the full suite currently has an unrelated pre-existing failure expecting `dist/sessions/001-first-session/index.html`.
<!-- SECTION:FINAL_SUMMARY:END -->
