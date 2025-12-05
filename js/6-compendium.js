import App from './2-state.js';
import Utils from './1-utils.js';
import Logic from './4-logic.js';
import UI from './3-ui.js';

const Compendium = {
    // --- ESTADO GENERAL ---
    
    filters: {
        search: '',
        element: null,
        role: null,
        rarity: null
    },
    
    pagination: {
        currentPage: 1,
        itemsPerPage: 40,
        totalItems: 0,
        totalPages: 0
    },

    currentFilteredHeroes: [],
    
    // Estado del Team Builder
    builder: {
        // Array de 7 espacios (0-4: Main, 5-6: Subs)
        currentTeam: [null, null, null, null, null, null, null], 
        currentTeamId: null,      
        selectedSlot: null,       
        filterSearch: '',         
        currentNotes: '', 
        autocompleteStartIndex: -1, 
        filters: { element: null, role: null, rarity: null } 
    },

    // Estado de Mis Equipos
    myTeams: {
        allData: [],        
        filteredData: [],   
        filters: { 
            search: '', 
            type: 'all',      
            element: null     
        },
        pagination: { currentPage: 1, itemsPerPage: 12, totalItems: 0, totalPages: 0 }
    },

    isInitialized: false,

    // --- INICIALIZACIÓN ---
    init: function(context = null) {
        if (this.isInitialized) {
            if (context) this.handleContext(context);
            return;
        }
        
        console.log("Compendium: Initializing...");
        
        this.renderFilters(); 
        this.setupListeners();
        this.applyFilters(); 

        this.renderBuilderFilters();
        this.setupBuilderListeners();
        this.renderBuilderGrid();

        this.renderMyTeamsFilters();
        this.setupMyTeamsListeners();
        
        this.isInitialized = true;

        if (context) {
            this.handleContext(context);
        }
    },

    handleContext: function(context) {
        if (!context) return;

        this._resetData(); 

        if (context.subView) {
            this.switchSubView(context.subView, false); 
        }

        if (context.teamId) {
            console.log(`Deep Link: Loading Team ID ${context.teamId}`);
            this.loadTeam(context.teamId);
        }
    },

    _resetData: function() {
        this.filters = { search: '', element: null, role: null, rarity: null };
        this.pagination.currentPage = 1;
        const s1 = document.getElementById('hero-search'); if(s1) s1.value = '';
        this.renderFilters();
        this.applyFilters();

        this.clearTeam();

        this.myTeams.filters = { search: '', type: 'all', element: null };
        this.myTeams.pagination.currentPage = 1;
        const mtSearch = document.getElementById('my-teams-search'); if(mtSearch) mtSearch.value = '';
        
        this.renderBuilderFilters();
        this.renderBuilderGrid();
        this.renderMyTeamsFilters();
    },

    reset: function() {
        if (!this.isInitialized) return;
        this._resetData();
        this.switchSubView('heroes-list', false);
    },

    refresh: function() {
        if (!this.isInitialized) return;
        
        this.renderFilters(); 
        this.applyFilters();
        this.renderBuilderFilters();
        this.renderBuilderGrid();
        this.renderMyTeamsFilters();
        
        const myTeamsView = document.getElementById('subview-my-teams');
        if (myTeamsView && !myTeamsView.classList.contains('hidden')) {
            this.applyMyTeamsFilters();
        }
        
        document.querySelectorAll('.compendium-layout [data-lang-placeholder]').forEach(el => {
            const key = el.dataset.langPlaceholder;
            const text = Utils.getText(key);
            if (text !== key) el.placeholder = text;
        });

        // Refrescar label de notas si existe
        const label = document.getElementById('notes-preview-label');
        if(label) {
            const isViewMode = document.querySelector('.notes-section-container')?.classList.contains('view-mode');
            const key = isViewMode ? 'teamBuilder.notesLabel' : 'teamBuilder.previewLabel';
            label.textContent = Utils.getText(key);
        }
    },

    switchSubView: function(viewId, doReset = true) {
        if (doReset) this._resetData();

        document.querySelectorAll('.sidebar-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.subview === viewId);
        });
        document.querySelectorAll('.subview').forEach(view => {
            const isActive = view.id === `subview-${viewId}`;
            view.classList.toggle('active', isActive);
            view.classList.toggle('hidden', !isActive);
        });

        if (viewId === 'team-builder') {
            this.renderBuilderGrid();
        } else if (viewId === 'my-teams') {
            this.fetchMyTeams();
        } else {
            this.selectSlot(null);
        }
    },

    // =========================================================
    // ============ SECCIÓN 1: LISTA DE HÉROES =================
    // =========================================================

    _renderGenericFilters: function(elContainerId, roleContainerId, rarityContainerId, filterState) {
        const elements = ['fire', 'water', 'poison', 'lightning', 'dark', 'typeless'];
        const elContainer = document.getElementById(elContainerId);
        if (elContainer) {
            elContainer.innerHTML = '';
            elements.forEach(el => {
                const btn = document.createElement('button');
                btn.className = `filter-btn ${filterState.element === el ? 'active' : ''}`;
                btn.dataset.type = 'element';
                btn.dataset.value = el;
                const elementName = Utils.getText(`hero.elements.${el}`);
                btn.title = elementName;
                btn.innerHTML = `<img src="assets/elements/${el}_icon.png" alt="${elementName}">`;
                elContainer.appendChild(btn);
            });
        }
        const roles = ['attacker', 'defender', 'supporter', 'tactician'];
        const roleContainer = document.getElementById(roleContainerId);
        if (roleContainer) {
            roleContainer.innerHTML = '';
            roles.forEach(role => {
                const btn = document.createElement('button');
                btn.className = `filter-btn ${filterState.role === role ? 'active' : ''}`;
                btn.dataset.type = 'role';
                btn.dataset.value = role;
                const roleKey = 'hero.role' + role.charAt(0).toUpperCase() + role.slice(1);
                const roleName = Utils.getText(roleKey);
                btn.title = roleName;
                btn.innerHTML = `<img src="assets/roles/${role}_icon.png" alt="${roleName}">`;
                roleContainer.appendChild(btn);
            });
        }
        const rarityContainer = document.getElementById(rarityContainerId);
        if (rarityContainer) {
            const rarities = [3, 2, 1];
            rarityContainer.innerHTML = '';
            rarities.forEach(r => {
                const btn = document.createElement('button');
                btn.className = `filter-btn text-filter-btn rarity-text-${r} ${filterState.rarity == r ? 'active' : ''}`;
                btn.dataset.type = 'rarity';
                btn.dataset.value = r;
                const rarityName = Utils.getText(`hero.rarity${r}`);
                btn.title = rarityName;
                btn.textContent = '★'.repeat(r);
                rarityContainer.appendChild(btn);
            });
        }
    },

    renderFilters: function() {
        this._renderGenericFilters('element-filters', 'role-filters', 'rarity-filters', this.filters);
    },

    setupListeners: function() {
        const searchInput = document.getElementById('hero-search');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.filters.search = e.target.value.toLowerCase();
                this.pagination.currentPage = 1;
                this.applyFilters();
            });
        }

        const filterRows = document.querySelector('.filters-panel .filter-toggles-row');
        if (filterRows) {
            filterRows.addEventListener('click', (e) => {
                const btn = e.target.closest('.filter-btn');
                if (!btn) return;

                const type = btn.dataset.type;
                const value = btn.dataset.value;

                if (this.filters[type] == value) this.filters[type] = null;
                else this.filters[type] = value;
                
                this.pagination.currentPage = 1;
                this.renderFilters();
                this.applyFilters();
            });
        }

        const grid = document.getElementById('heroes-grid');
        if (grid) {
            grid.addEventListener('click', (e) => {
                const card = e.target.closest('.compendium-card');
                if (card) {
                    const heroName = card.dataset.heroName;
                    const heroData = Logic.findHeroByName(heroName);
                    if (heroData) {
                        UI.openHeroModal(heroData, [], -1);
                    }
                }
            });
        }
    },

    applyFilters: function() {
        this.currentFilteredHeroes = (App.state.allHeroesData || []).filter(h => {
            if (!h.available) return false;
            
            if (this.filters.search && !h.game_name.toLowerCase().includes(this.filters.search)) return false;
            if (this.filters.element && h.element !== this.filters.element) return false;
            if (this.filters.role && h.role !== this.filters.role) return false;
            if (this.filters.rarity && h.rarity != this.filters.rarity) return false;
            
            return true;
        });

        this.currentFilteredHeroes.sort((a, b) => {
            if (a.rarity !== b.rarity) return b.rarity - a.rarity;
            return a.game_name.localeCompare(b.game_name);
        });

        this.pagination.totalItems = this.currentFilteredHeroes.length;
        this.pagination.totalPages = Math.ceil(this.pagination.totalItems / this.pagination.itemsPerPage);

        if (this.pagination.currentPage > this.pagination.totalPages) {
            this.pagination.currentPage = this.pagination.totalPages || 1;
        }

        this.renderGrid();
    },

    renderGrid: function() {
        const grid = document.getElementById('heroes-grid');
        const countLabel = document.getElementById('heroes-count-label');
        if (!grid) return;

        grid.innerHTML = '';

        if (countLabel) {
            countLabel.textContent = Utils.getText('compendium.countLabel', { count: this.pagination.totalItems });
        }

        const start = (this.pagination.currentPage - 1) * this.pagination.itemsPerPage;
        const end = start + this.pagination.itemsPerPage;
        const heroesToShow = this.currentFilteredHeroes.slice(start, end);

        const fragment = document.createDocumentFragment();

        heroesToShow.forEach(h => {
            const card = document.createElement('div');
            card.className = `compendium-card rarity-${h.rarity}`;
            card.dataset.heroName = h.game_name;
            
            const imgPath = `assets/heroes_icon/${h.short_image}`;
            const elName = Utils.getText(`hero.elements.${h.element}`);
            const roleNameKey = 'hero.role' + h.role.charAt(0).toUpperCase() + h.role.slice(1);
            const roleName = Utils.getText(roleNameKey);

            card.innerHTML = `
                <div class="card-image-wrapper">
                    <img src="${imgPath}" alt="${h.game_name}" class="card-hero-img" loading="lazy">
                    <div class="card-icons">
                         <img src="assets/elements/${h.element}_icon.png" class="mini-icon" title="${elName}">
                         <img src="assets/roles/${h.role}_icon.png" class="mini-icon" title="${roleName}">
                    </div>
                    <div class="card-overlay">
                        <span class="card-name">${h.game_name}</span>
                    </div>
                </div>
            `;
            fragment.appendChild(card);
        });
        
        grid.appendChild(fragment);
        this.renderPaginationControls();
    },

    renderPaginationControls: function() {
        let container = document.getElementById('pagination-controls');
        if (!container) {
            container = document.createElement('div');
            container.id = 'pagination-controls';
            container.className = 'pagination-controls';
            document.querySelector('#subview-heroes-list').appendChild(container);
        }
        
        container.innerHTML = '';

        if (this.pagination.totalPages <= 1) return;

        const prevBtn = document.createElement('button');
        prevBtn.className = 'pagination-btn';
        prevBtn.innerHTML = '&laquo;';
        prevBtn.disabled = this.pagination.currentPage === 1;
        prevBtn.onclick = () => this.changePage(this.pagination.currentPage - 1);
        container.appendChild(prevBtn);

        const info = document.createElement('span');
        info.className = 'pagination-info';
        info.textContent = `${this.pagination.currentPage} / ${this.pagination.totalPages}`;
        container.appendChild(info);

        const nextBtn = document.createElement('button');
        nextBtn.className = 'pagination-btn';
        nextBtn.innerHTML = '&raquo;';
        nextBtn.disabled = this.pagination.currentPage === this.pagination.totalPages;
        nextBtn.onclick = () => this.changePage(this.pagination.currentPage + 1);
        container.appendChild(nextBtn);
    },

    changePage: function(newPage) {
        if (newPage < 1 || newPage > this.pagination.totalPages) return;
        this.pagination.currentPage = newPage;
        this.renderGrid();
        const filtersPanel = document.querySelector('.filters-panel');
        if (filtersPanel) filtersPanel.scrollIntoView({ behavior: 'smooth' });
    },

    // =========================================================
    // ============ SECCIÓN 2: TEAM BUILDER ====================
    // =========================================================

    renderBuilderFilters: function() {
        this._renderGenericFilters('builder-element-filters', 'builder-role-filters', 'builder-rarity-filters', this.builder.filters);
    },

    setupBuilderListeners: function() {
        const sidebar = document.querySelector('.sidebar-menu');
        if (sidebar) {
            sidebar.addEventListener('click', (e) => {
                const btn = e.target.closest('.sidebar-btn');
                if(btn) this.switchSubView(btn.dataset.subview);
            });
        }

        // --- Listeners de Slots ---
        const slots = document.querySelectorAll('.team-slot');
        slots.forEach(slot => {
            slot.addEventListener('click', (e) => {
                if(e.target.classList.contains('remove-hero-btn')) return;
                this.selectSlot(parseInt(slot.dataset.slot));
            });
            slot.addEventListener('dragover', (e) => { e.preventDefault(); slot.classList.add('drag-over'); });
            slot.addEventListener('dragleave', () => slot.classList.remove('drag-over'));
            slot.addEventListener('drop', (e) => this.handleDrop(e, slot));
            const removeBtn = slot.querySelector('.remove-hero-btn');
            if(removeBtn) {
                removeBtn.addEventListener('click', (e) => {
                    e.stopPropagation(); 
                    this.removeHeroFromSlot(parseInt(slot.dataset.slot));
                });
            }
        });

        // --- Listener de Búsqueda ---
        const builderSearch = document.getElementById('builder-hero-search');
        if(builderSearch) {
            builderSearch.addEventListener('input', (e) => {
                this.builder.filterSearch = e.target.value.toLowerCase();
                this.renderBuilderGrid();
            });
        }

        // --- Listener Filtros ---
        const builderFilterRow = document.getElementById('builder-filter-row');
        if (builderFilterRow) {
            builderFilterRow.addEventListener('click', (e) => {
                const btn = e.target.closest('.filter-btn');
                if (!btn) return;
                const type = btn.dataset.type;
                const value = btn.dataset.value;
                if (this.builder.filters[type] == value) this.builder.filters[type] = null;
                else this.builder.filters[type] = value;
                this.renderBuilderFilters();
                this.renderBuilderGrid();
            });
        }

        // --- Listener para Tipo de Equipo ---
        const typeSelect = document.getElementById('team-type-select');
        if (typeSelect) {
            typeSelect.addEventListener('change', () => {
                this.toggleSubsVisibility();
            });
        }

        // --- Listener Pestañas Notas ---
        const tabButtons = document.querySelectorAll('.note-tab');
        tabButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                tabButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                const mode = btn.dataset.mode;
                const writeArea = document.getElementById('note-write-area');
                const previewArea = document.getElementById('note-preview-area');

                if (mode === 'write') {
                    writeArea.classList.remove('hidden');
                    previewArea.classList.add('hidden');
                } else {
                    // Modo Preview: Renderizar
                    writeArea.classList.add('hidden');
                    previewArea.classList.remove('hidden');
                    this.renderNotesPreview();
                }
            });
        });

        // --- Listener Input Notas y Autocompletado ---
        const notesInput = document.getElementById('team-notes-input');
        const autocompleteList = document.getElementById('notes-autocomplete-list');

        if (notesInput) {
            notesInput.addEventListener('input', (e) => {
                this.builder.currentNotes = e.target.value;
                
                // Autocompletado
                const cursorPosition = notesInput.selectionStart;
                const textUpToCursor = notesInput.value.substring(0, cursorPosition);
                const lastBracket = textUpToCursor.lastIndexOf('[');
                
                if (lastBracket !== -1) {
                    const query = textUpToCursor.substring(lastBracket + 1).toLowerCase();
                    if (!query.includes(']')) {
                        this.showHeroAutocomplete(query, lastBracket);
                        return;
                    }
                }
                
                if (autocompleteList) autocompleteList.classList.add('hidden');
            });

            notesInput.addEventListener('keydown', (e) => {
                if (autocompleteList && !autocompleteList.classList.contains('hidden')) {
                    if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter') {
                        e.preventDefault();
                        this.navigateAutocomplete(e.key);
                    } else if (e.key === 'Escape') {
                        autocompleteList.classList.add('hidden');
                    }
                }
            });
            
            document.addEventListener('click', (e) => {
                if (autocompleteList && e.target !== notesInput && !autocompleteList.contains(e.target)) {
                    autocompleteList.classList.add('hidden');
                }
            });
        }

        // --- Botones de Acción ---
        const saveBtn = document.getElementById('btn-save-team');
        if (saveBtn) saveBtn.addEventListener('click', () => this.saveTeam());
        const clearBtn = document.getElementById('btn-clear-team');
        if (clearBtn) clearBtn.addEventListener('click', () => this.clearTeam());
        const loadBtn = document.getElementById('btn-load-team');
        if (loadBtn) loadBtn.addEventListener('click', () => {
            const id = document.getElementById('team-share-code').value;
            if(id) this.loadTeam(id);
        });
    },

    // --- FUNCIONES DE SUBS Y NOTAS ---

    toggleSubsVisibility: function() {
        const typeSelect = document.getElementById('team-type-select');
        const subsRow = document.getElementById('subs-row');
        
        if (typeSelect && subsRow) {
            if (typeSelect.value === 'tactic') {
                subsRow.classList.remove('hidden');
            } else {
                subsRow.classList.add('hidden');
                this.removeHeroFromSlot(5);
                this.removeHeroFromSlot(6);
            }
        }
    },

    renderNotesPreview: function() {
        const previewEl = document.getElementById('note-preview-area');
        if (!previewEl) return;
        
        let rawText = this.builder.currentNotes || '';
        
        // Escapar HTML para seguridad
        const escapeHtml = (unsafe) => {
            return unsafe
                 .replace(/&/g, "&amp;")
                 .replace(/</g, "&lt;")
                 .replace(/>/g, "&gt;")
                 .replace(/"/g, "&quot;")
                 .replace(/'/g, "&#039;");
        }
        
        let safeText = escapeHtml(rawText);

        // Highlight de Héroes: [Nombre] -> Img + Dorado
        let formatted = safeText.replace(/\[([^\]]+)\](?!\()/g, (match, heroName) => {
            const heroData = Logic.findHeroByName(heroName);
            let iconHtml = '';
            
            if (heroData) {
                const imgPath = `assets/heroes_icon/${heroData.short_image}`;
                iconHtml = `<img src="${imgPath}" class="note-hero-icon" alt="${heroName}" loading="lazy">`;
            }
            
            return `${iconHtml}<span class="highlight-bracket">${heroName}</span>`;
        });
        
        previewEl.innerHTML = formatted;
    },

    // --- FUNCIONES DE AUTOCOMPLETADO ---

    showHeroAutocomplete: function(query, startIndex) {
        const list = document.getElementById('notes-autocomplete-list');
        if (!list) return;

        const matches = (App.state.allHeroesData || []).filter(h => 
            h.game_name.toLowerCase().startsWith(query)
        ).slice(0, 5); 

        if (matches.length === 0) {
            list.classList.add('hidden');
            return;
        }

        list.innerHTML = '';
        matches.forEach((h, index) => {
            const item = document.createElement('li');
            item.className = 'autocomplete-item';
            if (index === 0) item.classList.add('selected');
            
            item.innerHTML = `
                <img src="assets/heroes_icon/${h.short_image}">
                <span>${h.game_name}</span>
            `;
            
            item.addEventListener('click', () => {
                this.insertAutocomplete(h.game_name, startIndex);
            });
            
            list.appendChild(item);
        });

        list.classList.remove('hidden');
        this.builder.autocompleteStartIndex = startIndex; 
    },

    insertAutocomplete: function(heroName, startIndex) {
        const input = document.getElementById('team-notes-input');
        const list = document.getElementById('notes-autocomplete-list');
        if (!input || !list) return;

        const fullText = input.value;
        const before = fullText.substring(0, startIndex);
        const cursorStr = input.selectionStart;
        const after = fullText.substring(cursorStr); 
        
        const newText = `${before}[${heroName}] ${after}`;
        
        input.value = newText;
        this.builder.currentNotes = newText;
        
        list.classList.add('hidden');
        input.focus();
    },

    navigateAutocomplete: function(key) {
        const list = document.getElementById('notes-autocomplete-list');
        const items = list.querySelectorAll('.autocomplete-item');
        let activeIndex = -1;
        
        items.forEach((item, index) => {
            if (item.classList.contains('selected')) activeIndex = index;
            item.classList.remove('selected');
        });

        if (key === 'ArrowDown') {
            activeIndex = (activeIndex + 1) % items.length;
        } else if (key === 'ArrowUp') {
            activeIndex = (activeIndex - 1 + items.length) % items.length;
        } else if (key === 'Enter') {
            if (activeIndex > -1) items[activeIndex].click();
            return;
        }

        if (items[activeIndex]) items[activeIndex].classList.add('selected');
    },

    // --- RENDER DEL GRID Y SLOTS ---

    renderBuilderGrid: function() {
        const grid = document.getElementById('builder-heroes-grid');
        if(!grid) return;
        grid.innerHTML = '';

        const heroes = (App.state.allHeroesData || []).filter(h => {
            if(!h.available) return false;
            if (this.builder.currentTeam.includes(h.game_name)) return false;
            if(this.builder.filterSearch && !h.game_name.toLowerCase().includes(this.builder.filterSearch)) return false;
            const f = this.builder.filters;
            if(f.element && h.element !== f.element) return false;
            if(f.role && h.role !== f.role) return false;
            if(f.rarity && h.rarity != f.rarity) return false;
            return true;
        });

        heroes.sort((a, b) => b.rarity - a.rarity);

        const fragment = document.createDocumentFragment();
        heroes.forEach(h => {
            const card = document.createElement('div');
            card.className = `compendium-card rarity-${h.rarity}`;
            card.draggable = true;
            card.dataset.heroName = h.game_name;
            
            card.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData("text/plain", h.game_name);
                e.dataTransfer.effectAllowed = "copy";
            });

            card.addEventListener('click', () => {
                if (this.builder.selectedSlot !== null) {
                    this.setHeroInSlot(this.builder.selectedSlot, h.game_name);
                } else {
                    this.addHeroToFirstFreeSlot(h.game_name);
                }
            });

            const imgPath = `assets/heroes_icon/${h.short_image}`;
            const elName = Utils.getText(`hero.elements.${h.element}`);
            const roleName = Utils.getText('hero.role' + h.role.charAt(0).toUpperCase() + h.role.slice(1));

            card.innerHTML = `
                <div class="card-image-wrapper">
                    <img src="${imgPath}" class="card-hero-img" loading="lazy">
                    <div class="card-icons">
                         <img src="assets/elements/${h.element}_icon.png" class="mini-icon" title="${elName}">
                         <img src="assets/roles/${h.role}_icon.png" class="mini-icon" title="${roleName}">
                    </div>
                    <div class="card-overlay"><span class="card-name">${h.game_name}</span></div>
                </div>
            `;
            
            fragment.appendChild(card);
        });
        grid.appendChild(fragment);
    },

    selectSlot: function(index) {
        document.querySelectorAll('.team-slot').forEach(s => s.classList.remove('selected'));
        if (this.builder.selectedSlot === index) {
            this.builder.selectedSlot = null;
            return;
        }
        if (index !== null) {
            const slot = document.querySelector(`.team-slot[data-slot="${index}"]`);
            if (slot) slot.classList.add('selected');
            this.builder.selectedSlot = index;
        } else {
            this.builder.selectedSlot = null;
        }
    },

    setHeroInSlot: function(index, heroName) {
        const heroData = Logic.findHeroByName(heroName);
        if (!heroData) return;

        this.builder.currentTeam[index] = heroName;

        const slot = document.querySelector(`.team-slot[data-slot="${index}"]`);
        if(!slot) return; 

        const content = slot.querySelector('.slot-content');
        
        slot.classList.add('filled');
        if(heroData.rarity === 1) slot.style.borderColor = 'var(--rarity1-color)';
        else if(heroData.rarity === 2) slot.style.borderColor = 'var(--rarity2-color)';
        else slot.style.borderColor = 'var(--rarity3-color)';

        content.classList.remove('placeholder');
        
        const elName = Utils.getText(`hero.elements.${heroData.element}`);
        const roleName = Utils.getText('hero.role' + heroData.role.charAt(0).toUpperCase() + heroData.role.slice(1));
        
        content.innerHTML = `
            <div class="card-image-wrapper">
                <img src="assets/heroes_icon/${heroData.short_image}" class="card-hero-img">
                <div class="card-icons">
                    <img src="assets/elements/${heroData.element}_icon.png" class="mini-icon" title="${elName}">
                    <img src="assets/roles/${heroData.role}_icon.png" class="mini-icon" title="${roleName}">
                </div>
                <div class="card-overlay">
                    <span class="card-name">${heroData.game_name}</span>
                </div>
            </div>
        `;

        this.renderBuilderGrid();
    },

    removeHeroFromSlot: function(index) {
        this.builder.currentTeam[index] = null;
        const slot = document.querySelector(`.team-slot[data-slot="${index}"]`);
        if(!slot) return;

        slot.classList.remove('filled');
        slot.style.borderColor = ''; 
        if(index === 0) slot.classList.add('leader-slot'); 
        
        const content = slot.querySelector('.slot-content');
        content.classList.add('placeholder');
        content.innerHTML = `<span>+</span>`;
        this.renderBuilderGrid();
    },

    addHeroToFirstFreeSlot: function(heroName) {
        const freeIndex = this.builder.currentTeam.indexOf(null);
        if (freeIndex !== -1) {
            const slotEl = document.querySelector(`.team-slot[data-slot="${freeIndex}"]`);
            if(slotEl && slotEl.offsetParent === null) {
                return;
            }
            this.setHeroInSlot(freeIndex, heroName);
        }
    },

    handleDrop: function(e, slotElement) {
        e.preventDefault();
        slotElement.classList.remove('drag-over');
        const heroName = e.dataTransfer.getData("text/plain");
        const slotIndex = parseInt(slotElement.dataset.slot);
        if (heroName) {
            this.setHeroInSlot(slotIndex, heroName);
            this.selectSlot(slotIndex);
        }
    },

    // --- API CALLS & CLEAR ---

    async saveTeam() {
        if (!App.state.isLoggedIn) return Utils.alert("Login Required", Utils.getText('teamBuilder.alerts.loginRequired'));
        
        const name = document.getElementById('team-name-input').value || "My Team";
        const type = document.getElementById('team-type-select').value;
        const heroes = this.builder.currentTeam;
        const notes = this.builder.currentNotes;

        if (heroes.every(h => h === null)) return Utils.alert("Empty Team", Utils.getText('teamBuilder.alerts.emptyTeam'));

        const payload = { name, type, heroes, notes }; 
        let url = `${Logic.BACKEND_URL}/api/teams`;
        let method = 'POST';

        if (this.builder.currentTeamId) {
            url += `/${this.builder.currentTeamId}`;
            method = 'PUT';
        }

        try {
            const token = Logic.getSessionToken();
            const res = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(payload)
            });

            if (!res.ok) throw new Error('Save failed');
            
            const savedTeam = await res.json();
            this.builder.currentTeamId = savedTeam.id;
            document.getElementById('team-share-code').value = savedTeam.id;
            
            if (document.getElementById('subview-my-teams')?.classList.contains('active')) {
                this.renderMyTeams();
            }

            UI.openShareTeamModal(savedTeam.id);

        } catch (e) {
            console.error(e);
            Utils.alert("Error", Utils.getText('teamBuilder.alerts.saveError'));
        }
    },

    async loadTeam(id) {
        try {
            const res = await fetch(`${Logic.BACKEND_URL}/api/teams/${id}`);
            if (!res.ok) return Utils.alert("Error", Utils.getText('teamBuilder.alerts.loadError'));
            const team = await res.json();
            
            this.switchSubView('team-builder', false); 
            this.clearTeam(); 
            
            const builderContainer = document.getElementById('subview-team-builder');
            const notesContainer = document.querySelector('.notes-section-container');
            const writeArea = document.getElementById('note-write-area');
            const previewArea = document.getElementById('note-preview-area');
            const tabs = document.querySelectorAll('.note-tab');

            // --- GESTIÓN DE PERMISOS ---
            const myId = App.state.userInfo ? App.state.userInfo.id : null;
            const isOwner = (myId === team.ownerId);
            
            this.builder.currentNotes = team.notes || '';
            const notesInput = document.getElementById('team-notes-input');
            if (notesInput) notesInput.value = this.builder.currentNotes;

            if (isOwner) {
                // DUEÑO
                this.builder.currentTeamId = team.id;
                
                if (builderContainer) builderContainer.classList.remove('locked-mode');
                if (notesContainer) {
                    notesContainer.classList.remove('view-mode');
                    notesContainer.classList.remove('hidden'); // Siempre visible para dueño
                }

                // Poner pestaña en Write
                tabs.forEach(t => t.classList.remove('active'));
                document.querySelector('.note-tab[data-mode="write"]')?.classList.add('active');
                if(writeArea) writeArea.classList.remove('hidden');
                if(previewArea) previewArea.classList.add('hidden');

            } else {
                // VISITANTE
                this.builder.currentTeamId = null;
                console.log(Utils.getText('teamBuilder.alerts.copyMode', {owner: team.ownerName || 'User'}));
                
                if (builderContainer) builderContainer.classList.add('locked-mode');
                if (notesContainer) notesContainer.classList.add('view-mode');
                
                // Ocultar si está vacío
                const hasNotes = this.builder.currentNotes && this.builder.currentNotes.trim().length > 0;
                if (hasNotes) {
                    if (notesContainer) notesContainer.classList.remove('hidden');
                    this.renderNotesPreview(); // Forzar render
                    if (previewArea) previewArea.classList.remove('hidden');
                } else {
                    if (notesContainer) notesContainer.classList.add('hidden');
                }
            }

            document.getElementById('team-name-input').value = team.name;
            document.getElementById('team-share-code').value = team.id;

            const typeSelect = document.getElementById('team-type-select');
            if (typeSelect) {
                typeSelect.value = team.type || 'field';
                this.toggleSubsVisibility();
            }
            
            if (Array.isArray(team.heroes)) {
                team.heroes.forEach((hName, idx) => {
                    if (hName) this.setHeroInSlot(idx, hName);
                });
            }
            
            this.renderBuilderGrid();

        } catch (e) {
            console.error(e);
            Utils.alert("Error", Utils.getText('teamBuilder.alerts.loadError'));
        }
    },

    clearTeam: function() {
        for(let i=0; i<7; i++) this.builder.currentTeam[i] = null;
        
        document.querySelectorAll('.team-slot').forEach(slot => {
            slot.classList.remove('filled', 'selected');
            slot.style.borderColor = '';
            if(slot.dataset.slot === "0") slot.classList.add('leader-slot'); 
            slot.querySelector('.slot-content').innerHTML = `<span>+</span>`;
            slot.querySelector('.slot-content').classList.add('placeholder');
        });
        
        this.selectSlot(null);
        this.builder.currentTeamId = null;
        
        const nInput = document.getElementById('team-name-input'); if(nInput) nInput.value = '';
        const sInput = document.getElementById('team-share-code'); if(sInput) sInput.value = '';
        
        // Limpiar Notas
        this.builder.currentNotes = '';
        const notesInput = document.getElementById('team-notes-input');
        if(notesInput) notesInput.value = '';
        
        const previewEl = document.getElementById('note-preview-area');
        if(previewEl) previewEl.innerHTML = '';

        // Reset UI Notas
        const notesContainer = document.querySelector('.notes-section-container');
        const writeArea = document.getElementById('note-write-area');
        const previewArea = document.getElementById('note-preview-area');
        const tabs = document.querySelectorAll('.note-tab');

        if(notesContainer) {
            notesContainer.classList.remove('view-mode');
            
            // Si es usuario -> Mostrar (para escribir)
            // Si es guest -> Ocultar (para no ocupar espacio)
            if (App.state.isLoggedIn) {
                notesContainer.classList.remove('hidden');
            } else {
                notesContainer.classList.add('hidden');
            }
        }

        if(writeArea && previewArea) {
            writeArea.classList.remove('hidden');
            previewArea.classList.add('hidden');
            tabs.forEach(t => t.classList.remove('active'));
            document.querySelector('.note-tab[data-mode="write"]')?.classList.add('active');
        }

        // Reset Tipo & Bloqueo
        const typeSelect = document.getElementById('team-type-select');
        if(typeSelect) {
            typeSelect.value = 'field';
            this.toggleSubsVisibility();
        }

        const builderContainer = document.getElementById('subview-team-builder');
        if (builderContainer) builderContainer.classList.remove('locked-mode');

        this.renderBuilderGrid();
    },

    // =========================================================
    // ============ SECCIÓN 3: MIS EQUIPOS =====================
    // =========================================================

    setupMyTeamsListeners: function() {
        const searchInput = document.getElementById('my-teams-search');
        if(searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.myTeams.filters.search = e.target.value.toLowerCase();
                this.myTeams.pagination.currentPage = 1;
                this.applyMyTeamsFilters();
            });
        }

        const controlsContainer = document.querySelector('.my-teams-controls-container');
        if (controlsContainer) {
            controlsContainer.addEventListener('click', (e) => {
                const btn = e.target.closest('.filter-btn');
                if (!btn) return;

                const filterType = btn.dataset.type; 
                const value = btn.dataset.value;

                if (filterType === 'teamType') {
                    this.myTeams.filters.type = value;
                    document.querySelectorAll('#my-teams-type-filters .filter-btn').forEach(b => {
                        b.classList.toggle('active', b.dataset.value === value);
                    });
                } else if (filterType === 'element') {
                    if (this.myTeams.filters.element === value) {
                        this.myTeams.filters.element = null;
                    } else {
                        this.myTeams.filters.element = value;
                    }
                    this.renderMyTeamsFilters(); 
                }

                this.myTeams.pagination.currentPage = 1;
                this.applyMyTeamsFilters();
            });
        }
    },

    renderMyTeamsFilters: function() {
        const container = document.getElementById('my-teams-element-filters');
        if (!container) return;
        container.innerHTML = '';

        const elements = ['fire', 'water', 'poison', 'lightning', 'dark', 'typeless'];
        elements.forEach(el => {
            const btn = document.createElement('button');
            btn.className = `filter-btn ${this.myTeams.filters.element === el ? 'active' : ''}`;
            btn.dataset.type = 'element'; 
            btn.dataset.value = el;
            const elName = Utils.getText(`hero.elements.${el}`);
            btn.title = elName;
            btn.innerHTML = `<img src="assets/elements/${el}_icon.png" alt="${elName}">`;
            container.appendChild(btn);
        });

        const typeBtns = document.querySelectorAll('#my-teams-type-filters .filter-btn');
        typeBtns.forEach(btn => {
            const val = btn.dataset.value;
            if(val === 'all') btn.textContent = Utils.getText('teamBuilder.filters.allTypes').toUpperCase();
            if(val === 'field') btn.textContent = Utils.getText('teamBuilder.filters.field').toUpperCase();
            if(val === 'tactic') btn.textContent = Utils.getText('teamBuilder.filters.tactic').toUpperCase();
        });
    },

    fetchMyTeams: async function() {
        const container = document.getElementById('my-teams-grid');
        if (!container) return;

        if (!App.state.isLoggedIn) {
            container.innerHTML = `<p class="loading-text">${Utils.getText('teamBuilder.alerts.loginRequired')}</p>`;
            return;
        }

        container.innerHTML = `<p class="loading-text">Loading...</p>`;

        try {
            const token = Logic.getSessionToken();
            const res = await fetch(`${Logic.BACKEND_URL}/api/my-teams`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!res.ok) throw new Error('Error loading teams');
            
            this.myTeams.allData = await res.json();
            this.applyMyTeamsFilters();

        } catch (e) {
            console.error(e);
            container.innerHTML = `<p class="loading-text" style="color:var(--color-urgent)">Error loading teams.</p>`;
        }
    },

    applyMyTeamsFilters: function() {
        const { search, type, element } = this.myTeams.filters;
        
        this.myTeams.filteredData = this.myTeams.allData.filter(team => {
            if (type !== 'all' && team.type !== type) return false;

            const heroList = (typeof team.heroes === 'string') ? JSON.parse(team.heroes) : team.heroes;
            
            if (element) {
                const hasElement = heroList.some(hName => {
                    if(!hName) return false;
                    const hData = Logic.findHeroByName(hName);
                    return hData && hData.element === element;
                });
                if (!hasElement) return false;
            }

            if (search) {
                if (team.name.toLowerCase().includes(search)) return true;
                const hasHeroName = heroList.some(hName => {
                    if(!hName) return false;
                    const hData = Logic.findHeroByName(hName);
                    return hData && hData.game_name.toLowerCase().includes(search);
                });
                if (!hasHeroName) return false;
            }
            
            return true;
        });

        this.myTeams.pagination.totalItems = this.myTeams.filteredData.length;
        this.myTeams.pagination.totalPages = Math.ceil(this.myTeams.pagination.totalItems / this.myTeams.pagination.itemsPerPage);
        
        if (this.myTeams.pagination.currentPage > this.myTeams.pagination.totalPages) {
            this.myTeams.pagination.currentPage = this.myTeams.pagination.totalPages || 1;
        }

        this.renderMyTeamsGrid();
    },

    renderMyTeamsGrid: function() {
        const container = document.getElementById('my-teams-grid');
        if (!container) return;
        container.innerHTML = '';

        if (this.myTeams.filteredData.length === 0) {
            container.innerHTML = `<p class="loading-text">${Utils.getText('teamBuilder.noTeams')}</p>`;
            document.getElementById('my-teams-pagination').innerHTML = '';
            return;
        }

        const start = (this.myTeams.pagination.currentPage - 1) * this.myTeams.pagination.itemsPerPage;
        const end = start + this.myTeams.pagination.itemsPerPage;
        const teamsToShow = this.myTeams.filteredData.slice(start, end);

        teamsToShow.forEach(team => {
            const card = document.createElement('div');
            card.className = 'team-card';
            
            let heroesHtml = '';
            const heroList = (typeof team.heroes === 'string') ? JSON.parse(team.heroes) : team.heroes;
            
            for (let i = 0; i < 5; i++) {
                const heroName = heroList[i];
                const heroData = heroName ? Logic.findHeroByName(heroName) : null;
                const leaderClass = i === 0 ? 'leader' : '';
                
                if (heroData) {
                    heroesHtml += `
                        <div class="preview-slot ${leaderClass}">
                            <img src="assets/heroes_icon/${heroData.short_image}" class="preview-img" title="${heroData.game_name}">
                        </div>`;
                } else {
                    heroesHtml += `<div class="preview-slot ${leaderClass}" style="background:#222;"></div>`;
                }
            }

            card.innerHTML = `
                <div class="team-header">
                    <span class="team-title">${team.name}</span>
                    <span class="team-type">${team.type}</span>
                </div>
                <div class="team-preview">
                    ${heroesHtml}
                </div>
                <div class="team-footer">
                    <span class="team-id" title="ID">#${team.id}</span>
                    <div class="card-actions">
                        <button class="btn-card-action btn-share-team" title="${Utils.getText('teamBuilder.shareModal.title') || 'Share'}">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>
                        </button>
                        <button class="btn-card-action btn-delete-team" title="${Utils.getText('teamBuilder.deleteTeam')}">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                        </button>
                    </div>
                </div>
            `;

            card.addEventListener('click', (e) => {
                if (e.target.closest('.btn-card-action')) return; 
                this.switchSubView('team-builder', true); 
                this.loadTeam(team.id);
            });

            const shareBtn = card.querySelector('.btn-share-team');
            shareBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                UI.openShareTeamModal(team.id);
            });

            const deleteBtn = card.querySelector('.btn-delete-team');
            deleteBtn.addEventListener('click', async (e) => {
                e.stopPropagation();
                const confirmMsg = Utils.getText('teamBuilder.confirmDelete');
                if (confirm(confirmMsg)) { 
                    await this.deleteTeam(team.id);
                }
            });

            container.appendChild(card);
        });

        this.renderMyTeamsPagination();
    },

    renderMyTeamsPagination: function() {
        const container = document.getElementById('my-teams-pagination');
        if(!container) return;
        container.innerHTML = '';

        if (this.myTeams.pagination.totalPages <= 1) return;

        const prevBtn = document.createElement('button');
        prevBtn.className = 'pagination-btn';
        prevBtn.innerHTML = '&laquo;';
        prevBtn.disabled = this.myTeams.pagination.currentPage === 1;
        prevBtn.onclick = () => {
            this.myTeams.pagination.currentPage--;
            this.renderMyTeamsGrid();
            document.querySelector('.compendium-layout').scrollIntoView({ behavior: 'smooth' });
        };
        container.appendChild(prevBtn);

        const info = document.createElement('span');
        info.className = 'pagination-info';
        info.textContent = `${this.myTeams.pagination.currentPage} / ${this.myTeams.pagination.totalPages}`;
        container.appendChild(info);

        const nextBtn = document.createElement('button');
        nextBtn.className = 'pagination-btn';
        nextBtn.innerHTML = '&raquo;';
        nextBtn.disabled = this.myTeams.pagination.currentPage === this.myTeams.pagination.totalPages;
        nextBtn.onclick = () => {
            this.myTeams.pagination.currentPage++;
            this.renderMyTeamsGrid();
            document.querySelector('.compendium-layout').scrollIntoView({ behavior: 'smooth' });
        };
        container.appendChild(nextBtn);
    },

    deleteTeam: async function(teamId) {
        try {
            const token = Logic.getSessionToken();
            const res = await fetch(`${Logic.BACKEND_URL}/api/teams/${teamId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (res.ok) {
                this.fetchMyTeams(); 
            } else {
                alert("Error deleting team");
            }
        } catch (e) {
            console.error(e);
        }
    }
};

export default Compendium;