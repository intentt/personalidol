import { h } from "preact";

import { DOMElementView } from "../../dom-renderer/src/DOMElementView";

import type { DOMElementViewContext } from "./DOMElementViewContext.type";

export class ReloadButtonDOMElementView extends DOMElementView<DOMElementViewContext> {
  constructor() {
    super();

    this.onClick = this.onClick.bind(this);
  }

  onClick(evt: MouseEvent) {
    evt.preventDefault();

    window.location.reload();
  }

  render(delta: number) {
    return <pi-button onClick={this.onClick}>{this.t("ui:reload_button_reload_now")}</pi-button>;
  }
}
