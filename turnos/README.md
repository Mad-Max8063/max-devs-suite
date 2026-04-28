# 📅 Gestor de Turnos
<!-- Triggering deployment with relative paths fix - v1.0.3 -->

Sistema de gestión de turnos multi-tenant para emprendedores. Permite a profesionales independientes (peluquerías, barberías, consultorios, etc.) gestionar su agenda y recibir reservas de clientes con seña integrada.

[![Deploy to GitHub Pages](https://github.com/Mad-Max8063/gestor-de-turnos/actions/workflows/deploy.yml/badge.svg)](https://github.com/Mad-Max8063/gestor-de-turnos/actions/workflows/deploy.yml)

## ✨ Demo en Vivo

**[Ver demo →](https://mad-max8063.github.io/gestor-de-turnos/)**

El modo demo permite explorar todas las funcionalidades sin necesidad de crear una cuenta.

## 🚀 Características

### Para Emprendedores
- 📊 **Panel de control** - Vista general y accesos rápidos
- 📅 **Agenda inteligente** - Turnos pendientes y confirmados
- ⚙️ **Configuración de horarios** - Define días y horarios de trabajo
- 🚫 **Bloqueo de fechas** - Marca días no laborables
- 💼 **Perfil de negocio** - Logo, datos de contacto, seña
- 💳 **Integración Mercado Pago** - Alias, link de pago y QR

### Para Clientes
- 📆 **Reserva online** - Calendario con disponibilidad en tiempo real
- ⏰ **Selección de horarios** - Solo muestra slots disponibles
- 📱 **Diseño mobile-first** - Optimizado para celulares
- ✅ **Confirmación inmediata** - Turno reservado al instante
- 💬 **WhatsApp integrado** - Aviso de pago con un clic

## 🛠️ Tech Stack

| Frontend | Backend | Infraestructura |
|----------|---------|-----------------|
| React 19 | Supabase (PostgreSQL) | GitHub Pages |
| TypeScript | Supabase Auth (Opcional) | GitHub Actions |
| Vite | - | PWA Ready |
| Tailwind CSS | - | - |

## 📁 Estructura del Proyecto

```
gestor-de-turnos/
├── App.tsx                    # Router principal
├── pages/                     # Páginas de la app
│   ├── WelcomePage.tsx        # Dashboard principal
│   ├── BookingPage.tsx        # Reserva de turnos (cliente)
│   ├── AgendaPage.tsx         # Lista de turnos
│   ├── BusinessConfigPage.tsx # Config del negocio
│   ├── ScheduleConfigPage.tsx # Config de horarios
│   ├── LoginPage.tsx          # Inicio de sesión
│   ├── RegisterPage.tsx       # Registro
│   └── ConfirmationPage.tsx   # Confirmación de reserva
├── components/                # Componentes reutilizables
├── context/                   # React Context (estado global)
├── hooks/                     # Custom hooks
├── services/                  # Conexión con Supabase
└── docs/                      # Documentación
    └── GUIA_USUARIO.md        # Manual de usuario
```

## 🏃 Quick Start (Desarrollo local)

### Prerrequisitos
- Node.js 18+
- yarn

### Instalación

```bash
# Clonar repositorio
git clone https://github.com/TU-USUARIO/gestor-de-turnos.git
cd gestor-de-turnos

# Instalar dependencias
yarn install

# Ejecutar en modo desarrollo
yarn dev
```

La app correrá en `http://localhost:3000` en **modo demo** (sin backend).

## 🚀 Despliegue

### GitHub Pages (Recomendado - Gratis)

1. Hacé fork de este repositorio
2. Ve a Settings → Pages → Source: GitHub Actions
3. ¡Listo! Se despliega automáticamente

📖 **[Guía completa de despliegue](./docs/DEPLOY_GITHUB_PAGES.md)**

### Con Backend (Opcional)

Para guardar datos reales, configurá el backend de Google Sheets:

📖 **[Configuración de Google Sheets](./docs/SETUP_GOOGLE_SHEETS.md)**

## 📱 URLs de la App

Una vez desplegada, los emprendedores acceden así:

| Rol | URL |
|-----|-----|
| Admin | `https://tu-app.com/#/mi-negocio` |
| Cliente | `https://tu-app.com/#/mi-negocio/booking` |
| Demo | `https://tu-app.com/#/demo` |

Cada emprendedor se registra con su propio "slug" (identificador único).

## 🔧 Variables de Entorno

| Variable | Descripción | Requerida |
|----------|-------------|-----------|
| `VITE_SUPABASE_URL` | URL de la API de Supabase | Sí |
| `VITE_SUPABASE_ANON_KEY` | Clave anónima pública de Supabase | Sí |

## 🧪 Tests

```bash
# Ejecutar tests
yarn test

# Tests con watch mode
yarn test --watch
```

## 🤝 Contribuir

1. Fork del repositorio
2. Crear rama (`git checkout -b feature/nueva-funcionalidad`)
3. Commit (`git commit -m 'Agregá nueva funcionalidad'`)
4. Push (`git push origin feature/nueva-funcionalidad`)
5. Abrir Pull Request

## 📝 Licencia

MIT

---

Hecho con ❤️ para emprendedores argentinos
