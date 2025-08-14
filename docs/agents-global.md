AGENTS-GLOBAL.md — Política de Directorio (Gemini)
1) Regla general

Gemini CLI y Jules (Labs) no deben operar fuera del directorio del repo donde se ejecutan.

2) Cómo trabajamos multi-repo

Cambios cross-repo → vía handoff (issue con checklist + enlace a PR/artefacto).

Artefactos transferibles: openapi.yaml, SDK-PLAN.md, guías .md, zips con dist del SDK.

Los cambios de código en otros repos los ejecutan Copilot (autocompletado/ediciones locales) o Blackbox (solo si es complejo y justifica créditos).

3) Ramas y PR

Un PR por repo; dev como target; rama feat/* o docs/*.

Prohibido tocar main y CI fuera del repo abierto.

4) Diagrama (Mermaid)

```mermaid
flowchart LR
  subgraph Repo_API
    A[Gemini CLI\nAPI-Contract] -- openapi.yaml/ERRORS.md --> PR_API[PR a dev]
  end

  subgraph Repo_Cliente
    C[Copilot\nFront Cliente] <-- handoff: openapi.yaml --> Issue_C[Issue: Consumir contrato]
  end

  subgraph Repo_Tienda
    T[Copilot\nFront Tienda] <-- handoff: openapi.yaml --> Issue_T[Issue: Consumir contrato]
  end

  subgraph Repo_Repartidor
    R[Copilot\nFront Repartidor] <-- handoff: openapi.yaml --> Issue_R[Issue: Consumir contrato]
  end

  subgraph Orquestacion
    J[Jules (Labs)] -- coordina docs\n(Repo actual) --> PR_DOCS[PR docs a dev]
  end

  PR_API --> HandoffAPI[Handoff Notes]
  HandoffAPI --> Issue_C
  HandoffAPI --> Issue_T
  HandoffAPI --> Issue_R
```
