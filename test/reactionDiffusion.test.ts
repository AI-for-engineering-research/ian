import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import {
  DEFAULT_BZ_COLOR_STOPS,
  DEFAULT_REACTION_DIFFUSION_CONFIG,
  MINI_MAZE_MODEL,
  colorForValue,
  createReactionDiffusionState,
  eulerStep,
  fitzhughNagumoDerivative,
  normalizeConfig,
  randomizeState,
  wrappedFourNeighborLaplacian,
  writeStateToImageData,
} from '../src/lib/visualizations/reactionDiffusion.ts';

const componentPath = new URL('../src/components/visualizations/ReactionDiffusion.astro', import.meta.url);
const overviewPath = new URL('../src/content/project/overview.mdx', import.meta.url);

test('reaction-diffusion defaults expose mini-maze model and simulation controls', () => {
  assert.deepEqual(MINI_MAZE_MODEL, { a: 0.7, b: 0.8, I: 0.5, Du: 1, Dv: 20 });
  assert.equal(DEFAULT_REACTION_DIFFUSION_CONFIG.simWidth, 160);
  assert.equal(DEFAULT_REACTION_DIFFUSION_CONFIG.simHeight, 120);
  assert.equal(DEFAULT_REACTION_DIFFUSION_CONFIG.dt, 0.2);
  assert.equal(DEFAULT_REACTION_DIFFUSION_CONFIG.stepsPerFrame, 2);
  assert.deepEqual(DEFAULT_REACTION_DIFFUSION_CONFIG.colorStops, DEFAULT_BZ_COLOR_STOPS);

  const config = normalizeConfig({
    model: { a: 1.1, Dv: 8 },
    dt: -1,
    timestep: 0.125,
    simWidth: 1,
    simHeight: Number.NaN,
    stepsPerFrame: 0,
  });

  assert.equal(config.a, 1.1);
  assert.equal(config.b, MINI_MAZE_MODEL.b);
  assert.equal(config.Dv, 8);
  assert.equal(config.dt, 0.125);
  assert.equal(config.simWidth, DEFAULT_REACTION_DIFFUSION_CONFIG.simWidth);
  assert.equal(config.simHeight, DEFAULT_REACTION_DIFFUSION_CONFIG.simHeight);
  assert.equal(config.stepsPerFrame, DEFAULT_REACTION_DIFFUSION_CONFIG.stepsPerFrame);
});

test('FitzHugh-Nagumo derivative uses the source equations exactly', () => {
  const derivative = fitzhughNagumoDerivative(0.6, 0.2, -0.1, 0.05, MINI_MAZE_MODEL);
  assert.ok(Math.abs(derivative.du - (MINI_MAZE_MODEL.Du * -0.1 + 0.6 - 0.6 ** 3 / 3 - 0.2 + MINI_MAZE_MODEL.I)) < 1e-12);
  assert.ok(Math.abs(derivative.dv - (MINI_MAZE_MODEL.Dv * 0.05 + 0.6 + MINI_MAZE_MODEL.a - MINI_MAZE_MODEL.b * 0.2)) < 1e-12);
});

test('wrapped four-neighbor Laplacian wraps at all boundaries', () => {
  const field = new Float32Array([
    1, 2, 3,
    4, 5, 6,
    7, 8, 9,
  ]);

  assert.equal(wrappedFourNeighborLaplacian(field, 3, 3, 1, 1), 0);
  assert.equal(wrappedFourNeighborLaplacian(field, 3, 3, 0, 0), 2 + 3 + 4 + 7 - 4 * 1);
  assert.equal(wrappedFourNeighborLaplacian(field, 3, 3, 2, 2), 8 + 7 + 6 + 3 - 4 * 9);
});

