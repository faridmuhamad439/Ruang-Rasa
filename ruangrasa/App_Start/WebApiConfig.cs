using System;
using System.Collections.Generic;
using System.Linq;
using System.Web.Http;

namespace ruangrasa
{
    public static class WebApiConfig
    {
        public static void Register(HttpConfiguration config)
        {
            // Web API configuration and services

            // Global Error Handling (Ketentuan Backend #7): 500 selalu JSON konsisten
            config.Filters.Add(new GlobalApiExceptionAttribute());

            // Web API routes
            config.MapHttpAttributeRoutes();

            config.Routes.MapHttpRoute(
                name: "DefaultApi",
                routeTemplate: "api/{controller}/{id}",
                defaults: new { id = RouteParameter.Optional }
            );

            // 404 JSON untuk rute API yang tidak dikenal (fallback di akhir tabel rute)
            config.Routes.MapHttpRoute(
                name: "ApiNotFoundFallback",
                routeTemplate: "api/{*path}",
                defaults: new { controller = "FallbackApi", action = "Handle404" }
            );
        }
    }
}
