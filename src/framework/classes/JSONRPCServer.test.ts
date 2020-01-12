import CancelToken from "src/framework/classes/CancelToken";
import JSONRPCRequest from "src/framework/classes/JSONRPCRequest";
import JSONRPCResponseData from "src/framework/classes/JSONRPCResponseData";
import JSONRPCServer from "src/framework/classes/JSONRPCServer";
import LoggerBreadcrumbs from "src/framework/classes/LoggerBreadcrumbs";
import { default as JSONRPCErrorResponse, unobjectify as unobjectifyJSONRPCErrorResponse } from "src/framework/classes/JSONRPCResponse/Error";
import { default as JSONRPCGeneratorChunkResponse, unobjectify as unobjectifyJSONRPCGeneratorChunkResponse } from "src/framework/classes/JSONRPCResponse/GeneratorChunk";

test("incoming requests are processed", async function() {
  const loggerBreadcrumbs = new LoggerBreadcrumbs();
  const postMessageMock = jest.fn();
  const jsonRpcRequest = new JSONRPCRequest("1", "test-promise", "promise", []);
  const jsonRpcServer = new JSONRPCServer(loggerBreadcrumbs, postMessageMock);

  const cancelToken = new CancelToken(loggerBreadcrumbs);

  jsonRpcServer.returnPromise(cancelToken, "test-promise", async function() {
    cancelToken.cancel(loggerBreadcrumbs.add("promise-request"));

    return new JSONRPCResponseData(null);
  });

  await jsonRpcServer.handleRequest(jsonRpcRequest);

  return cancelToken.whenCanceled();
}, 100);

test("produces a generator", async function() {
  const loggerBreadcrumbs = new LoggerBreadcrumbs();
  const postMessageMock = jest.fn();
  const jsonRpcRequest = new JSONRPCRequest("1", "test-generator", "generator", []);
  const jsonRpcServer = new JSONRPCServer(loggerBreadcrumbs, postMessageMock);

  const cancelToken = new CancelToken(loggerBreadcrumbs);

  jsonRpcServer.returnGenerator(cancelToken, "test-generator", async function*() {
    for (let i = 0; i < 4; i += 1) {
      yield new JSONRPCResponseData(i);
    }

    cancelToken.cancel(loggerBreadcrumbs.add("generator-request"));
  });

  await jsonRpcServer.handleRequest(jsonRpcRequest);
  await cancelToken.whenCanceled();

  expect(postMessageMock.mock.calls).toHaveLength(4);

  const response0 = unobjectifyJSONRPCGeneratorChunkResponse(loggerBreadcrumbs, postMessageMock.mock.calls[0][0]);

  expect(response0.getId()).toBe("1");
  expect(response0.getData().getResult()).toBe(0);

  const response1 = unobjectifyJSONRPCGeneratorChunkResponse(loggerBreadcrumbs, postMessageMock.mock.calls[1][0]);

  expect(response0.getNext()).toBe(response1.getChunk());
  expect(response1.getId()).toBe("1");
  expect(response1.getData().getResult()).toBe(1);

  const response2 = unobjectifyJSONRPCGeneratorChunkResponse(loggerBreadcrumbs, postMessageMock.mock.calls[2][0]);

  expect(response1.getNext()).toBe(response2.getChunk());
  expect(response2.getId()).toBe("1");
  expect(response2.getData().getResult()).toBe(2);

  const response3 = unobjectifyJSONRPCGeneratorChunkResponse(loggerBreadcrumbs, postMessageMock.mock.calls[3][0]);

  expect(response2.getNext()).toBe(response3.getChunk());
  expect(response3.getId()).toBe("1");
  expect(response3.hasNext()).toBe(false);
  expect(response3.getData().getResult()).toBe(3);
}, 100);

test("fails when method does not exist", async function() {
  const loggerBreadcrumbs = new LoggerBreadcrumbs();
  const postMessageMock = jest.fn();
  const jsonRpcRequest = new JSONRPCRequest("1", "test-promise", "promise", []);
  const jsonRpcServer = new JSONRPCServer(loggerBreadcrumbs, postMessageMock);

  await jsonRpcServer.handleRequest(jsonRpcRequest);

  expect(postMessageMock.mock.calls).toHaveLength(1);

  const error = unobjectifyJSONRPCErrorResponse(loggerBreadcrumbs, postMessageMock.mock.calls[0][0]);

  expect(error.getId()).toBe("1");
  expect(error.getMethod()).toBe("test-promise");
  expect(error.getData().getResult()).toBe("Method not found");
}, 100);
