import * as THREE from "three";

import CanvasView from "src/framework/classes/CanvasView";
import { default as GLTFModelQuery } from "src/framework/classes/Query/GLTFModel";
import { default as QuakeMapException } from "src/framework/classes/Exception/QuakeMap";
import { default as TextureQuery } from "src/framework/classes/Query/Texture";

import { CancelToken } from "src/framework/interfaces/CancelToken";
import { CanvasViewBag } from "src/framework/interfaces/CanvasViewBag";
import { LoggerBreadcrumbs } from "src/framework/interfaces/LoggerBreadcrumbs";
import { QuakeWorkerGLTFModel } from "src/framework/types/QuakeWorkerGLTFModel";
import { QueryBus } from "src/framework/interfaces/QueryBus";

function getMesh(loggerBreadcrumbs: LoggerBreadcrumbs, scene: THREE.Scene): THREE.Mesh {
  for (let child of scene.children) {
    if (child instanceof THREE.Mesh) {
      return child;
    }
  }

  throw new QuakeMapException(loggerBreadcrumbs, "Could not find mesh.");
}

export default class GLTFModel extends CanvasView {
  readonly animationOffset: number;
  readonly baseUrl: string;
  readonly entities: ReadonlyArray<QuakeWorkerGLTFModel>;
  readonly group: THREE.Group;
  readonly loggerBreadcrumbs: LoggerBreadcrumbs;
  readonly queryBus: QueryBus;
  readonly texture: string;
  readonly threeLoadingManager: THREE.LoadingManager;

  constructor(
    loggerBreadcrumbs: LoggerBreadcrumbs,
    canvasViewBag: CanvasViewBag,
    queryBus: QueryBus,
    group: THREE.Group,
    threeLoadingManager: THREE.LoadingManager,
    baseUrl: string,
    texture: string,
    animationOffset: number,
    entities: ReadonlyArray<QuakeWorkerGLTFModel>
  ) {
    super(canvasViewBag);

    this.animationOffset = animationOffset;
    this.baseUrl = baseUrl;
    this.entities = entities;
    this.group = group;
    this.loggerBreadcrumbs = loggerBreadcrumbs;
    this.queryBus = queryBus;
    this.texture = texture;
    this.threeLoadingManager = threeLoadingManager;
  }

  async attach(cancelToken: CancelToken): Promise<void> {
    await super.attach(cancelToken);

    const modelQuery = new GLTFModelQuery(this.threeLoadingManager, this.baseUrl, `${this.baseUrl}model.glb`);
    const response = await this.queryBus.enqueue(cancelToken, modelQuery).whenExecuted();

    const textureQuery = new TextureQuery(new THREE.TextureLoader(this.threeLoadingManager), `${this.baseUrl}${this.texture}`);
    const texture = await this.queryBus.enqueue(cancelToken, textureQuery).whenExecuted();

    const baseMesh = getMesh(this.loggerBreadcrumbs.add("attach"), response.scene);
    const boundingBox = new THREE.Box3();

    // @ts-ignore
    boundingBox.setFromBufferAttribute(baseMesh.geometry.attributes.position);

    const material = new THREE.MeshPhongMaterial({
      map: texture,
    });

    // important - clone geometry as it may be shared between views
    const geometry = baseMesh.geometry.clone();
    const origins: THREE.Vector3[] = [];

    const mesh = new THREE.InstancedMesh(geometry, material, this.entities.length);

    mesh.matrixAutoUpdate = false;

    const dummy = new THREE.Object3D();

    for (let i = 0; i < this.entities.length; i += 1) {
      const entity = this.entities[i];

      dummy.position.set(entity.origin[0], entity.origin[1], entity.origin[2]);
      dummy.rotation.set(0, THREE.Math.degToRad(-1 * entity.angle), 0);
      dummy.scale.set(entity.scale, entity.scale, entity.scale);
      dummy.updateMatrix();

      mesh.setMatrixAt(i, dummy.matrix);

      origins.push(new THREE.Vector3().fromArray(entity.origin));
    }

    // manually set bounding sphere, otherwise there will be problems with
    // frustum culling
    geometry.boundingSphere = new THREE.Sphere().setFromPoints(origins);

    mesh.castShadow = true;
    mesh.receiveShadow = true;

    // adjust mesh position to compensate Trenchbroom offset
    // model "brick" size is defined in .fgd file
    mesh.position.set(8, -24, 8);

    mesh.instanceMatrix.needsUpdate = true;
    mesh.updateMatrix();

    this.children.add(mesh);
    this.group.add(this.children);
  }
}