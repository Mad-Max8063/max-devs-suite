# Task Tracker: Suito Production Ready

## 0. Auditoria y Bloqueo de Seguridad (URGENTE)
- [x] **BLOQUEANTE:** Cerrar fuga de `edit_token` en `businesses`.
  - [x] Endurecer grants/RLS de `businesses` con `SELECT` por columnas seguras para `anon` y `authenticated`.
  - [x] Migrar editor de tarjeta a RPCs `SECURITY DEFINER` (`updateBusinessProfileSecure`, `addGalleryImageSecure`).
  - [x] Verificar que `anon`/`authenticated` no puedan seleccionar `edit_token` ni campos sensibles (Implementado en 0005).
- [x] **DB:** Ejecutar migracion `20260426000004_lock_appointments_public_read.sql`.
  - [x] Revocar `SELECT` publico en `appointments`.
  - [x] Configurar RLS por modulo activo.
  - [x] Agregar indice anti doble-reserva.
- [x] **DB:** Ejecutar migracion `20260426000005_lock_businesses_sensitive_data.sql`.
  - [x] Restringir columnas sensibles (`edit_token`) en `businesses`.
  - [x] Mantener `user_id` visible solo para `authenticated` como soporte de ownership/RLS.
- [x] **Frontend:** Refactorizar `getProfile` en `supabaseService.ts` para usar columnas explicitas.
- [ ] **Verificacion Final:** Ejecutar queries de auditoria en consola de Supabase (Manual).

## 1. Capa de Datos y Configuracion
- [x] **DB:** Ejecutar migracion pendiente `20260426000000_add_whatsapp_message.sql`.
- [x] **DB:** Ejecutar migracion pendiente `20260426000001_add_slot_interval.sql`.
- [x] **DB:** Ejecutar `20260426000002_security_rpc.sql`.
  - [x] Escribir funcion `get_busy_slots(business_id, date)`.
- [x] **Frontend:** Refactorizar `useAvailableSlots` para usar la RPC.

## 2. Flujo de Cancelacion y Autogestion
- [x] **DB:** Ejecutar `20260426000003_cancellation_token.sql`.
  - [x] Agregar columna `cancellation_token` y RPCs de cancelacion.
- [x] **Frontend:** Crear `turnos/pages/CancelPage.tsx`.
- [x] **Frontend/Service:** URL de cancelacion en mensajes de WhatsApp/Email.

## 3. Automatizacion de Recordatorios (MVP)
- [x] **Frontend:** Dashboard con "Recordatorios Pendientes" (manana).
- [x] **Frontend:** Boton de accion WhatsApp pre-poblado.

## 4. Onboarding y Retencion (UX)
- [x] **Frontend:** Componente `turnos/components/SetupChecklist.tsx` (0-100%).
- [x] **Frontend:** Montar en Dashboard condicionalmente.

## 5. Escalabilidad y Calidad (QoL)
- [x] **Frontend:** Validador estricto de telefono argentino (`549...`).
- [x] **Frontend:** Boton "Verificar en MP" con busqueda por nombre.
- [ ] **(Beta) Frontend/DB:** Staff `1:N` (Postergado v1.1).
