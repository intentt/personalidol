export type InteractableState = {
  isInteracting: boolean;
  // Can be set to false to be permanently removed from the interactables pool.
  needsInteractions: boolean;
};
