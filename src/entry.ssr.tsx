import { createFromReadableStream } from "@vitejs/plugin-rsc/ssr";
import { renderToReadableStream as renderHTMLToReadableStream } from "react-dom/server.edge";
import {
  unstable_routeRSCServerRequest as routeRSCServerRequest,
  unstable_RSCStaticRouter as RSCStaticRouter,
} from "react-router";
import { DISABLE_STREAMING } from "./config/streaming";

export async function generateHTML(
  request: Request,
  fetchServer: (request: Request) => Promise<Response>,
): Promise<Response> {
  return await routeRSCServerRequest({
    // The incoming request.
    request,
    // How to call the React Server.
    fetchServer,
    // Provide the React Server touchpoints.
    createFromReadableStream,
    // Render the router to HTML.
    async renderHTML(getPayload) {
      const payload = await getPayload();
      const formState =
        payload.type === "render" ? await payload.formState : undefined;

      const bootstrapScriptContent =
        await import.meta.viteRsc.loadBootstrapScriptContent("index");

      if (DISABLE_STREAMING) {
        // NON-STREAMING: Buffer the entire HTML response
        const htmlStream = await renderHTMLToReadableStream(
          <RSCStaticRouter getPayload={getPayload} />,
          {
            bootstrapScriptContent,
            // @ts-expect-error - no types for this yet
            formState,
          },
        );
        
        // Read the entire stream into a buffer
        const reader = htmlStream.getReader();
        const chunks: Uint8Array[] = [];
        
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          chunks.push(value);
        }
        
        // Combine all chunks and return as a single-chunk stream
        const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
        const buffer = new Uint8Array(totalLength);
        let offset = 0;
        for (const chunk of chunks) {
          buffer.set(chunk, offset);
          offset += chunk.length;
        }
        
        return new ReadableStream({
          start(controller) {
            controller.enqueue(buffer);
            controller.close();
          }
        });
      } else {
        // STREAMING: Return the stream directly (original behavior)
        return await renderHTMLToReadableStream(
          <RSCStaticRouter getPayload={getPayload} />,
          {
            bootstrapScriptContent,
            // @ts-expect-error - no types for this yet
            formState,
          },
        );
      }
    },
  });
}
