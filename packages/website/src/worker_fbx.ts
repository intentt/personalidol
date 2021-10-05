/// <reference lib="webworker" />

import Loglevel from "loglevel";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader";

import { attachMultiRouter } from "@personalidol/framework/src/attachMultiRouter";
import { createReusedResponsesCache } from "@personalidol/framework/src/createReusedResponsesCache";
import { createReusedResponsesUsage } from "@personalidol/framework/src/createReusedResponsesUsage";
import { createRouter } from "@personalidol/framework/src/createRouter";
import { extractGeometryAttributes } from "@personalidol/framework/src/extractGeometryAttributes";
import { Progress } from "@personalidol/framework/src/Progress";
import { reuseResponse } from "@personalidol/framework/src/reuseResponse";

import type { Mesh } from "three/src/objects/Mesh";
import type { Object3D as IObject3D } from "three/src/core/Object3D";
import type { FBXLoader as IFBXLoader } from "three/examples/jsm/loaders/FBXLoader";

import type { GeometryAttributes } from "@personalidol/framework/src/GeometryAttributes.type";
import type { MessageWorkerReady } from "@personalidol/framework/src/MessageWorkerReady.type";
import type { ReusedResponse } from "@personalidol/framework/src/ReusedResponse.type";
import type { ReusedResponsesCache } from "@personalidol/framework/src/ReusedResponsesCache.type";
import type { ReusedResponsesUsage } from "@personalidol/framework/src/ReusedResponsesUsage.type";
import type { RPCMessage } from "@personalidol/framework/src/RPCMessage.type";

declare var self: DedicatedWorkerGlobalScope;

type ModelLoadRequest = RPCMessage & {
  model_name: string;
  model_scale: number;
};

const logger = Loglevel.getLogger(self.name);

logger.setLevel(__LOG_LEVEL);
logger.debug(`WORKER_SPAWNED(${self.name})`);

const emptyTransferables: [] = [];
const loadingCache: ReusedResponsesCache = createReusedResponsesCache();
const loadingUsage: ReusedResponsesUsage = createReusedResponsesUsage();

const _fbxLoader: IFBXLoader = new FBXLoader();

let _progressMessagePort: null | MessagePort = null;

function _fbxLoadWithProgress(url: string, modelScale: number): Promise<GeometryAttributes> {
  if (null === _progressMessagePort) {
    throw new Error(`Progress message port must be set in WORKER(${self.name}) before loading FBX model.`);
  }

  const progress = Progress(_progressMessagePort, "model", url);

  return progress.wait(
    _fbxLoader
      .loadAsync(url, function (evt: ProgressEvent) {
        progress.progress(evt.loaded, evt.total);
      })
      .then(function (loaded: IObject3D) {
        return extractGeometryAttributes(loaded, function (mesh: Mesh) {
          mesh.geometry.rotateX((-1 * Math.PI) / 2);
          mesh.geometry.rotateY(Math.PI / 2);
          mesh.geometry.scale(modelScale, modelScale, modelScale);
          // Trenchbroom entity offset.
          mesh.geometry.translate(0, -24, 0);
        });
      })
  );
}

async function _loadGeometry(messagePort: MessagePort, rpc: string, url: string, modelName: string, modelScale: number): Promise<void> {
  const geometry: ReusedResponse<GeometryAttributes> = await reuseResponse(loadingCache, loadingUsage, url, url, function (url: string) {
    return _fbxLoadWithProgress(url, modelScale);
  });

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

const fbxMessagesRouter = Object.freeze({
  async load(messagePort: MessagePort, { model_name, model_scale, rpc }: ModelLoadRequest) {
    await _loadGeometry(messagePort, rpc, `${__ASSETS_BASE_PATH}/models/model-fbx-${model_name}/model.fbx?${__CACHE_BUST}`, model_name, model_scale);
  },
});

self.onmessage = createRouter({
  fbxMessagePort(port: MessagePort): void {
    attachMultiRouter(port, fbxMessagesRouter);
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
