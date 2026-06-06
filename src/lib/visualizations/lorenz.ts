import { initializeCanvasVisualization, type CanvasVisualizationFrame } from './lifecycle.ts';

export interface LorenzParameters {
  sigma: number;
  rho: number;
  beta: number;
}

export interface LorenzPoint {
  x: number;
  y: number;
  z: number;
}

export interface ProjectedPoint {
  x: number;
  y: number;
}

export interface FittedPoint extends ProjectedPoint {}

export interface LorenzConfig extends LorenzParameters {
  ariaLabel: string;
  highlightColor: string;
  trailColor: string;
  trailLength: number;
  trajectoryLength: number;
  burnInSteps: number;
  dt: number;
  speed: number;
}

export const DEFAULT_LORENZ_CONFIG: LorenzConfig = {
  ariaLabel: 'Canvas visualization of the Lorenz attractor. Click to restart from random initial conditions.',
  sigma: 10,
  rho: 28,
  beta: 8 / 3,
  highlightColor: '#7f1d1d',
  trailColor: '#7f1d1d',
  trailLength: 240,
  trajectoryLength: 6000,
  burnInSteps: 1200,
  dt: 0.008,
  speed: 72,
};

const INITIAL_RANGE = 18;
const OUTER_PADDING = 16;

type LorenzState = {
  config: LorenzConfig;
  trajectory: LorenzPoint[];
  projected: ProjectedPoint[];
  fitted: FittedPoint[];
  offset: number;
  lastWidth: number;
  lastHeight: number;
};

export function initializeLorenzAttractors(scope: ParentNode = document): void {
  const roots = scope.querySelectorAll<HTMLElement>('[data-lorenz-attractor]');
  roots.forEach((root) => initializeLorenzAttractor(root));
}

export function initializeLorenzAttractor(root: HTMLElement): void {
  const canvas = root.querySelector<HTMLCanvasElement>('canvas');
  if (!canvas) return;

  const config = readConfig(root);
  const state = createState(config);

  initializeCanvasVisualization({
    root,
    canvas,
    draw: (frame) => drawLorenz(frame, state),
    resize: (frame) => fitState(state, frame.width, frame.height),
    onClick: (_event, frame) => {
      resetState(state);
      fitState(state, frame.width, frame.height);
      drawLorenz(frame, state);
    },
  });
}

export function readConfig(root: HTMLElement): LorenzConfig {
  const scriptConfig = root.querySelector<HTMLScriptElement>('script[data-lorenz-config]')?.textContent;
  const rawConfig = scriptConfig ?? root.dataset.config;
  if (!rawConfig) return { ...DEFAULT_LORENZ_CONFIG };

  try {
    return normalizeConfig(JSON.parse(rawConfig));
  } catch {
    return { ...DEFAULT_LORENZ_CONFIG };
  }
}

export function normalizeConfig(config: Partial<LorenzConfig>): LorenzConfig {
  const merged = { ...DEFAULT_LORENZ_CONFIG, ...config };
  return {
    ...merged,
    sigma: finiteOrDefault(merged.sigma, DEFAULT_LORENZ_CONFIG.sigma),
    rho: finiteOrDefault(merged.rho, DEFAULT_LORENZ_CONFIG.rho),
    beta: finiteOrDefault(merged.beta, DEFAULT_LORENZ_CONFIG.beta),
    trailLength: integerAtLeast(merged.trailLength, 8, DEFAULT_LORENZ_CONFIG.trailLength),
    trajectoryLength: integerAtLeast(merged.trajectoryLength, 32, DEFAULT_LORENZ_CONFIG.trajectoryLength),
    burnInSteps: integerAtLeast(merged.burnInSteps, 0, DEFAULT_LORENZ_CONFIG.burnInSteps),
    dt: positiveOrDefault(merged.dt, DEFAULT_LORENZ_CONFIG.dt),
    speed: positiveOrDefault(merged.speed, DEFAULT_LORENZ_CONFIG.speed),
  };
}

