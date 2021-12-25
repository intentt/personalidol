import { Fragment, h } from "preact";

import { DOMElementView } from "../../dom-renderer/src/DOMElementView";
import { isCanvasTransferControlToOffscreenSupported } from "../../framework/src/isCanvasTransferControlToOffscreenSupported";
import { isCustomEvent } from "../../framework/src/isCustomEvent";
import { unary } from "../../framework/src/unary";

import { CameraParameters } from "./CameraParameters.enum";
import { DOMBreakpoints } from "./DOMBreakpoints.enum";
import { UserSettingsDynamicLightQualityMap } from "./UserSettingsDynamicLightQualityMap.enum";

import type { TickTimerState } from "../../framework/src/TickTimerState.type";

import type { DOMElementViewContext } from "./DOMElementViewContext.type";
import type { MessageUIStateChange } from "./MessageUIStateChange.type";

const isOffscreenCanvasSupported = isCanvasTransferControlToOffscreenSupported();

const _css = `
  :host {
    all: initial;
  }

  *, * * {
    box-sizing: border-box;
  }

  dl {
    display: grid;
    grid-gap: 0.8rem;
    margin: 0;
  }

  dd {
    font-weight: normal;
    margin: 0;
  }

  dt {
    font-weight: 700;
    margin-bottom: -0.8rem;
  }

  h1 {
    align-items: center;
    background-color: black;
    border-bottom: 1px solid white;
    display: grid;
    font-family: Lora, serif;
    font-size: 3.2rem;
    font-weight: normal;
    grid-template-columns: 1fr auto;
    line-height: 1;
    margin: 0;
    padding-bottom: 1.6rem;
    position: sticky;
    top: 0;
  }

  h2 {
    font-family: Karla, sans-serif;
    font-size: 1.6rem;
    font-weight: bold;
    margin: 0;
    padding-bottom: 1.6rem;
    padding-top: 3.2rem;
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

  .user-settings__form {
    align-items: center;
    display: grid;
    font-family: Karla, sans-serif;
    grid-row-gap: 3rem;
  }

  .user-settings__warning {
    color: yellow;
  }

  @media (max-width: ${DOMBreakpoints.TabletMax}px) {
    .user-settings__form {
      grid-template-columns: 1fr;
    }
  }

  @media (min-width: ${DOMBreakpoints.DesktopMin}px) {
    .user-settings__form {
      grid-column-gap: 2rem;
      grid-template-columns: 1fr 1fr;
    }
  }
`;

const _booleanEdgeLabels: ["", ""] = ["", ""];

const _booleanLabels: [string, string] = ["ui:user_settings_label_off", "ui:user_settings_label_on"];
const _booleanValues: [false, true] = [false, true];

const _cameraTypeLabels: [string, string] = [
  "ui:user_settings_label_camera_orthographic",
  "ui:user_settings_label_camera_perspective",
];
const _cameraTypeValues = ["OrthographicCamera", "PerspectiveCamera"];

const _lightQualityLabels = [
  "ui:user_settings_label_off",
  "ui:user_settings_quality_low",
  "ui:user_settings_quality_medium",
  "ui:user_settings_quality_high",
];
const _lightQualityValues = [
  UserSettingsDynamicLightQualityMap.None,
  UserSettingsDynamicLightQualityMap.Low,
  UserSettingsDynamicLightQualityMap.Medium,
  UserSettingsDynamicLightQualityMap.High,
];

const _lowHighEdgeLabels: [string, string] = ["ui:user_settings_quality_low", "ui:user_settings_quality_high"];

const _pixelRatioLabels = ["25%", "50%", "75%", "100%"];
const _pixelRatioValues = [0.25, 0.5, 0.75, 1];

const _shadowMapSizeLabels = ["512", "1024", "2048", "4096"];
const _shadowMapSizeValues = [512, 1024, 2048, 4096];

export class UserSettingsDOMElementView extends DOMElementView<DOMElementViewContext> {
  public static css: string = _css;
  public userSettingsLastAcknowledgedVersion: number = -1;

  private _isUseOffscreenCanvasChanged: boolean = false;
  private _unaryT: (key: string) => string;

  constructor() {
    super();

    this._unaryT = unary(this.t);

    this.close = this.close.bind(this);
    this.onCameraTypeChange = this.onCameraTypeChange.bind(this);
    this.onCameraZoomAmountChange = this.onCameraZoomAmountChange.bind(this);
    this.onDynamicLightQualityChange = this.onDynamicLightQualityChange.bind(this);
    this.onOverlayClick = this.onOverlayClick.bind(this);
    this.onPixelRatioChange = this.onPixelRatioChange.bind(this);
    this.onShadowMapSizeChange = this.onShadowMapSizeChange.bind(this);
    this.onShowStatsReporterChange = this.onShowStatsReporterChange.bind(this);
    this.onUseOffscreenCanvasChanged = this.onUseOffscreenCanvasChanged.bind(this);
    this.onUseShadowsChange = this.onUseShadowsChange.bind(this);
  }

