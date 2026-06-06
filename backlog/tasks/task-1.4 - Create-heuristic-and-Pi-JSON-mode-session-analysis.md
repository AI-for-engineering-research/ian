---
id: TASK-1.4
title: Create heuristic and Pi JSON-mode session analysis
status: Done
assignee:
  - '@pi'
created_date: '2026-06-06 20:27'
updated_date: '2026-06-06 20:50'
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
- [x] #1 Heuristic analysis identifies candidate spans for corrections, backtracks, errors, failed tools, repeated edits, branches, and notable verification
- [x] #2 A versioned prompt in prompts/analyze-session-log.md requests strict JSON analysis output
- [x] #3 Pi JSON-mode output is captured under .research-log-work for reproducibility
- [x] #4 Malformed or failed LLM analysis falls back to heuristic-only draft data without preventing import by default
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Review existing add-log parser/redaction/schema/test conventions and locate current import pipeline seams.
2. Add deterministic heuristic session analysis covering corrections, backtracks, errors, failed tools, repeated edits, branches, and verification spans.
3. Add the versioned strict-JSON analysis prompt and optional Pi JSON-mode analysis integration that saves prompt/input/output/parsed artifacts under .research-log-work/<slug>/.
4. Make malformed or failed LLM analysis non-fatal by falling back to heuristic-only draft data.
5. Add tests for heuristic categories, artifact capture, and malformed/failure fallback, then run the full test suite/build.
6. Update backlog completion fields and commit with a TASK-1.4 message.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
- Added src/lib/sessionAnalysis.ts with deterministic highlight heuristics for correction, backtrack, error, failed_tool, repeated_edit, branch, and verification candidates.
- Added optional Pi JSON-mode analysis runner support that saves prompt, normalized input, raw output, parsed output, and failure artifacts under .research-log-work/<slug>/.
- Added prompts/analyze-session-log.md as version 1 strict-JSON prompt and gitignored private .research-log-work artifacts.
- Added node:test coverage for heuristic categories, artifact capture, malformed-output fallback, failed-runner fallback, and requireAnalysis behavior.
- Verified with npm test and npm run build.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Implemented TASK-1.4 session analysis support.

Changes:
- Added deterministic session highlight heuristics for corrections, backtracks, errors, failed tools, repeated edits, branches, and verification steps.
- Added optional Pi JSON-mode analysis integration with strict parsed output validation and reproducibility artifacts under .research-log-work/<slug>/.
- Added a versioned prompts/analyze-session-log.md strict-JSON prompt and gitignored private analysis work directories.
- Made malformed or failed Pi analysis non-fatal by default, returning heuristic-only draft candidates while recording error artifacts.

Tests:
- npm test
- npm run build
<!-- SECTION:FINAL_SUMMARY:END -->
