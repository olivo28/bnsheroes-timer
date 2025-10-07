'use strict';

/**
 * Colección de funciones de utilidad (helpers) que no dependen del estado de la aplicación.
 */
const Utils = {
    /**
     * Formatea una fecha a una cadena de tiempo localizada (ej: "10:30:05 PM").
     * USA LUXON para un manejo robusto de zonas horarias.
     * @param {Date} date - El objeto Date a formatear.
     * @param {string} offsetString - La zona horaria en formato "+HH:00" o "-HH:00".
     * @param {boolean} use24HourFormat - Si se debe usar el formato de 24 horas.
     * @param {boolean} [showSeconds=false] - Si se deben mostrar los segundos.
     * @returns {string} La cadena de tiempo formateada.
     */
    formatDateToTimezoneString(date, offsetString, use24HourFormat, showSeconds = false) {
        try {
            const { DateTime } = luxon;
            // Luxon requiere un formato de zona IANA como 'Etc/GMT+4' para GMT-4. El signo está invertido.
            const sign = offsetString.startsWith('-') ? '+' : '-';
            const hours = parseInt(offsetString.substring(1, 3));
            const timeZone = `Etc/GMT${sign}${hours}`;

            const dt = DateTime.fromJSDate(date).setZone(timeZone);

            let format;
            if (use24HourFormat) {
                format = showSeconds ? 'HH:mm:ss' : 'HH:mm';
            } else {
                format = showSeconds ? 'h:mm:ss a' : 'h:mm a';
            }

            return dt.toFormat(format);
        } catch (e) {
            console.error("Error formatting date for timezone with Luxon", e);
            return "Invalid Time";
        }
    },

    /**
     * Formatea una fecha a una cadena de fecha corta localizada (ej: "25/12/2023").
     * USA LUXON para un manejo robusto de zonas horarias y localización.
     * @param {Date} date - El objeto Date a formatear.
     * @param {string} offsetString - La zona horaria en formato "+HH:00" o "-HH:00".
     * @param {string} lang - El código de idioma (ej: 'es', 'en').
     * @returns {string} La cadena de fecha formateada.
     */
    formatDateToLocaleDateString(date, offsetString, lang) {
        try {
            const { DateTime } = luxon;
            // Convertimos el offset a una zona IANA que Luxon entiende.
            const sign = offsetString.startsWith('-') ? '+' : '-';
            const hours = parseInt(offsetString.substring(1, 3));
            const timeZone = `Etc/GMT${sign}${hours}`;

            return DateTime.fromJSDate(date)
                .setZone(timeZone)
                .setLocale(lang)
                .toLocaleString(DateTime.DATE_SHORT);

        } catch (e) {
            console.error("Error formatting date for locale with Luxon", e);
            return "Invalid Date";
        }
    },

    /**
     * Formatea un número de segundos a una cadena HH:MM:SS.
     * @param {number} s - El número total de segundos.
     * @returns {string} La cadena formateada.
     */
    formatTime(s) {
        if (s < 0 || isNaN(s)) s = 0;
        const h = Math.floor(s / 3600);
        const m = Math.floor((s % 3600) / 60);
        const sec = s % 60;
        return [h, m, sec].map(v => String(v).padStart(2, '0')).join(':');
    },
    
    /**
     * Formatea segundos a una cadena con días, horas y minutos (ej: "2d 5h 30m").
     * @param {number} s - El número total de segundos.
     * @param {boolean} [showMinutes=false] - Incluir minutos en la salida.
     * @returns {string} La cadena formateada.
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
     * Determina el color del contador basado en el tiempo restante y el tipo.
     * @param {number} s - Segundos restantes.
     * @param {string} type - El tipo de timer ('boss', 'ticket', etc.).
     * @param {object} config - El objeto de configuración actual.
     * @returns {string} La variable de color CSS.
     */
    getCountdownColor(s, type, config) {
        if (type === 'boss') {
            const u = (Math.min(...config.preAlertMinutes) || 5) * 60;
            const w = (Math.max(...config.preAlertMinutes) || 15) * 60;
            if (s <= u) return 'var(--color-urgent)';
            if (s <= w) return 'var(--color-warning)';
        } else if (type === 'ticket') {
            return 'var(--color-primary)';
        }
        return 'var(--color-normal)';
    },
    
    /**
     * Establece una cookie en el navegador.
     * @param {string} name - El nombre de la cookie.
     * @param {string} value - El valor de la cookie.
     * @param {number} days - El número de días hasta que la cookie expire.
     */
    setCookie(name, value, days) {
        let expires = "";
        if (days) {
            const date = new Date();
            date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
            expires = "; expires=" + date.toUTCString();
        }
        document.cookie = name + "=" + (value || "") + expires + "; path=/; SameSite=Lax";
    },

    /**
     * Obtiene el valor de una cookie por su nombre.
     * @param {string} name - El nombre de la cookie a buscar.
     * @returns {string|null} El valor de la cookie o null si no se encuentra.
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