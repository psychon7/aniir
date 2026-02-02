
$(document).ready(init);

function init() {
    var navbarclass = $('#div-navbar-brand').attr('class');
    if (navbarclass === "navbar-brand") {
        $('#sidebar-collapse').click();
    }
    getAllGenStt();
    setAutoCompleteSup();
    setAutoCompleteClient();
}


var seltectedSupId = 0;
var supplierList = [];
function setAutoCompleteSup() {
   var url = window.webservicePath + "/GetSupplierByKeyword";
    //var cliFId = $('#cinClient :selected').attr('data-value');
    $("#SupList").autocomplete({
        source: function(request, response) {
            $.ajax({
                url: url,
                data: "{ 'keyword': '" + request.term + "'}",
                dataType: "json",
                type: "POST",
                contentType: "application/json; charset=utf-8",
                success: function(data) {
                    seltectedSupId = 0;
                    var jsdata = data.d;
                    var data2Treat = jQuery.parseJSON(jsdata);
                    supplierList = [];
                    supplierList = data2Treat;
                    if (data2Treat.length > 0) {
                        response($.map(data2Treat, function(item) {
                            return {
                                label: (item.Abbreviation == null ? (item.CompanyName) : (item.Abbreviation + " | " + item.CompanyName)),
                                val: item.Id,
                            }
                        }));
                    } else {
                    }
                },
                error: function(response) {
//                    alert(response.responseText);
                    //console.log(response);
                },
                failure: function(response) {
                    alert(response.responseText);
                }
            });
        },
        select: function(e, i) {
            seltectedSupId = i.item.val * 1;
            //SupplierChangedBySelected(seltectedSupFId, 0);
        },
        minLength: 2
    });
}


var seltectedClientId = 0;
var ClientList = [];
function setAutoCompleteClient() {
   var url = window.webservicePath + "/SearchClientByName";
    //var cliFId = $('#cinClient :selected').attr('data-value');
    $("#ClientList").autocomplete({
        source: function(request, response) {
            $.ajax({
                url: url,
                data: "{ 'client': '" + request.term + "'}",
                dataType: "json",
                type: "POST",
                contentType: "application/json; charset=utf-8",
                success: function(data) {
                    seltectedClientId = 0;
                    var jsdata = data.d;
                    var data2Treat = jQuery.parseJSON(jsdata);
                    ClientList = [];
                    ClientList = data2Treat;
                    if (data2Treat.length > 0) {
                        response($.map(data2Treat, function(item) {
                            return {
                                //label: item.Value,
                                label: (IsNullOrEmpty(item.Value2)? item.Value: (item.Value + "-" + item.Value2)),
                                val: item.Key,
                            }
                        }));
                    } else {
                    }
                },
                error: function(response) {
//                    alert(response.responseText);
                    //console.log(response);
                },
                failure: function(response) {
                    alert(response.responseText);
                }
            });
        },
        select: function(e, i) {
            seltectedClientId = i.item.val * 1;
        },
        minLength: 2
    });
}

function InitSup(sender) {
    var value = $(sender).val().trim();
    if (IsNullOrEmpty(value)) {
        seltectedSupId = 0;
    }
    return false;
}

function InitClient(sender) {
    var value = $(sender).val().trim();
    if (IsNullOrEmpty(value)) {
        seltectedClientId = 0;
    }
    return false;
}

var allGenStt = [];
function getAllGenStt() {
    var url = window.webservicePath + "/GetGeneralStatus";
    var budgetId = '#SttId';
    $.ajax({
        type: "POST",
        url: url,
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        success: function (data) {
            var jsdata = data.d;
            var data2Treat = jQuery.parseJSON(jsdata);
            if (data2Treat !== '-1') {
                allGenStt = [];
                allGenStt = data2Treat;
                $(budgetId).empty();
                $.each(allGenStt, function (name, value) {
                    $(budgetId)
                        .append($("<option></option>")
                            .attr("value", value.Key)
                            .text(value.Value));
                });
            } else {
                AuthencationError();
            }
        },
        error: function (data) {
            var test = '';
        }
    });
}

