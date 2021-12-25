import { h } from "preact";

import { DOMElementView } from "../../dom-renderer/src/DOMElementView";

import type { MessageProgressError } from "../../framework/src/MessageProgressError.type";

import type { DOMElementViewContext } from "./DOMElementViewContext.type";

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

  .error-report {
    display: grid;
    overflow-wrap: break-word;
  }
`;

export class FatalErrorDOMElementView extends DOMElementView<DOMElementViewContext> {
  public static css: string = _css;

  private _errors: ReadonlyArray<MessageProgressError> = [];

  set errors(errors: ReadonlyArray<MessageProgressError>) {
    this.needsRender = true;
    this._errors = errors;
  }

  constructor() {
    super();

    this.renderMessageProgressError = this.renderMessageProgressError.bind(this);
  }

  renderMessageProgressError(error: MessageProgressError) {
    return (
      <div class="error-report">
        <span>resource_type: {error.type}</span>
        <span>resource_uri: {error.uri}</span>
        <span>resource_id: {error.id}</span>
        <span>resource_error_message: {error.message}</span>
      </div>
    );
  }

  render() {
    return (
      <main>
        <h1>Error</h1>
        <p>
          Unexpected error occurred (yes, there are expected, foreseeable, recoverable errors). We are really, really
          sorry about that.
        </p>
        <p>
          We have automated bug reporting systems, so we most probably will be soon aware that this happened and take
          some appropriate actions to mitigate such things in the future. It still makes sense to send us this error if
          you need some personal support or want to provide some additional details about your setup. Our bug reporting
          systems do not store any kind of your personal data and are not linked in any way to your account, so we can't
          reach out to you even if we wanted to.
        </p>
        <p>
          In the meantime you can try some obvious things like reloading the page, checking internet connection, etc.
          Again, we are really, really, really sorry and deeply ashamed about this. If there is anything that can bring
          us peace, it is your forgiveness.
        </p>
        {this._errors.map(this.renderMessageProgressError)}
      </main>
    );
  }
}
