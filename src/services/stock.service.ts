import { apiClient, normalizeApiResponse } from './api';
import { StockAvailability, StockMovementInput } from '../types';

export interface AvailabilityQueryFilter {
  productId?: string;
  unitId?: string;
  locationId?: string;
}

export const stockService = {
  async getAvailability(filter?: AvailabilityQueryFilter): Promise<StockAvailability[]> {
    const params: Record<string, string> = {};
    if (filter?.productId) params.productId = filter.productId;
    if (filter?.unitId) params.unitId = filter.unitId;
    if (filter?.locationId) params.locationId = filter.locationId;

    const response = await apiClient.get<StockAvailability[] | { data: StockAvailability[] }>(
      '/stock/availability',
      { params }
    );
    const data = normalizeApiResponse<StockAvailability[]>(response.data);
    return Array.isArray(data) ? data : [];
  },

  async createMovement(input: StockMovementInput): Promise<StockMovementInput> {
    const response = await apiClient.post<StockMovementInput | { data: StockMovementInput }>(
      '/stock/movements',
      input
    );
    return normalizeApiResponse<StockMovementInput>(response.data);
  },
};
