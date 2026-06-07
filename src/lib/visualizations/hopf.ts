import { initializeCanvasVisualization, type CanvasVisualizationFrame } from './lifecycle.ts';

export interface HopfConfig {
  ariaLabel: string;
  muMin: number;
  muMax: number;
  cycleSeconds: number;
  domain: number;
  gridDensity: number;
  omega: number;
  highlightColor: string;
  backgroundColor: string;
  particleColor: string;
  particleSpawnRate: number;
  maxParticles: number;
  particleLifetime: number;
  particleRadius: number;
  particleDt: number;
}

export interface HopfVector {
  x: number;
  y: number;
}

export interface HopfParticle extends HopfVector {
  age: number;
  lifetime: number;
}

export interface HopfTransform {
  scale: number;
  centerX: number;
  centerY: number;
  xDomain: number;
  yDomain: number;
  toCanvas: (point: HopfVector) => HopfVector;
}

export const DEFAULT_HOPF_CONFIG: HopfConfig = {
  ariaLabel:
    'Canvas visualization of a supercritical Hopf bifurcation. The parameter mu sweeps across zero while sample points move through the changing vector field toward the stable origin or limit cycle.',
  muMin: -0.5,
  muMax: 3.0,
  cycleSeconds: 15,
  domain: 2,
  gridDensity: 13,
  omega: 1.15,
  highlightColor: '#111111',
  backgroundColor: '#ffffff',
  particleColor: '#7f1d1d',
  particleSpawnRate: 20,
  maxParticles: 120,
  particleLifetime: 5,
  particleRadius: 2.2,
  particleDt: 0.018,
};

const PADDING = 18;
const ARROW_LENGTH = 11;

type HopfState = {
  config: HopfConfig;
  particles: HopfParticle[];
  spawnCarry: number;
};

export function initializeHopfBifurcations(scope: ParentNode = document): void {
  const roots = scope.querySelectorAll<HTMLElement>('[data-hopf-bifurcation]');
  roots.forEach((root) => initializeHopfBifurcation(root));
}

export function initializeHopfBifurcation(root: HTMLElement): void {
  const canvas = root.querySelector<HTMLCanvasElement>('canvas');
  if (!canvas) return;

  const config = readConfig(root);
  const state: HopfState = { config, particles: [], spawnCarry: 0 };
  initializeCanvasVisualization({
    root,
    canvas,
    draw: (frame) => drawHopf(frame, state),
  });
}

export function readConfig(root: HTMLElement): HopfConfig {
  const scriptConfig = root.querySelector<HTMLScriptElement>('script[data-hopf-config]')?.textContent;
  const rawConfig = scriptConfig ?? root.dataset.config;
  if (!rawConfig) return { ...DEFAULT_HOPF_CONFIG };

  try {
    return normalizeConfig(JSON.parse(rawConfig));
  } catch {
    return { ...DEFAULT_HOPF_CONFIG };
  }
}

export function normalizeConfig(config: Partial<HopfConfig>): HopfConfig {
  const merged = { ...DEFAULT_HOPF_CONFIG, ...config };
  const muMin = finiteOrDefault(merged.muMin, DEFAULT_HOPF_CONFIG.muMin);
  const muMax = finiteOrDefault(merged.muMax, DEFAULT_HOPF_CONFIG.muMax);

  return {
    ...merged,
    muMin: Math.min(muMin, muMax),
    muMax: Math.max(muMin, muMax),
    cycleSeconds: positiveOrDefault(merged.cycleSeconds, DEFAULT_HOPF_CONFIG.cycleSeconds),
    domain: positiveOrDefault(merged.domain, DEFAULT_HOPF_CONFIG.domain),
    gridDensity: integerAtLeast(merged.gridDensity, 3, DEFAULT_HOPF_CONFIG.gridDensity),
    omega: finiteOrDefault(merged.omega, DEFAULT_HOPF_CONFIG.omega),
    particleSpawnRate: nonNegativeOrDefault(merged.particleSpawnRate, DEFAULT_HOPF_CONFIG.particleSpawnRate),
    maxParticles: integerAtLeast(merged.maxParticles, 0, DEFAULT_HOPF_CONFIG.maxParticles),
    particleLifetime: positiveOrDefault(merged.particleLifetime, DEFAULT_HOPF_CONFIG.particleLifetime),
    particleRadius: positiveOrDefault(merged.particleRadius, DEFAULT_HOPF_CONFIG.particleRadius),
    particleDt: positiveOrDefault(merged.particleDt, DEFAULT_HOPF_CONFIG.particleDt),
  };
}

