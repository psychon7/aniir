<%@ Page Title="" Language="C#" MasterPageFile="~/Empty.Master" AutoEventWireup="true"
    CodeBehind="SupplierPrice.aspx.cs" Inherits="ERP.Web.Views.Supplier.SupplierPrice" %>

<%@ Import Namespace="System.Web.Configuration" %>
<asp:Content ID="Content1" ContentPlaceHolderID="HeadContent" runat="server">
    <link rel="stylesheet" type="text/css" href="../../css/cloud-admin.css?version20170918">
    <link rel="stylesheet" type="text/css" href="../../css/themes/default.css?version20170918"
        id="skin_switcher">
    <link rel="stylesheet" type="text/css" href="../../css/responsive.css?version20170918">
    <link href="../../font-awesome/css/font-awesome.min.css?version20170918" rel="stylesheet">
    <!-- ANIMATE -->
    <link rel="stylesheet" type="text/css" href="../../css/animatecss/animate.min.css?version20170918" />
    <!-- GRITTER -->
    <link rel="stylesheet" type="text/css" href="../../js/gritter/css/jquery.gritter.css" />
    <!-- JQUERY -->
    <script src='<%= Page.ResolveClientUrl("~/js/jquery/jquery-2.0.3.min.js")%>'></script>
    <%--<script src='<%= Page.ResolveClientUrl("~/js/jquery/jquery-1.12.4.js")%>'></script>--%>
    <!-- JQUERY UI-->
    <script src='<%= Page.ResolveClientUrl("~/js/jquery-ui-1.10.3.custom/js/jquery-ui-1.10.3.custom.min.js")%>'></script>
    <!-- BOOTSTRAP -->
    <script src='<%= Page.ResolveClientUrl("~/bootstrap-dist/js/bootstrap.min.js")%>'></script>
    <!-- BLOCK UI -->
    <script type="text/javascript" src='<%= Page.ResolveClientUrl("~/js/jQuery-BlockUI/jquery.blockUI.min.js")%>'></script>
    <!-- SPARKLINES -->
    <script type="text/javascript" src='<%= Page.ResolveClientUrl("~/js/sparklines/jquery.sparkline.min.js")%>'></script>
    <!-- EASY PIE CHART -->
    <script src='<%= Page.ResolveClientUrl("~/js/jquery-easing/jquery.easing.min.js")%>'></script>
    <script type="text/javascript" src='<%= Page.ResolveClientUrl("~/js/easypiechart/jquery.easypiechart.min.js")%>'></script>
    <!-- FLOT CHARTS -->
    <script src='<%= Page.ResolveClientUrl("~/js/flot/jquery.flot.min.js")%>'></script>
    <script src='<%= Page.ResolveClientUrl("~/js/flot/jquery.flot.time.min.js")%>'></script>
    <script src='<%= Page.ResolveClientUrl("~/js/flot/jquery.flot.selection.min.js")%>'></script>
    <script src='<%= Page.ResolveClientUrl("~/js/flot/jquery.flot.resize.min.js")%>'></script>
    <script src='<%= Page.ResolveClientUrl("~/js/flot/jquery.flot.pie.min.js")%>'></script>
    <script src='<%= Page.ResolveClientUrl("~/js/flot/jquery.flot.stack.min.js")%>'></script>
    <script src='<%= Page.ResolveClientUrl("~/js/flot/jquery.flot.crosshair.min.js")%>'></script>
    <!-- COOKIE -->
    <script type="text/javascript" src='<%= Page.ResolveClientUrl("~/js/jQuery-Cookie/jquery.cookie.min.js")%>'></script>
    <!-- GRITTER -->
    <script type="text/javascript" src='<%= Page.ResolveClientUrl("~/js/gritter/js/jquery.gritter.min.js")%>'></script>
    <!-- CUSTOM SCRIPT -->
    <script src='<%= Page.ResolveClientUrl("~/js/script.js")%>'></script>
    <script src='<%= Page.ResolveClientUrl("~/css/loading.css")%>'></script>
</asp:Content>
<asp:Content ID="Content2" ContentPlaceHolderID="MainContent" runat="server">
    <script type="text/javascript">
        function getServicePath() {
            window.webservicePath ="<%= ResolveUrl("~/Services/ERPWebServices.asmx") %>";
        }
    </script>
    <script src="../../js/ERP/ERPBaseJS.js?V=<%= WebConfigurationManager.AppSettings["jsVersion"] %>"
        type="text/javascript"></script>
    <script src="../../js/ERP/CommonJS.js?V=<%= WebConfigurationManager.AppSettings["jsVersion"] %>"
        type="text/javascript"></script>
    <script src="../../js/ERP/Supplier/SupplierPriceJS.js?V=<%= WebConfigurationManager.AppSettings["jsVersion"] %>"
        type="text/javascript"></script>
    <div class="container">
        <div class="row">
            <div id="content" class="col-lg-12">
                <!-- PAGE HEADER-->
                <div class="row">
                    <div class="col-sm-12">
                        <div class="page-header">
                            <!-- /BREADCRUMBS -->
                            <div class="clearfix">
                                <h3 class="content-title pull-left">
                                    <span id="sp_client"></span>
                                </h3>
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
                                            <i class="fa fa-bars"></i>Liste de produit</h4>
                                        <span style="float: right" id="sp_prd_list_count"></span>
                                    </div>
                                    <div class="box-body">
                                        <div class="form-horizontal" id="div_prd_list" style="max-height: 500px; overflow-y: auto">
                                            <div class="form-group" id="div_loading_prdlist">
                                                <div class="col-sm-12 center">
                                                    <img src="../../img/loaders/12.gif" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="col-md-6">
                                <div class="box border inverse">
                                    <div class="box-title">
                                        <h4>
                                            <i class="fa fa-bars"></i>Prix</h4>
                                    </div>
                                    <div class="box-body">
                                        <div class="form-horizontal">
                                            <div class="form-group" id="div_loading_price" style="display: none; max-height: 500px;
                                                overflow-y: auto;">
                                                <div class="col-sm-12 center">
                                                    <img src="../../img/loaders/12.gif" />
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <label class="col-sm-12 control-label" style="text-align: center;" id="lb_productname">
                                                </label>
                                            </div>
                                        </div>
                                        <div class="form-horizontal" id="div_price_list" style="max-height: 500px; overflow-y: auto">
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <!-- /SAMPLE -->
            <div class="footer-tools">
                <span class="go-top"><i class="fa fa-chevron-up"></i>Top </span>
            </div>
        </div>
        <!-- /CONTENT-->
    </div>
</asp:Content>
