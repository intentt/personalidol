import * as THREE from "three";
import autoBind from "auto-bind";

import { THREEPointerInteraction as THREEPointerInteractionInterface } from "src/framework/interfaces/THREEPointerInteraction";
import { ElementSize as ElementSizeInterface } from "src/framework/interfaces/ElementSize";

export default class THREEPointerInteraction implements THREEPointerInteractionInterface {
  readonly camera: THREE.Camera;
  readonly mouseVector: THREE.Vector2;
  readonly raycaster: THREE.Raycaster;
  readonly renderer: THREE.WebGLRenderer;
  private canvasHeight: number;
  private canvasOffsetLeft: number;
  private canvasOffsetTop: number;
  private canvasWidth: number;

  constructor(renderer: THREE.WebGLRenderer, camera: THREE.Camera) {
    autoBind(this);

    this.camera = camera;
    this.canvasHeight = 0;
    this.canvasOffsetLeft = 0;
    this.canvasOffsetTop = 0;
    this.canvasWidth = 0;
    this.mouseVector = new THREE.Vector2(-1, -1);
    this.raycaster = new THREE.Raycaster();
    this.renderer = renderer;
  }

  disconnect(): void {
    this.renderer.domElement.removeEventListener("mousedown", this.onMouseChange);
    this.renderer.domElement.removeEventListener("mousemove", this.onMouseChange);
  }

  getCameraRaycaster(): THREE.Raycaster {
    return this.raycaster;
  }

  observe(): void {
    this.renderer.domElement.addEventListener("mousedown", this.onMouseChange, {
      capture: true,
      passive: true,
    });
    this.renderer.domElement.addEventListener("mousemove", this.onMouseChange, {
      capture: true,
      passive: true,
    });
  }

  onMouseChange(evt: MouseEvent): void {
    const relativeX = evt.clientX - this.canvasOffsetLeft;
    const relativeY = evt.clientY - this.canvasOffsetTop;

    this.mouseVector.x = (relativeX / this.canvasWidth) * 2 - 1;
    this.mouseVector.y = -1 * (relativeY / this.canvasHeight) * 2 + 1;
  }

  resize(elementSize: ElementSizeInterface<"px">): void {
    const boundingRect = this.renderer.domElement.getBoundingClientRect();

    this.canvasHeight = elementSize.getHeight();
    this.canvasOffsetLeft = boundingRect.left;
    this.canvasOffsetTop = boundingRect.top;
    this.canvasWidth = elementSize.getWidth();
  }

  update(delta: number): void {
    // this.raycaster.setFromCamera(this.mouseVector, this.camera);
  }
}