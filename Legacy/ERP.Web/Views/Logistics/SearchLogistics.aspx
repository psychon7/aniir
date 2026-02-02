<%@ Page Title="" Language="C#" MasterPageFile="~/Site.Master" AutoEventWireup="true"
    CodeBehind="SearchLogistics.aspx.cs" Inherits="ERP.Web.Views.Logistics.SearchLogistics" %>
<%@ Import Namespace="System.Web.Configuration" %>

<asp:Content ID="Content1" ContentPlaceHolderID="HeadContent" runat="server">
    <title>Rechercher Container</title>
    <!-- JQUERY UI DATE PICKER -->
    <link rel="stylesheet" type="text/css" href="../../js/jquery-ui-1.10.3.custom/css/custom-theme/jquery-ui-1.10.3.custom.min.css" />
    <!-- End JQUERY UI DATE PICKER -->
    <!-- DATA TABLES -->
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
    <script src="../../js/ERP/Logistics/LogisticsSearch.js?V=<%= WebConfigurationManager.AppSettings["jsVersion"] %>"
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
                                <li><i class="fa fa-home"></i><a href="../../Default.aspx">&nbsp;Home</a> </li>
                                <li><a href="#">Rechercher un envoie 查找</a> </li>
                            </ul>
                            <!-- /BREADCRUMBS -->
                            <div class="clearfix">
                                <h3 class="content-title pull-left">
                                    Envoie 物流</h3>
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
                                            <i class="fa fa-bars"></i>Critère de recherche</h4>
                                    </div>
                                    <div class="box-body" id="divSearchCondition">
                                        <div class="form-horizontal">
                                            <div class="form-group">
                                                <label class="col-sm-2 control-label">
                                                    Tranporteur<br/> 承运商</label>
                                                <div class="col-sm-2">
                                                    <select class="form-control" id="SupId" name="SupId">
                                                    </select>
                                                </div>
                                                <label class="col-sm-2 control-label">
                                                    Nom de logistics<br/>物流名</label>
                                                <div class="col-sm-2">
                                                    <input class="form-control" id="LgsName" name="LgsName" type="text" maxlength="200">
                                                </div>
                                                <label class="col-sm-2 control-label">
                                                    Code de logistics<br/>物流号码</label>
                                                <div class="col-sm-2">
                                                    <input class="form-control" id="LgsCode" name="LgsCode" type="text" maxlength="200">
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <%--<label class="col-sm-2 control-label">
                                                    Code de PI</label>
                                                <div class="col-sm-2">
                                                    <input class="form-control" id="SinCode" name="SinCode" type="text" maxlength="200">
                                                </div>--%>
                                                <label class="col-sm-2 control-label">
                                                    Tracking Nbr<br/>物流单号</label>
                                                <div class="col-sm-2">
                                                    <input class="form-control" id="LgsTrackingNumber" name="LgsTrackingNumber" type="text" maxlength="200">
                                                </div>
                                                <label class="col-sm-2 control-label">
                                                    Date d'arrive pre du 预计到达从</label>
                                                <div class="col-sm-2">
                                                    <div class="input-group">
                                                        <input class="form-control datepicker" id="_LgsDateArrivePre" name="_LgsDateArrivePre"
                                                            type="text" /><span class="input-group-addon"><i class="fa fa-calendar"></i></span>
                                                    </div>
                                                </div>
                                                <label class="col-sm-2 control-label">
                                                    Date d'arrive pre au 预计到达止</label>
                                                <div class="col-sm-2">
                                                    <div class="input-group">
                                                        <input class="form-control datepicker" id="_LgsDateArrive" name="_LgsDateArrive"
                                                            type="text" /><span class="input-group-addon"><i class="fa fa-calendar"></i></span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <label class="col-sm-2 control-label">
                                                    Déjà envoyé 已发货 (如选，仅显示发货)</label>
                                                <div class="col-sm-2">
                                                    <input class="form-control" type="checkbox" id="cbx_send" />
                                                </div>
                                                <label class="col-sm-2 control-label">
                                                    Déjà reçu 已收到 (如选，仅显示已收到)</label>
                                                <div class="col-sm-2">
                                                    <input class="form-control" type="checkbox" id="cbx_arrived" />
                                                </div>
                                            </div>
                                            <div class="modal-footer center">
                                                <button type="submit" class="btn btn-inverse start" onclick="return js_search()">
                                                    Rechercher</button>
                                                <button type="button" class="btn btn-inverse success" onclick="return createItem()">
                                                    Créer un container</button>
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
                                            <i class="fa fa-table"></i>Résultat
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
    <!-- DATE PICKER -->
    <script type="text/javascript" src="../../js/datepicker/picker.js"></script>
    <script type="text/javascript" src="../../js/datepicker/picker.date.js"></script>
    <script type="text/javascript" src="../../js/datepicker/picker.time.js"></script>
    <!-- End DATE PICKER -->
</asp:Content>
