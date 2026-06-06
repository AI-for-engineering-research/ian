---
id: TASK-6
title: Implement Canvas FitzHugh-Nagumo reaction-diffusion visualization
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
Add a reusable CPU Canvas reaction-diffusion component based on the exact FitzHugh-Nagumo equations and update scheme from the referenced Frankfurt implementation, rendered with a Belousov-Zhabotinsky-style colormap.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Component implements the source equations du/dt = Du Laplacian(u) + u - u^3/3 - v + I and dv/dt = Dv Laplacian(v) + u + a - b v with Euler integration.
- [ ] #2 Component uses wrapped four-neighbor Laplacian boundary conditions matching the source implementation.
- [ ] #3 Component defaults to the mini-maze preset parameters and exposes model, timestep, steps-per-frame, and simulation-resolution props.
- [ ] #4 Component defaults to a 160x120 internal simulation grid, smooth upscaling, dt=0.2, and stepsPerFrame=2.
- [ ] #5 Component uses dynamic normalization of u rendered through a configurable navy/cyan/cream/orange/dark-red BZ-style colormap.
- [ ] #6 Clicking the visualization randomizes the whole u/v initial field uniformly in [0,1] and resets normalization, while keeping parameters fixed.
- [ ] #7 Component is multi-instance safe, idempotently initialized, and includes an accessible canvas description.
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Create src/components/visualizations/ReactionDiffusion.astro with props for title, ariaLabel, simWidth, simHeight, a, b, I, Du, Dv, dt, stepsPerFrame, and optional color stops.
2. Create src/lib/visualizations/reactionDiffusion.ts with an idempotent initializer reading per-root JSON config.
3. Implement the Frankfurt FitzHugh-Nagumo equations exactly: du/dt = Du*laplace(u) + u - u^3/3 - v + I; dv/dt = Dv*laplace(v) + u + a - b*v.
4. Implement Euler integration with wrapped four-neighbor Laplacian, default mini-maze parameters, dt=0.2, stepsPerFrame=2, and 160x120 simulation grid.
5. Maintain u/v typed arrays plus scratch arrays, randomize uniformly in [0,1], and reset running min/max normalization on initialization/click.
6. Render u through dynamic normalization and the navy/cyan/cream/orange/dark-red BZ-style colormap into ImageData, then smooth-upscale to the visible canvas.
7. Wire lifecycle behavior for resize, offscreen pause, reduced-motion static frame, click randomization, and accessible labeling.
<!-- SECTION:PLAN:END -->
