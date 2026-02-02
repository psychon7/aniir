/**
 * Client API Service
 * Handles all client-related API calls
 */

import apiClient, { PaginatedResponse, getErrorMessage } from '../client';
import { API_ENDPOINTS } from '../endpoints';

// Types matching backend Pydantic schemas
export interface Client {
  id: number;
  reference: string;
  company_name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  postal_code: string | null;
  country_id: number | null;
  country_name?: string;
  vat_number: string | null;
  credit_limit: number;
  payment_term_id: number | null;
  payment_term_name?: string;
  status_id: number;
  status_name?: string;
  status_color?: string;
  created_at: string;
  updated_at: string | null;
}

export interface ClientCreate {
  company_name: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  postal_code?: string | null;
  country_id?: number | null;
  vat_number?: string | null;
  credit_limit?: number;
  payment_term_id?: number | null;
  status_id?: number;
}

export interface ClientUpdate {
  company_name?: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  postal_code?: string | null;
  country_id?: number | null;
  vat_number?: string | null;
  credit_limit?: number;
  payment_term_id?: number | null;
  status_id?: number;
}

export interface ClientListParams {
  page?: number;
  size?: number;
  search?: string;
  status_id?: number;
  country_id?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

// Client Service
export const clientService = {
  /**
   * Get paginated list of clients
   */
  async getClients(params: ClientListParams = {}): Promise<PaginatedResponse<Client>> {
    const response = await apiClient.get<PaginatedResponse<Client>>(
      API_ENDPOINTS.CLIENTS.BASE,
      { params }
    );
    return response.data;
  },

  /**
   * Get a single client by ID
   */
  async getClient(id: number): Promise<Client> {
    const response = await apiClient.get<Client>(
      API_ENDPOINTS.CLIENTS.BY_ID(id)
    );
    return response.data;
  },

  /**
   * Create a new client
   */
  async createClient(data: ClientCreate): Promise<Client> {
    const response = await apiClient.post<Client>(
      API_ENDPOINTS.CLIENTS.BASE,
      data
    );
    return response.data;
  },

  /**
   * Update an existing client
   */
  async updateClient(id: number, data: ClientUpdate): Promise<Client> {
    const response = await apiClient.put<Client>(
      API_ENDPOINTS.CLIENTS.BY_ID(id),
      data
    );
    return response.data;
  },

  /**
   * Delete a client
   */
  async deleteClient(id: number): Promise<void> {
    await apiClient.delete(API_ENDPOINTS.CLIENTS.BY_ID(id));
  },

  /**
   * Search clients by term
   */
  async searchClients(term: string, limit: number = 10): Promise<Client[]> {
    const response = await apiClient.get<Client[]>(
      API_ENDPOINTS.CLIENTS.SEARCH,
      { params: { q: term, limit } }
    );
    return response.data;
  },
};

export default clientService;
