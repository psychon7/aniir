<%@ Page Title="" Language="C#" MasterPageFile="~/Site.Master" AutoEventWireup="true"
    CodeBehind="Product.aspx.cs" Inherits="ERP.Web.Views.Product.Product" %>
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
        //        jQuery(document).ready(function () {
        //            App.setPage("gallery");  //Set current page
        //            App.init(); //Initialise plugins and elements
        //        });
    </script>
    <script src="../../js/ERP/CommonJS.js?V=<%= WebConfigurationManager.AppSettings["jsVersion"] %>"
        type="text/javascript"></script>
    <script src="../../js/ERP/ERPBaseJS.js?V=<%= WebConfigurationManager.AppSettings["jsVersion"] %>"
        type="text/javascript"></script>
    <script src="../../js/ERP/Product/ProductAtt.js?V=<%= WebConfigurationManager.AppSettings["jsVersion"] %>"
        type="text/javascript"></script>
    <script src="../../js/ERP/Product/Product.js?V=<%= WebConfigurationManager.AppSettings["jsVersion"] %>"
        type="text/javascript"></script>
    <script src="../../js/ERP/Product/ProductPhoto.js?V=<%= WebConfigurationManager.AppSettings["jsVersion"] %>"
        type="text/javascript"></script>
    <script src="../../js/ERP/Product/ProductFiles.js?V=<%= WebConfigurationManager.AppSettings["jsVersion"] %>"
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
                                <li><i class="fa fa-home"></i><a href="../../Default.aspx">&nbsp;<span class="language_txt">Home</span></a> </li>
                                <li><a href="../../Views/Product/SearchProduct.aspx"><span class="language_txt">Rechercher un produit</span></a> </li>
                                <li class="language_txt">Produit</li>
                            </ul>
                            <!-- /BREADCRUMBS -->
                            <div class="clearfix">
                                <h3 class="content-title pull-left">
                                   <span class="language_txt">Produit</span> </h3>
                                    
                            </div>
                            <div class="description">
                                <div class="forcreate">
                                <button type="button" class="btn btn-inverse language_txt" onclick="createProductExpress();" style="display: none;">Création EXPRESS</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <!-- /PAGE HEADER -->
                <!-- FORMS -->
                <div class="row">
                    <div class="col-md-12">
                        <div class="modal-body center forupdate">
                            <button type="button" class="btn btn-default language_txt" onclick="changeViewMode('view')">Annuler</button>
                            <button type="button" class="btn btn-inverse language_txt" onclick="return js_create_update_product()">Mettre à jour</button>
                        </div>
                        <div class="modal-body center forview">
                            <button type="button" class="btn btn-inverse language_txt" onclick="return delete_product_click_confirm(this)">Supprimer</button>
                            <button type="button" class="btn btn-inverse language_txt" onclick="changeViewMode('modify')">Modifier</button>
                            <button type="button" class="btn btn-inverse language_txt" onclick="getTechSheet()">Fiche Technique</button>
                            <button type="button" class="btn btn-inverse language_txt" onclick="return DuplicateProduct()">Dupliquer ce produit</button>
                        </div>
                    </div>
                </div>
                <div class="row">
                    <div class="col-md-12">
                        <div class="row">
                            <div class="col-md-12" id="div_prd_info">
                                <div class="box border inverse">
                                    <div class="box-title">
                                        <h4>
                                            <i class="fa fa-bars"></i><span class="language_txt">Information général</span></h4>
                                    </div>
                                    <div class="box-body">
                                        <div class="form-horizontal">
                                            <div class="form-group">
                                                <label class="col-sm-3 control-label fieldRequired"><span class="language_txt">Type de produit</span></label>
                                                <div class="col-sm-9">
                                                    <select class="form-control" id="PtyId" name="PtyId" onchange="prd_type_change(this)"
                                                        required="">
                                                    </select>
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <label class="col-sm-3 control-label language_txt fieldRequired">Nom de produit</label>
                                                <div class="col-sm-9">
                                                    <input class="form-control" id="PrdName" name="PrdName" type="text" placeholder="Nom de produit"
                                                        required="" maxlength="200">
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <label class="col-sm-3 control-label language_txt">Famille de produit</label>
                                                <div class="col-sm-9">
                                                    <input class="form-control" id="PrdSubName" name="PrdSubName" type="text" placeholder="Famille de produit"
                                                        maxlength="200">
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <label class="col-sm-3 control-label language_txt fieldRequired">Référence</label>
                                                <div class="col-sm-9">
                                                    <input type="text" class="form-control" id="PrdRef" name="PrdRef" placeholder="Référence" required=""  />
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <label class="col-sm-3 control-label language_txt">Code du produit</label>
                                                <div class="col-sm-9">
                                                    <input type="text" class="form-control" id="PrdCode" name="PrdCode" placeholder="Code du produit"
                                                        disabled />
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <label class="col-sm-3 control-label language_txt">Prix d'achat</label>
                                                <div class="col-sm-9">
                                                    <input type="number" step="0.01" class="form-control" id="PrdPurchasePrice" name="PrdPurchasePrice"
                                                        placeholder="Prix d'achat" />
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <label class="col-sm-3 control-label language_txt">Prix de vente</label>
                                                <div class="col-sm-9">
                                                    <input type="number" step="0.01" class="form-control" id="PrdPrice" name="PrdPrice"
                                                        placeholder="Prix de vente" />
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <label class="col-md-3 control-label language_txt">Description</label>
                                                <div class="col-md-9">
                                                    <textarea rows="3" cols="5" name="PrdDescription" class="form-control" id="PrdDescription"
                                                        placeholder="Description"></textarea></div>
                                            </div>
                                            <div class="row">
                                                <div class="col-md-4">
                                                    <div class="box">
                                                        <div class="box-title" style="text-align: center">
                                                            <h4>
                                                                <span class="language_txt">Taille du produit</span></h4>
                                                        </div>
                                                        <div class="box-body center">
                                                            <div class="form-group">
                                                                <label class="col-sm-4 control-label language_txt" style="font-size: 8pt; text-align: left;">Longueur</label><div class="col-sm-8">
                                                                        <div class='input-group'>
                                                                            <input id="PrdLength" class="form-control" name="PrdLength" title="Longueur" placeholder="Longueur"
                                                                                type="number"><span class="input-group-addon">mm</span></div>
                                                                    </div>
                                                            </div>
                                                            <div class="form-group">
                                                                <label class="col-sm-4 control-label language_txt" style="font-size: 8pt; text-align: left;">Largeur</label><div class="col-sm-8">
                                                                        <div class='input-group'>
                                                                            <input id="PrdWidth" class="form-control" name="PrdWidth" title="Largeur" placeholder="Largeur"
                                                                                type="number"><span class="input-group-addon">mm</span></div>
                                                                    </div>
                                                            </div>
                                                            <div class="form-group">
                                                                <label class="col-sm-4 control-label language_txt" style="font-size: 8pt; text-align: left;">Hauteur</label><div class="col-sm-8">
                                                                        <div class='input-group'>
                                                                            <input id="PrdHeight" class="form-control" name="PrdHeight" title="Hauteur" placeholder="Hauteur"
                                                                                type="number"><span class="input-group-addon">mm</span></div>
                                                                    </div>
                                                            </div>
                                                            <div class="form-group">
                                                                <label class="col-sm-4 control-label language_txt" style="font-size: 8pt; text-align: left;">Poids</label><div class="col-sm-8">
                                                                        <div class='input-group'>
                                                                            <input id="PrdWeight" class="form-control" name="PrdWeight" title="Poids" placeholder="Poids"
                                                                                type="number"><span class="input-group-addon">Kg</span></div>
                                                                    </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div class="col-md-4">
                                                    <div class="box">
                                                        <div class="box-title" style="text-align: center">
                                                            <h4>
                                                                <span class="language_txt">Taille d'unit</span></h4>
                                                        </div>
                                                        <div class="box-body center">
                                                            <div class="form-group">
                                                                <label class="col-sm-4 control-label language_txt" style="font-size: 8pt; text-align: left;">Longueur</label><div class="col-sm-8">
                                                                        <div class='input-group'>
                                                                            <input id="PrdUnitLength" class="form-control" name="PrdUnitLength" title="Longueur"
                                                                                placeholder="Longueur" type="number"><span class="input-group-addon">mm</span></div>
                                                                    </div>
                                                            </div>
                                                            <div class="form-group">
                                                                <label class="col-sm-4 control-label language_txt" style="font-size: 8pt; text-align: left;">Largeur</label><div class="col-sm-8">
                                                                        <div class='input-group'>
                                                                            <input id="PrdUnitWidth" class="form-control" name="PrdUnitWidth" title="Largeur"
                                                                                placeholder="Largeur" type="number"><span class="input-group-addon">mm</span></div>
                                                                    </div>
                                                            </div>
                                                            <div class="form-group">
                                                                <label class="col-sm-4 control-label language_txt" style="font-size: 8pt; text-align: left;">Hauteur</label><div class="col-sm-8">
                                                                        <div class='input-group'>
                                                                            <input id="PrdUnitHeight" class="form-control" name="PrdUnitHeight" title="Hauteur"
                                                                                placeholder="Hauteur" type="number"><span class="input-group-addon">mm</span></div>
                                                                    </div>
                                                            </div>
                                                            <div class="form-group">
                                                                <label class="col-sm-4 control-label language_txt" style="font-size: 8pt; text-align: left;">Poids</label><div class="col-sm-8">
                                                                        <div class='input-group'>
                                                                            <input id="PrdUnitWeight" class="form-control" name="PrdUnitWeight" title="Poids"
                                                                                placeholder="Poids" type="number"><span class="input-group-addon">Kg</span></div>
                                                                    </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div class="col-md-4">
                                                    <div class="box">
                                                        <div class="box-title" style="text-align: center">
                                                            <h4>
                                                                <span class="language_txt">Taille du carton</span></h4>
                                                        </div>
                                                        <div class="box-body center">
                                                            <div class="form-group">
                                                                <label class="col-sm-4 control-label language_txt" style="font-size: 8pt; text-align: left;">Longueur</label><div class="col-sm-8">
                                                                        <div class='input-group'>
                                                                            <input id="PrdCartonLength" class="form-control" name="PrdCartonLength" title="Longueur"
                                                                                placeholder="Longueur" type="number"><span class="input-group-addon">mm</span></div>
                                                                    </div>
                                                            </div>
                                                            <div class="form-group">
                                                                <label class="col-sm-4 control-label language_txt" style="font-size: 8pt; text-align: left;">Largeur</label><div class="col-sm-8">
                                                                        <div class='input-group'>
                                                                            <input id="PrdCartonWidth" class="form-control" name="PrdCartonWidth" title="Largeur"
                                                                                placeholder="Largeur" type="number"><span class="input-group-addon">mm</span></div>
                                                                    </div>
                                                            </div>
                                                            <div class="form-group">
                                                                <label class="col-sm-4 control-label language_txt" style="font-size: 8pt; text-align: left;">Hauteur</label><div class="col-sm-8">
                                                                        <div class='input-group'>
                                                                            <input id="PrdCartonHeight" class="form-control" name="PrdCartonHeight" title="Hauteur"
                                                                                placeholder="Hauteur" type="number"><span class="input-group-addon">mm</span></div>
                                                                    </div>
                                                            </div>
                                                            <div class="form-group">
                                                                <label class="col-sm-4 control-label language_txt" style="font-size: 8pt; text-align: left;">Poids</label><div class="col-sm-8">
                                                                        <div class='input-group'>
                                                                            <input id="PrdCartonWeight" class="form-control" name="PrdCartonWeight" title="Poids"
                                                                                placeholder="Poids" type="number"><span class="input-group-addon">Kg</span></div>
                                                                    </div>
                                                            </div>
                                                            <div class="form-group">
                                                                <label class="col-sm-4 control-label language_txt" style="font-size: 8pt; text-align: left;">Unit par carton</label><div class="col-sm-8">
                                                                        <input id="PrdQuantityEachCarton" class="form-control" step="1" name="PrdQuantityEachCarton"
                                                                            title="Unit par carton" placeholder="Unit par carton" type="number"></div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div class="row">
                                                <div class="col-md-4">
                                                    <div class="box">
                                                        <div class="box-title" style="text-align: center">
                                                            <h4>
                                                                <span class="language_txt">Taille intérieur</span></h4>
                                                        </div>
                                                        <div class="box-body center">
                                                            <div class="form-group">
                                                                <label class="col-sm-4 control-label language_txt" style="font-size: 8pt; text-align: left;">Longueur intérieur</label><div class="col-sm-8">
                                                                        <div class='input-group'>
                                                                            <input id="PrdHoleLength" class="form-control" name="PrdHoleLength" title="Longueur"
                                                                                placeholder="Longueur" type="number"><span class="input-group-addon">mm</span></div>
                                                                    </div>
                                                            </div>
                                                            <div class="form-group">
                                                                <label class="col-sm-4 control-label language_txt" style="font-size: 8pt; text-align: left;">Largeur intérieur</label><div class="col-sm-8">
                                                                        <div class='input-group'>
                                                                            <input id="PrdHoleWidth" class="form-control" name="PrdHoleWidth" title="Largeur"
                                                                                placeholder="Largeur" type="number"><span class="input-group-addon">mm</span></div>
                                                                    </div>
                                                            </div>
                                                            <div class="form-group">
                                                                <label class="col-sm-4 control-label language_txt" style="font-size: 8pt; text-align: left;">Profondeur</label><div class="col-sm-8">
                                                                        <div class='input-group'>
                                                                            <input id="PrdDepth" class="form-control" name="PrdDepth" title="Profondeur" placeholder="Profondeur"
                                                                                type="number"><span class="input-group-addon">mm</span></div>
                                                                    </div>
                                                            </div>
                                                            <div class="form-group">
                                                                <label class="col-sm-4 control-label language_txt" style="font-size: 8pt; text-align: left;">Diamètre intérieur(Ouverture)</label><div class="col-sm-8">
                                                                        <div class='input-group'>
                                                                            <input id="PrdHoleSize" class="form-control" name="PrdHoleSize" title="Ouverture"
                                                                                placeholder="Ouverture" type="number"><span class="input-group-addon">mm</span></div>
                                                                    </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div class="col-md-4">
                                                    <div class="box">
                                                        <div class="box-title" style="text-align: center">
                                                            <h4>
                                                                <span class="language_txt">Taille extérieur</span></h4>
                                                        </div>
                                                        <div class="box-body center">
                                                            <div class="form-group">
                                                                <label class="col-sm-4 control-label language_txt" style="font-size: 8pt; text-align: left;">Longueur extérieur</label><div class="col-sm-8">
                                                                        <div class='input-group'>
                                                                            <input id="PrdOutsideLength" class="form-control" name="PrdOutsideLength" title="Longueur"
                                                                                placeholder="Longueur" type="number"><span class="input-group-addon">mm</span></div>
                                                                    </div>
                                                            </div>
                                                            <div class="form-group">
                                                                <label class="col-sm-4 control-label language_txt" style="font-size: 8pt; text-align: left;">Largeur extérieur</label><div class="col-sm-8">
                                                                        <div class='input-group'>
                                                                            <input id="PrdOutsideWidth" class="form-control" name="PrdOutsideWidth" title="Largeur"
                                                                                placeholder="Largeur" type="number"><span class="input-group-addon">mm</span></div>
                                                                    </div>
                                                            </div>
                                                            <div class="form-group">
                                                                <label class="col-sm-4 control-label language_txt" style="font-size: 8pt; text-align: left;">Épaisseur</label><div class="col-sm-8">
                                                                        <div class='input-group'>
                                                                            <input id="PrdOutsideHeight" class="form-control" name="PrdOutsideHeight" title="Hauteur"
                                                                                placeholder="Épaisseur" type="number"><span class="input-group-addon">mm</span></div>
                                                                    </div>
                                                            </div>
                                                            <div class="form-group">
                                                                <label class="col-sm-4 control-label language_txt" style="font-size: 8pt; text-align: left;">Diamètre extérieur</label><div class="col-sm-8">
                                                                        <div class='input-group'>
                                                                            <input class="form-control" id="PrdOutsideDiameter" name="PrdOutsideDiameter" title=" Diamètre extérieur"
                                                                                placeholder="Diamètre extérieur" type="number"><span class="input-group-addon">mm</span></div>
                                                                    </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div class="col-md-4">
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="col-md-1" id="div_prd_supplier" style="display: none;">
                                <div class="box border inverse">
                                    <div class="box-title">
                                        <h4>
                                            <i class="fa fa-euro"></i><span class="language_txt">Fournisseur</span></h4>
                                    </div>
                                    <div class="box-body">
                                        <div class="form-horizontal center">
                                            <table cellpadding="0" cellspacing="0" border="0" class="table table-striped table-bordered table-hover">
                                                <thead id="thead_cost_plan_line">
                                                    <tr role="row">
                                                        <th rowspan="1" colspan="1" class="language_txt">Fournisseur</th>
                                                        <th rowspan="1" colspan="1" class="language_txt">Leur Réf.</th>
                                                        <th rowspan="1" colspan="1" class="language_txt">Prix</th>
                                                    </tr>
                                                </thead>
                                                <tbody id="tbody_suppliers" style="text-align: center !important">
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="separator">
                        </div>
                        <div class="row forview">
                            <div class="col-md-6">
                                <div class="box border inverse">
                                    <div class="box-title">
                                        <h4>
                                            <i class="fa fa-bars"></i><span class="language_txt">Catégorie</span></h4>
                                    </div>
                                    <div class="box-body">
                                        <div class="form-horizontal">
                                            <div class="row" style="margin-bottom: 20px;">
                                                <div class="col-md-4">
                                                </div>
                                                <div class="col-md-4" style="text-align: center;">
                                                    <button type="button" class="btn btn-inverse forview language_txt" onclick="return AddProductToCategory(0)">Ajouter dans une catégorie</button>
                                                </div>
                                                <div class="col-md-4">
                                                </div>
                                            </div>
                                            <div class="box-body">
                                                <div class="row">
                                                    <div class="form-horizontal" id="div_pcas">
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="col-md-6">
                                <div class="box border inverse">
                                    <div class="box-title">
                                        <h4>
                                            <i class="fa fa-bars"></i><span class="language_txt">Photo</span></h4>
                                    </div>
                                    <div class="box-body">
                                        <div class="form-horizontal">
                                            <div class="row" style="margin-bottom: 20px;">
                                                <div class="col-md-4">
                                                    <span>Numéro 0: s'afficher sur l'endroit PUBLICITE Numéro 1: l'image principale</span>
                                                </div>
                                                <div class="col-md-4" style="text-align: center;">
                                                    <button type="button" class="btn btn-inverse forview language_txt" onclick="return AddModifyImage(this, true)">Ajouter une photo</button>
                                                </div>
                                                <div class="col-md-4">
                                                </div>
                                            </div>
                                            <div class="row" id="div_pims">
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="separator">
                        </div>
                        <div class="row" id="div_attr_general" style="display: none;">
                            <div class="col-md-12">
                                <div class="box border inverse">
                                    <div class="box-title">
                                        <h4 style="overflow: hidden;">
                                            <i class="fa fa-bars"></i><span class="language_txt">Les attributs général</span>&nbsp; <span id="PtyName_general">
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
                        <div class="separator">
                        </div>
                        <div class="row forview forupdate" >
                            <div class="col-md-12">
                                <div class="box border inverse">
                                    <div class="box-title">
                                        <h4 style="overflow: hidden;">
                                            <i class="fa fa-bars"></i><span class="language_txt">Mode d'affichage</span>
                                        </h4>
                                    </div>
                                    <div class="box-body">
                                        <div class="row">
                                            <div class="form-horizontal center">
                                                <div class="make-switch switch-large" data-on="inverse" data-label-icon="fa fa-lightbulb-o"
                                                    data-on-label="LISTE" data-off-label="IMAGE">
                                                    <input type="checkbox" id="cbx_product_display_mode" onchange="changeDisplayMode(this)"/>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="row" id="div_produit_attr_content" style="display: none;">
                            <div class="col-md-12">
                                <div class="box border inverse">
                                    <div class="box-title">
                                        <h4 style="overflow: hidden;">
                                            <i class="fa fa-bars"></i><span class="language_txt">Les produits sous</span>&nbsp;<span id="PtyName"></span> <span
                                                style="font-size: 10pt;" id="PtyDescription"></span>
                                        </h4>
                                    </div>
                                    <div class="box-body" id="div_prd_attrs">
                                        <div class="modal-body center">
                                            <button type="button" class="btn btn-inverse forupdate forview language_txt" onclick="return AddNewProduct();">Ajouter un produit</button>
                                        </div>
                                        <div class="row">
                                            <div class="form-horizontal" id="div_all_prds_content">
                                            </div>
                                        </div>
                                        <div class="modal-body center">
                                            <button type="button" class="btn btn-inverse forupdate language_txt" onclick="return AddNewProduct();">Ajouter un produit</button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="row" id="div_produit_attr_content_List" style="display: none;">
                            <div class="col-md-12">
                                <div class="box border inverse">
                                    <div class="box-title">
                                        <h4 style="overflow: hidden;">
                                            <i class="fa fa-bars"></i><span class="language_txt">Les produits sous</span>&nbsp;<span id="PtyName_List"></span><span
                                                id="PtyDescription_List"></span>
                                        </h4>
                                        <div style="float: right">
                                            <h4>
                                                <span id="rst_all_pits_List"></span>
                                            </h4>
                                        </div>
                                    </div>
                                    <div class="box-body" id="div_prd_attrs_List">
                                        <div class="modal-body center">
                                            <button type="button" class="btn btn-inverse forupdate forview language_txt" onclick="return AddNewProduct();">Ajouter un produit</button>
                                            <%--<button type="button" class="btn btn-inverse forupdate forview language_txt" onclick="return DownloadBulkTemp();" title="Download Bulk Insert Template"><i class='fa fa-arrow-circle-o-down'></i></button>--%>
                                            <button type="button" class="btn btn-inverse forupdate forview language_txt" onclick="return LoadPrdAttr(2);" title="Insérer des produits par lots 批量插入产品"><i class='fa fa-arrow-circle-o-up'></i></button>
                                        </div>
                                        <div class="row">
                                            <div class="form-horizontal" id="div_all_pits_List" style="width: 100%; overflow-x: auto;">
                                            </div>
                                        </div>
                                        <div class="modal-body center">
                                            <button type="button" class="btn btn-inverse forupdate language_txt" onclick="return AddNewProduct();">Ajouter un produit</button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="row" id="div_prd_driver_acc">
                            <div class="col-md-4">
                                <div class="box border inverse">
                                    <div class="box-title">
                                        <h4 style="overflow: hidden;">
                                            <i class="fa fa-bars"></i><span class="language_txt">Les Drivers</span>
                                        </h4>
                                    </div>
                                    <div class="box-body">
                                        <div class="modal-body center">
                                            <button type="button" class="btn btn-inverse forupdate forview language_txt" onclick="return AddUpdate_Driver_Acc(1);">Ajouter un driver</button>
                                        </div>
                                        <div class="row">
                                            <div class="form-horizontal" id="div_all_driver">
                                            </div>
                                        </div>
                                        <div class="modal-body center">
                                            <button type="button" class="btn btn-inverse forupdate language_txt" onclick="return AddUpdate_Driver_Acc(1);">Ajouter un driver</button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="col-md-4">
                                <div class="box border inverse">
                                    <div class="box-title">
                                        <h4 style="overflow: hidden;">
                                            <i class="fa fa-bars"></i><span class="language_txt">Les Accessoires</span>
                                        </h4>
                                    </div>
                                    <div class="box-body">
                                        <div class="modal-body center">
                                            <button type="button" class="btn btn-inverse forupdate forview language_txt" onclick="return AddUpdate_Driver_Acc(2);">Ajouter un accessoire</button>
                                        </div>
                                        <div class="row">
                                            <div class="form-horizontal" id="div_all_acc">
                                            </div>
                                        </div>
                                        <div class="modal-body center">
                                            <button type="button" class="btn btn-inverse forupdate language_txt" onclick="return AddUpdate_Driver_Acc(2);">Ajouter un accessoire</button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="col-md-4">
                                <div class="box border inverse">
                                    <div class="box-title">
                                        <h4 style="overflow: hidden;">
                                            <i class="fa fa-bars"></i><span class="language_txt">Les Options</span>
                                        </h4>
                                    </div>
                                    <div class="box-body">
                                        <div class="modal-body center">
                                            <button type="button" class="btn btn-inverse forupdate forview language_txt" onclick="return AddUpdate_Driver_Acc(3);">Ajouter une option</button>
                                        </div>
                                        <div class="row">
                                            <div class="form-horizontal" id="div_all_opt">
                                            </div>
                                        </div>
                                        <div class="modal-body center">
                                            <button type="button" class="btn btn-inverse forupdate language_txt" onclick="return AddUpdate_Driver_Acc(3);">Ajouter une option</button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <!-- /FORMS -->
            <div class="separator">
            </div>
            <!-- SAMPLE -->
            <div class="row">
                <div class="col-md-12">
                    <div class="modal-body center forcreate">
                        <button type="button" class="btn btn-inverse language_txt" onclick="return js_create_update_product()">Créer le produit</button>
                    </div>
                    <div class="modal-body center forupdate">
                        <button type="button" class="btn btn-default language_txt" onclick="changeViewMode('view')">Annuler</button>
                        <button type="button" class="btn btn-inverse language_txt" onclick="return js_create_update_product()">Mettre à jour</button>
                    </div>
                    <div class="modal-body center forview">
                        <button type="button" class="btn btn-inverse language_txt" onclick="return delete_product_click_confirm(this)">Supprimer</button>
                        <button type="button" class="btn btn-inverse language_txt" onclick="changeViewMode('modify')">Modifier</button>
                        <button type="button" class="btn btn-inverse language_txt" onclick="getTechSheet()">Fiche Technique</button>
                    </div>
                </div>
            </div>
            <div class="footer-tools">
                <span class="go-top"><i class="fa fa-chevron-up"></i>Top </span>
            </div>
        </div>
        <!-- /CONTENT-->
    </div>
    <script>

        function getFileDataPopUp(myFile) {
            var file = myFile.files[0];
            var filename = file.name;
            if (filename) {
                $('#btnSubmitUploadFilePopUp').show();
                $('#btnCancelUploadFilePopUp').show();
                //$('#div_description_imagePopUp').show();
            } else {
                $('#btnSubmitUploadFilePopUp').hide();
                $('#btnCancelUploadFilePopUp').hide();
                //$('#div_description_imagePopUp').hide();
            }
            $('#uploadFileNamePopUp').text(filename);
            //alert(filename);
        }
        function hideUploadPopUp() {
            $('#btnSubmitUploadFilePopUp').hide();
            $('#btnCancelUploadFilePopUp').hide();
            //$('#div_description_imagePopUp').hide();
            $('#uploadFileNamePopUp').text('');
            return false;
        }
    </script>
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
