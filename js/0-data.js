'use strict';

/**
 * Almacena todas las cadenas de texto para la internacionalización (i18n).
 * Facilita la adición o modificación de idiomas.
 */
const I18N_STRINGS = {
    es: {
        title: "BnS Hereos - HUB/Timer",
        alertsEnabled: "Alertas activadas",
        alertsDisabled: "Alertas denegadas",
        permissionRequired: "Permiso de notif. requerido",
        settingsTitle: "Configuración",
        timersSettingsLabel: "Timers:",
        bossToggleLabel: "Jefes",
        eventsToggleLabel: "Eventos",
        preAlertLabel: "Minutos de Pre-Alerta (para jefes):",
        notificationTypeLabel: "Tipos de Notificación:",
        soundToggleLabel: "Sonido",
        desktopToggleLabel: "Escritorio",
        pushToggleLabel: "Notificaciones Push",
        timezoneLabel: "Mostrar horas en esta Zona Horaria:",
        languageLabel: "Idioma:",
        saveButton: "Guardar",
        testButton: "Probar Alertas",
        dailyResetName: "Reset Diario",
        dailyResetDesc: "El día del juego reinicia en:",
        showdownName: 'Ticket de Showdown',
        showdownDesc: 'Próximo disponible en',
        bossSpawnIn: (loc) => `Spawn en ${loc}`,
        notificationPreAlert: (b, m) => `¡${b} en ${m} min!`,
        notificationPreAlertBody: (l) => `Aparecerá en ${l}.`,
        notificationReset: "¡Reset Diario!",
        notificationResetBody: (t) => `El juego se ha reiniciado. ¡Nuevas misiones diarias disponibles a las ${t}!`,
        notificationBlocked: "Las notificaciones están bloqueadas. Por favor, habilítalas en la configuración de tu navegador/sistema.",
        notificationShowdownReady: "¡Ticket de Showdown Listo!",
        notificationShowdownReadyBody: "Un nuevo ticket de Showdown está disponible.",
        infoModalTitle: "Info del Ticket de Showdown",
        infoModalBody1: "Se recarga <strong>1 ticket cada 2 horas</strong>.",
        infoModalBody2: "La cuenta regresiva de esta app asume que un ticket se usa tan pronto como está disponible. Puedes sincronizar manualmente el tiempo restante si es necesario.",
        infoModalClose: "Cerrar",
        syncModalTitle: "Sincronizar Ticket",
        syncModalDesc: "Introduce el tiempo restante de recarga que ves en el juego para ajustar el temporizador.",
        syncModalHours: "Horas",
        syncModalMinutes: "Minutos",
        syncModalSeconds: "Segundos",
        syncModalButton: "Sincronizar",
        aboutTitle: "Acerca de y Soporte",
        aboutContactTitle: "🤝 Contacto y Soporte",
        aboutContactBody: "Si encuentras útil esta herramienta y te gustaría mostrar tu apoyo, o si necesitas ayuda, puedes encontrarme en el servidor oficial de Discord de BNS Heroes.",
        aboutDiscordHandle: "Mi Discord: @olivo28",
        aboutDiscordServer: "Discord de BNS Heroes:",
        aboutDiscordLinkText: "Únete Aquí",
        aboutDonation: "Las donaciones son bienvenidas, ¡pero nunca obligatorias! Si deseas apoyar el proyecto, o tienes sugerencias y feedback, puedes contactarme directamente por Discord. ¡Tu opinión es el mejor apoyo!",
        aboutDisclaimerTitle: "Aviso Legal",
        aboutDisclaimerBody: "Esta es una herramienta no oficial creada por un fan y no está afiliada, respaldada ni patrocinada por NCSoft o el equipo de desarrollo del juego. Todos los nombres, imágenes y marcas registradas del juego son propiedad de sus respectivos dueños.",
        aboutCloseButton: "Cerrar",
        eventsTitle: "Eventos Activos",
        eventEndsIn: (d) => `termina en ${d}`,
        eventEndsToday: "termina hoy",
        eventTip: "Evento",
        activeBannersTitle: "Banner Activo",
        nextBannerTitle: "Próximo Banner",
        notAnnounced: "Aún sin anunciar",
        bannerEndsIn: (d) => `Finaliza en ${d}`,
        bannerStartsIn: (d) => `Comienza en ${d}`,
        rarity1: "Exaltado",
        rarity2: "Reverenciado",
        rarity3: "Famoso",
        roleAttacker: "Atacante",
        roleDefender: "Defensor",
        roleHealer: "Sanador",
        roleSupporter: "Soporte",
        roleTactician: "Táctico",
        eventMissionsTitle: "Misiones Diarias",
        eventMissionsAndRewardsTitle: "Misiones y Recompensas",
        eventBossRankingRewardsTitle: "Recompensas de Clasificación (Jefe)",
        eventParticipationRewardTitle: "Recompensa por Participación",
        eventRankHeader: "Rango",
        eventRewardHeader: "Recompensa",
        eventWheelRewardsTitle: "Recompensas (Rueda del Destino)",
        eventCumulativeRewardsTitle: "Recompensas Acumulativas",
        eventPossibleRewardsTitle: "Posibles Recompensas",
        pointsSuffix: "Puntos",
        streamWidgetTitle: "Próximo Stream",
        streamWidgetTitle: "Stream de Twitch", // <--- AÑADE ESTA LÍNEA
        streamsModalTitle: "Próximos Streams", // <-- AÑADE ESTA
        noStreamsMessage: "No hay streams programados por el momento.", // <-- AÑADE ESTA
        streamAlertsTitle: "Notificaciones de Stream:", // <-- AÑADE ESTA
        preStreamAlertLabel: "Avisar antes de empezar", // <-- AÑADE ESTA
        postStreamAlertLabel: "Avisar al terminar", // <-- AÑADE ESTA
        notificationPreStream: (name) => `¡${name} comienza en 15 minutos!`, // <-- AÑADE ESTA
        notificationPostStream: (name) => `¡El stream de ${name} ha terminado!`, // <-- AÑADE ESTA
        notificationStreamBody: "Sintoniza el canal oficial de Twitch.", // <-- AÑADE ESTA
        streamStartsIn: "¡Comienza en!",
        streamIsLive: "¡EN VIVO AHORA!",
        goToChannel: "Ir al Canal"
    },
    en: {
        title: "BnS Heroes - HUB/Timer",
        alertsEnabled: "Alerts enabled",
        alertsDisabled: "Alerts denied",
        permissionRequired: "Notif. permission required",
        settingsTitle: "Settings",
        timersSettingsLabel: "Timers:",
        bossToggleLabel: "Bosses",
        eventsToggleLabel: "Events",
        preAlertLabel: "Pre-Alert Minutes (for bosses):",
        notificationTypeLabel: "Notification Types:",
        soundToggleLabel: "Sound",
        desktopToggleLabel: "Desktop",
        pushToggleLabel: "Push Notifications",
        timezoneLabel: "Display times in this Timezone:",
        languageLabel: "Language:",
        saveButton: "Save",
        testButton: "Test Alerts",
        dailyResetName: "Daily Reset",
        dailyResetDesc: "Game day resets in:",
        showdownName: 'Showdown Ticket',
        showdownDesc: 'Next available in',
        bossSpawnIn: (loc) => `Spawns in ${loc}`,
        notificationPreAlert: (b, m) => `${b} in ${m} min!`,
        notificationPreAlertBody: (l) => `Spawning in ${l}.`,
        notificationReset: "Daily Reset!",
        notificationResetBody: (t) => `The game has been reset. New daily missions available at ${t}!`,
        notificationBlocked: "Notifications are blocked. Please enable them in your browser/system settings.",
        notificationShowdownReady: "Showdown Ticket Ready!",
        notificationShowdownReadyBody: "A new Showdown Ticket is now available.",
        infoModalTitle: "Showdown Ticket Info",
        infoModalBody1: "<strong>1 ticket is recharged every 2 hours</strong>.",
        infoModalBody2: "This app's countdown assumes a ticket is used as soon as it's available. You can manually sync the remaining time if needed.",
        infoModalClose: "Close",
        syncModalTitle: "Sync Ticket Timer",
        syncModalDesc: "Enter the remaining recharge time you see in-game to adjust the timer.",
        syncModalHours: "Hours",
        syncModalMinutes: "Minutes",
        syncModalSeconds: "Seconds",
        syncModalButton: "Sync",
        aboutTitle: "About & Support",
        aboutContactTitle: "🤝 Contact & Support",
        aboutContactBody: "If you find this tool useful and would like to show your support, or if you need help, you can find me on the official BNS Heroes Discord server.",
        aboutDiscordHandle: "My Discord: @olivo28",
        aboutDiscordServer: "BNS Heroes Discord:",
        aboutDiscordLinkText: "Join Here",
        aboutDonation: "Donations are welcome, but never required! If you'd like to support the project, or have suggestions and feedback, you can contact me directly on Discord. Your opinion is the best support!",
        aboutDisclaimerTitle: "Disclaimer",
        aboutDisclaimerBody: "This is an unofficial fan-made tool and is not affiliated with, endorsed, or sponsored by NCSoft or the game's development team. All in-game names, images, and trademarks are the property of their respective owners.",
        aboutCloseButton: "Close",
        eventsTitle: "Active Events",
        eventEndsIn: (d) => `ends in ${d} days`,
        eventEndsToday: "ends today",
        eventTip: "Event",
        activeBannersTitle: "Active Banner",
        nextBannerTitle: "Next Banner",
        notAnnounced: "Not yet announced",
        bannerEndsIn: (d) => `Ends in ${d}`,
        bannerStartsIn: (d) => `Starts in ${d}`,
        rarity1: "Exalted",
        rarity2: "Revered",
        rarity3: "Famed",
        roleAttacker: "Attacker",
        roleDefender: "Defender",
        roleHealer: "Healer",
        roleSupporter: "Supporter",
        roleTactician: "Tactician",
        eventMissionsTitle: "Daily Missions",
        eventMissionsAndRewardsTitle: "Missions & Rewards",
        eventBossRankingRewardsTitle: "Boss Ranking Rewards",
        eventParticipationRewardTitle: "Participation Reward",
        eventRankHeader: "Rank",
        eventRewardHeader: "Reward",
        eventWheelRewardsTitle: "Rewards (Wheel of Fate)",
        eventCumulativeRewardsTitle: "Cumulative Rewards",
        eventPossibleRewardsTitle: "Possible Rewards",
        pointsSuffix: "Points",
        streamWidgetTitle: "Twitch Stream", // <--- AÑADE ESTA LÍNEA
        streamsModalTitle: "Upcoming Streams", // <-- AÑADE ESTA
        noStreamsMessage: "No streams scheduled at the moment.", // <-- AÑADE ESTA
        streamAlertsTitle: "Stream Notifications:", // <-- AÑADE ESTA
        preStreamAlertLabel: "Notify before start", // <-- AÑADE ESTA
        postStreamAlertLabel: "Notify on end", // <-- AÑADE ESTA
        notificationPreStream: (name) => `${name} starts in 15 minutes!`, // <-- AÑADE ESTA
        notificationPostStream: (name) => `${name}'s stream has ended!`, // <-- AÑADE ESTA
        notificationStreamBody: "Tune in on the official Twitch channel.", // <-- AÑADE ESTA
        streamWidgetTitle: "Next Stream",
        streamStartsIn: "Starts in!",
        streamIsLive: "LIVE NOW!",
        goToChannel: "Go to Channel"
    }
};

