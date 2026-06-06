---
id: TASK-3
title: Add shared canvas visualization lifecycle utility
status: In Progress
assignee:
  - '@pi'
created_date: '2026-06-06 21:43'
updated_date: '2026-06-06 21:46'
labels:
  - visualization
  - infrastructure
dependencies: []
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Create a small browser-side utility for canvas visualizations to share resize, DPR, visibility, reduced-motion, animation-loop, and optional interaction behavior.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Lifecycle utility provides DPR-aware canvas sizing capped at devicePixelRatio 2.
- [ ] #2 Lifecycle utility pauses animations when offscreen and resumes when visible.
- [ ] #3 Lifecycle utility respects prefers-reduced-motion by rendering a static frame without continuous animation.
- [ ] #4 Lifecycle utility supports idempotent per-root initialization and cleanup-friendly event handling.
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Define a small lifecycle API in src/lib/visualizations/lifecycle.ts that accepts a root, canvas, draw callback, resize callback, and optional click callback.
2. Implement DPR-aware sizing from the rendered canvas dimensions, capped at devicePixelRatio 2, with ctx transforms handled consistently.
3. Add ResizeObserver support so visualizations redraw/reconfigure when their card size changes.
4. Add IntersectionObserver visibility tracking to start/stop requestAnimationFrame loops when offscreen.
5. Add prefers-reduced-motion handling so initialization draws one static frame but does not continuously animate.
6. Provide an idempotent initialization helper/marker pattern and cleanup-friendly listener/observer management for component initializers.
<!-- SECTION:PLAN:END -->
