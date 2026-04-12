# Resumen de Sesión — MiSuite (Suito Platform)
**Fecha:** 12 de Abril, 2026 (Local: 14:30)
**Proyecto:** [Mad-Max8063/max-devs-suite](https://github.com/Mad-Max8063/max-devs-suite)

---

## 🎯 Objetivo de la sesión
Reparar el entorno de producción en Hostinger, resolviendo los errores 404 de los submódulos y venciendo la estricta caché de la CDN (HCDN) para que se reflejen los cambios y subdominios con CORS integrado.

---

## ✅ Lo que se hizo
1. **Resolución de Rutas Relativas:** Modificación en `vite.config.ts` (monorepo) para que el `base` apunte a la ruta absoluta `https://suito.pro/`, solucionando los errores 404 en los subdominios (`admin.suito.pro`, `card...`).
2. **CORS para Subdominios:** Creación de reglas `Access-Control-Allow-Origin: "*"` en el archivo `.htaccess`.
3. **Inclusión de `.htaccess` en Build:** Identificación de que Vite no compilaba `.htaccess`. Se movió a la carpeta `public/.htaccess` para que forme parte del `dist/` en GitHub Actions.
4. **HCDN Cache Busting (Evadiendo Caché):** Múltiples estilos/scripts estaban estancados en los servidores Edge de Hostinger (HCDN). Se añadieron comentarios `/* cachebust */` en el código fuente (`admin/styles.css`, `admin/app.js`, `card/js/supabase.js`) para FORZAR a Vite a generar hashes nuevos y que la CDN asimile los últimos archivos originarios con las correctas cabeceras CORS.

---

## ❌ Problemas encontrados
- **Hostinger HCDN:** Extremadamente agresivo (HIT/max-age=604800). No alcanzaba con arreglar `.htaccess` si la CDN tenía en caché los archivos viejos sin cabeceras. La estrategia final (Cache Busting de Vite) fue la clave definitiva.
- Sintaxis en `vite.config.ts` truncó el build una vez (falta de paréntesis), pero se corrigió al instante.

---

## 📋 Pendiente (para la próxima sesión)

### Prioridad 1 — Validación Funcional
1. Verificar que el panel `admin.suito.pro` carga y rutea exitosamente al backend de Supabase.
2. Hacer el flujo de creación de la "Tarjeta Virtual Suito" (Perfil/Profesión) para confirmar persistencia y lectura en base de datos.
3. Crear el primer cliente real desde el panel para testear la RLS de Supabase.

### Prioridad 2 — Limpieza / UI
1. Ajustes menores en placeholders y variables de Entorno local vs Prod.
2. Confirmar propagación en subdominio de turnos (`turnos.suito.pro`).

---

## 🔑 IDs y Referencias Importantes
- **Repo:** Mad-Max8063/max-devs-suite (Rama: `main`)
- **Flujo CI/CD:** `.github/workflows/deploy-production.yml`
- **Path de Deploy Local:** `dist/`
- **Path de Servidor:** `../domains/suito.pro/public_html/`

---

## 💡 Decisiones técnicas tomadas
- **Vite Base Path Dinámico:** Se usa "https://suito.pro/" al empaquetar para garantizar compatibilidad transversal entre subdominios, rompiendo la atadura de rutas relativas puras.
- **Cache Busting Manual:** Antes de pelear contra el panel de Hostinger, simplemente tocar los archivos fuerza un bypass 100% nativo.
