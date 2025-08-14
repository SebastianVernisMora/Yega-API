# Playbook de Despliegue con PM2

Este documento describe cómo gestionar la aplicación `yega-api` usando PM2.

## 1. Configuración Principal

La configuración se gestiona a través del archivo `ecosystem.config.js`.

- **Nombre de la App:** `yega-api`
- **Script de Inicio:** `server.js`
- **Intérprete:** `node`

## 2. Gestión de Entornos

Las variables de entorno se cargan según el entorno de despliegue (`staging`, `production`). Es crucial definir `NODE_ENV` para cada uno.

## 3. Rotación de Logs

PM2 gestionará la rotación de logs para evitar que los archivos crezcan indefinidamente.

- **Configuración:** Rotación diaria, compresión de logs antiguos y retención de 7 días.
- **Ruta:** `~/.pm2/logs/yega-api-out.log` y `~/.pm2/logs/yega-api-error.log`.

## 4. Reinicio y Zero-Downtime

La aplicación está configurada para reinicios con cero tiempo de inactividad (`zero-downtime reload`).

- **Estrategia:** `reload`
- **Memoria Máxima:** Se reiniciará si excede los `150M`.

## 5. Ejemplo `ecosystem.config.js`

```javascript
module.exports = {
  apps: [
    {
      name: 'yega-api',
      script: 'server.js',
      instances: 'max',
      exec_mode: 'cluster',
      autorestart: true,
      watch: false,
      max_memory_restart: '150M',
      log_date_format: 'YYYY-MM-DD HH:mm Z',
      error_file: '~/.pm2/logs/yega-api-error.log',
      out_file: '~/.pm2/logs/yega-api-out.log',
      combine_logs: true,
      env_staging: {
        NODE_ENV: 'staging',
        PORT: 3000,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 8080,
      },
    },
  ],
};
```

## Comandos Útiles

- **Iniciar:** `pm2 start ecosystem.config.js --env staging`
- **Recargar:** `pm2 reload yega-api`
- **Monitorear:** `pm2 monit`
- **Ver Logs:** `pm2 logs yega-api`
