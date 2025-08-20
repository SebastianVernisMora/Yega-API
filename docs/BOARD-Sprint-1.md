# 🟦 Yega-API – Tablero Sprint 1

## Hecho

- **[x] Refinar Modelos de Datos (`schema.prisma`)**
  - Añadidos campos `createdAt` y `updatedAt` a todos los modelos.
  - Relaciones explícitas definidas.
  - Creada y generada la migración de base de datos.

- **[x] Implementar Endpoints del Catálogo**
  - Creada ruta `GET /catalog/products` (paginado).
  - Creada ruta `GET /catalog/products/{id}`.
  - Creadas rutas `POST`, `PUT`, `DELETE` para productos (protegidas para rol "Tienda").

- **[x] Implementar Lógica de Pedidos**
  - Verificada ruta `POST /orders` para crear un nuevo pedido.
  - Verificada máquina de estados para `OrderStatus`.
  - Verificada ruta `GET /orders/{id}` para ver estado.
