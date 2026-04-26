---
name: Claude Model Switcher
description: "Protocolo de alternancia inteligente entre modelos Claude (Opus, Sonnet, Haiku). Mapea cada etapa de desarrollo y tipo de tarea al modelo optimo por relacion capacidad/costo/velocidad. Integrado con Suito Dev Router."
---

# CLAUDE MODEL SWITCHER — Protocolo de Alternancia de Modelos

> *"Opus piensa. Sonnet construye. Haiku ejecuta."*

Este protocolo define cuando y como alternar entre modelos Claude para optimizar la relacion **capacidad / costo / velocidad** segun la tarea.

---

## MODELOS DISPONIBLES

| Modelo | ID | Perfil | Velocidad | Costo | Contexto |
|--------|-----|--------|-----------|-------|----------|
| **Opus 4.6** | `claude-opus-4-6` | Razonamiento profundo, arquitectura, decisiones complejas | Lenta | Alto | 200K tokens |
| **Sonnet 4.6** | `claude-sonnet-4-6` | Desarrollo general, codigo, refactoring equilibrado | Media | Medio | 200K tokens |
| **Haiku 4.5** | `claude-haiku-4-5-20251001` | Tareas rapidas, repetitivas, bajo razonamiento | Rapida | Bajo | 200K tokens |

---

## COMO CAMBIAR DE MODELO

### Opcion 1 — Comando rapido (dentro de Claude Code)
```
/model claude-opus-4-6
/model claude-sonnet-4-6
/model claude-haiku-4-5-20251001
```

### Opcion 2 — Toggle Fast Mode (solo Opus)
```
/fast          # Alterna Opus normal <-> Opus Fast (misma capacidad, salida mas rapida)
```

### Opcion 3 — Settings global (persiste entre sesiones)
Archivo: `~/.claude/settings.json`
```json
{
  "model": "claude-opus-4-6"
}
```

### Opcion 4 — Settings por proyecto (override local)
Archivo: `MiSuite/.claude/settings.json`
```json
{
  "model": "claude-sonnet-4-6"
}
```
El modelo por proyecto sobreescribe el global. Util para fijar Sonnet en trabajo diario y reservar Opus para sesiones especificas.

---

## MATRIZ DE DECISION POR TIPO DE TAREA

### Tareas para OPUS (el estratega)

Usar cuando el **razonamiento profundo** es critico y un error de juicio cuesta mas que la latencia.

| Tarea | Por que Opus |
|-------|-------------|
| Diseño de arquitectura nueva | Necesita evaluar tradeoffs entre multiples enfoques |
| Auditoria de seguridad (RLS, RPCs, auth) | Un error de seguridad puede ser catastrofico |
| Refactoring multi-archivo (5+ archivos) | Necesita mantener coherencia entre dependencias |
| Debugging de problemas complejos (race conditions, edge runtime) | Requiere razonamiento de multiples capas |
| Planificacion de features que tocan DB + backend + frontend | Necesita vision completa del sistema |
| Revision de migraciones SQL criticas | Un `DROP` mal puesto destruye datos |
| Decisiones de dependencias / breaking changes | Evaluar changelogs, compatibilidad, impacto |

### Tareas para SONNET (el constructor)

Usar para **desarrollo activo** donde se necesita buen codigo rapido. El 80% del trabajo diario.

| Tarea | Por que Sonnet |
|-------|---------------|
| Implementar features definidas | El plan ya existe, solo hay que ejecutar |
| Escribir componentes React / paginas nuevas | Codigo UI con patron claro |
| Crear RPCs y migraciones con patron establecido | Seguir el template de `20260425_rpcs_consolidated.sql` |
| Modificar middleware, rutas, config Vercel | Cambios acotados con contexto claro |
| Escribir tests (vitest) | Seguir patrones de test existentes |
| Conectar frontend con backend (integracion) | Wiring con tipos conocidos |
| Corregir bugs de logica con traza clara | "La funcion X devuelve Y en vez de Z" |
| Documentacion tecnica | Redaccion estructurada |

### Tareas para HAIKU (el velocista)

Usar para tareas **mecanicas, repetitivas o de bajo razonamiento** donde la velocidad importa mas que la profundidad.

