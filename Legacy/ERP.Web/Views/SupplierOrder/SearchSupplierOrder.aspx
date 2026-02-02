<%@ Page Title="" Language="C#" MasterPageFile="~/Site.Master" AutoEventWireup="true"
    CodeBehind="SearchSupplierOrder.aspx.cs" Inherits="ERP.Web.Views.SupplierOrder.SearchSupplierOrder" %>

<%@ Import Namespace="System.Web.Configuration" %>
<asp:Content ID="Content1" ContentPlaceHolderID="HeadContent" runat="server">
    <title>Rechercher Commande Fournisseur</title>
    <!-- DATA TABLES -->
    <link rel="stylesheet" type="text/css" href="../../js/datatables/media/css/jquery.dataTables.min.css" />
    <link rel="stylesheet" type="text/css" href="../../js/datatables/media/assets/css/datatables.min.css" />
    <link rel="stylesheet" type="text/css" href="../../js/datatables/extras/TableTools/media/css/TableTools.min.css" />
    <link href="../../css/site.css" rel="stylesheet" type="text/css" />
    <!-- FILE UPLOAD -->
    <link href="../../js/jquery-upload/css/jquery.fileupload.css" rel="stylesheet" type="text/css">
    <!-- JQUERY UI DATE PICKER -->
    <link rel="stylesheet" type="text/css" href="../../js/jquery-ui-1.10.3.custom/css/custom-theme/jquery-ui-1.10.3.custom.min.css" />
