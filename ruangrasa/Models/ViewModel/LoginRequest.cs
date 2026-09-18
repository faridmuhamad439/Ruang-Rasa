using System.ComponentModel.DataAnnotations;
using System.Text.RegularExpressions;

namespace ruangrasa.Models.ViewModel
{
    /// <summary>
    /// Validasi Nama Lengkap: hanya huruf, spasi, dan tanda kutip/titik/koma/strip.
    /// Minimal 3 karakter dan TANPA batas maksimum (sesuai ketentuan projekan).
    /// </summary>
    public class FullNameAttribute : ValidationAttribute
    {
        private static readonly Regex Pattern = new Regex(
            @"^[A-Za-zÀ-ÿ' .,-]+$", RegexOptions.Compiled);

        public override bool IsValid(object value)
        {
            var s = value as string;
            if (string.IsNullOrWhiteSpace(s)) return true; // wajib diisi ditangani [Required]
            if (s.Trim().Length < 3)
            {
                ErrorMessage = "Nama lengkap minimal 3 karakter";
                return false;
            }
            if (!Pattern.IsMatch(s.Trim()))
            {
                ErrorMessage = "Nama hanya boleh berisi huruf, spasi, dan tanda ( ' . - , )";
                return false;
            }
            return true;
        }
    }

    /// <summary>
    /// Validasi Nomor Telepon Indonesia sesuai prefix provider:
    /// Telkomsel, Indosat Ooredoo, XL Axiata, Smartfren, Tri, By.U.
    /// Menerima format 08xx, +628xx, atau 628xx (9-14 digit setelah 08).
    /// </summary>
    public class IndonesianPhoneAttribute : ValidationAttribute
    {
        private static readonly string[][] Providers =
        {
            new[] { "811", "812", "813", "821", "822", "852", "853", "851" }, // Telkomsel & By.U
            new[] { "814", "815", "816", "855", "856", "857", "858" },        // Indosat Ooredoo
            new[] { "817", "818", "819", "859", "877", "878" },               // XL Axiata
            new[] { "881", "882", "883", "884", "885", "886", "887", "888", "889" }, // Smartfren
            new[] { "894", "895", "896", "897", "898", "899" }                // Tri (3)
        };

        public override bool IsValid(object value)
        {
            var s = value as string;
            if (string.IsNullOrWhiteSpace(s)) return true; // wajib diisi ditangani [Required]

            var digits = Regex.Replace(s, @"[\s()\-]", "");
            digits = Regex.IsMatch(digits, @"^\+62|^62") ? "0" + Regex.Replace(digits, @"^\+?62", "") : digits;

            if (!Regex.IsMatch(digits, @"^08\d{7,12}$"))
            {
                ErrorMessage = "Nomor telepon Indonesia harus 9-14 digit setelah 08 (format 08xx atau +628xx)";
                return false;
            }

            var prefix = digits.Substring(1, 3); // 3 digit setelah leading '0' (812, 851, dst.)
            foreach (var provider in Providers)
            {
                foreach (var p in provider)
                {
                    if (p == prefix) return true;
                }
            }

            ErrorMessage = "Prefix " + prefix + " bukan nomor provider Indonesia yang dikenal (Telkomsel, Indosat, XL, Smartfren, Tri, By.U)";
            return false;
        }
    }

    /// <summary>
    /// Validasi Kata Sandi: minimal 8 karakter, wajib huruf besar + huruf kecil + angka,
    /// dan TANPA batas maksimum (sesuai ketentuan projekan).
    /// </summary>
    public class StrongPasswordAttribute : ValidationAttribute
    {
        public override bool IsValid(object value)
        {
            var s = value as string;
            if (string.IsNullOrWhiteSpace(s)) return true; // wajib diisi ditangani [Required]

            if (s.Length < 8)
            {
                ErrorMessage = "Password minimal 8 karakter";
                return false;
            }
            if (!Regex.IsMatch(s, "[A-Z]"))
            {
                ErrorMessage = "Password wajib mengandung minimal 1 huruf KAPITAL";
                return false;
            }
            if (!Regex.IsMatch(s, "[a-z]"))
            {
                ErrorMessage = "Password wajib mengandung minimal 1 huruf kecil";
                return false;
            }
            if (!Regex.IsMatch(s, "[0-9]"))
            {
                ErrorMessage = "Password wajib mengandung minimal 1 angka";
                return false;
            }
            return true;
        }
    }

    public class LoginRequest
    {
        [Required(ErrorMessage = "Email wajib diisi")]
        [EmailAddress(ErrorMessage = "Format email tidak valid")]
        public string Email { get; set; }

        [Required(ErrorMessage = "Password wajib diisi")]
        public string Password { get; set; }
    }

    public class RegisterRequest
    {
        [Required(ErrorMessage = "Nama lengkap wajib diisi")]
        [FullName]
        public string FullName { get; set; }

        [Required(ErrorMessage = "Email wajib diisi")]
        [EmailAddress(ErrorMessage = "Format email tidak valid")]
        public string Email { get; set; }

        [Required(ErrorMessage = "Nomor telepon wajib diisi")]
        [IndonesianPhone]
        public string PhoneNumber { get; set; }

        [Required(ErrorMessage = "Password wajib diisi")]
        [StrongPassword]
        public string Password { get; set; }

        [Compare("Password", ErrorMessage = "Konfirmasi password tidak cocok")]
        public string ConfirmPassword { get; set; }

        // Opsional: jika admin yang membuat akun staf (kasir, dapur, driver)
        public string RoleName { get; set; }

        public RegisterRequest()
        {
            RoleName = "Customer";
        }
    }

    public class ForgotPasswordRequest
    {
        [Required(ErrorMessage = "Email wajib diisi")]
        [EmailAddress(ErrorMessage = "Format email tidak valid")]
        public string Email { get; set; }
    }

    public class ResetPasswordRequest
    {
        [Required(ErrorMessage = "Token reset wajib diisi")]
        public string Token { get; set; }

        [Required(ErrorMessage = "Password baru wajib diisi")]
        [StrongPassword]
        public string NewPassword { get; set; }

        [Compare("NewPassword", ErrorMessage = "Konfirmasi password baru tidak cocok")]
        public string ConfirmNewPassword { get; set; }
    }

    /// <summary>
    /// Body request endpoint POST /auth/refresh untuk memperbarui JWT access token.
    /// </summary>
    public class RefreshTokenRequest
    {
        [Required(ErrorMessage = "Refresh token wajib diisi")]
        public string RefreshToken { get; set; }
    }

    /// <summary>
    /// Body request endpoint POST /auth/logout (refreshToken opsional — bisa juga via header X-Refresh-Token).
    /// </summary>
    public class LogoutRequest
    {
        public string RefreshToken { get; set; }
    }
}
