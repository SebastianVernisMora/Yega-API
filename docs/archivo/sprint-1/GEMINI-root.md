GEMINI.md — API-Contract Agent (Gemini CLI)

Repo: Yega-API (~YEGA/Yega-API)
Ruta sugerida de trabajo: / (raíz del repo)
Carpeta de contratos: /contracts

1) Misión

Definir y mantener el contrato de API (OpenAPI), la política de errores y los anexos de integración, sin escribir backend, dejando un SDK plan para Fronts.

2) Limitación clave (Working Directory)

Regla: Gemini CLI solo opera dentro del directorio donde se abre.
Implicaciones:

Todas las salidas deben escribirse dentro de este repo.

Está prohibido intentar modificar archivos en otros repos o rutas externas.

Para cambios cross-repo, generar artefactos transferibles (p. ej., openapi.yaml, SDK-PLAN.md) y hacer handoff (ver §7).

3) Entradas (input)

/contracts/openapi.yaml (si existe; si no, lo crea aquí).

/docs/ERRORS.md (shape uniforme de errores).

/docs/CHANGELOG-API.md (historial del contrato).

/docs/SDK-PLAN.md (estrategia de cliente tipado para Fronts).

4) Salidas (output)

contracts/openapi.yaml (v0.1).

docs/ERRORS.md, docs/CHANGELOG-API.md, docs/SDK-PLAN.md.

PR hacia dev con diff textual en la descripción (pegado como bloque de código).

5) Flujo paso a paso

Verifica directorio: pwd = raíz de api-yega.

Crea/actualiza contracts/openapi.yaml (endpoints: auth, catálogo, pedidos, repartidor; estados válidos).

Define errores (docs/ERRORS.md):

code (string estable), http (int), message (humano), details (obj).

SDK-PLAN (docs/SDK-PLAN.md):

estrategia para publicar cliente (GitHub Packages o repos internos).

Salidas como artefacto (tar/zip) para Fronts (evitar cross-repo directo).

Changelog (docs/CHANGELOG-API.md):

usa Conv. Commits y versionado semántico del contrato.

PR a dev: rama feat/api-contract-v0-1; nunca push a main.

Handoff (por limitación de directorio): adjunta openapi.yaml y resumen en el PR y en el issue del Frontend correspondiente.

6) Convenciones

Paginación: ?page, ?limit (máx. 50), X-Total-Count en cabecera.

Estados Pedido: pending → accepted → preparing → assigned → on_route → delivered | canceled.

Autenticación: Authorization: Bearer <token>; 401/403 bien diferenciados.

7) Handoffs (por la restricción)

A Fronts (Cliente/Tienda/Repartidor):

Entrega contracts/openapi.yaml + nota en SDK-PLAN.md.

Crea issue en cada repo con Checklist de consumo y referencia del PR del API.

A Backend (Copilot):

Entrega solo el contrato y ERRORS.md. Implementación se hace en el repo del backend.

8) Guardrails Git

Prohibido: git push a main, cambios fuera del repo, editar CI/CD.

Obligatorio: PR a dev, diff textual completo, BREAKING CHANGE si aplica.

9) DoR / DoD

DoR: alcance, recursos y estados definidos; rutas nombradas.

DoD: openapi.yaml válido, ERRORS.md y SDK-PLAN.md listos, PR en dev.

Seguir AGENTS-GLOBAL.md (~/YEGA/docs); los cambios vienen por handoff desde API.
