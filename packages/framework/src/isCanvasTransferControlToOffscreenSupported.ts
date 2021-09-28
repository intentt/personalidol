let _isSupported: boolean = false;
let _isTested: boolean = false;

function _test(): boolean {
  if (!globalThis.HTMLCanvasElement) {
    return false;
  }

  // @ts-ignore OffscreenCanvas is experimental
  return "function" === typeof HTMLCanvasElement.prototype.transferControlToOffscreen;
}

export function isCanvasTransferControlToOffscreenSupported(): boolean {
  if (_isTested) {
    return _isSupported;
  }

  _isSupported = _test();
  _isTested = true;

  return _isSupported;
}
