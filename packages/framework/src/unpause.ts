import { name } from "./name";

import type { Logger } from "loglevel";

import type { Pauseable } from "./Pauseable.interface";

export function unpause(logger: Logger, pauseable: Pauseable): void {
  if (!pauseable.state.isPaused) {
    throw new Error(`Scene is already unpaused: "${name(pauseable)}"`);
  }

  // logger.trace(`UNPAUSE(${name(pauseable)})`);
  pauseable.unpause();

  if (pauseable.state.isPaused) {
    throw new Error(
      `Scene needs to go into 'unpaused' state immediately after calling '.unpause' method: "${name(pauseable)}"`
    );
  }
}
