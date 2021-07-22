import { buildGeometryAttributes } from "@personalidol/quakemaps/src/buildGeometryAttributes";
import { generateUUID } from "@personalidol/math/src/generateUUID";
import { UnmarshalException } from "@personalidol/quakemaps/src/UnmarshalException";
import { unmarshalVector3 } from "@personalidol/quakemaps/src/unmarshalVector3";

import type { Vector3 } from "three";

import type { Brush } from "@personalidol/quakemaps/src/Brush.type";
import type { EntityProperties } from "@personalidol/quakemaps/src/EntityProperties.type";
import type { EntitySketch } from "@personalidol/quakemaps/src/EntitySketch.type";
import type { TextureDimensionsResolver } from "@personalidol/quakemaps/src/TextureDimensionsResolver.type";
import type { Vector3Simple } from "@personalidol/quakemaps/src/Vector3Simple.type";

import type { AnyEntity } from "./AnyEntity.type";
import type { EntityFuncGroup } from "./EntityFuncGroup.type";
import type { EntityGLTFModel } from "./EntityGLTFModel.type";
import type { EntityLightAmbient } from "./EntityLightAmbient.type";
import type { EntityLightHemisphere } from "./EntityLightHemisphere.type";
import type { EntityLightPoint } from "./EntityLightPoint.type";
import type { EntityLightSpotlight } from "./EntityLightSpotlight.type";
import type { EntityMD2Model } from "./EntityMD2Model.type";
import type { EntityPlayer } from "./EntityPlayer.type";
import type { EntityScriptedBrush } from "./EntityScriptedBrush.type";
import type { EntityScriptedZone } from "./EntityScriptedZone.type";
import type { EntitySounds } from "./EntitySounds.type";
import type { EntitySparkParticles } from "./EntitySparkParticles.type";
import type { EntityTarget } from "./EntityTarget.type";
import type { EntityWorldspawn } from "./EntityWorldspawn.type";

const SCENERY_INDOORS = 0;
const SCENERY_OUTDOORS = 1;
const _transferablesEmpty: [] = [];

function _getEntityAngle(filename: string, entity: EntitySketch): number {
  if ("string" !== typeof entity.properties.angle) {
    throw new UnmarshalException(filename, 0, "Entity does not have an angle property but it was expected.");
  }

  // Adjust the angle for a different axis orientation.
  return Number(entity.properties.angle) - Math.PI / 2;
}

function _getEntityOrigin(filename: string, entity: EntitySketch): Vector3Simple {
  if ("string" !== typeof entity.properties.origin) {
    throw new UnmarshalException(filename, 0, "Entity does not have an origin but it was expected.");
  }

  const threeVector3 = unmarshalVector3(filename, 0, entity.properties.origin);

  return {
    x: threeVector3.x,
    y: threeVector3.y,
    z: threeVector3.z,
  };
}

