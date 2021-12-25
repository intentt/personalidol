module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  testPathIgnorePatterns: [
    "/lib/",
    "/node_modules/",
  ],
  transform: {
    "^.+\\.(js|ts|tsx)$": "ts-jest"
  },
  transformIgnorePatterns: [
    "/node_modules/(?!three)",
  ],
};
