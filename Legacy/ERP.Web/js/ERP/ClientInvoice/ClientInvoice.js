document.onkeydown = function (e) {
    var keyCode = e.keyCode || e.which || e.charCode;
    var ctrlKey = e.ctrlKey || e.metaKey;
    // ctrl + Y
    if (ctrlKey && keyCode === 89) {
        //alert('save');
        if (_isView) {
            var cliId = currentCin.CliFId;
            var height = $(window).height();
            var width = $(window).width();
            width = width * 0.8;
            width = width.toFixed(0);
            var clientname = $('#ClientList').val();
            var url = '../Client/ClientPrice.aspx?cliId=' + cliId + '&cliname=' + clientname;
            window.open(url, 'popupWindow', 'height=' + height + ', width=' + width + ', top=0, left=0, toolbar=no, menubar=no, scrollbars=no, resizable=no,location=no, status=no');
        }
        e.preventDefault();
    }
}

$(document).ready(GetSocCinLgs);

var dtdGetAllTva = $.Deferred();
var dtdGetPco = $.Deferred();
var dtdGetPmo = $.Deferred();
var dtdGetCommercial = $.Deferred();
var dtdGetCurrency = $.Deferred();
var dtdGetSociety = $.Deferred();
function init() {
    ShowPleaseWait();
    setAutoCompleteClient();
    loadAllBankInfo();
    $.when(_getCurrenty(dtdGetCurrency)).done(function () {
        $.when(_getAllTva(dtdGetAllTva)).done(function () {
            $.when(_getPco(dtdGetPco)).done(function () {
                $.when(_getPmo(dtdGetPmo)).done(function () {
                    $.when(_getCurrentSoc(dtdGetSociety)).done(function () {
                        $.when(_getCom(dtdGetCommercial)).done(function () {
                            $.when(_getAllTte(dtdGetTte)).done(function () {
                                lastLance();
                                if (!jQuery.isEmptyObject(connectedUser) && connectedUser.LoginMode === 1) {
                                    $('#div_for_keyprj').show();
                                }
                                else {
                                    $('#div_for_keyprj').hide();
                                }
                            });
                        });
                    });
                });
            });
        });
        HidePleaseWait();
        SetLanguageBar();
    });

    //    var cinId = getUrlVars()['cinId'];
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
    js_getHeaderFooterText();
}


function lastLance() {
    // 避免和LoadClientInvoice 里面的重复
    //iniClientInvoiceLine();
    var cinId = getUrlVars()['cinId'];
    if (cinId) {
        if (_isView || _isModify) {
            //            if (!jQuery.isEmptyObject(connectedUser) && connectedUser.LoginMode === 1 && connectedUser.IsAdmin && _isModify) {
            //                //js_getClient('Client', 'LoadClientInvoice');
            //                LoadClientInvoice();
            //            } else {
            //                LoadClientInvoice();
            //            }
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
}


var CinLgs = false;
function GetSocCinLgs() {
    var url = window.webservicePath + "/GetSocCinLgs";
    AjaxCall('POST', url, null, function (data) {
        HidePleaseWait();
        CinLgs = data;
        if (CinLgs) {
            $('#ip_select_all_cin').show();
        } else {
            $('#ip_select_all_cin').hide();
        }
        init();
    });
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

var allTtes = [];
var dtdGetTte = $.Deferred();
var _getAllTte = function (dtdGetTte) {
    var url = window.webservicePath + "/GetAllTte";
    var budgetId = '#TradeTermes';
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
                    allTtes = data2Treat;
                    $(budgetId).empty();
                    $.each(data2Treat, function (name, value) {
                        $(budgetId)
                            .append($("<option></option>")
                                .attr("value", value.Key)
                                .attr("data-value", value.ValuePCO)
                                .text(value.Value));
                    });
                }
                dtdGetTte.resolve();
            }
            else {
                // authentication error
                AuthencationError();
                dtdGetTte.resolve();
            }
        },
        error: function (data) {
            var test = '';
            dtdGetTte.resolve();
        }
    });
    return dtdGetTte.promise();
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
var allCurrency;
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
                allCurrency = data2Treat;
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


