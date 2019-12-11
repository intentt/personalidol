// @flow

import * as THREE from "three";
import autoBind from "auto-bind";

import CanvasView from "../CanvasView";
import disposeObject3D from "../../helpers/disposeObject3D";
import QuakeBrushGeometry from "../QuakeBrushGeometry";

import type { Group, Mesh } from "three";

import type { CancelToken } from "../../interfaces/CancelToken";
import type { CanvasViewBag } from "../../interfaces/CanvasViewBag";
import type { QuakeBrush as QuakeBrushInterface } from "../../interfaces/QuakeBrush";
import type { TextureLoader } from "../../interfaces/TextureLoader";

export default class QuakeBrush extends CanvasView {
  +brush: QuakeBrushInterface;
  +group: Group;
  +textureLoader: TextureLoader;
  mesh: ?Mesh;

  constructor(canvasViewBag: CanvasViewBag, brush: QuakeBrushInterface, group: Scene, textureLoader: TextureLoader) {
    super(canvasViewBag);
    autoBind(this);

    this.brush = brush;
    this.mesh = null;
    this.group = group;
    this.textureLoader = textureLoader;
  }

  async attach(cancelToken: CancelToken): Promise<void> {
    await super.attach(cancelToken);

    const textures = this.brush.getTextures();

    for (let texture of textures) {
      if ("__TB_empty" !== texture) {
        this.textureLoader.registerTexture(texture, `${texture}.png`);
      }
    }

    const quakeBrushGeometry = new QuakeBrushGeometry(this.brush);
    const geometry = quakeBrushGeometry.getGeometry(textures);
    const loadedTextures = await this.textureLoader.loadTextures(cancelToken, textures);

    const mesh = new THREE.Mesh(
      geometry,
      loadedTextures.map(texture => {
        return new THREE.MeshLambertMaterial({
          map: texture,
        });
      })
    );

    mesh.castShadow = true;
    mesh.receiveShadow = true;

    this.mesh = mesh;
    this.group.add(mesh);
  }

  async dispose(cancelToken: CancelToken): Promise<void> {
    await super.dispose(cancelToken);

    const mesh = this.mesh;

    if (!mesh) {
      return;
    }

    disposeObject3D(mesh, false);
    this.group.remove(mesh);
  }
}
