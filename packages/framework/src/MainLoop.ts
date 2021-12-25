import { Clock } from "three/src/core/Clock";

import { generateUUID } from "../../math/src/generateUUID";

import { DefaultMainLoopTicker } from "./DefaultMainLoopTicker";
import { isNameable } from "./isNameable";
import { name } from "./name";

import type { Logger } from "loglevel";

import type { MainLoop as IMainLoop } from "./MainLoop.interface";
import type { MainLoopTicker } from "./MainLoopTicker.interface";
import type { MainLoopUpdatable } from "./MainLoopUpdatable.interface";
import type { Scheduler } from "./Scheduler.interface";

/**
 * Why tick timer state exists? There are some services that need to sync
 * depending on the time their data was last modified. Since
 * `performance.now()` is not that reliable since Spectre/Meltdown, I decided
 * to use something else and measure time in elapsed main loop ticks.
 * In the worst case it would cause 1 frame delay between syncing data, but
 * in most cases update/sync would be done in the same frame. To achieve that
 * though, services need to be added to the main loop in the adequate order.
 *
 * Is this safe on the basic level though?
 * It can increment until it reaches Number.MAX_SAFE_INTEGER. At the moment
 * of writing this MAX_SAFE_INTEGER is about 9007199254740991 on most
 * devices. It means that it will work for 9007199254740991 frames, then it
 * would crash or behave unpredictably. Achieving 9007199254740991 frames at
 * 100 FPS would take 90071992547409,91 seconds, which is 171369848 years.
 * After that time, you would have to reload the page to continue using the
 * app. I think that this is acceptable.
 *
 * @see HTMLElementResizeObserver
 * @see MouseObserevr
 * @see TouchObserver
 */
export function MainLoop<TickType>(
  logger: Logger,
  frameScheduler: Scheduler<TickType>,
  ticker: MainLoopTicker = DefaultMainLoopTicker()
): IMainLoop<TickType> {
  const clock = new Clock(false);
  const updatables = new Set<MainLoopUpdatable>();

  let _continue: boolean = false;
  let _frameId: null | TickType = null;

  function start(): void {
    if (_continue) {
      throw new Error("Main loop is alread started.");
    }

    clock.start();

    _continue = true;
    _frameId = frameScheduler.requestFrame(tick);
  }

  function stop(): void {
    if (!_continue) {
      throw new Error("Main loop is alread stopped.");
    }

    clock.stop();

    if (null !== _frameId) {
      frameScheduler.cancelFrame(_frameId);
    }

    _continue = false;
    _frameId = null;
  }

  function tick(now: number): void {
    ticker.tick(clock.getDelta(), clock.getElapsedTime());

    while (ticker.state.scheduledUpdates > 0) {
      updatables.forEach(_updateUpdatable);
      ticker.state.scheduledUpdates -= 1;
    }

    // something might have changed withing the update callback
    if (_continue) {
      _frameId = frameScheduler.requestFrame(tick);
    }
  }

  function _updateUpdatable(updatable: MainLoopUpdatable): void {
    if (updatable.state.needsUpdates) {
      updatable.update(ticker.tickTimerState.delta, ticker.tickTimerState.elapsedTime, ticker.tickTimerState);
    } else {
      updatables.delete(updatable);

      if (!isNameable(updatable)) {
        return;
      }

      logger.debug(`REMOVED(MAIN_LOOP(${name(updatable)}))`);
    }
  }

  return Object.freeze({
    id: generateUUID(),
    isMainLoop: true,
    name: "MainLoop",
    scheduler: frameScheduler,
    ticker: ticker,
    updatables: updatables,

    start: start,
    stop: stop,
    tick: tick,
  });
}
