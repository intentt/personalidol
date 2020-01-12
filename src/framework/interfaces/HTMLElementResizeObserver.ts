import { Observer } from "src/framework/interfaces/Observer";
import { Resizeable } from "src/framework/interfaces/Resizeable";

export interface HTMLElementResizeObserver extends Observer {
  off(resizeable: Resizeable<"px">): void;

  notify(resizeable: Resizeable<"px">): void;
}