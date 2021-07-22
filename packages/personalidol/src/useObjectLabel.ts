import { CSS2DObject } from "@personalidol/three-css2d-renderer/src/CSS2DObject";

import { isEntityWithObjectLabel } from "./isEntityWithObjectLabel";

import type { Object3D } from "three/src/core/Object3D";

import type { DisposableCallback } from "@personalidol/framework/src/DisposableCallback.type";
import type { MountableCallback } from "@personalidol/framework/src/MountableCallback.type";
import type { UnmountableCallback } from "@personalidol/framework/src/UnmountableCallback.type";

import type { AnyEntity } from "./AnyEntity.type";
import type { DOMElementsLookup } from "./DOMElementsLookup.type";

export function useObjectLabel(
  domMessagePort: MessagePort,
  parent: Object3D,
  entity: AnyEntity,
  mountables: Set<MountableCallback>,
  unmountables: Set<UnmountableCallback>,
  disposables: Set<DisposableCallback>
): void {
  if (!isEntityWithObjectLabel(entity)) {
    return;
  }

  const label = new CSS2DObject<DOMElementsLookup>(domMessagePort, "pi-object-label", {
    label: entity.properties.label,
    version: 0,
  });

  mountables.add(function () {
    parent.add(label);
  });

  unmountables.add(function () {
    parent.remove(label);
  });
}
