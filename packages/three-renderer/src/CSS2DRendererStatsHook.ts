import { MathUtils } from "three/src/math/MathUtils";

import type { StatsHook } from "@personalidol/framework/src/StatsHook.interface";
import type { TickTimerState } from "@personalidol/framework/src/TickTimerState.type";

import type { CSS2DRenderer } from "./CSS2DRenderer.interface";
import type { CSS2DRendererStatsReport } from "./CSS2DRendererStatsReport.type";

const DEBUG_NAME: "renderer_css2d" = "renderer_css2d";

export function CSS2DRendererStatsHook(renderer: CSS2DRenderer): StatsHook {
  const statsReport: CSS2DRendererStatsReport = {
    debugName: DEBUG_NAME,
    lastUpdate: 0,
    renderElements: 0,
  };

  function reset(): void {}

  function update(delta: number, elapsedTime: number, tickTimerState: TickTimerState): void {
    if (statsReport.renderElements === renderer.info.render.elements) {
      return;
    }

    statsReport.lastUpdate = tickTimerState.currentTick;
    statsReport.renderElements = renderer.info.render.elements;
  }

  return Object.freeze({
    id: MathUtils.generateUUID(),
    isCSS2DRendererStatsHook: true,
    isStatsHook: true,
    name: `CSS2DRendererStatsHook("${DEBUG_NAME}")`,
    statsReport: statsReport,
    statsReportIntervalSeconds: 0,

    reset: reset,
    update: update,
  });
}