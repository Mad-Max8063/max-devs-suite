---
name: Suito Dev Router
description: "Super Skill de orquestacion automatica. Detecta la etapa de desarrollo actual del proyecto Suito y activa la combinacion correcta de agentes, protocolos y skills segun el contexto. Punto de entrada obligatorio para toda sesion de trabajo."
---

# SUITO DEV ROUTER — Super Skill de Orquestacion

> *"No elegis la herramienta. La herramienta se elige sola."*

Esta skill es el **punto de entrada** de toda sesion de desarrollo. Detecta automaticamente en que etapa del ciclo de desarrollo se encuentra el proyecto y activa la combinacion correcta de agentes (`AGENTS.md`), modelos (`claude-model-switcher/SKILL.md`), protocolos y skills especializadas.

---

## PASO 0 — CARGA DE CONTEXTO (Obligatorio)

Antes de cualquier accion, ejecutar este checklist de arranque:

```
[ ] 1. Leer .session/latest_summary.md
[ ] 2. Leer AGENTS.md (topologia + mapa de propiedad)
[ ] 3. Revisar git status (cambios pendientes, branch actual)
[ ] 4. Revisar git log --oneline -5 (ultimos commits)
[ ] 5. Verificar si hay errores de build (revisar .agent/vite-*.log si existen)
```

**Resultado esperado:** un snapshot mental del estado actual del proyecto.

---

## PASO 1 — DETECCION DE ETAPA

Analizar el contexto del usuario (mensaje, archivos seleccionados, estado del repo) y clasificar en **una** de estas etapas:

| # | Etapa | Senales de Deteccion |
|---|-------|---------------------|
| 1 | **Planificacion** | El usuario habla de features nuevas, ideas, "quiero agregar...", no hay codigo involucrado aun |
| 2 | **Esquema / DB** | Se mencionan tablas, columnas, RPCs, RLS, migraciones, Supabase, SQL |
| 3 | **Desarrollo Frontend** | Se trabaja en componentes React, HTML, CSS, JS de modulos UI (card, turnos, admin, landing) |
| 4 | **Desarrollo Backend** | Edge Functions, middleware, API routes, webhooks, logica server-side |
| 5 | **Integracion** | Conectar frontend con backend, probar flujos completos, armar rutas entre modulos |
| 6 | **Testing / QA** | Verificar cambios, probar en browser, compartir links, validar OG, revisar RLS |
| 7 | **Deploy / Release** | Build, push, verificar en produccion, cache busting, Vercel dashboard |
| 8 | **Hotfix** | Bug en produccion, "se rompio", "no funciona", error urgente |
| 9 | **Mantenimiento** | Refactoring, limpieza, actualizacion de dependencias, documentacion, optimizacion |

**Formato de deteccion:**

```
========================================
SUITO DEV ROUTER — Sesion Iniciada
Fecha: [YYYY-MM-DD]
Etapa detectada: [#] [Nombre]
Modelo recomendado: [Opus / Sonnet / Haiku] (ver claude-model-switcher)
Confianza: Alta / Media / Baja
Contexto: [1 linea explicando por que esta etapa]
========================================
```

> Si la confianza es **Baja**, preguntar al usuario antes de continuar.

---

> **PASO 1.5 - DEPLOYMENT PLANNER (si aplica)**
> Si la etapa detectada es 3 (Frontend), 4 (Backend) o 5 (Integracion) Y el plan tiene mas de 3 archivos, activar `agent-deployment-planner/SKILL.md` para generar el manifiesto de subagentes antes de ejecutar.

---

## PASO 2 — ACTIVACION DE STACK POR ETAPA

Cada etapa activa una combinacion especifica de agentes, protocolos y verificaciones.

---

### ETAPA 1: Planificacion

**Agente lider:** `@anthropic-orchestrator`
**Skill activada:** `ai-product-lab` (si es feature nueva desde cero)

**Protocolo:**
1. Evaluar impacto en modulos existentes (ver Mapa de Propiedad en AGENTS.md 1.5).
2. Si toca DB: documentar cambios de esquema necesarios ANTES de codificar.
3. Si toca multiples modulos: crear plan de ejecucion con orden de dependencias.
4. Resultado: plan escrito con archivos a tocar y agente responsable por cada uno.

**Verificacion de salida:** El plan debe responder: Que se hace, donde se hace, en que orden, y quien lo hace.

---

### ETAPA 2: Esquema / DB

**Agente lider:** `@supabase-infra`
**Agente soporte:** `@anthropic-orchestrator` (si afecta tipos TS)

**Protocolo:**
1. Verificar esquema actual: `SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'X'`.
2. Escribir migracion **idempotente** siguiendo el patron de `20260425_rpcs_consolidated.sql`:
   - `ADD COLUMN IF NOT EXISTS` para columnas.
   - `CREATE OR REPLACE FUNCTION` para RPCs.
   - `DROP FUNCTION IF EXISTS` antes de recrear con nueva firma.
