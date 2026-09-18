// ==========================================================================
// ERROR PAGES COMPONENT (Luxury Editorial Error Handling: 401, 403, 404, 500)
// Sesuai Poin 11 PDF: Error Handling & API Fallback
// ==========================================================================

const ErrorPages = {
    render(statusCode = 404) {
        const root = document.getElementById('page-root');
        if (!root) return;

        let code = '404';
        let title = 'Halaman Tidak Ditemukan';
        let subtitle = 'Cangkir Kopi Ini Masih Kosong';
        let desc = 'Mohon maaf, halaman atau rute yang Anda tuju tidak ditemukan atau telah dipindahkan ke sudut lain.';
        let iconName = 'search_off';
        let primaryBtn = `
            <a href="#/products" class="btn btn-primary" style="padding: 0.8rem 1.5rem;">
                <span class="material-symbols-rounded">menu_book</span>
                <span>Jelajahi Menu Kopi</span>
            </a>
        `;
        let badgeColor = '#b87333';

        if (statusCode === 401) {
            code = '401';
            title = 'Akses Autentikasi Diperlukan';
            subtitle = 'Sesi Masuk Telah Berakhir';
            desc = 'Anda perlu masuk ke akun Ruang Rasa terlebih dahulu untuk membuka halaman atau fitur reservasi ini.';
            iconName = 'lock_person';
            badgeColor = '#d97706';
            primaryBtn = `
                <a href="#/login" class="btn btn-primary" style="padding: 0.8rem 1.5rem;">
                    <span class="material-symbols-rounded">login</span>
                    <span>Masuk ke Akun Anda</span>
                </a>
            `;
        } else if (statusCode === 403) {
            code = '403';
            title = 'Akses Ditolak (Forbidden)';
            subtitle = 'Area Khusus Otoritas Tertentu';
            desc = 'Peran akun Anda saat ini tidak memiliki izin hak akses untuk mengelola atau melihat data pada modul ini.';
            iconName = 'gpp_bad';
            badgeColor = '#dc2626';
            primaryBtn = `
                <a href="#/profile" class="btn btn-primary" style="padding: 0.8rem 1.5rem;">
                    <span class="material-symbols-rounded">account_circle</span>
                    <span>Buka Profil Saya</span>
                </a>
            `;
        } else if (statusCode === 404) {
            code = '404';
            title = 'Halaman Tidak Ditemukan';
            subtitle = 'Rute Belum Terdaftar';
            desc = 'Tautan yang Anda tuju mungkin salah ketik atau telah diperbarui dalam sistem katalog terbaru kami.';
            iconName = 'local_cafe';
            badgeColor = '#b87333';
            primaryBtn = `
                <a href="#/products" class="btn btn-primary" style="padding: 0.8rem 1.5rem;">
                    <span class="material-symbols-rounded">storefront</span>
                    <span>Lihat Katalog Produk</span>
                </a>
            `;
        } else if (statusCode === 500) {
            code = '500';
            title = 'Gangguan Server Internal';
            subtitle = 'Server Sedang Menyiapkan Ulang';
            desc = 'Terjadi kendala teknis pada layanan backend database. Data tetap aman dan sistem otomatis memuat data cadangan.';
            iconName = 'error_outline';
            badgeColor = '#ea580c';
            primaryBtn = `
                <button type="button" class="btn btn-primary" style="padding: 0.8rem 1.5rem;" onclick="window.location.reload()">
                    <span class="material-symbols-rounded">refresh</span>
                    <span>Muat Ulang Halaman</span>
                </button>
            `;
        }

        root.innerHTML = `
            <div class="auth-page-ambient" style="min-height: calc(100vh - 200px); padding: 3rem 1rem;">
                <div class="error-editorial-card">
                    
                    <!-- Top Status Badge -->
                    <div style="display: inline-flex; align-items: center; gap: 0.45rem; background: rgba(184, 115, 51, 0.12); border: 1px solid rgba(184, 115, 51, 0.25); color: ${badgeColor}; font-size: 0.78rem; font-weight: 700; padding: 0.35rem 0.85rem; border-radius: var(--radius-pill); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 1.5rem;">
                        <span class="material-symbols-rounded" style="font-size: 16px;">warning</span>
                        HTTP Status Code ${code}
                    </div>

                    <!-- Watermark Large Number & Icon -->
                    <div class="error-illustration-wrap">
                        <div class="error-watermark-number">${code}</div>
                        <div class="error-emblem-circle">
                            <span class="material-symbols-rounded" style="font-size: 54px; color: ${badgeColor};">${iconName}</span>
                        </div>
                    </div>

                    <!-- Titles & Descriptions -->
                    <h1 class="error-title">${title}</h1>
                    <div class="error-subtitle">${subtitle}</div>
                    <p class="error-desc">${desc}</p>

                    <!-- API Fallback Notice -->
                    <div class="error-fallback-badge">
                        <span class="material-symbols-rounded" style="font-size: 16px; color: #10b981;">offline_bolt</span>
                        <span>Sistem Fallback & Offline Cache Ruang Rasa aktif untuk melindungi pengalaman Anda.</span>
                    </div>

                    <!-- Actions -->
                    <div class="error-actions-group">
                        ${primaryBtn}
                        <a href="#/" class="btn btn-outline" style="padding: 0.8rem 1.5rem;">
                            <span class="material-symbols-rounded">home</span>
                            <span>Kembali ke Beranda</span>
                        </a>
                    </div>

                </div>
            </div>
        `;
    }
};

window.ErrorPages = ErrorPages;