  close() {
    const message: MessageUIStateChange = {
      isUserSettingsScreenOpened: false,
    };

    this.context.uiMessagePort.postMessage(message);
  }

  disconnectedCallback() {
    super.disconnectedCallback();

    this.close();
  }

  onCameraZoomAmountChange(evt: Event) {
    if (!isCustomEvent(evt)) {
      throw new Error("Expected custom event with:: 'onCameraZoomAmountChange'.");
    }

    this.context.userSettings.cameraZoomAmount = Number(evt.detail);
    this.context.userSettings.version += 1;
  }

  onCameraTypeChange(evt: Event) {
    if (!isCustomEvent(evt)) {
      throw new Error("Expected custom event with:: 'onCameraTypeChange'.");
    }

    if (!_cameraTypeValues.includes(evt.detail)) {
      throw new Error(`Unexpected camera type: "${evt.detail}"`);
    }

    this.context.userSettings.cameraType = evt.detail;
    this.context.userSettings.version += 1;
  }

  onDynamicLightQualityChange(evt: Event) {
    if (!isCustomEvent(evt)) {
      throw new Error("Expected custom event with:: 'onDynamicLightQualityChange'.");
    }

    if (!_lightQualityValues.includes(evt.detail)) {
      throw new Error(`Unexpected shadowmap size: "${evt.detail}"`);
    }

    this.context.userSettings.dynamicLightQuality = evt.detail;
    this.context.userSettings.version += 1;
  }

  onPixelRatioChange(evt: Event) {
    if (!isCustomEvent(evt)) {
      throw new Error("Expected custom event with:: 'onPixelRatioChange'.");
    }

    this.context.userSettings.pixelRatio = Number(evt.detail);
    this.context.userSettings.version += 1;
  }

  onShadowMapSizeChange(evt: Event) {
    if (!isCustomEvent(evt)) {
      throw new Error("Expected custom event with:: 'onShadowMapSizeChange'.");
    }

    if (!_shadowMapSizeValues.includes(evt.detail)) {
      throw new Error(`Unexpected shadowmap size: "${evt.detail}"`);
    }

    this.context.userSettings.shadowMapSize = evt.detail;
    this.context.userSettings.version += 1;
  }

  onShowStatsReporterChange(evt: Event) {
    if (!isCustomEvent(evt)) {
      throw new Error("Expected custom event with:: 'onShowStatsReporterChange'.");
    }

    this.context.userSettings.showStatsReporter = Boolean(evt.detail);
    this.context.userSettings.version += 1;
  }

  onUseOffscreenCanvasChanged(evt: Event) {
    if (!isCustomEvent(evt)) {
      throw new Error("Expected custom event with:: 'onUseOffscreenCanvasChanged'.");
    }

    this._isUseOffscreenCanvasChanged = true;
    this.context.userSettings.useOffscreenCanvas = Boolean(evt.detail);
    this.context.userSettings.version += 1;
  }

  onUseShadowsChange(evt: Event) {
    if (!isCustomEvent(evt)) {
      throw new Error("Expected custom event with:: 'onUseShadowsChange'.");
    }

    this.context.userSettings.useShadows = Boolean(evt.detail);
    this.context.userSettings.version += 1;
  }

  onOverlayClick(evt: MouseEvent) {
    const target = evt.target;

    if (!target || !(target instanceof HTMLElement) || target.id !== "options") {
      return;
    }

    this.close();
  }

  beforeRender(delta: number, elapsedTime: number, tickTimerState: TickTimerState): void {
    super.beforeRender(delta, elapsedTime, tickTimerState);

    if (this.needsRender) {
      return;
    }

    this.needsRender = this.userSettingsLastAcknowledgedVersion < this.context.userSettings.version;
    this.userSettingsLastAcknowledgedVersion = this.context.userSettings.version;
  }