export function hopfDerivative(point: HopfVector, mu: number, omega = DEFAULT_HOPF_CONFIG.omega): HopfVector {
  const radiusSquared = point.x * point.x + point.y * point.y;
  return {
    x: mu * point.x - omega * point.y - radiusSquared * point.x,
    y: omega * point.x + mu * point.y - radiusSquared * point.y,
  };
}

export function muAtElapsed(elapsedMilliseconds: number, config: Pick<HopfConfig, 'muMin' | 'muMax' | 'cycleSeconds'>): number {
  const midpoint = (config.muMin + config.muMax) / 2;
  const amplitude = (config.muMax - config.muMin) / 2;
  if (amplitude === 0) return midpoint;
  const phase = (elapsedMilliseconds / (config.cycleSeconds * 1000)) * Math.PI * 2 - Math.PI / 2;
  return midpoint + amplitude * Math.sin(phase);
}

export function limitCycleRadius(mu: number): number {
  return mu > 0 ? Math.sqrt(mu) : 0;
}

export function createIsotropicTransform(width: number, height: number, domain: number, padding = PADDING): HopfTransform {
  const safeWidth = Math.max(1, width);
  const safeHeight = Math.max(1, height);
  const availableWidth = Math.max(1, safeWidth - padding * 2);
  const availableHeight = Math.max(1, safeHeight - padding * 2);
  const yDomain = positiveOrDefault(domain, DEFAULT_HOPF_CONFIG.domain);
  const scale = availableHeight / (yDomain * 2);
  const xDomain = availableWidth / scale / 2;
  const centerX = safeWidth / 2;
  const centerY = safeHeight / 2;

  return {
    scale,
    centerX,
    centerY,
    xDomain,
    yDomain,
    toCanvas: (point) => ({
      x: centerX + point.x * scale,
      y: centerY - point.y * scale,
    }),
  };
}

function drawHopf(frame: CanvasVisualizationFrame, state: HopfState): void {
  const { context, width, height, elapsed, delta, reducedMotion } = frame;
  const config = state.config;
  const transform = createIsotropicTransform(width, height, config.domain);
  const mu = reducedMotion ? 0.62 * config.muMax + 0.38 * config.muMin : muAtElapsed(elapsed, config);

  if (!reducedMotion) updateParticles(state, transform, elapsed, delta);
  else if (state.particles.length === 0) seedStaticParticles(state, transform);

  context.clearRect(0, 0, width, height);
  context.fillStyle = config.backgroundColor;
  context.fillRect(0, 0, width, height);

  drawAxes(context, transform);
  drawVectorField(context, transform, mu, config);
  drawParticles(context, transform, state.particles, config);
  drawOrigin(context, transform, mu, config.highlightColor);
  drawLimitCycle(context, transform, mu, config.highlightColor);
  drawMuLabel(context, width, height, mu);
}

function drawAxes(context: CanvasRenderingContext2D, transform: HopfTransform): void {
  const left = transform.toCanvas({ x: -transform.xDomain, y: 0 });
  const right = transform.toCanvas({ x: transform.xDomain, y: 0 });
  const bottom = transform.toCanvas({ x: 0, y: -transform.yDomain });
  const top = transform.toCanvas({ x: 0, y: transform.yDomain });

  context.save();
  context.strokeStyle = 'rgba(51, 51, 51, 0.16)';
  context.lineWidth = 1;
  context.beginPath();
  context.moveTo(left.x, left.y);
  context.lineTo(right.x, right.y);
  context.moveTo(bottom.x, bottom.y);
  context.lineTo(top.x, top.y);
  context.stroke();
  context.restore();
}