test('Euler integration advances u and v arrays using wrapped Laplacians', () => {
  const state = createReactionDiffusionState(2, 2, () => 0);
  state.u.set([0.2, 0.4, 0.6, 0.8]);
  state.v.set([0.1, 0.3, 0.5, 0.7]);
  const model = { a: 0.1, b: 0.2, I: 0.3, Du: 0.4, Dv: 0.5 };

  const lapU = wrappedFourNeighborLaplacian(state.u, 2, 2, 0, 0);
  const lapV = wrappedFourNeighborLaplacian(state.v, 2, 2, 0, 0);
  const expected = fitzhughNagumoDerivative(0.2, 0.1, lapU, lapV, model);
  eulerStep(state, model, 0.25);

  assert.ok(Math.abs(state.u[0] - (0.2 + 0.25 * expected.du)) < 1e-7);
  assert.ok(Math.abs(state.v[0] - (0.1 + 0.25 * expected.dv)) < 1e-7);
  assert.equal(state.minU <= state.u[0], true);
  assert.equal(state.maxU >= state.u[0], true);
});

test('randomization fills both fields in [0,1] and resets dynamic normalization', () => {
  const values = [0.1, 0.9, 0.2, 0.8, 0.3, 0.7, 0.4, 0.6];
  let i = 0;
  const state = createReactionDiffusionState(2, 2, () => values[i++]);

  assert.deepEqual([...state.u], [0.1, 0.2, 0.3, 0.4].map((value) => Math.fround(value)));
  assert.deepEqual([...state.v], [0.9, 0.8, 0.7, 0.6].map((value) => Math.fround(value)));
  assert.equal(state.minU, Number.POSITIVE_INFINITY);
  assert.equal(state.maxU, Number.NEGATIVE_INFINITY);

  randomizeState(state, () => 0.5);
  assert.ok([...state.u, ...state.v].every((value) => value === 0.5));
  assert.equal(state.minU, Number.POSITIVE_INFINITY);
  assert.equal(state.maxU, Number.NEGATIVE_INFINITY);
});

test('image rendering recomputes normalization after randomization reset', () => {
  const state = createReactionDiffusionState(2, 1, () => 0);
  state.u.set([0.25, 0.75]);
  state.minU = Number.POSITIVE_INFINITY;
  state.maxU = Number.NEGATIVE_INFINITY;
  const imageData = { data: new Uint8ClampedArray(8) } as ImageData;

  writeStateToImageData(state, imageData);

  assert.equal(state.minU, Math.fround(0.25));
  assert.equal(state.maxU, Math.fround(0.75));
  assert.deepEqual([...imageData.data.slice(0, 4)], [7, 17, 38, 255]);
  assert.deepEqual([...imageData.data.slice(4, 8)], [95, 15, 15, 255]);
});

test('BZ colormap interpolates from navy through cream to dark red', () => {
  assert.deepEqual(colorForValue(0), [7, 17, 38]);
  assert.deepEqual(colorForValue(1), [95, 15, 15]);
  const middle = colorForValue(0.52);
  assert.deepEqual(middle, [255, 247, 214]);
});

test('ReactionDiffusion component emits accessible click-capable canvas config and overview uses it', async () => {
  const component = await readFile(componentPath, 'utf8');
  assert.match(component, /model = \{\}/);
  assert.match(component, /timestep/);
  assert.match(component, /stepsPerFrame = DEFAULT_REACTION_DIFFUSION_CONFIG\.stepsPerFrame/);
  assert.match(component, /simulationResolution/);
  assert.match(component, /simWidth = simulationResolution\?\.width \?\? DEFAULT_REACTION_DIFFUSION_CONFIG\.simWidth/);
  assert.match(component, /simHeight = simulationResolution\?\.height \?\? DEFAULT_REACTION_DIFFUSION_CONFIG\.simHeight/);
  assert.match(component, /colorStops = DEFAULT_REACTION_DIFFUSION_CONFIG\.colorStops/);
  assert.match(component, /data-reaction-diffusion/);
  assert.match(component, /<canvas aria-label=\{ariaLabel\} role="img"/);
  assert.match(component, /data-reaction-diffusion-config/);
  assert.match(component, /initializeReactionDiffusions/);

  const overview = await readFile(overviewPath, 'utf8');
  assert.match(overview, /import ReactionDiffusion/);
  assert.match(overview, /<ReactionDiffusion ariaLabel=/);
  assert.match(overview, /BZ-style maze pattern|Belousov-Zhabotinsky-style/);
});
