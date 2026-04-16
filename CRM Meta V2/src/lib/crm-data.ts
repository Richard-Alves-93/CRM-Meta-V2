/**
 * ETAPA 9: crm-data.ts - Re-export Index (Final Step)
 *
 * BREAKING CHANGE: DO NOT USE DIRECTLY FOR NEW CODE
 * This file is now a pure re-export layer for backward compatibility
 * All imports from this file continue to work 100% unchanged
 *
 * Actual implementations have been moved to specialized service files:
 * - src/lib/types.ts → all type definitions
 * - src/lib/formatters.ts → formatting utilities
 * - src/services/authService.ts → authentication
 * - src/services/customerService.ts → customer CRUD
 * - src/services/petService.ts → pet CRUD
 * - src/services/productService.ts → product CRUD
 * - src/services/workSettingsService.ts → work settings & holidays
 * - src/services/purchaseService.ts → pet purchase management
 * - src/services/saleService.ts → sales targets & records
 * - src/services/exportService.ts → data export
 *
 * Migration path for new code:
 * OLD: import { fetchCustomers } from '@/lib/crm-data'
 * NEW: import { fetchCustomers } from '@/services/customerService'
 * OR:  import { fetchCustomers } from '@/lib/crm-data' // Still works!
 */

// ==================== Type Exports ====================
export type {
  Meta,
  Lancamento,
  Customer,
  Pet,
  Product,
  PetPurchase,
  PetPurchaseStatus,
  WorkSettings,
  WorkMode,
  CustomHoliday,
  CrmDatabase,
  Service,
} from '@/lib/types';

// ==================== Formatter Exports ====================
export { formatCurrency, formatDate } from '@/lib/formatters';

// ==================== Auth Service Exports ====================
export { getAuthUser, getAuthUserId } from '@/services/authService';

// ==================== Customer Service Exports ====================
export {
  fetchCustomers,
  fetchCustomersWithPets,
  addCustomer,
  updateCustomer,
  deleteCustomer,
} from '@/services/customerService';

// ==================== Pet Service Exports ====================
export {
  fetchPets,
  fetchPetsByCustomer,
  addPet,
  updatePet,
  deletePet,
} from '@/services/petService';

// ==================== Product Service Exports ====================
export {
  fetchProducts,
  addProduct,
  updateProduct,
  deleteProduct,
  findOrCreateProduct,
} from '@/services/productService';

// ==================== Work Settings Service Exports ====================
export {
  getWorkSettings,
  saveWorkSettings,
  getRemainingWorkingDays,
  addCustomHoliday,
  deleteCustomHoliday,
  fetchCustomHolidays,
  carregarJornada,
  salvarJornada,
  defaultJornada,
  carregarFeriados,
  salvarFeriados,
  defaultFeriados,
} from '@/services/workSettingsService';

// ==================== Purchase Service Exports ====================
export {
  fetchPetPurchases,
  addPetPurchase,
  updatePetPurchase,
  deletePetPurchase,
  fetchPurchases,
  updatePurchaseStatus,
  registerWhatsAppLog,
  registerRepurchase,
  startNewPurchaseCycle,
} from '@/services/purchaseService';

// ==================== Sale Service Exports ====================
export {
  fetchDatabase,
  addMeta,
  updateMeta,
  deleteMeta,
  addLancamento,
  updateLancamento,
  deleteLancamento,
  getLancamentosDoMes,
  getLancamentosMesAnterior,
  getDiasMes,
  calcularVendasNecessarias,
} from '@/services/saleService';

// ==================== Service Management Exports ====================
export {
  serviceService,
} from '@/services/serviceService';

// ==================== Export Service Exports ====================
export {
  exportarDadosJSON,
  exportarExcel,
} from '@/services/exportService';
