import __vite_rsc_assets_manifest__ from "../__vite_rsc_assets_manifest.js";
import { _ as __vite_rsc_react__, r as registerClientReference, O as Outlet } from "../index.js";
import { j as jsxRuntime_reactServerExports } from "./jsx-runtime.react-server-C1Bs0vs1.js";
import "node:async_hooks";
import "set-cookie-parser";
import "cookie";
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
})(__vite_rsc_react__, __vite_rsc_assets_manifest__.serverResources["src/routes/root/route.tsx"]);
const Layout$1 = /* @__PURE__ */ registerClientReference(() => {
  throw new Error("Unexpectedly client reference export 'Layout' is called on server");
}, "f7f30a1e236f", "Layout");
const ErrorBoundary = /* @__PURE__ */ registerClientReference(() => {
  throw new Error("Unexpectedly client reference export 'ErrorBoundary' is called on server");
}, "f7f30a1e236f", "ErrorBoundary");
function Layout({ children }) {
  return /* @__PURE__ */ jsxRuntime_reactServerExports.jsx(Layout$1, { children });
}
function Component() {
  return /* @__PURE__ */ jsxRuntime_reactServerExports.jsx(Outlet, {});
}
Layout = /* @__PURE__ */ __vite_rsc_wrap_css__(Layout, "Layout");
const $$wrap_Component = /* @__PURE__ */ __vite_rsc_wrap_css__(Component, "default");
function __vite_rsc_wrap_css__(value, name) {
  if (typeof value !== "function") return value;
  function __wrapper(props) {
    return __vite_rsc_react__.createElement(
      __vite_rsc_react__.Fragment,
      null,
      __vite_rsc_react__.createElement(Resources),
      __vite_rsc_react__.createElement(value, props)
    );
  }
  Object.defineProperty(__wrapper, "name", { value: name });
  return __wrapper;
}
export {
  ErrorBoundary,
  Layout,
  $$wrap_Component as default
};
