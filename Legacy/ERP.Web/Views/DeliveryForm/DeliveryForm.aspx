<%@ Page Title="" Language="C#" MasterPageFile="~/Site.Master" AutoEventWireup="true"
    CodeBehind="DeliveryForm.aspx.cs" Inherits="ERP.Web.Views.DeliveryForm.DeliveryForm" %>
<%@ Import Namespace="System.Web.Configuration" %>

<asp:Content ID="Content1" ContentPlaceHolderID="HeadContent" runat="server">
    <title>ERP - Bon de Livraison</title>
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
        .tr_title
        {
            text-align: center !important;
        }
        .td_right
        {
            text-align: right;
        }
        .td_center
        {
            text-align: center;
        }
        ::-webkit-scrollbar{width:0px}
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
    <script src="../../js/ERP/DeliveryForm/DeliveryForm.js?V=<%= WebConfigurationManager.AppSettings["jsVersion"] %>"
        type="text/javascript"></script>
    <%--<script src="../../js/ERP/DeliveryForm/DeliveryForm.js" type="text/javascript"></script>--%>
    <script src="../../js/ERP/DeliveryForm/DeliveryFormLine.js?V=<%= WebConfigurationManager.AppSettings["jsVersion"] %>"
        type="text/javascript"></script>
    <%--<script src="../../js/ERP/DeliveryForm/DeliveryFormLine.js" type="text/javascript"></script>--%>
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
                                <li><a href="SearchDeliveryForm.aspx">&nbsp;<span class="language_txt">Rechercher une Bon de Livraison</span></a>
                                </li>
                                <li>&nbsp;<span class="language_txt">Bon de Livraison</span></li>
                                <li class="prjMenu a_pointer forview" style="display: none;"><a onclick="goClientInvoice()">
                                    &nbsp;<span class="language_txt">Facture</span></a></li>
                            </ul>
                            <!-- /BREADCRUMBS -->
                            <div class="clearfix">
                                <h3 class="content-title pull-left">
                                    &nbsp;<span class="language_txt">Bon de Livraison</span></h3>
                            </div>
                            <div class="description">
                                <span class="language_txt">Création, modification, consultation une Bon de Livraison</span></div>
                        </div>
                    </div>
                </div>
                <div class="row">
                    <div class="col-md-12">
                        <div class="row">
                            <div class="col-md-6">
                                <div class="box border inverse">
                                    <div class="box-title">
                                        <h4>
                                            <i class="fa fa-bars"></i><span class="language_txt">Bon de commande  information général</span></h4>
                                    </div>
                                    <div class="box-body">
                                        <div class="form-horizontal">
                                            <div class="form-group">
                                                <label class="col-sm-4 control-label language_txt" id="lb_client" pgid="Client.aspx" prms="cliId"
                                                    flid="Client" onclick="return ExternLinkClick(this)" etid="CliFId">Raison sociale du client</label>
                                                <div class="col-sm-8">
                                                    <select id="clientList" class="form-control" required onchange="ClientChanged()">
                                                    </select>
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <label class="col-sm-4 control-label language_txt" onclick="return ExternLinkClick(this)" id="lb_clientorder"
                                                    flid="ClientOrder" pgid="ClientOrder.aspx" prms="codId" etid="CodFId">Nom de Bon Commande</label>
                                                <div class="col-sm-8">
                                                    <select class="form-control" id="CodName" onchange="ClientOrderChange(this)" required>
                                                    </select>
                                                </div>
                                            </div>
                                            <div class="form-group forview prjMenu">
                                                <label class="col-sm-4 control-label language_txt" onclick="return ExternLinkClick(this)" id="lb_clientinvoice"
                                                    flid="ClientInvoice" pgid="ClientInvoice.aspx" prms="cinId" etid="CinFId">Code de la Facture</label>
                                                <div class="col-sm-8">
                                                    <input type="text" class="form-control" id="CinCode" name="CinCode" disabled="" />
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <label class="col-sm-4 control-label language_txt">Code de Bon Commande</label>
                                                <div class="col-sm-8">
                                                    <input type="text" class="form-control" id="CodCode" name="CodCode" disabled="" required />
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <label class="col-sm-4 control-label language_txt" id="lb_project" onclick="return ExternLinkClick(this)"
                                                    flid="Project" pgid="Project.aspx" prms="prjId" etid="PrjFId">Nom d'affaire</label>
                                                <div class="col-sm-8">
                                                    <input type="text" class="form-control" id="PrjName" name="PrjName" disabled="" />
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <label class="col-sm-4 control-label language_txt">Code de Bon de Livraison</label>
                                                <div class="col-sm-8">
                                                    <input type="text" class="form-control" id="DfoCode" name="DfoCode" disabled="" />
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <label class="col-sm-4 control-label language_txt">Livraison au</label>
                                                <div class="col-sm-8">
                                                    <div class="input-group">
                                                        <input class="form-control datepicker " id="_DfoDDelivery" name="_DfoDDelivery" required /><span
                                                            class="input-group-addon"><i class="fa fa-calendar"></i></span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div class="form-group forview forupdate">
                                                <label class="col-sm-4 control-label language_txt">Déjà livré</label>
                                                <div class="col-sm-8">
                                                    <input class="form-control" id="DfoDeliveried" name="DfoDeliveried" type="checkbox"
                                                        onchange="deliveryCompleteAlert(this)" />
                                                </div>
                                            </div>
                                            <div class="form-group forview forupdate">
                                                <label class="col-sm-4 control-label language_txt">Déjà facturé</label>
                                                <div class="col-sm-8">
                                                    <input class="form-control" id="HasClientInvoice" name="HasClientInvoice" type="checkbox"
                                                        disabled="" />
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <label class="col-sm-2 control-label language_txt">Text en tête</label>
                                                <div class="col-sm-4">
                                                    <textarea class="form-control" cols="3" rows="4" id="DfoHeaderText" name="DfoHeaderText"></textarea>
                                                </div>
                                                <label class="col-sm-2 control-label language_txt"><span class="language_txt">Text du pied</span> &#32;</label>
                                                <div class="col-sm-4">
                                                    <textarea class="form-control" cols="3" rows="4" id="DfoFooterText" name="DfoFooterText"></textarea>
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <label class="col-sm-2 control-label language_txt">Commentaire de livraison</label>
                                                <div class="col-sm-4">
                                                    <textarea class="form-control" cols="3" rows="4" id="DfoDeliveryComment" name="DfoDeliveryComment"></textarea>
                                                </div>
                                                <label class="col-sm-2 control-label language_txt">Commentaire interne</label>
                                                <div class="col-sm-4">
                                                    <textarea class="form-control" cols="3" rows="4" id="DfoInterComment" name="DfoInterComment"></textarea>
                                                </div>
                                            </div>
                                            <div class="form-group forview forcreate">
                                                <label class="col-sm-4 control-label language_txt">Date de création</label>
                                                <div class="col-sm-8">
                                                    <div class="input-group">
                                                        <input class="form-control datepicker " id="_dCreationString" name="_dCreationString" /><span
                                                            class="input-group-addon"><i class="fa fa-calendar"></i></span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div class="form-group forview f_updatedate">
                                                <label class="col-sm-4 control-label language_txt">Date de mis à jours</label>
                                                <div class="col-sm-8 forview">
                                                    <div class="input-group">
                                                        <input class="form-control datepicker " id="_dUpdateString" name="_dUpdateString" /><span
                                                            class="input-group-addon"><i class="fa fa-calendar"></i></span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div class="form-group forview">
                                                <label class="col-sm-4 control-label language_txt">Créateur</label>
                                                <div class="col-sm-8">
                                                    <input class="form-control" id="CreatorName" name="CreatorName" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="col-md-6" id="div_delivery_address">
                                <div class="box border inverse">
                                    <div class="box-title">
                                        <h4>
                                            <i class="fa fa-globe"></i><span class="language_txt">Adresse de livraison</span></h4>
                                    </div>
                                    <div class="box-body">
                                        <div class="form-horizontal">
                                            <div class="form-group forview">
                                                <div class="col-sm-12">
                                                    <div class="modal-body center">
                                                        <button type="button" class="btn btn-inverse rt_delete language_txt" id="btn_delete_dfo" onclick="return delete_dfo_click()">Supprimer</button>
                                                        <button type="button" class="btn btn-inverse rt_read language_txt" id="btn_generate_pdf" style="display: none;"
                                                            onclick="return downloadPdf(this)">Générer PDF</button>
                                                        <button type="button" class="btn btn-inverse rt_valid language_txt" id="btn_delivery_dfo" style="display: none;"
                                                            onclick="return DeliveryDfoClick()">Livraison effectué</button>
                                                        <button type="button" class="btn btn-inverse rt_modify language_txt" onclick="changeViewMode('modify')"
                                                            id="btn_modify">Modifier</button>
                                                        <button type="button" class="btn btn-inverse RValid rt_valid language_txt" id="btn_create_client_invoice"
                                                            style="display: none;" onclick="return createClientFactureClick()">Créer la facture</button>
                                                        <button type="button" class="btn btn-inverse RValid rt_valid language_txt" id="btn_create_cin_false"
                                                            style="display: none;" onclick="return createCinFalse()">Créer la facture</button>
                                                        <button type="button" class="btn btn-inverse RValid rt_valid language_txt" id="btn_create_cin_check_invoice" 
                                                        style="display: none;" onclick="return showDfoToCreateCin()">Créer la facture</button>
                                                    </div>
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <label class="col-sm-12 control-label language_txt" style="text-align: center;">L'adresse de livraison et l'adresse de facturation sont les mêmes</label>
                                                <%--<div class="col-sm-8">
                                                    <select class="form-control" id="Dlv_CcoAdresseTitle" name="Dlv_CcoAdresseTitle"
                                                        placeholder="Titre d'adresse" onchange="ccoChange(this,false)">
                                                    </select>
                                                </div>--%>
                                            </div>
                                            <div class="form-group">
                                                <div class="col-sm-12">
                                                    <input class="form-control" type="checkbox" id="DfoClientAdr" name="DfoClientAdr"
                                                        onclick="ClientAdrChange(this)" />
                                                </div>
                                            </div>
                                            <div class="form-group forcreate forupdate">
                                                <label class="col-sm-2 control-label language_txt">Sélectionner une adresse</label>
                                                <div class="col-sm-10">
                                                    <select class="form-control" id="CcoId" name="CcoId" disabled="disabled" onchange="CcoOnchanged(this)">
                                                    </select>
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <label class="col-sm-2 control-label language_txt">Prénom</label>
                                                <div class="col-sm-4">
                                                    <input type="text" class="form-control" id="Dlv_CcoFirstname" name="Dlv_CcoFirstname"
                                                        placeholder="Prénom" />
                                                </div>
                                                <label class="col-sm-2 control-label language_txt">Nom de famille</label>
                                                <div class="col-sm-4">
                                                    <input type="text" class="form-control" id="Dlv_CcoLastname" name="Dlv_CcoLastname"
                                                        placeholder="Nom de famille" maxlength="200">
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <label class="col-sm-2 control-label fieldRequired language_txt">Adresse 1</label>
                                                <div class="col-sm-10">
                                                    <input class="form-control" id="Dlv_CcoAddress1" name="Dlv_CcoAddress1" placeholder="Adresse 1"
                                                        required="" />
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <label class="col-sm-2 control-label language_txt">Adresse 2</label>
                                                <div class="col-sm-10">
                                                    <input class="form-control" id="Dlv_CcoAddress2" name="Dlv_CcoAddress2" placeholder="Adresse 2" />
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <label class="col-sm-2 control-label language_txt">Code postal</label>
                                                <div class="col-sm-4">
                                                    <input type="text" class="form-control" id="Dlv_CcoPostcode" name="Dlv_CcoPostcode"
                                                        onkeyup="getCommuneName(this,'Dlv_CcoCity')" placeholder="Code postal" maxlength="10">
                                                </div>
                                                <label class="col-sm-2 control-label language_txt">Ville</label>
                                                <div class="col-sm-4">
                                                    <input type="text" class="form-control" list="Dlv_CcoCity" id="Dlv_ip_CcoCity" placeholder="Ville"
                                                        oninput="communeChange('Dlv_ip_CcoCity','Dlv_CcoCity','Dlv_CcoPostcode')" maxlength="200">
                                                    <datalist id="Dlv_CcoCity">
                                                    </datalist>
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <label class="col-sm-2 control-label language_txt">Pays</label>
                                                <div class="col-sm-4">
                                                    <input type="text" class="form-control" id="Dlv_CcoCountry" name="Dlv_CcoCountry"
                                                        placeholder="Pays" maxlength="200">
                                                </div>
                                                <label class="col-sm-2 control-label language_txt">Fax</label>
                                                <div class="col-sm-4">
                                                    <input type="text" class="form-control" id="Dlv_CcoFax" name="Dlv_CcoFax" placeholder="Fax"
                                                        maxlength="30">
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <label class="col-sm-2 control-label language_txt">Tél</label>
                                                <div class="col-sm-4">
                                                    <input type="text" class="form-control" id="Dlv_CcoTel1" name="Dlv_CcoTel1" placeholder="Téléphone"
                                                        maxlength="30">
                                                </div>
                                                <label class="col-sm-2 control-label language_txt">Portable</label>
                                                <div class="col-sm-4">
                                                    <input type="text" class="form-control" id="Dlv_CcoCellphone" name="Dlv_CcoCellphone"
                                                        placeholder="Portable" maxlength="30">
                                                </div>
                                            </div>
                                            <div class="form-group"> 
                                                <label class="col-sm-2 control-label language_txt">Email</label>
                                                <div class="col-sm-4">
                                                    <input type="text" class="form-control" id="Dlv_CcoEmail" name="Dlv_CcoEmail" placeholder="Email" />
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <div class="col-sm-12">
                                                    <div class="modal-body center forcreate">
                                                        <button type="button" class="btn btn-inverse rt_create language_txt" onclick="return js_create_update_deliver_form()">Créer</button>
                                                    </div>
                                                    <div class="modal-body center forupdate">
                                                        <button type="button" class="btn btn-default rt_read language_txt" onclick="changeViewMode('view')">Annuler</button>
                                                        <button type="button" class="btn btn-inverse rt_create language_txt" onclick="return js_create_update_deliver_form()">Mettre à jour</button>
                                                    </div>
                                                    <div class="modal-body center forview">
                                                        <button type="button" class="btn btn-inverse rt_create sorting_disabled language_txt" id="bnt_upload_file" onclick="return uploadFile(this)">Télécharger le fichier</button>
                                                        <button type="button" class="btn btn-inverse rt_delete  language_txt" id="btn_delete_cod_file"
                                                            onclick="return delete_cod_file_click()" style="display: none;">Supprimer le fichier</button>
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
                <div class="row forview">
                    <div class="col-md-12">
                        <div class="box border inverse">
                            <div class="box-title">
                                <h4 style="overflow: hidden;">
                                    <i class="fa fa-bars"></i><span class="language_txt">Les lignes de Commande</span>&nbsp;
                                </h4>
                            </div>
                            <div class="box-body">
                                <div class="form-horizontal center" style="width: 100%; overflow-x: auto;">
                                    <button class="btn btn-inverse language_txt" id="btn_delivery_all" type="button" style="display: none;"
                                        onclick="return DeliveryAllLinesClick()">Tout livrer</button>
                                </div>
                            </div>
                            <div class="box-body">
                                <div class="form-horizontal center" style="width: 100%; overflow-x: auto;">
                                    <table cellpadding="0" cellspacing="0" border="0" class="table table-striped table-bordered table-hover">
                                        <thead id="thead_clientorder_line">
                                            <tr role="row">
                                                <%--<th rowspan="1" colspan="1">
                                                    Ordre
                                                </th>--%>
                                                <%-- <th rowspan="1" colspan="1" style="text-align: center">
                                                    Type
                                                </th>--%>
                                                <th rowspan="1" colspan="1" style="text-align: center"  class="language_txt">Produit</th>
                                                <th rowspan="1" colspan="1" style="text-align: center"  class="language_txt">Référence</th>
                                                <th rowspan="1" colspan="1" style="text-align: center"  class="language_txt">Description</th>
                                                <th rowspan="1" colspan="1" style="text-align: center"  class="language_txt">Quantité</th>
                                                <th rowspan="1" colspan="1" style="text-align: center"  class="language_txt" style="color: green;">Quantité déjà livré</th>
                                                <th rowspan="1" colspan="1" style="text-align: center"  class="language_txt" style="color: red;">Quantité pas livré</th>
                                                <th rowspan="1" colspan="1" style="text-align: center"  class="language_txt">Prix d'achat</th>
                                                <th rowspan="1" colspan="1" style="text-align: center"  class="language_txt">Prix unitaire</th>
                                                <th rowspan="1" colspan="1" style="text-align: center"  class="language_txt">Prix remisé</th>
                                                <th rowspan="1" colspan="1" style="text-align: center"  class="language_txt">TVA</th>
                                                <th rowspan="1" colspan="1" style="text-align: center"  class="language_txt">Total H.T</th>
                                                <th rowspan="1" colspan="1" style="text-align: center"  class="language_txt">Total T.T.C</th>
                                                <th rowspan="1" colspan="1" class="thDeliveryButton">
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody id="tbody_clientorder_line" style="text-align: center !important">
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="row forview">
                    <div class="col-md-12">
                        <div class="box border inverse">
                            <div class="box-title">
                                <h4 style="overflow: hidden;">
                                    <i class="fa fa-bars"></i>Les lignes de Livraison&nbsp;
                                </h4>
                            </div>
                            <div class="box-body">
                                <div class="form-horizontal center" style="width: 100%; overflow-x: auto;">
                                    <table cellpadding="0" cellspacing="0" border="0" class="table table-striped table-bordered table-hover">
                                        <thead id="thead_delivery_form_lines">
                                            <tr role="row">
                                                <th rowspan="1" colspan="1" style="text-align: center"  class="language_txt">Produit</th>
                                                <th rowspan="1" colspan="1" style="text-align: center"  class="language_txt">Référence</th>
                                                <th rowspan="1" colspan="1" style="text-align: center"  class="language_txt">Description</th>
                                                <th rowspan="1" colspan="1" style="color: red; text-align: center"  class="language_txt">Quantité à livrer</th>
                                                <th rowspan="1" colspan="1" style="text-align: center"  class="language_txt">Prix d'achat</th>
                                                <th rowspan="1" colspan="1" style="text-align: center"  class="language_txt">Prix unitaire</th>
                                                <th rowspan="1" colspan="1" style="text-align: center"  class="language_txt">Prix remisé</th>
                                                <th rowspan="1" colspan="1" style="text-align: center"  class="language_txt">Total H.T Livré</th>
                                                <th rowspan="1" colspan="1" class="thDeliveryButton"></th>
                                            </tr>
                                        </thead>
                                        <tbody id="tdoby_delivery_form_lines" style="text-align: center !important">
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <!-- /FORMS -->
                <div class="row forview">
                    <div class="col-md-12" id="div_client_order_pdf">
                        <div class="box border inverse">
                            <div class="box-title">
                                <h4>
                                    <i class="fa fa-globe"></i><span class="">Fichier de bon de livraison</span></h4>
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
