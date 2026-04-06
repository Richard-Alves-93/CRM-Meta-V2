import { createContext, useContext, useCallback, useEffect, useState, ReactNode } from 'react';
import {
  Customer, Pet, Product, PetPurchase, Meta, Lancamento,
  fetchCustomers, fetchPets, fetchProducts, fetchPetPurchases, fetchDatabase
} from '@/lib/crm-data';

/**
 * ETAPA 4: Global Data Cache Context
 * Eliminates N+1 queries by providing centralized, cached access to all CRM data
 * Supports granular invalidation for specific data types
 *
 * Impact:
 * - Reduces initial load: 5+ async calls → 1 parallel request
 * - Eliminates redundant fetches across components
 * - Provides single source of truth for all entities
 * - Supports fine-grained cache invalidation (invalidateCustomers, invalidatePets, etc)
 */

interface CrmDataContextType {
  // Data
  customers: Customer[];
  pets: Pet[];
  products: Product[];
  purchases: PetPurchase[];
  metas: Meta[];
  lancamentos: Lancamento[];

  // State
  loading: boolean;
  error: Error | null;

  // Invalidation methods
  invalidateCustomers: () => Promise<void>;
  invalidatePets: () => Promise<void>;
  invalidateProducts: () => Promise<void>;
  invalidatePurchases: () => Promise<void>;
  invalidateAll: () => Promise<void>;
}

const CrmDataContext = createContext<CrmDataContextType | undefined>(undefined);

interface CrmDataProviderProps {
  children: ReactNode;
}

export function CrmDataProvider({ children }: CrmDataProviderProps) {
  const [state, setState] = useState({
    customers: [] as Customer[],
    pets: [] as Pet[],
    products: [] as Product[],
    purchases: [] as PetPurchase[],
    metas: [] as Meta[],
    lancamentos: [] as Lancamento[],
    loading: true,
    error: null as Error | null
  });

  // Main data loader - fetches all data in parallel
  const loadData = useCallback(async () => {
    try {
      setState(s => ({ ...s, loading: true, error: null }));

      // Parallel fetch to minimize load time
      const [customersRes, petsRes, productsRes, purchasesRes, dbRes] = await Promise.all([
        fetchCustomers().catch(err => {
          console.error('[CRM] Error fetching customers:', err);
          return [];
        }),
        fetchPets().catch(err => {
          console.error('[CRM] Error fetching pets:', err);
          return [];
        }),
        fetchProducts().catch(err => {
          console.error('[CRM] Error fetching products:', err);
          return [];
        }),
        fetchPetPurchases().catch(err => {
          console.error('[CRM] Error fetching purchases:', err);
          return [];
        }),
        fetchDatabase().catch(err => {
          console.error('[CRM] Error fetching database:', err);
          return { metas: [], lancamentos: [] };
        })
      ]);

      setState({
        customers: customersRes,
        pets: petsRes,
        products: productsRes,
        purchases: purchasesRes,
        metas: dbRes.metas,
        lancamentos: dbRes.lancamentos,
        loading: false,
        error: null
      });
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setState(s => ({ ...s, loading: false, error }));
      console.error('[CRM] Error loading data:', error);
    }
  }, []);

  // Specific invalidation methods
  const invalidateCustomers = useCallback(async () => {
    try {
      const freshCustomers = await fetchCustomers();
      setState(s => ({ ...s, customers: freshCustomers }));
      console.log('[CRM] Customers cache invalidated');
    } catch (err) {
      console.error('[CRM] Error invalidating customers:', err);
    }
  }, []);

  const invalidatePets = useCallback(async () => {
    try {
      const freshPets = await fetchPets();
      setState(s => ({ ...s, pets: freshPets }));
      console.log('[CRM] Pets cache invalidated');
    } catch (err) {
      console.error('[CRM] Error invalidating pets:', err);
    }
  }, []);

  const invalidateProducts = useCallback(async () => {
    try {
      const freshProducts = await fetchProducts();
      setState(s => ({ ...s, products: freshProducts }));
      console.log('[CRM] Products cache invalidated');
    } catch (err) {
      console.error('[CRM] Error invalidating products:', err);
    }
  }, []);

  const invalidatePurchases = useCallback(async () => {
    try {
      const freshPurchases = await fetchPetPurchases();
      setState(s => ({ ...s, purchases: freshPurchases }));
      console.log('[CRM] Purchases cache invalidated');
    } catch (err) {
      console.error('[CRM] Error invalidating purchases:', err);
    }
  }, []);

  const invalidateAll = useCallback(async () => {
    console.log('[CRM] Invalidating all caches');
    await loadData();
  }, [loadData]);

  // Load data on mount
  useEffect(() => {
    loadData();
  }, [loadData]);

  const value: CrmDataContextType = {
    ...state,
    invalidateCustomers,
    invalidatePets,
    invalidateProducts,
    invalidatePurchases,
    invalidateAll
  };

  return (
    <CrmDataContext.Provider value={value}>
      {children}
    </CrmDataContext.Provider>
  );
}

/**
 * Hook to use CRM data context
 * Must be called within a CrmDataProvider
 */
export function useCrmData(): CrmDataContextType {
  const ctx = useContext(CrmDataContext);
  if (!ctx) {
    throw new Error('useCrmData deve ser usado dentro de <CrmDataProvider>');
  }
  return ctx;
}

/**
 * Hook to fetch specific data type with automatic cache invalidation
 * Useful for components that need fine-grained updates
 */
export function useCrmDataWithInvalidation() {
  const context = useCrmData();

  return {
    ...context,
    // Convenience methods for common patterns
    refreshCustomers: context.invalidateCustomers,
    refreshPets: context.invalidatePets,
    refreshProducts: context.invalidateProducts,
    refreshPurchases: context.invalidatePurchases,
    refresh: context.invalidateAll
  };
}
