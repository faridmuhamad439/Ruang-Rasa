using System;
using System.IO;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Threading.Tasks;
using System.Web;
using System.Web.Http;
using ruangrasa.Models.ViewModel;

namespace ruangrasa.Controllers
{
    [RoutePrefix("api/ruangrasa/upload")]
    public class UploadController : ApiController
    {
        // Ekstensi yang diizinkan sesuai Ketentuan Projekan S1: Gambar (JPG/PNG/WEBP) atau PDF
        private static readonly string[] AllowedImageExtensions = { ".jpg", ".jpeg", ".png", ".webp", ".gif" };
        private static readonly string[] AllowedDocExtensions = { ".pdf" };
        private const int MaxFileSize = 10 * 1024 * 1024; // 10 MB

        // POST: api/ruangrasa/upload
        [HttpPost]
        [Route("")]
        public async Task<IHttpActionResult> UploadFile()
        {
            try
            {
                var httpRequest = HttpContext.Current?.Request;
                if (httpRequest == null || httpRequest.Files.Count == 0)
                {
                    // Alternatif: cek jika multipart/form-data via Request.Content
                    if (!Request.Content.IsMimeMultipartContent())
                    {
                        return BadRequest("Tidak ada berkas yang diunggah atau format request bukan multipart/form-data.");
                    }

                    var root = HttpContext.Current.Server.MapPath("~/Uploads");
                    if (!Directory.Exists(root))
                    {
                        Directory.CreateDirectory(root);
                    }

                    var provider = new MultipartFormDataStreamProvider(root);
                    await Request.Content.ReadAsMultipartAsync(provider);

                    if (provider.FileData.Count == 0)
                    {
                        return BadRequest("Tidak ada berkas ditemukan dalam form-data.");
                    }

                    var fileData = provider.FileData.First();
                    var rawOriginalName = fileData.Headers.ContentDisposition.FileName?.Trim('\"') ?? "uploaded_file";
                    var ext = Path.GetExtension(rawOriginalName).ToLowerInvariant();

                    var isImage = AllowedImageExtensions.Contains(ext);
                    var isDoc = AllowedDocExtensions.Contains(ext);

                    if (!isImage && !isDoc)
                    {
                        File.Delete(fileData.LocalFileName);
                        return BadRequest($"Tipe berkas '{ext}' tidak diizinkan. Berkas yang didukung: Gambar (JPG, PNG, WEBP) atau Dokumen (PDF).");
                    }

                    var uniqueName = $"{Guid.NewGuid():N}{ext}";
                    var targetPath = Path.Combine(root, uniqueName);
                    File.Move(fileData.LocalFileName, targetPath);

                    var fileInfo = new FileInfo(targetPath);
                    var fileUrl = $"/Uploads/{uniqueName}";

                    return Ok(new
                    {
                        success = true,
                        message = "Berkas berhasil diunggah.",
                        data = new
                        {
                            fileName = uniqueName,
                            originalName = rawOriginalName,
                            fileUrl = fileUrl,
                            fileType = isImage ? "image" : "pdf",
                            fileSize = fileInfo.Length,
                            uploadedAt = DateTime.UtcNow
                        }
                    });
                }

                // Standard HttpPostedFile via HttpContext.Current.Request.Files
                var postedFile = httpRequest.Files[0];
                if (postedFile == null || postedFile.ContentLength == 0)
                {
                    return BadRequest("Berkas kosong.");
                }

                if (postedFile.ContentLength > MaxFileSize)
                {
                    return BadRequest("Ukuran berkas melebihi batas maksimal 10 MB.");
                }

                var originalName = Path.GetFileName(postedFile.FileName);
                var extension = Path.GetExtension(originalName).ToLowerInvariant();

                var isAllowedImage = AllowedImageExtensions.Contains(extension);
                var isAllowedDoc = AllowedDocExtensions.Contains(extension);

                if (!isAllowedImage && !isAllowedDoc)
                {
                    return BadRequest($"Tipe berkas '{extension}' tidak diizinkan. Berkas yang didukung: Gambar (JPG, PNG, WEBP) atau Dokumen (PDF).");
                }

                var uploadDir = HttpContext.Current.Server.MapPath("~/Uploads");
                if (!Directory.Exists(uploadDir))
                {
                    Directory.CreateDirectory(uploadDir);
                }

                var newFileName = $"{Guid.NewGuid():N}{extension}";
                var savePath = Path.Combine(uploadDir, newFileName);
                postedFile.SaveAs(savePath);

                var relativeUrl = $"/Uploads/{newFileName}";

                return Ok(new
                {
                    success = true,
                    message = "Berkas berhasil diunggah.",
                    data = new
                    {
                        fileName = newFileName,
                        originalName = originalName,
                        fileUrl = relativeUrl,
                        fileType = isAllowedImage ? "image" : "pdf",
                        fileSize = postedFile.ContentLength,
                        uploadedAt = DateTime.UtcNow
                    }
                });
            }
            catch (Exception ex)
            {
                return InternalServerError(new Exception($"Gagal mengunggah berkas: {ex.Message}"));
            }
        }

        // POST: api/ruangrasa/upload/base64
        [HttpPost]
        [Route("base64")]
        public IHttpActionResult UploadBase64([FromBody] Base64UploadRequest request)
        {
            if (request == null || string.IsNullOrWhiteSpace(request.Base64Data))
            {
                return BadRequest("Data Base64 tidak boleh kosong.");
            }

            try
            {
                var base64Data = request.Base64Data;
                string extension = ".png";
                if (base64Data.Contains(","))
                {
                    var parts = base64Data.Split(',');
                    var header = parts[0];
                    base64Data = parts[1];

                    if (header.Contains("image/jpeg") || header.Contains("image/jpg")) extension = ".jpg";
                    else if (header.Contains("image/webp")) extension = ".webp";
                    else if (header.Contains("application/pdf")) extension = ".pdf";
                }

                var bytes = Convert.FromBase64String(base64Data);
                if (bytes.Length > MaxFileSize)
                {
                    return BadRequest("Ukuran berkas melebihi batas 10 MB.");
                }

                var uploadDir = HttpContext.Current.Server.MapPath("~/Uploads");
                if (!Directory.Exists(uploadDir))
                {
                    Directory.CreateDirectory(uploadDir);
                }

                var newFileName = $"{Guid.NewGuid():N}{extension}";
                var savePath = Path.Combine(uploadDir, newFileName);
                File.WriteAllBytes(savePath, bytes);

                var relativeUrl = $"/Uploads/{newFileName}";

                return Ok(new
                {
                    success = true,
                    message = "Berkas base64 berhasil disimpan.",
                    data = new
                    {
                        fileName = newFileName,
                        fileUrl = relativeUrl,
                        fileType = extension == ".pdf" ? "pdf" : "image",
                        fileSize = bytes.Length,
                        uploadedAt = DateTime.UtcNow
                    }
                });
            }
            catch (Exception ex)
            {
                return BadRequest($"Gagal memproses base64: {ex.Message}");
            }
        }
    }

    public class Base64UploadRequest
    {
        public string Base64Data { get; set; }
        public string FileName { get; set; }
    }
}
