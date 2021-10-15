import { monitorResponseProgress } from "./monitorResponseProgress";
import { Progress } from "./Progress";

import type { Logger } from "loglevel";

import type { Progress as IProgress } from "./Progress.interface";

async function _cachedGet(logger: Logger, progress: IProgress, url: string): Promise<void> {
  const cache = await caches.open(__BUILD_ID);
  const request = new Request(url);

  const cachedResponse = await cache.match(request);

  if (cachedResponse instanceof Response) {
    return;
  }

  const response = await fetch(request);
  const responseProgressMonitor = monitorResponseProgress(progress.progress, false);

  await responseProgressMonitor(response);
}

/**
 * Prefetching assumes that anything that is being prefetched will be stored in
 * cache. Prefetching allows to monitor download progress for items that
 * normally do not support that.
 */
export async function prefetch(
  logger: Logger,
  messagePort: MessagePort,
  resourceType: string,
  url: string
): Promise<void> {
  const progress = Progress(messagePort, resourceType, url);

  return progress.wait(_cachedGet(logger, progress, url));
}
