import { createRouter } from "@personalidol/framework/src/createRouter";
import { generateUUID } from "@personalidol/math/src/generateUUID";

import type { MainLoopUpdatableState } from "@personalidol/framework/src/MainLoopUpdatableState.type";
import type { StatsReport } from "@personalidol/framework/src/StatsReport.type";
import type { UserSettings } from "@personalidol/framework/src/UserSettings.type";

import type { DOMElementsLookup } from "./DOMElementsLookup.type";
import type { MessageDOMUIDispose } from "./MessageDOMUIDispose.type";
import type { MessageDOMUIRender } from "./MessageDOMUIRender.type";
import type { StatsCollector as IStatsCollector } from "./StatsCollector.interface";

type StatsHooksReports = {
  [key: string]: StatsReport;
};

export function StatsCollector(userSettings: UserSettings, domMessagePort: MessagePort): IStatsCollector {
  const state: MainLoopUpdatableState = Object.seal({
    needsUpdates: true,
  });

  const _statsReports: StatsHooksReports = {};
  const _statsRouter = createRouter({
    statsReport: function (statsReport: StatsReport) {
      _statsReports[statsReport.debugName] = statsReport;
    },
  });

  let _domStatsReporterElementId: null | string;
  let _domPropsVersion: number = 0;

  function registerMessagePort(messagePort: MessagePort) {
    messagePort.onmessage = _statsRouter;
  }

  function start() {}

  function stop() {
    if (!_domStatsReporterElementId) {
      _disposeDOMStatsView();
    }
  }

  function update(delta: number) {
    if (!userSettings.showStatsReporter && _domStatsReporterElementId) {
      _disposeDOMStatsView();
    }

    if (!userSettings.showStatsReporter) {
      return;
    }

    if (!_domStatsReporterElementId) {
      _domStatsReporterElementId = generateUUID();
    }

    _domPropsVersion += 1;

    domMessagePort.postMessage({
      render: <MessageDOMUIRender<DOMElementsLookup>>{
        id: _domStatsReporterElementId,
        element: "pi-stats-reporter",
        props: {
          // Make a snapshot copy.
          statsReports: Object.values(_statsReports),
          version: _domPropsVersion,
        },
      },
    });
  }

  function _disposeDOMStatsView() {
    if (!_domStatsReporterElementId) {
      throw new Error("DOM stats siew was never rendered.");
    }

    domMessagePort.postMessage({
      dispose: <MessageDOMUIDispose>[_domStatsReporterElementId],
    });

    _domStatsReporterElementId = null;
  }

  return Object.freeze({
    id: generateUUID(),
    name: "StatsCollector",
    state: state,
    thread: "main" as const,

    registerMessagePort: registerMessagePort,
    start: start,
    stop: stop,
    update: update,
  });
}
