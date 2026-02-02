$(document).ready(init);

function init() {
    //getCommercials();
    //js_getClient('Client');
    //js_getAllTVA('VatId');
    //js_GetPaymentCondition('PcoId');
    //js_GetPaymentMode('PmoId');
    ShowPleaseWait();
    setAutoCompleteClient();
    //js_getClient('Client');
    //$.when(_getClient(dtdGetclient)).done(function () {
        $.when(_getAllTva(dtdGetAllTva)).done(function () {
            $.when(_getPco(dtdGetPco)).done(function () {
                $.when(_getPmo(dtdGetPmo)).done(function () {
                    $.when(_getCom(dtdGetCommercial)).done(function () {
                        if (_isView || _isModify) {
                            getCurrentSoc();
                            LoadClientOrder();
                            initClientOrderLine();
                            //        if (_isView) {
                            //            $('._infoCollapse').click();
                            //        }
                        }
                        if (!jQuery.isEmptyObject(connectedUser) && connectedUser.LoginMode === 1) {
                            $('#div_for_keyprj').show();
                        }
                        else {
                            $('#div_for_keyprj').hide();
                        }
                        HidePleaseWait();
                    });
                });
            });
        });
    //});

    $.each($('.datepicker'), function (idx, value) {
        $(value).datepicker();
    });
    //    if (_isView || _isModify) {
    //        LoadClientOrder();
    //        //        if (_isView) {
    //        //            $('._infoCollapse').click();
    //        //        }
    //    }
    $('._infoCollapse').click();
    initMode();

    SetLanguageBar();
    if (_isCreate) {
        $('#_dCreationString').val(getToday());
    }
}



var dtdGetclient = $.Deferred();
var dtdGetAllTva = $.Deferred();
var dtdGetPco = $.Deferred();
var dtdGetPmo = $.Deferred();
var dtdGetCommercial = $.Deferred();

var allclient = [];
var _getClient = function (dtdGetclient) {
    var elementId = 'Client';
    var url = window.webservicePath + "/GetAllClients";
    var budgetId = '#' + elementId;
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
                allclient = [];
                allclient = data2Treat;
                var id = selectedClient.Id;
                selectedClient = searchFieldValueInArray(allclient, 'Id', id);
                selectedClient.Id = id;
                $.each(data2Treat, function (name, value) {
                    $(budgetId)
                            .append($("<option></option>")
                                .attr("data-value", value.FId)
                                .attr("value", value.CompanyName));
                });
                setClientByPrjId();
                dtdGetclient.resolve();
            } else {
                // authentication error
                AuthencationError();
                //dtdGetclient.resolve();
                dtdGetclient.resolve();
            }
        },
        error: function (data) {
            var test = '';
            //dtdGetclient.resolve();
            dtdGetclient.resolve();
        }
    });
    return dtdGetclient.promise();
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



var currentCod = [];

