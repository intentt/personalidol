import { generateUUID } from "../../math/src/generateUUID";

import type { WebGLRenderer } from "three/src/renderers/WebGLRenderer";

import type { MainLoopUpdatableState } from "./MainLoopUpdatableState.type";
import type { StatsHook } from "./StatsHook.interface";
import type { TickTimerState } from "./TickTimerState.type";
import type { WebGLRendererStatsReport } from "./WebGLRendererStatsReport.type";

const DEBUG_NAME: "renderer_webgl" = "renderer_webgl";

export function WebGLRendererStatsHook(renderer: WebGLRenderer): StatsHook {
  const state: MainLoopUpdatableState = Object.seal({
    needsUpdates: true,
  });

  const statsReport: WebGLRendererStatsReport = {
    debugName: DEBUG_NAME,
    lastUpdate: 0,
    memoryGeometries: 0,
    memoryTextures: 0,
    programs: 0,
    renderCalls: 0,
    renderLines: 0,
    renderPoints: 0,
    renderTriangles: 0,
  };

  function reset(): void {}

  function update(delta: number, elapsedTime: number, tickTimerState: TickTimerState): void {
    statsReport.memoryGeometries = renderer.info.memory.geometries;
    statsReport.memoryTextures = renderer.info.memory.textures;
    statsReport.programs = renderer.info.programs?.length ?? 0;
    statsReport.renderCalls = renderer.info.render.calls;
    statsReport.renderLines = renderer.info.render.lines;
    statsReport.renderPoints = renderer.info.render.points;
    statsReport.renderTriangles = renderer.info.render.triangles;
    statsReport.lastUpdate = tickTimerState.currentTick;
  }

  return Object.freeze({
    id: generateUUID(),
    isWebGLRendererStatsHook: true,
    isStatsHook: true,
    name: `WebGLRendererStatsHook("${DEBUG_NAME}")`,
    state: state,
    statsReport: statsReport,
    statsReportIntervalSeconds: 0,

    reset: reset,
    update: update,
  });
}
