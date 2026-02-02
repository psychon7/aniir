$(document).ready(InitShelvesAll);
function InitShelvesAll() {
    var whsId = getParameterByName('WhsId');
    getWareHouseList(whsId);
}


var WareHouseList = [];
function getWareHouseList(whsId) {
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
                setWarehouse(whsId);
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

function whs_change(sender) {
    var whsId = $(sender).find('option:selected').val() * 1;
    var oneWhs = searchFieldValueInArray(WareHouseList, 'WhsId', whsId);
    if (!jQuery.isEmptyObject(oneWhs)) {
        $('#WhsCode').val(oneWhs.WhsCode);
        $('#WhsAddress1').val(oneWhs.WhsAddress1);
        $('#WhsAddress2').val(oneWhs.WhsAddress2);
        $('#WhsPostCode').val(oneWhs.WhsPostCode);
        $('#WhsCity').val(oneWhs.WhsCity);
        $('#WhsCountry').val(oneWhs.WhsCountry);
        $('#WhsVolume').val(oneWhs.WhsVolume);
        getShelvesList(whsId);
    }
}

function setWarehouse(whsId) {
    if (WareHouseList && WareHouseList.length > 0) {
        $.each(WareHouseList, function (name, value) {
            if (value.WhsId === whsId) {
                $('#WhsId').append($("<option></option>").attr("value", value.WhsId).attr("selected", true).text(value.WhsName));
            } else {
                $('#WhsId').append($("<option></option>").attr("value", value.WhsId).text(value.WhsName));
            }
        });
    }
    $('#WhsId').change();
}




var shelves = [];
function getShelvesList(whsId) {
    //var whsId = $(sender).find('option:selected').val() * 1;
    var url = window.webservicePath + "/GetShelvesInWhsList";
    shelves = [];
    $.ajax({
        type: "POST",
        url: url,
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        data: '{whsId:' + whsId + '}',
        success: function (data) {
            var jsdata = data.d;
            var data2Treat = jQuery.parseJSON(jsdata);
            if (data2Treat !== '-1') {
                shelves = data2Treat;
                setShelves();
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


function setShelves() {
    //$('#div_shelves').empty();
    $('#tb_shelves').empty();
    if (shelves && shelves.length > 0) {
        $.each(shelves, function (name, value) {
            var onecontent = "<tr>";
            onecontent += "<td><span id='sp_shecode_" + value.SheId + "'>" + value.SheCode + "</span></td>";
            onecontent += "<td class='td_right'>" + value.SheFloor + "</td>";
            onecontent += "<td class='td_right'>" + value.SheLine + "</td>";
            onecontent += "<td class='td_right'>" + value.SheRow + "</td>";
            onecontent += "<td class='td_right'>" + value.SheLenght + "</td>";
            onecontent += "<td class='td_right'>" + value.SheWidth + "</td>";
            onecontent += "<td class='td_right'>" + value.SheHeight + "</td>";
            onecontent += "<td class='td_right'>" + value.SheAvailabelVolume + "</td>";
            onecontent += "<td class='td_right'>" + value.SumPrd + "</td>";
            onecontent += "<td class='td_center'>" +
                "<button type='button' class='btn btn-inverse' title='Mettre à jour' onclick='return UpdateShelve(" + value.SheId + ")'><i class='fa fa-refresh'></i></button>" +
                "<button type='button' class='btn btn-inverse' title='Détail' onclick='return ViewShelveDetail(" + value.SheId + ")'><i class='fa fa-eye'></i></button>" +
                "</td>";
            onecontent += "</tr>";
            $('#tb_shelves').append(onecontent);
        });
    }
}

var shelvesPrds = [];
function ViewShelveDetail(sheId) {
    //$('#div_she_prds').empty();
    var allsp_shecode = $("span[id^='sp_shecode_']");
    $.each(allsp_shecode, function (name, value) {
        $(value).removeClass('span_highlight');
    });

    $('#sp_shecode_' + sheId).addClass('span_highlight');
    sheId = isNaN(sheId) ? 0 : (sheId * 1);
    var url = window.webservicePath + "/GetProductInShelves";
    var datastr = '{sheId:' + sheId + '}';
    shelvesPrds = [];
    var oneShe = searchFieldValueInArray(shelves, 'SheId', sheId);
    if (!jQuery.isEmptyObject(oneShe)) {
        $('#span_shevel_title').text(oneShe.SheCode);
    } else {
        $('#span_shevel_title').text('');
    }
    $.ajax({
        type: "POST",
        url: url,
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        data: datastr,
        success: function (data) {
            var jsdata = data.d;
            var data2Treat = jQuery.parseJSON(jsdata);
            if (data2Treat !== '-1') {
                shelvesPrds = data2Treat;
                setShelvesPrds();
            } else {
                // authentication error
                AuthencationError();
            }
        },
        error: function (data) {
            var test = '';
        }
    });
    return false;
}

function setShelvesPrds() {
    $('#tb_she_prds').empty();
    if (shelvesPrds && shelvesPrds.length > 0) {
        $.each(shelvesPrds, function (name, value) {
            var onecontent = "<tr>";
            onecontent += "<td><span invId='" + value.InvId + "' onclick='ViewPrdInentory(" + value.InvId + ")' style='cursor: pointer; '>" + value.PrdName + "</span></td>";
            onecontent += "<td><span invId='" + value.InvId + "' onclick='ViewPrdInentory(" + value.InvId + ")' style='cursor: pointer; '>" + value.PrdRef + "</span></td>";
            onecontent += "<td class='td_right'>" + value.QuantityTotal + "</td>";
            onecontent += "<td class='td_right'>" + value.Quantity + "</td>";
            onecontent += "</tr>";
            $('#tb_she_prds').append(onecontent);
        });
    }
}

function UpdateShelve(sheId) {
    var url = "../../UCs/Warehouse/createupdateshelve.html?" + $.now();
    $.get(url, function (content) {
        sheId = isNaN(sheId) ? 0 : (sheId * 1);
        var title = 'Étagère';
        bootbox.dialog({
            title: title,
            message: content
        })
        .find('.modal-dialog').css({
            'width': '60%'
        })
        .find('.modal-content').css({
            'margin-top': function () {
                var w = $(window).height();
                var b = $(".modal-dialog").height();
                // should not be (w-h)/2
                var h = (w - b) * 0.3;
                return h + "px";
            }
        }).find('.modal-header').css({
            'background': 'url(../../img/menu_005_bg.jpg) repeat-x',
            'text-align': 'center',
            'color': '#C0C0C0'
        });

        $('#btnSaveShe').attr('sheId', sheId);

        if (sheId > 0) {
            var oneShe = searchFieldValueInArray(shelves, 'SheId', sheId);
            if (!jQuery.isEmptyObject(oneShe)) {
                $('#SheCode').val(oneShe.SheCode);
                $('#SheAvailabelVolume').val(oneShe.SheAvailabelVolume);
                $('#SheFloor').val(oneShe.SheFloor);
                $('#SheLine').val(oneShe.SheLine);
                $('#SheRow').val(oneShe.SheRow);
                $('#SheLenght').val(oneShe.SheLenght);
                $('#SheWidth').val(oneShe.SheWidth);
                $('#SheHeight').val(oneShe.SheHeight);
            }
        }
    });
    return false;
}

function SaveShelve(sender) {
    var checkOK = CheckRequiredFieldInOneDiv('div_one_shelve');
    if (checkOK) {
        ShowPleaseWait();
        var oneShe = {};
        oneShe.SheId = $('#btnSaveShe').attr('sheId') * 1;
        if (isNaN(oneShe.SheId)) {
            oneShe.SheId = 0;
        }
        oneShe.WhsId = $('#WhsId').val() * 1;
        oneShe.SheCode = $('#SheCode').val();
        oneShe.SheAvailabelVolume = $('#SheAvailabelVolume').val() * 1;
        oneShe.SheFloor = $('#SheFloor').val() * 1;
        oneShe.SheLine = $('#SheLine').val() * 1;
        oneShe.SheRow = $('#SheRow').val() * 1;
        oneShe.SheLenght = $('#SheLenght').val() * 1;
        oneShe.SheWidth = $('#SheWidth').val() * 1;
        oneShe.SheHeight = $('#SheHeight').val() * 1;
        var jsondata = JSON.stringify({ she: oneShe });
        var url = window.webservicePath + "/CreateUpdateShelve";
        $.ajax({
            url: url,
            type: 'POST',
            contentType: 'application/json; charset=utf-8',
            data: jsondata,
            dataType: 'json',
            success: function (data) {
                HidePleaseWait();
                $('#WhsId').change();
                closeDialog();
            },
            error: function (data) {
                //$('.bootbox-close-button').click();
                HidePleaseWait();
                alert(data.responseText);
            }
        });
    }
    return false;
}
var prdsShelves = [];
function ViewPrdInentory(invId) {
    var url = window.webservicePath + "/GetProductShelves";
    prdsShelves = [];
    $('#tb_prd_she').empty();
    $.ajax({
        type: "POST",
        url: url,
        contentType: "application/json; charset=utf-8",
        data: '{invId:' + invId + '}',
        dataType: "json",
        success: function (data) {
            var jsdata = data.d;
            var data2Treat = jQuery.parseJSON(jsdata);
            if (data2Treat !== '-1') {
                prdsShelves = data2Treat;
                setPrdWithShelves(invId);
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


function setPrdWithShelves(invId) {
    if (prdsShelves && prdsShelves.length > 0) {
        var headerfoot = "<tr class='tr_title'><td>Entrepôt</td><td>Code</td><td>Étage</td><td>Ligne</td><td>Rangée</td><td>Lon.(m)</td><td>Lar.(m)</td><td>Hau.(m)</td><td>Vol.(m<sup>3</sup>)</td><td>Inventoaire</td></tr>";
        var allcontent = "<table cellpadding='0' cellspacing='0' border='0' class='table table-striped table-bordered table-hover '>" +
            "<thead>" + headerfoot + "</thead><tbody>";
        var oneshePrd = searchFieldValueInArray(shelvesPrds, 'InvId', invId * 1);
        var firstRow = "";
        if (!jQuery.isEmptyObject(oneshePrd)) {
            var clickPrd = "";
            if (oneshePrd.PrdId !== 0) {
                var url = '../../Views/Product/Product.aspx?prdId=' + oneshePrd.FId + '&mode=view&hideHeader=yes&hideSideMenu=yes&hideAllBtn=yes';
                clickPrd = 'style="cursor:pointer;" title="Consulter ce produit" onclick="return pageSnapShot(\'' + url + '\')"';
            }
            firstRow += "<tr>";
            firstRow += "<td colspan='3' class='td_center'><span " + clickPrd + ">" + oneshePrd.PrdName + "</span></td>";
            firstRow += "<td colspan='3' class='td_center'><span " + clickPrd + ">" + oneshePrd.PrdRef + "</span></td>";
            firstRow += "<td colspan='3' class='td_center' style='color:red;'>TOTAL</td>";
            firstRow += "<td class='td_center' style='color:red;'>" + oneshePrd.QuantityTotal + "</td>";
            firstRow += "</tr>";
        }
        allcontent += firstRow;
        $.each(prdsShelves, function (name, value) {
            var onecontent = "<tr>";
            onecontent += "<td>" + value.WareHouseName + "</td>";
            onecontent += "<td>" + value.SheCode + "</td>";
            onecontent += "<td class='td_right'>" + value.SheFloor + "</td>";
            onecontent += "<td class='td_right'>" + value.SheLine + "</td>";
            onecontent += "<td class='td_right'>" + value.SheRow + "</td>";
            onecontent += "<td class='td_right'>" + value.SheLenght + "</td>";
            onecontent += "<td class='td_right'>" + value.SheWidth + "</td>";
            onecontent += "<td class='td_right'>" + value.SheHeight + "</td>";
            onecontent += "<td class='td_right'>" + value.SheAvailabelVolume + "</td>";
            onecontent += "<td class='td_right'>" + value.QuantityTotal + "</td>";
            onecontent += "</tr>";
            allcontent += onecontent;
            //$('#tb_prd_she').append(onecontent);
        });
        allcontent += "</tbody><tfoot>" + headerfoot + "</tfoot></table>";
        allcontent += "<div class='form-group center'><button type='button' class='btn btn-default' onclick='closeDialog()'>Clôturer</button></div>";
        var title = "L'inventaire du produit";
        bootbox.dialog({
            title: title,
            message: allcontent
        })
        .find('.modal-dialog').css({
            'width': '60%'
        })
        .find('.modal-content').css({
            'margin-top': function () {
                var w = $(window).height();
                var b = $(".modal-dialog").height();
                // should not be (w-h)/2
                var h = (w - b) * 0.3;
                return h + "px";
            }
        }).find('.modal-header').css({
            'background': 'url(../../img/menu_005_bg.jpg) repeat-x',
            'text-align': 'center',
            'color': '#C0C0C0'
        });
    }
}