// @flow

import * as React from "react";
import autoBind from "auto-bind";

type Props = {|
  name: string
|};

type State = {||};

export default class HudAsidePortraitIcon extends React.Component<
  Props,
  State
> {
  constructor(props: Props) {
    super(props);

    autoBind.react(this);
  }

  render() {
    return (
      <li className="dd__aside__portrait__status dd__frame dd__frame--inset">
        <a
          className="dd__aside__portrait__status__icon"
          href={`#/character/${this.props.name.toLowerCase()}`}
        >
          <img
            alt="prayer"
            className="dd__aside__portrait__status__icon__image"
            src="/assets/icon-prayer.svg"
          />
          <div className="dd__aside__portrait__status__icon__tooltip">
            {this.props.name} modli się śpiewając "Hymn do nieznanego boga"
          </div>
        </a>
      </li>
    );
  }
}