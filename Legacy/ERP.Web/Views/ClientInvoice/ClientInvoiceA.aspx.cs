using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Threading;
using System.Web;
using System.Web.Script.Services;
using System.Web.Services;
using System.Web.UI;
using System.Web.UI.WebControls;
using ERP.DataServices;
using ERP.Repositories;
using ERP.Web.Shared;

namespace ERP.Web.Views.ClientInvoice
{
    public partial class ClientInvoiceA : BasePage.BasePage
    {
        protected void Page_Load(object sender, EventArgs e)
        {

        }

        [WebMethod]
        public static string CreateUpdateClientInvoice(Entities.ClientInvoice oneCin)
        {
            ClientInvoiceServices ClientInvoiceServices = new ClientInvoiceServices();
            CultureInfo current = Thread.CurrentThread.CurrentUICulture; string returnvalue = string.Empty;
            oneCin.SocId = CurrentUser.Soc_id;
            int cpl_id = 0;
            int cod_id = 0;
            int cli_id = 0;
            int cin_avoir_id = 0;
            int prj_id = 0;
            int cin_id = 0;

            if (!string.IsNullOrEmpty(oneCin.CliFId))
            {
                try
                {
                    var strprdId = StringCipher.DecoderSimple(oneCin.CliFId.UrlDecode2String(), "cliId");
                    cli_id = Convert.ToInt32(strprdId);
                    oneCin.CliId = cli_id;
                }
                catch (Exception)
                {
                }
            }

            if (!string.IsNullOrEmpty(oneCin.PrjFId))
            {
                try
                {
                    var strprdId = StringCipher.DecoderSimple(oneCin.PrjFId.UrlDecode2String(), "prjId");
                    prj_id = Convert.ToInt32(strprdId);
                    oneCin.PrjId = prj_id;
                }
                catch (Exception)
                {
                }
            }
            if (!string.IsNullOrEmpty(oneCin.CinAvFId))
            {
                try
                {
                    var strprdId = StringCipher.DecoderSimple(oneCin.CinAvFId.UrlDecode2String(), "cinId");
                    cin_avoir_id = Convert.ToInt32(strprdId);
                    oneCin.CinAvId = cin_avoir_id;
                }
                catch (Exception)
                {
                }
            }
            if (!string.IsNullOrEmpty(oneCin.CplFId))
            {
                try
                {
                    var strprdId = StringCipher.DecoderSimple(oneCin.CplFId.UrlDecode2String(), "cplId");
                    cpl_id = Convert.ToInt32(strprdId);
                    oneCin.CplId = cpl_id;
                }
                catch (Exception)
                {
                }
            }
            if (!string.IsNullOrEmpty(oneCin.CodFId))
            {
                try
                {
                    var strprdId = StringCipher.DecoderSimple(oneCin.CodFId.UrlDecode2String(), "codId");
                    cod_id = Convert.ToInt32(strprdId);
                    oneCin.CodId = cod_id;
                }
                catch (Exception)
                {
                }
            }
            if (!string.IsNullOrEmpty(oneCin.FId))
            {
                try
                {
                    var strprdId = StringCipher.DecoderSimple(oneCin.FId.UrlDecode2String(), "cinId");
                    cin_id = Convert.ToInt32(strprdId);
                    oneCin.CinId = cin_id;
                }
                catch (Exception)
                {
                }
            }
            //bool checkOK = oneCin.PrjId != 0 && ((!oneCin.CinAccount) || (oneCin.CinAccount && oneCin.CinAvId != 0));
            //bool checkOK = oneCin.PrjId != 0 || (oneCin.CinAccount && (oneCin.CinAvId == 0 || !oneCin.CinAvId.HasValue));
            bool checkOK = (oneCin.CinAccount && oneCin.CinAvId.HasValue);

            if (checkOK)
            {
                //oneCin.CinDCreation = DateTime.Now;
                oneCin.CinDUpdate = oneCin.CinDCreation > DateTime.Now ? oneCin.CinDCreation : DateTime.Now;
                oneCin.CinDInvoice = GetDateTimeOrNow(oneCin._CinDInvoice, true);
                oneCin.CinDTerm = GetDateTimeOrNow(oneCin._CinDTerm, true);
                oneCin.CinDEncaissement = GetDateTimeOrNow(oneCin._CinDEncaissement, true);
                oneCin.UsrCreatorId = CurrentUser.Id;
                var values = ClientInvoiceServices.CreateUpdateClientInvoice(oneCin);
                returnvalue = StringCipher.EncoderSimple(values.ToString(), "cinId");
            }
            return returnvalue;
        }

    }
}