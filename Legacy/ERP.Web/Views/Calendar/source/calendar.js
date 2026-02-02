$(document).ready(function () {
    setPageWidth();
    var view = "month";

    var DATA_FEED_URL = "datafeed.ashx";
    var op = {
        view: view,
        theme: 3,
        showday: new Date(),
        EditCmdhandler: Edit,
        DeleteCmdhandler: Delete,
        ViewCmdhandler: View,
        onWeekOrMonthToDay: wtd,
        onBeforeRequestData: cal_beforerequest,
        onAfterRequestData: cal_afterrequest,
        onRequestDataError: cal_onerror,
        autoload: true,
        url: DATA_FEED_URL + "?method=list",
        quickAddUrl: DATA_FEED_URL + "?method=add",
        quickUpdateUrl: DATA_FEED_URL + "?method=update",
        quickDeleteUrl: DATA_FEED_URL + "?method=remove"
    };

    var $dv = $("#calhead");
    var _MH = document.documentElement.clientHeight;
    var dvH = $dv.height() + 2;
    op.height = _MH - dvH;
    op.eventItems = [];

    var p = $("#gridcontainer").bcalendar(op).BcalGetOp();
    if (p && p.datestrshow) {
        $("#txtdatetimeshow").text(p.datestrshow);
    } else {
        $("#txtdatetimeshow").text(getToday());
    }
    $("#caltoolbar").noSelect();

    $("#hdtxtshow").datepicker({ picker: "#txtdatetimeshow", showtarget: $("#txtdatetimeshow"),
        onReturn: function (r) {
            var p = $("#gridcontainer").gotoDate(r).BcalGetOp();
            if (p && p.datestrshow) {
                $("#txtdatetimeshow").text(p.datestrshow);
            }
        }
    });
    function cal_beforerequest(type) {
        var t = "Chargement en cours...";
        switch (type) {
            case 1:
                t = "Chargement en cours...";
                break;
            case 2:
            case 3:
            case 4:
                t = "Traitement en cours...";
                break;
        }
        $("#errorpannel").hide();
        $("#loadingpannel").html(t).show();
    }
    function cal_afterrequest(type) {
        switch (type) {
            case 1:
                $("#loadingpannel").hide();
                break;
            case 2:
            case 3:
            case 4:
                $("#loadingpannel").html("Success!");
                window.setTimeout(function () { $("#loadingpannel").hide(); }, 2000);
                break;
        }

    }
    function cal_onerror(type, data) {
        $("#errorpannel").show();
    }
    function Edit(data) {
        var usr_id = $('#usr_id').text() * 1;
        data.push(usr_id);
        var eurl = "edit.aspx?id={0}&start={2}&end={3}&isallday={4}&title={1}&usrId={5}";
        if (data) {
            var url = StrFormat(eurl, data);
            OpenModelWindow(url, { width: 600, height: 400, caption: "Le rendez-vous", onclose: function () {
                $("#gridcontainer").reload();
            }
            });
        }
    }
    function View(data) {
        var str = "";
        $.each(data, function (i, item) {
            str += "[" + i + "]: " + item + "\n";
        });
        document.write(str); debugger;
    }
    function Delete(data, callback) {
        $.alerts.cancelButton = "Annuler";
        $.alerts.okButton = "OK";
        hiConfirm("Supprimer cet événement ?", 'CONFIRMER LA SUPPRESSION', function (r) { r && callback(0); });
    }
    function wtd(p) {
        if (p && p.datestrshow) {
            $("#txtdatetimeshow").text(p.datestrshow);
        }
        $("#caltoolbar div.fcurrent").each(function () {
            $(this).removeClass("fcurrent");
        })
        $("#showdaybtn").addClass("fcurrent");
    }
    //to show day view
    $("#showdaybtn").click(function (e) {
        //document.location.href="#day";
        $("#caltoolbar div.fcurrent").each(function () {
            $(this).removeClass("fcurrent");
        })
        $(this).addClass("fcurrent");
        var p = $("#gridcontainer").swtichView("day").BcalGetOp();
        if (p && p.datestrshow) {
            $("#txtdatetimeshow").text(p.datestrshow);
        }
    });
    //to show week view
    $("#showweekbtn").click(function (e) {
        //document.location.href="#week";
        $("#caltoolbar div.fcurrent").each(function () {
            $(this).removeClass("fcurrent");
        })
        $(this).addClass("fcurrent");
        var p = $("#gridcontainer").swtichView("week").BcalGetOp();
        if (p && p.datestrshow) {
            $("#txtdatetimeshow").text(p.datestrshow);
        }

    });
    //to show month view
    $("#showmonthbtn").click(function (e) {
        //document.location.href="#month";
        $("#caltoolbar div.fcurrent").each(function () {
            $(this).removeClass("fcurrent");
        })
        $(this).addClass("fcurrent");
        var p = $("#gridcontainer").swtichView("month").BcalGetOp();
        if (p && p.datestrshow) {
            $("#txtdatetimeshow").text(p.datestrshow);
        }
    });

    $("#showreflashbtn").click(function (e) {
        $("#gridcontainer").reload();
    });

    //Add a new event
    $("#faddbtn").click(function (e) {
        var usr_id = $('#usr_id').text() * 1;
        var ccoId = 0;
        try {
            ccoId = $('#add_event_in_cco_page').attr('ccoId') * 1;
        } catch (e) {

        }
        var url = "edit.aspx?usrId=" + usr_id + "&ccoId=" + ccoId;
        OpenModelWindow(url, { width: 500, height: 400, caption: "Create New Calendar" });
    });
    //go to today
    $("#showtodaybtn").click(function (e) {
        var p = $("#gridcontainer").gotoDate().BcalGetOp();
        if (p && p.datestrshow) {
            $("#txtdatetimeshow").text(p.datestrshow);
        }


    });
    //previous date range
    $("#sfprevbtn").click(function (e) {
        var p = $("#gridcontainer").previousRange().BcalGetOp();
        if (p && p.datestrshow) {
            $("#txtdatetimeshow").text(p.datestrshow);
        }

    });
    //next date range
    $("#sfnextbtn").click(function (e) {
        var p = $("#gridcontainer").nextRange().BcalGetOp();
        if (p && p.datestrshow) {
            $("#txtdatetimeshow").text(p.datestrshow);
        }
    });


//    try {
//        getComingEvents();
//    } catch (e) {

//    }
});

