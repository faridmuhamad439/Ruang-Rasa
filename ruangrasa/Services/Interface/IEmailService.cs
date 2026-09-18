using System.Threading.Tasks;

namespace ruangrasa.Services.Interface
{
    public interface IEmailService
    {
        Task<bool> SendOtpEmailAsync(string toEmail, string otpCode, string recipientName);
        Task<bool> SendEmailAsync(string toEmail, string subject, string htmlBody);
    }
}
