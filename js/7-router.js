import Compendium from './6-compendium.js';
import UI from './3-ui.js';

const Router = {
    views: {
        'view-hub': { loaded: true, init: null },
        'view-heroes': { loaded: false, url: 'views/compendium.html', module: Compendium }
    },

    activeView: 'view-hub',

    init: function() {
        this.setupNavigation();
        // Verificamos si hay parámetros en la URL al cargar
        this.handleDeepLinks();
    },

    setupNavigation: function() {
        const navLinks = document.querySelectorAll('.main-nav .nav-link');
        
        navLinks.forEach(link => {
            link.addEventListener('click', async (e) => {
                e.preventDefault();
                const targetId = link.dataset.target;
                
                // Actualizar URL visualmente sin recargar (opcional, para limpieza)
                const newUrl = new URL(window.location);
                newUrl.searchParams.delete('teamId');
                newUrl.searchParams.delete('view');
                window.history.pushState({}, '', newUrl);

                if (targetId === this.activeView) return;

                navLinks.forEach(btn => btn.classList.remove('active'));
                link.classList.add('active');

                await this.switchView(targetId);
            });
        });
    },

    // --- NUEVO: Manejo de Links ---
    handleDeepLinks: function() {
        const params = new URLSearchParams(window.location.search);
        const navLinks = document.querySelectorAll('.main-nav .nav-link');

        // Caso 1: ?teamId=XYZ (Prioridad máxima) -> Abre Builder y carga equipo
        if (params.has('teamId')) {
            const teamId = params.get('teamId');
            this.updateNavUI('view-heroes');
            this.switchView('view-heroes', { subView: 'team-builder', teamId: teamId });
        }
        // Caso 2: ?view=builder -> Abre Builder vacío
        else if (params.get('view') === 'builder') {
            this.updateNavUI('view-heroes');
            this.switchView('view-heroes', { subView: 'team-builder' });
        }

        // Caso 3: ?view=my-teams -> Abre Lista de Equipos
        else if (params.get('view') === 'my-teams') {
            this.updateNavUI('view-heroes');
            this.switchView('view-heroes', { subView: 'my-teams' });
        }

        // Caso 4: ?view=heroes -> Abre Lista de Héroes
        else if (params.get('view') === 'heroes') {
            this.updateNavUI('view-heroes');
            this.switchView('view-heroes', { subView: 'heroes-list' });
        }
        // Default: HUB (Ya está configurado por defecto, solo aseguramos el layout)
        else {
            this.updateBodyLayout('view-hub');
        }
    },

    updateNavUI: function(targetId) {
        document.querySelectorAll('.main-nav .nav-link').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.target === targetId);
        });
    },

    // Modificado para aceptar 'context' (datos extra)
    switchView: async function(viewId, context = null) {
        const prevView = this.activeView;
        
        if (prevView === 'view-hub') UI.closeAllDetailsPanels();
        // Si cambiamos de vista y NO hay contexto (navegación normal), reseteamos.
        // Si HAY contexto (deep link), NO reseteamos aquí, el módulo manejará los datos.
        if (prevView === 'view-heroes' && Compendium.isInitialized && !context) {
            Compendium.reset();
        }

        document.getElementById(prevView).classList.add('hidden');
        const container = document.getElementById(viewId);
        const config = this.views[viewId];

        this.updateBodyLayout(viewId);

        if (!config.loaded && config.url) {
            try {
                const response = await fetch(config.url);
                if (!response.ok) throw new Error('Error loading view');
                container.innerHTML = await response.text();
                config.loaded = true;
                
                if (config.module) {
                    // Pasar el contexto al init
                    config.module.init(context);
                }
                UI.applyLanguage();
            } catch (error) {
                console.error("Router Error:", error);
            }
        } else {
            // Si ya estaba cargado, le pasamos el contexto al módulo
            if (config.module && typeof config.module.handleContext === 'function') {
                config.module.handleContext(context);
            }
        }

        container.classList.remove('hidden');
        this.activeView = viewId;
        
        // Si no es un deep link de carga, scrollear arriba
        if (!context || !context.teamId) {
            window.scrollTo(0,0);
        }
    },

    updateBodyLayout: function(viewId) {
        if (viewId === 'view-heroes') {
            document.body.classList.add('compendium-active');
        } else {
            document.body.classList.remove('compendium-active');
        }
    }
};

export default Router;