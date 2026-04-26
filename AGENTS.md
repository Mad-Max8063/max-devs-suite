# Manifiesto de Orquestación Multi-Agente (Workspace AI Router)

Este documento define la topología, responsabilidades y reglas de delegación para la flota de agentes de Inteligencia Artificial que operan en este repositorio. Ningún agente debe exceder su ámbito de responsabilidad operativo (Scope Creep).

> **Punto de entrada:** Al iniciar cualquier sesión de trabajo, activar primero la Super Skill **Suito Dev Router** (`.agent/skills/suito-dev-router/SKILL.md`). Esta skill detecta automáticamente la etapa de desarrollo y activa la combinación correcta de agentes y protocolos.

## 0. Contexto del Proyecto

- **Proyecto:** Suito Platform — ecosistema B2B2C de servicios web premium.
- **Dominio:** `suito.pro` (subdominios: `admin.*` → dashboard, `{slug}.*` → tenant).
- **Stack:** Vite MPA | React 19 + TypeScript (Turnos) | Vanilla JS (Landing, Card, Admin) | Supabase PostgreSQL 17 (Auth, Storage, RLS, Edge Functions) | Vercel Edge (deploy + middleware) | Tailwind CSS 4.2 | Mercado Pago.
- **Módulos activos:**
  - `/landing/` — Landing page (Vanilla JS)
  - `/card/` — Tarjeta virtual premium (Vanilla JS + Supabase)
  - `/turnos/` — Agenda de turnos multi-tenant (React 19 + TS + PWA)
  - `/admin/` — Dashboard de administración (Vanilla JS + Supabase)
  - `/api/og/` — Generador de imágenes OG (Vercel Edge + JSX)
  - `/supabase/` — Migraciones, Edge Functions (Deno 2), config
  - `/shared/` — Utilidades cross-módulo (supabase.js, access-resolver.js)
- **Deploy:** Vercel auto-deploy desde branch `main`.

---

## 1. Topología de Agentes

### A. Codex Runtime Engine (OpenAI)
- **ID de Invocación:** `@codex-runtime`
- **Especialidad:** Ejecución secuencial rígida y depuración de sintaxis de baja altitud.
- **Ámbito (Scope):**
  - Resolución de errores sintácticos específicos.
  - Generación de expresiones regulares complejas.
  - Refactorización de funciones aisladas (micro-optimización).
- **Límites:** No debe utilizarse para analizar arquitecturas completas ni leer dependencias a nivel de proyecto masivo.

### B. Anthropic Code Orchestrator (Claude 4.6 Opus)
- **ID de Invocación:** `@anthropic-orchestrator`
- **Especialidad:** Análisis de contexto extenso y arquitectura de sistemas.
- **Ámbito (Scope):**
  - Refactorización de módulos completos que abarcan múltiples archivos.
  - Auditoría de seguridad y detección de fugas de memoria o condiciones de carrera (Race Conditions).
  - Integración "Just-in-Time Context" navegando por el repositorio.
- **Límites:** No debe utilizarse para tareas simples de una sola línea donde la latencia sea un factor crítico.

### C. Vertex Execution Engine (Gemini 2.5 Pro)
- **ID de Invocación:** `@vertex-engine`
- **Especialidad:** Procesamiento multimodal y procesos secuenciales de múltiples etapas.
- **Ámbito (Scope):**
  - Análisis de diagramas de arquitectura (UML, esquemas DB) contrastados con el código.
  - Depuración visual (lectura de capturas de pantalla de la terminal o errores OOM).
  - Mantenimiento de estado en sesiones largas usando "Firmas de Pensamiento".
- **Límites:** Si la tarea es puramente algorítmica de texto plano sin contexto visual, delegar a Codex o Anthropic.

### D. Motor de Datos e Infraestructura (Supabase Specialist)
- **ID de Invocación:** `@supabase-infra`
- **Especialidad:** Esquemas PostgreSQL, funciones RPC, políticas RLS, Edge Functions y configuración de infraestructura.
- **Ámbito (Scope):**
  - Creación y auditoría de funciones RPC (`SECURITY DEFINER`, `search_path` hardening).
  - Diseño y validación de políticas RLS (tablas `businesses`, `appointments`, `super_admins`).
  - Migraciones SQL idempotentes (`CREATE OR REPLACE`, `IF NOT EXISTS`).
  - Edge Functions en Deno 2 (Mercado Pago checkout, webhooks).
  - Configuración de Vercel: `middleware.ts`, `vercel.json`, subdomain routing.
  - Service Workers y estrategias de cache (`sw.js`, `sw-admin.js`).
