<%@ Page Title="" Language="C#" MasterPageFile="~/Site.Master" AutoEventWireup="true"
    CodeBehind="Realisation.aspx.cs" Inherits="ERP.SiteNC202310.Realisation" %>

<%@ Import Namespace="System.Web.Configuration" %>
<asp:Content ID="Content1" ContentPlaceHolderID="HeadContent" runat="server">
    <%--<link rel="stylesheet" href="layui/css/layui.css" />--%>
    <link rel="stylesheet" href="static/css/vendors.css" />
    <link rel="stylesheet" href="static/css/plugins.css" />
    <link rel="stylesheet" href="static/css/icons.css" />
    <link rel="stylesheet" href="static/css/style.css" />
    <%--<link rel="stylesheet" href="css/amazeui.css" />
    <link rel="stylesheet" href="css/common.min.css" />
    <link rel="stylesheet" href="css/index.min.css" />--%>
    <section class="breadcrumb breadcrumb_bg" style="background-image: url(static/image/breadcrumb-bg.png);">
			<div class="container h-100">
				<div class="row h-100 align-items-center">
					<div class="col-12">
						<div class="breadcrumb_iner">
							<div class="breadcrumb_iner_item text-center">
								<h2>Realisation</h2>
                                <div class="custom-breadcrumb">
									<ol class="breadcrumb d-inline-block bg-transparent list-inline py-0">
										<li class="list-inline-item breadcrumb-item">
											<span style = "color: #1F1F28;font-size: 16px;font-weight: 400;">Realisation</span>
										</li>
										<li class="list-inline-item breadcrumb-item active" id="top_name"></li>
									</ol>
								</div>
							</div>
                            
						</div>
					</div>
				</div>
			</div>
		</section>
</asp:Content>
<asp:Content ID="Content2" ContentPlaceHolderID="MainContent" runat="server">
    <div class="tab-content jump-3 pt-30">
    <div class="container">
        <div class="row" id="div_prj">
        </div>
    </div>
    <div class="pro-pagination-style mt-30 mb-50 text-center">
        <ul id="ul_page">
                    <li><a id="prevBtn" href="#"><i class="las la-angle-left"></i></a></li>
        <!-- Pagination links will be dynamically generated here -->
        <!-- Example: <li><a class="active" href="#">01</a></li> -->
        <li><a id="nextBtn" href="#"><i class="las la-angle-right"></i></a></li>    
        </ul>
    </div>
    </div>
    <script src="js/Web/Realisation.js?<%= WebConfigurationManager.AppSettings["jsVersion"] %>"
        type="text/javascript"></script>
    <script src="static/js/vendors.js" type="text/javascript"></script>
    <script src="static/js/plugins.js" type="text/javascript"></script>
    <script src="static/js/main.js" type="text/javascript"></script>
</asp:Content>
