# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an experimental React Router application using React Server Components (RSC) with Vite. It demonstrates the triple-entry architecture pattern for RSC apps:

- **Server Components**: `entry.rsc.tsx` - handles server-side component rendering
- **Server-Side Rendering**: `entry.ssr.tsx` - generates initial HTML with RSC payload
- **Client Hydration**: `entry.browser.tsx` - hydrates the app and manages client interactions

## Common Commands

- **Development**: `npm run dev` - starts Vite dev server with HMR at http://localhost:5173
- **Build**: `npm run build` - creates production build in `dist/` directory
- **Production**: `npm start` - runs production server on port 3000
- **Type checking**: `npm run typecheck` - runs TypeScript compiler without emitting files

## Architecture

### Route Structure
Routes are defined in `src/routes/config.ts` using React Router's lazy loading pattern. The route structure follows a nested approach:

- `root/` - Contains layout component split between server (`route.tsx`) and client (`client.tsx`) code
- `home/` - Index route component
- `about/` - About page component

### Key Files
- `src/routes/config.ts` - Central route configuration using `RSCRouteConfig`
- `src/routes/root/route.tsx` - Server-side root layout that imports client layout
- `src/routes/root/client.tsx` - Client-side layout with navigation, marked with `"use client"`
- `server.js` - Express production server with compression and static asset serving
- `vite.config.ts` - Vite configuration with RSC plugin and Tailwind

### RSC Architecture
The app uses `@vitejs/plugin-rsc` to enable React Server Components:

1. Server components run on the server and can access server-side resources
2. Client components (marked with `"use client"`) run in the browser
3. The RSC plugin handles the streaming and serialization between server and client

### Styling
Uses Tailwind CSS v4 with typography plugin. Styles are applied through classes and there's a global CSS file at `src/routes/root/styles.css`.

## Development Patterns

### Adding New Routes
1. Create a new directory under `src/routes/`
2. Add `route.tsx` file with the component
3. Update `src/routes/config.ts` to include the new route
4. Use lazy loading pattern: `lazy: () => import("./your-route/route")`

### Client vs Server Components
- Server components (default): Can access server resources, no browser APIs
- Client components: Mark with `"use client"` directive, can use React hooks and browser APIs
- Layout pattern: Server layout imports client layout for optimal bundling

### Error Handling
Error boundaries are implemented in the client layout (`src/routes/root/client.tsx`). The `ErrorBoundary` component handles both 404s and server errors.

## Technology Stack

- **React 19** with React Server Components
- **React Router 7** with experimental RSC support
- **Vite 6** as build tool with RSC plugin
- **TypeScript** with strict mode enabled
- **Tailwind CSS v4** for styling
- **Express** for production server
- **Node.js** with ESM modules