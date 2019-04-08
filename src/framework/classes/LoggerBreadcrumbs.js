// @flow

import type { LoggerBreadcrumbs as LoggerBreadcrumbsInterface } from "../interfaces/LoggerBreadcrumbs";

export default class LoggerBreadcrumbs implements LoggerBreadcrumbsInterface {
  +breadcrumbs: Array<string>;
  +loggerBreadCrumbsMemo: Map<string, LoggerBreadcrumbsInterface>;

  constructor(
    breadcrumbs: Array<string> = ["root"],
    loggerBreadCrumbsMemo: Map<string, LoggerBreadcrumbsInterface> = new Map()
  ) {
    this.breadcrumbs = breadcrumbs;
    this.loggerBreadCrumbsMemo = loggerBreadCrumbsMemo;
  }

  add(breadcrumb: string): LoggerBreadcrumbsInterface {
    const asString = this.asString();
    const memoized = this.loggerBreadCrumbsMemo.get(asString);

    if (memoized) {
      return memoized;
    }

    const added = new LoggerBreadcrumbs(
      this.breadcrumbs.concat(breadcrumb),
      this.loggerBreadCrumbsMemo
    );

    this.loggerBreadCrumbsMemo.set(asString, added);

    return added;
  }

  asString(): string {
    return this.breadcrumbs.join("/");
  }
}
