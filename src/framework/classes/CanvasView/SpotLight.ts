import * as THREE from "three";

import CanvasView from "src/framework/classes/CanvasView";

import { CancelToken } from "src/framework/interfaces/CancelToken";
import { CanvasViewBag } from "src/framework/interfaces/CanvasViewBag";
import { QuakeWorkerLightSpotlight } from "src/framework/types/QuakeWorkerLightSpotlight";

export default class SpotLight extends CanvasView {
  readonly color: THREE.Color;
  readonly group: THREE.Group;
  readonly light: THREE.SpotLight;

  constructor(canvasViewBag: CanvasViewBag, group: THREE.Group, entity: QuakeWorkerLightSpotlight) {
    super(canvasViewBag);

    this.color = new THREE.Color(parseInt(entity.color, 16));
    this.group = group;

    this.light = new THREE.SpotLight(this.color.getHex(), entity.intensity);
    this.light.position.set(entity.origin[0], entity.origin[1], entity.origin[2]);
    this.light.target.position.set(entity.origin[0], 0, entity.origin[2]);

    this.light.angle = 1;
    this.light.decay = entity.decay;
    this.light.distance = 512;
    this.light.penumbra = 1;
    this.light.castShadow = true;
    this.light.shadow.camera.far = 512;
  }

  async attach(cancelToken: CancelToken): Promise<void> {
    await super.attach(cancelToken);

    this.group.add(this.light);
    this.group.add(this.light.target);
  }

  async dispose(cancelToken: CancelToken): Promise<void> {
    await super.dispose(cancelToken);

    this.group.remove(this.light);
    this.group.remove(this.light.target);
  }
}