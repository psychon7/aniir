<%@ Page Title="" Language="C#" MasterPageFile="~/Site.Master" AutoEventWireup="true"
    CodeBehind="ProductExpress.aspx.cs" Inherits="ERP.Web.Views.Product.ProductExpress" %>
<%@ Import Namespace="System.Web.Configuration" %>

<asp:Content ID="Content1" ContentPlaceHolderID="HeadContent" runat="server">
    <title>ERP - Produit</title>
    <!-- JQUERY UI DATE PICKER -->
    <link rel="stylesheet" type="text/css" href="../../js/jquery-ui-1.10.3.custom/css/custom-theme/jquery-ui-1.10.3.custom.min.css" />
    <link href="../../css/site.css" rel="stylesheet" type="text/css" />
    <!-- FILE UPLOAD -->
    <link href="../../js/jquery-upload/css/jquery.fileupload.css" rel="stylesheet" type="text/css">
    <!-- COLORBOX -->
    <link rel="stylesheet" type="text/css" href="../../js/colorbox/colorbox.min.css" />
    <!-- END COLORBOX -->
    <!-- DATA TABLES -->
    <link rel="stylesheet" type="text/css" href="../../js/datatables/media/css/jquery.dataTables.min.css" />
    <link rel="stylesheet" type="text/css" href="../../js/datatables/media/assets/css/datatables.min.css" />
    <link rel="stylesheet" type="text/css" href="../../js/datatables/extras/TableTools/media/css/TableTools.min.css" />
    <!-- BOOTSTRAP SWITCH -->
    <link rel="stylesheet" type="text/css" href="../../js/bootstrap-switch/bootstrap-switch.min.css" />
