document.onkeydown = function (e) {
    var keyCode = e.keyCode || e.which || e.charCode;
    var ctrlKey = e.ctrlKey || e.metaKey;
    if (ctrlKey && keyCode === 89) {
        //alert('save');
        if (_isView) {
            GetSoldPrice();
        }
        e.preventDefault();
    }
}

function GetSoldPrice() {
    var cliId = currentCpl.CliFId;
    var height = $(window).height();
    var width = $(window).width();
    width = width * 0.8;
    width = width.toFixed(0);
    var clientname = $('#ip_Client').val();
    var url = '../Client/ClientPrice.aspx?cliId=' + cliId + '&cliname=' + clientname;
    window.open(url, 'popupWindow', 'height=' + height + ', width=' + width + ', top=0, left=0, toolbar=no, menubar=no, scrollbars=no, resizable=no,location=no, status=no');
    return false;
}

$(document).ready(initAll);
function initAll() {
    setMenu();
    var url = window.location.href.split('?')[0];
    var paras = url.split('/');
    var pagename = paras[paras.length - 1].toLowerCase();
    switch (pagename) {
        case 'costplanclientorderlist.aspx':
            loadOrder();
            break;
        case 'costplanclientinvoicelist.aspx':
            loadInvoice();
            break;
    }
}
function setMenu() {
    var prjId = getParameterByName('cplId');
    if (prjId) {
        $('.prjMenu').show();
    } else {
        $('.prjMenu').hide();
    }
}

function goClientOrderList() {
    var prjId = getUrlVars()['cplId'];
    var url = 'CostPlanClientOrderList.aspx?cplId=' + prjId;
    window.location = url;
}

function goClientInvoiceList() {
    var prjId = getUrlVars()['cplId'];
    var url = 'CostPlanClientInvoiceList.aspx?cplId=' + prjId;
    window.location = url;
}

function goCostPlanList() {
    var cplId = getUrlVars()['cplId'];
    var url = 'CostPlan.aspx?cplId=' + cplId + "&mode=view";
    window.location = url;
}

function loadOrder() {
    var cplId = getUrlVars()['cplId'];
    var url = window.webservicePath + "/GetClientOrderByCplId";
    $.ajax({
        type: "POST",
        url: url,
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        data: "{cplId:'" + cplId + "'}",
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

function viewClientOrder(fId) {
    var url = '../ClientOrder/ClientOrder.aspx?codId=' + fId + "&mode=view";
    document.location = url;
    return false;
}


function loadInvoice() {
    var cplId = getUrlVars()['cplId'];
    var url = window.webservicePath + "/GetClientInvoiceByCplId";
    $.ajax({
        type: "POST",
        url: url,
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        data: "{cplId:'" + cplId + "'}",
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

function viewCin(fId) {
    var url = '../ClientInvoice/ClientInvoice.aspx?cinId=' + fId + "&mode=view";
    document.location = url;
    return false;
}