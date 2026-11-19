/* eslint-disable @typescript-eslint/no-require-imports -- CommonJS preload hook for tsx */
// Lets CLI scripts import server modules guarded by `import "server-only"` (that guard targets bundlers, not Node CLIs).
const Module = require("node:module");
const orig = Module._resolveFilename;
Module._resolveFilename = function (request, ...rest) {
  if (request === "server-only") return require.resolve("../tests/server-only-stub.ts");
  return orig.call(this, request, ...rest);
};
