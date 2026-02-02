$(document).ready(iniAllProductInv);

function iniAllProductInv() {
    //getAllPitInventory();
    getWareHouseList();
    getShelvesList();
    getProductTypes();
}



var shelves = [];
function getShelvesList() {
    //var whsId = $(sender).find('option:selected').val() *1;
    var url = window.webservicePath + "/GetAllShelvesList";
    shelves = [];
    $.ajax({
        type: "POST",
        url: url,
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        success: function(data) {
            var jsdata = data.d;
            var data2Treat = jQuery.parseJSON(jsdata);
            if (data2Treat !== '-1') {
                shelves = data2Treat;
            } else {
                // authentication error
                AuthencationError();
            }
        },
        error: function(data) {
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
        success: function(data) {
            var jsdata = data.d;
            var data2Treat = jQuery.parseJSON(jsdata);
            if (data2Treat !== '-1') {
                WareHouseList = data2Treat;
            } else {
                // authentication error
                AuthencationError();
            }
        },
        error: function(data) {
            var test = '';
        }
    });
}



var pitList = [];
function getAllPitInventory(invId) {
    ShowPleaseWait();
    var url = window.webservicePath + "/GetPitForInventory";
    pitList = [];
    $.ajax({
        type: "POST",
        url: url,
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        success: function (data) {
            var jsdata = data.d;
            var data2Treat = jQuery.parseJSON(jsdata);
            if (data2Treat !== '-1') {
                pitList = data2Treat;
                setPitList();

                if (invId > 0) {
                    //$('#btn_pitshelve_' + invId).click();
                    ViewPitShelveDetail(invId);
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

function setPitList_Old() {
    //$('#div_shelves').empty();
    $('#tb_pit_inv').empty();
    if (pitList && pitList.length > 0) {
        $.each(pitList, function (name, value) {
            var propdes = "";
            if (value.PitAllInfo && value.PitAllInfo.length > 0) {
                $.each(value.PitAllInfo, function (order, propvalue) {
                    if (propvalue && propvalue.PropValue) {
                        propdes += propvalue.PropName + " : " + propvalue.PropValue + " " + propvalue.PropUnit + "\r\n";
                    }
                });
            }
            var alldes = (value.PrdDescription !== null && value.PrdDescription !== "") ? (value.PrdDescription + "\r\n") : "";
            if (value.PitId !== 0) {
                var PrdOutsideDiameter = value.PrdOutsideDiameter;
                var PrdLength = value.PrdLength;
                var PrdWidth = value.PrdWidth;
                var PrdHeight = value.PrdHeight;
                var additionnalInfo = "";
                if (PrdOutsideDiameter) {
                    additionnalInfo += "Diamètre extérieur : " + PrdOutsideDiameter + " mm\r\n";
                }
                if (PrdLength) {
                    additionnalInfo += "Longueur : " + PrdLength + " mm\r\n";
                }
                if (PrdWidth) {
                    additionnalInfo += "Largeur : " + PrdWidth + " mm\r\n";
                }
                if (PrdHeight) {
                    additionnalInfo += "Hauteur : " + PrdHeight + " mm";
                }
                alldes = propdes.trim() + "\r\n" + additionnalInfo.trim();
                alldes = replaceAll(alldes, "\r\n", "<br/>");
            }
            var onecontent = "<tr>";
            onecontent += "<td>" + value.ProductType + "</span></td>";
            onecontent += "<td>" + (value.PrdSubName !== null ? value.PrdSubName : "") + "</td>";
            onecontent += "<td><span id='sp_invid_" + value.InvId + "'>" + value.PrdName + "</span></td>";
            onecontent += "<td>" + value.PitRef + "</td>";
            onecontent += "<td>" + alldes + "</td>"; ;
            onecontent += "<td class='td_right'>" + value.PitInventory + "</td>";
            onecontent += "<td class='td_center'><button type='button' class='btn btn-inverse' title='Détail' id='btn_pitshelve_" + value.InvId + "' onclick='return ViewPitShelveDetail(" + value.InvId + ")'><i class='fa fa-eye'></i></button></td>";
            onecontent += "</tr>";
            $('#tb_pit_inv').append(onecontent);
        });
    }
    HidePleaseWait();
}

var hasSet = false;

function setPitList() {
    //$('#div_shelves').empty();
    //$('#tb_pit_inv').empty();
    ShowPleaseWait();

    var headerFooter = "<tr>" +
        "<th>Type</th>" +
        "<th>Famille</th>" +
        "<th>Nom</th>" +
        "<th>Réf.</th>" +
        "<th>Description</th>" +
        "<th>Inventaire</th>" +
        "<th></th>" +
        "</tr>";

    try {
    
                    $('#datatable_search_result').remove();
        var datatableContent = "<table id='datatable_search_result' cellpadding='0' cellspacing='0' border='0' class='datatable table table-striped table-bordered table-hover'>" +
            "<thead id='thead_search_result'>" +
            headerFooter +
            "</thead>" +
            "<tbody id='tbody_search_result'></tbody>" +
            "<tfoot id='tfoot_search_result'>" +
            headerFooter +
            "</tfoot>" +
            "</table>";
        $('#div_shelves').html(datatableContent);

    } catch (e) {
        var test = '';
    }
    var resultcount = pitList.length;
    $('#result_count').text(resultcount);
    if (resultcount > 0) {
        $('.searchresult').show();
        $('#mask_processing').text(resultcount + ' resultats ...');
        $('#mask_processing').val(resultcount + ' resultats ...');

        $('#thead_search_result').empty();
        $('#tfoot_search_result').empty();

        $('#thead_search_result').append(headerFooter);
        $('#tfoot_search_result').append(headerFooter);

        var titles = new Array();
        titles.push({ "sTitle": "prdsubname" });
        titles.push({ "sTitle": "prdname" });
        titles.push({ "sTitle": "pitref" });
        titles.push({ "sTitle": "des" });
        titles.push({ "sTitle": "inventory" });
        titles.push({ "sTitle": "" });

        $.each(pitList, function(name, value) {
                var propdes = "";
            if (value.PitAllInfo && value.PitAllInfo.length > 0) {
                $.each(value.PitAllInfo, function(order, propvalue) {
                    if (propvalue && propvalue.PropValue) {
                        propdes += propvalue.PropName + " : " + propvalue.PropValue + " " + propvalue.PropUnit + "\r\n";
                    }
                });
            }
            var alldes = (value.PrdDescription !== null && value.PrdDescription !== "") ? (value.PrdDescription + "\r\n") : "";
            if (value.PitId !== 0) {
                var PrdOutsideDiameter = value.PrdOutsideDiameter;
                var PrdLength = value.PrdLength;
                var PrdWidth = value.PrdWidth;
                var PrdHeight = value.PrdHeight;
                var additionnalInfo = "";
                if (PrdOutsideDiameter) {
                    additionnalInfo += "Diamètre extérieur : " + PrdOutsideDiameter + " mm\r\n";
                }
                if (PrdLength) {
                    additionnalInfo += "Longueur : " + PrdLength + " mm\r\n";
                }
                if (PrdWidth) {
                    additionnalInfo += "Largeur : " + PrdWidth + " mm\r\n";
                }
                if (PrdHeight) {
                    additionnalInfo += "Hauteur : " + PrdHeight + " mm";
                }
                alldes = propdes.trim() + "\r\n" + additionnalInfo.trim();
                alldes = replaceAll(alldes, "\r\n", "<br/>");
            }


            var dataArray = new Array();
            dataArray.push(value.ProductType);
            dataArray.push(value.PrdSubName !== null ? value.PrdSubName : "");
            dataArray.push("<span id='sp_invid_" + value.InvId + "'>" + value.PrdName + "</span>");
            dataArray.push(value.PitRef);
            dataArray.push(alldes);
            dataArray.push(value.PitInventory);
            dataArray.push("<button type='button' class='btn btn-inverse' title='Détail' id='btn_pitshelve_" + value.InvId + "' onclick='return ViewPitShelveDetail(" + value.InvId + ")'><i class='fa fa-eye'></i></button>");

            try {
                $('#datatable_search_result').dataTable().fnAddData(dataArray);
            } catch (e) {
                var test = '';
            }

        });


        if (hasSet) {
            try {

                $('#datatable_search_result').dataTable({
                    "sPaginationType": "bs_full",
                    "bDestroy": true,
                    "bRetrieve": true,
                    "bServerSide": true,
                    "bProcessing": true,
                    "aoColumns": titles
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
    }


    HidePleaseWait();
}

var prdsShelves = [];
function ViewPitShelveDetail(invId) {
    ShowPleaseWait();
    var allsp_invid = $("span[id^='sp_invid_']");
    $('#btn_update_psh_direct').show();
    $('#btn_update_psh_direct').removeAttr('onclick');
    var clickevt = 'return UpdateSheInventoryClick('+invId+')';
    $('#btn_update_psh_direct').attr('onclick', clickevt);
    //$('#btn_update_psh_direct').
    $.each(allsp_invid, function (name, value) {
        $(value).removeClass('span_highlight');
    });
    $('#sp_invid_' + invId).addClass('span_highlight');
    $('#span_prd_title').text($('#sp_invid_' + invId).text());
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
                setPrdShelves(invId);
            } else {
                // authentication error
                AuthencationError();
            }
            HidePleaseWait();
        },
        error: function (data) {
            var test = '';
            
            HidePleaseWait();
        }
    });
}

function setPrdShelves(invId) {
    if (prdsShelves && prdsShelves.length > 0) {
        var oneprd = searchFieldValueInArray(pitList, 'InvId', invId * 1);
//        if (!jQuery.isEmptyObject(oneprd)) {
//            //console.log(oneprd);
//            //$('#span_prd_title').text(oneprd.ProductType + " " + (oneprd.PrdSubName !== null ? oneprd.PrdSubName : "") + oneprd.PrdName + " " + (oneprd.PrdRef !== null ? oneprd.PrdRef : ""));
//            //$('#span_prd_title').text(oneprd.PrdName);
//        } else {
//            $('#span_prd_title').text('');
//        }
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
            //onecontent += "<td class='td_center'><button type='button' class='btn btn-inverse' title='Détail' onclick='return UpdateSheInventoryClick(" + value.InvId + ")'><i class='fa fa-refresh'></i></button></td>";
            onecontent += "</tr>";
            $('#tb_prd_she').append(onecontent);
        });
    }
}


function UpdateSheInventoryClick(invId) {
    //alert(pshId);
    var clickEvent = "UpdateSheInventory(" + invId + ")";
    MsgPopUpWithResponseChoice('CONFIRMATION', 'Veuillez mettre à jour l\'inventaire directement ? ', 'OUI', clickEvent, 'NON');
    return false;
}

function UpdateSheInventory(invId) {
    //alert(pshId);
    var url = "../../UCs/Warehouse/shippingreceivingform.html?" + $.now();
    $.get(url, function (content) {
        var title = 'Déstockage / Emmagasinage';
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
                var h = (w - b) * 0.1;
                return h + "px";
            }
        }).find('.modal-header').css({
            'background': 'url(../../img/menu_005_bg.jpg) repeat-x',
            'text-align': 'center',
            'color': '#C0C0C0'
        });
        $.each($('.datepicker'), function (idx, value) {
            $(value).datepicker();
        });
        $('#span_prd_title_for_update').text($('#span_prd_title').text());

        if (prdsShelves && prdsShelves.length > 0) {
            var oneprd = searchFieldValueInArray(pitList, 'InvId', invId * 1);
//            if (!jQuery.isEmptyObject(oneprd)) {
//                //$('#span_prd_title').text(oneprd.ProductType + " " + (oneprd.PrdSubName !== null ? oneprd.PrdSubName : "") + oneprd.PrdName + " " + (oneprd.PrdRef !== null ? oneprd.PrdRef : ""));
//                $('#span_prd_title').text(oneprd.PrdName);
//            } else {
//                $('#span_prd_title').text('');
//            }
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
                onecontent += "<td class='td_right' style='width:100px;'><input type='number' class='form-control' value='0' id='ip_psh_" + value.PshId + "' invid='" + value.InvId + "' pshid='" + value.PshId + "' onkeyup='ModifyPshQuantity(this)' min='0' whsid='" + value.WhsId + "' sheId='" + value.SheId + "'/></td>";
                onecontent += "<td class='td_right'><span id='sp_psh_rest_tt_qty_" + value.PshId + "'>" + value.QuantityTotal + "</span></td>";
                onecontent += "<td></td>";
                onecontent += "</tr>";
                $('#tb_prd_she_for_update').append(onecontent);
            });
        }

        $('#btnSaveSrv').attr('invId', invId);
        $('#btnAddShe').attr('invId', invId);
    });

    return false;
}

