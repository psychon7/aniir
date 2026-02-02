<%@ Page Title="" Language="C#" MasterPageFile="~/Empty.Master" AutoEventWireup="true"
    CodeBehind="SupplierOrderPR.aspx.cs" Inherits="ERP.Web.Views.PaymentRecord.SupplierOrderPR" %>
<%@ Import Namespace="System.Web.Configuration" %>

<asp:Content ID="Content1" ContentPlaceHolderID="HeadContent" runat="server">
    <title>ERP - Dossier de paiement de la commande fournisseur</title>
    <!-- FULL CALENDAR -->
    <link rel="stylesheet" type="text/css" href="../../js/fullcalendar/fullcalendar.min.css" />
    <link rel="stylesheet" type="text/css" href="../../css/cloud-admin.css?version20170918">
    <link rel="stylesheet" type="text/css" href="../../css/themes/default.css?version20170918"
        id="skin_switcher">
    <link rel="stylesheet" type="text/css" href="../../css/responsive.css?version20170918">
    <!-- STYLESHEETS -->
    <link href="../../font-awesome/css/font-awesome.min.css?version20170918" rel="stylesheet">
    <%--<link rel="stylesheet" type="text/css" href="../../js/bootstrap-daterangepicker/daterangepicker-bs3.css" />--%>
    <!-- DATA TABLES -->
    <link rel="stylesheet" type="text/css" href="../../js/datatables/media/css/jquery.dataTables.min.css" />
    <link rel="stylesheet" type="text/css" href="../../js/datatables/media/assets/css/datatables.min.css" />
    <link rel="stylesheet" type="text/css" href="../../js/datatables/extras/TableTools/media/css/TableTools.min.css" />
    <!-- JQUERY UI DATE PICKER -->
    <%--<link rel="stylesheet" type="text/css" href="../../js/jquery-ui-1.10.3.custom/css/custom-theme/jquery-ui-1.10.3.custom.min.css" />--%>
    <!-- End JQUERY UI DATE PICKER -->
    <%--<script src="../../js/jquery/jquery-2.0.3.min.js" type="text/javascript"></script>--%>
    <link rel="stylesheet" type="text/css" href="../../js/datepicker2/libs/jqueryui/1.10.4/css/jquery-ui.min.css" />
    <script src="../../js/datepicker2/libs/jquery/1.10.2/jquery.min.js"></script>
    <script src="../../js/datepicker2/libs/jqueryui/1.10.4/jquery-ui.min.js"></script>
    <script src="../../js/ERP/ERPBaseJS.js?V=<%= WebConfigurationManager.AppSettings["jsVersion"] %>"
        type="text/javascript"></script>
    <script src="../../js/ERP/CommonJS.js?V=<%= WebConfigurationManager.AppSettings["jsVersion"] %>"
        type="text/javascript"></script>
    <script src="../../js/ERP/PaymentRecord/SupplierOrderPRJS.js?V=<%= WebConfigurationManager.AppSettings["jsVersion"] %>"
        type="text/javascript"></script>
</asp:Content>
<asp:Content ID="Content2" ContentPlaceHolderID="MainContent" runat="server">
    <script>
       function getServicePath() {
            window.webservicePath ="<%= ResolveUrl("~/Services/ERPWebServices.asmx") %>";
        }
    </script>
    <div class="container">
        <div class="row">
            <div id="content" class="col-lg-12">
                <div class="row">
                    <div class="col-md-12">
                        <div class="row" id="div_todo">
                            <div class="col-md-12">
                                <div class="box border inverse">
                                    <div class="box-title">
                                        <h4>
                                            <i class="fa fa-dollar"></i><span>Dossier de paiement de la commande fournisseur</span></h4>
                                    </div>
                                    <div class="box-body">
                                        <div class="form-horizontal">
                                            <div class="form-group">
                                                <div class="col-md-12">
                                                    <div class="box border inverse" style="max-height: 800px; overflow-y: auto;">
                                                        <div class="modal-body center">
                                                            <button type="button" class="btn btn-inverse" onclick="return addSOPayementRecord(0)">
                                                                Ajouter un dossier de paiement</button>
                                                        </div>
                                                        <div class="box-body">
                                                            <div class="form-horizontal" id="div_new_record">
                                                            </div>
                                                        </div>
                                                        <div class="box-body">
                                                            <div class="form-horizontal" id="div_done_record">
                                                                <table id="datatable_search_result" cellpadding="0" cellspacing="0" border="0" class="datatable table table-striped table-bordered table-hover">
                                                                    <thead id="thead_search_result">
                                                                        <tr>
                                                                            <th>
                                                                                D. Création 创建日期
                                                                            </th>
                                                                            <th>
                                                                                D. MAJ 更新日期
                                                                            </th>
                                                                            <th>
                                                                                D. Paiement 支付日期
                                                                            </th>
                                                                            <th>
                                                                                Montant de paiement 支付金额
                                                                            </th>
                                                                            <th>
                                                                                Commentaire 支付备注
                                                                            </th>
                                                                            <th>
                                                                            </th>
                                                                        </tr>
                                                                    </thead>
                                                                    <tbody id="tbody_search_result">
                                                                    </tbody>
                                                                    <tfoot id="tfoot_search_result">
                                                                        <tr>
                                                                            <th>
                                                                                D. Création 创建日期
                                                                            </th>
                                                                            <th>
                                                                                D. MAJ 更新日期
                                                                            </th>
                                                                            <th>
                                                                                D. Paiement 支付日期
                                                                            </th>
                                                                            <th>
                                                                                Montant de paiement 支付金额
                                                                            </th>
                                                                            <th>
                                                                                Commentaire 支付备注
                                                                            </th>
                                                                            <th>
                                                                            </th>
                                                                        </tr>
                                                                    </tfoot>
                                                                </table>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <!-- /FORMS -->
            <div class="separator">
            </div>
            <!--- /Cost Plan Lines -->
            <div class="footer-tools">
                <span class="go-top"><i class="fa fa-chevron-up"></i>Top </span>
            </div>
        </div>
        <!-- /CONTENT-->
    </div>
    <%--<script type="text/javascript" src="../../js/jQuery-BlockUI/jquery.blockUI.min.js"></script>--%>
    <!-- DATA TABLES -->
    <script type="text/javascript" src="../../js/datatables/media/js/jquery.dataTables.min.js?V=<%= WebConfigurationManager.AppSettings["jsVersion"] %>"></script>
    <script type="text/javascript" src="../../js/datatables/media/assets/js/datatables.min.js?V=<%= WebConfigurationManager.AppSettings["jsVersion"] %>"></script>
    <%-- <script type="text/javascript" src="../../js/datatables/extras/TableTools/media/js/TableTools.min.js"></script>
    <script type="text/javascript" src="../../js/datatables/extras/TableTools/media/js/ZeroClipboard.min.js"></script>
    <script type="text/javascript" src="../../js/jQuery-Cookie/jquery.cookie.min.js"></script>
    <script src="../../js/bootbox/bootbox.min.js" type="text/javascript"></script>--%>
    <!-- DATE PICKER -->
    <%--<script type="text/javascript" src="../../js/datepicker/picker.js"></script>
    <script type="text/javascript" src="../../js/datepicker/picker.date.js"></script>
    <script type="text/javascript" src="../../js/datepicker/picker.time.js"></script>--%>
    <!-- End DATE PICKER -->
</asp:Content>
