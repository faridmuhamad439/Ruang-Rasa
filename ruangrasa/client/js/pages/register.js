// ==========================================================================
// REGISTER PAGE COMPONENT (Luxury Editorial Version)
// ==========================================================================

const RegisterPage = {
    render() {
        const root = document.getElementById('page-root');
        if (!root) return;

        const currentUser = Api.getCurrentUser();
        const isAdmin = currentUser && currentUser.role === 'Admin';

        root.innerHTML = `
            <div class="auth-page-ambient">
                <div class="auth-card-split">
                    <!-- Sisi Kiri: Visual Showcase Artisan Coffee -->
                    <div class="auth-visual-hero">
                        <div>
                            <div class="auth-visual-badge">
                                <span class="material-symbols-rounded" style="font-size: 16px; color: var(--accent-light);">loyalty</span>
                                Komunitas Pecinta Kopi
                            </div>
                            <h2 class="auth-visual-title">Bergabung Bersama Keluarga Ruang Rasa</h2>
                            <p class="auth-visual-desc">
                                Dapatkan akses prioritas reservasi meja, kemudahan pesan antar, serta voucher diskon khusus anggota baru.
                            </p>

                            <div class="auth-features-list">
                                <div class="auth-feature-item">
                                    <div class="auth-feature-icon">
                                        <span class="material-symbols-rounded">percent</span>
                                    </div>
                                    <span>Voucher Diskon 20% Pelanggan Baru</span>
                                </div>
                                <div class="auth-feature-item">
                                    <div class="auth-feature-icon">
                                        <span class="material-symbols-rounded">coffee</span>
                                    </div>
                                    <span>Pilihan Biji Kopi Artisan Nusantara</span>
                                </div>
                                <div class="auth-feature-item">
                                    <div class="auth-feature-icon">
                                        <span class="material-symbols-rounded">map</span>
                                    </div>
                                    <span>Peta Titik Pengantaran Akurat (OSM)</span>
                                </div>
                            </div>
                        </div>

                        <div class="auth-visual-quote">
                            "Menyajikan bukan sekadar kopi, melainkan ruang hangat untuk pulang."
                        </div>
                    </div>

                    <!-- Sisi Kanan: Form Register -->
                    <div class="auth-form-side">
                        <div class="auth-header">
                            <div class="auth-header-icon-wrap">
                                <span class="material-symbols-rounded" style="font-size: 26px;">${isAdmin ? 'person_add' : 'badge'}</span>
                            </div>
                            <h1 class="auth-title">${isAdmin ? 'Tambah Akun Staf' : 'Daftar Akun Baru'}</h1>
                            <p class="auth-subtitle">
                                ${isAdmin ? 'Sebagai Admin, daftarkan akun operasional staf (Kasir, Dapur, Waiter, Driver).' : 'Lengkapi data diri Anda untuk membuat akun pelanggan Ruang Rasa.'}
                            </p>
                        </div>

                        <form id="register-form" onsubmit="RegisterPage.handleSubmit(event)">
                            <div class="auth-input-group">
                                <label>
                                    <span class="material-symbols-rounded" style="font-size: 16px; color: var(--accent);">person</span>
                                    Nama Lengkap *
                                </label>
                                <input type="text" id="reg-name" class="auth-input-field" placeholder="Contoh: Rian Hidayat"
                                       oninput="App.validateInput(this, { required: true, fullName: true })" required />
                                <span class="material-symbols-rounded auth-input-icon">badge</span>
                                <div class="auth-field-hint">Min. 3 huruf, tanpa angka. Tidak ada batas maksimum.</div>
                            </div>

                            <div class="auth-input-group">
                                <label>
                                    <span class="material-symbols-rounded" style="font-size: 16px; color: var(--accent);">mail</span>
                                    Alamat Email *
                                </label>
                                <input type="email" id="reg-email" class="auth-input-field" placeholder="nama@email.com"
                                       oninput="App.validateInput(this, { required: true, email: true })" required />
                                <span class="material-symbols-rounded auth-input-icon">alternate_email</span>
                                <div class="auth-field-hint">Gunakan format nama@domain.com yang aktif.</div>
                            </div>

                            <div class="auth-input-group">
                                <label>
                                    <span class="material-symbols-rounded" style="font-size: 16px; color: var(--accent);">phone</span>
                                    Nomor Telepon / WhatsApp *
                                </label>
                                <input type="tel" id="reg-phone" class="auth-input-field" placeholder="081234567890"
                                       oninput="RegisterPage.validatePhoneField()" required />
                                <span class="material-symbols-rounded auth-input-icon">call</span>
                                <div class="auth-field-hint">Nomor Indonesia aktif: Telkomsel / Indosat / XL / Smartfren / Tri / By.U.</div>
                                <div class="auth-field-hint auth-phone-provider" id="reg-phone-provider" style="color: var(--accent); font-weight: 600;"></div>
                            </div>

                            ${isAdmin ? `
                                <div class="auth-input-group">
                                    <label>
                                        <span class="material-symbols-rounded" style="font-size: 16px; color: var(--accent);">manage_accounts</span>
                                        Penugasan Peran (Role) *
                                    </label>
                                    <select id="reg-role" class="auth-input-field" style="padding-left: 2.85rem; appearance: auto;">
                                        <option value="Kasir">Petugas Kasir (POS & Meja)</option>
                                        <option value="Dapur">Staf Dapur / Barista</option>
                                        <option value="Waiter">Pramusaji / Waiter (Antar Meja & Counter)</option>
                                        <option value="Driver">Kurir Pengantaran (Driver)</option>
                                        <option value="Customer">Pelanggan</option>
                                    </select>
                                    <span class="material-symbols-rounded auth-input-icon">group</span>
                                </div>
                            ` : ''}

                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem;">
                                <div class="auth-input-group">
                                    <label>
                                        <span class="material-symbols-rounded" style="font-size: 16px; color: var(--accent);">lock</span>
                                        Kata Sandi *
                                    </label>
                                    <div class="auth-input-wrapper">
                                        <input type="password" id="reg-password" class="auth-input-field" style="padding-right: 2.75rem;" placeholder="Min. 8 karakter, ada besar/kecil & angka"
                                               oninput="RegisterPage.validatePasswordField()" required />
                                        <span class="material-symbols-rounded auth-input-icon">key</span>
                                        <button type="button" class="auth-toggle-pass" onclick="App.togglePasswordVisibility('reg-password', this)" title="Lihat Kata Sandi">
                                            <span class="material-symbols-rounded" style="font-size: 19px;">visibility</span>
                                        </button>
                                    </div>
                                    <div id="reg-password-meter" class="auth-pass-meter" aria-hidden="true">
                                        <div class="auth-pass-meter-bar" id="reg-password-meter-bar" style="width: 0%;"></div>
                                    </div>
                                    <div class="auth-field-hint" id="reg-password-hint">Kata sandi: min. 8 karakter, kombinasi huruf besar, huruf kecil & angka. Tanpa batas maksimum.</div>
                                </div>

                                <div class="auth-input-group">
                                    <label>
                                        <span class="material-symbols-rounded" style="font-size: 16px; color: var(--accent);">lock_reset</span>
                                        Ulangi Sandi *
                                    </label>
                                    <div class="auth-input-wrapper">
                                        <input type="password" id="reg-confirm-password" class="auth-input-field" style="padding-right: 2.75rem;" placeholder="Ketik ulang sandi"
                                               oninput="RegisterPage.validateConfirmField()" required />
                                        <span class="material-symbols-rounded auth-input-icon">check_circle</span>
                                        <button type="button" class="auth-toggle-pass" onclick="App.togglePasswordVisibility('reg-confirm-password', this)" title="Lihat Kata Sandi">
                                            <span class="material-symbols-rounded" style="font-size: 19px;">visibility</span>
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <button type="submit" id="btn-reg-submit" class="auth-submit-btn">
                                <span>${isAdmin ? 'Daftarkan Staf' : 'Daftar Sekarang'}</span>
                                <span class="material-symbols-rounded" style="font-size: 19px;">arrow_forward</span>
                            </button>
                        </form>

                        ${!isAdmin ? `
                            <div style="text-align: center; margin-top: 1.5rem; font-size: 0.88rem; color: var(--text-muted);">
                                Sudah memiliki akun? <a href="#/login" style="font-weight: 700; color: var(--accent);">Masuk di sini</a>
                            </div>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
    },

    // =========================== VALIDASI LIVE ===========================

    validateNameField() {
        return App.validateInput(document.getElementById('reg-name'), { required: true, fullName: true });
    },

    validateEmailField() {
        return App.validateInput(document.getElementById('reg-email'), { required: true, email: true });
    },

    validatePhoneField() {
        const phoneEl = document.getElementById('reg-phone');
        const providerEl = document.getElementById('reg-phone-provider');
        const ok = App.validateInput(phoneEl, { required: true, phoneId: true });
        if (providerEl) {
            const res = App.validateIndonesianPhone(phoneEl.value || '');
            providerEl.textContent = ok && res.valid ? `Provider terdeteksi: ${res.provider}` : '';
        }
        return ok;
    },

    validatePasswordField() {
        const passEl = document.getElementById('reg-password');
        const meterBar = document.getElementById('reg-password-meter-bar');
        const hintEl = document.getElementById('reg-password-hint');
        const strength = App.passwordStrength(passEl ? passEl.value : '');

        // Meter 0-100% dengan warna merah -> kuning -> hijau
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

    validateConfirmField() {
        return App.validateInput(document.getElementById('reg-confirm-password'), {
            required: true,
            matchWith: '#reg-password',
            matchMessage: 'Konfirmasi kata sandi tidak cocok.'
        });
    },

    async handleSubmit(e) {
        e.preventDefault();

        const isNameValid = this.validateNameField();
        const isEmailValid = this.validateEmailField();
        const isPhoneValid = this.validatePhoneField();
        const isPassValid = this.validatePasswordField();
        const isConfirmValid = this.validateConfirmField();

        if (!isNameValid || !isEmailValid || !isPhoneValid || !isPassValid || !isConfirmValid) {
            Toast.error('Mohon lengkapi dan periksa kembali data pendaftaran.');
            return;
        }

        const submitBtn = document.getElementById('btn-reg-submit');
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span>Memproses pendaftaran...</span>';

        const currentUser = Api.getCurrentUser();
        const isAdmin = currentUser && currentUser.role === 'Admin';
        const assignedRole = (isAdmin && roleEl) ? roleEl.value : 'Customer';

        try {
            const res = await Api.post('/auth/register', {
                FullName: nameEl.value.trim(),
                Email: emailEl.value.trim(),
                PhoneNumber: phoneEl.value.trim(),
                Password: passEl.value,
                ConfirmPassword: confirmEl.value,
                RoleName: assignedRole
            });

            if (res && (res.success || res.Success)) {
                Toast.success(isAdmin ? `Staf ${nameEl.value} (${assignedRole}) berhasil didaftarkan!` : 'Pendaftaran berhasil! Silakan masuk ke akun Anda.');
                if (isAdmin) {
                    Router.navigate('#/dashboard');
                } else {
                    Router.navigate('#/login');
                }
            } else {
                Toast.error(res.message || 'Gagal melakukan pendaftaran.');
            }
        } catch (err) {
            Toast.error(err.message || 'Terjadi kesalahan sistem saat mendaftar.');
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = `<span>${isAdmin ? 'Daftarkan Staf' : 'Daftar Sekarang'}</span><span class="material-symbols-rounded" style="font-size: 19px;">arrow_forward</span>`;
        }
    }
};
