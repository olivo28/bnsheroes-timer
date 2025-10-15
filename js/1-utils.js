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
     * Muestra un modal de confirmación personalizado.
     * @param {string} titleKey - Clave de traducción para el título.
     * @param {string} bodyKey - Clave de traducción para el cuerpo del mensaje.
     * @returns {Promise<boolean>} - Resuelve a 'true' si se confirma, 'false' si se cancela.
     */
    confirm(titleKey, bodyKey) {
        return new Promise(resolve => {
            const overlay = document.getElementById('confirmation-modal-overlay');
            const titleEl = document.getElementById('confirmation-modal-title');
            const bodyEl = document.getElementById('confirmation-modal-body');
            const confirmBtn = document.getElementById('confirmation-confirm-btn');
            const cancelBtn = document.getElementById('confirmation-cancel-btn');

            // --- LÓGICA DE LIMPIEZA Y CIERRE ---
            const closeModal = (result) => {
                // Removemos los listeners para evitar llamadas múltiples
                confirmBtn.removeEventListener('click', confirmHandler);
                cancelBtn.removeEventListener('click', cancelHandler);
                overlay.removeEventListener('click', overlayHandler);
                
                // Ocultamos el overlay
                overlay.classList.remove('visible');
                
                // Resolvemos la promesa
                resolve(result);
            };

            // --- LÓGICA DE LOS HANDLERS ---
            const confirmHandler = () => closeModal(true);
            const cancelHandler = () => closeModal(false);
            const overlayHandler = (e) => {
                if (e.target === overlay) {
                    closeModal(false);
                }
            };

            // --- INICIALIZACIÓN ---
            // Asignamos textos
            titleEl.textContent = this.getText(titleKey);
            bodyEl.textContent = this.getText(bodyKey);
            confirmBtn.textContent = this.getText('common.confirmButton');
            cancelBtn.textContent = this.getText('common.cancelButton');
            
            // Añadimos los listeners
            confirmBtn.addEventListener('click', confirmHandler);
            cancelBtn.addEventListener('click', cancelHandler);
            overlay.addEventListener('click', overlayHandler);
            
            // Mostramos el modal
            overlay.classList.add('visible');
        });
    },

    /**
     * Muestra un modal de alerta personalizado.
     * @param {string} titleKey - Clave de traducción para el título.
     * @param {string} bodyKey - Clave de traducción para el cuerpo.
     */
    alert(titleKey, bodyKey) {
        return new Promise(resolve => {
            const overlay = document.getElementById('alert-modal-overlay');
            const titleEl = document.getElementById('alert-modal-title');
            const bodyEl = document.getElementById('alert-modal-body');
            const okBtn = document.getElementById('alert-ok-btn');

            titleEl.textContent = this.getText(titleKey);
            bodyEl.textContent = this.getText(bodyKey);
            okBtn.textContent = this.getText('common.okButton');
            
            overlay.classList.add('visible');

            const cleanup = () => {
                okBtn.onclick = null;
                overlay.onclick = null;
                overlay.classList.remove('visible');
                resolve();
            };

            okBtn.onclick = cleanup;
            overlay.onclick = e => { if (e.target === overlay) cleanup(); };
        });
    },

    /**
     * Muestra un modal de prompt personalizado.
     * @param {string} titleKey - Clave de traducción para el título.
     * @param {string} bodyKey - Clave de traducción para la descripción.
     * @param {string} defaultValueKey - Clave de traducción para el valor por defecto del input.
     * @returns {Promise<string|null>} - Resuelve con el texto del input o null si se cancela.
     */
    prompt(titleKey, bodyKey, defaultValue) {
        return new Promise(resolve => {
            const overlay = document.getElementById('prompt-modal-overlay');
            const titleEl = document.getElementById('prompt-modal-title');
            const bodyEl = document.getElementById('prompt-modal-body');
            const inputEl = document.getElementById('prompt-modal-input');
            const confirmBtn = document.getElementById('prompt-confirm-btn');
            const cancelBtn = document.getElementById('prompt-cancel-btn');

            titleEl.textContent = this.getText(titleKey);
            bodyEl.textContent = this.getText(bodyKey);
            // --- INICIO DE LA CORRECCIÓN: Usar el valor directamente ---
            inputEl.value = this.getText(defaultValue);
            // --- FIN DE LA CORRECCIÓN ---
            confirmBtn.textContent = this.getText('common.confirmButton');
            cancelBtn.textContent = this.getText('common.cancelButton');
            
            overlay.classList.add('visible');
            inputEl.focus();
            inputEl.select();

            const cleanup = () => {
                confirmBtn.onclick = null;
                cancelBtn.onclick = null;
                overlay.onclick = null;
                overlay.classList.remove('visible');
            };

            confirmBtn.onclick = () => {
                cleanup();
                resolve(inputEl.value);
            };
            
            cancelBtn.onclick = () => {
                cleanup();
                resolve(null);
            };

            overlay.onclick = e => { if (e.target === overlay) { cleanup(); resolve(null); } };
        });
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

    const days = Math.floor(s / 86400);
    const hours = Math.floor((s % 86400) / 3600);
    const minutes = Math.floor((s % 3600) / 60);
    const seconds = Math.floor(s % 60); // Añadimos segundos para el caso final

    let parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    
    // Mostramos minutos si se pide, o si no hay días ni horas
    if (showMinutes && (minutes > 0 || (days === 0 && hours === 0))) {
        parts.push(`${minutes}m`);
    }

    // Si después de todo, el array está vacío (ej. quedan 30 segundos),
    // devolvemos '1m' como mínimo.
    if (parts.length === 0) {
        // Si se pide mostrar minutos, y hay menos de 1 minuto, mostramos "1m"
        if (showMinutes) return '1m'; 
        // Si no, podríamos mostrar segundos, pero para este caso "1m" es más simple
        return '1m';
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