import { generateUUID } from "../../math/src/generateUUID";
import { name } from "./name";

import type { MainLoop } from "./MainLoop.interface";
import type { MainLoopStatsHook as IMainLoopStatsHook } from "./MainLoopStatsHook.interface";
import type { MainLoopStatsReport } from "./MainLoopStatsReport.type";
import type { MainLoopUpdatableState } from "./MainLoopUpdatableState.type";

const DEBUG_NAME: "main_loop" = "main_loop";

export function MainLoopStatsHook(mainLoop: MainLoop<any>): IMainLoopStatsHook {
  const state: MainLoopUpdatableState = Object.seal({
    needsUpdates: true,
  });
  const statsReport: MainLoopStatsReport = {
    currentInterval: 0,
    currentIntervalDuration: 0,
    currentIntervalTicks: 0,
    debugName: DEBUG_NAME,
    lastUpdate: 0,
    schedulerName: name(mainLoop.scheduler),
    tickerName: name(mainLoop.ticker),
  };

  let _previousUpdateTime: number = 0;

  function reset(): void {
    statsReport.currentInterval += 1;
    statsReport.currentIntervalDuration = 0;
    statsReport.currentIntervalTicks = 0;
  }

  /**
   * MainLoop delta may be something different than the real elapsed time.
   *
   * @see packages/dynamics/src/DynamicsMainLoopTicker.ts
   */
  function update(): void {
    statsReport.currentIntervalDuration += mainLoop.ticker.tickTimerState.elapsedTime - _previousUpdateTime;
    statsReport.currentIntervalTicks += 1;
    statsReport.lastUpdate = mainLoop.ticker.tickTimerState.currentTick;

    _previousUpdateTime = mainLoop.ticker.tickTimerState.elapsedTime;
  }

  return Object.freeze({
    id: generateUUID(),
    isMainLoopStatsHook: true,
    isStatsHook: true,
    name: `MainLoopStatsHook("${DEBUG_NAME}")`,
    state: state,
    statsReport: statsReport,
    statsReportIntervalSeconds: 1,

    reset: reset,
    update: update,
  });
}
