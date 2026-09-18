// ==========================================================================
// MENU CRUD COMPONENT (Sesuai Poin 5 & 8 PDF: CRUD Lengkap & Upload File)
// List Data, Detail Data, Tambah Data, Edit Data, Hapus Data + Upload Gambar
// ==========================================================================

const MenuCrudPage = {
    menus: [],
    categories: [],
    param: {
        SearchKeyword: '',
        Category: '',
        SortBy: 'name',
        SortDirection: 'ASC',
        PageNumber: 1,
        PageSize: 10
    },
    totalData: 0,
    totalPages: 1,
    activeModal: null, // 'create', 'edit', 'detail'
    selectedMenu: null,

    async init() {
        const user = Api.getCurrentUser();
        if (!user || (user.role !== 'Admin' && user.role !== 'Owner')) {
            Toast.error('Akses ditolak: Hanya Admin dan Owner yang dapat mengelola data menu.');
            window.location.hash = '#/403';
            return;
        }

        // Render struktur tampilan instan (0ms) tanpa menunggu request jaringan
        this.render();

        try {
            await Promise.all([
                this.loadCategories(),
                this.loadMenus()
            ]);
        } catch (err) {
            console.warn('MenuCrudPage init load warn:', err);
        }
        this.render();
    },

    async loadCategories() {
        try {
            const res = await Api.get('/categories');
            if (res && (res.data || res.Data)) {
                this.categories = res.data || res.Data;
            }
        } catch (err) {
            console.error('Error load categories:', err);
        }
    },

    async loadMenus() {
        try {
            const res = await Api.post('/menus/paging', this.param);
            if (res) {
                this.menus = res.Data || res.data || (Array.isArray(res) ? res : []);
                this.totalData = res.TotalData ?? res.totalData ?? this.menus.length;
                this.totalPages = res.TotalPages ?? res.totalPages ?? 1;
                this.render();
            }
        } catch (err) {
            console.warn('Gagal mengambil data menu:', err);
            this.render();
        }
    },

    setSearch(kw) {
        this.param.SearchKeyword = kw;
        this.param.PageNumber = 1;
        this.loadMenus();
    },

    setCategory(cat) {
        this.param.Category = cat;
        this.param.PageNumber = 1;
        this.loadMenus();
    },

    setPage(page) {
        if (page < 1 || page > this.totalPages) return;
        this.param.PageNumber = page;
        this.loadMenus();
    },

    setPageSize(size) {
        this.param.PageSize = parseInt(size) || 10;
        this.param.PageNumber = 1;
        this.loadMenus();
    },

    openCreateModal() {
        this.activeModal = 'create';
        this.selectedMenu = {
            MenuId: 0,
            CategoryId: this.categories[0]?.CategoryId || 1,
            Name: '',
            Description: '',
            Price: 25000,
            Stock: 100,
            ImageUrl: '',
            IsAvailable: true
        };
        this.renderModal();
    },

    openEditModal(menuId) {
        const menu = this.menus.find(m => m.MenuId === menuId);
        if (!menu) return;
        this.activeModal = 'edit';
        this.selectedMenu = { ...menu };
        this.renderModal();
    },

    openDetailModal(menuId) {
        const menu = this.menus.find(m => m.MenuId === menuId);
        if (!menu) return;
        this.activeModal = 'detail';
        this.selectedMenu = menu;
        this.renderModal();
    },

    closeModal() {
        this.activeModal = null;
        this.selectedMenu = null;
        const modalRoot = document.getElementById('crud-modal-root');
        if (modalRoot) modalRoot.innerHTML = '';
    },

    async handleImageUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            Toast.error('Harap pilih berkas gambar (JPG, PNG, atau WEBP).');
            return;
        }

        const previewEl = document.getElementById('menu-image-preview');
        const urlInput = document.getElementById('menu-image-url');

        // Tampilkan instant preview lokal
        const localUrl = URL.createObjectURL(file);
        if (previewEl) {
            previewEl.src = localUrl;
            previewEl.style.display = 'block';
        }

        try {
            Toast.info('Mengunggah berkas ke server...');
            const uploadRes = await Api.upload(file);
            if (uploadRes && uploadRes.success && uploadRes.data) {
                if (urlInput) urlInput.value = uploadRes.data.fileUrl;
                if (previewEl) previewEl.src = uploadRes.data.fileUrl;
                if (previewEl && previewEl.parentElement) previewEl.parentElement.style.display = 'flex';
                Toast.success('Foto menu berhasil diunggah ke server!');
            } else {
                // Fallback to Base64 preview data
                const reader = new FileReader();
                reader.onload = (e) => {
                    if (urlInput) urlInput.value = e.target.result;
                    if (previewEl) {
                        previewEl.src = e.target.result;
                        if (previewEl.parentElement) previewEl.parentElement.style.display = 'flex';
                    }
                };
                reader.readAsDataURL(file);
                Toast.info('Foto dimuat secara lokal.');
            }
        } catch (err) {
            console.warn('Upload server fallback ke data URL:', err);
            const reader = new FileReader();
            reader.onload = (e) => {
                if (urlInput) urlInput.value = e.target.result;
                if (previewEl) {
                    previewEl.src = e.target.result;
                    if (previewEl.parentElement) previewEl.parentElement.style.display = 'flex';
                }
            };
            reader.readAsDataURL(file);
            Toast.info('Foto dimuat sebagai pratinjau lokal.');
        }
    },

    async saveMenu(e) {
        e.preventDefault();

        const name = document.getElementById('modal-menu-name').value.trim();
        const catId = parseInt(document.getElementById('modal-menu-cat').value);
        const price = parseFloat(document.getElementById('modal-menu-price').value);
        const stock = parseInt(document.getElementById('modal-menu-stock').value);
        const desc = document.getElementById('modal-menu-desc').value.trim();
        const imgUrl = document.getElementById('menu-image-url').value;

        if (!name || isNaN(price) || price <= 0) {
            Toast.error('Nama dan harga menu wajib diisi dengan benar.');
            return;
        }

        const isAvailable = document.getElementById('modal-menu-available')?.checked ?? true;

        const payload = {
            CategoryId: catId,
            Name: name,
            Description: desc,
            Price: price,
            Stock: stock,
            ImageUrl: imgUrl || 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=600&q=80',
            IsAvailable: isAvailable
        };

        try {
            if (this.activeModal === 'create') {
                const res = await Api.post('/menus', payload);
                if (res && res.Success) {
                    Toast.success(res.Message || `Menu "${name}" berhasil ditambahkan ke database!`);
                } else {
                    Toast.error((res && res.Message) || 'Gagal menambahkan menu ke database.');
                    return;
                }
            } else {
                const res = await Api.put(`/menus/${this.selectedMenu.MenuId}`, payload);
                if (res && res.Success) {
                    Toast.success(res.Message || `Perubahan menu "${name}" berhasil disimpan ke database!`);
                } else {
                    Toast.error((res && res.Message) || 'Gagal memperbarui menu di database.');
                    return;
                }
            }

            this.closeModal();
            await this.loadMenus();
        } catch (err) {
            Toast.error(err.message || 'Terjadi kesalahan saat menyimpan menu ke database.');
        }
    },

    async deleteMenu(menuId, name) {
        if (!confirm(`Apakah Anda yakin ingin menghapus menu "${name}" dari sistem?`)) {
            return;
        }

        try {
            const res = await Api.delete(`/menus/${menuId}`);
            if (res && res.Success) {
                Toast.success(res.Message || `Menu "${name}" berhasil dihapus dari database.`);
                await this.loadMenus();
            } else {
                Toast.error((res && res.Message) || 'Gagal menghapus menu.');
            }
        } catch (err) {
            Toast.error(err.message || 'Terjadi kesalahan saat menghapus menu.');
        }
    },

    render() {
        const root = document.getElementById('page-root');
        if (!root) return;

        root.innerHTML = `
            <div class="container">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:2rem;flex-wrap:wrap;gap:1rem;">
                    <div>
                        <h2 style="font-size:1.85rem; display:flex; align-items:center; gap:0.4rem;"><span class="material-symbols-rounded" style="font-size:1.85rem; color:var(--primary);">local_cafe</span> Manajemen Master Menu</h2>
                        <p style="color:var(--text-muted);font-size:0.9rem;">Kelola daftar makanan, minuman, harga, stok, dan upload gambar menu.</p>
                    </div>
                    <button class="btn btn-primary" onclick="MenuCrudPage.openCreateModal()">+ Tambah Menu Baru</button>
                </div>

                <!-- Filter & Search Bar -->
                <div class="filter-bar">
                    <div class="search-input-wrap">
                        <span class="search-icon"><span class="material-symbols-rounded" style="font-size:18px;">search</span></span>
                        <input type="text" placeholder="Cari menu untuk dikelola..." 
                               value="${this.param.SearchKeyword}" 
                               oninput="MenuCrudPage.setSearch(this.value)" />
                    </div>

                    <select class="filter-select" onchange="MenuCrudPage.setCategory(this.value)">
                        <option value="">Semua Kategori</option>
                        ${this.categories.map(c => `
                            <option value="${c.CategoryName}" ${this.param.Category === c.CategoryName ? 'selected' : ''}>
                                ${c.CategoryName}
                            </option>
                        `).join('')}
                    </select>

                    <div style="color:var(--text-muted);font-size:0.85rem;margin-left:auto;">
                        Total: <b>${this.totalData}</b> Menu
                    </div>
                </div>

                <!-- Data Table List (Poin 5 PDF: List Data) -->
                <div class="glass-card">
                    <div class="data-table-container">
                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th>Gambar</th>
                                    <th>Nama Menu</th>
                                    <th>Kategori</th>
                                    <th>Harga</th>
                                    <th>Stok</th>
                                    <th>Status</th>
                                    <th style="text-align:right;">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${this.menus.length === 0 ? `
                                    <tr>
                                        <td colspan="7" style="text-align:center;padding:2rem;color:var(--text-muted);">
                                            Tidak ada data menu.
                                        </td>
                                    </tr>
                                ` : this.menus.map(m => `
                                    <tr>
                                        <td style="width:60px;">
                                            <img src="${m.ImageUrl || 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=600&q=80'}" 
                                                 style="width:45px;height:45px;object-fit:cover;border-radius:6px;" 
                                                 onerror="this.src='https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=600&q=80'" />
                                        </td>
                                        <td>
                                            <div style="font-weight:700;">${m.Name}</div>
                                            <div style="font-size:0.75rem;color:var(--text-muted);max-width:260px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
                                                ${m.Description || '-'}
                                            </div>
                                        </td>
                                        <td><span class="menu-category-tag" style="position:static;">${m.CategoryName}</span></td>
                                        <td style="font-weight:700;color:var(--primary);">${App.formatRupiah(m.Price)}</td>
                                        <td>${m.Stock || 100} porsi</td>
                                        <td>
                                            <span class="status-pill ${m.IsAvailable ? 'completed' : 'cancelled'}">
                                                ${m.IsAvailable ? 'Tersedia' : 'Habis'}
                                            </span>
                                        </td>
                                        <td style="text-align:right;">
                                            <div style="display:inline-flex;gap:0.4rem;">
                                                <button class="btn btn-outline btn-sm" onclick="MenuCrudPage.openDetailModal(${m.MenuId})">Detail</button>
                                                <button class="btn btn-primary btn-sm" onclick="MenuCrudPage.openEditModal(${m.MenuId})">Edit</button>
                                                <button class="btn btn-danger btn-sm" onclick="MenuCrudPage.deleteMenu(${m.MenuId}, '${(m.Name || '').replace(/'/g, "\\'")}')">Hapus</button>
                                            </div>
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>

                    <!-- Pagination & Limit Selector (Poin 7 PDF) -->
                    <div class="pagination-container" style="border:none;background:transparent;padding:1rem 0 0 0;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:1rem;">
                        <div style="display:flex;align-items:center;gap:0.75rem;color:var(--text-muted);font-size:0.85rem;">
                            <span>Tampilkan:</span>
                            <select class="filter-select" style="padding:0.25rem 0.6rem;font-size:0.85rem;height:auto;width:auto;" onchange="MenuCrudPage.setPageSize(this.value)">
                                <option value="5" ${this.param.PageSize === 5 ? 'selected' : ''}>5 per halaman</option>
                                <option value="10" ${this.param.PageSize === 10 ? 'selected' : ''}>10 per halaman</option>
                                <option value="20" ${this.param.PageSize === 20 ? 'selected' : ''}>20 per halaman</option>
                                <option value="50" ${this.param.PageSize === 50 ? 'selected' : ''}>50 per halaman</option>
                            </select>
                            <span>| Total: <b>${this.totalData}</b> Menu (Hal. <b>${this.param.PageNumber}</b>/<b>${this.totalPages}</b>)</span>
                        </div>
                        ${this.totalPages > 1 ? `
                            <div class="page-numbers">
                                <button class="page-btn" onclick="MenuCrudPage.setPage(${this.param.PageNumber - 1})" ${this.param.PageNumber <= 1 ? 'disabled' : ''}>&laquo;</button>
                                ${Array.from({ length: this.totalPages }, (_, i) => i + 1).map(p => `
                                    <button class="page-btn ${this.param.PageNumber === p ? 'active' : ''}" onclick="MenuCrudPage.setPage(${p})">${p}</button>
                                `).join('')}
                                <button class="page-btn" onclick="MenuCrudPage.setPage(${this.param.PageNumber + 1})" ${this.param.PageNumber >= this.totalPages ? 'disabled' : ''}>&raquo;</button>
                            </div>
                        ` : ''}
                    </div>
                </div>

                <div id="crud-modal-root"></div>
            </div>
        `;
    },

    renderModal() {
        const modalRoot = document.getElementById('crud-modal-root');
        if (!modalRoot || !this.activeModal) return;

        const m = this.selectedMenu;

        if (this.activeModal === 'detail') {
            modalRoot.innerHTML = `
                <div class="modal-overlay" onclick="if(event.target === this) MenuCrudPage.closeModal()">
                    <div class="modal-card">
                        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1.5rem;border-bottom:1px solid var(--border-subtle);padding-bottom:1rem;">
                            <h3 style="font-size:1.35rem; display:flex; align-items:center; gap:0.4rem;"><span class="material-symbols-rounded" style="font-size:1.35rem; color:var(--primary);">info</span> Rincian Data Menu</h3>
                            <button class="btn btn-outline btn-sm" onclick="MenuCrudPage.closeModal()">&times; Tutup</button>
                        </div>
                        <div style="text-align:center;margin-bottom:1.5rem;">
                            <img src="${m.ImageUrl || 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=600&q=80'}" 
                                 style="max-width:100%;height:200px;object-fit:cover;border-radius:var(--radius-md);border:1px solid var(--border-subtle);" 
                                 onerror="this.src='https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=600&q=80'" />
                        </div>
                        <div style="background:var(--bg-warm);padding:1.25rem;border-radius:var(--radius-sm);border:1px solid var(--border-subtle);margin-bottom:1.5rem;">
                            <div style="font-size:1.3rem;font-weight:700;color:var(--text-heading);margin-bottom:0.25rem;">${m.Name}</div>
                            <div style="color:var(--primary);font-size:1.15rem;font-weight:700;margin-bottom:0.75rem;">${App.formatRupiah(m.Price)}</div>
                            <div style="color:var(--text-muted);font-size:0.9rem;margin-bottom:1rem;">${m.Description || 'Tidak ada deskripsi.'}</div>
                            <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.75rem;font-size:0.85rem;">
                                <div>Kategori: <b>${m.CategoryName}</b></div>
                                <div>Estimasi Stok: <b>${m.Stock || 100} porsi</b></div>
                            </div>
                        </div>
                        <button class="btn btn-outline" style="width:100%;" onclick="MenuCrudPage.closeModal()">Tutup</button>
                    </div>
                </div>
            `;
            return;
        }

        const isCreate = this.activeModal === 'create';
        const hasImage = !!m.ImageUrl;

        modalRoot.innerHTML = `
            <div class="modal-overlay" onclick="if(event.target === this) MenuCrudPage.closeModal()">
                <div class="modal-card">
                    <div class="rr-modal-header">
                        <div class="rr-icon-badge">
                            <span class="material-symbols-rounded" style="font-size:22px;">${isCreate ? 'add_circle' : 'edit'}</span>
                        </div>
                        <div>
                            <h3 style="font-size:1.2rem; margin:0; color:var(--text-heading);">${isCreate ? 'Tambah Menu Baru' : 'Edit Menu'}</h3>
                            <p style="margin:0; font-size:0.8rem; color:var(--text-muted);">${isCreate ? 'Lengkapi data menu yang akan tampil di katalog pelanggan.' : `Perbarui data untuk "${m.Name}"`}</p>
                        </div>
                        <button type="button" class="rr-modal-close" onclick="MenuCrudPage.closeModal()" title="Tutup">
                            <span class="material-symbols-rounded" style="font-size:19px;">close</span>
                        </button>
                    </div>

                    <form onsubmit="MenuCrudPage.saveMenu(event)">
                        <div class="form-group">
                            <label class="rr-form-label"><span class="material-symbols-rounded" style="font-size:15px; color:var(--accent);">local_cafe</span> Nama Menu <span class="req">*</span></label>
                            <input type="text" id="modal-menu-name" class="form-control" value="${m.Name || ''}" placeholder="Contoh: Caramel Macchiato" required />
                        </div>

                        <div class="rr-menu-form-grid">
                            <div class="form-group">
                                <label class="rr-form-label"><span class="material-symbols-rounded" style="font-size:15px; color:var(--accent);">category</span> Kategori <span class="req">*</span></label>
                                <select id="modal-menu-cat" class="form-control">
                                    ${this.categories.map(c => `
                                        <option value="${c.CategoryId}" ${m.CategoryId === c.CategoryId ? 'selected' : ''}>
                                            ${c.CategoryName}
                                        </option>
                                    `).join('')}
                                </select>
                            </div>

                            <div class="form-group">
                                <label class="rr-form-label"><span class="material-symbols-rounded" style="font-size:15px; color:var(--accent);">payments</span> Harga Jual <span class="req">*</span></label>
                                <div class="rr-input-prefix">
                                    <span class="prefix">Rp</span>
                                    <input type="number" id="modal-menu-price" class="form-control" value="${m.Price || 25000}" min="100" step="100" required />
                                </div>
                            </div>

                            <div class="form-group">
                                <label class="rr-form-label"><span class="material-symbols-rounded" style="font-size:15px; color:var(--accent);">inventory_2</span> Stok Harian</label>
                                <input type="number" id="modal-menu-stock" class="form-control" value="${m.Stock || 100}" min="0" step="1" />
                            </div>

                            <div class="form-group">
                                <label class="rr-form-label"><span class="material-symbols-rounded" style="font-size:15px; color:var(--accent);">toggle_on</span> Status Ketersediaan</label>
                                <label class="rr-switch-row" for="modal-menu-available">
                                    <input type="checkbox" id="modal-menu-available" ${m.IsAvailable !== false ? 'checked' : ''} />
                                    <span style="font-size:0.85rem; font-weight:600; color:var(--text-body);">Menu tersedia untuk dipesan</span>
                                </label>
                            </div>
                        </div>

                        <div class="form-group">
                            <label class="rr-form-label"><span class="material-symbols-rounded" style="font-size:15px; color:var(--accent);">notes</span> Deskripsi Menu</label>
                            <textarea id="modal-menu-desc" class="form-control" rows="3" placeholder="Komposisi, rasa, catatan barista...">${m.Description || ''}</textarea>
                        </div>

                        <!-- Upload File (Poin 8 PDF: Mendukung Upload Gambar) -->
                        <div class="form-group">
                            <label class="rr-form-label"><span class="material-symbols-rounded" style="font-size:15px; color:var(--accent);">image</span> Foto Menu <span class="req">*</span></label>
                            <input type="file" id="menu-file-input" class="file-control" accept="image/*" onchange="MenuCrudPage.handleImageUpload(event)" />
                            <label for="menu-file-input" class="rr-menu-upload">
                                <span class="material-symbols-rounded">cloud_upload</span>
                                <span style="font-size:0.86rem; font-weight:700; color:var(--text-heading);">Klik untuk pilih foto menu</span>
                                <span style="font-size:0.75rem; color:var(--text-muted);">JPG, PNG, atau WEBP — otomatis terunggah ke server</span>
                            </label>
                            <input type="hidden" id="menu-image-url" value="${m.ImageUrl || ''}" />
                            ${hasImage ? `
                                <div class="rr-upload-preview">
                                    <img id="menu-image-preview" src="${m.ImageUrl}" alt="Pratinjau foto menu" />
                                    <button type="button" class="rr-upload-remove" onclick="MenuCrudPage.removePreview()" title="Hapus foto">
                                        <span class="material-symbols-rounded" style="font-size:14px;">close</span>
                                    </button>
                                </div>
                            ` : `
                                <div class="rr-upload-preview" style="display:none;">
                                    <img id="menu-image-preview" src="" alt="Pratinjau foto menu" />
                                    <button type="button" class="rr-upload-remove" onclick="MenuCrudPage.removePreview()" title="Hapus foto">
                                        <span class="material-symbols-rounded" style="font-size:14px;">close</span>
                                    </button>
                                </div>
                            `}
                        </div>

                        <div class="rr-modal-footer">
                            <span style="font-size:0.76rem; color:var(--text-muted);"><span class="req" style="color:var(--danger);">*</span> Wajib diisi</span>
                            <div style="display:flex; gap:0.6rem;">
                                <button type="button" class="btn btn-outline" onclick="MenuCrudPage.closeModal()">Batal</button>
                                <button type="submit" class="btn btn-primary">
                                    <span class="material-symbols-rounded" style="font-size:17px;">save</span>
                                    ${isCreate ? 'Simpan Menu' : 'Simpan Perubahan'}
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        `;
    },

    removePreview() {
        const urlInput = document.getElementById('menu-image-url');
        const previewEl = document.getElementById('menu-image-preview');
        const previewWrap = previewEl ? previewEl.parentElement : null;
        if (urlInput) urlInput.value = '';
        if (previewEl) { previewEl.src = ''; }
        if (previewWrap) previewWrap.style.display = 'none';
        Toast.info('Foto dihapus. Silakan pilih foto lain.');
    }
};
