'use strict';

// Importamos el estado global para poder acceder a la configuración y a las traducciones.
import App from './2-state.js';

const Utils = {

    /**
     * Obtiene una cadena de texto traducida desde el estado global (App.state.i18n).
     * Este objeto i18n es el JSON que se carga desde el backend.
     * @param {string} key - La clave de la traducción con notación de puntos (ej. 'common.title').
     * @param {Object} [placeholders={}] - Un objeto con los valores a reemplazar (ej. { loc: 'Everdusk' }).
     * @returns {string} La cadena traducida y formateada.
     */
    getText(key, placeholders = {}) {
        // Accede al objeto de traducciones que fue guardado en el estado de la aplicación.
        const translations = App.state.i18n;
        
        // Si las traducciones aún no se han cargado (ej. al inicio de la app),
        // devuelve la clave como un texto temporal.
        if (Object.keys(translations).length === 0) {
            return key;
        }

        // Navega por el objeto JSON usando la notación de puntos.
        // ej. 'timers.bossSpawnIn' -> translations['timers']['bossSpawnIn']
        const keyParts = key.split('.');
        let text = keyParts.reduce((obj, part) => obj && obj[part], translations);

        // Si la clave no se encuentra o no es una cadena, devuelve la clave y muestra una advertencia.
        if (typeof text !== 'string') {
            console.warn(`Translation key not found or is not a string: ${key}`);
            return key; 
        }

        // Reemplaza los placeholders (ej. %loc%) con sus valores.
        for (const p in placeholders) {
            text = text.replace(new RegExp(`%${p}%`, 'g'), placeholders[p]);
        }

        return text;
    },

    /**
     * Formatea una fecha a una cadena de tiempo localizada (ej: "10:30:05 PM").
     */
    formatDateToTimezoneString(date, offsetString, use24HourFormat, showSeconds = false) {
        try {
            const { DateTime } = luxon;
            const sign = offsetString.startsWith('-') ? '+' : '-';
            const hours = parseInt(offsetString.substring(1, 3));
            const timeZone = `Etc/GMT${sign}${hours}`;
            const dt = DateTime.fromJSDate(date).setZone(timeZone);
            let format = use24HourFormat ? (showSeconds ? 'HH:mm:ss' : 'HH:mm') : (showSeconds ? 'h:mm:ss a' : 'h:mm a');
            return dt.toFormat(format);
        } catch (e) {
            console.error("Error formatting date for timezone with Luxon:", e);
            return "Invalid Time";
        }
    },

    /**
     * Formatea una fecha a una cadena de fecha corta localizada (ej: "25/12/2023").
     */
    formatDateToLocaleDateString(date, offsetString, lang) {
        try {
            const { DateTime } = luxon;
            const sign = offsetString.startsWith('-') ? '+' : '-';
            const hours = parseInt(offsetString.substring(1, 3));
            const timeZone = `Etc/GMT${sign}${hours}`;
            return DateTime.fromJSDate(date).setZone(timeZone).setLocale(lang).toLocaleString(DateTime.DATE_SHORT);
        } catch (e) {
            console.error("Error formatting date for locale with Luxon:", e);
            return "Invalid Date";
        }
    },

    /**
     * Formatea un número de segundos a una cadena HH:MM:SS.
     */
    formatTime(s) {
        if (s < 0 || isNaN(s)) s = 0;
        const h = Math.floor(s / 3600);
        const m = Math.floor((s % 3600) / 60);
        const sec = Math.floor(s % 60);
        return [h, m, sec].map(v => String(v).padStart(2, '0')).join(':');
    },
    
    /**
     * Formatea segundos a una cadena con días, horas y minutos (ej: "2d 5h 30m").
     */
    formatTimeWithDays(s, showMinutes = false) {
        if (s <= 0) return '0m';
        if (s < 60 && !showMinutes) return '1m';
    
        const days = Math.floor(s / 86400);
        const hours = Math.floor((s % 86400) / 3600);
        const minutes = Math.floor((s % 3600) / 60);
    
        let parts = [];
        if (days > 0) parts.push(`${days}d`);
        if (hours > 0) parts.push(`${hours}h`);
        if (minutes > 0 && (showMinutes || days === 0)) {
            parts.push(`${minutes}m`);
        }
        
        return parts.join(' ');
    },

    /**
     * Determina el color del contador basado en el tiempo restante.
     */
    getCountdownColor(s, type) {
        const config = App.state.config;
        if (type === 'boss') {
            const preAlerts = config.preAlertMinutes || [15, 5, 1];
            const u = (Math.min(...preAlerts) || 5) * 60;
            const w = (Math.max(...preAlerts) || 15) * 60;
            if (s <= u) return 'var(--color-urgent)';
            if (s <= w) return 'var(--color-warning)';
        } else if (type === 'ticket') {
            return 'var(--color-primary)';
        }
        return 'var(--color-normal)';
    },
    
    /**
     * Establece una cookie en el navegador.
     */
    setCookie(name, value, days) {
        let expires = "";
        if (days) {
            const date = new Date();
            date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
            expires = "; expires=" + date.toUTCString();
        }
        const secure = window.location.protocol === 'https:' ? '; Secure' : '';
        document.cookie = name + "=" + (value || "") + expires + "; path=/; SameSite=Lax" + secure;
    },

    /**
     * Obtiene el valor de una cookie por su nombre.
     */
    getCookie(name) {
        const nameEQ = name + "=";
        const ca = document.cookie.split(';');
        for (let i = 0; i < ca.length; i++) {
            let c = ca[i];
            while (c.charAt(0) === ' ') c = c.substring(1, c.length);
            if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
        }
        return null;
    }
};

export default Utils;