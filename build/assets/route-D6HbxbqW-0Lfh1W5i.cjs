"use strict";
Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
const ssr = require("../ssr.cjs");
const jsxRuntime_reactServerC1Bs0vs1 = require("./jsx-runtime.react-server-C1Bs0vs1-CAxYBTIC.cjs");
require("http");
require("url");
require("path");
require("buffer");
require("tty");
require("util");
require("fs");
require("net");
require("zlib");
require("os");
require("string_decoder");
require("node:zlib");
require("node:events");
require("node:path");
require("node:fs");
require("node:http");
require("crypto");
require("querystring");
require("node:net");
require("stream");
require("node:async_hooks");
const __vite_rsc_assets_manifest__ = {
  "serverResources": {
    "src/routes/root/route.tsx": {
      "js": [],
      "css": [
        "/assets/route-CySINQuG.css"
      ]
    }
  }
};
const Resources = /* @__PURE__ */ ((React, deps) => {
  return function Resources2() {
    return React.createElement(React.Fragment, null, [...deps.css.map((href) => React.createElement("link", {
      key: "css:" + href,
      rel: "stylesheet",
      precedence: "vite-rsc/importer-resources",
      href
    })), ...deps.js.map((href) => React.createElement("script", {
      key: "js:" + href,
      type: "module",
      async: true,
      src: href
    }))]);
  };
})(ssr.__vite_rsc_react__, __vite_rsc_assets_manifest__.serverResources["src/routes/root/route.tsx"]);
const Layout$1 = /* @__PURE__ */ ssr.registerClientReference(() => {
  throw new Error("Unexpectedly client reference export 'Layout' is called on server");
}, "f7f30a1e236f", "Layout");
const ErrorBoundary = /* @__PURE__ */ ssr.registerClientReference(() => {
  throw new Error("Unexpectedly client reference export 'ErrorBoundary' is called on server");
}, "f7f30a1e236f", "ErrorBoundary");
function Layout({ children }) {
  return /* @__PURE__ */ jsxRuntime_reactServerC1Bs0vs1.jsxRuntime_reactServerExports.jsx(Layout$1, { children });
}
function Component() {
  return /* @__PURE__ */ jsxRuntime_reactServerC1Bs0vs1.jsxRuntime_reactServerExports.jsx(ssr.Outlet, {});
}
Layout = /* @__PURE__ */ __vite_rsc_wrap_css__(Layout, "Layout");
const $$wrap_Component = /* @__PURE__ */ __vite_rsc_wrap_css__(Component, "default");
function __vite_rsc_wrap_css__(value, name) {
  if (typeof value !== "function") return value;
  function __wrapper(props) {
    return ssr.__vite_rsc_react__.createElement(
      ssr.__vite_rsc_react__.Fragment,
      null,
      ssr.__vite_rsc_react__.createElement(Resources),
      ssr.__vite_rsc_react__.createElement(value, props)
    );
  }
  Object.defineProperty(__wrapper, "name", { value: name });
  return __wrapper;
}
exports.ErrorBoundary = ErrorBoundary;
exports.Layout = Layout;
exports.default = $$wrap_Component;