function drawVectorField(context: CanvasRenderingContext2D, transform: HopfTransform, mu: number, config: HopfConfig): void {
  const count = config.gridDensity;
  context.save();
  context.strokeStyle = 'rgba(51, 51, 51, 0.34)';
  context.fillStyle = 'rgba(51, 51, 51, 0.34)';
  context.lineWidth = 1;

  for (let ix = 0; ix < count; ix++) {
    const x = -transform.xDomain + (2 * transform.xDomain * ix) / (count - 1);
    for (let iy = 0; iy < count; iy++) {
      const y = -transform.yDomain + (2 * transform.yDomain * iy) / (count - 1);
      if (Math.hypot(x, y) < 1e-5) continue;
      const vector = hopfDerivative({ x, y }, mu, config.omega);
      const length = Math.hypot(vector.x, vector.y);
      if (length < 1e-8) continue;
      const start = transform.toCanvas({ x, y });
      const unit = { x: vector.x / length, y: vector.y / length };
      drawArrow(context, start, unit);
    }
  }

  context.restore();
}

function drawArrow(context: CanvasRenderingContext2D, start: HopfVector, unit: HopfVector): void {
  const end = { x: start.x + unit.x * ARROW_LENGTH, y: start.y - unit.y * ARROW_LENGTH };
  const angle = Math.atan2(end.y - start.y, end.x - start.x);
  const headLength = 3.5;

  context.beginPath();
  context.moveTo(start.x, start.y);
  context.lineTo(end.x, end.y);
  context.stroke();

  context.beginPath();
  context.moveTo(end.x, end.y);
  context.lineTo(end.x - headLength * Math.cos(angle - Math.PI / 6), end.y - headLength * Math.sin(angle - Math.PI / 6));
  context.lineTo(end.x - headLength * Math.cos(angle + Math.PI / 6), end.y - headLength * Math.sin(angle + Math.PI / 6));
  context.closePath();
  context.fill();
}

function updateParticles(state: HopfState, transform: HopfTransform, elapsedMilliseconds: number, deltaMilliseconds: number): void {
  const config = state.config;
  const deltaSeconds = Math.min(0.1, Math.max(0, deltaMilliseconds / 1000));
  if (deltaSeconds <= 0) return;

  state.spawnCarry += config.particleSpawnRate * deltaSeconds;
  while (state.spawnCarry >= 1 && state.particles.length < config.maxParticles) {
    state.particles.push(randomParticle(transform, config.particleLifetime));
    state.spawnCarry -= 1;
  }
  if (state.particles.length >= config.maxParticles) state.spawnCarry = Math.min(state.spawnCarry, 1);

  const integrated: HopfParticle[] = [];
  for (const particle of state.particles) {
    const next = integrateParticle(particle, elapsedMilliseconds, deltaSeconds, config);
    if (next.age <= next.lifetime && isInsideDomain(next, transform)) integrated.push(next);
  }
  state.particles = integrated;
}

export function integrateParticle(particle: HopfParticle, elapsedMilliseconds: number, deltaSeconds: number, config: HopfConfig): HopfParticle {
  let point: HopfVector = { x: particle.x, y: particle.y };
  let remaining = Math.max(0, deltaSeconds);
  let elapsed = elapsedMilliseconds / 1000;
  const stepSize = Math.max(1e-4, config.particleDt);

  while (remaining > 1e-8) {
    const step = Math.min(stepSize, remaining);
    const midpointElapsedMilliseconds = (elapsed + step / 2) * 1000;
    const mu = muAtElapsed(midpointElapsedMilliseconds, config);
    point = rk4HopfStep(point, mu, config.omega, step);
    elapsed += step;
    remaining -= step;
  }

  return { ...point, age: particle.age + deltaSeconds, lifetime: particle.lifetime };
}

export function rk4HopfStep(point: HopfVector, mu: number, omega: number, dt: number): HopfVector {
  const k1 = hopfDerivative(point, mu, omega);
  const k2 = hopfDerivative(addScaled(point, k1, dt / 2), mu, omega);
  const k3 = hopfDerivative(addScaled(point, k2, dt / 2), mu, omega);
  const k4 = hopfDerivative(addScaled(point, k3, dt), mu, omega);
  return {
    x: point.x + (dt / 6) * (k1.x + 2 * k2.x + 2 * k3.x + k4.x),
    y: point.y + (dt / 6) * (k1.y + 2 * k2.y + 2 * k3.y + k4.y),
  };
}

function randomParticle(transform: HopfTransform, lifetime: number): HopfParticle {
  return {
    x: (Math.random() * 2 - 1) * transform.xDomain * 0.92,
    y: (Math.random() * 2 - 1) * transform.yDomain * 0.92,
    age: 0,
    lifetime,
  };
}

