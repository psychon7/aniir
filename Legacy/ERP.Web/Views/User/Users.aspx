<%@ Page Title="" Language="C#" MasterPageFile="~/Site.Master" AutoEventWireup="true"
    CodeBehind="Users.aspx.cs" Inherits="ERP.Web.Views.User.Users" %>
<%@ Import Namespace="System.Web.Configuration" %>

<asp:Content ID="Content1" ContentPlaceHolderID="HeadContent" runat="server">
    <!-- JQUERY UI DATE PICKER -->
    <link rel="stylesheet" type="text/css" href="../../js/jquery-ui-1.10.3.custom/css/custom-theme/jquery-ui-1.10.3.custom.min.css" />
    <!-- End JQUERY UI DATE PICKER -->
    <link href="../../css/site.css?V=<%= WebConfigurationManager.AppSettings["jsVersion"] %>"
        rel="stylesheet" type="text/css" />
</asp:Content>
<asp:Content ID="Content2" ContentPlaceHolderID="MainContent" runat="server">
    <script src="../../js/ERP/ERPBaseJS.js?V=<%= WebConfigurationManager.AppSettings["jsVersion"] %>"
        type="text/javascript"></script>
    <script src="../../js/ERP/CommonJS.js?V=<%= WebConfigurationManager.AppSettings["jsVersion"] %>"
        type="text/javascript"></script>
    <script src="../../js/ERP/User/Users.js?V=<%= WebConfigurationManager.AppSettings["jsVersion"] %>"
        type="text/javascript"></script>
    <link href="../../js/slidernav/slidernav.css" rel="stylesheet" type="text/css" />
    <script src="../../js/slidernav/slidernav.js" type="text/javascript"></script>
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
                                <li>Utilisteur</li>
                            </ul>
                            <!-- /BREADCRUMBS -->
                            <div class="clearfix">
                                <h3 class="content-title pull-left">
                                    Utilisteur</h3>
                            </div>
                            <div class="description">
                            </div>
                        </div>
                    </div>
                    <div class="row">
                        <div class="col-md-12">
                            <div class="row">
                                <!-- BOX -->
                                <div class="col-md-4">
                                    <div class="box border inverse">
                                        <div class="box-title">
                                            <h4>
                                                <i class="fa fa-users"></i>Utilisateur</h4>
                                        </div>
                                        <div class="box-body">
                                            <div class="row">
                                                <div class="center">
                                                    <input type="button" class="btn btn-inverse" value="Nouveau utilisateur" onclick="return createNewUser()" />
                                                </div>
                                                <div id="address-book">
                                                    <div class="slider-content" id="div_client_content">
                                                        <ul id="ul_client_content">
                                                        </ul>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div class="col-md-8" id="contact-card">
                                    <div class="box border inverse">
                                        <div class="box-title">
                                            <h4>
                                                <i class="fa fa-user"></i>Information d'utilisateur</h4>
                                        </div>
                                        <div class="box-body" id="div_user_info">
                                            <div class="form-horizontal">
                                                <div class="form-group">
                                                    <label class="col-sm-2 control-label">
                                                        Civilité</label>
                                                    <div class="col-sm-4">
                                                        <select class="form-control" id="Civ_Id">
                                                        </select>
                                                    </div>
                                                    <label class="col-sm-2 control-label">
                                                        Rôle</label>
                                                    <div class="col-sm-4">
                                                        <select class="form-control" id="RolId">
                                                        </select>
                                                    </div>
                                                </div>
                                                <div class="form-group">
                                                    <label class="col-sm-2 control-label fieldRequired">
                                                        Login</label>
                                                    <div class="col-sm-4">
                                                        <input class="form-control" id="UserLogin" required="" maxlength="200" />
                                                    </div>
                                                    <label class="col-sm-2 control-label">
                                                        Titre</label>
                                                    <div class="col-sm-4">
                                                        <input class="form-control" id="Title" maxlength="200" />
                                                    </div>
                                                </div>
                                                <div class="form-group">
                                                    <label class="col-sm-2 control-label">
                                                        Code HR</label>
                                                    <div class="col-sm-4">
                                                        <input class="form-control" id="Code_HR" />
                                                    </div>
                                                    <label class="col-sm-2 control-label admin_right manager_right">
                                                        Activé</label>
                                                    <div class="col-sm-4  admin_right manager_right">
                                                        <input type="checkbox" class="form-control" id="Is_Active" />
                                                    </div>
                                                </div>
                                                <div class="form-group">
                                                    <label class="col-sm-2 control-label fieldRequired">
                                                        Prénom</label>
                                                    <div class="col-sm-4">
                                                        <input class="form-control" id="Firstname" required="" maxlength="200" />
                                                    </div>
                                                    <label class="col-sm-2 control-label fieldRequired">
                                                        Nom de famille</label>
                                                    <div class="col-sm-4">
                                                        <input class="form-control" id="Lastname" required="" maxlength="200" />
                                                    </div>
                                                </div>
                                                <div class="form-group">
                                                    <label class="col-sm-2 control-label">
                                                        Photo</label>
                                                    <div class="col-sm-5 center">
                                                        <input type="file" class="btn btn-inverse" name="files[]" accept="image/*" id="btnUpdatePhoto"
                                                            onchange="getFileDataPopUp()" value="Photo" /><br />
                                                        <input class="btn btn-inverse" value="Annuler" id="btnCancelPhoto" style="display: none;"
                                                            onclick="return CancelPhoto()" />
                                                    </div>
                                                    <div class="col-sm-5" id="div_photoPath">
                                                    </div>
                                                </div>
                                                <div class="form-group">
                                                    <label class="col-sm-2 control-label">
                                                        Adresse 1</label>
                                                    <div class="col-sm-4">
                                                        <input type="text" class="form-control" id="Address1" maxlength="200" />
                                                    </div>
                                                    <label class="col-sm-2 control-label">
                                                        Adresse 2</label>
                                                    <div class="col-sm-4">
                                                        <input type="text" class="form-control" id="Address2" maxlength="200" />
                                                    </div>
                                                </div>
                                                <div class="form-group">
                                                    <label class="col-sm-2 control-label">
                                                        Code postal</label>
                                                    <div class="col-sm-4">
                                                        <input type="text" class="form-control" id="PostCode" maxlength="200" />
                                                    </div>
                                                    <label class="col-sm-2 control-label">
                                                        Ville</label>
                                                    <div class="col-sm-4">
                                                        <input type="text" class="form-control" id="City" maxlength="200" />
                                                    </div>
                                                </div>
                                                <div class="form-group">
                                                    <label class="col-sm-2 control-label">
                                                        Pays</label>
                                                    <div class="col-sm-4">
                                                        <input type="text" class="form-control" id="Country" maxlength="200" />
                                                    </div>
                                                    <label class="col-sm-2 control-label">
                                                        Portable</label>
                                                    <div class="col-sm-4">
                                                        <input type="text" class="form-control" id="Cellphone" maxlength="200" />
                                                    </div>
                                                </div>
                                                <div class="form-group">
                                                    <label class="col-sm-2 control-label">
                                                        Téléphone</label>
                                                    <div class="col-sm-4">
                                                        <input type="text" class="form-control" id="Telephone" maxlength="200" />
                                                    </div>
                                                    <label class="col-sm-2 control-label">
                                                        Fax</label>
                                                    <div class="col-sm-4">
                                                        <input type="text" class="form-control" id="Fax" maxlength="200" />
                                                    </div>
                                                </div>
                                                <div class="form-group">
                                                    <label class="col-sm-2 control-label">
                                                        Email</label>
                                                    <div class="col-sm-4">
                                                        <input type="text" class="form-control" id="Email" maxlength="200" />
                                                    </div>
                                                    <label class="col-sm-2 control-label admin_right">
                                                        Super à droite</label>
                                                    <div class="col-sm-4 admin_right">
                                                        <input type="checkbox" class="form-control" id="SuperRight" />
                                                    </div>
                                                </div>
                                                <div class="form-group">
                                                    <label class="col-sm-2 control-label">
                                                        Commentaire</label>
                                                    <div class="col-sm-4">
                                                        <textarea id="UsrComment" class="form-control" rows="3"></textarea>
                                                    </div>
                                                    <label class="col-sm-2 control-label">
                                                        Recevoir la notification d'achat (agenda aussi)</label>
                                                    <div class="col-sm-4 ">
                                                        <input type="checkbox" class="form-control" id="RcvPurchaseNotif" />
                                                    </div>
                                                </div>
                                                <div class="form-group">
                                                    <div class="col-sm-12 center">
                                                        <button type="button" id="btnSave" class="btn btn-inverse" onclick="return CreateUpdateUser(this)">
                                                            Sauvegarder
                                                        </button>
                                                        <button type="button" id="btnChangePwd" class="btn btn-inverse admin_right" onclick="return ChangePassword(this)">
                                                            Modifier le mot de passe</button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <!-- /BOX -->
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
    <script src="../../js/bootbox/bootbox.min.js" type="text/javascript"></script>
</asp:Content>