function LoadClientOrder() {
    var codId = getUrlVars()['codId'];
    if (codId) {
        var url = window.webservicePath + "/LoadClientOrder";
        var datastr = "{codId:'" + codId + "'}";
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
                    var oneCod = data2Treat;
                    currentCod = [];
                    currentCod = oneCod;
                    $.each(oneCod, function (name, value) {
                        //console.info(order);   
                        var newname = name;
                        if (name === 'Inv_CcoCity') {
                            newname = 'Inv_ip_CcoCity';
                        }
                        if (name === 'Dlv_CcoCity') {
                            newname = 'Dlv_ip_CcoCity';
                        }

                        var setThisvalue = true;
                        if (name === 'ClientCompanyName') {
                            //newname = 'ip_Client';
                            newname = 'ClientList';
                            setThisvalue = false;
                        }
                        if (name.indexOf('_') === 0) {
                            setThisvalue = false;
                        }
                        if (name === 'CodDateCreation') {
                            newname = '_dCreationString';
                        }
                        if (name === 'CodDateUpdate') {
                            newname = '_dUpdateString';
                        }
                        if (name === 'CodDatePreDeliveryForm') {
                            newname = '_CodDatePreDeliveryForm';
                        }
                        if (name === 'CodDatePreDeliveryTo') {
                            newname = '_CodDatePreDeliveryTo';
                        }
                        if (name === 'CodDateEndWork') {
                            newname = '_CodDateEndWork';
                        }
                        if (name === 'CliId') {
                            selectedClient.Id = value;
                        }
                        if (name === 'CodDiscountAmount') {
                            newname = '_CodDiscountAmount';
                        }
                        if (name === 'Creator') {
                            newname = 'CreatorName';
                            value = value.FullName;
                        }
                        if (name === 'CplName') {
                            $('#CplName').append($("<option>" + value + "</option>"));
                            setThisvalue = false;
                            $('#CplName').attr('disabled', '');
                        }

                        if (name === 'CodFile') {
                            if (value !== '' && value !== "" && value !== null) {
                                var src = "../Common/PageForPDF.aspx?type=1&codId=" + encodeURIComponent(codId);
                                $('#iframepdf').attr('src', src);
                                $('#btn_delete_cod_file').show();
                            } else {
                                $('#iframepdf').attr('height', '0');
                                $('#a_collapse').click();
                                $('#btn_delete_cod_file').hide();
                            }
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
                    });
                    // 20220527 ClientCompanyName + ClientAbbreviation
                    setFieldValue("ClientList", IsNullOrEmpty(oneCod.CliAbbr)? oneCod.ClientCompanyName: (oneCod.ClientCompanyName + "-" + oneCod.CliAbbr));
                    seltectedClientId = oneCod.CliId;
                    if (_isModify) {
                        //$('#ip_Client').attr('disabled', '');
                        $('#ClientList').attr('disabled', '');
                        $('#CplName').attr('disabled', '');
                    }
                    setClickableLabel();
                    //getClientCostPlanInProgress(oneCod.CliId, oneCod.CplFId);
                    js_getCcoByClient(oneCod.CliFId, oneCod.CcoIdInvoicing, oneCod.CcoIdDelivery);
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
    window.location = 'SearchClientOrder.aspx';
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
        MsgPopUpWithResponse('ATTENTION', 'Le client n\'est pas dans la liste, un nouveau client seras créé! ', 'GotoClient()');
    } else {
        //$('#ip_Client').val(oneclient.CompanyName);
        $('#ClientList').val(oneclient.CompanyName);
        selectedClient = oneclient;
        setConditions(selectedClient);
        js_getCcoByClient(oneclient.FId);
        getClientCostPlanInProgress(oneclient.FId);
    }
}

function GotoClient() {
    ShowPleaseWaitWithText();
    var url = '../Client/Client.aspx';
    window.location = url;
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

function setClientByPrjId() {
    var prjId = getParameterByName('prjId');
    if (prjId && _isCreate) {
        var url = window.webservicePath + "/GetClientId";
        var datastr = "{itemId:'" + prjId + "',typeId:1}";
        $.ajax({
            type: "POST",
            url: url,
            contentType: "application/json; charset=utf-8",
            dataType: "json",
            data: datastr,
            success: function (data) {
                var jsdata = data.d;
                var data2Treat = jsdata;
                if (data2Treat !== '-1') {
                    try {
                        var oneclient = searchFieldValueInArray(allclient, 'FId', data2Treat);
                        if (oneclient) {
//                            $('#ip_Client').val(oneclient.CompanyName);
//                            $('#ip_Client').attr('disabled', '');
                            $('#ClientList').val(oneclient.CompanyName);
                            $('#ClientList').attr('disabled', '');
                            js_getCcoByClient(oneclient.FId);
                        }
                    } catch (e) {
                        var catchE = e;
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
        $('#Inv_CcoAdresseTitle').append($("<option></option>")
                    .attr("value", 0)
                    .text('Sélectionner un commercial client ou laisser vide'));
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
        //        $('#Dlv_CcoAdresseTitle').append($("<option></option>")
        //            .attr("value", 0)
        //            .text('Sélectionner l\'adresse de livraison'));
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
    var ccoRef = (inv ? 'Inv_' : 'Dlv_') + 'CcoRef';
    var ccoFirstname = (inv ? 'Inv_' : 'Dlv_') + 'CcoFirstname';
    var ccoLastname = (inv ? 'Inv_' : 'Dlv_') + 'CcoLastname';
    //            var ccoAddress1 = (inv ? 'Inv_' : 'Dlv_') + 'CcoAddress1';
    //            var ccoAddress2 = (inv ? 'Inv_' : 'Dlv_') + 'CcoAddress2';
    //            var ccoPostcode = (inv ? 'Inv_' : 'Dlv_') + 'CcoPostcode';
    //            var ccoCity = (inv ? 'Inv_ip_' : 'Dlv_ip_') + 'CcoCity';
    //            var ccoCountry = (inv ? 'Inv_' : 'Dlv_') + 'CcoCountry';
    var ccoTel1 = (inv ? 'Inv_' : 'Dlv_') + 'CcoTel1';
    var ccoEmail = (inv ? 'Inv_' : 'Dlv_') + 'CcoEmail';
    var ccoFax = (inv ? 'Inv_' : 'Dlv_') + 'CcoFax';
    var ccoCellphone = (inv ? 'Inv_' : 'Dlv_') + 'CcoCellphone';

    if (ccoId > 0) {
        var aCco = searchFieldValueInArray((inv ? ccoInvoice : ccoDelivery), 'CcoId', ccoId);
        if (aCco) {
            $('#' + ccoRef).val(aCco.CcoRef);
            $('#' + ccoFirstname).val(aCco.CcoFirstname);
            $('#' + ccoLastname).val(aCco.CcoLastname);
            //            $('#' + ccoAddress1).val(aCco.CcoAddress1);
            //            $('#' + ccoAddress2).val(aCco.CcoAddress2);
            //            $('#' + ccoPostcode).val(aCco.CcoPostcode);
            //            $('#' + ccoCity).val(aCco.CcoCity);
            //            $('#' + ccoCountry).val(aCco.CcoCountry);
            $('#' + ccoTel1).val(aCco.CcoTel1);
            $('#' + ccoEmail).val(aCco.CcoEmail);
            $('#' + ccoFax).val(aCco.CcoFax);
            $('#' + ccoCellphone).val(aCco.CcoCellphone);
        }
    } else {
        $('#' + ccoRef).val('');
        $('#' + ccoFirstname).val('');
        $('#' + ccoLastname).val('');
        $('#' + ccoTel1).val('');
        $('#' + ccoEmail).val('');
        $('#' + ccoFax).val('');
        $('#' + ccoCellphone).val('');
    }
    $('#' + ccoRef).attr("disabled", "");
    $('#' + ccoFirstname).attr("disabled", "");
    $('#' + ccoLastname).attr("disabled", "");
    $('#' + ccoTel1).attr("disabled", "");
    $('#' + ccoEmail).attr("disabled", "");
    $('#' + ccoFax).attr("disabled", "");
    $('#' + ccoCellphone).attr("disabled", "");
}

function js_create_update_clientorder() {
    var checkOK = CheckRequiredFieldInOneDiv('content') && (seltectedClientId !== 0);
    if (checkOK) {
        ShowPleaseWait();
        var aClientOrder = Object();
        aClientOrder.FId = getUrlVars()['codId'];
        aClientOrder.ClientCompanyName = $('#ClientList').val();
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

        aClientOrder.CodDateCreation = getCreationDate($('#_dCreationString').val());

        aClientOrder.UsrCom1 = $('#UsrCom1 option:selected').val() * 1;
        aClientOrder.UsrCom2 = $('#UsrCom2 option:selected').val() * 1;
        aClientOrder.UsrCom3 = $('#UsrCom3 option:selected').val() * 1;
        aClientOrder.CodKeyProject = $('#CodKeyProject').is(':checked');

        var jsondata = JSON.stringify({ oneClientOrder: aClientOrder });
        $.ajax({
            url: 'ClientOrder.aspx/CreateUpdateClientOrder',
            type: 'POST',
            contentType: 'application/json; charset=utf-8',
            data: jsondata,
            dataType: 'json',
            success: function(data) {
                var codId = data.d;
                var url = 'ClientOrder.aspx';
                var newUrl = url + '?codId=' + codId + '&mode=view';
                document.location.href = newUrl;
            },
            error: function(data) {
            }
        });
    } else {
        alert('Veuillez sélectionner un client');
    }
    return false;
}

function ExternLinkClick(sender) {
    if (_isView && currentCod) {
        ExternLinkBaseClick(sender, currentCod);
        //        var page = $(sender).attr('pgid');
        //        var flid = $(sender).attr('flid');
        //        var par = $(sender).attr('prms');
        //        var etid = $(sender).attr('etid');
        //        var id = currentCod[etid];
        //        //alert(id);
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
    }
}

function downloadPdf(sender) {
    var codId = getUrlVars()['codId'];
    // Create an IFRAME.
    //    var iframe = document.createElement("iframe");
    //    // Point the IFRAME to GenerateFile
    //    var url = "../Common/PageDownLoad.aspx?cplId=" + cplId;
    //    iframe.src = url;
    //    iframe.style.display = "none";
    //    document.body.appendChild(iframe);
    codId = encodeURIComponent(codId);

    window.open('../Common/PageDownLoad.aspx?codId=' + codId, '_blank');
    return false;
}

function AddModifyDiscount() {
    var codId = getUrlVars()['codId'];
    if (codId) {
        var url = window.webservicePath + "/GetClientOrderInfo";
        var datastr = "{codId:'" + codId + "'}";
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
    var CodDiscountPercentage = cplInfo.CodDiscountPercentage;
    var CodDiscountAmount = cplInfo.CodDiscountAmount;
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
            "<div class='col-sm-2'><div class='input-group'><input type='number' step='0.01' class='form-control' id='CodDiscountPercentage' name='CodDiscountPercentage' value='" + CodDiscountPercentage + "' onkeyup='calculateDiscount(this)' /><span class='input-group-addon'>%</span></div></div>" +
            "<label class='col-sm-2 control-label sale'>Montant de remise</label>" +
            "<div class='col-sm-2 sale'><input type='number' step='0.01' class='form-control' id='CodDiscountAmount' name='CodDiscountAmount' value='" + CodDiscountAmount + "' onkeyup='calculateDiscount(this)' /></div>" +
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

    var btns = "<div class='modal-body center'>" + btnClose + btnAddUpdate + "</div>";
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
        'color': '#C0C0C0'
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
    if (id === 'CodDiscountPercentage') {
        disPercent = thisval;
        disAmount = disPercent * 0.01 * totalsale;
        disAmount = disAmount.toFixed(2);
        $('#CodDiscountAmount').val(disAmount);
    } else {
        disAmount = thisval;
        disPercent = (disAmount * 100 / (totalsale === 0 ? 1 : totalsale)).toFixed(2);
        $('#CodDiscountPercentage').val(disPercent);
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
    var codId = getUrlVars()['codId'];
    if (codId) {
        var disAmount = $('#CodDiscountAmount').val();
        var disPercent = $('#CodDiscountPercentage').val();
        var url = window.webservicePath + "/AddUpdateClientOrderDiscount";
        var datastr = "{codId:'" + codId + "',discountPercentage:" + disPercent + ",discountAmount:'" + disAmount + "'}";
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
                    LoadClientOrder();
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


        var onecontent = startBox + onelineContent + btnClose + btnDuplicate + endBox;
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
            'color': '#C0C0C0'
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
            'color': '#C0C0C0'
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
    var codId = getUrlVars()['codId'];
    var url = "../../Services/UploadFilesGeneral.ashx?type=1&codId=" + encodeURIComponent(codId);
    if (codId) {
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
                var src = "../Common/PageForPDF.aspx?type=1&codId=" + encodeURIComponent(codId);
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

function delete_cod_file_click() {
    var title = "ATTENTION";
    var content = "<div class='box'><div class='box-body' style='height: 100px;'>" +
        "<div class='form-horizontal'>" +
        "<div class='col-md-12'>" +
        "<div class='form-group'>" +
        "<div class='col-sm-12' style='text-align:center;font-size: 18pt;'>Veuillez confirmer la suppression ! " +
        "<br/>La suppression de fichier est irrécupérable, veuillez confirmer !!!</div></div></div></div></div></div>"
        + "<div class='modal-footer center'>" +
        "<button type='button' class='btn btn-default' onclick='closeDialog()'>Annuler</button>" +
        "<button type='button' class='btn btn-inverse' onclick='return deleteCodFile();'>SUPPRIMER</button></div>";
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

function deleteCodFile() {
    var codId = getUrlVars()['codId'];
    var url = window.webservicePath + "/DeleteClientOrderFile";
    $.ajax({
        type: "POST",
        url: url,
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        data: "{codId:'" + codId + "'}",
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
    var page = pageId === 1 ? "ClientOrderDeliveryFormList.aspx" : "../DeliveryForm/DeliveryForm.aspx";
    page += '?codId=' + codId;
    window.location = page;
}


function createDfoNew() {
    ShowPleaseWait();
    checkOrderAllDeliveried();
    //    var codId = getUrlVars()['codId'];
    //    var url = '../DeliveryForm/DeliveryForm.aspx?codId=' + codId + "&mode=create";
    //    document.location = url;
    return false;
}


//function checkOrderAllDeliveried() {
//    var codId = getUrlVars()['codId'];
//    if (codId) {
//        var url = window.webservicePath + "/CheckClientOrderLineNotCompleteDeliveried";
//        var datastr = "{codId:'" + codId + "'}";
//        $.ajax({
//            type: "POST",
//            url: url,
//            contentType: "application/json; charset=utf-8",
//            data: datastr,
//            dataType: "json",
//            success: function (data) {
//                var jsdata = data.d;
//                var data2Treat = jQuery.parseJSON(jsdata);
//                if (data2Treat !== -1) {
//                    if (data2Treat === 0) {
//                        HidePleaseWait();
//                        //MsgErrorPopUp('ERREUR','Toutes les lignes sont déjà livrées, vous ne pouvez plus créer de bon de livraison !');
//                        MsgPopUpWithResponseChoice('ERREUR', 'Toutes les lignes sont déjà livrées, vous ne pouvez plus créer de bon de livraison !', 'Consulter les BL', 'goToDeliveryFormList(1)');
//                    }
//                    else if (data2Treat === -2) {
//                        HidePleaseWait();
//                        MsgErrorPopUp('ERREUR', 'Veuillez ajouter des lignes de commande, ensuite, créer de bon de livraison !');
//                    }
//                    else {
//                        if (data2Treat === 3) {
//                            HidePleaseWait();
//                            MsgPopUpWithResponseChoice('CONFIRMATION', 'Veuillez confirmer la création de Bon de livraison, une fois vous le créez, toutes les lignes de commande ne sont plus modifiées !', 'Créer', 'createDfo()','Annuler');
//                        } else {
//                            createDfo();    
//                        }
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

var seltectedClientId = 0;
var ClientList = [];
function setAutoCompleteClient() {
   var url = window.webservicePath + "/SearchClientByName";
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
                    //alert(response.responseText);
                    //console.log(response);
                },
                failure: function(response) {
                    alert(response.responseText);
                }
            });
        },
        select: function(e, i) {
            seltectedClientId = i.item.val * 1;
            selectedClientChanged(seltectedClientId);
        },
        minLength: 2
    });
}

function selectedClientChanged(cliId) {
    var url = window.webservicePath + "/GetClientById";
    var jsondata = JSON.stringify({ cliId: cliId });
    AjaxCall('post', url, jsondata, function(data) {
        if (data !== null) {
            selectedClient = data;
            setConditions(selectedClient);
            js_getCcoByClient(selectedClient.FId);
            getClientCostPlanInProgress(selectedClient.FId);
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