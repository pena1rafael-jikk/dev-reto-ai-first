## **Reto AI-First · Fase 1** 

Construye el Portal de Convocatorias Públicas — sin escribir código manualmente Track DEV · Preparado por Diego Trujillo · diego.trujillo@jikkosoft.com · Jikkosoft 

## **1. Por qué hacemos esto** 

Jikkosoft está dando un paso hacia un modelo de trabajo AI-first: el rol del desarrollador deja de ser escribir código línea por línea y pasa a ser especificar, orquestar y validar sistemas construidos con asistencia de IA. 

Este reto es tu espacio para experimentar ese cambio de chip mental en un entorno seguro, con acompañamiento y una ruta de aprendizaje. No se trata de saberlo todo desde el día uno: se trata de adaptarte, investigar y construir. 

## **2. El reto en una frase** 

En 6 días hábiles, implementa el Portal de Convocatorias Públicas — una app con autenticación, backend, base de datos e integración con datos.gov.co — sin escribir código a mano: todo se genera y se itera a través de Hermes como agente principal y uno o varios LLMs de su preferencia para codificar o implementar (ej: Claude Sonnet, Haiku, Opus, Codex, DeepSeek, Kimi K2, etc.). 

## **3. Qué debes construir — Portal de Convocatorias Públicas** 

Un portal donde usuarios registrados pueden explorar, filtrar y guardar convocatorias públicas colombianas. La fuente de datos es la API abierta de datos.gov.co (SECOP — Sistema Electrónico para la Contratación Pública). El dominio es fijo para todos — la diferencia la hace la calidad de tu implementación y la profundidad de tu spec. 

|**Componente**|**Requisito mínimo**|
|---|---|
|Autenticación|Registro e inicio de sesión con JWT — usuarios tienen perfil propio|
|Backend|API REST con lógica de negocio: búsqueda, filtros, gestión de bookmarks|
|Frontend|Interfaz web funcional: browse de convocatorias, guardar favoritos, perfil|



Base de datos PostgreSQL o SQLite — tablas: usuarios, bookmarks, búsquedas guardadas Integración datos.gov.co SECOP — consulta en vivo de convocatorias por entidad, fecha y estado 

El endpoint base de datos.gov.co usa el protocolo Socrata Open Data API (SODA). Ejemplo: https://www.datos.gov.co/resource/p6dx-8zbt.json (SECOP I — contratos y convocatorias). No requiere API key para consultas básicas. 

## **4. Reglas del juego** 

1. Cero código manual. No escribes código tú; lo genera la IA. Tu trabajo es especificar, dirigir, revisar e iterar. 

2. Hermes como agente principal y uno o varios LLMs de su preferencia para codificar o implementar (ej: Claude Sonnet, Haiku, Opus, Codex, DeepSeek, Kimi K2, etc.) — obligatorio e innegociable. Toda interacción con modelos (generación, consulta, refactor) pasa a través de Hermes. 

3. Tu repo, tu casa. Sube el código a GitHub público o GitLab. El dominio es fijo (Portal de Convocatorias) — la diferencia la hace la profundidad de tu implementación. 

4. Provee tu acceso a modelos. Necesitarás un proveedor LLM conectado a Hermes (OpenAI, Anthropic, etc.). Ver punto 7 sobre créditos. 

## **5. Qué debes entregar** 

1. Repositorio (GitHub público o GitLab) con el proyecto funcional. 

2. Contexto de Hermes en un archivo SOUL.md — el resumen contextual de tu trabajo con Hermes (plantilla abajo). Este archivo es tan importante como el código: es la evidencia de cómo construiste. 

3. Demo corta (5–7 min) el viernes de la semana del reto. 

## **Plantilla del entregable SOUL.md** 

- Proyecto: qué construiste y qué problema resuelve 

- Stack y arquitectura: componentes y cómo se conectan 

- Cómo usaste Hermes y los LLMs: skills/instrucciones clave, specs o prompts que mejor funcionaron, iteraciones 

- Decisiones y trade-offs: qué elegiste y por qué 

- Bloqueos y cómo los resolviste 

- Qué mejorarías o pedirías 

- Enlace al repositorio 

## **6. Cronograma (tentativo)** 

|**Día**|**Fecha**|**Foco**|
|---|---|---|
|Apertura|Vie 26 jun|Lanzamiento del reto, ruta de aprendizaje, inicio de construcción|
|Días 1–5|Lun–Vie 30<br>jun – 6 jul|Construcción + puntos de control diarios|
|Evaluación|Mar 7 jul|Demos y revisión por grupos|



_Punto de control diario: un reporte breve (3 líneas) de avance + bloqueos, vía Hermes/Drive. Sirve para acompañarte, no para vigilarte._ 

## **7. Sobre créditos y costos — léelo** 

Los modelos cuestan y las capas gratuitas se agotan. Prever esto es parte del reto. 

Si ves que te vas a quedar corto de créditos o necesitas acceso a un modelo corporativo, levanta la mano a tiempo (no el último día). Anticiparte y comunicar a tiempo es justamente una de las capacidades que estamos observando. 

## **8. Ruta de aprendizaje sugerida** 

No estás solo. Te sugerimos recursos para arrancar (no son obligatorios ni exhaustivos — explóralos y trae los tuyos). Sea cual sea la herramienta que elijas, recuerda que debe conectarse a través de Hermes. 

## **Fundamentos de orquestación de IA y agentes** 

- Anthropic — Effective context engineering for AI agents 

- Anthropic Academy — Build with Claude 

## **Escritura de specs / prompting efectivo** 

- Guía de prompt engineering (Claude Docs) 

- Tutorial interactivo de prompting (Anthropic) 

## **Herramientas de desarrollo asistido por IA** 

- Documentación de Claude Code 

## **Uso de Hermes (obligatorio)** 

• Hermes Agent (Nous Research) — repositorio y documentación oficial 

## **Manejo de repositorios (GitHub / GitLab)** 

- GitHub — primeros pasos 

- GitLab Docs 

## **9. Cómo te vamos a evaluar (visión general)** 

No buscamos el proyecto más grande, buscamos criterio y adaptación. Valoramos especialmente: 

- La calidad de tu SOUL.md y la trazabilidad de tu proceso 

- Tu autonomía: cómo investigaste y resolviste bloqueos por tu cuenta 

- Qué tan bien orquestaste la IA (claridad de tus specs, iteración, contexto) 

- Que el producto funcione end-to-end: auth + browse de convocatorias desde datos.gov.co + bookmarks persistidos en DB 

- Tu previsión y comunicación a tiempo 

_Dudas durante el reto: canalízalas a Diego Trujillo — diego.trujillo@jikkosoft.com o Google Chat._ 

