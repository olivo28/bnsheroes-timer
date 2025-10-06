# BnS Heroes - HUB/Timer 
  
[English](#english) | [Español](#español)  
  
---  
  
## English  
  
A comprehensive web dashboard for tracking BnS Heroes game timers, events, banners, and Twitch streams. Features customizable notifications, multi-language support, and responsive design for desktop and mobile.  
  
### ✨ Live Demo  
**[➡️ Try it Here!](https://olivo28.github.io/bnsheroes-timer)**  
  
### Features  
  
#### Core Timers  
- **Daily Reset Timer**: Countdown to daily server reset with notifications  
- **Showdown Ticket Timer**: Tracks ticket availability with manual sync option  
- **Boss Spawn Timers**: Multiple boss spawn schedules with individual alert toggles  
  
#### Events & Content  
- **Active Events Panel**: Real-time display of ongoing game events  
- **Event Details**: Comprehensive mission lists, rewards, and boss rankings  
- **Banner Tracking**: Current and upcoming hero banners with element info  
- **Hero Database**: Complete hero information with rarities, roles, and elements  
  
#### Twitch Integration  
- **Stream Widget**: Displays upcoming official streams  
- **Stream Notifications**: Pre-stream (15 min) and post-stream alerts  
- **Live Status**: Real-time indication when streams are active  
  
#### Notifications & Alerts  
- **Desktop Notifications**: Browser notifications for important events  
- **Sound Alerts**: Audio notifications with customizable alert sound  
- **Pre-Alert System**: Configurable warnings (15, 5, 1 min before boss spawns)  
- **Daily Reset Alerts**: Notification when game day resets  
- **Showdown Ticket Alerts**: Alert when new ticket is available  
  
#### Customization  
- **Timezone Support**: Display all times in your preferred timezone (UTC-12 to UTC+14)  
- **Language Toggle**: Full interface in English or Spanish  
- **Time Format**: Switch between 12h/24h display  
- **Persistent Settings**: All preferences saved in browser cookies  
- **Selective Display**: Toggle boss timers and events on/off  
  
#### Responsive Design  
- **Desktop Layout**: Dual-panel view with primary and secondary timers  
- **Mobile Layout**: Swiper-based navigation with swipeable panels  
- **Adaptive UI**: Automatically adjusts based on screen size and settings  
  
### Technical Architecture  
  
- **Modular JavaScript**: 6-module system (0-data.js through 5-main.js)  
- **Vanilla JS**: No frameworks, pure JavaScript  
- **External Libraries**: Swiper.js for mobile navigation  
- **Data Sources**: JSON files for heroes and events data  
- **State Management**: Centralized state in App object  
- **Cookie Persistence**: Settings saved locally in browser  
  
### How to Use  
  
1. **Open the live demo**  
2. **Grant notification permission** when prompted  
3. **Click settings icon (⚙️)** to configure:  
   - Enable/disable boss timers and events  
   - Set pre-alert minutes (comma-separated)  
   - Choose notification types (sound/desktop)  
   - Select timezone and language  
   - Toggle 12h/24h time format  
4. **Click "Save"** to apply settings  
5. **Interact with events** to see detailed information  
6. **Sync showdown timer** if needed using the sync button  
  
### Browser Compatibility  
  
- Chrome, Firefox, Edge, Safari (desktop & mobile)  
- Requires: ES6 support, cookies enabled, Notification API  
  
### 🤝 Contact & Support  
  
Find me on the official **BNS Heroes** Discord:  
- **Discord:** `@olivo28`  
- **Server:** [Join Here](https://discord.gg/4eKe49CkVS)  
  
Donations welcome but never required! Feedback is the best support.  
  
---  
  
## Español  
  
Un dashboard web completo para rastrear temporizadores, eventos, banners y streams de Twitch de BnS Heroes. Incluye notificaciones personalizables, soporte multiidioma y diseño responsivo para escritorio y móvil.  
  
### ✨ Demo en Vivo  
**[➡️ ¡Pruébalo Aquí!](https://olivo28.github.io/bnsheroes-timer)**  
  
### Características  
  
#### Temporizadores Principales  
- **Timer de Reset Diario**: Cuenta regresiva al reinicio del servidor con notificaciones  
- **Timer de Ticket de Showdown**: Rastrea disponibilidad de tickets con opción de sincronización manual  
- **Timers de Aparición de Jefes**: Múltiples horarios de spawn con alertas individuales  
  
#### Eventos y Contenido  
- **Panel de Eventos Activos**: Visualización en tiempo real de eventos del juego  
- **Detalles de Eventos**: Listas completas de misiones, recompensas y rankings de jefes  
- **Seguimiento de Banners**: Banners actuales y próximos con información de elementos  
- **Base de Datos de Héroes**: Información completa de héroes con rarezas, roles y elementos  
  
#### Integración con Twitch  
- **Widget de Streams**: Muestra próximos streams oficiales  
- **Notificaciones de Stream**: Alertas pre-stream (15 min) y post-stream  
- **Estado en Vivo**: Indicación en tiempo real cuando los streams están activos  
  
#### Notificaciones y Alertas  
- **Notificaciones de Escritorio**: Notificaciones del navegador para eventos importantes  
- **Alertas de Sonido**: Notificaciones de audio con sonido personalizable  
- **Sistema de Pre-Alerta**: Avisos configurables (15, 5, 1 min antes de spawn de jefes)  
- **Alertas de Reset Diario**: Notificación cuando el día del juego se reinicia  
- **Alertas de Ticket de Showdown**: Aviso cuando hay nuevo ticket disponible  
  
#### Personalización  
- **Soporte de Zona Horaria**: Muestra todas las horas en tu zona horaria preferida (UTC-12 a UTC+14)  
- **Cambio de Idioma**: Interfaz completa en inglés o español  
- **Formato de Hora**: Cambia entre formato 12h/24h  
- **Configuración Persistente**: Todas las preferencias guardadas en cookies del navegador  
- **Visualización Selectiva**: Activa/desactiva timers de jefes y eventos  
  
#### Diseño Responsivo  
- **Layout de Escritorio**: Vista de doble panel con temporizadores primarios y secundarios  
- **Layout Móvil**: Navegación basada en Swiper con paneles deslizables  
- **UI Adaptativa**: Se ajusta automáticamente según tamaño de pantalla y configuración  
  
### Arquitectura Técnica  
  
- **JavaScript Modular**: Sistema de 6 módulos (0-data.js hasta 5-main.js)  
- **Vanilla JS**: Sin frameworks, JavaScript puro  
- **Librerías Externas**: Swiper.js para navegación móvil  
- **Fuentes de Datos**: Archivos JSON para datos de héroes y eventos  
- **Gestión de Estado**: Estado centralizado en objeto App  
- **Persistencia con Cookies**: Configuración guardada localmente en el navegador  
  
### Cómo Usar  
  
1. **Abre la demo en vivo**  
2. **Otorga permiso de notificaciones** cuando se solicite  
3. **Haz clic en el ícono de configuración (⚙️)** para configurar:  
   - Activar/desactivar timers de jefes y eventos  
   - Establecer minutos de pre-alerta (separados por comas)  
   - Elegir tipos de notificación (sonido/escritorio)  
   - Seleccionar zona horaria e idioma  
   - Cambiar formato de hora 12h/24h  
4. **Haz clic en "Guardar"** para aplicar configuración  
5. **Interactúa con eventos** para ver información detallada  
6. **Sincroniza el timer de showdown** si es necesario usando el botón de sincronización  
  
### Compatibilidad de Navegadores  
  
- Chrome, Firefox, Edge, Safari (escritorio y móvil)  
- Requiere: Soporte ES6, cookies habilitadas, API de Notificaciones  
  
### 🤝 Contacto y Soporte  
  
Encuéntrame en el Discord oficial de **BNS Heroes**:  
- **Discord:** `@olivo28`  
- **Servidor:** [Únete Aquí](https://discord.gg/4eKe49CkVS)  
  
¡Las donaciones son bienvenidas pero nunca obligatorias! Tu feedback es el mejor apoyo.