function setPageWidth() {
    $('.main').css('width', '100%');
    $('.panelpartial ').css('width', '100%');
    $('.panelpartial ').css('height', '800px');
}


function getComingEvents() {
    var usr_id = $('#usr_id').text() * 1;
    if (usr_id >= 1 && $('#tb_coming_event')) {
        $.ajax({
            url: '../../../Services/ERPWebServices.asmx/GetComingEvents',
            type: 'POST',
            contentType: 'application/json; charset=utf-8',
            dataType: 'json',
            success: function (data) {
                $('#tb_coming_event').empty();
                var jsonData = data.d;
                var data2treat = JSON.parse(jsonData);
                var content = "";
                var yellow = " background-color:#ffff00; ";
                var red = " background-color:#d96666; ";
                var blue = " background-color:#668cd9; ";
                var green = " background-color:#4cb052; ";
                

                $.each(data2treat, function (key, value) {
                    var style = "";
                    var textcolor = " color: white;";
                    switch (value.Action) {
                        case "1":
                            style = red;
                            break;
                        case "12":
                            {
                                style = yellow;
                                textcolor = "";
                            }
                            break;
                        case "6":
                            style = blue;
                            break;
                        case "9":
                            style = green;
                            break;
                        default:
                            style = "";
                            textcolor = "";
                            break;
                    }
                    content += "<tr><td style='border-bottom: 1px solid #99bbe8; " + style + textcolor+"'>Date: " + getDateTimeString(value.CldDStart) + " - " + getDateTimeString(value.CldDEnd) + "" +
                        "<br/>Titre: " + value.CldSubject + "" +
                        "<br/>Avec: " + (value.CldGuest == null ? "" : value.CldGuest) + "" +
                        "<br/>Lieu: " + (value.CldLocation == null ? "" : value.CldLocation) + "</td></tr>";
                });
                $('#tb_coming_event').append(content);
            },
            error: function (errdata) {
            }
        });
    }
}