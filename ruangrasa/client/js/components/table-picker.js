// ==========================================================================
// TABLE PICKER COMPONENT (Denah Meja Dine-In dengan Google Material Symbols)
// ==========================================================================

const TablePicker = {
    tables: [],
    selectedArea: 'All',
    isOpen: false,

    async openModal() {
        this.isOpen = true;
        await this.loadTables();
        this.render();
    },

    closeModal() {
        this.isOpen = false;
        const container = document.getElementById('table-modal-root');
        if (container) container.innerHTML = '';
    },

    async loadTables() {
        try {
            const res = await Api.get('/tables');
            if (res && res.data) {
                this.tables = res.data;
                if (this.isOpen) {
                    this.render();
                }
            }
        } catch (err) {
            console.error('Gagal mengambil data meja:', err);
            Toast.error('Gagal memuat status ketersediaan meja.');
        }
    },

    setArea(area) {
        this.selectedArea = area;
        this.render();
    },

    selectTable(table) {
        if (table.Status !== 'Available') {
            Toast.warning(`${table.TableNumber} sedang ${table.Status === 'Occupied' ? 'terisi' : 'direservasi'}. Silakan pilih meja lain.`);
            return;
        }

        App.selectedTable = table;
        const displayName = (table.TableNumber || '').toLowerCase().startsWith('meja') 
            ? table.TableNumber 
            : `Meja ${table.TableNumber}`;
        Toast.success(`${displayName} (${table.LocationArea}) berhasil dipilih.`);
        
        // Tutup modal meja dan perbarui tampilan checkout keranjang
        this.closeModal();
        if (typeof CartPage !== 'undefined') {
            if (typeof CartPage.saveStateFromDom === 'function') {
                CartPage.saveStateFromDom();
            }
            if (typeof CartPage.render === 'function') {
                CartPage.render();
            }
        }
        if (typeof CartModal !== 'undefined' && CartModal.isOpen) {
            CartModal.render();
        }
    },

    render() {
        const container = document.getElementById('table-modal-root');
        if (!container || !this.isOpen) return;

        const filtered = this.selectedArea === 'All' 
            ? this.tables 
            : this.tables.filter(t => t.LocationArea.toLowerCase().includes(this.selectedArea.toLowerCase()));

        const areas = ['All', 'Indoor', 'Outdoor', 'Smoking Area', 'VIP Room'];

        container.innerHTML = `
            <div class="modal-overlay" style="z-index: 1050;" onclick="if(event.target === this) TablePicker.closeModal()">
                <div class="modal-dialog animate-scale-in" style="max-width: 680px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem; border-bottom: 1px solid var(--border-subtle); padding-bottom: 0.85rem;">
                        <div style="display: flex; align-items: center; gap: 0.5rem;">
                            <span class="material-symbols-rounded" style="color: var(--primary); font-size: 24px;">table_restaurant</span>
                            <div>
                                <h3 style="font-size: 1.35rem; margin: 0; font-family: 'Playfair Display', serif;">Pilih Meja Dine-In</h3>
                                <p style="color: var(--text-muted); font-size: 0.82rem; margin: 0.2rem 0 0 0;">
                                    Pilih meja yang bertanda hijau (<b style="color: var(--success);">Available</b>).
                                </p>
                            </div>
                        </div>
                        <button class="btn btn-outline btn-sm" onclick="TablePicker.closeModal()" title="Tutup">
                            <span class="material-symbols-rounded" style="font-size: 18px;">close</span>
                        </button>
                    </div>

                    <!-- Tabs Filter Area -->
                    <div class="table-area-nav" style="margin-bottom: 1rem;">
                        ${areas.map(a => `
                            <button class="table-tab-btn ${this.selectedArea === a ? 'active' : ''}" 
                                    onclick="TablePicker.setArea('${a}')">${a}</button>
                        `).join('')}
                    </div>

                    <!-- Legend Status Meja -->
                    <div class="table-legend-bar" style="margin-bottom: 1.2rem;">
                        <div class="legend-chip">
                            <span class="status-dot available"></span>
                            <span>Tersedia</span>
                        </div>
                        <div class="legend-chip">
                            <span class="status-dot occupied"></span>
                            <span>Terisi</span>
                        </div>
                        <div class="legend-chip">
                            <span class="status-dot reserved"></span>
                            <span>Direservasi</span>
                        </div>
                    </div>

                    <!-- Grid Denah Meja -->
                    <div class="table-grid-view" style="max-height: 50vh; overflow-y: auto; padding: 0.25rem;">
                        ${filtered.length === 0 ? `
                            <div style="grid-column: 1 / -1; text-align: center; padding: 2rem; color: var(--text-muted);">
                                Tidak ada meja di area ini.
                            </div>
                        ` : filtered.map(t => {
                            const isSelected = App.selectedTable && App.selectedTable.TableId === t.TableId;
                            const statusKey = (t.Status || 'available').toLowerCase();
                            return `
                                <div class="table-node card-hover-lift ${statusKey} ${isSelected ? 'selected' : ''}" 
                                     onclick='TablePicker.selectTable(${JSON.stringify(t)})'>
                                    <div class="table-node-number">${t.TableNumber}</div>
                                    <div class="table-node-capacity">
                                        <span class="material-symbols-rounded" style="font-size: 14px;">group</span>
                                        ${t.Capacity} Kursi
                                    </div>
                                    <div style="font-size: 0.72rem; color: var(--text-light); margin-top: 0.2rem;">${t.LocationArea}</div>
                                    <span class="table-node-status">${isSelected ? 'Dipilih' : t.Status}</span>
                                </div>
                            `;
                        }).join('')}
                    </div>

                    <!-- Footer Action -->
                    <div style="margin-top: 1.5rem; display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--border-subtle); padding-top: 1rem;">
                        <div style="font-size: 0.85rem; color: var(--text-muted);">
                            ${App.selectedTable ? `Terpilih saat ini: <b style="color: var(--text-heading);">${App.selectedTable.TableNumber}</b>` : 'Belum ada meja yang dipilih'}
                        </div>
                        <div style="display: flex; gap: 0.5rem;">
                            ${App.selectedTable ? `
                                <button class="btn btn-outline btn-sm" onclick="App.selectedTable = null; TablePicker.render(); if (window.CartPage) CartPage.render(); if (window.CartModal && CartModal.isOpen) CartModal.render();">
                                    Batal Pilih
                                </button>
                            ` : ''}
                            <button class="btn btn-secondary btn-sm" onclick="TablePicker.closeModal()">Tutup</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
};

window.TablePicker = TablePicker;
