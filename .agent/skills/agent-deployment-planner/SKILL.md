---
name: Agent Deployment Planner
description: "Skill de pre-ejecucion. Antes de implementar cualquier plan, analiza el alcance, clasifica tareas, calcula paralelismo y genera un manifiesto de despliegue de subagentes con tareas asignadas."
---

# AGENT DEPLOYMENT PLANNER - Manifiesto de Despliegue Pre-Ejecucion

> *"Antes de mover una pieza, mapea el tablero."*

Esta skill se ejecuta **antes de toda implementacion**. Dado un plan, produce un manifiesto que define cuantos subagentes se necesitan, que tarea lleva cada uno, y en que orden se ejecutan.

---

## CUANDO ACTIVAR ESTA SKILL

- El Suito Dev Router detecta etapa 3 (Frontend), 4 (Backend) o 5 (Integracion)
- El plan de trabajo tiene **mas de 3 archivos** a crear o modificar
- El cambio cruza **2 o mas modulos** (ej: turnos + card + shared)
- Se va a hacer un refactoring o feature que involucra multiples componentes

> Si el plan tiene <= 3 archivos en un solo modulo, ejecutar directamente sin esta skill.

---

## PASO 1 - ANALISIS DE ALCANCE

Revisar el plan de implementacion y completar:

```
ALCANCE:
- Archivos a crear: [N]
- Archivos a modificar: [N]
- Modulos afectados: [lista: turnos, card, shared, supabase, admin, landing, api]
- Dependencias bloqueantes: [SI/NO]
  - Si SI: [que bloquea que - ej: "shared/colorUtils.ts debe existir antes de que card/css/styles.css lo importe"]
- Acciones externas requeridas: [SI/NO]
  - Si SI: [que - ej: "ejecutar SQL en Supabase Dashboard"]
```

---

## PASO 2 - CLASIFICACION DE TAREAS

Cada tarea del plan se clasifica:

| Tipo | Descripcion | Agente ideal (ver AGENTS.md 1.5) | Modelo (ver Model Switcher) |
|------|-------------|----------------------------------|---------------------------|
| `css-tokens` | Design tokens, variables CSS, animaciones | `@codex-runtime` | Haiku |
| `shared-util` | Utilidades compartidas (TS/JS puro) | `@codex-runtime` | Haiku/Sonnet |
| `react-component` | Componente React nuevo | `@anthropic-orchestrator` | Sonnet |
| `react-refactor` | Refactorizar componente existente (5+ cambios) | `@anthropic-orchestrator` | Sonnet/Opus |
| `vanilla-js-mod` | Modificar JS en Card/Admin/Landing | `@codex-runtime` o `@anthropic-orchestrator` | Sonnet |
| `css-migration` | Migrar CSS hardcodeado a variables | `@codex-runtime` | Haiku |
| `sql-migration` | Crear archivo .sql de migracion | `@supabase-infra` | Sonnet |
| `integration` | Conectar modulos, probar flujos cruzados | `@anthropic-orchestrator` | Opus |
| `visual-verify` | Verificacion visual (screenshots, responsive) | `@vertex-engine` | - |

---

## PASO 3 - CALCULO DE PARALELISMO

### Reglas

1. **Tareas sin dependencias entre si** -> pueden correr en paralelo (subagentes simultaneos)
2. **Tareas que escriben el mismo archivo** -> secuenciales (mismo agente)
3. **Tareas en `shared/`** van primero (otros modulos dependen de ellas)
4. **Maximo 3 subagentes en paralelo** (limite practico de Claude Code Agent tool)
5. **Cada subagente debe tener contexto autocontenido** en su prompt (no conoce la conversacion)

### Formula de Decision

```
SI archivos_a_modificar <= 3 Y un_solo_modulo:
    -> Ejecucion directa (0 subagentes)
    -> Modelo: segun tipo de tarea dominante

SI archivos_a_modificar <= 6 Y 2 modulos independientes:
    -> 2 subagentes (uno por modulo)
    -> Enviar en un solo mensaje (paralelo)

SI archivos_a_modificar > 6 Y 3+ modulos:
    -> 3 subagentes (maximo)
    -> Agrupar tareas por modulo/dependencia
    -> Fase 1: shared (bloqueante) -> Fase 2: modulos en paralelo

SI hay dependencias secuenciales fuertes:
    -> Reducir subagentes, aumentar tareas por agente
    -> Mejor 1 agente con 5 tareas secuenciales que 3 agentes esperandose
```

### Patron de Ejecucion por Fases

```
FASE 0 (si aplica): Prerrequisitos bloqueantes
  -> Acciones externas (SQL en Supabase, instalar deps)
  -> Crear archivos shared/ que otros necesitan

FASE 1: Subagentes en paralelo (max 3)
  -> Cada uno trabaja en su modulo/grupo de archivos
  -> Sin dependencias cruzadas entre ellos

FASE 2: Integracion (si aplica)
  -> Conectar lo que produjeron las fases anteriores
  -> Verificacion de tipos (tsc --noEmit)
  -> Build completo (npm run build)

FASE 3: Verificacion
  -> Acciones que requieren browser/interaccion humana
```

---

## PASO 4 - MANIFIESTO DE DESPLIEGUE

Formato de salida:

