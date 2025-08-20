YEGA — Backend Agent (Jules).md

Repo (este): API (backend Node.js)
Working dir: raíz del repo backend (no tocar otros repos)
Herramienta principal: Jules
Fase objetivo: S1 (base de API) → S2–S4 (endpoints para Fronts) → S5 (hardening)

1) Misión y alcance

Misión: Implementar los endpoints definidos en contracts/openapi.yaml con Express/Node, acceso a MariaDB, RBAC por rol y validación de entrada; exponer métricas y logs estructurados.

Alcance: solo código del servidor en este repo (controladores/servicios/repositorios, middleware, pruebas, config). No modifica contratos; si un endpoint falta o cambia, crear issue/handoff al API-Contract Agent.

2) Entradas / Salidas

Entradas

contracts/openapi.yaml (v0.1+), docs/ERRORS.md (shape único), docs/SDK-PLAN.md.

Variables de entorno por entorno (dev/stg/prod).

Modelo de datos conceptual (User/Store/Product/Order/OrderItem/CourierProfile/Payment*).
(Payment es post-despliegue)

Salidas

Árbol de módulos backend (controllers/services/repos/middleware).

Pruebas (mínimo integración happy-path por módulo).

/health y /ready; logs con requestId y métricas p50/p95/error rate (mínimas).

PR → dev con checklist completo (ver §9).

3) Limitación clave (working directory)

Jules opera dentro de este repo.

Prohibido proponer cambios en otros repos desde este PR.

Si necesitas algo fuera (ej. cambios de contrato o en Fronts), crea handoff (issue enlazando el PR y el artefacto).

Cualquier discrepancia con openapi.yaml se resuelve vía issue al API-Contract Agent (no “arreglar” desde backend).

4) Convenciones (obligatorias)

Errores (shape único):

{
  "error": { "code": "STRING", "message": "STRING", "details": { } },
  "traceId": "uuid"
}


Mapear code a docs/ERRORS.md.

Auth: JWT Bearer (roles: cliente|tienda|repartidor|admin). Distinguir 401 vs 403.

Paginación: ?limit&offset y cabecera X-Total-Count.

Estados de pedido: pending|accepted|preparing|assigned|on_route|delivered|canceled.

Stock atómico: update condicional en transacción (stock >= qty).

CORS: solo subdominios permitidos (prod/stg).

Logs: JSON line con timestamp, level, msg, requestId, userId?.

5) Flujo de trabajo (paso a paso)

Rama

Crear feat/backend-s1-base (o feat/<módulo>); target: dev.

No mezclar múltiples módulos en un solo PR.

Estructura de carpetas (sugerida, sin código)

/src
  /app        (bootstrap express, middlewares, routes)
  /modules
    /auth     (controller, service, repo)
    /stores
    /products
    /orders
    /courier
  /shared     (errors, logger, http, guards, validators)
  /db         (pool, migrations, seed specs)
  /observability (metrics, health, ready)
/tests        (integration per module)
/config       (env schema, cors, rate limit)


Handoff a DevOps para PM2 ecosystem (ver doc DevOps).

Config / Env (nombrado mínimo)

NODE_ENV, PORT, LOG_LEVEL

DB: DB_HOST, DB_PORT, DB_USER, DB_PASS, DB_NAME, DB_POOL_MAX

Auth: JWT_SECRET, JWT_EXPIRES, REFRESH_EXPIRES

CORS: CORS_ORIGINS (lista)

Rate limit: RATE_WINDOW_MS, RATE_MAX

Middlewares base

requestId, logger, cors (whitelist), helmet, compression, json limit (1–2MB), rate limiting, error handler que emite el shape único.

Endpoints mínimos (alineados a OpenAPI)

Auth: POST /auth/register, POST /auth/login, GET /me.

Stores/Products: GET /stores, GET /stores/:id/products?limit&offset, POST /stores/:id/products (rol tienda, sólo activos).

Orders: POST /orders (congelar stock preliminar o validar stock en creación), GET /orders/:id.

Courier: GET /courier/routes, POST /courier/orders/:id/take, POST /courier/orders/:id/deliver.

Reglas críticas de negocio

Stock atómico: UPDATE products SET stock = stock - :qty WHERE id=:pid AND stock >= :qty.

