import { domElementsLookup as baseDomElementsLookup } from "../../dom-renderer/src/domElementsLookup";

import { ButtonDOMElementView } from "./ButtonDOMElementView";
import { DOMZIndex } from "./DOMZIndex.enum";
import { FatalErrorDOMElementView } from "./FatalErrorDOMElementView";
import { FormRadioButtonsDOMElementView } from "./FormRadioButtonsDOMElementView";
import { FormRangeSliderDOMElementView } from "./FormRangeSliderDOMElementView";
import { InGameMenuDOMElementView } from "./InGameMenuDOMElementView";
import { InGameMenuTriggerDOMElementView } from "./InGameMenuTriggerDOMElementView";
import { LanguageSettingsDOMElementView } from "./LanguageSettingsDOMElementView";
import { MainMenuButtonDOMElementView } from "./MainMenuButtonDOMElementView";
import { MainMenuDOMElementView } from "./MainMenuDOMElementView";
import { MainMenuLanguageButtonDOMElementView } from "./MainMenuLanguageButtonDOMElementView";
import { MainMenuLayoutDOMElementView } from "./MainMenuLayoutDOMElementView";
import { MainMenuUserSettingsButtonDOMElementView } from "./MainMenuUserSettingsButtonDOMElementView";
import { MousePointerLayerDOMElementView } from "./MousePointerLayerDOMElementView";
import { ObjectInteractionsDOMElementView } from "./ObjectInteractionsDOMElementView";
import { ObjectLabelDOMElementView } from "./ObjectLabelDOMElementView";
import { ProgressManagerStateDOMElementView } from "./ProgressManagerStateDOMElementView";
import { ReloadButtonDOMElementView } from "./ReloadButtonDOMElementView";
import { SettingsBackdropDOMElementView } from "./SettingsBackdropDOMElementView";
import { UserSettingsDOMElementView } from "./UserSettingsDOMElementView";
import { VirtualJoystickLayerDOMElementView } from "./VirtualJoystickLayerDOMElementView";

import type { DOMElementsLookup } from "./DOMElementsLookup.type";

baseDomElementsLookup["pi-stats-reporter"].zIndex = DOMZIndex.StatsReporter;

export const domElementsLookup: DOMElementsLookup = {
  ...baseDomElementsLookup,

  "pi-button": ButtonDOMElementView,
  "pi-fatal-error": FatalErrorDOMElementView,
  "pi-form-radio-buttons": FormRadioButtonsDOMElementView,
  "pi-form-range-slider": FormRangeSliderDOMElementView,
  "pi-in-game-menu": InGameMenuDOMElementView,
  "pi-in-game-menu-trigger": InGameMenuTriggerDOMElementView,
  "pi-language-settings": LanguageSettingsDOMElementView,
  "pi-main-menu": MainMenuDOMElementView,
  "pi-main-menu-button": MainMenuButtonDOMElementView,
  "pi-main-menu-language-button": MainMenuLanguageButtonDOMElementView,
  "pi-main-menu-layout": MainMenuLayoutDOMElementView,
  "pi-main-menu-user-settings-button": MainMenuUserSettingsButtonDOMElementView,
  "pi-mouse-pointer-layer": MousePointerLayerDOMElementView,
  "pi-object-interactions": ObjectInteractionsDOMElementView,
  "pi-object-label": ObjectLabelDOMElementView,
  "pi-progress-manager-state": ProgressManagerStateDOMElementView,
  "pi-reload-button": ReloadButtonDOMElementView,
  "pi-settings-backdrop": SettingsBackdropDOMElementView,
  "pi-user-settings": UserSettingsDOMElementView,
  "pi-virtual-joystick-layer": VirtualJoystickLayerDOMElementView,
};
