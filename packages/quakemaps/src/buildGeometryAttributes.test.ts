import { buildGeometryAttributes } from "./buildGeometryAttributes";
import { unmarshalHalfSpace } from "./unmarshalHalfSpace";

test.skip("geometry attributes are created", async function () {
  const halfSpaces = [
    unmarshalHalfSpace("test", 0, "( -64 -64 -16 ) ( -64 -63 -16 ) ( -64 -64 -15 ) __TB_empty 0 0 0 1 1"),
    unmarshalHalfSpace("test", 0, "( -64 -64 -16 ) ( -64 -64 -15 ) ( -63 -64 -16 ) __TB_empty 0 0 0 1 1"),
    unmarshalHalfSpace("test", 0, "( -64 -64 -16 ) ( -63 -64 -16 ) ( -64 -63 -16 ) __TB_empty 0 0 0 1 1"),
    unmarshalHalfSpace("test", 0, "( 64 64 16 ) ( 64 65 16 ) ( 65 64 16 ) __TB_empty 0 0 0 1 1"),
    unmarshalHalfSpace("test", 0, "( 64 64 16 ) ( 65 64 16 ) ( 64 64 17 ) __TB_empty 0 0 0 1 1"),
    unmarshalHalfSpace("test", 0, "( 64 64 16 ) ( 64 64 17 ) ( 64 65 16 ) __TB_empty 0 0 0 1 1"),
  ];
  const brush = {
    halfSpaces: halfSpaces,
  };

  const geometryAttributes = buildGeometryAttributes(
    function (textureName: string) {
      return {
        atlasLeft: 0,
        atlasTop: 0,
        height: 128,
        uvStartU: 0,
        uvStartV: 0,
        uvStopU: 0,
        uvStopV: 0,
        width: 128,
      };
    },
    [brush]
  );

  // Then we list all the data needed for the cube.
  // Remember again that if a vertex has any unique parts it has to be a
  // separate vertex. As such to make a cube requires 36 vertices.
  // 2 triangles per face, 3 vertices per triangle, 6 faces = 36 vertices.
  expect(geometryAttributes.position).toHaveLength(36);
});
