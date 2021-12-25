import { ShaderMaterial } from "three/src/materials/ShaderMaterial";
import { UniformsUtils } from "three/src/renderers/shaders/UniformsUtils";

import { disposableGeneric } from "../../../framework/src/disposableGeneric";
import { disposableMaterial } from "../../../framework/src/disposableMaterial";
import { disposeAll } from "../../../framework/src/disposeAll";

import { FullScreenQuad } from "./FullScreenQuad";
import { Pass } from "./Pass";

import type { IUniform } from "three/src/renderers/shaders/UniformsLib";
import type { Material } from "three/src/materials/Material";
import type { ShaderMaterial as IShaderMaterial } from "three/src/materials/ShaderMaterial";
import type { Uniform } from "three/src/core/Uniform";
import type { WebGLRenderer } from "three/src/renderers/WebGLRenderer";
import type { WebGLRenderTarget } from "three/src/renderers/WebGLRenderTarget";

import type { DisposableCallback } from "../../../framework/src/DisposableCallback.type";

type Shader = {
  defines?: { [key: string]: number };
  uniforms: { [key: string]: Uniform };
  vertexShader: string;
  fragmentShader: string;
};

export class ShaderPass extends Pass {
  private _disposables: Set<DisposableCallback> = new Set();

  fsQuad: FullScreenQuad;
  material: Material;
  textureID: string;
  uniforms: { [uniform: string]: IUniform } = {};

  constructor(shader: IShaderMaterial | Shader, textureID: null | string = null) {
    super();

    this.textureID = textureID !== null ? textureID : "tDiffuse";

    if (shader instanceof ShaderMaterial) {
      this.uniforms = shader.uniforms;

      this.material = shader;
    } else if (shader) {
      this.uniforms = UniformsUtils.clone(shader.uniforms);

      const material = new ShaderMaterial({
        defines: Object.assign({}, shader.defines),
        uniforms: this.uniforms,
        vertexShader: shader.vertexShader,
        fragmentShader: shader.fragmentShader,
      });

      this._disposables.add(disposableMaterial(material));
      this.material = material;
    } else {
      throw new Error("Could not get shader pass material.");
    }

    const fsQuad = new FullScreenQuad(this.material);

    this._disposables.add(disposableGeneric(fsQuad));
    this.fsQuad = fsQuad;
  }

  dispose(): void {
    disposeAll(this._disposables);
  }

  render(
    renderer: WebGLRenderer,
    renderToScreen: boolean,
    writeBuffer: WebGLRenderTarget,
    readBuffer: WebGLRenderTarget,
    deltaTime: number = 0 /*,  maskActive */
  ) {
    if (this.uniforms[this.textureID]) {
      this.uniforms[this.textureID].value = readBuffer.texture;
    }

    this.fsQuad.material = this.material;

    if (renderToScreen) {
      renderer.setRenderTarget(null);
      this.fsQuad.render(renderer);
    } else {
      renderer.setRenderTarget(writeBuffer);
      // TODO: Avoid using autoClear properties, see https://github.com/mrdoob/three.js/pull/15571#issuecomment-465669600
      if (this.clear) renderer.clear(renderer.autoClearColor, renderer.autoClearDepth, renderer.autoClearStencil);
      this.fsQuad.render(renderer);
    }
  }
}
