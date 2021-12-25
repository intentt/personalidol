import { h } from "preact";

import { DOMElementView } from "../../dom-renderer/src/DOMElementView";

import type { DOMElementViewContext } from "./DOMElementViewContext.type";
import type { MessageGameStateChange } from "./MessageGameStateChange.type";

export class MainMenuDOMElementView extends DOMElementView<DOMElementViewContext> {
  constructor() {
    super();

    this.onButtonNewGameClick = this.onButtonNewGameClick.bind(this);
  }

  onButtonNewGameClick(evt: MouseEvent) {
    evt.preventDefault();

    const message: MessageGameStateChange = {
      // currentLocationMap: "map-gates",
      currentLocationMap: "map-shanty-town",
      // currentWorldMap: "map-northern-creek",
    };

    this.context.gameMessagePort.postMessage(message);
  }

  render() {
    return (
      <pi-main-menu-layout>
        <pi-main-menu-button disabled>{this.t("ui:menu_continue")}</pi-main-menu-button>
        <pi-main-menu-button onClick={this.onButtonNewGameClick}>{this.t("ui:menu_new_game")}</pi-main-menu-button>
        <pi-main-menu-button disabled>{this.t("ui:menu_load_game")}</pi-main-menu-button>
        <pi-main-menu-user-settings-button />
        <pi-main-menu-language-button />
        <pi-main-menu-button disabled>{this.t("ui:menu_credits")}</pi-main-menu-button>
      </pi-main-menu-layout>
    );
  }
}