var society = [];
var bankinfors = [];
var _getCurrentSoc = function (dtdGetSociety) {
    society = [];
    var url = window.webservicePath + "/GetCurrentSociety";
    $.ajax({
        type: "POST",
        url: url,
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        success: function (data) {
            var jsdata = data.d;
            var data2Treat = jQuery.parseJSON(jsdata);
            society = data2Treat;
            //console.log(data2Treat);
            if (data2Treat.DpUpd) {
                //console.log(1);
                $('.f_updatedate').show();
            } else {
                console.log(2);
                $('.f_updatedate').hide();
            }


            // 20250216 这段代码作废，因为用了BAC INFO
            bankinfors = [];
            // for bank info
            var bankinfo1 = [];
            bankinfo1.RibAbre = society.RibAbre;
            bankinfo1.RibName = society.RibName;
            bankinfo1.RibAddress = society.RibAddress;
            bankinfo1.RibCodeIban = society.RibCodeIban;
            bankinfo1.RibCodeBic = society.RibCodeBic;
            bankinfo1.RibBankCode = society.RibBankCode;
            bankinfo1.RibAgenceCode = society.RibAgenceCode;
            bankinfo1.RibAccountNumber = society.RibAccountNumber;
            bankinfo1.RibKey = society.RibKey;
            bankinfo1.RibDomiciliationAgency = society.RibDomiciliationAgency;
            bankinfo1.CinBank = 1;

            var bankinfo2 = [];
            bankinfo2.RibAbre = society.RibAbre2;
            bankinfo2.RibName = society.RibName2;
            bankinfo2.RibAddress = society.RibAddress2;
            bankinfo2.RibCodeIban = society.RibCodeIban2;
            bankinfo2.RibCodeBic = society.RibCodeBic2;
            bankinfo2.RibBankCode = society.RibBankCode2;
            bankinfo2.RibAgenceCode = society.RibAgenceCode2;
            bankinfo2.RibAccountNumber = society.RibAccountNumber2;
            bankinfo2.RibKey = society.RibKey2;
            bankinfo2.RibDomiciliationAgency = society.RibDomiciliationAgency2;
            bankinfo2.CinBank = 2;

            bankinfors.push(bankinfo1);
            if (!IsNullOrEmpty(bankinfo2.RibAbre)) {
                bankinfors.push(bankinfo2);
            }
            dtdGetSociety.resolve();

        },
        error: function (data) {
            HidePleaseWait();
            var test = '';
            dtdGetSociety.resolve();
        }
    });
    return dtdGetSociety.promise();
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
                    if (!currentCin.CinIsInvoiced) {
                        $('#btn_cin_invoiced').show();
                        $('#btn_send_invoice').show();
                    } else {
                        $('#btn_cin_invoiced').hide();
                        $('#btn_send_invoice').hide();
                        $('#btn_modify_top').hide();
                        $('#btn_modify_bottom').hide();
                        $('#btn_add_line_top').hide();
                        $('#btn_add_line_bottom').hide();
                        $('#btn_add_drv_top').hide();
                        $('#btn_add_drv_bottom').hide();
                        $('#lb_cin_status').text('DÉJÀ FACTURÉ');
                    }
                    if (_isModify) {
                        if (!jQuery.isEmptyObject(connectedUser) && connectedUser.LoginMode === 1 && connectedUser.IsAdmin) {
                            //$('#Client').removeAttr('disabled');
                            $('#ClientList').removeAttr('disabled');
                        } else {
                            $('#ClientList').attr('disabled', '');
                            //$('#Client').attr('disabled', '');
                        }
                        $('#CinAccount').attr('disabled', '');
                        $('#CplName').attr('disabled', '');
                        $('#CodName').attr('disabled', '');
                    }
                    if (!currentCin.CinIsFullPaid) {
                        $('#btn_cin_allpaid').show();
                    } else {
                        $('#btn_cin_allpaid').hide();
                    }

                    // 20210905
                    if (currentCin.CanCreateDfo) {
                        $('#btn_create_dfo').show();
                        LoadCcoDelivery();
                    } else {
                        $('#btn_create_dfo').hide();
                    }
                    js_LoadClientById();
                    setClickableLabel();
                    //getClientCostPlanInProgress(oneCod.CliId, oneCod.CplFId);
                    js_getCcoByClient(oneCin.CliFId, oneCin.CcoIdInvoicing, oneCin.CcoIdDelivery);
                    loadCinPayementInfo();

                    //////////////////////////////////////
                    // for client invoice line
                    iniClientInvoiceLine();
                    initMode();
                    //getCurrentSoc();
                    loadclientdelegatorlist(currentCin.CliFId, currentCin.DelegatorId);

                    // bank info


                    /// for sod
                    if (connectedUser.IsAdmin) {
                        LoadSupplier();
                        // 20210118 commented out CSO
                        //                        if (!IsNullOrEmpty(currentCin.SodId)) {
                        //                            if (currentCin.SodId !== 0) {
                        //                                //console.log(currentCin.SodCode);
                        //                                $('#btn_view_sod').text(currentCin.SodCode);
                        //                                $("#btn_view_sod").attr("onclick", "ViewSod()");
                        //                                $('#btn_view_sod').show();
                        //                            } else {
                        //                                $('#btn_view_sod').text("Créer la commande fournisseur");
                        //                                $("#btn_view_sod").attr("onclick", "CreateSodClick()");
                        //                                $('#btn_view_sod').show();
                        //                            }
                        //                        } else {
                        //                            $('#btn_view_sod').text("Créer la commander fournisseur");
                        //                            $("#btn_view_sod").attr("onclick", "CreateSodClick()");
                        //                            $('#btn_view_sod').show();
                        //                        }

                        var viewsodbtns = $("button[id^='btn_view_sod_']");
                        if (viewsodbtns.length == 0) {
                            if (currentCin.CsoList !== null && currentCin.CsoList.length > 0) {
                                //$('#div_btns')

                                var buttons = "</br>";
                                $.each(currentCin.CsoList, function (name, cso) {
                                    buttons += "<button type='button'  class='btn btn-inverse' style='color:#d96666' id='btn_view_sod_" + cso.Key + "' sodid='" + cso.Value2 + "' onclick='return ViewSod(this)'>" + cso.Value + (IsNullOrEmpty(cso.Value3) ? "" : ("-" + cso.Value3)) + "</button> ";
                                });
                                $('#div_btns').append(buttons);
                            } else {
                                $('#btn_view_sod').text("Créer la commande fournisseur");
                                $("#btn_view_sod").attr("onclick", "CreateSodClick()");
                                $('#btn_view_sod').show();
                            }
                        }
                    }
                    // 20230923 显示名称
                    var doctitle = currentCin.CinCode + '-' + currentCin.ClientCompanyName;
                    document.title = doctitle;
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

    var mode = getParameterByName('mode');
    $.each(cin, function (name, value) {

        var setThisvalue = true;
        if (name === 'ClientCompanyName') {
            //$('#Client').append($("<option></option>").attr("data-value", cin.CliFId).text(cin.ClientCompanyName));

            //$('#Client').attr('disabled', '');
            if (!jQuery.isEmptyObject(connectedUser) && connectedUser.LoginMode === 1 && connectedUser.IsAdmin && mode === 'modify') {
                //$('#Client').val(cin.CliId);
                seltectedClientId = cin.CliId;
                //$('#Client').removeAttr('disabled');
                var companyname = cin.ClientCompanyName + (IsNullOrEmpty(cin.CliAbbr) ? "" : ("-" + cin.CliAbbr));
                $('#ClientList').val(companyname);
                $('#ClientList').removeAttr('disabled');
            } else {
                //$('#Client').append($("<option></option>").attr("data-value", cin.CliFId).text(cin.ClientCompanyName));
                seltectedClientId = cin.CliId;
                var companyname = cin.ClientCompanyName + (IsNullOrEmpty(cin.CliAbbr) ? "" : ("-" + cin.CliAbbr));
                $('#ClientList').val(companyname);
                $('#ClientList').attr('disabled', '');
            }
        } else if (name === 'PrjName') {
            $('#PrjName').append($("<option></option>").attr("data-value", cin.PrjFId).text(value));
            $('#PrjName').attr('disabled', '');
            $('#PrjNameUp').val(value);
            if (mode == 'modify') {
                if (connectedUser.LoginMode !== 1) {
                    $('#div_prjname').show();
                    $('#div_prjnameUp').hide();
                } else {
                    $('#div_prjname').hide();
                    $('#div_prjnameUp').show();
                }
            } else {
                $('#div_prjname').show();
                $('#div_prjnameUp').hide();
            }
        } else if (name === 'CodName') {
            $('#CodName').append($("<option></option>").attr("data-value", cin.CodFId).text(value));
            $('#CodName').attr('disabled', '');

            $('#CodNameUp').val(value);
            if (mode == 'modify') {
                if (connectedUser.LoginMode !== 1) {
                    $('#div_codname').show();
                    $('#div_codnameUp').hide();
                } else {
                    $('#div_codname').hide();
                    $('#div_codnameUp').show();
                }
            } else {
                $('#div_codname').show();
                $('#div_codnameUp').hide();
            }
        } else if (name === 'CplName') {
            $('#CplName').append($("<option></option>").attr("data-value", cin.CplFId).text(value));
            $('#CplName').attr('disabled', '');

            $('#CplNameUp').val(value);

            if (mode == 'modify') {
                if (connectedUser.LoginMode !== 1) {
                    $('#div_cplname').show();
                    $('#div_cplnameUp').hide();
                } else {
                    $('#div_cplname').hide();
                    $('#div_cplnameUp').show();
                }
            } else {
                $('#div_cplname').show();
                $('#div_cplnameUp').hide();
            }
        } else {
            var newname = name;
            if (name === 'Inv_CcoCity') {
                newname = 'Inv_ip_CcoCity';
            } else if (name === 'ClientCompanyName') {
                newname = 'Client';
                setThisvalue = false;
            } else if (name === 'Dlv_CcoCity') {
                newname = 'Dlv_ip_CcoCity';
            } else if (name === 'CinDCreation') {
                newname = '_dCreationString';
                setFieldValue(newname, value, true, null, true);
            } else if (name === 'CinDUpdate') {
                newname = '_dUpdateString';
                setFieldValue(newname, value, true, null, true);
            } else if (name === 'CinDInvoice') {
                newname = '_CinDInvoice';
                setFieldValue(newname, value, true, null, true);
            } else if (name === 'CinDTerm') {
                newname = '_CinDTerm';
                setFieldValue(newname, value, true, null, true);
            } else if (name === 'CinDEncaissement') {
                newname = '_CinDEncaissement';
                setFieldValue(newname, value, true, null, true);
            } else if (name === 'CliId') {
                selectedClient.Id = value;
            } else if (name === 'CinDiscountAmount') {
                newname = '_CinDiscountAmount';
                setFieldValue(newname, value, true);
            } else if (name === 'TteId') {
                newname = 'TradeTermes';
                setFieldValue(newname, value, true);
            } else {
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
                        $('#ClientInvoiceList').empty();
                        var content = value.CinCode + " || € " + value.CinAmount.toLocaleString();
                        $('#ClientInvoiceList').append($("<option></option>").attr("data-value", value.FId).text(content));
                        $('#ClientInvoiceList').attr('disabled', '');
                        $('#ClientInvoiceList').css('color', 'red');
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

    // 20220527 ClientCompanyName + ClientAbbreviation
    setFieldValue("ClientList", IsNullOrEmpty(cin.CliAbbr) ? cin.ClientCompanyName : (cin.ClientCompanyName + "-" + cin.CliAbbr));
}

var allclient = [];

function js_getClient(elementId, fun) {
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
                            .attr("value", value.Id)
                            .attr("data-value", value.FId)
                            .text(value.CompanyName));
                });
                $(budgetId).change();
                //setClientByPrjId();

                if (!IsNullOrEmpty(fun)) {
                    // function we want to run
                    var fnstring = fun;
                    // find object
                    var fn = window[fnstring];
                    // is object a function?
                    if (typeof fn === "function") fn();
                }
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

// 20210309
function setDefautCommercial() {
    if (!jQuery.isEmptyObject(selectedClient)) {

        $('#UsrCom1').val(selectedClient.UsrIdCom1).change();
        $('#UsrCom2').val(selectedClient.UsrIdCom2).change();
        $('#UsrCom3').val(selectedClient.UsrIdCom3).change();
        //        $('#UsrCom1').append($("<option>" + oneCom.FullName + "</option>").attr("value", oneCom.Id));
        //        $('#UsrCom2').append($("<option>" + oneCom.FullName + "</option>").attr("value", oneCom.Id));
        //        $('#UsrCom3').append($("<option>" + oneCom.FullName + "</option>").attr("value", oneCom.Id));
        loadclientdelegatorlist(selectedClient.FId, 0);
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
        //        $('#Dlv_CcoAdresseTitle').empty();
        //        $('#Dlv_CcoAdresseTitle').append($("<option></option>")
        //            .attr("value", 0)
        //            .text('Nouvelle adresse de la livraison'));
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
            if (_isCreate) { $('#CplName').append($("<option>Nouveau Devis</option>").attr("value", "0")); }
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
        aClientOrder.ClientCompanyName = $('#ClientList').val();
        aClientOrder.CplFId = $('#CplName  option:selected').val();
        aClientOrder.VatId = $('#VatId').val();
        aClientOrder.CodName = $('#CodName').val();
        aClientOrder.CliId = seltectedClientId;// selectedClient.Id !== undefined ? (selectedClient.Id * 1) : 0;
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
        aClientOrder.CodKeyProject = $('#CinKeyProject').is(':checked');
        // cco delivery
        //        aClientOrder.CcoIdDelivery = $('#Dlv_CcoAdresseTitle  option:selected').val();
        //        aClientOrder.Dlv_CcoFirstname = $('#Dlv_CcoFirstname').val();
        //        aClientOrder.Dlv_CcoLastname = $('#Dlv_CcoLastname').val();
        //        aClientOrder.Dlv_CcoRef = $('#Dlv_CcoRef').val();
        //        aClientOrder.Dlv_CcoAddress1 = $('#Dlv_CcoAddress1').val();
        //        aClientOrder.Dlv_CcoAddress2 = $('#Dlv_CcoAddress2').val();
        //        aClientOrder.Dlv_CcoPostcode = $('#Dlv_CcoPostcode').val();
        //        aClientOrder.Dlv_CcoCity = $('#Dlv_ip_CcoCity').val();
        //        aClientOrder.Dlv_CcoCountry = $('#Dlv_CcoCountry').val();
        //        aClientOrder.Dlv_CcoTel1 = $('#Dlv_CcoTel1').val();
        //        aClientOrder.Dlv_CcoFax = $('#Dlv_CcoFax').val();
        //        aClientOrder.Dlv_CcoCellphone = $('#Dlv_CcoCellphone').val();
        //        aClientOrder.Dlv_CcoEmail = $('#Dlv_CcoEmail').val();


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
        //        $("#lb_dfo").addClass("animated_menu");
        //        $("#lb_dfo").prop('title', 'Cliquer pour consulter la bon de Livraison');
        //        $('#lb_dfo').css('cursor', 'pointer');

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
        $('#Client').append($("<option></option>").attr("data-value", cin.CliFId).text(cin.ClientCompanyName));
        $('#PrjName').empty();
        $('#PrjName').append($("<option></option>").attr("data-value", cin.PrjFId).text(cin.PrjName));
        $('#CplName').empty();
        $('#CplName').append($("<option></option>").attr("data-value", cin.CplFId).text(cin.CplName));
        $('#CplCode').val(cin.CplCode);
        $('#CodName').append($("<option></option>").attr("data-value", cin.CodFId).text(cin.CodName));
        $('#CodCode').val(cin.CodCode);
        $('#PcoId').val(cin.PcoId);
        $('#PmoId').val(cin.PmoId);
        $('#VatId').val(cin.VatId);

        // get invoice address and delivery address
        js_getCcoByClient(cin.CliFId, cin.CcoIdInvoicing, cin.CcoIdDelivery);

    }
    //alert(selectedCin);
}

function disableAllFieldForAvoir() {
    $('#ClientList').attr('disabled', '');
    //$('#Client').attr('disabled', '');
    $('#PrjName').attr('disabled', '');
    $('#CplName').attr('disabled', '');
    $('#CodName').attr('disabled', '');

    //$('#Client').empty();
    $('#ClientList').empty();
    $('#PrjName').empty();
    $('#CplName').empty();
    $('#CplCode').val('');
    $('#CodName').empty();
    $('#CodCode').val('');
}

function activeAllField() {
    //$('#Client').prop('disabled', false);
    $('#ClientList').prop('disabled', false);
    $('#PrjName').prop('disabled', false);
    $('#CplName').prop('disabled', false);
    $('#CodName').prop('disabled', false);
    //js_getClient('Client');
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
                $('#PrjName').append($("<option>Sélectionner une affaire</option>").attr("value", "0").attr("data-value", "0").attr("code", "0"));
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
        //js_set_delivery_contact(selectedCod.CcoIdDelivery);
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
    var checkOK = seltectedClientId !== 0;
    var isAvoir = $('#CinAccount').is(':checked');
    var oneCin = {};
    oneCin.CinAccount = isAvoir;
    oneCin.CinIsInvoice = !isAvoir;
    oneCin.FId = getUrlVars()['cinId'];
    if (isAvoir) {
        oneCin.CinAvFId = $('#ClientInvoiceList :selected').attr('data-value');
        if (!oneCin.CinAvFId) {
            checkOK = false;
        }
    }
    //    var cliFId = $('#Client :selected').attr('data-value');
    //    oneCin.CliFId = cliFId;
    oneCin.CliId = seltectedClientId;
    //    if (!cliFId) {
    //        checkOK = false;
    //    }
    var prjFId = $('#PrjName :selected').attr('data-value');
    oneCin.PrjFId = prjFId;
    //    if (!prjFId) {
    //        checkOK = false;
    //    }
    var cplFId = $('#CplName :selected').attr('data-value');
    oneCin.CplFId = cplFId;
    var codFId = $('#CodName :selected').attr('data-value');
    oneCin.CodFId = codFId;

    if (!checkOK) {
        HidePleaseWait();
        $(sender).prop('disabled', false);
        alert('Veuillez sélectionner un client');
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
        oneCin.CinKeyProject = $('#CinKeyProject').is(':checked');

        oneCin.PrjName = $('#PrjNameUp').val();
        oneCin.CodName = $('#CodNameUp').val();
        oneCin.CplName = $('#CplNameUp').val();
        oneCin.DelegatorId = $('#DelegatorId option:selected').val() * 1;
        console.log(oneCin.DelegatorId);

        var CinBank = $('#CinBank option:selected').val() * 1;
        //if (IsNullOrEmpty(CinBank)) {
        //    CinBank = 1;
        //} else {
        //    CinBank = parseInt(CinBank) * 1;
        //}
        oneCin.CinBank = CinBank;

        var TradeTermes = $('#TradeTermes option:selected').val();
        if (IsNullOrEmpty(TradeTermes)) {
            TradeTermes = 1;
        } else {
            TradeTermes = parseInt(TradeTermes) * 1;
        }
        oneCin.TteId = TradeTermes;

        // cco delivery
        //        oneCin.CcoIdDelivery = $('#Dlv_CcoAdresseTitle  option:selected').val();
        //        oneCin.Dlv_CcoFirstname = $('#Dlv_CcoFirstname').val();
        //        oneCin.Dlv_CcoLastname = $('#Dlv_CcoLastname').val();
        //        oneCin.Dlv_CcoRef = $('#Dlv_CcoRef').val();
        //        oneCin.Dlv_CcoAddress1 = $('#Dlv_CcoAddress1').val();
        //        oneCin.Dlv_CcoAddress2 = $('#Dlv_CcoAddress2').val();
        //        oneCin.Dlv_CcoPostcode = $('#Dlv_CcoPostcode').val();
        //        oneCin.Dlv_CcoCity = $('#Dlv_ip_CcoCity').val();
        //        oneCin.Dlv_CcoCountry = $('#Dlv_CcoCountry').val();
        //        oneCin.Dlv_CcoTel1 = $('#Dlv_CcoTel1').val();
        //        oneCin.Dlv_CcoFax = $('#Dlv_CcoFax').val();
        //        oneCin.Dlv_CcoCellphone = $('#Dlv_CcoCellphone').val();
        //        oneCin.Dlv_CcoEmail = $('#Dlv_CcoEmail').val();

        oneCin.CinIsFullPaid = $('#CinIsFullPaid').is(':checked');
        oneCin.CinDCreation = getCreationDate($('#_dCreationString').val());

        oneCin.UsrCom1 = $('#UsrCom1 option:selected').val() * 1;
        oneCin.UsrCom2 = $('#UsrCom2 option:selected').val() * 1;
        oneCin.UsrCom3 = $('#UsrCom3 option:selected').val() * 1;

        var jsondata = JSON.stringify({ oneCin: oneCin });
        $.ajax({
            url: 'ClientInvoice.aspx/CreateUpdateClientInvoice',
            type: 'POST',
            contentType: 'application/json; charset=utf-8',
            data: jsondata,
            dataType: 'json',
            success: function (data) {
                var cinId = data.d;
                var url = 'ClientInvoice.aspx';
                var newUrl = url + '?cinId=' + cinId + '&mode=view';
                document.location.href = newUrl;
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
            var jsondata = JSON.stringify({ cinId: cinId, cpyId: cpyId, cpyAmount: checkAmount, comment: comment, paymentcode: paymentcode });
            //var datastr = "{cinId:'" + cinId + "',cpyId:'" + cpyId + "',cpyAmount:" + checkAmount + "}";
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
                        $('#LbMargin').text(cinInfo.TotalMargin.toLocaleString() + " " + cinInfo.CurrencySymbol);
                        if (cinInfo.TotalMargin > 0) {
                            $('#LbMargin').css("color", "green");
                        } else {
                            $('#LbMargin').css("color", "red");
                        }

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
                                "<label class='col-sm-4 control-label' style='color:green;'>" + value.CpyAmount.toLocaleString() + " " + currentCin.CurrencySymbol + "</label>" +
                                "<label class='col-sm-4 control-label'>" + value.CpyComment + " " + currentCin.CurrencySymbol + "</label>" +
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
        'background': 'url(../../img/menu_005_bg.jpg) repeat-x',
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
    var msg = "Veuillez confirmer la suppresion de <span style='color:red'>FICHIER</span> de paiement de client !";
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

function ViewDfoList() {
    var codFId = currentCin.CodFId;
    var url = '../ClientOrder/ClientOrderDeliveryFormList.aspx?codId=' + codFId;
    window.location = url;
    return false;
}

function ViewSod(sender) {
    ShowPleaseWait();
    var sodfid = $(sender).attr('sodid');
    var url = '../SupplierOrder/SupplierOrder.aspx' + '?sodId=' + sodfid + '&mode=view';
    HidePleaseWait();
    var win = window.open(url, '_blank');
    win.focus();
}

function CreateSodClick() {
    var startBox = "<div class='box'><div class='box-body'>";
    var endBox = "</div></div>";
    var onelineContent =
        // start box
        "<div class='form-group' id='div_one_line'>" +
        "<div class='row'>" +
        "<div class='col-md-12'>" +
        "<div class='box-body'>" +
        "<div class='form-horizontal'>" +
        "<div class='form-group'><label class='col-sm-12' style='text-align:center'>Veuillez sélectionner un fournisseur 请选择一个供货商</label></div>" +
        // new line
        "<div class='form-group'>" +
        "<label class='col-sm-4 control-label fieldRequired'>Supplier 供货商</label>" +
        "<div class='col-sm-5'><select type='text' class='form-control' id='sodSupplier' name='sodSupplier' required='' onchange='sodSupplierChanged(this)' ></select></div>" +
        "<div class='col-sm-3'></div>" +
        "</div>" +
        // new line
        "<div class='form-group'>" +
        "<label class='col-sm-4 control-label'>Devise actuelle 当前货币</label>" +
        "<label class='col-sm-5 control-label' style='color: red'>" + searchFieldValueInArray(allCurrency, 'Key', currentCin.CurId).Value + "</label>" +
        "<div class='col-sm-3'></div>" +
        "</div>" +
        // new line
        "<div class='form-group'>" +
        "<label class='col-sm-4 control-label'>Devise de commande 采购货币</label>" +
        "<div class='col-sm-5'><select type='text' class='form-control' id='Sod_CurId' name='Sod_CurId' onchange='sodCurChanged(this)'></select></div>" +
        "<div class='col-sm-3'></div>" +
        "</div>" +

        // new line
        "<div class='form-group'>" +
        "<label class='col-sm-4 control-label' title='The commande fournisseur unit price will be calculated by multiplying the unit price by the coefficient 采购订单单价将由单价乘以该系数得出'>U.P Coefficient 单价系数</label>" +
        "<div class='col-sm-5'><input type='number' class='form-control' id='CoefSodCin' name='CoefSodCin' required='' value='0.9' step='0.1'/></div>" +
        "<div class='col-sm-3'></div>" +
        "</div>" +
        // new line
        "<div class='form-group'>" +
        "<label class='col-sm-4 control-label'>Sélectionner une commande client si besoin 如有需要选择已有订单</label>" +
        "<div class='col-sm-5'><select type='text' class='form-control' id='SupplierOrderList' name='SupplierOrderList' style='display:none'></select><input class='form-control' id='SodList' name='SodList' /></div>" +
        "<div class='col-sm-3'></div>" +
        "</div>" +
        // new line
        "<div class='form-group'>" +
        "<label class='col-sm-4 control-label'>Date de création de la facture (ça décide le code de facture) 选择创建日期，这将决定SO编号</label>" +
        "<div class='col-sm-5'>" +
        "<div class='input-group'>" +
        "<input type='text' class='form-control datepicker ' id='SodCinDCreate' name='SodCinDCreate'/><span class='input-group-addon'><i class='fa fa-calendar'></i></span>" +
        "</div>" +
        "</div>" +
        "<div class='col-sm-3'></div>" +
        "</div>" +
        // close box
        "</div></div></div></div></div>";

    var btnAddUpdate = "<button class='btn btn-inverse' id='btn_cin_create' name='btn_csod_create' onclick='return CreateSod(this)'><span>Créer 新建</span></button>";
    var btnClose = "<button class='btn btn-default bootbox-close-button' id='btn_close_sod_payment' onclick='return false'><span>Annuler 取消</span></button>";

    var btns = "<div class='modal-body center'>" + btnClose + btnAddUpdate + "</div>";
    var onecontent = startBox + onelineContent + btns + endBox;

    var title = 'Créer commande fournisseur 新建采购订单';
    bootbox.dialog({
        title: title,
        message: onecontent
    }).find('.modal-dialog').css({
        'width': '50%'
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
    $.each(allSupplier, function (name, value) {
        $('#sodSupplier').append($("<option></option>")
            .attr("data-value", value.FId)
            .text(value.CompanyName));
    });

    $.each($('.datepicker'), function (idx, value) {
        $(value).datepicker();
    });
    var today = getToday();
    $('#SodCinDCreate').val(today);


    $.each(allCurrency, function (name, value) {
        $('#Sod_CurId').append($("<option></option>")
            .attr("value", value.Key)
            .text(value.Value));

    });
    $('#Sod_CurId').val(3);
    $('#Sod_CurId').change();

    setAutoCompleteCin();
    return false;
}

function sodCurChanged(sender) {
    var selectedCur = searchFieldValueInArray(allCurrency, 'Key', $(sender).val() * 1);
    var cinCur = searchFieldValueInArray(allCurrency, 'Key', currentCin.CurId);
    var exrate = (cinCur.Value === 'USD' ? 1 : cinCur.DcValue) / (selectedCur.Value === 'USD' ? 1 : selectedCur.DcValue);
    exrate = exrate.toFixed(5);
    $('#CoefSodCin').val(exrate);
    //$('#lb_cin_total_with_coef').text(cinTotalTtc.toFixed(3) + " " + selectedCur.Value2);
}

function CreateSodByCiiClick() {
    var startBox = "<div class='box'><div class='box-body'>";
    var endBox = "</div></div>";
    var onelineContent =
        // start box
        "<div class='form-group' id='div_one_line'>" +
        "<div class='row'>" +
        "<div class='col-md-12'>" +
        "<div class='box-body'>" +
        "<div class='form-horizontal'>" +
        "<div class='form-group'><label class='col-sm-12' style='text-align:center'>Veuillez sélectionner un fournisseur 请选择一个供货商</label></div>" +
        // new line
        "<div class='form-group'>" +
        "<label class='col-sm-4 control-label fieldRequired'>Supplier 供货商</label>" +
        "<div class='col-sm-5'><select type='text' class='form-control' id='sodSupplier' name='sodSupplier' required='' onchange='sodSupplierChanged(this)' ></select></div>" +
        "<div class='col-sm-3'></div>" +
        "</div>" +
        // new line
        "<div class='form-group'>" +
        "<label class='col-sm-4 control-label' title='The commande fournisseur unit price will be calculated by multiplying the unit price by the coefficient 采购订单单价将由单价乘以该系数得出'>U.P Coefficient 单价系数</label>" +
        "<div class='col-sm-5'><input type='number' class='form-control' id='CoefSodCin' name='CoefSodCin' required='' step='0.01'/></div>" +
        "<div class='col-sm-3'></div>" +
        "</div>" +
        // new line
        "<div class='form-group'>" +
        "<label class='col-sm-4 control-label'>Sélectionner une commande client si besoin 如有需要选择已有订单</label>" +
        "<div class='col-sm-5'><select type='text' class='form-control' id='SupplierOrderList' name='SupplierOrderList' style='display:none'></select><input class='form-control' id='SodList' name='SodList' /></div>" +
        "<div class='col-sm-3'></div>" +
        "</div>" +
        // new line
        "<div class='form-group'>" +
        "<label class='col-sm-4 control-label'>Date de création de la facture (ça décide le code de facture) 选择创建日期，这将决定SO编号</label>" +
        "<div class='col-sm-5'>" +
        "<div class='input-group'>" +
        "<input type='text' class='form-control datepicker ' id='SodCinDCreate' name='SodCinDCreate' disabled /><span class='input-group-addon'><i class='fa fa-calendar'></i></span>" +
        "</div>" +
        "</div>" +
        "<div class='col-sm-3'></div>" +
        "</div>" +
        // close box
        "</div></div></div></div></div>";

    var btnAddUpdate = "<button class='btn btn-inverse' id='btn_cin_create' name='btn_csod_create' onclick='return CreateSodByCii(this)'><span>Créer 新建</span></button>";
    var btnClose = "<button class='btn btn-default bootbox-close-button' id='btn_close_sod_payment' onclick='return false'><span>Annuler 取消</span></button>";

    var btns = "<div class='modal-body center'>" + btnClose + btnAddUpdate + "</div>";
    var onecontent = startBox + onelineContent + btns + endBox;

    var title = 'Créer commande fournisseur 新建采购订单';
    bootbox.dialog({
        title: title,
        message: onecontent
    }).find('.modal-dialog').css({
        'width': '50%'
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
    $.each(allSupplier, function (name, value) {
        $('#sodSupplier').append($("<option></option>")
            .attr("data-value", value.FId)
            .text(value.CompanyName));
    });

    $.each($('.datepicker'), function (idx, value) {
        $(value).datepicker();
    });
    var today = getToday();
    $('#SodCinDCreate').val(today);

    setAutoCompleteCin();
    return false;
}


var selectedSupFId = '';
function sodSupplierChanged(sender) {
    selectedSupFId = $('#sodSupplier :selected').attr('data-value');
}

var sodFIdselected = '0';
var sodList = [];
function setAutoCompleteCin() {
    var url = window.webservicePath + "/GetSodForCinWithSodCode";
    //var cliFId = $('#cinClient :selected').attr('data-value');
    $("#SodList").autocomplete({
        source: function (request, response) {
            $.ajax({
                url: url,
                data: "{ 'sodCode': '" + request.term + "', 'supFId': '" + selectedSupFId + "'}",
                dataType: "json",
                type: "POST",
                contentType: "application/json; charset=utf-8",
                success: function (data) {
                    sodFIdselected = '0';
                    var jsdata = data.d;
                    var data2Treat = jQuery.parseJSON(jsdata);
                    sodList = [];
                    sodList = data2Treat;
                    if (data2Treat.length > 0) {
                        response($.map(data2Treat, function (item) {
                            return {
                                label: item.SodCode,
                                val: item.FId,
                            }
                        }));
                    } else {
                    }
                },
                error: function (response) {
                    //                    alert(response.responseText);
                    //                    console.log(response);
                },
                failure: function (response) {
                    alert(response.responseText);
                }
            });
        },
        select: function (e, i) {
            sodFIdselected = i.item.val;
        },
        minLength: 2
    });
}

var allSupplier = [];
function LoadSupplier() {
    var url = window.webservicePath + "/GetAllSuppliers";
    ShowPleaseWait();
    $.ajax({
        type: "POST",
        url: url,
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        success: function (data) {
            var jsdata = data.d;
            var data2Treat = jQuery.parseJSON(jsdata);
            if (data2Treat !== '-1') {
                allSupplier = [];
                allSupplier = data2Treat;
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


function CreateSod(sender) {
    $(sender).prop('disabled', true);
    var supId = $('#sodSupplier :selected').attr('data-value');
    if (typeof supId === "undefined") {
        $(sender).prop('disabled', false);
        alert('Veuillez sélectionner un fournisseur 请选择一个供货商');
    } else {
        ShowPleaseWait();
        var coef = $('#CoefSodCin').val().replace(',', '.').replace(' ', '') * 1;
        var sodFId = sodFIdselected;
        var sodInputvalue = $('#SodList').val();
        if (IsNullOrEmpty(sodInputvalue)) {
            sodFId = '';
        }
        var dCreate = $('#SodCinDCreate').val();
        var url = window.webservicePath + "/CreateSodFromCin";
        var cinId = getUrlVars()['cinId'];
        var curId = $('#Sod_CurId :selected').val() * 1;

        var datastr = "{'cinId':'" + cinId + "','supId':'" + supId + "','coef':" + coef + ", 'sodFId':'" + sodFId + "', 'dCreate':'" + dCreate + "','sodCode':'" + sodInputvalue + "','curId':" + curId + "}";
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
                    HidePleaseWait();
                    if (data2Treat !== '0') {
                        var sodId = data2Treat;
                        //var url = 'ClientInvoice.aspx';
                        var newUrl = '../SupplierOrder/SupplierOrder.aspx' + '?sodId=' + sodId + '&mode=view';
                        document.location.href = newUrl;
                    } else {
                        alert('Error !!! Please contact administrator');
                    }
                } else {
                    // authentication error
                    HidePleaseWait();
                    AuthencationError();
                }
            },
            error: function (data) {
                $(sender).prop('disabled', false);
                HidePleaseWait();
                var test = '';
            }
        });

    }
    return false;
}

function CreateSodByCii(sender) {
    $(sender).prop('disabled', true);
    var supId = $('#sodSupplier :selected').attr('data-value');
    if (typeof supId === "undefined") {
        $(sender).prop('disabled', false);
        alert('Veuillez sélectionner un fournisseur 请选择一个供货商');
    } else {
        ShowPleaseWait();
        var coef = $('#CoefSodCin').val().replace(',', '.').replace(' ', '') * 1;
        var sodFId = sodFIdselected;
        var sodInputvalue = $('#SodList').val();
        if (IsNullOrEmpty(sodInputvalue)) {
            sodFId = '';
        }
        var dCreate = $('#SodCinDCreate').val();
        var url = window.webservicePath + "/CreateSodFromCinCii";
        var cinId = getUrlVars()['cinId'];
        var item = Object();
        item.CinFId = cinId;
        item.SupFId = supId;
        item.SodFId = sodFId;
        item._DateStartProduction = dCreate;
        item.SodCode = sodInputvalue;
        item.TotalAmountHt = coef;
        var ciiList2Add = [];
        var allCiis = $("input[id^='ip_cii_withoutsol_']");
        allCiis.each(function () {
            if ($(this).prop('checked')) {
                var ciiid = $(this).attr('ciiid') * 1;
                var onekeyvalue = Object();
                onekeyvalue.Key = ciiid;
                ciiList2Add.push(onekeyvalue);
            }
        });
        item.CsoList = ciiList2Add;

        if (ciiList2Add.length > 0) {
            //var datastr = "{'cinId':'" + cinId + "','supId':'" + supId + "','coef':" + coef + ", 'sodFId':'" + sodFId + "', 'dCreate':'" + dCreate + "','sodCode':'" + sodInputvalue + "'}";
            var jsondata = JSON.stringify({ aSod: item });
            $.ajax({
                type: "POST",
                url: url,
                contentType: "application/json; charset=utf-8",
                data: jsondata,
                dataType: "json",
                success: function (data) {
                    var jsdata = data.d;
                    var data2Treat = jsdata;
                    if (data2Treat !== '-1') {
                        HidePleaseWait();
                        if (data2Treat !== '0') {
                            var sodId = data2Treat;
                            //var url = 'ClientInvoice.aspx';
                            var newUrl = '../SupplierOrder/SupplierOrder.aspx' + '?sodId=' + sodId + '&mode=view';
                            document.location.href = newUrl;
                        } else {
                            alert('Error !!! Please contact administrator');
                        }
                    } else {
                        // authentication error
                        HidePleaseWait();
                        AuthencationError();
                    }
                },
                error: function (data) {
                    $(sender).prop('disabled', false);
                    HidePleaseWait();
                    var test = '';
                }
            });
        }
    }
    return false;

}


function CreateDfoClick() {
    var cinId = getUrlVars()['cinId'];
    var jsondata = JSON.stringify({ cinId: cinId });
    var url = window.webservicePath + "/GetCiisByCinIdForDfo";
    AjaxCall('post', url, jsondata, function (data) {

        var title = 'Ajouter le(s) ligne(s) à livrer, si vous mettez 0, cette ligne ne va pas être ajoutée';
        var header = "<tr>" +
            "<td>Order</td>" +
            "<td>Produit</td>" +
            "<td>Référence</td>" +
            "<td>Quantité total</td>" +
            "<td>Quantité livrée</td>" +
            "<td>Quantité à livrer</td>" +
            "</tr>";
        var allcontent = "<div class='form-horizontal center' style='width: 100%; overflow-x: auto; height:300px;'>" +
            "<table cellpadding='0' cellspacing='0' border='0' class='table table-striped table-bordered table-hover' >" +
            "<thead>" + header + "</thead>" +
            "<tbody>";
        var content = "";

        $.each(data, function (name, value) {
            var oneline = "<tr>" +
                "<td>" + value.CiiLevel1 + "." + value.CiiLevel2 + "</td>" +
                "<td style='text-align:left;'>" + value.CiiPrdName + "</td>" +
                "<td style='text-align:left;'>" + value.CiiDescription + "</td>" +
                "<td style='width:8%'>" + value.CiiQuantity + "</td>" +
                "<td style='width:8%'>" + value.DflQuantity + "</td>" +
                "<td style='width:8%'><input class='form-control' type='text' value='" + (value.CiiQuantity - value.DflQuantity) + "' max='" + value.CiiQuantity + "' id='cii_dfo2add_" + value.CiiId + "' ciiId='" + value.CiiId + "'/></td>" +
                "</tr>";
            content += oneline;
        });
        allcontent += (content + "</tbody><tfoot>" + header + "</tfoot></table></div>");
        var contentDfo = "<div class='form-horizontal center' style='width: 100%; overflow-x: auto;'>" +
            "<div class='form-group'>" +
            "<label class='col-sm-2 control-label'>Ajouter dans un bon de livraison existant</label>" +
            "<div class='col-sm-2'><input class='form-control' type='checkbox' id='ip_add_in_exist_dfo' onclick='Add2ExistDfoClick(this)'/></div>" +
            "<div class='col-sm-2'>" +
            "<input class='form-control' type='text' id='ip_search_dfo' style='display:none;'/>" +
            "<select class='form-control' id='slt_dfo_cco' name='slt_dfo_cco'></select>" +
            "</div>" +
            "<label class='col-sm-2 control-label'>Date de création de la facture</label>" +
            "<label class='col-sm-1 control-label' style='color:#b94a48' >" + getDateString(currentCin.CinDCreation) + "</label>" +
            "<label class='col-sm-3 control-label' style='color:#468847' id='lb_selected_dfo'  dfoId='0'></label>" +
            "</div>" +
            "<div class='form-group' style='display:none' id='div_dfo_dates'>" +
            "<label class='col-sm-3 control-label'>Date de création (Si cette date est antérieure à aujourd'hui, le système la placera automatiquement au dernier jour du mois, si c'est ce mois-ci, le système la réglera automatiquement à aujourd'hui)</label>" +
            "<div class='col-sm-3'>" +
            "<input class='form-control datepicker' type='text' id='ip_dfo_create_date'/>" +
            "</div>" +
            "<label class='col-sm-3 control-label'>Date de livraison</label>" +
            "<div class='col-sm-3'>" +
            "<input class='form-control datepicker' type='text' id='ip_dfo_delivery_date'/>" +
            "</div>" +
            "</div>" +
            "</div>";
        allcontent += contentDfo;
        var btns = "";
        var btnAddUpdate = "<button class='btn btn-inverse' id='btn_add_the_cii_2_dfo' name='btn_add_the_cii_2_dfo' onclick='return AddCii2Dfo(this)'><span>Créer un nouveau bon de livraison</span></button>";
        var btnClose = "<button class='btn btn-default bootbox-close-button' id='close_addcii2dfo' onclick='return false'><span>Annuler</span></button>";
        btns += (btnClose + btnAddUpdate);
        PopUpFunc(title, allcontent, btns);
        setAutoCompleteDfo();
        $('#slt_dfo_cco').empty();
        $('#slt_dfo_cco').append($("<option></option>").attr("data-value", "0").attr("value", "0").text("Sélectionner un contact client"));
        $.each(ccoDeliveried, function (name, value) {
            $('#slt_dfo_cco')
                .append($("<option></option>")
                    .attr("data-value", value.FCcoId)
                    .attr("value", value.CcoId)
                    .text(value.CcoAdresseTitle + ' | ' + value.CcoFirstname + ' ' + value.CcoLastname)
                );
        });
        //var cindCreation = getDateString(currentCin.CinDCreation);
        $('#ip_dfo_create_date').val(getToday());
        $('#ip_dfo_delivery_date').val(getToday());
        $.each($('.datepicker'), function (idx, value) {
            $(value).datepicker();
        });
        if (connectedUser.LoginMode === 1 && connectedUser.IsAdmin) {
            $('#div_dfo_dates').show();
        }
    });
    return false;
}

function Add2ExistDfoClick(sender) {
    var add2Exist = $(sender).is(':checked');
    if (add2Exist) {
        $('#ip_search_dfo').show();
        $('#btn_add_the_cii_2_dfo').text('Ajouter dans le bon de livraison existé');
        $('#slt_dfo_cco').hide();
    } else {
        $('#ip_search_dfo').hide();
        $('#ip_search_dfo').val('');
        $('#lb_selected_dfo').text('');
        $('#lb_selected_dfo').attr('dfoId', '0');
        $('#btn_add_the_cii_2_dfo').text('Créer un nouveau bon de livraison');
        $('#slt_dfo_cco').show();
    }
}

function setAutoCompleteDfo() {
    var url = window.webservicePath + "/GetDeliverFormsByKeywords";
    var cinId = getUrlVars()['cinId'];
    $("#ip_search_dfo").autocomplete({
        source: function (request, response) {
            var jsondata = JSON.stringify({ cinId: cinId, keyword: request.term });
            $.ajax({
                url: url,
                data: jsondata, // "{ 'keyword': '" + request.term + "'}",
                dataType: "json",
                type: "POST",
                contentType: "application/json; charset=utf-8",
                success: function (data) {
                    var jsdata = data.d;
                    var data2Treat = jQuery.parseJSON(jsdata);
                    var subPrdId = '#ip_search_dfo';
                    $(subPrdId).empty();
                    response($.map(data2Treat, function (item) {
                        return {
                            label: item.DfoCode,
                            val: item.DfoId,
                            datavalue: item.DfoCode
                        }
                    }));
                },
                error: function (response) {
                    //alert(response.responseText);
                },
                failure: function (response) {
                    //alert(response.responseText);
                }
            });
        },
        select: function (e, i) {
            //selectPrdFId = i.item.val;
            $('#lb_selected_dfo').attr('dfoId', i.item.val);
            $('#lb_selected_dfo').text(i.item.datavalue + ' est sélectionné !');
            $('#btn_add_the_cii_2_dfo').text('Ajouter dans le bon de livraison sélectionné');
        },
        minLength: 3
    });
}

var ccoDeliveried = [];
function LoadCcoDelivery() {
    var cliId = currentCin.CliFId;
    var url = window.webservicePath + "/LoadContactClientsByCliId";
    var jsondata = JSON.stringify({ cliId: cliId });
    AjaxCall('post', url, jsondata, function (data) {
        ccoDeliveried = searchInArray(data, 'CcoIsDeliveryAdr', true);
    });
}


function AddCii2Dfo() {
    var allLine2Add = $("input[id^='cii_dfo2add_']");
    var newDfo = $('#ip_add_in_exist_dfo').is(':checked');
    var ccoId = $('#slt_dfo_cco option:selected').val() * 1;
    var selectedDfoId = $('#lb_selected_dfo').attr('dfoId') * 1;
    var allOk = false;
    var ciiLines = [];

    //    if (!newContainer && supId == 0) {
    //        alert('Veuillez sélectionner un tranporteur');
    //        return false;
    //    }

    if (newDfo && selectedDfoId === 0) {
        alert('Veuillez sélectionner un bon de livraison');
        return false;
    }

    $.each(allLine2Add, function (name, value) {
        var qty = $(value).val() * 1;
        if (qty > 0) {
            var oneCiiLine = {};
            oneCiiLine.Key = currentCin.CinId;
            oneCiiLine.Key2 = $(value).attr('ciiId') * 1;
            oneCiiLine.Key3 = $(value).val() * 1;
            ciiLines.push(oneCiiLine);
            allOk = true;
        }
    });

    if (allOk) {
        // 建立物流
        var cinId = getUrlVars()['cinId'];
        var url = window.webservicePath + "/CreateDfoFromCin";
        var createDate = $('#ip_dfo_create_date').val();
        var deliveryDate = $('#ip_dfo_delivery_date').val();
        //var cindCreation = getDateString(currentCin.CinDCreation);
        createDate = IsDateFr(createDate) ? Getyyymmdd(createDate) : Getyyymmdd(getToday());
        deliveryDate = IsDateFr(deliveryDate) ? Getyyymmdd(deliveryDate) : Getyyymmdd(getToday());
        var jsondata = JSON.stringify({ cinId: cinId, dfoIdExisted: selectedDfoId, ciiLines: ciiLines, createDate: createDate, deliveryDate: deliveryDate, ccoId: ccoId });
        ShowPleaseWait();
        AjaxCall('post', url, jsondata, function (data) {
            //loadAllLines();
            HidePleaseWait();
            $('#close_addcii2lgs').click();
            $('#btn_add2lgs_top').hide();
            $('#btn_add2lgs_bottom').hide();
            alert('Le bon de livraison a été crée !');
            //viewLgsItem(data);
            LoadClientInvoice();
            $('#close_addcii2dfo').click();
        });
    } else {
        alert('La quantité de chaque ligne est 0, veuillez les vérifier !');
    }
    return false;
}




var seltectedClientId = 0;
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
                        //
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
            setConditions(selectedClient);
            js_getCcoByClient(selectedClient.FId);
            getClientProjects(selectedClient.FId);
            //getClientCostPlanInProgress(oneclient.FId);
            // 20210309
            if (IsCreate() || IsModify()) {
                setDefautCommercial(selectedClient);
            }
        } else {
            selectedClient = {};
        }
    });
}



var selectedClient = {};
function js_clientChange(sender) {
    var value = $(sender).val().trim();
    if (IsNullOrEmpty(value)) {
        seltectedClientId = 0;
    }
    return false;
}

function SendCinClick() {
    var cinId = getUrlVars()['cinId'];
    if (cinId) {
        var startBox = "<div class='box'><div class='box-body'>";
        var endBox = "</div></div></div>";
        var onelineContent =
            // start box
            "<div class='form-group' id='div_send_email_content'>" +
            "<div class='row'>" +
            "<div class='col-md-12'>" +
            "<div class='box-body'>" +
            "<div class='form-horizontal'>" +
            "<div class='form-group'>" +
            "<div class='col-sm-12' style='text-align:center;font-size: 18pt;'>Envoyer cette facture ?</div>" +
            "<div class='form-group'>" +
            "<label class='col-sm-2 control-label fieldRequired'>Email Client : </label>" +
            "<div class='col-sm-9'><input class='form-control' id='mailDestination' name='mailDestination' required/></div>" +
            "<div class='col-sm-1'></div>" +
            "</div>" +
            "<div class='form-group'>" +
            "<label class='col-sm-2 control-label fieldRequired'>Mon Email (obligatoire, en copie): </label>" +
            "<div class='col-sm-9'><input class='form-control' id='myEmail' name='myEmail' required/></div>" +
            "<div class='col-sm-1'></div>" +
            "</div>" +
            "<div class='form-group'>" +
            "<label class='col-sm-2 control-label'>Message : </label>" +
            "<div class='col-sm-9'><textarea class='form-control' id='mailMsg' name='mailMsg' cols='3' rows='15' ></textarea></div>" +
            "<div class='col-sm-1'></div>" +
            "</div>" +
            "</div>" +
            // close box
            "</div></div></div></div></div><div class='modal-footer center'>";
        var btnDuplicate = "<button class='btn btn-inverse' onclick='return sendPdfClick()'><span>ENVOYER</span></button>";
        var btnClose = "<button class='btn btn-default bootbox-close-button' onclick='return false'><span>Annuler</span></button>";


        var onecontent = startBox + onelineContent + btnClose + btnDuplicate + endBox;
        var title = 'ENVOYER LA FACTURE';
        bootbox.dialog({
            title: title,
            message: onecontent
        }).find('.modal-dialog').css({
            'width': '50%'
        }).find('.modal-content').css({
            'margin-top': function () {
                var w = $(window).height();
                var b = $(".modal-dialog").height();
                // should not be (w-h)/2
                var h = (w - b) * 0.2;
                return h + "px";
            }
        }).find('.modal-header').css({
            'background': 'url(../../img/menu_005_bg.jpg) repeat-x',
            'text-align': 'center',
            'color': '#C0C0C0'
        });
    }

    if (!jQuery.isEmptyObject(selectedClient)) {
        $('#mailDestination').val(selectedClient.Email);
    }
    if (!jQuery.isEmptyObject(headerFooterText)) {
        var content = headerFooterText.ClinetInvoiceEmail;
        $('#mailMsg').text(content);
    }
    if (!jQuery.isEmptyObject(headerFooterText)) {
        var myemail = headerFooterText.CurUserEmail;
        $('#myEmail').val(myemail);
    }
    return false;
}



function sendPdfClick() {
    var tos = $('#mailDestination').val();
    var ccs = $('#myEmail').val();
    var body = $('#mailMsg').text();
    var oneEmail = {};
    oneEmail.Tos = tos;
    oneEmail.Ccs = ccs;
    oneEmail.Body = body;
    oneEmail.FId = getUrlVars()['cinId'];
    var jsondata = JSON.stringify({ oneEmail: oneEmail });
    var checkOK = CheckRequiredFieldInOneDiv('div_send_email_content');
    if (checkOK) {
        var url = window.webservicePath + "/SendEmailCin";
        $.ajax({
            url: url,
            type: 'POST',
            contentType: 'application/json; charset=utf-8',
            data: jsondata,
            dataType: 'json',
            success: function (data) {
                var sentId = data.d;
                if (sentId !== -1) {
                    if (sentId !== 0) {
                        alert('Email envoyé');
                    } else {
                        MsgErrorPopUp('EMAIL ERREUR', 'Veuillez contacter l\'administrateur pour cet erreur');
                    }
                } else {
                    AuthencationError();
                }
            },
            error: function (data) {
            }
        });
    }
}



var headerFooterText = {};
function js_getHeaderFooterText() {
    var url = window.webservicePath + "/GetHeaderFooterText";
    $.ajax({
        type: "POST",
        url: url,
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        success: function (data) {
            var jsdata = data.d;
            var data2Treat = jQuery.parseJSON(jsdata);
            if (data2Treat !== '-1') {
                headerFooterText = data2Treat;
            }
            else {
                // authentication error
                AuthencationError();
            }
        },
        error: function (data) {
            var test = '';
        }
    });
}


function js_LoadClientById() {
    var url = window.webservicePath + "/GetClientById";
    var jsondata = JSON.stringify({ cliId: selectedClient.Id });
    AjaxCall('post', url, jsondata, function (data) {
        if (data !== null) {
            selectedClient = data;
        }
    });
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
                //console.log(allBankInfo);
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

function loadclientdelegatorlist(cliId, delegatorId) {
    var type = 1; // 1 client; 2 delegator
    delegatorId = IsNullOrEmpty(delegatorId) ? 0 : (delegatorId * 1);
    //var cliId = currentCin.CliFId;
    var jsondata = JSON.stringify({ cliId: cliId, delegatorId: delegatorId });
    var funcname = type == 1 ? '/SearchDelegatorOfClient' : '/SearchClientsOfDelegator';
    $.ajax({
        url: window.webservicePath + funcname,
        type: 'POST',
        contentType: 'application/json; charset=utf-8',
        data: jsondata,
        dataType: 'json',
        success: function (data) {
            var jsdata = data.d;
            var data2Treat = jQuery.parseJSON(jsdata);
            //console.log(delegatorId);
            //console.log(data2Treat);
            $('#DelegatorId').empty();
            $('#DelegatorId').append($("<option>Sélectionner un délégataire</option>").attr("value", "0"));
            $.each(data2Treat, function (name, value) {
                if (value.Key === delegatorId) {
                    $('#DelegatorId').append($("<option>" + value.Value + "</option>").attr("value", value.Key).attr("selected", true));
                }
                else {
                    $('#DelegatorId').append($("<option>" + value.Value + "</option>").attr("value", value.Key));
                }

            });
            if (IsNullOrEmpty(delegatorId)) {
                $('#DelegatorId').val(delegatorId);
            }
        },
        error: function (data) {
        }
    });
}


function updateclientdelegatorclick() {
    var type = 1; // 1 client; 2 delegator
    var cliId = currentCin.CliId;
    var jsondata = JSON.stringify({ cliId: cliId, type: type });
    var funcname = '/GetAllClientsDelegator';
    $.ajax({
        url: window.webservicePath + funcname,
        type: 'POST',
        contentType: 'application/json; charset=utf-8',
        data: jsondata,
        dataType: 'json',
        success: function (data) {
            var jsdata = data.d;
            var data2Treat = jQuery.parseJSON(jsdata);
            //console.log(data2Treat);
            updatepPopup(data2Treat);
        },
        error: function (data) {
        }
    });
    return false;
}

function updatepPopup(client) {
    var type = 1; // 1 client page; 2 delegator page
    var startBox = "<div class='box'><div class='box-body' style='max-height: 800px; overflow-y: auto; overflow-x:auto;'>";
    var content = "" +
        "<table cellpadding='0' cellspacing='0' border='0' class='table table-striped table-bordered table-hover'>";
    var th = "<th rowspan='1' colspan='1' class='smallText' style='background-color:#D8DDFF;'></th>" +
        "<th rowspan='1' colspan='1' class='smallText'>" + (type == 1 ? "Délégataire" : "Client") + "</th>" +
        "<th rowspan='1' colspan='1' class='smallText'>Email</th>";
    th += th;
    //th += th;
    th += th;
    var header = "<thead><tr role='row'>" + th + "</tr></thead>";
    content += header;
    var footer = "<tfoot><tr role='row'>" + th + "</tr></tfoot>";
    var linecount = 1;
    $.each(client, function (name, value) {
        var newline = linecount % 4;
        var lineclass = (newline === 1) ? "odd" : "even";
        content += (newline == 1 ? "<tr class='" + lineclass + "'>" : "");
        //content += "<div class='col-sm-3'>";
        content += "<td><input class='form-control' type='checkbox' id='ip_cli_deleg_" + value.Key + "' clidelegId='" + value.KeyStr1 + "' onclick='clientdelegatorselectClick(this);' " + (value.Actived ? "checked" : "") + "/></td>";
        content += "<td><label class='control-label'>" + (IsNullOrEmpty(value.Value2) ? value.Value : ("[" + value.Value2 + "] " + value.Value)) + "</label></td>";
        content += "<td><label class='control-label'>" + value.Value3 + "</label></td>";
        //content += "</div>";
        //content += (newline === 1 ? "</tr>" : "");
        linecount++;
    });
    content += footer;
    content += "</table>";
    //content += "</div>";
    var btnClose = "<button class='btn btn-default bootbox-close-button' onclick='return false'><span>Clôturer 关闭</span></button>";
    var btns = "<div class='modal-body center'>" + btnClose + "</div>";
    var endBox = "</div>" + btns + "</div>";
    var allcontent = startBox + content + endBox;

    var title = 'Mettre à jour les ' + (type == 1 ? "délégataires" : "clients");
    bootbox.dialog({
        title: title,
        message: allcontent
    }).find('.modal-dialog').css({
        'width': '85%'
    }).find('.modal-content').css({
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
}

function clientdelegatorselectClick(sender) {
    var cliId = "";
    var delegId = "";
    var type = 1; // 1 client page; 2 delegator page
    cliId = getParameterByName('cliId');
    delegId = $(sender).attr('clidelegId');
    var jsondata = JSON.stringify({ cliId: currentCin.CliFId, delgId: delegId, type: type });
    var funcname = '/RelateDeleteClientDelegator';
    $.ajax({
        url: window.webservicePath + funcname,
        type: 'POST',
        contentType: 'application/json; charset=utf-8',
        data: jsondata,
        dataType: 'json',
        success: function (data) {
            var jsdata = data.d;
            var data2Treat = jQuery.parseJSON(jsdata);
            //setclientdelegList(data2Treat, type);
            loadclientdelegatorlist(currentCin.CliFId, currentCin.DelegatorId);
        },
        error: function (data) {
        }
    });
}


function getclientdelegatoremail() {
    var text = currentCin.ClientForPdf.Email;
    var error = "";
    var closetime = 3;
    if (!jQuery.isEmptyObject(currentCin.Delegataire) && !IsNullOrEmpty(currentCin.Delegataire.Value3)) {
        text += (';' + currentCin.Delegataire.Value3);
    }
    else {
        error = "<span style='color: red;font-weight:bolder'>(veuillez noter que l'e-mail de délégataire est vide !)</span>";
        closetime = 5;
    }
    var msg = "";
    if (IsNullOrEmpty(text)) {
        closetime = 5;
        msg = "<span style='color: red;font-weight:bolder'>Veuillez noter : les adresses e-mail du client et du délégataire sont vides !</span>";
    }
    else {
        msg = "Le E-mail correspondant a été copié dans votre presse-papiers," + error + " vous pouvez le coller directement.";
    }


    // 创建一个临时的textarea元素
    var $tempTextarea = $("<textarea>");

    // 将文本内容设置到临时的textarea元素中
    $tempTextarea.val(text);

    // 将临时的textarea元素添加到页面中
    $("body").append($tempTextarea);

    // 选中临时的textarea元素中的文本
    $tempTextarea.select();

    // 执行复制文本的操作
    document.execCommand("copy");

    // 移除临时的textarea元素
    $tempTextarea.remove();

    // 另一种实现方式
    //var $temp = $("<input>");
    //$("body").append($temp);
    //$temp.val(text).select();
    //document.execCommand("copy");
    //$temp.remove();

    initCopyClick(msg, closetime);
    return false;
}

function initCopyClick(text, closetime) {
    var mytheme = 'future';
    var mypos = 'messenger-on-bottom';
    //Set theme
    Messenger.options = {
        extraClasses: 'messenger-fixed ' + mypos,
        theme: mytheme
    }

    //Call
    Messenger().post({
        message: text,
        showCloseButton: true,
        hideAfter: closetime
    });
    consoleEmailContent();
}

function consoleEmailContent() {
    var startBox = "<div class='box'><div class='box-body' style='height: 720px; overflow-y: auto; overflow-x:auto;'>";
    var btnClose = "<button class='btn btn-default bootbox-close-button' onclick='return false'><span>Clôturer</span></button>";
    var btns = "<div class='modal-body center'>" + btnClose + "</div>";
    var emaildeleg = "<div class='box border inverse'><div class='box-title'><h4>E-mail pour délégataire</h4></div><div class='box-body'><div class='form-horizontal'><div class='form-group'><label class='col-sm-1 control-label'>E-mail</label><div class='col-sm-11'><input class='form-control' value='" + currentCin.Inv_CcoEmail + "'></div></div><div class='form-group'><label class='col-sm-1 control-label'>Objet</label><div class='col-sm-11'><input class='form-control' value='" + delegatorobj + currentCin.CinCode + "'></div></div><div class='form-group'><div id='alertsdeleg'></div>" +
        "<div class='btn-toolbar' data-role='editor-toolbar' data-target='#editor_delegator'><div class='btn-group'>" +
        "<a class='btn btn-default dropdown-toggle' data-toggle='dropdown' title='Font'><i class='fa fa-font'></i><b class='caret'></b></a><ul class='dropdown-menu'></ul>" +
        "</div>" +
        "<div class='btn-group'><a class='btn btn-default dropdown-toggle' data-toggle='dropdown' title='Font Size'><i class='fa fa-text-height'></i>&nbsp;<b class='caret'></b></a><ul class='dropdown-menu'><li><a data-edit='fontSize 5'><font size='5'>Huge</font></a></li><li><a data-edit='fontSize 3'><font size='3'>Normal</font></a></li><li><a data-edit='fontSize 1'><font size='1'>Small</font></a></li></ul></div><div class='btn-group'><a class='btn btn-default' data-edit='bold' title='Bold (Ctrl/Cmd+B)'><i class='fa fa-bold'></i></a><a class='btn btn-default' data-edit='italic' title='Italic (Ctrl/Cmd+I)'><i class='fa fa-italic'></i></a><a class='btn btn-default' data-edit='strikethrough' title='Strikethrough'><i class='fa fa-strikethrough'></i></a><a class='btn btn-default' data-edit='underline' title='Underline (Ctrl/Cmd+U)'><i class='fa fa-underline'></i></a></div><div class='btn-group'><a class='btn btn-default' data-edit='insertunorderedlist' title='Bullet list'><i class='fa fa-list-ul'></i></a><a class='btn btn-default' data-edit='insertorderedlist' title='Number list'><i class='fa fa-list-ol'></i></a><a class='btn btn-default' data-edit='outdent' title='Reduce indent (Shift+Tab)'><i class='fa fa-outdent'></i></a><a class='btn btn-default' data-edit='indent' title='Indent (Tab)'><i class='fa fa-indent'></i></a></div><div class='btn-group'><a class='btn btn-default' data-edit='justifyleft' title='Align Left (Ctrl/Cmd+L)'><i class='fa fa-align-left'></i></a><a class='btn btn-default' data-edit='justifycenter' title='Center (Ctrl/Cmd+E)'><i class='fa fa-align-center'></i></a><a class='btn btn-default' data-edit='justifyright' title='Align Right (Ctrl/Cmd+R)'><i class='fa fa-align-right'></i></a><a class='btn btn-default' data-edit='justifyfull' title='Justify (Ctrl/Cmd+J)'><i class='fa fa-align-justify'></i></a></div><div class='btn-group'><a class='btn btn-default dropdown-toggle' data-toggle='dropdown' title='Hyperlink'><i class='fa fa-link'></i></a><div class='dropdown-menu input-append'><input class='span2' placeholder='URL' type='text' data-edit='createLink'/><button class='btn btn-default' type='button'>Add</button></div><a class='btn btn-default' data-edit='unlink' title='Remove Hyperlink'><i class='fa fa-scissors'></i></a></div><div class='btn-group'><a class='btn btn-default' title='Insert picture (or just drag & drop)' id='pictureBtn'><i class='fa fa-picture-o'></i></a><input type='file' data-role='magic-overlay' data-target='#pictureBtn' data-edit='insertImage' /></div><div class='btn-group'><a class='btn btn-default' data-edit='undo' title='Undo (Ctrl/Cmd+Z)'><i class='fa fa-undo'></i></a><a class='btn btn-default' data-edit='redo' title='Redo (Ctrl/Cmd+Y)'><i class='fa fa-repeat'></i></a></div><input type='text' data-edit='inserttext' id='voiceBtn_delegator' x-webkit-speech=''></div>" +
        "<div id='editor_delegator'></div></div></div></div>" +
        "<div class='modal-body center' style='display: none;'><button class='btn btn-inverse' type='button' onclick='return copycontent(2)'>Copier le contenu de l'e-mail</button></div></div>";
    var emailclient = "<div class='box border inverse'><div class='box-title'><h4>E-mail pour client</h4></div><div class='box-body'><div class='form-horizontal'><div class='form-group'><label class='col-sm-1 control-label'>E-mail</label><div class='col-sm-11'><input class='form-control' value='" + (IsNullOrEmpty(currentCin.Delegataire) ? "" : currentCin.Delegataire.Value3) + "'></div><div class='form-group'><label class='col-sm-1 control-label'>Objet</label><div class='col-sm-11'><input class='form-control' value='" + clientobj + "'></div></div><div id='alertsclient'></div>" +
        "<div class='btn-toolbar' data-role='editor-toolbar' data-target='#editor_client'><div class='btn-group'>" +
        "<a class='btn btn-default dropdown-toggle' data-toggle='dropdown' title='Font'><i class='fa fa-font'></i><b class='caret'></b></a><ul class='dropdown-menu'></ul></div>" +
        "<div class='btn-group'><a class='btn btn-default dropdown-toggle' data-toggle='dropdown' title='Font Size'><i class='fa fa-text-height'></i>&nbsp;<b class='caret'></b></a><ul class='dropdown-menu'><li><a data-edit='fontSize 5'><font size='5'>Huge</font></a></li><li><a data-edit='fontSize 3'><font size='3'>Normal</font></a></li><li><a data-edit='fontSize 1'><font size='1'>Small</font></a></li></ul></div><div class='btn-group'><a class='btn btn-default' data-edit='bold' title='Bold (Ctrl/Cmd+B)'><i class='fa fa-bold'></i></a><a class='btn btn-default' data-edit='italic' title='Italic (Ctrl/Cmd+I)'><i class='fa fa-italic'></i></a><a class='btn btn-default' data-edit='strikethrough' title='Strikethrough'><i class='fa fa-strikethrough'></i></a><a class='btn btn-default' data-edit='underline' title='Underline (Ctrl/Cmd+U)'><i class='fa fa-underline'></i></a></div><div class='btn-group'><a class='btn btn-default' data-edit='insertunorderedlist' title='Bullet list'><i class='fa fa-list-ul'></i></a><a class='btn btn-default' data-edit='insertorderedlist' title='Number list'><i class='fa fa-list-ol'></i></a><a class='btn btn-default' data-edit='outdent' title='Reduce indent (Shift+Tab)'><i class='fa fa-outdent'></i></a><a class='btn btn-default' data-edit='indent' title='Indent (Tab)'><i class='fa fa-indent'></i></a></div><div class='btn-group'><a class='btn btn-default' data-edit='justifyleft' title='Align Left (Ctrl/Cmd+L)'><i class='fa fa-align-left'></i></a><a class='btn btn-default' data-edit='justifycenter' title='Center (Ctrl/Cmd+E)'><i class='fa fa-align-center'></i></a><a class='btn btn-default' data-edit='justifyright' title='Align Right (Ctrl/Cmd+R)'><i class='fa fa-align-right'></i></a><a class='btn btn-default' data-edit='justifyfull' title='Justify (Ctrl/Cmd+J)'><i class='fa fa-align-justify'></i></a></div><div class='btn-group'><a class='btn btn-default dropdown-toggle' data-toggle='dropdown' title='Hyperlink'><i class='fa fa-link'></i></a><div class='dropdown-menu input-append'><input class='span2' placeholder='URL' type='text' data-edit='createLink'/><button class='btn btn-default' type='button'>Add</button></div><a class='btn btn-default' data-edit='unlink' title='Remove Hyperlink'><i class='fa fa-scissors'></i></a></div><div class='btn-group'><a class='btn btn-default' title='Insert picture (or just drag & drop)' id='pictureBtn'><i class='fa fa-picture-o'></i></a><input type='file' data-role='magic-overlay' data-target='#pictureBtn' data-edit='insertImage' /></div><div class='btn-group'><a class='btn btn-default' data-edit='undo' title='Undo (Ctrl/Cmd+Z)'><i class='fa fa-undo'></i></a><a class='btn btn-default' data-edit='redo' title='Redo (Ctrl/Cmd+Y)'><i class='fa fa-repeat'></i></a></div><input type='text' data-edit='inserttext' id='voiceBtn_client' x-webkit-speech=''></div>" +
        "<div id='editor_client'></div></div></div>" +
        "<div class='modal-body center' style='display: none;'><button class='btn btn-inverse' type='button' onclick='return copycontent(1)'>Copier le contenu de l'e-mail</button></div></div></div>";
    var content = "<div class='row'><div class='col-sm-6' id='div_email_client'>" + emailclient + "</div><div class='col-sm-6' id='div_email_delegataire'>" + emaildeleg + "</div></div>";
    var endBox = "</div>" + btns + "</div>";
    var allcontent = startBox + content + endBox;

    var title = 'Envoyer des courriels aux clients et aux délégataires';
    bootbox.dialog({
        title: title,
        message: allcontent
    }).find('.modal-dialog').css({
        'width': '95%',
        'height': '90%'
    }).find('.modal-content').css({
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
    handleWysiwyg();
}

function handleWysiwyg() {
    /* Init Bootstrap WYSIWYG */
    //function initToolbarBootstrapBindings() {
    var fonts = ['Serif', 'Sans', 'Arial', 'Arial Black', 'Courier',
        'Courier New', 'Comic Sans MS', 'Helvetica', 'Impact', 'Lucida Grande', 'Lucida Sans', 'Tahoma', 'Times',
        'Times New Roman', 'Verdana'],
        fontTarget = $('[title=Font]').siblings('.dropdown-menu');
    $.each(fonts, function (idx, fontName) {
        fontTarget.append($('<li><a data-edit="fontName ' + fontName + '" style="font-family:\'' + fontName + '\'">' + fontName + '</a></li>'));
    });
    $('a[title]').tooltip({ container: 'body' });
    $('.dropdown-menu input').click(function () { return false; })
        .change(function () { $(this).parent('.dropdown-menu').siblings('.dropdown-toggle').dropdown('toggle'); })
        .keydown('esc', function () { this.value = ''; $(this).change(); });

    $('[data-role=magic-overlay]').each(function () {
        var overlay = $(this), target = $(overlay.data('target'));
        overlay.css('opacity', 0).css('position', 'absolute').offset(target.offset()).width(target.outerWidth()).height(target.outerHeight());
    });
    if ("onwebkitspeechchange" in document.createElement("input")) {
        var editorOffset = $('#editor_delegator').offset();
        $('#voiceBtn_delegator').css('position', 'absolute').offset({ top: editorOffset.top, left: editorOffset.left + $('#editor_delegator').innerWidth() - 35 });
        var editorOffset = $('#editor_client').offset();
        $('#voiceBtn_client').css('position', 'absolute').offset({ top: editorOffset.top, left: editorOffset.left + $('#editor_client').innerWidth() - 35 });
    } else {
        $('#voiceBtn_delegator').hide();
        $('#voiceBtn_client').hide();
    }
    //};
    function showErrorAlert(reason, detail) {
        var msg = '';
        if (reason === 'unsupported-file-type') { msg = "Unsupported format " + detail; }
        else {
            console.log("error uploading file", reason, detail);
        }
        $('<div class="alert"> <button type="button" class="close" data-dismiss="alert">&times;</button>' +
            '<strong>File upload error</strong> ' + msg + ' </div>').prependTo('#alertsdeleg');
        $('<div class="alert"> <button type="button" class="close" data-dismiss="alert">&times;</button>' +
            '<strong>File upload error</strong> ' + msg + ' </div>').prependTo('#alertsclient');
    };
    //initToolbarBootstrapBindings();
    $('#editor_delegator').wysiwyg({ fileUploadError: showErrorAlert });
    $('#editor_client').wysiwyg({ fileUploadError: showErrorAlert });
    /* Disable auto-inline */
    CKEDITOR.disableAutoInline = true;
    seteditorcontent();
}


var delegatorcontent =
    '<p><span style="color: #1F497D;font-family: Tahoma, Geneva, sans-serif;"><span style="font-size: medium;">Bonjour,</span></span></p>' +
    '<p><span style="color: #1F497D;font-family: Tahoma, Geneva, sans-serif;"><span style="font-size: medium;"><br /></span></span><span style="color: #1F497D;font-family: Tahoma, Geneva, sans-serif;"><span style="font-size: medium;">Veuillez trouver ci-joint la facture du <strong>[client]</strong>, dat&eacute;e du [date], portant le num&eacute;ro <strong>[n&deg; de facture]</strong>, pour un montant de <strong>[montant] &euro;</strong>.</span></span></p>' +
    '<p><span style="color: #1F497D;font-family: Tahoma, Geneva, sans-serif;"><span style="font-size: medium;"><br />Cette facture correspond au devis <strong>[n&deg; de devis]</strong>.</span></span></p>' +
    '<p><span style="color: #1F497D;font-family: Tahoma, Geneva, sans-serif;"><span style="font-size: medium;"><br /></span></span><span style="color: #1F497D;"><span style="font-size: medium;">Nous vous remercions de bien vouloir enregistrer cette facture en d&eacute;l&eacute;gation de paiement lors du d&eacute;p&ocirc;t du dossier de valorisation du client final.</span></span></p>' +
    '<p><span style="color: #1F497D;font-family: Tahoma, Geneva, sans-serif;"><span style="font-size: medium;"><br /></span></span><span style="color: #1F497D;"><span style="font-size: medium;">Restant &agrave; votre disposition pour toute information compl&eacute;mentaire.</span></span></p>' +
    '<p><span style="color: #1F497D;font-family: Tahoma, Geneva, sans-serif;"><span style="font-size: medium;"><br /></span></span><span style="color: #1F497D;"><span style="font-size: medium;">Cordialement,</span></span></p>' +
    '<p><span style="color: #1F497D;font-family: Tahoma, Geneva, sans-serif;"><span style="font-size: medium;"><br /><strong>Gary ABITBOL<br />AX TECH</strong><br />8 rue Marbeau<br />75016 Paris<br />T&eacute;l. : 01 72 99 57 49</span></span></p>';;

var delegatorobj = 'Transmission de la facture – Délégation de paiement du ';

var clientobj = 'Transmission de votre facture au délégataire CEE';

var clientcontent = '<p><span style="color: #1f497d; font-family: Tahoma, Geneva, sans-serif;"><span style="font-size: medium;">Bonjour,</span></span></p>' +
    '<p><span style="color: #1f497d; font-family: Tahoma, Geneva, sans-serif;"><span style="font-size: medium;"><br /></span></span><span style="color: #1f497d; font-family: Tahoma, Geneva, sans-serif;"><span style="font-size: medium;">Nous vous confirmons l&rsquo;envoi de votre facture n&deg;&nbsp;<strong>[num&eacute;ro de facture]</strong>, d&rsquo;un montant de <strong>[montant] &euro;</strong>,&nbsp;au d&eacute;l&eacute;gataire (<strong>[nom du d&eacute;l&eacute;gataire]</strong>).</span></span></p>' +
    '<p><span style="color: #1f497d; font-family: Tahoma, Geneva, sans-serif;"><span style="font-size: medium;"><br />Cette facture a &eacute;t&eacute; transmise pour validation lors du d&eacute;p&ocirc;t du dossier, dans le cadre du r&egrave;glement en d&eacute;l&eacute;gation de paiement aupr&egrave;s de notre soci&eacute;t&eacute;.</span></span></p>' +
    '<p><span style="color: #1f497d; font-family: Tahoma, Geneva, sans-serif;"><span style="font-size: medium;"><br /></span></span><span style="color: #1f497d;"><span style="font-size: medium;">Nous restons &agrave; votre disposition pour toute information compl&eacute;mentaire et pour le suivi de votre dossier.</span></span></p>' +
    '<p><span style="color: #1f497d; font-family: Tahoma, Geneva, sans-serif;"><span style="font-size: medium;"><br /></span></span><span style="color: #1f497d;"><span style="font-size: medium;">Cordialement,</span></span></p>' +
    '<p><span style="color: #1f497d; font-family: Tahoma, Geneva, sans-serif;"><span style="font-size: medium;"><br /><strong>Gary ABITBOL<br />AX TECH</strong><br />8 rue Marbeau<br />75016 Paris<br />T&eacute;l. : 01 72 99 57 49</span></span></p>';

function seteditorcontent() {
    clientcontent = clientcontent.replace('[num&eacute;ro de facture]', currentCin.CinCode);
    clientcontent = clientcontent.replace('[montant]', currentCin.CinAmount);
    clientcontent = clientcontent.replace('[nom du d&eacute;l&eacute;gataire]', (IsNullOrEmpty(currentCin.Delegataire) ? "" : currentCin.Delegataire.Value));
    $('#editor_client').html(clientcontent);

    delegatorcontent = delegatorcontent.replace('[n&deg; de facture]', currentCin.CinCode);
    delegatorcontent = delegatorcontent.replace('[client]', currentCin.ClientCompanyName);
    delegatorcontent = delegatorcontent.replace('[date]', getDateString(currentCin.CinDInvoice));
    delegatorcontent = delegatorcontent.replace('[montant]', currentCin.CinAmount);
    delegatorcontent = delegatorcontent.replace('[n&deg; de devis]', currentCin.CodCode);

    $('#editor_delegator').html(delegatorcontent);
}


function copycontent(type) {
    // 创建一个临时的textarea元素
    var $tempTextarea = $("<textarea>");


    var bugId = type == 1 ? "editor_client" : "editor_delegator";
    // 将文本内容设置到临时的textarea元素中

    var test = $('#' + bugId).html();
    console.log(test);

    $tempTextarea.html(test);

    // 将临时的textarea元素添加到页面中
    $("body").append($tempTextarea);

    // 选中临时的textarea元素中的文本
    $tempTextarea.select();

    // 执行复制文本的操作
    document.execCommand("copy");

    // 移除临时的textarea元素
    $tempTextarea.remove();

    // 另一种实现方式
    //var $temp = $("<input>");
    //$("body").append($temp);
    //$temp.val(test).select();
    //document.execCommand("copy");
    //$temp.remove();
    var closetime = 3;
    //initCopyClick(msg, closetime);
    return false;
}