import { Loader } from "three/src/loaders/Loader";

import { requestTexture } from "@personalidol/texture-loader/src/requestTexture";

import type { LoadingManager } from "three/src/loaders/LoadingManager";
import type { Logger } from "loglevel";
import type { Texture as ITexture } from "three/src/textures/Texture";

import type { RPCLookupTable } from "@personalidol/framework/src/RPCLookupTable.type";

export class THREETextureLoader extends Loader {
  logger: Logger;
  rpcLookupTable: RPCLookupTable;
  texturesMessagePort: MessagePort;

  constructor(
    logger: Logger,
    manager: LoadingManager,
    rpcLookupTable: RPCLookupTable,
    texturesMessagePort: MessagePort
  ) {
    super(manager);

    this.logger = logger;
    this.rpcLookupTable = rpcLookupTable;
    this.texturesMessagePort = texturesMessagePort;
  }

  async load(
    url: string,
    onLoad?: (response: ITexture) => void,
    onProgress?: (request: ProgressEvent) => void,
    onError?: (error: any) => void
  ): Promise<void> {
    this.manager.itemStart(url);

    try {
      const texture: ITexture = await requestTexture<ITexture>(this.rpcLookupTable, this.texturesMessagePort, url);

      if (onLoad) {
        onLoad(texture);
      }
    } catch (err) {
      if (onError) {
        onError(err);
      }

      this.manager.itemError(url);
    } finally {
      this.manager.itemEnd(url);
    }
  }

  setOptions(options: any) {
    this.logger.warn("THREETextureLoader: options are ignored");

    return this;
  }
}
