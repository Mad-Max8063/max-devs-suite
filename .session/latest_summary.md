# Resumen de Sesión — Suito Pre-Launch & Pricing Strategy
**Fecha:** 2026-04-20 16:08 ART
**Proyecto:** [max-devs-suite](https://github.com/Mad-Max8063/max-devs-suite)

---

## 🎯 Objetivo de la sesión
1. Deshabilitar pagos para **Gestor de Turnos** y **Pack Emprendedor** (convertidos a pre-inscripción).
2. Analizar y proponer una actualización de precios debido a la inflación acumulada en Argentina (>9% Jan-Mar).
3. Asegurar la persistencia del estado para la próxima sesión.

---

## ✅ Lo que se hizo (y quedó en vivo)
- **Deployment Exitoso**: Se subieron los cambios a `main`. La Action de GitHub construyó y desplegó en `https://suito.pro/home-v2029.html`.
- **UI de Pre-inscripción**: 
    - Precios de Turnos y Combo están blureados.
    - Botones dicen "Avisarme al lanzar".
    - La **Tarjeta Virtual** sigue operativa con flujo de pago normal.
- **Análisis de Precios**:
    - Se confirmó que los precios actuales ($4.900 / $9.900 / $12.900) están desactualizados vs mercado (~$6k-12k iniciales).
    - Se propuso un **reposicionamiento estratégico (+30%)**: $6.500 / $12.900 / $16.900.

---

## 📋 Pendiente (para la próxima sesión)

### Prioridad 1 — Actualización de Precios
1. **Definir Opción**: Confirmar si aplicamos la **Opción B** (+30%) o un ajuste menor.
2. **Ejecutar Cambios**: 
    - Actualizar fallbacks en `admin/config.js` y `home-v2029.html`.
    - Aplicar el incremento en la base de datos Supabase (vía Admin Panel o script SQL).

### Prioridad 2 — Verificación de Leads
1. Monitorear los primeros ingresos de leads tras el cambio a pre-inscripción para asegurar que el mensaje de éxito es el correcto.

---

## 🔑 IDs y Referencias Importantes
- **Repo GitHub**: `Mad-Max8063/max-devs-suite`
- **Último Commit (Deploy)**: `048fa18` (Session summary v1)
- **Repo URL**: `https://github.com/Mad-Max8063/max-devs-suite`
- **Market Research**: Planes iniciales en Argentina Abril 2026: $6.000 - $12.000 ARS.

---

## 💡 Decisiones técnicas tomadas
- **Estrategia Anti-Inflación**: Se recomendó subir los precios proactivamente para mantener el estatus "Premium" y no quedar debajo del costo operativo/inflación.
- **Persistencia**: Se mantiene el uso de archivos versionados para evitar problemas de caché en Hostinger.
