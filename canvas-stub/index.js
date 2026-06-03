// Stub: re-export @napi-rs/canvas so that pdfjs-dist's
// internal require("canvas") resolves correctly without
// needing the native canvas npm package.
module.exports = require("@napi-rs/canvas");
