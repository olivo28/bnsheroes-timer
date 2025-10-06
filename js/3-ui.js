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
        const now = new Date();
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
        
        const showSecondaryPanel = config.showBossTimers || config.showEvents;
    
        // ESTA LÓGICA AHORA ES SOLO PARA ESCRITORIO
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
        } else { // Comportamiento para Móvil
            // CORRECCIÓN: Hacemos el código más seguro
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

        // Actualizar el widget de stream
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
            const endDate = Logic.getAbsoluteDateWithCustomDate(event.endDate, config.dailyResetTime, -4);
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
     * Renderiza el panel de banners (activos y próximos).
     */
    renderBannersPanel: function() {
        const config = App.state.config;
        const lang = I18N_STRINGS[config.currentLanguage];
        const now = new Date();

        const activeBanner = config.banner.find(b => {
            if (!b.startDate || !b.endDate) return false;
            const start = Logic.getAbsoluteDateWithCustomDate(b.startDate, config.dailyResetTime, -4);
            const end = Logic.getAbsoluteDateWithCustomDate(b.endDate, config.dailyResetTime, -4);
            return now >= start && now <= end;
        });

        const futureBanners = config.banner.filter(b => b.startDate && Logic.getAbsoluteDateWithCustomDate(b.startDate, config.dailyResetTime, -4) > now).sort((a,b) => new Date(a.startDate) - new Date(b.startDate));
        const nextBanner = futureBanners[0];
        
        const createBannerHTML = (banner, type) => {
            const title = type === 'active' ? lang.activeBannersTitle : lang.nextBannerTitle;
            let countdownHTML = '';
            
            if (banner && ( (type === 'active' && banner.endDate) || (type === 'next' && banner.startDate) )) {
                const targetDate = type === 'active' 
                    ? Logic.getAbsoluteDateWithCustomDate(banner.endDate, config.dailyResetTime, -4)
                    : Logic.getAbsoluteDateWithCustomDate(banner.startDate, config.dailyResetTime, -4);

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
            // Mantenemos streams en la lista hasta 2h después de que terminen para mostrar el modal
            .filter(stream => {
                const durationMs = (stream.durationHours || 2) * 3600 * 1000;
                const endTime = stream.date.getTime() + durationMs;
                return endTime > now.getTime() - (2 * 3600 * 1000);
            })
            .sort((a, b) => a.date - b.date);

        // Primero, removemos todos los estados para empezar de cero en cada ciclo.
        App.dom.twitchFab.classList.remove('alert-active', 'live-active');

        if (upcomingStreams.length > 0) {
            App.dom.twitchFab.classList.add('visible');
            this.renderStreamsModal(upcomingStreams, now);

            // Buscamos si hay algún stream actualmente en vivo
            const liveStream = upcomingStreams.find(stream => {
                const startTime = stream.date.getTime();
                const durationMs = (stream.durationHours || 2) * 3600 * 1000; // Asumir 2h si no está definido
                const endTime = startTime + durationMs;
                return now.getTime() >= startTime && now.getTime() < endTime;
            });

            if (liveStream) {
                // Si hay un stream en vivo, activamos el pulso rojo
                App.dom.twitchFab.classList.add('live-active');
            } else {
                // Si no hay ninguno en vivo, comprobamos si el próximo está por empezar
                const nextStream = upcomingStreams.find(s => s.date > now);
                if (nextStream) {
                    const secondsLeft = Math.floor((nextStream.date.getTime() - now.getTime()) / 1000);
                    // Muestra la alerta amarilla si falta 1 hora o menos
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
        const lang = App.state.config.currentLanguage;
        const langData = I18N_STRINGS[lang];
        const eventData = App.state.allEventsData[eventId];
        if (!eventData) {
            console.error(`Event data not found for ID: ${eventId}`);
            return;
        }

        let contentHTML = `
            <div class="details-header">
                <div class="close-details-btn">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" width="24" height="24"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                </div>
                <h2>${eventData.name[lang]}</h2>
                <p>${eventData.period}</p>
            </div>
            <div class="details-content">
                <p class="details-summary">${eventData.summary[lang]}</p>
        `;

        if (eventData.missions) {
            contentHTML += `
                <div class="details-section">
                    <h3>${langData.eventMissionsTitle}</h3>
                    <table class="details-table">
                        <tbody>
                            ${eventData.missions.map(m => `<tr><td>${m.description[lang]}</td><td>+${m.points} ${langData.pointsSuffix}</td></tr>`).join('')}
                        </tbody>
                    </table>
                </div>
            `;
        }

        if (eventData.missions_and_rewards) {
             contentHTML += `
                <div class="details-section">
                    <h3>${langData.eventMissionsAndRewardsTitle}</h3>
                    <table class="details-table">
                        <tbody>
                            ${eventData.missions_and_rewards.map(m => `<tr><td>${m.mission[lang]}</td><td>${m.reward_item[lang]} x${m.reward_count}</td></tr>`).join('')}
                        </tbody>
                    </table>
                </div>
            `;
        }
        
        if (eventData.boss_details && eventData.boss_details.ranking_rewards) {
            contentHTML += `<div class="details-section"><h3>${langData.eventBossRankingRewardsTitle}</h3>`;
            
            const participation = eventData.boss_details.ranking_rewards.base_on_participation;
            if (participation) {
                const rewardText = participation.rewards.map(rew => `${rew.item[lang]} x${rew.quantity}`).join(', ');
                contentHTML += `
                    <div class="participation-reward">
                        <strong>${langData.eventParticipationRewardTitle}</strong>
                        <span>${participation.description[lang]} <strong>(${rewardText})</strong></span>
                    </div>
                `;
            }

            const ranking = eventData.boss_details.ranking_rewards.bonus_by_rank;
            if (ranking) {
                contentHTML += `
                    <table class="details-table">
                        <thead><tr><th>${langData.eventRankHeader}</th><th>${langData.eventRewardHeader}</th></tr></thead>
                        <tbody>
                            ${ranking.map(r => `<tr><td>${r.tier_name[lang]}</td><td>${r.rewards.map(rew => `${rew.item[lang]} x${rew.quantity}`).join(', ')}</td></tr>`).join('')}
                        </tbody>
                    </table>
                `;
            }
            contentHTML += `</div>`;
        }
        
        if (eventData.rewards && eventData.rewards.wheel_of_fate) {
            contentHTML += `
                <div class="details-section">
                    <h3>${langData.eventWheelRewardsTitle}</h3>
                    <ul class="details-list">
                        ${eventData.rewards.wheel_of_fate.map(r => `<li><span>${r.item[lang]}</span><span>x${r.count}</span></li>`).join('')}
                    </ul>
                </div>
            `;
        }

         if (eventData.rewards && eventData.rewards.cumulative_spins) {
            contentHTML += `
                <div class="details-section">
                    <h3>${langData.eventCumulativeRewardsTitle}</h3>
                    <table class="details-table">
                        <tbody>
                            ${eventData.rewards.cumulative_spins.map(r => `<tr><td>${r.condition[lang]}</td><td>${r.item[lang]}</td></tr>`).join('')}
                        </tbody>
                    </table>
                </div>
            `;
        }

        if (eventData.rewards && eventData.rewards.reward_pool) {
            contentHTML += `
                <div class="details-section">
                    <h3>${langData.eventPossibleRewardsTitle}</h3>
                     <ul class="details-list">
                        ${eventData.rewards.reward_pool.map(r => `<li><span>${r.item[lang]}</span><span>x${r.count}</span></li>`).join('')}
                    </ul>
                </div>
            `;
        }

        contentHTML += `</div>`; // Close details-content
        App.dom.eventDetailsPanel.innerHTML = contentHTML;
        App.dom.eventDetailsPanel.classList.add('visible');
        App.dom.eventDetailsPanel.dataset.renderedLang = lang;
        App.state.currentOpenEventId = eventId;
    },

    /** Cierra el panel de detalles del evento. */
    closeEventDetailsPanel: function() {
        App.dom.eventDetailsPanel.classList.remove('visible');
        App.state.currentOpenEventId = null;
    },

    /** Abre el modal de configuración con los valores actuales. */
    openSettingsModal: function() {
        const config = App.state.config;
        App.dom.bossTimersToggle.checked = config.showBossTimers;
        App.dom.eventsToggle.checked = config.showEvents;
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

    /** Abre el modal con detalles de un héroe. */
    openHeroModal: function(heroData) {
        if (!heroData) return;
        const lang = I18N_STRINGS[App.state.config.currentLanguage];

        // --- INICIO DE LA NUEVA LÓGICA ---
    
        // 1. Establecer el color del borde según el elemento del héroe
        const elementColorVar = `--color-${heroData.element || 'default'}-role`;
        const elementColor = getComputedStyle(document.documentElement).getPropertyValue(elementColorVar).trim();
        App.dom.heroModalContent.style.borderColor = elementColor || 'var(--border-color)';
    
        // 2. Establecer el color de fondo de la información según la rareza
        const rarityBgColorVar = `--rarity${heroData.rarity}-modal-bg`;
        App.dom.heroModalInfo.style.backgroundColor = `var(${rarityBgColorVar})`;
    
        // 3. Establecer el color del nombre si el héroe es Exaltado (rareza 1)
        if (heroData.rarity === 1) {
            App.dom.heroModalName.style.color = 'var(--color-exalted-gold)';
        } else {
            // Restablecer al color por defecto para otros héroes
            App.dom.heroModalName.style.color = ''; 
        }
        
        // --- FIN DE LA NUEVA LÓGICA ---

        App.dom.heroModalImage.src = `assets/heroes_full/${heroData.long_image}`;
        App.dom.heroModalName.textContent = heroData.game_name;
        
        const rarityKey = `rarity${heroData.rarity}`;
        App.dom.heroModalRarity.textContent = lang[rarityKey] || `Rarity ${heroData.rarity}`;
        App.dom.heroModalRarity.className = `rarity-text-${heroData.rarity}`;

        const roleKey = `role${heroData.role.charAt(0).toUpperCase() + heroData.role.slice(1)}`;
        App.dom.heroModalRole.textContent = lang[roleKey] || heroData.role;

        App.dom.heroModalElementIcon.src = `assets/elements/${heroData.element}_icon.png`;
        App.dom.heroModalRoleIcon.src = `assets/roles/${heroData.role}_icon.png`;
        App.dom.heroModalRoleIcon.className = "role-icon"

        App.dom.heroModalOverlay.classList.add('visible');
    },

    /** Cierra el modal del héroe. */
    closeHeroModal: function() { App.dom.heroModalOverlay.classList.remove('visible'); },

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