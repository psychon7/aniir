import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { warehouseApi } from '@/api/warehouse'
import type {
  WarehouseSearchParams,
  WarehouseCreateDto,
  WarehouseUpdateDto,
  StockSearchParams,
  StockCreateDto,
  StockUpdateDto,
  StockAdjustment,
  StockMovementSearchParams,
  StockMovementCreateDto,
  StockMovementUpdateDto,
  StockMovementLineCreateDto,
  StockMovementLineUpdateDto,
  MovementType,
} from '@/types/warehouse'

// =============================================================================
// Query Keys
// =============================================================================

export const warehouseKeys = {
  all: ['warehouse'] as const,
  // Warehouses
  warehouses: () => [...warehouseKeys.all, 'warehouses'] as const,
  warehouseList: (params: WarehouseSearchParams) => [...warehouseKeys.warehouses(), 'list', params] as const,
  warehouseLookup: () => [...warehouseKeys.warehouses(), 'lookup'] as const,
  warehouseDetail: (id: number) => [...warehouseKeys.warehouses(), 'detail', id] as const,
  warehouseDefault: () => [...warehouseKeys.warehouses(), 'default'] as const,
  warehouseCount: () => [...warehouseKeys.warehouses(), 'count'] as const,
  // Stock
  stock: () => [...warehouseKeys.all, 'stock'] as const,
  stockList: (params: StockSearchParams) => [...warehouseKeys.stock(), 'list', params] as const,
  stockDetail: (id: number) => [...warehouseKeys.stock(), 'detail', id] as const,
  stockSummary: () => [...warehouseKeys.stock(), 'summary'] as const,
  stockLowStock: () => [...warehouseKeys.stock(), 'lowStock'] as const,
  // Movements
  movements: () => [...warehouseKeys.all, 'movements'] as const,
  movementList: (params: StockMovementSearchParams) => [...warehouseKeys.movements(), 'list', params] as const,
  movementDetail: (id: number) => [...warehouseKeys.movements(), 'detail', id] as const,
}

// =============================================================================
// Warehouse Queries
// =============================================================================

/**
 * Hook to fetch paginated list of warehouses
 */
export function useWarehouses(params: WarehouseSearchParams = {}) {
  return useQuery({
    queryKey: warehouseKeys.warehouseList(params),
    queryFn: () => warehouseApi.getWarehouses(params),
    staleTime: 60 * 1000, // 1 minute
  })
}

/**
 * Hook to fetch warehouses for dropdown
 */
export function useWarehouseLookup(search?: string, activeOnly = true) {
  return useQuery({
    queryKey: [...warehouseKeys.warehouseLookup(), search, activeOnly],
    queryFn: () => warehouseApi.getWarehouseLookup(search, activeOnly),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

/**
 * Hook to fetch warehouse count
 */
export function useWarehouseCount(activeOnly = false) {
  return useQuery({
    queryKey: [...warehouseKeys.warehouseCount(), activeOnly],
    queryFn: () => warehouseApi.getWarehouseCount(activeOnly),
    staleTime: 60 * 1000,
  })
}

/**
 * Hook to fetch default warehouse
 */
export function useDefaultWarehouse() {
  return useQuery({
    queryKey: warehouseKeys.warehouseDefault(),
    queryFn: () => warehouseApi.getDefaultWarehouse(),
    staleTime: 5 * 60 * 1000,
  })
}

/**
 * Hook to fetch a warehouse by ID
 */
export function useWarehouse(id: number) {
  return useQuery({
    queryKey: warehouseKeys.warehouseDetail(id),
    queryFn: () => warehouseApi.getWarehouseById(id),
    enabled: !!id,
  })
}

// =============================================================================
// Warehouse Mutations
// =============================================================================

/**
 * Hook to create a warehouse
 */
export function useCreateWarehouse() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: WarehouseCreateDto) => warehouseApi.createWarehouse(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: warehouseKeys.warehouses() })
    },
  })
}

/**
 * Hook to update a warehouse
 */
export function useUpdateWarehouse() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: WarehouseUpdateDto }) =>
      warehouseApi.updateWarehouse(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: warehouseKeys.warehouseDetail(id) })
      queryClient.invalidateQueries({ queryKey: warehouseKeys.warehouses() })
    },
  })
}

/**
 * Hook to delete a warehouse
 */
