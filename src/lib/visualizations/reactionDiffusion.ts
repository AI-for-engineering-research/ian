import { initializeCanvasVisualization, type CanvasVisualizationFrame } from './lifecycle.ts';

export interface ReactionDiffusionModel {
  a: number;
  b: number;
  I: number;
  Du: number;
  Dv: number;
}

export interface ColorStop {
  position: number;
  color: string;
}

export interface ReactionDiffusionConfig extends ReactionDiffusionModel {
  ariaLabel: string;
  simWidth: number;
  simHeight: number;
  dt: number;
  stepsPerFrame: number;
  colorStops: ColorStop[];
}

export interface ReactionDiffusionState {
  width: number;
  height: number;
  u: Float32Array;
  v: Float32Array;
  nextU: Float32Array;
  nextV: Float32Array;
  minU: number;
  maxU: number;
}

export interface FitzHughNagumoDerivative {
  du: number;
  dv: number;
}

export const MINI_MAZE_MODEL: ReactionDiffusionModel = {
  a: 0.7,
  b: 0.8,
  I: 0.5,
  Du: 1,
  Dv: 20,
};

export const DEFAULT_BZ_COLOR_STOPS: ColorStop[] = [
  { position: 0, color: '#071126' },
  { position: 0.28, color: '#0ea5c6' },
  { position: 0.52, color: '#fff7d6' },
  { position: 0.74, color: '#e56b1f' },
  { position: 1, color: '#5f0f0f' },
];

export const DEFAULT_REACTION_DIFFUSION_CONFIG: ReactionDiffusionConfig = {
  ariaLabel:
    'Canvas visualization of a FitzHugh-Nagumo reaction-diffusion system. Wrapped diffusion boundaries evolve a colorful Belousov-Zhabotinsky-style maze pattern; click to randomize the chemical field.',
  ...MINI_MAZE_MODEL,
  simWidth: 160,
  simHeight: 120,
  dt: 0.002,
  stepsPerFrame: 2,
  colorStops: DEFAULT_BZ_COLOR_STOPS,
};

const MIN_NORMALIZATION_RANGE = 1e-6;
const stateByRoot = new WeakMap<Element, ReactionDiffusionState>();
const renderCanvases = new WeakMap<Element, HTMLCanvasElement | OffscreenCanvas>();

export function initializeReactionDiffusions(scope: ParentNode = document): void {
  const roots = scope.querySelectorAll<HTMLElement>('[data-reaction-diffusion]');
  roots.forEach((root) => initializeReactionDiffusion(root));
}

export function initializeReactionDiffusion(root: HTMLElement): void {
  const canvas = root.querySelector<HTMLCanvasElement>('canvas');
  if (!canvas) return;

  const config = readConfig(root);
  const state = getOrCreateState(root, config);

  initializeCanvasVisualization({
    root,
    canvas,
    draw: (frame) => drawReactionDiffusion(frame, config, state),
    onClick: (_, frame) => {
      randomizeState(state);
      drawReactionDiffusion(frame, config, state, { skipSimulation: true });
    },
  });
}

export function readConfig(root: HTMLElement): ReactionDiffusionConfig {
  const scriptConfig = root.querySelector<HTMLScriptElement>('script[data-reaction-diffusion-config]')?.textContent;
  const rawConfig = scriptConfig ?? root.dataset.config;
  if (!rawConfig) return { ...DEFAULT_REACTION_DIFFUSION_CONFIG, colorStops: [...DEFAULT_BZ_COLOR_STOPS] };

  try {
    return normalizeConfig(JSON.parse(rawConfig));
  } catch {
    return { ...DEFAULT_REACTION_DIFFUSION_CONFIG, colorStops: [...DEFAULT_BZ_COLOR_STOPS] };
  }
}

export function normalizeConfig(config: Partial<ReactionDiffusionConfig> & { model?: Partial<ReactionDiffusionModel>; timestep?: number }): ReactionDiffusionConfig {
  const model = { ...MINI_MAZE_MODEL, ...config.model, ...pickModel(config) };
  const colorStops = normalizeColorStops(config.colorStops);

  return {
    ariaLabel: typeof config.ariaLabel === 'string' && config.ariaLabel.trim() ? config.ariaLabel : DEFAULT_REACTION_DIFFUSION_CONFIG.ariaLabel,
    a: finiteOrDefault(model.a, MINI_MAZE_MODEL.a),
    b: finiteOrDefault(model.b, MINI_MAZE_MODEL.b),
    I: finiteOrDefault(model.I, MINI_MAZE_MODEL.I),
    Du: finiteOrDefault(model.Du, MINI_MAZE_MODEL.Du),
    Dv: finiteOrDefault(model.Dv, MINI_MAZE_MODEL.Dv),
    simWidth: integerAtLeast(config.simWidth, 2, DEFAULT_REACTION_DIFFUSION_CONFIG.simWidth),
    simHeight: integerAtLeast(config.simHeight, 2, DEFAULT_REACTION_DIFFUSION_CONFIG.simHeight),
    dt: positiveOrDefault(config.timestep ?? config.dt, DEFAULT_REACTION_DIFFUSION_CONFIG.dt),
    stepsPerFrame: integerAtLeast(config.stepsPerFrame, 1, DEFAULT_REACTION_DIFFUSION_CONFIG.stepsPerFrame),
    colorStops,
  };
}

