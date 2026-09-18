using System.Net;
using System.Net.Http;
using System.Web.Http;

namespace ruangrasa.Controllers
{
    /// <summary>
    /// Fallback 404 JSON untuk seluruh rute /api/* yang tidak cocok dengan controller manapun.
    /// Menjamin format error konsisten (Ketentuan Backend #7) — bukan HTML error page IIS.
    /// </summary>
    public class FallbackApiController : ApiController
    {
        [HttpGet, HttpPost, HttpPut, HttpPatch, HttpDelete]
        public IHttpActionResult Handle404()
        {
            return ResponseMessage(Request.CreateResponse(HttpStatusCode.NotFound, new
            {
                success = false,
                message = "Endpoint API tidak ditemukan.",
                statusCode = 404
            }));
        }
    }
}
