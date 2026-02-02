<%@ Page Title="" Language="C#" MasterPageFile="~/Site.Master" AutoEventWireup="true"
    CodeBehind="Wishlist.aspx.cs" Inherits="ERP.SiteNC202310.Wishlist" %>

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
								<h2>WISHLIST</h2>
							</div>
						</div>
					</div>
				</div>
			</div>
		</section>
</asp:Content>
<asp:Content ID="Content2" ContentPlaceHolderID="MainContent" runat="server">
    <div class="cart-area bg-gray pt-100 pb-100">
        <div class="container">
            <div class="row">
                <div class="col-lg-12 col-md-12 col-sm-12 " style="width: 100%">
                    <div class="cart-table-content wishlist-wrap box_shadow">
                        <div class="table-content table-responsive">
                            <table style="width: 100%">
                                <thead>
                                    <tr>
                                        <th class="th-text-center">
                                            Produit
                                        </th>
                                        <th class="th-text-center">
                                            Temperature de couleur
                                        </th>
                                        <th class="th-text-center">
                                            Puissance
                                        </th>
                                        <th class="th-text-center">
                                            Driver
                                        </th>
                                        <th class="th-text-center">
                                            Acheter
                                        </th>
                                        <th class="th-text-center">
                                            Supprimer
                                        </th>
                                    </tr>
                                </thead>
                                <tbody id="tb_wish">
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    <script src="js/Web/Wishlist.js?<%= WebConfigurationManager.AppSettings["jsVersion"] %>"
        type="text/javascript"></script>
    <script src="static/js/vendors.js" type="text/javascript"></script>
    <script src="static/js/plugins.js" type="text/javascript"></script>
    <script src="static/js/main.js" type="text/javascript"></script>
</asp:Content>
