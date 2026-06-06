---
id: TASK-4
title: Implement Canvas Lorenz attractor visualization
status: In Progress
assignee:
  - '@pi'
created_date: '2026-06-06 21:43'
updated_date: '2026-06-06 21:46'
labels:
  - visualization
  - canvas
  - model
dependencies: []
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Add a reusable Canvas-based Lorenz attractor component for the overview media grid, using canonical Lorenz parameters by default and no external rendering dependencies.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Component renders a faint grey precomputed Lorenz attractor plus a dark-red fading trail and highlighted current point.
- [ ] #2 Component uses standard default parameters sigma=10, rho=28, beta=8/3 exposed as overridable props.
- [ ] #3 Component uses a fixed oblique 3D-to-2D projection with equal-scale geometry and no camera interaction.
- [ ] #4 Clicking the visualization randomizes initial conditions, applies burn-in, and recomputes the trajectory while keeping parameters fixed.
- [ ] #5 Component is multi-instance safe, idempotently initialized, and includes an accessible canvas description.
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Create src/components/visualizations/LorenzAttractor.astro with props for title, ariaLabel, sigma, rho, beta, highlightColor, trailLength, trajectoryLength, burnInSteps, dt, and speed.
2. Create src/lib/visualizations/lorenz.ts with an idempotent initializer that reads JSON config from data-config roots.
3. Implement RK4 or stable Euler-style Lorenz integration with canonical defaults, random initial-condition generation, burn-in, and precomputed trajectory points.
4. Implement fixed oblique 3D-to-2D projection and fit projected coordinates to the canvas with equal x/y scale.
5. Render a faint grey full-attractor line, a dark-red alpha-fading active trail, and a highlighted current point.
6. Wire lifecycle utility for resize, visibility pause, reduced-motion static frame, and click-to-recompute from new random initial conditions.
7. Confirm multi-instance safety and accessible canvas labeling.
<!-- SECTION:PLAN:END -->
