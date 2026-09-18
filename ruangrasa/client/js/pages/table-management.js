// ==========================================================================
// TABLE MANAGEMENT COMPONENT (Admin, Owner, & Kasir)
// ==========================================================================

const TableManagementPage = {
    tables: [],
    filterArea: 'all',
    filterStatus: 'all',
    searchKeyword: '',
    isUpdating: {},

    async init() {
        const user = Api.getCurrentUser();
        const role = (user?.role || '').toLowerCase();
        if (!user || (role !== 'admin' && role !== 'owner' && role !== 'kasir' && role !== 'waiter')) {
            window.location.hash = '#/403';
            return;
        }

        // Render struktur tampilan seketika (0ms)
        this.render();

        try {
            await this.loadTables();
        } catch (err) {
            console.warn('TableManagementPage loadTables warn:', err);
        }
        this.render();
    },

    async loadTables() {
        try {
            const res = await Api.get('/tables');
            if (res && res.data) {
                this.tables = res.data;
            }
        } catch (err) {
            console.error('Error loading tables:', err);
            Toast.error('Gagal memuat data meja.');
        }
    },

    async updateStatus(tableId, status) {
        if (this.isUpdating[tableId]) return;
        this.isUpdating[tableId] = true;

        try {
            const res = await Api.put(`/tables/${tableId}/status`, { Status: status });
            if (res && res.Success) {
                const table = this.tables.find(t => t.TableId === tableId);
                if (table) {
                    table.Status = status;
                }
                Toast.success(res.Message || `Status meja berhasil diubah menjadi ${status}.`);
            } else {
                Toast.error(res?.Message || 'Gagal mengubah status meja.');
                await this.loadTables();
            }
        } catch (err) {
            Toast.error(err.message || 'Gagal menghubungi server untuk mengubah status meja.');
            await this.loadTables();
        } finally {
            this.isUpdating[tableId] = false;
            this.render();
        }
    },

    setFilterArea(area) {
        this.filterArea = area;
        this.render();
    },

    setFilterStatus(status) {
        this.filterStatus = status;
        this.render();
    },

    setSearchKeyword(keyword) {
        this.searchKeyword = keyword.toLowerCase().trim();
        if (this.searchDebounceTimer) clearTimeout(this.searchDebounceTimer);
        this.searchDebounceTimer = setTimeout(() => {
            const tableBody = document.getElementById('tables-table-body');
            const countBadge = document.getElementById('tables-count-badge');
            if (tableBody) {
                const total = this.tables.length;
                const filtered = this.getFilteredTables();
                if (countBadge) {
                    countBadge.innerHTML = `Menampilkan <b>${filtered.length}</b> dari <b>${total}</b> meja`;
                }
                tableBody.innerHTML = this.renderTableRowsHtml(filtered);
            } else {
                this.render();
            }
        }, 150);
    },

    getFilteredTables() {
        return this.tables.filter(t => {
            const matchArea = this.filterArea === 'all' || (t.LocationArea || '').toLowerCase() === this.filterArea.toLowerCase();
            const matchStatus = this.filterStatus === 'all' || (t.Status || '').toLowerCase() === this.filterStatus.toLowerCase();
            const matchSearch = !this.searchKeyword || 
                                (t.TableNumber || '').toLowerCase().includes(this.searchKeyword) || 
                                (t.LocationArea || '').toLowerCase().includes(this.searchKeyword);
            return matchArea && matchStatus && matchSearch;
        });
    },

    renderTableRowsHtml(filtered) {
        if (filtered.length === 0) {
            return `
                <tr>
                    <td colspan="5" style="text-align: center; padding: 2.5rem; color: var(--text-muted);">
                        <span class="material-symbols-rounded" style="font-size: 36px; display: block; margin-bottom: 0.5rem; color: var(--border-color);">search_off</span>
                        Tidak ada meja yang sesuai dengan filter pencarian.
                    </td>
                </tr>
            `;
        }
        return filtered.map(t => {
            const updating = !!this.isUpdating[t.TableId];
            return `
                <tr style="${updating ? 'opacity: 0.5;' : ''}">
                    <td>
                        <div style="display: flex; align-items: center; gap: 0.5rem;">
                            <span class="material-symbols-rounded" style="color: var(--primary); font-size: 18px;">restaurant</span>
                            <span style="font-weight: 700; color: var(--text-heading); font-size: 0.95rem;">${t.TableNumber}</span>
                        </div>
                    </td>
                    <td>
                        <span style="font-size: 0.88rem; color: var(--text-body);">${t.LocationArea}</span>
                    </td>
                    <td>
                        <span style="font-size: 0.88rem; color: var(--text-muted); display: inline-flex; align-items: center; gap: 0.3rem;">
                            <span class="material-symbols-rounded" style="font-size: 16px;">person</span>
                            ${t.Capacity} Kursi
                        </span>
                    </td>
                    <td>
                        <span class="${this.getStatusBadgeClass(t.Status)}">
                            ${this.getStatusLabel(t.Status)}
                        </span>
                    </td>
                    <td style="text-align: right;">
                        <div style="display: inline-flex; align-items: center; gap: 0.5rem; justify-content: flex-end;">
                            <select class="table-status-select" 
                                    style="min-width: 175px;"
                                    ${updating ? 'disabled' : ''}
                                    onchange="TableManagementPage.updateStatus(${t.TableId}, this.value)">
                                <option value="Available" ${t.Status === 'Available' ? 'selected' : ''}>● Tersedia (Available)</option>
                                <option value="Occupied" ${t.Status === 'Occupied' ? 'selected' : ''}>● Terisi (Occupied)</option>
                                <option value="Reserved" ${t.Status === 'Reserved' ? 'selected' : ''}>● Reservasi (Reserved)</option>
                                <option value="Maintenance" ${t.Status === 'Maintenance' ? 'selected' : ''}>● Perbaikan (Maintenance)</option>
                            </select>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    },

    getStatusBadgeClass(status) {
        switch ((status || '').toLowerCase()) {
            case 'available':
                return 'status-pill completed';
            case 'occupied':
                return 'status-pill cancelled';
            case 'reserved':
                return 'status-pill pending';
            case 'maintenance':
                return 'status-pill ready';
            default:
                return 'status-pill';
        }
    },

    getStatusLabel(status) {
        switch ((status || '').toLowerCase()) {
            case 'available':
                return 'Tersedia';
            case 'occupied':
                return 'Terisi (Occupied)';
            case 'reserved':
                return 'Direservasi';
            case 'maintenance':
                return 'Perbaikan';
            default:
                return status;
        }
    },

    render() {
        const root = document.getElementById('page-root');
        if (!root) return;
        if (!window.location.hash.startsWith('#/table-management')) return;

        const user = Api.getCurrentUser() || { fullName: 'Petugas', role: 'Kasir' };

        // Calculate counts
        const total = this.tables.length;
        const countAvailable = this.tables.filter(t => t.Status === 'Available').length;
        const countOccupied = this.tables.filter(t => t.Status === 'Occupied').length;
        const countReserved = this.tables.filter(t => t.Status === 'Reserved').length;
        const countMaintenance = this.tables.filter(t => t.Status === 'Maintenance').length;

        // Filter list
        let filtered = this.tables;
        if (this.filterArea !== 'all') {
            filtered = filtered.filter(t => t.LocationArea === this.filterArea);
        }
        if (this.filterStatus !== 'all') {
            filtered = filtered.filter(t => t.Status === this.filterStatus);
        }
        if (this.searchKeyword) {
            filtered = filtered.filter(t => 
                t.TableNumber.toLowerCase().includes(this.searchKeyword) ||
                t.LocationArea.toLowerCase().includes(this.searchKeyword) ||
                t.Status.toLowerCase().includes(this.searchKeyword)
            );
        }

        // Distinct areas
        const areas = ['Indoor', 'Outdoor', 'Smoking Area', 'VIP Room'];

        root.innerHTML = `
            <div class="container" style="padding-top: 1.5rem; padding-bottom: 3rem;">
                <!-- Header -->
                <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 2rem; flex-wrap: wrap; gap: 1rem; border-bottom: 1px solid var(--border-subtle); padding-bottom: 1.25rem;">
                    <div>
                        <div style="display: flex; align-items: center; gap: 0.6rem; margin-bottom: 0.35rem;">
                            <h1 style="font-size: 2rem; font-family: 'Playfair Display', serif;">Kelola Meja Makan</h1>
                            <span class="role-badge ${user.role.toLowerCase()}">Akses: ${user.role}</span>
                        </div>
                        <p style="color: var(--text-muted); font-size: 0.92rem;">
                            Kelola ketersediaan dan status operasional meja secara real-time untuk pemesanan Dine-In.
                        </p>
                    </div>
                    <div style="display: flex; gap: 0.6rem; flex-wrap: wrap;">
                        <button class="btn btn-outline btn-sm" onclick="TableManagementPage.loadTables().then(() => TableManagementPage.render())">
                            <span class="material-symbols-rounded" style="font-size: 16px;">refresh</span>
                            Segarkan Data
                        </button>
                        <a href="#/dashboard" class="btn btn-outline btn-sm">
                            <span class="material-symbols-rounded" style="font-size: 16px;">dashboard</span>
                            Ke Dashboard
                        </a>
                    </div>
                </div>

                <!-- Summary Cards -->
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 1rem; margin-bottom: 1.75rem;">
                    <div class="card" style="padding: 1rem 1.25rem; display: flex; align-items: center; gap: 0.85rem; cursor: pointer;" onclick="TableManagementPage.setFilterStatus('all')">
                        <div class="pillar-icon-box" style="background: var(--bg-warm); color: var(--primary); width: 44px; height: 44px;">
                            <span class="material-symbols-rounded" style="font-size: 22px;">table_restaurant</span>
                        </div>
                        <div>
                            <div style="font-size: 0.78rem; color: var(--text-muted); font-weight: 500;">Total Meja</div>
                            <div style="font-size: 1.25rem; font-weight: 700; color: var(--text-heading);">${total} Meja</div>
                        </div>
                    </div>

                    <div class="card" style="padding: 1rem 1.25rem; display: flex; align-items: center; gap: 0.85rem; cursor: pointer; border-left: 3px solid var(--success);" onclick="TableManagementPage.setFilterStatus('Available')">
                        <div class="pillar-icon-box" style="background: var(--success-bg); color: var(--success); width: 44px; height: 44px;">
                            <span class="material-symbols-rounded" style="font-size: 22px;">check_circle</span>
                        </div>
                        <div>
                            <div style="font-size: 0.78rem; color: var(--text-muted); font-weight: 500;">Tersedia</div>
                            <div style="font-size: 1.25rem; font-weight: 700; color: var(--success);">${countAvailable} Meja</div>
                        </div>
                    </div>

                    <div class="card" style="padding: 1rem 1.25rem; display: flex; align-items: center; gap: 0.85rem; cursor: pointer; border-left: 3px solid var(--danger);" onclick="TableManagementPage.setFilterStatus('Occupied')">
                        <div class="pillar-icon-box" style="background: var(--danger-bg); color: var(--danger); width: 44px; height: 44px;">
                            <span class="material-symbols-rounded" style="font-size: 22px;">group</span>
                        </div>
                        <div>
                            <div style="font-size: 0.78rem; color: var(--text-muted); font-weight: 500;">Terisi (Occupied)</div>
                            <div style="font-size: 1.25rem; font-weight: 700; color: var(--danger);">${countOccupied} Meja</div>
                        </div>
                    </div>

                    <div class="card" style="padding: 1rem 1.25rem; display: flex; align-items: center; gap: 0.85rem; cursor: pointer; border-left: 3px solid var(--warning);" onclick="TableManagementPage.setFilterStatus('Reserved')">
                        <div class="pillar-icon-box" style="background: var(--warning-bg); color: var(--warning); width: 44px; height: 44px;">
                            <span class="material-symbols-rounded" style="font-size: 22px;">event_seat</span>
                        </div>
                        <div>
                            <div style="font-size: 0.78rem; color: var(--text-muted); font-weight: 500;">Direservasi</div>
                            <div style="font-size: 1.25rem; font-weight: 700; color: var(--warning);">${countReserved} Meja</div>
                        </div>
                    </div>

                    <div class="card" style="padding: 1rem 1.25rem; display: flex; align-items: center; gap: 0.85rem; cursor: pointer; border-left: 3px solid var(--info);" onclick="TableManagementPage.setFilterStatus('Maintenance')">
                        <div class="pillar-icon-box" style="background: var(--info-bg); color: var(--info); width: 44px; height: 44px;">
                            <span class="material-symbols-rounded" style="font-size: 22px;">build</span>
                        </div>
                        <div>
                            <div style="font-size: 0.78rem; color: var(--text-muted); font-weight: 500;">Perbaikan</div>
                            <div style="font-size: 1.25rem; font-weight: 700; color: var(--info);">${countMaintenance} Meja</div>
                        </div>
                    </div>
                </div>

                <!-- Filters & Search Toolbar -->
                <div class="card" style="margin-bottom: 1.5rem; padding: 1.25rem;">
                    <div style="display: flex; gap: 1rem; flex-wrap: wrap; align-items: center; justify-content: space-between;">
                        <div style="display: flex; gap: 0.75rem; flex-wrap: wrap; align-items: center;">
                            <div style="position: relative; min-width: 220px;">
                                <input type="text" class="search-input" placeholder="Cari nomor / area meja..." 
                                       value="${this.searchKeyword}" 
                                       oninput="TableManagementPage.setSearchKeyword(this.value)"
                                       style="width: 100%; padding-left: 2.2rem; height: 38px; font-size: 0.88rem; border-radius: var(--radius-sm); border: 1px solid var(--border-medium); background: #ffffff;">
                                <span class="material-symbols-rounded" style="position: absolute; left: 0.65rem; top: 50%; transform: translateY(-50%); color: var(--text-muted); font-size: 18px;">search</span>
                            </div>

                            <div style="display: flex; gap: 0.5rem; align-items: center;">
                                <span style="font-size: 0.84rem; color: var(--text-muted); font-weight: 600;">Area:</span>
                                <select class="filter-select" 
                                        onchange="TableManagementPage.setFilterArea(this.value)">
                                    <option value="all" ${this.filterArea === 'all' ? 'selected' : ''}>Semua Area (${total})</option>
                                    ${areas.map(a => `<option value="${a}" ${this.filterArea === a ? 'selected' : ''}>${a}</option>`).join('')}
                                </select>
                            </div>

                            <div style="display: flex; gap: 0.5rem; align-items: center;">
                                <span style="font-size: 0.84rem; color: var(--text-muted); font-weight: 600;">Status:</span>
                                <select class="filter-select" 
                                        onchange="TableManagementPage.setFilterStatus(this.value)">
                                    <option value="all" ${this.filterStatus === 'all' ? 'selected' : ''}>Semua Status</option>
                                    <option value="Available" ${this.filterStatus === 'Available' ? 'selected' : ''}>Tersedia (Available)</option>
                                    <option value="Occupied" ${this.filterStatus === 'Occupied' ? 'selected' : ''}>Terisi (Occupied)</option>
                                    <option value="Reserved" ${this.filterStatus === 'Reserved' ? 'selected' : ''}>Direservasi (Reserved)</option>
                                    <option value="Maintenance" ${this.filterStatus === 'Maintenance' ? 'selected' : ''}>Perbaikan (Maintenance)</option>
                                </select>
                            </div>
                        </div>

                        ${(this.filterArea !== 'all' || this.filterStatus !== 'all' || this.searchKeyword) ? `
                            <button class="btn btn-outline btn-sm" onclick="TableManagementPage.filterArea='all'; TableManagementPage.filterStatus='all'; TableManagementPage.searchKeyword=''; TableManagementPage.render();">
                                <span class="material-symbols-rounded" style="font-size: 16px;">close</span>
                                Reset Filter
                            </button>
                        ` : ''}
                    </div>
                </div>

                <!-- Table List Card -->
                <div class="card" style="padding: 0; overflow: visible;">
                    <div style="padding: 1.25rem 1.5rem; border-bottom: 1px solid var(--border-subtle); display: flex; justify-content: space-between; align-items: center;">
                        <h3 style="font-size: 1.15rem; font-family: 'Playfair Display', serif; display: flex; align-items: center; gap: 0.5rem;">
                            <span class="material-symbols-rounded" style="color: var(--primary);">list_alt</span>
                            Daftar Meja Dine-In
                        </h3>
                        <span id="tables-count-badge" style="font-size: 0.85rem; color: var(--text-muted);">
                            Menampilkan <b>${filtered.length}</b> dari <b>${total}</b> meja
                        </span>
                    </div>

                    <div class="data-table-wrap" style="padding: 0;">
                        <table class="data-table" style="margin: 0;">
                            <thead>
                                <tr>
                                    <th style="width: 15%;">Nomor Meja</th>
                                    <th style="width: 20%;">Area Lokasi</th>
                                    <th style="width: 15%;">Kapasitas</th>
                                    <th style="width: 20%;">Status Saat Ini</th>
                                    <th style="width: 30%; text-align: right;">Ubah Status Meja</th>
                                </tr>
                            </thead>
                            <tbody id="tables-table-body">
                                ${this.renderTableRowsHtml(filtered)}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;
    }
};
