using System;
using System.Collections.Generic;
using System.Configuration;
using System.IO;
using System.Linq;
using System.Web;

namespace ERP.RefSite.Shared
{
    public enum LogType
    {
        AppError = 1,
        ExportError = 2,
        ImportError = 3,
        MailError = 4
    }

    public static class LogWriter
    {
        static string filePath = ConfigurationManager.AppSettings["FilePath"];
        public static void WriteSeparator()
        {
            try
            {
                if (!File.Exists(filePath))
                {
                    File.Create(filePath);
                }

                using (StreamWriter sw = File.AppendText(filePath))
                {
                    sw.WriteLine("~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~");
                    sw.Close();
                }
            }
            catch { }
        }

        public static void Write(string logs, LogType logType = LogType.AppError)
        {
            try
            {
                GetFilePath(logType);

                if (!File.Exists(filePath))
                {
                    using (File.Create(filePath)) { }
                }

                using (StreamWriter sw = File.AppendText(filePath))
                {
                    sw.WriteLine(string.Format("{0:G}:{1}", DateTime.Now, logs));
                    sw.Close();
                }
            }
            catch { }
        }

        private static string GetFilePath(LogType logType)
        {
            switch (logType)
            {
                case LogType.AppError:
                    filePath = ConfigurationManager.AppSettings["AppErrors"];
                    break;
                case LogType.ExportError:
                    filePath = ConfigurationManager.AppSettings["ExportErrors"];
                    break;
                case LogType.ImportError:
                    filePath = ConfigurationManager.AppSettings["ImportErrors"];
                    break;
                case LogType.MailError:
                    filePath = ConfigurationManager.AppSettings["MailErrors"];
                    break;
                default:
                    filePath = ConfigurationManager.AppSettings["AppErrors"];
                    break;
            }
            return filePath;
        }
    }
}