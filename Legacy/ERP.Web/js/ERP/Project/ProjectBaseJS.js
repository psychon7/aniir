$(document).ready(initAll);

function initAll() {
    setMenu();
    var url = window.location.href.split('?')[0];
    var paras = url.split('/');
    var pagename = paras[paras.length - 1].toLowerCase();
    switch (pagename) {
        case 'projectcostplanlist.aspx':
            loadProjectCostPlan();
            break;
        case 'projectclientorderlist.aspx':
            loadProjectOrder();
            break;
        case 'projectclientinvoicelist.aspx':
            loadProjectInvoice();
            break;
    }
}

function setMenu() {
    var prjId = getParameterByName('prjId');
    if (prjId) {
        $('.prjMenu').show();
    } else {
        $('.prjMenu').hide();
    }
}

function goCostPlanList() {
    myApp.showPleaseWait();
    var prjId = getUrlVars()['prjId'];
    var url = 'ProjectCostPlanList.aspx?prjId=' + prjId;
    window.location = url;
}

function goClientOrderList() {
    myApp.showPleaseWait();
    var prjId = getUrlVars()['prjId'];
    var url = 'ProjectClientOrderList.aspx?prjId=' + prjId;
    window.location = url;
}

function goBack2Project() {
    myApp.showPleaseWait();
    var prjId = getUrlVars()['prjId'];
    var url = 'Project.aspx?prjId=' + prjId+"&mode=view";
    window.location = url;
}

function goCinList() {
    myApp.showPleaseWait();
    var prjId = getUrlVars()['prjId'];
    var url = 'ProjectClientInvoiceList.aspx?prjId=' + prjId;
    window.location = url;
}

function loadProjectCostPlan() {
    var prjId = getUrlVars()['prjId'];
    var url = window.webservicePath + "/GetCostPlansByProjectId";
    $.ajax({
        type: "POST",
        url: url,
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        data: "{prjId:'" + prjId + "'}",
        success: function (data) {
            var jsdata = data.d;
            var data2Treat = jQuery.parseJSON(jsdata);
            if (data2Treat !== '-1') {
                $('#tbody_cost_plan').empty();
                var linecount = 0;
                $('#result_count').text(data2Treat.length);
                $.each(data2Treat, function (name, value) {
                    var trclass = (linecount % 2 === 0) ? "class='odd'" : "class='even'";
                    var content = "<tr " + trclass + "><td style='text-align: left'><span  onclick='viewCostPlan(\"" + value.FId + "\")' style='cursor:pointer'>" + value.CplName + "</span></td>" +
                        "<td style='text-align: left'><span  onclick='viewCostPlan(\"" + value.FId + "\")' style='cursor:pointer'>" + value.CplCode + "</span></td>" +
                        "<td style='text-align: right'>" + ReplaceNumberWithCommas(value.CplAmount) + "</td>" +
                        "<td style='text-align: left'>" + getDateString(value.CplDateCreation) + "</td></tr>";
                    $('#tbody_cost_plan').append(content);
                    linecount++;
                });
            } else {
                // authentication error
                AuthencationError();
            }
        },
        error: function (data) {
            var test = '';
        }
    });
}


function loadProjectOrder() {
    var prjId = getUrlVars()['prjId'];
    var url = window.webservicePath + "/GetClientOrderByPrjId";
    $.ajax({
        type: "POST",
        url: url,
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        data: "{prjId:'" + prjId + "'}",
        success: function (data) {
            var jsdata = data.d;
            var data2Treat = jQuery.parseJSON(jsdata);
            var budgetId = '#tbody_cost_plan';
            if (data2Treat !== '-1') {
                $(budgetId).empty();
                var linecount = 0;
                $('#result_count').text(data2Treat.length);
                $.each(data2Treat, function (name, value) {
                    var trclass = (linecount % 2 === 0) ? "class='odd'" : "class='even'";
                    var content = "<tr " + trclass + "><td style='text-align: left'><span  onclick='viewClientOrder(\"" + value.FId + "\")' style='cursor:pointer'>" + value.CodName + "</span></td>" +
                        "<td style='text-align: left'><span  onclick='viewClientOrder(\"" + value.FId + "\")' style='cursor:pointer'>" + value.CodCode + "</span></td>" +
                        "<td style='text-align: right'>" + ReplaceNumberWithCommas(value.CodAmount) + "</td>" +
                        "<td style='text-align: left'>" + getDateString(value.CodDateCreation) + "</td></tr>";
                    $(budgetId).append(content);
                    linecount++;
                });
            } else {
                // authentication error
                AuthencationError();
            }
        },
        error: function (data) {
            var test = '';
        }
    });
}


function loadProjectInvoice() {
    var prjId = getUrlVars()['prjId'];
    var url = window.webservicePath + "/GetClientInvoiceByPrjId";
    $.ajax({
        type: "POST",
        url: url,
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        data: "{prjId:'" + prjId + "'}",
        success: function (data) {
            var jsdata = data.d;
            var data2Treat = jQuery.parseJSON(jsdata);
            var budgetId = '#tbody_cost_plan';
            if (data2Treat !== '-1') {
                $(budgetId).empty();
                var linecount = 0;
                $('#result_count').text(data2Treat.length);
                $.each(data2Treat, function (name, value) {
                    var trclass = (linecount % 2 === 0) ? "class='odd'" : "class='even'";
                    var content = "<tr " + trclass + "><td style='text-align: left'><span  onclick='viewCin(\"" + value.FId + "\")' style='cursor:pointer'>" + value.CinName + "</span></td>" +
                        "<td style='text-align: left'><span  onclick='viewCin(\"" + value.FId + "\")' style='cursor:pointer'>" + value.CinCode + "</span></td>" +
                        "<td style='text-align: right'>" + ReplaceNumberWithCommas(value.CinAmount) + "</td>" +
                        "<td style='text-align: left'>" + getDateString(value.CinDCreation) + "</td></tr>";
                    $(budgetId).append(content);
                    linecount++;
                });
            } else {
                // authentication error
                AuthencationError();
            }
        },
        error: function (data) {
            var test = '';
        }
    });
}

function viewCostPlan(fId) {
    var url = '../CostPlan/CostPlan.aspx?cplId=' + fId + "&mode=view";
    document.location = url;
    return false;
}

function viewClientOrder(fId) {
    var url = '../ClientOrder/ClientOrder.aspx?codId=' + fId + "&mode=view";
    document.location = url;
    return false;
}


function viewCin(fId) {
    var url = '../ClientInvoice/ClientInvoice.aspx?cinId=' + fId + "&mode=view";
    document.location = url;
    return false;
}

function createCpl() {
    myApp.showPleaseWait();
    var prjId = getUrlVars()['prjId'];
    var url = '../CostPlan/CostPlan.aspx?prjId=' + prjId + "&mode=create";
    document.location = url;
    return false;
}