  render(delta: number) {
    const _booleanLabelsTranslated: [string, string] = _booleanLabels.map(this._unaryT) as [string, string];
    const _cameraTypeLabelsTranslated: [string, string] = _cameraTypeLabels.map(this._unaryT) as [string, string];
    const _lowHighEdgeLabelsTranslated: [string, string] = _lowHighEdgeLabels.map(this._unaryT) as [string, string];

    return (
      <pi-settings-backdrop onDirectClick={this.close}>
        <h1>
          {this.t("ui:user_settings_options")}
          <pi-button onClick={this.close}>{this.t("ui:user_settings_done").toLocaleLowerCase()}</pi-button>
        </h1>
        <h2>{this.t("ui:user_settings_graphics")}</h2>
        <form class="user-settings__form">
          <dl>
            <dt>{this.t("ui:user_settings_rendering_resolution")}</dt>
            <dd>{this.t("ui:user_settings_rendering_resolution_description")}</dd>
          </dl>
          <pi-form-radio-buttons
            currentValue={this.context.userSettings.pixelRatio}
            edgeLabels={_lowHighEdgeLabelsTranslated}
            labels={_pixelRatioLabels}
            onChange={this.onPixelRatioChange}
            values={_pixelRatioValues}
          />
          <dl>
            <dt>{this.t("ui:user_settings_dynamic_light_quality")}</dt>
            <dd>{this.t("ui:user_settings_dynamic_light_quality_description")}</dd>
          </dl>
          <pi-form-radio-buttons
            currentValue={this.context.userSettings.dynamicLightQuality}
            edgeLabels={_booleanEdgeLabels}
            labels={_lightQualityLabels.map(this._unaryT)}
            onChange={this.onDynamicLightQualityChange}
            values={_lightQualityValues}
          />
          <dl>
            <dt>{this.t("ui:user_settings_use_shadows")}</dt>
            <dd>{this.t("ui:user_settings_use_shadows_description")}</dd>
          </dl>
          <pi-form-radio-buttons
            currentValue={this.context.userSettings.useShadows}
            edgeLabels={_booleanEdgeLabels}
            labels={_booleanLabelsTranslated}
            onChange={this.onUseShadowsChange}
            values={_booleanValues}
          />
          <dl>
            <dt>{this.t("ui:user_settings_shadow_map_size")}</dt>
            <dd>{this.t("ui:user_settings_shadow_map_size_description")}</dd>
          </dl>
          <pi-form-radio-buttons
            currentValue={this.context.userSettings.shadowMapSize}
            edgeLabels={_lowHighEdgeLabelsTranslated}
            labels={_shadowMapSizeLabels}
            onChange={this.onShadowMapSizeChange}
            values={_shadowMapSizeValues}
          />
        </form>
        <h2>{this.t("ui:user_settings_camera")}</h2>
        <form class="user-settings__form">
          <dl>
            <dt>{this.t("ui:user_settings_camera_type")}</dt>
            <dd>{this.t("ui:user_settings_camera_type_description")}</dd>
          </dl>
          <pi-form-radio-buttons
            currentValue={this.context.userSettings.cameraType}
            edgeLabels={_booleanEdgeLabels}
            labels={_cameraTypeLabelsTranslated}
            onChange={this.onCameraTypeChange}
            values={_cameraTypeValues}
          />
          <dl>
            <dt>{this.t("ui:user_settings_camera_zoom_amount")}</dt>
            <dd>{this.t("ui:user_settings_camera_zoom_amount_description")}</dd>
          </dl>
          <pi-form-range-slider
            max={CameraParameters.ZOOM_MIN}
            min={CameraParameters.ZOOM_MAX}
            onChange={this.onCameraZoomAmountChange}
            step={CameraParameters.ZOOM_STEP}
            value={Math.round(this.context.userSettings.cameraZoomAmount)}
          />
        </form>
        {isOffscreenCanvasSupported && (
          <Fragment>
            <h2>{this.t("ui:user_settings_experimental")}</h2>
            <form class="user-settings__form">
              <dl>
                <dt>{this.t("ui:user_settings_use_offscreen_canvas")}</dt>
                <dd>{this.t("ui:user_settings_use_offscreen_canvas_description")}</dd>
                {this._isUseOffscreenCanvasChanged && (
                  <Fragment>
                    <dd class="user-settings__warning">{this.t("ui:user_settings_required_reload_to_take_effect")}</dd>
                    <pi-reload-button />
                  </Fragment>
                )}
              </dl>
              <pi-form-radio-buttons
                currentValue={this.context.userSettings.useOffscreenCanvas}
                disabled={!isOffscreenCanvasSupported}
                edgeLabels={_booleanEdgeLabels}
                labels={_booleanLabelsTranslated}
                onChange={this.onUseOffscreenCanvasChanged}
                values={_booleanValues}
              />
            </form>
          </Fragment>
        )}
        <h2>{this.t("ui:user_settings_utilities")}</h2>
        <form class="user-settings__form">
          <dl>
            <dt>{this.t("ui:user_settings_show_rendering_stats")}</dt>
            <dd>{this.t("ui:user_settings_show_rendering_stats_description")}</dd>
          </dl>
          <pi-form-radio-buttons
            currentValue={this.context.userSettings.showStatsReporter}
            edgeLabels={_booleanEdgeLabels}
            labels={_booleanLabelsTranslated}
            onChange={this.onShowStatsReporterChange}
            values={_booleanValues}
          />
        </form>
      </pi-settings-backdrop>
    );
  }
}
