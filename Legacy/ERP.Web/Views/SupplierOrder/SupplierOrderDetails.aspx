<%@ Page Title="" Language="C#" MasterPageFile="~/Site.Master" AutoEventWireup="true"
    CodeBehind="SupplierOrderDetails.aspx.cs" Inherits="ERP.Web.Views.SupplierOrder.SupplierOrderDetails" %>

<%@ Import Namespace="System.Web.Configuration" %>
<asp:Content ID="Content1" ContentPlaceHolderID="HeadContent" runat="server">
    <title>ERP - Détails de la commande fournisseur</title>
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
    <script src="../../js/ERP/SupplierOrder/SupplierOrderDetails.js?V=<%= WebConfigurationManager.AppSettings["jsVersion"] %>"
        type="text/javascript"></script>
    <script src="../../js/ERP/SupplierOrder/SodLogistic.js?V=<%= WebConfigurationManager.AppSettings["jsVersion"] %>"
        type="text/javascript"></script>
    <script src="../../js/ERP/Consignee/Consignee.js?V=<%= WebConfigurationManager.AppSettings["jsVersion"] %>"
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
        .control-label {
            font-size: 11px !important;
        }
        .form-group {
            margin-bottom: 5px;
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
                                <li><a href="SearchSupplierOrder.aspx">&nbsp;<span class="language_txt">Détail de la ligne de commande fournisseur</span></a>
                                </li>
                            </ul>
                            <!-- /BREADCRUMBS -->
                            <div class="clearfix">
                                <h3 class="content-title pull-left">
                                    &nbsp;<span class="language_txt">Détail de la ligne de commande fournisseur</span></h3>
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
                                                <label class="col-sm-1 control-label language_txt" id="lb_supplier">Client</label>
                                                <div class="col-sm-2">
                                                    <select id="CliId" class="form-control">
                                                    </select>
                                                </div>
                                                <label class="col-sm-1 control-label language_txt">Mot clé de produit</label>
                                                <div class="col-sm-2">
                                                    <input class="form-control" id="Keyword" />
                                                </div>
                                                <label class="col-sm-1 control-label language_txt">Nom de la commande</label>
                                                <div class="col-sm-2">
                                                    <input class="form-control" id="txbSodName" />
                                                </div>
                                                <label class="col-sm-1 control-label language_txt">Code de la cmd/Fournisseur</label>
                                                <div class="col-sm-2">
                                                    <input class="form-control" id="txbSodCode" />
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <label class="col-sm-1 control-label language_txt">Fournisseur</label>
                                                <div class="col-sm-2">
                                                    <input class="form-control" id="txbSup" />
                                                </div>
                                                <label class="col-sm-1 control-label language_txt">Date du</label>
                                                <div class="col-sm-2">
                                                    <input type="text" class="form-control datepicker" id="DateCreationFrom" name="DateCreationFrom"
                                                        placeholder="Date de création du 创建时间起于" />
                                                </div>
                                                <label class="col-sm-1 control-label language_txt">Date au</label>
                                                <div class="col-sm-2">
                                                    <input type="text" class="form-control datepicker" id="DateCreationTo" name="DateCreationTo"
                                                        placeholder="Date de création au 创建时间止于" />
                                                </div>
                                                <div class="col-sm-1 center">
                                                </div>
                                                <div class="col-sm-2 center">
                                                    <button type="submit" class="btn btn-inverse language_txt" id="btnSearch" onclick="return js_search(true,false,false)">Chercher</button>
                                                    <button type="button" class="btn btn-inverse" id="btnMoreInfo" onclick="return jsMoreInfo()">
                                                        <span class="language_txt">Plus d'info</span>   <i class="fa fa-dollar"></i>
                                                    </button>
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <label class="col-sm-1 control-label language_txt">Pas commencer à produire</label>
                                                <div class="col-sm-1">
                                                    <input class="form-control" type="checkbox" id="cbx_no_start" />
                                                </div>
                                                <label class="col-sm-1 control-label language_txt">Pas de Fin Pré</label>
                                                <div class="col-sm-1">
                                                    <input class="form-control" type="checkbox" id="cbx_no_fin_pr" />
                                                </div>
                                                <label class="col-sm-1 control-label language_txt">Fini pas envoyé</label>
                                                <div class="col-sm-1">
                                                    <input class="form-control" type="checkbox" id="cbx_fin_no_send" />
                                                </div>
                                                <label class="col-sm-1 control-label language_txt">Pas de date arrive pré</label>
                                                <div class="col-sm-1">
                                                    <input class="form-control" type="checkbox" id="cbx_no_arr_pr" />
                                                </div>
                                                <label class="col-sm-1 control-label language_txt">Commande terminée</label>
                                                <div class="col-sm-1">
                                                    <input class="form-control" type="checkbox" id="cbx_finished" />
                                                </div>
                                                <div class="col-sm-2 center">
                                                    <button type="button" class="btn btn-inverse" id="btnGetExcel" onclick="return js_expExcel(this)">
                                                        <i class="fa fa-download"></i>&nbsp;<i class="fa fa-book"></i>&nbsp;<span class="language_txt">CSV</span>
                                                    </button>
                                                    <button type="button" class="btn btn-inverse" id="btnGetPayment" onclick="return js_expPayment(this)">
                                                        <i class="fa fa-download"></i>&nbsp;<i class="fa fa-dollar"></i>&nbsp;<span class="language_txt">Payment</span>
                                                    </button>
                                                </div>
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
