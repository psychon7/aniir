<%@ Page Title="" Language="C#" AutoEventWireup="true" CodeBehind="Album.aspx.cs"
    Inherits="ERP.Web.Views.Album.Album" %>
<%@ Import Namespace="System.Web.Configuration" %>

<%@ Register TagPrefix="uc" TagName="ucSilderMenu" Src="~/UC/SilderMenu.ascx" %>
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head id="Head1">
    <title>ERP - Album</title>
    <link href="../../css/site.css" rel="stylesheet" type="text/css" />
    <!-- COLORBOX -->
    <link rel="stylesheet" type="text/css" href="../../js/colorbox/colorbox.min.css" />
    <!-- END COLORBOX -->
    <meta http-equiv="content-type" content="text/html; charset=UTF-8">
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1, user-scalable=no">
    <meta name="description" content="">
    <meta name="author" content="">
    <!-- FILE UPLOAD -->
    <link href="../../js/jquery-upload/css/jquery.fileupload.css" rel="stylesheet" type="text/css">
    <!-- CSS part -->
    <link rel="stylesheet" type="text/css" href="../../css/cloud-admin.css">
    <link rel="stylesheet" type="text/css" href="../../css/themes/default.css" id="skin_switcher">
    <link rel="stylesheet" type="text/css" href="../../css/responsive.css">
    <!-- STYLESHEETS -->
    <!--[if lt IE 9]><script src='../../js/flot/excanvas.min.js'></script><script src="http://html5shiv.googlecode.com/svn/trunk/html5.js"></script><script src="http://css3-mediaqueries-js.googlecode.com/svn/trunk/css3-mediaqueries.js"></script><![endif]-->
    <link href="../../font-awesome/css/font-awesome.min.css" rel="stylesheet">
    <!-- ANIMATE -->
    <link rel="stylesheet" type="text/css" href="../../css/animatecss/animate.min.css" />
    <!-- TODO -->
    <link rel="stylesheet" type="text/css" href="../../js/jquery-todo/css/styles.css" />
    <!-- GRITTER -->
    <link rel="stylesheet" type="text/css" href="../../js/gritter/css/jquery.gritter.css" />
    <!-- /CSS part -->
    <!-- JAVASCRIPTS -->
    <!-- Placed at the end of the document so the pages load faster -->
    <!-- JQUERY -->
    <script src='../../js/jquery/jquery-2.0.3.min.js'></script>
    <!-- JQUERY UI-->
    <script src='../../js/jquery-ui-1.10.3.custom/js/jquery-ui-1.10.3.custom.min.js'></script>
    <!-- BOOTSTRAP -->
    <script src='../../bootstrap-dist/js/bootstrap.min.js'></script>
    <!-- BLOCK UI -->
    <script type="text/javascript" src='../../js/jQuery-BlockUI/jquery.blockUI.min.js'></script>
    <!-- COOKIE -->
    <script type="text/javascript" src='../../js/jQuery-Cookie/jquery.cookie.min.js'></script>
    <!-- CUSTOM SCRIPT -->
    <script src='../../js/script.js'></script>
    <script src='../../css/loading.css'></script>
    <link rel="shortcut icon" href="../../img/logo/logo.png">
    <%-- <script>
        jQuery(document).ready(function () {
            App.setPage("gallery");  //Set current page
            App.init(); //Initialise plugins and elements
        });
    </script>--%>
    <!-- /JAVASCRIPTS -->
    <script type="text/javascript">


        function getServicePath() {
            window.webservicePath = "../../Services/ERPWebServices.asmx";
        }
    </script>
    <style>
        .error_border
        {
            border-color: red;
            border-width: 1px;
            border-style: solid;
        }
    </style>
</head>
<body>
    <script src="../../js/bootbox/bootbox.min.js" type="text/javascript"></script>
    <script src="../../js/jquery/jquery-2.0.3.min.js"></script>
    <script src="../../js/ERP/ERPBaseJS.js?V=<%= WebConfigurationManager.AppSettings["jsVersion"] %>"
        type="text/javascript"></script>
    <script src="../../js/ERP/CommonJS.js?V=<%= WebConfigurationManager.AppSettings["jsVersion"] %>"
        type="text/javascript"></script>
    <%--<script src="../../js/ERP/Album/AlbumJS.js" type="text/javascript"></script>--%>
    <script src="../../js/ERP/Album/AlbumJS.js?V=<%= WebConfigurationManager.AppSettings["jsVersion"] %>"
        type="text/javascript"></script>
    <script>