export function createReactionDiffusionState(width: number, height: number, random = Math.random): ReactionDiffusionState {
  const state: ReactionDiffusionState = {
    width,
    height,
    u: new Float32Array(width * height),
    v: new Float32Array(width * height),
    nextU: new Float32Array(width * height),
    nextV: new Float32Array(width * height),
    minU: 0,
    maxU: 1,
  };
  randomizeState(state, random);
  return state;
}

export function randomizeState(state: ReactionDiffusionState, random = Math.random): void {
  for (let i = 0; i < state.u.length; i++) {
    state.u[i] = random();
    state.v[i] = random();
  }
  resetNormalization(state);
}

export function resetNormalization(state: ReactionDiffusionState): void {
  state.minU = Number.POSITIVE_INFINITY;
  state.maxU = Number.NEGATIVE_INFINITY;
}

export function wrappedFourNeighborLaplacian(field: Float32Array | number[], width: number, height: number, x: number, y: number): number {
  const left = x === 0 ? width - 1 : x - 1;
  const right = x === width - 1 ? 0 : x + 1;
  const up = y === 0 ? height - 1 : y - 1;
  const down = y === height - 1 ? 0 : y + 1;
  const centerIndex = y * width + x;

  return field[y * width + left] + field[y * width + right] + field[up * width + x] + field[down * width + x] - 4 * field[centerIndex];
}

export function fitzhughNagumoDerivative(
  u: number,
  v: number,
  laplacianU: number,
  laplacianV: number,
  model: ReactionDiffusionModel,
): FitzHughNagumoDerivative {
  return {
    du: model.Du * laplacianU + u - (u * u * u) / 3 - v + model.I,
    dv: model.Dv * laplacianV + u + model.a - model.b * v,
  };
}

export function eulerStep(state: ReactionDiffusionState, model: ReactionDiffusionModel, dt: number): void {
  let minU = Number.POSITIVE_INFINITY;
  let maxU = Number.NEGATIVE_INFINITY;

  for (let y = 0; y < state.height; y++) {
    for (let x = 0; x < state.width; x++) {
      const index = y * state.width + x;
      const u = state.u[index];
      const v = state.v[index];
      const derivative = fitzhughNagumoDerivative(
        u,
        v,
        wrappedFourNeighborLaplacian(state.u, state.width, state.height, x, y),
        wrappedFourNeighborLaplacian(state.v, state.width, state.height, x, y),
        model,
      );
      const nextU = u + dt * derivative.du;
      const nextV = v + dt * derivative.dv;
      state.nextU[index] = nextU;
      state.nextV[index] = nextV;
      const storedU = state.nextU[index];
      if (storedU < minU) minU = storedU;
      if (storedU > maxU) maxU = storedU;
    }
  }

  [state.u, state.nextU] = [state.nextU, state.u];
  [state.v, state.nextV] = [state.nextV, state.v];
  state.minU = Math.min(state.minU, minU);
  state.maxU = Math.max(state.maxU, maxU);
}

export function colorForValue(value: number, stops: ColorStop[] = DEFAULT_BZ_COLOR_STOPS): [number, number, number] {
  const normalized = clamp01(value);
  const ordered = normalizeColorStops(stops);
  let previous = ordered[0];

  for (let i = 1; i < ordered.length; i++) {
    const next = ordered[i];
    if (normalized <= next.position) {
      const span = Math.max(MIN_NORMALIZATION_RANGE, next.position - previous.position);
      const t = (normalized - previous.position) / span;
      const a = parseHexColor(previous.color);
      const b = parseHexColor(next.color);
      return [
        Math.round(lerp(a[0], b[0], t)),
        Math.round(lerp(a[1], b[1], t)),
        Math.round(lerp(a[2], b[2], t)),
      ];
    }
    previous = next;
  }

  return parseHexColor(ordered[ordered.length - 1].color);
}

