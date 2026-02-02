<%@ Page Title="Home Page" Language="C#" MasterPageFile="~/Site.master" AutoEventWireup="true"
    CodeBehind="Default.aspx.cs" Inherits="ERP.RefSite._Default" %>
<%@ Import Namespace="System.Web.Configuration" %>

<asp:Content ID="HeaderContent" runat="server" ContentPlaceHolderID="HeadContent">
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
    <meta name="description" content="" />
    <meta name="author" content="" />
    <title>ECOLED EUROPE</title>
    <!--[if IE]>
        <meta http-equiv="X-UA-Compatible" content="IE=edge,chrome=1">
        <![endif]-->
    <!-- BOOTSTRAP CORE STYLE CSS -->
    <link href="css/bootstrap.css" rel="stylesheet" />
    <!-- VEGAS SLIDESHOW STYLE CSS -->
    <link href="plugins/vegas/jquery.vegas.min.css" rel="stylesheet" />
    <!-- FONTAWESOME STYLE CSS -->
    <link href="css/font-awesome.min.css" rel="stylesheet" />
    <!-- CUSTOM STYLE CSS -->
    <link href="css/style.css?V=<%= WebConfigurationManager.AppSettings["jsVersion"] %>"
        rel="stylesheet" />
    <!-- GOOGLE FONT -->
    <link href='http://fonts.googleapis.com/css?family=Open+Sans' rel='stylesheet' type='text/css' />
    <!-- HTML5 shim and Respond.js IE8 support of HTML5 elements and media queries -->
    <!--[if lt IE 9]>
      <script src="https://oss.maxcdn.com/libs/html5shiv/3.7.0/html5shiv.js"></script>
      <script src="https://oss.maxcdn.com/libs/respond.js/1.3.0/respond.min.js"></script>
    <![endif]-->
    <link rel="shortcut icon" href="img/favicon.ico">
    <link href="css/loading.css" rel="stylesheet" type="text/css" />
    <style>
        .error_border
        {
            border-color: red;
            border-width: 1px;
            border-style: solid;
        }
        .flashinput {
            -webkit-animation: glow 800ms ease-out infinite alternate;
	-moz-animation: glow 800ms ease-out infinite alternate;
	-o-animation: glow 800ms ease-out infinite alternate;
	-ms-animation: glow 800ms ease-out infinite alternate;
	animation: glow 800ms ease-out infinite alternate;
	border-color: #14AAE2;
	box-shadow: 0 0 10px rgba(0,103,147,.2), inset 0 0 10px rgba(0,103,147,.1), 0 0px 0 transparent;
	color: #efe;
	outline: none;
}
@-webkit-keyframes glow {
    0% {
		border-color: #14AAE2;
        box-shadow: 0 0 10px rgba(0, 103, 147, .2), inset 0 0 10px rgba(0, 103, 147, .1), 0 0px 0 transparent;
    }	
    100% {
		border-color: #fff;
        box-shadow: 0 0 10px rgba(0, 103, 147, .6), inset 0 0 10px rgba(0, 103, 147, .4), 0 0px 0 transparent;
    }
}
@-webkit-keyframes glow {
    0% {
		border-color: #14AAE2;
        box-shadow: 0 0 10px rgba(0, 103, 147, .2), inset 0 0 10px rgba(0, 103, 147, .1), 0 0px 0 transparent;
    }	
    100% {
		border-color: #fff;
        box-shadow: 0 0 10px rgba(0, 103, 147, .6), inset 0 0 10px rgba(0, 103, 147, .4), 0 0px 0 transparent;
    }
}

    </style>
