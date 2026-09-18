// ==========================================================================
// CLIENT-SIDE HASH ROUTER WITH PROFILE & ROLE-BASED ACCESS CONTROL
// ==========================================================================

const Router = {
    routes: {
        '#/': { page: HomePage, isPublic: true },
        '#/products': { page: ProductsPage, isPublic: true },
        '#/cart': { page: CartPage, isPublic: true },
        '#/checkout': { page: CartPage, isPublic: true },
        '#/login': { page: LoginPage, isPublic: true },
        '#/register': { page: RegisterPage, isPublic: true },
        '#/forgot-password': { page: ForgotPasswordPage, isPublic: true },
        '#/reset-password': { page: ForgotPasswordPage, isPublic: true },
        '#/profile': { page: ProfilePage, isPrivate: true },
        '#/dashboard': { page: DashboardPage, isPrivate: true, roles: ['Admin', 'Owner', 'Kasir', 'Barista', 'Dapur', 'Waiter', 'Driver'] },
        '#/staff-management': { page: DashboardPage, isPrivate: true, roles: ['Admin', 'Owner'] },
        '#/menu-crud': { page: MenuCrudPage, isPrivate: true, roles: ['Admin', 'Owner'] },
        '#/table-management': { page: TableManagementPage, isPrivate: true, roles: ['Admin', 'Owner', 'Kasir', 'Waiter'] },
        '#/promo-crud': { page: PromoCrudPage, isPrivate: true, roles: ['Admin', 'Owner'] },
        '#/tracking': { page: TrackingPage, isPublic: true },
        '#/driver-tracking': { page: TrackingPage, isPublic: true },
        '#/401': { isError: 401 },
        '#/403': { isError: 403 },
        '#/404': { isError: 404 },
        '#/500': { isError: 500 }
    },

    init() {
        window.addEventListener('hashchange', () => this.handleRoute());

        // Intercept semua klik link anchor internal (#/...) untuk navigasi SPA instan tanpa perlu refresh manual
        document.addEventListener('click', (e) => {
            const anchor = e.target.closest('a');
            if (!anchor) return;
            const href = anchor.getAttribute('href');
            if (href && href.startsWith('#/')) {
                // Jika hash yang diklik sama dengan posisi saat ini, browser tidak memicu hashchange.
                // Panggil handleRoute secara eksplisit agar halaman langsung merespons.
                if (window.location.hash === href) {
                    e.preventDefault();
                    this.handleRoute();
                }
            }
        });

        this.handleRoute();
    },

    navigate(hash) {
        if (!hash) return;
        if (!hash.startsWith('#/')) {
            hash = '#/' + hash.replace(/^#?\/?/, '');
        }
        if (window.location.hash === hash) {
            this.handleRoute();
        } else {
            window.location.hash = hash;
        }
    },

    handleRoute() {
        let hash = window.location.hash || '#/';
        // Jika terdapat query params pada hash misal #/profile?tab=orders
        const cleanHash = hash.split('?')[0];
        const route = this.routes[cleanHash] || this.routes[hash];

        // Matikan polling realtime dashboard jika berpindah ke halaman lain
        const isDashboardRoute = cleanHash === '#/dashboard' || cleanHash === '#/staff-management';
        if (!isDashboardRoute && window.DashboardPage && typeof DashboardPage.stopPolling === 'function') {
            DashboardPage.stopPolling();
        }

        if (cleanHash === '#/staff-management' && window.DashboardPage) {
            DashboardPage.activeTab = 'staff';
        } else if (cleanHash === '#/dashboard' && window.DashboardPage && hash.includes('tab=')) {
            const params = new URLSearchParams(hash.split('?')[1]);
            if (params.get('tab')) {
                DashboardPage.activeTab = params.get('tab');
            }
        }

        if (!route) {
            ErrorPages.render(404);
            Navbar.render();
            return;
        }

        if (route.isError) {
            ErrorPages.render(route.isError);
            Navbar.render();
            return;
        }

        const user = Api.getCurrentUser();
        const isAuthenticated = !!user;
        const role = user ? (user.role || '').toLowerCase() : '';

        // Redirect Customer dari Dashboard ke Profile
        if (cleanHash === '#/dashboard' && role === 'customer') {
            this.navigate('#/profile');
            return;
        }

        // Route Guard: Private Route Check
        if (route.isPrivate && !isAuthenticated) {
            Toast.warning('Silakan masuk ke akun Anda terlebih dahulu.');
            this.navigate('#/login');
            return;
        }

        // Route Guard: RBAC (Role Check)
        if (route.roles && user) {
            const allowed = route.roles.some(r => r.toLowerCase() === role);
            if (!allowed) {
                if (role === 'customer') {
                    this.navigate('#/profile');
                    return;
                }
                Toast.error(`Akses ditolak: Halaman ini hanya untuk staf/admin.`);
                this.navigate('#/403');
                return;
            }
        }

        // 1. Render navbar terlebih dahulu agar state aktif link langsung berganti
        Navbar.render();

        // 2. Render halaman secara instan (0ms) sehingga user tidak perlu menunggu request selesai
        try {
            if (route.page && typeof route.page.render === 'function') {
                route.page.render();
            }
        } catch (err) {
            console.warn('Initial route render warning:', err);
        }

        // 3. Jalankan inisialisasi data & peta secara asynchronous tanpa menghalangi UI
        if (route.page && typeof route.page.init === 'function') {
            try {
                const initResult = route.page.init();
                if (initResult && typeof initResult.catch === 'function') {
                    initResult.catch(err => {
                        console.error('Page async init error:', err);
                    });
                }
            } catch (err) {
                console.error('Page sync init error:', err);
            }
        }

        if (window.CustomSelect) {
            CustomSelect.enhanceAll();
        }

        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
};
