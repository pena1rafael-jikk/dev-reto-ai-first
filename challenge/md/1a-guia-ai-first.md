## **Programa AI-First · Fase 1**

Jikkosoft — Preparación y Reto

Preparado por Diego Trujillo · diego.trujillo@jikkosoft.com

## **Aspectos importantes**

_Por qué Hermes, Jikkosoft pasa de escribir código a orquestar contexto. La investigación interna (hermes-exploratory, 2026) lo confirma con datos: mejorar la spec es 3× más efectivo que actualizar el modelo — pasar de Spec A (~150 palabras) a Spec B (~480 palabras) produce +26 puntos promedio en calidad de output; subir de Haiku a Opus en la misma spec produce solo +12 a +24. Una spec mal escrita hace que el modelo más costoso alucine convenciones e ignore reglas de integridad. Una spec bien escrita hace que el modelo más barato produzca output de producción. Hermes es el canal obligatorio que hace este proceso repetible, trazable y transferible._

## **Requisitos mínimos**

| **Herramienta**              | **Instalación / Acceso**                                          |
| ---------------------------------- | ------------------------------------------------------------------------ |
| Codex CLI                          | Instalar desde github.com/openai/codex                                   |
| Claude Code (Claude CLI)           | claude.ai/code—descarga el instalador o sigue la guía de la plataforma |
| Hermes agent`<br>`(NousResearch) | github.com/NousResearch/hermes-agent—install.sh                         |
| Git                                | git-scm.com·macOS/Linux: preinstalado·Windows: descargar instalador    |
| API key LLM                        | Contactar a Juan David para obtener acceso a una API                     |
| Cuenta GitHub o GitLab             | github.como gitlab.com— repo público donde alojar la entrega del reto  |

## **Principio fundacional**

Todo proyecto AI empieza con /init. Antes de escribir una sola spec, antes de tocar código, antes de todo: ejecuta claude /init en el repositorio. Esto genera el CLAUDE.md base y establece el contrato AI del proyecto. Sin este paso, la IA trabaja sin contexto y los resultados son impredecibles.

## **Estructura general**

| **Etapa**                         | **Descripción**                                                                                | **Fechas** |
| --------------------------------------- | ----------------------------------------------------------------------------------------------------- | ---------------- |
| 1 — Capacitación                      | Claude CLI · Spec Engineering · CLAUDE.md · Plan & Loop ·`<br>`MCP Servers · Subagentes · Git | 24–25 jun       |
| 2 — Adaptabilidad                      | Construcción y entrega del proyecto (Reto Fase 1: DEV +`<br>`QA en paralelo)                       | 26 jun – 6 jul  |
| 3 — Adaptabilidad`<br>`con lo actual | Integración del workflow AI-first con proyectos y contexto`<br>`existente                          | hasta 7 jul      |

_Evaluación: martes 7 de julio · demo de 5–7 min por track._

## **Etapa 1 — Capacitación · 24–25 jun**

## **Workshop 1 — Apertura + Codex CLI · Miércoles 24 jun (1–1.5 hrs)**

- Apertura del programa: contexto del “momento cero” y el nuevo modelo operativo AI-first.
- Instalación: Claude Code (claude.ai/code) + Hermes (curl install → hermes setup).
- Verificación: claude --version · hermes doctor — ambos deben responder antes de continuar.
- El ritual /init en vivo sobre un repo vacío: qué genera, por qué importa.
- Navegación básica: slash commands, permisos, modo interactivo vs. autónomo.
- Hermes como intermediario obligatorio: toda interacción con modelos pasa por aquí. Libertad de elegir uno o varios LLMs para codificar o implementar (ej: Claude Sonnet, Haiku, Opus, Codex, DeepSeek, Kimi K2, etc.).

## **Referencia de comandos Hermes:**

| **Comando**                         | **Uso**                                                                        |
| ----------------------------------------- | ------------------------------------------------------------------------------------ |
| hermes setup                              | Configuración inicial — conecta proveedores (Anthropic, DeepSeek,`<br>`Moonshot) |
| hermes doctor                             | Diagnóstico de instalación y conectividad                                          |
| hermes model                              | Selector interactivo de modelo (muestra todos los disponibles)                       |
| /model`<br>`anthropic:claude-sonnet-4-6 | Cambia el modelo activo dentro del TUI                                               |
| /new                                      | Abre conversación fresca — evita memory bleed entre tareas                         |
| hermes config list                        | Lista las claves de config aceptadas por la versión instalada                       |

