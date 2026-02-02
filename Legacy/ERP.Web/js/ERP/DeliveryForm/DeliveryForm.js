$(document).ready(init);

var deliverFormDeliveried = false;

function init() {
    ShowPleaseWait();
    var codId = getUrlVars()['codId'];
    var dfoId = getUrlVars()['dfoId'];
    if (dfoId) {
        // update, view
        LoadDeliveryForm();
    } else {
        // create
        if (codId) {
            // load client order to treate
            LoadClientOrder();
        } else {
            // get all client order to treate
            GetClientWithClientOrderLineNoDeliveried();
        }
    }
    $.each($('.datepicker'), function(idx, value) {
        $(value).datepicker();
    });
    initMode();
    if (_isCreate) {
        $('#_DfoDDelivery').val(getToday());
        $('#_dCreationString').val(getToday());
    } else {
        getCurrentSoc();
    }

    SetLanguageBar();
}

var clientOrder2Treate = [];

function GetClientWithClientOrderLineNoDeliveried() {
    ShowPleaseWait();
    $('#DfoClientAdr').prop('checked', true);
    var url = window.webservicePath + '/GetClientWithClientOrderLineNoDeliveried';
    $.ajax({
        type: "POST",
        url: url,
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        success: function (data) {
            var jsdata = data.d;
            var data2Treat = jQuery.parseJSON(jsdata);
            if (data2Treat !== '-1') {
                clientOrder2Treate = [];
                if (data2Treat.length > 0) {
                    $.each(data2Treat, function(name, value) {
                        $('#clientList').append($("<option></option>").attr("value", value.CliId).attr("data-value", value.CliFId).text(value.ClientCompanyName));
                        $.each(value.ClientOrderList, function(index, oneOrder) {
                            clientOrder2Treate.push(oneOrder);
                        });

                    });
                    $('#clientList').change();
                    $('#CodName').change();
                } else {
                $('#clientList').append($("<option></option>").attr("value", "0").attr("data-value", "0").text("Toutes les commandes sont livrées !"));
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
        }
    });
}

var selectedClient = [];
var currentCod = [];
var CcoListForDfo = [];
function LoadClientOrder() {
    var codId = getUrlVars()['codId'];
    var epadr = getUrlVars()['epadr'];
    CcoListForDfo = [];
    if (codId) {
        var url = window.webservicePath + "/LoadClientOrder";
        var datastr = "{codId:'" + codId + "'}";
        $.ajax({
            type: "POST",
            url: url,
            contentType: "application/json; charset=utf-8",
            data: datastr,
            dataType: "json",
            success: function(data) {
                var jsdata = data.d;
                var data2Treat = jQuery.parseJSON(jsdata);
                if (data2Treat !== '-1') {
                    var oneCod = data2Treat;
                    currentCod = [];
                    currentCod = oneCod;
                    // set date 
                    var date = new Date();
                    var year = date.getFullYear();
                    var month = ("0" + (date.getMonth() + 1)).slice(-2);
                    var day = ("0" + date.getDate()).slice(-2);
                    var formattedNow = day + "/" + month + "/" + year;
                    $('#_DfoDDelivery').val(formattedNow);
                    var companyname = oneCod.ClientCompanyName + (IsNullOrEmpty(oneCod.CliAbbr) ? "" : ("-" + oneCod.CliAbbr));
                    $('#clientList').append($("<option></option>").attr("data-value", oneCod.CliFId).text(companyname));
                    $('#CodName').append($("<option></option>").attr("data-value", oneCod.FId).text(oneCod.CodName));
                    $('#CodCode').val(oneCod.CodCode);
                    $('#clientList').attr('disabled', '');
                    $('#CodName').attr('disabled', '');
                    $('#CodCode').attr('disabled', '');
                    $('#PrjName').val(oneCod.PrjName);
                    $('#DfoHeaderText').text(oneCod.CodHeaderText);
                    $('#DfoFooterText').text(oneCod.CodFooterText);
                    $('#DfoDeliveryComment').text(oneCod.CodClientComment);
                    $('#DfoInterComment').text(oneCod.CodInterComment);

                    //                    setClickableLabel();
                    //                    getClientCostPlanInProgress(oneCod.CliId, oneCod.CplFId);
                    if (epadr !== '1') {
                        js_getCcoByClient(oneCod.CliFId, oneCod.CcoIdDelivery);
                    } else {
                     $('#Dlv_CcoAdresseTitle').append($("<option></option>").attr("value", '0').attr("selected", true).text('ADRESSE VIDE'));
                        $('#Dlv_CcoAdresseTitle').prop('disabled', true);
                    }
                    selectedClient = oneCod.OneClient; 
                    
                    $('#DfoClientAdr').prop('checked', true);
                    CreateModeSetAdr();
                    CcoListForDfo = oneCod.CcoListForDfo;
                    if (oneCod.CcoListForDfo != null && oneCod.CcoListForDfo.length > 0) {
                        $('#CcoId').append($("<option></option>")
                                .attr("data-value", 0)
                                .attr("value", 0)
                                .text('Veuillez sélectionner un contact'));
                        $.each(oneCod.CcoListForDfo, function (name, value) {
                            $('#CcoId')
                                .append($("<option></option>")
                                    .attr("data-value", value.CcoId)
                                    .attr("value", value.CcoId)
                                    .text(value.CcoAdresseTitle + ' [' + value.CcoFirstname + ' ' + value.CcoLastname + ']'));
                        });
                    }
                    HidePleaseWait();
                    //console.log(oneCod.CcoListForDfo);
                } else {
                    // authentication error
                    AuthencationError();
                    HidePleaseWait();
                }
            },
            error: function(data) {
                var test = '';
                HidePleaseWait();
            }
        });

    }
}

var ccoDelivery = [];
function js_getCcoByClient(cliId, ccoDlvId) {
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
                ccoDelivery = [];
                $.each(data2Treat, function (name, value) {
                    if (value.CcoIsDeliveryAdr) {
                        ccoDelivery.push(value);
                    }
                });
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

function ccoChange(sender) {
    var inv = false;
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
            var ccoCity = (inv ? 'Inv_ip_' : 'Dlv_ip_') + 'CcoCity';
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

function js_create_update_deliver_form() {
    var checkOK = CheckRequiredFieldInOneDiv('content');
    if (checkOK) {
        ShowPleaseWait();
        var aClientOrder = Object();
        var codId = getUrlVars()['codId'];
        var dfoId = getUrlVars()['dfoId'];
        aClientOrder.FId = dfoId;
        if (codId) {
            aClientOrder.CodFId = codId;
        } else {
            aClientOrder.CodFId = $('#CodName option:selected').attr('data-value');
        }
        aClientOrder.CliFId = $('#clientList option:selected').attr('data-value');
        aClientOrder.DfoHeaderText = $('#DfoHeaderText').val();
        aClientOrder.DfoFooterText = $('#DfoFooterText').val();
        aClientOrder._DfoDDelivery = $('#_DfoDDelivery').val();
        aClientOrder.DfoDeliveried = $('#DfoDeliveried').is(':checked');
        aClientOrder.DfoDeliveryComment = $('#DfoDeliveryComment').val();
        aClientOrder.DfoInterComment = $('#DfoInterComment').val();
        aClientOrder.DfoHeaderText = $('#DfoHeaderText').val();
        aClientOrder.DfoFooterText = $('#DfoFooterText').val();

        // cco delivery
        //aClientOrder.CcoIdDelivery = $('#Dlv_CcoAdresseTitle  option:selected').val();
        aClientOrder.DfoClientAdr = $('#DfoClientAdr').is(':checked');
        aClientOrder.Dlv_CcoFirstname = $('#Dlv_CcoFirstname').val();
        aClientOrder.Dlv_CcoLastname = $('#Dlv_CcoLastname').val();
        //aClientOrder.Dlv_CcoRef = $('#Dlv_CcoRef').val();
        aClientOrder.Dlv_CcoAddress1 = $('#Dlv_CcoAddress1').val();
        aClientOrder.Dlv_CcoAddress2 = $('#Dlv_CcoAddress2').val();
        aClientOrder.Dlv_CcoPostcode = $('#Dlv_CcoPostcode').val();
        aClientOrder.Dlv_CcoCity = $('#Dlv_ip_CcoCity').val();
        aClientOrder.Dlv_CcoCountry = $('#Dlv_CcoCountry').val();
        aClientOrder.Dlv_CcoTel1 = $('#Dlv_CcoTel1').val();
        aClientOrder.Dlv_CcoFax = $('#Dlv_CcoFax').val();
        aClientOrder.Dlv_CcoCellphone = $('#Dlv_CcoCellphone').val();
        aClientOrder.Dlv_CcoEmail = $('#Dlv_CcoEmail').val();
        aClientOrder.DfoDCreation = getCreationDate($('#_dCreationString').val());

        var jsondata = JSON.stringify({ oneDeliveryForm: aClientOrder });
        $.ajax({
            url: 'DeliveryForm.aspx/CreateUpdateDeliveryForm',
            type: 'POST',
            contentType: 'application/json; charset=utf-8',
            data: jsondata,
            dataType: 'json',
            success: function (data) {
                var dfoId = data.d;
                var url = 'DeliveryForm.aspx';
                var newUrl = url + '?dfoId=' + dfoId + '&mode=view';
                document.location.href = newUrl;
            },
            error: function (data) {
            }
        });
    }
    return false;
}

var clientOrder2Display = [];
function ClientChanged(sender) {
    var cliId = $('#clientList option:selected').attr('value') * 1;
    var cliFId = $('#clientList option:selected').attr('data-value');
    //js_getCcoByClient(cliFId, oneCod.CcoIdDelivery);
    //alert(cliFid);
    var clientorders = searchInArray(clientOrder2Treate, 'CliId', cliId);
    clientOrder2Display = [];
    clientOrder2Display = clientorders;
    $('#CodName').empty();
    $.each(clientOrder2Display, function (name, value) {
        $('#CodName').append($("<option></option>").attr("value", value.CodId).attr("data-value", value.FId).text(value.CodName));
    });
    $('#CodName').change();
}

function ClientOrderChange(sender) {
    var codId = $(sender).val() * 1;
    var clientOrder = searchFieldValueInArray(clientOrder2Display, 'CodId', codId);
    if (clientOrder) {
        $('#CodCode').val(clientOrder.CodCode);
        $('#PrjName').val(clientOrder.PrjName);
        js_getCcoByClient(clientOrder.CliFId, clientOrder.CcoIdDelivery);
        selectedClient = clientOrder.OneClient;
        CreateModeSetAdr();
    }
}

var currentDfo = [];

function LoadDeliveryForm() {
    CcoListForDfo = [];
    var dfoId = getUrlVars()['dfoId'];
    if (dfoId) {
        var url = window.webservicePath + "/LoadDeliveryForm";
        var datastr = "{dfoId:'" + dfoId + "'}";
        $.ajax({
            type: "POST",
            url: url,
            contentType: "application/json; charset=utf-8",
            data: datastr,
            dataType: "json",
            success: function(data) {
                var jsdata = data.d;
                var data2Treat = jQuery.parseJSON(jsdata);
                if (data2Treat !== '-1' && !jQuery.isEmptyObject(data2Treat)) {
                    currentDfo = [];
                    currentDfo = data2Treat;
                    deliverFormDeliveried = currentDfo.DfoDeliveried || currentDfo.HasClientInvoice;
                    //if (currentDfo.HasClientInvoice || currentDfo.CodInvoiced) {
                    // 2018-12-16 只要该dfo没有invoice就可以新建invoice
                    selectedClient = currentDfo.OneClient; 
                    if (currentDfo.HasClientInvoice) {
                        $('#btn_create_client_invoice').hide();
                        $('#btn_create_cin_check_invoice').hide();
                        $('#btn_create_cin_false').show();
                        $('#btn_delete_dfo').hide();
                        $('#btn_modify').hide();
                    } else {
                        //if (pageUserRight.RitValid) {

                        if (currentDfo.HasDfl && !currentDfo.HasClientInvoice) {
                            $('#btn_create_cin_check_invoice').show();
                            $('#btn_create_cin_false').hide();
                        } else {
                            $('#btn_create_cin_check_invoice').hide();
                            $('#btn_create_cin_false').show();
                        }

//                        if (currentDfo.CodAllDeliveried) {
//                            $('#btn_create_client_invoice').show();
//                            $('#btn_create_cin_false').hide();
//                        } else {
//                            $('#btn_create_cin_false').show();
//                            $('#btn_create_client_invoice').hide();
//                        }
                        //}
                    }
                    if (deliverFormDeliveried || currentDfo.HasClientInvoice) {
                        $('.thDeliveryButton').hide();
                    } else {
                        $('.thDeliveryButton').show();
                    }

                    if (currentDfo.HasClientInvoice) {
                        $('.prjMenu').show();
                    } else {
                       $('.prjMenu').hide();
                    }
                    setClickableLabel();
                    setDeliveryFormField();
                    js_getCcoByClient(currentDfo.CliFId, currentDfo.CcoIdDelivery);

                    CcoListForDfo = currentDfo.CcoListForDfo;
                    if (currentDfo.CcoListForDfo != null && currentDfo.CcoListForDfo.length > 0) {
                        $('#CcoId').append($("<option></option>")
                            .attr("data-value", 0)
                            .attr("value", 0)
                            .text('Veuillez sélectionner un contact'));
                        $.each(currentDfo.CcoListForDfo, function (name, value) {
                            $('#CcoId')
                                .append($("<option></option>")
                                    .attr("data-value", value.CcoId)
                                    .attr("value", value.CcoId)
                                    .text(value.CcoAdresseTitle + ' [' + value.CcoFirstname + ' ' + value.CcoLastname + ']'));
                        });
                    }
                    if (_isView) {
                        LoadClientOrderLines();
                    }
                } else {
                    if (jQuery.isEmptyObject(data2Treat)) {
                        MsgPopUpWithResponse('ERREUR', 'Vous avez des droits insuffisants pour accéder à cette page.<br/>Veuillez contacter votre administrateur !', 'BackToSearch()');
                    } else {
                        // authentication error
                        AuthencationError();
                    }
                }
            },
            error: function(data) {
                var test = '';
            }
        });
    }
}

function BackToSearch() {
    window.location = 'SearchDeliveryForm.aspx';
}

function setDeliveryFormField() {
    $.each(currentDfo, function (name, value) {
        if (name === 'ClientCompanyName') {
        var companyname = currentDfo.ClientCompanyName + (IsNullOrEmpty(currentDfo.CliAbbr) ? "" : ("-" + currentDfo.CliAbbr));
            $('#clientList').append($("<option></option>").attr("data-value", currentDfo.CliFId).text(companyname));
            $('#clientList').attr('disabled', '');
        } else if (name === 'CodName') {
            $('#CodName').append($("<option></option>").attr("data-value", currentDfo.CodFId).text(value));
            $('#CodName').attr('disabled', '');
        } else {
            var newname = name;
            if (name === 'DfoDDelivery') {
                newname = '_DfoDDelivery';
                setFieldValue(newname, value, true, null, true);
            } else if (name === 'DfoDCreation') {
                newname = '_dCreationString';
                setFieldValue(newname, value, true, null, true);

            } else if (name === 'DfoDUpdate') {
                newname = '_dUpdateString';
                setFieldValue(newname, value, true, null, true);
            }
            else {
                if (name === 'DfoFile') {
                    if (value !== '' && value !== "" && value !== null) {
                        var src = "../Common/PageForPDF.aspx?type=2&dfoId=" + encodeURIComponent(currentDfo.DfoId);
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
                var setThisvalue = true;
                if (name.indexOf('_') === 0) {
                    setThisvalue = false;
                }
                if (setThisvalue) {
                    setFieldValue(newname, value, true);
                }
                if (name === 'DfoClientAdr' && !value) {
                    $('#CcoId').prop('disabled', null);
                }
            }
        }
    });
}

function deliveryCompleteAlert(sender) {
    var isdeliveried = $(sender).is(':checked');
    if (isdeliveried) {
        MsgErrorPopUp('ATTENTION', "La case à cocher 'Déjà livré' signifie que toutes les lignes de bon de livraison ne peuvent plus être modifiées !")
    }
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



var myApp;
myApp = myApp || (function () {
    var pleaseWaitDiv = $('<div class="modal " style="text-align:center" id="pleaseWaitDialog" data-backdrop="static" data-keyboard="false">' +
        '<div class="modal-header" style="margin-top:200px; border-bottom: 0px !important;"><h1 id="mask_processing">Traitement en cours ...</h1></div>' +
        '<div class="modal-body">' +
        '<img src="../../img/loaders/4.gif"></div></div>');
    return {
        showPleaseWait: function() {
            $('#mask_processing').text('Processing...');
            pleaseWaitDiv.modal();
        },
        hidePleaseWait: function () {
            pleaseWaitDiv.modal('hide');
        },
        showPleaseWaitWithText: function (text) {
            $('#mask_processing').text(text);
            pleaseWaitDiv.modal();
        },

    };
})();

function uploadFileClick() {
    ///create a new FormData object
    var formData = new FormData(); //var formData = new FormData($('form')[0]);
    ///get the file and append it to the FormData object
    formData.append('file', $('#iptUploadFilePopUp')[0].files[0]);
    var dfoId = getUrlVars()['dfoId'];
    var url = "../../Services/UploadFilesGeneral.ashx?type=2&dfoId=" + encodeURIComponent(dfoId);
    if (dfoId) {

        $('.bootbox-close-button').click();
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
                myApp.showPleaseWait();
            },
            ///Ajax events
            beforeSend: function (e) {
                //before event  
            },
            success: function (e) {
                //success event
                var src = "../Common/PageForPDF.aspx?type=2&dfoId=" + encodeURIComponent(dfoId);
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
    var dfoId = getUrlVars()['dfoId'];
    var url = window.webservicePath + "/DeleteDeliveryFormFile";
    $.ajax({
        type: "POST",
        url: url,
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        data: "{dfoId:'" + dfoId + "'}",
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


function downloadPdf(sender) {
    var dfoId = getUrlVars()['dfoId'];
    dfoId = encodeURIComponent(dfoId);
    window.open('../Common/PageDownLoad.aspx?dfoId=' + dfoId, '_blank');
    return false;
}


function setClickableLabel() {
    if (_isView) {
        $("#lb_client").addClass("animated_menu");
        $("#lb_client").prop('title', 'Cliquer pour consulter le client');
        $('#lb_client').css('cursor', 'pointer');
        $("#lb_clientorder").addClass("animated_menu");
        $("#lb_clientorder").prop('title', 'Cliquer pour consulter la commande');
        $('#lb_clientorder').css('cursor', 'pointer');
        $("#lb_project").addClass("animated_menu");
        $("#lb_project").prop('title', 'Cliquer pour consulter l\'affaire');
        $('#lb_project').css('cursor', 'pointer');
        
        $("#lb_clientinvoice").addClass("animated_menu");
        $("#lb_clientinvoice").prop('title', 'Cliquer pour consulter la facture');
        $('#lb_clientinvoice').css('cursor', 'pointer');
        
    }
}

function ExternLinkClick(sender) {
    if (_isView && currentDfo) {
    ExternLinkBaseClick(sender, currentDfo);
//        var page = $(sender).attr('pgid');
//        var flid = $(sender).attr('flid');
//        var par = $(sender).attr('prms');
//        var etid = $(sender).attr('etid');
//        var id = currentDfo[etid];
//        //alert(id);
//        var url = "../" + flid + "/" + page + "?" + par + "=" + id + "&mode=view";
//        document.location.href = url;
    }
}

function delete_dfo_click() {
 var title = "ATTENTION";
    var content = "<div class='box'><div class='box-body' style='height: 100px;'>" +
        "<div class='form-horizontal'>" +
        "<div class='col-md-12'>" +
        "<div class='form-group'>" +
        "<div class='col-sm-12' style='text-align:center;font-size: 18pt;'>Veuillez confirmer la suppression ! " +
        "<br/>La suppression de BON DE LIVRAISON est irrécupérable, veuillez confirmer !!!</div></div></div></div></div></div>"
        + "<div class='modal-footer center'>" +
        "<button type='button' class='btn btn-default' onclick='closeDialog()'>Annuler</button>" +
        "<button type='button' class='btn btn-inverse' onclick='return deleteOneDfo();'>SUPPRIMER</button></div>";
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


function deleteOneDfo() {
    var dfoId = getUrlVars()['dfoId'];
    var url = window.webservicePath + "/DeleteDeliveryForm";
    $.ajax({
        type: "POST",
        url: url,
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        data: "{dfoId:'" + dfoId + "'}",
        success: function(data) {
            var deleted = data.d;
            if (deleted) {
            document.location.href = 'SearchDeliveryForm.aspx';
            }
        },
        error: function(data) {
            var test = '';
        }
    });
}

function createClientFactureClick() {
var title = "CONFIRMATION";
    var content = "<div class='box'><div class='box-body' style='height: 100px;'>" +
        "<div class='form-horizontal'>" +
        "<div class='col-md-12'>" +
        "<div class='form-group'>" +
        "<div class='col-sm-12' style='text-align:center;font-size: 18pt;'>Veuillez confirmer la création de la facture ! " +
        "<br/>Une fois la facture est créée, le bon de livraison ne peut plus être modifié !!!</div></div></div></div></div></div>"
        + "<div class='modal-footer center'>" +
        "<button type='button' class='btn btn-default' onclick='closeDialog()'>Annuler</button>" +
        //"<button type='button' class='btn btn-inverse' onclick='return createClientInvoice();'>CRÉER LA FACTURE</button>" +
        "<button type='button' class='btn btn-inverse' onclick='return DeliveryDfo();'>CRÉER LA FACTURE</button>" +
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



function createCinFalse() {
var title = "CONFIRMATION";
    var content = "<div class='box'><div class='box-body' style='height: 100px;'>" +
        "<div class='form-horizontal'>" +
        "<div class='col-md-12'>" +
        "<div class='form-group'>" +
        "<div class='col-sm-12' style='text-align:center;font-size: 18pt;'>Ce BL a été facturé</br>OU</br>Il n'y a pas  de  ligne pour ce BL ! " +
        "</div></div></div></div></div></div>"
        + "<div class='modal-footer center'>" +
        "<button type='button' class='btn btn-default' onclick='closeDialog()'>Clôturer</button>" +
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

// 20200115 不再使用
//function createClientInvoice() {
//    myApp.showPleaseWait();
//    var dfoId = getUrlVars()['dfoId'];
//    if (dfoId) {
//        var url = window.webservicePath + "/CreateClientInvoiceByDeliveryForm";
//        var datastr = "{dfoId:'" + dfoId + "'}";
//        $.ajax({
//            type: "POST",
//            url: url,
//            contentType: "application/json; charset=utf-8",
//            data: datastr,
//            dataType: "json",
//            success: function(data) {
//                myApp.hidePleaseWait();
//                var jsdata = data.d;
//                var data2Treat = jQuery.parseJSON(jsdata);
//                if (data2Treat !== '-1') {
//                    if (data2Treat !== '0' && data2Treat !== 0 && data2Treat !== "0") {
//                        window.location = '../ClientInvoice/ClientInvoice.aspx?cinId=' + data2Treat + '&mode=view';
//                    } else {
//                        MsgErrorPopUp('Erreur', 'Ce Bon de livraison est déjà facturé, la facturation n\'est pas effecturée');
//                    }
//                } else {
//                    // authentication error
//                    AuthencationError();
//                }
//            },
//            error: function(data) {
//                var test = '';
//                myApp.hidePleaseWait();
//            }
//        });
//    }
//    return false;
//}

function DeliveryDfoClick() {
    var title = "CONFIRMATION";
    var content = "<div class='box'><div class='box-body' style='height: 100px;'>" +
        "<div class='form-horizontal'>" +
        "<div class='col-md-12'>" +
        "<div class='form-group'>" +
        "<div class='col-sm-12' style='text-align:center;font-size: 18pt;'>Veuillez confirmer la livraison ! " +
        "<br/>Ce bon de livraison est déjà livré? Veuillez confirmer !</div></div></div></div></div></div>"
        + "<div class='modal-footer center'>" +
        "<button type='button' class='btn btn-default' onclick='closeDialog()'>Annuler</button>" +
        "<button type='button' class='btn btn-inverse' onclick='return DeliveryDfo();'>LIVRER</button></div>";
    bootbox.dialog({
        title: title,
        message: content
    }).find('.modal-content').css({
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
    return false;
}

function goClientInvoice() {
    if (!jQuery.isEmptyObject(currentDfo)) {
        var cinId = currentDfo.CinFId;
        var url = "../ClientInvoice/ClientInvoice.aspx?cinId=" + cinId + "&mode=view";
        document.location = url;
    }
}

function DeliveryDfo() {
    var dfoId = getUrlVars()['dfoId'];
    if (dfoId) {
        var url = window.webservicePath + "/GetProductWithShelves";
        var datastr = "{dfoId:'" + dfoId + "'}";
        $.ajax({
            type: "POST",
            url: url,
            contentType: "application/json; charset=utf-8",
            data: datastr,
            dataType: "json",
            success: function(data) {
                var jsdata = data.d;
                var data2Treat = jQuery.parseJSON(jsdata);
                if (data2Treat !== '-1') {
                    setPrd2Delivery(data2Treat);
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
    return false;
}

function setPrd2Delivery(prdStockage) {
    var divStart = "<div class='box'><div class='box-body' id='div_oneWhs'><div class='row'>";
    var divEnd = "</div></div></div>";
    //var prdInfo = "<div class='col-md-4'><div class='form-horizontal'><div class='form-group'><label class='col-sm-3 control-label'>Produit</label><label class='col-sm-9 control-label' id='dp_lb_PrdName'></label></div><div class='form-group'><label class='col-sm-3 control-label'>Référence</label><label class='col-sm-9 control-label' id='dp_lb_PrdRef'></label></div><div class='form-group'><label class='col-sm-3 control-label'>Quantité à livrer</label><label class='col-sm-9 control-label' id='dp_lb_Qty2Dlv'></label></div><div class='form-group'><label class='col-sm-3 control-label'>Description</label><label class='col-sm-9 control-label' id='dp_lb_PrdDes'></label></div></div></div>";
    
    var allcontent = "";

    if (DeliveryFormLines && DeliveryFormLines.length > 0) {
        $.each(DeliveryFormLines, function(name, onedfl) {
            var prdname = (onedfl.LtpId === 2 || onedfl.LtpId === 4) ? onedfl.ColPrdName : "";
            var pitname = (onedfl.LtpId === 2 || onedfl.LtpId === 4) ? onedfl.PitName : "";
            var quantity = (onedfl.LtpId === 2 || onedfl.LtpId === 4) ? onedfl.DflQuantity : "";
            var ColPrdDes = onedfl? onedfl.ColPrdDes : '';
            var description = (ColPrdDes === null ? '' : replaceAll(onedfl.ColPrdDes, '\n', '</br>')) + '</br>' + replaceAll(onedfl.ColDescription, '\n', '</br>');
            description += '</br>---------------------------</br>' + onedfl.DflDescription;
            var oneline = "<div class='row well'>" +
                "<div class='col-md-5'>" +
                "<div class='form-horizontal'>" +
                "<div class='form-group'>" +
                "<label class='col-sm-3 control-label'>Produit</label>" +
                "<label class='col-sm-9 control-label' id='dp_lb_PrdName'>" + prdname + "</label>" +
                "</div>" +
                "<div class='form-group'>" +
                "<label class='col-sm-3 control-label'>Référence</label>" +
                "<label class='col-sm-9 control-label' id='dp_lb_PrdRef'>" + pitname + "</label>" +
                "</div>" +
                "<div class='form-group'>" +
                "<label class='col-sm-3 control-label'>Quantité à livrer</label>" +
                "<label class='col-sm-9 control-label' id='dp_lb_Qty2Dlv'>" + quantity + "</label>" +
                "</div>" +
                "<div class='form-group'>" +
                "<label class='col-sm-3 control-label'>Description</label>" +
                "<label class='col-sm-9 control-label' id='dp_lb_PrdDes'>" + description + "</label>" +
                "</div>" +
                "</div>" +
                "</div>";
            oneline += "<div class='col-md-7' id='div_prd_warehouse'>";

            var stockLines = searchInArray(prdStockage,'DflId', onedfl.DflId);
            var title = "";
            oneline += "<table cellpadding='0' cellspacing='0' border='0' class='table table-striped table-bordered table-hover ' style='max-height:200px;overflow-y: auto;'>";
            if (stockLines && stockLines.length > 0) {
                //oneline += "<table cellpadding='0' cellspacing='0' border='0' class='table table-striped table-bordered table-hover ' style='max-height:200px;overflow-y: auto;'>";
                title = "<thead><tr class='tr_title'><td>Entrepôt</td><td>Étagère</td><td>Qté. Total</td><td>Qté. à livrer [" + onedfl.DflQuantity + "]</td></tr></thead>";
                oneline += title;
                var checkQuantity = 0;
                var totalquantity = onedfl.DflQuantity;
                $.each(stockLines, function(order, onestock) {
                    var thisquantity = onestock.QuantityTotal - totalquantity ;
                    var quantityOk = thisquantity > 0;
                    thisquantity = quantityOk ? totalquantity : onestock.QuantityTotal;
                    totalquantity = quantityOk ? 0 : (thisquantity * -1);
                    oneline += "<tr><td>" + onestock.WareHouseName + "</td><td>" + onestock.SheCode + "</td><td class='td_right'>" + onestock.QuantityTotal + "</td><td  style='max-width:30px;'><input class='form-control' type='number' min='0' id='ip_dfl_" + onedfl.DflId + "_" + onestock.SheId + "' dflid='" + onedfl.DflId + "' whsId='" + onestock.WhsId + "' sheId='" + onestock.SheId + "' max='" + onedfl.DflQuantity + "' value='" + thisquantity + "' invId='" + onestock.InvId + "'/></td></tr>";
                    checkQuantity += onestock.QuantityTotal;
                });
                if (checkQuantity < onedfl.DflQuantity) {
                    oneline+="<tr><td class='td_center'>Le stock ne suffit pas, ajoutez un rappel d'achat ? <button type='button' class='btn btn-inverse' onclick='return AddPurchaseReminder()'>Créer un rappel</button></td></tr>";
                }
                oneline += "</table></div></div>";
            } else {
                title = "<tr><td class='td_center'>Le stock ne suffit pas, ajoutez un rappel d'achat ? <button type='button' class='btn btn-inverse' onclick='return AddPurchaseReminder()'>Créer un rappel</button></td></tr>"+
                "<thead><tr class='tr_title'><td>PAS DE SOTCK</td></tr></thead>";
                oneline += title;
            }
            oneline += "</table></div></div>";
            allcontent += oneline;
        });
    }
    allcontent = divStart + allcontent + divEnd;
//    allcontent  += "<div class='modal-body center'><button type='button' class='btn btn-default' onclick='return closeDialog()'>Annuler</button><button id='btn_delivery' class='btn btn-inverse' onclick='return DeliveryDfoLines()'>LIVRER</button></div>";
    allcontent  += "<div class='modal-body center'><button type='button' class='btn btn-default' onclick='return closeDialog()'>Annuler</button><button id='btn_delivery' class='btn btn-inverse' onclick='return DeliveryDfoLines(this)'>CRÉER</button></div>";

    bootbox.dialog({
            title: 'Produits livrés',
            message: allcontent
        }).find('.modal-dialog').css({
            'width': '80%'
        })
        .find('.modal-content').css({
            'margin-top': function() {
                var w = $(window).height();
                var b = $(".modal-dialog").height();
                var h = (w - b) * 0.2;
                return h + "px";
            }
        })
        .find('.modal-header').css({
            'background': 'url(../../img/menu_005_bg.jpg) repeat-x',
            'text-align': 'center',
            'color': '#C0C0C0'
        });
}


function DeliveryDfoLines(sender) {
    if (!jQuery.isEmptyObject(connectedUser) && connectedUser.LoginMode === 1) {
        var title = "Date de création de la facture";
        var msg = "Veuillez choisir la date de création de la facture.";
        var content = "<div class='box'><div class='box-body' style='height: 100px;'>" +
            "<div class='form-horizontal'>" +
            "<div class='col-md-12'>" +
            "<div class='form-group'>" +
            "<div class='col-sm-12' style='text-align:center;font-size: 18pt;'>" + msg + "</div></div></div></div></div></div>"
            + "<div class='modal-footer center'>" +
            "<button type='button' class='btn btn-default' onclick='DeliveryDfoLinesWithMode(this,0)'>Date du jour</button>" +
            "<button type='button' class='btn btn-inverse' onclick='DeliveryDfoLinesWithMode(this,1)'>Date de création de BL</button>" +
            "</div>";
        bootbox.dialog({
            closeButton: false,
            title: title,
            message: content
        })
//        .find('.modal-content').css({
//            'margin-top': function() {
//                var w = $(window).height();
//                var b = $(".modal-dialog").height();
//                // should not be (w-h)/2
//                var h = (w - b) * 0.3;
//                return h + "px";
//            }
//        })
        .find('.modal-header').css({
            //'background-color': '#d2322d',
            'background': 'url(../../img/menu_005_bg.jpg) repeat-x',
            'text-align': 'center',
            'color': '#C0C0C0'
        });
    } else {
        $(sender).prop('disabled', true);
        DeliveryDfoLinesWithMode(sender, 0);
    }
    return false;
}


function DeliveryDfoLinesWithMode(sender,mode) {
    $(sender).prop('disabled', true);
    var allStockLines = $("input[id^='ip_dfl_']");
    //DeliveryFormLines
    var deliveryFormLine2Add = [];
    if (allStockLines && allStockLines.length > 0) {
        $.each(allStockLines, function(name, value) {
            var onedflLine = {};
            onedflLine.WhsId = $(value).attr('whsid') * 1;
            onedflLine.DflId = $(value).attr('dflid') * 1;
            onedflLine.SheId = $(value).attr('sheid') * 1;
            onedflLine.InvId = $(value).attr('invid') * 1;
            var quantity = $(value).val();
            quantity = isNaN(quantity) ? 0 : (quantity * 1);
            onedflLine.DflQuantity = quantity;
            if (onedflLine.DflQuantity > 0) {
                deliveryFormLine2Add.push(onedflLine);
            }
        });
    }
//    var dflAddIds = deliveryFormLine2Add.length > 0 ? $(deliveryFormLine2Add).map(function() { return this.DflId; }) : [];
//    dflAddIds = jQuery.unique(dflAddIds);

    var dfoId = getUrlVars()['dfoId'];
    if (dfoId) {
        //var url = window.webservicePath + "/DeliveryDfoWithDfls";
        // delivery all dfo
        //var url = window.webservicePath + "/CreateClientInvoiceAndDeliveryDfoWithDfls";
        var url = window.webservicePath + "/CreateClientInvoiceAndDeliveryAllDfos";
        ShowPleaseWait();
        //var jsondata = JSON.stringify({ dfoId: dfoId , dfls:deliveryFormLine2Add });
        var jsondata = JSON.stringify({ dfoId: dfoId,mode:mode });
        $.ajax({
            type: "POST",
            url: url,
            contentType: "application/json; charset=utf-8",
            data: jsondata,
            dataType: "json",
            success: function(data) {
                //location.reload();
                //myApp.hidePleaseWait();
                var jsdata = data.d;
                var data2Treat = jQuery.parseJSON(jsdata);
                if (data2Treat !== '-1') {
                    if (data2Treat !== '0' && data2Treat !== 0 && data2Treat !== "0") {
                        window.location = '../ClientInvoice/ClientInvoice.aspx?cinId=' + data2Treat + '&mode=view';
                    } else {
                        MsgErrorPopUp('Erreur', 'Ce Bon de livraison est déjà facturé, la facturation n\'est pas effecturée');
                    }
                } else {
                    // authentication error
                    myApp.hidePleaseWait();
                    AuthencationError();
                }
            },
            error: function(data) {
                location.reload();
            }
        });
    }
    return false;
}

function DeliveryDfo_OLD() {
    var dfoId = getUrlVars()['dfoId'];
    if (dfoId) {
        var url = window.webservicePath + "/DeliveryDfo";
        var datastr = "{dfoId:'" + dfoId + "'}";
        $.ajax({
            type: "POST",
            url: url,
            contentType: "application/json; charset=utf-8",
            data: datastr,
            dataType: "json",
            success: function(data) {
                LoadDeliveryForm();
            },
            error: function(data) {
                var test = '';
            }
        });

    }

    return false;
}


function AddPurchaseReminder() {
    // todo : create reminder
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

    loadAllBankInfo();
}

function CreateModeSetAdr() {
    var client = selectedClient;
    $('#Dlv_CcoFirstname').prop('disabled', true);
    $('#Dlv_CcoLastname').prop('disabled', true);
    $('#Dlv_CcoAddress1').prop('disabled', true);
    $('#Dlv_CcoAddress2').prop('disabled', true);
    $('#Dlv_CcoPostcode').prop('disabled', true);
    $('#Dlv_ip_CcoCity').prop('disabled', true);
    $('#Dlv_CcoCountry').prop('disabled', true);
    $('#Dlv_CcoFax').prop('disabled', true);
    $('#Dlv_CcoTel1').prop('disabled', true);
    $('#Dlv_CcoCellphone').prop('disabled', true);
    $('#Dlv_CcoEmail').prop('disabled', true);
    $('#CcoId').prop('disabled', true);    
    $('#CcoId').val(0);

    $('#Dlv_CcoFirstname').val('');
    $('#Dlv_CcoLastname').val('');
    $('#Dlv_CcoAddress1').val(client.Address1);
    $('#Dlv_CcoAddress2').val(client.Address2);
    $('#Dlv_CcoPostcode').val(client.Postcode);
    $('#Dlv_ip_CcoCity').val(client.City);
    $('#Dlv_CcoCountry').val(client.Country);
    $('#Dlv_CcoFax').val(client.Fax);
    $('#Dlv_CcoTel1').val(client.Tel1);
    $('#Dlv_CcoCellphone').val(client.Cellphone);
    $('#Dlv_CcoEmail').val(client.Email);
    
    $('#Dlv_CcoFirstname').removeAttr('placeholder');
    $('#Dlv_CcoLastname').removeAttr('placeholder');
    $('#Dlv_CcoAddress1').removeAttr('placeholder');
    $('#Dlv_CcoAddress2').removeAttr('placeholder');
    $('#Dlv_CcoPostcode').removeAttr('placeholder');
    $('#Dlv_ip_CcoCity').removeAttr('placeholder');
    $('#Dlv_CcoCountry').removeAttr('placeholder');
    $('#Dlv_CcoFax').removeAttr('placeholder');
    $('#Dlv_CcoTel1').removeAttr('placeholder');
    $('#Dlv_CcoCellphone').removeAttr('placeholder');
    $('#Dlv_CcoEmail').removeAttr('placeholder');
}

function ClientAdrChange(sender) {
    var ischeck = $(sender).is(':checked');
    if (!ischeck) {
        $('#Dlv_CcoFirstname').prop('disabled', null);
        $('#Dlv_CcoLastname').prop('disabled', null);
        $('#Dlv_CcoAddress1').prop('disabled', null);
        $('#Dlv_CcoAddress2').prop('disabled', null);
        $('#Dlv_CcoPostcode').prop('disabled', null);
        $('#Dlv_ip_CcoCity').prop('disabled', null);
        $('#Dlv_CcoCountry').prop('disabled', null);
        $('#Dlv_CcoFax').prop('disabled', null);
        $('#Dlv_CcoTel1').prop('disabled', null);
        $('#Dlv_CcoCellphone').prop('disabled', null);
        $('#Dlv_CcoEmail').prop('disabled', null);
        $('#CcoId').prop('disabled', null);        
//        $('#Dlv_CcoFirstname').val('');
//        $('#Dlv_CcoLastname').val('');
//        $('#Dlv_CcoAddress1').val('');
//        $('#Dlv_CcoAddress2').val('');
//        $('#Dlv_CcoPostcode').val('');
//        $('#Dlv_ip_CcoCity').val('');
//        $('#Dlv_CcoCountry').val('');
//        $('#Dlv_CcoFax').val('');
//        $('#Dlv_CcoTel1').val('');
//        $('#Dlv_CcoCellphone').val('');
//        $('#Dlv_CcoEmail').val('');
    } else {
        CreateModeSetAdr();
    }
    return false;
}


function showDfoToCreateCin() {
    var divStart = "<div class='box'><div class='box-body' id='div_oneWhs'><div class='row'>";
    var divEnd = "</div></div></div>";

    var allcontent = "";

    // loading BLs, which can be create CIN
    allcontent = "<div class='row well'>" +
        "<div class='col-md-12' id='div_bankinof'>" +
        "<div class='form-group'>" +
        "<label class='col-sm-4 control-label' style='color: red'>Sélectionner un RIB</label>" +
        "<div class='col-sm-5'><select type='text' class='form-control' id='CinBank' name='CinBank'></select></div>" +
        "<div class='col-sm-3'></div>" +
        "</div>" +
        "</div>" +
        "<div class='col-md-12'>" +
        "<div class='form-horizontal' id='div_bls_content'>" +
        "<div class='form-group'>" +
        "<label class='col-sm-12 control-label' style='text-align: center;'>" +
        "Veuillez patienter</br>" +
        "<img src='../../img/loaders/12.gif'></label>" +
        "</div>" +
        "</div>" +
        "<div class='col-md-12'>" +
        "<div class='form-horizontal' id='div_bl_cin_d_creation' style='display:none;'>" +
        "<div class='form-group'></br>" +
        "<label class='col-sm-6 control-label'>Date de création de la facture (ça décide le code de facture)</label>" +
        "<div class='col-sm-3'>" +
        "<div class='input-group'>" +
        "<input type='text' class='form-control  datepicker ' id='DfoCinDCreate' name='DfoCinDCreate' /><span class='input-group-addon'><i class='fa fa-calendar'></i></span>" +
        "</div>" +
        "</div>" +
        "<div class='col-sm-3'></div>" +
        "</div>" +
        "</div>" +
        "</div>"+
        "</div>" +
        "</div>";
//        "</div>" +
//        "</div>" +
//        "</div>";

    allcontent = divStart + allcontent + divEnd;
    allcontent += "<div class='modal-body center'><button type='button' class='btn btn-default' onclick='return closeDialog()'>Annuler</button>" +
        "<button id='btn_delivery' class='btn btn-inverse' onclick='return CreateCinWithDfosClick()'>CRÉER</button></div>";

    bootbox.dialog({
            title: 'Sélectionner le(s) BL(s)',
            message: allcontent
        }).find('.modal-dialog').css({
            'width': '90%',
        })
        .find('.modal-content').css({
            'margin-top': function() {
                var w = $(window).height();
                var b = $(".modal-dialog").height();
                var h = (w - b) * 0.2;
                return h + "px";
            }
        })
        .find('.modal-header').css({
            'background': 'url(../../img/menu_005_bg.jpg) repeat-x',
            'text-align': 'center',
            'color': '#C0C0C0'
        });
        
    $.each($('.datepicker'), function(idx, value) {
        $(value).datepicker();
    });

    var today = getToday();
    $('#DfoCinDCreate').val(today);
    if (!jQuery.isEmptyObject(connectedUser) && connectedUser.LoginMode === 1) {
        $('#div_bl_cin_d_creation').show();
    } else {
        $('#div_bl_cin_d_creation').hide();
    }

    $.each(allBankInfo, function (order, oneinfo) {
        $('#CinBank').append($("<option>" + oneinfo.RibTitle + "</option>").attr("value", oneinfo.Id));
    });
    GetDfoForCin();
    return false;
}

function GetDfoForCin() {
var dfoId = getUrlVars()['dfoId'];
    if (dfoId) {
        var url = window.webservicePath + "/GetDeliveryFormsForCin";
        var datastr = "{dfoId:'" + dfoId + "'}";
        $.ajax({
            type: "POST",
            url: url,
            contentType: "application/json; charset=utf-8",
            data: datastr,
            dataType: "json",
            success: function(data) {
                var jsdata = data.d;
                var data2Treat = jQuery.parseJSON(jsdata);
                if (data2Treat !== '-1') {
                    $('#div_bls_content').empty();
                    if (data2Treat.length > 0) {
                        $('#div_bls_content').append("<div class='form-group'>" +
                            "<label class='col-sm-12 control-label' style='text-align: center; color:red;'>" +
                            "Sélectionner le(s) BL(s) à facturer, une fois vous le(s) facturez, vous ne le(s) pouvez plus modifier !</label></div>");
                        AddDfoWithDflForCin(data2Treat);
                    } else {
                    }
                }
            },
            error: function(data) {
                var test = '';
            }
        });
    }
}

function AddDfoWithDflForCin(dfos) {
    var titleLines = "<table style='width:100%' border='1'>" +
        "<tr style='height:30px;'>" +
        "<th style='text-align:center;width:5%;'><input type='checkbox' id='cbx_all_dfo' onclick='DfoAllClick(this)'/></th>" +
        "<th style='text-align:center;width:15%'>N°BL</th>" +
        "<th style='text-align:center;width:15%'>D. Livraison</th>" +
        "<th style='text-align:center;width:15%'>D. Création</th>" +
        "<th style='text-align:center;width:30%'>Prd.</th>" +
        "<th style='text-align:center;width:20%'>Qté</th>" +
        "</tr></table>";
    $('#div_bls_content').append(titleLines);
    var allcontent = "";
    // new table
    allcontent += "<div style='width:100%;max-height:500px;overflow-y:auto;overflow-x:hidden;'><table style='width:100%;' border='1'>";

    $.each(dfos, function(name, value) {
        var oneline = "<tr style='height:30px;'>";
        oneline += "<td style='text-align:center;width:5%'><input type='checkbox' id='cbx_dfo_" + value.DfoId + "' dfoId='" + value.DfoId + "'/></td>";
        oneline += "<td style='width:15%'>" + value.DfoCode + "</td>";
        oneline += "<td style='width:15%'>" + getDateString(value.DfoDDelivery) + "</td>";
        oneline += "<td style='width:15%'>" + getDateString(value.DfoDCreation) +"</td>";

        var prds = "";
        var prdQty = "";
        var prdcount = 1;
        $.each(value.DeliveryFormLines, function(name1, onedfl) {
            prds += prdcount+ " : ";
            prdQty += prdcount+ " : ";
            prds += onedfl.ColPrdName +"</br>";
            prdQty += onedfl.DflQuantity +"pcs</br>";
            prdcount++;
        });

        oneline += "<td style='width:30%'>" + prds + "</td>";
        oneline += "<td style='width:20%'>" + prdQty + "</td>";
        oneline += "</tr>";
        allcontent += oneline;
    });

    allcontent += "</table></div>";
    $('#div_bls_content').append(allcontent);
}

function DfoAllClick(sender) {
    var ischeck = $(sender).is(':checked');
    var allDfos = $("input[id^='cbx_dfo_']");
    allDfos.each(function() {
        $(this).prop('checked', ischeck);
    });
}


function CreateCinWithDfosClick() {
    var checkedDfos = $("input[id^='cbx_dfo_']:checked");
    if (checkedDfos.length === 0) {
        //$('.bootbox-close-button').click();
        //MsgErrorPopUp('Auchun BL sélectionné','Veuillez sélectionner au moins un BL ! ');
        alert('Veuillez sélectionner au moins un BL ! ');
    } else {
        var blIds = [];
        checkedDfos.each(function() {
            var dfoid = $(this).attr('dfoid') * 1;
            if (dfoid > 0) {
                blIds.push(dfoid);
            }
        });
        blIds = jQuery.unique(blIds);
        if (blIds.length > 0) {
            ShowPleaseWait();
            CreateCinWithDfos(blIds);
        }
    }
    //console.log(checkedDfos.length);
    return false;
}

function CreateCinWithDfos(blIds) {
    var dcreate = $('#DfoCinDCreate').val();
    var bacId = $('#CinBank :selected').val() * 1;
    var jsondata = JSON.stringify({ dfoIds: blIds, dCreate: dcreate, bacId: bacId });
    var url = window.webservicePath + "/CreateCinForDfoSelected";
        $.ajax({
            url: url,
            type: 'POST',
            contentType: 'application/json; charset=utf-8',
            data: jsondata,
            dataType: 'json',
            success: function (data) {
                var jsdata = data.d;
                var data2Treat = jQuery.parseJSON(jsdata);
                if (data2Treat !== '-1') {
                    if (data2Treat !== '0' && data2Treat !== 0 && data2Treat !== "0") {
                        window.location = '../ClientInvoice/ClientInvoice.aspx?cinId=' + data2Treat + '&mode=view';
                    } else {
                        MsgErrorPopUp('Erreur', 'Ce Bon de livraison est déjà facturé, la facturation n\'est pas effecturée');
                    }
                } else {
                    // authentication error
                    AuthencationError();
                }
                
            },
            error: function (data) {
                alert(data.responseText);
            }
        });
        
    return false;
}


function CcoOnchanged(sender) {
    var selectedvalue = $(sender).val() * 1;
    if (selectedvalue == 0) {
        $('#Dlv_CcoFirstname').val('');
        $('#Dlv_CcoLastname').val('');
        $('#Dlv_CcoAddress1').val(client.Address1);
        $('#Dlv_CcoAddress2').val(client.Address2);
        $('#Dlv_CcoPostcode').val(client.Postcode);
        $('#Dlv_ip_CcoCity').val(client.City);
        $('#Dlv_CcoCountry').val(client.Country);
        $('#Dlv_CcoFax').val(client.Fax);
        $('#Dlv_CcoTel1').val(client.Tel1);
        $('#Dlv_CcoCellphone').val(client.Cellphone);
        $('#Dlv_CcoEmail').val(client.Email);

        $('#Dlv_CcoFirstname').removeAttr('placeholder');
        $('#Dlv_CcoLastname').removeAttr('placeholder');
        $('#Dlv_CcoAddress1').removeAttr('placeholder');
        $('#Dlv_CcoAddress2').removeAttr('placeholder');
        $('#Dlv_CcoPostcode').removeAttr('placeholder');
        $('#Dlv_ip_CcoCity').removeAttr('placeholder');
        $('#Dlv_CcoCountry').removeAttr('placeholder');
        $('#Dlv_CcoFax').removeAttr('placeholder');
        $('#Dlv_CcoTel1').removeAttr('placeholder');
        $('#Dlv_CcoCellphone').removeAttr('placeholder');
        $('#Dlv_CcoEmail').removeAttr('placeholder');
        return flase;
    }
    else {
        try {
            var oneCco = searchInArray(CcoListForDfo, 'CcoId', selectedvalue)[0]
            //console.log(oneCco);
            if (!jQuery.isEmptyObject(oneCco)) {
                $('#Dlv_CcoFirstname').val(oneCco.CcoFirstname);
                $('#Dlv_CcoLastname').val(oneCco.CcoLastname);
                $('#Dlv_CcoAddress1').val(oneCco.CcoAddress1);
                $('#Dlv_CcoAddress2').val(oneCco.CcoAddress2);
                $('#Dlv_CcoPostcode').val(oneCco.CcoPostcode);
                $('#Dlv_ip_CcoCity').val(oneCco.CcoCity);
                $('#Dlv_CcoCountry').val(oneCco.CcoCountry);
                $('#Dlv_CcoFax').val(oneCco.CcoFax);
                $('#Dlv_CcoTel1').val(oneCco.CcoTel1);
                $('#Dlv_CcoCellphone').val(oneCco.CcoCellphone);
                $('#Dlv_CcoEmail').val(oneCco.CcoEmail);

            }
        } catch (e) {

        }
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
