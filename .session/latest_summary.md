# Resumen de Sesión — Ecosistema Suito
**Fecha:** 2026-03-28 22:59
**Proyecto:** `max-devs-suite` (MiSuite)

---

## 🎯 Objetivo de la sesión
Blindar la seguridad del backend de reservas y configurar el pipeline de integración y despliegue continuo (CI/CD) de las aplicaciones React SPA y Vanilla JS directo a producción en Hostinger.

---

## ✅ Lo que se hizo
1. **Seguridad End-to-End**:
    - **Base de datos (Backend)**: Creada política `INSERT` RLS en la tabla `appointments` (`supabase_rls_policies.sql`). Solamente negocios con el módulo `'appointments'` activo pueden recibir reservas.
    - **Rutas (Frontend)**: Integración del componente `<ModuleGuard />` en React Router (`gestor-de-turnos/App.tsx`) para denegar el paso a las interfaces del calendario a usuarios "freemium" y redirigirlos.
    - **Tarjetas Virtuales (Frontend)**: Ocultamiento condicional del botón de reservas analizando la propiedad `active_modules` (`tarjeta-virtual/js/supabase.js`).
2. **Setup de Dominio & Enrutamiento**:
    - Se mapearon en el radar los subdominios clave para SaaS: `turnos.suito.pro` (El Gestor React) y `admin.suito.pro` (El Panel Central).
    - Se inyectó reglas de redirección Apache en `.htaccess` para soportar recargas (F5) en la SPA de React sin romper las rutas.
3. **Automatización CI/CD (GitHub Actions a Hostinger)**:
    - Se creó el workflow `.github/workflows/deploy-ftp.yml` en el Gestor de Turnos que compila Node.js y sube la carpeta `dist/` a Hostinger.
    - Eliminamos acciones viejas (`deploy.yml` de Pages) que creaban conflicto.
    - Se creó el workflow `.github/workflows/deploy-admin.yml` en la raíz de `MiSuite` que empuja directo el código Vanilla a `admin.suito.pro`.
    - Cargamos todos los Secretos (`FTP_SERVER`, `FTP_USERNAME`, etc.) exitosamente en ambos repositorios tras corregir errores de `ftp://` causados por la UX del HPanel.
4. **Skills del Robot**:
    - Generada e instalada la skill reutilizable `hostinger-deploy/SKILL.md` para futuros proyectos.

---

## ❌ Problemas encontrados
- **Error ENOTFOUND / Timeout (GitHub Actions)**: Hostinger muestra un prefijo `ftp://` en la IP dentro del menú 'FTP Access', lo que rompía la conexión del runner de GitHub. Se solucionó limpiando el string manualmente a solo la IP (`147.93.14.107`).
- **Conflictos Action viejo**: El antiguo deploy de GH Pages fallaba silenciosamente tirando abajo todo el run del CI. Se eliminó el YAML obsoleto.

---

## 📋 Pendiente (para la próxima sesión)

### Prioridad 1 — Base de Datos y Supabase
1. Ejecutar físicamente el script `supabase_rls_policies.sql` en el SQL Editor de Supabase (Paso manual final requerido por el usuario).
2. Migrar la lógica de persistencia del *Admin Panel* que actualmente se almacena en `localStorage` (como la creación de nuevos clientes) hacia una tabla real en Supabase (ej: `businesses` / `clients`).

### Prioridad 2 — UX y Publicación
1. Testear las URLs de producción (`turnos.suito.pro` y `admin.suito.pro`) mañana, una vez finalizada la Propagación DNS global (2 a 24 horas).
2. Configurar o crear la landing page pública en la raíz del dominio principal `suito.pro`.

---

## 🔑 IDs y Referencias Importantes
- **IP FTP Servidor**: `147.93.14.107`
- **Dominio**: `suito.pro`
- **Subdominios Desplegados**: `turnos.suito.pro`, `admin.suito.pro`
- **Secrets Usados**: `FTP_SERVER`, `FTP_USERNAME`, `FTP_PASSWORD`, `ADMIN_FTP_SERVER`, `ADMIN_FTP_USERNAME`, `ADMIN_FTP_PASSWORD`
- **Último Commit de Éxito (Admin)**: `a6b3daf` / `9fa1adc`
- **Último Commit de Éxito (Turnos)**: `c707225`

---

## 💡 Decisiones técnicas tomadas
- **Arquitectura de Dominio**: Separación de las interfaces en subdominios independientes en lugar de subcarpetas (`suito.pro/turnos`) para evitar colisiones lógicas entre la app React (Turnos) y la Vanilla JS (Admin).
- **GitHub Actions (SamKirkland/FTP-Deploy-Action)**: Se eligió esta acción open-source por ser el estándar de la industria y la más resiliente para subir carpetas pre-compiladas saltándose la restricción SSH que suelen tener los hostings compartidos.
- **Doble barrera de seguridad (Front y Back)**: Proteger UI (UX) y proteger la Inserción (RLS). Esto es un estándar Enterprise para evitar "bypass" por postman.
