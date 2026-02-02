using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Script.Services;
using System.Web.Services;
using System.Web.UI;
using System.Web.UI.WebControls;
using ERP.DataServices;
using ERP.Repositories;
using ERP.Web.Shared;

namespace ERP.Web.Views.Supplier
{
    public partial class Supplier : BasePage.BasePage
    {
        protected void Page_Load(object sender, EventArgs e)
        {

        }


        [WebMethod]
        public static string CreateUpdateSupplier(Entities.Supplier oneSupplier)
        {
            SupplierServices SupplierServices = new SupplierServices();
            var FkId = oneSupplier.FId;
            int sup_id = 0;
            if (!string.IsNullOrEmpty(FkId))
            {
                try
                {
                    var strcliId = StringCipher.DecoderSimple(FkId.UrlDecode2String(), "supId");
                    sup_id = Convert.ToInt32(strcliId);
                }
                catch (Exception)
                {
                }
            }
            if (sup_id == 0)
            {
                oneSupplier.UsrCreatedBy = CurrentUser.Id;
                oneSupplier.SocId = CurrentUser.Soc_id;
                //oneSupplier.DateCreation = DateTime.Now;
            }
            else
            {
                oneSupplier.Id = sup_id;
            }
            oneSupplier.DateUpdate = DateTime.Now;
            sup_id = SupplierServices.CreateUpdateSupplier(oneSupplier);
            string Suppliercode = StringCipher.EncoderSimple(sup_id.ToString(), "supId");
            return Suppliercode;
        }


        [WebMethod]
        [ScriptMethod(ResponseFormat = ResponseFormat.Json)]
        public static string CreateUpdateContactSupplier(Entities.SupplierContact oneContactSupplier)
        {
            string returnvalue = string.Empty;
            var fcliId = oneContactSupplier.FSupId;
            var fcoId = oneContactSupplier.FScoId;
            int sup_id = IntTryParse(fcliId, "supId");
            int sco_id = IntTryParse(fcoId, "scoId");
            //if (!string.IsNullOrEmpty(fcliId))
            //{
            //    try
            //    {
            //        var strcliId = StringCipher.DecoderSimple(fcliId.UrlDecode2String(), "supId");
            //        sup_id = Convert.ToInt32(strcliId);
            //    }
            //    catch (Exception)
            //    {
            //    }
            //}

            //if (!string.IsNullOrEmpty(fcoId))
            //{
            //    try
            //    {
            //        var strccoId = StringCipher.DecoderSimple(fcoId.UrlDecode2String(), "scoId");
            //        sco_id = Convert.ToInt32(strccoId);
            //    }
            //    catch (Exception)
            //    {
            //    }
            //}
            if (sup_id != 0)
            {
                SupplierContactServices supplierContactServices = new SupplierContactServices();
                if (sco_id == 0)
                {
                    oneContactSupplier.DateCreation = DateTime.Now;
                    oneContactSupplier.UsrCreatedBy = CurrentUser.Id;
                }
                oneContactSupplier.ScoId = sco_id;
                oneContactSupplier.SupId = sup_id;
                oneContactSupplier.SocId = CurrentUser.Soc_id;
                oneContactSupplier.DateUpdate = DateTime.Now;
                var cco = supplierContactServices.CreateUpdateSupplierContact(oneContactSupplier);
                returnvalue = Serialize(cco);
            }
            return returnvalue;
        }
    }
}