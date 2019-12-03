// @flow

import * as React from "react";

import CancelToken from "../framework/classes/CancelToken";

import type { CancelTokenQuery } from "../framework/interfaces/CancelTokenQuery";
import type { LoggerBreadcrumbs } from "../framework/interfaces/LoggerBreadcrumbs";
import type { Query } from "../framework/interfaces/Query";
import type { QueryBus } from "../framework/interfaces/QueryBus";

export default function useQuery<T>(loggerBreadcrumbs: LoggerBreadcrumbs, queryBus: QueryBus, query: ?Query<T>): ?CancelTokenQuery<T> {
  const [cancelTokenQuery, setCancelTokenQuery] = React.useState<?CancelTokenQuery<T>>(null);
  const setIsExecuted = React.useState<boolean>(false)[1];

  React.useEffect(
    function() {
      if (!query) {
        return;
      }

      const breadcrumbs = loggerBreadcrumbs.add("React.useEffect");
      const cancelToken = new CancelToken(breadcrumbs);
      const cancelTokenQuery = queryBus.enqueue(cancelToken, query);

      setIsExecuted(false);
      setCancelTokenQuery(cancelTokenQuery);

      cancelTokenQuery.whenExecuted().then(() => {
        setIsExecuted(true);
      });

      return function() {
        cancelToken.cancel(breadcrumbs.add("cleanup"));
      };
    },
    [loggerBreadcrumbs, query, queryBus, setIsExecuted]
  );

  return cancelTokenQuery;
}
