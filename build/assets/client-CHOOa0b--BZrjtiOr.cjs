"use strict";
Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
const index = require("./index-iWSnHh54.cjs");
require("../ssr.cjs");
require("node:async_hooks");
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
function Layout({ children }) {
  const navigation = index.H();
  return /* @__PURE__ */ index.X.jsxs("html", { lang: "en", children: [
    /* @__PURE__ */ index.X.jsxs("head", { children: [
      /* @__PURE__ */ index.X.jsx("meta", { charSet: "utf-8" }),
      /* @__PURE__ */ index.X.jsx("meta", { name: "viewport", content: "width=device-width, initial-scale=1" }),
      /* @__PURE__ */ index.X.jsx("link", { rel: "icon", type: "image/x-icon", href: "/favicon.ico" })
    ] }),
    /* @__PURE__ */ index.X.jsxs("body", { className: "font-sans antialiased", children: [
      /* @__PURE__ */ index.X.jsx("header", { className: "sticky inset-x-0 top-0 z-50 bg-background border-b", children: /* @__PURE__ */ index.X.jsx("div", { className: "mx-auto max-w-screen-xl px-4 relative flex h-16 items-center justify-between gap-4 sm:gap-8", children: /* @__PURE__ */ index.X.jsxs("div", { className: "flex items-center gap-4", children: [
        /* @__PURE__ */ index.X.jsx(index.L, { to: "/", children: "React Router 🚀" }),
        /* @__PURE__ */ index.X.jsx("nav", { children: /* @__PURE__ */ index.X.jsxs("ul", { className: "gap-4 flex", children: [
          /* @__PURE__ */ index.X.jsx("li", { children: /* @__PURE__ */ index.X.jsx(
            index.N,
            {
              to: "/",
              className: "text-sm font-medium hover:opacity-75 aria-[current]:opacity-75",
              children: "Home"
            }
          ) }),
          /* @__PURE__ */ index.X.jsx("li", { children: /* @__PURE__ */ index.X.jsx(
            index.N,
            {
              to: "/about",
              className: "text-sm font-medium hover:opacity-75 aria-[current]:opacity-75",
              children: "About"
            }
          ) })
        ] }) }),
        /* @__PURE__ */ index.X.jsx("div", { children: navigation.state !== "idle" && /* @__PURE__ */ index.X.jsx("p", { children: "Loading..." }) })
      ] }) }) }),
      children
    ] })
  ] });
}
function ErrorBoundary() {
  const error = index.Q();
  let status = 500;
  let message = "An unexpected error occurred.";
  if (index.o(error)) {
    status = error.status;
    message = status === 404 ? "Page not found." : error.statusText || message;
  }
  return /* @__PURE__ */ index.X.jsx("main", { className: "mx-auto max-w-screen-xl px-4 py-8 lg:py-12", children: /* @__PURE__ */ index.X.jsxs("article", { className: "prose mx-auto", children: [
    /* @__PURE__ */ index.X.jsx("h1", { children: status }),
    /* @__PURE__ */ index.X.jsx("p", { children: message })
  ] }) });
}
exports.ErrorBoundary = ErrorBoundary;
exports.Layout = Layout;
