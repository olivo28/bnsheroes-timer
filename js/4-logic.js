'use strict';

/**
 * Módulo para la lógica de negocio, cálculos de tiempo y gestión de estado.
 */
const Logic = {

    /**
     * Realiza una única llamada a una API de tiempo mundial para calcular el desfase
     * entre el reloj local del usuario y la hora UTC real.
     */
    syncWithWorldTime: async function() {
        const statusBarSpan = App.dom.statusBar.querySelector('span');
        try {
            const response = await fetch('https://worldtimeapi.org/api/timezone/Etc/UTC');
            if (!response.ok) throw new Error('Network response was not ok');
            
            const data = await response.json();
            const worldTimeMs = data.unixtime * 1000;
            const localTimeMs = new Date().getTime();
            
            App.state.timeOffset = worldTimeMs - localTimeMs;

            statusBarSpan.dataset.langKey = 'timeSynced';
            UI.updateLanguage(); // Actualiza el texto inmediatamente
            
            console.log(`Time synced. Local clock offset is ${App.state.timeOffset}ms.`);
        } catch (error) {
            console.error("World time sync failed:", error);
            App.state.timeOffset = 0; // Se revierte a 0 en caso de error
            statusBarSpan.dataset.langKey = 'timeSyncFailed';
            UI.updateLanguage(); // Actualiza el texto para mostrar el error
        }
    },
    
    /**
     * Devuelve un objeto Date que representa la hora actual, corregida por el desfase
     * calculado con la hora mundial.
     * TODAS las funciones de tiempo deben usar esto en lugar de 'new Date()'.
     * @returns {Date} La hora actual corregida.
     */
    getCorrectedNow: function() {
        return new Date(new Date().getTime() + App.state.timeOffset);
    },

    /**
     * Carga la configuración del usuario desde una cookie o usa los valores por defecto.
     */
    loadSettings: function() {
        let tempConfig = JSON.parse(JSON.stringify(DEFAULT_CONFIG));
        const savedJSON = Utils.getCookie('timersDashboardConfig');
        if (savedJSON) {
            try {
                const savedConfig = JSON.parse(savedJSON);
                tempConfig = { ...DEFAULT_CONFIG, ...savedConfig };
                tempConfig.streamAlerts = { ...DEFAULT_CONFIG.streamAlerts, ...(savedConfig.streamAlerts || {}) };
                if (savedConfig.bosses) {
                     tempConfig.bosses = DEFAULT_CONFIG.bosses.map(defaultBoss => {
                        const savedBoss = savedConfig.bosses.find(b => b.id === defaultBoss.id);
                        return savedBoss ? { ...defaultBoss, alerts: { ...defaultBoss.alerts, ...savedBoss.alerts } } : defaultBoss;
                    });
                }
                tempConfig.notificationTypes = { ...DEFAULT_CONFIG.notificationTypes, ...(savedConfig.notificationTypes || {}) };
                tempConfig.events = DEFAULT_CONFIG.events;
                tempConfig.banner = DEFAULT_CONFIG.banner;
                tempConfig.streams = DEFAULT_CONFIG.streams;
            } catch (e) {
                console.error("Error loading settings from cookie.", e);
            }
        }
        App.state.config = tempConfig;
    },

    /**
     * Lee los valores del modal de ajustes, los guarda en el estado y en la cookie.
     */
    saveSettings: function() {
        App.state.config.showBossTimers = App.dom.bossTimersToggle.checked;
        App.state.config.showEvents = App.dom.eventsToggle.checked;
        App.state.config.showWeekly = App.dom.weeklyToggle.checked;
        const alerts = App.dom.preAlertInput.value.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n) && n > 0);
        App.state.config.preAlertMinutes = alerts.length ? alerts.sort((a, b) => b - a) : DEFAULT_CONFIG.preAlertMinutes;
        App.state.config.notificationTypes = { sound: App.dom.soundToggle.checked, desktop: App.dom.desktopToggle.checked };
        App.state.config.displayTimezone = App.dom.timezoneSelect.value;
        App.state.config.currentLanguage = App.dom.languageSelect.value;
        this.saveConfigToCookie();
        UI.closeSettingsModal();
    },

    /**
     * Guarda la configuración actual del estado en una cookie.
     */
    saveConfigToCookie: function() {
        try {
            const configToSave = JSON.parse(JSON.stringify(App.state.config));
            delete configToSave.events;
            delete configToSave.banner;
            delete configToSave.streams;
            Utils.setCookie('timersDashboardConfig', JSON.stringify(configToSave), 365);
        } catch (e) {
            console.error("Error saving settings to cookie.", e);
        }
    },

    /**
     * Cambia el estado de alerta para un jefe y hora específicos y guarda la configuración.
     * @param {string} bossId - ID del jefe.
     * @param {string} time - Hora del spawn ("HH:MM").
     */
    toggleAlertState: function(bossId, time) {
        const bossToUpdate = App.state.config.bosses.find(b => b.id === bossId);
        if (bossToUpdate && bossToUpdate.alerts[time] !== undefined) {
            bossToUpdate.alerts[time] = !bossToUpdate.alerts[time];
            this.saveConfigToCookie();
            UI.updateAll();
        }
    },
    
    /**
     * Guarda el tiempo de sincronización del ticket de Showdown.
     */
    saveSyncData: function() {
        const h = parseInt(App.dom.syncHours.value) || 0;
        const m = parseInt(App.dom.syncMinutes.value) || 0;
        const s = parseInt(App.dom.syncSeconds.value) || 0;
        const remainingSeconds = (h * 3600) + (m * 60) + s;
        const now = this.getCorrectedNow().getTime();
        App.state.config.showdownTicketSync = now + (remainingSeconds * 1000);
        this.saveConfigToCookie();
        UI.closeSyncModal();
        UI.updateAll();
    },

    /**
     * Comprueba y resetea las alertas diarias si ha pasado el reset del juego.
     * @param {Date} now - La fecha y hora actual (ya corregida).
     */
    checkAndPerformDailyReset: function(now) {
        const t = this.getAbsoluteDateFromReferenceTimezone(App.state.config.dailyResetTime);
        const r = new Date(t);
        if (now >= r) {
            r.setUTCDate(r.getUTCDate() - 1);
        }
        const d = r.getUTCDate();
        if (App.state.lastResetCycleDay !== null && App.state.lastResetCycleDay !== d) {
            App.state.alertsShownToday = {};
            if (App.state.config.showdownTicketSync) {
                App.state.config.showdownTicketSync = null;
                this.saveConfigToCookie();
            }
        }
        App.state.lastResetCycleDay = d;
    },
    
    /**
     * Calcula la información para el timer de Reset Diario.
     * @param {Date} now - La fecha y hora actual (ya corregida).
     * @returns {object} El objeto del timer de reset.
     */
    getDailyResetTimer: function(now) {
        const t = this.getAbsoluteDateFromReferenceTimezone(App.state.config.dailyResetTime);
        return {
            type: 'reset',
            name: I18N_STRINGS[App.state.config.currentLanguage].dailyResetName,
            description: I18N_STRINGS[App.state.config.currentLanguage].dailyResetDesc,
            imageUrl: App.state.config.dailyResetImageUrl,
            targetDate: t,
            secondsLeft: Math.floor((t - now) / 1000)
        };
    },

    /**
     * Calcula la información para el timer del Ticket de Showdown.
     * @param {Date} now - La fecha y hora actual (ya corregida).
     * @param {Date} lastReset - La fecha del último reset.
     * @returns {object} El objeto del timer del ticket.
     */
    getShowdownTicketTimer: function(now, lastReset) {
        const config = App.state.config;
        const intervalMs = config.showdownTicketIntervalHours * 3600000;
        let nextTime;
        if (config.showdownTicketSync && config.showdownTicketSync > lastReset.getTime()) {
            const syncAnchor = config.showdownTicketSync;
            const msSinceSync = now.getTime() - syncAnchor;
            if (msSinceSync > 0) {
                const intervalsPassed = Math.floor(msSinceSync / intervalMs);
                nextTime = new Date(syncAnchor + (intervalsPassed + 1) * intervalMs);
            } else {
                nextTime = new Date(syncAnchor);
            }
        } else {
            const msSinceReset = now.getTime() - lastReset.getTime();
            const intervalsSinceReset = Math.floor(msSinceReset / intervalMs);
            nextTime = new Date(lastReset.getTime() + (intervalsSinceReset + 1) * intervalMs);
        }
        return {
            type: 'ticket',
            name: I18N_STRINGS[config.currentLanguage].showdownName,
            description: I18N_STRINGS[config.currentLanguage].showdownDesc,
            targetDate: nextTime,
            secondsLeft: Math.floor((nextTime - now) / 1000),
            imageUrl: config.showdownTicketImageUrl
        };
    },
    
    /**
     * Obtiene una lista de todos los timers de jefes activos y futuros.
     * @param {Date} now - La fecha y hora actual (ya corregida).
     * @returns {Array<object>} Una lista de objetos de timers de jefes.
     */
    getBossTimers: function(now) {
        return App.state.config.bosses.flatMap(boss =>
            boss.spawnTimes.map(time => {
                const targetDate = this.getAbsoluteDateFromReferenceTimezone(time);
                return {
                    type: 'boss',
                    id: boss.id,
                    name: boss.name[App.state.config.currentLanguage],
                    imageUrl: boss.imageUrl,
                    location: boss.location,
                    time,
                    targetDate,
                    isAlertEnabled: !!boss.alerts[time],
                    secondsLeft: Math.floor((targetDate - now) / 1000)
                };
            })
        ).filter(t => t.secondsLeft > -300)
         .sort((a, b) => { 
            if (a.isAlertEnabled !== b.isAlertEnabled) return a.isAlertEnabled ? -1 : 1; 
            return a.secondsLeft - b.secondsLeft; 
        });
    },

    /**
     * Obtiene una lista de todos los timers de reinicio semanal.
     * @param {Date} now - La fecha y hora actual (ya corregida).
     * @returns {Array<object>} Una lista de objetos de timers de reinicio semanal.
     */
    getWeeklyResetTimers: function(now) {
        const weeklyData = App.state.weeklyResetsData;
        if (!weeklyData || !weeklyData.events) {
            return [];
        }
        const lang = App.state.config.currentLanguage;
    
        return weeklyData.events
            .filter(event => event.status && event.status.resetSchedule && event.status.resetSchedule.dayOfWeek)
            .map(event => {
                const resetInfo = event.status.resetSchedule;
                const targetDate = this.getNextWeeklyResetDate(now, resetInfo.dayOfWeek.en, resetInfo.time);
                
                return {
                    type: 'weekly',
                    id: event.id,
                    name: event.eventName[lang],
                    category: event.eventCategory ? event.eventCategory[lang] : '',
                    targetDate: targetDate,
                    secondsLeft: Math.floor((targetDate - now) / 1000)
                };
            }).sort((a, b) => a.secondsLeft - b.secondsLeft);
    },

    /**
     * Comprueba si deben dispararse alertas y las muestra.
     * @param {Date} now - La fecha y hora actual (ya corregida).
     * @param {Array} bossTimers - Lista de timers de jefes.
     * @param {object} dailyResetTimer - Timer de reset.
     * @param {object} showdownTicketTimer - Timer de ticket.
     */
    checkAndTriggerAlerts: function(now, bossTimers, dailyResetTimer, showdownTicketTimer) {
        const config = App.state.config;
        if (config.showBossTimers) {
            bossTimers.forEach(spawn => {
                if (!spawn.isAlertEnabled) return;
                const cycleKey = `${App.state.lastResetCycleDay}-${spawn.id}-${spawn.time}`;
                config.preAlertMinutes.forEach(min => {
                    const alertTime = new Date(spawn.targetDate.getTime() - min * 60000).toTimeString().slice(0, 5);
                    const alertKey = `${cycleKey}-${min}`;
                    if (now.toTimeString().slice(0, 5) === alertTime && !App.state.alertsShownToday[alertKey]) {
                        const lang = I18N_STRINGS[config.currentLanguage];
                        this.showFullAlert(lang.notificationPreAlert(spawn.name, min), lang.notificationPreAlertBody(spawn.location), spawn.imageUrl);
                        App.state.alertsShownToday[alertKey] = true;
                    }
                });
            });
        }
        const resetAlertKey = `${App.state.lastResetCycleDay}-reset`;
        if (dailyResetTimer.secondsLeft <= 0 && dailyResetTimer.secondsLeft > -5 && !App.state.alertsShownToday[resetAlertKey]) {
            const lang = I18N_STRINGS[config.currentLanguage];
            const displayResetTime = Utils.formatDateToTimezoneString(dailyResetTimer.targetDate, config.displayTimezone, config.use24HourFormat);
            this.showFullAlert(lang.notificationReset, lang.notificationResetBody(displayResetTime), dailyResetTimer.imageUrl);
            App.state.alertsShownToday[resetAlertKey] = true;
        }
        const isSameAsReset = Math.abs(showdownTicketTimer.targetDate.getTime() - dailyResetTimer.targetDate.getTime()) < 5000;
        const showdownAlertKey = `showdown-${showdownTicketTimer.targetDate.getTime()}`;
        if (!isSameAsReset && showdownTicketTimer.secondsLeft <= 0 && showdownTicketTimer.secondsLeft > -5 && !App.state.alertsShownToday[showdownAlertKey]) {
            const lang = I18N_STRINGS[config.currentLanguage];
            this.showFullAlert(lang.notificationShowdownReady, lang.notificationShowdownReadyBody, config.showdownTicketImageUrl);
            App.state.alertsShownToday[showdownAlertKey] = true;
        }
        const streamConfig = App.state.config.streamAlerts;
        if (streamConfig && App.state.config.streams) {
            const lang = I18N_STRINGS[App.state.config.currentLanguage];
            App.state.config.streams.forEach(stream => {
                const streamDate = new Date(stream.streamTimeUTC);

                if (streamConfig.preStream) {
                    const preStreamAlertTime = new Date(streamDate.getTime() - 15 * 60000);
                    const preStreamAlertKey = `prestream-${stream.id}`;
                    if (now >= preStreamAlertTime && now < streamDate && !App.state.alertsShownToday[preStreamAlertKey]) {
                        this.showFullAlert(lang.notificationPreStream(stream.name), lang.notificationStreamBody, stream.imageUrl);
                        App.state.alertsShownToday[preStreamAlertKey] = true;
                    }
                }

                if (streamConfig.postStream && stream.durationHours) {
                    const postStreamAlertTime = new Date(streamDate.getTime() + stream.durationHours * 3600000);
                    const postStreamAlertKey = `poststream-${stream.id}`;
                    if (now >= postStreamAlertTime && now < new Date(postStreamAlertTime.getTime() + 60000) && !App.state.alertsShownToday[postStreamAlertKey]) {
                        this.showFullAlert(lang.notificationPostStream(stream.name), lang.notificationStreamBody, stream.imageUrl);
                        App.state.alertsShownToday[postStreamAlertKey] = true;
                    }
                }
            });
        }
    },
    
    /** Solicita permiso para mostrar notificaciones. */
    requestNotificationPermission: function() {
        if (Notification.permission === 'default') {
            Notification.requestPermission().then(UI.updateLanguage);
        }
    },

    /**
     * Muestra una notificación completa (sonido y/o escritorio).
     * @param {string} title - Título de la notificación.
     * @param {string} body - Cuerpo del mensaje.
     * @param {string} imageUrl - URL del ícono.
     */
    showFullAlert: function(title, body, imageUrl) {
        if (App.state.config.notificationTypes.desktop && Notification.permission === 'granted') {
            new Notification(title, { body, icon: imageUrl, requireInteraction: false });
        }
        if (App.state.config.notificationTypes.sound) {
            App.alertSound.play().catch(e => console.warn("Sound blocked by browser."));
        }
    },

    /** Busca un héroe por su nombre en los datos cargados. */
    findHeroByName: (name) => App.state.allHeroesData.find(hero => hero.game_name.toLowerCase() === name.toLowerCase()),

    /** Comprueba si un evento está actualmente activo. */
    isEventActive: function(eventName) {
        const now = this.getCorrectedNow();
        const event = App.state.config.events.find(e => e.id === eventName);
        if (!event) return false;
        
        const startDate = this.getAbsoluteDateWithCustomDate(event.startDate, App.state.config.dailyResetTime);
        const endDate = this.getAbsoluteDateWithCustomDate(event.endDate, App.state.config.dailyResetTime);
        
        return now >= startDate && now <= endDate;
    },

    /**
     * Calcula una fecha absoluta a partir de una fecha, hora y zona horaria de referencia.
     * @param {string} dateString - La fecha en formato "YYYY-MM-DD".
     * @param {string} timeString - La hora en formato "HH:MM".
     * @returns {Date} El objeto Date calculado.
     */
    getAbsoluteDateWithCustomDate: function(dateString, timeString) {
        // Obtenemos la variable global de Luxon
        const DateTime = luxon.DateTime;
        
        // Creamos un objeto Luxon a partir de la fecha y hora, en nuestra zona de referencia
        const [h, m] = timeString.split(':').map(Number);
        const targetDate = DateTime.fromISO(dateString, { zone: App.state.config.referenceTimezone })
            .set({ hour: h, minute: m, second: 0, millisecond: 0 });

        // Devolvemos un objeto Date nativo para mantener la compatibilidad con el resto del código
        return targetDate.toJSDate();
    },
    
    /**
     * Calcula la próxima fecha absoluta para una hora dada en la zona horaria de referencia.
     * @param {string} timeString - La hora en formato "HH:MM".
     * @returns {Date} El objeto Date calculado para hoy o mañana.
     */
    getAbsoluteDateFromReferenceTimezone: function(timeString) {
        // Obtenemos la variable global de Luxon
        const DateTime = luxon.DateTime;
        const config = App.state.config;

        // 1. Tomamos la hora actual (ya corregida) y la interpretamos en la zona horaria de referencia.
        const now = DateTime.fromJSDate(this.getCorrectedNow(), { zone: config.referenceTimezone });

        // 2. Extraemos la hora y minutos del string de entrada.
        const [h, m] = timeString.split(':').map(Number);

        // 3. Creamos una fecha objetivo para "hoy" en la zona de referencia con la hora especificada.
        let targetDate = now.set({ hour: h, minute: m, second: 0, millisecond: 0 });

        // 4. Si la hora objetivo ya pasó hoy, la movemos para mañana.
        if (targetDate < now) {
            targetDate = targetDate.plus({ days: 1 });
        }

        // 5. Devolvemos un objeto Date nativo para mantener la compatibilidad con el resto del código existente.
        return targetDate.toJSDate();
    },

    /**
     * Calcula la próxima fecha de reinicio para un evento semanal.
     * @param {Date} now - La fecha y hora actual (ya corregida).
     * @param {string} dayOfWeek - El día de la semana en inglés (ej. "Tuesday").
     * @param {string} timeString - La hora en formato "HH:MM".
     * @returns {Date} El objeto Date del próximo reinicio.
     */
    getNextWeeklyResetDate: function(now, dayOfWeek, timeString) {
        const weekDays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
        const targetDay = weekDays.indexOf(dayOfWeek);
        const DateTime = luxon.DateTime;
        const config = App.state.config;

        const nowInRefTz = DateTime.fromJSDate(now, { zone: config.referenceTimezone });
        const [h, m] = timeString.split(':').map(Number);

        let targetDate = nowInRefTz.set({ hour: h, minute: m, second: 0, millisecond: 0 });
        
        // El weekday en Luxon es 1=Lunes, 7=Domingo.
        const currentDay = nowInRefTz.weekday; 
        const targetDayLuxon = targetDay === 0 ? 7 : targetDay; // Convertimos Domingo de 0 a 7

        let daysToAdd = targetDayLuxon - currentDay;

        if (daysToAdd < 0 || (daysToAdd === 0 && targetDate < nowInRefTz)) {
            daysToAdd += 7;
        }

        targetDate = targetDate.plus({ days: daysToAdd });
        return targetDate.toJSDate();
    }
};