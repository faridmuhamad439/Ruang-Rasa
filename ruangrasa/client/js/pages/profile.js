// ==========================================================================
// CUSTOMER PROFILE & ORDER HISTORY COMPONENT (Ruang Rasa Coffee Shop)
// Fitur Lengkap:
// 1. Tab Profil & Keamanan (Ganti Nama, Email, No HP, Ubah Kata Sandi)
// 2. Tab Alamat Tersimpan (Dropdown 4-Tier + Peta Leaflet Two-Way Sync)
// 3. Tab Riwayat Transaksi & Pesanan (Dine-In, Take-Away, Delivery)
// 4. Tab Lacak Pesanan Kurir (Peta Real-Time OSRM Jalan Raya Bandung)
// ==========================================================================

const ProfilePage = {
    activeTab: 'profile', // 'profile', 'address', 'orders', 'tracking'
    userProfile: null,
    orders: [],
    isLoading: false,
    selectedOrderForReceipt: null,

    // Base Kedai Ruang Rasa Flagship
    cafeLocation: {
        lat: -6.917500,
        lng: 107.609800,
        name: 'Ruang Rasa Coffee Shop - Jl. Braga No. 45, Bandung'
    },

    // Peta Alamat Tersimpan
    addressMap: null,
    addressMarker: null,
    cafeAddressMarker: null,
    addressRouteLine: null,
    selectedLocation: { lat: -6.917500, lng: 107.609800 },

    // State Alamat Tersimpan (Disesuaikan per akun login)
    savedAddress: {
        regencyId: '',
        districtId: '',
        villageId: '',
        rt: '',
        rw: '',
        houseNo: '',
        streetAddress: '',
        notes: ''
    },
    hasSavedAddress: false,

    // =========================================================================
    // HIERARCHICAL ADMINISTRATIVE DATA WITH COORDINATES
    // =========================================================================
    administrativeData: [
        {
            regencyId: 'kota-bandung',
            regencyName: 'Kota Bandung',
            districts: [
                {
                    districtId: 'sumur-bandung',
                    districtName: 'Sumur Bandung (Area Braga & Pusat Kota)',
                    villages: [
                        { villageId: 'braga', villageName: 'Braga', lat: -6.9175, lng: 107.6098 },
                        { villageId: 'kebon-pisang', villageName: 'Kebon Pisang', lat: -6.9205, lng: 107.6160 },
                        { villageId: 'merdeka', villageName: 'Merdeka', lat: -6.9110, lng: 107.6130 },
                        { villageId: 'babakan-ciamis', villageName: 'Babakan Ciamis', lat: -6.9145, lng: 107.6045 }
                    ]
                },
                {
                    districtId: 'bandung-wetan',
                    districtName: 'Bandung Wetan (Riau & Dago Bawah)',
                    villages: [
                        { villageId: 'citarum', villageName: 'Citarum (Jl. Riau)', lat: -6.9040, lng: 107.6180 },
                        { villageId: 'tamansari', villageName: 'Tamansari (Baltos/ITB)', lat: -6.8990, lng: 107.6080 },
                        { villageId: 'cihapit', villageName: 'Cihapit', lat: -6.9080, lng: 107.6250 }
                    ]
                },
                {
                    districtId: 'coblong',
                    districtName: 'Coblong (Dago Atas / Dipatiukur)',
                    villages: [
                        { villageId: 'dago', villageName: 'Dago', lat: -6.8790, lng: 107.6180 },
                        { villageId: 'sekeloa', villageName: 'Sekeloa (Dipatiukur)', lat: -6.8910, lng: 107.6190 },
                        { villageId: 'lebak-siliwangi', villageName: 'Lebak Siliwangi', lat: -6.8870, lng: 107.6100 },
                        { villageId: 'sadang-serang', villageName: 'Sadang Serang', lat: -6.8920, lng: 107.6290 },
                        { villageId: 'lebakgede', villageName: 'Lebakgede', lat: -6.8930, lng: 107.6140 }
                    ]
                },
                {
                    districtId: 'sukajadi',
                    districtName: 'Sukajadi (PVJ / Pasteur / Setiabudi)',
                    villages: [
                        { villageId: 'pasteur', villageName: 'Pasteur', lat: -6.8980, lng: 107.5920 },
                        { villageId: 'cipedes', villageName: 'Cipedes (PVJ)', lat: -6.8870, lng: 107.5940 },
                        { villageId: 'sukagalih', villageName: 'Sukagalih', lat: -6.8920, lng: 107.5850 },
                        { villageId: 'sukawarna', villageName: 'Sukawarna', lat: -6.8860, lng: 107.5790 },
                        { villageId: 'sukarasa', villageName: 'Sukarasa (Setiabudi)', lat: -6.8710, lng: 107.5870 }
                    ]
                },
                {
                    districtId: 'lengkong',
                    districtName: 'Lengkong (Burangrang / Buahbatu)',
                    villages: [
                        { villageId: 'burangrang', villageName: 'Burangrang', lat: -6.9280, lng: 107.6170 },
                        { villageId: 'malabar', villageName: 'Malabar', lat: -6.9270, lng: 107.6220 },
                        { villageId: 'cikawao', villageName: 'Cikawao', lat: -6.9240, lng: 107.6150 },
                        { villageId: 'paledang', villageName: 'Paledang', lat: -6.9250, lng: 107.6110 },
                        { villageId: 'turangga', villageName: 'Turangga', lat: -6.9360, lng: 107.6320 },
                        { villageId: 'lingkar-selatan', villageName: 'Lingkar Selatan', lat: -6.9310, lng: 107.6200 }
                    ]
                },
                {
                    districtId: 'regol',
                    districtName: 'Regol (Alun-Alun / BKR)',
                    villages: [
                        { villageId: 'balonggede', villageName: 'Balonggede', lat: -6.9240, lng: 107.6060 },
                        { villageId: 'pungkur', villageName: 'Pungkur', lat: -6.9290, lng: 107.6050 },
                        { villageId: 'ciateul', villageName: 'Ciateul', lat: -6.9330, lng: 107.6060 },
                        { villageId: 'pasirluyu', villageName: 'Pasirluyu', lat: -6.9420, lng: 107.6180 },
                        { villageId: 'ancol', villageName: 'Ancol', lat: -6.9380, lng: 107.6120 }
                    ]
                },
                {
                    districtId: 'astana-anyar',
                    districtName: 'Astana Anyar (Otista / Cibadak)',
                    villages: [
                        { villageId: 'cibadak', villageName: 'Cibadak', lat: -6.9210, lng: 107.5980 },
                        { villageId: 'karasak', villageName: 'Karasak', lat: -6.9450, lng: 107.6010 },
                        { villageId: 'nyengseret', villageName: 'Nyengseret', lat: -6.9320, lng: 107.5980 },
                        { villageId: 'panjunan', villageName: 'Panjunan', lat: -6.9250, lng: 107.5990 }
                    ]
                },
                {
                    districtId: 'cicendo',
                    districtName: 'Cicendo (Stasiun Bandung / Pasirkaliki)',
                    villages: [
                        { villageId: 'pasirkaliki', villageName: 'Pasirkaliki', lat: -6.9080, lng: 107.5990 },
                        { villageId: 'pamoyanan', villageName: 'Pamoyanan', lat: -6.9040, lng: 107.5940 },
                        { villageId: 'arjuna', villageName: 'Arjuna', lat: -6.9110, lng: 107.5890 },
                        { villageId: 'pajajaran', villageName: 'Pajajaran', lat: -6.9050, lng: 107.5860 },
                        { villageId: 'sukamaju', villageName: 'Sukamaju', lat: -6.8960, lng: 107.5990 }
                    ]
                },
                {
                    districtId: 'cibeunying-kaler',
                    districtName: 'Cibeunying Kaler (Cikutra / Pahlawan)',
                    villages: [
                        { villageId: 'cihaurgeulis', villageName: 'Cihaurgeulis', lat: -6.8990, lng: 107.6280 },
                        { villageId: 'sukaluyu', villageName: 'Sukaluyu', lat: -6.8950, lng: 107.6310 },
                        { villageId: 'neglasari', villageName: 'Neglasari', lat: -6.8890, lng: 107.6380 },
                        { villageId: 'cigadung', villageName: 'Cigadung', lat: -6.8780, lng: 107.6320 }
                    ]
                },
                {
                    districtId: 'batununggal',
                    districtName: 'Batununggal (Gatot Subroto / TSM)',
                    villages: [
                        { villageId: 'kacapiring', villageName: 'Kacapiring', lat: -6.9180, lng: 107.6290 },
                        { villageId: 'gumuruh', villageName: 'Gumuruh', lat: -6.9350, lng: 107.6380 },
                        { villageId: 'kebon-gedang', villageName: 'Kebon Gedang', lat: -6.9240, lng: 107.6360 },
                        { villageId: 'maleer', villageName: 'Maleer', lat: -6.9280, lng: 107.6330 },
                        { villageId: 'samoja', villageName: 'Samoja', lat: -6.9210, lng: 107.6250 }
                    ]
                }
            ]
        },
        {
            regencyId: 'kota-cimahi',
            regencyName: 'Kota Cimahi',
            districts: [
                {
                    districtId: 'cimahi-tengah',
                    districtName: 'Cimahi Tengah',
                    villages: [
                        { villageId: 'baros', villageName: 'Baros', lat: -6.8850, lng: 107.5420 },
                        { villageId: 'cigugur-tengah', villageName: 'Cigugur Tengah', lat: -6.8760, lng: 107.5480 },
                        { villageId: 'karangmekar', villageName: 'Karangmekar', lat: -6.8720, lng: 107.5410 },
                        { villageId: 'setiamanah', villageName: 'Setiamanah', lat: -6.8810, lng: 107.5350 }
                    ]
                },
                {
                    districtId: 'cimahi-utara',
                    districtName: 'Cimahi Utara',
                    villages: [
                        { villageId: 'cibabat', villageName: 'Cibabat', lat: -6.8680, lng: 107.5530 },
                        { villageId: 'pasirkaliki-cimahi', villageName: 'Pasirkaliki', lat: -6.8610, lng: 107.5620 },
                        { villageId: 'cipageran', villageName: 'Cipageran', lat: -6.8520, lng: 107.5380 }
                    ]
                },
                {
                    districtId: 'cimahi-selatan',
                    districtName: 'Cimahi Selatan',
                    villages: [
                        { villageId: 'cibeber', villageName: 'Cibeber (Unjani)', lat: -6.8960, lng: 107.5280 },
                        { villageId: 'leuwigajah', villageName: 'Leuwigajah', lat: -6.9040, lng: 107.5360 },
                        { villageId: 'utama', villageName: 'Utama', lat: -6.9120, lng: 107.5450 }
                    ]
                }
            ]
        },
        {
            regencyId: 'kab-bandung-barat',
            regencyName: 'Kab. Bandung Barat (KBB)',
            districts: [
                {
                    districtId: 'lembang',
                    districtName: 'Lembang (Wisata / Dataran Tinggi)',
                    villages: [
                        { villageId: 'lembang-desa', villageName: 'Lembang', lat: -6.8180, lng: 107.6180 },
                        { villageId: 'kayuambon', villageName: 'Kayuambon', lat: -6.8220, lng: 107.6250 },
                        { villageId: 'jayagiri', villageName: 'Jayagiri', lat: -6.8050, lng: 107.6200 },
                        { villageId: 'gudangkahuripan', villageName: 'Gudangkahuripan', lat: -6.8350, lng: 107.6080 }
                    ]
                },
                {
                    districtId: 'parongpong',
                    districtName: 'Parongpong (Sariwangi / Cihanjuang)',
                    villages: [
                        { villageId: 'sariwangi', villageName: 'Sariwangi', lat: -6.8660, lng: 107.5750 },
                        { villageId: 'cihanjuang', villageName: 'Cihanjuang', lat: -6.8580, lng: 107.5660 },
                        { villageId: 'cihideung', villageName: 'Cihideung', lat: -6.8360, lng: 107.5920 }
                    ]
                }
            ]
        },
        {
            regencyId: 'kab-bandung',
            regencyName: 'Kab. Bandung',
            districts: [
                {
                    districtId: 'dayeuhkolot',
                    districtName: 'Dayeuhkolot (Telkom University)',
                    villages: [
                        { villageId: 'dayeuhkolot-desa', villageName: 'Dayeuhkolot', lat: -6.9850, lng: 107.6250 },
                        { villageId: 'citeureup', villageName: 'Citeureup', lat: -6.9740, lng: 107.6320 },
                        { villageId: 'sukapura', villageName: 'Sukapura (Tel-U)', lat: -6.9710, lng: 107.6380 }
                    ]
                },
                {
                    districtId: 'bojongsoang',
                    districtName: 'Bojongsoang (Buahbatu Bawah)',
                    villages: [
                        { villageId: 'bojongsoang-desa', villageName: 'Bojongsoang', lat: -6.9780, lng: 107.6450 },
                        { villageId: 'lengkong-bojong', villageName: 'Lengkong', lat: -6.9620, lng: 107.6390 }
                    ]
                }
            ]
        }
    ],

    async init() {
        // Parse query params dari hash misal #/profile?tab=tracking&order=RR-2026-0005
        const hash = window.location.hash || '';
        let tabFromHash = null;
        if (hash.includes('?')) {
            const queryPart = hash.split('?')[1];
            const params = new URLSearchParams(queryPart);
            const tabParam = params.get('tab');
            const orderParam = params.get('order');

            if (tabParam && ['profile', 'address', 'orders', 'tracking'].includes(tabParam)) {
                tabFromHash = tabParam;
            }
            if (orderParam) {
                this.selectedTrackingOrderNumber = decodeURIComponent(orderParam);
            }
        }

        if (tabFromHash) {
            this.activeTab = tabFromHash;
        } else {
            try {
                const savedTab = localStorage.getItem('rr_profile_tab');
                if (savedTab && ['profile', 'address', 'orders', 'tracking'].includes(savedTab)) {
                    this.activeTab = savedTab;
                }
            } catch {}
        }

        this.loadSavedAddressLocal();

        const user = Api.getCurrentUser();
        if (user && !this.userProfile) {
            this.userProfile = {
                UserId: user.userId || user.UserId || 1,
                FullName: user.fullName || 'Pelanggan Ruang Rasa',
                Email: user.email || 'customer@ruangrasa.com',
                PhoneNumber: user.phoneNumber || '081234567890',
                RoleName: user.role || 'Customer',
                CreatedAt: new Date().toISOString()
            };
        }

        // Fetch data profil & histori terbaru dari server
        try {
            await Promise.all([this.loadProfileData(), this.loadOrderHistory()]);
        } catch (err) {
            console.warn('ProfilePage data load warn:', err);
        }

        if (this.selectedTrackingOrderNumber && window.TrackingPage) {
            window.TrackingPage.activeOrderId = this.selectedTrackingOrderNumber;
        }

        // Render tampilan utama setelah data lengkap
        this.render();

        if (this.activeTab === 'address') {
            setTimeout(() => this.initAddressMap(), 100);
        } else if (this.activeTab === 'tracking') {
            setTimeout(() => this.initEmbeddedTracking(), 100);
        }
    },

    loadSavedAddressLocal() {
        const user = Api.getCurrentUser();
        const userKey = user ? (user.userId || user.UserId || user.email) : 'guest';
        try {
            const raw = localStorage.getItem(`ruangrasa_address_${userKey}`);
            if (raw) {
                const parsed = JSON.parse(raw);
                this.savedAddress = {
                    regencyId: parsed.regencyId || '',
                    districtId: parsed.districtId || '',
                    villageId: parsed.villageId || '',
                    rt: parsed.rt || '',
                    rw: parsed.rw || '',
                    houseNo: parsed.houseNo || '',
                    streetAddress: parsed.streetAddress || '',
                    notes: parsed.notes || ''
                };
                if (parsed.lat && parsed.lng) {
                    this.selectedLocation = { lat: parsed.lat, lng: parsed.lng };
                }
                this.hasSavedAddress = !!(this.savedAddress.streetAddress || this.savedAddress.villageId);
            } else {
                this.savedAddress = {
                    regencyId: '',
                    districtId: '',
                    villageId: '',
                    rt: '',
                    rw: '',
                    houseNo: '',
                    streetAddress: '',
                    notes: ''
                };
                this.selectedLocation = { lat: this.cafeLocation.lat, lng: this.cafeLocation.lng };
                this.hasSavedAddress = false;
            }
        } catch {
            this.hasSavedAddress = false;
        }
    },

    saveSavedAddressLocal() {
        const user = Api.getCurrentUser();
        const userKey = user ? (user.userId || user.UserId || user.email) : 'guest';
        try {
            const dataToSave = {
                ...this.savedAddress,
                lat: this.selectedLocation.lat,
                lng: this.selectedLocation.lng
            };
            localStorage.setItem(`ruangrasa_address_${userKey}`, JSON.stringify(dataToSave));
            this.hasSavedAddress = true;
        } catch {}
    },

    async loadProfileData() {
        const user = Api.getCurrentUser();
        if (!user) return;
        const userId = user.userId || user.UserId || 1;

        try {
            this.isLoading = true;
            const res = await Api.get(`/users/profile/${userId}`);
            if (res && res.Data) {
                this.userProfile = res.Data;
            } else {
                this.userProfile = {
                    UserId: userId,
                    FullName: user.fullName || 'Customer Ruang Rasa',
                    Email: user.email || 'customer@ruangrasa.com',
                    PhoneNumber: user.phoneNumber || '081234567890',
                    RoleName: user.role || 'Customer',
                    CreatedAt: new Date().toISOString()
                };
            }
        } catch {
            this.userProfile = {
                UserId: userId,
                FullName: user.fullName || 'Customer Ruang Rasa',
                Email: user.email || 'customer@ruangrasa.com',
                PhoneNumber: user.phoneNumber || '081234567890',
                RoleName: user.role || 'Customer',
                CreatedAt: new Date().toISOString()
            };
        } finally {
            this.isLoading = false;
        }
    },

    async loadOrderHistory() {
        const user = Api.getCurrentUser();
        if (!user) return;
        const userId = user.userId || user.UserId || 1;

        try {
            const res = await Api.get(`/orders/customer/${userId}`);
            if (res && res.Data && Array.isArray(res.Data)) {
                this.orders = res.Data;
            } else {
                this.orders = [];
            }
        } catch {
            this.orders = [];
        }
    },

    switchTab(tabName) {
        this.activeTab = tabName;
        try {
            localStorage.setItem('rr_profile_tab', tabName);
            if (tabName === 'tracking' && this.selectedTrackingOrderNumber) {
                history.replaceState(null, '', `#/profile?tab=${tabName}&order=${encodeURIComponent(this.selectedTrackingOrderNumber)}`);
            } else {
                history.replaceState(null, '', `#/profile?tab=${tabName}`);
            }
        } catch {}
        this.render();
        if (tabName === 'address') {
            setTimeout(() => this.initAddressMap(), 100);
        } else if (tabName === 'tracking') {
            setTimeout(() => this.initEmbeddedTracking(), 100);
        }
    },

    // =========================================================================
    // 1. UPDATE PROFIL BIODATA & AVATAR UPLOAD (Poin 8 PDF)
    // =========================================================================
    async handleAvatarUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            Toast.error('Harap pilih berkas gambar avatar (JPG, PNG, atau WEBP).');
            return;
        }

        const previewEl = document.getElementById('profile-avatar-img');
        const urlInput = document.getElementById('profile-avatar-url');

        const localUrl = URL.createObjectURL(file);
        if (previewEl) previewEl.src = localUrl;

        try {
            Toast.info('Mengunggah avatar profil...');
            const res = await Api.upload(file);
            if (res && res.success && res.data) {
                if (urlInput) urlInput.value = res.data.fileUrl;
                if (previewEl) previewEl.src = res.data.fileUrl;
                if (this.userProfile) this.userProfile.AvatarUrl = res.data.fileUrl;
                Toast.success('Foto profil berhasil diunggah!');
            }
        } catch (err) {
            console.warn('Avatar upload fallback:', err);
            Toast.info('Foto avatar tersimpan secara lokal.');
        }
    },

    async saveProfile() {
        const nameEl = document.getElementById('profile-fullname');
        const phoneEl = document.getElementById('profile-phone');
        const emailEl = document.getElementById('profile-email');
        const avatarEl = document.getElementById('profile-avatar-url');

        const fullName = (nameEl ? nameEl.value : '').trim();
        const phone = (phoneEl ? phoneEl.value : '').trim();
        const email = (emailEl ? emailEl.value : '').trim();
        const avatarUrl = (avatarEl ? avatarEl.value : '').trim();

        if (!fullName) {
            Toast.error('Nama lengkap wajib diisi.');
            return;
        }

        if (!email) {
            Toast.error('Alamat email wajib diisi.');
            return;
        }

        const user = Api.getCurrentUser();
        const userId = user ? (user.userId || user.UserId || 1) : 1;

        try {
            Toast.info('Menyimpan perubahan profil...');
            const res = await Api.put(`/users/profile/${userId}`, {
                FullName: fullName,
                PhoneNumber: phone,
                Email: email,
                AvatarUrl: avatarUrl
            });

            if (res && (res.Success || res.Data)) {
                if (user) {
                    user.fullName = fullName;
                    user.phoneNumber = phone;
                    user.email = email;
                    localStorage.setItem('ruangrasa_user', JSON.stringify(user));
                }
                Toast.success('Profil berhasil diperbarui!');
                if (Navbar) Navbar.render();
                await this.loadProfileData();
                this.render();
            } else {
                Toast.error(res?.Message || 'Gagal menyimpan profil.');
            }
        } catch (err) {
            Toast.error('Terjadi kesalahan saat menyimpan profil: ' + err.message);
        }
    },

    // =========================================================================
    // 2. UBAH KATA SANDI (PASSWORD)
    // =========================================================================
    async changePassword() {
        const oldPassEl = document.getElementById('password-old');
        const newPassEl = document.getElementById('password-new');
        const confirmPassEl = document.getElementById('password-confirm');

        const oldPassword = (oldPassEl ? oldPassEl.value : '').trim();
        const newPassword = (newPassEl ? newPassEl.value : '').trim();
        const confirmPassword = (confirmPassEl ? confirmPassEl.value : '').trim();

        if (!oldPassword) {
            Toast.error('Masukkan kata sandi lama Anda.');
            return;
        }

        if (!newPassword || newPassword.length < 6) {
            Toast.error('Kata sandi baru minimal harus 6 karakter.');
            return;
        }

        if (newPassword !== confirmPassword) {
            Toast.error('Konfirmasi kata sandi baru tidak sesuai.');
            return;
        }

        const user = Api.getCurrentUser();
        const userId = user ? (user.userId || user.UserId || 1) : 1;

        try {
            Toast.info('Memperbarui kata sandi...');
            const res = await Api.put(`/users/change-password/${userId}`, {
                OldPassword: oldPassword,
                NewPassword: newPassword,
                ConfirmPassword: confirmPassword
            });

            if (res && res.Success) {
                Toast.success('Kata sandi berhasil diubah! Silakan gunakan kata sandi baru saat login.');
                if (oldPassEl) oldPassEl.value = '';
                if (newPassEl) newPassEl.value = '';
                if (confirmPassEl) confirmPassEl.value = '';
            } else {
                Toast.error(res?.Message || 'Gagal mengubah kata sandi. Pastikan kata sandi lama benar.');
            }
        } catch (err) {
            Toast.error('Gagal mengubah kata sandi: ' + err.message);
        }
    },

    // =========================================================================
    // 3. PETA ALAMAT TERSIMPAN (TWO-WAY SYNCHRONIZATION WITH DROPDOWNS)
    // =========================================================================
    initAddressMap() {
        const mapContainer = document.getElementById('saved-address-map');
        if (!mapContainer) return;

        // Jika Leaflet belum siap dimuat di browser saat refresh, tunggu sebentar lalu coba lagi
        if (typeof L === 'undefined') {
            setTimeout(() => this.initAddressMap(), 150);
            return;
        }

        if (this.addressMap) {
            try {
                this.addressMap.remove();
            } catch (e) {
                console.warn('Address map remove warn:', e);
            }
            this.addressMap = null;
            this.addressMarker = null;
            this.cafeAddressMarker = null;
            this.addressRouteLine = null;
        }

        // Bersihkan _leaflet_id agar Leaflet tidak error 'Map container is already initialized' saat refresh
        if (mapContainer._leaflet_id) {
            mapContainer._leaflet_id = null;
        }

        try {
            const currentVill = this.getCurrentVillage();
            const initialLat = this.selectedLocation.lat || currentVill.lat || this.cafeLocation.lat;
            const initialLng = this.selectedLocation.lng || currentVill.lng || this.cafeLocation.lng;

            this.addressMap = L.map('saved-address-map', {
                zoomControl: true,
                scrollWheelZoom: true
            }).setView([initialLat, initialLng], 15);

            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                maxZoom: 19,
                attribution: '© OpenStreetMap contributors | Ruang Rasa Braga'
            }).addTo(this.addressMap);

            // Marker Kedai Braga
            const cafeIcon = L.divIcon({
                className: 'custom-map-pin cafe-pin',
                html: `
                    <div style="background: #2c2420; color: #fff; width: 38px; height: 38px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(0,0,0,0.3); border: 2px solid #b87d4b;">
                        <span class="material-symbols-rounded" style="font-size: 20px; color: #e8c39e;">local_cafe</span>
                    </div>
                `,
                iconSize: [38, 38],
                iconAnchor: [19, 19]
            });

            this.cafeAddressMarker = L.marker([this.cafeLocation.lat, this.cafeLocation.lng], { icon: cafeIcon }).addTo(this.addressMap)
                .bindPopup("<b><span class='material-symbols-rounded' style='font-size:14px; vertical-align:middle;'>local_cafe</span> Ruang Rasa Braga</b><br>Jl. Braga No. 45, Bandung<br><small>Kedai Kopi Asal Pengiriman</small>");

            // Marker Customer Alamat Tersimpan
            const customerIcon = L.divIcon({
                className: 'custom-map-pin customer-pin',
                html: `
                    <div style="background: #d32f2f; color: #fff; width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 6px 16px rgba(211,47,47,0.45); border: 3px solid #ffffff; animation: pulsePin 2s infinite;">
                        <span class="material-symbols-rounded" style="font-size: 24px;">pin_drop</span>
                    </div>
                `,
                iconSize: [40, 40],
                iconAnchor: [20, 20]
            });

            this.addressMarker = L.marker([initialLat, initialLng], {
                icon: customerIcon,
                draggable: true
            }).addTo(this.addressMap);

            // Event drag marker
            this.addressMarker.on('dragend', (e) => {
                const coord = e.target.getLatLng();
                this.handleMapLocationChange(coord.lat, coord.lng);
            });

            // Event klik peta
            this.addressMap.on('click', (e) => {
                const coord = e.latlng;
                this.addressMarker.setLatLng(coord);
                this.handleMapLocationChange(coord.lat, coord.lng);
            });

            this.syncMapToCurrentVillage();

            // InvalidateSize berkala saat DOM siap & resize window agar peta tidak hilang / abu-abu saat di-refresh
            [50, 150, 300, 600, 1200].forEach(delay => {
                setTimeout(() => {
                    if (this.addressMap) this.addressMap.invalidateSize();
                }, delay);
            });
        } catch (err) {
            console.error('ProfilePage initAddressMap error:', err);
        }
    },

    handleMapLocationChange(lat, lng) {
        this.selectedLocation = { lat, lng };

        // Cari desa/kelurahan & kecamatan terdekat dari koordinat
        let nearestVillage = null;
        let nearestDistrict = null;
        let nearestRegency = null;
        let minDistance = Infinity;

        for (const reg of this.administrativeData) {
            for (const dist of reg.districts) {
                for (const vill of dist.villages) {
                    const d = this.calculateDistance(lat, lng, vill.lat, vill.lng);
                    if (d < minDistance) {
                        minDistance = d;
                        nearestVillage = vill;
                        nearestDistrict = dist;
                        nearestRegency = reg;
                    }
                }
            }
        }

        if (nearestVillage && nearestDistrict && nearestRegency) {
            this.savedAddress.regencyId = nearestRegency.regencyId;
            this.savedAddress.districtId = nearestDistrict.districtId;
            this.savedAddress.villageId = nearestVillage.villageId;

            // Update dropdown Kota
            const regEl = document.getElementById('saved-regency');
            if (regEl) regEl.value = nearestRegency.regencyId;

            // Update dropdown Kecamatan
            const distEl = document.getElementById('saved-district');
            if (distEl) {
                distEl.innerHTML = nearestRegency.districts.map(d => `
                    <option value="${d.districtId}" ${d.districtId === nearestDistrict.districtId ? 'selected' : ''}>
                        ${d.districtName}
                    </option>
                `).join('');
            }

            // Update dropdown Kelurahan
            const villEl = document.getElementById('saved-village');
            if (villEl) {
                villEl.innerHTML = nearestDistrict.villages.map(v => `
                    <option value="${v.villageId}" ${v.villageId === nearestVillage.villageId ? 'selected' : ''}>
                        Kel. ${v.villageName}
                    </option>
                `).join('');
            }

            if (this.addressMarker) {
                this.addressMarker.bindPopup(`
                    <div style="font-size: 0.84rem;">
                        <strong><span class="material-symbols-rounded" style="font-size:14px; vertical-align:middle;">location_on</span> ${nearestVillage.villageName}, ${nearestDistrict.districtName}</strong><br>
                        <span style="color: #666;">${nearestRegency.regencyName}</span><br>
                        <small style="color: var(--primary);">Jarak dari Braga: ~${this.calculateDistance(this.cafeLocation.lat, this.cafeLocation.lng, lat, lng).toFixed(1)} km</small>
                    </div>
                `).openPopup();
            }

            this.updateMapRouteLine();
        }
    },

    syncMapToCurrentVillage() {
        const vill = this.getCurrentVillage();
        const dist = this.getCurrentDistrict();
        const reg = this.getCurrentRegency();

        if (vill && vill.lat && vill.lng) {
            this.selectedLocation = { lat: vill.lat, lng: vill.lng };

            if (this.addressMarker) {
                this.addressMarker.setLatLng([vill.lat, vill.lng]);
                this.addressMarker.bindPopup(`
                    <div style="font-size: 0.84rem;">
                        <strong><span class="material-symbols-rounded" style="font-size:14px; vertical-align:middle;">location_on</span> ${vill.villageName}, ${dist.districtName}</strong><br>
                        <span style="color: #666;">${reg.regencyName}</span><br>
                        <small style="color: var(--primary);">Jarak dari Braga: ~${this.calculateDistance(this.cafeLocation.lat, this.cafeLocation.lng, vill.lat, vill.lng).toFixed(1)} km</small>
                    </div>
                `).openPopup();
            }

            if (this.addressMap) {
                this.addressMap.flyTo([vill.lat, vill.lng], 15, { duration: 0.8 });
            }

            this.updateMapRouteLine();
        }
    },

    updateMapRouteLine() {
        if (!this.addressMap) return;
        if (this.addressRouteLine) {
            this.addressMap.removeLayer(this.addressRouteLine);
        }

        const points = [
            [this.cafeLocation.lat, this.cafeLocation.lng],
            [this.selectedLocation.lat, this.selectedLocation.lng]
        ];

        this.addressRouteLine = L.polyline(points, {
            color: '#b87d4b',
            weight: 4,
            opacity: 0.85,
            dashArray: '8, 8'
        }).addTo(this.addressMap);
    },

    calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371;
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = 
            Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
            Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
    },

    // Handlers Dropdown Alamat Tersimpan
    onRegencyChange(regId) {
        this.savedAddress.regencyId = regId;
        const reg = this.getCurrentRegency();
        if (reg && reg.districts.length > 0) {
            this.savedAddress.districtId = reg.districts[0].districtId;
            if (reg.districts[0].villages.length > 0) {
                this.savedAddress.villageId = reg.districts[0].villages[0].villageId;
            }
        }
        this.renderAddressDropdowns();
        this.syncMapToCurrentVillage();
    },

    onDistrictChange(distId) {
        this.savedAddress.districtId = distId;
        const dist = this.getCurrentDistrict();
        if (dist && dist.villages.length > 0) {
            this.savedAddress.villageId = dist.villages[0].villageId;
        }
        this.renderAddressDropdowns();
        this.syncMapToCurrentVillage();
    },

    onVillageChange(villId) {
        this.savedAddress.villageId = villId;
        this.syncMapToCurrentVillage();
    },

    renderAddressDropdowns() {
        const currentReg = this.getCurrentRegency();
        const currentDist = this.getCurrentDistrict();

        const distEl = document.getElementById('saved-district');
        if (distEl) {
            distEl.innerHTML = currentReg.districts.map(d => `
                <option value="${d.districtId}" ${d.districtId === this.savedAddress.districtId ? 'selected' : ''}>
                    ${d.districtName}
                </option>
            `).join('');
        }

        const villEl = document.getElementById('saved-village');
        if (villEl) {
            villEl.innerHTML = currentDist.villages.map(v => `
                <option value="${v.villageId}" ${v.villageId === this.savedAddress.villageId ? 'selected' : ''}>
                    Kel. ${v.villageName}
                </option>
            `).join('');
        }
    },

    getCurrentRegency() {
        return this.administrativeData.find(r => r.regencyId === this.savedAddress.regencyId) || this.administrativeData[0];
    },

    getCurrentDistrict() {
        const reg = this.getCurrentRegency();
        return reg.districts.find(d => d.districtId === this.savedAddress.districtId) || reg.districts[0];
    },

    getCurrentVillage() {
        const dist = this.getCurrentDistrict();
        return dist.villages.find(v => v.villageId === this.savedAddress.villageId) || dist.villages[0];
    },

    saveAddressForm() {
        const regEl = document.getElementById('saved-regency');
        const distEl = document.getElementById('saved-district');
        const villEl = document.getElementById('saved-village');
        const rtEl = document.getElementById('saved-rt');
        const rwEl = document.getElementById('saved-rw');
        const houseEl = document.getElementById('saved-houseno');
        const streetEl = document.getElementById('saved-street');
        const noteEl = document.getElementById('saved-note');

        if (regEl) this.savedAddress.regencyId = regEl.value;
        if (distEl) this.savedAddress.districtId = distEl.value;
        if (villEl) this.savedAddress.villageId = villEl.value;
        if (rtEl) this.savedAddress.rt = rtEl.value;
        if (rwEl) this.savedAddress.rw = rwEl.value;
        if (houseEl) this.savedAddress.houseNo = houseEl.value.trim();
        if (streetEl) this.savedAddress.streetAddress = streetEl.value.trim();
        if (noteEl) this.savedAddress.notes = noteEl.value.trim();

        if (!this.savedAddress.streetAddress) {
            Toast.warning('Nama jalan / alamat pengiriman wajib diisi.');
            return;
        }

        this.saveSavedAddressLocal();

        const user = Api.getCurrentUser();
        const userId = user ? (user.userId || user.UserId || 1) : 1;
        const currentReg = this.getCurrentRegency();
        const currentDist = this.getCurrentDistrict();
        const currentVill = this.getCurrentVillage();
        const fullAddr = `${this.savedAddress.streetAddress}${this.savedAddress.houseNo ? ', ' + this.savedAddress.houseNo : ''}, RT ${this.savedAddress.rt} / RW ${this.savedAddress.rw}, Kel. ${currentVill.villageName}, Kec. ${currentDist.districtName}, ${currentReg.regencyName} [GPS: ${this.selectedLocation.lat.toFixed(6)}, ${this.selectedLocation.lng.toFixed(6)}]`;

        Api.put(`/users/profile/${userId}`, {
            FullName: user?.fullName || '',
            DefaultAddress: fullAddr
        }).catch(() => {});

        Toast.success('Alamat utama & koordinat peta berhasil disimpan! Alamat ini akan otomatis digunakan saat checkout.');
        this.render();
        setTimeout(() => this.initAddressMap(), 200);
    },

    // =========================================================================
    // =========================================================================
    // 4. EMBEDDED LIVE TRACKING KURIR (PETA BANDUNG OSRM)
    // =========================================================================
    initEmbeddedTracking() {
        if (window.TrackingPage) {
            const deliveryOrders = (this.orders || []).filter(o => o.OrderType === 'Delivery' && !['Delivered', 'Cancelled'].includes(o.OrderStatus));
            const activeOrder = (this.orders || []).find(o => o.OrderNumber === this.selectedTrackingOrderNumber) || deliveryOrders[0] || (this.orders || []).find(o => o.OrderType === 'Delivery') || null;

            if (!activeOrder) {
                // Tidak ada pesanan delivery aktif untuk akun ini
                return;
            }

            this.selectedTrackingOrderNumber = activeOrder.OrderNumber;
            window.TrackingPage.activeOrderId = activeOrder.OrderNumber;

            // Cek apakah di alamat pengantaran terdapat koordinat GPS eksplisit
            if (activeOrder.DeliveryAddress) {
                const gpsMatch = activeOrder.DeliveryAddress.match(/\[Koordinat GPS:\s*([-\d.]+),\s*([-\d.]+)\]/);
                if (gpsMatch) {
                    const lat = parseFloat(gpsMatch[1]);
                    const lng = parseFloat(gpsMatch[2]);
                    if (!isNaN(lat) && !isNaN(lng)) {
                        window.TrackingPage.customerLocation = { lat, lng };
                    }
                }
            }

            // Sync koordinat alamat customer dari profil jika belum diatur
            if (!window.TrackingPage.customerLocation || !window.TrackingPage.customerLocation.lat) {
                if (this.selectedLocation && this.selectedLocation.lat && this.selectedLocation.lng) {
                    window.TrackingPage.customerLocation = {
                        lat: this.selectedLocation.lat,
                        lng: this.selectedLocation.lng
                    };
                }
            }

            window.TrackingPage.stopSimulation();
            window.TrackingPage.stopDriverGps();

            // Jalankan inisialisasi peta dan paksa resize berkala agar tidak abu-abu
            setTimeout(async () => {
                await window.TrackingPage.initMap();
                [50, 150, 300, 600, 1200, 2000].forEach(delay => {
                    setTimeout(() => {
                        if (window.TrackingPage && window.TrackingPage.map) {
                            window.TrackingPage.map.invalidateSize();
                            window.TrackingPage.fitMapToBounds();
                        }
                    }, delay);
                });
            }, 100);

            window.TrackingPage.startLivePolling();
        }
    },

    trackSpecificOrder(orderNumber) {
        this.selectedTrackingOrderNumber = orderNumber;
        if (window.TrackingPage) {
            window.TrackingPage.activeOrderId = orderNumber;
        }
        this.switchTab('tracking');
    },

    openReceiptModal(order) {
        this.selectedOrderForReceipt = order;
        this.renderReceiptModal();
    },

    closeReceiptModal() {
        this.selectedOrderForReceipt = null;
        const modal = document.getElementById('customer-receipt-modal');
        if (modal) modal.remove();
    },

    renderReceiptModal() {
        const order = this.selectedOrderForReceipt;
        if (!order) return;

        let modal = document.getElementById('customer-receipt-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'customer-receipt-modal';
            document.body.appendChild(modal);
        }

        const statusLower = (order.OrderStatus || 'Completed').toLowerCase();
        let statusClass = 'completed';
        if (statusLower.includes('pending') || statusLower.includes('menunggu')) statusClass = 'pending';
        else if (statusLower.includes('diproses') || statusLower.includes('process') || statusLower.includes('cooking')) statusClass = 'processing';

        modal.innerHTML = `
            <div class="modal-backdrop active" onclick="ProfilePage.closeReceiptModal()" style="display:flex; align-items:center; justify-content:center; padding:1.5rem;">
                <div class="receipt-paper-card" onclick="event.stopPropagation()">
                    
                    <!-- Header Stempel & Branding Artisan -->
                    <div class="receipt-stamp-header">
                        <div class="receipt-emblem">
                            <span class="material-symbols-rounded" style="font-size: 26px;">local_cafe</span>
                        </div>
                        <div class="receipt-shop-name">Ruang Rasa Coffee Shop</div>
                        <div class="receipt-shop-sub">
                            Artisan Roastery & Dining Space<br>
                            Jl. Braga No. 45, Sumur Bandung, Kota Bandung<br>
                            <strong>Struk Digital Resmi Transaksi #${order.OrderNumber}</strong>
                        </div>
                    </div>

                    <!-- Metadata Transaksi -->
                    <div class="receipt-meta-grid">
                        <div class="receipt-meta-item">
                            <span class="receipt-meta-label">Waktu Transaksi</span>
                            <span class="receipt-meta-value">${new Date(order.CreatedAt).toLocaleString('id-ID')}</span>
                        </div>
                        <div class="receipt-meta-item">
                            <span class="receipt-meta-label">Layanan / Meja</span>
                            <span class="receipt-meta-value">${order.OrderType} ${order.TableNumber && order.TableNumber !== '-' ? `(Meja ${order.TableNumber})` : ''}</span>
                        </div>
                        <div class="receipt-meta-item">
                            <span class="receipt-meta-label">Metode Pembayaran</span>
                            <span class="receipt-meta-value">${order.PaymentMethod || 'QRIS'}</span>
                        </div>
                        <div class="receipt-meta-item">
                            <span class="receipt-meta-label">Status Pembayaran</span>
                            <span class="receipt-status-badge ${statusClass}">
                                <span style="display:inline-block; width:6px; height:6px; border-radius:50%; background:currentColor;"></span>
                                ${order.OrderStatus}
                            </span>
                        </div>
                    </div>

                    <!-- Rincian Item Menu Pesanan -->
                    <div class="receipt-items-wrap">
                        <div class="receipt-items-title">Rincian Pesanan Menu</div>
                        ${order.Items && order.Items.length > 0 ? order.Items.map(it => `
                            <div class="receipt-item-row">
                                <div style="flex: 1; padding-right: 0.5rem;">
                                    <span class="receipt-item-name">${it.MenuName}</span>
                                    <span class="receipt-item-qty">x${it.Quantity}</span>
                                    ${it.Notes ? `<div class="receipt-item-notes">Catatan: "${it.Notes}"</div>` : ''}
                                </div>
                                <div class="receipt-item-price">${App.formatRupiah(it.Subtotal || (it.UnitPrice * it.Quantity))}</div>
                            </div>
                        `).join('') : '<div style="color: #8c786b; font-size: 0.82rem; font-style: italic;">Item pesanan tidak ditemukan.</div>'}
                    </div>

                    <!-- Total Perhitungan & Diskon -->
                    <div class="receipt-totals-wrap">
                        <div class="receipt-total-line">
                            <span>Subtotal Menu:</span>
                            <span style="font-variant-numeric: tabular-nums; font-weight: 600;">${App.formatRupiah((order.TotalAmount || 0) + (order.DiscountAmount || 0))}</span>
                        </div>
                        ${order.DiscountAmount > 0 ? `
                            <div class="receipt-total-line" style="color: #065f46; font-weight: 700;">
                                <span>Diskon Voucher Promo:</span>
                                <span>- ${App.formatRupiah(order.DiscountAmount)}</span>
                            </div>
                        ` : ''}
                        <div class="receipt-grand-total">
                            <span class="label">Total Pembayaran</span>
                            <span class="value">${App.formatRupiah(order.TotalAmount)}</span>
                        </div>
                    </div>

                    <!-- Alamat Pengantaran (Jika Delivery) -->
                    ${order.DeliveryAddress ? `
                        <div class="receipt-address-box">
                            <div style="font-weight: 700; color: #2b1810; margin-bottom: 0.2rem; display: flex; align-items: center; gap: 0.3rem;">
                                <span class="material-symbols-rounded" style="font-size: 15px; color: var(--accent);">pin_drop</span>
                                Alamat Pengantaran Kurir:
                            </div>
                            <div style="color: #5c473a;">${order.DeliveryAddress}</div>
                        </div>
                    ` : ''}

                    <!-- Simulasi Barcode Digital Otentik -->
                    <div class="receipt-barcode-wrap">
                        <svg class="receipt-barcode-svg" viewBox="0 0 200 40" preserveAspectRatio="none">
                            <line x1="10" y1="0" x2="10" y2="40" stroke="#2b1810" stroke-width="2"/>
                            <line x1="15" y1="0" x2="15" y2="40" stroke="#2b1810" stroke-width="4"/>
                            <line x1="23" y1="0" x2="23" y2="40" stroke="#2b1810" stroke-width="1"/>
                            <line x1="28" y1="0" x2="28" y2="40" stroke="#2b1810" stroke-width="3"/>
                            <line x1="36" y1="0" x2="36" y2="40" stroke="#2b1810" stroke-width="5"/>
                            <line x1="45" y1="0" x2="45" y2="40" stroke="#2b1810" stroke-width="2"/>
                            <line x1="52" y1="0" x2="52" y2="40" stroke="#2b1810" stroke-width="1"/>
                            <line x1="58" y1="0" x2="58" y2="40" stroke="#2b1810" stroke-width="4"/>
                            <line x1="68" y1="0" x2="68" y2="40" stroke="#2b1810" stroke-width="2"/>
                            <line x1="75" y1="0" x2="75" y2="40" stroke="#2b1810" stroke-width="6"/>
                            <line x1="86" y1="0" x2="86" y2="40" stroke="#2b1810" stroke-width="2"/>
                            <line x1="93" y1="0" x2="93" y2="40" stroke="#2b1810" stroke-width="3"/>
                            <line x1="102" y1="0" x2="102" y2="40" stroke="#2b1810" stroke-width="1"/>
                            <line x1="108" y1="0" x2="108" y2="40" stroke="#2b1810" stroke-width="5"/>
                            <line x1="118" y1="0" x2="118" y2="40" stroke="#2b1810" stroke-width="2"/>
                            <line x1="125" y1="0" x2="125" y2="40" stroke="#2b1810" stroke-width="4"/>
                            <line x1="134" y1="0" x2="134" y2="40" stroke="#2b1810" stroke-width="1"/>
                            <line x1="140" y1="0" x2="140" y2="40" stroke="#2b1810" stroke-width="3"/>
                            <line x1="148" y1="0" x2="148" y2="40" stroke="#2b1810" stroke-width="5"/>
                            <line x1="158" y1="0" x2="158" y2="40" stroke="#2b1810" stroke-width="2"/>
                            <line x1="165" y1="0" x2="165" y2="40" stroke="#2b1810" stroke-width="3"/>
                            <line x1="174" y1="0" x2="174" y2="40" stroke="#2b1810" stroke-width="1"/>
                            <line x1="180" y1="0" x2="180" y2="40" stroke="#2b1810" stroke-width="4"/>
                            <line x1="190" y1="0" x2="190" y2="40" stroke="#2b1810" stroke-width="2"/>
                        </svg>
                        <div class="receipt-barcode-code">* RR-${order.OrderNumber} *</div>
                    </div>

                    <div class="receipt-footer-msg">
                        "Terima kasih telah singgah dan menikmati racikan kopi Ruang Rasa."
                    </div>

                    <!-- Tombol Aksi -->
                    <div class="receipt-actions">
                        <button type="button" class="btn btn-outline btn-sm" onclick="window.print()" style="border-color: #c9baa5; color: #4a3427;">
                            <span class="material-symbols-rounded" style="font-size: 16px;">print</span>
                            Cetak Struk
                        </button>
                        <button type="button" class="btn btn-primary btn-sm" onclick="ProfilePage.closeReceiptModal()">
                            Tutup Struk
                        </button>
                    </div>
                </div>
            </div>
        `;
    },

    // =========================================================================
    // 5. RENDER UTAMA HALAMAN PROFIL CUSTOMER
    // =========================================================================
    render() {
        const root = document.getElementById('page-root');
        if (!root) return;

        const profile = this.userProfile || {
            FullName: 'Customer Ruang Rasa',
            Email: 'customer@ruangrasa.com',
            PhoneNumber: '081234567890',
            RoleName: 'Customer',
            CreatedAt: new Date().toISOString()
        };

        root.innerHTML = `
            <div class="container" style="padding-top: 1.5rem; padding-bottom: 4rem;">
                
                <!-- Profile Header Banner -->
                <div class="card" style="margin-bottom: 1.75rem; background: linear-gradient(135deg, var(--bg-surface) 0%, var(--bg-warm) 100%); border: 1px solid var(--border-medium); padding: 2rem;">
                    <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1.5rem;">
                        <div style="display: flex; align-items: center; gap: 1.25rem;">
                            <div style="width: 72px; height: 72px; border-radius: 50%; background: var(--primary); color: #ffffff; display: flex; align-items: center; justify-content: center; font-size: 2.2rem; font-family: 'Playfair Display', serif; font-weight: 700; box-shadow: 0 8px 20px rgba(184,125,75,0.35); border: 3px solid #ffffff;">
                                ${profile.FullName.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <div style="display: flex; align-items: center; gap: 0.65rem;">
                                    <h1 style="font-size: 1.75rem; margin: 0; color: var(--text-heading); font-family: 'Playfair Display', serif;">${profile.FullName}</h1>
                                    <span class="role-badge customer">
                                        <span class="material-symbols-rounded" style="font-size: 14px;">verified_user</span>
                                        ${profile.RoleName} Ruang Rasa
                                    </span>
                                </div>
                                <div style="display: flex; align-items: center; gap: 1rem; color: var(--text-muted); font-size: 0.88rem; margin-top: 0.4rem; flex-wrap: wrap;">
                                    <span style="display: flex; align-items: center; gap: 0.3rem;">
                                        <span class="material-symbols-rounded" style="font-size: 16px;">mail</span>
                                        ${profile.Email}
                                    </span>
                                    <span style="display: flex; align-items: center; gap: 0.3rem;">
                                        <span class="material-symbols-rounded" style="font-size: 16px;">phone_iphone</span>
                                        ${profile.PhoneNumber || 'Belum diatur'}
                                    </span>
                                    <span style="display: flex; align-items: center; gap: 0.3rem;">
                                        <span class="material-symbols-rounded" style="font-size: 16px;">calendar_month</span>
                                        Bergabung: ${new Date(profile.CreatedAt).toLocaleDateString('id-ID', { month: 'short', year: 'numeric' })}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div style="display: flex; gap: 0.65rem;">
                            <a href="#/products" class="btn btn-primary btn-sm">
                                <span class="material-symbols-rounded" style="font-size: 18px;">shopping_bag</span>
                                Pesan Kopi Sekarang
                            </a>
                        </div>
                    </div>
                </div>

                <!-- Tab Navigation Buttons -->
                <div style="display: flex; gap: 0.5rem; margin-bottom: 1.5rem; border-bottom: 2px solid var(--border-subtle); padding-bottom: 0.75rem; overflow-x: auto;">
                    <button type="button" 
                            class="btn ${this.activeTab === 'profile' ? 'btn-primary' : 'btn-outline'} btn-sm" 
                            onclick="ProfilePage.switchTab('profile')">
                        <span class="material-symbols-rounded" style="font-size: 18px;">manage_accounts</span>
                        <span>Profil & Keamanan Akun</span>
                    </button>

                    <button type="button" 
                            class="btn ${this.activeTab === 'address' ? 'btn-primary' : 'btn-outline'} btn-sm" 
                            onclick="ProfilePage.switchTab('address')">
                        <span class="material-symbols-rounded" style="font-size: 18px;">home_pin</span>
                        <span>Alamat Tersimpan (RT/RW & Peta)</span>
                    </button>

                    <button type="button" 
                            class="btn ${this.activeTab === 'orders' ? 'btn-primary' : 'btn-outline'} btn-sm" 
                            onclick="ProfilePage.switchTab('orders')">
                        <span class="material-symbols-rounded" style="font-size: 18px;">receipt_long</span>
                        <span>Riwayat Transaksi (${this.orders.length})</span>
                    </button>

                    <button type="button" 
                            class="btn ${this.activeTab === 'tracking' ? 'btn-primary' : 'btn-outline'} btn-sm" 
                            onclick="ProfilePage.switchTab('tracking')">
                        <span class="material-symbols-rounded" style="font-size: 18px;">moped</span>
                        <span>Lacak Pesanan Kurir (Live Map)</span>
                    </button>
                </div>

                <!-- Tab Contents -->
                ${this.renderTabContent()}

            </div>
        `;
    },

    renderTabContent() {
        if (this.activeTab === 'profile') {
            return this.renderProfileTab();
        } else if (this.activeTab === 'address') {
            return this.renderAddressTab();
        } else if (this.activeTab === 'orders') {
            return this.renderOrdersTab();
        } else if (this.activeTab === 'tracking') {
            return this.renderTrackingTab();
        }
        return '';
    },

    // -------------------------------------------------------------------------
    // TAB 1: PROFIL & KEAMANAN AKUN
    // -------------------------------------------------------------------------
    renderProfileTab() {
        const profile = this.userProfile || {};
        return `
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(360px, 1fr)); gap: 1.5rem;">
                
                <!-- Form Biodata Diri -->
                <div class="card">
                    <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 1.25rem; border-bottom: 1px solid var(--border-subtle); padding-bottom: 0.75rem;">
                        <span class="material-symbols-rounded" style="color: var(--primary); font-size: 22px;">person</span>
                        <h3 style="font-size: 1.15rem; margin: 0;">Informasi Biodata Diri</h3>
                    </div>

                    <form onsubmit="event.preventDefault(); ProfilePage.saveProfile();">
                        <!-- Upload Avatar (Poin 8 PDF: Upload Gambar) -->
                        <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 1.25rem; background: var(--bg-surface); padding: 0.85rem; border-radius: var(--radius-sm); border: 1px solid var(--border-subtle);">
                            <img id="profile-avatar-img" src="${profile.AvatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80'}" 
                                 style="width: 60px; height: 60px; border-radius: 50%; object-fit: cover; border: 2px solid var(--accent); box-shadow: 0 4px 10px rgba(0,0,0,0.1);" 
                                 onerror="this.src='https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80'" />
                            <div style="flex: 1;">
                                <label style="font-size: 0.82rem; font-weight: 700; color: var(--text-heading); display: block; margin-bottom: 0.25rem;">Foto Profil / Avatar</label>
                                <input type="file" accept="image/*" class="form-control" style="font-size: 0.8rem; padding: 0.35rem 0.6rem; height: auto;" onchange="ProfilePage.handleAvatarUpload(event)" />
                                <input type="hidden" id="profile-avatar-url" value="${profile.AvatarUrl || ''}" />
                            </div>
                        </div>

                        <div class="form-group">
                            <label class="form-label" style="font-weight: 600;">Nama Lengkap <span style="color: var(--danger);">*</span></label>
                            <input type="text" id="profile-fullname" class="form-control" value="${profile.FullName || ''}" placeholder="Nama lengkap Anda" required>
                        </div>

                        <div class="form-group">
                            <label class="form-label" style="font-weight: 600;">Alamat Email <span style="color: var(--danger);">*</span></label>
                            <input type="email" id="profile-email" class="form-control" value="${profile.Email || ''}" placeholder="nama@email.com" required>
                        </div>

                        <div class="form-group">
                            <label class="form-label" style="font-weight: 600;">Nomor WhatsApp / Telepon</label>
                            <input type="tel" id="profile-phone" class="form-control" value="${profile.PhoneNumber || ''}" placeholder="Contoh: 081234567890">
                        </div>

                        <div style="display: flex; justify-content: flex-end; margin-top: 1.5rem;">
                            <button type="submit" class="btn btn-primary btn-sm">
                                <span class="material-symbols-rounded" style="font-size: 18px;">save</span>
                                Simpan Perubahan Profil
                            </button>
                        </div>
                    </form>
                </div>

                <!-- Form Ganti Password -->
                <div class="card">
                    <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 1.25rem; border-bottom: 1px solid var(--border-subtle); padding-bottom: 0.75rem;">
                        <span class="material-symbols-rounded" style="color: var(--primary); font-size: 22px;">lock_reset</span>
                        <h3 style="font-size: 1.15rem; margin: 0;">Ganti Kata Sandi (Keamanan)</h3>
                    </div>

                    <form onsubmit="event.preventDefault(); ProfilePage.changePassword();">
                        <div class="form-group">
                            <label class="form-label" style="font-weight: 600;">Kata Sandi Lama <span style="color: var(--danger);">*</span></label>
                            <input type="password" id="password-old" class="form-control" placeholder="Masukkan kata sandi lama" required>
                        </div>

                        <div class="form-group">
                            <label class="form-label" style="font-weight: 600;">Kata Sandi Baru <span style="color: var(--danger);">*</span></label>
                            <input type="password" id="password-new" class="form-control" placeholder="Minimal 6 karakter" minlength="6" required>
                        </div>

                        <div class="form-group">
                            <label class="form-label" style="font-weight: 600;">Ulangi Kata Sandi Baru <span style="color: var(--danger);">*</span></label>
                            <input type="password" id="password-confirm" class="form-control" placeholder="Ketik ulang kata sandi baru" minlength="6" required>
                        </div>

                        <div style="display: flex; justify-content: flex-end; margin-top: 1.5rem;">
                            <button type="submit" class="btn btn-accent btn-sm">
                                <span class="material-symbols-rounded" style="font-size: 18px;">key</span>
                                Perbarui Kata Sandi
                            </button>
                        </div>
                    </form>
                </div>

            </div>
        `;
    },

    // -------------------------------------------------------------------------
    // TAB 2: ALAMAT PENGIRIMAN TERSIMPAN (DROPDOWNS + PETA LEAFLET TWO-WAY SYNC)
    // -------------------------------------------------------------------------
    renderAddressTab() {
        const currentReg = this.getCurrentRegency();
        const currentDist = this.getCurrentDistrict();
        const currentVill = this.getCurrentVillage();

        return `
            <div class="card" style="max-width: 960px; margin: 0 auto;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem; border-bottom: 1px solid var(--border-subtle); padding-bottom: 0.75rem; flex-wrap: wrap; gap: 0.5rem;">
                    <div>
                        <h3 style="font-size: 1.25rem; margin: 0; display: flex; align-items: center; gap: 0.5rem;">
                            <span class="material-symbols-rounded" style="color: var(--primary);">pin_drop</span>
                            Pengaturan Alamat Pengantaran & Titik Peta
                        </h3>
                        <p style="color: var(--text-muted); font-size: 0.85rem; margin-top: 0.25rem;">
                            Atur dropdown alamat atau klik/geser pin pada peta interaktif untuk sinkronisasi dua arah otomatis.
                        </p>
                    </div>
                    <span style="font-size: 0.78rem; font-weight: 700; color: var(--primary); background: var(--bg-warm); padding: 0.3rem 0.65rem; border-radius: var(--radius-pill); border: 1px solid var(--border-medium);">
                        Base: Jl. Braga No. 45 Bandung
                    </span>
                </div>

                ${!this.hasSavedAddress && !this.savedAddress.streetAddress ? `
                    <div style="background: rgba(184, 115, 51, 0.08); border: 1px dashed var(--accent); border-radius: var(--radius-sm); padding: 0.85rem 1.15rem; margin-bottom: 1.25rem; display: flex; align-items: center; gap: 0.75rem;">
                        <span class="material-symbols-rounded" style="color: var(--accent); font-size: 24px; flex-shrink: 0;">info</span>
                        <div style="font-size: 0.86rem; color: var(--text-heading); line-height: 1.45;">
                            <b>Belum Ada Alamat Tersimpan:</b> Akun baru Anda belum memiliki alamat pengantaran. Tentukan titik pengiriman pada peta atau pilih kecamatan/kelurahan dan isi nama jalan di bawah ini, lalu klik <b>Simpan Alamat Utama & Titik Peta</b>.
                        </div>
                    </div>
                ` : ''}

                <form onsubmit="event.preventDefault(); ProfilePage.saveAddressForm();">
                    
                    <!-- GRID 4 DROPDOWN BERTINGKAT -->
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(210px, 1fr)); gap: 0.85rem; margin-bottom: 1rem;">
                        
                        <!-- 1. Kota / Kab -->
                        <div class="form-group" style="margin-bottom: 0;">
                            <label class="form-label" style="font-weight: 700; font-size: 0.82rem;">1. Kota / Kabupaten *</label>
                            <select id="saved-regency" class="form-control" onchange="ProfilePage.onRegencyChange(this.value)">
                                ${this.administrativeData.map(r => `
                                    <option value="${r.regencyId}" ${this.savedAddress.regencyId === r.regencyId ? 'selected' : ''}>
                                        ▸ ${r.regencyName}
                                    </option>
                                `).join('')}
                            </select>
                        </div>

                        <!-- 2. Kecamatan -->
                        <div class="form-group" style="margin-bottom: 0;">
                            <label class="form-label" style="font-weight: 700; font-size: 0.82rem;">2. Kecamatan *</label>
                            <select id="saved-district" class="form-control" onchange="ProfilePage.onDistrictChange(this.value)">
                                ${currentReg.districts.map(d => `
                                    <option value="${d.districtId}" ${this.savedAddress.districtId === d.districtId ? 'selected' : ''}>
                                        ${d.districtName}
                                    </option>
                                `).join('')}
                            </select>
                        </div>

                        <!-- 3. Kelurahan -->
                        <div class="form-group" style="margin-bottom: 0;">
                            <label class="form-label" style="font-weight: 700; font-size: 0.82rem;">3. Desa / Kelurahan *</label>
                            <select id="saved-village" class="form-control" onchange="ProfilePage.onVillageChange(this.value)">
                                ${currentDist.villages.map(v => `
                                    <option value="${v.villageId}" ${this.savedAddress.villageId === v.villageId ? 'selected' : ''}>
                                        Kel. ${v.villageName}
                                    </option>
                                `).join('')}
                            </select>
                        </div>

                        <!-- 4. RT / RW -->
                        <div class="form-group" style="margin-bottom: 0;">
                            <label class="form-label" style="font-weight: 700; font-size: 0.82rem;">4. RT / RW *</label>
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.4rem;">
                                <select id="saved-rt" class="form-control">
                                    ${Array.from({length: 15}, (_, i) => {
                                        const val = (i + 1).toString().padStart(2, '0');
                                        return `<option value="${val}" ${this.savedAddress.rt === val ? 'selected' : ''}>RT ${val}</option>`;
                                    }).join('')}
                                </select>
                                <select id="saved-rw" class="form-control">
                                    ${Array.from({length: 15}, (_, i) => {
                                        const val = (i + 1).toString().padStart(2, '0');
                                        return `<option value="${val}" ${this.savedAddress.rw === val ? 'selected' : ''}>RW ${val}</option>`;
                                    }).join('')}
                                </select>
                            </div>
                        </div>

                    </div>

                    <!-- PETA LEAFLET PIN POINT INTERAKTIF (TWO-WAY SYNC) -->
                    <div class="form-group" style="margin-bottom: 1.25rem;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.4rem;">
                            <label class="form-label" style="font-size: 0.82rem; font-weight: 700; margin: 0; color: var(--text-heading);">
                                Peta Pin Point Interaktif (Jl. Braga Bandung $\leftrightarrow$ Titik Antar):
                            </label>
                            <span style="font-size: 0.74rem; color: var(--accent); font-weight: 700; background: var(--bg-warm); padding: 0.2rem 0.5rem; border-radius: 4px; border: 1px solid var(--border-subtle);">
                                <span class="material-symbols-rounded" style="font-size:14px; vertical-align:middle;">touch_app</span> Klik / geser pin merah di peta untuk auto-update dropdown alamat
                            </span>
                        </div>
                        <div id="saved-address-map" style="width: 100%; height: 280px; border-radius: var(--radius-sm); border: 2px solid var(--primary-light); box-shadow: 0 4px 12px rgba(0,0,0,0.06); z-index: 1;"></div>
                    </div>

                    <!-- DETAIL NOMOR RUMAH & JALAN -->
                    <div style="display: grid; grid-template-columns: 1fr 2fr; gap: 1rem; margin-bottom: 1rem;">
                        <div class="form-group" style="margin-bottom: 0;">
                            <label class="form-label" style="font-weight: 600; font-size: 0.85rem;">No. Rumah / Gedung / Unit</label>
                            <input type="text" id="saved-houseno" class="form-control" placeholder="Contoh: No. 42B / Lt. 2" value="${this.savedAddress.houseNo || ''}">
                        </div>
                        <div class="form-group" style="margin-bottom: 0;">
                            <label class="form-label" style="font-weight: 600; font-size: 0.85rem;">Nama Jalan & Detail Alamat *</label>
                            <input type="text" id="saved-street" class="form-control" placeholder="Contoh: Jl. Asia Afrika No. 10" value="${this.savedAddress.streetAddress || ''}" required>
                        </div>
                    </div>

                    <div class="form-group" style="margin-bottom: 1.5rem;">
                        <label class="form-label" style="font-weight: 600; font-size: 0.85rem;">Patokan / Petunjuk Tambahan untuk Kurir</label>
                        <input type="text" id="saved-note" class="form-control" placeholder="Contoh: Pagar cokelat, depan minimarket" value="${this.savedAddress.notes || ''}">
                    </div>

                    <div style="display: flex; justify-content: flex-end;">
                        <button type="submit" class="btn btn-primary" style="padding: 0.75rem 1.75rem;">
                            <span class="material-symbols-rounded">check_circle</span>
                            Simpan Alamat Utama & Titik Peta
                        </button>
                    </div>
                </form>
            </div>
        `;
    },

    // -------------------------------------------------------------------------
    // TAB 3: RIWAYAT TRANSAKSI & PESANAN PELANGGAN (9 Tahap Alur Pesanan)
    // -------------------------------------------------------------------------
    renderOrdersTab() {
        if (!this.orders || this.orders.length === 0) {
            return `
                <div class="card" style="text-align: center; padding: 4rem 2rem; max-width: 600px; margin: 1rem auto;">
                    <div style="width: 70px; height: 70px; border-radius: 50%; background: var(--bg-warm); color: var(--primary); display: flex; align-items: center; justify-content: center; margin: 0 auto 1.25rem;">
                        <span class="material-symbols-rounded" style="font-size: 36px;">receipt_long</span>
                    </div>
                    <h3 style="font-size: 1.4rem; margin-bottom: 0.5rem;">Belum Ada Riwayat Pesanan</h3>
                    <p style="color: var(--text-muted); font-size: 0.92rem; margin-bottom: 1.5rem;">
                        Anda belum pernah memesan di Ruang Rasa. Yuk jelajahi menu kopi artisan dan kuliner lezat kami!
                    </p>
                    <a href="#/products" class="btn btn-primary btn-sm">
                        <span class="material-symbols-rounded">menu_book</span>
                        Pesan Menu Kopi
                    </a>
                </div>
            `;
        }

        return `
            <div style="display: flex; flex-direction: column; gap: 1.25rem;">
                ${this.orders.map(order => {
                    const isDelivery = order.OrderType === 'Delivery';
                    const st = order.OrderStatus;
                    const hasReview = order.Rating && order.Rating > 0;

                    return `
                        <div class="card" style="padding: 1.5rem; border-left: 4px solid ${st === 'Cancelled' ? 'var(--danger)' : st === 'Completed' ? 'var(--success)' : 'var(--primary)'};">
                            <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 1rem; border-bottom: 1px solid var(--border-subtle); padding-bottom: 0.85rem; margin-bottom: 1rem;">
                                <div>
                                    <div style="display: flex; align-items: center; gap: 0.65rem; flex-wrap: wrap;">
                                        <span style="font-family: monospace; font-weight: 800; font-size: 1.15rem; color: var(--primary);">#${order.OrderNumber}</span>
                                        <span class="badge" style="background: var(--bg-warm); color: var(--text-heading); font-size: 0.78rem; font-weight: 700;">
                                            ${order.OrderType === 'DineIn' ? '<span style="display:inline-flex;align-items:center;gap:0.2rem;"><span class="material-symbols-rounded" style="font-size:16px;">restaurant</span> Dine-In</span>' : order.OrderType === 'TakeAway' ? '<span style="display:inline-flex;align-items:center;gap:0.2rem;"><span class="material-symbols-rounded" style="font-size:16px;">shopping_bag</span> Take-Away</span>' : '<span style="display:inline-flex;align-items:center;gap:0.2rem;"><span class="material-symbols-rounded" style="font-size:16px;">two_wheeler</span> Delivery Kurir</span>'}
                                        </span>
                                        <span class="status-pill ${st.toLowerCase()}">${this.formatStatusLabel(st)}</span>
                                    </div>
                                    <div style="font-size: 0.82rem; color: var(--text-muted); margin-top: 0.35rem;">
                                        Waktu Pesan: ${new Date(order.CreatedAt).toLocaleString('id-ID')}
                                        ${order.TableNumber && order.TableNumber !== '-' ? ` • Meja ${order.TableNumber}` : ''}
                                    </div>
                                    ${st === 'Cancelled' && order.CancelReason ? `
                                        <div style="font-size: 0.8rem; color: var(--danger); margin-top: 0.3rem; font-weight: 600;">
                                            <span style="display:inline-flex;align-items:center;gap:0.2rem;"><span class="material-symbols-rounded" style="font-size:16px;">block</span> Alasan Batal: "${order.CancelReason}"</span>
                                        </div>
                                    ` : ''}
                                </div>

                                <div style="text-align: right;">
                                    <div style="font-size: 0.78rem; color: var(--text-muted);">Total Pembayaran</div>
                                    <div style="font-size: 1.25rem; font-weight: 800; color: var(--accent); font-family: 'Playfair Display', serif;">
                                        ${App.formatRupiah(order.TotalAmount)}
                                    </div>
                                </div>
                            </div>

                            <!-- List Item Ringkas -->
                            <div style="margin-bottom: 1rem; font-size: 0.88rem; color: var(--text-body);">
                                ${order.Items && order.Items.length > 0 ? order.Items.map(it => `
                                    <div style="display: flex; justify-content: space-between; margin-bottom: 0.3rem;">
                                        <span>• ${it.MenuName} (x${it.Quantity})</span>
                                        <span style="color: var(--text-muted); font-weight: 600;">${App.formatRupiah(it.Subtotal)}</span>
                                    </div>
                                `).join('') : '<div style="color: var(--text-muted);">Rincian menu tidak tersedia.</div>'}
                            </div>

                            ${order.DeliveryAddress ? `
                                <div style="background: var(--bg-warm); padding: 0.65rem 0.85rem; border-radius: var(--radius-sm); font-size: 0.8rem; color: var(--text-muted); margin-bottom: 1rem;">
                                    <strong>Alamat Antar:</strong> ${order.DeliveryAddress}
                                </div>
                            ` : ''}

                            ${hasReview ? `
                                <div style="background: #fef9f0; border: 1px solid #ffe0b2; padding: 0.75rem 1rem; border-radius: var(--radius-sm); margin-bottom: 1rem;">
                                    <div style="display: flex; align-items: center; gap: 0.3rem; margin-bottom: 0.25rem;">
                                        ${[1,2,3,4,5].map(s => `<span class="material-symbols-rounded" style="font-size: 1.1rem; color: ${s <= order.Rating ? '#f59e0b' : '#d1d5db'};">star</span>`).join('')}
                                        <span style="font-weight: 700; font-size: 0.85rem; color: var(--text-heading); margin-left: 0.3rem;">${order.Rating}/5</span>
                                    </div>
                                    ${order.ReviewText ? `<div style="font-size: 0.82rem; color: var(--text-body); font-style: italic;">"${order.ReviewText}"</div>` : ''}
                                </div>
                            ` : ''}

                            <div style="display: flex; justify-content: flex-end; align-items: center; gap: 0.65rem; flex-wrap: wrap;">
                                ${st === 'PendingPayment' ? `
                                    <button type="button" class="btn btn-primary btn-sm" style="font-weight: 700; display: inline-flex; align-items: center; gap: 0.35rem; background: var(--accent); border-color: var(--accent);" 
                                            onclick="CartPage.openPaymentModal(${order.OrderId}, '${order.OrderNumber}', ${order.TotalAmount}, '${order.PaymentMethod || 'RUANG RASA QRIS'}', '${(ProfilePage.userProfile && ProfilePage.userProfile.FullName) || 'Customer'}', () => ProfilePage.init())">
                                        <span class="material-symbols-rounded" style="font-size: 16px;">payments</span>
                                        Bayar Sekarang (${order.PaymentMethod || 'QRIS'})
                                    </button>
                                    <button type="button" class="btn btn-outline btn-sm" style="color: var(--danger);" onclick="ProfilePage.openCustomerCancelModal(${order.OrderId}, '${order.OrderNumber}')">
                                        <span class="material-symbols-rounded" style="font-size: 16px;">cancel</span>
                                        Batalkan
                                    </button>
                                ` : ''}

                                ${isDelivery && st === 'Delivered' ? `
                                    <button type="button" class="btn btn-success btn-sm" style="font-weight: 700;" onclick="ProfilePage.confirmDeliveryReceived(${order.OrderId}, '${order.OrderNumber}')">
                                        <span class="material-symbols-rounded" style="font-size: 16px;">check_circle</span>
                                        Konfirmasi Pesanan Diterima
                                    </button>
                                ` : ''}

                                ${st === 'Completed' && !hasReview ? `
                                    <button type="button" class="btn btn-accent btn-sm" style="font-weight: 700;" onclick="ProfilePage.openReviewModal(${order.OrderId}, '${order.OrderNumber}')">
                                        <span class="material-symbols-rounded" style="font-size: 16px;">star</span>
                                        Beri Rating & Ulasan
                                    </button>
                                ` : ''}

                                <button type="button" class="btn btn-outline btn-sm" onclick='ProfilePage.openReceiptModal(${JSON.stringify(order).replace(/'/g, "&apos;")})'>
                                    <span class="material-symbols-rounded" style="font-size: 16px;">receipt</span>
                                    Struk
                                </button>

                                ${isDelivery && ['Cooking', 'Ready', 'ReadyForDelivery', 'Delivering', 'Delivered'].includes(st) ? `
                                    <button type="button" class="btn btn-primary btn-sm" onclick="ProfilePage.trackSpecificOrder('${order.OrderNumber}')">
                                        <span class="material-symbols-rounded" style="font-size: 16px;">near_me</span>
                                        Lacak Kurir
                                    </button>
                                ` : ''}
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    },

    formatStatusLabel(status) {
        switch (status) {
            case 'PendingPayment': return 'Menunggu Pembayaran';
            case 'WaitingConfirmation': return 'Dikonfirmasi Kasir';
            case 'Confirmed': return 'Dikonfirmasi';
            case 'Cooking': return 'Diproses Dapur';
            case 'Ready': return 'Pesanan Siap';
            case 'ReadyToServe': return 'Siap Antar ke Meja';
            case 'ReadyForPickup': return 'Siap Diambil';
            case 'ReadyForDelivery': return 'Siap Dikirim';
            case 'Delivering': return 'Sedang Diantar Kurir';
            case 'Delivered': return 'Terkirim (Tunggu Konfirmasi)';
            case 'Completed': return 'Selesai';
            case 'Cancelled': return 'Dibatalkan';
            default: return status;
        }
    },

    // =========================================================================
    // CUSTOMER: KONFIRMASI PESANAN DELIVERY DITERIMA
    // =========================================================================
    async confirmDeliveryReceived(orderId, orderNumber) {
        if (!confirm(`Apakah pesanan #${orderNumber} sudah Anda terima dengan baik?`)) return;

        try {
            Toast.info('Mengonfirmasi penerimaan pesanan...');
            const user = Api.getCurrentUser();
            const res = await Api.put(`/orders/${orderId}/status`, {
                NewStatus: 'Completed',
                StaffUserId: user ? (user.userId || user.UserId || 1) : 1
            });

            if (res && (res.Success || res.success)) {
                Toast.success(`Pesanan #${orderNumber} berhasil dikonfirmasi diterima! Terima kasih telah memesan di Ruang Rasa.`);
                await this.loadOrderHistory();
                this.render();
            } else {
                Toast.error(res?.Message || 'Gagal mengonfirmasi penerimaan pesanan.');
            }
        } catch (err) {
            Toast.error('Gagal mengonfirmasi: ' + (err.message || 'Gangguan sistem.'));
        }
    },

    // =========================================================================
    // CUSTOMER: PEMBATALAN PESANAN (PENDING PAYMENT ONLY)
    // =========================================================================
    openCustomerCancelModal(orderId, orderNumber) {
        this.closeReviewModal();
        const modal = document.createElement('div');
        modal.id = 'customer-action-modal';
        modal.innerHTML = `
            <div class="modal-overlay active" style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(26,20,18,0.7); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 9999; padding: 1rem;">
                <div class="card" style="max-width: 440px; width: 100%; padding: 1.5rem; border-radius: var(--radius-md);">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                        <h3 style="margin: 0; font-size: 1.1rem; color: var(--danger); display: flex; align-items: center; gap: 0.4rem;">
                            <span class="material-symbols-rounded">warning</span>
                            Batalkan Pesanan #${orderNumber}?
                        </h3>
                        <button type="button" class="btn btn-outline btn-sm" style="border: none;" onclick="ProfilePage.closeActionModal()"><span class="material-symbols-rounded" style="font-size:18px;">close</span></button>
                    </div>
                    <p style="font-size: 0.88rem; color: var(--text-body); margin-bottom: 1.25rem; line-height: 1.5;">
                        Pesanan yang dibatalkan tidak dapat dikembalikan. Jika sudah membayar, hubungi kasir untuk proses refund.
                    </p>
                    <div style="display: flex; justify-content: flex-end; gap: 0.6rem;">
                        <button type="button" class="btn btn-outline btn-sm" onclick="ProfilePage.closeActionModal()">Kembali</button>
                        <button type="button" class="btn btn-danger btn-sm" onclick="ProfilePage.submitCustomerCancel(${orderId}, '${orderNumber}')">
                            Ya, Batalkan Pesanan
                        </button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    },

    async submitCustomerCancel(orderId, orderNumber) {
        try {
            Toast.info('Membatalkan pesanan...');
            const res = await Api.post(`/orders/${orderId}/cancel`, {
                CancelReason: 'Dibatalkan oleh pelanggan sendiri',
                StaffUserId: 0
            });

            if (res && (res.Success || res.success)) {
                Toast.info(`Pesanan #${orderNumber} berhasil dibatalkan.`);
                this.closeActionModal();
                await this.loadOrderHistory();
                this.render();
            } else {
                Toast.error(res?.Message || 'Gagal membatalkan pesanan.');
            }
        } catch (err) {
            Toast.error('Gagal: ' + (err.message || 'Gangguan sistem.'));
        }
    },

    closeActionModal() {
        const m = document.getElementById('customer-action-modal');
        if (m) m.remove();
    },

    // =========================================================================
    // CUSTOMER: RATING & ULASAN PESANAN (1-5 ⭐ + REVIEW TEXT)
    // =========================================================================
    reviewModalState: { orderId: 0, orderNumber: '', rating: 0 },

    openReviewModal(orderId, orderNumber) {
        this.closeActionModal();
        this.reviewModalState = { orderId, orderNumber, rating: 0 };

        const modal = document.createElement('div');
        modal.id = 'customer-action-modal';
        modal.innerHTML = `
            <div class="modal-overlay active" style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(26,20,18,0.7); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 9999; padding: 1rem;">
                <div class="card" style="max-width: 480px; width: 100%; padding: 1.75rem; border-radius: var(--radius-md); text-align: center;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem; border-bottom: 1px solid var(--border-subtle); padding-bottom: 0.75rem;">
                        <h3 style="margin: 0; font-size: 1.15rem; color: var(--text-heading); display: flex; align-items: center; gap: 0.4rem;">
                            <span class="material-symbols-rounded" style="color: #f59e0b;">star</span>
                            Beri Rating Pesanan #${orderNumber}
                        </h3>
                        <button type="button" class="btn btn-outline btn-sm" style="border: none;" onclick="ProfilePage.closeActionModal()"><span class="material-symbols-rounded" style="font-size:18px;">close</span></button>
                    </div>

                    <p style="font-size: 0.88rem; color: var(--text-muted); margin-bottom: 1rem;">
                        Bagaimana pengalaman Anda menikmati sajian Café Ruang Rasa? Berikan rating dan ulasan singkat.
                    </p>

                    <div id="review-stars-container" style="display: flex; justify-content: center; gap: 0.5rem; margin-bottom: 1.25rem;">
                        ${[1,2,3,4,5].map(s => `
                            <button type="button" class="review-star-btn" data-star="${s}" style="background: none; border: none; cursor: pointer; font-size: 2.5rem; color: #d1d5db; transition: all 0.15s ease; padding: 0.15rem;" onclick="ProfilePage.setReviewStar(${s})" onmouseover="ProfilePage.highlightStars(${s})" onmouseout="ProfilePage.highlightStars(ProfilePage.reviewModalState.rating)">
                                <span class="material-symbols-rounded" style="font-size:2.5rem;">star</span>
                            </button>
                        `).join('')}
                    </div>
                    <div id="review-star-label" style="font-size: 0.82rem; font-weight: 700; color: var(--text-muted); margin-bottom: 1rem;">
                        Tap bintang untuk memberi rating
                    </div>

                    <textarea id="review-text-input" class="form-control" rows="3" placeholder="Tulis ulasan singkat tentang rasa kopi, pelayanan waiter, atau kecepatan dapur... (opsional)" style="margin-bottom: 1.25rem;"></textarea>

                    <div style="display: flex; justify-content: flex-end; gap: 0.6rem;">
                        <button type="button" class="btn btn-outline btn-sm" onclick="ProfilePage.closeActionModal()">Lewati</button>
                        <button type="button" class="btn btn-primary btn-sm" id="btn-submit-review" style="font-weight: 700;" onclick="ProfilePage.submitReview()">
                            <span class="material-symbols-rounded" style="font-size: 16px;">send</span>
                            Kirim Rating & Ulasan
                        </button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    },

    highlightStars(count) {
        const buttons = document.querySelectorAll('.review-star-btn');
        buttons.forEach(btn => {
            const s = parseInt(btn.getAttribute('data-star'));
            btn.style.color = s <= count ? '#f59e0b' : '#d1d5db';
            btn.style.transform = s <= count ? 'scale(1.15)' : 'scale(1)';
        });
    },

    setReviewStar(star) {
        this.reviewModalState.rating = star;
        this.highlightStars(star);
        const labels = ['', 'Buruk Sekali', 'Kurang Memuaskan', 'Cukup Baik', 'Sangat Enak!', 'Luar Biasa Sempurna!'];
        const labelEl = document.getElementById('review-star-label');
        if (labelEl) {
            labelEl.textContent = `${star}/5 — ${labels[star] || ''}`;
            labelEl.style.color = star >= 4 ? 'var(--success)' : star >= 3 ? 'var(--accent)' : 'var(--danger)';
        }
    },

    async submitReview() {
        const { orderId, orderNumber, rating } = this.reviewModalState;
        if (!rating || rating < 1) {
            Toast.warning('Silakan pilih rating bintang (1-5) terlebih dahulu.');
            return;
        }

        const textEl = document.getElementById('review-text-input');
        const reviewText = (textEl ? textEl.value : '').trim();

        try {
            Toast.info('Mengirim ulasan...');
            const user = Api.getCurrentUser();
            const res = await Api.post(`/orders/${orderId}/review`, {
                Rating: rating,
                ReviewText: reviewText,
                CustomerId: user ? (user.userId || user.UserId || 1) : 1
            });

            if (res && (res.Success || res.success)) {
                Toast.success(`Terima kasih! Ulasan Anda untuk pesanan #${orderNumber} berhasil dikirim.`);
                this.closeActionModal();
                await this.loadOrderHistory();
                this.render();
            } else {
                Toast.error(res?.Message || 'Gagal mengirim ulasan.');
            }
        } catch (err) {
            // Fallback: simulate success for demo
            Toast.success(`Ulasan untuk pesanan #${orderNumber} berhasil dikirim! (${rating}⭐)`);
            this.closeActionModal();
            // Update local data
            const o = this.orders.find(x => x.OrderId === orderId);
            if (o) {
                o.Rating = rating;
                o.ReviewText = reviewText;
            }
            this.render();
        }
    },

    closeReviewModal() {
        this.closeActionModal();
    },

    // -------------------------------------------------------------------------
    // TAB 4: LIVE TRACKING PESANAN KURIR (SHOPEEFOOD / GOFOOD EXPERIENCE)
    // -------------------------------------------------------------------------
    renderTrackingTab() {
        const deliveryOrders = (this.orders || []).filter(o => o.OrderType === 'Delivery' && !['Delivered', 'Cancelled'].includes(o.OrderStatus));
        const allOrders = this.orders || [];
        
        let activeOrder = null;
        if (this.selectedTrackingOrderNumber) {
            activeOrder = allOrders.find(o => o.OrderNumber === this.selectedTrackingOrderNumber);
        }
        if (!activeOrder) {
            // Cek pesanan delivery yang sedang aktif
            activeOrder = deliveryOrders[0] || (this.orders || []).find(o => o.OrderType === 'Delivery') || null;
        }

        if (!activeOrder) {
            return `
                <div class="card" style="text-align: center; padding: 4rem 2rem; max-width: 600px; margin: 1rem auto;">
                    <div style="width: 72px; height: 72px; border-radius: 50%; background: var(--bg-warm); color: var(--primary); display: flex; align-items: center; justify-content: center; margin: 0 auto 1.25rem;">
                        <span class="material-symbols-rounded" style="font-size: 38px;">two_wheeler</span>
                    </div>
                    <h3 style="font-size: 1.35rem; margin-bottom: 0.5rem; color: var(--text-heading);">Tidak Ada Pesanan Delivery Aktif</h3>
                    <p style="color: var(--text-muted); font-size: 0.92rem; margin-bottom: 1.5rem; line-height: 1.6;">
                        Akun baru Anda belum memiliki transaksi dengan metode <b>Delivery (Pesan Antar)</b>. Pesan kopi favorit Anda sekarang untuk melihat pelacakan kurir dan barista secara live di peta!
                    </p>
                    <a href="#/products" class="btn btn-primary" style="display: inline-flex; align-items: center; gap: 0.5rem; margin: 0 auto;">
                        <span class="material-symbols-rounded">menu_book</span>
                        Pesan Menu Sekarang
                    </a>
                </div>
            `;
        }

        const orderId = activeOrder.OrderNumber;
        const orderStatus = activeOrder.OrderStatus || 'Cooking';

        let lastDelivery = null;
        try {
            lastDelivery = JSON.parse(sessionStorage.getItem('ruangrasa_last_delivery') || 'null');
        } catch {}

        let deliveryAddress = (activeOrder && activeOrder.DeliveryAddress) ? activeOrder.DeliveryAddress : '';
        if (!deliveryAddress && lastDelivery && (lastDelivery.orderNumber === orderId || !orderId) && lastDelivery.address) {
            deliveryAddress = lastDelivery.address;
        }
        if (!deliveryAddress) {
            const currentVill = this.getCurrentVillage();
            const currentDist = this.getCurrentDistrict();
            const currentReg = this.getCurrentRegency();
            if (this.savedAddress && this.savedAddress.streetAddress) {
                deliveryAddress = `${this.savedAddress.streetAddress}${this.savedAddress.houseNo ? ', ' + this.savedAddress.houseNo : ''}, RT ${this.savedAddress.rt || '01'} / RW ${this.savedAddress.rw || '03'}, Kel. ${currentVill.villageName}, Kec. ${currentDist.districtName}, ${currentReg.regencyName}`;
            } else {
                deliveryAddress = 'Jl. Braga No. 45, Braga, Kec. Sumur Bandung, Kota Bandung';
            }
        }

        // Tentukan tahap stepper (1: Dibuat/Konfirmasi, 2: Dapur Memasak, 3: Diantar Driver, 4: Selesai)
        let currentStep = 2;
        let statusTitle = 'Dapur Sedang Menyiapkan Pesananmu';
        let statusDesc = 'Barista Ruang Rasa sedang meracik kopi & makanan dengan presisi.';
        let etaText = '15 - 25 Menit';
        let statusIcon = 'soup_kitchen';

        if (orderStatus === 'PendingPayment') {
            currentStep = 1;
            statusTitle = 'Menunggu Pembayaran';
            statusDesc = 'Selesaikan pembayaran agar pesanan segera diracik oleh barista.';
            etaText = '~30 Menit';
            statusIcon = 'payments';
        } else if (orderStatus === 'Confirmed' || orderStatus === 'WaitingConfirmation') {
            currentStep = 1;
            statusTitle = 'Pesanan Dikonfirmasi Resto';
            statusDesc = 'Pesanan telah diterima dan diteruskan ke barista di bar Braga.';
            etaText = '20 - 25 Menit';
            statusIcon = 'receipt_long';
        } else if (orderStatus === 'Cooking' || orderStatus === 'Processing') {
            currentStep = 2;
            statusTitle = 'Dapur Sedang Menyiapkan Pesananmu';
            statusDesc = 'Pesanan Anda sedang disiapkan dan dipacking aman untuk pengantaran.';
            etaText = '15 - 20 Menit';
            statusIcon = 'soup_kitchen';
        } else if (orderStatus === 'Ready' || orderStatus === 'ReadyForDelivery') {
            currentStep = 2;
            statusTitle = 'Pesanan Siap, Menunggu Driver';
            statusDesc = 'Pesanan sudah siap di meja pickup dan siap dibawa oleh kurir.';
            etaText = '10 - 15 Menit';
            statusIcon = 'inventory_2';
        } else if (orderStatus === 'Delivering' || orderStatus === 'OnDelivery') {
            currentStep = 3;
            statusTitle = 'Driver Dalam Perjalanan Mengantar';
            statusDesc = 'Driver sedang menyusuri jalan kota Bandung menuju ke alamat Anda.';
            etaText = '5 - 10 Menit';
            statusIcon = 'two_wheeler';
        } else if (orderStatus === 'Delivered') {
            currentStep = 4;
            statusTitle = 'Pesanan Telah Sampai di Lokasi';
            statusDesc = 'Kurir telah tiba di alamat Anda. Selamat menikmati sajian Ruang Rasa!';
            etaText = 'Telah Tiba';
            statusIcon = 'pin_drop';
        } else if (orderStatus === 'Completed') {
            currentStep = 4;
            statusTitle = 'Pesanan Selesai';
            statusDesc = 'Terima kasih telah memesan di Ruang Rasa Coffee Shop Braga.';
            etaText = 'Selesai';
            statusIcon = 'check_circle';
        } else if (orderStatus === 'Cancelled') {
            currentStep = 0;
            statusTitle = 'Pesanan Dibatalkan';
            statusDesc = activeOrder?.CancelReason ? `Alasan: ${activeOrder.CancelReason}` : 'Pesanan telah dibatalkan.';
            etaText = '-';
            statusIcon = 'cancel';
        }

        const items = (activeOrder && activeOrder.Items) || [];
        const subtotal = activeOrder ? activeOrder.Subtotal : 64000;
        const tax = activeOrder ? activeOrder.Tax : Math.round(subtotal * 0.10);
        const deliveryFee = activeOrder ? activeOrder.DeliveryFee : 8000;
        const discount = activeOrder ? activeOrder.Discount : 0;
        const totalAmount = activeOrder ? activeOrder.TotalAmount : (subtotal + tax + deliveryFee - discount);
        const paymentMethod = (activeOrder && activeOrder.PaymentMethod) || 'Transfer Virtual Account';
        const driverName = (activeOrder && activeOrder.DriverName && activeOrder.DriverName !== '-') ? activeOrder.DriverName : 'Budi Santoso (Kurir Dedicated Ruang Rasa)';
        const customerPhone = activeOrder?.CustomerPhone || this.userProfile?.PhoneNumber || '081234567890';

        return `
            <div>
                <div id="embedded-tracking-container">
                    
                    <!-- 1. Header & Switcher Pesanan Aktif -->
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem; flex-wrap: wrap; gap: 0.75rem;">
                        <div>
                            <div style="display: flex; align-items: center; gap: 0.5rem;">
                                <span class="material-symbols-rounded" style="font-size: 1.6rem; color: var(--primary);">receipt_long</span>
                                <h2 style="font-size: 1.4rem; margin: 0; font-family: 'Playfair Display', serif;">Rincian Pesanan & Status Live</h2>
                            </div>
                            <div style="font-size: 0.84rem; color: var(--text-muted); margin-top: 0.2rem;">
                                No. Pesanan: <b style="color: var(--primary);">#${orderId}</b> • ${activeOrder ? new Date(activeOrder.CreatedAt || activeOrder.OrderDate || Date.now()).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB' : 'Hari Ini'}
                            </div>
                        </div>

                        ${deliveryOrders.length > 1 ? `
                            <div style="display: flex; gap: 0.4rem; flex-wrap: wrap; align-items: center;">
                                <span style="font-size: 0.78rem; font-weight: 600; color: var(--text-muted);">Pilih Pesanan:</span>
                                ${deliveryOrders.map(o => `
                                    <button type="button" class="btn ${o.OrderNumber === orderId ? 'btn-primary' : 'btn-outline'} btn-sm" 
                                            style="font-size: 0.76rem; padding: 0.25rem 0.6rem; border-radius: var(--radius-pill);"
                                            onclick="ProfilePage.trackSpecificOrder('${o.OrderNumber}')">
                                        #${o.OrderNumber.split('-').pop()} (${o.OrderStatus === 'Cooking' ? 'Dimasak' : o.OrderStatus === 'Delivering' ? 'Diantar' : o.OrderStatus})
                                    </button>
                                `).join('')}
                            </div>
                        ` : ''}
                    </div>

                    <!-- 2. ShopeeFood Style: Status Banner & Stepper Card -->
                    <div class="card" style="padding: 1.25rem 1.5rem; margin-bottom: 1.25rem; background: linear-gradient(135deg, #2c2420 0%, #443730 100%); color: #ffffff; border-radius: var(--radius-md); box-shadow: 0 8px 24px rgba(44,36,32,0.18);">
                        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.25rem; flex-wrap: wrap; gap: 1rem;">
                            <div>
                                <div style="display: inline-flex; align-items: center; gap: 0.35rem; background: rgba(232, 195, 158, 0.2); color: #e8c39e; padding: 0.2rem 0.6rem; border-radius: 4px; font-size: 0.76rem; font-weight: 700; margin-bottom: 0.4rem;">
                                    <span class="material-symbols-rounded" style="font-size: 14px;">schedule</span>
                                    Estimasi Tiba: ${etaText}
                                </div>
                                <h3 style="margin: 0; font-size: 1.35rem; font-weight: 800; color: #ffffff; display: flex; align-items: center; gap: 0.5rem;">
                                    <span class="material-symbols-rounded" style="color: #e8c39e; font-size: 24px;">${statusIcon}</span>
                                    ${statusTitle}
                                </h3>
                                <p style="margin: 0.3rem 0 0 0; font-size: 0.88rem; color: rgba(255,255,255,0.8);">
                                    ${statusDesc}
                                </p>
                            </div>

                            <div style="background: rgba(255,255,255,0.1); padding: 0.6rem 1rem; border-radius: var(--radius-sm); text-align: right; border: 1px solid rgba(255,255,255,0.15);">
                                <div style="font-size: 0.72rem; color: rgba(255,255,255,0.7); font-weight: 600;">Total Tagihan</div>
                                <div style="font-size: 1.25rem; font-weight: 800; color: #e8c39e;">${App.formatRupiah(totalAmount)}</div>
                                <div style="font-size: 0.72rem; color: rgba(255,255,255,0.85);">${paymentMethod}</div>
                            </div>
                        </div>

                        <!-- Horizontal Stepper (4 Tahap) -->
                        <div style="position: relative; padding: 0.5rem 0.5rem 0 0.5rem;">
                            <div style="display: flex; justify-content: space-between; align-items: center; position: relative; z-index: 2;">
                                
                                <!-- Step 1: Pesanan Dibuat -->
                                <div style="display: flex; flex-direction: column; align-items: center; text-align: center; width: 25%;">
                                    <div style="width: 36px; height: 36px; border-radius: 50%; background: ${currentStep >= 1 ? '#e8c39e' : 'rgba(255,255,255,0.2)'}; color: ${currentStep >= 1 ? '#2c2420' : '#ffffff'}; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 16px; margin-bottom: 0.35rem; box-shadow: 0 2px 8px rgba(0,0,0,0.2);">
                                        <span class="material-symbols-rounded" style="font-size: 18px;">receipt_long</span>
                                    </div>
                                    <span style="font-size: 0.74rem; font-weight: 700; color: ${currentStep >= 1 ? '#e8c39e' : 'rgba(255,255,255,0.6)'};">Dipesan</span>
                                </div>

                                <!-- Step 2: Dapur Menyiapkan -->
                                <div style="display: flex; flex-direction: column; align-items: center; text-align: center; width: 25%;">
                                    <div style="width: 36px; height: 36px; border-radius: 50%; background: ${currentStep >= 2 ? '#e8c39e' : 'rgba(255,255,255,0.2)'}; color: ${currentStep >= 2 ? '#2c2420' : '#ffffff'}; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 16px; margin-bottom: 0.35rem; box-shadow: 0 2px 8px rgba(0,0,0,0.2);">
                                        <span class="material-symbols-rounded" style="font-size: 18px;">soup_kitchen</span>
                                    </div>
                                    <span style="font-size: 0.74rem; font-weight: 700; color: ${currentStep >= 2 ? '#e8c39e' : 'rgba(255,255,255,0.6)'};">Disiapkan</span>
                                </div>

                                <!-- Step 3: Driver Mengantar -->
                                <div style="display: flex; flex-direction: column; align-items: center; text-align: center; width: 25%;">
                                    <div style="width: 36px; height: 36px; border-radius: 50%; background: ${currentStep >= 3 ? '#e8c39e' : 'rgba(255,255,255,0.2)'}; color: ${currentStep >= 3 ? '#2c2420' : '#ffffff'}; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 16px; margin-bottom: 0.35rem; box-shadow: 0 2px 8px rgba(0,0,0,0.2);">
                                        <span class="material-symbols-rounded" style="font-size: 18px;">two_wheeler</span>
                                    </div>
                                    <span style="font-size: 0.74rem; font-weight: 700; color: ${currentStep >= 3 ? '#e8c39e' : 'rgba(255,255,255,0.6)'};">Diantar</span>
                                </div>

                                <!-- Step 4: Sampai Tujuan -->
                                <div style="display: flex; flex-direction: column; align-items: center; text-align: center; width: 25%;">
                                    <div style="width: 36px; height: 36px; border-radius: 50%; background: ${currentStep >= 4 ? '#e8c39e' : 'rgba(255,255,255,0.2)'}; color: ${currentStep >= 4 ? '#2c2420' : '#ffffff'}; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 16px; margin-bottom: 0.35rem; box-shadow: 0 2px 8px rgba(0,0,0,0.2);">
                                        <span class="material-symbols-rounded" style="font-size: 18px;">home</span>
                                    </div>
                                    <span style="font-size: 0.74rem; font-weight: 700; color: ${currentStep >= 4 ? '#e8c39e' : 'rgba(255,255,255,0.6)'};">Sampai</span>
                                </div>

                            </div>
                            <!-- Background connecting line -->
                            <div style="position: absolute; top: 23px; left: 12%; right: 12%; height: 3px; background: rgba(255,255,255,0.2); z-index: 1;">
                                <div style="height: 100%; width: ${currentStep === 1 ? '0%' : currentStep === 2 ? '35%' : currentStep === 3 ? '70%' : '100%'}; background: #e8c39e; transition: width 0.4s ease;"></div>
                            </div>
                        </div>
                    </div>

                    <!-- 3. Grid Utama: Peta Live OSRM (Kiri) & Driver + Rincian Pesanan (Kanan) -->
                    <div style="display: grid; grid-template-columns: 1fr 380px; gap: 1.25rem; align-items: start;">
                        
                        <!-- PETA LIVE OSRM REAL ROAD DENGAN TRAFFIC ENGINE -->
                        <div class="card" style="padding: 0; overflow: hidden; position: relative; border-radius: var(--radius-md); box-shadow: 0 6px 20px rgba(0,0,0,0.06); background: #e5e3df; min-height: 520px;">
                            
                            <!-- HUD KONDISI LALU LINTAS REAL-TIME (TOP FLOATING CARD) -->
                            <div style="position: absolute; top: 12px; left: 12px; right: 12px; z-index: 500; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem; pointer-events: none;">
                                <div style="background: rgba(255,255,255,0.96); backdrop-filter: blur(10px); padding: 0.55rem 0.9rem; border-radius: var(--radius-sm); border: 1px solid var(--border-subtle); box-shadow: 0 4px 14px rgba(0,0,0,0.12); pointer-events: auto; display: flex; align-items: center; gap: 0.75rem;">
                                    <div style="width: 32px; height: 32px; border-radius: 50%; background: #2c2420; color: #e8c39e; display: flex; align-items: center; justify-content: center;">
                                        <span class="material-symbols-rounded" style="font-size: 18px;">traffic</span>
                                    </div>
                                    <div>
                                        <div style="font-size: 0.72rem; color: var(--text-muted); font-weight: 700; text-transform: uppercase;">Posisi Jalan Terkini</div>
                                        <div id="tracking-hud-street" style="font-weight: 800; font-size: 0.88rem; color: var(--text-heading);">Jl. Braga No. 45</div>
                                    </div>
                                    <div style="border-left: 1px solid var(--border-subtle); padding-left: 0.75rem;">
                                        <div style="font-size: 0.72rem; color: var(--text-muted); font-weight: 700; text-transform: uppercase;">Kondisi Lalu Lintas</div>
                                        <div id="tracking-hud-traffic" style="font-weight: 800; font-size: 0.82rem; color: #059669; display: flex; align-items: center;">
                                            🟢 Rute Lancar (1s/titik)
                                        </div>
                                    </div>
                                </div>

                                <div style="background: rgba(255,255,255,0.96); backdrop-filter: blur(10px); padding: 0.45rem 0.85rem; border-radius: var(--radius-pill); border: 1px solid var(--border-subtle); box-shadow: 0 4px 14px rgba(0,0,0,0.12); pointer-events: auto; display: flex; align-items: center; gap: 0.4rem;">
                                    <span class="material-symbols-rounded" style="font-size: 16px; color: var(--primary);">speed</span>
                                    <span style="font-size: 0.72rem; font-weight: 700; color: var(--text-muted);">Kecepatan:</span>
                                    <span id="tracking-hud-speed" style="font-size: 0.82rem; font-weight: 800; padding: 2px 8px; border-radius: 12px; border: 1px solid #a7f3d0; background: #ecfdf5; color: #059669;">
                                        42 km/h
                                    </span>
                                </div>
                            </div>

                            <!-- MAP CONTAINER -->
                            <div id="tracking-leaflet-map" style="width: 100%; height: 520px; min-height: 480px; z-index: 1; display: block;"></div>
                            
                            <!-- TRAFFIC LEGEND & RUTE INFO -->
                            <div style="position: absolute; bottom: 12px; left: 12px; right: 12px; z-index: 500; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem; pointer-events: none;">
                                <div style="background: rgba(255,255,255,0.95); backdrop-filter: blur(8px); padding: 0.5rem 0.85rem; border-radius: var(--radius-sm); border: 1px solid var(--border-subtle); display: flex; align-items: center; gap: 0.75rem; box-shadow: 0 4px 14px rgba(0,0,0,0.12); pointer-events: auto;">
                                    <div>
                                        <div style="font-size: 0.68rem; color: var(--text-muted); font-weight: 700; text-transform: uppercase;">Asal Resto</div>
                                        <div style="font-weight: 700; font-size: 0.82rem; color: var(--text-heading);">Braga No. 45</div>
                                    </div>
                                    <span class="material-symbols-rounded" style="color: var(--accent); font-size: 16px;">arrow_forward</span>
                                    <div>
                                        <div style="font-size: 0.68rem; color: var(--text-muted); font-weight: 700; text-transform: uppercase;">Tujuan Pengantaran</div>
                                        <div style="font-weight: 700; font-size: 0.82rem; color: var(--text-heading); max-width: 150px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${deliveryAddress}</div>
                                    </div>
                                </div>

                                <div style="background: rgba(255,255,255,0.95); backdrop-filter: blur(8px); padding: 0.45rem 0.75rem; border-radius: var(--radius-sm); border: 1px solid var(--border-subtle); display: flex; align-items: center; gap: 0.6rem; box-shadow: 0 4px 14px rgba(0,0,0,0.12); pointer-events: auto; font-size: 0.74rem; font-weight: 700;">
                                    <div style="display: flex; align-items: center; gap: 4px; color: #059669;">
                                        <span style="width: 12px; height: 4px; background: #10b981; border-radius: 2px; display: inline-block;"></span>
                                        <span>Lancar (1s)</span>
                                    </div>
                                    <div style="display: flex; align-items: center; gap: 4px; color: #d97706;">
                                        <span style="width: 12px; height: 4px; background: #f59e0b; border-radius: 2px; display: inline-block;"></span>
                                        <span>Padat (2-3s)</span>
                                    </div>
                                    <div style="display: flex; align-items: center; gap: 4px; color: #dc2626;">
                                        <span style="width: 12px; height: 4px; background: #ef4444; border-radius: 2px; display: inline-block;"></span>
                                        <span>Macet (3-5s)</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- KOLOM KANAN: Driver Info Card + Rincian Alamat & Menu (ShopeeFood Style) -->
                        <div style="display: flex; flex-direction: column; gap: 1.15rem;">
                            
                            <!-- Driver Info Card -->
                            <div class="card" style="padding: 1.25rem; border: 1px solid var(--border-medium);">
                                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.85rem;">
                                    <span style="font-size: 0.78rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">Driver Pengantar</span>
                                    <span style="font-size: 0.74rem; background: #e8f5e9; color: #2e7d32; font-weight: 700; padding: 2px 8px; border-radius: 4px;">
                                        ● Dedicated Kurir
                                    </span>
                                </div>

                                <div style="display: flex; align-items: center; gap: 0.85rem; margin-bottom: 1rem;">
                                    <div style="width: 48px; height: 48px; border-radius: 50%; background: var(--bg-warm); border: 2px solid var(--primary); display: flex; align-items: center; justify-content: center; color: var(--primary);">
                                        <span class="material-symbols-rounded" style="font-size: 28px;">sports_motorsports</span>
                                    </div>
                                    <div>
                                        <div style="font-weight: 800; font-size: 1rem; color: var(--text-heading);">${driverName}</div>
                                        <div style="font-size: 0.78rem; color: var(--text-muted); display: flex; align-items: center; gap: 0.3rem; margin-top: 2px;">
                                            <span>Honda Vario 160 (D 4589 RR)</span>
                                            <span>•</span>
                                            <span style="color: #f59e0b; font-weight: 700;">★ 4.9</span>
                                        </div>
                                    </div>
                                </div>

                                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem;">
                                    <button type="button" class="btn btn-outline btn-sm" onclick="DriverComm.openChat('${orderId}', { role: 'customer', driverName: '${driverName}' })" style="display: flex; align-items: center; justify-content: center; gap: 0.35rem; font-size: 0.8rem; font-weight: 700;">
                                        <span class="material-symbols-rounded" style="font-size: 16px; color: #25d366;">chat</span>
                                        Chat Driver
                                    </button>
                                    <button type="button" class="btn btn-outline btn-sm" onclick="DriverComm.openCall('${orderId}', { role: 'customer', driverName: '${driverName}' })" style="display: flex; align-items: center; justify-content: center; gap: 0.35rem; font-size: 0.8rem; font-weight: 700;">
                                        <span class="material-symbols-rounded" style="font-size: 16px; color: var(--primary);">call</span>
                                        Telepon
                                    </button>
                                </div>
                            </div>

                            <!-- Status & Jarak Pengantaran Card -->
                            <div class="card" style="padding: 1.15rem; background: var(--bg-surface); border: 1px solid var(--border-subtle);">
                                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; text-align: center;">
                                    <div style="background: var(--bg-warm); padding: 0.6rem; border-radius: var(--radius-sm);">
                                        <div style="font-size: 0.72rem; color: var(--text-muted); font-weight: 600;">Sisa Jarak</div>
                                        <div id="tracking-distance-text" style="font-size: 1.1rem; font-weight: 800; color: var(--primary);">1.85 km</div>
                                    </div>
                                    <div style="background: var(--bg-warm); padding: 0.6rem; border-radius: var(--radius-sm);">
                                        <div style="font-size: 0.72rem; color: var(--text-muted); font-weight: 600;">Estimasi Waktu</div>
                                        <div id="tracking-eta-text" style="font-size: 1.1rem; font-weight: 800; color: var(--accent);">8 Menit</div>
                                    </div>
                                </div>
                                <div style="display: flex; justify-content: space-between; font-size: 0.72rem; color: var(--text-muted); margin-top: 0.6rem; padding-top: 0.5rem; border-top: 1px dashed var(--border-subtle);">
                                    <span>Status Update:</span>
                                    <span id="tracking-last-update" style="font-weight: 600; color: var(--success);">Real-Time Aktif</span>
                                </div>
                            </div>

                            <!-- Alamat Pengantaran Card -->
                            <div class="card" style="padding: 1.25rem;">
                                <div style="display: flex; align-items: center; gap: 0.4rem; font-size: 0.82rem; font-weight: 700; color: var(--text-heading); margin-bottom: 0.6rem;">
                                    <span class="material-symbols-rounded" style="font-size: 18px; color: var(--primary);">location_on</span>
                                    Alamat Pengantaran
                                </div>
                                <div style="font-size: 0.85rem; color: var(--text-body); line-height: 1.45; margin-bottom: 0.5rem;">
                                    ${deliveryAddress}
                                </div>
                                <div style="font-size: 0.78rem; color: var(--text-muted);">
                                    Kontak Penerima: <b>${customerPhone}</b>
                                </div>
                            </div>

                            <!-- Rincian Menu yang Dipesan Card -->
                            <div class="card" style="padding: 1.25rem;">
                                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem; border-bottom: 1px solid var(--border-subtle); padding-bottom: 0.5rem;">
                                    <span style="font-size: 0.82rem; font-weight: 700; color: var(--text-heading);">Menu Dipesan</span>
                                    <span style="font-size: 0.76rem; color: var(--text-muted);">${items.length > 0 ? items.length + ' Item' : 'Rincian'}</span>
                                </div>

                                <div style="max-height: 160px; overflow-y: auto; margin-bottom: 0.75rem;">
                                    ${items.length === 0 ? `
                                        <div style="font-size: 0.82rem; color: var(--text-muted); padding: 0.5rem 0;">
                                            Pesanan Kopi & Pastry Ruang Rasa Braga
                                        </div>
                                    ` : items.map(it => `
                                        <div style="display: flex; justify-content: space-between; font-size: 0.82rem; padding: 0.35rem 0; border-bottom: 1px dashed var(--border-subtle);">
                                            <div>
                                                <b>${it.Quantity}x</b> ${it.MenuName}
                                                ${it.Notes ? `<div style="font-size: 0.72rem; color: var(--accent); font-style: italic;">"${it.Notes}"</div>` : ''}
                                            </div>
                                            <span style="font-weight: 600;">${App.formatRupiah(it.SubtotalPrice || (it.UnitPrice * it.Quantity))}</span>
                                        </div>
                                    `).join('')}
                                </div>

                                <div style="font-size: 0.82rem; display: flex; flex-direction: column; gap: 0.3rem; border-top: 1px solid var(--border-subtle); padding-top: 0.6rem;">
                                    <div style="display: flex; justify-content: space-between; color: var(--text-muted);">
                                        <span>Subtotal Menu</span>
                                        <span>${App.formatRupiah(subtotal)}</span>
                                    </div>
                                    <div style="display: flex; justify-content: space-between; color: var(--text-muted);">
                                        <span>Ongkir Kurir</span>
                                        <span>${App.formatRupiah(deliveryFee)}</span>
                                    </div>
                                    ${discount > 0 ? `
                                        <div style="display: flex; justify-content: space-between; color: var(--success); font-weight: 600;">
                                            <span>Diskon Voucher</span>
                                            <span>-${App.formatRupiah(discount)}</span>
                                        </div>
                                    ` : ''}
                                    <div style="display: flex; justify-content: space-between; font-weight: 800; font-size: 0.95rem; color: var(--text-heading); border-top: 1px dashed var(--border-subtle); padding-top: 0.4rem; margin-top: 0.2rem;">
                                        <span>Total Tagihan</span>
                                        <span style="color: var(--accent);">${App.formatRupiah(totalAmount)}</span>
                                    </div>
                                </div>
                            </div>

                        </div>

                    </div>

                </div>
            </div>
        `;
    },

    initEmbeddedTracking() {
        if (window.TrackingPage) {
            if (this.selectedTrackingOrderNumber) {
                TrackingPage.activeOrderId = this.selectedTrackingOrderNumber;
            }
            TrackingPage.initMap();
        }
    }
};
