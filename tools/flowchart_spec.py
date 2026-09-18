# -*- coding: utf-8 -*-
"""
==========================================================================================
 RUANG RASA COFFEE - SPESIFIKASI FLOWCHART (kode sumber diagram)
==========================================================================================
Setiap halaman = Page(...) berisi daftar node (N) dan panah (E). Semua posisi memakai grid
10 px. `parent` pada node berarti koordinatnya RELATIF terhadap lane tersebut; koordinat
`points` pada panah selalu ABSOLUT terhadap halaman.

Jalankan:  python tools/build_flowchart.py
"""

from build_flowchart import (
    AMBER, BLUE, COPPER, DARK, GREEN, INK, INK_SOFT, KASIR, LANE_ADMIN, LANE_CUST,
    LANE_DAPUR, LANE_DRIVER, LANE_KASIR, LANE_SYS, LANE_WAITER, E, N, ORANGE, PINK,
    Page, PURPLE, RED, TEAL,
)

# ------------------------------------------------------------------------------------------
# GAYA REUSABLE
# ------------------------------------------------------------------------------------------
F_WHITE = "#FFFFFF"
F_START = DARK
F_DONE = "#2F4F3A"
F_WARN = "#FEF3C7"
F_OK = "#F0FDF4"
F_ERR = "#FEF2F2"
F_INFO = "#EFF6FF"
F_NEUTRAL = "#F8FAFC"


def start(nid, label, x, y, w=220, h=64, parent=None, **kw):
    kw.setdefault("font_size", 12)
    return N(nid, label, x, y, w, h, parent=parent, shape="stadium",
             fill=F_START, stroke=F_START, font_color="#FFFFFF", bold=True, **kw)


def end(nid, label, x, y, w=220, h=64, parent=None, **kw):
    kw.setdefault("font_size", 12)
    return N(nid, label, x, y, w, h, parent=parent, shape="stadium",
             fill=F_DONE, stroke=F_DONE, font_color="#FFFFFF", bold=True, **kw)


def proc(nid, label, x, y, w=220, h=70, parent=None, **kw):
    kw.setdefault("fill", F_WHITE)
    kw.setdefault("stroke", COPPER)
    return N(nid, label, x, y, w, h, parent=parent, shape="process", **kw)


def dec(nid, label, x, y, w=260, h=110, parent=None, **kw):
    kw.setdefault("fill", F_WARN)
    kw.setdefault("stroke", AMBER)
    kw.setdefault("bold", True)
    kw.setdefault("font_size", 11)
    return N(nid, label, x, y, w, h, parent=parent, shape="decision", **kw)


def note(nid, label, x, y, w=320, h=90, parent=None, **kw):
    kw.setdefault("fill", "#FFFBEB")
    kw.setdefault("stroke", AMBER)
    kw.setdefault("font_size", 10)
    kw.setdefault("align", "left")
    return N(nid, label, x, y, w, h, parent=parent, shape="note", **kw)


def title(nid, label, x, y, w=1200, h=40, size=19, align="left"):
    return N(nid, label, x, y, w, h, shape="text", font_size=size, bold=True,
             font_color=DARK, align=align)


def subtitle(nid, label, x, y, w=1200, h=30, size=11, align="left"):
    return N(nid, label, x, y, w, h, shape="text", font_size=size,
             font_color=INK_SOFT, align=align)


def lane(nid, label, x, y, w, h, fill, stroke, start_size=44, size=12):
    return N(nid, label, x, y, w, h, parent=None, shape="lane", fill=fill, stroke=stroke,
             bold=True, font_size=size, start_size=start_size)


# ------------------------------------------------------------------------------------------
# HALAMAN 1 - ARSITEKTUR SISTEM
# ------------------------------------------------------------------------------------------
def _p1():
    nodes = [
        title("p1_title", "ARSITEKTUR SISTEM — RUANG RASA COFFEE WEB APP", 40, 20, 900, 40),
        subtitle("p1_sub",
                 "Pola MVCS: Single Page Application (Native ES6) → ASP.NET Web API 2 → Service Layer → "
                 "Entity Framework 6 → SQL Server, terhubung ke layanan pihak ketiga (SMTP, QRISLY, RajaOngkir, Leaflet/OSRM).",
                 40, 60, 900, 30),

        # --- LAPISAN PRESENTASI
        lane("p1_lp", "1. LAPISAN PRESENTASI — SINGLE PAGE APPLICATION (Native ES6 Modules, tanpa framework)",
             40, 100, 900, 272, LANE_CUST, COPPER),
        proc("p1_html", "client/index.html\n(SPA shell + CDN Leaflet 1.9.4)", 24, 54, 270, 56, "p1_lp"),
        proc("p1_css", "client/css/style.css\n(Design System coffeehouse, glassmorphism)", 314, 54, 270, 56, "p1_lp"),
        proc("p1_app", "js/app.js\n(Global state, validator, helper)", 604, 54, 272, 56, "p1_lp"),
        proc("p1_router", "js/router.js\n(Hash router + route guard RBAC)", 24, 126, 270, 56, "p1_lp"),
        proc("p1_api", "js/api.js\n(Fetch wrapper, JWT bearer, global error)", 314, 126, 270, 56, "p1_lp"),
        proc("p1_comp", "js/toast.js + js/components/*\n(Navbar, TablePicker, CartModal, CustomSelect)",
             604, 126, 272, 56, "p1_lp"),
        proc("p1_pages", "js/pages/* — Home, Products, Cart, Login, Register, ForgotPassword, Profile, Dashboard, "
                         "MenuCRUD, TableManagement, PromoCRUD, Tracking, ErrorPages",
             24, 198, 852, 56, "p1_lp", font_size=11),

        # --- LAPISAN API
        lane("p1_la", "2. LAPISAN API — ASP.NET Web API 2 (IIS Express, .NET Framework 4.7.2, Attribute Routing)",
             40, 418, 900, 180, LANE_SYS, PURPLE),
        proc("p1_api1", 'RuangrasaApiController\n[RoutePrefix("api/ruangrasa")] — 45+ endpoint REST',
             24, 54, 270, 76, "p1_la", font_size=11),
        proc("p1_api2", "UploadController\n[api/ruangrasa/upload] multipart & base64 (≤ 10 MB: JPG/PNG/WEBP/PDF)",
             314, 54, 270, 76, "p1_la", font_size=11),
        proc("p1_api3", "DataWebApiController (legacy /api/dataweb)\n+ Areas/HelpPage (dokumentasi API)",
             604, 54, 272, 76, "p1_la", font_size=11),

        # --- LAPISAN BISNIS
        lane("p1_lb", "3. LAPISAN BISNIS — MVCS (Service Layer + Entity Framework 6)",
             40, 644, 900, 190, LANE_DAPUR, AMBER),
        proc("p1_svc_if", "IRuangrasaService\n(kontrak operasi bisnis)", 24, 54, 180, 80, "p1_lb", font_size=11),
        proc("p1_svc", "RuangrasaService\n(order, payment, promo, menu, meja, user, tracking, review, staff)",
             220, 54, 300, 80, "p1_lb", font_size=11),
        proc("p1_email", "EmailService\n(Gmail SMTP — OTP)", 536, 54, 150, 80, "p1_lb", font_size=11),
        proc("p1_db", "RuangrasaDbContext\n(EF6 + LINQ, EnsureSchemaUpdated)", 700, 54, 176, 80, "p1_lb", font_size=10),

        # --- LAPISAN DATA
        lane("p1_ld", "4. LAPISAN DATA — SQL Server 2019/2022 (database RuangrasaDb: relasi FK, soft delete, seed ≥ 20 baris)",
             40, 880, 900, 180, LANE_KASIR, KASIR),
        proc("p1_tbl1", "Transaksi & Operasional\nOrders, OrderItems, Payments, Deliveries, DriverLocationHistories",
             24, 54, 270, 80, "p1_ld", font_size=11),
        proc("p1_tbl2", "Master Data\nMenus, Categories, DiningTables, Promos", 314, 54, 270, 80, "p1_ld", font_size=11),
        proc("p1_tbl3", "Akun & Keamanan\nUsers, Roles, RefreshTokens, PasswordResets, Reviews",
             604, 54, 272, 80, "p1_ld", font_size=11),

        # --- LAYANAN EKSTERNAL
        lane("p1_le", "A. LAYANAN EKSTERNAL / PIHAK KETIGA", 1000, 100, 760, 470, LANE_ADMIN, PURPLE),
        proc("p1_ext1", "Gmail SMTP (smtp.gmail.com:587)\nKirim OTP 6 digit lupa kata sandi", 24, 54, 340, 76, "p1_le", font_size=11),
        proc("p1_ext2", "QRISLY Payment Gateway + api.qrserver.com\nDynamic QRIS & gambar QR transaksi",
             396, 54, 340, 76, "p1_le", font_size=11),
        proc("p1_ext3", "RajaOngkir API (18 kota + tarif)\nDaftar kota & perhitungan ongkir", 24, 150, 340, 76, "p1_le", font_size=11),
        proc("p1_ext4", "Leaflet.js 1.9.4 + tile OSM/Carto\nPeta denah meja, pin alamat, live tracking",
             396, 150, 340, 76, "p1_le", font_size=11),
        proc("p1_ext5", "OSRM Routing API (router.project-osrm.org)\nRute jalan nyata + simulasi lalu lintas Bandung",
             24, 246, 712, 76, "p1_le", font_size=11),
        proc("p1_ext6", "Google Fonts + Material Symbols (CDN)\nTipografi & ikon antarmuka", 24, 342, 712, 76, "p1_le", font_size=11),

        # --- RUNTIME
        lane("p1_lr", "B. RUNTIME, KONFIGURASI & KEAMANAN", 1000, 600, 760, 430, LANE_DRIVER, GREEN),
        proc("p1_rt1", "IIS Express / IIS 10 + .NET Framework 4.7.2\nHosting Web API (https://localhost:44365)",
             24, 54, 340, 76, "p1_lr", font_size=11),
        proc("p1_rt2", "Web.config — appSettings\nJwtSecretKey, JwtIssuer, JwtAudience", 396, 54, 340, 76, "p1_lr", font_size=11),
        proc("p1_rt3", "appSettings integrasi\nQrislyApiKey, RajaOngkirApiKey, SmtpEmail/SmtpPassword",
             24, 150, 340, 76, "p1_lr", font_size=11),
        proc("p1_rt4", "Uploads/ — penyimpanan berkas\nJPG/PNG/WEBP/GIF/PDF ≤ 10 MB", 396, 150, 340, 76, "p1_lr", font_size=11),
        proc("p1_rt5", "connectionString RuangrasaDbContext\nData Source=.;Initial Catalog=RuangrasaDb;Integrated Security=True",
             24, 246, 712, 76, "p1_lr", font_size=11),
        proc("p1_rt6", "Keamanan: BCrypt.Net-Next (hash kata sandi) + System.IdentityModel.Tokens.Jwt (Bearer token)",
             24, 342, 712, 76, "p1_lr", font_size=11),
    ]

    edges = [
        E("p1_a1", "p1_lp", "p1_la", "HTTP/JSON + Authorization: Bearer <JWT>", color=COPPER, width=3),
        E("p1_a2", "p1_la", "p1_lb", "controller memanggil service (IRuangrasaService)", color=PURPLE, width=3),
        E("p1_a3", "p1_lb", "p1_ld", "EF6 LINQ → SQL (ADO.NET provider)", color=AMBER, width=3),
        E("p1_a4", "p1_lb", "p1_le", "integrasi REST / SMTP dari service layer",
          points=[(970, 739), (970, 335)], src_side="E", dst_side="W", dashed=True, color=GREEN),
        E("p1_a5", "p1_lp", "p1_le", "tile peta & rute OSRM dipanggil langsung dari browser",
          points=[(970, 236), (970, 335)], src_side="E", dst_side="W", dashed=True, color=GREEN),
        E("p1_a6", "p1_le", "p1_lr", "", src_side="S", dst_side="N", dashed=True, color=INK_SOFT),
    ]

    return Page("p1", "1. Arsitektur Sistem", "arsitektur-sistem", nodes, edges, width=1800, height=1120)


