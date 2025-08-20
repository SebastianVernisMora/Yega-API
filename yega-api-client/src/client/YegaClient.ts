import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import {
  User,
  Store,
  Product,
  Order,
  OrderStatus,
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  ProductCreate,
  ProductUpdate,
  StoreCreate,
  StoreUpdate,
  CreateOrderRequest,
  PaginationParams,
  PaginatedResponse,
  ApiError,
  LocationUpdate
} from '../types';

export class YegaClient {
  private axios: AxiosInstance;
  private token: string | null = null;

  constructor(baseURL: string = 'https://api.yega.com/v1') {
    this.axios = axios.create({
      baseURL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token
    this.axios.interceptors.request.use(
      (config: AxiosRequestConfig) => {
        if (this.token) {
          config.headers = {
            ...config.headers,
            Authorization: `Bearer ${this.token}`,
          };
        }
        return config;
      },
      (error: any) => Promise.reject(error)
    );

    // Response interceptor for error handling
    this.axios.interceptors.response.use(
      (response: AxiosResponse) => response,
      (error: any) => {
        if (error.response?.data) {
          const apiError: ApiError = {
            error: error.response.data.error || 'API Error',
            message: error.response.data.message,
            statusCode: error.response.status,
          };
          throw apiError;
        }
        throw error;
      }
    );
  }

  /**
   * Set authentication token for subsequent requests
   */
  public setAuthToken(token: string): void {
    this.token = token;
  }

  /**
   * Clear authentication token
   */
  public clearAuthToken(): void {
    this.token = null;
  }

  // Authentication methods
  public async login(credentials: LoginRequest): Promise<AuthResponse> {
    const response = await this.axios.post<AuthResponse>('/auth/login', credentials);
    this.token = response.data.token;
    return response.data;
  }

  public async register(userData: RegisterRequest): Promise<AuthResponse> {
    const response = await this.axios.post<AuthResponse>('/auth/register', userData);
    this.token = response.data.token;
    return response.data;
  }

  public async logout(): Promise<void> {
    await this.axios.post('/auth/logout');
    this.clearAuthToken();
  }

  public async refreshToken(): Promise<AuthResponse> {
    const response = await this.axios.post<AuthResponse>('/auth/refresh');
    this.token = response.data.token;
    return response.data;
  }

  // User methods
  public async getCurrentUser(): Promise<User> {
    const response = await this.axios.get<User>('/users/me');
    return response.data;
  }

  public async updateUser(userId: string, updates: Partial<User>): Promise<User> {
    const response = await this.axios.patch<User>(`/users/${userId}`, updates);
    return response.data;
  }

  public async deleteUser(userId: string): Promise<void> {
    await this.axios.delete(`/users/${userId}`);
  }

  // Store methods
  public async getStores(params?: PaginationParams): Promise<PaginatedResponse<Store>> {
    const response = await this.axios.get<PaginatedResponse<Store>>('/stores', {
      params,
    });
    return response.data;
  }

  public async getStore(storeId: string): Promise<Store> {
    const response = await this.axios.get<Store>(`/stores/${storeId}`);
    return response.data;
  }

  public async createStore(storeData: StoreCreate): Promise<Store> {
    const response = await this.axios.post<Store>('/stores', storeData);
    return response.data;
  }

  public async updateStore(storeId: string, updates: StoreUpdate): Promise<Store> {
    const response = await this.axios.patch<Store>(`/stores/${storeId}`, updates);
    return response.data;
  }

  public async deleteStore(storeId: string): Promise<void> {
    await this.axios.delete(`/stores/${storeId}`);
  }

  public async getMyStores(params?: PaginationParams): Promise<PaginatedResponse<Store>> {
    const response = await this.axios.get<PaginatedResponse<Store>>('/stores/my-stores', {
      params,
    });
    return response.data;
  }

  // Product methods
  public async getProducts(params?: PaginationParams & { storeId?: string }): Promise<PaginatedResponse<Product>> {
    const response = await this.axios.get<PaginatedResponse<Product>>('/products', {
      params,
    });
    return response.data;
  }

  public async getProduct(productId: string): Promise<Product> {
    const response = await this.axios.get<Product>(`/products/${productId}`);
    return response.data;
  }

  public async createProduct(productData: ProductCreate): Promise<Product> {
    const response = await this.axios.post<Product>('/products', productData);
    return response.data;
  }

  public async updateProduct(productId: string, updates: ProductUpdate): Promise<Product> {
    const response = await this.axios.patch<Product>(`/products/${productId}`, updates);
    return response.data;
  }

  public async deleteProduct(productId: string): Promise<void> {
    await this.axios.delete(`/products/${productId}`);
  }

  public async getStoreProducts(storeId: string, params?: PaginationParams): Promise<PaginatedResponse<Product>> {
    const response = await this.axios.get<PaginatedResponse<Product>>(`/stores/${storeId}/products`, {
      params,
    });
    return response.data;
  }

  // Order methods
  public async getOrders(params?: PaginationParams & { status?: OrderStatus; storeId?: string }): Promise<PaginatedResponse<Order>> {
    const response = await this.axios.get<PaginatedResponse<Order>>('/orders', {
      params,
    });
    return response.data;
  }

  public async getOrder(orderId: string): Promise<Order> {
    const response = await this.axios.get<Order>(`/orders/${orderId}`);
    return response.data;
  }

  public async createOrder(orderData: CreateOrderRequest): Promise<Order> {
    const response = await this.axios.post<Order>('/orders', orderData);
    return response.data;
  }

  public async updateOrderStatus(orderId: string, status: OrderStatus): Promise<Order> {
    const response = await this.axios.patch<Order>(`/orders/${orderId}/status`, { status });
    return response.data;
  }

  public async cancelOrder(orderId: string): Promise<Order> {
    const response = await this.axios.patch<Order>(`/orders/${orderId}/cancel`);
    return response.data;
  }

  public async getMyOrders(params?: PaginationParams): Promise<PaginatedResponse<Order>> {
    const response = await this.axios.get<PaginatedResponse<Order>>('/orders/my-orders', {
      params,
    });
    return response.data;
  }

  public async getStoreOrders(storeId: string, params?: PaginationParams): Promise<PaginatedResponse<Order>> {
    const response = await this.axios.get<PaginatedResponse<Order>>(`/stores/${storeId}/orders`, {
      params,
    });
    return response.data;
  }

  // Location methods (for couriers)
  public async updateLocation(location: LocationUpdate): Promise<void> {
    await this.axios.post('/location', location);
  }

  // Utility methods
  public async uploadImage(file: Buffer, filename: string, type: 'product' | 'store' | 'user'): Promise<string> {
    const FormData = require('form-data');
    const formData = new FormData();
    formData.append('image', file, filename);
    formData.append('type', type);

    const response = await this.axios.post<{ url: string }>('/upload', formData, {
      headers: {
        ...formData.getHeaders(),
      },
    });
    return response.data.url;
  }

  // Health check
  public async healthCheck(): Promise<{ status: string; timestamp: string }> {
    const response = await this.axios.get<{ status: string; timestamp: string }>('/health');
    return response.data;
  }
}
