import { h } from "preact";

import { DOMElementView } from "../../dom-renderer/src/DOMElementView";

import type { DOMElementViewContext } from "./DOMElementViewContext.type";
import type { MessageUIStateChange } from "./MessageUIStateChange.type";

export class MainMenuUserSettingsButtonDOMElementView extends DOMElementView<DOMElementViewContext> {
  constructor() {
    super();

    this.onButtonUserSettingsClick = this.onButtonUserSettingsClick.bind(this);
  }

  onButtonUserSettingsClick(evt: MouseEvent) {
    evt.preventDefault();

    const message: MessageUIStateChange = {
      isUserSettingsScreenOpened: true,
    };

    this.context.uiMessagePort.postMessage(message);
  }

  render() {
    return (
      <pi-main-menu-button onClick={this.onButtonUserSettingsClick}>{this.t("ui:menu_options")}</pi-main-menu-button>
    );
  }
}
