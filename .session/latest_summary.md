# Resumen de Sesión — Suito Platform
**Fecha:** 2026-04-09
**Proyecto:** [Mad-Max8063/max-devs-suite](https://github.com/Mad-Max8063/max-devs-suite)

---

## 🎯 Objetivo de la sesión
Completar la Arquitectura Multi-Tenant (Fase A) asegurando el backend con RLS en Supabase, y diagnosticar/arreglar los bugs de enrutamiento y el severo problema de sincronización FTP de producción en Hostinger.

---

## ✅ Lo que se hizo
1. **Multi-Tenant y Zero Trust:**
   - Se crearon migraciones SLQ (`admin_clients_migration.sql` y `suito_super_admin_migration.sql`).
   - Se aplicaron Row Level Security (RLS) policies en la tabla `admin_clients` permitiendo acceso vía `user_id` o `is_super_admin()`.
   - Se actualizó el Admin Panel (`clients.js`, `auth.js`) para usar autenticación real de Supabase y eliminar lógica Insecure (localStorage y Service Role Keys en cliente).
   - Se añadió el soporte nativo para `transfer_email` (campo en base de datos y modal frontend).

2. **Fix de Enrutamiento y Slugs:**
   - Se reparó el bug visual de duplicación de URL (`/card/card/`).
   - Se ajustó el RegExp en la Tarjeta Virtual (`app.js`) para soportar guiones medios en los nombres de los negocios (ej. `max-devs-solutions`).

3. **Despliegue a Producción (Resolución de FTP):**
   - Se descubrió que la acción FTP de GitHub subía exitosamente los archivos a carpetas fantasma (`domains/suito.pro/public_html/...`) debido al root jail del usuario FTP.
   - Hostinger seguía entregando archivos congelados de caché/servidor del 30 de marzo (LiteSpeed).
   - Se parchó `.github/workflows/deploy-production.yml` obligando a sincronizar contra el root `public_html/`. Se hizo commit y push.
   - Se investigó la anomalía visual de "Dominio Conectando" del hPanel de Hostinger (descartado como falso positivo).
   - Se teorizó un posible cambio de servidor de Hostinger / desactualización de secreto `FTP_SERVER`.

---

## ❌ Problemas encontrados
- **Hostinger FTP Ghosting:** GitHub Actions completaba el `FTP-Deploy-Action` de forma impecable sin errores, pero los ficheros no se servían. Causa: Path offset con el root (`domains/suito.pro/` vs `public_html/`) y potencial desactualización de la clave secreta `FTP_SERVER` tras cambios en la cuenta (el servidor contestaba `Last-Modified: 30 Mar 2026` para `suito.pro`).

---

## 📋 Pendiente (para la próxima sesión)

### Prioridad 1 — Despliegue en Producción
1. Que el Humano confirme la `IP de FTP` actual en el panel de Hostinger.
2. Actualizar el Secret `FTP_SERVER` en GitHub.
3. Volver a correr el despliegue del Admin Panel.
4. Validar que al fin abra `suito.pro/admin` con la versión lila de Suito.

### Prioridad 2 — Fase B (Multi-Tenant Autogestionado)
1. Desarrollar el flujo del usuario cliente (donde Max Devs transfiere la autoría del registro `admin_clients` a la nueva cuenta del cliente vía `transfer_email`).

---

## 🔑 IDs y Referencias Importantes
- Repo: `Mad-Max8063/max-devs-suite`
- Dominios evaluados: `admin.suito.pro`, `suito.pro/admin/`
- IP actual Hostinger DNS (`suito.pro`): `147.93.14.107`
- Último commit de fix: `c251ee1`
- Función Helper SQL: `is_super_admin(uuid)`

---

## 💡 Decisiones técnicas tomadas
- Se limpió el prefijo redundante "domains/suito.pro" de la Acción GitHub para prevenir fallos por enjaulamiento FTP genérico a nivel root de cuenta de Hostinger (`public_html/`).
- Las políticas de seguridad confían 100% en la validación RLS, por lo que se removieron filtros de UI del lado cliente previniendo fugas de datos.
