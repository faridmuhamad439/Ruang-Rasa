// ==========================================================================
// FORGOT & RESET PASSWORD COMPONENT (Luxury Editorial Version)
// ==========================================================================

const ForgotPasswordPage = {
    step: 'request', // 'request' atau 'reset'
    resetEmail: '',

    render() {
        const root = document.getElementById('page-root');
        if (!root) return;

        const isResetRoute = window.location.hash.startsWith('#/reset-password');
        if (isResetRoute && this.step !== 'reset') {
            this.step = 'reset';
        } else if (!isResetRoute && this.step === 'reset' && !this.resetEmail) {
            this.step = 'request';
        }

        const isReset = this.step === 'reset';

        root.innerHTML = `
            <div class="auth-page-ambient">
                <div class="auth-card-split">
                    <!-- Sisi Kiri: Visual Showcase Artisan Coffee -->
                    <div class="auth-visual-hero">
                        <div>
                            <div class="auth-visual-badge">
                                <span class="material-symbols-rounded" style="font-size: 16px; color: var(--accent-light);">verified_user</span>
                                Keamanan & Pemulihan Akun
                            </div>
                            <h2 class="auth-visual-title">Akses Kembali Ruang Rasa Anda</h2>
                            <p class="auth-visual-desc">
                                Sistem verifikasi berbasis token instan memastikan keamanan penuh atas data pesanan, voucher diskon, dan riwayat kunjungan Anda.
                            </p>

                            <div class="auth-features-list">
                                <div class="auth-feature-item">
                                    <div class="auth-feature-icon">
                                        <span class="material-symbols-rounded">mark_email_read</span>
                                    </div>
                                    <span>Token Pemulihan Kilat 6-Digit</span>
                                </div>
                                <div class="auth-feature-item">
                                    <div class="auth-feature-icon">
                                        <span class="material-symbols-rounded">shield</span>
                                    </div>
                                    <span>Enkripsi Kata Sandi Standar BCrypt</span>
                                </div>
                                <div class="auth-feature-item">
                                    <div class="auth-feature-icon">
                                        <span class="material-symbols-rounded">support_agent</span>
                                    </div>
                                    <span>Bantuan Layanan 24/7 di Coffee Shop</span>
                                </div>
                            </div>
                        </div>

                        <div class="auth-visual-quote">
                            "Kehangatan secangkir kopi berawal dari rasa aman dan kenyamanan pelanggan."
                        </div>
                    </div>

                    <!-- Sisi Kanan: Form Pemulihan Kata Sandi -->
                    <div class="auth-form-side">
                        <div class="auth-header">
                            <div class="auth-header-icon-wrap">
                                <span class="material-symbols-rounded" style="font-size: 26px;">${isReset ? 'password' : 'lock_reset'}</span>
                            </div>
                            <h1 class="auth-title">${isReset ? 'Atur Ulang Kata Sandi' : 'Lupa Kata Sandi'}</h1>
                            <p class="auth-subtitle">
                                ${isReset 
                                    ? 'Masukkan token reset yang Anda peroleh dan buat kata sandi baru.' 
                                    : 'Masukkan alamat email akun Anda untuk menerima token pemulihan instan.'}
                            </p>
                        </div>

                        ${this.step === 'request' ? `
                            <form onsubmit="ForgotPasswordPage.handleRequest(event)">
                                <div class="auth-input-group">
                                    <label>
                                        <span class="material-symbols-rounded" style="font-size: 16px; color: var(--accent);">mail</span>
                                        Alamat Email Terdaftar *
                                    </label>
                                    <input type="email" id="forgot-email" class="auth-input-field" placeholder="nama@email.com" 
                                           oninput="App.validateInput(this, { required: true, email: true })" required />
                                    <span class="material-symbols-rounded auth-input-icon">alternate_email</span>
                                </div>

                                <button type="submit" class="auth-submit-btn">
                                    <span>Kirim Token Pemulihan</span>
                                    <span class="material-symbols-rounded" style="font-size: 19px;">arrow_forward</span>
                                </button>
                            </form>
                        ` : `
                            <form onsubmit="ForgotPasswordPage.handleReset(event)">
                                <div class="auth-input-group">
                                    <label>
                                        <span class="material-symbols-rounded" style="font-size: 16px; color: var(--accent);">pin</span>
                                        Kode Token Reset *
                                    </label>
                                    <input type="text" id="reset-token" class="auth-input-field" placeholder="Contoh: RESET-123456" required />
                                    <span class="material-symbols-rounded auth-input-icon">key</span>
                                </div>

                                <div class="auth-input-group">
                                    <label>
                                        <span class="material-symbols-rounded" style="font-size: 16px; color: var(--accent);">lock</span>
                                        Kata Sandi Baru *
                                    </label>
                                    <div class="auth-input-wrapper">
                                        <input type="password" id="new-password" class="auth-input-field" style="padding-right: 2.75rem;" placeholder="Min. 8 karakter, ada besar/kecil & angka"
                                               oninput="ForgotPasswordPage.validatePasswordField()" required />
                                        <span class="material-symbols-rounded auth-input-icon">lock</span>
                                        <button type="button" class="auth-toggle-pass" onclick="App.togglePasswordVisibility('new-password', this)" title="Lihat Kata Sandi">
                                            <span class="material-symbols-rounded" style="font-size: 19px;">visibility</span>
                                        </button>
                                    </div>
                                    <div id="reset-password-meter" class="auth-pass-meter" aria-hidden="true">
                                        <div class="auth-pass-meter-bar" id="reset-password-meter-bar" style="width: 0%;"></div>
                                    </div>
                                    <div class="auth-field-hint" id="reset-password-hint">Kata sandi: min. 8 karakter, kombinasi huruf besar, huruf kecil & angka. Tanpa batas maksimum.</div>
                                </div>

                                <div class="auth-input-group">
                                    <label>
                                        <span class="material-symbols-rounded" style="font-size: 16px; color: var(--accent);">lock_reset</span>
                                        Konfirmasi Kata Sandi Baru *
                                    </label>
                                    <div class="auth-input-wrapper">
                                        <input type="password" id="confirm-new-password" class="auth-input-field" style="padding-right: 2.75rem;" placeholder="Ulangi kata sandi baru"
                                               oninput="App.validateInput(this, { required: true, matchWith: '#new-password', matchMessage: 'Kata sandi tidak cocok' })" required />
                                        <span class="material-symbols-rounded auth-input-icon">check_circle</span>
                                        <button type="button" class="auth-toggle-pass" onclick="App.togglePasswordVisibility('confirm-new-password', this)" title="Lihat Kata Sandi">
                                            <span class="material-symbols-rounded" style="font-size: 19px;">visibility</span>
                                        </button>
                                    </div>
                                </div>

                                <button type="submit" class="auth-submit-btn">
                                    <span>Simpan Kata Sandi Baru</span>
                                    <span class="material-symbols-rounded" style="font-size: 19px;">arrow_forward</span>
                                </button>
                            </form>
                        `}

                        <div style="text-align: center; margin-top: 1.75rem; font-size: 0.88rem; color: var(--text-muted);">
                            Sudah ingat kata sandi? <a href="#/login" style="font-weight: 700; color: var(--accent);">Kembali ke Halaman Masuk</a>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    // =========================== VALIDASI LIVE ===========================

    validatePasswordField() {
        const passEl = document.getElementById('new-password');
        const meterBar = document.getElementById('reset-password-meter-bar');
        const hintEl = document.getElementById('reset-password-hint');
        const strength = App.passwordStrength(passEl ? passEl.value : '');

        if (meterBar) {
            const percent = [0, 30, 60, 85, 100][strength.level];
            const colors = ['#e2e8f0', '#dc2626', '#d97706', '#16a34a', '#16a34a'];
            meterBar.style.width = `${percent}%`;
            meterBar.style.background = colors[strength.level];
        }
        if (hintEl) {
            const labels = ['', 'Lemah', 'Sedang', 'Kuat', 'Sangat Kuat'];
            const missing = Object.entries(strength.checks)
                .filter(([, ok]) => !ok).map(([label]) => label.toLowerCase());
            hintEl.textContent = missing.length
                ? `Kekuatan: ${labels[strength.level]} \u2014 butuh ${missing.join(', ')}.`
                : `Kekuatan: ${labels[strength.level]}. Tanpa batas maksimum karakter.`;
        }
        return App.validateInput(passEl, { required: true, strongPassword: true });
    },

    async handleRequest(e) {
        e.preventDefault();
        const emailEl = document.getElementById('forgot-email');
        if (!App.validateInput(emailEl, { required: true, email: true })) {
            Toast.error('Masukkan alamat email yang valid.');
            return;
        }
        const email = emailEl.value.trim();

        try {
            const res = await Api.post('/auth/forgot-password', { Email: email });
            const token = (res && (res.data || res.Data)) || ('RESET-' + Math.floor(100000 + Math.random() * 900000));
            this.step = 'reset';
            this.resetEmail = email;
            Toast.success(`Token pemulihan berhasil diterbitkan! (Kode: ${token})`, 8000);
            this.render();

            setTimeout(() => {
                const tokenInput = document.getElementById('reset-token');
                if (tokenInput) tokenInput.value = token;
            }, 100);
        } catch (err) {
            Toast.error(err.message || 'Gagal memproses permintaan token reset.');
        }
    },

    async handleReset(e) {
        e.preventDefault();
        const token = document.getElementById('reset-token').value.trim();
        const passEl = document.getElementById('new-password');
        const confirmEl = document.getElementById('confirm-new-password');
        const pass = passEl ? passEl.value : '';
        const confirm = confirmEl ? confirmEl.value : '';

        const isTokenValid = !!token;
        const isPassValid = this.validatePasswordField();
        const isConfirmValid = App.validateInput(confirmEl, {
            required: true,
            matchWith: '#new-password',
            matchMessage: 'Konfirmasi kata sandi tidak cocok.'
        });

        if (!isTokenValid) {
            Toast.error('Kode token reset wajib diisi.');
            return;
        }
        if (!isPassValid || !isConfirmValid) {
            Toast.error('Mohon periksa kembali isian kata sandi baru.');
            return;
        }

        try {
            const res = await Api.post('/auth/reset-password', {
                Token: token,
                NewPassword: pass,
                ConfirmNewPassword: confirm
            });

            Toast.success('Kata sandi berhasil diperbarui! Silakan masuk kembali.');
            this.step = 'request';
            if (window.Router) {
                Router.navigate('#/login');
            } else {
                window.location.hash = '#/login';
            }
        } catch (err) {
            Toast.error(err.message || 'Gagal memperbarui kata sandi.');
        }
    }
};

window.ForgotPasswordPage = ForgotPasswordPage;
