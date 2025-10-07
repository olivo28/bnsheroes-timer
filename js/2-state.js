'use strict';

/**
 * Contiene el estado dinámico, las referencias a elementos del DOM y otros recursos de la aplicación.
 */
const App = {
    // Estado que cambia durante la ejecución
    state: {
        config: {}, // Se llenará con la configuración cargada al iniciar
        isMobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
        alertsShownToday: {},
        lastResetCycleDay: null,
        allHeroesData: [],
        allEventsData: {},
        weeklyResetsData: null,
        currentOpenEventId: null,
        currentOpenWeeklyId: null, // <-- AÑADE ESTA LÍNEA
        swiper: null
    },
    
    // Referencias a elementos del DOM. Se inicializan como null y se pueblan después.
    dom: {
        mainWrapper: null,
        primaryPanel: null,
        secondaryPanel: null,
        primaryTimersContainer: null,
        timersContainer: null,
        eventsContainer: null,
        weeklyContainer: null, // <-- AÑADE ESTA LÍNEA
        bannersContainer: null,
        statusBar: null,
        modalOverlay: null,
        settingsButton: null,
        saveSettingsBtn: null,
        closeSettingsBtn: null,
        bossTimersToggle: null,
        eventsToggle: null,
        preAlertInput: null,
        soundToggle: null,
        desktopToggle: null,
        timezoneSelect: null,
        languageSelect: null,
        timeFormatSwitch: null,
        testNotificationBtn: null,
        infoModalOverlay: null,
        infoModalTitle: null,
        infoModalBody1: null,
        infoModalBody2: null,
        closeInfoBtn: null,
        syncModalOverlay: null,
        syncHours: null,
        syncMinutes: null,
        syncSeconds: null,
        saveSyncBtn: null,
        currentTime: null,
        aboutButton: null,
        aboutModalOverlay: null,
        closeAboutBtn: null,
        heroModalOverlay: null,
        heroModalImage: null,
        heroModalName: null,
        heroModalRarity: null,
        heroModalRole: null,
        heroModalElementIcon: null,
        heroModalRoleIcon: null,
        eventDetailsPanel: null,
        weeklyDetailsPanel: null, // <-- AÑADE ESTA LÍNEA
        twitchFab: null,
        streamsModalOverlay: null,
        streamsModalContent: null,
        closeStreamsModal: null,
        preStreamAlertToggle: null,
        postStreamAlertToggle: null,
        // --- NUEVAS REFERENCIAS AÑADIDAS ---
        heroModalContent: null,
        heroModalInfo: null,
    },
    
    // Otros recursos globales
    alertSound: new Audio('https://actions.google.com/sounds/v1/alarms/alarm_clock.ogg'),

    /**
     * Puebla el objeto App.dom con referencias a los elementos del DOM.
     * Es crucial llamar a esta función DESPUÉS de que el DOM se haya cargado completamente.
     */
    initializeDOM: function() {
        this.dom.mainWrapper = document.querySelector('.main-wrapper');
        this.dom.primaryPanel = document.querySelector('.primary-panel');
        this.dom.secondaryPanel = document.querySelector('.secondary-panel');
        this.dom.primaryTimersContainer = document.getElementById('primary-timers-container');
        this.dom.timersContainer = document.getElementById('timers-container');
        this.dom.eventsContainer = document.getElementById('events-container');
        this.dom.weeklyContainer = document.getElementById('weekly-container');
        this.dom.bannersContainer = document.getElementById('banners-container');
        this.dom.statusBar = document.getElementById('status-bar');
        this.dom.modalOverlay = document.getElementById('modal-overlay');
        this.dom.settingsButton = document.getElementById('settings-button');
        this.dom.saveSettingsBtn = document.getElementById('save-settings-btn');
        this.dom.closeSettingsBtn = document.getElementById('close-settings-btn');
        this.dom.bossTimersToggle = document.getElementById('boss-timers-toggle');
        this.dom.eventsToggle = document.getElementById('events-toggle');
        this.dom.preAlertInput = document.getElementById('pre-alert-input');
        this.dom.soundToggle = document.getElementById('sound-toggle');
        this.dom.desktopToggle = document.getElementById('desktop-toggle');
        this.dom.timezoneSelect = document.getElementById('timezone-select');
        this.dom.languageSelect = document.getElementById('language-select');
        this.dom.timeFormatSwitch = document.getElementById('time-format-switch');
        this.dom.testNotificationBtn = document.getElementById('test-notification-btn');
        this.dom.infoModalOverlay = document.getElementById('info-modal-overlay');
        this.dom.infoModalTitle = document.getElementById('info-modal-title');
        this.dom.infoModalBody1 = document.getElementById('info-modal-body1');
        this.dom.infoModalBody2 = document.getElementById('info-modal-body2');
        this.dom.closeInfoBtn = document.getElementById('close-info-btn');
        this.dom.syncModalOverlay = document.getElementById('sync-modal-overlay');
        this.dom.syncHours = document.getElementById('sync-hours');
        this.dom.syncMinutes = document.getElementById('sync-minutes');
        this.dom.syncSeconds = document.getElementById('sync-seconds');
        this.dom.saveSyncBtn = document.getElementById('save-sync-btn');
        this.dom.currentTime = document.getElementById('current-time');
        this.dom.aboutButton = document.getElementById('about-button');
        this.dom.aboutModalOverlay = document.getElementById('about-modal-overlay');
        this.dom.closeAboutBtn = document.getElementById('close-about-btn');
        this.dom.heroModalOverlay = document.getElementById('hero-modal-overlay');
        this.dom.heroModalImage = document.getElementById('hero-modal-image');
        this.dom.heroModalName = document.getElementById('hero-modal-name');
        this.dom.heroModalRarity = document.getElementById('hero-modal-rarity');
        this.dom.heroModalRole = document.getElementById('hero-modal-role');
        this.dom.heroModalElementIcon = document.getElementById('hero-modal-element-icon');
        this.dom.heroModalRoleIcon = document.getElementById('hero-modal-role-icon');
        this.dom.eventDetailsPanel = document.getElementById('event-details-panel');
        this.dom.weeklyDetailsPanel = document.getElementById('weekly-details-panel');
        
        // AÑADE LAS NUEVAS REFERENCIAS de STREAMS
        this.dom.twitchFab = document.getElementById('twitch-fab');
        this.dom.streamsModalOverlay = document.getElementById('streams-modal-overlay');
        this.dom.streamsModalContent = document.getElementById('streams-modal-content');
        this.dom.closeStreamsModal = document.getElementById('close-streams-modal');
        this.dom.preStreamAlertToggle = document.getElementById('pre-stream-alert-toggle');
        this.dom.postStreamAlertToggle = document.getElementById('post-stream-alert-toggle');
        
        // --- NUEVAS REFERENCIAS AÑADIDAS ---
        this.dom.heroModalContent = document.getElementById('hero-modal-content');
        this.dom.heroModalInfo = document.getElementById('hero-modal-info');
    }
};