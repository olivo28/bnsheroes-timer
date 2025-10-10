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
            return; // No hacer nada si la configuración aún no ha cargado
        }

        const now = Logic.getCorrectedNow();
        const config = App.state.config;

        this.updateLanguage();
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
                if (secondarySlide) secondarySlide.style.display = showSecondaryPanel ? 'block' : 'none';
            }
            if (App.state.swiper?.update) App.state.swiper.update();
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
        } else {
            App.dom.weeklyContainer.innerHTML = '';
            App.dom.weeklyContainer.style.display = 'none';
            this.closeWeeklyDetailsPanel();
        }

        const primaryTimers = [dailyResetTimer];
        let bossTimers = [];

        App.dom.stickyTicketContainer.innerHTML = '';
        App.dom.timersContainer.innerHTML = '';

        if (config.showBossTimers) {
            bossTimers = Logic.getBossTimers(now);
            const nextActiveBoss = bossTimers.find(s => s.secondsLeft >= 0);
            if (nextActiveBoss) primaryTimers.push(nextActiveBoss);

            App.dom.stickyTicketContainer.innerHTML = this.renderSecondaryTimers([showdownTicketTimer]);
            App.dom.timersContainer.innerHTML = this.renderSecondaryTimers(bossTimers);
        } else {
            primaryTimers.push(showdownTicketTimer);
        }

        this.renderPrimaryPanel(primaryTimers);

        Logic.checkAndTriggerAlerts(now, bossTimers, dailyResetTimer, showdownTicketTimer, config.events, config.banners);
        this.updateStreamsFeature();
    },

    renderPrimaryPanel: function (timers) {
        const config = App.state.config;
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
            const nameItself = `<p class="${nameClass}">${timer.name} ${timeSpan}</p>`;

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
                let eventTip = '';
                if (timer.id === "stalker_jiangshi" && Logic.isEventActive("Field Boss Challenge")) {
                    eventTip = `<span class="event-tip">${Utils.getText('events.tip')}</span>`;
                }
                const isAlertEnabled = timer.isNotificationOn;

                return `<div class="spawn-item ${!isAlertEnabled ? 'disabled' : ''}">${bossIcon}<div class="spawn-item-info"><p class="spawn-item-name spawn-item-name-boss">${timer.name}</p><p class="spawn-item-time">${displayTime} (${tzString}) ${eventTip}</p></div><span class="countdown-timer" style="color: ${color};">${time}</span><div class="alert-toggle ${isAlertEnabled ? 'enabled' : 'disabled'}" data-boss-id="${timer.id}" data-time="${timer.time}">${isAlertEnabled ? bellIcon : noBellIcon}</div></div>`;
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
        const weeklyTimers = Logic.getWeeklyResetTimers(Logic.getCorrectedNow());
        if (weeklyTimers.length === 0) return '';

        let html = `<h3 class="panel-subtitle">${Utils.getText('weekly.title')}</h3>`;
        weeklyTimers.forEach(timer => {
            const timeString = Utils.formatTimeWithDays(timer.secondsLeft, true);
            const countdownText = Utils.getText('weekly.resetsIn', { d: timeString });
            html += `<div class="weekly-item" data-weekly-id="${timer.id}">
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
        if (!config.banners) return '';
        const now = new Date();

        const activeBanner = config.banners.find(b => {
            if (!b.startDate || !b.endDate) return false;
            const start = Logic.getAbsoluteDateWithCustomDate(b.startDate, config.dailyResetTime);
            const end = Logic.getAbsoluteDateWithCustomDate(b.endDate, config.dailyResetTime);
            return now >= start && now <= end;
        });

        const futureBanners = config.banners.filter(b => b.startDate && Logic.getAbsoluteDateWithCustomDate(b.startDate, config.dailyResetTime) > now).sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
        const nextBanner = futureBanners[0];

        const createBannerHTML = (banner, type) => {
            const title = Utils.getText(type === 'active' ? 'banners.activeTitle' : 'banners.nextTitle');
            let countdownHTML = '';

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
        const config = App.state.config;
        if (!config.streams || config.streams.length === 0) {
            App.dom.twitchFab.classList.remove('visible', 'alert-active', 'live-active');
            return;
        }

        const now = Logic.getCorrectedNow();

        const upcomingStreams = config.streams
            .map(stream => ({ ...stream, date: new Date(stream.streamTimeUTC) }))
            .filter(stream => {
                const durationMs = (stream.durationHours || 2) * 3600 * 1000;
                const endTime = stream.date.getTime() + durationMs;
                return endTime > now.getTime() - (2 * 3600 * 1000); // Muestra streams hasta 2h después de que terminen
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
        if (!App.dom.streamsModalContent) return;

        if (streams.length === 0) {
            App.dom.streamsModalContent.innerHTML = `<p class="no-streams-message">${Utils.getText('modals.streams.noStreams')}</p>`;
            return;
        }

        const contentHTML = streams.map(stream => {
            const secondsLeft = Math.floor((stream.date.getTime() - now.getTime()) / 1000);
            let countdownHTML;

            if (secondsLeft <= 0) {
                countdownHTML = `<p class="stream-is-live">${Utils.getText('streams.isLive')}</p>`;
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

    openEventDetailsPanel: function (eventId) {
        this.closeWeeklyDetailsPanel();
        const lang = App.state.config.language;
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
            const refTzAbbr = `(UTC${refTzOffset.replace(':00', '')})`;

            periodString = `${datePart}, ${formattedTime} ${refTzAbbr}`;
        }

        const getRarityClass = (rank) => rank ? `rarity-text-${rank.toLowerCase()}` : 'rarity-text-common';

        const getItemGridDisplay = (itemId, quantity, rank = '', probability = null) => {
            const itemDef = App.state.allEventsData.itemDefinitions[itemId];
            if (!itemDef || !itemDef.icon) return '';
            const name = itemDef.name[lang] || itemDef.name.en || itemId;
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
                const name = itemDef.name[lang] || itemDef.name.en || r.itemId;
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

        let contentHTML = `
            <div class="details-header">
                <div class="close-details-btn"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" width="24" height="24"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg></div>
                <h2>${eventData.name[lang]}</h2>
                <p>${periodString}</p>
            </div>
            <div class="details-content">
                <p class="details-summary">${eventData.summary[lang]}</p>
        `;

        if (eventData.daily_claim_limit) {
            contentHTML += `<div class="weekly-recommendation-box"><p>${Utils.getText('events.dailyClaimLimit', { limit: eventData.daily_claim_limit })}</p></div>`;
        }

        if (eventData.missions) {
            contentHTML += `<div class="details-section"><h3>${Utils.getText('events.rewards.missionsTitle')}</h3><table class="details-table missions-table"><tbody>`;
            eventData.missions.forEach(m => {
                let rightColumnHTML = '';
                if (m.points) {
                    rightColumnHTML = `+${m.points} ${Utils.getText('common.pointsSuffix')}`;
                } else if (m.goal) {
                    rightColumnHTML = `${Utils.getText('common.goalPrefix')} x${m.goal}`;
                }
                contentHTML += `<tr><td>${m.description[lang]}</td><td style="color: var(--color-warning); font-weight: bold;">${rightColumnHTML}</td></tr>`;
            });
            contentHTML += `</tbody></table></div>`;
        }

        if (eventData.missions_and_rewards) {
            contentHTML += `<div class="details-section"><h3>${Utils.getText('events.rewards.missionsAndRewardsTitle')}</h3><div class="details-reward-grid-container">`;
            eventData.missions_and_rewards.forEach(m => {
                const iconGrid = getItemGridDisplay(m.itemId, m.quantity, m.rank);
                contentHTML += `<div class="details-reward-column"><span class="details-reward-label">${m.mission[lang]}</span>${iconGrid}</div>`;
            });
            contentHTML += `</div></div>`;
        }

        if (eventData.boss_details?.ranking_rewards) {
            contentHTML += `<div class="details-section"><h3>${Utils.getText('events.rewards.bossRankingTitle')}</h3>`;
            const participation = eventData.boss_details.ranking_rewards.base_on_participation;
            if (participation) {
                const rewardsGrid = participation.rewards.map(rew => getItemGridDisplay(rew.itemId, rew.quantity, rew.rank || 'Common')).join('');
                contentHTML += `<div class="participation-reward">
                                    <div class="reward-grid">${rewardsGrid}</div>
                                    <div class="participation-reward-text"><strong>${Utils.getText('events.rewards.participationTitle')}</strong><span>${participation.description[lang]}</span></div>
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

        if (eventData.rewards?.wheel_of_fate) {
            contentHTML += `<div class="details-section"><h3>${Utils.getText('events.rewards.wheelTitle')}</h3>`;
            const rewards = eventData.rewards.wheel_of_fate;
            const iconGrid = rewards.map(r => getItemGridDisplay(r.itemId, r.quantity, r.rank, r.probability)).join('');
            contentHTML += `<div class="reward-grid">${iconGrid}</div>`;
            contentHTML += generateRewardTextList(rewards);
            contentHTML += `</div>`;
        }

        if (eventData.rewards?.cumulative_spins) {
            contentHTML += `<div class="details-section"><h3>${Utils.getText('events.rewards.cumulativeTitle')}</h3>`;
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

        if (eventData.rewards?.reward_pool) {
            contentHTML += `<div class="details-section"><h3>${Utils.getText('events.rewards.possibleTitle')}</h3>`;
            const rewards = eventData.rewards.reward_pool;
            const iconGrid = rewards.map(r => getItemGridDisplay(r.itemId, r.quantity, r.rank, r.probability)).join('');
            contentHTML += `<div class="reward-grid">${iconGrid}</div>`;
            contentHTML += generateRewardTextList(rewards);
            contentHTML += `</div>`;
        }

        contentHTML += `</div>`;
        App.dom.eventDetailsPanel.innerHTML = contentHTML;
        App.dom.eventDetailsPanel.classList.add('visible');
        if (App.state.isMobile) document.body.classList.add('no-scroll');
        App.state.currentOpenEventId = eventId;
    },

    closeEventDetailsPanel: function () {
        if (!App.dom.eventDetailsPanel) return;
        App.dom.eventDetailsPanel.classList.remove('visible');
        App.state.currentOpenEventId = null;
        if (App.state.isMobile) document.body.classList.remove('no-scroll');
    },

    openWeeklyDetailsPanel: function (weeklyId) {
        this.closeEventDetailsPanel();
        const lang = App.state.config.language;
        const weeklyData = App.state.weeklyResetsData;
        if (!weeklyData) return;

        const eventData = weeklyData.events.find(e => e.id === weeklyId);
        if (!eventData) {
            console.error(`Weekly event data not found for ID: ${weeklyId}`);
            return;
        }

        const getWeeklyItemGridDisplay = (itemId, quantity, rank = 'Common') => {
            const itemDef = weeklyData.itemDefinitions[itemId];
            if (!itemDef || !itemDef.icon) return '';
            const name = itemDef.name[lang] || itemDef.name.en || itemId;
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

                // Renderiza el buff principal
                contentHTML += `<div class="weekly-buff-item${expandableClass}">
                          <img src="assets/spells_icons/${buff.icon}.png">
                          <div><strong>${buff.name[lang]}</strong><p>${buff.description[lang]}</p></div>
                          ${hasEnhancements ? arrowSVG : ''}
                        </div>`;

                // Si tiene mejoras, renderiza la lista oculta
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

            // El botón de Suscribir/Desuscribir ahora está en la lista de suscripciones,
            // así que ya no necesitamos manejarlo aquí. La lista se renderiza abajo.

            this.renderActiveSubscriptions(); // Esta función ahora manejará el botón de "Añadir este dispositivo"
            this.switchAccountModalSection('my-account');

        } else {
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
        App.dom.accountModalOverlay.classList.remove('visible');
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
        // Añadimos la lógica de traducción aquí
        document.querySelectorAll('#about-modal-overlay [data-lang-key]').forEach(el => {
            const key = el.dataset.langKey;
            const text = Utils.getText(key);
            if (text !== key) el.textContent = text;
        });
        App.dom.aboutModalOverlay.classList.add('visible');
    },

    closeAboutModal: function() { 
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
            this.openWeeklyDetailsPanel(App.state.currentOpenWeeklyId);
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