Transiciones válidas: sólo pending→accepted→preparing→assigned→on_route→delivered y →canceled controlado (RBAC).

Idempotencia: para POST /orders usar de-dupe por clientOrderId (header o body) + unique en DB.

RBAC: guardas por rol en cada ruta (tienda sólo sobre su storeId; courier sólo su pedido asignado).

DB / rendimiento

Pool con DB_POOL_MAX razonable; tiempos de espera y cancelación.

Consultas columnar (solo lo que pinta UI), índices por store_id, active, updated_at.

Evitar N+1; mover joins pesados a vistas/materializaciones si hiciera falta (no MVP).

Observabilidad

GET /health (simple) y GET /ready (dep checks básicos).

Métricas mínimas: contador de peticiones por ruta/estado, histograma de latencia; log de errores con traceId.

Pruebas

Integración: happy path por módulo (auth, catálogo, pedido, courier).

Carga (smoke): scripts básicos (QA hará carga formal en S5).

Seguridad: tests de 401/403 y rol indebido.

PR → dev

Rellenar la plantilla (ver §9).

Adjuntar evidencia (salida lint/build, listado de rutas implementadas y su mapeo a OpenAPI).

Etiquetas: ai:jules, scope:backend, module:<auth|orders|...>.

6) DoR / DoD

DoR

openapi.yaml sellado (v0.1+), ERRORS.md vigente.

Variables de entorno definidas; dominios CORS por entorno.

Índices mínimos decididos (store_id/active/updated_at).

DoD

Rutas implementadas = Rutas definidas en OpenAPI para el módulo del PR.

Handler de errores emite el shape único; RBAC activo.

/health y /ready responden; logs y métricas mínimas operativas.

Pruebas de integración felices por módulo.

PR aprobado y mergeado en dev.

7) Guardrails (para evitar desorden)

No modificar contracts/openapi.yaml desde backend; abrir issue al API-Contract Agent si hay desfase.

Una PR por módulo; no mezclar refactors globales.

Sin push directo a main; dev requiere checks (lint/build/tests).

Nombres consistentes con el contrato (no renombrar campos).

8) Handoffs

→ DevOps: ecosystem PM2 (archivo), variables/puertos, health/ready, rutas públicas.

→ Fronts (Cliente/Tienda/Repartidor): confirmar API_BASE_URL y CORS; lista de rutas activas.

→ QA: matriz de pruebas y credenciales demo por rol; datos semilla para flujos E2E.

→ API-Contract: issues de discrepancias o mejoras del contrato.

9) Plantilla de PR (resumen)

Título: feat(api): <módulo> — <endpoints> (alineado a OpenAPI vX.Y)

Checklist

 Endpoints implementados y mapeados a OpenAPI (ruta→tag/opId).

 RBAC por rol y 401/403 verificados.

 Errores emiten code/message/details + traceId.

 Paginación con limit/offset y X-Total-Count.

 Stock atómico en transacción (si aplica).

 /health y /ready OK; logs y métricas mínimas.

 Tests de integración happy-path del módulo pasan.

 CORS para dominios válidos (dev/stg/prod).

 Sin cambios en contracts/; discrepancias documentadas en issue.

 Etiquetas: ai:jules, scope:backend, module:<...>.

Riesgos / rollback

Riesgos: regresión de contrato, bloqueo por índices.

Rollback: revert del merge en dev.

10) Riesgos y mitigaciones

Deriva de contrato: bloquear PR si difiere de OpenAPI; abrir issue a contract.

Contención en stock: transacciones cortas e índices adecuados; idempotencia en creación de pedido.

CORS laxo: whitelist estricta por entorno; rechazo temprano.

Fugas de conexión: pool con límites y cierre correcto en pruebas.

Logs ruidosos: niveles por entorno; PII fuera de logs.

11) Estructura de archivos sugerida
/src
  /app
  /modules/{auth,stores,products,orders,courier}
  /shared/{errors,logger,guards,validators}
  /db/{pool,migrations,seed}
  /observability/{metrics,health,ready}
tests/
config/


Notas

Payments se implementa en post-despliegue (ver doc Payments Agent).

Mantener compatibilidad estricta con contracts/openapi.yaml.
