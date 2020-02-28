import ElementPositionUnit from "src/framework/enums/ElementPositionUnit";
import SchedulerUpdateScenario from "src/framework/enums/SchedulerUpdateScenario";

import cancelable from "src/framework/decorators/cancelable";

import CancelToken from "src/framework/interfaces/CancelToken";
import CanvasViewBag from "src/framework/interfaces/CanvasViewBag";
import ElementPosition from "src/framework/interfaces/ElementPosition";
import ElementSize from "src/framework/interfaces/ElementSize";
import { default as ICanvasController } from "src/framework/interfaces/CanvasController";

export default class CanvasController implements ICanvasController {
  readonly canvasViewBag: CanvasViewBag;
  private _isAttached: boolean = false;
  private _isDisposed: boolean = false;

  constructor(canvasViewBag: CanvasViewBag) {
    this.canvasViewBag = canvasViewBag;
  }

  @cancelable()
  async attach(cancelToken: CancelToken): Promise<void> {
    this._isAttached = true;
    this._isDisposed = false;
  }

  @cancelable()
  async dispose(cancelToken: CancelToken): Promise<void> {
    this._isAttached = false;
    await this.canvasViewBag.dispose(cancelToken);
    this._isDisposed = true;
  }

  draw(delta: number): void {}

  isAttached(): boolean {
    return this._isAttached;
  }

  isDisposed(): boolean {
    return this._isDisposed;
  }

  resize(elementSize: ElementSize<ElementPositionUnit.Px>): void {}

  setPosition(elementPosition: ElementPosition<ElementPositionUnit.Px>): void {}

  update(delta: number): void {}

  useDraw(): SchedulerUpdateScenario {
    return SchedulerUpdateScenario.Never;
  }

  useUpdate(): SchedulerUpdateScenario {
    return SchedulerUpdateScenario.Never;
  }
}
