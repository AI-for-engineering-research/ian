---
id: TASK-1.7
title: Add safe Markdown rendering for transcripts
status: Done
assignee:
  - '@pi'
created_date: '2026-06-06 20:27'
updated_date: '2026-06-06 21:01'
labels:
  - agent-logs
  - security
  - astro
dependencies:
  - TASK-1.6
documentation:
  - >-
    backlog/decisions/decision-1 -
    Use-redacted-site-native-Pi-session-transcripts-for-research-logs.md
parent_task_id: TASK-1
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Introduce a safe Markdown rendering utility for untrusted generated transcript text, including dependency choices and URL/HTML sanitization behavior.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Transcript Markdown supports common prose, lists, links, blockquotes, code spans, and code fences
- [x] #2 Raw HTML, scripts, event handlers, and unsafe URL schemes are sanitized or removed
- [x] #3 All transcript text blocks go through a single renderSafeMarkdown-style utility
- [x] #4 Sanitization behavior is covered by tests or fixtures
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Inspect transcript rendering code, existing schema, and tests to identify all transcript text block rendering paths.
2. Add a safe Markdown rendering utility with dependencies configured for Markdown parsing and sanitization.
3. Route transcript text rendering through the utility and ensure unsafe HTML/URLs are stripped or neutralized.
4. Add tests/fixtures covering supported Markdown and sanitization behavior.
5. Run the full test suite, update task metadata, commit with TASK-1.7 reference, and close the task.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
- Added dependency-free renderSafeMarkdown utility with explicit raw HTML escaping and URL scheme allow-listing.
- Routed transcript text block rendering through renderSafeMarkdown.
- Added transcript Markdown tests covering lists, links, blockquotes, code spans/fences, unsafe schemes, raw HTML attributes, and the legacy renderer alias.
- Verified with npm test.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Implemented safe Markdown rendering for public transcript text.

Changes:
- Added renderSafeMarkdown as the single transcript Markdown renderer with explicit raw HTML escaping, safe URL scheme filtering, code fence language sanitization, unordered/ordered list support, blockquotes, links, code spans, and code fences.
- Routed session transcript text blocks through renderSafeMarkdown while preserving the existing renderSanitizedMarkdown alias for compatibility.
- Added tests for supported transcript Markdown and sanitization behavior, including unsafe schemes, raw HTML attributes, and renderer aliasing.

Tests:
- npm test
<!-- SECTION:FINAL_SUMMARY:END -->
