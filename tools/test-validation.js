// ==========================================================================
// UJI VALIDATOR APP.validateInput (Node.js, tanpa framework)
// Menjalankan ulang logika regex yang sama persis dengan client/js/app.js
// Jalankan:  node tools/test-validation.js
// ==========================================================================

const App = {
    PHONE_ID_PREFIXES: [
        { provider: 'Telkomsel (simPATI / Kartu As / Halo)', prefixes: ['811', '812', '813', '821', '822', '852', '853', '851'] },
        { provider: 'Indosat Ooredoo (IM3 / Tri)',           prefixes: ['814', '815', '816', '855', '856', '857', '858'] },
        { provider: 'XL Axiata (Xtra Combo / Xplore)',       prefixes: ['817', '818', '819', '859', '877', '878'] },
        { provider: 'Smartfren',                             prefixes: ['881', '882', '883', '884', '885', '886', '887', '888', '889'] },
        { provider: 'Tri (3)',                               prefixes: ['894', '895', '896', '897', '898', '899'] },
        { provider: 'By.U (Telkomsel)',                      prefixes: ['851'] }
    ],

    validateIndonesianPhone(raw) {
        const digits = (raw || '').replace(/[\s()-]/g, '');
        if (!digits) return { valid: false, message: 'Nomor telepon wajib diisi.' };
        let normalized = digits;
        if (/^\+62|^62/.test(normalized)) normalized = '0' + normalized.replace(/^\+?62/, '');
        if (!/^08\d{7,12}$/.test(normalized)) {
            return { valid: false, message: 'Nomor telepon Indonesia harus 9-14 digit setelah 08 (format 08xx atau +628xx).' };
        }
        const prefix3 = normalized.slice(1, 4); // 3 digit setelah leading '0' (812, 851, dst.)
        const provider = this.PHONE_ID_PREFIXES.find(p => p.prefixes.includes(prefix3));
        if (!provider) {
            return { valid: false, message: `Prefix ${prefix3} bukan nomor provider Indonesia yang dikenal (Telkomsel, Indosat, XL, Smartfren, Tri, By.U).` };
        }
        return { valid: true, message: '', normalized, provider: provider.provider };
    },

    passwordStrength(value) {
        const v = value || '';
        const checks = {
            'Minimal 8 karakter': v.length >= 8,
            'Ada huruf KAPITAL': /[A-Z]/.test(v),
            'Ada huruf kecil': /[a-z]/.test(v),
            'Ada angka': /[0-9]/.test(v)
        };
        const passed = Object.values(checks).filter(Boolean).length;
        const level = passed === 0 ? 0 : (passed <= 2 ? 1 : (passed === 3 ? 2 : 3));
        return { passed, total: 4, level, checks };
    },

    // Mirror logika App.validateInput (client/js/app.js)
    _rulesCheck(rules, value) {
        if (rules.required && !value) return 'Field ini wajib diisi.';
        if (rules.fullName) {
            if (!/^[A-Za-zÀ-ÿ' .,-]+$/.test(value)) return 'Nama hanya boleh berisi huruf, spasi, dan tanda ( \' . - , ).';
            if (value.length < 3) return 'Nama lengkap minimal 3 karakter.';
            return '';
        }
        if (rules.email && !/^[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}$/.test(value)) {
            return 'Format email tidak valid (contoh: nama@email.com).';
        }
        if (rules.phoneId || rules.phone) {
            return this.validateIndonesianPhone(value).message;
        }
        if (rules.strongPassword) {
            if (value.length < 8) return 'Kata sandi minimal 8 karakter.';
            if (!/[A-Z]/.test(value)) return 'Kata sandi wajib mengandung minimal 1 huruf KAPITAL.';
            if (!/[a-z]/.test(value)) return 'Kata sandi wajib mengandung minimal 1 huruf kecil.';
            if (!/[0-9]/.test(value)) return 'Kata sandi wajib mengandung minimal 1 angka.';
            return '';
        }
        if (rules.minLength && value.length < rules.minLength) return `Minimal ${rules.minLength} karakter.`;
        if (rules.maxLength && value.length > rules.maxLength) return `Maksimal ${rules.maxLength} karakter.`;
        return '';
    },

    check(rules, value) {
        return this._rulesCheck(rules, (value || '').trim()) === '';
    }
};

let pass = 0, fail = 0;
function expect(desc, ok) {
    if (ok) { pass++; console.log(`  [OK]   ${desc}`); }
    else { fail++; console.log(`  [GAGAL] ${desc}`); }
}

console.log('== VALIDASI NAMA LENGKAP (tanpa batas maksimum) ==');
expect('nama normal diterima', App.check({ required: true, fullName: true }, 'Rian Hidayat'));
expect("nama dengan tanda kutip & titik diterima", App.check({ required: true, fullName: true }, "Muhammad A. D'Costa"));
expect('nama 2 karakter ditolak', !App.check({ required: true, fullName: true }, 'Ri'));
expect('nama dengan angka ditolak', !App.check({ required: true, fullName: true }, 'Rian 123'));
expect('nama kosong ditolak', !App.check({ required: true, fullName: true }, ''));
const longName = 'Na'.repeat(150); // 300 karakter
expect('nama sangat panjang (300 karakter) TETAP diterima (tanpa maks)', App.check({ required: true, fullName: true }, longName));

console.log('== VALIDASI EMAIL ==');
expect('email normal diterima', App.check({ required: true, email: true }, 'rian@gmail.com'));
expect('email + subdomain diterima', App.check({ required: true, email: true }, 'budi.santoso@mail.co.id'));
expect('email tanpa @ ditolak', !App.check({ required: true, email: true }, 'rian.gmail.com'));
expect('email tanpa TLD ditolak', !App.check({ required: true, email: true }, 'rian@localhost'));
expect('email TLD 1 huruf ditolak', !App.check({ required: true, email: true }, 'rian@gmail.c'));
expect('email dengan spasi ditolak', !App.check({ required: true, email: true }, 'ri an@gmail.com'));
expect('email kosong ditolak', !App.check({ required: true, email: true }, ''));

console.log('== VALIDASI NOMOR TELEPON INDONESIA (PER PROVIDER) ==');
expect('Telkomsel 0812 diterima', App.check({ required: true, phoneId: true }, '081234567890'));
expect('Telkomsel 0852 diterima', App.check({ required: true, phoneId: true }, '085212345678'));
expect('Indosat 0857 diterima', App.check({ required: true, phoneId: true }, '085712345678'));
expect('XL 0819 diterima', App.check({ required: true, phoneId: true }, '081912345678'));
expect('Smartfren 0889 diterima', App.check({ required: true, phoneId: true }, '088912345678'));
expect('Tri 0895 diterima', App.check({ required: true, phoneId: true }, '089512345678'));
expect('By.U 0851 diterima', App.check({ required: true, phoneId: true }, '085112345678'));
expect('format +62812 diterima', App.check({ required: true, phoneId: true }, '+6281234567890'));
expect('format 62812 diterima', App.check({ required: true, phoneId: true }, '6281234567890'));
expect('dengan spasi & strip diterima', App.check({ required: true, phoneId: true }, '0812-3456-7890'));
expect('prefix tak dikenal 0899? (Tri 899) diterima', App.check({ required: true, phoneId: true }, '089912345678'));
expect('prefix asing 0800 ditolak', !App.check({ required: true, phoneId: true }, '08001234567'));
expect('terlalu pendek (0812 + 3 digit) ditolak', !App.check({ required: true, phoneId: true }, '0812345'));
expect('terlalu panjang (>14 digit) ditolak', !App.check({ required: true, phoneId: true }, '08123456789012345'));
expect('berisi huruf ditolak', !App.check({ required: true, phoneId: true }, '0812abcd6789'));
expect('nomor rumah (022) ditolak', !App.check({ required: true, phoneId: true }, '0224231685'));
expect('kosong ditolak', !App.check({ required: true, phoneId: true }, ''));
expect('provider terdeteksi Telkomsel', App.validateIndonesianPhone('081234567890').provider.includes('Telkomsel'));
expect('provider terdeteksi Smartfren', App.validateIndonesianPhone('+6288912345678').provider.includes('Smartfren'));

console.log('== VALIDASI KATA SANDI (tanpa batas maksimum) ==');
expect('Password123! diterima', App.check({ required: true, strongPassword: true }, 'Password123!'));
expect('sandi 6 karakter ditolak', !App.check({ required: true, strongPassword: true }, 'Abc123'));
expect('tanpa huruf kapital ditolak', !App.check({ required: true, strongPassword: true }, 'password123'));
expect('tanpa angka ditolak', !App.check({ required: true, strongPassword: true }, 'Passwordabc'));
expect('tanpa huruf kecil ditolak', !App.check({ required: true, strongPassword: true }, 'PASSWORD123'));
expect('min 8 + semua syarat diterima', App.check({ required: true, strongPassword: true }, 'Abcdefg1'));
const longPass = 'Aa1' + 'x'.repeat(250); // 253 karakter
expect('sandi sangat panjang (253 karakter) TETAP diterima (tanpa maks)', App.check({ required: true, strongPassword: true }, longPass));
expect('meter kekuatan: lemah', App.passwordStrength('abc').level <= 1);
expect('meter kekuatan: kuat', App.passwordStrength('Password123!').level === 3);

console.log('== LOGIN (email + password wajib) ==');
expect('login email valid', App.check({ required: true, email: true }, 'kasir1@ruangrasa.com'));
expect('login password kosong ditolak', !App.check({ required: true, minLength: 6 }, ''));
expect('login password pendek ditolak', !App.check({ required: true, minLength: 6 }, 'abc1'));

console.log(`\nHasil: ${pass} lolos, ${fail} gagal`);
process.exit(fail ? 1 : 0);
