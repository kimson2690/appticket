const API_BASE_URL = 'http://localhost:8001/api';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

interface Role {
  id: string;
  name: string;
  description: string;
  is_system: boolean;
  permissions: string[];
  user_count: number;
  created_at: string;
}

interface Permission {
  id: string;
  name: string;
  description: string;
  category: string;
}

interface Company {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  postal_code: string;
  country: string;
  website?: string;
  description?: string;
  logo?: string;
  status: 'active' | 'inactive' | 'suspended';
  employee_count: number;
  ticket_balance: number;
  created_at: string;
  updated_at: string;
}

class ApiService {
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  // Roles API
  async getRoles(): Promise<Role[]> {
    const response = await this.request<Role[]>('/admin/roles');
    return response.data;
  }

  async createRole(roleData: { name: string; description: string; permissions: string[] }): Promise<Role> {
    const response = await this.request<Role>('/admin/roles', {
      method: 'POST',
      body: JSON.stringify(roleData),
    });
    return response.data;
  }

  async updateRole(id: string, roleData: { name: string; description: string; permissions: string[] }): Promise<Role> {
    const response = await this.request<Role>(`/admin/roles/${id}`, {
      method: 'PUT',
      body: JSON.stringify(roleData),
    });
    return response.data;
  }

  async deleteRole(id: string): Promise<void> {
    await this.request(`/admin/roles/${id}`, {
      method: 'DELETE',
    });
  }

  // Permissions API
  async getPermissions(): Promise<Permission[]> {
    const response = await this.request<Permission[]>('/admin/permissions/all');
    return response.data;
  }

  async getPermissionsByCategory(): Promise<{ category: string; permissions: Permission[] }[]> {
    const response = await this.request<{ category: string; permissions: Permission[] }[]>('/admin/permissions');
    return response.data;
  }

  // Companies API
  async getCompanies(): Promise<Company[]> {
    const response = await this.request<Company[]>('/admin/companies');
    return response.data;
  }

  async createCompany(companyData: Omit<Company, 'id' | 'employee_count' | 'ticket_balance' | 'created_at' | 'updated_at'>): Promise<Company> {
    const response = await this.request<Company>('/admin/companies', {
      method: 'POST',
      body: JSON.stringify(companyData),
    });
    return response.data;
  }

  async updateCompany(id: string, companyData: Partial<Omit<Company, 'id' | 'created_at' | 'updated_at'>>): Promise<Company> {
    const response = await this.request<Company>(`/admin/companies/${id}`, {
      method: 'PUT',
      body: JSON.stringify(companyData),
    });
    return response.data;
  }

  async deleteCompany(id: string): Promise<void> {
    await this.request(`/admin/companies/${id}`, {
      method: 'DELETE',
    });
  }

  // Auth API
  async login(email: string, password: string): Promise<{ user: any; token: string }> {
    const response = await this.request<{ user: any; token: string }>('/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    return response.data;
  }
}

export const apiService = new ApiService();
export type { Role, Permission, Company };
