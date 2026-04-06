/**
 * ETAPA 10: PageSuspense - Lazy Loading Wrapper
 * Provides consistent loading UI for lazy-loaded pages
 * Wraps pages in Suspense boundary with custom fallback
 */

import { Suspense, ReactNode } from 'react';

interface PageSuspenseProps {
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * PageSuspense Component
 * - Wraps lazy-loaded pages
 * - Shows loading fallback while page chunk loads
 * - Minimal overhead, no skeleton screens
 */
export function PageSuspense({ children, fallback }: PageSuspenseProps) {
  return (
    <Suspense fallback={fallback || <PageLoadingFallback />}>
      {children}
    </Suspense>
  );
}

/**
 * Default Loading Fallback
 * Simple centered text while page loads
 */
function PageLoadingFallback() {
  return (
    <div className="flex items-center justify-center h-screen bg-background">
      <div className="text-center">
        <h2 className="text-lg font-semibold text-foreground mb-2">
          Carregando...
        </h2>
        <p className="text-muted-foreground text-sm">Aguarde alguns momentos</p>
      </div>
    </div>
  );
}
