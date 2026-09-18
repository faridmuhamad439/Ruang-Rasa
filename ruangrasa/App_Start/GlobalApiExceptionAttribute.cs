using System;
using System.Net;
using System.Net.Http;
using System.Web.Http;
using System.Web.Http.Filters;

namespace ruangrasa.App_Start
{
    /// <summary>
    /// Global Exception Handler untuk seluruh endpoint API.
    /// Ketentuan Backend #7: error 500 Internal Server Error harus dikembalikan
    /// dalam format response JSON yang konsisten (bukan halaman HTML YSOD).
    /// </summary>
    public class GlobalApiExceptionAttribute : ExceptionFilterAttribute
    {
        public override void OnException(HttpActionExecutedContext context)
        {
            // Jangan ganggu respons HttpResponseException yang memang disengaja (mis. 401/404 manual)
            if (context.Exception is HttpResponseException)
            {
                return;
            }

            var body = new
            {
                success = false,
                message = "Terjadi kesalahan internal pada server. Silakan coba beberapa saat lagi.",
                error = context.Exception?.Message,
                timestamp = DateTime.UtcNow
            };

            context.Response = context.Request.CreateResponse(HttpStatusCode.InternalServerError, body);
        }
    }
}