3. Todo RPC con `SECURITY DEFINER` debe incluir `SET search_path = public, pg_temp`.
4. Verificar `auth.uid() IS NOT NULL` al inicio de funciones autenticadas.
5. `REVOKE ALL FROM PUBLIC` + `GRANT EXECUTE TO authenticated` (o `anon` si es publico).
6. Si cambia la firma de un RPC, actualizar la llamada en el frontend correspondiente.

**Checklist de seguridad:**
```
[ ] SECURITY DEFINER con search_path hardening
[ ] auth.uid() verificado
[ ] REVOKE/GRANT correctos
[ ] Migracion idempotente (puede correrse 2 veces sin error)
[ ] No se expone SUPABASE_SERVICE_ROLE_KEY en frontend
```

**Verificacion de salida:** Ejecutar la query de verificacion del final de `20260425_rpcs_consolidated.sql` para confirmar que las funciones existen.

---

### ETAPA 3: Desarrollo Frontend

**Agente lider:** `@anthropic-orchestrator` (multi-archivo) o `@codex-runtime` (funcion aislada)
**Agente soporte:** `@vertex-engine` (si hay componente visual)

**Protocolo por modulo:**

| Modulo | Stack | Dev Server | Notas |
|--------|-------|-----------|-------|
| `/turnos/` | React 19 + TS | `npm run dev` (port 3000) | TypeScript estricto, `tsc --noEmit` obligatorio |
| `/card/` | Vanilla JS | Vite root (port 5173) | Usa `engine-v2029.js` + `client-panel.js` |
| `/admin/` | Vanilla JS | Vite root (port 5173) | Service Worker propio (`sw-admin.js`) |
| `/landing/` | Vanilla JS | Vite root (port 5173) | Pricing cargado desde Supabase con fallback a config.js |

**Reglas:**
- Si el cambio toca un Service Worker: seguir protocolo de Etapa 7 (Deploy) despues.
- Si el cambio usa datos de Supabase: verificar que la query funcione con RLS activo para el rol correcto.
- Variables de entorno: solo `VITE_` en frontend. Si necesitas una key secreta, va en Edge Function.

**Verificacion de salida:** Abrir en browser, probar happy path + edge case principal.

---

### ETAPA 4: Desarrollo Backend

**Agente lider:** `@supabase-infra`
**Agente soporte:** `@anthropic-orchestrator` (logica de negocio compleja)

**Protocolo:**
1. **Edge Functions (Deno 2):** Ubicar en `/supabase/functions/[nombre]/index.ts`.
   - Usar `SUPABASE_SERVICE_ROLE_KEY` solo server-side.
   - Manejar errores con HTTP status codes (no excepciones silenciosas).
2. **Middleware (`middleware.ts`):** Cambios aqui afectan TODAS las rutas.
   - Probar con user-agent de bot (WhatsApp, Facebook) Y browser normal.
   - Verificar que subdomain routing sigue funcionando.
3. **API routes (`/api/og/`):** Edge runtime de Vercel.
   - Si toca OG images: probar con WhatsApp sharing.

**Verificacion de salida:** Probar endpoint con curl o browser. Verificar logs en Vercel Dashboard si es edge function.

---

### ETAPA 5: Integracion

**Agente lider:** `@anthropic-orchestrator`
**Agentes soporte:** `@supabase-infra` (datos) + `@vertex-engine` (visual)

**Protocolo:**
1. Verificar que el frontend llama al RPC/endpoint correcto con los parametros correctos.
2. Probar el flujo completo: UI → API/RPC → DB → respuesta → UI actualizada.
3. Verificar con usuario autenticado Y anonimo si aplica RLS.
4. Si involucra routing entre modulos: probar navegacion `/card/slug` → `/turnos/slug` → `/admin/`.

**Verificacion de salida:** El flujo completo funciona sin errores en consola.

---

### ETAPA 6: Testing / QA

**Agente lider:** `@vertex-engine` (verificacion visual) o `@anthropic-orchestrator` (tests automatizados)

**Protocolo por tipo de cambio:**

| Cambio | Verificacion |
|--------|-------------|
| Metadata OG / Social | Compartir URL en WhatsApp, verificar titulo + imagen + descripcion |
| Cambios visuales | Screenshot mobile (375px) + desktop (1280px) |
| RLS / Permisos | Login como usuario normal + probar sin login |
| Service Worker / Cache | Hard refresh (Ctrl+Shift+R) + DevTools → Application → Service Workers |
| Subdomain routing | Probar `admin.suito.pro` + `{slug}.suito.pro` + `www.suito.pro` |
| Edge Functions | Vercel Dashboard → Functions → Logs |
| Turnos (React) | `tsc --noEmit` + `npx vitest run` |

**Formato de reporte:**
```
QA: [que se verifico]
Metodo: [como]
Resultado: OK / FALLO [detalle]
```

---

### ETAPA 7: Deploy / Release

**Agente lider:** `@supabase-infra`
**Agente soporte:** `@anthropic-orchestrator` (build issues)

**Protocolo:**
1. **Pre-deploy:**
   - `git status` — verificar que no hay archivos sensibles (.env.local, credentials).
   - Si hay migraciones SQL nuevas: ejecutar en Supabase SQL Editor ANTES del deploy.
   - Si hay cambios en Edge Functions: deploy via `supabase functions deploy [nombre]`.
