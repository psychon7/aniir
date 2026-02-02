<%@ Page Title="" Language="C#" MasterPageFile="~/Site.Master" AutoEventWireup="true"
    CodeBehind="SupplierInvoice.aspx.cs" Inherits="ERP.Web.Views.SupplierInvoice.SupplierInvoice" %>
<%@ Import Namespace="System.Web.Configuration" %>

<asp:Content ID="Content1" ContentPlaceHolderID="HeadContent" runat="server">
    <title>ERP - Facture Fournisseur PI</title>
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
    <script src="../../js/ERP/SupplierInvoice/SupplierInvoice.js?V=<%= WebConfigurationManager.AppSettings["jsVersion"] %>"
        type="text/javascript"></script>
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
    <label style="display: none;" id="hf_prd_id">
    </label>
    <label style="display: none;" id="hf_pit_id">
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
                                <li><a href="SearchSupplierInvoice.aspx">&nbsp;<span class="language_txt">Rechercher une Facture Fournisseur (PI)</span></a>
                                </li>
                                <li class="a_pointer" id="li_sod" style="display: none;"><a onclick="goSod()">&nbsp;<span class="language_txt">Commande Founisseur</span></a></li>
                                <li>&nbsp;<span class="language_txt">Facutre Fournisseur (PI)</span></li>
                            </ul>
                            <!-- /BREADCRUMBS -->
                            <div class="clearfix">
                                <h3 class="content-title pull-left">
                                    &nbsp;<span class="language_txt">Facutre Fournisseur (PI)</span></h3>
                            </div>
                            <div class="description">
                                <span class="language_txt">Création, modification, consultation une Facutre Fournisseur (PI)</span></div>
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
                                    <div class="box-body">
                                        <div class="form-horizontal">
                                            <div class="form-group">
                                                <label class="col-sm-4 control-label fieldRequired language_txt" id="lb_supplier" pgid="Supplier.aspx"
                                                    prms="supId" flid="Supplier" onclick="return ExternLinkClick(this)" etid="SupFId">Fournisseur</label>
                                                <div class="col-sm-8">
                                                    <select id="SupId" class="form-control" required onchange="SupplierChanged(this)">
                                                    </select>
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <label class="col-sm-4 control-label fieldRequired language_txt">Nom de la facture</label>
                                                <div class="col-sm-8">
                                                    <input class="form-control" id="SinName" name="SinName" required />
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <label class="col-sm-4 control-label language_txt">Code de la facture</label>
                                                <div class="col-sm-8">
                                                    <input type="text" class="form-control" id="SinCode" name="SinCode" disabled="" />
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <label class="col-sm-4 control-label language_txt">DEVISE</label>
                                                <div class="col-sm-8">
                                                    <select class="form-control" id="CurId" name="CurId">
                                                    </select>
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <label class="col-sm-4 control-label language_txt">TVA</label>
                                                <div class="col-sm-8">
                                                    <select class="form-control" id="VatId" name="VatId">
                                                    </select>
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <label class="col-sm-4 control-label language_txt" style="color: red;">Payé</label>
                                                <div class="col-sm-8">
                                                    <input type="checkbox" class="form-control" id="SinIsPaid" name="SinIsPaid" />
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <label class="col-sm-4 control-label language_txt">Commencer la production ?</label>
                                                <div class="col-sm-8">
                                                    <input type="checkbox" class="form-control" id="SinStartProduction" name="SinStartProduction" />
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <label class="col-sm-4 control-label language_txt">Date de fabrication</label>
                                                <div class="col-sm-8">
                                                    <input type="text" class="form-control datepicker" id="_DateStartProduction" name="_DateStartProduction" />
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <label class="col-sm-4 control-label language_txt">Date de la fin de fabrication prévu</label>
                                                <div class="col-sm-8">
                                                    <input type="text" class="form-control datepicker" id="_DateCompleteProductionPlanned"
                                                        name="_DateCompleteProductionPlanned" />
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <label class="col-sm-4 control-label language_txt">Date de la fin de fabrication réél</label>
                                                <div class="col-sm-8">
                                                    <input type="text" class="form-control datepicker" id="_DateCompleteProduction" name="_DateCompleteProduction" />
                                                </div>
                                            </div>
                                            <div class="form-group"> 
                                                <label class="col-sm-4 control-label language_txt">Terminer la production ?</label>
                                                <div class="col-sm-8">
                                                    <input type="checkbox" class="form-control" id="SinCompleteProduction" name="SinCompleteProduction" />
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <label class="col-sm-4 control-label language_txt">Commentaire pour fournisseur</label>
                                                <div class="col-sm-8">
                                                    <textarea class="form-control" cols="3" rows="4" id="SupplierComment" name="SupplierComment"></textarea>
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <label class="col-sm-4 control-label language_txt">Commentaire interne</label>
                                                <div class="col-sm-8">
                                                    <textarea class="form-control" cols="3" rows="4" id="InterComment" name="InterComment"></textarea>
                                                </div>
                                            </div>
                                            <div class="form-group forview forcreate">
                                                <label class="col-sm-4 control-label forview forcreate language_txt">Date de création</label>
                                                <div class="col-sm-8 forview forcreate">
                                                    <div class="input-group">
                                                        <input class="form-control datepicker" id="DateCreation" name="DateCreation" required="" /><span
                                                            class="input-group-addon"><i class="fa fa-calendar"></i></span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div class="form-group forview">
                                                <label class="col-sm-4 control-label language_txt">Date de mis à jours</label>
                                                <div class="col-sm-8 forview">
                                                    <div class="input-group">
                                                        <input class="form-control " id="DateUpdate" name="DateUpdate" disabled="" /><span
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
                                            <div class="form-group">
                                                <div class="col-sm-12">
                                                    <div class="modal-body center forcreate">
                                                        <button type="button" class="btn btn-inverse language_txt" onclick="return js_create_update_item()">Créer</button>
                                                    </div>
                                                    <div class="modal-body center forupdate">
                                                        <button type="button" class="btn btn-default language_txt" onclick="changeViewMode('view')">Annuler</button>
                                                        <button type="button" class="btn btn-inverse language_txt" onclick="return js_create_update_item()">Mettre à jour</button>
                                                    </div>
                                                    <div class="modal-body center forview">
                                                        <button type="button" class="btn btn-inverse language_txt"  id="bnt_upload_file" onclick="return uploadFile(6)">Télécharger le PI</button>
                                                        <button type="button" class="btn btn-inverse language_txt" id="btn_delete_cod_file" onclick="return delete_file_click(6)"
                                                            style="display: none;">Supprimer le PI</button>
                                                    </div>
                                                    <div class="modal-body center forview">
                                                        <button type="button" class="btn btn-inverse language_txt" id="btn_upload_bank_receipt" onclick="return uploadFile(7)">Télécharger le preuve de virement</button>
                                                        <button type="button" class="btn btn-inverse language_txt"  id="btn_delete_bank_receipt" onclick="return delete_file_click(7)"
                                                            style="display: none;">Supprimer le preuve de virement</button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="col-md-4" id="div_bank_info">
                                <div class="box border inverse">
                                    <div class="box-title">
                                        <h4>
                                            <i class="fa fa-bars"></i><span class="language_txt">Information Banquaire</span></h4>
                                    </div>
                                    <div class="box-body">
                                        <div class="form-horizontal">
                                            <div class="form-group">
                                                <label class="col-sm-4 control-label language_txt">Bank Name</label>
                                                <div class="col-sm-8">
                                                    <select id="BankName" class="form-control" onchange="BankInfoChange(this)">
                                                    </select>
                                                </div>
                                            </div>
                                            <div class="form-group ">
                                                <label class="col-sm-4 control-label language_txt">Bank Address</label>
                                                <div class="col-sm-8">
                                                    <input type="text" class="form-control" disabled="" id="BankAdr" name="BankAdr" />
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <label class="col-sm-4 control-label language_txt">Account Name (Owner name)</label>
                                                <div class="col-sm-8">
                                                    <input class="form-control" id="AccountOwner" name="AccountOwner" disabled="" />
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <label class="col-sm-4 control-label language_txt">Account Number</label>
                                                <div class="col-sm-8">
                                                    <input type="text" class="form-control" id="AccountNumber" name="AccountNumber" disabled="" />
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <label class="col-sm-4 control-label language_txt">BIC (SWIFT)</label>
                                                <div class="col-sm-8">
                                                    <input type="text" class="form-control" disabled="" id="Bic" name="Bic" />
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <label class="col-sm-4 control-label language_txt">IBAN</label>
                                                <div class="col-sm-8">
                                                    <input type="text" class="form-control" disabled="" id="Iban" name="Iban" />
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <label class="col-sm-4 control-label language_txt">RIB- Code banque</label>
                                                <div class="col-sm-8">
                                                    <input type="text" class="form-control" disabled="" id="RibBankCode" name="RibBankCode" />
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <label class="col-sm-4 control-label language_txt">RIB- Code agence</label>
                                                <div class="col-sm-8">
                                                    <input type="text" class="form-control" disabled="" id="RibAgenceCode" name="RibAgenceCode" />
                                                </div>
                                            </div>
                                            <div class="form-group ">
                                                <label class="col-sm-4 control-label language_txt">RIB- Numéro de compte</label>
                                                <div class="col-sm-8">
                                                    <input type="text" class="form-control" disabled="" id="RibAccountNumber" name="RibAccountNumber" />
                                                </div>
                                            </div>
                                            <div class="form-group ">
                                                <label class="col-sm-4 control-label language_txt">RIB- Clé RIB</label>
                                                <div class="col-sm-8 ">
                                                    <input type="text" class="form-control" disabled="" id="RibKey" name="RibKey" />
                                                </div>
                                            </div>
                                            <div class="form-group ">
                                                <label class="col-sm-4 control-label language_txt">RIB- Agence de domiciliation</label>
                                                <div class="col-sm-8">
                                                    <input type="text" class="form-control" disabled="" id="RibAgencyAdr" name="RibAgencyAdr" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="col-md-4" id="div_delivery_address">
                                <div class="box border inverse">
                                    <div class="box-title">
                                        <h4>
                                            <i class="fa fa-globe"></i><span class="language_txt">Information de Contact</span></h4>
                                    </div>
                                    <div class="box-body">
                                        <div class="form-horizontal">
                                            <div class="form-group forview">
                                                <div class="col-sm-12">
                                                    <div class="modal-body center">
                                                        <button type="button" class="btn btn-inverse language_txt" id="btn_delete" onclick="return delete_click()">Supprimer</button>
                                                        <%--<button type="button" class="btn btn-info" id="btn_generate_pdf" style="display: none;"
                                                            onclick="return downloadPdf(this)">
                                                            Générer PDF</button>--%>
                                                        <button type="button" class="btn btn-inverse language_txt" onclick="changeViewMode('modify')"
                                                            id="btn_modify">Modifier</button>
                                                        <button type="button" class="btn btn-inverse language_txt" id="btn_create_client_invoice" style="display: none;"
                                                            onclick="return createClientFactureClick()">Créer une facture</button>
                                                    </div>
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <label class="col-sm-4 control-label fieldRequired language_txt">Contact fournisseur</label>
                                                <div class="col-sm-8">
                                                    <select class="form-control" id="ScoId" name="ScoId" onchange="scoChange(this)" required="">
                                                    </select>
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <label class="col-sm-4 control-label language_txt">Référence</label>
                                                <div class="col-sm-8">
                                                    <input class="form-control" id="ScoRef" name="ScoRef" type="text" disabled="" />
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <label class="col-sm-4 control-label language_txt">Prénom</label>
                                                <div class="col-sm-8">
                                                    <input type="text" class="form-control" id="ScoFirstname" name="ScoFirstname" disabled="" />
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <label class="col-sm-4 control-label language_txt">Nom de famille</label>
                                                <div class="col-sm-8">
                                                    <input type="text" class="form-control" id="ScoLastname" name="ScoLastname" disabled=""
                                                        maxlength="200">
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <label class="col-sm-4 control-label language_txt">Adresse 1</label>
                                                <div class="col-sm-8">
                                                    <input type="text" class="form-control" id="ScoAddress1" name="ScoAddress1" disabled=""
                                                        maxlength="200">
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <label class="col-sm-4 control-label language_txt">Adresse 2</label>
                                                <div class="col-sm-8">
                                                    <input type="text" class="form-control" id="ScoAddress2" name="ScoAddress2" disabled=""
                                                        maxlength="200">
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <label class="col-sm-4 control-label language_txt">Code postal</label>
                                                <div class="col-sm-8">
                                                    <input type="text" class="form-control" id="ScoPostcode" name="ScoPostcode" disabled=""
                                                        maxlength="10">
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <label class="col-sm-4 control-label language_txt">Ville</label>
                                                <div class="col-sm-8">
                                                    <input type="text" class="form-control" id="ScoCity" maxlength="200" disabled="">
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <label class="col-sm-4 control-label language_txt">Pays</label>
                                                <div class="col-sm-8">
                                                    <input type="text" class="form-control" id="ScoCountry" name="ScoCountry" disabled=""
                                                        maxlength="200">
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <label class="col-sm-4 control-label language_txt">Tél</label>
                                                <div class="col-sm-8">
                                                    <input type="text" class="form-control" id="ScoTel1" name="ScoTel1" disabled="" maxlength="30">
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <label class="col-sm-4 control-label language_txt">Fax</label>
                                                <div class="col-sm-8">
                                                    <input type="text" class="form-control" id="ScoFax" name="ScoFax" disabled="" maxlength="30">
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <label class="col-sm-4 control-label language_txt">Portable</label>
                                                <div class="col-sm-8">
                                                    <input type="text" class="form-control" id="ScoCellphone" name="ScoCellphone" disabled=""
                                                        maxlength="30">
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <label class="col-sm-4 control-label language_txt">Email</label>
                                                <div class="col-sm-8">
                                                    <input type="text" class="form-control" id="ScoEmail" name="ScoEmail" disabled="" />
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
                                            <i class="fa fa-bars"></i><span class="language_txt">Les lignes de facture</span>&nbsp;
                                        </h4>
                                    </div>
                                    <div class="box-body">
                                        <div class="modal-body center forview">
                                            <button type="button" class="btn btn-inverse forupdate language_txt" onclick="setAddUpdateLine();">Ajouter une Ligne</button>
                                        </div>
                                        <div class="form-horizontal center" style="width: 100%; overflow-x: auto;">
                                            <table cellpadding="0" cellspacing="0" border="0" class="table table-striped table-bordered table-hover">
                                                <thead>
                                                    <tr role="row">
                                                        <th rowspan="1" colspan="1" class="language_txt">Ordre</th>
                                                        <th rowspan="1" colspan="1" class="language_txt">Produit</th>
                                                        <th rowspan="1" colspan="1" class="language_txt">Référence</th>
                                                        <th rowspan="1" colspan="1" class="language_txt">Description</th>
                                                        <th rowspan="1" colspan="1" class="language_txt">Image</th>
                                                        <th rowspan="1" colspan="1" class="language_txt">Quantité</th>
                                                        <th rowspan="1" colspan="1" class="language_txt">Prix d'achat</th>
                                                        <th rowspan="1" colspan="1" class="language_txt">Prix remisé</th>
                                                        <th rowspan="1" colspan="1" class="language_txt">Total H.T</th>
                                                        <th rowspan="1" colspan="1" class="language_txt">Total T.T.C</th>
                                                        <th rowspan="1" colspan="1" class="thBtns">
                                                        </th>
                                                    </tr>
                                                </thead>
                                                <tbody id="tbody_lines" style="text-align: center !important">
                                                </tbody>
                                            </table>
                                        </div>
                                        <div class="modal-body center forview">
                                            <button type="button" class="btn btn-inverse forupdate" onclick="setAddUpdateLine();">
                                                Ajouter une Ligne</button>
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
                        <div class="col-md-12" id="div_pdf">
                            <div class="box border inverse">
                                <div class="box-title">
                                    <h4>
                                        <i class="fa fa-globe"></i><span class="language_txt">Fichier de PI</span></h4>
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
                </div>
            </div>
            <div class="row forview">
                <div class="col-md-12">
                    <div class="row">
                        <div class="col-md-12" id="div1">
                            <div class="box border inverse">
                                <div class="box-title">
                                    <h4>
                                        <i class="fa fa-globe"></i><span class="language_txt">Fichier de preuve de virement</span></h4>
                                    <div class="tools">
                                        <a href="javascript:;" class="collapse" id="a_collapse_bank"><i class="fa fa-chevron-up">
                                        </i></a>
                                    </div>
                                </div>
                                <div class="box-body">
                                    <div class="form-horizontal">
                                        <div class="form-group">
                                            <div class="col-sm-12">
                                                <iframe height="1000" width="100%" id="iframepdf_bank"></iframe>
                                            </div>
                                        </div>
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
