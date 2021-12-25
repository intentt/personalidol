import Loglevel from "loglevel";

import { generateUUID } from "../../math/src/generateUUID";

import { Director } from "./Director";

import type { Scene } from "./Scene.interface";
import type { SceneState } from "./SceneState.type";
import type { TickTimerState } from "./TickTimerState.type";

function MockScene(preloadImmediately: boolean): Scene {
  const state: SceneState = Object.seal({
    isDisposed: false,
    isMounted: false,
    isPaused: false,
    isPreloaded: false,
    isPreloading: false,
    needsUpdates: false,
  });

  function dispose() {
    state.isDisposed = true;
  }

  function mount() {
    state.isMounted = true;
  }

  function pause() {
    state.isPaused = true;
  }

  function preload() {
    if (preloadImmediately) {
      state.isPreloading = false;
      state.isPreloaded = true;
    } else {
      state.isPreloading = true;
    }
  }

  function unmount() {
    state.isMounted = false;
  }

  function unpause() {
    state.isPaused = false;
  }

  function update() {}

  return Object.freeze({
    id: generateUUID(),
    isDisposable: true,
    isMountable: true,
    isPreloadable: true,
    isScene: true,
    name: "MockScene",
    state: state,

    dispose: dispose,
    mount: mount,
    pause: pause,
    preload: preload,
    unmount: unmount,
    unpause: unpause,
    update: update,
  });
}

test("transitions one scene immediately", function () {
  const logger = Loglevel.getLogger("test");
  const tickTimerState: TickTimerState = {
    currentTick: 0,
    delta: 0,
    elapsedTime: 0,
  };
  const director = Director(logger, tickTimerState, "test");
  const mockScene = MockScene(true);

  director.start();

  director.state.next = mockScene;

  // Director should not be transitioning yet. It should be updated on each
  // frame.

  expect(director.state.isTransitioning).toBe(false);
  expect(director.state.current).toBe(null);
  expect(director.state.next).toBe(mockScene);

  // Now the next scene should be sucked in immediately since it does not
  // delay the preload.

  director.update(tickTimerState.delta, tickTimerState.elapsedTime, tickTimerState);

  expect(director.state.isTransitioning).toBe(false);
  expect(director.state.current).toBe(mockScene);
  expect(director.state.next).toBe(null);
});

test("transitions one scene with a delay", function () {
  const logger = Loglevel.getLogger("test");
  const tickTimerState: TickTimerState = {
    currentTick: 0,
    delta: 0,
    elapsedTime: 0,
  };
  const director = Director(logger, tickTimerState, "test");
  const mockScene = MockScene(false);

  director.start();

  director.state.next = mockScene;

  // Director should not be transitioning yet. It should be updated on each
  // frame.

  expect(mockScene.state.isPreloaded).toBe(false);
  expect(mockScene.state.isPreloading).toBe(false);
  expect(director.state.isTransitioning).toBe(false);
  expect(director.state.current).toBe(null);
  expect(director.state.next).toBe(mockScene);

  // Now the next scene should be sucked in and director should wait for the
  // scene to transition.

  director.update(tickTimerState.delta, tickTimerState.elapsedTime, tickTimerState);

  expect(mockScene.state.isPreloaded).toBe(false);
  expect(mockScene.state.isPreloading).toBe(true);
  expect(director.state.isTransitioning).toBe(true);
  expect(director.state.current).toBe(null);
  expect(director.state.next).toBe(null);

  // Before the next tick, we move the scene preloading state forward.

  mockScene.state.isPreloading = false;
  mockScene.state.isPreloaded = true;

  // Now the scene should be set to current.

  director.update(tickTimerState.delta, tickTimerState.elapsedTime, tickTimerState);

  expect(mockScene.state.isPreloaded).toBe(true);
  expect(mockScene.state.isPreloading).toBe(false);
  expect(director.state.isTransitioning).toBe(false);
  expect(director.state.current).toBe(mockScene);
  expect(director.state.next).toBe(null);
});

test("replace current scene with a scene that instantly preloads", function () {
  const logger = Loglevel.getLogger("test");
  const tickTimerState: TickTimerState = {
    currentTick: 0,
    delta: 0,
    elapsedTime: 0,
  };
  const director = Director(logger, tickTimerState, "test");
  const mockScene1 = MockScene(true);
  const mockScene2 = MockScene(false);

  director.start();

  director.state.next = mockScene1;

  // It should take one tick to suck in the scene that instantly preloads.

  director.update(tickTimerState.delta, tickTimerState.elapsedTime, tickTimerState);

  expect(director.state.isTransitioning).toBe(false);
  expect(director.state.current).toBe(mockScene1);
  expect(director.state.next).toBe(null);

  // Now we can replace the next scene. If it will be replaced sooner, nothing
  // wrong would have happened, the `mockScene1` would not be preloaded.

  director.state.next = mockScene2;

  director.update(tickTimerState.delta, tickTimerState.elapsedTime, tickTimerState);

  expect(mockScene1.state.isDisposed).toBe(true);
  expect(mockScene2.state.isPreloading).toBe(true);
  expect(mockScene2.state.isPreloaded).toBe(false);
  expect(director.state.isTransitioning).toBe(true);
  expect(director.state.current).toBe(null);
  expect(director.state.next).toBe(null);

  // Before the next tick, we move the scene preloading state forward.

  mockScene2.state.isPreloading = false;
  mockScene2.state.isPreloaded = true;

  director.update(tickTimerState.delta, tickTimerState.elapsedTime, tickTimerState);

  expect(mockScene1.state.isDisposed).toBe(true);
  expect(mockScene2.state.isPreloading).toBe(false);
  expect(mockScene2.state.isPreloaded).toBe(true);
  expect(director.state.isTransitioning).toBe(false);
  expect(director.state.current).toBe(mockScene2);
  expect(director.state.next).toBe(null);
});
