import { Object3D } from "three/src/core/Object3D";

import { isSharedArrayBufferSupported } from "../../framework/src/isSharedArrayBufferSupported";

import { CSS2DObjectState } from "./CSS2DObjectState";
import { isCSS2DObject } from "./isCSS2DObject";

import type { DOMElementProps } from "../../dom-renderer/src/DOMElementProps.type";
import type { DOMElementsLookup } from "../../dom-renderer/src/DOMElementsLookup.type";
import type { MessageDOMUIDispose } from "../../dom-renderer/src/MessageDOMUIDispose.type";

import type { CSS2DObject as ICSS2DObject } from "./CSS2DObject.interface";

const useSharedArrayBuffer: boolean = isSharedArrayBufferSupported();

export class CSS2DObject<L extends DOMElementsLookup> extends Object3D implements ICSS2DObject<L> {
  public readonly element: string & keyof L;
  public readonly state: Float32Array = CSS2DObjectState.createEmptyState(useSharedArrayBuffer);
  public readonly type: "CSS2DObject" = "CSS2DObject";

  public isDirty: boolean = false;
  public isDisposed: boolean = false;
  public isRendered: boolean = false;
  public props: DOMElementProps;

  private _domMessagePort: MessagePort;

  constructor(domMessagePort: MessagePort, element: string & keyof L, props: DOMElementProps) {
    super();

    this._domMessagePort = domMessagePort;
    this.element = element;
    this.props = props;

    this.addEventListener("removed", this._onRemoved.bind(this));
  }

  private _onRemoved() {
    const disposables: Array<string> = [];

    this.traverse(function (object: Object3D) {
      if (!isCSS2DObject(object)) {
        return;
      }

      if (object.isDisposed) {
        throw new Error(`CSS2DObject is already disposed: "${object.uuid}"`);
      }

      if (!object.isRendered) {
        return;
      }

      object.isDisposed = true;
      disposables.push(object.uuid);
    });

    this._domMessagePort.postMessage({
      dispose: <MessageDOMUIDispose>disposables,
    });
  }
}
