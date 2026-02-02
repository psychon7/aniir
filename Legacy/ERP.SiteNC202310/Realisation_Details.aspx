<%@ Page Title="" Language="C#" MasterPageFile="~/Site.Master" AutoEventWireup="true"
    CodeBehind="Realisation_Details.aspx.cs" Inherits="ERP.SiteNC202310.Realisation_Detail" %>

<%@ Import Namespace="System.Web.Configuration" %>
<asp:Content ID="Content1" ContentPlaceHolderID="HeadContent" runat="server">
    <link rel="stylesheet" href="static/css/vendors.css" />
    <link rel="stylesheet" href="static/css/plugins.css" />
    <link rel="stylesheet" href="static/css/icons.css" />
    <link rel="stylesheet" href="static/css/style.css" />
    <section class="breadcrumb breadcrumb_bg" style="background-image: url(static/image/breadcrumb-bg.png);">
			<div class="container h-100">
				<div class="row h-100 align-items-center">
					<div class="col-12">
						<div class="breadcrumb_iner">
							<div class="breadcrumb_iner_item text-center">
								<h2>Realisation Details</h2>
							</div>
						</div>
					</div>
				</div>
			</div>
	</section>
</asp:Content>
<asp:Content ID="Content2" ContentPlaceHolderID="MainContent" runat="server">
    <div >
        <div class="panel-heading" style="text-align:center;">
            <h2 class="panel-heading" id="h2_prjName">
            </h2>
        </div>

        <div class="container">
        <%--<div class="row">
                   
                        
                    
               </div>--%>
               <div id="div_prjdetails">
                        </div>
    </div>
    </div>
    
    <script src="js/Web/Realisation_Details.js?<%= WebConfigurationManager.AppSettings["jsVersion"] %>"
        type="text/javascript"></script>
    <script src="static/js/vendors.js" type="text/javascript"></script>
    <script src="static/js/plugins.js" type="text/javascript"></script>
    <script src="static/js/main.js" type="text/javascript"></script>
</asp:Content>
