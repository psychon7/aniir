<%@ Page Title="" Language="C#" MasterPageFile="~/Site.Master" AutoEventWireup="true"
    CodeBehind="ProductInventory.aspx.cs" Inherits="ERP.Web.Views.Warehouse.ProductInventory" %>
<%@ Import Namespace="System.Web.Configuration" %>

<asp:Content ID="Content1" ContentPlaceHolderID="HeadContent" runat="server">
    <title>Entrepôt - Inventaire de produit</title>
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
        .ui-autocomplete
        {
            z-index: 9999 !important;
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
    <script src="../../js/ERP/Warehouse/ProductInventoryJS.js?V=<%= WebConfigurationManager.AppSettings["jsVersion"] %>"
        type="text/javascript"></script>
    <!-- hidden fileds -->
    <label style="display: none;" id="hf_prd_id">
    </label>
    <label style="display: none;" id="hf_pit_id">
    </label>
    <!-- /hidden fileds -->
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
                                    Inventaire de produit</h3>
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
                                <div class="row">
                                    <div class="col-md-7">
                                        <div class="box border inverse">
                                            <div class="box-title">
                                                <h4>
                                                    <i class="fa fa-bars"></i>L'inventaire de produit</h4>
                                                <span style="float: right" id="result_count"></span>
                                            </div>
                                            <div class="box-body">
                                                <div class="form-horizontal">
                                                    <div class="row">
                                                            <label class="col-sm-3 control-label">
                                                                Type du produit</label>
                                                            <div class="col-sm-3">
                                                                <select class="form-control" id="PtyId" name="PtyId" onchange="prdSearchPtyChange(this)">
                                                                </select>
                                                            </div>
                                                            <label class="col-sm-3 control-label">
                                                                Famille / Référence / Nom</label>
                                                            <div class="col-sm-3">
                                                                <input type="text" class="form-control" id="PrdInfo" name="PrdInfo" placeholder="Information du product" />
                                                            </div>
                                                            <label class="col-sm-3 control-label">
                                                                Produit avec le stockage</label>
                                                            <div class="col-sm-3">
                                                                <input type="checkbox" class="form-control" id="prdwithInv" name="prdwithInv" checked="checked"/>
                                                            </div>
                                                            <div class="col-sm-6 center">
                                                                <button type="button" class="btn btn-inverse start" onclick="return searchprd()">
                                                                    Rechercher</button>
                                                            </div>
                                                    </div>
                                                    <div class="row" style="margin-bottom: 20px;">
                                                        <div class="col-md-4">
                                                        </div>
                                                        <div class="col-md-4" style="text-align: center;">
                                                            <button type="button" class="btn btn-inverse forview" onclick="return AddProduct2Inventory()">
                                                                Ajouter un produit</button>
                                                        </div>
                                                        <div class="col-md-4">
                                                        </div>
                                                    </div>
                                                    <div class="box-body">
                                                        <div class="row">
                                                            <div class="form-horizontal" id="div_shelves" style="max-height: 600px; overflow-y: auto;">
                                                                <table cellpadding="0" cellspacing="0" border="0" id="datatable_search_result" class="table table-striped table-bordered table-hover ">
                                                                    <thead>
                                                                        <tr class="tr_title">
                                                                            <td>
                                                                                Type
                                                                            </td>
                                                                            <td>
                                                                                Famille
                                                                            </td>
                                                                            <td>
                                                                                Nom
                                                                            </td>
                                                                            <td>
                                                                                Réf.
                                                                            </td>
                                                                            <td>
                                                                                Description
                                                                            </td>
                                                                            <td>
                                                                                Inventaire
                                                                            </td>
                                                                            <td>
                                                                            </td>
                                                                        </tr>
                                                                    </thead>
                                                                    <tbody id="tb_pit_inv">
                                                                    </tbody>
                                                                    <tfoot>
                                                                        <tr class="tr_title">
                                                                            <td>
                                                                                Type
                                                                            </td>
                                                                            <td>
                                                                                Famille
                                                                            </td>
                                                                            <td>
                                                                                Nom
                                                                            </td>
                                                                            <td>
                                                                                Réf.
                                                                            </td>
                                                                            <td>
                                                                                Description
                                                                            </td>
                                                                            <td>
                                                                                Inventaire
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
                                    <div class="col-md-5">
                                        <div class="box border inverse">
                                            <div class="box-title">
                                                <h4>
                                                    <i class="fa fa-bars"></i>Les Produits sur cet étagère</h4>
                                            </div>
                                            <div class="box-body">
                                                <div class="form-horizontal">
                                                    <div class="row" style="margin-bottom: 20px;">
                                                        <div class="col-md-12 center">
                                                            <span id="span_prd_title" class="span_highlight"></span>
                                                            <button id="btn_update_psh_direct" class="btn btn-inverse" style="display: none;">
                                                                <i class="fa fa-refresh"></i>
                                                            </button>
                                                        </div>
                                                    </div>
                                                    <div class="row" id="div_she_prds" style="max-height: 600px; overflow-x: auto;">
                                                        <table cellpadding="0" cellspacing="0" border="0" class="table table-striped table-bordered table-hover ">
                                                            <thead>
                                                                <tr class="tr_title">
                                                                    <td>
                                                                        Entrepôt
                                                                    </td>
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
                                                                        Lon.(m)
                                                                    </td>
                                                                    <td>
                                                                        Lar.(m)
                                                                    </td>
                                                                    <td>
                                                                        Hau.(m)
                                                                    </td>
                                                                    <td>
                                                                        Vol.(m<sup>3</sup>)
                                                                    </td>
                                                                    <td>
                                                                        Inventaire
                                                                    </td>
                                                                </tr>
                                                            </thead>
                                                            <tbody id="tb_prd_she">
                                                            </tbody>
                                                            <tfoot>
                                                                <tr class="tr_title">
                                                                    <td>
                                                                        Entrepôt
                                                                    </td>
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
                                                                        Lon.(m)
                                                                    </td>
                                                                    <td>
                                                                        Lar.(m)
                                                                    </td>
                                                                    <td>
                                                                        Hau.(m)
                                                                    </td>
                                                                    <td>
                                                                        Vol.(m<sup>3</sup>)
                                                                    </td>
                                                                    <td>
                                                                        Inventaire
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
