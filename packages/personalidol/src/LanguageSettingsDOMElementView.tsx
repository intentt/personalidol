import { h } from "preact";

import { DOMElementView } from "@personalidol/dom-renderer/src/DOMElementView";

import { DOMBreakpoints } from "./DOMBreakpoints.enum";

import type { TickTimerState } from "@personalidol/framework/src/TickTimerState.type";

import type { DOMElementViewContext } from "./DOMElementViewContext.type";
import type { MessageUIStateChange } from "./MessageUIStateChange.type";

const _css = `
  :host {
    all: initial;
  }

  *, * * {
    box-sizing: border-box;
  }

  h1 {
    align-items: center;
    background-color: black;
    border-bottom: 1px solid white;
    display: grid;
    font-family: Lora;
    font-size: 3.2rem;
    font-weight: normal;
    grid-column-gap: 1.6rem;
    grid-template-columns: 1fr auto;
    line-height: 1;
    margin: 0;
    margin-bottom: 3.2rem;
    min-width: 12ch;
    padding-bottom: 1.6rem;
    position: sticky;
    top: 0;
  }

  @media (max-width: ${DOMBreakpoints.MobileMax}px) {
    h1 {
      padding-top: 1.6rem;
      margin-top: 1.6rem;
    }
  }

  @media (min-width: ${DOMBreakpoints.TabletMin}px) {
    h1 {
      margin-top: 4.8rem;
      padding-top: 1.6rem;
    }
  }

  #language-settings {
    color: white;
  }
`;

export class LanguageSettingsDOMElementView extends DOMElementView<DOMElementViewContext> {
  public static css: string = _css;

  private _isLanguageChangePending: boolean = false;
  private _targetLanguage: string = "";

  constructor() {
    super();

    this.close = this.close.bind(this);
  }

  close() {
    const message: MessageUIStateChange = {
      isLanguageSettingsScreenOpened: false,
    };

    this.context.uiMessagePort.postMessage(message);
  }

  beforeRender(delta: number, elapsedTime: number, tickTimerState: TickTimerState): void {
    super.beforeRender(delta, elapsedTime, tickTimerState);

    if (this._isLanguageChangePending) {
      this._isLanguageChangePending = this._targetLanguage !== this.i18next.language;
    }

    if (this.needsRender) {
      return;
    }

    this.needsRender = this._isLanguageChangePending;
  }

  disconnectedCallback() {
    super.disconnectedCallback();

    this.close();
  }

  onLanguageChange(language: string): (evt: MouseEvent) => void {
    const self: this = this;

    return function (evt: MouseEvent): void {
      evt.preventDefault();

      if (language === self.context.userSettings.language) {
        return;
      }

      self._isLanguageChangePending = true;
      self._targetLanguage = language;

      self.context.userSettings.language = language;
      self.context.userSettings.version += 1;
    };
  }

  render(delta: number) {
    return (
      <pi-settings-backdrop isloading={this._isLanguageChangePending} onDirectClick={this.close}>
        <h1>
          {this.t("ui:user_settings_language")}
          <pi-button onClick={this.close}>{this.t("ui:user_settings_done").toLocaleLowerCase()}</pi-button>
        </h1>
        <pi-main-menu-button
          active={"en" === this.i18next.language}
          disabled={this._isLanguageChangePending}
          onClick={this.onLanguageChange("en")}
        >
          English
        </pi-main-menu-button>
        <pi-main-menu-button
          active={"pl" === this.i18next.language}
          disabled={this._isLanguageChangePending}
          onClick={this.onLanguageChange("pl")}
        >
          Polski
        </pi-main-menu-button>
        <pi-main-menu-button
          active={"ru" === this.i18next.language}
          disabled={this._isLanguageChangePending}
          onClick={this.onLanguageChange("ru")}
        >
          Русский
        </pi-main-menu-button>
      </pi-settings-backdrop>
    );
  }
}
