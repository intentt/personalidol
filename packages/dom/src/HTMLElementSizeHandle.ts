import type { ResizeableRenderer } from "../../framework/src/ResizeableRenderer.interface";

export function HTMLElementSizeHandle(htmlElement: HTMLElement): ResizeableRenderer {
  function setSize(width: number, height: number): void {
    htmlElement.style.width = `${width}px`;
    htmlElement.style.height = `${height}px`;
  }

  return Object.freeze({
    setSize: setSize,
  });
}
