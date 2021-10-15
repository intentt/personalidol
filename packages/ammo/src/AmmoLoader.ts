/// <reference types="@types/ammo.js" />

import { must } from "@personalidol/framework/src/must";

import type { AmmoLoader as IAmmoLoader } from "./AmmoLoader.interface";

/**
 * Warning: this expects Ammo loader object in the global scope.
 */
export function AmmoLoader(wasmFilename: string): IAmmoLoader {
  function _locateFile(): string {
    return wasmFilename;
  }

  async function loadWASM(): Promise<typeof Ammo> {
    const Loaded = await (globalThis.Ammo as unknown as any)({
      locateFile: _locateFile,
    });

    return must(Loaded, "Unable to create AMMO.js instance.");
  }

  return Object.freeze({
    loadWASM: loadWASM,
  });
}
