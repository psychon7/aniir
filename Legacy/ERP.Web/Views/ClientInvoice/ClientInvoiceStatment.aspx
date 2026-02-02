<%@ Page Title="" Language="C#" MasterPageFile="~/Site.Master" AutoEventWireup="true"
    CodeBehind="ClientInvoiceStatment.aspx.cs" Inherits="ERP.Web.Views.ClientInvoice.ClientInvoiceStatment" %>

<%@ Import Namespace="System.Web.Configuration" %>
<asp:Content ID="Content1" ContentPlaceHolderID="HeadContent" runat="server">
    <title>ERP - Relevé de facture</title>
    <!-- JQUERY UI DATE PICKER -->
    <link rel="stylesheet" type="text/css" href="../../js/jquery-ui-1.10.3.custom/css/custom-theme/jquery-ui-1.10.3.custom.min.css" />
    <!-- End JQUERY UI DATE PICKER -->
    <link href="../../css/site.css" rel="stylesheet" type="text/css" />
</asp:Content>
<asp:Content ID="Content2" ContentPlaceHolderID="MainContent" runat="server">
    <style>
        th
        {
            text-align: center;
        }
    </style>
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
    <script src="../../js/ERP/ClientInvoice/ClientInvoiceStatmentJS.js?V=<%= WebConfigurationManager.AppSettings["jsVersion"] %>"
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
                                <li><a href="#"><span class="language_txt">Relevé de facture</span></a> </li>
                            </ul>
                            <!-- /BREADCRUMBS -->
                            <div class="clearfix">
                                <h3 class="content-title pull-left">
                                    <span class="language_txt">Relevé de facture</span></h3>
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
                                                <label class="col-sm-3 control-label language_txt">Raison sociale</label>
                                                <div class="col-sm-3">
                                                    <%--<select class="form-control" id="ClientCompanyName" name="ClientCompanyName" onchange="ClientChange()">
                                                    </select>--%>
                                                    <input type="text" class="form-control" list="Client" id="ClientCompanyName" name="ClientCompanyName"
                                                        required="" maxlength="200" oninput="js_clientChange(this)"
                                                        onblur="js_clientLostFocus(this)">
                                                    <datalist id="Client">
                                                    </datalist>
                                                </div>
                                                <label class="col-sm-3 control-label language_txt">Commercial 1</label>
                                                <div class="col-sm-3">
                                                    <select id="UsrCom1" class="form-control" onchange="ClientChange()">
                                                    </select>
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <label class="col-sm-3 control-label language_txt">Date de facture du</label>
                                                <div class="col-sm-3">
                                                    <input type="text" class="form-control datepicker" id="CinDateInvoice" name="CinDateInvoice"
                                                        onchange="ClientChange()" />
                                                </div>
                                                <label class="col-sm-3 control-label language_txt">Date de facture au</label>
                                                <div class="col-sm-3">
                                                    <input type="text" class="form-control datepicker" id="CinDateFin" name="CinDateFin"
                                                        onchange="ClientChange()" />
                                                </div>
                                            </div>
                                            <div class="modal-footer center">
                                                <button type="submit" class="btn btn-inverse start language_txt" onclick="return jsSearch()">Rechercher</button>
                                                <button type="button" id="btn_get_pdf" class="btn btn-inverse start language_txt" style="display: none;"
                                                    onclick="return GetPdf()">Générer PDF avec facture</button>
                                                <button type="button" id="btn_get_pdf_withoutcin" class="btn btn-inverse start language_txt" style="display: none;"
                                                    onclick="return GetPdfWithoutCin()">Générer PDF sans facture</button>
                                                <button type="button" id="btn_get_pdf_bl" class="btn btn-inverse start language_txt" style="display: none;"
                                                    onclick="return GetBLPdf()">Générer BL PDF</button>
                                                <button type="button" id="btn_excel" class="btn btn-inverse start" style="display: none;"
                                                    onclick="return GetExcel()">
                                                    <i class="fa fa-download"></i>&nbsp;<i class="fa fa-book"></i> <span class="language_txt">Download CSV</span></button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="row searchresult" id="div_search_result">
                            <div class="col-md-12">
                                <!-- BOX -->
                                <div class="box border inverse">
                                    <div class="box-title">
                                        <h4>
                                            <i class="fa fa-table"></i><span class="language_txt">Relevé de facture</span>
                                        </h4>
                                    </div>
                                    <div class="box-body" id="div_for_datatable" style="width: 100%; overflow-x: auto;">
                                        <table id="datatable_search_result" cellpadding="0" cellspacing="0" border="0" class="datatable table table-striped table-bordered table-hover">
                                            <thead id="thead_search_result">
                                                <tr>
                                                    <th class="language_txt">Raison sociale</th>
                                                    <th class="language_txt">N° facture</th>
                                                    <th class="language_txt">Date de facture</th>
                                                    <th class="language_txt">Date d'échéance</th>
                                                    <th class="language_txt">Montant dû HT</th>
                                                    <th class="language_txt">Montant dû TTC</th>
                                                    <th class="language_txt">Montant Payé</th>
                                                    <th class="language_txt">Montant à payer</th>
                                                    <th class="language_txt">Commercial</th>
                                                </tr>
                                            </thead>
                                            <tbody id="tbody_search_result">
                                            </tbody>
                                            <tfoot id="tfoot_search_result">
                                                <tr>
                                                     <th class="language_txt">Raison sociale</th>
                                                    <th class="language_txt">N° facture</th>
                                                    <th class="language_txt">Date de facture</th>
                                                    <th class="language_txt">Date d'échéance</th>
                                                    <th class="language_txt">Montant dû HT</th>
                                                    <th class="language_txt">Montant dû TTC</th>
                                                    <th class="language_txt">Montant Payé</th>
                                                    <th class="language_txt">Montant à payer</th>
                                                    <th class="language_txt">Commercial</th>
                                                </tr>
                                            </tfoot>
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
</asp:Content>
