# Checkpoint

## Último Estado: 2025-08-19

Las tareas de desarrollo del Sprint 1 han sido completadas.

### Trabajo Realizado:
- **Esquema de Base de Datos:**
  - Refinado `prisma/schema.prisma` para añadir timestamps `updatedAt` a todos los modelos.
  - Generada una nueva migración de base de datos para aplicar los cambios.
- **API de Catálogo:**
  - Implementados endpoints públicos para listar y ver productos (`GET /catalog/products` y `GET /catalog/products/:id`).
  - Implementados endpoints protegidos para que los dueños de tiendas gestionen productos (`POST`, `PUT`, `DELETE`).
- **API de Pedidos:**
  - Revisada y confirmada la implementación existente para la creación (`POST /orders`) y consulta (`GET /orders/:id`) de pedidos.
  - Verificada la lógica de la máquina de estados para el estado de los pedidos.
- **Documentación:**
  - Actualizados `docs/BOARD-Sprint-1.md` y `docs/ISSUES-Sprint-1.md` para marcar todas las tareas como completadas.
  - Actualizado `docs/CHANGELOG-API.md` con una nueva versión (0.2.0) detallando los cambios recientes.

### Próximos Pasos:
- Esperar instrucciones para la siguiente fase, que podría incluir:
  - Preparar un Pull Request para fusionar los cambios en la rama `dev`.
  - Comenzar a trabajar en las tareas del siguiente sprint.
  - Tareas de despliegue o integración.