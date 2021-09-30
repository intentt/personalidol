import { generateUUID } from "@personalidol/math/src/generateUUID";

import type { Scheduler } from "./Scheduler.interface";
import type { SchedulerCallback } from "./SchedulerCallback.type";

type TickType = ReturnType<typeof setTimeout>;
// type TickType = number;

function cancelFrame(frameId: TickType): void {
  clearTimeout(frameId);
}

export function SetTimeoutScheduler(timestep: number = 1000 / 60): Scheduler<TickType> {
  function requestFrame(callback: SchedulerCallback): TickType {
    // @ts-ignore timeout argument just behaves unpredicably
    return setTimeout(callback, timestep);
  }

  return Object.freeze({
    id: generateUUID(),
    name: `SetTimeoutScheduler(${timestep})`,

    cancelFrame: cancelFrame,
    requestFrame: requestFrame,
  });
}
