<%@ Page Title="" Language="C#" AutoEventWireup="true" CodeBehind="edit.aspx.cs"
    Inherits="ERP.Web.Views.Calendar.edit" %>

<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head id="Head1" runat="server">
    <meta http-equiv="Content-Type" content="text/html;charset=UTF-8">
    <title>Calendar Details</title>
    <link href="source/css/main.css" rel="stylesheet" type="text/css" />
    <link href="source/css/dp.css" rel="stylesheet" />
    <link href="source/css/dropdown.css" rel="stylesheet" />
    <link href="source/css/colorselect.css" rel="stylesheet" />
    <script src="source/src/jquery.js" type="text/javascript"></script>
    <script src="source/src/Plugins/Common.js" type="text/javascript"></script>
    <script src="source/src/Plugins/jquery.form.js" type="text/javascript"></script>
    <script src="source/src/Plugins/jquery.validate.js" type="text/javascript"></script>
    <%--<script src="source/src/Plugins/datepicker_lang_US.js" type="text/javascript"></script>--%>
    <script src="source/src/Plugins/datepicker_lang_FR.js" type="text/javascript"></script>
    <script src="source/src/Plugins/jquery.datepicker.js" type="text/javascript"></script>
    <script src="source/src/Plugins/jquery.dropdown.js" type="text/javascript"></script>
    <script src="source/src/Plugins/jquery.colorselect.js" type="text/javascript"></script>
    <link href="../../img/loaders/loading.gif" rel="stylesheet" type="text/css" />
    <script type="text/javascript">
        if (!DateAdd || typeof (DateDiff) != "function") {
            var DateAdd = function (interval, number, idate) {
                number = parseInt(number);
                var date;
                if (typeof (idate) == "string") {
                    date = idate.split(/\D/);
                    eval("var date = new Date(" + date.join(",") + ")");
                }
                if (typeof (idate) == "object") {
                    date = new Date(idate.toString());
                }
                switch (interval) {
                    case "y": date.setFullYear(date.getFullYear() + number); break;
                    case "m": date.setMonth(date.getMonth() + number); break;
                    case "d": date.setDate(date.getDate() + number); break;
                    case "w": date.setDate(date.getDate() + 7 * number); break;
                    case "h": date.setHours(date.getHours() + number); break;
                    case "n": date.setMinutes(date.getMinutes() + number); break;
                    case "s": date.setSeconds(date.getSeconds() + number); break;
                    case "l": date.setMilliseconds(date.getMilliseconds() + number); break;
                }
                return date;
            }
        }
        function getHM(date) {
            var hour = date.getHours();
            var minute = date.getMinutes();
            var ret = (hour > 9 ? hour : "0" + hour) + ":" + (minute > 9 ? minute : "0" + minute);
            return ret;
        }
        $(document).ready(function () {
            //debugger;
            //var DATA_FEED_URL = "php/datafeed.php";
            var arrT = [];
            var tt = "{0}:{1}";
            for (var i = 0; i < 24; i++) {
                arrT.push({ text: StrFormat(tt, [i >= 10 ? i : "0" + i, "00"]) }, { text: StrFormat(tt, [i >= 10 ? i : "0" + i, "30"]) });
            }
            $("#timezone").val(new Date().getTimezoneOffset() / 60 * -1);
            $("#stparttime").dropdown({
                dropheight: 200,
                dropwidth: 60,
                selectedchange: function () { },
                items: arrT
            });
            $("#etparttime").dropdown({
                dropheight: 200,
                dropwidth: 60,
                selectedchange: function () { },
                items: arrT
            });
            var check = $("#IsAllDayEvent").click(function (e) {
                if (this.checked) {
                    $("#stparttime").val("00:00").hide();
                    $("#etparttime").val("00:00").hide();
                }
                else {
                    var d = new Date();
                    var p = 60 - d.getMinutes();
                    if (p > 30) p = p - 30;
                    d = DateAdd("n", p, d);
                    $("#stparttime").val(getHM(d)).show();
                    $("#etparttime").val(getHM(DateAdd("h", 1, d))).show();
                }
            });
            if (check[0].checked) {
                $("#stparttime").val("00:00").hide();
                $("#etparttime").val("00:00").hide();
            }
            $("#Savebtn").click(function () {
                //alert($('#lb_urls').text());
                CreateUpdateEvent();
                //$("#fmEdit").submit();
            });

            $("#Closebtn").click(function () { CloseModelWindow(null, true); });
            $("#Deletebtn").click(function () {
                if (confirm("Veuillez confirmer la suppression")) {
                    var lb_urls = $('#lb_urls').text();
                    var id = getParameterFromUrlByName("Id", lb_urls);
                    var param = [{ "name": "calendarId", value: id}];
                    $.post("datafeed.ashx?method=remove",
                        param,
                        function (data) {
                            if (data.IsSuccess) {
                                alert(data.Msg);
                                CloseModelWindow(null, true);
                            }
                            else {
                                alert("Error occurs.\r\n" + data.Msg);
                            }
                        }
                    , "json");
                }
            });

            $("#stpartdate,#etpartdate").datepicker({ picker: "<button class='calpick'></button>" });
            var cv = $("#colorvalue").val();
            if (cv == "") {
                cv = "-1";
            }
            $("#calendarcolor").colorselect({ title: "Color", index: cv, hiddenid: "colorvalue" });
            //to define parameters of ajaxform
            var options = {
                beforeSubmit: function () {
                    return true;
                },
                dataType: "json",
                success: function (data) {
                    alert(data.Msg);
                    if (data.IsSuccess) {
                        CloseModelWindow(null, true);
                    }
                }
            };
            $.validator.addMethod("date", function (value, element) {
                var arrs = value.split(i18n.datepicker.dateformat.separator);
                var year = arrs[i18n.datepicker.dateformat.year_index];
                var month = arrs[i18n.datepicker.dateformat.month_index];
                var day = arrs[i18n.datepicker.dateformat.day_index];
                var standvalue = [year, month, day].join("-");
                return this.optional(element) || /^(?:(?:1[6-9]|[2-9]\d)?\d{2}[\/\-\.](?:0?[1,3-9]|1[0-2])[\/\-\.](?:29|30))(?: (?:0?\d|1\d|2[0-3])\:(?:0?\d|[1-5]\d)\:(?:0?\d|[1-5]\d)(?: \d{1,3})?)?$|^(?:(?:1[6-9]|[2-9]\d)?\d{2}[\/\-\.](?:0?[1,3,5,7,8]|1[02])[\/\-\.]31)(?: (?:0?\d|1\d|2[0-3])\:(?:0?\d|[1-5]\d)\:(?:0?\d|[1-5]\d)(?: \d{1,3})?)?$|^(?:(?:1[6-9]|[2-9]\d)?(?:0[48]|[2468][048]|[13579][26])[\/\-\.]0?2[\/\-\.]29)(?: (?:0?\d|1\d|2[0-3])\:(?:0?\d|[1-5]\d)\:(?:0?\d|[1-5]\d)(?: \d{1,3})?)?$|^(?:(?:16|[2468][048]|[3579][26])00[\/\-\.]0?2[\/\-\.]29)(?: (?:0?\d|1\d|2[0-3])\:(?:0?\d|[1-5]\d)\:(?:0?\d|[1-5]\d)(?: \d{1,3})?)?$|^(?:(?:1[6-9]|[2-9]\d)?\d{2}[\/\-\.](?:0?[1-9]|1[0-2])[\/\-\.](?:0?[1-9]|1\d|2[0-8]))(?: (?:0?\d|1\d|2[0-3])\:(?:0?\d|[1-5]\d)\:(?:0?\d|[1-5]\d)(?:\d{1,3})?)?$/.test(standvalue);
            }, "Invalid date format");
            $.validator.addMethod("time", function (value, element) {
                return this.optional(element) || /^([0-1]?[0-9]|2[0-3]):([0-5][0-9])$/.test(value);
            }, "Invalid time format");
            $.validator.addMethod("safe", function (value, element) {
                return this.optional(element) || /^[^$\<\>]+$/.test(value);
            }, "$<> not allowed");
            $("#fmEdit").validate({
                submitHandler: function (form) { $("#fmEdit").ajaxSubmit(options); },
                errorElement: "div",
                errorClass: "cusErrorPanel",
                errorPlacement: function (error, element) {
                    showerror(error, element);
                }
            });
            function showerror(error, target) {
                var pos = target.position();
                var height = target.height();
                var newpos = { left: pos.left, top: pos.top + height + 2 }
                var form = $("#fmEdit");
                error.appendTo(form).css(newpos);
            }
        });


        function CreateUpdateEvent() {
            //            alert($('#lb_urls').text());
            //            alert(location.search);
            var lb_urls = $('#lb_urls').text();
            var ccoId = getParameterFromUrlByName("ccoId", lb_urls);
            var usrId = getParameterFromUrlByName("usrId", lb_urls);
            var id = getParameterFromUrlByName("Id", lb_urls);
            var method = "adddetails";
            var stpartdate = $('#stpartdate').val();
            var etpartdate = $('#etpartdate').val();
            var stparttime = $('#stparttime').val();
            var etparttime = $('#etparttime').val();
            var Subject = $('#Subject').val();
            var IsAllDayEvent = $('#IsAllDayEvent')[0].checked ? "1" : "0";
            var Description = $('#Description').val();
            var Location = $('#Location').val();
            var guest = $('#guest').val();
            var colorvalue = $('#colorvalue').val();
            var timezone = $('#timezone').val();
            var IsDone = $('#IsDone')[0].checked ? "1" : "0";

            try {

                var test = {
                    ccoId: ccoId,
                    id: id,
                    method: method,
                    usrId: usrId,
                    stpartdate: stpartdate,
                    etpartdate: etpartdate,
                    stparttime: stparttime,
                    etparttime: etparttime,
                    Subject: Subject,
                    IsAllDayEvent: IsAllDayEvent,
                    Description: Description,
                    Location: Location,
                    guest: guest,
                    colorvalue: colorvalue,
                    timezone: timezone,
                    IsDone: IsDone
                };

//                for (var i = 0; i < test.length; i++) {
//                    console.log(test[i]);
//                }

                console.log(test.IsAllDayEvent);

                $('#loading_mask').show();
                $.ajax({
                    type: "POST",
                    url: "datafeed.ashx",
                    //data: { firstName: 'stack', lastName: 'overflow' },
                    data: {
                        ccoId: ccoId,
                        id: id,
                        method: method,
                        usrId: usrId,
                        stpartdate: stpartdate,
                        etpartdate: etpartdate,
                        stparttime: stparttime,
                        etparttime: etparttime,
                        Subject: Subject,
                        IsAllDayEvent: IsAllDayEvent,
                        Description: Description,
                        Location: Location,
                        guest: guest,
                        colorvalue: colorvalue,
                        timezone: timezone,
                        IsDone: IsDone
                    },
                    // DO NOT SET CONTENT TYPE to json
                    // contentType: "application/json; charset=utf-8", 
                    // DataType needs to stay, otherwise the response object
                    // will be treated as a single string
                    dataType: "json",
                    success: function (response) {
                        var IsSuccess = response['IsSuccess'];
                        //                        for (var key in response) {
                        //                            content += key;
                        //                            content += response[key];
                        //                        }
                        //alert(IsSuccess);
                        if (IsSuccess) {
                            $('#Closebtn').click();
                        } else {

                        }
                    }
                });

            } catch (e) {
                alert(e);
            }
            return false;
        }


        function getParameterFromUrlByName(name, url) {
            name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
            var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
            results = regex.exec(url);
            return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
        }
    </script>
    <style type="text/css">
        .calpick
        {
            width: 16px;
            height: 16px;
            border: none;
            cursor: pointer;
            background: url("sample-css/cal.gif") no-repeat center 2px;
            margin-left: -22px;
        }
    </style>
