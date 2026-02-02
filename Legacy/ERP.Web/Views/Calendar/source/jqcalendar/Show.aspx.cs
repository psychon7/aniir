using System;
using System.Data;
using System.Configuration;
using System.Collections;
using System.Web;
using System.Web.Security;
using System.Web.UI;
using System.Web.UI.WebControls;
using System.Web.UI.WebControls.WebParts;
using System.Web.UI.HtmlControls;
using System.Text;
using ERP.DataServices;

namespace ERP.Web.Views.Calendar.source.jqcalendar
{
    public partial class Show : Page
    {
        CalendarServices CalendarServices = new CalendarServices();
        public string strid = "";
        protected void Page_Load(object sender, EventArgs e)
        {
            if (!Page.IsPostBack)
            {
                if (Request.Params["id"] != null && Request.Params["id"].Trim() != "")
                {
                    strid = Request.Params["id"];
                    int Id = (Convert.ToInt32(strid));
                    ShowInfo(Id);
                }
            }
        }

        private void ShowInfo(int Id)
        {
            var model = CalendarServices.GetModel(Id);
            this.lblId.Text = model.CldId.ToString();
            this.lblSubject.Text = model.CldSubject;
            this.lblLocation.Text = model.CldLocation;
            this.lblDescription.Text = model.CldDescription;
            this.lblStartTime.Text = model.CldDStart.ToString();
            this.lblEndTime.Text = model.CldDEnd.ToString();
            this.lblIsAllDayEvent.Text = model.CldIsAllDayEvent.ToString();
            this.lblColor.Text = model.CldColor;
            this.lblRecurringRule.Text = model.CldRecurringRule;
        }
    }
}
