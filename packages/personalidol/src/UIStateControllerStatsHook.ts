import { generateUUID } from "../../math/src/generateUUID";

import type { MainLoopUpdatableState } from "../../framework/src/MainLoopUpdatableState.type";
import type { StatsHook } from "../../framework/src/StatsHook.interface";
import type { TickTimerState } from "../../framework/src/TickTimerState.type";

import type { UIStateController } from "./UIStateController.interface";
import type { UIStateControllerStatsReport } from "./UIStateControllerStatsReport.type";

const DEBUG_NAME: "ui_cntrlr" = "ui_cntrlr";

export function UIStateControllerStatsHook(uiStateController: UIStateController): StatsHook {
  const state: MainLoopUpdatableState = Object.seal({
    needsUpdates: true,
  });
  const statsReport: UIStateControllerStatsReport = {
    debugName: DEBUG_NAME,
    lastUpdate: 0,
  };

  function reset(): void {}

  function update(delta: number, elapsedTime: number, tickTimerState: TickTimerState): void {
    statsReport.lastUpdate = tickTimerState.currentTick;
  }

  return Object.freeze({
    id: generateUUID(),
    isStatsHook: true,
    name: `UIStateControllerStatsHook("${DEBUG_NAME}")`,
    state: state,
    statsReport: statsReport,
    statsReportIntervalSeconds: 1,

    reset: reset,
    update: update,
  });
}
