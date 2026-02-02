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
  page: number;
  page_size: number;
  search?: string;
  status?: LotStatus;
  supplier_id?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export type FreightCostType = 'FREIGHT' | 'CUSTOMS' | 'INSURANCE' | 'OTHER';

export const FREIGHT_COST_TYPE_LABELS: Record<FreightCostType, string> = {
  FREIGHT: 'Freight',
  CUSTOMS: 'Customs',
  INSURANCE: 'Insurance',
  OTHER: 'Other',
};

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
  freight_cost: number;
  customs_cost: number;
  insurance_cost: number;
  other_cost: number;
  product_ids: number[];
  quantities: Record<number, number>;
}

export interface LandedCostCalculationResponse {
  strategy: AllocationStrategy;
  total_cost_to_allocate: number;
  allocations: ProductAllocation[];
  calculation_timestamp: string;
}
