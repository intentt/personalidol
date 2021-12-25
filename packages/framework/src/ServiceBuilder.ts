import { generateUUID } from "../../math/src/generateUUID";
import { name } from "./name";

import type { ArgumentCallback } from "./ArgumentCallback.type";
import type { Nameable } from "./Nameable.interface";
import type { ServiceBuilder as IServiceBuilder } from "./ServiceBuilder.interface";

export function ServiceBuilder<D>(debugName: string, dependencies: Partial<D>): IServiceBuilder<D> {
  const nameable: Nameable = Object.freeze({
    id: generateUUID(),
    name: `ServiceBuilder("${debugName}")`,
  });
  const onready: Set<ArgumentCallback<D>> = new Set();
  const _pendingKeys: Set<keyof D> = new Set(Object.keys(dependencies) as Array<keyof D>);

  function _isCompleted(partialDependencies: Partial<D>): partialDependencies is D {
    return 0 === _pendingKeys.size;
  }

  function _notifyReady(callback: ArgumentCallback<D>): void {
    if (!_isCompleted(dependencies)) {
      throw new Error(
        `${name(nameable)}: There was an attempt to notify ready state, but dependencies are not completed.`
      );
    }

    callback(dependencies);
  }

  function _onDependenciesChanged(): void {
    if (!_isCompleted(dependencies)) {
      return;
    }

    onready.forEach(_notifyReady);
    onready.clear();
  }

  function isReady(): boolean {
    return _isCompleted(dependencies);
  }

  function setDependency<K extends keyof D>(key: K, dependency: D[K]): void {
    if (!dependencies.hasOwnProperty(key)) {
      throw new Error(
        `${name(nameable)}: "${key}" is not a dependency. Expected any of: "${Object.keys(dependencies).join('", "')}."`
      );
    }

    if (!_pendingKeys.has(key)) {
      throw new Error(`${name(nameable)}: Dependency is already set: "${key}"`);
    }

    _pendingKeys.delete(key);
    dependencies[key] = dependency;

    _onDependenciesChanged();
  }

  return Object.freeze({
    dependencies: dependencies,
    id: nameable.id,
    name: nameable.name,
    onready: onready,

    isReady: isReady,
    setDependency: setDependency,
  });
}