export function writeStateToImageData(state: ReactionDiffusionState, imageData: ImageData, colorStops = DEFAULT_BZ_COLOR_STOPS): void {
  ensureNormalization(state);
  const range = Math.max(MIN_NORMALIZATION_RANGE, state.maxU - state.minU);
  const data = imageData.data;

  for (let i = 0; i < state.u.length; i++) {
    const normalized = (state.u[i] - state.minU) / range;
    const [r, g, b] = colorForValue(normalized, colorStops);
    const offset = i * 4;
    data[offset] = r;
    data[offset + 1] = g;
    data[offset + 2] = b;
    data[offset + 3] = 255;
  }
}

function drawReactionDiffusion(
  frame: CanvasVisualizationFrame,
  config: ReactionDiffusionConfig,
  state: ReactionDiffusionState,
  options: { skipSimulation?: boolean } = {},
): void {
  if (!options.skipSimulation) {
    const steps = frame.reducedMotion ? 1 : config.stepsPerFrame;
    for (let i = 0; i < steps; i++) eulerStep(state, config, config.dt);
  }

  const renderCanvas = getRenderCanvas(frame.root, state.width, state.height);
  const renderContext = renderCanvas.getContext('2d');
  if (!renderContext) return;

  const imageData = renderContext.createImageData(state.width, state.height);
  writeStateToImageData(state, imageData, config.colorStops);
  renderContext.putImageData(imageData, 0, 0);

  frame.context.clearRect(0, 0, frame.width, frame.height);
  frame.context.imageSmoothingEnabled = true;
  frame.context.drawImage(renderCanvas as CanvasImageSource, 0, 0, frame.width, frame.height);
}

function ensureNormalization(state: ReactionDiffusionState): void {
  if (Number.isFinite(state.minU) && Number.isFinite(state.maxU)) return;

  let minU = Number.POSITIVE_INFINITY;
  let maxU = Number.NEGATIVE_INFINITY;
  for (const value of state.u) {
    if (value < minU) minU = value;
    if (value > maxU) maxU = value;
  }
  state.minU = minU;
  state.maxU = maxU;
}

function getOrCreateState(root: Element, config: ReactionDiffusionConfig): ReactionDiffusionState {
  const existing = stateByRoot.get(root);
  if (existing && existing.width === config.simWidth && existing.height === config.simHeight) return existing;
  const state = createReactionDiffusionState(config.simWidth, config.simHeight);
  stateByRoot.set(root, state);
  return state;
}

function getRenderCanvas(root: Element, width: number, height: number): HTMLCanvasElement | OffscreenCanvas {
  const existing = renderCanvases.get(root);
  if (existing && existing.width === width && existing.height === height) return existing;

  const win = root.ownerDocument?.defaultView;
  const offscreenCtor = win?.OffscreenCanvas ?? globalThis.OffscreenCanvas;
  const canvas = offscreenCtor
    ? new offscreenCtor(width, height)
    : root.ownerDocument.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  renderCanvases.set(root, canvas);
  return canvas;
}

function pickModel(config: Partial<ReactionDiffusionModel>): Partial<ReactionDiffusionModel> {
  const model: Partial<ReactionDiffusionModel> = {};
  if (config.a !== undefined) model.a = config.a;
  if (config.b !== undefined) model.b = config.b;
  if (config.I !== undefined) model.I = config.I;
  if (config.Du !== undefined) model.Du = config.Du;
  if (config.Dv !== undefined) model.Dv = config.Dv;
  return model;
}

function normalizeColorStops(stops: ColorStop[] | undefined): ColorStop[] {
  const usable = (stops && stops.length >= 2 ? stops : DEFAULT_BZ_COLOR_STOPS)
    .filter((stop) => Number.isFinite(stop.position) && /^#[0-9a-f]{6}$/i.test(stop.color))
    .map((stop) => ({ position: clamp01(stop.position), color: stop.color }));

  if (usable.length < 2) return [...DEFAULT_BZ_COLOR_STOPS];
  return usable.sort((a, b) => a.position - b.position);
}

function parseHexColor(color: string): [number, number, number] {
  return [Number.parseInt(color.slice(1, 3), 16), Number.parseInt(color.slice(3, 5), 16), Number.parseInt(color.slice(5, 7), 16)];
}

function finiteOrDefault(value: number | undefined, fallback: number): number {
  return value !== undefined && Number.isFinite(value) ? value : fallback;
}

function positiveOrDefault(value: number | undefined, fallback: number): number {
  return value !== undefined && Number.isFinite(value) && value > 0 ? value : fallback;
}

function integerAtLeast(value: number | undefined, minimum: number, fallback: number): number {
  return value !== undefined && Number.isFinite(value) && value >= minimum ? Math.round(value) : fallback;
}

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}