//        function RightErrorRedirect() {
//            MsgPopUpWithResponse('ERREUR', 'Erreur d\'autorisation, vous n\'avez pas des autorisations suffisantes, veuillez contacter votre administrateur !', 'Redirct2Default()');
//            return false;
//        }

//        function Redirct2Default() {
//            window.location = '../../Default.aspx';
//        }
    </script>
    <header class="navbar clearfix" id="header">
                    <form id="Form1" runat="server">
		<div class="container">
            <div class="navbar-brand">
                <!-- COMPANY LOGO -->
                <a href='../../Default.aspx'>
                <img src='../../img/logo/logo.png' alt="Cloud Admin Logo" class="img-responsive" style="height: 30px; width: auto;"> </a>
            <!-- /COMPANY LOGO --> 
            <!-- TEAM STATUS FOR MOBILE --> 
                <div class="visible-xs"> <a href="#" class="team-status-toggle switcher btn dropdown-toggle"> <i class="fa fa-users"></i></a> 
                </div> 
            <!-- /TEAM STATUS FOR MOBILE --> 
            <!-- SIDEBAR COLLAPSE --> 
                <div id="sidebar-collapse" class="sidebar-collapse btn"> <i class="fa fa-bars" data-icon1="fa fa-bars" data-icon2="fa fa-bars" ></i>
                </div> 
            <!-- /SIDEBAR COLLAPSE --> 
            </div> 
            <!-- NAVBAR LEFT --> 
            <%--<ul class="nav navbar-nav pull-left hidden-xs" id="navbar-left">
                <li class="dropdown">
                    <a href="#" class="dropdown-toggle" data-toggle="dropdown"> <i class="fa fa-cog"></i>
                        <span class="name">Skins</span> <i class="fa fa-angle-down"></i>
                    </a>
                    <ul class="dropdown-menu skins">
                        <li class="dropdown-title">
                            <span><i class="fa fa-leaf"></i> Theme Skins</span>
                        </li>
                        <li><a href="#" data-skin="default">Subtle (default)</a></li>
                        <li><a href="#" data-skin="night">Night</a></li>
                        <li><a href="#" data-skin="earth">Earth</a></li>
                        <li><a href="#" data-skin="utopia">Utopia</a></li> <li><a href="#" data-skin="nature">Nature</a></li>
                        <li><a href="#" data-skin="graphite">Graphite</a></li> 
                    </ul> 
                </li> 
            </ul>--%>
            <!-- /NAVBAR LEFT --> 
            <!-- BEGIN TOP NAVIGATION MENU -->
            <ul class="nav navbar-nav pull-right">
                <!-- BEGIN TODO DROPDOWN -->
                <li class="dropdown" id="header-tasks">
                     <a href="#" class="dropdown-toggle" data-toggle="dropdown"> <i class="fa fa-tasks"></i> 
                     <span class="badge"></span> </a> 
                     <ul class="dropdown-menu tasks" id="ul_task">
                         <li class="dropdown-title"><span><i class="fa fa-check"></i><span id="task_count_title">6 tasks in progress</span></span> </li>
                             <%--<li class="footer">
                                 <a href="#">See all tasks <i class="fa fa-arrow-circle-right"></i></a>
                             </li> --%>
                     </ul> 
                </li> 
                <!-- END TODO DROPDOWN --> 
                <!-- BEGIN USER LOGIN DROPDOWN --> 
                <li class="dropdown user" id="header-user">
                    <a href="#" class="dropdown-toggle" data-toggle="dropdown"> <img alt="" src='../../img/gritter/settings.png' style="height:25px;width: 25px;"/> 
                    <span class="username"></span> 
                    <i class="fa fa-angle-down"></i>
                    </a>
                    <ul class="dropdown-menu">
                         <li>
                             <a href="#"><i class="fa fa-user"></i> Mon Profil</a>
                         </li>
                         <li>
                             <asp:LinkButton ID="lbtn_logout" runat="server" OnClick="lbtn_logout_OnClick">
                                 <i class="fa fa-power-off"></i> Déconnexion
                             </asp:LinkButton>
                         </li> 
                    </ul> 
                </li> 
                <!-- END USER LOGIN DROPDOWN --> 
            </ul> 
            <!-- END TOP NAVIGATION MENU --> 
            </div>
                    </form>
    </header>
    <!--/HEADER -->
    <div class="copyrights">
        <a href="#">朱鹮软件</a>
    </div>
    <section id="page">
