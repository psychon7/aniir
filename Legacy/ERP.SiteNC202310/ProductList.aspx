<%@ Page Title="" Language="C#" MasterPageFile="~/Site.Master" AutoEventWireup="true"
    CodeBehind="ProductList.aspx.cs" Inherits="ERP.SiteNC202310.ProductList" %>

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
								<h2>PRODUITS</h2>
                                <div class="custom-breadcrumb">
									<ol class="breadcrumb d-inline-block bg-transparent list-inline py-0">
										<li class="list-inline-item breadcrumb-item">
											<span style = "color: #1F1F28;font-size: 16px;font-weight: 400;">PRODUITS</span>
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
    <div class="shop-area shop-container-fluid pt-120 pb-120">
        <div class="container-fluid">
            <div class="row flex-row-reverse">
                <div class="col-lg-9">
                    <%--<div class="shop-top-bar">
							<div class="shop-top-bar-left">
								<div class="shop-page-list">
									<ul>
										<li>Show</li>
										<li class="active">
											<a href="javascript:void(0);" rel="external nofollow"  onclick="RefreshPrd('', 0, 9)">9</a>/
										</li>
										<li>
											<a href="javascript:void(0);" rel="external nofollow" onclick="RefreshPrd('', 0, 12)">12</a>/
										</li>
										<li>
											<a href="javascript:void(0);" rel="external nofollow"  onclick="RefreshPrd('', 0, 18)">18</a>/
										</li>
										<li>
											<a href="javascript:void(0);" rel="external nofollow"  onclick="RefreshPrd('', 0, 24)">24</a>
										</li>
									</ul>
								</div>
							</div>
							
						</div>--%>
                    <div class="tab-content jump-3 pt-30">
                        <div id="shop-2" class="tab-pane active padding-55-row-col">
                            <div class="row" id="div_prd">
                            </div>
                        </div>
                        <div class="pro-pagination-style mt-30 mb-50 text-center">
                            <ul id="ul_page">
                                <li><a href="#"><i class="las la-angle-left"></i></a></li>
                                <li><a href="#">01</a> </li>
                                <li><a class="active" href="#">02</a> </li>
                                <li><a href="#">03</a> </li>
                                <li><a href="#">04</a> </li>
                                <li><a href="#">05</a> </li>
                                <li><a href="#"><i class="las la-angle-right"></i></a></li>
                            </ul>
                        </div>
                    </div>
                </div>
                <div class="col-lg-3">
                    <div class="shop-sidebar-style mt-15 mr-50">
                        <div class="sidebar-widget mb-60">
                            <h4 class="pro-sidebar-title">
                                Categories
                            </h4>
                            <div class="sidebar-widget-categories  mt-50">
                                <ul id="ul_prd">
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    <script src="js/Web/ProductList.js?<%= WebConfigurationManager.AppSettings["jsVersion"] %>" type="text/javascript"></script>
    <script src="static/js/vendors.js" type="text/javascript"></script>
    <script src="static/js/plugins.js" type="text/javascript"></script>
    <script src="static/js/main.js" type="text/javascript"></script>
</asp:Content>
