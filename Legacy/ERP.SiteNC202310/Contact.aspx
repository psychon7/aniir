<%@ Page Title="" Language="C#" MasterPageFile="~/Site.Master" AutoEventWireup="true"
    CodeBehind="Contact.aspx.cs" Inherits="ERP.SiteNC202310.Contact" %>
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
								<h2>Nous contacter</h2>
							</div>
						</div>
					</div>
				</div>
			</div>
		</section>
</asp:Content>
<asp:Content ID="Content2" ContentPlaceHolderID="MainContent" runat="server">
    <section class="contact-area pt-100 pb-80">
    <div class="container">
        <div class="contact-info pb-85">
            <h3>Notre coordonnée</h3>
            <div class="row">
                <div class="col-lg-4 col-md-4">
                    <div class="single-contact-info text-center mb-30"><i class="las la-map-marked-alt"></i><h4>Notre bureau</h4>
                        <p>14 rue du poteau, 77181, Courtry</p>
                    </div>
                </div>
                <div class="col-lg-4 col-md-4">
                    <div class="single-contact-info extra-contact-info text-center mb-30">
                        <ul>
                            <li>
                                <i class="lni lni-phone"></i>+33 (0)1 87 07 63 61
                            </li>
                            <li>
                                <i class="las la-envelope"></i><a href="mailto:contact@ecoled-europe.com">contact@ecoled-europe.com</a>
                            </li>
                        </ul>
                    </div>
                </div>
                <div class="col-lg-4 col-md-4">
                    <div class="single-contact-info text-center mb-30"><i class="las la-clock"></i><h4>Horaires d’ouverture</h4>
                        <p>Lundi - Vendredi 09:00 - 17:00</p>
                    </div>
                </div>
            </div>
        </div>
        <div class="get-in-touch-wrap">
            <h3>Envoyer vos commenatires</h3>
            <div class="contact-from contact-shadow">
                <div id="div_contact_form">
                    <div class="row">
                        <div class="col-lg-6 col-md-6">
                            <input name="ip_name" id="ip_name" type="text" placeholder="Nom * " required="required"/>
                        </div>
                        <div class="col-lg-6 col-md-6">
                            <input name="ip_email" id="ip_email" type="email" placeholder="E-mail *" required="required"/>
                        </div>
                        <div class="col-lg-6 col-md-6">
                            <input name="ip_tel" id="ip_tel" type="text" placeholder="Téléphone/Mobile *" required="required"/>
                        </div>
                        <div class="col-lg-6 col-md-6">
                            <input name="ip_sub" id="ip_sub" type="text" placeholder="Subjet *" required="required"/>
                        </div>
                        <div class="col-lg-12 col-md-12">
                            <textarea name="txa_message" id="txa_message" placeholder="Commtaire *" required="required"></textarea>
                        </div>
                        <div class="col-lg-12 col-md-12">
                            <button class="submit" type="button" id="btn_submit" onclick="return submitclick()">Envoyer</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    </section>
    <script src="js/Web/Contact.js?<%= WebConfigurationManager.AppSettings["jsVersion"] %>" type="text/javascript"></script>
    <script src="static/js/vendors.js" type="text/javascript"></script>
    <script src="static/js/plugins.js" type="text/javascript"></script>
    <script src="static/js/main.js" type="text/javascript"></script>
</asp:Content>
