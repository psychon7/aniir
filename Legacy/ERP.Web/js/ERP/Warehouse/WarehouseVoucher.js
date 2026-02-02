$(document).ready(initPage);

function initPage() {
    $.each($('.datepicker'), function (idx, value) {
        $(value).datepicker();
    });

    loadSrv();

    initMode();
}
var currentItem = [];
function loadSrv() {
    ShowPleaseWait();
    var srvId = getParameterByName('srvId');
    var mode = getParameterByName('mode');
    if (srvId) {
        var url = window.webservicePath + "/LoadSrv";
        var datastr = "{srvId:'" + srvId + "'}";
        $.ajax({
            type: "POST",
            url: url,
            contentType: "application/json; charset=utf-8",
            data: datastr,
            dataType: "json",
            success: function (data) {
                var jsdata = data.d;
                var data2Treat = jQuery.parseJSON(jsdata);
                if (data2Treat !== '-1') {
                    var oneItem = data2Treat;
                    currentItem = [];
                    currentItem = oneItem;
                    if (currentItem.SrvIsRev) {
                        $('#SrvIsRev').click();
                        if (mode == 'modify') {
                            $('#btn_rev_shp').prop('disabled', true);
                        }
                    } else {
                        $('#btn_rev_shp').click();
                        if (mode == 'modify') {
                            $('#SrvIsRev').prop('disabled', true);
                        }
                    }
                    $('#SrvTime').val(getDateString(currentItem.SrvTime));
                    if (currentItem.SrvIsReturnClient) { $('#SrvIsReturnClient').click(); }
                    if (currentItem.SrvIsLend) { $('#SrvIsLend').click(); }
                    if (currentItem.SrvIsDestroy) { $('#SrvIsDestroy').click(); }
                    if (currentItem.SrvIsReturnSupplier) { $('#SrvIsReturnSupplier').click(); }
                    if (currentItem.SrvIsDamaged) { $('#SrvIsDamaged').click(); }
                    if (!currentItem.SrvIsReturnClient && !currentItem.SrvIsLend && !currentItem.SrvIsDestroy && !currentItem.SrvIsReturnSupplier && !currentItem.SrvIsDamaged) {
                        $('#SrvOther').click();
                    }

                    $('#SrvDReturnClient').val(getDateString(currentItem.SrvDReturnClient));
                    $('#SrvDLendReturnPre').val(getDateString(currentItem.SrvDLendReturnPre));
                    $('#SrvDDestroy').val(getDateString(currentItem.SrvDDestroy));
                    $('#SrvDReturnSupplier').val(getDateString(currentItem.SrvDReturnSupplier));

                    $('#SrvClient').text(currentItem.SrvClient);
                    $('#SrvDescription').text(currentItem.SrvDescription);
                    $('#CreatorName').val(currentItem.Creator.FullName);
                    $('#SrvTotalReal').val(currentItem.SrvTotalReal);

                    // disabled all
                    if (_isView) {
                        $('#SrvIsRev').prop('disabled', true);
                        $('#btn_rev_shp').prop('disabled', true);

                        $('#SrvIsReturnClient').prop('disabled', true);
                        $('#SrvIsLend').prop('disabled', true);
                        $('#SrvIsDestroy').prop('disabled', true);
                        $('#SrvIsReturnSupplier').prop('disabled', true);
                        $('#SrvIsDamaged').prop('disabled', true);
                        $('#SrvOther').prop('disabled', true);
                        
                        $('#SrvDReturnClient').prop('disabled', true);
                        $('#SrvDLendReturnPre').prop('disabled', true);
                        $('#SrvDDestroy').prop('disabled', true);
                        $('#SrvDReturnSupplier').prop('disabled', true);
                        $('#SrvClient').prop('disabled', true);
                        $('#SrvDescription').prop('disabled', true);
                        $('#CreatorName').prop('disabled', true);

                    }
                    if (currentItem.SrvValid) {
                        $('#th_srl_btns_space').remove();
                    } else {
                        $('#btn_delete').show();
                        $('#btn_validate').show();
                    }

                    var linecount = 1;
                    if (currentItem.SrlLines && currentItem.SrlLines.length > 0) {
                        $.each(currentItem.SrlLines, function (name, value) {
                            var lineclass = (linecount % 2 === 1) ? "odd" : "even";
                            var oneline = '<tr class=' + lineclass + '>';
                            oneline += '<td class="label_left" ><span style="cursor:pointer" onclick="return ViewSolDetail(this)" sodId="' + value.SodFId + '" solid="' + value.SolId + '"  title="view details 细节" >' + value.SodCode + '</span></td>';
                            oneline += '<td class="label_left"><span style="cursor:pointer" onclick="return ViewLgsDetail(this)" lgsId="' + value.LgsFId + '" title="view details 细节" >' + value.LgsCode + '</span></td>';
                            oneline += '<td class="label_center">' + value.SolQuantity + '</td>';
                            oneline += '<td class="label_center">' + value.QuantityForLgl + '</td>';
                            oneline += '<td class="label_left">' + value.SrlPrdName + '</td>';
                            oneline += '<td class="label_left">' + value.SrlPrdRef + '</td>';
                            oneline += '<td style="max-width:300px;"  class="label_left">' + value.SrlPrdDes + '</td>';
                            oneline += '<td style="max-width:300px;"  class="label_left">' + value.SrlDescription + '</td>';
                            oneline += '<td class="label_right">' + value.SrlQuantityReal + '</td>';
                            oneline += '<td class="label_right">' + value.SrlUnitPrice + '</td>';
                            oneline += '<td class="label_right">' + value.SrlTotalPriceReal + '</td>';
                            oneline += '<td class="label_left">' + value.WhsCode + '</td>';
                            oneline += '<td class="label_left">' + value.SheCode + '</td>';
//                            var btns = currentItem.SrvValid ? "" : ("<td>" +
//                            "<button type='button' class='btn btn-inverse' title='Mettre à jour' onclick='return UpdateSrl(" + value.SrlId + ")'><i class='fa fa-refresh'></i></button>" +
//                            "<button type='button' class='btn btn-inverse' title='Supprimer' onclick='return DeleteSrlClick(" + value.SrlId + ")'><i class='fa fa-times'></i></button>" + "</td>");
//                            oneline += btns;
                            oneline +='</tr>';
                            $('#tbody_srl').append(oneline);
                            linecount++;
                        });
                    }
                    HidePleaseWait();
                } else {
                    // authentication error
                    AuthencationError();
                    HidePleaseWait();
                }
            },
            error: function (data) {
                var test = '';
                HidePleaseWait();
            }
        });
    }
}

