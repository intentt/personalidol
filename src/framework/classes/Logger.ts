import { Logger as LoggerInterface } from "src/framework/interfaces/Logger";
import { LoggerBreadcrumbs } from "src/framework/interfaces/LoggerBreadcrumbs";
import { LogSeverityEnum } from "src/framework/types/LogSeverityEnum";

export default abstract class Logger implements LoggerInterface {
  abstract emergency(breadcrumbs: LoggerBreadcrumbs, message: string): Promise<void>;

  abstract alert(breadcrumbs: LoggerBreadcrumbs, message: string): Promise<void>;

  abstract critical(breadcrumbs: LoggerBreadcrumbs, message: string): Promise<void>;

  abstract error(breadcrumbs: LoggerBreadcrumbs, message: string): Promise<void>;

  abstract warning(breadcrumbs: LoggerBreadcrumbs, message: string): Promise<void>;

  abstract notice(breadcrumbs: LoggerBreadcrumbs, message: string): Promise<void>;

  abstract info(breadcrumbs: LoggerBreadcrumbs, message: string): Promise<void>;

  abstract debug(breadcrumbs: LoggerBreadcrumbs, message: string): Promise<void>;

  abstract log(breadcrumbs: LoggerBreadcrumbs, severity: LogSeverityEnum, message: string): Promise<void>;
}