using System.Web.Http;
using Swashbuckle.Application;

namespace ERP.Web.App_Start
{
    public static class SwaggerConfig
    {
        public static void Register(HttpConfiguration config)
        {
            config
                .EnableSwagger(c =>
                {
                    c.SingleApiVersion("v1", "ERP2025 REST API")
                        .Description("REST API for ECOLED EUROPE ERP System")
                        .Contact(cc => cc
                            .Name("ECOLED EUROPE")
                            .Email("support@ecoled-europe.com"));

                    // Add JWT Bearer token support in Swagger UI
                    c.ApiKey("Authorization")
                        .Description("JWT Bearer token. Enter: Bearer {your_token}")
                        .Name("Authorization")
                        .In("header");

                    // Include XML comments if available
                    // var baseDirectory = AppDomain.CurrentDomain.BaseDirectory;
                    // var commentsFileName = Assembly.GetExecutingAssembly().GetName().Name + ".xml";
                    // var commentsFile = Path.Combine(baseDirectory, "bin", commentsFileName);
                    // if (File.Exists(commentsFile))
                    // {
                    //     c.IncludeXmlComments(commentsFile);
                    // }
                })
                .EnableSwaggerUi(c =>
                {
                    c.DocumentTitle("ERP2025 API Documentation");
                    c.EnableApiKeySupport("Authorization", "header");
                });
        }
    }
}
