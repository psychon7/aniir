<%@ Page Title="" Language="C#" MasterPageFile="~/Site.Master" AutoEventWireup="true"
    CodeBehind="SodCinPayment.aspx.cs" Inherits="ERP.Web.Views.SupplierOrder.SodCinPayment" %>

<asp:Content ID="Content1" ContentPlaceHolderID="HeadContent" runat="server">
    <%@ import namespace="System.Web.Configuration" %>
</asp:Content>
<asp:Content ID="Content2" ContentPlaceHolderID="MainContent" runat="server">
    <title>Paiement</title>
    <!-- DATA TABLES -->
    <link rel="stylesheet" type="text/css" href="../../js/datatables/media/css/jquery.dataTables.min.css" />
    <link rel="stylesheet" type="text/css" href="../../js/datatables/media/assets/css/datatables.min.css" />
    <link rel="stylesheet" type="text/css" href="../../js/datatables/extras/TableTools/media/css/TableTools.min.css" />
    <link href="../../css/site.css" rel="stylesheet" type="text/css" />
    <!-- FILE UPLOAD -->
    <link href="../../js/jquery-upload/css/jquery.fileupload.css" rel="stylesheet" type="text/css">
    <!-- JQUERY UI DATE PICKER -->
    <link rel="stylesheet" type="text/css" href="../../js/jquery-ui-1.10.3.custom/css/custom-theme/jquery-ui-1.10.3.custom.min.css" />
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
    <script src="../../js/ERP/ERPBaseJS.js?V=<%= WebConfigurationManager.AppSettings["jsVersion"] %>"
        type="text/javascript"></script>
    <script src="../../js/ERP/CommonJS.js?V=<%= WebConfigurationManager.AppSettings["jsVersion"] %>"
        type="text/javascript"></script>
    <script src="../../js/ERP/SupplierOrder/SodCinPaymentJS.js?V=<%= WebConfigurationManager.AppSettings["jsVersion"] %>"
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
        }
        .subTotal
        {
            background-color: #EAEBFF !important;
        }
        .total
        {
            background-color: #D3D6FF !important;
        }
        td
        {
            font-size: 11px;
            vertical-align: middle !important;
            text-align: center !important;
        }
        .form-control
        {
            font-size: 11px !important;
        }
        .control-label
        {
            font-size: 11px !important;
        }
        .form-group
        {
            margin-bottom: 5px;
        }
        .divstatus
        {
            width: 100%;
            max-height: 660px;
            overflow-y: auto;
        }
        .backwhite
        {
            background-color: #fff;
        }
    </style>
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
                                <li><i class="fa fa-home"></i><a href="../../Default.aspx">&nbsp;<span class="language_txt">Home</span></a>
                                </li>
                                <li><a href="SearchSupplierOrder.aspx">&nbsp;<span class="language_txt">Le paiement
                                    de la comamnde et la facture</span></a> </li>
                            </ul>
                            <!-- /BREADCRUMBS -->
                            <div class="clearfix">
                                <h3 class="content-title pull-left">
                                    &nbsp;<span class="language_txt">Le paiement de la comamnde et la facture</span></h3>
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
                                            <i class="fa fa-bars"></i><span class="language_txt">Critère de rechercher</span></h4>
                                    </div>
                                    <div class="box-body">
                                        <div class="form-horizontal">
                                            <div class="form-group">
                                                <div class="col-sm-3 center">
                                                    <label class="radio-inline">
                                                        <div class="radio">
                                                            <span class="checked">
                                                                <input type="radio" class="uniform" id="inp_check_sod" name="optionsRadios2" value="option1"
                                                                    checked="" onclick="sodoptionchanged(this)" />Commande fournisseur</span></div>
                                                    </label>
                                                    <label class="radio-inline">
                                                        <div class="radio">
                                                            <span class="">
                                                                <input type="radio" class="uniform" id="inp_check_cin" name="optionsRadios2" value="option2"
                                                                    onclick="sodoptionchanged(this)" />Facture client</span></div>
                                                    </label>
                                                </div>
                                                <label class="col-sm-1 control-label language_txt" id="lb_supplier">
                                                    Client</label>
                                                <div class="col-sm-2">
                                                    <select id="Client" class="form-control" style="display: none;">
                                                    </select>
                                                    <input class='form-control' id='ClientList' name='ClientList' onkeyup="return InitClient(this)" />
                                                </div>
                                                <label class="col-sm-1 control-label language_txt">
                                                    Fournisseur</label>
                                                <div class="col-sm-2">
                                                    <select id="SupId" class="form-control" style="display: none;">
                                                    </select>
                                                    <input class='form-control' id='SupList' name='SupList' onkeyup="return InitSup(this)" />
                                                </div>
                                                <div class="col-sm-3 center">
                                                    <button type="submit" class="btn btn-inverse " id="btnSearch" onclick="return js_search()">
                                                        Chercher</button>
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <label class="col-sm-1 control-label language_txt" id="lb_cmd_name">
                                                    Nom/Code de la commande</label>
                                                <div class="col-sm-2">
                                                    <input type="text" class="form-control" id="ip_cmd_name" max="200" />
                                                </div>
                                                <label class="col-sm-1 control-label language_txt">
                                                    Date du</label>
                                                <div class="col-sm-2">
                                                    <input type="text" class="form-control datepicker" id="DateCreationFrom" name="DateCreationFrom"
                                                        placeholder="Date de création du 创建时间起于" />
                                                </div>
                                                <label class="col-sm-1 control-label language_txt">
                                                    Date au</label>
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
                </div>
                <div class="row searchresult" id="div_search_result" style='max-height: 800px; overflow-y: auto;'>
                </div>
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
