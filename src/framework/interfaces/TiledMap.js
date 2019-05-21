// @flow

import type { CancelToken } from "./CancelToken";
import type { ElementSize } from "./ElementSize";
import type { Equatable } from "./Equatable";
import type { JsonSerializable } from "./JsonSerializable";
import type { TiledCustomProperty } from "./TiledCustomProperty";
import type { TiledMapEllipseObject } from "./TiledMapEllipseObject";
import type { TiledMapLayer } from "./TiledMapLayer";
import type { TiledMapPolygonObject } from "./TiledMapPolygonObject";
import type { TiledMapRectangleObject } from "./TiledMapRectangleObject";
import type { TiledMapSerializedObject } from "../types/TiledMapSerializedObject";
import type { TiledMapSkinnedLayer } from "./TiledMapSkinnedLayer";
import type { TiledTileset } from "./TiledTileset";

export interface TiledMap extends Equatable<TiledMap>, JsonSerializable<TiledMapSerializedObject> {
  addLayer(TiledMapLayer): void;

  addEllipseObject(TiledMapEllipseObject): void;

  addPolygonObject(TiledMapPolygonObject): void;

  addRectangleObject(TiledMapRectangleObject): void;

  generateSkinnedLayers(CancelToken): AsyncGenerator<TiledMapSkinnedLayer, void, void>;

  getLayers(): $ReadOnlyArray<TiledMapLayer>;

  getLayerWithProperty(TiledCustomProperty): TiledMapLayer;

  getMapSize(): ElementSize<"tile">;

  getEllipseObjects(): $ReadOnlyArray<TiledMapEllipseObject>;

  getPolygonObjects(): $ReadOnlyArray<TiledMapPolygonObject>;

  getRectangleObjects(): $ReadOnlyArray<TiledMapRectangleObject>;

  getTileSize(): ElementSize<"px">;

  getTiledTileset(): TiledTileset;

  hasLayerWithProperty(TiledCustomProperty): boolean;
}
