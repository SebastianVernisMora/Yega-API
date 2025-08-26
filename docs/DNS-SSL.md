# Configuración de DNS y SSL

Esta guía describe los pasos para configurar un dominio y protegerlo con un certificado SSL para la Yega-API.

## 1. Apuntar Dominio/Subdominio al Servidor

Para que tu dominio (ej. `api.yega.com.mx`) apunte a la IP de tu servidor, debes crear un registro DNS de tipo `A`.

1.  **Obtén la IP pública de tu servidor:**
    ```bash
    curl ifconfig.me
    ```

2.  **Accede al panel de control de tu proveedor de dominio.**

3.  **Crea un nuevo registro `A`:**
    -   **Tipo:** `A`
    -   **Host/Nombre:** El subdominio que usarás (ej. `api` para `api.yega.com.mx` o `@` para el dominio raíz).
    -   **Valor/Dirección IP:** La IP pública de tu servidor.
    -   **TTL (Time To Live):** Déjalo en el valor por defecto (normalmente 1 hora).

La propagación de los cambios de DNS puede tardar desde unos minutos hasta 48 horas. Puedes verificar si el dominio ya apunta a tu servidor con el comando `ping`:
```bash
ping api.yega.com.mx
```

## 2. Generar e Instalar Certificado SSL con Certbot

Se recomienda usar [Certbot](https://certbot.eff.org/) con Let's Encrypt para obtener certificados SSL gratuitos y automatizar su renovación.

### Prerrequisitos

-   Un servidor con acceso `sudo`.
-   El dominio/subdominio ya debe apuntar a la IP del servidor.
-   Tener un servidor web como Nginx o Apache instalado para servir como proxy inverso.

### Pasos de Instalación (Ejemplo con Nginx en Ubuntu)

1.  **Instalar Certbot y el plugin de Nginx:**
    ```bash
    sudo apt update
    sudo apt install certbot python3-certbot-nginx
    ```

2.  **Configurar Nginx como Proxy Inverso:**
    Asegúrate de tener un bloque de servidor en la configuración de Nginx para tu dominio, que actúe como proxy inverso para la API de Node.js.

    Ejemplo de `/etc/nginx/sites-available/api.yega.com.mx`:
    ```nginx
    server {
        listen 80;
        server_name api.yega.com.mx;

        location / {
            proxy_pass http://localhost:8080; # Asume que tu API corre en el puerto 8080
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_cache_bypass $http_upgrade;
        }
    }
    ```
    Activa esta configuración:
    ```bash
    sudo ln -s /etc/nginx/sites-available/api.yega.com.mx /etc/nginx/sites-enabled/
    sudo nginx -t && sudo systemctl reload nginx
    ```

3.  **Obtener el certificado SSL:**
    Ejecuta Certbot y sigue las instrucciones. Se modificará automáticamente tu configuración de Nginx para usar HTTPS.
    ```bash
    sudo certbot --nginx -d api.yega.com.mx
    ```

4.  **Verificar la renovación automática:**
    Certbot configura una tarea programada (`cron job` o `systemd timer`) para renovar los certificados automáticamente. Puedes probarlo con:
    ```bash
    sudo certbot renew --dry-run
    ```

Con estos pasos, tu API será accesible a través de `https://api.yega.com.mx` y la conexión estará cifrada.
