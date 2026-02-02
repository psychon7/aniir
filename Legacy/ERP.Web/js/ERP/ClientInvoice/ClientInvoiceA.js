document.onkeydown = function (e) {
    var keyCode = e.keyCode || e.which || e.charCode;
    var ctrlKey = e.ctrlKey || e.metaKey;
    if (ctrlKey && keyCode === 89) {
        //alert('save');
        if (_isView) {
            var cliId = currentCin.CliFId;
            var height = $(window).height();
            var width = $(window).width();
            width = width * 0.8;
            width = width.toFixed(0);
            var clientname = $('#ip_Client').val();
            var url = '../Client/ClientPrice.aspx?cliId=' + cliId + '&cliname=' + clientname;
            window.open(url, 'popupWindow', 'height=' + height + ', width=' + width + ', top=0, left=0, toolbar=no, menubar=no, scrollbars=no, resizable=no,location=no, status=no');
        }
        e.preventDefault();
    }
}

$(document).ready(init);

var dtdGetAllTva = $.Deferred();
var dtdGetPco = $.Deferred();
var dtdGetPmo = $.Deferred();
var dtdGetCommercial = $.Deferred();
var dtdGetRestAvoir = $.Deferred();
var dtdGetCurrency = $.Deferred();
var dtdGetAllClient = $.Deferred();
function init() {    
    //getCommercials();
    //restAvoir();
    //var cinId = getUrlVars()['cinId'];
    //    js_getAllTVA('VatId');
    //    js_getAllCurrency('CurId');
    //    js_GetPaymentCondition('PcoId');
    //    js_GetPaymentMode('PmoId');
    //$.when(getCinForAvoir(dtdGetRestAvoir)).done(function () {
    //$.when(_getAllClient(dtdGetAllClient)).done(function() {
    // 20241213 注释掉了，直接获取所有客户，太浪费时间了。

    loadAllBankInfo();
        $.when(_getCurrenty(dtdGetCurrency)).done(function() {
            $.when(_getAllTva(dtdGetAllTva)).done(function() {
                $.when(_getPco(dtdGetPco)).done(function() {
                    $.when(_getPmo(dtdGetPmo)).done(function() {
                        $.when(_getCom(dtdGetCommercial)).done(function() {
                            ShowPleaseWait();
                            iniClientInvoiceLine();
                            var cinId = getUrlVars()['cinId'];
                            if (cinId) {
                                if (_isView || _isModify) {
                                    LoadClientInvoice();
                                    // load lines
                                    if (_isView) {
                                        $('._infoCollapse').click();
                                    }
                                }
                            } else {
                                //js_getClient('Client');
                                initMode();
                                $.each(allBankInfo, function (order, oneinfo) {
                                    $('#CinBank').append($("<option>" + oneinfo.RibTitle + "</option>").attr("value", oneinfo.Id));
                                });
                            }
                            if (_isCreate || _isModify) {
                                if (_isCreate) {
                                    // 20241216 给予提示，用于创建的提示。
                                    var msg = "Il existe deux modes pour créer AVOIR<br/>" +
                                        "1. Recherchez par CODE DE FACTURE et liez directement à la FACTURE correspondante.<br/>" +
                                        "2. Sélectionnez le client, trouvez l'AFFAIRE été créée au cours de l’année écoulée.";
                                    MsgPopUpWithResponse('NOTICE',msg,'');
                                }
                                $('#div_cin_general_info').removeClass('col-md-9');
                                $('#div_cin_general_info').addClass('col-md-12');
                                $('#div_cin_payement').removeClass('col-md-3');
                                $('#div_cin_payement').addClass('col-md-0');
                            }
                            if (!jQuery.isEmptyObject(connectedUser) && connectedUser.LoginMode === 1) {
                                $('#_dCreationString').prop("disabled", false);
                                $('#_CinDInvoice').prop("disabled", false);
                            }
                            $('#PcoId').change();
                            setAutoCompleteClient();
                            setAutoCompleteCin();
                        });
                    });
                });
            });
        //});
        HidePleaseWait();

        SetLanguageBar();
    });
    //});


    //    if (_isCreate || _isModify) {
    //        $('#div_cin_general_info').removeClass('col-md-9');
    //        $('#div_cin_general_info').addClass('col-md-12');
    //        $('#div_cin_payement').removeClass('col-md-3');
    //        $('#div_cin_payement').addClass('col-md-0');
    //    }

    //    if (cinId) {
    //        if (_isView || _isModify) {
    //            LoadClientInvoice();
    //            // load lines
    //            if (_isView) {
    //                $('._infoCollapse').click();
    //            }
    //        }
    //    } else {
    //        js_getClient('Client');

    //        initMode();
    //    }
    $.each($('.datepicker'), function (idx, value) {
        $(value).datepicker();
    });
    if (_isCreate) {
        $('#_dCreationString').val(getToday());
        $('#_CinDInvoice').val(getToday());
    }
}

var seltectedClientId = 0;
var selectedCliFId = '0';
var ClientList = [];
function setAutoCompleteClient() {
    var url = window.webservicePath + "/SearchClientByName";
    $("#ClientList").autocomplete({
        source: function (request, response) {
            $.ajax({
                url: url,
                data: "{ 'client': '" + request.term + "'}",
                dataType: "json",
                type: "POST",
                contentType: "application/json; charset=utf-8",
                success: function (data) {
                    seltectedClientId = 0;
                    selectedCliFId = '0';
                    var jsdata = data.d;
                    var data2Treat = jQuery.parseJSON(jsdata);
                    ClientList = [];
                    ClientList = data2Treat;
                    if (data2Treat.length > 0) {
                        response($.map(data2Treat, function (item) {
                            return {
                                //label: item.Value,
                                label: (IsNullOrEmpty(item.Value2) ? item.Value : (item.Value + "-" + item.Value2)),
                                val: item.Key,
                            }
                        }));
                    } else {
                    }
                },
                error: function (response) {
                    //alert(response.responseText);
                    //console.log(response);
                },
                failure: function (response) {
                    alert(response.responseText);
                }
            });
        },
        select: function (e, i) {
            seltectedClientId = i.item.val * 1;
            selectedClientChanged(seltectedClientId);
        },
        minLength: 2
    });
}


function selectedClientChanged(cliId) {
    var url = window.webservicePath + "/GetClientById";
    var jsondata = JSON.stringify({ cliId: cliId });
    AjaxCall('post', url, jsondata, function (data) {
        if (data !== null) {
            selectedClient = data;
            //console.log(selectedClient);
            cinFIdseleced = '0';
            setConditions(selectedClient);
            js_getCcoByClient(selectedClient.FId);
            getClientProjects(selectedClient.FId);
            //getClientCostPlanInProgress(oneclient.FId);
            // 20210309
            if (IsCreate() || IsModify()) {
                seltectedClientId = selectedClient.Id;
                selectedCliFId = selectedClient.FId;
                $('#CinList').val('');
                $('#CinList').prop('disabled', true);
                setDefautCommercial(selectedClient);
            }
        } else {
            selectedClient = {};
        }
    });
}


var getCinForAvoir = function (dtdGetRestAvoir) {
    var url = window.webservicePath + "/GetCinForAvoir";
    $.ajax({
        type: "POST",
        url: url,
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        success: function (data) {
            var jsdata = data.d;
            var data2Treat = jQuery.parseJSON(jsdata);
            if (data2Treat !== '-1') {
                cinListForAvoir = [];
                cinListForAvoir = data2Treat;
                $('#ClientInvoiceList').empty();
                $('#ClientInvoiceList').append($("<option></option>").attr('value', '0').attr("data-value", '0').text('Veuillez sélectionner une facture'));

                $.each(data2Treat, function (name, value) {
                    var content = value.CinCode + " || € " + value.CinAmount.toLocaleString();
                    $('#ClientInvoiceList').append($("<option></option>").attr("data-value", value.FId).text(content));
                });
                disableAllFieldForAvoir();
                $('#ClientInvoiceList').change();

                $('.invoicelist').show();
                try {
                    closeDialog();
                } catch (e) {

                }
                dtdGetRestAvoir.resolve();
            } else {
                // authentication error
                AuthencationError();
                dtdGetRestAvoir.resolve();
            }
        },
        error: function (data) {
            var test = '';
            dtdGetRestAvoir.resolve();
        }
    });
    return dtdGetRestAvoir.promise();
}

var allTVA = [];
var _getAllTva = function (dtdGetAllTva) {
    var url = window.webservicePath + "/GetAllTVA";
    var budgetId = '#VatId';
    $.ajax({
        type: "POST",
        url: url,
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        success: function (data) {
            var jsdata = data.d;
            var data2Treat = jQuery.parseJSON(jsdata);
            if (data2Treat !== '-1') {
                allTVA = [];
                allTVA = data2Treat;
                $(budgetId).empty();
                $.each(data2Treat, function (name, value) {
                    $(budgetId)
                            .append($("<option></option>")
                                .attr("value", value.Key)
                                .text(value.Value));
                });
                dtdGetAllTva.resolve();
            }
            else {
                // authentication error
                AuthencationError();
                dtdGetAllTva.resolve();
            }
        },
        error: function (data) {
            var test = '';
            dtdGetAllTva.resolve();
        }
    });
    return dtdGetAllTva.promise();
}

var _getPco = function (dtdGetPco) {
    var url = window.webservicePath + "/GetPaymentCondition";
    var budgetId = '#PcoId';
    $.ajax({
        type: "POST",
        url: url,
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        success: function (data) {
            var jsdata = data.d;
            var data2Treat = jQuery.parseJSON(jsdata);
            if (data2Treat !== '-1') {
                // 给element 赋值
                if (budgetId !== '#0') {
                    $(budgetId).empty();
                    $.each(data2Treat, function (name, value) {
                        $(budgetId)
                            .append($("<option></option>")
                                .attr("value", value.Key)
                                .attr("data-value", value.ValuePCO)
                                .text(value.Value));
                    });
                }
                dtdGetPco.resolve();
            }
            else {
                // authentication error
                AuthencationError();
                dtdGetPco.resolve();
            }
        },
        error: function (data) {
            var test = '';
            dtdGetPco.resolve();
        }
    });
    return dtdGetPco.promise();
}

var _getPmo = function (dtdGetPmo) {
    var url = window.webservicePath + "/GetPaymentMode";
    var budgetId = '#PmoId';
    $.ajax({
        type: "POST",
        url: url,
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        success: function (data) {
            var jsdata = data.d;
            var data2Treat = jQuery.parseJSON(jsdata);
            if (data2Treat !== '-1') {
                // 给element 赋值
                if (budgetId !== '#0') {
                    $(budgetId).empty();
                    $.each(data2Treat, function (name, value) {
                        $(budgetId)
                            .append($("<option></option>")
                                .attr("value", value.Key)
                                .text(value.Value));
                    });
                }
                dtdGetPmo.resolve();
            }
            else {
                // authentication error
                AuthencationError();
                dtdGetPmo.resolve();
            }
        },
        error: function (data) {
            var test = '';
            dtdGetPmo.resolve();
        }
    });
    return dtdGetPmo.promise();
}

var allCommercials = [];
var _getCom = function (dtdGetCommercial) {
    var url = window.webservicePath + "/GetSubCommercial";
    $.ajax({
        type: "POST",
        url: url,
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        success: function (data) {
            var jsdata = data.d;
            var data2Treat = jQuery.parseJSON(jsdata);
            if (data2Treat !== '-1') {
                allCommercials = [];
                allCommercials = data2Treat;
                //if (_isCreate) {
                // mode create
                // set commercial
                $('#UsrCom1').empty();
                $('#UsrCom2').empty();
                $('#UsrCom3').empty();
                $('#UsrCom1').append($("<option>Sélectionner un commercial</option>").attr("value", "0"));
                $('#UsrCom2').append($("<option>Sélectionner un commercial</option>").attr("value", "0"));
                $('#UsrCom3').append($("<option>Sélectionner un commercial</option>").attr("value", "0"));
                $.each(allCommercials, function (order, oneCom) {
                    if (_isCreate) {
                        if (connectedUser.Id === oneCom.Id) {
                            $('#UsrCom1').append($("<option>" + oneCom.FullName + "</option>").attr("value", oneCom.Id).attr("selected", true));
                        } else {
                            $('#UsrCom1').append($("<option>" + oneCom.FullName + "</option>").attr("value", oneCom.Id));
                        }
                    } else {
                        $('#UsrCom1').append($("<option>" + oneCom.FullName + "</option>").attr("value", oneCom.Id));
                    }

                    $('#UsrCom2').append($("<option>" + oneCom.FullName + "</option>").attr("value", oneCom.Id));
                    $('#UsrCom3').append($("<option>" + oneCom.FullName + "</option>").attr("value", oneCom.Id));
                });
                //}
                dtdGetCommercial.resolve();
            } else {
                // authentication error
                AuthencationError();
                dtdGetCommercial.resolve();
            }
        },
        error: function (data) {
            var test = '';
            dtdGetCommercial.resolve();
        }
    });
    return dtdGetCommercial.promise();
}