<!-- SIDEBAR --> 
    <div id="sidebar" class="sidebar">
    
        <uc:ucSilderMenu ID="ucSilderMenu" runat="server" />
        </div>
    
        <div class="main-content" id="main-content">
            <div class="container">
                <div class="row">
                    <div id="content" class="col-lg-12">
                <!-- PAGE HEADER-->
                <div class="row">
                    <div class="col-sm-12">
                        <div class="page-header">
                            <!-- STYLER -->
                            <!-- /STYLER -->
                            <!-- BREADCRUMBS -->
                            <ul class="breadcrumb">
                                <li><i class="fa fa-home"></i>&nbsp;<a href="../../Default.aspx">Home</a>&nbsp; </li>
                                <li>Album</li>
                            </ul>
                            <!-- /BREADCRUMBS -->
                            <div class="clearfix">
                                <h3 class="content-title pull-left">
                                    Album photo</h3>
                            </div>
                            <div class="description">
                            </div>
                        </div>
                    </div>
                </div>
                <!-- /PAGE HEADER -->
                <!-- FORMS -->
                <div class="row">
                    <div class="col-md-12">
                        <div class="row">
                            <div class="col-md-12">
                                <div class="box border inverse">
                                    <div class="box-title">
                                        <h4>
                                            <i class="fa fa-bars"></i>Les Album Photo</h4>
                                    </div>
                                    <div class="box-body">
                                        <div class="form-horizontal">
                                            <div class="form-group" id="div_album_names">
                                                <div class="col-md-2">
                                                    <a class="btn btn-inverse btn-icon input-block-level" onclick="return createUpdate_Album(this)">
                                                        <div title="" style="overflow: hidden;">
                                                            Créer un Album</div>
                                                    </a>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="separator">
                        </div>
                        <!-- images -->
                        <div class="row">
                            <div class="col-md-12">
                                <!-- BOX -->
                                <div class="box">
                                    <div class="box-body clearfix">
                                        <div class="row" style="margin-bottom: 50px;">
                                            <form action="../../Services/UploadFilesHandler.ashx" id="uploadFileForm" method="POST" enctype="multipart/form-data" style="display: none;">
                                            <div class="col-md-12">
                                                <div class="col-md-12" style="text-align: center;">
                                                    <label id="spanAlbumName" class='col-sm-12 control-label'></label>
                                                </div>
                                                <div class="col-md-12" style="text-align: center;">
                                                <span class="btn btn-inverse fileinput-button">
													<i class="fa fa-plus"></i>
													<span>Ajouter</span>
													<input type="file" id="iptUploadImage" name="files[]" accept="image/*" onchange="getFileData(this);">
												</span>
												<button type="submit" class="btn btn-inverse start" style="display: none;" id="btnSubmitUploadFile">
													<i class="fa fa-arrow-circle-o-up"></i>
													<span>Télécharger</span>
												</button>
												<button type="reset" class="btn btn-inverse cancel"  style="display: none;" id="btnCancelUploadFile" onclick="return hideUpload()">
													<i class="fa fa-ban"></i>
													<span>Annuler</span>
												</button>
                                            </div> <!-- The global progress information -->
                                            <div class="col-md-12" style="text-align: center; margin-bottom: 20px;">
                                                <div>File Name : <span id="uploadFileName"></span></div>
                                                <br/>
                                            <div class="form-group" id="div_description_image" style="display: none;">
                                                <div class="col-sm-3">
                                                </div>
                                                <label class="col-sm-3 control-label">
                                                    Description d'image</label>
                                                <div class="col-sm-3">
                                                    <input type="text" class="form-control" id="inp_description_image" name="inp_description_image" placeholder="Description d'image" onkeyup="resetUploadFileFormAction(this)" maxlength="200">
                                                </div>
                                                <div class="col-sm-3"></div>
                                            </div>
                                            </div>
											</div>
                                                <div class="col-md-12" style="text-align: center;">
                                                    <button type="button" class="btn btn-inverse " id="btnUpdateAlbum" onclick="return UpdateAlbum(this)"><span id="spanAlbumName2Modify">Mettre à jour</span></button>
                                                    <button type="button" class="btn btn-inverse " id="btnDeleteAlbum" onclick="return DeleteAlbumClick(this)"><span>Supprimer cet album</span></button>
                                                </div>
                                            

                                                </form>
                                        </div>
                                        <div class="row" id="div_images_in_album">
                                        </div>
                                    </div>
                                </div>
                                <!-- /BOX -->
                            </div>
                        </div>
                    </div>
                    <!-- SAMPLE -->
                    <div class="row">
                    </div>
                    <!-- /SAMPLE -->
                </div>
            </div>
                <!-- /FORMS -->
                <div class="separator">
                </div>
                <!-- SAMPLE -->
                <div class="row">
                </div>
                <!-- /SAMPLE -->
                <div class="footer-tools">
                    <span class="go-top"><i class="fa fa-chevron-up"></i>Top </span>
                </div>
        </div>
            </div>
        </div>
    
        <div class="clear">
        </div>
        <div class="footer">
        </div>
        <div class="loading-mask" id="loading_mask" style="display: none;">
            <p id="message_loading_mask" style="margin-left: auto; margin-right: auto; text-align: center;
                                                                                                                                                                                                                                                                                  margin-top: 23%; color: red; font-size: 22pt; background-color: white; padding-top: 10px;
                                                                                                                                                                                                                                                                                  padding-bottom: 10px;">
                Veuillez patienter...</p>
            <p id="message_loading_animation" class="message_loading_animation">
            </p>
        </div>
