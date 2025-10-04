(function() {
    'use strict';

    // --- I18N STRINGS ---
    const i18n = {
        es: {
            title: "Dashboard de Timers",
            alertsEnabled: "Alertas activadas",
            alertsDisabled: "Alertas denegadas",
            permissionRequired: "Permiso de notif. requerido",
            settingsTitle: "Configuración",
            timersLabel: "Activar Timer de Jefes",
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
        },
        en: {
            title: "Timers Dashboard",
            alertsEnabled: "Alerts enabled",
            alertsDisabled: "Alerts denied",
            permissionRequired: "Notif. permission required",
            settingsTitle: "Settings",
            timersLabel: "Enable Boss Timers",
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
        }
    };

    // --- CONFIGURATION ---
    const defaultConfig = {
        dailyResetTime: '18:30',
        dailyResetImageUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Purple211/v4/59/dd/41/59dd412c-a794-533c-5aae-5a57687f2d76/AppIcon-0-0-1x_U007emarketing-0-8-0-85-220.png/217x0w.webp',
        showdownTicketImageUrl: 'https://cdn-icons-png.flaticon.com/512/291/291213.png', // Se mantiene para las notificaciones
        showBossTimers: false,
        boss: {
            name: "Stalker Jiangshi",
            imageUrl: "https://fizz-download.playnccdn.com/lg/file/heroes/download/199988c567c-1298c0ad-55d5-4011-957e-124cc5c4c1d0",
            location: "Everdusk",
            spawnTimes: ['13:00', '19:00', '23:00', '02:00', '05:00', '10:00'], 
            alerts: { '13:00': true, '19:00': true, '23:00': true, '02:00': true, '05:00': true, '10:00': true }
        },
        displayTimezone: getSystemTimezoneOffset(),
        preAlertMinutes: [15, 5, 1],
        currentLanguage: 'es',
        notificationTypes: { sound: true, desktop: true },
        showdownTicketIntervalHours: 2,
    };
    let config = {};
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    // --- DOM ELEMENTS ---
    const dom = {
        mainWrapper: document.querySelector('.main-wrapper'),
        primaryPanel: document.querySelector('.primary-panel'),
        secondaryPanel: document.querySelector('.secondary-panel'),
        primaryTimersContainer: document.getElementById('primary-timers-container'),
        listContainer: document.getElementById('spawn-list-container'),
        statusBar: document.getElementById('status-bar'),
        modalOverlay: document.getElementById('modal-overlay'),
        settingsButton: document.getElementById('settings-button'),
        saveSettingsBtn: document.getElementById('save-settings-btn'),
        bossTimersToggle: document.getElementById('boss-timers-toggle'),
        preAlertInput: document.getElementById('pre-alert-input'),
        soundToggle: document.getElementById('sound-toggle'),
        desktopToggle: document.getElementById('desktop-toggle'),
        timezoneSelect: document.getElementById('timezone-select'),
        languageSelect: document.getElementById('language-select'),
        testNotificationBtn: document.getElementById('test-notification-btn'),
    };
    const alertSound = new Audio('https://actions.google.com/sounds/v1/alarms/alarm_clock.ogg');
    let alertsShownToday = {};
    let lastResetCycleDay = null;

    // --- INITIALIZATION ---
    document.addEventListener('DOMContentLoaded', () => {
        loadSettings();
        addEventListeners();
        populateSelects();
        updateLanguage();
        requestNotificationPermission();
        setInterval(updateUI, 1000);
        updateUI();
    });

    // --- CORE LOGIC ---
    function updateUI() {
        updateLanguage();
        const now = new Date();
        checkAndPerformDailyReset(now);

        const dailyResetTimer = getDailyResetTimer(now);
        const lastReset = new Date(dailyResetTimer.targetDate.getTime() - 86400000);
        const showdownTicketTimer = getShowdownTicketTimer(now, lastReset);
        
        const primaryTimers = [dailyResetTimer];
        if (config.showBossTimers) {
            dom.mainWrapper.style.width = '830px';
            dom.secondaryPanel.style.opacity = '1';
            dom.secondaryPanel.style.width = '450px';
            dom.secondaryPanel.style.borderLeft = '1px solid var(--border-color)';

            const bossTimers = config.boss.spawnTimes.map(time => {
                const targetDate = getAbsoluteDateFromLocalTime(time);
                return { 
                    type: 'boss', ...config.boss, time, targetDate, 
                    isAlertEnabled: !!config.boss.alerts[time],
                    secondsLeft: Math.floor((targetDate - now) / 1000) 
                };
            }).filter(t => t.secondsLeft > -300);

            const nextActiveBoss = bossTimers.filter(s => s.isAlertEnabled && s.secondsLeft >= 0).sort((a, b) => a.secondsLeft - b.secondsLeft)[0];
            
            if (nextActiveBoss) primaryTimers.push(nextActiveBoss);
            renderPrimaryPanel(primaryTimers);
            
            bossTimers.sort((a, b) => {
                if (a.isAlertEnabled !== b.isAlertEnabled) return a.isAlertEnabled ? -1 : 1;
                return a.secondsLeft - b.secondsLeft;
            });
            renderSecondaryPanel([showdownTicketTimer, ...bossTimers]);
            checkAndTriggerAlerts(now, bossTimers, dailyResetTimer, showdownTicketTimer);
        } else {
            primaryTimers.push(showdownTicketTimer);
            dom.mainWrapper.style.width = '380px';
            dom.secondaryPanel.style.opacity = '0';
            dom.secondaryPanel.style.width = '0px';
            dom.secondaryPanel.style.borderLeft = 'none';
            dom.listContainer.innerHTML = '';
            renderPrimaryPanel(primaryTimers);
            checkAndTriggerAlerts(now, [], dailyResetTimer, showdownTicketTimer);
        }
    }
    
    // --- RENDER FUNCTIONS ---
    function renderPrimaryPanel(timers) {
        dom.primaryTimersContainer.innerHTML = timers.map((timer, index) => {
            const itemClass = index === 0 ? 'main' : 'secondary';
            const color = getCountdownColor(timer.secondsLeft, timer.type);
            const countdown = formatTime(timer.secondsLeft);
            const description = timer.type === 'boss' ? i18n[config.currentLanguage].bossSpawnIn(timer.location) : timer.description;
            const imageDivClass = timer.type === 'ticket' ? 'ticket-image' : 'timer-image';
            
            // --- CAMBIO CLAVE: Lógica de íconos corregida ---
            let imageContent = '';
            if (timer.type === 'ticket') {
                // Para el ticket, usar SIEMPRE el ícono SVG para consistencia visual.
                imageContent = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-9-1.5h5.25m-5.25 0h5.25m-5.25 0h5.25m-5.25 0h5.25M3 4.5h15a2.25 2.25 0 012.25 2.25v10.5a2.25 2.25 0 01-2.25 2.25H3a2.25 2.25 0 01-2.25-2.25V6.75A2.25 2.25 0 013 4.5z" /></svg>`;
            } else {
                // Para los otros timers (Reset, Boss), usar la imagen si existe.
                imageContent = timer.imageUrl ? `<img src="${timer.imageUrl}" alt="${timer.name}">` : '';
            }
            
            return `<div class="primary-timer-item ${itemClass}">
                        <div class="${imageDivClass}">${imageContent}</div>
                        <p class="timer-name">${timer.name}</p>
                        <p class="timer-desc">${description}</p>
                        <p class="timer-countdown" style="color: ${color};">${countdown}</p>
                    </div>`;
        }).join('');
    }

    function renderSecondaryPanel(timers) {
        dom.listContainer.innerHTML = timers.map(timer => {
            const color = getCountdownColor(timer.secondsLeft, timer.type);
            const time = formatTime(timer.secondsLeft);
            const displayTime = formatToAMPM(getDisplayDate(timer.targetDate, config.displayTimezone));

            if (timer.type === 'boss') {
                const tzString = `UTC${config.displayTimezone.replace(':00','')}`;
                const bellIcon = timer.isAlertEnabled ? `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" /></svg>` : `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0M3.17 3.17l17.66 17.66" /></svg>`;
                return `<div class="spawn-item ${!timer.isAlertEnabled ? 'disabled' : ''}">
                            <div class="spawn-item-info">
                                <p class="spawn-item-name">${timer.name}</p>
                                <p class="spawn-item-time">${displayTime} (${tzString})</p>
                            </div>
                            <span class="countdown-timer" style="color: ${color};">${time}</span>
                            <div class="alert-toggle ${timer.isAlertEnabled ? 'enabled' : 'disabled'}" data-time="${timer.time}">${bellIcon}</div>
                        </div>`;
            }
            
            const icon = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-9-1.5h5.25m-5.25 0h5.25m-5.25 0h5.25m-5.25 0h5.25M3 4.5h15a2.25 2.25 0 012.25 2.25v10.5a2.25 2.25 0 01-2.25 2.25H3a2.25 2.25 0 01-2.25-2.25V6.75A2.25 2.25 0 013 4.5z" /></svg>`;
            return `<div class="spawn-item ticket-item">
                        <div class="item-icon">${icon}</div>
                        <div class="spawn-item-info">
                            <p class="spawn-item-name">${timer.name}</p>
                            <p class="spawn-item-time">${timer.description} - ${displayTime}</p>
                        </div>
                        <span class="countdown-timer" style="color: ${color};">${time}</span>
                    </div>`;
        }).join('');
    }

    function getAbsoluteDateFromLocalTime(timeString) { const now = new Date(); const [h, m] = timeString.split(':'); let d = new Date(); d.setHours(h, m, 0, 0); if (d < now) d.setDate(d.getDate() + 1); return d; }
    function getDailyResetTimer(now) { const t = getAbsoluteDateFromLocalTime(config.dailyResetTime); return { type: 'reset', name: i18n[config.currentLanguage].dailyResetName, description: i18n[config.currentLanguage].dailyResetDesc, imageUrl: config.dailyResetImageUrl, targetDate: t, secondsLeft: Math.floor((t - now) / 1000) }; }
    function getShowdownTicketTimer(now, lastReset) { const msSince = now.getTime() - lastReset.getTime(); const intervalMs = config.showdownTicketIntervalHours * 3600000; const nextTime = new Date(lastReset.getTime() + (Math.floor(msSince / intervalMs) + 1) * intervalMs); return { type: 'ticket', name: i18n[config.currentLanguage].showdownName, description: i18n[config.currentLanguage].showdownDesc, targetDate: nextTime, secondsLeft: Math.floor((nextTime - now) / 1000), imageUrl: config.showdownTicketImageUrl }; }
    function loadSettings() { const saved = localStorage.getItem('timersDashboardConfig'); config = JSON.parse(JSON.stringify(defaultConfig)); if (saved) { try { const parsed = JSON.parse(saved); config = { ...config, ...parsed }; config.boss = { ...defaultConfig.boss, ...(parsed.boss || {}) }; config.notificationTypes = { ...defaultConfig.notificationTypes, ...(parsed.notificationTypes || {})}; config.boss.spawnTimes = defaultConfig.boss.spawnTimes; } catch (e) { console.error("Error loading config.", e); } } }
    function saveSettings() { config.showBossTimers = dom.bossTimersToggle.checked; const alerts = dom.preAlertInput.value.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n) && n > 0); config.preAlertMinutes = alerts.length ? alerts.sort((a, b) => b - a) : defaultConfig.preAlertMinutes; config.notificationTypes = { sound: dom.soundToggle.checked, desktop: dom.desktopToggle.checked }; config.displayTimezone = dom.timezoneSelect.value; config.currentLanguage = dom.languageSelect.value; localStorage.setItem('timersDashboardConfig', JSON.stringify(config)); closeModal(); }
    function toggleAlertState(time) { if (config.boss.alerts[time] !== undefined) { config.boss.alerts[time] = !config.boss.alerts[time]; localStorage.setItem('timersDashboardConfig', JSON.stringify(config)); updateUI(); } }
    function openModal() { dom.bossTimersToggle.checked = config.showBossTimers; dom.preAlertInput.value = config.preAlertMinutes.join(', '); dom.soundToggle.checked = config.notificationTypes.sound; dom.desktopToggle.checked = config.notificationTypes.desktop; dom.timezoneSelect.value = config.displayTimezone; dom.languageSelect.value = config.currentLanguage; dom.modalOverlay.classList.add('visible'); }
    function closeModal() { dom.modalOverlay.classList.remove('visible'); updateUI(); }
    function addEventListeners() { dom.settingsButton.addEventListener('click', openModal); dom.modalOverlay.addEventListener('click', e => { if (e.target === dom.modalOverlay) closeModal(); }); dom.saveSettingsBtn.addEventListener('click', saveSettings); dom.listContainer.addEventListener('click', e => { const t = e.target.closest('.alert-toggle'); if (t) toggleAlertState(t.dataset.time); }); dom.testNotificationBtn.addEventListener('click', () => { const lang = i18n[config.currentLanguage]; if (Notification.permission !== 'granted') { requestNotificationPermission(); alert(lang.notificationBlocked); return; } showFullAlert(lang.notificationPreAlert(config.boss.name, 1), lang.notificationPreAlertBody(config.boss.location), config.boss.imageUrl); setTimeout(() => { const rt = formatToAMPM(getDisplayDate(new Date(), config.displayTimezone)); showFullAlert(lang.notificationReset, lang.notificationResetBody(rt), config.dailyResetImageUrl); }, 1000); setTimeout(() => { showFullAlert(lang.notificationShowdownReady, lang.notificationShowdownReadyBody, config.showdownTicketImageUrl); }, 2000); }); window.addEventListener('focus', updateLanguage); }
    function checkAndTriggerAlerts(now, bossTimers, dailyResetTimer, showdownTicketTimer) {
        const time = now.toTimeString().slice(0, 5);
        if (config.showBossTimers) { bossTimers.forEach(spawn => { if (!spawn.isAlertEnabled) return; const cycleKey = `${lastResetCycleDay}-${spawn.time}`; config.preAlertMinutes.forEach(min => { const alertTime = new Date(spawn.targetDate.getTime() - min * 60000).toTimeString().slice(0, 5); const alertKey = `${cycleKey}-${min}`; if (time === alertTime && !alertsShownToday[alertKey]) { const lang = i18n[config.currentLanguage]; showFullAlert(lang.notificationPreAlert(spawn.name, min), lang.notificationPreAlertBody(spawn.location), spawn.imageUrl); alertsShownToday[alertKey] = true; } }); }); } const resetTime = dailyResetTimer.targetDate.toTimeString().slice(0, 5); const resetAlertKey = `${lastResetCycleDay}-reset`; if (time === resetTime && !alertsShownToday[resetAlertKey]) { const lang = i18n[config.currentLanguage]; const displayResetTime = formatToAMPM(getDisplayDate(dailyResetTimer.targetDate, config.displayTimezone)); showFullAlert(lang.notificationReset, lang.notificationResetBody(displayResetTime), dailyResetTimer.imageUrl); alertsShownToday[resetAlertKey] = true; }
        const isSameAsReset = Math.abs(showdownTicketTimer.targetDate.getTime() - dailyResetTimer.targetDate.getTime()) < 5000;
        if (!isSameAsReset) {
            const showdownTime = showdownTicketTimer.targetDate.toTimeString().slice(0, 5);
            const showdownAlertKey = `showdown-${showdownTicketTimer.targetDate.getTime()}`;
            if (time === showdownTime && !alertsShownToday[showdownAlertKey]) {
                const lang = i18n[config.currentLanguage];
                showFullAlert(lang.notificationShowdownReady, lang.notificationShowdownReadyBody, showdownTicketTimer.imageUrl);
                alertsShownToday[showdownAlertKey] = true;
            }
        }
    }
    function checkAndPerformDailyReset(now) { const t = getAbsoluteDateFromLocalTime(config.dailyResetTime); const r = new Date(t); if (now >= r) r.setDate(r.getDate() - 1); const d = r.getDate(); if (lastResetCycleDay !== d) { alertsShownToday = {}; lastResetCycleDay = d; } }
    function populateSelects() { for (let i = 14; i >= -12; i--) { const o = `${i>=0?'+':'-'}${String(Math.abs(i)).padStart(2,'0')}:00`; dom.timezoneSelect.add(new Option(`UTC ${o}`, o)); } dom.languageSelect.innerHTML = `<option value="es">Español</option><option value="en">English</option>`; }
    
    function updateLanguage() {
        const lang = i18n[config.currentLanguage];
        document.title = lang.title;
        document.documentElement.lang = config.currentLanguage;
        
        const desktopLabelKey = isMobile ? 'pushToggleLabel' : 'desktopToggleLabel';
        const desktopToggleSpan = dom.desktopToggle.parentElement.querySelector('span[data-lang-key]');
        if (desktopToggleSpan) {
            desktopToggleSpan.dataset.langKey = desktopLabelKey;
        }

        document.querySelectorAll('[data-lang-key]').forEach(el => { if (lang[el.dataset.langKey]) el.textContent = lang[el.dataset.langKey]; });
        const p = Notification.permission; 
        dom.statusBar.textContent = p === "granted" ? lang.alertsEnabled : (p === "denied" ? lang.alertsDisabled : lang.permissionRequired);
    }

    function requestNotificationPermission() { if (Notification.permission === 'default') Notification.requestPermission().then(updateLanguage); }
    function showFullAlert(title, body, imageUrl) { if (config.notificationTypes.desktop && Notification.permission === 'granted') { new Notification(title, { body, icon: imageUrl, requireInteraction: false }); } if (config.notificationTypes.sound) { alertSound.play().catch(e => console.warn("Sound blocked.")); } }
    function getSystemTimezoneOffset() { const o = new Date().getTimezoneOffset(); return `${o>0?'-':'+'}${String(Math.floor(Math.abs(o/60))).padStart(2,'0')}:00`; }
    function getDisplayDate(d, o) { const u = d.getTime(); const [h, m] = o.replace(':', ' ').split(' '); return new Date(u + (parseInt(h) * 3600 + parseInt(m) * 60) * 1000); }
    function formatToAMPM(d) { let h = d.getUTCHours(); let m = d.getUTCMinutes(); return `${h%12||12}:${String(m).padStart(2,'0')} ${h>=12?'PM':'AM'}`; }
    function formatTime(s) { if (s<0||isNaN(s)) s=0; const h = Math.floor(s/3600); const m = Math.floor((s%3600)/60); const sec = s%60; return [h,m,sec].map(v => String(v).padStart(2,'0')).join(':'); }
    function getCountdownColor(s, type) { if (type === 'boss') { const u = (Math.min(...config.preAlertMinutes)||5)*60; const w = (Math.max(...config.preAlertMinutes)||15)*60; if (s<=u) return 'var(--color-urgent)'; if (s<=w) return 'var(--color-warning)'; } return 'var(--color-normal)'; }

})();