import clsx from "clsx";
import { h } from "preact";

import { DOMElementView } from "@personalidol/dom-renderer/src/DOMElementView";

import { DOMZIndex } from "./DOMZIndex.enum";

import type { ProgressManagerState } from "@personalidol/framework/src/ProgressManagerState.type";

import type { DOMElementViewContext } from "./DOMElementViewContext.type";

export interface Attributes {
  progressManagerState: ProgressManagerState;
}

const _css = `
  @keyframes gradient-shine {
    0% {
      background-position: 100% 0%;
    }
    50% {
      background-position: 0% 0%;
    }
    100% {
      background-position: 0% 0%;
    }
  }

  :host {
    all: initial;
  }

  *, * * {
    box-sizing: border-box;
  }

  .progress {
    bottom: 1.6rem;
    display: grid;
    grid-row-gap: 1rem;
    left: 1.6rem;
    pointer-events: none;
    position: absolute;
    right: 1.6rem;
    z-index: ${DOMZIndex.ProgressManagerState};
  }

  .progress-comment,
  .progress-value,
  .progress-indicator {
    line-height: 1rem;
  }

  .progress-comment,
  .progress-value {
    color: #eeeeee;
    bottom: 2.4rem;
    font-family: sans-serif;
    font-size: 1rem;
    font-variant: small-caps;
    grid-template-columns: auto auto;
    letter-spacing: 0.1ch;
    text-transform: lowercase;
  }

  .progress-comment {
    grid-area: comment;
    overflow: hidden;
    text-align: left;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .progress-message {
    align-items: flex-end;
    display: grid;
    grid-template-rows: 1rem 0.8rem;
    grid-template-areas:
      "comment value"
      "indicator indicator"
    ;
  }

  .progress-value {
    font-size: 0.8rem;
    grid-area: value;
    text-align: right;
  }

  .progress-indicator,
  .progress-bar {
    height: 0.2rem;
  }

  .progress-indicator {
    align-items: center;
    background-color: #333333;
    display: grid;
    grid-area: indicator;
  }

  .progress-indicator.progress-indicator--undetermined {
    animation-name: gradient-shine;
    animation-direction: normal;
    animation-duration: 3s;
    animation-timing-function: ease;
    animation-iteration-count: infinite;
    background-image: linear-gradient(-90deg, #333 40%, #eee, #333 60%);
    background-size: 300% 100%;
  }

  .progress-bar {
    background-color: #eeeeee;
    color: transparent;
    display: block;
    transition: width 0.1s ease-in-out;
    will-change: width;
  }
`;

export class ProgressManagerStateDOMElementView extends DOMElementView<DOMElementViewContext> {
  static get observedAttributes() {
    return ["comment", "progress"];
  }
  public static css: string = _css;

  private _expect: number = 0;
  private _progressPercentage: string = "0%";

  set progress(progress: number) {
    this._progressPercentage = `${Math.round(100 * progress)}%`;
  }

  set progressManagerState(progressManagerState: ProgressManagerState) {
    this.needsRender = true;

    this._expect = progressManagerState.expect;

    if (this._expect < 1) {
      this.progress = 0;

      return;
    }

    let _loaded: number = 0;
    let _messageProgress: number = 0;

    for (let message of progressManagerState.messages) {
      if (message.total > 0) {
        _messageProgress = message.loaded / message.total;
        _loaded += _messageProgress;
      } else {
        _messageProgress = 0;
      }
    }

    this.progress = Math.min(1, _loaded / progressManagerState.expect);
  }

  render() {
    return (
      <main class="progress">
        <div class="progress-message">
          <div class="progress-comment">
            {`${this.t("ui:loading")}`} {"..."}
          </div>
          <div class="progress-value">{this._expect > 0 ? this._progressPercentage : ""}</div>
          <div
            class={clsx("progress-indicator", {
              "progress-indicator--undetermined": this._expect < 1,
            })}
          >
            <div
              class="progress-bar"
              style={{
                width: this._progressPercentage,
              }}
            ></div>
          </div>
        </div>
      </main>
    );
  }
}