# ------------------------------------------------------------------------------------------
# HALAMAN 2 - MASTER END-TO-END (SWIMLANE 7 PERAN)
# ------------------------------------------------------------------------------------------
LANE_Y, LANE_H, LANE_SS = 70, 1700, 44


def _p2():
    nodes = [
        title("p2_title", "ALUR END-TO-END SISTEM RUANG RASA COFFEE — 7 PERAN (SWIMLANE)", 40, 14, 1300, 40),
        subtitle("p2_leg",
                 "Legenda:  ▭ proses   ◇ keputusan   ▬ alur utama   ┄ integrasi / jalur alternatif   "
                 "Setiap lane = 1 peran pengguna (RBAC).",
                 1300, 16, 1120, 30, align="right"),
    ]

    # ---------------- SWIMLANE DEFINITIONS ----------------
    nodes += [
        lane("p2_l_pelanggan", "1. PELANGGAN (CUSTOMER / GUEST)", 40, LANE_Y, 560, LANE_H, LANE_CUST, COPPER),
        lane("p2_l_kasir", "2. KASIR (POS & BILLING)", 616, LANE_Y, 260, LANE_H, LANE_KASIR, KASIR),
        lane("p2_l_dapur", "3. DAPUR & BARISTA (KDS)", 892, LANE_Y, 280, LANE_H, LANE_DAPUR, AMBER),
        lane("p2_l_waiter", "4. PRAMUSAJI (WAITER)", 1188, LANE_Y, 250, LANE_H, LANE_WAITER, BLUE),
        lane("p2_l_driver", "5. KURIR (DRIVER)", 1454, LANE_Y, 280, LANE_H, LANE_DRIVER, GREEN),
        lane("p2_l_admin", "6. ADMIN (BACKOFFICE)", 1750, LANE_Y, 300, LANE_H, LANE_ADMIN, PURPLE),
        lane("p2_l_owner", "7. OWNER (MANAJEMEN)", 2066, LANE_Y, 280, LANE_H, "#FDF2F8", PINK),
    ]

    # ---------------- LANE 1: PELANGGAN ----------------
    nodes += [
        start("p2_c_start", "Pelanggan membuka web SPA", 180, 54, 200, 64, "p2_l_pelanggan"),
        proc("p2_c_menu", "Jelajahi katalog menu\n(search, filter kategori, sort, paging)", 160, 150, 240, 70, "p2_l_pelanggan"),
        dec("p2_c_tipe", "Pilih tipe layanan?", 150, 252, 260, 110, "p2_l_pelanggan"),
        proc("p2_c_dinein", "Dine-In\npilih meja kosong (denah)", 24, 400, 160, 80, "p2_l_pelanggan", font_size=11),
        proc("p2_c_takeaway", "Take Away\nnama pemesan + catatan", 205, 400, 150, 80, "p2_l_pelanggan", font_size=11),
        proc("p2_c_delivery", "Delivery\nalamat 4 tingkat + pin peta + ongkir", 374, 400, 162, 80, "p2_l_pelanggan", font_size=11),
        proc("p2_c_cart", "Keranjang: subtotal, voucher promo, PPN 10%, tarif kurir", 160, 520, 240, 80, "p2_l_pelanggan"),
        proc("p2_c_pay", "Pilih metode bayar\n(Tunai / QRIS / Transfer / Kartu)", 160, 640, 240, 80, "p2_l_pelanggan"),
        proc("p2_c_order", "Kirim pesanan → POST /orders\nstatus PendingPayment\n(kode RR-YYYYMMDD-000N)",
             150, 752, 260, 110, "p2_l_pelanggan", fill=F_WARN, stroke=AMBER, font_size=11),
        proc("p2_c_track", "Pantau status & peta kurir\n(#/tracking atau #/profile?tab=orders)",
             150, 1340, 260, 80, "p2_l_pelanggan", fill=F_INFO, stroke=BLUE),
        proc("p2_c_review", "Terima pesanan → beri rating 1-5\n& ulasan (Completed)", 24, 1560, 250, 80, "p2_l_pelanggan",
             fill=F_WARN, stroke=AMBER, font_size=11),
        end("p2_c_end", "Selesai (transaksi ditutup)", 294, 1560, 242, 80, "p2_l_pelanggan", font_size=11),
    ]

    # ---------------- LANE 2: KASIR ----------------
    nodes += [
        dec("p2_k_verify", "Verifikasi pembayaran\n(QRIS / bukti transfer / tunai)\nvalid?",
            24, 752, 200, 110, "p2_l_kasir", font_size=10),
        proc("p2_k_confirm", "Setujui → status Confirmed\nmeja Occupied, Payment = Paid", 24, 900, 200, 80, "p2_l_kasir",
             fill=F_OK, stroke=GREEN, font_size=10),
        proc("p2_k_reject", "Tolak bukti bayar\nPOST /orders/{id}/verify-payment\n(isApproved=false) → Cancelled",
             24, 1010, 200, 80, "p2_l_kasir", fill=F_ERR, stroke=RED, font_size=10),
        proc("p2_k_done", "Cetak struk POS &\nakses meja jadi Available", 24, 1560, 200, 80, "p2_l_kasir", font_size=10),
    ]

    # ---------------- LANE 3: DAPUR ----------------
    nodes += [
        proc("p2_d_receive", "Tiket pesanan masuk KDS\n(auto-polling berkala)", 40, 1010, 200, 80, "p2_l_dapur", font_size=11),
        proc("p2_d_cook", "Barista / dapur meracik\n→ status Cooking", 40, 1120, 200, 80, "p2_l_dapur",
             fill=F_WARN, stroke=AMBER, font_size=11),
        proc("p2_d_ready", "Pesanan siap → status Ready, otomatis menjadi ReadyToServe / ReadyForPickup / "
                           "ReadyForDelivery sesuai tipe pesanan", 30, 1230, 220, 80, "p2_l_dapur",
             fill=F_OK, stroke=GREEN, font_size=10),
    ]

    # ---------------- LANE 4: WAITER ----------------
    nodes += [
        proc("p2_w_serve", "Antar pesanan Dine-In ke meja\n→ status Completed (WaiterId dicatat)",
             25, 1340, 200, 80, "p2_l_waiter", fill=F_INFO, stroke=BLUE, font_size=10),
        proc("p2_w_free", "Bersihkan & kosongkan meja\n(Status meja: Available)", 25, 1560, 200, 80, "p2_l_waiter", font_size=10),
    ]

    # ---------------- LANE 5: DRIVER ----------------
    nodes += [
        proc("p2_dr_claim", "Klaim pesanan Delivery di counter", 40, 1230, 200, 80, "p2_l_driver", font_size=11),
        proc("p2_dr_go", "Mulai antar → status Delivering\n+ broadcast GPS berkala", 40, 1340, 200, 80, "p2_l_driver",
             fill=F_OK, stroke=GREEN, font_size=10),
        proc("p2_dr_comm", "Chat & telepon VoIP dengan pelanggan", 40, 1450, 200, 80, "p2_l_driver", font_size=11),
        proc("p2_dr_done", "Serah terima di alamat\n→ Delivered → Completed", 40, 1560, 200, 80, "p2_l_driver", font_size=11),
    ]

    # ---------------- LANE 6: ADMIN ----------------
    nodes += [
        proc("p2_a_menu", "CRUD master menu\n+ upload foto produk", 30, 150, 240, 70, "p2_l_admin", font_size=11),
        proc("p2_a_promo", "CRUD voucher / promo\n(diskon %, min belanja, kuota)", 30, 252, 240, 80, "p2_l_admin", font_size=11),
        proc("p2_a_table", "Manajemen denah meja\n(Indoor / Outdoor Braga / VIP)", 30, 400, 240, 70, "p2_l_admin", font_size=11),
        proc("p2_a_staff", "Manajemen staf\n(tambah, ubah, aktif/nonaktif, hapus)", 30, 520, 240, 70, "p2_l_admin", font_size=11),
        proc("p2_a_monitor", "Pantau antrean pesanan\n& status pembayaran\n(status meja realtime)",
             30, 752, 240, 110, "p2_l_admin", fill=F_NEUTRAL, stroke=PURPLE, font_size=11),
    ]

    # ---------------- LANE 7: OWNER ----------------
    nodes += [
        proc("p2_o_dash", "Dashboard eksekutif: omset\nharian / mingguan / bulanan", 30, 752, 220, 110, "p2_l_owner",
             fill="#FDF2F8", stroke=PINK, font_size=11),
        proc("p2_o_top", "Top 5 menu terlaris\n& tren pesanan", 30, 1010, 220, 80, "p2_l_owner", font_size=11),
        proc("p2_o_staff", "Evaluasi kinerja 7 staf\n(pesanan ditangani & omset)", 30, 1120, 220, 80, "p2_l_owner", font_size=11),
        proc("p2_o_okup", "Okupansi meja &\njumlah pesanan selesai", 30, 1230, 220, 80, "p2_l_owner", font_size=11),
    ]

    # ---------------- PANAH ----------------
    ORANGE_W = dict(color=ORANGE, width=3)
    edges = [
        # alur utama pelanggan
        E("p2_e1", "p2_c_start", "p2_c_menu"),
        E("p2_e2", "p2_c_menu", "p2_c_tipe"),
        E("p2_e3", "p2_c_tipe", "p2_c_dinein", "Dine-In", points=[(320, 442), (144, 442)], src_side="S", dst_side="N", color=ORANGE, width=3),
        E("p2_e4", "p2_c_tipe", "p2_c_takeaway", "Take Away", src_side="S", dst_side="N", color=ORANGE, width=3),
        E("p2_e5", "p2_c_tipe", "p2_c_delivery", "Delivery", points=[(320, 462), (495, 462)], src_side="S", dst_side="N", color=ORANGE, width=3),
        E("p2_e6", "p2_c_dinein", "p2_c_cart", "", points=[(144, 570), (200, 570)],
          src_side="S", dst_side="NW", color=ORANGE),
        E("p2_e7", "p2_c_takeaway", "p2_c_cart", "", src_side="S", dst_side="N", color=ORANGE),
        E("p2_e8", "p2_c_delivery", "p2_c_cart", "", points=[(495, 580), (440, 580)],
          src_side="S", dst_side="NE", color=ORANGE),
        E("p2_e9", "p2_c_cart", "p2_c_pay", "", color=ORANGE, width=3),
        E("p2_e10", "p2_c_pay", "p2_c_order", "", color=ORANGE, width=3),

        # pelanggan -> kasir
        E("p2_e11", "p2_c_order", "p2_k_verify", "pesanan masuk", src_side="E", dst_side="W", color=RED, width=3),
        E("p2_e12", "p2_k_verify", "p2_k_confirm", "valid", src_side="S", dst_side="N", color=GREEN, width=3),
        E("p2_e13", "p2_k_verify", "p2_k_reject", "tidak valid", points=[(608, 877), (608, 1120)],
          src_side="W", dst_side="W", color=RED, dashed=True),
        E("p2_e14", "p2_k_confirm", "p2_d_receive", "", points=[(945, 1010), (945, 1120)],
          src_side="E", dst_side="W", color=GREEN, width=3),

        # dapur
        E("p2_e15", "p2_d_receive", "p2_d_cook", "", color=AMBER, width=3),
        E("p2_e16", "p2_d_cook", "p2_d_ready", "", color=AMBER, width=3),

        # cabang layanan dari dapur
        E("p2_e17", "p2_d_ready", "p2_w_serve", "Dine-In siap", points=[(1160, 1340), (1160, 1450)],
          src_side="E", dst_side="W", color=BLUE, width=3),
        E("p2_e18", "p2_d_ready", "p2_dr_claim", "Delivery siap", points=[(1180, 1340), (1180, 1290), (1594, 1290)],
          src_side="E", dst_side="N", color=GREEN, width=3),

        # waiter & driver
        E("p2_e19", "p2_w_serve", "p2_c_review", "pesanan disajikan", points=[(1313, 1530), (189, 1530)],
          src_side="S", dst_side="N", color=BLUE),
        E("p2_e20", "p2_dr_claim", "p2_dr_go", "", color=GREEN, width=3),
        E("p2_e21", "p2_dr_go", "p2_dr_comm", "", color=GREEN, width=3),
        E("p2_e22", "p2_dr_comm", "p2_dr_done", "", color=GREEN, width=3),
        E("p2_e23", "p2_dr_done", "p2_c_review", "pesanan diterima", points=[(1594, 1725), (324, 1725), (324, 1670)],
          src_side="S", dst_side="E", color=GREEN),
        E("p2_e24", "p2_dr_go", "p2_c_track", "GPS kurir realtime", points=[(1594, 1505), (320, 1505)],
          src_side="S", dst_side="S", dashed=True, color=BLUE),

        # tracking & penutupan
        E("p2_e25", "p2_c_order", "p2_c_track", "pantau status", src_side="S", dst_side="N", color=INK_SOFT, dashed=True),
        E("p2_e26", "p2_c_track", "p2_c_review", "", points=[(320, 1550), (50, 1550), (50, 1670)],
          src_side="S", dst_side="W", color=ORANGE, width=3),
        E("p2_e27", "p2_c_review", "p2_c_end", "", src_side="E", dst_side="W", color=ORANGE, width=3),
        E("p2_e28", "p2_c_end", "p2_k_done", "Completed → tutup transaksi", src_side="E", dst_side="W", color=KASIR, dashed=True),

        # admin: master data memengaruhi katalog pelanggan
        E("p2_e29", "p2_a_menu", "p2_c_menu", "master menu & promo tampil di katalog",
          src_side="W", dst_side="E", dashed=True, color=PURPLE),
        # admin memantau antrean pesanan
        E("p2_e30", "p2_c_order", "p2_a_monitor", "monitoring antrean", points=[(440, 877), (440, 950), (1900, 950)],
          src_side="E", dst_side="S", dashed=True, color=PURPLE),
        # admin -> owner analitik
        E("p2_e31", "p2_a_monitor", "p2_o_dash", "rekap transaksi selesai", src_side="E", dst_side="W",
          color=PINK, width=3),
        E("p2_e32", "p2_o_dash", "p2_o_top", "", color=PINK),
        E("p2_e33", "p2_o_top", "p2_o_staff", "", color=PINK),
        E("p2_e34", "p2_o_staff", "p2_o_okup", "", color=PINK),
    ]

    return Page("p2", "2. Master End-to-End (7 Peran)", "master-e2e-7-role", nodes, edges,
                width=2400, height=1820)


