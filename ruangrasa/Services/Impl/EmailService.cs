using System;
using System.Configuration;
using System.Net;
using System.Net.Mail;
using System.Threading.Tasks;
using ruangrasa.Services.Interface;

namespace ruangrasa.Services.Impl
{
    public class EmailService : IEmailService
    {
        private readonly string _smtpHost;
        private readonly int _smtpPort;
        private readonly string _smtpEmail;
        private readonly string _smtpPassword;
        private readonly string _senderName;

        public EmailService()
        {
            // Konfigurasi dibaca dari Web.config (lihat Web.config.example).
            // Tidak ada kredensial fallback di source code — repo bersifat publik.
            _smtpHost = ConfigurationManager.AppSettings["SmtpHost"] ?? "smtp.gmail.com";
            _smtpPort = int.TryParse(ConfigurationManager.AppSettings["SmtpPort"], out var port) ? port : 587;
            _smtpEmail = ConfigurationManager.AppSettings["SmtpEmail"] ?? "support.ruangrasa@gmail.com";
            _smtpPassword = ConfigurationManager.AppSettings["SmtpPassword"] ?? "";
            _senderName = ConfigurationManager.AppSettings["SmtpSenderName"] ?? "Ruang Rasa Coffee Shop";
        }

        public async Task<bool> SendEmailAsync(string toEmail, string subject, string htmlBody)
        {
            if (string.IsNullOrWhiteSpace(_smtpPassword))
            {
                System.Diagnostics.Debug.WriteLine("[EmailService] SmtpPassword belum diisi di Web.config — email tidak dikirim.");
                return false;
            }

            try
            {
                using (var client = new SmtpClient(_smtpHost, _smtpPort))
                {
                    client.EnableSsl = true;
                    client.UseDefaultCredentials = false;
                    client.Credentials = new NetworkCredential(_smtpEmail, _smtpPassword);
                    client.DeliveryMethod = SmtpDeliveryMethod.Network;
                    client.Timeout = 15000;

                    using (var mail = new MailMessage())
                    {
                        mail.From = new MailAddress(_smtpEmail, _senderName);
                        mail.To.Add(toEmail);
                        mail.Subject = subject;
                        mail.Body = htmlBody;
                        mail.IsBodyHtml = true;

                        await client.SendMailAsync(mail);
                        return true;
                    }
                }
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine($"[EmailService Error] {ex.Message}");
                return false;
            }
        }

        public async Task<bool> SendOtpEmailAsync(string toEmail, string otpCode, string recipientName)
        {
            var cleanName = string.IsNullOrWhiteSpace(recipientName) ? "Pelanggan Ruang Rasa" : recipientName;
            var subject = $"[Ruang Rasa] Kode Verifikasi OTP Reset Password: {otpCode}";

            var htmlBody = $@"
<!DOCTYPE html>
<html>
<head>
    <meta charset='utf-8'>
    <meta name='viewport' content='width=device-width, initial-scale=1.0'>
    <title>Kode OTP Reset Password Ruang Rasa</title>
</head>
<body style='margin: 0; padding: 0; background-color: #faf7f2; font-family: -apple-system, BlinkMacSystemFont, ""Segoe UI"", Roboto, Helvetica, Arial, sans-serif;'>
    <table role='presentation' width='100%' cellspacing='0' cellpadding='0' style='background-color: #faf7f2; padding: 30px 15px;'>
        <tr>
            <td align='center'>
                <table role='presentation' width='100%' style='max-width: 520px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(56,36,24,0.08); border: 1px solid #ede3d4;' cellspacing='0' cellpadding='0'>
                    
                    <!-- Header -->
                    <tr>
                        <td style='background: linear-gradient(135deg, #2b1810 0%, #3e2417 100%); padding: 30px 25px; text-align: center;'>
                            <div style='display: inline-block; width: 44px; height: 44px; background: #b87333; border-radius: 50%; line-height: 44px; color: #ffffff; font-size: 20px; margin-bottom: 10px;'>☕</div>
                            <h1 style='margin: 0; color: #ffffff; font-size: 22px; font-weight: 700; font-family: Georgia, serif; letter-spacing: 0.02em;'>Ruang Rasa Coffee Shop</h1>
                            <p style='margin: 4px 0 0 0; color: #e8ded4; font-size: 12px; letter-spacing: 0.05em; text-transform: uppercase;'>Artisan Roastery &amp; Dine-In</p>
                        </td>
                    </tr>

                    <!-- Body Content -->
                    <tr>
                        <td style='padding: 35px 30px;'>
                            <h2 style='margin: 0 0 12px 0; color: #2b1810; font-size: 18px; font-weight: 700;'>Halo, {cleanName}!</h2>
                            <p style='margin: 0 0 20px 0; color: #6b574a; font-size: 14px; line-height: 1.6;'>
                                Kami menerima permintaan untuk mengatur ulang kata sandi akun Ruang Rasa Anda. Gunakan 6-digit kode OTP berikut untuk melanjutkan:
                            </p>

                            <!-- OTP Box -->
                            <div style='background: #fbf8f4; border: 2px dashed #b87333; border-radius: 12px; padding: 20px; text-align: center; margin: 25px 0;'>
                                <div style='font-size: 11px; font-weight: 700; color: #8c786b; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 6px;'>Kode Verifikasi OTP Anda</div>
                                <div style='font-family: ""Courier New"", Courier, monospace; font-size: 32px; font-weight: 800; color: #2b1810; letter-spacing: 6px;'>{otpCode}</div>
                                <div style='font-size: 12px; color: #b87333; font-weight: 600; margin-top: 8px;'>⏱️ Berlaku selama 15 Menit</div>
                            </div>

                            <p style='margin: 0 0 15px 0; color: #8c786b; font-size: 13px; line-height: 1.5;'>
                                ⚠️ <strong>Penting:</strong> Jangan berikan kode OTP ini kepada siapa pun termasuk pihak staf Ruang Rasa. Jika Anda tidak merasa meminta reset password, silakan abaikan email ini.
                            </p>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style='background-color: #f7f3ed; padding: 20px; text-align: center; border-top: 1px solid #ede3d4;'>
                            <p style='margin: 0; color: #8c786b; font-size: 12px;'>&copy; 2026 Ruang Rasa Coffee Shop &amp; Roastery.<br>Jl. Braga No. 45, Sumur Bandung, Kota Bandung.</p>
                        </td>
                    </tr>

                </table>
            </td>
        </tr>
    </table>
</body>
</html>";

            return await SendEmailAsync(toEmail, subject, htmlBody);
        }
    }
}
