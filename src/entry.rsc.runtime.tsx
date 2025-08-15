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
import express from "express";
import { createRequestListener } from "@remix-run/node-fetch-server";

import { routes } from "./routes/config";
import { isStreamingEnabled } from "./config/streaming";

global.__getAssetUrl = (filename: string) => {
  console.log('global getAssetUrl called with filename:', filename)
  
  return `/mobify/bundle/${process.env.BUNDLE_ID}/${filename}`
}

function fetchServer(request: Request) {
  console.log('fetchServer called with request:', {
    url: request.url,
    method: request.method
  });
  
  try {
    const result = matchRSCServerRequest({
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
        console.log('rsc generateResponse called:', {
          statusCode: match.statusCode,
          headers: Object.fromEntries(match.headers.entries()),
          payloadType: typeof match.payload
        });
        
        const response = new Response(renderToReadableStream(match.payload, options), {
          status: match.statusCode,
          headers: match.headers,
        });
        console.log('rsc response created');
        return response;
      },
    });
    console.log('matchRSCServerRequest completed successfully');
    return result;
  } catch (error) {
    console.error('fetchServer error:', error);
    throw error;
  }
}

// must export a default handler function for  @vitejs/plugin-rsc 's dev server to work
export default async function handler(request: Request) {

  try {
    const ssr = await import.meta.viteRsc.loadModule<
      typeof import("./entry.ssr")
    >("ssr", "index");
    console.log('SSR module loaded successfully');

    const result = await ssr.generateHTML(request, fetchServer);
    console.log('generateHTML result:', {
      status: result.status,
      headers: Object.fromEntries(result.headers.entries()),
      streamingEnabled: isStreamingEnabled()
    });

    if (isStreamingEnabled()) {
      console.log('Returning streaming response');
      return result;
    } else {
      // Convert the ReadableStream to HTML string for non-streaming response
      console.log('Converting stream to HTML string');
      const html = await result.text();
      console.log('HTML generated, length:', html.length);
      
      const response = new Response(html, {
        status: result.status,
        headers: {
          'Content-Type': 'text/html'
        }
      });
      console.log('Non-streaming response created');
      return response;
    }
  } catch (error) {
    console.error('Handler error:', error);
    return new Response('Internal Server Error', {
      status: 500,
      headers: {
        'Content-Type': 'text/plain'
      }
    });
  }
}

const app = express();

app.use(
  "/assets",
  express.static("dist/client/assets", {
    immutable: true,
    maxAge: "1y",
  }),
);
app.use(express.static("dist/client"));

app.get("/.well-known/appspecific/com.chrome.devtools.json", (_, res) => {
  res.status(404);
  res.end();
});

app.use(createRequestListener(handler));

const binaryMimeTypes = ['application/*', 'audio/*', 'font/*', 'image/*', 'video/*'];

const server = awsServerlessExpress.createServer(app, null, binaryMimeTypes);

const lambdaHandler = (event, context, callback) => {
  context.callbackWaitsForEmptyEventLoop = false;
  
  try {
    awsServerlessExpress.proxy(
      server,
      event,
      context,
      'CALLBACK',
      (error, result) => {
        console.log('awsServerlessExpress callback:', {
          error: error ? error.message : null,
          result: result ? {
            statusCode: result.statusCode,
            headers: result.headers,
            bodyLength: result.body ? result.body.length : 0,
            isBase64Encoded: result.isBase64Encoded,
            bodyPreview: result.body ? result.body.substring(0, 200) : null
          } : null
        });
        
        // Log the exact callback being made
        console.log('Calling Lambda callback with:', {
          errorPresent: !!error,
          resultPresent: !!result,
          resultType: typeof result,
          isBase64Encoded: result?.isBase64Encoded
        });
        
        callback(error, result);
        
        console.log('Lambda callback completed');
      }
    );
  } catch (error) {
    console.error('Lambda handler error:', error);
    console.log('Calling callback with error');
    callback(error);
  }
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
