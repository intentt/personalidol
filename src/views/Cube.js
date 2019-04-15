// @flow

import * as THREE from "three";

import type { CanvasView } from "../framework/interfaces/CanvasView";
import type { ExceptionHandler } from "../framework/interfaces/ExceptionHandler";
import type { LoggerBreadcrumbs } from "../framework/interfaces/LoggerBreadcrumbs";
import type { THREELoadingManager } from "../framework/interfaces/THREELoadingManager";

export default class Cube implements CanvasView {
  +geometry: THREE.Geometry;
  +material: THREE.Material;
  +mesh: THREE.Mesh;
  +texture: THREE.Texture;
  +threeLoadingManager: THREELoadingManager;
  +scene: THREE.Scene;

  constructor(
    exceptionHandler: ExceptionHandler,
    loggerBreadcrumbs: LoggerBreadcrumbs,
    scene: THREE.Scene,
    threeLoadingManager: THREELoadingManager
  ) {
    this.scene = scene;

    this.geometry = new THREE.BoxGeometry(2, 2, 2);
    this.texture = new THREE.TextureLoader(
      threeLoadingManager.getLoadingManager()
    ).load("/assets/texture-blood-marble-512.png");
    this.material = new THREE.MeshPhongMaterial({
      map: this.texture
    });

    this.mesh = new THREE.Mesh(this.geometry, this.material);
    this.mesh.position.set(0, 2, 0);
  }

  async attach(renderer: THREE.WebGLRenderer): Promise<void> {
    this.scene.add(this.mesh);
  }

  async detach(renderer: THREE.WebGLRenderer): Promise<void> {
    this.scene.remove(this.mesh);

    this.geometry.dispose();
    this.material.dispose();
    this.texture.dispose();
  }

  async start(): Promise<void> {}

  async stop(): Promise<void> {}

  begin(): void {}

  update(delta: number): void {
    this.mesh.rotation.x += 0.01;
    this.mesh.rotation.y += 0.02;
  }
}
