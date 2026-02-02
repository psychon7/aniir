<%@ Page Title="" Language="C#" MasterPageFile="~/Site.Master" AutoEventWireup="true"
    CodeBehind="SearchConsignee.aspx.cs" Inherits="ERP.Web.Views.Consignee.SearchConsignee" %>

<%@ Import Namespace="System.Web.Configuration" %>
<asp:Content ID="Content1" ContentPlaceHolderID="HeadContent" runat="server">
    <title>Recherche destinataire</title>
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
    <script src="../../js/ERP/CommonJS.js" type="text/javascript"></script>
    <script src="../../js/ERP/ERPBaseJS.js" type="text/javascript"></script>
    <script src="../../js/ERP/Consignee/Consignee.js?V=<%= WebConfigurationManager.AppSettings["jsVersion"] %>"
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
                                <li><i class="fa fa-home"></i><a href="../../Default.aspx">Home</a> </li>
                                <li><a href="#">Rechercher destinataire 查找收件人</a> </li>
                            </ul>
                            <!-- /BREADCRUMBS -->
                            <div class="clearfix">
                                <h3 class="content-title pull-left">
                                    Destinataire 收件人</h3>
                            </div>
                            <div class="description">
                                Rechercher</div>
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
                                    <div class="box-body">
                                        <div class="form-horizontal">
                                            <div class="form-group">
                                                <label class="col-sm-1 control-label">
                                                    Raison sociale 公司名</label>
                                                <div class="col-sm-2">
                                                    <input class="form-control searchcriteria" id="ScConCompanyname" name="ScConCompanyname"
                                                        type="text" placeholder="Raison sociale 公司名" maxlength="200">
                                                </div>
                                                <label class="col-sm-1 control-label">
                                                    Prénom/Nom 姓名</label>
                                                <div class="col-sm-2">
                                                    <input class="form-control searchcriteria" id="ScFirstname" name="ScFirstname" type="text"
                                                        placeholder="Prénom/nom 姓名" maxlength="200">
                                                </div>
                                                <label class="col-sm-1 control-label">
                                                    Commentaire 备注</label>
                                                <div class="col-sm-2">
                                                    <input type="text" class="form-control searchcriteria" id="ScComment" name="ScComment"
                                                        placeholder="Commentaire 备注" />
                                                </div>
                                                <label class="col-sm-1 control-label">
                                                    Email</label>
                                                <div class="col-sm-2">
                                                    <div class="input-group">
                                                        <span class="input-group-addon">@</span>
                                                        <input type="email" id="ScEmail" name="ScEmail" class="form-control searchcriteria" placeholder="Email"
                                                            maxlength="100">
                                                    </div>
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <label class="col-sm-1 control-label">
                                                    Code postal 邮编</label>
                                                <div class="col-sm-2">
                                                    <input class="form-control searchcriteria" id="ScPostcode" name="ScPostcode" type="text"
                                                        placeholder="Code postal 邮编" maxlength="10">
                                                </div>
                                                <label class="col-sm-1 control-label">
                                                    Adresse 地址</label>
                                                <div class="col-sm-2">
                                                    <input type="text" class="form-control searchcriteria" id="ScAddress" name="ScAddress"
                                                        placeholder="Adresse 地址" />
                                                </div>
                                                <label class="col-sm-1 control-label">
                                                    Ville 城市</label>
                                                <div class="col-sm-2">
                                                    <input type="text" class="form-control searchcriteria" id="ScCity" name="ScCity" placeholder="Ville 城市" />
                                                </div>
                                                <label class="col-sm-1 control-label">
                                                    Téléphone/Mobile 电话/手机</label>
                                                <div class="col-sm-2">
                                                    <div class="input-group">
                                                        <span class="input-group-addon"><i class="fa fa-phone"></i></span>
                                                        <input type="text" class="form-control searchcriteria" id="ScTel1" name="ScTel1" data-mask=""
                                                            maxlength="20" placeholder="Téléphone/Mobile 电话/手机">
                                                    </div>
                                                </div>
                                            </div>
                                            <div class="modal-footer center">
                                                <button type="button" id="btn_search" class="btn btn-inverse start" onclick="return jsSearchConsignee()">
                                                    Rechercher 查找</button>
                                                <button type="button" class="btn btn-inverse" onclick="CreateConsignee()">
                                                    Créer 新建</button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="separator">
                        </div>
                        <div class="row searchresult" id="div_client_result">
                            <div class="col-md-12">
                                <!-- BOX -->
                                <div class="box border inverse">
                                    <div class="box-title">
                                        <h4>
                                            <i class="fa fa-table"></i>Résultat</h4>
                                        <span style="float: right" id="rst_cons"></span>
                                    </div>
                                    <div class="box-body" id="div_cons" style="width: 100%; overflow-x: auto;">
                                        <table id="dt_cons" cellpadding="0" cellspacing="0" border="0" class="datatable table table-striped table-bordered table-hover">
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