# ------------------------------------------------------------------------------------------
# HALAMAN 3 - ALUR PEMESANAN PELANGGAN (DETAIL)
# ------------------------------------------------------------------------------------------
def _p3():
    nodes = [
        title("p3_title", "ALUR PEMESANAN PELANGGAN (CHECKOUT, PEMBAYARAN & TRACKING)", 40, 14, 1400, 40),
        subtitle("p3_sub", "Halaman: #/products → #/cart → #/checkout → #/profile?tab=orders & #/tracking", 40, 52, 1000, 24),

        start("p3_s1", "Mulai — pelanggan membuka web SPA", 340, 60, 300, 64),
        proc("p3_s2", "Pilih menu & tambahkan ke keranjang\n(Products: search, filter kategori, sort, paging)", 340, 160, 300, 80),
        proc("p3_s3", "Buka halaman checkout (#/cart)\nvalidasi keranjang tidak kosong", 340, 280, 300, 80),
        dec("p3_d1", "Pilih tipe layanan?", 330, 400, 320, 110),

        proc("p3_b_dinein", "Dine-In\npilih meja kosong dari denah interaktif (TablePicker)",
             60, 560, 250, 100, font_size=11),
        proc("p3_b_takeaway", "Take Away\nisi nama pemesan + catatan", 340, 560, 300, 100, font_size=11),
        proc("p3_b_delivery", "Delivery\npilih Kota → Kecamatan → Kelurahan → RT/RW, pin peta Leaflet (two-way sync), "
                              "tarif kurir per jarak", 670, 560, 290, 100, font_size=11),

        proc("p3_s4", "Ringkasan keranjang\nsubtotal, kode promo, PPN 10%, ongkos kirim", 340, 710, 300, 90),
        proc("p3_s5", "Validasi voucher\nPOST /promos/validate (diskon %, min belanja, kuota, masa berlaku)", 340, 850, 300, 90, font_size=11),
        dec("p3_d2", "Pilih metode pembayaran", 330, 990, 320, 110),

        proc("p3_p1", "Tunai (Cash)\nbayar di kasir: POST /payment/cash/confirm", 60, 1160, 250, 100, font_size=11),
        proc("p3_p2", "QRIS\nPOST /payment/qris/generate → scan QR → POST /payment/qris/verify", 340, 1160, 300, 100, font_size=11),
        proc("p3_p3", "Transfer bank / VA\nPOST /payment/transfer/generate → unggah bukti → POST /payment/transfer/verify",
             670, 1160, 290, 100, font_size=10),
        proc("p3_p4", "Kartu debit / kredit\nPOST /payment/card/process", 980, 1160, 240, 100, font_size=11),

        proc("p3_s6", "Kirim pesanan → POST /orders\nstatus PendingPayment, kode RR-YYYYMMDD-000N, "
                      "nomor meja / alamat tersimpan", 100, 1330, 1100, 100, fill=F_WARN, stroke=AMBER),
        proc("p3_s7", "Status PendingPayment\nmenunggu verifikasi kasir (lihat halaman Operasional)",
             340, 1480, 300, 80, fill=F_INFO, stroke=BLUE),
        proc("p3_cancel", "Batal / ditolak\nPOST /orders/{id}/cancel → status Cancelled,\nmeja Available, stok menu dikembalikan",
             60, 1480, 250, 80, fill=F_ERR, stroke=RED, font_size=10),
        proc("p3_s8", "Pantau status & peta kurir\n#/tracking?order=RR-... (polling posisi kurir)", 340, 1600, 300, 80),
        proc("p3_s9", "Terima pesanan → rating 1-5 & ulasan\nPOST /orders/{id}/review (status Completed)", 340, 1720, 300, 80),
        end("p3_s10", "Selesai — transaksi ditutup", 360, 1840, 260, 64),

        note("p3_n1", "Aturan tamu (guest): hanya boleh Dine-In, wajib mengisi nama pemesan dan memilih meja kosong.",
             1260, 560, 440, 90),
        note("p3_n2", "Aturan delivery: wajib pembayaran non-tunai di muka (QRIS / Transfer / Kartu).",
             1260, 670, 440, 80),
        note("p3_n3", "Perhitungan biaya dilakukan di server: total = (subtotal − diskon) + PPN 10% + ongkos kirim "
                       "(batas wajar tarif kurir ≤ Rp 25.000).", 1260, 770, 440, 100),
        note("p3_n4", "Nomor pesanan memakai pola RR-YYYYMMDD-000N (MAX-based sequence untuk menghindari race condition).",
             1260, 890, 440, 90),
        note("p3_n5", "Meja otomatis menjadi Occupied saat pesanan Dine-In dibuat; kembali Available ketika pesanan "
                       "dibatalkan atau meja dibersihkan.", 1260, 1000, 440, 90),
        note("p3_n6", "Semua request memakai header Authorization: Bearer <JWT> yang disimpan di localStorage "
                       "setelah login.", 1260, 1110, 440, 90),
        note("p3_n7", "Endpoint halaman ini: /promos/validate, /payment/*, /orders, /orders/{id}/review, "
                       "/tracking/latest/{orderId}.", 1260, 1220, 440, 90),
    ]

    edges = [
        E("p3_e1", "p3_s1", "p3_s2"),
        E("p3_e2", "p3_s2", "p3_s3"),
        E("p3_e3", "p3_s3", "p3_d1"),
        E("p3_e4", "p3_d1", "p3_b_dinein", "Dine-In", points=[(490, 530), (185, 530)],
          src_side="S", dst_side="N", color=ORANGE, width=3),
        E("p3_e5", "p3_d1", "p3_b_takeaway", "Take Away", points=[(490, 540)],
          src_side="S", dst_side="N", color=ORANGE, width=3),
        E("p3_e6", "p3_d1", "p3_b_delivery", "Delivery", points=[(490, 550), (815, 550)],
          src_side="S", dst_side="N", color=ORANGE, width=3),
        E("p3_e7", "p3_b_dinein", "p3_s4", "", points=[(185, 675), (340, 675)], src_side="S", dst_side="NW", color=ORANGE),
        E("p3_e8", "p3_b_takeaway", "p3_s4", "", src_side="S", dst_side="N", color=ORANGE),
        E("p3_e9", "p3_b_delivery", "p3_s4", "", points=[(815, 690), (640, 690)], src_side="S", dst_side="NE", color=ORANGE),
        E("p3_e10", "p3_s4", "p3_s5", "", color=ORANGE, width=3),
        E("p3_e11", "p3_s5", "p3_d2", "", color=ORANGE, width=3),
        E("p3_e12", "p3_d2", "p3_p1", "Tunai", points=[(490, 1120), (185, 1120)], src_side="S", dst_side="N", color=ORANGE, width=3),
        E("p3_e13", "p3_d2", "p3_p2", "QRIS", points=[(490, 1125)], src_side="S", dst_side="N", color=ORANGE, width=3),
        E("p3_e14", "p3_d2", "p3_p3", "Transfer / VA", points=[(490, 1135), (815, 1135)], src_side="S", dst_side="N", color=ORANGE, width=3),
        E("p3_e15", "p3_d2", "p3_p4", "Kartu", points=[(490, 1145), (1100, 1145)], src_side="S", dst_side="N", color=ORANGE, width=3),
        E("p3_e16", "p3_p1", "p3_s6", "", points=[(185, 1300), (100, 1300)], src_side="S", dst_side="NW", color=ORANGE),
        E("p3_e17", "p3_p2", "p3_s6", "", points=[(490, 1300), (650, 1300)], src_side="S", dst_side="N", color=ORANGE),
        E("p3_e18", "p3_p3", "p3_s6", "", points=[(815, 1310), (1200, 1310)], src_side="S", dst_side="NE", color=ORANGE),
        E("p3_e19", "p3_p4", "p3_s6", "", points=[(1100, 1320), (1240, 1320), (1240, 1380)],
          src_side="S", dst_side="E", color=ORANGE),
        E("p3_e20", "p3_s6", "p3_s7", "", points=[(650, 1450), (490, 1450)], src_side="S", dst_side="N", color=BLUE, width=3),
        E("p3_e21", "p3_s7", "p3_cancel", "dibatalkan", src_side="W", dst_side="E", color=RED, dashed=True),
        E("p3_e22", "p3_s7", "p3_s8", "terverifikasi", src_side="S", dst_side="N", color=BLUE, width=3),
        E("p3_e23", "p3_s8", "p3_s9", "", color=BLUE, width=3),
        E("p3_e24", "p3_s9", "p3_s10", "", color=BLUE, width=3),
        E("p3_e25", "p3_cancel", "p3_s10", "", points=[(185, 1872)], src_side="S", dst_side="W", color=RED, dashed=True),
    ]

    return Page("p3", "3. Alur Pemesanan Pelanggan", "alur-pemesanan-pelanggan", nodes, edges,
                width=1760, height=1960)


