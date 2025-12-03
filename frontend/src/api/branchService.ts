/**
 * Branch Service - Gestión de Sucursales
 * Soporta arquitectura multi-sucursal
 */

import { apiClient } from './client';

export interface Branch {
  id: number;
  company_id: number;
  code: string;
  name: string;
  address: string;
  city: string;
  region: string;
  phone: string;
  email: string;
  manager_name: string;
  opening_time: string;
  closing_time: string;
  is_active: boolean;
  has_delivery: boolean;
  has_takeaway: boolean;
  delivery_fee: number;
  minimum_order: number;
  last_sync_at: string | null;
  sync_status: 'pending' | 'syncing' | 'synced' | 'error';
  created_at: string;
}

export interface Terminal {
  id: number;
  branch_id: number;
  code: string;
  name: string;
  type: 'main' | 'pos' | 'tablet' | 'kitchen' | 'bar';
  can_open_cash: boolean;
  can_close_cash: boolean;
  can_process_payments: boolean;
  can_view_reports: boolean;
  can_modify_orders: boolean;
  can_send_to_kitchen: boolean;
  is_active: boolean;
  last_activity_at: string | null;
  ip_address: string;
}

export interface KitchenStation {
  id: number;
  branch_id: number;
  code: string;
  name: string;
  printer_id: number | null;
  display_order: number;
  is_active: boolean;
  category_ids: number[];
}

class BranchService {
  private currentBranchId: number = 1;
  private currentTerminalId: number = 1;

  // Obtener sucursal actual (del localStorage o configuración)
  getCurrentBranchId(): number {
    const stored = localStorage.getItem('currentBranchId');
    if (stored) {
      this.currentBranchId = parseInt(stored);
    }
    return this.currentBranchId;
  }

  setCurrentBranch(branchId: number): void {
    this.currentBranchId = branchId;
    localStorage.setItem('currentBranchId', branchId.toString());
  }

  getCurrentTerminalId(): number {
    const stored = localStorage.getItem('currentTerminalId');
    if (stored) {
      this.currentTerminalId = parseInt(stored);
    }
    return this.currentTerminalId;
  }

  setCurrentTerminal(terminalId: number): void {
    this.currentTerminalId = terminalId;
    localStorage.setItem('currentTerminalId', terminalId.toString());
  }

  // API Calls
  async getBranches(): Promise<Branch[]> {
    const response = await apiClient.get('/branches');
    return response.data.data || response.data;
  }

  async getBranch(id: number): Promise<Branch> {
    const response = await apiClient.get(`/branches/${id}`);
    return response.data.data || response.data;
  }

  async createBranch(data: Partial<Branch>): Promise<Branch> {
    const response = await apiClient.post('/branches', data);
    return response.data.data || response.data;
  }

  async updateBranch(id: number, data: Partial<Branch>): Promise<Branch> {
    const response = await apiClient.put(`/branches/${id}`, data);
    return response.data.data || response.data;
  }

  // Terminales
  async getTerminals(branchId?: number): Promise<Terminal[]> {
    const bid = branchId || this.getCurrentBranchId();
    const response = await apiClient.get(`/branches/${bid}/terminals`);
    return response.data.data || response.data;
  }

  async getTerminal(id: number): Promise<Terminal> {
    const response = await apiClient.get(`/terminals/${id}`);
    return response.data.data || response.data;
  }

  async createTerminal(data: Partial<Terminal>): Promise<Terminal> {
    const response = await apiClient.post('/terminals', {
      ...data,
      branch_id: data.branch_id || this.getCurrentBranchId()
    });
    return response.data.data || response.data;
  }

  async updateTerminal(id: number, data: Partial<Terminal>): Promise<Terminal> {
    const response = await apiClient.put(`/terminals/${id}`, data);
    return response.data.data || response.data;
  }

  // Estaciones de cocina/barra
  async getKitchenStations(branchId?: number): Promise<KitchenStation[]> {
    const bid = branchId || this.getCurrentBranchId();
    const response = await apiClient.get(`/branches/${bid}/kitchen-stations`);
    return response.data.data || response.data;
  }

  async createKitchenStation(data: Partial<KitchenStation>): Promise<KitchenStation> {
    const response = await apiClient.post('/kitchen-stations', {
      ...data,
      branch_id: data.branch_id || this.getCurrentBranchId()
    });
    return response.data.data || response.data;
  }

  // Sincronización
  async triggerSync(branchId?: number): Promise<{ success: boolean; message: string }> {
    const bid = branchId || this.getCurrentBranchId();
    const response = await apiClient.post(`/branches/${bid}/sync`);
    return response.data;
  }

  async getSyncStatus(branchId?: number): Promise<{ status: string; lastSync: string; pending: number }> {
    const bid = branchId || this.getCurrentBranchId();
    const response = await apiClient.get(`/branches/${bid}/sync/status`);
    return response.data.data || response.data;
  }
}

export const branchService = new BranchService();
export default branchService;
