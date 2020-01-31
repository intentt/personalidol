import * as THREE from "three";
import autoBind from "auto-bind";

import CanvasController from "src/framework/classes/CanvasController";
import { default as PlayerView } from "src/framework/classes/CanvasView/Player";

import cancelable from "src/framework/decorators/cancelable";

import CancelToken from "src/framework/interfaces/CancelToken";
import CanvasViewBag from "src/framework/interfaces/CanvasViewBag";
import HasLoggerBreadcrumbs from "src/framework/interfaces/HasLoggerBreadcrumbs";
import LoadingManager from "src/framework/interfaces/LoadingManager";
import LoggerBreadcrumbs from "src/framework/interfaces/LoggerBreadcrumbs";
import PointerState from "src/framework/interfaces/PointerState";
import QueryBus from "src/framework/interfaces/QueryBus";
import { default as ICameraController } from "src/framework/interfaces/CanvasController/Camera";
import { default as IPlayerView } from "src/framework/interfaces/CanvasView/Player";
import { default as IPointerController } from "src/framework/interfaces/CanvasController/Pointer";

import QuakeWorkerPlayer from "src/framework/types/QuakeWorkerPlayer";

export default class Player extends CanvasController implements HasLoggerBreadcrumbs {
  readonly cameraController: ICameraController;
  readonly entity: QuakeWorkerPlayer;
  readonly group: THREE.Group;
  readonly loadingManager: LoadingManager;
  readonly loggerBreadcrumbs: LoggerBreadcrumbs;
  readonly playerView: IPlayerView;
  readonly pointerController: IPointerController;
  readonly pointerState: PointerState;
  readonly queryBus: QueryBus;
  readonly threeLoadingManager: THREE.LoadingManager;

  constructor(
    loggerBreadcrumbs: LoggerBreadcrumbs,
    cameraController: ICameraController,
    canvasViewBag: CanvasViewBag,
    group: THREE.Group,
    entity: QuakeWorkerPlayer,
    loadingManager: LoadingManager,
    pointerController: IPointerController,
    pointerState: PointerState,
    queryBus: QueryBus,
    threeLoadingManager: THREE.LoadingManager
  ) {
    super(canvasViewBag);
    autoBind(this);

    this.cameraController = cameraController;
    this.entity = entity;
    this.group = group;
    this.loadingManager = loadingManager;
    this.loggerBreadcrumbs = loggerBreadcrumbs;
    this.pointerController = pointerController;
    this.pointerState = pointerState;
    this.queryBus = queryBus;
    this.threeLoadingManager = threeLoadingManager;

    this.playerView = new PlayerView(
      this.loggerBreadcrumbs.add("Player"),
      this.canvasViewBag.fork(this.loggerBreadcrumbs.add("Player")),
      this.group,
      this.entity,
      this.loadingManager,
      this.queryBus,
      this.threeLoadingManager
    );
  }

  @cancelable()
  async attach(cancelToken: CancelToken): Promise<void> {
    await super.attach(cancelToken);

    this.cameraController.lookAt(new THREE.Vector3().fromArray(this.entity.origin));

    await this.loadingManager.blocking(this.canvasViewBag.add(cancelToken, this.playerView), "Loading player view");
  }

  begin(): void {
    super.begin();

    const character = this.playerView.getCharacter();

    if (!this.pointerState.isPressed("Primary")) {
      character.setAnimationIdle();
      character.setVelocity(new THREE.Vector3(0, 0, 0));

      return;
    }

    const pointerVector = this.pointerController.getPointerVector();

    pointerVector.rotateAround(new THREE.Vector2(0, 0), (3 * Math.PI) / 4);

    character.setRotationY(pointerVector.angle());

    const direction = new THREE.Vector3(pointerVector.y, 0, pointerVector.x);

    direction.normalize().multiplyScalar(5);

    character.setAnimationWalking();
    character.setVelocity(direction);

    this.cameraController.lookAt(character.getPosition());
  }

  @cancelable()
  async dispose(cancelToken: CancelToken): Promise<void> {
    await super.dispose(cancelToken);
  }

  useBegin(): true {
    return true;
  }
}