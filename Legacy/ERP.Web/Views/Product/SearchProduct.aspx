<%@ Page Title="" Language="C#" MasterPageFile="~/Site.Master" AutoEventWireup="true"
    CodeBehind="SearchProduct.aspx.cs" Inherits="ERP.Web.Views.Product.SearchProduct" %>
<%@ Import Namespace="System.Web.Configuration" %>

<asp:Content ID="Content1" ContentPlaceHolderID="HeadContent" runat="server">
    <title>Rechercher Produit</title>
    <!-- DATA TABLES -->
    <link rel="stylesheet" type="text/css" href="../../js/datatables/media/css/jquery.dataTables.min.css" />
    <link rel="stylesheet" type="text/css" href="../../js/datatables/media/assets/css/datatables.min.css" />
    <link rel="stylesheet" type="text/css" href="../../js/datatables/extras/TableTools/media/css/TableTools.min.css" />
    <link href="../../css/site.css" rel="stylesheet" type="text/css" />
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
    <script src="../../js/ERP/Product/ProductSearch.js?V=<%= WebConfigurationManager.AppSettings["jsVersion"] %>"
        type="text/javascript"></script>
    <script src="../../js/ERP/Product/ProductExp.js?V=<%= WebConfigurationManager.AppSettings["jsVersion"] %>"
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
                                <li><i class="fa fa-home"></i><a href="../../Default.aspx">&nbsp;<span class="language_txt">Home</span></a> </li>
                                <li><a href="#" class="language_txt">Rechercher un produit</a> </li>
                                <li class="language_txt">Rechercher un produit</li>
                            </ul>
                            <!-- /BREADCRUMBS -->
                            <div class="clearfix">
                                <h3 class="content-title pull-left language_txt">Produit</h3>
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
                                        <h4><i class="fa fa-bars"></i><span class="language_txt">Critère de recherche</span></h4>
                                    </div>
                                    <div class="box-body" id="divSearchCondition">
                                        <div class="form-horizontal">
                                            <div class="form-group">
                                                <label class="col-sm-3 control-label language_txt">Type du produit</label>
                                                <div class="col-sm-3">
                                                    <select class="form-control" id="PtyId" name="PtyId" onchange="prdSearchPtyChange(this)">
                                                    </select>
                                                </div>
                                                <label class="col-sm-3 control-label language_txt">Référence / Code / Nom</label>
                                                <div class="col-sm-3">
                                                    <input type="text" class="form-control" id="PrdInfo" name="PrdInfo" placeholder="Information du product" />
                                                </div>
                                                <%--<label class="col-sm-1 control-label">
                                                    Nom du produit</label>
                                                <div class="col-sm-2">
                                                    <input class="form-control" id="PrdName" name="PrdName" type="text" placeholder="Nom du produit"
                                                        maxlength="200">
                                                </div>
                                                <label class="col-sm-1 control-label">
                                                    Code du produit</label>
                                                <div class="col-sm-2">
                                                    <input class="form-control" id="PrdCode" name="PrdCode" type="text" placeholder="Code du produit"
                                                        maxlength="200">
                                                </div>--%>
                                            </div>
                                            <div id="divPtySearchFields">
                                            </div>
                                            <div class="modal-footer center">
                                                <button type="submit" class="btn btn-inverse start language_txt" onclick="return jsSearchPrd()">Rechercher</button>
                                                <button type="button" class="btn btn-inverse success language_txt" onclick="return createProduct()">Créer un produit</button>
                                                <button type="button" class="btn btn-inverse start language_txt" onclick="return jsCreateProductExpress()">Créer des produits EXP🔥</button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="separator">
                        </div>
                        <div class="row searchresult" id="div_search_result">
                            <div class="col-md-12">
                                <!-- BOX -->
                                <div class="box border inverse">
                                    <div class="box-title">
                                        <h4>
                                            <i class="fa fa-table"></i><span class="language_txt">Résultat</span>
                                        </h4>
                                        <span style="float: right" id="result_count"></span>
                                    </div>
                                    <div class="box-body center" id="div2">
                                        <button type="button" class="btn btn-inverse language_txt" id="btn_exportPdf_prd" onclick="return ExportPrdsPdf();" style="display: none;">Export Fiche Tech</button>
                                    </div>
                                    <div class="box-body" id="div_for_datatable" style="width: 100%; overflow-x: auto;">
                                        <table id="datatable_search_result" cellpadding="0" cellspacing="0" border="0" class="datatable table table-striped table-bordered table-hover">
                                            <thead id="thead_search_result">
                                                <tr>
                                                    <th class="language_txt">Nom du produit</th>
                                                    <th class="language_txt">Référence du produit</th>
                                                    <th class="language_txt">Fournisseur</th>
                                                    <th class="language_txt">Code du produit</th>
                                                    <th class="language_txt">Sous Référence</th>
                                                </tr>
                                            </thead>
                                            <tbody id="tbody_search_result">
                                            </tbody>
                                            <tfoot id="tfoot_search_result">
                                                <tr>
                                                     <th class="language_txt">Nom du produit</th>
                                                    <th class="language_txt">Référence du produit</th>
                                                    <th class="language_txt">Fournisseur</th>
                                                    <th class="language_txt">Code du produit</th>
                                                    <th class="language_txt">Sous Référence</th>
                                                </tr>
                                            </tfoot>
                                        </table>
                                    </div>
                                </div>
                                <!-- /BOX -->
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
</asp:Content>
