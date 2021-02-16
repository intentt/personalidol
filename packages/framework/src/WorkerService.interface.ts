import type { MainLoopUpdatable } from "./MainLoopUpdatable.interface";
import type { Service } from "./Service.interface";

export interface WorkerService extends MainLoopUpdatable, Service {
  isWorkerService: true;

  ready(): Promise<void>;
}
