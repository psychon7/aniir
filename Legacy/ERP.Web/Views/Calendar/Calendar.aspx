<%@ Page Title="" Language="C#" MasterPageFile="~/Empty.Master" AutoEventWireup="true"
    CodeBehind="Calendar.aspx.cs" Inherits="ERP.Web.Views.Calendar.Calendar" %>
<%@ Import Namespace="System.Web.Configuration" %>
<asp:Content ID="Content1" ContentPlaceHolderID="HeadContent" runat="server">
    <title>ERP - Agenda</title>
    <!-- JQUERY UI DATE PICKER -->
    <link rel="stylesheet" type="text/css" href="../../js/jquery-ui-1.10.3.custom/css/custom-theme/jquery-ui-1.10.3.custom.min.css" />
    <!-- End JQUERY UI DATE PICKER -->
    <link rel="stylesheet" type="text/css" href="../../css/cloud-admin.css?version20170918">
    <link rel="stylesheet" type="text/css" href="../../css/themes/default.css?version20170918"
        id="skin_switcher">
    <link rel="stylesheet" type="text/css" href="../../css/responsive.css?version20170918">
    <!-- STYLESHEETS -->
    <!--[if lt IE 9]><script src='<%= Page.ResolveClientUrl("~/js/flot/excanvas.min.js") %>'></script><script src="http://html5shiv.googlecode.com/svn/trunk/html5.js"></script><script src="http://css3-mediaqueries-js.googlecode.com/svn/trunk/css3-mediaqueries.js"></script><![endif]-->
    <link href="../../font-awesome/css/font-awesome.min.css?version20170918" rel="stylesheet">
    <!-- ANIMATE -->
    <link rel="stylesheet" type="text/css" href="../../css/animatecss/animate.min.css?version20170918" />
    <link href="source/css/dailog.css" rel="stylesheet" type="text/css" />
    <link href="source/css/calendar.css" rel="stylesheet" type="text/css" />
    <link href="source/css/dp.css" rel="stylesheet" type="text/css" />
    <link href="source/css/alert.css" rel="stylesheet" type="text/css" />
    <link href="source/css/main.css" rel="stylesheet" type="text/css" />
    <script src="source/src/jquery.js" type="text/javascript"></script>
    <script src="source/src/Plugins/Common.js" type="text/javascript"></script>
    <script src="source/src/Plugins/datepicker_lang_US.js" type="text/javascript"></script>
    <script src="source/src/Plugins/jquery.datepicker.js" type="text/javascript"></script>
    <script src="source/src/Plugins/jquery.alert.js" type="text/javascript"></script>
    <script src="source/src/Plugins/jquery.ifrmdailog.js" defer="defer" type="text/javascript"></script>
    <%--<script src="src/Plugins/wdCalendar_lang_US.js" type="text/javascript"></script>--%>
    <script src="source/src/Plugins/wdCalendar_lang_FR.js" type="text/javascript"></script>
    <script src="source/src/Plugins/jquery.calendar.js?V=V=<%= WebConfigurationManager.AppSettings["jsVersion"] %>" type="text/javascript"></script>
    <%--<script src="source/calendar.js?V3" type="text/javascript"></script>--%>
    <script src="source/calendar.js?V=V=<%= WebConfigurationManager.AppSettings["jsVersion"] %>" type="text/javascript"></script>
    <script src="../../js/ERP/ERPBaseJS.js?V=V=<%= WebConfigurationManager.AppSettings["jsVersion"] %>"
        type="text/javascript"></script>
    <script src="../../js/ERP/CommonJS.js?V=V=<%= WebConfigurationManager.AppSettings["jsVersion"] %>"
        type="text/javascript"></script>
        <style>
            .box-body {
                padding: 30px !important;
            }
        </style>
