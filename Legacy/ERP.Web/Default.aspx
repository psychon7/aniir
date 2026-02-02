<%@ Page Title="Home Page" Language="C#" MasterPageFile="~/Site.master" AutoEventWireup="true"
    CodeBehind="Default.aspx.cs" Inherits="ERP.Web._Default" %>

<%@ OutputCache Duration="100" VaryByParam="none" %>
<%@ Import Namespace="System.Web.Configuration" %>
<asp:Content ID="HeaderContent" runat="server" ContentPlaceHolderID="HeadContent">
    <title>ERP - DASHBOARD</title>
    <link rel="stylesheet" type="text/css" href="js/jquery-ui-1.10.3.custom/css/custom-theme/jquery-ui-1.10.3.custom.min.css" />
    <!-- DATA TABLES -->
    <link rel="stylesheet" type="text/css" href="js/datatables/media/assets/css/datatables.min.css" />
    <link rel="stylesheet" type="text/css" href="js/datatables/extras/TableTools/media/css/TableTools.min.css" />
    <link rel="stylesheet" type="text/css" href="js/datatables/media/css/jquery.dataTables.min.css" />
    <link href="css/site.css" rel="stylesheet" type="text/css" />
    <style>
        th
        {
            text-align: center !important;
        }
    </style>
