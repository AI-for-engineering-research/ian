export interface CanvasVisualizationFrame {
  root: Element;
  canvas: HTMLCanvasElement;
  context: CanvasRenderingContext2D;
  width: number;
  height: number;
  dpr: number;
  elapsed: number;
  delta: number;
  timestamp: number;
  visible: boolean;
  reducedMotion: boolean;
}

export interface CanvasVisualizationOptions {
  root: Element;
  canvas: HTMLCanvasElement;
  draw: (frame: CanvasVisualizationFrame) => void;
  resize?: (frame: CanvasVisualizationFrame) => void;
  onClick?: (event: MouseEvent, frame: CanvasVisualizationFrame) => void;
  animate?: boolean;
}

export interface CanvasVisualizationLifecycle {
  readonly root: Element;
  readonly canvas: HTMLCanvasElement;
  readonly context: CanvasRenderingContext2D;
  render: (timestamp?: number) => void;
  resize: () => CanvasVisualizationFrame;
  cleanup: () => void;
  isRunning: () => boolean;
  isReducedMotion: () => boolean;
  isVisible: () => boolean;
}

const lifecycles = new WeakMap<Element, CanvasVisualizationLifecycle>();
const MAX_DPR = 2;

export function initializeCanvasVisualization(options: CanvasVisualizationOptions): CanvasVisualizationLifecycle {
  const existing = lifecycles.get(options.root);
  if (existing) return existing;

  const context = options.canvas.getContext('2d');
  if (!context) {
    throw new Error('Canvas visualization lifecycle requires a 2D rendering context.');
  }

  const win = getWindow(options.root);
  const animate = options.animate !== false;
  let cleanedUp = false;
  let visible = true;
  let reducedMotion = getReducedMotion(win);
  let animationFrameId: number | undefined;
  let firstTimestamp: number | undefined;
  let lastTimestamp: number | undefined;
  let lastFrame: CanvasVisualizationFrame;

  const buildFrame = (timestamp = 0): CanvasVisualizationFrame => {
    const { width, height, dpr } = sizeCanvas(options.canvas, context, win);
    const elapsed = firstTimestamp === undefined ? 0 : timestamp - firstTimestamp;
    const delta = lastTimestamp === undefined ? 0 : timestamp - lastTimestamp;

    lastFrame = {
      root: options.root,
      canvas: options.canvas,
      context,
      width,
      height,
      dpr,
      elapsed,
      delta,
      timestamp,
      visible,
      reducedMotion,
    };

    return lastFrame;
  };

  const render = (timestamp = getNow(win)): void => {
    const frame = buildFrame(timestamp);
    options.draw(frame);
  };

  const resize = (): CanvasVisualizationFrame => {
    const frame = buildFrame(getNow(win));
    options.resize?.(frame);
    options.draw(frame);
    return frame;
  };

  const stop = (): void => {
    if (animationFrameId !== undefined) {
      win.cancelAnimationFrame(animationFrameId);
      animationFrameId = undefined;
    }
  };

  const tick = (timestamp: number): void => {
    if (cleanedUp || !visible || reducedMotion || !animate) {
      animationFrameId = undefined;
      return;
    }

    if (firstTimestamp === undefined) firstTimestamp = timestamp;
    render(timestamp);
    lastTimestamp = timestamp;
    animationFrameId = win.requestAnimationFrame(tick);
  };

  const start = (): void => {
    if (cleanedUp || animationFrameId !== undefined || !visible) return;

    if (reducedMotion || !animate) {
      render();
      return;
    }

    animationFrameId = win.requestAnimationFrame(tick);
  };

  const restart = (): void => {
    stop();
    start();
  };

  const resizeObserver = createResizeObserver(win, () => resize());
  if (resizeObserver) {
    resizeObserver.observe(options.root);
  } else {
    win.addEventListener('resize', resize);
  }

  const intersectionObserver = createIntersectionObserver(win, (entries) => {
    const entry = entries[0];
    visible = entry ? entry.isIntersecting : true;
    if (visible) {
      restart();
    } else {
      stop();
    }
  });
  intersectionObserver?.observe(options.root);

  const motionMedia = win.matchMedia?.('(prefers-reduced-motion: reduce)');
  const handleMotionChange = (event: MediaQueryListEvent | MediaQueryList): void => {
    reducedMotion = event.matches;
    restart();
  };
  addMediaListener(motionMedia, handleMotionChange);

  const handleClick = (event: MouseEvent): void => {
    options.onClick?.(event, lastFrame ?? buildFrame(getNow(win)));
  };
  if (options.onClick) {
    options.canvas.addEventListener('click', handleClick);
  }

  const lifecycle: CanvasVisualizationLifecycle = {
    root: options.root,
    canvas: options.canvas,
    context,
    render,
    resize,
    cleanup: () => {
      if (cleanedUp) return;
      cleanedUp = true;
      stop();
      resizeObserver?.disconnect();
      if (!resizeObserver) win.removeEventListener('resize', resize);
      intersectionObserver?.disconnect();
      removeMediaListener(motionMedia, handleMotionChange);
      if (options.onClick) options.canvas.removeEventListener('click', handleClick);
      lifecycles.delete(options.root);
    },
    isRunning: () => animationFrameId !== undefined,
    isReducedMotion: () => reducedMotion,
    isVisible: () => visible,
  };

  lifecycles.set(options.root, lifecycle);
  resize();
  start();

  return lifecycle;
}

