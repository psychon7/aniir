<%@ Page Title="" Language="C#" MasterPageFile="~/Site.Master" AutoEventWireup="true"
    CodeBehind="SupplierProduct.aspx.cs" Inherits="ERP.Web.Views.Supplier.SupplierProduct" %>
<%@ Import Namespace="System.Web.Configuration" %>

<asp:Content ID="Content1" ContentPlaceHolderID="HeadContent" runat="server">
    <title>ERP - Produit & Fournisseur</title>
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
    <script src="../../js/ERP/Supplier/SupplierProduct.js?V=<%= WebConfigurationManager.AppSettings["jsVersion"] %>"
        type="text/javascript"></script>
    <label id="hf_prd_id" style="display: none;">
    </label>
    <div class="container">
        <div class="row">
            <div id="content" class="col-lg-12">
                <div class="row">
                    <div class="col-md-12">
                        <div class="page-header">
                            <!-- STYLER -->
                            <!-- /STYLER -->
                            <!-- BREADCRUMBS -->
                            <ul class="breadcrumb">
                                <li><i class="fa fa-home"></i><a href="../../Default.aspx">&nbsp;<span class="language_txt">Home</span></a> </li>
                                <li><a href="SupplierProductSearch.aspx">&nbsp;<span class="language_txt">Rechercher un produit de fournisseur</span></a>
                                </li>
                                <li>&nbsp;<span class="language_txt">Produit de fournisseur</span></li>
                            </ul>
                            <!-- /BREADCRUMBS -->
                            <div class="clearfix">
                                <h3 class="content-title pull-left">
                                    &nbsp;<span class="language_txt">Produit de fournisseur</span></h3>
                            </div>
                            <div class="description language_txt">Création, modification, consultation les produits de fournisseur</div>
                        </div>
                    </div>
                </div>
                <div class="row">
                    <div class="col-md-12">
                        <div class="row">
                            <div class="col-md-4">
                                <div class="box border inverse">
                                    <div class="box-title">
                                        <h4>
                                            <i class="fa fa-bars"></i><span class="language_txt">Information général</span></h4>
                                    </div>
                                    <div class="box-body" id="div_supplier">
                                        <div class="form-horizontal">
                                            <div class="form-group">
                                                <label class="col-sm-4 control-label language_txt" id="lb_client" pgid="Supplier.aspx" prms="supId"
                                                    flid="Supplier" onclick="return ExternLinkClick(this)" etid="SupFId">Raison sociale du fournisseur</label>
                                                <div class="col-sm-8">
                                                    <select id="SupId" class="form-control" required onchange="SupplierChanged(this)">
                                                    </select>
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <label class="col-sm-4 control-label language_txt">Référence</label>
                                                <div class="col-sm-8">
                                                    <input type="text" class="form-control" id="Reference" name="Reference" disabled="" />
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <label class="col-sm-4 control-label language_txt">Adresse 1</label>
                                                <div class="col-sm-8">
                                                    <input type="text" class="form-control" id="Address1" name="Address1" maxlength="200"
                                                        disabled="">
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <label class="col-sm-4 control-label language_txt">Adresse 2</label>
                                                <div class="col-sm-8">
                                                    <input type="text" class="form-control" id="Address2" name="Address2" maxlength="200"
                                                        disabled="">
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <label class="col-sm-4 control-label language_txt">Code postal</label>
                                                <div class="col-sm-8">
                                                    <input type="text" class="form-control" id="Postcode" name="Postcode" maxlength="10"
                                                        disabled="">
                                                </div>
                                            </div>
                                            <div class="form-group"> 
                                                <label class="col-sm-4 control-label language_txt">Ville</label>
                                                <div class="col-sm-8">
                                                    <input type="text" class="form-control" id="City" maxlength="200" disabled="">
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <label class="col-sm-4 control-label language_txt">Pays</label>
                                                <div class="col-sm-8">
                                                    <input type="text" class="form-control" id="Country" name="Country" maxlength="200"
                                                        disabled="">
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <label class="col-sm-4 control-label language_txt">Siren</label>
                                                <div class="col-sm-8">
                                                    <input type="text" class="form-control" id="Siren" name="Siren" maxlength="30" disabled="">
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <label class="col-sm-4 control-label language_txt">Siret</label>
                                                <div class="col-sm-8">
                                                    <input type="text" class="form-control" id="Siret" name="Siret" maxlength="30" disabled="">
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <label class="col-sm-4 control-label language_txt">TVA inter-com</label>
                                                <div class="col-sm-8">
                                                    <input type="text" class="form-control" id="VatIntra" name="VatIntra" maxlength="30"
                                                        disabled="">
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <label class="col-sm-4 control-label language_txt">Devise</label>
                                                <div class="col-sm-8">
                                                    <select class="form-control" id="CurId" name="CurId" disabled="">
                                                    </select>
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <label class="col-md-4 control-label language_txt">Commentaire pour Fournisseur</label>
                                                <div class="col-md-8">
                                                    <textarea rows="3" cols="5" name="Comment4Supplier" class="form-control" id="Comment4Supplier"
                                                        disabled=""></textarea></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="col-md-8">
                                <div class="box border inverse">
                                    <div class="box-title">
                                        <h4>
                                            <i class="fa fa-table"></i><span class="language_txt">Les produits</span>
                                        </h4>
                                        <span style="float: right" id="rst_spds"></span>
                                    </div>
                                    <div class="box-body">
                                        <div class="form-group ">
                                            <div class="col-sm-12">
                                                <div class="modal-body center">
                                                    <button type="button" class="btn btn-inverse language_txt" id="btn_create_product" onclick="return createProduct()"
                                                        style="display: none;">Créer un produit</button>
                                                </div>
                                            </div>
                                        </div>
                                        <div id="div_spds" style="width: 100%; overflow-x: auto;">
                                            <table id="dt_spds" cellpadding="0" cellspacing="0" border="0" class="datatable table table-striped table-bordered table-hover">
                                                <thead id="th_spds">
                                                    <tr>
                                                        <th class="language_txt">Type</th>
                                                        <th class="language_txt">Leur Réf</th>
                                                        <th class="language_txt">Notre Réf</th>
                                                        <th class="language_txt">Devise</th>
                                                        <th class="language_txt">Prix Normal</th>
                                                        <th class="language_txt">Prix Dimmable</th>
                                                        <th class="language_txt">Prix Dali</th>
                                                    </tr>
                                                </thead>
                                                <tbody id="tb_spds">
                                                </tbody>
                                                <tfoot id="tf_spds">
                                                    <tr>
                                                        <th class="language_txt">Type</th>
                                                        <th class="language_txt">Leur Réf</th>
                                                        <th class="language_txt">Notre Réf</th>
                                                        <th class="language_txt">Devise</th>
                                                        <th class="language_txt">Prix Normal</th>
                                                        <th class="language_txt">Prix Dimmable</th>
                                                        <th class="language_txt">Prix Dali</th>
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
                <!--- Cost Plan Lines -->
                <!--- /Cost Plan Lines -->
                <div class="footer-tools">
                    <span class="go-top"><i class="fa fa-chevron-up"></i>Top </span>
                </div>
            </div>
        </div>
        <!-- /CONTENT-->
    </div>
    <script type="text/javascript" src="../../js/jQuery-BlockUI/jquery.blockUI.min.js"></script>
    <!-- DATA TABLES -->
    <script type="text/javascript" src="../../js/datatables/media/js/jquery.dataTables.min.js?V=<%= WebConfigurationManager.AppSettings["jsVersion"] %>"></script>
    <script type="text/javascript" src="../../js/datatables/media/assets/js/datatables.min.js?V=<%= WebConfigurationManager.AppSettings["jsVersion"] %>"></script>
    <script type="text/javascript" src="../../js/datatables/extras/TableTools/media/js/TableTools.min.js"></script>
    <script type="text/javascript" src="../../js/datatables/extras/TableTools/media/js/ZeroClipboard.min.js"></script>
    <script type="text/javascript" src="../../js/jQuery-Cookie/jquery.cookie.min.js"></script>
    <script src="../../js/bootbox/bootbox.min.js" type="text/javascript"></script>
    <!--
    DATE PICKER -->
    <script type="text/javascript" src="../../js/datepicker/picker.js"></script>
    <script type="text/javascript" src="../../js/datepicker/picker.date.js"></script>
    <script type="text/javascript" src="../../js/datepicker/picker.time.js"></script>
    <!-- End DATE PICKER -->
</asp:Content>
