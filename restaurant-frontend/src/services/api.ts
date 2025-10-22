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

interface Restaurant {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  postal_code?: string;
  country: string;
  cuisine_type: string;
  description?: string;
  logo?: string;
  website?: string;
  opening_hours?: string;
  delivery_fee: number;
  minimum_order: number;
  average_rating: number;
  total_reviews: number;
  status: 'active' | 'inactive' | 'suspended';
  is_partner: boolean;
  commission_rate: number;
  created_at: string;
  updated_at: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role_id: string;
  role_name: string;
  company_id?: string;
  company_name?: string;
  restaurant_id?: string;
  restaurant_name?: string;
  status: 'active' | 'inactive' | 'suspended';
  email_verified_at?: string;
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

    const data = await response.json();

    if (!response.ok) {
      // Pour les erreurs d'authentification, on lance une exception avec le message de l'API
      throw new Error(data.message || `HTTP error! status: ${response.status}`);
    }

    return data;
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

  // Restaurants API
  async getRestaurants(): Promise<Restaurant[]> {
    const response = await this.request<Restaurant[]>('/admin/restaurants');
    return response.data;
  }

  async createRestaurant(restaurantData: Omit<Restaurant, 'id' | 'average_rating' | 'total_reviews' | 'created_at' | 'updated_at'>): Promise<Restaurant> {
    const response = await this.request<Restaurant>('/admin/restaurants', {
      method: 'POST',
      body: JSON.stringify(restaurantData),
    });
    return response.data;
  }

  async updateRestaurant(id: string, restaurantData: Partial<Omit<Restaurant, 'id' | 'created_at' | 'updated_at'>>): Promise<Restaurant> {
    const response = await this.request<Restaurant>(`/admin/restaurants/${id}`, {
      method: 'PUT',
      body: JSON.stringify(restaurantData),
    });
    return response.data;
  }

  async deleteRestaurant(id: string): Promise<void> {
    await this.request(`/admin/restaurants/${id}`, {
      method: 'DELETE',
    });
  }

  // Users API
  async getUsers(): Promise<User[]> {
    const response = await this.request<User[]>('/admin/users');
    return response.data;
  }

  async createUser(userData: Omit<User, 'id' | 'role_name' | 'company_name' | 'restaurant_name' | 'created_at' | 'updated_at'> & { password: string }): Promise<User> {
    const response = await this.request<User>('/admin/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
    return response.data;
  }

  async updateUser(id: string, userData: Partial<Omit<User, 'id' | 'created_at' | 'updated_at'>>): Promise<User> {
    const response = await this.request<User>(`/admin/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
    return response.data;
  }

  async deleteUser(id: string): Promise<void> {
    await this.request(`/admin/users/${id}`, {
      method: 'DELETE',
    });
  }

  // Auth API
  async login(email: string, password: string): Promise<{ success: boolean; user: any; token: string }> {
    const url = `${API_BASE_URL}/login`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || `HTTP error! status: ${response.status}`);
    }

    return data; // L'API de login retourne directement { success, user, token }
  }
}

export const apiService = new ApiService();
export type { Role, Permission, Company, Restaurant, User };
