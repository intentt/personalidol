/// <reference lib="webworker" />

import Loglevel from "loglevel";

import { attachMultiRouter } from "../../framework/src/attachMultiRouter";
import { buildEntities } from "../../personalidol/src/buildEntities";
import { buildGeometryAttributes } from "../../quakemaps/src/buildGeometryAttributes";
import { createRouter } from "../../framework/src/createRouter";
import { createRPCLookupTable } from "../../framework/src/createRPCLookupTable";
import { generateUUID } from "../../math/src/generateUUID";
import { getI18NextKeyNamespace } from "../../i18n/src/getI18NextKeyNamespace";
import { handleRPCResponse } from "../../framework/src/handleRPCResponse";
import { monitorResponseProgress } from "../../framework/src/monitorResponseProgress";
import { Progress } from "../../framework/src/Progress";
import { sendRPCMessage } from "../../framework/src/sendRPCMessage";
import { unmarshalMap } from "../../quakemaps/src/unmarshalMap";

import type { AnyEntity } from "../../personalidol/src/AnyEntity.type";
import type { AtlasResponse } from "../../texture-loader/src/AtlasResponse.type";
import type { AtlasTextureDimension } from "../../texture-loader/src/AtlasTextureDimension.type";
import type { Brush } from "../../quakemaps/src/Brush.type";
import type { EntitySketch } from "../../quakemaps/src/EntitySketch.type";
import type { Geometry } from "../../quakemaps/src/Geometry.type";
import type { MessageWorkerReady } from "../../framework/src/MessageWorkerReady.type";
import type { Progress as IProgress } from "../../framework/src/Progress.interface";
import type { RPCLookupTable } from "../../framework/src/RPCLookupTable.type";
import type { RPCMessage } from "../../framework/src/RPCMessage.type";

declare var self: DedicatedWorkerGlobalScope;

type UnmarshalRequest = RPCMessage & {
  filename: string;
  rpc: string;
};

const logger = Loglevel.getLogger(self.name);

logger.setLevel(__LOG_LEVEL);
logger.debug(`WORKER_SPAWNED(${self.name})`);

const _rpcLookupTable: RPCLookupTable = createRPCLookupTable();
let _atlasMessagePort: null | MessagePort = null;
let _progressMessagePort: null | MessagePort = null;

const _atlasMessageRouter = createRouter({
  textureAtlas: handleRPCResponse(_rpcLookupTable),
});

function _estimateResourcesToLoad(
  entitySketches: ReadonlyArray<EntitySketch>,
  textureUrls: ReadonlyArray<string>
): number {
  const resources: {
    [key: string]: boolean;
  } = {};

  for (let entitySketch of entitySketches) {
    const label = entitySketch.properties.label;

    if ("string" === typeof label) {
      resources[`translations_${getI18NextKeyNamespace(label)}`] = true;
    }

    switch (entitySketch.properties.classname) {
      case "model_gltf":
        resources[`gltf_model_${entitySketch.properties.model_name}`] = true;
        resources[`gltf_texture_${entitySketch.properties.model_name}_${entitySketch.properties.model_texture}`] = true;
        break;
      case "model_md2":
        resources[`md2_model_${entitySketch.properties.model_name}`] = true;
        resources[`md2_model_parts_${entitySketch.properties.model_name}`] = true;
        resources[`md2_model_skin_${entitySketch.properties.model_name}_${entitySketch.properties.skin}`] = true;
        break;
      case "player":
        resources["player_model"] = true;
        resources["player_model_parts"] = true;
        resources["player_model_skin"] = true;
        break;
    }
  }

  return Object.keys(resources).length + textureUrls.length;
}

async function _fetchUnmarshalMapContent(
  progress: IProgress,
  messagePort: MessagePort,
  atlasMessagePort: MessagePort,
  progressMessagePort: MessagePort,
  filename: string,
  rpc: string
): Promise<void> {
  const content: string = await fetch(filename)
    .then(monitorResponseProgress(progress.progress, true))
    .then(_responseToText);

  return _onMapContentLoaded(progress, messagePort, atlasMessagePort, progressMessagePort, filename, rpc, content);
}

async function _onMapContentLoaded(
  progress: IProgress,
  messagePort: MessagePort,
  atlasMessagePort: MessagePort,
  progressMessagePort: MessagePort,
  filename: string,
  rpc: string,
  content: string
): Promise<void> {
  const entities: Array<AnyEntity> = [];
  const textureUrls: Array<string> = [];
  const transferables: Array<Transferable> = [];
  let textureAtlas: null | AtlasResponse = null;

  function _resolveTextureDimensions(textureName: string): AtlasTextureDimension {
    if (!textureAtlas) {
      throw new Error(`WORKER(${self.name}) texture atlas is not initialized.`);
    }

    if (!textureAtlas.textureDimensions.hasOwnProperty(textureName)) {
      throw new Error(
        `WORKER(${self.name}) received unexpected texture dimensions resolve request. Texture is not included in the texture atlas: "${textureName}"`
      );
    }

    return textureAtlas.textureDimensions[textureName];
  }

  function _resolveTextureUrl(textureName: string): string {
    const textureUrl = `${__ASSETS_BASE_PATH}/${textureName}.png?${__CACHE_BUST}`;

    if (!textureUrls.includes(textureUrl)) {
      textureUrls.push(textureUrl);
    }

    return textureUrl;
  }

  function _buildGeometryAttributes(brushes: Array<Brush>): Geometry {
    return buildGeometryAttributes(_resolveTextureDimensions, brushes);
  }

  const entitySketches: Array<EntitySketch> = Array.from(unmarshalMap(filename, content, _resolveTextureUrl));

  progressMessagePort.postMessage({
    expect: _estimateResourcesToLoad(entitySketches, textureUrls),
  });

  const response: {
    createTextureAtlas: AtlasResponse;
  } = await sendRPCMessage(_rpcLookupTable, atlasMessagePort, {
    createTextureAtlas: {
      textureUrls: textureUrls,
      rpc: generateUUID(),
    },
  });

  textureAtlas = response.createTextureAtlas;
  transferables.push(textureAtlas.imageDataBuffer);

  for (let entity of buildEntities(filename, entitySketches, _buildGeometryAttributes)) {
    entities.push(entity);
    transferables.push(...entity.transferables);
  }

  messagePort.postMessage(
    {
      map: {
        entities: entities,
        rpc: rpc,
        textureAtlas: textureAtlas,
      },
    },
    transferables
  );
}

function _responseToText(response: Response): Promise<string> {
  return response.text();
}

const quakeMapsMessagesRouter = {
  unmarshal(messagePort: MessagePort, { filename, rpc }: UnmarshalRequest): void {
    if (null === _atlasMessagePort) {
      throw new Error(`Atlas message port must be set in WORKER(${self.name}) before loading map.`);
    }

    if (null === _progressMessagePort) {
      throw new Error(`Progress message port must be set in WORKER(${self.name}) before loading map.`);
    }

    const progress = Progress(_progressMessagePort, "map", filename);

    progress.wait(
      _fetchUnmarshalMapContent(progress, messagePort, _atlasMessagePort, _progressMessagePort, filename, rpc)
    );
  },
};

self.onmessage = createRouter({
  quakeMapsMessagePort(port: MessagePort): void {
    attachMultiRouter(port, quakeMapsMessagesRouter);
  },

  atlasMessagePort(port: MessagePort): void {
    if (null !== _atlasMessagePort) {
      throw new Error(`Atlas message port was already received by WORKER(${self.name}).`);
    }

    _atlasMessagePort = port;
    _atlasMessagePort.onmessage = _atlasMessageRouter;
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
