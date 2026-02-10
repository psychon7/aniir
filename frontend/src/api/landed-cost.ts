import apiClient from './client'
import type {
  SupplyLot,
  SupplyLotDetail,
  SupplyLotCreateDto,
  SupplyLotUpdateDto,
  SupplyLotSearchParams,
  SupplyLotListResponse,
  SupplyLotItem,
  SupplyLotItemCreateDto,
  SupplyLotItemUpdateDto,
  FreightCost,
  FreightCostCreateDto,
  FreightCostUpdateDto,
  LandedCostBreakdown,
  LandedCostBreakdownItem,
  ProductAllocation,
  LandedCostCalculationRequest,
  LandedCostCalculationResponse,
  AllocationLog,
  LotStatus,
} from '@/types/landed-cost'

type UnknownRecord = Record<string, any>

function unwrapData<T = unknown>(payload: any): T {
  if (payload && typeof payload === 'object' && 'data' in payload) {
    return payload.data as T
  }
  return payload as T
}

function toNumber(value: unknown, fallback = 0): number {
  if (value === null || value === undefined || value === '') return fallback
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function normalizeStatus(status: unknown): LotStatus {
  const raw = String(status || '').toUpperCase()
  if (raw === 'DRAFT') return 'DRAFT'
  if (raw === 'IN_TRANSIT') return 'IN_TRANSIT'
  if (raw === 'COMPLETED') return 'COMPLETED'
  if (raw === 'CANCELLED') return 'CANCELLED'
  return 'CUSTOMS'
}

function mapSupplyLotItem(raw: UnknownRecord): SupplyLotItem {
  const quantity = toNumber(raw.sli_quantity ?? raw.quantity)
  const unitPrice = toNumber(raw.sli_unit_price ?? raw.unit_price)
  const totalPrice = toNumber(raw.sli_total_price ?? raw.total_price, quantity * unitPrice)

  return {
    sli_id: toNumber(raw.sli_id ?? raw.id),
    sli_prd_id: toNumber(raw.sli_prd_id ?? raw.product_id),
    sli_pit_id: raw.sli_pit_id ?? raw.product_instance_id ?? null,
    sli_quantity: quantity,
    sli_unit_price: unitPrice,
    sli_total_price: totalPrice,
    sli_weight_kg: raw.sli_weight_kg == null ? null : toNumber(raw.sli_weight_kg),
    sli_volume_cbm: raw.sli_volume_cbm == null ? null : toNumber(raw.sli_volume_cbm ?? raw.volume_m3),
    sli_unit_weight_kg: raw.sli_unit_weight_kg == null ? null : toNumber(raw.sli_unit_weight_kg),
    sli_unit_volume_cbm: raw.sli_unit_volume_cbm == null ? null : toNumber(raw.sli_unit_volume_cbm),
    sli_sku: raw.sli_sku ?? null,
    sli_description: raw.sli_description ?? raw.description ?? null,
    sli_total_allocated_cost: toNumber(raw.sli_total_allocated_cost ?? raw.total_allocated_cost ?? raw.allocated_cost),
    sli_total_landed_cost: toNumber(raw.sli_total_landed_cost ?? raw.total_landed_cost, totalPrice),
    sli_landed_cost_per_unit:
      raw.sli_landed_cost_per_unit == null && raw.landed_cost_per_unit == null
        ? null
        : toNumber(raw.sli_landed_cost_per_unit ?? raw.landed_cost_per_unit),
    sli_allocated_freight: toNumber(raw.sli_allocated_freight ?? raw.allocated_freight),
    sli_allocated_customs: toNumber(raw.sli_allocated_customs ?? raw.allocated_customs),
    sli_allocated_insurance: toNumber(raw.sli_allocated_insurance ?? raw.allocated_insurance),
    sli_allocated_local: toNumber(raw.sli_allocated_local ?? raw.allocated_local),
    sli_allocated_other: toNumber(raw.sli_allocated_other ?? raw.allocated_other),
  }
}

function mapFreightCost(raw: UnknownRecord): FreightCost {
  return {
    frc_id: toNumber(raw.frc_id ?? raw.id),
    frc_type: String(raw.frc_type ?? raw.cost_type ?? 'OTHER') as any,
    frc_description: String(raw.frc_description ?? raw.description ?? ''),
    frc_amount: toNumber(raw.frc_amount ?? raw.amount),
    frc_amount_converted: toNumber(raw.frc_amount_converted ?? raw.amount_converted ?? raw.frc_amount ?? raw.amount),
    frc_exchange_rate: toNumber(raw.frc_exchange_rate ?? raw.exchange_rate, 1),
    frc_vendor_name: raw.frc_vendor_name ?? raw.vendor_name ?? null,
    frc_invoice_ref: raw.frc_invoice_ref ?? raw.invoice_ref ?? null,
    frc_invoice_date: raw.frc_invoice_date ?? raw.invoice_date ?? null,
    frc_paid_date: raw.frc_paid_date ?? raw.paid_date ?? null,
    frc_is_paid: Boolean(raw.frc_is_paid ?? raw.is_paid ?? false),
    frc_notes: raw.frc_notes ?? raw.notes ?? null,
    frc_created_at: String(raw.frc_created_at ?? raw.created_at ?? ''),
    frc_updated_at: String(raw.frc_updated_at ?? raw.updated_at ?? ''),
  }
}

function mapSupplyLot(raw: UnknownRecord): SupplyLot {
  return {
    lot_id: toNumber(raw.lot_id ?? raw.id),
    lot_reference: String(raw.lot_reference ?? ''),
    lot_name: String(raw.lot_name ?? raw.name ?? raw.description ?? ''),
    lot_supplier_id: toNumber(raw.lot_supplier_id ?? raw.lot_sup_id ?? raw.supplier_id),
    lot_supplier_name: String(raw.lot_supplier_name ?? ''),
    lot_status: normalizeStatus(raw.lot_status ?? raw.status),
    lot_eta: raw.lot_eta ?? raw.lot_eta_date ?? null,
    lot_arrival_date: raw.lot_arrival_date ?? null,
    lot_total_value: toNumber(raw.lot_total_value ?? raw.total_product_value),
    lot_total_freight: toNumber(raw.lot_total_freight ?? raw.freight_cost ?? raw.lot_total_freight_cost),
    lot_total_landed_cost: toNumber(raw.lot_total_landed_cost),
    lot_total_items: toNumber(raw.lot_total_items),
    lot_total_freight_cost: toNumber(raw.lot_total_freight_cost ?? raw.freight_cost),
    lot_total_customs_cost: toNumber(raw.lot_total_customs_cost ?? raw.customs_cost),
    lot_total_insurance_cost: toNumber(raw.lot_total_insurance_cost ?? raw.insurance_cost),
    lot_total_local_cost: toNumber(raw.lot_total_local_cost ?? 0),
    lot_total_other_cost: toNumber(raw.lot_total_other_cost ?? raw.other_cost),
    lot_allocation_completed: Boolean(raw.lot_allocation_completed ?? raw.allocation_completed),
    lot_items: Array.isArray(raw.lot_items) ? raw.lot_items.map(mapSupplyLotItem) : [],
    lot_freight_costs: Array.isArray(raw.lot_freight_costs) ? raw.lot_freight_costs.map(mapFreightCost) : [],
    lot_created_at: String(raw.lot_created_at ?? raw.created_at ?? ''),
    lot_updated_at: String(raw.lot_updated_at ?? raw.updated_at ?? ''),
  }
}

function mapSupplyLotDetail(raw: UnknownRecord): SupplyLotDetail {
  const mapped = mapSupplyLot(raw)

  return {
    ...mapped,
    lot_description: raw.lot_description ?? raw.description ?? null,
    lot_ship_date: raw.lot_ship_date ?? raw.lot_date ?? null,
    lot_eta_date: raw.lot_eta_date ?? raw.lot_eta ?? null,
    lot_total_quantity: toNumber(raw.lot_total_quantity),
    lot_total_weight_kg: toNumber(raw.lot_total_weight_kg ?? raw.total_weight_kg),
    lot_total_volume_cbm: toNumber(raw.lot_total_volume_cbm ?? raw.total_volume_m3),
    lot_allocation_date: raw.lot_allocation_date ?? raw.calculated_at ?? null,
    total_cost: toNumber(raw.total_cost, mapped.lot_total_value + mapped.lot_total_freight_cost + mapped.lot_total_customs_cost + mapped.lot_total_insurance_cost + mapped.lot_total_local_cost + mapped.lot_total_other_cost),
    items: Array.isArray(raw.items) ? raw.items.map(mapSupplyLotItem) : [],
    freight_costs: Array.isArray(raw.freight_costs) ? raw.freight_costs.map(mapFreightCost) : [],
  }
}

function mapAllocationFromItem(item: LandedCostBreakdownItem): ProductAllocation {
  return {
    product_id: item.product_id,
    product_reference: item.product_reference,
    product_name: item.product_name,
    weight_kg: item.weight_kg || 0,
    volume_m3: item.volume_cbm || 0,
    unit_value: item.unit_price || 0,
    quantity: item.quantity || 0,
    weight_share_percent: item.weight_share_percent || 0,
    volume_share_percent: item.volume_share_percent || 0,
    value_share_percent: item.value_share_percent || 0,
    final_share_percent: item.value_share_percent || 0,
    allocated_freight: item.allocated_freight || 0,
    allocated_customs: item.allocated_customs || 0,
    allocated_insurance: item.allocated_insurance || 0,
    allocated_other: (item.allocated_local || 0) + (item.allocated_other || 0),
    total_allocated: item.total_allocated_cost || 0,
    landed_cost_per_unit: item.landed_cost_per_unit || 0,
  }
}

function mapBreakdown(raw: UnknownRecord): LandedCostBreakdown {
  const itemsRaw = Array.isArray(raw.items) ? raw.items : []

  const items: LandedCostBreakdownItem[] = itemsRaw.map((item: UnknownRecord) => {
    const quantity = toNumber(item.quantity, 0)
    const weight = toNumber(item.weight_kg, 0)
    const volume = toNumber(item.volume_cbm ?? item.volume_m3, 0)
    const unitPrice = toNumber(item.unit_price, 0)
    const totalValue = toNumber(item.total_value ?? item.total_price, unitPrice * quantity)
    const allocatedFreight = toNumber(item.allocated_freight ?? item.freight_allocated, 0)
    const allocatedCustoms = toNumber(item.allocated_customs ?? item.customs_allocated, 0)
    const allocatedInsurance = toNumber(item.allocated_insurance ?? item.insurance_allocated, 0)
    const allocatedLocal = toNumber(item.allocated_local, 0)
    const allocatedOther = toNumber(item.allocated_other ?? item.other_allocated, 0)
    const totalAllocated = toNumber(item.total_allocated ?? item.total_allocated_cost, allocatedFreight + allocatedCustoms + allocatedInsurance + allocatedLocal + allocatedOther)
    const totalLanded = toNumber(item.total_landed_cost, totalValue + totalAllocated)

    return {
      sli_id: toNumber(item.sli_id ?? item.item_id ?? item.id),
      product_id: toNumber(item.product_id),
      product_reference: String(item.product_reference ?? ''),
      product_name: String(item.product_name ?? ''),
      description: item.description ?? item.product_name ?? null,
      sku: item.sku ?? item.product_reference ?? null,
      quantity,
      unit_price: unitPrice,
      total_value: totalValue,
      total_price: totalValue,
      weight_kg: item.weight_kg == null ? null : weight,
      volume_cbm: item.volume_cbm == null && item.volume_m3 == null ? null : volume,
      allocated_freight: allocatedFreight,
      allocated_customs: allocatedCustoms,
      allocated_insurance: allocatedInsurance,
      allocated_local: allocatedLocal,
      allocated_other: allocatedOther,
      total_allocated: totalAllocated,
      total_allocated_cost: totalAllocated,
      total_landed_cost: totalLanded,
      landed_cost_per_unit: toNumber(item.landed_cost_per_unit, quantity > 0 ? totalLanded / quantity : 0),
      weight_share_percent: toNumber(item.weight_share_percent, 0),
      volume_share_percent: toNumber(item.volume_share_percent, 0),
      value_share_percent: toNumber(item.value_share_percent ?? item.final_share_percent, 0),
    }
  })

  const totalWeight = items.reduce((sum, item) => sum + (item.weight_kg || 0), 0)
  const totalVolume = items.reduce((sum, item) => sum + (item.volume_cbm || 0), 0)

  const allocationsByProductRaw: ProductAllocation[] = Array.isArray(raw.allocations)
    ? raw.allocations.map((allocation: UnknownRecord) => ({
        product_id: toNumber(allocation.product_id),
        product_reference: String(allocation.product_reference ?? ''),
        product_name: String(allocation.product_name ?? ''),
        weight_kg: toNumber(allocation.weight_kg),
        volume_m3: toNumber(allocation.volume_m3),
        unit_value: toNumber(allocation.unit_value),
        quantity: toNumber(allocation.quantity),
        weight_share_percent: toNumber(allocation.weight_share_percent),
        volume_share_percent: toNumber(allocation.volume_share_percent),
        value_share_percent: toNumber(allocation.value_share_percent),
        final_share_percent: toNumber(allocation.final_share_percent ?? allocation.value_share_percent),
        allocated_freight: toNumber(allocation.allocated_freight),
        allocated_customs: toNumber(allocation.allocated_customs),
        allocated_insurance: toNumber(allocation.allocated_insurance),
        allocated_other: toNumber(allocation.allocated_other),
        total_allocated: toNumber(allocation.total_allocated),
        landed_cost_per_unit: toNumber(allocation.landed_cost_per_unit),
      }))
    : []

  const allocationsByProduct = allocationsByProductRaw.length > 0
    ? allocationsByProductRaw
    : items.map(mapAllocationFromItem)

  const totalFreight = toNumber(raw.total_freight_cost)
  const totalCustoms = toNumber(raw.total_customs_cost)
  const totalInsurance = toNumber(raw.total_insurance_cost)
  const totalLocal = toNumber(raw.total_local_cost, 0)
  const totalOther = toNumber(raw.total_other_cost)
  const totalLanded = toNumber(raw.total_landed_cost)

  return {
    lot_id: toNumber(raw.lot_id),
    lot_reference: String(raw.lot_reference ?? ''),
    total_product_value: toNumber(raw.total_product_value),
    total_freight_costs: totalFreight + totalCustoms + totalInsurance + totalLocal + totalOther,
    total_freight_cost: totalFreight,
    total_customs_cost: totalCustoms,
    total_insurance_cost: totalInsurance,
    total_local_cost: totalLocal,
    total_other_cost: totalOther,
    total_landed_cost: totalLanded,
    total_weight_kg: toNumber(raw.total_weight_kg, totalWeight),
    total_volume_cbm: toNumber(raw.total_volume_cbm, totalVolume),
    avg_cost_per_kg: totalWeight > 0 ? totalLanded / totalWeight : null,
    avg_cost_per_cbm: totalVolume > 0 ? totalLanded / totalVolume : null,
    allocation_strategy: raw.allocation_strategy ?? raw.strategy ?? null,
    allocation_date: raw.allocation_date ?? raw.calculated_at ?? null,
    allocation_completed: Boolean(raw.allocation_completed ?? raw.calculated_at),
    items,
    cost_breakdown_by_type: {
      FREIGHT: totalFreight,
      CUSTOMS: totalCustoms,
      INSURANCE: totalInsurance,
      LOCAL: totalLocal,
      HANDLING: 0,
      OTHER: totalOther,
    },
    allocations_by_product: allocationsByProduct,
  }
}

function toSupplyLotCreatePayload(data: SupplyLotCreateDto): UnknownRecord {
  return {
    lot_reference: data.lot_reference,
    lot_name: data.lot_name || undefined,
    description: data.lot_name || undefined,
    supplier_id: data.lot_supplier_id || undefined,
    lot_status: data.lot_status || undefined,
    lot_eta: data.lot_eta || undefined,
    lot_arrival_date: data.lot_arrival_date || undefined,
  }
}

function toSupplyLotUpdatePayload(data: SupplyLotUpdateDto): UnknownRecord {
  return {
    lot_reference: data.lot_reference || undefined,
    lot_name: data.lot_name || undefined,
    description: data.lot_name || undefined,
    supplier_id: data.lot_supplier_id || undefined,
    lot_status: data.lot_status || undefined,
    lot_eta: data.lot_eta || undefined,
    lot_arrival_date: data.lot_arrival_date || undefined,
  }
}

function toSupplyLotItemCreatePayload(data: SupplyLotItemCreateDto): UnknownRecord {
  return {
    product_id: data.sli_prd_id,
    quantity: data.sli_quantity,
    unit_price: data.sli_unit_price,
    weight_kg: data.sli_weight_kg ?? undefined,
    volume_m3: data.sli_volume_cbm ?? undefined,
    sku: data.sli_sku ?? undefined,
    description: data.sli_description ?? undefined,
  }
}

function toSupplyLotItemUpdatePayload(data: SupplyLotItemUpdateDto): UnknownRecord {
  return {
    product_id: data.sli_prd_id ?? undefined,
    product_instance_id: data.sli_pit_id ?? undefined,
    quantity: data.sli_quantity ?? undefined,
    unit_price: data.sli_unit_price ?? undefined,
    weight_kg: data.sli_weight_kg ?? undefined,
    volume_m3: data.sli_volume_cbm ?? undefined,
    sku: data.sli_sku ?? undefined,
    description: data.sli_description ?? undefined,
  }
}

function toFreightCostPayload(data: Partial<FreightCostCreateDto | FreightCostUpdateDto>): UnknownRecord {
  return {
    cost_type: data.frc_type ?? undefined,
    description: data.frc_description ?? undefined,
    amount: data.frc_amount ?? undefined,
    frc_exchange_rate: data.frc_exchange_rate ?? undefined,
    frc_vendor_name: data.frc_vendor_name ?? undefined,
    frc_invoice_ref: data.frc_invoice_ref ?? undefined,
    frc_invoice_date: data.frc_invoice_date ?? undefined,
    frc_is_paid: data.frc_is_paid ?? undefined,
    frc_notes: data.frc_notes ?? undefined,
  }
}

/**
 * Landed Cost API methods for Supply Lots, Freight Costs, and Cost Calculations.
 */
export const landedCostApi = {
  async getSupplyLots(params: SupplyLotSearchParams = {}): Promise<SupplyLotListResponse> {
    const queryParams: Record<string, any> = {}
    if (params.page) queryParams.page = params.page
    if (params.page_size) queryParams.page_size = params.page_size
    if (params.search) queryParams.reference = params.search
    if (params.status) queryParams.status = params.status
    if (params.supplier_id) queryParams.supplier_id = params.supplier_id
    if (params.sort_by) queryParams.sort_by = params.sort_by
    if (params.sort_order) queryParams.sort_order = params.sort_order

    const response = await apiClient.get('/landed-cost/supply-lots', { params: queryParams })
    const payload = unwrapData<UnknownRecord>(response.data)
    const itemsRaw = Array.isArray(payload.items) ? payload.items : []
    const total = toNumber(payload.total)
    const page = toNumber(payload.page, params.page || 1)
    const pageSize = toNumber(payload.page_size ?? payload.size, params.page_size || 20)
    const totalPages = toNumber(payload.total_pages ?? payload.pages, pageSize > 0 ? Math.ceil(total / pageSize) : 0)

    return {
      items: itemsRaw.map(mapSupplyLot),
      total,
      page,
      size: pageSize,
      pages: totalPages,
      total_pages: totalPages,
    }
  },

  async getSupplyLotById(lotId: number): Promise<SupplyLotDetail> {
    const response = await apiClient.get(`/landed-cost/supply-lots/${lotId}`)
    return mapSupplyLotDetail(unwrapData<UnknownRecord>(response.data))
  },

  async createSupplyLot(data: SupplyLotCreateDto): Promise<SupplyLot> {
    const response = await apiClient.post('/landed-cost/supply-lots', toSupplyLotCreatePayload(data))
    return mapSupplyLot(unwrapData<UnknownRecord>(response.data))
  },

  async updateSupplyLot(lotId: number, data: SupplyLotUpdateDto): Promise<SupplyLot> {
    const response = await apiClient.put(`/landed-cost/supply-lots/${lotId}`, toSupplyLotUpdatePayload(data))
    return mapSupplyLot(unwrapData<UnknownRecord>(response.data))
  },

  async deleteSupplyLot(lotId: number): Promise<void> {
    await apiClient.delete(`/landed-cost/supply-lots/${lotId}`)
  },

  async addSupplyLotItem(lotId: number, data: SupplyLotItemCreateDto): Promise<SupplyLotItem> {
    const response = await apiClient.post(`/landed-cost/supply-lots/${lotId}/items`, toSupplyLotItemCreatePayload(data))
    return mapSupplyLotItem(unwrapData<UnknownRecord>(response.data))
  },

  async updateSupplyLotItem(lotId: number, itemId: number, data: SupplyLotItemUpdateDto): Promise<SupplyLotItem> {
    const response = await apiClient.put(`/landed-cost/supply-lots/items/${itemId}`, toSupplyLotItemUpdatePayload(data))
    return mapSupplyLotItem(unwrapData<UnknownRecord>(response.data))
  },

  async deleteSupplyLotItem(lotId: number, itemId: number): Promise<void> {
    await apiClient.delete(`/landed-cost/supply-lots/items/${itemId}`)
  },

  async addFreightCost(lotId: number, data: Omit<FreightCostCreateDto, 'frc_lot_id'>): Promise<FreightCost> {
    const response = await apiClient.post(`/landed-cost/supply-lots/${lotId}/freight-costs`, {
      ...toFreightCostPayload(data),
      frc_lot_id: lotId,
      supply_lot_id: lotId,
    })
    return mapFreightCost(unwrapData<UnknownRecord>(response.data))
  },

  async updateFreightCost(lotId: number, costId: number, data: FreightCostUpdateDto): Promise<FreightCost> {
    const response = await apiClient.put(`/landed-cost/supply-lots/freight-costs/${costId}`, toFreightCostPayload(data))
    return mapFreightCost(unwrapData<UnknownRecord>(response.data))
  },

  async deleteFreightCost(lotId: number, costId: number): Promise<void> {
    await apiClient.delete(`/landed-cost/supply-lots/freight-costs/${costId}`)
  },

  async calculateLandedCost(
    lotId: number,
    request: LandedCostCalculationRequest
  ): Promise<LandedCostCalculationResponse> {
    const response = await apiClient.post(`/landed-cost/supply-lots/${lotId}/calculate-landed-cost`, {
      strategy: request.strategy,
      recalculate: request.recalculate ?? false,
    })
    const payload = unwrapData<UnknownRecord>(response.data)

    return {
      strategy: payload.strategy ?? request.strategy,
      total_cost_to_allocate: toNumber(payload.total_cost_to_allocate),
      allocations: Array.isArray(payload.allocations) ? payload.allocations.map((allocation: UnknownRecord) => ({
        product_id: toNumber(allocation.product_id),
        product_reference: String(allocation.product_reference ?? ''),
        product_name: String(allocation.product_name ?? ''),
        weight_kg: toNumber(allocation.weight_kg),
        volume_m3: toNumber(allocation.volume_m3),
        unit_value: toNumber(allocation.unit_value),
        quantity: toNumber(allocation.quantity),
        weight_share_percent: toNumber(allocation.weight_share_percent),
        volume_share_percent: toNumber(allocation.volume_share_percent),
        value_share_percent: toNumber(allocation.value_share_percent),
        final_share_percent: toNumber(allocation.final_share_percent),
        allocated_freight: toNumber(allocation.allocated_freight),
        allocated_customs: toNumber(allocation.allocated_customs),
        allocated_insurance: toNumber(allocation.allocated_insurance),
        allocated_other: toNumber(allocation.allocated_other),
        total_allocated: toNumber(allocation.total_allocated),
        landed_cost_per_unit: toNumber(allocation.landed_cost_per_unit),
      })) : [],
      calculation_timestamp: String(payload.calculation_timestamp ?? new Date().toISOString()),
    }
  },

  async getLandedCostBreakdown(lotId: number): Promise<LandedCostBreakdown> {
    const response = await apiClient.get(`/landed-cost/supply-lots/${lotId}/landed-cost-breakdown`)
    return mapBreakdown(unwrapData<UnknownRecord>(response.data))
  },

  async getAllocationHistory(lotId: number): Promise<AllocationLog[]> {
    const response = await apiClient.get(`/landed-cost/supply-lots/${lotId}/allocation-history`)
    const payload = unwrapData<any>(response.data)
    const rows = Array.isArray(payload) ? payload : []
    return rows.map((row: UnknownRecord) => ({
      log_id: toNumber(row.log_id ?? row.id),
      log_lot_id: toNumber(row.log_lot_id ?? row.lot_id),
      log_strategy: row.log_strategy ?? row.strategy ?? 'VALUE',
      log_mixed_weights: row.log_mixed_weights ?? null,
      log_total_allocated: toNumber(row.log_total_allocated ?? row.total_cost_allocated),
      log_created_at: String(row.log_created_at ?? row.calculated_at ?? ''),
      log_created_by: row.log_created_by ?? row.calculated_by ?? null,
    }))
  },
}
