<%@ Page Title="" Language="C#" MasterPageFile="~/Site.Master" AutoEventWireup="true"
    CodeBehind="WarehouseVoucher.aspx.cs" Inherits="ERP.Web.Views.Warehouse.WarehouseVoucher" %>
<%@ Import Namespace="System.Web.Configuration" %>

<asp:Content ID="Content1" ContentPlaceHolderID="HeadContent" runat="server">
    <title>Entrepôt - Voucher</title>
    <!-- JQUERY UI DATE PICKER -->
    <link rel="stylesheet" type="text/css" href="../../js/jquery-ui-1.10.3.custom/css/custom-theme/jquery-ui-1.10.3.custom.min.css" />
    <!-- End JQUERY UI DATE PICKER -->
    <!-- DATA TABLES -->
    <link rel="stylesheet" type="text/css" href="../../js/datatables/media/css/jquery.dataTables.min.css" />
    <link rel="stylesheet" type="text/css" href="../../js/datatables/media/assets/css/datatables.min.css" />
    <link rel="stylesheet" type="text/css" href="../../js/datatables/extras/TableTools/media/css/TableTools.min.css" />
    <link href="../../css/site.css" rel="stylesheet" type="text/css" />
    <style>
        .shippingcls
        {
            display: none;
        }
        .receivingcls
        {
            display: none;
        }
        .label_left
        {
            text-align: left !important;
        }
        .label_right
        {
            text-align: right !important;
        }
    </style>
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
    <script src="../../js/ERP/Warehouse/WarehouseVoucher.js?V=<%= WebConfigurationManager.AppSettings["jsVersion"] %>"
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
                                <li><a href="SearchVoucher.aspx">&nbsp;Rechercher un Voucher</a> </li>
                                <li><a href="#">Voucher</a> </li>
                            </ul>
                            <!-- /BREADCRUMBS -->
                            <div class="clearfix">
                                <h3 class="content-title pull-left">
                                    Voucher</h3>
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
                                            <i class="fa fa-bars"></i>Client & information général</h4>
                                    </div>
                                    <div class="box-body">
                                        <div class="form-horizontal">
                                            <div class="form-group">
                                                <div class="col-md-12">
                                                    <div class="modal-body center forupdate">
                                                        <button type="button" class="btn btn-default" onclick="changeViewMode('view')">
                                                            Annuler</button>
                                                        <button type="button" class="btn btn-inverse" onclick="return js_create_update_costplan()">
                                                            Mettre à jour</button>
                                                    </div>
                                                    <div class="modal-body center forview" id="div_btns">
                                                        <button type="button" class="btn btn-inverse" id="btn_generate_pdf" style="display: none;"
                                                            onclick="return downloadPdf(this)">
                                                            Générer PDF</button>
                                                        <button type="button" class="btn btn-inverse modify_right" onclick="changeViewMode('modify')">
                                                            Modifier</button>
                                                        <%--<button type="button" class="btn btn-inverse modify_right" id="btn_validate"
                                                            onclick="ValidSrvClick()" style="display: none;">
                                                            Valider</button>
                                                        <button type="button" class="btn btn-inverse delete_right" id="btn_delete" onclick="return delete_costplan_click_confirm(this)" style="display: none;">
                                                            Supprimer</button>--%>
                                                    </div>
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <div class="col-sm-3" style="text-align: right;">
                                                    <input type="radio" name="btn_rev" id="SrvIsRev" onchange=" RevShpClick(this) " /><label
                                                        for="SrvIsRev">&nbsp;&nbsp;Emmagasinage</label>
                                                </div>
                                                <div class="col-sm-3" style="text-align: right;">
                                                    <input type="radio" name="btn_rev" id="btn_rev_shp" onchange=" RevShpClick(this) " /><label
                                                        for="btn_rev_shp">&nbsp;&nbsp;Déstockage</label>
                                                </div>
                                                <label class="col-sm-2 control-label  ">
                                                    Date
                                                </label>
                                                <div class="col-sm-4">
                                                    <input type="text" class="form-control" id="SrvTime" disabled="" />
                                                </div>
                                            </div>
                                            <div class="form-group receivingcls">
                                                <label class="col-sm-2 control-label ">
                                                    Rendre/Retourner par client ?
                                                </label>
                                                <div class="col-sm-4">
                                                    <input type="checkbox" class="form-control" id="SrvIsReturnClient" />
                                                </div>
                                                <label class="col-sm-2 control-label  ">
                                                    Date de rendu/retourné
                                                </label>
                                                <div class="col-sm-4">
                                                    <input type="text" class="form-control datepicker" id="SrvDReturnClient" />
                                                </div>
                                            </div>
                                            <div class="form-group shippingcls">
                                                <label class="col-sm-2 control-label ">
                                                    Prêter à client ?
                                                </label>
                                                <div class="col-sm-4">
                                                    <input type="radio" class="form-control" id="SrvIsLend" name="shiptype" onclick=" shipBtnClick(this) " />
                                                </div>
                                                <label class="col-sm-2 control-label  ">
                                                    Date de rendu prévu
                                                </label>
                                                <div class="col-sm-4">
                                                    <input type="text" class="form-control datepicker" id="SrvDLendReturnPre" disabled="" />
                                                </div>
                                            </div>
                                            <div class="form-group shippingcls">
                                                <label class="col-sm-2 control-label ">
                                                    Produit à détruire ?
                                                </label>
                                                <div class="col-sm-4">
                                                    <input type="radio" class="form-control" id="SrvIsDestroy" name="shiptype" onclick=" shipBtnClick(this) " />
                                                </div>
                                                <label class="col-sm-2 control-label  ">
                                                    Date de destruction
                                                </label>
                                                <div class="col-sm-4">
                                                    <input type="text" class="form-control datepicker" id="SrvDDestroy" disabled="" />
                                                </div>
                                            </div>
                                            <div class="form-group shippingcls">
                                                <label class="col-sm-2 control-label ">
                                                    Retour à fournisseur ?
                                                </label>
                                                <div class="col-sm-4">
                                                    <input type="radio" class="form-control" id="SrvIsReturnSupplier" name="shiptype"
                                                        onclick=" shipBtnClick(this) " />
                                                </div>
                                                <label class="col-sm-2 control-label  ">
                                                    Date de retour à fournisseur
                                                </label>
                                                <div class="col-sm-4">
                                                    <input type="text" class="form-control datepicker" id="SrvDReturnSupplier" disabled="" />
                                                </div>
                                            </div>
                                            <div class="form-group shippingcls">
                                                <label class="col-sm-2 control-label ">
                                                    Produit endommagé ?
                                                </label>
                                                <div class="col-sm-4">
                                                    <input type="radio" class="form-control" id="SrvIsDamaged" name="shiptype" onclick=" shipBtnClick(this) " />
                                                </div>
                                                <label class="col-sm-2 control-label  ">
                                                    Date d'endommagé
                                                </label>
                                                <div class="col-sm-4">
                                                    <input type="text" class="form-control datepicker" id="SrvDDamaged" disabled="" />
                                                </div>
                                            </div>
                                            <div class="form-group shippingcls">
                                                <label class="col-sm-2 control-label ">
                                                    Qucun ci-dessus
                                                </label>
                                                <div class="col-sm-4">
                                                    <input type="radio" class="form-control" id="SrvOther" name="shiptype" onclick=" shipBtnClick(this) " />
                                                </div>
                                                <div class="col-sm-6">
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <label class="col-sm-2 control-label ">
                                                    Client / Fournisseur
                                                </label>
                                                <div class="col-sm-4">
                                                    <textarea class="form-control" id="SrvClient"></textarea>
                                                </div>
                                                <label class="col-sm-2 control-label  ">
                                                    Commentaire
                                                </label>
                                                <div class="col-sm-4">
                                                    <textarea class="form-control" id="SrvDescription"></textarea>
                                                </div>
                                            </div>
                                            <div class="form-group forview">
                                                <label class="col-sm-2 control-label ">
                                                    Quantité Total</label>
                                                <div class="col-sm-4">
                                                    <input class="form-control" id="SrvTotalReal" disabled="disabled"/>
                                                </div>
                                                <label class="col-sm-2 control-label ">
                                                    Créateur</label>
                                                <div class="col-sm-4">
                                                    <input class="form-control" id="CreatorName" name="CreatorName" />
                                                </div>
                                            </div>
                                            <div class="modal-body center forupdate">
                                                <button type="button" class="btn btn-default" onclick="changeViewMode('view')">
                                                    Annuler</button>
                                                <button type="button" class="btn btn-inverse" onclick="return js_create_update_costplan()">
                                                    Mettre à jour</button>
                                            </div>
                                            <div class="modal-body center forview">
                                                <button type="button" class="btn btn-inverse" onclick="return changeViewMode('modify')">
                                                    Modifier</button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="row forview">
                    <div class="col-md-12">
                        <div class="row">
                            <div class="col-md-12">
                                <div class="box border inverse">
                                    <div class="box-title">
                                        <h4 style="overflow: hidden;">
                                            <i class="fa fa-bars"></i>Les lignes&nbsp; <span id="PtyName_general"></span>
                                        </h4>
                                    </div>
                                    <div class="box-body">
                                        <%--<div class="modal-body center forview">
                                            <button type="button" class="btn btn-inverse forupdate modify_right" onclick="setAddUpdateLine();">
                                                Ajouter une Ligne</button>
                                        </div>--%>
                                        <div class="form-horizontal center">
                                            <table cellpadding="0" cellspacing="0" border="0" class="table table-striped table-bordered table-hover">
                                                <thead id="thead_cost_plan_line">
                                                    <tr role="row">
                                                        <th rowspan="1" colspan="1" class="center">
                                                            CF (PI)
                                                        </th>
                                                        <th rowspan="1" colspan="1" class="center">
                                                            Logs Code
                                                        </th>
                                                        <th rowspan="1" colspan="1" class="center">
                                                            CF Qty
                                                        </th>
                                                        <th rowspan="1" colspan="1" class="center">
                                                            Logs Qty
                                                        </th>
                                                        <th rowspan="1" colspan="1" class="center">
                                                            Produit
                                                        </th>
                                                        <th rowspan="1" colspan="1" class="center">
                                                            Réf
                                                        </th>
                                                        <th rowspan="1" colspan="1" class="center">
                                                            Des. de Prod.
                                                        </th>
                                                        <th rowspan="1" colspan="1" class="center">
                                                            Description
                                                        </th>
                                                        <th rowspan="1" colspan="1" class="center">
                                                            Quantité
                                                        </th>
                                                        <th rowspan="1" colspan="1" class="center">
                                                            Prix U.
                                                        </th>
                                                        <th rowspan="1" colspan="1" class="center">
                                                            Prix T.
                                                        </th>
                                                        <th rowspan="1" colspan="1" class="center">
                                                            Entrepôt
                                                        </th>
                                                        <th rowspan="1" colspan="1" class="center">
                                                            Étagère
                                                        </th>
                                                        <%--<th rowspan="1" colspan="1" class="center modify_right" id="th_srl_btns_space">
                                                        </th>--%>
                                                    </tr>
                                                </thead>
                                                <tbody id="tbody_srl" style="text-align: center !important">
                                                </tbody>
                                                <tfoot>
                                                    <tr role="row">
                                                        <th rowspan="1" colspan="1" class="center">
                                                            CF (PI)
                                                        </th>
                                                        <th rowspan="1" colspan="1" class="center">
                                                            Logs Code
                                                        </th>
                                                        <th rowspan="1" colspan="1" class="center">
                                                            CF Qty
                                                        </th>
                                                        <th rowspan="1" colspan="1" class="center">
                                                            Logs Qty
                                                        </th>
                                                        <th rowspan="1" colspan="1" class="center">
                                                            Produit
                                                        </th>
                                                        <th rowspan="1" colspan="1" class="center">
                                                            Réf
                                                        </th>
                                                        <th rowspan="1" colspan="1" class="center">
                                                            Des. de Prod.
                                                        </th>
                                                        <th rowspan="1" colspan="1" class="center">
                                                            Description
                                                        </th>
                                                        <th rowspan="1" colspan="1" class="center">
                                                            Quantité
                                                        </th>
                                                        <th rowspan="1" colspan="1" class="center">
                                                            Prix U.
                                                        </th>
                                                        <th rowspan="1" colspan="1" class="center">
                                                            Prix T.
                                                        </th>
                                                        <th rowspan="1" colspan="1" class="center">
                                                            Entrepôt
                                                        </th>
                                                        <th rowspan="1" colspan="1" class="center">
                                                            Étagère
                                                        </th>
                                                        <%--<th rowspan="1" colspan="1" class="center modify_right" id="th1">
                                                        </th>--%>
                                                    </tr>
                                                </tfoot>
                                            </table>
                                        </div>
                                        <%--<div class="modal-body center forview">
                                            <button type="button" class="btn btn-inverse forupdate modify_right" onclick="setAddUpdateLine();">
                                                Ajouter une Ligne</button>
                                        </div>--%>
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
    <!-- DATE PICKER -->
    <script type="text/javascript" src="../../js/datepicker/picker.js"></script>
    <script type="text/javascript" src="../../js/datepicker/picker.date.js"></script>
    <script type="text/javascript" src="../../js/datepicker/picker.time.js"></script>
    <!-- End DATE PICKER -->
</asp:Content>
