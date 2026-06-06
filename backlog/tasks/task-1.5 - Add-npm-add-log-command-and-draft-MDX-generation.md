---
id: TASK-1.5
title: Add npm add-log command and draft MDX generation
status: To Do
assignee: []
created_date: '2026-06-06 20:27'
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
- [ ] #1 npm run add-log accepts a JSONL path, explicit --slug, optional --title, --date, --no-analysis, --require-analysis, --force, --dry-run, and --model options
- [ ] #2 The command copies raw JSONL and intermediate artifacts into gitignored .research-log-work/<slug> by default
- [ ] #3 The command writes src/content/sessions/<slug>.json and src/content/log/<slug>.mdx only after validation
- [ ] #4 Generated MDX is draft: true, includes transcript metadata, span-based highlights or TODOs, and links to /sessions/<slug>/ anchors
- [ ] #5 Existing public files are not overwritten unless --force is supplied
<!-- AC:END -->
