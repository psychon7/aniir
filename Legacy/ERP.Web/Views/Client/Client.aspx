<%@ Page Title="" Language="C#" MasterPageFile="~/Site.Master" AutoEventWireup="true"
    CodeBehind="Client.aspx.cs" Inherits="ERP.Web.Views.Client.Client" %>

<%@ Import Namespace="System.Web.Configuration" %>

<%--<%@ Register TagPrefix="uc" TagName="ucCco" Src="UC/UCContactClient.ascx" %>--%>
<asp:Content ID="Content1" ContentPlaceHolderID="HeadContent" runat="server">
    <title>ERP - Client</title>
    <!-- DATA TABLES -->
    <!-- JQUERY UI DATE PICKER -->
    <link rel="stylesheet" type="text/css" href="../../js/jquery-ui-1.10.3.custom/css/custom-theme/jquery-ui-1.10.3.custom.min.css" />
    <!-- End JQUERY UI DATE PICKER -->
    <!-- DATA TABLES -->
    <link rel="stylesheet" type="text/css" href="../../js/datatables/media/assets/css/datatables.min.css" />
    <link rel="stylesheet" type="text/css" href="../../js/datatables/extras/TableTools/media/css/TableTools.min.css" />
    <link rel="stylesheet" type="text/css" href="../../js/datatables/media/css/jquery.dataTables.min.css" />
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
    <script src="../../js/ERP/Client/ClientJS.js?V=<%= WebConfigurationManager.AppSettings["jsVersion"] %>"
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
                                <li><a href="../../Views/Client/SearchClient.aspx">&nbsp;<span class="language_txt">Rechercher un client</span></a>
                                </li>
                                <li><span class="language_txt">Client</span></li>
                            </ul>
                            <!-- /BREADCRUMBS -->
                            <div class="clearfix">
                                <h3 class="content-title pull-left">
                                    <span class="language_txt" id="span_pagetitle">Client</span></h3>
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
                            <div class="col-md-5">
                                <div class="box border inverse">
                                    <div class="box-title">
                                        <h4>
                                            <i class="fa fa-bars"></i><span class="language_txt">Information général</span></h4>
                                    </div>
                                    <div class="box-body">
                                        <div class="form-horizontal">
                                            <div class="form-group">
                                                <label class="col-sm-3 control-label language_txt">Type de client</label>
                                                <div class="col-sm-9">
                                                    <div class="form-group" id="div_cty">
                                                        <%--<select class="form-control" id="CtyId" name="CtyId">
                                                    </select>--%>
                                                    </div>
                                                </div>
                                            </div>
                                            <div class="form-group" id="div_CompanyName">
                                                <label class="col-sm-3 control-label language_txt">Raison sociale</label>
                                                <div class="col-sm-9">
                                                    <input class="form-control" id="CompanyName" name="CompanyName" type="text" placeholder="Raison sociale"
                                                        onblur="js_CheckClientExisted(this)" required maxlength="200">
                                                </div>
                                            </div>
                                            <div class="form-group" id="div_abbr">
                                                <label class="col-sm-3 control-label language_txt">Abbreviation</label>
                                                <div class="col-sm-9">
                                                    <input class="form-control" id="CliAbbr" name="CliAbbr" type="text" placeholder="Abbreviation" maxlength="200">
                                                </div>
                                            </div>
                                            <div class="form-group forview">
                                                <label class="col-sm-3 control-label language_txt">Référence</label>
                                                <div class="col-sm-9">
                                                    <input type="text" class="form-control" id="Reference" name="Reference" placeholder="Référence de client"
                                                        disabled="">
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <label class="col-sm-3 control-label language_txt">Adresse 1</label>
                                                <div class="col-sm-9">
                                                    <input type="text" class="form-control" id="Address1" name="Address1" placeholder="Adresse 1"
                                                        maxlength="200">
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <label class="col-sm-3 control-label language_txt">Adresse 2</label>
                                                <div class="col-sm-9">
                                                    <input type="text" class="form-control" id="Address2" name="Address2" placeholder="Adresse 2"
                                                        maxlength="200">
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <label class="col-sm-3 control-label language_txt">Code postal</label>
                                                <div class="col-sm-9">
                                                    <input type="text" class="form-control" id="Postcode" name="Postcode" onkeyup="getCommuneName(this,'City')"
                                                        placeholder="Code postal" maxlength="10">
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <label class="col-sm-3 control-label language_txt">Ville</label>
                                                <div class="col-sm-9">
                                                    <input type="text" class="form-control" list="City" id="ip_City" placeholder="Ville"
                                                        oninput="communeChange('ip_City','City','Postcode')" maxlength="200">
                                                    <datalist id="City">
                                                    </datalist>
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <label class="col-sm-3 control-label language_txt">Pays</label>
                                                <div class="col-sm-9">
                                                    <input type="text" class="form-control" id="Country" name="Country" placeholder="Pays"
                                                        maxlength="200">
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <label class="col-sm-3 control-label language_txt">Siren</label>
                                                <div class="col-sm-9">
                                                    <input type="text" class="form-control" id="Siren" name="Siren" placeholder="Siren"
                                                        maxlength="30">
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <label class="col-sm-3 control-label language_txt">Siret</label>
                                                <div class="col-sm-9">
                                                    <input type="text" class="form-control" id="Siret" name="Siret" placeholder="Siret"
                                                        maxlength="30">
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <label class="col-sm-3 control-label language_txt">TVA inter-com (CEE)</label>
                                                <div class="col-sm-9">
                                                    <input type="text" class="form-control" id="VatIntra" name="VatIntra" placeholder="TVA intracommunautaire"
                                                        maxlength="30">
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <label class="col-sm-3 control-label language_txt">Devise</label>
                                                <div class="col-sm-9">
                                                    <select class="form-control" id="CurId" name="CurId">
                                                    </select>
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <label class="col-sm-3 control-label language_txt">Commercial 1</label>
                                                <div class="col-sm-9">
                                                    <select class="form-control" id="UsrIdCom1" name="UsrIdCom1">
                                                    </select>
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <label class="col-sm-3 control-label language_txt">Commercial 2</label>
                                                <div class="col-sm-9">
                                                    <select class="form-control" id="UsrIdCom2" name="UsrIdCom2">
                                                    </select>
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <label class="col-sm-3 control-label language_txt">Commercial 3</label>
                                                <div class="col-sm-9">
                                                    <select class="form-control" id="UsrIdCom3" name="UsrIdCom3">
                                                    </select>
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <label class="col-sm-2 control-label language_txt">Activé</label>
                                                <div class="col-sm-2">
                                                    <div class="checker" style="text-align: center;">
                                                        <span class="">
                                                            <input type="checkbox" class="form-control" id="Isactive" name="Isactive" checked="true" class="uniform"
                                                                value="">
                                                        </span>
                                                    </div>
                                                </div>
                                                <label class="col-sm-2 control-label language_txt">Détail</label>
                                                <div class="col-sm-2">
                                                    <div class="checker" style="text-align: center;">
                                                        <span class="">
                                                            <input type="checkbox" class="form-control" id="ShowDetail" name="ShowDetail" checked="true" class="uniform" value="">
                                                        </span>
                                                    </div>
                                                </div>
                                                <label class="col-sm-2 control-label language_txt">Bloqué</label>
                                                <div class="col-sm-2">
                                                    <div class="checker" style="text-align: center;">
                                                        <span class="">
                                                            <input type="checkbox" class="form-control" id="Isblocked" name="Isblocked" class="uniform" value="">
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <label class="col-sm-3 control-label language_txt" title="Le début de la période est le ou les jour(s) d'exécution de la facturation. (Ex: le 5 et le 25 du mois en cours)">Jour de facturation (?)</label>
                                                <div class="col-sm-3">
                                                    <select class="form-control" id="InvoiceDay" name="InvoiceDay">
                                                        <option></option>
                                                        <option>1</option>
                                                        <option>2</option>
                                                        <option>3</option>
                                                        <option>4</option>
                                                        <option>5</option>
                                                        <option>6</option>
                                                        <option>7</option>
                                                        <option>8</option>
                                                        <option>9</option>
                                                        <option>10</option>
                                                        <option>11</option>
                                                        <option>12</option>
                                                        <option>13</option>
                                                        <option>14</option>
                                                        <option>15</option>
                                                        <option>16</option>
                                                        <option>17</option>
                                                        <option>18</option>
                                                        <option>19</option>
                                                        <option>20</option>
                                                        <option>21</option>
                                                        <option>22</option>
                                                        <option>23</option>
                                                        <option>24</option>
                                                        <option>25</option>
                                                        <option>26</option>
                                                        <option>27</option>
                                                        <option>28</option>
                                                        <option>29</option>
                                                        <option>30</option>
                                                        <option selected>31</option>
                                                    </select>
                                                </div>
                                                <label class="col-sm-4 control-label language_txt">Dernier jour du mois</label>
                                                <div class="col-sm-2">
                                                    <div class="checker" style="text-align: center;">
                                                        <span class="">
                                                            <input type="checkbox" class="form-control" id="InvoiceDayIsLastDay" name="InvoiceDayIsLastDay" class="uniform"
                                                                value="">
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <label class="col-md-3 control-label language_txt">Commentaire pour client</label>
                                                <div class="col-md-9">
                                                    <textarea rows="3" cols="5" name="Comment4Client" class="form-control" id="Comment4Client"></textarea>
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
                                            <i class="fa fa-bars"></i><span class="language_txt">Information supplémentaire</span></h4>
                                    </div>
                                    <div class="box-body">
                                        <div class="form-horizontal">
                                            <div class="form-group">
                                                <label class="col-sm-3 control-label language_txt">TVA</label>
                                                <div class="col-sm-9">
                                                    <select class="form-control" id="VatId" name="VatId">
                                                    </select>
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <label class="col-sm-3 control-label language_txt">Activité</label>
                                                <div class="col-sm-9">
                                                    <select class="form-control" id="ActId" name="ActId">
                                                    </select>
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <label class="col-sm-3 control-label language_txt">Condition de paiement</label>
                                                <div class="col-sm-9">
                                                    <select class="form-control" id="PcoId" name="PcoId">
                                                    </select>
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <label class="col-sm-3 control-label language_txt">Mode de paiement</label>
                                                <div class="col-sm-9">
                                                    <select class="form-control" id="PmoId" name="PmoId">
                                                    </select>
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <label class="col-md-3 control-label language_txt">Téléphone 1</label>
                                                <div class="col-md-9">
                                                    <div class="input-group">
                                                        <span class="input-group-addon"><i class="fa fa-phone"></i></span>
                                                        <input type="text" class="form-control" id="Tel1" name="Tel1" data-mask="" maxlength="20">
                                                    </div>
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <label class="col-md-3 control-label language_txt">Téléphone 2</label>
                                                <div class="col-md-9">
                                                    <div class="input-group">
                                                        <span class="input-group-addon"><i class="fa fa-phone"></i></span>
                                                        <input type="text" class="form-control" id="Tel2" name="Tel2" data-mask="" maxlength="20">
                                                    </div>
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <label class="col-sm-3 control-label language_txt">Fax</label>
                                                <div class="col-sm-9">
                                                    <div class="input-group">
                                                        <span class="input-group-addon"><i class="fa fa-phone-square"></i></span>
                                                        <input type="text" class="form-control" id="Fax" name="Fax" data-mask="" maxlength="20">
                                                    </div>
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <label class="col-sm-3 control-label language_txt">Portable</label>
                                                <div class="col-sm-9">
                                                    <div class="input-group">
                                                        <span class="input-group-addon"><i class="fa fa-mobile-phone"></i></span>
                                                        <input type="text" class="form-control" id="Cellphone" name="Cellphone" data-mask=""
                                                            maxlength="20">
                                                    </div>
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <label class="col-sm-3 control-label language_txt">Email</label>
                                                <div class="col-sm-9">
                                                    <div class="input-group">
                                                        <span class="input-group-addon">@</span>
                                                        <input type="email" id="Email" name="Email" class="form-control" placeholder="Email"
                                                            maxlength="100">
                                                    </div>
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <label class="col-sm-3 control-label language_txt">Email comptabilité</label>
                                                <div class="col-sm-9">
                                                    <div class="input-group">
                                                        <span class="input-group-addon">@</span>
                                                        <input type="email" id="CliAccountingEmail" name="CliAccountingEmail" class="form-control"
                                                            placeholder="Email comptabilité" maxlength="100">
                                                    </div>
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <label class="col-sm-3 control-label language_txt">Recevoir le Newsletter</label>
                                                <div class="col-sm-1">
                                                    <div class="checker" style="text-align: center;">
                                                        <span class="">
                                                            <input type="checkbox" class="form-control" id="RecieveNewsletter" name="RecieveNewsletter" class="uniform"
                                                                value="">
                                                        </span>
                                                    </div>
                                                </div>
                                                <div class="col-sm-8">
                                                    <div class="input-group">
                                                        <span class="input-group-addon">@</span>
                                                        <input type="email" id="NewsletterEmail" name="NewsletterEmail" class="form-control"
                                                            placeholder="Newsletter Email" maxlength="20">
                                                    </div>
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <label class="col-md-3 control-label language_txt">Commentaire interne</label>
                                                <div class="col-md-9">
                                                    <textarea rows="3" cols="5" name="Comment4Interne" class="form-control" id="Comment4Interne"></textarea>
                                                </div>
                                            </div>
                                            <div class="form-group" style="display: none;">
                                                <label class="col-sm-3 control-label language_txt">Pdf version</label>
                                                <div class="col-sm-9">
                                                    <input type="text" class="form-control" id="CliPdfVersion" name="CliPdfVersion"
                                                        maxlength="30" />
                                                </div>
                                            </div>
                                            <div class="form-group forview">
                                                <label class="col-md-3 control-label language_txt">Date de mise à jour</label>
                                                <div class="col-md-9">
                                                    <input type="text" class="form-control" id="DateUpdate" name="DateUpdate">
                                                </div>
                                            </div>
                                            <div class="form-group forview forcreate">
                                                <label class="col-md-3 control-label language_txt">Date de création</label>
                                                <div class="col-md-9">
                                                    <div class="input-group">
                                                        <input type="text" class="form-control datepicker " id="DateCreation" name="DateCreation"><span
                                                            class="input-group-addon  "><i class="fa fa-calendar"></i></span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div class="modal-footer center forcreate">
                                                <button type="button" class="btn btn-default language_txt">Annuler</button>
                                                <button type="button" class="btn btn-inverse language_txt" onclick="return js_CheckClientExisted_for_create_update('CompanyName');">Sauvegarder</button>
                                            </div>
                                            <div class="modal-footer center forview">
                                                <button type="button" class="btn btn-inverse language_txt" onclick="changeViewMode('modify')">Modifier</button>
                                                <button type="button" class="btn btn-inverse language_txt" onclick="return delete_client_confirm()">Supprimer</button>
                                            </div>
                                            <div class="modal-footer center forupdate">
                                                <button type="button" class="btn btn-default language_txt" onclick="changeViewMode('view')">Annuler</button>
                                                <button type="button" class="btn btn-inverse language_txt" onclick="return js_CheckClientExisted_for_create_update('CompanyName');">Mettre à jours</button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="col-md-3 forview">
                                <div class="box border inverse">
                                    <div class="box-title">
                                        <h4>
                                            <i class="fa fa-bars"></i><span class="language_txt" id="span_client_deleg_title"></span></h4>
                                    </div>
                                    <div class="box-body">
                                        <div class="form-horizontal">
                                            <div class="form-group">
                                                <div class="col-sm-12 center">
                                                    <button type="button" class="btn btn-inverse" id="btn_update_client_delegator" onclick="return updateclientdelegatorclick(0,0);"></button>
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <div class="col-md-12" id="div_cli_deleg" style="max-height: 660px; overflow-y: auto; overflow-x: auto;">
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="col-md-3" id="div_delegatorOfclient" style="display: none;">
                                <div class="box border inverse">
                                    <div class="box-title">
                                        <h4>
                                            <i class="fa fa-bars"></i><span class="language_txt" id="span_client_deleg_title2">La liste des délégataires du client</span></h4>
                                    </div>
                                    <div class="box-body">
                                        <div class="form-horizontal">
                                            <div class="form-group">
                                                <div class="col-sm-12 center">
                                                    <button type="button" class="btn btn-inverse" id="btn_update_client_delegator2" onclick="return updateclientdelegatorclick(1,1);">Mettre à jour les délégataires</button>
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <div class="col-md-12" id="div_cli_deleg2" style="max-height: 660px; overflow-y: auto; overflow-x: auto;">
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="separator">
                        </div>
                        <div class="row forview" id="div_contact_client">
                            <div class="col-md-12">
                                <!-- BOX -->
                                <div class="box border inverse">
                                    <div class="box-title">
                                        <h4>
                                            <i class="fa fa-table"></i><span class="language_txt ">Contact Client</span></h4>
                                    </div>
                                    <div class="box-body" style="width: 100%; overflow-x: auto;">
                                        <div class="modal-body center">
                                            <button type="button" class="btn btn-inverse" onclick="return display_contact_client(0);">Créer un contact</button>
                                            <button type="button" class="btn btn-inverse" onclick="return AddProductParLots();">Import des contacts🔥</button>
                                        </div>
                                        <table id="datatable_contact_client" cellpadding="0" cellspacing="0" border="0" class="datatable table table-striped table-bordered table-hover">
                                            <thead>
                                                <tr>
                                                    <th class="language_txt">Titre</th>
                                                    <th class="language_txt">Référence</th>
                                                    <th class="language_txt">Contact</th>
                                                    <th class="language_txt">Tél/Fax</th>
                                                    <th class="hidden-xs language_txt">Portable</th>
                                                    <th class="language_txt">FAC.</th>
                                                    <th>LIV.</th>
                                                    <th>Adresse</th>
                                                    <th class="hidden-xs language_txt">CP</th>
                                                    <th class="hidden-xs language_txt">Ville</th>
                                                    <th class="hidden-xs language_txt">Email</th>
                                                    <th class="hidden-xs language_txt">Login</th>
                                                </tr>
                                            </thead>
                                            <tbody id="tbody_contact_client">
                                            </tbody>
                                            <tfoot>
                                                <tr>
                                                    <th class="language_txt">Titre</th>
                                                    <th class="language_txt">Référence</th>
                                                    <th class="language_txt">Contact</th>
                                                    <th class="language_txt">Tél/Fax</th>
                                                    <th class="hidden-xs language_txt">Portable</th>
                                                    <th class="language_txt">FAC.</th>
                                                    <th>LIV.</th>
                                                    <th>Adresse</th>
                                                    <th class="hidden-xs language_txt">CP</th>
                                                    <th class="hidden-xs language_txt">Ville</th>
                                                    <th class="hidden-xs language_txt">Email</th>
                                                    <th class="hidden-xs language_txt">Login</th>
                                                </tr>
                                            </tfoot>
                                        </table>
                                    </div>
                                </div>
                                <!-- /BOX -->
                            </div>
                        </div>
                    </div>
                    <!-- SAMPLE -->
                    <div class="row">
                    </div>
                    <!-- /SAMPLE -->
                </div>
            </div>
            <!-- /FORMS -->
            <div class="separator">
            </div>
            <div class="separator">
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
    <%--<uc:ucCco ID="ucCco" runat="server" />--%>
    <script type="text/javascript" src="../../js/jQuery-BlockUI/jquery.blockUI.min.js"></script>
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
