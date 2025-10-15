'use strict';

const CACHE_NAME_STATIC = 'bns-timer-static-v3.2';
const CACHE_NAME_DYNAMIC = 'bns-timer-dynamic-v3.2';
const API_URL_PREFIX = 'https://pcnetfs.moe/api-bns-heroes-timers/api/';

// --- INICIO DE LA CORRECCIÓN UNIVERSAL ---
// 'self.location.hostname' nos dice el dominio donde corre el SW.
const isLocalhost = self.location.hostname === 'localhost' || self.location.hostname === '127.0.0.1';

// Si es localhost, la ruta base es la raíz. Si no, es la de GitHub Pages.
const BASE_PATH = isLocalhost ? '' : '/bnsheroes-timer';
// --- FIN DE LA CORRECCIÓN UNIVERSAL ---

const STATIC_FILES_TO_CACHE = [
    `${BASE_PATH}/`,
    `${BASE_PATH}/index.html`,
    `${BASE_PATH}/style.css`,
    `${BASE_PATH}/manifest.json`,
    `${BASE_PATH}/favicon.png`,
    `${BASE_PATH}/js/1-utils.js`,
    `${BASE_PATH}/js/2-state.js`,
    `${BASE_PATH}/js/3-ui.js`,
    `${BASE_PATH}/js/4-logic.js`,
    `${BASE_PATH}/js/5-main.js`
];

// --- FASE DE INSTALACIÓN ---
self.addEventListener('install', event => {
    console.log(`SW: Instalando en ${isLocalhost ? 'localhost' : 'producción'}...`);
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

    // Estrategia 1: API (Network First, Cache Fallback)
    if (request.url.startsWith(API_URL_PREFIX)) {
        event.respondWith(
            fetch(request, { mode: 'cors' })
                .then(networkResponse => {
                    const cacheCopy = networkResponse.clone();
                    caches.open(CACHE_NAME_DYNAMIC).then(cache => {
                        cache.put(request, cacheCopy);
                    });
                    return networkResponse;
                }).catch(() => caches.match(request))
        );
        return;
    }

    // --- INICIO DE LA CORRECCIÓN ---
    // Estrategia 2: Documento HTML principal (Network First, Cache Fallback)
    // Esto asegura que siempre obtengas el HTML más reciente.
    if (request.mode === 'navigate') {
        event.respondWith(
            fetch(request)
                .then(networkResponse => {
                    // Si la red funciona, actualizamos la caché estática con el nuevo index.html
                    const cacheCopy = networkResponse.clone();
                    caches.open(CACHE_NAME_STATIC).then(cache => {
                        cache.put(request, cacheCopy);
                    });
                    return networkResponse;
                })
                .catch(() => {
                    // Si la red falla, servimos el index.html desde la caché (para modo offline).
                    return caches.match(`${BASE_PATH}/index.html`);
                })
        );
        return;
    }
    // --- FIN DE LA CORRECCIÓN ---

    // Estrategia 3: Assets y otros archivos (Cache First)
    // Para CSS, JS, imágenes, etc., la caché es la prioridad.
    event.respondWith(
        caches.match(request).then(cachedResponse => {
            return cachedResponse || fetch(request).then(networkResponse => {
                const responseToCache = networkResponse.clone();
                caches.open(CACHE_NAME_DYNAMIC).then(cache => {
                    cache.put(request, responseToCache);
                });
                return networkResponse;
            });
        })
    );
});

// --- MANEJO DE NOTIFICACIONES PUSH ---
self.addEventListener('push', event => {
    console.log('SW: ¡Evento PUSH recibido!');
    
    let data = { title: 'Notificación', body: 'Tienes una nueva alerta.' };
    try {
        if (event.data) { data = event.data.json(); }
    } catch (e) {
        if (event.data) { data.body = event.data.text(); }
    }

    const title = data.title || 'Alerta de BnS Heroes';
    const options = {
        body: data.body || '¡Algo importante está a punto de suceder!',
        icon: `${BASE_PATH}/favicon.png`,
        badge: `${BASE_PATH}/favicon.png`
    };

    event.waitUntil(
        self.registration.showNotification(title, options)
    );
});