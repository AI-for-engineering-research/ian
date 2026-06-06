---
id: TASK-1.3
title: Implement transcript redaction and truncation
status: To Do
assignee: []
created_date: '2026-06-06 20:26'
labels:
  - agent-logs
  - security
dependencies:
  - TASK-1.2
documentation:
  - >-
    backlog/decisions/decision-1 -
    Use-redacted-site-native-Pi-session-transcripts-for-research-logs.md
parent_task_id: TASK-1
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Apply conservative public-safety processing to normalized Pi transcript content before any public files or LLM analysis inputs are written.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Local home paths, Pi session paths, temp paths, API keys, tokens, secrets, suspicious environment values, and long blob strings are redacted
- [ ] #2 Email addresses are not redacted by default
- [ ] #3 Large tool outputs are collapsed or truncated according to documented thresholds
- [ ] #4 Redaction status and review notes are included in transcript metadata
<!-- AC:END -->
