# Resumen de Sesión — Suito Platform Stabilization
**Fecha:** 2026-04-13 (02:10 ART)
**Proyecto:** [Mad-Max8063/max-devs-suite](https://github.com/Mad-Max8063/max-devs-suite)

---

## 🎯 Objetivo de la sesión
Lograr un despliegue estable en Hostinger resolviendo bloqueos de red, errores de carga de archivos estáticos (404) y conflictos de "redeclaración" de scripts en el módulo de tarjetas virtuales.

---

## ✅ Lo que se hizo
- **Migración CI/CD**: Se cambió de SSH/Rsync (bloqueado) a **FTP Estándar (Puerto 21)** con `SamKirkland/FTP-Deploy-Action`.
- **Reparación de Empaquetado**: Se actualizó el workflow para copiar manualmente las carpetas `card/js`, `shared` y scripts de `admin` a la carpeta `dist/`, solucionando los errores 404.
- **Unificación de Scripts**: Se eliminó la redeclaración de `renderCard` desactivando el listener en `card.js` y usando `app.js` como único punto de entrada en `index.html`.
- **Cache-Busting Profundo**: Se implementó una estrategia de versionado en cascada (`?v=4.9`) en todos los imports internos para forzar la actualización en el navegador.
- **Estabilización de PWA**: Se renombró el manifest a `.webmanifest` y se agregaron excepciones en `.htaccess` para evitar redirecciones SPA incorrectas.
- **Documentación**: Se creó la nueva Skill `hostinger-stabilization` para replicar estas soluciones a futuro.

---

## ❌ Problemas encontrados
- **Hostinger HCDN**: La caché del servidor y del Service Worker es extremadamente persistente, lo que requirió el versionado total de los imports JS.
- **Firewall de Hostinger**: Bloqueos constantes en puertos no estándar (65002), lo que obligó a usar FTP tradicional.

---

## 📋 Pendiente (para la próxima sesión)

### Prioridad 1 — Refactor de Estilos
1. Migrar Tailwind CDN a una compilación local en el build de Vite para eliminar warnings y mejorar velocidad.
2. Unificar los estilos de la landing con los de la tarjeta (están "confusos" actualmente).

### Prioridad 2 — Funcionalidad Supabase
1. Validar la persistencia de cambios desde el Admin Panel hacia la tarjeta virtual.
2. Implementar manejo de errores más elegante cuando la DB no responde.

---

## 🔑 IDs y Referencias Importantes
- **Stitch Project ID**: `4044680601076201931`
- **Últimos Commits**:
    - `8c0073a`: fix: apply deep cache-busting to all card modules (v4.9)
    - `9feaf71`: fix: ensures unbundled JS modules are included in deployment (v4.8)
- **Deploy URL**: [suito.pro/card/max-devs-solutions](https://suito.pro/card/max-devs-solutions)

---

## 💡 Decisiones técnicas tomadas
- **Vanilla JS + ESM**: Se decidió mantener la carga dinámica de módulos sin bundler pesado para el módulo `card` para mantener simplicidad, compensando con cache-busting manual.
- **Ruta FTP Relativa**: Se movió a `domains/suito.pro/public_html/` para evitar problemas de permisos con rutas absolutas de Linux en Hostinger.
