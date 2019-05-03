// @flow

import ElementRotation from "./ElementRotation";

it("is comparable with other element rotations", function() {
  const elementRotation1 = new ElementRotation(10, 10, 5);
  const elementRotation2 = new ElementRotation(10, 10, 5);

  expect(elementRotation1.isEqual(elementRotation2)).toBe(true);
});

it("is serializable as JSON", function() {
  const elementRotation = new ElementRotation(10, 10, 5);
  const serialized = elementRotation.asJson();

  expect(function() {
    JSON.parse(serialized);
  }).not.toThrow();
});
