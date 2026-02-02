<%@ Page Title="" Language="C#" MasterPageFile="~/Site.Master" AutoEventWireup="true"
    CodeBehind="OrderList.aspx.cs" Inherits="ERP.SiteNC202310.OrderList" %>
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
								<h2>Mes commandes</h2>
							</div>
						</div>
					</div>
				</div>
			</div>
		</section>
</asp:Content>
<asp:Content ID="Content2" ContentPlaceHolderID="MainContent" runat="server">
    <section class="blog-area pt-100 pb-100">
			<div class="container">
				<div class="row flex-row-reverse">
					<div class="col-lg-9">
                    <div class="your-order-area" id="div_commande_detail">
                        <h3>Veuillez sélectionnez une commande </h3>
                        <%--<div class="your-order-wrap gray-bg-4">
                            <div class="your-order-info-wrap">
                                <div class="your-order-info"><ul><li>Product <span>Total</span></li></ul>
                                </div>
                                <div class="your-order-middle"><ul><li>Product Name X 1 <span>$329 </span></li><li>Product Name X 1 <span>$329 </span></li></ul>
                                </div>
                                <div class="your-order-info order-subtotal"><ul><li>Subtotal <span>$329 </span></li></ul>
                                </div>
                                <div class="your-order-info order-shipping"><ul><li>Shipping
                                        <p>Enter your full address </p></li></ul>
                                </div>
                                <div class="your-order-info order-total"><ul><li>Total <span>$273.00 </span></li></ul>
                                </div>
                            </div>
                        </div>--%>
                    </div>
					</div>
					<div class="col-lg-3">
						<div class="sidebar-widget mt-60 mb-55">
							<h4 class="pro-sidebar-title2">La liste de commande <span id="span_length_order" style="color:#2a72f8"></span></h4>
							<div class="sidebar-post-wrap mt-30" style="max-height: 600px; overflow: auto;" id="div_order_list">
								<%--<div class="single-sidebar-post">
									<div class="sidebar-post-content">
										<h4>
											<a href="#">Lorem ipsum </a>
										</h4>
										<span>19 Augs,2020 - by John </span>
									</div>
								</div>--%>
							</div>
						</div>
					</div>
				</div>
			</div>
		</section>
    <script src="js/Web/OrderList.js?<%=  WebConfigurationManager.AppSettings["jsVersion"] %>"
        type="text/javascript"></script>
    <script src="static/js/vendors.js" type="text/javascript"></script>
    <script src="static/js/plugins.js" type="text/javascript"></script>
    <script src="static/js/main.js" type="text/javascript"></script>
</asp:Content>