- **Límites:** No modifica lógica de UI/frontend. Si el cambio cruza DB + frontend, delega la parte UI a `@anthropic-orchestrator`.

---

## 1.5. Mapa de Propiedad por Módulo

| Módulo / Directorio | Agente Primario | Agente Secundario |
|---|---|---|
| `/turnos/**` (React+TS) | `@anthropic-orchestrator` | `@vertex-engine` (visual) |
| `/card/**` (Vanilla JS) | `@anthropic-orchestrator` | `@codex-runtime` (micro-fix) |
| `/admin/**` (Vanilla JS) | `@anthropic-orchestrator` | `@codex-runtime` (micro-fix) |
| `/landing/**` (Vanilla JS) | `@codex-runtime` | `@vertex-engine` (visual) |
| `/api/og/**`, `/src/lib/**` | `@anthropic-orchestrator` | `@supabase-infra` |
| `/middleware.ts` | `@supabase-infra` | `@anthropic-orchestrator` |
| `/supabase/**`, `*.sql` (raíz) | `@supabase-infra` | — |
| `/shared/**` | `@anthropic-orchestrator` | `@supabase-infra` |
| `sw*.js` (Service Workers) | `@supabase-infra` | — |
| `.agent/`, `.session/` | `@vertex-engine` | — |

El agente **primario** lidera; el **secundario** revisa o asiste cuando el cambio cruza dominios.

---

## 2. Protocolo de Enrutamiento y Delegación (Handoff)

### Cascada 1 — Diseño Visual → Desarrollo → Depuración
1. Si el requerimiento incluye diagramas o screenshots → `@vertex-engine` procesa la imagen y genera el esquema base.
2. Desarrollo de lógica de negocio multi-archivo → `@anthropic-orchestrator`.
3. Si una función específica falla → `@codex-runtime` para optimización quirúrgica.

### Cascada 2 — Cambios de Base de Datos
1. Diseño de esquema, RPC o RLS → `@supabase-infra`.
2. Si el cambio afecta tipos TypeScript o interfaces React → delegar a `@anthropic-orchestrator`.
3. Error de sintaxis SQL aislado → `@codex-runtime`.

### Cascada 3 — Problemas de Deploy / Cache
1. Diagnóstico de middleware, Service Workers, config Vercel → `@supabase-infra`.
2. Si involucra build de Vite o configuración de assets → `@anthropic-orchestrator`.
3. Verificación visual del resultado → `@vertex-engine`.

### Cascada 4 — Flujo de Pagos (Mercado Pago)
1. Edge Functions y webhooks → `@supabase-infra`.
2. Lógica de negocio (pricing, access-resolver) → `@anthropic-orchestrator`.
3. UI de checkout / subscription banners → `@anthropic-orchestrator` o `@codex-runtime`.

### Cascada 5 — Metadata Social / OG
1. Middleware bot detection + HTML de metatags → `@anthropic-orchestrator`.
2. Data fetch desde Supabase → `@supabase-infra`.
3. Verificación visual de previsualización → `@vertex-engine`.

---

## 2.5. Protocolo de Resolución de Conflictos

Cuando dos agentes proponen soluciones contradictorias:

1. **Prioridad por Dominio:** El agente primario del módulo (ver Mapa 1.5) tiene la última palabra sobre su ámbito.
2. **Regla de Producción:** Si una solución ya funciona en producción y la otra es teórica, la solución probada gana.
3. **Regla de Simplicidad:** Entre dos soluciones equivalentes, prevalece la de menor complejidad de mantenimiento.
4. **Escalación Humana:** Si no se resuelve con las reglas anteriores, documentar ambas opciones con pros/contras y presentar al desarrollador.

---

## 2.7. Protocolo de Contexto Compartido

