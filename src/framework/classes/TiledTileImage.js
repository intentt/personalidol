// @flow

import type { ElementSize } from "../interfaces/ElementSize";
import type { TiledTileImage as TiledTileImageInterface } from "../interfaces/TiledTileImage";

export default class TiledTileImage implements TiledTileImageInterface {
  +elementSize: ElementSize<"px">;
  +source: string;

  constructor(source: string, elementSize: ElementSize<"px">): void {
    this.elementSize = elementSize;
    this.source = source;
  }

  getElementSize(): ElementSize<"px"> {
    return this.elementSize;
  }

  getSource(): string {
    return this.source;
  }

  isEqual(other: TiledTileImageInterface) {
    return this.getSource() === other.getSource() && this.getElementSize().isEqual(other.getElementSize());
  }
}
