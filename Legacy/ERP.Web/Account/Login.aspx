<%@ Page Title="Log In" Language="C#" MasterPageFile="~/Empty.master" AutoEventWireup="true"
    CodeBehind="Login.aspx.cs" Inherits="ERP.Web.Account.Login" %>

<asp:Content ID="HeaderContent" runat="server" ContentPlaceHolderID="HeadContent">
    <meta http-equiv="content-type" content="text/html; charset=UTF-8">
    <meta charset="utf-8">
    <title>ERP Admin | Login</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1, user-scalable=no">
    <meta name="description" content="">
    <meta name="author" content="">
    <!-- STYLESHEETS -->
    <!--[if lt IE 9]><script src="../js/flot/excanvas.min.js"></script><script src="http://html5shiv.googlecode.com/svn/trunk/html5.js"></script><script src="http://css3-mediaqueries-js.googlecode.com/svn/trunk/css3-mediaqueries.js"></script><![endif]-->
    <link rel="stylesheet" type="text/css" href="../css/cloud-admin.css">
    <link href="../font-awesome/css/font-awesome.min.css" rel="stylesheet">
    <!-- DATE RANGE PICKER -->
    <link rel="stylesheet" type="text/css" href="../js/bootstrap-daterangepicker/daterangepicker-bs3.css" />
    <!-- UNIFORM -->
    <link rel="stylesheet" type="text/css" href="../js/uniform/css/uniform.default.min.css" />
    <!-- ANIMATE -->
    <link rel="stylesheet" type="text/css" href="../css/animatecss/animate.min.css" />
    <!-- JAVASCRIPTS -->
    <!-- Placed at the end of the document so the pages load faster -->
    <!-- JQUERY -->
    <script src="../js/jquery/jquery-2.0.3.min.js"></script>
    <!-- JQUERY UI-->
    <script src="../js/jquery-ui-1.10.3.custom/js/jquery-ui-1.10.3.custom.min.js"></script>
    <!-- BOOTSTRAP -->
    <script src="../bootstrap-dist/js/bootstrap.min.js"></script>
    <!-- UNIFORM -->
    <script type="text/javascript" src="../js/uniform/jquery.uniform.min.js"></script>
    <!-- CUSTOM SCRIPT -->
    <script src="../js/script.js"></script>
    <link rel="shortcut icon" href="../img/logo/logo-icon.png">
    <script>
        jQuery(document).ready(function () {
            App.setPage("login");  //Set current page
            App.init(); //Initialise plugins and elements
        });
    </script>
    <script type="text/javascript">
        function swapScreen(id) {
            jQuery('.visible').removeClass('visible animated fadeInUp');
            jQuery('#' + id).addClass('visible animated fadeInUp');
        }

        function login() {
            var txb_login = $('.txb_login').val();
            var txb_pwd = $('.txb_pwd').val();
            if (txb_login && txb_pwd) {
                document.getElementById($('.btn_login')[0].id).click();
                return true;
            } else {
                return false;
            }
        }
    </script>
</asp:Content>
<asp:Content ID="BodyContent" runat="server" ContentPlaceHolderID="MainContent">
    <div class="login" style="height: 100%">
        <!-- PAGE -->
        <section id="page" style="height: 100%;">
			<!-- HEADER -->
			<header>
				<!-- NAV-BAR -->
				<div class="container">
					<div class="row">
						<div class="col-md-4 col-md-offset-4">
							<div id="logo">
								<a href="#"><img src="../img/logo/logo.png" style="max-width: 100%; height:100px;" alt="logo name" /></a>
							</div>
						</div>
					</div>
				</div>
				<!--/NAV-BAR -->
			</header>
			<!--/HEADER -->
			<!-- LOGIN -->
			<section id="login" class="visible">
				<div class="container">
					<div class="row">
						<div class="col-md-4 col-md-offset-4">
							<div class="login-box-plain">
								<h2 class="bigintro">Connexion</h2>
								<div class="divide-40"></div>
								<form role="form">
                                   <div class="form-group">
									<label for="txb_login">Login</label>
                                       <input class="form-control txb_login" id="txb_login" runat="server" />
								  </div>
								  <div class="form-group"> 
									<label for="txb_pwd">Password</label>
									<i class="fa fa-lock"></i>
									<input type="password" class="form-control txb_pwd" id="txb_pwd" runat="server" />
								  </div>
								  <div class="form-actions">
									<label class="checkbox"> <input type="checkbox" class="uniform" value="" runat="server" id="cbx_remeberme" /> Remember me</label>
									<%--<button type="submit" class="btn btn-danger" onclick="return login()" runat="server">Connexion</button>--%>
                                    <asp:Button runat="server" ID="bnt_login" Style="background: url(../img/menu_005_bg.jpg) repeat-x;color: #ffffff;" CssClass="btn btn-inverse btn_login" Text="Connexion" OnClick="bnt_login_OnClick" OnClientClick="return login()"/>
								  </div>
                                  <div class="form-group center">
                                      <asp:Label runat="server" ID="lb_msg" Style="color:red;"></asp:Label>
                                  </div>
                                </form>
							</div>
						</div>
					</div>
				</div>
			</section>
			<!--/LOGIN -->
	</section>
        <!--/PAGE -->
    </div>
</asp:Content>
