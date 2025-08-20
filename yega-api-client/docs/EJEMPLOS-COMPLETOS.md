# Ejemplos Completos - Yega API Client

## 📋 Índice de Ejemplos

1. [Aplicación de Cliente](#aplicación-de-cliente)
2. [Panel de Tienda](#panel-de-tienda)
3. [Aplicación de Repartidor](#aplicación-de-repartidor)
4. [Administrador](#administrador)
5. [Integración con Frontend](#integración-con-frontend)
6. [Webhooks](#webhooks)

---

## 🍔 Aplicación de Cliente

### Estructura Completa de una App de Delivery

```typescript
// src/app.ts
import { YegaClient, OrderStatus } from 'yega-api-client';

class FoodDeliveryApp {
  private client: YegaClient;
  private currentUser: User | null = null;

  constructor() {
    this.client = new YegaClient();
  }

  // Autenticación
  async login(email: string, password: string) {
    try {
      const response = await this.client.login({ email, password });
      this.currentUser = response.user;
      
      // Guardar token en localStorage
      localStorage.setItem('yega_token', response.token);
      
      console.log(`¡Bienvenido ${this.currentUser.name}!`);
      return response;
    } catch (error) {
      console.error('Error al iniciar sesión:', error.message);
      throw error;
    }
  }

  async register(userData: RegisterData) {
    const response = await this.client.register(userData);
    this.currentUser = response.user;
    return response;
  }

  async logout() {
    await this.client.logout();
    this.currentUser = null;
    localStorage.removeItem('yega_token');
  }

  // Explorar tiendas
  async getNearbyStores(location: { lat: number; lng: number }) {
    const stores = await this.client.getStores({
      page: 1,
      limit: 20,
      location: `${location.lat},${location.lng}`,
      radius: 5000 // 5km
    });

    return stores.data.map(store => ({
      id: store.id,
      name: store.name,
      description: store.description,
      image: store.logo,
      rating: store.rating,
      deliveryTime: store.deliveryTime,
      deliveryFee: store.deliveryFee,
      categories: store.categories,
      isOpen: store.isOpen
    }));
  }

  // Buscar productos
  async searchProducts(query: string, storeId?: string) {
    const products = await this.client.searchProducts({
      query,
      filters: {
        storeId,
        available: true
      }
    });

    return products.data;
  }

  // Ver carrito
  async getCart() {
    const cart = await this.client.getCart();
    return {
      items: cart.items,
      total: cart.total,
      storeId: cart.storeId
    };
  }

  // Agregar al carrito
  async addToCart(productId: string, quantity: number, notes?: string) {
    const updatedCart = await this.client.addToCart({
      productId,
      quantity,
      notes
    });
    return updatedCart;
  }

  // Crear pedido
  async createOrder(orderData: CreateOrderData) {
    const order = await this.client.createOrder({
      storeId: orderData.storeId,
      items: orderData.items,
      deliveryAddress: orderData.deliveryAddress,
      paymentMethod: orderData.paymentMethod,
      notes: orderData.notes,
      scheduledTime: orderData.scheduledTime
    });

    // Notificar al usuario
    this.notifyUser('Pedido creado exitosamente', order.id);
    
    return order;
  }

  // Seguimiento de pedido
  async trackOrder(orderId: string) {
    const order = await this.client.getOrder(orderId);
    
    return {
      id: order.id,
      status: order.status,
      items: order.items,
      total: order.total,
      estimatedDelivery: order.estimatedDelivery,
      courier: order.courier,
      trackingUrl: order.trackingUrl
    };
  }

  // Historial de pedidos
  async getOrderHistory(filters: OrderFilters = {}) {
    const orders = await this.client.getOrders({
      page: filters.page || 1,
      limit: filters.limit || 10,
      status: filters.status,
      dateFrom: filters.dateFrom,
      dateTo: filters.dateTo
    });

    return {
      orders: orders.data,
      pagination: orders.pagination
    };
  }

  // Métodos auxiliares
  private notifyUser(message: string, orderId?: string) {
    // Implementar notificaciones push o email
    console.log(message, orderId);
  }

  // Manejo de favoritos
  async addFavoriteStore(storeId: string) {
    return await this.client.addFavoriteStore(storeId);
  }

  async getFavoriteStores() {
    return await this.client.getFavoriteStores();
  }

  async removeFavoriteStore(storeId: string) {
    return await this.client.removeFavoriteStore(storeId);
  }
}

// Uso en la aplicación
const app = new FoodDeliveryApp();

// Ejemplo de flujo completo
async function completeOrderFlow() {
  try {
    // 1. Login
    await app.login('cliente@ejemplo.com', 'password123');
    
    // 2. Buscar tiendas cercanas
    const stores = await app.getNearbyStores({ lat: 40.7128, lng: -74.0060 });
    console.log('Tiendas encontradas:', stores.length);
    
    // 3. Ver productos de una tienda
    const products = await app.searchProducts('pizza', stores[0].id);
    
    // 4. Agregar al carrito
    await app.addToCart(products[0].id, 2, 'Sin cebolla');
    
    // 5. Ver carrito
    const cart = await app.getCart();
    console.log('Total del carrito:', cart.total);
    
    // 6. Crear pedido
    const order = await app.createOrder({
      storeId: stores[0].id,
      items: cart.items,
      deliveryAddress: {
        street: 'Calle Principal 123',
        city: 'Ciudad',
        coordinates: { lat: 40.7128, lng: -74.0060 }
      },
      paymentMethod: 'credit_card'
    });
    
    // 7. Seguimiento
    const tracking = await app.trackOrder(order.id);
    console.log('Estado del pedido:', tracking.status);
    
  } catch (error) {
    console.error('Error en el flujo:', error);
  }
}
```

---

## 🏪 Panel de Tienda

### Panel de Administración de Tienda

```typescript
// src/store-panel.ts
import { YegaClient, Store, Product, Order } from 'yega-api-client';

class StoreAdminPanel {
  private client: YegaClient;
  private currentStore: Store | null = null;

  constructor() {
    this.client = new YegaClient();
  }

  // Autenticación de tienda
  async loginStore(email: string, password: string) {
    const response = await this.client.login({ email, password });
    
    // Verificar que el usuario sea dueño de tienda
    if (response.user.role !== 'store') {
      throw new Error('Usuario no autorizado para acceder al panel de tienda');
    }
    
    return response;
  }

  // Dashboard de tienda
  async getStoreDashboard(storeId: string) {
    const [
      store,
      products,
      orders,
      stats
    ] = await Promise.all([
      this.client.getStore(storeId),
      this.client.getProducts({ storeId, limit: 100 }),
      this.client.getStoreOrders(storeId, { limit: 10 }),
      this.client.getStoreStats(storeId)
    ]);

    return {
      store,
      totalProducts: products.pagination.total,
      recentOrders: orders.data,
      stats: {
        totalOrders: stats.totalOrders,
        totalRevenue: stats.totalRevenue,
        averageRating: stats.averageRating,
        activeOrders: stats.activeOrders
      }
    };
  }

  // Gestión de productos
  async addProduct(productData: ProductData) {
    const product = await this.client.createProduct({
      name: productData.name,
      description: productData.description,
      price: productData.price,
      storeId: this.currentStore!.id,
      category: productData.category,
      images: productData.images,
      available: productData.available ?? true,
      preparationTime: productData.preparationTime,
      ingredients: productData.ingredients,
      allergens: productData.allergens,
      nutritionalInfo: productData.nutritionalInfo
    });

    // Notificar actualización de menú
    this.notifyMenuUpdate(product.id);
    
    return product;
  }

  async updateProduct(productId: string, updates: Partial<ProductData>) {
    const updated = await this.client.updateProduct(productId, updates);
    return updated;
  }

  async deleteProduct(productId: string) {
    await this.client.deleteProduct(productId);
    console.log('Producto eliminado:', productId);
  }

  // Gestión de inventario
  async updateProductAvailability(productId: string, available: boolean) {
    await this.client.updateProduct(productId, { available });
    
    if (!available) {
      // Notificar que el producto está agotado
      this.notifyProductOutOfStock(productId);
    }
  }

  // Gestión de pedidos
  async getPendingOrders() {
    const orders = await this.client.getStoreOrders(this.currentStore!.id, {
      status: 'pending',
      sort: 'createdAt:asc'
    });
    
    return orders.data.map(order => ({
      id: order.id,
      items: order.items,
      total: order.total,
      customer: order.customer,
      deliveryAddress: order.deliveryAddress,
      notes: order.notes,
      createdAt: order.createdAt,
      estimatedPreparationTime: this.calculatePreparationTime(order.items)
    }));
  }

  async updateOrderStatus(orderId: string, status: OrderStatus) {
    const updated = await this.client.updateOrderStatus(orderId, status);
    
    // Notificar al cliente
    this.notifyCustomerOrderUpdate(orderId, status);
    
    return updated;
  }

  // Análisis y reportes
  async getSalesReport(dateRange: { from: Date; to: Date }) {
    const report = await this.client.getStoreSalesReport(this.currentStore!.id, {
      dateFrom: dateRange.from.toISOString(),
      dateTo: dateRange.to.toISOString()
    });

    return {
      totalSales: report.totalSales,
      totalOrders: report.totalOrders,
      averageOrderValue: report.averageOrderValue,
      topProducts: report.topProducts,
      dailySales: report.dailySales,
      hourlySales: report.hourlySales
    };
  }

  // Gestión de horarios
  async updateStoreHours(hours: StoreHours) {
    await this.client.updateStore(this.currentStore!.id, {
      openingHours: hours
    });
  }

  // Promociones y descuentos
  async createPromotion(promotionData: PromotionData) {
    const promotion = await this.client.createPromotion({
      storeId: this.currentStore!.id,
      name: promotionData.name,
      description: promotionData.description,
      discountType: promotionData.discountType,
      discountValue: promotionData.discountValue,
      minimumOrderValue: promotionData.minimumOrderValue,
      validFrom: promotionData.validFrom,
      validTo: promotionData.validTo,
      applicableProducts: promotionData.applicableProducts
    });

    return promotion;
  }

  // Métodos auxiliares
  private calculatePreparationTime(items: OrderItem[]): number {
    // Calcular tiempo basado en los productos
    const baseTime = 15; // minutos base
    const additionalTime = items.reduce((total, item) => {
      return total + (item.product.preparationTime || 0) * item.quantity;
    }, 0);
    
    return baseTime + additionalTime;
  }

  private notifyMenuUpdate(productId: string) {
    console.log('Menú actualizado:', productId);
  }

  private notifyProductOutOfStock(productId: string) {
    console.log('Producto agotado:', productId);
  }

  private notifyCustomerOrderUpdate(orderId: string, status: OrderStatus) {
    console.log(`Pedido ${orderId} actualizado a: ${status}`);
  }
}

// Ejemplo de uso del panel de tienda
async function storeManagementExample() {
  const panel = new StoreAdminPanel();
  
  // 1. Login de tienda
  await panel.loginStore('tienda@ejemplo.com', 'password123');
  
  // 2. Ver dashboard
  const dashboard = await panel.getStoreDashboard('store_123');
  console.log('Ventas totales:', dashboard.stats.totalRevenue);
  
  // 3. Agregar nuevo producto
  const newProduct = await panel.addProduct({
    name: 'Pizza Margherita',
    description: 'Pizza clásica con tomate, mozzarella y albahaca',
    price: 12.99,
    category: 'pizzas',
    images: ['pizza-margherita.jpg'],
    preparationTime: 20,
    ingredients: ['harina', 'tomate', 'mozzarella', 'albahaca'],
    allergens: ['gluten', 'lácteos']
  });
  
  // 4. Ver pedidos pendientes
  const pendingOrders = await panel.getPendingOrders();
  console.log('Pedidos pendientes:', pendingOrders.length);
  
  // 5. Actualizar estado de pedido
  await panel.updateOrderStatus('order_456', 'preparing');
  
  // 6. Ver reporte de ventas
  const report = await panel.getSalesReport({
    from: new Date('2024-01-01'),
    to: new Date('2024-01-31')
  });
  console.log('Ventas del mes:', report.totalSales);
}
```

---

## 🚚 Aplicación de Repartidor

### Aplicación para Repartidores

```typescript
// src/courier-app.ts
import { YegaClient, Order, Location } from 'yega-api-client';

class CourierApp {
  private client: YegaClient;
  private currentLocation: Location | null = null;
  private isOnline: boolean = false;

  constructor() {
    this.client = new YegaClient();
  }

  // Autenticación de repartidor
  async loginCourier(email: string, password: string) {
    const response = await this.client.login({ email, password });
    
    if (response.user.role !== 'courier') {
      throw new Error('Usuario no autorizado como repartidor');
    }
    
    return response;
  }

  // Gestión de disponibilidad
  async goOnline(location: Location) {
    await this.client.updateLocation(location);
    await this.client.updateCourierStatus('online');
    
    this.isOnline = true;
    this.currentLocation = location;
    
    // Iniciar actualización periódica de ubicación
    this.startLocationTracking();
  }

  async goOffline() {
    await this.client.updateCourierStatus('offline');
    this.isOnline = false;
    this.stopLocationTracking();
  }

  // Actualización de ubicación
  private startLocationTracking() {
    setInterval(async () => {
      if (this.isOnline && this.currentLocation) {
        await this.client.updateLocation(this.currentLocation);
      }
    }, 30000); // Actualizar cada 30 segundos
  }

  private stopLocationTracking() {
    // Limpiar intervalo
  }

  // Obtener pedidos disponibles
  async getAvailableOrders() {
    const orders = await this.client.getOrders({
      status: 'ready',
      limit: 20,
      sort: 'distance:asc'
    });

    return orders.data.map(order => ({
      id: order.id,
      store: order.store,
      customer: order.customer,
      items: order.items,
      total: order.total,
      distance: order.distance,
      estimatedEarnings: order.estimatedEarnings,
      pickupAddress: order.store.address,
      deliveryAddress: order.deliveryAddress,
      estimatedDeliveryTime: order.estimatedDeliveryTime
    }));
  }

  // Aceptar pedido
  async acceptOrder(orderId: string) {
    const order = await this.client.acceptOrder(orderId);
    
    // Actualizar estado
    await this.client.updateDeliveryStatus(orderId, 'accepted');
    
    // Notificar al cliente
    this.notifyCustomer(orderId, 'Tu pedido ha sido aceptado por el repartidor');
    
    return order;
  }

  // Proceso de entrega
  async pickupOrder(orderId: string) {
    // Confirmar recogida en tienda
    await this.client.updateDeliveryStatus(orderId, 'picked_up');
    
    // Notificar al cliente
    this.notifyCustomer(orderId, 'Tu pedido está en camino');
    
    // Iniciar navegación
    this.startNavigation(orderId);
  }

  async deliverOrder(orderId: string, proof?: DeliveryProof) {
    // Confirmar entrega
    const delivery = await this.client.completeDelivery(orderId, {
      deliveredAt: new Date(),
      proof: proof || {
        photo: 'delivery-photo.jpg',
        signature: 'customer-signature.png'
      }
    });

    // Actualizar estado
    await this.client.updateDeliveryStatus(orderId, 'delivered');
    
    // Notificar al cliente
    this.notifyCustomer(orderId, 'Tu pedido ha sido entregado');
    
    // Solicitar calificación
    this.requestRating(orderId);
    
    return delivery;
  }

  // Gestión de rutas
  private startNavigation(orderId: string) {
    // Integración con servicios de navegación
    console.log(`Iniciando navegación para pedido ${orderId}`);
  }

  // Historial de entregas
  async getDeliveryHistory(filters: DeliveryFilters = {}) {
    const deliveries = await this.client.getCourierDeliveries({
      page: filters.page || 1,
      limit: filters.limit || 10,
      status: filters.status,
      dateFrom: filters.dateFrom,
      dateTo: filters.dateTo
    });

    return {
      deliveries: deliveries.data,
      totalEarnings: deliveries.totalEarnings,
      totalDeliveries: deliveries.pagination.total,
      averageRating: deliveries.averageRating
    };
  }

  // Análisis de rendimiento
  async getPerformanceStats() {
    const stats = await this.client.getCourierStats();
    
    return {
      totalDeliveries: stats.totalDeliveries,
      totalEarnings: stats.totalEarnings,
      averageRating: stats.averageRating,
      onTimeDeliveryRate: stats.onTimeDeliveryRate,
      averageDeliveryTime: stats.averageDeliveryTime,
      weeklyEarnings: stats.weeklyEarnings,
      monthlyEarnings: stats.monthlyEarnings
    };
  }

  // Gestión de horarios
  async setWorkingHours(schedule: WorkingHours) {
    await this.client.updateWorkingHours(schedule);
  }

  // Métodos auxiliares
  private notifyCustomer(orderId: string, message: string) {
    console.log(`Notificación al cliente ${orderId}: ${message}`);
  }

  private requestRating(orderId: string) {
    console.log(`Solicitando calificación para pedido ${orderId}`);
  }
}

// Ejemplo de uso de la app de repartidor
async function courierWorkflowExample() {
  const app = new CourierApp();
  
  // 1. Login
  await app.loginCourier('repartidor@ejemplo.com', 'password123');
  
  // 2. Ir online
  await app.goOnline({
    lat: 40.7128,
    lng: -74.0060,
    accuracy: 10
  });
  
  // 3. Ver pedidos disponibles
  const availableOrders = await app.getAvailableOrders();
  console.log('Pedidos disponibles:', availableOrders.length);
  
  // 4. Aceptar pedido
  const order = await app.acceptOrder('order_789');
  
  // 5. Proceso de entrega
  await app.pickupOrder(order.id);
  
  // Simular viaje...
  setTimeout(async () => {
    await app.deliverOrder(order.id, {
      photo: 'delivery-proof.jpg',
      signature: 'customer-signature.png'
    });
  }, 30000);
  
  // 6. Ver estadísticas
  const stats = await app.getPerformanceStats();
  console.log('Ganancias totales:', stats.totalEarnings);
}
```

---

## 🎯 Integración con Frontend

### React Hook para Yega API

```typescript
// hooks/useYega.ts
import { useState, useEffect, useCallback } from 'react';
import { YegaClient } from 'yega-api-client';

export function useYega() {
  const [client] = useState(() => new YegaClient());
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = useCallback(async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await client.login({ email, password });
      setUser(response.user);
      localStorage.setItem('yega_token', response.token);
      return response;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [client]);

  const logout = useCallback(async () => {
    await client.logout();
    setUser(null);
    localStorage.removeItem('yega_token');
  }, [client]);

  useEffect(() => {
    const token = localStorage.getItem('yega_token');
    if (token) {
      // Verificar token y obtener usuario
      client.getProfile().then(setUser).catch(() => {
        localStorage.removeItem('yega_token');
      });
    }
  }, [client]);

  return {
    client,
    user,
    loading,
    error,
    login,
    logout
  };
}

// Uso en componente React
function App() {
  const { client, user, login, logout } = useYega();

  return (
    <div>
      {user ? (
        <div>
          <p>Bienvenido, {user.name}</p>
          <button onClick={logout}>Cerrar sesión</button>
        </div>
      ) : (
        <LoginForm onLogin={login} />
      )}
    </div>
  );
}
```

---

## 📡 Webhooks

### Configuración de Webhooks

```typescript
// src/webhooks.ts
import { YegaClient } from 'yega-api-client';

class WebhookHandler {
  private client: YegaClient;

  constructor() {
    this.client = new YegaClient();
  }

  // Configurar webhook para cambios de estado de pedido
  async setupOrderWebhook(url: string) {
    const webhook = await this.client.createWebhook({
      url,
      events: ['order.created', 'order.updated', 'order.completed'],
      secret: 'webhook_secret_key'
    });

    return webhook;
  }

  // Manejar webhook entrante
  async handleWebhook(payload: WebhookPayload) {
    const { event, data } = payload;

    switch (event) {
      case 'order.created':
        await this.handleNewOrder(data);
        break;
      case 'order.updated':
        await this.handleOrderUpdate(data);
        break;
      case 'order.completed':
        await this.handleOrderComplete(data);
        break;
      default:
        console.log('Evento no manejado:', event);
    }
  }

  private async handleNewOrder(order: Order) {
    console.log('Nuevo pedido recibido:', order.id);
    // Enviar notificación push, email, etc.
  }

  private async handleOrderUpdate(order: Order) {
    console.log('Pedido actualizado:', order.id, order.status);
    // Actualizar UI, enviar notificaciones
  }

  private async handleOrderComplete(order: Order) {
    console.log('Pedido completado:', order.id);
    // Procesar pago, enviar confirmación, etc.
  }
}

// Ejemplo de servidor webhook con Express
import express from 'express';
import crypto from 'crypto';

const app = express();
const webhookHandler = new WebhookHandler();

app.post('/webhooks/yega', express.raw({ type: 'application/json' }), (req, res) => {
  const signature = req.headers['x-yega-signature'];
  const payload = req.body;
  
  // Verificar firma
  const expectedSignature = crypto
    .createHmac('sha256', 'webhook_secret_key')
    .update(payload)
    .digest('hex');
    
  if (signature !== expectedSignature) {
    return res.status(401).send('Firma inválida');
  }
  
  const data = JSON.parse(payload);
  webhookHandler.handleWebhook(data);
  
  res.status(200).send('OK');
});

app.listen(3001, () => {
  console.log('Webhook server listening on port 3001');
});
```

---

## 🧪 Testing

### Tests Unitarios

```typescript
// tests/client.test.ts
import { YegaClient } from 'yega-api-client';
import { mockServer } from './mocks/server';

describe('YegaClient', () => {
  let client: YegaClient;

  beforeEach(() => {
    client = new YegaClient();
    mockServer.listen();
  });

  afterEach(() => {
    mockServer.resetHandlers();
  });

  test('should login successfully', async () => {
    const response = await client.login({
      email: 'test@example.com',
      password: 'password123'
    });

    expect(response.token).toBeDefined();
    expect(response.user.email).toBe('test@example.com');
  });

  test('should create order', async () => {
    const order = await client.createOrder({
      storeId: 'store_123',
      items: [{ productId: 'prod_456', quantity: 1 }],
      deliveryAddress: {
        street: 'Test Address',
        city: 'Test City',
        coordinates: { lat: 0, lng: 0 }
      }
    });

    expect(order.id).toBeDefined();
    expect(order.status).toBe('pending');
  });
});
```

---

## 📊 Métricas y Monitoreo

### Monitoreo de Rendimiento

```typescript
// src/monitoring.ts
import { YegaClient } from 'yega-api-client';

class PerformanceMonitor {
  private client: YegaClient;
  private metrics: Map<string, number> = new Map();

  constructor() {
    this.client = new YegaClient();
  }

  async trackAPICall(endpoint: string, duration: number) {
    const key = `api_${endpoint}`;
    const current = this.metrics.get(key) || 0;
    this.metrics.set(key, current + duration);
  }

  async getPerformanceReport() {
    const report = {
      totalAPICalls: this.metrics.size,
      averageResponseTime: this.calculateAverage(),
      slowestEndpoints: this.getSlowestEndpoints(),
      errorRate: await this.calculateErrorRate()
    };

    return report;
  }

  private calculateAverage(): number {
    const values = Array.from(this.metrics.values());
    return values.reduce((a, b) => a + b, 0) / values.length;
  }

  private getSlowestEndpoints() {
    return Array.from(this.metrics.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  }

  private async calculateErrorRate(): Promise<number> {
    // Implementar lógica de cálculo de tasa de errores
    return 0.05; // 5% de error rate
  }
}
```

---

## 🚀 Despliegue

### Configuración de Producción

```typescript
// src/config/production.ts
import { YegaClient } from 'yega-api-client';

const productionConfig = {
  apiUrl: 'https://api.yega.com/v1',
  timeout: 30000,
  retries: 3,
  cache: true,
  logging: false
};

const client = new YegaClient(productionConfig.apiUrl);

// Configurar interceptores para logging
client.onRequest((config) => {
  console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`);
});

client.onResponse((response) => {
  console.log(`[API] ${response.status} ${response.config.url}`);
});

client.onError((error) => {
  console.error(`[API Error] ${error.message}`);
});
```

---

## 📚 Recursos Adicionales

### Plantillas de Código

#### Plantilla de Componente React
```typescript
// components/ProductCard.tsx
import React from 'react';
import { Product } from 'yega-api-client';

interface ProductCardProps {
  product: Product;
  onAddToCart: (productId: string, quantity: number) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ 
  product, 
  onAddToCart 
}) => {
  return (
    <div className="product-card">
      <img src={product.images[0]} alt={product.name} />
      <h3>{product.name}</h3>
      <p>{product.description}</p>
      <span>${product.price}</span>
      <button onClick={() => onAddToCart(product.id, 1)}>
        Agregar al carrito
      </button>
    </div>
  );
};
```

#### Plantilla de Hook Personalizado
```typescript
// hooks/useOrders.ts
import { useState, useEffect } from 'react';
import { YegaClient, Order } from 'yega-api-client';

export function useOrders(storeId?: string) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const client = new YegaClient();

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const response = await client.getOrders({ storeId });
      setOrders(response.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [storeId]);

  return { orders, loading, error, refetch: fetchOrders };
}
```

---

## 🎉 Conclusión

Estos ejemplos cubren los casos de uso más comunes para cada tipo de usuario en la plataforma Yega. Puedes adaptar estos ejemplos según las necesidades específicas de tu aplicación.

Para más ejemplos y actualizaciones, visita el [repositorio oficial](https://github.com/yega/yega-api-client).
