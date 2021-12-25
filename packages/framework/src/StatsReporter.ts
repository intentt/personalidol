import { generateUUID } from "../../math/src/generateUUID";

import type { MainLoopUpdatableState } from "./MainLoopUpdatableState.type";
import type { StatsHook } from "./StatsHook.interface";
import type { StatsReport } from "./StatsReport.type";
import type { StatsReporter as IStatsReporter } from "./StatsReporter.interface";
import type { TickTimerState } from "./TickTimerState.type";

type HookLastReports = WeakMap<StatsHook, number>;

function _shouldUpdateHookReport(hookLastReports: HookLastReports, hook: StatsHook, elapsedTime: number): boolean {
  const hookLastReport: undefined | number = hookLastReports.get(hook);

  if ("undefined" === typeof hookLastReport) {
    hookLastReports.set(hook, elapsedTime);

    return true;
  }

  if (elapsedTime - hookLastReport < hook.statsReportIntervalSeconds) {
    return false;
  }

  hookLastReports.set(hook, elapsedTime);

  return true;
}

export function StatsReporter(
  debugName: string,
  statsMessagePort: MessagePort,
  tickTimerState: TickTimerState
): IStatsReporter {
  const state: MainLoopUpdatableState = Object.seal({
    needsUpdates: true,
  });

  const hooks: Set<StatsHook> = new Set();

  const _hooksStatuses: HookLastReports = new WeakMap();
  const _report: StatsReport = {
    debugName: debugName,
    lastUpdate: 0,
  };

  let _shouldReportAnthing: boolean = false;

  function _updateHook(hook: StatsHook): void {
    hook.update(tickTimerState.delta, tickTimerState.elapsedTime, tickTimerState);

    if (!_shouldUpdateHookReport(_hooksStatuses, hook, tickTimerState.elapsedTime)) {
      return;
    }

    _shouldReportAnthing = true;

    // Make a snapshot copy of a stats report.
    _report[hook.statsReport.debugName] = Object.assign({}, hook.statsReport);
    _report.lastUpdate = tickTimerState.currentTick;

    hook.reset();
  }

  function start() {}

  function stop() {}

  function update() {
    _shouldReportAnthing = false;

    hooks.forEach(_updateHook);

    if (!_shouldReportAnthing) {
      return;
    }

    _shouldReportAnthing = false;

    statsMessagePort.postMessage({
      statsReport: _report,
    });
  }

  return Object.freeze({
    hooks: hooks,
    id: generateUUID(),
    isStatsReporter: true,
    name: "StatsReporter",
    state: state,

    start: start,
    stop: stop,
    update: update,
  });
}
