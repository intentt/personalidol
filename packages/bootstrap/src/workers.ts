export const workers = {
  atlas: {
    name: "Loader(Atlas)",
    url: `${__STATIC_BASE_PATH}/lib/worker_atlas_${__BUILD_ID}.js`,
  },
  dynamics: {
    name: "Worker(Dynamics)",
    url: `${__STATIC_BASE_PATH}/lib/worker_dynamics_${__BUILD_ID}.js`,
  },
  gltf: {
    name: "Loader(GLTF)",
    url: `${__STATIC_BASE_PATH}/lib/worker_gltf_${__BUILD_ID}.js`,
  },
  offscreen: {
    name: "Worker(OffscreenCanvas)",
    url: `${__STATIC_BASE_PATH}/lib/worker_offscreen_${__BUILD_ID}.js`,
  },
  progress: {
    name: "Worker(Progress)",
    url: `${__STATIC_BASE_PATH}/lib/worker_progress_${__BUILD_ID}.js`,
  },
  quakemaps: {
    name: "Loader(Map)",
    url: `${__STATIC_BASE_PATH}/lib/worker_quakemaps_${__BUILD_ID}.js`,
  },
  textures: {
    name: "Loader(Texture)",
    url: `${__STATIC_BASE_PATH}/lib/worker_textures_${__BUILD_ID}.js`,
  },
};
