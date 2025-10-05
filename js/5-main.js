'use strict';

/**
 * Punto de entrada principal de la aplicación.
 * Se auto-ejecuta para evitar contaminar el scope global.
 */
(function () {

    /**
     * Inicializa la aplicación después de cargar los datos.
     * Configura el estado inicial, la UI y los listeners.
     */
    function initialize() {
        // 1. Poblar las referencias del DOM.
        App.initializeDOM();

        // 2. Ahora que los elementos del DOM existen, podemos continuar.
        Logic.loadSettings();
        UI.populateSelects();
        UI.updateLanguage();
        Logic.requestNotificationPermission();
        
        addEventListeners();

        // Bucle principal que actualiza la UI cada segundo
        setInterval(() => UI.updateAll(), 1000);
        UI.updateAll(); // Ejecutar una vez inmediatamente para no esperar 1s
    }

    /**
     * Configura todos los listeners de eventos de la aplicación.
     * Centraliza el manejo de interacciones del usuario.
     */
    function addEventListeners() {
        // Listeners para clics dentro de los paneles principales
        App.dom.mainWrapper.addEventListener('click', e => {
            const infoBtn = e.target.closest('.info-button');
            const syncBtn = e.target.closest('.sync-button');
            const alertToggle = e.target.closest('.alert-toggle');
            if (infoBtn) UI.openInfoModal();
            if (syncBtn) UI.openSyncModal();
            if (alertToggle) {
                 Logic.toggleAlertState(alertToggle.dataset.bossId, alertToggle.dataset.time);
            }
        });

        // Listener para clics en los items de evento
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

        // Listener para cerrar el panel de detalles del evento
        App.dom.eventDetailsPanel.addEventListener('click', e => {
            if (e.target.closest('.close-details-btn')) {
                UI.closeEventDetailsPanel();
            }
        });

        // Listener para clics en los héroes de los banners
        App.dom.bannersContainer.addEventListener('click', e => {
            const heroWrapper = e.target.closest('.banner-hero-img-container');
            if (heroWrapper && heroWrapper.dataset.heroName) {
                const hero = Logic.findHeroByName(heroWrapper.dataset.heroName);
                UI.openHeroModal(hero);
            }
        });
        
        // Listeners para botones y controles globales
        App.dom.settingsButton.addEventListener('click', () => UI.openSettingsModal());
        App.dom.saveSettingsBtn.addEventListener('click', () => Logic.saveSettings());
        
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
            document.body.innerHTML = `<div style="color: white; text-align: center; padding: 50px;">Error al cargar datos. Asegúrate de que los archivos 'heroes_data.json' y 'events_full.json' existen y son accesibles. Revisa la consola (F12) para más detalles.</div>`;
        });
    });

})();