// ==========================================================================
// PRODUCTS PAGE COMPONENT (High-Performance Instant Render & Debounced Search)
// ==========================================================================

const ProductsPage = {
    fallbackMenus: [
        {
            MenuId: 1,
            CategoryId: 1,
            CategoryName: 'Coffee',
            Name: 'Kopi Susu Gula Aren Ruang Rasa',
            Description: 'Espresso double shot dengan susu segar creamy dan gula aren organik murni.',
            Price: 22000,
            ImageUrl: 'https://images.unsplash.com/photo-1517256064527-09c73fc73e38?auto=format&fit=crop&w=600&q=80',
            IsAvailable: true
        },
        {
            MenuId: 2,
            CategoryId: 1,
            CategoryName: 'Coffee',
            Name: 'Caramel Macchiato',
            Description: 'Perpaduan espresso kaya rasa dengan vanilla syrup, steamed milk, dan drizzle caramel tebal.',
            Price: 28000,
            ImageUrl: 'https://images.unsplash.com/photo-1485808191679-5f86510681a2?auto=format&fit=crop&w=600&q=80',
            IsAvailable: true
        },
        {
            MenuId: 3,
            CategoryId: 2,
            CategoryName: 'Non-Coffee',
            Name: 'Artisan Matcha Latte',
            Description: 'Pure Uji Matcha ceremonial grade dipadukan dengan oatmilk lembut tanpa pemanis buatan.',
            Price: 26000,
            ImageUrl: 'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?auto=format&fit=crop&w=600&q=80',
            IsAvailable: true
        },
        {
            MenuId: 4,
            CategoryId: 3,
            CategoryName: 'Pastry',
            Name: 'Butter Croissant Fresh Bake',
            Description: 'Croissant khas Perancis renyah berlapis dengan butter premium gurih wangi.',
            Price: 18000,
            ImageUrl: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=600&q=80',
            IsAvailable: true
        },
        {
            MenuId: 5,
            CategoryId: 4,
            CategoryName: 'Food',
            Name: 'Nasi Goreng Kampung Spesial',
            Description: 'Nasi goreng racikan bumbu tradisional dengan telur mata sapi, sate ayam, dan kerupuk.',
            Price: 35000,
            ImageUrl: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=600&q=80',
            IsAvailable: true
        },
        {
            MenuId: 6,
            CategoryId: 1,
            CategoryName: 'Coffee',
            Name: 'Manual Brew V60 Gayo',
            Description: 'Seduhan manual biji kopi arabika Gayo dengan tasting notes floral, citrus, dan honey.',
            Price: 25000,
            ImageUrl: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=600&q=80',
            IsAvailable: true
        },
        {
            MenuId: 7,
            CategoryId: 2,
            CategoryName: 'Non-Coffee',
            Name: 'Earl Grey Artisan Tea',
            Description: 'Teh hitam premium beraroma minyak bergamot Italia yang menenangkan.',
            Price: 20000,
            ImageUrl: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=600&q=80',
            IsAvailable: true
        },
        {
            MenuId: 8,
            CategoryId: 3,
            CategoryName: 'Pastry',
            Name: 'Cinnamon Roll Glazed',
            Description: 'Roti gulung kayu manis hangat dilapisi cream cheese frosting lumer.',
            Price: 24000,
            ImageUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=600&q=80',
            IsAvailable: true
        }
    ],

    menus: [],
    categories: [
        { CategoryId: 1, CategoryName: 'Coffee' },
        { CategoryId: 2, CategoryName: 'Non-Coffee' },
        { CategoryId: 3, CategoryName: 'Pastry' },
        { CategoryId: 4, CategoryName: 'Food' }
    ],
    param: {
        SearchKeyword: '',
        Category: '',
        SortBy: 'name',
        SortDirection: 'ASC',
        PageNumber: 1,
        PageSize: 8
    },
    totalData: 8,
    totalPages: 1,
    isLoading: false,
    searchDebounceTimer: null,

    async init() {
        // Pre-populate with fast fallback so there is ZERO delay / blank screen
        if (this.menus.length === 0) {
            this.menus = [...this.fallbackMenus];
            this.totalData = this.fallbackMenus.length;
            this.totalPages = Math.ceil(this.totalData / this.param.PageSize) || 1;
        }

        // Render immediately for instant perceived performance
        this.render();

        // Fetch live fresh data in background
        await Promise.all([
            this.loadCategories(),
            this.loadMenus(false)
        ]);

        this.updateCategorySelect();
        this.renderGrid();
    },

    updateCategorySelect() {
        const catSelect = document.getElementById('products-category-select');
        if (catSelect) {
            catSelect.innerHTML = `
                <option value="">Semua Kategori</option>
                ${this.categories.map(c => `
                    <option value="${c.CategoryName}" ${this.param.Category === c.CategoryName ? 'selected' : ''}>
                        ${c.CategoryName}
                    </option>
                `).join('')}
            `;
        }
    },

    async loadCategories() {
        try {
            const res = await Api.get('/categories');
            if (res && (res.data || res.Data)) {
                this.categories = res.data || res.Data;
            }
        } catch (err) {
            console.warn('Using default categories');
        }
    },

    async loadMenus(showLoading = true) {
        if (showLoading) {
            this.isLoading = true;
            this.renderGrid();
        }

        try {
            const res = await Api.post('/menus/paging', this.param);
            if (res) {
                const data = res.Data || res.data || (Array.isArray(res) ? res : []);
                if (data && data.length > 0) {
                    this.menus = data;
                    this.totalData = res.TotalData ?? res.totalData ?? data.length;
                    this.totalPages = res.TotalPages ?? res.totalPages ?? Math.ceil(this.totalData / this.param.PageSize) ?? 1;
                    this.isLoading = false;
                    return;
                }
            }
            // If backend returned empty list without search filter, keep fallback
            if (!this.param.SearchKeyword && !this.param.Category) {
                this.menus = this.fallbackMenus;
                this.totalData = this.fallbackMenus.length;
                this.totalPages = Math.ceil(this.totalData / this.param.PageSize) || 1;
            } else {
                this.menus = [];
                this.totalData = 0;
                this.totalPages = 1;
            }
        } catch (err) {
            console.warn('API error, using cached menus');
            if (!this.param.SearchKeyword && !this.param.Category) {
                this.menus = this.fallbackMenus;
                this.totalData = this.fallbackMenus.length;
                this.totalPages = 1;
            } else {
                // Client-side search in fallback
                const kw = this.param.SearchKeyword.toLowerCase();
                const cat = this.param.Category;
                this.menus = this.fallbackMenus.filter(m => {
                    const matchKw = !kw || m.Name.toLowerCase().includes(kw) || (m.Description && m.Description.toLowerCase().includes(kw));
                    const matchCat = !cat || m.CategoryName === cat;
                    return matchKw && matchCat;
                });
                this.totalData = this.menus.length;
                this.totalPages = Math.ceil(this.totalData / this.param.PageSize) || 1;
            }
        } finally {
            this.isLoading = false;
        }
    },

    setSearch(kw) {
        this.param.SearchKeyword = kw;
        this.param.PageNumber = 1;

        if (this.searchDebounceTimer) {
            clearTimeout(this.searchDebounceTimer);
        }

        this.searchDebounceTimer = setTimeout(() => {
            this.loadMenus(true).then(() => this.renderGrid());
        }, 250);
    },

    setCategory(cat) {
        this.param.Category = cat;
        this.param.PageNumber = 1;
        this.loadMenus(true).then(() => this.renderGrid());
    },

    setSorting(sortVal) {
        const [by, dir] = sortVal.split('-');
        this.param.SortBy = by;
        this.param.SortDirection = dir;
        this.param.PageNumber = 1;
        this.loadMenus(true).then(() => this.renderGrid());
    },

    setPageSize(size) {
        this.param.PageSize = parseInt(size) || 8;
        this.param.PageNumber = 1;
        this.loadMenus(true).then(() => this.renderGrid());
    },

    setPage(page) {
        if (page < 1 || page > this.totalPages) return;
        this.param.PageNumber = page;
        this.loadMenus(true).then(() => this.renderGrid());
    },

    addToCart(menuId) {
        const menu = this.menus.find(m => (m.MenuId ?? m.menuId ?? m.Id ?? m.id) == menuId) || 
                     this.fallbackMenus.find(m => m.MenuId == menuId);
        if (menu) {
            App.addToCart(menu);
        } else {
            console.warn('Menu not found for MenuId:', menuId);
        }
    },

    buyNow(menuId) {
        const menu = this.menus.find(m => (m.MenuId ?? m.menuId ?? m.Id ?? m.id) == menuId) || 
                     this.fallbackMenus.find(m => m.MenuId == menuId);
        if (menu) {
            App.buyNow(menu);
        } else {
            console.warn('Menu not found for MenuId:', menuId);
            window.location.hash = '#/checkout';
        }
    },

    renderGrid() {
        const gridContainer = document.getElementById('products-grid-container');
        const paginationContainer = document.getElementById('products-pagination-container');
        const countBadge = document.getElementById('products-count-badge');

        if (!gridContainer || !paginationContainer) {
            this.render();
            return;
        }

        if (countBadge) {
            countBadge.innerHTML = `Menampilkan <b>${this.totalData}</b> Produk`;
        }
        gridContainer.innerHTML = this.renderGridHtml();
        paginationContainer.innerHTML = this.renderPaginationHtml();
    },

    renderGridHtml() {
        if (this.isLoading) {
            return `
                <div style="text-align: center; padding: 4rem 1rem; color: var(--text-muted); grid-column: 1 / -1;">
                    <div class="loading-spinner" style="margin-bottom: 1rem; width: 32px; height: 32px; border-width: 3px;"></div>
                    <p style="font-weight: 600;">Memuat katalog produk...</p>
                </div>
            `;
        }

        if (this.menus.length === 0) {
            return `
                <div style="grid-column: 1 / -1; text-align: center; padding: 4rem 1rem; color: var(--text-muted);">
                    <span class="material-symbols-rounded" style="font-size: 48px; color: var(--text-light); margin-bottom: 0.5rem;">search_off</span>
                    <p style="font-size: 1.1rem; margin-bottom: 0.5rem; color: var(--text-heading);">Tidak ada produk yang cocok dengan pencarian "${this.escapeHtml(this.param.SearchKeyword)}".</p>
                    <button class="btn btn-outline btn-sm" onclick="ProductsPage.resetFilters();">
                        Reset Filter Pencarian
                    </button>
                </div>
            `;
        }

        return this.menus.map((m, idx) => `
            <div class="menu-card card-hover-lift animate-fade-in-up" style="animation-delay: ${(idx % 8) * 0.05}s; ${!m.IsAvailable ? 'opacity: 0.7;' : ''}">
                <div class="menu-image-container product-card-visual">
                    <img src="${m.ImageUrl || 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=600&q=80'}" 
                         alt="${m.Name}" 
                         onerror="this.src='https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=600&q=80'" />
                    <span class="category-chip">${m.CategoryName}</span>
                    ${!m.IsAvailable ? '<span class="status-pill cancelled" style="position:absolute;top:10px;right:10px;">Habis</span>' : ''}
                </div>
                <div class="menu-body">
                    <h3 class="menu-name">${m.Name}</h3>
                    <p class="menu-desc">${m.Description || 'Diracik dengan biji kopi dan bahan baku berkualitas tinggi.'}</p>
                    <div class="menu-card-footer">
                        <div class="menu-price">${App.formatRupiah(m.Price)}</div>
                        ${m.IsAvailable ? `
                            <div class="menu-actions-group">
                                <button class="btn btn-outline btn-sm btn-cart" 
                                        onclick="ProductsPage.addToCart(${m.MenuId})" 
                                        title="Tambah ke Keranjang">
                                    <span class="material-symbols-rounded" style="font-size: 16px;">add_shopping_cart</span>
                                    <span>+ Keranjang</span>
                                </button>
                                <button class="btn btn-primary btn-sm btn-buy" 
                                        onclick="ProductsPage.buyNow(${m.MenuId})" 
                                        title="Beli Sekarang (Langsung ke Checkout)">
                                    <span class="material-symbols-rounded" style="font-size: 16px;">bolt</span>
                                    <span>Beli</span>
                                </button>
                            </div>
                        ` : `
                            <span class="status-pill cancelled" style="font-size: 0.8rem; padding: 0.3rem 0.7rem;">Stok Habis</span>
                        `}
                    </div>
                </div>
            </div>
        `).join('');
    },

    renderPaginationHtml() {
        return `
            <div class="pagination-wrap" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem; margin-top: 2rem;">
                <div style="display: flex; align-items: center; gap: 0.75rem; color: var(--text-muted); font-size: 0.86rem;">
                    <span>Tampilkan:</span>
                    <select class="select-control" style="padding: 0.3rem 0.6rem; font-size: 0.85rem; height: auto; width: auto;" onchange="ProductsPage.setPageSize(this.value)">
                        <option value="8" ${this.param.PageSize === 8 ? 'selected' : ''}>8 per halaman</option>
                        <option value="12" ${this.param.PageSize === 12 ? 'selected' : ''}>12 per halaman</option>
                        <option value="24" ${this.param.PageSize === 24 ? 'selected' : ''}>24 per halaman</option>
                        <option value="48" ${this.param.PageSize === 48 ? 'selected' : ''}>48 per halaman</option>
                    </select>
                    <span>| Menampilkan Halaman <b>${this.param.PageNumber}</b> dari <b>${this.totalPages}</b> (Total ${this.totalData} Produk)</span>
                </div>
                ${this.totalPages > 1 ? `
                    <div class="pagination-list">
                        <button class="page-item" onclick="ProductsPage.setPage(${this.param.PageNumber - 1})" 
                                ${this.param.PageNumber <= 1 ? 'disabled' : ''} title="Halaman Sebelumnya">
                            <span class="material-symbols-rounded" style="font-size: 16px;">chevron_left</span>
                        </button>

                        ${Array.from({ length: this.totalPages }, (_, i) => i + 1).map(p => `
                            <button class="page-item ${this.param.PageNumber === p ? 'active' : ''}" 
                                    onclick="ProductsPage.setPage(${p})">
                                ${p}
                            </button>
                        `).join('')}

                        <button class="page-item" onclick="ProductsPage.setPage(${this.param.PageNumber + 1})" 
                                ${this.param.PageNumber >= this.totalPages ? 'disabled' : ''} title="Halaman Selanjutnya">
                            <span class="material-symbols-rounded" style="font-size: 16px;">chevron_right</span>
                        </button>
                    </div>
                ` : ''}
            </div>
        `;
    },

    resetFilters() {
        this.param.SearchKeyword = '';
        this.param.Category = '';
        this.param.PageNumber = 1;
        const searchInput = document.getElementById('products-search-input');
        if (searchInput) searchInput.value = '';
        const catSelect = document.getElementById('products-category-select');
        if (catSelect) catSelect.value = '';
        this.loadMenus(true).then(() => this.renderGrid());
    },

    render() {
        const root = document.getElementById('page-root');
        if (!root) return;

        root.innerHTML = `
            <div class="container">
                <!-- Header Halaman Semua Produk -->
                <div style="margin-bottom: 2rem; border-bottom: 1px solid var(--border-subtle); padding-bottom: 1.5rem;">
                    <div style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.85rem; color: var(--text-muted); margin-bottom: 0.5rem;">
                        <a href="#/">Beranda</a>
                        <span>/</span>
                        <span style="color: var(--text-heading); font-weight: 500;">Semua Produk</span>
                    </div>
                    <div style="display:flex; justify-content:space-between; align-items:flex-end; flex-wrap:wrap; gap:1rem;">
                        <div>
                            <h1 style="font-size: 2.2rem; margin-bottom: 0.35rem;">Katalog Menu & Produk</h1>
                            <p style="color: var(--text-muted); font-size: 0.95rem;">
                                Jelajahi seluruh varian minuman kopi, artisan tea, makanan utama, dan pastry pilihan.
                            </p>
                        </div>
                        <div id="products-count-badge" style="font-size: 0.88rem; color: var(--text-muted);">
                            Menampilkan <b>${this.totalData}</b> Produk
                        </div>
                    </div>
                </div>

                <!-- Promo Banner Strip -->
                <div style="background: linear-gradient(135deg, var(--bg-warm), #ffffff); border: 1px dashed var(--accent); border-radius: var(--radius-md); padding: 1rem 1.25rem; margin-bottom: 2rem; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.75rem;">
                    <div style="display: flex; align-items: center; gap: 0.75rem;">
                        <span class="material-symbols-rounded" style="color: var(--accent); font-size: 24px;">local_activity</span>
                        <div>
                            <div style="font-weight: 700; font-size: 0.92rem; color: var(--text-heading);">Gunakan Promo Spesial Ruang Rasa!</div>
                            <div style="font-size: 0.78rem; color: var(--text-muted);">Kupon hemat: <strong>RASABARU</strong> (20%), <strong>KOPIHEMAT</strong> (Rp 10rb), <strong>FREESHIP</strong> (Free Ongkir).</div>
                        </div>
                    </div>
                    <a href="#/cart" class="btn btn-outline btn-sm" style="font-size: 0.8rem; padding: 0.35rem 0.8rem;">
                        <span class="material-symbols-rounded" style="font-size: 16px;">shopping_cart</span>
                        Cek Keranjang & Voucher
                    </a>
                </div>

                <!-- Toolbar Filter, Search, dan Sort (Sesuai Poin 6 PDF) -->
                <div class="filter-toolbar">
                    <div class="search-field">
                        <span class="material-symbols-rounded search-icon">search</span>
                        <input type="text" id="products-search-input" 
                               placeholder="Cari nama kopi, makanan, minuman..." 
                               value="${this.param.SearchKeyword}" 
                               oninput="ProductsPage.setSearch(this.value)" />
                    </div>

                    <select id="products-category-select" class="select-control" onchange="ProductsPage.setCategory(this.value)">
                        <option value="">Semua Kategori</option>
                        ${this.categories.map(c => `
                            <option value="${c.CategoryName}" ${this.param.Category === c.CategoryName ? 'selected' : ''}>
                                ${c.CategoryName}
                            </option>
                        `).join('')}
                    </select>

                    <select class="select-control" onchange="ProductsPage.setSorting(this.value)">
                        <option value="date-DESC" ${this.param.SortBy === 'date' && this.param.SortDirection === 'DESC' ? 'selected' : ''}>Urutkan: Terbaru</option>
                        <option value="date-ASC" ${this.param.SortBy === 'date' && this.param.SortDirection === 'ASC' ? 'selected' : ''}>Urutkan: Terlama</option>
                        <option value="name-ASC" ${this.param.SortBy === 'name' && this.param.SortDirection === 'ASC' ? 'selected' : ''}>Nama: A ke Z</option>
                        <option value="name-DESC" ${this.param.SortBy === 'name' && this.param.SortDirection === 'DESC' ? 'selected' : ''}>Nama: Z ke A</option>
                        <option value="price-ASC" ${this.param.SortBy === 'price' && this.param.SortDirection === 'ASC' ? 'selected' : ''}>Harga: Termurah</option>
                        <option value="price-DESC" ${this.param.SortBy === 'price' && this.param.SortDirection === 'DESC' ? 'selected' : ''}>Harga: Tertinggi</option>
                    </select>
                </div>

                <!-- Grid Produk Container -->
                <div id="products-grid-container" class="menu-grid">
                    ${this.renderGridHtml()}
                </div>

                <!-- Pagination Component Container -->
                <div id="products-pagination-container">
                    ${this.renderPaginationHtml()}
                </div>
            </div>
        `;
    },

    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
};

window.ProductsPage = ProductsPage;
