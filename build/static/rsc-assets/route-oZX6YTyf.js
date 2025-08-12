import { j as jsxRuntime_reactServerExports } from "./jsx-runtime.react-server-C1Bs0vs1.js";
import { a as react_reactServerExports } from "../index.js";
import "node:async_hooks";
import "set-cookie-parser";
import "cookie";
async function SlowServerData() {
  await new Promise((resolve) => setTimeout(resolve, 5e3));
  const serverTime = (/* @__PURE__ */ new Date()).toLocaleString();
  return /* @__PURE__ */ jsxRuntime_reactServerExports.jsxs("div", { className: "bg-blue-50 p-4 rounded border", children: [
    /* @__PURE__ */ jsxRuntime_reactServerExports.jsx("h3", { children: "Server Data (loaded after 5s)" }),
    /* @__PURE__ */ jsxRuntime_reactServerExports.jsxs("p", { children: [
      /* @__PURE__ */ jsxRuntime_reactServerExports.jsx("strong", { children: "Server time:" }),
      " ",
      serverTime
    ] }),
    /* @__PURE__ */ jsxRuntime_reactServerExports.jsx("p", { children: /* @__PURE__ */ jsxRuntime_reactServerExports.jsx("em", { children: "This component took 5 seconds to load on the server." }) })
  ] });
}
function LoadingFallback() {
  return /* @__PURE__ */ jsxRuntime_reactServerExports.jsxs("div", { className: "bg-gray-50 p-4 rounded border animate-pulse", children: [
    /* @__PURE__ */ jsxRuntime_reactServerExports.jsx("h3", { children: "Streaming is enabled. Loading server data..." }),
    /* @__PURE__ */ jsxRuntime_reactServerExports.jsx("p", { children: "Please wait while we fetch data from the server." })
  ] });
}
function Home() {
  return /* @__PURE__ */ jsxRuntime_reactServerExports.jsx("main", { className: "mx-auto max-w-screen-xl px-4 py-8 lg:py-12", children: /* @__PURE__ */ jsxRuntime_reactServerExports.jsxs("article", { className: "prose mx-auto", children: [
    /* @__PURE__ */ jsxRuntime_reactServerExports.jsx("h1", { children: "Welcome to React Router RSC" }),
    /* @__PURE__ */ jsxRuntime_reactServerExports.jsx("p", { children: "This is a simple example of a React Router application using React Server Components (RSC) with Vite. It demonstrates how to set up a basic routing structure and render components server-side." }),
    /* @__PURE__ */ jsxRuntime_reactServerExports.jsxs("div", { className: `p-4 rounded border mb-4 ${"bg-red-50"}`, children: [
      /* @__PURE__ */ jsxRuntime_reactServerExports.jsx("h3", { children: "Streaming Status" }),
      /* @__PURE__ */ jsxRuntime_reactServerExports.jsxs("p", { children: [
        /* @__PURE__ */ jsxRuntime_reactServerExports.jsx("strong", { children: "Streaming:" }),
        " ",
        "❌ Disabled"
      ] }),
      /* @__PURE__ */ jsxRuntime_reactServerExports.jsx("p", { children: /* @__PURE__ */ jsxRuntime_reactServerExports.jsx("em", { children: "All content waits for slow components - page appears all at once after delay." }) })
    ] }),
    /* @__PURE__ */ jsxRuntime_reactServerExports.jsxs("div", { className: "bg-green-50 p-4 rounded border mb-4", children: [
      /* @__PURE__ */ jsxRuntime_reactServerExports.jsx("h3", { children: "Fast Content" }),
      /* @__PURE__ */ jsxRuntime_reactServerExports.jsx("p", { children: "This content loads immediately (no server delay)." })
    ] }),
    /* @__PURE__ */ jsxRuntime_reactServerExports.jsx(react_reactServerExports.Suspense, { fallback: /* @__PURE__ */ jsxRuntime_reactServerExports.jsx(LoadingFallback, {}), children: /* @__PURE__ */ jsxRuntime_reactServerExports.jsx(SlowServerData, {}) }),
    /* @__PURE__ */ jsxRuntime_reactServerExports.jsxs("div", { className: "bg-green-50 p-4 rounded border mt-4", children: [
      /* @__PURE__ */ jsxRuntime_reactServerExports.jsx("h3", { children: "Fast Content" }),
      /* @__PURE__ */ jsxRuntime_reactServerExports.jsx("p", { children: "This content loads immediately (no server delay)." })
    ] })
  ] }) });
}
export {
  Home as default
};