## **Workshop 2 — Spec Engineering · Miércoles 24 jun, tarde (1–1.5 hrs)**

- Por qué la calidad de la spec supera la elección del modelo.
- La matriz real: 3 niveles de spec × 7 modelos — caso de estudio extraído del experimento interno de Diego (hermes-exploratory).
- Hallazgo clave: Haiku + Spec C (88 pts) > Opus + Spec A (72 pts). Spec B + Sonnet es el punto de equilibrio costo/calidad.
- Ejercicio práctico: cada participante escribe 3 versiones de spec para algo de su contexto y compara outputs.

## **Checklist de una spec efectiva (nivel Spec B — punto de equilibrio):**

- Dominio — qué representa la spec, en 2–3 oraciones.
- Scope — lista explícita de entidades/tablas con columnas clave.
- Tech stack — versión de DB, estrategia de IDs, formato de timestamps.
- Convenciones — naming, columnas de estado (CHECK vs ENUM), tipo de moneda.
- Reglas de integridad — soft delete, ON DELETE, UNIQUE, CHECK constraints.
- Reglas de safe-change — columnas nullable, sin renombrados, índices en FKs.
- Fuera de scope — qué NO generar (evita tablas alucinadas).
- Entregable esperado — formato exacto de output (solo SQL, sin prosa, sin fences).

## **Rubric de evaluación de output (0–100):**

| **Categoría** | **Máx** | **Qué evalúa**                                 |
| -------------------- | -------------- | ------------------------------------------------------ |
| Structure            | 30             | Tablas requeridas, FKs, sin tablas inventadas          |
| Naming               | 15             | snake_case, id/{table}_id, created_at/updated_at       |
| Integrity            | 20             | PK/FK, NOT NULL, UNIQUE, soft delete, CASCADE/RESTRICT |
| Comments             | 15             | Tablas y decisiones no obvias documentadas             |
| Query feasibility    | 10             | Queries clave soportados, índices en FKs y hot paths  |
| Spec adherence       | 10             | Siguió la spec, sin features inventadas               |

_Regla práctica: score < 80 → la spec necesita más detalle, no un modelo más caro. Referencia completa: github.com/diegotrujillo-jikko/hermes-exploratory_

_Días sin workshop: adaptación libre + punto de control (3 líneas de avance + bloqueos vía Hermes)._

## **Workshop 3 — CLAUDE.md · Jueves 25 jun, mañana (1–1.5 hrs)**

- El /init genera el esqueleto; tú lo conviertes en un contrato AI preciso.
- Componentes esenciales: authority hierarchy, safe/unsafe zones, naming conventions, model selection table.
- Revisión en vivo de un CLAUDE.md real de producción (21 KB, API de SILIN).
- Diferencia entre un README y un AI operating contract.
- Cada participante toma su repo actual (SILIN / integraciones) y escribe su propio CLAUDE.md desde cero.
- Track DEV: orientado a construcción (safe zones para schema, API, FE).
- Track QA: orientado a pruebas (qué no modificar del SUT, cómo describir el alcance de cobertura).
- Revisión cruzada en pares.

**Workshop 4 — Plan & Loop + MCP + Subagentes + Git · Jueves 25 jun, tarde (1–1.5 hrs)**

- /plan antes de cualquier tarea compleja: cómo estructurar el trabajo antes de generar código.
- Loop modes para tareas iterativas.
- Sistema everything-claude-code: el skill correcto para cada tipo de tarea.

| **Skill**    | **Uso**                 |
| ------------------ | ----------------------------- |
| :tdd-workflow      | Desarrollo guiado por pruebas |
| :backend-patterns  | APIs y servicios              |
| :security-review   | Revisión de seguridad        |
| :database-reviewer | Schema y queries              |

- Demostración completa: /init → /plan → build con skills apropiados.
- MCP Servers: Figma como fuente de diseño leíble por IA · Azure DevOps WI como PRD · claude-mem para memoria persistente entre sesiones.
- Subagentes paralelos: patrón LLM-as-judge — un modelo genera el output, otro lo evalúa. Caso real en hermes-exploratory Phase 2: spec → generator → SQL → judge → score 0–100 → gate (precision ≥ 0.85 = merge ✓).
- Git con AI: commits semánticos, PRs, ai-dev-log para trazabilidad de sesiones.
- Cierre del curso y lanzamiento oficial de los Retos Fase 1.

