import type { MainLoopUpdatable } from "../../framework/src/MainLoopUpdatable.interface";
import type { RegistersMessagePort } from "../../framework/src/RegistersMessagePort.interface";
import type { Service } from "../../framework/src/Service.interface";

export interface StatsCollector extends MainLoopUpdatable, RegistersMessagePort, Service {}
