import type { AtlasTextureDimension } from "../../texture-loader/src/AtlasTextureDimension.type";

export type TextureDimensionsResolver = (textureName: string) => AtlasTextureDimension;
