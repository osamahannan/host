Host App
This repository contains the host application for a pluggable micro-frontend architecture using React (TypeScript) and Webpack Module Federation. It dynamically loads micro-frontends (auth, booking, reporting) at runtime from a config.json file, provides routing, and supports cross-app communication via custom events.
Setup Instructions

Clone the repository:
git clone <repository-url>
cd host


Install dependencies:
npm install


Start the development server:
npm start

The app runs on http://localhost:3000.

Ensure micro-frontends are running:

Auth app: http://localhost:3001
Booking app: http://localhost:3002
Reporting app: http://localhost:3003Update public/config.json with production URLs if deployed.



Architecture Decisions

Webpack Module Federation: Used for dynamic module loading without hardcoding remotes. The host has no direct dependencies on remotes, relying on config.json.
Dynamic Loading: Loads remoteEntry.js scripts at runtime using useDynamicScript hook, with fallback UI for unavailable modules.
Routing: react-router-dom handles navigation, mapping routes to remote components based on config.
Error Handling: Suspense and error boundaries display "Module unavailable" or "Load failed" if a remote fails to load.
Role-Based Access: Routes check user roles against module permissions in config.json.
TypeScript: Added src/types/module-federation.d.ts to declare Webpack globals (__webpack_init_sharing__, __webpack_share_scopes__) for type safety. Files with JSX use .tsx extension (e.g., index.tsx).
React 18: Uses createRoot for rendering (in index.tsx).

Communication Design

Cross-App Communication: Uses custom events (userLoggedIn) dispatched on window to share user state (e.g., username, role). The host listens for these events to update the userRole state, controlling access to routes.
Shared Dependencies: React, ReactDOM, and react-router-dom are shared as singletons to avoid duplication and ensure compatibility.

Demo Instructions

Local Demo:

Start all micro-frontends (see their respective READMEs).
Start the host app (npm start).
Navigate to http://localhost:3000, click links to access remote modules.
Test role-based access by logging in via /auth/login (sets role: admin).


Deployed Demo:

Deploy micro-frontends to Vercel/Netlify (see their READMEs).
Update public/config.json with deployed URLs (e.g., https://auth-app.vercel.app/remoteEntry.js).
Deploy host to Vercel (vercel --prod).
Access the deployed host URL and verify module integration.



Adding a New Module

Create a new micro-frontend repository (use auth-app as a template).
Update public/config.json with the new module's scope, URL, components, routes, and permissions.
No host rebuild is required; the new module loads dynamically.
