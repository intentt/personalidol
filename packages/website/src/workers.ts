type Workers = {
  [key: string]: {
    name: string;
    url: string;
  };
};

export const workers: Workers = {
  atlas: {
    name: "Loader(Atlas)",
    url: "/lib/worker_atlas.js",
  },
  md2: {
    name: "Loader(MD2)",
    url: "/lib/worker_md2.js",
  },
  offscreen: {
    name: "OffscreenCanvas",
    url: "/lib/worker_offscreen.js",
  },
  progress: {
    name: "ProgressMonitor",
    url: "/lib/worker_progress.js",
  },
  quakemaps: {
    name: "Loader(Map)",
    url: "/lib/worker_quakemaps.js",
  },
  textures: {
    name: "Loader(Texture)",
    url: "/lib/worker_textures.js",
  },
};
