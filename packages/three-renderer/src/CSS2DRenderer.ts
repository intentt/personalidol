import { Matrix4 } from "three/src/math/Matrix4";
import { Object3D } from "three/src/core/Object3D";
import { Vector3 } from "three/src/math/Vector3";

import { isSharedArrayBufferSupported } from "@personalidol/framework/src/isSharedArrayBufferSupported";

import { CSS2DObjectStateIndices } from "./CSS2DObjectStateIndices.enum";
import { isCSS2DObject } from "./isCSS2DObject";

import type { Camera } from "three/src/cameras/Camera";
import type { Scene } from "three/src/scenes/Scene";

import type { DOMElementsLookup } from "@personalidol/dom-renderer/src/DOMElementsLookup.type";
import type { MessageDOMUIRender } from "@personalidol/dom-renderer/src/MessageDOMUIRender.type";

import type { CSS2DObject } from "./CSS2DObject.interface";
import type { CSS2DRenderer as ICSS2DRenderer } from "./CSS2DRenderer.interface";
import type { CSS2DRendererInfo } from "./CSS2DRendererInfo.type";

const useSharedArrayBuffer: boolean = isSharedArrayBufferSupported();

const _vec = new Vector3();
const _vecTmpA = new Vector3();
const _vecTmpB = new Vector3();

