<%@ Page Title="" Language="C#" MasterPageFile="~/Site.Master" AutoEventWireup="true"
    CodeBehind="SiteProject.aspx.cs" Inherits="ERP.Web.Views.Product.SiteProject" %>
<%@ Import Namespace="System.Web.Configuration" %>

<asp:Content ID="Content1" ContentPlaceHolderID="HeadContent" runat="server">
    <title>ERP - Projet</title>
    <!-- JQUERY UI DATE PICKER -->
    <link rel="stylesheet" type="text/css" href="../../js/jquery-ui-1.10.3.custom/css/custom-theme/jquery-ui-1.10.3.custom.min.css" />
    <!-- End JQUERY UI DATE PICKER -->
    <!-- DATA TABLES -->
    <link rel="stylesheet" type="text/css" href="../../js/datatables/media/assets/css/datatables.min.css" />
    <link rel="stylesheet" type="text/css" href="../../js/datatables/extras/TableTools/media/css/TableTools.min.css" />
    <link rel="stylesheet" type="text/css" href="../../js/datatables/media/css/jquery.dataTables.min.css" />
    <link href="../../css/site.css" rel="stylesheet" type="text/css" />
    <!-- FILE UPLOAD -->
    <link href="../../js/jquery-upload/css/jquery.fileupload.css" rel="stylesheet" type="text/css">
    <!-- COLORBOX -->
    <link rel="stylesheet" type="text/css" href="../../js/colorbox/colorbox.min.css" />
    <style>
        th
        {
            text-align: center !important;
        }
    </style>