var _getCurrenty = function (dtdGetCurrency) {
    var url = window.webservicePath + "/GetAllCurrency";
    var budgetId = '#CurId';
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
                $.each(data2Treat, function (name, value) {
                    $(budgetId)
                        .append($("<option></option>")
                            .attr("value", value.Key)
                            .text(value.Value2 + " " + value.Value));
                });
            }
            else {
                // authentication error
                AuthencationError();
            }
            dtdGetCurrency.resolve();
        },
        error: function (data) {
            var test = '';
            dtdGetCurrency.resolve();
        }
    });
    return dtdGetCurrency.promise();
}


var allClient = [];
var _getAllClient = function (dtdGetAllClient) {
    var url = window.webservicePath + "/GetAllClients";
    var budgetId = '#Client';
    $.ajax({
        type: "POST",
        url: url,
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        success: function (data) {
            var jsdata = data.d;
            var data2Treat = jQuery.parseJSON(jsdata);
            if (data2Treat !== '-1') {
                allClient = data2Treat;
                var cinId = getUrlVars()['cinId'];
                if (cinId) {

                } else {
                    if (_isCreate) {
                        $(budgetId).empty();
                        $(budgetId).append($("<option></option>").attr("value", '0').attr("data-value", '0')
                                                    .text('Sélectionner un Client'));

                        $.each(data2Treat, function (name, value) {
                        
                        var companyname = value.CompanyName + (IsNullOrEmpty(value.CliAbbr) ? "" : ("-" + value.CliAbbr));
                            $(budgetId).append($("<option></option>")
                                                    .attr("value", value.FId).attr("data-value", value.FId)
                                                    .text(companyname));
                            //console.log(value.Id);
                        });
                    }
                }
            } else {
                // authentication error
                AuthencationError();
            }
            dtdGetAllClient.resolve();
        },
        error: function (data) {
            var test = '';
            dtdGetAllClient.resolve();
        }
    });
    HidePleaseWait();
    return dtdGetAllClient.promise();
}

var currentCin = [];

function LoadClientInvoice() {
    var cinId = getUrlVars()['cinId'];
    if (cinId) {
        var url = window.webservicePath + "/LoadClientInvoice";
        var datastr = "{cinId:'" + cinId + "'}";
        $.ajax({
            type: "POST",
            url: url,
            contentType: "application/json; charset=utf-8",
            data: datastr,
            dataType: "json",
            success: function (data) {
                var jsdata = data.d;
                var data2Treat = jQuery.parseJSON(jsdata);
                if (data2Treat !== '-1' && !jQuery.isEmptyObject(data2Treat)) {
                    var oneCin = data2Treat;
                    currentCin = [];
                    currentCin = oneCin;
                    setClientInvoiceField(currentCin);
                    seltectedClientId = currentCin.CliId;
                    selectedCliFId = currentCin.CliFId;
                    if (!currentCin.CinIsInvoiced) {
                        $('#btn_cin_invoiced').show();
                    } else {
                        $('#btn_cin_invoiced').hide();
                        $('#btn_modify_top').hide();
                        $('#btn_modify_bottom').hide();
                        $('#btn_add_line_top').hide();
                        $('#btn_add_line_bottom').hide();
                        $('#btn_add_drv_top').hide();
                        $('#btn_add_drv_bottom').hide();
                        $('#lb_cin_status').text('DÉJÀ FACTURÉ');
                    }
                    if (_isModify) {
                        $('#Client').attr('disabled', '');
                        $('#CinAccount').attr('disabled', '');
                        $('#CplName').attr('disabled', '');
                        $('#CodName').attr('disabled', '');
                    }
                    if (!currentCin.CinIsFullPaid) {
                        $('#btn_cin_allpaid').show();
                    } else {
                        $('#btn_cin_allpaid').hide();
                    }
                    setClickableLabel();
                    //getClientCostPlanInProgress(oneCod.CliId, oneCod.CplFId);
                    js_getCcoByClient(oneCin.CliFId, oneCin.CcoIdInvoicing, oneCin.CcoIdDelivery);
                    loadCinPayementInfo();
                    
                    // 20230923 显示名称
                    var doctitle = currentCin.CinCode + '-' + currentCin.ClientCompanyName;
                    document.title = doctitle;
                    
                    //////////////////////////////////////
                    // for client invoice line
                    iniClientInvoiceLine();
                    initMode();
                    getCurrentSoc();
                } else {
                    if (jQuery.isEmptyObject(data2Treat)) {
                        MsgPopUpWithResponse('ERREUR', 'Vous avez des droits insuffisants pour accéder à cette page.<br/>Veuillez contacter votre administrateur !', 'BackToSearch()');
                    } else {
                        // authentication error
                        AuthencationError();
                    }
                }
            },
            error: function (data) {
                var test = '';
            }
        });
    }
}
function BackToSearch() {
    window.location = 'SearchClientInvoice.aspx';
}

function setClientInvoiceField(cin) {
    $.each(cin, function (name, value) {

        var setThisvalue = true;
        if (name === 'ClientCompanyName') {
            //$('#Client').empty();
            //var companyname = cin.ClientCompanyName + (IsNullOrEmpty(cin.CliAbbr) ? "" : ("-" + cin.CliAbbr));
            //$('#Client').append($("<option></option>").attr("data-value", cin.CliFId).text(companyname));
            //$('#Client').attr('disabled', '');
            $('#ClientList').empty();
            var companyname = cin.ClientCompanyName + (IsNullOrEmpty(cin.CliAbbr) ? "" : ("-" + cin.CliAbbr));
            $('#ClientList').val(companyname);
            $('#ClientList').attr('disabled', '');
        } else if (name === 'PrjName') {
            $('#PrjName').empty();
            $('#PrjName').append($("<option></option>").attr("data-value", cin.PrjFId).text(value));
            $('#PrjName').attr('disabled', '');
        } else if (name === 'CodName') {
            $('#CodName').empty();
            $('#CodName').append($("<option></option>").attr("data-value", cin.CodFId).text(value));
            $('#CodName').attr('disabled', '');
        } else if (name === 'CplName') {
            $('#CplName').empty();
            $('#CplName').append($("<option></option>").attr("data-value", cin.CplFId).text(value));
            $('#CplName').attr('disabled', '');
        } else {
            var newname = name;
            if (name === 'Inv_CcoCity') {
                newname = 'Inv_ip_CcoCity';
            }
            else if (name === 'ClientCompanyName') {
                newname = 'Client';
            }
            else if (name === 'Dlv_CcoCity') {
                newname = 'Dlv_ip_CcoCity';
            }
            else if (name === 'CinDCreation') {
                newname = '_dCreationString';
                setFieldValue(newname, value, true, null, true);
            }
            else if (name === 'CinDUpdate') {
                newname = '_dUpdateString';
                setFieldValue(newname, value, true, null, true);
            }
            else if (name === 'CinDInvoice') {
                newname = '_CinDInvoice';
                setFieldValue(newname, value, true, null, true);
            }
            else if (name === 'CinDTerm') {
                newname = '_CinDTerm';
                setFieldValue(newname, value, true, null, true);
            }
            else if (name === 'CinDEncaissement') {
                newname = '_CinDEncaissement';
                setFieldValue(newname, value, true, null, true);
            }
            else if (name === 'CliId') {
                selectedClient.Id = value;
            }
            else if (name === 'CinDiscountAmount') {
                newname = '_CinDiscountAmount';
                setFieldValue(newname, value, true);
            }
            else {
                if (name === 'CinFile') {
                    if (value !== '' && value !== "" && value !== null) {
                        var src = "../Common/PageForPDF.aspx?type=3&cinId=" + encodeURIComponent(cin.FId);
                        $('#iframepdf').attr('src', src);
                        $('#btn_delete_cod_file').show();
                    } else {
                        $('#iframepdf').attr('height', '0');
                        $('#a_collapse').click();
                        $('#btn_delete_cod_file').hide();
                    }
                }
                if (name === 'Creator') {
                    newname = 'CreatorName';
                    value = value.FullName;
                }

                if (name === 'Dlv_CcoCity') {
                    newname = 'Dlv_ip_CcoCity';
                }
                if (name === 'CinAccount') {
                    if (value) {
                        $('.invoicelist').show();
                    }
                }
                if (name === 'CinAvoir') {
                    if (!jQuery.isEmptyObject(value)) {
                        var content = value.CinCode + " || € " + value.CinAmount.toLocaleString();
//                        $('#ClientInvoiceList').empty();

//                        $('#ClientInvoiceList').append($("<option></option>").attr("data-value", value.FId).text(content));
//                        $('#ClientInvoiceList').attr('disabled', '');
//                        $('#ClientInvoiceList').css('color', 'red');

                        $('#CinList').val(content);
                        $('#CinList').attr('disabled', '');
                        $('#CinList').css('color', 'red');
                    } else {
//                        $('#ClientInvoiceList').empty();
//                        $('#ClientInvoiceList').prop('disabled', true);

                        $('#CinList').val('');
                        $('#CinList').attr('disabled', true);

                    }
                    setThisvalue = false;
                }
            }
            if (name === 'DfoId') {
                if (value === null) {
                    $('.fordfo').hide();
                } else {
                    $('.fordfo').show();
                }
            }
            if (newname.indexOf('_') === 0) {
                setThisvalue = false;
            }
            if (name === 'CinBank') {
                //console.log(value);
                $.each(allBankInfo, function (order, oneinfo) {
                    if (IsNullOrEmpty(value) || value === 1 || value === oneinfo.Id) {
                        $('#CinBank').append($("<option>" + oneinfo.RibTitle + "</option>").attr("value", oneinfo.Id).attr("selected", true));
                    }
                    else {
                        $('#CinBank').append($("<option>" + oneinfo.RibTitle + "</option>").attr("value", oneinfo.Id));
                    }
                });
            }

            if (name === 'UsrCom1' || name === 'UsrCom2' || name === 'UsrCom3') {
                if (name === 'UsrCom1') {
                    $('#UsrCom1').empty();
                    if (_isModify) {
                        $('#UsrCom1').append($("<option>Sélectionner un commercial</option>").attr("value", "0"));
                    }
                    $.each(allCommercials, function (order, oneCom) {
                        if (oneCom.Id === value) {
                            $('#UsrCom1').append($("<option>" + oneCom.FullName + "</option>").attr("value", oneCom.Id).attr("selected", true));
                        } else {
                            if (_isModify) {
                                $('#UsrCom1').append($("<option>" + oneCom.FullName + "</option>").attr("value", oneCom.Id));
                            }
                        }
                    });
                    if (_isView) {
                        $('#UsrCom1').prop('disabled', true);
                    }
                } else if (name === 'UsrCom2') {
                    $('#UsrCom2').empty();
                    if (_isModify) {
                        $('#UsrCom2').append($("<option>Sélectionner un commercial</option>").attr("value", "0"));
                    }
                    $.each(allCommercials, function (order, oneCom) {
                        if (oneCom.Id === value) {
                            $('#UsrCom2').append($("<option>" + oneCom.FullName + "</option>").attr("value", oneCom.Id).attr("selected", true));
                        } else {
                            if (_isModify) {
                                $('#UsrCom2').append($("<option>" + oneCom.FullName + "</option>").attr("value", oneCom.Id));
                            }
                        }
                    });
                    if (_isView) {
                        $('#UsrCom2').prop('disabled', true);
                    }
                } else if (name === 'UsrCom3') {
                    $('#UsrCom3').empty();
                    if (_isModify) {
                        $('#UsrCom3').append($("<option>Sélectionner un commercial</option>").attr("value", "0"));
                    }
                    $.each(allCommercials, function (order, oneCom) {
                        if (oneCom.Id === value) {
                            $('#UsrCom3').append($("<option>" + oneCom.FullName + "</option>").attr("value", oneCom.Id).attr("selected", true));
                        } else {
                            if (_isModify) {
                                $('#UsrCom3').append($("<option>" + oneCom.FullName + "</option>").attr("value", oneCom.Id));
                            }
                        }
                    });
                    if (_isView) {
                        $('#UsrCom3').prop('disabled', true);
                    }
                }
                setThisvalue = false;
            }

            if (setThisvalue) {
                setFieldValue(newname, value, true);
            }
        }
    });
}

