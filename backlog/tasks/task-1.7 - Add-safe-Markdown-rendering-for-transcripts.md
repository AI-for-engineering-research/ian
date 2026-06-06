---
id: TASK-1.7
title: Add safe Markdown rendering for transcripts
status: To Do
assignee: []
created_date: '2026-06-06 20:27'
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
- [ ] #1 Transcript Markdown supports common prose, lists, links, blockquotes, code spans, and code fences
- [ ] #2 Raw HTML, scripts, event handlers, and unsafe URL schemes are sanitized or removed
- [ ] #3 All transcript text blocks go through a single renderSafeMarkdown-style utility
- [ ] #4 Sanitization behavior is covered by tests or fixtures
<!-- AC:END -->