### Inicio de Sesión
Todo agente **DEBE** leer `.session/latest_summary.md` antes de comenzar cualquier tarea. Contiene: objetivo previo, lo realizado, problemas pendientes, decisiones técnicas, e IDs de referencia.

### Fin de Sesión
El agente que cierre la sesión **DEBE** actualizar `.session/latest_summary.md` con: fecha, lo hecho, problemas encontrados, pendientes, y decisiones técnicas.

### Skills Reutilizables
Consultar `.agent/skills/` antes de inventar una solución nueva. Skills disponibles:
- **`suito-dev-router/SKILL.md`** — Super Skill de orquestación. Punto de entrada obligatorio para toda sesión. Detecta la etapa de desarrollo y activa agentes + protocolos automáticamente.
- **`claude-model-switcher/SKILL.md`** — Protocolo de alternancia entre modelos Claude (Opus/Sonnet/Haiku). Define qué modelo usar según etapa y tipo de tarea.
- **`agent-deployment-planner/SKILL.md`** - Skill de pre-ejecucion. Analiza planes de implementacion y genera manifiesto de despliegue de subagentes.
- `ai-product-lab/SKILL.md` (en `/card/.agent/skills/`) — Framework de creación de productos digitales (fases 0-10).
- `hostinger-nuclear-cache-busting/SKILL.md` — Referencia histórica de invalidación de cache CDN (legacy, reemplazado por Vercel).

### Logs de Desarrollo
Los archivos `.agent/vite-*.log` contienen salida de procesos de desarrollo. Consultarlos antes de diagnosticar errores de build.

---

## 3. Reglas Universales del Repositorio

### Intervención Humana
Ningún agente está autorizado a ejecutar `git push` ni scripts de migración destructivos (`DROP`, `ALTER`) sin confirmación explícita del desarrollador.

### Única Fuente de Verdad
Todo el código generado debe respetar las convenciones de tipado estricto y modularidad de este proyecto.

### Seguridad Supabase
- **Nunca** exponer `SUPABASE_SERVICE_ROLE_KEY` en código frontend. Solo se usa en Edge Functions (Deno).
- Todo RPC con `SECURITY DEFINER` debe incluir `SET search_path = public, pg_temp`.
- Cambios de RLS deben verificarse contra los patrones existentes en `/supabase/migrations/`.
- Migraciones SQL deben ser idempotentes: `CREATE OR REPLACE`, `DROP IF EXISTS`, `ADD COLUMN IF NOT EXISTS`.
- Patrón de auth en RPCs: verificar `auth.uid() IS NOT NULL` al inicio de cada función.
- Variables de entorno frontend: solo prefijo `VITE_`. El archivo `.env.local` nunca se sube al repositorio.

---

## 4. Protocolo de Verificación

### Tests Automatizados
- Módulo Turnos: `tsc --noEmit` + `vitest` obligatorios antes de cerrar cualquier cambio en `/turnos/**`.

### Verificación Manual por Tipo de Cambio

| Tipo de cambio | Método de verificación |
|---|---|
| Metadata OG / Social | Compartir URL en WhatsApp y verificar preview |
| Cambios visuales | Captura en mobile (375px) y desktop |
| RLS / Permisos | Probar con usuario anónimo Y autenticado |
| Service Worker / Cache | Hard refresh + DevTools → Application |
| Subdomain routing | Probar con `admin.suito.pro` y slug de tenant |
| Edge Functions | Verificar logs en Vercel Dashboard |

---

## 5. Protocolo de Escalación

Cuando un agente no puede resolver un problema en **2 intentos**:

1. **Documentar:** Registrar en `.session/latest_summary.md` el problema, lo intentado, y por qué falló.
2. **Delegar:** Si otro agente tiene mejor especialización (ver Mapa 1.5), transferir con este formato:

```
HANDOFF: @agente-destino
PROBLEMA: [descripción en 1 línea]
INTENTOS: [qué se probó]
ARCHIVOS: [rutas relevantes]
HIPÓTESIS: [qué podría funcionar]
```

3. **Pausar:** Si ningún agente puede resolver, marcar como "Pendiente" con prioridad y continuar con la siguiente tarea. No bloquear la sesión en un solo problema.
