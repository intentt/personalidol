export const enum TouchIndices {
  // Total active touch points
  T_INITIATED_BY_ROOT_ELEMENT,
  T_LAST_USED,
  T_NAVIGATOR_MAX_TOUCH_POINTS,
  T_VECTOR_SCALE,
  T_TOTAL,

  // Touch point 1
  T0_CLIENT_X,
  T0_CLIENT_Y,
  T0_DOWN_INITIAL_CLIENT_X,
  T0_DOWN_INITIAL_CLIENT_Y,
  T0_IN_BOUNDS,
  T0_PRESSURE,
  T0_RELATIVE_X,
  T0_RELATIVE_Y,
  T0_VECTOR_X,
  T0_VECTOR_Y,

  // Touch point 2
  T1_CLIENT_X,
  T1_CLIENT_Y,
  T1_DOWN_INITIAL_CLIENT_X,
  T1_DOWN_INITIAL_CLIENT_Y,
  T1_IN_BOUNDS,
  T1_PRESSURE,
  T1_RELATIVE_X,
  T1_RELATIVE_Y,
  T1_VECTOR_X,
  T1_VECTOR_Y,

  // Touch point 3
  T2_CLIENT_X,
  T2_CLIENT_Y,
  T2_DOWN_INITIAL_CLIENT_X,
  T2_DOWN_INITIAL_CLIENT_Y,
  T2_IN_BOUNDS,
  T2_PRESSURE,
  T2_RELATIVE_X,
  T2_RELATIVE_Y,
  T2_VECTOR_X,
  T2_VECTOR_Y,

  // This one NEEDS to be last to get the enum size correctly
  __TOTAL,
}