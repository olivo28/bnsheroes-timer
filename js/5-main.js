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
        
        if (App.state.isMobile) {
            setupMobileSwiper();
            App.dom.primaryPanel = document.querySelector('.primary-panel');
            App.dom.secondaryPanel = document.querySelector('.secondary-panel');
        }
        
        Logic.loadSettings();
        UI.populateSelects();
        UI.updateLanguage(); // Muestra "Inicializando..."
        
        // --- LLAMADA A LA SINCRONIZACIÓN ---
        Logic.syncWithWorldTime().then(() => {
            // Este código se ejecuta DESPUÉS de que la sincronización termine
            Logic.requestNotificationPermission();
            addEventListeners();
            
            setTimeout(() => {
                UI.updateAll();
                setInterval(() => UI.updateAll(), 1000);
            }, 100);
        });
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

        // Listener para clics en los items de evento semanales
        if(App.dom.weeklyContainer) {
            App.dom.weeklyContainer.addEventListener('click', e => {
                const weeklyItem = e.target.closest('.weekly-item');
                if (weeklyItem && weeklyItem.dataset.weeklyId) {
                    const weeklyId = weeklyItem.dataset.weeklyId;
                    if (weeklyId === App.state.currentOpenWeeklyId) {
                        UI.closeWeeklyDetailsPanel();
                    } else {
                        UI.openWeeklyDetailsPanel(weeklyId);
                    }
                }
            });
        }

        // --- INICIO: LÓGICA DE CLIC EN HÉROES (REFACTORIZADA) ---
        function handleHeroClick(e) {
            const heroWrapper = e.target.closest('.banner-hero-img-container');
            if (!heroWrapper || !heroWrapper.dataset.heroName) return;

            const clickedHeroName = heroWrapper.dataset.heroName;
            const heroData = Logic.findHeroByName(clickedHeroName);
            if (!heroData) return;

            let contextHeroes = []; // Ahora será un array de objetos {name, tag}

            const weeklyContext = heroWrapper.closest('.weekly-recommended-heroes');
            const bannerContext = heroWrapper.closest('.banner-heroes');

            if (weeklyContext) {
                // Lógica para agrupar TODOS los héroes recomendados
                const allTagGroups = weeklyContext.querySelectorAll('.weekly-recommended-heroes-tag-group');
                allTagGroups.forEach(group => {
                    const tag = group.querySelector('.weekly-recommended-heroes-tag').textContent;
                    const heroesInGroup = group.querySelectorAll('.banner-hero-img-container[data-hero-name]');
                    heroesInGroup.forEach(heroEl => {
                        contextHeroes.push({ name: heroEl.dataset.heroName, tag: tag });
                    });
                });
            } else if (bannerContext) {
                // Lógica original para banners (sin tags)
                const allHeroElements = bannerContext.querySelectorAll('.banner-hero-img-container[data-hero-name]');
                allHeroElements.forEach(el => {
                    contextHeroes.push({ name: el.dataset.heroName, tag: null });
                });
            }

            const currentIndex = contextHeroes.findIndex(h => h.name === clickedHeroName);
            UI.openHeroModal(heroData, contextHeroes, currentIndex);
        }
        
        if (App.dom.bannersContainer) {
            App.dom.bannersContainer.addEventListener('click', handleHeroClick);
        }
        
        function handleDetailsPanelClick(e) {
            if (e.target.closest('.close-details-btn')) {
                UI.closeEventDetailsPanel();
                UI.closeWeeklyDetailsPanel();
            }
            handleHeroClick(e);
        }
        
        if (App.dom.eventDetailsPanel) {
            App.dom.eventDetailsPanel.addEventListener('click', handleDetailsPanelClick);
        }
        if (App.dom.weeklyDetailsPanel) {
            App.dom.weeklyDetailsPanel.addEventListener('click', handleDetailsPanelClick);
        }
        
        // Listener para el panel de detalles de evento (semanal y normal)
        function handleDetailsPanelClick(e) {
            // Clic en el botón de cerrar
            if (e.target.closest('.close-details-btn')) {
                UI.closeEventDetailsPanel();
                UI.closeWeeklyDetailsPanel();
            }
            // Clic en un héroe
            handleHeroClick(e);
        }
        
        if (App.dom.eventDetailsPanel) {
            App.dom.eventDetailsPanel.addEventListener('click', handleDetailsPanelClick);
        }
        if (App.dom.weeklyDetailsPanel) {
            App.dom.weeklyDetailsPanel.addEventListener('click', handleDetailsPanelClick);
        }
        // --- FIN: LÓGICA DE CLIC EN HÉROES ---
        
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
        
        // El overlay del modal de héroe ya no cierra el modal.
        App.dom.heroModalOverlay.addEventListener('click', (e) => {
            // Prevenimos que el clic en el overlay se propague al contenido
            if (e.target === App.dom.heroModalOverlay) {
                // No hacemos nada, el modal permanece abierto
            }
        });
        // Evitamos que el clic en el contenido del modal lo cierre (ya que antes el overlay lo hacía)
        document.getElementById('hero-modal-content').addEventListener('click', (e) => {
            e.stopPropagation();
        });

        // --- AÑADIMOS NUEVOS LISTENERS PARA EL MODAL DE HÉROE ---
        App.dom.heroModalCloseBtn.addEventListener('click', () => UI.closeHeroModal());
        
        // Usamos strings para eliminar la ambigüedad
        App.dom.heroModalPrevBtn.addEventListener('click', () => UI.navigateHeroModal('prev'));
        App.dom.heroModalNextBtn.addEventListener('click', () => UI.navigateHeroModal('next'));

        // Listener para clics en los iconos de preview
        App.dom.heroModalPreviews.addEventListener('click', (e) => {
            const previewItem = e.target.closest('.hero-preview-item');
            if (previewItem && previewItem.dataset.heroName) {
                const heroName = previewItem.dataset.heroName;
                const newIndex = App.state.heroModalContext.heroes.findIndex(h => h.name === heroName);
                if (newIndex !== -1) {
                    UI.navigateHeroModal(newIndex); // Pasamos el índice numérico
                }
            }
        });

        // Listener para teclas
        window.addEventListener('keydown', (e) => {
            if (!App.dom.heroModalOverlay.classList.contains('visible')) return;
            
            if (e.key === 'Escape') {
                UI.closeHeroModal();
            } else if (e.key === 'ArrowRight') {
                // Usamos strings para eliminar la ambigüedad
                UI.navigateHeroModal('next');
            } else if (e.key === 'ArrowLeft') {
                UI.navigateHeroModal('prev');
            }
        });

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
            fetch('json_data/events_full.json').then(res => res.json()),
            fetch('json_data/weekly_resets.json').then(res => res.json())
        ])
        .then(([heroesData, eventsData, weeklyData]) => {
            // Una vez cargados los datos, los guardamos en el estado.
            App.state.allHeroesData = heroesData;
            App.state.allEventsData = eventsData.gameData;
            App.state.weeklyResetsData = weeklyData.gameData;
            
            // Ahora que los datos están listos, podemos inicializar la aplicación.
            initialize();
        })
        .catch(error => {
            console.error("Error cargando los datos iniciales (heroes_data.json, events_full.json o weekly_resets.json):", error);
            document.body.innerHTML = `<div style="text-align: center; color: white; padding: 40px;"><p>Error al cargar datos. Asegúrate de que los archivos JSON requeridos existen y son accesibles.</p><p>Revisa la consola (F12) para más detalles.</p></div>`;
        });
    });

})();