function seedStaticParticles(state: HopfState, transform: HopfTransform): void {
  const count = Math.min(10, state.config.maxParticles);
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2;
    const radius = 0.35 + (i % 4) * 0.28;
    state.particles.push({
      x: Math.cos(angle) * Math.min(radius, transform.xDomain * 0.8),
      y: Math.sin(angle) * Math.min(radius, transform.yDomain * 0.8),
      age: (i / count) * state.config.particleLifetime,
      lifetime: state.config.particleLifetime,
    });
  }
}

function isInsideDomain(point: HopfVector, transform: HopfTransform): boolean {
  return Math.abs(point.x) <= transform.xDomain * 1.08 && Math.abs(point.y) <= transform.yDomain * 1.08;
}

function drawParticles(context: CanvasRenderingContext2D, transform: HopfTransform, particles: HopfParticle[], config: HopfConfig): void {
  context.save();
  for (const particle of particles) {
    const alpha = Math.max(0, Math.min(1, 1 - particle.age / particle.lifetime));
    const point = transform.toCanvas(particle);
    context.beginPath();
    context.fillStyle = colorWithAlpha(config.particleColor, 0.18 + alpha * 0.62);
    context.arc(point.x, point.y, config.particleRadius, 0, Math.PI * 2);
    context.fill();
  }
  context.restore();
}

function drawOrigin(context: CanvasRenderingContext2D, transform: HopfTransform, mu: number, highlightColor: string): void {
  const origin = transform.toCanvas({ x: 0, y: 0 });
  context.save();
  context.lineWidth = 2;
  context.strokeStyle = highlightColor;
  context.fillStyle = mu > 0 ? 'rgba(255, 255, 255, 0.94)' : highlightColor;
  context.beginPath();
  context.arc(origin.x, origin.y, 5, 0, Math.PI * 2);
  context.fill();
  context.stroke();
  context.restore();
}

function drawLimitCycle(context: CanvasRenderingContext2D, transform: HopfTransform, mu: number, highlightColor: string): void {
  const radius = limitCycleRadius(mu);
  if (radius <= 0) return;
  const origin = transform.toCanvas({ x: 0, y: 0 });
  context.save();
  context.strokeStyle = highlightColor;
  context.lineWidth = 2.6;
  context.beginPath();
  context.arc(origin.x, origin.y, radius * transform.scale, 0, Math.PI * 2);
  context.stroke();
  context.restore();
}

function drawMuLabel(context: CanvasRenderingContext2D, width: number, height: number, mu: number): void {
  const label = `μ = ${mu.toFixed(2)}`;
  const x = width - 12;
  const y = height - 10;

  context.save();
  context.font = '13px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';
  context.textAlign = 'right';
  context.textBaseline = 'bottom';

  const metrics = context.measureText(label);
  const paddingX = 5;
  const paddingY = 3;
  const labelWidth = metrics.width;
  const labelHeight = 13;
  context.fillStyle = 'rgba(255, 255, 255, 0.88)';
  context.fillRect(x - labelWidth - paddingX, y - labelHeight - paddingY, labelWidth + paddingX * 2, labelHeight + paddingY * 2);

  context.fillStyle = 'rgba(51, 51, 51, 0.78)';
  context.fillText(label, x, y);
  context.restore();
}

function addScaled(point: HopfVector, derivative: HopfVector, scale: number): HopfVector {
  return {
    x: point.x + derivative.x * scale,
    y: point.y + derivative.y * scale,
  };
}

function colorWithAlpha(color: string, alpha: number): string {
  const clampedAlpha = Math.max(0, Math.min(1, alpha));
  if (/^#[0-9a-f]{6}$/i.test(color)) {
    const red = Number.parseInt(color.slice(1, 3), 16);
    const green = Number.parseInt(color.slice(3, 5), 16);
    const blue = Number.parseInt(color.slice(5, 7), 16);
    return `rgba(${red}, ${green}, ${blue}, ${clampedAlpha})`;
  }
  return color;
}

function finiteOrDefault(value: number, fallback: number): number {
  return Number.isFinite(value) ? value : fallback;
}

function positiveOrDefault(value: number, fallback: number): number {
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

function nonNegativeOrDefault(value: number, fallback: number): number {
  return Number.isFinite(value) && value >= 0 ? value : fallback;
}

function integerAtLeast(value: number, minimum: number, fallback: number): number {
  return Number.isFinite(value) && value >= minimum ? Math.round(value) : fallback;
}
