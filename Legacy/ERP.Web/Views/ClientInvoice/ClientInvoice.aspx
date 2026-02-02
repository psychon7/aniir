<%@ Page Title="" Language="C#" MasterPageFile="~/Site.Master" AutoEventWireup="true"
    CodeBehind="ClientInvoice.aspx.cs" Inherits="ERP.Web.Views.ClientInvoice.ClientInvoice" %>

<%@ Import Namespace="System.Web.Configuration" %>
<asp:Content ID="Content1" ContentPlaceHolderID="HeadContent" runat="server">
    <title>Facture Client</title>
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
    <style type="text/css">
        .att_label {
            text-align: center !important;
        }

        .label_left {
            text-align: left !important;
        }

        .label_right {
            text-align: right !important;
        }

        .ui-autocomplete {
            z-index: 9999 !important;
        }

        th {
            text-align: center !important;
        }

        .subTotal {
            background-color: #EAEBFF !important;
        }

        .total {
            background-color: #D3D6FF !important;
        }

        .invoicelist {
            display: none;
        }
        /* BT WYSIWYG */
        #editor_delegator,#editor_client {
            margin-top: 10px;
            max-height: 380px;
            height: 380px;
            background-color: white;
            border-collapse: separate;
            border: 1px solid #cccccc;
            padding: 10px;
            box-sizing: content-box;
            -webkit-box-shadow: rgba(0, 0, 0, 0.0745098) 0px 1px 1px 0px inset;
            box-shadow: rgba(0, 0, 0, 0.0745098) 0px 1px 1px 0px inset;
            border-top-right-radius: 3px;
            border-bottom-right-radius: 3px;
            border-bottom-left-radius: 3px;
            border-top-left-radius: 3px;
            overflow: scroll;
            outline: none;
        }
        /* BT WYSIWYG */
        /*#editor_client {
            margin-top: 10px;
            max-height: 600px;
            height: 600px;
            background-color: white;
            border-collapse: separate;
            border: 1px solid #cccccc;
            padding: 10px;
            box-sizing: content-box;
            -webkit-box-shadow: rgba(0, 0, 0, 0.0745098) 0px 1px 1px 0px inset;
            box-shadow: rgba(0, 0, 0, 0.0745098) 0px 1px 1px 0px inset;
            border-top-right-radius: 3px;
            border-bottom-right-radius: 3px;
            border-bottom-left-radius: 3px;
            border-top-left-radius: 3px;
            overflow: scroll;
            outline: none;
        }*/
    </style>