</asp:Content>
<asp:Content ID="Content2" ContentPlaceHolderID="MainContent" runat="server">
    <label style="display: none;" id="hf_prd_id">
    </label>
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
    <script src="../../js/ERP/Product/SiteProjectJS.js?V=<%= WebConfigurationManager.AppSettings["jsVersion"] %>"
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
                                <li><i class="fa fa-home"></i><a href="../../Default.aspx">&nbsp;<span class="language_txt">Home</span></a> </li>
                                <li>&nbsp;<span class="language_txt">Projet (Site)</span></li>
                            </ul>
                            <!-- /BREADCRUMBS -->
                            <div class="clearfix">
                                <h3 class="content-title pull-left">
                                    &nbsp;<span class="language_txt">Projet</span></h3>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="row">
                    <div class="col-md-12">
                        <div class="row">
                            <div class="col-md-4" id="div_project">
                                <div class="box border inverse">
                                    <div class="box-title">
                                        <h4>
                                            <i class="fa fa-bars"></i><span class="language_txt">Projets</span></h4>
                                    </div>
                                    <div class="box-body" style="max-height: 700px; overflow-y: auto;">
                                        <div class="form-horizontal">
                                            <div class="form-group">
                                                <label class="col-sm-4 control-label language_txt">Sélectionner un projet</label>
                                                <div class="col-sm-8">
                                                    <select class="form-control" id="PrjId" onchange="PrjChange(this)">
                                                    </select>
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <label class="col-sm-4 control-label fieldRequired language_txt">Nom du projet</label>
                                                <div class="col-sm-8">
                                                    <input id="PrjName" class="form-control" />
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <label class="col-sm-4 control-label language_txt">Activé</label>
                                                <div class="col-sm-8">
                                                    <input id="PrjActived" type="checkbox" class="form-control" />
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <label class="col-sm-4 control-label language_txt">Projet Recommandé (sur page d'accueil)</label>
                                                <div class="col-sm-8">
                                                    <input id="PrjRecommended" type="checkbox" class="form-control" />
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <label class="col-sm-4 control-label language_txt">Date du projet</label>
                                                <div class="col-sm-8">
                                                    <div class="input-group">
                                                        <input id="PrjDate" class="form-control datepicker " />
                                                        <span class="input-group-addon"><i class="fa fa-calendar"></i></span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <label class="col-sm-4 control-label language_txt">Location</label>
                                                <div class="col-sm-8">
                                                    <input id="PrjLocation" class="form-control" />
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <label class="col-sm-4 control-label language_txt">Client</label>
                                                <div class="col-sm-8">
                                                    <input id="PrjClient" class="form-control" />
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <label class="col-sm-4 control-label language_txt">Désigner</label>
                                                <div class="col-sm-8">
                                                    <input id="PrjDesigner" class="form-control" />
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <label class="col-sm-4 control-label language_txt">Tags(séparer par ';')</label>
                                                <div class="col-sm-8">
                                                    <input id="PrjTag" rows="5" class="form-control" />
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <label class="col-sm-4 control-label language_txt">Description</label>
                                                <div class="col-sm-8">
                                                    <textarea id="PrjDescription" rows="5" class="form-control"></textarea>
                                                </div>
                                            </div>
                                            <div class="form-group center">
                                                <div class="forupdate forcreate">
                                                    <button id="btn_cancel" class="btn btn-default forupdate forcreate language_txt">Annuler</button>
                                                    <button id="btn_CreatUpdatePrj" class="btn btn-inverse forupdate forcreate language_txt" onclick="return CreateUpdatePrj(this)">Sauvgarder</button>
                                                </div>
                                                <div class="forview">
                                                    <button id="btn_modify" class="btn btn-inverse forview language_txt">Modifier</button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="col-md-4" id="div_all_prds">
                                <div class="box border inverse">
                                    <div class="box-title">
                                        <h4>
                                            <i class="fa fa-bars"></i><span class="language_txt">Produits</span></h4>
                                    </div>
                                    <div class="box-body" style="max-height: 700px; overflow-y: auto;">
                                        <div class="form-horizontal">
                                            <div class="form-group">
                                                <label class="col-sm-3 control-label language_txt">Produit</label>
                                                <div class="col-sm-8">
                                                    <input id="ProductName" class="form-control" />
                                                </div>
                                                <div class="col-sm-1">
                                                    <button class="btn btn-inverse" id="btn_addproduct" onclick="return addProduct()">
                                                        <i class='fa fa-plus'></i>
                                                    </button>
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <div class="col-sm-12" id="div_prds">
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="col-md-4" id="div_all_imgs">
                                <div class="box border inverse">
                                    <div class="box-title">
                                        <h4>
                                            <i class="fa fa-bars"></i><span class="language_txt">Images (N° 1 s'afficher sur le site)</span></h4>
                                    </div>
                                    <div class="box-body" style="max-height: 700px; overflow-y: auto;">
                                        <div class="form-horizontal">
                                            <div class="form-group center">
                                                <div>
                                                    <button id="btnAddImage" class="btn btn-inverse forview language_txt" pigid="0" order="0" onclick="return CreateUpdateImageClick(this)">Ajouter un Image</button>
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <div class="col-sm-12" id="div_images">
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
            <!-- /FORMS -->
            <div class="separator">
            </div>
            <!--- /Cost Plan Lines -->
            <div class="footer-tools">
                <span class="go-top"><i class="fa fa-chevron-up"></i>Top </span>
            </div>
        </div>
        <!-- /CONTENT-->
    </div>
    <script type="text/javascript" src="../../js/jQuery-BlockUI/jquery.blockUI.min.js"></script>
    <!-- DATE PICKER -->
    <script type="text/javascript" src="../../js/datepicker/picker.js"></script>
    <script type="text/javascript" src="../../js/datepicker/picker.date.js"></script>
    <script type="text/javascript" src="../../js/datepicker/picker.time.js"></script>
    <!-- End DATE PICKER -->
    <script src="../../js/bootbox/bootbox.min.js" type="text/javascript"></script>
    <!-- JQUERY -->
    <script type="text/javascript" src="../../js/isotope/jquery.isotope.min.js"></script>
    <script type="text/javascript" src="../../js/isotope/imagesloaded.pkgd.min.js"></script>
    <!-- COLORBOX -->
    <script type="text/javascript" src="../../js/colorbox/jquery.colorbox.min.js"></script>
</asp:Content>
