import { h } from "preact";

import { DOMElementView } from "../../dom-renderer/src/DOMElementView";

import { DOMBreakpoints } from "./DOMBreakpoints.enum";
import { DOMZIndex } from "./DOMZIndex.enum";

import type { DOMElementViewContext } from "./DOMElementViewContext.type";
import type { MessageUIStateChange } from "./MessageUIStateChange.type";

const _css = `
  :host {
    all: initial;
  }

  *, * * {
    box-sizing: border-box;
  }

  #ingame-menu-trigger {
    cursor: pointer;
    position: absolute;
    z-index: ${DOMZIndex.InGameMenuTrigger};
  }

  @media (max-width: ${DOMBreakpoints.MobileMax}px) {
    #ingame-menu-trigger {
      right: 1.6rem;
      bottom: 1.6rem;
    }
  }

  @media (min-width: ${DOMBreakpoints.TabletMin}px) {
    #ingame-menu-trigger {
      right: 1.6rem;
      top: 1.6rem;
    }
  }
`;

export class InGameMenuTriggerDOMElementView extends DOMElementView<DOMElementViewContext> {
  public static css: string = _css;

  constructor() {
    super();

    this.onInGameMenuTriggerClick = this.onInGameMenuTriggerClick.bind(this);
  }

  disconnectedCallback() {
    super.disconnectedCallback();

    const message: MessageUIStateChange = {
      isInGameMenuOpened: false,
    };

    this.context.uiMessagePort.postMessage(message);
  }

  onInGameMenuTriggerClick() {
    const message: MessageUIStateChange = {
      isInGameMenuOpened: true,
    };

    this.context.uiMessagePort.postMessage(message);
  }

  render() {
    return (
      <pi-button id="ingame-menu-trigger" onClick={this.onInGameMenuTriggerClick}>
        {this.t("ui:trigger_menu").toLocaleLowerCase()}
      </pi-button>
    );
  }
}
