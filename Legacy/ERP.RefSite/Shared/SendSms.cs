using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using ERP.RefSite.MyClientService;
using ERP.SharedServices;

namespace ERP.RefSite.Shared
{
    public static class SendSms
    {
        public static void SendMessage(SMS_Message message)
        {
            try
            {
                LogWriter.Write("SMS Subject : " + message.sms_subject + " sms destination : " + message.sms_telnumber, LogType.MailError);
                MyClientWebServicesSoap servicesSoap = new MyClientWebServicesSoapClient();
                AddMessageRequestBody body = new AddMessageRequestBody(message);
                AddMessageRequest request = new AddMessageRequest(body);
                servicesSoap.AddMessage(request);
            }
            catch (Exception ex)
            {
            }
        }
    }
}