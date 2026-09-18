// ==========================================================================
// APP STATE & CORE MANAGERS (Cart, Session, Validation Helper)
// ==========================================================================

const App = {
    cart: [],
    selectedTable: null, // TableId, TableNumber saat tipe pesanan Dine-In
    orderType: 'DineIn', // 'DineIn', 'TakeAway', 'Delivery'

    init() {
        this.loadCart();
        Navbar.render();
        if (window.CustomSelect) {
            CustomSelect.init();
        }
        Router.init();
    },

    // Cart & Order Session Management
    loadCart() {
        try {
            const saved = localStorage.getItem('rr_cart');
            this.cart = saved ? JSON.parse(saved) : [];
        } catch {
            this.cart = [];
        }
        try {
            const savedOrderType = localStorage.getItem('rr_order_type');
            if (savedOrderType && ['DineIn', 'TakeAway', 'Delivery'].includes(savedOrderType)) {
                this.orderType = savedOrderType;
            }
            const savedTable = localStorage.getItem('rr_selected_table');
            if (savedTable) {
                this.selectedTable = JSON.parse(savedTable);
            }
        } catch {
            this.orderType = 'DineIn';
        }
        this.updateCartBadge();
    },

    setOrderType(type) {
        if (!type) return;
        this.orderType = type;
        try {
            localStorage.setItem('rr_order_type', type);
        } catch {}
    },

    setSelectedTable(table) {
        this.selectedTable = table;
        try {
            if (table) {
                localStorage.setItem('rr_selected_table', JSON.stringify(table));
            } else {
                localStorage.removeItem('rr_selected_table');
            }
        } catch {}
    },

    saveCart() {
        localStorage.setItem('rr_cart', JSON.stringify(this.cart));
        this.updateCartBadge();
        if (window.CartPage && (window.location.hash === '#/cart' || window.location.hash === '#/checkout')) {
            CartPage.render();
        }
    },

    addToCart(menu, notify = true) {
        if (!menu) return;
        const menuId = menu.MenuId ?? menu.menuId ?? menu.Id ?? menu.id ?? Date.now();
        const name = menu.Name ?? menu.name ?? 'Menu';
        const price = Number(menu.Price ?? menu.price ?? 0);
        const imageUrl = menu.ImageUrl ?? menu.imageUrl ?? '';

        const existing = this.cart.find(item => (item.MenuId ?? item.menuId ?? item.Id ?? item.id) == menuId);
        if (existing) {
            existing.Quantity = (Number(existing.Quantity) || 1) + 1;
        } else {
            this.cart.push({
                MenuId: menuId,
                Name: name,
                Price: price,
                ImageUrl: imageUrl,
                Quantity: 1,
                Notes: ''
            });
        }
        this.saveCart();
        if (notify) {
            Toast.success(`"${name}" berhasil ditambahkan ke keranjang!`);
        }
    },

    buyNow(menu) {
        if (!menu) return;
        const name = menu.Name ?? menu.name ?? 'Menu';
        this.addToCart(menu, false);
        Toast.info(`Membuka checkout untuk "${name}"...`);
        
        // Pindah halaman ke checkout secara langsung (bukan popup)
        if (window.Router) {
            Router.navigate('#/checkout');
        } else {
            window.location.hash = '#/checkout';
        }
    },

    removeFromCart(menuId) {
        this.cart = this.cart.filter(item => (item.MenuId ?? item.menuId ?? item.Id ?? item.id) != menuId);
        this.saveCart();
    },

    updateQuantity(menuId, delta) {
        const item = this.cart.find(i => (i.MenuId ?? i.menuId ?? i.Id ?? i.id) == menuId);
        if (item) {
            item.Quantity = (Number(item.Quantity) || 1) + delta;
            if (item.Quantity <= 0) {
                this.removeFromCart(menuId);
            } else {
                this.saveCart();
            }
        }
    },

    clearCart() {
        this.cart = [];
        this.saveCart();
    },

    getCartCount() {
        return this.cart.reduce((sum, item) => sum + (Number(item.Quantity) || 1), 0);
    },

    getCartSubtotal() {
        return this.cart.reduce((sum, item) => sum + ((Number(item.Price) || 0) * (Number(item.Quantity) || 1)), 0);
    },

    updateCartBadge() {
        const count = this.getCartCount();
        const badgeEls = document.querySelectorAll('.cart-counter, .cart-count, .rr-mobile-cart-badge');
        badgeEls.forEach(el => {
            el.textContent = count;
            el.style.display = count > 0 ? (el.classList.contains('rr-mobile-cart-badge') ? 'flex' : 'inline-block') : 'none';
        });
    },

    // Formatter Rupiah
    formatRupiah(amount) {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(amount || 0);
    },

    // Form Validation Helper (Poin 9 PDF)
    // Aturan yang tersedia:
    //   { required }             -> field wajib diisi
    //   { fullName }             -> nama lengkap: huruf/spasi/tanda ' . - , hanya huruf;
    //                               minimal 3 karakter, TANPA batas maksimum (per ketentuan)
    //   { email }                -> format email ketat (user@domain.tld, TLD >= 2 huruf)
    //   { phoneId }              -> nomor telepon Indonesia sesuai prefix provider
    //                               (Telkomsel, Indosat Ooredoo, XL Axiata, Smartfren, Tri,
    //                                By.U, LinkAja/im3 format 08xx atau +628xx, 9-15 digit)
    //   { strongPassword }       -> min 8 karakter, wajib huruf besar + huruf kecil + angka,
    //                               TANPA batas maksimum (per ketentuan)
    //   { minLength, maxLength } -> aturan generik panjang karakter
    //   { matchWith }            -> samakan dengan field lain (konfirmasi sandi)
    validateInput(input, rules = {}) {
        const value = (input.value || '').trim();
        let errorMessage = '';

        const FAIL = msg => { errorMessage = msg; };

        if (rules.required && !value) {
            errorMessage = 'Field ini wajib diisi.';
        } else if (rules.fullName) {
            // Nama lengkap: hanya huruf, spasi, dan tanda kutip/titik/koma/strip
            if (!/^[A-Za-zÀ-ÿ' .,-]+$/.test(value)) {
                FAIL('Nama hanya boleh berisi huruf, spasi, dan tanda ( \' . - , ).');
            } else if (value.length < 3) {
                FAIL('Nama lengkap minimal 3 karakter.');
            }
            // Tanpa batas maksimum sesuai ketentuan
        } else if (rules.email && !/^[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}$/.test(value)) {
            errorMessage = 'Format email tidak valid (contoh: nama@email.com).';
        } else if (rules.phoneId || rules.phone) {
            const res = this.validateIndonesianPhone(value);
            if (!res.valid) errorMessage = res.message;
        } else if (rules.strongPassword) {
            if (value.length < 8) {
                errorMessage = 'Kata sandi minimal 8 karakter.';
            } else if (!/[A-Z]/.test(value)) {
                errorMessage = 'Kata sandi wajib mengandung minimal 1 huruf KAPITAL.';
            } else if (!/[a-z]/.test(value)) {
                errorMessage = 'Kata sandi wajib mengandung minimal 1 huruf kecil.';
            } else if (!/[0-9]/.test(value)) {
                errorMessage = 'Kata sandi wajib mengandung minimal 1 angka.';
            }
            // Tanpa batas maksimum sesuai ketentuan
        } else if (rules.minLength && value.length < rules.minLength) {
            errorMessage = `Minimal ${rules.minLength} karakter.`;
        } else if (rules.maxLength && value.length > rules.maxLength) {
            errorMessage = `Maksimal ${rules.maxLength} karakter.`;
        } else if (rules.matchWith) {
            const targetEl = document.querySelector(rules.matchWith);
            if (targetEl && targetEl.value !== value) {
                errorMessage = rules.matchMessage || 'Konfirmasi tidak sesuai.';
            }
        }

        // Tampilkan/sembunyikan error
        let feedbackEl = input.parentElement.querySelector('.invalid-feedback');
        if (errorMessage) {
            input.classList.add('is-invalid');
            if (!feedbackEl) {
                feedbackEl = document.createElement('div');
                feedbackEl.className = 'invalid-feedback';
                input.parentElement.appendChild(feedbackEl);
            }
            feedbackEl.textContent = errorMessage;
            return false;
        } else {
            input.classList.remove('is-invalid');
            if (feedbackEl) {
                feedbackEl.textContent = '';
            }
            return true;
        }
    },

    // =====================================================================
    // VALIDASI NOMOR TELEPON INDONESIA SESUAI PROVIDER
    // Menerima format 08xx, +628xx, 628xx (spasi/strip diabaikan).
    // =====================================================================
    PHONE_ID_PREFIXES: [
        { provider: 'Telkomsel (simPATI / Kartu As / Halo)', prefixes: ['811', '812', '813', '821', '822', '852', '853', '851'] },
        { provider: 'Indosat Ooredoo (IM3 / Tri)',           prefixes: ['814', '815', '816', '855', '856', '857', '858'] },
        { provider: 'XL Axiata (Xtra Combo / Xplore)',       prefixes: ['817', '818', '819', '859', '877', '878'] },
        { provider: 'Smartfren',                             prefixes: ['881', '882', '883', '884', '885', '886', '887', '888', '889'] },
        { provider: 'Tri (3)',                               prefixes: ['894', '895', '896', '897', '898', '899'] },
        { provider: 'By.U (Telkomsel)',                      prefixes: ['851'] }
    ],

    validateIndonesianPhone(raw) {
        const digits = (raw || '').replace(/[\s()-]/g, '');

        if (!digits) return { valid: false, message: 'Nomor telepon wajib diisi.' };

        // Normalisasi ke format 08xxxxxxxxxx
        let normalized = digits;
        if (/^\+62|^62/.test(normalized)) normalized = '0' + normalized.replace(/^\+?62/, '');
        if (!/^08\d{7,12}$/.test(normalized)) {
            return {
                valid: false,
                message: 'Nomor telepon Indonesia harus 9-14 digit setelah 08 (format 08xx atau +628xx).'
            };
        }

        const prefix3 = normalized.slice(1, 4); // ambil 3 digit setelah leading '0' (812, 851, dst.)
        const provider = this.PHONE_ID_PREFIXES.find(p => p.prefixes.includes(prefix3));
        if (!provider) {
            return {
                valid: false,
                message: `Prefix ${prefix3} bukan nomor provider Indonesia yang dikenal ` +
                         `(Telkomsel, Indosat, XL, Smartfren, Tri, By.U).`
            };
        }

        return { valid: true, message: '', normalized, provider: provider.provider };
    },

    // Hitung kekuatan kata sandi: 0-4 (lemah -> sangat kuat) + daftar syarat yang belum terpenuhi
    passwordStrength(value) {
        const v = value || '';
        const checks = {
            'Minimal 8 karakter': v.length >= 8,
            'Ada huruf KAPITAL': /[A-Z]/.test(v),
            'Ada huruf kecil': /[a-z]/.test(v),
            'Ada angka': /[0-9]/.test(v)
        };
        const passed = Object.values(checks).filter(Boolean).length;
        const level = passed === 0 ? 0 : (passed <= 2 ? 1 : (passed === 3 ? 2 : 3));
        return { passed, total: 4, level, checks };
    },

    togglePasswordVisibility(inputId, btnEl) {
        const input = typeof inputId === 'string' ? document.getElementById(inputId) : inputId;
        if (!input) return;
        const icon = btnEl ? btnEl.querySelector('.material-symbols-rounded') : null;
        if (input.type === 'password') {
            input.type = 'text';
            if (icon) icon.textContent = 'visibility_off';
            if (btnEl) btnEl.setAttribute('title', 'Sembunyikan Kata Sandi');
        } else {
            input.type = 'password';
            if (icon) icon.textContent = 'visibility';
            if (btnEl) btnEl.setAttribute('title', 'Lihat Kata Sandi');
        }
    }
};
