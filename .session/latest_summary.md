# Resumen de Sesión — Suito Platform
**Fecha:** 2026-04-07 01:20 local
**Proyecto:** [Mad-Max8063/max-devs-suite](https://github.com/Mad-Max8063/max-devs-suite)

---

## 🎯 Objetivo de la sesión
Completar el hardening del Admin Panel migrando el CRM local a Supabase, y diagnosticar y solucionar el cuello de botella persistente de despliegue en Hostinger, incluyendo errores 404 y rutas relativas en aplicaciones embebidas.

---

## ✅ Lo que se hizo
1. **Migración CRM a Supabase:** Se eliminó el uso de `localStorage` en `admin-panel/clients.js` reescribiendo la lógica con sentencias asíncronas de Supabase sobre la tabla `admin_clients`.
2. **Corrección de Bugs Visuales (Naming Convention):** Identificamos una discrepancia entre `camelCase` (frontend) y `snake_case` (DB). Se actualizó `app.js` para usar `is_premium`, `free_until`, `card_id`, etc.
3. **Módulo de Autenticación Central:** Extraído del `index.html` y colocado en `auth.js` de Admin Panel.
4. **Desbloqueo de Github Actions -> Hostinger:**
   - La ruta en `.github/workflows/deploy-production.yml` estaba apuntando a `public_html/`, desplegando directo en la raíz de toda la cuenta. Lo volvimos a redirigir al Addon Domain: `domains/suito.pro/public_html/`.
5. **Solución a SPA Routing y Strict MIME Type ("text/html"):**
   - Se añadió `<base href="/card/">` al `tarjeta-virtual/index.html` para resolver referencias relativas como `js/app.js` ante URL variables como `/card/suito`.
   - Se actualizó `base: '/turnos/'` en `gestor-de-turnos/vite.config.ts`.
   - Se aplicó la misma redirección `.htaccess` para `/card/` que la que existía para `/turnos/`.

---

## ❌ Problemas encontrados
- **Hostinger "Enjaulado" o Ruta Errónea:** GitHub Action reportaba "Success", pero los assets en `suito.pro` seguían apuntando al branding antiguo ("Max Devs"). Se debía a que al eliminar `domains/suito.pro/` en el `server-dir`, FTP guardaba el output en el domain pointer root y no en el addon domain real.
- **Rutas variables destruyen Assets SPA:** Cargar `suito.pro/card/suito` forzaba solicitudes relativas `/card/suito/js/app.js`. El RewriteRule servía HTML para ese path, induciendo el error `MIME type of text/html` en los logs del navegador.

---

## 📋 Pendiente (para la próxima sesión)

### Prioridad 1 — Verificación en Vivo
1. Validar si los últimos despliegues llegaron bien a `/admin/` (verificar persistencia en login).
2. Validar que la SPA de Tarjetas corre estable al hacer `F5` sobre `suito.pro/card/suito`.
3. Validar `suito.pro/turnos/` (y subrutas).

### Prioridad 2 — Rebrand & QA Restante
1. Testear creación de cliente real a través del Supabase en producción para el Admin Dashboard.
2. Confirmar propagación en Cloudflare/DNS si hay cambios (en principio solo limpieza de caché de navegador).

---

## 🔑 IDs y Referencias Importantes
- **Repositorio:** `Mad-Max8063/max-devs-suite`
- **Carpeta Local Activa:** `c:\Users\domin\.gemini\antigravity\scratch\MiSuite`
- **Supabase Project:** `bfsttdiokdqyvwjuvcbp`
- **Commit Desbloqueo Github Actions:** `53d8830`
- **Commit Solución SPA (text/html issue):** `cf253ef`

---

## 💡 Decisiones técnicas tomadas
- **Usar Base Tag sobre Vite Plugin en Cards:** Como `tarjeta-virtual` no usaba Bundler (solo HTML plano y JS module), la mejor y más elegante solución técnica era inyectar un HTML Base Tag (`<base href="/card/">`) en lugar de refactorizar todo el javascript local para detectar subrutas o migrarlo a Vite. 
- **Mantener `dangerous-clean-slate`:** Ahora que el directorio apunta correctamente a `domains/suito.pro/public_html`, la limpieza del directorio Hostinger funciona a favor nuestro previniendo archivos zombi.