export function getCanvasVisualizationLifecycle(root: Element): CanvasVisualizationLifecycle | undefined {
  return lifecycles.get(root);
}

function sizeCanvas(canvas: HTMLCanvasElement, context: CanvasRenderingContext2D, win: Window): Pick<CanvasVisualizationFrame, 'width' | 'height' | 'dpr'> {
  const rect = canvas.getBoundingClientRect();
  const width = Math.max(0, Math.round(rect.width || canvas.clientWidth || canvas.width));
  const height = Math.max(0, Math.round(rect.height || canvas.clientHeight || canvas.height));
  const dpr = Math.min(Math.max(win.devicePixelRatio || 1, 1), MAX_DPR);
  const pixelWidth = Math.max(1, Math.round(width * dpr));
  const pixelHeight = Math.max(1, Math.round(height * dpr));

  if (canvas.width !== pixelWidth) canvas.width = pixelWidth;
  if (canvas.height !== pixelHeight) canvas.height = pixelHeight;
  context.setTransform(dpr, 0, 0, dpr, 0, 0);

  return { width, height, dpr };
}

function getWindow(root: Element): Window {
  return (root.ownerDocument?.defaultView ?? globalThis) as unknown as Window;
}

function getNow(win: Window): number {
  return win.performance?.now?.() ?? Date.now();
}

function getReducedMotion(win: Window): boolean {
  return win.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
}

function createResizeObserver(win: Window, callback: ResizeObserverCallback): ResizeObserver | undefined {
  const observerWindow = win as Window & { ResizeObserver?: typeof ResizeObserver };
  const ResizeObserverCtor = observerWindow.ResizeObserver ?? globalThis.ResizeObserver;
  return ResizeObserverCtor ? new ResizeObserverCtor(callback) : undefined;
}

function createIntersectionObserver(win: Window, callback: IntersectionObserverCallback): IntersectionObserver | undefined {
  const observerWindow = win as Window & { IntersectionObserver?: typeof IntersectionObserver };
  const IntersectionObserverCtor = observerWindow.IntersectionObserver ?? globalThis.IntersectionObserver;
  return IntersectionObserverCtor ? new IntersectionObserverCtor(callback) : undefined;
}

function addMediaListener(media: MediaQueryList | undefined, listener: (event: MediaQueryListEvent | MediaQueryList) => void): void {
  if (!media) return;
  const legacyMedia = media as MediaQueryList & { addListener?: (listener: (event: MediaQueryListEvent | MediaQueryList) => void) => void };
  if (typeof media.addEventListener === 'function') {
    media.addEventListener('change', listener as EventListener);
  } else {
    legacyMedia.addListener?.(listener);
  }
}

function removeMediaListener(media: MediaQueryList | undefined, listener: (event: MediaQueryListEvent | MediaQueryList) => void): void {
  if (!media) return;
  const legacyMedia = media as MediaQueryList & { removeListener?: (listener: (event: MediaQueryListEvent | MediaQueryList) => void) => void };
  if (typeof media.removeEventListener === 'function') {
    media.removeEventListener('change', listener as EventListener);
  } else {
    legacyMedia.removeListener?.(listener);
  }
}