///////////// START for page shiipingreceivingform.html
function ModifyPshQuantity(sender) {
    var pshId = $(sender).attr('pshid');
    var quantity = $(sender).val();
    quantity = isNaN(quantity) ? 0 : (quantity * 1);
    if (quantity >= 0) {
        var onepsh = searchFieldValueInArray(prdsShelves, 'PshId', pshId * 1);
        var spanId = 'sp_psh_rest_tt_qty_' + pshId;
        var receive = $('#SrvIsRev').is(':checked');
        if (!jQuery.isEmptyObject(onepsh)) {
//            var spanId = 'sp_psh_rest_tt_qty_' + pshId;
//            var receive = $('#SrvIsRev').is(':checked');
            var restQty = receive ? (onepsh.QuantityTotal + quantity) : (onepsh.QuantityTotal - quantity);
            if (restQty >= 0) {
                $('#' + spanId).text(restQty);
            } else {
                $('#' + spanId).text(0);
                $(sender).val(onepsh.QuantityTotal);
            }
        } else {
            var restQty = quantity;
            if (restQty >= 0) {
                $('#' + spanId).text(restQty);
            } else {
                $('#' + spanId).text(0);
                $(sender).val(0);
            }
        }
    } else {
        quantity = quantity * (-1);
        $(sender).val(quantity);
    }
    calculateTotalReal();
}

