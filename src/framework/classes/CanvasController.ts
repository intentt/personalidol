import { CancelToken } from "src/framework/interfaces/CancelToken";
import { CanvasController as CanvasControllerInterface } from "src/framework/interfaces/CanvasController";
import { CanvasViewBag } from "src/framework/interfaces/CanvasViewBag";
import { ElementSize } from "src/framework/interfaces/ElementSize";

export default abstract class CanvasController implements CanvasControllerInterface {
  readonly canvasViewBag: CanvasViewBag;
  private _isAttached: boolean;
  private _isDisposed: boolean;

  constructor(canvasViewBag: CanvasViewBag) {
    this.canvasViewBag = canvasViewBag;
    this._isAttached = false;
    this._isDisposed = false;
  }

  async attach(cancelToken: CancelToken): Promise<void> {
    this._isAttached = true;
    this._isDisposed = false;
  }

  begin(): void {}

  async dispose(cancelToken: CancelToken): Promise<void> {
    this._isAttached = false;
    await this.canvasViewBag.dispose(cancelToken);
    this._isDisposed = true;
  }

  draw(interpolationPercentage: number): void {}

  end(fps: number, isPanicked: boolean): void {}

  isAttached(): boolean {
    return this._isAttached;
  }

  isDisposed(): boolean {
    return this._isDisposed;
  }

  onPointerAuxiliaryClick(): void {}

  onPointerAuxiliaryDepressed(): void {}

  onPointerAuxiliaryPressed(): void {}

  onPointerOut(): void {}

  onPointerOver(): void {}

  onPointerPrimaryClick(): void {}

  onPointerPrimaryDepressed(): void {}

  onPointerPrimaryPressed(): void {}

  onPointerSecondaryClick(): void {}

  onPointerSecondaryDepressed(): void {}

  onPointerSecondaryPressed(): void {}

  resize(elementSize: ElementSize<"px">): void {}

  update(delta: number): void {}

  useBegin(): boolean {
    return false;
  }

  useDraw(): boolean {
    return false;
  }

  useEnd(): boolean {
    return false;
  }

  useSettings(): boolean {
    return false;
  }

  useUpdate(): boolean {
    return false;
  }
}