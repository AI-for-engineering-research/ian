---
id: TASK-1.6
title: Render session transcripts as Astro pages
status: Done
assignee:
  - '@pi'
created_date: '2026-06-06 20:27'
updated_date: '2026-06-06 20:58'
labels:
  - agent-logs
  - astro
dependencies:
  - TASK-1.1
documentation:
  - >-
    backlog/decisions/decision-1 -
    Use-redacted-site-native-Pi-session-transcripts-for-research-logs.md
parent_task_id: TASK-1
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Add the public /sessions/<slug>/ transcript route and reusable components for readable, sanitized transcript rendering inside the site layout.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Astro generates /sessions/<slug>/ pages from the sessions content collection
- [x] #2 Transcript rendering is componentized into reusable session transcript, entry, and content-block components
- [x] #3 Message text is rendered as sanitized Markdown and never as MDX
- [x] #4 Tool calls/results, failures, branch annotations, collapsed outputs, and redaction-review banners are displayed clearly
- [x] #5 Entry anchors are stable and match links generated in research-log MDX
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Review the decision doc, existing content collection/schema, and Astro conventions for routes/components/tests.
2. Identify current session transcript data shape and research-log link expectations.
3. Add /sessions/[slug] route plus reusable transcript, entry, and content-block components with sanitized Markdown rendering.
4. Add or update tests/fixtures covering generated routes, anchors, Markdown sanitization, and tool/result/redaction display states.
5. Run the full test suite, update backlog task status/checks/final summary, and commit with a TASK-1.6 reference.
<!-- SECTION:PLAN:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Implemented public Astro transcript pages for session collection entries.

Changes:
- Added /sessions/[slug]/ static route backed by the sessions content collection.
- Added reusable SessionTranscript, SessionTranscriptEntry, and SessionContentBlock components for transcript metadata, stable entry anchors, text, tool calls/results, errors, omissions, branches, and redaction-review UI.
- Added a small sanitized Markdown renderer for transcript text that escapes raw HTML and filters unsafe links instead of executing MDX.
- Expanded the session fixture and styling to cover tool output, failure, branch, truncation/collapse, and redaction states.
- Added tests for sanitized Markdown behavior and built transcript page output.

Tests:
- npm test
- npm run build
<!-- SECTION:FINAL_SUMMARY:END -->
