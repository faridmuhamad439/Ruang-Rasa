// ==========================================================================
// UJI VALIDATOR SERVER-SIDE (DataAnnotations kustom di LoginRequest.cs)
// Kompilasi & jalankan:
//   cd ruangrasa/Models/ViewModel
//   csc -nologo -out:%TEMP%\rr_test.exe -r:System.ComponentModel.DataAnnotations.dll ^
//       LoginRequest.cs ..\..\..\tools\TestRuangrasaValidation.cs
//   %TEMP%\rr_test.exe
// ==========================================================================

using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using ruangrasa.Models.ViewModel;

public static class TestRuangrasaValidation
{
    private static int _pass;
    private static int _fail;

    private static void Check(string desc, bool ok)
    {
        if (ok) { _pass++; Console.WriteLine("  [OK]    " + desc); }
        else { _fail++; Console.WriteLine("  [GAGAL] " + desc); }
    }

    private static IList<ValidationResult> Validate(object model)
    {
        var results = new List<ValidationResult>();
        var ctx = new ValidationContext(model, null, null);
        Validator.TryValidateObject(model, ctx, results, true);
        return results;
    }

    public static int Main()
    {
        Console.WriteLine("== REGISTER: Nama Lengkap (tanpa batas maksimum) ==");
        Check("nama normal diterima",
            Validate(new RegisterRequest { FullName = "Rian Hidayat", Email = "r@mail.com", PhoneNumber = "081234567890", Password = "Password123!", ConfirmPassword = "Password123!" }).Count == 0);
        Check("nama 2 karakter ditolak",
            Validate(new RegisterRequest { FullName = "Ri", Email = "r@mail.com", PhoneNumber = "081234567890", Password = "Password123!", ConfirmPassword = "Password123!" }).Count > 0);
        Check("nama dengan angka ditolak",
            Validate(new RegisterRequest { FullName = "Rian 123", Email = "r@mail.com", PhoneNumber = "081234567890", Password = "Password123!", ConfirmPassword = "Password123!" }).Count > 0);
        Check("nama sangat panjang (300 karakter) TETAP diterima",
            Validate(new RegisterRequest { FullName = new string('N', 300), Email = "r@mail.com", PhoneNumber = "081234567890", Password = "Password123!", ConfirmPassword = "Password123!" }).Count == 0);

        Console.WriteLine("== REGISTER: Email ==");
        Check("email tanpa @ ditolak",
            Validate(new RegisterRequest { FullName = "Rian Hidayat", Email = "rian.gmail.com", PhoneNumber = "081234567890", Password = "Password123!", ConfirmPassword = "Password123!" }).Count > 0);

        Console.WriteLine("== REGISTER: Telepon Indonesia per provider ==");
        Check("Telkomsel 0812 diterima",
            Validate(new RegisterRequest { FullName = "Rian", Email = "r@mail.com", PhoneNumber = "081234567890", Password = "Password123!", ConfirmPassword = "Password123!" }).Count == 0);
        Check("Smartfren +62889 diterima",
            Validate(new RegisterRequest { FullName = "Rian", Email = "r@mail.com", PhoneNumber = "+6288912345678", Password = "Password123!", ConfirmPassword = "Password123!" }).Count == 0);
        Check("XL 0819 diterima",
            Validate(new RegisterRequest { FullName = "Rian", Email = "r@mail.com", PhoneNumber = "081912345678", Password = "Password123!", ConfirmPassword = "Password123!" }).Count == 0);
        Check("prefix asing 0800 ditolak",
            Validate(new RegisterRequest { FullName = "Rian", Email = "r@mail.com", PhoneNumber = "08001234567", Password = "Password123!", ConfirmPassword = "Password123!" }).Count > 0);
        Check("nomor rumah 0224231685 ditolak",
            Validate(new RegisterRequest { FullName = "Rian", Email = "r@mail.com", PhoneNumber = "0224231685", Password = "Password123!", ConfirmPassword = "Password123!" }).Count > 0);

        Console.WriteLine("== REGISTER: Kata Sandi (tanpa batas maksimum) ==");
        Check("Password123! diterima",
            Validate(new RegisterRequest { FullName = "Rian", Email = "r@mail.com", PhoneNumber = "081234567890", Password = "Password123!", ConfirmPassword = "Password123!" }).Count == 0);
        Check("sandi lemah (abc123) ditolak",
            Validate(new RegisterRequest { FullName = "Rian", Email = "r@mail.com", PhoneNumber = "081234567890", Password = "abc123", ConfirmPassword = "abc123" }).Count > 0);
        Check("sandi sangat panjang (253 karakter) TETAP diterima",
            Validate(new RegisterRequest { FullName = "Rian", Email = "r@mail.com", PhoneNumber = "081234567890", Password = "Aa1" + new string('x', 250), ConfirmPassword = "Aa1" + new string('x', 250) }).Count == 0);
        Check("konfirmasi tidak cocok ditolak",
            Validate(new RegisterRequest { FullName = "Rian", Email = "r@mail.com", PhoneNumber = "081234567890", Password = "Password123!", ConfirmPassword = "Password124!" }).Count > 0);

        Console.WriteLine("== LOGIN: email + password wajib ==");
        Check("login valid diterima",
            Validate(new LoginRequest { Email = "kasir1@ruangrasa.com", Password = "Password123!" }).Count == 0);
        Check("login tanpa password ditolak",
            Validate(new LoginRequest { Email = "kasir1@ruangrasa.com", Password = "" }).Count > 0);
        Check("login email salah format ditolak",
            Validate(new LoginRequest { Email = "bukan-email", Password = "Password123!" }).Count > 0);

        Console.WriteLine("== RESET PASSWORD: kebijakan sandi kuat ==");
        Check("reset dengan sandi lemah ditolak",
            Validate(new ResetPasswordRequest { Token = "RESET-123456", NewPassword = "abc123", ConfirmNewPassword = "abc123" }).Count > 0);
        Check("reset dengan sandi kuat diterima",
            Validate(new ResetPasswordRequest { Token = "RESET-123456", NewPassword = "Password123!", ConfirmNewPassword = "Password123!" }).Count == 0);

        Console.WriteLine("\nHasil: " + _pass + " lolos, " + _fail + " gagal");
        return _fail == 0 ? 0 : 1;
    }
}