var allSodStatus = [];
function js_searchstatus() {
    ShowPleaseWait();
    allSodStatus = [];
    var url = window.webservicePath + "/SearchSodStatus";
    var cliId = seltectedClientId * 1;
    var supId = seltectedSupId * 1;
    var dFrom = $('#DateCreationFrom').val();
    var dTo = $('#DateCreationTo').val();
    var sttId = 0;

    var jsondata = JSON.stringify({
        dFrom: dFrom,
        dTo: dTo,
        supId: supId,
        cliId: cliId,
        sttId: sttId
    });
    $.ajax({
        url: url,
        type: 'POST',
        contentType: 'application/json; charset=utf-8',
        data: jsondata,
        dataType: 'json',
        success: function(data) {
            //console.log(data);
            var jsdata = data.d;
            var jsondata = jQuery.parseJSON(jsdata);
            allSodStatus = jsondata;
            if (allSodStatus.length === 0) {
                HidePleaseWait();
                $('#div_search_result').hide();
                NoResultMsg();
            } else {
                //console.log(allSodStatus);
                $('#div_search_result').show();
                setAllSodStatus();
                HidePleaseWait();
            }
        },
        error: function(data) {
            HidePleaseWait();
        }
    });
    return false;
}


function setAllSodStatus() {
    var sod_unproduced = searchInArray(allSodStatus, 'SttId', 1);
    var sod_in_progressiv = searchInArray(allSodStatus, 'SttId', 2);
    var sod_wait_payment = searchInArray(allSodStatus, 'SttId', 3);
    var sod_wait_send = searchInArray(allSodStatus, 'SttId', 4);
    var sod_in_transport = searchInArray(allSodStatus, 'SttId', 5);
    var sod_arrived = searchInArray(allSodStatus, 'SttId', 6);
    setSodSttDivContent(sod_unproduced, '#div_unproduced','#div_unproduced_count');
    setSodSttDivContent(sod_in_progressiv, '#div_in_progressiv','#div_in_progressiv_count');
    setSodSttDivContent(sod_wait_payment, '#div_wait_payment','#div_wait_payment_count');
    setSodSttDivContent(sod_wait_send, '#div_wait_send','#div_wait_send_count');
    setSodSttDivContent(sod_in_transport, '#div_in_transport','#div_in_transport_count');
    setSodSttDivContent(sod_arrived, '#div_arrived','#div_arrived_count');
}

function setSodSttDivContent(sods, divId, divCountId) {
    var count = sods.length;
    $(divCountId).text(count);
    var content = '';
    $.each(sods, function(name, sod) {
        var clientname = IsNullOrEmpty(sod.CliAbbr) ? sod.Client : (sod.Client + '-' + sod.CliAbbr);
        content += "<div class='well well-sm'><span style='font-weight:bolder; cursor:pointer' onclick='return viewSodItem(\"" + sod.SodFId + "\")'>" + sod.SodCode + " | " + sod.SodName + "</span>" +
                "<button class='btn btn-primary btn-xs' title='Regarder ici 本页查看' onclick='return ViewSodInThisPage(this)' sodId='" + sod.SodId + "' sodFId='" + sod.SodFId + "'><i class='fa fa-eye' ></i></button>" +
            "<br/>" +
            "C:" + clientname + "<br/>" +
            "F: " + sod.Supplier + "<br/>" +
            sod.TotalAmountHt.toFixed(2) + sod.CurrencySymbol + " | <span " + (sod.Need2Pay > 0 ? "style='color:red'" : "") + ">" + sod.Need2Pay.toFixed(2) + sod.CurrencySymbol + "</span><br/>" +
            "<span style='font-weight:bolder'>" + searchFieldValueInArray(allGenStt, 'Key', sod.SttId).Value + "</span>" +
            "<button class='btn btn-primary btn-xs' title='Mettre à jour le status 更新状态' onclick='return updateSttClick(this)' sodId='" + sod.SodId + "' sttId='" + sod.SttId + "' sodFId='" + sod.SodFId + "'><i class='fa fa-refresh' ></i></button>" +
            "</div>";
    });
    $(divId).empty();
    $(divId).append(content);
}

