
$(document).ready(initSearch);

function initSearch() {
    ShowPleaseWait();
    $.each($('.datepicker'), function (idx, value) {
        $(value).datepicker();
    });

    $('#_LgsDateArrivePre').val(firstDayInPreviousMonth());
    $('#_LgsDateArrive').val(fortyfiveDaysLater());
    LoadSupplier();
}

var hasSet = false;

var restLgsList = [];
function viewSearchResult(data2Treat) {
    var name = '_pins';
    var dt_name = 'dt' + name;
    var div_name = 'div' + name;
    var th_name = 'th' + name;
    var tb_name = 'tb' + name;
    var tf_name = 'tf' + name;
    var rst_name = 'rst' + name;

    var headerFooter = "<tr>" +
        "<th style='text-align:center'>Transporteur<br/>承运</th>" +
        "<th style='text-align:center'>Nom Log.<br/>物流名 </th>" +
        "<th style='text-align:center'>Code<br/>物流号</th>" +
        "<th style='text-align:center'>Envoyé<br/>已发</th>" +
        "<th style='text-align:center'>Tracking Nbr<br/>单号</th>" +
        "<th style='text-align:center'>D. d'expédié<br/>发货时间</th>" +
        "<th style='text-align:center'>D. d'arrive prévu<br/>遇到时间</th>" +
        "<th style='text-align:center;width: 35%;'>Détail<br/>详情</th>" +
        "<th style='text-align:center'>Reçu<br/>已收到</th>" +
        "<th style='text-align:center'>D. d'arrive réel<br/>实际到达</th>" +
        "<th style='text-align:center' title='新增的备注会增加到已有的备注后面'>Comment<br/>备注(收货人)<i class='fa fa-info-circle'></i></th>" +
        "<th style='text-align:center; width: 50px;'></th>" +
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
        titles.push({ "sTitle": "Transporteur" });
        titles.push({ "sTitle": "Name" });
        titles.push({ "sTitle": "Code" });
        titles.push({ "sTitle": "IsSend" });
        titles.push({ "sTitle": "TrcNbr" });
        titles.push({ "sTitle": "SentDate" });
        titles.push({ "sTitle": "ArriveDatePre" });
        titles.push({ "sTitle": "Dateil" });
        titles.push({ "sTitle": "IsReçu" });
        titles.push({ "sTitle": "ArriveDateReal" });
        titles.push({ "sTitle": "Comment" });
        titles.push({ "sTitle": "Btn" });

        var displaycount = 1;
        $.each(data2Treat, function (name, value) {
            var dataArray = new Array();
            dataArray.push("<span  onclick='viewItem(\"" + value.FId + "\")' style='cursor:pointer;font-weight:bolder;'>" + value.Supplier.CompanyName + "</span>");
            dataArray.push("<span  onclick='viewItem(\"" + value.FId + "\")' style='cursor:pointer;font-weight:bolder;'>" + value.LgsCode + (IsNullOrEmpty(value.HasFiles) ? "" : " <i class='fa fa-file-text' title='Télécharger tous les fichiers 下载所有文件' lgsId='" + value.FId + "' onclick='return DownloadAllDocs(this)'></i>") + "</span>");
            dataArray.push("<span  onclick='viewItem(\"" + value.FId + "\")' style='cursor:pointer;font-weight:bolder;'>" + value.LgsName + "</span>");
            //dataArray.push(value.LgsCode);
            //dataArray.push(value.LgsTrackingNumber);
            //dataArray.push(value.LgsIsSent ? "<span style='color:green'>YES</span>" : "<span style='color:red'>NO</span>");
            if (value.LgsIsSent !== true) {
                // 未发货的时候，可以更新状态
                dataArray.push("<input type='checkbox' class='form-control' id='CbxLgsIsSend_" + value.Id + "' lgsId='" + value.Id + "' onclick='btnSendLgsClick(this)'>");
                dataArray.push("<span  onclick='viewItem(\"" + value.FId + "\")' style='cursor:pointer;font-weight:bolder;'>" + (IsNullOrEmpty(value.LgsTrackingNumber) ? "" : value.LgsTrackingNumber) + "</span>");
                dataArray.push(getDateString(value.LgsDateSend));
                dataArray.push(getDateString(value.LgsDateArrivePre));

            } else {
                dataArray.push(value.LgsIsSent ? "<span style='color:green'>YES</span>" : "<span style='color:red'>NO</span>");
                dataArray.push("<span  onclick='viewItem(\"" + value.FId + "\")' style='cursor:pointer;font-weight:bolder;'>" + (IsNullOrEmpty(value.LgsTrackingNumber) ? "" : value.LgsTrackingNumber) + "</span>");
                dataArray.push(getDateString(value.LgsDateSend));
                dataArray.push(getDateString(value.LgsDateArrivePre));

            }
            // lgl détail
            var oneline = "";
            if (value.AllLgLines.length > 0) {
                oneline += "<table style='font-size : 9pt; width: 100%'>";
                oneline += "<tr>";
                oneline += "<th style='border: 1px solid black; text-align:center; width: 20%;'>Supplier</th>";
                oneline += "<th style='border: 1px solid black; text-align:center; width: 25%;'>Produit</th>";
                oneline += "<th style='border: 1px solid black; text-align:center; width: 25%;'>Des.</th>";
                oneline += "<th style='border: 1px solid black; text-align:center; width: 10%;'>Qté</th>";
                oneline += "<th style='border: 1px solid black; text-align:center; width: 20%;'>C.F./F.C.</th>";
                oneline += "</tr>";
                $.each(value.AllLgLines, function (name2, sol) {
                    oneline += "<tr>";
                    oneline += "<td style='border: 1px solid black'>" + (IsNullOrEmpty(sol.Supplier) ? (IsNullOrEmpty(sol.Client) ? '' : sol.Client) : sol.Supplier) + "</td>";
                    oneline += "<td style='border: 1px solid black'>" + sol.ProductName + "</td>";
                    oneline += "<td style='border: 1px solid black'>" + (IsNullOrEmpty(sol.LglDescription) ? '' : sol.LglDescription) + "</td>";
                    oneline += "<td style='border: 1px solid black; text-align:center'>" + sol.LglQuantity + "</td>";
                    if (IsNullOrEmpty(sol.SodCode)) {
                        if (!IsNullOrEmpty(sol.CinCode)) {
                            oneline += "<td style='border: 1px solid black'><span  onclick='viewCin(\"" + sol.CinFId + "\")' style='cursor:pointer;font-weight:bolder;color:red;'>" + sol.CinCode + "</span></td>";
                        } else {
                            oneline += "<td style='border: 1px solid black'></td>";
                        }
                    } else {
                        oneline += "<td style='border: 1px solid black'><span  onclick='viewSod(\"" + sol.FId + "\")' style='cursor:pointer;font-weight:bolder;'>" + sol.SodCode + "</span></td>";
                    }

                    oneline += "</tr>";
                });
                oneline += "</table>";
            }
            dataArray.push(oneline);
            if (!value.LgsIsReceived && value.LgsIsSent === true) {
                //dataArray.push(value.LgsIsReceived ? "<span style='color:green'>YES</span>" : "<span style='color:red'>NO</span>");
                dataArray.push("<input type='checkbox' class='form-control' id='CbxLgsIsReceived_" + value.Id + "' lgsId='" + value.Id + "' " + (value.LgsIsReceived ? "checked='checked'" : "") + " onclick='btnReceivedClick(this)'>");
                //dataArray.push(getDateString(value.LgsDateArrive));
//                dataArray.push("<input type='text' class='form-control datepicker' id='LgsDateArrive_" + value.Id + "' disabled='' lgsId='" + value.Id + "' value='" + getDateString(value.LgsDateArrive) + "'/>");
//                dataArray.push("<input id='LgsComment_" + value.Id + "' disabled=''  class='form-control' />");
                dataArray.push(getDateString(value.LgsDateArrive));
                dataArray.push(replaceAll(value.LgsComment, '\n', '<br/>'));
                dataArray.push("<button class='btn btn-block btn-inverse' lgsId='" + value.Id + "'  disabled='' id='btn_uplgs_" + value.Id + "' name='btn_uplgs_" + value.Id + "'title='update 更新' onclick='return updateLgsBySearch(this)' ><i class='fa fa-refresh'></i></button>");
            } else {
                dataArray.push(value.LgsIsReceived ? "<span style='color:green'>YES</span>" : "<span style='color:red'>NO</span>");
                dataArray.push(getDateString(value.LgsDateArrive));
                dataArray.push(replaceAll(value.LgsComment, '\n', '<br/>'));
                dataArray.push('');
            }
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
    myApp.hidePleaseWait();

    $.each($('.datepicker'), function (idx, value) {
        $(value).datepicker();
    });
}

function btnReceivedClick(sender) {
    allLgLines = [];
    var lgsId = $(sender).attr('lgsId') * 1;
    var checked = $(sender).is(':checked');
    if (checked) {
//        $('#LgsDateArrive_' + lgsId).prop('disabled', false);
//        $('#LgsComment_' + lgsId).prop('disabled', false);
        $('#btn_uplgs_' + lgsId).prop('disabled', false);
    } else {
//        $('#LgsDateArrive_' + lgsId).prop('disabled', true);
        $('#btn_uplgs_' + lgsId).prop('disabled', true);
//        $('#LgsComment_' + lgsId).prop('disabled', true);
//        $('#LgsDateArrive_' + lgsId).val('');
//        $('#LgsComment_' + lgsId).val('');
    }
}

function btnSendLgsClick(sender) {
    var lgsId = $(sender).attr('lgsId') * 1;
    var checked = $(sender).is(':checked');
    SendContainer(lgsId);
    //    var oneLgs = searchInArray(restLgsList, 'Id', lgsId)[0];
    //    if (!jQuery.isEmptyObject(oneLgs)) {
    //        //console.log(oneLgs);
    //    }
}


function SendContainer(lgsId) {
    var startBox = "<div class='box'><div class='box-body'>";
    var endBox = "</div></div>";
    var onelineContent =
    // start box
        "<div class='form-group' id='div_one_line'>" +
            "<div class='row'>" +
            "<div class='col-md-12'>" +
            "<div class='box-body'>" +
            "<div class='form-horizontal'>" +
            "<div class='form-group'><label class='col-sm-12 control-label ' style='text-align:center !important'>Veuillez confimer que ce container est déjà expédié, une fois vous confirmez, vous ne pouvez plus ajouter des produits dans ce container et la suppression de container ne fonctionne plus !<br/> 请确认商品是否已经发出，一旦发出，物流信息将不能做任何修改和删除！ </label></div>" +
            "<div class='form-group'>" +
            "<label class='col-sm-4 control-label'>Date d'expédié 发货日期</label>" +
            "<div class='col-sm-8'><input type='text' id='popup_LgsDateSend' class='form-control datepicker' /></div>" +
            "</div>" +
            "<div class='form-group'>" +
            "<label class='col-sm-4 control-label'>Date d'arrive prévu 预计到达日期</label>" +
            "<div class='col-sm-8'><input type='text' id='popup_LgsDateArr' class='form-control datepicker' /></div>" +
            "</div>" +
            "<div class='form-group'>" +
            "<label class='col-sm-4 control-label'>Numéro de tracking 物流号码</label>" +
            "<div class='col-sm-8'><input type='text' id='popup_LgsNmb' class='form-control' /></div>" +
            "</div>" +
    // close box
            "</div></div></div></div></div>";

    var btnAddUpdate = "<button class='btn btn-inverse' onclick='return SetSendDate(this)' lgsId='" + lgsId + "'><span>Expédier</span></button>";
    var btnClose = "<button class='btn btn-default bootbox-close-button ' id='btn_close_senddialog' lgsId='" + lgsId + "' onclick='return closedialogforSend(this)'><span>Annuler</span></button>";

    var btns = "<div class='modal-body center'>" + btnClose + btnAddUpdate + "</div>";
    var onecontent = startBox + onelineContent + btns + endBox;

    var title = 'Container est expédié 货物已发';
    bootbox.dialog({
        title: title,
        message: onecontent
    })
    //    .find('.modal-dialog').css({
    //        'width': '80%'
    //    })
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
    $('#popup_LgsDateSend').datepicker();
    $('#popup_LgsDateArr').datepicker();
    var today = new Date();
    var year = today.getFullYear();
    var month = ("0" + (today.getMonth() + 1)).slice(-2);
    var monthArr = ("0" + (today.getMonth() + 2)).slice(-2);
    var day = ("0" + today.getDate()).slice(-2);
    var formatted = day + "/" + month + "/" + year;
    var formattedArr = day + "/" + monthArr + "/" + year;
    var oneLgs = searchInArray(restLgsList, 'Id', lgsId)[0];
    var lgsDateSend = '';
    var lgsDateArr = '';
    var lgsTrackNum = '';
    if (!jQuery.isEmptyObject(oneLgs)) {
        lgsDateSend = IsNullOrEmpty(oneLgs.LgsDateSend) ? formatted : getDateString(oneLgs.LgsDateSend);
        lgsDateArr = IsNullOrEmpty(oneLgs.LgsDateArrive) ? formatted : getDateString(oneLgs.LgsDateArrive);
        $('#popup_LgsDateSend').val(lgsDateSend);
        $('#popup_LgsDateArr').val(lgsDateArr);
        $('#popup_LgsNmb').val((IsNullOrEmpty(oneLgs.LgsTrackingNumber) ? "" : oneLgs.LgsTrackingNumber));
    } else {
        $('#popup_LgsDateSend').val(formatted);
        $('#popup_LgsDateArr').val(formattedArr);
    }
    HidePleaseWait();
    return false;
}

//CbxLgsIsSend_

function closedialogforSend(sender) {
    var lgsId = $(sender).attr('lgsId') * 1;
    closeDialog();
    $('#CbxLgsIsSend_' + lgsId)[0].checked = false;
    return false;
}

function closedialogforSendWithId(lgsId) {
    closeDialog();
    $('#CbxLgsIsSend_' + lgsId)[0].checked = false;
    return false;
}

function SetSendDate(sender) {
    ShowPleaseWait();
    $(sender).prop('disabled', true);
    var lgsId = $(sender).attr('lgsId') * 1;
    ShowPleaseWait();
    var popup_LgsDateSend = $('#popup_LgsDateSend').val();
    var popup_LgsDateArr = $('#popup_LgsDateArr').val();
    var popup_LgsNmb = $('#popup_LgsNmb').val();
    //var lgsId = getParameterByName('lgsId');
    if (popup_LgsDateSend) {
        var url = window.webservicePath + "/UpdateLogisticSendDate";
        var datastr = "{lgsId:'" + lgsId + "',sendDate:'" + popup_LgsDateSend + "',arrDate:'" + popup_LgsDateArr + "',tracknmb:'" + popup_LgsNmb + "'}";
        $.ajax({
            type: "POST",
            url: url,
            contentType: "application/json; charset=utf-8",
            data: datastr,
            dataType: "json",
            success: function (data) {
                //location.reload();
                HidePleaseWait();
                //closedialogforSendWithId(lgsId);
                $('#btn_close_senddialog').click();
                js_search();
            },
            error: function (data) {
                //location.reload();
                HidePleaseWait();
            }
        });
    } else {
        HidePleaseWait();
        $(sender).prop('disabled', false);
        $('#popup_LgsDateSend').addClass('error_border');
        MsgErrorPopUp('Erreur', 'La date est obligatoire !');
    }
    return false;
}

function closeDialog() {
    // id = 'btn_default_close'
    $('#btn_default_close').click();
    return false;
}



var allLgLines = [];
function LoadAllLinesforSearch(lgsId) {
    if (lgsId) {
        allLgLines = [];
        ShowPleaseWait();
        var url = window.webservicePath + "/LoadAllLgsLines";
        var datastr = "{lgsId:'" + lgsId + "'}";
        $.ajax({
            type: "POST",
            url: url,
            contentType: "application/json; charset=utf-8",
            data: datastr,
            dataType: "json",
            success: function (data) {
                var jsdata = data.d;
                var data2Treat = jQuery.parseJSON(jsdata);
                allLgLines = [];
                if (data2Treat !== '-1') {
                    allLgLines = data2Treat;
                    //SetPageLines(data2Treat);
                    //console.log(allLgLines);
                    HidePleaseWait();
                    receiveContainer(lgsId);
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


function receiveContainer(lgsId) {
    var div2Add = AddLineForRecept(lgsId);
    var startBox = "<div class='box'><div class='box-body'>";
    var endBox = "</div></div>";
    var onelineContent =
    // start box
        "<div class='form-group' id='div_one_line'>" +
            "<div class='row'>" +
            "<div class='col-md-12'>" +
            "<div class='box-body'>" +
            "<div class='form-horizontal'><div class='row'>" +
            "<div class='form-group'>" +
            "<label class='col-sm-12 control-label' style='text-align:center; color: red'>Veuillez confirmer la réception de container, une fois vous le confirmez, la modification sera impossiblee !</label>" +
            "</div>" +
            "</div>" +
            "<div class='form-group'><div class='col-sm-3'></div>" +
            "<label class='col-sm-3 control-label'>Date de reçu</label>" +
            "<div class='col-sm-3'>" +
            "<div class='input-group'>" +
            "<input type='text' class='form-control datepicker' id='LgsDateArrivePop' name='LgsDateArrivePop' /><span class='input-group-addon'><i class='fa fa-calendar'></i></span>" +
            "</div>" +
            "</div>" +
            "<div class='col-sm-3'></div></div></div>" +
            div2Add +
    // close box
            "</div></div></div></div></div>";

    var btnAddUpdate = "<button class='btn btn-inverse' id='btn_add_update_discount' name='btn_add_update_discount' lgsId='" + lgsId + "' onclick='return EnterWarehouseClick(this)'><span>ENTREPOSER</span></button>";
    var btnClose = "<button class='btn btn-default bootbox-close-button' lgsId='" + lgsId + "' onclick='return btn_close_enterwareclick(this)' id='btn_close_enterware'><span>Annuler</span></button>";

    var btns = "<div class='modal-body center'>" + btnClose + btnAddUpdate + "</div>";
    var onecontent = startBox + onelineContent + btns + endBox;

    var title = 'Recevoir le container';
    bootbox.dialog({
        title: title,
        message: onecontent
    })
        .find('.modal-dialog').css({
            'width': '95%'
        })
        .find('.modal-content').css({
            'margin-top': function () {
                var w = $(window).height();
                var b = $(".modal-dialog").height();
                // should not be (w-h)/2
                var h = (w - b) * 0.01;
                return h + "px";
            }
        }).find('.modal-header').css({
            'background': 'url(../../img/menu_005_bg.jpg) repeat-x',
            'text-align': 'center',
            'color': '#C0C0C0'
        });

    $('#LgsDateArrivePop').datepicker();
    var today = new Date();
    var year = today.getFullYear();
    var month = ("0" + (today.getMonth() + 1)).slice(-2);
    var day = ("0" + today.getDate()).slice(-2);
    var formatted = day + "/" + month + "/" + year;
    $('#LgsDateArrivePop').val(formatted);

    if (WareHouseList && WareHouseList.length > 0) {
        $.each(WareHouseList, function (name, value) {
            $('#WhsId').append($("<option>" + value.WhsName + "</option>").attr("value", value.WhsId));
        });
    }
    //$('#WhsId').change();
    var allsrlWhs = $('select[id^="SrlWhs_"]');
    $.each(allsrlWhs, function (order, onewhs) {
        $(onewhs).empty();
        if (WareHouseList && WareHouseList.length > 0) {
            $.each(WareHouseList, function (name, value) {
                $(onewhs).append($("<option>" + value.WhsName + "</option>").attr("value", value.WhsId));
            });
        }
        $(onewhs).change();
    });


    return false;
}

function btn_close_enterwareclick(sender) {
    var lgsId = $(sender).attr('lgsId');
    $('#CbxLgsIsReceived_'+lgsId).click();
    closeDialog();
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
                getShelvesList();
            } else {
                HidePleaseWait();
                // authentication error
                AuthencationError();
            }
        },
        error: function(data) {
            HidePleaseWait();
            var test = '';
        }
    });
}


var shelves = [];
function getShelvesList(sender) {
    //var whsId = $(sender).find('option:selected').val() *1;
    var url = window.webservicePath + "/GetAllShelvesList";
    shelves = [];
    $.ajax({
        type: "POST",
        url: url,
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        success: function(data) {
            HidePleaseWait();
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

function WhsChange(sender) {
    var whsId = $(sender).find('option:selected').val() * 1;
    var lglid = $(sender).attr('lglid') * 1;
    var shes = searchInArray(shelves, 'WhsId', whsId);
    var SrlShe_id = "#SrlShe_" + lglid;
    $(SrlShe_id).empty();
    if (shes && shes.length > 0) {
        $.each(shes, function(name, value) {
            $(SrlShe_id).append($("<option></option>").attr("value", value.SheId).text(value.SheCode + " | ÉTAGE: " + value.SheFloor + " | LIGNE: " + value.SheLine + " | RANGÉE: " + value.SheRow));
        });
    }
}


function AddLineForRecept(lgsId) {
    var div2Add = "";
    var title = "<div class='row' style='max-height:600px; overflow-y:auto;'><div class='form-group'>" +
        "<label class='col-sm-1 control-label labelCenter11'>Réf de prd</label>" +
        "<label class='col-sm-1 control-label labelCenter11'>Réf de sous prd</label>" +
        "<label class='col-sm-2 control-label labelCenter11'>Des. de prd</label>" +
        "<label class='col-sm-2 control-label labelCenter11'>Des. de container</label>" +
        "<label class='col-sm-1 control-label labelCenter11'>Qté</label>" +
        "<label class='col-sm-1 control-label labelCenter11'>Qté reçu</label>" +
        "<label class='col-sm-1 control-label labelCenter11'>Entrepôt</label>" +
        "<label class='col-sm-1 control-label labelCenter11'>Étagère</label>" +
        "<label class='col-sm-2 control-label labelCenter11'>Commentaire</label>" +
        "</div>";
    div2Add += title;
    var currentLgs = searchInArray(restLgsList, 'Id', lgsId)[0];
    if (allLgLines && allLgLines.length > 0) {
        var lgLines = allLgLines;
        lgLines = jQuery.unique(lgLines);
        var sinIds = Array.from(lgLines, m => m.SodId);
        sinIds = sinIds.filter(function(item, i, a) { return i === a.indexOf(item); });
        $.each(sinIds, function(name, value) {
            var linesInSameSin = searchInArray(lgLines, 'SodId', value);
            //alert(sameSin);
            if (linesInSameSin.length > 0) {
                var sinCode = linesInSameSin[0].SodCode ? ("PI - " + linesInSameSin[0].SodCode) : "SANS PI";
                var divclass = currentLgs.LgsIsSent ? "col-sm-3" : "col-sm-2";
                var display = currentLgs.LgsIsSent ? "style='display :none;'" : "";
                var content = "";
                $.each(linesInSameSin, function(linename, oneLgLine) {
                    //content += SetOneLineInPage(linevalue);
                    var oneContent = "<div class='form-group' sinId='" + oneLgLine.SinId + "' lglid='" + oneLgLine.Id + "' >" +
                        "<div class='col-sm-1'><input value='" + oneLgLine.ProductName + "' type='text' class='form-control'  disabled id='SrlPrdName_lglid' /></div>" +
                        "<div class='col-sm-1'><input type='text' class='form-control'  disabled  value='" + oneLgLine.ProductRef + "' /></div>" +
                        "<div class='col-sm-2'><textarea style='height : 100px;' class='form-control' disabled lglid='" + oneLgLine.Id + "' >" + oneLgLine.PrdDescription + "</textarea></div>" +
                        "<div class='col-sm-2'><input value='" + oneLgLine.LglDescription + "' type='text' class='form-control' disabled  lglid='" + oneLgLine.Id + "'  /></div>" +
                        "<div class='col-sm-1'><input value='" + oneLgLine.LglQuantity + "' disabled type='number' class='form-control' lglid='" + oneLgLine.Id + "' /></div>" +
                        "<div class='col-sm-1'><input value='" + oneLgLine.LglQuantity + "' min='0' max='" + oneLgLine.LglQuantity + "' type='number' class='form-control' lglid='" + oneLgLine.Id + "'  id='SrlQuantityReal_lglid' prdid='" + (IsNullOrEmpty(oneLgLine.PrdId) ? 0 : oneLgLine.PrdId) + "' pitid='" + (IsNullOrEmpty(oneLgLine.PitId) ? 0 : oneLgLine.PitId) + "' /></div>" +
                        "<div class='col-sm-1'><select class='form-control' id='SrlWhs_lglid' onchange='WhsChange(this)' lglid='" + oneLgLine.Id + "' ></select></div>" +
                        "<div class='col-sm-1'><select class='form-control' id='SrlShe_lglid' lglid='" + oneLgLine.Id + "' ></select></div>" +
                        "<div class='col-sm-2'><textarea style='height : 100px;' class='form-control'  lglid='" + oneLgLine.Id + "' id='SrlDescription_lglid' ></textarea></div>" +
                        "</div>";
                    oneContent = replaceAll(oneContent, '_lglid', '_' + oneLgLine.Id);
                    content += oneContent;
                });
                div2Add += content;
            }
        });
    }
    div2Add += "</div>";
    return div2Add;
}


function updateLgsBySearch(sender) {
    var lgsId = $(sender).attr('lgsId') * 1;
//    var received = $('#CbxLgsIsReceived_' + lgsId).is(':checked');
//    var receivedDate = getDateStringNullable($('#LgsDateArrive_' + lgsId).val());
//    var comment = $('#LgsComment_' + lgsId).val();
    LoadAllLinesforSearch(lgsId);
    //EnterWarehouseClick();
    return false;
}


function EnterWarehouseClick(sender) {
    var lgsId = $(sender).attr('lgsId');
    MsgPopUpWithResponseChoice('CONFIRMER', 'Confirmez la mis en stocakge, une fois vous le confirmez, toutes les modifications de container seront impossibles ! ', 'ENTREPOSER', 'EnterWarehouse('+lgsId+')', 'Annuler');
}

function EnterWarehouse(lgsId) {
    ShowPleaseWait();
    var srls = $('input[id^="SrlQuantityReal_"]');
    var srlList = [];
    $.each(srls, function (name, value) {
        var lglId = $(value).attr('lglid') * 1;
        var quantity = $(value).val() * 1;
        var description = $('#SrlDescription_' + lglId).val();
        var sheId = $('#SrlShe_' + lglId).find('option:selected').val();
        sheId = isNaN(sheId) ? 0 : (sheId * 1);
        var pitId = $('#SrlQuantityReal_' + lglId).attr('pitid');
        var prdId = $('#SrlQuantityReal_' + lglId).attr('prdid');
        var prdname = $('#SrlPrdName_' + lglId).val();
        var whsId = $('#SrlWhs_' + lglId).find('option:selected').val();
        whsId = isNaN(whsId) ? 0 : (whsId * 1);

        var oneSrl = {};
        oneSrl.Id = lglId;
        oneSrl.LglQuantity = quantity;
        oneSrl.LglDescription = description;
        oneSrl.SheId = sheId;
        oneSrl.PrdId = isNaN(prdId) ? 0 : (prdId * 1);
        oneSrl.PitId = isNaN(pitId) ? 0 : (pitId * 1);
        oneSrl.SheId = sheId;
        oneSrl.ProductName = prdname;
        oneSrl.WhsId = whsId;
        srlList.push(oneSrl);
    });
    //var whsId = $('#WhsId').find('option:selected').val() * 1;
    var receiveTime = $('#LgsDateArrivePop').val();
    var jsondata = JSON.stringify({ lgsId: lgsId, receiveTime: receiveTime, lines: srlList });
    var url = window.webservicePath + "/CreateSrvFromLogistic";
    $.ajax({
        type: "POST",
        url: url,
        data: jsondata,
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        success: function (data) {
            //location.reload();
            //closeDialog();
            $('#btn_close_enterware').click();
            js_search();
        },
        error: function (data) {
            var test = '';
        }
    });
}

function viewSod(fId) {
    var url = '../SupplierOrder/SupplierOrder.aspx?sodId=' + fId + "&mode=view";
    var win = window.open(url, '_blank');
    win.focus();
}

function viewCin(fId) {
    var url = '../ClientInvoice/ClientInvoice.aspx?cinId=' + fId + "&mode=view";
    var win = window.open(url, '_blank');
    win.focus();
}

function viewItem(fId) {
    myApp.showPleaseWait();
    var url = 'Logistics.aspx?lgsId=' + fId + "&mode=view";
    //window.location.href = url;
    HidePleaseWait();
    var win = window.open(url, '_blank');
    win.focus();
}

function LoadSupplier() {
    var url = window.webservicePath + "/GetAllTransporter";
    var budgetId = '#SupId';
    $.ajax({
        type: "POST",
        url: url,
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        success: function (data) {
            var jsdata = data.d;
            var data2Treat = jQuery.parseJSON(jsdata);
            if (data2Treat !== '-1') {
                $(budgetId).empty();
                $(budgetId).append($("<option></option>").attr("data-value", "0").attr("value", "0").text("Sélectionner un transporteur"));
                $.each(data2Treat, function (name, value) {
                    $(budgetId)
                        .append($("<option></option>")
                            .attr("data-value", value.FId)
                            .attr("value", value.Id)
                            .text(value.CompanyName)
                            );
                });
                getWareHouseList();
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

function js_search() {
    restLgsList = [];
    var url = window.webservicePath + "/SearchLogisticss";
    var lgs = {};
    lgs.LgsName = $('#LgsName').val().trim();
    lgs.LgsCode = $('#LgsCode').val().trim();
    lgs._LgsDateArrive = $('#_LgsDateArrive').val().trim();
    lgs._LgsDateArrivePre = $('#_LgsDateArrivePre').val().trim();
    lgs.LgsTrackingNumber = $('#LgsTrackingNumber').val().trim();
    lgs.SupId = $('#SupId').val().trim();
    var issend = $('#cbx_send').is(':checked');
    lgs.LgsIsSent = issend;
    var isreceived = $('#cbx_arrived').is(':checked');
    lgs.LgsIsReceived = isreceived;

    var jsondata = JSON.stringify({ logistics: lgs });
    myApp.showPleaseWait();
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
                var msg = '';
                if (!issend || !isreceived) {
                    msg = 'Tous sont envoyés ou arrivés !<br/>所有都已发出或都已到达 !';
                }
                NoResultMsg(msg);
            }
            restLgsList = jsondata;
            viewSearchResult(jsondata);
        },
        error: function (data) {
            myApp.hidePleaseWait();
        }
    });
    return false;
}

function createItem() {
    //window.location = "Logistics.aspx";
    ShowPleaseWait();
    var url = "Logistics.aspx";
    var win = window.open(url, '_blank');
    HidePleaseWait();
    win.focus();

}


function DownloadAllDocs(sender) {
    var lgsId = $(sender).attr('lgsId');
    var height = $(window).height();
    var width = $(window).width();
    width = width * 0.8;
    width = width.toFixed(0);
    var url = "../Common/PageForPDF.aspx?type=16&foreignId=" + encodeURIComponent(lgsId);
    window.open(url, 'popupWindow', 'height=' + height + ', width=' + width + ', top=0, left=0, toolbar=no, menubar=no, scrollbars=no, resizable=no,location=no, status=no');

    return false;
}