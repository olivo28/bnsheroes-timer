// serviceworker.js

'use strict';

const CACHE_NAME_STATIC = 'bns-timer-static-v1';
const CACHE_NAME_DYNAMIC = 'bns-timer-dynamic-v1';

const STATIC_FILES_TO_CACHE = [
    '/',
    '/bnsheroes-timer/',
    '/index.html',
    '/style.css',
    '/manifest.json',
    '/favicon.png',
    '/js/1-utils.js',
    '/js/2-state.js',
    '/js/3-ui.js',
    '/js/4-logic.js',
    '/js/5-main.js',
    // No es necesario añadir el archivo de traduccion.js aquí
    // porque ahora lo manejaremos como parte de la lógica del SW y la app
];

// --- FASE DE INSTALACIÓN ---
self.addEventListener('install', event => {
    console.log('SW: Instalando...');
    event.waitUntil(
        caches.open(CACHE_NAME_STATIC).then(cache => {
            console.log('SW: Precargando caché estática.');
            return cache.addAll(STATIC_FILES_TO_CACHE);
        })
    );
    self.skipWaiting();
});

// --- FASE DE ACTIVACIÓN ---
self.addEventListener('activate', event => {
    console.log('SW: Activado y listo.');
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME_STATIC && cacheName !== CACHE_NAME_DYNAMIC) {
                        console.log('SW: Limpiando caché antigua:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// --- FASE DE FETCH ---
self.addEventListener('fetch', event => {
    const { request } = event;
    const url = new URL(request.url);

    // --- CAMBIO CLAVE: Ahora también interceptamos peticiones a /api/data/i18n ---
    // Estrategia Stale-While-Revalidate para TODOS los datos de la API.
    if (url.pathname.startsWith('/api/data/')) {
        event.respondWith(
            caches.open(CACHE_NAME_DYNAMIC).then(cache => {
                return cache.match(request).then(cachedResponse => {
                    const fetchPromise = fetch(request).then(networkResponse => {
                        // Importante: clona la respuesta antes de usarla
                        cache.put(request, networkResponse.clone());
                        return networkResponse;
                    }).catch(err => {
                        console.error('SW: Fallo en la petición de red para datos de API.', err);
                        // Si la red falla y no hay nada en caché, la petición fallará.
                        // Podríamos devolver una respuesta de fallback aquí si quisiéramos.
                    });

                    // Devuelve la respuesta cacheada inmediatamente si existe, si no, espera a la red.
                    return cachedResponse || fetchPromise;
                });
            })
        );
        return; // Detenemos la ejecución aquí para esta petición
    }
    
    // Estrategia Cache First para los recursos estáticos de la app.
    // Usamos `some` para ver si la URL termina con alguna de nuestras rutas cacheadas.
    if (STATIC_FILES_TO_CACHE.some(path => url.pathname === path || (path === '/' && url.pathname === '/index.html'))) {
        event.respondWith(
            caches.match(request).then(cachedResponse => {
                return cachedResponse || fetch(request);
            })
        );
        return; // Detenemos la ejecución
    }

    // Para todas las demás peticiones (ej. a CDNs, API de Discord), simplemente déjalas pasar.
    // No es necesario un return explícito, ya que por defecto el navegador maneja el fetch.
});


// --- MANEJO DE NOTIFICACIONES PUSH ---
self.addEventListener('push', event => {
    // ----- INICIO DE LA DEPURACIÓN -----
    console.log('SW: ¡Evento PUSH recibido!');
    console.log('SW: Datos del evento:', event.data);
    // ----- FIN DE LA DEPURACIÓN -----

    let data = {};
    try {
        data = event.data.json();
        console.log('SW: Payload JSON procesado:', data);
    } catch (e) {
        console.log('SW: No se pudo procesar como JSON, usando .text()');
        data = { title: 'Notificación', body: event.data.text() };
    }

    const title = data.title || 'Alerta de BnS Heroes';
    const options = {
        body: data.body || '¡Algo importante está a punto de suceder!',
        // --- CAMBIO CLAVE: Usar .png para máxima compatibilidad ---
        icon: '/favicon.png', // Usamos el favicon.png que es más estándar
        badge: '/favicon.png'
    };

    console.log('SW: Mostrando notificación con título:', title, 'y opciones:', options);

    event.waitUntil(
        self.registration.showNotification(title, options)
            .then(() => console.log('SW: showNotification ejecutado con éxito.'))
            .catch(err => console.error('SW: Error al ejecutar showNotification:', err))
    );
});