function ViewSodInThisPage(sender) {
    ShowPleaseWait();
    var sodFId = $(sender).attr('sodFId');
    var startBox = "<div class='box'><div class='box-body'>";
    var endBox = "</div></div>";
    var onelineContent =
        // start box
        "<div class='form-group' id='div_one_line'>" +
            "<div class='row'>" +
            "<div class='col-md-12'>" +
            "<div class='box-body'>" +
            "<div class='form-horizontal'>" +
            "<div class='col-md-12'>" +
            // this div is for album photo
            "<div class='row' style='margin-bottom: 20px;'>" +
            "<div class='col-md-12' id='div_album_photo' style='text-align:center;'>" +
            "<iframe height='600' width='100%' id='iframepdfForPayment'></iframe>" +
            "</div>" +
            // cancel and save buttons
            "</div>" +
            "</div>" +

            // close box
            "</div></div></div></div></div>";
    var btnClose = "<button class='btn btn-default bootbox-close-button' id='btn_close_cin_payment' onclick='return false'><span>Clôturer</span></button>";

    var btns = "<div class='modal-body center'>" + btnClose + "</div>";
    var onecontent = startBox + onelineContent + btns + endBox;

    var title = 'Commande Fournisseur';
    bootbox.dialog({
        title: title,
        message: onecontent
    }).find('.modal-dialog').css({
        'width': '80%'
    }).find('.modal-content').css({
        'margin-top': function() {
            var w = $(window).height();
            var b = $(".modal-dialog").height();
            // should not be (w-h)/2
            var h = (w - b) * 0.05;
            return h + "px";
        }
    }).find('.modal-header').css({
        'background': 'url(../../img/menu_005_bg.jpg) repeat-x',
        'text-align': 'center',
        'color': 'white'
    });
    var src = "SupplierOrder.aspx?sodId=" + encodeURIComponent(sodFId) + "&mode=view";
    $('#iframepdfForPayment').attr('src', src);
    HidePleaseWait();
    return false;
}


