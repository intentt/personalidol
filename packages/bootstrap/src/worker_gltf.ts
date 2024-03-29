/// <reference lib="webworker" />

import Loglevel from "loglevel";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";

import { attachMultiRouter } from "../../framework/src/attachMultiRouter";
import { createReusedResponsesCache } from "../../framework/src/createReusedResponsesCache";
import { createReusedResponsesUsage } from "../../framework/src/createReusedResponsesUsage";
import { createRouter } from "../../framework/src/createRouter";
import { disposableMaterial } from "../../framework/src/disposableMaterial";
import { findMesh } from "../../framework/src/findMesh";
import { isMesh } from "../../framework/src/isMesh";
import { Progress } from "../../framework/src/Progress";
import { reuseResponse } from "../../framework/src/reuseResponse";

import type { BufferAttribute } from "three/src/core/BufferAttribute";
import type { GLTF } from "three/examples/jsm/loaders/GLTFLoader";
import type { GLTFLoader as IGLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";

import type { GeometryAttributes } from "../../framework/src/GeometryAttributes.type";
import type { MessageWorkerReady } from "../../framework/src/MessageWorkerReady.type";
import type { ReusedResponse } from "../../framework/src/ReusedResponse.type";
import type { ReusedResponsesCache } from "../../framework/src/ReusedResponsesCache.type";
import type { ReusedResponsesUsage } from "../../framework/src/ReusedResponsesUsage.type";
import type { RPCMessage } from "../../framework/src/RPCMessage.type";

declare var self: DedicatedWorkerGlobalScope;

type ModelLoadRequest = RPCMessage & {
  model_filename: string;
  model_name: string;
  model_scale: number;
};

const logger = Loglevel.getLogger(self.name);

logger.setLevel(__LOG_LEVEL);
logger.debug(`WORKER_SPAWNED(${self.name})`);

const emptyTransferables: [] = [];
const loadingCache: ReusedResponsesCache = createReusedResponsesCache();
const loadingUsage: ReusedResponsesUsage = createReusedResponsesUsage();

const _gltfLoader: IGLTFLoader = new GLTFLoader();

let _progressMessagePort: null | MessagePort = null;

function _extractGLTFGeometryAttributes(url: string, gltf: GLTF, modelScale: number): GeometryAttributes {
  if (gltf.scene.children.length !== 1) {
    throw new Error("GLTF scene needs to contain exactly one child.");
  }

  const mesh: any = findMesh(gltf.scene);

  if (!isMesh(mesh)) {
    throw new Error("Unable to locate mesh in the GLTF model.");
  }

  // Materials are not needed here.
  disposableMaterial(mesh.material)();

  mesh.geometry.scale(modelScale, modelScale, modelScale);

  // Trenchbroom entity offset.
  mesh.geometry.translate(0, -24, 0);

  const indexAttribute: null | BufferAttribute = mesh.geometry.index;

  const index: null | Uint16Array = indexAttribute ? (indexAttribute.array as Uint16Array) : null;
  const normal: Float32Array = mesh.geometry.attributes.normal.array as Float32Array;
  const position: Float32Array = mesh.geometry.attributes.position.array as Float32Array;
  const uv: Float32Array = mesh.geometry.attributes.uv.array as Float32Array;

  const transferables: Array<ArrayBuffer> =
    normal.buffer === position.buffer ? [position.buffer, uv.buffer] : [normal.buffer, position.buffer, uv.buffer];
  if (index) {
    transferables.push(index.buffer);
  }

  return <GeometryAttributes>{
    index: index ? (index as Uint16Array) : null,
    normal: normal,
    position: position,
    uv: uv,

    transferables: transferables,
  };
}

function _gltfLoadWithProgress(url: string, modelScale: number): Promise<GeometryAttributes> {
  if (null === _progressMessagePort) {
    throw new Error(`Progress message port must be set in WORKER(${self.name}) before loading GLTF model.`);
  }

  const progress = Progress(_progressMessagePort, "model", url);

  return progress.wait(
    _gltfLoader
      .loadAsync(url, function (evt: ProgressEvent) {
        progress.progress(evt.loaded, evt.total);
      })
      .then(function (gltf: GLTF) {
        return _extractGLTFGeometryAttributes(url, gltf, modelScale);
      })
  );
}

async function _loadGeometry(
  messagePort: MessagePort,
  rpc: string,
  modelFilename: string,
  modelName: string,
  modelScale: number
): Promise<void> {
  const modelUrl = `${__ASSETS_BASE_PATH}/models/model-glb-${modelName}/${modelFilename}?${__CACHE_BUST}`;
  const geometry: ReusedResponse<GeometryAttributes> = await reuseResponse(
    loadingCache,
    loadingUsage,
    modelUrl,
    modelUrl,
    function (url: string) {
      return _gltfLoadWithProgress(url, modelScale);
    }
  );

  // prettier-ignore
  messagePort.postMessage(
    {
      geometry: <GeometryAttributes & RPCMessage>{
        index: geometry.data.index,
        normal: geometry.data.normal,
        position: geometry.data.position,
        rpc: rpc,
        uv: geometry.data.uv,
      },
    },
    // Transfer everything to not use unnecessary memory.
    geometry.isLast
      ? geometry.data.transferables
      : emptyTransferables
  );
}

const gltfMessagesRouter = {
  async load(messagePort: MessagePort, { model_filename, model_name, model_scale, rpc }: ModelLoadRequest) {
    await _loadGeometry(messagePort, rpc, model_filename, model_name, model_scale);
  },
};

self.onmessage = createRouter({
  gltfMessagePort(port: MessagePort): void {
    attachMultiRouter(port, gltfMessagesRouter);
  },

  progressMessagePort(port: MessagePort): void {
    if (null !== _progressMessagePort) {
      throw new Error(`Progress message port was already received by WORKER(${self.name}).`);
    }

    _progressMessagePort = port;
  },

  ready(): void {
    self.postMessage(<MessageWorkerReady>{
      ready: true,
    });
  },
});
