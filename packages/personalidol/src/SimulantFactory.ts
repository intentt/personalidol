/// <reference types="@types/ammo.js" />

import { GhostZoneSimulant } from "./GhostZoneSimulant";
import { NPCSimulant } from "./NPCSimulant";
import { WorldspawnGeometrySimulant } from "./WorldspawnGeometrySimulant";

import type { MessageSimulantRegister } from "../../dynamics/src/MessageSimulantRegister.type";
import type { SimulantFactory as ISimulantFactory } from "../../dynamics/src/SimulantFactory.interface";
import type { UserDataRegistry } from "../../dynamics/src/UserDataRegistry.interface";

import type { SimulantsLookup } from "./SimulantsLookup.type";

export function SimulantFactory<S extends SimulantsLookup>(): ISimulantFactory<S> {
  function create<K extends string & keyof S>(
    ammo: typeof Ammo,
    dynamicsWorld: Ammo.btDiscreteDynamicsWorld,
    userDataRegistry: UserDataRegistry,
    message: MessageSimulantRegister<S, K>
  ): S[K] {
    switch (message.simulant) {
      case "ghost-zone":
        return GhostZoneSimulant(
          message.id,
          ammo,
          dynamicsWorld,
          userDataRegistry,
          message.simulantFeedbackMessagePort
        ) as S[K];
      case "npc":
        return NPCSimulant(
          message.id,
          ammo,
          dynamicsWorld,
          userDataRegistry,
          message.simulantFeedbackMessagePort
        ) as S[K];
      case "worldspawn-geoemetry":
        return WorldspawnGeometrySimulant(message.id, ammo, dynamicsWorld, message.simulantFeedbackMessagePort) as S[K];
      default:
        throw new Error(`Unsupported simulant: "${message.simulant}"`);
    }
  }

  return Object.freeze({
    isSimulantFactory: true,

    create: create,
  });
}
