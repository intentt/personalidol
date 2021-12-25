import { name } from "../../framework/src/name";

import { InteractableEntityController } from "./InteractableEntityController";
import { InteractorEntityController } from "./InteractorEntityController";
import { isCharacterView } from "./isCharacterView";
import { isEntityViewOfClass } from "./isEntityViewOfClass";
import { isEntityWithController } from "./isEntityWithController";
import { isNPCEntityView } from "./isNPCEntityView";
import { MapTransitionEntityController } from "./MapTransitionEntityController";
import { NPCEntityController } from "./NPCEntityController";
import { PlayerEntityController } from "./PlayerEntityController";
import { StructureCeilingEntityController } from "./StructureCeilingEntityController";
import { WorldspawnGeometryEntityController } from "./WorldspawnGeometryEntityController";

import type { Logger } from "loglevel";

import type { CameraController } from "../../framework/src/CameraController.interface";
import type { Evaluator } from "../../expression-language/src/Evaluator.interface";
import type { InteractableBag } from "../../views/src/InteractableBag.interface";
import type { UserInputController } from "../../input/src/UserInputController.interface";
import type { UserInputMouseController } from "../../input/src/UserInputMouseController.interface";
import type { ViewBag } from "../../views/src/ViewBag.interface";

import type { AnyEntity } from "./AnyEntity.type";
import type { EntityController as IEntityController } from "./EntityController.interface";
import type { EntityControllerFactory as IEntityControllerFactory } from "./EntityControllerFactory.interface";
import type { EntityPlayer } from "./EntityPlayer.type";
import type { EntityScriptedBrush } from "./EntityScriptedBrush.type";
import type { EntityScriptedZone } from "./EntityScriptedZone.type";
import type { EntityView } from "./EntityView.interface";
import type { EntityWorldspawn } from "./EntityWorldspawn.type";
import type { GameState } from "./GameState.type";
import type { NPCEntity } from "./NPCEntity.type";
import type { UIState } from "./UIState.type";

export function EntityControllerFactory(
  logger: Logger,
  cameraController: CameraController,
  interactableBag: InteractableBag,
  viewBag: ViewBag,
  evaluator: Evaluator,
  gameState: GameState,
  uiState: UIState,
  domMessagePort: MessagePort,
  dynamicsMessagePort: MessagePort,
  userInputEventBusController: UserInputController,
  userInputKeyboardController: UserInputController,
  userInputMouseController: UserInputMouseController,
  userInputTouchController: UserInputController
): IEntityControllerFactory {
  function _evaluateControllerList(expression: string): Array<string> {
    const controllers = evaluator.evaluateSync(expression);

    if (!Array.isArray(controllers)) {
      throw new Error(`Controllers list does not evaluate to array: "${expression}"`);
    }

    return controllers;
  }

  function* create<E extends AnyEntity>(view: EntityView<E>): Generator<IEntityController<E>> {
    if (!isEntityWithController(view.entity)) {
      throw new Error(`View do not use a controller: "${name(view)}"`);
    }

    const controllers = _evaluateControllerList(view.entity.properties.controller);

    for (let controller of controllers) {
      switch (controller) {
        case "ceiling":
          if (!isEntityViewOfClass<EntityScriptedBrush>(view, "scripted_brush")) {
            throw new Error(
              `Map transition entity controller only supports "scripted_brush" entity. Got: "${view.entity.classname}"`
            );
          }

          yield StructureCeilingEntityController(logger, view, cameraController) as IEntityController<E>;
          break;
        case "interactable":
          yield InteractableEntityController(
            logger,
            view,
            cameraController,
            interactableBag,
            domMessagePort
          ) as IEntityController<E>;
          break;
        case "interactor":
          yield InteractorEntityController(
            logger,
            view,
            cameraController,
            interactableBag,
            domMessagePort
          ) as IEntityController<E>;
          break;
        case "map-transition":
          if (!isEntityViewOfClass<EntityScriptedZone>(view, "scripted_zone")) {
            throw new Error(
              `Map transition entity controller only supports "scripted_zone" entity. Got: "${view.entity.classname}"`
            );
          }

          yield MapTransitionEntityController(view, gameState, dynamicsMessagePort) as IEntityController<E>;
          break;
        case "npc":
          if (!isNPCEntityView(view)) {
            throw new Error(`NPC entity controller only supports NPCEntity. Got: "${view.entity.classname}"`);
          }

          if (!isCharacterView<NPCEntity>(view)) {
            throw new Error("NPC entity controller only supports character view.");
          }

          yield NPCEntityController(logger, view, dynamicsMessagePort);
          break;
        case "player":
          if (!isEntityViewOfClass<EntityPlayer>(view, "player")) {
            throw new Error(`Player entity controller only supports player entity. Got: "${view.entity.classname}"`);
          }

          if (!isCharacterView<EntityPlayer>(view)) {
            throw new Error("Player entity controller only supports character view.");
          }

          yield PlayerEntityController(
            logger,
            view,
            cameraController,
            userInputEventBusController,
            userInputKeyboardController,
            userInputMouseController,
            userInputTouchController,
            dynamicsMessagePort
          ) as unknown as IEntityController<E>;
          break;
        case "worldspawn":
          if (
            !isEntityViewOfClass<EntityWorldspawn>(view, "worldspawn") &&
            !isEntityViewOfClass<EntityScriptedBrush>(view, "scripted_brush")
          ) {
            throw new Error(
              `Worldspawn entity controller only supports 'worldspawn' and 'scripted_brush' entities. Got: "${view.entity.classname}"`
            );
          }

          yield WorldspawnGeometryEntityController<EntityWorldspawn | EntityScriptedBrush>(
            view,
            dynamicsMessagePort
          ) as IEntityController<E>;
          break;
        default:
          throw new Error(`Unsupported entity controller: "${view.entity.properties.controller}"`);
      }
    }
  }

  return Object.freeze({
    isEntityControllerFactory: true,

    create: create,
  });
}
