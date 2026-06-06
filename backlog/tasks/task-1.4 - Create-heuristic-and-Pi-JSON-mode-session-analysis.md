---
id: TASK-1.4
title: Create heuristic and Pi JSON-mode session analysis
status: To Do
assignee: []
created_date: '2026-06-06 20:27'
labels:
  - agent-logs
  - analysis
dependencies:
  - TASK-1.3
documentation:
  - >-
    backlog/decisions/decision-1 -
    Use-redacted-site-native-Pi-session-transcripts-for-research-logs.md
parent_task_id: TASK-1
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Generate draft highlight candidates from redacted transcript data using deterministic heuristics followed by an optional Pi JSON-mode LLM analysis pass with structured output.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Heuristic analysis identifies candidate spans for corrections, backtracks, errors, failed tools, repeated edits, branches, and notable verification
- [ ] #2 A versioned prompt in prompts/analyze-session-log.md requests strict JSON analysis output
- [ ] #3 Pi JSON-mode output is captured under .research-log-work for reproducibility
- [ ] #4 Malformed or failed LLM analysis falls back to heuristic-only draft data without preventing import by default
<!-- AC:END -->
