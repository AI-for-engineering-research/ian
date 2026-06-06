---
id: TASK-1.1
title: Add session transcript content schema
status: Done
assignee:
  - '@pi'
created_date: '2026-06-06 20:26'
updated_date: '2026-06-06 20:35'
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
- [x] #1 A sessions content collection validates normalized transcript JSON under src/content/sessions
- [x] #2 The log collection accepts optional transcript metadata without breaking existing log entries
- [x] #3 Malformed public transcript JSON fails validation during the Astro build
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Inspect existing Astro content collection conventions and build script.
2. Add a strict sessions JSON content collection under src/content/sessions using Zod schemas for normalized transcript metadata, participants, entries, tool calls/results, redaction, truncation, and optional analysis spans.
3. Extend the log collection schema with optional transcript metadata that links logs to transcript pages/spans while keeping existing entries valid.
4. Add minimal valid and malformed session fixtures so Astro validation exercises the new collection.
5. Run the full build/test command, mark acceptance criteria, close TASK-1.1, and commit the focused changes referencing TASK-1.1.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
- Added strict Astro/Zod session JSON content collection under src/content/sessions.
- Extended log frontmatter with optional transcript metadata while preserving existing log entry validation.
- Added a valid public session JSON fixture and verified a malformed temporary session JSON file fails Astro content validation.
- Full build passes after removing the malformed temporary fixture.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Added the public transcript content model needed for generated Pi session logs.

Changes:
- Introduced a strict `session` Astro content collection for normalized redacted transcript JSON under `src/content/sessions`.
- Extended research-log frontmatter with optional transcript metadata and span links without requiring changes to existing log entries.
- Added a minimal valid session JSON fixture so normal Astro content syncing/building validates the new schema.

Validation:
- Confirmed a temporary malformed session JSON file fails `npm run build` during Astro content validation.
- Ran the full build suite with `npm run build` successfully.
<!-- SECTION:FINAL_SUMMARY:END -->
