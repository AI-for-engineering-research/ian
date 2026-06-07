---
id: TASK-11
title: Restyle session transcript entry cards
status: Done
assignee:
  - '@pi'
created_date: '2026-06-07 08:39'
updated_date: '2026-06-07 08:41'
labels:
  - transcript
  - styling
  - agent-logs
dependencies: []
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Update transcript pages so entries render as colored cards by role, remove parent source ID noise, simplify card headers, and collapse long assistant text after an initial preview.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Transcript entries render as rounded cards with light borders and distinct light blue, green, and purple role backgrounds for user, assistant, and tool messages
- [x] #2 Parent source ID is no longer rendered
- [x] #3 Each card header shows a type label at top left and only Entry N at top right; the card itself remains the anchor target
- [x] #4 Long assistant text blocks collapse content after roughly the first 10 source lines
- [x] #5 Tests and build pass
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Simplify SessionTranscriptEntry header markup and remove parent source ID rendering.
2. Add text-block collapsing support for long assistant messages.
3. Update transcript CSS for rounded role-colored cards and simplified headers.
4. Add/update tests for no parent display, no #entry link, role cards, and long assistant details.
5. Run npm test and npm run build.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
- Simplified transcript entry headers to role label plus Entry N and removed the visible #entry link and parent source ID display.
- Added rounded role-colored card styling: user blue, assistant green, tool purple, system neutral.
- Added assistant text collapse after 10 source lines with a details continuation.
- Extended fixture/test coverage for card classes, omitted parent display, no #entry link, and long assistant continuation.
- Verified with npm test and npm run build.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Restyled session transcript entries as role-colored cards and simplified their headers.

Changes:
- Entry cards now use light bordered rounded containers with blue user, green assistant, and purple tool backgrounds.
- Headers show only the role/type at left and Entry N at right; the card remains the anchor target via its id.
- Removed Parent source ID from rendering.
- Long assistant text blocks collapse after 10 source lines with a details disclosure for the remainder.
- Updated fixture coverage and transcript rendering tests.

Tests:
- npm test
- npm run build
<!-- SECTION:FINAL_SUMMARY:END -->
