import { Suspense } from "react";
import { isStreamingEnabled } from "../../config/streaming";

// Async component that simulates slow data fetching
async function SlowServerData() {
  // Simulate server-side data fetching with 5 second delay
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  const serverTime = new Date().toLocaleString();
  
  return (
    <div className="bg-blue-50 p-4 rounded border">
      <h3>Server Data (loaded after 5s)</h3>
      <p><strong>Server time:</strong> {serverTime}</p>
      <p><em>This component took 5 seconds to load on the server.</em></p>
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="bg-gray-50 p-4 rounded border animate-pulse">
      <h3>Streaming is enabled. Loading server data...</h3>
      <p>Please wait while we fetch data from the server.</p>
    </div>
  );
}

export default function Home() {
  const streamingEnabled = isStreamingEnabled();
  
  return (
    <main className="mx-auto max-w-screen-xl px-4 py-8 lg:py-12">
      <article className="prose mx-auto">
        <h1>Welcome to React Router RSC</h1>
        <p>
          This is a simple example of a React Router application using React
          Server Components (RSC) with Vite. It demonstrates how to set up a
          basic routing structure and render components server-side.
        </p>
        
        <div className={`p-4 rounded border mb-4 ${streamingEnabled ? 'bg-green-50' : 'bg-red-50'}`}>
          <h3>Streaming Status</h3>
          <p><strong>Streaming:</strong> {streamingEnabled ? '✅ Enabled' : '❌ Disabled'}</p>
          <p><em>
            {streamingEnabled 
              ? 'Content should load progressively - you\'ll see fast content first, then slow content streams in.'
              : 'All content waits for slow components - page appears all at once after delay.'
            }
          </em></p>
        </div>
        
        <div className="bg-green-50 p-4 rounded border mb-4">
          <h3>Fast Content</h3>
          <p>This content loads immediately (no server delay).</p>
        </div>
        
        {/* With streaming enabled, this should show fallback first, then stream in the real content */}
        <Suspense fallback={<LoadingFallback />}>
          <SlowServerData />
        </Suspense>
        
        <div className="bg-green-50 p-4 rounded border mt-4">
          <h3>Fast Content</h3>
          <p>This content loads immediately (no server delay).</p>
        </div>
      </article>
    </main>
  );
}
