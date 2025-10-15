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
    const url = new URL(request.url);

    // --- Estrategia para la API (Stale-While-Revalidate) ---
    if (request.url.startsWith(API_URL_PREFIX)) {
        // ... (esta parte se queda igual) ...
        return; 
    }

    // --- INICIO DE LA CORRECCIÓN ---
    // --- Estrategia para Assets e Imágenes (Cache First) ---
    // Si la petición es para un archivo de imagen, fuente, o de las carpetas de assets/style
    if (
        url.pathname.match(/\.(jpg|jpeg|png|gif|svg|webp|ico)$/) ||
        url.pathname.includes('/assets/') ||
        url.pathname.includes('/style/')
    ) {
        event.respondWith(
            caches.open(CACHE_NAME_DYNAMIC).then(cache => {
                return cache.match(request).then(response => {
                    // Si lo encontramos en caché, lo devolvemos.
                    // Si no, lo pedimos a la red, lo guardamos en la caché dinámica y lo devolveemos.
                    return response || fetch(request).then(fetchResponse => {
                        cache.put(request, fetchResponse.clone());
                        return fetchResponse;
                    });
                });
            })
        );
        return;
    }
    // --- FIN DE LA CORRECCIÓN ---
    
    // --- Estrategia para los archivos estáticos principales (Cache First) ---
    // (Esta parte se queda igual)
    event.respondWith(
        caches.match(request).then(cachedResponse => {
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