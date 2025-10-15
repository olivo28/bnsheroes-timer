// js/5-main.js

'use strict';

import App from './2-state.js';
import Utils from './1-utils.js';
import Logic from './4-logic.js';
import UI from './3-ui.js';

(function () {

    /**
     * Reestructura el DOM para usar Swiper en dispositivos móviles.
     */
    function setupMobileSwiper() {
        const mainWrapper = document.querySelector('.main-wrapper');
        const primaryPanel = document.querySelector('.primary-panel');
        const secondaryPanel = document.querySelector('.secondary-panel');

        if (!mainWrapper || !primaryPanel || !secondaryPanel) return;

        const swiperContainer = document.createElement('div');
        swiperContainer.className = 'swiper mobile-swiper-container';
        const swiperWrapper = document.createElement('div');
        swiperWrapper.className = 'swiper-wrapper';
        const slide1 = document.createElement('div');
        slide1.className = 'swiper-slide';
        const slide2 = document.createElement('div');
        slide2.className = 'swiper-slide';
        const pagination = document.createElement('div');
        pagination.className = 'swiper-pagination';

        slide1.appendChild(primaryPanel);
        slide2.appendChild(secondaryPanel);
        swiperWrapper.appendChild(slide1);
        swiperWrapper.appendChild(slide2);
        swiperContainer.appendChild(swiperWrapper);
        swiperContainer.appendChild(pagination);
        mainWrapper.innerHTML = '';
        mainWrapper.appendChild(swiperContainer);
        
        App.state.swiper = new Swiper('.mobile-swiper-container', {
            autoHeight: true,
            loop: false,
            pagination: { el: '.swiper-pagination', clickable: true },
        });
    }

    /**
     * Función principal que se ejecuta después de elegir el idioma.
     * Carga todos los datos, fusiona configuraciones e inicia la aplicación.
     * @param {string} locale - El idioma elegido (ej. 'en', 'es').
     */
    // js/5-main.js

async function startApp(locale) {
    // --- 1. PREPARACIÓN DE LA PANTALLA DE CARGA ---
    document.getElementById('language-modal-overlay').classList.add('hidden');
    const loadingOverlay = document.getElementById('loading-overlay');
    const loadingMessageEl = document.getElementById('loading-message');
    const appWrapper = document.querySelector('.app-wrapper');

    Utils.setCookie('userLanguage', locale, 365);

    // --- 2. LÓGICA DE CARGA Y PROCESAMIENTO DE DATOS ---
    try {
        const loadStartTime = Date.now();

        // --- INICIO DE LA CORRECCIÓN ---
        /**
         * Función auxiliar para hacer fetch y manejar errores HTTP.
         * Si la respuesta no es OK (ej. 404, 503), lanza un error.
         */
        const fetchData = async (url) => {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Error de red al cargar ${url}: ${response.status} ${response.statusText}`);
            }
            return response.json();
        };

        // Cargamos TODOS los datos necesarios en paralelo usando la función auxiliar
        const [
            publicConfig, gameConfig, i18nData, heroesData,
            eventsData, weeklyData, bossesData, streamsData, bannersData
        ] = await Promise.all([
            fetchData(`${Logic.BACKEND_URL}/api/public-config`),
            fetchData(`${Logic.BACKEND_URL}/api/data/game-config`),
            fetchData(`${Logic.BACKEND_URL}/api/data/i18n/${locale}`),
            fetchData(`${Logic.BACKEND_URL}/api/data/heroes`),
            fetchData(`${Logic.BACKEND_URL}/api/data/events`),
            fetchData(`${Logic.BACKEND_URL}/api/data/weekly`),
            fetchData(`${Logic.BACKEND_URL}/api/data/bosses`),
            fetchData(`${Logic.BACKEND_URL}/api/data/streams`),
            fetchData(`${Logic.BACKEND_URL}/api/data/banners`)
        ]);
        // --- FIN DE LA CORRECCIÓN ---
        
        // --- A partir de aquí, el resto de la función es la original ---
        
        // Guardamos los datos en el estado global
        App.state.i18n = i18nData;
        App.state.allHeroesData = heroesData;
        App.state.allEventsData = eventsData.gameData;
        App.state.weeklyResetsData = weeklyData.gameData;
        App.state.allBossesData = bossesData.bosses;
        App.state.allStreamsData = streamsData.streams;
        App.state.allBannersData = bannersData.banners;

        // Lógica para mensajes de carga aleatorios
        const getRandomLoadingMessage = () => {
            const messages = i18nData.loadingMessages || ['Loading...'];
            return messages[Math.floor(Math.random() * messages.length)];
        };
        loadingMessageEl.textContent = getRandomLoadingMessage();
        const messageInterval = setInterval(() => {
            loadingMessageEl.style.opacity = 0;
            setTimeout(() => {
                loadingMessageEl.textContent = getRandomLoadingMessage();
                loadingMessageEl.style.opacity = 1;
            }, 300);
        }, 2000);

        // Lógica de configuración de usuario
        let userPrefs = {};
        const isLoggedIn = !!Logic.getSessionToken();
        App.state.isLoggedIn = isLoggedIn;

        if (isLoggedIn) {
            const userData = await Logic.fetchUserPreferences();
            if (userData) {
                userPrefs = userData.preferences || {};
                App.state.userInfo = userData.user || null;
            }
        } else {
            const cookiePrefs = Utils.getCookie('timersDashboardConfig');
            if (cookiePrefs) try { userPrefs = JSON.parse(cookiePrefs); } catch (e) {}
        }

        const localOffsetHours = new Date().getTimezoneOffset() / -60;
        const sign = localOffsetHours >= 0 ? '+' : '-';
        const hours = String(Math.abs(localOffsetHours)).padStart(2, '0');
        const formattedLocalTimezone = `${sign}${hours}:00`;

        const defaultUserPrefs = {
            language: locale,
            displayTimezone: formattedLocalTimezone,
            use24HourFormat: false,
            preAlertMinutes: [15, 5, 1],
            notificationTypes: { sound: true, desktop: true },
            showBossTimers: true, showEvents: true, showWeekly: true,
            notificationPrefs: { dailyReset: true, showdownTicket: true, streams: true, events: true, bosses: {} }
        };

        const mergedConfig = { ...defaultUserPrefs, ...gameConfig, ...userPrefs, publicConfig };
        if (!mergedConfig.displayTimezone) {
            mergedConfig.displayTimezone = formattedLocalTimezone;
        }
        App.state.config = mergedConfig;
        
        // Lógica de guardado de zona horaria para nuevos usuarios
        if (isLoggedIn) {
            const pendingTimezone = localStorage.getItem('pending_timezone_for_new_user');
            if (pendingTimezone && !userPrefs.displayTimezone) {
                App.state.config.displayTimezone = pendingTimezone;
                Logic.saveUserPreferences({ displayTimezone: pendingTimezone });
                localStorage.removeItem('pending_timezone_for_new_user');
            }
        }

        // --- 3. TRANSICIÓN FINAL ---
        const elapsedTime = Date.now() - loadStartTime;
        const minLoadTime = 1500; // Reducido para depuración más rápida
        const remainingTime = Math.max(0, minLoadTime - elapsedTime);

        setTimeout(() => {
            clearInterval(messageInterval);
            loadingOverlay.classList.add('hidden');
            appWrapper.classList.remove('hidden');
            initializeUI();
        }, remainingTime);

    } catch (error) {
        // Ahora, si cualquier fetchData falla, este catch se activará
        console.error("Error fatal durante la inicialización:", error);
        loadingMessageEl.textContent = 'Error: Could not load application data.';
    }
}

    /**
     * Inicializa los componentes de la UI y el bucle principal.
     */
    function initializeUI() {
        App.initializeDOM();

        if (App.state.isMobile) {
            setupMobileSwiper();
            const mobileHeader = document.getElementById('mobile-header');
            const userStatusWidget = App.dom.userStatus;
            if (mobileHeader && userStatusWidget) {
                mobileHeader.appendChild(userStatusWidget);
            }
        }

        UI.populateSelects();
        addEventListeners();
        UI.applyLanguage();
        UI.updateLoginStatus();

        Logic.requestNotificationPermission();

        UI.updateAll();
        setInterval(() => UI.updateAll(), 1000);
    }


    /**
     * Contenedor para todos los event listeners de la aplicación.
     */
    function addEventListeners() {
        function handlePanelClick(e) {
            const infoBtn = e.target.closest('.info-button');
            if (infoBtn) return UI.openInfoModal();

            const syncBtn = e.target.closest('.sync-button');
            if (syncBtn) return UI.openSyncModal();

            const alertToggle = e.target.closest('.alert-toggle');
            if (alertToggle) {
                const { bossId, time } = alertToggle.dataset;
                const key = `${bossId}_${time}`;
                if (!App.state.config.notificationPrefs) App.state.config.notificationPrefs = {};
                if (!App.state.config.notificationPrefs.bosses) App.state.config.notificationPrefs.bosses = {};
                const isCurrentlyDisabled = alertToggle.classList.contains('disabled');
                App.state.config.notificationPrefs.bosses[key] = isCurrentlyDisabled;
                const payload = { 
                    prefs: App.state.config.notificationPrefs 
                };
                Logic.saveUserPreferences(payload);
                UI.updateAll();
            }
        }
        App.dom.primaryPanel.addEventListener('click', handlePanelClick);
        App.dom.secondaryPanel.addEventListener('click', handlePanelClick);

        App.dom.eventsContainer.addEventListener('click', e => {
            const eventItem = e.target.closest('.event-item');
            // Usamos una comprobación para alternar: si haces clic en el mismo, se cierra.
            if (eventItem?.dataset.eventId) {
                if (App.state.currentOpenEventId === eventItem.dataset.eventId) {
                    UI.closeEventDetailsPanel();
                } else {
                    UI.openEventDetailsPanel(eventItem.dataset.eventId);
                }
            }
        });
        App.dom.weeklyContainer.addEventListener('click', e => {
            const weeklyItem = e.target.closest('.weekly-item');
            if (weeklyItem?.dataset.weeklyId) {
                if (App.state.currentOpenWeeklyId === weeklyItem.dataset.weeklyId) {
                    UI.closeWeeklyDetailsPanel();
                } else {
                    UI.openWeeklyDetailsPanel(weeklyItem.dataset.weeklyId);
                }
            }
        });

        function handleDetailsPanelClick(e) {
            // --- 1. Lógica para el botón de cerrar ---
            // Si se hace clic en el botón de cerrar, cerramos ambos paneles y paramos.
            // No importa cuál esté visible, la función .close() no hará nada si está oculto.
            if (e.target.closest('.close-details-btn')) {
                UI.closeEventDetailsPanel();
                UI.closeWeeklyDetailsPanel();
                return; // Detiene la ejecución para no procesar otros clics.
            }

            // --- 2. Lógica para clics en Héroes ---
            // Esto se ejecutará si el clic no fue en el botón de cerrar.
            handleHeroClick(e);

            // --- 3. NUEVA Lógica para los Buffs Desplegables ---
            // Esto solo se aplicará si el clic fue dentro del panel semanal.
            const buffItem = e.target.closest('.weekly-buff-item.expandable');
            if (buffItem) {
                const enhancementsList = buffItem.nextElementSibling;

                // Verificamos que el siguiente elemento sea la lista que queremos expandir
                if (enhancementsList && enhancementsList.classList.contains('weekly-enhancements-list')) {
                    buffItem.classList.toggle('expanded');
                    enhancementsList.classList.toggle('expanded');
                }
            }
        }

        // Listener para el botón de guardar de "Account Settings"
        const savePushSettingsBtn = document.getElementById('save-push-settings-btn');
        if (savePushSettingsBtn) {
            savePushSettingsBtn.addEventListener('click', async () => {
                if (!App.state.isLoggedIn) return;

                const newPushPrefs = {
                    dailyReset: document.getElementById('push-daily-reset-toggle').checked,
                    showdownTicket: document.getElementById('push-showdown-ticket-toggle').checked,
                    weeklyResetReminder: {
                        enabled: document.getElementById('push-weekly-reset-toggle').checked,
                        daysBefore: parseInt(document.getElementById('push-weekly-days-input').value) || 2
                    },
                    eventDailiesReminder: {
                        enabled: document.getElementById('push-event-dailies-toggle').checked,
                        hoursBeforeReset: parseInt(document.getElementById('push-event-hours-input').value) || 4
                    },
                    bosses: App.state.config.notificationPrefs?.bosses || {}
                };

                // Actualizamos el estado local
                App.state.config.notificationPrefs = newPushPrefs;

                // --- ESTA ES LA LÍNEA CLAVE ---
                // Enviamos SOLO las preferencias de notificaciones al backend
                Logic.saveUserPreferences({ notificationPrefs: newPushPrefs });

                await Utils.alert('alert.settingsSaved.title', 'alert.settingsSaved.body');
                UI.closeAccountModal();
            });
        }

        document.getElementById('event-details-panel').addEventListener('click', handleDetailsPanelClick);
        document.getElementById('weekly-details-panel').addEventListener('click', handleDetailsPanelClick);

        App.dom.settingsButton.addEventListener('click', UI.openSettingsModal);
        document.getElementById('close-settings-btn').addEventListener('click', UI.closeSettingsModal);
        App.dom.accountModalOverlay.addEventListener('click', e => { if (e.target === e.currentTarget) UI.closeAccountModal(); });
        document.getElementById('close-account-modal-btn').addEventListener('click', UI.closeAccountModal);
        App.dom.aboutButton.addEventListener('click', UI.openAboutModal);
        document.getElementById('close-about-btn').addEventListener('click', UI.closeAboutModal);
        document.getElementById('close-info-btn').addEventListener('click', UI.closeInfoModal);

        document.getElementById('close-account-modal-btn').addEventListener('click', UI.closeAccountModal);
        if (App.dom.accountModalOverlay) {
            App.dom.accountModalOverlay.addEventListener('click', async (e) => { // <-- La función ahora es ASYNC

                // Clic en los enlaces de navegación de la barra lateral
                const navItem = e.target.closest('.nav-item');
                if (navItem) {
                    e.preventDefault();
                    const sectionId = navItem.dataset.section;
                    const protectedSections = ['push-notifications'];
                    if (protectedSections.includes(sectionId) && !App.state.isLoggedIn) {
                        UI.openLoginRequiredModal();
                    } else {
                        UI.switchAccountModalSection(sectionId);
                    }
                    return;
                }

                // Clic en el botón de AÑADIR dispositivo
                if (e.target.closest('#account-subscribe-push-btn')) {
                    UI.handleAddNewSubscription();
                    return;
                }
                
                // Clic en el botón de BORRAR dispositivo
                const deleteButton = e.target.closest('.delete-subscription-btn');
                if (deleteButton) {
                    const endpoint = deleteButton.dataset.endpoint;
                    const confirmed = await Utils.confirm('confirm.deleteSub.title', 'confirm.deleteSub.body');
                    if (confirmed) {
                        await Logic.unsubscribeFromPushNotifications(endpoint);
                        // No cerramos el modal, solo refrescamos la lista
                        UI.renderActiveSubscriptions();
                    }
                    return; // Importante: detenemos la ejecución aquí
                }

                // Clic para cerrar si se pulsa el botón X o fuera del modal
                if (e.target.closest('#close-account-modal-btn') || e.target === e.currentTarget) {
                    UI.closeAccountModal();
                }
            });
        }

        const loginRequiredOverlay = document.getElementById('login-required-modal-overlay');
        if (loginRequiredOverlay) {
            loginRequiredOverlay.addEventListener('click', e => {
                if (e.target === e.currentTarget || e.target.closest('#close-login-required-btn')) {
                    UI.closeLoginRequiredModal();
                }
                if (e.target.closest('#go-to-login-btn')) {
                    Logic.redirectToDiscordLogin();
                }
            });
        }

        const subscriptionsList = document.getElementById('active-subscriptions-list');
        if (subscriptionsList) {
            subscriptionsList.addEventListener('click', async (e) => {
                const deleteButton = e.target.closest('.delete-subscription-btn');
                if (deleteButton) {
                    const endpoint = deleteButton.dataset.endpoint;
                    const confirmed = await Utils.confirm('confirm.deleteSub.title', 'confirm.deleteSub.body');
                    if (confirmed) {
                        await Logic.unsubscribeFromPushNotifications(endpoint);
                        UI.renderActiveSubscriptions();
                    }
                }
            });
        }
        
        // El botón de logout ahora está en el modal, así que le añadimos su listener
        if (App.dom.logoutBtnModal) {
            App.dom.logoutBtnModal.addEventListener('click', () => Logic.logout());
        }
        
        //document.getElementById('account-subscribe-push-btn').addEventListener('click', () => UI.togglePushSubscription());
        
        App.dom.modalOverlay.addEventListener('click', e => { if (e.target === e.currentTarget) UI.closeSettingsModal(); });
        App.dom.infoModalOverlay.addEventListener('click', e => { if (e.target === e.currentTarget) UI.closeInfoModal(); });
        App.dom.syncModalOverlay.addEventListener('click', e => { if (e.target === e.currentTarget) UI.closeSyncModal(); });
        App.dom.aboutModalOverlay.addEventListener('click', e => { if (e.target === e.currentTarget) UI.closeAboutModal(); });
        document.getElementById('streams-modal-overlay').addEventListener('click', e => { if (e.target === e.currentTarget) document.getElementById('streams-modal-overlay').classList.remove('visible'); });

        App.dom.saveSettingsBtn.addEventListener('click', async () => {
            const reminderSettings = {
                eventDailies: {
                    enabled: document.getElementById('event-dailies-reminder-toggle').checked,
                    hours: parseInt(document.getElementById('event-dailies-reminder-hours').value)
                },
                weekly: {
                    enabled: document.getElementById('weekly-reminder-toggle').checked,
                    days: parseInt(document.getElementById('weekly-reminder-days').value)
                },
                banner: {
                    enabled: document.getElementById('banner-reminder-toggle').checked,
                    days: parseInt(document.getElementById('banner-reminder-days').value)
                }
            };

            const newConfig = {
                language: App.dom.languageSelect.value,
                displayTimezone: App.dom.timezoneSelect.value,
                use24HourFormat: App.dom.timeFormatSwitch.checked,
                preAlertMinutes: App.dom.preAlertInput.value.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n) && n > 0),
                notificationTypes: { sound: App.dom.soundToggle.checked, desktop: App.dom.desktopToggle.checked },
                showBossTimers: App.dom.bossTimersToggle.checked,
                showEvents: App.dom.eventsToggle.checked,
                showWeekly: App.dom.weeklyToggle.checked,
                notificationPrefs: App.state.config.notificationPrefs,
                reminderSettings: reminderSettings
            };

            const languageChanged = newConfig.language !== App.state.config.language;

            // Si el idioma cambió, cargamos los nuevos datos de traducción
            if (languageChanged) {
                const newTranslations = await Logic.fetchLocaleData(newConfig.language);
                if (newTranslations) {
                    App.state.i18n = newTranslations;
                    Utils.setCookie('userLanguage', newConfig.language, 365);
                } else {
                    console.error("No se pudo cargar el nuevo idioma. No se guardaron los cambios.");
                    alert("Error: Could not load the new language. Settings were not saved."); // Opcional: alerta al usuario
                    return;
                }
            }

            // Actualizamos el estado de la aplicación con toda la nueva configuración
            App.state.config = { ...App.state.config, ...newConfig };

            // Guardamos las preferencias
            Logic.saveUserPreferences(App.state.config);

            // Cerramos el modal de configuración
            UI.closeSettingsModal();

            // Si el idioma cambió, llamamos a nuestra nueva función para aplicar los cambios de texto
            if (languageChanged) {
                UI.applyLanguage();
            }

            // Actualizamos el resto de la UI (relojes, timers, etc.)
            UI.updateAll();
            
        });

        
        
        document.getElementById('save-sync-btn').addEventListener('click', () => {
            const h = parseInt(document.getElementById('sync-hours').value) || 0;
            const m = parseInt(document.getElementById('sync-minutes').value) || 0;
            const s = parseInt(document.getElementById('sync-seconds').value) || 0;
            const remainingSeconds = (h * 3600) + (m * 60) + s;
            if (App.state.isLoggedIn) {
                Logic.syncShowdownTicket(remainingSeconds);
                App.state.config.showdownTicketSync = Date.now() + remainingSeconds * 1000;
            } else {
                App.state.config.showdownTicketSync = Date.now() + remainingSeconds * 1000;
                Logic.saveUserPreferences({ showdownTicketSync: App.state.config.showdownTicketSync });
            }
            UI.closeSyncModal();
            UI.updateAll();
        });

        App.dom.timeFormatSwitch.addEventListener('change', () => {
            App.state.config.use24HourFormat = App.dom.timeFormatSwitch.checked;
            Logic.saveUserPreferences({ use24HourFormat: App.state.config.use24HourFormat });
            UI.updateAll();
        });
        
App.dom.testNotificationBtn.addEventListener('click', async () => {
            const config = App.state.config;
            const lang = config.language;
            
            // 1. Notificación de prueba genérica (la que ya tenías)
            Logic.showFullAlert(Utils.getText('settings.testButton'), 'This is a test notification.', 'favicon.png');
            
            // Pausa de 2 segundos para no solapar las notificaciones
            await new Promise(resolve => setTimeout(resolve, 2000));

            // 2. Prueba de recordatorio de Misiones Diarias
            const dailyMissionEvent = config.events?.find(e => App.state.allEventsData.events[e.id]?.hasDailyMissions);
            if (dailyMissionEvent) {
                Logic.showFullAlert(
                    Utils.getText('notifications.dailyMissionReminderTitle'),
                    Utils.getText('notifications.dailyMissionReminderBody', { eventName: dailyMissionEvent.name[lang] }),
                    'favicon.png'
                );
            } else { // Fallback si no hay eventos de misión diaria
                Logic.showFullAlert('Test: Daily Mission Event', 'This is a test for a daily mission event reminder.', 'favicon.png');
            }
            
            await new Promise(resolve => setTimeout(resolve, 2000));

            // 3. Prueba de recordatorio de Fin de Evento
            const regularEvent = config.events?.find(e => !App.state.allEventsData.events[e.id]?.hasDailyMissions);
            if (regularEvent) {
                Logic.showFullAlert(
                    Utils.getText('notifications.eventEndingSoonTitle'),
                    Utils.getText('notifications.eventEndingSoonBody', { eventName: regularEvent.name[lang] }),
                    'favicon.png'
                );
            } else { // Fallback si no hay eventos regulares
                 Logic.showFullAlert('Test: Event Ending Soon', 'This is a test for an event ending soon reminder.', 'favicon.png');
            }

            await new Promise(resolve => setTimeout(resolve, 2000));

            // 4. Prueba de recordatorio de Reset Semanal
            const weeklyTimers = Logic.getWeeklyResetTimers(Logic.getCorrectedNow());
            if (weeklyTimers.length > 0) {
                // Selecciona uno al azar
                const randomWeekly = weeklyTimers[Math.floor(Math.random() * weeklyTimers.length)];
                Logic.showFullAlert(
                    Utils.getText('notifications.weeklyResetReminderTitle'),
                    Utils.getText('notifications.weeklyResetReminderBody', { weeklyName: randomWeekly.name }),
                    'favicon.png'
                );
            }

            await new Promise(resolve => setTimeout(resolve, 2000));

            // 5. Prueba de recordatorio de Nuevo Banner
            Logic.showFullAlert(
                Utils.getText('notifications.newBannerSoonTitle'),
                Utils.getText('notifications.newBannerSoonBody'),
                'favicon.png'
            );
        });
        
        
        function handleHeroClick(e) {
            const heroWrapper = e.target.closest('.banner-hero-img-container');
            if (!heroWrapper || !heroWrapper.dataset.heroName) return;
            const clickedHeroName = heroWrapper.dataset.heroName;
            const heroData = Logic.findHeroByName(clickedHeroName);
            if (!heroData) return;
            let contextHeroes = [];
            const weeklyContext = heroWrapper.closest('.weekly-recommended-heroes');
            const bannerContext = heroWrapper.closest('.banner-heroes');
            if (weeklyContext) {
                const allTagGroups = weeklyContext.querySelectorAll('.weekly-recommended-heroes-tag-group');
                allTagGroups.forEach(group => {
                    const tag = group.querySelector('.weekly-recommended-heroes-tag').textContent;
                    group.querySelectorAll('.banner-hero-img-container[data-hero-name]').forEach(heroEl => contextHeroes.push({ name: heroEl.dataset.heroName, tag }));
                });
            } else if (bannerContext) {
                bannerContext.querySelectorAll('.banner-hero-img-container[data-hero-name]').forEach(el => contextHeroes.push({ name: el.dataset.heroName, tag: null }));
            }
            const currentIndex = contextHeroes.findIndex(h => h.name === clickedHeroName);
            UI.openHeroModal(heroData, contextHeroes, currentIndex);
        }
        App.dom.bannersContainer.addEventListener('click', handleHeroClick);
        
        document.getElementById('hero-modal-close-btn').addEventListener('click', UI.closeHeroModal);
        document.getElementById('hero-modal-prev-btn').addEventListener('click', () => UI.navigateHeroModal('prev'));
        document.getElementById('hero-modal-next-btn').addEventListener('click', () => UI.navigateHeroModal('next'));
        document.getElementById('hero-modal-previews').addEventListener('click', e => {
            const item = e.target.closest('.hero-preview-item');
            if (item?.dataset.heroName) {
                const index = App.state.heroModalContext.heroes.findIndex(h => h.name === item.dataset.heroName);
                if (index > -1) UI.navigateHeroModal(index);
            }
        });

        window.addEventListener('keydown', e => {
            // Primero, comprobamos si hay algún modal de pantalla completa abierto
            const isAccountModalVisible = App.dom.accountModalOverlay?.classList.contains('visible');
            const isHeroModalVisible = App.dom.heroModalOverlay?.classList.contains('visible');

            // Lógica para la tecla Escape
            if (e.key === 'Escape') {
                if (isAccountModalVisible) {
                    UI.closeAccountModal();
                }
                if (isHeroModalVisible) {
                    UI.closeHeroModal();
                }
                // Añade aquí más comprobaciones para otros modales si es necesario
            }
            
            // Lógica para las flechas (SOLO si el modal de héroe está visible)
            if (isHeroModalVisible) {
                if (e.key === 'ArrowRight') {
                    UI.navigateHeroModal('next');
                }
                if (e.key === 'ArrowLeft') {
                    UI.navigateHeroModal('prev');
                }
            }
        });
        
        App.dom.twitchFab.addEventListener('click', () => document.getElementById('streams-modal-overlay').classList.add('visible'));
        document.getElementById('close-streams-modal').addEventListener('click', () => document.getElementById('streams-modal-overlay').classList.remove('visible'));
        
        window.addEventListener('focus', () => UI.updateLanguage());
    }

document.addEventListener('DOMContentLoaded', () => {
    // ... (lógica de SW y token sin cambios) ...

    // --- LÓGICA DE SELECCIÓN DE IDIOMA ---
    const savedLang = Utils.getCookie('userLanguage');

    if (savedLang && savedLang !== 'null') { // <-- Añadimos una comprobación extra
        // Si ya tenemos un idioma guardado (y no es la cadena "null"),
        // la pantalla de carga se quedará visible y startApp se encargará de ella.
        startApp(savedLang);
    } else {
        // --- INICIO DE LA CORRECCIÓN ---
        // Si NO hay idioma, ocultamos la pantalla de carga principal
        // para dar paso al modal de idioma.
        const loadingOverlay = document.getElementById('loading-overlay');
        if (loadingOverlay) {
            loadingOverlay.classList.add('hidden');
        }
        // --- FIN DE LA CORRECCIÓN ---

        const langModal = document.getElementById('language-modal-overlay');
        if (langModal) {
            langModal.classList.remove('hidden');
            langModal.addEventListener('click', e => {
                const langBtn = e.target.closest('.language-choice-btn');
                if (langBtn) {
                    const chosenLang = langBtn.dataset.lang;
                    startApp(chosenLang);
                }
            });
        } else {
            // Fallback
            startApp('en');
        }
    }
});

})();