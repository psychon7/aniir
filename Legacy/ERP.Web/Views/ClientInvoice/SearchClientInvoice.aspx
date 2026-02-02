<%@ Page Title="" Language="C#" MasterPageFile="~/Site.Master" AutoEventWireup="true"
    CodeBehind="SearchClientInvoice.aspx.cs" Inherits="ERP.Web.Views.ClientInvoice.SearchClientInvoice" %>
<%@ Import Namespace="System.Web.Configuration" %>

<asp:Content ID="Content1" ContentPlaceHolderID="HeadContent" runat="server">
    <title>Rechercher Facture</title>
    <!-- JQUERY UI DATE PICKER -->
    <link rel="stylesheet" type="text/css" href="../../js/jquery-ui-1.10.3.custom/css/custom-theme/jquery-ui-1.10.3.custom.min.css" />
    <!-- End JQUERY UI DATE PICKER -->
    <!-- DATA TABLES -->
    <link rel="stylesheet" type="text/css" href="../../js/datatables/media/css/jquery.dataTables.min.css" />
    <link rel="stylesheet" type="text/css" href="../../js/datatables/media/assets/css/datatables.min.css" />
    <link rel="stylesheet" type="text/css" href="../../js/datatables/extras/TableTools/media/css/TableTools.min.css" />
    <link href="../../css/site.css" rel="stylesheet" type="text/css" />
    <!-- FILE UPLOAD -->
    <link href="../../js/jquery-upload/css/jquery.fileupload.css" rel="stylesheet" type="text/css">
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
    <script src="../../js/ERP/ClientInvoice/ClientInvoiceSearch.js?V=<%= WebConfigurationManager.AppSettings["jsVersion"] %>"
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
                                <li><a href="#"><span class="language_txt">Rechercher une facutre</span></a> </li>
                            </ul>
                            <!-- /BREADCRUMBS -->
                            <div class="clearfix">
                                <h3 class="content-title pull-left">
                                    <span class="language_txt">Facture client</span></h3>
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
                                                <label class="col-sm-1 control-label language_txt">Code de la facture</label>
                                                <div class="col-sm-2">
                                                    <input class="form-control" id="CinCode" name="CinCode" type="text" placeholder="Code de la facture"
                                                        maxlength="200">
                                                </div>
                                                <label class="col-sm-1 control-label language_txt">Nom de la facture</label>
                                                <div class="col-sm-2">
                                                    <input class="form-control" id="CinName" name="CinName" type="text" placeholder="Nom de la fature"
                                                        maxlength="200">
                                                </div>
                                                <label class="col-sm-1 control-label language_txt">Code de l'affaire</label>
                                                <div class="col-sm-2">
                                                    <input class="form-control" id="PrjCode" name="PrjCode" type="text" placeholder="Code de l'affaire"
                                                        maxlength="200">
                                                </div>
                                                <label class="col-sm-1 control-label language_txt">Raison sociale</label>
                                                <div class="col-sm-2">
                                                    <select id="Client" class="form-control" style="display: none;">
                                                    </select>
                                                    <input class='form-control' id='ClientList' name='ClientList' onkeyup="return js_clientChange(this)" placeholder="Raison sociale"/>
                                                    <%--<input type="text" class="form-control" id="ClientCompanyName" name="ClientCompanyName"
                                                        placeholder="Raison sociale" />--%>
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <label class="col-sm-1 control-label language_txt">Contact client</label>
                                                <div class="col-sm-2">
                                                    <input type="text" class="form-control" id="Inv_CcoFirstname" name="Inv_CcoFirstname" placeholder="Contact client" />
                                                </div>
                                                <label class="col-sm-1 control-label language_txt">Nom de l'affaire</label>
                                                <div class="col-sm-2">
                                                    <input class="form-control" id="PrjName" name="PrjName" type="text" placeholder="Nom de l'affaire"
                                                        maxlength="200">
                                                </div>
                                                <label class="col-sm-1 control-label language_txt">Commentaire de paiement</label>
                                                <div class="col-sm-2">
                                                    <input type="text" class="form-control" id="CpyComment" name="CpyComment"/>
                                                </div>
                                                <label class="col-sm-1 control-label language_txt">Mot clé</label>
                                                <div class="col-sm-2">
                                                    <input class="form-control" id="keyword" name="keyword" type="text" maxlength="200" placeholder="nom/description de produit / commentaire client/interne" />
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <label class="col-sm-1 control-label language_txt">Date de création du</label>
                                                <div class="col-sm-2">
                                                    <input type="text" class="form-control datepicker" id="CinDateCreationFrom" name="CinDateCreationFrom" placeholder="Date de création du" />
                                                </div>
                                                <label class="col-sm-1 control-label language_txt">Date de création au</label>
                                                <div class="col-sm-2">
                                                    <input type="text" class="form-control datepicker" id="CinDateCreationTo" name="CinDateCreationTo" placeholder="Date de création au" />
                                                </div>
                                                <label class="col-sm-1 control-label language_txt">Fournisseur</label>
                                                <div class="col-sm-2">
                                                    <%--<select class="form-control" id="SupId" name="SupId">
                                                    </select>--%>
                                                    <select id="SupId" class="form-control" style="display: none;">
                                                    </select>
                                                    <input class='form-control' id='SupList' name='SupList' onkeyup="return InitSup(this)"/>
                                                </div>
                                                <div class="col-sm-3"  id="div_for_keyprj" style="display:none;">
                                                    <label class="col-sm-4 control-label language_txt" style="color: red;">Projet Important</label>
                                                    <div class="col-sm-8">
                                                        <input class="form-control" type="checkbox" id="CinKeyProject" name="CinKeyProject" />
                                                    </div>
                                                </div>
                                            </div>
                                            <div id="divPtySearchFields">
                                            </div>
                                            <div class="modal-footer center">
                                                <button type="submit" class="btn btn-inverse start language_txt" onclick="return jsSearch()">Rechercher</button>
                                                <button type="button" class="btn btn-inverse success language_txt" onclick="return createItem()">Créer</button>
                                                <button type="button" class="btn btn-inverse success language_txt" id="btn_AddPr" style="display: none;"
                                                        onclick="return AddPaymentRecord()">Ajouter un enregistrement de paiement</button>
                                                <button type="button" class="btn btn-inverse success language_txt" id="btn_Add2Imp" style="display: none;"
                                                        onclick="return downloadAllCinsSelected()">Imprimer le(s) facture(s) sélectionnée(s)</button>
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
                                    <div class="box-body" id="div_for_datatable" style="width: 100%; overflow-x: auto;">
                                        <table id="datatable_search_result" cellpadding="0" cellspacing="0" border="0" class="datatable table table-striped table-bordered table-hover">
                                            <%--<thead id="thead_search_result">
                                                <tr>
                                                    <th class="language_txt">Nom du devis</th>
                                                    <th class="language_txt">Code du devis</th>
                                                    <th class="language_txt">Raison sociale</th>
                                                    <th class="language_txt">Contact</th>
                                                    <th class="language_txt">Nom du projet</th>
                                                    <th class="language_txt">Code du projet</th>
                                                </tr>
                                            </thead>
                                            <tbody id="tbody_search_result">
                                            </tbody>
                                            <tfoot id="tfoot_search_result">
                                                <tr>
                                                     <th class="language_txt">Nom du devis</th>
                                                    <th class="language_txt">Code du devis</th>
                                                    <th class="language_txt">Raison sociale</th>
                                                    <th class="language_txt">Contact</th>
                                                    <th class="language_txt">Nom du projet</th>
                                                    <th class="language_txt">Code du projet</th>
                                                </tr>
                                            </tfoot>--%>
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
    <script>

        //        $(function () {
        //        
        ////            var a = $language_get["Rechercher Commande Fournisseur"];
        //            //            $("#aaaa").html(a);

        //            var list = $(".language_txt");
        //            list.each(function () {
        //                $(this).html($language_get[$(this).html()]);
        //            });
        //        });


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
