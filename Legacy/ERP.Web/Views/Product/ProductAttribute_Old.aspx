<%@ Page Title="" Language="C#" MasterPageFile="~/Site.Master" AutoEventWireup="true"
    CodeBehind="ProductAttribute_Old.aspx.cs" Inherits="ERP.Web.Views.Product.ProductAttribute_Old" %>
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
    <script src="../../js/ERP/CommonJS.js?V=<%= WebConfigurationManager.AppSettings["jsVersion"] %>"
        type="text/javascript"></script>
    <script src="../../js/ERP/ERPBaseJS.js?V=<%= WebConfigurationManager.AppSettings["jsVersion"] %>"
        type="text/javascript"></script>
    <script src="../../js/ERP/ProductAtt.js?V=<%= WebConfigurationManager.AppSettings["jsVersion"] %>"
        type="text/javascript"></script>
    <script src="../../js/ERP/ProductMatrix.js?V=<%= WebConfigurationManager.AppSettings["jsVersion"] %>"
        type="text/javascript"></script>
    <script src="../../js/ERP/ProductMatrixZ.js?V=<%= WebConfigurationManager.AppSettings["jsVersion"] %>"
        type="text/javascript"></script>
    <%--<script src="../../js/ERP/ProductMatrix.js" type="text/javascript"></script>--%>
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
                                <li><i class="fa fa-home"></i><a href="../../Default.aspx">Home</a> </li>
                                <li><a href="SearchAttProduct.aspx">Rechercher un Type</a> </li>
                                <li>Type du produit</li>
                            </ul>
                            <!-- /BREADCRUMBS -->
                            <div class="clearfix">
                                <h3 class="content-title pull-left">
                                    Type du produit</h3>
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
                                            <i class="fa fa-bars"></i>Information général de produit</h4>
                                    </div>
                                    <div class="box-body">
                                        <div class="form-horizontal">
                                            <div class="form-group">
                                                <label class="col-sm-3 control-label">
                                                    Nom de produit</label>
                                                <div class="col-sm-9">
                                                    <input type="text" class="form-control" id="PtyName" name="PtyName" placeholder="Nom de l'attribut"
                                                        required maxlength="200">
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <label class="col-sm-3 control-label">
                                                    Activé</label>
                                                <div class="col-sm-9">
                                                    <input type="checkbox" class="form-control" id="PtyActived" name="PtyActived" />
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <label class="col-sm-3 control-label">
                                                    Description de produit</label>
                                                <div class="col-sm-9">
                                                    <textarea rows="3" cols="5" name="PtyDescription" class="form-control" id="PtyDescription"
                                                        placeholder="Description de produit"></textarea>
                                                </div>
                                            </div>
                                            <div class="modal-body center forview">
                                                <button type="button" class="btn btn-success" onclick="changeViewMode('modify')">
                                                    Modifier</button>
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
                <div class="row forupdate forview">
                    <div class="col-md-12">
                        <div class="box border blue">
                            <div class="box-title">
                                <h4>
                                    <i class="fa fa-bars"></i>Attribut Matrice</h4>
                            </div>
                            <div class="box-body">
                                <div class="modal-body center forcreate forupdate">
                                    <button type="button" class="btn btn-info" onclick="createUpdate_OneMatriceColumnClick();">
                                        Ajouter une colonne</button>
                                </div>
                                <div class="row" id="div_prop_matrix">
                                    <%--<div class="col-md-3">
                                        <!-- BOX-->
                                        <div class="box border blue">
                                            <div class="box-title" style="text-align: center">
                                                <h4>
                                                    <i class="fa fa-bars"></i><span id="prd_matrix_item_title">Block Buttons</span>
                                                </h4>
                                            </div>
                                            <div class="box-body center">
                                                <button class="btn btn-block btn-default" onclick="alert('test')">
                                                    <span id="prd_matrix_item_value">Value</span>
                                                </button>
                                                <button class="btn btn-block btn-default">
                                                    <span>Normal Well</span>
                                                </button>
                                                <button class="btn btn-block btn-default">
                                                    <span>6 minutes ago</span>
                                                </button>
                                                <button class="btn btn-block btn-default">
                                                    <span>Dec 18, 1978</span>
                                                </button>
                                                <button class="btn btn-block btn-default">
                                                    <span>Half Show</span>
                                                </button>
                                                <button class="btn btn-block btn-info">
                                                    <span>Ajouter</span>
                                                </button>
                                                <button class="btn btn-block btn-danger">
                                                    <span>Supprimer</span>
                                                </button>
                                            </div>
                                        </div>
                                        <!-- /BOX -->
                                    </div>--%>
                                    <%--<div class="col-md-3" id="div_one_prop_info_4dff655d-8781-4c39-a964-3bd35199b9f4">
                                        <div class="box border blue">
                                            <div class="box-title" style="text-align: center">
                                                <h4>
                                                    <span id="prd_matrix_item_title">TEMP/Coulor</span></h4>
                                            </div>
                                            <div class="box-body center" id="div_prop_items_content_4dff655d-8781-4c39-a964-3bd35199b9f4">
                                                <button class="btn btn-block btn-default" onclick="return add_one_Y_item(this,false)"
                                                    disabled="" propname="TEMP/Coulor" xid="4dff655d-8781-4c39-a964-3bd35199b9f4"
                                                    id="btn_add_one_Y_item_2aa7aefe-18be-40d3-a0b9-e635176e9ef3" des="">
                                                    <span>3000K</span></button>
                                                <button class="btn btn-block btn-default" onclick="return add_one_Y_item(this,false)"
                                                        disabled="" propname="TEMP/Coulor" xid="4dff655d-8781-4c39-a964-3bd35199b9f4"
                                                        id="btn_add_one_Y_item_362a6fd9-d765-428d-995d-9363682f3cb3" des="">
                                                        <span>4000K</span></button>
                                                <button class="btn btn-block btn-default" onclick="return add_one_Y_item(this,false)" disabled=""
                                                            propname="TEMP/Coulor" xid="4dff655d-8781-4c39-a964-3bd35199b9f4" id="btn_add_one_Y_item_2b69d9b2-931b-443f-9259-28a46cbe4f4f"
                                                            des="">
                                                            <span>6000K</span></button></div>--%>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="row">
                    <div class="col-md-12">
                        <div class="box border orange">
                            <div class="box-title">
                                <h4>
                                    <i class="fa fa-tasks"></i>Variables du produit</h4>
                            </div>
                            <div class="box-body">
                                <div class="modal-body center forupdate">
                                    <button type="button" class="btn btn-warning" onclick="addUpdateZValue();">
                                        Ajouter une variable</button>
                                </div>
                                <div class="form-horizontal" id="div_Z_content">
                                    <p class="btn-toolbar" id="p_Z_content">
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="row" style="display: none;">
                    <div class="col-md-12">
                        <div class="box border orange">
                            <div class="box-title">
                                <h4>
                                    <i class="fa fa-bars"></i>Attribut Matrice</h4>
                            </div>
                            <div class="box-body">
                                <div class="modal-body center forcreate forupdate">
                                    <button type="button" class="btn btn-primary" onclick="AddXAttribute();">
                                        Ajouter un dans X-axe</button>
                                    <button type="button" class="btn btn-warning" onclick="AddYAttribute();">
                                        Ajouter un dans Y-axe</button>
                                </div>
                                <div class="form-horizontal">
                                    <div class="form-group" id="div_title_X">
                                        <label class="col-sm-2 control-label att_label">
                                            Nom</label>
                                        <label class="col-sm-1 control-label att_label">
                                            Unité</label>
                                        <label class="col-sm-2 control-label att_label">
                                            F.Tch | Img | U.Dt | Ttr</label>
                                        <label class="col-sm-1 control-label att_label">
                                            Affichage Odr</label>
                                        <label class="col-sm-1 control-label att_label">
                                            ID</label>
                                        <label class="col-sm-1 control-label att_label">
                                            Parent ID</label>
                                        <label class="col-sm-1 control-label att_label">
                                            Type</label>
                                        <label class="col-sm-2 control-label att_label">
                                            Description</label>
                                        <label class="col-sm-1 control-label att_label forcreate forupdate">
                                        </label>
                                    </div>
                                </div>
                                <div class="form-horizontal" id="div_X_attributes">
                                </div>
                                <div class="form-horizontal" id="div_title_Y">
                                </div>
                                <div class="form-horizontal" id="div_Y_attributes">
                                </div>
                                <div class="modal-body center forcreate forupdate">
                                    <button type="button" class="btn btn-primary" onclick="AddXAttribute();">
                                        Ajouter un dans X-axe</button>
                                    <button type="button" class="btn btn-warning" onclick="AddYAttribute();">
                                        Ajouter un dans Y-axe</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="row">
                    <div class="col-md-12">
                        <div class="box border green">
                            <div class="box-title">
                                <h4>
                                    <i class="fa fa-bars"></i>Attributs génériques</h4>
                            </div>
                            <div class="box-body">
                                <div class="modal-body center forcreate forupdate">
                                    <button type="button" class="btn btn-success forupdate" onclick="AddOneAttribute();">
                                        Ajouter un attribut</button>
                                </div>
                                <div class="form-horizontal">
                                    <div class="form-group">
                                        <label class="col-sm-2 control-label att_label">
                                            Nom</label>
                                        <label class="col-sm-1 control-label att_label">
                                            Unité</label>
                                        <label class="col-sm-2 control-label att_label">
                                            F.Tch | Img | U.Dt | Ttr</label>
                                        <label class="col-sm-1 control-label att_label">
                                            Affichage Odr</label>
                                        <label class="col-sm-1 control-label att_label">
                                            ID</label>
                                        <label class="col-sm-1 control-label att_label">
                                            Parent ID</label>
                                        <label class="col-sm-1 control-label att_label">
                                            Type</label>
                                        <label class="col-sm-2 control-label att_label">
                                            Description</label>
                                        <label class="col-sm-1 control-label att_label">
                                        </label>
                                    </div>
                                </div>
                                <div class="form-horizontal" id="div_attributes">
                                    <%--<div class="form-group" id="div_one_attribute_zzz_">
                                        <div class="col-sm-2">
                                            <input type="text" class="form-control" id="PropName_zzz_" name="PropName_zzz_" placeholder="Nom"
                                                title="Nom d'attribute" maxlength="200">
                                        </div>
                                        <div class="col-sm-2">
                                            <input type="text" class="form-control" id="PropUnit_zzz_" name="PropUnit_zzz_" placeholder="Unité"
                                                maxlength="200">
                                        </div>
                                        <div class="col-sm-2">
                                            <input type="text" class="form-control" id="PropOrder_zzz_" name="PropOrder_zzz_" placeholder="Ordre"
                                                maxlength="200">
                                        </div>
                                        <div class="col-sm-2">
                                            <input type="text" class="form-control" id="PropParentOrder_zzz_" name="PropParentOrder_zzz_"
                                                placeholder="Parent ordre" maxlength="200">
                                        </div>
                                        <div class="col-sm-1">
                                            <select class="form-control" id="PropType_zzz_" name="PropType_zzz_">
                                                <option value="1">String</option>
                                                <option value="2">Int</option>
                                                <option value="3">Decimal</option>
                                                <option value="4">DateTime</option>
                                                <option value="5">Boolean</option>
                                            </select>
                                        </div>
                                        <div class="col-sm-2">
                                            <input type="text" class="form-control" id="PropDescription_zzz_" name="PropDescription_zzz_"
                                                placeholder="Description" maxlength="200">
                                        </div>
                                        <div class="col-sm-1">
                                            <span class="btn btn-danger" id="btn_attr_delete_zzz_"><i class="fa fa-times"></i></span>
                                        </div>
                                    </div>--%>
                                </div>
                                <div class="modal-body center forcreate forupdate">
                                    <button type="button" class="btn btn-success" onclick="AddOneAttribute();">
                                        Ajouter un attribut</button>
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
                        <button type="submit" class="btn btn-success" onclick="js_create_update_attr()">
                            Créer</button>
                    </div>
                    <div class="modal-body center forupdate">
                        <button type="button" class="btn btn-default" onclick="changeViewMode('view')">
                            Annuler</button>
                        <button type="submit" class="btn btn-success" onclick="js_create_update_attr()">
                            Mettre à jour</button>
                    </div>
                    <div class="modal-body center forview">
                        <button type="button" class="btn btn-danger" onclick="delete_pty_click_confirm(this)">
                            Supprimer</button>
                        <button type="button" class="btn btn-success" onclick="changeViewMode('modify')">
                            Modifier</button>
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
