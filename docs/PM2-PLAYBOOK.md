# Playbook de Despliegue con PM2

Este documento describe cómo gestionar la aplicación `yega-api` usando PM2.

## 1. Configuración Principal

La configuración se gestiona a través del archivo `ecosystem.config.js` en la raíz del proyecto.

- **Nombre de la App:** `yega-api`
- **Script de Inicio:** `dist/index.js`
- **Intérprete:** `node`

## 2. Gestión de Entornos

Las variables de entorno se cargan según el entorno de despliegue (`development`, `staging`, `production`). Es crucial definir `NODE_ENV` para cada uno. El archivo `ecosystem.config.js` ya contiene las configuraciones para cada entorno.

## 3. Rotación de Logs

PM2 gestionará la rotación de logs para evitar que los archivos crezcan indefinidamente.

- **Configuración:** Rotación diaria, compresión de logs antiguos y retención de 7 días.
- **Ruta:** `~/.pm2/logs/yega-api-out.log` y `~/.pm2/logs/yega-api-error.log`.

## 4. Reinicio y Zero-Downtime

La aplicación está configurada para reinicios con cero tiempo de inactividad (`zero-downtime reload`).

- **Estrategia:** `reload`
- **Memoria Máxima:** Se reiniciará si excede los `150M`.

## 5. `ecosystem.config.js`

```javascript
module.exports = {
  apps: [
    {
      name: 'yega-api',
      script: 'dist/index.js',
      autorestart: true,
      watch: false,
      max_memory_restart: '150M',
      log_date_format: 'YYYY-MM-DD HH:mm Z',
      error_file: '~/.pm2/logs/yega-api-error.log',
      out_file: '~/.pm2/logs/yega-api-out.log',
      combine_logs: true,
      env_development: {
        NODE_ENV: 'development',
        PORT: 3001,
        CORS_ORIGINS: 'http://localhost:3000,http://localhost:3001,http://localhost:8080',
      },
      env_staging: {
        NODE_ENV: 'staging',
        PORT: 3000,
        CORS_ORIGINS: 'https://app.stg.yega.com.mx,https://tienda.stg.yega.com.mx,https://repartidor.stg.yega.com.mx',
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 8080,
        CORS_ORIGINS: 'https://app.yega.com.mx,https://tienda.yega.com.mx,https://repartidor.yega.com.mx',
      },
    },
  ],
};
```

## 6. Comandos Útiles

- **Iniciar:** `pm2 start ecosystem.config.js --env <environment>`
- **Recargar:** `pm2 reload yega-api`
- **Monitorear:** `pm2 monit`
- **Ver Logs:** `pm2 logs yega-api`
- **Detener:** `pm2 stop yega-api`
- **Eliminar:** `pm2 delete yega-api`
- **Guardar configuración:** `pm2 save`
- **Iniciar al arranque del servidor:** `pm2 startup`

## 7. Configuración de Servidor (DNS/SSL)

### Apuntar Dominio/Subdominio

Para apuntar un dominio (ej. `api.yega.com.mx`) a la IP del servidor donde corre la API, se debe crear un registro `A` en la configuración DNS del proveedor de dominio.

- **Tipo de Registro:** `A`
- **Host/Nombre:** `api` (o el subdominio deseado)
- **Valor/Dirección:** La dirección IP pública del servidor.
- **TTL (Time To Live):** Se recomienda un valor bajo (ej. 300 segundos) durante la configuración inicial para propagar los cambios rápidamente.

### Generación de Certificado SSL con Let's Encrypt

Se recomienda usar `certbot` para obtener e instalar certificados SSL de Let's Encrypt de forma gratuita.

1.  **Instalar Certbot:**
    Las instrucciones varían según el sistema operativo. Para Ubuntu con Nginx:
    ```bash
    sudo snap install --classic certbot
    sudo ln -s /snap/bin/certbot /usr/bin/certbot
    sudo certbot --nginx
    ```

2.  **Obtener el Certificado:**
    El comando `certbot --nginx` guiará a través del proceso. Detectará los dominios configurados en Nginx y permitirá seleccionar para cuáles generar el certificado.

3.  **Renovación Automática:**
    Certbot configura una tarea programada (`cron job` o `systemd timer`) para renovar los certificados automáticamente antes de que expiren. Se puede verificar con:
    ```bash
    sudo certbot renew --dry-run
    ```
Este comando simula una renovación para asegurar que el proceso está bien configurado.
