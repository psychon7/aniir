<%@ Page Title="" Language="C#" MasterPageFile="~/Site.Master" AutoEventWireup="true"
    CodeBehind="ClientOrder.aspx.cs" Inherits="ERP.Web.Views.ClientOrder.ClientOrder" %>
<%@ Import Namespace="System.Web.Configuration" %>

<asp:Content ID="Content1" ContentPlaceHolderID="HeadContent" runat="server">
    <title>ERP - Bon de commande</title>
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
    <script src="../../js/ERP/ERPBaseJS.js?V=<%= WebConfigurationManager.AppSettings["jsVersion"] %>"
        type="text/javascript"></script>
    <script src="../../js/ERP/CommonJS.js?V=<%= WebConfigurationManager.AppSettings["jsVersion"] %>"
        type="text/javascript"></script>
    <script src="../../js/ERP/ClientOrder/ClientOrder.js?V=<%= WebConfigurationManager.AppSettings["jsVersion"] %>"
        type="text/javascript"></script>
    <script src="../../js/ERP/ClientOrder/ClientOrderBase.js?V=<%= WebConfigurationManager.AppSettings["jsVersion"] %>"
        type="text/javascript"></script>
    <%--<script src="../../js/ERP/ClientOrder/ClientOrder.js" type="text/javascript"></script>--%>
    <script src="../../js/ERP/ClientOrder/ClientOrderLine.js?V=<%= WebConfigurationManager.AppSettings["jsVersion"] %>"
        type="text/javascript"></script>
    <!-- hidden fileds -->
    <label style="display: none;" id="hf_col_prd_id">
    </label>
    <label style="display: none;" id="hf_col_pit_id">
    </label>
    <!-- /hidden fileds -->
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
                                <li><a href="SearchClientOrder.aspx">&nbsp;<span class="language_txt">Rechercher une Commande</span></a> </li>
                                <li>&nbsp;<span class="language_txt">Bon de Commande</span></li>
                                <li><a class="a_link" onclick="goToDeliveryFormList(1)">&nbsp;<span class="language_txt">Liste de Bon de Livraison</span></a></li>
                                <%--<li><a class="a_link" onclick="goToDeliveryFormList(2)">&nbsp;Créer une Bon de Livraison</a></li>--%>
                            </ul>
                            <!-- /BREADCRUMBS -->
                            <div class="clearfix">
                                <h3 class="content-title pull-left">
                                    &nbsp;<span class="language_txt">Bon de Commande</span></h3>
                            </div>
                            <div class="description">
                                <span class="language_txt">Création, modification, consultation une Commande</span></div>
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
                                            <i class="fa fa-bars"></i><span class="language_txt">Client & information général</span></h4>
                                    </div>
                                    <div class="box-body">
                                        <div class="form-horizontal">
                                            <div class="form-group">
                                                <div class="col-md-12 center">
                                                    <div class="modal-body center forupdate">
                                                        <button type="button" class="btn btn-default rt_read language_txt" onclick="changeViewMode('view')">Annuler</button>
                                                        <button type="button" class="btn btn-inverse rt_create  language_txt" onclick="return js_create_update_clientorder()">Mettre à jour</button>
                                                    </div>
                                                    <div class="modal-body center forview">
                                                        <button type="button" class="btn btn-inverse language_txt" id="btn_generate_pdf" style="display: none;"
                                                            onclick="return downloadPdf(this)">Générer PDF</button>
                                                        <button type="button" class="btn btn-inverse rt_create  language_txt" onclick="changeViewMode('modify')">Modifier</button>
                                                        <button type="button" class="btn btn-inverse rt_create  language_txt" onclick="duplicateClientOrder()">Dupliquer</button>
                                                        <button type="button" class="btn btn-inverse rt_modify  language_txt" onclick="AddModifyDiscount()">Remise</button>
                                                        <button type="button" id="btn_create_deliveryform" class="btn btn-inverse rt_valid language_txt"
                                                            onclick="createDfoNew();">Créer BL</button>
                                                        <button type="button" id="Button1" class="btn btn-inverse rt_valid  language_txt" onclick="goToDeliveryFormList(1)">Liste de BL</button>
                                                    </div>
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <label class="col-sm-2 control-label fieldRequired  language_txt" id="lb_client" pgid="Client.aspx" prms="cliId"
                                                    flid="Client" onclick="return ExternLinkClick(this)" etid="CliFId">Raison sociale du client</label>
                                                <div class="col-sm-4">
                                                    <%--<input type="text" class="form-control" list="Client" id="ip_Client" name="ip_Client"
                                                        required="" placeholder="Raison sociale" maxlength="200" oninput="js_clientChange(this)"
                                                        onblur="js_clientLostFocus(this)">
                                                    <datalist id="Client">
                                                    </datalist>--%>
                                                    <select id="Client" class="form-control" style="display: none;">
                                                    </select>
                                                    <input class='form-control' id='ClientList' name='ClientList' onkeyup="return js_clientChange(this)" />
                                                </div>
                                                <label class="col-sm-2 control-label language_txt" onclick="return ExternLinkClick(this)" id="lb_costplan"
                                                    flid="CostPlan" pgid="CostPlan.aspx" prms="cplId" etid="CplFId">Nom de Devis</label>
                                                <div class="col-sm-4">
                                                    <select class="form-control" id="CplName" onchange="costPlanChange(this)">
                                                    </select>
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <label class="col-sm-2 control-label fieldRequired  language_txt">Nom de la commande</label>
                                                <div class="col-sm-4">
                                                    <input type="text" class="form-control" id="CodName" name="CodName" placeholder="Nom de la commande"
                                                        required="" maxlength="200" />
                                                </div>
                                                <label class="col-sm-2 control-label forview language_txt" id="lb_Project" onclick="return ExternLinkClick(this)"
                                                    flid="Project" pgid="Project.aspx" prms="prjId" etid="PrjFId">Nom d'affaire</label>
                                                <div class="col-sm-4 forview">
                                                    <input type="text" class="form-control" id="PrjName" name="PrjName" disabled="" />
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <label class="col-sm-2 control-label language_txt  ">Code de la commande</label>
                                                <div class="col-sm-4">
                                                    <input type="text" class="form-control" id="CodCode" name="CodCode" placeholder="Code de la commande"
                                                        disabled="" />
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
                                                <label class="col-sm-2 control-label language_txt">Livraison prévue du</label>
                                                <div class="col-sm-4">
                                                    <div class="input-group">
                                                        <input class="form-control datepicker " id="_CodDatePreDeliveryForm" name="_CodDatePreDeliveryForm" /><span
                                                            class="input-group-addon"><i class="fa fa-calendar"></i></span>
                                                    </div>
                                                </div>
                                                <label class="col-sm-2 control-label language_txt">Livraison prévue au</label>
                                                <div class="col-sm-4">
                                                    <div class="input-group">
                                                        <input class="form-control datepicker " id="_CodDatePreDeliveryTo" name="_CodDatePreDeliveryTo" /><span
                                                            class="input-group-addon"><i class="fa fa-calendar"></i></span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <label class="col-sm-2 control-label language_txt">Date de fin de chantier(prévue)</label>
                                                <div class="col-sm-4">
                                                    <div class="input-group">
                                                        <input class="form-control datepicker " id="_CodDateEndWork" name="_CodDateEndWork" /><span
                                                            class="input-group-addon"><i class="fa fa-calendar"></i></span>
                                                    </div>
                                                </div>
                                                <label class="col-sm-2 control-label forview language_txt">REMISE</label>
                                                <div class="col-sm-4 forview">
                                                    <input type="text" class="form-control" id="_CodDiscountAmount" name="_CodDiscountAmount"
                                                        style="color: red;" disabled="" />
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <label class="col-sm-2 control-label language_txt">Commercial 1</label>
                                                <div class="col-sm-4">
                                                    <select id="UsrCom1" class="form-control">
                                                    </select>
                                                </div>
                                                <label class="col-sm-2 control-label  language_txt">Commercial 2</label>
                                                <div class="col-sm-4">
                                                    <select id="UsrCom2" class="form-control">
                                                    </select>
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <label class="col-sm-2 control-label language_txt">Commercial 3</label>
                                                <div class="col-sm-4">
                                                    <select id="UsrCom3" class="form-control">
                                                    </select>
                                                </div>
                                                <div class="col-sm-6" id="div_for_keyprj" style="display:none;">
                                                    <label class="col-sm-4 control-label language_txt" style="color: red;">Projet Important</label>
                                                    <div class="col-sm-8">
                                                        <input class="form-control" type="checkbox" id="CodKeyProject" name="CodKeyProject" />
                                                    </div>
                                                </div>
                                            </div>
                                            <div class="form-group forview forcreate">
                                                <label class="col-sm-2 control-label forview forcreate language_txt">Date de création</label>
                                                <div class="col-sm-4 forview forcreate">
                                                    <div class="input-group">
                                                        <input class="form-control datepicker " id="_dCreationString" name="_dCreationString"
                                                            required="" /><span class="input-group-addon"><i class="fa fa-calendar"></i></span>
                                                    </div>
                                                </div>
                                                <label class="col-sm-2 control-label forview f_updatedate   language_txt">Date de mis à jours</label>
                                                <div class="col-sm-4 forview f_updatedate">
                                                    <div class="input-group">
                                                        <input class="form-control datepicker " id="_dUpdateString" name="_dUpdateString" /><span
                                                            class="input-group-addon"><i class="fa fa-calendar"></i></span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div class="form-group forview">
                                                <label class="col-sm-2 control-label language_txt">Créateur</label>
                                                <div class="col-sm-4">
                                                    <input class="form-control" id="CreatorName" name="CreatorName" />
                                                </div>
                                                <div class="col-sm-2">
                                                </div>
                                                <div class="col-sm-2 center">
                                                    <button type="button" class="btn btn-inverse rt_create  language_txt" id="bnt_upload_file" onclick="return uploadFile(this)">Télécharger le fichier</button>
                                                </div>
                                                <div class="col-sm-2 center">
                                                    <button type="button" class="btn btn-inverse rt_delete language_txt" id="btn_delete_cod_file"
                                                        onclick="return delete_cod_file_click()" style="display: none;">Supprimer le fichier</button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-12">
                        <div class="row">
                            <div class="col-md-6" id="div_invoicing_address">
                                <div class="box border inverse">
                                    <div class="box-title">
                                        <h4>
                                            <i class="fa fa-dollar"></i><span class="language_txt">Commercial Client</span></h4>
                                        <div class="tools">
                                            <a href="javascript:;" class="collapse _infoCollapse"><i class="fa fa-chevron-up"></i>
                                            </a>
                                        </div>
                                    </div>
                                    <div class="box-body">
                                        <div class="form-horizontal">
                                            <div class="form-group">
                                                <label class="col-sm-3 control-label language_txt">Titre d'adresse</label>
                                                <div class="col-sm-9">
                                                    <select class="form-control" id="Inv_CcoAdresseTitle" name="Inv_CcoAdresseTitle"
                                                        placeholder="Titre d'adresse" onchange="ccoChange(this,true)">
                                                    </select>
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <label class="col-sm-3 control-label language_txt">Référence</label>
                                                <div class="col-sm-9">
                                                    <input class="form-control" id="Inv_CcoRef" name="Inv_CcoRef" type="text" placeholder="Référence"
                                                        disabled="" maxlength="200">
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <label class="col-sm-3 control-label language_txt">Prénom</label>
                                                <div class="col-sm-9">
                                                    <input type="text" class="form-control" id="Inv_CcoFirstname" name="Inv_CcoFirstname"
                                                        placeholder="Prénom" />
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <label class="col-sm-3 control-label language_txt"   >Nom de famille</label>
                                                <div class="col-sm-9">
                                                    <input type="text" class="form-control" id="Inv_CcoLastname" name="Inv_CcoLastname"
                                                        placeholder="Nom de famille" maxlength="200">
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <label class="col-sm-3 control-label language_txt">Tél</label>
                                                <div class="col-sm-9">
                                                    <input type="text" class="form-control" id="Inv_CcoTel1" name="Inv_CcoTel1" placeholder="Téléphone"
                                                        maxlength="30">
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <label class="col-sm-3 control-label language_txt">Fax</label>
                                                <div class="col-sm-9">
                                                    <input type="text" class="form-control" id="Inv_CcoFax" name="Inv_CcoFax" placeholder="Fax"
                                                        maxlength="30">
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <label class="col-sm-3 control-label language_txt">Portable</label>
                                                <div class="col-sm-9">
                                                    <input type="text" class="form-control" id="Inv_CcoCellphone" name="Inv_CcoCellphone"
                                                        placeholder="Portable" maxlength="30">
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <label class="col-sm-3 control-label language_txt">Email</label>
                                                <div class="col-sm-9">
                                                    <input type="text" class="form-control" id="Inv_CcoEmail" name="Inv_CcoEmail" placeholder="Email" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="col-md-6" id="div1">
                                <div class="box border inverse">
                                    <div class="box-title">
                                        <h4>
                                            <i class="fa fa-globe"></i><span class="language_txt">Information supplémentaire</span></h4>
                                        <div class="tools">
                                            <a href="javascript:;" class="collapse _infoCollapse"><i class="fa fa-chevron-up"></i>
                                            </a>
                                        </div>
                                    </div>
                                    <div class="box-body">
                                        <div class="form-horizontal">
                                            <div class="form-group">
                                                <label class="col-sm-2 control-label language_txt">Text en tête</label>
                                                <div class="col-sm-4">
                                                    <textarea class="form-control" cols="3" rows="6" id="CodHeaderText" name="CodHeaderText"></textarea>
                                                </div>
                                                <label class="col-sm-2 control-label language_txt">Text du pied &#32;</label>
                                                <div class="col-sm-4">
                                                    <textarea class="form-control" cols="3" rows="6" id="CodFooterText" name="CodFooterText"></textarea>
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <label class="col-sm-2 control-label language_txt">Commentaire pour client</label>
                                                <div class="col-sm-4">
                                                    <textarea class="form-control" cols="3" rows="7" id="CodClientComment" name="CodClientComment"></textarea>
                                                </div>
                                                <label class="col-sm-2 control-label language_txt">Commentaire interne</label>
                                                <div class="col-sm-4">
                                                    <textarea class="form-control" cols="3" rows="7" id="CodInterComment" name="CodInterComment"></textarea>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="col-md-4" id="div_delivery_address" style="display: none;">
                                <div class="box border inverse">
                                    <div class="box-title">
                                        <h4>
                                            <i class="fa fa-globe"></i><span class="language_txt">Adresse de livraison</span></h4>
                                        <div class="tools">
                                            <a href="javascript:;" class="collapse _infoCollapse"><i class="fa fa-chevron-up"></i>
                                            </a>
                                        </div>
                                    </div>
                                    <div class="box-body">
                                        <div class="form-horizontal">
                                            <div class="form-group">
                                                <label class="col-sm-3 control-label language_txt">Titre d'adresse</label>
                                                <div class="col-sm-9">
                                                    <select class="form-control" id="Dlv_CcoAdresseTitle" name="Dlv_CcoAdresseTitle"
                                                        placeholder="Titre d'adresse" onchange="ccoChange(this,false)">
                                                    </select>
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <label class="col-sm-3 control-label language_txt">Référence</label>
                                                <div class="col-sm-9">
                                                    <input class="form-control" id="Dlv_CcoRef" name="Dlv_CcoRef" type="text" placeholder="Référence"
                                                        disabled="" />
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <label class="col-sm-3 control-label language_txt"   >Prénom</label>
                                                <div class="col-sm-9">
                                                    <input type="text" class="form-control" id="Dlv_CcoFirstname" name="Dlv_CcoFirstname"
                                                        placeholder="Prénom" />
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <label class="col-sm-3 control-label language_txt">Nom de famille</label>
                                                <div class="col-sm-9">
                                                    <input type="text" class="form-control" id="Dlv_CcoLastname" name="Dlv_CcoLastname"
                                                        placeholder="Nom de famille" maxlength="200">
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <label class="col-sm-3 control-label">
                                                    Adresse 1</label>
                                                <div class="col-sm-9">
                                                    <input type="text" class="form-control" id="Dlv_CcoAddress1" name="Dlv_CcoAddress1"
                                                        placeholder="Adresse 1" maxlength="200">
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <label class="col-sm-3 control-label">
                                                    Adresse 2</label>
                                                <div class="col-sm-9">
                                                    <input type="text" class="form-control" id="Dlv_CcoAddress2" name="Dlv_CcoAddress2"
                                                        placeholder="Adresse 2" maxlength="200">
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <label class="col-sm-3 control-label language_txt">Code postal</label>
                                                <div class="col-sm-9">
                                                    <input type="text" class="form-control" id="Dlv_CcoPostcode" name="Dlv_CcoPostcode"
                                                        onkeyup="getCommuneName(this,'Dlv_CcoCity')" placeholder="Code postal" maxlength="10">
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <label class="col-sm-3 control-label language_txt">Ville</label>
                                                <div class="col-sm-9">
                                                    <input type="text" class="form-control" list="Dlv_CcoCity" id="Dlv_ip_CcoCity" placeholder="Ville"
                                                        oninput="communeChange('Dlv_ip_CcoCity','Dlv_CcoCity','Dlv_CcoPostcode')" maxlength="200">
                                                    <datalist id="Dlv_CcoCity">
                                                    </datalist>
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <label class="col-sm-3 control-label language_txt">Pays</label>
                                                <div class="col-sm-9">
                                                    <input type="text" class="form-control" id="Dlv_CcoCountry" name="Dlv_CcoCountry"
                                                        placeholder="Pays" maxlength="200">
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <label class="col-sm-3 control-label language_txt">Tél</label>
                                                <div class="col-sm-9">
                                                    <input type="text" class="form-control" id="Dlv_CcoTel1" name="Dlv_CcoTel1" placeholder="Téléphone"
                                                        maxlength="30">
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <label class="col-sm-3 control-label language_txt">Fax</label>
                                                <div class="col-sm-9">
                                                    <input type="text" class="form-control" id="Dlv_CcoFax" name="Dlv_CcoFax" placeholder="Fax"
                                                        maxlength="30">
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <label class="col-sm-3 control-label language_txt">Portable</label>
                                                <div class="col-sm-9">
                                                    <input type="text" class="form-control" id="Dlv_CcoCellphone" name="Dlv_CcoCellphone"
                                                        placeholder="Portable" maxlength="30">
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <label class="col-sm-3 control-label language_txt">Email</label>
                                                <div class="col-sm-9">
                                                    <input type="text" class="form-control" id="Dlv_CcoEmail" name="Dlv_CcoEmail" placeholder="Email" />
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
                <div class="row">
                    <div class="col-md-12">
                        <div class="modal-body center forcreate">
                            <button type="button" class="btn btn-inverse rt_create  language_txt" onclick="return js_create_update_clientorder()">Créer</button>
                        </div>
                        <div class="modal-body center forupdate">
                            <button type="button" class="btn btn-default rt_read language_txt" onclick="changeViewMode('view')">Annuler</button>
                            <button type="button" class="btn btn-inverse rt_create  language_txt" onclick="return js_create_update_clientorder()">Mettre à jour</button>
                        </div>
                        <div class="modal-body center forview">
                            <button type="button" class="btn btn-inverse rt_modify  language_txt" onclick="changeViewMode('modify')">Modifier</button>
                        </div>
                    </div>
                </div>
                <div class="separator">
                </div>
                <!--- Cost Plan Lines -->
                <div class="row forview">
                    <div class="col-md-12">
                        <div class="box border inverse">
                            <div class="box-title">
                                <h4 style="overflow: hidden;">
                                    <i class="fa fa-bars"></i><span class="language_txt">Les lignes de Commande</span>&nbsp; <span id="PtyName_general">
                                    </span>
                                </h4>
                            </div>
                            <div class="box-body">
                                <div class="modal-body center forview">
                                    <button type="button" class="btn btn-inverse forupdate rt_create language_txt" onclick="setAddUpdateLine();">Ajouter une Ligne</button>
                                    <button type="button" class="btn btn-inverse forupdate rt_create language_txt" onclick="return addupdateDrvAcc();">Ajouter un driver/accessoire</button>
                                </div>
                                <div class="form-horizontal center" style="width: 100%; overflow-x: auto;">
                                    <table cellpadding="0" cellspacing="0" border="0" class="table table-striped table-bordered table-hover">
                                        <thead id="thead_cost_plan_line">
                                            <tr role="row">
                                                <th rowspan="1" colspan="1"  class="language_txt">Ordre</th>
                                                <th rowspan="1" colspan="1"  class="language_txt">Produit</th>
                                                <th rowspan="1" colspan="1"  class="language_txt">Référence</th>
                                                <th rowspan="1" colspan="1"  class="language_txt">Image</th>
                                                <th rowspan="1" colspan="1"  class="language_txt">Description</th>
                                                <th rowspan="1" colspan="1"  class="language_txt">Quantité</th>
                                                <th rowspan="1" colspan="1"  class="language_txt">Prix d'achat</th>
                                                <th rowspan="1" colspan="1"  class="language_txt">Prix unitaire</th>
                                                <th rowspan="1" colspan="1"  class="language_txt">Prix remisé</th>
                                                <th rowspan="1" colspan="1"  class="language_txt">TVA</th>
                                                <th rowspan="1" colspan="1"  class="language_txt">Total H.T</th>
                                                <th rowspan="1" colspan="1"  class="language_txt">Total T.T.C</th>
                                                <th rowspan="1" colspan="1"  class="language_txt"></th>
                                                
                                            </tr>
                                        </thead>
                                        <tbody id="tbody_cost_plan_line" style="text-align: center !important">
                                        </tbody>
                                    </table>
                                </div>
                                <div class="modal-body center forview">
                                    <button type="button" class="btn btn-inverse forupdate rt_create language_txt" onclick="setAddUpdateLine();">Ajouter une Ligne</button>
                                    <button type="button" class="btn btn-inverse forupdate rt_create language_txt" onclick="return addupdateDrvAcc();">Ajouter un driver/accessoire</button>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-12 forview">
                        <div class="box border inverse" id="div_client_order_pdf">
                            <div class="box-title">
                                <h4>
                                    <i class="fa fa-globe"></i><span class="language_txt">Fichier de bon de commande</span></h4>
                                <div class="tools">
                                    <a href="javascript:;" class="collapse" id="a_collapse"><i class="fa fa-chevron-up">
                                    </i></a>
                                </div>
                            </div>
                            <div class="box-body">
                                <div class="form-horizontal">
                                    <div class="form-group">
                                        <div class="col-sm-12">
                                            <iframe height="1000" width="100%" id="iframepdf"></iframe>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <!--- /Cost Plan Lines -->
            </div>
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
</asp:Content>
