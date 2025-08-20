# AGENTES — Orquestación y Flujo de Uso

Este documento centraliza el flujo de trabajo y uso de las IAs en el proyecto **Yega-Ecosistema**.

## 1. Flujo General
1. **Gemini CLI** — Cambios grandes en el repo abierto.
2. **Codex CLI** — Revisión de cambios generados por Gemini.
3. **Jules** — Revisión final antes de PR, documentación y handoffs.
4. **Blackbox** — Implementaciones complejas y puntuales.

## 2. Reglas
- **Una PR por tema.**
- **Nada de cross-repo directo.** Si afecta otros repos, generar *handoff* en texto para ese repo.
- Footer obligatorio en commits:

AI-Usage: gemini=0, codex=0, jules=0, blackbox=0

## 3. Tabla de Responsabilidades

| Fase          | Objetivo                                      | Entrada                             | Salida                                   | Responsable |
|---------------|-----------------------------------------------|--------------------------------------|-------------------------------------------|-------------|
| Planeación    | Definir alcance y plan                        | Requerimiento                        | Lista de tareas                           | Humano      |
| Desarrollo    | Implementar cambios grandes                   | Issues / Docs                        | Código                                    | Gemini      |
| Revisión CLI  | Validar cambios y aplicar ajustes              | Diff de Gemini                       | Patch limpio                              | Codex       |
| Revisión PR   | Redactar PR y plan de rollback                 | Código final                         | Pull Request listo                        | Jules       |
| Implementación| Resolver problemas complejos                   | Especificación técnica               | Código especializado                      | Blackbox    |
