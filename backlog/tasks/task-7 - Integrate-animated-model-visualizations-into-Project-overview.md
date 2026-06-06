---
id: TASK-7
title: Integrate animated model visualizations into Project overview
status: In Progress
assignee:
  - '@pi'
created_date: '2026-06-06 21:43'
updated_date: '2026-06-06 21:46'
labels:
  - visualization
  - integration
dependencies: []
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Replace the Project overview placeholder figure with a reusable three-up row containing the Lorenz, Hopf, and FitzHugh-Nagumo Canvas visualization components.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Project overview imports and renders MediaGrid with the three visualization components near the top before the Working question section.
- [ ] #2 The placeholder figure is removed from the Project overview page.
- [ ] #3 Lorenz and Hopf visualizations use white drawing surfaces with restrained black/grey styling plus dark-red highlight; reaction-diffusion uses the BZ-style colormap.
- [ ] #4 Visualization cards use a white background, light rounded outline, and no or very subtle shadow.
- [ ] #5 The page builds successfully with Astro after integration.
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Update src/content/project/overview.mdx to import MediaGrid and the three visualization components.
2. Replace the existing placeholder Figure import/usage with a MediaGrid near the top, before the Working question section.
3. Render LorenzAttractor, HopfBifurcation, and ReactionDiffusion as three slotted children with concise visible titles/captions.
4. Add or verify shared global card styling: white media-card background, light rounded outline, restrained/no shadow, canvas fills the aspect-ratio frame.
5. Run npm run build to verify Astro type checking and static build.
6. After successful verification, mark relevant acceptance criteria complete and add a PR-style final summary.
<!-- SECTION:PLAN:END -->
