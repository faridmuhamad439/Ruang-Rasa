// ==========================================================================
// DASHBOARD COMPONENT (Alur Sistem Café Ruang Rasa Terpadu - 7 Role)
// Mendukung Role: Admin, Owner, Kasir, Dapur, Waiter, Driver, Customer
// Siklus 9 Tahap Pesanan & Laporan Kinerja Staf Lengkap
// ==========================================================================

const DashboardPage = {
    summary: null,
    salesList: [],
    staffList: [],
    user: null,
    activeTab: 'orders',       // 'orders' | 'bestsellers' | 'staff' | 'promos'
    activePeriod: 'today',     // 'today' | 'week' | 'month'
    statusFilter: 'all',       // filter status pesanan
    typeFilter: 'all',         // filter jenis layanan (DineIn/TakeAway/Delivery)
    searchKeyword: '',        // pencarian keyword
    staffSearchKeyword: '',   // filter pencarian staf
    staffRoleFilter: 'all',   // filter peran staf
    staffStatusFilter: 'all', // filter status keaktifan staf
    pollingTimer: null,
    isLoading: false,

    onSearchOrders(kw) {
        this.searchKeyword = kw;
        if (this.orderSearchDebounceTimer) clearTimeout(this.orderSearchDebounceTimer);
        this.orderSearchDebounceTimer = setTimeout(() => {
            const tbody = document.getElementById('dashboard-orders-tbody');
            const countBadge = document.getElementById('dashboard-orders-count-badge');
            if (tbody) {
                const { displayOrders, filteredOrders, isFiltered, role } = this.getFilteredOrdersData();
                if (countBadge) {
                    countBadge.innerHTML = `Menampilkan <b>${displayOrders.length}</b> dari <b>${filteredOrders.length}</b> Pesanan`;
                }
                tbody.innerHTML = this.renderOrdersTableRowsHtml(displayOrders, isFiltered, role);
            } else {
                this.render();
            }
        }, 150);
    },

    onSearchStaff(kw) {
        this.staffSearchKeyword = kw;
        if (this.staffSearchDebounceTimer) clearTimeout(this.staffSearchDebounceTimer);
        this.staffSearchDebounceTimer = setTimeout(() => {
            const tbody = document.getElementById('dashboard-staff-tbody');
            const countBadge = document.getElementById('dashboard-staff-count-badge');
            if (tbody) {
                const { filteredStaff, isFiltered } = this.getFilteredStaffData();
                if (countBadge) {
                    countBadge.innerHTML = `Menampilkan <b>${filteredStaff.length}</b> dari <b>${this.staffList.length}</b> Anggota Staf`;
                }
                tbody.innerHTML = this.renderStaffTableRowsHtml(filteredStaff, isFiltered);
            } else {
                this.render();
            }
        }, 150);
    },

    async init() {
        this.user = Api.getCurrentUser();
        if (!this.user) {
            this.stopPolling();
            window.location.hash = '#/login';
            return;
        }

        // Customer diarahkan ke halaman profil / pesanan
        if ((this.user.role || '').toLowerCase() === 'customer') {
            this.stopPolling();
            window.location.hash = '#/profile';
            return;
        }

        if (this.salesList.length === 0) {
            this.isLoading = true;
        }

        this.render();

        try {
            await Promise.all([
                this.loadSummary(),
                this.loadRecentSales(),
                this.loadStaffList()
            ]);
        } catch (err) {
            console.warn('DashboardPage load data warn:', err);
        } finally {
            this.isLoading = false;
        }

        if (window.location.hash.startsWith('#/dashboard') || window.location.hash.startsWith('#/staff-management')) {
            this.render();
            this.startPolling();
        }
    },

    startPolling() {
        this.stopPolling();
        this.pollingTimer = setInterval(async () => {
            const hash = window.location.hash || '';
            if (!hash.startsWith('#/dashboard') && !hash.startsWith('#/staff-management')) {
                this.stopPolling();
                return;
            }
            try {
                await Promise.all([
                    this.loadSummary(),
                    this.loadRecentSales(),
                    this.loadStaffList()
                ]);
                if (window.location.hash.startsWith('#/dashboard') || window.location.hash.startsWith('#/staff-management')) {
                    this.render();
                }
            } catch (err) {
                console.warn('Dashboard live polling:', err);
            }
        }, 3000); // Sinkronisasi otomatis setiap 3 detik agar pesanan baru dari tamu/pelanggan langsung muncul
    },

    stopPolling() {
        if (this.pollingTimer) {
            clearInterval(this.pollingTimer);
            this.pollingTimer = null;
        }
    },

    async loadSummary() {
        try {
            const res = await Api.get('/dashboard');
            if (res && (res.success || res.Success)) {
                this.summary = res.data || res.Data;
            }
        } catch (err) {
            console.error('Error load summary:', err);
        }
    },

    async loadRecentSales() {
        try {
            const res = await Api.get('/sales');
            if (res && (res.success || res.Success)) {
                this.salesList = res.data || res.Data || [];
            }
        } catch (err) {
            console.error('Error load sales:', err);
        }
    },

    async loadStaffList() {
        try {
            const res = await Api.get('/staff');
            if (res && (res.success || res.Success)) {
                this.staffList = res.data || res.Data || [];
            }
        } catch (err) {
            console.error('Error load staff list:', err);
        }
    },

    async updateOrderStatus(orderId, newStatus) {
        // Optimistic UI update agar perubahan status terasa instan di antrean
        const order = this.salesList.find(o => o.OrderId === orderId);
        if (order) {
            if (newStatus === 'Ready') {
                order.OrderStatus = order.OrderType === 'DineIn' ? 'ReadyToServe' : (order.OrderType === 'TakeAway' ? 'ReadyForPickup' : 'ReadyForDelivery');
            } else {
                order.OrderStatus = newStatus;
            }
            this.render();
        }

        try {
            const res = await Api.put(`/orders/${orderId}/status`, {
                NewStatus: newStatus,
                StaffUserId: this.user.userId || this.user.UserId
            });

            if (res && (res.Success || res.success)) {
                Toast.success(`Status pesanan berhasil diperbarui: "${newStatus}".`);
                await Promise.all([this.loadSummary(), this.loadRecentSales()]);
                this.render();
            } else {
                Toast.error(res?.Message || res?.message || 'Gagal mengubah status pesanan.');
                await this.loadRecentSales();
                this.render();
            }
        } catch (err) {
            Toast.error(err.message || 'Gangguan sistem saat memperbarui status.');
            await this.loadRecentSales();
            this.render();
        }
    },

    async cancelOrderWithReason(orderId, reason) {
        if (!reason || !reason.trim()) {
            Toast.warning('Alasan pembatalan wajib diisi.');
            return;
        }

        const order = this.salesList.find(o => o.OrderId === orderId);
        if (order) {
            order.OrderStatus = 'Cancelled';
            order.CancelReason = reason.trim();
            this.render();
        }

        try {
            const res = await Api.post(`/orders/${orderId}/cancel`, {
                CancelReason: reason.trim(),
                StaffUserId: this.user.userId || this.user.UserId
            });

            if (res && (res.Success || res.success)) {
                Toast.info(`Pesanan #${orderId} telah dibatalkan.`);
                this.closeModal();
                await Promise.all([this.loadSummary(), this.loadRecentSales()]);
                this.render();
            } else {
                Toast.error(res?.Message || 'Gagal membatalkan pesanan.');
                await this.loadRecentSales();
                this.render();
            }
        } catch (err) {
            Toast.error(err.message || 'Gangguan sistem.');
            await this.loadRecentSales();
            this.render();
        }
    },

    async verifyPaymentProof(orderId, approved, reason = '') {
        try {
            const res = await Api.post(`/orders/${orderId}/verify-payment`, {
                Approved: approved,
                Reason: reason,
                StaffUserId: this.user.userId || this.user.UserId
            });

            if (res && (res.Success || res.success)) {
                Toast.success(approved ? 'Bukti pembayaran disetujui, pesanan diteruskan ke Dapur.' : 'Bukti pembayaran ditolak.');
                this.closeModal();
                await Promise.all([this.loadSummary(), this.loadRecentSales()]);
                this.render();
            } else {
                Toast.error(res?.Message || 'Gagal memverifikasi bukti pembayaran.');
            }
        } catch (err) {
            Toast.error(err.message || 'Gangguan sistem.');
        }
    },

    openCancelModal(orderId, orderNumber) {
        this.closeModal();
        const modal = document.createElement('div');
        modal.id = 'dashboard-modal';
        modal.innerHTML = `
            <div class="modal-overlay active" style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(26,20,18,0.7); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 9999; padding: 1rem;">
                <div class="card" style="max-width: 440px; width: 100%; padding: 1.5rem; border-radius: var(--radius-md);">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                        <h3 style="margin: 0; font-size: 1.15rem; color: var(--danger); display: flex; align-items: center; gap: 0.4rem;">
                            <span class="material-symbols-rounded">cancel</span>
                            Batalkan Pesanan #${orderNumber}
                        </h3>
                        <button type="button" class="btn btn-outline btn-sm" style="border: none;" onclick="DashboardPage.closeModal()"><span class="material-symbols-rounded" style="font-size:18px;">close</span></button>
                    </div>
                    <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 1rem;">
                        Silakan pilih atau ketik alasan pembatalan pesanan ini:
                    </p>
                    <div style="display: flex; flex-wrap: wrap; gap: 0.4rem; margin-bottom: 0.85rem;">
                        <button type="button" class="btn btn-outline btn-sm" style="font-size: 0.75rem;" onclick="document.getElementById('cancel-reason-input').value = 'Bahan / Stok Dapur Habis'">Stok Habis</button>
                        <button type="button" class="btn btn-outline btn-sm" style="font-size: 0.75rem;" onclick="document.getElementById('cancel-reason-input').value = 'Bukti Pembayaran Tidak Valid / Palsu'">Bukti Tidak Valid</button>
                        <button type="button" class="btn btn-outline btn-sm" style="font-size: 0.75rem;" onclick="document.getElementById('cancel-reason-input').value = 'Alamat Pengantaran Tidak Ditemukan / Diluar Jangkauan'">Gagal Antar / Alamat</button>
                        <button type="button" class="btn btn-outline btn-sm" style="font-size: 0.75rem;" onclick="document.getElementById('cancel-reason-input').value = 'Dibatalkan atas Permintaan Pelanggan'">Permintaan Pelanggan</button>
                    </div>
                    <textarea id="cancel-reason-input" class="form-control" rows="3" placeholder="Ketik alasan pembatalan..."></textarea>
                    <div style="display: flex; justify-content: flex-end; gap: 0.6rem; margin-top: 1.25rem;">
                        <button type="button" class="btn btn-outline btn-sm" onclick="DashboardPage.closeModal()">Batal</button>
                        <button type="button" class="btn btn-danger btn-sm" onclick="DashboardPage.cancelOrderWithReason(${orderId}, document.getElementById('cancel-reason-input').value)">
                            Konfirmasi Pembatalan
                        </button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    },

    openPaymentProofModal(orderId, orderNumber, proofUrl) {
        this.closeModal();
        const modal = document.createElement('div');
        modal.id = 'dashboard-modal';
        modal.innerHTML = `
            <div class="modal-overlay active" style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(26,20,18,0.7); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 9999; padding: 1rem;">
                <div class="card" style="max-width: 500px; width: 100%; padding: 1.5rem; border-radius: var(--radius-md); text-align: center;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                        <h3 style="margin: 0; font-size: 1.15rem; color: var(--text-heading); display: flex; align-items: center; gap: 0.4rem;">
                            <span class="material-symbols-rounded" style="color: var(--primary);">receipt_long</span>
                            Bukti Pembayaran #${orderNumber}
                        </h3>
                        <button type="button" class="btn btn-outline btn-sm" style="border: none;" onclick="DashboardPage.closeModal()"><span class="material-symbols-rounded" style="font-size:18px;">close</span></button>
                    </div>
                    
                    <div style="margin-bottom: 1.25rem; max-height: 350px; overflow-y: auto; background: var(--bg-warm); padding: 1rem; border-radius: var(--radius-sm); border: 1px solid var(--border-subtle);">
                        ${proofUrl ? `
                            <img src="${proofUrl}" alt="Bukti Pembayaran #${orderNumber}" style="max-width: 100%; border-radius: var(--radius-sm); box-shadow: 0 4px 12px rgba(0,0,0,0.1); margin-bottom: 0.5rem;" onerror="this.onerror=null; this.src='https://placehold.co/400x300?text=Bukti+Transfer+Pelanggan';">
                            <div style="font-size: 0.78rem; word-break: break-all; color: var(--text-muted);">${proofUrl}</div>
                        ` : `
                            <div style="padding: 2rem; color: var(--text-muted);">
                                <span class="material-symbols-rounded" style="font-size: 48px; color: var(--accent);">image_not_supported</span>
                                <p style="margin-top: 0.5rem;">Tidak ada file bukti transfer yang dilampirkan.</p>
                            </div>
                        `}
                    </div>

                    <div style="display: flex; justify-content: space-between; gap: 0.6rem;">
                        <button type="button" class="btn btn-danger btn-sm" onclick="DashboardPage.openCancelModal(${orderId}, '${orderNumber}')">
                            <span class="material-symbols-rounded" style="font-size: 16px;">close</span>
                            Tolak Bukti (Batalkan)
                        </button>
                        <button type="button" class="btn btn-primary btn-sm" onclick="DashboardPage.verifyPaymentProof(${orderId}, true)">
                            <span class="material-symbols-rounded" style="font-size: 16px;">verified</span>
                            Setujui & Teruskan ke Dapur
                        </button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    },

    openOrderItemsModal(order) {
        this.closeModal();
        const items = order.Items || [];
        const modal = document.createElement('div');
        modal.id = 'dashboard-modal';
        modal.innerHTML = `
            <div class="modal-overlay active" style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(26,20,18,0.7); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 9999; padding: 1rem;">
                <div class="card" style="max-width: 520px; width: 100%; padding: 1.5rem; border-radius: var(--radius-md);">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; border-bottom: 1px solid var(--border-subtle); padding-bottom: 0.75rem;">
                        <div>
                            <h3 style="margin: 0; font-size: 1.15rem; color: var(--text-heading);">
                                Detail Menu Pesanan #${order.OrderNumber}
                            </h3>
                            <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 0.2rem;">
                                Pelanggan: <b>${(order.GuestName && order.GuestName.trim()) || (order.Notes && order.Notes.match(/\[Nama Pemesan:\s*([^\]]+)\]/) ? order.Notes.match(/\[Nama Pemesan:\s*([^\]]+)\]/)[1] : '') || (order.CustomerName && order.CustomerName !== 'Super Admin Ruang Rasa' ? order.CustomerName : (order.CustomerId === 1 ? 'Tamu / Guest' : (order.CustomerName || 'Tamu / Guest')))}</b> • ${order.OrderType} ${order.TableNumber !== '-' ? `(Meja ${order.TableNumber})` : ''}
                            </div>
                        </div>
                        <button type="button" class="btn btn-outline btn-sm" style="border: none;" onclick="DashboardPage.closeModal()"><span class="material-symbols-rounded" style="font-size:18px;">close</span></button>
                    </div>

                    ${order.Notes ? `
                        <div style="background: #fff8e1; border: 1px solid #ffe082; padding: 0.65rem 0.85rem; border-radius: var(--radius-sm); margin-bottom: 1rem; font-size: 0.82rem; color: #5d4037;">
                            <b>Catatan Pelanggan:</b> "${order.Notes}"
                        </div>
                    ` : ''}

                    ${order.DeliveryAddress ? `
                        <div style="background: var(--bg-warm); padding: 0.65rem 0.85rem; border-radius: var(--radius-sm); margin-bottom: 1rem; font-size: 0.82rem;">
                            <b>Alamat Antar:</b> ${order.DeliveryAddress}<br>
                            <b>Kontak:</b> ${order.DeliveryContactPhone || '-'}
                        </div>
                    ` : ''}

                    <div style="max-height: 250px; overflow-y: auto; margin-bottom: 1rem;">
                        <table style="width: 100%; font-size: 0.88rem; border-collapse: collapse;">
                            <thead>
                                <tr style="border-bottom: 1px solid var(--border-medium); text-align: left;">
                                    <th style="padding: 0.4rem 0;">Menu</th>
                                    <th style="padding: 0.4rem 0; text-align: center;">Qty</th>
                                    <th style="padding: 0.4rem 0; text-align: right;">Subtotal</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${items.length === 0 ? `
                                    <tr><td colspan="3" style="text-align: center; padding: 1rem; color: var(--text-muted);">Tidak ada rincian item.</td></tr>
                                ` : items.map(i => `
                                    <tr style="border-bottom: 1px dashed var(--border-subtle);">
                                        <td style="padding: 0.5rem 0;">
                                            <b>${i.MenuName}</b>
                                            ${i.Notes ? `<div style="font-size: 0.75rem; color: var(--accent); font-style: italic;">"${i.Notes}"</div>` : ''}
                                        </td>
                                        <td style="padding: 0.5rem 0; text-align: center;">${i.Quantity}x</td>
                                        <td style="padding: 0.5rem 0; text-align: right; font-weight: 600;">${App.formatRupiah(i.Subtotal)}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>

                    <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--border-subtle); padding-top: 0.75rem;">
                        <span style="font-weight: 700;">Total:</span>
                        <span style="font-size: 1.15rem; font-weight: 800; color: var(--accent);">${App.formatRupiah(order.TotalAmount)}</span>
                    </div>

                    <div style="margin-top: 1rem; text-align: right;">
                        <button type="button" class="btn btn-outline btn-sm" onclick="DashboardPage.closeModal()">Tutup</button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    },

    closeModal() {
        const m = document.getElementById('dashboard-modal');
        if (m) m.remove();
    },

    render() {
        const root = document.getElementById('page-root');
        if (!root) return;
        if (!window.location.hash.startsWith('#/dashboard')) {
            this.stopPolling();
            return;
        }

        const u = this.user || { fullName: 'Pengguna', role: 'Staff' };
        const role = (u.role || '').toLowerCase();
        const s = this.summary || {
            TotalOmsetHariIni: 0,
            TotalOmsetMingguIni: 0,
            TotalOmsetBulanIni: 0,
            TotalPesananHariIni: 0,
            TotalPesananSelesai: 0,
            TotalMejaTersedia: 0,
            TotalMejaTerpakai: 0,
            TotalPelangganAktif: 0,
            TotalMenuTersedia: 0,
            TotalPromoAktif: 0,
            BestSellers: [],
            StaffPerformance: [],
            PromoUsage: []
        };

        // Filter daftar pesanan sesuai role spesifik
        let filteredOrders = this.salesList;
        if (role === 'kasir') {
            // Kasir melihat seluruh transaksi aktif & riwayat hari ini
            filteredOrders = this.salesList;
        } else if (role === 'dapur') {
            // Dapur melihat pesanan yang perlu diracik dan yang sedang dalam proses persiapan
            filteredOrders = this.salesList.filter(o => 
                ['Confirmed', 'WaitingConfirmation', 'Processing', 'Cooking', 'Ready', 'ReadyToServe', 'ReadyForPickup', 'ReadyForDelivery', 'PendingPayment'].includes(o.OrderStatus)
            );
        } else if (role === 'waiter') {
            // Waiter melihat pesanan Dine-In untuk disajikan ke meja dan Take-Away di counter
            filteredOrders = this.salesList.filter(o => 
                (o.OrderType === 'DineIn' && ['ReadyToServe', 'Ready', 'Cooking', 'Confirmed', 'Completed'].includes(o.OrderStatus)) ||
                (o.OrderType === 'TakeAway' && ['ReadyForPickup', 'Ready', 'Completed'].includes(o.OrderStatus))
            );
        } else if (role === 'driver') {
            // Driver melihat pesanan Delivery untuk diklaim & diantar
            filteredOrders = this.salesList.filter(o => 
                o.OrderType === 'Delivery' && ['ReadyForDelivery', 'Ready', 'Delivering', 'Delivered', 'Completed'].includes(o.OrderStatus)
            );
        }

        root.innerHTML = `
            <div class="container">
                <!-- Header Dashboard -->
                <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 2rem; flex-wrap: wrap; gap: 1rem; border-bottom: 1px solid var(--border-subtle); padding-bottom: 1.25rem;">
                    <div>
                        <div style="display: flex; align-items: center; gap: 0.6rem; margin-bottom: 0.25rem;">
                            <h1 style="font-size: 2rem; margin: 0;">Dashboard ${u.role}</h1>
                            <span class="role-badge ${role}">${u.role}</span>
                        </div>
                        <p style="color: var(--text-muted); font-size: 0.92rem; margin-top: 0.25rem;">
                            Halo <b>${u.fullName}</b>, selamat bertugas di Café Ruang Rasa Braga. Berikut data operasional terpadu.
                        </p>
                    </div>
                    <div style="display: flex; gap: 0.6rem; flex-wrap: wrap;">
                        <button class="btn btn-outline btn-sm" onclick="DashboardPage.init()">
                            <span class="material-symbols-rounded" style="font-size: 16px;">refresh</span>
                            Segarkan Data
                        </button>
                        ${role === 'admin' || role === 'owner' ? `
                            <button type="button" class="btn ${this.activeTab === 'staff' ? 'btn-primary' : 'btn-outline'} btn-sm" onclick="DashboardPage.activeTab = 'staff'; DashboardPage.render();">
                                <span class="material-symbols-rounded" style="font-size: 16px;">badge</span>
                                Direktori Staf (${this.staffList.length})
                            </button>
                            <button type="button" class="btn btn-outline btn-sm" onclick="DashboardPage.openAddStaffModal()">
                                <span class="material-symbols-rounded" style="font-size: 16px;">person_add</span>
                                Tambah Akun Staf
                            </button>
                        ` : ''}
                        ${role === 'kasir' || role === 'admin' || role === 'owner' || role === 'waiter' ? `
                            <a href="#/table-management" class="btn btn-primary btn-sm">
                                <span class="material-symbols-rounded" style="font-size: 16px;">table_restaurant</span>
                                Denah & Status Meja
                            </a>
                        ` : ''}
                    </div>
                </div>

                <!-- 1. KPI Summary Cards -->
                <div class="dashboard-kpi-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(210px, 1fr)); gap: 1.15rem; margin-bottom: 2rem;">
                    ${role === 'owner' || role === 'admin' || role === 'kasir' ? `
                        <div class="card card-hover-lift animate-fade-in-up animate-stagger-1" style="display: flex; align-items: center; gap: 1rem;">
                            <div class="pillar-icon-box" style="background: var(--accent-soft); color: var(--accent);">
                                <span class="material-symbols-rounded">payments</span>
                            </div>
                            <div>
                                <div style="font-size: 0.8rem; color: var(--text-muted); font-weight: 500;">Omset Hari Ini</div>
                                <div style="font-size: 1.25rem; font-weight: 800; color: var(--text-heading);">${App.formatRupiah(s.TotalOmsetHariIni)}</div>
                            </div>
                        </div>

                        <div class="card card-hover-lift animate-fade-in-up animate-stagger-2" style="display: flex; align-items: center; gap: 1rem;">
                            <div class="pillar-icon-box" style="background: var(--info-bg); color: var(--info);">
                                <span class="material-symbols-rounded">trending_up</span>
                            </div>
                            <div>
                                <div style="font-size: 0.8rem; color: var(--text-muted); font-weight: 500;">Omset Minggu Ini</div>
                                <div style="font-size: 1.25rem; font-weight: 800; color: var(--text-heading);">${App.formatRupiah(s.TotalOmsetMingguIni || s.TotalOmsetHariIni)}</div>
                            </div>
                        </div>
                    ` : ''}

                    <div class="card card-hover-lift animate-fade-in-up animate-stagger-3" style="display: flex; align-items: center; gap: 1rem;">
                        <div class="pillar-icon-box" style="background: var(--success-bg); color: var(--success);">
                            <span class="material-symbols-rounded">receipt_long</span>
                        </div>
                        <div>
                            <div style="font-size: 0.8rem; color: var(--text-muted); font-weight: 500;">Pesanan Hari Ini</div>
                            <div style="font-size: 1.25rem; font-weight: 800; color: var(--text-heading);">${s.TotalPesananHariIni} Transaksi</div>
                        </div>
                    </div>

                    <div class="card card-hover-lift animate-fade-in-up animate-stagger-4" style="display: flex; align-items: center; justify-content: space-between; gap: 1rem; cursor: pointer;" onclick="window.location.hash='#/table-management'">
                        <div style="display: flex; align-items: center; gap: 1rem;">
                            <div class="pillar-icon-box" style="background: var(--bg-warm); color: var(--primary);">
                                <span class="material-symbols-rounded">table_restaurant</span>
                            </div>
                            <div>
                                <div style="font-size: 0.8rem; color: var(--text-muted); font-weight: 500;">Meja Tersedia</div>
                                <div style="font-size: 1.25rem; font-weight: 800; color: var(--text-heading);">${s.TotalMejaTersedia} Meja</div>
                            </div>
                        </div>
                        <span class="material-symbols-rounded" style="color: var(--primary); font-size: 18px;">arrow_forward</span>
                    </div>

                    ${role === 'owner' || role === 'admin' ? `
                        <div class="card card-hover-lift animate-fade-in-up" style="display: flex; align-items: center; justify-content: space-between; gap: 1rem; cursor: pointer;" onclick="DashboardPage.activeTab = 'staff'; DashboardPage.render();">
                            <div style="display: flex; align-items: center; gap: 1rem;">
                                <div class="pillar-icon-box" style="background: #e8f5e9; color: #2e7d32;">
                                    <span class="material-symbols-rounded">groups</span>
                                </div>
                                <div>
                                    <div style="font-size: 0.8rem; color: var(--text-muted); font-weight: 500;">Tim Staf Operasional</div>
                                    <div style="font-size: 1.25rem; font-weight: 800; color: var(--text-heading);">${this.staffList.length} Petugas</div>
                                </div>
                            </div>
                            <span class="material-symbols-rounded" style="color: #2e7d32; font-size: 18px;">arrow_forward</span>
                        </div>

                        <div class="card card-hover-lift animate-fade-in-up" style="display: flex; align-items: center; justify-content: space-between; gap: 1rem; cursor: pointer;" onclick="window.location.hash='#/promo-crud'">
                            <div style="display: flex; align-items: center; gap: 1rem;">
                                <div class="pillar-icon-box" style="background: #fdf3e7; color: var(--accent);">
                                    <span class="material-symbols-rounded">local_activity</span>
                                </div>
                                <div>
                                    <div style="font-size: 0.8rem; color: var(--text-muted); font-weight: 500;">Voucher Promo</div>
                                    <div style="font-size: 1.25rem; font-weight: 800; color: var(--text-heading);">${s.TotalPromoAktif || 4} Aktif</div>
                                </div>
                            </div>
                            <span class="material-symbols-rounded" style="color: var(--accent); font-size: 18px;">arrow_forward</span>
                        </div>
                    ` : ''}
                </div>

                <!-- Navigasi Tab Owner & Admin -->
                ${role === 'owner' || role === 'admin' ? `
                    <div class="dashboard-tabbar" style="display: flex; gap: 0.5rem; margin-bottom: 1.5rem; border-bottom: 1px solid var(--border-subtle); padding-bottom: 0.75rem; flex-wrap: wrap;">
                        <button class="btn ${this.activeTab === 'orders' ? 'btn-primary' : 'btn-outline'} btn-sm" onclick="DashboardPage.activeTab = 'orders'; DashboardPage.render();">
                            <span class="material-symbols-rounded" style="font-size: 16px;">receipt_long</span>
                            Antrean Pesanan Real-time
                        </button>
                        <button class="btn ${this.activeTab === 'bestsellers' ? 'btn-primary' : 'btn-outline'} btn-sm" onclick="DashboardPage.activeTab = 'bestsellers'; DashboardPage.render();">
                            <span class="material-symbols-rounded" style="font-size: 16px;">star</span>
                            Top 5 Best Seller
                        </button>
                        <button class="btn ${this.activeTab === 'staff' ? 'btn-primary' : 'btn-outline'} btn-sm" onclick="DashboardPage.activeTab = 'staff'; DashboardPage.render();">
                            <span class="material-symbols-rounded" style="font-size: 16px;">badge</span>
                            Direktori & Kinerja Staf (${this.staffList.length})
                        </button>
                        <button class="btn ${this.activeTab === 'promos' ? 'btn-primary' : 'btn-outline'} btn-sm" onclick="DashboardPage.activeTab = 'promos'; DashboardPage.render();">
                            <span class="material-symbols-rounded" style="font-size: 16px;">percent</span>
                            Laporan Voucher Promo
                        </button>
                    </div>
                ` : ''}

                <!-- TAB CONTENT -->
                ${this.activeTab === 'bestsellers' && (role === 'owner' || role === 'admin') ? this.renderBestSellersTab(s.BestSellers || []) :
                  this.activeTab === 'staff' && (role === 'owner' || role === 'admin') ? this.renderStaffTab() :
                  this.activeTab === 'promos' && (role === 'owner' || role === 'admin') ? this.renderPromosTab(s.PromoUsage || []) :
                  this.renderOrdersTab(filteredOrders, role)}

            </div>
        `;
    },

    getFilteredOrdersData() {
        const role = (this.user?.role || '').toLowerCase();
        let list = this.salesList || [];
        if (role === 'kasir') {
            list = list.filter(o => ['PendingPayment', 'WaitingConfirmation', 'Confirmed', 'Processing', 'Cooking', 'Ready', 'ReadyToServe', 'ReadyForPickup', 'ReadyForDelivery', 'Delivering', 'Delivered', 'Completed', 'Cancelled'].includes(o.OrderStatus));
        } else if (role === 'dapur') {
            list = list.filter(o => ['Confirmed', 'Cooking', 'Ready', 'ReadyToServe', 'ReadyForPickup', 'ReadyForDelivery'].includes(o.OrderStatus));
        } else if (role === 'waiter') {
            list = list.filter(o => o.OrderType === 'DineIn' || ['ReadyToServe', 'ReadyForPickup', 'Completed'].includes(o.OrderStatus));
        } else if (role === 'driver') {
            list = list.filter(o => o.OrderType === 'Delivery');
        }

        const filteredOrders = list;
        let displayOrders = filteredOrders;
        if (this.statusFilter && this.statusFilter !== 'all') {
            displayOrders = displayOrders.filter(o => o.OrderStatus === this.statusFilter);
        }
        if (this.typeFilter && this.typeFilter !== 'all') {
            displayOrders = displayOrders.filter(o => o.OrderType === this.typeFilter);
        }
        if (this.searchKeyword) {
            const q = this.searchKeyword.toLowerCase();
            displayOrders = displayOrders.filter(o => 
                (o.OrderNumber && o.OrderNumber.toLowerCase().includes(q)) ||
                (o.CustomerName && o.CustomerName.toLowerCase().includes(q)) ||
                (o.GuestName && o.GuestName.toLowerCase().includes(q)) ||
                (o.TableNumber && o.TableNumber.toString().toLowerCase().includes(q))
            );
        }
        const isFiltered = (this.statusFilter !== 'all' || this.typeFilter !== 'all' || !!this.searchKeyword);
        return { displayOrders, filteredOrders, isFiltered, role };
    },

    renderOrdersTableRowsHtml(displayOrders, isFiltered, role) {
        if (displayOrders.length === 0) {
            return `
                <tr>
                    <td colspan="8" style="text-align: center; padding: 3rem; color: var(--text-muted);">
                        <span class="material-symbols-rounded" style="font-size: 36px; display: block; margin-bottom: 0.5rem; opacity: 0.5;">search_off</span>
                        ${isFiltered ? 'Tidak ada pesanan yang sesuai dengan filter pencarian.' : 'Belum ada antrean pesanan pada kategori peran Anda saat ini.'}
                    </td>
                </tr>
            `;
        }
        return displayOrders.map(o => `
            <tr>
                <td>
                    <b style="cursor: pointer; color: var(--primary);" onclick='DashboardPage.openOrderItemsModal(${JSON.stringify(o).replace(/'/g, "&apos;")})'>
                        #${o.OrderNumber}
                    </b>
                    <div style="font-size: 0.72rem; color: var(--accent); cursor: pointer;" onclick='DashboardPage.openOrderItemsModal(${JSON.stringify(o).replace(/'/g, "&apos;")})'>
                        Lihat Menu (${(o.Items || []).length})
                    </div>
                </td>
                <td>
                    <div style="font-weight: 600;">${(o.GuestName && o.GuestName.trim()) || (o.Notes && o.Notes.match(/\[Nama Pemesan:\s*([^\]]+)\]/) ? o.Notes.match(/\[Nama Pemesan:\s*([^\]]+)\]/)[1] : '') || (o.CustomerName && o.CustomerName !== 'Super Admin Ruang Rasa' ? o.CustomerName : (o.CustomerId === 1 ? 'Tamu / Guest' : (o.CustomerName || 'Tamu / Guest')))}</div>
                    ${o.PaymentProofUrl ? `
                        <span style="display: inline-flex; align-items: center; gap: 0.2rem; font-size: 0.72rem; color: var(--info); cursor: pointer; text-decoration: underline;" onclick="DashboardPage.openPaymentProofModal(${o.OrderId}, '${o.OrderNumber}', '${o.PaymentProofUrl}')">
                            <span class="material-symbols-rounded" style="font-size: 13px;">attach_file</span> Bukti Ada
                        </span>
                    ` : ''}
                </td>
                <td>
                    <span style="font-weight: 600;">${o.OrderType}</span>
                    ${o.TableNumber && o.TableNumber !== '-' ? `
                        <div style="background: #e8f5e9; color: #2e7d32; font-weight: 700; font-size: 0.76rem; padding: 2px 6px; border-radius: 4px; display: inline-block; margin-top: 2px;">
                            <span class="material-symbols-rounded" style="font-size:14px; vertical-align:middle;">location_on</span> Meja ${o.TableNumber}
                        </div>
                    ` : ''}
                </td>
                <td style="font-weight: 700; color: var(--text-heading);">${App.formatRupiah(o.TotalAmount)}</td>
                <td style="font-size: 0.85rem;">${o.PaymentMethod}</td>
                <td>
                    <span class="status-pill ${o.OrderStatus.toLowerCase()}">${this.formatStatusLabel(o.OrderStatus)}</span>
                    ${o.CancelReason ? `
                        <div style="font-size: 0.72rem; color: var(--danger); margin-top: 2px;">"${o.CancelReason}"</div>
                    ` : ''}
                </td>
                <td style="font-size: 0.8rem; color: var(--text-muted);">
                    ${new Date(o.OrderDate).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                </td>
                <td style="text-align: right;">
                    ${this.renderActions(o, role)}
                </td>
            </tr>
        `).join('');
    },

    renderOrdersTab(filteredOrders, role) {
        const { displayOrders, isFiltered } = this.getFilteredOrdersData();

        return `
            <div class="card">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem; flex-wrap: wrap; gap: 0.5rem;">
                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                        <span class="material-symbols-rounded" style="color: var(--primary);">table_view</span>
                        <h3 style="font-size: 1.15rem; font-family: 'Playfair Display', serif; margin: 0;">
                            ${role === 'waiter' ? 'Antrean Penyajian Meja & Serah Ambil' : 
                              role === 'dapur' ? 'Antrean Pesanan Dapur & Barista' : 
                              role === 'kasir' ? 'Antrean Kasir & Pembayaran' : 
                              role === 'driver' ? 'Antrean Pengantaran Kurir Ruang Rasa' : 
                              'Seluruh Transaksi & Pesanan'}
                        </h3>
                    </div>
                    <span id="dashboard-orders-count-badge" style="font-size: 0.84rem; color: var(--text-muted); font-weight: 600;">
                        Menampilkan <b>${displayOrders.length}</b> dari <b>${filteredOrders.length}</b> Pesanan
                    </span>
                </div>

                <!-- Toolbar Filter Antrean Pesanan Interaktif (Poin 6 PDF) -->
                <div class="filter-toolbar" style="margin-bottom: 1.25rem;">
                    <div class="search-field" style="flex: 1; min-width: 240px;">
                        <span class="material-symbols-rounded search-icon">search</span>
                        <input type="text" id="dashboard-orders-search-input" placeholder="Cari no. pesanan, pelanggan, meja..." 
                               value="${this.searchKeyword}" 
                               oninput="DashboardPage.onSearchOrders(this.value)" />
                    </div>

                    <div style="display: flex; gap: 0.5rem; align-items: center; flex-wrap: wrap;">
                        <select class="filter-select" onchange="DashboardPage.statusFilter = this.value; DashboardPage.render();">
                            <option value="all" ${this.statusFilter === 'all' ? 'selected' : ''}>Semua Status (${filteredOrders.length})</option>
                            <option value="PendingPayment" ${this.statusFilter === 'PendingPayment' ? 'selected' : ''}>● Menunggu Bayar</option>
                            <option value="Confirmed" ${this.statusFilter === 'Confirmed' ? 'selected' : ''}>● Dikonfirmasi Kasir</option>
                            <option value="Cooking" ${this.statusFilter === 'Cooking' ? 'selected' : ''}>● Sedang Dimasak</option>
                            <option value="Ready" ${this.statusFilter === 'Ready' ? 'selected' : ''}>● Pesanan Siap</option>
                            <option value="ReadyToServe" ${this.statusFilter === 'ReadyToServe' ? 'selected' : ''}>● Siap Antar ke Meja</option>
                            <option value="ReadyForPickup" ${this.statusFilter === 'ReadyForPickup' ? 'selected' : ''}>● Siap Diambil Counter</option>
                            <option value="ReadyForDelivery" ${this.statusFilter === 'ReadyForDelivery' ? 'selected' : ''}>● Siap Kirim Kurir</option>
                            <option value="Delivering" ${this.statusFilter === 'Delivering' ? 'selected' : ''}>● Dalam Perjalanan</option>
                            <option value="Delivered" ${this.statusFilter === 'Delivered' ? 'selected' : ''}>● Terkirim</option>
                            <option value="Completed" ${this.statusFilter === 'Completed' ? 'selected' : ''}>● Selesai</option>
                            <option value="Cancelled" ${this.statusFilter === 'Cancelled' ? 'selected' : ''}>● Dibatalkan</option>
                        </select>

                        <select class="filter-select" onchange="DashboardPage.typeFilter = this.value; DashboardPage.render();">
                            <option value="all" ${this.typeFilter === 'all' ? 'selected' : ''}>Semua Layanan</option>
                            <option value="DineIn" ${this.typeFilter === 'DineIn' ? 'selected' : ''}>Dine-In (Meja)</option>
                            <option value="TakeAway" ${this.typeFilter === 'TakeAway' ? 'selected' : ''}>Take-Away (Bawa Pulang)</option>
                            <option value="Delivery" ${this.typeFilter === 'Delivery' ? 'selected' : ''}>Delivery (Antar Kurir)</option>
                        </select>

                        ${isFiltered ? `
                            <button type="button" class="btn btn-outline btn-sm" onclick="DashboardPage.statusFilter = 'all'; DashboardPage.typeFilter = 'all'; DashboardPage.searchKeyword = ''; DashboardPage.render();" title="Reset Filter">
                                <span class="material-symbols-rounded" style="font-size: 16px;">close</span>
                                Reset
                            </button>
                        ` : ''}
                    </div>
                </div>

                <div class="data-table-wrap">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Order</th>
                                <th>Pelanggan</th>
                                <th>Layanan & Meja</th>
                                <th>Total Tagihan</th>
                                <th>Metode Bayar</th>
                                <th>Status Pesanan</th>
                                <th>Waktu</th>
                                <th style="text-align: right;">Aksi Tindakan Petugas</th>
                            </tr>
                        </thead>
                        <tbody id="dashboard-orders-tbody">
                            ${this.renderOrdersTableRowsHtml(displayOrders, isFiltered, role)}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    },

    formatStatusLabel(status) {
        switch (status) {
            case 'PendingPayment': return 'Menunggu Pembayaran';
            case 'WaitingConfirmation': return 'Dikonfirmasi Kasir';
            case 'Confirmed': return 'Dikonfirmasi Kasir';
            case 'Processing': return 'Diproses Dapur';
            case 'Cooking': return 'Sedang Dimasak';
            case 'Ready': return 'Pesanan Siap';
            case 'ReadyToServe': return 'Siap Antar ke Meja';
            case 'ReadyForPickup': return 'Siap Diambil';
            case 'ReadyForDelivery': return 'Siap Dikirim';
            case 'Delivering': return 'Dalam Perjalanan';
            case 'Delivered': return 'Terkirim';
            case 'Completed': return 'Selesai';
            case 'Cancelled': return 'Dibatalkan';
            default: return status;
        }
    },

    renderActions(order, role) {
        const r = (role || '').toLowerCase();
        const st = order.OrderStatus;

        // 1. Role WAITER: Layani Dine-In ke Meja & Take-Away di Counter
        if (r === 'waiter') {
            if (order.OrderType === 'DineIn' && (st === 'ReadyToServe' || st === 'Ready')) {
                return `
                    <button class="btn btn-success btn-sm" style="font-weight: 700;" onclick="DashboardPage.updateOrderStatus(${order.OrderId}, 'Completed')">
                        <span class="material-symbols-rounded" style="font-size: 16px;">restaurant</span>
                        Disajikan ke Meja (Selesai)
                    </button>
                `;
            } else if (order.OrderType === 'TakeAway' && (st === 'ReadyForPickup' || st === 'Ready')) {
                return `
                    <button class="btn btn-secondary btn-sm" style="font-weight: 700;" onclick="DashboardPage.updateOrderStatus(${order.OrderId}, 'Completed')">
                        <span class="material-symbols-rounded" style="font-size: 16px;">shopping_bag</span>
                        Serahkan ke Customer (Selesai)
                    </button>
                `;
            } else if (st === 'Cooking' || st === 'Processing') {
                return `<span style="color: var(--accent); font-size: 0.78rem; font-weight: 600; display:inline-flex; align-items:center; gap:0.2rem;"><span class="material-symbols-rounded" style="font-size:16px;">microwave</span> Sedang Dimasak</span>`;
            } else if (st === 'Completed') {
                return `<span style="color: var(--success); font-size: 0.78rem; font-weight: 600; display:inline-flex; align-items:center; gap:0.2rem;"><span class="material-symbols-rounded" style="font-size:16px;">check_circle</span> Disajikan</span>`;
            }
        }

        // 2. Role KASIR: Konfirmasi Pembayaran, Cek Bukti Transfer, Batal jika Palsu/Gagal, Serah Ambil TakeAway
        if (r === 'kasir') {
            if (st === 'PendingPayment') {
                return `
                    <div style="display: inline-flex; gap: 0.35rem; align-items: center;">
                        ${order.PaymentProofUrl ? `
                            <button class="btn btn-outline btn-sm" onclick="DashboardPage.openPaymentProofModal(${order.OrderId}, '${order.OrderNumber}', '${order.PaymentProofUrl}')" title="Periksa Bukti Bayar">
                                <span class="material-symbols-rounded" style="font-size: 16px;">image</span> Cek Bukti
                            </button>
                        ` : ''}
                        <button class="btn btn-primary btn-sm" onclick="DashboardPage.updateOrderStatus(${order.OrderId}, 'Confirmed')">
                            <span class="material-symbols-rounded" style="font-size: 16px;">paid</span> Konfirmasi Bayar
                        </button>
                        <button class="btn btn-outline btn-sm" style="color: var(--danger); border-color: transparent;" onclick="DashboardPage.openCancelModal(${order.OrderId}, '${order.OrderNumber}')" title="Batalkan Pesanan">
                            <span class="material-symbols-rounded" style="font-size: 16px;">cancel</span>
                        </button>
                    </div>
                `;
            } else if (st === 'Confirmed' || st === 'WaitingConfirmation') {
                return `<span style="color: var(--primary); font-size: 0.78rem; font-weight: 700; display:inline-flex; align-items:center; gap:0.25rem;"><span class="material-symbols-rounded" style="font-size:16px;">soup_kitchen</span> Diteruskan ke Dapur</span>`;
            } else if (st === 'Cooking' || st === 'Processing') {
                return `<span style="color: var(--accent); font-size: 0.78rem; font-weight: 700; display:inline-flex; align-items:center; gap:0.25rem;"><span class="material-symbols-rounded" style="font-size:16px;">microwave</span> Sedang Diracik Dapur</span>`;
            } else if (order.OrderType === 'TakeAway' && (st === 'ReadyForPickup' || st === 'Ready')) {
                return `
                    <button class="btn btn-secondary btn-sm" onclick="DashboardPage.updateOrderStatus(${order.OrderId}, 'Completed')">
                        <span class="material-symbols-rounded" style="font-size: 16px;">shopping_bag</span> Serahkan ke Pelanggan
                    </button>
                `;
            } else if (order.OrderType === 'DineIn' && (st === 'ReadyToServe' || st === 'Ready')) {
                return `<span style="color: #2e7d32; font-size: 0.78rem; font-weight: 700; display:inline-flex; align-items:center; gap:0.25rem;"><span class="material-symbols-rounded" style="font-size:16px;">table_restaurant</span> Siap Disajikan Waiter</span>`;
            } else if (st === 'ReadyForDelivery' || st === 'Delivering') {
                return `<span style="color: var(--info); font-size: 0.78rem; font-weight: 700; display:inline-flex; align-items:center; gap:0.25rem;"><span class="material-symbols-rounded" style="font-size:16px;">two_wheeler</span> Diantar Kurir</span>`;
            } else if (st === 'Completed') {
                return `<span style="color: var(--success); font-size: 0.78rem; font-weight: 700; display:inline-flex; align-items:center; gap:0.2rem;"><span class="material-symbols-rounded" style="font-size:16px;">check_circle</span> Lunas & Selesai</span>`;
            } else if (st === 'Cancelled') {
                return `<span style="color: var(--danger); font-size: 0.78rem; font-weight: 700; display:inline-flex; align-items:center; gap:0.2rem;"><span class="material-symbols-rounded" style="font-size:16px;">cancel</span> Dibatalkan</span>`;
            }
        }

        // 3. Role DAPUR: Masak, Pesanan Siap (auto branch), Tolak jika Bahan Habis
        if (r === 'dapur') {
            if (st === 'Confirmed' || st === 'WaitingConfirmation' || st === 'Processing' || st === 'PendingPayment') {
                return `
                    <div style="display: inline-flex; gap: 0.35rem;">
                        <button class="btn btn-primary btn-sm" onclick="DashboardPage.updateOrderStatus(${order.OrderId}, 'Cooking')">
                            <span class="material-symbols-rounded" style="font-size: 16px;">cooking</span> Mulai Racik
                        </button>
                        <button class="btn btn-outline btn-sm" style="color: var(--danger); border-color: transparent;" onclick="DashboardPage.openCancelModal(${order.OrderId}, '${order.OrderNumber}')" title="Tolak (Stok Habis)">
                            <span class="material-symbols-rounded" style="font-size: 16px;">cancel</span> Tolak
                        </button>
                    </div>
                `;
            } else if (st === 'Cooking') {
                return `
                    <div style="display: inline-flex; gap: 0.35rem;">
                        <button class="btn btn-success btn-sm" onclick="DashboardPage.updateOrderStatus(${order.OrderId}, 'Ready')">
                            <span class="material-symbols-rounded" style="font-size: 16px;">check_circle</span> Pesanan Siap
                        </button>
                        <button class="btn btn-outline btn-sm" style="color: var(--danger); border-color: transparent;" onclick="DashboardPage.openCancelModal(${order.OrderId}, '${order.OrderNumber}')" title="Bahan Habis">
                            <span class="material-symbols-rounded" style="font-size: 16px;">cancel</span>
                        </button>
                    </div>
                `;
            } else if (st === 'Ready' || st === 'ReadyToServe' || st === 'ReadyForPickup' || st === 'ReadyForDelivery') {
                return `<span style="color: var(--info); font-size: 0.78rem; font-weight: 700; display:inline-flex; align-items:center; gap:0.25rem;"><span class="material-symbols-rounded" style="font-size:16px;">done_all</span> Siap Disajikan / Diambil</span>`;
            } else if (st === 'Completed') {
                return `<span style="color: var(--success); font-size: 0.78rem; font-weight: 700; display:inline-flex; align-items:center; gap:0.25rem;"><span class="material-symbols-rounded" style="font-size:16px;">check_circle</span> Selesai Disajikan</span>`;
            }
        }

        // 4. Role DRIVER: Klaim Antar, Buka Rute Peta GPS (Kokpit Kurir), Tandai Terkirim, Gagal Antar
        if (r === 'driver') {
            if (st === 'ReadyForDelivery' || st === 'Ready') {
                return `
                    <div style="display: inline-flex; gap: 0.35rem;">
                        <button class="btn btn-primary btn-sm" onclick="DashboardPage.updateOrderStatus(${order.OrderId}, 'Delivering'); window.location.hash='#/tracking?order=${encodeURIComponent(order.OrderNumber)}&role=driver';">
                            <span class="material-symbols-rounded" style="font-size: 16px;">two_wheeler</span> Klaim & Antar
                        </button>
                        <a href="#/tracking?order=${encodeURIComponent(order.OrderNumber)}&role=driver" class="btn btn-outline btn-sm" title="Lihat Peta Rute">
                            <span class="material-symbols-rounded" style="font-size: 16px;">map</span>
                        </a>
                    </div>
                `;
            } else if (st === 'Delivering') {
                return `
                    <div style="display: inline-flex; gap: 0.35rem; align-items: center;">
                        <a href="#/tracking?order=${encodeURIComponent(order.OrderNumber)}&role=driver" class="btn btn-primary btn-sm">
                            <span class="material-symbols-rounded" style="font-size: 16px;">navigation</span> Navigasi Driver
                        </a>
                        <button type="button" class="btn btn-outline btn-sm" onclick="DriverComm.openChat('${order.OrderNumber}', { role: 'driver', customerName: '${order.CustomerName || 'Pelanggan'}' })" title="Chat Pelanggan">
                            <span class="material-symbols-rounded" style="font-size: 16px; color: #25d366;">chat</span>
                        </button>
                        <button class="btn btn-success btn-sm" onclick="DashboardPage.updateOrderStatus(${order.OrderId}, 'Delivered')" title="Konfirmasi Sampai">
                            <span class="material-symbols-rounded" style="font-size: 16px;">done_all</span> Sampai
                        </button>
                        <button class="btn btn-outline btn-sm" style="color: var(--danger);" onclick="DashboardPage.openCancelModal(${order.OrderId}, '${order.OrderNumber}')" title="Gagal Antar">
                            Gagal
                        </button>
                    </div>
                `;
            } else if (st === 'Delivered') {
                return `
                    <div style="display: inline-flex; align-items: center; gap: 0.35rem;">
                        <span style="color: var(--success); font-size: 0.78rem; font-weight: 700; display:inline-flex; align-items:center; gap:0.2rem;">
                            <span class="material-symbols-rounded" style="font-size:16px;">done_all</span> Telah Sampai
                        </span>
                        <a href="#/tracking?order=${encodeURIComponent(order.OrderNumber)}&role=driver" class="btn btn-outline btn-sm" style="font-size: 0.72rem; padding: 2px 6px;">
                            Lihat Rute
                        </a>
                    </div>
                `;
            }
        }

        // 5. Role OWNER & ADMIN: Full override kontrol
        if (r === 'admin' || r === 'owner') {
            if (st !== 'Completed' && st !== 'Cancelled') {
                return `
                    <div style="display: inline-flex; gap: 0.35rem;">
                        <button class="btn btn-outline btn-sm" onclick="DashboardPage.updateOrderStatus(${order.OrderId}, 'Completed')">Selesai</button>
                        <button class="btn btn-danger btn-sm" onclick="DashboardPage.openCancelModal(${order.OrderId}, '${order.OrderNumber}')">Batal</button>
                    </div>
                `;
            }
        }

        return `<span style="color: var(--text-light); font-size: 0.8rem;">-</span>`;
    },

    renderBestSellersTab(bestSellers) {
        return `
            <div class="card">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem;">
                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                        <span class="material-symbols-rounded" style="color: var(--accent);">military_tech</span>
                        <h3 style="font-size: 1.15rem; font-family: 'Playfair Display', serif; margin: 0;">
                            Laporan Menu Terlaris (Top 5 Best Sellers)
                        </h3>
                    </div>
                    <span style="font-size: 0.82rem; color: var(--text-muted);">Diperbarui Real-time</span>
                </div>

                <div class="data-table-wrap">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th style="width: 50px;">Peringkat</th>
                                <th>Nama Menu Kopi / Makanan</th>
                                <th>Kategori</th>
                                <th style="text-align: center;">Jumlah Terjual</th>
                                <th style="text-align: right;">Total Kontribusi Pendapatan</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${bestSellers.length === 0 ? `
                                <tr>
                                    <td colspan="5" style="text-align: center; padding: 2.5rem; color: var(--text-muted);">
                                        Belum ada data penjualan menu terlaris.
                                    </td>
                                </tr>
                            ` : bestSellers.map((b, idx) => `
                                <tr>
                                    <td>
                                        <div style="width: 28px; height: 28px; border-radius: 50%; background: ${idx === 0 ? '#ffb703' : idx === 1 ? '#adb5bd' : idx === 2 ? '#cd7f32' : 'var(--bg-warm)'}; color: ${idx < 3 ? '#ffffff' : 'var(--text-heading)'}; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 0.85rem;">
                                            ${idx + 1}
                                        </div>
                                    </td>
                                    <td><b>${b.MenuName}</b></td>
                                    <td><span style="background: var(--bg-warm); padding: 2px 8px; border-radius: 4px; font-size: 0.8rem;">${b.CategoryName}</span></td>
                                    <td style="text-align: center; font-weight: 700; color: var(--primary); font-size: 1.05rem;">${b.TotalSold} porsi</td>
                                    <td style="text-align: right; font-weight: 800; color: var(--accent);">${App.formatRupiah(b.TotalRevenue)}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    },

    getFilteredStaffData() {
        const staff = this.staffList || [];
        let filteredStaff = staff;
        if (this.staffSearchKeyword) {
            const q = this.staffSearchKeyword.toLowerCase();
            filteredStaff = filteredStaff.filter(s => 
                (s.FullName && s.FullName.toLowerCase().includes(q)) ||
                (s.Email && s.Email.toLowerCase().includes(q)) ||
                (s.PhoneNumber && s.PhoneNumber.toLowerCase().includes(q)) ||
                (s.RoleName && s.RoleName.toLowerCase().includes(q))
            );
        }

        if (this.staffRoleFilter && this.staffRoleFilter !== 'all') {
            filteredStaff = filteredStaff.filter(s => (s.RoleName || '').toLowerCase() === this.staffRoleFilter.toLowerCase());
        }

        if (this.staffStatusFilter && this.staffStatusFilter !== 'all') {
            if (this.staffStatusFilter === 'active') {
                filteredStaff = filteredStaff.filter(s => s.IsActive);
            } else if (this.staffStatusFilter === 'inactive') {
                filteredStaff = filteredStaff.filter(s => !s.IsActive);
            }
        }

        const isFiltered = (!!this.staffSearchKeyword || this.staffRoleFilter !== 'all' || this.staffStatusFilter !== 'all');
        return { filteredStaff, isFiltered, staff };
    },

    renderStaffTableRowsHtml(filteredStaff, isFiltered) {
        if (filteredStaff.length === 0) {
            return `
                <tr>
                    <td colspan="7" style="text-align: center; padding: 3rem; color: var(--text-muted);">
                        <span class="material-symbols-rounded" style="font-size: 36px; display: block; margin-bottom: 0.5rem; opacity: 0.5;">person_off</span>
                        ${isFiltered ? 'Tidak ada staf yang sesuai dengan filter pencarian.' : 'Belum ada akun staf yang didaftarkan ke sistem.'}
                    </td>
                </tr>
            `;
        }
        return filteredStaff.map(stf => {
            const rName = stf.RoleName || 'Staff';
            const rLower = rName.toLowerCase();
            const initial = (stf.FullName || 'U').charAt(0).toUpperCase();
            const waNumber = (stf.PhoneNumber || '').replace(/[^0-9]/g, '');
            const formattedWa = waNumber.startsWith('0') ? '62' + waNumber.substring(1) : waNumber;
            
            // Warna avatar berdasarkan role
            let avatarBg = '#4a2c20';
            let roleIcon = 'badge';
            if (rLower === 'kasir') { avatarBg = '#1976d2'; roleIcon = 'point_of_sale'; }
            else if (rLower === 'dapur' || rLower === 'barista') { avatarBg = '#e65100'; roleIcon = 'skillet'; }
            else if (rLower === 'waiter') { avatarBg = '#2e7d32'; roleIcon = 'table_restaurant'; }
            else if (rLower === 'driver') { avatarBg = '#6a1b9a'; roleIcon = 'two_wheeler'; }
            else if (rLower === 'owner') { avatarBg = '#c2185b'; roleIcon = 'workspace_premium'; }
            else if (rLower === 'admin') { avatarBg = '#8d6e63'; roleIcon = 'admin_panel_settings'; }

            return `
                <tr>
                    <td>
                        <div style="display: flex; align-items: center; gap: 0.75rem;">
                            <div style="width: 38px; height: 38px; border-radius: 50%; background: ${avatarBg}; color: #ffffff; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 0.95rem; flex-shrink: 0; box-shadow: 0 2px 6px rgba(0,0,0,0.12);">
                                ${initial}
                            </div>
                            <div>
                                <div style="font-weight: 700; color: var(--text-heading); font-size: 0.95rem;">
                                    ${stf.FullName}
                                </div>
                                <div style="font-size: 0.75rem; color: var(--text-muted); display: flex; align-items: center; gap: 0.35rem;">
                                    <span>ID: #${stf.UserId}</span> • <span>${stf.Email}</span>
                                </div>
                            </div>
                        </div>
                    </td>

                    <td>
                        <span class="role-badge ${rLower}" style="display: inline-flex; align-items: center; gap: 0.25rem;">
                            <span class="material-symbols-rounded" style="font-size: 14px;">${roleIcon}</span>
                            ${rName}
                        </span>
                    </td>

                    <td>
                        <div style="display: flex; align-items: center; gap: 0.4rem;">
                            <span style="font-size: 0.85rem; font-weight: 500;">${stf.PhoneNumber || '-'}</span>
                            ${waNumber ? `
                                <a href="https://wa.me/${formattedWa}" target="_blank" rel="noopener noreferrer" 
                                   style="display: inline-flex; align-items: center; justify-content: center; width: 24px; height: 24px; border-radius: 50%; background: #25d366; color: #ffffff; text-decoration: none;" 
                                   title="Chat WhatsApp ${stf.FullName}">
                                    <span class="material-symbols-rounded" style="font-size: 14px;">chat</span>
                                </a>
                            ` : ''}
                        </div>
                    </td>

                    <td style="text-align: center;">
                        <div style="font-weight: 700; font-size: 0.95rem; color: var(--text-heading);">
                            ${stf.TotalOrdersHandled || 0} <span style="font-size: 0.75rem; font-weight: 400; color: var(--text-muted);">pesanan</span>
                        </div>
                        <div style="font-size: 0.72rem; color: var(--success); font-weight: 600;">
                            ${rLower === 'waiter' ? `${stf.TotalOrdersServed || 0} meja disajikan` :
                              rLower === 'driver' ? `${stf.TotalOrdersDelivered || 0} trip diantar` :
                              rLower === 'kasir' ? `${stf.TotalOrdersCompleted || 0} lunas (${App.formatRupiah(stf.TotalRevenueHandled || 0)})` :
                              `${stf.TotalOrdersCompleted || 0} selesai`}
                        </div>
                    </td>

                    <td style="text-align: center;">
                        <button type="button" 
                                class="btn btn-sm" 
                                style="padding: 3px 10px; font-size: 0.76rem; font-weight: 700; border-radius: var(--radius-pill); cursor: pointer; transition: all 0.2s ease; ${stf.IsActive ? 'background: #e8f5e9; color: #2e7d32; border: 1px solid #c8e6c9;' : 'background: #ffebee; color: #c62828; border: 1px solid #ffcdd2;'}"
                                onclick="DashboardPage.toggleStaffStatus(${stf.UserId})"
                                title="Klik untuk mengubah status aktif/nonaktif">
                            <span class="material-symbols-rounded" style="font-size: 13px; vertical-align: middle;">${stf.IsActive ? 'check_circle' : 'do_not_disturb_on'}</span>
                            ${stf.IsActive ? 'Aktif Bertugas' : 'Nonaktif'}
                        </button>
                    </td>

                    <td>
                        <div style="font-size: 0.8rem; color: var(--text-heading); font-weight: 500;">
                            ${stf.CreatedAt ? new Date(stf.CreatedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
                        </div>
                        <div style="font-size: 0.72rem; color: var(--text-muted);">
                            ${stf.LastActiveAt ? `Terakhir aktif: ${new Date(stf.LastActiveAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}` : 'Belum ada transaksi'}
                        </div>
                    </td>

                    <td style="text-align: right;">
                        <div style="display: inline-flex; gap: 0.35rem; align-items: center;">
                            <button type="button" class="btn btn-outline btn-sm" style="padding: 4px 8px;" onclick='DashboardPage.openEditStaffModal(${JSON.stringify(stf).replace(/'/g, "&apos;")})' title="Edit Data Staf">
                                <span class="material-symbols-rounded" style="font-size: 15px; color: var(--primary);">edit</span>
                            </button>
                            <button type="button" class="btn btn-outline btn-sm" style="padding: 4px 8px; color: var(--danger); border-color: #ffcdd2;" onclick="DashboardPage.openDeleteStaffModal(${stf.UserId}, '${stf.FullName.replace(/'/g, "\\'")}')" title="Hapus Akun Staf">
                                <span class="material-symbols-rounded" style="font-size: 15px;">delete</span>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    },

    renderStaffTab() {
        const { filteredStaff, isFiltered, staff } = this.getFilteredStaffData();

        // Statistik Peran
        const kasirList = staff.filter(s => s.RoleName === 'Kasir');
        const kasirOrders = kasirList.reduce((acc, s) => acc + (s.TotalOrdersCompleted || 0), 0);
        
        const dapurList = staff.filter(s => s.RoleName === 'Dapur' || s.RoleName === 'Barista');
        const dapurOrders = dapurList.reduce((acc, s) => acc + (s.TotalOrdersHandled || 0), 0);
        
        const waiterList = staff.filter(s => s.RoleName === 'Waiter');
        const waiterOrders = waiterList.reduce((acc, s) => acc + (s.TotalOrdersServed || 0), 0);
        
        const driverList = staff.filter(s => s.RoleName === 'Driver');
        const driverOrders = driverList.reduce((acc, s) => acc + (s.TotalOrdersDelivered || 0), 0);
        
        const activeStaffCount = staff.filter(s => s.IsActive).length;

        return `
            <div style="display: flex; flex-direction: column; gap: 1.5rem;">
                <!-- 1. Operational Roles Pillar Cards -->
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1rem;">
                    <div class="card card-hover-lift" style="display: flex; align-items: center; gap: 1rem; border-left: 4px solid #1976d2; padding: 1.15rem; cursor: pointer;" onclick="DashboardPage.staffRoleFilter = 'Kasir'; DashboardPage.render();">
                        <div class="pillar-icon-box" style="background: #e3f2fd; color: #1976d2; width: 44px; height: 44px; border-radius: 12px; display: flex; align-items: center; justify-content: center;">
                            <span class="material-symbols-rounded">point_of_sale</span>
                        </div>
                        <div>
                            <div style="font-size: 0.78rem; color: var(--text-muted); font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Kasir (${kasirList.length})</div>
                            <div style="font-size: 1.15rem; font-weight: 800; color: var(--text-heading);">${kasirOrders} Pesanan</div>
                            <div style="font-size: 0.75rem; color: #1976d2; font-weight: 600;">POS & Konfirmasi Bayar</div>
                        </div>
                    </div>

                    <div class="card card-hover-lift" style="display: flex; align-items: center; gap: 1rem; border-left: 4px solid #f57c00; padding: 1.15rem; cursor: pointer;" onclick="DashboardPage.staffRoleFilter = 'Dapur'; DashboardPage.render();">
                        <div class="pillar-icon-box" style="background: #fff3e0; color: #f57c00; width: 44px; height: 44px; border-radius: 12px; display: flex; align-items: center; justify-content: center;">
                            <span class="material-symbols-rounded">skillet</span>
                        </div>
                        <div>
                            <div style="font-size: 0.78rem; color: var(--text-muted); font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Dapur / Barista (${dapurList.length})</div>
                            <div style="font-size: 1.15rem; font-weight: 800; color: var(--text-heading);">${dapurOrders} Porsi</div>
                            <div style="font-size: 0.75rem; color: #f57c00; font-weight: 600;">Racik Kopi & Makanan</div>
                        </div>
                    </div>

                    <div class="card card-hover-lift" style="display: flex; align-items: center; gap: 1rem; border-left: 4px solid #388e3c; padding: 1.15rem; cursor: pointer;" onclick="DashboardPage.staffRoleFilter = 'Waiter'; DashboardPage.render();">
                        <div class="pillar-icon-box" style="background: #e8f5e9; color: #388e3c; width: 44px; height: 44px; border-radius: 12px; display: flex; align-items: center; justify-content: center;">
                            <span class="material-symbols-rounded">table_restaurant</span>
                        </div>
                        <div>
                            <div style="font-size: 0.78rem; color: var(--text-muted); font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Waiter (${waiterList.length})</div>
                            <div style="font-size: 1.15rem; font-weight: 800; color: var(--text-heading);">${waiterOrders} Meja Disajikan</div>
                            <div style="font-size: 0.75rem; color: #388e3c; font-weight: 600;">Pelayanan Meja & Counter</div>
                        </div>
                    </div>

                    <div class="card card-hover-lift" style="display: flex; align-items: center; gap: 1rem; border-left: 4px solid #7b1fa2; padding: 1.15rem; cursor: pointer;" onclick="DashboardPage.staffRoleFilter = 'Driver'; DashboardPage.render();">
                        <div class="pillar-icon-box" style="background: #f3e5f5; color: #7b1fa2; width: 44px; height: 44px; border-radius: 12px; display: flex; align-items: center; justify-content: center;">
                            <span class="material-symbols-rounded">two_wheeler</span>
                        </div>
                        <div>
                            <div style="font-size: 0.78rem; color: var(--text-muted); font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Driver Kurir (${driverList.length})</div>
                            <div style="font-size: 1.15rem; font-weight: 800; color: var(--text-heading);">${driverOrders} Trip Selesai</div>
                            <div style="font-size: 0.75rem; color: #7b1fa2; font-weight: 600;">Delivery & GPS Rute</div>
                        </div>
                    </div>
                </div>

                <!-- 2. Master Table Direktori & Manajemen Staf -->
                <div class="card">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem; flex-wrap: wrap; gap: 0.75rem;">
                        <div style="display: flex; align-items: center; gap: 0.5rem;">
                            <div style="width: 36px; height: 36px; border-radius: 8px; background: var(--bg-warm); color: var(--primary); display: flex; align-items: center; justify-content: center;">
                                <span class="material-symbols-rounded" style="font-size: 22px;">badge</span>
                            </div>
                            <div>
                                <h3 style="font-size: 1.2rem; font-family: 'Playfair Display', serif; margin: 0; color: var(--text-heading);">
                                    Direktori & Manajemen Staf Terdaftar
                                </h3>
                                <p style="margin: 0; font-size: 0.82rem; color: var(--text-muted);">
                                    Total <b id="dashboard-staff-count-total">${staff.length}</b> akun staf terdaftar (<span id="dashboard-staff-count-active">${activeStaffCount}</span> staf aktif bertugas).
                                </p>
                            </div>
                        </div>

                        <div style="display: flex; gap: 0.5rem; align-items: center; flex-wrap: wrap;">
                            <button type="button" class="btn btn-primary btn-sm" onclick="DashboardPage.openAddStaffModal()">
                                <span class="material-symbols-rounded" style="font-size: 16px;">person_add</span>
                                Tambah Akun Staf
                            </button>
                            <button type="button" class="btn btn-outline btn-sm" onclick="DashboardPage.loadStaffList().then(() => DashboardPage.render())" title="Segarkan Data Staf">
                                <span class="material-symbols-rounded" style="font-size: 16px;">refresh</span>
                            </button>
                        </div>
                    </div>

                    <!-- Filter & Toolbar Staf -->
                    <div class="filter-toolbar" style="margin-bottom: 1.25rem;">
                        <div class="search-field" style="flex: 1; min-width: 240px;">
                            <span class="material-symbols-rounded search-icon">search</span>
                            <input type="text" id="dashboard-staff-search-input" placeholder="Cari nama staf, email, no. HP, role..." 
                                   value="${this.staffSearchKeyword}" 
                                   oninput="DashboardPage.onSearchStaff(this.value)" />
                        </div>

                        <div style="display: flex; gap: 0.5rem; align-items: center; flex-wrap: wrap;">
                            <select class="filter-select" onchange="DashboardPage.staffRoleFilter = this.value; DashboardPage.render();">
                                <option value="all" ${this.staffRoleFilter === 'all' ? 'selected' : ''}>Semua Peran / Jabatan</option>
                                <option value="Kasir" ${this.staffRoleFilter === 'Kasir' ? 'selected' : ''}>● Kasir</option>
                                <option value="Dapur" ${this.staffRoleFilter === 'Dapur' ? 'selected' : ''}>● Dapur / Barista</option>
                                <option value="Waiter" ${this.staffRoleFilter === 'Waiter' ? 'selected' : ''}>● Pramusaji / Waiter</option>
                                <option value="Driver" ${this.staffRoleFilter === 'Driver' ? 'selected' : ''}>● Driver / Kurir</option>
                                <option value="Admin" ${this.staffRoleFilter === 'Admin' ? 'selected' : ''}>● Admin</option>
                                <option value="Owner" ${this.staffRoleFilter === 'Owner' ? 'selected' : ''}>● Owner</option>
                            </select>

                            <select class="filter-select" onchange="DashboardPage.staffStatusFilter = this.value; DashboardPage.render();">
                                <option value="all" ${this.staffStatusFilter === 'all' ? 'selected' : ''}>Semua Status</option>
                                <option value="active" ${this.staffStatusFilter === 'active' ? 'selected' : ''}>● Aktif Bertugas</option>
                                <option value="inactive" ${this.staffStatusFilter === 'inactive' ? 'selected' : ''}>● Nonaktif / Istirahat</option>
                            </select>

                            ${isFiltered ? `
                                <button type="button" class="btn btn-outline btn-sm" onclick="DashboardPage.staffSearchKeyword = ''; DashboardPage.staffRoleFilter = 'all'; DashboardPage.staffStatusFilter = 'all'; DashboardPage.render();" title="Reset Filter">
                                    <span class="material-symbols-rounded" style="font-size: 16px;">close</span>
                                    Reset
                                </button>
                            ` : ''}
                        </div>
                    </div>

                    <div class="data-table-wrap">
                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th>Karyawan / Staf</th>
                                    <th>Penugasan (Role)</th>
                                    <th>Kontak Langsung</th>
                                    <th style="text-align: center;">Kinerja Nyata</th>
                                    <th style="text-align: center;">Status Kerja</th>
                                    <th>Terdaftar / Terakhir Aktif</th>
                                    <th style="text-align: right;">Aksi Manajemen</th>
                                </tr>
                            </thead>
                            <tbody id="dashboard-staff-tbody">
                                ${this.renderStaffTableRowsHtml(filteredStaff, isFiltered)}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;
    },

    async toggleStaffStatus(userId) {
        try {
            const res = await Api.put(`/staff/${userId}/toggle-status`, {});
            if (res && (res.success || res.Success)) {
                Toast.success(res.message || res.Message || 'Status akun staf berhasil diperbarui.');
                await this.loadStaffList();
                this.render();
            } else {
                Toast.error(res?.message || res?.Message || 'Gagal mengubah status staf.');
            }
        } catch (err) {
            Toast.error(err.message || 'Terjadi kesalahan sistem.');
        }
    },

    openAddStaffModal() {
        this.closeModal();
        const modal = document.createElement('div');
        modal.id = 'dashboard-modal';
        modal.innerHTML = `
            <div class="modal-overlay active" style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(26,20,18,0.7); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 9999; padding: 1rem;">
                <div class="card" style="max-width: 480px; width: 100%; padding: 1.5rem; border-radius: var(--radius-md); max-height: 90vh; overflow-y: auto;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem; border-bottom: 1px solid var(--border-subtle); padding-bottom: 0.75rem;">
                        <div style="display: flex; align-items: center; gap: 0.5rem;">
                            <span class="material-symbols-rounded" style="color: var(--primary);">person_add</span>
                            <h3 style="margin: 0; font-size: 1.15rem; color: var(--text-heading);">
                                Tambah Akun Staf Baru
                            </h3>
                        </div>
                        <button type="button" class="btn btn-outline btn-sm" style="border: none;" onclick="DashboardPage.closeModal()"><span class="material-symbols-rounded" style="font-size:18px;">close</span></button>
                    </div>

                    <form id="form-add-staff" onsubmit="DashboardPage.saveAddStaff(event)">
                        <div class="form-group" style="margin-bottom: 0.85rem;">
                            <label style="font-weight: 600; font-size: 0.85rem; display: block; margin-bottom: 0.25rem;">Nama Lengkap Staf *</label>
                            <input type="text" id="add-staff-name" class="form-control" placeholder="Contoh: Budi Santoso" required />
                        </div>

                        <div class="form-group" style="margin-bottom: 0.85rem;">
                            <label style="font-weight: 600; font-size: 0.85rem; display: block; margin-bottom: 0.25rem;">Email Operasional *</label>
                            <input type="email" id="add-staff-email" class="form-control" placeholder="budi.kasir@ruangrasa.com" required />
                        </div>

                        <div class="form-group" style="margin-bottom: 0.85rem;">
                            <label style="font-weight: 600; font-size: 0.85rem; display: block; margin-bottom: 0.25rem;">No. WhatsApp / Telepon *</label>
                            <input type="tel" id="add-staff-phone" class="form-control" placeholder="08123456789" required />
                        </div>

                        <div class="form-group" style="margin-bottom: 0.85rem;">
                            <label style="font-weight: 600; font-size: 0.85rem; display: block; margin-bottom: 0.25rem;">Penugasan Peran (Role) *</label>
                            <select id="add-staff-role" class="form-control" required>
                                <option value="Kasir">Petugas Kasir (POS & Meja)</option>
                                <option value="Dapur">Staf Dapur / Barista</option>
                                <option value="Waiter">Pramusaji / Waiter (Antar Meja & Counter)</option>
                                <option value="Driver">Kurir Pengantaran (Driver)</option>
                                <option value="Admin">Administrator</option>
                                <option value="Owner">Owner Café</option>
                            </select>
                        </div>

                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; margin-bottom: 1.25rem;">
                            <div class="form-group">
                                <label style="font-weight: 600; font-size: 0.85rem; display: block; margin-bottom: 0.25rem;">Kata Sandi *</label>
                                <input type="password" id="add-staff-pass" class="form-control" placeholder="Min. 6 karakter" required minlength="6" />
                            </div>
                            <div class="form-group">
                                <label style="font-weight: 600; font-size: 0.85rem; display: block; margin-bottom: 0.25rem;">Ulangi Sandi *</label>
                                <input type="password" id="add-staff-confirm" class="form-control" placeholder="Ketik ulang" required minlength="6" />
                            </div>
                        </div>

                        <div style="display: flex; justify-content: flex-end; gap: 0.6rem; border-top: 1px solid var(--border-subtle); padding-top: 1rem;">
                            <button type="button" class="btn btn-outline btn-sm" onclick="DashboardPage.closeModal()">Batal</button>
                            <button type="submit" id="btn-save-add-staff" class="btn btn-primary btn-sm">
                                <span class="material-symbols-rounded" style="font-size: 16px;">person_add</span>
                                Daftarkan Staf
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    },

    async saveAddStaff(e) {
        e.preventDefault();
        const nameEl = document.getElementById('add-staff-name');
        const emailEl = document.getElementById('add-staff-email');
        const phoneEl = document.getElementById('add-staff-phone');
        const roleEl = document.getElementById('add-staff-role');
        const passEl = document.getElementById('add-staff-pass');
        const confirmEl = document.getElementById('add-staff-confirm');

        if (passEl.value !== confirmEl.value) {
            Toast.warning('Konfirmasi kata sandi tidak cocok.');
            return;
        }

        const btn = document.getElementById('btn-save-add-staff');
        btn.disabled = true;
        btn.innerText = 'Menyimpan...';

        try {
            const res = await Api.post('/auth/register', {
                FullName: nameEl.value.trim(),
                Email: emailEl.value.trim(),
                PhoneNumber: phoneEl.value.trim(),
                Password: passEl.value,
                ConfirmPassword: confirmEl.value,
                RoleName: roleEl.value
            });

            if (res && (res.success || res.Success)) {
                Toast.success(`Staf ${nameEl.value} (${roleEl.value}) berhasil didaftarkan!`);
                this.closeModal();
                await this.loadStaffList();
                this.render();
            } else {
                Toast.error(res.message || 'Gagal mendaftarkan staf.');
            }
        } catch (err) {
            Toast.error(err.message || 'Terjadi kesalahan sistem.');
        } finally {
            if (btn) {
                btn.disabled = false;
                btn.innerText = 'Daftarkan Staf';
            }
        }
    },

    openEditStaffModal(staff) {
        this.closeModal();
        const modal = document.createElement('div');
        modal.id = 'dashboard-modal';
        modal.innerHTML = `
            <div class="modal-overlay active" style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(26,20,18,0.7); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 9999; padding: 1rem;">
                <div class="card" style="max-width: 480px; width: 100%; padding: 1.5rem; border-radius: var(--radius-md); max-height: 90vh; overflow-y: auto;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem; border-bottom: 1px solid var(--border-subtle); padding-bottom: 0.75rem;">
                        <div style="display: flex; align-items: center; gap: 0.5rem;">
                            <span class="material-symbols-rounded" style="color: var(--primary);">edit</span>
                            <h3 style="margin: 0; font-size: 1.15rem; color: var(--text-heading);">
                                Edit Data Staf #${staff.UserId}
                            </h3>
                        </div>
                        <button type="button" class="btn btn-outline btn-sm" style="border: none;" onclick="DashboardPage.closeModal()"><span class="material-symbols-rounded" style="font-size:18px;">close</span></button>
                    </div>

                    <form id="form-edit-staff" onsubmit="DashboardPage.saveEditStaff(event, ${staff.UserId})">
                        <div class="form-group" style="margin-bottom: 0.85rem;">
                            <label style="font-weight: 600; font-size: 0.85rem; display: block; margin-bottom: 0.25rem;">Nama Lengkap *</label>
                            <input type="text" id="edit-staff-name" class="form-control" value="${staff.FullName || ''}" required />
                        </div>

                        <div class="form-group" style="margin-bottom: 0.85rem;">
                            <label style="font-weight: 600; font-size: 0.85rem; display: block; margin-bottom: 0.25rem;">Email (Tidak Dapat Diubah)</label>
                            <input type="email" class="form-control" value="${staff.Email || ''}" disabled style="background: var(--bg-warm); opacity: 0.7;" />
                        </div>

                        <div class="form-group" style="margin-bottom: 0.85rem;">
                            <label style="font-weight: 600; font-size: 0.85rem; display: block; margin-bottom: 0.25rem;">No. WhatsApp / Telepon *</label>
                            <input type="tel" id="edit-staff-phone" class="form-control" value="${staff.PhoneNumber || ''}" required />
                        </div>

                        <div class="form-group" style="margin-bottom: 0.85rem;">
                            <label style="font-weight: 600; font-size: 0.85rem; display: block; margin-bottom: 0.25rem;">Penugasan Peran (Role) *</label>
                            <select id="edit-staff-role" class="form-control" required>
                                <option value="Kasir" ${staff.RoleName === 'Kasir' ? 'selected' : ''}>Petugas Kasir (POS & Meja)</option>
                                <option value="Dapur" ${staff.RoleName === 'Dapur' ? 'selected' : ''}>Staf Dapur / Barista</option>
                                <option value="Waiter" ${staff.RoleName === 'Waiter' ? 'selected' : ''}>Pramusaji / Waiter</option>
                                <option value="Driver" ${staff.RoleName === 'Driver' ? 'selected' : ''}>Kurir Pengantaran (Driver)</option>
                                <option value="Admin" ${staff.RoleName === 'Admin' ? 'selected' : ''}>Administrator</option>
                                <option value="Owner" ${staff.RoleName === 'Owner' ? 'selected' : ''}>Owner Café</option>
                            </select>
                        </div>

                        <div class="form-group" style="margin-bottom: 0.85rem;">
                            <label style="font-weight: 600; font-size: 0.85rem; display: block; margin-bottom: 0.25rem;">Status Keaktifan</label>
                            <select id="edit-staff-status" class="form-control">
                                <option value="true" ${staff.IsActive ? 'selected' : ''}>🟢 Aktif Bertugas</option>
                                <option value="false" ${!staff.IsActive ? 'selected' : ''}>⚪ Nonaktif / Istirahat</option>
                            </select>
                        </div>

                        <div class="form-group" style="margin-bottom: 1.25rem;">
                            <label style="font-weight: 600; font-size: 0.85rem; display: block; margin-bottom: 0.25rem;">Ganti Kata Sandi (Kosongkan jika tidak diubah)</label>
                            <input type="password" id="edit-staff-newpass" class="form-control" placeholder="Biarkan kosong jika tetap" minlength="6" />
                        </div>

                        <div style="display: flex; justify-content: flex-end; gap: 0.6rem; border-top: 1px solid var(--border-subtle); padding-top: 1rem;">
                            <button type="button" class="btn btn-outline btn-sm" onclick="DashboardPage.closeModal()">Batal</button>
                            <button type="submit" id="btn-save-edit-staff" class="btn btn-primary btn-sm">
                                <span class="material-symbols-rounded" style="font-size: 16px;">save</span>
                                Simpan Perubahan
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    },

    async saveEditStaff(e, userId) {
        e.preventDefault();
        const nameEl = document.getElementById('edit-staff-name');
        const phoneEl = document.getElementById('edit-staff-phone');
        const roleEl = document.getElementById('edit-staff-role');
        const statusEl = document.getElementById('edit-staff-status');
        const passEl = document.getElementById('edit-staff-newpass');

        const btn = document.getElementById('btn-save-edit-staff');
        btn.disabled = true;
        btn.innerText = 'Menyimpan...';

        try {
            const res = await Api.put(`/staff/${userId}`, {
                FullName: nameEl.value.trim(),
                PhoneNumber: phoneEl.value.trim(),
                RoleName: roleEl.value,
                IsActive: statusEl.value === 'true',
                NewPassword: passEl.value ? passEl.value.trim() : null
            });

            if (res && (res.success || res.Success)) {
                Toast.success(`Data staf ${nameEl.value} berhasil diperbarui!`);
                this.closeModal();
                await this.loadStaffList();
                this.render();
            } else {
                Toast.error(res.message || 'Gagal memperbarui data staf.');
            }
        } catch (err) {
            Toast.error(err.message || 'Terjadi kesalahan sistem.');
        } finally {
            if (btn) {
                btn.disabled = false;
                btn.innerText = 'Simpan Perubahan';
            }
        }
    },

    openDeleteStaffModal(userId, staffName) {
        this.closeModal();
        const modal = document.createElement('div');
        modal.id = 'dashboard-modal';
        modal.innerHTML = `
            <div class="modal-overlay active" style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(26,20,18,0.7); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 9999; padding: 1rem;">
                <div class="card" style="max-width: 440px; width: 100%; padding: 1.5rem; border-radius: var(--radius-md);">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                        <h3 style="margin: 0; font-size: 1.15rem; color: var(--danger); display: flex; align-items: center; gap: 0.4rem;">
                            <span class="material-symbols-rounded">delete_forever</span>
                            Hapus Akun Staf
                        </h3>
                        <button type="button" class="btn btn-outline btn-sm" style="border: none;" onclick="DashboardPage.closeModal()"><span class="material-symbols-rounded" style="font-size:18px;">close</span></button>
                    </div>
                    <p style="font-size: 0.9rem; color: var(--text-heading); margin-bottom: 0.5rem;">
                        Apakah Anda yakin ingin menghapus akun staf <b>${staffName}</b> (ID: #${userId})?
                    </p>
                    <p style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 1.25rem;">
                        Akun ini tidak akan dapat login lagi ke dalam sistem operasional Café Ruang Rasa.
                    </p>
                    <div style="display: flex; justify-content: flex-end; gap: 0.6rem;">
                        <button type="button" class="btn btn-outline btn-sm" onclick="DashboardPage.closeModal()">Batal</button>
                        <button type="button" class="btn btn-danger btn-sm" onclick="DashboardPage.confirmDeleteStaff(${userId})">
                            Ya, Hapus Akun
                        </button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    },

    async confirmDeleteStaff(userId) {
        try {
            const res = await Api.delete(`/staff/${userId}`);
            if (res && (res.success || res.Success)) {
                Toast.success(res.message || res.Message || 'Akun staf berhasil dihapus.');
                this.closeModal();
                await this.loadStaffList();
                this.render();
            } else {
                Toast.error(res.message || res.Message || 'Gagal menghapus staf.');
            }
        } catch (err) {
            Toast.error(err.message || 'Terjadi kesalahan sistem.');
        }
    },

    renderPromosTab(promoUsage) {
        return `
            <div class="card">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem;">
                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                        <span class="material-symbols-rounded" style="color: var(--accent);">local_activity</span>
                        <h3 style="font-size: 1.15rem; font-family: 'Playfair Display', serif; margin: 0;">
                            Laporan Penggunaan Voucher Promo Pelanggan
                        </h3>
                    </div>
                    <span style="font-size: 0.82rem; color: var(--text-muted);">Efektivitas Promosi Diskon</span>
                </div>

                <div class="data-table-wrap">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Kode Promo</th>
                                <th>Nama Program Diskon</th>
                                <th style="text-align: center;">Frekuensi Dipakai</th>
                                <th style="text-align: right;">Total Subsidi Potongan Harga</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${promoUsage.length === 0 ? `
                                <tr>
                                    <td colspan="4" style="text-align: center; padding: 2.5rem; color: var(--text-muted);">
                                        Belum ada data penggunaan voucher promo.
                                    </td>
                                </tr>
                            ` : promoUsage.map(p => `
                                <tr>
                                    <td><strong style="font-family: monospace; color: var(--primary); font-size: 0.95rem;">${p.PromoCode}</strong></td>
                                    <td>${p.Title}</td>
                                    <td style="text-align: center; font-weight: 700; color: var(--text-heading);">${p.TimesUsed} transaksi</td>
                                    <td style="text-align: right; font-weight: 800; color: var(--danger);">${App.formatRupiah(p.TotalDiscountGiven)}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }
};

