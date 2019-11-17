// @flow

import autoBind from "auto-bind";

import type { Logger as LoggerInterface } from "../../interfaces/Logger";
import type { LoggerBreadcrumbs } from "../../interfaces/LoggerBreadcrumbs";
import type { LogSeverityEnum } from "../../types/LogSeverityEnum";

export default class Logger implements LoggerInterface {
  constructor() {
    autoBind(this);
  }

  emergency(breadcrumbs: LoggerBreadcrumbs, message: string): Promise<void> {
    return this.log(breadcrumbs, "emergency", message);
  }

  alert(breadcrumbs: LoggerBreadcrumbs, message: string): Promise<void> {
    return this.log(breadcrumbs, "alert", message);
  }

  critical(breadcrumbs: LoggerBreadcrumbs, message: string): Promise<void> {
    return this.log(breadcrumbs, "critical", message);
  }

  error(breadcrumbs: LoggerBreadcrumbs, message: string): Promise<void> {
    return this.log(breadcrumbs, "error", message);
  }

  warning(breadcrumbs: LoggerBreadcrumbs, message: string): Promise<void> {
    return this.log(breadcrumbs, "warning", message);
  }

  notice(breadcrumbs: LoggerBreadcrumbs, message: string): Promise<void> {
    return this.log(breadcrumbs, "notice", message);
  }

  info(breadcrumbs: LoggerBreadcrumbs, message: string): Promise<void> {
    return this.log(breadcrumbs, "info", message);
  }

  debug(breadcrumbs: LoggerBreadcrumbs, message: string): Promise<void> {
    return this.log(breadcrumbs, "debug", message);
  }

  async log(breadcrumbs: LoggerBreadcrumbs, severity: LogSeverityEnum, message: string): Promise<void> {
    const baseMessage = `[DD][${severity}] ${message}`;

    if ("debug" === severity) {
      console.info(`%c${baseMessage}`, "background-color: #222; color: tomato");
    } else {
      console.log(baseMessage);
    }
  }
}