<%@ Page Title="Home Page" Language="C#" MasterPageFile="~/Site.master" AutoEventWireup="true"
    CodeBehind="Default.aspx.cs" Inherits="ERP.SiteNC202310._Default" %>

<%@ Import Namespace="System.Web.Configuration" %>
<asp:Content ID="HeaderContent" runat="server" ContentPlaceHolderID="HeadContent">
    <%--<link rel="stylesheet" href="layui/css/layui.css" />--%>
    <link rel="stylesheet" href="static/css/vendors.css" />
    <link rel="stylesheet" href="static/css/plugins.css" />
    <link rel="stylesheet" href="static/css/icons.css" />
    <link rel="stylesheet" href="static/css/style.css" />
    <%-- <link rel="stylesheet" href="css/amazeui.css" />
    <link rel="stylesheet" href="css/common.min.css" />
    <link rel="stylesheet" href="css/index.min.css" />--%>
</asp:Content>
<asp:Content ID="Content2" ContentPlaceHolderID="MainContent" runat="server">
    <div class="hero-01-slider" id="div_hero">
        <div class="hero-01 bg-color-1" data-title="01">
            <div class="container" id="menu_pub_content">
                <div class="row">
                    <div class="col-lg-12">
                        <div class="hero-content-wrap">
                            <div class="hero-01-text mt-lg-5">
                                <h1 id="h1_menu_1">
                                    <%--Trendy<br>
                                    Collection--%>
                                </h1>
                                <p class="mt-20 text-white" id="p_menu_1">
                                </p>
                                <div class="button-box mt-60">
                                    <a href="" class="btn theme-btn-2 " id="a_menu_1">Découvrir<i class="las la-angle-right">
                                    </i></a>
                                </div>
                            </div>
                            <div class="inner-images">
                                <div class="image-one" id="div_img_1">
                                    <img id="img_menu_1" class="img-fluid" alt="" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div class="hero-01 bg-color-2" data-title="02">
            <div class="container">
                <div class="row">
                    <div class="col-lg-12">
                        <div class="hero-content-wrap">
                            <div class="hero-01-text mt-lg-5">
                                <h1 id="h1_menu_2">
                                </h1>
                                <p class="mt-30 text-white" id="p_menu_2">
                                </p>
                                <div class="button-box mt-60">
                                    <a href="" class="btn theme-btn-2" id="a_menu_2">Découvrir<i class="las la-angle-right">
                                    </i></a>
                                </div>
                            </div>
                            <div class="inner-images">
                                <div class="image-one" id="div_img_2">
                                    <img class="img-fluid" alt="" id="img_menu_2" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div class="hero-01 bg-color-3" data-title="03">
            <div class="container">
                <div class="row">
                    <div class="col-lg-12">
                        <div class="hero-content-wrap">
                            <div class="hero-01-text mt-lg-5">
                                <h1 id="h1_menu_3">
                                </h1>
                                <p class="mt-30 text-white" id="p_menu_3">
                                </p>
                                <div class="button-box mt-60">
                                    <a href="" class="btn theme-btn-2" id="a_menu_3">Découvrir<i class="las la-angle-right">
                                    </i></a>
                                </div>
                            </div>
                            <div class="inner-images">
                                <div class="image-one" id="div_img_3">
                                    <img class="img-fluid" alt="" id="img_menu_3" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    <div class="banner-category pt-30">
        <div class="container">
            <div class="row" id="div_frist">
            </div>
        </div>
    </div>
    <section class="product-area pt-75 pb-70">
			<div class="container">
				<div class="row justify-content-center">
					<div class="col-lg-8">
						<div class="section_title mb-10">
							<h2>Nouveautés</h2>
						</div>
					</div>
				</div>
		
			</div>
			<div class="container">
				<div class="tab-content">
					<div class="tab-pane fade show active" id="all">
						<div class="row" id = "div_newpro">
							
						</div>
					</div>
					
				<div class="text-center mt-40">
					<a href="ProductList.aspx" class="btn theme-btn">Tous les produits</a>
				</div>
			</div>
			</div>
		</section>
    <div class="promo_detailed">
        <div class="promo_detailed-container">
            <div class="container">
                <div class="am-g">
                    <div class="am-u-md-6">
                        <div class="promo_detailed--cta">
                            <div class="promo_detailed--cta_wrap">
                                <%--<div class="promo_detailed--cta_text">
                                        <span style="font-weight: bolder">NOS SERVICES</span>
                                        <br />
                                        <span style="font-weight: bolder">ECOLED EUROPE se compose de plusieurs équipes vouées
                                            à satisfaire diverses demandes, aussi spécifiques soient elles.</span>
                                    </div>--%>
                            </div>
                            <%-- <div class="promo_detailed-img am-show-sm-only" style="background-image: url('static/image/index-team.jpg');">
                            </div>--%>
                        </div>
                    </div>
                    <div class="am-u-md-6">
                        <ul class="promo_detailed--list">
                            <li class="promo_detailed--list_item">
                                <dl>
                                    <%--<dt>NOS SERVICES</dt>--%>
                                    <dt style="text-decoration: underline; font-weight: normal !important">NOS ÉQUIPES ECOLED
                                        EUROPE</dt>
                                </dl>
                            </li>
                            <li class="promo_detailed--list_item">
                                <dl>
                                    <dd>
                                        ● L'Unité R&D</dd>
                                    <dd>
                                        <br />
                                        Elle répond aux demandes, aux containtes et aux exigences de nos clients.
                                    </dd>
                                </dl>
                            </li>
                            <li class="promo_detailed--list_item">
                                <dl>
                                    <dd>
                                        ● L'Unité Qualité Produit</dd>
                                    <dd>
                                        <br />
                                        Nos intervenants testent et contrôlent l'ensemble des produits labellisés ECOLED
                                        EUROPE. Leurs missions parfaire nos gammes.
                                    </dd>
                                </dl>
                            </li>
                            <li class="promo_detailed--list_item">
                                <dl>
                                    <dd>
                                        ● L'Unité Commercial</dd>
                                    <dd>
                                        <br />
                                        Avec nos clients, architectes, bureaux d’études ..., nos commerciaux sauront apporter
                                        conseils et assistances dans l'élaboration et le suivi de leurs projets.
                                    </dd>
                                </dl>
                            </li>
                            <li class="promo_detailed--list_item">
                                <dl>
                                    <dd>
                                        ● L'Unité Logistique</dd>
                                    <dd>
                                        <br />
                                        Toujours dans une optique de satisfaction, ECOLED EUROPE a su s’équiper pour répondre
                                        de façon réactive. Nos équipes en charge de la logistique sont formées afin que
                                        nos clients soient livrés rapidement.
                                    </dd>
                                </dl>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
        <div class="promo_detailed-img am-hide-sm-only" style="background-image: url('static/image/index-team.jpg');">
        </div>
    </div>
    <div class="promo_detailed">
        <div class="container">
            <div class="am-u-md-6" style="margin-top: 20px">
                <ul class="promo_detailed--list">
                    <li class="promo_detailed--list_item">
                        <dl>
                            <dt style="text-decoration: underline; font-weight: normal !important">Découvrez l'univers
                                d'Ecoled Europe</dt>
                        </dl>
                    </li>
                    <li class="promo_detailed--list_item">
                        <dl>
                            <dd>
                                Fort de son expérience et de son savoir-faire pour de nombreux clients prestigieux,
                                Ecoled Europe propose des solutions d’éclairages innovantes, de hautes performances
                                et personnalisables.</dd>
                        </dl>
                    </li>
                    <li class="promo_detailed--list_item">
                        <dl>
                            <dd>
                                En réalisant l’ensemble des millons de la chaine de conception à la réalisation,
                                Ecoled Europe répond aux exigences de ses clients et devient un partenaire flexible,
                                fiable et solide.</dd>
                        </dl>
                    </li>
                </ul>
            </div>
            <div class="feature-col col-xs-12 col-sm-2 col-md-2">
            </div>
            <div class="feature-col col-xs-12 col-sm-4 col-md-4 hom2kola2" style="float: right;
                position: relative;">
                <img src="static/image/index-newprd.png" alt="" style="width: 100%" />
            </div>
        </div>
    </div>
    <div class="promo_detailed">
        <div class="feature-col col-xs-6 col-sm-6 catlog text-right" style="margin-top: 0px">
            &nbsp;<img src="static/image/index-brochure.png" alt="" style="width: 70%" /></div>
        <div class="feature-col col-xs-6 col-sm-6 catlog text-right">
        </div>
        <div class="feature-col col-xs-6 col-sm-6 hom2kola1" style="float: right; position: relative;
            top: -500px;">
            <h3 class="mb32">
            </h3>
            <h3 class="mb32">
            </h3>
            <h3 class="mb32">
            </h3>
            <h3 class="mb32">
            </h3>
            <h3 class="mb32">
            </h3>
            <h4 class="mb32">
                Catalogue 2023</h4>
            <p>
                Vous pouvez désormais télécharger notre catalogue édition 2023</p>
            <p>
                TÉLÉCHARGER LE CATALOGUE COMPLET</p>
            <a href="Download.aspx">TÉLÉCHARGER</a></div>
    </div>
    <!--promo_detailed end-->
    <div class="section" style="border-bottom: 1px solid #e9e9e9;">
        <div class="container">
            <div class="section--header">
                <h2 class="section--title">
                    Cultrue d'entreprise</h2>
                <p class="section--description" style="white-space: nowrap;">
                    Notre culture nous définit… c'est notre ADN. Nous l'appelons la EcoLed Way.<br />
                    Ce sont les valeurs que nous partageons et les pratiques professionnelles que nous
                    mettons en œuvre.<br />
                    C'est la façon dont nous assumons nos engagements chaque jour.<br />
                    EcoLed Way se concrétise ainsi : Nous faisons ce que nous disons et nous assumons
                    ce que nous faisons.
                </p>
            </div>
            <!--index-container start-->
            <div class="index-container">
                <div class="am-g">
                    <div class="am-u-md-3">
                        <div class="service_item" style="height: 300px;">
                            <i class="service_item--icon am-icon-lightbulb-o"></i>
                            <h3 class="service_item--title">
                                Concepteur</h3>
                            <div class="service_item--text">
                                <p>
                                    Notre équipe en recherche et développement est en perpétuelle innovation.</p>
                            </div>
                        </div>
                    </div>
                    <div class="am-u-md-3">
                        <div class="service_item" style="height: 300px;">
                            <i class="service_item--icon am-icon-codepen"></i>
                            <h3 class="service_item--title">
                                Fabricant</h3>
                            <div class="service_item--text">
                                <p>
                                    Cette unité nous permets d'avoir le contrôle sur toute la chaine de production,
                                    du choix de la matière première au produit fini.</p>
                            </div>
                        </div>
                    </div>
                    <div class="am-u-md-3">
                        <div class="service_item" style="height: 300px;">
                            <i class="service_item--icon am-icon-ship"></i>
                            <h3 class="service_item--title">
                                Importateur</h3>
                            <div class="service_item--text">
                                <p>
                                    Notre équipe qualité contrôle, vérifie et améliore sans cesse nos produits commercialisés.</p>
                            </div>
                        </div>
                    </div>
                    <div class="am-u-md-3">
                        <div class="service_item" style="height: 300px;">
                            <i class="service_item--icon am-icon-truck"></i>
                            <h3 class="service_item--title">
                                Distributeur</h3>
                            <div class="service_item--text">
                                <p>
                                    Notre équipe Logistique organise, planifie et livre nos clients dans les délais
                                    les plus courts.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <!--index-container end-->
        </div>
    </div>
    <div class="blog-area pt-100">
        <div class="container">
            <div class="row" id="div_prj">
            </div>
        </div>
    </div>
    <%--   <div class="benefits pt-100 pb-50">
        <div class="container">
            <div class="row">
                <div class="col-12 col-sm-6 col-lg-3">
                    <div class="benefits-item">
                        <div class="benefits-item-icon">
                            <img src="static/picture/15.png" alt="Free Shipping">
                        </div>
                        <div class="benefits-item-content">
                            <h5>
                                Free Shipping</h5>
                            <p>
                                Free shipping on all order</p>
                        </div>
                    </div>
                </div>
                <div class="col-12 col-sm-6 col-lg-3">
                    <div class="benefits-item">
                        <div class="benefits-item-icon">
                            <img src="static/picture/21.png" alt="Valuable Gifts">
                        </div>
                        <div class="benefits-item-content">
                            <h5>
                                Valuable Gifts</h5>
                            <p>
                                Free gift after every 10 order</p>
                        </div>
                    </div>
                </div>
                <div class="col-12 col-sm-6 col-lg-3">
                    <div class="benefits-item">
                        <div class="benefits-item-icon">
                            <img src="static/picture/31.png" alt="All Day Support">
                        </div>
                        <div class="benefits-item-content">
                            <h5>
                                All Day Support</h5>
                            <p>
                                Call us:+01 234 567 89</p>
                        </div>
                    </div>
                </div>
                <div class="col-12 col-sm-6 col-lg-3">
                    <div class="benefits-item">
                        <div class="benefits-item-icon">
                            <img src="static/picture/41.png" alt="Seasonal Sale">
                        </div>
                        <div class="benefits-item-content">
                            <h5>
                                Seasonal Sale</h5>
                            <p>
                                Discounts up to 50% on all</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>--%>
    <script src="js/Web/Index.js?<%= WebConfigurationManager.AppSettings["jsVersion"] %>"
        type="text/javascript"></script>
    <script src="static/js/vendors.js" type="text/javascript"></script>
    <script src="static/js/plugins.js" type="text/javascript"></script>
    <script src="static/js/main.js" type="text/javascript"></script>
    <link rel="stylesheet" href="css/amazeui.css" />
    <link rel="stylesheet" href="css/common.min.css" />
    <link rel="stylesheet" href="css/index.min.css" />
</asp:Content>