| Tarea | Por que Haiku |
|-------|-------------|
| Renombrar variables / refactoring cosmetico | Buscar y reemplazar inteligente |
| Agregar columnas simples (`ADD COLUMN IF NOT EXISTS`) | SQL mecanico |
| Generar regex | Pattern matching puro |
| Formatear o reestructurar JSON/SQL/HTML | Transformacion de texto |
| Consultas rapidas ("como se llama el RPC de galeria?") | Busqueda en codebase |
| Actualizar imports despues de mover un archivo | Mecanico |
| Generar datos de prueba / seeds | Repetitivo |
| Traducciones simples / copy de UI | Texto sin logica |

---

## MAPEO POR ETAPA DEL DEV ROUTER

Integracion directa con las 9 etapas de `suito-dev-router/SKILL.md`:

| Etapa | Modelo Default | Cuando subir a Opus | Cuando bajar a Haiku |
|-------|---------------|--------------------|--------------------|
| 1. Planificacion | **Opus** | — (ya es Opus) | Nunca — planificar mal sale caro |
| 2. Esquema/DB | **Sonnet** | RLS nuevo, auth complejo, migracion destructiva | `ADD COLUMN` simple, seed data |
| 3. Frontend | **Sonnet** | Refactor de 5+ archivos, cambio de state management | Cambio de CSS, copiar componente, fix typo |
| 4. Backend | **Sonnet** | Edge Function nueva, webhook con logica de pago | Ajustar response headers, agregar log |
| 5. Integracion | **Sonnet** | Flujo cross-modulo con 3+ puntos de contacto | Conectar un campo nuevo a un RPC existente |
| 6. Testing/QA | **Sonnet** | Disenar estrategia de test, analizar cobertura | Correr tests existentes, verificar output |
| 7. Deploy | **Sonnet** | Primer deploy de infra nueva, cambio de dominio | Redeploy normal, verificar logs |
| 8. Hotfix | **Opus** | — (siempre Opus en emergencias) | Nunca — no escatimar en produccion rota |
| 9. Mantenimiento | **Sonnet** | Evaluar upgrade de dependencia mayor | Limpiar imports, borrar codigo muerto |

---

## EFFORT LEVEL POR MODELO

Cada modelo rinde diferente segun el nivel de esfuerzo configurado:

| Modelo | Effort recomendado | Notas |
|--------|-------------------|-------|
| Opus | `max` | Ya es lento, que piense a fondo |
| Sonnet | `high` | Buen balance. `max` lo hace lento sin ganancia proporcional |
| Haiku | `default` | No necesita pensar mucho, que ejecute rapido |

Cambiar effort level:
```
/config
# Navegar a effortLevel
```

O directamente en settings.json:
```json
{ "effortLevel": "max" }   // Opciones: "min", "low", "default", "high", "max"
```

---

## PATRON DE SESION RECOMENDADO

Para una sesion tipica de desarrollo de un feature completo:

```
1. ARRANQUE     → Opus    — Planificar, disenar, tomar decisiones arquitectonicas
2. DESARROLLO   → Sonnet  — Implementar el plan (DB + frontend + backend)
3. INTEGRACION  → Sonnet  — Conectar todo, probar flujos
4. DEBUGGING    → Opus    — Si algo falla y no es obvio por que
5. QA/POLISH    → Sonnet  — Verificar, ajustar detalles
6. DEPLOY       → Sonnet  — Subir y verificar
```

Para una sesion de mantenimiento / limpieza:
```
1. AUDIT        → Opus    — Identificar que limpiar y priorizar
2. EJECUCION    → Haiku   — Renombrar, borrar, reformatear
3. VERIFICAR    → Sonnet  — Correr tests, verificar build
```

Para un hotfix:
```
1. DIAGNOSTICO  → Opus    — Siempre. Entender que paso.
2. FIX          → Sonnet  — Aplicar la correccion
3. VERIFICAR    → Sonnet  — Confirmar que funciona
```

---

## REGLAS DE ORO

1. **Ante la duda, usa Sonnet.** Es el modelo por defecto para el 80% del trabajo.
2. **Nunca uses Haiku para decisiones.** Solo para ejecucion mecanica.
3. **Siempre usa Opus para seguridad.** RLS, auth, tokens, permisos = Opus.
4. **Siempre usa Opus para hotfixes.** Produccion rota no es momento de ahorrar.
5. **Cambia de modelo, no de agente.** El agente lider lo define el Dev Router (etapa). El modelo lo define la complejidad de la subtarea.
