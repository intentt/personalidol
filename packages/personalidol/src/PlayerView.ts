import { generateUUID } from "@personalidol/math/src/generateUUID";
import { name } from "@personalidol/framework/src/name";

import { MD2ModelView } from "./MD2ModelView";

import type { Logger } from "loglevel";
import type { Scene } from "three/src/scenes/Scene";

import type { RPCLookupTable } from "@personalidol/framework/src/RPCLookupTable.type";

import type { CharacterView } from "./CharacterView.interface";
import type { EntityMD2Model } from "./EntityMD2Model.type";
import type { EntityPlayer } from "./EntityPlayer.type";
import type { UserSettings } from "./UserSettings.type";

export function PlayerView(
  logger: Logger,
  userSettings: UserSettings,
  scene: Scene,
  entity: EntityPlayer,
  domMessagePort: MessagePort,
  md2MessagePort: MessagePort,
  texturesMessagePort: MessagePort,
  rpcLookupTable: RPCLookupTable
): CharacterView<EntityPlayer> {
  const _md2Entity: EntityMD2Model = Object.freeze({
    id: generateUUID(),
    angle: 0,
    classname: "model_md2",
    model_name: "necron99",
    origin: entity.origin,
    properties: entity.properties,
    skin: 3,
    transferables: [],
  });

  const _playerModel = MD2ModelView(
    logger,
    userSettings,
    scene,
    _md2Entity,
    domMessagePort,
    md2MessagePort,
    texturesMessagePort,
    rpcLookupTable
  );

  _playerModel.state.needsRaycast = false;

  return Object.freeze({
    entity: entity,
    id: generateUUID(),
    isCharacterView: true,
    isDisposable: true,
    isEntityView: true,
    isExpectingTargets: false,
    isMountable: true,
    isPreloadable: true,
    isRaycastable: true,
    isView: true,
    name: `PlayerView(${name(_playerModel)})`,
    object3D: _playerModel.object3D,
    raycasterObject3D: _playerModel.raycasterObject3D,
    state: _playerModel.state,

    dispose: _playerModel.dispose,
    mount: _playerModel.mount,
    pause: _playerModel.pause,
    preload: _playerModel.preload,
    transitionBy: _playerModel.transitionBy,
    transitionTo: _playerModel.transitionTo,
    unmount: _playerModel.unmount,
    unpause: _playerModel.unpause,
    update: _playerModel.update,
  });
}
