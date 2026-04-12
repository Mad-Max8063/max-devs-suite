---
description: Activa el Antigravity Creation Engine para analizar una idea de producto, simular su diseño, diseñar un MVP, o planificar crecimiento.
---

# Antigravity Creation Engine

## Pasos

1. Lee la skill completa del Antigravity Creation Engine:
   - Archivo: `.agent/skills/ai-product-lab/SKILL.md`

2. Ejecuta el framework completo según las instrucciones de la skill:
   - **Fase -2**: Detecta el modo del proyecto (Incubadora / Construcción / Crecimiento)
   - **Fase -1**: Detecta la fase del proyecto (0–10)
   - Ejecuta desde la fase detectada hacia adelante sin repetir fases ya resueltas

3. Si el usuario no ha proporcionado una idea todavía, pregúntale:
   - "¿Cuál es tu idea de producto o problema que querés resolver?"

4. Genera el análisis correspondiente siguiendo la estructura del SKILL.md:
   - Modo detectado
   - Fase detectada
   - Análisis de la fase actual (incluyendo **Simulation Lab** si aplica)
   - Idea Gravity Score
   - Siguientes pasos recomendados

5. **Simulation Lab (Fase 3.5)** — Antes de definir la arquitectura:
   - Modela el sistema conceptualmente (componentes, flujos, dependencias)
   - Genera escenarios de prueba (happy path, errores, concurrencia, escala)
   - Ejecuta el detector de fallos (estados imposibles, cuellos de botella, race conditions)
   - Si el resultado es 🔴 FAIL, rediseña antes de avanzar a arquitectura

6. Utiliza herramientas externas cuando sea necesario:
   - **NotebookLM** para investigación profunda de mercado y documentación
   - **Web Search** para investigación de competidores y tendencias
   - **Stitch** para prototipos visuales de UI
   - **Image Generation** para mockups y diagramas

7. Mantén la **Project Memory** actualizada durante toda la conversación.
