import { Mesh } from "three/src/objects/Mesh";
import { MeshBasicMaterial } from "three/src/materials/MeshBasicMaterial";
import { OrthographicCamera } from "three/src/cameras/OrthographicCamera";
import { PlaneGeometry } from "three/src/geometries/PlaneGeometry";

import { disposableMaterial } from "../../../framework/src/disposableMaterial";

import type { BufferGeometry } from "three/src/core/BufferGeometry";
import type { Camera } from "three/src/cameras/Camera";
import type { Material } from "three/src/materials/Material";
import type { Mesh as IMesh } from "three/src/objects/Mesh";
import type { WebGLRenderer } from "three/src/renderers/WebGLRenderer";

import type { DisposableGeneric } from "../../../framework/src/DisposableGeneric.interface";

// Helper for passes that need to fill the viewport with a single quad.

export class FullScreenQuad implements DisposableGeneric {
  private _camera: Camera;
  private _geometry: BufferGeometry;
  private _mesh: IMesh;

  get material() {
    return this._mesh.material;
  }

  set material(value: Material | Material[]) {
    disposableMaterial(this._mesh.material)();
    this._mesh.material = value;
  }

  constructor(material: Material | Material[] = new MeshBasicMaterial()) {
    this._camera = new OrthographicCamera(-1, 1, 1, -1, 0, 1);
    this._geometry = new PlaneGeometry(2, 2);
    this._mesh = new Mesh(this._geometry, material);
  }

  dispose(): void {
    this._geometry.dispose();
  }

  render(renderer: WebGLRenderer) {
    renderer.render(this._mesh, this._camera);
  }
}
