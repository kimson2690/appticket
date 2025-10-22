const API_BASE_URL = 'http://localhost:8001/api';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

interface Role {
  id: number;
  name: string;
  description: string;
  user_count: number;
  created_at: string;
  updated_at: string;
  // Champs optionnels pour compatibilité avec le composant
  is_system?: boolean;
  permissions?: string[];
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
  city?: string;
  postal_code?: string;
  country?: string;
  cuisine_type: string;
  description?: string;
  logo?: string;
  website?: string;
  opening_hours?: string;
  delivery_fee: number;
  minimum_order?: number;
  min_order?: number; // Alias pour minimum_order
  average_rating?: number;
  rating?: number; // Alias pour average_rating
  total_reviews?: number;
  status?: 'active' | 'inactive' | 'suspended';
  is_active?: boolean;
  is_partner?: boolean;
  commission_rate?: number;
  created_at?: string;
  updated_at?: string;
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

interface Employee {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company_id: string;
  company_name: string;
  department?: string;
  position?: string;
  employee_number?: string;
  ticket_balance: number;
  status: 'active' | 'inactive' | 'suspended' | 'pending';
  hire_date?: string;
  created_at: string;
  updated_at: string;
}

class ApiService {
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    // Récupérer les informations de l'utilisateur depuis localStorage
    const userId = localStorage.getItem('userId');
    const userName = localStorage.getItem('userName');
    const userRole = localStorage.getItem('userRole');
    const companyId = localStorage.getItem('userCompanyId');
    const restaurantId = localStorage.getItem('restaurantId') || localStorage.getItem('userRestaurantId');
    