# ------------------------------------------------------------------------------------------
# HALAMAN 4 - AUTENTIKASI, JWT & RBAC
# ------------------------------------------------------------------------------------------
def _p4():
    nodes = [
        title("p4_ta", "A. AUTENTIKASI — LOGIN, TOKEN JWT & REFRESH TOKEN", 40, 70, 820, 30, size=15),
        start("p4_a1", "Akses halaman #/login", 60, 120, 260, 64),
        proc("p4_a2", "Isi email & kata sandi", 60, 210, 260, 70),
        dec("p4_a3", "Kredensial valid?\n(BCrypt.Verify)", 50, 310, 280, 110),
        proc("p4_a4", "Tampilkan error + toast\n(email / kata sandi salah)", 420, 310, 280, 110, fill=F_ERR, stroke=RED),
        proc("p4_a5", "Buat access token JWT (HS256) + refresh token\nclaims: userId, fullName, email, role, exp",
             60, 460, 260, 90, fill=F_OK, stroke=GREEN, font_size=11),
        proc("p4_a6", "Simpan sesi di localStorage\nrr_token, rr_refresh_token, rr_user", 60, 580, 260, 90),
        proc("p4_a7", "Redirect berdasar peran\ncustomer → #/profile, staf → #/dashboard", 60, 700, 260, 90),
        note("p4_a8", "Token dikirim pada setiap request: Authorization: Bearer <JWT>. HTTP 401 dari API → "
                       "clearSession() + redirect #/401.", 420, 460, 280, 110),

        title("p4_tb", "B. ROUTE GUARD SPA & KONTROL AKSES BERBASIS PERAN (RBAC)", 920, 70, 840, 30, size=15),
        start("p4_b1", "Perubahan hash URL (#/...)\natau klik tautan internal", 940, 120, 300, 64),
        proc("p4_b2", "Router.handleRoute() memilah hash\n(misal #/profile?tab=orders)", 940, 214, 300, 60, font_size=11),
        dec("p4_b3", "Route terdaftar\npada tabel route?", 930, 300, 320, 110),
        proc("p4_b4", "Render halaman 404", 1320, 310, 280, 90),
        dec("p4_b5", "Route privat &\npengguna belum login?", 930, 450, 320, 110),
        proc("p4_b6", "Toast 'silakan masuk' +\nredirect #/login", 1320, 460, 280, 90),
        dec("p4_b7", "Peran pengguna sesuai\nroles[] pada route?", 930, 600, 320, 110),
        proc("p4_b8", "Akses ditolak:\ncustomer → #/profile, staf → #/403", 1320, 610, 280, 90, fill=F_ERR, stroke=RED),
        proc("p4_b9", "Render Navbar + halaman (0 ms),\nlalu page.init() secara async", 930, 750, 320, 90),
        proc("p4_b10", "Api.request(): pasang Bearer JWT\n401 → #/401 · 403 → #/403 · 404 → pesan error",
             930, 880, 320, 90, font_size=11),
        proc("p4_b11", "Respons OK → render data + toast sukses", 930, 1010, 320, 80),
        note("p4_b12", "Route publik: #/ , #/products , #/cart , #/checkout , #/login , #/register , "
                       "#/forgot-password , #/reset-password , #/tracking .\nRoute privat: #/profile , #/dashboard , "
                       "#/staff-management , #/menu-crud , #/table-management , #/promo-crud .",
             1320, 760, 440, 120, font_size=9),
        note("p4_b13", "Halaman error: #/401 (sesi berakhir), #/403 (akses ditolak), #/404 (tidak ditemukan), "
                       "#/500 (kesalahan server).", 1320, 900, 440, 90),

        title("p4_tc", "C. LUPA KATA SANDI — OTP 6 DIGIT VIA GMAIL SMTP", 40, 880, 820, 30, size=15),
        start("p4_c1", "Klik 'Lupa kata sandi' (#/forgot-password)", 60, 930, 300, 64),
        dec("p4_c2", "Email terdaftar?", 50, 1030, 320, 110),
        proc("p4_c3", "Tampilkan pesan generik\n(tidak membocorkan status akun)", 420, 1040, 280, 90),
        proc("p4_c4", "Generate OTP 6 digit, simpan ke tabel PasswordResets\n(kode + masa berlaku)",
             50, 1180, 320, 90, font_size=11),
        proc("p4_c5", "Kirim email OTP via Gmail SMTP\n(support.ruangrasa@gmail.com)", 50, 1300, 320, 90, font_size=11),
        proc("p4_c6", "Pelanggan memasukkan OTP\ndi halaman #/reset-password", 50, 1420, 320, 80, font_size=11),
        dec("p4_c7", "OTP benar &\nbelum kedaluwarsa?", 50, 1530, 320, 110),
        proc("p4_c8", "POST /auth/reset-password\nupdate PasswordHash (BCrypt)", 420, 1420, 280, 90, fill=F_OK, stroke=GREEN),
        proc("p4_c9", "Toast sukses → redirect #/login", 420, 1545, 280, 80, fill=F_OK, stroke=GREEN),

        title("p4_td", "D. PEMETAAN PERAN → HALAMAN & HAK AKSES", 920, 1150, 840, 30, size=15),
        proc("p4_d1", "Super Admin\nmaster data, staf, seluruh fitur", 940, 1200, 250, 90, fill=LANE_ADMIN, stroke=PURPLE, font_size=11),
        proc("p4_d2", "Owner\ndashboard analitik & laporan", 1210, 1200, 250, 90, fill="#FDF2F8", stroke=PINK, font_size=11),
        proc("p4_d3", "Kasir (POS)\nverifikasi bayar, status meja", 940, 1310, 250, 90, fill=LANE_KASIR, stroke=KASIR, font_size=11),
        proc("p4_d4", "Barista / Dapur\nKDS: tiket, Cooking, Ready", 1210, 1310, 250, 90, fill=LANE_DAPUR, stroke=AMBER, font_size=11),
        proc("p4_d5", "Waiter\nantar ke meja, status meja", 940, 1420, 250, 90, fill=LANE_WAITER, stroke=BLUE, font_size=11),
        proc("p4_d6", "Driver\nklaim delivery, status antar", 1210, 1420, 250, 90, fill=LANE_DRIVER, stroke=GREEN, font_size=11),
        proc("p4_d7", "Customer\nkatalog, keranjang, tracking, ulasan", 940, 1530, 250, 90, fill=LANE_CUST, stroke=COPPER, font_size=11),
        note("p4_d8", "Batasan roles[]: #/dashboard (semua staf), #/staff-management , #/menu-crud , #/promo-crud "
                       "(Admin & Owner), #/table-management (Admin, Owner, Kasir, Waiter).",
             1480, 1200, 280, 200),
        note("p4_d9", "Refresh token tersimpan di tabel RefreshTokens agar sesi dapat diperbarui tanpa login ulang.",
             1480, 1430, 280, 120),
    ]

    edges = [
        E("p4_e1", "p4_a1", "p4_a2"),
        E("p4_e2", "p4_a2", "p4_a3"),
        E("p4_e3", "p4_a3", "p4_a4", "tidak", src_side="E", dst_side="W", color=RED),
        E("p4_e4", "p4_a3", "p4_a5", "ya", color=GREEN, width=3),
        E("p4_e5", "p4_a4", "p4_a2", "coba lagi", points=[(560, 190), (190, 190)],
          src_side="N", dst_side="N", dashed=True, color=RED),
        E("p4_e6", "p4_a5", "p4_a6", "", color=GREEN, width=3),
        E("p4_e7", "p4_a6", "p4_a7", "", color=GREEN, width=3),

        E("p4_e8", "p4_b1", "p4_b2"),
        E("p4_e9", "p4_b2", "p4_b3"),
        E("p4_e10", "p4_b3", "p4_b4", "tidak", src_side="E", dst_side="W", color=RED),
        E("p4_e11", "p4_b3", "p4_b5", "ya", color=GREEN, width=3),
        E("p4_e12", "p4_b5", "p4_b6", "belum login", src_side="E", dst_side="W", color=RED),
        E("p4_e13", "p4_b5", "p4_b7", "sudah login", color=GREEN, width=3),
        E("p4_e14", "p4_b7", "p4_b8", "tidak sesuai", src_side="E", dst_side="W", color=RED),
        E("p4_e15", "p4_b7", "p4_b9", "sesuai", color=GREEN, width=3),
        E("p4_e16", "p4_b9", "p4_b10", ""),
        E("p4_e17", "p4_b10", "p4_b11", ""),

        E("p4_e18", "p4_c1", "p4_c2"),
        E("p4_e19", "p4_c2", "p4_c3", "tidak terdaftar", src_side="E", dst_side="W", color=RED),
        E("p4_e20", "p4_c2", "p4_c4", "terdaftar", color=GREEN, width=3),
        E("p4_e21", "p4_c4", "p4_c5", "", color=GREEN, width=3),
        E("p4_e22", "p4_c5", "p4_c6", "", color=GREEN, width=3),
        E("p4_e23", "p4_c6", "p4_c7", ""),
        E("p4_e24", "p4_c7", "p4_c8", "OTP valid", points=[(395, 1585), (395, 1465)],
          src_side="E", dst_side="W", color=GREEN, width=3),
        E("p4_e25", "p4_c8", "p4_c9", "", color=GREEN, width=3),
        E("p4_e26", "p4_c7", "p4_c6", "OTP salah", points=[(30, 1585), (30, 1460)],
          src_side="W", dst_side="W", dashed=True, color=RED),
    ]

    # ---------------- SECTION A2: VALIDASI FORM DAFTAR & MASUK (3 LAPIS) ----------------
    nodes += [
        title("p4_te", "E. VALIDASI FORM DAFTAR & MASUK — 3 LAPIS (CLIENT → DATAANNOTATIONS → SERVICE)",
              40, 1760, 1700, 30, size=15),

        proc("p4_v0", "Pengguna mengisi form\n(#/register atau #/login)", 60, 1810, 230, 80, font_size=11),
        proc("p4_v1", "LAPIS 1 — CLIENT\nApp.validateInput() di js/app.js\n(toast + pesan .invalid-feedback)",
             60, 1930, 260, 110, fill=F_INFO, stroke=BLUE, font_size=11),

        dec("p4_vd1", "Nama lengkap valid?\nmin 3 huruf, hanya huruf\nTANPA batas maksimum", 360, 1900, 280, 150,
            font_size=10),
        dec("p4_vd2", "Email valid?\nnama@domain.tld\n(TLD min. 2 huruf)", 680, 1900, 250, 150, font_size=10),
        dec("p4_vd3", "Telepon Indonesia valid?\n08xx / +628xx, 9-14 digit\nprefix provider dikenal", 970, 1900, 280, 150,
            font_size=10),
        dec("p4_vd4", "Kata sandi kuat?\nmin 8 + huruf besar/kecil/angka\nTANPA batas maksimum", 1290, 1900, 280, 150,
            font_size=10),
        proc("p4_v2", "LAPIS 2 — MODEL\nDataAnnotations kustom:\n[FullName], [EmailAddress],\n[IndonesianPhone], [StrongPassword],\n[Compare] (LoginRequest.cs)",
             360, 2120, 320, 150, fill=F_WARN, stroke=AMBER, font_size=10),
        proc("p4_v3", "LAPIS 3 — SERVICE\nGuard manual di RuangrasaService:\nIsFullNameValid, IsEmailValid,\nIsIndonesianPhoneValid, IsStrongPasswordValid",
             720, 2120, 320, 150, fill=F_WARN, stroke=AMBER, font_size=10),
        proc("p4_v4", "Valid → buat akun (BCrypt)\natau sesi JWT diterbitkan", 1080, 2150, 250, 90,
             fill=F_OK, stroke=GREEN, font_size=11),
        proc("p4_v5", "Invalid → HTTP 400 + pesan\nspesifik per field, toast error", 1370, 2150, 250, 90,
             fill=F_ERR, stroke=RED, font_size=11),

        note("p4_vn1", "Prefix provider yang dikenal (3 digit setelah 0):\n" 
                       "Telkomsel & By.U: 811 812 813 821 822 851 852 853\nIndosat Ooredoo: 814 815 816 855 856 857 858\n" 
                       "XL Axiata: 817 818 819 859 877 878\nSmartfren: 881-889\nTri (3): 894-899",
             1660, 1900, 420, 170, font_size=9),
        note("p4_vn2", "Login hanya memvalidasi keberadaan isian; kebijakan kompleksitas sandi diterapkan saat " 
                       "pendaftaran, reset password, dan ganti sandi. Sandi 253 karakter tetap diterima (tanpa maksimum).",
             1660, 2090, 420, 120, font_size=9),
        note("p4_vn3", "Meter kekuatan sandi live di form daftar & reset: merah (lemah) → kuning (sedang) → " 
                       "hijau (kuat/sangat kuat) berdasarkan 4 syarat yang terpenuhi.",
             1660, 2230, 420, 100, font_size=9),
    ]

    edges += [
        E("p4_ev0", "p4_v0", "p4_v1", "", src_side="S", dst_side="N",
          points=[(175, 1910), (190, 1910)]),
        E("p4_ev1", "p4_v1", "p4_vd1", "", src_side="E", dst_side="W", color=BLUE, width=2,
          points=[(340, 1985), (340, 1975)]),
        E("p4_ev2", "p4_vd1", "p4_vd2", "lolos", src_side="E", dst_side="W", color=BLUE, width=2),
        E("p4_ev3", "p4_vd2", "p4_vd3", "lolos", src_side="E", dst_side="W", color=BLUE, width=2),
        E("p4_ev4", "p4_vd3", "p4_vd4", "lolos", src_side="E", dst_side="W", color=BLUE, width=2),
        E("p4_ev5", "p4_vd1", "p4_v5", "gagal", points=[(500, 2070), (1495, 2070)],
          src_side="S", dst_side="N", dashed=True, color=RED),
        E("p4_ev6", "p4_vd4", "p4_v4", "semua lolos", points=[(1430, 2070), (1205, 2070)],
          src_side="S", dst_side="N", color=GREEN, width=3),
        E("p4_ev7", "p4_v2", "p4_v3", "", src_side="E", dst_side="W", color=AMBER, width=2),
        E("p4_ev8", "p4_v1", "p4_v2", "submit → POST /auth/register\natau /auth/login",
          points=[(190, 2100), (190, 2160), (360, 2160)], src_side="S", dst_side="W", color=AMBER, width=2),
        E("p4_ev9", "p4_v3", "p4_v4", "", src_side="E", dst_side="W", color=AMBER, width=2),
    ]

    return Page("p4", "4. Autentikasi & RBAC", "autentikasi-jwt-rbac", nodes, edges,
                width=2120, height=2380)


