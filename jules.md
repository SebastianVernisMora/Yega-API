# Jules — PR y Documentación (Yega-API)

- Rama: `feat/auth-integration`
- Base: `dev`
- Objetivo: Rama de sincronización para alinear flujo de PRs. No hay cambios funcionales de autenticación en este repo (docs/contratos).

## Acciones para Jules
- Crear PR: "chore: sync branch para auth integration" → base `dev`.
- Incluir en el cuerpo del PR los enlaces a la documentación clave:
  - `docs/PM2-PLAYBOOK.md`
  - `docs/GO-LIVE.md`
  - `docs/OBSERVABILIDAD.md`
  - `docs/CORS-ORIGINS.md`
- Checklist en PR:
  - [ ] El PR no introduce cambios funcionales.
  - [ ] Se mantienen vigentes los playbooks de despliegue y observabilidad.
  - [ ] Validar que la rama compila/verifica contratos si aplica.
- Riesgos: Ninguno funcional. Solo sincronización.

## Compare para PR
- https://github.com/SebastianVernisMora/Yega-API/compare/dev...feat/auth-integration?expand=1

## Footer sugerido
AI-Usage: gemini=0, codex=1, jules=1, blackbox=0

