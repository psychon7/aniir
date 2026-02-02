$(document).ready(initAll);

function initAll() {
    getWareHouseList();
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
                setWarehouse();
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

function setWarehouse() {
    if (WareHouseList && WareHouseList.length > 0) {
        $('#tb_warehouse').empty();
        $.each(WareHouseList, function (name, value) {
            var btns = "<button  class='btn btn-inverse' whsId='" + value.WhsId + "' title='Consulter et mettre à jour' onclick='return CreatUpdateWhs(this)'><i class='fa fa-refresh'></i></button>";
            var btnDelete = value.PrdCount > 0 ? "" : "<button  class='btn btn-inverse' whsId='" + value.WhsId + "' title='Supprimer' onclick='return DeleteWhsClick(this)'><i class='fa fa-times'></i></button>";
            var content = "<tr>";
            content += "<td>" + value.WhsName + "</td>";
            content += "<td>" + value.WhsCode + "</td>";
            content += "<td>" + value.WhsAddress1 + "</td>";
            content += "<td>" + value.WhsAddress2 + "</td>";
            content += "<td>" + value.WhsPostCode + "</td>";
            content += "<td>" + value.WhsCity + "</td>";
            content += "<td>" + value.WhsCountry + "</td>";
            content += "<td style='text-align:right'>" + value.WhsVolume + "</td>";
            content += "<td style='text-align:right'>" + value.SheCount + "</td>";
            content += "<td style='text-align:right'>" + value.PrdCount + "</td>";
            content += "<td style='text-align:center'>" + btns + btnDelete + "</td>";
            content += "</tr>";
            $('#tb_warehouse').append(content);
        });
    }
}

function CreatUpdateWhs(sender) {
    var url = "../../UCs/Warehouse/createupdatewhs.html?" + $.now();
    $.get(url, function (content) {
        var whsId = $(sender).attr('whsId') * 1;
        var title = 'Entrepôt';
        bootbox.dialog({
            title: title,
            message: content
        }).find('.modal-dialog').css({
            'width': '80%'
        }).find('.modal-content').css({
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


        $('#btnSaveWhs').attr('whsId', whsId);

        if (whsId > 0) {
            var onewhs = searchFieldValueInArray(WareHouseList, 'WhsId', whsId);
            if (!jQuery.isEmptyObject(onewhs)) {
                $('#WhsName').val(onewhs.WhsName);
                $('#WhsCode').val(onewhs.WhsCode);
                $('#WhsAddress1').val(onewhs.WhsAddress1);
                $('#WhsAddress2').val(onewhs.WhsAddress2);
                $('#WhsPostCode').val(onewhs.WhsPostCode);
                $('#WhsCity').val(onewhs.WhsCity);
                $('#WhsCountry').val(onewhs.WhsCountry);
                $('#WhsVolume').val(onewhs.WhsVolume);
            }
        }
    });
    return false;
}

function SaveOneWhs() {
    var checkOK = CheckRequiredFieldInOneDiv('div_oneWhs');
    if (checkOK) {
        var onewhs = {};
        onewhs.WhsId = $('#btnSaveWhs').attr('whsId') * 1;
        if (isNaN(onewhs.WhsId)) {
            onewhs.WhsId = 0;
        }
        onewhs.WhsName = $('#WhsName').val();
        onewhs.WhsAddress1 = $('#WhsAddress1').val();
        onewhs.WhsAddress2 = $('#WhsAddress2').val();
        onewhs.WhsPostCode = $('#WhsPostCode').val();
        onewhs.WhsCity = $('#WhsCity').val();
        onewhs.WhsCountry = $('#WhsCountry').val();
        onewhs.WhsCode = $('#WhsCode').val();
        onewhs.WhsVolume = $('#WhsVolume').val() * 1;


        var jsondata = JSON.stringify({ whs: onewhs });
        var url = window.webservicePath + "/CreateUpdateWarehouse";
        $.ajax({
            url: url,
            type: 'POST',
            contentType: 'application/json; charset=utf-8',
            data: jsondata,
            dataType: 'json',
            success: function (data) {
                location.reload();
            },
            error: function (data) {
                //$('.bootbox-close-button').click();
                alert(data.responseText);
            }
        });
    }
    return false;
}

function DeleteWhsClick(sender) {
    var whsId = $(sender).attr('whsId') * 1;
    var func = 'DeleteWhs(' + whsId + ')';
    MsgPopUpWithResponseChoice('CONFIRMATION', 'Veuillez confirmer la suppression', 'Supprimer', func, 'Annuler');
    return false;
}

function DeleteWhs(whsId) {
    if (whsId) {
        var url = window.webservicePath + "/DeleteWareHouse";
        $.ajax({
            url: url,
            type: 'POST',
            contentType: 'application/json; charset=utf-8',
            data: '{whsId:' + whsId + '}',
            dataType: 'json',
            success: function (data) {
                location.reload();
            },
            error: function (data) {
                //$('.bootbox-close-button').click();
                alert(data.responseText);
            }
        });
    }
    return false;
}