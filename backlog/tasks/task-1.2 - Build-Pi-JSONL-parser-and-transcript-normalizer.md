---
id: TASK-1.2
title: Build Pi JSONL parser and transcript normalizer
status: To Do
assignee: []
created_date: '2026-06-06 20:26'
labels:
  - agent-logs
  - importer
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
Parse original Pi session JSONL files into the site-owned transcript schema while preserving public evidence structure such as roles, timestamps, source IDs, parent relationships, tool calls, tool results, errors, and branch or compaction notes.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Valid Pi JSONL sessions are converted into the normalized session transcript schema
- [ ] #2 Stable display entry IDs are assigned in render order while source IDs and parent relationships are preserved
- [ ] #3 Thinking blocks are omitted from public content and represented only by omission metadata
- [ ] #4 Unsupported HTML inputs are rejected with a clear message
<!-- AC:END -->
