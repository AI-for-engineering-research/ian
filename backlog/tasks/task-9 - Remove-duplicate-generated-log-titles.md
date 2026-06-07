---
id: TASK-9
title: Remove duplicate generated log titles
status: Done
assignee:
  - '@pi'
created_date: '2026-06-07 08:32'
updated_date: '2026-06-07 08:32'
labels:
  - agent-logs
  - bugfix
dependencies: []
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Generated research-log MDX currently repeats the frontmatter title as a top-level Markdown heading, but the log page layout already renders the title. Update generation and existing generated content to avoid duplicate titles.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 add-log generated MDX does not include a duplicate top-level # title after frontmatter
- [x] #2 Existing generated log entry no longer repeats the layout title in body content
- [x] #3 Tests and build pass
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Remove the generated # title line from add-log MDX output.
2. Update tests that assert generated MDX structure if needed.
3. Remove the duplicate title from the existing generated log MDX.
4. Run npm test and npm run build.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
- Removed duplicate H1 generation from add-log MDX output.
- Removed the duplicate H1 from src/content/log/001-ssg-choice.mdx.
- Added a test assertion that generated MDX does not repeat the title as a top-level heading.
- Verified with npm test and npm run build.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Removed duplicate titles from generated research-log MDX.

Changes:
- add-log no longer emits a body-level # title because ContentLayout renders the frontmatter title.
- Updated the existing 001-ssg-choice generated log entry.
- Added test coverage for the generated MDX shape.

Tests:
- npm test
- npm run build
<!-- SECTION:FINAL_SUMMARY:END -->
