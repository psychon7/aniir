using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Mail;
using System.Text;
using System.Configuration;

namespace ERP.SharedServices
{
    public static class NetMails
    {
        /// <summary>
        /// Envoyer les Email NO MORE USE
        /// </summary>
        /// <param name="subject">Subjet d'email</param>
        /// <param name="from">Expéditeur</param>
        /// <param name="body">Content</param>
        /// <param name="tos">Destinataires</param>
        /// <param name="ccs">Destinataires copie</param>
        /// <returns>True ou False</returns>
        public static bool SendMail(string subject, string from, string body, string tos, string pwd, string ccs = null, bool isHtml = false, string attachmentPath = null)
        {
            bool sendOK = false;
            try
            {
                var fromName = ConfigurationManager.AppSettings["CompanyName"];
                tos = tos.RemoveDuplicate();
                MailMessage message = new MailMessage();
                message.Body = body;
                message.Subject = subject;
                message.From = new MailAddress(from, fromName);
                var toTreated = tos.RemoveDuplicate().Split(';').ToList();
                foreach (var item in toTreated)
                {
                    message.To.Add(new MailAddress(item));
                }

                if (ccs != null)
                {
                    ccs = ccs.RemoveDuplicate();
                    message.CC.Add(ccs);
                }
                message.Subject = subject;
                message.Body = body;
                if (isHtml)
                {
                    message.IsBodyHtml = true;
                }
                if (attachmentPath != null)
                {
                    message.Attachments.Add(new Attachment(attachmentPath));
                }

                LogWriter.Write("Mail Subject : " + subject + " mail destination : " + tos + " cc : " + ccs, LogType.MailError);

                var smtp = new SmtpClient
                {
                    Host = "smtp.gmail.com",
                    Port = 587,
                    EnableSsl = true,
                    DeliveryMethod = SmtpDeliveryMethod.Network,
                    UseDefaultCredentials = false,
                    Credentials = new NetworkCredential(from, pwd),
                };
                smtp.Send(message);
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

        /// <summary>
        /// Envoyer les Email
        /// </summary>
        /// <param name="subject">Subjet d'email</param>
        /// <param name="from">Expéditeur</param>
        /// <param name="body">Content</param>
        /// <param name="tos">Destinataires</param>
        /// <param name="ccs">Destinataires copie</param>
        /// <returns>True ou False</returns>
        public static bool SendMail(string subject, string from, string body, string tos,
            string pwd, string ccs = null, bool isHtml = false,
            string attachmentPath = null, string fromName = null,
            string hostname = null, int port = 0)
        {
            bool sendOK = false;
            try
            {
                tos = tos.RemoveDuplicate();
                MailMessage message = new MailMessage();
                message.Body = body;
                message.Subject = subject;
                message.From = new MailAddress(from, !string.IsNullOrEmpty(fromName) ? fromName : "");
                var toTreated = tos.RemoveDuplicate().Split(';').ToList();
                foreach (var item in toTreated)
                {
                    message.To.Add(new MailAddress(item));
                }

                if (ccs != null)
                {
                    ccs = ccs.RemoveDuplicate();
                    message.CC.Add(ccs);
                }
                message.Subject = subject;
                message.Body = body;
                if (isHtml)
                {
                    message.IsBodyHtml = true;
                }
                if (attachmentPath != null)
                {
                    message.Attachments.Add(new Attachment(attachmentPath));
                }

                LogWriter.Write("Mail Subject : " + subject + " mail destination : " + tos + " cc : " + ccs, LogType.MailError);
                string host = !string.IsNullOrEmpty(hostname) ? hostname : "smtp.gmail.com";
                ServicePointManager.SecurityProtocol = (SecurityProtocolType)3072;
                var smtp = new SmtpClient
                {
                    Host = host,
                    Port = port != 0 ? port : 587,
                    EnableSsl = true,
                    DeliveryMethod = SmtpDeliveryMethod.Network,
                    UseDefaultCredentials = false,
                    Credentials = new NetworkCredential(from, pwd),
                };
                 
                smtp.Send(message);
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


        /// <summary>
        /// Envoyer les Email NO MORE USE
        /// </summary>
        /// <param name="subject">Subjet d'email</param>
        /// <param name="from">Expéditeur</param>
        /// <param name="body">Content</param>
        /// <param name="tos">Destinataires</param>
        /// <param name="ccs">Destinataires copie</param>
        /// <returns>True ou False</returns>
        public static bool SendMailWithAttachements(string subject, string from, string body, string tos, string pwd, string ccs = null, bool isHtml = false, List<string> attachements = null)
        {
            bool sendOK = false;
            try
            {
                tos = tos.RemoveDuplicate();
                MailMessage message = new MailMessage();
                message.Body = body;
                message.Subject = subject;
                var fromName = ConfigurationManager.AppSettings["CompanyName"];
                message.From = new MailAddress(from, fromName);
                var toTreated = tos.RemoveDuplicate().Split(';').ToList();
                foreach (var item in toTreated)
                {
                    message.To.Add(new MailAddress(item));
                }

                if (ccs != null)
                {
                    ccs = ccs.RemoveDuplicate();
                    message.CC.Add(ccs);
                }
                message.Subject = subject;
                message.Body = body;
                if (isHtml)
                {
                    message.IsBodyHtml = true;
                }
                if (attachements != null && attachements.Any())
                {
                    foreach (var attachmentPath in attachements)
                    {
                        if (attachmentPath != null)
                        {
                            message.Attachments.Add(new Attachment(attachmentPath));
                        }
                    }
                }

                LogWriter.Write("Mail Subject : " + subject + " mail destination : " + tos + " cc : " + ccs, LogType.MailError);

                var smtp = new SmtpClient
                {
                    Host = "smtp.gmail.com",
                    Port = 587,
                    EnableSsl = true,
                    DeliveryMethod = SmtpDeliveryMethod.Network,
                    UseDefaultCredentials = false,
                    Credentials = new NetworkCredential(from, pwd),
                };
                smtp.Send(message);
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

        public static bool SendMailWithAttachement(string subject, string from, string body,
            string tos, string pwd, string ccs = null, bool isHtml = false,
            System.Net.Mail.Attachment attachements = null,
            string smtpHost = null, int port = 0)
        {
            bool sendOK = false;
            try
            {
                tos = tos.RemoveDuplicate();
                MailMessage message = new MailMessage();
                message.Body = body;
                message.Subject = subject;
                var fromName = ConfigurationManager.AppSettings["CompanyName"];
                message.From = new MailAddress(from, fromName);
                var toTreated = tos.RemoveDuplicate().Split(';').ToList();
                foreach (var item in toTreated)
                {
                    message.To.Add(new MailAddress(item));
                }

                if (ccs != null)
                {
                    ccs = ccs.RemoveDuplicate();
                    var toTreatedCC = ccs.RemoveDuplicate().Split(';').ToList();
                    foreach (var item in toTreatedCC)
                    {
                        message.CC.Add(new MailAddress(item));
                    }
                    //message.CC.Add(ccs);
                }
                message.Subject = subject;
                message.Body = body;
                if (isHtml)
                {
                    message.IsBodyHtml = true;
                }
                if (attachements != null)
                {
                    message.Attachments.Add(attachements);
                }

                LogWriter.Write("Mail Subject : " + subject + " mail destination : " + tos + " cc : " + ccs, LogType.MailError);

                var smtp = new SmtpClient
                {
                    Host = string.IsNullOrEmpty(smtpHost) ? "smtp.gmail.com" : smtpHost,
                    Port = port != 0 ? port : 587,
                    EnableSsl = true,
                    DeliveryMethod = SmtpDeliveryMethod.Network,
                    UseDefaultCredentials = false,
                    Credentials = new NetworkCredential(from, pwd),
                };
                smtp.Send(message);
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


        public static void SendAppointment(string from, string to, string subject, string body, DateTime startTime, DateTime endTime, string address)
        {
            from = "calendar.service@outlook.com";
            MailMessage msg = new MailMessage();
            //Now we have to set the value to Mail message properties

            //Note Please change it to correct mail-id to use this in your application
            var fromName = ConfigurationManager.AppSettings["CompanyName"];
            msg.From = new MailAddress(from, fromName);
            msg.To.Add(new MailAddress(to, "VIP"));
            msg.Headers.Add("Content-class", "urn:content-classes:calendarmessage");
            msg.Subject = subject;
            msg.Body = body;

            // Now Contruct the ICS file using string builder
            StringBuilder str = new StringBuilder();
            str.AppendLine("BEGIN:VCALENDAR");
            str.AppendLine("PRODID:-//Schedule a Meeting");
            str.AppendLine("VERSION:2.0");
            str.AppendLine("METHOD:REQUEST");
            str.AppendLine("BEGIN:VEVENT");
            str.AppendLine(string.Format("DTSTART:{0:yyyyMMddTHHmmssZ}", startTime.AddHours(-1)));
            str.AppendLine(string.Format("DTSTAMP:{0:yyyyMMddTHHmmssZ}", DateTime.UtcNow));
            str.AppendLine(string.Format("DTEND:{0:yyyyMMddTHHmmssZ}", endTime.AddHours(-1)));
            str.AppendLine("LOCATION: " + address);
            str.AppendLine(string.Format("UID:{0}", Guid.NewGuid()));
            str.AppendLine(string.Format("DESCRIPTION:{0}", msg.Body));
            str.AppendLine(string.Format("X-ALT-DESC;FMTTYPE=text/html:{0}", msg.Body));
            str.AppendLine(string.Format("SUMMARY:{0}", msg.Subject));
            str.AppendLine(string.Format("ORGANIZER:MAILTO:{0}", msg.From.Address));

            str.AppendLine(string.Format("ATTENDEE;CN=\"{0}\";RSVP=TRUE:mailto:{1}", msg.To[0].DisplayName, msg.To[0].Address));

            str.AppendLine("BEGIN:VALARM");
            str.AppendLine("TRIGGER:-PT15M");
            str.AppendLine("ACTION:DISPLAY");
            str.AppendLine("DESCRIPTION:Reminder");
            str.AppendLine("END:VALARM");
            str.AppendLine("END:VEVENT");
            str.AppendLine("END:VCALENDAR");

            System.Net.Mime.ContentType contype = new System.Net.Mime.ContentType("text/calendar");
            contype.Parameters.Add("method", "REQUEST");
            contype.Parameters.Add("name", "Meeting.ics");
            AlternateView avCal = AlternateView.CreateAlternateViewFromString(str.ToString(), contype);
            msg.AlternateViews.Add(avCal);

            var smtp = new SmtpClient
            {
                Host = "smtp.live.com",
                Port = 587,
                EnableSsl = true,
                DeliveryMethod = SmtpDeliveryMethod.Network,
                UseDefaultCredentials = false,
                Credentials = new NetworkCredential(from, "19851211lcl"),
            };
            smtp.Send(msg);
        }

        public static string RemoveDuplicate(this String emails)
        {
            string[] mails = emails.Split(new string[] { ";" }, StringSplitOptions.RemoveEmptyEntries);
            var result = mails.Distinct();
            return string.Join(";", result);
        }
    }
}
