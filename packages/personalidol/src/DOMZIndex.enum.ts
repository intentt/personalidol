export const enum DOMZIndex {
  // CSS2DRenderer sets z-index of elements dynamically. It is easier to reserve
  // low z-index for dynamic elements than to try to mix them in with manaully
  // managed ones.
  __RESERVED_CSS2DRENDERER = 10000,

  // Order here is important, settings z-index of every possible element
  // prevents overlapping. Later ones on this list will end on top of lower
  // ones.
  InGameObjectLabel,
  InGameMousePointerGadgets,
  InGameMenuTrigger,
  MainMenu,
  Settings,
  ProgressManagerState,
  StatsReporter,
  MousePointer,
}
