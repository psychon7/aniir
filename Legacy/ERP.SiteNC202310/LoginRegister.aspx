<%@ Page Title="" Language="C#" MasterPageFile="~/Site.Master" AutoEventWireup="true"
    CodeBehind="LoginRegister.aspx.cs" Inherits="ERP.SiteNC202310.LoginRegister" %>

<%@ Import Namespace="System.Web.Configuration" %>
<asp:Content ID="Content1" ContentPlaceHolderID="HeadContent" runat="server">
    <link href="layui/css/layui.css" rel="stylesheet" type="text/css" />
    <link rel="stylesheet" href="static/css/vendors.css" />
    <link rel="stylesheet" href="static/css/plugins.css" />
    <link rel="stylesheet" href="static/css/icons.css" />
    <link rel="stylesheet" href="static/css/style.css" />
    <style>
        .layui-form-label
        {
            text-align: left !important;
        }
    </style>
</asp:Content>
<asp:Content ID="Content2" ContentPlaceHolderID="MainContent" runat="server">
    <script src="js/LoginRegister/LoginRegister.js?<%= WebConfigurationManager.AppSettings["jsVersion"] %>"
        type="text/javascript"></script>
    <div class="login-register-area pt-100 pb-100">
        <div class="container">
            <div class="row">
                <div class="col-lg-7 col-md-12 ml-auto mr-auto" style="width: 100%">
                    <div class="login-register-wrapper">
                        <div class="login-register-tab-list nav">
                            <a class="active" data-toggle="tab" href="#lg1">
                                <h4>
                                    Connexion
                                </h4>
                            </a><a data-toggle="tab" href="#lg2">
                                <h4>
                                    Enregistrement
                                </h4>
                            </a>
                        </div>
                        <div class="tab-content">
                            <div id="lg1" class="tab-pane active">
                                <div class="login-form-container box_shadow">
                                    <div class="login-register-form">
                                        <form action="#" method="post" id="fromb">
                                        <input type="text" name="user-name" id="ip_login" required placeholder="Username" />
                                        <input type="password" name="user-password" id="ip_pwd" required placeholder="Password" />
                                        <div class="button-box">
                                            <div class="login-toggle-btn">
                                                <%--<input type="checkbox" /><label>Remember me</label>--%>
                                                <a href="#">Forgot Password?</a>
                                            </div>
                                            <button type="submit" class="layui-btn" lay-submit="" lay-filter="demo1" onclick='js_connnectLR(this)'
                                                type="submit" style="margin: auto auto;">
                                                Login</button>
                                        </div>
                                        </form>
                                    </div>
                                </div>
                            </div>
                            <div id="lg2" class="tab-pane">
                                <div class="login-form-container box_shadow">
                                    <form class="layui-form" action="" id="froma">
                                    <div class="layui-form-item">
                                        <div class="layui-inline">
                                            <label class="layui-form-label">
                                                Raison sociale<span style="color: Red">*</span></label>
                                            <div class="layui-input-inline">
                                                <input type="text" id="ip_company_name" lay-verify="required" lay-reqtext="La raison sociale est obligatoire"
                                                    class="layui-input">
                                            </div>
                                        </div>
                                        <div class="layui-inline">
                                            <label class="layui-form-label">
                                                Login<span style="color: Red">*</span></label>
                                            <div class="layui-input-inline">
                                                <input type="text" id="ip_reg_login" lay-verify="required" lay-reqtext="Le Login est obligatoire"
                                                    class="layui-input">
                                            </div>
                                        </div>
                                    </div>
                                    <div class="layui-form-item">
                                        <div class="layui-inline">
                                            <label class="layui-form-label">
                                                Mot de passe<span style="color: Red">*</span></label>
                                            <div class="layui-input-inline">
                                                <input type="password" id="ip_reg_pwd" lay-verify="required" lay-reqtext="Le mot de passe est obligatoire"
                                                    minlength="6" maxlength="20" placeholder="Au moins 6 caractères." class="layui-input">
                                            </div>
                                        </div>
                                        <div class="layui-inline">
                                            <label class="layui-form-label">
                                                Confirmer le mot de passe<span style="color: Red">*</span></label>
                                            <div class="layui-input-inline">
                                                <input type="password" id="ip_reg_pwd_conf" lay-verify="required" lay-reqtext="Le mot de passe est obligatoire"
                                                    minlength="6" maxlength="20" placeholder="Au moins 6 caractères." class="layui-input">
                                            </div>
                                        </div>
                                    </div>
                                    <div class="layui-form-item">
                                        <div class="layui-inline">
                                            <label class="layui-form-label">
                                                Prénom<span style="color: Red">*</span></label>
                                            <div class="layui-input-inline">
                                                <input type="text" id='ip_firstname' lay-verify="required" lay-reqtext="Le prénom est obligatoire"
                                                    class="layui-input">
                                            </div>
                                        </div>
                                        <div class="layui-inline">
                                            <label class="layui-form-label">
                                                Nom<span style="color: Red">*</span></label>
                                            <div class="layui-input-inline">
                                                <input type="text" id='ip_lastname' lay-verify="required" lay-reqtext="Le nom est obligatoire"
                                                    class="layui-input">
                                            </div>
                                        </div>
                                    </div>
                                    <div class="layui-form-item">
                                        <div class="layui-inline">
                                            <label class="layui-form-label">
                                                Civilité</label>
                                            <div class="layui-input-inline">
                                                <select id='slt_civ' lay-filter="aihao">
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="layui-form-item">
                                        <div class="layui-inline">
                                            <label class="layui-form-label">
                                                Siret</label>
                                            <div class="layui-input-inline">
                                                <input type="text" id='ip_siret' class="layui-input">
                                            </div>
                                        </div>
                                        <div class="layui-inline">
                                            <label class="layui-form-label">
                                                TVA intracom</label>
                                            <div class="layui-input-inline">
                                                <input type="text" id='ip_tva_intra' class="layui-input">
                                            </div>
                                        </div>
                                    </div>
                                    <div class="layui-form-item">
                                        <div class="layui-inline">
                                            <label class="layui-form-label">
                                                Adresse 1<span style="color: Red">*</span></label>
                                            <div class="layui-input-inline">
                                                <input type="text" id='ip_adr1' lay-verify="required" lay-reqtext="L'adresse est obligatoire"
                                                    class="layui-input" />
                                            </div>
                                        </div>
                                        <div class="layui-inline">
                                            <label class="layui-form-label">
                                                Adresse 2</label>
                                            <div class="layui-input-inline">
                                                <input type="text" id='ip_adr2' class="layui-input">
                                            </div>
                                        </div>
                                    </div>
                                    <div class="layui-form-item">
                                        <div class="layui-inline">
                                            <label class="layui-form-label">
                                                Code postal<span style="color: Red">*</span></label>
                                            <div class="layui-input-inline">
                                                <input type="text" id='ip_postcode' lay-verify="required" lay-reqtext="Le code postal est obligatoire"
                                                    class="layui-input" />
                                            </div>
                                        </div>
                                        <div class="layui-inline">
                                            <label class="layui-form-label">
                                                Ville<span style="color: Red">*</span></label>
                                            <div class="layui-input-inline">
                                                <input type="text" id='ip_city' lay-verify="required" lay-reqtext="La ville est obligatoire"
                                                    class="layui-input" />
                                            </div>
                                        </div>
                                    </div>
                                    <div class="layui-form-item">
                                        <div class="layui-inline">
                                            <label class="layui-form-label">
                                                Téléphone</label>
                                            <div class="layui-input-inline">
                                                <input type="text" id='ip_tel1' class="layui-input">
                                            </div>
                                        </div>
                                        <div class="layui-inline">
                                            <label class="layui-form-label">
                                                Fax</label>
                                            <div class="layui-input-inline">
                                                <input type="text" id='ip_fax' class="layui-input">
                                            </div>
                                        </div>
                                    </div>
                                    <div class="layui-form-item">
                                        <div class="layui-inline">
                                            <label class="layui-form-label">
                                                Portable<span style="color: Red">*</span></label>
                                            <div class="layui-input-inline">
                                                <input type="text" id='ip_cellphone' lay-verify="required" lay-reqtext="Le portalbe est obligatoire"
                                                    class="layui-input">
                                            </div>
                                        </div>
                                        <div class="layui-inline">
                                            <label class="layui-form-label">
                                                E-mail<span style="color: Red">*</span></label>
                                            <div class="layui-input-inline">
                                                <input type="email" id='ip_email' lay-verify="required" lay-reqtext="L'e-mail est obligatoire"
                                                    class="layui-input">
                                            </div>
                                        </div>
                                    </div>
                                    <div class="layui-inline">
                                        <div class="layui-input-block" style="text-align: center;">
                                            <button type="button" class="layui-btn" lay-submit="" lay-filter="demo1" onclick='return js_register(this)'
                                                style="background-color: #2a72f8 !important;">
                                                Enregistrer</button>
                                            <button type="reset" class="layui-btn layui-btn-primary">
                                                Réinitialiser</button>
                                        </div>
                                        <iframe id="iFrame" name="iFrame" src="about:blank" style="display: none;"></iframe>
                                    </div>
                                    </form>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    <style>
        .layui-form-label
        {
            width: 187px;
        }
        .layui-form-item .layui-input-inline
        {
            width: 330px;
            margin-right: 0px;
        }
        .nice-select
        {
            display: none;
        }
    </style>
    <script src="static/js/vendors.js"></script>
    <script src="static/js/plugins.js"></script>
    <script src="static/js/main.js"></script>
</asp:Content>
