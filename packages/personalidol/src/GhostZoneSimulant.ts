/// <reference types="@types/ammo.js" />

import { buildGeometryPoints } from "../../quakemaps/src/buildGeometryPoints";
import { CollisionFlags } from "../../ammo/src/CollisionFlags.enum";
import { createRouter } from "../../framework/src/createRouter";
import { disposableAmmo } from "../../ammo/src/disposableAmmo";
import { disposeAll } from "../../framework/src/disposeAll";
import { fixBrushAfterDeserialization } from "../../quakemaps/src/fixBrushAfterDeserialization";

import type { Brush } from "../../quakemaps/src/Brush.type";
import type { DisposableCallback } from "../../framework/src/DisposableCallback.type";
import type { MessageFeedbackSimulantPreloaded } from "../../dynamics/src/MessageFeedbackSimulantPreloaded.type";
import type { Simulant } from "../../dynamics/src/Simulant.interface";
import type { SimulantState } from "../../dynamics/src/SimulantState.type";
import type { TickTimerState } from "../../framework/src/TickTimerState.type";
import type { UserDataRegistry } from "../../dynamics/src/UserDataRegistry.interface";

import type { AnyEntity } from "./AnyEntity.type";
import type { SimulantsLookup } from "./SimulantsLookup.type";

export function GhostZoneSimulant(
  id: string,
  ammo: typeof Ammo,
  dynamicsWorld: Ammo.btDiscreteDynamicsWorld,
  userDataRegistry: UserDataRegistry,
  simulantFeedbackMessagePort: MessagePort
): Simulant {
  const state: SimulantState = Object.seal({
    isDisposed: false,
    isMounted: false,
    isPaused: false,
    isPreloaded: false,
    isPreloading: false,
    needsUpdates: true,
  });

  const _disposables: Set<DisposableCallback> = new Set();
  const _ghostObjects: Set<Ammo.btGhostObject> = new Set();
  const _overlappingEntities: Set<AnyEntity> = new Set();
  const _overlappingSimulants: Set<string> = new Set();

  const _simulantFeedbackMessageRouter = createRouter({
    brushes(brushes: Array<Brush>) {
      if (state.isPreloaded) {
        throw new Error("WorldspawnGeometrySimulant is already preloaded, but received brushes.");
      }

      const transform = new ammo.btTransform();

      _disposables.add(disposableAmmo(ammo, transform));

      const transformOrigin = new ammo.btVector3(0, 0, 0);

      _disposables.add(disposableAmmo(ammo, transformOrigin));

      transform.setIdentity();
      transform.setOrigin(transformOrigin);

      const localInertia = new ammo.btVector3(0, 0, 0);

      _disposables.add(disposableAmmo(ammo, localInertia));

      const motionState = new ammo.btDefaultMotionState(transform);

      _disposables.add(disposableAmmo(ammo, motionState));

      for (let brush of brushes) {
        fixBrushAfterDeserialization(brush);

        const shape = new ammo.btConvexHullShape();

        _disposables.add(disposableAmmo(ammo, shape));

        for (let point of buildGeometryPoints([brush], false)) {
          const shapePoint = new ammo.btVector3(point.x, point.y, point.z);

          _disposables.add(disposableAmmo(ammo, shapePoint));

          shape.addPoint(shapePoint);
        }

        const ghostObject = new ammo.btGhostObject();

        _disposables.add(disposableAmmo(ammo, ghostObject));

        ghostObject.setCollisionShape(shape);

        // This is binary OR (not ||)
        ghostObject.setCollisionFlags(ghostObject.getCollisionFlags() | CollisionFlags.CF_NO_CONTACT_RESPONSE);

        _ghostObjects.add(ghostObject);
      }

      _onPreloaded();
    },
  });

  function _onPreloaded(): void {
    simulantFeedbackMessagePort.postMessage({
      preloaded: <MessageFeedbackSimulantPreloaded<SimulantsLookup, "worldspawn-geometry">>{
        id: id,
        simulant: "worldspawn-geometry",
      },
    });

    state.isPreloading = false;
    state.isPreloaded = true;
  }

  function _updateGhostObject(ghostObject: Ammo.btGhostObject): void {
    const numOverlappingObjects = ghostObject.getNumOverlappingObjects();

    if (numOverlappingObjects < 1) {
      return;
    }

    for (let i = 0; i < numOverlappingObjects; i += 1) {
      const userIndex = ghostObject.getOverlappingObject(i).getUserIndex();

      if (userIndex < 1 || !userDataRegistry.hasIdByUserIndex(userIndex)) {
        continue;
      }

      const handle = userDataRegistry.getHandleByUserIndex(userIndex);
      const entity: undefined | AnyEntity = handle.data.get("entity");

      // Object has some user data attached.
      _overlappingSimulants.add(handle.simulantId);

      if (entity) {
        _overlappingEntities.add(entity);
      }
    }
  }

  function dispose(): void {
    state.isDisposed = true;

    simulantFeedbackMessagePort.close();
    disposeAll(_disposables);
  }

  function mount(): void {
    state.isMounted = true;

    for (let ghostObject of _ghostObjects) {
      dynamicsWorld.addCollisionObject(ghostObject);
    }
  }

  function pause(): void {
    state.isPaused = true;
  }

  function preload(): void {
    state.isPreloading = true;

    simulantFeedbackMessagePort.onmessage = _simulantFeedbackMessageRouter;
  }

  function unmount(): void {
    state.isMounted = false;

    for (let ghostObject of _ghostObjects) {
      dynamicsWorld.removeCollisionObject(ghostObject);
    }
  }

  function unpause(): void {
    state.isPaused = false;
  }

  function update(delta: number, elapsedTime: number, tickTimerState: TickTimerState): void {
    _overlappingEntities.clear();
    _overlappingSimulants.clear();

    _ghostObjects.forEach(_updateGhostObject);

    simulantFeedbackMessagePort.postMessage({
      overlappingEntities: _overlappingEntities,
      // overlappingSimulants: _overlappingSimulants,
    });
  }

  return Object.freeze({
    id: id,
    isDisposable: true,
    isMountable: true,
    isPreloadable: true,
    isSimulant: true,
    name: "GhostZoneSimulant",
    state: state,

    dispose: dispose,
    mount: mount,
    pause: pause,
    preload: preload,
    unmount: unmount,
    unpause: unpause,
    update: update,
  });
}
