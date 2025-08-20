# Changelog de la API

Todos los cambios notables en el contrato de la API serán documentados en este archivo.

El formato se basa en [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
y este proyecto se adhiere a [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.0] - 2025-08-19

### Agregado
- Implementados los endpoints de Catálogo:
  - `GET /catalog/products` para listado público de productos (paginado).
  - `GET /catalog/products/{id}` para obtener un solo producto.
  - Endpoints protegidos para dueños de tiendas: `POST`, `PUT`, `DELETE` en `/catalog/products`.
- Todos los modelos de la base de datos ahora incluyen un campo `updatedAt` para rastrear modificaciones.

### Cambiado
- El esquema de Prisma (`schema.prisma`) fue actualizado para incluir timestamps `updatedAt` y asegurar que todos los modelos tengan tanto `createdAt` como `updatedAt`.
- Se ha generado una nueva migración de base de datos para aplicar estos cambios en el esquema.

## [0.1.0] - 2025-08-14

### Agregado
*   Definición inicial del contrato de la API.
*   Endpoints para autenticación, catálogo, pedidos y repartidores.
