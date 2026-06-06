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
}

export interface HopfVector {
  x: number;
  y: number;
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
    'Canvas visualization of a supercritical Hopf bifurcation. The parameter mu sweeps across zero, changing a stable origin into an unstable origin surrounded by a stable limit cycle.',
  muMin: -1,
  muMax: 1,
  cycleSeconds: 8,
  domain: 2,
  gridDensity: 13,
  omega: 1.15,
  highlightColor: '#7f1d1d',
  backgroundColor: '#ffffff',
};

const PADDING = 18;
const ARROW_LENGTH = 11;

export function initializeHopfBifurcations(scope: ParentNode = document): void {
  const roots = scope.querySelectorAll<HTMLElement>('[data-hopf-bifurcation]');
  roots.forEach((root) => initializeHopfBifurcation(root));
}

export function initializeHopfBifurcation(root: HTMLElement): void {
  const canvas = root.querySelector<HTMLCanvasElement>('canvas');
  if (!canvas) return;

  const config = readConfig(root);
  initializeCanvasVisualization({
    root,
    canvas,
    draw: (frame) => drawHopf(frame, config),
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

function drawHopf(frame: CanvasVisualizationFrame, config: HopfConfig): void {
  const { context, width, height, elapsed, reducedMotion } = frame;
  const transform = createIsotropicTransform(width, height, config.domain);
  const mu = reducedMotion ? 0.62 * config.muMax + 0.38 * config.muMin : muAtElapsed(elapsed, config);

  context.clearRect(0, 0, width, height);
  context.fillStyle = config.backgroundColor;
  context.fillRect(0, 0, width, height);

  drawAxes(context, transform);
  drawVectorField(context, transform, mu, config);
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

function drawOrigin(context: CanvasRenderingContext2D, transform: HopfTransform, mu: number, highlightColor: string): void {
  const origin = transform.toCanvas({ x: 0, y: 0 });
  context.save();
  context.lineWidth = 2;
  context.strokeStyle = mu > 0 ? highlightColor : 'rgba(51, 51, 51, 0.86)';
  context.fillStyle = mu > 0 ? 'rgba(255, 255, 255, 0.9)' : 'rgba(51, 51, 51, 0.86)';
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
  context.save();
  context.fillStyle = 'rgba(51, 51, 51, 0.72)';
  context.font = '13px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';
  context.textAlign = 'right';
  context.textBaseline = 'bottom';
  context.fillText(`μ = ${mu.toFixed(2)}`, width - 12, height - 10);
  context.restore();
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
