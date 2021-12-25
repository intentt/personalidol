import { DataTexture } from "three/src/textures/DataTexture";
import { DigitalGlitch } from "three/examples/jsm/shaders/DigitalGlitch";
import { FloatType, RGBFormat } from "three/src/constants";
import { ShaderMaterial } from "three/src/materials/ShaderMaterial";
import { UniformsUtils } from "three/src/renderers/shaders/UniformsUtils";

import { disposableGeneric } from "../../../framework/src/disposableGeneric";
import { disposableMaterial } from "../../../framework/src/disposableMaterial";
import { disposeAll } from "../../../framework/src/disposeAll";
import { randFloat } from "../../../math/src/randFloat";
import { randInt } from "../../../math/src/randInt";

import { FullScreenQuad } from "./FullScreenQuad";
import { Pass } from "./Pass";

import type { Material } from "three/src/materials/Material";
import type { Uniform } from "three/src/core/Uniform";
import type { WebGLRenderer } from "three/src/renderers/WebGLRenderer";
import type { WebGLRenderTarget } from "three/src/renderers/WebGLRenderTarget";

import type { DisposableCallback } from "../../../framework/src/DisposableCallback.type";

export class GlitchPass extends Pass {
  private _disposables: Set<DisposableCallback> = new Set();
  private curF: number = 0;
  private fsQuad: FullScreenQuad;
  private goWild: boolean = false;
  private material: Material;
  private randX: number = 0;
  private uniforms: { [key: string]: Uniform };

  constructor(dt_size: number = 64) {
    super();

    const shader = DigitalGlitch;

    this.uniforms = UniformsUtils.clone(shader.uniforms);

    this.uniforms["tDisp"].value = this.generateHeightmap(dt_size);

    this.material = new ShaderMaterial({
      uniforms: this.uniforms,
      vertexShader: shader.vertexShader,
      fragmentShader: shader.fragmentShader,
    });
    this._disposables.add(disposableMaterial(this.material));

    this.fsQuad = new FullScreenQuad(this.material);
    this._disposables.add(disposableGeneric(this.fsQuad));

    this.generateTrigger();
  }

  dispose(): void {
    disposeAll(this._disposables);
  }

  render(
    renderer: WebGLRenderer,
    renderToScreen: boolean,
    writeBuffer: WebGLRenderTarget,
    readBuffer: WebGLRenderTarget
  ) {
    this.uniforms["tDiffuse"].value = readBuffer.texture;
    this.uniforms["seed"].value = Math.random(); //default seeding
    this.uniforms["byp"].value = 0;

    if (this.curF % this.randX == 0 || this.goWild == true) {
      this.uniforms["amount"].value = Math.random() / 30;
      this.uniforms["angle"].value = randFloat(-Math.PI, Math.PI);
      this.uniforms["seed_x"].value = randFloat(-1, 1);
      this.uniforms["seed_y"].value = randFloat(-1, 1);
      this.uniforms["distortion_x"].value = randFloat(0, 1);
      this.uniforms["distortion_y"].value = randFloat(0, 1);
      this.curF = 0;
      this.generateTrigger();
    } else if (this.curF % this.randX < this.randX / 5) {
      this.uniforms["amount"].value = Math.random() / 90;
      this.uniforms["angle"].value = randFloat(-Math.PI, Math.PI);
      this.uniforms["distortion_x"].value = randFloat(0, 1);
      this.uniforms["distortion_y"].value = randFloat(0, 1);
      this.uniforms["seed_x"].value = randFloat(-0.3, 0.3);
      this.uniforms["seed_y"].value = randFloat(-0.3, 0.3);
    } else if (this.goWild == false) {
      this.uniforms["byp"].value = 1;
    }

    this.curF++;

    if (renderToScreen) {
      renderer.setRenderTarget(null);
      this.fsQuad.render(renderer);
    } else {
      renderer.setRenderTarget(writeBuffer);
      if (this.clear) renderer.clear();
      this.fsQuad.render(renderer);
    }
  }

  generateTrigger() {
    this.randX = randInt(120, 240);
  }

  generateHeightmap(dt_size: number) {
    const data_arr = new Float32Array(dt_size * dt_size * 3);
    const length = dt_size * dt_size;

    for (let i = 0; i < length; i++) {
      const val = randFloat(0, 1);
      data_arr[i * 3 + 0] = val;
      data_arr[i * 3 + 1] = val;
      data_arr[i * 3 + 2] = val;
    }

    const dataTexture = new DataTexture(data_arr, dt_size, dt_size, RGBFormat, FloatType);

    this._disposables.add(disposableGeneric(dataTexture));

    return dataTexture;
  }
}
