import * as React from "react";

import CancelToken from "src/framework/classes/CancelToken";

import ClockReactiveController from "src/framework/interfaces/ClockReactiveController";
import LoggerBreadcrumbs from "src/framework/interfaces/LoggerBreadcrumbs";

export default function useClockReactiveController(clockReactiveController: ClockReactiveController, isDocumentHidden: boolean, loggerBreadcrumbs: LoggerBreadcrumbs): void {
  React.useEffect(
    function() {
      if (isDocumentHidden) {
        return;
      }

      const breadcrumbs = loggerBreadcrumbs.add("useEffect(isDocumentHidden)");
      const cancelToken = new CancelToken(breadcrumbs.add("CancelToken"));

      clockReactiveController.interval(cancelToken);

      return function() {
        cancelToken.cancel(breadcrumbs.add("cleanup"));
      };
    },
    [isDocumentHidden, clockReactiveController, loggerBreadcrumbs]
  );
}
