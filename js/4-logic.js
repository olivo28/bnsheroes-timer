// js/4-logic.js

'use strict';

import App from './2-state.js';
import Utils from './1-utils.js';

/**
 * Determina dinámicamente la URL del backend basándose en el hostname del navegador.
 * @returns {string} La URL correcta del backend.
 */
function getBackendUrl() {
  // 1. Obtenemos el hostname desde donde se está ejecutando el frontend.
  //    Ejemplos: 'localhost', '127.0.0.1', 'pcnetfs.moe'
  const hostname = window.location.hostname;

  // 2. Comprobamos si estamos en un entorno de desarrollo local.
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    // Si es local, usamos la URL de desarrollo.
    return 'http://localhost:3001';
  } else {
    // Si no es local, asumimos que estamos en producción.
    return 'https://pcnetfs.moe/api-bns-heroes-timers';
  }
}

const Logic = {
    // Definimos la URL del backend aquí. Cámbiala por tu dominio de producción cuando despliegues.
    BACKEND_URL: getBackendUrl(),

    // --- AUTENTICACIÓN Y PREFERENCIAS DE USUARIO ---


    getSessionToken() {
        return localStorage.getItem('session_token');
    },

    redirectToDiscordLogin() {
        const publicConfig = App.state.config.publicConfig;
        if (!publicConfig || !publicConfig.discordClientId) {
            console.error("La configuración pública no se ha cargado. No se puede iniciar sesión.");
            return;
        }

        if (App.state.config.displayTimezone) {
            localStorage.setItem('pending_timezone_for_new_user', App.state.config.displayTimezone);
        }

        // ESTA LÍNEA DEBE COINCIDIR EXACTAMENTE CON LA DEL PORTAL DE DISCORD
        const REDIRECT_URI = this.BACKEND_URL + '/api/auth/discord/callback'; // Ej: http://localhost:3001/api/auth/discord/callback
        const scope = 'identify email';

        const authUrl = `https://discord.com/api/oauth2/authorize?client_id=${publicConfig.discordClientId}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=code&scope=${scope}`;
        window.location.href = authUrl;
    },

    logout() {
        localStorage.removeItem('session_token');
        window.location.reload();
    },

    async fetchUserPreferences() {
        const token = this.getSessionToken();
        if (!token) return null;

        try {
            const response = await fetch(`${this.BACKEND_URL}/api/user/preferences`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            return response.ok ? await response.json() : null;
        } catch (error) {
            console.error("Error al obtener preferencias del usuario:", error);
            return null;
        }
    },

    async saveUserPreferences(prefsToSave) {
        const token = this.getSessionToken();
        
        if (!token) {
            // Construimos el objeto que se guardará en la cookie a partir de los datos completos del estado.
            // Usamos el estado global (App.state.config) para tener todos los datos,
            // y lo actualizamos con los nuevos cambios que vienen en prefsToSave.
            const config = App.state.config;
            const configForCookie = {
                language: config.language,
                notificationPrefs: config.notificationPrefs,
                displayTimezone: config.displayTimezone,
                use24HourFormat: config.use24HourFormat,
                preAlertMinutes: config.preAlertMinutes,
                notificationTypes: config.notificationTypes,
                showBossTimers: config.showBossTimers,
                showEvents: config.showEvents,
                showWeekly: config.showWeekly,
                showdownTicketSync: config.showdownTicketSync,
                reminderSettings: config.reminderSettings
            };
            
            Utils.setCookie('timersDashboardConfig', JSON.stringify(configForCookie), 365);
            return;
        }

        try {
            await fetch(`${this.BACKEND_URL}/api/user/preferences`, {
                method: 'PUT',
                body: JSON.stringify(prefsToSave),
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
            });
        } catch (error) {
            console.error("Error al guardar preferencias del usuario:", error);
        }
    },

    async syncShowdownTicket(remainingSeconds) {
        const token = this.getSessionToken();
        if (!token) {
            console.error("No se puede sincronizar el ticket sin iniciar sesión.");
            return;
        }

        try {
            const response = await fetch(`${this.BACKEND_URL}/api/sync-ticket`, {
                method: 'POST',
                body: JSON.stringify({ remainingSeconds }),
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Error del servidor');
            }
            
            // Opcional: podrías mostrar una pequeña notificación de éxito
            console.log("Ticket sincronizado con éxito en el backend.");

        } catch (error) {
            console.error("Error al sincronizar el ticket de Showdown:", error);
            // Opcional: mostrar un mensaje de error al usuario
        }
    },
    // --- FIN DE LA NUEVA FUNCIÓN ---

    /**
     * Carga dinámicamente un nuevo archivo de idioma desde el backend.
     * @param {string} locale - El código de idioma a cargar (ej. 'es', 'en').
     * @returns {Promise<Object|null>} El objeto de traducción o null si falla.
     */
    async fetchLocaleData(locale) {
        try {
            const response = await fetch(`${this.BACKEND_URL}/api/data/i18n/${locale}`);
            if (!response.ok) throw new Error('Network response was not ok');
            return await response.json();
        } catch (error) {
            console.error(`Error al cargar el idioma '${locale}':`, error);
            return null;
        }
    },
    
    // --- NOTIFICACIONES (LOCALES Y PUSH) ---

    async subscribeToPushNotifications() {
        const token = this.getSessionToken();
        if (!token) {
            alert(Utils.getText('notifications.loginRequiredForPush'));
            return;
        }

        if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
            alert(Utils.getText('notifications.pushNotSupported'));
            return;
        }

        const VAPID_PUBLIC_KEY = App.state.config.publicConfig.vapidPublicKey;
        
        const subscribeButton = document.getElementById('account-subscribe-push-btn');
        if (subscribeButton) subscribeButton.disabled = true;

        try {
            const alias = await Utils.prompt('account.promptAlias.title', 'account.promptAlias.body', 'account.promptAlias.placeholder')

            if (!alias) {
                if (subscribeButton) subscribeButton.disabled = false;
                return;
            }

            const registration = await navigator.serviceWorker.ready;
            let subscription = await registration.pushManager.getSubscription();

            if (!subscription) {
                subscription = await registration.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey: VAPID_PUBLIC_KEY
                });
            }

            // --- INICIO DE LA MODIFICACIÓN ---
            // 1. Detectamos el navegador del cliente.
            const deviceDetails = Logic.getClientDeviceDetails();

            // 2. Enviamos la suscripción, el alias Y el nombre del navegador al backend.
            await fetch(`${Logic.BACKEND_URL}/api/save-subscription`, {
                method: 'POST',
                body: JSON.stringify({ 
                    subscription, 
                    alias, 
                    browser: deviceDetails.browser, // ej. "Chrome"
                    os: deviceDetails.os            // ej. "Windows"
                }),
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
            });
            // --- FIN DE LA MODIFICACIÓN ---

            await Utils.alert('settings.subscribeButtonSuccess', 'notifications.subscribeButtonSuccessBody');

            if (subscribeButton) {
                subscribeButton.textContent = Utils.getText('account.pushEnabled');
            }
            
            // Refrescamos la lista en la UI para que aparezca la nueva suscripción
            if (typeof UI !== 'undefined' && UI.renderActiveSubscriptions) {
                UI.renderActiveSubscriptions();
            }

        } catch (error) {
            console.error("Error al suscribirse a push:", error);
            alert(Utils.getText('notifications.pushSubscribedError'));
            if (subscribeButton) subscribeButton.disabled = false;
        }
    },

    /**
     * Desuscribe un dispositivo de las notificaciones push.
     * @param {string|null} endpointToDelete - Si se proporciona, solo se elimina esta suscripción del backend.
     * Si es null, se desuscribe el navegador actual y se notifica al backend.
     */
    async unsubscribeFromPushNotifications(endpointToDelete = null) {
        const token = this.getSessionToken();
        if (!token) return;

        let endpointToTellBackend = endpointToDelete;

        try {
            // Si no nos han pasado un endpoint específico, significa que estamos desuscribiendo el navegador actual.
            if (!endpointToDelete) {
                if (!('serviceWorker' in navigator)) return;
                const registration = await navigator.serviceWorker.ready;
                const subscription = await registration.pushManager.getSubscription();

                if (subscription) {
                    endpointToTellBackend = subscription.endpoint;
                    await subscription.unsubscribe();
                    console.log("Suscripción eliminada del navegador actual.");
                } else {
                    console.log("No había suscripción activa en este navegador para eliminar.");
                    return; // No hay nada más que hacer
                }
            }
            
            // Si tenemos un endpoint (ya sea el del navegador actual o uno de la lista), se lo decimos al backend.
            if (endpointToTellBackend) {
                const response = await fetch(`${this.BACKEND_URL}/api/delete-subscription`, {
                    method: 'POST',
                    body: JSON.stringify({ endpoint: endpointToTellBackend }),
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || 'Error del servidor al eliminar la suscripción.');
                }
                
                // Si la desuscripción fue del navegador actual, mostramos una alerta.
                // Si fue de un botón en la lista, no es necesario (la UI se refresca sola).
                if (!endpointToDelete) {
                    alert(Utils.getText('account.unsubscribeSuccess'));
                }
                console.log("Suscripción eliminada del backend con éxito.");
            }
        } catch (error) {
            console.error('Error al desuscribirse de push:', error);
            alert(Utils.getText('account.unsubscribeError'));
        }
    },

    /**
     * Detecta el nombre del navegador del cliente a partir del User-Agent.
     * La comprobación se hace en un orden específico para evitar falsos positivos
     * (ej. muchos navegadores se identifican como 'Chrome' y 'Safari').
     * @returns {string} El nombre del navegador detectado.
     */
    getClientDeviceDetails() {
        const ua = navigator.userAgent;
        let browser = "Desconocido";
        let os = "Desconocido";

        // Detección del Sistema Operativo
        if (/Windows/i.test(ua)) os = "Windows";
        else if (/Android/i.test(ua)) os = "Android";
        else if (/iPhone|iPad|iPod/i.test(ua)) os = "iOS";
        else if (/Mac/i.test(ua)) os = "macOS";
        else if (/Linux/i.test(ua)) os = "Linux";

        // --- INICIO DE LA DETECCIÓN DE NAVEGADOR MEJORADA ---
        // Se priorizan las variantes más específicas primero.
        if (/Brave/i.test(ua)) browser = "Brave";
        else if (/Edg/i.test(ua)) browser = "Edge";
        else if (ua.includes("Opera") && ua.includes("GX")) browser = "Opera GX";
        else if (/Opera Mini/i.test(ua)) browser = "Opera Mini";
        else if (/OPRT/i.test(ua)) browser = "Opera Touch";
        else if (/Opera|OPR/i.test(ua)) browser = "Opera";
        else if (/Vivaldi/i.test(ua)) browser = "Vivaldi";
        else if (/Arc/i.test(ua)) browser = "Arc";
        else if (/Firefox/i.test(ua)) browser = "Firefox"; // Tor se detectará como Firefox
        else if (/Chrome/i.test(ua)) browser = "Chrome";
        else if (/Safari/i.test(ua)) browser = "Safari";
        // --- FIN DE LA DETECCIÓN DE NAVEGADOR MEJORADA ---
        
        return { browser, os };
    },

    requestNotificationPermission() {
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission().then(permission => {
                if (typeof UI !== 'undefined' && UI.updateLanguage) {
                    UI.updateLanguage();
                }
            });
        }
    },

    showFullAlert(title, body, imageUrl) {
        const config = App.state.config;
        if (config.notificationTypes?.desktop && 'Notification' in window && Notification.permission === 'granted') {
            new Notification(title, { body, icon: imageUrl, requireInteraction: false });
        }
        if (config.notificationTypes?.sound) {
            App.alertSound.play().catch(e => console.warn("La reproducción de sonido fue bloqueada por el navegador."));
        }
    },

    checkAndTriggerAlerts(now, bossTimers, dailyResetTimer, showdownTicketTimer, events, banners) {
        const config = App.state.config;
        if (!config || !config.notificationTypes) return;

        const lang = config.language;

        // --- Lógica existente para Jefes ---
        if (config.showBossTimers) {
            bossTimers.forEach(spawn => {
                if (!spawn.isAlertEnabled) return;
                const cycleKey = `${App.state.lastResetCycleDay}-${spawn.id}-${spawn.time}`;
                (config.preAlertMinutes || []).forEach(min => {
                    const alertTime = new Date(spawn.targetDate.getTime() - min * 60000).toTimeString().slice(0, 5);
                    const alertKey = `${cycleKey}-${min}`;
                    if (now.toTimeString().slice(0, 5) === alertTime && !App.state.alertsShownToday[alertKey]) {
                        this.showFullAlert(
                            Utils.getText('notifications.preAlertTitle', { b: spawn.name, m: min }),
                            Utils.getText('notifications.preAlertBody', { l: spawn.location }),
                            spawn.imageUrl
                        );
                        App.state.alertsShownToday[alertKey] = true;
                    }
                });
            });
        }

        // --- Lógica existente para Reset Diario y Ticket ---
        const resetAlertKey = `${App.state.lastResetCycleDay}-reset`;
        if (dailyResetTimer.secondsLeft <= 0 && dailyResetTimer.secondsLeft > -5 && !App.state.alertsShownToday[resetAlertKey]) {
            const displayResetTime = Utils.formatDateToTimezoneString(dailyResetTimer.targetDate, config.displayTimezone, config.use24HourFormat);
            this.showFullAlert(
                Utils.getText('notifications.resetTitle'),
                Utils.getText('notifications.resetBody', { t: displayResetTime }),
                dailyResetTimer.imageUrl
            );
            App.state.alertsShownToday[resetAlertKey] = true;
        }

        const showdownAlertKey = `showdown-${showdownTicketTimer.targetDate.getTime()}`;
        if (showdownTicketTimer.secondsLeft <= 0 && showdownTicketTimer.secondsLeft > -5 && !App.state.alertsShownToday[showdownAlertKey]) {
            this.showFullAlert(
                Utils.getText('notifications.showdownReadyTitle'),
                Utils.getText('notifications.showdownReadyBody'),
                config.showdownTicketImageUrl
            );
            App.state.alertsShownToday[showdownAlertKey] = true;
        }

        // --- NUEVA LÓGICA: Recordatorio de Misiones Diarias de Evento (12h) ---
        if (events) {
            const dailyMissionAlertTime = new Date(dailyResetTimer.targetDate.getTime() - (12 * 3600 * 1000)).toTimeString().slice(0, 5);
            events.forEach(event => {
                const eventData = App.state.allEventsData.events[event.id];
                if (eventData?.hasDailyMissions && this.isEventActive(event.id)) {
                    const alertKey = `${App.state.lastResetCycleDay}-dailyMission-${event.id}`;
                    if (now.toTimeString().slice(0, 5) === dailyMissionAlertTime && !App.state.alertsShownToday[alertKey]) {
                        this.showFullAlert(
                            Utils.getText('notifications.dailyMissionReminderTitle'),
                            Utils.getText('notifications.dailyMissionReminderBody', { eventName: event.name[lang] }),
                            'favicon.png'
                        );
                        App.state.alertsShownToday[alertKey] = true;
                    }
                }
            });
        }

        // --- NUEVA LÓGICA: Recordatorio de Fin de Evento (3 días) ---
        if (events) {
            const threeDaysInSeconds = 3 * 24 * 60 * 60;
            events.forEach(event => {
                const eventData = App.state.allEventsData.events[event.id];
                // Solo para eventos que NO tienen misiones diarias
                if (!eventData?.hasDailyMissions) {
                    const endDate = this.getAbsoluteDateWithCustomDate(event.endDate, config.dailyResetTime);
                    const secondsLeft = (endDate - now) / 1000;
                    const alertKey = `event-ending-${event.id}`;
                    // Se activa una sola vez cuando el contador cruza el umbral de 3 días
                    if (secondsLeft <= threeDaysInSeconds && secondsLeft > (threeDaysInSeconds - 5) && !App.state.alertsShownToday[alertKey]) {
                         this.showFullAlert(
                            Utils.getText('notifications.eventEndingSoonTitle'),
                            Utils.getText('notifications.eventEndingSoonBody', { eventName: event.name[lang] }),
                            'favicon.png'
                        );
                        App.state.alertsShownToday[alertKey] = true;
                    }
                }
            });
        }
        
        // --- NUEVA LÓGICA: Recordatorio de Reset Semanal (3 días) ---
        const weeklyTimers = this.getWeeklyResetTimers(now);
        if (weeklyTimers) {
            const threeDaysInSeconds = 3 * 24 * 60 * 60;
            weeklyTimers.forEach(timer => {
                const alertKey = `weekly-ending-${timer.id}-${timer.targetDate.toISOString().split('T')[0]}`;
                 if (timer.secondsLeft <= threeDaysInSeconds && timer.secondsLeft > (threeDaysInSeconds - 5) && !App.state.alertsShownToday[alertKey]) {
                    this.showFullAlert(
                        Utils.getText('notifications.weeklyResetReminderTitle'),
                        Utils.getText('notifications.weeklyResetReminderBody', { weeklyName: timer.name }),
                        'favicon.png'
                    );
                    App.state.alertsShownToday[alertKey] = true;
                }
            });
        }

        // --- NUEVA LÓGICA: Recordatorio de Nuevo Banner (3 días) ---
        if (banners && banners.nextBanner && App.state.allBannersData) {
            const threeDaysInSeconds = 3 * 24 * 60 * 60;
            const nextBannerId = banners.nextBanner;
            const allBanners = App.state.allBannersData;

            // Buscamos los datos completos del siguiente banner
            const nextBannerData = allBanners[nextBannerId];
            
            if (nextBannerData && nextBannerData.startDate) {
                const startDate = this.getAbsoluteDateWithCustomDate(nextBannerData.startDate, config.dailyResetTime);
                const secondsLeft = (startDate.getTime() - now.getTime()) / 1000;
                const alertKey = `banner-starting-${nextBannerData.startDate}`;

                if (secondsLeft <= threeDaysInSeconds && secondsLeft > (threeDaysInSeconds - 5) && !App.state.alertsShownToday[alertKey]) {
                    this.showFullAlert(
                        Utils.getText('notifications.newBannerSoonTitle'),
                        Utils.getText('notifications.newBannerSoonBody'),
                        'favicon.png'
                    );
                    App.state.alertsShownToday[alertKey] = true;
                }
            }
        }
        // --- FIN DE LA CORRECCIÓN ---
    },

    // --- LÓGICA DE TIEMPO Y TIMERS ---

    getCorrectedNow() {
        return new Date(Date.now() + App.state.timeOffset);
    },

    checkAndPerformDailyReset(now) {
        const config = App.state.config;
        if (!config.dailyResetTime) return;

        const t = this.getAbsoluteDateFromReferenceTimezone(config.dailyResetTime);
        const r = new Date(t);
        if (now >= r) r.setUTCDate(r.getUTCDate() - 1);
        
        const d = r.getUTCDate();
        if (App.state.lastResetCycleDay !== null && App.state.lastResetCycleDay !== d) {
            App.state.alertsShownToday = {};
            if (!App.state.isLoggedIn && config.showdownTicketSync) {
                config.showdownTicketSync = null;
            }
        }
        App.state.lastResetCycleDay = d;
    },

    getDailyResetTimer(now) {
        const config = App.state.config;
        if (!config.dailyResetTime) return {};

        const targetDate = this.getAbsoluteDateFromReferenceTimezone(config.dailyResetTime);
        return {
            type: 'reset',
            name: Utils.getText('timers.dailyResetName'),
            description: Utils.getText('timers.dailyResetDesc'),
            imageUrl: config.dailyResetImageUrl,
            targetDate,
            secondsLeft: Math.floor((targetDate - now) / 1000)
        };
    },

    getShowdownTicketTimer(now, lastReset) {
        const config = App.state.config;
        if (!config.showdownTicketIntervalHours) return {};
        
        const intervalMs = config.showdownTicketIntervalHours * 3600 * 1000;
        let nextTime;

        if (App.state.isLoggedIn && config.showdownTicketSync) { // <-- 1. CAMBIAR 'ticketSyncTimestamp' por 'showdownTicketSync'
            const syncAnchor = new Date(config.showdownTicketSync).getTime(); // <-- 2. CAMBIAR 'ticketSyncTimestamp' por 'showdownTicketSync'
            if (now.getTime() < syncAnchor) {
                nextTime = new Date(syncAnchor);
            } else {
                const msSinceSync = now.getTime() - syncAnchor;
                const intervalsPassed = Math.floor(msSinceSync / intervalMs);
                nextTime = new Date(syncAnchor + (intervalsPassed + 1) * intervalMs);
            }
        } else if (!App.state.isLoggedIn && config.showdownTicketSync) {
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
            name: Utils.getText('timers.showdownName'),
            description: Utils.getText('timers.showdownDesc'),
            targetDate: nextTime,
            secondsLeft: Math.floor((nextTime - now) / 1000),
            imageUrl: config.showdownTicketImageUrl
        };
    },

    getBossTimers(now) {
        // --- INICIO DE LA CORRECCIÓN ---
        // Ya no usamos config.bosses, usamos los datos cargados en el estado.
        const bosses = App.state.allBossesData;
        if (!bosses) return [];
        // --- FIN DE LA CORRECCIÓN ---
        
        const lang = App.state.config.language || 'en';

        // --- INICIO DE LA CORRECCIÓN ---
        // Usamos la nueva variable 'bosses' y añadimos el filtro por 'isActive'
        return bosses
            .filter(boss => boss.isActive) // <-- LÓGICA 'isActive'
            .flatMap(boss =>
                (boss.spawnTimes || []).map(time => {
                    const targetDate = this.getAbsoluteDateFromReferenceTimezone(time);
                    const isNotificationOn = App.state.config.notificationPrefs?.bosses?.[`${boss.id}_${time}`] ?? true;
                    return {
                        type: 'boss',
                        id: boss.id,
                        name: boss.name[lang] || boss.name.en,
                        imageUrl: boss.imageUrl,
                        location: boss.location,
                        isEvent: boss.isEvent, // <-- Pasamos el flag 'isEvent'
                        time,
                        targetDate,
                        isAlertEnabled: App.state.config.showBossTimers,
                        isNotificationOn: isNotificationOn,
                        secondsLeft: Math.floor((targetDate - now) / 1000)
                    };
                })
            )
            .filter(t => t.secondsLeft > -300)
            .sort((a, b) => (b.isNotificationOn - a.isNotificationOn) || (a.secondsLeft - b.secondsLeft));
        // --- FIN DE LA CORRECCIÓN ---
    },

    getWeeklyResetTimers(now) {
        const weeklyData = App.state.weeklyResetsData;
        if (!weeklyData || !weeklyData.events) return [];
        const lang = App.state.config.language || 'en';
    
        return weeklyData.events.filter(event => event.status?.resetSchedule?.dayOfWeek)
            .map(event => {
                const resetInfo = event.status.resetSchedule;
                const targetDate = this.getNextWeeklyResetDate(now, resetInfo.dayOfWeek.en, resetInfo.time);
                return {
                    type: 'weekly',
                    id: event.id,
                    name: event.eventName[lang],
                    category: event.eventCategory ? event.eventCategory[lang] : '',
                    targetDate,
                    secondsLeft: Math.floor((targetDate - now) / 1000)
                };
            }).sort((a, b) => a.secondsLeft - b.secondsLeft);
    },
    
    findHeroByName(name) {
        if (!App.state.allHeroesData || !name) {
            return null;
        }
        
        // Convertimos el nombre buscado a minúsculas una sola vez.
        const searchName = name.toLowerCase();

        return App.state.allHeroesData.find(hero => 
            // Comprobamos que el héroe y su game_name existan antes de comparar.
            hero && typeof hero.game_name === 'string' && hero.game_name.toLowerCase() === searchName
        );
    },

    isEventActive(eventName) {
        const now = this.getCorrectedNow();
        const event = App.state.config.events?.find(e => e.id === eventName);
        if (!event || !App.state.config.dailyResetTime) return false;
        
        const startDate = this.getAbsoluteDateWithCustomDate(event.startDate, App.state.config.dailyResetTime);
        const endDate = this.getAbsoluteDateWithCustomDate(event.endDate, App.state.config.dailyResetTime);
        
        return now >= startDate && now <= endDate;
    },

    getAbsoluteDateWithCustomDate(dateString, timeString) {
        const { DateTime } = luxon;
        const [h, m] = timeString.split(':').map(Number);
        const targetDate = DateTime.fromISO(dateString, { zone: App.state.config.referenceTimezone })
            .set({ hour: h, minute: m, second: 0, millisecond: 0 });
        return targetDate.toJSDate();
    },
    
    getAbsoluteDateFromReferenceTimezone(timeString) {
        const { DateTime } = luxon;
        const config = App.state.config;
        if (!config.referenceTimezone) return new Date();

        const now = DateTime.fromJSDate(this.getCorrectedNow(), { zone: config.referenceTimezone });
        const [h, m] = timeString.split(':').map(Number);
        let targetDate = now.set({ hour: h, minute: m, second: 0, millisecond: 0 });

        if (targetDate < now) {
            targetDate = targetDate.plus({ days: 1 });
        }
        return targetDate.toJSDate();
    },

    getNextWeeklyResetDate(now, dayOfWeek, timeString) {
        const weekDays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
        const targetDay = weekDays.indexOf(dayOfWeek);
        const { DateTime } = luxon;
        const config = App.state.config;
        if (!config.referenceTimezone) return new Date();

        const nowInRefTz = DateTime.fromJSDate(now, { zone: config.referenceTimezone });
        const [h, m] = timeString.split(':').map(Number);
        let targetDate = nowInRefTz.set({ hour: h, minute: m, second: 0, millisecond: 0 });
        
        const currentDay = nowInRefTz.weekday; 
        const targetDayLuxon = targetDay === 0 ? 7 : targetDay;

        let daysToAdd = targetDayLuxon - currentDay;
        if (daysToAdd < 0 || (daysToAdd === 0 && targetDate < nowInRefTz)) {
            daysToAdd += 7;
        }

        targetDate = targetDate.plus({ days: daysToAdd });
        return targetDate.toJSDate();
    }
};

export default Logic;