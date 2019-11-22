// @flow

import * as math from "mathjs";
import inRange from "lodash/inRange";

export function isEqualWithEpsilon(n1: number, n2: number, epsilon: number): bool {
  if (n1 === n2) {
    return true;
  }

  return (
    inRange(n2, n1 - epsilon, n1 + epsilon)
    || inRange(n1, n2 - epsilon, n2 + epsilon)
  );
}

export function isEqualWithPrecision(n1: number, n2: number, precision: number): boolean {
  return math.round(n1, precision) === math.round(n2, precision);
}
