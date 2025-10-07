'use strict';

/**
 * Módulo para gestionar todas las actualizaciones de la interfaz de usuario (UI).
 * Se encarga de renderizar componentes, gestionar modales y actualizar textos.
 */
const UI = {

    /**
     * Función principal que orquesta todas las actualizaciones de la UI en cada ciclo.
     */
    updateAll: function() {
        const now = Logic.getCorrectedNow(); // <-- CAMBIO CLAVE
        const config = App.state.config;
    
        this.updateLanguage();
        App.dom.timeFormatSwitch.checked = config.use24HourFormat;
    
        const currentDateString = Utils.formatDateToLocaleDateString(now, config.displayTimezone, config.currentLanguage);
        const currentTimeString = Utils.formatDateToTimezoneString(now, config.displayTimezone, config.use24HourFormat, true);
        
        const tzString = `UTC${config.displayTimezone.replace(':00', '')}`;
        App.dom.currentTime.innerHTML = `<div class="datetime-stack"><span>${currentDateString}</span><span>${currentTimeString}</span></div><span class="timezone-abbr">${tzString}</span>`;
    
        Logic.checkAndPerformDailyReset(now);
        const dailyResetTimer = Logic.getDailyResetTimer(now);
        const lastReset = new Date(dailyResetTimer.targetDate.getTime() - (24 * 60 * 60 * 1000));
        const showdownTicketTimer = Logic.getShowdownTicketTimer(now, lastReset);
        
        const showSecondaryPanel = config.showBossTimers || config.showEvents || config.showWeekly;
    
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
                if (secondarySlide) {
                    secondarySlide.style.display = showSecondaryPanel ? 'block' : 'none';
                }
            }

            if (App.state.swiper && App.state.swiper.update) {
                App.state.swiper.update();
            }
        }
        App.dom.bannersContainer.style.opacity = '1';
        App.dom.bannersContainer.style.visibility = 'visible';      
        
        this.renderBannersPanel();
    
        if (config.showEvents) {
            App.dom.eventsContainer.innerHTML = this.renderEventsPanel();
            App.dom.eventsContainer.style.display = 'block';
        } else {
            App.dom.eventsContainer.innerHTML = '';
            App.dom.eventsContainer.style.display = 'none';
            this.closeEventDetailsPanel();
        }

        if (config.showWeekly) {
            App.dom.weeklyContainer.innerHTML = this.renderWeeklyPanel();
            App.dom.weeklyContainer.style.display = 'block';
        }
        else {
            App.dom.weeklyContainer.innerHTML = '';
            App.dom.weeklyContainer.style.display = 'none';
            this.closeWeeklyDetailsPanel();
        }
        
        const primaryTimers = [dailyResetTimer];
        let bossTimers = [];
        let secondaryTimers = [];
    
        if (config.showBossTimers) {
             bossTimers = Logic.getBossTimers(now);
            const nextActiveBoss = bossTimers.filter(s => s.isAlertEnabled && s.secondsLeft >= 0).sort((a, b) => a.secondsLeft - b.secondsLeft)[0];
            if (nextActiveBoss) {
                primaryTimers.push(nextActiveBoss);
            }
            
            secondaryTimers.push(showdownTicketTimer);
            secondaryTimers.push(...bossTimers);
        } else {
            primaryTimers.push(showdownTicketTimer);
        }
    
        this.renderPrimaryPanel(primaryTimers);
        App.dom.timersContainer.innerHTML = this.renderSecondaryTimers(secondaryTimers);
    
        Logic.checkAndTriggerAlerts(now, bossTimers, dailyResetTimer, showdownTicketTimer);

        this.updateStreamsFeature();
    },

    /**
     * Renderiza el panel principal con los timers más importantes.
     * @param {Array<object>} timers - Un array de objetos de timer a mostrar.
     */
    renderPrimaryPanel: function(timers) {
        const config = App.state.config;
        const infoIconSVG = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" /></svg>`;
        const syncIconSVG = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125" /></svg>`;
        App.dom.primaryTimersContainer.innerHTML = timers.map((timer, index) => {
            const itemClass = index === 0 ? 'main' : 'secondary';
            const color = Utils.getCountdownColor(timer.secondsLeft, timer.type, config);
            const countdown = Utils.formatTime(timer.secondsLeft);
            const description = timer.type === 'boss' ? I18N_STRINGS[config.currentLanguage].bossSpawnIn(timer.location) : timer.description;
            const imageDivClass = timer.type === 'ticket' ? 'ticket-image' : 'timer-image';
            let imageContent = timer.type === 'ticket' ? `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-9-1.5h5.25m-5.25 0h5.25m-5.25 0h5.25m-5.25 0h5.25M3 4.5h15a2.25 2.25 0 012.25 2.25v10.5a2.25 2.25 0 01-2.25 2.25H3a2.25 2.25 0 01-2.25-2.25V6.75A2.25 2.25 0 013 4.5z" /></svg>` : (timer.imageUrl ? `<img src="${timer.imageUrl}" alt="${timer.name}">` : '');
            const nameClass = `timer-name ${timer.type === 'boss' ? 'timer-name-boss' : timer.type === 'ticket' ? 'timer-name-ticket' : ''}`;
            
            const displayTime = Utils.formatDateToTimezoneString(timer.targetDate, config.displayTimezone, config.use24HourFormat);
            const timeSpan = timer.type !== 'ticket' ? `<span class="timer-target-time">(${displayTime})</span>` : '';
            const nameItself = `<p class="${nameClass}">${timer.name} ${timeSpan}</p>`;
            
            const nameContent = timer.type === 'ticket'
                ? `<div class="timer-name-container"><p class="${nameClass}">${timer.name}</p><div class="info-button">${infoIconSVG}</div></div>`
                : nameItself;

            const countdownContent = timer.type === 'ticket' ? `<div class="timer-countdown-container"><p class="timer-countdown" style="color: ${color};">${countdown}</p><div class="sync-button">${syncIconSVG}</div></div>` : `<p class="timer-countdown" style="color: ${color};">${countdown}</p>`;
            return `<div class="primary-timer-item ${itemClass}"><div class="${imageDivClass}">${imageContent}</div>${nameContent}<p class="timer-desc">${description}</p>${countdownContent}</div>`;
        }).join('');
    },

    /**
     * Renderiza la lista de timers secundarios.
     * @param {Array<object>} timers - Un array de objetos de timer a mostrar.
     */
    renderSecondaryTimers: function(timers) {
        if (!timers || timers.length === 0) return '';
        const config = App.state.config;
        return timers.map(timer => {
            const color = Utils.getCountdownColor(timer.secondsLeft, timer.type, config); 
            const time = Utils.formatTime(timer.secondsLeft); 
            const displayTime = Utils.formatDateToTimezoneString(timer.targetDate, config.displayTimezone, config.use24HourFormat);
            if (timer.type === 'boss') {
                const tzString = `UTC${config.displayTimezone.replace(':00', '')}`;
                const bellIcon = timer.isAlertEnabled ? `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" /></svg>` : `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0M3.17 3.17l17.66 17.66" /></svg>`;
                const bossIcon = `<div class="spawn-item-icon"><img src="${timer.imageUrl}" alt="${timer.name}"></div>`;
                let eventTip = '';
                if (timer.id === "stalker_jiangshi" && Logic.isEventActive("Field Boss Challenge")) {
                    eventTip = `<span class="event-tip">${I18N_STRINGS[config.currentLanguage].eventTip}</span>`;
                }
                return `<div class="spawn-item ${!timer.isAlertEnabled ? 'disabled' : ''}">${bossIcon}<div class="spawn-item-info"><p class="spawn-item-name spawn-item-name-boss">${timer.name}</p><p class="spawn-item-time">${displayTime} (${tzString}) ${eventTip}</p></div><span class="countdown-timer" style="color: ${color};">${time}</span><div class="alert-toggle ${timer.isAlertEnabled ? 'enabled' : 'disabled'}" data-boss-id="${timer.id}" data-time="${timer.time}">${bellIcon}</div></div>`;
            }
            const icon = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-9-1.5h5.25m-5.25 0h5.25m-5.25 0h5.25m-5.25 0h5.25M3 4.5h15a2.25 2.25 0 012.25 2.25v10.5a2.25 2.25 0 01-2.25 2.25H3a2.25 2.25 0 01-2.25-2.25V6.75A2.25 2.25 0 013 4.5z" /></svg>`; const infoIconSVG = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" /></svg>`; const syncIconSVG = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125" /></svg>`; const nameContent = `<div class="spawn-item-name-container"><p class="spawn-item-name spawn-item-name-ticket">${timer.name}</p><div class="info-button">${infoIconSVG}</div></div>`; const countdownContent = `<div class="countdown-container"><span class="countdown-timer" style="color: ${color};">${time}</span><div class="sync-button">${syncIconSVG}</div></div>`; return `<div class="spawn-item ticket-item"><div class="item-icon">${icon}</div><div class="spawn-item-info">${nameContent}<p class="spawn-item-time">${timer.description}</p></div>${countdownContent}</div>`;
        }).join('');
    },
    
    /**
     * Renderiza el panel de eventos activos.
     * @returns {string} El HTML para el panel de eventos.
     */
    renderEventsPanel: function() {
        const config = App.state.config;
        const lang = I18N_STRINGS[config.currentLanguage];
        const now = new Date();
        let html = `<h3 class="panel-subtitle">${lang.eventsTitle}</h3>`;
        let activeEventCount = 0;
        
        config.events.forEach(event => {
            const endDate = Logic.getAbsoluteDateWithCustomDate(event.endDate, config.dailyResetTime);
            if (now > endDate) return;
            
            activeEventCount++;
            const secondsLeft = Math.floor((endDate.getTime() - now.getTime()) / 1000);
            let countdownText;

            if (secondsLeft > 0) {
                const timeString = Utils.formatTimeWithDays(secondsLeft, true);
                countdownText = lang.eventEndsIn(timeString);
            } else {
                countdownText = lang.eventEndsToday;
            }

            html += `
                <div class="event-item" data-event-id="${event.id}">
                    <span class="event-name">${event.name[config.currentLanguage]}</span>
                    <span class="event-countdown">${countdownText}</span>
                </div>
            `;
        });
        
        if (activeEventCount === 0) {
            this.closeEventDetailsPanel();
            return '';
        }
        
        return html;
    },

    /**
     * Renderiza el panel de reinicios semanales.
     * @returns {string} El HTML para el panel de reinicios semanales.
     */
    renderWeeklyPanel: function() {
        const lang = I18N_STRINGS[App.state.config.currentLanguage];
        const now = new Date();
        const weeklyTimers = Logic.getWeeklyResetTimers(now);

        if (weeklyTimers.length === 0) {
            return '';
        }

        let html = `<h3 class="panel-subtitle">${lang.weeklyTitle}</h3>`;

        weeklyTimers.forEach(timer => {
            const timeString = Utils.formatTimeWithDays(timer.secondsLeft, true);
            const countdownText = lang.weeklyResetsIn(timeString);
            html += `
                <div class="weekly-item" data-weekly-id="${timer.id}">
                    <div class="weekly-item-info">
                        <span class="weekly-name">${timer.name}</span>
                        <span class="weekly-category">${timer.category}</span>
                    </div>
                    <span class="weekly-countdown">${countdownText}</span>
                </div>
            `;
        });

        return html;
    },

    /**
     * Renderiza el panel de banners (activos y próximos).
     */
    renderBannersPanel: function() {
        const config = App.state.config;
        const lang = I18N_STRINGS[config.currentLanguage];
        const now = new Date();

        const activeBanner = config.banner.find(b => {
            if (!b.startDate || !b.endDate) return false;
            const start = Logic.getAbsoluteDateWithCustomDate(b.startDate, config.dailyResetTime);
            const end = Logic.getAbsoluteDateWithCustomDate(b.endDate, config.dailyResetTime);
            return now >= start && now <= end;
        });

        const futureBanners = config.banner.filter(b => b.startDate && Logic.getAbsoluteDateWithCustomDate(b.startDate, config.dailyResetTime) > now).sort((a,b) => new Date(a.startDate) - new Date(b.startDate));
        const nextBanner = futureBanners[0];
        
        const createBannerHTML = (banner, type) => {
            const title = type === 'active' ? lang.activeBannersTitle : lang.nextBannerTitle;
            let countdownHTML = '';
            
            if (banner && ( (type === 'active' && banner.endDate) || (type === 'next' && banner.startDate) )) {
                const targetDate = type === 'active' 
                    ? Logic.getAbsoluteDateWithCustomDate(banner.endDate, config.dailyResetTime)
                    : Logic.getAbsoluteDateWithCustomDate(banner.startDate, config.dailyResetTime);

                const secondsLeft = Math.floor((targetDate - now) / 1000);
                
                if (secondsLeft > 0) {
                    const timeString = Utils.formatTimeWithDays(secondsLeft, true);
                    const label = type === 'active' ? lang.bannerEndsIn(timeString) : lang.bannerStartsIn(timeString);
                    countdownHTML = `<span class="banner-countdown">${label}</span>`;
                }
            }

            let content;
            if (!banner || !banner.heroes) {
                content = `<div class="banner-box"><div class="empty-banner">${lang.notAnnounced}</div></div>`;
            } else {
                const heroNames = banner.heroes.split(',').map(name => name.trim());
                const isSingleExalted = heroNames.length === 1 && Logic.findHeroByName(heroNames[0])?.rarity === 1;

                const heroImagesHtml = heroNames.map(name => {
                    const heroData = Logic.findHeroByName(name);
                    if (heroData) {
                        const shortImg = `assets/heroes_icon/${heroData.short_image}`;
                        const roleIcon = heroData.role ? `<div class="hero-role-icon element-${heroData.element || 'default'}"><img class="role-icon" src="assets/roles/${heroData.role}_icon.png" alt="${heroData.role}"></div>` : '';
                        const featuredClass = isSingleExalted ? 'featured' : '';

                        return `
                            <div class="banner-hero-wrapper">
                                <div class="banner-hero-img-container" data-hero-name="${heroData.game_name}">
                                    <div class="banner-hero-img rarity-${heroData.rarity} ${featuredClass}">
                                        <img src="${shortImg}" alt="${heroData.game_name}">
                                    </div>
                                    ${roleIcon}
                                </div>
                                <span class="banner-hero-name">${heroData.game_name}</span>
                            </div>
                        `;
                    }
                    return '';
                }).join('');
                const backgroundClass = banner.element ? `banner-bg-${banner.element}` : '';
                content = `<div class="banner-box ${backgroundClass}"><div class="banner-heroes">${heroImagesHtml}</div></div>`;
            }
            
            return `
                <div class="banner-section">
                    <div class="banner-header">
                        <h4 class="panel-subtitle-small">${title}</h4>
                        ${countdownHTML}
                    </div>
                    ${content}
                </div>
            `;
        };
        
        let html = createBannerHTML(activeBanner, 'active');
        html += createBannerHTML(nextBanner, 'next');
        
        App.dom.bannersContainer.innerHTML = html;
    },
    
    /**
     * Renderiza el widget flotante del próximo stream.
     */
    updateStreamsFeature: function() {
        const config = App.state.config;
        const now = new Date();

        if (!config.streams || config.streams.length === 0) {
            App.dom.twitchFab.classList.remove('visible', 'alert-active', 'live-active');
            return;
        }

        const upcomingStreams = config.streams
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

    /**
     * Genera el HTML para el contenido del modal de streams.
     * @param {Array} streams - La lista de streams a mostrar.
     * @param {Date} now - La fecha y hora actual.
     */
    renderStreamsModal: function(streams, now) {
        const lang = I18N_STRINGS[App.state.config.currentLanguage];

        if (streams.length === 0) {
            App.dom.streamsModalContent.innerHTML = `<p class="no-streams-message">${lang.noStreamsMessage}</p>`;
            return;
        }

        const streamAlertConfig = App.state.config.streamAlerts;
        App.dom.preStreamAlertToggle.checked = streamAlertConfig.preStream;
        App.dom.postStreamAlertToggle.checked = streamAlertConfig.postStream;

        const contentHTML = streams.map(stream => {
            const secondsLeft = Math.floor((stream.date.getTime() - now.getTime()) / 1000);
            let countdownHTML;

            if (secondsLeft <= 0) {
                countdownHTML = `<p class="stream-is-live">${lang.streamIsLive}</p>`;
            } else {
                countdownHTML = `<p class="stream-countdown">${Utils.formatTime(secondsLeft)}</p>`;
            }

            return `
                <div class="modal-stream-item">
                    <a href="https://twitch.tv/${stream.twitchChannel}" 
                       target="_blank" rel="noopener noreferrer" 
                       class="stream-image-link">
                       <img src="${stream.imageUrl}" alt="${stream.name}" class="stream-thumbnail">
                    </a>
                    <p class="streamer-name">${stream.name}</p>
                    ${countdownHTML}
                </div>
            `;
        }).join('');

        App.dom.streamsModalContent.innerHTML = contentHTML;
    },

    /**
     * Abre y rellena el panel de detalles de un evento.
     * @param {string} eventId - El ID del evento a mostrar.
     */
    openEventDetailsPanel: function(eventId) {
        this.closeWeeklyDetailsPanel();
        const lang = App.state.config.currentLanguage;
        const langData = I18N_STRINGS[lang];
        const eventData = App.state.allEventsData.events[eventId];
        
        if (!eventData) {
            console.error(`Event data not found for ID: ${eventId}`);
            return;
        }

        const eventConfig = App.state.config.events.find(e => e.id === eventId);
        let periodString = '';
        if (eventConfig) {
            const { DateTime } = luxon;
            const { startDate, endDate } = eventConfig;
            const time = App.state.config.dailyResetTime;
            const refTz = App.state.config.referenceTimezone;

            const startDt = DateTime.fromISO(startDate).setLocale(lang);
            const endDt = DateTime.fromISO(endDate).setLocale(lang);

            const datePart = `${startDt.toFormat('d MMMM')} - ${endDt.toFormat('d MMMM')}`;

            const timeObj = DateTime.fromISO(`2000-01-01T${time}`);
            const formattedTime = timeObj.toFormat('h:mm a');

            const refTzOffset = DateTime.now().setZone(refTz).toFormat('ZZ');
            const refTzAbbr = `(UTC${refTzOffset.replace(':00','')})`;

            periodString = `${datePart}, ${formattedTime} ${refTzAbbr}`;
        }

        const getRarityClass = (rank) => rank ? `rarity-text-${rank.toLowerCase()}` : 'rarity-text-common';

        const getItemGridDisplay = (itemId, quantity, rank = '', probability = null) => {
            const itemDef = App.state.allEventsData.itemDefinitions[itemId];
            if (!itemDef || !itemDef.icon) return '';
            const name = itemDef.name[lang] || itemId;
            const sizeClass = itemDef.size === 'double' ? 'double-width' : '';
            const rankClass = rank ? ` rank-${rank.toLowerCase()}` : ' rank-common';
            let probabilityHTML = (probability !== null && !isNaN(probability)) ? `<span class="reward-probability">${probability.toFixed(1)}%</span>` : '';
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
                const itemDef = App.state.allEventsData.itemDefinitions[r.itemId];
                if (!itemDef) return;
                const name = itemDef.name[lang] || r.itemId;
                const rarityClass = getRarityClass(r.rank);
                let probClass = 'prob-common';
                if (r.probability !== null) {
                    if (r.probability <= 1) probClass = 'prob-legendary';
                    else if (r.probability <= 5) probClass = 'prob-epic';
                    else if (r.probability <= 20) probClass = 'prob-rare';
                    else if (r.probability <= 50) probClass = 'prob-uncommon';
                }
                const probText = r.probability !== null ? `${r.probability.toFixed(1)}%` : '';
                listHTML += `<li class="details-reward-list-item">
                                <span class="reward-name-part ${rarityClass}">${name}</span>
                                <span class="reward-quantity-part">x${r.quantity}</span>
                                <span class="reward-prob-part ${probClass}">${probText}</span>
                             </li>`;
            });
            return listHTML + '</ul>';
        };
        
        const getMinimalistRewardHTML = (itemId, quantity, rank) => {
            const itemDef = App.state.allEventsData.itemDefinitions[itemId];
            if (!itemDef) return `<span>${itemId} x${quantity}</span>`;
            const name = itemDef.name[lang] || itemId;
            const icon = itemDef.icon ? `<img src="assets/items/${itemDef.icon}.png" class="minimalist-reward-icon">` : '';
            const rarityClass = getRarityClass(rank);
            return `<div class="minimalist-reward-item">
                        ${icon}
                        <span class="minimalist-reward-name ${rarityClass}">${name} x${quantity}</span>
                    </div>`;
        };

        let contentHTML = `
            <div class="details-header">
                <div class="close-details-btn"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" width="24" height="24"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg></div>
                <h2>${eventData.name[lang]}</h2>
                <p>${periodString}</p>
            </div>
            <div class="details-content">
                <p class="details-summary">${eventData.summary[lang]}</p>
        `;

        if (eventData.missions) {
            contentHTML += `<div class="details-section"><h3>${langData.eventMissionsTitle}</h3><table class="details-table missions-table"><tbody>`;
            eventData.missions.forEach(m => {
                contentHTML += `<tr><td>${m.description[lang]}</td><td>+${m.points} ${langData.pointsSuffix}</td></tr>`;
            });
            contentHTML += `</tbody></table></div>`;
        }

        if (eventData.missions_and_rewards) {
             contentHTML += `<div class="details-section"><h3>${langData.eventMissionsAndRewardsTitle}</h3><div class="details-reward-grid-container">`;
             eventData.missions_and_rewards.forEach(m => {
                const iconGrid = getItemGridDisplay(m.itemId, m.quantity, m.rank);
                contentHTML += `<div class="details-reward-column"><span class="details-reward-label">${m.mission[lang]}</span>${iconGrid}</div>`;
             });
             contentHTML += `</div></div>`;
        }
        
        if (eventData.boss_details && eventData.boss_details.ranking_rewards) {
            contentHTML += `<div class="details-section"><h3>${langData.eventBossRankingRewardsTitle}</h3>`;
            const participation = eventData.boss_details.ranking_rewards.base_on_participation;
            if (participation) {
                const rewardsGrid = participation.rewards.map(rew => getItemGridDisplay(rew.itemId, rew.quantity, rew.rank || 'Common')).join('');
                contentHTML += `<div class="participation-reward">
                                    <div class="reward-grid">${rewardsGrid}</div>
                                    <div class="participation-reward-text"><strong>${langData.eventParticipationRewardTitle}</strong><span>${participation.description[lang]}</span></div>
                                </div>`;
            }
            const ranking = eventData.boss_details.ranking_rewards.bonus_by_rank;
            if (ranking) {
                contentHTML += `<div class="details-reward-grid-container">`;
                ranking.forEach(r => {
                    const iconGrid = r.rewards.map(rew => getItemGridDisplay(rew.itemId, rew.quantity, rew.rank || 'Common')).join('');
                    contentHTML += `<div class="details-reward-column">
                                      <span class="details-reward-label">${r.tier_name[lang]}</span>
                                      <div class="reward-grid">${iconGrid}</div>
                                    </div>`;
                });
                contentHTML += `</div>`;
            }
            contentHTML += `</div>`;
        }
        
        if (eventData.rewards && eventData.rewards.wheel_of_fate) {
            contentHTML += `<div class="details-section"><h3>${langData.eventWheelRewardsTitle}</h3>`;
            const rewards = eventData.rewards.wheel_of_fate;
            const iconGrid = rewards.map(r => getItemGridDisplay(r.itemId, r.quantity, r.rank, r.probability)).join('');
            contentHTML += `<div class="reward-grid">${iconGrid}</div>`;
            contentHTML += generateRewardTextList(rewards);
            contentHTML += `</div>`;
        }

         if (eventData.rewards && eventData.rewards.cumulative_spins) {
            contentHTML += `<div class="details-section"><h3>${langData.eventCumulativeRewardsTitle}</h3>`;
            contentHTML += `<div class="details-reward-grid-container">`;
            eventData.rewards.cumulative_spins.forEach(r => {
                const iconGrid = getItemGridDisplay(r.itemId, r.quantity, r.rank);
                contentHTML += `<div class="details-reward-column">
                                  <span class="details-reward-label">${r.condition[lang]}</span>
                                  ${iconGrid}
                                </div>`;
            });
            contentHTML += `</div></div>`;
        }

        if (eventData.rewards && eventData.rewards.reward_pool) {
            contentHTML += `<div class="details-section"><h3>${langData.eventPossibleRewardsTitle}</h3>`;
            const rewards = eventData.rewards.reward_pool;
            const iconGrid = rewards.map(r => getItemGridDisplay(r.itemId, r.quantity, r.rank, r.probability)).join('');
            contentHTML += `<div class="reward-grid">${iconGrid}</div>`;
            contentHTML += generateRewardTextList(rewards);
            contentHTML += `</div>`;
        }

        contentHTML += `</div>`;
        App.dom.eventDetailsPanel.innerHTML = contentHTML;
        App.dom.eventDetailsPanel.classList.add('visible');
        App.dom.eventDetailsPanel.dataset.renderedLang = lang;
        App.state.currentOpenEventId = eventId;
        if (App.state.isMobile) {
            document.body.classList.add('no-scroll');
        }
    },
    
    /** Cierra el panel de detalles del evento. */
    closeEventDetailsPanel: function() {
        App.dom.eventDetailsPanel.classList.remove('visible');
        App.state.currentOpenEventId = null;
        if (App.state.isMobile) {
            document.body.classList.remove('no-scroll');
        }
    },

    /**
     * Abre y rellena el panel de detalles de un evento semanal.
     * @param {string} weeklyId - El ID del evento semanal a mostrar.
     */
    openWeeklyDetailsPanel: function(weeklyId) {
        this.closeEventDetailsPanel();
        const lang = App.state.config.currentLanguage;
        const langData = I18N_STRINGS[lang];
        const weeklyData = App.state.weeklyResetsData;
        const eventData = weeklyData.events.find(e => e.id === weeklyId);
        
        if (!eventData) {
            console.error(`Weekly event data not found for ID: ${weeklyId}`);
            return;
        }

        const getRarityClass = (rank) => rank ? `rarity-text-${rank.toLowerCase()}` : 'rarity-text-common';

        const getWeeklyItemGridDisplay = (itemId, quantity, rank = 'Common') => {
            const itemDef = weeklyData.itemDefinitions[itemId];
            if (!itemDef || !itemDef.icon) return '';
            const name = itemDef.name[lang] || itemId;
            const rankClass = `rank-${rank.toLowerCase()}`;
            const sizeClass = itemDef.size === 'double' ? 'double-width' : '';
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
            contentHTML += `<div class="details-section"><h3>${langData.weeklySeasonBuffsTitle}</h3>`;
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
            contentHTML += `<div class="details-section"><h3>${langData.weeklyChosenBuffsTitle}</h3>`;
            eventData.chosenBuffs.forEach((buff, index) => {
                contentHTML += `<div class="weekly-buff-item">
                                  <img src="assets/spells_icons/${buff.icon}.png">
                                  <div><strong>${buff.name[lang]}</strong><p>${buff.description[lang]}</p></div>
                                </div>`;
                if (index < eventData.chosenBuffs.length - 1) contentHTML += '<hr class="weekly-buff-separator">';
            });
            contentHTML += `</div>`;
        }

        if (eventData.stages) {
            contentHTML += `<div class="details-section"><h3>${langData.weeklyStagesTitle}</h3>`;
            if (eventData.stages[0].recommendedHeroes) {
                contentHTML += `<div class="weekly-recommendation-box"><p>${eventData.stages[0].recommendedHeroes.description[lang]}</p></div>`;
            }
            eventData.stages.forEach((stage, index) => {
                const elementalIcons = stage.elementalWeakness.map(el => `<img src="assets/elements/${el.toLowerCase()}_icon.png" class="weekly-element-icon" alt="${el}">`).join('');
                contentHTML += `<div class="weekly-stage-item">
                                    <h4 class="weekly-stage-title">${stage.stageName[lang]}</h4>
                                    <div class="weekly-stage-info-grid">
                                        <div class="weekly-stage-info-item"><span class="weekly-stage-info-label">${langData.weeklyCombatPower}</span><div class="weekly-stage-info-value"><img src="assets/combat_power.png" class="weekly-combat-power-icon" /> ${stage.recommendedPower}</div></div>
                                        <div class="weekly-stage-info-item"><span class="weekly-stage-info-label">${langData.weeklyTimeLimit}</span><div class="weekly-stage-info-value">🕒 ${stage.timeLimit[lang]}</div></div>
                                        <div class="weekly-stage-info-item"><span class="weekly-stage-info-label">${langData.weeklyWeakness}</span><div class="weekly-stage-info-value weekly-elemental-weakness">${elementalIcons}</div></div>
                                    </div>
                                    <div class="weekly-stage-rewards">`;
                stage.completionRewards.forEach(rewardTier => {
                    const rewardsGrid = rewardTier.rewards.map(r => getWeeklyItemGridDisplay(r.itemId, r.quantity, r.rank)).join('');
                    contentHTML += `<div class="weekly-reward-tier"><p><strong class="rarity-text-rare">${langData.eventRankHeader} ${rewardTier.stageLevel}:</strong></p><div class="weekly-reward-grid">${rewardsGrid}</div></div>`;
                });
                contentHTML += `</div></div>`;
                if (index < eventData.stages.length - 1) contentHTML += '<hr class="weekly-buff-separator">';
            });
            contentHTML += `</div>`;
        }

        if (eventData.currentBoss) {
            const boss = eventData.currentBoss;
            contentHTML += `<div class="details-section"><h3>${langData.weeklyBossInfoTitle}</h3>
                <div class="weekly-boss-info-header">
                    <img src="assets/enemies_icon/${boss.enemyIcon}.png" alt="${boss.name[lang]}">
                    <div class="boss-info-details"><h4>${boss.name[lang]}</h4><div class="weekly-stage-info-grid"><div class="weekly-stage-info-item"><span class="weekly-stage-info-label">${langData.weeklyTimeLimit}</span><div class="weekly-stage-info-value">🕒 ${boss.turnLimit} Turns</div></div></div></div>
                </div>
                <p class="details-summary">${boss.description[lang]}</p>
            </div>`;
            
            if (boss.recommendedHeroes && boss.recommendedHeroes.description) {
                contentHTML += `<div class="details-section weekly-recommended-heroes"><h3>${langData.weeklyRecommendedHeroes}</h3><div class="weekly-recommendation-box"><p>${boss.recommendedHeroes.description[lang]}</p></div>`;
                if (boss.recommendedHeroes.heroesByTag) {
                    boss.recommendedHeroes.heroesByTag.forEach(tagGroup => {
                        contentHTML += `<div class="weekly-recommended-heroes-tag-group"><h5 class="weekly-recommended-heroes-tag">#${tagGroup.tag[lang]}</h5><div class="banner-heroes">`;
                        tagGroup.heroList.forEach(hero => {
                            const heroData = Logic.findHeroByName(hero.name);
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
                contentHTML += `<div class="details-section"><h3>${langData.weeklyModifiersTitle}</h3>`;
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
                contentHTML += `<div class="details-section"><h3>${langData.weeklyScoreRewardsTitle}</h3><div class="weekly-score-rewards-grid">`;
                boss.scoreRewards.forEach(tier => {
                    const rewardItem = tier.rewards[0];
                    const itemDef = weeklyData.itemDefinitions[rewardItem.itemId];
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

            if (boss.tips && boss.tips.length > 0) {
                contentHTML += `<div class="details-section"><h3>${langData.weeklyTipsTitle}</h3><ul class="weekly-tips-list">`;
                boss.tips.forEach(tip => { contentHTML += `<li>${tip[lang]}</li>`; });
                contentHTML += `</ul></div>`;
            }

            if (eventData.nextBoss) {
                 contentHTML += `<div class="details-section"><h3>${langData.weeklyNextBoss}</h3>
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
        App.dom.weeklyDetailsPanel.dataset.renderedLang = lang;
        App.state.currentOpenWeeklyId = weeklyId;
        if (App.state.isMobile) {
            document.body.classList.add('no-scroll');
        }
    },

    /** Cierra el panel de detalles del evento semanal. */
    closeWeeklyDetailsPanel: function() {
        App.dom.weeklyDetailsPanel.classList.remove('visible');
        App.state.currentOpenWeeklyId = null;
        if (App.state.isMobile) {
            document.body.classList.remove('no-scroll');
        }
    },

    /** Cierra el panel de detalles del evento semanal. */
    closeWeeklyDetailsPanel: function() {
        App.dom.weeklyDetailsPanel.classList.remove('visible');
        App.state.currentOpenWeeklyId = null;
    },

    /** Abre el modal de configuración con los valores actuales. */
    openSettingsModal: function() {
        const config = App.state.config;
        App.dom.bossTimersToggle.checked = config.showBossTimers;
        App.dom.eventsToggle.checked = config.showEvents;
        App.dom.weeklyToggle.checked = config.showWeekly;
        App.dom.preAlertInput.value = config.preAlertMinutes.join(', ');
        App.dom.soundToggle.checked = config.notificationTypes.sound;
        App.dom.desktopToggle.checked = config.notificationTypes.desktop;
        App.dom.timezoneSelect.value = config.displayTimezone;
        App.dom.languageSelect.value = config.currentLanguage;
        App.dom.modalOverlay.classList.add('visible');
    },

    /** Cierra el modal de configuración. */
    closeSettingsModal: function() {
        App.dom.modalOverlay.classList.remove('visible');
        this.updateAll();
    },

    /** Abre el modal de información del ticket. */
    openInfoModal: function() {
        const lang = I18N_STRINGS[App.state.config.currentLanguage];
        App.dom.infoModalTitle.textContent = lang.infoModalTitle;
        App.dom.infoModalBody1.innerHTML = lang.infoModalBody1;
        App.dom.infoModalBody2.innerHTML = lang.infoModalBody2;
        App.dom.closeInfoBtn.textContent = lang.infoModalClose;
        App.dom.infoModalOverlay.classList.add('visible');
    },

    /** Cierra el modal de información. */
    closeInfoModal: function() { App.dom.infoModalOverlay.classList.remove('visible'); },

    /** Abre el modal para sincronizar el timer del ticket. */
    openSyncModal: function() {
        App.dom.syncHours.value = '';
        App.dom.syncMinutes.value = '';
        App.dom.syncSeconds.value = '';
        App.dom.syncModalOverlay.classList.add('visible');
        App.dom.syncHours.focus();
    },

    /** Cierra el modal de sincronización. */
    closeSyncModal: function() { App.dom.syncModalOverlay.classList.remove('visible'); },

    /** Abre el modal "Acerca de". */
    openAboutModal: function() {
        const lang = I18N_STRINGS[App.state.config.currentLanguage];
        document.getElementById('about-modal-title').textContent = lang.aboutTitle;
        document.getElementById('about-contact-title').textContent = lang.aboutContactTitle;
        document.getElementById('about-contact-body').textContent = lang.aboutContactBody;
        document.getElementById('about-discord-handle').textContent = lang.aboutDiscordHandle;
        document.getElementById('about-discord-server').textContent = lang.aboutDiscordServer;
        document.getElementById('about-discord-link').textContent = lang.aboutDiscordLinkText;
        document.getElementById('about-donation').textContent = lang.aboutDonation;
        document.getElementById('about-disclaimer-title').textContent = lang.aboutDisclaimerTitle;
        document.getElementById('about-disclaimer-body').textContent = lang.aboutDisclaimerBody;
        App.dom.closeAboutBtn.textContent = lang.aboutCloseButton;
        App.dom.aboutModalOverlay.classList.add('visible');
    },

    /** Cierra el modal "Acerca de". */
    closeAboutModal: function() { App.dom.aboutModalOverlay.classList.remove('visible'); },

    /**
     * Abre el modal con detalles de un héroe y configura el contexto de navegación.
     * @param {object} heroData - Los datos del héroe a mostrar.
     * @param {Array<object>} [contextHeroes=[]] - Array de objetos {name, tag} para navegación.
     * @param {number} [index=-1] - El índice del héroe actual en el array de contexto.
     */
    openHeroModal: function(heroData, contextHeroes = [], index = -1) {
        if (!heroData) return;

        App.state.heroModalContext.heroes = contextHeroes;
        App.state.heroModalContext.currentIndex = index;

        App.dom.heroModalPreviews.innerHTML = '';
        if (contextHeroes.length > 1) {
            App.dom.heroModalPrevBtn.classList.add('visible');
            App.dom.heroModalNextBtn.classList.add('visible');

            contextHeroes.forEach((heroContext, i) => {
                const hero = Logic.findHeroByName(heroContext.name);
                if (hero) {
                    const previewDiv = document.createElement('div');
                    previewDiv.className = 'hero-preview-item';
                    if (i === index) {
                        previewDiv.classList.add('active');
                    }
                    previewDiv.dataset.heroName = hero.game_name;
                    previewDiv.innerHTML = `<img src="assets/heroes_icon/${hero.short_image}" alt="${hero.game_name}">`;
                    App.dom.heroModalPreviews.appendChild(previewDiv);
                }
            });
        } else {
            App.dom.heroModalPrevBtn.classList.remove('visible');
            App.dom.heroModalNextBtn.classList.remove('visible');
        }
        
        const currentHeroContext = contextHeroes[index] || {};
        if (currentHeroContext.tag) {
            App.dom.heroModalTag.textContent = currentHeroContext.tag;
            App.dom.heroModalTag.classList.add('visible');
        } else {
            App.dom.heroModalTag.classList.remove('visible');
        }

        const lang = I18N_STRINGS[App.state.config.currentLanguage];
        const elementColorVar = `--color-${heroData.element || 'default'}-role`;
        const elementColor = getComputedStyle(document.documentElement).getPropertyValue(elementColorVar).trim();
        App.dom.heroModalContent.style.borderColor = elementColor || 'var(--border-color)';
        const rarityBgColorVar = `--rarity${heroData.rarity}-modal-bg`;
        App.dom.heroModalInfo.style.backgroundColor = `var(${rarityBgColorVar})`;
        if (heroData.rarity === 1) { App.dom.heroModalName.style.color = 'var(--color-exalted-gold)'; } else { App.dom.heroModalName.style.color = ''; }
        App.dom.heroModalImage.src = `assets/heroes_full/${heroData.long_image}`;
        App.dom.heroModalName.textContent = heroData.game_name;
        const rarityKey = `rarity${heroData.rarity}`;
        App.dom.heroModalRarity.textContent = lang[rarityKey] || `Rarity ${heroData.rarity}`;
        App.dom.heroModalRarity.className = `rarity-text-${heroData.rarity}`;
        const roleKey = `role${heroData.role.charAt(0).toUpperCase() + heroData.role.slice(1)}`;
        App.dom.heroModalRole.textContent = lang[roleKey] || heroData.role;
        App.dom.heroModalElementIcon.src = `assets/elements/${heroData.element}_icon.png`;
        App.dom.heroModalElementIcon.alt = heroData.element;
        App.dom.heroModalRoleIcon.src = `assets/roles/${heroData.role}_icon.png`;
        App.dom.heroModalRoleIcon.className = "role-icon";
        App.dom.heroModalOverlay.classList.add('visible');
    },

    /** Cierra el modal del héroe y resetea el contexto. */
    closeHeroModal: function() {
        App.dom.heroModalOverlay.classList.remove('visible');
        App.state.heroModalContext = { heroes: [], currentIndex: -1 };
    },

    /**
     * Navega al héroe anterior o siguiente en el modal.
     * @param {string|number} instruction - 'next', 'prev', o un índice numérico directo.
     */
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
     * Actualiza todos los textos de la UI al idioma seleccionado.
     */
    updateLanguage: function() {
        const lang = I18N_STRINGS[App.state.config.currentLanguage];
        document.title = lang.title;
        document.documentElement.lang = App.state.config.currentLanguage;
        const desktopLabelKey = App.state.isMobile ? 'pushToggleLabel' : 'desktopToggleLabel';
        const desktopToggleSpan = document.querySelector('#desktop-toggle + .checkbox-custom + span');
        if (desktopToggleSpan) {
            desktopToggleSpan.dataset.langKey = desktopLabelKey;
        }
        document.querySelectorAll('[data-lang-key]').forEach(el => {
            if (lang[el.dataset.langKey] && typeof lang[el.dataset.langKey] === 'string') el.textContent = lang[el.dataset.langKey];
        });
        const p = Notification.permission;
        const statusBarSpan = App.dom.statusBar.querySelector('span');
        if (p === "granted") {
            statusBarSpan.textContent = lang.alertsEnabled;
            statusBarSpan.style.color = 'var(--color-success)';
        } else if (p === "denied") {
            statusBarSpan.textContent = lang.alertsDisabled;
            statusBarSpan.style.color = 'var(--color-danger)';
        } else {
            statusBarSpan.textContent = lang.permissionRequired;
            statusBarSpan.style.color = 'var(--color-warning)';
        }

        if (App.state.currentOpenEventId && App.dom.eventDetailsPanel.classList.contains('visible')) {
            const renderedLang = App.dom.eventDetailsPanel.dataset.renderedLang;
            if (renderedLang !== App.state.config.currentLanguage) {
                this.openEventDetailsPanel(App.state.currentOpenEventId);
            }
        }
        if (App.state.currentOpenWeeklyId && App.dom.weeklyDetailsPanel.classList.contains('visible')) {
            const renderedLang = App.dom.weeklyDetailsPanel.dataset.renderedLang;
            if (renderedLang !== App.state.config.currentLanguage) {
                this.openWeeklyDetailsPanel(App.state.currentOpenWeeklyId);
            }
        }
    },
    
    /**
     * Rellena los <select> de zona horaria e idioma al inicio.
     */
    populateSelects: function() {
        for (let i = 14; i >= -12; i--) {
            const o = `${i >= 0 ? '+' : '-'}${String(Math.abs(i)).padStart(2, '0')}:00`;
            App.dom.timezoneSelect.add(new Option(`UTC ${o}`, o));
        }
        App.dom.languageSelect.innerHTML = `<option value="es">Español</option><option value="en">English</option>`;
    }
};