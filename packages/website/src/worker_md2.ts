import { attachMultiRouter } from "@personalidol/workers/src/attachMultiRouter";
import { LoadingManager } from "three/src/loaders/LoadingManager";
import { reuseResponse } from "@personalidol/workers/src/reuseResponse";

import { createReusedResponsesCache } from "@personalidol/workers/src/createReusedResponsesCache";
import { createReusedResponsesUsage } from "@personalidol/workers/src/createReusedResponsesUsage";
import { createRouter } from "@personalidol/workers/src/createRouter";
import { MD2Loader } from "@personalidol/framework/src/MD2Loader";

import type { ReusedResponsesCache } from "@personalidol/workers/src/ReusedResponsesCache.type";
import type { ReusedResponsesUsage } from "@personalidol/workers/src/ReusedResponsesUsage.type";

type ModelParts = {
  body: string;
};

const emptyTransferables: [] = [];
const loadingCache: ReusedResponsesCache = createReusedResponsesCache();
const loadingUsage: ReusedResponsesUsage = createReusedResponsesUsage();

const loadingManager = new LoadingManager();
const md2Loader = new MD2Loader(loadingManager);
const md2LoadAsync = md2Loader.loadAsync.bind(md2Loader);

function responseToModelParts(response: Response): Promise<ModelParts> {
  return response.json() as Promise<ModelParts>;
}

function fetchModelParts(partsUrl: string): Promise<ModelParts> {
  return fetch(partsUrl).then(responseToModelParts);
}

const md2MessagesRouter = {
  async load(messagePort: MessagePort, { model_name, rpc }: { model_name: string; rpc: string }) {
    const partsUrl = `/models/model-md2-${model_name}/parts.json`;
    const parts = await reuseResponse(loadingCache, loadingUsage, partsUrl, partsUrl, fetchModelParts);

    const modelUrl = `/models/model-md2-${model_name}/${parts.data.body}`;
    const geometry = await reuseResponse(loadingCache, loadingUsage, modelUrl, modelUrl, md2LoadAsync);

    // prettier-ignore
    messagePort.postMessage(
      {
        geometry: {
          normals: geometry.data.normals,
          parts: parts.data,
          rpc: rpc,
          uvs: geometry.data.uvs,
          vertices: geometry.data.vertices,
        },
      },
      // Transfer everything to not use unnecessary memory.
      geometry.isLast
        ? [
            geometry.data.normals.buffer,
            geometry.data.uvs.buffer,
            geometry.data.vertices.buffer
          ]
        : emptyTransferables
    );
  },
};

self.onmessage = createRouter({
  md2MessagePort(port: MessagePort): void {
    attachMultiRouter(port, md2MessagesRouter);
  },
});