var allclient = [];

function js_getClient(elementId) {
    ShowPleaseWait();
    var url = window.webservicePath + "/GetAllClients";
    var budgetId = '#' + elementId;
    $.ajax({
        type: "POST",
        url: url,
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        success: function (data) {
            HidePleaseWait();
            var jsdata = data.d;
            var data2Treat = jQuery.parseJSON(jsdata);
            if (data2Treat !== '-1') {
                $(budgetId).empty();
                allclient = [];
                allclient = data2Treat;
                $.each(data2Treat, function (name, value) {
                    $(budgetId)
                        .append($("<option></option>")
                            .attr("data-value", value.FId)
                            .text(value.CompanyName));
                });
                $(budgetId).change();
                //setClientByPrjId();
            } else {
                // authentication error
                AuthencationError();
            }
        },
        error: function (data) {
            HidePleaseWait();
            var test = '';
        }
    });
}

var selectedClient = {};

function js_clientChange(sender) {
    //var clientCompany = $(sender).val() * 1;
    //var cinselectId = $('#ClientInvoiceList :selected').val() * 1;
    ////var oneclient = searchFieldValueInArray(allclient, 'CompanyName', clientCompany);
    //var oneclient = searchFieldValueInArray(allclient, 'Id', clientCompany);
    //var oneclientForAllClient = searchFieldValueInArray(allClient, 'FId', clientCompany);
    //if ((oneclient && oneclient.Id !== undefined) || (oneclientForAllClient && oneclientForAllClient.Id !== undefined)) {
    //    oneclient = (oneclient && oneclient.Id !== undefined) ? oneclient : oneclientForAllClient;
    //    selectedClient = oneclient;
    //    setConditions(selectedClient);
    //    js_getCcoByClient(oneclient.FId);
    //             // 20210309
    //    if (IsCreate() || IsModify()) {
    //        setDefautCommercial(selectedClient);
    //    }
    //    if (cinselectId !== 0) {
    //        getClientProjects(oneclient.FId);
    //    } else {
    //        $('#PrjName').empty();
    //        $('#CplName').empty();
    //        $('#CplCode').val('');
    //        $('#CodName').empty();
    //        $('#CodCode').val('');
    //    }
    //}
    var curlength = $(sender).val().length;
    if (curlength == 0) {
        $('#CinList').prop("disabled", false);
        $('#CinList').val('');
        $('#PrjName').empty();
        $('#CodName').empty();
        $('#CodCode').val('');
        $('#CplName').empty();
        $('#CplCode').val('');
        seltectedClientId = 0;
        selectedCliFId = '0';
    }
}


// 20210309
function setDefautCommercial() {
    if (!jQuery.isEmptyObject(selectedClient)) {

        $('#UsrCom1').val(selectedClient.UsrIdCom1).change();
        $('#UsrCom2').val(selectedClient.UsrIdCom2).change();
        $('#UsrCom3').val(selectedClient.UsrIdCom3).change();
        //        $('#UsrCom1').append($("<option>" + oneCom.FullName + "</option>").attr("value", oneCom.Id));
        //        $('#UsrCom2').append($("<option>" + oneCom.FullName + "</option>").attr("value", oneCom.Id));
        //        $('#UsrCom3').append($("<option>" + oneCom.FullName + "</option>").attr("value", oneCom.Id));
    }
}


function setConditions(client) {
    $('#PcoId').val(client.PcoId);
    $('#PmoId').val(client.PmoId);
    $('#VatId').val(client.VatId);
    $('#CurId').val(client.CurId);
}

function js_clientLostFocus(sender) {
    var clientCompany = $(sender).val();
    var oneclient = searchFieldValueInArray(allclient, 'CompanyName', clientCompany);
    if (!(oneclient && oneclient.Id !== undefined)) {
        setDivValueEmpty('div_invoicing_address');
        setDivValueEmpty('div_delivery_address');
        selectedClient = {};
        $('#Inv_CcoAdresseTitle').empty();
        $('#Inv_CcoAdresseTitle').append($("<option></option>")
            .attr("value", 0)
            .text('Nouvelle adresse de la facture'));
        $('#Dlv_CcoAdresseTitle').empty();
        $('#Dlv_CcoAdresseTitle').append($("<option></option>")
            .attr("value", 0)
            .text('Nouvelle adresse de la livraison'));
        $('#PrjName').empty();
        $('#PrjName').append($("<option>Nouveau projet</option>").attr("value", "0"));
    }
}

var allCostPlanForThisClient = [];