</head>
<body>
    <div>
        <div class="toolBotton">
            <a id="Savebtn" class="imgbtn" href="javascript:void(0);"><span class="Save" title="Save the calendar">
                Enregistrer </span></a>
            <%if (jqmodel != null)
              {%>
            <a id="Deletebtn" class="imgbtn" href="javascript:void(0);"><span class="Delete"
                title="Cancel the calendar">Supprimer </span></a>
            <%} %>
            <a id="Closebtn" class="imgbtn" href="javascript:void(0);"><span class="Close" title="Close the window">
                Fermer </span></a>
        </div>
        <div style="clear: both">
        </div>
        <div class="infocontainer">
            <form action="datafeed.ashx?method=adddetails<%=urls%>" class="fform" id="fmEdit"
            method="post">
            <label id="lb_urls" style="display: none;">
                <%=urls%></label>
            <label>
                <span>*Titre: </span>
                <div id="calendarcolor">
                </div>
                <input maxlength="200" class="required safe" id="Subject" name="Subject" style="width: 85%;"
                    type="text" value="<%=Subject%>" />
                <input id="colorvalue" name="colorvalue" type="hidden" value="<%=colors%>" />
            </label>
            <label>
                <span>*Date: </span>
                <div>
                    <input maxlength="10" class="required date" id="stpartdate" name="stpartdate" style="padding-left: 2px;
                        width: 90px;" type="text" value="<%=sarrd%>" />
                    <input maxlength="5" class="required time" id="stparttime" name="stparttime" style="width: 40px;"
                        type="text" value="<%=sarrt%>" />&nbsp;À&nbsp;
                    <input maxlength="10" class="required date" id="etpartdate" name="etpartdate" style="padding-left: 2px;
                        width: 90px;" type="text" value="<%=earrd %>" />
                    <input maxlength="50" class="required time" id="etparttime" name="etparttime" style="width: 40px;"
                        type="text" value="<%=earrt%>" />
                    <label class="checkp">
                        <input id="IsAllDayEvent" name="IsAllDayEvent" type="checkbox"  <%if (IsAllDayEvent == 1) {Response.Write("checked");} %> />Toute
                        la journée
                    </label>
                </div>
            </label>
            <label>
                <span>Is Done (已完成):
                        <input id="IsDone" name="IsDone" type="checkbox"  <%if (IsDone == 1) {Response.Write("checked");} %> />
                </span>
            </label>
            <label><a href="<%=SodFId%>" target="_blank" style="font-weight: bold; color:blue"><%=SodCode%></a>
            </label>
            <label>
                <span>Lieu: </span>
                <input maxlength="200" id="Location" name="Location" style="width: 95%;" type="text"
                    value="<%=Location%>" />
            </label>
            <label>
                <span>Invité(s): </span>
                <input maxlength="200" id="guest" name="guest" style="width: 95%;" type="text" value="<%=guest%>" />
            </label>
            <label>
                <span>Description: </span>
                <textarea cols="20" id="Description" name="Description" rows="2" style="width: 95%;
                    height: 70px"><%=descriptionas%></textarea>
            </label>
            <input id="timezone" name="timezone" type="hidden" value="" />
            </form>
        </div>
    </div>
    <div class="loading-mask" id="loading_mask" style="display: none;">
        <p id="message_loading_mask" style="margin-left: auto; margin-right: auto; text-align: center;
            margin-top: 23%; color: red; font-size: 22pt; background-color: white; padding-top: 10px;
            padding-bottom: 10px;">
            Veuillez patienter...</p>
        <p id="message_loading_animation" class="message_loading_animation">
        </p>
    </div>
</body>
</html>
