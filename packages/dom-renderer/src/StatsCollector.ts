import { MathUtils } from "three/src/math/MathUtils";

import { createRouter } from "@personalidol/framework/src/createRouter";

import type { StatsReport } from "@personalidol/framework/src/StatsReport.type";

import type { MessageDOMUIRender } from "./MessageDOMUIRender.type";
import type { StatsCollector as IStatsCollector } from "./StatsCollector.interface";

const INTERVAL_S: number = 1;

type StatsHooksReports = {
  [key: string]: StatsReport;
};

export function StatsCollector(domMessagePort: MessagePort): IStatsCollector {
  const _domStatsReporterElementId: string = MathUtils.generateUUID();
  const _statsReports: StatsHooksReports = {};
  const _statsRouter = createRouter({
    statsReport: function (statsReport: StatsReport) {
      _statsReports[statsReport.debugName] = statsReport;
    },
  });

  let _currentIntervalDuration: number = 0;

  function _reportInterval() {
    domMessagePort.postMessage({
      render: <MessageDOMUIRender>{
        id: _domStatsReporterElementId,
        element: "pi-stats-reporter",
        props: {
          statsReports: Object.values(_statsReports),
        },
      },
    });
  }

  function _resetInterval() {
    _currentIntervalDuration = 0;
  }

  function registerMessagePort(messagePort: MessagePort) {
    messagePort.onmessage = _statsRouter;
  }

  function start() {}

  function stop() {}

  function update(delta: number) {
    _currentIntervalDuration += delta;

    if (_currentIntervalDuration >= INTERVAL_S) {
      _reportInterval();
      _resetInterval();
    }
  }

  return Object.freeze({
    id: MathUtils.generateUUID(),
    name: "StatsCollector",

    registerMessagePort: registerMessagePort,
    start: start,
    stop: stop,
    update: update,
  });
}