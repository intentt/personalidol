import { h } from "preact";

import { DOMElementView } from "@personalidol/dom-renderer/src/DOMElementView";
import { ReplaceableStyleSheet } from "@personalidol/dom-renderer/src/ReplaceableStyleSheet";

import type { ProgressError } from "@personalidol/loading-manager/src/ProgressError.type";
import type { TickTimerState } from "@personalidol/framework/src/TickTimerState.type";

const _css = `
  :host {
    all: initial;
  }

  *, * * {
    box-sizing: border-box;
  }

  h1 {
    font-size: 1rem;
  }

  div,
  main,
  p {
    font-family: monospace;
    font-size: 1rem;
    letter-spacing: 0.1ch;
    line-height: 1.6;
  }

  main {
    background-color: rgba(0, 0, 0, 0.6);
    bottom: 1.6rem;
    color: white;
    left: 50%;
    max-width: 80ch;
    overflow-y: auto;
    pointer-events: auto;
    padding: 0.8rem;
    position: absolute;
    user-select: text;
    top: 1.6rem;
    transform: translateX(-50%);
    width: calc(100vw - 3.2rem);
  }

  main p + p {
    margin-top: 1rem;
  }

  #error-report {
    display: grid;
    overflow-wrap: break-word;
  }
`;

export class FatalErrorDOMElementView extends DOMElementView {
  constructor() {
    super();

    this.nameable.name = "FatalErrorDOMElementView";
    this.styleSheet = ReplaceableStyleSheet(this.shadow, _css);
  }

  update(delta: number, elapsedTime: number, tickTimerState: TickTimerState) {
    super.update(delta, elapsedTime, tickTimerState);

    if (this.propsLastUpdate < this.viewLastUpdate) {
      return;
    }

    this.needsRender = true;
    this.viewLastUpdate = tickTimerState.currentTick;
  }

  render() {
    const progressError: undefined | ProgressError = this.props.progressError;

    if (!progressError) {
      return null;
    }

    return (
      <main>
        <h1>Error</h1>
        <p>
          Unexpected error occurred (yes, there are expected, foreseeable,
            recoverable errors). We are really, really sorry about that.
        </p>
        <p>
          We have automated bug reporting systems, so we most probably will be
          soon aware that this happened and take some appropriate actions to
          mitigate such things in the future.
          It still makes sense to send us this error if you need some personal
          support or want to provide some additional details about your setup.
          Our bug reporting systems do not store any kind of your personal data
          and are not linked in any way to your account, so we can't reach out to
          you even if we wanted to.
        </p>
        <p>
          In the meantime you can try some obvious things like reloading the
          page, checking internet connection, etc. Again, we are really, really,
          really sorry and deeply ashamed about this. If there is anything that
          can bring us peace, it is your forgiveness.
        </p>
        <div id="error-report">
          <span id="item-resource-type">
            resource_type: {progressError.item.resourceType}
          </span>
          <span id="item-resource-uri">
            resource_uri: {progressError.item.resourceUri}
          </span>
          <span id="item-id">
            resource_id: {progressError.item.id}
          </span>
          <span id="error-message">
            resource_error_message: {progressError.error.message}
          </span>
          <span id="error-stack">
            resource_error_stack: {progressError.error.stack}
          </span>
        </div>
      </main>
    );
  }
}