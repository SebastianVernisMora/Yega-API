# Yega-API

API central para el ecosistema de aplicaciones de Yega.

## Estado del Proyecto

- **Versión actual:** [0.1.0]
- **Contrato de la API:** [openapi.yaml](contracts/openapi.yaml)
- **Historial de cambios:** [CHANGELOG-API.md](docs/CHANGELOG-API.md)

## Variables de Entorno

Para funcionar, la API requiere las siguientes variables de entorno.
Crea un archivo `.env` a partir de `.env.example` y ajústalo a tu entorno local.

- `NODE_ENV`: Entorno de ejecución (`development`, `staging`, `production`).
- `PORT`: Puerto para el servidor Express (p. ej. `3001`).
- `DATABASE_URL`: Cadena de conexión a la base de datos.
- `JWT_SECRET`: Clave secreta para firmar los JSON Web Tokens.
- `JWT_EXPIRES`: Tiempo de expiración para los tokens (p. ej. `7d`).
- `CORS_ORIGINS`: Orígenes permitidos por CORS, separados por comas.

## Despliegue local

1.  **Instalar dependencias:**
    ```bash
    pnpm install
    ```

2.  **Ejecutar migraciones de base de datos:**
    ```bash
    pnpm prisma migrate dev
    ```

3.  **Iniciar el servidor de desarrollo:**
    ```bash
    pnpm dev
    ```

## Despliegue con PM2

Para entornos de producción y staging, se recomienda usar [PM2](https://pm2.keymetrics.io/) para gestionar el proceso de la aplicación.
El fichero `ecosystem.config.js` en la raíz del proyecto contiene la configuración para los diferentes entornos.

### Comandos básicos

-   **Iniciar la aplicación (staging):**
    ```bash
    pm2 start ecosystem.config.js --env staging
    ```

-   **Iniciar la aplicación (producción):**
    ```bash
    pm2 start ecosystem.config.js --env production
    ```

-   **Ver el estado de las aplicaciones:**
    ```bash
    pm2 status
    ```

-   **Monitorear logs y métricas:**
    ```bash
    pm2 monit
    ```

-   **Ver logs en tiempo real:**
    ```bash
    pm2 logs yega-api
    ```

-   **Recargar la aplicación (sin downtime):**
    ```bash
    pm2 reload yega-api
    ```

-   **Parar la aplicación:**
    ```bash
    pm2 stop yega-api
    ```

-   **Reiniciar la aplicación:**
    ```bash
    pm2 restart yega-api
    ```

### Inicio automático

Para que PM2 se inicie automáticamente al reiniciar el servidor, ejecuta el siguiente comando y sigue las instrucciones:

```bash
pm2 startup
```

## Gestión del Sprint

Este repositorio utiliza un [proyecto de GitHub](docs/BOARD-Sprint-1.md) para gestionar las tareas del sprint actual.

- **Backlog del Sprint:** [ISSUES-Sprint-1.md](docs/ISSUES-Sprint-1.md)
- **Tablero Kanban:** [BOARD-Sprint-1.md](docs/BOARD-Sprint-1.md)
- **Automatización del tablero:** [project-automation.yml](.github/workflows/project-automation.yml)

Para más detalles sobre la automatización, consulta [PROJECTS-AUTOMATION.md](docs/PROJECTS-AUTOMATION.md).

## Documentación Adicional

- [Gestión de CORS](docs/CORS-ORIGINS.md)
- [Catálogo de Errores](docs/ERRORS.md)
- [Plan de Puesta en Producción](docs/GO-LIVE.md)
- [Handoff a Equipos Frontend](docs/HANDOFF-FRONTS.md)
- [Observabilidad y Monitorización](docs/OBSERVABILIDAD.md)
