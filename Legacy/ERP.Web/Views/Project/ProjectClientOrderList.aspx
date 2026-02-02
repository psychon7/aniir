<%@ Page Title="" Language="C#" MasterPageFile="~/Site.Master" AutoEventWireup="true"
    CodeBehind="ProjectClientOrderList.aspx.cs" Inherits="ERP.Web.Views.Project.ProjectClientOrderList" %>
<%@ Import Namespace="System.Web.Configuration" %>

<asp:Content ID="Content1" ContentPlaceHolderID="HeadContent" runat="server">
    <title>ERP - Liste de Commande pour cet affaire</title>
    <link href="../../css/site.css" rel="stylesheet" type="text/css" />
    <!-- JQUERY UI DATE PICKER -->
    <link rel="stylesheet" type="text/css" href="../../js/jquery-ui-1.10.3.custom/css/custom-theme/jquery-ui-1.10.3.custom.min.css" />
    <!-- End JQUERY UI DATE PICKER -->
</asp:Content>
<asp:Content ID="Content2" ContentPlaceHolderID="MainContent" runat="server">
    <script>
        jQuery(document).ready(function () {
            App.setPage("index");  //Set current page
            App.init(); //Initialise plugins and elements
        });
    </script>
    <script src="../../js/ERP/ERPBaseJS.js?V=<%= WebConfigurationManager.AppSettings["jsVersion"] %>"
        type="text/javascript"></script>
    <script src="../../js/ERP/CommonJS.js?V=<%= WebConfigurationManager.AppSettings["jsVersion"] %>"
        type="text/javascript"></script>
    <script src="../../js/ERP/Project/ProjectBaseJS.js?V=<%= WebConfigurationManager.AppSettings["jsVersion"] %>"
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
                                <li><i class="fa fa-home"></i><a href="../../Default.aspx">&nbsp;Home</a> </li>
                                <li><a href="SearchProject.aspx">&nbsp;Rechercher une Affaire</a> </li>
                                <li><a onclick="goBack2Project()" class="a_pointer">&nbsp;Affaire</a></li>
                                <li class="prjMenu a_pointer"><a onclick="goCostPlanList()" class="a_pointer">&nbsp;Liste
                                    de Devis</a></li>
                                <li class="prjMenu">&nbsp;Liste de Commande</li>
                                <li class="prjMenu a_pointer"><a onclick="goCinList()">&nbsp;Liste de Facutre</a> </li>
                            </ul>
                            <!-- /BREADCRUMBS -->
                            <div class="clearfix">
                                <h3 class="content-title pull-left">
                                    &nbsp;Les Commande de cet affaire</h3>
                            </div>
                            <div class="description">
                                Tous les Commande Client</div>
                        </div>
                    </div>
                </div>
                <div class="row">
                    <div class="col-md-12">
                        <div class="row">
                            <div class="col-md-12">
                                <div class="box border inverse">
                                    <div class="box-title">
                                        <h4>
                                            <i class="fa fa-bars"></i>Liste de Commande</h4>
                                        <span style="float: right" id="result_count"></span>
                                    </div>
                                    <div class="box-body">
                                        <div class="form-horizontal center" id="div_cost_plan" style="width: 100%; overflow-x: auto;">
                                            <table cellpadding="0" cellspacing="0" border="0" class="table table-striped table-bordered table-hover">
                                                <thead id="thead_cost_plan">
                                                    <tr role="row">
                                                        <th rowspan="1" colspan="1">
                                                            Nom de la Commande
                                                        </th>
                                                        <th rowspan="1" colspan="1">
                                                            Code de la Commande
                                                        </th>
                                                        <th rowspan="1" colspan="1">
                                                            Montant HT
                                                        </th>
                                                        <th rowspan="1" colspan="1">
                                                            Date de création
                                                        </th>
                                                    </tr>
                                                </thead>
                                                <tbody id="tbody_cost_plan" style="text-align: center !important">
                                                </tbody>
                                                <tfoot>
                                                    <tr role="row">
                                                        <th rowspan="1" colspan="1">
                                                            Nom de la Commande
                                                        </th>
                                                        <th rowspan="1" colspan="1">
                                                            Code de la Commande
                                                        </th>
                                                        <th rowspan="1" colspan="1">
                                                            Montant HT
                                                        </th>
                                                        <th rowspan="1" colspan="1">
                                                            Date de création
                                                        </th>
                                                    </tr>
                                                </tfoot>
                                            </table>
                                        </div>
                                    </div>
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
        </div>
    </div>
    <script type="text/javascript" src="../../js/jQuery-BlockUI/jquery.blockUI.min.js"></script>
    <script type="text/javascript" src="../../js/datatables/extras/TableTools/media/js/ZeroClipboard.min.js"></script>
    <script type="text/javascript" src="../../js/jQuery-Cookie/jquery.cookie.min.js"></script>
    <script src="../../js/bootbox/bootbox.min.js" type="text/javascript"></script>
    <!-- DATE PICKER -->
    <script type="text/javascript" src="../../js/datepicker/picker.js"></script>
    <script type="text/javascript" src="../../js/datepicker/picker.date.js"></script>
    <script type="text/javascript" src="../../js/datepicker/picker.time.js"></script>
    <!-- End DATE PICKER -->
</asp:Content>
