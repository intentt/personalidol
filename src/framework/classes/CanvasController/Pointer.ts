import * as THREE from "three";
import autoBind from "auto-bind";

import CanvasController from "src/framework/classes/CanvasController";
import { default as CursorView } from "src/framework/classes/CanvasView/Cursor";

import cancelable from "src/framework/decorators/cancelable";

import CancelToken from "src/framework/interfaces/CancelToken";
import CanvasViewBag from "src/framework/interfaces/CanvasViewBag";
import Debugger from "src/framework/interfaces/Debugger";
import ElementPosition from "src/framework/interfaces/ElementPosition";
import ElementSize from "src/framework/interfaces/ElementSize";
import HasLoggerBreadcrumbs from "src/framework/interfaces/HasLoggerBreadcrumbs";
import LoadingManager from "src/framework/interfaces/LoadingManager";
import LoggerBreadcrumbs from "src/framework/interfaces/LoggerBreadcrumbs";
import Scheduler from "src/framework/interfaces/Scheduler";
import { default as ICameraController } from "src/framework/interfaces/CanvasController/Camera";
import { default as ICursorCanvasView } from "src/framework/interfaces/CanvasView/Cursor";

export default class Pointer extends CanvasController implements HasLoggerBreadcrumbs {
  readonly cameraController: ICameraController;
  readonly canvasRootGroup: THREE.Group;
  readonly cursorView: ICursorCanvasView;
  readonly debug: Debugger;
  readonly loadingManager: LoadingManager;
  readonly loggerBreadcrumbs: LoggerBreadcrumbs;
  readonly mouseVector: THREE.Vector2 = new THREE.Vector2(0.5, 0.5);
  readonly raycaster: THREE.Raycaster = new THREE.Raycaster();
  readonly renderer: THREE.WebGLRenderer;
  readonly scheduler: Scheduler;
  private canvasHeight: number = 0;
  private canvasOffsetLeft: number = 0;
  private canvasOffsetTop: number = 0;
  private canvasWidth: number = 0;
  private cursorPlane: THREE.Plane = new THREE.Plane();
  private cursorPlaneIntersection: THREE.Vector3 = new THREE.Vector3();

  constructor(
    loggerBreadcrumbs: LoggerBreadcrumbs,
    canvasRootGroup: THREE.Group,
    canvasViewBag: CanvasViewBag,
    cameraController: ICameraController,
    debug: Debugger,
    loadingManager: LoadingManager,
    renderer: THREE.WebGLRenderer,
    scheduler: Scheduler
  ) {
    super(canvasViewBag);
    autoBind(this);

    this.cameraController = cameraController;
    this.canvasRootGroup = canvasRootGroup;
    this.debug = debug;
    this.loadingManager = loadingManager;
    this.loggerBreadcrumbs = loggerBreadcrumbs;
    this.renderer = renderer;
    this.scheduler = scheduler;

    this.cursorView = new CursorView(this.loggerBreadcrumbs.add("Cursor"), this.canvasViewBag.fork(this.loggerBreadcrumbs.add("Cursor")), this.canvasRootGroup);
  }

  @cancelable()
  async attach(cancelToken: CancelToken): Promise<void> {
    await super.attach(cancelToken);

    const domElement = this.renderer.domElement;
    const optionsPassive = {
      capture: true,
      passive: true,
    };

    domElement.addEventListener("contextmenu", this.onContextMenu);
    domElement.addEventListener("mousedown", this.onMouseChange, optionsPassive);
    domElement.addEventListener("mousedown", this.onMouseDown);
    domElement.addEventListener("mousemove", this.onMouseChange, optionsPassive);
    domElement.addEventListener("mouseup", this.onMouseChange, optionsPassive);
    domElement.addEventListener("mouseup", this.onMouseUp);
    domElement.addEventListener("wheel", this.onWheel);

    // this.debug.updateState(this.loggerBreadcrumbs.add("position"), this.mouseVector);
    await this.loadingManager.blocking(this.canvasViewBag.add(cancelToken, this.cursorView), "Loading cursor");

    // const camera = this.cameraController.getCamera();
    // const worldDirection = new THREE.Vector3();
    const worldDirection = new THREE.Vector3(0, -1, 0);

    // camera.getWorldDirection(worldDirection);

    this.cursorPlane = new THREE.Plane(worldDirection, 0);
  }

  @cancelable()
  async dispose(cancelToken: CancelToken): Promise<void> {
    await super.dispose(cancelToken);

    const domElement = this.renderer.domElement;

    domElement.removeEventListener("contextmenu", this.onContextMenu);
    domElement.removeEventListener("mousedown", this.onMouseChange);
    domElement.removeEventListener("mousedown", this.onMouseDown);
    domElement.removeEventListener("mousemove", this.onMouseChange);
    domElement.removeEventListener("mouseup", this.onMouseChange);
    domElement.removeEventListener("mouseup", this.onMouseUp);
    domElement.removeEventListener("wheel", this.onWheel);

    this.debug.deleteState(this.loggerBreadcrumbs.add("position"));
  }

  onContextMenu(evt: MouseEvent): void {
    evt.preventDefault();
  }

  onMouseChange(evt: MouseEvent): void {
    const relativeX = evt.clientX - this.canvasOffsetLeft;
    const relativeY = evt.clientY - this.canvasOffsetTop;

    this.mouseVector.x = (relativeX / this.canvasWidth) * 2 - 1;
    this.mouseVector.y = -1 * (relativeY / this.canvasHeight) * 2 + 1;
  }

  onMouseDown(evt: MouseEvent): void {}

  onMouseMove(evt: MouseEvent): void {}

  onMouseUp(evt: MouseEvent): void {}

  onWheel(evt: MouseEvent): void {}

  resize(elementSize: ElementSize<"px">): void {
    super.resize(elementSize);

    this.canvasHeight = elementSize.getHeight();
    this.canvasWidth = elementSize.getWidth();
  }

  setPosition(elementPosition: ElementPosition<"px">): void {
    super.setPosition(elementPosition);

    this.canvasOffsetLeft = elementPosition.getX();
    this.canvasOffsetTop = elementPosition.getY();
  }

  update(delta: number): void {
    this.raycaster.setFromCamera(this.mouseVector, this.cameraController.getCamera());

    if (!this.cursorView.isAttached()) {
      return;
    }

    this.raycaster.ray.intersectPlane(this.cursorPlane, this.cursorPlaneIntersection);
    this.cursorView.setPosition(this.cursorPlaneIntersection);
  }

  useUpdate(): boolean {
    return true;
  }
}