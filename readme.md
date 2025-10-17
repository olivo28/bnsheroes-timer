# BnS Heroes - HUB/Timer

[English](#english) | [Español](#español)

---

## English

### Table of Contents
1.  [✨ Live Demo](#-live-demo)
2.  [🚀 Key Features](#-key-features)
3.  [🔧 Technical Architecture](#-technical-architecture)
4.  [📖 How to Use](#-how-to-use)
5.  [🗺️ Project Roadmap](#️-project-roadmap)
6.  [🤝 Contact & Support](#-contact--support)

A powerful, feature-rich web dashboard and Progressive Web App (PWA) for Blade & Soul Heroes. Track game timers, events, banners, and weekly content with unparalleled detail. Features Discord-based user accounts, cloud-synced settings, and advanced multi-device push notifications to keep you ahead.

### ✨ Live Demo

**[➡️ Try it Here!](https://olivo28.github.io/bnsheroes-timer)**

### 🚀 Key Features

#### User Accounts & Sync
- **Discord Login**: Securely sign in with your Discord account.
- **Cloud Sync**: All your settings, including notification preferences and timers, are saved to your account and synced across devices.
- **Local Persistence**: For guests, all settings are saved locally in browser cookies.

#### Advanced Push Notifications
- **Multi-Device Management**: Receive alerts on your phone, tablet, and PC. Manage each device individually with custom aliases.
- **Granular Toggles**: Enable or disable push notifications for specific events:
    - Daily & Weekly Resets
    - Showdown Ticket Availability
    - Event Dailies Reminders
- **Smart Reminders**: Get timely push alerts for:
    - **Event Dailies**: A configurable number of hours before the daily reset.
    - **Weekly Reset**: A configurable number of days before the weekly content resets.
    - **New Banners**: A reminder days before a new hero banner begins.

#### Comprehensive Timers & Content
- **Core Timers**:
    - **Daily Reset**: Countdown to server reset.
    - **Showdown Ticket**: Tracks ticket availability with server-side sync for logged-in users.
    - **World Boss Spawns**: Multiple boss schedules with individual alert toggles.
- **Weekly Content Tracking**:
    - **Weekly Resets**: Timers for all weekly-reset content like Tower of Trials and Faction Battles.
    - **Detailed Breakdowns**: In-depth views of season buffs, stages, boss info, recommended heroes, and score rewards.
- **Events & Banners**:
    - **Active Events**: Real-time display of ongoing game events.
    - **Complete Details**: View full mission lists, exchange shops, boss ranking rewards, and reward pools.
    - **Banner Tracking**: Current and upcoming hero banners with countdowns.
- **Interactive Hero Database**:
    - Click any hero in a banner or recommendation list to open a detailed view.
    - **Skins & Related Heroes**: Browse available skins and easily navigate between related heroes from the same banner or event.
    - **Full Info**: Access rarities, roles, elements, attack range, and more.

#### Personalization & User Experience
- **PWA Support**: Install the app on your desktop or mobile home screen for a native-app experience and offline access.
- **Timezone & Format**: Display all times in your local timezone (UTC-12 to UTC+14) and switch between 12h/24h format.
- **Multi-Language**: Full interface available in English and Spanish, with a first-time language selector.
- **Selective Display**: Toggle visibility for boss timers, events, and weekly content sections to customize your dashboard.
- **Custom Alerts**: Configure pre-alert warnings (e.g., 15, 5, 1 min before boss spawns) and choose between sound or desktop notifications.

#### Twitch Integration
- **Live Stream Widget**: A floating button indicates when official streams are live or starting soon.
- **Stream Schedule**: View upcoming official streams directly within the app.
- **Stream Alerts**: Enable notifications for 15 minutes before a stream starts and when it goes live.

### 🔧 Technical Architecture

- **Client-Side**:
    - **Vanilla JavaScript (ES6 Modules)**: Built without any major frameworks for maximum performance.
    - **Modular System**: Organized into a logical 6-module structure (`0-data.js` to `5-main.js`).
    - **PWA Ready**: Utilizes a Service Worker for caching, offline capabilities, and push notifications.
    - **External Libraries**: Swiper.js for mobile navigation and Luxon.js for robust date/time handling.
- **Backend**:
    - **Node.js / Express API**: Manages user authentication, preference storage, and push notification delivery.
    - **Discord OAuth2**: Handles secure user login.
- **Data Management**:
    - **Centralized State**: A global `App` object manages the application's state.
    - **Dynamic Data**: Game content (events, heroes, bosses) is fetched from a backend API, allowing for updates without deploying new code.

### 📖 How to Use

1.  **Open the live demo**. You will be prompted to select a language on your first visit.
2.  **Grant notification permission** when prompted for local browser alerts.
3.  **(Optional but Recommended) Click the user icon** to **log in with Discord**. This unlocks cloud sync and push notifications.
4.  **To enable Push Notifications**:
    - Log in with Discord.
    - Open the user settings modal (click your avatar).
    - Navigate to the "Push Notifications" section.
    - Add your current device and give it an alias (e.g., "My Phone").
5.  **Click the settings icon (⚙️)** to configure local preferences:
    - Enable/disable main content sections.
    - Set pre-alert minutes for bosses.
    - Select timezone, language, and time format.
6.  **Click "Save"** to apply your settings.
7.  **Interact with events, weekly content, and banners** to view detailed information.

### 🗺️ Project Roadmap

Want to know what's next? We have a public roadmap where you can see our plans for new features, Discord bot integration, and other major improvements.

**[➡️ View the Official Roadmap here!](ROADMAP.md)**

### 🤝 Contact & Support

Find me on the official **BNS Heroes** Discord:
- **Discord:** `@olivo28`
- **Server:** [Join Here](https://discord.gg/4eKe49CkVS)

Donations are welcome but never required! Your feedback is the best support. You can find donation links in the "Support Me" section of the user settings panel.

---

## Español

### Índice de Contenidos
1.  [✨ Demo en Vivo](#-demo-en-vivo)
2.  [🚀 Características Clave](#-características-clave)
3.  [🔧 Arquitectura Técnica](#-arquitectura-técnica)
4.  [📖 Cómo Usar](#-cómo-usar)
5.  [🗺️ Hoja de Ruta del Proyecto](#️-hoja-de-ruta-del-proyecto)
6.  [🤝 Contacto y Soporte](#-contacto-y-soporte)

Un potente y completo dashboard web y Aplicación Web Progresiva (PWA) para Blade & Soul Heroes. Rastrea temporizadores, eventos, banners y contenido semanal con un detalle sin igual. Incluye cuentas de usuario basadas en Discord, configuración sincronizada en la nube y notificaciones push avanzadas multi-dispositivo para mantenerte siempre un paso por delante.

### ✨ Demo en Vivo

**[➡️ ¡Pruébalo Aquí!](https://olivo28.github.io/bnsheroes-timer)**

### 🚀 Características Clave

#### Cuentas de Usuario y Sincronización
- **Inicio de Sesión con Discord**: Inicia sesión de forma segura con tu cuenta de Discord.
- **Sincronización en la Nube**: Todas tus configuraciones, incluidas las preferencias de notificación y temporizadores, se guardan en tu cuenta y se sincronizan entre tus dispositivos.
- **Persistencia Local**: Para invitados, toda la configuración se guarda localmente en las cookies del navegador.

#### Notificaciones Push Avanzadas
- **Gestión Multi-Dispositivo**: Recibe alertas en tu teléfono, tablet y PC. Gestiona cada dispositivo individualmente con alias personalizados.
- **Alertas Individuales**: Activa o desactiva notificaciones push para eventos específicos:
    - Reinicios Diarios y Semanales
    - Disponibilidad de Ticket de Showdown
    - Recordatorios de Misiones Diarias de Evento
- **Recordatorios Inteligentes**: Recibe alertas push oportunas para:
    - **Misiones Diarias de Evento**: Un número configurable de horas antes del reinicio diario.
    - **Reinicio Semanal**: Un número configurable de días antes de que el contenido semanal se reinicie.
    - **Nuevos Banners**: Un recordatorio días antes de que comience un nuevo banner de héroe.

#### Temporizadores y Contenido Detallado
- **Temporizadores Principales**:
    - **Reset Diario**: Cuenta regresiva para el reinicio del servidor.
    - **Ticket de Showdown**: Rastrea la disponibilidad de tickets con sincronización del lado del servidor para usuarios registrados.
    - **Spawns de Jefes Mundiales**: Múltiples horarios de jefes con alertas individuales.
- **Seguimiento de Contenido Semanal**:
    - **Reinicios Semanales**: Temporizadores para todo el contenido de reinicio semanal como la Torre de las Pruebas y Batallas de Facción.
    - **Información Detallada**: Vistas en profundidad de los buffs de temporada, etapas, información de jefes, héroes recomendados y recompensas por puntuación.
- **Eventos y Banners**:
    - **Eventos Activos**: Visualización en tiempo real de los eventos en curso del juego.
    - **Detalles Completos**: Consulta listas de misiones, tiendas de intercambio, recompensas de ranking de jefes y pools de recompensas.
    - **Seguimiento de Banners**: Banners de héroes actuales y próximos con cuentas regresivas.
- **Base de Datos de Héroes Interactiva**:
    - Haz clic en cualquier héroe en un banner o lista de recomendación para abrir una vista detallada.
    - **Skins y Héroes Relacionados**: Explora las skins disponibles y navega fácilmente entre héroes relacionados del mismo banner o evento.
    - **Información Completa**: Accede a rarezas, roles, elementos, rango de ataque y más.

#### Personalización y Experiencia de Usuario
- **Soporte PWA**: Instala la aplicación en tu escritorio o pantalla de inicio móvil para una experiencia de app nativa y acceso sin conexión.
- **Zona Horaria y Formato**: Muestra todas las horas en tu zona horaria local (UTC-12 a UTC+14) y cambia entre el formato de 12h/24h.
- **Multi-idioma**: Interfaz completa disponible en inglés y español, con un selector de idioma en la primera visita.
- **Visualización Selectiva**: Activa o desactiva la visibilidad de las secciones de jefes, eventos y contenido semanal para personalizar tu panel.
- **Alertas Personalizadas**: Configura avisos de pre-alerta (ej. 15, 5, 1 min antes de los spawns de jefes) y elige entre notificaciones de sonido o de escritorio.

#### Integración con Twitch
- **Widget de Streams en Vivo**: Un botón flotante indica cuándo los streams oficiales están en vivo o a punto de comenzar.
- **Horario de Streams**: Consulta los próximos streams oficiales directamente en la aplicación.
- **Alertas de Stream**: Activa notificaciones para 15 minutos antes de que comience un stream y cuando se ponga en vivo.

### 🔧 Arquitectura Técnica

- **Lado del Cliente**:
    - **JavaScript Puro (Módulos ES6)**: Construido sin frameworks principales para un rendimiento máximo.
    - **Sistema Modular**: Organizado en una estructura lógica de 6 módulos (`0-data.js` a `5-main.js`).
    - **PWA Ready**: Utiliza un Service Worker para caché, capacidades sin conexión y notificaciones push.
    - **Librerías Externas**: Swiper.js para la navegación móvil y Luxon.js para un manejo robusto de fechas y horas.
- **Backend**:
    - **API en Node.js / Express**: Gestiona la autenticación de usuarios, el almacenamiento de preferencias y el envío de notificaciones push.
    - **OAuth2 de Discord**: Maneja el inicio de sesión seguro de usuarios.
- **Gestión de Datos**:
    - **Estado Centralizado**: Un objeto global `App` gestiona el estado de la aplicación.
    - **Datos Dinámicos**: El contenido del juego (eventos, héroes, jefes) se obtiene de una API de backend, permitiendo actualizaciones sin necesidad de desplegar nuevo código.

### 📖 Cómo Usar

1.  **Abre la demo en vivo**. Se te pedirá que selecciones un idioma en tu primera visita.
2.  **Otorga permiso de notificaciones** cuando se solicite para alertas locales del navegador.
3.  **(Opcional pero Recomendado) Haz clic en el ícono de usuario** para **iniciar sesión con Discord**. Esto desbloquea la sincronización en la nube y las notificaciones push.
4.  **Para activar las Notificaciones Push**:
    - Inicia sesión con Discord.
    - Abre el modal de configuración de usuario (haz clic en tu avatar).
    - Navega a la sección "Notificaciones Push".
    - Añade tu dispositivo actual y asígnale un alias (ej. "Mi Teléfono").
5.  **Haz clic en el ícono de configuración (⚙️)** para ajustar las preferencias locales:
    - Activa/desactiva las secciones principales de contenido.
    - Establece los minutos de pre-alerta para los jefes.
    - Selecciona zona horaria, idioma y formato de hora.
6.  **Haz clic en "Guardar"** para aplicar tu configuración.
7.  **Interactúa con los eventos, contenido semanal y banners** para ver información detallada.

### 🗺️ Hoja de Ruta del Proyecto

¿Quieres saber qué viene a continuación? Tenemos una hoja de ruta pública donde puedes ver nuestros planes para nuevas funcionalidades, la integración con un bot de Discord y otras mejoras importantes.

**[➡️ ¡Consulta la Hoja de Ruta Oficial aquí!](ROADMAP.md)**

### 🤝 Contacto y Soporte

Encuéntrame en el Discord oficial de **BNS Heroes**:
- **Discord:** `@olivo28`
- **Servidor:** [Únete Aquí](https://discord.gg/4eKe49CkVS)

¡Las donaciones son bienvenidas pero nunca obligatorias! Tu feedback es el mejor apoyo. Puedes encontrar los enlaces de donación en la sección "Apóyame" del panel de configuración de usuario.