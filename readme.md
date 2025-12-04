# ⚔️ BnS Heroes - HUB/Timer

[English](#english) | [Español](#español)

---

## English

### 🌟 Overview

**BnS Heroes** is a state-of-the-art Web Dashboard and Progressive Web App (PWA) designed for *Blade & Soul Heroes* players. It goes beyond a simple timer, offering a complete ecosystem to track events, bosses, weekly content, and personal goals.

Built with a **Vanilla JS frontend** for maximum performance and a robust **Node.js/Express backend**, it features real-time synchronization, Discord-based authentication, and a sophisticated push notification system that works across devices.

### ✨ Live Demo
**[➡️ Launch App](https://olivo28.github.io/bnsheroes-timer)**

---

### 🚀 Key Features

#### 🔐 User Accounts & Cloud Sync
- **Discord OAuth2**: Secure login using your Discord account.
- **Cross-Device Sync**: Your settings, timers, and preferences are instantly synchronized between your PC, phone, and tablet.
- **Guest Mode**: Full functionality for non-logged-in users with local storage persistence.

#### 🔔 Advanced Notification System
- **Server-Side Push**: Reliable notifications delivered even when the app is closed.
- **Granular Control**:
    - **Boss Pre-Alerts**: Configurable warnings (e.g., 15m, 5m, 1m before spawn).
    - **Daily/Weekly Resets**: Never miss a reset with automated reminders.
    - **Event Dailies**: Get reminded hours before the daily reset to finish your event quests.
    - **Showdown Ticket**: Tracks your ticket regeneration and alerts you when it's ready.
- **Custom Reminders (New!)**: Create your own personal alarms with custom labels and **upload your own sound files** for a truly personalized experience.

#### ⏱️ Comprehensive Tracking
- **World Bosses**: Real-time tracking of all major field bosses with location and spawn data.
- **Events & Banners**:
    - **Live Events**: detailed guides, reward lists, and mission trackers.
    - **Gacha Banners**: Countdown to new hero banners and "Hero of the Week" tracking.
- **Weekly Content**: Trackers for raids, dungeons, and weekly challenges (e.g., Tower of Trials, Faction Battles).

#### 📱 Native-Like Experience (PWA)
- **Installable**: Add to your home screen on iOS, Android, and Windows.
- **Offline Capable**: Core features work without an internet connection thanks to Service Worker caching.
- **Responsive Design**: A fluid UI that adapts perfectly from 4K desktops to mobile screens.

---

### 🔧 Technical Architecture

The project is built on a modern, modular stack designed for scalability and performance.

#### **Frontend (Client)**
- **Core**: Vanilla JavaScript (ES6 Modules) for a lightweight, framework-free experience.
- **State Management**: Centralized `App.state` object with reactive UI updates.
- **PWA**: Service Worker (`serviceworker.js`) handling cache strategies (Stale-While-Revalidate) and Push API integration.
- **Libraries**:
    - `Luxon`: For robust timezone handling (UTC-12 to UTC+14).
    - `Swiper.js`: For touch-friendly mobile navigation.

#### **Backend (Server)**
- **Runtime**: **Node.js** with **Express**.
- **Database**: **MariaDB** managed via **Sequelize ORM**.
    - **Models**: `User` (Preferences, Auth), `Reminder` (Custom Alarms).
- **Authentication**: Discord OAuth2 (Authorization Code Grant) with JWT session management.
- **Push Notifications**: Implemented using `web-push` with VAPID keys.
- **File Storage**: `Multer` for handling custom sound file uploads.
- **Cron Jobs**: Server-side scheduled tasks (running every minute) to trigger push notifications for:
    - Boss Spawns (based on user-defined pre-alerts).
    - Custom Reminders.
    - Event/Weekly deadlines (3-day warnings).

#### **API Structure**
- `/api/auth/*`: Discord OAuth flow.
- `/api/user/preferences`: GET/PUT for syncing user settings.
- `/api/reminders`: CRUD endpoints for custom alarms + File Upload.
- `/api/data/*`: Serves static game data (JSON) and i18n strings.
- `/api/save-subscription`: Registers Service Worker push endpoints.

---

### 🤝 Contact & Support

Developed by **@olivo28**.

- **Discord Server:** [Join the Community](https://discord.gg/4eKe49CkVS)
- **Support Me:** Check the "Support Me" section in the app settings to help keep the server running!

---

## Español

### 🌟 Visión General

**BnS Heroes** es un Dashboard Web y Aplicación Web Progresiva (PWA) de última generación diseñada para jugadores de *Blade & Soul Heroes*. Va más allá de un simple temporizador, ofreciendo un ecosistema completo para rastrear eventos, jefes, contenido semanal y objetivos personales.

Construido con un **frontend en Vanilla JS** para máximo rendimiento y un robusto **backend en Node.js/Express**, cuenta con sincronización en tiempo real, autenticación vía Discord y un sofisticado sistema de notificaciones push que funciona en todos tus dispositivos.

### ✨ Demo en Vivo
**[➡️ Abrir App](https://olivo28.github.io/bnsheroes-timer)**

---

### 🚀 Características Clave

#### 🔐 Cuentas y Sincronización en la Nube
- **Discord OAuth2**: Inicio de sesión seguro usando tu cuenta de Discord.
- **Sincronización Multi-Dispositivo**: Tus configuraciones, temporizadores y preferencias se sincronizan instantáneamente entre tu PC, teléfono y tablet.
- **Modo Invitado**: Funcionalidad completa para usuarios no registrados con persistencia local.

#### 🔔 Sistema de Notificaciones Avanzado
- **Push desde el Servidor**: Notificaciones fiables entregadas incluso cuando la app está cerrada.
- **Control Granular**:
    - **Pre-Alertas de Jefes**: Avisos configurables (ej. 15m, 5m, 1m antes del spawn).
    - **Resets Diarios/Semanales**: Nunca te pierdas un reinicio con recordatorios automáticos.
    - **Misiones de Evento**: Recibe recordatorios horas antes del reset diario para terminar tus misiones.
    - **Ticket de Showdown**: Rastrea la regeneración de tu ticket y te avisa cuando está listo.
- **Recordatorios Personalizados (¡Nuevo!)**: Crea tus propias alarmas con etiquetas personalizadas y **sube tus propios archivos de sonido** para una experiencia única.

#### ⏱️ Seguimiento Integral
- **Jefes de Mundo**: Rastreo en tiempo real de todos los jefes de campo con ubicación y horarios.
- **Eventos y Banners**:
    - **Eventos en Vivo**: Guías detalladas, listas de recompensas y rastreadores de misiones.
    - **Banners Gacha**: Cuenta regresiva para nuevos banners y seguimiento del "Héroe de la Semana".
- **Contenido Semanal**: Rastreadores para raids, mazmorras y desafíos semanales (ej. Torre de las Pruebas, Batallas de Facción).

#### 📱 Experiencia Nativa (PWA)
- **Instalable**: Añádelo a tu pantalla de inicio en iOS, Android y Windows.
- **Modo Offline**: Las funciones principales funcionan sin conexión gracias al caché del Service Worker.
- **Diseño Responsivo**: Una interfaz fluida que se adapta perfectamente desde escritorios 4K hasta pantallas móviles.

---

### 🔧 Arquitectura Técnica

El proyecto está construido sobre un stack moderno y modular diseñado para escalabilidad y rendimiento.

#### **Frontend (Cliente)**
- **Core**: JavaScript Puro (Módulos ES6) para una experiencia ligera y sin frameworks pesados.
- **Gestión de Estado**: Objeto centralizado `App.state` con actualizaciones de UI reactivas.
- **PWA**: Service Worker (`serviceworker.js`) manejando estrategias de caché (Stale-While-Revalidate) e integración de Push API.
- **Librerías**:
    - `Luxon`: Para manejo robusto de zonas horarias (UTC-12 a UTC+14).
    - `Swiper.js`: Para navegación táctil en móviles.

#### **Backend (Servidor)**
- **Runtime**: **Node.js** con **Express**.
- **Base de Datos**: **MariaDB** gestionada vía **Sequelize ORM**.
    - **Modelos**: `User` (Preferencias, Auth), `Reminder` (Alarmas Custom).
- **Autenticación**: Discord OAuth2 (Authorization Code Grant) con gestión de sesiones JWT.
- **Notificaciones Push**: Implementado usando `web-push` con claves VAPID.
- **Almacenamiento de Archivos**: `Multer` para manejar la subida de sonidos personalizados.
- **Cron Jobs**: Tareas programadas en el servidor (cada minuto) para disparar notificaciones push para:
    - Spawns de Jefes (basado en pre-alertas de usuario).
    - Recordatorios Personalizados.
    - Fechas límite de Eventos/Semanales (avisos de 3 días).

#### **Estructura de la API**
- `/api/auth/*`: Flujo OAuth de Discord.
- `/api/user/preferences`: GET/PUT para sincronizar ajustes de usuario.
- `/api/reminders`: Endpoints CRUD para alarmas custom + Subida de Archivos.
- `/api/data/*`: Sirve datos estáticos del juego (JSON) y cadenas i18n.
- `/api/save-subscription`: Registra endpoints push del Service Worker.

---

### 🤝 Contacto y Soporte

Desarrollado por **@olivo28**.

- **Servidor de Discord:** [Únete a la Comunidad](https://discord.gg/4eKe49CkVS)
- **Apóyame:** ¡Revisa la sección "Apóyame" en los ajustes de la app para ayudar a mantener el servidor funcionando!