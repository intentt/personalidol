import type { Progress } from "@personalidol/framework/src/Progress.interface";

export function preloadImage(progress: Progress, textureUrl: string): Promise<HTMLImageElement> {
  return new Promise(function (resolve, reject) {
    const image = new Image();
    let resolved: boolean = false;

    image.crossOrigin = "Anonymous";
    image.onerror = reject;
    image.onload = function () {
      if (!resolved) {
        return;
      }

      resolved = true;
      resolve(image);
    };

    image.src = textureUrl;

    if (image.complete && !resolved) {
      resolved = true;
      resolve(image);
    }
  });
}