</asp:Content>
<asp:Content ID="Content2" ContentPlaceHolderID="MainContent" runat="server">
    <script>
        jQuery(document).ready(function () {
            App.setPage("index");  //Set current page
            App.init(); //Initialise plugins and elements
        });
    </script>
    <script src="../../js/ERP/CommonJS.js?V=<%= WebConfigurationManager.AppSettings["jsVersion"] %>"
        type="text/javascript"></script>
    <script src="../../js/ERP/ERPBaseJS.js?V=<%= WebConfigurationManager.AppSettings["jsVersion"] %>"
        type="text/javascript"></script>
    <script src="../../js/ERP/Product/ProductAtt.js?V=<%= WebConfigurationManager.AppSettings["jsVersion"] %>"
        type="text/javascript"></script>
    <script src="../../js/ERP/Product/ProductExpressJS.js?V=<%= WebConfigurationManager.AppSettings["jsVersion"] %>"
        type="text/javascript"></script>
    <%--<script src="../../js/ERP/Product/Product.js"
        type="text/javascript"></script>--%>
    <div class="container" id="div_product_page">
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
                                <li><a href="../../Views/Product/SearchProduct.aspx">Rechercher un produit</a> </li>
                                <li>Produit</li>
                            </ul>
                            <!-- /BREADCRUMBS -->
                            <div class="clearfix">
                                <h3 class="content-title pull-left">
                                    Produit</h3>
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
                        <div class="modal-body center forupdate">
                            <button type="button" class="btn btn-default" onclick="changeViewMode('view')">
                                Annuler</button>
                            <button type="button" class="btn btn-inverse" onclick="return js_create_update_product()">
                                Mettre à jour</button>
                        </div>
                        <div class="modal-body center forview">
                            <button type="button" class="btn btn-inverse" onclick="return delete_product_click_confirm(this)">
                                Supprimer</button>
                            <button type="button" class="btn btn-inverse" onclick="changeViewMode('modify')">
                                Modifier</button>
                            <button type="button" class="btn btn-inverse" onclick="getTechSheet()">
                                Fiche Technique</button>
                        </div>
                    </div>
                </div>
                <div class="row">
                    <div class="col-md-12">
                        <div class="row">
                            <div class="col-md-4" id="div_prd_info">
                                <div class="box border inverse">
                                    <div class="box-title">
                                        <h4>
                                            <i class="fa fa-bars"></i>Information général</h4>
                                    </div>
                                    <div class="box-body">
                                        <div class="form-horizontal">
                                            <div class="form-group">
                                                <label class="col-sm-3 control-label fieldRequired">
                                                    Type de produit</label>
                                                <div class="col-sm-9">
                                                    <select class="form-control" id="PtyId" name="PtyId" onchange="prd_type_change(this)"
                                                        required="">
                                                    </select>
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <label class="col-sm-3 control-label fieldRequired">
                                                    Nom du produit</label>
                                                <div class="col-sm-9">
                                                    <input class="form-control" id="PrdName" name="PrdName" type="text" placeholder="Nom du produit"
                                                        required="" maxlength="200">
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <label class="col-sm-3 control-label fieldRequired">
                                                    Famille du produit</label>
                                                <div class="col-sm-9">
                                                    <input class="form-control" id="PrdSubName" name="PrdSubName" type="text" placeholder="Famille du produit"
                                                        required="" maxlength="200">
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <label class="col-sm-3 control-label fieldRequired">
                                                    Référence</label>
                                                <div class="col-sm-9">
                                                    <input type="text" class="form-control" id="PrdRef" name="PrdRef" placeholder="Référence" onblur="PrdRefChange(this)"/>
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <label class="col-sm-3 control-label">
                                                    Code du produit</label>
                                                <div class="col-sm-9">
                                                    <input type="text" class="form-control" id="PrdCode" name="PrdCode" placeholder="Code du produit"
                                                        disabled />
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <label class="col-sm-3 control-label">
                                                    Prix d'achat</label>
                                                <div class="col-sm-9">
                                                    <input type="number" step="0.01" class="form-control" id="PrdPurchasePrice" name="PrdPurchasePrice"
                                                        placeholder="Prix d'achat" />
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <label class="col-sm-3 control-label">
                                                    Prix de vente</label>
                                                <div class="col-sm-9">
                                                    <input type="number" step="0.01" class="form-control" id="PrdPrice" name="PrdPrice"
                                                        placeholder="Prix de vente" />
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <label class="col-md-3 control-label">
                                                    Description</label>
                                                <div class="col-md-9">
                                                    <textarea rows="3" cols="5" name="PrdDescription" class="form-control" id="PrdDescription"
                                                        placeholder="Description"></textarea></div>
                                            </div>
                                            <div class="row">
                                                <div class="col-md-6">
                                                    <div class="box">
                                                        <div class="box-title" style="text-align: center">
                                                            <h4>
                                                                Taille du produit</h4>
                                                        </div>
                                                        <div class="box-body center">
                                                            <div class="form-group">
                                                                <label class="col-sm-4 control-label" style="font-size: 8pt; text-align: left;">
                                                                    Longueur</label><div class="col-sm-8">
                                                                        <div class='input-group'>
                                                                            <input id="PrdLength" class="form-control" name="PrdLength" title="Longueur" placeholder="Longueur"
                                                                                type="number"><span class="input-group-addon">mm</span></div>
                                                                    </div>
                                                            </div>
                                                            <div class="form-group">
                                                                <label class="col-sm-4 control-label" style="font-size: 8pt; text-align: left;">
                                                                    Largeur</label><div class="col-sm-8">
                                                                        <div class='input-group'>
                                                                            <input id="PrdWidth" class="form-control" name="PrdWidth" title="Largeur" placeholder="Largeur"
                                                                                type="number"><span class="input-group-addon">mm</span></div>
                                                                    </div>
                                                            </div>
                                                            <div class="form-group">
                                                                <label class="col-sm-4 control-label" style="font-size: 8pt; text-align: left;">
                                                                    Hauteur</label><div class="col-sm-8">
                                                                        <div class='input-group'>
                                                                            <input id="PrdHeight" class="form-control" name="PrdHeight" title="Hauteur" placeholder="Hauteur"
                                                                                type="number"><span class="input-group-addon">mm</span></div>
                                                                    </div>
                                                            </div>
                                                            <div class="form-group">
                                                                <label class="col-sm-4 control-label" style="font-size: 8pt; text-align: left;">
                                                                    Poids</label><div class="col-sm-8">
                                                                        <div class='input-group'>
                                                                            <input id="PrdWeight" class="form-control" name="PrdWeight" title="Poids" placeholder="Poids"
                                                                                type="number"><span class="input-group-addon">Kg</span></div>
                                                                    </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div class="col-md-6">
                                                    <div class="box">
                                                        <div class="box-title" style="text-align: center">
                                                            <h4>
                                                                Taille intérieur</h4>
                                                        </div>
                                                        <div class="box-body center">
                                                            <div class="form-group">
                                                                <label class="col-sm-4 control-label" style="font-size: 8pt; text-align: left;">
                                                                    Longueur intérieur</label><div class="col-sm-8">
                                                                        <div class='input-group'>
                                                                            <input id="PrdHoleLength" class="form-control" name="PrdHoleLength" title="Longueur"
                                                                                placeholder="Longueur" type="number"><span class="input-group-addon">mm</span></div>
                                                                    </div>
                                                            </div>
                                                            <div class="form-group">
                                                                <label class="col-sm-4 control-label" style="font-size: 8pt; text-align: left;">
                                                                    Largeur intérieur</label><div class="col-sm-8">
                                                                        <div class='input-group'>
                                                                            <input id="PrdHoleWidth" class="form-control" name="PrdHoleWidth" title="Largeur"
                                                                                placeholder="Largeur" type="number"><span class="input-group-addon">mm</span></div>
                                                                    </div>
                                                            </div>
                                                            <div class="form-group">
                                                                <label class="col-sm-4 control-label" style="font-size: 8pt; text-align: left;">
                                                                    Profondeur</label><div class="col-sm-8">
                                                                        <div class='input-group'>
                                                                            <input id="PrdDepth" class="form-control" name="PrdDepth" title="Profondeur" placeholder="Profondeur"
                                                                                type="number"><span class="input-group-addon">mm</span></div>
                                                                    </div>
                                                            </div>
                                                            <div class="form-group">
                                                                <label class="col-sm-4 control-label" style="font-size: 8pt; text-align: left;">
                                                                    Diamètre intérieur(Ouverture)</label><div class="col-sm-8">
                                                                        <div class='input-group'>
                                                                            <input id="PrdHoleSize" class="form-control" name="PrdHoleSize" title="Ouverture"
                                                                                placeholder="Ouverture" type="number"><span class="input-group-addon">mm</span></div>
                                                                    </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div class="row">
                                                <div class="col-md-6">
                                                    <div class="box">
                                                        <div class="box-title" style="text-align: center">
                                                            <h4>
                                                                Taille extérieur</h4>
                                                        </div>
                                                        <div class="box-body center">
                                                            <div class="form-group">
                                                                <label class="col-sm-4 control-label" style="font-size: 8pt; text-align: left;">
                                                                    Longueur extérieur</label><div class="col-sm-8">
                                                                        <div class='input-group'>
                                                                            <input id="PrdOutsideLength" class="form-control" name="PrdOutsideLength" title="Longueur"
                                                                                placeholder="Longueur" type="number"><span class="input-group-addon">mm</span></div>
                                                                    </div>
                                                            </div>
                                                            <div class="form-group">
                                                                <label class="col-sm-4 control-label" style="font-size: 8pt; text-align: left;">
                                                                    Largeur extérieur</label><div class="col-sm-8">
                                                                        <div class='input-group'>
                                                                            <input id="PrdOutsideWidth" class="form-control" name="PrdOutsideWidth" title="Largeur"
                                                                                placeholder="Largeur" type="number"><span class="input-group-addon">mm</span></div>
                                                                    </div>
                                                            </div>
                                                            <div class="form-group">
                                                                <label class="col-sm-4 control-label" style="font-size: 8pt; text-align: left;">
                                                                    Épaisseur</label><div class="col-sm-8">
                                                                        <div class='input-group'>
                                                                            <input id="PrdOutsideHeight" class="form-control" name="PrdOutsideHeight" title="Hauteur"
                                                                                placeholder="Épaisseur" type="number"><span class="input-group-addon">mm</span></div>
                                                                    </div>
                                                            </div>
                                                            <div class="form-group">
                                                                <label class="col-sm-4 control-label" style="font-size: 8pt; text-align: left;">
                                                                    Diamètre extérieur</label><div class="col-sm-8">
                                                                        <div class='input-group'>
                                                                            <input class="form-control" id="PrdOutsideDiameter" name="PrdOutsideDiameter" title=" Diamètre extérieur"
                                                                                placeholder="Diamètre extérieur" type="number"><span class="input-group-addon">mm</span></div>
                                                                    </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div class="col-md-6">
                                                    <div class="box">
                                                        <div class="box-title" style="text-align: center">
                                                            <h4>
                                                                Taille d'unit</h4>
                                                        </div>
                                                        <div class="box-body center">
                                                            <div class="form-group">
                                                                <label class="col-sm-4 control-label" style="font-size: 8pt; text-align: left;">
                                                                    Longueur</label><div class="col-sm-8">
                                                                        <div class='input-group'>
                                                                            <input id="PrdUnitLength" class="form-control" name="PrdUnitLength" title="Longueur"
                                                                                placeholder="Longueur" type="number"><span class="input-group-addon">mm</span></div>
                                                                    </div>
                                                            </div>
                                                            <div class="form-group">
                                                                <label class="col-sm-4 control-label" style="font-size: 8pt; text-align: left;">
                                                                    Largeur</label><div class="col-sm-8">
                                                                        <div class='input-group'>
                                                                            <input id="PrdUnitWidth" class="form-control" name="PrdUnitWidth" title="Largeur"
                                                                                placeholder="Largeur" type="number"><span class="input-group-addon">mm</span></div>
                                                                    </div>
                                                            </div>
                                                            <div class="form-group">
                                                                <label class="col-sm-4 control-label" style="font-size: 8pt; text-align: left;">
                                                                    Hauteur</label><div class="col-sm-8">
                                                                        <div class='input-group'>
                                                                            <input id="PrdUnitHeight" class="form-control" name="PrdUnitHeight" title="Hauteur"
                                                                                placeholder="Hauteur" type="number"><span class="input-group-addon">mm</span></div>
                                                                    </div>
                                                            </div>
                                                            <div class="form-group">
                                                                <label class="col-sm-4 control-label" style="font-size: 8pt; text-align: left;">
                                                                    Poids</label><div class="col-sm-8">
                                                                        <div class='input-group'>
                                                                            <input id="PrdUnitWeight" class="form-control" name="PrdUnitWeight" title="Poids"
                                                                                placeholder="Poids" type="number"><span class="input-group-addon">Kg</span></div>
                                                                    </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div class="row">
                                                <div class="col-md-6">
                                                    <div class="box">
                                                        <div class="box-title" style="text-align: center">
                                                            <h4>
                                                                Taille du carton</h4>
                                                        </div>
                                                        <div class="box-body center">
                                                            <div class="form-group">
                                                                <label class="col-sm-4 control-label" style="font-size: 8pt; text-align: left;">
                                                                    Longueur</label><div class="col-sm-8">
                                                                        <div class='input-group'>
                                                                            <input id="PrdCartonLength" class="form-control" name="PrdCartonLength" title="Longueur"
                                                                                placeholder="Longueur" type="number"><span class="input-group-addon">mm</span></div>
                                                                    </div>
                                                            </div>
                                                            <div class="form-group">
                                                                <label class="col-sm-4 control-label" style="font-size: 8pt; text-align: left;">
                                                                    Largeur</label><div class="col-sm-8">
                                                                        <div class='input-group'>
                                                                            <input id="PrdCartonWidth" class="form-control" name="PrdCartonWidth" title="Largeur"
                                                                                placeholder="Largeur" type="number"><span class="input-group-addon">mm</span></div>
                                                                    </div>
                                                            </div>
                                                            <div class="form-group">
                                                                <label class="col-sm-4 control-label" style="font-size: 8pt; text-align: left;">
                                                                    Hauteur</label><div class="col-sm-8">
                                                                        <div class='input-group'>
                                                                            <input id="PrdCartonHeight" class="form-control" name="PrdCartonHeight" title="Hauteur"
                                                                                placeholder="Hauteur" type="number"><span class="input-group-addon">mm</span></div>
                                                                    </div>
                                                            </div>
                                                            <div class="form-group">
                                                                <label class="col-sm-4 control-label" style="font-size: 8pt; text-align: left;">
                                                                    Poids</label><div class="col-sm-8">
                                                                        <div class='input-group'>
                                                                            <input id="PrdCartonWeight" class="form-control" name="PrdCartonWeight" title="Poids"
                                                                                placeholder="Poids" type="number"><span class="input-group-addon">Kg</span></div>
                                                                    </div>
                                                            </div>
                                                            <div class="form-group">
                                                                <label class="col-sm-4 control-label" style="font-size: 8pt; text-align: left;">
                                                                    Unit par carton</label><div class="col-sm-8">
                                                                        <input id="PrdQuantityEachCarton" class="form-control" step="1" name="PrdQuantityEachCarton"
                                                                            title="Unit par carton" placeholder="Unit par carton" type="number"></div>
                                                            </div>
                                                        </div>
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
                                            <i class="fa fa-bars"></i>Produit EXPRESS</h4>
                                    </div>
                                    <div class="box-body">
                                        <div class="form-horizontal">
                                            <div class="form-group">
                                                <label class="col-sm-3 control-label">
                                                    Fournisseur</label>
                                                <div class="col-sm-9">
                                                    <select class="form-control" id="SupId">
                                                    </select>
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <label class="col-sm-12 control-label" style="text-align: center">
                                                    Température de couleur et Flux lumineux</label>
                                            </div>
                                            <div class="form-group">
                                                <div class="col-sm-3">
                                                    <label class="checkbox">
                                                        <input type="checkbox" class="uniform" value="" id="cbx_2700" colid="2700" onclick="colorClick(this)" />
                                                        2700K
                                                    </label>
                                                </div>
                                                <div class="col-sm-9">
                                                    <div class="input-group">
                                                        <input type="number" min="0" class="form-control" id="ip_2700" disabled="" /><span
                                                            class="input-group-addon">LMS</span></div>
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <div class="col-sm-3">
                                                    <label class="checkbox">
                                                        <input type="checkbox" class="uniform" value="" id="cbx_3000" colid="3000" onclick="colorClick(this)" />
                                                        3000K
                                                    </label>
                                                </div>
                                                <div class="col-sm-9">
                                                    <div class="input-group">
                                                        <input type="number" min="0" class="form-control" id="ip_3000" disabled="" /><span
                                                            class="input-group-addon">LMS</span></div>
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <div class="col-sm-3">
                                                    <label class="checkbox">
                                                        <input type="checkbox" class="uniform" value="" id="cbx_4000" colid="4000" onclick="colorClick(this)" />
                                                        4000K
                                                    </label>
                                                </div>
                                                <div class="col-sm-9">
                                                    <div class="input-group">
                                                        <input type="number" min="0" class="form-control" id="ip_4000" disabled="" /><span
                                                            class="input-group-addon">LMS</span></div>
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <div class="col-sm-3">
                                                    <label class="checkbox">
                                                        <input type="checkbox" class="uniform" value="" id="cbx_4500" colid="4500" onclick="colorClick(this)" />
                                                        4500K
                                                    </label>
                                                </div>
                                                <div class="col-sm-9">
                                                    <div class="input-group">
                                                        <input type="number" min="0" class="form-control" id="ip_4500" disabled="" /><span
                                                            class="input-group-addon">LMS</span></div>
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <div class="col-sm-3">
                                                    <label class="checkbox">
                                                        <input type="checkbox" class="uniform" value="" id="cbx_5000" colid="5000" onclick="colorClick(this)" />
                                                        5000K
                                                    </label>
                                                </div>
                                                <div class="col-sm-9">
                                                    <div class="input-group">
                                                        <input type="number" min="0" class="form-control" id="ip_5000" disabled="" /><span
                                                            class="input-group-addon">LMS</span></div>
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <div class="col-sm-3">
                                                    <label class="checkbox">
                                                        <input type="checkbox" class="uniform" value="" id="cbx_5500" colid="5500" onclick="colorClick(this)" />
                                                        5500K
                                                    </label>
                                                </div>
                                                <div class="col-sm-9">
                                                    <div class="input-group">
                                                        <input type="number" min="0" class="form-control" id="ip_5500" disabled="" /><span
                                                            class="input-group-addon">LMS</span></div>
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <div class="col-sm-3">
                                                    <label class="checkbox">
                                                        <input type="checkbox" class="uniform" value="" id="cbx_6000" colid="6000" onclick="colorClick(this)" />
                                                        6000K
                                                    </label>
                                                </div>
                                                <div class="col-sm-9">
                                                    <div class="input-group">
                                                        <input type="number" min="0" class="form-control" id="ip_6000" disabled="" /><span
                                                            class="input-group-addon">LMS</span></div>
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <div class="col-sm-3">
                                                    <label class="checkbox">
                                                        <input type="checkbox" class="uniform" value="" id="cbx_6500" colid="6500" onclick="colorClick(this)" />
                                                        6500K
                                                    </label>
                                                </div>
                                                <div class="col-sm-9">
                                                    <div class="input-group">
                                                        <input type="number" min="0" class="form-control" id="ip_6500" disabled="" /><span
                                                            class="input-group-addon">LMS</span></div>
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <div class="col-sm-3">
                                                    <label class="checkbox">
                                                        <input type="checkbox" class="uniform" value="" id="cbx_rgb" />
                                                        RGB
                                                    </label>
                                                </div>
                                                <div class="col-sm-9">
                                                </div>
                                            </div>
                                            <div class="separator">
                                            </div>
                                            <div class="form-group">
                                                <label class="col-sm-12 control-label" style="text-align: center">
                                                    Couleur de produit</label>
                                            </div>
                                            <div class="form-group">
                                                <div class="col-sm-12" style="text-align: center">
                                                    <label class="checkbox-inline">
                                                        <input type="checkbox" class="uniform" value="" id="ip_col_white">
                                                        Blanc(WH)
                                                    </label>
                                                    <label class="checkbox-inline">
                                                        <input type="checkbox" class="uniform" value="" id="ip_col_black">
                                                        Noir(BK)</label>
                                                    <label class="checkbox-inline">
                                                        <input type="checkbox" class="uniform" value="" id="ip_col_grey">
                                                        Gris(GY)</label>
                                                    <label class="checkbox-inline">
                                                        <input type="checkbox" class="uniform" value="" id="ip_col_orange">
                                                        Orange(OR)</label>
                                                    <label class="checkbox-inline">
                                                        <input type="checkbox" class="uniform" value="" id="ip_col_green">
                                                        Vert(GR)</label>
                                                </div>
                                            </div>
                                            <div class="separator">
                                            </div>
                                            <div class="form-group">
                                                <label class="col-sm-12 control-label" style="text-align: center">
                                                    Opération</label>
                                            </div>
                                            <div class="form-group">
                                                <div class="col-sm-12" style="text-align: center">
                                                    <label class="checkbox-inline">
                                                        <input type="checkbox" class="uniform" value="" id="ip_opr_normal">
                                                        Normal(N)
                                                    </label>
                                                    <label class="checkbox-inline">
                                                        <input type="checkbox" class="uniform" value="" id="ip_opr_dimmable">
                                                        Dimmable(D)</label>
                                                    <label class="checkbox-inline">
                                                        <input type="checkbox" class="uniform" value="" id="ip_opr_dali">
                                                        Dali(L)</label>
                                                    <label class="checkbox-inline">
                                                        <input type="checkbox" class="uniform" value="" id="ip_opr_dg">
                                                        Dimmable Gradable(G)</label>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="col-md-4">
                                <div class="box border inverse">
                                    <div class="box-title">
                                        <h4 style="overflow: hidden;">
                                            <i class="fa fa-bars"></i>Les attributs général&nbsp; <span id="PtyName_general">
                                            </span>
                                        </h4>
                                        <div class="tools">
                                            <a href="javascript:;" class="collapse _infoCollapse"><i class="fa fa-chevron-up"></i>
                                            </a>
                                        </div>
                                    </div>
                                    <div class="box-body" id="div_prd_general_attrs">
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <!-- /FORMS -->
        <!-- SAMPLE -->
        <div class="row">
            <div class="col-md-12">
                <div class="modal-body center forcreate">
                    <button type="button" class="btn btn-inverse" onclick="return js_create_update_product()">
                        Créer le produit</button>
                </div>
            </div>
        </div>
        <div class="footer-tools">
            <span class="go-top"><i class="fa fa-chevron-up"></i>Top </span>
        </div>
    </div>
    <!-- /CONTENT-->
    <script type="text/javascript" src="../../js/jQuery-BlockUI/jquery.blockUI.min.js"></script>
    <script type="text/javascript" src="../../js/datatables/extras/TableTools/media/js/ZeroClipboard.min.js"></script>
    <script type="text/javascript" src="../../js/jQuery-Cookie/jquery.cookie.min.js"></script>
    <script src="../../js/bootbox/bootbox.min.js" type="text/javascript"></script>
    <!-- DATE PICKER -->
    <script type="text/javascript" src="../../js/datepicker/picker.js"></script>
    <script type="text/javascript" src="../../js/datepicker/picker.date.js"></script>
    <script type="text/javascript" src="../../js/datepicker/picker.time.js"></script>
    <!-- CUSTOM SCRIPT -->
    <!-- JAVASCRIPTS -->
    <!-- Placed at the end of the document so the pages load faster -->
    <!-- JQUERY -->
    <script type="text/javascript" src="../../js/isotope/jquery.isotope.min.js"></script>
    <script type="text/javascript" src="../../js/isotope/imagesloaded.pkgd.min.js"></script>
    <!-- COLORBOX -->
    <script type="text/javascript" src="../../js/colorbox/jquery.colorbox.min.js"></script>
    <!-- COOKIE -->
    <script type="text/javascript" src="../../js/jQuery-Cookie/jquery.cookie.min.js"></script>
    <!-- DATA TABLES -->
    <script type="text/javascript" src="../../js/datatables/media/js/jquery.dataTables.min.js?V=<%= WebConfigurationManager.AppSettings["jsVersion"] %>"></script>
    <script type="text/javascript" src="../../js/datatables/media/assets/js/datatables.min.js?V=<%= WebConfigurationManager.AppSettings["jsVersion"] %>"></script>
    <script type="text/javascript" src="../../js/datatables/extras/TableTools/media/js/TableTools.min.js"></script>
    <script type="text/javascript" src="../../js/datatables/extras/TableTools/media/js/ZeroClipboard.min.js"></script>
    <script type="text/javascript" src="../../js/jQuery-Cookie/jquery.cookie.min.js"></script>
    <!-- BOOTSTRAP SWITCH -->
    <script type="text/javascript" src="../../js/bootstrap-switch/bootstrap-switch.min.js"></script>
    <script src="../../js/script.js"></script>
</asp:Content>
