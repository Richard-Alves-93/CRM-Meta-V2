import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

export function usePersistRoute(isAuthenticated: boolean) {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      localStorage.setItem('last_route', location.pathname);
    }
  }, [location.pathname, isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) return;

    const lastRoute = localStorage.getItem('last_route');
    if (!lastRoute || lastRoute === location.pathname || lastRoute === '/login') return;

    navigate(lastRoute, { replace: true });
  }, [isAuthenticated, location.pathname, navigate]);
}
