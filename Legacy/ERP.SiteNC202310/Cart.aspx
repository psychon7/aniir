<%@ Page Title="" Language="C#" MasterPageFile="~/Site.Master" AutoEventWireup="true"
    CodeBehind="Cart.aspx.cs" Inherits="ERP.SiteNC202310.Cart" %>

<%@ Import Namespace="System.Web.Configuration" %>
<asp:Content ID="Content1" ContentPlaceHolderID="HeadContent" runat="server">
    <link rel="stylesheet" href="static/css/vendors.css" />
    <link rel="stylesheet" href="static/css/plugins.css" />
    <link rel="stylesheet" href="static/css/icons.css" />
    <link rel="stylesheet" href="static/css/style.css" />
    <style>
        textarea 
        {
            background: transparent none repeat scroll 0 0;
            border: 1px solid #eaeaea;
            -webkit-box-shadow: none;
            box-shadow: none;
            color: #161c2d;
            padding-top: 5px;
            margin-bottom: 5px;
            padding-left: 5px;
        }
    </style>
    <section class="breadcrumb breadcrumb_bg" style="background-image: url(static/image/breadcrumb-bg.png);">
			<div class="container h-100">
				<div class="row h-100 align-items-center">
					<div class="col-12">
						<div class="breadcrumb_iner">
							<div class="breadcrumb_iner_item text-center">
								<h2>Panier</h2>
							</div>
						</div>
					</div>
				</div>
			</div>
		</section>
</asp:Content>
<asp:Content ID="Content2" ContentPlaceHolderID="MainContent" runat="server">
    <section class="cart-area bg-gray pt-100 pb-100">
			<div class="container">
					<%--<div class="proceed-btn">
						<a href='javascript:void(0);' rel='external nofollow' onclick="CreateOrder()">Créez la commande</a>
					</div>--%>
					<div class="cart-table-content box_shadow">
						<div class="table-content table-responsive"  style="width: 100%">
							<table style="width: 100%">
								<thead>
									<tr>
										<th class="th-text-center" >Produit</th>
										<th class="th-text-center">Commentaire</th>
										<th class="th-text-center">Quantité</th>
										<th class="th-text-center">Remove</th>
									</tr>
								</thead>
								<tbody id="tb_cat">
									
								</tbody>
							</table>
						</div>
						<div class="cart-shiping-update-wrapper" id="div_other_btn">
							<%--<a href='javascript:void(0);' rel='external nofollow' onclick="CreateOrder()">Créez la commande</a>
							<a href='javascript:void(0);' rel='external nofollow' onclick="DeleteAll()">Clear Cart</a>--%>
						</div>
					</div>
			</div>
		</section>
    <script src="js/Web/Cart.js?<%=  WebConfigurationManager.AppSettings["jsVersion"] %>"
        type="text/javascript"></script>
    <script src="static/js/vendors.js" type="text/javascript"></script>
    <script src="static/js/plugins.js" type="text/javascript"></script>
    <script src="static/js/main.js" type="text/javascript"></script>
</asp:Content>