```
========================================
AGENT DEPLOYMENT PLANNER - Manifiesto
Plan: [nombre del plan]
Fecha: [YYYY-MM-DD]
Total archivos: [N crear + M modificar]
Modulos: [lista]
Subagentes: [N]
========================================

DEPENDENCIAS BLOQUEANTES:
- [descripcion o "Ninguna"]

ACCIONES EXTERNAS REQUERIDAS:
- [descripcion o "Ninguna"]

----------------------------------------
FASE 0 - PRERREQUISITOS (si aplica)
----------------------------------------
[Accion manual o archivo bloqueante]

----------------------------------------
FASE 1 - EJECUCION PARALELA
----------------------------------------

SUBAGENTE 1: [nombre descriptivo]
  Tipo: general-purpose
  Modelo: [Opus/Sonnet/Haiku]
  Archivos:
    - [ruta] (crear/modificar)
    - [ruta] (crear/modificar)
  Tarea: [descripcion en 2-3 lineas, autocontenida]
  Dependencias: Ninguna

SUBAGENTE 2: [nombre descriptivo]
  Tipo: general-purpose
  Modelo: [Opus/Sonnet/Haiku]
  Archivos:
    - [ruta] (crear/modificar)
  Tarea: [descripcion]
  Dependencias: Ninguna

----------------------------------------
FASE 2 - INTEGRACION (si aplica)
----------------------------------------
  Tarea: [que conectar/verificar]
  Verificacion: tsc --noEmit + npm run build

----------------------------------------
VERIFICACION POST-EJECUCION
----------------------------------------
- [ ] [check 1 - ej: "tsc --noEmit sin errores"]
- [ ] [check 2 - ej: "npm run build exitoso"]
- [ ] [check 3 - ej: "verificar en browser: card publica muestra color dinamico"]
========================================
```

---

## EJEMPLO: Aplicado al Plan de Unificacion Turnos + Card

```
========================================
AGENT DEPLOYMENT PLANNER - Manifiesto
Plan: Unificacion Estetica Turnos + Card
Fecha: 2026-04-26
Total archivos: 4 crear + 10 modificar
Modulos: shared, turnos, card, supabase
Subagentes: 3
========================================

DEPENDENCIAS BLOQUEANTES:
- shared/design-tokens.css y shared/colorUtils.ts deben existir antes de modificar card/css/styles.css y turnos/index.css

ACCIONES EXTERNAS:
- Ejecutar SQL migracion whatsapp_message en Supabase Dashboard

FASE 0 - PRERREQUISITOS
- Crear shared/design-tokens.css, shared/animations.css, shared/colorUtils.ts, shared/imageUtils.ts

FASE 1 - PARALELA (3 subagentes)

SUBAGENTE 1: "Turnos UI Upgrade"
  Modelo: Sonnet
  Archivos: turnos/hooks/useDebounceSave.ts (crear), turnos/components/GalleryLightbox.tsx (crear), turnos/components/SocialIconsBar.tsx (crear), turnos/pages/VirtualCardConfigPage.tsx (refactorizar)
  Tarea: Crear hook de autosave con debounce. Crear lightbox de galeria con prev/next. Crear barra de iconos sociales. Refactorizar VirtualCardConfigPage: estado draft, layout doble columna, integrar lightbox y social bar.

SUBAGENTE 2: "Card Theme Migration"
  Modelo: Sonnet
  Archivos: card/css/styles.css (modificar), card/js/engine.js (modificar), card/js/editor.js (modificar)
  Tarea: Migrar card/css/styles.css de colores hardcodeados (#D4AF37) a CSS variables (var(--color-primary)). En engine.js, al cargar perfil, inyectar ColorPrimario en :root. En editor.js, agregar color picker con 8 presets.

SUBAGENTE 3: "Shared Utils + vCard"
  Modelo: Haiku
  Archivos: shared/vcard.ts (crear desde card/js/vcard.js), turnos/hooks/useTheme.ts (modificar), turnos/index.css (modificar), card/js/config.js (modificar)
  Tarea: Portar vcard.js a TypeScript tipado en shared/. Extraer darkenHex() de useTheme a shared/colorUtils.ts. Actualizar imports en turnos/index.css y card/css para usar tokens compartidos.

FASE 2 - INTEGRACION
  Verificar: tsc --noEmit + npm run build

VERIFICACION:
- [ ] tsc --noEmit sin errores
- [ ] npm run build exitoso
- [ ] Card publica muestra ColorPrimario del negocio (no siempre dorado)
- [ ] Lightbox abre/cierra correctamente en identidad
- [ ] Autosave funciona (editar, esperar 3s, verificar guardado)
========================================
```

---

## INTEGRACION CON OTRAS SKILLS

Al crear esta skill, actualizar:

### En `suito-dev-router/SKILL.md`:
Agregar despues de PASO 1 (Deteccion de Etapa), antes de PASO 2:

```
> **PASO 1.5 - DEPLOYMENT PLANNER (si aplica)**
> Si la etapa detectada es 3 (Frontend), 4 (Backend) o 5 (Integracion) Y el plan tiene mas de 3 archivos, activar `agent-deployment-planner/SKILL.md` para generar el manifiesto de subagentes antes de ejecutar.
```

### En `AGENTS.md` seccion 2.7 (Skills Reutilizables):
Agregar:

```
- **`agent-deployment-planner/SKILL.md`** - Skill de pre-ejecucion. Analiza planes de implementacion y genera manifiesto de despliegue de subagentes.
```
