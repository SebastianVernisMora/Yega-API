# Playbook de Puesta en Producción (Go-Live)

Este documento detalla los pasos para un despliegue seguro en producción.

## 1. Checklist Pre-Despliegue

- [ ] Confirmar que la PR fue aprobada y mezclada a `main`.
- [ ] Notificar al equipo sobre el inicio del despliegue.
- [ ] Verificar que el entorno de Staging ha sido validado.
- [ ] Realizar backup de la base de datos (si aplica).

## 2. Proceso de Despliegue

1.  **Acceder al servidor de producción.**
2.  **Navegar al directorio de la aplicación:**
    ```bash
    cd /var/www/yega-api
    ```
3.  **Poner la aplicación en modo mantenimiento (si existe un balanceador):**
    ```bash
    # Comando para deshabilitar el tráfico al nodo
    ```
4.  **Obtener la última versión del código:**
    ```bash
    git pull origin main
    ```
5.  **Instalar/actualizar dependencias:**
    ```bash
    npm install --production
    ```
6.  **Recargar la aplicación con PM2:**
    ```bash
    pm2 reload ecosystem.config.js --env production
    ```
7.  **Habilitar el tráfico nuevamente.**

## 3. Smoke Tests

Después del despliegue, ejecutar las siguientes verificaciones:

- **Endpoint de Health Check:**
  ```bash
  curl -s http://localhost:8080/health | grep "OK"
  ```
  *Salida esperada: `{"status":"OK"}`*

- **Endpoint de Readiness:**
  ```bash
  curl -s http://localhost:8080/ready | grep "OK"
  ```
  *Salida esperada: `{"status":"OK"}`*

- **Monitorear logs en busca de errores:**
  ```bash
  pm2 logs yega-api --lines 50
  ```

## 4. Plan de Rollback

Si los smoke tests fallan o se detectan errores críticos:

1.  **Revertir al commit anterior:**
    ```bash
    git checkout HEAD~1
    ```
2.  **Recargar la aplicación con la versión anterior:**
    ```bash
    pm2 reload ecosystem.config.js --env production
    ```
3.  **Notificar al equipo sobre el rollback.**
4.  **Crear un issue post-mortem para analizar la falla.**
