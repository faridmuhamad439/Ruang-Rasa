// ==========================================================================
// CUSTOM SELECT / DROPDOWN COMPONENT (RUANG RASA ARTISAN DESIGN SYSTEM)
// Transforms default HTML select elements into beautiful, accessible,
// reactive themed dropdowns across all pages and roles.
// ==========================================================================

const CustomSelect = {
    activeWrapper: null,

    init() {
        this.enhanceAll();
        this.setupObserver();
        this.setupGlobalListeners();
    },

    enhanceAll(container = document) {
        if (!container || !container.querySelectorAll) return;
        const selects = container.querySelectorAll('select:not([data-custom-select-ready]):not([data-no-custom])');
        selects.forEach(select => this.enhance(select));
    },

    // Helper untuk membedah dot status (contoh: "● Tersedia", "● Terisi")
    parseOptionContent(text, val) {
        const trimmed = (text || '').trim();
        let dotColor = null;
        let cleanText = trimmed;

        if (trimmed.startsWith('●') || trimmed.startsWith('•')) {
            cleanText = trimmed.replace(/^[●•]\s*/, '');
            const lower = (val || cleanText).toLowerCase();
            if (lower.includes('available') || lower.includes('tersedia') || lower.includes('selesai') || lower.includes('active') || lower.includes('aktif')) {
                dotColor = 'var(--success, #2e7d32)';
            } else if (lower.includes('occupied') || lower.includes('terisi') || lower.includes('batal') || lower.includes('cancel')) {
                dotColor = 'var(--danger, #d32f2f)';
            } else if (lower.includes('reserved') || lower.includes('reservasi') || lower.includes('pending') || lower.includes('menunggu')) {
                dotColor = 'var(--warning, #f59e0b)';
            } else if (lower.includes('maintenance') || lower.includes('perbaikan') || lower.includes('cooking') || lower.includes('dimasak')) {
                dotColor = 'var(--accent, #b87333)';
            } else {
                dotColor = 'var(--primary, #4a3525)';
            }
        }

        return { cleanText, dotColor };
    },

    enhance(select) {
        if (!select || select.dataset.customSelectReady) return;
        select.dataset.customSelectReady = 'true';

        // Bersihkan wrapper lama jika sudah ada
        if (select.nextElementSibling && select.nextElementSibling.classList.contains('custom-select-wrapper')) {
            select.nextElementSibling.remove();
        }

        // Sembunyikan select asli dari tampilan visual (tetap di DOM untuk event & form data)
        select.style.display = 'none';

        // Buat wrapper utama custom dropdown
        const wrapper = document.createElement('div');
        wrapper.className = 'custom-select-wrapper';
        if (select.className) {
            wrapper.className += ' ' + select.className.replace('form-control', '').trim();
        }
        if (select.classList.contains('form-control')) {
            wrapper.classList.add('is-form-control');
        }
        if (select.style.minWidth) {
            wrapper.style.minWidth = select.style.minWidth;
        }

        // Trigger button
        const trigger = document.createElement('button');
        trigger.type = 'button';
        trigger.className = 'custom-select-trigger';
        trigger.setAttribute('aria-haspopup', 'listbox');
        trigger.setAttribute('aria-expanded', 'false');
        if (select.disabled) trigger.disabled = true;

        const triggerContent = document.createElement('span');
        triggerContent.className = 'custom-select-content';

        const triggerDot = document.createElement('span');
        triggerDot.className = 'custom-select-dot';
        triggerDot.style.display = 'none';

        const triggerText = document.createElement('span');
        triggerText.className = 'custom-select-text';

        triggerContent.appendChild(triggerDot);
        triggerContent.appendChild(triggerText);

        const triggerArrow = document.createElement('span');
        triggerArrow.className = 'material-symbols-rounded custom-select-arrow';
        triggerArrow.textContent = 'expand_more';

        trigger.appendChild(triggerContent);
        trigger.appendChild(triggerArrow);

        // Menu Dropdown Popover
        const menu = document.createElement('div');
        menu.className = 'custom-select-menu';
        menu.setAttribute('role', 'listbox');

        // Search container (jika opsi > 6)
        let searchInput = null;
        let searchWrap = null;

        // Render & Update isi Menu
        const updateOptions = () => {
            menu.innerHTML = '';
            const options = Array.from(select.options);
            const selectedOption = select.options[select.selectedIndex] || options[0];

            if (selectedOption) {
                const parsed = this.parseOptionContent(selectedOption.textContent, selectedOption.value);
                triggerText.textContent = parsed.cleanText;
                trigger.title = parsed.cleanText;
                if (parsed.dotColor) {
                    triggerDot.style.display = 'inline-block';
                    triggerDot.style.backgroundColor = parsed.dotColor;
                } else {
                    triggerDot.style.display = 'none';
                }
            } else {
                triggerText.textContent = '-- Pilih --';
                triggerDot.style.display = 'none';
            }

            // Tambahkan search filter jika banyak opsi
            if (options.length > 6) {
                searchWrap = document.createElement('div');
                searchWrap.className = 'custom-select-search-wrap';
                
                const searchIcon = document.createElement('span');
                searchIcon.className = 'material-symbols-rounded';
                searchIcon.textContent = 'search';

                searchInput = document.createElement('input');
                searchInput.type = 'text';
                searchInput.className = 'custom-select-search-input';
                searchInput.placeholder = 'Cari opsi...';

                searchWrap.appendChild(searchIcon);
                searchWrap.appendChild(searchInput);
                menu.appendChild(searchWrap);

                searchInput.addEventListener('click', (e) => e.stopPropagation());
                searchInput.addEventListener('input', (e) => {
                    const q = (e.target.value || '').toLowerCase().trim();
                    const items = menu.querySelectorAll('.custom-select-option');
                    items.forEach(item => {
                        const txt = (item.getAttribute('data-text') || '').toLowerCase();
                        item.style.display = txt.includes(q) ? 'flex' : 'none';
                    });
                });
            }

            // Container daftar opsi
            const listContainer = document.createElement('div');
            listContainer.className = 'custom-select-list';

            options.forEach((opt, idx) => {
                const optItem = document.createElement('div');
                optItem.className = 'custom-select-option';
                optItem.setAttribute('role', 'option');
                optItem.setAttribute('data-text', opt.textContent);
                optItem.setAttribute('data-value', opt.value);

                const isSelected = opt.value === select.value || idx === select.selectedIndex;
                if (isSelected) {
                    optItem.classList.add('selected');
                    optItem.setAttribute('aria-selected', 'true');
                }
                if (opt.disabled) {
                    optItem.classList.add('disabled');
                    optItem.setAttribute('aria-disabled', 'true');
                }

                const parsed = this.parseOptionContent(opt.textContent, opt.value);

                const optContent = document.createElement('div');
                optContent.className = 'custom-select-option-content';

                if (parsed.dotColor) {
                    const dot = document.createElement('span');
                    dot.className = 'custom-select-dot';
                    dot.style.backgroundColor = parsed.dotColor;
                    optContent.appendChild(dot);
                }

                const optLabel = document.createElement('span');
                optLabel.className = 'custom-select-option-label';
                optLabel.textContent = parsed.cleanText;
                optContent.appendChild(optLabel);

                optItem.appendChild(optContent);

                if (isSelected) {
                    const checkIcon = document.createElement('span');
                    checkIcon.className = 'material-symbols-rounded custom-select-check';
                    checkIcon.textContent = 'check';
                    optItem.appendChild(checkIcon);
                }

                optItem.addEventListener('click', (e) => {
                    e.stopPropagation();
                    if (opt.disabled) return;

                    const changed = select.value !== opt.value;
                    select.value = opt.value;
                    select.selectedIndex = idx;

                    updateOptions();
                    this.closeAll();

                    if (changed) {
                        select.dispatchEvent(new Event('change', { bubbles: true }));
                        select.dispatchEvent(new Event('input', { bubbles: true }));
                        if (typeof select.onchange === 'function') {
                            select.onchange();
                        }
                    }
                });

                listContainer.appendChild(optItem);
            });

            menu.appendChild(listContainer);
        };

        updateOptions();

        // Reactive Interception untuk property select.value & selectedIndex
        try {
            if (!select.__rrSelectIntercepted) {
                select.__rrSelectIntercepted = true;
                const proto = HTMLSelectElement.prototype;
                const valDescriptor = Object.getOwnPropertyDescriptor(proto, 'value');
                if (valDescriptor && valDescriptor.set) {
                    Object.defineProperty(select, 'value', {
                        get() {
                            return valDescriptor.get.call(this);
                        },
                        set(val) {
                            valDescriptor.set.call(this, val);
                            updateOptions();
                        },
                        configurable: true
                    });
                }
                const idxDescriptor = Object.getOwnPropertyDescriptor(proto, 'selectedIndex');
                if (idxDescriptor && idxDescriptor.set) {
                    Object.defineProperty(select, 'selectedIndex', {
                        get() {
                            return idxDescriptor.get.call(this);
                        },
                        set(idx) {
                            idxDescriptor.set.call(this, idx);
                            updateOptions();
                        },
                        configurable: true
                    });
                }
            }
        } catch (e) {
            console.warn('CustomSelect property interception warning:', e);
        }

        // Toggle Buka/Tutup Menu Dropdown
        trigger.addEventListener('click', (e) => {
            e.stopPropagation();
            if (select.disabled) return;

            const isOpen = wrapper.classList.contains('open');
            this.closeAll();

            if (!isOpen) {
                updateOptions();
                wrapper.classList.add('open');
                trigger.setAttribute('aria-expanded', 'true');
                this.activeWrapper = wrapper;

                // Smart Positioning: Hindari menu terpotong tepi layar atau tabel
                const rect = wrapper.getBoundingClientRect();
                const spaceBelow = window.innerHeight - rect.bottom;
                const spaceAbove = rect.top;

                if (spaceBelow < 250 && spaceAbove > 240) {
                    wrapper.classList.add('drop-up');
                } else {
                    wrapper.classList.remove('drop-up');
                }

                // Fokus otomatis ke search bar jika ada
                if (searchInput) {
                    setTimeout(() => searchInput.focus(), 60);
                }
            }
        });

        // Dukungan Navigasi Keyboard
        trigger.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                if (!wrapper.classList.contains('open')) {
                    trigger.click();
                }
            }
        });

        // Sinkronisasi saat mutasi DOM pada select (misal option ditambah/dihapus via JS)
        const observer = new MutationObserver(() => {
            trigger.disabled = select.disabled;
            updateOptions();
        });
        observer.observe(select, { attributes: true, childList: true, subtree: true });

        // Event listener tambahan untuk sinkronisasi
        select.addEventListener('change', () => updateOptions());
        select.addEventListener('sync', () => updateOptions());
        select.addEventListener('update', () => updateOptions());

        wrapper.appendChild(trigger);
        wrapper.appendChild(menu);

        // Sisipkan wrapper langsung setelah elemen select asli
        if (select.parentNode) {
            select.parentNode.insertBefore(wrapper, select.nextSibling);
        }
    },

    closeAll() {
        document.querySelectorAll('.custom-select-wrapper.open').forEach(w => {
            w.classList.remove('open');
            w.classList.remove('drop-up');
            const trig = w.querySelector('.custom-select-trigger');
            if (trig) trig.setAttribute('aria-expanded', 'false');
        });
        this.activeWrapper = null;
    },

    setupGlobalListeners() {
        // Klik di luar dropdown untuk menutup semua dropdown
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.custom-select-wrapper')) {
                this.closeAll();
            }
        });

        // Tombol Escape untuk menutup
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeAll();
            }
        });

        // Menutup saat window resize atau scroll luar untuk menjaga kestabilan posisi
        window.addEventListener('resize', () => this.closeAll());
    },

    setupObserver() {
        // Otomatis enhance select baru yang dimasukkan ke DOM
        const roots = [
            document.getElementById('page-root') || document.body,
            document.getElementById('cart-modal-root'),
            document.getElementById('table-modal-root')
        ];

        roots.forEach(root => {
            if (!root) return;
            const domObserver = new MutationObserver(() => {
                this.enhanceAll(root);
            });
            domObserver.observe(root, { childList: true, subtree: true });
        });
    }
};