export function randomInitialPoint(random: () => number = Math.random): LorenzPoint {
  return {
    x: (random() * 2 - 1) * INITIAL_RANGE,
    y: (random() * 2 - 1) * INITIAL_RANGE,
    z: 8 + random() * 24,
  };
}

export function generateLorenzTrajectory(
  parameters: LorenzParameters,
  options: { initial?: LorenzPoint; length?: number; burnInSteps?: number; dt?: number; random?: () => number } = {},
): LorenzPoint[] {
  const length = integerAtLeast(options.length ?? DEFAULT_LORENZ_CONFIG.trajectoryLength, 1, DEFAULT_LORENZ_CONFIG.trajectoryLength);
  const burnInSteps = integerAtLeast(options.burnInSteps ?? DEFAULT_LORENZ_CONFIG.burnInSteps, 0, DEFAULT_LORENZ_CONFIG.burnInSteps);
  const dt = positiveOrDefault(options.dt ?? DEFAULT_LORENZ_CONFIG.dt, DEFAULT_LORENZ_CONFIG.dt);
  let point = options.initial ?? randomInitialPoint(options.random);

  for (let i = 0; i < burnInSteps; i++) {
    point = rk4Step(point, parameters, dt);
  }

  const trajectory: LorenzPoint[] = [];
  for (let i = 0; i < length; i++) {
    point = rk4Step(point, parameters, dt);
    trajectory.push(point);
  }

  return trajectory;
}

export function rk4Step(point: LorenzPoint, parameters: LorenzParameters, dt: number): LorenzPoint {
  const k1 = lorenzDerivative(point, parameters);
  const k2 = lorenzDerivative(addScaled(point, k1, dt / 2), parameters);
  const k3 = lorenzDerivative(addScaled(point, k2, dt / 2), parameters);
  const k4 = lorenzDerivative(addScaled(point, k3, dt), parameters);

  return {
    x: point.x + (dt / 6) * (k1.x + 2 * k2.x + 2 * k3.x + k4.x),
    y: point.y + (dt / 6) * (k1.y + 2 * k2.y + 2 * k3.y + k4.y),
    z: point.z + (dt / 6) * (k1.z + 2 * k2.z + 2 * k3.z + k4.z),
  };
}

export function projectLorenzPoint(point: LorenzPoint): ProjectedPoint {
  // Fixed oblique projection. The same coefficient space is later fit with one scalar,
  // preserving equal geometry in screen x/y rather than stretching each axis independently.
  return {
    x: point.x + point.z * 0.42,
    y: point.y - point.z * 0.28,
  };
}

export function fitProjectedPoints(points: ProjectedPoint[], width: number, height: number, padding = OUTER_PADDING): FittedPoint[] {
  if (points.length === 0) return [];

  const bounds = points.reduce(
    (acc, point) => ({
      minX: Math.min(acc.minX, point.x),
      maxX: Math.max(acc.maxX, point.x),
      minY: Math.min(acc.minY, point.y),
      maxY: Math.max(acc.maxY, point.y),
    }),
    { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity },
  );

  const availableWidth = Math.max(1, width - padding * 2);
  const availableHeight = Math.max(1, height - padding * 2);
  const rangeX = Math.max(1e-6, bounds.maxX - bounds.minX);
  const rangeY = Math.max(1e-6, bounds.maxY - bounds.minY);
  const scale = Math.min(availableWidth / rangeX, availableHeight / rangeY);
  const centerX = (bounds.minX + bounds.maxX) / 2;
  const centerY = (bounds.minY + bounds.maxY) / 2;

  return points.map((point) => ({
    x: width / 2 + (point.x - centerX) * scale,
    y: height / 2 - (point.y - centerY) * scale,
  }));
}

function createState(config: LorenzConfig): LorenzState {
  const trajectory = generateLorenzTrajectory(config, config);
  const projected = trajectory.map(projectLorenzPoint);
  return {
    config,
    trajectory,
    projected,
    fitted: [],
    offset: 0,
    lastWidth: 0,
    lastHeight: 0,
  };
}