</asp:Content>
<asp:Content ID="BodyContent" runat="server" ContentPlaceHolderID="MainContent">
    <div class="navbar navbar-inverse navbar-fixed-top scrollclass" id="menu">
        <div class="container">
            <div class="navbar-header">
                <button type="button" class="navbar-toggle" data-toggle="collapse" data-target=".navbar-collapse">
                    <span class="icon-bar"></span><span class="icon-bar"></span><span class="icon-bar">
                    </span>
                </button>
                <a class="navbar-brand" href="http://www.ecoled-europe.com">
                    <img src="img/logo180-50.png" alt="" style="max-height: 32px" /></a>
            </div>
            <div class="navbar-collapse collapse">
                <ul class="nav navbar-nav navbar-right">
                    <li><a href="http://www.ecoled-europe.com">EcoLed Europe</a></li>
                    <li><a href="#about">À propos de nous</a></li>
                    <li><a href="#services">SERVICES</a></li>
                    <li><a href="#contact">CONTACT</a></li>
                </ul>
            </div>
        </div>
    </div>
    <!--NAVBAR SECTION END-->
    <div id="home">
        <div class="container">
            <div class="row">
                <div class="col-lg-8 col-lg-offset-2 col-md-8 col-md-offset-2 col-sm-8 col-sm-offset-2 ">
                    <div id="carousel-slider" data-ride="carousel" class="carousel slide">
                        <div class="carousel-inner">
                            <div class="item active">
                                <h1>
                                    Expert de l'éclairage écoénergétique
                                </h1>
                            </div>
                            <div class="item">
                                <h1>
                                    Bien plus que la lumière</h1>
                            </div>
                            <div class="item">
                                <h1>
                                    Respectueux de l'environnement
                                </h1>
                            </div>
                        </div>
                        <!--INDICATORS-->
                        <ol class="carousel-indicators">
                            <li data-target="#carousel-slider" data-slide-to="0" class="active"></li>
                            <li data-target="#carousel-slider" data-slide-to="1" class=""></li>
                            <li data-target="#carousel-slider" data-slide-to="2" class=""></li>
                        </ol>
                    </div>
                </div>
            </div>
            <div class="row">
                <div class="col-lg-6 col-lg-offset-3 col-md-6 col-md-offset-3 col-sm-8 col-sm-offset-2  scrollclass">
                    <p>
                        <img src="img/innovation_and_you.png" alt="" title="" data-image-rendered="true"
                            style="border: 0px; margin: 0px; padding: 0px; font-style: normal; font-variant-ligatures: normal;
                            font-variant-caps: normal; font-variant-numeric: inherit; font-weight: normal;
                            font-stretch: inherit; font-size: 14px; line-height: inherit; font-family: centrale_sans_book, tahoma, arial, helvetica, sans-serif;
                            vertical-align: middle; color: rgb(255, 255, 255); letter-spacing: normal; orphans: 2;
                            text-align: start; text-indent: 0px; text-transform: none; white-space: normal;
                            widows: 2; word-spacing: 0px; -webkit-text-stroke-width: 0px; text-decoration-style: initial;
                            text-decoration-color: initial;" />
                    </p>
                    <br />
                    <a class="btn  btn-lg custom-btn-1 flashinput" id="abtn_download_in_progress"><i
                        class="fa fa-download"></i>Chargement en cours</a> <a onclick="tsclick(1)" class="btn  btn-lg custom-btn-1 flashinput"
                            id="abtn_techfile" style="display: none;"><i class="fa fa-gear"></i>Fiche Tech
                    </a><a class="btn  btn-lg custom-btn-1 flashinput" id="abtn_ies" onclick="tsclick(2)" style="display: none;">
                        <i class="fa fa-lightbulb-o"></i>IES</a> <a href="#contact" class="btn btn-lg custom-btn-1 flashinput">
                            <i class="fa fa-globe"></i>CONTACT </a>
                </div>
            </div>
        </div>
    </div>
    <!--HOME SECTION END-->
    <hr />
    <section id="about">
       <div class="container">
           <div class="row">
               <div class="col-lg-8 col-lg-offset-2 col-md-8 col-md-offset-2 col-sm-8 col-sm-offset-2  text-center">
			   <h2>À propos de nous</h2>
			    <p >
                        À propos de EcoLed Europe Depuis 30 ans, EcoLed Europe est à la pointe de l'innovation.
                        Nous utilisons la lumière pour accroître le confort et la productivité des personnes,
                        en fournissant éclairage de qualité dans les espaces publics, les espaces de travail
                        et à la maison. Nous utilisons la lumière pour améliorer le bien-être et la sécurité
                        des personnes. Une lumière qui sait divertir, inspirer et informer, qui rend les
                        villes plus agréables et répond aux besoins quotidiens des personnes.
                     
                   </p>
			   </div>
			   </div>
			   <div class="row ">
                <div class="col-lg-4 col-md-4 col-sm-4">
                    <div class="media">
                        <div class="pull-left">
                            <i class=" fa fa-fax fa-4x"></i>

                        </div>
                        <div class="media-body">
                            <h3 class="media-heading">100% Devis Gratuit</h3>
                            <p>
                                
                            </p>
                        </div>
                    </div>
                </div>
                <div class="col-lg-4 col-md-4 col-sm-4">
                    <div class="media">
                        <div class="pull-left">
                            <i class="fa fa-history fa-4x "></i>
                        </div>
                        <div class="media-body">
                            <h3 class="media-heading">Produit personnalisable</h3>
                            <p>
                            </p>

                        </div>
                    </div>
                </div>
                <div class="col-lg-4 col-md-4 col-sm-4">
                    <div class="media">
                        <div class="pull-left">
                            <i class="fa fa-folder-open-o fa-4x  "></i>
                        </div>
                        <div class="media-body">
                            <h3 class="media-heading">Dossier complet</h3>
                            <p>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
			   </div>
			   </section>
    <!--ABOUT SECTION END-->
    <hr />
    <section id="services">
       <div class="container">
           <div class="row">
               <div class="col-lg-8 col-lg-offset-2 col-md-8 col-md-offset-2 col-sm-8 col-sm-offset-2  text-center">
			   <h2> SERVICES</h2>
			    <p >
                      