</asp:Content>
<asp:Content ID="BodyContent" runat="server" ContentPlaceHolderID="MainContent">
    <script>
        jQuery(document).ready(function () {
            App.setPage("index");  //Set current page
            App.init(); //Initialise plugins and elements
        });
    </script>
    <script src="js/ERP/ERPBaseJS.js?V=<%= WebConfigurationManager.AppSettings["jsVersion"] %>"
        type="text/javascript"></script>
    <script src="js/ERP/CommonJS.js?V=<%= WebConfigurationManager.AppSettings["jsVersion"] %>"
        type="text/javascript"></script>
    <%--    <script src="js/ERP/HomePage.js?" type="text/javascript"></script>--%>
    <script src="js/ERP/HomePage.js?V=<%= WebConfigurationManager.AppSettings["jsVersion"] %>"
        type="text/javascript"></script>
    <div class="container">
        <div class="row">
            <div id="content" class="col-lg-12">
                <div class="row">
                    <div class="col-sm-12">
                        <div class="page-header">
                            <!-- STYLER -->
                            <!-- /STYLER -->
                            <!-- BREADCRUMBS -->
                            <ul class="breadcrumb">
                                <li><i class="fa fa-home"></i><a href="Default.aspx">&nbsp;Home</a> </li>
                            </ul>
                            <!-- /BREADCRUMBS -->
                            <div class="clearfix">
                                <h3 class="content-title pull-left">
                                    Tableau de bord</h3>
                            </div>
                            <div class="description">
                                Informations généraux</div>
                        </div>
                    </div>
                </div>
                <div class="row">
                    <div class="col-md-12">
                        <div class="row">
                            <div class="col-md-12">
                                <!-- BOX -->
                                <div class="box border inverse">
                                    <div class="box-title">
                                        <h4>
                                            <i class="fa fa-envelope-o"></i>Devis en cours (mois en cours et mois précedent)
                                        </h4>
                                        <div class="tools">
                                            <a href="javascript:;" class="collapse"><span style="float: right" id="result_costplan_inprogress">
                                            </span>&nbsp;<i class="fa fa-chevron-up"></i>&nbsp;</a>
                                        </div>
                                    </div>
                                    <div class="box-body center" id="div2">
                                        <button type="button" class="btn btn-inverse" id="btn_modify_costplan" onclick="return modifyCostPlanClick();"
                                            style="display: none;">
                                            Modifier le statut</button>
                                    </div>
                                    <div class="box-body center" id="div_costplan_inprogress" style="width: 100%; overflow-x: auto;">
                                        <button type="button" class="btn btn-inverse start" onclick="return getCplInProgressClick();">
                                            Consulter les devis en cours</button>
                                    </div>
                                </div>
                                <!-- /BOX -->
                            </div>
                        </div>
                        <div class="row">
                            <div class="col-md-6">
                                <!-- BOX -->
                                <div class="box border inverse">
                                    <div class="box-title">
                                        <h4>
                                            <i class="fa fa-truck"></i>Fonction Reliquat
                                        </h4>
                                        <div class="tools">
                                            <a href="javascript:;" class="collapse"><span style="float: right" id="result_codnotalldlv">
                                            </span>&nbsp;<i class="fa fa-chevron-up"></i>&nbsp;</a>
                                        </div>
                                    </div>
                                    <div class="box-body center" id="div_codnotalldlv" style="width: 100%; overflow-x: auto;">
                                        <button type="button" class="btn btn-inverse start" onclick="return getCodNotAllDeliveried();">
                                            Consulter</button>
                                    </div>
                                </div>
                                <!-- /BOX -->
                            </div>
                            <div class="col-md-3">
                                <!-- BOX -->
                                <div class="box border inverse">
                                    <div class="box-title">
                                        <h4>
                                            <i class="fa fa-truck"></i>Bon de livraison à livrer
                                        </h4>
                                        <div class="tools">
                                            <a href="javascript:;" class="collapse"><span style="float: right" id="result_dfo2delivery">
                                            </span>&nbsp;<i class="fa fa-chevron-up"></i>&nbsp;</a>
                                        </div>
                                    </div>
                                    <div class="box-body center" id="div_dfo2delivery" style="width: 100%; overflow-x: auto;">
                                        <button type="button" class="btn btn-inverse start" onclick="return getDfo2Delivery();">
                                            Consulter</button>
                                    </div>
                                </div>
                                <!-- /BOX -->
                            </div>
                            <div class="col-md-3">
                                <!-- BOX -->
                                <div class="box border inverse">
                                    <div class="box-title">
                                        <h4>
                                            <i class="fa fa-truck"></i>Bon de livraison à facturer
                                        </h4>
                                        <div class="tools">
                                            <a href="javascript:;" class="collapse"><span style="float: right" id="result_dfonoinvoice">
                                            </span>&nbsp;<i class="fa fa-chevron-up"></i>&nbsp;</a>
                                        </div>
                                    </div>
                                    <div class="box-body center" id="div_dfonoinvoice" style="width: 100%; overflow-x: auto;">
                                        <button type="button" class="btn btn-inverse start" onclick="return getDfoNoInvoice();">
                                            Consulter</button>
                                    </div>
                                </div>
                                <!-- /BOX -->
                            </div>
                        </div>
                        <div class="row">
                            <div class="col-md-3">
                                <!-- BOX -->
                                <div class="box border inverse">
                                    <div class="box-title">
                                        <h4>
                                            <i class="fa fa-euro"></i>Facture client non payée
                                        </h4>
                                        <div class="tools">
                                            <a href="javascript:;" class="collapse"><span style="float: right" id="res_cin_no_paid">
                                            </span>&nbsp;<i class="fa fa-chevron-up"></i>&nbsp;</a>
                                        </div>
                                    </div>
                                    <div class="box-body center" id="div_cin_no_paid" style="width: 100%; overflow-x: auto;">
                                        <button type="button" class="btn btn-inverse start" onclick="return getCinNoPaid();">
                                            Consulter</button>
                                    </div>
                                </div>
                                <!-- /BOX -->
                            </div>
                            <div class="col-md-3">
                                <!-- BOX -->
                                <div class="box border inverse">
                                    <div class="box-title">
                                        <h4>
                                            <i class="fa fa-dollar"></i>PI non payée
                                        </h4>
                                        <div class="tools">
                                            <a href="javascript:;" class="collapse"><span style="float: right" id="res_sin_no_paid">
                                            </span>&nbsp;<i class="fa fa-chevron-up"></i>&nbsp;</a>
                                        </div>
                                    </div>
                                    <div class="box-body center" id="div_sin_no_paid" style="width: 100%; overflow-x: auto;">
                                        <button type="button" class="btn btn-inverse start" onclick="return getSinNoPaid();">
                                            Consulter</button>
                                    </div>
                                </div>
                                <!-- /BOX -->
                            </div>
                            <div class="col-md-3">
                                <!-- BOX -->
                                <div class="box border inverse">
                                    <div class="box-title">
                                        <h4>
                                            <i class="fa fa-truck"></i>Container non expédié
                                        </h4>
                                        <div class="tools">
                                            <a href="javascript:;" class="collapse"><span style="float: right" id="res_lgs_no_sent">
                                            </span>&nbsp;<i class="fa fa-chevron-up"></i>&nbsp;</a>
                                        </div>
                                    </div>
                                    <div class="box-body center" id="div_lgs_no_sent" style="width: 100%; overflow-x: auto;">
                                        <button type="button" class="btn btn-inverse start" onclick="return getLgsNoSent();">
                                            Consulter</button>
                                    </div>
                                </div>
                                <!-- /BOX -->
                            </div>
                            <div class="col-md-3">
                                <!-- BOX -->
                                <div class="box border inverse">
                                    <div class="box-title">
                                        <h4>
                                            <i class="fa fa-truck"></i>Container arrivant
                                        </h4>
                                        <div class="tools">
                                            <a href="javascript:;" class="collapse"><span style="float: right" id="res_lgs_arriving">
                                            </span>&nbsp;<i class="fa fa-chevron-up"></i>&nbsp;</a>
                                        </div>
                                    </div>
                                    <div class="box-body center" id="div_lgs_arriving" style="width: 100%; overflow-x: auto;">
                                        <button type="button" class="btn btn-inverse start" onclick="return getLgsArriving();">
                                            Consulter</button>
                                    </div>
                                </div>
                                <!-- /BOX -->
                            </div>
                        </div>
                        <div class="row">
                        </div>
                    </div>
                </div>
            </div>
            <div class="footer-tools">
                <span class="go-top"><i class="fa fa-chevron-up"></i>Top </span>
            </div>
        </div>
        <!-- /CONTENT-->
    </div>
    <script type="text/javascript" src="js/jQuery-BlockUI/jquery.blockUI.min.js"></script>
    <!-- DATA TABLES -->
    <script type="text/javascript" src="js/datatables/media/js/jquery.dataTables.min.js?V=<%= WebConfigurationManager.AppSettings["jsVersion"] %> "></script>
    <script type="text/javascript" src="js/datatables/media/assets/js/datatables.min.js?V=<%= WebConfigurationManager.AppSettings["jsVersion"] %>"></script>
    <script type="text/javascript" src="js/datatables/extras/TableTools/media/js/TableTools.min.js"></script>
    <script type="text/javascript" src="js/datatables/extras/TableTools/media/js/ZeroClipboard.min.js"></script>
    <script type="text/javascript" src="js/jQuery-Cookie/jquery.cookie.min.js"></script>
    <script src="js/bootbox/bootbox.min.js" type="text/javascript"></script>
</asp:Content>
