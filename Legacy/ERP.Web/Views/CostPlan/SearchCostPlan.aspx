<%@ Page Title="" Language="C#" MasterPageFile="~/Site.Master" AutoEventWireup="true"
    CodeBehind="SearchCostPlan.aspx.cs" Inherits="ERP.Web.Views.CostPlan.SearchCostPlan" %>
<%@ Import Namespace="System.Web.Configuration" %>

<asp:Content ID="Content1" ContentPlaceHolderID="HeadContent" runat="server">
    <title>Rechercher Devis</title>
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
    <script src="../../js/ERP/CostPlan/CostPlanSearch.js?V=<%= WebConfigurationManager.AppSettings["jsVersion"] %>"
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
                                <li><a href="#" class="language_txt">Rechercher un Devis</a> </li>
                            </ul>
                            <!-- /BREADCRUMBS -->
                            <div class="clearfix">
                                <h3 class="content-title pull-left language_txt">Devis</h3>
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
                                                <label class="col-sm-1 control-label language_txt">Code du devis</label>
                                                <div class="col-sm-2">
                                                    <input class="form-control" id="CplCode" name="CplCode" type="text" placeholder="Code du devis"
                                                        maxlength="200">
                                                </div>
                                                <label class="col-sm-1 control-label language_txt">Nom du devis</label>
                                                <div class="col-sm-2">
                                                    <input class="form-control" id="CplName" name="CplName" type="text" placeholder="Nom du devis"
                                                        maxlength="200">
                                                </div>
                                                <label class="col-sm-1 control-label language_txt">Raison sociale</label>
                                                <div class="col-sm-2">
                                                    <%--<input type="text" class="form-control" id="ClientCompanyName" name="ClientCompanyName" placeholder="Raison sociale" />--%>
                                                    <select id="Client" class="form-control" style="display: none;">
                                                    </select>
                                                    <input class='form-control' id='ClientList' name='ClientList' onkeyup="return js_clientChange(this)" placeholder="Raison sociale"/>
                                                </div>
                                                <label class="col-sm-1 control-label language_txt">Nom de l'affaire</label>
                                                <div class="col-sm-2">
                                                    <input class="form-control" id="PrjName" name="PrjName" type="text" placeholder="Nom du projet"
                                                        maxlength="200">
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <label class="col-sm-1 control-label language_txt">Code de l'affaire</label>
                                                <div class="col-sm-2">
                                                    <input class="form-control" id="PrjCode" name="PrjCode" type="text" placeholder="Code du projet"
                                                        maxlength="200">
                                                </div>
                                                <label class="col-sm-1 control-label language_txt">Contact client</label>
                                                <div class="col-sm-2">
                                                    <input type="text" class="form-control" id="CcoName" name="CcoName" placeholder="Contact client" />
                                                </div>
                                                <label class="col-sm-1 control-label language_txt">Status</label>
                                                <div class="col-sm-2">
                                                    <select class="form-control" id="CstId"></select>
                                                </div>
                                                <label class="col-sm-1 control-label language_txt">Mot clé</label>
                                                <div class="col-sm-2">
                                                    <input class="form-control" id="keyword" name="keyword" type="text" maxlength="200" placeholder="nom/description de produit / commentaire client/interne" />
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <label class="col-sm-1 control-label language_txt">Date de création du</label>
                                                <div class="col-sm-2">
                                                    <input type="text" class="form-control datepicker" id="CplDateCreationFrom" name="CplDateCreationFrom" placeholder="Date de création du" />
                                                </div>
                                                <label class="col-sm-1 control-label language_txt">Date de création au</label>
                                                <div class="col-sm-2">
                                                    <input type="text" class="form-control datepicker" id="CplDateCreationTo" name="CplDateCreationTo" placeholder="Date de création au" />
                                                </div>
                                                <label class="col-sm-1 control-label language_txt" style="color:#0077FF">Crée du site (bleu)</label>
                                                <div class="col-sm-2">
                                                    <input class="form-control" type="checkbox" id="cbx_from_site" />
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <div id="divCommentSearchFields">
                                                    
                                                </div>
                                            </div>
                                            <div class="modal-footer center">
                                                <button type="submit" class="btn btn-inverse start language_txt" onclick="return jsSearchCpl()">Rechercher</button>
                                                <button type="button" class="btn btn-inverse success language_txt" onclick="return createCostPlan()">Créer un devis</button>
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
                                        <button type="button" class="btn btn-inverse language_txt" id="btn_exportPdf_costplan" onclick="return ExportCplsPdf();" style="display: none;">Export PDF</button>
                                    </div>
                                    <div class="box-body" id="div_for_datatable" style="width: 100%; overflow-x: auto;">
                                        <table id="datatable_search_result" cellpadding="0" cellspacing="0" border="0" class="datatable table table-striped table-bordered table-hover">
                                            <thead id="thead_search_result">
                                                <tr>
                                                    <th></th>
                                                    <th class="language_txt">Nom du devis</th>
                                                    <th class="language_txt">Code du devis</th>
                                                    <th class="language_txt">Raison sociale</th>
                                                    <th class="language_txt">Contact</th>
                                                    <th class="language_txt">Nom du projet</th>
                                                    <th class="language_txt">Code du projet</th>
                                                    <th class="language_txt">Montant (Facturé) HT</th>
                                                    <th class="language_txt">Status</th>
                                                </tr>
                                            </thead>
                                            <tbody id="tbody_search_result">
                                            </tbody>
                                            <tfoot id="tfoot_search_result">
                                                <tr>
                                                    <th></th>
                                                   <th class="language_txt">Nom du devis</th>
                                                    <th class="language_txt">Code du devis</th>
                                                    <th class="language_txt">Raison sociale</th>
                                                    <th class="language_txt">Contact</th>
                                                    <th class="language_txt">Nom du projet</th>
                                                    <th class="language_txt">Code du projet</th>
                                                    <th class="language_txt">Montant (Facturé) HT</th>
                                                    <th class="language_txt">Status</th>
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
