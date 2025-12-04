# ⚔️ BnS Heroes - HUB

[English](#english) | [Español](#español)

---

## English

### 🌟 Overview

**BnS Heroes HUB** is the ultimate companion tool and Progressive Web App (PWA) designed for *Blade & Soul Heroes* players. It has evolved from a simple timer into a comprehensive ecosystem that acts as a central **HUB** for tracking timers and a powerful **Compendium** for team building and hero management.

Built with a modular **Vanilla JS (ES6)** architecture and a robust **Node.js** backend, it features real-time synchronization, Discord-based authentication, server-side push notifications, and a sophisticated drag-and-drop team builder.

### ✨ Live Demo
**[➡️ Launch App](https://olivo28.github.io/bnsheroes-timer)**

---

### 🚀 Key Features

#### ⏱️ The HUB (Timers & Tracking)
- **Real-Time Timers**: Daily Reset, Showdown Ticket regeneration, and World Boss spawns with location maps and timezone conversion (UTC-12 to UTC+14).
- **Event Tracking**: Detailed guides for live events, reward lists, mission trackers, and daily/cumulative progress monitoring.
- **Weekly Content**: Trackers for Tower of Trials (stage rewards), Faction Battles schedules, and Tactical Trial boss rotations.
- **Twitch Integration**: A floating button (FAB) that lights up when tracked streamers go live, with previews inside the app.

#### 🦸 Hero Compendium & Team Builder
- **Complete Database**: Browse the full hero library with advanced filtering by element, role, rarity, and instant name search.
- **Detailed Hero Views**: Visual stats, skins viewer, range/attack distance info, and related hero links.
- **Interactive Team Builder**: 
    - Drag-and-drop interface to create 5-hero teams.
    - Leader slot distinction and team categorization (Field/Tactical).
    - **Sharing System**: Generate unique **Deep Links** (e.g., `?teamId=123`) to share your compositions instantly.
- **My Teams Library**: Save, edit, filter, and manage your team collection in the cloud.

#### 🔐 User Accounts & Cloud Sync
- **Discord OAuth2**: Secure and seamless login using your Discord account.
- **Cross-Device Sync**: Settings, timers, saved teams, and preferences sync instantly between PC, mobile, and tablet.
- **Player Card**: Customize your profile with your In-Game Name (IGN), Server (NA/EU/ASIA), and Custom Nickname.
- **Guest Mode**: Full functionality for non-logged-in users with local storage persistence.

#### 🔔 Advanced Notification System
- **Server-Side Push**: Reliable notifications delivered even when the app is closed.
- **Granular Control**:
    - **Boss Pre-Alerts**: Configurable warnings (15m, 5m, 1m before spawn).
    - **Resets**: Automated reminders for Daily and Weekly content resets.
    - **Event Dailies**: Get reminded hours before the daily reset to finish your event quests.
    - **Showdown Ticket**: Alerts you when your ticket has regenerated.
- **Custom Reminders**: Create personal alarms with custom labels and **upload your own sound files** (up to 5MB) for a truly personalized experience.

#### 📱 Native-Like Experience (PWA)
- **App-Like Navigation**: Floating bottom navigation bar on mobile, sidebar on desktop.
- **Responsive Design**: Fluid UI adapting from 4K desktops to mobile screens with touch-friendly gestures (Swiper.js).
- **Installable**: Add to home screen on iOS, Android, Windows, and macOS. Works offline via Service Worker caching.

---

### 📖 Usage Guide

#### **Getting Started**

**1. First Visit (Guest Mode)**
- Access the app without logging in.
- All features work with localStorage.
- Set your timezone and basic preferences.
- Track bosses, events, and weekly content immediately.

**2. Creating an Account**
- Click "Login with Discord" in the User Widget (top left).
- Authorize the application.
- Your settings will now sync across devices.
- Unlock cloud-saved teams and custom reminders.

**3. Managing Notifications**
- Go to **Settings** → **Push Notifications**.
- Enable browser notifications when prompted.
- Configure pre-alerts for specific bosses by clicking the bell icon on the timer list.
- Set up custom reminders with personal sounds in the "Reminders" tab.

**4. Using the Hero Compendium**
- Navigate to "Heroes" from the main menu.
- Use filters to find heroes by element, role, rarity, or name.
- Click on hero cards for detailed stats and skins.

**5. Building Teams**
- Go to "Team Builder" in the Heroes section.
- Drag heroes from the list to the team slots.
- Click a slot to designate a leader (gold border).
- Save the team with a custom name and type (Field/Tactical).
- Click the **Share** button to copy a direct link or ID.

---

### 🔧 Technical Stack

The project is built on a modern, modular stack designed for scalability and performance.

#### **Frontend (Client)**
- **Core**: Vanilla JavaScript (ES6 Modules) - Framework-free for maximum performance.
- **Architecture**: Single Page Application (SPA) with a custom Router and centralized State Management (`App.state`).
- **PWA**: Service Worker handling cache strategies (Stale-While-Revalidate) and Web Push API integration.
- **Libraries**:
    - `Luxon`: For robust timezone handling.
    - `Swiper.js`: For mobile touch navigation.

#### **Backend (Server)**
- **Runtime**: **Node.js** with **Express**.
- **Database**: **MariaDB** managed via **Sequelize ORM**.
- **Authentication**: Discord OAuth2 (Authorization Code Grant) with JWT session management.
- **Push Notifications**: Implemented using `web-push` with VAPID keys.
- **File Storage**: `Multer` for handling custom sound file uploads.
- **Cron Jobs**: Server-side scheduled tasks for automated alerts.

#### **API Structure**
- **RESTful API**: Over 30 endpoints.
- **Public**: Game data (bosses, events, heroes).
- **Protected**: User preferences, Team management (`GET/POST/PUT/DELETE`), and Custom Reminders.

---

### 🤝 Contact & Support

Developed by **@olivo28**.

- **Discord Server:** [Join the Community](https://discord.gg/4eKe49CkVS)
- **GitHub:** [olivo28/bnsheroes-timer](https://github.com/olivo28/bnsheroes-timer)
- **Support Me:** Check the "Support Me" section in the app settings to help keep the server running!

---

## Español

### 🌟 Visión General

**BnS Heroes HUB** es la herramienta definitiva y Aplicación Web Progresiva (PWA) diseñada para jugadores de *Blade & Soul Heroes*. Ha evolucionado de ser un simple temporizador a un ecosistema completo que funciona como un **HUB** central de rastreo y un poderoso **Compendio** para la gestión de héroes y construcción de equipos.

Construido con una arquitectura modular en **Vanilla JS (ES6)** y un backend robusto en **Node.js**, cuenta con sincronización en tiempo real, autenticación vía Discord, notificaciones push del servidor y un constructor de equipos avanzado.

### ✨ Demo en Vivo
**[➡️ Abrir App](https://olivo28.github.io/bnsheroes-timer)**

---

### 🚀 Características Principales

#### ⏱️ El HUB (Temporizadores y Rastreo)
- **Timers en Tiempo Real**: Reset Diario, regeneración de Ticket de Duelo y aparición de Jefes de Mundo con mapas y conversión de zona horaria.
- **Rastreo de Eventos**: Guías detalladas, listas de recompensas, rastreadores de misiones y monitoreo de progreso diario/acumulativo.
- **Contenido Semanal**: Información sobre Torre de las Pruebas (recompensas por etapa), Batallas de Facción y rotación de jefes en Prueba Táctica.
- **Integración con Twitch**: Botón flotante (FAB) que avisa cuando streamers seleccionados están en vivo.

#### 🦸 Compendio de Héroes y Constructor
- **Base de Datos Completa**: Explora todos los héroes con filtros avanzados (Elemento, Rol, Rareza) y búsqueda instantánea.
- **Detalles de Héroe**: Visualiza estadísticas, visor de skins, rango de ataque y enlaces a héroes relacionados.
- **Constructor de Equipos Interactivo**: 
    - Interfaz "arrastrar y soltar" (Drag-and-Drop) para crear equipos de 5 héroes.
    - Gestión de líder y categorización de equipos (Campo/Táctico).
    - **Sistema de Compartir**: Genera **Deep Links** (ej. `?teamId=123`) para compartir tus composiciones al instante.
- **Biblioteca de Equipos**: Guarda, edita, filtra y gestiona tus equipos en la nube.

#### 🔐 Cuentas y Sincronización en la Nube
- **Login con Discord**: Autenticación segura y rápida.
- **Sincronización Multi-Dispositivo**: Tus ajustes, timers, equipos guardados y preferencias se sincronizan al instante entre PC, móvil y tablet.
- **Tarjeta de Jugador**: Personaliza tu perfil con tu Nombre en el Juego (IGN), Servidor (NA/EU/ASIA) y Apodo.
- **Modo Invitado**: Funcionalidad completa para usuarios no registrados con persistencia local.

#### 🔔 Sistema de Notificaciones Avanzado
- **Push desde el Servidor**: Notificaciones fiables entregadas incluso cuando la app está cerrada.
- **Control Granular**:
    - **Pre-Alertas de Jefes**: Avisos configurables (15m, 5m, 1m antes).
    - **Resets**: Recordatorios automáticos para reinicios Diarios y Semanales.
    - **Misiones de Evento**: Avisos horas antes del reset para completar tus misiones.
    - **Ticket de Showdown**: Alerta cuando tu ticket se ha regenerado.
- **Recordatorios Personalizados**: Crea alarmas personales con etiquetas y **sube tus propios archivos de sonido** (hasta 5MB) para una experiencia única.

#### 📱 Experiencia Nativa (PWA)
- **Navegación App**: Barra de navegación inferior fija en móviles y barra lateral en escritorio.
- **Diseño Responsivo**: Interfaz fluida adaptable desde 4K hasta móviles, con gestos táctiles (Swiper.js).
- **Instalable**: Añádelo a tu pantalla de inicio en iOS, Android y Windows. Funciona offline gracias al caché del Service Worker.

---

### 📖 Guía de Uso

#### **Primeros Pasos**

**1. Primera Visita (Modo Invitado)**
- Accede a la app sin iniciar sesión.
- Todas las funciones operan con almacenamiento local (localStorage).
- Configura tu zona horaria y preferencias básicas.
- Rastrea jefes, eventos y contenido semanal de inmediato.

**2. Crear una Cuenta**
- Haz clic en "Iniciar sesión con Discord" en el widget de usuario (arriba a la izquierda).
- Autoriza la aplicación.
- Tus configuraciones ahora se sincronizarán entre dispositivos.
- Desbloquea el guardado de equipos en la nube y recordatorios personalizados.

**3. Gestionar Notificaciones**
- Ve a **Ajustes** → **Notificaciones Push**.
- Habilita las notificaciones del navegador cuando se solicite.
- Configura pre-alertas para jefes específicos haciendo clic en el icono de la campana en la lista.
- Configura recordatorios personalizados con sonidos propios en la pestaña "Recordatorios".

**4. Usar el Compendio de Héroes**
- Navega a "Héroes" desde el menú principal.
- Usa filtros para encontrar héroes por elemento, rol, rareza o nombre.
- Haz clic en las tarjetas de héroe para ver estadísticas detalladas y skins.

**5. Construir Equipos**
- Ve a "Constructor de Equipos" en la sección de Héroes.
- Arrastra héroes de la lista a los espacios del equipo.
- Haz clic en un espacio para designar al líder (borde dorado).
- Guarda el equipo con un nombre y tipo (Campo/Táctico).
- Haz clic en el botón **Compartir** para copiar un enlace directo o ID.

---

### 🔧 Stack Técnico

El proyecto utiliza un enfoque moderno sin frameworks pesados para garantizar el máximo rendimiento.

#### **Frontend (Cliente)**
- **Core**: JavaScript Puro (Módulos ES6) para una experiencia ligera.
- **Arquitectura**: Single Page Application (SPA) con Router personalizado y gestión de estado centralizada (`App.state`).
- **PWA**: Service Worker manejando estrategias de caché y Web Push API.
- **Librerías**:
    - `Luxon`: Para cálculos precisos de zonas horarias.
    - `Swiper.js`: Para navegación táctil en móviles.

#### **Backend (Servidor)**
- **Runtime**: **Node.js** con **Express**.
- **Base de Datos**: **MariaDB** gestionada vía **Sequelize ORM**.
- **Autenticación**: Integración OAuth2 de Discord con sesiones JWT.
- **Notificaciones**: Protocolo Web Push con claves VAPID.
- **Archivos**: `Multer` para la subida de audio personalizado.
- **Cron Jobs**: Tareas programadas en el servidor para alertas automáticas.

#### **Estructura de la API**
- **API RESTful**: Más de 30 endpoints.
- **Públicos**: Datos del juego (jefes, eventos, héroes).
- **Protegidos**: Preferencias de usuario, Gestión de Equipos y Recordatorios Personalizados.

---

### 🤝 Contacto y Soporte

Desarrollado por **@olivo28**.

- **Servidor de Discord:** [Únete a la Comunidad](https://discord.gg/4eKe49CkVS)
- **GitHub:** [olivo28/bnsheroes-timer](https://github.com/olivo28/bnsheroes-timer)
- **Apóyame:** ¡Revisa la sección "Apóyame" en los ajustes de la app para ayudar a mantener el servidor funcionando!

---

### 📄 Licencia

Este proyecto está licenciado bajo la Licencia ISC.

---

**Última actualización**: 04/12/2025