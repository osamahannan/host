import React, { Suspense, useEffect, useState, lazy } from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';

interface RemoteConfig {
  [key: string]: {
    url: string;
    components: string[];
    routes: string[];
    permissions: string[];
  };
}

const useDynamicScript = (url: string) => {
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!url) return;

    const script = document.createElement('script');
    script.src = url;
    script.async = true;

    script.onload = () => {
      setTimeout(() => {
        setReady(true);
      }, 100);
    };
    script.onerror = () => setFailed(true);

    document.head.appendChild(script);

    return () => {
      document.head.removeChild(script);
    };
  }, [url]);

  return { ready, failed };
};

const loadComponent = async (scope: string, module: string) => {
  await __webpack_init_sharing__('default');
  
  let container = (window as any)[scope];
  let attempts = 0;
  const maxAttempts = 10;
  
  while (!container && attempts < maxAttempts) {
    await new Promise(resolve => setTimeout(resolve, 100));
    container = (window as any)[scope];
    attempts++;
  }
  
  if (!container) {
    throw new Error(`Container for scope "${scope}" not found after ${maxAttempts} attempts`);
  }
  
  await container.init(__webpack_share_scopes__.default);
  const factory = await container.get(module);
  return factory();
};

const RemoteComponent: React.FC<{ scope: string; module: string; url: string }> = ({ scope, module, url }) => {
  const { ready, failed } = useDynamicScript(url);
  const [loadError, setLoadError] = useState<string | null>(null);

  if (!ready || failed) {
    return <div>Module unavailable. {failed ? 'Load failed.' : 'Loading...'}</div>;
  }

  const Component = lazy(() => 
    loadComponent(scope, module).catch((error) => {
      setLoadError(error.message);
      throw error;
    })
  );

  if (loadError) {
    return <div>Error loading module: {loadError}</div>;
  }

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Component />
    </Suspense>
  );
};

const App: React.FC = () => {
  console.log("it came here")
  const [config, setConfig] = useState<RemoteConfig>({});
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    fetch('/config.json')
      .then((res) => res.json())
      .then(setConfig)
      .catch(() => console.error('Config load failed'));

    const handleLogin = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      console.log("detail", detail);
      setUserRole(detail.role);
    };
    window.addEventListener('userLoggedIn', handleLogin);

    return () => window.removeEventListener('userLoggedIn', handleLogin);
  }, []);

  return (
    <BrowserRouter>
      <nav>
        <Link to="/">Home</Link> | <Link to="/auth/login">Login</Link> | <Link to="/auth/profile">Profile</Link> | <Link to="/booking/list">Bookings</Link> | <Link to="/booking/form">Book Facility</Link> | <Link to="/reporting/dashboard">Reports</Link>
      </nav>
      <Routes>
        <Route path="/" element={<div>Welcome to Host App</div>} />
        {Object.entries(config).map(([scope, { url, routes, components, permissions }]) =>
          routes.map((path, idx) => (
            <Route
              key={path}
              path={path}
              element={
                (permissions.length === 0 ||  permissions.includes(userRole || '') || path.includes('/auth/login') || userRole === 'admin') ? (
                  <RemoteComponent scope={scope} module={`./${components[idx]}`} url={url} />
                ) : (
                  <div>Access Denied</div>
                )
              }
            />
          ))
        )}
        <Route path="*" element={<div>404 - Module Not Found</div>} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;