# ------------------------------------------------------------------------------------------
# HALAMAN 5 - STATE MACHINE STATUS PESANAN
# ------------------------------------------------------------------------------------------
def _p5():
    nodes = [
        title("p5_title", "STATE MACHINE STATUS PESANAN & STATUS MEJA (RuangrasaService._validTransitions)", 60, 14, 1500, 40),

        proc("p5_o1", "WaitingConfirmation", 60, 70, 220, 70, fill=F_NEUTRAL, stroke=INK_SOFT, bold=True),
        proc("p5_o2", "Processing", 340, 70, 220, 70, fill=F_NEUTRAL, stroke=INK_SOFT, bold=True),

        proc("p5_s0", "PendingPayment", 60, 200, 220, 80, fill=F_WARN, stroke=AMBER, bold=True),
        proc("p5_s1", "Confirmed", 340, 200, 220, 80, fill=F_OK, stroke=GREEN, bold=True),
        proc("p5_s2", "Cooking", 620, 200, 220, 80, fill=F_WARN, stroke=AMBER, bold=True),
        proc("p5_s3", "Ready", 900, 200, 220, 80, fill=F_OK, stroke=GREEN, bold=True),

        proc("p5_r1", "ReadyToServe", 60, 340, 220, 80, fill=F_INFO, stroke=BLUE, bold=True),
        proc("p5_r2", "ReadyForPickup", 340, 340, 220, 80, fill=F_INFO, stroke=BLUE, bold=True),
        proc("p5_r3", "ReadyForDelivery", 620, 340, 240, 80, fill=F_INFO, stroke=BLUE, bold=True),
        proc("p5_del", "Delivering", 620, 480, 240, 80, fill=F_OK, stroke=GREEN, bold=True),
        proc("p5_dlv", "Delivered", 740, 620, 220, 80, fill=F_OK, stroke=GREEN, bold=True),
        proc("p5_done", "Completed", 1000, 640, 240, 80, fill="#DCFCE7", stroke=GREEN, bold=True, font_size=13),
        proc("p5_cancel", "Cancelled", 60, 480, 220, 80, fill=F_ERR, stroke=RED, bold=True),

        note("p5_n1", "Guard transisi: kamus _validTransitions di RuangrasaService menolak transisi mundur atau "
                       "tidak sah (contoh: Completed → Cooking akan gagal).", 1400, 90, 440, 110),
        note("p5_n2", "Aktor pengubah status: kasir (Confirmed, WaitingConfirmation), dapur/barista (Cooking, Ready), "
                       "waiter (Completed Dine-In), driver (Delivering, Delivered).", 1400, 220, 440, 110),
        note("p5_n3", "Status meja: Available → Occupied saat pesanan Dine-In dibuat atau pembayaran dikonfirmasi; "
                       "kembali Available saat pesanan dibatalkan atau meja dibersihkan.", 1400, 350, 440, 100),
        note("p5_n4", "Status pembayaran: Pending → Paid (saat verifikasi atau Completed) dan Failed saat pesanan "
                       "dibatalkan / bukti bayar ditolak.", 1400, 470, 440, 100),
        note("p5_n5", "Saat Cancelled: meja dibebaskan, pembayaran ditandai Failed, dan stok menu dikembalikan "
                       "(+quantity) oleh CancelOrder().", 1400, 590, 440, 100),
        note("p5_n6", "Kolom OrderStatus memiliki CHECK constraint di SQL Server sehingga status di luar daftar "
                       "resmi akan ditolak database.", 1400, 710, 440, 110),
    ]

    edges = [
        E("p5_e1", "p5_s0", "p5_s1", "kasir verifikasi bayar", src_side="E", dst_side="W", color=GREEN, width=3),
        E("p5_e2", "p5_s1", "p5_s2", "dapur mulai meracik", src_side="E", dst_side="W", color=AMBER, width=3),
        E("p5_e3", "p5_s2", "p5_s3", "dapur selesai (Ready)", src_side="E", dst_side="W", color=GREEN, width=3),
        E("p5_e4", "p5_s0", "p5_o1", "menunggu konfirmasi", src_side="N", dst_side="S", color=INK_SOFT, dashed=True),
        E("p5_e5", "p5_o1", "p5_o2", "diterima", src_side="E", dst_side="W", color=INK_SOFT, dashed=True),
        E("p5_e6", "p5_o2", "p5_s2", "langsung Cooking", points=[(450, 180), (730, 180)],
          src_side="S", dst_side="N", color=INK_SOFT, dashed=True),
        E("p5_e7", "p5_o1", "p5_s1", "", points=[(300, 105), (300, 240)],
          src_side="E", dst_side="W", color=GREEN, dashed=True),
        E("p5_e8", "p5_s3", "p5_r1", "Dine-In", points=[(1010, 310), (170, 310)],
          src_side="S", dst_side="N", color=BLUE, width=3),
        E("p5_e9", "p5_s3", "p5_r2", "Take Away", points=[(1010, 320), (450, 320)],
          src_side="S", dst_side="N", color=BLUE, width=3),
        E("p5_e10", "p5_s3", "p5_r3", "Delivery", points=[(1010, 330), (740, 330)],
          src_side="S", dst_side="N", color=BLUE, width=3),
        E("p5_e11", "p5_r3", "p5_del", "driver berangkat", src_side="S", dst_side="N", color=GREEN, width=3),
        E("p5_e12", "p5_del", "p5_dlv", "tiba di alamat", points=[(740, 590), (850, 590)],
          src_side="S", dst_side="N", color=GREEN, width=3),
        E("p5_e13", "p5_dlv", "p5_done", "pesanan diterima", points=[(980, 660), (980, 680)],
          src_side="E", dst_side="W", color=GREEN, width=3),
        E("p5_e14", "p5_r1", "p5_done", "waiter menyajikan", points=[(300, 380), (300, 600), (1120, 600)],
          src_side="E", dst_side="N", color=GREEN, width=3),
        E("p5_e15", "p5_r2", "p5_done", "diambil di counter", points=[(450, 610), (1260, 610), (1260, 640)],
          src_side="S", dst_side="NE", color=GREEN, width=3),
        E("p5_e16", "p5_s0", "p5_cancel", "batal", points=[(30, 240), (30, 520)],
          src_side="W", dst_side="W", color=RED, dashed=True),
        E("p5_e17", "p5_s2", "p5_cancel", "batal", points=[(730, 290), (300, 290), (300, 480)],
          src_side="S", dst_side="NE", color=RED, dashed=True),
        E("p5_e18", "p5_del", "p5_cancel", "batal", src_side="W", dst_side="E", color=RED, dashed=True),
    ]

    return Page("p5", "5. State Machine Status Pesanan", "state-machine-status", nodes, edges,
                width=1900, height=900)


