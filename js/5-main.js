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
    async function startApp(locale) {
        document.getElementById('language-modal-overlay').classList.add('hidden');
        Utils.setCookie('userLanguage', locale, 365);

        try {
            const [publicConfig, gameConfig, i18nData, heroesData, eventsData, weeklyData] = await Promise.all([
                fetch(`${Logic.BACKEND_URL}/api/public-config`).then(res => res.json()),
                fetch(`${Logic.BACKEND_URL}/api/data/game-config`).then(res => res.json()),
                fetch(`${Logic.BACKEND_URL}/api/data/i18n/${locale}`).then(res => res.json()),
                fetch(`${Logic.BACKEND_URL}/api/data/heroes`).then(res => res.json()),
                fetch(`${Logic.BACKEND_URL}/api/data/events`).then(res => res.json()),
                fetch(`${Logic.BACKEND_URL}/api/data/weekly`).then(res => res.json())
            ]);

            App.state.i18n = i18nData;
            App.state.allHeroesData = heroesData;
            App.state.allEventsData = eventsData.gameData;
            App.state.weeklyResetsData = weeklyData.gameData;

            let userPrefs = {};
            const isLoggedIn = !!Logic.getSessionToken();
            App.state.isLoggedIn = isLoggedIn;
            
            if (isLoggedIn) {
                const userData = await Logic.fetchUserPreferences();
                if (userData) {
                    // Asumimos que el backend devuelve un objeto con { preferences: {...}, user: {...} }
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

            // --- INICIO DE LA CORRECCIÓN ---
            // Primero fusionamos todas las configuraciones en un solo objeto.
            const mergedConfig = { 
                ...defaultUserPrefs, 
                ...gameConfig, 
                ...userPrefs, 
                publicConfig 
            };

            // 2. AHORA, validamos el resultado. Si después de la fusión, `displayTimezone`
            //    quedó nulo o vacío, le asignamos forzosamente nuestro valor local calculado.
            if (!mergedConfig.displayTimezone) {
                mergedConfig.displayTimezone = formattedLocalTimezone;
            }

            // 3. Finalmente, asignamos la configuración validada al estado global.
            App.state.config = mergedConfig;
            // --- FIN DE LA CORRECCIÓN ---

            if (isLoggedIn) {
                const pendingTimezone = localStorage.getItem('pending_timezone_for_new_user');

                // Si hay una zona horaria pendiente Y el usuario NO tiene una guardada en la DB (`!userPrefs.displayTimezone`),
                // entonces es un usuario nuevo y debemos guardar la zona horaria.
                if (pendingTimezone && !userPrefs.displayTimezone) {
                    console.log(`Usuario nuevo detectado. Guardando zona horaria inicial: ${pendingTimezone}`);
                    
                    // Actualizamos el estado local por si acaso
                    App.state.config.displayTimezone = pendingTimezone;

                    // Llamamos a la función para guardar, pasándole solo el dato que queremos actualizar.
                    Logic.saveUserPreferences({ displayTimezone: pendingTimezone });

                    // Limpiamos el localStorage para que esto solo ocurra una vez.
                    localStorage.removeItem('pending_timezone_for_new_user');
                }
            }

            initializeUI();

        } catch (error) {
            console.error("Error fatal: No se pudo conectar con el backend.", error);
            document.body.innerHTML = `<div style="color:white; text-align:center; padding: 40px;"><h1>Error de Conexión</h1><p>No se pudo conectar con el servidor.</p></div>`;
        }
    }

    /**
     * Inicializa los componentes de la UI y el bucle principal.
     */
    function initializeUI() {
        App.initializeDOM();
        
        if (App.state.isMobile) {
            setupMobileSwiper();
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
            // Clic en los enlaces de navegación de la barra lateral
            App.dom.accountModalOverlay.addEventListener('click', e => {
                const navItem = e.target.closest('.nav-item');
                if (navItem) {
                    e.preventDefault();
                    const sectionId = navItem.dataset.section;

                    // --- INICIO DE LA LÓGICA DE BLOQUEO ---
                    // Secciones que requieren inicio de sesión
                    const protectedSections = ['push-notifications'];

                    if (protectedSections.includes(sectionId) && !App.state.isLoggedIn) {
                        // Si el usuario es invitado y la sección está protegida, muestra una alerta.
                        UI.openLoginRequiredModal();
                    } else {
                        // Si no, permite el cambio de sección.
                        UI.switchAccountModalSection(sectionId);
                    }
                    // --- FIN DE LA LÓGICA DE BLOQUEO ---
                }
                
                // Clic para cerrar si se pulsa fuera del modal
                if (e.target === e.currentTarget) {
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
                    if (confirm('Are you sure you want to remove this subscription?')) { // Idealmente, este texto también iría en i18n
                        // Reutilizamos la función de desuscripción, pero ahora la adaptamos
                        await Logic.unsubscribeFromPushNotifications(endpoint);
                        // Después de eliminar, volvemos a renderizar la lista para que desaparezca el elemento
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
            const newConfig = {
                language: App.dom.languageSelect.value,
                displayTimezone: App.dom.timezoneSelect.value,
                use24HourFormat: App.dom.timeFormatSwitch.checked,
                preAlertMinutes: App.dom.preAlertInput.value.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n) && n > 0),
                notificationTypes: { sound: App.dom.soundToggle.checked, desktop: App.dom.desktopToggle.checked },
                showBossTimers: App.dom.bossTimersToggle.checked,
                showEvents: App.dom.eventsToggle.checked,
                showWeekly: App.dom.weeklyToggle.checked,
                notificationPrefs: App.state.config.notificationPrefs
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
        
        App.dom.testNotificationBtn.addEventListener('click', () => Logic.showFullAlert(Utils.getText('settings.testButton'), 'This is a test notification.', 'favicon.png'));
        
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
        if ('serviceWorker' in navigator) {
            const isLocalhost = ['localhost', '127.0.0.1'].includes(window.location.hostname);
            const serviceWorkerPath = isLocalhost ? '/serviceworker.js' : '/bnsheroes-timer/serviceworker.js';
            navigator.serviceWorker.register(serviceWorkerPath)
                .then(reg => console.log('SW registrado:', reg.scope))
                .catch(err => console.error('Error al registrar SW:', err));
        }

        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get('token');
        if (token) {
            localStorage.setItem('session_token', token);
            window.history.replaceState({}, document.title, window.location.pathname + window.location.hash);
        }

        const savedLang = Utils.getCookie('userLanguage') || (navigator.language.startsWith('es') ? 'es' : 'en');
        if (savedLang) {
            startApp(savedLang);
        } else {
            const langModal = document.getElementById('language-modal-overlay');
            langModal.classList.remove('hidden');
            langModal.addEventListener('click', e => {
                const langBtn = e.target.closest('.language-choice-btn');
                if (langBtn) {
                    startApp(langBtn.dataset.lang);
                }
            });
        }
    });

})();