export function CSS2DRenderer<L extends DOMElementsLookup>(domMessagePort: MessagePort): ICSS2DRenderer {
  let _height: number = 0;
  let _heightHalf: number = 0;
  let _width: number = 0;
  let _widthHalf: number = 0;
  let i: number = 0;

  let _cameraFar: number = 0;
  let _isObjectChanged: boolean = false;
  let _previousDistanceToCameraSquared: number = 0;
  let _previousIsRendered: number = 0;
  let _previousTranslateX: number = 0;
  let _previousTranslateY: number = 0;
  let _previousVisible: number = 0;

  const _sentBuffers: WeakMap<CSS2DObject<L>, boolean> = new WeakMap();
  const _viewMatrix = new Matrix4();
  const _viewProjectionMatrix = new Matrix4();

  const renderer: ICSS2DRenderer = Object.freeze({
    info: <CSS2DRendererInfo>Object.seal({
      render: Object.seal({
        elements: 0,
      }),
    }),

    getSize: getSize,
    render: render,
    setSize: setSize,
  });

  function _createObjectRenderMessage(object: CSS2DObject<L>): MessageDOMUIRender<L> {
    const message: MessageDOMUIRender<L> = {
      element: object.element,
      id: object.uuid,
      props: {
        objectProps: object.props,
        version: object.state[CSS2DObjectStateIndices.VERSION],
      },
    };

    object.isRendered = true;

    if (!useSharedArrayBuffer) {
      message.props.rendererState = object.state;

      return message;
    }

    if (!_sentBuffers.has(object)) {
      // There is no need to send shared array buffer more than once.
      message.props.rendererState = object.state.buffer;
      _sentBuffers.set(object, true);
    }

    return message;
  }

  function _renderObject(object: CSS2DObject<L>, scene: Scene, camera: Camera) {
    _vec.setFromMatrixPosition(object.matrixWorld);
    _vec.applyMatrix4(_viewProjectionMatrix);

    _previousDistanceToCameraSquared = object.state[CSS2DObjectStateIndices.DISTANCE_TO_CAMERA_SQUARED];
    _previousIsRendered = object.state[CSS2DObjectStateIndices.IS_RENDERED];
    _previousTranslateX = object.state[CSS2DObjectStateIndices.TRANSLATE_X];
    _previousTranslateY = object.state[CSS2DObjectStateIndices.TRANSLATE_Y];
    _previousVisible = object.state[CSS2DObjectStateIndices.VISIBLE];

    object.state[CSS2DObjectStateIndices.IS_RENDERED] = 1;
    object.state[CSS2DObjectStateIndices.DISTANCE_TO_CAMERA_SQUARED] = _getDistanceToSquared(camera, object);

    // @ts-ignore this is safe and does not require to import all possible
    // cameras to typecheck
    _cameraFar = camera.far || 0;

    object.state[CSS2DObjectStateIndices.CAMERA_FAR] = _cameraFar;
    object.state[CSS2DObjectStateIndices.TRANSLATE_X] = _vec.x * _widthHalf + _widthHalf;
    object.state[CSS2DObjectStateIndices.TRANSLATE_Y] = -1 * _vec.y * _heightHalf + _heightHalf;

    // prettier-ignore
    if ( object.state[CSS2DObjectStateIndices.TRANSLATE_X] < 0
      || object.state[CSS2DObjectStateIndices.TRANSLATE_Y] < 0
      || object.state[CSS2DObjectStateIndices.TRANSLATE_X] > _width
      || object.state[CSS2DObjectStateIndices.TRANSLATE_Y] > _height
    ) {
      object.state[CSS2DObjectStateIndices.VISIBLE] = 0;
    } else {
      object.state[CSS2DObjectStateIndices.VISIBLE] = Number(object.visible && _vec.z >= -1 && _vec.z <= 1);
    }

    _isObjectChanged =
      (!object.state[CSS2DObjectStateIndices.VISIBLE] && !_previousVisible) ||
      _previousDistanceToCameraSquared !== object.state[CSS2DObjectStateIndices.DISTANCE_TO_CAMERA_SQUARED] ||
      _previousIsRendered !== object.state[CSS2DObjectStateIndices.IS_RENDERED] ||
      _previousTranslateX !== object.state[CSS2DObjectStateIndices.TRANSLATE_X] ||
      _previousTranslateY !== object.state[CSS2DObjectStateIndices.TRANSLATE_Y] ||
      _previousVisible !== object.state[CSS2DObjectStateIndices.VISIBLE];

    if (useSharedArrayBuffer) {
      // There is no need to send object state over and over when shared
      // buffers are used.
      object.isDirty = !_sentBuffers.has(object);
    } else {
      // prettier-ignore
      object.isDirty = _isObjectChanged;
    }

    if (_isObjectChanged) {
      object.state[CSS2DObjectStateIndices.VERSION] += 1;
    }
  }

  function _getDistanceToSquared(object1: Object3D, object2: Object3D): number {
    _vecTmpA.setFromMatrixPosition(object1.matrixWorld);
    _vecTmpB.setFromMatrixPosition(object2.matrixWorld);

    return _vecTmpA.distanceToSquared(_vecTmpB);
  }

  function _filterAndFlatten(scene: Scene): Array<CSS2DObject<L>> {
    const result: Array<CSS2DObject<L>> = [];

    scene.traverse(function (object: Object3D) {
      if (isCSS2DObject<L>(object)) {
        result.push(object);
      }
    });

    return result;
  }

  function _reportRenderBatch(css2DObjects: Array<CSS2DObject<L>>) {
    const renderBatch: Array<MessageDOMUIRender<L>> = [];

    for (let object of css2DObjects) {
      if (object.isDirty) {
        renderBatch.push(_createObjectRenderMessage(object));
        object.isDirty = false;
      }
    }

    if (renderBatch.length < 1) {
      return;
    }

    domMessagePort.postMessage({
      renderBatch: renderBatch,
    });
  }

  function _sortObjectsByDistance(a: CSS2DObject<L>, b: CSS2DObject<L>) {
    const distanceA = a.state[CSS2DObjectStateIndices.DISTANCE_TO_CAMERA_SQUARED];
    const distanceB = b.state[CSS2DObjectStateIndices.DISTANCE_TO_CAMERA_SQUARED];

    return distanceA - distanceB;
  }

  function _zOrder(css2DObjects: Array<CSS2DObject<L>>, scene: Scene) {
    const sorted = css2DObjects.sort(_sortObjectsByDistance);
    const zMax = sorted.length;

    for (i = 0; i < zMax; i++) {
      sorted[i].state[CSS2DObjectStateIndices.Z_INDEX] = zMax - i;
    }
  }

  function getSize() {
    return {
      width: _width,
      height: _height,
    };
  }

  function setSize(width: number, height: number) {
    _height = height;
    _heightHalf = _height / 2;
    _width = width;
    _widthHalf = _width / 2;
  }

  /**
   * `updateMatrices` can be `false` because 3D renderer might just have done
   * the same thing in the same tick.
   */
  function render(scene: Scene, camera: Camera, updateMatrices: boolean) {
    if (updateMatrices && scene.autoUpdate === true) {
      scene.updateMatrixWorld();
    }

    if (updateMatrices && camera.parent === null) {
      camera.updateMatrixWorld();
    }

    _viewMatrix.copy(camera.matrixWorldInverse);
    _viewProjectionMatrix.multiplyMatrices(camera.projectionMatrix, _viewMatrix);

    const css2DObjects: Array<CSS2DObject<L>> = _filterAndFlatten(scene);

    for (let object of css2DObjects) {
      _renderObject(object, scene, camera);
    }

    _zOrder(css2DObjects, scene);
    _reportRenderBatch(css2DObjects);

    renderer.info.render.elements = css2DObjects.length;
  }

  return renderer;
}
