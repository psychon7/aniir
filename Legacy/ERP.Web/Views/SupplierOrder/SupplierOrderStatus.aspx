<%@ Page Title="" Language="C#" MasterPageFile="~/Site.Master" AutoEventWireup="true"
    CodeBehind="SupplierOrderStatus.aspx.cs" Inherits="ERP.Web.Views.SupplierOrder.SupplierOrderStatus" %>

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
    <script src="../../js/ERP/ERPBaseJS.js?V=<%= WebConfigurationManager.AppSettings["jsVersion"] %>"
        type="text/javascript"></script>
    <script src="../../js/ERP/CommonJS.js?V=<%= WebConfigurationManager.AppSettings["jsVersion"] %>"
        type="text/javascript"></script>
    <script src="../../js/ERP/SupplierOrder/SupplierOrderStatus.js?V=<%= WebConfigurationManager.AppSettings["jsVersion"] %>"
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
        .backwhite {
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
                                <li><a href="SearchSupplierOrder.aspx">&nbsp;<span class="language_txt">Le statut de
                                    la commande fournisseur</span></a> </li>
                            </ul>
                            <!-- /BREADCRUMBS -->
                            <div class="clearfix">
                                <h3 class="content-title pull-left">
                                    &nbsp;<span class="language_txt">Le statut de la commande fournisseur</span></h3>
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
                                                <label class="col-sm-1 control-label language_txt">
                                                    Date du</label>
                                                <div class="col-sm-1">
                                                    <input type="text" class="form-control datepicker" id="DateCreationFrom" name="DateCreationFrom"
                                                        placeholder="Date de création du 创建时间起于" />
                                                </div>
                                                <label class="col-sm-1 control-label language_txt">
                                                    Date au</label>
                                                <div class="col-sm-1">
                                                    <input type="text" class="form-control datepicker" id="DateCreationTo" name="DateCreationTo"
                                                        placeholder="Date de création au 创建时间止于" />
                                                </div>
                                                <div class="col-sm-2 center">
                                                    <button type="submit" class="btn btn-inverse " id="btnSearch" onclick="return js_searchstatus()">
                                                        Chercher</button>
                                                    <button type="button" class="btn btn-inverse " id="btnArchived" onclick="return updateSttArchvClick()">
                                                        Archivé 显示归档</button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="row searchresult" id="div_search_result">
                    <div class="col-md-2 box-container ui-sortable">
                        <div class="box border backwhite">
                            <div class="box-title ">
                                <h4>
                                    Pas encore lancé 未生产</h4>
                                <div class="tools hidden-xs">
                                    <span class="badge badge-red" id="div_unproduced_count"></span>
                                </div>
                            </div>
                            <div class="box-body  divstatus" id="div_unproduced">
                            </div>
                        </div>
                    </div>
                    <div class="col-md-2 box-container ui-sortable">
                        <div class="box border purple backwhite">
                            <div class="box-title ">
                                <h4>
                                    Fabrication encour 生产中</h4>
                                <div class="tools hidden-xs">
                                    <span class="badge badge-red" id="div_in_progressiv_count"></span>
                                </div>
                            </div>
                            <div class="box-body divstatus" id="div_in_progressiv">
                            </div>
                        </div>
                    </div>
                    <div class="col-md-2 box-container ui-sortable">
                        <div class="box border red backwhite">
                            <div class="box-title ">
                                <h4>
                                    Paiement 等款发货</h4>
                                <div class="tools hidden-xs">
                                    <span class="badge badge-blue" id="div_wait_payment_count"></span>
                                </div>
                            </div>
                            <div class="box-body divstatus" id="div_wait_payment">
                            </div>
                        </div>
                    </div>
                    <div class="col-md-2 box-container ui-sortable">
                        <div class="box border orange backwhite">
                            <div class="box-title ">
                                <h4>
                                    En attente d'envoi 待发货</h4>
                                <div class="tools hidden-xs">
                                    <span class="badge badge-red" id="div_wait_send_count"></span>
                                </div>
                            </div>
                            <div class="box-body divstatus" id="div_wait_send">
                            </div>
                        </div>
                    </div>
                    <div class="col-md-2 box-container ui-sortable">
                        <div class="box border primary backwhite">
                            <div class="box-title ">
                                <h4>
                                    Dans le transport 运输中</h4>
                                <div class="tools hidden-xs">
                                    <span class="badge badge-red" id="div_in_transport_count"></span>
                                </div>
                            </div>
                            <div class="box-body divstatus" id="div_in_transport">
                            </div>
                        </div>
                    </div>
                    <div class="col-md-2 box-container ui-sortable">
                        <div class="box border green backwhite">
                            <div class="box-title ">
                                <h4>
                                    Arrivé 已到达</h4>
                                <div class="tools hidden-xs">
                                    <span class="badge badge-red" id="div_arrived_count"></span>
                                </div>
                            </div>
                            <div class="box-body divstatus" id="div_arrived">
                            </div>
                        </div>
                    </div>
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
