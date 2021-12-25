import { h } from "preact";

import { isStatsReport } from "../../framework/src/isStatsReport";

import { DOMElementView } from "./DOMElementView";

import type { StatsReport } from "../../framework/src/StatsReport.type";

import type { DOMElementViewContext } from "./DOMElementViewContext.type";
import type { StatsReporterDOMElementView as IStatsReporterDOMElementView } from "./StatsReporterDOMElementView.interface";

type FlattenedStatsReport = [string, boolean | number | string];

const _css = `
  :host {
    all: initial;
    pointer-events: none;
  }

  *, * * {
    box-sizing: border-box;
  }

  #stats {
    color: white;
    display: grid;
    font-family: monospace;
    font-size: 1rem;
    grid-gap: 0.5ch;
    line-height: 1;
    left: 0;
    opacity: 0.4;
    padding: 1.6rem;
    position: absolute;
    top: 0;
    text-shadow:
      -1px -1px 0 black,
      1px -1px 0 black,
      -1px 1px 0 black,
      1px 1px 0 black
    ;
  }
`;

function* _flattenStatsReport(statsReport: StatsReport, prefix: string = ""): Generator<FlattenedStatsReport> {
  for (let [key, value] of Object.entries(statsReport)) {
    if ("debugName" === key || "lastUpdate" === key) {
      continue;
    }

    if (isStatsReport(value)) {
      yield* _flattenStatsReport(value, `${prefix}${statsReport.debugName}.`);
      continue;
    }

    yield [`${prefix}${statsReport.debugName}.${key}`, value];
  }
}

function* _flattenStatsReports(statsReports: Array<StatsReport>): Generator<FlattenedStatsReport> {
  for (let statsReport of statsReports) {
    yield* _flattenStatsReport(statsReport);
  }
}

function _sortCompareReports(a: FlattenedStatsReport, b: FlattenedStatsReport): number {
  return a[0].localeCompare(b[0]);
}

export class StatsReporterDOMElementView
  extends DOMElementView<DOMElementViewContext>
  implements IStatsReporterDOMElementView
{
  public static zIndex: number = 0;
  public static css: string = _css;

  public statsReportsFlattened: Array<FlattenedStatsReport> = [];

  set statsReports(statsReports: Array<StatsReport>) {
    this.needsRender = true;

    if (Array.isArray(statsReports)) {
      this.statsReportsFlattened = Array.from(_flattenStatsReports(statsReports)).sort(_sortCompareReports);
    } else {
      this.statsReportsFlattened = [];
    }
  }

  constructor() {
    super();

    this.renderStatsReportFlattened = this.renderStatsReportFlattened.bind(this);
  }

  render() {
    return (
      <div
        id="stats"
        style={{
          "z-index": StatsReporterDOMElementView.zIndex,
        }}
      >
        {this.statsReportsFlattened.map(this.renderStatsReportFlattened)}
      </div>
    );
  }

  renderStatsReportFlattened([key, value]: FlattenedStatsReport) {
    return (
      <div key={key}>
        {key}: {String(value)}
      </div>
    );
  }
}
