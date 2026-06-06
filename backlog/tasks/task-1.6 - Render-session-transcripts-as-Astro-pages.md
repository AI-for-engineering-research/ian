---
id: TASK-1.6
title: Render session transcripts as Astro pages
status: To Do
assignee: []
created_date: '2026-06-06 20:27'
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
- [ ] #1 Astro generates /sessions/<slug>/ pages from the sessions content collection
- [ ] #2 Transcript rendering is componentized into reusable session transcript, entry, and content-block components
- [ ] #3 Message text is rendered as sanitized Markdown and never as MDX
- [ ] #4 Tool calls/results, failures, branch annotations, collapsed outputs, and redaction-review banners are displayed clearly
- [ ] #5 Entry anchors are stable and match links generated in research-log MDX
<!-- AC:END -->
