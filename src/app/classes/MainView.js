// @flow

import * as THREE from "three";
import autoBind from "auto-bind";

import CanvasViewGroup from "../../framework/classes/CanvasViewGroup";
import TiledTilesetView from "./TiledTilesetView";

import type { Light, OrthographicCamera, Scene } from "three";

import type { CancelToken } from "../../framework/interfaces/CancelToken";
import type { CanvasController } from "../../framework/interfaces/CanvasController";
import type { CanvasViewGroup as CanvasViewGroupInterface } from "../../framework/interfaces/CanvasViewGroup";
import type { Debugger } from "../../framework/interfaces/Debugger";
import type { ElementSize } from "../../framework/interfaces/ElementSize";
import type { ExceptionHandler } from "../../framework/interfaces/ExceptionHandler";
import type { KeyboardState } from "../../framework/interfaces/KeyboardState";
import type { LoggerBreadcrumbs } from "../../framework/interfaces/LoggerBreadcrumbs";
import type { PointerState } from "../../framework/interfaces/PointerState";
import type { QueryBus } from "../../framework/interfaces/QueryBus";
import type { THREELoadingManager } from "../../framework/interfaces/THREELoadingManager";

export default class MainView implements CanvasController {
  +camera: OrthographicCamera;
  +canvasViewGroup: CanvasViewGroupInterface;
  +debug: Debugger;
  +light: Light;
  +loggerBreadcrumbs: LoggerBreadcrumbs;
  +scene: Scene;

  constructor(
    exceptionHandler: ExceptionHandler,
    loggerBreadcrumbs: LoggerBreadcrumbs,
    threeLoadingManager: THREELoadingManager,
    keyboardState: KeyboardState,
    pointerState: PointerState,
    queryBus: QueryBus,
    debug: Debugger
  ) {
    autoBind(this);

    this.camera = new THREE.OrthographicCamera();
    this.canvasViewGroup = new CanvasViewGroup(loggerBreadcrumbs.add("CanvasViewGroup"));
    this.debug = debug;
    this.light = new THREE.SpotLight(0xffffff);
    this.loggerBreadcrumbs = loggerBreadcrumbs;
    this.scene = new THREE.Scene();

    this.canvasViewGroup.add(
      new TiledTilesetView(
        loggerBreadcrumbs.add("TiledTilesetView"),
        queryBus,
        this.scene,
        threeLoadingManager,
        "/assets/map-outlands-01.tmx"
      )
    );

    this.camera.position.set(32, 32, 32);
    this.camera.lookAt(this.scene.position);

    this.light.position.set(512, 512, 512);
  }

  async attach(cancelToken: CancelToken, renderer: THREE.WebGLRenderer): Promise<void> {
    this.scene.add(this.light);

    await this.canvasViewGroup.attach(cancelToken, renderer);
  }

  begin(): void {
    return this.canvasViewGroup.begin();
  }

  async detach(cancelToken: CancelToken, renderer: THREE.WebGLRenderer): Promise<void> {
    await this.canvasViewGroup.detach(cancelToken, renderer);

    this.scene.remove(this.light);
  }

  draw(renderer: THREE.WebGLRenderer, interpolationPercentage: number): void {
    // renderer.setPixelRatio(1);
    renderer.render(this.scene, this.camera);
  }

  end(fps: number, isPanicked: boolean): void {
    this.debug.updateState(this.loggerBreadcrumbs.add("end").add("fps"), Math.round(fps * 100) / 100);
    this.debug.updateState(this.loggerBreadcrumbs.add("end").add("isPanicked"), String(isPanicked));
  }

  resize(elementSize: ElementSize<"px">): void {
    const zoom = 200;
    const height = elementSize.getHeight();
    const width = elementSize.getWidth();

    this.camera.left = -1 * (width / zoom);
    this.camera.far = 100;
    this.camera.near = 0;
    this.camera.right = width / zoom;
    this.camera.top = height / zoom;
    this.camera.bottom = -1 * (height / zoom);
    this.camera.updateProjectionMatrix();
  }

  async start(): Promise<void> {
    await this.canvasViewGroup.start();
  }

  async stop(): Promise<void> {
    await this.canvasViewGroup.stop();
  }

  update(delta: number): void {
    this.canvasViewGroup.update(delta);
  }
}
