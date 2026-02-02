$(document).ready(init);

var dtdGetclient = $.Deferred();
var dtdGetAllTva = $.Deferred();
var dtdGetPco = $.Deferred();
var dtdGetPmo = $.Deferred();
var dtdGetCommercial = $.Deferred();
function init() {
    ShowPleaseWait();
    //js_getClient('Client');
    //$.when(_getClient(dtdGetclient)).done(function () {
    setAutoCompleteClient();
        $.when(_getAllTva(dtdGetAllTva)).done(function () {
            $.when(_getPco(dtdGetPco)).done(function () {
                $.when(_getPmo(dtdGetPmo)).done(function () {
                    $.when(_getCom(dtdGetCommercial)).done(function () {
                        initCostPlanLine();
                        if (_isCreate) {
                            setDeafaultValues();
                            removeDisabledClient(true);
                        } else if (_isView || _isModify) {
                            getCurrentSoc();
                            get_status();
                            LoadCostPlan(true);
                        } else {
                            var cplId = getUrlVars()['cplId'];
                            if (cplId) {
                                window.location = 'CostPlan.aspx?mode=create';
                            }
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

    SetLanguageBar();
    //js_GetPaymentCondition('PcoId');
    //js_GetPaymentMode('PmoId');
    $.each($('.datepicker'), function (idx, value) {
        $(value).datepicker();
    });
    //setDeafaultValues();
    //getCommercials();
    //    if (_isView || _isModify) {
    //        get_status();
    //        LoadCostPlan(true);
    //    } else {
    //        var cplId = getUrlVars()['cplId'];
    //        if (cplId) {
    //            window.location = 'CostPlan.aspx?mode=create';
    //        }
    //    }
    $('._infoCollapse').click();
    initMode();
    js_getHeaderFooterText();
}


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
                            .attr("value", (IsNullOrEmpty(value.CliAbbr) ? value.CompanyName : (value.CompanyName + "-" + value.CliAbbr)))
                            .attr("actived", value.Isactive));
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
//                    if (_isCreate) {
//                        if (connectedUser.Id === oneCom.Id) {
//                            $('#UsrCom1').append($("<option>" + oneCom.FullName + "</option>").attr("value", oneCom.Id).attr("selected", true));
//                        } else {
//                            $('#UsrCom1').append($("<option>" + oneCom.FullName + "</option>").attr("value", oneCom.Id));
//                        }
//                    } else {
//                        $('#UsrCom1').append($("<option>" + oneCom.FullName + "</option>").attr("value", oneCom.Id));
//                    }

                    $('#UsrCom1').append($("<option>" + oneCom.FullName + "</option>").attr("value", oneCom.Id));
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

var currentCpl = [];
var currentCplCstId = 0;
function LoadCostPlan(loadLine) {
    var cplId = getUrlVars()['cplId'];
    if (cplId) {
        var url = window.webservicePath + "/LoadCostPlan";
        var datastr = "{cplId:'" + cplId + "'}";
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
                    var oneCpl = data2Treat;
                    currentCpl = [];
                    currentCpl = oneCpl;
                    $.each(oneCpl, function (name, value) {
                        //console.info(order);   
                        var newname = name;
                        if (name === 'Inv_CcoCity') {
                            newname = 'Inv_ip_CcoCity';
                        }
                        if (name === 'ClientCompanyName') {
                            //newname = 'ip_Client';
                            newname = 'ClientList';
                            setThisvalue = false;
                        }
                        if (name === 'Dlv_CcoCity') {
                            newname = 'Dlv_ip_CcoCity';
                        }
                        if (name === 'CliId') {
                            selectedClient = searchFieldValueInArray(allclient, 'Id', value);
                            selectedClient.Id = value;
                        }
                        var setThisvalue = true;
                        if (name.indexOf('_') === 0) {
                            setThisvalue = false;
                        }
                        if (name === 'CplDateCreation') {
                            newname = '_dCreationString';
                        }
                        if (name === 'CplDateUpdate') {
                            newname = '_dUpdateString';
                        }
                        if (name === 'CplDateValidity') {
                            newname = '_dValidityString';
                        }
                        if (name === 'CplDatePreDelivery') {
                            newname = '_dPreDeliveryString';
                        }
                        if (name === 'CplDiscountAmount') {
                            newname = '_CplDiscountAmount';
                        }
                        if (name === 'Creator') {
                            newname = 'CreatorName';
                            value = value.FullName;
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
                    setFieldValue("ClientList", IsNullOrEmpty(oneCpl.CliAbbr)? oneCpl.ClientCompanyName: (oneCpl.ClientCompanyName + "-" + oneCpl.CliAbbr));


                    seltectedClientId = oneCpl.CliId;

                    setClickableLabel();
                    getClientProjects(oneCpl.CliFId, oneCpl.PrjFId);
                    js_getCcoByClient(oneCpl.CliFId, oneCpl.CcoIdInvoicing, oneCpl.CcoIdDelivery);
                    currentCplCstId = oneCpl.CstId;
                    if (currentCplCstId === 2) {
                        $('.modify_right').hide();
                        $('.delete_right').hide();
                        if (!_isView) {
                            MsgPopUpWithResponse('Attention', 'Ce Devis est déjà validé, la modification n\'a plus pris en charge !', "changeViewMode('view')");
                        }
                    }
                    if (_isView && loadLine) {
                        loadAllLines();
                    }
                    if (_isView) {
                        //AddCommentForCpl();
                        CostPlanForComment();
                    }

                    if (currentCpl.CplFromSite) {
                        $('#CplName').css('color', '#0077FF');
                        $('#CplCode').css('color', '#0077FF');
                    }
                } else {
                    if (jQuery.isEmptyObject(data2Treat)) {
                        MsgPopUpWithResponse('ERREUR', 'Vous avez des droits insuffisants pour accéder à cette page.<br/>Veuillez contacter votre administrateur !', 'BackToSearch()');
                    } else {
                        // authentication error
                        AuthencationError();
                    }
                }
                removeDisabledClient(false);
            },
            error: function (data) {
                var test = '';
            }
        });
    }
}

function BackToSearch() {
    window.location = 'SearchCostPlan.aspx';
}
function setDeafaultValues() {
    if (_isCreate) {
        var now = new Date();
        var newTime = now;
        if (now.getMonth() === 11) {
            newTime = new Date(now.getFullYear() + 1, 1, now.getDate());
        } else {
            newTime = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());
        }
        $('#_dValidityString').val(dateToDMY(newTime));
        $('#_dCreationString').val(dateToDMY(now));
        setCostPlanByProject();
    }
}

// 2018-05-14
function removeDisabledClient(create) {
    if (create) {
        var id = selectedClient.Id;
        //var endabledClients = searchInArray(allclient, 'Isactive', true);
        //console.log(disabledClis);
        //$('#Client').empty();
        $('#ClientList').empty();
//        $.each(endabledClients, function (name, value) {
//            $('#Client')
//                            .append($("<option></option>")
//                                .attr("data-value", value.FId)
//                                .attr("value", value.CompanyName)
//                                .attr("actived", value.Isactive));
//        });
    } else {
        var id = selectedClient.Id;
        var endabledClients = searchInArray(allclient, 'Isactive', true);
        var sltedClient = searchFieldValueInArray(allclient, 'Id', id);
        //console.log(sltedClient);
        var checkClient = searchFieldValueInArray(endabledClients, 'Id', id);
        if (jQuery.isEmptyObject(checkClient)) {
            endabledClients.push(sltedClient);
        }
        //$('#Client').empty();
        //$('#ClientList').empty();
//        $.each(endabledClients, function (name, value) {
//            $('#Client')
//                                    .append($("<option></option>")
//                                        .attr("data-value", value.FId)
//                                        .attr("value", value.CompanyName)
//                                        .attr("actived", value.Isactive));
//        });

        //setFieldValue('ip_Client', sltedClient.CompanyName, true);
        //setFieldValue('ClientList', sltedClient.CompanyName, true);
    }
}

function setCostPlanByProject() {
    var prjId = getParameterByName('prjId');
    if (prjId && _isCreate) {
        loadProject();
    } else {
        $('#PrjName').append($("<option>Nouvelle affaire</option>").attr("value", "0"));
    }
}

function loadProject() {
    var prjId = getParameterByName('prjId');
    if (prjId) {
        var url = window.webservicePath + "/LoadProjectById";
        var datastr = "{prjId:'" + prjId + "'}";
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
                    var onePrj = data2Treat;
                    //$('#PrjName').append($("<option>Nouvelle affaire</option>").attr("value", "0"));
                    //$('#PrjName').append($("<option>" + onePrj.PrjName + "</option>").attr("value", onePrj.FId));
                    $('#PrjName').append($("<option></option>").attr("value", onePrj.FId).text(onePrj.PrjName));
                    $('#PrjName').attr('disabled', '');
                    selectedClient.Id = onePrj.CliId;
                    setFieldValue('PcoId', onePrj.PcoId);
                    setFieldValue('PmoId', onePrj.PmoId);
                    setFieldValue('VatId', onePrj.VatId);
                    setFieldValue('CplHeaderText', onePrj.PrjHeaderText);
                    setFieldValue('CplFooterText', onePrj.PrjFooterText);
                    setFieldValue('CplClientComment', onePrj.PrjClientComment);
                    setFieldValue('CplInterComment', onePrj.PrjInterComment);
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
            .text('Veuillez sélectionner un commercial'));
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
        getClientProjects(oneclient.FId);
    }
}

function GotoClient() {
    ShowPleaseWaitWithText();
    var url = '../Client/Client.aspx';
    window.location = url;
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
            $('#PrjName').append($("<option>Nouveau projet</option>").attr("value", "0"));
            if (data2Treat !== '-1') {
                allProjectForThisClient = [];
                allProjectForThisClient = data2Treat;
                $.each(data2Treat, function (name, value) {
                    if (dfvalue && dfvalue === value.FId) {
                        $('#PrjName').append($("<option>" + value.PrjName + "</option>").attr("value", value.FId).attr("selected", true));
                    } else {
                        $('#PrjName').append($("<option>" + value.PrjName + "</option>").attr("value", value.FId));
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

function projectChange(sender) {
    var selectedPrjId = $(sender).val();
    if (selectedPrjId !== 0 && selectedPrjId !== '0') {
        var onePrj = searchFieldValueInArray(allProjectForThisClient, 'FId', selectedPrjId);
        if (onePrj && onePrj.FId !== undefined) {
            setFieldValue('PcoId', onePrj.PcoId);
            setFieldValue('PmoId', onePrj.PmoId);
            setFieldValue('VatId', onePrj.VatId);
            setFieldValue('CplHeaderText', onePrj.PrjHeaderText);
            setFieldValue('CplFooterText', onePrj.PrjFooterText);
            setFieldValue('CplClientComment', onePrj.PrjClientComment);
            setFieldValue('CplInterComment', onePrj.PrjInterComment);
        } else {
            setFieldValue('CplHeaderText', '');
            setFieldValue('CplFooterText', '');
            setFieldValue('CplClientComment', '');
            setFieldValue('CplInterComment', '');
        }
    } else {
        setFieldValue('CplHeaderText', '');
        setFieldValue('CplFooterText', '');
        setFieldValue('CplClientComment', '');
        setFieldValue('CplInterComment', '');
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
                    .text('Sélectionner un commercial ou laisser vide'));
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
    //    var ccoAddress1 = (inv ? 'Inv_' : 'Dlv_') + 'CcoAddress1';
    //    var ccoAddress2 = (inv ? 'Inv_' : 'Dlv_') + 'CcoAddress2';
    //    var ccoPostcode = (inv ? 'Inv_' : 'Dlv_') + 'CcoPostcode';
    //    var ccoCity = (inv ? 'Inv_ip_' : 'Dlv_ip_') + 'CcoCity';
    //    var ccoCountry = (inv ? 'Inv_' : 'Dlv_') + 'CcoCountry';
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

function js_create_update_costplan() {
    var checkOK = CheckRequiredFieldInOneDiv('content') && (seltectedClientId !== 0);
    if (checkOK) {
        var aCostPlan = Object();
        aCostPlan.ClientCompanyName = $('#ClientList').val();
        aCostPlan.FId = getUrlVars()['cplId'];
        if (_isCreate) {
            aCostPlan.FId = "";
        }
        aCostPlan.PrjFId = $('#PrjName').val();
        aCostPlan.VatId = $('#VatId').val();
        aCostPlan.CplName = $('#CplName').val();
        aCostPlan.CliId = seltectedClientId;//selectedClient.Id !== undefined ? (selectedClient.Id * 1) : 0;
        aCostPlan.PcoId = $('#PcoId').val();
        aCostPlan.PmoId = $('#PmoId').val();
        aCostPlan.CplHeaderText = $('#CplHeaderText').val();
        aCostPlan.CplFooterText = $('#CplFooterText').val();
        aCostPlan._dCreationString = $('#_dCreationString').val();
        aCostPlan._dUpdateString = $('#_dUpdateString').val();
        aCostPlan._dValidityString = $('#_dValidityString').val();
        aCostPlan._dPreDeliveryString = $('#_dPreDeliveryString').val();
        aCostPlan.CplClientComment = $('#CplClientComment').val();
        aCostPlan.CplInterComment = $('#CplInterComment').val();
        // cco invoicing
        aCostPlan.CcoIdInvoicing = $('#Inv_CcoAdresseTitle  option:selected').val();
        aCostPlan.Inv_CcoFirstname = $('#Inv_CcoFirstname').val();
        aCostPlan.Inv_CcoLastname = $('#Inv_CcoLastname').val();
        aCostPlan.Inv_CcoRef = $('#Inv_CcoRef').val();
        aCostPlan.Inv_CcoAddress1 = $('#Inv_CcoAddress1').val();
        aCostPlan.Inv_CcoAddress2 = $('#Inv_CcoAddress2').val();
        aCostPlan.Inv_CcoPostcode = $('#Inv_CcoPostcode').val();
        aCostPlan.Inv_CcoCity = $('#Inv_ip_CcoCity').val();
        aCostPlan.Inv_CcoCountry = $('#Inv_CcoCountry').val();
        aCostPlan.Inv_CcoTel1 = $('#Inv_CcoTel1').val();
        aCostPlan.Inv_CcoFax = $('#Inv_CcoFax').val();
        aCostPlan.Inv_CcoCellphone = $('#Inv_CcoCellphone').val();
        aCostPlan.Inv_CcoEmail = $('#Inv_CcoEmail').val();
        // cco delivery
        aCostPlan.CcoIdDelivery = $('#Dlv_CcoAdresseTitle  option:selected').val();
        aCostPlan.Dlv_CcoFirstname = $('#Dlv_CcoFirstname').val();
        aCostPlan.Dlv_CcoLastname = $('#Dlv_CcoLastname').val();
        aCostPlan.Dlv_CcoRef = $('#Dlv_CcoRef').val();
        aCostPlan.Dlv_CcoAddress1 = $('#Dlv_CcoAddress1').val();
        aCostPlan.Dlv_CcoAddress2 = $('#Dlv_CcoAddress2').val();
        aCostPlan.Dlv_CcoPostcode = $('#Dlv_CcoPostcode').val();
        aCostPlan.Dlv_CcoCity = $('#Dlv_ip_CcoCity').val();
        aCostPlan.Dlv_CcoCountry = $('#Dlv_CcoCountry').val();
        aCostPlan.Dlv_CcoTel1 = $('#Dlv_CcoTel1').val();
        aCostPlan.Dlv_CcoFax = $('#Dlv_CcoFax').val();
        aCostPlan.Dlv_CcoCellphone = $('#Dlv_CcoCellphone').val();
        aCostPlan.Dlv_CcoEmail = $('#Dlv_CcoEmail').val();
        aCostPlan.CstId = $('#CstId').val();
        aCostPlan.UsrCom1 = $('#UsrCom1 option:selected').val() * 1;
        aCostPlan.UsrCom2 = $('#UsrCom2 option:selected').val() * 1;
        aCostPlan.UsrCom3 = $('#UsrCom3 option:selected').val() * 1;
        aCostPlan.CplKeyProject = $('#CplKeyProject').is(':checked');
        if (aCostPlan.CstId === null) {
            aCostPlan.CstId = 1;
        }

        var jsondata = JSON.stringify({ oneCostPlan: aCostPlan });

        myApp.showPleaseWait();
        $.ajax({
            url: 'CostPlan.aspx/CreateUpdateCostPlan',
            type: 'POST',
            contentType: 'application/json; charset=utf-8',
            data: jsondata,
            dataType: 'json',
            success: function (data) {
                var cplId = data.d;
                var url = 'CostPlan.aspx';
                var newUrl = url + '?cplId=' + cplId + '&mode=view';
                document.location.href = newUrl;
            },
            error: function (data) {
                myApp.hidePleaseWait();
            }
        });
    } else {
        alert('Veuillez sélectionner un client');
    }
    return false;
}

function ExternLinkClick(sender) {
    if (_isView && currentCpl) {
        ExternLinkBaseClick(sender, currentCpl);
        //        var page = $(sender).attr('pgid');
        //        var flid = $(sender).attr('flid');
        //        var par = $(sender).attr('prms');
        //        var etid = $(sender).attr('etid');
        //        var id = currentCpl[etid];
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
        $("#lb_Project").addClass("animated_menu");
        $("#lb_Project").prop('title', 'Cliquer pour consulter le projet');
        $('#lb_Project').css('cursor', 'pointer');
    }
}

function downloadPdf(sender) {
    var cplId = getUrlVars()['cplId'];
    // Create an IFRAME.
    //    var iframe = document.createElement("iframe");
    //    // Point the IFRAME to GenerateFile
    //    var url = "../Common/PageDownLoad.aspx?cplId=" + cplId;
    //    iframe.src = url;
    //    iframe.style.display = "none";
    //    document.body.appendChild(iframe);


    cplId = encodeURIComponent(cplId);
    window.open('../Common/PageDownLoad.aspx?cplId=' + cplId, '_blank');
    return false;
}

function AddModifyDiscount() {
    var cplId = getUrlVars()['cplId'];
    if (cplId) {
        var url = window.webservicePath + "/GetCostPlanInfo";
        var datastr = "{cplId:'" + cplId + "'}";
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
    var CplId = cplInfo.CplId;
    var FId = cplInfo.FId;
    var CplDiscountPercentage = cplInfo.CplDiscountPercentage;
    var CplDiscountAmount = cplInfo.CplDiscountAmount;
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
            "<div class='col-sm-2'><div class='input-group'><input type='number' step='0.01' class='form-control' id='CplDiscountPercentage' name='CplDiscountPercentage' value='" + CplDiscountPercentage + "' onkeyup='calculateDiscount(this)' /><span class='input-group-addon'>%</span></div></div>" +
            "<label class='col-sm-2 control-label sale'>Montant de remise</label>" +
            "<div class='col-sm-2 sale'><input type='number' step='0.01' class='form-control' id='CplDiscountAmount' name='CplDiscountAmount' value='" + CplDiscountAmount + "' onkeyup='calculateDiscount(this)' /></div>" +
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

function calculateDiscount(sender) {
    var id = $(sender).attr('id');
    var thisval = $(sender).val();
    var disPercent = 0;
    var disAmount = 0;
    var totalsale = $('#TotalSalePrice').val() * 1;
    var totalPurcharse = $('#TotalPurchasePrice').val() * 1;
    if (id === 'CplDiscountPercentage') {
        disPercent = thisval;
        disAmount = disPercent * 0.01 * totalsale;
        disAmount = disAmount.toFixed(2);
        $('#CplDiscountAmount').val(disAmount);
    } else {
        disAmount = thisval;
        disPercent = (disAmount * 100 / (totalsale === 0 ? 1 : totalsale)).toFixed(2);
        $('#CplDiscountPercentage').val(disPercent);
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
    var cplId = getUrlVars()['cplId'];
    if (cplId) {
        var disAmount = $('#CplDiscountAmount').val();
        var disPercent = $('#CplDiscountPercentage').val();
        var url = window.webservicePath + "/AddUpdateDiscount";
        var datastr = "{cplId:'" + cplId + "',discountPercentage:" + disPercent + ",discountAmount:'" + disAmount + "'}";
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
                    LoadCostPlan();
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

function duplicateCostplan() {
    var cplId = getUrlVars()['cplId'];
    if (cplId) {
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
                "<div class='col-sm-12' style='text-align:center;font-size: 18pt;'>Voulez-vous dupliquer le devis vers une nouvelle affaire ?</div>" +
                "</div>" +
        // close box
                "</div></div></div></div></div><div class='modal-footer center'>";
        var btnDuplicate = "<button class='btn btn-inverse' onclick='return duplicationCostPlanClick(true)'><span>Même Affaire</span></button>" +
            "<button class='btn btn-inverse' onclick='return duplicationCostPlanClick(false)'><span>Nouvelle Affaire</span></button>";
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

function duplicationCostPlanClick(sameProject) {
    var cplId = getUrlVars()['cplId'];
    var url = window.webservicePath + "/DuplicateCostPlan";
    var params = "{cplId : '" + cplId + "',sameProject:" + sameProject + "}";
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
                var url = 'CostPlan.aspx';
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

function ValiderCostPlanClick() {
    var title = "CONFIRMER";
    var content = "<div class='box'><div class='box-body' style='height: 100px;'>" +
        "<div class='form-horizontal'>" +
        "<div class='col-md-12'>" +
        "<div class='form-group'>" +
        "<div class='col-sm-12' style='text-align:center;font-size: 18pt;'>Veuillez confirmer. Si vous confirmez, le devis n\'est pas modifiables !</div></div></div></div></div></div>"
        + "<div class='modal-footer center'>" +
        "<button type='button' class='btn btn-default' onclick='closeDialog()'>Annuler</button>" +
        "<button type='button' class='btn btn-inverse' onclick='ValiderCostPlan()'>Valider</button>" +
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

function ValiderCostPlan() {
    var cplId = getUrlVars()['cplId'];
    if (cplId) {
        var url = window.webservicePath + "/PassCostPlan2ClientOrder";
        var datastr = "{cplId:'" + cplId + "'}";
        myApp.showPleaseWait();
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
                    if (data2Treat !== '0' && data2Treat !== 0 && data2Treat !== "0") {
                        window.location = '../ClientOrder/ClientOrder.aspx?codId=' + data2Treat + '&mode=view';
                    } else {
                        myApp.hidePleaseWait();
                        MsgErrorPopUp('Erreur', 'Ce Devis est déjà validé, la validation n\'est pas effecturée');
                    }
                } else {
                    myApp.hidePleaseWait();
                    // authentication error
                    AuthencationError();
                }
            },
            error: function (data) {
                myApp.hidePleaseWait();
                var test = '';
            }
        });

    }
}

function delete_costplan_click_confirm() {
    var content = "<div class='box'><div class='box-body' style='height: 100px;'>" +
        "<div class='form-horizontal'>" +
        "<div class='col-md-12'>" +
        "<div class='form-group'>" +
        "<div class='col-sm-12' style='text-align:center;font-size: 18pt;'>La suppression est irrécupérable, veuillez confirmer !!!</div></div></div></div></div></div>"
        + "<div class='modal-footer center'>" +
        "<button type='button' class='btn btn-default' onclick='closeDialog()'>Annuler</button>" +
        "<button type='button' class='btn btn-inverse' onclick='return DeleteCostPlan()'>Supprimer</button></div>";
    bootbox.dialog({
        title: 'CONFIRMER',
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

function DeleteCostPlan() {
    var cplId = getUrlVars()['cplId'];
    myApp.showPleaseWait();
    if (cplId) {
        var url = window.webservicePath + "/DeleteCostPlan";
        var datastr = "{cplId:'" + cplId + "'}";
        $.ajax({
            type: "POST",
            url: url,
            contentType: "application/json; charset=utf-8",
            data: datastr,
            dataType: "json",
            success: function (data) {
                var jsdata = data.d;
                if (jsdata !== -1) {
                    if (jsdata === 0) {
                        myApp.hidePleaseWait();
                        MsgErrorPopUp('ERREUR', 'Le devis est utilisé, la suppression n\'est pas effecturée!');
                    }
                    else if (jsdata === 1) {
                        window.location = 'SearchCostPlan.aspx';
                        myApp.hidePleaseWait();
                    }
                } else {
                    // authentication error
                    myApp.hidePleaseWait();
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

function sendPdf() {
    var cplId = getUrlVars()['cplId'];
    if (cplId) {
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
                "<div class='col-sm-12' style='text-align:center;font-size: 18pt;'>Voulez-vous envoyer ce DEVIS ?</div>" +
                "<div class='form-group'>" +
                "<label class='col-sm-2 control-label'>Email : </label>" +
                "<div class='col-sm-9'><input class='form-control' id='mailDestination' name='mailDestination' required/></div>" +
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
        var title = 'ENVOYER LE DEVIS';
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
        var content = "Madame, Monsieur, \r\nVoici notre offre de prix concernant votre demande. \r\n\r\n" + headerFooterText.CostPlanFooter;
        $('#mailMsg').text(content);
    }
    return false;
}

function sendPdfClick() {
    var tos = $('#mailDestination').val();
    var body = $('#mailMsg').text();
    var oneEmail = {};
    oneEmail.Tos = tos;
    oneEmail.Body = body;
    oneEmail.FId = getUrlVars()['cplId'];
    var jsondata = JSON.stringify({ oneEmail: oneEmail });

    var url = window.webservicePath + "/SendEmail";
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

function get_status() {
    var url = window.webservicePath + "/GetCplStatus";
    var budgetId = '#CstId';
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
                        .append($("<option></option>").attr("value", value.Key).text(value.Value));
                });

                setClientByPrjId();
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


function ModifyCommercial() {
    var cplId = getParameterByName('cplId');
    if (cplId && !jQuery.isEmptyObject(currentCpl)) {
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
            "<label class='col-sm-4 control-label'>Commercial 1</label>" +
            "<div class='col-sm-8'><select id='MdfUsrCom1' class='form-control'></select></div>" +
            "</div>" +
            "<div class='form-group'>" +
            "<label class='col-sm-4 control-label'>Commercial 2</label>" +
            "<div class='col-sm-8'><select id='MdfUsrCom2' class='form-control'></select></div>" +
            "</div>" +
            "<div class='form-group'>" +
            "<label class='col-sm-4 control-label'>Commercial 3</label>" +
            "<div class='col-sm-8'><select id='MdfUsrCom3' class='form-control'></select></div>" +
            "</div>" +
        // close box
            "</div></div></div></div></div>";

        var btnAddUpdate = "<button class='btn btn-inverse' id='btn_add_update_discount' name='btn_add_update_discount' onclick='return ChangeCommercial()'><span>Sauvegarder</span></button>";
        var btnClose = "<button class='btn btn-default bootbox-close-button' onclick='return false'><span>Annuler</span></button>";

        var btns = "<div class='modal-body center'>" + btnClose + btnAddUpdate + "</div>";
        var onecontent = startBox + onelineContent + btns + endBox;

        var title = 'Commercial';
        bootbox.dialog({
            title: title,
            message: onecontent
        })
        //        .find('.modal-dialog').css({
        //            'width': '30%'
        //        })
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


        $('#MdfUsrCom1').empty();
        $('#MdfUsrCom2').empty();
        $('#MdfUsrCom3').empty();
        $('#MdfUsrCom1').append($("<option>Sélectionner un commercial</option>").attr("value", "0"));
        $('#MdfUsrCom2').append($("<option>Sélectionner un commercial</option>").attr("value", "0"));
        $('#MdfUsrCom3').append($("<option>Sélectionner un commercial</option>").attr("value", "0"));
        $.each(allCommercials, function (order, oneCom) {
            $('#MdfUsrCom1').append($("<option>" + oneCom.FullName + "</option>").attr("value", oneCom.Id));
            $('#MdfUsrCom2').append($("<option>" + oneCom.FullName + "</option>").attr("value", oneCom.Id));
            $('#MdfUsrCom3').append($("<option>" + oneCom.FullName + "</option>").attr("value", oneCom.Id));
        });
        $('#MdfUsrCom1').val(jQuery.isNumeric(currentCpl.UsrCom1) ? currentCpl.UsrCom1 : 0);
        $('#MdfUsrCom2').val(jQuery.isNumeric(currentCpl.UsrCom2) ? currentCpl.UsrCom2 : 0);
        $('#MdfUsrCom3').val(jQuery.isNumeric(currentCpl.UsrCom3) ? currentCpl.UsrCom3 : 0);
    }
    return false;
}

function ChangeCommercial() {
    var usrcom1 = $('#MdfUsrCom1').val() * 1;
    var usrcom2 = $('#MdfUsrCom2').val() * 1;
    var usrcom3 = $('#MdfUsrCom3').val() * 1;
    // if changed
    if (usrcom1 !== currentCpl.UsrCom1 || usrcom2 !== currentCpl.UsrCom2 || usrcom3 !== currentCpl.UsrCom3) {
        var url = window.webservicePath + "/UpdateCostPlanCommercial";
        var cplId = getParameterByName('cplId');
        var datastr = "{cplId:'" + cplId + "',com1:" + usrcom1 + ",com2:" + usrcom2 + ",com3:" + usrcom3 + "}";
        $.ajax({
            type: "POST",
            url: url,
            contentType: "application/json; charset=utf-8",
            data: datastr,
            dataType: "json",
            success: function (data) {
                LoadCostPlan();
                closeDialog();
            },
            error: function (data) {
                var test = '';
            }
        });
    } else {
        closeDialog();
    }
    return false;
}

function AddFlagClick() {
    var onecontent = "";
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
            "<div class='col-sm-4 center'><button type='button' class='btn btn-danger' onclick='return AddFlagForCpl(this)'><i class='fa fa-star'></i></button></div>" +
            "<div class='col-sm-4 center'><button type='button' class='btn btn-purple' onclick='return AddFlagForCpl(this)'><i class='fa fa-star'></i></button></div>" +
            "<div class='col-sm-4 center'><button type='button' class='btn btn-pink' onclick='return AddFlagForCpl(this)'><i class='fa fa-star'></i></button></div>" +
            "</div>" +
            "<div class='form-group'>" +
            "<div class='col-sm-4 center'><button type='button' class='btn btn-yellow' onclick='return AddFlagForCpl(this)'><i class='fa fa-star'></i></button></div>" +
            "<div class='col-sm-4 center'><button type='button' class='btn btn-info' onclick='return AddFlagForCpl(this)'><i class='fa fa-star'></i></button></div>" +
            "<div class='col-sm-4 center'><button type='button' class='btn btn-primary' onclick='return AddFlagForCpl(this)'><i class='fa fa-star'></i></button></div>" +
            "</div>" +
            "<div class='form-group'>" +
            "<div class='col-sm-4 center'><button type='button' class='btn btn-success' onclick='return AddFlagForCpl(this)'><i class='fa fa-star'></i></button></div>" +
            "<div class='col-sm-4 center'><button type='button' class='btn btn-file' onclick='return AddFlagForCpl(this)'><i class='fa fa-star'></i></button></div>" +
            "<div class='col-sm-4 center'><button type='button' class='btn btn-inverse' onclick='return AddFlagForCpl(this)'><i class='fa fa-star'></i></button></div>" +
            "</div>" +
    // close box
            "</div></div></div></div></div>";
    var removeBtn = "<div class='form-group center'><button type='button' class='btn btn-default' onclick='return closeDialog()'>Clôturer</button><button type='button' class='btn btn-inverse' remove='remove' onclick='return AddFlagForCpl(this)'>Enlever le drapeau</button></div>";
    onecontent = startBox + onelineContent + removeBtn + endBox;

    var title = 'DRAPEAU';
    bootbox.dialog({
        title: title,
        message: onecontent
    })
    //    .find('.modal-dialog').css({
    //        'width': '70%'
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
    return false;
}

function AddFlagForCpl(sender) {
    var btnclass = $(sender).attr('class');
    btnclass = replaceAll(btnclass, 'btn', '');
    btnclass = replaceAll(btnclass, '-', '');
    btnclass = replaceAll(btnclass, ' ', '');
    var remove = $(sender).attr('remove') === 'remove';
    var cplId = getParameterByName('cplId');
    if (cplId) {
        var datastr = "{cplId:'" + cplId + "', flag:'" + btnclass + "', delete:" + remove + "}";
        var url = window.webservicePath + "/CreateUpdateCplUserFlag";
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
                    if (data2Treat !== null) {
                        var flagBtn = "<button class='btn btn-" + data2Treat.Comment + "' type='button' id='btn_user_flag' onclick='return CreateUpdateCommentClick()'><i class='fa fa-star'></i></button>";
                        $('#div_for_flag').empty();
                        $('#div_for_flag').append(flagBtn);
                        AddCommentForCpl();
                    } else {
                        $('#div_for_flag').empty();
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

function AddCommentForCpl() {
    var btn_user_flag = $('#btn_user_flag');
    if (!jQuery.isEmptyObject(btn_user_flag)) {
        var btnclass = btn_user_flag.attr('class');
        var usercomment = (!jQuery.isEmptyObject(currentCpl) && currentCpl.UserComment !== null) ? currentCpl.UserComment : "";
        var commentBtn = usercomment !== "" ? "<button class='" + btnclass + "' type='button' onclick='return CreateUpdateCommentClick()'>" + usercomment + "</button>" : "";
        $('#div_for_flag').append(commentBtn);
    }
}


function CostPlanForComment() {
    if (!jQuery.isEmptyObject(currentCpl) && currentCpl.LoginMode === 1 && _isView) {
        var btn_flag_button = $('#btn_flag_button');
        if (!btn_flag_button.attr('id')) {
            var addbtnComment = "<button type='button' class='btn btn-inverse' onclick='return AddFlagClick()' id='btn_flag_button'>Drapeau</button>";
            $('#div_btns').append(addbtnComment);
        }
        LoadCplFlag();
    }
}

function LoadCplFlag() {
    var cplId = getParameterByName('cplId');
    if (cplId) {
        var datastr = "{cplId:'" + cplId + "'}";
        var url = window.webservicePath + "/GetUserCplFlag";
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
                    if (data2Treat !== null) {
                        var flagBtn = "<button class='btn btn-" + data2Treat.Comment + "' type='button' onclick='return CreateUpdateCommentClick()' id='btn_user_flag'><i class='fa fa-star'></i></button>";
                        $('#div_for_flag').empty();
                        $('#div_for_flag').append(flagBtn);
                        AddCommentForCpl();
                    } else {
                        $('#div_for_flag').empty();
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


function CreateUpdateCommentClick() {
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
            "<div class='col-sm-12'><textarea  class='form-control' id='cplUserComment' cols='3' rows='6' ></textarea></div>" +
            "</div>" +
    // close box
            "</div></div></div></div></div>";
    var removeBtn = "<div class='form-group center'>" +
        "<button type='button' class='btn btn-default' onclick='return closeDialog()'>Clôturer</button>" +
        "<button type='button' class='btn btn-inverse' onclick='return CreateUpdateComment(this)'>Mettre à jour</button></div>";
    var onecontent = startBox + onelineContent + removeBtn + endBox;

    var title = 'Commentaire';
    bootbox.dialog({
        title: title,
        message: onecontent
    })
    //    .find('.modal-dialog').css({
    //        'width': '70%'
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

    if (!jQuery.isEmptyObject(currentCpl) && currentCpl.UserComment !== null) {
        $('#cplUserComment').text(currentCpl.UserComment);
    }
    return false;
}


function CreateUpdateComment() {
    var cplId = getParameterByName('cplId');
    var comment = $('#cplUserComment').val();
    if (cplId) {
        var datastr = "{cplId:'" + cplId + "', comment:'" + comment + "', delete:false}";
        var url = window.webservicePath + "/CreateUpdateCplUserComment";
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
                    LoadCostPlan();
                    closeDialog();
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
            //var oneclient = data;
//            $('#VatId').val(selectedClient.VatId);
//            $('#PcoId').val(selectedClient.PcoId);
//            $('#PmoId').val(selectedClient.PmoId);
            selectedClient = data;
            setConditions(selectedClient);
            js_getCcoByClient(selectedClient.FId);
            getClientProjects(selectedClient.FId);
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
//function js_clientChange(sender) {
//    var clientCompany = $(sender).val();
//    var oneclient = searchFieldValueInArray(allclient, 'CompanyName', clientCompany);
//    if (oneclient && oneclient.Id !== undefined) {
//        selectedClient = oneclient;
//        setConditions(selectedClient);
//        js_getCcoByClient(oneclient.FId);
//        getClientProjects(oneclient.FId);
//        // 20210309
//        if (IsCreate() || IsModify()) {
//            setDefautCommercial(selectedClient);
//        }
//    }
//    //alert(clientCompany);
//}

function js_clientChange(sender) {
    var value = $(sender).val().trim();
    if (IsNullOrEmpty(value)) {
        seltectedClientId = 0;
    }
    return false;
}