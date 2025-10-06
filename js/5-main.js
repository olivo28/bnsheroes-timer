'use strict';

/**
 * Punto de entrada principal de la aplicación.
 * Se auto-ejecuta para evitar contaminar el scope global.
 */
(function () {

    /**
     * Reestructura el DOM para usar Swiper en dispositivos móviles.
     * Coge los paneles existentes y los envuelve en la estructura de slides de Swiper.
     */
    function setupMobileSwiper() {
        const mainWrapper = document.querySelector('.main-wrapper');
        const primaryPanel = document.querySelector('.primary-panel');
        const secondaryPanel = document.querySelector('.secondary-panel');

        // Si los elementos no existen, no hacer nada.
        if (!mainWrapper || !primaryPanel || !secondaryPanel) return;

        // 1. Crear la estructura HTML que Swiper necesita
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

        // 2. Mover los paneles originales dentro de los nuevos 'slides'
        slide1.appendChild(primaryPanel);
        slide2.appendChild(secondaryPanel);
        swiperWrapper.appendChild(slide1);
        swiperWrapper.appendChild(slide2);

        // 3. Ensamblar la estructura final del Swiper
        swiperContainer.appendChild(swiperWrapper);
        swiperContainer.appendChild(pagination);

        // 4. Limpiar el contenedor original y añadir la nueva estructura Swiper
        mainWrapper.innerHTML = '';
        mainWrapper.appendChild(swiperContainer);
        
        // 5. Inicializar la librería Swiper sobre la nueva estructura
        App.state.swiper = new Swiper('.mobile-swiper-container', {
            // AÑADIMOS LA SOLUCIÓN: autoHeight ajustará la altura del carrusel dinámicamente
            autoHeight: true, 
            loop: false,
            pagination: {
                el: '.swiper-pagination',
                clickable: true,
            },
        });
    }

    /**
     * Inicializa la aplicación después de cargar los datos.
     * Configura el estado inicial, la UI y los listeners.
     */
    function initialize() {
        App.initializeDOM();
        
        // Solo reestructuramos el DOM y creamos el Swiper si es móvil
        if (App.state.isMobile) {
            setupMobileSwiper();
            // Es crucial volver a buscar las referencias a los paneles, ya que los hemos movido en el DOM.
            App.dom.primaryPanel = document.querySelector('.primary-panel');
            App.dom.secondaryPanel = document.querySelector('.secondary-panel');
        }
        
        Logic.loadSettings();
        UI.populateSelects();
        UI.updateLanguage();
        Logic.requestNotificationPermission();
        
        addEventListeners();

        // CORRECCIÓN: Retrasamos el inicio del bucle de actualización
        // para dar tiempo a que Swiper se inicialice completamente.
        setTimeout(() => {
            UI.updateAll(); // Primera ejecución
            setInterval(() => UI.updateAll(), 1000); // Bucle principal
        }, 100); // Un pequeño retraso de 100ms es más que suficiente
    }

    /**
     * Configura todos los listeners de eventos de la aplicación.
     * Centraliza el manejo de interacciones del usuario.
     */
    function addEventListeners() {
        // En móvil, el clic se gestiona en mainWrapper. En PC, en primaryPanel.
        // Unimos los listeners para simplificar.
        const clickArea1 = App.dom.primaryPanel;
        const clickArea2 = App.dom.secondaryPanel;

        function handlePanelClick(e) {
            const infoBtn = e.target.closest('.info-button');
            const syncBtn = e.target.closest('.sync-button');
            const alertToggle = e.target.closest('.alert-toggle');
            if (infoBtn) UI.openInfoModal();
            if (syncBtn) UI.openSyncModal();
            if (alertToggle) {
                 Logic.toggleAlertState(alertToggle.dataset.bossId, alertToggle.dataset.time);
            }
        }
        
        if (clickArea1) clickArea1.addEventListener('click', handlePanelClick);
        if (clickArea2) clickArea2.addEventListener('click', handlePanelClick);


        // Listener para clics en los items de evento
        if(App.dom.eventsContainer) {
            App.dom.eventsContainer.addEventListener('click', e => {
                const eventItem = e.target.closest('.event-item');
                if (eventItem && eventItem.dataset.eventId) {
                    const eventId = eventItem.dataset.eventId;
                    if (eventId === App.state.currentOpenEventId) {
                        UI.closeEventDetailsPanel();
                    } else {
                        UI.openEventDetailsPanel(eventId);
                    }
                }
            });
        }

        // Listener para cerrar el panel de detalles del evento
        if(App.dom.eventDetailsPanel) {
            App.dom.eventDetailsPanel.addEventListener('click', e => {
                if (e.target.closest('.close-details-btn')) {
                    UI.closeEventDetailsPanel();
                }
            });
        }

        // Listener para clics en los héroes de los banners
        if(App.dom.bannersContainer) {
            App.dom.bannersContainer.addEventListener('click', e => {
                const heroWrapper = e.target.closest('.banner-hero-img-container');
                if (heroWrapper && heroWrapper.dataset.heroName) {
                    const hero = Logic.findHeroByName(heroWrapper.dataset.heroName);
                    UI.openHeroModal(hero);
                }
            });
        }
        
        // Listeners para botones y controles globales
        App.dom.settingsButton.addEventListener('click', () => UI.openSettingsModal());
        App.dom.saveSettingsBtn.addEventListener('click', () => Logic.saveSettings());
        App.dom.closeSettingsBtn.addEventListener('click', () => UI.closeSettingsModal());
        
        App.dom.timeFormatSwitch.addEventListener('change', () => {
            App.state.config.use24HourFormat = App.dom.timeFormatSwitch.checked;
            Logic.saveConfigToCookie();
            UI.updateAll();
        });
        
        App.dom.testNotificationBtn.addEventListener('click', () => {
            const lang = I18N_STRINGS[App.state.config.currentLanguage];
            const testBoss = App.state.config.bosses[0];
            if (!testBoss) return;
            if (Notification.permission !== 'granted') {
                Logic.requestNotificationPermission();
                alert(lang.notificationBlocked);
                return;
            }
            Logic.showFullAlert(lang.notificationPreAlert(testBoss.name[App.state.config.currentLanguage], 1), lang.notificationPreAlertBody(testBoss.location), testBoss.imageUrl);
            setTimeout(() => { const rt = Utils.formatDateToTimezoneString(new Date(), App.state.config.displayTimezone, App.state.config.use24HourFormat); Logic.showFullAlert(lang.notificationReset, lang.notificationResetBody(rt), App.state.config.dailyResetImageUrl); }, 1000);
            setTimeout(() => { Logic.showFullAlert(lang.notificationShowdownReady, lang.notificationShowdownReadyBody, App.state.config.showdownTicketImageUrl); }, 2000);
        });

        App.dom.saveSyncBtn.addEventListener('click', () => Logic.saveSyncData());
        App.dom.aboutButton.addEventListener('click', () => UI.openAboutModal());
        App.dom.closeAboutBtn.addEventListener('click', () => UI.closeAboutModal());
        App.dom.closeInfoBtn.addEventListener('click', () => UI.closeInfoModal());

        // Listeners para cerrar modales haciendo clic fuera
        App.dom.modalOverlay.addEventListener('click', e => { if (e.target === App.dom.modalOverlay) UI.closeSettingsModal(); });
        App.dom.infoModalOverlay.addEventListener('click', e => { if (e.target === App.dom.infoModalOverlay) UI.closeInfoModal(); });
        App.dom.syncModalOverlay.addEventListener('click', e => { if (e.target === App.dom.syncModalOverlay) UI.closeSyncModal(); });
        App.dom.aboutModalOverlay.addEventListener('click', e => { if (e.target === App.dom.aboutModalOverlay) UI.closeAboutModal(); });
        App.dom.heroModalOverlay.addEventListener('click', () => UI.closeHeroModal());

        // Listeners para el botón flotante y modal de streams
        App.dom.twitchFab.addEventListener('click', () => {
            App.dom.streamsModalOverlay.classList.add('visible');
        });
        
        App.dom.closeStreamsModal.addEventListener('click', () => {
            App.dom.streamsModalOverlay.classList.remove('visible');
        });

        App.dom.streamsModalOverlay.addEventListener('click', (e) => {
            if (e.target === App.dom.streamsModalOverlay) {
                App.dom.streamsModalOverlay.classList.remove('visible');
            }
        });

        // Listeners para los checkboxes de notificación de streams
        App.dom.preStreamAlertToggle.addEventListener('change', () => {
            App.state.config.streamAlerts.preStream = App.dom.preStreamAlertToggle.checked;
            Logic.saveConfigToCookie();
        });
        App.dom.postStreamAlertToggle.addEventListener('change', () => {
            App.state.config.streamAlerts.postStream = App.dom.postStreamAlertToggle.checked;
            Logic.saveConfigToCookie();
        });

        // Actualizar idioma si el usuario vuelve a la pestaña
        window.addEventListener('focus', () => UI.updateLanguage());
    }

    // Espera a que el DOM esté listo antes de hacer nada.
    document.addEventListener('DOMContentLoaded', () => {
        // Cargar datos externos (JSON) es lo primero.
        Promise.all([
            fetch('json_data/heroes_data.json').then(res => res.json()),
            fetch('json_data/events_full.json').then(res => res.json())
        ])
        .then(([heroesData, eventsData]) => {
            // Una vez cargados los datos, los guardamos en el estado.
            App.state.allHeroesData = heroesData;
            App.state.allEventsData = eventsData.events;
            
            // Ahora que los datos están listos, podemos inicializar la aplicación.
            initialize();
        })
        .catch(error => {
            console.error("Error cargando los datos iniciales (heroes_data.json o events_full.json):", error);
            document.body.innerHTML = `<div style="text-align: center; color: white; padding: 40px;"><p>Error al cargar datos. Asegúrate de que los archivos 'heroes_data.json' y 'events_full.json' existen y son accesibles.</p><p>Revisa la consola (F12) para más detalles.</p></div>`;
        });
    });

})();