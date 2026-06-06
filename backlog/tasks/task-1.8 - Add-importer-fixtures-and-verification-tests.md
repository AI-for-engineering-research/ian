---
id: TASK-1.8
title: Add importer fixtures and verification tests
status: To Do
assignee: []
created_date: '2026-06-06 20:27'
labels:
  - agent-logs
  - tests
dependencies:
  - TASK-1.5
  - TASK-1.6
  - TASK-1.7
documentation:
  - >-
    backlog/decisions/decision-1 -
    Use-redacted-site-native-Pi-session-transcripts-for-research-logs.md
parent_task_id: TASK-1
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Cover the add-log pipeline with fixture-based tests and build verification so generated transcripts, analysis fallbacks, redaction, and rendering remain reliable.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Node built-in tests cover parser normalization, tool calls/results, failed tools, branch notes, thinking omission, redaction, truncation, and analysis validation
- [ ] #2 Representative Pi JSONL fixtures are included without secrets or private data
- [ ] #3 npm scripts expose the test command and npm run build remains the integration check
- [ ] #4 The parent task acceptance criteria can be verified from child task completion and passing checks
<!-- AC:END -->