function ValidSrvClick() {
    
    
    return false;
}

function RevShpClick(sender) {
    var id = $(sender).attr('id');
    var ischeck = $(sender).is(':checked');
    var shipping = false;
    if (id === 'SrvIsRev') {
        if (ischeck) {
            shipping = false;
        } else {
            shipping = true;
        }
    } else {
        if (ischeck) {
            shipping = true;
        } else {
            shipping = false;
        }
    }
    if (shipping) {
        $('#div_she_prds_for_update').show();
        $('.shippingcls').show();
        $('.receivingcls').hide();
        $('#SrvTotalReal').css('color', 'red');
        $('#btnAddShe').hide();
        // remove psh added lines
        var alltr = $("tr[id^='tr_psh_']");
        try {
            $.each(alltr, function (name, value) {
                $(value).remove();
            });
        } catch (e) {

        }

    } else {
        $('#div_she_prds_for_update').show();
        $('.shippingcls').hide();
        $('.receivingcls').show();
        $('#SrvTotalReal').css('color', 'green');
        $('#btnAddShe').show();
    }
}

function shipBtnClick(sender) {
    var id = $(sender).attr('id');
    var ischeck = $(sender).is(':checked');
    if (id === 'SrvIsLend') {
        $('#SrvDLendReturnPre').prop("disabled", false);
        $('#SrvDDestroy').prop("disabled", true);
        $('#SrvDReturnSupplier').prop("disabled", true);
        $('#SrvDDamaged').prop("disabled", true);
        $('#SrvDLendReturnPre').val('');
        $('#SrvDDestroy').val('');
        $('#SrvDReturnSupplier').val('');
        $('#SrvDDamaged').val('');
    }
    else if (id === 'SrvIsDestroy') {
        $('#SrvDLendReturnPre').prop("disabled", true);
        $('#SrvDDestroy').prop("disabled", false);
        $('#SrvDReturnSupplier').prop("disabled", true);
        $('#SrvDDamaged').prop("disabled", true);
        $('#SrvDLendReturnPre').val('');
        $('#SrvDDestroy').val('');
        $('#SrvDReturnSupplier').val('');
        $('#SrvDDamaged').val('');
    }
    else if (id === 'SrvIsReturnSupplier') {
        $('#SrvDLendReturnPre').prop("disabled", true);
        $('#SrvDDestroy').prop("disabled", true);
        $('#SrvDReturnSupplier').prop("disabled", false);
        $('#SrvDDamaged').prop("disabled", true);
        $('#SrvDLendReturnPre').val('');
        $('#SrvDDestroy').val('');
        $('#SrvDReturnSupplier').val('');
        $('#SrvDDamaged').val('');
    }
    else if (id === 'SrvIsDamaged') {
        $('#SrvDLendReturnPre').prop("disabled", true);
        $('#SrvDDestroy').prop("disabled", true);
        $('#SrvDReturnSupplier').prop("disabled", true);
        $('#SrvDDamaged').prop("disabled", false);
        $('#SrvDLendReturnPre').val('');
        $('#SrvDDestroy').val('');
        $('#SrvDReturnSupplier').val('');
        $('#SrvDDamaged').val('');
    } else {
        $('#SrvDLendReturnPre').prop("disabled", true);
        $('#SrvDDestroy').prop("disabled", true);
        $('#SrvDReturnSupplier').prop("disabled", true);
        $('#SrvDDamaged').prop("disabled", true);
        $('#SrvDLendReturnPre').val('');
        $('#SrvDDestroy').val('');
        $('#SrvDReturnSupplier').val('');
        $('#SrvDDamaged').val('');
    }
}

function ViewSolDetail(sender) {
    var solid = $(sender).attr('solId') * 1;
    var sodId = $(sender).attr('sodId');
    //console.log(sodId);
    var url = '../SupplierOrder/SupplierOrder.aspx?sodId=' + sodId + "&mode=view&solId=" + solid;
    window.open(url, '_blank');
    return false;
}


function ViewLgsDetail(sender) {
    var lgsId= $(sender).attr('lgsId');
    //console.log(sodId);
    var url = '../Logistics/Logistics.aspx?lgsId=' + lgsId + "&mode=view";
    window.open(url, '_blank');
    return false;
}