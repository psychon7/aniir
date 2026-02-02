using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Web.Mail;


namespace ERP.SharedServices
{
    public class WebMails
    {

        // No more used

        /// <summary>
        /// Envoyer les Email
        /// </summary>
        /// <param name="subject">Subjet d'email</param>
        /// <param name="from">Expéditeur</param>
        /// <param name="body">Content</param>
        /// <param name="tos">Destinataires</param>
        /// <param name="ccs">Destinataires copie</param>
        /// <returns>True ou False</returns>
        public static bool SendMail(string subject, string from, string body, string tos, string ccs = null, bool isHtml = false, string attachmentPath = null)
        {
            bool sendOK = false;
            try
            {
                tos = tos.RemoveDuplicate();
                MailMessage message = new MailMessage();
                //message.IsBodyHtml = isHtml;
                message.From = from;
                message.To = tos;
                if (ccs != null)
                {
                    ccs = ccs.RemoveDuplicate();
                    message.Cc = ccs;
                }
                message.Subject = subject;
                message.Body = body;
                if (isHtml)
                {
                    message.BodyFormat = MailFormat.Html;
                }
                //if (attachment != null)
                //{
                //    message.Attachments.Add(attachment);
                //}

                if (attachmentPath != null)
                {
                    message.Attachments.Add(new MailAttachment(attachmentPath));
                }

                LogWriter.Write("Mail Subject : " + subject + " mail destination : " + tos + " cc : " + ccs, LogType.MailError);
                SmtpMail.SmtpServer = "localhost";
                SmtpMail.Send(message);
                LogWriter.Write("Mail sent", LogType.MailError);
                sendOK = true;
            }
            catch (Exception ex)
            {
                string msg = ex.InnerException != null ? ex.InnerException.ToString() : "";
                msg += " || " + ex.Message;
                LogWriter.Write(DateTime.Now + " : Send mail failed for the following Error :" + msg, LogType.MailError);

                sendOK = false;
            }
            return sendOK;
        }

    }
}
