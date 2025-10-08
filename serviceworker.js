// serviceworker.js

'use strict';

// Al instalar el Service Worker, forzamos la activación de la nueva versión.
self.addEventListener('install', event => {
    console.log('Service Worker: Instalado');
    self.skipWaiting(); // Activa el nuevo SW inmediatamente
});

self.addEventListener('activate', event => {
    console.log('Service Worker: Activado y listo para controlar la página.');
    // Asegura que el SW tome control de las páginas abiertas sin necesidad de recargar.
    event.waitUntil(self.clients.claim());
    // Hacemos la primera sincronización de tiempo en cuanto se activa.
    syncTime();
});

// Función para obtener la hora mundial y calcular el desfase
async function syncTime() {
    try {
        console.log('Service Worker: Intentando sincronizar tiempo...');
        
        // --- INICIO DE LA MODIFICACIÓN ---
        // Hacemos la petición fetch más robusta
        const response = await fetch('https://worldtimeapi.org/api/timezone/Etc/UTC', {
            mode: 'cors',       // Petición explícita de Cross-Origin
            cache: 'no-cache'   // Evita usar una respuesta cacheada (fallida o no)
        });
        // --- FIN DE LA MODIFICACIÓN ---

        if (!response.ok) {
            throw new Error(`Network response was not ok, status: ${response.status}`);
        }
        
        const data = await response.json();
        const worldTimeMs = data.unixtime * 1000;
        const localTimeMs = new Date().getTime();
        
        const timeOffset = worldTimeMs - localTimeMs;
        
        console.log(`Service Worker: Sincronización exitosa. Desfase: ${timeOffset}ms.`);
        
        // Enviamos el desfase a todas las pestañas/clientes abiertos.
        broadcastTimeOffset(timeOffset);

    } catch (error) {
        console.error("Service Worker: Fallo en la sincronización de tiempo.", error);
        // Si falla, enviamos un desfase de 0 para que la app use la hora del sistema.
        broadcastTimeOffset(0);
    }
}

// Función para enviar el mensaje con el desfase a la página principal
function broadcastTimeOffset(offset) {
    self.clients.matchAll().then(clients => {
        clients.forEach(client => {
            client.postMessage({
                type: 'TIME_SYNC_UPDATE',
                payload: offset
            });
        });
    });
}