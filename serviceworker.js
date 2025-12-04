'use strict';

const CACHE_NAME_STATIC = 'bns-timer-static-v3.15';
const CACHE_NAME_DYNAMIC = 'bns-timer-dynamic-v3.15';
const API_URL_PREFIX = 'https://bnsheroes.pcnetfs.moe/api/';

// --- INICIO DE LA CORRECCIÓN UNIVERSAL ---
// 'self.location.hostname' nos dice el dominio donde corre el SW.
const isLocalhost = self.location.hostname === 'localhost' || self.location.hostname === '127.0.0.1';

// Si es localhost, la ruta base es la raíz. Si no, es la de GitHub Pages.
const BASE_PATH = isLocalhost ? '' : '/bnsheroes-timer';
// --- FIN DE LA CORRECCIÓN UNIVERSAL ---

const STATIC_FILES_TO_CACHE = [
    `${BASE_PATH}/`,
    `${BASE_PATH}/index.html`,
    `${BASE_PATH}/roadmap.html`,
    `${BASE_PATH}/roadmap.css`,
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

    // Ignoramos peticiones que no sean GET
    if (request.method !== 'GET') {
        return;
    }

    // --- ESTRATEGIAS DE CACHÉ ESPECÍFICAS ---

    // Estrategia 1: API (Network First, Cache Fallback)
    if (url.href.startsWith(API_URL_PREFIX)) {
        event.respondWith(
            fetch(request, { mode: 'cors' })
                .then(networkResponse => {
                    if (networkResponse && networkResponse.ok) {
                        const cacheCopy = networkResponse.clone();
                        caches.open(CACHE_NAME_DYNAMIC).then(cache => {
                            cache.put(request, cacheCopy);
                        });
                    }
                    return networkResponse;
                }).catch(() => caches.match(request))
        );
        return;
    }

    // Estrategia 2: Archivos estáticos principales (Cache First, Network Fallback)
    // Esto es más seguro que "Cache Only" por si algo falla.
    if (STATIC_FILES_TO_CACHE.some(file => url.pathname.endsWith(file))) {
        event.respondWith(
            caches.match(request)
                .then(cachedResponse => {
                    return cachedResponse || fetch(request);
                })
        );
        return;
    }

    // Estrategia 3 (Catch-all): Para todo lo demás (imágenes de /assets/, etc.),
    // simplemente realiza la petición a la red. NO se guarda en la caché del Service Worker.
    // Esto deja que el navegador use su caché HTTP normal para estas imágenes.
    event.respondWith(fetch(request));
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