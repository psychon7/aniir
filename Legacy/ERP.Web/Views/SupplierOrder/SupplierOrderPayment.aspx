<%@ Page Title="" Language="C#" MasterPageFile="~/Site.Master" AutoEventWireup="true"
    CodeBehind="SupplierOrderPayment.aspx.cs" Inherits="ERP.Web.Views.SupplierOrder.SupplierOrderPayment" %>

<%@ Import Namespace="System.Web.Configuration" %>
<asp:Content ID="Content1" ContentPlaceHolderID="HeadContent" runat="server">
    <title>ERP - Commande Fournisseur</title>
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
    <%--<script src="../../js/ERP/SupplierOrder/SupplierOrder.js?V=<%= WebConfigurationManager.AppSettings["jsVersion"] %>"
        type="text/javascript"></script>--%>
    <script src="../../js/ERP/SupplierOrder/SodPayment.js?V=<%= WebConfigurationManager.AppSettings["jsVersion"] %>"
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
            z-index: 99999 !important;
        }
        th
        {
            text-align: center !important;
            vertical-align: middle !important;
        }
        td
        {
            text-align: center !important;
            vertical-align: middle !important;
        }
        .subTotal
        {
            background-color: #EAEBFF !important;
        }
        .total
        {
            background-color: #D3D6FF !important;
        }
        .smallText
        {
            font-size: 11px !important;
            vertical-align: middle !important;
            text-align: center !important;
        }
        .smallTextVt
        {
            font-size: 11px !important;
            vertical-align: middle !important;
        }
    </style>
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
                                <li><a href="#"> <span class="language_txt">Paiement de la commande fournisseur</span></a> </li>
                            </ul>
                            <!-- /BREADCRUMBS -->
                            <div class="clearfix">
                                <h3 class="content-title pull-left">
                                    <span class="language_txt">Paiement de la commande fournisseur</span></h3>
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
                                            <div class=" center">
                                                <div class="form-group">
                                                    <div id="div_subsup" style="display: none;">
                                                        <label class="col-sm-2 control-label language_txt">Sub fournisseur</label>
                                                        <div class="col-sm-2">
                                                            <input class="form-control" type="checkbox" id="cbx_sub_sup" />
                                                        </div>
                                                    </div>
                                                    <label class="col-sm-2 control-label language_txt">Seulement A PAYER</label>
                                                    <div class="col-sm-2">
                                                        <input class="form-control" type="checkbox" id="cbx_sod2pay" />
                                                    </div>
                                                    <button type="submit" class="btn btn-inverse start language_txt" onclick="return js_search()">Rechercher</button>
                                                    <button type="button" class="btn btn-inverse start language_txt" onclick="return downloadPaymentRecord(this)" supId="0">Télécharger</button>
                                                </div>
                                                <div class="form-group">
                                                    <label class="col-sm-2 control-label language_txt">Fournisseur</label>
                                                    <div class="col-sm-2">
                                                        <select class="form-control" id="SupId" name="SupId">
                                                        </select>
                                                    </div>
                                                    <label class="col-sm-2 control-label language_txt">Date du</label>
                                                    <div class="col-sm-2">
                                                        <input type="text" class="form-control datepicker" id="DateCreationFrom" name="DateCreationFrom"
                                                            placeholder="Date de création du 创建时间起于" />
                                                    </div>
                                                    <label class="col-sm-2 control-label language_txt">Date au</label>
                                                    <div class="col-sm-2">
                                                        <input type="text" class="form-control datepicker" id="DateCreationTo" name="DateCreationTo"
                                                            placeholder="Date de création au 创建时间止于" />
                                                    </div>
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
                            <div class="col-md-12" id="div_result">
                                <!-- BOX -->
                                <div class="box border inverse">
                                    <div class="box-title">
                                        <h4>
                                            <i class="fa fa-table"></i><span class="language_txt">Fournisseur paiement</span>
                                        </h4>
                                        <span style="float: right" id="rst_pins"></span>
                                    </div>
                                    <div class="box-body" id="div_pins" style="width: 100%; overflow-x: auto;max-height: 800px;overflow-y: auto;">
                                        <table id="dt_pins" cellpadding="0" cellspacing="0" border="0" class="datatable table table-striped table-bordered table-hover">
                                        </table>
                                    </div>
                                </div>
                                <!-- /BOX -->
                            </div>
                            <div class="col-md-5" id="div_result_sod" style="display: none;">
                                <div class="box border inverse">
                                    <div class="box-title">
                                        <h4 id="title_sod">
                                            <i class="fa fa-table"></i><span class="language_txt">Les commandes fournisseur</span>
                                        </h4>
                                        <span style="float: right" id="sp_rst_sod"></span>
                                    </div>
                                    <div class="box-body" id="div1" style="width: 100%; overflow-x: hidden;max-height: 800px;overflow-y: auto;">
                                        <table id="tb_sods" cellpadding="0" cellspacing="0" border="0" class="table table-striped table-bordered table-hover">
                                        </table>
                                    </div>
                                </div>
                            </div>
                            <div class="col-md-3" id="div_spr" style="display: none;">
                                <div class="box border inverse">
                                    <div class="box-title">
                                        <h4 id="H1">
                                            <i class="fa fa-table"></i><span class="language_txt">Paiement</span>
                                        </h4>
                                        <span style="float: right" id="sp_rst_spr"></span>
                                    </div>
                                    <div class="box-body" id="div3" style="width: 100%; overflow-x: hidden;max-height: 800px;overflow-y: auto;">
                                        <table id="tb_sprs" cellpadding="0" cellspacing="0" border="0" class="table table-striped table-bordered table-hover">
                                        </table>
                                    </div>
                                </div>
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
