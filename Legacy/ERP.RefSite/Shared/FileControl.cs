using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.IO;

namespace ERP.RefSite.Shared
{
    public class FileControl
    {
        public  static string CheckAndGetNewPath(string filePath)
        {
            try
            {
                string extension = Path.GetExtension(filePath);
                string fileName = extension != null ? filePath.Replace(extension, "") : filePath;
                if (File.Exists(filePath))
                {
                    filePath = string.Format(@"{0}_{1}{2}", fileName, (Int32)(DateTime.UtcNow.Subtract(new DateTime(1970, 1, 1))).TotalSeconds, extension);
                }

            }
            catch (Exception)
            {
                filePath = null;
            }
            return filePath;
        }
    }
}