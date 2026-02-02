<%@ Page Title="" Language="C#" MasterPageFile="~/Site.Master" AutoEventWireup="true"
    CodeBehind="SearchSupplier.aspx.cs" Inherits="ERP.Web.Views.Supplier.SearchSupplier" %>
<%@ Import Namespace="System.Web.Configuration" %>

<asp:Content ID="Content1" ContentPlaceHolderID="HeadContent" runat="server">
    <title>Rechercher founisseur</title>
    <!-- DATA TABLES -->
    <link rel="stylesheet" type="text/css" href="../../js/datatables/media/css/jquery.dataTables.min.css" />
    <link rel="stylesheet" type="text/css" href="../../js/datatables/media/assets/css/datatables.min.css" />
    <link rel="stylesheet" type="text/css" href="../../js/datatables/extras/TableTools/media/css/TableTools.min.css" />
    <link href="../../css/site.css" rel="stylesheet" type="text/css" />
    <link href="../../css/loading.css" rel="stylesheet" type="text/css" />
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
    <script src="../../js/ERP/supplier/SearchSupplier.js?V=<%= WebConfigurationManager.AppSettings["jsVersion"] %>"
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
                                <li><i class="fa fa-home"></i><a href="../../Default.aspx"><span class="language_txt">Home</span></a> </li>
                                <li><a href="#" class="language_txt">Rechercher Fournisseur</a> </li>
                            </ul>
                            <!-- /BREADCRUMBS -->
                            <div class="clearfix">
                                <h3 class="content-title pull-left language_txt">Fournisseur</h3>
                            </div>
                            <div class="description language_txt">Rechercher</div>
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
                                    <div class="box-body">
                                        <div class="form-horizontal">
                                            <div class="form-group">
                                                <label class="col-sm-2 control-label language_txt">Raison sociale</label>
                                                <div class="col-sm-2">
                                                    <input class="form-control searchcriteria" id="CompanyName" name="CompanyName" type="text" placeholder="Raison sociale"
                                                        required="" maxlength="200">
                                                </div>
                                                <label class="col-sm-2 control-label language_txt">Référence</label>
                                                <div class="col-sm-2">
                                                    <input type="text" class="form-control searchcriteria" id="Reference" name="Reference" placeholder="Référence de supplier" />
                                                </div>
                                                <label class="col-sm-2 control-label language_txt">Email</label>
                                                <div class="col-sm-2">
                                                    <div class="input-group">
                                                        <span class="input-group-addon">@</span>
                                                        <input type="email" id="Email" name="Email" class="form-control searchcriteria" placeholder="Email"
                                                            maxlength="100">
                                                    </div>
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <label class="col-sm-2 control-label language_txt">Code postal</label>
                                                <div class="col-sm-2">
                                                    <input class="form-control searchcriteria" id="Postcode" name="Postcode" type="text" placeholder="Code postal"
                                                        maxlength="10">
                                                </div>
                                                <label class="col-sm-2 control-label language_txt">Ville</label>
                                                <div class="col-sm-2">
                                                    <input type="text" class="form-control searchcriteria" id="City" name="City" placeholder="Ville" />
                                                </div>
                                                <label class="col-sm-2 control-label language_txt">Téléphone</label>
                                                <div class="col-sm-2">
                                                    <div class="input-group">
                                                        <span class="input-group-addon"><i class="fa fa-phone"></i></span>
                                                        <input type="text" class="form-control searchcriteria" id="Tel1" name="Tel1" data-mask="" maxlength="20"
                                                            placeholder="Téléphone">
                                                    </div>
                                                </div>
                                            </div>
                                            <div class="modal-footer center">
                                                <button type="button" class="btn btn-inverse start language_txt" id="btn_search" onclick="return js_search_supplier()">Rechercher</button>
                                            <button type="button" class="btn btn-inverse language_txt" onclick="create_supplier_click()">Créer un supplier</button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="separator">
                        </div>
                        <div class="row searchresult" id="div_supplier_result">
                            <div class="col-md-12">
                                <!-- BOX -->
                                <div class="box border inverse">
                                    <div class="box-title">
                                        <h4>
                                            <i class="fa fa-table"></i><span class="language_txt">Résultat</span></h4>
                                        <span style="float: right" id="result_count"></span>
                                    </div>
                                    <div class="box-body" style="width: 100%; overflow-x: auto;">
                                        <table id="datatable_supplier_result" cellpadding="0" cellspacing="0" border="0" class="datatable table table-striped table-bordered table-hover">
                                            <thead>
                                                <tr>
                                                    <th class="language_txt">Raison sociale</th>
                                                    <th class="language_txt">Référence</th>
                                                    <th class="language_txt">CP</th>
                                                    <th class="hidden-xs language_txt">Ville</th>
                                                    <th class="language_txt">Tél</th>
                                                    <th class="language_txt">Fax</th>
                                                    <th class="language_txt">Email</th>
                                                </tr>
                                            </thead>
                                            <tbody id="tbody_supplier_result">
                                            </tbody>
                                            <tfoot>
                                                <tr>
                                                    <th class="language_txt">Raison sociale</th>
                                                    <th class="language_txt">Référence</th>
                                                    <th class="language_txt">CP</th>
                                                    <th class="hidden-xs language_txt">Ville</th>
                                                    <th class="language_txt">Tél</th>
                                                    <th class="language_txt">Fax</th>
                                                    <th class="language_txt">Email</th>
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
    </div>
    <!-- DATA TABLES -->
    <script type="text/javascript" src="../../js/datatables/media/js/jquery.dataTables.min.js?V=<%= WebConfigurationManager.AppSettings["jsVersion"] %>"></script>
    <script type="text/javascript" src="../../js/datatables/media/assets/js/datatables.min.js?V=<%= WebConfigurationManager.AppSettings["jsVersion"] %>"></script>
    <script type="text/javascript" src="../../js/datatables/extras/TableTools/media/js/TableTools.min.js"></script>
    <script type="text/javascript" src="../../js/datatables/extras/TableTools/media/js/ZeroClipboard.min.js"></script>
    <script type="text/javascript" src="../../js/jQuery-Cookie/jquery.cookie.min.js"></script>
    <script src="../../js/bootbox/bootbox.min.js" type="text/javascript"></script>
</asp:Content>
