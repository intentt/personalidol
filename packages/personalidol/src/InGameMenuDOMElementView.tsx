import { h } from "preact";

import { DOMElementView } from "../../dom-renderer/src/DOMElementView";

import type { DOMElementViewContext } from "./DOMElementViewContext.type";
import type { MessageGameStateChange } from "./MessageGameStateChange.type";
import type { MessageUIStateChange } from "./MessageUIStateChange.type";

export class InGameMenuDOMElementView extends DOMElementView<DOMElementViewContext> {
  constructor() {
    super();

    this.onButtonExitClick = this.onButtonExitClick.bind(this);
    this.onButtonReturnToGameClick = this.onButtonReturnToGameClick.bind(this);
  }

  connectedCallback() {
    super.connectedCallback();

    const message: MessageGameStateChange = {
      isScenePaused: true,
    };

    this.context.gameMessagePort.postMessage(message);
  }

  disconnectedCallback() {
    super.disconnectedCallback();

    const uiMessage: MessageUIStateChange = {
      isInGameMenuOpened: false,
    };

    this.context.uiMessagePort.postMessage(uiMessage);

    const gameMessage: MessageGameStateChange = {
      isScenePaused: false,
    };

    this.context.gameMessagePort.postMessage(gameMessage);
  }

  onButtonExitClick(evt: MouseEvent) {
    evt.preventDefault();

    const message: MessageGameStateChange = {
      currentLocationMap: null,
    };

    this.context.gameMessagePort.postMessage(message);
  }

  onButtonReturnToGameClick(evt: MouseEvent) {
    evt.preventDefault();

    const message: MessageUIStateChange = {
      isInGameMenuOpened: false,
    };

    this.context.uiMessagePort.postMessage(message);
  }

  render() {
    return (
      <pi-main-menu-layout>
        <pi-main-menu-button onClick={this.onButtonReturnToGameClick}>
          {this.t("ui:menu_return_to_game")}
        </pi-main-menu-button>
        <pi-main-menu-button disabled>{this.t("ui:menu_load_game")}</pi-main-menu-button>
        <pi-main-menu-user-settings-button />
        <pi-main-menu-language-button />
        <pi-main-menu-button disabled>{this.t("ui:menu_credits")}</pi-main-menu-button>
        <pi-main-menu-button onClick={this.onButtonExitClick}>{this.t("ui:menu_exit")}</pi-main-menu-button>
      </pi-main-menu-layout>
    );
  }
}
