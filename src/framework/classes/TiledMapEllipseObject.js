// @flow

import type { TiledMapBlockObject } from "../interfaces/TiledMapBlockObject";
import type { TiledMapEllipseObject as TiledMapEllipseObjectInterface } from "../interfaces/TiledMapEllipseObject";

export default class TiledMapEllipseObject implements TiledMapEllipseObjectInterface {
  +isEllipse: true;
  +isPolygon: false;
  +isRectangle: false;
  +tiledMapBlockObject: TiledMapBlockObject;

  isEllipse = true;
  isPolygon = false;
  isRectangle = false;

  constructor(tiledMapBlockObject: TiledMapBlockObject): void {
    const elementSize = tiledMapBlockObject.getElementSize();

    if (elementSize.getHeight() !== elementSize.getWidth()) {
      throw new Error("Ellipses are not supported. You have to use circles instead.");
    }

    this.tiledMapBlockObject = tiledMapBlockObject;
  }

  getTiledMapBlockObject(): TiledMapBlockObject {
    return this.tiledMapBlockObject;
  }

  isEqual(other: TiledMapEllipseObjectInterface): boolean {
    return this.getTiledMapBlockObject().isEqual(other.getTiledMapBlockObject());
  }
}
