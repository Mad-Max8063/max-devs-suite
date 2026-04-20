# Resumen de Sesión — Suito Pre-Launch Phase
**Fecha:** 2026-04-20 16:02 ART
**Proyecto:** [max-devs-suite](https://github.com/Mad-Max8063/max-devs-suite)

---

## 🎯 Objetivo de la sesión
Deshabilitar temporalmente los pagos para el **Gestor de Turnos** y el **Pack Emprendedor** en la landing page de Suito, convirtiendo estos servicios en un flujo de pre-inscripción (lista de espera), manteniendo operativa únicamente la venta de la **Tarjeta Virtual**.

---

## ✅ Lo que se hizo
- **`MiSuite/home-v2029.html`**:
    - Reemplazados badges de "7 días gratis" por **"Próximamente"** en Turnos y Combo.
    - Aplicado **desenfoque (`blur-sm`)** a los precios de Turnos y Combo.
    - Eliminados atributos `data-price-*` para evitar sobrescritura dinámica.
    - Botones actualizados a **"Avisarme al lanzar"**.
    - Actualizada función `startOnboarding` para incluir el plan `combo`.
- **`MiSuite/landing/app.js`**:
    - Actualizada lógica de éxito para mostrar mensaje de **"Pre-inscripción exitosa"** al seleccionar COMBO o GESTOR.
- **Distribución**:
    - Actualizado `dist/home-v2029.html` con los mismos cambios.
- **Despliegue**:
    - Push exitoso a `main` que activó el deployment en Hostinger.
- **Verificación**:
    - Verificación manual mediante navegador confirmando que los cambios están **en vivo** en `https://suito.pro/home-v2029.html`.

---

## 📋 Pendiente (para la próxima sesión)

### Prioridad 1 — Activación de Pagos
1. Cuando el Gestor de Turnos esté operativo, restaurar los badges de prueba y quitar el `blur-sm`.
2. Restaurar los atributos `data-price-plan` y `data-price-period`.
3. Ajustar `app.js` para que el éxito derive al flujo de pago de MP.

---

## 🔑 IDs y Referencias Importantes
- **Repo GitHub**: `Mad-Max8063/max-devs-suite`
- **Branch**: `main`
- **Último Commit (Production)**: `3cde5f8e4a760dfe672eb18bcd875f350b7e08bd`
- **URL de Verificación**: `https://suito.pro/home-v2029.html#precios`

---

## 💡 Decisiones técnicas tomadas
- **Bypass de HCDN**: Se verificó que el deployment en Hostinger es efectivo y que el uso de archivos versionados (`-v2029`) mitiga problemas de caché severos.
- **UI de Pre-inscripción**: Se optó por el desenfoque en lugar de ocultar los precios para generar curiosidad técnica sin permitir la transacción, manteniendo la estética "vibrante" solicitada.
