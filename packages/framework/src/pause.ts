import { name } from "./name";

import type { Logger } from "loglevel";

import type { Pauseable } from "./Pauseable.interface";

export function pause(logger: Logger, pauseable: Pauseable): void {
  if (pauseable.state.isPaused) {
    throw new Error(`Scene is already paused: "${name(pauseable)}"`);
  }

  // logger.trace(`PAUSE(${name(pauseable)})`);
  pauseable.pause();

  if (!pauseable.state.isPaused) {
    throw new Error(
      `Scene needs to go into 'paused' state immediately after calling '.pause' method: "${name(pauseable)}"`
    );
  }
}
