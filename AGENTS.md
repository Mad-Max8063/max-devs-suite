# Manifiesto de Orquestación Multi-Agente (Workspace AI Router)

Este documento define la topología, responsabilidades y reglas de delegación para la flota de agentes de Inteligencia Artificial que operan en este repositorio. Ningún agente debe exceder su ámbito de responsabilidad operativo (Scope Creep).

## 1. Topología de Agentes

### A. Codex Runtime Engine (OpenAI)
- **ID de Invocación:** `@codex-runtime`
- **Especialidad:** Ejecución secuencial rígida y depuración de sintaxis de baja altitud.
- **Ámbito (Scope):** - Resolución de errores sintácticos específicos.
  - Generación de expresiones regulares complejas.
  - Refactorización de funciones aisladas (micro-optimización).
- **Límites:** No debe utilizarse para analizar arquitecturas completas ni leer dependencias a nivel de proyecto masivo.

### B. Anthropic Code Orchestrator (Claude 3.5/4.6)
- **ID de Invocación:** `@anthropic-orchestrator`
- **Especialidad:** Análisis de contexto extenso y arquitectura de sistemas.
- **Ámbito (Scope):**
  - Refactorización de módulos completos que abarcan múltiples archivos.
  - Auditoría de seguridad y detección de fugas de memoria o condiciones de carrera (Race Conditions).
  - Integración "Just-in-Time Context" navegando por el repositorio.
- **Límites:** No debe utilizarse para tareas simples de una sola línea donde la latencia sea un factor crítico.

### C. Vertex Execution Engine (Gemini 1.5/3.1)
- **ID de Invocación:** `@vertex-engine`
- **Especialidad:** Procesamiento multimodal y procesos secuenciales de múltiples etapas.
- **Ámbito (Scope):**
  - Análisis de diagramas de arquitectura (UML, esquemas DB) contrastados con el código.
  - Depuración visual (lectura de capturas de pantalla de la terminal o errores OOM).
  - Mantenimiento de estado en sesiones largas usando "Firmas de Pensamiento".
- **Límites:** Depende estrictamente del análisis visual/arquitectónico. Si la tarea es puramente algorítmica de texto plano sin contexto del sistema, delegar a Codex o Anthropic.

## 2. Protocolo de Enrutamiento y Delegación (Handoff)

Si un requerimiento de desarrollo abarca múltiples dominios, los agentes deben seguir esta cascada de delegación:

1. **Diseño Inicial / Visual:** Si el requerimiento incluye diagramas o screenshots, iniciar con `@vertex-engine` para procesar la imagen y generar el esquema base.
2. **Desarrollo Core:** Una vez definida la arquitectura, delegar la generación del código de la lógica de negocio a `@anthropic-orchestrator` para procesar el contexto de los múltiples archivos.
3. **Depuración de Micro-componentes:** Si una función específica falla en la ejecución o los tests, delegar la traza de error directamente a `@codex-runtime` para su optimización quirúrgica.

## 3. Reglas Universales del Repositorio
- **Intervención Humana:** Ningún agente está autorizado a ejecutar comandos `git push` o scripts de migración de bases de datos de producción (`DROP`, `ALTER`) sin confirmación explícita del desarrollador.
- **Única Fuente de Verdad:** Todo el código generado debe respetar las convenciones de tipado estricto y modularidad de este proyecto.