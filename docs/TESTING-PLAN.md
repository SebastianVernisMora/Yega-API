# Plan de Pruebas y Verificación

Este documento describe cómo verificar que la API está funcionando correctamente después de ser desplegada con PM2, y cómo probar la configuración de CORS.

## 1. Verificación de la API con PM2

Una vez que la API ha sido iniciada con PM2, puedes usar el siguiente comando `curl` para verificar que está respondiendo. Este comando apunta a la ruta pública `/health`, que no requiere autenticación.

```bash
curl http://localhost:PORT/health
```

Reemplaza `PORT` con el puerto configurado para el entorno correspondiente en `ecosystem.config.js` (ej. `8080` para producción).

La respuesta esperada es un JSON con el estado "ok":
```json
{"status":"ok","uptime":123.456}
```

Si la API está detrás de un proxy inverso con un dominio, puedes probarlo directamente:
```bash
curl https://api.yega.com.mx/health
```

## 2. Pruebas de Configuración de CORS

Para verificar que la configuración de CORS funciona como se espera, necesitas hacer una petición desde un origen (dominio) que esté en la lista blanca.

### Método 1: Usando la Consola del Navegador

1.  **Abre el frontend** que debería tener acceso a la API (ej. `https://app.yega.com.mx`) en tu navegador.
2.  **Abre la consola de desarrollador** (normalmente con F12 o `Ctrl+Shift+I`).
3.  **Ejecuta una petición `fetch`** a un endpoint de la API:
    ```javascript
    fetch('https://api.yega.com.mx/health')
      .then(response => response.json())
      .then(data => console.log(data))
      .catch(error => console.error('Error:', error));
    ```
4.  **Verifica la respuesta:**
    -   **Éxito:** Si ves el objeto JSON en la consola, la configuración de CORS es correcta.
    -   **Fallo:** Si ves un error de CORS en la consola (ej. `Access-Control-Allow-Origin`), el origen desde el que ejecutas la prueba no está en la lista de permitidos.

### Método 2: Creando una Página de Prueba

Si no tienes un frontend desplegado, puedes crear un archivo HTML simple para simular una petición desde un origen diferente.

1.  **Crea un archivo `test-cors.html`:**
    ```html
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <title>CORS Test</title>
    </head>
    <body>
        <h1>CORS Test Page</h1>
        <script>
            fetch('https://api.yega.com.mx/health')
              .then(response => response.json())
              .then(data => {
                  console.log('Success:', data);
                  document.body.innerHTML += '<p>Success!</p><pre>' + JSON.stringify(data, null, 2) + '</pre>';
              })
              .catch(error => {
                  console.error('CORS Error:', error);
                  document.body.innerHTML += '<p style="color: red;">CORS Error. Check console.</p>';
              });
        </script>
    </body>
    </html>
    ```
2.  **Sube este archivo a un servidor web** en un origen diferente al de la API. Por ejemplo, si tu API está en `api.yega.com.mx`, puedes alojar esta página en cualquier otro dominio o servicio de hosting (incluso un bucket de S3 configurado como sitio web).

3.  **Abre la página en tu navegador** y revisa el resultado. Esto te permitirá confirmar que los orígenes que no están en la lista blanca son bloqueados y los que sí están, son permitidos.
