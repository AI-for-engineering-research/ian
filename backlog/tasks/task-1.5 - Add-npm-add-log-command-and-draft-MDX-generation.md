---
id: TASK-1.5
title: Add npm add-log command and draft MDX generation
status: Done
assignee:
  - '@pi'
created_date: '2026-06-06 20:27'
updated_date: '2026-06-06 20:55'
labels:
  - agent-logs
  - cli
dependencies:
  - TASK-1.4
documentation:
  - >-
    backlog/decisions/decision-1 -
    Use-redacted-site-native-Pi-session-transcripts-for-research-logs.md
parent_task_id: TASK-1
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Provide the user-facing command that imports a Pi JSONL session, writes private reproducibility artifacts, emits validated public transcript JSON, and creates an editable draft research-log MDX page.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 npm run add-log accepts a JSONL path, explicit --slug, optional --title, --date, --no-analysis, --require-analysis, --force, --dry-run, and --model options
- [x] #2 The command copies raw JSONL and intermediate artifacts into gitignored .research-log-work/<slug> by default
- [x] #3 The command writes src/content/sessions/<slug>.json and src/content/log/<slug>.mdx only after validation
- [x] #4 Generated MDX is draft: true, includes transcript metadata, span-based highlights or TODOs, and links to /sessions/<slug>/ anchors
- [x] #5 Existing public files are not overwritten unless --force is supplied
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Review package scripts, content schemas, parser/redaction/analysis APIs, and existing tests to match project conventions.
2. Design and implement an add-log CLI that parses command options, copies private work artifacts, normalizes/redacts/analyzes the session, validates public outputs, and respects dry-run/force semantics.
3. Generate draft MDX with transcript metadata, analysis-driven highlight links/TODOs, and stable /sessions/<slug>/ anchors.
4. Add tests covering option parsing/import behavior, artifact creation, validation-before-write, draft MDX content, dry-run, and overwrite protection.
5. Run the full test suite and build, update backlog acceptance/final summary/status, then commit with a TASK-1.5 message.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
- Added scripts/add-log.ts with CLI parsing for JSONL path, --slug, --title, --date, --no-analysis, --require-analysis, --force, --dry-run, and --model.
- Implemented import pipeline that copies raw JSONL, writes normalized transcript and analysis artifacts under .research-log-work/<slug>, validates generated public transcript/MDX, and writes src/content/sessions plus src/content/log only after validation.
- Generated draft MDX includes transcript frontmatter metadata, highlight spans/TODOs, and /sessions/<slug>/#entry anchors.
- Added node:test coverage for option parsing, artifact/output generation, dry-run behavior, and overwrite protection.
- Verified with npm test and npm run build.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Implemented TASK-1.5 add-log command and draft MDX generation.

Changes:
- Added npm run add-log backed by scripts/add-log.ts with required JSONL path/--slug support plus --title, --date, --no-analysis, --require-analysis, --force, --dry-run, and --model options.
- The importer copies raw JSONL and reproducibility artifacts into .research-log-work/<slug>, validates generated transcript JSON and draft MDX, then writes src/content/sessions/<slug>.json and src/content/log/<slug>.mdx.
- Generated MDX is draft-first, carries transcript metadata and span frontmatter, includes analysis highlights or TODOs, and links to stable /sessions/<slug>/#entry anchors.
- Existing public outputs are protected unless --force is supplied.

Tests:
- npm test
- npm run build
<!-- SECTION:FINAL_SUMMARY:END -->
