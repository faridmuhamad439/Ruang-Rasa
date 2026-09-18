## KETENTUAN UMUM PEMBUATAN PROJEKAN S1

## FRONTEND (Client Side)

## 1. Responsive Layout

Website waijib responsif dan dapat digunakan dengan baik pada:

- Mobile (= 768px)

- Tablet (769px — 1024px)

- Desktop (>1024px)

Setiap halaman utama harus memiliki tampilan yang menyesuaikan ukuran layar tanpa terjadi overflow ataupun layout yang rusak.

## 2. Authentication Flow

Frontend wajib memiliki alur autentikasi lengkap.

Minimal terdiri dari:

- Login

- Register

- Logout

- Forgot Password

- Reset Password

## Ketentuan:

- Token JWT harus disimpan menggunakan Local Storage atau Cookie.

- User yang belum login tidak dapat mengakses halaman yang bersifat private.

- Setelah login berhasil, user otomatis diarahkan ke Dashboard.

- Session harus tetap aktif ketika browser di-refresh.

- Logout harus menghapus token dan seluruh data autentikasi.

## 3. Routing

Menggunakan Client Side Routing.

## Minimal memiliki:

- Public Route

- Private Route


- . Role Route (berdasarkan role)

- . Redirect ketika tidak memiliki hak akses.

- 4. Dashboard

Dashboard wajib menampilkan data secara real-time dari backend.

Minimal berisi:

- Card Summary

- Total Data

- Statistik

- Aktivitas terbaru

Dashboard tidak boleh hanya berupa tampilan statis.

## 5. CRUD Interface

Setiap data utama wajib memiliki halaman:

- List Data

- Detail Data

- Tambah Data

- Edit Data

- Hapus Data

Semua harus terhubung dengan API. proses

## 6. Searching, Filtering & Sorting

Minimal memiliki:

Search

- \+ berdasarkan keyword

Filter

- status

- « kategori tanggal


## Sorting

- A-Z

- Z-A

Seluruh fitur dapat digunakan secara bersamaan.

- terbaru

- terlama

## 7. Pagination

Data list wajib menggunakan Pagination.

## Minimal:

- « Previous

- o Next

- Nomor halaman

- « Informasi jumlah data

- « jumlah data per halaman Pilihan

## 8. Upload File

Minimal mendukung untuk upload gambar atau PDF.

## 9. Form Validation

Semua form wajib memiliki validasi.

## Contoh:

- \+ Required

- Minimum karakter

- Maximum karakter

- o Format Email

- « Nomor Telepon

- \+ Password Confirmation

Error harus muncul secara realtime.


## 10. Notification

Seluruh CRUD wajib memiliki notifikasi. proses

Contoh:

- Success

- o Error

- « Warning

- « Info

Menggunakan Toast Notification.

## 11. Error Handling

Minimal memiliki halaman:

- « 401 Unauthorized

- « 403 Forbidden

- 404 Not Found

- « 500 Internal Server Error

Serta fallback ketika API gagal.

## BACKEND (Server Side)

- 1.

API wajib mengikuti standar REST.

## Minimal:

- GET

- . POST

- PUT

- PATCH

- DELETE

Menggunakan HTTP Status Code yang sesuai.


## 2. Authentication & Authorization

Wajib memiliki:

- « Register

- Login

- « Logout

- « Refresh (opsional menjadi nilai tambah) Token

- Forgot Password

- Reset Password

## 3. Role Based Access Control (RBAC)

Minimal terdapat 2 role.

Contoh:

- Admin

- User

Hak akses setiap role harus berbeda.

## 4. CRUD Lengkap

Minimal terdapat 6 entitas utama.

Setiap entitas wajib memiliki:

- o Create

- « Read

- « Update

- « Delete

Tidak boleh ada CRUD yang hanya dummy.

## 5. Server Side Validation

Semua endpoint POST dan PUT wajib memiliki validasi.

Contoh:

- « Required

- Email

- « Unique


- Minimum

- Maximum

- o Enum

- « Numeric

- Date

Error harus dikembalikan dalam format JSON.

## 6. Upload File

Backend wajib mendukung upload Gambar atau PDF.

