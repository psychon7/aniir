/**
 * Landed Cost types for cost allocation strategies.
 */

export enum AllocationStrategy {
  WEIGHT = 'WEIGHT',
  VOLUME = 'VOLUME',
  VALUE = 'VALUE',
  MIXED = 'MIXED',
}

export type LotStatus = 'DRAFT' | 'IN_TRANSIT' | 'CUSTOMS' | 'COMPLETED' | 'CANCELLED';

export const LOT_STATUS_LABELS: Record<LotStatus, string> = {
  DRAFT: 'Draft',
  IN_TRANSIT: 'In Transit',
  CUSTOMS: 'At Customs',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
};

export const LOT_STATUS_COLORS: Record<LotStatus, string> = {
  DRAFT: 'bg-gray-100 text-gray-800',
  IN_TRANSIT: 'bg-blue-100 text-blue-800',
  CUSTOMS: 'bg-amber-100 text-amber-800',
  COMPLETED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
};

export interface SupplyLotSearchParams {
  page?: number;
  page_size?: number;
  search?: string;
  status?: LotStatus;
  supplier_id?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export type FreightCostType = 'FREIGHT' | 'CUSTOMS' | 'INSURANCE' | 'LOCAL' | 'HANDLING' | 'OTHER';

export const FREIGHT_COST_TYPE_LABELS: Record<FreightCostType, string> = {
  FREIGHT: 'Freight',
  CUSTOMS: 'Customs',
  INSURANCE: 'Insurance',
  LOCAL: 'Local Charges',
  HANDLING: 'Handling',
  OTHER: 'Other',
};

export interface FreightCost {
  frc_id: number;
  frc_type: FreightCostType;
  frc_description: string;
  frc_amount: number;
  frc_amount_converted: number;
  frc_exchange_rate: number;
  frc_vendor_name: string | null;
  frc_invoice_ref: string | null;
  frc_invoice_date: string | null;
  frc_paid_date: string | null;
  frc_is_paid: boolean;
  frc_notes: string | null;
  frc_created_at: string;
  frc_updated_at: string;
}

export interface SupplyLotItem {
  sli_id: number;
  sli_prd_id: number;
  sli_pit_id: number | null;
  sli_quantity: number;
  sli_unit_price: number;
  sli_total_price: number;
  sli_weight_kg: number | null;
  sli_volume_cbm: number | null;
  sli_unit_weight_kg: number | null;
  sli_unit_volume_cbm: number | null;
  sli_sku: string | null;
  sli_description: string | null;
  sli_total_allocated_cost: number;
  sli_total_landed_cost: number;
  sli_landed_cost_per_unit: number | null;
  sli_allocated_freight: number;
  sli_allocated_customs: number;
  sli_allocated_insurance: number;
  sli_allocated_local: number;
  sli_allocated_other: number;
}

export interface SupplyLot {
  lot_id: number;
  lot_reference: string;
  lot_name: string;
  lot_supplier_id: number;
  lot_supplier_name: string;
  lot_status: LotStatus;
  lot_eta: string | null;
  lot_arrival_date: string | null;
  lot_total_value: number;
  lot_total_freight: number;
  lot_total_landed_cost: number;
  lot_total_items: number;
  lot_total_freight_cost: number;
  lot_total_customs_cost: number;
  lot_total_insurance_cost: number;
  lot_total_local_cost: number;
  lot_total_other_cost: number;
  lot_allocation_completed: boolean;
  lot_items: SupplyLotItem[];
  lot_freight_costs: FreightCost[];
  lot_created_at: string;
  lot_updated_at: string;
}

export interface MixedStrategyWeights {
  weight_percent: number;
  volume_percent: number;
  value_percent: number;
}

export interface StrategyOption {
  value: AllocationStrategy;
  label: string;
  description: string;
  icon: string;
}

export interface LandedCostStrategyResponse {
  strategy: AllocationStrategy;
  mixed_weights: MixedStrategyWeights | null;
  strategy_options: StrategyOption[];
}

export interface ProductAllocation {
  product_id: number;
  product_reference: string;
  product_name: string;
  weight_kg: number;
  volume_m3: number;
  unit_value: number;
  quantity: number;
  weight_share_percent: number;
  volume_share_percent: number;
  value_share_percent: number;
  final_share_percent: number;
  allocated_freight: number;
  allocated_customs: number;
  allocated_insurance: number;
  allocated_other: number;
  total_allocated: number;
  landed_cost_per_unit: number;
}

export interface LandedCostCalculationRequest {
  strategy: AllocationStrategy;
  mixed_weights?: MixedStrategyWeights;
  freight_cost?: number;
  customs_cost?: number;
  insurance_cost?: number;
  other_cost?: number;
  product_ids?: number[];
  quantities?: Record<number, number>;
  recalculate?: boolean;
}

export interface LandedCostCalculationResponse {
  strategy: AllocationStrategy;
  total_cost_to_allocate: number;
  allocations: ProductAllocation[];
  calculation_timestamp: string;
}

// Additional types for API operations

export interface SupplyLotDetail extends SupplyLot {
  // Extended detail view with additional computed fields
  lot_description: string | null;
  lot_ship_date: string | null;
  lot_eta_date: string | null;
  lot_total_quantity: number;
  lot_total_weight_kg: number;
  lot_total_volume_cbm: number;
  lot_allocation_date: string | null;
  total_cost: number;
  items: SupplyLotItem[];
  freight_costs: FreightCost[];
}

export interface SupplyLotCreateDto {
  lot_reference: string;
  lot_name?: string;
  lot_supplier_id?: number;
  lot_status?: LotStatus;
  lot_eta?: string;
  lot_arrival_date?: string;
}

export interface SupplyLotUpdateDto {
  lot_reference?: string;
  lot_name?: string;
  lot_supplier_id?: number;
  lot_status?: LotStatus;
  lot_eta?: string;
  lot_arrival_date?: string;
}

export interface SupplyLotListResponse {
  items: SupplyLot[];
  total: number;
  page: number;
  size: number;
  pages: number;
  total_pages: number;
}

export interface SupplyLotItemCreateDto {
  sli_prd_id: number;
  sli_quantity: number;
  sli_unit_price: number;
  sli_weight_kg?: number;
  sli_volume_cbm?: number;
  sli_sku?: string;
  sli_description?: string;
}

export interface SupplyLotItemUpdateDto {
  sli_prd_id?: number;
  sli_pit_id?: number | null;
  sli_quantity?: number;
  sli_unit_price?: number;
  sli_weight_kg?: number;
  sli_volume_cbm?: number;
  sli_sku?: string;
  sli_description?: string;
}

export interface FreightCostCreateDto {
  frc_lot_id: number;
  frc_type: FreightCostType;
  frc_description: string;
  frc_amount: number;
  frc_exchange_rate?: number;
  frc_vendor_name?: string;
  frc_invoice_ref?: string;
  frc_invoice_date?: string;
  frc_is_paid?: boolean;
  frc_notes?: string;
}

export interface FreightCostUpdateDto {
  frc_type?: FreightCostType;
  frc_description?: string;
  frc_amount?: number;
  frc_exchange_rate?: number;
  frc_vendor_name?: string;
  frc_invoice_ref?: string;
  frc_invoice_date?: string;
  frc_is_paid?: boolean;
  frc_notes?: string;
}

export interface LandedCostBreakdownItem {
  sli_id: number;
  product_id: number;
  product_reference: string;
  product_name: string;
  description: string | null;
  sku: string | null;
  quantity: number;
  unit_price: number;
  total_value: number;
  total_price: number;
  weight_kg: number | null;
  volume_cbm: number | null;
  allocated_freight: number;
  allocated_customs: number;
  allocated_insurance: number;
  allocated_local: number;
  allocated_other: number;
  total_allocated: number;
  total_allocated_cost: number;
  total_landed_cost: number;
  landed_cost_per_unit: number;
  weight_share_percent: number;
  volume_share_percent: number;
  value_share_percent: number;
}

export interface LandedCostBreakdown {
  lot_id: number;
  lot_reference: string;
  total_product_value: number;
  total_freight_costs: number;
  total_freight_cost: number;
  total_customs_cost: number;
  total_insurance_cost: number;
  total_local_cost: number;
  total_other_cost: number;
  total_landed_cost: number;
  total_weight_kg: number;
  total_volume_cbm: number;
  avg_cost_per_kg: number | null;
  avg_cost_per_cbm: number | null;
  allocation_strategy: AllocationStrategy | null;
  allocation_date: string | null;
  allocation_completed: boolean;
  items: LandedCostBreakdownItem[];
  cost_breakdown_by_type: Record<FreightCostType, number>;
  allocations_by_product: ProductAllocation[];
}

export interface AllocationLog {
  log_id: number;
  log_lot_id: number;
  log_strategy: AllocationStrategy;
  log_mixed_weights: MixedStrategyWeights | null;
  log_total_allocated: number;
  log_created_at: string;
  log_created_by: string | null;
}
