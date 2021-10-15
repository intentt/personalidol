import { monitorResponseProgress } from "./monitorResponseProgress";
import { Progress } from "./Progress";

import { Progress as IProgress } from "./Progress.interface";

let cache: null | Cache = null;

async function _cachedGet(cache: Cache, progress: IProgress, url: string): Promise<void> {
  const request = new Request(url, {
    // Cache is managed manually.
    cache: "no-store",
  });

  const cachedResponse = await cache.match(request);

  if (cachedResponse instanceof Response) {
    return;
  }

  const response = await fetch(url);
  const responseProgressMonitor = monitorResponseProgress(progress.progress, false);
  const responseClone = response.clone();

  await responseProgressMonitor(response);
  await cache.put(url, responseClone);
}

/**
 * Prefetching assumes that anything that is being prefetched will be stored in
 * cache. Prefetching allows to monitor download progress for items that
 * normally do not support that.
 */
export async function prefetch(messagePort: MessagePort, resourceType: string, url: string): Promise<void> {
  if (!cache) {
    cache = await caches.open(__BUILD_ID);
  }

  const progress = Progress(messagePort, resourceType, url);

  return progress.wait(_cachedGet(cache, progress, url));
}
