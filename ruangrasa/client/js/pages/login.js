// ==========================================================================
// LOGIN PAGE COMPONENT (Luxury Editorial Version)
// ==========================================================================

const LoginPage = {
    render() {
        const root = document.getElementById('page-root');
        if (!root) return;

        root.innerHTML = `
            <div class="auth-page-ambient">
                <div class="auth-card-split">
                    <!-- Sisi Kiri: Visual Showcase Artisan Coffee -->
                    <div class="auth-visual-hero">
                        <div>
                            <div class="auth-visual-badge">
                                <span class="material-symbols-rounded" style="font-size: 16px; color: var(--accent-light);">local_cafe</span>
                                Ruang Rasa Coffee & Roastery
                            </div>
                            <h2 class="auth-visual-title">Seduhan Otentik & Ruang Temu Penuh Cerita</h2>
                            <p class="auth-visual-desc">
                                Nikmati kemudahan memesan biji kopi artisan pilihan, reservasi meja santai, dan nikmati beragam voucher promo eksklusif.
                            </p>

                            <div class="auth-features-list">
                                <div class="auth-feature-item">
                                    <div class="auth-feature-icon">
                                        <span class="material-symbols-rounded">table_restaurant</span>
                                    </div>
                                    <span>Pemesanan Meja Dine-In & Live Denah</span>
                                </div>
                                <div class="auth-feature-item">
                                    <div class="auth-feature-icon">
                                        <span class="material-symbols-rounded">receipt_long</span>
                                    </div>
                                    <span>Struk Digital & Pelacakan Driver Real-Time</span>
                                </div>
                                <div class="auth-feature-item">
                                    <div class="auth-feature-icon">
                                        <span class="material-symbols-rounded">savings</span>
                                    </div>
                                    <span>Promo Diskon Spesial Setiap Transaksi</span>
                                </div>
                            </div>
                        </div>

                        <div class="auth-visual-quote">
                            "Kualitas rasa dalam setiap tetes espresso, kenyamanan dalam setiap sudut ruang."
                        </div>
                    </div>

                    <!-- Sisi Kanan: Form Login -->
                    <div class="auth-form-side">
                        <div class="auth-header">
                            <div class="auth-header-icon-wrap">
                                <span class="material-symbols-rounded" style="font-size: 26px;">lock</span>
                            </div>
                            <h1 class="auth-title">Masuk ke Ruang Rasa</h1>
                            <p class="auth-subtitle">Masukkan email dan kata sandi akun Anda untuk mengakses layanan.</p>
                        </div>

                        <form id="login-form" onsubmit="LoginPage.handleSubmit(event)">
                            <div class="auth-input-group">
                                <label>
                                    <span class="material-symbols-rounded" style="font-size: 16px; color: var(--accent);">mail</span>
                                    Alamat Email *
                                </label>
                                <input type="email" id="login-email" class="auth-input-field" 
                                       placeholder="nama@email.com" 
                                       oninput="App.validateInput(this, { required: true, email: true })" required />
                                <span class="material-symbols-rounded auth-input-icon">alternate_email</span>
                            </div>

                            <div class="auth-input-group">
                                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.45rem;">
                                    <label style="margin-bottom: 0;">
                                        <span class="material-symbols-rounded" style="font-size: 16px; color: var(--accent);">lock</span>
                                        Kata Sandi *
                                    </label>
                                    <a href="#/forgot-password" style="font-size: 0.8rem; font-weight: 600; color: var(--accent);">Lupa Sandi?</a>
                                </div>
                                <div class="auth-input-wrapper">
                                    <input type="password" id="login-password" class="auth-input-field" 
                                           style="padding-right: 2.75rem;"
                                           placeholder="••••••••" 
                                           oninput="App.validateInput(this, { required: true, minLength: 6 })" required />
                                    <span class="material-symbols-rounded auth-input-icon">key</span>
                                    <button type="button" class="auth-toggle-pass" onclick="App.togglePasswordVisibility('login-password', this)" title="Lihat Kata Sandi">
                                        <span class="material-symbols-rounded" style="font-size: 19px;">visibility</span>
                                    </button>
                                </div>
                            </div>

                            <button type="submit" id="btn-login-submit" class="auth-submit-btn">
                                <span>Masuk ke Akun</span>
                                <span class="material-symbols-rounded" style="font-size: 19px;">arrow_forward</span>
                            </button>
                        </form>

                        <div style="text-align: center; margin-top: 1.5rem; font-size: 0.88rem; color: var(--text-muted);">
                            Belum memiliki akun? <a href="#/register" style="font-weight: 700; color: var(--accent);">Daftar Akun Baru</a>
                        </div>

                        <!-- Akses Cepat Demo Akun 7 Role -->
                        <div class="auth-demo-chips">
                            <div style="font-size: 0.74rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.06em; text-align: center;">
                                Akses Cepat Demo Akun (7 Role):
                            </div>
                            <div class="auth-demo-grid">
                                <button type="button" class="auth-chip" onclick="LoginPage.fillDemo('admin@ruangrasa.com', 'Password123!')">Admin</button>
                                <button type="button" class="auth-chip" onclick="LoginPage.fillDemo('owner@ruangrasa.com', 'Password123!')">Owner</button>
                                <button type="button" class="auth-chip" onclick="LoginPage.fillDemo('kasir1@ruangrasa.com', 'Password123!')">Kasir</button>
                                <button type="button" class="auth-chip" onclick="LoginPage.fillDemo('dapur1@ruangrasa.com', 'Password123!')">Dapur</button>
                                <button type="button" class="auth-chip" style="background: #fef3c7; color: #92400e; border-color: #fde68a;" onclick="LoginPage.fillDemo('waiter1@ruangrasa.com', 'Password123!')">★ Waiter</button>
                                <button type="button" class="auth-chip" onclick="LoginPage.fillDemo('driver1@ruangrasa.com', 'Password123!')">Driver</button>
                                <button type="button" class="auth-chip" style="grid-column: span 2;" onclick="LoginPage.fillDemo('rian@gmail.com', 'Password123!')">Customer (Rian)</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    fillDemo(email, pass) {
        document.getElementById('login-email').value = email;
        document.getElementById('login-password').value = pass;
        Toast.info(`Akun demo ${email} siap digunakan.`);
    },

    async handleSubmit(e) {
        e.preventDefault();

        const emailEl = document.getElementById('login-email');
        const passEl = document.getElementById('login-password');

        const isEmailValid = App.validateInput(emailEl, { required: true, email: true });
        // Login hanya memeriksa wajib diisi; kebijakan kompleksitas diterapkan saat pendaftaran
        const isPassValid = App.validateInput(passEl, { required: true, minLength: 6 });

        if (!isEmailValid || !isPassValid) {
            Toast.error('Mohon perbaiki data input sebelum melanjutkan.');
            return;
        }

        const submitBtn = document.getElementById('btn-login-submit');
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span>Memverifikasi...</span>';

        try {
            const res = await Api.post('/auth/login', {
                Email: emailEl.value.trim(),
                Password: passEl.value
            });

            if (res && (res.success || res.Success)) {
                const userData = res.data || res.Data;
                Api.setSession(userData);
                Toast.success(`Selamat datang kembali, ${userData.FullName}!`);
                Navbar.render();
                const role = (userData.Role || userData.role || '').toLowerCase();
                if (role === 'customer') {
                    Router.navigate('#/profile');
                } else {
                    Router.navigate('#/dashboard');
                }
            } else {
                Toast.error(res.message || 'Email atau kata sandi tidak sesuai.');
            }
        } catch (err) {
            Toast.error(err.message || 'Gagal melakukan proses login.');
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<span>Masuk ke Akun</span><span class="material-symbols-rounded" style="font-size: 19px;">arrow_forward</span>';
        }
    }
};
