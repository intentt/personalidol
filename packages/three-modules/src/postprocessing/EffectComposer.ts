import { CopyShader } from "three/examples/jsm/shaders/CopyShader";
import { LinearFilter, RGBAFormat } from "three/src/constants";
import { Vector2 } from "three/src/math/Vector2";
import { WebGLRenderTarget } from "three/src/renderers/WebGLRenderTarget";

import { disposableGeneric } from "../../../framework/src/disposableGeneric";
import { disposeAll } from "../../../framework/src/disposeAll";

import { Pass } from "./Pass";
import { ShaderPass } from "./ShaderPass";

import type { WebGLRenderer } from "three/src/renderers/WebGLRenderer";
import type { WebGLRenderTarget as IWebGLRenderTarget } from "three/src/renderers/WebGLRenderTarget";

import type { DisposableCallback } from "../../../framework/src/DisposableCallback.type";

import type { EffectComposer as IEffectComposer } from "./EffectComposer.interface";

export class EffectComposer implements IEffectComposer {
  private _disposables: Set<DisposableCallback> = new Set();
  private _pixelRatio: number;
  private _width: number;
  private _height: number;

  copyPass: ShaderPass;
  passes: Array<Pass>;
  renderer: WebGLRenderer;
  renderToScreen: boolean;
  readBuffer: IWebGLRenderTarget;
  writeBuffer: IWebGLRenderTarget;
  renderTarget1: IWebGLRenderTarget;
  renderTarget2: IWebGLRenderTarget;

  constructor(renderer: WebGLRenderer, renderTarget: null | IWebGLRenderTarget = null) {
    this.renderer = renderer;

    if (renderTarget === null) {
      const parameters = {
        minFilter: LinearFilter,
        magFilter: LinearFilter,
        format: RGBAFormat,
        stencilBuffer: false,
      };

      const size = renderer.getSize(new Vector2());
      this._pixelRatio = renderer.getPixelRatio();
      this._width = size.width;
      this._height = size.height;

      renderTarget = new WebGLRenderTarget(this._width * this._pixelRatio, this._height * this._pixelRatio, parameters);
      this._disposables.add(disposableGeneric(renderTarget));

      renderTarget.texture.name = "EffectComposer.rt1";
    } else {
      this._pixelRatio = 1;
      this._width = renderTarget.width;
      this._height = renderTarget.height;
    }

    this.renderTarget1 = renderTarget;
    this._disposables.add(disposableGeneric(renderTarget));

    this.renderTarget2 = renderTarget.clone();
    this._disposables.add(disposableGeneric(this.renderTarget2));

    this.renderTarget2.texture.name = "EffectComposer.rt2";

    this.writeBuffer = this.renderTarget1;
    this.readBuffer = this.renderTarget2;

    this.renderToScreen = true;

    this.passes = [];

    this.copyPass = new ShaderPass(CopyShader);
    this._disposables.add(disposableGeneric(this.copyPass));
  }

  dispose(): void {
    disposeAll(this._disposables);
  }

  swapBuffers() {
    [this.readBuffer, this.writeBuffer] = [this.writeBuffer, this.readBuffer];
  }

  addPass(pass: Pass) {
    this.passes.push(pass);
    pass.setSize(this._width * this._pixelRatio, this._height * this._pixelRatio);
  }

  insertPass(pass: Pass, index: number) {
    this.passes.splice(index, 0, pass);
    pass.setSize(this._width * this._pixelRatio, this._height * this._pixelRatio);
  }

  isLastEnabledPass(passIndex: number) {
    for (let i = passIndex + 1; i < this.passes.length; i++) {
      if (this.passes[i].enabled) {
        return false;
      }
    }

    return true;
  }

  removePass(pass: Pass): void {
    this.passes = this.passes.filter(function (_pass: Pass) {
      return _pass !== pass;
    });
  }

  render(deltaTime: number) {
    const currentRenderTarget = this.renderer.getRenderTarget();

    let maskActive = false;

    let pass;

    for (let i = 0; i < this.passes.length; i += 1) {
      pass = this.passes[i];

      if (pass.enabled === false) continue;

      const renderToScreen = this.renderToScreen && this.isLastEnabledPass(i);

      pass.render(this.renderer, renderToScreen, this.writeBuffer, this.readBuffer, deltaTime, maskActive);

      if (pass.needsSwap) {
        if (maskActive) {
          const context = this.renderer.getContext();
          const stencil = this.renderer.state.buffers.stencil;

          //context.stencilFunc( context.NOTEQUAL, 1, 0xffffffff );
          stencil.setFunc(context.NOTEQUAL, 1, 0xffffffff);

          this.copyPass.render(this.renderer, renderToScreen, this.writeBuffer, this.readBuffer, deltaTime);

          //context.stencilFunc( context.EQUAL, 1, 0xffffffff );
          stencil.setFunc(context.EQUAL, 1, 0xffffffff);
        }

        this.swapBuffers();
      }

      maskActive = pass.mask && !pass.clearMask;
    }

    this.renderer.setRenderTarget(currentRenderTarget);
  }

  setSize(width: number, height: number) {
    this._width = width;
    this._height = height;

    const effectiveWidth = this._width * this._pixelRatio;
    const effectiveHeight = this._height * this._pixelRatio;

    this.renderTarget1.setSize(effectiveWidth, effectiveHeight);
    this.renderTarget2.setSize(effectiveWidth, effectiveHeight);

    for (let i = 0; i < this.passes.length; i++) {
      this.passes[i].setSize(effectiveWidth, effectiveHeight);
    }
  }

  setPixelRatio(pixelRatio: number) {
    this._pixelRatio = pixelRatio;

    this.setSize(this._width, this._height);
  }
}
