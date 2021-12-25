import type { RegistersMessagePort } from "../../framework/src/RegistersMessagePort.interface";
import type { Service } from "../../framework/src/Service.interface";

export interface AtlasService extends RegistersMessagePort, Service {}
