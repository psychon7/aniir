/**
 * Mock API handlers - centralized export
 *
 * These handlers simulate backend API calls for development
 * when the .NET backend is not available.
 *
 * Enable mock API by setting VITE_USE_MOCK_API=true in .env
 */

// Client handlers
export {
  getClients,
  getClientById,
  createClient,
  updateClient,
  deleteClient,
  getClientContacts,
  createClientContact,
  deleteClientContact,
  exportClientsToCSV,
  resetMockClients,
} from './clients'

// Consignee handlers
export {
  getConsignees,
  getConsigneeById,
  createConsignee,
  updateConsignee,
  deleteConsignee,
} from './consignees'

// Payment handlers
export {
  getPayments,
  getPaymentById,
  createPayment,
  updatePayment,
  deletePayment,
  exportPaymentsToCSV,
  resetMockPayments,
  getPaymentStatuses,
} from './payments'

// Order handlers
export {
  getOrders,
  getOrderById,
  createOrder,
  updateOrder,
  deleteOrder,
  updateOrderStatus,
  confirmOrder,
  cancelOrder,
  duplicateOrder,
  getOrderLines,
  getOrderLine,
  addOrderLine,
  addOrderLines,
  updateOrderLine,
  deleteOrderLine,
  recalculateOrderTotals,
  exportOrdersToCSV,
  exportOrderToPDF,
  resetMockOrders,
} from './orders'

// Lookup handlers
export {
  getCountries,
  getCurrencies,
  getVatRates,
  getPaymentModes,
  getPaymentTerms,
  getClientTypes,
  getClientStatuses,
  getBusinessUnits,
  getLanguages,
  getCivilities,
  getSocieties,
  getProductCategories,
  getOrderStatuses,
  getInvoiceStatuses,
  getAllLookups,
  getUnitsOfMeasure,
  getCarriers,
  getActiveCarriers,
  getSupplierTypes,
  // Note: getPaymentStatuses is exported from ./payments
} from './lookups'

// Supplier handlers
export {
  getSuppliers,
  getSupplierById,
  createSupplier,
  updateSupplier,
  deleteSupplier,
  getSupplierContacts,
  createSupplierContact,
  deleteSupplierContact,
  exportSuppliersToCSV,
  resetMockSuppliers,
} from './suppliers'

// Drive handlers
export {
  getFolderTree,
  getFolders,
  getFolderById,
  getBreadcrumbs,
  createFolder,
  renameFolder,
  deleteFolder,
  getFiles,
  getFileById,
  uploadFile,
  deleteFile,
  renameFile,
  getDriveStats,
  resetMockDrive,
} from './drive'

// Shopify handlers
export {
  getShopifyStores,
  getShopifyStoreById,
  createShopifyStore,
  updateShopifyStore,
  deleteShopifyStore,
  testShopifyConnection,
  triggerShopifySync,
  getShopifySyncEvents,
  getShopifyStoreStats,
  refreshShopifyShopInfo,
  resetMockShopifyStores,
} from './shopify'

// Email log handlers
export {
  getEmailLogs,
  getEmailLogById,
  resendEmail,
  getEmailLogStats,
  exportEmailLogsToCSV,
  resetMockEmailLogs,
} from './emailLogs'

// Accounting handlers
export {
  getPaymentForAllocation,
  getClientUnpaidInvoices,
  allocatePayment,
  autoAllocatePayment,
  resetMockAccountingData,
  // Aging analysis handlers
  getAgingAnalysis,
  getAgingInvoiceDetails,
  getAgingTrendData,
  getAgingByBusinessUnit,
  exportAgingToCSV,
} from './accounting'

// Statement handlers
export {
  getStatements,
  getStatementById,
  createStatement,
  updateStatement,
  deleteStatement,
  exportStatementsToCSV,
  resetMockStatements,
  getStatementStatuses,
  getStatementTypes,
  sendStatementToClient,
  generateStatementPDF,
} from './statements'

// Chat handlers
export {
  getThreads as getChatThreads,
  getThread as getChatThread,
  createThread as createChatThread,
  updateThread as updateChatThread,
  deleteThread as deleteChatThread,
  getEntityThreads as getChatEntityThreads,
  getOrCreateEntityThread as getOrCreateChatEntityThread,
  resetMockChatThreads,
} from './chat'

// Re-export delay utility
export { delay, isMockEnabled } from '../delay'
