import CancelToken from "src/framework/classes/CancelToken";
import CanvasView from "src/framework/classes/CanvasView";
import CanvasViewBag from "src/framework/classes/CanvasViewBag";
import CanvasViewBus from "src/framework/classes/CanvasViewBus";
import LoggerBreadcrumbs from "src/framework/classes/LoggerBreadcrumbs";
import Scheduler from "src/framework/classes/Scheduler";
import { default as CanvasViewException } from "src/framework/classes/Exception/CanvasView";

import { CancelToken as CancelTokenInterface } from "src/framework/interfaces/CancelToken";
import { CanvasViewBag as CanvasViewBagInterface } from "src/framework/interfaces/CanvasViewBag";

class FooCanvasView extends CanvasView {
  readonly useCallbacks: boolean;

  constructor(canvasViewBag: CanvasViewBagInterface, useCallbacks: boolean) {
    super(canvasViewBag);

    this.useCallbacks = useCallbacks;
  }

  async attach(cancelToken: CancelTokenInterface) {
    await super.attach(cancelToken);
  }

  async dispose(cancelToken: CancelTokenInterface) {
    await super.dispose(cancelToken);
  }

  useBegin() {
    return this.useCallbacks;
  }

  useDraw() {
    return this.useCallbacks;
  }

  useEnd() {
    return this.useCallbacks;
  }

  useUpdate() {
    return this.useCallbacks;
  }
}

class ImproperAttachFooCanvasView extends CanvasView {
  async attach(cancelToken: CancelTokenInterface) {}

  async dispose(cancelToken: CancelTokenInterface) {
    await super.dispose(cancelToken);
  }
}

class ImproperDisposeFooCanvasView extends CanvasView {
  async attach(cancelToken: CancelTokenInterface) {
    await super.attach(cancelToken);
  }

  async dispose(cancelToken: CancelTokenInterface) {}
}

test("cannot attach the same view more than once", async function() {
  const loggerBreadcrumbs = new LoggerBreadcrumbs();
  const cancelToken = new CancelToken(loggerBreadcrumbs);
  const scheduler = new Scheduler(loggerBreadcrumbs);
  const canvasViewBus = new CanvasViewBus(loggerBreadcrumbs, scheduler);
  const canvasViewBag = new CanvasViewBag(canvasViewBus, loggerBreadcrumbs);

  const canvasView = new FooCanvasView(canvasViewBag, true);

  await canvasViewBus.add(cancelToken, canvasView);

  return expect(canvasViewBus.add(cancelToken, canvasView)).rejects.toThrow(CanvasViewException);
});

test("cannot detach the same view more than once", async function() {
  const loggerBreadcrumbs = new LoggerBreadcrumbs();
  const cancelToken = new CancelToken(loggerBreadcrumbs);
  const scheduler = new Scheduler(loggerBreadcrumbs);
  const canvasViewBus = new CanvasViewBus(loggerBreadcrumbs, scheduler);
  const canvasViewBag = new CanvasViewBag(canvasViewBus, loggerBreadcrumbs);

  const canvasView = new FooCanvasView(canvasViewBag, true);

  await canvasViewBus.add(cancelToken, canvasView);
  await canvasViewBus.delete(cancelToken, canvasView);

  return expect(canvasViewBus.delete(cancelToken, canvasView)).rejects.toThrow(CanvasViewException);
});

test("fails when view attach is improperly implemented", async function() {
  const loggerBreadcrumbs = new LoggerBreadcrumbs();
  const cancelToken = new CancelToken(loggerBreadcrumbs);
  const scheduler = new Scheduler(loggerBreadcrumbs);
  const canvasViewBus = new CanvasViewBus(loggerBreadcrumbs, scheduler);
  const canvasViewBag = new CanvasViewBag(canvasViewBus, loggerBreadcrumbs);

  const canvasView = new ImproperAttachFooCanvasView(canvasViewBag);

  return expect(canvasViewBus.add(cancelToken, canvasView)).rejects.toThrow(CanvasViewException);
});

test("fails when view dispose is improperly implemented", async function() {
  const loggerBreadcrumbs = new LoggerBreadcrumbs();
  const cancelToken = new CancelToken(loggerBreadcrumbs);
  const scheduler = new Scheduler(loggerBreadcrumbs);
  const canvasViewBus = new CanvasViewBus(loggerBreadcrumbs, scheduler);
  const canvasViewBag = new CanvasViewBag(canvasViewBus, loggerBreadcrumbs);

  const canvasView = new ImproperDisposeFooCanvasView(canvasViewBag);

  await canvasViewBus.add(cancelToken, canvasView);

  return expect(canvasViewBus.delete(cancelToken, canvasView)).rejects.toThrow(CanvasViewException);
});

test("properly attaches and detaches canvas views", async function() {
  const loggerBreadcrumbs = new LoggerBreadcrumbs();
  const cancelToken = new CancelToken(loggerBreadcrumbs);
  const scheduler = new Scheduler(loggerBreadcrumbs);
  const canvasViewBus = new CanvasViewBus(loggerBreadcrumbs, scheduler);
  const canvasViewBag = new CanvasViewBag(canvasViewBus, loggerBreadcrumbs);

  // use callbacks
  const canvasViewCallbacks = new FooCanvasView(canvasViewBag, true);

  expect(canvasViewCallbacks.isAttached()).toBe(false);
  expect(canvasViewCallbacks.isDisposed()).toBe(false);

  await canvasViewBus.add(cancelToken, canvasViewCallbacks);

  expect(canvasViewCallbacks.isAttached()).toBe(true);
  expect(canvasViewCallbacks.isDisposed()).toBe(false);

  await canvasViewBus.delete(cancelToken, canvasViewCallbacks);

  expect(canvasViewCallbacks.isAttached()).toBe(false);
  expect(canvasViewCallbacks.isDisposed()).toBe(true);
});

test("properly attaches and detaches canvas views without callbacks", async function() {
  const loggerBreadcrumbs = new LoggerBreadcrumbs();
  const cancelToken = new CancelToken(loggerBreadcrumbs);
  const scheduler = new Scheduler(loggerBreadcrumbs);
  const canvasViewBus = new CanvasViewBus(loggerBreadcrumbs, scheduler);
  const canvasViewBag = new CanvasViewBag(canvasViewBus, loggerBreadcrumbs);

  // do not use callbacks
  const canvasViewNoCallbacks = new FooCanvasView(canvasViewBag, false);

  expect(canvasViewNoCallbacks.isAttached()).toBe(false);
  expect(canvasViewNoCallbacks.isDisposed()).toBe(false);

  await canvasViewBus.add(cancelToken, canvasViewNoCallbacks);

  expect(canvasViewNoCallbacks.isAttached()).toBe(true);
  expect(canvasViewNoCallbacks.isDisposed()).toBe(false);

  await canvasViewBus.delete(cancelToken, canvasViewNoCallbacks);

  expect(canvasViewNoCallbacks.isAttached()).toBe(false);
  expect(canvasViewNoCallbacks.isDisposed()).toBe(true);
});