function updateSttClick(sender) {
    ShowPleaseWait();
    var sodId = $(sender).attr('sodId');
    var sttId = $(sender).attr('sttId');
    var sodFId = $(sender).attr('sodFId');
    var startBox = "<div class='box'><div class='box-body'>";
    var endBox = "</div></div>";
    var onelineContent =
        // start box
        "<div class='form-group' id='div_one_line'>" +
            "<div class='row'>" +
            "<div class='col-md-12'>" +
            "<div class='box-body'>" +
            "<div class='form-horizontal'>" +
            "<div class='form-group'><label class='col-sm-12 control-label ' style='text-align:center !important'>Choisir un statut <br/>请选一个订单状态</label></div>" +
            "<div class='form-group'>" +
            "<label class='col-sm-2 control-label'>Statut 状态</label>" +
            "<div class='col-sm-10'><select id='popup_stt_id' name='popup_stt_id' class='form-control'>" +
            "</select></div>" +
            "</div>" +
            // close box
            "</div></div></div></div></div>";

    var btnAddUpdate = "<button class='btn btn-inverse' onclick='return UpdateSodStt(this)' sodId='" + sodId + "' sodFId='" + sodFId + "'><span>Mettre à jour 更新</span></button>";
    var btnClose = "<button class='btn btn-default bootbox-close-button '><span>Annuler</span></button>";

    var btns = "<div class='modal-body center'>" + btnClose + btnAddUpdate + "</div>";
    var onecontent = startBox + onelineContent + btns + endBox;

    var title = 'Le statut de la commande 订单状态';
    bootbox.dialog({
            title: title,
            message: onecontent
        })
        .find('.modal-content').css({
            'margin-top': function() {
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

    var budgetId = "#popup_stt_id";
    $(budgetId).empty();
    $.each(allGenStt, function(name, value) {
        $(budgetId)
            .append($("<option></option>")
                .attr("value", value.Key)
                .text(value.Value));
    });

    $(budgetId).val(sttId);

    HidePleaseWait();
    return false;
}

function UpdateSodStt(sender) {
    ShowPleaseWait();
    var sodId = $(sender).attr('sodId');
    var sodFId = $(sender).attr('sodFId');
    var sttId = $('#popup_stt_id').find('option:selected').attr('value') * 1;
    var url = window.webservicePath + "/UpdateSodSatus";
    var datastr = "{sodId:'" + sodFId + "',sttId:" + sttId + "}";
    $.ajax({
        type: "POST",
        url: url,
        contentType: "application/json; charset=utf-8",
        data: datastr,
        dataType: "json",
        success: function(data) {
            //location.reload();
            closeDialog();
            js_searchstatus();
            HidePleaseWait();
        },
        error: function(data) {
            //location.reload();
            HidePleaseWait();
        }
    });
    return false;
}


function viewSodItem(fId) {
    //myApp.showPleaseWait();
    var url = 'SupplierOrder.aspx?sodId=' + fId + "&mode=view";
    //window.location.href = url;
    var win = window.open(url, '_blank');
    win.focus();
}


var allSodSttArchv = [];
function updateSttArchvClick() {
    ShowPleaseWait();
    allSodSttArchv = [];
    var url = window.webservicePath + "/SearchSodStatus";
    var cliId = seltectedClientId * 1;
    var supId = seltectedSupId * 1;
    var dFrom = $('#DateCreationFrom').val();
    var dTo = $('#DateCreationTo').val();
    var sttId = 7;

    var jsondata = JSON.stringify({
        dFrom: dFrom,
        dTo: dTo,
        supId: supId,
        cliId: cliId,
        sttId: sttId
    });
    $.ajax({
        url: url,
        type: 'POST',
        contentType: 'application/json; charset=utf-8',
        data: jsondata,
        dataType: 'json',
        success: function(data) {
            //console.log(data);
            var jsdata = data.d;
            var jsondata = jQuery.parseJSON(jsdata);
            allSodSttArchv = jsondata;
            HidePleaseWait();
            if (allSodSttArchv.length > 0) {
                HidePleaseWait();

                var startBox = "<div class='box'><div class='box-body'>";
                var endBox = "</div></div>";
                var onelineContent =
                    // start box
                    "<div class='form-group' id='div_one_line'>" +
                        "<div class='row'>" +
                        "<div class='col-md-12'>" +
                        "<div class='box-body divstatus'><div class='tools hidden-xs'><span class='badge badge-red' style='display:none;' id='div_sod_archv_count'></span></div>" +
                        "<div class='form-horizontal' id='div_sod_archv'>" +
                        "</div>" +
                        // close box
                        "</div></div></div></div></div>";

                var btnClose = "<button class='btn btn-default bootbox-close-button '><span>Clôturer</span></button>";

                var btns = "<div class='modal-body center'>" + btnClose + "</div>";
                var onecontent = startBox + onelineContent + btns + endBox;

                var title = 'Les commandes archivée 已归档的订单';
                bootbox.dialog({
                        title: title,
                        message: onecontent
                    })
                    .find('.modal-content').css({
                        'margin-top': function() {
                            var w = $(window).height();
                            var b = $(".modal-dialog").height();
                            // should not be (w-h)/2
                            var h = (w - b) * 0;
                            return h + "px";
                        }
                    }).find('.modal-header').css({
                        'background': 'url(../../img/menu_005_bg.jpg) repeat-x',
                        'text-align': 'center',
                        'color': '#C0C0C0'
                    });
                setSodSttDivContent(allSodSttArchv, '#div_sod_archv', '#div_sod_archv_count');
            } else {
            //NO RESULT
                HidePleaseWait();

                var startBox = "<div class='box'><div class='box-body'>";
                var endBox = "</div></div>";
                var onelineContent =
                    // start box
                    "<div class='form-group' id='div_one_line'>" +
                        "<div class='row'>" +
                        "<div class='col-md-12'>" +
                        "<div class='box-body divstatus'><div class='tools hidden-xs'><span class='badge badge-red' style='display:none;' id='div_sod_archv_count'></span></div>" +
                        "<div class='form-horizontal' id='div_sod_archv'>NON RESULTAT 没有找到结果" +
                        "</div>" +
                        // close box
                        "</div></div></div></div></div>";

                var btnClose = "<button class='btn btn-default bootbox-close-button '><span>Clôturer</span></button>";

                var btns = "<div class='modal-body center'>" + btnClose + "</div>";
                var onecontent = startBox + onelineContent + btns + endBox;

                var title = 'Les commandes archivée 已归档的订单';
                bootbox.dialog({
                        title: title,
                        message: onecontent
                    })
                    .find('.modal-content').css({
                        'margin-top': function() {
                            var w = $(window).height();
                            var b = $(".modal-dialog").height();
                            // should not be (w-h)/2
                            var h = (w - b) * 0;
                            return h + "px";
                        }
                    }).find('.modal-header').css({
                        'background': 'url(../../img/menu_005_bg.jpg) repeat-x',
                        'text-align': 'center',
                        'color': '#C0C0C0'
                    });
            }
        },
        error: function(data) {
            HidePleaseWait();
        }
    });


    return false;
}