/**
 * Función de ayuda para obtener la zona horaria del sistema.
 * Se necesita aquí para que DEFAULT_CONFIG se pueda inicializar sin dependencias.
 * @returns {string} La zona horaria en formato "+HH:00" o "-HH:00".
 */
function getSystemTimezoneOffset() {
    const o = new Date().getTimezoneOffset();
    return `${o <= 0 ? '+' : '-'}${String(Math.floor(Math.abs(o) / 60)).padStart(2, '0')}:00`;
}

/**
 * Configuración por defecto de la aplicación.
 * Sirve como base y para restaurar valores si la configuración del usuario está corrupta.
 */
const DEFAULT_CONFIG = {
    dailyResetTime: '18:30',
    dailyResetImageUrl: 'style/bnsheroes.webp',
    showdownTicketImageUrl: 'style/ticket-icon.png',
    showBossTimers: false,
    showEvents: false,
    bosses: [
        {
            id: "stalker_jiangshi",
            name: { es: "Jiangshi el Acechador", en: "Stalker Jiangshi" },
            imageUrl: "style/Stalker-Jiangshi.png",
            location: "Everdusk",
            spawnTimes: ['02:00', '05:00', '10:00', '13:00', '19:00', '23:00'],
            alerts: { '02:00': true, '05:00': true, '10:00': true, '13:00': true, '19:00': true, '23:00': true }
        }
    ],
    events: [
        { id: "Field Boss Challenge", name: { es: "Desafío de Jefe de Campo", en: "Field Boss Challenge" }, startDate: '2025-09-30', endDate: '2025-10-14' },
        { id: "Daily Challenge", name: { es: "Desafío Diario", en: "Daily Challenge" }, startDate: '2025-09-30', endDate: '2025-10-14' },
        { id: "Ukapong's Hidden Challenge", name: { es: "El Desafío Oculto de Ukapong", en: "Ukapong's Hidden Challenge" }, startDate: '2025-09-30', endDate: '2025-10-14' }
    ],
    banner: [
        { element: "fire", heroes: "Poharan, Sansu, Yunma Fei", startDate: "2025-09-25", endDate: "2025-10-14" },
        { element: "dark", heroes: "", startDate: "2025-10-14", endDate: "" },
    ],
    displayTimezone: getSystemTimezoneOffset(),
    preAlertMinutes: [15, 5, 1],
    currentLanguage: 'es',
    notificationTypes: { sound: true, desktop: true },
    showdownTicketIntervalHours: 2,
    showdownTicketSync: null,
    use24HourFormat: false,

    streams: [
        {
            id: "halloween_milo_2025",
            name: "CM Milo",
            // La nueva imagen de banner que proporcionaste
            imageUrl: "style/spookymilobanner.jpg",
            twitchChannel: "bladeandsoul", // ¡Asegúrate de que este sea el canal correcto!
            title: { // Este título ahora no se muestra, pero es bueno tenerlo por si acaso.
                es: "Mischief with Milo: SPOOKY EDITION",
                en: "Mischief with Milo: SPOOKY EDITION"
            },
            // Martes, 7 de Octubre de 2025 a las 11:00 AM PDT (que es 18:00 UTC)
            streamTimeUTC: "2025-10-07T18:00:00Z",
            durationHours: 2 // <-- AÑADE ESTA LÍNEA (Duración de 2 horas)

        }
    ]
};