</asp:Content>
<asp:Content ID="Content2" ContentPlaceHolderID="MainContent" runat="server">
    <script>
        var curSocName;
        var pdfVersion = '';
        jQuery(document).ready(function () {
            App.setPage("index");  //Set current page
            App.init(); //Initialise plugins and elements
            curSocName = '<%= CurrentSoc.Society_Name %>';
            pdfVersion = '<%= System.Configuration.ConfigurationManager.AppSettings["PdfVersion"].ToString() %>';
        });
    </script>
    <script src="../../js/ERP/ERPBaseJS.js?V=<%= WebConfigurationManager.AppSettings["jsVersion"] %>"
        type="text/javascript"></script>
    <script src="../../js/ERP/CommonJS.js?V=<%= WebConfigurationManager.AppSettings["jsVersion"] %>"
        type="text/javascript"></script>
    <script src="../../js/ERP/date.js" type="text/javascript"></script>
    <script src="../../js/ERP/ClientInvoice/ClientInvoice.js?V=<%= WebConfigurationManager.AppSettings["jsVersion"] %>"
        type="text/javascript"></script>
    <%--<script src="../../js/ERP/ClientInvoice/ClientInvoice.js" type="text/javascript"></script>--%>
    <script src="../../js/ERP/ClientInvoice/ClientInvoiceLine.js?V=<%= WebConfigurationManager.AppSettings["jsVersion"] %>"
        type="text/javascript"></script>
    <!-- hidden fileds -->
    <label style="display: none;" id="hf_cii_prd_id">
    </label>
    <label style="display: none;" id="hf_cii_pit_id">
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
                                <li><a href="SearchClientInvoice.aspx">&nbsp;<span class="language_txt">Rechercher une facture</span></a> </li>
                                <li>&nbsp;<span class="language_txt">Facture client</span></li>
                            </ul>
                            <!-- /BREADCRUMBS -->
                            <div class="clearfix">
                                <h3 class="content-title pull-left">&nbsp;<span class="language_txt">Facture client</span></h3>
                            </div>
                            <div class="description">
                                <span class="language_txt">Création, modification, consultation une Facture</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="row">
                    <div class="col-md-12">
                        <div class="row">
                            <div class="col-md-9" id="div_cin_general_info">
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
                                                        <button type="button" class="btn btn-default language_txt" onclick="changeViewMode('view')">Annuler</button>
                                                        <button type="button" class="btn btn-inverse language_txt" onclick="return CreateUpdateClientInvoice(this)">Mettre à jour</button>
                                                    </div>
                                                    <div class="modal-body center forview" id="div_btns">
                                                        <button type="button" class="btn btn-inverse language_txt" id="btn_generate_pdf" style="display: none;"
                                                            onclick="return downloadPdf(this)">
                                                            Générer PDF</button>
                                                        <button type="button" class="btn btn-inverse language_txt" onclick="changeViewMode('modify')"
                                                            id="btn_modify_top">
                                                            Modifier</button>
                                                        <button type="button" class="btn btn-inverse language_txt" onclick="AddModifyDiscount()">Remise</button>
                                                        <%--<button type="button" class="btn btn-pink" onclick="PayTheInvoice(this)" cpyid="0">
                                                            Payer</button>--%>
                                                        <button type="button" class="btn btn-inverse language_txt" id="btn_cin_invoiced" style="display: none;"
                                                            onclick="return InvoiceCinClick()">
                                                            Facturer</button>
                                                        <button type="button" class="btn btn-inverse language_txt" id="btn_cin_allpaid" style="display: none;"
                                                            onclick="return InvoiceAllPaidClick()">
                                                            Entièrement Payé</button>
                                                        <button type="button" class="btn btn-inverse" id="btn_view_sod" style="display: none; color: #d96666"
                                                            onclick="return ViewSod()">
                                                        </button>
                                                        <button type="button" class="btn btn-inverse" id="btn_create_dfo" style="display: none;" onclick="return CreateDfoClick()">Créer le bon de livraison</button>
                                                        <button type="button" class="btn btn-inverse language_txt" id="btn_send_invoice" style="display: none;"
                                                            onclick="return SendCinClick()">
                                                            Envoyer au client par EMAIL</button>
                                                        <button class="btn btn-danger" id="btn_download_inspection_form" style="display: none;" onclick="return downInspectionForm()">Formulaires d'inspection</button>
                                                    </div>
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <label class="col-sm-12 control-label" style="color: red;" id="lb_cin_status">
                                                </label>
                                            </div>
                                            <div class="form-group" style="display: none;">
                                                <label class="col-sm-2 control-label language_txt" style="color: red;">AVOIR</label>
                                                <div class="col-sm-4">
                                                    <input class="form-control" type="checkbox" id="CinAccount" name="CinAccount" onclick="VerifyAvoir(this)" />
                                                </div>
                                                <label class="col-sm-2 control-label invoicelist fieldRequired language_txt" id="lb_cin_avoir_id"
                                                    pgid="ClientInvoice.aspx" prms="cinId" flid="ClientInvoice" onclick="return ExternLinkClick(this,true)"
                                                    etid="CinAvFId">
                                                    FACTURE D'AVOIR</label>
                                                <div class="col-sm-4 invoicelist">
                                                    <select class="form-control" id="ClientInvoiceList" name="ClientInvoiceList" onchange="cin4AvoirChange(this)">
                                                    </select>
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <label class="col-sm-2 control-label fieldRequired language_txt" id="lb_client" pgid="Client.aspx"
                                                    prms="cliId" flid="Client" onclick="return ExternLinkClick(this)" etid="CliFId">
                                                    Raison sociale du client</label>
                                                <div class="col-sm-4">
                                                    <%--<select type="text" class="form-control" id="Client" name="Client" required="" onchange="js_clientChange(this)">
                                                    </select>--%>
                                                    <select id="Client" class="form-control" style="display: none;">
                                                    </select>
                                                    <input class='form-control' id='ClientList' name='ClientList' onkeyup="return js_clientChange(this)" />
                                                </div>
                                                <label class="col-sm-2 control-label language_txt" id="lb_Project" onclick="return ExternLinkClick(this)"
                                                    flid="Project" pgid="Project.aspx" prms="prjId" etid="PrjFId">
                                                    Nom d'affaire</label>
                                                <div class="col-sm-4 " id="div_prjname">
                                                    <select class="form-control" id="PrjName" name="PrjName" onchange="projectChange(this)">
                                                    </select>
                                                </div>
                                                <div class="col-sm-4 " id="div_prjnameUp" style="display: none;">
                                                    <input class="form-control" id="PrjNameUp" name="PrjNameUp" />
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <label class="col-sm-2 control-label language_txt" onclick="return ExternLinkClick(this)" id="lb_costplan"
                                                    flid="CostPlan" pgid="CostPlan.aspx" prms="cplId" etid="CplFId">
                                                    Nom de Devis</label>
                                                <div class="col-sm-4 " id="div_cplname">
                                                    <select class="form-control" id="CplName" name="CplName" onchange="costplanChange(this)">
                                                    </select>
                                                </div>
                                                <div class="col-sm-4 " id="div_cplnameUp" style="display: none;">
                                                    <input class="form-control" id="CplNameUp" name="CplNameUp" />
                                                </div>
                                                <label class="col-sm-2 control-label language_txt">Code de Devis</label>
                                                <div class="col-sm-4">
                                                    <input class="form-control" id="CplCode" name="CplCode" disabled="" />
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <label class="col-sm-2 control-label language_txt" onclick="return ExternLinkClick(this)" id="lb_clientorder"
                                                    flid="ClientOrder" pgid="ClientOrder.aspx" prms="codId" etid="CodFId">
                                                    Nom de commande</label>
                                                <div class="col-sm-4" id="div_codname">
                                                    <select class="form-control" id="CodName" name="CodName" onchange="clientorderChange(this)">
                                                    </select>
                                                </div>
                                                <div class="col-sm-4 " id="div_codnameUp" style="display: none;">
                                                    <input class="form-control" id="CodNameUp" name="CodNameUp" />
                                                </div>
                                                <label class="col-sm-2 control-label language_txt">Code de commande</label>
                                                <div class="col-sm-4">
                                                    <input type="text" class="form-control" id="CodCode" name="CodCode" disabled="" />
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <label class="col-sm-2 control-label language_txt">Nom de facture</label>
                                                <div class="col-sm-4">
                                                    <input type="text" class="form-control" id="CinName" name="CinName" />
                                                </div>
                                                <label class="col-sm-2 control-label language_txt">Code de facture</label>
                                                <div class="col-sm-4">
                                                    <input type="text" class="form-control" id="CinCode" name="CinCode" disabled="" style="color: red;" />
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <label class="col-sm-2 control-label language_txt" onclick="return ExternLinkClick(this)" id="lb_delegataire">Délégataire</label>
                                                <div class="col-sm-3">
                                                    <select class="form-control" id="DelegatorId" name="DelegatorId"></select>
                                                </div>
                                                <div class="col-sm-1 forcreate forupdate center">
                                                    <button class="btn btn-inverse" onclick="return updateclientdelegatorclick()" title="Mettre à jour les délégataire">
                                                        <i class="fa fa-refresh"></i>
                                                    </button>
                                                </div>
                                                <div class="col-sm-1 forview center">
                                                    <button class="btn btn-inverse" onclick="return getclientdelegatoremail()" title="Copier l'E-mail de client et de délégataire">
                                                        <i class="fa fa-copy"></i>&nbsp;&nbsp;&nbsp;<i class="fa fa-envelope-o"></i>
                                                    </button>
                                                </div>
                                                <div class="col-sm-6"></div>
                                            </div>
                                            <div class="form-group forview fordfo" style="display: none;">
                                                <label class="col-sm-2 control-label language_txt" id="lb_dfo">Bon de Livraison</label>
                                                <div class="col-sm-4">
                                                    <input type="text" class="form-control  language_txt" id="DfoCode" name="DfoCode" disabled="" style="display: none;" />
                                                    <button id="btn_lst_bl" class="btn btn-inverse" onclick="return ViewDfoList()">Liste de bon de livraison</button>
                                                </div>
                                                <label class="col-sm-2 control-label language_txt">Facture entièrement payée</label>
                                                <div class="col-sm-4">
                                                    <input class="form-control" type="checkbox" id="CinIsFullPaid" name="CinIsFullPaid" />
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <label class="col-sm-2 control-label language_txt">Condition de paiement</label>
                                                <div class="col-sm-4">
                                                    <select class="form-control" id="PcoId" name="PcoId" onchange="CalculateDateTerm()">
                                                    </select>
                                                </div>
                                                <label class="col-sm-2 control-label language_txt">Mode de paiement</label>
                                                <div class="col-sm-4">
                                                    <select class="form-control" id="PmoId" name="PmoId">
                                                    </select>
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <label class="col-sm-2 control-label language_txt">TVA</label>
                                                <div class="col-sm-4">
                                                    <select class="form-control" id="VatId" name="VatId">
                                                    </select>
                                                </div>
                                                <label class="col-sm-2 control-label language_txt">DEVISE</label>
                                                <div class="col-sm-4">
                                                    <select class="form-control" id="CurId" name="CurId">
                                                    </select>
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <label class="col-sm-2 control-label language_txt">Date de facture</label>
                                                <div class="col-sm-4">
                                                    <div class="input-group">
                                                        <input class="form-control datepicker " id="_CinDInvoice" name="_CinDInvoice" onchange="CalculateDateTerm(this)"
                                                            disabled /><span class="input-group-addon"><i class="fa fa-calendar"></i></span>
                                                    </div>
                                                </div>
                                                <label class="col-sm-2 control-label language_txt">Date d'échance</label>
                                                <div class="col-sm-4">
                                                    <div class="input-group">
                                                        <input class="form-control datepicker " id="_CinDTerm" name="_CinDTerm" /><span class="input-group-addon"><i
                                                            class="fa fa-calendar"></i></span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <label class="col-sm-2 control-label language_txt">Commercial 1</label>
                                                <div class="col-sm-4">
                                                    <select id="UsrCom1" class="form-control">
                                                    </select>
                                                </div>
                                                <label class="col-sm-2 control-label language_txt">Commercial 2</label>
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
                                                <div class="col-sm-6" id="div_for_keyprj" style="display: none;">
                                                    <label class="col-sm-4 control-label language_txt" style="color: red;">Projet Important</label>
                                                    <div class="col-sm-8">
                                                        <input class="form-control" type="checkbox" id="CinKeyProject" name="CinKeyProject" />
                                                    </div>
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <label class="col-sm-2 control-label language_txt">Date d'encaissement</label>
                                                <div class="col-sm-4">
                                                    <div class="input-group">
                                                        <input class="form-control datepicker " id="_CinDEncaissement" name="_CinDEncaissement" /><span
                                                            class="input-group-addon"><i class="fa fa-calendar"></i></span>
                                                    </div>
                                                </div>
                                                <label class="col-sm-2 control-label forview language_txt">REMISE</label>
                                                <div class="col-sm-4 forview">
                                                    <input type="text" class="form-control" id="_CinDiscountAmount" name="_CinDiscountAmount"
                                                        style="color: red;" disabled="" />
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <label class="col-sm-2 control-label language_txt">Text en tête</label>
                                                <div class="col-sm-4">
                                                    <textarea class="form-control" cols="3" rows="5" id="CinHeaderText" name="CinHeaderText"></textarea>
                                                </div>
                                                <label class="col-sm-2 control-label"><span class="language_txt">Text du pied</span> &#32;</label>
                                                <div class="col-sm-4">
                                                    <textarea class="form-control" cols="3" rows="5" id="CinFooterText" name="CinFooterText"></textarea>
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <label class="col-sm-2 control-label language_txt">Commentaire pour client (en rouge)</label>
                                                <div class="col-sm-4">
                                                    <textarea class="form-control" cols="3" rows="5" id="CinClientComment" name="CinClientComment" style="color: red;"></textarea>
                                                </div>
                                                <label class="col-sm-2 control-label language_txt">Commentaire interne</label>
                                                <div class="col-sm-4">
                                                    <textarea class="form-control" cols="3" rows="5" id="CinInterComment" name="CinInterComment"></textarea>
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <label class="col-sm-2 control-label language_txt">Sélectionner une banque</label>
                                                <div class="col-sm-4">
                                                    <select class="form-control" id="CinBank" name="CinBank">
                                                    </select>
                                                </div>
                                                <label class="col-sm-2 control-label language_txt">Trade terms</label>
                                                <div class="col-sm-4">
                                                    <select class="form-control" id="TradeTermes" name="TradeTermes">
                                                    </select>
                                                </div>
                                            </div>
                                            <div class="form-group forview forcreate">
                                                <label class="col-sm-2 control-label  forview forcreate language_txt">Date de création</label>
                                                <div class="col-sm-4 forview forcreate">
                                                    <div class="input-group">
                                                        <input class="form-control datepicker " id="_dCreationString" name="_dCreationString"
                                                            disabled required="" /><span class="input-group-addon"><i class="fa fa-calendar"></i></span>
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
                                                    <button type="button" class="btn btn-inverse language_txt" id="bnt_upload_file" onclick="return uploadFile(this)">Télécharger le fichier</button>
                                                </div>
                                                <div class="col-sm-2 center">
                                                    <button type="button" class="btn btn-inverse language_txt" id="btn_delete_cod_file" onclick="return delete_cin_file_click()"
                                                        style="display: none;">
                                                        Supprimer le fichier</button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="col-md-3 forview" id="div_cin_payement">
                                <div class="box border inverse">
                                    <div class="box-title">
                                        <h4>
                                            <i class="fa fa-money"></i><span class="language_txt">Résumé</span></h4>
                                    </div>
                                    <div class="box-body">
                                        <div class="form-horizontal">
                                            <div class="form-group">
                                                <div class="col-md-12 center">
                                                    <button type="button" class="btn btn-inverse language_txt" onclick="PayTheInvoice(this)" cpyid="0">Payer</button>
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <label class="col-sm-6 control-label language_txt">Margin</label>
                                                <label class="col-sm-6 control-label" id="LbMargin">
                                                </label>
                                            </div>
                                            <div class="form-group">
                                                <label class="col-sm-6 control-label language_txt">Montant TTC Total</label>
                                                <label class="col-sm-6 control-label" id="CinAmount">
                                                </label>
                                            </div>
                                            <div class="form-group">
                                                <label class="col-sm-6 control-label language_txt">Montant HT Total</label>
                                                <label class="col-sm-6 control-label" id="CinTotalAmountHt">
                                                </label>
                                            </div>
                                            <div class="form-group">
                                                <label class="col-sm-6 control-label language_txt">Déjà payé</label>
                                                <label class="col-sm-6 control-label" style="color: green;" id="CinPaid">
                                                </label>
                                            </div>
                                            <div class="form-group">
                                                <label class="col-sm-6 control-label language_txt">Reste à payer</label>
                                                <label class="col-sm-6 control-label" style="color: red;" id="CinLeftToPayer">
                                                </label>
                                            </div>
                                        </div>
                                        <div class="form-horizontal" id="cin_payment_records">
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-12">
                        <div class="row">
                            <div class="col-md-12" id="div_invoicing_address">
                                <div class="box border inverse">
                                    <div class="box-title">
                                        <h4>
                                            <i class="fa fa-globe"></i><span class="language_txt">Commercial Client</span></h4>
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
                                                <label class="col-sm-3 control-label language_txt">Nom de famille</label>
                                                <div class="col-sm-9">
                                                    <input type="text" class="form-control" id="Inv_CcoLastname" name="Inv_CcoLastname"
                                                        placeholder="Nom de famille" maxlength="200">
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <label class="col-sm-3 control-label language_txt">Adresse 1</label>
                                                <div class="col-sm-9">
                                                    <input type="text" class="form-control" id="Inv_CcoAddress1" name="Inv_CcoAddress1"
                                                        placeholder="Adresse 1" maxlength="200">
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <label class="col-sm-3 control-label language_txt">Adresse 2</label>
                                                <div class="col-sm-9">
                                                    <input type="text" class="form-control" id="Inv_CcoAddress2" name="Inv_CcoAddress2"
                                                        placeholder="Adresse 2" maxlength="200">
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <label class="col-sm-3 control-label language_txt">Code postal</label>
                                                <div class="col-sm-9">
                                                    <input type="text" class="form-control" id="Inv_CcoPostcode" name="Inv_CcoPostcode"
                                                        onkeyup="getCommuneName(this,'Inv_CcoCity')" placeholder="Code postal" maxlength="10">
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <label class="col-sm-3 control-label language_txt">Ville</label>
                                                <div class="col-sm-9">
                                                    <input type="text" class="form-control" list="Inv_CcoCity" id="Inv_ip_CcoCity" placeholder="Ville"
                                                        oninput="communeChange('Inv_ip_CcoCity','Inv_CcoCity','Inv_CcoPostcode')" maxlength="200">
                                                    <datalist id="Inv_CcoCity">
                                                    </datalist>
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <label class="col-sm-3 control-label language_txt">Pays</label>
                                                <div class="col-sm-9">
                                                    <input type="text" class="form-control" id="Inv_CcoCountry" name="Inv_CcoCountry"
                                                        placeholder="Pays" maxlength="200">
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
                            <div class="col-md-6" id="div_delivery_address" style="display: none;">
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
                                                <label class="col-sm-3 control-label language_txt">Prénom</label>
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
                                                <label class="col-sm-3 control-label language_txt">Adresse 1</label>
                                                <div class="col-sm-9">
                                                    <input type="text" class="form-control" id="Dlv_CcoAddress1" name="Dlv_CcoAddress1"
                                                        placeholder="Adresse 1" maxlength="200">
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <label class="col-sm-3 control-label language_txt">Adresse 2</label>
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
                <div class="row">
                    <div class="col-md-12">
                        <div class="modal-body center forcreate">
                            <button type="button" class="btn btn-inverse language_txt" onclick="return CreateUpdateClientInvoice(this)">Créer</button>
                        </div>
                        <div class="modal-body center forupdate">
                            <button type="button" class="btn btn-default language_txt" onclick="changeViewMode('view')">Annuler</button>
                            <button type="button" class="btn btn-inverse language_txt" onclick="return CreateUpdateClientInvoice(this)">Mettre à jour</button>
                        </div>
                        <div class="modal-body center forview">
                            <button type="button" class="btn btn-inverse language_txt" onclick="changeViewMode('modify')"
                                id="btn_modify_bottom">
                                Modifier</button>
                        </div>
                    </div>
                </div>
                <div class="separator">
                </div>
                <!--- Cost Plan Lines -->
                <div class="row">
                    <div class="col-md-12">
                        <div class="col-md-12">
                            <div class="row forview">
                                <div class="box border inverse">
                                    <div class="box-title">
                                        <h4 style="overflow: hidden;">
                                            <i class="fa fa-bars"></i><span class="language_txt">Les lignes de Facture</span>&nbsp; <span id="PtyName_general"></span>
                                        </h4>
                                    </div>
                                    <div class="box-body">
                                        <div class="modal-body center forview">
                                            <button type="button" class="btn btn-inverse forupdate language_txt" onclick="setAddUpdateLine();"
                                                id="btn_add_line_top">
                                                Ajouter une Ligne</button>
                                            <button type="button" class="btn btn-inverse forupdate language_txt" onclick="return addupdateDrvAcc();"
                                                id="btn_add_drv_top">
                                                Ajouter un driver/accessoire</button>
                                            <button type="button" class="btn btn-inverse forupdate language_txt" style="display: none;" onclick="return addLines2Lgs();"
                                                id="btn_add2lgs_top">
                                                Livrer le(s) ligne(s) sélectionnée(s)</button>
                                            <button type="button" class="btn btn-inverse forupdate language_txt" style="display: none;" onclick="return CreateSodByCiiClick();"
                                                id="btn_add2sod_top">
                                                Créer une CF
                                            </button>
                                            <button type="button" class="btn btn-inverse forupdate language_txt" style="display: none;" onclick="return addLines2Comb();"
                                                id="btn_add2comb_top">
                                                Fusionner les lignes sélectionnées</button>
                                        </div>
                                        <div class="form-horizontal center" style="width: 100%; overflow-x: auto;">
                                            <table cellpadding="0" cellspacing="0" border="0" class="table table-striped table-bordered table-hover">
                                                <thead id="thead_cost_plan_line">
                                                    <%--<tr role="row">
                                                        <th rowspan="1" colspan="1">Ordre<input type="checkbox" id="ip_select_all_cin" style="display: none;" onclick="selectAllCinLgs(this)"/></th>
                                                        <th rowspan="1" colspan="1" class="language_txt">Produit</th>
                                                        <th rowspan="1" colspan="1" class="language_txt">Référence</th>
                                                        <th rowspan="1" colspan="1" class="language_txt">Image</th>
                                                        <th rowspan="1" colspan="1" class="language_txt">Description</th>
                                                        <th rowspan="1" colspan="1" class="language_txt">Quantité</th>
                                                        <th rowspan="1" colspan="1" class="language_txt">Prix d'achat</th>
                                                        <th rowspan="1" colspan="1" class="language_txt">Prix unitaire</th>
                                                        <th rowspan="1" colspan="1" class="language_txt">Prix remisé</th>
                                                        <th rowspan="1" colspan="1" class="language_txt">TVA</th>
                                                        <th rowspan="1" colspan="1" class="language_txt">Total H.T</th>
                                                        <th rowspan="1" colspan="1" class="language_txt">Total T.T.C</th>
                                                        <th rowspan="1" colspan="1" id="th_btns"></th>
                                                    </tr>--%>
                                                </thead>
                                                <tbody id="tbody_cost_plan_line" style="text-align: center !important">
                                                </tbody>
                                            </table>
                                        </div>
                                        <div class="modal-body center forview">
                                            <button type="button" class="btn btn-inverse forupdate language_txt" onclick="setAddUpdateLine();"
                                                id="btn_add_line_bottom">
                                                Ajouter une Ligne</button>
                                            <button type="button" class="btn btn-inverse forupdate language_txt" onclick="return addupdateDrvAcc();"
                                                id="btn_add_drv_bottom">
                                                Ajouter un driver/accessoire</button>
                                            <button type="button" class="btn btn-inverse forupdate language_txt" style="display: none;" onclick="return addLines2Lgs();"
                                                id="btn_add2lgs_bottom">
                                                Livrer le(s) ligne(s) sélectionnée(s)</button>
                                            <button type="button" class="btn btn-inverse forupdate language_txt" style="display: none;" onclick="return CreateSodByCiiClick();"
                                                id="btn_add2sod_bottom">
                                                Créer une CF
                                            </button>
                                            <button type="button" class="btn btn-inverse forupdate language_txt" style="display: none;" onclick="return addLines2Comb();"
                                                id="btn_add2comb_bottom">
                                                Fusionner les lignes sélectionnées</button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-12 forview">
                            <div class="row">
                                <div class="col-md-12" id="div_client_order_pdf">
                                    <div class="box border inverse">
                                        <div class="box-title">
                                            <h4>
                                                <i class="fa fa-globe"></i><span class="language_txt">Fichier de facture</span></h4>
                                            <div class="tools">
                                                <a href="javascript:;" class="collapse" id="a_collapse"><i class="fa fa-chevron-up"></i></a>
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
                        </div>
                    </div>
                </div>
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
    <!-- BOOTSTRAP WYSIWYG -->
    <script type="text/javascript" src="../../js/bootstrap-wysiwyg/jquery.hotkeys.min.js"></script>
    <script type="text/javascript" src="../../js/bootstrap-wysiwyg/bootstrap-wysiwyg.min.js"></script>
    <!-- CKEDITOR -->
    <script type="text/javascript" src="../../js/ckeditor/ckeditor.js"></script>
    <!-- End DATE PICKER -->
    <script>
        function getFileDataPopUp(myFile) {
            var file = myFile.files[0];
            var filename = file.name;
            if (filename) {
                $('#btnSubmitUploadFilePopUp').show();
                $('#btnCancelUploadFilePopUp').show(); //$('#div_description_imagePopUp').show();
            } else {
                $('#btnSubmitUploadFilePopUp').hide();
                $('#btnCancelUploadFilePopUp').hide();
                //$('#div_description_imagePopUp').hide(); } $('#uploadFileNamePopUp').text(filename);
                //alert(filename); } function hideUploadPopUp() { $('#btnSubmitUploadFilePopUp').hide();
                $('#btnCancelUploadFilePopUp').hide(); //$('#div_description_imagePopUp').hide();
                $('#iptUploadFilePopUp').val('');
            }
            $('#uploadFileNamePopUp').text(filename);

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