</section>
    <!-- JAVASCRIPTS -->
    <!-- Placed at the end of the document so the pages load faster -->
    <!-- JQUERY -->
    <script type="text/javascript" src="../../js/isotope/jquery.isotope.min.js"></script>
    <script type="text/javascript" src="../../js/isotope/imagesloaded.pkgd.min.js"></script>
    <!-- COLORBOX -->
    <script type="text/javascript" src="../../js/colorbox/jquery.colorbox.min.js"></script>
    <!-- COOKIE -->
    <script type="text/javascript" src="../../js/jQuery-Cookie/jquery.cookie.min.js"></script>
    <!-- CUSTOM SCRIPT -->
    <script src="../../js/script.js"></script>
    <!-- /JAVASCRIPTS -->
    <%--  <script>
        jQuery(document).ready(function () {
            App.setPage("gallery");  //Set current page
            App.init(); //Initialise plugins and elements
        });
    </script>--%>
    <script>
        $(document).ready(setLeftMenu);

        function setLeftMenu() {
            var url = window.location.href.split('?')[0];
            var paras = url.split('/');
            var pagename = paras[paras.length - 1].toLowerCase();
            try {
                // remove all class

                switch (pagename) {
                    case 'album.aspx': // ok
                        {
                            $('#li_album').addClass('active');
                            $('#li_album_album').addClass('current');
                        }
                        break;
                    default:
                }
            } catch (e) {

            }
        }

        function GetMessage2Treate() {
            try {

                $.ajax({
                    type: "POST",
                    url: '../../Services/ETServices.asmx/GetAllTaskToTreat',
                    contentType: "application/json; charset=utf-8",
                    dataType: "json",
                    success: function (data) {
                        var allmsg = data.d;
                        var messages = jQuery.parseJSON(allmsg);

                        $('#ul_task').empty();

                        var messagecount = messages.length;
                        var oldmsgcount = $('.badge').text();

                        var oldcount = oldmsgcount * 1;
                        if (messagecount != oldcount) {
                            shake($('.badge'), "flashRed", 5);
                        }
                        $('.badge').text(messagecount);
                        var taskcount = messagecount + " tâche" + (messagecount > 1 ? "s" : "") + " en cours";
                        var task_title = "<li class='dropdown-title'><span><i class='fa fa-check'></i><span id='task_count_title'>" + taskcount + "</span></span> </li>";
                        $('#ul_task').append(task_title);

                        var classnames = ['progress-bar-success', 'progress-bar-info', 'progress-bar-warning', 'progress-bar-danger'];

                        $.each(messages, function (order, aMsg) {

                            var classnmb = Math.floor(Math.random() * 4) + 1;

                            var oneclass = classnames[classnmb];
                            var msgtype = aMsg.Value4;
                            var urllink = getMsgUrl(aMsg.Value3) + "" + aMsg.Key;
                            var message = aMsg.Value3 + "-" + aMsg.Value;
                            var content = "<li class='li_for_message' msgtype='" + msgtype + "'>" +
                                "<a href='" + urllink + "' target='_self'>" +
                                "<span class='header clearfix'>" +
                                "<span class='pull-left'>" + message + "</span>" +
                                "<span class='pull-right'>0%</span>" +
                                "</span> <div class='progress progress-striped active'>" +
                                "<div class='progress-bar " + oneclass + "' role='progressbar' aria-valuenow='50' aria-valuemin='50' aria-valuemax='100' style='width: 50%;'>" +
                                "<span class='sr-only'>50% Complete</span> </div> </div> </a></li>";
                            $('#ul_task').append(content);
                        });
                    },
                    error: function (data) {
                        var test = '';
                    }
                });

            } catch (e) {

            }
        }

        function getMsgUrl(msgtype) {
            var url = "";
            switch (msgtype) {
                case "pin":
                    url = "../../Views/PreInscription/PreInscription.aspx?pin_id=";
                    break;
                case "msg":
                    url = "../../Views/Message/Message.aspx?msg_id=";
                    break;
                default:
                    break;
            }
            return url;
        }

        function shake(element, className, times) {
            var i = 0,
                t = false,
                o = element.attr("class"),
                c = "",
                timestimes = times || 2;

            if (t) return;

            t = setInterval(function () {
                i++;
                c = i % 2 ? o + ' ' + className : o;
                element.attr("class", c);

                if (i == 2 * times) {
                    clearInterval(t);
                    element.removeClass(className);
                }
            }, 200);
        };

        //    $(function () {
        //        shake($('.badge'), "flashRed", 10);
        //    });
    </script>
    <script>
        function getFileData(myFile) {
            var file = myFile.files[0];
            var filename = file.name;
            if (filename) {
                $('#btnSubmitUploadFile').show();
                $('#btnCancelUploadFile').show();
                $('#div_description_image').show();
            } else {
                $('#btnSubmitUploadFile').hide();
                $('#btnCancelUploadFile').hide();
                $('#div_description_image').hide();
            }
            $('#uploadFileName').text(filename);
            //alert(filename);
        }
        function hideUpload() {
            $('#btnSubmitUploadFile').hide();
            $('#btnCancelUploadFile').hide();
            $('#div_description_image').hide();
            $('#uploadFileName').text('');
            return false;
        }

        function getFileDataPopUp(myFile) {
            var file = myFile.files[0];
            var filename = file.name;
            if (filename) {
                $('#btnSubmitUploadFilePopUp').show();
                $('#btnCancelUploadFilePopUp').show();
                $('#div_description_imagePopUp').show();
            } else {
                $('#btnSubmitUploadFilePopUp').hide();
                $('#btnCancelUploadFilePopUp').hide();
                $('#div_description_imagePopUp').hide();
            }
            $('#uploadFileNamePopUp').text(filename);
            //alert(filename);
        }
        function hideUploadPopUp() {
            $('#btnSubmitUploadFilePopUp').hide();
            $('#btnCancelUploadFilePopUp').hide();
            $('#div_description_imagePopUp').hide();
            $('#uploadFileNamePopUp').text('');
            return false;
        }
    </script>
    <style>
        *
        {
            margin: 0;
            padding: 0;
        }
        
        .flashRed
        {
            color: #d9534f;
        }
    </style>
    <%--</asp:Content>--%>
</body>
</html>
