# 📊 Flowchart Ruang Rasa Coffee — Dokumentasi Alur Aplikasi

Dokumen alur (flowchart) lengkap aplikasi web **Ruang Rasa Coffee**, dibuat dari hasil analisis
langsung kode sumber (Controller, Service, Entity, SPA client, database).

---

## 1. Berkas Hasil

| Berkas | Keterangan |
|:---|:---|
| [`flowchart_ruangrasa.drawio`](../flowchart_ruangrasa.drawio) | **Dokumen utama** — 8 halaman (page) diagram, siap dibuka di [diagrams.net](https://app.diagrams.net) / draw.io Desktop. |
| [`docs/flowchart-png/`](./flowchart-png) | Hasil konversi gambar (PNG, 2× resolusi) untuk tiap halaman. |
| [`tools/flowchart_spec.py`](../tools/flowchart_spec.py) | **Kode sumber diagram** (deklaratif): daftar node, panah, lane, dan posisinya. |
| [`tools/build_flowchart.py`](../tools/build_flowchart.py) | Compiler: spec → `.drawio` + PNG + laporan validasi tata letak. |
| [`tools/verify_flowchart.py`](../tools/verify_flowchart.py) | Uji otomatis: XML valid, geometri bersih, panah menempel ke node, PNG benar tergambar. |
| [`docs/flowchart-archive/`](./flowchart-archive) | Arsip versi diagram sebelumnya (1 halaman, master E2E lama). |

---

## 2. Daftar Halaman Diagram

| # | Halaman (.drawio) | Isi |
|:-:|:---|:---|
| 1 | **Arsitektur Sistem** | 4 lapisan (Presentasi → API → Bisnis/Service → Data), layanan eksternal (Gmail SMTP, QRISLY, RajaOngkir, Leaflet/OSM, OSRM), runtime & konfigurasi (`Web.config`, IIS, uploads, JWT/BCrypt). |
| 2 | **Master End-to-End (7 Peran)** | Swimlane 7 peran: Pelanggan, Kasir, Dapur/Barista (KDS), Waiter, Driver, Admin, Owner. Alur utama pelanggan sampai pesanan selesai + integrasi lintas lane. |
| 3 | **Alur Pemesanan Pelanggan** | Katalog → keranjang → pilih tipe layanan (Dine-In / Take Away / Delivery) → promo → PPN 10% → ongkir → metode bayar (Tunai / QRIS / Transfer / Kartu) → `POST /orders` → tracking → ulasan → selesai. Termasuk jalur pembatalan dan catatan aturan bisnis. |
| 4 | **Autentikasi & RBAC** | Login + JWT & refresh token, route guard SPA (`#/` hash router), RBAC per peran, kode error 401/403/404, alur lupa kata sandi (OTP 6 digit via Gmail SMTP). |
| 5 | **State Machine Status Pesanan** | Seluruh status (`PendingPayment → Confirmed → Cooking → Ready → ReadyToServe/ForPickup/ForDelivery → Delivering → Delivered → Completed`, plus `Cancelled`) beserta guard transisi `_validTransitions`, dampak ke status meja, status pembayaran, dan pengembalian stok. |
| 6 | **Live Tracking & Komunikasi Kurir** | GPS driver → `POST /tracking/update` → tabel `DriverLocationHistories` → polling pelanggan `GET /tracking/latest/{orderId}` → peta OSRM + simulasi lalu lintas; plus modul chat 2 arah & VoIP (`driver-comm.js`). |
| 7 | **Master Data CRUD & Dashboard** | CRUD menu + upload berkas, CRUD voucher/promo + validasi, denah meja & manajemen staf, serta dashboard/analitik per peran (KPI omset, top 5 menu, okupansi meja, kinerja staf). |
| 8 | **ERD Database** | 14 tabel `RuangrasaDb` + relasi FK, kardinalitas 1..N, soft delete, kolom audit, dan tabel yang dibuat otomatis (`DriverLocationHistories`). |

---

## 3. Membuka & Mengekspor dari draw.io

1. Buka <https://app.diagrams.net> → **File ▸ Open from ▸ Device** → pilih `flowchart_ruangrasa.drawio`.
2. Semua 8 halaman muncul di tab bawah. Klik tab untuk berpindah halaman.
3. Ekspor gambar/PDF untuk seluruh halaman:
   **File ▸ Export as ▸ PNG/PDF** → centang **All Pages** → *Zoom* 200% → **Export**.
4. Untuk mengubah tata letak: geser node di kanvas draw.io, atau ubah koordinatnya di
   `tools/flowchart_spec.py` lalu jalankan ulang compiler (bagian 4).

> Catatan: `.drawio` di sini adalah XML `mxGraphModel`. Setiap panah memakai
> `edgeStyle=none` + *waypoint* eksplisit dan `exitX/exitY`/`entryX/entryY`, sehingga
> ujung panah **terkunci** ke sisi node tertentu dan tidak menembus kotak lain.

---

## 4. Menjalankan Ulang Generator

```bash
# 1) Bangun .drawio + PNG + laporan validasi layout
python tools/build_flowchart.py

# 2) (opsional) hanya .drawio, tanpa render PNG
python tools/build_flowchart.py --no-png

# 3) Verifikasi hasil (XML valid, geometri bersih, panah & PNG benar)
python tools/verify_flowchart.py
```

Output:

```
[drawio] flowchart_ruangrasa.drawio  (8 halaman)
[png   ] docs/flowchart-png/01-arsitektur-sistem.png  (3760x2400)
...
=== VALIDASI LAYOUT ===
[01] 1. Arsitektur Sistem  (37 node, 6 panah)  -> OK
...
Ringkasan: 0 ERROR, 0 WARNING
```

Butuh **Python ≥ 3.9** dan **Pillow** (`pip install pillow`) untuk render PNG.
Compiler `.drawio` sendiri tidak memerlukan Pillow (`--no-png`).

---

## 5. Cara Menambah / Mengubah Diagram

Semua diagram ditulis sebagai data Python di `tools/flowchart_spec.py`:

```python
start("c1", "Mulai", x=100, y=100, w=220, h=64)                    # node terminal
proc("c2", "Proses\nbaris kedua", 100, 200, w=260, h=80)            # proses
dec("d1", "Keputusan?", 90, 320, w=280, h=110)                      # belah ketupat (keputusan)
note("n1", "Catatan aturan bisnis", 900, 200, w=400, h=90)          # catatan
lane("l1", "SWIMLANE PERAN", 40, 80, w=560, h=700, LANE_CUST, COPPER)  # lane

E("e1", "c1", "c2")                                                 # panah sederhana
E("e2", "d1", "c3", "ya", points=[(230, 470), (150, 470)],           # panah berbelok (waypoint)
  src_side="S", dst_side="N", color=GREEN, width=3, dashed=False)
```

* `N`/`proc`/`dec`/`lane` → node. `x, y` relatif terhadap `parent` (lane) bila diisi.
* `E` → panah. `points` selalu koordinat **absolut** halaman; `src_side`/`dst_side` ∈
  `N, S, E, W, NW, NE, SW, SE`.
* Setelah mengubah spec, jalankan builder. Validator akan menolak (ERROR) bila ada node
  tumpang tindih atau panah menembus node lain, sehingga tata letak tetap rapi.

---

## 6. Sumber Analisis (kode yang dibaca)

| Aspek | Berkas sumber |
|:---|:---|
| Routing REST & endpoint | `ruangrasa/Controllers/RuangrasaApiController.cs`, `UploadController.cs`, `App_Start/WebApiConfig.cs` |
| Logika bisnis & state machine | `ruangrasa/Services/Impl/RuangrasaService.cs`, `Services/Interface/IRuangrasaService.cs` |
| Model data | `ruangrasa/Models/Entity/*.cs`, `Models/ViewModel/*.cs` |
| Skema database | `RuangrasaDb.sql` |
| SPA, router, API client | `ruangrasa/client/js/{router,api,app,toast}.js` |
| Halaman SPA | `ruangrasa/client/js/pages/*.js` (cart, dashboard, tracking, profile, menu-crud, promo-crud, table-management) |
| Komponen UI | `ruangrasa/client/js/components/*.js` (navbar, table-picker, cart-modal, custom-select, driver-comm) |
| Konfigurasi runtime | `ruangrasa/Web.config`, `ruangrasa/ruangrasa.csproj` |