export function useDeleteWarehouse() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => warehouseApi.deleteWarehouse(id),
    onSuccess: (_, id) => {
      queryClient.removeQueries({ queryKey: warehouseKeys.warehouseDetail(id) })
      queryClient.invalidateQueries({ queryKey: warehouseKeys.warehouses() })
    },
  })
}

// =============================================================================
// Stock Queries
// =============================================================================

/**
 * Hook to fetch paginated list of stock
 */
export function useStock(params: StockSearchParams = {}) {
  return useQuery({
    queryKey: warehouseKeys.stockList(params),
    queryFn: () => warehouseApi.getStock(params),
    staleTime: 30 * 1000, // 30 seconds
  })
}

/**
 * Hook to fetch stock by ID
 */
export function useStockById(id: number) {
  return useQuery({
    queryKey: warehouseKeys.stockDetail(id),
    queryFn: () => warehouseApi.getStockById(id),
    enabled: !!id,
  })
}

/**
 * Hook to fetch stock summary
 */
export function useStockSummary(socId?: number, whsId?: number) {
  return useQuery({
    queryKey: [...warehouseKeys.stockSummary(), socId, whsId],
    queryFn: () => warehouseApi.getStockSummary(socId, whsId),
    staleTime: 30 * 1000,
  })
}

/**
 * Hook to fetch low stock items
 */
export function useLowStockItems(socId?: number, limit = 50) {
  return useQuery({
    queryKey: [...warehouseKeys.stockLowStock(), socId, limit],
    queryFn: () => warehouseApi.getLowStockItems(socId, limit),
    staleTime: 30 * 1000,
  })
}

/**
 * Hook to fetch stock by warehouse
 */
export function useStockByWarehouse(warehouseId: number, params: Omit<StockSearchParams, 'whs_id'> = {}) {
  return useQuery({
    queryKey: warehouseKeys.stockList({ ...params, whs_id: warehouseId }),
    queryFn: () => warehouseApi.getStockByWarehouse(warehouseId, params),
    enabled: !!warehouseId,
    staleTime: 30 * 1000,
  })
}

/**
 * Hook to fetch stock by product
 */
export function useStockByProduct(productId: number, params: Omit<StockSearchParams, 'prd_id'> = {}) {
  return useQuery({
    queryKey: warehouseKeys.stockList({ ...params, prd_id: productId }),
    queryFn: () => warehouseApi.getStockByProduct(productId, params),
    enabled: !!productId,
    staleTime: 30 * 1000,
  })
}

// =============================================================================
// Stock Mutations
// =============================================================================

/**
 * Hook to create a stock record
 */
export function useCreateStock() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: StockCreateDto) => warehouseApi.createStock(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: warehouseKeys.stock() })
    },
  })
}

/**
 * Hook to update a stock record
 */
export function useUpdateStock() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: StockUpdateDto }) =>
      warehouseApi.updateStock(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: warehouseKeys.stockDetail(id) })
      queryClient.invalidateQueries({ queryKey: warehouseKeys.stock() })
    },
  })
}

/**
 * Hook to adjust stock quantity
 */
export function useAdjustStock() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (adjustment: StockAdjustment) => warehouseApi.adjustStock(adjustment),
    onSuccess: (stock) => {
      queryClient.invalidateQueries({ queryKey: warehouseKeys.stockDetail(stock.stk_id) })
      queryClient.invalidateQueries({ queryKey: warehouseKeys.stock() })
    },
  })
}

/**
 * Hook to reserve stock
 */
export function useReserveStock() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ stockId, quantity }: { stockId: number; quantity: number }) =>
      warehouseApi.reserveStock(stockId, quantity),
    onSuccess: (stock) => {
      queryClient.invalidateQueries({ queryKey: warehouseKeys.stockDetail(stock.stk_id) })
      queryClient.invalidateQueries({ queryKey: warehouseKeys.stock() })
    },
  })
}

/**
 * Hook to release stock reservation
 */
export function useReleaseStockReservation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ stockId, quantity }: { stockId: number; quantity: number }) =>
      warehouseApi.releaseReservation(stockId, quantity),
    onSuccess: (stock) => {
      queryClient.invalidateQueries({ queryKey: warehouseKeys.stockDetail(stock.stk_id) })
      queryClient.invalidateQueries({ queryKey: warehouseKeys.stock() })
    },
  })
}

/**
 * Hook to delete a stock record
 */
export function useDeleteStock() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => warehouseApi.deleteStock(id),
    onSuccess: (_, id) => {
      queryClient.removeQueries({ queryKey: warehouseKeys.stockDetail(id) })
      queryClient.invalidateQueries({ queryKey: warehouseKeys.stock() })
    },
  })
}

