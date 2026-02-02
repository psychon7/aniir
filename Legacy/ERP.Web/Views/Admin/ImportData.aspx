<%@ Page Title="" Language="C#" MasterPageFile="~/Site.Master" AutoEventWireup="true"
    CodeBehind="ImportData.aspx.cs" Inherits="ERP.Web.Views.Admin.ImportData" %>

<%@ Import Namespace="System.Web.Configuration" %>
<asp:Content ID="Content1" ContentPlaceHolderID="HeadContent" runat="server">
    <title>Import DATA ! ADMINISTRATION !</title>
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
    <script>
        function RightErrorRedirect() {
            MsgPopUpWithResponse('ERREUR', 'Erreur d\'autorisation, vous n\'avez pas des autorisations suffisantes, veuillez contacter votre administrateur !', 'Redirct2Default()');
            return false;
        }

        function Redirct2Default() {
            window.location = '../../Default.aspx';
        }
    </script>
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
                                <li><a href="#">Importer les DATA</a> </li>
                            </ul>
                            <!-- /BREADCRUMBS -->
                            <div class="clearfix">
                                <h3 class="content-title pull-left">
                                    Importer</h3>
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
                                <div class="box border blue">
                                    <div class="box-title">
                                        <h4>
                                            <i class="fa fa-bars"></i>Import les produits avec fournisseur</h4>
                                    </div>
                                    <div class="box-body" id="divSearchCondition">
                                        <div class="form-horizontal">
                                            <div class="form-group">
                                                <label class="col-sm-2 control-label">
                                                    Supplier with products</label>
                                                <div class="col-sm-10">
                                                    <asp:TextBox runat="server" TextMode="MultiLine" Rows="10" ID="txb_supplier_product"
                                                        CssClass="form-control"></asp:TextBox>
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <%--<label class="col-sm-3 control-label">
                                                    Fichier</label>
                                                <div class="col-sm-3">
                                                    <asp:FileUpload runat="server" ID="fup_supplier_product" class="btn btn-pink" />
                                                </div>--%>
                                                <div class="col-sm-12 center">
                                                    <asp:Button type="button" class="btn btn-primary start" runat="server" ID="btn_treate_supplier_product"
                                                        OnClick="btn_treate_supplier_product_OnClick" Text="Treate" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="separator">
                        </div>
                        <div class="row">
                            <div class="col-md-12">
                                <div class="box border blue">
                                    <div class="box-title">
                                        <h4>
                                            <i class="fa fa-bars"></i>Import les clients</h4>
                                    </div>
                                    <div class="box-body" id="div1">
                                        <div class="form-horizontal">
                                            <div class="form-group">
                                                <label class="col-sm-2 control-label">
                                                    Clients</label>
                                                <div class="col-sm-10">
                                                    <asp:TextBox runat="server" TextMode="MultiLine" ClientIDMode="Static" Rows="10"
                                                        ID="txb_clients" CssClass="form-control txb_clients"></asp:TextBox>
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <%--<label class="col-sm-3 control-label">
                                                    Fichier</label>
                                                <div class="col-sm-3">
                                                    <asp:FileUpload runat="server" ID="fup_supplier_product" class="btn btn-pink" />
                                                </div>--%>
                                                <div class="col-sm-12 center">
                                                    <asp:Button type="button" class="btn btn-primary start" runat="server" ID="btn_treate_clients"
                                                        OnClick="btn_treate_clients_OnClick" Text="Treate" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="separator">
                        </div>
                        <div class="row" style="display:none;">
                            <div class="col-md-12">
                                <div class="box border blue">
                                    <div class="box-title">
                                        <h4>
                                            <i class="fa fa-bars"></i>Import By Suivi Admin</h4>
                                    </div>
                                    <div class="box-body" id="div2">
                                        <div class="form-horizontal">
                                            <div class="form-group">
                                                <label class="col-sm-1 control-label">
                                                    Suivi Admin</label>
                                                <label class="col-sm-1 control-label">
                                                    Séparer Prj 100W</label>
                                                <div class="col-sm-1">
                                                    <asp:CheckBox runat="server" ID="cbx_seperate_prj_100" CssClass="form-control" Checked="True" />
                                                </div>
                                                <label class="col-sm-1 control-label">
                                                    Séparer Prj 150W</label>
                                                <div class="col-sm-1">
                                                    <asp:CheckBox runat="server" ID="cbx_seperate_prj_150" CssClass="form-control" Checked="True" />
                                                </div>
                                                <label class="col-sm-1 control-label">
                                                    Séparer Parc etanche</label>
                                                <div class="col-sm-1">
                                                    <asp:CheckBox runat="server" ID="cbx_seperate_parc" CssClass="form-control" Checked="True" />
                                                </div>
                                                <label class="col-sm-1 control-label">
                                                    Séparer Candélabres 50W</label>
                                                <div class="col-sm-1">
                                                    <asp:CheckBox runat="server" ID="cbx_seperate_street" CssClass="form-control" Checked="True" />
                                                </div>
                                                <label class="col-sm-1 control-label">
                                                    Séparer Candélabres 100W</label>
                                                <div class="col-sm-1">
                                                    <asp:CheckBox runat="server" ID="cbx_seperate_street100w" CssClass="form-control"
                                                        Checked="True" />
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <label class="col-sm-1 control-label">
                                                    Séparer Solaire</label>
                                                <div class="col-sm-1">
                                                    <asp:CheckBox runat="server" ID="cbx_seperate_solar" CssClass="form-control" Checked="True" />
                                                </div>
                                                <div class="col-sm-12">
                                                    <asp:TextBox runat="server" TextMode="MultiLine" Rows="10" ID="txb_suivi_admin" CssClass="form-control"></asp:TextBox>
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <div class="col-sm-12 center">
                                                    <asp:Button type="button" class="btn btn-primary start" runat="server" ID="btn_import_20231017_Suivi_Admin"
                                                        OnClick="btn_import_20231017_Suivi_Admin_OnClick" Text="Import Suivi Admin" />
                                                    <%--   <button type="button" class="btn btn-inverse" id="btn_downloadSuivi" onclick="return downloadSuivi()" >
                                                            Download Suivi</button>--%>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="separator">
                        </div>
                        <div class="row">
                            <div class="col-md-12">
                                <div class="box border blue">
                                    <div class="box-title">
                                        <h4>
                                            <i class="fa fa-bars"></i>Import LIVRAISON CDL/ECOLED</h4>
                                    </div>
                                    <div class="box-body" id="div2">
                                        <div class="form-horizontal">
                                            <div class="form-group">
                                                <label class="col-sm-1 control-label">
                                                    LIVRAISON CDL</label>
                                                <label class="col-sm-1 control-label">
                                                    Séparer UFO</label>
                                                <div class="col-sm-1">
                                                    <asp:CheckBox runat="server" ID="cbx_sp_ufo" CssClass="form-control" Checked="false" />
                                                </div>
                                                <label class="col-sm-1 control-label">
                                                    Séparer Linear</label>
                                                <div class="col-sm-1">
                                                    <asp:CheckBox runat="server" ID="cbx_sp_linear" CssClass="form-control" Checked="false" />
                                                </div>
                                            </div>                                                               
                                            <div class="form-group">
                                                <div class="col-sm-12">
                                                    <asp:TextBox runat="server" TextMode="MultiLine" Rows="10" ID="txb_livraisoncdl" CssClass="form-control"></asp:TextBox>
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <div class="col-sm-12 center">
                                                    <asp:Button type="button" class="btn btn-primary start" runat="server" ID="btn_livraison_cdl_20251027"
                                                        OnClick="btn_livraison_cdl_20251027_OnClick" Text="Import LIVRAISON CDL/ECOLED" />
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
    <script>
        function downloadSuivi() {
            var text2treat = $('.txb_clients').text();
            if (!IsNullOrEmpty(text2treat)) {
                var allline = text2treat.split('\n');
                var lines = [];
                $.each(allline, function (name, value) {
                    if (!IsNullOrEmpty(value)) {
                        var onelineinfo = value.split('\t');
                        var oneline = {};
                        oneline.Line = onelineinfo[0];
                        oneLine.DfoCode = onelineinfo[1];
                        lines.push(oneLine);
                    }
                });
            }
        }
    </script>
</asp:Content>
