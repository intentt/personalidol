import type { StatsReport } from "../../framework/src/StatsReport.type";

export type CSS2DRendererStatsReport = StatsReport & {
  renderElements: number;
};
