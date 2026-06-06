---
id: TASK-1.1
title: Add session transcript content schema
status: To Do
assignee: []
created_date: '2026-06-06 20:26'
labels:
  - agent-logs
  - astro
dependencies:
  - TASK-1
documentation:
  - >-
    backlog/decisions/decision-1 -
    Use-redacted-site-native-Pi-session-transcripts-for-research-logs.md
parent_task_id: TASK-1
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Define the public Astro content model for generated session transcripts and extend research-log metadata so log entries can link to their full transcript pages.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 A sessions content collection validates normalized transcript JSON under src/content/sessions
- [ ] #2 The log collection accepts optional transcript metadata without breaking existing log entries
- [ ] #3 Malformed public transcript JSON fails validation during the Astro build
<!-- AC:END -->
