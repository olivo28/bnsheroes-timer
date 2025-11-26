'use strict';

/**
 * Contiene el estado dinámico de la aplicación, las referencias al DOM y otros recursos.
 * Ahora es un módulo ES6.
 */
const App = {
    // Estado que cambia durante la ejecución
    state: {
        isLoggedIn: false,      // Nuevo: Para saber si el usuario ha iniciado sesión.
        userInfo: null,         // Nuevo: Para guardar info del usuario (ej. nombre, avatar).
        i18n: {},               // Nuevo: Aquí se cargarán las traducciones.

        config: {},             // Se llenará con la configuración fusionada (backend + usuario).
        isMobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
        timeOffset: 0,

        // Datos del juego que se cargarán desde el backend
        allHeroesData: [],
        allEventsData: {},
        weeklyResetsData: null,
        allBossesData: [],
        allStreamsData: [],
        allBannersData: {},
        allHeroWeekData: null, // <-- Asegúrate de que esta línea esté
        allItemsData: null, // <-- AÑADE ESTA LÍNEA

        // Estado de la UI
        alertsShownToday: {},
        lastResetCycleDay: null,
        currentOpenEventId: null,
        currentOpenWeeklyId: null,
        currentOpenBossId: null,
        swiper: null,
        heroModalContext: {
            heroes: [],
            currentIndex: -1
        },

        lastRenderedBossIds: '',
        lastRenderedBannerIds: '',
        lastRenderedEventIds: '',
        lastRenderedWeeklyIds: '',
        lastShowSecondaryPanel: null,
        lastRenderedPrimaryTimers: '', 
    },

    // Referencias a elementos del DOM
    dom: {
        // Estructura principal
        mainWrapper: null,
        primaryPanel: null,
        secondaryPanel: null,
        contentWrapper: null,
        appContainer: null,

        // Contenedores de Timers y Eventos
        primaryTimersContainer: null,
        timersContainer: null,
        stickyTicketContainer: null,
        eventsContainer: null,
        weeklyContainer: null,
        bannersContainer: null,
        bossDetailsPanel: null,

        // Barra superior y de estado
        topBar: null,
        currentTime: null,
        statusBar: null,
        userStatus: null, // Nuevo

        // Botones principales
        settingsButton: null,
        aboutButton: null,

        // Modal de Configuración
        modalOverlay: null,
        settingsModal: null,
        saveSettingsBtn: null,
        closeSettingsBtn: null,
        testNotificationBtn: null,
        
        // Controles de Configuración
        bossTimersToggle: null,
        eventsToggle: null,
        weeklyToggle: null,
        preAlertInput: null,
        soundToggle: null,
        desktopToggle: null,
        timezoneSelect: null,
        languageSelect: null,
        timeFormatSwitch: null,

        // Otros Modales
        infoModalOverlay: null,
        syncModalOverlay: null,
        aboutModalOverlay: null,
        heroModalOverlay: null,
        streamsModalOverlay: null,
        languageModalOverlay: null, // Nuevo
        accountModalOverlay: null,
        logoutBtnModal: null,

        // ... más referencias específicas si son necesarias
    },

    // Otros recursos globales
    alertSound: new Audio('https://actions.google.com/sounds/v1/alarms/alarm_clock.ogg'),

    /**
     * Puebla el objeto App.dom con referencias a los elementos del DOM.
     * Esta función debe ser llamada después de que el DOM esté completamente cargado.
     */
        initializeDOM: function() {
        // Estructura principal
        this.dom.appContainer = document.querySelector('.app-container');
        this.dom.contentWrapper = document.querySelector('.content-wrapper');
        this.dom.mainWrapper = document.querySelector('.main-wrapper');
        this.dom.primaryPanel = document.querySelector('.primary-panel');
        this.dom.secondaryPanel = document.querySelector('.secondary-panel');

        // Contenedores
        this.dom.primaryTimersContainer = document.getElementById('primary-timers-container');
        this.dom.timersContainer = document.getElementById('timers-container');
        this.dom.stickyTicketContainer = document.getElementById('sticky-ticket-container');
        this.dom.eventsContainer = document.getElementById('events-container');
        this.dom.weeklyContainer = document.getElementById('weekly-container');
        this.dom.bossDetailsPanel = document.getElementById('boss-details-panel');
        this.dom.bannersContainer = document.getElementById('banners-container');

        // Barras y estado
        this.dom.currentTime = document.getElementById('current-time');
        this.dom.statusBar = document.getElementById('status-bar');
        this.dom.userStatus = document.getElementById('user-status');

        // Botones principales
        this.dom.settingsButton = document.getElementById('settings-button');
        this.dom.aboutButton = document.getElementById('about-button');

        // Paneles de detalles
        this.dom.eventDetailsPanel = document.getElementById('event-details-panel');
        this.dom.weeklyDetailsPanel = document.getElementById('weekly-details-panel');

        // Modal de Configuración
        this.dom.modalOverlay = document.getElementById('modal-overlay');
        this.dom.settingsModal = document.getElementById('settings-modal');
        this.dom.saveSettingsBtn = document.getElementById('save-settings-btn');
        this.dom.closeSettingsBtn = document.getElementById('close-settings-btn');
        this.dom.testNotificationBtn = document.getElementById('test-notification-btn');
        this.dom.accountModalOverlay = document.getElementById('account-modal-overlay');

        // Controles de Configuración
        this.dom.bossTimersToggle = document.getElementById('boss-timers-toggle');
        this.dom.eventsToggle = document.getElementById('events-toggle');
        this.dom.weeklyToggle = document.getElementById('weekly-toggle');
        this.dom.preAlertInput = document.getElementById('pre-alert-input');
        this.dom.soundToggle = document.getElementById('sound-toggle');
        this.dom.desktopToggle = document.getElementById('desktop-toggle');
        this.dom.timezoneSelect = document.getElementById('timezone-select');
        this.dom.languageSelect = document.getElementById('language-select');
        this.dom.timeFormatSwitch = document.getElementById('time-format-switch');

        // Overlays de otros modales
        this.dom.infoModalOverlay = document.getElementById('info-modal-overlay');
        this.dom.syncModalOverlay = document.getElementById('sync-modal-overlay');
        this.dom.aboutModalOverlay = document.getElementById('about-modal-overlay');
        this.dom.heroModalOverlay = document.getElementById('hero-modal-overlay');
        this.dom.streamsModalOverlay = document.getElementById('streams-modal-overlay');
        this.dom.languageModalOverlay = document.getElementById('language-modal-overlay');
        this.dom.logoutBtnModal = document.getElementById('logout-btn-modal');
        
        // Botón flotante de Twitch
        this.dom.twitchFab = document.getElementById('twitch-fab');
    },
};

// Exportamos el objeto App para que otros módulos puedan importarlo.
export default App;