function getClientCostPlanInProgress(cliId, dfvalue) {
    var url = window.webservicePath + "/GetClientCostPlanInProgress";
    var params = "{cliId : '" + cliId + "'}";
    $.ajax({
        type: "POST",
        url: url,
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        data: params,
        success: function (data) {
            var jsdata = data.d;
            var data2Treat = jQuery.parseJSON(jsdata);
            $('#CplName').empty();
            if (_isCreate)
            { $('#CplName').append($("<option>Nouveau Devis</option>").attr("value", "0")); }
            if (data2Treat !== '-1') {
                allCostPlanForThisClient = [];
                if (_isView || _isModify) {
                    allCostPlanForThisClient = searchInArray(data2Treat, 'CstId', 2);
                } else {
                    allCostPlanForThisClient = searchInArray(data2Treat, 'CstId', 1);
                }
                //allCostPlanForThisClient = data2Treat;
                $.each(allCostPlanForThisClient, function (name, value) {
                    if (dfvalue && dfvalue === value.FId) {
                        $('#CplName').append($("<option>" + value.CplName + "</option>").attr("value", value.FId).attr("selected", true));
                    } else {
                        $('#CplName').append($("<option>" + value.CplName + "</option>").attr("value", value.FId));
                    }

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

function costPlanChange(sender) {
    var selectedPrjId = $(sender).val();
    if (selectedPrjId !== 0 && selectedPrjId !== '0') {
        var onePrj = searchFieldValueInArray(allCostPlanForThisClient, 'FId', selectedPrjId);
        if (onePrj && onePrj.FId !== undefined) {
            setFieldValue('PcoId', onePrj.PcoId);
            setFieldValue('PmoId', onePrj.PmoId);
            setFieldValue('VatId', onePrj.VatId);
            setFieldValue('CodHeaderText', onePrj.CodHeaderText);
            setFieldValue('CodFooterText', onePrj.CodFooterText);
            setFieldValue('CodClientComment', onePrj.CodClientComment);
            setFieldValue('CodInterComment', onePrj.CodInterComment);
        } else {
            setFieldValue('CodHeaderText', '');
            setFieldValue('CodFooterText', '');
            setFieldValue('CodClientComment', '');
            setFieldValue('CodInterComment', '');
        }
    } else {
        setFieldValue('CodHeaderText', '');
        setFieldValue('CodFooterText', '');
        setFieldValue('CodClientComment', '');
        setFieldValue('CodInterComment', '');
    }
}

//function setClientByPrjId() {
//    var prjId = getParameterByName('prjId');
//    if (prjId && _isCreate) {
//        var url = window.webservicePath + "/GetClientId";
//        var datastr = "{itemId:'" + prjId + "',typeId:1}";
//        $.ajax({
//            type: "POST",
//            url: url,
//            contentType: "application/json; charset=utf-8",
//            dataType: "json",
//            data: datastr,
//            success: function (data) {
//                var jsdata = data.d;
//                var data2Treat = jsdata;
//                if (data2Treat !== '-1') {
//                    try {
//                        var oneclient = searchFieldValueInArray(allclient, 'FId', data2Treat);
//                        if (oneclient) {
//                            $('#Client').val(oneclient.CompanyName);
//                            $('#Client').attr('disabled', '');
//                            js_getCcoByClient(oneclient.FId);
//                        }
//                    } catch (e) {
//                        var catchE = e;
//                    }

//                } else {
//                    // authentication error
//                    AuthencationError();
//                }
//            },
//            error: function (data) {
//                var test = '';
//            }
//        });
//    }
//}

var ccoInvoice = [];
var ccoDelivery = [];

function js_getCcoByClient(cliId, ccoInvId, ccoDlvId) {
    var url = window.webservicePath + "/LoadContactClientsByCliId";
    var params = "{cliId : '" + cliId + "'}";
    $.ajax({
        type: "POST",
        url: url,
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        data: params,
        success: function (data) {
            var jsdata = data.d;
            var data2Treat = jQuery.parseJSON(jsdata);
            if (data2Treat !== '-1') {
                ccoInvoice = [];
                ccoDelivery = [];
                $.each(data2Treat, function (name, value) {
                    if (value.CcoIsInvoicingAdr) {
                        ccoInvoice.push(value);
                    }
                    if (value.CcoIsDeliveryAdr) {
                        ccoDelivery.push(value);
                    }
                });
                js_set_invoice_contact(ccoInvId);
                js_set_delivery_contact(ccoDlvId);
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

function js_set_invoice_contact(ccoId) {
    if (ccoInvoice) {
        $('#Inv_CcoAdresseTitle').empty();
        $.each(ccoInvoice, function (index, value) {
            if (ccoId && ccoId === value.CcoId) {
                $('#Inv_CcoAdresseTitle')
                    .append($("<option></option>")
                        .attr("value", value.CcoId).attr("selected", true)
                        .text(value.CcoAdresseTitle));
            } else {
                $('#Inv_CcoAdresseTitle')
                    .append($("<option></option>")
                        .attr("value", value.CcoId)
                        .text(value.CcoAdresseTitle));
            }
        });
        $('#Inv_CcoAdresseTitle').change();
        if (_isView) {
            $('#Inv_CcoAdresseTitle').attr("disabled", "");
        }
    }
}

function js_set_delivery_contact(ccoId) {
    if (ccoDelivery) {
        $('#Dlv_CcoAdresseTitle').empty();
        $.each(ccoDelivery, function (index, value) {
            if (ccoId && ccoId === value.CcoId) {
                $('#Dlv_CcoAdresseTitle')
                .append($("<option></option>")
                    .attr("value", value.CcoId).attr("selected", true)
                    .text(value.CcoAdresseTitle));
            } else {
                $('#Dlv_CcoAdresseTitle')
                .append($("<option></option>")
                    .attr("value", value.CcoId)
                    .text(value.CcoAdresseTitle));
            }
        });
        $('#Dlv_CcoAdresseTitle').change();
        if (_isView) {
            $('#Dlv_CcoAdresseTitle').attr("disabled", "");
        }
    }
}

function ccoChange(sender, inv) {
    var ccoId = $(sender).val() * 1;
    if (ccoId > 0) {
        var aCco = searchFieldValueInArray((inv ? ccoInvoice : ccoDelivery), 'CcoId', ccoId);
        if (aCco) {
            var ccoRef = (inv ? 'Inv_' : 'Dlv_') + 'CcoRef';
            var ccoFirstname = (inv ? 'Inv_' : 'Dlv_') + 'CcoFirstname';
            var ccoLastname = (inv ? 'Inv_' : 'Dlv_') + 'CcoLastname';
            var ccoAddress1 = (inv ? 'Inv_' : 'Dlv_') + 'CcoAddress1';
            var ccoAddress2 = (inv ? 'Inv_' : 'Dlv_') + 'CcoAddress2';
            var ccoPostcode = (inv ? 'Inv_' : 'Dlv_') + 'CcoPostcode';
            var ccoCity = (inv ? 'Inv_' : 'Dlv_') + 'CcoCity';
            var ccoCountry = (inv ? 'Inv_' : 'Dlv_') + 'CcoCountry';
            var ccoTel1 = (inv ? 'Inv_' : 'Dlv_') + 'CcoTel1';
            var ccoEmail = (inv ? 'Inv_' : 'Dlv_') + 'CcoEmail';
            var ccoFax = (inv ? 'Inv_' : 'Dlv_') + 'CcoFax';
            var ccoCellphone = (inv ? 'Inv_' : 'Dlv_') + 'CcoCellphone';

            $('#' + ccoRef).val(aCco.CcoRef);
            //if (!$('#' + ccoFirstname).val()) {
            $('#' + ccoFirstname).val(aCco.CcoFirstname);
            //            }
            //            if (!$('#' + ccoLastname).val()) {
            $('#' + ccoLastname).val(aCco.CcoLastname);
            //}
            //if (!$('#' + ccoAddress1).val()) {
            $('#' + ccoAddress1).val(aCco.CcoAddress1);
            //            }
            //            if (!$('#' + ccoAddress2).val()) {
            $('#' + ccoAddress2).val(aCco.CcoAddress2);
            //            }
            //            if (!$('#' + ccoPostcode).val()) {
            $('#' + ccoPostcode).val(aCco.CcoPostcode);
            //            }
            //            if (!$('#' + ccoCity).val()) {
            $('#' + ccoCity).val(aCco.CcoCity);
            //            }
            //            if (!$('#' + ccoCountry).val()) {
            $('#' + ccoCountry).val(aCco.CcoCountry);
            //            }
            //            if (!$('#' + ccoTel1).val()) {
            $('#' + ccoTel1).val(aCco.CcoTel1);
            //            }
            //            if (!$('#' + ccoEmail).val()) {
            $('#' + ccoEmail).val(aCco.CcoEmail);
            //            }
            //            if (!$('#' + ccoFax).val()) {
            $('#' + ccoFax).val(aCco.CcoFax);
            //            }
            //            if (!$('#' + ccoCellphone).val()) {
            $('#' + ccoCellphone).val(aCco.CcoCellphone);
            //            }
        }
    }
}

function js_create_update_clientorder() {
    var checkOK = CheckRequiredFieldInOneDiv('content');
    if (checkOK) {
        var aClientOrder = Object();
        aClientOrder.FId = getUrlVars()['codId'];
        aClientOrder.ClientCompanyName = $('#Client').val();
        aClientOrder.CplFId = $('#CplName  option:selected').val();
        aClientOrder.VatId = $('#VatId').val();
        aClientOrder.CodName = $('#CodName').val();
        aClientOrder.CliId = selectedClient.Id !== undefined ? (selectedClient.Id * 1) : 0;
        aClientOrder.PcoId = $('#PcoId').val();
        aClientOrder.PmoId = $('#PmoId').val();
        aClientOrder.CodHeaderText = $('#CodHeaderText').val();
        aClientOrder.CodFooterText = $('#CodFooterText').val();
        aClientOrder._CodDatePreDeliveryForm = $('#_CodDatePreDeliveryForm').val();
        aClientOrder._CodDatePreDeliveryTo = $('#_CodDatePreDeliveryTo').val();
        aClientOrder._CodDateEndWork = $('#_CodDateEndWork').val();
        aClientOrder.CodClientComment = $('#CodClientComment').val();
        aClientOrder.CodInterComment = $('#CodInterComment').val();
        // cco invoicing
        aClientOrder.CcoIdInvoicing = $('#Inv_CcoAdresseTitle  option:selected').val();
        aClientOrder.Inv_CcoFirstname = $('#Inv_CcoFirstname').val();
        aClientOrder.Inv_CcoLastname = $('#Inv_CcoLastname').val();
        aClientOrder.Inv_CcoRef = $('#Inv_CcoRef').val();
        aClientOrder.Inv_CcoAddress1 = $('#Inv_CcoAddress1').val();
        aClientOrder.Inv_CcoAddress2 = $('#Inv_CcoAddress2').val();
        aClientOrder.Inv_CcoPostcode = $('#Inv_CcoPostcode').val();
        aClientOrder.Inv_CcoCity = $('#Inv_ip_CcoCity').val();
        aClientOrder.Inv_CcoCountry = $('#Inv_CcoCountry').val();
        aClientOrder.Inv_CcoTel1 = $('#Inv_CcoTel1').val();
        aClientOrder.Inv_CcoFax = $('#Inv_CcoFax').val();
        aClientOrder.Inv_CcoCellphone = $('#Inv_CcoCellphone').val();
        aClientOrder.Inv_CcoEmail = $('#Inv_CcoEmail').val();
        // cco delivery
        aClientOrder.CcoIdDelivery = $('#Dlv_CcoAdresseTitle  option:selected').val();
        aClientOrder.Dlv_CcoFirstname = $('#Dlv_CcoFirstname').val();
        aClientOrder.Dlv_CcoLastname = $('#Dlv_CcoLastname').val();
        aClientOrder.Dlv_CcoRef = $('#Dlv_CcoRef').val();
        aClientOrder.Dlv_CcoAddress1 = $('#Dlv_CcoAddress1').val();
        aClientOrder.Dlv_CcoAddress2 = $('#Dlv_CcoAddress2').val();
        aClientOrder.Dlv_CcoPostcode = $('#Dlv_CcoPostcode').val();
        aClientOrder.Dlv_CcoCity = $('#Dlv_ip_CcoCity').val();
        aClientOrder.Dlv_CcoCountry = $('#Dlv_CcoCountry').val();
        aClientOrder.Dlv_CcoTel1 = $('#Dlv_CcoTel1').val();
        aClientOrder.Dlv_CcoFax = $('#Dlv_CcoFax').val();
        aClientOrder.Dlv_CcoCellphone = $('#Dlv_CcoCellphone').val();
        aClientOrder.Dlv_CcoEmail = $('#Dlv_CcoEmail').val();


        var jsondata = JSON.stringify({ oneClientOrder: aClientOrder });
        $.ajax({
            url: 'ClientOrder.aspx/CreateUpdateClientOrder',
            type: 'POST',
            contentType: 'application/json; charset=utf-8',
            data: jsondata,
            dataType: 'json',
            success: function (data) {
                var codId = data.d;
                var url = 'ClientOrder.aspx';
                var newUrl = url + '?codId=' + codId + '&mode=view';
                document.location.href = newUrl;
            },
            error: function (data) {
            }
        });
    }
    return false;
}

function ExternLinkClick(sender, newpage) {
    if (_isView && currentCin) {
        ExternLinkBaseClick(sender, currentCin, newpage);
        //        var page = $(sender).attr('pgid');
        //        var flid = $(sender).attr('flid');
        //        var par = $(sender).attr('prms');
        //        var etid = $(sender).attr('etid');
        //        var id = currentCin[etid];
        //        var url = "../" + flid + "/" + page + "?" + par + "=" + id + "&mode=view";
        //        document.location.href = url;
    }
}

///set clickable lable for externe link
function setClickableLabel() {
    if (_isView) {
        $("#lb_client").addClass("animated_menu");
        $("#lb_client").prop('title', 'Cliquer pour consulter le client');
        $('#lb_client').css('cursor', 'pointer');
        $("#lb_costplan").addClass("animated_menu");
        $("#lb_costplan").prop('title', 'Cliquer pour consulter le Devis');
        $('#lb_costplan').css('cursor', 'pointer');
        $("#lb_Project").addClass("animated_menu");
        $("#lb_Project").prop('title', 'Cliquer pour consulter l\'affaire');
        $('#lb_Project').css('cursor', 'pointer');
        $("#lb_clientorder").addClass("animated_menu");
        $("#lb_clientorder").prop('title', 'Cliquer pour consulter la commande');
        $('#lb_clientorder').css('cursor', 'pointer');
        $("#lb_cin_avoir_id").addClass("animated_menu");
        $("#lb_cin_avoir_id").prop('title', 'Cliquer pour consulter la facture');
        $('#lb_cin_avoir_id').css('cursor', 'pointer');
        $("#lb_dfo").addClass("animated_menu");
        $("#lb_dfo").prop('title', 'Cliquer pour consulter la bon de Livraison');
        $('#lb_dfo').css('cursor', 'pointer');

    }
}

function downloadPdf(sender) {
    var cinId = getUrlVars()['cinId'];
    // Create an IFRAME.
    //    var iframe = document.createElement("iframe");
    //    // Point the IFRAME to GenerateFile
    //    var url = "../Common/PageDownLoad.aspx?cplId=" + cplId;
    //    iframe.src = url;
    //    iframe.style.display = "none";
    //    document.body.appendChild(iframe);
    cinId = encodeURIComponent(cinId);

    window.open('../Common/PageDownLoad.aspx?cinId=' + cinId, '_blank');
    return false;
}

function AddModifyDiscount() {
    var cinId = getUrlVars()['cinId'];
    if (cinId) {
        var url = window.webservicePath + "/GetClientInvoiceInfo";
        var datastr = "{cinId:'" + cinId + "'}";
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
                    var cplInfo = data2Treat;
                    if (cplInfo && cplInfo.FId) {
                        UpdateDiscount(cplInfo);
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
    return false;
}

var htTtcRate = 1;

function UpdateDiscount(cplInfo) {
    var CinDiscountPercentage = cplInfo.CinDiscountPercentage;
    var CinDiscountAmount = cplInfo.CinDiscountAmount;
    var TotalAmountHt = cplInfo.TotalAmountHt;
    var TotalAmountTtc = cplInfo.TotalAmountTtc;
    var TotalMargin = cplInfo.TotalMargin;
    var TotalPurchasePrice = cplInfo.TotalPurchasePrice;
    var TotalSalePrice = cplInfo.TotalSalePrice;
    htTtcRate = (TotalAmountTtc - TotalAmountHt) / (TotalAmountHt === 0 ? 1 : TotalAmountHt);

    var startBox = "<div class='box'><div class='box-body'>";
    var endBox = "</div></div>";
    var onelineContent =
    // start box
        "<div class='form-group' id='div_one_line'>" +
            "<div class='row'>" +
            "<div class='col-md-12'>" +
            "<div class='box-body'>" +
            "<div class='form-horizontal'>" +
            "<div class='form-group'>" +
            "<label class='col-sm-2 control-label'>Montant total d'achat</label>" +
            "<div class='col-sm-2'><input type='text' id='TotalPurchasePrice' disabled value='" + TotalPurchasePrice + "' class='form-control' /></div>" +
            "<label class='col-sm-2 control-label'>Montant total de vente</label>" +
            "<div class='col-sm-2'><input type='text' value='" + TotalSalePrice + "' class='form-control' id='TotalSalePrice' disabled /></div>" +
            "<label class='col-sm-2 control-label'>Marge</label>" +
            "<div class='col-sm-2'><input type='text' value='" + TotalMargin + "' class='form-control' id='TotalMargin' disabled /></div>" +
            "</div>" +
            "<div class='form-group'>" +
            "<label class='col-sm-2 control-label'>Pourcentage de remise</label>" +
            "<div class='col-sm-2'><div class='input-group'><input type='number' step='0.01' class='form-control' id='CinDiscountPercentage' name='CinDiscountPercentage' value='" + CinDiscountPercentage + "' onkeyup='calculateDiscount(this)' /><span class='input-group-addon'>%</span></div></div>" +
            "<label class='col-sm-2 control-label sale'>Montant de remise</label>" +
            "<div class='col-sm-2 sale'><input type='number' step='0.01' class='form-control' id='CinDiscountAmount' name='CinDiscountAmount' value='" + CinDiscountAmount + "' onkeyup='calculateDiscount(this)' /></div>" +
            "<div class='col-sm-4'></div>" +
            "</div>" +
            "<div class='form-group'><label class='col-sm-2 control-label'>Montant total HT</label>" +
            "<div class='col-sm-2'><input type='text' value='" + TotalAmountHt.toFixed(2) + "' class='form-control' id='TotalAmountHt' disabled /></div>" +
            "<label class='col-sm-2 control-label'>Montant total TTC</label>" +
            "<div class='col-sm-2'><input type='text' value='" + TotalAmountTtc.toFixed(2) + "' class='form-control' id='TotalAmountTtc' disabled /></div>" +
            "<div class='col-sm-4'></div>" +
            "</div>" +
    // close box
            "</div></div></div></div></div>";

    var btnAddUpdate = "<button class='btn btn-inverse' id='btn_add_update_discount' name='btn_add_update_discount' onclick='return SaveDiscount()'><span>Sauvegarder</span></button>";
    var btnClose = "<button class='btn btn-default bootbox-close-button' onclick='return false'><span>Annuler</span></button>";

    var btns = "<div class='modal-body center'>" + btnAddUpdate + btnClose + "</div>";
    var onecontent = startBox + onelineContent + btns + endBox;

    var title = 'REMISE';
    bootbox.dialog({
        title: title,
        message: onecontent
    }).find('.modal-dialog').css({
        'width': '70%'
    }).find('.modal-content').css({
        'margin-top': function () {
            var w = $(window).height();
            var b = $(".modal-dialog").height();
            // should not be (w-h)/2
            var h = (w - b) * 0.15;
            return h + "px";
        }
    }).find('.modal-header').css({
        'background': 'url(../../img/menu_005_bg.jpg) repeat-x',
        'text-align': 'center',
        'color': 'white'
    });
    return false;
}

function calculateDiscount(sender) {
    var id = $(sender).attr('id');
    var thisval = $(sender).val();
    var disPercent = 0;
    var disAmount = 0;
    var totalsale = $('#TotalSalePrice').val() * 1;
    var totalPurcharse = $('#TotalPurchasePrice').val() * 1;
    if (id === 'CinDiscountPercentage') {
        disPercent = thisval;
        disAmount = disPercent * 0.01 * totalsale;
        disAmount = disAmount.toFixed(2);
        $('#CinDiscountAmount').val(disAmount);
    } else {
        disAmount = thisval;
        disPercent = (disAmount * 100 / (totalsale === 0 ? 1 : totalsale)).toFixed(2);
        $('#CinDiscountPercentage').val(disPercent);
    }
    var montantHt = (totalsale - disAmount).toFixed(2);
    $('#TotalAmountHt').val(montantHt);
    var montantTtc = ((htTtcRate + 1) * montantHt).toFixed(2);
    $('#TotalAmountTtc').val(montantTtc);
    var margin = (montantHt - totalPurcharse).toFixed(2);
    $('#TotalMargin').val(margin);
    if (margin <= 0) {
        $('#TotalMargin').css("color", "red");
    } else {
        $('#TotalMargin').css("color", "black");
    }
}

function SaveDiscount() {
    var cinId = getUrlVars()['cinId'];
    if (cinId) {
        var disAmount = $('#CinDiscountAmount').val();
        var disPercent = $('#CinDiscountPercentage').val();
        var url = window.webservicePath + "/AddUpdateClientInvoiceDiscount";
        var datastr = "{cinId:'" + cinId + "',discountPercentage:" + disPercent + ",discountAmount:'" + disAmount + "'}";
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
                    $('.bootbox-close-button').click();
                    LoadClientInvoice();
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
    return false;
}

function duplicateClientOrder() {
    var codId = getUrlVars()['codId'];
    if (codId) {
        var startBox = "<div class='box'><div class='box-body'>";
        var endBox = "</div></div></div>";
        var onelineContent =
        // start box
            "<div class='form-group' id='div_one_line'>" +
                "<div class='row'>" +
                "<div class='col-md-12'>" +
                "<div class='box-body'>" +
                "<div class='form-horizontal'>" +
                "<div class='form-group'>" +
                "<div class='col-sm-12' style='text-align:center;font-size: 18pt;'>Voulez-vous dupliquer la commande vers une nouvelle affaire ?</div>" +
                "</div>" +
        // close box
                "</div></div></div></div></div><div class='modal-footer center'>";
        var btnDuplicate = "<button class='btn btn-inverse' onclick='return duplicationClientOrderClick(true)'><span>Même Affaire</span></button>" +
            "<button class='btn btn-inverse' onclick='return duplicationClientOrderClick(false)'><span>Nouvelle Affaire</span></button>";
        var btnClose = "<button class='btn btn-default bootbox-close-button' onclick='return false'><span>Annuler</span></button>";


        var onecontent = startBox + onelineContent + btnDuplicate + btnClose + endBox;
        var title = 'DUPLIQUER LE DEVIS';
        bootbox.dialog({
            title: title,
            message: onecontent
        }).find('.modal-dialog').css({
            'width': '70%'
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
            'color': 'white'
        });
    }

    return false;
}

function duplicationClientOrderClick(sameProject) {
    var codId = getUrlVars()['codId'];
    var url = window.webservicePath + "/DuplicateClientOrder2CostPlan";
    var params = "{codId : '" + codId + "',sameProject:" + sameProject + "}";
    $.ajax({
        type: "POST",
        url: url,
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        data: params,
        success: function (data) {
            var jsdata = data.d;
            var data2Treat = jQuery.parseJSON(jsdata);
            if (data2Treat !== '-1') {
                var cplId = data2Treat;
                var url = '../CostPlan/CostPlan.aspx';
                var newUrl = url + '?cplId=' + cplId + '&mode=view';
                document.location.href = newUrl;
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

function uploadFile() {
    var title = "Télécharger un fichier";
    try {
        var content = "<div class='box'><div class='box-body' style='overflow-y:auto;overflow-x:hidden;'>" +
        "<form enctype='multipart/form-data'>" +
            "<div class='col-md-12'>" +
        // this div is for album photo
            "<div class='row' style='margin-bottom: 20px;'><div class='col-md-12' id='div_album_photo' style='text-align:center;'>" +
            "</div>" +
        // cancel and save buttons
            "</div>" +
            "</div>" +
        // this content contains upload photo
            "<div class='row' id='div_upload_photo'><div class='col-md-12' style='text-align: center;'>" +
            "<span class='btn btn-inverse fileinput-button'>" +
            "<i class='fa fa-plus'></i>" +
            "<span>Ajouter</span>" +
            "<input type='file' id='iptUploadFilePopUp' name='files[]' accept='application/pdf' onchange='getFileDataPopUp(this);'></span>" +
            "<button type='button' class='btn btn-inverse start' style='display: none;' id='btnSubmitUploadFilePopUp' onclick='return uploadFileClick()'><i class='fa fa-arrow-circle-o-up'></i><span>Télécharger</span></button>" +
            "<button type='reset' class='btn btn-inverse cancel'  style='display: none;' id='btnCancelUploadFilePopUp' onclick='return hideUploadPopUp()'><i class='fa fa-ban'></i><span>Annuler</span></button>" +
            "<button class='btn btn-default bootbox-close-button' style='display:none;' onclick='return false'><span>Annuler</span></button></div> <!-- The global progress information -->" +
            "<div class='col-md-12' style='text-align: center; margin-bottom: 20px;'>" +
            "<div>File Name : <span id='uploadFileNamePopUp'></span></div><br/>" +
            "</div></div></form>" +
            "</div></div></div>";

        bootbox.dialog({
            title: title,
            message: content
        }).find('.modal-content').css({
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
            'color': 'white'
        });

    } catch (e) {
    }
    return false;
}

function uploadFileClick() {
    ///create a new FormData object
    var formData = new FormData(); //var formData = new FormData($('form')[0]);
    ///get the file and append it to the FormData object
    formData.append('file', $('#iptUploadFilePopUp')[0].files[0]);
    var cinId = getUrlVars()['cinId'];
    var url = "../../Services/UploadFilesGeneral.ashx?type=3&cinId=" + encodeURIComponent(cinId);
    if (cinId) {
        ///AJAX request
        $.ajax(
        {
            ///server script to process data
            url: url, //web service
            type: 'POST',
            complete: function () {
                //on complete event     
            },
            progress: function (evt) {
                //progress event    
            },
            ///Ajax events
            beforeSend: function (e) {
                //before event  
            },
            success: function (e) {
                //success event
                $('.bootbox-close-button').click();
                var src = "../Common/PageForPDF.aspx?type=3&cinId=" + encodeURIComponent(cinId);
                $('#iframepdf').attr('height', '1000');
                $('#iframepdf').attr('src', src);
                $('#btn_delete_cod_file').show();
                if ($('#a_collapse').attr('class') === "expand") {
                    $('#a_collapse').click();
                }
            },
            error: function (e) {
                //errorHandler
            },
            ///Form data
            data: formData,
            ///Options to tell JQuery not to process data or worry about content-type
            cache: false,
            contentType: false,
            processData: false
        });
        ///end AJAX request
    }
}

function delete_cin_file_click() {
    var title = "ATTENTION";
    var content = "<div class='box'><div class='box-body' style='height: 100px;'>" +
        "<div class='form-horizontal'>" +
        "<div class='col-md-12'>" +
        "<div class='form-group'>" +
        "<div class='col-sm-12' style='text-align:center;font-size: 18pt;'>Veuillez confirmer la suppression ! " +
        "<br/>La suppression de fichier est irrécupérable, veuillez confirmer !!!</div></div></div></div></div></div>"
        + "<div class='modal-footer center'>" +
        "<button type='button' class='btn btn-default' onclick='closeDialog()'>Annuler</button>" +
        "<button type='button' class='btn btn-inverse' onclick='return deleteCinFile();'>SUPPRIMER</button></div>";
    bootbox.dialog({
        title: title,
        message: content
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
        'color': 'white'
    });
    return false;
}

function deleteCinFile() {
    var cinId = getUrlVars()['cinId'];
    var url = window.webservicePath + "/DeleteClientInvoiceFile";
    $.ajax({
        type: "POST",
        url: url,
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        data: "{cinId:'" + cinId + "'}",
        success: function (data) {
            $('#iframepdf').attr('height', '0');
            if ($('#a_collapse').attr('class') !== "expand") {
                $('#a_collapse').click();
            }
            $('#btn_delete_cod_file').hide();
        },
        error: function (data) {
            var test = '';
        }
    });
}

function goToDeliveryFormList(pageId) {
    var codId = getUrlVars()['codId'];
    var page = pageId === 1 ? "../DeliveryForm/DeliveryFormList.aspx" : "../DeliveryForm/DeliveryForm.aspx";
    page += '?codId=' + codId;
    window.location = page;
}

function VerifyAvoir(sender) {
    var isavoir = $(sender).is(':checked');
    if (isavoir) {
        var title = "ATTENTION";
        var content = "<div class='box'><div class='box-body' style='height: 120px;'>" +
            "<div class='form-horizontal'>" +
            "<div class='col-md-12'>" +
            "<div class='form-group'>" +
            "<div class='col-sm-12' style='text-align:center;font-size: 18pt;'>Veuillez confirmer ! " +
            "<br/>Vous avez choisi l'AVOIR, une fois l'avoir est créé, ce champs n'est plus modifié.<br/> veuillez confirmer votre choix ! </div></div></div></div></div></div>"
            + "<div class='modal-footer center'>" +
            "<button type='button' class='btn btn-default' onclick='cancelAvoirSelected()' >RESTER FACTURE</button>" +
            "<button type='button' class='btn btn-inverse' onclick='restAvoir()'>CONFIRMER</button></div>";
        bootbox.dialog({
            title: title,
            message: content
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
            'color': 'white'
        });
    } else {
        cancelAvoirSelected();
    }
    return false;
}

function cancelAvoirSelected() {
    $('#CinAccount').prop('checked', false);
    $('.invoicelist').hide();
    activeAllField();
    closeDialog();
}

function restAvoir() {
    getClientInvoiceForAvoir();
    $('.invoicelist').show();
    try {
        closeDialog();
    } catch (e) {

    }
}

var cinListForAvoir = [];
function getClientInvoiceForAvoir() {
    var url = window.webservicePath + "/GetCinForAvoir";
    $.ajax({
        type: "POST",
        url: url,
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        success: function (data) {
            var jsdata = data.d;
            var data2Treat = jQuery.parseJSON(jsdata);
            if (data2Treat !== '-1') {
                cinListForAvoir = [];
                cinListForAvoir = data2Treat;
                $('#ClientInvoiceList').empty();
                $.each(data2Treat, function (name, value) {
                    var content = value.CinCode + " || € " + value.CinAmount.toLocaleString();
                    $('#ClientInvoiceList').append($("<option></option>").attr("data-value", value.FId).text(content));
                });
                disableAllFieldForAvoir();
                $('#ClientInvoiceList').change();
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

function cin4AvoirChange(sender) {
    var cinFId = $('#ClientInvoiceList :selected').attr('data-value');
    var cin = searchFieldValueInArray(cinListForAvoir, 'FId', cinFId);
    if (!jQuery.isEmptyObject(cin)) {
        $('#Client').empty();
        var companyname = cin.ClientCompanyName + (IsNullOrEmpty(cin.CliAbbr) ? "" : ("-" + cin.CliAbbr));
        $('#Client').append($("<option></option>").attr("data-value", cin.CliFId).text(companyname));
        $('#PrjName').empty();
        $('#PrjName').append($("<option></option>").attr("data-value", cin.PrjFId).text(cin.PrjName));
        $('#CplName').empty();
        $('#CplName').append($("<option></option>").attr("data-value", cin.CplFId).text(cin.CplName));
        $('#CplCode').val(cin.CplCode);
        $('#CodName').empty();
        $('#CodName').append($("<option></option>").attr("data-value", cin.CodFId).text(cin.CodName));
        $('#CodCode').val(cin.CodCode);
        $('#PcoId').val(cin.PcoId);
        $('#PmoId').val(cin.PmoId);
        $('#VatId').val(cin.VatId);

        // get invoice address and delivery address
        js_getCcoByClient(cin.CliFId, cin.CcoIdInvoicing, cin.CcoIdDelivery);
    } else {
        var budgetId = '#Client';
        $(budgetId).empty();
        $(budgetId).append($("<option></option>").attr("value", '0').text('Sélectionner un Client'));
        $.each(allClient, function (name, value) {
        var companyname = value.CompanyName + (IsNullOrEmpty(value.CliAbbr) ? "" : ("-" + value.CliAbbr));
            $(budgetId).append($("<option></option>")
                        .attr("value", value.FId)
                        .text(companyname));
        });
    }
    //alert(selectedCin);
}

function disableAllFieldForAvoir() {
    if ($('#ClientInvoiceList').val() !== '0') {
        $('#Client').attr('disabled', '');
    } else {
        $('#Client').prop("disabled", false);
    }
    $('#PrjName').attr('disabled', '');
    $('#CplName').attr('disabled', '');
    $('#CodName').attr('disabled', '');

    $('#Client').empty();
    $('#PrjName').empty();
    $('#CplName').empty();
    $('#CplCode').val('');
    $('#CodName').empty();
    $('#CodCode').val('');
}

function activeAllField() {
    $('#Client').prop('disabled', false);
    $('#PrjName').prop('disabled', false);
    $('#CplName').prop('disabled', false);
    $('#CodName').prop('disabled', false);
    js_getClient('Client');
}

var allProjectForThisClient = [];
function getClientProjects(cliId, dfvalue) {
    var url = window.webservicePath + "/GetClientProjects";
    var params = "{cliId : '" + cliId + "'}";
    $.ajax({
        type: "POST",
        url: url,
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        data: params,
        success: function (data) {
            var jsdata = data.d;
            var data2Treat = jQuery.parseJSON(jsdata);
            $('#PrjName').empty();
            if (data2Treat !== '-1') {
                allProjectForThisClient = [];
                allProjectForThisClient = data2Treat;
                $.each(data2Treat, function (name, value) {
                    if (dfvalue && dfvalue === value.FId) {
                        $('#PrjName').append($("<option>" + value.PrjName + "</option>").attr("value", value.FId).attr("data-value", value.FId).attr("code", value.PrjCode).attr("selected", true));
                    } else {
                        $('#PrjName').append($("<option>" + value.PrjName + "</option>").attr("value", value.FId).attr("data-value", value.FId).attr("code", value.PrjCode));
                    }
                });
                $('#PrjName').change();
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

var allcpsForThisPrj = [];
function getCostPlanByPrjId(prjId, dfvalue) {
    var url = window.webservicePath + "/GetCostPlansByProjectId";
    var params = "{prjId : '" + prjId + "'}";
    $.ajax({
        type: "POST",
        url: url,
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        data: params,
        success: function (data) {
            var jsdata = data.d;
            var data2Treat = jQuery.parseJSON(jsdata);
            $('#CplName').empty();
            if (data2Treat !== '-1') {
                allcpsForThisPrj = [];
                allcpsForThisPrj = data2Treat;
                $.each(data2Treat, function (name, value) {
                    if (dfvalue && dfvalue === value.FId) {
                        $('#CplName').append($("<option>" + value.CplName + "</option>").attr("value", value.FId).attr("data-value", value.FId).attr("code", value.CplCode).attr("selected", true));
                    } else {
                        $('#CplName').append($("<option>" + value.CplName + "</option>").attr("value", value.FId).attr("data-value", value.FId).attr("code", value.CplCode));
                    }
                });
                $('#CplName').change();
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

function projectChange(sender) {
    var prjId = $('#PrjName :selected').attr('data-value');
    var selectedPrj = searchFieldValueInArray(allProjectForThisClient, 'FId', prjId);
    getCostPlanByPrjId(prjId);
    if (!jQuery.isEmptyObject(selectedPrj)) {
        setVatById(selectedPrj.VatId);
        setPcoById(selectedPrj.PcoId);
        setPcoById(selectedPrj.PmoId);
    }
}

function costplanChange(sender) {
    var cplId = $('#CplName :selected').attr('data-value');
    var code = $('#CplName :selected').attr('code');
    $('#CplCode').val(code);
    //alert(prjId);
    getClientOrderByCplId(cplId);
}

var allCodForThisCpl = [];
function getClientOrderByCplId(cplId, dfvalue) {
    var url = window.webservicePath + "/GetClientOrderByCplId";
    var params = "{cplId : '" + cplId + "'}";
    $.ajax({
        type: "POST",
        url: url,
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        data: params,
        success: function (data) {
            var jsdata = data.d;
            var data2Treat = jQuery.parseJSON(jsdata);
            $('#CodName').empty();
            if (data2Treat !== '-1') {
                allCodForThisCpl = [];
                allCodForThisCpl = data2Treat;
                $.each(data2Treat, function (name, value) {
                    if (dfvalue && dfvalue === value.FId) {
                        $('#CodName').append($("<option>" + value.CodName + "</option>").attr("value", value.FId).attr("data-value", value.FId).attr("code", value.CodCode).attr("selected", true));
                    } else {
                        $('#CodName').append($("<option>" + value.CodName + "</option>").attr("value", value.FId).attr("data-value", value.FId).attr("code", value.CodCode));
                    }
                });
                $('#CodName').change();
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

function clientorderChange(sender) {
    var code = $('#CodName :selected').attr('code');
    $('#CodCode').val(code);

    var codId = $('#CodName :selected').attr('data-value');
    var selectedCod = searchFieldValueInArray(allCodForThisCpl, 'FId', codId);
    if (!jQuery.isEmptyObject(selectedCod)) {
        setVatById(selectedCod.VatId);
        setPcoById(selectedCod.PcoId);
        setPcoById(selectedCod.PmoId);

        js_set_invoice_contact(selectedCod.CcoIdInvoicing);
        js_set_delivery_contact(selectedCod.CcoIdDelivery);
    }
}

function setVatById(id) {
    $('#VatId').val(id);
}

function setPcoById(id) {
    $('#PcoId').val(id);
}

function setPcoById(id) {
    $('#PmoId').val(id);

}

function CreateUpdateClientInvoice(sender) {
    $(sender).prop('disabled', true);
    ShowPleaseWait();
    var checkOK = true;
    var isAvoir = $('#CinAccount').is(':checked');
    //var cliId = $('#Client :selected').val();
    var cliId = seltectedClientId;
    var oneCin = {};
    oneCin.CinAccount = isAvoir;
    oneCin.CinIsInvoice = !isAvoir;
    oneCin.FId = getUrlVars()['cinId'];
    var typewithoutCin = false;
    if (isAvoir) {
        //oneCin.CinAvFId = $('#ClientInvoiceList :selected').attr('data-value');
        oneCin.CinAvFId = cinFIdseleced;
        //console.log(oneCin.CinAvFId);
        if ((oneCin.CinAvFId === '0' || (typeof oneCin.CinAvFId === "undefined")) && cliId === 0) {
            checkOK = false;
        }
        else if ((oneCin.CinAvFId === '0' || (typeof oneCin.CinAvFId === "undefined")) && cliId !== 0) {
            typewithoutCin = true;
        }
        if (!oneCin.CinAvFId && !typewithoutCin) {
            checkOK = false;
        }
    }
    var cliFId = selectedCliFId;// $('#Client :selected').attr('data-value');
    oneCin.CliFId = cliFId;
    oneCin.CliId = cliId;
    if (!cliId && !typewithoutCin) {
        checkOK = false;
    }

    var prjFId = $('#PrjName :selected').attr('data-value');
    oneCin.PrjFId = prjFId;
    if (!typewithoutCin && !prjFId) {
        checkOK = false;
    } else {
        if (typeof prjFId === "undefined") {
            oneCin.PrjFId = 0;
        }
    }

    var cplFId = $('#CplName :selected').attr('data-value');
    oneCin.CplFId = cplFId;
    if (typeof cplFId === "undefined") {
        oneCin.CplFId = 0;
    }

    var codFId = $('#CodName :selected').attr('data-value');
    oneCin.CodFId = codFId;
    if (typeof codFId === "undefined") {
        oneCin.CodFId = 0;
    }
    if (!checkOK) {
        HidePleaseWait();
        $(sender).prop('disabled', false);
    } else {
        oneCin.CinName = $('#CinName').val();
        oneCin.PcoId = $('#PcoId').val();
        oneCin.PmoId = $('#PmoId').val();
        oneCin.VatId = $('#VatId').val();
        oneCin.CurId = $('#CurId').val();
        oneCin._CinDInvoice = $('#_CinDInvoice').val();
        oneCin._CinDTerm = $('#_CinDTerm').val();
        oneCin._CinDEncaissement = $('#_CinDEncaissement').val();
        oneCin._CinDInvoice = $('#_CinDInvoice').val();
        oneCin.CinHeaderText = $('#CinHeaderText').val();
        oneCin.CinFooterText = $('#CinFooterText').val();
        oneCin.CinClientComment = $('#CinClientComment').val();
        oneCin.CinInterComment = $('#CinInterComment').val();
        // cco invoicing
        oneCin.CcoIdInvoicing = $('#Inv_CcoAdresseTitle  option:selected').val();
        oneCin.Inv_CcoFirstname = $('#Inv_CcoFirstname').val();
        oneCin.Inv_CcoLastname = $('#Inv_CcoLastname').val();
        oneCin.Inv_CcoRef = $('#Inv_CcoRef').val();
        oneCin.Inv_CcoAddress1 = $('#Inv_CcoAddress1').val();
        oneCin.Inv_CcoAddress2 = $('#Inv_CcoAddress2').val();
        oneCin.Inv_CcoPostcode = $('#Inv_CcoPostcode').val();
        oneCin.Inv_CcoCity = $('#Inv_ip_CcoCity').val();
        oneCin.Inv_CcoCountry = $('#Inv_CcoCountry').val();
        oneCin.Inv_CcoTel1 = $('#Inv_CcoTel1').val();
        oneCin.Inv_CcoFax = $('#Inv_CcoFax').val();
        oneCin.Inv_CcoCellphone = $('#Inv_CcoCellphone').val();
        oneCin.Inv_CcoEmail = $('#Inv_CcoEmail').val();
        // cco delivery
        oneCin.CcoIdDelivery = $('#Dlv_CcoAdresseTitle  option:selected').val();
        oneCin.Dlv_CcoFirstname = $('#Dlv_CcoFirstname').val();
        oneCin.Dlv_CcoLastname = $('#Dlv_CcoLastname').val();
        oneCin.Dlv_CcoRef = $('#Dlv_CcoRef').val();
        oneCin.Dlv_CcoAddress1 = $('#Dlv_CcoAddress1').val();
        oneCin.Dlv_CcoAddress2 = $('#Dlv_CcoAddress2').val();
        oneCin.Dlv_CcoPostcode = $('#Dlv_CcoPostcode').val();
        oneCin.Dlv_CcoCity = $('#Dlv_ip_CcoCity').val();
        oneCin.Dlv_CcoCountry = $('#Dlv_CcoCountry').val();
        oneCin.Dlv_CcoTel1 = $('#Dlv_CcoTel1').val();
        oneCin.Dlv_CcoFax = $('#Dlv_CcoFax').val();
        oneCin.Dlv_CcoCellphone = $('#Dlv_CcoCellphone').val();
        oneCin.Dlv_CcoEmail = $('#Dlv_CcoEmail').val();
        oneCin.CinIsFullPaid = $('#CinIsFullPaid').is(':checked');
        oneCin.CinDCreation = getCreationDate($('#_dCreationString').val());

        oneCin.UsrCom1 = $('#UsrCom1 option:selected').val() * 1;
        oneCin.UsrCom2 = $('#UsrCom2 option:selected').val() * 1;
        oneCin.UsrCom3 = $('#UsrCom3 option:selected').val() * 1;

        var CinBank = $('#CinBank option:selected').val() * 1;
        oneCin.CinBank = CinBank;

        //return false;
        var jsondata = JSON.stringify({ oneCin: oneCin });
        $.ajax({
            url: 'ClientInvoiceA.aspx/CreateUpdateClientInvoice',
            type: 'POST',
            contentType: 'application/json; charset=utf-8',
            data: jsondata,
            dataType: 'json',
            success: function (data) {
                var cinId = data.d;
                if (cinId !== "") {
                    var url = 'ClientInvoiceA.aspx';
                    var newUrl = url + '?cinId=' + cinId + '&mode=view';
                    document.location.href = newUrl;
                } else {
                    alert('Erreur');
                     location.reload();
                }
            },
            error: function (data) {
            }
        });
    }

    return false;
}


function PayTheInvoice(sender, amount) {
    var cpyId = $(sender).attr('cpyId');
    var startBox = "<div class='box'><div class='box-body'>";
    var endBox = "</div></div>";
    var comment = '';
    var paymentcode = '';
    var cpr = searchFieldValueInArray(CinPaymentList, 'FId', cpyId);
    var hasvalue = false;
    if (!jQuery.isEmptyObject(cpr)) {
        comment = cpr.CpyComment;
        paymentcode = cpr.CpyPaymentCode;
        hasvalue = true;
    }
    var onelineContent =
        // start box
        "<div class='form-group' id='div_one_line'>" +
        "<div class='row'>" +
        "<div class='col-md-12'>" +
        "<div class='box-body'>" +
        "<div class='form-horizontal'>" +
        "<div class='form-group'><label class='col-sm-12' style='text-align:center'>Veuillez complèter les information de paiement de client</label></div>" +
        "<div class='form-group'>" +
        "<label class='col-sm-4 control-label'>Montant</label>" +
        "<div class='col-sm-8'><input type='number' id='CpyAmount' class='form-control' value=" + amount + " /></div>" +
        "</div>" +
        "<div class='form-group'>" +
        "<label class='col-sm-4 control-label'>Code de paiement (pour recherche)</label>" +
        "<div class='col-sm-8'><input type='text' id='CpyPaymentCode' class='form-control' value='" + (IsNullOrEmpty(paymentcode) ? "" : paymentcode) + "' /></div>" +
        "</div>" +
        // new line
        "<div class='form-group'>" +
        "<label class='col-sm-4 control-label'>Commentaire</label>" +
        "<div class='col-sm-8'><textarea row='3' id='CpyComment' class='form-control' ></textarea></div>" +
        "</div>" +
        "<div class='form-group'>" +
        "<div class='col-sm-12'></div>" +
        "<form enctype='multipart/form-data'>" +
        "<div class='col-md-12'>" +
        // this div is for album photo
        "<div class='row' style='margin-bottom: 20px;'><div class='col-md-12' id='div_album_photo' style='text-align:center;'>" +
        "</div>" +
        // cancel and save buttons
        "</div>" +
        "</div>" +
        // this content contains upload photo
        "<div class='row' id='div_upload_photo'><div class='col-md-12' style='text-align: center;'>" +
        "<span class='btn btn-inverse fileinput-button'>" +
        "<i class='fa fa-plus'></i>" +
        "<span>Fichier de paiement</span>" +
        "<input type='file' id='iptUploadFilePopUp' name='files[]' accept='application/pdf' onchange='getFileDataPopUp(this);'></span>" +
        "<button type='reset' class='btn btn-inverse cancel'  style='display: none;' id='btnCancelUploadFilePopUp' onclick='return hideUploadPopUp()'><i class='fa fa-ban'></i><span>Annuler</span></button>" +
        "<button class='btn btn-inverse bootbox-close-button' style='display:none;' onclick='return false'><span>Annuler</span></button></div> <!-- The global progress information -->" +
        "<div class='col-md-12' style='text-align: center; margin-bottom: 20px;'>" +
        "<div>File Name : <span id='uploadFileNamePopUp'></span></div><br/>" +
        "</div></div></form>" +
        "</div>" +

        // close box
        "</div></div></div></div></div>";

    var btnAddUpdate = "<button class='btn btn-inverse' id='btn_add_update_discount' name='btn_add_update_discount' cpyId='" + cpyId + "' onclick='return SaveCinPayment(this)'><span>Sauvegarder</span></button>";
    var btnClose = "<button class='btn btn-default bootbox-close-button' id='btn_close_cin_payment' onclick='return false'><span>Annuler</span></button>";

    var btns = "<div class='modal-body center'>" + btnClose + btnAddUpdate + "</div>";
    var onecontent = startBox + onelineContent + btns + endBox;

    var title = 'PAIEMENT DE CLIENT';
    bootbox.dialog({
        title: title,
        message: onecontent
    }).find('.modal-dialog').css({
        'width': '80%'
    }).find('.modal-content').css({
        'margin-top': function () {
            var w = $(window).height();
            var b = $(".modal-dialog").height();
            // should not be (w-h)/2
            var h = (w - b) * 0.15;
            return h + "px";
        }
    }).find('.modal-header').css({
        'background': 'url(../../img/menu_005_bg.jpg) repeat-x',
        'text-align': 'center',
        'color': '#C0C0C0'
    });
    if (hasvalue) {
        $('#CpyComment').text(comment);
    }
    return false;
}


function SaveCinPayment(sender) {
    var checkAmount = $('#CpyAmount').val().replace(' ', '').replace(',', '.') * 1;
    var comment = $('#CpyComment').val().trim();
    var paymentcode = $('#CpyPaymentCode').val();
    var cpyId = $(sender).attr('cpyId');
    if ($.isNumeric(checkAmount)) {
        var cinId = getUrlVars()['cinId'];
        if (cinId) {
            ShowPleaseWait();
            var url = window.webservicePath + "/CreateUpdateCinPayment";
            //var datastr = "{cinId:'" + cinId + "',cpyId:'" + cpyId + "',cpyAmount:" + checkAmount + "}";
            var jsondata = JSON.stringify({ cinId: cinId, cpyId: cpyId, cpyAmount: checkAmount, comment: comment, paymentcode: paymentcode });
            $.ajax({
                type: "POST",
                url: url,
                contentType: "application/json; charset=utf-8",
                data: jsondata,
                dataType: "json",
                success: function (data) {
                    var jsdata = data.d;
                    if (jsdata !== -1) {
                        HidePleaseWait();
                        uploadPaymentFileClick(jsdata);
                    } else {
                        HidePleaseWait();
                        // authentication error
                        AuthencationError();
                    }
                },
                error: function (data) {
                    HidePleaseWait();
                    var test = '';
                }
            });
        }
    } else {
        $('#CpyAmount').addClass('error_border');
        $('#CpyAmount').focus();
    }
    return false;
}


function uploadPaymentFileClick(cpyId) {
    ///create a new FormData object
    var formData = new FormData(); //var formData = new FormData($('form')[0]);
    ///get the file and append it to the FormData object
    if ($('#iptUploadFilePopUp')[0].files[0]) {
        formData.append('file', $('#iptUploadFilePopUp')[0].files[0]);
        var cinId = getUrlVars()['cinId'];
        var url = "../../Services/UploadFilesGeneral.ashx?type=4&cinId=" + encodeURIComponent(cinId) + "&cpyId=" + cpyId;
        if (cinId) {
            ///AJAX request
            $.ajax(
            {
                ///server script to process data
                url: url, //web service
                type: 'POST',
                complete: function () {
                    //on complete event     
                },
                progress: function (evt) {
                    //progress event    
                },
                ///Ajax events
                beforeSend: function (e) {
                    //before event  
                },
                success: function (e) {
                    //success event
                    $('#btn_close_cin_payment').click();
                    loadCinPayementInfo();
                },
                error: function (e) {
                    //errorHandler
                    $('#btn_close_cin_payment').click();
                    loadCinPayementInfo();
                },
                ///Form data
                data: formData,
                ///Options to tell JQuery not to process data or worry about content-type
                cache: false,
                contentType: false,
                processData: false
            });
            ///end AJAX request
        }
    } else {
        $('#btn_close_cin_payment').click();
        loadCinPayementInfo();
    }
}


var CinPaymentList = [];
function loadCinPayementInfo() {
    var cinId = getUrlVars()['cinId'];
    if (cinId) {
        var url = window.webservicePath + "/GetCinPaymentInfo";
        var datastr = "{cinId:'" + cinId + "'}";
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
                    var cinInfo = data2Treat;
                    try {
                        $('#CinAmount').text(cinInfo.CinTotal2Pay.toLocaleString() + " " + cinInfo.CurrencySymbol);
                        $('#CinTotalAmountHt').text(cinInfo.TotalAmountHt.toLocaleString() + " " + cinInfo.CurrencySymbol);
                        $('#CinLeftToPayer').text(cinInfo.CinRest2Pay.toLocaleString() + " " + cinInfo.CurrencySymbol);
                        $('#CinPaid').text(cinInfo.CinPaid.toLocaleString() + " " + cinInfo.CurrencySymbol);
                        $('#cin_payment_records').empty();
                        var title = "<div class='form-group'>" +
                            "<label class='col-sm-4 control-label' style='text-align:center'>Fichier</label>" +
                            "<label class='col-sm-2 control-label' style='text-align:center'>Date</label>" +
                            "<label class='col-sm-3 control-label' style='text-align:center'>Montant</label>" +
                            "<label class='col-sm-2 control-label' style='text-align:center'>Commentaire</label>" +
                            "</div>";
                        $('#cin_payment_records').append(title);
                        CinPaymentList = [];
                        CinPaymentList = cinInfo.CinPaymentList;
                        $.each(cinInfo.CinPaymentList, function (name, value) {
                            var btnview = value.HasFile ? "<button  class='btn btn-inverse' cpyid=" + value.FId + " onclick='return viewCpyFile(this)'><i class='fa fa-search-plus'></i></button>" : "";
                            var btnUpdate = "<button class='btn btn-inverse' cpyid=" + value.FId + " onclick='return PayTheInvoice(this," + value.CpyAmount + ")'><i class='fa fa-pencil-square-o'></i></button>";
                            var btnDelete = value.HasFile ? "<button  class='btn btn-inverse' cpyid=" + value.FId + " onclick='return deleteFile(this)'><i class='fa fa-times'></i></button>" : "";
                            var oneContent = "<div class='form-group' style='text-align:center'>" +
                                "<div class='col-sm-5'>" + btnview + btnUpdate + btnDelete +
                                "</div>" +
                                "<label class='col-sm-3 control-label'>" + getDateString(value.CpyDCreation) + "</label>" +
                                "<label class='col-sm-4 control-label' style='color:green;'>" + value.CpyAmount.toLocaleString() + " €</label>" +
                                "<label class='col-sm-4 control-label'>" + value.CpyComment + " €</label>" +
                                "</div>";
                            $('#cin_payment_records').append(oneContent);
                        });
                    } catch (e) {

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
}

function viewCpyFile(sender) {
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

    var title = 'FICHIER DE PAIEMENT CLIENT';
    bootbox.dialog({
        title: title,
        message: onecontent
    }).find('.modal-dialog').css({
        'width': '70%'
    }).find('.modal-content').css({
        'margin-top': function () {
            var w = $(window).height();
            var b = $(".modal-dialog").height();
            // should not be (w-h)/2
            var h = (w - b) * 0.05;
            return h + "px";
        }
    }).find('.modal-header').css({
        'background-color': '#a696ce',
        'text-align': 'center',
        'color': 'white'
    });
    var cinId = getUrlVars()['cinId'];
    var cpyId = $(sender).attr('cpyId');
    var src = "../Common/PageForPDF.aspx?type=4&cinId=" + encodeURIComponent(cinId) + "&cpyId=" + encodeURIComponent(cpyId);
    $('#iframepdfForPayment').attr('src', src);
    return false;
}


function deleteFile(sender) {
    var cpyId = $(sender).attr('cpyId');
    var msg = "Veuillez confirmer la suppresion de FICHIER de paiement de client !";
    var title = "CONFIRMATION";
    var content = "<div class='box'><div class='box-body' style='height: 100px;'>" +
        "<div class='form-horizontal'>" +
        "<div class='col-md-12'>" +
        "<div class='form-group'>" +
        "<div class='col-sm-12' style='text-align:center;font-size: 18pt;'>" + msg + "</div></div></div></div></div></div>"
        + "<div class='modal-footer center'>" +
        "<button type='button' class='btn btn-default' onclick='closeDialog()'>Annuler</button>" +
        "<button type='button' class='btn btn-inverse' cpyId='" + cpyId + "' onclick='deleteFileClick(this)'>SUPPRIMER</button>" +
        "</div>";
    bootbox.dialog({
        title: title,
        message: content
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
    return false;
}

function deleteFileClick(sender) {
    var cpyId = $(sender).attr('cpyId');
    var cinId = getUrlVars()['cinId'];
    if (cinId) {
        var url = window.webservicePath + "/DeleteCinPaymentFile";
        var datastr = "{cinId:'" + cinId + "',cpyId:'" + cpyId + "'}";
        $.ajax({
            type: "POST",
            url: url,
            contentType: "application/json; charset=utf-8",
            data: datastr,
            dataType: "json",
            success: function (data) {
                loadCinPayementInfo();
            },
            error: function (data) {
                loadCinPayementInfo();
            }
        });
    }
    closeDialog();
    return false;
}


function CalculateDateTerm(sender) {
    var date_Invoice = $('#_CinDInvoice');
    var date_Term = $('#_CinDTerm');

    var dateinvoicevalue = date_Invoice.val();
    if (dateinvoicevalue) {
        //var pco_id_selected = $('#PcoId option:selected')[0].value;
        //var pco_id_start = pco_id_selected + "#";
        var pco_values = $('#PcoId option:selected').attr('data-value');
        //        $('.ddl_pcoHidden option').each(function () {
        //            var text = $(this)[0].text;
        //            if (text.indexOf(pco_id_start) == 0) {
        //                pco_values = text;
        //            }
        //        });

        if (pco_values) {
            var pcoValues = pco_values.split('#');
            var pcoId = pcoValues[0];
            var numDays = pcoValues[1] * 1;
            var addDays = pcoValues[2] * 1;
            var endMonth = pcoValues[3] * 1;

            var invoiceRightForm = formatDate(new Date(getDateFromFormat(dateinvoicevalue, 'dd/MM/yyyy')), 'MM/dd/yyyy');
            var invoiceDateTime = new Date(Date.parse(invoiceRightForm));

            var termDateTimeDg = invoiceDateTime.setDate(invoiceDateTime.getDate() + numDays);
            var termDateTime = new Date(termDateTimeDg);

            if (endMonth === 1) {
                termDateTime = new Date(termDateTime.getFullYear(), termDateTime.getMonth() + 1, 0);
            }
            termDateTimeDg = termDateTime.setDate(termDateTime.getDate() + addDays);
            termDateTime = new Date(termDateTimeDg);
            var termDate = termDateTime.toLocaleDateString('fr-FR'); //.format("dd/MM/yyyy");
            date_Term.val(termDate);
        }
    }
}


function InvoiceCinClick() {
    MsgPopUpWithResponseChoice('ATTENTION', 'Veuillez FACTURER cette facture? Si la facture est facturée, toutes les informations ne sont plus modifiables !', 'FACTURER', 'InvoiceCin()', 'Annuler');
}

function InvoiceCin() {
    var cinId = getUrlVars()['cinId'];
    if (cinId) {
        ShowPleaseWait();
        var url = window.webservicePath + "/SetCinInvoiced";
        var datastr = "{cinId:'" + cinId + "'}";
        $.ajax({
            type: "POST",
            url: url,
            contentType: "application/json; charset=utf-8",
            data: datastr,
            dataType: "json",
            success: function (data) {
                RefreshPage();
            },
            error: function (data) {
                HidePleaseWait();
                alert(data.responseText);
            }
        });
    }
}

function InvoiceAllPaidClick() {
    MsgPopUpWithResponseChoice('ATTENTION', 'Assurez la facture est entierement payée par client!', 'CONFIRMER', 'InvoiceAllPaid()', 'Annuler');
}

function InvoiceAllPaid() {
    var cinId = getUrlVars()['cinId'];
    if (cinId) {
        ShowPleaseWait();
        var url = window.webservicePath + "/CinFullPaid";
        var datastr = "{cinId:'" + cinId + "'}";
        $.ajax({
            type: "POST",
            url: url,
            contentType: "application/json; charset=utf-8",
            data: datastr,
            dataType: "json",
            success: function (data) {
                RefreshPage();
            },
            error: function (data) {
                HidePleaseWait();
                alert(data.responseText);
            }
        });

    }
}

var allCommercials = [];
function getCommercials() {
    var url = window.webservicePath + "/GetSubCommercial";
    $.ajax({
        type: "POST",
        url: url,
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        success: function (data) {
            var jsdata = data.d;
            var data2Treat = jQuery.parseJSON(jsdata);
            if (data2Treat !== '-1') {
                allCommercials = [];
                allCommercials = data2Treat;
                if (_isCreate) {
                    // mode create
                    // set commercial
                    $('#UsrCom1').empty();
                    $('#UsrCom2').empty();
                    $('#UsrCom3').empty();
                    $('#UsrCom1').append($("<option>Sélectionner un commercial</option>").attr("value", "0"));
                    $('#UsrCom2').append($("<option>Sélectionner un commercial</option>").attr("value", "0"));
                    $('#UsrCom3').append($("<option>Sélectionner un commercial</option>").attr("value", "0"));
                    $.each(allCommercials, function (order, oneCom) {
                        //$('#UsrCom1').append($("<option>" + oneCom.FullName + "</option>").attr("value", oneCom.Id));
                        if (_isCreate) {
                            if (connectedUser.Id === oneCom.Id) {
                                $('#UsrCom1').append($("<option>" + oneCom.FullName + "</option>").attr("value", oneCom.Id).attr("selected", true));
                            } else {
                                $('#UsrCom1').append($("<option>" + oneCom.FullName + "</option>").attr("value", oneCom.Id));
                            }
                        } else {
                            $('#UsrCom1').append($("<option>" + oneCom.FullName + "</option>").attr("value", oneCom.Id));
                        }
                        $('#UsrCom2').append($("<option>" + oneCom.FullName + "</option>").attr("value", oneCom.Id));
                        $('#UsrCom3').append($("<option>" + oneCom.FullName + "</option>").attr("value", oneCom.Id));
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


function getCurrentSoc() {
    var url = window.webservicePath + "/GetCurrentSociety";
    $.ajax({
        type: "POST",
        url: url,
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        success: function (data) {
            var jsdata = data.d;
            var data2Treat = jQuery.parseJSON(jsdata);
            //console.log(data2Treat);
            if (data2Treat.DpUpd) {
                $('.f_updatedate').show();
            } else {
                $('.f_updatedate').hide();
            }
        },
        error: function (data) {
            HidePleaseWait();
            var test = '';
        }
    });
}


function setAutoCompleteCin() {
    var url = window.webservicePath + "/GetCinForAvoirWithCinCode";
    $("#CinList").autocomplete({
        source: function (request, response) {
            //console.log('auto');
            $.ajax({
                url: url,
                data: "{ 'cincode': '" + request.term + "', 'cliFId':''}",
                dataType: "json",
                type: "POST",
                contentType: "application/json; charset=utf-8",
                success: function(data) {
                    cinFIdseleced = '0';
                    var jsdata = data.d;
                    var data2Treat = jQuery.parseJSON(jsdata);
                    cinListForAvoir = [];
                    cinListForAvoir = data2Treat;
                    if (data2Treat.length > 0) {
                        response($.map(data2Treat, function(item) {
                            return {
                                label: item.CinCode + " || € " + item.CinAmount.toLocaleString(),
                                val: item.FId,
                            }
                        }));
                    } else {
                    }
                },
                error: function(response) {
                    //alert(response.responseText);
                },
                failure: function(response) {
                    alert(response.responseText);
                }
            });
        },
        select: function(e, i) {
            cin4AvoirChangeNew(i.item.val);
        },
        minLength: 2
    });
}


var cinFIdseleced = '0';
function cin4AvoirChangeNew(cinFId) {
    //var cinFId = $('#CinList').attr('data-value');
    cinFIdseleced = cinFId;
    //console.log('auto *** : ' + cinFIdseleced);
    var cin = searchFieldValueInArray(cinListForAvoir, 'FId', cinFId);
    if (!jQuery.isEmptyObject(cin)) {
        //$('#Client').empty();
        //console.log('Cli FId : ' + cin.CliFId);
        seltectedClientId = cin.CliId;
        selectedCliFId = cin.CliFId;
        $('#ClientList').prop("disabled", true);
        var companyname = cin.ClientCompanyName + (IsNullOrEmpty(cin.CliAbbr) ? "" : ("-" + cin.CliAbbr));
        //$('#Client').append($("<option></option>").attr("data-value", cin.CliFId).text(companyname));
        //console.log(cin);
        $('#ClientList').val(companyname);
        $('#PrjName').empty();
        $('#PrjName').append($("<option></option>").attr("data-value", cin.PrjFId).text(cin.PrjName));
        $('#CplName').empty();
        $('#CplName').append($("<option></option>").attr("data-value", cin.CplFId).text(cin.CplName));
        $('#CplCode').val(cin.CplCode);
        $('#CodName').empty();
        $('#CodName').append($("<option></option>").attr("data-value", cin.CodFId).text(cin.CodName));
        $('#CodCode').val(cin.CodCode);
        $('#PcoId').val(cin.PcoId);
        $('#PmoId').val(cin.PmoId);
        $('#VatId').val(cin.VatId);

        // get invoice address and delivery address
        js_getCcoByClient(cin.CliFId, cin.CcoIdInvoicing, cin.CcoIdDelivery);
    } else {
        //var budgetId = '#Client';
        //$(budgetId).empty();
        //$(budgetId).append($("<option></option>").attr("value", '0').text('Sélectionner un Client'));
        //$.each(allClient, function (name, value) {
        //var companyname = value.CompanyName + (IsNullOrEmpty(value.CliAbbr) ? "" : ("-" + value.CliAbbr));
        //    $(budgetId).append($("<option></option>")
        //                .attr("value", value.FId)
        //                .text(companyname));
        //});

    }
    //alert(selectedCin);
}


function CinListKeyUp(sender) {
    //console.log('keyup');
    cinFIdseleced = '0'
    //console.log('keyup : ' + cinFIdseleced);
    var curlength = $(sender).val().length;
    //console.log(curlength);
    if (curlength == 0) {
        $('#ClientList').prop("disabled", false);
        $('#ClientList').val('');
        $('#PrjName').empty();
        $('#CodName').empty();
        $('#CodCode').val('');
        $('#CplName').empty();
        $('#CplCode').val('');
    }var curlength = $(sender).val().length;
    //console.log(curlength);
    if (curlength == 0) {
        $('#ClientList').prop("disabled", false);
        $('#ClientList').val('');
        $('#PrjName').empty();
        $('#CodName').empty();
        $('#CodCode').val('');
        $('#CplName').empty();
        $('#CplCode').val('');
    }
}


var allBankInfo = [];
function loadAllBankInfo() {
    var url = window.webservicePath + "/GetBankAccountInfo";
    var datastr = "{type:5,fId:'0'}";
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
                allBankInfo = [];
                allBankInfo = data2Treat;
                console.log(allBankInfo);
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
