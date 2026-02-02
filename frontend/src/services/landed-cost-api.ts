/**
 * Landed Cost API service.
 */
import api from '@/lib/api';
import {
  AllocationStrategy,
  LandedCostStrategyResponse,
  LandedCostCalculationRequest,
  LandedCostCalculationResponse,
} from '@/types/landed-cost';

export const landedCostApi = {
  /**
   * Get available allocation strategies.
   */
  getStrategies: async (
    currentStrategy?: AllocationStrategy
  ): Promise<LandedCostStrategyResponse> => {
    const params = currentStrategy ? { current_strategy: currentStrategy } : {};
    const response = await api.get<LandedCostStrategyResponse>(
      '/landed-cost/strategies',
      { params }
    );
    return response.data;
  },

  /**
   * Calculate landed costs for products.
   */
  calculate: async (
    request: LandedCostCalculationRequest
  ): Promise<LandedCostCalculationResponse> => {
    const response = await api.post<LandedCostCalculationResponse>(
      '/landed-cost/calculate',
      request
    );
    return response.data;
  },

  /**
   * Validate strategy configuration.
   */
  validateStrategy: async (
    strategy: AllocationStrategy,
    mixedWeights?: { weight_percent: number; volume_percent: number; value_percent: number }
  ): Promise<{ valid: boolean; message: string }> => {
    const response = await api.post<{ valid: boolean; message: string }>(
      '/landed-cost/validate-strategy',
      { strategy, mixed_weights: mixedWeights }
    );
    return response.data;
  },
};