    console.log('=== REQUEST DEBUG ===');
    console.log('URL complète:', url);
    console.log('Options:', options);
    console.log('User Info:', { userId, userName, userRole, companyId });
    
    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-User-Id': userId || '',
          'X-User-Name': userName || '',
          'X-User-Role': userRole || '',
          'X-User-Company-Id': companyId || '',
          'X-User-Restaurant-Id': restaurantId || '',
          ...options.headers,
        },
        ...options,
      });

      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));

      const data = await response.json();
      console.log('Response data:', data);

      if (!response.ok) {
        console.error('Response not ok - throwing error');
        // Pour les erreurs d'authentification, on lance une exception avec le message de l'API
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }

      console.log('Request successful, returning data');
      return data;
    } catch (error) {
      console.error('Erreur dans request:', error);
      throw error;
    }
  }

  // Roles API
  async getRoles(): Promise<Role[]> {
    const response = await this.request<Role[]>('/admin/roles');
    return response.data;
  }

  async createRole(roleData: { name: string; description: string }): Promise<Role> {
    const response = await this.request<Role>('/admin/roles', {
      method: 'POST',
      body: JSON.stringify(roleData),
    });
    return response.data;
  }

  async updateRole(id: string, roleData: { name: string; description: string }): Promise<Role> {
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

  // Employees API
  async getEmployees(companyId?: string): Promise<Employee[]> {
    const endpoint = companyId ? `/admin/employees?company_id=${companyId}` : '/admin/employees';
    const response = await this.request<Employee[]>(endpoint);
    return response.data;
  }

  async createEmployee(employeeData: Omit<Employee, 'id' | 'company_name' | 'created_at' | 'updated_at'> & { password: string }): Promise<Employee> {
    console.log('=== API createEmployee ===');
    console.log('URL:', `${API_BASE_URL}/admin/employees`);
    console.log('Données envoyées:', employeeData);
    
    try {
      const response = await this.request<Employee>('/admin/employees', {
        method: 'POST',
        body: JSON.stringify(employeeData),
      });
      console.log('Réponse API brute:', response);
      console.log('response.data:', response.data);
      return response.data;
    } catch (error) {
      console.error('Erreur dans createEmployee:', error);
      throw error;
    }
  }

  async updateEmployee(id: string, employeeData: Partial<Omit<Employee, 'id' | 'created_at' | 'updated_at'>>): Promise<Employee> {
    const response = await this.request<Employee>(`/admin/employees/${id}`, {
      method: 'PUT',
      body: JSON.stringify(employeeData),
    });
    return response.data;
  }

  async deleteEmployee(id: string): Promise<void> {
    await this.request(`/admin/employees/${id}`, {
      method: 'DELETE',
    });
  }

  async updateEmployeeTicketBalance(id: string, amount: number, operation: 'add' | 'subtract'): Promise<Employee> {
    const response = await this.request<Employee>(`/admin/employees/${id}/tickets`, {
      method: 'POST',
      body: JSON.stringify({ amount, operation }),
    });
    return response.data;
  }

  // Statistics API
  async getStatistics(): Promise<Statistics> {
    const response = await this.request<Statistics>('/admin/statistics');
    return response.data;
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

  // Ticket Configuration API
  async getTicketConfigurations(): Promise<TicketConfiguration[]> {
    const response = await this.request<TicketConfiguration[]>('/admin/ticket-configurations');
    return response.data;
  }

  async createTicketConfiguration(configData: Omit<TicketConfiguration, 'id' | 'created_at' | 'updated_at'>): Promise<TicketConfiguration> {
    const response = await this.request<TicketConfiguration>('/admin/ticket-configurations', {
      method: 'POST',
      body: JSON.stringify(configData),
    });
    return response.data;
  }

  async updateTicketConfiguration(id: string, configData: Partial<TicketConfiguration>): Promise<TicketConfiguration> {
    const response = await this.request<TicketConfiguration>(`/admin/ticket-configurations/${id}`, {
      method: 'PUT',
      body: JSON.stringify(configData),
    });
    return response.data;
  }

  async deleteTicketConfiguration(id: string): Promise<void> {
    await this.request(`/admin/ticket-configurations/${id}`, {
      method: 'DELETE',
    });
  }

  async getActiveTicketConfiguration(companyId?: string): Promise<TicketConfiguration> {
    const params = companyId ? `?company_id=${companyId}` : '';
    const response = await this.request<TicketConfiguration>(`/admin/ticket-configurations/active/config${params}`);
    return response.data;
  }

  // Ticket Batch API
  async getTicketBatches(): Promise<TicketBatch[]> {
    const response = await this.request<TicketBatch[]>('/admin/ticket-batches');
    return response.data;
  }

  async createTicketBatch(batchData: Omit<TicketBatch, 'id' | 'used_tickets' | 'remaining_tickets' | 'status' | 'created_at' | 'updated_at'>): Promise<TicketBatch> {
    const response = await this.request<TicketBatch>('/admin/ticket-batches', {
      method: 'POST',
      body: JSON.stringify(batchData),
    });
    return response.data;
  }

  async getTicketBatch(id: string): Promise<TicketBatch> {
    const response = await this.request<TicketBatch>(`/admin/ticket-batches/${id}`);
    return response.data;
  }

  async deleteTicketBatch(id: string): Promise<void> {
    await this.request(`/admin/ticket-batches/${id}`, {
      method: 'DELETE',
    });
  }

  // User Ticket Management API
  async assignTicketsToEmployee(employeeId: string, data: { tickets_count: number; batch_id?: string; notes?: string }): Promise<Employee> {
    const response = await this.request<Employee>(`/admin/employees/${employeeId}/assign-tickets`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.data;
  }

  async rechargeEmployeeBalance(employeeId: string, data: { amount: number; notes?: string }): Promise<Employee> {
    const response = await this.request<Employee>(`/admin/employees/${employeeId}/recharge`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.data;
  }

  async getTicketAssignments(employeeId?: string): Promise<TicketAssignment[]> {
    const params = employeeId ? `?employee_id=${employeeId}` : '';
    const response = await this.request<TicketAssignment[]>(`/admin/ticket-assignments${params}`);
    return response.data;
  }

  async bulkAssignTickets(data: { tickets_count: number; ticket_value: number; config_id: string; notes?: string; created_by?: string }): Promise<{ success: number; total: number; employees: Employee[]; batches: TicketBatch[] }> {
    const response = await this.request<{ success: number; total: number; employees: Employee[]; batches: TicketBatch[] }>('/admin/employees/bulk-assign-tickets', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.data;
  }

  // Company-Restaurant Partnership API
  async getPartnerRestaurants(): Promise<{ restaurant_ids: string[]; partnerships: any[] }> {
    const response = await this.request<{ restaurant_ids: string[]; partnerships: any[] }>('/admin/company-restaurants/partners');
    return response.data;
  }

  async getAvailableRestaurants(): Promise<Restaurant[]> {
    const response = await this.request<Restaurant[]>('/admin/company-restaurants/available');
    return response.data;
  }

  async updatePartnerRestaurants(restaurantIds: string[]): Promise<{ message: string; count: number }> {
    const response = await this.request<{ message: string; count: number }>('/admin/company-restaurants/partners', {
      method: 'POST',
      body: JSON.stringify({ restaurant_ids: restaurantIds }),
    });
    return response.data;
  }

  // Menu Items API
  async getMenuItems(): Promise<MenuItem[]> {
    const response = await this.request<MenuItem[]>('/admin/menu-items');
    return response.data;
  }

  async createMenuItem(data: Omit<MenuItem, 'id' | 'created_by' | 'created_at' | 'updated_at'>): Promise<MenuItem> {
    const response = await this.request<MenuItem>('/admin/menu-items', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.data;
  }

  async getMenuItem(id: string): Promise<MenuItem> {
    const response = await this.request<MenuItem>(`/admin/menu-items/${id}`);
    return response.data;
  }

  async updateMenuItem(id: string, data: Partial<Omit<MenuItem, 'id' | 'created_by' | 'created_at' | 'updated_at'>>): Promise<MenuItem> {
    const response = await this.request<MenuItem>(`/admin/menu-items/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return response.data;
  }

  async deleteMenuItem(id: string): Promise<{ message: string }> {
    const response = await this.request<{ message: string }>(`/admin/menu-items/${id}`, {
      method: 'DELETE',
    });
    return response.data;
  }

  async toggleMenuItemAvailability(id: string): Promise<MenuItem> {
    const response = await this.request<MenuItem>(`/admin/menu-items/${id}/toggle-availability`, {
      method: 'POST',
    });
    return response.data;
  }

  // Daily Menus API
  async getDailyMenus(): Promise<DailyMenu[]> {
    const response = await this.request<DailyMenu[]>('/admin/daily-menus');
    return response.data;
  }

  async createDailyMenu(data: Omit<DailyMenu, 'id' | 'created_by' | 'created_at' | 'updated_at'>): Promise<DailyMenu> {
    const response = await this.request<DailyMenu>('/admin/daily-menus', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.data;
  }

  async getDailyMenu(id: string): Promise<DailyMenu> {
    const response = await this.request<DailyMenu>(`/admin/daily-menus/${id}`);
    return response.data;
  }

  async updateDailyMenu(id: string, data: Partial<Omit<DailyMenu, 'id' | 'created_by' | 'created_at' | 'updated_at'>>): Promise<DailyMenu> {
    const response = await this.request<DailyMenu>(`/admin/daily-menus/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return response.data;
  }

  async deleteDailyMenu(id: string): Promise<{ message: string }> {
    const response = await this.request<{ message: string }>(`/admin/daily-menus/${id}`, {
      method: 'DELETE',
    });
    return response.data;
  }

  async toggleDailyMenuAvailability(id: string): Promise<DailyMenu> {
    const response = await this.request<DailyMenu>(`/admin/daily-menus/${id}/toggle-availability`, {
      method: 'POST',
    });
    return response.data;
  }

  // Weekly Menu Planning API
  async getWeeklyMenuPlanning(): Promise<WeeklyMenuPlanning> {
    const response = await this.request<WeeklyMenuPlanning>('/admin/weekly-menu/current');
    return response.data;
  }

  async saveWeeklyMenuPlanning(data: { week_planning: WeeklyMenuPlanning['week_planning']; restaurant_id?: string }): Promise<WeeklyMenuPlanning> {
    const response = await this.request<WeeklyMenuPlanning>('/admin/weekly-menu', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.data;
  }
}

export const apiService = new ApiService();

// Statistics interfaces
interface Statistics {
  overview: {
    total_users: number;
    active_users: number;
    total_companies: number;
    active_companies: number;
    total_restaurants: number;
    active_restaurants: number;
    total_employees: number;
    active_employees: number;
    total_ticket_balance: number;
  };
  users_by_role: {
    administrators: number;
    managers: number;
    employees: number;
  };
  companies_stats: CompanyStats[];
  department_stats: DepartmentStats[];
  monthly_stats: MonthlyStats[];
  ticket_distribution: TicketDistribution[];
  generated_at: string;
}

interface CompanyStats {
  company_id: number;
  company_name: string;
  employee_count: number;
  active_employees: number;
  total_tickets: number;
}

interface DepartmentStats {
  department: string;
  employee_count: number;
  total_tickets: number;
}

interface MonthlyStats {
  month: string;
  users: number;
  tickets: number;
  orders: number;
}

interface TicketDistribution {
  range: string;
  label: string;
  count: number;
  percentage: number;
}

export interface TicketConfiguration {
  id: string;
  company_id: string;
  ticket_value: number;
  validity_duration_days: number;
  type: 'standard' | 'premium' | 'bonus';
  auto_renewal: boolean;
  logo?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface TicketBatch {
  id: string;
  batch_number?: string;
  company_id: string;
  config_id: string;
  employee_id?: string;
  employee_name?: string;
  created_by: string;
  total_tickets: number;
  ticket_value: number;
  type: 'standard' | 'premium' | 'bonus';
  validity_start: string;
  validity_end: string;
  assigned_tickets?: number; // Tickets affectés aux employés
  used_tickets: number; // Tickets réellement consommés
  remaining_tickets: number; // Tickets disponibles pour affectation
  status: 'active' | 'expired' | 'depleted';
  tickets?: Array<{
    ticket_number: string;
    value: number;
    status: 'available' | 'used';
    used_at: string | null;
  }>;
  created_at: string;
  updated_at: string;
}

export interface TicketAssignment {
  id: string;
  employee_id: string;
  employee_name: string;
  batch_id?: string;
  batch_number?: string;
  tickets_count: number;
  ticket_value: number;
  type: 'manual' | 'batch';
  assigned_by: string;
  notes?: string;
  created_at: string;
}

export interface MenuItem {
  id: string;
  restaurant_id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image_url?: string;
  is_available: boolean;
  preparation_time?: number;
  allergens?: string[];
  ingredients?: string[];
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface DailyMenu {
  id: string;
  restaurant_id: string;
  name: string;
  description: string;
  type: 'daily' | 'weekly' | 'special';
  day_of_week?: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
  valid_from: string;
  valid_until: string;
  price: number;
  items: Array<{
    item_id: string;
    category: string;
  }>;
  enriched_items?: Array<{
    category: string;
    item: MenuItem;
  }>;
  is_available: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface WeeklyMenuPlanning {
  id: string;
  restaurant_id: string;
  week_planning: {
    monday: string[];
    tuesday: string[];
    wednesday: string[];
    thursday: string[];
    friday: string[];
    saturday: string[];
    sunday: string[];
  };
  enriched_items?: {
    monday: MenuItem[];
    tuesday: MenuItem[];
    wednesday: MenuItem[];
    thursday: MenuItem[];
    friday: MenuItem[];
    saturday: MenuItem[];
    sunday: MenuItem[];
  };
  created_by?: string;
  updated_by?: string;
  created_at: string;
  updated_at: string;
}

export type { Role, Permission, Company, Restaurant, User, Employee, Statistics, CompanyStats, DepartmentStats, MonthlyStats, TicketDistribution };
