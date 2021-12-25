import { generateUUID } from "../../math/src/generateUUID";

import type { MainLoopUpdatableState } from "../../framework/src/MainLoopUpdatableState.type";
import type { SimulantsLookup } from "./SimulantsLookup.type";
import type { StatsHook } from "../../framework/src/StatsHook.interface";
import type { StatsReport } from "../../framework/src/StatsReport.type";
import type { TickTimerState } from "../../framework/src/TickTimerState.type";

import type { DynamicsWorld } from "./DynamicsWorld.interface";

const DEBUG_NAME: "dynamics_world" = "dynamics_world";

export function DynamicsWorldStatsHook<S extends SimulantsLookup>(dynamicsWorld: DynamicsWorld<S>): StatsHook {
  const state: MainLoopUpdatableState = Object.seal({
    needsUpdates: true,
  });
  const statsReport: StatsReport = {
    debugName: DEBUG_NAME,
    lastUpdate: 0,
  };

  function reset(): void {}

  function update(delta: number, elapsedTime: number, tickTimerState: TickTimerState): void {
    Object.assign(statsReport, dynamicsWorld.info);
    statsReport.debugName = DEBUG_NAME;
    statsReport.lastUpdate = tickTimerState.currentTick;
  }

  return Object.freeze({
    id: generateUUID(),
    isMainLoopStatsHook: true,
    isStatsHook: true,
    name: `DynamicsWorldStatsHook("${DEBUG_NAME}")`,
    state: state,
    statsReport: statsReport,
    statsReportIntervalSeconds: 1,

    reset: reset,
    update: update,
  });
}
