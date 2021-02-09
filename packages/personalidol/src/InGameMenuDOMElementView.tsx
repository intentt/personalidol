import { h } from "preact";

import { DOMElementView } from "@personalidol/dom-renderer/src/DOMElementView";
import { must } from "@personalidol/framework/src/must";
import { ReplaceableStyleSheet } from "@personalidol/dom-renderer/src/ReplaceableStyleSheet";

import { DOMZIndex } from "./DOMZIndex.enum";

const _css = `
  :host {
    all: initial;
  }

  *, * * {
    box-sizing: border-box;
  }

  #main-menu,
  #main-menu:before {
    bottom: 0;
    left: 0;
    position: absolute;
    right: 0;
    top: 0;
    -webkit-user-select: none;
    user-select: none;
    z-index: ${DOMZIndex.InGameMenu};
  }

  #main-menu {
    align-items: flex-start;
    background-color: rgba(0, 0, 0, 0.4);
    color: white;
    display: grid;
    font-size: 1.6rem;
    justify-content: center;
    height: 100%;
    pointer-events: auto;
  }

  #main-menu__content {
    align-items: stretch;
    display: flex;
    flex-direction: column;
    justify-content: center;
    height: 100%;
    overflow-y: auto;
    padding: 1.6rem;
    position: relative;
  }

  h1,
  h2,
  nav {
    position: relative;
  }

  h1,
  h2 {
    line-height: 1;
    margin: 0;
    text-align: center;
  }

  h1 {
    font-family: "Almendra", sans-serif;
    font-size: 3.2rem;
    font-weight: normal;
    font-variant: small-caps;
    margin: 0;
  }

  h2,
  nav button {
    font-family: "Mukta", sans-serif;
  }

  h2 {
    font-size: 1.4rem;
    font-variant: small-caps;
    font-weight: 500;
    letter-spacing: 0.05  ch;
    text-transform: lowercase;
    word-spacing: 0.6ch;
  }

  nav {
    align-self: flex-start;
    display: grid;
    padding-top: 3.2rem;
    width: 100%;
  }

  button {
    background-color: transparent;
    border: 1px solid transparent;
    font-family: "Mukta", sans-serif;
    font-size: 1.4rem;
    font-variant: small-caps;
    font-weight: 300;
    text-align: center;
    text-transform: lowercase;
    width: 100%;
  }

  button:disabled {
    color: rgba(255, 255, 255, 0.4);
  }

  button:enabled {
    color: white;
  }

  button:enabled:hover {
    border-color: white;
  }

  button:focus {
    outline: none;
  }
`;

export class InGameMenuDOMElementView extends DOMElementView {
  constructor() {
    super();

    this.onButtonExitClick = this.onButtonExitClick.bind(this);
    this.onButtonOptionsClick = this.onButtonOptionsClick.bind(this);
    this.onButtonReturnToGameClick = this.onButtonReturnToGameClick.bind(this);

    this.styleSheet = ReplaceableStyleSheet(this.shadow, _css);
  }

  connectedCallback() {
    super.connectedCallback();

    must(this.uiMessagePort).postMessage({
      isScenePaused: true,
    });
  }

  disconnectedCallback() {
    super.disconnectedCallback();

    must(this.uiMessagePort).postMessage({
      isInGameMenuOpened: false,
      isOptionsScreenOpened: false,
      isScenePaused: false,
    });
  }

  onButtonExitClick(evt: MouseEvent) {
    evt.preventDefault();

    must(this.uiMessagePort).postMessage({
      currentMap: null,
    });
  }

  onButtonOptionsClick(evt: MouseEvent) {
    evt.preventDefault();

    must(this.uiMessagePort).postMessage({
      isOptionsScreenOpened: true,
    });
  }

  onButtonReturnToGameClick(evt: MouseEvent) {
    evt.preventDefault();

    must(this.uiMessagePort).postMessage({
      isInGameMenuOpened: false,
    });
  }

  render() {
    return (
      <div id="main-menu">
        <div id="main-menu__content">
          <h1>Personal Idol</h1>
          <h2>You shall not be judged</h2>
          <nav>
            <button onClick={this.onButtonReturnToGameClick}>Return to game</button>
            <button disabled>Load Game</button>
            <button onClick={this.onButtonOptionsClick}>Options</button>
            <button disabled>Credits</button>
            <button onClick={this.onButtonExitClick}>Exit</button>
          </nav>
        </div>
      </div>
    );
  }
}