2. **Deploy:**
   - Vercel auto-deploya desde `main`. Solo hacer `git push` con confirmacion humana.
   - Si se necesita cache busting extremo: aplicar versionado de HTML (ver skill `hostinger-nuclear-cache-busting` como referencia historica, adaptar para Vercel).
3. **Post-deploy:**
   - Verificar en `https://www.suito.pro` que la version nueva esta activa.
   - Si hay Service Workers: pueden servir cache viejo. Verificar que `sw.js` / `sw-admin.js` manejen actualizacion correctamente.
   - Probar OG sharing si se tocaron metatags.

**Verificacion de salida:** Sitio en produccion muestra la version correcta. No hay errores 500 en Vercel Dashboard.

---

### ETAPA 8: Hotfix

**Agente lider:** Determinado por el modulo afectado (ver Mapa 1.5 en AGENTS.md).

**Protocolo de emergencia:**
1. **Diagnostico rapido (< 2 min):**
   - Leer `.session/latest_summary.md` para contexto reciente.
   - `git log --oneline -3` para ver ultimos cambios.
   - Revisar consola del browser / Vercel logs segun donde falla.
2. **Fix:**
   - Aplicar la correccion minima necesaria. No refactorizar, no mejorar, no limpiar.
   - Si el fix toca DB: migracion idempotente, ejecutar en SQL Editor.
3. **Verificar** que el fix funciona Y que no rompio nada adyacente.
4. **Documentar** en `.session/latest_summary.md` que paso y que se hizo.

> REGLA DE ORO: En un hotfix, la unica prioridad es restaurar el servicio. Todo lo demas espera.

---

### ETAPA 9: Mantenimiento

**Agente lider:** `@anthropic-orchestrator`
**Agente soporte:** `@codex-runtime` (micro-optimizaciones)

**Protocolo:**
1. **Refactoring:** Solo si mejora legibilidad o elimina duplicacion real. No refactorizar "por si acaso".
2. **Dependencias:** Verificar changelogs antes de actualizar. Breaking changes de Vite, React, Supabase o Tailwind pueden romper el build.
3. **Documentacion:** Actualizar `.session/latest_summary.md`, AGENTS.md, y skills si cambiaron protocolos.
4. **Limpieza:** Eliminar archivos muertos, imports no usados, codigo comentado. No dejar `// TODO` sin fecha.

**Verificacion de salida:** `npm run build` sin errores ni warnings nuevos.

---

## PASO 3 — TRANSICION ENTRE ETAPAS

Las etapas no son lineales. Un feature puede saltar de Planificacion (1) a Esquema (2) a Frontend (3) a Integracion (5) a QA (6) a Deploy (7). El router detecta la transicion automaticamente.

**Senales de transicion:**

| De | A | Senal |
|----|---|-------|
| Planificacion | Esquema/DB | "Necesitamos una columna nueva", "hay que crear un RPC" |
| Planificacion | Frontend | "Cambiemos el boton", "agreguemos un campo en el form" |
| Esquema/DB | Frontend | La migracion esta lista, hay que conectar la UI |
| Frontend | Integracion | "No me trae los datos", "el RPC devuelve error" |
| Cualquiera | Testing | "Probemos", "verificamos", "funciona?" |
| Testing | Deploy | "Todo OK, subamos", "pusheamos?" |
| Deploy | Hotfix | "Se rompio", "error 500", "no carga" |
| Hotfix | Mantenimiento | El fix funciono, ahora a limpiar |

**Al transicionar:** Re-ejecutar PASO 1 con el nuevo contexto. No arrastrar el stack de la etapa anterior.

---

## PASO 4 — CIERRE DE SESION

Al finalizar la sesion de trabajo:

```
========================================
SUITO DEV ROUTER — Sesion Cerrada
Fecha: [YYYY-MM-DD]
Etapa final: [#] [Nombre]
Lo hecho: [resumen en 2-3 lineas]
Pendiente: [lo que quedo por hacer]
Proxima etapa sugerida: [#] [Nombre]
========================================
```

**Actualizar** `.session/latest_summary.md` con este resumen.

---

## REFERENCIA RAPIDA — AGENTE POR ETAPA

| Etapa | Agente Lider | Skills Asociadas |
|-------|-------------|-----------------|
| 1. Planificacion | `@anthropic-orchestrator` | `ai-product-lab` (si aplica) |
| 2. Esquema/DB | `@supabase-infra` | Patron de `20260425_rpcs_consolidated.sql` |
| 3. Frontend | `@anthropic-orchestrator` / `@codex-runtime` | — |
| 4. Backend | `@supabase-infra` | — |
| 5. Integracion | `@anthropic-orchestrator` | — |
| 6. Testing/QA | `@vertex-engine` / `@anthropic-orchestrator` | Tabla de verificacion por tipo |
| 7. Deploy | `@supabase-infra` | Cache busting (si aplica) |
| 8. Hotfix | Segun modulo (Mapa 1.5) | Protocolo de emergencia |
| 9. Mantenimiento | `@anthropic-orchestrator` | — |
