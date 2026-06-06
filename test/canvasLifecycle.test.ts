import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';
import { initializeCanvasVisualization } from '../src/lib/visualizations/lifecycle.ts';

type Listener = (...args: any[]) => void;

const originals = {
  ResizeObserver: globalThis.ResizeObserver,
  IntersectionObserver: globalThis.IntersectionObserver,
};

afterEach(() => {
  globalThis.ResizeObserver = originals.ResizeObserver;
  globalThis.IntersectionObserver = originals.IntersectionObserver;
});

class FakeResizeObserver {
  static instances: FakeResizeObserver[] = [];
  callback: ResizeObserverCallback;
  observed: Element[] = [];
  disconnected = false;

  constructor(callback: ResizeObserverCallback) {
    this.callback = callback;
    FakeResizeObserver.instances.push(this);
  }

  observe(element: Element) {
    this.observed.push(element);
  }

  disconnect() {
    this.disconnected = true;
  }

  trigger() {
    this.callback([], this as unknown as ResizeObserver);
  }
}

class FakeIntersectionObserver {
  static instances: FakeIntersectionObserver[] = [];
  callback: IntersectionObserverCallback;
  observed: Element[] = [];
  disconnected = false;

  constructor(callback: IntersectionObserverCallback) {
    this.callback = callback;
    FakeIntersectionObserver.instances.push(this);
  }

  observe(element: Element) {
    this.observed.push(element);
  }

  disconnect() {
    this.disconnected = true;
  }

  setVisible(isIntersecting: boolean) {
    this.callback([{ isIntersecting } as IntersectionObserverEntry], this as unknown as IntersectionObserver);
  }
}

function createHarness({ dpr = 1, reducedMotion = false } = {}) {
  let rafId = 0;
  const rafCallbacks = new Map<number, FrameRequestCallback>();
  const windowListeners = new Map<string, Set<Listener>>();
  const mediaListeners = new Set<Listener>();

  const media = {
    matches: reducedMotion,
    addEventListener: (_type: string, listener: Listener) => mediaListeners.add(listener),
    removeEventListener: (_type: string, listener: Listener) => mediaListeners.delete(listener),
    setReduced(value: boolean) {
      this.matches = value;
      mediaListeners.forEach((listener) => listener({ matches: value }));
    },
  };

  const win = {
    devicePixelRatio: dpr,
    performance: { now: () => 10 },
    requestAnimationFrame(callback: FrameRequestCallback) {
      const id = ++rafId;
      rafCallbacks.set(id, callback);
      return id;
    },
    cancelAnimationFrame(id: number) {
      rafCallbacks.delete(id);
    },
    addEventListener(type: string, listener: Listener) {
      const listeners = windowListeners.get(type) ?? new Set<Listener>();
      listeners.add(listener);
      windowListeners.set(type, listeners);
    },
    removeEventListener(type: string, listener: Listener) {
      windowListeners.get(type)?.delete(listener);
    },
    matchMedia: () => media,
  } as unknown as Window;

  const root = { ownerDocument: { defaultView: win } } as unknown as Element;
  const clickListeners = new Set<Listener>();
  const transforms: number[][] = [];
  const context = {
    setTransform: (...args: number[]) => transforms.push(args),
  } as unknown as CanvasRenderingContext2D;
  const canvas = {
    ownerDocument: root.ownerDocument,
    width: 0,
    height: 0,
    clientWidth: 320,
    clientHeight: 180,
    getBoundingClientRect: () => ({ width: 320, height: 180 }),
    getContext: (type: string) => (type === '2d' ? context : null),
    addEventListener: (_type: string, listener: Listener) => clickListeners.add(listener),
    removeEventListener: (_type: string, listener: Listener) => clickListeners.delete(listener),
    click() {
      clickListeners.forEach((listener) => listener({ type: 'click' }));
    },
  } as unknown as HTMLCanvasElement;

  return {
    root,
    canvas,
    media,
    rafCallbacks,
    transforms,
    windowListeners,
    runNextFrame(timestamp = 25) {
      const [id, callback] = rafCallbacks.entries().next().value as [number, FrameRequestCallback];
      rafCallbacks.delete(id);
      callback(timestamp);
    },
  };
}

