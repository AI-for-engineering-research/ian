import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import {
  DEFAULT_LORENZ_CONFIG,
  fitProjectedPoints,
  generateLorenzTrajectory,
  normalizeConfig,
  projectLorenzPoint,
  projectionBasis,
  rk4Step,
} from '../src/lib/visualizations/lorenz.ts';

const componentPath = new URL('../src/components/visualizations/LorenzAttractor.astro', import.meta.url);
const libPath = new URL('../src/lib/visualizations/lorenz.ts', import.meta.url);
const overviewPath = new URL('../src/content/project/overview.mdx', import.meta.url);

test('Lorenz defaults expose canonical parameters and sanitized overridable options', () => {
  assert.equal(DEFAULT_LORENZ_CONFIG.sigma, 10);
  assert.equal(DEFAULT_LORENZ_CONFIG.rho, 28);
  assert.equal(DEFAULT_LORENZ_CONFIG.beta, 8 / 3);

  assert.equal(DEFAULT_LORENZ_CONFIG.speed, 144);
  assert.deepEqual(DEFAULT_LORENZ_CONFIG.viewpoint, { x: 1.5, y: -2.2, z: 1.1 });

  const config = normalizeConfig({
    sigma: 12,
    rho: Number.NaN,
    beta: 3,
    trailLength: -1,
    dt: -0.1,
    speed: 288,
    viewpoint: { x: 0, y: 0, z: 1 },
  });
  assert.equal(config.sigma, 12);
  assert.equal(config.rho, 28);
  assert.equal(config.beta, 3);
  assert.equal(config.trailLength, DEFAULT_LORENZ_CONFIG.trailLength);
  assert.equal(config.dt, DEFAULT_LORENZ_CONFIG.dt);
  assert.equal(config.speed, 288);
  assert.deepEqual(config.viewpoint, { x: 0, y: 0, z: 1 });
});

test('RK4 Lorenz integration generates finite burned-in trajectories from deterministic initial conditions', () => {
  const initial = { x: 1, y: 1, z: 1 };
  const firstStep = rk4Step(initial, DEFAULT_LORENZ_CONFIG, 0.01);
  assert.notDeepEqual(firstStep, initial);
  assert.ok(Number.isFinite(firstStep.x));
  assert.ok(Number.isFinite(firstStep.y));
  assert.ok(Number.isFinite(firstStep.z));

  const trajectory = generateLorenzTrajectory(DEFAULT_LORENZ_CONFIG, {
    initial,
    length: 80,
    burnInSteps: 20,
    dt: 0.01,
  });

  assert.equal(trajectory.length, 80);
  assert.ok(trajectory.every((point) => Number.isFinite(point.x) && Number.isFinite(point.y) && Number.isFinite(point.z)));
  assert.notDeepEqual(trajectory[0], firstStep);
});

test('projection uses configurable orthographic viewpoint and fit preserves equal x/y scale', () => {
  const topDown = projectLorenzPoint({ x: 2, y: 3, z: 10 }, { x: 0, y: 0, z: 1 });
  assert.equal(topDown.x, 2);
  assert.equal(topDown.y, 3);

  const sideView = projectLorenzPoint({ x: 2, y: 3, z: 10 }, { x: 1, y: 0, z: 0 });
  assert.equal(sideView.x, -10);
  assert.equal(sideView.y, 3);

  const basis = projectionBasis(DEFAULT_LORENZ_CONFIG.viewpoint);
  assert.ok(Math.abs(Math.hypot(basis.forward.x, basis.forward.y, basis.forward.z) - 1) < 1e-12);
  assert.ok(Math.abs(Math.hypot(basis.right.x, basis.right.y, basis.right.z) - 1) < 1e-12);
  assert.ok(Math.abs(Math.hypot(basis.up.x, basis.up.y, basis.up.z) - 1) < 1e-12);
  assert.ok(Math.abs(basis.forward.x * basis.right.x + basis.forward.y * basis.right.y + basis.forward.z * basis.right.z) < 1e-12);

  const fitted = fitProjectedPoints([
    { x: -10, y: -5 },
    { x: 10, y: -5 },
    { x: -10, y: 5 },
    { x: 10, y: 5 },
  ], 240, 140, 20);

  const width = fitted[1].x - fitted[0].x;
  const height = fitted[2].y - fitted[0].y;
  assert.equal(width, 200);
  assert.equal(height, -100);
  assert.equal(Math.abs(width / 20), Math.abs(height / 10));
});

test('Lorenz component emits accessible canvas config and overview uses it in the media grid', async () => {
  const component = await readFile(componentPath, 'utf8');
  const lib = await readFile(libPath, 'utf8');
  assert.match(component, /sigma = DEFAULT_LORENZ_CONFIG\.sigma/);
  assert.match(component, /rho = DEFAULT_LORENZ_CONFIG\.rho/);
  assert.match(component, /beta = DEFAULT_LORENZ_CONFIG\.beta/);
  assert.match(component, /speed = DEFAULT_LORENZ_CONFIG\.speed/);
  assert.match(component, /viewpoint = DEFAULT_LORENZ_CONFIG\.viewpoint/);
  assert.match(component, /import PointerIcon/);
  assert.match(component, /data-lorenz-attractor/);
  assert.match(component, /<canvas aria-label=\{ariaLabel\} role="img"/);
  assert.match(component, /<PointerIcon \/>/);
  assert.match(component, /data-lorenz-config/);
  assert.match(component, /initializeLorenzAttractors/);
  assert.match(lib, /context\.fillStyle = '#ffffff'/);

  const overview = await readFile(overviewPath, 'utf8');
  assert.match(overview, /import LorenzAttractor/);
  assert.match(overview, /<LorenzAttractor[^>]*ariaLabel=/);
  assert.match(overview, /click to (randomize initial conditions|restart from a new initial condition)/);
});
