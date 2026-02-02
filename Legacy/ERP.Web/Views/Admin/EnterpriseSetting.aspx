<%@ Page Title="" Language="C#" MasterPageFile="~/Site.Master" AutoEventWireup="true"
    CodeBehind="EnterpriseSetting.aspx.cs" Inherits="ERP.Web.Views.Admin.EnterpriseSetting" %>

<%@ Import Namespace="System.Web.Configuration" %>
<asp:Content ID="Content1" ContentPlaceHolderID="HeadContent" runat="server">
    <title>ERP - Paramètres de la société</title>
    <!-- JQUERY UI DATE PICKER -->
    <link rel="stylesheet" type="text/css" href="../../js/jquery-ui-1.10.3.custom/css/custom-theme/jquery-ui-1.10.3.custom.min.css" />
    <!-- End JQUERY UI DATE PICKER -->
    <!-- COLORBOX -->
    <link rel="stylesheet" type="text/css" href="../../js/colorbox/colorbox.min.css" />
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
    <script src="../../js/ERP/date.js" type="text/javascript"></script>
    <script src="../../js/ERP/Admin/EnterpriseSettingJS.js?V=<%= WebConfigurationManager.AppSettings["jsVersion"] %>"
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
                                <li><i class="fa fa-home"></i><a href="../../Default.aspx">&nbsp;Home</a> </li>
                                <li>&nbsp;Paramètres de la société</li>
                            </ul>
                            <!-- /BREADCRUMBS -->
                            <div class="clearfix">
                                <h3 class="content-title pull-left">
                                    &nbsp;Paramètres de la société</h3>
                            </div>
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
                                            <i class="fa fa-bars"></i>Informations généraux</h4>
                                    </div>
                                    <div class="box-body">
                                        <div class="form-horizontal" id="div_generel_info">
                                            <div class="form-group">
                                                <div class="col-md-6">
                                                </div>
                                                <div class="col-md-6 center">
                                                    <div class="modal-body center">
                                                        <button type="button" class="btn btn-inverse" onclick="return UpdateSociety()">
                                                            Mettre à jour</button>
                                                    </div>
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <label class="col-sm-2 control-label fieldRequired">
                                                    Raison sociale</label>
                                                <div class="col-sm-4">
                                                    <input class="form-control" id="Society_Name" name="Society_Name" required="" />
                                                </div>
                                                <label class="col-sm-2 control-label fieldRequired">
                                                    Devise</label>
                                                <div class="col-sm-4">
                                                    <select class="form-control" id="Cur_Id" name="Cur_Id" required="">
                                                    </select>
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <label class="col-sm-2 control-label">
                                                    Raison sociale court</label>
                                                <div class="col-sm-4">
                                                    <input class="form-control" id="ShortLabel" name="ShortLabel" />
                                                </div>
                                                <label class="col-sm-2 control-label fieldRequired">
                                                    Language</label>
                                                <div class="col-sm-4">
                                                    <select class="form-control" id="Lng_Id" name="Lng_Id">
                                                    </select>
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <label class="col-sm-2 control-label">
                                                    Envoi automatique d'email</label>
                                                <div class="col-sm-4">
                                                    <input class="form-control" type="checkbox" id="Email_Auto" name="Email_Auto" />
                                                </div>
                                                <label class="col-sm-2 control-label">
                                                    Capital</label>
                                                <div class="col-sm-4">
                                                    <input type="text" class="form-control" id="Capital" name="Capital" />
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <label class="col-sm-2 control-label">
                                                    Le produit est obligatoire</label>
                                                <div class="col-sm-4">
                                                    <input class="form-control" type="checkbox" id="IsPrdMandatory" name="IsPrdMandatory" />
                                                </div>
                                                <label class="col-sm-2 control-label">
                                                    S'afficher bar de language</label>
                                                <div class="col-sm-4">
                                                    <input class="form-control" type="checkbox" id="ShowLanguageBar" name="ShowLanguageBar" />
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <label class="col-sm-2 control-label">
                                                    Permis de la création de logistique depuis la facture</label>
                                                <div class="col-sm-4">
                                                    <input class="form-control" type="checkbox" id="SocCinLgs" name="SocCinLgs" />
                                                </div>
                                            </div>
                                            <div class="separator">
                                            </div>
                                            <div class="form-group">
                                                <label class="col-sm-2 control-label">
                                                    Adresse 1</label>
                                                <div class="col-sm-4">
                                                    <input type="text" class="form-control" id="Address1" name="Address1" />
                                                </div>
                                                <label class="col-sm-2 control-label">
                                                    Adresse 2</label>
                                                <div class="col-sm-4">
                                                    <input type="text" class="form-control" id="Address2" name="Address2" />
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <label class="col-sm-2 control-label">
                                                    Code postal</label>
                                                <div class="col-sm-4">
                                                    <input type="text" class="form-control" id="PostCode" name="PostCode" />
                                                </div>
                                                <label class="col-sm-2 control-label">
                                                    Ville</label>
                                                <div class="col-sm-4">
                                                    <input type="text" class="form-control" id="City" name="City" />
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <label class="col-sm-2 control-label">
                                                    Pays</label>
                                                <div class="col-sm-4">
                                                    <input type="text" class="form-control" id="Country" name="Country" />
                                                </div>
                                                <label class="col-sm-2 control-label">
                                                    Tél</label>
                                                <div class="col-sm-4">
                                                    <input type="text" class="form-control" id="Telephone" name="Telephone" />
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <label class="col-sm-2 control-label">
                                                    Fax</label>
                                                <div class="col-sm-4">
                                                    <input type="text" class="form-control" id="Fax" name="Fax" />
                                                </div>
                                                <label class="col-sm-2 control-label">
                                                    Mobile</label>
                                                <div class="col-sm-4">
                                                    <input type="text" class="form-control" id="Cellphone" name="Cellphone" />
                                                </div>
                                            </div>
                                            <div class="separator">
                                            </div>
                                            <div class="form-group">
                                                <label class="col-sm-2 control-label">
                                                    Siret (IF)</label>
                                                <div class="col-sm-4">
                                                    <input type="text" class="form-control" id="Siret" name="Siret" />
                                                </div>
                                                <label class="col-sm-2 control-label">
                                                    R.C.S. (RC)</label>
                                                <div class="col-sm-4">
                                                    <input type="text" class="form-control" id="RCS" name="RCS" />
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <label class="col-sm-2 control-label">
                                                    TVA Intracom (ICE)</label>
                                                <div class="col-sm-4">
                                                    <input type="text" class="form-control" id="TvaIntra" name="TvaIntra" />
                                                </div>
                                                <label class="col-sm-2 control-label">
                                                    CNSS</label>
                                                <div class="col-sm-4">
                                                    <input type="text" class="form-control" id="Cnss" name="Cnss" />
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <label class="col-sm-2 control-label">
                                                    TAXE PRO</label>
                                                <div class="col-sm-4">
                                                    <input type="text" class="form-control" id="TaxePro" name="TaxePro" />
                                                </div>
                                            </div>
                                            <div class="separator">
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            
                                <div class="box border inverse">
                                    <!-- BOX -->
                                        <div class="box-title">
                                            <h4>
                                                <i class="fa fa-table"></i><span class="language_txt">Information de Banque (RIB)</span></h4>
                                        </div>
                                        <div class="box-body">
                                            <div class="modal-body center">
                                                <button type="button" class="btn btn-inverse language_txt" onclick="return viewCreateBankInfo();">
                                                    Créer un RIB</button>
                                            </div>
                                            <div class="box-body" id="div_bank_info" style="width: 100%; overflow-x: auto;">
                                            </div>
                                    </div>
                                    <!-- /BOX -->
                                </div>

                                <div class="box border inverse">
                                    <div class="box-title">
                                        <h4>
                                            <i class="fa fa-bars"></i>RIB Principal (Lorsque vous utilisez le relevé de facture, utilisez ceci)</h4>
                                    </div>
                                    <div class="box-body">
                                        <div class="form-horizontal">
                                            <div class="form-group">
                                                <label class="col-sm-4 control-label">
                                                    Identification de compte (pour la facture) 账户标识（用于发票）</label>
                                                <div class="col-sm-4">
                                                    <input class="form-control" id="RibAbre" name="RibAbre" maxlength="50" />
                                                </div>
                                                <div class="col-sm-4">
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <label class="col-sm-2 control-label">
                                                    Titulaire du compte (Account Owner) 账户名称</label>
                                                <div class="col-sm-4">
                                                    <textarea class="form-control" id="RibName" name="RibName" rows="5"></textarea>
                                                </div>
                                                <label class="col-sm-2 control-label">
                                                    Domiciliation de banque 银行名称</label>
                                                <div class="col-sm-4">
                                                    <textarea class="form-control" id="RibAddress" name="RibAddress" rows="5"></textarea>
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <label class="col-sm-1 control-label">
                                                    Code Banque</label>
                                                <div class="col-sm-1">
                                                    <input class="form-control" id="RibBankCode" name="RibBankCode" />
                                                </div>
                                                <label class="col-sm-1 control-label">
                                                    Code Agence</label>
                                                <div class="col-sm-1">
                                                    <input class="form-control" id="RibAgenceCode" name="RibAgenceCode" />
                                                </div>
                                                <label class="col-sm-1 control-label">
                                                    N° compte</label>
                                                <div class="col-sm-1">
                                                    <input class="form-control" id="RibAccountNumber" name="RibAccountNumber" />
                                                </div>
                                                <label class="col-sm-1 control-label">
                                                    Clé</label>
                                                <div class="col-sm-1">
                                                    <input class="form-control" id="RibKey" name="RibKey" />
                                                </div>
                                                <label class="col-sm-1 control-label">
                                                    Domiciliation 银行地址</label>
                                                <div class="col-sm-3">
                                                    <input class="form-control" id="RibDomiciliationAgency" name="RibDomiciliationAgency" />
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <label class="col-sm-2 control-label">
                                                    IBAN 账户号码</label>
                                                <div class="col-sm-4">
                                                    <input type="text" class="form-control" id="RibCodeIban" name="RibCodeIban" />
                                                </div>
                                                <label class="col-sm-2 control-label">
                                                    BIC/SWIFT CODE</label>
                                                <div class="col-sm-4">
                                                    <input type="text" class="form-control" id="RibCodeBic" name="RibCodeBic" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div class="box border inverse" style="display:none;">
                                    <div class="box-title">
                                        <h4>
                                            <i class="fa fa-bars"></i>Identifiant national de compte bancaire - RIB 银行信息 2</h4>
                                    </div>
                                    <div class="box-body">
                                        <div class="form-horizontal">
                                            <div class="form-group">
                                                <label class="col-sm-4 control-label">
                                                    Identification de compte (pour la facture) 账户标识（用于发票）</label>
                                                <div class="col-sm-4">
                                                    <input class="form-control" id="RibAbre2" name="RibAbre2" maxlength="50" />
                                                </div>
                                                <div class="col-sm-4">
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <label class="col-sm-2 control-label">
                                                    Titulaire du compte (Account Owner) 账户名称</label>
                                                <div class="col-sm-4">
                                                    <textarea class="form-control" id="RibName2" name="RibName2" rows="5"></textarea>
                                                </div>
                                                <label class="col-sm-2 control-label">
                                                    Domiciliation de banque 银行名称</label>
                                                <div class="col-sm-4">
                                                    <textarea class="form-control" id="RibAddress2" name="RibAddress2" rows="5"></textarea>
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <label class="col-sm-1 control-label">
                                                    Code Banque</label>
                                                <div class="col-sm-1">
                                                    <input class="form-control" id="RibBankCode2" name="RibBankCode2" />
                                                </div>
                                                <label class="col-sm-1 control-label">
                                                    Code Agence</label>
                                                <div class="col-sm-1">
                                                    <input class="form-control" id="RibAgenceCode2" name="RibAgenceCode2" />
                                                </div>
                                                <label class="col-sm-1 control-label">
                                                    N° compte</label>
                                                <div class="col-sm-1">
                                                    <input class="form-control" id="RibAccountNumber2" name="RibAccountNumber2" />
                                                </div>
                                                <label class="col-sm-1 control-label">
                                                    Clé</label>
                                                <div class="col-sm-1">
                                                    <input class="form-control" id="RibKey2" name="RibKey2" />
                                                </div>
                                                <label class="col-sm-1 control-label">
                                                    Domiciliation 银行地址</label>
                                                <div class="col-sm-3">
                                                    <input class="form-control" id="RibDomiciliationAgency2" name="RibDomiciliationAgency2" />
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <label class="col-sm-2 control-label">
                                                    IBAN 账户号码</label>
                                                <div class="col-sm-4">
                                                    <input type="text" class="form-control" id="RibCodeIban2" name="RibCodeIban2" />
                                                </div>
                                                <label class="col-sm-2 control-label">
                                                    BIC/SWIFT CODE</label>
                                                <div class="col-sm-4">
                                                    <input type="text" class="form-control" id="RibCodeBic2" name="RibCodeBic2" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div class="box border inverse">
                                    <div class="box-title">
                                        <h4>
                                            <i class="fa fa-bars"></i>Text en-tête et pied de page</h4>
                                    </div>
                                    <div class="box-body">
                                        <div class="form-horizontal">
                                            <div class="form-group">
                                                <label class="col-sm-2 control-label">
                                                    Text en-tête de Devis</label>
                                                <div class="col-sm-4">
                                                    <textarea class="form-control" id="CostPlanHeader" name="CostPlanHeader" rows="5"></textarea>
                                                </div>
                                                <label class="col-sm-2 control-label">
                                                    Text pied de Devis</label>
                                                <div class="col-sm-4">
                                                    <textarea class="form-control" id="CostPlanFooter" name="CostPlanFooter" rows="5"></textarea>
                                                </div>
                                            </div>
                                            <div class="separator">
                                            </div>
                                            <div class="form-group">
                                                <label class="col-sm-2 control-label">
                                                    Condition de BL</label>
                                                <div class="col-sm-4">
                                                    <textarea class="form-control" id="DeliveryFooterCondition" name="DeliveryFooterCondition"
                                                        rows="5"></textarea>
                                                </div>
                                                <label class="col-sm-2 control-label">
                                                    Loi de livraison</label>
                                                <div class="col-sm-4">
                                                    <textarea class="form-control" id="DeliveryFooterLaw" name="DeliveryFooterLaw" rows="5"></textarea>
                                                </div>
                                            </div>
                                            <div class="separator">
                                            </div>
                                            <div class="form-group">
                                                <label class="col-sm-2 control-label">
                                                    Text en-tête de Facture</label>
                                                <div class="col-sm-4">
                                                    <textarea class="form-control" id="OtherHeader" name="OtherHeader" rows="5"></textarea>
                                                </div>
                                                <label class="col-sm-2 control-label">
                                                    Text pied de Facture</label>
                                                <div class="col-sm-4">
                                                    <textarea class="form-control" id="OtherFooter" name="OtherFooter" rows="5"></textarea>
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <label class="col-sm-2 control-label">
                                                    Pénalité de Facture</label>
                                                <div class="col-sm-4">
                                                    <textarea class="form-control" id="ClientInvoicePenality" name="ClientInvoicePenality"
                                                        rows="5"></textarea>
                                                </div>
                                                <label class="col-sm-2 control-label">
                                                    Escompte et paiement anticipé de Facture</label>
                                                <div class="col-sm-4">
                                                    <textarea class="form-control" id="ClientInvoiceDiscountForPrepayment" name="ClientInvoiceDiscountForPrepayment"
                                                        rows="5"></textarea>
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <label class="col-sm-2 control-label">
                                                    Email content de facture</label>
                                                <div class="col-sm-4">
                                                    <textarea class="form-control" id="ClinetInvoiceEmail" name="ClinetInvoiceEmail"
                                                        rows="5"></textarea>
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <div class="col-md-6">
                                                </div>
                                                <div class="col-md-6 center">
                                                    <div class="modal-body center">
                                                        <button type="button" class="btn btn-inverse" onclick="return UpdateSociety()">
                                                            Mettre à jour</button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div class="box border inverse">
                                    <div class="box-title">
                                        <h4>
                                            <i class="fa fa-dollar"></i><i class="fa fa-euro"></i>DEVISES EXCHANGE</h4>
                                    </div>
                                    <div class="box-body">
                                        <div class="form-horizontal">
                                            <div class="form-group">
                                                <label class="col-sm-2 control-label">
                                                    EURO € → USD $</label>
                                                <label class="col-sm-2 control-label" id="label_euro">
                                                </label>
                                                <label class="col-sm-2 control-label">
                                                    CNY ¥ → USD $</label>
                                                <label class="col-sm-2 control-label" id="label_cny">
                                                </label>
                                                <label class="col-sm-2 control-label">
                                                    GBP £ → USD $</label>
                                                <label class="col-sm-2 control-label" id="label_gbp">
                                                </label>
                                            </div>
                                            <div class="form-group">
                                                <label class="col-sm-2 control-label">
                                                    HKD → USD $</label>
                                                <label class="col-sm-2 control-label" id="label_hkd">
                                                </label>
                                                <label class="col-sm-2 control-label">
                                                    Rbs ₽ → USD $</label>
                                                <label class="col-sm-2 control-label" id="label_rbs">
                                                </label>
                                                <label class="col-sm-2 control-label">
                                                    MAD DH → USD $</label>
                                                <div class="col-sm-2">
                                                    <input class="form-control" id="inp_mad" name="inp_mad" type="number" step="0.001" min="0"/>
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <label class="col-sm-2 control-label">
                                                    Update time : </label>
                                                <label class="col-sm-2 control-label"  style="color:red" id="label_cur_updatetime">
                                                </label>
                                                <div class="col-md-8 center">
                                                    <div class="modal-body center">
                                                        <button type="button" class="btn btn-inverse" onclick="return UpdateCurrency()">
                                                            Mettre à jour le taux d'échange</button>
                                                            <%--<asp:Button runat="server" id="updatecinonce" OnClick="updatecinonce_OnClick" Text="update cin"/>--%>
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
    <!-- DATE PICKER -->
    <script type="text/javascript" src="../../js/datepicker/picker.js"></script>
    <script type="text/javascript" src="../../js/datepicker/picker.date.js"></script>
    <script type="text/javascript" src="../../js/datepicker/picker.time.js"></script>
    <!-- End DATE PICKER -->
</asp:Content>
