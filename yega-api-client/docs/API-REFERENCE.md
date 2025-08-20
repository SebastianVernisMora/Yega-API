# Referencia de API - Yega API Client

## Índice de Endpoints

### Autenticación
- [POST /auth/login](#post-authlogin)
- [POST /auth/register](#post-authregister)
- [POST /auth/logout](#post-authlogout)
- [POST /auth/refresh](#post-authrefresh)

### Usuarios
- [GET /users/profile](#get-usersprofile)
- [PUT /users/profile](#put-usersprofile)
- [GET /users/{id}](#get-usersid)

### Tiendas
- [GET /stores](#get-stores)
- [GET /stores/{id}](#get-storesid)
- [POST /stores](#post-stores)
- [PUT /stores/{id}](#put-storesid)
- [DELETE /stores/{id}](#delete-storesid)

### Productos
- [GET /products](#get-products)
- [GET /products/{id}](#get-productsid)
- [POST /products](#post-products)
- [PUT /products/{id}](#put-productsid)
- [DELETE /products/{id}](#delete-productsid)

### Pedidos
- [GET /orders](#get-orders)
- [GET /orders/{id}](#get-ordersid)
- [POST /orders](#post-orders)
- [PUT /orders/{id}/status](#put-ordersidstatus)

---

## Autenticación

### POST /auth/login
Inicia sesión con credenciales de usuario.

**Request:**
```typescript
{
  email: string;
  password: string;
}
```

**Response:**
```typescript
{
  token: string;
  refreshToken: string;
  user: User;
}
```

**Ejemplo:**
```typescript
const response = await client.login({
  email: 'usuario@ejemplo.com',
  password: 'contraseña123'
});
```

### POST /auth/register
Registra un nuevo usuario en la plataforma.

**Request:**
```typescript
{
  email: string;
  password: string;
  name: string;
  role: 'client' | 'store' | 'courier';
  phone?: string;
}
```

**Response:**
```typescript
{
  token: string;
  user: User;
}
```

### POST /auth/logout
Cierra sesión y revoca el token actual.

**Response:**
```typescript
{
  message: string;
}
```

### POST /auth/refresh
Refresca el token de acceso usando el refresh token.

**Request:**
```typescript
{
  refreshToken: string;
}
```

**Response:**
```typescript
{
  token: string;
  refreshToken: string;
}
```

---

## Usuarios

### GET /users/profile
Obtiene el perfil del usuario autenticado.

**Response:**
```typescript
User
```

### PUT /users/profile
Actualiza el perfil del usuario autenticado.

**Request:**
```typescript
{
  name?: string;
  email?: string;
  phone?: string;
  address?: Address;
}
```

**Response:**
```typescript
User
```

### GET /users/{id}
Obtiene información de un usuario específico.

**Response:**
```typescript
User
```

---

## Tiendas

### GET /stores
Lista todas las tiendas disponibles con opciones de filtrado.

**Query Parameters:**
- `page` (number): Página actual (default: 1)
- `limit` (number): Elementos por página (default: 10)
- `search` (string): Búsqueda por nombre o categoría
- `category` (string): Filtrar por categoría
- `location` (string): Filtrar por ubicación
- `available` (boolean): Solo tiendas abiertas

**Response:**
```typescript
{
  data: Store[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
```

### GET /stores/{id}
Obtiene información detallada de una tienda.

**Response:**
```typescript
Store
```

### POST /stores
Crea una nueva tienda (solo para usuarios con rol 'store').

**Request:**
```typescript
{
  name: string;
  description: string;
  address: string;
  phone: string;
  category: string;
  logo?: string;
  images?: string[];
  openingHours: {
    [day: string]: {
      open: string;
      close: string;
      closed?: boolean;
    };
  };
}
```

**Response:**
```typescript
Store
```

### PUT /stores/{id}
Actualiza información de una tienda.

**Request:**
```typescript
{
  name?: string;
  description?: string;
  address?: string;
  phone?: string;
  category?: string;
  logo?: string;
  images?: string[];
  openingHours?: object;
}
```

**Response:**
```typescript
Store
```

### DELETE /stores/{id}
Elimina una tienda (solo el propietario).

**Response:**
```typescript
{
  message: string;
}
```

---

## Productos

### GET /products
Lista productos con opciones de filtrado.

**Query Parameters:**
- `page` (number): Página actual
- `limit` (number): Elementos por página
- `storeId` (string): Filtrar por tienda
- `category` (string): Filtrar por categoría
- `search` (string): Búsqueda por nombre
- `available` (boolean): Solo productos disponibles
- `minPrice` (number): Precio mínimo
- `maxPrice` (number): Precio máximo

**Response:**
```typescript
{
  data: Product[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
```

### GET /products/{id}
Obtiene información detallada de un producto.

**Response:**
```typescript
Product
```

### POST /products
Crea un nuevo producto en una tienda.

**Request:**
```typescript
{
  name: string;
  description: string;
  price: number;
  storeId: string;
  category: string;
  images?: string[];
  available?: boolean;
  preparationTime?: number;
  ingredients?: string[];
  allergens?: string[];
  nutritionalInfo?: object;
}
```

**Response:**
```typescript
Product
```

### PUT /products/{id}
Actualiza información de un producto.

**Request:**
```typescript
{
  name?: string;
  description?: string;
  price?: number;
  category?: string;
  images?: string[];
  available?: boolean;
  preparationTime?: number;
  ingredients?: string[];
  allergens?: string[];
  nutritionalInfo?: object;
}
```

**Response:**
```typescript
Product
```

### DELETE /products/{id}
Elimina un producto.

**Response:**
```typescript
{
  message: string;
}
```

---

## Pedidos

### GET /orders
Lista pedidos con filtros.

**Query Parameters:**
- `page` (number): Página actual
- `limit` (number): Elementos por página
- `status` (string): Filtrar por estado
- `storeId` (string): Filtrar por tienda
- `userId` (string): Filtrar por usuario
- `dateFrom` (string
