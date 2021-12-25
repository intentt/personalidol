import type { ViewState } from "../../views/src/ViewState.type";

export type EntityViewState = ViewState & {
  isObscuring: boolean;
};
