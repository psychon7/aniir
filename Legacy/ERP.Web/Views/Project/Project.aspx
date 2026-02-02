<%@ Page Title="" Language="C#" MasterPageFile="~/Site.Master" AutoEventWireup="true"
    CodeBehind="Project.aspx.cs" Inherits="ERP.Web.Views.Project.Project" %>
<%@ Import Namespace="System.Web.Configuration" %>

<asp:Content ID="Content1" ContentPlaceHolderID="HeadContent" runat="server">
    <title>ERP - Affaire</title>
    <link href="../../css/site.css" rel="stylesheet" type="text/css" />
    <!-- JQUERY UI DATE PICKER -->
    <link rel="stylesheet" type="text/css" href="../../js/jquery-ui-1.10.3.custom/css/custom-theme/jquery-ui-1.10.3.custom.min.css" />
    <!-- End JQUERY UI DATE PICKER -->
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
    <script src="../../js/ERP/Project/ProjectBaseJS.js?V=<%= WebConfigurationManager.AppSettings["jsVersion"] %>"
        type="text/javascript"></script>
    <script src="../../js/ERP/Project/Project.js?V=<%= WebConfigurationManager.AppSettings["jsVersion"] %>"
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
                                <li><a href="SearchProject.aspx">&nbsp;<span class="language_txt">Rechercher une Affaire</span></a> </li>
                                <li>&nbsp;<span class="language_txt">Affaire</span></li>
                                <li class="prjMenu a_pointer"><a onclick="goCostPlanList()">&nbsp;<span class="language_txt">Liste de Devis</span></a></li>
                                <li class="prjMenu a_pointer"><a onclick="goClientOrderList()">&nbsp;<span class="language_txt">Liste de Commande</span></a></li>
                                <li class="prjMenu a_pointer"><a onclick="goCinList()">&nbsp;<span class="language_txt">Liste de Facutre</span></a></li>
                            </ul>
                            <!-- /BREADCRUMBS -->
                            <div class="clearfix">
                                <h3 class="content-title pull-left">
                                    &nbsp;<span class="language_txt">Affaire</span></h3>
                            </div>
                            <div class="description language_txt">Création, modification, consultation une Affaire</div>
                        </div>
                    </div>
                </div>
                <div class="row" id="div_project">
                    <div class="col-md-12">
                        <div class="row">
                            <div class="col-md-12">
                                <div class="box border inverse">
                                    <div class="box-title">
                                        <h4>
                                            <i class="fa fa-bars"></i><span class="language_txt">Information général</span></h4>
                                    </div>
                                    <div class="box-body">
                                        <div class="form-horizontal" id="div_prj_info">
                                            <div class="form-group">
                                                <label class="col-sm-3 control-label fieldRequired language_txt">Nom de l'affaire</label>
                                                <div class="col-sm-9">
                                                    <input type="text" class="form-control" id="PrjName" name="PrjName" required maxlength="200" />
                                                </div>
                                            </div>
                                            <div class="form-group forview">
                                                <label class="col-sm-3 control-label language_txt">Code de l'affaire</label>
                                                <div class="col-sm-9">
                                                    <input type="text" class="form-control" id="PrjCode" name="PrjCode" disabled="" maxlength="200" />
                                                </div>
                                            </div>
                                            <div class="form-group">
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-12">
                        <div class="row">
                            <div class="col-md-12">
                                <div class="box border inverse">
                                    <div class="box-title">
                                        <h4>
                                            <i class="fa fa-globe"></i><span class ="language_txt">Informations de projet</span></h4>
                                    </div>
                                    <div class="box-body">
                                        <div class="form-horizontal">
                                            <div class="form-group">
                                                <label class="col-sm-2 control-label fieldRequired language_txt" id="lb_client" pgid="Client.aspx" prms="cliId" 
                                                    flid="Client" onclick="return ExternLinkClick(this)" etid="CliFId">Raison sociale du client</label>
                                                <div class="col-sm-4">
                                                    <%--<input type="text" class="form-control" list="Client" id="ip_Client" name="ip_Client"
                                                        required="" placeholder="Raison sociale du client" maxlength="200" oninput="js_clientChange(this)">
                                                    <datalist id="Client">
                                                    </datalist>--%>
                                                    <select id="Client" class="form-control" style="display: none;">
                                                    </select>
                                                    <input class='form-control' id='ClientList' name='ClientList' onkeyup="return js_clientChange(this)" />
                                                </div>
                                                <label class="col-sm-2 control-label language_txt">TVA</label>
                                                <div class="col-sm-4">
                                                    <select class="form-control" id="VatId" name="VatId">
                                                    </select>
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <label class="col-sm-2 control-label language_txt">Condition de paiement</label>
                                                <div class="col-sm-4">
                                                    <select class="form-control" id="PcoId" name="PcoId">
                                                    </select>
                                                </div>
                                                <label class="col-sm-2 control-label language_txt">Mode de paiement</label>
                                                <div class="col-sm-4">
                                                    <select class="form-control" id="PmoId" name="PmoId">
                                                    </select>
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <label class="col-sm-2 control-label language_txt">Text en tête</label>
                                                <div class="col-sm-4">
                                                    <textarea class="form-control" cols="3" rows="5" id="PrjHeaderText" name="PrjHeaderText"></textarea>
                                                </div>
                                                <label class="col-sm-2 control-label language_txt">Text du pied</label>
                                                <div class="col-sm-4">
                                                    <textarea class="form-control" cols="3" rows="5" id="PrjFooterText" name="PrjFooterText"></textarea>
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <label class="col-sm-2 control-label language_txt">Commentaire pour client</label>
                                                <div class="col-sm-4">
                                                    <textarea class="form-control" cols="3" rows="5" id="PrjClientComment" name="PrjClientComment"></textarea>
                                                </div>
                                                <label class="col-sm-2 control-label language_txt">Commentaire interne</label>
                                                <div class="col-sm-4">
                                                    <textarea class="form-control" cols="3" rows="5" id="PrjInterComment" name="PrjInterComment"></textarea>
                                                </div>
                                            </div>
                                            <div class="form-group"> 
                                                <label class="col-sm-2 control-label language_txt">Date de création</label>
                                                <div class="col-sm-4">
                                                    <div class="input-group">
                                                        <input class="form-control datepicker " id="_dCreationString" name="_dCreationString"
                                                            required="" /><span class="input-group-addon"><i class="fa fa-calendar"></i></span>
                                                    </div>
                                                </div> 
                                                <label class="col-sm-2 control-label forview forupdate f_updatedate language_txt">Date de mis à jours</label>
                                                <div class="col-sm-4  forview forupdate f_updatedate">
                                                    <div class="input-group">
                                                        <input class="form-control datepicker " id="_dUpdateString" name="_dUpdateString" /><span
                                                            class="input-group-addon"><i class="fa fa-calendar"></i></span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <div class="modal-body center forcreate">
                                                    <button type="button" class="btn btn-default language_txt" onclick="return false">Annuler</button>
                                                    <button type="button" class="btn btn-inverse language_txt" onclick="return CreateUpdateProject();">Créer</button>
                                                </div>
                                                <div class="modal-body center forupdate">
                                                    <button type="button" class="btn btn-default language_txt" onclick="changeViewMode('view')">Annuler</button>
                                                    <button type="button" class="btn btn-inverse language_txt" onclick="return CreateUpdateProject();">Mettre à jour</button>
                                                </div>
                                                <div class="modal-body center forview">
                                                    <button type="button" class="btn btn-inverse language_txt" onclick="return delete_project_confirm(this)">Supprimer</button>
                                                    <button type="button" class="btn btn-inverse language_txt" onclick="changeViewMode('modify')">Modifier</button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <!-- SAMPLE -->
                <div class="row">
                </div>
                <!-- /SAMPLE -->
                <div class="footer-tools">
                    <span class="go-top"><i class="fa fa-chevron-up"></i>Top </span>
                </div>
            </div>
            <!-- /CONTENT-->
        </div>
    </div>
    <script type="text/javascript" src="../../js/jQuery-BlockUI/jquery.blockUI.min.js"></script>
    <script type="text/javascript" src="../../js/datatables/extras/TableTools/media/js/ZeroClipboard.min.js"></script>
    <script type="text/javascript" src="../../js/jQuery-Cookie/jquery.cookie.min.js"></script>
    <script src="../../js/bootbox/bootbox.min.js" type="text/javascript"></script>
    <!-- DATE PICKER -->
    <script type="text/javascript" src="../../js/datepicker/picker.js"></script>
    <script type="text/javascript" src="../../js/datepicker/picker.date.js"></script>
    <script type="text/javascript" src="../../js/datepicker/picker.time.js"></script>
    <!-- End DATE PICKER -->
</asp:Content>
