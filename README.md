Host App
The Host App serves as the container for a micro-frontend architecture, orchestrating the integration of independently deployed micro-frontends (auth-app, booking-app, reporting-app) using Webpack Module Federation, React, and TypeScript.
Repository

GitHub: https://github.com/osamahannan/host

Features

Dynamic Module Loading: Loads micro-frontends via Webpack Module Federation with metadata from a self-registering plugin registry or a static config.json fallback.
Self-Registration: Micro-frontends register themselves at runtime using the moduleRegister event, enabling dynamic module addition without host redeployment.
Role-Based Access Control: Restricts routes based on user roles (user, admin), with admin accessing all routes and reporting-app restricted to admin.
Session Management: Persists user role and login data in localStorage for seamless session handling.
Netlify Deployment: Independently deployed with SPA routing and CORS headers for remoteEntry.js loading.

Setup

Clone the Repository:git clone https://github.com/osamahannan/host.git
cd host


Install Dependencies:npm install


Run Locally:npm start


Opens at http://localhost:3000.
Requires auth-app (http://localhost:3001), booking-app (http://localhost:3002), and reporting-app (http://localhost:3003) to be running.
Test routes: /auth/login, /auth/profile, /booking/list, /booking/form, /reporting/dashboard (admin-only).


Build for Production:npm run build


Outputs to dist/.


Deploy to Netlify:npm run deploy


Deploys to https://micro-host-app.netlify.app.



Architecture Decisions

Webpack Module Federation: Chosen for its ability to load remote micro-frontends dynamically, enabling independent development and deployment. The host app consumes remoteEntry.js files from micro-frontends.
TypeScript: Used for type safety, especially for shared interfaces (e.g., ModuleMetadata in shared-types.ts) and Webpack configurations.
React with react-router-dom: Provides client-side routing for SPA behavior, with dynamic route generation based on module metadata.
Role-Based Access Control: Implemented in App.tsx to restrict routes based on userRole state, updated via userLoggedIn events. admin role has full access, while user is limited to booking routes.
SPA Routing Fix: Configured historyApiFallback in webpack.config.js to serve index.html for all routes, fixing 404 and MIME type errors locally. Netlify’s netlify.toml handles this in production.
Dynamic Config: Uses config.json as a fallback for production stability, with self-registration via moduleRegister events for flexibility in development and future scalability.

Communication Design

Self-Registration via Events: Micro-frontends dispatch moduleRegister events on initialization, sending ModuleMetadata (name, URL, routes, components, permissions) to the host. The host’s App.tsx listens for these events to build the config state dynamically.
Authentication Events: auth-app dispatches userLoggedIn (with username and role) and userLoggedOut events. The host listens to update userRole state and manage localStorage.
Shared Dependencies: Module Federation shares react, react-dom, react-router-dom as singletons (singleton: true, eager: true) to ensure consistent versions and reduce bundle size.
Cross-Origin Communication: Micro-frontends are loaded from different Netlify domains (e.g., https://micro-auth-app.netlify.app). CORS headers (Access-Control-Allow-Origin: *) in netlify.toml ensure remoteEntry.js files are accessible.
LocalStorage for Session: Stores user data (username, role, loginTime) in localStorage for persistence across refreshes, synchronized via userLoggedIn/userLoggedOut events.

Testing

Local: Run npm start and test routes (/auth/login, /booking/list, /reporting/dashboard) with user and admin roles. Check console for moduleRegister logs.
Production: Verify at https://micro-host-app.netlify.app. Ensure no 404 errors and charts render in /reporting/dashboard (admin-only).
Dynamic Registration: Rename public/config.json to test self-registration. Routes should load via moduleRegister events.
