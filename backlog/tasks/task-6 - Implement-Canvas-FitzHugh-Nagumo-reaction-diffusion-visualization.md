---
id: TASK-6
title: Implement Canvas FitzHugh-Nagumo reaction-diffusion visualization
status: Done
assignee:
  - '@pi'
created_date: '2026-06-06 21:43'
updated_date: '2026-06-06 22:55'
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
- [x] #1 Component implements the source equations du/dt = Du Laplacian(u) + u - u^3/3 - v + I and dv/dt = Dv Laplacian(v) + u + a - b v with Euler integration.
- [x] #2 Component uses wrapped four-neighbor Laplacian boundary conditions matching the source implementation.
- [x] #3 Component defaults to the mini-maze preset parameters and exposes model, timestep, steps-per-frame, and simulation-resolution props.
- [x] #4 Component defaults to a 160x120 internal simulation grid, smooth upscaling, dt=0.2, and stepsPerFrame=2.
- [x] #5 Component uses dynamic normalization of u rendered through a configurable navy/cyan/cream/orange/dark-red BZ-style colormap.
- [x] #6 Clicking the visualization randomizes the whole u/v initial field uniformly in [0,1] and resets normalization, while keeping parameters fixed.
- [x] #7 Component is multi-instance safe, idempotently initialized, and includes an accessible canvas description.
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

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
- Reviewed existing canvas lifecycle, Lorenz, and Hopf visualization conventions before implementation.

- Added reusable ReactionDiffusion Astro component and FitzHugh-Nagumo simulation library with tests for defaults, equations, wrapped Laplacian, Euler integration, randomization, colormap, and component wiring.
- Verified with npm test and npm run build.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Implemented the TASK-6 FitzHugh-Nagumo reaction-diffusion visualization.

Changes:
- Added a reusable ReactionDiffusion Astro component with accessible canvas labeling, per-instance JSON config, and props for model parameters, timestep, steps-per-frame, simulation resolution, and BZ color stops.
- Added a CPU Canvas simulation library implementing the specified FitzHugh-Nagumo equations, Euler integration, wrapped four-neighbor Laplacian boundaries, mini-maze defaults, 160x120 internal grid, dynamic u normalization, smooth upscaling, and click-to-randomize behavior.
- Added focused tests covering defaults, equation math, wrapped boundaries, Euler stepping, randomization/normalization reset, colormap interpolation, and component conventions.

Validation:
- npm test
- npm run build
<!-- SECTION:FINAL_SUMMARY:END -->
