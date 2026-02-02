using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Web;

namespace ERP.Web.Services
{
    /// <summary>
    /// Summary description for ShowOutSiteImage
    /// </summary>
    public class ShowOutSiteImage : IHttpHandler
    {
        public void ProcessRequest(HttpContext context)
        {
            try
            {
                string parameter = context.Request.QueryString["file"];

                parameter = parameter.IndexOf("\"", StringComparison.Ordinal) > 0 ? parameter.Replace("\"", "'") : parameter;
                parameter = parameter.IndexOf("加号", StringComparison.Ordinal) > 0 ? parameter.Replace("加号", "+") : parameter;

                FileStream fs = new FileStream(parameter, FileMode.Open, FileAccess.Read);
                BinaryReader br = new BinaryReader(fs);
                Byte[] bytes = br.ReadBytes((Int32)fs.Length);
                br.Close();
                fs.Close();
                context.Response.OutputStream.Write(bytes, 0, bytes.Length);

            }
            catch (Exception ex)
            {
            }
        }

        public bool IsReusable
        {
            get
            {
                return false;
            }
        }
    }
}