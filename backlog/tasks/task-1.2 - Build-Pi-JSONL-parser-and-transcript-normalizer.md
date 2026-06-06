---
id: TASK-1.2
title: Build Pi JSONL parser and transcript normalizer
status: Done
assignee:
  - '@pi'
created_date: '2026-06-06 20:26'
updated_date: '2026-06-06 20:41'
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
- [x] #1 Valid Pi JSONL sessions are converted into the normalized session transcript schema
- [x] #2 Stable display entry IDs are assigned in render order while source IDs and parent relationships are preserved
- [x] #3 Thinking blocks are omitted from public content and represented only by omission metadata
- [x] #4 Unsupported HTML inputs are rejected with a clear message
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Inspect the existing session content schema and package conventions to choose parser module and test locations.
2. Implement a TypeScript Pi JSONL parser/normalizer that reads JSONL records, rejects HTML inputs, maps roles/timestamps/source IDs/parents/tool calls/tool results/errors/branch notes into the normalized schema, and records thinking omissions without publishing thinking text.
3. Add Node test fixtures covering valid conversion, stable render-order IDs/source relationship preservation, thinking omission metadata, and HTML rejection.
4. Add a project test script if needed, then run the full test suite and build.
5. Mark TASK-1.2 acceptance criteria complete, close it, and commit the focused changes referencing TASK-1.2.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Started TASK-1.2, reviewed dependency TASK-1.1 and decision-1, and prepared the implementation plan.

- Implemented `src/lib/piSessionParser.ts` with JSONL parsing, display ID assignment, source/parent preservation, tool/error handling, and thinking omission metadata.
- Extended the session content schema for source IDs, error blocks, and omission metadata.
- Added parser tests covering all TASK-1.2 acceptance criteria.
- Validation passed: `npm test` and `npm run build`.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Implemented the Pi JSONL parser and transcript normalizer for TASK-1.2.

Changes:
- Added `src/lib/piSessionParser.ts` to parse original Pi JSONL session records into the normalized public transcript shape.
- Preserves render order with stable `entry-N` display IDs while keeping original `sourceId` and source `parentId` values.
- Maps text, tool calls, tool results, errors, timestamps, branches, and participants into the site-owned transcript structure.
- Omits thinking/reasoning blocks from public content and records explicit omission metadata instead.
- Rejects unsupported HTML exports with a clear JSONL-only error message.
- Extended the Astro session schema to validate source IDs, error blocks, and omission metadata.
- Added Node tests for valid conversion, stable IDs/source relationships, thinking omission behavior, and HTML rejection.

Validation:
- `npm test`
- `npm run build`
<!-- SECTION:FINAL_SUMMARY:END -->