## **Etapa 2 — Reto Fase 1 · 26 jun – 6 jul**

## **Dos tracks en paralelo**

## **Track DEV — Portal de Convocatorias Públicas**

Misión: En 4 días, implementar el Portal de Convocatorias Públicas — autenticación, backend REST, base de datos e integración con datos.gov.co (SECOP) — sin escribir código a mano. Todo se genera y se itera a través de Hermes como agente principal y uno o varios LLMs de su preferencia para codificar o implementar (ej: Claude Sonnet, Haiku, Opus, Codex, DeepSeek, Kimi K2, etc.).

## **Componentes obligatorios:**

| **Componente** | **Requisito**                                               |
| -------------------- | ----------------------------------------------------------------- |
| Autenticación       | Registro e inicio de sesión con JWT                              |
| Backend              | API REST — búsqueda, filtros, gestión de bookmarks             |
| Frontend             | Interfaz web funcional: browse de convocatorias y favoritos       |
| Base de datos        | PostgreSQL o SQLite — usuarios, bookmarks, búsquedas guardadas  |
| Integración         | datos.gov.co SECOP — consulta en vivo de convocatorias públicas |

## **Reglas:**

1. Cero código manual — solo especificas, diriges, revisas e iteras.
2. Hermes como agente principal y uno o varios LLMs de su preferencia para codificar o implementar (ej: Claude Sonnet, Haiku, Opus, Codex, DeepSeek, Kimi K2, etc.) — obligatorio e innegociable.
3. Dominio fijo: Portal de Convocatorias. La diferencia la hace la profundidad de tu spec.
4. Repositorio público (GitHub o GitLab).

## **Cronograma — Etapa 2 · Reto Fase 1**

| **Día**                 | **DEV**                                                                                           | **QA**                                                                  |
| ------------------------------ | ------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| Vie 26 jun                     | /init → CLAUDE.md → primera spec → inicio`<br>`de construcción                                    | /init → plan de pruebas → setup Playwright`<br>`/ pytest                  |
| Lun 30 jun – Vie`<br>`4 jul | Backend + Frontend + DB + Integración ·`<br>`punto de control diario (3 líneas vía`<br>`Hermes) | E2E + API + datos + escenario`<br>`ALERTS_FAIL=1 · punto de control diario |
| Dom 6 jul                      | Repo final + SOUL.md · entrega antes de`<br>`medianoche                                              | Repo final + SOUL.md · entrega antes de`<br>`medianoche                    |
| Mar 7 jul                      | Demo 5–7 min + cata por grupos ·`<br>`evaluación final                                             | Demo 5–7 min + cata por grupos ·`<br>`evaluación final                   |

## **Entregables de ambos tracks**

- SOUL.md (obligatorio, tan importante como el código)

## **Track DEV:**

- Qué construiste y qué problema resuelve
- Stack y arquitectura: componentes y cómo se conectan
- Cómo usaste Hermes y los LLMs: skills, specs y prompts que mejor funcionaron
- Decisiones y trade-offs
- Bloqueos y cómo los resolviste
- Qué mejorarías o pedirías
- Enlace al repositorio

## **Criterios de evaluación**

| **Dimensión**                                                   | **Peso** |
| ---------------------------------------------------------------------- | -------------- |
| Calidad del SOUL.md y trazabilidad del proceso                         | 25%            |
| Autonomía: investigó y desbloqueó por cuenta propia                 | 25%            |
| Orquestación de IA: claridad de specs, iteración, manejo de contexto | 18%            |
| Funcionalidad E2E (DEV) / Cobertura y profundidad (QA)                 | 14%            |
| Previsión y comunicación a tiempo                                    | 10%            |
| Criterio técnico (DEV) / Criterio de QA (QA)                          | 8%             |

_Se busca criterio y adaptación, no el proyecto más grande ni la suite más extensa._

## **Sobre créditos y costos**

Los modelos tienen costo y las capas gratuitas se agotan. Prever esto es parte del reto.

Si necesitas acceso a un modelo corporativo o te vas a quedar corto de créditos, levanta la mano a tiempo — no el último día. Anticiparte y comunicar a tiempo es una de las capacidades que se están evaluando.

_Dudas durante el programa: canalízalas a Diego Trujillo — diego.trujillo@jikkosoft.com o Google Chat._
