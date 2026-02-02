<%@ Page Title="" Language="C#" MasterPageFile="~/Site.Master" AutoEventWireup="true"
    CodeBehind="SupplierOrderSup.aspx.cs" Inherits="ERP.Web.Views.SupplierOrder.SupplierOrderSup" %>

<%@ Import Namespace="System.Web.Configuration" %>
<asp:Content ID="Content1" ContentPlaceHolderID="HeadContent" runat="server">
    <title>ERP - Commande Fournisseur</title>
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
        .labelleft
        {
            text-align: left !important;
        }
    </style>
</asp:Content>
<asp:Content ID="Content2" ContentPlaceHolderID="MainContent" runat="server">
    <script>
        jQuery(document).ready(function () {
            App.setPage("index");  //Set current page
            App.init(); //Initialise plugins and elements
        });

        var SodCinCoef = 1.2;
        function getSodCinCoef() {
            SodCinCoef ="<%= System.Configuration.ConfigurationSettings.AppSettings["CoefSodCin"] %>";
        }
    </script>
    <script src="../../js/ERP/ERPBaseJSSup.js?V=<%= WebConfigurationManager.AppSettings["jsVersion"] %>"
        type="text/javascript"></script>
    <script src="../../js/ERP/CommonJS.js?V=<%= WebConfigurationManager.AppSettings["jsVersion"] %>"
        type="text/javascript"></script>
    <%--<script src="../../js/ERP/SupplierOrder/SupplierOrder.js?V=<%= WebConfigurationManager.AppSettings["jsVersion"] %>"
        type="text/javascript"></script>--%>
    <script src="../../js/ERP/SupplierOrder/SupplierOrderSup.js?V=<%= WebConfigurationManager.AppSettings["jsVersion"] %>"
        type="text/javascript"></script>
    <style>
        .att_label
        {
            text-align: center !important;
        }
        .label_left
        {
            text-align: left !important;
        }
        .label_right
        {
            text-align: right !important;
        }
        .ui-autocomplete
        {
            z-index: 99999 !important;
        }
        th
        {
            text-align: center !important;
            vertical-align: middle !important;
        }
        td
        {
            vertical-align: middle !important;
        }
        .subTotal
        {
            background-color: #EAEBFF !important;
        }
        .total
        {
            background-color: #D3D6FF !important;
        }
        .smallText
        {
            font-size: 11px !important;
            vertical-align: middle !important;
            text-align: center !important;
        }
        .smallTextVt
        {
            font-size: 11px !important;
            vertical-align: middle !important;
        }
        body
        {
            font-size: 12px !important;
        }
    </style>
    <label style="display: none;" id="hf_prd_id">
    </label>
    <label style="display: none;" id="hf_pit_id">
    </label>
    <div class="container">
        <div class="row">
            <div id="content" class="col-lg-12">
                <div class="row">
                    <div class="col-md-12">
                        <div class="page-header">
                            <!-- STYLER -->
                            <!-- /STYLER -->
                            <!-- BREADCRUMBS -->
                            <ul class="breadcrumb">
                                <li><i class="fa fa-home"></i><a href="../../Default.aspx">&nbsp;Home</a> </li>
                                <li><a href="SearchSupplierOrder.aspx">&nbsp;Rechercher une Commande Fournisseur</a>
                                </li>
                                <li class="a_pointer" id="li_pin" style="display: none;"><a onclick="goPin()">&nbsp;Intention
                                    d'achat</a></li>
                                <li>&nbsp;Commande Fournisseur</li>
                                <li class="a_pointer" id="li_sin" style="display: none;"><a onclick="goSin()">&nbsp;Facture
                                    fournisseur (PI)</a></li>
                            </ul>
                            <!-- /BREADCRUMBS -->
                            <div class="clearfix">
                                <h3 class="content-title pull-left">
                                    &nbsp;Commande Fournisseur</h3>
                            </div>
                            <div class="description">
                                Création, modification, consultation une Commande Fournisseur</div>
                        </div>
                    </div>
                </div>
                <div class="row">
                    <div class="col-md-12">
                        <div class="row">
                            <div class="col-md-3" id="sod_generalinfo">
                                <div class="box border inverse">
                                    <div class="box-title">
                                        <h4>
                                            <i class="fa fa-bars"></i>Information général 一般信息</h4>
                                    </div>
                                    <div class="box-body">
                                        <div class="form-horizontal">
                                            <div class="form-group">
                                                <label class="col-sm-4 control-label labelleft fieldRequired" id="lb_supplier" pgid="Supplier.aspx"
                                                    prms="supId" flid="Supplier" onclick="return ExternLinkClick(this)" etid="SupFId">
                                                    Fournisseur 供货商</label>
                                                <div class="col-sm-8">
                                                    <select id="SupId" class="form-control" onchange="SupplierChanged(this)" style="display: none;">
                                                    </select>
                                                    <input class='form-control' id='SupList' name='SupList' required="" />
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <label class="col-sm-4 control-label labelleft fieldRequired">
                                                    Nom de la Commande 订单名称</label>
                                                <div class="col-sm-8">
                                                    <input class="form-control" id="SodName" name="SodName" required />
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <label class="col-sm-4 control-label labelleft fieldRequired">
                                                    Code de la Commande 订单编号</label>
                                                <div class="col-sm-8">
                                                    <input type="text" class="form-control" id="SodCode" name="SodCode" disabled="" />
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <label class="col-sm-4 control-label labelleft">
                                                    Fini? (Si fini, il ne s'affichi plus dans les pages détail)<br />
                                                    完成? (如已完成，将不再所有详情页面显示)</label>
                                                <div class="col-sm-8">
                                                    <input type="checkbox" class="form-control" id="SodFinish" name="SodFinish" />
                                                </div>
                                            </div>
                                         <div class="form-group">
                                                <label class="col-sm-4 control-label labelleft">
                                                    DEVISE 货币</label>
                                                <div class="col-sm-8">
                                                    <select class="form-control" id="CurId" name="CurId">
                                                    </select>
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <label class="col-sm-4 control-label labelleft">
                                                    TVA 增值税</label>
                                                <div class="col-sm-8">
                                                    <select class="form-control" id="VatId" name="VatId">
                                                    </select>
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <label class="col-sm-4 control-label labelleft">
                                                    N°CF de Fournisseur/供货商订单号</label>
                                                <div class="col-sm-8">
                                                    <input type="text" class="form-control" id="SodSupNbr" name="SodSupNbr" />
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <label class="col-sm-4 control-label labelleft">
                                                    Commentaire pour fournisseur 给供货商备注</label>
                                                <div class="col-sm-8">
                                                    <textarea class="form-control" cols="3" rows="4" id="SupplierComment" name="SupplierComment"></textarea>
                                                </div>
                                            </div>
                                            <div class="form-group forview forcreate">
                                                <label class="col-sm-4 control-label labelleft ">
                                                    Date de création 创建日期</label>
                                                <div class="col-sm-8">
                                                    <div class="input-group">
                                                        <input class="form-control datepicker" id="DateCreation" name="DateCreation" required=""
                                                            disabled="" /><span class="input-group-addon"><i class="fa fa-calendar"></i></span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div class="form-group forview">
                                                <label class="col-sm-4 control-label labelleft ">
                                                    Date de mis à jours 更新日期</label>
                                                <div class="col-sm-8 forview">
                                                    <div class="input-group">
                                                        <input class="form-control " id="DateUpdate" name="DateUpdate" disabled="" /><span
                                                            class="input-group-addon"><i class="fa fa-calendar"></i></span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div class="form-group forview">
                                                <label class="col-sm-4 control-label labelleft ">
                                                    Créateur 创建者</label>
                                                <div class="col-sm-8">
                                                    <input class="form-control" id="CreatorName" name="CreatorName" />
                                                </div>
                                            </div>
                                            <div class="form-group forview">
                                                <label class="col-sm-4 control-label labelleft ">
                                                    Prix Total H.T. 未税总价</label>
                                                <div class="col-sm-8">
                                                    <input class="form-control" id="TotalPriceHT" name="TotalPriceHT" disabled="" />
                                                </div>
                                            </div>
                                            <div class="form-group forview">
                                                <label class="col-sm-4 control-label labelleft ">
                                                    Prix Total T.T.C. 含税总价</label>
                                                <div class="col-sm-8">
                                                    <input class="form-control" id="TotalPriceTTC" name="TotalPriceTTC" disabled="" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="col-md-3" id="div_delivery_address">
                                <div class="box border inverse">
                                    <div class="box-title">
                                        <h4>
                                            <i class="fa fa-globe"></i>Contact fournisseur 供货商联系人</h4>
                                    </div>
                                    <div class="box-body">
                                        <div class="form-horizontal">
                                            <div class="form-group forview" id="div_btns">
                                                <div class="col-sm-12">
                                                    <div class="modal-body center">
                                                        <button type="button" class="btn btn-inverse" id="btn_generate_pdf_sup" style="display: none;"
                                                            onclick="return downloadPdfSup(this)" title="Sans prix/无价格">
                                                            Supplier PDF 供货商PDF</button>
                                                    </div>
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <label class="col-sm-4 control-label labelleft">
                                                    Contact fournisseur 供货商联系人</label>
                                                <div class="col-sm-8">
                                                    <select class="form-control" id="ScoId" name="ScoId" onchange="scoChange(this)" required="">
                                                    </select>
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <label class="col-sm-4 control-label labelleft">
                                                    Référence 编号</label>
                                                <div class="col-sm-8">
                                                    <input class="form-control" id="ScoRef" name="ScoRef" type="text" disabled="" />
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <label class="col-sm-4 control-label labelleft">
                                                    Prénom 名</label>
                                                <div class="col-sm-8">
                                                    <input type="text" class="form-control" id="ScoFirstname" name="ScoFirstname" disabled="" />
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <label class="col-sm-4 control-label labelleft">
                                                    Nom de famille 姓</label>
                                                <div class="col-sm-8">
                                                    <input type="text" class="form-control" id="ScoLastname" name="ScoLastname" disabled=""
                                                        maxlength="200">
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <label class="col-sm-4 control-label labelleft">
                                                    Adresse 1 地址1</label>
                                                <div class="col-sm-8">
                                                    <input type="text" class="form-control" id="ScoAddress1" name="ScoAddress1" disabled=""
                                                        maxlength="200">
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <label class="col-sm-4 control-label labelleft">
                                                    Adresse 2 地址2</label>
                                                <div class="col-sm-8">
                                                    <input type="text" class="form-control" id="ScoAddress2" name="ScoAddress2" disabled=""
                                                        maxlength="200">
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <label class="col-sm-4 control-label labelleft">
                                                    Code postal 邮编</label>
                                                <div class="col-sm-8">
                                                    <input type="text" class="form-control" id="ScoPostcode" name="ScoPostcode" disabled=""
                                                        maxlength="10">
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <label class="col-sm-4 control-label labelleft">
                                                    Ville 城市</label>
                                                <div class="col-sm-8">
                                                    <input type="text" class="form-control" id="ScoCity" maxlength="200" disabled="">
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <label class="col-sm-4 control-label labelleft">
                                                    Pays 国家</label>
                                                <div class="col-sm-8">
                                                    <input type="text" class="form-control" id="ScoCountry" name="ScoCountry" disabled=""
                                                        maxlength="200">
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <label class="col-sm-4 control-label labelleft">
                                                    Tél 电话</label>
                                                <div class="col-sm-8">
                                                    <input type="text" class="form-control" id="ScoTel1" name="ScoTel1" disabled="" maxlength="30">
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <label class="col-sm-4 control-label labelleft">
                                                    Fax 传真</label>
                                                <div class="col-sm-8">
                                                    <input type="text" class="form-control" id="ScoFax" name="ScoFax" disabled="" maxlength="30">
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <label class="col-sm-4 control-label labelleft">
                                                    Portable 手机</label>
                                                <div class="col-sm-8">
                                                    <input type="text" class="form-control" id="ScoCellphone" name="ScoCellphone" disabled=""
                                                        maxlength="30">
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <label class="col-sm-4 control-label labelleft">
                                                    Email</label>
                                                <div class="col-sm-8">
                                                    <input type="text" class="form-control" id="ScoEmail" name="ScoEmail" disabled="" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="col-md-2 forview" id="div_sod_payement">
                                <div class="box border inverse">
                                    <div class="box-title">
                                        <h4>
                                            <i class="fa fa-money"></i>Paiemt. 支付记录</h4>
                                    </div>
                                    <div class="box-body">
                                        <div class="form-horizontal">
                                            
                                            <div class="form-group">
                                                <label class="col-sm-7 control-label labelleft">
                                                    Montant HT Total 未税总价</label>
                                                <label class="col-sm-5 control-label labelright" id="Sod_TotalAmountHt">
                                                </label>
                                            </div>
                                            <div class="form-group">
                                                <label class="col-sm-7 control-label labelleft">
                                                    Montant TTC Total 含税总价</label>
                                                <label class="col-sm-5 control-label labelright" id="Sod_Amount">
                                                </label>
                                            </div>
                                            <div class="form-group">
                                                <label class="col-sm-7 control-label labelleft">
                                                    Déjà payé HT 未税已付</label>
                                                <label class="col-sm-5 control-label labelright" style="color: green;" id="Sod_Paid">
                                                </label>
                                            </div>
                                            <div class="form-group">
                                                <label class="col-sm-7 control-label labelleft">
                                                    Reste à payer HT 未税未付</label>
                                                <label class="col-sm-5 control-label labelright" style="color: red;" id="Sod_LeftToPayer">
                                                </label>
                                            </div>
                                        </div>
                                        <div class="form-horizontal" id="sod_payment_records" style="max-height: 642px; overflow-y: auto;">
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="col-md-2 forview" id="div_sod_doc">
                                <div class="box border inverse">
                                    <div class="box-title">
                                        <h4>
                                            <i class="fa fa-book"></i>Docs 文件 PDF</h4>
                                    </div>
                                    <div class="box-body">
                                        <div class="form-horizontal" id="sod_docs" style="max-height: 642px; overflow-y: auto;">
                                        </div>
                                    </div>
                                </div>
                            </div>
                             <div class="col-md-2 forview" id="div1">
                                <div class="box border inverse">
                                    <div class="box-title">
                                        <h4>
                                            <i class="fa fa-book"></i>Comment 备注</h4>
                                    </div>
                                    <div class="box-body">
                                        <div class="form-horizontal" id="sod_cmt" style="max-height: 642px; overflow-y: auto;">
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
                                            <i class="fa fa-bars"></i>Les lignes de commande 订单详情&nbsp;
                                        </h4>
                                    </div>
                                    <div class="box-body">
                                        <div class="form-horizontal center" style="width: 100%; overflow-x: auto;">
                                            <table cellpadding="0" cellspacing="0" border="0" class="table table-striped table-bordered table-hover">
                                                <thead>
                                                    <tr role="row">
                                                        <th rowspan="1" colspan="1">
                                                            Ordre<br />
                                                            序号
                                                        </th>
                                                        <th rowspan="1" colspan="1">
                                                            Client<br />
                                                            客户
                                                        </th>
                                                        <%--<th rowspan="1" colspan="1">
                                                            Deadline 最后期限
                                                        </th>--%>
                                                        <th rowspan="1" colspan="1">
                                                            Produit<br />
                                                            产品
                                                        </th>
                                                        <th rowspan="1" colspan="1">
                                                            Référence<br />
                                                            编号
                                                        </th>
                                                        <th rowspan="1" colspan="1">
                                                            Leur Réf<br />
                                                            供货商编号
                                                        </th>
                                                        <th rowspan="1" colspan="1">
                                                            Description<br />
                                                            描述
                                                        </th>
                                                        <th rowspan="1" colspan="1">
                                                            Les détails<br />
                                                            详情
                                                        </th>
                                                        <th rowspan="1" colspan="1">
                                                            Image<br />
                                                            图片
                                                        </th>
                                                        <th rowspan="1" colspan="1">
                                                            Quantité<br />
                                                            数量
                                                        </th>
                                                        <th rowspan="1" colspan="1">
                                                            Envoyé/stocké<br />
                                                            已发货/已入库
                                                        </th>
                                                        <th rowspan="1" colspan="1">
                                                            Prix d'achat<br />
                                                            采购价
                                                        </th>
                                                        <th rowspan="1" colspan="1">
                                                            Prix remisé<br />
                                                            折后价
                                                        </th>
                                                        <th rowspan="1" colspan="1">
                                                            Total H.T<br />
                                                            未税总价
                                                        </th>
                                                        <th rowspan="1" colspan="1">
                                                            T.V.A.<br />
                                                            税额
                                                        </th>
                                                        <th rowspan="1" colspan="1">
                                                            Total T.T.C<br />
                                                            含税总价
                                                        </th>
                                                        <th rowspan="1" colspan="1">
                                                            Transport<br />
                                                            物流
                                                        </th>
                                                        <th rowspan="1" colspan="1" class="thBtns">
                                                        </th>
                                                    </tr>
                                                </thead>
                                                <tbody id="tbody_lines" style="text-align: center !important">
                                                </tbody>
                                            </table>
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
                            <div class="col-md-12" id="div_pdf">
                                <div class="box border inverse">
                                    <div class="box-title">
                                        <h4>
                                            <i class="fa fa-globe"></i>Fichier de commande 订单文件</h4>
                                        <div class="tools">
                                            <a href="javascript:;" class="collapse" id="a_collapse"><i class="fa fa-chevron-up">
                                            </i></a>
                                        </div>
                                    </div>
                                    <div class="box-body">
                                        <div class="form-horizontal">
                                            <div class="form-group">
                                                <div class="col-sm-12">
                                                    <iframe height="1000" width="100%" id="iframepdf"></iframe>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <!--- Cost Plan Lines -->
                <!--- /Cost Plan Lines -->
                <div class="footer-tools">
                    <span class="go-top"><i class="fa fa-chevron-up"></i>Top </span>
                </div>
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
    <!--
    DATE PICKER -->
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