</asp:Content>
<asp:Content ID="Content2" ContentPlaceHolderID="MainContent" runat="server">
    <script>
        jQuery(document).ready(function () {
            App.setPage("index");  //Set current page
            App.init(); //Initialise plugins and elements

            $.each($('.datepicker'), function (idx, value) {
                $(value).datepicker();
            });

            $('#DateCreationFrom').val(firstDayInPreviousMonth());
            $('#DateCreationTo').val(getToday());
        });
    </script>
    <style>
        body
        {
            font-size: 12px !important;
        }
    </style>
    <script src="../../js/ERP/ERPBaseJS.js?V=<%= WebConfigurationManager.AppSettings["jsVersion"] %>"
        type="text/javascript"></script>
    <script src="../../js/ERP/CommonJS.js?V=<%= WebConfigurationManager.AppSettings["jsVersion"] %>"
        type="text/javascript"></script>
    <script src="../../js/ERP/SupplierOrder/SupplierOrderSearch.js?V=<%= WebConfigurationManager.AppSettings["jsVersion"] %>"
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
                                <li><i class="fa fa-home"></i>&nbsp;<a href="../../Default.aspx" class="language_txt">Home</a> </li>
                                <li><a href="#" class="language_txt">Rechercher Commande Fournisseur</a> </li>
                            </ul>
                            <!-- /BREADCRUMBS -->
                            <div class="clearfix">
                                <h3 class="content-title pull-left language_txt">Commande Fournisseur</h3>
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
                                            <i class="fa fa-bars "></i><span class="language_txt">Critère de recherche</span></h4>
                                    </div>
                                    <div class="box-body" id="divSearchCondition">
                                        <div class="form-horizontal">
                                            <div class="form-group">
                                                <label class="col-sm-1 control-label language_txt">Fournisseur</label>
                                                <div class="col-sm-2">
                                                    <%--<select class="form-control" id="SupId" name="SupId">
                                                    </select>--%>
                                                    <select id="SupId" class="form-control" style="display: none;">
                                                    </select>
                                                    <input class='form-control' id='SupList' name='SupList' onkeyup="return InitSup(this)"/>
                                                </div>
                                                <label class="col-sm-1 control-label language_txt">Nom/Code de la commande</label>
                                                <div class="col-sm-2">
                                                    <input class="form-control" id="SodName" name="SodName" type="text" maxlength="200">
                                                </div>
                                                <label class="col-sm-1 control-label language_txt">Mot clé de produit</label>
                                                <div class="col-sm-2">
                                                    <input class="form-control" id="SodCode" name="SodCode" type="text" maxlength="200">
                                                </div>
                                                <label class="col-sm-1 control-label language_txt">Quantité</label>
                                                <div class="col-sm-2">
                                                    <input class="form-control" id="SolQty" name="SolQty" type="number" step="1">
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <label class="col-sm-1 control-label language_txt">Date du</label>
                                                <div class="col-sm-2">
                                                    <input type="text" class="form-control datepicker" id="DateCreationFrom" name="DateCreationFrom"
                                                        placeholder="Date de création du" />
                                                </div>
                                                <label class="col-sm-1 control-label language_txt">Date au</label>
                                                <div class="col-sm-2">
                                                    <input type="text" class="form-control datepicker" id="DateCreationTo" name="DateCreationTo"
                                                        placeholder="Date de création au" />
                                                </div>
                                                <label class="col-sm-1 control-label language_txt">Client</label>
                                                <div class="col-sm-2">
                                                    <%--<select class="form-control" id="Client" name="Client">
                                                    </select>--%>
                                                    <select id="Client" class="form-control" style="display: none;">
                                                    </select>
                                                    <input class='form-control' id='ClientList' name='ClientList' onkeyup="return InitClient(this)" />
                                                </div>
                                                <label class="col-sm-1 control-label language_txt">Code de paiement(支付代码)</label>
                                                <div class="col-sm-2">
                                                    <input type="text" class="form-control" id="PaymentCode" name="PaymentCode"/>
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                  <label class="col-sm-1 control-label language_txt">Statut 订单状态</label>
                                                <div class="col-sm-2">  
                                                <select class="form-control" id="SttId" name="SttId"></select>
                                                </div>
                                                <label class="col-sm-1 control-label language_txt">Avec Détail(带详情)</label>
                                                <div class="col-sm-1">
                                                    <input class="form-control" type="checkbox" id="cbx_show_detail" />
                                                </div>
                                                <label class="col-sm-1 control-label language_txt" title="S'afficher seulement à payer 仅显示完成支付的">S'afficher seulement à payer(仅显示未支付)</label>
                                                <div class="col-sm-1">
                                                    <input class="form-control" type="checkbox" id="cbx_only_to_pay" title="S'afficher seulement à payer 仅显示完成支付的"/>
                                                </div>
                                                <label class="col-sm-1 control-label language_txt" title="Ne s'afficher pas annulée(不显示已取消)">Ne s'afficher pas annulée(不显示已取消)</label>
                                                <div class="col-sm-1">
                                                    <input class="form-control" type="checkbox" id="cbx_canceled" title="Ne s'afficher pas annulée(不显示已取消)"/>
                                                </div>
                                                <label class="col-sm-1 control-label language_txt" title="Ne s'afficher que non facturé(仅显示无发票的)">Ne s'afficher que non facturé(仅显示无发票的)</label>
                                                <div class="col-sm-1">
                                                    <input class="form-control" type="checkbox" id="cbx_withoutinvoice" title="Ne s'afficher que non facturé(仅显示无发票的)"/>
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <div class="col-sm-12 center">
                                                    <button type="submit" class="btn btn-inverse start language_txt" onclick="return js_search()">Rechercher</button>
                                                    <button type="button" class="btn btn-inverse success language_txt" onclick="return createItem()">Créer une commande</button>
                                                    <button type="button" class="btn btn-inverse success language_txt" id="bnt_download_rst" style="display: none;" onclick="return downloadresultclick()">Télécharger les resultats 下载结果</button>
                                                    <button type="button" class="btn btn-inverse success language_txt" id="btn_AddPr" style="display: none;"
                                                        onclick="return AddPaymentRecord()">Ajouter un enregistrement de paiement</button>
                                                </div>
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
                                        <span style="float: right" id="rst_pins"></span>
                                    </div>
                                    <div class="box-body" id="div_pins" style="width: 100%; overflow-x: auto;">
                                        <table id="dt_pins" cellpadding="0" cellspacing="0" border="0" class="datatable table table-striped table-bordered table-hover">
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
