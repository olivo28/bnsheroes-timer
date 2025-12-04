# BnS Heroes HUB - Project Roadmap

[English](#english) | [Español](#español)

---

## English

Welcome to the official project roadmap for the BnS Heroes HUB! This document outlines our plans for new features and major improvements. Our goal is to create the ultimate companion tool for the BnS Heroes community.

### Status Legend

-   **✅ Completed:** The feature has been implemented and deployed.
-   **🟦 In Progress:** Actively being worked on.
-   **⬜️ Planned:** The feature is approved and waiting for development.
-   **💡 Idea:** An idea being considered for a future release.

---

### 🚀 Recently Completed (v2.0)

We have successfully launched the Compendium and User ecosystem!

-   **✅ Hero Compendium:** Full database with filters (Element, Role, Rarity), instant search, and detailed hero views (skins, stats).
-   **✅ Team Builder:** Drag-and-drop interface, leader selection, team types (Field/Tactical), and cloud saving.
-   **✅ Team Sharing:** Generate unique links/IDs to share teams with the community.
-   **✅ User Profiles:** Custom nicknames, server selection, and avatars.
-   **✅ Custom Reminders:** Upload your own sound files for personalized alarms.

---

### 1. Full Discord Integration

**Priority:** `High` | **Status:** `⬜️ Planned`

The next major phase is to bridge the gap between the Web App and Discord servers.

#### 1.1. Dedicated Discord Bot (`@BNS-HUB-Bot`)
-   `⬜️` **Core Functionality:** Implement a bot that queries real-time data from the web API.
-   `⬜️` **Smart Link Previews (Unfurling):** Automatically detect shared Team URLs (e.g., `?teamId=...`) in chat and generate a visual Embed showing the team composition and leader.
-   `⬜️` **Slash Commands:**
    -   `/timers`: Displays upcoming world bosses.
    -   `/events`: Lists active events.
    -   `/weekly`: Shows weekly content summary.
    -   `/banner`: Shows current/upcoming banners.
    -   `/hero <name>`: Fetches hero stats and images from the Compendium database.

#### 1.2. Webhook Notifications
-   `⬜️` **Automated Boss Alerts:** Backend service to send formatted Discord Embeds to configured channels before a boss spawns.

### 2. Intelligent LFG System

**Priority:** `Medium` | **Status:** `⬜️ Planned`

An automated system to parse LFG messages and notify interested players.

#### 2.1. User LFG Alerts
-   `⬜️` **Web UI:** New section in "My Account" to toggle notifications for specific dungeons/bosses.
-   `⬜️` **Discord Commands:** `/lfg notify add <dungeon>` management.

#### 2.2. Automated Parsing & Pinging
-   `⬜️` **Text Parser:** Identify keywords (e.g., "Naksun", "Hard", "EU", "2 slots") from plain text messages in `#lfg` channels.
-   `⬜️` **Smart Notification:** The bot will repost the request as a clean Embed and tag users who subscribed to that specific content.

### 3. Admin Panel

**Priority:** `High` | **Status:** `⬜️ Planned`

A secure web interface for managing dynamic content without code deployments.

-   `⬜️` **Authentication:** Admin-only login.
-   `⬜️` **Content Management (CRUD):**
    -   **Bosses:** Manage spawn schedules and active status.
    -   **Events:** Create events, missions, and rewards.
    -   **Heroes:** Add new heroes to the database (updating the Compendium instantly).
    -   **Banners:** Schedule future banners.

---

## Español

¡Bienvenido a la hoja de ruta oficial del proyecto BnS Heroes HUB! Este documento detalla nuestros planes para nuevas características. Nuestro objetivo es crear la herramienta definitiva para la comunidad.

### Leyenda de Estado

-   **✅ Completado:** La característica ha sido implementada y desplegada.
-   **🟦 En Progreso:** Se está trabajando activamente en ello.
-   **⬜️ Pendiente:** La característica está aprobada y en espera de desarrollo.
-   **💡 Idea:** Una idea que se está considerando para el futuro.

---

### 🚀 Recientemente Completado (v2.0)

¡Hemos lanzado exitosamente el ecosistema de Compendio y Usuarios!

-   **✅ Compendio de Héroes:** Base de datos completa con filtros (Elemento, Rol, Rareza), búsqueda instantánea y vistas detalladas (skins, estadísticas).
-   **✅ Constructor de Equipos:** Interfaz "arrastrar y soltar", selección de líder, tipos de equipo (Campo/Táctico) y guardado en la nube.
-   **✅ Compartir Equipos:** Generación de enlaces/IDs únicos para compartir composiciones.
-   **✅ Perfiles de Usuario:** Apodos personalizados, selección de servidor y avatares.
-   **✅ Recordatorios Personalizados:** Subida de archivos de sonido propios para alarmas.

---

### 1. Integración Completa con Discord

**Prioridad:** `Alta` | **Estado:** `⬜️ Pendiente`

La próxima gran fase es conectar la Aplicación Web con los servidores de Discord.

#### 1.1. Bot de Discord Dedicado (`@BNS-HUB-Bot`)
-   `⬜️` **Funcionalidad Principal:** Un bot que consulta la API de la web en tiempo real.
-   `⬜️` **Previsualización de Enlaces (Unfurling):** Detectar automáticamente URLs de equipos compartidos en el chat y generar un Embed visual mostrando la composición del equipo y el líder.
-   `⬜️` **Comandos de Barra (`/`):**
    -   `/timers`: Muestra los próximos jefes.
    -   `/events`: Lista eventos activos.
    -   `/weekly`: Resumen semanal.
    -   `/banner`: Banners actuales/próximos.
    -   `/hero <nombre>`: Muestra estadísticas e imágenes del Compendio.

#### 1.2. Notificaciones Webhook
-   `⬜️` **Alertas Automatizadas:** Servicio backend para enviar mensajes formateados (Embeds) a canales configurados antes de que aparezca un jefe.

### 2. Sistema Inteligente de Búsqueda de Grupo (LFG)

**Prioridad:** `Media` | **Estado:** `⬜️ Pendiente`

Un sistema automatizado para leer mensajes de LFG y notificar a jugadores.

#### 2.1. Alertas LFG de Usuario
-   `⬜️` **UI Web:** Nueva sección en "Mi Cuenta" para activar notificaciones de mazmorras específicas.
-   `⬜️` **Comandos Discord:** Gestión mediante `/lfg notify add <mazmorra>`.

#### 2.2. Análisis y Notificación
-   `⬜️` **Parser de Texto:** Identificar palabras clave (ej. "Naksun", "Hard", "EU") en mensajes de texto plano.
-   `⬜️` **Notificación Inteligente:** El bot republicará la solicitud como un Embed limpio y etiquetará a los usuarios suscritos a ese contenido.

### 3. Panel de Administración

**Prioridad:** `Alta` | **Estado:** `⬜️ Pendiente`

Interfaz web segura para gestionar contenido sin tocar código.

-   `⬜️` **Autenticación:** Login seguro para admins.
-   `⬜️` **Gestión de Contenido (CRUD):**
    -   **Jefes:** Gestionar horarios y estado.
    -   **Eventos:** Crear misiones y recompensas.
    -   **Héroes:** Añadir nuevos héroes a la base de datos (actualizando el Compendio al instante).
    -   **Banners:** Programar futuros banners.