# ------------------------------------------------------------------------------------------
# HALAMAN 6 - LIVE TRACKING DELIVERY & KOMUNIKASI DRIVER-PELANGGAN
# ------------------------------------------------------------------------------------------
def _p6():
    nodes = [
        title("p6_title", "ALUR LIVE TRACKING DELIVERY (GPS + OSRM) & KOMUNIKASI KURIR ↔ PELANGGAN", 60, 14, 1500, 40),
        subtitle("p6_sub", "Sisi driver (kiri), server (tengah), pelanggan (kanan) — plus modul driver-comm.js di bagian bawah",
                 60, 52, 1200, 24),

        start("p6_d1", "Driver menekan 'Mulai antar'\n(status Delivering)", 80, 120, 320, 70),
        proc("p6_d2", "navigator.geolocation.watchPosition()\nmengirim posisi setiap beberapa detik", 80, 240, 320, 80, font_size=11),
        proc("p6_d3", "POST /tracking/update\n{ OrderNumber, DriverId, Latitude, Longitude }", 80, 370, 320, 80, font_size=11),
        proc("p6_d4", "Peta driver: marker kurir + rute jalan OSRM\nsimulasi lalu lintas Bandung (hijau/kuning/merah)",
             80, 500, 320, 100, font_size=10),
        dec("p6_d5", "Sampai di alamat?", 100, 650, 280, 110),
        proc("p6_d6", "POST /orders/{id}/status\n→ status Delivered", 80, 820, 320, 80),
        proc("p6_d7", "Serah terima & konfirmasi diterima\n→ status Completed", 80, 950, 320, 80),
        end("p6_d8", "Pengantaran selesai", 100, 1080, 280, 64),

        proc("p6_s1", "RuangrasaApiController\nPOST /tracking/update → SaveDriverLocation()", 720, 370, 440, 80, font_size=11),
        N("p6_s2", "Tabel DriverLocationHistories\n(OrderNumber, DriverId, Latitude, Longitude, CreatedAt)",
          720, 500, 440, 110, shape="cylinder", fill=F_INFO, stroke=BLUE, font_size=11),
        proc("p6_s3", "GET /tracking/latest/{orderId}\nambil posisi kurir terakhir", 720, 660, 440, 80, font_size=11),
        proc("p6_s4", "GET /tracking/active-deliveries\npeta seluruh pengantaran aktif (dashboard staf)", 720, 790, 440, 80, font_size=11),

        proc("p6_c1", "Buka #/tracking?order=RR-...\npeta Leaflet + marker kedai & alamat pelanggan", 1260, 660, 460, 80, font_size=11),
        proc("p6_c2", "startLivePolling() — polling berkala\nGET /tracking/latest/{orderId}", 1260, 790, 460, 90, font_size=11),
        dec("p6_c3", "Status sudah\nDelivered / Completed?", 1280, 930, 420, 110),
        proc("p6_c4", "Hentikan polling, tampilkan status akhir\n+ form ulasan bintang 1-5", 1260, 1090, 460, 80, font_size=11),

        lane("p6_lcomm", "KOMUNIKASI KURIR ↔ PELANGGAN (js/components/driver-comm.js)", 60, 1200, 1680, 210, LANE_ADMIN, PURPLE, start_size=44),
        proc("p6_m1", "Live chat dua arah\n(BroadcastChannel + localStorage)", 30, 60, 380, 80, "p6_lcomm", font_size=11),
        proc("p6_m2", "Notifikasi pesan masuk\n+ chime Web Audio API", 440, 60, 380, 80, "p6_lcomm", font_size=11),
        proc("p6_m3", "Panggilan suara VoIP (simulasi)\nring tone + voice synthesizer", 850, 60, 380, 80, "p6_lcomm", font_size=11),
        proc("p6_m4", "Auto-reply bot\nsaat pengujian satu pengguna", 1260, 60, 380, 80, "p6_lcomm", font_size=11),
        N("p6_m5", "Chat & VoIP berjalan penuh di sisi klien tanpa backend: pesan disinkronkan antar tab melalui "
                   "BroadcastChannel/localStorage.", 30, 155, 1610, 40, parent="p6_lcomm", shape="text",
          font_size=10, align="left", font_color=INK_SOFT),
    ]

    edges = [
        E("p6_e1", "p6_d1", "p6_d2"),
        E("p6_e2", "p6_d2", "p6_d3"),
        E("p6_e3", "p6_d3", "p6_s1", "posisi dikirim", src_side="E", dst_side="W", color=BLUE, width=3),
        E("p6_e4", "p6_d3", "p6_d4", "", color=BLUE),
        E("p6_e5", "p6_d4", "p6_d5", ""),
        E("p6_e6", "p6_d5", "p6_d6", "ya", color=GREEN, width=3),
        E("p6_e7", "p6_d5", "p6_d3", "belum (kirim posisi lagi)", points=[(50, 705), (50, 410)],
          src_side="W", dst_side="W", dashed=True, color=BLUE),
        E("p6_e8", "p6_d6", "p6_d7", "", color=GREEN, width=3),
        E("p6_e9", "p6_d7", "p6_d8", "", color=GREEN, width=3),
        E("p6_e10", "p6_s1", "p6_s2", "simpan posisi", src_side="S", dst_side="N", color=BLUE, width=3),
        E("p6_e11", "p6_s2", "p6_s3", "query posisi terakhir", src_side="S", dst_side="N", color=BLUE, width=3),
        E("p6_e12", "p6_s2", "p6_s4", "daftar pengantaran aktif", points=[(1190, 555), (1190, 830)],
          src_side="E", dst_side="E", color=BLUE, dashed=True),
        E("p6_e13", "p6_s3", "p6_c1", "hasil polling", src_side="E", dst_side="W", color=BLUE, width=3),
        E("p6_e14", "p6_c1", "p6_c2", "", color=BLUE, width=3),
        E("p6_e15", "p6_c2", "p6_c3", "", color=BLUE, width=3),
        E("p6_e16", "p6_c3", "p6_c4", "sudah selesai", color=GREEN, width=3),
        E("p6_e17", "p6_c3", "p6_c2", "belum (lanjut polling)", points=[(1230, 985), (1230, 835)],
          src_side="W", dst_side="W", dashed=True, color=BLUE),
        E("p6_e18", "p6_m1", "p6_d7", "koordinasi titik antar", points=[(280, 1180), (430, 1180), (430, 990)],
          src_side="N", dst_side="E", dashed=True, color=PURPLE),
    ]

    return Page("p6", "6. Live Tracking & Komunikasi Kurir", "live-tracking-kurir", nodes, edges,
                width=1800, height=1470)


