# Resumen de Sesión — Estabilización Suito Platform
**Fecha:** 2026-04-12 21:03 (Local)
**Proyecto:** [max-devs-suite](https://github.com/Mad-Max8063/max-devs-suite)

---

## 🎯 Objetivo de la sesión
Lograr un despliegue estable y de alto rendimiento de Suito en Hostinger, resolviendo los errores 422 de assets y manifest PWA que persistían debido a la caché (HCDN) y rutas relativas.

---

## ✅ Lo que se hizo
1.  **Invalidación de Caché Total (v4)**:
    - Se configuró el sufijo `-v4.js` en `vite.config.ts`.
    - Se añadió `?v=4` a favicon y manifest en `index.html`.
2.  **Solución de Rutas Dinámicas**:
    - Se migraron todos los assets críticos a `public/card/assets/`.
    - Se actualizaron las rutas en `card.js` y `editor.js` a absolutas (`/card/assets/...`).
3.  **Blindaje de Servidor**:
    - Se creó un `.htaccess` en `public/card/` con exclusión explícita de assets y encabezados `no-cache` para el manifest.
4.  **Confirmación de Producción**:
    - Verificación exitosa mediante subagente de navegador: el JS carga con la nueva versión y el logo es visible.

---

## 📋 Pendiente (para la próxima sesión)

### Prioridad 1 — Limpieza de Servidor
1.  **Eliminar carpetas basura**: Borrar `/home/u543991373/domains/suito.pro/public_html/card/card/` (carpeta duplicada detectada).
2.  **Verificar Subdominios**: Asegurar que `appointment-manager` no tenga conflictos de `.htaccess` similares.

### Prioridad 2 — UX y PWA
1.  **Audit Lighthouse**: Verificar puntuación de PWA tras el fix del manifest.
2.  **Offline Support**: Validar que el Service Worker maneje correctamente las nuevas rutas `-v4`.

---

## 🔑 IDs y Referencias Importantes
- **Repo**: `Mad-Max8063/max-devs-suite`
- **Branch**: `main`
- **Commit Reciente**: `3eb36fb` (fix fallback paths)
- **URL Crítica**: `https://suito.pro/card/max-devs-solutions`
- **Hostinger IP**: `147.93.14.107`

---

## 💡 Decisiones técnicas tomadas
- **Base Path `/`**: Obligatorio para que Vite resuelva rutas relativas a la raíz del dominio en lugar de la carpeta física, evitando duplicaciones.
- **Cache Busting Forzado**: Se prefirió renombrar archivos (`-v4`) sobre solo usar query params porque el CDN de Hostinger a veces ignora los params para archivos `.js`.
