import { generateUUID } from "../../math/src/generateUUID";
import { name } from "./name";

import type { MessageProgressChange } from "./MessageProgressChange.type";
import type { MessageProgressDone } from "./MessageProgressDone.type";
import type { MessageProgressError } from "./MessageProgressError.type";
import type { MessageProgressStart } from "./MessageProgressStart.type";
import type { Nameable } from "./Nameable.interface";
import type { Progress as IProgress } from "./Progress.interface";
import type { ProgressState } from "./ProgressState.type";

export function Progress(progressMessagePort: MessagePort, resourceType: string, resourceUri: string): IProgress {
  const state: ProgressState = Object.seal({
    isFailed: false,
    isFinished: false,
    isStarted: false,
  });

  const _nameable: Nameable = {
    id: generateUUID(),
    name: `Progress("${resourceType}", "${resourceUri}")`,
  };

  function done(): void {
    if (!state.isStarted) {
      throw new Error(`Progress is finished but was never started: "${name(_nameable)}"`);
    }

    state.isFinished = true;
    progressMessagePort.postMessage({
      done: <MessageProgressDone>{
        id: _nameable.id,
        loaded: 1,
        total: 1,
        type: resourceType,
        uri: resourceUri,
      },
    });
  }

  function error(err: Error): void {
    if (!state.isStarted) {
      throw new Error(`Progress failed but was never started: "${name(_nameable)}"`);
    }

    state.isFailed = true;
    progressMessagePort.postMessage({
      error: <MessageProgressError>{
        id: _nameable.id,
        message: err.message,
        type: resourceType,
        uri: resourceUri,
      },
    });
  }

  function progress(loaded: number, total: number): void {
    if (!state.isStarted) {
      throw new Error(`Progress is increasing but it was never started: "${name(_nameable)}"`);
    }

    if (state.isFailed || state.isFinished) {
      throw new Error(
        `Progress that is failed or finished cannot be moved forward: "${name(_nameable)}" "${loaded}/${total}"`
      );
    }

    progressMessagePort.postMessage({
      progress: <MessageProgressChange>{
        id: _nameable.id,
        loaded: loaded,
        total: total,
        type: resourceType,
        uri: resourceUri,
      },
    });
  }

  function start(): void {
    if (state.isStarted) {
      throw new Error(`Progress is already started: "${name(_nameable)}"`);
    }

    if (state.isFailed || state.isFinished) {
      throw new Error(`Progress that is failed or finished cannot be restarted: "${name(_nameable)}"`);
    }

    state.isStarted = true;

    progressMessagePort.postMessage({
      start: <MessageProgressStart>{
        id: _nameable.id,
        type: resourceType,
        uri: resourceUri,
      },
    });
  }

  function wait<T>(promise: Promise<T>): Promise<T> {
    start();

    function _onDone(ret: T): T {
      done();

      return ret;
    }

    promise.catch(error);

    return promise.then(_onDone);
  }

  return Object.seal({
    id: _nameable.id,
    name: _nameable.name,
    state: state,

    progress: progress,
    done: done,
    error: error,
    start: start,
    wait: wait,
  });
}
