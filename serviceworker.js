// serviceworker.js

'use strict';

const CACHE_NAME_STATIC = 'bns-timer-static-v1';
const CACHE_NAME_DYNAMIC = 'bns-timer-dynamic-v1';
const API_URL_PREFIX = 'https://pcnetfs.moe/api-bns-heroes-timers/api/';

// Lista de archivos estáticos a cachear durante la instalación.
const STATIC_FILES_TO_CACHE = [
    // La ruta base de GitHub Pages es importante.
    // Si tu repo es olivo28.github.io/bnsheroes-timer, la raíz es '/bnsheroes-timer/'
    '/bnsheroes-timer/',
    '/bnsheroes-timer/index.html',
    '/bnsheroes-timer/style.css',
    '/bnsheroes-timer/manifest.json',
    '/bnsheroes-timer/favicon.png',
    '/bnsheroes-timer/js/1-utils.js',
    '/bnsheroes-timer/js/2-state.js',
    '/bnsheroes-timer/js/3-ui.js',
    '/bnsheroes-timer/js/4-logic.js',
    '/bnsheroes-timer/js/5-main.js'
];

// --- FASE DE INSTALACIÓN ---
// Se ejecuta cuando el Service Worker se instala por primera vez.
self.addEventListener('install', event => {
    console.log('SW: Instalando...');
    event.waitUntil(
        caches.open(CACHE_NAME_STATIC).then(cache => {
            console.log('SW: Precargando caché estática.');
            // Usamos addAll para cachear todos los archivos estáticos.
            // Si alguno falla, la instalación entera falla.
            return cache.addAll(STATIC_FILES_TO_CACHE);
        })
    );
    self.skipWaiting();
});

// --- FASE DE ACTIVACIÓN ---
// Se ejecuta después de la instalación y cuando una nueva versión del SW reemplaza a una antigua.
self.addEventListener('activate', event => {
    console.log('SW: Activado y listo.');
    event.waitUntil(
        // Limpiamos las cachés antiguas para evitar conflictos.
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME_STATIC && cacheName !== CACHE_NAME_DYNAMIC) {
                        console.log('SW: Limpiando caché antigua:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => self.clients.claim()) // Toma control inmediato de todas las pestañas abiertas.
    );
});

// --- FASE DE FETCH ---
// Intercepta todas las peticiones de red de la página.
self.addEventListener('fetch', event => {
    const { request } = event;

    // --- Estrategia para las peticiones a la API (Stale-While-Revalidate) ---
    // Si la petición es para nuestra API...
    if (request.url.startsWith(API_URL_PREFIX)) {
        event.respondWith(
            caches.open(CACHE_NAME_DYNAMIC).then(cache => {
                // Primero, intenta servir desde la caché.
                return cache.match(request).then(cachedResponse => {
                    // En paralelo, siempre intenta obtener una versión fresca de la red.
                    const fetchPromise = fetch(request, { mode: 'cors' }) // <-- ¡LA CORRECCIÓN CLAVE!
                        .then(networkResponse => {
                            // Si la petición de red es exitosa, la guardamos en caché para la próxima vez.
                            cache.put(request, networkResponse.clone());
                            return networkResponse;
                        })
                        .catch(err => {
                            console.error('SW: Fallo en la petición de red para la API.', err);
                            // Si la red falla pero tenemos algo en caché, ya lo hemos devuelto.
                            // Si no, la promesa se rechazará y el navegador mostrará el error de red.
                        });

                    // Devuelve la respuesta cacheada inmediatamente si existe, si no, espera a la red.
                    // Esto permite que la app cargue instantáneamente con datos antiguos mientras se actualiza en segundo plano.
                    return cachedResponse || fetchPromise;
                });
            })
        );
        return; // Detenemos la ejecución aquí para esta petición.
    }
    
    // --- Estrategia para los archivos estáticos de la app (Cache First) ---
    // Si la petición es para uno de nuestros archivos estáticos...
    event.respondWith(
        caches.match(request).then(cachedResponse => {
            // Devuelve el archivo desde la caché si existe.
            // Si no existe en caché (lo cual es raro si la instalación fue exitosa),
            // intenta obtenerlo de la red.
            return cachedResponse || fetch(request);
        })
    );
});

// --- MANEJO DE NOTIFICACIONES PUSH ---
self.addEventListener('push', event => {
    console.log('SW: ¡Evento PUSH recibido!');
    
    let data = { title: 'Notificación', body: 'Tienes una nueva alerta.' };
    try {
        if (event.data) {
            data = event.data.json();
        }
    } catch (e) {
        console.error('SW: No se pudo procesar el payload push como JSON.');
        if (event.data) {
           data.body = event.data.text();
        }
    }

    const title = data.title || 'Alerta de BnS Heroes';
    const options = {
        body: data.body || '¡Algo importante está a punto de suceder!',
        icon: '/bnsheroes-timer/favicon.png', // Usa la ruta completa para el icono
        badge: '/bnsheroes-timer/favicon.png'
    };

    event.waitUntil(
        self.registration.showNotification(title, options)
    );
});