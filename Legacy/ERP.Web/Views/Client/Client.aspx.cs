using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Script.Serialization;
using System.Web.Script.Services;
using System.Web.Services;
using System.Web.UI;
using System.Web.UI.WebControls;
using ERP.DataServices;
using ERP.Repositories;
using ERP.Web.Shared;

namespace ERP.Web.Views.Client
{
    public partial class Client : BasePage.BasePage
    {
        protected void Page_Load(object sender, EventArgs e)
        {

        }

        [WebMethod]
        public static string CreateUpdateClient(Entities.Client oneClient)
        {
            ClientServices clientServices = new ClientServices();
            var FkId = oneClient.FId;
            int cli_id = IntTryParse(FkId, "cliId");
            //if (!string.IsNullOrEmpty(FkId))
            //{
            //    try
            //    {
            //        var strcliId = StringCipher.DecoderSimple(FkId.UrlDecode2String(), "cliId");
            //        cli_id = Convert.ToInt32(strcliId);
            //    }
            //    catch (Exception)
            //    {
            //    }
            //}
            if (cli_id == 0)
            {
                oneClient.UsrCreatedBy = CurrentUser.Id;
                oneClient.SocId = CurrentUser.Soc_id;
                //oneClient.DateCreation = DateTime.Now;
            }
            else
            {
                oneClient.Id = cli_id;
            }
            oneClient.DateUpdate = DateTime.Now;
            cli_id = clientServices.CreateUpdateClient(oneClient, true);
            string clientcode = StringCipher.EncoderSimple(cli_id.ToString(), "cliId");
            return clientcode;
        }


        [WebMethod]
        [ScriptMethod(ResponseFormat = ResponseFormat.Json)]
        public static string CreateUpdateContactClient(Entities.ContactClient oneContactClient)
        {
            string returnvalue = string.Empty;
            var fcliId = oneContactClient.FCliId;
            var fcoId = oneContactClient.FCcoId;
            int cli_id = IntTryParse(fcliId, "cliId");
            int cco_id = IntTryParse(fcoId, "ccoId");
            //if (!string.IsNullOrEmpty(fcliId))
            //{
            //    try
            //    {
            //        var strcliId = StringCipher.DecoderSimple(fcliId.UrlDecode2String(), "cliId");
            //        cli_id = Convert.ToInt32(strcliId);
            //    }
            //    catch (Exception)
            //    {
            //    }
            //}

            //if (!string.IsNullOrEmpty(fcoId))
            //{
            //    try
            //    {
            //        var strccoId = StringCipher.DecoderSimple(fcoId.UrlDecode2String(), "ccoId");
            //        cco_id = Convert.ToInt32(strccoId);
            //    }
            //    catch (Exception)
            //    {
            //    }
            //}
            if (cli_id != 0)
            {
                ContactClientServices contactClientServices = new ContactClientServices();
                if (cco_id == 0)
                {
                    oneContactClient.DateCreation = DateTime.Now;
                    oneContactClient.UsrCreatedBy = CurrentUser.Id;
                }
                oneContactClient.CcoId = cco_id;
                oneContactClient.CliId = cli_id;
                oneContactClient.SocId = CurrentUser.Soc_id;
                oneContactClient.DateUpdate = DateTime.Now;
                var cco = contactClientServices.CreateUpdateContactClient(oneContactClient);
                returnvalue = Serialize(cco);
            }
            return returnvalue;
        }
    }
}