function resetState(state: LorenzState): void {
  state.trajectory = generateLorenzTrajectory(state.config, state.config);
  state.projected = state.trajectory.map(projectLorenzPoint);
  state.offset = 0;
}

function fitState(state: LorenzState, width: number, height: number): void {
  if (state.lastWidth === width && state.lastHeight === height && state.fitted.length === state.projected.length) return;
  state.fitted = fitProjectedPoints(state.projected, width, height);
  state.lastWidth = width;
  state.lastHeight = height;
}

function drawLorenz(frame: CanvasVisualizationFrame, state: LorenzState): void {
  const { context, width, height, delta, reducedMotion } = frame;
  fitState(state, width, height);
  context.clearRect(0, 0, width, height);
  context.fillStyle = 'rgba(255, 248, 220, 0.45)';
  context.fillRect(0, 0, width, height);

  if (state.fitted.length < 2) return;

  drawPolyline(context, state.fitted, 'rgba(80, 80, 80, 0.18)', 0.75);

  if (!reducedMotion) {
    const advance = Math.max(1, Math.round((delta / 1000) * state.config.speed));
    state.offset = (state.offset + advance) % state.fitted.length;
  }

  const currentIndex = reducedMotion ? Math.floor(state.fitted.length * 0.58) : state.offset;
  drawTrail(context, state.fitted, currentIndex, state.config.trailLength, state.config.trailColor);
  const current = state.fitted[currentIndex];
  drawPoint(context, current, state.config.highlightColor);
}

function drawPolyline(context: CanvasRenderingContext2D, points: FittedPoint[], strokeStyle: string, lineWidth: number): void {
  context.save();
  context.beginPath();
  context.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) context.lineTo(points[i].x, points[i].y);
  context.strokeStyle = strokeStyle;
  context.lineWidth = lineWidth;
  context.lineJoin = 'round';
  context.lineCap = 'round';
  context.stroke();
  context.restore();
}

function drawTrail(context: CanvasRenderingContext2D, points: FittedPoint[], currentIndex: number, trailLength: number, color: string): void {
  const segments = Math.min(trailLength, points.length - 1);
  context.save();
  context.lineCap = 'round';
  context.lineJoin = 'round';

  for (let segment = segments; segment > 0; segment--) {
    const from = points[(currentIndex - segment + points.length) % points.length];
    const to = points[(currentIndex - segment + 1 + points.length) % points.length];
    const alpha = 1 - segment / segments;
    context.beginPath();
    context.moveTo(from.x, from.y);
    context.lineTo(to.x, to.y);
    context.strokeStyle = colorWithAlpha(color, 0.08 + alpha * 0.82);
    context.lineWidth = 0.8 + alpha * 2.4;
    context.stroke();
  }

  context.restore();
}

function drawPoint(context: CanvasRenderingContext2D, point: FittedPoint, color: string): void {
  context.save();
  context.fillStyle = color;
  context.strokeStyle = 'rgba(255, 248, 220, 0.9)';
  context.lineWidth = 1.5;
  context.beginPath();
  context.arc(point.x, point.y, 3.8, 0, Math.PI * 2);
  context.fill();
  context.stroke();
  context.restore();
}

function lorenzDerivative(point: LorenzPoint, parameters: LorenzParameters): LorenzPoint {
  return {
    x: parameters.sigma * (point.y - point.x),
    y: point.x * (parameters.rho - point.z) - point.y,
    z: point.x * point.y - parameters.beta * point.z,
  };
}

function addScaled(point: LorenzPoint, derivative: LorenzPoint, scale: number): LorenzPoint {
  return {
    x: point.x + derivative.x * scale,
    y: point.y + derivative.y * scale,
    z: point.z + derivative.z * scale,
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

function integerAtLeast(value: number, minimum: number, fallback: number): number {
  return Number.isFinite(value) && value >= minimum ? Math.round(value) : fallback;
}