Notre objectif est d’offrir bien plus que la lumière. Nos systèmes d’éclairage ajoutent une valeur durable qui embellit la vie de nos clients, de l’entreprise, de la société.
Que faisons-nous pour l’atteindre ?
                     
                   </p>
			   </div>
			   </div>
			   <div class="row ">
              
                <div class="col-lg-6 col-md-6 col-sm-6">
                    <div class="media">
                        <div class="pull-left">
                            <i class="fa fa-road fa-4x "></i>
                        </div>
                        <div class="media-body">
                            <h3 class="media-heading">Éclairage Durable</h3>
                            <p>
                            </p>
                        </div>
                    </div>
                </div>
                <div class="col-lg-6 col-md-6 col-sm-6">
                    <div class="media">
                        <div class="pull-left">
                            <i class="fa fa-tree fa-4x  "></i>
                        </div>
                        <div class="media-body">
                            <h3 class="media-heading">Démarche environnementale</h3>
                            <p>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
			 <div class="row ">
              
                <div class="col-lg-6 col-md-6 col-sm-6">
                    <div class="media">
                        <div class="pull-left">
                            <i class="fa fa-bar-chart-o fa-4x "></i>
                        </div>
                        <div class="media-body">
                            <h3 class="media-heading">Conformité produit</h3>
                            <p>
                            </p>
                        </div>
                    </div>
                </div>
                <div class="col-lg-6 col-md-6 col-sm-6">
                    <div class="media">
                        <div class="pull-left">
                            <i class="fa fa-share-alt fa-4x  "></i>
                        </div>
                        <div class="media-body">
                            <h3 class="media-heading">Générer un impact social</h3>
                            <p>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
			   </div>
			   </section>
    <!--SERVICES SECTION END-->
    <hr />
    <section id="contact">
				
       <div class="container">
           <div class="row">
               <div class="col-lg-8 col-lg-offset-2 col-md-8 col-md-offset-2 col-sm-8 col-sm-offset-2  text-center">
			   <h2> CONTACT</h2>
			    <p >
                      Nous avons reçu ce message par mail. Nous nous efforcerons de traiter votre demande dans les meilleurs délais. Les données à caractère personnel sont stockées puis traitées pour répondre à votre demande de contact mais ne sont pas transmises à des tiers.
                     
                   </p>
			   </div>
			   </div>
			   <div class="row ">
                <div class="col-lg-8 col-lg-offset-2 col-md-8 col-md-offset-2 col-sm-8 col-sm-offset-2 text-center">
                   <div id="div_contact">
				   <label>Société</label>
                     <div class="form-group" >
                                    <input class="form-control" required id="msg_companyname"/>
                                    </div>
				   <label>Prénom</label>
                     <div class="form-group" >
                                    <input class="form-control" required id="msg_name"/>
                                    </div>
				   <label>Nom de famille</label>
                     <div class="form-group" >
                                    <input class="form-control" required id="msg_lastname"/>
                                    </div>
								 <label>Adresse e-mail</label>
                      <div class="form-group" >
                                    <input class="form-control" required id="msg_email"/>
                                </div>
								 <label>Téléphone</label>
                      <div class="form-group" >
                                    <input class="form-control" required id="msg_tel"/>
                                </div>
								 <label>Subjet</label>
                      <div class="form-group" >
                                    <input class="form-control" required id="msg_subject"/>
                                </div>
								 <label>Votre message</label>
                     <div class="form-group" >
                                    <textarea class="form-control" required id="msg_message" style="height: 100px;"></textarea>
                                </div>
                      <div class="form-group">
                                    <button type="button" class="btn custom-btn-1 btn-block" onclick="return sendComment()">Envoyer le formulaire</button>
                                </div>
                          </div>
                </div>
            </div>
			   </div>
			   </section>
    <!--CONTACT SECTION END-->
    <div class="footer">
        &copy; <span id="span_year"></span> www.ecoled-europe.com <a href="http://www.ecoled-europe.com/" target="_blank" style="color:#fff"
            title="ECOLED EUROPE">ECOLED EUROPE</a>
    </div>
    <!-- JAVASCRIPT FILES PLACED AT THE BOTTOM TO REDUCE THE LOADING TIME  -->
    <!-- CORE JQUERY  -->
    <script src="plugins/jquery-1.10.2.js"></script>
    <!-- BOOTSTRAP SCRIPTS  -->
    <script src="plugins/bootstrap.js"></script>
    <!-- EASING SCROLL SCRIPTS PLUGIN  -->
    <script src="plugins/vegas/jquery.vegas.min.js"></script>
    <!-- VEGAS SLIDESHOW SCRIPTS  -->
    <script src="plugins/jquery.easing.min.js"></script>
    <!-- CUSTOM SCRIPTS  -->
    <script src="js/custom.js"></script>
    <script src="js/homepage.js?V=<%= WebConfigurationManager.AppSettings["jsVersion"] %>" type="text/javascript"></script>
    <div class="loading-mask" id="loading_mask" style="display: none;">
        <p id="message_loading_mask" style="margin-left: auto; margin-right: auto; text-align: center;
            margin-top: 23%; color: #0877BA; font-size: 22pt; background-color: white; padding-top: 10px;
            padding-bottom: 10px;">
            Veuillez patienter...</p>
        <p id="message_loading_animation" class="message_loading_animation">
        </p>
    </div>
</asp:Content>
