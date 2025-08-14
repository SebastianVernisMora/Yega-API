# Estándares de Observabilidad

Este documento define las métricas, logs y alertas mínimas para `yega-api`.

## 1. Métricas Clave (Mínimas)

Las siguientes métricas deben ser recolectadas y visualizadas en un dashboard (ej. Grafana, Datadog).

| Métrica               | Descripción                                           | Tipo        | Endpoint(s) |
|-----------------------|-------------------------------------------------------|-------------|-------------|
| **Latencia (p50)**    | El 50% de las peticiones se completan en este tiempo. | Timer       | `/api/*`    |
| **Latencia (p95)**    | El 95% de las peticiones se completan en este tiempo. | Timer       | `/api/*`    |
| **Tasa de Errores**   | Porcentaje de peticiones que resultan en 4xx o 5xx.   | Gauge/Counter | `/api/*`    |
| **Peticiones por Minuto** | Volumen de tráfico que recibe la API.                 | Counter     | `/api/*`    |
| **Uso de CPU**        | Carga de CPU del proceso de la aplicación.            | Gauge       | Host        |
| **Uso de Memoria**    | Memoria utilizada por el proceso de la aplicación.    | Gauge       | Host        |

## 2. Estructura de Logs

Todos los logs deben ser emitidos en formato JSON para facilitar su procesamiento.

**Ejemplo de Log de Petición:**
```json
{
  "level": "info",
  "timestamp": "2025-08-14T08:20:00Z",
  "message": "Request handled",
  "service": "yega-api",
  "trace_id": "a1b2c3d4-e5f6-7890-1234-567890abcdef",
  "http": {
    "method": "GET",
    "path": "/api/v1/users/123",
    "status_code": 200,
    "duration_ms": 75
  }
}
```

**Ejemplo de Log de Error:**
```json
{
  "level": "error",
  "timestamp": "2025-08-14T08:21:00Z",
  "message": "Failed to connect to database",
  "service": "yega-api",
  "trace_id": "b2c3d4e5-f6a7-8901-2345-67890abcdef1",
  "error": {
    "message": "Connection refused",
    "stack": "..."
  }
}
```

## 3. Alertas Mínimas

Configurar las siguientes alertas en el sistema de monitoreo (ej. Prometheus Alertmanager).

| Alerta                         | Umbral                                 | Prioridad |
|--------------------------------|----------------------------------------|-----------|
| **Alta Tasa de Errores (5xx)** | > 5% durante 5 minutos.                | Crítica   |
| **Alta Latencia (p95)**        | > 500ms durante 10 minutos.            | Advertencia |
| **Aplicación Caída**           | El endpoint `/health` no responde.     | Crítica   |
| **Alto Uso de Memoria**        | > 80% del límite (`150M`) por 5 min. | Advertencia |
| **Alto Uso de CPU**            | > 90% durante 10 minutos.              | Crítica   |
