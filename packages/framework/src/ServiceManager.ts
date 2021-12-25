import { generateUUID } from "../../math/src/generateUUID";
import { name } from "./name";

import type { Logger } from "loglevel";

import type { MainLoopUpdatableState } from "./MainLoopUpdatableState.type";
import type { Service } from "./Service.interface";
import type { ServiceManager as IServiceManager } from "./ServiceManager.interface";

export function ServiceManager(logger: Logger): IServiceManager {
  const state: MainLoopUpdatableState = Object.seal({
    needsUpdates: true,
  });

  const services = new Set<Service>();
  const _startedServices = new WeakSet<Service>();
  let _isStarted = false;

  function start(): void {
    if (_isStarted) {
      throw new Error("Service manager is already started.");
    }

    _isStarted = true;
    services.forEach(_startService);
  }

  function stop(): void {
    if (!_isStarted) {
      throw new Error("Service manager is already stopped.");
    }

    _isStarted = false;
    services.forEach(_stopService);
  }

  function update(): void {
    // handle adding/removing services while the app is already started
    services.forEach(_updateService);
  }

  function _startService(service: Service): void {
    logger.debug(`SERVICE.START(${name(service)})`);

    service.start();
    _startedServices.add(service);
  }

  function _stopService(service: Service): void {
    logger.debug(`SERVICE.STOP(${name(service)})`);

    service.stop();
    _startedServices.delete(service);
  }

  function _updateService(service: Service): void {
    if (_isStarted && !_startedServices.has(service)) {
      return void _startService(service);
    }

    if (!_isStarted && _startedServices.has(service)) {
      return void _stopService(service);
    }
  }

  return Object.freeze({
    id: generateUUID(),
    name: "ServiceManager",
    services: services,
    state: state,

    start: start,
    stop: stop,
    update: update,
  });
}
