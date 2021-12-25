import type { DOMElementsLookup as BaseDOMElementsLookup } from "../../dom-renderer/src/DOMElementsLookup.type";

import type { ButtonDOMElementView } from "./ButtonDOMElementView";
import type { FatalErrorDOMElementView } from "./FatalErrorDOMElementView";
import type {
  FormRadioButtonsDOMElementView,
  Attributes as FormRadioButtonsDOMElementAttributes,
} from "./FormRadioButtonsDOMElementView";
import type {
  FormRangeSliderDOMElementView,
  Attributes as FormRangeSliderDOMElementAttributes,
} from "./FormRangeSliderDOMElementView";
import type { InGameMenuDOMElementView } from "./InGameMenuDOMElementView";
import type { InGameMenuTriggerDOMElementView } from "./InGameMenuTriggerDOMElementView";
import type { LanguageSettingsDOMElementView } from "./LanguageSettingsDOMElementView";
import type {
  MainMenuButtonDOMElementView,
  Attributes as MainMenuButtonDOMElementAttributes,
} from "./MainMenuButtonDOMElementView";
import type { MainMenuDOMElementView } from "./MainMenuDOMElementView";
import type { MainMenuLanguageButtonDOMElementView } from "./MainMenuLanguageButtonDOMElementView";
import type { MainMenuLayoutDOMElementView } from "./MainMenuLayoutDOMElementView";
import type { MainMenuUserSettingsButtonDOMElementView } from "./MainMenuUserSettingsButtonDOMElementView";
import type { MousePointerLayerDOMElementView } from "./MousePointerLayerDOMElementView";
import type { ObjectInteractionsDOMElementView } from "./ObjectInteractionsDOMElementView";
import type { ObjectLabelDOMElementView } from "./ObjectLabelDOMElementView";
import type {
  ProgressManagerStateDOMElementView,
  Attributes as ProgressManagerStateDOMElementAttributes,
} from "./ProgressManagerStateDOMElementView";
import type { ReloadButtonDOMElementView } from "./ReloadButtonDOMElementView";
import type {
  SettingsBackdropDOMElementView,
  Attributes as SettingsBackdropDOMElementAttributes,
} from "./SettingsBackdropDOMElementView";
import type { UserSettingsDOMElementView } from "./UserSettingsDOMElementView";
import type { VirtualJoystickLayerDOMElementView } from "./VirtualJoystickLayerDOMElementView";

declare global {
  namespace preact.JSX {
    interface IntrinsicElements {
      "pi-button": HTMLAttributes<ButtonDOMElementView>;
      "pi-form-radio-buttons": HTMLAttributes<FormRadioButtonsDOMElementView<any>> &
        FormRadioButtonsDOMElementAttributes<any>;
      "pi-form-range-slider": HTMLAttributes<FormRangeSliderDOMElementView> & FormRangeSliderDOMElementAttributes;
      "pi-main-menu-button": HTMLAttributes<MainMenuButtonDOMElementView> & MainMenuButtonDOMElementAttributes;
      "pi-main-menu-language-button": HTMLAttributes<MainMenuLanguageButtonDOMElementView>;
      "pi-main-menu-layout": HTMLAttributes<MainMenuLayoutDOMElementView>;
      "pi-main-menu-user-settings-button": HTMLAttributes<MainMenuUserSettingsButtonDOMElementView>;
      "pi-progress-manager-state": HTMLAttributes<ProgressManagerStateDOMElementView> &
        ProgressManagerStateDOMElementAttributes;
      "pi-reload-button": HTMLAttributes<ReloadButtonDOMElementView>;
      "pi-settings-backdrop": HTMLAttributes<SettingsBackdropDOMElementView> & SettingsBackdropDOMElementAttributes;
    }
  }
}

export type DOMElementsLookup = BaseDOMElementsLookup & {
  "pi-button": typeof ButtonDOMElementView;
  "pi-fatal-error": typeof FatalErrorDOMElementView;
  "pi-form-radio-buttons": typeof FormRadioButtonsDOMElementView;
  "pi-form-range-slider": typeof FormRangeSliderDOMElementView;
  "pi-in-game-menu": typeof InGameMenuDOMElementView;
  "pi-in-game-menu-trigger": typeof InGameMenuTriggerDOMElementView;
  "pi-language-settings": typeof LanguageSettingsDOMElementView;
  "pi-main-menu": typeof MainMenuDOMElementView;
  "pi-main-menu-button": typeof MainMenuButtonDOMElementView;
  "pi-main-menu-language-button": typeof MainMenuLanguageButtonDOMElementView;
  "pi-main-menu-layout": typeof MainMenuLayoutDOMElementView;
  "pi-main-menu-user-settings-button": typeof MainMenuUserSettingsButtonDOMElementView;
  "pi-mouse-pointer-layer": typeof MousePointerLayerDOMElementView;
  "pi-object-interactions": typeof ObjectInteractionsDOMElementView;
  "pi-object-label": typeof ObjectLabelDOMElementView;
  "pi-progress-manager-state": typeof ProgressManagerStateDOMElementView;
  "pi-reload-button": typeof ReloadButtonDOMElementView;
  "pi-settings-backdrop": typeof SettingsBackdropDOMElementView;
  "pi-user-settings": typeof UserSettingsDOMElementView;
  "pi-virtual-joystick-layer": typeof VirtualJoystickLayerDOMElementView;
};
