import React, { Suspense, useEffect, useState, lazy } from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import './styles.css';

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
    return (
      <div className="loading-container">
        {failed ? (
          <div className="error-container">
            <h3 className="error-title">Module Unavailable</h3>
            <p className="error-message">Failed to load the remote module.</p>
          </div>
        ) : (
          <>
            <div className="loading-spinner"></div>
            <p className="loading-text">Loading module...</p>
          </>
        )}
      </div>
    );
  }

  const Component = lazy(() =>
    loadComponent(scope, module).catch((error) => {
      setLoadError(error.message);
      throw error;
    })
  );

  if (loadError) {
    return (
      <div className="error-container">
        <h3 className="error-title">Error Loading Module</h3>
        <p className="error-message">{loadError}</p>
      </div>
    );
  }

  return (
    <Suspense fallback={
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p className="loading-text">Loading component...</p>
      </div>
    }>
      <Component />
    </Suspense>
  );
};

const App: React.FC = () => {
  const [config, setConfig] = useState<RemoteConfig>({});
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in
    const checkLoginStatus = () => {
      const savedUser = localStorage.getItem('user');
      if (savedUser) {
        try {
          const userData = JSON.parse(savedUser);
          setUserRole(userData.role);
        } catch (error) {
          console.error('Error parsing saved user data:', error);
          localStorage.removeItem('user');
        }
      }
      setIsLoading(false);
    };

    // Load config and check login status
    Promise.all([
      fetch('/config.json').then((res) => res.json()).catch(() => console.error('Config load failed')),
      new Promise(resolve => setTimeout(resolve, 500)) // Small delay to show loading
    ]).then(([configData]) => {
      setConfig(configData || {});
      checkLoginStatus();
    });

    const handleLogin = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      console.log("User logged in:", detail);
      
      // Save user data to localStorage
      localStorage.setItem('user', JSON.stringify({
        username: detail.username,
        role: detail.role,
        loginTime: new Date().toISOString()
      }));
      
      setUserRole(detail.role);
    };

    const handleLogout = () => {
      console.log("User logged out");
      localStorage.removeItem('user');
      setUserRole(null);
      // Redirect to home page after logout
      window.location.href = '/';
    };

    window.addEventListener('userLoggedIn', handleLogin);
    window.addEventListener('userLoggedOut', handleLogout);

    return () => {
      window.removeEventListener('userLoggedIn', handleLogin);
      window.removeEventListener('userLoggedOut', handleLogout);
    };
  }, []);

  // Show loading screen while checking login status
  if (isLoading) {
    return (
      <div className="app-container">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p className="loading-text">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <div className="app-container">
        <nav className="navbar">
          <div className="nav-links">
            <Link to="/" className="nav-link">🏠 Home</Link>
            {userRole ? (
              <>
                <Link to="/auth/profile" className="nav-link">👤 Profile</Link>
                <Link to="/booking/list" className="nav-link">📋 Bookings</Link>
                <Link to="/booking/form" className="nav-link">📅 Book Facility</Link>
                {userRole === 'admin' && (
                  <Link to="/reporting/dashboard" className="nav-link">📊 Reports</Link>
                )}
                <button 
                  onClick={() => window.dispatchEvent(new CustomEvent('userLoggedOut'))}
                  className="nav-link logout-button"
                  style={{ border: 'none', cursor: 'pointer' }}
                >
                  🚪 Logout
                </button>
              </>
            ) : (
              <Link to="/auth/login" className="nav-link">🔐 Login</Link>
            )}
          </div>
        </nav>
        <main className="main-content">
          <div className="content-wrapper">
            <Routes>
              <Route path="/" element={
                userRole ? (
                  <div className="home-container">
                    <h1 className="home-title">Welcome Back!</h1>
                    <p className="home-subtitle">
                      You are logged in as <strong>{JSON.parse(localStorage.getItem('user') || '{}').username}</strong> with <strong>{userRole}</strong> privileges.
                    </p>
                    <div className="features-grid">
                      <div className="feature-card">
                        <div className="feature-icon">🔐</div>
                        <h3 className="feature-title">Authentication</h3>
                        <p className="feature-description">
                          Secure user authentication and profile management with role-based access control.
                        </p>
                      </div>
                      <div className="feature-card">
                        <div className="feature-icon">📅</div>
                        <h3 className="feature-title">Booking System</h3>
                        <p className="feature-description">
                          Comprehensive facility booking system with real-time availability and management.
                        </p>
                      </div>
                      <div className="feature-card">
                        <div className="feature-icon">📊</div>
                        <h3 className="feature-title">Reporting</h3>
                        <p className="feature-description">
                          Advanced analytics and reporting dashboard for insights and data visualization.
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="home-container">
                    <h1 className="home-title">Micro-Frontend Architecture</h1>
                    <p className="home-subtitle">
                      A modern, scalable approach to building large-scale applications with independent, 
                      deployable micro-frontends that work together seamlessly.
                    </p>
                    <div className="features-grid">
                      <div className="feature-card">
                        <div className="feature-icon">🔐</div>
                        <h3 className="feature-title">Authentication</h3>
                        <p className="feature-description">
                          Secure user authentication and profile management with role-based access control.
                        </p>
                      </div>
                      <div className="feature-card">
                        <div className="feature-icon">📅</div>
                        <h3 className="feature-title">Booking System</h3>
                        <p className="feature-description">
                          Comprehensive facility booking system with real-time availability and management.
                        </p>
                      </div>
                      <div className="feature-card">
                        <div className="feature-icon">📊</div>
                        <h3 className="feature-title">Reporting</h3>
                        <p className="feature-description">
                          Advanced analytics and reporting dashboard for insights and data visualization.
                        </p>
                      </div>
                    </div>
                  </div>
                )
              } />
              {Object.entries(config).map(([scope, { url, routes, components, permissions }]) =>
                routes.map((path, idx) => (
                  <Route
                    key={path}
                    path={path}
                    element={
                      path.includes('/auth/login') ? (
                        // Login page is always accessible
                        <RemoteComponent scope={scope} module={`./${components[idx]}`} url={url} />
                      ) : !userRole ? (
                        // Redirect to login if not authenticated
                        <div className="error-container">
                          <h3 className="error-title">Authentication Required</h3>
                          <p className="error-message">Please log in to access this page.</p>
                          <Link to="/auth/login" className="auth-button" style={{ display: 'inline-block', marginTop: '1rem', textDecoration: 'none' }}>
                            Go to Login
                          </Link>
                        </div>
                      ) : (permissions.length === 0 || permissions.includes(userRole) || userRole === 'admin') ? (
                        // Check permissions for authenticated users
                        <RemoteComponent scope={scope} module={`./${components[idx]}`} url={url} />
                      ) : (
                        // Access denied for insufficient permissions
                        <div className="error-container">
                          <h3 className="error-title">Access Denied</h3>
                          <p className="error-message">You don't have permission to access this module.</p>
                        </div>
                      )
                    }
                  />
                ))
              )}
              <Route path="*" element={
                <div className="error-container">
                  <h2 className="error-title">404 - Module Not Found</h2>
                  <p className="error-message">The requested page could not be found.</p>
                </div>
              } />
            </Routes>
          </div>
        </main>
      </div>
    </BrowserRouter>
  );
};

export default App;