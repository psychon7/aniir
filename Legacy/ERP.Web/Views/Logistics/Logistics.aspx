<%@ Page Title="" Language="C#" MasterPageFile="~/Site.Master" AutoEventWireup="true"
    CodeBehind="Logistics.aspx.cs" Inherits="ERP.Web.Views.Logistics.Logistics" %>

<%@ Import Namespace="System.Web.Configuration" %>
<asp:Content ID="Content1" ContentPlaceHolderID="HeadContent" runat="server">
    <title>ERP - Logistics</title>
    <!-- JQUERY UI DATE PICKER -->
    <link rel="stylesheet" type="text/css" href="../../js/jquery-ui-1.10.3.custom/css/custom-theme/jquery-ui-1.10.3.custom.min.css" />
    <!-- End JQUERY UI DATE PICKER -->
    <!-- DATA TABLES -->
    <link rel="stylesheet" type="text/css" href="../../js/datatables/media/assets/css/datatables.min.css" />
    <link rel="stylesheet" type="text/css" href="../../js/datatables/extras/TableTools/media/css/TableTools.min.css" />
    <link rel="stylesheet" type="text/css" href="../../js/datatables/media/css/jquery.dataTables.min.css" />
    <link href="../../css/site.css" rel="stylesheet" type="text/css" />
    <!-- FILE UPLOAD -->
    <link href="../../js/jquery-upload/css/jquery.fileupload.css" rel="stylesheet" type="text/css">
    <!-- COLORBOX -->
    <link rel="stylesheet" type="text/css" href="../../js/colorbox/colorbox.min.css" />
    <style>
        .ui-autocomplete
        {
            z-index: 9999 !important;
        }
        .labelleft
        {
            text-align: left !important;
            font-weight: 300 !important;
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
    <%--<script src="../../js/ERP/Logistics/Logistics.js?V=<%= WebConfigurationManager.AppSettings["jsVersion"] %>"
        type="text/javascript"></script>--%>
    <script src="../../js/ERP/Logistics/Logistics.js?V=<%= WebConfigurationManager.AppSettings["jsVersion"] %>"
        type="text/javascript"></script>
    <script src="../../js/ERP/Consignee/Consignee.js?V=<%= WebConfigurationManager.AppSettings["jsVersion"] %>"
        type="text/javascript"></script>
    <div class="container">
        <div class="row">
            <div id="content" class="col-lg-12">
                <div class="row">
                    <div class="col-sm-12">
                        <div class="page-header">
                            <!-- STYLER -->
                            <!-- /STYLER -->
                            <!-- BREADCRUMBS -->
                            <ul class="breadcrumb">
                                <li><i class="fa fa-home"></i><a href="../../Default.aspx">&nbsp;Home</a> </li>
                                <li><a href="SearchLogistics.aspx">&nbsp;Rechercher un Container</a> </li>
                                <li>&nbsp;Logistics</li>
                            </ul>
                            <!-- /BREADCRUMBS -->
                            <div class="clearfix">
                                <h3 class="content-title pull-left">
                                    &nbsp;Container</h3>
                            </div>
                            <div class="description">
                                Création, modification, consultation un Container</div>
                        </div>
                    </div>
                </div>
                <div class="row">
                    <div class="col-md-7" id="div_general_info">
                        <div class="row">
                            <div class="col-md-12">
                                <div class="box border inverse">
                                    <div class="box-title">
                                        <h4>
                                            <i class="fa fa-bars"></i>Information général 一般信息</h4>
                                    </div>
                                    <div class="box-body">
                                        <div class="form-horizontal">
                                            <div class="form-group">
                                                <div class="col-md-12 center">
                                                    <div class="modal-body center forupdate">
                                                        <button type="button" class="btn btn-default" onclick="changeViewMode('view')">
                                                            Annuler 取消</button>
                                                        <button type="button" class="btn btn-inverse" onclick="return js_create_update_lgs()">
                                                            Mettre à jour 更新</button>
                                                    </div>
                                                    <div class="modal-body center forview">
                                                        <button type="button" class="btn btn-inverse modify_right" onclick="changeViewMode('modify')">
                                                            Modifier 修改</button>
                                                        <button type="button" class="btn btn-inverse delete_right" id="btn_delete_lgs" onclick="return deleteLgsConfirme(this)">
                                                            Supprimer 删除</button>
                                                        <button type="button" class="btn btn-inverse" id="btn_generate_pdf" style="display: none;"
                                                            onclick="return downloadPdf(this)">
                                                            Générer expédition PDF</button>
                                                        <button type="button" class="btn btn-inverse" id="btn_generate_file_pdf" style="display: none;"
                                                            onclick="return downloadFilePdf(this)">
                                                            Générer PI PDF</button>
                                                        <button type="button" class="btn btn-inverse" id="btn_send_container" style="display: none;"
                                                            onclick="return SendContainerClick()">
                                                            Container Expédié 发货</button>
                                                        <button type="button" class="btn btn-inverse" id="btn_receiveContainer" style="display: none;"
                                                            onclick="return receiveContainer()">
                                                            Recevoir & Entrepôt 收货及入库</button>
                                                        <button type="button" class="btn btn-inverse pop-hover" id="btn_asso_sod" style="display: none;"
                                                            data-title="Description 说明" data-content="Associer la commande fournisseur 关联该物流对应的账单"
                                                            onclick="return showSodForAssociation()">
                                                            Associer CF 关联物流账单</button>
                                                        <button type="button" class="btn btn-inverse pop-hover" id="btn_view_sod" style="display: none;"
                                                            data-title="Description 说明" data-content="Consulter la commande fournisseur associée 查看关联账单"
                                                            sodid="" onclick="return viewSodClick(this)">
                                                        </button>
                                                        <button type="button" class="btn btn-inverse pop-hover" id="btn_remove_asso_sod"
                                                            style="display: none;" data-title="Description 说明" data-content="Enlever la commande fournisseur associée 取消关联账单"
                                                            onclick="return RemoveAssSod()">
                                                            Enlever CF 取消关联账单</button>
                                                    </div>
                                                    <div class="modal-body center forcreate">
                                                        <button type="button" class="btn btn-inverse" onclick="return js_create_update_lgs()">
                                                            Créer 新建</button></div>
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <label class="col-sm-2 control-label fieldRequired" id="lb_supplier" pgid="Supplier.aspx"
                                                    prms="supId" flid="Supplier" onclick="return ExternLinkClick(this)" etid="SupFId">
                                                    Transporteur 承运商</label>
                                                <div class="col-sm-4">
                                                    <select class="form-control" id="SupId" required="">
                                                    </select>
                                                </div>
                                                <label class="col-sm-2 control-label fieldRequired">
                                                    Nom de logistics 物流名称</label>
                                                <div class="col-sm-4">
                                                    <input class="form-control" id="LgsName" required="" />
                                                </div>
                                            </div>
                                            <div class="form-group forview">
                                                <label class="col-sm-2 control-label">
                                                    Code de container 物流编号</label>
                                                <div class="col-sm-4">
                                                    <input type="text" class="form-control" id="LgsCode" name="LgsCode" />
                                                </div>
                                                <div class="col-sm-6">
                                                </div>
                                            </div>
                                            <div class="form-group forview">
                                                <label class="col-sm-2 control-label">
                                                    Déjà expédié ? 已发货？</label>
                                                <div class="col-sm-4">
                                                    <input type="checkbox" class="form-control" id="LgsIsSent" name="LgsIsSent" onclick="IsSentClick(this)" />
                                                </div>
                                                <label class="col-sm-2 control-label">
                                                    Date d'expédié 发货日期</label>
                                                <div class="col-sm-4">
                                                    <div class="input-group">
                                                        <input type="text" class="form-control datepicker" id="_LgsDateSend" name="_LgsDateSend" /><span
                                                            class="input-group-addon"><i class="fa fa-calendar"></i></span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div class="form-group forview forupdate">
                                                <label class="col-sm-2 control-label">
                                                    Date d'arrive prévu 预到达日期</label>
                                                <div class="col-sm-4">
                                                    <div class="input-group">
                                                        <input type="text" class="form-control datepicker" id="_LgsDateArrivePre" name="_LgsDateArrivePre" /><span
                                                            class="input-group-addon"><i class="fa fa-calendar"></i></span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div class="form-group forview">
                                                <label class="col-sm-2 control-label">
                                                    Déjà reçu? 已收到？</label>
                                                <div class="col-sm-4">
                                                    <input type="checkbox" class="form-control" id="LgsIsReceived" name="LgsIsReceived" />
                                                </div>
                                                <label class="col-sm-2 control-label">
                                                    Date de reçu 收货日期</label>
                                                <div class="col-sm-4">
                                                    <div class="input-group">
                                                        <input type="text" class="form-control datepicker" id="_LgsDateArrive" name="_LgsDateArrive" /><span
                                                            class="input-group-addon"><i class="fa fa-calendar"></i></span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <label class="col-sm-2 control-label">
                                                    Numéro de Tracking 物流单号</label>
                                                <div class="col-sm-4">
                                                    <input type="text" class="form-control" id="LgsTrackingNumber" name="LgsTrackingNumber" />
                                                </div>
                                                <label class="col-sm-2 control-label">
                                                    Commentaire 备注</label>
                                                <div class="col-sm-4">
                                                    <textarea class="form-control" cols="3" rows="7" id="LgsComment" name="LgsComment"></textarea>
                                                </div>
                                            </div>
                                            <div class="form-group forview forcreate">
                                                <label class="col-sm-2 control-label">
                                                    Date de création 创建日期</label>
                                                <div class="col-sm-4">
                                                    <div class="input-group">
                                                        <input class="form-control datepicker " id="DateCreation" name="DateCreation" required="" /><span
                                                            class="input-group-addon"><i class="fa fa-calendar"></i></span>
                                                    </div>
                                                </div>
                                                <label class="col-sm-2 control-label forview">
                                                    Date de mis à jours 更新日期</label>
                                                <div class="col-sm-4 forview">
                                                    <div class="input-group">
                                                        <input class="form-control datepicker " id="DateUpdate" name="DateUpdate" /><span
                                                            class="input-group-addon"><i class="fa fa-calendar"></i></span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div class="form-group forview">
                                                <label class="col-sm-2 control-label ">
                                                    Créateur</label>
                                                <div class="col-sm-4">
                                                    <input class="form-control" id="CreatorName" name="CreatorName" />
                                                </div>
                                                <div class="col-sm-6 forview center">
                                                    <button type="button" class="btn btn-inverse" onclick="return addToContainer();"
                                                        id="btn_add_to_container">
                                                        Ajouter dans container</button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-5" id="div_consigne">
                        <div class="row">
                            <div class="col-md-12">
                                <div class="box border inverse">
                                    <div class="box-title">
                                        <h4>
                                            <i class="fa fa-bars"></i>Information de destinataire 收货人信息</h4>
                                    </div>
                                    <div class="box-body">
                                        <div class="form-horizontal">
                                            <div class="form-group">
                                                <div class="col-md-12 center forcreate forupdate">
                                                    <button type="button" class="btn btn-inverse" onclick="CreateConsignee()">
                                                        Créer un destinataire 新建收件人</button>
                                                </div>
                                            </div>
                                            <div class="form-group forcreate forupdate">
                                                <label class="col-sm-2 control-label fieldRequired">
                                                    Distinataire 收件人</label>
                                                <div class="col-sm-10">
                                                    <input class="form-control" id="LbConSearch" name="LbConSearch" type="text" required="">
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <label class="col-sm-2 control-label">
                                                    Raison sociale 公司名</label>
                                                <label class="col-sm-4 control-label labelleft" id="LbConCompanyname" name="LbConCompanyname">
                                                </label>
                                                <label class="col-sm-2 control-label">
                                                    Civilité 性别</label>
                                                <label class="col-sm-4 control-label labelleft" id="Civility" name="Civility">
                                                </label>
                                            </div>
                                            <div class="form-group">
                                                <label class="col-sm-2 control-label">
                                                    Titre 命名</label>
                                                <label class="col-sm-4 control-label labelleft" id="LbConAdresseTitle" name="LbConAdresseTitle">
                                                </label>
                                                <label class="col-sm-2 control-label">
                                                    Code 代码</label>
                                                <label class="col-sm-4 control-label labelleft" id="LbConCode" name="LbConCode">
                                                </label>
                                            </div>
                                            <div class="form-group">
                                                <label class="col-sm-2 control-label ">
                                                    Prénom 名</label>
                                                <label class="col-sm-4 control-label labelleft" id="LbConFirstname" name="LbConFirstname">
                                                </label>
                                                <label class="col-sm-2 control-label ">
                                                    Nom de famille 姓</label>
                                                <label class="col-sm-4 control-label labelleft" id="LbConLastname" name="LbConLastname">
                                                </label>
                                            </div>
                                            <div class="form-group">
                                                <label class="col-sm-2 control-label">
                                                    Adresse 1 地址1</label>
                                                <label class="col-sm-4 control-label labelleft" id="LbConAddress1" name="LbConAddress1">
                                                </label>
                                                <label class="col-sm-2 control-label">
                                                    Adresse 2 地址2</label>
                                                <label class="col-sm-4 control-label labelleft" id="LbConAddress2" name="LbConAddress2">
                                                </label>
                                            </div>
                                            <div class="form-group">
                                                <label class="col-sm-2 control-label">
                                                    Adresse 3 地址3</label>
                                                <label class="col-sm-4 control-label labelleft" id="LbConAddress3" name="LbConAddress3">
                                                </label>
                                                <label class="col-sm-2 control-label">
                                                    Code postal 邮编</label>
                                                <label class="col-sm-4 control-label labelleft" id="LbConPostcode" name="LbConPostcode">
                                                </label>
                                            </div>
                                            <div class="form-group">
                                                <label class="col-sm-2 control-label">
                                                    Ville 城市</label>
                                                <label class="col-sm-4 control-label labelleft" id="LbConCity" name="LbConCity">
                                                </label>
                                                <label class="col-sm-2 control-label">
                                                    Pays 国家</label>
                                                <label class="col-sm-4 control-label labelleft" id="LbConCountry" name="LbConCountry">
                                                </label>
                                            </div>
                                            <div class="form-group">
                                                <label class="col-sm-2 control-label">
                                                    Téléphone 1 电话1</label>
                                                <label class="col-sm-4 control-label labelleft" id="LbConTel1" name="LbConTel1">
                                                </label>
                                                <label class="col-sm-2 control-label">
                                                    Téléphone 2 电话2</label>
                                                <label class="col-sm-4 control-label labelleft" id="LbConTel2" name="LbConTel2">
                                                </label>
                                            </div>
                                            <div class="form-group">
                                                <label class="col-sm-2 control-label">
                                                    Fax</label>
                                                <label class="col-sm-4 control-label labelleft" id="LbConFax" name="LbConFax">
                                                </label>
                                                <label class="col-sm-2 control-label">
                                                    Portable 手机</label>
                                                <label class="col-sm-4 control-label labelleft" id="LbConCellphone" name="LbConCellphone">
                                                </label>
                                            </div>
                                            <div class="form-group">
                                                <label class="col-sm-2 control-label">
                                                    Email</label>
                                                <label class="col-sm-4 control-label labelleft" id="LbConEmail" name="LbConEmail">
                                                </label>
                                                <label class="col-sm-2 control-label">
                                                    Recevoir le Newsletter 推送Email</label>
                                                <div class="col-sm-4">
                                                    <div class="row">
                                                        <label class="col-sm-2 control-label labelleft" id="LbConRecieveNewsletter" name="LbConRecieveNewsletter">
                                                        </label>
                                                        <label class="col-sm-10 control-label labelleft" id="LbConNewsletterEmail" name="LbConNewsletterEmail">
                                                        </label>
                                                    </div>
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <label class="col-sm-2 control-label">
                                                    Adresse livraison 派送地址</label>
                                                <label class="col-sm-4 control-label labelleft" id="LbConIsDeliveryAdr" name="LbConIsDeliveryAdr">
                                                </label>
                                                <label class="col-sm-2 control-label">
                                                    Adresse facturation 开票地址</label>
                                                <label class="col-sm-4 control-label labelleft" id="LbConIsInvoicingAdr" name="LbConIsInvoicingAdr">
                                                </label>
                                            </div>
                                            <div class="form-group">
                                                <label class="col-md-2 control-label">
                                                    Commentaire 备注</label>
                                                <div class="col-md-10">
                                                    <textarea rows="3" cols="5" name="LbConComment" class="form-control" id="LbConComment"
                                                        disabled="disabled"></textarea></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-3 forview" id="div_lgs_files">
                        <div class="row">
                            <div class="col-md-12">
                                <div class="box border inverse">
                                    <div class="box-title">
                                        <h4>
                                            <i class="fa fa-book"></i>Docs 文件 PDF</h4>
                                    </div>
                                    <div class="box-body">
                                        <div class="form-horizontal">
                                            <div class="form-group">
                                                <div class="col-md-12 center">
                                                    <button type="button" class="btn btn-inverse" onclick="AddLgsDoc(this)" docid="0">
                                                        Ajouter 添加</button>
                                                    <button type="button" class="btn btn-inverse" id="btn_downloadall" onclick="return DownloadAllDocs(this)" style="display: none;">
                                                        Télécharger tous 下载全部</button>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="form-horizontal" id="div_docslist" style="max-height: 642px; overflow-y: auto;">
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-12">
                        <div class="row" id="lgs_all_lines" style="width: 100%; overflow-x: auto;">
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
    <script type="text/javascript" src="../../js/jQuery-BlockUI/jquery.blockUI.min.js"></script>
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
    <script>
        function getFileDataPopUp(myFile) {
            var file = myFile.files[0];
            var filename = file.name;
            if (filename) {
                $('#btnSubmitUploadFilePopUp').show();
                $('#btnCancelUploadFilePopUp').show();
                //$('#div_description_imagePopUp').show();
            } else {
                $('#btnSubmitUploadFilePopUp').hide();
                $('#btnCancelUploadFilePopUp').hide();
                //$('#div_description_imagePopUp').hide();
            }
            $('#uploadFileNamePopUp').text(filename);
            //alert(filename);
        }
        function hideUploadPopUp() {
            $('#btnSubmitUploadFilePopUp').hide();
            $('#btnCancelUploadFilePopUp').hide();
            //$('#div_description_imagePopUp').hide();
            $('#uploadFileNamePopUp').text('');
            return false;
        }
    </script>
</asp:Content>
