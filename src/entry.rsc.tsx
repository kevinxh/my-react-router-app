import {
  createTemporaryReferenceSet,
  decodeAction,
  decodeFormState,
  decodeReply,
  loadServerAction,
  renderToReadableStream,
} from "@vitejs/plugin-rsc/rsc";
import { unstable_matchRSCServerRequest as matchRSCServerRequest } from "react-router";

import { routes } from "./routes/config";
import { isStreamingEnabled } from "./config/streaming";

function fetchServer(request: Request) {
  return matchRSCServerRequest({
    // Provide the React Server touchpoints.
    createTemporaryReferenceSet,
    decodeAction,
    decodeFormState,
    decodeReply,
    loadServerAction,
    // The incoming request.
    request,
    // The app routes.
    routes: routes(),
    // Encode the match with the React Server implementation.
    generateResponse(match, options) {
      console.log('rsc generateResponse')
      return new Response(renderToReadableStream(match.payload, options), {
        status: match.statusCode,
        headers: match.headers,
      });
    },
  });
}

export default async function handler(request: Request) {
  const ssr = await import.meta.viteRsc.loadModule<
    typeof import("./entry.ssr")
  >("ssr", "index");

  const result = await ssr.generateHTML(request, fetchServer);

  if (isStreamingEnabled()) {
    return result;
  } else {
    // Convert the ReadableStream to HTML string for non-streaming response
    const html = await result.text();
    return new Response(html, {
      status: result.status,
      headers: {
        'Content-Type': 'text/html'
      }
    });
  }
}

if (import.meta.hot) {
  import.meta.hot.accept();
}
