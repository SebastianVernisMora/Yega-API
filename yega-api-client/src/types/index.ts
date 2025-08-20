// Base types from OpenAPI specification

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'client' | 'store' | 'courier' | 'admin';
}

export interface Store {
  id: string;
  name: string;
  description?: string;
  ownerId: string;
}

export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  storeId: string;
}

export interface OrderItem {
  productId: string;
  quantity: number;
  price: number;
}

export interface Order {
  id: string;
  userId: string;
  storeId?: string;
  items: OrderItem[];
  status: OrderStatus;
  total: number;
  createdAt?: string;
}

export type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'cancelled';

// Authentication types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  role: 'client' | 'store' | 'courier';
}

export interface AuthResponse {
  token: string;
  user: User;
}

// Request types
export interface ProductCreate {
  name: string;
  description?: string;
  price: number;
  storeId: string;
}

export interface ProductUpdate {
  name?: string;
  description?: string;
  price?: number;
}

export interface StoreCreate {
  name: string;
  description?: string;
}

export interface StoreUpdate {
  name?: string;
  description?: string;
}

export interface CreateOrderRequest {
  storeId: string;
  items: Array<{
    productId: string;
    quantity: number;
  }>;
}

// Pagination types
export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

// Error types
export interface ApiError {
  error: string;
  message?: string;
  statusCode?: number;
}

// Location types
export interface LocationUpdate {
  latitude: number;
  longitude: number;
}
