# 📌 Yega-API – Issues Sprint 1

## Issues

- [ ] **Refinar contrato OpenAPI (`openapi.yaml`)**  
  Ajustar modelos de Pedido, Usuario, Tienda y Producto. Documentar estados de pedido (`pending → accepted → on_the_way → delivered`).

- [ ] **Expandir servidor mock**  
  Agregar dataset más realista (tiendas, productos, usuarios). Simular creación y actualización de pedidos con validaciones mínimas.

- [ ] **Endpoint: Crear Pedido**  
  Implementar `POST /pedidos` con respuesta simulada (id, estado inicial = pending).

- [ ] **Endpoint: Cambiar Estado de Pedido**  
  Implementar `PATCH /pedidos/:id` que valide la secuencia de estados.