function calculateTotalReal() {
    var ip_pshs = $("input[id^='ip_psh_']");
    var total = 0;
    $.each(ip_pshs, function(name, value) {
        var qty = $(value).val();
        qty = isNaN(qty) ? 0 : (qty * 1);
        total += qty;
    });
    $('#SrvTotalReal').val(total);
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
        var alltr= $("tr[id^='tr_psh_']");
        try {
            $.each(alltr, function(name, value) {
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

function CreateSRVClick() {
    // check quantity
    var qty = $('#SrvTotalReal').val();
    qty = isNaN(qty) ? 0 : (qty * 1);
    if (qty <= 0) {
        alert('La quantité doit être supérieure à zéro !');
    } else {
        ShowPleaseWait();
        var invId = $('#btnSaveSrv').attr('invid');
        invId = isNaN(invId) ? 0 : (invId * 1);
        if (invId > 0) {
            var srv = {};
            srv.InvId = invId;
            srv.SrvIsRev = $('#SrvIsRev').is(':checked');
            srv.SrvIsReturnClient = $('#SrvIsReturnClient').is(':checked');
            srv.SrvDReturnClient = getDateFromStringFr($('#SrvDReturnClient'));

            srv.SrvIsLend = $('#SrvIsLend').is(':checked');
            srv.SrvDLendReturnPre = getDateFromStringFr($('#SrvDLendReturnPre'));

            srv.SrvIsDestroy = $('#SrvIsDestroy').is(':checked');
            srv.SrvDDestroy = getDateFromStringFr($('#SrvDDestroy'));

            srv.SrvIsReturnSupplier = $('#SrvIsReturnSupplier').is(':checked');
            srv.SrvDReturnSupplier = getDateFromStringFr($('#SrvDReturnSupplier'));

            srv.SrvIsDamaged = $('#SrvIsDamaged').is(':checked');
            srv.SrvDDamaged = getDateFromStringFr($('#SrvDDamaged'));

            srv.SrvClient = $('#SrvClient').val();
            srv.SrvDescription = $('#SrvDescription').val();
            srv.SrvTotalReal = $('#SrvTotalReal').val();

            var lines = [];

            var ip_pshs = $("input[id^='ip_psh_']");
            $.each(ip_pshs, function (name, value) {
                var qty = $(value).val();
                qty = isNaN(qty) ? 0 : (qty * 1);
                if (qty !== 0) {
                    var oneline = {};
                    oneline.SrlQuantityReal = qty;
                    oneline.WhsId = $(value).attr('whsid') * 1;
                    oneline.SheId = $(value).attr('sheid') * 1;
                    oneline.PshId = $(value).attr('pshid') * 1;
                    oneline.InvId = $(value).attr('invid') * 1;
                    lines.push(oneline);
                }
            });
            var jsondata = JSON.stringify({ srvForm: srv, lines: lines });
            var url = window.webservicePath + "/CreateSrvDirectAndChangeInventory";
            $.ajax({
                url: url,
                type: 'POST',
                contentType: 'application/json; charset=utf-8',
                data: jsondata,
                dataType: 'json',
                success: function (data) {
                    closeDialog();
                    HidePleaseWait();
                    searchprd(invId);
                    //ViewPitShelveDetail(invId);
                    //$('#btn_pitshelve_' + invId).click();
                },
                error: function (data) {
                    //$('.bootbox-close-button').click();
                    HidePleaseWait();
                    alert(data.responseText);
                }
            });


        }
    }
    return false;
}

var pshcount = 0;

function AddShe2Inv(sender) {
    pshcount --;
    var invId = $(sender).attr('invid') * 1;
    var newline = "<tr id='tr_psh_pshcount'>";
    newline += "<td><select class='form-control' id='Whs_pshcount' onchange='WhsChange(this)' pshid='" + pshcount + "' ></select></td>";
    newline += "<td><select class='form-control' id='She_pshcount' pshid='" + pshcount + "' onchange='SheChange(this)' ></select></td>";
    newline += "<td class='td_right'><span id='sp_floor_pshcount'></span></td>";
    newline += "<td class='td_right'><span id='sp_line_pshcount'></span></td>";
    newline += "<td class='td_right'><span id='sp_row_pshcount'></span></td>";
    newline += "<td class='td_right'><span id='sp_lenght_pshcount'></span></td>";
    newline += "<td class='td_right'><span id='sp_width_pshcount'></span></td>";
    newline += "<td class='td_right'><span id='sp_height_pshcount'></span></td>";
    newline += "<td class='td_right'><span id='sp_availabelvolume_pshcount'></span></td>";
    newline += "<td class='td_right'>0</td>";
    newline += "<td class='td_right' style='width:100px;'><input type='number' class='form-control' value='0' id='ip_psh_pshcount' invid='" + invId + "' pshid='" + pshcount + "' onkeyup='ModifyPshQuantity(this)'></td>";
    newline += "<td class='td_right'><span id='sp_psh_rest_tt_qty_" + pshcount + "'>0</span></td>";
    newline += "<td><button class='btn btn-inverse' id='btn_rmv_psh_pshcount' pshid='" + pshcount + "'  onclick='return Removepsh(this)'><i class='fa fa-times'></i></button></td></tr>";
    newline = replaceAll(newline, '_pshcount', '_' + pshcount);
    $('#tb_prd_she_for_update').append(newline);

    if (WareHouseList && WareHouseList.length > 0) {
        $.each(WareHouseList, function(name, value) {
            $("#Whs_" + pshcount).append($("<option>" + value.WhsName + "</option>").attr("value", value.WhsId));
        });
    }
    $("#Whs_" + pshcount).change();

    return false;
}

function Removepsh(sender) {
    var pshid = $(sender).attr('pshid') * 1;
    $('#tr_psh_' + pshid).remove();
    calculateTotalReal();
    return false;
}

function WhsChange(sender) {
    var whsId = $(sender).find('option:selected').val() * 1;
    var pshid = $(sender).attr('pshid') * 1;
    var shes = searchInArray(shelves, 'WhsId', whsId);
    var SrlShe_id = "#She_" + pshid;
    $(SrlShe_id).empty();
    if (shes && shes.length > 0) {
        $.each(shes, function(name, value) {
            $(SrlShe_id).append($("<option></option>").attr("value", value.SheId).text(value.SheCode + " | ÉTAGE: " + value.SheFloor + " | LIGNE: " + value.SheLine + " | RANGÉE: " + value.SheRow));
        });
    }
    $('#ip_psh_' + pshid).attr('whsid', whsId);
    $(SrlShe_id).change();
}

function SheChange(sender) {
    var pshId= $(sender).attr('pshid') * 1;
    var sheId= $(sender).find('option:selected').val() * 1;
    var oneshe = searchFieldValueInArray(shelves, 'SheId', sheId);
    $('#ip_psh_' + pshId).attr('sheId', sheId);
    if (!jQuery.isEmptyObject(oneshe)) {
        $('#sp_floor_' + pshId).text(oneshe.SheFloor);
        $('#sp_line_' + pshId).text(oneshe.SheLine);
        $('#sp_row_' + pshId).text(oneshe.SheRow);
        $('#sp_lenght_' + pshId).text(oneshe.SheLenght);
        $('#sp_width_' + pshId).text(oneshe.SheWidth);
        $('#sp_height_' + pshId).text(oneshe.SheHeight);
        $('#sp_availabelvolume_' + pshId).text(oneshe.SheAvailabelVolume);
    } else {
        $('#sp_floor_' + pshId).text('');
        $('#sp_line_' + pshId).text('');
        $('#sp_row_' + pshId).text('');
        $('#sp_lenght_' + pshId).text('');
        $('#sp_width_' + pshId).text('');
        $('#sp_height_' + pshId).text('');
        $('#sp_availabelvolume_' + pshId).text('');
    }
}

///////////// END for page shiipingreceivingform.html


function AddProduct2Inventory() {
    var ClnId = 0;
    var disabled = "";
    var startBox = "<div class='box'><div class='box-body'>";
    var endBox = "</div></div>";
    var onelineContent =
    // start box
        "<div class='form-group' id='div_one_line'>" +
            "<div class='row'>" +
            "<div class='col-md-12'>" +
            "<div class='box-body'>" +
            "<div class='form-horizontal'>" +
            "<div class='form-group variant'>" +
            "<label class='col-sm-3 control-label'>Référence du produit</label>" +
            "<div class='col-sm-3'><input class='form-control' id='PrdId_zzz_' " + disabled + "  name='PrdId_zzz_' value='' onkeyup='checkContent(this)' clnid='" + ClnId + "' /></div>" +
            "<label class='col-sm-3 control-label sale'>Référence du sous produit</label>" +
            "<div class='col-sm-3 sale'><select id='PitId_zzz_' name='PitId_zzz_' " + disabled + "  class='form-control' clnid='" + ClnId + "' onchange='pitChange(this)'/></select></div>" +
            "<div class='form-group  variant'>" +
            "<div class='col-sm-3'></div><div class='col-sm-2' id='div_prd_image'><!-- image -->" +
            "</div><div class='col-sm-10'></div>" +
            "</div>" +
            "<div class='form-group'>" +
            "<label class='col-sm-3 control-label'>Description de produit</label>" +
            "<div class='col-sm-9'><textarea rows='7' disabled cols='1' lineId='" + ClnId + "'  id='ClnPrdDes_zzz_' value='' name='ClnPrdDes_zzz_' class='form-control'></textarea>" +
            "</div>" +
            "</div>" +
    // close box
            "</div></div></div></div></div>";

    var btnAddUpdate = "<button class='btn btn-inverse' clnId='" + ClnId + "' id='btn_add_update_line_zzz_' name='btn_add_update_line_zzz_' onclick='return AddProductInventory(this)'><span>" + "Ajouter" + "</span></button>";
    var btnDelete = "<button class='btn btn-inverse' clnId='" + ClnId + "' id='btn_delete_line_zzz_' name='btn_delete_line_zzz_' onclick='return delete_Cln_Line_Confirm(this)'><span>Supprimer</span></button>";
    var btnClose = "<button class='btn btn-default bootbox-close-button' onclick='return false'><span>Annuler</span></button>";

    var btns = "<div class='modal-body center'>" + btnClose + btnAddUpdate + "</div>";

    var onecontent = startBox + onelineContent + btns + endBox;

    onecontent = replaceAll(onecontent, '_zzz_', '_' + ClnId);
    //$('#div_cost_plan_lines').append(onelineContent);


    var title = 'Ajouter l\'inventaire de produit';
    bootbox.dialog({
        title: title,
        message: onecontent
    })
    .find('.modal-dialog').css({
        'width': '60%'
    })
    .find('.modal-content').css({
        'margin-top': function () {
            var w = $(window).height();
            var b = $(".modal-dialog").height();
            // should not be (w-h)/2
            var h = (w - b) * 0.1;
            return h + "px";
        }
    }).find('.modal-header').css({
        'background': 'url(../../img/menu_005_bg.jpg) repeat-x',
        'text-align': 'center',
        'color': '#C0C0C0'
    });
    setAutoComplete(ClnId);
}

var productInstances = [];
function setAutoComplete(clnId) {
    var url = window.webservicePath + "/GetProductsByRef";
    $("#PrdId_" + clnId).autocomplete({
        source: function(request, response) {
            $.ajax({
                url: url,
                data: "{ 'prdRef': '" + request.term + "'}",
                dataType: "json",
                type: "POST",
                contentType: "application/json; charset=utf-8",
                success: function(data) {
                    var jsdata = data.d;
                    var data2Treat = jQuery.parseJSON(jsdata);
                    if (data2Treat.length > 0) {
                        response($.map(data2Treat, function(item) {
                            return {
                                label: item.PrdRef,
                                val: item.FId,
                                datavalue: item.PrdImg,
                            }
                        }));
                        $('#ClnPrdDes_' + clnId).prop("disabled", true);
                    } else {
                        $('#PitId_' + clnId).empty();
                        $('#ClnPrdDes_' + clnId).text('');
                        $('#ClnPrdDes_' + clnId).prop("disabled", false);
                    }
                },
                error: function(response) {
//                    alert(response.responseText);
                },
                failure: function(response) {
                    alert(response.responseText);
                }
            });
        },
        select: function(e, i) {
            $("#hf_prd_id").text(i.item.val);
            // show image
            if (i.item.datavalue) {
                $('#div_prd_image').empty();
                var imgContent = "<img src='../../Services/ShowOutSiteImage.ashx?file=" + i.item.datavalue + "' alt=''   class='img-responsive'  style='width: 100%' />";
                $('#div_prd_image').append(imgContent);
            } else {
                $('#div_prd_image').empty();
            }
            $('#PitId_zzz_').val('');
            $("#hf_pit_id").text('');

            //currentClnId
            var subPrdId = '#PitId_' + clnId;
            var urlpit = window.webservicePath + "/GetPitByRef";
            $.ajax({
                url: urlpit,
                data: "{ 'pitRef': '', prdId:'" + i.item.val + "'}",
                dataType: "json",
                type: "POST",
                contentType: "application/json; charset=utf-8",
                success: function(data) {
                    var jsdata = data.d;
                    var data2Treat = jQuery.parseJSON(jsdata);
                    $(subPrdId).empty();
                    productInstances = [];
                    if ($.isArray(data2Treat)) {
                        productInstances = data2Treat;
                        $.each(data2Treat, function(name, pit) {
                            $(subPrdId).append(
                                $("<option></option>")
                                .attr("value", pit.FId)
                                .attr("data-value", pit.PitPurchasePrice)
                                .attr("data-price", pit.PitPrice)
                                .attr("description", pit.PitDescription)
                                .text(pit.PitRef)
                            );
                        });
                    }
                    $(subPrdId).change();
                },
                error: function(response) {
                }
            });
        },
        minLength: 2
    });
}
function pitChange(sender) {
    var pitId = $(sender).val();
    $("#hf_pit_id").text($(sender).val());
    var clnId = $(sender).attr('clnId');
    var purchaseprice = $(sender).find(":selected").attr('data-value');
    $('#ClnPurchasePrice_' + clnId).val(purchaseprice);
    var price  = $(sender).find(":selected").attr('data-price');
    $('#ClnUnitPrice_' + clnId).val(price);
    var description = $(sender).find(":selected").attr('description');
    $('#ClnDescription_' + clnId).text(description);
    var onePit = searchFieldValueInArray(productInstances, 'FId', pitId);


    var PrdName = onePit.PrdName;
    var PrdOutsideDiameter = onePit.PrdOutsideDiameter;
    var PrdLength = onePit.PrdLength;
    var PrdWidth = onePit.PrdWidth;
    var PrdHeight = onePit.PrdHeight;
    //var PrdDescription = onePit.PrdDescription;
    var Description = onePit.Description;
    //var diameterExt = ontPit.

    var propdes = "";
    $.each(onePit.PitAllInfo, function(order, propvalue) {
        if (propvalue.PropValue) {
            propdes += propvalue.PropName + " : " + propvalue.PropValue + " " + propvalue.PropUnit + "\r\n";
        }
    });
    var additionnalInfo = "";
    if (PrdOutsideDiameter) {
        additionnalInfo += "Diamètre extérieur : " + PrdOutsideDiameter + " mm\r\n";
    }
    if (PrdLength) {
        additionnalInfo += "Longueur : " + PrdLength + " mm\r\n";
    }
    if (PrdWidth) {
        additionnalInfo += "Largeur : " + PrdWidth + " mm\r\n";
    }
    if (PrdHeight) {
        additionnalInfo += "Hauteur : " + PrdHeight + " mm";
    }
    var alldes = PrdName + "\r\n" + propdes.trim() +"\r\n" + additionnalInfo.trim();
    $('#ClnPrdDes_' + clnId).text(alldes);
    if (Description) {
        $('#Description_' + clnId).text(Description);
    }
}


function AddProductInventory() {
    var prdName = $('#PrdId_0').val();
    if (prdName !== '') {
        ShowPleaseWait();
        $('#PrdId_0').removeClass('error_border');
        var prdId = $('#hf_prd_id').text();
        var pitId = $('#hf_pit_id').text();
        var prddes = $('#ClnPrdDes_0').val();
        prdId = isNaN(prdId) ? 0 : prdId * 1;
        pitId = isNaN(pitId) ? 0 : pitId * 1;
        var jsondata = JSON.stringify({ prdId: prdId, pitId: pitId, prdName: prdName, des: prddes });
        var url = window.webservicePath + "/CreateInventory";
        $.ajax({
            url: url,
            type: 'POST',
            contentType: 'application/json; charset=utf-8',
            data: jsondata,
            dataType: 'json',
            success: function(data) {
                closeDialog();
                HidePleaseWait();
                getAllPitInventory();
            },
            error: function(data) {
                //$('.bootbox-close-button').click();
                HidePleaseWait();
                alert(data.responseText);
            }
        });
    } else {
        $('#PrdId_0').addClass('error_border');
    }
    return false;
}

function searchprd(invId) {
    ShowPleaseWait();
    var ptyid = $('#PtyId').val() * 1;
    var prdinfo = $('#PrdInfo').val();
    var notZero = $('#prdwithInv').is(':checked');
    //var whsId = $(sender).find('option:selected').val() *1;
    var jsondata = JSON.stringify({ ptyId: ptyid, prdinfo: prdinfo, notZero: notZero});
    var url = window.webservicePath + "/SearchPitForInventory";
    pitList = [];
    $.ajax({
        type: "POST",
        url: url,
        contentType: "application/json; charset=utf-8",
        data: jsondata,
        dataType: "json",
        success: function(data) {
            var jsdata = data.d;
            var data2Treat = jQuery.parseJSON(jsdata);
            if (data2Treat !== '-1') {
                //shelves = data2Treat;
                pitList = data2Treat;
                setPitList();
                if (invId > 0) {
                    //$('#btn_pitshelve_' + invId).click();
                    ViewPitShelveDetail(invId);
                }
            } else {
                HidePleaseWait();
                // authentication error
                AuthencationError();
            }
        },
        error: function(data) {
            var test = '';
            HidePleaseWait();
        }
    });



    return false;
}

function getProductTypes() {
    var elementId = 'PtyId';
    var url = window.webservicePath + "/GetProductTypes";
    var datastr = '{selectedType:0}';
    var budgetId = '#' + elementId;
    GeneralAjax_Select(url, budgetId, '', datastr, true);
}
