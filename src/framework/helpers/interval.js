// @flow

import IntervalTick from "../classes/IntervalTick";
import timeout from "./timeout";

import type { CancelToken } from "../interfaces/CancelToken";
import type { IntervalTick as IntervalTickInterface } from "../interfaces/IntervalTick";

export default async function* interval(
  cancelToken: CancelToken,
  delay: number = 40
): AsyncGenerator<IntervalTickInterface, void, void> {
  while (!cancelToken || !cancelToken.isCancelled()) {
    const tick = await timeout(cancelToken, delay);

    if (tick.isCancelled()) {
      break;
    }

    yield new IntervalTick(tick);
  }
}
