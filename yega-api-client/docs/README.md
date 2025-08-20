# Yega API Client - Documentación en Español

Cliente TypeScript oficial para la plataforma Yega - una solución completa para plataformas de comercio electrónico y delivery.

## 📋 Tabla de Contenidos
- [Instalación](#instalación)
- [Uso Básico](#uso-básico)
- [Autenticación](#autenticación)
- [Roles de Usuario](#roles-de-usuario)
- [Operaciones por Rol](#operaciones-por-rol)
- [Manejo de Errores](#manejo-de-errores)
- [Ejemplos Completos](#ejemplos-completos)

## 🚀 Instalación

```bash
npm install yega-api-client
```

## 📦 Uso Básico

```typescript
import { YegaClient } from 'yega-api-client';

// Inicializar el cliente
const client = new YegaClient('https://api.yega.com/v1');

// O usar la URL por defecto
const client = new YegaClient();
```

## 🔐 Autenticación

### Inicio de Sesión
```typescript
const authResponse = await client.login({
  email: 'usuario@ejemplo.com',
  password: 'contraseña123'
});

console.log('Token:', authResponse.token);
console.log('Usuario:', authResponse.user);
```

### Registro de Nuevo Usuario
```typescript
const newUser = await client.register({
  email: 'nuevo@ejemplo.com',
  password: 'contraseña123',
  name: 'Juan Pérez',
  role: 'client' // 'client', 'store', 'courier'
});
```

### Cierre de Sesión
```typescript
await client.logout();
```

## 👥 Roles de Usuario

### Cliente
- Explorar tiendas
- Realizar pedidos
- Ver historial de pedidos
- Actualizar perfil

### Dueño de Tienda
- Gestionar tiendas
- Administrar productos
- Ver pedidos de la tienda
- Actualizar estado de pedidos

### Repartidor
- Actualizar ubicación
- Ver pedidos disponibles
- Aceptar entregas
- Actualizar estado de entrega

## 🛍️ Operaciones por Rol

### Cliente - Ejemplos

```typescript
// Obtener tiendas cercanas
const stores = await client.getStores({
  page: 1,
  limit: 10,
  search: 'restaurante'
});

// Crear un pedido
const order = await client.createOrder({
  storeId: 'store_123',
  items: [{
    productId: 'prod_456',
    quantity: 2,
    notes: 'Sin cebolla'
  }],
  deliveryAddress: {
    street: 'Calle Principal 123',
    city: 'Ciudad',
    coordinates: { lat: 40.7128, lng: -74.0060 }
  }
});

// Ver historial de pedidos
const orders = await client.getOrders({
  page: 1,
  limit: 20,
  status: 'delivered'
});
```

### Dueño de Tienda - Ejemplos

```typescript
// Crear una nueva tienda
const newStore = await client.createStore({
  name: 'Mi Restaurante',
  description: 'Los mejores platos de la ciudad',
  address: 'Calle Comercio 456',
  phone: '+1234567890',
  category: 'restaurante',
  logo: 'https://ejemplo.com/logo.jpg'
});

// Agregar productos
const product = await client.createProduct({
  name: 'Hamburguesa Especial',
  description: 'Hamburguesa con queso, lechuga y tomate',
  price: 12.99,
  storeId: 'store_123',
  images: ['https://ejemplo.com/burger.jpg'],
  category: 'comida rápida',
  available: true
});

// Ver pedidos de la tienda
const storeOrders = await client.getStoreOrders('store_123', {
  page: 1,
  limit: 10,
  status: 'pending'
});

// Actualizar estado de pedido
await client.updateOrderStatus('order_789', 'preparing');
```

### Repartidor - Ejemplos

```typescript
// Actualizar ubicación
await client.updateLocation({
  latitude: 40.7128,
  longitude: -74.0060,
  accuracy: 10
});

// Ver pedidos disponibles
const availableOrders = await client.getOrders({
  status: 'ready',
  limit: 10
});

// Aceptar un pedido
await client.acceptOrder('order_789');

// Actualizar estado de entrega
await client.updateDeliveryStatus('order_789', 'picked_up');
```

## 📤 Carga de Archivos

### Subir Imágenes
```typescript
// Para productos
const productImage = await client.uploadProductImage('prod_123', imageFile);

// Para tiendas
const storeLogo = await client.uploadStoreLogo('store_123', logoFile);
```

## ⚠️ Manejo de Errores

```typescript
try {
  const result = await client.getStore('invalid_id');
} catch (error) {
  if (error.code === 'NOT_FOUND') {
    console.log('Tienda no encontrada');
  } else if (error.code === 'UNAUTHORIZED') {
    console.log('No autorizado - por favor inicia sesión');
  } else {
    console.log('Error:', error.message);
  }
}
```

## 📊 Paginación

Todos los endpoints que devuelven listas soportan paginación:

```typescript
const products = await client.getProducts({
  page: 2,
  limit: 20,
  storeId: 'store_123',
  category: 'bebidas'
});

console.log(`Página ${products.page} de ${products.totalPages}`);
console.log(`Total de productos: ${products.total}`);
```

## 🔍 Búsqueda y Filtros

### Buscar Productos
```typescript
const results = await client.searchProducts({
  query: 'pizza',
  filters: {
    priceMin: 10,
    priceMax: 50,
    category: 'italiana',
    available: true
  }
});
```

### Filtrar Pedidos
```typescript
const orders = await client.getOrders({
  status: 'delivered',
  dateFrom: '2024-01-01',
  dateTo: '2024-12-31',
  storeId: 'store_123'
});
```

## 📋 Ejemplos Completos

### Aplicación Completa de Cliente
```typescript
import { YegaClient } from 'yega-api-client';

class FoodDeliveryApp {
  private client: YegaClient;

  constructor() {
    this.client = new YegaClient();
  }

  async loginUser(email: string, password: string) {
    try {
      const response = await this.client.login({ email, password });
      console.log(`Bienvenido ${response.user.name}`);
      return response;
    } catch (error) {
      console.error('Error de autenticación:', error.message);
      throw error;
    }
  }

  async searchNearbyStores(location: string) {
    const stores = await this.client.getStores({
      search: location,
      page: 1,
      limit: 10
    });
    return stores.data;
  }

  async placeOrder(storeId: string, items: any[]) {
    const order = await this.client.createOrder({
      storeId,
      items,
      deliveryAddress: {
        street: 'Calle Principal 123',
        city: 'Ciudad',
        coordinates: { lat: 40.7128, lng: -74.0060 }
      }
    });
    
    console.log(`Pedido creado: ${order.id}`);
    return order;
  }

  async trackOrder(orderId: string) {
    const order = await this.client.getOrder(orderId);
    console.log(`Estado: ${order.status}`);
    console.log(`Repartidor: ${order.courier?.name || 'No asignado'}`);
    return order;
  }
}

// Uso
const app = new FoodDeliveryApp();
await app.loginUser('cliente@ejemplo.com', 'contraseña');
const stores = await app.searchNearbyStores('italiano');
const order = await app.placeOrder(stores[0].id, [
  { productId: 'pizza_margherita', quantity: 1 }
]);
```

## 🛠️ Desarrollo y Contribución

### Instalación para Desarrollo
```bash
git clone https://github.com/yega/yega-api-client
cd yega-api-client
npm install
npm run build
```

### Ejecutar Ejemplos
```bash
npm run example:basic
npm run example:client
npm run example:store
npm run example:courier
```

## 📞 Soporte

Para reportar problemas o solicitar nuevas funcionalidades:
- GitHub Issues: https://github.com/yega/yega-api-client/issues
- Email: soporte@yega.com
- Documentación API: https://api.yega.com/docs

## 📄 Licencia

MIT License - ver archivo LICENSE para más detalles.
