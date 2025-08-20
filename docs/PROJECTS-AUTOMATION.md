# Automatización de Proyectos (Projects v2)

Este repositorio usa GitHub Projects (v2) para el tablero “Sprint 1 - Yega-API”.
La automatización se realiza con un workflow en `.github/workflows/project-automation.yml`.

## Estado automático (Status)
- PR abierto/listo con palabras de cierre (p. ej. "Closes #123"): el issue pasa a "In Progress".
- PR mergeado: los issues vinculados pasan a "Done".
- Issue cerrado: pasa a "Done".
- Issue reabierto: pasa a "Todo".

## Cómo vincular un PR a un Issue
Incluye en la descripción del PR una palabra clave de cierre:

- Closes #123
- Fixes #123
- Resolves #123

Así, el workflow detecta el enlace y mueve el item en el Project.

## Etiquetas
Todos los issues de este sprint usan la etiqueta: `sprint-1`.

## Tablero y backlog del sprint
- Backlog: `docs/ISSUES-Sprint-1.md`
- Tablero (To Do / In Progress / Done): `docs/BOARD-Sprint-1.md`

## Dónde ver el Project
El Project es de usuario (no clásico de repo). Búscalo como “Sprint 1 - Yega-API” en:

- GitHub > tu avatar > Your projects
- o con CLI: `gh project list --owner SebastianVernisMora`

> Nota: Projects (classic) están deprecados; usamos Projects v2.
