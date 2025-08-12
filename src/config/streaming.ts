// Shared configuration for streaming behavior
// Toggle to disable streaming - set to false to re-enable streaming
export const DISABLE_STREAMING = false;

// Helper to get streaming status
export const isStreamingEnabled = () => !DISABLE_STREAMING;