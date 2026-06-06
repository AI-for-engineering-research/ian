---
id: TASK-1.3
title: Implement transcript redaction and truncation
status: Done
assignee:
  - '@agent'
created_date: '2026-06-06 20:26'
updated_date: '2026-06-06 20:46'
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
- [x] #1 Local home paths, Pi session paths, temp paths, API keys, tokens, secrets, suspicious environment values, and long blob strings are redacted
- [x] #2 Email addresses are not redacted by default
- [x] #3 Large tool outputs are collapsed or truncated according to documented thresholds
- [x] #4 Redaction status and review notes are included in transcript metadata
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Add a transcript public-safety processing module integrated into the Pi JSONL parser so normalized entries are redacted/truncated before being returned.
2. Redact local/Pi/temp paths, secrets/tokens/env values, and long blobs while preserving email addresses by default.
3. Collapse/truncate oversized tool outputs using exported documented thresholds and record truncation flags.
4. Add transcript-level redaction metadata plus entry and summary redaction counts, then update the Astro content schema.
5. Add node:test coverage for redaction, email preservation, truncation thresholds, and metadata; run the full test suite/build; update backlog status and commit TASK-1.3.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Started TASK-1.3. Reviewed task details, decision-1, parser/schema/test conventions, and added implementation plan.

- Implemented transcript public-safety processing integrated with parsePiJsonlSession.
- Added tests for redactions, email preservation, tool-call argument redaction, medium-output collapse markers, truncation, and metadata.
- Verified with npm test and npm run build.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Implemented transcript redaction and truncation for TASK-1.3.

Changes:
- Added a public-safety processing module for normalized Pi transcripts.
- Redacts local/Pi/temp paths, common secret/token patterns, suspicious environment values, and long blob strings while preserving email addresses by default.
- Marks medium tool outputs for collapsed rendering and truncates oversized tool outputs using exported documented thresholds.
- Records entry-level redactions, transcript redaction summaries, and review metadata/status.
- Updated the Astro session content schema for redaction metadata and collapsed tool results.

Tests:
- npm test
- npm run build
<!-- SECTION:FINAL_SUMMARY:END -->
