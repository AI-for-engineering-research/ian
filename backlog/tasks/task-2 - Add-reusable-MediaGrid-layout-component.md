---
id: TASK-2
title: Add reusable MediaGrid layout component
status: In Progress
assignee:
  - '@pi'
created_date: '2026-06-06 21:43'
updated_date: '2026-06-06 21:46'
labels:
  - visualization
  - layout
dependencies: []
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Create a generic slot-based media grid for arranging visualizations, images, plots, and other media in responsive rows on content pages.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 MediaGrid supports arbitrary slotted children without owning media-specific captions or simulation logic.
- [ ] #2 MediaGrid supports a wide/full-content layout suitable for the Project overview page.
- [ ] #3 MediaGrid defaults to a 3-column desktop layout with 2-column tablet and 1-column mobile breakpoints.
- [ ] #4 MediaGrid supports a configurable aspect ratio defaulting to 4 / 3 for child media frames.
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Inspect existing figure/content layout CSS to align MediaGrid with article wide/full conventions.
2. Add src/components/MediaGrid.astro as a slot-only layout component with props for columns, layout, gap, and aspectRatio.
3. Add global CSS for responsive grid behavior: 3 columns on desktop, 2 on tablet, 1 on mobile, with support for wide/full placement.
4. Add a reusable media-frame/aspect-ratio styling hook that child media can opt into without MediaGrid owning captions.
5. Verify with Astro type checking/build once dependent components are present or with a temporary/simple slotted usage if needed.
<!-- SECTION:PLAN:END -->
