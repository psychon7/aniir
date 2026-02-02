<%@ Page Title="" Language="C#" MasterPageFile="~/Site.Master" AutoEventWireup="true"
    CodeBehind="Shelves.aspx.cs" Inherits="ERP.Web.Views.Warehouse.Shelves" %>
<%@ Import Namespace="System.Web.Configuration" %>

<asp:Content ID="Content1" ContentPlaceHolderID="HeadContent" runat="server">
    <title>Entrepôt - Étagères</title>
    <!-- JQUERY UI DATE PICKER -->
    <link rel="stylesheet" type="text/css" href="../../js/jquery-ui-1.10.3.custom/css/custom-theme/jquery-ui-1.10.3.custom.min.css" />
    <!-- End JQUERY UI DATE PICKER -->
    <!-- DATA TABLES -->
    <link rel="stylesheet" type="text/css" href="../../js/datatables/media/css/jquery.dataTables.min.css" />
    <link rel="stylesheet" type="text/css" href="../../js/datatables/media/assets/css/datatables.min.css" />
    <link rel="stylesheet" type="text/css" href="../../js/datatables/extras/TableTools/media/css/TableTools.min.css" />
    <link href="../../css/site.css" rel="stylesheet" type="text/css" />
    <style>
        table
        {
            width: 100% !important;
        }
        th
        {
            text-align: center !important;
        }
        .tr_title
        {
            text-align: center !important;
        }
        .td_right
        {
            text-align: right;
        }
        .td_center
        {
            text-align: center;
        }
        .span_highlight
        {
            color: red;
        }
    </style>
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
    <script src="../../js/ERP/Warehouse/ShelvesJS.js?V=<%= WebConfigurationManager.AppSettings["jsVersion"] %>"
        type="text/javascript"></script>
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
                                <li><i class="fa fa-home"></i><a href="../../Default.aspx">&nbsp;Home</a> </li>
                                <li><a href="#">Entrepôts</a> </li>
                            </ul>
                            <!-- /BREADCRUMBS -->
                            <div class="clearfix">
                                <h3 class="content-title pull-left">
                                    Étagères</h3>
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
                                <!-- BOX -->
                                <div class="box border inverse">
                                    <div class="box-title">
                                        <h4>
                                            <i class="fa fa-bars"></i>Information d'Entrepôts
                                        </h4>
                                        <span style="float: right" id="rst_pins"></span>
                                    </div>
                                    <div class="box-body">
                                        <div class="form-horizontal">
                                            <div class="form-group">
                                                <label class="col-sm-2 control-label">
                                                    Entrepôt</label>
                                                <div class="col-sm-4">
                                                    <select class="form-control" id="WhsId" onchange="whs_change(this)">
                                                    </select>
                                                </div>
                                                <label class="col-sm-2 control-label">
                                                    Code d'entrepôt</label>
                                                <div class="col-sm-4">
                                                    <input id="WhsCode" class="form-control" disabled="" />
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <label class="col-sm-2 control-label">
                                                    Adresse 1</label>
                                                <div class="col-sm-4">
                                                    <input id="WhsAddress1" class="form-control" disabled="" />
                                                </div>
                                                <label class="col-sm-2 control-label">
                                                    Adresse 2</label>
                                                <div class="col-sm-4">
                                                    <input id="WhsAddress2" class="form-control" disabled="" />
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <label class="col-sm-2 control-label">
                                                    Code postal</label>
                                                <div class="col-sm-4">
                                                    <input id="WhsPostCode" class="form-control" disabled="" />
                                                </div>
                                                <label class="col-sm-2 control-label">
                                                    Ville</label>
                                                <div class="col-sm-4">
                                                    <input id="WhsCity" class="form-control" disabled="" />
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <label class="col-sm-2 control-label">
                                                    Pays</label>
                                                <div class="col-sm-4">
                                                    <input id="WhsCountry" class="form-control" disabled="" />
                                                </div>
                                                <label class="col-sm-2 control-label">
                                                    Volume (m<sup>3</sup>)</label>
                                                <div class="col-sm-4">
                                                    <input id="WhsVolume" class="form-control" disabled="" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <!-- /BOX -->
                                <div class="row">
                                    <div class="col-md-8">
                                        <div class="box border inverse">
                                            <div class="box-title">
                                                <h4>
                                                    <i class="fa fa-bars"></i>Étagères</h4>
                                            </div>
                                            <div class="box-body">
                                                <div class="form-horizontal">
                                                    <div class="row" style="margin-bottom: 20px;">
                                                        <div class="col-md-4">
                                                        </div>
                                                        <div class="col-md-4" style="text-align: center;">
                                                            <button type="button" class="btn btn-inverse forview" onclick="return UpdateShelve(0)">
                                                                Ajouter un étagère</button>
                                                        </div>
                                                        <div class="col-md-4">
                                                        </div>
                                                    </div>
                                                    <div class="box-body">
                                                        <div class="row">
                                                            <div class="form-horizontal" id="div_shelves" style="max-height: 600px; overflow-y: auto;">
                                                                <table cellpadding="0" cellspacing="0" border="0" class="table table-striped table-bordered table-hover ">
                                                                    <thead>
                                                                        <tr class="tr_title">
                                                                            <td>
                                                                                Code
                                                                            </td>
                                                                            <td>
                                                                                Étage
                                                                            </td>
                                                                            <td>
                                                                                Ligne
                                                                            </td>
                                                                            <td>
                                                                                Rangée
                                                                            </td>
                                                                            <td>
                                                                                Longueur(m)
                                                                            </td>
                                                                            <td>
                                                                                Largeur(m)
                                                                            </td>
                                                                            <td>
                                                                                Hauteur(m)
                                                                            </td>
                                                                            <td>
                                                                                Volume(m<sup>3</sup>)
                                                                            </td>
                                                                            <td>
                                                                                Somme
                                                                            </td>
                                                                            <td>
                                                                            </td>
                                                                        </tr>
                                                                    </thead>
                                                                    <tbody id="tb_shelves">
                                                                    </tbody>
                                                                    <tfoot>
                                                                        <tr class="tr_title">
                                                                            <td>
                                                                                Code
                                                                            </td>
                                                                            <td>
                                                                                Étage
                                                                            </td>
                                                                            <td>
                                                                                Ligne
                                                                            </td>
                                                                            <td>
                                                                                Rangée
                                                                            </td>
                                                                            <td>
                                                                                Longueur(m)
                                                                            </td>
                                                                            <td>
                                                                                Largeur(m)
                                                                            </td>
                                                                            <td>
                                                                                Hauteur(m)
                                                                            </td>
                                                                            <td>
                                                                                Volume(m<sup>3</sup>)
                                                                            </td>
                                                                            <td>
                                                                                Somme
                                                                            </td>
                                                                            <td>
                                                                            </td>
                                                                        </tr>
                                                                    </tfoot>
                                                                </table>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="col-md-4">
                                        <div class="box border inverse">
                                            <div class="box-title">
                                                <h4>
                                                    <i class="fa fa-bars"></i>Les Produits sur cet étagère</h4>
                                            </div>
                                            <div class="box-body">
                                                <div class="form-horizontal">
                                                    <div class="row" style="margin-bottom: 20px;">
                                                        <div class="col-md-12 center">
                                                            <span id="span_shevel_title" class="span_highlight"></span>
                                                        </div>
                                                    </div>
                                                    <div class="row" id="div_she_prds" style="max-height: 600px; overflow-y: auto;">
                                                        <table cellpadding="0" cellspacing="0" border="0" class="table table-striped table-bordered table-hover ">
                                                            <thead>
                                                                <tr class="tr_title">
                                                                    <td>
                                                                        Nom du prd.
                                                                    </td>
                                                                    <td>
                                                                        Ref. du prd.
                                                                    </td>
                                                                    <td>
                                                                        Tous les stocks
                                                                    </td>
                                                                    <td>
                                                                        Stocks ici
                                                                    </td>
                                                                </tr>
                                                            </thead>
                                                            <tbody id="tb_she_prds">
                                                            </tbody>
                                                            <tfoot>
                                                                <tr class="tr_title">
                                                                    <td>
                                                                        Nom du prd.
                                                                    </td>
                                                                    <td>
                                                                        Ref. du prd.
                                                                    </td>
                                                                    <td>
                                                                        Tous les stocks
                                                                    </td>
                                                                    <td>
                                                                        Stocks ici
                                                                    </td>
                                                                </tr>
                                                            </tfoot>
                                                        </table>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
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
    <!-- DATA TABLES -->
    <script type="text/javascript" src="../../js/datatables/media/js/jquery.dataTables.min.js?V=<%= WebConfigurationManager.AppSettings["jsVersion"] %>"></script>
    <script type="text/javascript" src="../../js/datatables/media/assets/js/datatables.min.js?V=<%= WebConfigurationManager.AppSettings["jsVersion"] %>"></script>
    <script type="text/javascript" src="../../js/datatables/extras/TableTools/media/js/TableTools.min.js"></script>
    <script type="text/javascript" src="../../js/datatables/extras/TableTools/media/js/ZeroClipboard.min.js"></script>
    <script type="text/javascript" src="../../js/jQuery-Cookie/jquery.cookie.min.js"></script>
    <script src="../../js/bootbox/bootbox.min.js" type="text/javascript"></script>
    <!-- DATE PICKER -->
    <script type="text/javascript" src="../../js/datepicker/picker.js"></script>
    <script type="text/javascript" src="../../js/datepicker/picker.date.js"></script>
    <script type="text/javascript" src="../../js/datepicker/picker.time.js"></script>
    <!-- End DATE PICKER -->
</asp:Content>
