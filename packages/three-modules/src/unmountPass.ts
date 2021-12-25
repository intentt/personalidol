import type { UnmountableCallback } from "../../framework/src/UnmountableCallback.type";

import type { EffectComposer } from "./postprocessing/EffectComposer.interface";
import type { Pass } from "./postprocessing/Pass.interface";

export function unmountPass(effectComposer: EffectComposer, pass: Pass): UnmountableCallback {
  return function () {
    effectComposer.removePass(pass);
  };
}
