// js/3-ui.js

'use strict';

import App from './2-state.js';
import Utils from './1-utils.js';
import Logic from './4-logic.js';

const UI = {

    /**
     * Función principal que orquesta todas las actualizaciones de la UI en cada ciclo.
     */
    updateAll: function () {
    if (!App.state.config || Object.keys(App.state.config).length === 0) {
        return;
    }

    const now = Logic.getCorrectedNow();
    const config = App.state.config;

    // --- 1. ACTUALIZACIONES QUE OCURREN SIEMPRE (CADA CICLO) ---
    App.dom.timeFormatSwitch.checked = config.use24HourFormat;
    const langCode = config.language === 'es-419' ? 'es' : config.language;
    const currentDateString = Utils.formatDateToLocaleDateString(now, config.displayTimezone, langCode);
    const currentTimeString = Utils.formatDateToTimezoneString(now, config.displayTimezone, config.use24HourFormat, true);
    const tzString = `UTC${config.displayTimezone.replace(':00', '')}`;
    App.dom.currentTime.innerHTML = `<div class="datetime-stack"><span>${currentDateString}</span><span>${currentTimeString}</span></div><span class="timezone-abbr">${tzString}</span>`;

    Logic.checkAndPerformDailyReset(now);
    const dailyResetTimer = Logic.getDailyResetTimer(now);
    const lastReset = new Date(dailyResetTimer.targetDate.getTime() - (24 * 60 * 60 * 1000));
    const showdownTicketTimer = Logic.getShowdownTicketTimer(now, lastReset);
    const bossTimers = config.showBossTimers ? Logic.getBossTimers(now) : [];

    // --- 2. RENDERIZADO CONDICIONAL DE PANELES ---

    // a) Panel de Banners
    const currentBannerIds = `${config.banners.activeBanner},${config.banners.nextBanner}`;
    if (App.state.lastRenderedBannerIds !== currentBannerIds) {
        console.log("UI: Re-renderizando panel de Banners.");
        this.renderBannersPanel();
        App.state.lastRenderedBannerIds = currentBannerIds;
    }

    // b) Panel de Eventos
    const currentEventIds = config.showEvents ? config.events.map(e => e.id).join(',') : '';
    if (App.state.lastRenderedEventIds !== currentEventIds) {
        console.log("UI: Re-renderizando panel de Eventos.");
        if (config.showEvents) {
            App.dom.eventsContainer.innerHTML = this.renderEventsPanel();
            App.dom.eventsContainer.style.display = 'block';
        } else {
            App.dom.eventsContainer.innerHTML = '';
            App.dom.eventsContainer.style.display = 'none';
            this.closeEventDetailsPanel();
        }
        App.state.lastRenderedEventIds = currentEventIds;
    }

    // c) Panel Semanal (incluye Héroe de la Semana)
    const weeklyTimers = Logic.getWeeklyResetTimers(now);
    const heroOfTheWeekTimer = Logic.getHeroOfTheWeekTimer(now);
    if (heroOfTheWeekTimer) weeklyTimers.push(heroOfTheWeekTimer);
    const currentWeeklyIds = config.showWeekly ? weeklyTimers.map(t => t.id).join(',') : '';
    if (App.state.lastRenderedWeeklyIds !== currentWeeklyIds) {
        console.log("UI: Re-renderizando panel Semanal.");
        if (config.showWeekly && weeklyTimers.length > 0) {
            App.dom.weeklyContainer.innerHTML = this.renderWeeklyPanel();
            App.dom.weeklyContainer.style.display = 'block';
        } else {
            App.dom.weeklyContainer.innerHTML = '';
            App.dom.weeklyContainer.style.display = 'none';
            this.closeWeeklyDetailsPanel();
        }
        App.state.lastRenderedWeeklyIds = currentWeeklyIds;
    }

    // d) Panel de Jefes
    const currentBossIds = bossTimers.map(b => b.id).join(',');
    if (App.state.lastRenderedBossIds !== currentBossIds) {
        console.log("UI: Re-renderizando panel de Jefes.");
        const nextActiveBoss = bossTimers.find(boss => boss.secondsLeft >= 0);
        if (config.showBossTimers) {
            App.dom.timersContainer.innerHTML = this.renderSecondaryTimers(bossTimers);
            App.dom.stickyTicketContainer.innerHTML = nextActiveBoss ? this.renderSecondaryTimers([showdownTicketTimer]) : '';
        } else {
            App.dom.timersContainer.innerHTML = '';
            App.dom.stickyTicketContainer.innerHTML = '';
        }
        App.state.lastRenderedBossIds = currentBossIds;
        App.state.lastRenderedPrimaryTimers = ''; 
    }

    // e) Layout Principal (ancho del contenedor)
    const showSecondaryPanel = config.showBossTimers || config.showEvents || config.showWeekly;
    if (App.state.lastShowSecondaryPanel !== showSecondaryPanel) {
        console.log("UI: Actualizando layout principal.");
        if (!App.state.isMobile) {
            if (showSecondaryPanel) {
                App.dom.mainWrapper.style.width = '860px';
                App.dom.secondaryPanel.style.opacity = '1';
                App.dom.secondaryPanel.style.width = '480px';
                App.dom.secondaryPanel.style.borderLeft = '1px solid var(--border-color)';
                App.dom.bannersContainer.style.width = '860px';
                App.dom.bannersContainer.classList.add('horizontal-layout');
            } else {
                App.dom.mainWrapper.style.width = '380px';
                App.dom.secondaryPanel.style.opacity = '0';
                App.dom.secondaryPanel.style.width = '0px';
                App.dom.secondaryPanel.style.borderLeft = 'none';
                App.dom.bannersContainer.style.width = '380px';
                App.dom.bannersContainer.classList.remove('horizontal-layout');
            }
        } else {
            const secondaryPanelElement = document.querySelector('.secondary-panel');
            if (secondaryPanelElement) {
                const secondarySlide = secondaryPanelElement.closest('.swiper-slide');
                if (secondarySlide) secondarySlide.style.display = showSecondaryPanel ? 'block' : 'none';
            }
            if (App.state.swiper?.update) App.state.swiper.update();
        }
        App.state.lastShowSecondaryPanel = showSecondaryPanel;
    }
    
    // --- 3. ACTUALIZACIÓN DE CONTADORES (CADA CICLO, SIN RECONSTRUIR HTML) ---
    
    // a) Panel Primario (Este sí se reconstruye porque su lógica es más compleja)
    const primaryTimers = [dailyResetTimer];
    const nextActiveBoss = bossTimers.find(boss => boss.secondsLeft >= 0);
    if (config.showBossTimers && nextActiveBoss) {
        primaryTimers.push(nextActiveBoss);
    } else {
        primaryTimers.push(showdownTicketTimer);
    }
    this.renderPrimaryPanel(primaryTimers);

    // b) Contadores de Jefes y Ticket Secundario
    document.querySelectorAll('.countdown-timer').forEach(el => {
        const bossId = el.closest('.spawn-item')?.querySelector('.alert-toggle')?.dataset.bossId;
        if (bossId) {
            const bossData = bossTimers.find(b => b.id === bossId);
            if(bossData) {
                el.textContent = Utils.formatTime(bossData.secondsLeft);
                el.style.color = Utils.getCountdownColor(bossData.secondsLeft, 'boss');
            }
        } else if (el.closest('.ticket-item')) { // Es el ticket de showdown
             el.textContent = Utils.formatTime(showdownTicketTimer.secondsLeft);
             el.style.color = Utils.getCountdownColor(showdownTicketTimer.secondsLeft, 'ticket');
        }
    });

    // c) Contadores de Eventos, Semanales y Banners (estos ya se manejan bien porque sus funciones de renderizado son más simples y no contienen imágenes que parpadeen)
    // No necesitan actualización de contador individual porque el texto completo se regenera si cambian los datos.

    // --- 4. OTRAS FUNCIONES ---
    this.updateLanguage(); // Para estado de notificaciones, etc.
    Logic.checkAndTriggerAlerts(now, bossTimers, dailyResetTimer, showdownTicketTimer, config.events, config.banners);
    this.updateStreamsFeature();
},

    renderPrimaryPanel: function (timers) {
    const config = App.state.config;
    const timerTypes = timers.map(t => t.type).join(',');

    // --- LÓGICA DE OPTIMIZACIÓN ---
    // Si la estructura de los temporizadores no ha cambiado, solo actualizamos el texto.
    if (App.state.lastRenderedPrimaryTimers === timerTypes) {
        timers.forEach((timer, index) => {
            const itemClass = index === 0 ? '.main' : '.secondary';
            const container = App.dom.primaryTimersContainer.querySelector(`.primary-timer-item${itemClass}`);
            if (!container) return; // Si el elemento no existe, salimos

            // Actualizamos el contador
            const countdownEl = container.querySelector('.timer-countdown');
            if (countdownEl) {
                countdownEl.textContent = Utils.formatTime(timer.secondsLeft);
                countdownEl.style.color = Utils.getCountdownColor(timer.secondsLeft, timer.type);
            }
        });
        return; // Detenemos la ejecución para no reconstruir el HTML
    }

    // --- RENDERIZADO COMPLETO (Solo si la estructura cambia) ---
    console.log("UI: Re-renderizando panel primario (estructura cambió).");
    App.state.lastRenderedPrimaryTimers = timerTypes; // Guardamos la nueva estructura

    const infoIconSVG = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" /></svg>`;
    const syncIconSVG = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125" /></svg>`;

    App.dom.primaryTimersContainer.innerHTML = timers.map((timer, index) => {
        if (!timer || !timer.type) return '';

        const itemClass = index === 0 ? 'main' : 'secondary';
        const color = Utils.getCountdownColor(timer.secondsLeft, timer.type);
        const countdown = Utils.formatTime(timer.secondsLeft);
        const description = timer.type === 'boss' ? Utils.getText('timers.bossSpawnIn', { loc: timer.location }) : timer.description;
        const imageDivClass = timer.type === 'ticket' ? 'ticket-image' : 'timer-image';

        let imageContent = timer.type === 'ticket' ? `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-9-1.5h5.25m-5.25 0h5.25m-5.25 0h5.25m-5.25 0h5.25M3 4.5h15a2.25 2.25 0 012.25 2.25v10.5a2.25 2.25 0 01-2.25 2.25H3a2.25 2.25 0 01-2.25-2.25V6.75A2.25 2.25 0 013 4.5z" /></svg>` : (timer.imageUrl ? `<img src="${timer.imageUrl}" alt="${timer.name}">` : '');

        const nameClass = `timer-name ${timer.type === 'boss' ? 'timer-name-boss' : timer.type === 'ticket' ? 'timer-name-ticket' : ''}`;

        const displayTime = Utils.formatDateToTimezoneString(timer.targetDate, config.displayTimezone, config.use24HourFormat);
        const timeSpan = timer.type !== 'ticket' ? `<span class="timer-target-time">(${displayTime})</span>` : '';
        const eventLabel = timer.isEvent ? `<span class="event-tip small-tip">${Utils.getText('common.event')}</span>` : '';
        const nameItself = `<p class="${nameClass}">${timer.name} ${eventLabel} ${timeSpan}</p>`;

        const nameContent = timer.type === 'ticket'
            ? `<div class="timer-name-container"><p class="${nameClass}">${timer.name}</p><div class="info-button">${infoIconSVG}</div></div>`
            : nameItself;

        const countdownContent = timer.type === 'ticket'
            ? `<div class="timer-countdown-container"><p class="timer-countdown" style="color: ${color};">${countdown}</p><div class="sync-button">${syncIconSVG}</div></div>`
            : `<p class="timer-countdown" style="color: ${color};">${countdown}</p>`;

        return `<div class="primary-timer-item ${itemClass}"><div class="${imageDivClass}">${imageContent}</div>${nameContent}<p class="timer-desc">${description}</p>${countdownContent}</div>`;
    }).join('');
},

    renderSecondaryTimers: function (timers) {
        if (!timers || timers.length === 0) return '';
        const config = App.state.config;

        return timers.map(timer => {
            if (!timer || !timer.type) return '';

            const color = Utils.getCountdownColor(timer.secondsLeft, timer.type);
            const time = Utils.formatTime(timer.secondsLeft);
            const displayTime = Utils.formatDateToTimezoneString(timer.targetDate, config.displayTimezone, config.use24HourFormat);

            if (timer.type === 'boss') {
                const tzString = `UTC${config.displayTimezone.replace(':00', '')}`;
                const bellIcon = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" /></svg>`;
                const noBellIcon = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0M3.17 3.17l17.66 17.66" /></svg>`;
                const bossIcon = `<div class="spawn-item-icon"><img src="${timer.imageUrl}" alt="${timer.name}"></div>`;
                const eventLabel = timer.isEvent ? `<span class="event-tip small-tip">${Utils.getText('common.event')}</span>` : '';
                const isAlertEnabled = timer.isNotificationOn;

                 return `<div class="spawn-item ${!isAlertEnabled ? 'disabled' : ''}">${bossIcon}<div class="spawn-item-info"><p class="spawn-item-name spawn-item-name-boss">${timer.name} ${eventLabel}</p><p class="spawn-item-time">${displayTime} (${tzString})</p></div><span class="countdown-timer" style="color: ${color};">${time}</span><div class="alert-toggle ${isAlertEnabled ? 'enabled' : 'disabled'}" data-boss-id="${timer.id}" data-time="${timer.time}">${isAlertEnabled ? bellIcon : noBellIcon}</div></div>`;
            }
            if (timer.type === 'ticket') {
                const icon = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-9-1.5h5.25m-5.25 0h5.25m-5.25 0h5.25m-5.25 0h5.25M3 4.5h15a2.25 2.25 0 012.25 2.25v10.5a2.25 2.25 0 01-2.25 2.25H3a2.25 2.25 0 01-2.25-2.25V6.75A2.25 2.25 0 013 4.5z" /></svg>`;
                const infoIconSVG = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" /></svg>`;
                const syncIconSVG = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125" /></svg>`;
                const nameContent = `<div class="spawn-item-name-container"><p class="spawn-item-name spawn-item-name-ticket">${timer.name}</p><div class="info-button">${infoIconSVG}</div></div>`;
                const countdownContent = `<div class="countdown-container"><span class="countdown-timer" style="color: ${color};">${time}</span><div class="sync-button">${syncIconSVG}</div></div>`;
                return `<div class="spawn-item ticket-item"><div class="item-icon">${icon}</div><div class="spawn-item-info">${nameContent}<p class="spawn-item-time">${timer.description}</p></div>${countdownContent}</div>`;
            }
            return '';
        }).join('');
    },

    renderEventsPanel: function () {
        const config = App.state.config;
        if (!config.events) return '';

        const now = new Date();
        let html = `<h3 class="panel-subtitle">${Utils.getText('events.title')}</h3>`;
        let activeEventCount = 0;

        config.events.forEach(event => {
            if (!event.endDate || !event.startDate) return;
            const endDate = Logic.getAbsoluteDateWithCustomDate(event.endDate, config.dailyResetTime);
            if (now > endDate) return;

            activeEventCount++;
            const secondsLeft = Math.floor((endDate.getTime() - now.getTime()) / 1000);
            const timeString = Utils.formatTimeWithDays(secondsLeft, true);
            const countdownText = secondsLeft > 0 ? Utils.getText('events.endsIn', { d: timeString }) : Utils.getText('events.endsToday');

            html += `<div class="event-item" data-event-id="${event.id}">
                        <span class="event-name">${event.name[config.language] || event.name.en}</span>
                        <span class="event-countdown">${countdownText}</span>
                    </div>`;
        });

        return activeEventCount > 0 ? html : '';
    },

    renderWeeklyPanel: function () {
    if (!App.state.weeklyResetsData) return '';
    
    // Obtenemos los temporizadores semanales normales Y el del Héroe de la Semana
    const weeklyTimers = Logic.getWeeklyResetTimers(Logic.getCorrectedNow());
    const heroOfTheWeekTimer = Logic.getHeroOfTheWeekTimer(Logic.getCorrectedNow());

    // Si hay un Héroe de la Semana activo, lo añadimos a la lista
    if (heroOfTheWeekTimer) {
        weeklyTimers.push(heroOfTheWeekTimer);
    }
    
    // Ordenamos para que el que termina antes aparezca primero
    weeklyTimers.sort((a, b) => a.secondsLeft - b.secondsLeft);

    if (weeklyTimers.length === 0) return '';

    let html = `<h3 class="panel-subtitle">${Utils.getText('weekly.title')}</h3>`;
    weeklyTimers.forEach(timer => {
        const timeString = Utils.formatTimeWithDays(timer.secondsLeft, true);
        const countdownText = Utils.getText('weekly.resetsIn', { d: timeString });
        
        // Usamos un atributo de datos diferente para distinguir los tipos de evento
        const dataAttribute = timer.type === 'heroOfTheWeek' 
            ? `data-hotw-id="${timer.id}"`
            : `data-weekly-id="${timer.id}"`;

        html += `<div class="weekly-item" ${dataAttribute}>
                    <div class="weekly-item-info">
                        <span class="weekly-name">${timer.name}</span>
                        <span class="weekly-category">${timer.category}</span>
                    </div>
                    <span class="weekly-countdown">${countdownText}</span>
                </div>`;
    });
    return html;
},

    renderBannersPanel: function () {
        const config = App.state.config;
        const allBanners = App.state.allBannersData;
        
        // --- INICIO DE LA CORRECCIÓN ---

        // Verificamos que los datos necesarios existan.
        if (!allBanners || !config.banners) {
            App.dom.bannersContainer.innerHTML = '';
            return;
        }

        const bannerConfig = config.banners; // { activeBanner: "ID", nextBanner: "ID" }
        const now = new Date();

        // 1. Obtenemos el objeto del banner activo a partir de su ID.
        //    Añadimos el ID al objeto para consistencia.
        const activeBannerId = bannerConfig.activeBanner;
        const activeBanner = activeBannerId && allBanners[activeBannerId] 
            ? { id: activeBannerId, ...allBanners[activeBannerId] }
            : null;

        // 2. Obtenemos el objeto del siguiente banner a partir de su ID.
        const nextBannerId = bannerConfig.nextBanner;
        const nextBanner = nextBannerId && allBanners[nextBannerId]
            ? { id: nextBannerId, ...allBanners[nextBannerId] }
            : null;

        // --- FIN DE LA CORRECCIÓN ---

        const createBannerHTML = (banner, type) => {
            const title = Utils.getText(type === 'active' ? 'banners.activeTitle' : 'banners.nextTitle');
            let countdownHTML = '';

            // La lógica del countdown sigue funcionando con las fechas de cada objeto de banner.
            if (banner && ((type === 'active' && banner.endDate) || (type === 'next' && banner.startDate))) {
                const targetDate = Logic.getAbsoluteDateWithCustomDate(type === 'active' ? banner.endDate : banner.startDate, config.dailyResetTime);
                const secondsLeft = Math.floor((targetDate - now) / 1000);
                if (secondsLeft > 0) {
                    const timeString = Utils.formatTimeWithDays(secondsLeft, true);
                    const label = Utils.getText(type === 'active' ? 'banners.endsIn' : 'banners.startsIn', { d: timeString });
                    countdownHTML = `<span class="banner-countdown">${label}</span>`;
                }
            }

            let content;
            if (!banner || !banner.heroes) {
                // Si el banner es null o no tiene héroes, muestra "No Anunciado".
                content = `<div class="banner-box"><div class="empty-banner">${Utils.getText('common.notAnnounced')}</div></div>`;
            } else {
                const heroNames = banner.heroes.split(',').map(name => name.trim());
                const heroImagesHtml = heroNames.map(name => {
                    const heroData = Logic.findHeroByName(name);
                    if (heroData) {
                        const roleIcon = heroData.role ? `<div class="hero-role-icon element-${heroData.element || 'default'}"><img class="role-icon" src="assets/roles/${heroData.role}_icon.png" alt="${heroData.role}"></div>` : '';
                        return `<div class="banner-hero-wrapper">
                                    <div class="banner-hero-img-container" data-hero-name="${heroData.game_name}">
                                        <div class="banner-hero-img rarity-${heroData.rarity}"><img src="assets/heroes_icon/${heroData.short_image}" alt="${heroData.game_name}"></div>
                                        ${roleIcon}
                                    </div>
                                    <span class="banner-hero-name">${heroData.game_name}</span>
                                </div>`;
                    }
                    return '';
                }).join('');
                const backgroundClass = banner.element ? `banner-bg-${banner.element}` : '';
                content = `<div class="banner-box ${backgroundClass}"><div class="banner-heroes">${heroImagesHtml}</div></div>`;
            }

            return `<div class="banner-section">
                        <div class="banner-header">
                            <h4 class="panel-subtitle-small">${title}</h4>
                            ${countdownHTML}
                        </div>
                        ${content}
                    </div>`;
        };

        App.dom.bannersContainer.innerHTML = createBannerHTML(activeBanner, 'active') + createBannerHTML(nextBanner, 'next');
    },

    /**
     * Renderiza el widget flotante del próximo stream.
     */
    updateStreamsFeature: function () {
        // --- INICIO DE LA CORRECCIÓN ---
        // Cambiamos la fuente de los datos
         const streams = App.state.allStreamsData;
    if (!streams || streams.length === 0) {
    // --- FIN DE LA CORRECCIÓN ---
        App.dom.twitchFab.classList.remove('visible', 'alert-active', 'live-active');
        return;
    }

        const now = Logic.getCorrectedNow();

        // --- INICIO DE LA CORRECCIÓN ---
        // Usamos la nueva variable 'streams'
        const upcomingStreams = streams
        .map(stream => ({ ...stream, date: new Date(stream.streamTimeUTC) }))
        .filter(stream => {
            const durationMs = (stream.durationHours || 2) * 3600 * 1000;
            const endTime = stream.date.getTime() + durationMs;
            return endTime > now.getTime() - (2 * 3600 * 1000);
        })
        .sort((a, b) => a.date - b.date);

        App.dom.twitchFab.classList.remove('alert-active', 'live-active');

        if (upcomingStreams.length > 0) {
            App.dom.twitchFab.classList.add('visible');
            this.renderStreamsModal(upcomingStreams, now);

            const liveStream = upcomingStreams.find(stream => {
                const startTime = stream.date.getTime();
                const durationMs = (stream.durationHours || 2) * 3600 * 1000;
                const endTime = startTime + durationMs;
                return now.getTime() >= startTime && now.getTime() < endTime;
            });

            if (liveStream) {
                App.dom.twitchFab.classList.add('live-active');
            } else {
                const nextStream = upcomingStreams.find(s => s.date > now);
                if (nextStream) {
                    const secondsLeft = Math.floor((nextStream.date.getTime() - now.getTime()) / 1000);
                    if (secondsLeft <= 3600 && secondsLeft > 0) {
                        App.dom.twitchFab.classList.add('alert-active');
                    }
                }
            }

        } else {
            App.dom.twitchFab.classList.remove('visible', 'alert-active', 'live-active');
            this.renderStreamsModal([], now);
        }
    },

renderStreamsModal: function (streams, now) {
    const modalContent = document.getElementById('streams-modal-content');
    if (!modalContent) return;

    if (streams.length === 0) {
        modalContent.innerHTML = `<p class="no-streams-message">${Utils.getText('modals.streams.noStreams')}</p>`;
        return;
    }

    const lang = App.state.config.language;

    const contentHTML = streams.map(stream => {
        const secondsLeft = Math.floor((stream.date.getTime() - now.getTime()) / 1000);
        let countdownHTML;

        if (secondsLeft <= 0) {
            countdownHTML = `<p class="stream-is-live">${Utils.getText('streams.isLive')}</p>`;
        } else {
            // --- INICIO DE LA CORRECCIÓN ---
            // Usamos formatTime para obtener HH:MM:SS
            const timeString = Utils.formatTime(secondsLeft); 
            // Mostramos el contador directamente. El texto "Starts in" no es necesario
            // si ya tenemos un contador de tiempo claro.
            countdownHTML = `<p class="stream-countdown">${timeString}</p>`;
            // --- FIN DE LA CORRECCIÓN ---
        }
        
        const streamTitle = (stream.title && stream.title[lang]) ? stream.title[lang] : (stream.title?.en || stream.name);
        
        const imageUrl = stream.imageUrl.includes('/') 
            ? stream.imageUrl 
            : `style/${stream.imageUrl}`;

        return `
            <div class="modal-stream-item">
                <a href="https://twitch.tv/${stream.twitchChannel}" 
                   target="_blank" rel="noopener noreferrer" 
                   class="stream-image-link">
                   <img src="${imageUrl}" alt="${streamTitle}" class="stream-thumbnail">
                </a>
                <div class="stream-info">
                    <p class="stream-title">${streamTitle}</p>
                    <p class="streamer-name">by ${stream.name}</p>
                </div>
                ${countdownHTML}
            </div>
        `;
    }).join('');

    modalContent.innerHTML = contentHTML;

    const streamPrefs = App.state.config.notificationPrefs?.streams || { pre: false, post: false };
    const preStreamToggle = document.getElementById('pre-stream-alert-toggle');
    const postStreamToggle = document.getElementById('post-stream-alert-toggle');

    if (preStreamToggle) preStreamToggle.checked = streamPrefs.pre;
    if (postStreamToggle) postStreamToggle.checked = streamPrefs.post;
},

/* heroe de la semana */
    openHeroOfTheWeekDetailsPanel: function (hotwId) {
    this.closeAllDetailsPanels();
    const lang = App.state.config.language;
    const eventData = App.state.allHeroWeekData.find(e => e.id === hotwId);
    if (!eventData) {
        console.error(`Hero of the Week data not found for ID: ${hotwId}`);
        return;
    }

    const heroData = Logic.findHeroByName(eventData.heroName);
    const heroImage = heroData ? `assets/heroes_icon/${heroData.short_image}` : 'assets/wimp_default.jpg';

    // --- INICIO DE LA MEJORA ---
    // Obtenemos el color del elemento del héroe. Si no tiene, usamos un color por defecto.
    const heroColor = heroData && heroData.element 
        ? `var(--color-${heroData.element}-role)` 
        : 'var(--text-color)';
    // --- FIN DE LA MEJORA ---

    const getItemGridDisplay = (itemId, quantity, rank = 'Common') => {
        const itemDef = App.state.allItemsData[itemId];
        if (!itemDef || !itemDef.icon) return `<div class="reward-grid-item rank-common" title="${itemId} x${quantity}"><span class="reward-quantity">${quantity}</span></div>`;
        const name = itemDef.name[lang] || itemDef.name.en || itemId;
        const rankClass = `rank-${rank.toLowerCase()}`;
        const sizeClass = (itemDef.size && itemDef.size.trim().toLowerCase() === 'double') ? 'double-width' : '';
        return `<div class="reward-grid-item ${sizeClass} ${rankClass}" title="${name} x${quantity}">
                    <img src="assets/items/${itemDef.icon}.png" class="reward-icon" alt="${name}">
                    <span class="reward-quantity">${quantity}</span>
                </div>`;
    };

    let contentHTML = `
        <div class="details-header">
            <div class="close-details-btn"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" width="24" height="24"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg></div>
            <h2>${eventData.title[lang]}</h2>
            <p>${eventData.durationText[lang]}</p>
        </div>
        <div class="details-content">
            <div class="hotw-profile">
                <div class="hotw-hero-image-container"><img src="${heroImage}" alt="${eventData.heroName}"></div>
                <div class="hotw-hero-info">
                    <h4 style="color: ${heroColor};">${eventData.heroName}</h4>
                    <p>${Utils.getText('weekly.heroOfTheWeek')}</p>
                </div>
            </div>

            <div class="details-section">
                <h3>${Utils.getText('weekly.howToParticipate')}</h3>
                <div class="weekly-recommendation-box"><p>${eventData.howToParticipate[lang]}</p></div>
            </div>

            <div class="details-section">
                <h3>${Utils.getText('weekly.missions')}</h3>
                <div class="hotw-mission-list">
                    ${eventData.missions.map(mission => `
                        <div class="hotw-mission-item">
                            <strong>${mission.title[lang]}</strong>
                            <p>${mission.description[lang]}</p>
                        </div>
                    `).join('')}
                </div>
            </div>

            <div class="details-section">
                <h3>${Utils.getText('weekly.rewards')}</h3>
                <p class="details-summary">${eventData.rewardDistribution[lang]} (${eventData.limits[lang]})</p>
                <div class="details-reward-grid-container">
                    ${eventData.rewards.map(r => getItemGridDisplay(r.itemId, r.quantity, r.rank)).join('')}
                </div>
            </div>
        </div>
    `;

    App.dom.weeklyDetailsPanel.innerHTML = contentHTML;
    App.dom.weeklyDetailsPanel.classList.add('visible');
    if (App.state.isMobile) document.body.classList.add('no-scroll');
    App.state.currentOpenWeeklyId = hotwId;
},

    // REEMPLAZA tu función openEventDetailsPanel completa con esta versión
    // EN: js/3-ui.js

    // REEMPLAZA esta función completa en js/3-ui.js
    // REEMPLAZA esta función completa en js/3-ui.js
// REEMPLAZA esta función completa en js/3-ui.js
openEventDetailsPanel: function (eventId) {
    this.closeAllDetailsPanels();
    const lang = App.state.config.language;

    // --- 1. OBTENCIÓN DE DATOS DEL EVENTO ---
    // Busca la configuración del evento en la lista principal para obtener la ID correcta (que es la clave del objeto).
    const eventConfig = App.state.config.events.find(e => e.id === eventId);
    // Usa esa ID para obtener los datos detallados del evento del objeto principal.
    const eventData = eventConfig ? App.state.allEventsData.events[eventConfig.id] : null;

    if (!eventData) {
        console.error(`Event data not found for ID: ${eventId}`);
        return;
    }

    // --- 2. CÁLCULO DE FECHA Y HORA PARA EL ENCABEZADO ---
    let periodString = '';
    if (eventConfig) {
        const { DateTime } = luxon;
        const { startDate, endDate } = eventConfig;
        const resetTime = App.state.config.dailyResetTime;
        const displayTz = App.state.config.displayTimezone;
        const use24h = App.state.config.use24HourFormat;
        const startDt = DateTime.fromISO(startDate).setLocale(lang);
        const endDt = DateTime.fromISO(endDate).setLocale(lang);
        const datePart = `${startDt.toFormat('d MMMM')} - ${endDt.toFormat('d MMMM')}`;
        const resetTimeInRefTz = DateTime.fromISO(`2000-01-01T${resetTime}`, { zone: App.state.config.referenceTimezone });
        const sign = displayTz.startsWith('-') ? '+' : '-';
        const hours = parseInt(displayTz.substring(1, 3));
        const userLuxonTz = `Etc/GMT${sign}${hours}`;
        const resetTimeInUserTz = resetTimeInRefTz.setZone(userLuxonTz);
        const timeFormat = use24h ? 'HH:mm' : 'h:mm a';
        const formattedTime = resetTimeInUserTz.toFormat(timeFormat);
        const userTzAbbr = `(UTC${displayTz.replace(':00', '')})`;
        periodString = `${datePart}, ${formattedTime} ${userTzAbbr}`;
    }

    // --- 3. FUNCIONES AUXILIARES DE RENDERIZADO ---
    const getRarityClass = (rank) => rank ? `rarity-text-${rank.toLowerCase()}` : 'rarity-text-common';
    const getItemGridDisplay = (itemId, quantity, rank = '', probability = null) => {
        const itemDef = App.state.allItemsData[itemId];
        if (!itemDef || !itemDef.icon) return '';
        const name = itemDef.name[lang] || itemDef.name.en || itemId;
        const sizeClass = (itemDef.size && itemDef.size.trim().toLowerCase() === 'double') ? 'double-width' : '';
        const rankClass = rank ? ` rank-${rank.toLowerCase()}` : ' rank-common';
        let probabilityHTML = '';
        if (typeof probability === 'number' && !isNaN(probability)) {
            probabilityHTML = `<span class="reward-probability">${probability.toFixed(1)}%</span>`;
        }
        return `<div class="reward-item-wrapper" title="${name} x${quantity}">
                ${probabilityHTML}
                <div class="reward-grid-item ${sizeClass}${rankClass}">
                    <img src="assets/items/${itemDef.icon}.png" class="reward-icon" alt="${name}">
                    <span class="reward-quantity">${quantity}</span>
                </div>
            </div>`;
    };
    const generateRewardTextList = (rewards) => {
        if (!rewards || rewards.length === 0) return '';
        let listHTML = '<ul class="details-reward-list">';
        rewards.forEach(r => {
            const itemDef = App.state.allItemsData[r.itemId]; if (!itemDef) return;
            const name = itemDef.name[lang] || itemDef.name.en || r.itemId;
            const rarityClass = getRarityClass(r.rank);
            let probClass = 'prob-common', probText = '';
            if (typeof r.probability === 'number' && !isNaN(r.probability)) {
                if (r.probability <= 1) probClass = 'prob-legendary';
                else if (r.probability <= 5) probClass = 'prob-epic';
                else if (r.probability <= 20) probClass = 'prob-rare';
                else if (r.probability <= 50) probClass = 'prob-uncommon';
                probText = `${r.probability.toFixed(1)}%`;
            }
            listHTML += `<li class="details-reward-list-item"><span class="reward-name-part ${rarityClass}">${name}</span><span class="reward-quantity-part">x${r.quantity}</span><span class="reward-prob-part ${probClass}">${probText}</span></li>`;
        });
        return listHTML + '</ul>';
    };

    // --- 4. CONSTRUCCIÓN DEL HTML BASE ---
    let contentHTML = `
    <div class="details-header">
        <div class="close-details-btn"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" width="24" height="24"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg></div>
        <h2>${eventData.name[lang]}</h2>
        <p>${periodString}</p>
    </div>
    <div class="details-content">
        <p class="details-summary">${eventData.summary[lang]}</p>`;

    if (eventData.details) { contentHTML += `<p class="details-extra">${eventData.details[lang]}</p>`; }
    if (eventData.daily_claim_limit) { contentHTML += `<div class="weekly-recommendation-box"><p>${Utils.getText('events.dailyClaimLimit', { limit: eventData.daily_claim_limit })}</p></div>`; }

    // --- 5. RENDERIZADO DE SECCIONES ESPECÍFICAS DEL EVENTO ---

    /**
     * Renders: Eventos con misiones diarias organizadas por pestañas.
     * Soporta pestañas por número de día (`day: 1`) o por fecha (`date: "2025-10-31"`).
     * Structure: "daily_missions": [ { "day": 1, "missions": [...] }, { "date": "...", "missions": [...] } ]
     * Examples: Halloween Countdown Mission, Flash Halloween Weekend Event
     */
    if (eventData.daily_missions) {
        contentHTML += `<div class="details-section"><h3>${Utils.getText('events.rewards.dailyMissionsTitle')}</h3><div class="tabs-nav">`;
        eventData.daily_missions.forEach((data, index) => {
            const tabId = `tab-${index}`, activeClass = index === 0 ? 'active' : '';
            let tabLabel = data.day ? `${Utils.getText('events.day')} ${data.day}` : luxon.DateTime.fromISO(data.date).setLocale(lang).toFormat('d MMMM');
            contentHTML += `<button class="tab-link ${activeClass}" data-tab="${tabId}">${tabLabel}</button>`;
        });
        contentHTML += `</div><div class="tabs-content">`;
        eventData.daily_missions.forEach((data, index) => {
            const tabId = `tab-${index}`, activeClass = index === 0 ? 'active' : '';
            contentHTML += `<div id="${tabId}" class="tab-content ${activeClass}"><table class="details-table daily-missions-table"><thead><tr><th>${Utils.getText('events.table.mission')}</th><th class="count-col">${Utils.getText('events.table.count')}</th><th>${Utils.getText('events.table.reward')}</th></tr></thead><tbody>`;
            data.missions.forEach(mission => {
                const reward = mission.rewards[0];
                contentHTML += `<tr><td>${mission.description[lang]}</td><td class="count-col">${mission.count}</td><td class="mission-reward-cell">${getItemGridDisplay(reward.itemId, reward.quantity, reward.rank || '')}</td></tr>`;
            });
            contentHTML += `</tbody></table></div>`;
        });
        contentHTML += `</div></div>`;
    }
    
    /**
     * Renders: Eventos con misiones agrupadas por categorías en pestañas.
     * Structure: "mission_categories": [ { "category_name": {...}, "missions": [...] } ]
     * Example: The Journey Begins: Follow the Stars
     */
    if (eventData.mission_categories) {
        contentHTML += `<div class="details-section"><h3>${Utils.getText('events.rewards.missionCategoriesTitle')}</h3><div class="tabs-nav">`;
        eventData.mission_categories.forEach((category, index) => {
            contentHTML += `<button class="tab-link ${index === 0 ? 'active' : ''}" data-tab="category-${index}">${category.category_name[lang]}</button>`;
        });
        contentHTML += `</div><div class="tabs-content">`;
        eventData.mission_categories.forEach((category, index) => {
            contentHTML += `<div id="category-${index}" class="tab-content ${index === 0 ? 'active' : ''}"><table class="details-table daily-missions-table"><thead><tr><th>${Utils.getText('events.table.mission')}</th><th class="count-col">${Utils.getText('events.table.count')}</th><th>${Utils.getText('events.table.reward')}</th></tr></thead><tbody>`;
            category.missions.forEach(mission => {
                const reward = mission.rewards[0];
                contentHTML += `<tr><td>${mission.description[lang]}</td><td class="count-col">${mission.count}</td><td class="mission-reward-cell">${getItemGridDisplay(reward.itemId, reward.quantity, reward.rank || '')}</td></tr>`;
            });
            contentHTML += `</tbody></table></div>`;
        });
        contentHTML += `</div></div>`;
    }
    
    /**
     * Renders: Eventos de inicio de sesión diario con recompensas por fecha.
     * Structure: "daily_login_rewards": [ { "date": "...", "rewards": [...] } ]
     * Example: Prepare for the Hogshead Hamlet Update
     */
    if (eventData.daily_login_rewards) {
        contentHTML += `<div class="details-section"><h3>${Utils.getText('events.rewards.dailyLoginTitle')}</h3><div class="details-reward-grid-container">`;
        eventData.daily_login_rewards.forEach(item => {
            const dateLabel = luxon.DateTime.fromISO(item.date).setLocale(lang).toFormat('d MMMM');
            contentHTML += `<div class="details-reward-column"><span class="details-reward-label">${dateLabel}</span><div class="reward-grid">${item.rewards.map(r => getItemGridDisplay(r.itemId, r.quantity, r.rank)).join('')}</div></div>`;
        });
        contentHTML += `</div></div>`;
    }
    
    /**
     * Renders: Eventos que bonifican el sistema de "Requests".
     * Structure: "rewards": { "request_bonus": { "special_drops": [...], "reward_modifier": {...} } }
     * Example: Hidden Dragons' Halloween Special Request
     */
    if (eventData.rewards?.request_bonus) {
        const bonus = eventData.rewards.request_bonus;
        contentHTML += `<div class="details-section"><h3>${Utils.getText('events.rewards.requestBonusTitle')}</h3>`;
        if (bonus.description) contentHTML += `<p>${bonus.description[lang]}</p>`;
        if (bonus.special_drops) {
            contentHTML += `<h4>${Utils.getText('events.rewards.specialDropsTitle')}</h4><div class="details-reward-grid-container">`;
            bonus.special_drops.forEach(drop => {
                const notes = drop.notes ? `<span class="details-reward-label">${drop.notes[lang]}</span>` : '';
                contentHTML += `<div class="details-reward-column">${notes}${getItemGridDisplay(drop.itemId, drop.quantity, drop.rank)}</div>`;
            });
            contentHTML += `</div>`;
        }
        if (bonus.reward_modifier) {
            contentHTML += `<h4>${Utils.getText('events.rewards.bonusModifierTitle')}</h4><div class="weekly-recommendation-box"><p>${bonus.reward_modifier.description[lang]}</p></div>`;
        }
        contentHTML += `</div>`;
    }
    
    /**
     * Renders: Eventos con una lista simple de misiones (sin contador, sin pestañas).
     * Structure: "missions": [ { "description": {...}, "rewards": [...] } ]
     * Note: Maneja de forma segura misiones que no tienen recompensas directas.
     * Examples: The Grand Candy Heist, Monster Busters Halloween
     */
    if (eventData.missions && !eventData.daily_missions && !eventData.mission_categories) {
        contentHTML += `<div class="details-section"><h3>${Utils.getText('events.rewards.missionsTitle')}</h3><table class="details-table missions-table"><tbody>`;
        eventData.missions.forEach(m => {
            let rightColumnHTML = (m.rewards) ? m.rewards.map(rew => getItemGridDisplay(rew.itemId, rew.quantity, rew.rank)).join('') : '';
            contentHTML += `<tr><td>${m.description[lang]}</td><td class="mission-reward-cell">${rightColumnHTML}</td></tr>`;
        });
        contentHTML += `</tbody></table></div>`;
    }
    
    /**
     * Renders: Recompensas por completar un número acumulado de misiones.
     * Soporta dos formatos de JSON para flexibilidad.
     * Structure 1: "cumulative_missions": [ { "condition": ..., "itemId": ..., "quantity": ... } ]
     * Structure 2: "cumulative_missions": [ { "condition": ..., "rewards": [ {...} ] } ]
     * Examples: Halloween Countdown Mission (Structure 1), The Journey Begins: Follow the Stars (Structure 2)
     */
    if (eventData.rewards?.cumulative_missions) {
        contentHTML += `<div class="details-section"><h3>${Utils.getText('events.rewards.cumulativeMissionsTitle')}</h3><div class="details-reward-grid-container">`;
        eventData.rewards.cumulative_missions.forEach(rewardData => {
            let iconGrid = (rewardData.rewards) ? rewardData.rewards.map(r => getItemGridDisplay(r.itemId, r.quantity, r.rank)).join('') : getItemGridDisplay(rewardData.itemId, rewardData.quantity, rewardData.rank);
            contentHTML += `<div class="details-reward-column"><span class="details-reward-label">${rewardData.condition[lang]}</span>${iconGrid}</div>`;
        });
        contentHTML += `</div></div>`;
    }
    
    /**
     * Renders: Recompensas por completar puzles.
     * Structure: "rewards": { "puzzle_completion": [ { "description": {...}, "rewards": [...] } ] }
     * Examples: Trick or Treat Puzzle Event, Black Rose Blooms in the Night
     */
    if (eventData.rewards?.puzzle_completion) {
        contentHTML += `<div class="details-section"><h3>${Utils.getText('events.rewards.puzzleCompletionTitle')}</h3><div class="puzzle-rewards-container">`;
        eventData.rewards.puzzle_completion.forEach(puzzle => {
            contentHTML += `<div class="puzzle-item"><p class="puzzle-description">${puzzle.description[lang]}</p><div class="puzzle-rewards-grid">${puzzle.rewards.map(r => getItemGridDisplay(r.itemId, r.quantity, r.rank)).join('')}</div></div>`;
        });
        contentHTML += `</div></div>`;
    }
    
    /**
     * Renders: Eventos de sistema de puntos donde se ganan puntos por acciones.
     * Structure: "point_system": { "cost_per_claim": ..., "missions": [ { "description": ..., "points": ... } ] }
     * Example: Halloween Raid Event
     */
    if (eventData.point_system) {
        const ps = eventData.point_system;
        contentHTML += `<div class="details-section"><h3>${Utils.getText('events.rewards.pointSystemTitle')}</h3>`;
        let infoText = `<strong>${Utils.getText('events.pointSystem.costPerClaim')}:</strong> ${ps.cost_per_claim} Pts. <strong>${Utils.getText('events.pointSystem.dailyClaimLimit')}:</strong> ${ps.daily_max_claims}. <strong>${Utils.getText('events.pointSystem.dailyPointLimit')}:</strong> ${ps.daily_max_points}.`;
        contentHTML += `<div class="weekly-recommendation-box"><p>${infoText}</p></div><h4>${Utils.getText('events.pointSystem.pointsPerAction')}</h4><table class="details-table missions-table"><tbody>`;
        ps.missions.forEach(mission => {
            contentHTML += `<tr><td>${mission.description[lang]}</td><td class="points-col">+${mission.points}</td></tr>`;
        });
        contentHTML += `</tbody></table></div>`;
    }
    
    /**
     * Renders: Una tienda de intercambio donde se usa una moneda de evento.
     * Structure: "rewards": { "exchange_shop": [ { "itemId": ..., "cost": ..., "limit": ... } ] }
     * Example: The Grand Candy Heist
     */
    if (eventData.rewards?.exchange_shop) {
        contentHTML += `<div class="details-section"><h3>${Utils.getText('events.rewards.exchangeShopTitle')}</h3><table class="details-table exchange-shop-table"><tbody>`;
        const currencyItemId = eventData.missions?.[0]?.rewards?.[0]?.itemId;
        const currencyItemDef = currencyItemId ? App.state.allItemsData[currencyItemId] : null;
        eventData.rewards.exchange_shop.forEach(item => {
            const itemToBuyDef = App.state.allItemsData[item.itemId]; if (!itemToBuyDef) return;
            const itemName = itemToBuyDef.name[lang] || itemToBuyDef.name.en;
            const itemIconHtml = getItemGridDisplay(item.itemId, item.quantity, item.rank);
            let costHtml = `<span class="cost-value">${item.cost}</span>`;
            if (currencyItemDef) {
                costHtml += `<img src="assets/items/${currencyItemDef.icon}.png" class="currency-icon" alt="${currencyItemDef.name[lang]}">`;
            }
            let limitText = '';
            if (item.limit && item.limit.key) {
                const translatedLimit = Utils.getText(`events.limits.${item.limit.key}`, { value: item.limit.value });
                limitText = `<span class="item-limit">${translatedLimit}</span>`;
            }
            contentHTML += `<tr><td class="item-to-buy">${itemIconHtml}<div class="item-info"><span class="item-name ${getRarityClass(item.rank)}">${itemName}</span>${limitText}</div></td><td class="item-cost">${costHtml}</td></tr>`;
        });
        contentHTML += `</tbody></table></div>`;
    }
    
    /**
     * Renders: Una lista simple de misiones y recompensas en formato de cuadrícula.
     * Structure: "missions_and_rewards": [ { "mission": {...}, "itemId": ..., "quantity": ... } ]
     * Examples: Ukapong's Hidden Challenge, Witch Soha's Growth Magic!
     */
    if (eventData.missions_and_rewards) {
        contentHTML += `<div class="details-section"><h3>${Utils.getText('events.rewards.missionsAndRewardsTitle')}</h3><div class="details-reward-grid-container">`;
        eventData.missions_and_rewards.forEach(m => {
            contentHTML += `<div class="details-reward-column"><span class="details-reward-label">${m.mission[lang]}</span>${getItemGridDisplay(m.itemId, m.quantity, m.rank)}</div>`;
        });
        contentHTML += `</div></div>`;
    }
    
    /**
     * Renders: Recompensas de clasificación para un jefe de campo.
     * Structure: "boss_details": { "ranking_rewards": { "base_on_participation": ..., "bonus_by_rank": [...] } }
     * Example: Field Boss Challenge
     */
    if (eventData.boss_details?.ranking_rewards) {
        contentHTML += `<div class="details-section"><h3>${Utils.getText('events.rewards.bossRankingTitle')}</h3>`;
        const participation = eventData.boss_details.ranking_rewards.base_on_participation;
        if (participation) {
            contentHTML += `<div class="participation-reward"><div class="reward-grid">${participation.rewards.map(r => getItemGridDisplay(r.itemId, r.quantity, r.rank || 'Common')).join('')}</div><div class="participation-reward-text"><strong>${Utils.getText('events.rewards.participationTitle')}</strong><span>${participation.description[lang]}</span></div></div>`;
        }
        const ranking = eventData.boss_details.ranking_rewards.bonus_by_rank;
        if (ranking) {
            contentHTML += `<div class="details-reward-grid-container">`;
            ranking.forEach(r => {
                contentHTML += `<div class="details-reward-column"><span class="details-reward-label">${r.tier_name[lang]}</span><div class="reward-grid">${r.rewards.map(rew => getItemGridDisplay(rew.itemId, rew.quantity, rew.rank || 'Common')).join('')}</div></div>`;
            });
            contentHTML += `</div>`;
        }
        contentHTML += `</div>`;
    }
    
    /**
     * Renders: Las recompensas de una ruleta (gacha). Muestra ítems y sus probabilidades.
     * Structure: "rewards": { "wheel_of_fate": [ { "itemId": ..., "probability": ... } ] }
     * Examples: Halloween Wheel of Fate, Field Boss Challenge
     */
    if (eventData.rewards?.wheel_of_fate) {
        contentHTML += `<div class="details-section"><h3>${Utils.getText('events.rewards.wheelTitle')}</h3>`;
        contentHTML += `<div class="reward-grid">${eventData.rewards.wheel_of_fate.map(r => getItemGridDisplay(r.itemId, r.quantity, r.rank, r.probability)).join('')}</div>`;
        contentHTML += generateRewardTextList(eventData.rewards.wheel_of_fate);
        contentHTML += `</div>`;
    }
    
    /**
     * Renders: Recompensas acumuladas por girar una ruleta un número de veces.
     * Structure: "rewards": { "cumulative_spins": [ { "condition": {...}, "itemId": ... } ] }
     * Examples: Halloween Wheel of Fate, Field Boss Challenge
     */
    if (eventData.rewards?.cumulative_spins) {
        contentHTML += `<div class="details-section"><h3>${Utils.getText('events.rewards.cumulativeTitle')}</h3><div class="details-reward-grid-container">`;
        eventData.rewards.cumulative_spins.forEach(r => {
            contentHTML += `<div class="details-reward-column"><span class="details-reward-label">${r.condition[lang]}</span>${getItemGridDisplay(r.itemId, r.quantity, r.rank)}</div>`;
        });
        contentHTML += `</div></div>`;
    }
    
    /**
     * Renders: Una "piscina" de recompensas posibles de una fuente aleatoria (no una ruleta).
     * Structure: "rewards": { "reward_pool": [ { "itemId": ..., "probability": ... } ] }
     * Examples: Monster Busters Halloween, Unlimited Skill Growth Chance
     */
    if (eventData.rewards?.reward_pool) {
        contentHTML += `<div class="details-section"><h3>${Utils.getText('events.rewards.possibleTitle')}</h3>`;
        contentHTML += `<div class="reward-grid">${eventData.rewards.reward_pool.map(r => getItemGridDisplay(r.itemId, r.quantity, r.rank, r.probability)).join('')}</div>`;
        contentHTML += generateRewardTextList(eventData.rewards.reward_pool);
        contentHTML += `</div>`;
    }

    // --- 6. CIERRE Y RENDERIZADO FINAL ---
    contentHTML += `</div>`;
    App.dom.eventDetailsPanel.innerHTML = contentHTML;
    App.dom.eventDetailsPanel.classList.add('visible');
    if (App.state.isMobile) document.body.classList.add('no-scroll');
    App.state.currentOpenEventId = eventId;

    // Añade listeners para las pestañas si existen en el contenido renderizado.
    const tabsNav = App.dom.eventDetailsPanel.querySelector('.tabs-nav');
    if (tabsNav) {
        tabsNav.addEventListener('click', e => {
            if (e.target.classList.contains('tab-link')) {
                const tabId = e.target.dataset.tab;
                tabsNav.querySelectorAll('.tab-link').forEach(btn => btn.classList.remove('active'));
                App.dom.eventDetailsPanel.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
                e.target.classList.add('active');
                document.getElementById(tabId).classList.add('active');
            }
        });
    }
},

    closeEventDetailsPanel: function () {
        if (!App.dom.eventDetailsPanel) return;
        App.dom.eventDetailsPanel.classList.remove('visible');
        App.state.currentOpenEventId = null;
        if (App.state.isMobile) document.body.classList.remove('no-scroll');
    },

    // REEMPLAZA esta función completa en js/3-ui.js
// REEMPLAZA esta función completa en js/3-ui.js
openWeeklyDetailsPanel: function (weeklyId) {
    this.closeAllDetailsPanels();

    const lang = App.state.config.language;
    const weeklyData = App.state.weeklyResetsData;
    if (!weeklyData) return;

    const eventData = weeklyData.events.find(e => e.id === weeklyId);
    if (!eventData) {
        console.error(`Weekly event data not found for ID: ${weeklyId}`);
        return;
    }

    const getWeeklyItemGridDisplay = (itemId, quantity, rank = 'Common') => {
        const itemDef = App.state.allItemsData[itemId];
        if (!itemDef || !itemDef.icon) return '';
        const name = itemDef.name[lang] || itemDef.name.en || itemId;
        const rankClass = `rank-${rank.toLowerCase()}`;
        const sizeClass = (itemDef.size && itemDef.size.trim().toLowerCase() === 'double') ? 'double-width' : '';
        return `<div class="weekly-reward-grid-item ${sizeClass} ${rankClass}" title="${name} x${quantity}">
                    <img src="assets/items/${itemDef.icon}.png" class="weekly-reward-icon" alt="${name}">
                    <span class="weekly-reward-quantity">${quantity}</span>
                </div>`;
    };

    let contentHTML = `
        <div class="details-header">
            <div class="close-details-btn"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" width="24" height="24"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg></div>
            <h2>${eventData.eventName[lang]}</h2>
            <p>${eventData.description ? eventData.description[lang] : ''}</p>
        </div>
        <div class="details-content">
    `;

    if (eventData.seasonBuffs) {
        contentHTML += `<div class="details-section"><h3>${Utils.getText('weekly.seasonBuffsTitle')}</h3>`;
        eventData.seasonBuffs.forEach((buff, index) => {
            let buffDescription = buff.description ? (Array.isArray(buff.description) ? buff.description.map(d => d[lang]).join('<br>') : buff.description[lang]) : '';
            contentHTML += `<div class="weekly-buff-item">
                              <img src="assets/spells_icons/${buff.icon}.png">
                              <div><strong>${buff.name[lang]}</strong><p>${buffDescription}</p></div>
                            </div>`;
            if (index < eventData.seasonBuffs.length - 1) contentHTML += '<hr class="weekly-buff-separator">';
        });
        contentHTML += `</div>`;
    }

    if (eventData.chosenBuffs) {
        contentHTML += `<div class="details-section"><h3>${Utils.getText('weekly.chosenBuffsTitle')}</h3>`;

        const arrowSVG = `<svg class="expand-arrow" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>`;

        eventData.chosenBuffs.forEach((buff, index) => {
            const hasEnhancements = buff.enhancements && buff.enhancements.length > 0;
            const expandableClass = hasEnhancements ? ' expandable' : '';

            contentHTML += `<div class="weekly-buff-item${expandableClass}">
                      <img src="assets/spells_icons/${buff.icon}.png">
                      <div><strong>${buff.name[lang]}</strong><p>${buff.description[lang]}</p></div>
                      ${hasEnhancements ? arrowSVG : ''}
                    </div>`;

            if (hasEnhancements) {
                contentHTML += `<div class="weekly-enhancements-list">`;
                    contentHTML += `<p class="enhancements-title">${Utils.getText('weekly.enhancementsTitle')}</p>`;
                buff.enhancements.forEach(enh => {
                    contentHTML += `<div class="weekly-enhancement-item">
                              <strong>${enh.name[lang]}</strong>
                              <p>${enh.description[lang]}</p>
                            </div>`;
                });
                contentHTML += `</div>`;
            }

            if (index < eventData.chosenBuffs.length - 1) {
                contentHTML += '<hr class="weekly-buff-separator">';
            }
        });

        contentHTML += `</div>`;
    }

    if (eventData.stages) {
        contentHTML += `<div class="details-section"><h3>${Utils.getText('weekly.stagesTitle')}</h3>`;
        if (eventData.stages[0].recommendedHeroes) {
            contentHTML += `<div class="weekly-recommendation-box"><p>${eventData.stages[0].recommendedHeroes.description[lang]}</p></div>`;
        }
        eventData.stages.forEach((stage, index) => {
            const elementalIcons = stage.elementalWeakness.map(el => `<img src="assets/elements/${el.toLowerCase()}_icon.png" class="weekly-element-icon" alt="${el}">`).join('');
            contentHTML += `<div class="weekly-stage-item">
                                <h4 class="weekly-stage-title">${stage.stageName[lang]}</h4>
                                <div class="weekly-stage-info-grid">
                                    <div class="weekly-stage-info-item"><span class="weekly-stage-info-label">${Utils.getText('weekly.combatPower')}</span><div class="weekly-stage-info-value"><img src="assets/combat_power.png" class="weekly-combat-power-icon" /> ${stage.recommendedPower}</div></div>
                                    <div class="weekly-stage-info-item"><span class="weekly-stage-info-label">${Utils.getText('weekly.timeLimit')}</span><div class="weekly-stage-info-value">🕒 ${stage.timeLimit[lang]}</div></div>
                                    <div class="weekly-stage-info-item"><span class="weekly-stage-info-label">${Utils.getText('weekly.weakness')}</span><div class="weekly-stage-info-value weekly-elemental-weakness">${elementalIcons}</div></div>
                                </div>
                                <div class="weekly-stage-rewards">`;
            stage.completionRewards.forEach(rewardTier => {
                const rewardsGrid = rewardTier.rewards.map(r => getWeeklyItemGridDisplay(r.itemId, r.quantity, r.rank)).join('');
                contentHTML += `<div class="weekly-reward-tier"><p><strong class="rarity-text-rare">${Utils.getText('events.rewards.rankHeader')} ${rewardTier.stageLevel}:</strong></p><div class="weekly-reward-grid">${rewardsGrid}</div></div>`;
            });
            contentHTML += `</div></div>`;
            if (index < eventData.stages.length - 1) contentHTML += '<hr class="weekly-buff-separator">';
        });
        contentHTML += `</div>`;
    }

    if (eventData.currentBoss) {
        const boss = eventData.currentBoss;
        contentHTML += `<div class="details-section"><h3>${Utils.getText('weekly.bossInfoTitle')}</h3>
            <div class="weekly-boss-info-header">
                <img src="assets/enemies_icon/${boss.enemyIcon}.png" alt="${boss.name[lang]}">
                <div class="boss-info-details"><h4>${boss.name[lang]}</h4><div class="weekly-stage-info-grid"><div class="weekly-stage-info-item"><span class="weekly-stage-info-label">${Utils.getText('weekly.timeLimit')}</span><div class="weekly-stage-info-value">🕒 ${boss.turnLimit} Turns</div></div></div></div>
            </div>
            <p class="details-summary">${boss.description[lang]}</p>
        </div>`;

        if (boss.recommendedHeroes?.description) {
            contentHTML += `<div class="details-section weekly-recommended-heroes"><h3>${Utils.getText('weekly.recommendedHeroes')}</h3><div class="weekly-recommendation-box"><p>${boss.recommendedHeroes.description[lang]}</p></div>`;
            if (boss.recommendedHeroes.heroesByTag) {
                boss.recommendedHeroes.heroesByTag.forEach(tagGroup => {
                    contentHTML += `<div class="weekly-recommended-heroes-tag-group"><h5 class="weekly-recommended-heroes-tag">#${tagGroup.tag[lang]}</h5><div class="banner-heroes">`;
                    tagGroup.heroList.forEach(hero => {
                        const heroData = Logic.findHeroByName(hero);
                        if (heroData) {
                            const roleIcon = heroData.role ? `<div class="hero-role-icon element-${heroData.element || 'default'}"><img class="role-icon" src="assets/roles/${heroData.role}_icon.png" alt="${heroData.role}"></div>` : '';
                            contentHTML += `<div class="banner-hero-wrapper"><div class="banner-hero-img-container" data-hero-name="${heroData.game_name}"><div class="banner-hero-img rarity-${heroData.rarity}"><img src="assets/heroes_icon/${heroData.short_image}" alt="${heroData.game_name}"></div>${roleIcon}</div><span class="banner-hero-name">${heroData.game_name}</span></div>`;
                        }
                    });
                    contentHTML += `</div></div>`;
                });
            }
            contentHTML += `</div>`;
        }

        if (boss.difficultyTiers) {
            contentHTML += `<div class="details-section"><h3>${Utils.getText('weekly.modifiersTitle')}</h3>`;
            Object.entries(boss.difficultyTiers).forEach(([tier, data]) => {
                contentHTML += `<div class="weekly-difficulty-tier"><h4>${'★'.repeat(parseInt(tier))}</h4>`;
                data.modifiers.forEach(mod => {
                    contentHTML += `<div class="weekly-modifier-item"><strong>${mod.name[lang]} (+${mod.points})</strong><p>${mod.description[lang]}</p></div>`;
                });
                contentHTML += `<table class="weekly-details-table weekly-progression-table">`;
                data.progression.forEach(prog => {
                    contentHTML += `<tr><td>+${prog.modifiersSelected} mods</td><td><img src="assets/combat_power.png" class="weekly-combat-power-icon" /> ${prog.recommendedPower.toLocaleString()}</td><td>${prog.cumulativeScore.toLocaleString()} Pts</td></tr>`;
                });
                contentHTML += `</table></div>`;
            });
            contentHTML += `</div>`;
        }

        if (boss.scoreRewards) {
            contentHTML += `<div class="details-section"><h3>${Utils.getText('weekly.scoreRewardsTitle')}</h3><div class="weekly-score-rewards-grid">`;
            boss.scoreRewards.forEach(tier => {
                const rewardItem = tier.rewards[0];
                const itemDef = App.state.allItemsData[rewardItem.itemId];
                const rank = rewardItem.rank || 'Common';
                const name = itemDef ? itemDef.name[lang] : rewardItem.itemId;

                const iconHTML = itemDef?.icon
                    ? `<div class="weekly-score-reward-item rank-${rank.toLowerCase()}" title="${name} x${rewardItem.quantity}">
                           <img src="assets/items/${itemDef.icon}.png" class="weekly-reward-icon">
                           <span class="weekly-reward-quantity">${rewardItem.quantity}</span>
                       </div>`
                    : '';

                contentHTML += `<div class="weekly-score-reward-column">
                                  <span class="weekly-score-reward-points">${tier.scoreThreshold.toLocaleString()} Pts</span>
                                  ${iconHTML}
                                </div>`;
            });
            contentHTML += `</div></div>`;
        }

        if (boss.tips?.length > 0) {
            contentHTML += `<div class="details-section"><h3>${Utils.getText('weekly.tipsTitle')}</h3><ul class="weekly-tips-list">`;
            boss.tips.forEach(tip => { contentHTML += `<li>${tip[lang]}</li>`; });
            contentHTML += `</ul></div>`;
        }

        if (eventData.nextBoss) {
            contentHTML += `<div class="details-section"><h3>${Utils.getText('weekly.nextBoss')}</h3>
                <div class="weekly-buff-item">
                    <img src="assets/enemies_icon/${eventData.nextBoss.icon}" alt="${eventData.nextBoss.name[lang]}">
                    <div><strong>${eventData.nextBoss.name[lang]}</strong><p>${eventData.nextBoss.description[lang]}</p></div>
                </div>
             </div>`;
        }
    }

    contentHTML += `</div>`;
    App.dom.weeklyDetailsPanel.innerHTML = contentHTML;
    App.dom.weeklyDetailsPanel.classList.add('visible');
    if (App.state.isMobile) document.body.classList.add('no-scroll');
    App.state.currentOpenWeeklyId = weeklyId;
},

    /** Cierra el panel de detalles del evento semanal. */
    // ... continuación de js/3-ui.js

    closeWeeklyDetailsPanel: function() {
        if (!App.dom.weeklyDetailsPanel) return;
        App.dom.weeklyDetailsPanel.classList.remove('visible');
        App.state.currentOpenWeeklyId = null;
        if (App.state.isMobile) document.body.classList.remove('no-scroll');
    },

    closeAllDetailsPanels: function() {
    this.closeEventDetailsPanel();
    this.closeWeeklyDetailsPanel();
},

    openSettingsModal: function() {
        const config = App.state.config;
        App.dom.bossTimersToggle.checked = config.showBossTimers;
        App.dom.eventsToggle.checked = config.showEvents;
        App.dom.weeklyToggle.checked = config.showWeekly;
        App.dom.preAlertInput.value = config.preAlertMinutes.join(', ');
        App.dom.soundToggle.checked = config.notificationTypes.sound;
        App.dom.desktopToggle.checked = config.notificationTypes.desktop;
        App.dom.timezoneSelect.value = config.displayTimezone;
        App.dom.languageSelect.value = config.language;

        // --- INICIO DE LA CORRECCIÓN: Cargar valores de recordatorios ---
        const reminders = config.reminderSettings || {};
        const eventDailies = reminders.eventDailies || { enabled: true, hours: 12 };
        const weekly = reminders.weekly || { enabled: true, days: 3 };
        const banner = reminders.banner || { enabled: true, days: 4 };

        document.getElementById('event-dailies-reminder-toggle').checked = eventDailies.enabled;
        document.getElementById('event-dailies-reminder-hours').value = eventDailies.hours;
        document.getElementById('weekly-reminder-toggle').checked = weekly.enabled;
        document.getElementById('weekly-reminder-days').value = weekly.days;
        document.getElementById('banner-reminder-toggle').checked = banner.enabled;
        document.getElementById('banner-reminder-days').value = banner.days;
        // --- FIN DE LA CORRECCIÓN ---

        App.dom.modalOverlay.classList.add('visible');
    },

    closeSettingsModal: function() {
        App.dom.modalOverlay.classList.remove('visible');
    },

    // Reemplaza tu función openAccountModal con esta versión corregida
async openAccountModal() {
    // Llenar datos de traducción cada vez que se abre
    App.dom.accountModalOverlay.querySelectorAll('[data-lang-key]').forEach(el => {
        const key = el.dataset.langKey;
        const text = Utils.getText(key);
        if (text !== key) el.innerHTML = text;
    });

    const myAccountSection = document.getElementById('section-my-account');
    const logoutButton = document.getElementById('logout-btn-modal');
    const footer = logoutButton.parentElement;

    // --- INICIO DE LA CORRECCIÓN ---
    // 1. Siempre nos aseguramos de que el botón de logout original sea visible
    logoutButton.style.display = 'flex';

    // 2. Buscamos y eliminamos cualquier botón de login que haya quedado de antes
    const existingLoginButton = document.getElementById('login-btn-modal');
    if (existingLoginButton) {
        existingLoginButton.remove();
    }
    // --- FIN DE LA CORRECCIÓN ---

    if (App.state.isLoggedIn && App.state.userInfo) {
        // --- LÓGICA PARA USUARIO LOGUEADO ---
        const { global_name, avatarUrl } = App.state.userInfo;
        myAccountSection.querySelector('.user-profile-avatar').src = avatarUrl;
        myAccountSection.querySelector('.user-profile-name').textContent = global_name;

        // Cargar preferencias de push en la UI
        const prefs = App.state.config.notificationPrefs || {};
        document.getElementById('push-daily-reset-toggle').checked = prefs.dailyReset ?? true;
        document.getElementById('push-showdown-ticket-toggle').checked = prefs.showdownTicket ?? true;
        document.getElementById('push-weekly-reset-toggle').checked = prefs.weeklyResetReminder?.enabled ?? true;
        document.getElementById('push-weekly-days-input').value = prefs.weeklyResetReminder?.daysBefore ?? 2;
        document.getElementById('push-event-dailies-toggle').checked = prefs.eventDailiesReminder?.enabled ?? true;
        document.getElementById('push-event-hours-input').value = prefs.eventDailiesReminder?.hoursBeforeReset ?? 4;
        
        this.renderActiveSubscriptions();
        this.switchAccountModalSection('my-account');

    } else {
        // --- LÓGICA PARA INVITADO ---
        myAccountSection.querySelector('.user-profile-avatar').src = 'assets/wimp_default.jpg';
        myAccountSection.querySelector('.user-profile-name').textContent = Utils.getText('common.guest');

        // Ocultar el botón de Logout estático
        logoutButton.style.display = 'none';

        // Crear y añadir un botón de Login dinámicamente
        const loginButtonHTML = `
            <button id="login-btn-modal" class="logout-button login-button">
                 <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
                </svg>
                <span data-lang-key="common.login">${Utils.getText('common.login')}</span>
            </button>
        `;
        // Usamos .innerHTML aquí para reemplazar cualquier contenido residual
        footer.insertAdjacentHTML('beforeend', loginButtonHTML);
        document.getElementById('login-btn-modal').addEventListener('click', () => Logic.redirectToDiscordLogin());
    }

    this.switchAccountModalSection('my-account');
    App.dom.accountModalOverlay.classList.add('visible');
},

    /**
     * Cambia la sección visible dentro del modal de cuenta.
     * @param {string} sectionId - El ID de la sección a mostrar (ej. 'my-account').
     */
    switchAccountModalSection(sectionId) {
        const modal = App.dom.accountModalOverlay;
        if (!modal) return;

        // 1. Ocultar todas las secciones de contenido
        modal.querySelectorAll('.content-section').forEach(section => {
            section.classList.remove('active');
        });

        // 2. Quitar la clase 'active' de todos los enlaces de navegación
        modal.querySelectorAll('.nav-item').forEach(navLink => {
            navLink.classList.remove('active');
        });

        // 3. Mostrar la sección de contenido correcta
        const activeSection = modal.querySelector(`#section-${sectionId}`);
        if (activeSection) {
            activeSection.classList.add('active');
        }

        // 4. Marcar como 'active' el enlace de navegación correcto
        const activeNavLink = modal.querySelector(`.nav-item[data-section="${sectionId}"]`);
        if (activeNavLink) {
            activeNavLink.classList.add('active');
        }
    },

    /**
     * Devuelve el SVG correspondiente al sistema operativo.
     * @param {string} os - El nombre del sistema operativo (ej. "Windows").
     * @returns {string} El string SVG del icono.
     */
    getDeviceIcon(os) {
        const osLower = (os || '').toLowerCase(); // Maneja el caso de que 'os' sea undefined
        if (osLower.includes('windows')) {
            return `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M3,12V6.75L9,5.43V11.91L3,12M21,12V4.5L11,3V11.91L21,12M3,13L9,13.09V19.57L3,18.25V13M21,13L11,13.09V21L21,19.5V13Z" /></svg>`;
        }
        if (osLower.includes('android')) {
            return `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M16,18H8V6H16M16.5,3H7.5A1.5,1.5 0 0,0 6,4.5V19.5A1.5,1.5 0 0,0 7.5,21H16.5A1.5,1.5 0 0,0 18,19.5V4.5A1.5,1.5 0 0,0 16.5,3M13.5,4.5H10.5V5H13.5V4.5Z" /></svg>`;
        }
        if (osLower.includes('ios')) {
            return `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M16,18H8V6H16M16.5,3H7.5A1.5,1.5 0 0,0 6,4.5V19.5A1.5,1.5 0 0,0 7.5,21H16.5A1.5,1.5 0 0,0 18,19.5V4.5A1.5,1.5 0 0,0 16.5,3M12,20A1,1 0 1,1 13,19A1,1 0 0,1 12,20Z" /></svg>`;
        }
        if (osLower.includes('macos')) {
            return `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M20,2H4C2.9,2 2,2.9 2,4V16C2,17.1 2.9,18 4,18H9V20H7V22H17V20H15V18H20C21.1,18 22,17.1 22,16V4C22,2.9 21.1,2 20,2M20,16H4V4H20V16Z" /></svg>`;
        }
        // Icono por defecto para Linux, etc.
        return `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M21,16H3V4H21M21,2H3C1.89,2 1,2.89 1,4V16A2,2 0 0,0 3,18H10V20H8V22H16V20H14V18H21A2,2 0 0,0 23,16V4C23,2.89 22.1,2 21,2Z" /></svg>`;
    },

    /**
     * Obtiene y renderiza la lista de suscripciones push activas del usuario.
     */
    async renderActiveSubscriptions() {
        const listContainer = document.getElementById('active-subscriptions-list');
        if (!listContainer) return;

        listContainer.innerHTML = `<p class="settings-description">${Utils.getText('account.loadingSubscriptions')}</p>`;

        try {
            // Obtenemos los datos más recientes del usuario, incluidas las suscripciones
            const userData = await Logic.fetchUserPreferences();
            const subscriptions = userData?.preferences?.pushSubscriptions || [];

            // Obtenemos la suscripción del navegador actual para compararla
            const registration = await navigator.serviceWorker.ready;
            const currentSubscription = await registration.pushManager.getSubscription();

            let listHTML = '';

            if (subscriptions.length === 0) {
                listHTML = `<p class="settings-description">No active subscriptions found.</p>`;
            } else {
                listHTML = subscriptions.map(sub => {
                    const subscribedOnText = Utils.getText('account.subscribedOn');
                    const { DateTime } = luxon;
                    const date = DateTime.fromISO(sub.subscribedAt);
                    const formattedDate = date.setLocale(App.state.config.language).toLocaleString(DateTime.DATE_FULL);

                    const browserIconMap = { 'chrome': 'chrome', 'firefox': 'firefox', 'safari': 'safari', 'edge': 'edge', 'brave': 'brave', 'opera': 'opera', 'opera gx': 'operagx', 'opera mini': 'operamini', 'opera touch': 'operatouch', 'vivaldi': 'vivaldi', 'arc': 'arc' };
                    const browserName = sub.browser || '';
                    const browserKey = browserName.toLowerCase();
                    const iconFileName = browserIconMap[browserKey] || 'default';

                    return `
                        <div class="subscription-item">
                            <div class="subscription-info">
                                <span class="subscription-alias">${sub.alias}</span>
                                <div class="subscription-details">
                                    <span class="detail-item browser-detail">
                                        <img src="assets/browsers/${iconFileName}.png" alt="${browserName}" class="browser-icon">
                                        ${browserName}
                                    </span>
                                    <span class="detail-item os-detail">
                                        ${this.getDeviceIcon(sub.os || '')}
                                        ${sub.os || 'SO Desconocido'}
                                    </span>
                                    <span class="detail-item date-detail">
                                        - ${subscribedOnText} ${formattedDate}
                                    </span>
                                </div>
                            </div>
                            <button class="delete-subscription-btn" data-endpoint="${sub.endpoint}">
                                 <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.124-2.033-2.124H8.033c-1.12 0-2.033.944-2.033 2.124v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
                            </button>
                        </div>
                    `;
                }).join('');
            }
            
            listContainer.innerHTML = listHTML;

            // Comprobamos si el dispositivo actual ya está en la lista de suscripciones guardadas
            const isCurrentDeviceSubscribed = currentSubscription && subscriptions.some(sub => sub.endpoint === currentSubscription.endpoint);

            // Si el dispositivo actual NO está suscrito, mostramos el botón para añadirlo
            if (!isCurrentDeviceSubscribed) {
                const addButtonHTML = `
                    <div class="subscription-item add-new-device">
                        <span data-lang-key="pushSettings.addDevice"></span>
                        <button id="account-subscribe-push-btn" class="settings-btn">+</button>
                    </div>
                `;
                listContainer.insertAdjacentHTML('beforeend', addButtonHTML);
                // Volvemos a aplicar las traducciones solo para este nuevo elemento
                listContainer.querySelector('[data-lang-key]').innerHTML = Utils.getText('pushSettings.addDevice');
            }

        } catch (error) {
            console.error("Error al cargar las suscripciones:", error);
            listContainer.innerHTML = `<p class="settings-description" style="color: var(--color-danger);">Error loading subscriptions.</p>`;
        }
    },
    
    async handleAddNewSubscription() {
        try {
            // Logic.subscribeToPushNotifications ya se encarga de pedir el alias
            await Logic.subscribeToPushNotifications();
            // Una vez suscrito, volvemos a renderizar la lista para que se actualice
            this.renderActiveSubscriptions();
        } catch (error) {
            console.error("Fallo al añadir nueva suscripción:", error);
            alert("Could not add subscription. Please try again.");
        }
    },

    closeAccountModal: function() {
        if (App.dom.accountModalOverlay) {
            App.dom.accountModalOverlay.classList.remove('visible');
        }
        // La parte clave: SIEMPRE eliminamos la clase no-scroll al cerrar
        document.body.classList.remove('no-scroll');
    },

    openInfoModal: function() {
        App.dom.infoModalOverlay.classList.add('visible');
    },

    closeInfoModal: function() { 
        App.dom.infoModalOverlay.classList.remove('visible');
    },

    openSyncModal: function() {
        document.getElementById('sync-hours').value = '';
        document.getElementById('sync-minutes').value = '';
        document.getElementById('sync-seconds').value = '';
        App.dom.syncModalOverlay.classList.add('visible');
        document.getElementById('sync-hours').focus();
    },

    closeSyncModal: function() { 
        App.dom.syncModalOverlay.classList.remove('visible');
    },

    openAboutModal: function() {
        // --- INICIO DE LA CORRECCIÓN ---
        document.body.classList.add('no-scroll'); // <-- AÑADE ESTA LÍNEA
        // --- FIN DE LA CORRECCIÓN ---

        // Añadimos la lógica de traducción aquí
        document.querySelectorAll('#about-modal-overlay [data-lang-key]').forEach(el => {
            const key = el.dataset.langKey;
            const text = Utils.getText(key);
            if (text !== key) el.textContent = text;
        });
        App.dom.aboutModalOverlay.classList.add('visible');
    },

    closeAboutModal: function() { 
        // --- INICIO DE LA CORRECCIÓN ---
        document.body.classList.remove('no-scroll'); // <-- AÑADE ESTA LÍNEA
        // --- FIN DE LA CORRECCIÓN ---

        App.dom.aboutModalOverlay.classList.remove('visible');
    },

    openHeroModal: function(heroData, contextHeroes = [], index = -1) {
        if (!heroData) return;

        App.state.heroModalContext = { heroes: contextHeroes, currentIndex: index };
        
        const skinPreviewsContainer = document.getElementById('skin-previews-container');
        const skinPreviewsList = document.getElementById('skin-previews-list');
        const relatedHeroesContainer = document.getElementById('related-heroes-container');
        const relatedHeroesList = document.getElementById('related-heroes-list');
        
        skinPreviewsList.innerHTML = '';
        relatedHeroesList.innerHTML = '';

        const setImage = (path) => { document.getElementById('hero-modal-image').src = path; };

        // Lógica de Skins
        const availableSkins = [{ 
            imgPath: `assets/heroes_full/${heroData.long_image}`, 
            thumbPath: `assets/heroes_icon/${heroData.short_image}`
        }];
        if (heroData.skins) {
            Object.keys(heroData.skins).forEach(skinKey => {
                availableSkins.push({
                    imgPath: `assets/heroes_full/${heroData.skins[skinKey]}`,
                    thumbPath: `assets/heroes_full/${heroData.skins[skinKey]}`
                });
            });
        }
        
        if (availableSkins.length > 1) {
            skinPreviewsContainer.style.display = 'block';
            availableSkins.forEach((skin, i) => {
                const previewDiv = document.createElement('div');
                previewDiv.className = `hero-preview-item ${i === 0 ? 'active' : ''}`;
                previewDiv.innerHTML = `<img src="${skin.thumbPath}" alt="Skin ${i + 1}">`;
                previewDiv.addEventListener('click', (e) => {
                    e.stopPropagation();
                    setImage(skin.imgPath);
                    skinPreviewsList.querySelectorAll('.hero-preview-item').forEach(p => p.classList.remove('active'));
                    previewDiv.classList.add('active');
                });
                skinPreviewsList.appendChild(previewDiv);
            });
        } else {
            skinPreviewsContainer.style.display = 'none';
        }

        // --- INICIO DE LA CORRECCIÓN ---
        // Lógica de Héroes Relacionados
        // Eliminamos el .filter() para mostrar SIEMPRE todos los héroes del contexto.
        if (contextHeroes.length > 0) {
            relatedHeroesContainer.style.display = 'block';
            contextHeroes.forEach(contextHero => { // <-- Se itera sobre 'contextHeroes' directamente
                const otherHeroData = Logic.findHeroByName(contextHero.name);
                if (otherHeroData) {
                    const previewDiv = document.createElement('div');
                    previewDiv.className = 'hero-preview-item';
                    
                    // Si el héroe de la lista es el que estamos viendo, lo marcamos como activo.
                    if (otherHeroData.game_name === heroData.game_name) {
                        previewDiv.classList.add('active');
                    }

                    previewDiv.innerHTML = `<img src="assets/heroes_icon/${otherHeroData.short_image}" alt="${otherHeroData.game_name}">`;
                    previewDiv.addEventListener('click', (e) => {
                        e.stopPropagation();
                        const newIndex = contextHeroes.findIndex(h => h.name === otherHeroData.game_name);
                        this.navigateHeroModal(newIndex);
                    });
                    relatedHeroesList.appendChild(previewDiv);
                }
            });
        } else {
            relatedHeroesContainer.style.display = 'none';
        }
        // --- FIN DE LA CORRECCIÓN ---
        
        // El resto de la función sigue igual...
        setImage(`assets/heroes_full/${heroData.long_image}`);

        const showNav = contextHeroes.length > 1;
        document.getElementById('hero-modal-prev-btn').classList.toggle('visible', showNav);
        document.getElementById('hero-modal-next-btn').classList.toggle('visible', showNav);

        const currentHeroContext = contextHeroes[index] || {};
        const tagEl = document.getElementById('hero-modal-tag');
        if (currentHeroContext.tag) {
            tagEl.textContent = currentHeroContext.tag;
            tagEl.classList.add('visible');
        } else {
            tagEl.classList.remove('visible');
        }
        
        document.getElementById('hero-modal-content').style.borderColor = getComputedStyle(document.documentElement).getPropertyValue(`--color-${heroData.element || 'default'}-role`).trim();
        document.getElementById('hero-modal-info').style.backgroundColor = `var(--rarity${heroData.rarity}-modal-bg)`;
        
        const nameEl = document.getElementById('hero-modal-name');
        nameEl.textContent = heroData.game_name;
        nameEl.style.color = heroData.rarity === 1 ? 'var(--color-exalted-gold)' : '';
        
        document.getElementById('hero-modal-rarity').textContent = Utils.getText(`hero.rarity${heroData.rarity}`);
        document.getElementById('hero-modal-rarity').className = `rarity-text-${heroData.rarity}`;
        document.getElementById('hero-modal-role').textContent = Utils.getText(`hero.role${heroData.role.charAt(0).toUpperCase() + heroData.role.slice(1)}`);
        document.getElementById('hero-modal-element-icon').src = `assets/elements/${heroData.element}_icon.png`;
        document.getElementById('hero-modal-role-icon').src = `assets/roles/${heroData.role}_icon.png`;
        
        const rangeEl = document.getElementById('hero-modal-range');
        if (heroData.range) {
            let rangeText = Array.isArray(heroData.range)
                ? heroData.range.map(r => Utils.getText(`hero.range${r.charAt(0).toUpperCase() + r.slice(1)}`)).join(' / ')
                : Utils.getText(`hero.range${heroData.range.charAt(0).toUpperCase() + heroData.range.slice(1)}`);
            rangeEl.textContent = rangeText;
        } else {
            rangeEl.textContent = '';
        }

        const distanceEl = document.getElementById('hero-modal-distance');
        if (heroData.attack_distance) {
            const distanceText = Utils.getText(`hero.attackDistance${heroData.attack_distance.charAt(0).toUpperCase() + heroData.attack_distance.slice(1)}`);
            distanceEl.textContent = distanceText;
        } else {
            distanceEl.textContent = '';
        }
        
        App.dom.heroModalOverlay.classList.add('visible');
    },

    closeHeroModal: function() {
        App.dom.heroModalOverlay.classList.remove('visible');
        App.state.heroModalContext = { heroes: [], currentIndex: -1 };
    },

    navigateHeroModal: function(instruction) {
        const context = App.state.heroModalContext;
        if (!context.heroes || context.heroes.length <= 1) return;

        let newIndex;
        if (typeof instruction === 'string') {
            const direction = instruction === 'next' ? 1 : -1;
            newIndex = (context.currentIndex + direction + context.heroes.length) % context.heroes.length;
        } else if (typeof instruction === 'number') {
            newIndex = instruction;
        } else {
            return;
        }
        
        if (newIndex === context.currentIndex) return;
        
        const nextHeroContext = context.heroes[newIndex];
        const nextHeroData = Logic.findHeroByName(nextHeroContext.name);

        if (nextHeroData) {
            this.openHeroModal(nextHeroData, context.heroes, newIndex);
        }
    },

    /**
     * Abre el modal que indica al usuario que necesita iniciar sesión.
     */
    openLoginRequiredModal: function() {
        // Aplica traducciones
        const modalOverlay = document.getElementById('login-required-modal-overlay');
        if (modalOverlay) {
            modalOverlay.querySelectorAll('[data-lang-key]').forEach(el => {
                const key = el.dataset.langKey;
                const text = Utils.getText(key);
                if (text && text !== key) {
                    el.innerHTML = text;
                }
            });
            modalOverlay.classList.add('visible');
        }
    },

    /**
     * Cierra el modal de "requiere inicio de sesión".
     */
    closeLoginRequiredModal: function() {
        const modalOverlay = document.getElementById('login-required-modal-overlay');
        if (modalOverlay) {
            modalOverlay.classList.remove('visible');
        }
    },

    updateLoginStatus: function () {
        const userStatusDiv = App.dom.userStatus;
        if (!userStatusDiv) return;
        
        const settingsIconSVG = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.438.995s.145.755.438.995l1.003.827c.48.398.668 1.05.26 1.431l-1.296 2.247a1.125 1.125 0 01-1.37.49l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.063-.374-.313-.686-.645-.87a6.52 6.52 0 01-.22-.127c-.324-.196-.72-.257-1.075-.124l-1.217.456a1.125 1.125 0 01-1.37-.49l-1.296-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.437-.995s-.145-.755-.437-.995l-1.004-.827a1.125 1.125 0 01-.26-1.431l1.296-2.247a1.125 1.125 0 011.37.49l1.217.456c.355.133.75.072 1.076.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.213-1.28z" /><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>`;
        const powerIconSVG = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M5.636 5.636a9 9 0 1012.728 0M12 3v9" /></svg>`;
        
        let userInfoHTML = '';
        let actionButtonHTML = '';

        if (App.state.isLoggedIn && App.state.userInfo) {
            // --- LÓGICA PARA USUARIO LOGUEADO ---
            const { global_name, avatarUrl } = App.state.userInfo;
            userInfoHTML = `
                <div class="user-info-static">
                    <img src="${avatarUrl}" alt="User Avatar" class="user-avatar">
                    <p class="user-name">${global_name || 'User'}</p>
                </div>
            `;
            // Se genera el botón de LOGOUT
            actionButtonHTML = `
                <button id="logout-btn" class="user-action-btn logout-icon" title="${Utils.getText('common.logout')}">${powerIconSVG}</button>
            `;
        } else {
            // --- LÓGICA PARA INVITADO ---
            userInfoHTML = `
                <div class="user-info-static">
                    <img src="assets/wimp_default.jpg" alt="Guest Avatar" class="user-avatar">
                    <p class="user-name guest" data-lang-key="common.guest"></p>
                </div>
            `;
            // Se genera el botón de LOGIN
            actionButtonHTML = `
                <button id="login-btn" class="user-action-btn login-icon" title="${Utils.getText('common.login')}">${powerIconSVG}</button>
            `;
        }

        // Se construye el HTML completo
        userStatusDiv.innerHTML = `
            ${userInfoHTML}
            <div class="user-widget-divider"></div>
            <button id="user-settings-btn" class="user-action-btn settings-icon" title="${Utils.getText('settings.title')}">${settingsIconSVG}</button>
            ${actionButtonHTML}
        `;
        
        // Se añaden los listeners a los botones que ACABAMOS de crear
        document.getElementById('user-settings-btn').addEventListener('click', () => this.openAccountModal());
        
        if (App.state.isLoggedIn) {
            document.getElementById('logout-btn').addEventListener('click', () => Logic.logout());
        } else {
            document.getElementById('login-btn').addEventListener('click', () => Logic.redirectToDiscordLogin());
        }

        this.applyLanguage();
    },

    
    updateLanguage: function() {
    // Esta función ahora solo actualiza elementos dinámicos que no dependen de un cambio de idioma
    // explícito del usuario, como el estado de los permisos de notificación.
    const p = Notification.permission;
    const statusBarSpan = App.dom.statusBar.querySelector('span');
    
    // Usamos una comprobación para no causar un error si el span no existe
    if (!statusBarSpan) return;

    if (p === "granted") {
        statusBarSpan.textContent = Utils.getText('notifications.alertsEnabled');
        statusBarSpan.style.color = 'var(--color-success)';
    } else if (p === "denied") {
        statusBarSpan.textContent = Utils.getText('notifications.alertsDisabled');
        statusBarSpan.style.color = 'var(--color-danger)';
    } else {
        statusBarSpan.textContent = Utils.getText('settings.permissionRequired');
        statusBarSpan.style.color = 'var(--color-warning)';
    }
},

    /**
     * Aplica las traducciones a todos los elementos estáticos de la UI.
     * Esta función debe ser llamada solo cuando el idioma cambia.
     */
    applyLanguage: function () {
        if (!App.state.i18n || Object.keys(App.state.i18n).length === 0) return;

        document.title = Utils.getText('common.title');
        document.documentElement.lang = App.state.config.language;

        document.querySelectorAll('[data-lang-key]').forEach(el => {
            const key = el.dataset.langKey;
            const text = Utils.getText(key);
            if (text !== key) el.textContent = text;
        });

        // Actualiza los paneles abiertos si los hay
        if (App.state.currentOpenEventId) {
            this.openEventDetailsPanel(App.state.currentOpenEventId);
        }
        if (App.state.currentOpenWeeklyId) {
        // Comprobamos si el ID corresponde a un Héroe de la Semana
        const isHeroOfTheWeek = App.state.allHeroWeekData.some(e => e.id === App.state.currentOpenWeeklyId);
        
        if (isHeroOfTheWeek) {
            this.openHeroOfTheWeekDetailsPanel(App.state.currentOpenWeeklyId);
        } else {
            this.openWeeklyDetailsPanel(App.state.currentOpenWeeklyId);
        }
    }
    },
    
    populateSelects: function() {
        // Llenar selector de zona horaria
        for (let i = 14; i >= -12; i--) {
            const offset = `${i >= 0 ? '+' : '-'}${String(Math.abs(i)).padStart(2, '0')}:00`;
            App.dom.timezoneSelect.add(new Option(`UTC ${offset}`, offset));
        }
        // Llenar selector de idioma
        App.dom.languageSelect.innerHTML = `<option value="es">Español</option><option value="en">English</option>`;
    }
};

export default UI;