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
    public partial class Add : Page
    {
        CalendarServices CalendarServices = new CalendarServices();
        protected void Page_Load(object sender, EventArgs e)
        {

        }

        protected void btnSave_Click(object sender, EventArgs e)
        {

            string strErr = "";
            if (this.txtSubject.Text.Trim().Length == 0)
            {
                strErr += "Subject不能为空！\\n";
            }
            if (this.txtLocation.Text.Trim().Length == 0)
            {
                strErr += "Location不能为空！\\n";
            }
            if (this.txtDescription.Text.Trim().Length == 0)
            {
                strErr += "Description不能为空！\\n";
            }
            if (!PageValidate.IsDateTime(txtStartTime.Text))
            {
                strErr += "StartTime格式错误！\\n";
            }
            if (!PageValidate.IsDateTime(txtEndTime.Text))
            {
                strErr += "EndTime格式错误！\\n";
            }
            if (!PageValidate.IsNumber(txtIsAllDayEvent.Text))
            {
                strErr += "IsAllDayEvent格式错误！\\n";
            }
            if (this.txtColor.Text.Trim().Length == 0)
            {
                strErr += "Color不能为空！\\n";
            }
            if (this.txtRecurringRule.Text.Trim().Length == 0)
            {
                strErr += "RecurringRule不能为空！\\n";
            }

            if (strErr != "")
            {
                MessageBox.Show(this, strErr);
                return;
            }
            string Subject = this.txtSubject.Text;
            string Location = this.txtLocation.Text;
            string Description = this.txtDescription.Text;
            DateTime StartTime = DateTime.Parse(this.txtStartTime.Text);
            DateTime EndTime = DateTime.Parse(this.txtEndTime.Text);
            int IsAllDayEvent = int.Parse(this.txtIsAllDayEvent.Text);
            string Color = this.txtColor.Text;
            string RecurringRule = this.txtRecurringRule.Text;

            var model = new Entities.Calendar();
            model.CldSubject = Subject;
            model.CldLocation = Location;
            model.CldDescription = Description;
            model.CldDStart = StartTime;
            model.CldDEnd = EndTime;
            model.CldIsAllDayEvent = IsAllDayEvent == 1;
            model.CldColor = Color;
            model.CldRecurringRule = RecurringRule;

            CalendarServices.Add(model);
            MessageBox.ShowAndRedirect(this, "Saved", "add.aspx");

        }


        public void btnCancle_Click(object sender, EventArgs e)
        {
            Response.Redirect("list.aspx");
        }
    }
}
