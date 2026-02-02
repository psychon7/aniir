<%@ Page Title="" Language="C#" MasterPageFile="~/Site.Master" AutoEventWireup="true"
    CodeBehind="SearchDeliveryForm.aspx.cs" Inherits="ERP.Web.Views.DeliveryForm.SearchDeliveryForm" %>
<%@ Import Namespace="System.Web.Configuration" %>

<asp:Content ID="Content1" ContentPlaceHolderID="HeadContent" runat="server">
    <title>Rechercher Bon de livraison</title>
    <!-- JQUERY UI DATE PICKER -->
    <link rel="stylesheet" type="text/css" href="../../js/jquery-ui-1.10.3.custom/css/custom-theme/jquery-ui-1.10.3.custom.min.css" />
    <!-- End JQUERY UI DATE PICKER -->
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
    <script src="../../js/ERP/DeliveryForm/DeliveryFormSearch.js?V=<%= WebConfigurationManager.AppSettings["jsVersion"] %>"
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
                                <li><a href="#"><span class="language_txt">Rechercher une bon de livraison</span></a> </li>
                            </ul>
                            <!-- /BREADCRUMBS -->
                            <div class="clearfix">
                                <h3 class="content-title pull-left">
                                    <span class="language_txt">Bon de livraison</span></h3>
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
                                        <h4>
                                            <i class="fa fa-bars"></i><span class="language_txt">Critère de recherche</span></h4>
                                    </div>
                                    <div class="box-body" id="divSearchCondition">
                                        <div class="form-horizontal">
                                            <div class="form-group">
                                                <label class="col-sm-2 control-label language_txt">Code de BL</label>
                                                <div class="col-sm-2">
                                                    <input class="form-control" id="DfoCode" name="DfoCode" type="text" placeholder="Nom de la commande"
                                                        maxlength="200">
                                                </div>
                                                <label class="col-sm-2 control-label language_txt">Raison sociale</label>
                                                <div class="col-sm-2">
                                                    <%--<input type="text" class="form-control" id="ClientCompanyName" name="ClientCompanyName" placeholder="Raison sociale" />--%>
                                                    <select id="Client" class="form-control" style="display: none;">
                                                    </select>
                                                    <input class='form-control' id='ClientList' name='ClientList' onkeyup="return js_clientChange(this)" placeholder="Raison sociale"/>
                                                </div>
                                                <label class="col-sm-2 control-label language_txt">Contact client</label>
                                                <div class="col-sm-2">
                                                    <input type="text" class="form-control" id="CcoName" name="CcoName" placeholder="Contact client" />
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <label class="col-sm-2 control-label language_txt">Code de BC</label>
                                                <div class="col-sm-2">
                                                    <input class="form-control" id="CodCode" name="CodCode" type="text" placeholder="Code de la commande"
                                                        maxlength="200">
                                                </div>
                                                <label class="col-sm-2 control-label language_txt">Nom de BC</label>
                                                <div class="col-sm-2">
                                                    <input class="form-control" id="CodName" name="CodName" type="text" placeholder="Code de bon de livraison"
                                                        maxlength="200">
                                                </div>
                                                <label class="col-sm-2 control-label language_txt">Nom du devis</label>
                                                <div class="col-sm-2">
                                                    <input class="form-control" id="CplName" name="CplName" type="text" placeholder="Nom du devis"
                                                        maxlength="200">
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <label class="col-sm-2 control-label language_txt">Code du devis</label>
                                                <div class="col-sm-2">
                                                    <input class="form-control" id="CplCode" name="CplCode" type="text" placeholder="Code du devis"
                                                        maxlength="200">
                                                </div>
                                                <label class="col-sm-2 control-label language_txt">Code de l'affaire</label>
                                                <div class="col-sm-2">
                                                    <input class="form-control" id="PrjCode" name="PrjCode" type="text" placeholder="Code du projet"
                                                        maxlength="200">
                                                </div>
                                                <label class="col-sm-2 control-label language_txt">Nom de l'affaire</label>
                                                <div class="col-sm-2">
                                                    <input class="form-control" id="PrjName" name="PrjName" type="text" placeholder="Nom du projet"
                                                        maxlength="200">
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <label class="col-sm-2 control-label language_txt">Date de création du</label>
                                                <div class="col-sm-2">
                                                    <input type="text" class="form-control datepicker" id="DfoDateCreationFrom" name="DfoDateCreationFrom" placeholder="Date de création du" />
                                                </div>
                                                <label class="col-sm-2 control-label language_txt">Date de création au</label>
                                                <div class="col-sm-2">
                                                    <input type="text" class="form-control datepicker" id="DfoDateCreationTo" name="DfoDateCreationTo" placeholder="Date de création au" />
                                                </div>
                                                <label class="col-sm-1 control-label language_txt" title="S'afficher seulement les BL déjà livrées">Livré</label>
                                                <div class="col-sm-1">
                                                    <input class="form-control" type="checkbox" id="cbx_only_deliveried"  title="S'afficher seulement les BL déjà livrées"/>
                                                </div>
                                                <label class="col-sm-1 control-label language_txt" title="S'afficher seulement les BL déjà facturées">Facturé</label>
                                                <div class="col-sm-1">
                                                    <input class="form-control" type="checkbox" id="cbx_only_invoiced" title="S'afficher seulement les BL déjà facturées"/>
                                                </div>
                                            </div>
                                            <div id="divPtySearchFields">
                                            </div>
                                            <div class="modal-footer center">
                                                <button type="submit" class="btn btn-inverse start rt_read language_txt" onclick="return jsSearchDfo()">Rechercher</button>
                                                <button type="button" class="btn btn-inverse success rt_read language_txt" onclick="return createDeliveryForm()">Créer</button>
                                                <button type="button" class="btn btn-inverse success language_txt" id="bnt_download_bls" style="display: none;" onclick="return downloadAllBls()">Télécharger les BLs</button>
                                                <button type="button" class="btn btn-inverse success language_txt" id="btn_create_cin_bl" style="display: none;" onclick="return CreateCinFromBls()">Créer les factures</button>
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
                                            <i class="fa fa-table"></i><span class="language_txt"></span>Résultat
                                        </h4>
                                        <span style="float: right" id="result_count"></span>
                                    </div>
                                    <div class="box-body" id="div_for_datatable" style="width: 100%; overflow-x: auto;">
                                        <table id="datatable_search_result" cellpadding="0" cellspacing="0" border="0" class="datatable table table-striped table-bordered table-hover">
                                            <thead id="thead_search_result">
                                            </thead>
                                            <tbody id="tbody_search_result">
                                            </tbody>
                                            <tfoot id="tfoot_search_result">
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
