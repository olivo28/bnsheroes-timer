(function () {
    'use strict';

    // --- I18N STRINGS ---
    const i18n = {
        es: {
            title: "Dashboard de Timers",
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
            eventEndsIn: (d) => `termina en ${d} días`,
            eventEndsToday: "termina hoy",
            eventTip: "Evento",
        },
        en: {
            title: "Timers Dashboard",
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
        }
    };

    // --- CONFIGURATION ---
    const defaultConfig = {
        dailyResetTime: '18:30',
        dailyResetImageUrl: 'style/bnsheroes.webp',
        showdownTicketImageUrl: 'style/ticket-icon.png',
        showBossTimers: false,
        showEvents: false,
        boss: {
            name: "Stalker Jiangshi",
            imageUrl: "style/Stalker-Jiangshi.png",
            location: "Everdusk",
            spawnTimes: ['02:00', '05:00', '10:00', '13:00', '19:00', '23:00'],
            alerts: { '02:00': true, '05:00': true, '10:00': true, '13:00': true, '19:00': true, '23:00': true }
        },
        events: [
            { id: "Field Boss Challenge", name: { es: "Desafío de Jefe de Campo", en: "Field Boss Challenge" }, startDate: '2025-09-30', endDate: '2025-10-14' },
            { id: "Daily Challenge", name: { es: "Desafío Diario", en: "Daily Challenge" }, startDate: '2025-09-30', endDate: '2025-10-14' },
            { id: "Ukapong's Hidden Challenge", name: { es: "Desafío Oculto de Ukapong", en: "Ukapong's Hidden Challenge" }, startDate: '2025-09-30', endDate: '2025-10-14' }
        ],
        displayTimezone: getSystemTimezoneOffset(),
        preAlertMinutes: [15, 5, 1],
        currentLanguage: 'es',
        notificationTypes: { sound: true, desktop: true },
        showdownTicketIntervalHours: 2,
        showdownTicketSync: null,
        use24HourFormat: false,
    };
    let config = {};
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    const dom = { mainWrapper: document.querySelector('.main-wrapper'), primaryPanel: document.querySelector('.primary-panel'), secondaryPanel: document.querySelector('.secondary-panel'), primaryTimersContainer: document.getElementById('primary-timers-container'), listContainer: document.getElementById('spawn-list-container'), eventsContainer: document.getElementById('events-container'), statusBar: document.getElementById('status-bar'), modalOverlay: document.getElementById('modal-overlay'), settingsButton: document.getElementById('settings-button'), saveSettingsBtn: document.getElementById('save-settings-btn'), bossTimersToggle: document.getElementById('boss-timers-toggle'), eventsToggle: document.getElementById('events-toggle'), preAlertInput: document.getElementById('pre-alert-input'), soundToggle: document.getElementById('sound-toggle'), desktopToggle: document.getElementById('desktop-toggle'), timezoneSelect: document.getElementById('timezone-select'), languageSelect: document.getElementById('language-select'), timeFormatSwitch: document.getElementById('time-format-switch'), testNotificationBtn: document.getElementById('test-notification-btn'), infoModalOverlay: document.getElementById('info-modal-overlay'), infoModalTitle: document.getElementById('info-modal-title'), infoModalBody1: document.getElementById('info-modal-body1'), infoModalBody2: document.getElementById('info-modal-body2'), closeInfoBtn: document.getElementById('close-info-btn'), syncModalOverlay: document.getElementById('sync-modal-overlay'), syncHours: document.getElementById('sync-hours'), syncMinutes: document.getElementById('sync-minutes'), syncSeconds: document.getElementById('sync-seconds'), saveSyncBtn: document.getElementById('save-sync-btn'), currentTime: document.getElementById('current-time'), aboutButton: document.getElementById('about-button'), aboutModalOverlay: document.getElementById('about-modal-overlay'), closeAboutBtn: document.getElementById('close-about-btn'), };
    const alertSound = new Audio('https://actions.google.com/sounds/v1/alarms/alarm_clock.ogg');
    let alertsShownToday = {};
    let lastResetCycleDay = null;

    document.addEventListener('DOMContentLoaded', () => { loadSettings(); addEventListeners(); populateSelects(); updateLanguage(); requestNotificationPermission(); setInterval(updateUI, 1000); updateUI(); });

    function updateUI() {
        updateLanguage();
        dom.timeFormatSwitch.checked = config.use24HourFormat;
        const now = new Date();

        const currentDateString = formatDateToLocaleDateString(now, config.displayTimezone, config.currentLanguage);
        const currentTimeString = formatDateToTimezoneString(now, config.displayTimezone, true);
        const tzString = `UTC${config.displayTimezone.replace(':00', '')}`;
        dom.currentTime.innerHTML = `<div class="datetime-stack"><span>${currentDateString}</span><span>${currentTimeString}</span></div><span class="timezone-abbr">${tzString}</span>`;

        checkAndPerformDailyReset(now);
        const dailyResetTimer = getDailyResetTimer(now);
        const lastReset = new Date(dailyResetTimer.targetDate.getTime() - (24 * 60 * 60 * 1000));
        const showdownTicketTimer = getShowdownTicketTimer(now, lastReset);
        
        const showSecondaryPanel = config.showBossTimers || config.showEvents;

        if (showSecondaryPanel) {
            dom.mainWrapper.style.width = '860px'; 
            dom.secondaryPanel.style.opacity = '1'; 
            dom.secondaryPanel.style.width = '480px'; 
            dom.secondaryPanel.style.borderLeft = '1px solid var(--border-color)';
        } else {
            dom.mainWrapper.style.width = '380px'; 
            dom.secondaryPanel.style.opacity = '0'; 
            dom.secondaryPanel.style.width = '0px'; 
            dom.secondaryPanel.style.borderLeft = 'none';
        }

        if (config.showEvents) {
            dom.eventsContainer.style.display = 'block';
            renderEventsPanel();
        } else {
            dom.eventsContainer.style.display = 'none';
        }
        
        const primaryTimers = [dailyResetTimer];
        let secondaryPanelItems = [];
        let bossTimers = [];

        if (config.showBossTimers) {
            bossTimers = config.boss.spawnTimes.map(time => {
                const targetDate = getAbsoluteDateFromReferenceTimezone(time, -4);
                return { type: 'boss', ...config.boss, time, targetDate, isAlertEnabled: !!config.boss.alerts[time], secondsLeft: Math.floor((targetDate - now) / 1000) };
            }).filter(t => t.secondsLeft > -300);

            const nextActiveBoss = bossTimers.filter(s => s.isAlertEnabled && s.secondsLeft >= 0).sort((a, b) => a.secondsLeft - b.secondsLeft)[0];
            if (nextActiveBoss) {
                primaryTimers.push(nextActiveBoss);
            }
            
            secondaryPanelItems.push(showdownTicketTimer);
            
            bossTimers.sort((a, b) => { 
                if (a.isAlertEnabled !== b.isAlertEnabled) return a.isAlertEnabled ? -1 : 1; 
                return a.secondsLeft - b.secondsLeft; 
            });
            secondaryPanelItems.push(...bossTimers);

        } else {
            primaryTimers.push(showdownTicketTimer);
        }

        renderPrimaryPanel(primaryTimers);
        
        if (config.showBossTimers || config.showEvents) {
            renderSecondaryPanel(secondaryPanelItems);
        } else {
            dom.listContainer.innerHTML = '';
        }
        
        checkAndTriggerAlerts(now, bossTimers, dailyResetTimer, showdownTicketTimer);
    }

    function renderPrimaryPanel(timers) {
        const infoIconSVG = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" /></svg>`;
        const syncIconSVG = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125" /></svg>`;
        dom.primaryTimersContainer.innerHTML = timers.map((timer, index) => {
            const itemClass = index === 0 ? 'main' : 'secondary';
            const color = getCountdownColor(timer.secondsLeft, timer.type);
            const countdown = formatTime(timer.secondsLeft);
            const description = timer.type === 'boss' ? i18n[config.currentLanguage].bossSpawnIn(timer.location) : timer.description;
            const imageDivClass = timer.type === 'ticket' ? 'ticket-image' : 'timer-image';
            let imageContent = timer.type === 'ticket' ? `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-9-1.5h5.25m-5.25 0h5.25m-5.25 0h5.25m-5.25 0h5.25M3 4.5h15a2.25 2.25 0 012.25 2.25v10.5a2.25 2.25 0 01-2.25 2.25H3a2.25 2.25 0 01-2.25-2.25V6.75A2.25 2.25 0 013 4.5z" /></svg>` : (timer.imageUrl ? `<img src="${timer.imageUrl}" alt="${timer.name}">` : '');
            const nameClass = `timer-name ${timer.type === 'boss' ? 'timer-name-boss' : timer.type === 'ticket' ? 'timer-name-ticket' : ''}`;
            
            const displayTime = formatDateToTimezoneString(timer.targetDate, config.displayTimezone);
            const timeSpan = timer.type !== 'ticket' ? `<span class="timer-target-time">(${displayTime})</span>` : '';
            const nameItself = `<p class="${nameClass}">${timer.name} ${timeSpan}</p>`;
            
            const nameContent = timer.type === 'ticket'
                ? `<div class="timer-name-container"><p class="${nameClass}">${timer.name}</p><div class="info-button">${infoIconSVG}</div></div>`
                : nameItself;

            const countdownContent = timer.type === 'ticket' ? `<div class="timer-countdown-container"><p class="timer-countdown" style="color: ${color};">${countdown}</p><div class="sync-button">${syncIconSVG}</div></div>` : `<p class="timer-countdown" style="color: ${color};">${countdown}</p>`;
            return `<div class="primary-timer-item ${itemClass}"><div class="${imageDivClass}">${imageContent}</div>${nameContent}<p class="timer-desc">${description}</p>${countdownContent}</div>`;
        }).join('');
    }

    function renderSecondaryPanel(timers) {
        dom.listContainer.innerHTML = timers.map(timer => {
            const color = getCountdownColor(timer.secondsLeft, timer.type); const time = formatTime(timer.secondsLeft); const displayTime = formatDateToTimezoneString(timer.targetDate, config.displayTimezone);
            if (timer.type === 'boss') {
                const tzString = `UTC${config.displayTimezone.replace(':00', '')}`;
                const bellIcon = timer.isAlertEnabled ? `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" /></svg>` : `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0M3.17 3.17l17.66 17.66" /></svg>`;
                const bossIcon = `<div class="spawn-item-icon"><img src="${timer.imageUrl}" alt="${timer.name}"></div>`;
                let eventTip = '';
                if (timer.name === "Stalker Jiangshi" && isEventActive("Field Boss Challenge")) {
                    eventTip = `<span class="event-tip">${i18n[config.currentLanguage].eventTip}</span>`;
                }
                return `<div class="spawn-item ${!timer.isAlertEnabled ? 'disabled' : ''}">${bossIcon}<div class="spawn-item-info"><p class="spawn-item-name spawn-item-name-boss">${timer.name} ${eventTip}</p><p class="spawn-item-time">${displayTime} (${tzString})</p></div><span class="countdown-timer" style="color: ${color};">${time}</span><div class="alert-toggle ${timer.isAlertEnabled ? 'enabled' : 'disabled'}" data-time="${timer.time}">${bellIcon}</div></div>`;
            }
            const icon = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-9-1.5h5.25m-5.25 0h5.25m-5.25 0h5.25m-5.25 0h5.25M3 4.5h15a2.25 2.25 0 012.25 2.25v10.5a2.25 2.25 0 01-2.25 2.25H3a2.25 2.25 0 01-2.25-2.25V6.75A2.25 2.25 0 013 4.5z" /></svg>`; const infoIconSVG = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" /></svg>`; const syncIconSVG = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125" /></svg>`; const nameContent = `<div class="spawn-item-name-container"><p class="spawn-item-name spawn-item-name-ticket">${timer.name}</p><div class="info-button">${infoIconSVG}</div></div>`; const countdownContent = `<div class="countdown-container"><span class="countdown-timer" style="color: ${color};">${time}</span><div class="sync-button">${syncIconSVG}</div></div>`; return `<div class="spawn-item ticket-item"><div class="item-icon">${icon}</div><div class="spawn-item-info">${nameContent}<p class="spawn-item-time">${timer.description}</p></div>${countdownContent}</div>`;
        }).join('');
    }
    
    function renderEventsPanel() {
        const lang = i18n[config.currentLanguage];
        const now = new Date();
        let html = `<h3 class="panel-subtitle">${lang.eventsTitle}</h3>`;
        let activeEventCount = 0;
        
        config.events.forEach(event => {
            const endDate = new Date(event.endDate + 'T23:59:59Z');
            if (now > endDate) return;
            
            activeEventCount++;
            const daysLeft = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
            const countdownText = daysLeft > 1 ? lang.eventEndsIn(daysLeft) : (daysLeft === 1 ? lang.eventEndsToday : lang.eventEndsIn(daysLeft));

            html += `
                <div class="event-item">
                    <span class="event-name">${event.name[config.currentLanguage]}</span>
                    <span class="event-countdown">${countdownText}</span>
                </div>
            `;
        });
        
        if (activeEventCount === 0) {
            dom.eventsContainer.style.display = 'none';
        } else {
            dom.eventsContainer.innerHTML = html;
        }
    }
    
    function isEventActive(eventName) {
        const now = new Date();
        const event = config.events.find(e => e.id === eventName);
        if (!event) return false;
        
        const startDate = new Date(event.startDate + 'T00:00:00Z');
        const endDate = new Date(event.endDate + 'T23:59:59Z');
        
        return now >= startDate && now <= endDate;
    }

    function getAbsoluteDateFromUTCTime(timeString) { const now = new Date(); const [h, m] = timeString.split(':').map(Number); let targetDate = new Date(); targetDate.setUTCHours(h, m, 0, 0); if (targetDate < now) { targetDate.setUTCDate(targetDate.getUTCDate() + 1); } return targetDate; }
    function getAbsoluteDateFromReferenceTimezone(timeString, referenceOffsetHours) { const now = new Date(); const [h, m] = timeString.split(':').map(Number); const utcHour = h - referenceOffsetHours; let targetDate = new Date(); targetDate.setUTCHours(utcHour, m, 0, 0); if (targetDate < now) { targetDate.setUTCDate(targetDate.getUTCDate() + 1); } return targetDate; }
    function getDailyResetTimer(now) { const t = getAbsoluteDateFromReferenceTimezone(config.dailyResetTime, -4); return { type: 'reset', name: i18n[config.currentLanguage].dailyResetName, description: i18n[config.currentLanguage].dailyResetDesc, imageUrl: config.dailyResetImageUrl, targetDate: t, secondsLeft: Math.floor((t - now) / 1000) }; }
    function getShowdownTicketTimer(now, lastReset) { const intervalMs = config.showdownTicketIntervalHours * 3600000; let nextTime; if (config.showdownTicketSync && config.showdownTicketSync > lastReset.getTime()) { const syncAnchor = config.showdownTicketSync; const msSinceSync = now.getTime() - syncAnchor; if (msSinceSync > 0) { const intervalsPassed = Math.floor(msSinceSync / intervalMs); nextTime = new Date(syncAnchor + (intervalsPassed + 1) * intervalMs); } else { nextTime = new Date(syncAnchor); } } else { const msSinceReset = now.getTime() - lastReset.getTime(); const intervalsSinceReset = Math.floor(msSinceReset / intervalMs); nextTime = new Date(lastReset.getTime() + (intervalsSinceReset + 1) * intervalMs); } return { type: 'ticket', name: i18n[config.currentLanguage].showdownName, description: i18n[config.currentLanguage].showdownDesc, targetDate: nextTime, secondsLeft: Math.floor((nextTime - now) / 1000), imageUrl: config.showdownTicketImageUrl }; }
    
    function loadSettings() { 
        let tempConfig = JSON.parse(JSON.stringify(defaultConfig)); 
        const savedJSON = getCookie('timersDashboardConfig'); 
        if (savedJSON) { 
            try { 
                const savedConfig = JSON.parse(savedJSON); 
                tempConfig = { ...defaultConfig, ...savedConfig }; 
                tempConfig.boss = { ...defaultConfig.boss, ...(savedConfig.boss || {}) }; 
                tempConfig.notificationTypes = { ...defaultConfig.notificationTypes, ...(savedConfig.notificationTypes || {}) }; 
                // Ensure the events list is always fresh from the code, not from a potentially outdated cookie.
                tempConfig.events = defaultConfig.events;
            } catch (e) { 
                console.error("Error al cargar la configuración de la cookie.", e); 
            } 
        } 
        config = tempConfig; 
    }

    function saveConfigToCookie() { setCookie('timersDashboardConfig', JSON.stringify(config), 365); }
    function saveSettings() { config.showBossTimers = dom.bossTimersToggle.checked; config.showEvents = dom.eventsToggle.checked; const alerts = dom.preAlertInput.value.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n) && n > 0); config.preAlertMinutes = alerts.length ? alerts.sort((a, b) => b - a) : defaultConfig.preAlertMinutes; config.notificationTypes = { sound: dom.soundToggle.checked, desktop: dom.desktopToggle.checked }; config.displayTimezone = dom.timezoneSelect.value; config.currentLanguage = dom.languageSelect.value; saveConfigToCookie(); closeModal(); }
    function toggleAlertState(time) { if (config.boss.alerts[time] !== undefined) { config.boss.alerts[time] = !config.boss.alerts[time]; saveConfigToCookie(); updateUI(); } }
    function saveSyncData() { const h = parseInt(dom.syncHours.value) || 0; const m = parseInt(dom.syncMinutes.value) || 0; const s = parseInt(dom.syncSeconds.value) || 0; const remainingSeconds = (h * 3600) + (m * 60) + s; const now = new Date().getTime(); config.showdownTicketSync = now + (remainingSeconds * 1000); saveConfigToCookie(); closeSyncModal(); updateUI(); }
    function checkAndPerformDailyReset(now) { const t = getAbsoluteDateFromReferenceTimezone(config.dailyResetTime, -4); const r = new Date(t); if (now >= r) { r.setUTCDate(r.getUTCDate() - 1); } const d = r.getUTCDate(); if (lastResetCycleDay !== null && lastResetCycleDay !== d) { alertsShownToday = {}; if (config.showdownTicketSync) { config.showdownTicketSync = null; saveConfigToCookie(); } } lastResetCycleDay = d; }
    function openModal() { dom.bossTimersToggle.checked = config.showBossTimers; dom.eventsToggle.checked = config.showEvents; dom.preAlertInput.value = config.preAlertMinutes.join(', '); dom.soundToggle.checked = config.notificationTypes.sound; dom.desktopToggle.checked = config.notificationTypes.desktop; dom.timezoneSelect.value = config.displayTimezone; dom.languageSelect.value = config.currentLanguage; dom.modalOverlay.classList.add('visible'); }
    function closeModal() { dom.modalOverlay.classList.remove('visible'); updateUI(); }
    function openInfoModal() { const lang = i18n[config.currentLanguage]; dom.infoModalTitle.textContent = lang.infoModalTitle; dom.infoModalBody1.innerHTML = lang.infoModalBody1; dom.infoModalBody2.innerHTML = lang.infoModalBody2; dom.closeInfoBtn.textContent = lang.infoModalClose; dom.infoModalOverlay.classList.add('visible'); }
    function closeInfoModal() { dom.infoModalOverlay.classList.remove('visible'); }
    function openSyncModal() { dom.syncHours.value = ''; dom.syncMinutes.value = ''; dom.syncSeconds.value = ''; dom.syncModalOverlay.classList.add('visible'); dom.syncHours.focus(); }
    function closeSyncModal() { dom.syncModalOverlay.classList.remove('visible'); }
    function openAboutModal() { const lang = i18n[config.currentLanguage]; document.getElementById('about-modal-title').textContent = lang.aboutTitle; document.getElementById('about-contact-title').textContent = lang.aboutContactTitle; document.getElementById('about-contact-body').textContent = lang.aboutContactBody; document.getElementById('about-discord-handle').textContent = lang.aboutDiscordHandle; document.getElementById('about-discord-server').textContent = lang.aboutDiscordServer; document.getElementById('about-discord-link').textContent = lang.aboutDiscordLinkText; document.getElementById('about-donation').textContent = lang.aboutDonation; document.getElementById('about-disclaimer-title').textContent = lang.aboutDisclaimerTitle; document.getElementById('about-disclaimer-body').textContent = lang.aboutDisclaimerBody; dom.closeAboutBtn.textContent = lang.aboutCloseButton; dom.aboutModalOverlay.classList.add('visible'); }
    function closeAboutModal() { dom.aboutModalOverlay.classList.remove('visible'); }
    function addEventListeners() {
        const mainContainer = document.querySelector('.main-wrapper'); mainContainer.addEventListener('click', e => { const infoBtn = e.target.closest('.info-button'); const syncBtn = e.target.closest('.sync-button'); const alertToggle = e.target.closest('.alert-toggle'); if (infoBtn) openInfoModal(); if (syncBtn) openSyncModal(); if (alertToggle) toggleAlertState(alertToggle.dataset.time); });
        dom.settingsButton.addEventListener('click', openModal);
        dom.modalOverlay.addEventListener('click', e => { if (e.target === dom.modalOverlay) closeModal(); });
        dom.saveSettingsBtn.addEventListener('click', saveSettings);
        dom.timeFormatSwitch.addEventListener('change', () => { config.use24HourFormat = dom.timeFormatSwitch.checked; saveConfigToCookie(); updateUI(); });
        dom.testNotificationBtn.addEventListener('click', () => { const lang = i18n[config.currentLanguage]; if (Notification.permission !== 'granted') { requestNotificationPermission(); alert(lang.notificationBlocked); return; } showFullAlert(lang.notificationPreAlert(config.boss.name, 1), lang.notificationPreAlertBody(config.boss.location), config.boss.imageUrl); setTimeout(() => { const rt = formatDateToTimezoneString(new Date(), config.displayTimezone); showFullAlert(lang.notificationReset, lang.notificationResetBody(rt), config.dailyResetImageUrl); }, 1000); setTimeout(() => { showFullAlert(lang.notificationShowdownReady, lang.notificationShowdownReadyBody, config.showdownTicketImageUrl); }, 2000); }); window.addEventListener('focus', updateLanguage);
        dom.infoModalOverlay.addEventListener('click', e => { if (e.target === dom.infoModalOverlay) closeInfoModal(); });
        dom.closeInfoBtn.addEventListener('click', closeInfoModal);
        dom.syncModalOverlay.addEventListener('click', e => { if (e.target === dom.syncModalOverlay) closeSyncModal(); });
        dom.saveSyncBtn.addEventListener('click', saveSyncData);
        dom.aboutButton.addEventListener('click', openAboutModal);
        dom.closeAboutBtn.addEventListener('click', closeAboutModal);
        dom.aboutModalOverlay.addEventListener('click', e => { if (e.target === dom.aboutModalOverlay) closeAboutModal(); });
    }
    function checkAndTriggerAlerts(now, bossTimers, dailyResetTimer, showdownTicketTimer) { if (config.showBossTimers) { bossTimers.forEach(spawn => { if (!spawn.isAlertEnabled) return; const cycleKey = `${lastResetCycleDay}-${spawn.time}`; config.preAlertMinutes.forEach(min => { const alertTime = new Date(spawn.targetDate.getTime() - min * 60000).toTimeString().slice(0, 5); const alertKey = `${cycleKey}-${min}`; if (now.toTimeString().slice(0, 5) === alertTime && !alertsShownToday[alertKey]) { const lang = i18n[config.currentLanguage]; showFullAlert(lang.notificationPreAlert(spawn.name, min), lang.notificationPreAlertBody(spawn.location), spawn.imageUrl); alertsShownToday[alertKey] = true; } }); }); } const resetAlertKey = `${lastResetCycleDay}-reset`; if (dailyResetTimer.secondsLeft <= 0 && dailyResetTimer.secondsLeft > -5 && !alertsShownToday[resetAlertKey]) { const lang = i18n[config.currentLanguage]; const displayResetTime = formatDateToTimezoneString(dailyResetTimer.targetDate, config.displayTimezone); showFullAlert(lang.notificationReset, lang.notificationResetBody(displayResetTime), dailyResetTimer.imageUrl); alertsShownToday[resetAlertKey] = true; } const isSameAsReset = Math.abs(showdownTicketTimer.targetDate.getTime() - dailyResetTimer.targetDate.getTime()) < 5000; const showdownAlertKey = `showdown-${showdownTicketTimer.targetDate.getTime()}`; if (!isSameAsReset && showdownTicketTimer.secondsLeft <= 0 && showdownTicketTimer.secondsLeft > -5 && !alertsShownToday[showdownAlertKey]) { const lang = i18n[config.currentLanguage]; showFullAlert(lang.notificationShowdownReady, lang.notificationShowdownReadyBody, config.showdownTicketImageUrl); alertsShownToday[showdownAlertKey] = true; } }
    function populateSelects() { for (let i = 14; i >= -12; i--) { const o = `${i >= 0 ? '+' : '-'}${String(Math.abs(i)).padStart(2, '0')}:00`; dom.timezoneSelect.add(new Option(`UTC ${o}`, o)); } dom.languageSelect.innerHTML = `<option value="es">Español</option><option value="en">English</option>`; }
    function updateLanguage() { const lang = i18n[config.currentLanguage]; document.title = lang.title; document.documentElement.lang = config.currentLanguage; const desktopLabelKey = isMobile ? 'pushToggleLabel' : 'desktopToggleLabel'; const desktopToggleSpan = document.querySelector('#desktop-toggle + .checkbox-custom + span'); if (desktopToggleSpan) { desktopToggleSpan.dataset.langKey = desktopLabelKey; } document.querySelectorAll('[data-lang-key]').forEach(el => { if (lang[el.dataset.langKey] && typeof lang[el.dataset.langKey] === 'string') el.textContent = lang[el.dataset.langKey]; }); const p = Notification.permission; const statusBarSpan = dom.statusBar.querySelector('span'); if (p === "granted") { statusBarSpan.textContent = lang.alertsEnabled; statusBarSpan.style.color = 'var(--color-success)'; } else if (p === "denied") { statusBarSpan.textContent = lang.alertsDisabled; statusBarSpan.style.color = 'var(--color-danger)'; } else { statusBarSpan.textContent = lang.permissionRequired; statusBarSpan.style.color = 'var(--color-warning)'; } }
    function requestNotificationPermission() { if (Notification.permission === 'default') Notification.requestPermission().then(updateLanguage); }
    function showFullAlert(title, body, imageUrl) { if (config.notificationTypes.desktop && Notification.permission === 'granted') { new Notification(title, { body, icon: imageUrl, requireInteraction: false }); } if (config.notificationTypes.sound) { alertSound.play().catch(e => console.warn("Sound blocked.")); } }
    function getSystemTimezoneOffset() { const o = new Date().getTimezoneOffset(); return `${o <= 0 ? '+' : '-'}${String(Math.floor(Math.abs(o) / 60)).padStart(2, '0')}:00`; }

    function formatDateToLocaleDateString(date, offsetString, lang) {
        try {
            const sign = offsetString.startsWith('-') ? '+' : '-';
            const hours = parseInt(offsetString.substring(1, 3));
            const timeZone = `Etc/GMT${sign}${hours}`;
            const options = {
                timeZone,
                dateStyle: 'short'
            };
            return new Intl.DateTimeFormat(lang, options).format(date);
        } catch (e) {
            console.error("Error formatting date for locale", e);
            return "Invalid Date";
        }
    }

    function formatDateToTimezoneString(date, offsetString, showSeconds = false) {
        try {
            const sign = offsetString.startsWith('-') ? '+' : '-';
            const hours = parseInt(offsetString.substring(1, 3));
            const timeZone = `Etc/GMT${sign}${hours}`;
            const options = {
                timeZone,
                hour: 'numeric',
                minute: '2-digit',
                hour12: !config.use24HourFormat,
            };
            if (showSeconds) {
                options.second = '2-digit';
            }
            return new Intl.DateTimeFormat(config.use24HourFormat ? 'en-GB' : 'en-US', options).format(date);
        } catch (e) {
            console.error("Error formatting date for timezone", e);
            return "Invalid Time";
        }
    }

    function formatTime(s) { if (s < 0 || isNaN(s)) s = 0; const h = Math.floor(s / 3600); const m = Math.floor((s % 3600) / 60); const sec = s % 60; return [h, m, sec].map(v => String(v).padStart(2, '0')).join(':'); }
    function getCountdownColor(s, type) { if (type === 'boss') { const u = (Math.min(...config.preAlertMinutes) || 5) * 60; const w = (Math.max(...config.preAlertMinutes) || 15) * 60; if (s <= u) return 'var(--color-urgent)'; if (s <= w) return 'var(--color-warning)'; } else if (type === 'ticket') { return 'var(--color-primary)'; } return 'var(--color-normal)'; }
    function setCookie(name, value, days) { let expires = ""; if (days) { const date = new Date(); date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000)); expires = "; expires=" + date.toUTCString(); } document.cookie = name + "=" + (value || "") + expires + "; path=/; SameSite=Lax"; }
    function getCookie(name) { const nameEQ = name + "="; const ca = document.cookie.split(';'); for (let i = 0; i < ca.length; i++) { let c = ca[i]; while (c.charAt(0) === ' ') c = c.substring(1, c.length); if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length); } return null; }

})();