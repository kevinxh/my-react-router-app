import "@aws-sdk/client-s3";
import awsServerlessExpress from "aws-serverless-express";
import app from "./app.js";

const binaryMimeTypes = ['application/*', 'audio/*', 'font/*', 'image/*', 'video/*'];

const server = awsServerlessExpress.createServer(app, null, binaryMimeTypes);

const handler = (event, context, callback) => {
  context.callbackWaitsForEmptyEventLoop = false;
  
  awsServerlessExpress.proxy(
    server,
    event,
    context,
    'CALLBACK',
    callback
  );
};

// SSR requires that we export a single handler function called 'get', that
// supports AWS use of the server that we created above.
module.exports = {
  get: handler
}
