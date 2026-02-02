<%@ Page Title="" Language="C#" MasterPageFile="~/Site.Master" AutoEventWireup="true"
    CodeBehind="Supplier.aspx.cs" Inherits="ERP.Web.Views.Supplier.Supplier" %>

<%@ Import Namespace="System.Web.Configuration" %>
<asp:Content ID="Content1" ContentPlaceHolderID="HeadContent" runat="server">
    <title>ERP - Fournisseur</title>
    <!-- DATA TABLES -->
    <!-- JQUERY UI DATE PICKER -->
    <link rel="stylesheet" type="text/css" href="../../js/jquery-ui-1.10.3.custom/css/custom-theme/jquery-ui-1.10.3.custom.min.css" />
    <!-- End JQUERY UI DATE PICKER -->
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
    <script src="../../js/ERP/Supplier/Supplier.js?V=<%= WebConfigurationManager.AppSettings["jsVersion"] %>"
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
                                <li><i class="fa fa-home"></i><a href="../../Default.aspx">&nbsp;<span class="language_txt">Home</span></a>
                                </li>
                                <li><a href="../../Views/Supplier/SearchSupplier.aspx">&nbsp;<span class="language_txt">Rechercher
                                    un Fournisseur</span></a> </li>
                                <li class="language_txt">Fournisseur</li>
                            </ul>
                            <!-- /BREADCRUMBS -->
                            <div class="clearfix">
                                <h3 class="content-title pull-left language_txt">
                                    Fournisseur</h3>
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
                            <div class="col-md-6">
                                <div class="box border inverse">
                                    <div class="box-title">
                                        <h4>
                                            <i class="fa fa-bars"></i><span class="language_txt">Information général</span></h4>
                                    </div>
                                    <div class="box-body">
                                        <div class="form-horizontal">
                                            <div class="form-group" id="div_CompanyName">
                                                <label class="col-sm-3 control-label language_txt">
                                                    Raison sociale</label>
                                                <div class="col-sm-9">
                                                    <input class="form-control" id="CompanyName" name="CompanyName" type="text" placeholder="Raison sociale"
                                                        onblur="js_CheckSupplierExisted(this)" required="" maxlength="200">
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <label class="col-sm-3 control-label language_txt">
                                                    Référence</label>
                                                <div class="col-sm-9">
                                                    <input type="text" class="form-control" id="Reference" name="Reference" placeholder="Référence de supplier"
                                                        disabled="">
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <label class="col-sm-3 control-label language_txt">
                                                    Abréviation (4/5 lettres)</label>
                                                <div class="col-sm-9">
                                                    <input type="text" class="form-control" id="Abbreviation" name="Abbreviation" placeholder="L'abréviation de supplier en 4 ou 5 lettres pour faciliter la mémoriser"
                                                        maxlength="50" />
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <label class="col-sm-3 control-label language_txt">
                                                    Type de founisseur</label>
                                                <div class="col-sm-9">
                                                    <select class="form-control" id="StyId" name="StyId">
                                                    </select>
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <label class="col-sm-3 control-label language_txt">
                                                    Adresse 1</label>
                                                <div class="col-sm-9">
                                                    <input type="text" class="form-control" id="Address1" name="Address1" placeholder="Adresse 1"
                                                        maxlength="200">
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <label class="col-sm-3 control-label language_txt">
                                                    Adresse 2</label>
                                                <div class="col-sm-9">
                                                    <input type="text" class="form-control" id="Address2" name="Address2" placeholder="Adresse 2"
                                                        maxlength="200">
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <label class="col-sm-3 control-label language_txt">
                                                    Code postal</label>
                                                <div class="col-sm-9">
                                                    <input type="text" class="form-control" id="Postcode" name="Postcode" onkeyup="getCommuneName(this,'City')"
                                                        placeholder="Code postal" maxlength="10">
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <label class="col-sm-3 control-label language_txt">
                                                    Ville</label>
                                                <div class="col-sm-9">
                                                    <input type="text" class="form-control" list="City" id="ip_City" placeholder="Ville"
                                                        oninput="communeChange('ip_City','City','Postcode')" maxlength="200">
                                                    <datalist id="City">
                                                    </datalist>
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <label class="col-sm-3 control-label language_txt">
                                                    Pays</label>
                                                <div class="col-sm-9">
                                                    <input type="text" class="form-control" id="Country" name="Country" placeholder="Pays"
                                                        maxlength="200">
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <label class="col-sm-3 control-label language_txt">
                                                    Siren</label>
                                                <div class="col-sm-9">
                                                    <input type="text" class="form-control" id="Siren" name="Siren" placeholder="Siren"
                                                        maxlength="30">
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <label class="col-sm-3 control-label language_txt">
                                                    Siret</label>
                                                <div class="col-sm-9">
                                                    <input type="text" class="form-control" id="Siret" name="Siret" placeholder="Siret"
                                                        maxlength="30">
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <label class="col-sm-3 control-label language_txt">
                                                    TVA inter-com</label>
                                                <div class="col-sm-9">
                                                    <input type="text" class="form-control" id="VatIntra" name="VatIntra" placeholder="TVA intracommunautaire"
                                                        maxlength="30">
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <label class="col-sm-3 control-label language_txt">
                                                    Devise</label>
                                                <div class="col-sm-9">
                                                    <select class="form-control" id="CurId" name="CurId">
                                                    </select>
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <label class="col-sm-3 control-label language_txt">
                                                    Activé</label>
                                                <div class="col-sm-3">
                                                    <div class="checker" style="text-align: center;">
                                                        <span class="">
                                                            <input type="checkbox" id="Isactive" name="Isactive" checked="true" class="uniform"
                                                                value="">
                                                        </span>
                                                    </div>
                                                </div>
                                                <label class="col-sm-3 control-label language_txt">
                                                    Bloqué</label>
                                                <div class="col-sm-3">
                                                    <div class="checker" style="text-align: center;">
                                                        <span class="">
                                                            <input type="checkbox" id="Isblocked" name="Isblocked" class="uniform" value="">
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <label class="col-md-3 control-label language_txt">
                                                    Commentaire pour Fournisseur</label>
                                                <div class="col-md-9">
                                                    <textarea rows="3" cols="5" name="Comment4Supplier" class="form-control" id="Comment4Supplier"></textarea></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="col-md-6">
                                <div class="box border inverse">
                                    <div class="box-title">
                                        <h4>
                                            <i class="fa fa-bars"></i><span class="language_txt">Information supplémentaire</span></h4>
                                    </div>
                                    <div class="box-body">
                                        <div class="form-horizontal">
                                            <div class="form-group">
                                                <label class="col-sm-3 control-label language_txt">
                                                    TVA</label>
                                                <div class="col-sm-9">
                                                    <select class="form-control" id="VatId" name="VatId">
                                                    </select>
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <label class="col-sm-3 control-label language_txt">
                                                    Condition de paiement</label>
                                                <div class="col-sm-9">
                                                    <select class="form-control" id="PcoId" name="PcoId">
                                                    </select>
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <label class="col-sm-3 control-label language_txt">
                                                    Mode de paiement</label>
                                                <div class="col-sm-9">
                                                    <select class="form-control" id="PmoId" name="PmoId">
                                                    </select>
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <label class="col-md-3 control-label language_txt">
                                                    Téléphone 1</label>
                                                <div class="col-md-9">
                                                    <div class="input-group">
                                                        <span class="input-group-addon"><i class="fa fa-phone"></i></span>
                                                        <input type="text" class="form-control" id="Tel1" name="Tel1" data-mask="" maxlength="20">
                                                    </div>
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <label class="col-md-3 control-label language_txt">
                                                    Téléphone 2</label>
                                                <div class="col-md-9">
                                                    <div class="input-group">
                                                        <span class="input-group-addon"><i class="fa fa-phone"></i></span>
                                                        <input type="text" class="form-control" id="Tel2" name="Tel2" data-mask="" maxlength="20">
                                                    </div>
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <label class="col-sm-3 control-label language_txt">
                                                    Fax</label>
                                                <div class="col-sm-9">
                                                    <div class="input-group">
                                                        <span class="input-group-addon"><i class="fa fa-phone-square"></i></span>
                                                        <input type="text" class="form-control" id="Fax" name="Fax" data-mask="" maxlength="20">
                                                    </div>
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <label class="col-sm-3 control-label language_txt">
                                                    Portable</label>
                                                <div class="col-sm-9">
                                                    <div class="input-group">
                                                        <span class="input-group-addon"><i class="fa fa-mobile-phone"></i></span>
                                                        <input type="text" class="form-control" id="Cellphone" name="Cellphone" data-mask=""
                                                            maxlength="20">
                                                    </div>
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <label class="col-sm-3 control-label language_txt">
                                                    Email</label>
                                                <div class="col-sm-9">
                                                    <div class="input-group">
                                                        <span class="input-group-addon">@</span>
                                                        <input type="email" id="Email" name="Email" class="form-control" placeholder="Email"
                                                            maxlength="100">
                                                    </div>
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <label class="col-sm-3 control-label language_txt">
                                                    Recevoir le Newsletter</label>
                                                <div class="col-sm-1">
                                                    <div class="checker" style="text-align: center;">
                                                        <span class="">
                                                            <input type="checkbox" id="RecieveNewsletter" name="RecieveNewsletter" class="uniform"
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
                                                <label class="col-md-3 control-label language_txt">
                                                    Commentaire interne</label>
                                                <div class="col-md-9">
                                                    <textarea rows="3" cols="5" name="Comment4Interne" class="form-control" id="Comment4Interne"></textarea></div>
                                            </div>
                                            <div class="form-group forview">
                                                <label class="col-md-3 control-label pop-hover" style="color: red;" data-title="Attention 注意"
                                                    data-content="Le fournisseur peut login et consulter leur prop commande 供货商可以登陆并查看他们自己的订单">
                                                    Login
                                                </label>
                                                <div class="col-md-7">
                                                    <input type="text" id="SupLogin" name="SupLogin" class="form-control" placeholder="Login"
                                                        maxlength="200" />
                                                </div>
                                                <div class="col-md-1 center tip-left" data-original-title="Générer automatique login pour fournisseur 自动生成供货商Login">
                                                    <button class="btn btn-inverse" id="btn_create_suplogin" onclick="return createSupLogin(0)">
                                                        <i class="fa fa-gavel"></i>
                                                    </button>
                                                </div>
                                                <div class="col-md-1 center tip-left" data-original-title="Consulter le mot de passe de fournisseur 查看供货商登录密码">
                                                    <button class="btn btn-inverse" id="Button1" onclick="return createSupLogin(1)">
                                                        <i class="fa fa-eye"></i>
                                                    </button>
                                                </div>
                                            </div>
                                            <div class="form-group forview">
                                                <label class="col-md-3 control-label language_txt">
                                                    Date de mise à jour</label>
                                                <div class="col-md-9">
                                                    <input type="text" class="form-control" id="DateUpdate" name="DateUpdate"></div>
                                            </div>
                                            <div class="form-group forview forcreate">
                                                <label class="col-md-3 control-label language_txt">
                                                    Date de création</label>
                                                <div class="col-md-9">
                                                    <div class="input-group">
                                                        <input type="text" class="form-control datepicker " id="DateCreation" name="DateCreation"
                                                            required="">
                                                        <span class="input-group-addon  "><i class="fa fa-calendar"></i></span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div class="modal-footer center forcreate">
                                                <button type="button" class="btn btn-default language_txt" onclick="javascript:window.location='SearchSupplier.aspx'">
                                                    Annuler</button>
                                                <button type="button" class="btn btn-inverse language_txt" onclick="return js_CheckSupplierExisted_for_create_update('CompanyName');">
                                                    Sauvegarder</button>
                                            </div>
                                            <div class="modal-footer center forview">
                                                <button type="button" class="btn btn-inverse language_txt" onclick="changeViewMode('modify')">
                                                    Modifier</button>
                                                <button type="button" class="btn btn-inverse language_txt" onclick="return DeleteSupplier()">
                                                    Suprrimer</button>
                                            </div>
                                            <div class="modal-footer center forupdate">
                                                <button type="button" class="btn btn-default language_txt" onclick="changeViewMode('view')">
                                                    Annuler</button>
                                                <button type="button" class="btn btn-inverse language_txt" onclick="return js_CheckSupplierExisted_for_create_update('CompanyName');">
                                                    Mettre à jours</button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="separator">
                        </div>
                        <div class="row forview" id="div_contact_supplier">
                            <div class="col-md-12">
                                <!-- BOX -->
                                <div class="box border inverse">
                                    <div class="box-title">
                                        <h4>
                                            <i class="fa fa-table"></i><span class="language_txt">Contact Fournisseur</span></h4>
                                    </div>
                                    <div class="box-body" style="width: 100%; overflow-x: auto;">
                                        <div class="modal-body center">
                                            <button type="button" class="btn btn-inverse language_txt" onclick="return display_contact_supplier(0);">
                                                Créer un contact</button>
                                        </div>
                                        <table id="datatable_contact_supplier" cellpadding="0" cellspacing="0" border="0"
                                            class="datatable table table-striped table-bordered table-hover">
                                            <thead>
                                                <tr>
                                                    <th class="language_txt">
                                                        Titre
                                                    </th>
                                                    <th class="language_txt">
                                                        Référence
                                                    </th>
                                                    <th class="language_txt">
                                                        Contact
                                                    </th>
                                                    <th class="language_txt">
                                                        Tél/Fax
                                                    </th>
                                                    <th class="hidden-xs language_txt">
                                                        Portable
                                                    </th>
                                                    <th class="language_txt">
                                                        Adresse
                                                    </th>
                                                    <th class="hidden-xs language_txt">
                                                        CP
                                                    </th>
                                                    <th class="hidden-xs language_txt">
                                                        Ville
                                                    </th>
                                                    <th class="hidden-xs language_txt">
                                                        Email
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody id="tbody_contact_supplier">
                                            </tbody>
                                            <tfoot>
                                                <tr>
                                                    <th class="language_txt">
                                                        Titre
                                                    </th>
                                                    <th class="language_txt">
                                                        Référence
                                                    </th>
                                                    <th class="language_txt">
                                                        Contact
                                                    </th>
                                                    <th class="language_txt">
                                                        Tél/Fax
                                                    </th>
                                                    <th class="hidden-xs language_txt">
                                                        Portable
                                                    </th>
                                                    <th class="language_txt">
                                                        Adresse
                                                    </th>
                                                    <th class="hidden-xs language_txt">
                                                        CP
                                                    </th>
                                                    <th class="hidden-xs language_txt">
                                                        Ville
                                                    </th>
                                                    <th class="hidden-xs language_txt">
                                                        Email
                                                    </th>
                                                </tr>
                                            </tfoot>
                                        </table>
                                    </div>
                                </div>
                                <!-- /BOX -->
                            </div>
                        </div>
                        <div class="separator">
                        </div>
                        <div class="row forview">
                            <div class="col-md-12">
                                <!-- BOX -->
                                <div class="box border inverse">
                                    <div class="box-title">
                                        <h4>
                                            <i class="fa fa-table"></i><span class="language_txt">Information de Banque</span></h4>
                                    </div>
                                    <div class="box-body">
                                        <div class="modal-body center">
                                            <button type="button" class="btn btn-inverse language_txt" onclick="return viewCreateBankInfo();">
                                                Créer une info</button>
                                        </div>
                                        <div class="box-body" id="div_bank_info" style="width: 100%; overflow-x: auto;">
                                        </div>
                                    </div>
                                </div>
                                <!-- /BOX -->
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <!-- /FORMS -->
            <div class="separator">
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
