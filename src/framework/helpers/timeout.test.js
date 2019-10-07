// @flow

import CancelToken from "../classes/CancelToken";
import LoggerBreadcrumbs from "../classes/LoggerBreadcrumbs";
import timeout from "./timeout";

it("supports cancel token", async function() {
  const loggerBreadcrumbs = new LoggerBreadcrumbs();
  const cancelToken = new CancelToken(loggerBreadcrumbs);

  setTimeout(function() {
    cancelToken.cancel(loggerBreadcrumbs.add("setTimeout"));
  }, 25);

  // return timeout tick with the time that actually elapsed
  const tick = await timeout(cancelToken, 10000);

  expect(tick.isCanceled()).toBeTruthy();
}, 1000);

it("is immediately stopped with already paused cancel token", async function() {
  const loggerBreadcrumbs = new LoggerBreadcrumbs();
  const cancelToken = new CancelToken(loggerBreadcrumbs);

  cancelToken.cancel(loggerBreadcrumbs);

  const tick = await timeout(cancelToken, 10000);

  expect(tick.isCanceled()).toBeTruthy();
}, 1000);
