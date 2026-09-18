// ==========================================================================
// NAVBAR COMPONENT (Editorial Clean Styling & Google Material Symbols)
// Role-Aware Navigation:
// - Customer: Beranda, Semua Produk, Keranjang, Menu Profil Saya (#/profile)
// - Staff/Admin: Kelola Menu, Kelola Meja, Kelola Promo, Dashboard, Profil
// ==========================================================================

const Navbar = {
    render() {
        const navContainer = document.getElementById('navbar-root');
        if (!navContainer) return;

        const user = Api.getCurrentUser();
        const isAuthenticated = !!user;
        const currentHash = window.location.hash || '#/';
        const role = user ? (user.role || '').toLowerCase() : '';
        const isCustomer = role === 'customer';

        let userRoleBadge = '';
        let managementLinks = '';
        let managementLinksHtml = '';

        if (isAuthenticated) {
            userRoleBadge = `
                <a href="#/profile" class="role-badge ${role}" style="text-decoration:none; cursor:pointer;" title="Buka Profil Saya">
                    <span class="material-symbols-rounded" style="font-size: 14px;">badge</span>
                    ${user.role}
                </a>
            `;

            if (role === 'admin' || role === 'owner') {
                managementLinks += `
                    <li>
                        <a href="#/menu-crud" class="rr-nav-link ${currentHash === '#/menu-crud' ? 'active' : ''}">
                            <span class="material-symbols-rounded">restaurant_menu</span>
                            Kelola Menu
                        </a>
                    </li>
                    <li>
                        <a href="#/table-management" class="rr-nav-link ${currentHash === '#/table-management' ? 'active' : ''}">
                            <span class="material-symbols-rounded">table_restaurant</span>
                            Kelola Meja
                        </a>
                    </li>
                    <li>
                        <a href="#/promo-crud" class="rr-nav-link ${currentHash === '#/promo-crud' ? 'active' : ''}">
                            <span class="material-symbols-rounded">local_activity</span>
                            Kelola Promo
                        </a>
                    </li>
                    <li>
                        <a href="#/dashboard" class="rr-nav-link ${currentHash === '#/dashboard' ? 'active' : ''}">
                            <span class="material-symbols-rounded">dashboard</span>
                            Dashboard
                        </a>
                    </li>
                `;
                managementLinksHtml = `
                    <div class="rr-mobile-menu-label">Manajemen</div>
                    <a href="#/menu-crud" class="rr-mobile-menu-item ${currentHash === '#/menu-crud' ? 'active' : ''}" onclick="Navbar.closeMobileMenu()">
                        <span class="material-symbols-rounded">restaurant_menu</span>
                        Kelola Menu
                    </a>
                    <a href="#/table-management" class="rr-mobile-menu-item ${currentHash === '#/table-management' ? 'active' : ''}" onclick="Navbar.closeMobileMenu()">
                        <span class="material-symbols-rounded">table_restaurant</span>
                        Kelola Meja
                    </a>
                    <a href="#/promo-crud" class="rr-mobile-menu-item ${currentHash === '#/promo-crud' ? 'active' : ''}" onclick="Navbar.closeMobileMenu()">
                        <span class="material-symbols-rounded">local_activity</span>
                        Kelola Promo
                    </a>
                    <a href="#/dashboard" class="rr-mobile-menu-item ${currentHash === '#/dashboard' ? 'active' : ''}" onclick="Navbar.closeMobileMenu()">
                        <span class="material-symbols-rounded">dashboard</span>
                        Dashboard
                    </a>
                `;
            } else if (role === 'kasir') {
                managementLinks += `
                    <li>
                        <a href="#/table-management" class="rr-nav-link ${currentHash === '#/table-management' ? 'active' : ''}">
                            <span class="material-symbols-rounded">table_restaurant</span>
                            Kelola Meja
                        </a>
                    </li>
                    <li>
                        <a href="#/dashboard" class="rr-nav-link ${currentHash === '#/dashboard' ? 'active' : ''}">
                            <span class="material-symbols-rounded">dashboard</span>
                            Dashboard
                        </a>
                    </li>
                `;
                managementLinksHtml = `
                    <div class="rr-mobile-menu-label">Manajemen</div>
                    <a href="#/table-management" class="rr-mobile-menu-item ${currentHash === '#/table-management' ? 'active' : ''}" onclick="Navbar.closeMobileMenu()">
                        <span class="material-symbols-rounded">table_restaurant</span>
                        Kelola Meja
                    </a>
                    <a href="#/dashboard" class="rr-mobile-menu-item ${currentHash === '#/dashboard' ? 'active' : ''}" onclick="Navbar.closeMobileMenu()">
                        <span class="material-symbols-rounded">dashboard</span>
                        Dashboard
                    </a>
                `;
            } else if (role === 'waiter') {
                managementLinks += `
                    <li>
                        <a href="#/table-management" class="rr-nav-link ${currentHash === '#/table-management' ? 'active' : ''}">
                            <span class="material-symbols-rounded">table_restaurant</span>
                            Denah Meja
                        </a>
                    </li>
                    <li>
                        <a href="#/dashboard" class="rr-nav-link ${currentHash === '#/dashboard' ? 'active' : ''}">
                            <span class="material-symbols-rounded">dashboard</span>
                            Tugas Waiter
                        </a>
                    </li>
                `;
                managementLinksHtml = `
                    <div class="rr-mobile-menu-label">Operasional</div>
                    <a href="#/table-management" class="rr-mobile-menu-item ${currentHash === '#/table-management' ? 'active' : ''}" onclick="Navbar.closeMobileMenu()">
                        <span class="material-symbols-rounded">table_restaurant</span>
                        Denah Meja
                    </a>
                    <a href="#/dashboard" class="rr-mobile-menu-item ${currentHash === '#/dashboard' ? 'active' : ''}" onclick="Navbar.closeMobileMenu()">
                        <span class="material-symbols-rounded">dashboard</span>
                        Tugas Waiter
                    </a>
                `;
            } else if (role === 'barista' || role === 'dapur' || role === 'driver') {
                managementLinks += `
                    <li>
                        <a href="#/dashboard" class="rr-nav-link ${currentHash === '#/dashboard' ? 'active' : ''}">
                            <span class="material-symbols-rounded">dashboard</span>
                            Dashboard
                        </a>
                    </li>
                `;
                managementLinksHtml = `
                    <div class="rr-mobile-menu-label">Operasional</div>
                    <a href="#/dashboard" class="rr-mobile-menu-item ${currentHash === '#/dashboard' ? 'active' : ''}" onclick="Navbar.closeMobileMenu()">
                        <span class="material-symbols-rounded">dashboard</span>
                        Dashboard
                    </a>
                `;
            }
        }

        navContainer.innerHTML = `
            <nav class="rr-navbar">
                <a href="#/" class="rr-brand">
                    <div class="rr-brand-icon">
                        <span class="material-symbols-rounded" style="font-size: 22px;">local_cafe</span>
                    </div>
                    <span class="rr-brand-text">Ruang Rasa</span>
                </a>

                <ul class="rr-nav-links">
                    <li>
                        <a href="#/" class="rr-nav-link ${currentHash === '#/' ? 'active' : ''}">
                            <span class="material-symbols-rounded">home</span>
                            Beranda
                        </a>
                    </li>
                    <li>
                        <a href="#/products" class="rr-nav-link ${currentHash === '#/products' ? 'active' : ''}">
                            <span class="material-symbols-rounded">storefront</span>
                            Semua Produk
                        </a>
                    </li>
                    ${managementLinks}
                </ul>

                <div class="rr-nav-actions">
                    <!-- Tombol Keranjang / Checkout -->
                    <a href="#/cart" class="cart-button ${currentHash === '#/cart' || currentHash === '#/checkout' ? 'active' : ''}" style="${currentHash === '#/cart' || currentHash === '#/checkout' ? 'border-color: var(--accent); background: var(--bg-warm);' : ''}">
                        <span class="material-symbols-rounded" style="font-size: 19px; color: var(--primary);">shopping_bag</span>
                        <span>Keranjang</span>
                        <span class="cart-counter">0</span>
                    </a>

                    <!-- Tombol Menu Navigasi (hanya tampil di mobile) -->
                    <button type="button" class="rr-menu-toggle" onclick="Navbar.toggleMobileMenu(event)" title="Menu Navigasi">
                        <span class="material-symbols-rounded">menu</span>
                    </button>

                    ${isAuthenticated ? `
                        <div class="nav-user-dropdown" id="navbar-user-dropdown">
                            <button type="button" class="user-profile-trigger" onclick="Navbar.toggleUserMenu(event)">
                                <div class="user-avatar-circle">
                                    ${(user.fullName || user.username || 'U').charAt(0).toUpperCase()}
                                </div>
                                <span class="user-trigger-name">${user.fullName ? user.fullName.split(' ')[0] : 'Profil'}</span>
                                <span class="role-badge ${role}">${user.role}</span>
                                <span class="material-symbols-rounded" style="font-size: 18px; color: var(--text-muted); transition: transform 0.2s ease;">expand_more</span>
                            </button>

                            <div class="user-profile-menu" id="user-dropdown-popover">
                                <div class="user-profile-header">
                                    <div class="user-header-name">${user.fullName || 'Pengguna Ruang Rasa'}</div>
                                    <div class="user-header-email">${user.email || 'customer@ruangrasa.com'}</div>
                                    <span class="role-badge ${role}">${user.role}</span>
                                </div>

                                <a href="#/profile" class="user-dropdown-item" onclick="Navbar.closeUserMenu()">
                                    <span class="material-symbols-rounded">account_circle</span>
                                    <span>Profil & Keamanan</span>
                                </a>

                                <a href="#/profile?tab=orders" class="user-dropdown-item" onclick="Navbar.closeUserMenu()">
                                    <span class="material-symbols-rounded">receipt_long</span>
                                    <span>Riwayat Pesanan</span>
                                </a>

                                <a href="#/profile?tab=address" class="user-dropdown-item" onclick="Navbar.closeUserMenu()">
                                    <span class="material-symbols-rounded">pin_drop</span>
                                    <span>Alamat & Titik Peta</span>
                                </a>

                                ${role !== 'customer' ? `
                                    <a href="#/dashboard" class="user-dropdown-item" onclick="Navbar.closeUserMenu()">
                                        <span class="material-symbols-rounded">dashboard</span>
                                        <span>Dashboard ${user.role}</span>
                                    </a>
                                ` : ''}

                                <button type="button" class="user-dropdown-item logout" onclick="Navbar.logout()">
                                    <span class="material-symbols-rounded">logout</span>
                                    <span>Keluar dari Akun</span>
                                </button>
                            </div>
                        </div>
                    ` : `
                        <a href="#/login" class="btn btn-outline btn-sm">Masuk</a>
                        <a href="#/register" class="btn btn-primary btn-sm" style="margin-left: 0.5rem;">Daftar</a>
                    `}
                </div>
            </nav>

            <!-- Dropdown Menu Navigasi Lengkap untuk Mobile (semua link sesuai peran) -->
            <div class="rr-mobile-menu" id="rr-mobile-menu">
                <div class="rr-mobile-menu-label">Navigasi</div>
                <a href="#/" class="rr-mobile-menu-item ${currentHash === '#/' ? 'active' : ''}" onclick="Navbar.closeMobileMenu()">
                    <span class="material-symbols-rounded">home</span>
                    Beranda
                </a>
                <a href="#/products" class="rr-mobile-menu-item ${currentHash === '#/products' ? 'active' : ''}" onclick="Navbar.closeMobileMenu()">
                    <span class="material-symbols-rounded">storefront</span>
                    Semua Produk
                </a>
                ${managementLinksHtml}
                ${isAuthenticated ? `
                    <div class="rr-mobile-menu-label">Akun Saya</div>
                    <a href="#/profile" class="rr-mobile-menu-item ${currentHash.startsWith('#/profile') ? 'active' : ''}" onclick="Navbar.closeMobileMenu()">
                        <span class="material-symbols-rounded">account_circle</span>
                        Profil & Keamanan
                    </a>
                    <a href="#/profile?tab=orders" class="rr-mobile-menu-item" onclick="Navbar.closeMobileMenu()">
                        <span class="material-symbols-rounded">receipt_long</span>
                        Riwayat Pesanan
                    </a>
                    <a href="#/profile?tab=address" class="rr-mobile-menu-item" onclick="Navbar.closeMobileMenu()">
                        <span class="material-symbols-rounded">pin_drop</span>
                        Alamat & Titik Peta
                    </a>
                    <button type="button" class="rr-mobile-menu-item logout-item" onclick="Navbar.closeMobileMenu(); Navbar.logout();">
                        <span class="material-symbols-rounded">logout</span>
                        Keluar dari Akun
                    </button>
                ` : `
                    <div class="rr-mobile-menu-label">Akun</div>
                    <a href="#/login" class="rr-mobile-menu-item" onclick="Navbar.closeMobileMenu()">
                        <span class="material-symbols-rounded">login</span>
                        Masuk
                    </a>
                    <a href="#/register" class="rr-mobile-menu-item" onclick="Navbar.closeMobileMenu()">
                        <span class="material-symbols-rounded">person_add</span>
                        Daftar Akun Baru
                    </a>
                `}
            </div>

            <!-- Bottom Navigation Bar untuk Tampilan Mobile (<= 768px Sesuai Ketentuan PDF Poin 1) -->
            <nav class="rr-mobile-bottom-nav">
                <a href="#/" class="rr-mobile-nav-item ${currentHash === '#/' ? 'active' : ''}">
                    <span class="material-symbols-rounded">home</span>
                    <span>Beranda</span>
                </a>
                <a href="#/products" class="rr-mobile-nav-item ${currentHash === '#/products' ? 'active' : ''}">
                    <span class="material-symbols-rounded">storefront</span>
                    <span>Menu</span>
                </a>
                <a href="#/cart" class="rr-mobile-nav-item ${currentHash === '#/cart' || currentHash === '#/checkout' ? 'active' : ''}">
                    <span class="material-symbols-rounded">shopping_bag</span>
                    <span>Keranjang</span>
                    <span class="rr-mobile-cart-badge cart-counter" style="display:none;">0</span>
                </a>
                ${isAuthenticated ? `
                    ${role !== 'customer' ? `
                        <a href="#/dashboard" class="rr-mobile-nav-item ${currentHash === '#/dashboard' ? 'active' : ''}">
                            <span class="material-symbols-rounded">dashboard</span>
                            <span>Dashboard</span>
                        </a>
                    ` : `
                        <a href="#/profile" class="rr-mobile-nav-item ${currentHash === '#/profile' ? 'active' : ''}">
                            <span class="material-symbols-rounded">account_circle</span>
                            <span>Profil</span>
                        </a>
                    `}
                ` : `
                    <a href="#/login" class="rr-mobile-nav-item ${currentHash === '#/login' ? 'active' : ''}">
                        <span class="material-symbols-rounded">login</span>
                        <span>Masuk</span>
                    </a>
                `}
            </nav>
        `;

        App.updateCartBadge();
        this.setupDropdownListener();
    },

    toggleUserMenu(e) {
        if (e) e.stopPropagation();
        const dd = document.getElementById('navbar-user-dropdown');
        if (dd) {
            dd.classList.toggle('open');
            const arrow = dd.querySelector('.user-profile-trigger .material-symbols-rounded:last-child');
            if (arrow) {
                arrow.style.transform = dd.classList.contains('open') ? 'rotate(180deg)' : 'none';
            }
        }
    },

    toggleMobileMenu(e) {
        if (e) e.stopPropagation();
        const menu = document.getElementById('rr-mobile-menu');
        if (menu) menu.classList.toggle('open');
    },

    closeMobileMenu() {
        const menu = document.getElementById('rr-mobile-menu');
        if (menu) menu.classList.remove('open');
    },

    closeUserMenu() {
        const dd = document.getElementById('navbar-user-dropdown');
        if (dd) {
            dd.classList.remove('open');
            const arrow = dd.querySelector('.user-profile-trigger .material-symbols-rounded:last-child');
            if (arrow) arrow.style.transform = 'none';
        }
    },

    setupDropdownListener() {
        if (this.__listenerSetup) return;
        this.__listenerSetup = true;
        document.addEventListener('click', (e) => {
            if (!e.target.closest('#navbar-user-dropdown')) {
                Navbar.closeUserMenu();
            }
            if (!e.target.closest('#rr-mobile-menu') && !e.target.closest('.rr-menu-toggle')) {
                Navbar.closeMobileMenu();
            }
        });
    },

    logout() {
        this.closeUserMenu();
        // Cabut refresh token di server (best-effort) sebelum menghapus sesi lokal
        try {
            const rt = Api.getRefreshToken();
            if (rt) {
                fetch(`${Api.API_BASE || '/api/ruangrasa'}/auth/logout`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${Api.getToken() || ''}` },
                    body: JSON.stringify({ RefreshToken: rt }),
                    keepalive: true
                }).catch(() => {});
            }
        } catch {}
        Api.clearSession();
        App.cart = [];
        try {
            localStorage.removeItem('rr_cart');
        } catch {}
        App.setSelectedTable(null);
        App.setOrderType('DineIn');
        App.updateCartBadge();
        Toast.info('Anda telah berhasil keluar dari akun.');
        Navbar.render();
        if (window.Router) {
            Router.navigate('#/login');
        } else {
            window.location.hash = '#/login';
        }
    }
};