// =============================================================================
// Stock Movement Queries
// =============================================================================

/**
 * Hook to fetch paginated list of stock movements
 */
export function useStockMovements(params: StockMovementSearchParams = {}) {
  return useQuery({
    queryKey: warehouseKeys.movementList(params),
    queryFn: () => warehouseApi.getMovements(params),
    staleTime: 30 * 1000,
  })
}

/**
 * Hook to fetch a stock movement by ID
 */
export function useStockMovement(id: number) {
  return useQuery({
    queryKey: warehouseKeys.movementDetail(id),
    queryFn: () => warehouseApi.getMovementById(id),
    enabled: !!id,
  })
}

/**
 * Hook to fetch movements by warehouse
 */
export function useMovementsByWarehouse(warehouseId: number, params: Omit<StockMovementSearchParams, 'whs_id'> = {}) {
  return useQuery({
    queryKey: warehouseKeys.movementList({ ...params, whs_id: warehouseId }),
    queryFn: () => warehouseApi.getMovementsByWarehouse(warehouseId, params),
    enabled: !!warehouseId,
    staleTime: 30 * 1000,
  })
}

/**
 * Hook to fetch movements by type
 */
export function useMovementsByType(type: MovementType, params: Omit<StockMovementSearchParams, 'stm_type'> = {}) {
  return useQuery({
    queryKey: warehouseKeys.movementList({ ...params, stm_type: type }),
    queryFn: () => warehouseApi.getMovementsByType(type, params),
    staleTime: 30 * 1000,
  })
}

// =============================================================================
// Stock Movement Mutations
// =============================================================================

/**
 * Hook to create a stock movement
 */
export function useCreateStockMovement() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: StockMovementCreateDto) => warehouseApi.createMovement(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: warehouseKeys.movements() })
    },
  })
}

/**
 * Hook to update a stock movement
 */
export function useUpdateStockMovement() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: StockMovementUpdateDto }) =>
      warehouseApi.updateMovement(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: warehouseKeys.movementDetail(id) })
      queryClient.invalidateQueries({ queryKey: warehouseKeys.movements() })
    },
  })
}

/**
 * Hook to complete a stock movement
 */
export function useCompleteStockMovement() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, validatedBy }: { id: number; validatedBy?: number }) =>
      warehouseApi.completeMovement(id, validatedBy),
    onSuccess: (movement) => {
      queryClient.invalidateQueries({ queryKey: warehouseKeys.movementDetail(movement.stm_id) })
      queryClient.invalidateQueries({ queryKey: warehouseKeys.movements() })
      // Also invalidate stock since completing a movement affects stock levels
      queryClient.invalidateQueries({ queryKey: warehouseKeys.stock() })
    },
  })
}

/**
 * Hook to cancel a stock movement
 */
export function useCancelStockMovement() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => warehouseApi.cancelMovement(id),
    onSuccess: (movement) => {
      queryClient.invalidateQueries({ queryKey: warehouseKeys.movementDetail(movement.stm_id) })
      queryClient.invalidateQueries({ queryKey: warehouseKeys.movements() })
    },
  })
}

/**
 * Hook to delete a stock movement
 */
export function useDeleteStockMovement() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => warehouseApi.deleteMovement(id),
    onSuccess: (_, id) => {
      queryClient.removeQueries({ queryKey: warehouseKeys.movementDetail(id) })
      queryClient.invalidateQueries({ queryKey: warehouseKeys.movements() })
    },
  })
}

// =============================================================================
// Movement Line Mutations
// =============================================================================

/**
 * Hook to add a line to a movement
 */
export function useAddMovementLine() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ movementId, line }: { movementId: number; line: StockMovementLineCreateDto }) =>
      warehouseApi.addMovementLine(movementId, line),
    onSuccess: (_, { movementId }) => {
      queryClient.invalidateQueries({ queryKey: warehouseKeys.movementDetail(movementId) })
    },
  })
}

/**
 * Hook to update a movement line
 */
export function useUpdateMovementLine() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ lineId, line }: { lineId: number; line: StockMovementLineUpdateDto }) =>
      warehouseApi.updateMovementLine(lineId, line),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: warehouseKeys.movements() })
    },
  })
}

/**
 * Hook to delete a movement line
 */
export function useDeleteMovementLine() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (lineId: number) => warehouseApi.deleteMovementLine(lineId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: warehouseKeys.movements() })
    },
  })
}
