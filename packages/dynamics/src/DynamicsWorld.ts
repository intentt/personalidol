/// <reference types="@types/ammo.js" />

import { createRouter } from "../../framework/src/createRouter";
import { dispose } from "../../framework/src/dispose";
import { generateUUID } from "../../math/src/generateUUID";
import { mount } from "../../framework/src/mount";
import { name } from "../../framework/src/name";
import { preload } from "../../framework/src/preload";
import { unmount } from "../../framework/src/unmount";

import { UserDataRegistry } from "./UserDataRegistry";

import type { Logger } from "loglevel";

import type { TickTimerState } from "../../framework/src/TickTimerState.type";

import type { UserDataRegistry as IUserDataRegistry } from "./UserDataRegistry.interface";

import type { DynamicsWorld as IDynamicsWorld } from "./DynamicsWorld.interface";
import type { DynamicsWorldInfo } from "./DynamicsWorldInfo.type";
import type { DynamicsWorldState } from "./DynamicsWorldState.type";
import type { MessageSimulantDispose } from "./MessageSimulantDispose.type";
import type { MessageSimulantRegister } from "./MessageSimulantRegister.type";
import type { Simulant } from "./Simulant.interface";
import type { SimulantFactory } from "./SimulantFactory.interface";
import type { SimulantsLookup } from "./SimulantsLookup.type";

function _createAmmoDynamicsWorld(ammo: typeof Ammo) {
  const collisionConfiguration = new ammo.btDefaultCollisionConfiguration();
  const dispatcher = new ammo.btCollisionDispatcher(collisionConfiguration);
  const overlappingPairCache: Ammo.btBroadphaseInterface =
    new ammo.btDbvtBroadphase() as unknown as Ammo.btBroadphaseInterface;
  const solver = new ammo.btSequentialImpulseConstraintSolver();
  const dynamicsWorld = new ammo.btDiscreteDynamicsWorld(
    dispatcher,
    overlappingPairCache,
    solver,
    collisionConfiguration
  );

  // Everything in the dynamics world is scaled up
  // (character models are 15x15x20 on average), so gravity needs to be higher
  // in order for simulation to look and feel right.
  dynamicsWorld.setGravity(new ammo.btVector3(0, -9.81 * 100, 0));

  // Ghost objects collistions and overlaps.
  dynamicsWorld.getBroadphase().getOverlappingPairCache().setInternalGhostPairCallback(new ammo.btGhostPairCallback());

  return dynamicsWorld;
}

export function DynamicsWorld<S extends SimulantsLookup>(
  logger: Logger,
  ammo: typeof Ammo,
  simulantFactory: SimulantFactory<S>,
  tickTimerState: TickTimerState,
  dynamicsMessagePort: MessagePort,
  progressMessagePort: MessagePort
): IDynamicsWorld<S> {
  const info: DynamicsWorldInfo = Object.seal({
    registeredSimulants: 0,
  });
  const state: DynamicsWorldState = Object.seal({
    isPaused: false,
    needsUpdates: true,
  });

  const _dynamicsWorld = _createAmmoDynamicsWorld(ammo);
  const _registeredSimulants: Map<string, Simulant> = new Map();
  const _userDataRegistry: IUserDataRegistry = UserDataRegistry();

  const _dynamicsMessageRouter = createRouter({
    pause: pause,
    unpause: unpause,

    disposeSimulant(message: MessageSimulantDispose): void {
      message.forEach(_disposeSimulant);
    },

    registerSimulant(message: MessageSimulantRegister<S, string & keyof S>): void {
      const simulant = simulantFactory.create(ammo, _dynamicsWorld, _userDataRegistry, message);

      if (_registeredSimulants.has(message.id)) {
        throw new Error(`Duplicate simulant id: "${name(simulant)}"`);
      }

      _registeredSimulants.set(message.id, simulant);
      info.registeredSimulants = _registeredSimulants.size;

      preload(logger, simulant);
    },
  });

  function _disposeSimulant(id: string): void {
    const simulant: undefined | Simulant = _registeredSimulants.get(id);

    if (!simulant) {
      throw new Error(`No simulant registered with id: "${id}"`);
    }

    if (simulant.state.isMounted) {
      unmount(logger, simulant);
    }

    dispose(logger, simulant);

    _registeredSimulants.delete(id);
    info.registeredSimulants = _registeredSimulants.size;
  }

  function _updateSimulant(simulant: Simulant): void {
    if (!simulant.state.isPreloaded) {
      return;
    }

    if (!simulant.state.isMounted) {
      mount(logger, simulant);

      return;
    }

    simulant.update(tickTimerState.delta, tickTimerState.elapsedTime, tickTimerState);
  }

  function pause(): void {
    state.isPaused = true;
  }

  function start(): void {
    dynamicsMessagePort.onmessage = _dynamicsMessageRouter;
  }

  function stop(): void {
    dynamicsMessagePort.onmessage = null;
  }

  function unpause(): void {
    state.isPaused = false;
  }

  /**
   * `DynamicsWorlds` needs to run with `DynamicsMainLoopTicker`, because it
   * expects constant timestep in physics simulation.
   */
  function update(delta: number): void {
    if (state.isPaused) {
      return;
    }

    _registeredSimulants.forEach(_updateSimulant);
    _dynamicsWorld.stepSimulation(delta, 0, 1);
  }

  return Object.freeze({
    id: generateUUID(),
    info: info,
    isDynamicsWorld: true,
    name: "DynamicsWorld",
    state: state,

    pause: pause,
    start: start,
    stop: stop,
    unpause: unpause,
    update: update,
  });
}
