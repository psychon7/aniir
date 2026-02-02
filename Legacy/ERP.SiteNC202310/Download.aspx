<%@ Page Title="" Language="C#" MasterPageFile="~/Site.Master" AutoEventWireup="true"
    CodeBehind="Download.aspx.cs" Inherits="ERP.SiteNC202310.Download" %>
<%@ Import Namespace="System.Web.Configuration" %>

<asp:Content ID="Content1" ContentPlaceHolderID="HeadContent" runat="server">
    <link rel="stylesheet" href="static/css/vendors.css" />
    <link rel="stylesheet" href="static/css/plugins.css" />
    <link rel="stylesheet" href="static/css/icons.css" />
    <link rel="stylesheet" href="static/css/style.css" />
    <section class="breadcrumb breadcrumb_bg" style="background-image: url(static/picture/download-bar.png);">
			<div class="container h-100">
				<div class="row h-100 align-items-center">
					<div class="col-12">
						<div class="breadcrumb_iner">
							<div class="breadcrumb_iner_item text-right">
								<h2>L'ensemble de nos catalogues à votre disposition</h2>
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
				<div class="row">
					<div class="col-lg-6 col-md-6 col-12 col-sm-6">
						<div class="blog-wrap mb-40">
							<div class="blog-img mb-20">
								<a href="#" id="a_collection_1" target="_blank">
									<img src="static/picture/download-collection.jpg" alt="blog-img">
								</a>
							</div>
							<div class="blog-content">
								<h1>
									<a href="#" id="a_collection_2" target="_blank">Catalogue Collections</a>
								</h1>
								<div class="blog-meta">
									<ul>
										<li>
											<a href="#" id="a_collection_3" target="_blank">Toutes notre gamme Professionnel</a>
										</li>
									</ul>
								</div>
							</div>
						</div>
					</div>
					<div class="col-lg-6 col-md-6 col-12 col-sm-6">
						<div class="blog-wrap mb-40">
							<div class="blog-img mb-20">
								<a href="#" id="a_acc_1" target="_blank">
									<img src="static/picture/download-acc.jpg" alt="blog-img">
								</a>
							</div>
							<div class="blog-content">
								<h1>
									<a href="#" id="a_acc_2" target="_blank">Catalogue Accessoires</a>
								</h1>
								<div class="blog-meta">
									<ul>
										<li>
											<a href="#" id="a_acc_3" target="_blank">Catalogue Accessoires</a>
										</li>
									</ul>
								</div>
							</div>
						</div>
					</div>
					<div class="col-lg-6 col-md-6 col-12 col-sm-6">
						<div class="blog-wrap mb-40">
							<div class="blog-img mb-20">
								<a href="#" id="a_profil_1" target="_blank">
									<img src="static/picture/download-profile.jpg" alt="blog-img">
								</a>
							</div>
							<div class="blog-content">
								<h1>
									<a href="#" id="a_profil_2" target="_blank">Catalogue Profils</a>
								</h1>
								<div class="blog-meta">
									<ul>
										<li>
											<a href="#" id="a_profil_3" target="_blank">Notre gamme de supports et profils</a>
										</li>
									</ul>
								</div>
							</div>
						</div>
					</div>

					<div class="col-lg-6 col-md-6 col-12 col-sm-6">
						<div class="blog-wrap mb-40">
							<div class="blog-img mb-20">
								<a href="#" id="a_deco_1" target="_blank">
									<img src="static/picture/download-deco.jpg" alt="blog-img">
								</a>
							</div>
							<div class="blog-content">
								<h1>
									<a href="#" id="a_deco_2" target="_blank">Catalogue Décorations</a>
								</h1>
								<div class="blog-meta">
									<ul>
										<li>
											<a href="#" id="a_deco_3" target="_blank">Toutes notre gamme de luminaires déco</a>
										</li>
									</ul>
								</div>
							</div>
						</div>
					</div>
                    </div>
                    </div>
		</section>
    <script src="js/Web/Download.js?<%= WebConfigurationManager.AppSettings["jsVersion"] %>" type="text/javascript"></script>
    <script src="static/js/vendors.js" type="text/javascript"></script>
    <script src="static/js/plugins.js" type="text/javascript"></script>
    <script src="static/js/main.js" type="text/javascript"></script>
</asp:Content>
