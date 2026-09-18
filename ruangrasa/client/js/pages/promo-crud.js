// ==========================================================================
// PROMO & VOUCHER CRUD COMPONENT (Admin & Owner Panel)
// Kelola Promo: List Data, Tambah, Edit, Hapus, dan Toggle Status
// ==========================================================================

const PromoCrudPage = {
    promos: [],
    param: {
        SearchKeyword: '',
        SortBy: 'promoid',
        SortDirection: 'DESC',
        PageNumber: 1,
        PageSize: 10
    },
    totalData: 0,
    totalPages: 1,
    activeModal: null, // 'create', 'edit', 'delete'
    selectedPromo: null,
    isSubmitting: false,

    async init() {
        const user = Api.getCurrentUser();
        if (!user || (user.role !== 'Admin' && user.role !== 'Owner')) {
            Toast.error('Akses ditolak: Hanya Admin dan Owner yang dapat mengelola voucher promo.');
            window.location.hash = '#/403';
            return;
        }

        // Render struktur tampilan seketika (0ms)
        this.render();

        try {
            await this.loadPromos();
        } catch (err) {
            console.warn('PromoCrudPage loadPromos warn:', err);
        }
        this.render();
    },

    async loadPromos(renderFull = false) {
        try {
            const res = await Api.post('/promos/paging', this.param);
            if (res) {
                this.promos = res.Data || res.data || [];
                this.totalData = res.TotalData ?? res.totalData ?? this.promos.length;
                this.totalPages = res.TotalPages ?? res.totalPages ?? 1;
                if (renderFull) {
                    this.render();
                } else {
                    this.renderTableOnly();
                }
            }
        } catch (err) {
            console.warn('Error load promos:', err);
            if (renderFull) {
                this.render();
            } else {
                this.renderTableOnly();
            }
        }
    },

    setSearch(kw) {
        this.param.SearchKeyword = kw;
        this.param.PageNumber = 1;
        if (this.searchDebounceTimer) clearTimeout(this.searchDebounceTimer);
        this.searchDebounceTimer = setTimeout(() => {
            this.loadPromos(false);
        }, 250);
    },

    setSorting(sortVal) {
        const [by, dir] = sortVal.split('-');
        this.param.SortBy = by;
        this.param.SortDirection = dir;
        this.param.PageNumber = 1;
        this.loadPromos().then(() => this.renderTableOnly());
    },

    setPage(page) {
        if (page < 1 || page > this.totalPages) return;
        this.param.PageNumber = page;
        this.loadPromos().then(() => this.renderTableOnly());
    },

    setPageSize(size) {
        this.param.PageSize = parseInt(size) || 10;
        this.param.PageNumber = 1;
        this.loadPromos().then(() => this.renderTableOnly());
    },

    renderTableOnly() {
        const tableBody = document.getElementById('promo-table-body');
        const paginationFooter = document.getElementById('promo-pagination-footer');
        if (!tableBody || !paginationFooter) {
            this.render();
            return;
        }
        tableBody.innerHTML = this.renderTableRowsHtml();
        paginationFooter.innerHTML = this.renderPaginationHtml();
    },

    renderTableRowsHtml() {
        if (this.promos.length === 0) {
            return `
                <tr>
                    <td colspan="6" style="text-align: center; padding: 3.5rem 1rem; color: var(--text-muted);">
                        <span class="material-symbols-rounded" style="font-size: 40px; color: var(--border-medium); display: block; margin-bottom: 0.5rem;">sentiment_dissatisfied</span>
                        Tidak ada data voucher promo ditemukan.
                    </td>
                </tr>
            `;
        }
        return this.promos.map(p => {
            const id = p.PromoId ?? p.promoId;
            const code = p.PromoCode ?? p.promoCode;
            const title = p.Title ?? p.title;
            const desc = p.Description ?? p.description;
            const discType = p.DiscountType ?? p.discountType ?? 'Percentage';
            const discVal = Number(p.DiscountValue ?? p.discountValue ?? 0);
            const minOrder = Number(p.MinOrderAmount ?? p.minOrderAmount ?? 0);
            const maxDisc = p.MaxDiscountAmount ?? p.maxDiscountAmount;
            const badge = p.BadgeText ?? p.badgeText ?? 'PROMO';
            const isActive = (p.IsActive ?? p.isActive) !== false;

            return `
                <tr style="border-bottom: 1px solid var(--border-subtle); transition: var(--transition);">
                    <td style="padding: 1rem 1.25rem;">
                        <div style="font-family: monospace; font-weight: 800; font-size: 1rem; color: var(--primary); letter-spacing: 0.05em;">
                            ${code}
                        </div>
                        <span class="promo-badge" style="padding: 0.15rem 0.5rem; font-size: 0.65rem; margin-top: 0.25rem; margin-bottom: 0;">
                            ${badge}
                        </span>
                    </td>

                    <td style="padding: 1rem 1.25rem; max-width: 280px;">
                        <div style="font-weight: 700; color: var(--text-heading); font-size: 0.95rem;">${title}</div>
                        <div style="font-size: 0.78rem; color: var(--text-muted); margin-top: 0.2rem; line-height: 1.35;">${desc || '-'}</div>
                    </td>

                    <td style="padding: 1rem 1.25rem;">
                        <div style="font-weight: 700; color: var(--accent); font-size: 1rem;">
                            ${discType === 'Percentage' ? `${discVal}%` : App.formatRupiah(discVal)}
                        </div>
                        <div style="font-size: 0.75rem; color: var(--text-muted);">
                            ${discType === 'Percentage' ? (maxDisc ? `Maks. ${App.formatRupiah(maxDisc)}` : 'Tanpa batas maks.') : 'Potongan Langsung'}
                        </div>
                    </td>

                    <td style="padding: 1rem 1.25rem;">
                        <div style="font-size: 0.85rem; color: var(--text-heading);">
                            Min. Belanja: <strong>${minOrder > 0 ? App.formatRupiah(minOrder) : 'Tanpa Min.'}</strong>
                        </div>
                        ${code === 'FREESHIP' ? `
                            <span style="font-size: 0.72rem; color: var(--info); font-weight: 600;">Khusus Layanan Delivery</span>
                        ` : ''}
                    </td>

                    <td style="padding: 1rem 1.25rem; text-align: center;">
                        <button type="button" 
                                onclick="PromoCrudPage.toggleStatus(${id})" 
                                style="background: transparent; border: none; cursor: pointer;" 
                                title="Klik untuk ubah status">
                            <span class="status-pill ${isActive ? 'ready' : 'cancelled'}" style="cursor: pointer;">
                                ${isActive ? 'Aktif' : 'Nonaktif'}
                            </span>
                        </button>
                    </td>

                    <td style="padding: 1rem 1.25rem; text-align: right;">
                        <div style="display: inline-flex; gap: 0.4rem;">
                            <button class="btn btn-outline btn-sm" 
                                    style="padding: 0.35rem 0.65rem;" 
                                    onclick="PromoCrudPage.openEditModal(${id})" 
                                    title="Edit Promo">
                                <span class="material-symbols-rounded" style="font-size: 16px;">edit</span>
                                Edit
                            </button>
                            <button class="btn btn-outline btn-sm" 
                                    style="padding: 0.35rem 0.65rem; color: var(--danger); border-color: rgba(156,46,46,0.3);" 
                                    onclick="PromoCrudPage.openDeleteModal(${id})" 
                                    title="Hapus Promo">
                                <span class="material-symbols-rounded" style="font-size: 16px;">delete</span>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    },

    renderPaginationHtml() {
        return `
            <div style="display: flex; align-items: center; gap: 0.75rem; font-size: 0.85rem; color: var(--text-muted);">
                <span>Tampilkan:</span>
                <select class="select-control" style="padding: 0.25rem 0.6rem; font-size: 0.85rem; height: auto; width: auto;" onchange="PromoCrudPage.setPageSize(this.value)">
                    <option value="5" ${this.param.PageSize === 5 ? 'selected' : ''}>5 per halaman</option>
                    <option value="10" ${this.param.PageSize === 10 ? 'selected' : ''}>10 per halaman</option>
                    <option value="20" ${this.param.PageSize === 20 ? 'selected' : ''}>20 per halaman</option>
                    <option value="50" ${this.param.PageSize === 50 ? 'selected' : ''}>50 per halaman</option>
                </select>
                <span>| Menampilkan <b>${this.promos.length}</b> dari <b>${this.totalData}</b> voucher (Hal. <b>${this.param.PageNumber}</b>/<b>${this.totalPages}</b>)</span>
            </div>
            ${this.totalPages > 1 ? `
                <div style="display: flex; gap: 0.35rem;">
                    <button class="btn btn-outline btn-sm" 
                            ${this.param.PageNumber <= 1 ? 'disabled' : ''} 
                            onclick="PromoCrudPage.setPage(${this.param.PageNumber - 1})">
                        <span class="material-symbols-rounded" style="font-size: 16px;">chevron_left</span>
                    </button>
                    <span style="display: flex; align-items: center; padding: 0 0.75rem; font-size: 0.85rem; font-weight: 600;">
                        Halaman ${this.param.PageNumber} dari ${this.totalPages}
                    </span>
                    <button class="btn btn-outline btn-sm" 
                            ${this.param.PageNumber >= this.totalPages ? 'disabled' : ''} 
                            onclick="PromoCrudPage.setPage(${this.param.PageNumber + 1})">
                        <span class="material-symbols-rounded" style="font-size: 16px;">chevron_right</span>
                    </button>
                </div>
            ` : ''}
        `;
    },

    openCreateModal() {
        this.activeModal = 'create';
        this.selectedPromo = {
            PromoId: 0,
            PromoCode: '',
            Title: '',
            Description: '',
            DiscountType: 'Percentage',
            DiscountValue: 10,
            MinOrderAmount: 0,
            MaxDiscountAmount: 20000,
            BadgeText: 'PROMO',
            IsActive: true,
            ExpiryDate: null
        };
        this.renderModal();
    },

    openEditModal(promoId) {
        const promo = this.promos.find(p => (p.PromoId ?? p.promoId) === promoId);
        if (!promo) return;
        this.activeModal = 'edit';
        this.selectedPromo = {
            PromoId: promo.PromoId ?? promo.promoId,
            PromoCode: promo.PromoCode ?? promo.promoCode ?? '',
            Title: promo.Title ?? promo.title ?? '',
            Description: promo.Description ?? promo.description ?? '',
            DiscountType: promo.DiscountType ?? promo.discountType ?? 'Percentage',
            DiscountValue: Number(promo.DiscountValue ?? promo.discountValue ?? 0),
            MinOrderAmount: Number(promo.MinOrderAmount ?? promo.minOrderAmount ?? 0),
            MaxDiscountAmount: promo.MaxDiscountAmount ?? promo.maxDiscountAmount ?? null,
            BadgeText: promo.BadgeText ?? promo.badgeText ?? 'PROMO',
            IsActive: (promo.IsActive ?? promo.isActive) !== false,
            ExpiryDate: promo.ExpiryDate ?? promo.expiryDate ?? null
        };
        this.renderModal();
    },

    openDeleteModal(promoId) {
        const promo = this.promos.find(p => (p.PromoId ?? p.promoId) === promoId);
        if (!promo) return;
        this.activeModal = 'delete';
        this.selectedPromo = promo;
        this.renderModal();
    },

    closeModal() {
        this.activeModal = null;
        this.selectedPromo = null;
        const modalContainer = document.getElementById('promo-modal-root');
        if (modalContainer) modalContainer.innerHTML = '';
    },

    async toggleStatus(promoId) {
        const promo = this.promos.find(p => (p.PromoId ?? p.promoId) === promoId);
        if (!promo) return;

        const currentStatus = (promo.IsActive ?? promo.isActive) !== false;
        const payload = {
            ...promo,
            IsActive: !currentStatus
        };

        try {
            Toast.info('Memperbarui status voucher...');
            const res = await Api.put(`/promos/${promoId}`, payload);
            if (res && (res.Success || res.success)) {
                Toast.success(`Status voucher ${promo.PromoCode || promo.promoCode} berhasil diubah!`);
                await this.loadPromos();
            } else {
                Toast.error(res?.Message || 'Gagal mengubah status voucher.');
            }
        } catch (err) {
            Toast.error('Terjadi kesalahan saat mengubah status voucher.');
        }
    },

    async savePromo(e) {
        if (e) e.preventDefault();
        if (this.isSubmitting) return;

        const codeInput = document.getElementById('promo-code');
        const titleInput = document.getElementById('promo-title');
        const typeInput = document.getElementById('promo-type');
        const valueInput = document.getElementById('promo-value');
        const minOrderInput = document.getElementById('promo-min-order');
        const maxDiscInput = document.getElementById('promo-max-disc');
        const badgeInput = document.getElementById('promo-badge');
        const descInput = document.getElementById('promo-desc');
        const activeInput = document.getElementById('promo-is-active');

        if (!codeInput || !titleInput || !valueInput) return;

        const code = codeInput.value.trim().toUpperCase();
        const title = titleInput.value.trim();
        const discType = typeInput.value;
        const discVal = Number(valueInput.value);
        const minOrder = Number(minOrderInput?.value || 0);
        const maxDisc = maxDiscInput?.value ? Number(maxDiscInput.value) : null;
        const badge = (badgeInput?.value || 'PROMO').trim();
        const desc = descInput?.value || '';
        const isActive = activeInput ? activeInput.checked : true;

        if (!code) {
            Toast.error('Kode promo wajib diisi.');
            codeInput.focus();
            return;
        }

        if (!title) {
            Toast.error('Judul promo wajib diisi.');
            titleInput.focus();
            return;
        }

        if (discVal <= 0) {
            Toast.error('Nilai diskon harus lebih besar dari 0.');
            valueInput.focus();
            return;
        }

        if (discType === 'Percentage' && discVal > 100) {
            Toast.error('Diskon persentase tidak boleh melebihi 100%.');
            valueInput.focus();
            return;
        }

        const payload = {
            PromoId: this.selectedPromo.PromoId || 0,
            PromoCode: code,
            Title: title,
            Description: desc,
            DiscountType: discType,
            DiscountValue: discVal,
            MinOrderAmount: minOrder,
            MaxDiscountAmount: maxDisc,
            BadgeText: badge,
            IsActive: isActive
        };

        try {
            this.isSubmitting = true;
            Toast.info('Sedang menyimpan voucher promo...');

            let res;
            if (this.activeModal === 'create') {
                res = await Api.post('/promos', payload);
            } else {
                res = await Api.put(`/promos/${payload.PromoId}`, payload);
            }

            if (res && (res.Success || res.success)) {
                Toast.success(res.Message || 'Voucher promo berhasil disimpan!');
                this.closeModal();
                await this.loadPromos();
            } else {
                Toast.error(res?.Message || 'Gagal menyimpan voucher promo.');
            }
        } catch (err) {
            Toast.error(err.message || 'Terjadi kesalahan sistem saat menyimpan.');
        } finally {
            this.isSubmitting = false;
        }
    },

    async confirmDelete() {
        if (!this.selectedPromo) return;
        const promoId = this.selectedPromo.PromoId ?? this.selectedPromo.promoId;
        const code = this.selectedPromo.PromoCode ?? this.selectedPromo.promoCode;

        try {
            Toast.info(`Menghapus voucher ${code}...`);
            const res = await Api.delete(`/promos/${promoId}`);
            if (res && (res.Success || res.success)) {
                Toast.success(`Voucher ${code} berhasil dihapus.`);
                this.closeModal();
                await this.loadPromos();
            } else {
                Toast.error(res?.Message || 'Gagal menghapus voucher promo.');
            }
        } catch (err) {
            Toast.error('Terjadi kesalahan saat menghapus voucher.');
        }
    },

    render() {
        const root = document.getElementById('page-root');
        if (!root) return;

        root.innerHTML = `
            <div class="container">
                <!-- Header Breadcrumb & Title -->
                <div style="margin-bottom: 2rem; border-bottom: 1px solid var(--border-subtle); padding-bottom: 1.25rem;">
                    <div style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.85rem; color: var(--text-muted); margin-bottom: 0.5rem;">
                        <a href="#/dashboard">Dashboard</a>
                        <span>/</span>
                        <span style="color: var(--text-heading); font-weight: 600;">Kelola Voucher Promo</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; align-items: flex-end; flex-wrap: wrap; gap: 1rem;">
                        <div>
                            <div style="display: flex; align-items: center; gap: 0.65rem;">
                                <span class="material-symbols-rounded" style="font-size: 2.2rem; color: var(--accent);">local_activity</span>
                                <h1 style="font-size: 2.2rem; margin: 0;">Kelola Voucher Promo</h1>
                            </div>
                            <p style="color: var(--text-muted); margin-top: 0.35rem; font-size: 0.95rem;">
                                Manajemen voucher diskon, potongan harga, dan penawaran spesial pelanggan Ruang Rasa.
                            </p>
                        </div>
                        <button type="button" class="btn btn-primary" onclick="PromoCrudPage.openCreateModal()">
                            <span class="material-symbols-rounded">add_circle</span>
                            Tambah Promo Baru
                        </button>
                    </div>
                </div>

                <!-- Toolbar Search & Sorting -->
                <div class="filter-toolbar" style="margin-bottom: 1.5rem;">
                    <div class="search-field" style="flex: 1; min-width: 260px;">
                        <span class="material-symbols-rounded search-icon">search</span>
                        <input type="text" placeholder="Cari kode kupon, judul promo..." 
                               value="${this.param.SearchKeyword}" 
                               oninput="PromoCrudPage.setSearch(this.value)" />
                    </div>

                    <select class="select-control" onchange="PromoCrudPage.setSorting(this.value)">
                        <option value="promoid-DESC">Terbaru</option>
                        <option value="promoid-ASC">Terlama</option>
                        <option value="promocode-ASC">Kode: A ke Z</option>
                        <option value="discountvalue-DESC">Diskon: Terbesar</option>
                        <option value="minorderamount-ASC">Min. Belanja: Terkecil</option>
                    </select>
                </div>

                <!-- Table Card -->
                <div class="card" style="padding: 0; overflow: hidden; border-radius: var(--radius-md);">
                    <div style="overflow-x: auto;">
                        <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 0.92rem;">
                            <thead>
                                <tr style="background: var(--bg-warm); border-bottom: 1px solid var(--border-medium); color: var(--text-muted); font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.05em;">
                                    <th style="padding: 1rem 1.25rem;">Kode & Badge</th>
                                    <th style="padding: 1rem 1.25rem;">Judul & Deskripsi</th>
                                    <th style="padding: 1rem 1.25rem;">Tipe & Nilai Potongan</th>
                                    <th style="padding: 1rem 1.25rem;">Ketentuan Belanja</th>
                                    <th style="padding: 1rem 1.25rem; text-align: center;">Status</th>
                                    <th style="padding: 1rem 1.25rem; text-align: right;">Aksi</th>
                                </tr>
                            </thead>
                            <tbody id="promo-table-body">
                                ${this.renderTableRowsHtml()}
                            </tbody>
                        </table>
                    </div>

                    <!-- Pagination Footer (Poin 7 PDF: Prev, Next, Nomor Halaman, Info Jumlah Data, Limit Selector) -->
                    <div id="promo-pagination-footer" style="padding: 1rem 1.25rem; border-top: 1px solid var(--border-subtle); display: flex; justify-content: space-between; align-items: center; background: var(--bg-surface); flex-wrap: wrap; gap: 1rem;">
                        ${this.renderPaginationHtml()}
                    </div>
                </div>

                <!-- Modal Container Root -->
                <div id="promo-modal-root"></div>
            </div>
        `;
    },

    renderModal() {
        const modalContainer = document.getElementById('promo-modal-root');
        if (!modalContainer) return;

        if (!this.activeModal || !this.selectedPromo) {
            modalContainer.innerHTML = '';
            return;
        }

        // 1. Modal Hapus
        if (this.activeModal === 'delete') {
            const code = this.selectedPromo.PromoCode ?? this.selectedPromo.promoCode;
            const title = this.selectedPromo.Title ?? this.selectedPromo.title;

            modalContainer.innerHTML = `
                <div class="modal-backdrop" onclick="PromoCrudPage.closeModal()">
                    <div class="modal-card" style="max-width: 440px;" onclick="event.stopPropagation()">
                        <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1.25rem; color: var(--danger);">
                            <span class="material-symbols-rounded" style="font-size: 32px;">warning</span>
                            <h3 style="margin: 0; font-size: 1.3rem;">Hapus Voucher Promo?</h3>
                        </div>
                        <p style="color: var(--text-muted); font-size: 0.95rem; margin-bottom: 1.5rem; line-height: 1.5;">
                            Apakah Anda yakin ingin menghapus voucher <strong>"${code}"</strong> (${title})? Kupon ini tidak akan dapat digunakan lagi oleh pelanggan.
                        </p>
                        <div style="display: flex; justify-content: flex-end; gap: 0.75rem;">
                            <button type="button" class="btn btn-outline" onclick="PromoCrudPage.closeModal()">Batal</button>
                            <button type="button" class="btn btn-primary" style="background: var(--danger); border-color: var(--danger);" onclick="PromoCrudPage.confirmDelete()">
                                <span class="material-symbols-rounded" style="font-size: 18px;">delete</span>
                                Ya, Hapus Voucher
                            </button>
                        </div>
                    </div>
                </div>
            `;
            return;
        }

        // 2. Modal Tambah / Edit
        const isEdit = this.activeModal === 'edit';
        const p = this.selectedPromo;

        modalContainer.innerHTML = `
            <div class="modal-backdrop" onclick="PromoCrudPage.closeModal()">
                <div class="modal-card" style="max-width: 580px;" onclick="event.stopPropagation()">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; border-bottom: 1px solid var(--border-subtle); padding-bottom: 1rem;">
                        <h3 style="margin: 0; font-size: 1.3rem; display: flex; align-items: center; gap: 0.5rem;">
                            <span class="material-symbols-rounded" style="color: var(--accent);">${isEdit ? 'edit_note' : 'add_circle'}</span>
                            ${isEdit ? 'Edit Voucher Promo' : 'Tambah Voucher Promo Baru'}
                        </h3>
                        <button type="button" class="btn btn-outline btn-sm" style="padding: 0.25rem 0.5rem; border-radius: 50%;" onclick="PromoCrudPage.closeModal()">
                            <span class="material-symbols-rounded" style="font-size: 18px;">close</span>
                        </button>
                    </div>

                    <form onsubmit="PromoCrudPage.savePromo(event)">
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                            <div class="form-group">
                                <label class="form-label">Kode Promo <span style="color:var(--danger)">*</span></label>
                                <input type="text" id="promo-code" class="form-control" 
                                       style="text-transform: uppercase; font-family: monospace; font-weight: 800; letter-spacing: 0.05em;" 
                                       placeholder="Contoh: HEMAT20" 
                                       value="${p.PromoCode}" required />
                            </div>

                            <div class="form-group">
                                <label class="form-label">Badge Promo</label>
                                <input type="text" id="promo-badge" class="form-control" 
                                       placeholder="Contoh: DISKON 20%, FREE ONGKIR" 
                                       value="${p.BadgeText || 'PROMO'}" />
                            </div>
                        </div>

                        <div class="form-group">
                            <label class="form-label">Judul Promo <span style="color:var(--danger)">*</span></label>
                            <input type="text" id="promo-title" class="form-control" 
                                   placeholder="Contoh: Diskon Pelanggan Baru 20%" 
                                   value="${p.Title}" required />
                        </div>

                        <div class="form-group">
                            <label class="form-label">Deskripsi Promo</label>
                            <textarea id="promo-desc" class="form-control" rows="2" 
                                      placeholder="Penjelasan ringkas syarat atau manfaat promo...">${p.Description || ''}</textarea>
                        </div>

                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                            <div class="form-group">
                                <label class="form-label">Tipe Diskon <span style="color:var(--danger)">*</span></label>
                                <select id="promo-type" class="form-control" onchange="PromoCrudPage.handleTypeChange(this.value)">
                                    <option value="Percentage" ${p.DiscountType === 'Percentage' ? 'selected' : ''}>Persentase (%)</option>
                                    <option value="FixedAmount" ${p.DiscountType === 'FixedAmount' ? 'selected' : ''}>Nominal Rupiah (Rp)</option>
                                </select>
                            </div>

                            <div class="form-group">
                                <label class="form-label" id="label-discount-val">Nilai Diskon (% atau Rp) <span style="color:var(--danger)">*</span></label>
                                <input type="number" id="promo-value" class="form-control" 
                                       value="${p.DiscountValue}" min="1" step="any" required />
                            </div>
                        </div>

                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                            <div class="form-group">
                                <label class="form-label">Min. Belanja (Rp)</label>
                                <input type="number" id="promo-min-order" class="form-control" 
                                       value="${p.MinOrderAmount || 0}" min="0" step="1000" />
                            </div>

                            <div class="form-group" id="group-max-disc">
                                <label class="form-label">Maks. Potongan (Rp)</label>
                                <input type="number" id="promo-max-disc" class="form-control" 
                                       placeholder="Kosongkan jika tanpa batas" 
                                       value="${p.MaxDiscountAmount || ''}" min="0" step="1000" />
                            </div>
                        </div>

                        <div class="form-group" style="margin-top: 0.5rem;">
                            <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                                <input type="checkbox" id="promo-is-active" ${p.IsActive ? 'checked' : ''} style="width: 18px; height: 18px;" />
                                <span style="font-weight: 600; font-size: 0.95rem;">Aktifkan voucher ini (dapat digunakan pelanggan)</span>
                            </label>
                        </div>

                        <div style="display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 1.5rem; border-top: 1px solid var(--border-subtle); padding-top: 1rem;">
                            <button type="button" class="btn btn-outline" onclick="PromoCrudPage.closeModal()">Batal</button>
                            <button type="submit" class="btn btn-primary" ${this.isSubmitting ? 'disabled' : ''}>
                                <span class="material-symbols-rounded" style="font-size: 18px;">save</span>
                                <span>${this.isSubmitting ? 'Menyimpan...' : 'Simpan Voucher'}</span>
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;
    },

    handleTypeChange(type) {
        const groupMaxDisc = document.getElementById('group-max-disc');
        const labelDiscVal = document.getElementById('label-discount-val');
        if (groupMaxDisc) {
            groupMaxDisc.style.display = type === 'Percentage' ? 'block' : 'none';
        }
        if (labelDiscVal) {
            labelDiscVal.textContent = type === 'Percentage' ? 'Nilai Diskon (%) *' : 'Nilai Potongan (Rp) *';
        }
    }
};
