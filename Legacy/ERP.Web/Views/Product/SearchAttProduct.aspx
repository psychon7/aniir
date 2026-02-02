<%@ Page Title="" Language="C#" MasterPageFile="~/Site.Master" AutoEventWireup="true"
    CodeBehind="SearchAttProduct.aspx.cs" Inherits="ERP.Web.Views.Product.SearchAttProduct" %>
<%@ Import Namespace="System.Web.Configuration" %>

<asp:Content ID="Content1" ContentPlaceHolderID="HeadContent" runat="server">
    <title>Rechercher Type de Produit</title>
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
    <script src="../../js/ERP/Product/ProductAtt.js?V=<%= WebConfigurationManager.AppSettings["jsVersion"] %>"
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
                                <li><a href="#" class="language_txt">Rechercher un type du produit</a> </li>
                               <%-- <li>Rechercher un type du produit</li>--%>
                            </ul>
                            <!-- /BREADCRUMBS -->
                            <div class="clearfix">
                                <h3 class="content-title pull-left language_txt" >Type du produit</h3>
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
                                <div class="box border inverse ">
                                    <div class="box-title">
                                        <h4>
                                            <i class="fa fa-bars"></i><span class="language_txt">Critère de recherche</span></h4>
                                    </div>
                                    <div class="box-body">
                                        <div class="form-horizontal">
                                            <div class="form-group">
                                                <label class="col-sm-3 control-label language_txt">Type de produit</label>
                                                <div class="col-sm-3">
                                                    <input class="form-control searchcriteria " id="PtyName" name="PtyName" type="text" placeholder="Type de produit"
                                                        required="" maxlength="200">
                                                </div>
                                                <label class="col-sm-3 control-label language_txt">Description de Type</label>
                                                <div class="col-sm-3">
                                                    <input type="text" class="form-control searchcriteria" id="PtyDescription" name="PtyDescription"
                                                        placeholder="Description de type" />
                                                </div>
                                            </div>
                                            <div class="modal-footer center">
                                                <button type="button" class="btn btn-inverse start language_txt" id="btn_search" onclick="return js_Search_Pty()">Rechercher</button>
                                                <button type="button" class="btn btn-inverse success language_txt" onclick="return createPrdAtt()">Créer un type</button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="separator">
                        </div>
                        <div class="row searchresult" id="div_search_result" style="width: 100%; overflow-x: auto;">
                            <div class="col-md-12">
                                <!-- BOX -->
                                <div class="box border inverse ">
                                    <div class="box-title">
                                        <h4>
                                            <i class="fa fa-table"></i><span class="language_txt">Résultat</span></h4>
                                    </div>
                                    <div class="box-body">
                                        <table id="datatable_search_result" cellpadding="0" cellspacing="0" border="0" class="datatable table table-striped table-bordered table-hover">
                                            <thead>
                                                <tr>
                                                    <th class="language_txt">Nom</th>
                                                    <th class="language_txt">Activé</th>
                                                    <th class="language_txt">Description</th>
                                                </tr>
                                            </thead>
                                            <tbody id="tbody_search_result">
                                            </tbody>
                                            <tfoot>
                                                <tr>
                                                    <th class="language_txt">Nom</th>
                                                    <th class="language_txt">Activé</th>
                                                    <th class="language_txt">Description</th>
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