</asp:Content>
<asp:Content ID="Content2" ContentPlaceHolderID="MainContent" runat="server">
    <script>
        function AfterEventSuccess() {
            alert(window.location);
        }
        
        function getServicePath() {
            window.webservicePath ="<%= ResolveUrl("~/Services/ERPWebServices.asmx") %>";
        }
    </script>
    <div class="container">
        <div class="row">
            <div id="content" class="col-lg-12">
                <div class="row">
                    <div class="col-md-12">
                        <div class="row" id="div_todo">
                            <div class="col-md-2">
                                <div class="box border inverse">
                                    <div class="box-title">
                                        <h4>
                                            <i class="fa fa-bars"></i>RENDEZ-VOUS À VENIR</h4>
                                    </div>
                                    <div class="box-body" style="max-height:802px; overflow-y: auto;">
                                        <div class="form-horizontal">
                                            <div id="Div1" style="padding-left: 1px; padding-right: 1px;">
                                                <%--<div class="cHead">
                                                    <div class="ftitle">
                                                        RENDEZ-VOUS À VENIR</div>
                                                </div>--%>
                                                <div id="div_coming_event" style="height: 99%; overflow-x: hidden; overflow-y: auto;
                                                                                                                                  font-family: Calibri; font-size: 8pt;">
                                                    <table style="width: 100%;" id="tb_coming_event">
                                                    </table>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="col-md-10">
                                <div class="box border inverse" style="height:950px;">
                                    <div class="box-title">
                                        <h4>
                                            <i class="fa fa-bars"></i>Agenda</h4>
                                    </div>
                                    <div class="box-body">
                                        <div class="form-horizontal" style="min-height: 800px;">
                                            <div>
                                                <span id="usr_id" style="display: none;">
                                                    <%= CurrentUser.Id %></span>
                                            </div>
                                            <div id="calhead" style="padding-left: 1px; padding-right: 1px;">
                                                <div class="cHead">
                                                    <div class="ftitle">
                                                        MES RENDEZ-VOUS/我的日程</div>
                                                    <div id="loadingpannel" class="ptogtitle loadicon" style="display: none;">
                                                        Loading...</div>
                                                    <div id="errorpannel" class="ptogtitle loaderror" style="display: none;">
                                                        Veuillez réessayer</div>
                                                </div>
                                                <div id="caltoolbar" class="ctoolbar">
                                                    <%--<div id="faddbtn" class="fbutton">
                    <div>
                        <span title='Click to Create New Event' class="addcal">CRÉER </span>
                    </div>
                </div>
                <div class="btnseparator">
                </div>--%>
                                                    <div id="showtodaybtn" class="fbutton">
                                                        <div>
                                                            <span title='Click to back to today ' class="showtoday">Aujourd'hui/今日</span></div>
                                                    </div>
                                                    <div class="btnseparator">
                                                    </div>
                                                    <div id="showdaybtn" class="fbutton">
                                                        <div>
                                                            <span title='Day' class="showdayview">Jour/日</span></div>
                                                    </div>
                                                    <div id="showweekbtn" class="fbutton">
                                                        <div>
                                                            <span title='Week' class="showweekview">Semaine/周</span></div>
                                                    </div>
                                                    <div id="showmonthbtn" class="fbutton fcurrent">
                                                        <div>
                                                            <span title='Month' class="showmonthview">Mois/月</span></div>
                                                    </div>
                                                    <div class="btnseparator">
                                                    </div>
                                                    <div id="showreflashbtn" class="fbutton">
                                                        <div>
                                                            <span title='Refresh view' class="showdayflash">Actualiser/刷新</span></div>
                                                    </div>
                                                    <div class="btnseparator">
                                                    </div>
                                                    <div id="sfprevbtn" title="Prev" class="fbutton">
                                                        <span class="fprev"></span>
                                                    </div>
                                                    <div id="sfnextbtn" title="Next" class="fbutton">
                                                        <span class="fnext"></span>
                                                    </div>
                                                    <div class="fshowdatep fbutton">
                                                        <div>
                                                            <input type="hidden" name="txtshow" id="hdtxtshow" />
                                                            <span id="txtdatetimeshow">Loading.../读取中</span>
                                                        </div>
                                                    </div>
                                                    <div class="clear">
                                                    </div>
                                                </div>
                                            </div>
                                            <div style="padding: 1px;">
                                                <div class="t1 chromeColor">
                                                    &nbsp;</div>
                                                <div class="t2 chromeColor">
                                                    &nbsp;</div>
                                                <div id="dvCalMain" class="calmain printborder">
                                                    <div id="gridcontainer" style="overflow-y: visible;">
                                                    </div>
                                                </div>
                                                <div class="t2 chromeColor">
                                                    &nbsp;</div>
                                                <div class="t1 chromeColor">
                                                    &nbsp;
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
        <!-- /CONTENT-->
    </div>
    <script type="text/javascript" src="../../js/jQuery-BlockUI/jquery.blockUI.min.js"></script>
</asp:Content>
