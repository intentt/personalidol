/// <reference lib="webworker" />

import autoBind from "auto-bind";

import JSONRPCResponseData from "src/framework/classes/JSONRPCResponseData";
import JSONRPCServerGeneratorBuffer from "src/framework/classes/JSONRPCServerGeneratorBuffer";
import { default as CanceledException } from "src/framework/classes/Exception/CancelToken/Canceled";
import { default as JSONRPCErrorResponse } from "src/framework/classes/JSONRPCResponse/Error";
import { default as JSONRPCPromiseResponse } from "src/framework/classes/JSONRPCResponse/Promise";
import { default as JSONRPCRequest, unobjectify as unobjectifyJSONRPCRequest } from "src/framework/classes/JSONRPCRequest";

import { CancelToken } from "src/framework/interfaces/CancelToken";
import { JSONRPCGeneratorChunkResponse as JSONRPCGeneratorChunkResponseInterface } from "src/framework/interfaces/JSONRPCGeneratorChunkResponse";
import { JSONRPCRequest as JSONRPCRequestInterface } from "src/framework/interfaces/JSONRPCRequest";
import { JSONRPCResponse } from "src/framework/interfaces/JSONRPCResponse";
import { JSONRPCResponseData as JSONRPCResponseDataInterface } from "src/framework/interfaces/JSONRPCResponseData";
import { JSONRPCServer as JSONRPCServerInterface } from "src/framework/interfaces/JSONRPCServer";
import { JSONRPCServerGeneratorCallback } from "src/framework/types/JSONRPCServerGeneratorCallback";
import { JSONRPCServerPromiseCallback } from "src/framework/types/JSONRPCServerPromiseCallback";
import { LoggerBreadcrumbs } from "src/framework/interfaces/LoggerBreadcrumbs";

export default class JSONRPCServer implements JSONRPCServerInterface {
  readonly loggerBreadcrumbs: LoggerBreadcrumbs;
  readonly postMessage: DedicatedWorkerGlobalScope["postMessage"];
  readonly requestHandlers: Map<string, (request: JSONRPCRequestInterface) => Promise<void>>;

  constructor(loggerBreadcrumbs: LoggerBreadcrumbs, postMessage: DedicatedWorkerGlobalScope["postMessage"]) {
    autoBind(this);

    this.loggerBreadcrumbs = loggerBreadcrumbs;
    this.postMessage = postMessage;
    this.requestHandlers = new Map();
  }

  handleRequest(jsonRpcRequest: JSONRPCRequestInterface): Promise<void> {
    const method = jsonRpcRequest.getMethod();
    const requestHandler = this.requestHandlers.get(method);

    if (requestHandler) {
      return requestHandler.call(this, jsonRpcRequest);
    }

    const data = new JSONRPCResponseData("Method not found");

    this.sendResponse(new JSONRPCErrorResponse(this.loggerBreadcrumbs.add("handleRequest"), jsonRpcRequest.getId(), method, "error", data));

    return Promise.resolve();
  }

  async returnGenerator<T>(cancelToken: CancelToken, method: string, handle: JSONRPCServerGeneratorCallback<T>): Promise<void> {
    this.requestHandlers.set(method, async (request: JSONRPCRequestInterface) => {
      if (cancelToken.isCanceled()) {
        return;
      }

      const jsonRpcGeneratorResponseBuffer = new JSONRPCServerGeneratorBuffer(this.loggerBreadcrumbs.add("JSONRPCServerGeneratorBuffer"), this.sendResponse);

      try {
        for await (let responseDataChunk of handle(cancelToken, request)) {
          jsonRpcGeneratorResponseBuffer.add(request, responseDataChunk);
        }

        jsonRpcGeneratorResponseBuffer.flushRemaining(request);
      } catch (err) {
        const data = new JSONRPCResponseData(err.message);

        this.sendResponse(new JSONRPCErrorResponse(this.loggerBreadcrumbs.add("returnGenerator"), "", "", "error", data));
      }
    });

    await cancelToken.whenCanceled();
    this.requestHandlers.delete(method);
  }

  async returnPromise<T>(cancelToken: CancelToken, method: string, handle: JSONRPCServerPromiseCallback<T>): Promise<void> {
    this.requestHandlers.set(method, async (request: JSONRPCRequestInterface) => {
      if (cancelToken.isCanceled()) {
        return;
      }

      let result;

      try {
        result = await handle(cancelToken, request);
      } catch (err) {
        const data = new JSONRPCResponseData(err.message);

        return this.sendResponse(new JSONRPCErrorResponse(this.loggerBreadcrumbs.add("returnPromise"), "", "", "error", data));
      }

      if (cancelToken.isCanceled()) {
        return;
      }

      // prettier-ignore
      this.sendResponse(new JSONRPCPromiseResponse<T>(
        this.loggerBreadcrumbs.add("returnPromise"),
        request.getId(),
        request.getMethod(),
        request.getType(),
        result
      ));
    });

    await cancelToken.whenCanceled();
    this.requestHandlers.delete(method);
  }

  async sendResponse<T, U extends Object>(response: JSONRPCResponse<T, U>): Promise<void> {
    this.postMessage(response.asObject(), response.getData().getTransferables());
  }

  useMessageHandler(cancelToken: CancelToken): DedicatedWorkerGlobalScope["onmessage"] {
    const breadcrumbs = this.loggerBreadcrumbs.add("useMessageHandler");
    const self = this;

    function invalidRequest(): void {
      const data = new JSONRPCResponseData("Invalid request");

      self.sendResponse(new JSONRPCErrorResponse(breadcrumbs, "", "", "error", data));
    }

    return (evt: MessageEvent) => {
      if (cancelToken.isCanceled()) {
        return;
      }

      const data = evt.data;

      if (!data || "object" !== typeof data) {
        return invalidRequest();
      }

      const { id, jsonrpc, method, params, type } = data;

      // prettier-ignore
      if ( "string" !== typeof id
        || "2.0-x-personalidol" !== jsonrpc
        || "string" !== typeof method
        || !Array.isArray(params)
        || ("error" !== type && "generator" !== type && "promise" !== type)
      ) {
        return invalidRequest();
      }

      this.handleRequest(
        unobjectifyJSONRPCRequest(breadcrumbs, {
          id: id,
          jsonrpc: jsonrpc,
          method: method,
          params: params,
          type: type,
        })
      );
    };
  }
}