$(document).ready(initSearch);
function initSearch() {
    $.each($('.datepicker'), function (idx, value) {
        $(value).datepicker();
    });

    getWareHouseList();
    getShelvesList();
}


var shelves = [];
function getShelvesList() {
    var url = window.webservicePath + "/GetAllShelvesList";
    shelves = [];
    $.ajax({
        type: "POST",
        url: url,
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        success: function (data) {
            var jsdata = data.d;
            var data2Treat = jQuery.parseJSON(jsdata);
            if (data2Treat !== '-1') {
                shelves = data2Treat;
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

var WareHouseList = [];
function getWareHouseList() {
    var url = window.webservicePath + "/GetWareHousesList";
    WareHouseList = [];
    $.ajax({
        type: "POST",
        url: url,
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        success: function (data) {
            var jsdata = data.d;
            var data2Treat = jQuery.parseJSON(jsdata);
            if (data2Treat !== '-1') {
                WareHouseList = data2Treat;
                $('#WhsId').empty();
                if (WareHouseList && WareHouseList.length > 0) {
                    $('#WhsId').append($("<option></option>").attr("value", 0).text('Sélectionner un entrepôt'));
                    $.each(WareHouseList, function (name, value) {
                        $('#WhsId').append($("<option>" + value.WhsName + "</option>").attr("value", value.WhsId));
                    });
                }

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

function WhsChange(sender) {
    var whsId = $(sender).find('option:selected').val() * 1;
    var shes = searchInArray(shelves, 'WhsId', whsId);
    var SrlShe_id = "#SheId";
    $(SrlShe_id).empty();
    if (shes && shes.length > 0) {
        $(SrlShe_id).append($("<option></option>").attr("value", 0).text('Sélectionner un étage'));
        $.each(shes, function (name, value) {
            $(SrlShe_id).append($("<option></option>").attr("value", value.SheId).text(value.SheCode + " | ÉTAGE: " + value.SheFloor + " | LIGNE: " + value.SheLine + " | RANGÉE: " + value.SheRow));
        });
    } else {
        $(SrlShe_id).append($("<option></option>").attr("value", 0).text('Sélectionner un étage'));
    }
    $(SrlShe_id).change();
}


function js_search() {
    var url = window.webservicePath + "/SearchVoucher";
    var client = $('#SrvClient').val();
    var produit = $('#SrvPrd').val();
    var WhsId = $('#WhsId').val();
    var SheId = $('#SheId').val();
    var _from = getDateFromStringFr('#_SrvTimeFrom');
    var _to = getDateFromStringFr('#_SrvTimeTo');

    //    _from = _from.indexOf('/') ? _from : null;
    //    _to = _to.indexOf('/') ? _to : null;

    var jsondata = JSON.stringify({ client: client, produit: produit, whsId: WhsId, sheId: SheId, from: _from, to: _to });
    ShowPleaseWait();
    $.ajax({
        url: url,
        type: 'POST',
        contentType: 'application/json; charset=utf-8',
        data: jsondata,
        dataType: 'json',
        success: function (data) {
            var jsdata = data.d;
            var jsondata = jQuery.parseJSON(jsdata);
            if (jsondata.length === 0) {
                NoResultMsg();
                HidePleaseWait();
            } else {
                setVoucher(jsondata);
            }
            //viewSearchResult(jsondata);
        },
        error: function (data) {
            alert(data.responseText);
            myApp.hidePleaseWait();
        }
    });
    return false;
}

var hasSet = false;
function setVoucher(data2Treat) {
    var name = '_pins';
    var dt_name = 'dt' + name;
    var div_name = 'div' + name;
    var th_name = 'th' + name;
    var tb_name = 'tb' + name;
    var tf_name = 'tf' + name;
    var rst_name = 'rst' + name;

    var headerFooter = "<tr>" +
        "<th style='text-align:center'>Entrepôt</th>" +
        "<th style='text-align:center'>Code (Aperçu)</th>" +
        "<th style='text-align:center'>IN / OUT</th>" +
        "<th style='text-align:center'>Client / Founisseur</th>" +
        "<th style='text-align:center'>Quantité</th>" +
        "<th style='text-align:center'>Date</th>" +
        "</tr>";

    try {
        $('#' + dt_name).remove();
        var datatableContent = "<table id='" + dt_name + "' cellpadding='0' cellspacing='0' border='0' class='datatable table table-striped table-bordered table-hover'>" +
                        "<thead id='" + th_name + "'>" +
                        headerFooter +
                        "</thead>" +
                        "<tbody id='" + tb_name + "'></tbody>" +
                        "<tfoot id='" + tf_name + "'>" +
                        headerFooter +
                        "</tfoot>" +
                        "</table>";
        $('#' + div_name).html(datatableContent);

    } catch (e) {
        var test = '';
    }
    var resultcount = data2Treat.length;
    $('#' + rst_name).text(resultcount);
    if (resultcount > 0) {
        $('.searchresult').show();
        $('#' + th_name).empty();
        $('#' + tf_name).empty();

        $('#' + th_name).append(headerFooter);
        $('#' + tf_name).append(headerFooter);

        var titles = new Array();
        titles.push({ "sTitle": "Warehouse" });
        titles.push({ "sTitle": "Code" });
        titles.push({ "sTitle": "InOut" });
        titles.push({ "sTitle": "Client" });
        titles.push({ "sTitle": "Quantity" });
        titles.push({ "sTitle": "Date" });

        var displaycount = 1;
        $.each(data2Treat, function (name, value) {
            var dataArray = new Array();
            dataArray.push("<span onclick='viewItem(\"" + value.FId + "\")' style='cursor:pointer'>" + value.WareHouse + "</span>");
            dataArray.push("<span  onclick='viewItem(\"" + value.FId + "\")' style='cursor:pointer'>" + value.SrvCode + "</span>");
            var inout = "<span onclick='viewItem(\"" + value.FId + "\")'  style='color: " + (value.SrvIsRev ? "green" : "red") + "'>" + (value.SrvIsRev ? "IN" : "OUT") + "</span>";
            dataArray.push(inout);
            dataArray.push("<span onclick='viewItem(\"" + value.FId + "\")' style='cursor:pointer'>" + value.SrvClient + "</span>");
            dataArray.push("<span onclick='viewItem(\"" + value.FId + "\")' style='cursor:pointer'>" + value.SrvTotalReal + "</span>");
            dataArray.push(getDateString(value.SrvTime));
            try {
                $('#' + dt_name).dataTable().fnAddData(dataArray);
            } catch (e) {
                var test = '';
            }
            displaycount++;
        });

        if (hasSet) {
            try {
                $('#' + dt_name).dataTable({
                    "sPaginationType": "bs_full",
                    "bDestroy": true,
                    "bRetrieve": true,
                    "bServerSide": true,
                    "bProcessing": true,
                    "aoColumns": titles,
                    "sScrollY": "50px",
                    "bScrollCollapse": true
                });

            } catch (e) {
                var testestst = "";
            }
        }

        try {
            if (!hasSet) {
                hasSet = true;
            }
        } catch (e) {

        }
    } else {
        $('.searchresult').hide();
    }
    HidePleaseWait();

}

function viewItem(fId) {
    ShowPleaseWait();
    var url = 'WarehouseVoucher.aspx?srvId=' + fId + "&mode=view";
    window.location.href = url;
}