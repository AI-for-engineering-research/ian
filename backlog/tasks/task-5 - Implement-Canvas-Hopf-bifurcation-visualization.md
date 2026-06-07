---
id: TASK-5
title: Implement Canvas Hopf bifurcation visualization
status: Done
assignee:
  - '@pi'
created_date: '2026-06-06 21:43'
updated_date: '2026-06-06 22:50'
labels:
  - visualization
  - canvas
  - model
dependencies: []
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Add a reusable Canvas-based supercritical Hopf bifurcation component showing the vector field and attractors as the bifurcation parameter sweeps across zero.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Component visualizes the supercritical Hopf normal form with a sinusoidal mu sweep across zero.
- [x] #2 Component draws sparse normalized grey vector-field arrows, a filled stable origin for mu<0, an open unstable origin for mu>0, and a dark-red stable limit cycle for mu>0.
- [x] #3 Component preserves isotropic mathematical scaling so circles remain circular in a 4:3 card.
- [x] #4 Component exposes tunable props for parameter range, cycle duration, domain, grid density, and highlight color.
- [x] #5 Component has no click interactivity, is multi-instance safe, idempotently initialized, and includes an accessible canvas description.
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Create src/components/visualizations/HopfBifurcation.astro with props for title, ariaLabel, muMin, muMax, cycleSeconds, domain, gridDensity, omega, highlightColor, and background styling hooks.
2. Create src/lib/visualizations/hopf.ts with an idempotent initializer reading per-root JSON config.
3. Implement the supercritical Hopf vector field dx/dt = mu*x - omega*y - r^2*x, dy/dt = omega*x + mu*y - r^2*y.
4. Animate mu sinusoidally between muMin and muMax using the lifecycle animation timestamp.
5. Compute an isotropic coordinate transform: fixed vertical domain and horizontal domain expanded by canvas aspect ratio.
6. Draw sparse normalized grey arrows, stable/unstable origin marker encoding, dark-red limit cycle for mu > 0, and a subtle live mu label.
7. Ensure no click interactivity, reduced-motion static rendering, and multi-instance safe initialization.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
- Implemented reusable HopfBifurcation Astro component and Canvas initializer.
- Added Hopf math/config helpers, isotropic transform, animated mu sweep, vector field, stability markers, and limit cycle drawing.
- Added project overview usage, shared visualization styling, and node:test coverage for config, Hopf normal form behavior, mu sweep, isotropic scaling, accessibility, non-click initialization, and integration.
- Verification: npm test; npm run build.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Implemented a reusable Canvas-based supercritical Hopf bifurcation visualization.

Changes:
- Added HopfBifurcation.astro with accessible canvas markup, JSON-backed tunable props, and no click interactivity.
- Added hopf.ts with idempotent lifecycle initialization, sinusoidal μ sweep, supercritical Hopf vector field, isotropic 4:3 scaling, normalized vector-field arrows, origin stability markers, and stable limit-cycle rendering.
- Added shared visualization styling and placed the Hopf visualization in the project overview media grid.
- Added node:test coverage for configuration sanitization, Hopf normal-form behavior, μ sweep timing, isotropic scaling, component accessibility/config output, non-click behavior, and overview integration.

Tests:
- npm test
- npm run build
<!-- SECTION:FINAL_SUMMARY:END -->
