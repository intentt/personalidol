import type { i18n } from "i18next";

import type { Preloadable } from "../../framework/src/Preloadable.interface";
import type { RegistersMessagePort } from "../../framework/src/RegistersMessagePort.interface";
import type { Service } from "../../framework/src/Service.interface";

export interface InternationalizationService extends Preloadable, RegistersMessagePort, Service {
  i18next: i18n;
}
