<%@ Page Title="" Language="C#" MasterPageFile="~/Site.Master" AutoEventWireup="true"
    CodeBehind="AboutUs.aspx.cs" Inherits="ERP.SiteNC202310.AboutUs" %>

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
								<h2>À propos de nous</h2>
							</div>
						</div>
					</div>
				</div>
			</div>
		</section>
</asp:Content>
<asp:Content ID="Content2" ContentPlaceHolderID="MainContent" runat="server">
    <div class="about-us-area pt-100 pb-100">
        <div class="container">
            <div class="row">
                <div class="col-lg-6 col-md-6">
                    <div class="about-us-img text-center">
                        <a href="#">
                            <img src="static/picture/about-light-01.jpg" alt="">
                        </a>
                    </div>
                </div>
                <div class="col-lg-6 col-md-6 align-self-center">
                    <div class="about-us-content">
                        <h2>
                            <span>ECOLED EUROPE</span></h2>
                        <p class="peragraph-blog">
                            designe, conçoit et développe des produits led pour les professionnels de l’éclairage</p>
                        <p>
                            Forte de son équipe R&D, nous élaborons des gammes de produits selon les dernières
                            innovations technologiques. Grâce à notre large gamme décliné en 4 catégories, nous
                            sommes en mesure de répondre à tous types de besoins :
                        </p>
                        <p>
                            - LUMILED Consommables type ampoule et tube led<br />
                            - EXALED Eclairages Architecturaux, décoratifs et sur mesures<br />
                            - EVOLED Eclairages industriels<br />
                            - SUNLED Eclairages extérieurs, décoratifs et éclairage public<br />
                            Le nouveau catalogue est le fruit de 5 ans de collaborations sur de nombreux projets
                            avec nos clients et partenaires.
                        </p>
                        <p class="peragraph-blog">
                            Notre force est surtout basée sur notre capacité à répondre aux besoins parfois
                            très spécifiques de nos clients.
                        </p>
                        <%--<div>
                            <a class="btn theme-btn-2 mt-20" href="Produits.aspx?catid=0">Shop now!</a>
                        </div>--%>
                    </div>
                </div>
            </div>
        </div>
    </div>
    <div class="team-area pt-60 pb-60">
        <div class="container">
            <div class="row justify-content-center">
                <div class="col-lg-8">
                    <div class="section_title mb-50">
                        <h2>
                            Culture d'entreprise</h2>
                    </div>
                </div>
            </div>
            <div class="row">
                <div class="col-lg-12 col-md-12 align-self-center">
                    <div class="about-us-content">
                        <p class="peragraph-blog">
                            Notre culture nous définit… c'est notre ADN. Nous l'appelons la EcoLed Way. Ce sont
                            les valeurs que nous partageons et les pratiques professionnelles que nous mettons
                            en œuvre. C'est la façon dont nous assumons nos engagements chaque jour. EcoLed
                            Way se concrétise ainsi : Nous faisons ce que nous disons et nous assumons ce que
                            nous faisons.
                        </p>
                    </div>
                </div>
            </div>
            <div class="row mt-5 pt-2">
                <div class="img-des">
                    <div class="row align-items-center">
                        <div class="col-lg-6 col-md-6 col-sm-12">
                            <div class="text-content mb-70">
                                <div class="sub-title">
                                    <h4>
                                        Concepteur</h4>
                                    <p>
                                        Notre équipe en recherche et développement est en perpétuelle innovation.</p>
                                </div>
                            </div>
                        </div>
                        <div class="col-lg-6 col-md-6 col-sm-12 wow fadeInUp animated delay-3s">
                            <div class="about-us-img text-center">
                                <img class="text-center" src="static/picture/about-concept.jpg" alt="" style="object-fit: cover" />
                            </div>
                        </div>
                    </div>
                    <div class="row align-items-center">
                        <div class="col-lg-6 col-md-6 col-sm-12 wow fadeInUp animated delay-3s">
                            <div class="about-us-img text-center">
                                <img class="text-center" src="static/picture/about-factory.jpg" alt="" style="object-fit: cover" />
                            </div>
                        </div>
                        <div class="col-lg-6 col-md-6 col-sm-12">
                            <div class="text-content mb-70">
                                <div class="sub-title">
                                    <h4>
                                        Fabricant</h4>
                                    <p>
                                        Cette unité nous permets d'avoir le contrôle sur toute la chaine de production,
                                        du choix de la matière première au produit fini.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="row align-items-center">
                        <div class="col-lg-6 col-md-6 col-sm-12">
                            <div class="text-content mb-70">
                                <div class="sub-title">
                                    <h4>
                                        Importateur</h4>
                                    <p>
                                        Notre équipe qualité contrôle, vérifie et améliore sans cesse nos produits commercialisés.</p>
                                </div>
                            </div>
                        </div>
                        <div class="col-lg-6 col-md-6 col-sm-12 wow fadeInUp animated delay-3s">
                            <div class="about-us-img text-center">
                                <img class="text-center" src="static/picture/about-importer.jpg" alt="" style="object-fit: cover" />
                            </div>
                        </div>
                    </div>
                    <div class="row align-items-center">
                        <div class="col-lg-6 col-md-6 col-sm-12 wow fadeInUp animated delay-3s">
                            <div class="about-us-img text-center">
                                <img class="text-center" src="static/picture/about-delivery.jpg" alt="" style="object-fit: cover" />
                            </div>
                        </div>
                        <div class="col-lg-6 col-md-6 col-sm-12">
                            <div class="text-content mb-70">
                                <div class="sub-title">
                                    <h4>
                                        Distributeur</h4>
                                    <p>
                                        Notre équipe Logistique organise, planifie et livre nos clients dans les délais
                                        les plus courts.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    <div class="team-area pt-60 pb-60">
        <div class="container">
            <div class="row justify-content-center">
                <div class="col-lg-8">
                    <div class="section_title mb-50">
                        <h2>
                            Nos Services</h2>
                    </div>
                </div>
            </div>
            <div class="row">
                <div class="col-lg-12 col-md-12 align-self-center">
                    <div class="about-us-content">
                        <p class="peragraph-blog">
                           ECOLED EUROPE se compose de plusieurs équipes vouées à satisfaire diverses demandes, aussi spécifiques soient elles.
                        </p>
                    </div>
                </div>
            </div>
            
				<div class="row mt-5 pt-2">
					<div class="col-lg-3">
						<div class="team-box text-center py-3 rounded mt-4" style="height: 250px;">
							<div class="team-social-icon">
								<i class="lni lni-magnifier"></i>
							</div>
							<h5 class="f-18 mt-4 mb-2">UNITÉ RECHERCHE ET DEVELOPPEMENT</h5>
							<p class="text-muted">Grâce à notre unité de Recherche et développement, nous sommes aujourd’hui capables de répondre au plus près des exigences de nos clients et voire même créer des prototypes pour les satisfaire.</p>
						</div>
					</div>
					<div class="col-lg-3">
						<div class="team-box text-center py-3 rounded mt-4" style="height: 250px;">
							<div class="team-social-icon">
								<i class="la la-check"></i>
							</div>
							<h5 class="f-18 mt-4 mb-2">UNITÉ QUALITE PRODUIT</h5>
							<p class="text-muted">Grâce à notre unité Qualité Produit, plusieurs de nos intervenants testent et contrôlent les produits labellisés ECOLED EUROPE et ont pour mission de parfaire nos diverses gammes de luminaires.</p>
						</div>
					</div>
					<div class="col-lg-3">
						<div class="team-box text-center py-3 rounded mt-4" style="height: 250px;">
							<div class="team-social-icon">
								<i class="la la-dollar"></i>
							</div>
							<h5 class="f-18 mt-4 mb-2">UNITÉ COMMERCIALE</h5>
							<p class="text-muted">Grâce à notre unité Commerciale, nos commerciaux sont au plus près de nos clients, architectes, bureaux d’études pour l’élaboration et le suivi de leurs futurs projets.</p>
						</div>
					</div>
					<div class="col-lg-3">
						<div class="team-box text-center py-3 rounded mt-4" style="height: 250px;">
							<div class="team-social-icon">
								<i class="lni lni-plane"></i>
							</div>
							<h5 class="f-18 mt-4 mb-2">UNITÉ LOGISTIQUE</h5>
							<p class="text-muted">Toujours dans une optique de satisfaction, ECOLED EUROPE a su s’équiper pour répondre de façon réactive. Nos équipes en charge de la logistique sont formées afin que nos clients soient livrés rapidement.</p>
						</div>
					</div>
				</div>
        </div>
    </div>
    <script src="static/js/vendors.js" type="text/javascript"></script>
    <script src="static/js/plugins.js" type="text/javascript"></script>
    <script src="static/js/main.js" type="text/javascript"></script>
</asp:Content>
