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
     */
    async function startApp(locale) {
        document.getElementById('language-modal-overlay').classList.add('hidden');
        const loadingOverlay = document.getElementById('loading-overlay');
        const loadingMessageEl = document.getElementById('loading-message');
        const appWrapper = document.querySelector('.app-wrapper');

        Utils.setCookie('userLanguage', locale, 365);

        try {
            const loadStartTime = Date.now();

            const fetchData = async (url) => {
                const response = await fetch(url, { cache: 'no-cache' });
                if (!response.ok) {
                    throw new Error(`Error de red al cargar ${url}: ${response.status} ${response.statusText}`);
                }
                return response.json();
            };

            const [
                publicConfig, gameConfig, i18nData, heroesData,
                eventsData, weeklyData, bossesData, streamsData, bannersData, itemsData,
                heroweekData
            ] = await Promise.all([
                fetchData(`${Logic.BACKEND_URL}/api/public-config`),
                fetchData(`${Logic.BACKEND_URL}/api/data/game-config`),
                fetchData(`${Logic.BACKEND_URL}/api/data/i18n/${locale}`),
                fetchData(`${Logic.BACKEND_URL}/api/data/heroes`),
                fetchData(`${Logic.BACKEND_URL}/api/data/events`),
                fetchData(`${Logic.BACKEND_URL}/api/data/weekly`),
                fetchData(`${Logic.BACKEND_URL}/api/data/bosses`),
                fetchData(`${Logic.BACKEND_URL}/api/data/streams`),
                fetchData(`${Logic.BACKEND_URL}/api/data/banners`),
                fetchData(`${Logic.BACKEND_URL}/api/data/items`),
                fetchData(`${Logic.BACKEND_URL}/api/data/heroweek`),
            ]);

            App.state.i18n = i18nData;
            App.state.allHeroesData = heroesData;
            App.state.allEventsData = eventsData.gameData;
            App.state.weeklyResetsData = weeklyData.gameData;
            App.state.allBossesData = bossesData.bosses;
            App.state.allStreamsData = streamsData.streams;
            App.state.allBannersData = bannersData.banners;
            App.state.allItemsData = itemsData;
            App.state.allHeroWeekData = heroweekData;

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
                if (cookiePrefs) try { userPrefs = JSON.parse(cookiePrefs); } catch (e) { }
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

            if (isLoggedIn) {
                const pendingTimezone = localStorage.getItem('pending_timezone_for_new_user');
                if (pendingTimezone && !userPrefs.displayTimezone) {
                    App.state.config.displayTimezone = pendingTimezone;
                    Logic.saveUserPreferences({ displayTimezone: pendingTimezone });
                    localStorage.removeItem('pending_timezone_for_new_user');
                }
            }

            const elapsedTime = Date.now() - loadStartTime;
            const minLoadTime = 1500;
            const remainingTime = Math.max(0, minLoadTime - elapsedTime);

            setTimeout(() => {
                clearInterval(messageInterval);
                loadingOverlay.classList.add('hidden');
                appWrapper.classList.remove('hidden');
                initializeUI();
            }, remainingTime);

        } catch (error) {
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

        if (document.getElementById('btn-add-reminder')) {
        UI.setupReminderForm();
    }

        UI.populateSelects();
        addEventListeners();
        UI.applyLanguage();
        UI.updateLoginStatus();

        Logic.requestNotificationPermission();

        UI.updateAll();
        setInterval(() => {
            UI.updateAll();
            // CHEQUEAR RECORDATORIOS
            const now = Logic.getCorrectedNow(); // O new Date() si quieres hora local del PC
            Logic.checkCustomReminders(now);
        }, 1000);
    }


    /**
     * Contenedor para todos los event listeners de la aplicación.
     */
    function addEventListeners() {

        // --- MANEJO DE CLICS EN PANELES DE TIMERS (Global) ---
         function handlePanelClick(e) {
            // 1. Botón de Información (Ticket) - Funciona en ambos paneles
            if (e.target.closest('.info-button')) return UI.openInfoModal();

            // 2. Botón de Sincronización (Ticket) - Funciona en ambos paneles
            if (e.target.closest('.sync-button')) return UI.openSyncModal();

            // 3. Toggle de Alerta (Campanita) - Funciona en ambos paneles
            const alertToggle = e.target.closest('.alert-toggle');
            if (alertToggle) {
                const { bossId, time } = alertToggle.dataset;
                const key = `${bossId}_${time}`;
                
                if (!App.state.config.notificationPrefs) App.state.config.notificationPrefs = {};
                if (!App.state.config.notificationPrefs.bosses) App.state.config.notificationPrefs.bosses = {};
                
                const isCurrentlyDisabled = alertToggle.classList.contains('disabled');
                App.state.config.notificationPrefs.bosses[key] = isCurrentlyDisabled;
                
                Logic.saveUserPreferences({ prefs: App.state.config.notificationPrefs });
                UI.updateAll();
                
                return; // Salimos para no procesar nada más
            }

            // 4. ABRIR DETALLES DEL BOSS
            // --- CAMBIO AQUÍ: Solo si el clic ocurrió dentro del Panel Secundario ---
            if (e.target.closest('.secondary-panel')) {
                const bossItem = e.target.closest('[data-boss-id]');
                if (bossItem && bossItem.dataset.bossId) {
                    const clickedBossId = bossItem.dataset.bossId;

                    // --- NUEVA LÓGICA DE TOGGLE ---
                    if (App.state.currentOpenBossId === clickedBossId) {
                        UI.closeBossDetailsPanel();
                    } else {
                        UI.openBossDetailsPanel(clickedBossId);
                        
                        // Scroll top en móvil si es necesario
                        if (App.state.isMobile) {
                            window.scrollTo(0, 0);
                        }
                    }
                }
            }
        }

        App.dom.primaryPanel.addEventListener('click', handlePanelClick);
        App.dom.secondaryPanel.addEventListener('click', handlePanelClick);

        // --- LISTENER DEL PANEL DE DETALLES DE BOSS ---
        // Maneja cierre y cambio de pestañas
        if (App.dom.bossDetailsPanel) {
            App.dom.bossDetailsPanel.addEventListener('click', (e) => {
                // 1. Caso: Cerrar panel
                if (e.target.closest('.close-details-btn')) {
                    UI.closeBossDetailsPanel();
                    return;
                }

                // 2. Caso: Cambiar de Boss (clic en los iconos/tabs)
                const switchBtn = e.target.closest('[data-switch-boss-id]');
                if (switchBtn) {
                    const newBossId = switchBtn.dataset.switchBossId;
                    // Llamamos a la función de apertura con el nuevo ID
                    UI.openBossDetailsPanel(newBossId);
                }
            });
        }

        // --- MANEJO DE CLICS EN EVENTOS ---
        App.dom.eventsContainer.addEventListener('click', e => {
            const eventItem = e.target.closest('.event-item');
            if (eventItem?.dataset.eventId) {
                if (App.state.currentOpenEventId === eventItem.dataset.eventId) {
                    UI.closeEventDetailsPanel();
                } else {
                    UI.openEventDetailsPanel(eventItem.dataset.eventId);
                }
            }
        });

        // --- MANEJO DE CLICS EN SEMANALES ---
        App.dom.weeklyContainer.addEventListener('click', e => {
            const weeklyItem = e.target.closest('.weekly-item');
            if (!weeklyItem) return;

            const weeklyId = weeklyItem.dataset.weeklyId;
            const hotwId = weeklyItem.dataset.hotwId;
            const clickedId = weeklyId || hotwId;

            if (App.state.currentOpenWeeklyId === clickedId) {
                UI.closeWeeklyDetailsPanel();
                return;
            }

            if (weeklyId) {
                UI.openWeeklyDetailsPanel(weeklyId);
            } else if (hotwId) {
                UI.openHeroOfTheWeekDetailsPanel(hotwId);
            }
        });

        // --- MANEJADOR UNIFICADO PARA CLICS EN PANELES DE DETALLE (EVENTOS/SEMANAL) ---
        function handleDetailsPanelClick(e) {
            // 1. Botón Cerrar
            if (e.target.closest('.close-details-btn')) {
                UI.closeEventDetailsPanel();
                UI.closeWeeklyDetailsPanel();
                return;
            }

            // 2. Clic en Héroes (para abrir modal)
            handleHeroClick(e);

            // 3. Buffs expandibles
            const buffItem = e.target.closest('.weekly-buff-item.expandable');
            if (buffItem) {
                const enhancementsList = buffItem.nextElementSibling;
                if (enhancementsList && enhancementsList.classList.contains('weekly-enhancements-list')) {
                    buffItem.classList.toggle('expanded');
                    enhancementsList.classList.toggle('expanded');
                }
            }
        }

        document.getElementById('event-details-panel').addEventListener('click', handleDetailsPanelClick);
        document.getElementById('weekly-details-panel').addEventListener('click', handleDetailsPanelClick);

        // Listener para el botón de guardar de "Account Settings" (Push Notifications)
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

                App.state.config.notificationPrefs = newPushPrefs;
                Logic.saveUserPreferences({ notificationPrefs: newPushPrefs });

                await Utils.alert('alert.settingsSaved.title', 'alert.settingsSaved.body');
                UI.closeAccountModal();
            });
        }

        // --- CONFIGURACIÓN GENERAL ---
        App.dom.settingsButton.addEventListener('click', UI.openSettingsModal);
        document.getElementById('close-settings-btn').addEventListener('click', UI.closeSettingsModal);
        App.dom.accountModalOverlay.addEventListener('click', e => { if (e.target === e.currentTarget) UI.closeAccountModal(); });
        document.getElementById('close-account-modal-btn').addEventListener('click', UI.closeAccountModal);
        App.dom.aboutButton.addEventListener('click', UI.openAboutModal);
        document.getElementById('close-about-btn').addEventListener('click', UI.closeAboutModal);
        document.getElementById('close-info-btn').addEventListener('click', UI.closeInfoModal);

        if (App.dom.accountModalOverlay) {
            App.dom.accountModalOverlay.addEventListener('click', async (e) => {
                // 1. Manejo de navegación del Sidebar (Pestañas)
                const navItem = e.target.closest('.nav-item');
                if (navItem) {
                    e.preventDefault();
                    const sectionId = navItem.dataset.section;
                    
                    // Agregamos 'reminders' a las secciones que requieren login
                    const protectedSections = ['push-notifications', 'reminders'];
                    
                    if (protectedSections.includes(sectionId) && !App.state.isLoggedIn) {
                        UI.openLoginRequiredModal();
                    } else {
                        UI.switchAccountModalSection(sectionId);
                        
                        // Si se hizo clic en Reminders, cargamos la lista desde la API
                        if (sectionId === 'reminders') {
                            UI.renderRemindersList();
                        }
                    }
                    return;
                }

                // 2. Botón de nueva suscripción Push
                if (e.target.closest('#account-subscribe-push-btn')) {
                    UI.handleAddNewSubscription();
                    return;
                }

                // 3. Botón de eliminar suscripción Push
                const deleteButton = e.target.closest('.delete-subscription-btn');
                if (deleteButton) {
                    const endpoint = deleteButton.dataset.endpoint;
                    const confirmed = await Utils.confirm('confirm.deleteSub.title', 'confirm.deleteSub.body');
                    if (confirmed) {
                        await Logic.unsubscribeFromPushNotifications(endpoint);
                        UI.renderActiveSubscriptions();
                    }
                    return;
                }

                // 4. Cerrar el modal (Botón X o clic en fondo)
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

        if (App.dom.logoutBtnModal) {
            App.dom.logoutBtnModal.addEventListener('click', () => Logic.logout());
        }

        App.dom.modalOverlay.addEventListener('click', e => { if (e.target === e.currentTarget) UI.closeSettingsModal(); });
        App.dom.infoModalOverlay.addEventListener('click', e => { if (e.target === e.currentTarget) UI.closeInfoModal(); });
        App.dom.syncModalOverlay.addEventListener('click', e => { if (e.target === e.currentTarget) UI.closeSyncModal(); });
        App.dom.aboutModalOverlay.addEventListener('click', e => { if (e.target === e.currentTarget) UI.closeAboutModal(); });
        document.getElementById('streams-modal-overlay').addEventListener('click', e => { if (e.target === e.currentTarget) document.getElementById('streams-modal-overlay').classList.remove('visible'); });

        // --- GUARDAR CONFIGURACIÓN ---
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
            const showdownTicketEnabled = document.getElementById('showdown-ticket-toggle').checked;
            
            if (!App.state.config.notificationPrefs) App.state.config.notificationPrefs = {};
            App.state.config.notificationPrefs.showdownTicket = showdownTicketEnabled;

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

            // Detectar cambios
            const languageChanged = newConfig.language !== App.state.config.language;
            const timezoneChanged = newConfig.displayTimezone !== App.state.config.displayTimezone;
            const formatChanged = newConfig.use24HourFormat !== App.state.config.use24HourFormat;
            

            if (languageChanged) {
                try {
                    const newTranslations = await Logic.fetchLocaleData(newConfig.language);
                    if (newTranslations) {
                        App.state.i18n = newTranslations;
                        Utils.setCookie('userLanguage', newConfig.language, 365);
                    }
                } catch (err) {
                    console.error("Error cargando idioma:", err);
                    return; 
                }
            }

            App.state.config = { ...App.state.config, ...newConfig };
            Logic.saveUserPreferences(App.state.config);
            UI.closeSettingsModal();

            // --- CORRECCIÓN AQUÍ ---
            // Si cambia el idioma, la zona horaria o el formato 12/24h, 
            // reseteamos todas las cachés de renderizado para forzar el redibujado de las horas.
            if (languageChanged || timezoneChanged || formatChanged) {
                App.state.lastRenderedBannerIds = null;
                App.state.lastRenderedEventIds = null;
                App.state.lastRenderedWeeklyIds = null;
                App.state.lastRenderedBossIds = null;
                App.state.lastRenderedPrimaryTimers = null;
                App.state.lastShowSecondaryPanel = null;

                if (languageChanged) {
                    UI.populateSelects();
                }
                UI.applyLanguage(); 
            }
            // -----------------------

            UI.updateAll();
            
            if (App.state.isMobile && App.state.swiper) {
                setTimeout(() => {
                    App.state.swiper.update();
                }, 50);
            }
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

        const streamsModalFooter = document.querySelector('.streams-modal-footer');
        if (streamsModalFooter) {
            streamsModalFooter.addEventListener('change', (e) => {
                if (e.target.type === 'checkbox') {
                    const preStreamAlert = document.getElementById('pre-stream-alert-toggle').checked;
                    const postStreamAlert = document.getElementById('post-stream-alert-toggle').checked;

                    if (!App.state.config.notificationPrefs) {
                        App.state.config.notificationPrefs = {};
                    }
                    App.state.config.notificationPrefs.streams = {
                        pre: preStreamAlert,
                        post: postStreamAlert
                    };

                    Logic.saveUserPreferences({ notificationPrefs: App.state.config.notificationPrefs });
                }
            });
        }

        // --- SWITCH 12h/24h (ACTUALIZACIÓN INSTANTÁNEA) ---
        App.dom.timeFormatSwitch.addEventListener('change', () => {
            // 1. Guardar configuración
            App.state.config.use24HourFormat = App.dom.timeFormatSwitch.checked;
            Logic.saveUserPreferences({ use24HourFormat: App.state.config.use24HourFormat });

            // 2. FORZAR RE-RENDERIZADO (Resetear caché)
            // Esto obliga a UI.updateAll() a redibujar el HTML con el nuevo formato de hora
            App.state.lastRenderedPrimaryTimers = null; 
            App.state.lastRenderedBossIds = null;     
            App.state.lastRenderedEventIds = null;
            App.state.lastRenderedWeeklyIds = null;

            // 3. Actualizar
            UI.applyLanguage(); // <--- AÑADIR ESTA LÍNEA (Refresca el modal abierto)

            UI.updateAll();
        });

        App.dom.testNotificationBtn.addEventListener('click', async () => {
            const config = App.state.config;
            const lang = config.language;

            Logic.showFullAlert(Utils.getText('settings.testButton'), 'This is a test notification.', 'favicon.png');
            await new Promise(resolve => setTimeout(resolve, 2000));

            const dailyMissionEvent = config.events?.find(e => App.state.allEventsData.events[e.id]?.hasDailyMissions);
            if (dailyMissionEvent) {
                Logic.showFullAlert(
                    Utils.getText('notifications.dailyMissionReminderTitle'),
                    Utils.getText('notifications.dailyMissionReminderBody', { eventName: dailyMissionEvent.name[lang] }),
                    'favicon.png'
                );
            } else {
                Logic.showFullAlert('Test: Daily Mission Event', 'This is a test for a daily mission event reminder.', 'favicon.png');
            }

            await new Promise(resolve => setTimeout(resolve, 2000));

            const regularEvent = config.events?.find(e => !App.state.allEventsData.events[e.id]?.hasDailyMissions);
            if (regularEvent) {
                Logic.showFullAlert(
                    Utils.getText('notifications.eventEndingSoonTitle'),
                    Utils.getText('notifications.eventEndingSoonBody', { eventName: regularEvent.name[lang] }),
                    'favicon.png'
                );
            } else {
                Logic.showFullAlert('Test: Event Ending Soon', 'This is a test for an event ending soon reminder.', 'favicon.png');
            }

            await new Promise(resolve => setTimeout(resolve, 2000));

            const weeklyTimers = Logic.getWeeklyResetTimers(Logic.getCorrectedNow());
            if (weeklyTimers.length > 0) {
                const randomWeekly = weeklyTimers[Math.floor(Math.random() * weeklyTimers.length)];
                Logic.showFullAlert(
                    Utils.getText('notifications.weeklyResetReminderTitle'),
                    Utils.getText('notifications.weeklyResetReminderBody', { weeklyName: randomWeekly.name }),
                    'favicon.png'
                );
            }

            await new Promise(resolve => setTimeout(resolve, 2000));

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
            const isAccountModalVisible = App.dom.accountModalOverlay?.classList.contains('visible');
            const isHeroModalVisible = App.dom.heroModalOverlay?.classList.contains('visible');

            if (e.key === 'Escape') {
                if (isAccountModalVisible) {
                    UI.closeAccountModal();
                }
                if (isHeroModalVisible) {
                    UI.closeHeroModal();
                }
            }

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
        // 1. REGISTRAR EL SERVICE WORKER
        if ('serviceWorker' in navigator) {
            const isLocalhost = ['localhost', '127.0.0.1'].includes(window.location.hostname);
            const serviceWorkerPath = isLocalhost ? '/serviceworker.js' : '/bnsheroes-timer/serviceworker.js';
            
            navigator.serviceWorker.register(serviceWorkerPath).then(reg => {
                console.log('SW registrado:', reg.scope);

                // Si hay una actualización esperando, forzamos la actualización
                if (reg.waiting) {
                    updateReady(reg.waiting);
                    return;
                }

                reg.addEventListener('updatefound', () => {
                    const newWorker = reg.installing;
                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            // Nueva versión detectada, forzamos recarga
                            console.log('Nueva versión detectada. Recargando...');
                            window.location.reload();
                        }
                    });
                });
            }).catch(err => console.error('Error al registrar SW:', err));
            
            // Recargar si el controller cambia (es decir, si el nuevo SW toma el control)
            let refreshing;
            navigator.serviceWorker.addEventListener('controllerchange', () => {
                if (refreshing) return;
                window.location.reload();
                refreshing = true;
            });
        }

        // 2. PROCESAR TOKEN DE LOGIN SI EXISTE EN LA URL
        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get('token');
        if (token) {
            localStorage.setItem('session_token', token);
            window.history.replaceState({}, document.title, window.location.pathname + window.location.hash);
            window.location.reload();
            return; 
        }

        // 3. DECIDIR SI MOSTRAR MODAL DE IDIOMA O INICIAR LA APP
        const savedLang = Utils.getCookie('userLanguage');

        if (savedLang && savedLang !== 'null') {
            startApp(savedLang);
        } else {
            const loadingOverlay = document.getElementById('loading-overlay');
            if (loadingOverlay) {
                loadingOverlay.classList.add('hidden');
            }
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
                startApp('en');
            }
        }
    });

})();