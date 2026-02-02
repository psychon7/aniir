<%@ Page Title="" Language="C#" MasterPageFile="~/Site.Master" AutoEventWireup="true"
    CodeBehind="PurchaseIntent.aspx.cs" Inherits="ERP.Web.Views.PurchaseIntent.PurchaseIntent" %>
<%@ Import Namespace="System.Web.Configuration" %>

<asp:Content ID="Content1" ContentPlaceHolderID="HeadContent" runat="server">
    <title>ERP - Intention d'achat</title>
    <!-- JQUERY UI DATE PICKER -->
    <link rel="stylesheet" type="text/css" href="../../js/jquery-ui-1.10.3.custom/css/custom-theme/jquery-ui-1.10.3.custom.min.css" />
    <!-- End JQUERY UI DATE PICKER -->
    <!-- DATA TABLES -->
    <link rel="stylesheet" type="text/css" href="../../js/datatables/media/assets/css/datatables.min.css" />
    <link rel="stylesheet" type="text/css" href="../../js/datatables/extras/TableTools/media/css/TableTools.min.css" />
    <link rel="stylesheet" type="text/css" href="../../js/datatables/media/css/jquery.dataTables.min.css" />
    <link href="../../css/site.css" rel="stylesheet" type="text/css" />
    <style>
        .att_label
        {
            text-align: center !important;
        }
        .label_left
        {
            text-align: left !important;
        }
        .label_right
        {
            text-align: right !important;
        }
        .ui-autocomplete
        {
            z-index: 9999 !important;
        }
        th
        {
            text-align: center !important;
        }
        .subTotal
        {
            background-color: #EAEBFF !important;
        }
        .total
        {
            background-color: #D3D6FF !important;
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
    <style>
        
    </style>
    <script src="../../js/ERP/ERPBaseJS.js?V=<%= WebConfigurationManager.AppSettings["jsVersion"] %>"
        type="text/javascript"></script>
    <script src="../../js/ERP/CommonJS.js?V=<%= WebConfigurationManager.AppSettings["jsVersion"] %>"
        type="text/javascript"></script>
    <script src="../../js/ERP/PurchaseIntent/PurchaseIntent.js?V=<%= WebConfigurationManager.AppSettings["jsVersion"] %>"
        type="text/javascript"></script>
    <script src="../../js/ERP/PurchaseIntent/PurchaseIntentLine.js?V=<%= WebConfigurationManager.AppSettings["jsVersion"] %>"
        type="text/javascript"></script>
    <%-- <script src="../../js/ERP/PurchaseIntent/PurchaseIntent.js" type="text/javascript"></script>--%>
    <!-- hidden fileds -->
    <label style="display: none;" id="hf_prd_id">
    </label>
    <label style="display: none;" id="hf_pit_id">
    </label>
    <!-- /hidden fileds -->
    <div class="container">
        <div class="row">
            <div id="content" class="col-md-12">
                <div class="row">
                    <div class="col-sm-12">
                        <div class="page-header">
                            <!-- STYLER -->
                            <!-- /STYLER -->
                            <!-- BREADCRUMBS -->
                            <ul class="breadcrumb">
                                <li><i class="fa fa-home"></i><a href="../../Default.aspx">&nbsp;<span class="language_txt">Home</span></a> </li>
                                <li><a href="SearchPurchaseIntent.aspx">&nbsp;<span class="language_txt">Rechercher une Intention</span></a> </li>
                                <li>&nbsp;<span class="language_txt">Intention d'achat</span></li>
                                <li class="a_pointer" id="li_sod" style="display: none;"><a onclick="goSod()">&nbsp;<span class="language_txt">Commande Fournisseur</span></a></li>
                            </ul>
                            <!-- /BREADCRUMBS -->
                            <div class="clearfix">
                                <h3 class="content-title pull-left">
                                    &nbsp;<span class="language_txt">Intention d'achat</span></h3>
                            </div>
                            <div class="description">
                                <span class="language_txt">Création, modification, consultation une Intention d'achat</span></div>
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
                                            <i class="fa fa-bars"></i><span class="language_txt">Information général</span></h4>
                                    </div>
                                    <div class="box-body">
                                        <div class="form-horizontal">
                                            <div class="form-group">
                                                <div class="col-md-6">
                                                </div>
                                                <div class="col-md-6 center">
                                                    <div class="modal-body center forupdate">
                                                        <button type="button" class="btn btn-default language_txt" onclick="changeViewMode('view')">Annuler</button>
                                                        <button type="button" class="btn btn-inverse language_txt" onclick="return js_create_update_item()">Mettre à jour</button>
                                                    </div>
                                                    <div class="modal-body center forview">
                                                        <button type="button" class="btn btn-inverse language_txt delete_right isclosed hasOrder" onclick="return delete_pin_confirm()">Supprimer</button>
                                                        <button type="button" class="btn btn-inverse language_txt" id="btn_generate_pdf" style="display: none;"
                                                            onclick="return downloadPdf(this)">Générer PDF</button>
                                                        <button type="button" class="btn btn-inverse modify_right language_txt" onclick="changeViewMode('modify')">Modifier</button>
                                                        <button type="button" class="btn btn-inverse modify_right isclosed hasOrder language_txt" id="btn_validate_costplan"
                                                            onclick="NewValiderPinClick()">Valider</button>
                                                    </div>
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <label class="col-sm-2 control-label language_txt">Nom de l'intention</label>
                                                <div class="col-sm-4">
                                                    <input type="text" class="form-control" id="PinName" name="PinName" maxlength="200" />
                                                </div>
                                                <label class="col-sm-2 control-label forview forupdate language_txt">Code de l'intention</label>
                                                <div class="col-sm-4 forview forupdate">
                                                    <input type="text" class="form-control" id="PinCode" name="PinCode" disabled="" />
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <label class="col-sm-2 control-label language_txt">Clôturé</label>
                                                <div class="col-sm-4">
                                                    <input type="checkbox" class="form-control" id="PinClosed" name="PinClosed" />
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <label class="col-sm-2 control-label language_txt">Commentaire pour fournisseur</label>
                                                <div class="col-sm-4">
                                                    <textarea class="form-control" cols="3" rows="5" id="SupplierComment" name="SupplierComment"></textarea>
                                                </div>
                                                <label class="col-sm-2 control-label language_txt">Commentaire interne</label>
                                                <div class="col-sm-4">
                                                    <textarea class="form-control" cols="3" rows="5" id="InterComment" name="InterComment"></textarea>
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <label class="col-sm-2 control-label forview forcreate language_txt">Date de création</label>
                                                <div class="col-sm-4 forview forcreate">
                                                    <div class="input-group">
                                                        <input class="form-control datepicker " id="DateCreation" name="DateCreation" required="" /><span
                                                            class="input-group-addon"><i class="fa fa-calendar"></i></span>
                                                    </div>
                                                </div>
                                                <label class="col-sm-2 control-label forview language_txt">Date de mis à jours</label>
                                                <div class="col-sm-4 forview ">
                                                    <div class="input-group">
                                                        <input class="form-control datepicker " id="DateUpdate" name="DateUpdate" disabled="" /><span
                                                            class="input-group-addon"><i class="fa fa-calendar"></i></span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div class="form-group forview">
                                                <label class="col-sm-2 control-label language_txt">Créateur</label>
                                                <div class="col-sm-4">
                                                    <input class="form-control" id="CreatorName" name="CreatorName" />
                                                </div>
                                                <div class="col-sm-6">
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <div class="modal-body center forcreate">
                                                    <button type="button" class="btn btn-inverse language_txt" onclick="return js_create_update_item()">Créer</button>
                                                </div>
                                                <div class="modal-body center forupdate">
                                                    <button type="button" class="btn btn-default language_txt" onclick="changeViewMode('view')">Annuler</button>
                                                    <button type="button" class="btn btn-inverse language_txt" onclick="return js_create_update_item()">Mettre à jour</button>
                                                </div>
                                                <div class="modal-body center forview">
                                                    <button type="button" class="btn btn-inverse modify_right isclosed hasOrder language_txt" onclick="return delete_costplan_click_confirm(this)">Supprimer</button>
                                                    <button type="button" class="btn btn-inverse modify_right language_txt" onclick="changeViewMode('modify')">Modifier</button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="row forview">
                    <div class="col-md-12">
                        <div class="row">
                            <div class="col-md-12">
                                <div class="box border inverse">
                                    <div class="box-title">
                                        <h4 style="overflow: hidden;">
                                            <i class="fa fa-bars"></i><span class="language_txt">Les lignes d'intention</span>&nbsp; <span id="PtyName_general">
                                            </span>
                                        </h4>
                                    </div>
                                    <div class="box-body">
                                        <div class="modal-body center forview">
                                            <button type="button" class="btn btn-inverse forupdate modify_right isclosed hasOrder language_txt"
                                                onclick="setAddUpdateLine();">Ajouter une Ligne</button>
                                        <button type="button" class="btn btn-danger language_txt" id="btn_create_sod" onclick="return CreateSodClick();" style="display: none;">Créer la commande fournisseur</button>
                                            <button type="button" class="btn btn-inverse forupdate language_txt" onclick="importerExcel();">Importer Excel</button>
                                        </div>
                                        <div class="form-horizontal center" style="width: 100%; overflow-x: auto;">
                                            <table cellpadding="0" cellspacing="0" border="0" class="table table-striped table-bordered table-hover">
                                                <thead id="thead_cost_plan_line">
                                                    <tr role="row">
                                                        <th rowspan="1" colspan="1">
                                                            <input type='checkbox' onclick='selectAllPils(this)'/>
                                                        </th>
                                                        <th rowspan="1" colspan="1" class="language_txt">Ordre</th>
                                                        <th rowspan="1" colspan="1" class="language_txt">Client</th>
                                                        <th rowspan="1" colspan="1" class="language_txt">Deadline</th>
                                                        <th rowspan="1" colspan="1" class="language_txt">Produit</th>
                                                        <th rowspan="1" colspan="1" class="language_txt">Notre Réf</th>
                                                        <th rowspan="1" colspan="1" class="language_txt">Fournisseur</th>
                                                        <th rowspan="1" colspan="1" class="language_txt">Image</th>
                                                        <th rowspan="1" colspan="1" class="language_txt">Description</th>
                                                        <th rowspan="1" colspan="1" class="language_txt">Quantité</th>
                                                        <th rowspan="1" colspan="1" class="language_txt">Logistique</th>
                                                        <th rowspan="1" colspan="1" class="modify_right isclosed hasOrder">
                                                        </th>
                                                    </tr>
                                                </thead>
                                                <tbody id="tbody_lines" style="text-align: center !important">
                                                </tbody>
                                            </table>
                                        </div>
                                        <div class="modal-body center forview">
                                            <button type="button" class="btn btn-inverse forupdate modify_right isclosed language_txt" onclick="setAddUpdateLine();">Ajouter une Ligne</button>
                                            <button type="button" class="btn btn-inverse forupdate language_txt" onclick="importerExcel();">Importer Excel</button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="row forview" id="div_sols">
                    <div class="col-md-12">
                        <div class="row">
                            <div class="col-md-12">
                                <div class="box border inverse">
                                    <div class="box-title">
                                        <h4 style="overflow: hidden;">
                                            <i class="fa fa-bars"></i><span class="language_txt">Les commandes fournisseur</span>&nbsp; <span id="span_sol_count"></span>
                                        </h4>
                                    </div>
                                    <div class="box-body">
                                        <div class="form-horizontal center" style="width: 100%; overflow-x: auto;">
                                            <table cellpadding="0" cellspacing="0" border="0" class="table table-striped table-bordered table-hover">
                                                <thead id="thead1">
                                                    <tr role="row">
                                                        <th rowspan="1" colspan="1" class="language_txt">Fournisseur</th>
                                                        <th rowspan="1" colspan="1" class="language_txt">Code de la commande</th>
                                                        <th rowspan="1" colspan="1" class="language_txt">Prix Total H.T.</th>
                                                        <th rowspan="1" colspan="1" class="language_txt">Prix Total T.T.C.</th>
                                                    </tr>
                                                </thead>
                                                <tbody id="tbody_sods" style="text-align: center !important">
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <!--- /Cost Plan Lines -->
            <div class="footer-tools">
                <span class="go-top"><i class="fa fa-chevron-up"></i>Top </span>
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
