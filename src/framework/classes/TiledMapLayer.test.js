// @flow

import ElementSize from "./ElementSize";
import LoggerBreadcrumbs from "./LoggerBreadcrumbs";
import TiledCustomProperties from "./TiledCustomProperties";
import TiledMapGrid from "./TiledMapGrid";
import TiledMapLayer from "./TiledMapLayer";
import TiledMapLayerUnserializer from "./TiledMapLayerUnserializer";

it("is equatable", function() {
  const loggerBreadcrumbs = new LoggerBreadcrumbs();
  const tiledMapLayer1 = new TiledMapLayer(
    "test",
    new TiledMapGrid([[1, 1], [1, 1]], new ElementSize<"tile">(2, 2)),
    new ElementSize<"tile">(20, 20),
    new TiledCustomProperties(loggerBreadcrumbs)
  );
  const tiledMapLayer2 = new TiledMapLayer(
    "test",
    new TiledMapGrid([[1, 1], [1, 2]], new ElementSize<"tile">(2, 2)),
    new ElementSize<"tile">(20, 20),
    new TiledCustomProperties(loggerBreadcrumbs)
  );

  expect(tiledMapLayer1.isEqual(tiledMapLayer2)).toBe(false);
});

it("is serializable as JSON", function() {
  const loggerBreadcrumbs = new LoggerBreadcrumbs();
  const tiledMapLayer = new TiledMapLayer(
    "test",
    new TiledMapGrid([[1, 1], [1, 1]], new ElementSize<"tile">(2, 2)),
    new ElementSize<"tile">(20, 20),
    new TiledCustomProperties(loggerBreadcrumbs)
  );

  const serialized = tiledMapLayer.asJson();
  const unserializer = new TiledMapLayerUnserializer(loggerBreadcrumbs);
  const unserialized = unserializer.fromJson(serialized);

  expect(tiledMapLayer.isEqual(unserialized)).toBe(true);
});
