<%@ Page Title="" Language="C#" MasterPageFile="~/Site.Master" AutoEventWireup="true"
    CodeBehind="Category.aspx.cs" Inherits="ERP.Web.Views.Category.Category" %>
<%@ Import Namespace="System.Web.Configuration" %>

<asp:Content ID="Content1" ContentPlaceHolderID="HeadContent" runat="server">
    <title>ERP - Catégorie</title>
    <!-- JQUERY UI DATE PICKER -->
    <link rel="stylesheet" type="text/css" href="../../js/jquery-ui-1.10.3.custom/css/custom-theme/jquery-ui-1.10.3.custom.min.css" />
    <link href="../../css/site.css" rel="stylesheet" type="text/css" />
    <!-- FILE UPLOAD -->
    <link href="../../js/jquery-upload/css/jquery.fileupload.css" rel="stylesheet" type="text/css">
    <!-- COLORBOX -->
    <link rel="stylesheet" type="text/css" href="../../js/colorbox/colorbox.min.css" />
    <!-- END COLORBOX -->
    <!-- DATA TABLES -->
    <link rel="stylesheet" type="text/css" href="../../js/datatables/media/css/jquery.dataTables.min.css" />
    <link rel="stylesheet" type="text/css" href="../../js/datatables/media/assets/css/datatables.min.css" />
    <link rel="stylesheet" type="text/css" href="../../js/datatables/extras/TableTools/media/css/TableTools.min.css" />
    <style>
        .ui-autocomplete
        {
            z-index: 9999 !important;
        }
    </style>
    <link href="../../css/site.css" rel="stylesheet" type="text/css" />
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
    <script src="../../js/ERP/Category/Category.js?V=<%= WebConfigurationManager.AppSettings["jsVersion"] %>"
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
                                <li><i class="fa fa-home"></i><a href="../../Default.aspx">&nbsp;<span class="language_txt">Home</span></a> </li>
                                <li><a href="../../Views/Category/SearchCategory.aspx" class="language_txt">Rechercher une catégorie</a>
                                </li>
                                <li class="language_txt">Catégorie</li>
                            </ul>
                            <!-- /BREADCRUMBS -->
                            <div class="clearfix">
                                <h3 class="content-title pull-left language_txt">Catégorie</h3>
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
                        <div class="modal-body center forupdate">
                            <button type="button" class="btn btn-default language_txt" onclick="changeViewMode('view')">Annuler</button>
                            <button type="button" class="btn btn-inverse language_txt" onclick="return js_create_update_cat()">Mettre à jour</button>
                        </div>
                        <div class="modal-body center forview">
                            <button type="button" class="btn btn-inverse language_txt" onclick="return delete_cat_click_confirm(this)">Supprimer</button>
                            <button type="button" class="btn btn-inverse language_txt" onclick="changeViewMode('modify')">Modifier</button>
                        </div>
                    </div>
                </div>
                <div class="row">
                    <div class="col-md-12">
                        <div class="row">
                            <div class="col-md-9" id="div_cat_info">
                                <div class="box border inverse">
                                    <div class="box-title">
                                        <h4>
                                            <i class="fa fa-bars"></i><span class="language_txt">Information général</span></h4>
                                    </div>
                                    <div class="box-body">
                                        <div class="form-horizontal">
                                            <div class="form-group">
                                                <label class="col-sm-3 control-label language_txt">Parent catégorie</label>
                                                <div class="col-sm-9">
                                                    <select class="form-control" id="CatParentCatId" name="CatParentCatId">
                                                        <option value="0" class="language_txt">Sélectionner une catégorie ou laisser vide</option>
                                                    </select>
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <label class="col-sm-3 control-label fieldRequired language_txt">Nom de la catégorie</label>
                                                <div class="col-sm-9">
                                                    <input class="form-control" id="CatName" name="CatName" type="text" required="" maxlength="200" />
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <label class="col-sm-3 control-label language_txt">Sub Nom 1 de la catégorie</label>
                                                <div class="col-sm-9">
                                                    <input class="form-control" id="CatSubName1" name="CatSubName1" type="text" maxlength="200" />
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <label class="col-sm-3 control-label language_txt">Sub Nom 2 de la catégorie</label>
                                                <div class="col-sm-9">
                                                    <input class="form-control" id="CatSubName2" name="CatSubName2" type="text" maxlength="200" />
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <label class="col-sm-3 control-label language_txt">Ordre</label>
                                                <div class="col-sm-9">
                                                    <input type="number" min="0" step="1" class="form-control" id="CatOrder" name="CatOrder" />
                                                </div>
                                            </div>
                                            <div class="form-group forupdate forview">
                                                <label class="col-sm-3 control-label">
                                                    Image</label>
                                                <div class="col-sm-3">
                                                    <button class="btn btn-inverse" onclick="return UploadCatImage(this)" title="Upload">
                                                        <i class="fa fa-arrow-circle-o-up"></i>&nbsp;<span class="language_txt">Upload</span>&nbsp;
                                                    </button>
                                                    <button class="btn btn-inverse" id="btn_delete_cat_img" style="display: none;" onclick="return delete_cat_img_click_confirm()"
                                                        title="Delete">
                                                        <i class="fa fa-times-circle-o"></i>&nbsp;<span class="language_txt">Supprimer</span>&nbsp;
                                                    </button>
                                                </div>
                                                <div class="col-sm-6">
                                                    <img id="img_cat" />
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <label class="col-sm-3 control-label language_txt">Activé</label>
                                                <div class="col-sm-9">
                                                    <input type="checkbox" class="form-control" id="CatIsActived" name="CatIsActived" />
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <label class="col-sm-3 control-label language_txt">S'afficher sur le Menu (Site)</label>
                                                <div class="col-sm-9">
                                                    <input type="checkbox" class="form-control" id="CatDisplayInMenu" name="CatDisplayInMenu" />
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <label class="col-sm-3 control-label language_txt">S'afficher sur l'exposition (Site)</label>
                                                <div class="col-sm-9">
                                                    <input type="checkbox" class="form-control" id="CatDisplayInExhibition" name="CatDisplayInExhibition" />
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <label class="col-md-3 control-label language_txt">Description</label>
                                                <div class="col-md-9">
                                                    <textarea rows="3" cols="5" name="CatDescription" class="form-control" id="CatDescription"></textarea></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="col-md-3" id="div_sub_cat">
                                <div class="box border inverse">
                                    <div class="box-title">
                                        <h4>
                                            <i class="fa fa-magnet"></i><span class="language_txt">Sous catégorie</span></h4>
                                    </div>
                                    <div class="box-body" style="width: 100%; overflow-x: auto;">
                                        <div class="form-horizontal center">
                                            <table cellpadding="0" cellspacing="0" border="0" class="table table-striped table-bordered table-hover">
                                                <thead id="thead_cost_plan_line">
                                                    <tr role="row">
                                                        <th style="text-align: center" class="language_txt">Nom</th>
                                                    </tr>
                                                </thead>
                                                <tbody id="tbody_sub_cats" style="text-align: center !important">
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="separator">
                        </div>
                        <div class="row forview" >
                            <div class="col-md-12">
                                <!-- BOX -->
                                <div class="box border inverse">
                                    <div class="box-title">
                                        <h4>
                                            <i class="fa fa-bars"></i><span class="language_txt">Les produits dans cette catégorie</span></h4>
                                        <span style="float: right" id="rst_pcas"></span>
                                    </div>
                                    <div class="box-body center">
                                        <button class="btn btn-inverse language_txt" onclick="return modifyPca(this)" pcaid="0">Ajouter un produit</button>
                                    </div>
                                    <div class="box-body" id="div_pcas" style="width: 100%; overflow-x: auto;">
                                        <table id="dt_pcas" cellpadding="0" cellspacing="0" border="0" class="datatable table table-striped table-bordered table-hover">
                                        </table>
                                    </div>
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
                        <button type="button" class="btn btn-inverse language_txt" onclick="return js_create_update_cat()">Créer</button>
                    </div>
                    <div class="modal-body center forupdate">        
                        <button type="button" class="btn btn-default language_txt" onclick="changeViewMode('view')">Annuler</button>
                        <button type="button" class="btn btn-inverse language_txt" onclick="return js_create_update_cat()">Mettre à jour</button>
                    </div>
                    <div class="modal-body center forview">
                        <button type="button" class="btn btn-inverse  language_txt" onclick="return delete_cat_click_confirm(this)">Supprimer</button>
                        <button type="button" class="btn btn-inverse  language_txt" onclick="changeViewMode('modify')">Modifier</button>
                    </div>
                </div>
            </div>
            <div class="footer-tools">
                <span class="go-top"><i class="fa fa-chevron-up"></i>Top </span>
            </div>
        </div>
        <!-- /CONTENT-->
    </div>
    <script type="text/javascript" src="../../js/jQuery-BlockUI/jquery.blockUI.min.js"></script>
    <script type="text/javascript" src="../../js/datatables/extras/TableTools/media/js/ZeroClipboard.min.js"></script>
    <script type="text/javascript" src="../../js/jQuery-Cookie/jquery.cookie.min.js"></script>
    <script src="../../js/bootbox/bootbox.min.js" type="text/javascript"></script>
    <!-- DATA TABLES -->
    <script type="text/javascript" src="../../js/datatables/media/js/jquery.dataTables.min.js?V=<%= WebConfigurationManager.AppSettings["jsVersion"] %>"></script>
    <script type="text/javascript" src="../../js/datatables/media/assets/js/datatables.min.js?V=<%= WebConfigurationManager.AppSettings["jsVersion"] %>"></script>
    <script type="text/javascript" src="../../js/datatables/extras/TableTools/media/js/TableTools.min.js"></script>
    <script type="text/javascript" src="../../js/datatables/extras/TableTools/media/js/ZeroClipboard.min.js"></script>
    <script type="text/javascript" src="../../js/jQuery-Cookie/jquery.cookie.min.js"></script>
    <script src="../../js/bootbox/bootbox.min.js" type="text/javascript"></script>
    <!-- JQUERY -->
    <script type="text/javascript" src="../../js/isotope/jquery.isotope.min.js"></script>
    <script type="text/javascript" src="../../js/isotope/imagesloaded.pkgd.min.js"></script>
    <!-- COLORBOX -->
    <script type="text/javascript" src="../../js/colorbox/jquery.colorbox.min.js"></script>
    <!-- COOKIE -->
    <script type="text/javascript" src="../../js/jQuery-Cookie/jquery.cookie.min.js"></script>
    <script src="../../js/script.js"></script>
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
