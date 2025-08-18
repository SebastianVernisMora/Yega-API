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
    npm install
    ```

2.  **Ejecutar migraciones de base de datos:**
    ```bash
    npx prisma migrate dev
    ```

3.  **Iniciar el servidor de desarrollo:**
    ```bash
    npm run dev
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
