import {
  createTemporaryReferenceSet,
  decodeAction,
  decodeFormState,
  decodeReply,
  loadServerAction,
  renderToReadableStream,
} from "@vitejs/plugin-rsc/rsc";
import { unstable_matchRSCServerRequest as matchRSCServerRequest } from "react-router";
import awsServerlessExpress from "aws-serverless-express";
import compression from "compression";
import express from "express";
import { createRequestListener } from "@remix-run/node-fetch-server";

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

// must export a default handler function for  @vitejs/plugin-rsc 's dev server to work
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

const app = express();

app.use(
  "/assets",
  compression(),
  express.static("dist/client/assets", {
    immutable: true,
    maxAge: "1y",
  }),
);
app.use(compression(), express.static("dist/client"));

app.get("/.well-known/appspecific/com.chrome.devtools.json", (_, res) => {
  res.status(404);
  res.end();
});

app.use(createRequestListener(handler));

const binaryMimeTypes = ['application/*', 'audio/*', 'font/*', 'image/*', 'video/*'];

const server = awsServerlessExpress.createServer(app, null, binaryMimeTypes);

const lambdaHandler = (event, context, callback) => {
  context.callbackWaitsForEmptyEventLoop = false;
  
  awsServerlessExpress.proxy(
    server,
    event,
    context,
    'CALLBACK',
    callback
  );
};

export const get = lambdaHandler;

// for local test production build
if (process.env.AWS_LAMBDA_FUNCTION_NAME === undefined) {
  app.listen(3000, () => {
    console.log('Server running on port 3000');
  });
}

if (import.meta.hot) {
  import.meta.hot.accept();
}