# ------------------------------------------------------------------------------------------
# HALAMAN 7 - MASTER DATA CRUD & DASHBOARD ANALITIK
# ------------------------------------------------------------------------------------------
def _p7():
    nodes = [
        title("p7_title", "MASTER DATA CRUD (ADMIN & OWNER) + DASHBOARD ANALITIK REAL TIME", 40, 14, 1600, 40),

        title("p7_ta", "A. CRUD MASTER MENU + UPLOAD FOTO", 40, 70, 660, 30, size=15),
        start("p7_a1", "Admin membuka #/menu-crud", 60, 120, 300, 64),
        proc("p7_a2", "Muat daftar: POST /menus/paging\n(search, filter kategori, multi-sort, pagination)", 60, 210, 300, 90, font_size=11),
        dec("p7_a3", "Aksi yang dipilih?", 70, 330, 280, 110),
        proc("p7_a4", "Tambah / ubah data", 60, 470, 200, 80, font_size=11),
        proc("p7_a5", "Hapus data\n(soft delete)", 280, 470, 200, 80, font_size=11),
        proc("p7_a6", "Lihat detail\nmenu (popup)", 500, 470, 200, 80, font_size=11),
        proc("p7_a7", "Validasi input\n(wajib, harga > 0)", 60, 600, 200, 90, font_size=11),
        proc("p7_a8", "POST /api/ruangrasa/upload\n(multipart ≤ 10 MB, fallback base64)", 60, 720, 200, 100, font_size=10),
        proc("p7_a9", "Simpan: POST /menus\natau PUT /menus/{id}", 60, 850, 200, 80, font_size=10),
        proc("p7_a10", "Toast sukses + muat ulang\ndaftar (paging dipertahankan)", 60, 960, 200, 80, font_size=10),
        proc("p7_a11", "DELETE /menus/{id}\n(IsDeleted = 1)", 280, 960, 200, 80, fill=F_ERR, stroke=RED, font_size=11),
        end("p7_a12", "Master data tersimpan\n(tampil di katalog)", 60, 1090, 200, 64, font_size=11),

        title("p7_tb", "B. CRUD VOUCHER / PROMO", 760, 70, 480, 30, size=15),
        proc("p7_b1", "Daftar promo: POST /promos/paging\n(search, filter status, sort)", 780, 180, 440, 80, font_size=11),
        proc("p7_b2", "Tambah / ubah promo\n(kode, diskon %, min belanja, kuota, masa berlaku)", 780, 310, 440, 90, font_size=11),
        proc("p7_b3", "Toggle aktif/nonaktif\nPUT /promos/{id}", 780, 450, 440, 70, font_size=11),
        proc("p7_b4", "Dipakai pelanggan di checkout\nPOST /promos/validate", 780, 570, 440, 80, font_size=11),
        dec("p7_b5", "Voucher valid?\n(min belanja, kuota, tanggal)", 800, 700, 400, 110, font_size=11),
        proc("p7_b6", "Diskon diterapkan ke total belanja", 780, 860, 440, 70, fill=F_OK, stroke=GREEN, font_size=11),
        proc("p7_b7", "Pesan error ditampilkan ke pelanggan", 780, 960, 440, 70, fill=F_ERR, stroke=RED, font_size=11),

        title("p7_tc", "C. DENAH MEJA & MANAJEMEN STAF", 1300, 70, 560, 30, size=15),
        proc("p7_c1", "Denah meja: GET /tables\n(nomor, kapasitas, area, status)", 1320, 180, 520, 80, font_size=11),
        proc("p7_c2", "Ubah status: PUT/PATCH /tables/{id}/status\n(Available / Occupied / Reserved)", 1320, 310, 520, 90, font_size=11),
        proc("p7_c3", "Kelola staf: GET /staff\n(daftar 7 peran + beban tugas)", 1320, 450, 520, 80, font_size=11),
        proc("p7_c4", "Ubah data staf: PUT /staff/{id}", 1320, 580, 520, 70, font_size=11),
        proc("p7_c5", "Aktif/nonaktif: PUT /staff/{id}/toggle-status", 1320, 700, 520, 70, font_size=11),
        proc("p7_c6", "Hapus staf: DELETE /staff/{id}\n(akun staf dinonaktifkan)", 1320, 820, 520, 80, font_size=11),
        note("p7_c7", "Master data dipakai lintas peran: menu & promo tampil di katalog pelanggan, data meja dipakai "
                       "saat pemilihan Dine-In, data staf dipakai kasir/dapur/waiter/driver.", 1320, 950, 520, 100),

        lane("p7_ld", "D. DASHBOARD & ANALITIK REAL TIME PER PERAN (POLLING BERKALA)",
             40, 1220, 1820, 390, LANE_SYS, PURPLE, start_size=36),
        proc("p7_d1", "Kasir: seluruh transaksi aktif\n& riwayat hari ini", 30, 60, 430, 70, "p7_ld", font_size=11),
        proc("p7_d2", "Dapur: antrean tiket\nCooking & Ready (KDS)", 490, 60, 430, 70, "p7_ld", font_size=11),
        proc("p7_d3", "Waiter: pesanan Dine-In siap saji\n+ Take Away di counter", 950, 60, 430, 70, "p7_ld", font_size=11),
        proc("p7_d4", "Driver: pesanan delivery\nsiap diambil & sedang diantar", 1410, 60, 380, 70, "p7_ld", font_size=10),
        proc("p7_d5", "KPI omset harian / mingguan / bulanan\n(order berstatus Completed)", 30, 160, 430, 80, "p7_ld", font_size=11),
        proc("p7_d6", "Total pesanan selesai bulan ini\n+ tren pesanan", 490, 160, 430, 80, "p7_ld", font_size=11),
        proc("p7_d7", "Top 5 menu terlaris\n& total menu terjual", 950, 160, 430, 80, "p7_ld", font_size=11),
        proc("p7_d8", "Okupansi meja real time\n(Occupied vs Available)", 1410, 160, 380, 80, "p7_ld", font_size=10),
        proc("p7_d9", "Evaluasi kinerja 7 staf: jumlah pesanan ditangani & omset yang ditangani", 30, 270, 890, 80, "p7_ld", font_size=11),
        proc("p7_d10", "Endpoint: GET /dashboard, POST /sales/paging, GET /staff, GET /orders/customer/{id}",
             950, 270, 840, 80, "p7_ld", font_size=11),
    ]

    edges = [
        E("p7_e1", "p7_a1", "p7_a2"),
        E("p7_e2", "p7_a2", "p7_a3"),
        E("p7_e3", "p7_a3", "p7_a4", "tambah/ubah", points=[(210, 455), (160, 455)], src_side="S", dst_side="N", color=ORANGE),
        E("p7_e4", "p7_a3", "p7_a5", "hapus", points=[(210, 460), (380, 460)], src_side="S", dst_side="N", color=RED),
        E("p7_e5", "p7_a3", "p7_a6", "lihat detail", points=[(210, 465), (600, 465)], src_side="S", dst_side="N", color=INK_SOFT),
        E("p7_e6", "p7_a4", "p7_a7", "", color=ORANGE, width=3),
        E("p7_e7", "p7_a7", "p7_a8", "", color=ORANGE, width=3),
        E("p7_e8", "p7_a8", "p7_a9", "", color=ORANGE, width=3),
        E("p7_e9", "p7_a9", "p7_a10", "", color=ORANGE, width=3),
        E("p7_e10", "p7_a10", "p7_a12", "", color=ORANGE, width=3),
        E("p7_e11", "p7_a5", "p7_a11", "", color=RED, width=3),
        E("p7_e12", "p7_a11", "p7_a12", "", points=[(270, 1000), (270, 1122)], src_side="W", dst_side="E", color=RED),
        E("p7_e13", "p7_b1", "p7_b2", ""),
        E("p7_e14", "p7_b2", "p7_b3", ""),
        E("p7_e15", "p7_b3", "p7_b4", ""),
        E("p7_e16", "p7_b4", "p7_b5", ""),
        E("p7_e17", "p7_b5", "p7_b6", "valid", color=GREEN, width=3),
        E("p7_e18", "p7_b5", "p7_b7", "tidak valid", points=[(770, 755), (770, 995)], src_side="W", dst_side="W", color=RED),
        E("p7_e19", "p7_c1", "p7_c2", ""),
        E("p7_e20", "p7_c2", "p7_c3", ""),
        E("p7_e21", "p7_c3", "p7_c4", ""),
        E("p7_e22", "p7_c4", "p7_c5", ""),
        E("p7_e23", "p7_c5", "p7_c6", ""),
    ]

    return Page("p7", "7. Master Data CRUD & Dashboard", "master-data-dashboard", nodes, edges,
                width=1900, height=1660)