export function* buildEntities(
  filename: string,
  entitySketches: ReadonlyArray<EntitySketch>,
  resolveTextureDimensions: TextureDimensionsResolver,
  discardOccluding: null | Vector3 = null
): Generator<AnyEntity> {
  // brushes to be merged into the bigger static geometry
  const worldBrushes: Array<EntitySketch> = [];
  let worldProperties: null | EntityProperties = null;

  for (let entity of entitySketches) {
    const entityClassName = String(entity.properties.classname);
    const entityType = String(entity.properties._tb_type);

    switch (entityClassName) {
      case "func_group":
        // this func is primarily for a game logic, but it can also group
        // geometries
        switch (entityType) {
          // "_tb_layer" is the Trenchbroom editor utility to help mapmaker to
          // group map objects, those can be merged with worldspawn geometry
          case "_tb_layer":
            worldBrushes.push(entity);
            break;
          // Grouped objects should be processed as standalone entities,
          // because they can have their own controllers and be handled via
          // triggers. Those can be doors or other animated objects.
          // Do not discard occluding faces on `func_group` since they may be
          // rotating, animating, etc.
          default:
            yield <EntityFuncGroup>{
              brushes: entity.brushes,
              classname: entityClassName,
              id: generateUUID(),
              properties: entity.properties,
              ...buildGeometryAttributes(entity.brushes, resolveTextureDimensions, true, null),
            };
            break;
        }
        break;
      case "light_point":
      case "light_spotlight":
        yield <EntityLightPoint | EntityLightSpotlight>{
          classname: entityClassName,
          color: entity.properties.color,
          decay: Number(entity.properties.decay),
          id: generateUUID(),
          intensity: Number(entity.properties.intensity),
          origin: _getEntityOrigin(filename, entity),
          properties: entity.properties,
          quality_map: Number(entity.properties.quality_map),
          transferables: _transferablesEmpty,
        };
        break;
      case "model_gltf":
        yield <EntityGLTFModel>{
          angle: _getEntityAngle(filename, entity),
          classname: entityClassName,
          id: generateUUID(),
          model_filename: entity.properties.model_filename || "model.glb",
          model_name: entity.properties.model_name,
          model_texture: entity.properties.model_texture,
          origin: _getEntityOrigin(filename, entity),
          properties: entity.properties,
          scale: Number(entity.properties.scale),
          transferables: _transferablesEmpty,
        };
        break;
      case "model_md2":
        yield <EntityMD2Model>{
          angle: _getEntityAngle(filename, entity),
          classname: entityClassName,
          id: generateUUID(),
          model_name: entity.properties.model_name,
          origin: _getEntityOrigin(filename, entity),
          properties: entity.properties,
          skin: Number(entity.properties.skin),
          transferables: _transferablesEmpty,
        };
        break;
      case "player":
        yield <EntityPlayer>{
          classname: entityClassName,
          id: generateUUID(),
          origin: _getEntityOrigin(filename, entity),
          properties: entity.properties,
          transferables: _transferablesEmpty,
        };
        break;
      case "scripted_brush":
        yield <EntityScriptedBrush>{
          brushes: entity.brushes,
          classname: entityClassName,
          id: generateUUID(),
          properties: entity.properties,
          ...buildGeometryAttributes(entity.brushes, resolveTextureDimensions, true, null),
        };
        break;
      case "scripted_zone":
        yield <EntityScriptedZone>{
          brushes: entity.brushes,
          classname: entityClassName,
          id: generateUUID(),
          properties: entity.properties,
          ...buildGeometryAttributes(entity.brushes, resolveTextureDimensions, true, null),
        };
        break;
      case "spark_particles":
        yield <EntitySparkParticles>{
          classname: entityClassName,
          id: generateUUID(),
          origin: _getEntityOrigin(filename, entity),
          properties: entity.properties,
          transferables: _transferablesEmpty,
        };
        break;
      case "target":
        yield <EntityTarget>{
          classname: entityClassName,
          id: generateUUID(),
          origin: _getEntityOrigin(filename, entity),
          properties: entity.properties,
          transferables: _transferablesEmpty,
        };
        break;
      case "worldspawn":
        if (worldProperties !== null) {
          throw new Error("Unexpectedly there is more than one worldspawn entity.");
        }

        worldProperties = entity.properties;
        worldBrushes.push(entity);

        if (entity.properties.hasOwnProperty("light")) {
          const sceneryType = Number(entity.properties.scenery);

          switch (sceneryType) {
            case SCENERY_INDOORS:
              yield <EntityLightAmbient>{
                classname: "light_ambient",
                id: generateUUID(),
                light: Number(entity.properties.light),
                properties: {},
                transferables: _transferablesEmpty,
              };
              break;
            case SCENERY_OUTDOORS:
              yield <EntityLightHemisphere>{
                classname: "light_hemisphere",
                id: generateUUID(),
                light: Number(entity.properties.light),
                properties: {},
                transferables: _transferablesEmpty,
              };
              break;
            default:
              throw new UnmarshalException(filename, 0, `Unknown map scenery type: "${sceneryType}".`);
          }
        }
        if (entity.properties.hasOwnProperty("sounds")) {
          yield <EntitySounds>{
            classname: "sounds",
            id: generateUUID(),
            properties: {},
            sounds: entity.properties.sounds,
            transferables: _transferablesEmpty,
          };
        }
        break;
      default:
        throw new UnmarshalException(filename, 0, `Unknown entity class: "${entityClassName}"`);
    }
  }

  if (worldProperties === null) {
    throw new Error("Unexpectedly there is no worldspawn entity.");
  }

  // this is the static world geometry
  const mergedBrushes: Array<Brush> = [];

  for (let entity of worldBrushes) {
    mergedBrushes.push(...entity.brushes);
  }

  if (mergedBrushes.length < 0) {
    return;
  }

  // leave worldspawn at the end for better performance
  // it takes a long time to parse a map file, in the meantime the main
  // thread can load models, etc

  yield <EntityWorldspawn>{
    brushes: mergedBrushes,
    classname: "worldspawn",
    id: generateUUID(),
    properties: worldProperties,
    ...buildGeometryAttributes(mergedBrushes, resolveTextureDimensions, true, discardOccluding),
  };
}
