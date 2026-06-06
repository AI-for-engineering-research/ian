---
id: TASK-1
title: Implement Pi session add-log import pipeline
status: To Do
assignee: []
created_date: '2026-06-06 20:26'
updated_date: '2026-06-06 20:27'
labels:
  - agent-logs
  - research-log
dependencies: []
documentation:
  - >-
    backlog/decisions/decision-1 -
    Use-redacted-site-native-Pi-session-transcripts-for-research-logs.md
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Create the end-to-end npm add-log workflow for importing Pi JSONL session logs into private reproducibility artifacts, public redacted transcript data, and draft research-log MDX pages. This parent task tracks the feature described in decision-1; implementation should be split across child tasks.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Parent feature is represented by child tasks that cover importer, redaction, analysis, rendering, CLI, and tests
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Created child tasks TASK-1.1 through TASK-1.8 covering content schema, parser/normalizer, redaction/truncation, Pi JSON-mode analysis, add-log CLI/MDX generation, transcript rendering, safe Markdown, and verification tests.
<!-- SECTION:NOTES:END -->
