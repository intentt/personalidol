import { MathUtils } from "three/src/math/MathUtils";

import { createRPCLookupTable } from "./createRPCLookupTable";
import { handleRPCResponse } from "./handleRPCResponse";

test("calls function stored in the RPCLookupTable based on response parameter", function (done) {
  const uuid = MathUtils.generateUUID();
  const rpcLookupTable = createRPCLookupTable();

  rpcLookupTable[uuid] = function (data) {
    expect(data.foo).toBe("bar");
    expect(data.rpc).toBe(uuid);

    done();
  };

  const handler = handleRPCResponse(rpcLookupTable);

  handler({
    foo: "bar",
    rpc: uuid,
  });
});
