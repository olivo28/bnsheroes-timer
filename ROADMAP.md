# BnS Heroes HUB/Timer - Project Roadmap

[English](#english) | [Español](#español)

---

## English

Welcome to the official project roadmap for the BnS Heroes HUB/Timer! This document outlines our plans for new features and major improvements. Our goal is to create the ultimate companion tool for the BnS Heroes community, and your feedback is crucial in shaping this future.

### Status Legend

-   **⬜️ Planned:** The feature is approved and waiting for development.
-   **🟦 In Progress:** Actively being worked on.
-   **✅ Completed:** The feature has been implemented and deployed.
-   **💡 Idea:** An idea being considered for a future release.

---

### 1. Full Discord Integration

**Priority:** `High` | **Status:** `⬜️ Planned`

The objective is to make all the tool's information accessible directly from Discord and allow the app to send automated notifications to community servers.

#### 1.1. Dedicated Discord Bot (`@BNS-Timer-Bot`)
-   `⬜️` **Core Functionality:** Implement a bot that can query real-time data from the same API used by the web app.
-   `⬜️` **Slash Commands:** Create user-friendly commands for quick lookups:
    -   `/timers`: Displays upcoming world bosses and their spawn times.
    -   `/events`: Lists active events and their end dates.
    -   `/weekly`: Shows a summary of weekly content and reset timers.
    -   `/banner`: Shows the current and upcoming hero banners.
-   `💡` **Hero Lookup:** Add a `/hero <name>` command to search the hero database.

#### 1.2. Webhook Notifications (App → Discord)
-   `⬜️` **Automated Boss Alerts:** Develop a backend service that sends a formatted message (using Discord Embeds) to a configured webhook channel minutes before a world boss spawns.
-   `⬜️` **Admin Management:** Add a section in the Admin Panel to manage webhook URLs for different servers.

### 2. Intelligent LFG System

**Priority:** `Medium-High` | **Status:** `⬜️ Planned`

Instead of a manual LFG creator, this system will feature a bot that intelligently monitors an LFG channel, formats user messages, and notifies interested players.

#### 2.1. User LFG Alerts
-   `⬜️` **Web UI:** Create a new section in the "My Account" panel where users can select which dungeons/bosses they want to be notified about.
-   `⬜️` **Discord Commands:** Implement `/lfg notify add <dungeon>` and `/lfg notify remove <dungeon>` for users to manage their alerts directly from Discord.

#### 2.2. Automated Message Processing
-   `⬜️` **Bot Listener:** Configure the bot to read all messages posted in a designated `#lfg` channel.
-   `⬜️` **Text Parser:** Develop a robust parser that uses keywords and regular expressions to extract key information from a plain text message (e.g., `LFG Naksun Hard FREE CARRY / 8000 CP / EU SERVER / 2-4`).
-   `⬜️` **Data Extraction:** The parser will identify the **dungeon/boss**, **CP requirements**, **server/region**, **available slots**, and any additional notes.

#### 2.3. Embed Creation & Pinging
-   `⬜️` **Auto-Embed:** After successfully parsing a message, the bot will create a clean, formatted Discord Embed with the extracted information.
-   `⬜️` **Smart Pings:** The bot will query the database to find all users who have subscribed to alerts for the identified dungeon.
-   `⬜️` **Notification:** The bot will post the Embed in the channel and ping (tag) all interested users in the message body, ensuring they see the group request instantly.

### 3. Admin Panel

**Priority:** `High` | **Status:** `⬜️ Planned`

A secure web interface for managing all dynamic application content, eliminating the need for manual code or JSON file updates.

-   `⬜️` **Authentication:** Create a secure login system for administrators.
-   `⬜️` **Content Management (CRUD):**
    -   **Bosses:** Add, edit, and toggle the active status of world bosses and their spawn times.
    -   **Events:** A comprehensive module to create and manage events, including missions, rewards, exchange shops, and ranking details.
    -   **Weekly Content:** Easily update weekly buffs, stages, boss info, and rewards.
    -   **Banners & Heroes:** Manage the hero database and schedule new banners.
    -   **LFG Data:** Administer the list of dungeons, keywords, and difficulties for the LFG system.

### 4. Historical Archive & Hero Compendium

**Priority:** `Low` | **Status:** `💡 Idea`

Allow users to browse past content and explore a full library of heroes.

-   `💡` **Event & Banner Archive:**
    -   Create a "Past Events" view to see details of events and banners that have already concluded.
    -   Modify the API to serve archived content.
-   `💡` **Hero Compendium:**
    -   A dedicated section in the web app to view all heroes.
    -   Implement search and filter functionality (by rarity, element, role, etc.).
    -   Reuse the existing hero detail modal for a consistent experience.

---
---

## Español

¡Bienvenido a la hoja de ruta oficial del proyecto BnS Heroes HUB/Timer! Este documento detalla nuestros planes para nuevas características y mejoras importantes. Nuestro objetivo es crear la herramienta de acompañamiento definitiva para la comunidad de BnS Heroes, y tu feedback es crucial para dar forma a este futuro.

### Leyenda de Estado

-   **⬜️ Pendiente:** La característica está aprobada y en espera de desarrollo.
-   **🟦 En Progreso:** Se está trabajando activamente en ello.
-   **✅ Completado:** La característica ha sido implementada y desplegada.
-   **💡 Idea:** Una idea que se está considerando para una futura versión.

---

### 1. Integración Completa con Discord

**Prioridad:** `Alta` | **Estado:** `⬜️ Pendiente`

El objetivo es hacer que toda la información de la herramienta sea accesible directamente desde Discord y permitir que la aplicación envíe notificaciones automatizadas a los servidores de la comunidad.

#### 1.1. Bot de Discord Dedicado (`@BNS-Timer-Bot`)
-   `⬜️` **Funcionalidad Principal:** Implementar un bot que pueda consultar datos en tiempo real desde la misma API que utiliza la aplicación web.
-   `⬜️` **Comandos de Barra (`/`):** Crear comandos fáciles de usar para consultas rápidas:
    -   `/timers`: Muestra los próximos jefes mundiales y sus tiempos de aparición.
    -   `/events`: Lista los eventos activos y sus fechas de finalización.
    -   `/weekly`: Muestra un resumen del contenido semanal y los temporizadores de reinicio.
    -   `/banner`: Muestra los banners de héroes actual y próximo.
-   `💡` **Búsqueda de Héroes:** Añadir un comando `/hero <nombre>` para buscar en la base de datos de héroes.

#### 1.2. Notificaciones con Webhooks (App → Discord)
-   `⬜️` **Alertas de Jefes Automatizadas:** Desarrollar un servicio de backend que envíe un mensaje formateado (usando Embeds de Discord) a un canal de webhook configurado minutos antes de que aparezca un jefe mundial.
-   `⬜️` **Gestión de Administrador:** Añadir una sección en el Panel de Administración para gestionar las URLs de los webhooks para diferentes servidores.

### 2. Sistema Inteligente de Búsqueda de Grupo (LFG)

**Prioridad:** `Media-Alta` | **Estado:** `⬜️ Pendiente`

En lugar de un creador manual de LFG, este sistema contará con un bot que monitoriza de forma inteligente un canal LFG, formatea los mensajes de los usuarios y notifica a los jugadores interesados.

#### 2.1. Alertas LFG de Usuario
-   `⬜️` **UI Web:** Crear una nueva sección en el panel "Mi Cuenta" donde los usuarios puedan seleccionar de qué mazmorras/jefes quieren recibir notificaciones.
-   `⬜️` **Comandos de Discord:** Implementar `/lfg notify add <mazmorra>` y `/lfg notify remove <mazmorra>` para que los usuarios gestionen sus alertas directamente desde Discord.

#### 2.2. Procesamiento Automatizado de Mensajes
-   `⬜️` **Escucha del Bot:** Configurar el bot para que lea todos los mensajes publicados en un canal `#lfg` designado.
-   `⬜️` **Analizador de Texto (Parser):** Desarrollar un analizador robusto que utilice palabras clave y expresiones regulares para extraer información clave de un mensaje de texto plano (ej. `LFG Naksun Hard FREE CARRY / 8000 CP / EU SERVER / 2-4`).
-   `⬜️` **Extracción de Datos:** El parser identificará la **mazmorra/jefe**, **requisitos de CP**, **servidor/región**, **plazas disponibles** y cualquier nota adicional.

#### 2.3. Creación de Embeds y Menciones
-   `⬜️` **Auto-Embed:** Tras analizar con éxito un mensaje, el bot creará un Embed de Discord limpio y formateado con la información extraída.
-   `⬜️` **Menciones Inteligentes:** El bot consultará la base de datos para encontrar a todos los usuarios que se hayan suscrito a las alertas para la mazmorra identificada.
-   `⬜️` **Notificación:** El bot publicará el Embed en el canal y mencionará (hará ping) a todos los usuarios interesados en el cuerpo del mensaje, asegurando que vean la solicitud de grupo al instante.

### 3. Panel de Administración

**Prioridad:** `Alta` | **Estado:** `⬜️ Pendiente`

Una interfaz web segura para gestionar todo el contenido dinámico de la aplicación, eliminando la necesidad de actualizar manualmente el código o los archivos JSON.

-   `⬜️` **Autenticación:** Crear un sistema de inicio de sesión seguro para administradores.
-   `⬜️` **Gestión de Contenido (CRUD):**
    -   **Jefes:** Añadir, editar y cambiar el estado (activo/inactivo) de los jefes mundiales y sus horarios.
    -   **Eventos:** Un módulo completo para crear y gestionar eventos, incluyendo misiones, recompensas, tiendas de intercambio y detalles de ranking.
    -   **Contenido Semanal:** Actualizar fácilmente los buffs semanales, etapas, información de jefes y recompensas.
    -   **Banners y Héroes:** Gestionar la base de datos de héroes y programar nuevos banners.
    -   **Datos de LFG:** Administrar la lista de mazmorras, palabras clave y dificultades para el sistema LFG.

### 4. Archivo Histórico y Compendio de Héroes

**Prioridad:** `Baja` | **Estado:** `💡 Idea`

Permitir a los usuarios navegar por contenido pasado y explorar una biblioteca completa de héroes.

-   `💡` **Archivo de Eventos y Banners:**
    -   Crear una vista de "Eventos Pasados" para ver los detalles de eventos y banners que ya han concluido.
    -   Modificar la API para que sirva contenido archivado.
-   `💡` **Compendio de Héroes:**
    -   Una sección dedicada en la aplicación web para ver a todos los héroes.
    -   Implementar funcionalidad de búsqueda y filtrado (por rareza, elemento, rol, etc.).
    -   Reutilizar el modal de detalle de héroe existente para una experiencia consistente.