using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Web;
using System.Web.UI;
using System.Web.UI.WebControls;
using ERP.DataServices;
using ERP.Repositories;

namespace ERP.Web.Views.Calendar
{
    public partial class edit : BasePage.BasePage
    {
        CultureInfo culture = new CultureInfo("en-US");
        PurchaseBaseServices PurchaseBaseServices = new PurchaseBaseServices();
        public Entities.Calendar jqmodel;
        public string urls;
        public string sarrd;
        public string sarrt;
        public string earrd;
        public string earrt;
        public string Location;
        public string descriptionas;
        public string Subject;
        public string colors;
        public int IsAllDayEvent;
        public int IsDone;
        public string guest;
        public string SodFId;
        public string SodCode;

        protected void Page_Load(object sender, EventArgs e)
        {
            if (!IsPostBack)
            {
                if (Request["id"] != "" && Request["id"] != "0" && Request["id"] != null)
                {
                    jqmodel = getCalendarByRange(int.Parse(Request["id"]));
                    urls = "&Id=" + jqmodel.CldId + "&usrId=" + jqmodel.UsrId;
                    DateTime? sarr = jqmodel.CldDStart;
                    DateTime? earr = jqmodel.CldDEnd;
                    try
                    {
                        if (jqmodel.CldId == 0)
                        {
                            sarr = Convert.ToDateTime(Request["start"], culture);
                            earr = Convert.ToDateTime(Request["end"], culture);
                        }
                    }
                    catch (Exception)
                    {
                    }

                    sarr = sarr ?? DateTime.Now;
                    sarrd = sarr.Value.Date.ToString("MM/dd/yyyy");
                    sarrt = sarr.Value.Hour + ":" + string.Format("{0:D2}", sarr.Value.Minute);



                    earr = earr ?? DateTime.Now;
                    earrd = earr.Value.Date.ToString("MM/dd/yyyy");
                    earrt = earr.Value.Hour + ":" + string.Format("{0:D2}", earr.Value.Minute);

                    Location = jqmodel.CldLocation;
                    descriptionas = jqmodel.CldDescription;
                    Subject = jqmodel.CldSubject;
                    colors = jqmodel.CldColor;
                    guest = jqmodel.CldGuest;
                    SodFId = jqmodel.Sodid.HasValue ? string.Format("../SupplierOrder/SupplierOrder.aspx?sodId={0}&mode=view", StringCipher.EncoderSimple(jqmodel.Sodid.ToString(), "sodId")) : string.Empty;
                    SodCode = jqmodel.Sodid.HasValue ? PurchaseBaseServices.LoadSupplierOrder(CurrentUser.Soc_id, jqmodel.Sodid.Value).SodCode : string.Empty;
                    IsAllDayEvent = Convert.ToInt32(jqmodel.CldIsAllDayEvent);
                    IsDone = Convert.ToInt32(jqmodel.IsDone);
                }
                else
                {
                    jqmodel = new Entities.Calendar
                    {
                        CldDStart = DateTime.Now,
                        CldDEnd = DateTime.Now.AddMinutes(30)
                    };

                    urls = "&Id=" + jqmodel.CldId + "&usrId=" + Request["usrId"];
                    DateTime? sarr = jqmodel.CldDStart;
                    DateTime? earr = jqmodel.CldDEnd;
                    guest = Request["ccoEmail"];
                    try
                    {
                        sarr = Convert.ToDateTime(Request["start"], culture);
                        earr = Convert.ToDateTime(Request["end"], culture);
                        sarr = sarr < new DateTime(1900) ? null : sarr;
                        earr = earr < new DateTime(1900) ? null : earr;
                    }
                    catch (Exception)
                    {
                    }
                    sarr = sarr ?? DateTime.Now;
                    sarrd = sarr.Value.Date.ToString("MM/dd/yyyy");
                    sarrt = sarr.Value.Hour + ":" + string.Format("{0:D2}", sarr.Value.Minute);



                    earr = earr ?? DateTime.Now.AddMinutes(30);
                    earrd = earr.Value.Date.ToString("MM/dd/yyyy");
                    earrt = earr.Value.Hour + ":" + string.Format("{0:D2}", earr.Value.Minute);
                }
            }
        }


        public Entities.Calendar getCalendarByRange(int id)
        {
            var jq = new Entities.Calendar();
            var bjq = new CalendarServices();
            jq = bjq.GetModel(id);
            return jq;
        }
    }
}