import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import {
  DEFAULT_HOPF_CONFIG,
  createIsotropicTransform,
  hopfDerivative,
  integrateParticle,
  limitCycleRadius,
  muAtElapsed,
  normalizeConfig,
  rk4HopfStep,
} from '../src/lib/visualizations/hopf.ts';

const componentPath = new URL('../src/components/visualizations/HopfBifurcation.astro', import.meta.url);
const overviewPath = new URL('../src/content/project/overview.mdx', import.meta.url);

test('Hopf defaults expose tunable bifurcation parameters and sanitize invalid overrides', () => {
  assert.equal(DEFAULT_HOPF_CONFIG.muMin, -0.5);
  assert.equal(DEFAULT_HOPF_CONFIG.muMax, 3);
  assert.equal(DEFAULT_HOPF_CONFIG.cycleSeconds, 15);
  assert.equal(DEFAULT_HOPF_CONFIG.domain, 2);
  assert.equal(DEFAULT_HOPF_CONFIG.gridDensity, 13);
  assert.equal(DEFAULT_HOPF_CONFIG.highlightColor, '#111111');
  assert.equal(DEFAULT_HOPF_CONFIG.backgroundColor, '#ffffff');
  assert.equal(DEFAULT_HOPF_CONFIG.particleColor, '#7f1d1d');
  assert.equal(DEFAULT_HOPF_CONFIG.particleSpawnRate, 20);
  assert.equal(DEFAULT_HOPF_CONFIG.maxParticles, 120);
  assert.equal(DEFAULT_HOPF_CONFIG.particleLifetime, 5);

  const config = normalizeConfig({
    muMin: 2,
    muMax: -2,
    cycleSeconds: -1,
    domain: Number.NaN,
    gridDensity: 1,
    particleSpawnRate: -1,
    maxParticles: -1,
    particleLifetime: 0,
  });
  assert.equal(config.muMin, -2);
  assert.equal(config.muMax, 2);
  assert.equal(config.cycleSeconds, DEFAULT_HOPF_CONFIG.cycleSeconds);
  assert.equal(config.domain, DEFAULT_HOPF_CONFIG.domain);
  assert.equal(config.gridDensity, DEFAULT_HOPF_CONFIG.gridDensity);
  assert.equal(config.particleSpawnRate, DEFAULT_HOPF_CONFIG.particleSpawnRate);
  assert.equal(config.maxParticles, DEFAULT_HOPF_CONFIG.maxParticles);
  assert.equal(config.particleLifetime, DEFAULT_HOPF_CONFIG.particleLifetime);
});

test('supercritical Hopf normal form has the expected radial stability behavior', () => {
  const inwardAtUnit = hopfDerivative({ x: 1, y: 0 }, -0.5, 0);
  assert.equal(inwardAtUnit.x, -1.5);
  assert.equal(inwardAtUnit.y, 0);

  const outwardInsideCycle = hopfDerivative({ x: 0.5, y: 0 }, 1, 0);
  assert.equal(outwardInsideCycle.x, 0.375);
  assert.equal(outwardInsideCycle.y, 0);

  const neutralOnCycle = hopfDerivative({ x: 1, y: 0 }, 1, 0);
  assert.equal(neutralOnCycle.x, 0);
  assert.equal(neutralOnCycle.y, 0);
  assert.equal(limitCycleRadius(-0.1), 0);
  assert.equal(limitCycleRadius(2.25), 1.5);
});

test('Hopf particle integration advances points through the mu-dependent flow', () => {
  const stationary = rk4HopfStep({ x: 1, y: 0 }, 1, 0, 0.1);
  assert.ok(Math.abs(stationary.x - 1) < 1e-12);
  assert.equal(stationary.y, 0);

  const config = normalizeConfig({ muMin: -1, muMax: 1, cycleSeconds: 8, omega: 0, particleDt: 0.01 });
  const particle = integrateParticle({ x: 0.25, y: 0, age: 0, lifetime: 4 }, 4000, 0.5, config);
  assert.ok(particle.x > 0.25);
  assert.equal(particle.y, 0);
  assert.equal(particle.age, 0.5);
});

test('mu sweep is sinusoidal across zero over one cycle', () => {
  const config = { muMin: -2, muMax: 2, cycleSeconds: 10 };
  assert.ok(Math.abs(muAtElapsed(0, config) + 2) < 1e-12);
  assert.ok(Math.abs(muAtElapsed(2500, config)) < 1e-12);
  assert.ok(Math.abs(muAtElapsed(5000, config) - 2) < 1e-12);
  assert.ok(Math.abs(muAtElapsed(7500, config)) < 1e-12);
});

test('isotropic transform expands horizontal domain in a 4:3 card without stretching circles', () => {
  const transform = createIsotropicTransform(400, 300, 2, 50);
  assert.equal(transform.yDomain, 2);
  assert.equal(transform.xDomain, 3);

  const origin = transform.toCanvas({ x: 0, y: 0 });
  const unitX = transform.toCanvas({ x: 1, y: 0 });
  const unitY = transform.toCanvas({ x: 0, y: 1 });
  assert.equal(unitX.x - origin.x, transform.scale);
  assert.equal(origin.y - unitY.y, transform.scale);
});

test('Hopf component emits accessible non-click canvas config and overview uses it', async () => {
  const component = await readFile(componentPath, 'utf8');
  assert.match(component, /muMin = DEFAULT_HOPF_CONFIG\.muMin/);
  assert.match(component, /muMax = DEFAULT_HOPF_CONFIG\.muMax/);
  assert.match(component, /cycleSeconds = DEFAULT_HOPF_CONFIG\.cycleSeconds/);
  assert.match(component, /domain = DEFAULT_HOPF_CONFIG\.domain/);
  assert.match(component, /gridDensity = DEFAULT_HOPF_CONFIG\.gridDensity/);
  assert.match(component, /highlightColor = DEFAULT_HOPF_CONFIG\.highlightColor/);
  assert.match(component, /particleSpawnRate = DEFAULT_HOPF_CONFIG\.particleSpawnRate/);
  assert.match(component, /maxParticles = DEFAULT_HOPF_CONFIG\.maxParticles/);
  assert.match(component, /data-hopf-bifurcation/);
  assert.match(component, /<canvas aria-label=\{ariaLabel\} role="img"/);
  assert.match(component, /data-hopf-config/);
  assert.match(component, /initializeHopfBifurcations/);
  assert.doesNotMatch(component, /onClick|addEventListener\('click'|addEventListener\("click"/);

  const overview = await readFile(overviewPath, 'utf8');
  assert.match(overview, /import HopfBifurcation/);
  assert.match(overview, /<HopfBifurcation ariaLabel=/);
});
