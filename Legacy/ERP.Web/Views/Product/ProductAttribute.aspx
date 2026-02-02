<%@ Page Title="" Language="C#" MasterPageFile="~/Site.Master" AutoEventWireup="true"
    CodeBehind="ProductAttribute.aspx.cs" Inherits="ERP.Web.Views.Product.ProductAttribute" %>
<%@ Import Namespace="System.Web.Configuration" %>

<asp:Content ID="Content1" ContentPlaceHolderID="HeadContent" runat="server">
    <title>ERP - Attributes de produit</title>
    <link href="../../css/site.css" rel="stylesheet" type="text/css" />
    <style>
        .att_label
        {
            text-align: center !important;
        }
        .large-dialog
        {
        }
        .large-dialog > .modal-dialog
        {
            width: 80% !important;
        }
        .new-modal-footer
        {
            margin-top: 15px;
            margin-bottom: 15px;
            padding: 19px 20px 20px;
            text-align: right;
            border-top: 1px solid #e5e5e5;
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
    <script src="../../js/ERP/CommonJS.js?V=<%= WebConfigurationManager.AppSettings["jsVersion"] %>"
        type="text/javascript"></script>
    <script src="../../js/ERP/ERPBaseJS.js?V=<%= WebConfigurationManager.AppSettings["jsVersion"] %>"
        type="text/javascript"></script>
    <script src="../../js/ERP/Product/ProductAtt.js?V=<%= WebConfigurationManager.AppSettings["jsVersion"] %>"
        type="text/javascript"></script>
    <%--<script src="../../js/ERP/ERPBaseJS.js" type="text/javascript"></script>--%>
    <%--<script src="../../js/ERP/ProductAtt.js" type="text/javascript"></script>--%>
    <div class="container">
        <div class="row">
            <div id="content" class="col-lg-12">
                <!-- PAGE HEADER-->
                <div class="row">
                    <div class="col-sm-12">
                        <div class="page-header">
                            <!-- BREADCRUMBS -->
                            <ul class="breadcrumb">
                                <li><i class="fa fa-home"></i>&nbsp;<a href="../../Default.aspx"><span class="language_txt">Home</span></a> </li>
                                <li><a href="SearchAttProduct.aspx"><span class="language_txt">Rechercher un Type</span></a> </li>
                                <li><span class="language_txt">Type du produit</span></li>
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
                                <div class="box border inverse">
                                    <div class="box-title">
                                        <h4>
                                            <i class="fa fa-bars"></i><span class="language_txt">Information général de produit</span></h4>
                                    </div>
                                    <div class="box-body">
                                        <div class="form-horizontal">
                                            <div class="form-group">
                                                <label class="col-sm-3 control-label language_txt">Nom de produit</label>
                                                <div class="col-sm-9">
                                                    <input type="text" class="form-control" id="PtyName" name="PtyName" placeholder="Nom de l'attribut"
                                                        required maxlength="200">
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <label class="col-sm-3 control-label language_txt">Activé</label>
                                                <div class="col-sm-9">
                                                    <input type="checkbox" class="form-control" id="PtyActived" name="PtyActived" />
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <label class="col-sm-3 control-label language_txt">Couleur de Fiche Tech</label>
                                                <div class="col-sm-9">
                                                    <select class="form-control" id="CorId">
                                                    </select>
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <label class="col-sm-3 control-label language_txt">Description de produit</label>
                                                <div class="col-sm-9">
                                                    <textarea rows="3" cols="5" name="PtyDescription" class="form-control" id="PtyDescription"
                                                        placeholder="Description de produit"></textarea>
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <label class="col-sm-3 control-label language_txt">NORMES</label>
                                                <div class="col-sm-9">
                                                    <textarea rows="3" cols="5" name="PtyStandards" class="form-control" id="PtyStandards"></textarea>
                                                </div>
                                            </div>
                                            <div class="modal-body center forview">
                                                <button type="button" class="btn btn-inverse language_txt" onclick="changeViewMode('modify')">Modifier</button>
                                                <button type="button" class="btn btn-inverse language_txt" onclick="return DuplicateProdType()">Dupliquer</button>
                                            </div>
                                            <div class="modal-body center forupdate">
                                                <button type="button" class="btn btn-inverse language_txt" onclick="changeViewMode('view')">Annuler</button>
                                                <button type="button" class="btn btn-inverse language_txt" onclick="js_create_update_attr()">Mettre à jour</button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="separator">
                        </div>
                    </div>
                </div>
                <div class="row">
                    <div class="col-md-12">
                        <div class="box border inverse">
                            <div class="box-title">
                                <h4>
                                    <i class="fa fa-bars"></i><span class="language_txt">Attributs génériques</span></h4>
                            </div>
                            <div class="box-body">
                                <div class="modal-body center forcreate forupdate">
                                    <button type="button" class="btn btn-inverse forupdate language_txt" onclick="AddOneAttribute();">Ajouter un attribut</button>
                                </div>
                                <div class="form-horizontal">
                                    <div class="form-group">
                                        <label class="col-sm-2 control-label att_label language_txt">Nom</label>
                                        <label class="col-sm-1 control-label att_label language_txt">Unité</label>
                                        <div class="col-sm-2"><table style="width:100%" cellpadding="0" cellspacing="0" border="0" class="table-striped table-bordered table-hover">
                                                <tr>
                                                    <th><label class="control-label att_label language_txt">F.Tch</label></th>
                                                    <th><label class="control-label att_label language_txt">Img/File</label></th>
                                                    <th><label class="control-label att_label language_txt">U.Dt</label></th>
                                                    <th><label class="control-label att_label language_txt">Ttr</label></th>
                                                    <th><label class="control-label att_label language_txt">MêVa</label></th>
                                                    <th><label class="control-label att_label language_txt">Obg</label></th>
                                                    <th><label class="control-label att_label language_txt">Rech</label></th>
                                                    <th><label class="control-label att_label language_txt">Prix</label></th>
                                                </tr>
                                            </table>
                                        <%--F.Tch | Img/File | U.Dt | Ttr | MêVa | Obg | Rech | Prix--%>
                                        </div>
                                        <label class="col-sm-1 control-label att_label language_txt">Affichage Odr</label>
                                        <label class="col-sm-1 control-label att_label language_txt">ID</label>
                                        <label class="col-sm-1 control-label att_label language_txt">Parent ID</label>
                                        <label class="col-sm-1 control-label att_label language_txt">Type</label>
                                        <label class="col-sm-1 control-label att_label language_txt">Description</label>
                                        <label class="col-sm-1 control-label att_label language_txt">Valeur par défault</label>
                                        <label class="col-sm-1 control-label att_label language_txt">
                                        </label>
                                    </div>
                                </div>
                                <div class="form-horizontal" id="div_attributes">
                                </div>
                                <div class="modal-body center forcreate forupdate">
                                    <button type="button" class="btn btn-inverse language_txt" onclick="AddOneAttribute();">Ajouter un attribut</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <!-- /FORMS -->
            <div class="separator">
            </div>
            <!-- SAMPLE -->
            <div class="row">
                <div class="col-md-12">
                    <div class="modal-body center forcreate">
                        <button type="button" class="btn btn-inverse language_txt" onclick="js_create_update_attr()">Créer</button>
                    </div>
                    <div class="modal-body center forupdate">
                        <button type="button" class="btn btn-inverse language_txt" onclick="changeViewMode('view')">Annuler</button>
                        <button type="button" class="btn btn-inverse language_txt" onclick="js_create_update_attr()">Mettre à jour</button>
                    </div>
                    <div class="modal-body center forview">
                        <button type="button" class="btn btn-inverse language_txt" onclick="delete_pty_click_confirm(this)">Supprimer</button>
                        <button type="button" class="btn btn-inverse language_txt" onclick="changeViewMode('modify')">Modifier</button>
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
    <%--<uc:ucCco ID="ucCco" runat="server" />--%>
    <script type="text/javascript" src="../../js/jQuery-BlockUI/jquery.blockUI.min.js"></script>
    <script type="text/javascript" src="../../js/datatables/extras/TableTools/media/js/ZeroClipboard.min.js"></script>
    <script type="text/javascript" src="../../js/jQuery-Cookie/jquery.cookie.min.js"></script>
    <script src="../../js/bootbox/bootbox.min.js" type="text/javascript"></script>
</asp:Content>
