import Loglevel from "loglevel";

import { AtlasService } from "@personalidol/texture-loader/src/AtlasService";
import { createRouter } from "@personalidol/workers/src/createRouter";
import { MainLoop } from "@personalidol/framework/src/MainLoop";
import { RequestAnimationFrameScheduler } from "@personalidol/framework/src/RequestAnimationFrameScheduler";
import { ServiceManager } from "@personalidol/framework/src/ServiceManager";

import type { AtlasService as IAtlasService } from "@personalidol/texture-loader/src/AtlasService.interface";

let _atlasService: null | IAtlasService = null;
let _canvas: null | OffscreenCanvas = null;
let _context2d: null | OffscreenCanvasRenderingContext2D = null;
let _texturesMessagePort: null | MessagePort = null;

const logger = Loglevel.getLogger(self.name);

logger.setLevel(__LOG_LEVEL);
logger.debug(`WORKER_SPAWNED(${self.name})`);

const mainLoop = MainLoop(RequestAnimationFrameScheduler());
const serviceManager = ServiceManager(logger);

mainLoop.updatables.add(serviceManager);

function _safeStartService() {
  if (null === _canvas || null === _context2d || null === _texturesMessagePort) {
    return;
  }

  _atlasService = AtlasService(_canvas, _context2d, _texturesMessagePort);

  mainLoop.updatables.add(_atlasService);
  serviceManager.services.add(_atlasService);
}

self.onmessage = createRouter({
  atlasCanvas(canvas: OffscreenCanvas) {
    if (null !== _canvas) {
      throw new Error("Offscreen canvas was already received by the atlas worker.");
    }

    const context2d = canvas.getContext("2d");

    if (!context2d) {
      throw new Error("Unable to obtain 2D context from the offscreen atlas canvas");
    }

    _canvas = canvas;
    _context2d = context2d;
    _safeStartService();
  },

  atlasMessagePort(port: MessagePort) {
    if (null === _atlasService) {
      throw new Error("Atlas service is not yet initialized.");
    }

    _atlasService.registerMessagePort(port);
  },

  start(): void {
    mainLoop.start();
    serviceManager.start();
  },

  stop(): void {
    mainLoop.stop();
    serviceManager.stop();
  },

  texturesMessagePort(messagePort: MessagePort) {
    if (null !== _texturesMessagePort) {
      throw new Error("Textures message port was already received by the atlas worker.");
    }

    _texturesMessagePort = messagePort;
    _safeStartService();
  },
});
