// @flow

import CancelToken from "./CancelToken";
import DedicatedWorkerGlobalScopeMock from "../mocks/DedicatedWorkerGlobalScope";
import LoggerBreadcrumbs from "./LoggerBreadcrumbs";
import WorkerClientController from "./WorkerClientController";
import WorkerContextController from "./WorkerContextController";
import WorkerMock from "../mocks/Worker";

import type { CancelToken as CancelTokenInterface } from "../interfaces/CancelToken";

it("hooks up into worker client", function() {
  class Methods {
    async someMethod(cancelToken: CancelTokenInterface, params) {
      return {
        baz: `${params.foo}.wooz`
      };
    }
  }

  const loggerBreadcrumbs = new LoggerBreadcrumbs();
  const cancelToken = new CancelToken(loggerBreadcrumbs);
  const worker = new WorkerMock("https://example.com/worker.js");
  const workerContext = new DedicatedWorkerGlobalScopeMock(worker);
  const workerContextController = new WorkerContextController<Methods>(
    workerContext
  );
  const workerController = new WorkerClientController<Methods>(worker);

  workerContextController.setMethods(new Methods());
  workerContextController.attach();

  const response = workerController.request(cancelToken, "someMethod", {
    foo: "bar"
  });

  return expect(response).resolves.toEqual({
    baz: "bar.wooz"
  });
}, 300);

it("handles worker exceptions", function() {
  class Methods {
    async someMethod(cancelToken: CancelTokenInterface) {
      throw new Error("foo");
    }
  }

  const loggerBreadcrumbs = new LoggerBreadcrumbs();
  const cancelToken = new CancelToken(loggerBreadcrumbs);
  const worker = new WorkerMock("https://example.com/worker.js");
  const workerContext = new DedicatedWorkerGlobalScopeMock(worker);
  const workerContextController = new WorkerContextController<Methods>(
    workerContext
  );
  const workerController = new WorkerClientController<Methods>(worker);

  workerContextController.setMethods(new Methods());
  workerContextController.attach();

  const response = workerController.request(cancelToken, "someMethod", {});

  return expect(response).rejects.toEqual({
    code: 0,
    message: "foo"
  });
}, 300);

it("allows to cancel requests", function() {
  class Methods {
    async someMethod(cancelToken: CancelTokenInterface, params) {
      return new Promise(function(resolve) {
        const timeoutId = setTimeout(resolve, 10000);

        cancelToken.onCancelled(() => clearTimeout(timeoutId));
      });
    }
  }

  const loggerBreadcrumbs = new LoggerBreadcrumbs();
  const cancelToken = new CancelToken(loggerBreadcrumbs);
  const worker = new WorkerMock("https://example.com/worker.js");
  const workerContext = new DedicatedWorkerGlobalScopeMock(worker);
  const workerContextController = new WorkerContextController<Methods>(
    workerContext
  );
  const workerController = new WorkerClientController<Methods>(worker);

  workerContextController.setMethods(new Methods());
  workerContextController.attach();

  const response = workerController.request(cancelToken, "someMethod", {
    foo: "bar"
  });

  setTimeout(function() {
    cancelToken.cancel();
  }, 100);

  return expect(response).rejects.toEqual({
    code: 1,
    message: "Token is cancelled."
  });
}, 300);

it("does not send request when cancel token is already cancelled", function() {
  class Methods {
    async someMethod(cancelToken: CancelTokenInterface, params) {
      return new Promise(function(resolve) {
        setTimeout(resolve, 10000);
      });
    }
  }

  const loggerBreadcrumbs = new LoggerBreadcrumbs();
  const cancelToken = new CancelToken(loggerBreadcrumbs);
  const worker = new WorkerMock("https://example.com/worker.js");
  const workerContext = new DedicatedWorkerGlobalScopeMock(worker);
  const workerContextController = new WorkerContextController<Methods>(
    workerContext
  );
  const workerController = new WorkerClientController<Methods>(worker);

  workerContextController.setMethods(new Methods());
  workerContextController.attach();

  cancelToken.cancel();

  const response = workerController.request(cancelToken, "someMethod", {
    foo: "bar"
  });

  return expect(response).rejects.toEqual({
    code: 1,
    message: "Token has been cancelled before sending request."
  });
}, 300);