## 7. Global Error Handling

Harus menangani:

- « 400 Request Bad

- 403 Forbidden

- 404 Not Found

- « 422 Validation Error

- « 500 Internal Server Error

Format harus konsisten. response

## 8. Database Relationship

Minimal memiliki:

- « 6tabelutama

- o brelasi

Waijib terdapat:

- « OneToOne

- « Many One To

- « Many To One

- « Many To Many


## 9. Soft Delete

Minimal diterapkan pada 2 tabel. Data yang dihapus tidak langsung hilang dari database.

## 10.API Documentation

Menggunakan salah satu:

- « Swagger

- « Postman Collection

Dokumentasi harus dapat digunakan untuk menguiji seluruh endpoint.

## 11. Security

Minimal menerapkan salah satu berikut ini:

- « Password Hashing

- « JWT Authentication

- \+ CORS

- Request Validation

- « Injection Prevention SQL

- « XSS Protection (nilai tambah)

## 12. Search, Filter & Pagination API

Endpoint list wajib mendukung:

- Search

- o Filter

- « Sorting

- \+ Pagination

## Contoh:

- « /products?page=18&limit=10 GET

- « /products?search=laptop GET

- GET /products?status=active

- « /products?sort=name GET

- « /products?category=1 GET


## DATABASE

Database

- Minimal 6 tabel utama.

- Minimal 5 relasi antar tabel.

- Memiliki Primary Key dan Foreign Key.

- Menggunakan normalisasi minimal hingga 3NF.

- Menggunakan timestamp (created_at dan updated_at) pada setiap tabel utama.

- Minimal terdapat 2 tabel yang menerapkan soft delete.

- Data awal (seed) minimal 20 data untuk setiap tabel utama agar aplikasi dapat diuji dengan baik.

minimal

memenuhi

ketentuan

berikut:

## TATA CARA PENGUMPULAN PROYEK

## Ketentuan Pengumpulan

- Proyek berupa aplikasi Fullstack yang terdiri dari Frontend dan Backend.

- Frontend dan Backend wajib berada dalam satu repository GitHub (monorepo).

- Repository GitHub wajib dapat diakses secara Public.

- Setiap proyek wajib memiliki file README.md yang berisi minimal:

- o Judul aplikasi

- Oo Deskripsi singkat aplikasi o

- o 0 Fitur utama

- o 0 Teknologi yang digunakan

- oO Struktur folder proyek o

- o o Carainstalasi dan menjalankan aplikasi

- Wajib mencantumkan akun demo apabila diperlukan, seperti username/email dan password.

- Wajib menyertakan dokumentasi perancangan sistem berupa Flowchart.

## Pengumpulan Proyek

Batas akhir pengumpulan proyek adalah:

## Jumat, 18 September 2026 pukul 22.00 WIB

Pengumpulan proyek dilakukan melalui Google Form berikut:

[https://forms.gle/TeMvXvpMzH1v93vNA](https://forms.gle/TeMvXvpMzH1v93vNA)


## Video Penjelasan Proyek

Setiap peserta juga wajib membuat video rekam layar (screen recording) yang berisi penjelasan mengenai proyek yang telah dibuat.

Video minimal menjelaskan:

- \+ Gambaran singkat dan tujuan aplikasi.

- « Fitur-fitur yang telah dibuat. utama

- \+ penggunaan aplikasi. Demo

- \+ Penjelasan singkat mengenai Frontend dan Backend.

- « kerja aplikasi dari sisi pengguna. Alur

- « Penjelasan bagian atau fitur unggulan dari proyek.

Video dikumpulkan melalui folder Google Drive berikut:

[JAlawSLGZMXg_t?usp=sharing](https://drive.google.com/drive/folders/1TCJp86VldSTtU3EQM-JAIawSLGZMXg_t?usp=sharing)

Batas akhir pengumpulan video: Minggu, 20 September 2026. [URL 🔗](https://drive.google.com/drive/folders/1TCJp86VldSTtU3EQM-JAIawSLGZMXg_t?usp=sharing)

Pastikan proyek dan video sudah dikumpulkan sesuai batas waktu yang telah ditentukan.