test('sizes canvases for CSS pixels using device pixel ratio capped at two', () => {
  globalThis.ResizeObserver = FakeResizeObserver as unknown as typeof ResizeObserver;
  globalThis.IntersectionObserver = FakeIntersectionObserver as unknown as typeof IntersectionObserver;
  const harness = createHarness({ dpr: 3 });
  const frames: Array<{ width: number; height: number; dpr: number }> = [];

  initializeCanvasVisualization({
    root: harness.root,
    canvas: harness.canvas,
    draw: ({ width, height, dpr }) => frames.push({ width, height, dpr }),
  });

  assert.equal(harness.canvas.width, 640);
  assert.equal(harness.canvas.height, 360);
  assert.deepEqual(harness.transforms.at(-1), [2, 0, 0, 2, 0, 0]);
  assert.deepEqual(frames[0], { width: 320, height: 180, dpr: 2 });
});

test('pauses animation while offscreen and resumes when visible again', () => {
  globalThis.ResizeObserver = FakeResizeObserver as unknown as typeof ResizeObserver;
  globalThis.IntersectionObserver = FakeIntersectionObserver as unknown as typeof IntersectionObserver;
  const harness = createHarness();
  let drawCount = 0;
  const lifecycle = initializeCanvasVisualization({
    root: harness.root,
    canvas: harness.canvas,
    draw: () => drawCount++,
  });

  assert.equal(lifecycle.isRunning(), true);
  FakeIntersectionObserver.instances.at(-1)?.setVisible(false);
  assert.equal(lifecycle.isVisible(), false);
  assert.equal(lifecycle.isRunning(), false);
  assert.equal(harness.rafCallbacks.size, 0);

  FakeIntersectionObserver.instances.at(-1)?.setVisible(true);
  assert.equal(lifecycle.isVisible(), true);
  assert.equal(lifecycle.isRunning(), true);
  harness.runNextFrame(40);
  assert.ok(drawCount >= 2);
});

test('prefers-reduced-motion renders a static frame without a continuous animation loop', () => {
  globalThis.ResizeObserver = FakeResizeObserver as unknown as typeof ResizeObserver;
  globalThis.IntersectionObserver = FakeIntersectionObserver as unknown as typeof IntersectionObserver;
  const harness = createHarness({ reducedMotion: true });
  const reducedFlags: boolean[] = [];

  const lifecycle = initializeCanvasVisualization({
    root: harness.root,
    canvas: harness.canvas,
    draw: ({ reducedMotion }) => reducedFlags.push(reducedMotion),
  });

  assert.equal(lifecycle.isReducedMotion(), true);
  assert.equal(lifecycle.isRunning(), false);
  assert.equal(harness.rafCallbacks.size, 0);
  assert.deepEqual(reducedFlags, [true, true]);

  harness.media.setReduced(false);
  assert.equal(lifecycle.isReducedMotion(), false);
  assert.equal(lifecycle.isRunning(), true);
});

test('initialization is idempotent per root and cleanup removes listeners and observers', () => {
  globalThis.ResizeObserver = FakeResizeObserver as unknown as typeof ResizeObserver;
  globalThis.IntersectionObserver = FakeIntersectionObserver as unknown as typeof IntersectionObserver;
  const harness = createHarness();
  let drawCount = 0;
  let clickCount = 0;

  const first = initializeCanvasVisualization({
    root: harness.root,
    canvas: harness.canvas,
    draw: () => drawCount++,
    onClick: () => clickCount++,
  });
  const second = initializeCanvasVisualization({
    root: harness.root,
    canvas: harness.canvas,
    draw: () => drawCount += 100,
    onClick: () => clickCount += 100,
  });

  assert.equal(first, second);
  harness.canvas.click();
  assert.equal(clickCount, 1);

  first.cleanup();
  assert.equal(first.isRunning(), false);
  assert.equal(FakeResizeObserver.instances.at(-1)?.disconnected, true);
  assert.equal(FakeIntersectionObserver.instances.at(-1)?.disconnected, true);
  harness.canvas.click();
  assert.equal(clickCount, 1);

  const third = initializeCanvasVisualization({
    root: harness.root,
    canvas: harness.canvas,
    draw: () => drawCount++,
  });
  assert.notEqual(third, first);
  third.cleanup();
});
