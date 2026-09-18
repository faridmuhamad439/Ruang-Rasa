const HomePage = {
    recommendedMenus: [
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
        }
    ],

    fallbackRecommendations: [
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
        }
    ],

    async init() {
        this.render();
        await Promise.all([this.loadRecommendations(), this.loadPromos()]);
        this.render();
    },

    promos: [],

    async loadPromos() {
        try {
            const res = await Api.get('/promos');
            if (res && res.data) {
                this.promos = res.data;
                return;
            }
        } catch {
            // fallback
        }
        this.promos = [
            {
                PromoCode: 'RASABARU',
                Title: 'Diskon Pelanggan Baru 20%',
                Description: 'Nikmati potongan 20% max Rp 15.000 untuk semua seduhan kopi pilihan.',
                MinOrderAmount: 30000,
                BadgeText: 'DISKON 20%'
            },
            {
                PromoCode: 'KOPIHEMAT',
                Title: 'Potongan Kopi Rp 10.000',
                Description: 'Hemat langsung Rp 10.000 dengan minimum belanja Rp 40.000.',
                MinOrderAmount: 40000,
                BadgeText: 'HEMAT 10RB'
            },
            {
                PromoCode: 'NGOPIHEMAT',
                Title: 'Promo Nongkrong 15%',
                Description: 'Diskon 15% max Rp 20.000 untuk santap di tempat (Dine-In) atau bungkus.',
                MinOrderAmount: 50000,
                BadgeText: 'DISKON 15%'
            },
            {
                PromoCode: 'FREESHIP',
                Title: 'Gratis Ongkir Delivery',
                Description: 'Potongan Rp 10.000 biaya pengantaran langsung ke alamat Anda.',
                MinOrderAmount: 35000,
                BadgeText: 'FREE ONGKIR'
            }
        ];
    },

    copyPromoCode(code) {
        if (navigator.clipboard) {
            navigator.clipboard.writeText(code).then(() => {
                Toast.success(`Kode promo "${code}" berhasil disalin ke clipboard!`);
            }).catch(() => {
                Toast.info(`Kode promo: ${code}`);
            });
        } else {
            Toast.info(`Kode promo: ${code}`);
        }
    },

    usePromoCode(code) {
        this.copyPromoCode(code);
        window.location.hash = '#/products';
    },

    async loadRecommendations() {
        try {
            const res = await Api.post('/menus/paging', {
                PageNumber: 1,
                PageSize: 6,
                SortBy: 'name',
                SortDirection: 'ASC'
            });
            if (res) {
                const data = res.Data || res.data || (Array.isArray(res) ? res : []);
                if (data && data.length > 0) {
                    this.recommendedMenus = data;
                    return;
                }
            }
            this.recommendedMenus = this.fallbackRecommendations;
        } catch (err) {
            console.warn('API error, using fallback recommendations');
            this.recommendedMenus = this.fallbackRecommendations;
        }
    },

    addToCart(menuId) {
        const menu = this.recommendedMenus.find(m => (m.MenuId ?? m.menuId ?? m.Id ?? m.id) == menuId);
        if (menu) {
            App.addToCart(menu);
        } else {
            console.warn('Menu not found for MenuId:', menuId);
        }
    },

    buyNow(menuId) {
        const menu = this.recommendedMenus.find(m => (m.MenuId ?? m.menuId ?? m.Id ?? m.id) == menuId);
        if (menu) {
            App.buyNow(menu);
        } else {
            console.warn('Menu not found for MenuId:', menuId);
            window.location.hash = '#/checkout';
        }
    },

    render() {
        const root = document.getElementById('page-root');
        if (!root) return;

        root.innerHTML = `
            <div class="container">
                <!-- 1. Editorial Hero Section -->
                <section class="home-hero animate-fade-in-up">
                    <div>
                        <div class="hero-tagline animate-float">
                            <span class="material-symbols-rounded" style="font-size: 16px;">coffee_maker</span>
                            Kedai Kopi &amp; Ruang Temu Nyaman
                        </div>
                        <h1 class="hero-heading">Sebuah Ruang untuk Meresapi Rasa &amp; Waktu</h1>
                        <p class="hero-desc">
                            Ruang Rasa hadir sebagai tempat singgah di tengah hiruk pikuk kota. Kami meracik biji kopi pilihan nusantara dengan teknik presisi, menyajikan hidangan hangat dari dapur, dan menyediakan sudut meja yang nyaman untuk bekerja maupun berbincang santai.
                        </p>
                        <div class="hero-actions">
                            <a href="#/products" class="btn btn-primary">
                                <span class="material-symbols-rounded">menu_book</span>
                                Jelajahi Menu &amp; Pesan
                            </a>
                            <button class="btn btn-secondary" onclick="TablePicker.openModal()">
                                <span class="material-symbols-rounded">table_restaurant</span>
                                Cek Ketersediaan Meja
                            </button>
                        </div>
                    </div>
                    <div>
                        <div class="hero-image-frame card-hover-lift">
                            <img src="https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=1000&q=80" 
                                 alt="Suasana Kedai Kopi Ruang Rasa" />
                            <div class="hero-image-caption">
                                <div>
                                    <div style="font-weight:600; font-size:0.92rem; color:var(--text-heading);">Ruang Rasa Flagship</div>
                                    <div style="font-size:0.8rem; color:var(--text-muted);">Buka setiap hari: 08.00 - 23.00 WIB</div>
                                </div>
                                <span class="material-symbols-rounded" style="color:var(--primary);">verified</span>
                            </div>
                        </div>
                    </div>
                </section>

                <!-- 2. Nilai & Filosofi Ruang Rasa (Pillars) -->
                <section class="pillars-section">
                    <div class="pillars-grid">
                        <div class="pillar-item card-hover-lift">
                            <div class="pillar-icon-box">
                                <span class="material-symbols-rounded">energy_savings_leaf</span>
                            </div>
                            <h3 class="pillar-title">Biji Kopi Pilihan</h3>
                            <p class="pillar-desc">Didatangkan langsung dari petani kopi lokal Gayo, Flores, dan Temanggung dengan proses sangrai segar.</p>
                        </div>
                        <div class="pillar-item card-hover-lift">
                            <div class="pillar-icon-box">
                                <span class="material-symbols-rounded">bakery_dining</span>
                            </div>
                            <h3 class="pillar-title">Freshly Baked</h3>
                            <p class="pillar-desc">Pastry hangat dan sourdough artisanal dipanggang setiap pagi langsung di dapur kami.</p>
                        </div>
                        <div class="pillar-item card-hover-lift">
                            <div class="pillar-icon-box">
                                <span class="material-symbols-rounded">chair</span>
                            </div>
                            <h3 class="pillar-title">Pilih Meja Sendiri</h3>
                            <p class="pillar-desc">Pantau ketersediaan meja secara live dan pesan langsung tanpa perlu antre di kasir.</p>
                        </div>
                        <div class="pillar-item card-hover-lift">
                            <div class="pillar-icon-box">
                                <span class="material-symbols-rounded">moped</span>
                            </div>
                            <h3 class="pillar-title">Pesan Antar Aman</h3>
                            <p class="pillar-desc">Nikmati racikan kopi dingin dan makanan favorit diantar langsung oleh kurir internal kami.</p>
                        </div>
                    </div>
                </section>

                <!-- 2.5 Promo & Penawaran Spesial Ruang Rasa -->
                <section style="margin: 3.5rem 0; background: var(--bg-surface); border: 1px solid var(--border-subtle); border-radius: var(--radius-lg); padding: 2.25rem 2rem; box-shadow: var(--shadow-subtle);">
                    <div style="display: flex; justify-content: space-between; align-items: flex-end; flex-wrap: wrap; gap: 1rem; border-bottom: 1px solid var(--border-subtle); padding-bottom: 1.25rem;">
                        <div>
                            <span class="story-badge" style="margin-bottom: 0.5rem;">Penawaran Spesial</span>
                            <h2 style="font-size: 1.8rem; margin: 0; color: var(--text-heading);">Voucher &amp; Promo Eksklusif</h2>
                            <p style="color: var(--text-muted); font-size: 0.95rem; margin-top: 0.25rem;">
                                Salin kode voucher di bawah dan gunakan saat checkout untuk mendapatkan potongan harga spesial.
                            </p>
                        </div>
                        <a href="#/cart" class="btn btn-primary btn-sm">
                            <span class="material-symbols-rounded" style="font-size: 18px;">shopping_cart_checkout</span>
                            Buka Halaman Checkout
                        </a>
                    </div>

                    <div class="promo-grid">
                        ${this.promos.map(p => `
                            <div class="promo-ticket card-hover-lift">
                                <div>
                                    <div class="promo-badge">
                                        <span class="material-symbols-rounded" style="font-size: 14px;">stars</span>
                                        ${p.BadgeText || p.badgeText || 'PROMO'}
                                    </div>
                                    <h3 style="font-size: 1.1rem; color: var(--text-heading); margin-bottom: 0.35rem;">
                                        ${p.Title || p.title}
                                    </h3>
                                    <p style="font-size: 0.82rem; color: var(--text-muted); line-height: 1.45;">
                                        ${p.Description || p.description}
                                    </p>
                                </div>

                                <div>
                                    <div class="promo-code-box">
                                        <span class="promo-code-text">${p.PromoCode || p.promoCode}</span>
                                        <button type="button" class="btn btn-outline btn-sm" 
                                                style="padding: 0.25rem 0.65rem; font-size: 0.75rem; border-radius: 4px; background: #ffffff;" 
                                                onclick="HomePage.copyPromoCode('${p.PromoCode || p.promoCode}')" 
                                                title="Salin Kode Promo">
                                            <span class="material-symbols-rounded" style="font-size: 14px;">content_copy</span>
                                            Salin
                                        </button>
                                    </div>
                                    <button type="button" class="btn btn-outline btn-sm" 
                                            style="width: 100%; margin-top: 0.5rem; font-size: 0.8rem; padding: 0.4rem; justify-content: center;" 
                                            onclick="HomePage.usePromoCode('${p.PromoCode || p.promoCode}')">
                                        <span class="material-symbols-rounded" style="font-size: 15px;">local_mall</span>
                                        Pesan &amp; Pakai Promo
                                    </button>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </section>

                <!-- 3. Rekomendasi Menu Unggulan Barista (Recommended Products) -->
                <section style="margin: 3.5rem 0;">
                    <div class="section-header">
                        <div>
                            <h2 class="section-title">Pilihan Favorit Pengunjung</h2>
                            <p class="section-subtitle">Rekomendasi racikan kopi, artisan tea, dan hidangan peneman yang paling dicari.</p>
                        </div>
                        <a href="#/products" class="btn btn-outline btn-sm">
                            Lihat Menu Lengkap (25+ Produk)
                            <span class="material-symbols-rounded" style="font-size: 16px;">arrow_forward</span>
                        </a>
                    </div>

                    <div class="menu-grid">
                        ${this.recommendedMenus.map(m => `
                            <div class="menu-card card-hover-lift" style="${!m.IsAvailable ? 'opacity: 0.7;' : ''}">
                                <div class="menu-image-container product-card-visual">
                                    <img src="${m.ImageUrl || 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=600&q=80'}" 
                                         alt="${m.Name}" 
                                         onerror="this.src='https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=600&q=80'" />
                                    <span class="category-chip">${m.CategoryName}</span>
                                    ${!m.IsAvailable ? '<span class="status-pill cancelled" style="position:absolute;top:10px;right:10px;">Habis</span>' : ''}
                                </div>
                                <div class="menu-body">
                                    <h3 class="menu-name">${m.Name}</h3>
                                    <p class="menu-desc">${m.Description || 'Diracik dengan biji kopi dan bahan baku pilihan berkualitas.'}</p>
                                    <div class="menu-card-footer">
                                        <div class="menu-price">${App.formatRupiah(m.Price)}</div>
                                        ${m.IsAvailable ? `
                                             <div class="menu-actions-group">
                                                <button class="btn btn-outline btn-sm btn-cart" 
                                                        onclick="HomePage.addToCart(${m.MenuId})" 
                                                        title="Tambah ke Keranjang">
                                                    <span class="material-symbols-rounded" style="font-size: 16px;">add_shopping_cart</span>
                                                    <span>+ Keranjang</span>
                                                </button>
                                                <button class="btn btn-primary btn-sm btn-buy" 
                                                        onclick="HomePage.buyNow(${m.MenuId})" 
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
                        `).join('')}
                    </div>
                </section>

                <!-- 4. Story / Cerita Tentang Ruang Rasa -->
                <section class="story-section">
                    <div class="story-grid">
                        <div class="story-img-grid">
                            <img src="https://images.unsplash.com/photo-1442512595331-e89e73853f31?auto=format&fit=crop&w=600&q=80" alt="Interior Ruang Rasa" class="card-hover-lift" />
                            <img src="https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=600&q=80" alt="Proses Seduh Manual" class="card-hover-lift" style="margin-top: 1.5rem;" />
                        </div>
                        <div>
                            <span class="story-badge">Tentang Kami</span>
                            <h2 class="story-heading">Kisah di Balik Setiap Cangkir yang Kami Sajikan</h2>
                            <p class="story-text">
                                Di Ruang Rasa, kami percaya bahwa secangkir kopi lebih dari sekadar asupan kafein. Ia adalah jembatan percakapan, teman berpikir, dan alasan untuk berhenti sejenak dari kesibukan.
                            </p>
                            <p class="story-text">
                                Kami merancang suasana kedai dengan pencahayaan hangat, sentuhan material kayu alami, serta ruang terbuka yang asri agar setiap tamu yang datang merasa pulang ke tempat yang tenang.
                            </p>
                            <div style="margin-top: 1.5rem; display: flex; gap: 2rem; flex-wrap: wrap;">
                                <div>
                                    <div style="font-size: 1.7rem; font-weight: 700; color: var(--primary);">20+</div>
                                    <div style="font-size: 0.82rem; color: var(--text-muted);">Meja Dine-In Siap Pakai</div>
                                </div>
                                <div>
                                    <div style="font-size: 1.7rem; font-weight: 700; color: var(--primary);">100%</div>
                                    <div style="font-size: 0.82rem; color: var(--text-muted);">Biji Kopi Asli Indonesia</div>
                                </div>
                                <div>
                                    <div style="font-size: 1.7rem; font-weight: 700; color: var(--primary);">7 Role</div>
                                    <div style="font-size: 0.82rem; color: var(--text-muted);">Sistem Pelayanan Terpadu</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        `;

        TablePicker.render();
    }
};