# ------------------------------------------------------------------------------------------
# HALAMAN 8 - ERD DATABASE
# ------------------------------------------------------------------------------------------
def ent(nid, name, x, y, rows, w=400, stroke=KASIR):
    h = 30 + 15 * len(rows) + 12
    return N(nid, name, x, y, w, h, shape="entity", fill="#FFFFFF", stroke=stroke,
             rows=rows, start_size=30, font_size=12)


def _p8():
    nodes = [
        title("p8_title", "ENTITY RELATIONSHIP DIAGRAM — DATABASE RuangrasaDb (Skema Relasional 14 Tabel)", 60, 14, 1600, 40),
        subtitle("p8_sub", "Kardinalitas one-to-many (1..N) · PK = primary key · FK = foreign key · kolom audit CreatedAt/UpdatedAt",
                 60, 52, 1200, 24),

        ent("p8_users", "Users", 60, 90, [
            "UserId (PK)", "RoleId (FK → Roles)", "FullName", "Email (unik)", "PasswordHash (BCrypt)",
            "PhoneNumber", "IsActive", "CreatedAt", "UpdatedAt"], stroke=PURPLE),
        ent("p8_roles", "Roles", 60, 460, [
            "RoleId (PK)", "RoleName (unik)", "Description", "CreatedAt", "UpdatedAt"], stroke=PURPLE),
        ent("p8_rt", "RefreshTokens", 60, 830, [
            "TokenId (PK)", "UserId (FK → Users)", "Token", "ExpiryDate", "IsRevoked", "CreatedAt", "UpdatedAt"], stroke=PURPLE),
        ent("p8_pr", "PasswordResets", 60, 1200, [
            "ResetId (PK)", "UserId (FK → Users)", "Email", "OtpCode (6 digit)", "ExpiredAt", "IsUsed", "CreatedAt"], stroke=PURPLE),

        ent("p8_orders", "Orders", 520, 90, [
            "OrderId (PK)", "OrderNumber (unik)", "CustomerId (FK → Users)", "GuestName",
            "OrderType (DineIn/TakeAway/Delivery)", "TableId (FK → DiningTables)", "CashierId (FK → Users)",
            "KitchenStaffId (FK → Users)", "WaiterId (FK → Users)", "DriverId (FK → Users)", "Subtotal",
            "Tax (PPN 10%)", "Discount", "DeliveryFee", "TotalAmount", "OrderStatus (13 status)",
            "PaymentProofUrl", "CancelReason", "CreatedAt / UpdatedAt"], stroke=COPPER),
        ent("p8_oi", "OrderItems", 520, 460, [
            "OrderItemId (PK)", "OrderId (FK → Orders)", "MenuId (FK → Menus)", "Quantity", "UnitPrice",
            "SubtotalPrice (computed)", "Notes", "CreatedAt"], stroke=COPPER),
        ent("p8_menus", "Menus", 520, 830, [
            "MenuId (PK)", "CategoryId (FK → Categories)", "MenuName", "Description", "Price", "Stock",
            "ImageUrl (hasil upload)", "IsAvailable", "IsDeleted (soft delete)", "CreatedAt", "UpdatedAt"], stroke=AMBER),
        ent("p8_cat", "Categories", 520, 1200, [
            "CategoryId (PK)", "CategoryName", "Description", "IsDeleted", "CreatedAt", "UpdatedAt"], stroke=AMBER),

        ent("p8_tables", "DiningTables", 980, 90, [
            "TableId (PK)", "TableNumber (unik)", "Area (Indoor/Outdoor/VIP)", "Capacity",
            "Status (Available/Occupied)", "CreatedAt", "UpdatedAt"], stroke=GREEN),
        ent("p8_deliv", "Deliveries", 980, 460, [
            "DeliveryId (PK)", "OrderId (FK → Orders)", "DriverId (FK → Users)", "DeliveryStatus", "RecipientName",
            "DeliveryAddress", "Latitude / Longitude", "DeliveredAt", "Notes"], stroke=GREEN),
        ent("p8_dlh", "DriverLocationHistories", 980, 830, [
            "LocationId (PK)", "OrderNumber", "DriverId (FK → Users)", "Latitude", "Longitude", "CreatedAt"], stroke=GREEN),
        ent("p8_promos", "Promos", 980, 1200, [
            "PromoId (PK)", "PromoCode (unik)", "Description", "DiscountPercent", "MinPurchase", "MaxDiscount",
            "Quota", "StartDate / EndDate", "IsActive", "IsDeleted"], stroke=PINK),

        ent("p8_pay", "Payments", 1440, 90, [
            "PaymentId (PK)", "OrderId (FK → Orders)", "PaymentMethod (Cash/QRIS/Transfer/Card)", "PaymentStatus",
            "AmountPaid", "TransactionReference", "PaymentProofUrl", "PaidAt", "CreatedAt"], stroke=BLUE),
        ent("p8_rev", "Reviews", 1440, 460, [
            "ReviewId (PK)", "OrderId (FK → Orders)", "CustomerId (FK → Users)", "MenuId (FK → Menus, opsional)",
            "Rating (1-5)", "Comment", "CreatedAt"], stroke=BLUE),
        note("p8_n1", "Notasi: (PK) primary key dan (FK) foreign key. Panah berlabel 1..N berarti satu baris tabel induk "
                       "berelasi dengan banyak baris tabel anak. Promos dihubungkan ke Orders melalui kolom Discount "
                       "(snapshot nilai diskon, bukan foreign key).", 1440, 830, 400, 170),
        note("p8_n2", "Soft delete pada Menus, Categories dan Promos. Audit CreatedAt/UpdatedAt hampir di semua tabel. "
                       "Seed data ≥ 20 baris per tabel utama. DriverLocationHistories dibuat otomatis oleh "
                       "EnsureSchemaUpdated().", 1440, 1200, 400, 190),
    ]

    edges = [
        E("p8_e1", "p8_users", "p8_roles", "1..N RoleId", color=PURPLE),
        E("p8_e2", "p8_users", "p8_rt", "1..N UserId", points=[(40, 178.5), (40, 903.5)],
          src_side="W", dst_side="W", color=PURPLE),
        E("p8_e3", "p8_users", "p8_pr", "1..N UserId", points=[(25, 267), (25, 1273.5)],
          src_side="SW", dst_side="W", color=PURPLE),
        E("p8_e4", "p8_users", "p8_orders", "1..N CustomerId", points=[(490, 178.5), (490, 253.5)],
          src_side="E", dst_side="W", color=COPPER, width=3),
        E("p8_e5", "p8_orders", "p8_oi", "1..N OrderId", color=COPPER, width=3),
        E("p8_e6", "p8_menus", "p8_oi", "1..N MenuId", src_side="N", dst_side="S", color=AMBER),
        E("p8_e7", "p8_menus", "p8_cat", "1..N CategoryId", color=AMBER),
        E("p8_e8", "p8_orders", "p8_tables", "1..N TableId", points=[(950, 253.5), (950, 163.5)],
          src_side="E", dst_side="W", color=GREEN),
        E("p8_e9", "p8_orders", "p8_deliv", "1..N OrderId", points=[(935, 253.5), (935, 548.5)],
          src_side="E", dst_side="W", color=GREEN),
        E("p8_e10", "p8_orders", "p8_pay", "1..N OrderId", points=[(720, 70), (1640, 70)],
          src_side="N", dst_side="N", color=BLUE, width=3),
        E("p8_e11", "p8_orders", "p8_rev", "1..N OrderId", points=[(720, 80), (1400, 80), (1400, 533.5)],
          src_side="N", dst_side="W", color=BLUE),
        E("p8_e12", "p8_deliv", "p8_users", "1..N DriverId",
          points=[(960, 637), (960, 430), (500, 430), (500, 267)], src_side="SW", dst_side="SE", dashed=True, color=PURPLE),
    ]

    return Page("p8", "8. ERD Database", "erd-database", nodes, edges, width=1900, height=1490)


PAGES = [_p1(), _p2(), _p3(), _p4(), _p5(), _p6(), _p7(), _p8()]
