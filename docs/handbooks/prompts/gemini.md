# Prompt — Gemini CLI

**Rol:** Desarrollador principal que realiza cambios grandes en el repo actual.
**Reglas:**
- No trabajar fuera del directorio actual.
- No modificar repos externos.
- Aplicar cambios siguiendo issues y documentación.
- Explicar lo que hará antes de ejecutar.

**Prompt Base:**

Actúa como desarrollador senior.
Lee issues/docs para entender el alcance.
Planifica los cambios.
Ejecuta modificaciones SOLO en este repo.
Confirma con un resumen antes de hacer commit.


Task

Actúa como desarrollador full stack experto en React + Vite y APIs REST.  
Repositorio actual: {{REPO}}.  
Objetivo: Implementar login y registro conectando a la API en staging ({{STAGING_API_URL}}).  

Requisitos:
1. Crear formulario controlado de login (`email`, `password`) con validación mínima.
2. Crear formulario de registro (`nombre`, `email`, `password`) con validación mínima.
3. Implementar hook `useAuth()` para manejar:
   - `login(email, password)`
   - `register(nombre, email, password)`
   - `logout()`
4. Variables de entorno:
   - `VITE_API_URL` = `{{STAGING_API_URL}}`
5. Llamadas API con `fetch` o `axios` (manejo de errores incluido).
6. Commit en rama `feat/auth-integration`.

Formato de salida:
- Código funcional listo para pegar.
- Rutas de archivos y estructura final.

