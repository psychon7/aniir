$(document).ready(init);

function init() {
    $.each($('.datepicker'), function (idx, value) {
        $(value).datepicker();
    });
    //$('#DfoDateCreationFrom').val(firstDayOfYear());
    $('#DfoDateCreationFrom').val(firstDayInPreviousMonths(3));
    $('#DfoDateCreationTo').val(getToday());

    setAutoCompleteClient();
    SetLanguageBar();
    loadAllBankInfo();
}


function createDeliveryForm() {
    window.location = 'DeliveryForm.aspx';
}

var hasSet = false;

function jsSearchDfo() {
    myApp.showPleaseWait();
    var order = Object();
    order.DfoCode = $('#DfoCode').val().trim();
    order.PrjName = $('#PrjName').val().trim();
    order.PrjCode = $('#PrjCode').val().trim();
    order.CodName = $('#CodName').val().trim();
    order.CodCode = $('#CodCode').val().trim();
    //order.ClientCompanyName = $('#ClientCompanyName').val().trim();
    order.ClientCompanyName = $('#ClientList').val().trim();
    order.CplName = $('#CplName').val().trim();
    order.CplCode = $('#CplCode').val().trim();
    order.Dlv_CcoFirstname = $('#CcoName').val().trim();
    order._DfoDCreation = $('#DfoDateCreationFrom').val();
    order._DfoDUpdate = $('#DfoDateCreationTo').val();
    order.DfoDeliveried = $('#cbx_only_deliveried')[0].checked;
    order.HasClientInvoice = $('#cbx_only_invoiced')[0].checked;

    var jsondata = JSON.stringify({ oneDfo: order });
    var url = window.webservicePath + "/SearchDeliveryForms";
    $.ajax({
        type: "POST",
        url: url,
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        data: jsondata,
        success: function (data) {
            var jsdata = data.d;
            var data2Treat = jQuery.parseJSON(jsdata);
            if (data2Treat !== '-1') {
                if (data2Treat.length === 0) {
                    NoResultMsg();
                }
                var headerFooter = "<tr>" +
                    "<th class='language_txt'>IMP.<br/><input type='checkbox' id='cbx_all_imp_dfo' onclick='DfoImpAllClick(this)'/></th>" +
                    "<th class='language_txt'>FAC.<br/><input type='checkbox' id='cbx_all_fac_dfo' onclick='DfoFacAllClick(this)'/></th>" +
                    "<th class='language_txt'>D. C.</th>" +
                    (connectedUser.LoginMode === 1 ? "<th class='language_txt'>D. M.</th>" : "") +
                    "<th class='language_txt'>Code de livraison</th>" +
                    "<th class='language_txt'>Livré</th>" +
                    "<th class='language_txt'>Facturé</th>" +
                    "<th class='language_txt'>Code de Commande</th>" +
                    "<th class='language_txt'>Nom de Commande</th>" +
                    "<th class='language_txt'>Raison sociale</th>" +
                    "<th class='language_txt'>Contact</th>" +
                    "<th class='language_txt'>Nom du devis</th>" +
                    "<th class='language_txt'>Nom de l'affaire</th>" +
                    "<th class='language_txt'>Code de facture</th>" +
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
                    $('#div_for_datatable').html(datatableContent);

                } catch (e) {
                    var test = '';
                }
                var resultcount = data2Treat.length;
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
                    titles.push({ "sTitle": "Impression" });
                    titles.push({ "sTitle": "Facture" });
                    titles.push({ "sTitle": "DateCreate" });
                    if (connectedUser.LoginMode === 1) { titles.push({ "sTitle": "DateModify" }); }
                    titles.push({ "sTitle": "Code de livraison" });
                    titles.push({ "sTitle": "Deliveried" });
                    titles.push({ "sTitle": "Invoiced" });
                    titles.push({ "sTitle": "CodName" });
                    titles.push({ "sTitle": "CodCode" });
                    titles.push({ "sTitle": "Raison sociale" });
                    titles.push({ "sTitle": "Contact" });
                    titles.push({ "sTitle": "Nom du devis" });
                    titles.push({ "sTitle": "Nom de l'affaire" });
                    titles.push({ "sTitle": "CinCode" });


                    var displaycount = 1;
                    $.each(data2Treat, function (name, value) {
                        $('#mask_processing').text('Traitement en cours ' + displaycount + '/' + resultcount);
                        $('#mask_processing').val('Traitement en cours ' + displaycount + '/' + resultcount);
                        var dataArray = new Array();
                        dataArray.push("<input type='checkbox' id='cbx_imp_dfo_" + value.DfoId + "' dfoId='" + value.DfoId + "' onclick='CheckBoxForImpBtn()'/>");
                        if (!value.HasClientInvoice) {
                            dataArray.push("<input type='checkbox' id='cbx_inv_dfo_" + value.DfoId + "' dfoId='" + value.DfoId + "' onclick='CheckBoxForInvBtn()'/>");
                        } else {
                            dataArray.push("");
                        }
                        dataArray.push("<span  onclick='viewDeliveryForm(\"" + value.FId + "\")' style='cursor:pointer;font-weight:bolder;'>" + getDateString(value.DfoDCreation) + "</span>");
                        if (connectedUser.LoginMode === 1) { dataArray.push("<span  onclick='viewDeliveryForm(\"" + value.FId + "\")' style='cursor:pointer;font-weight:bolder;'>" + getDateString(value.DfoDUpdate) + "</span>"); }
                        dataArray.push("<span  onclick='viewDeliveryForm(\"" + value.FId + "\")' style='cursor:pointer;font-weight:bolder;'>" + value.DfoCode + "</span>");
                        dataArray.push((value.DfoDeliveried ? "OUI" : "NON"));
                        dataArray.push((value.HasClientInvoice ? "OUI" : "NON"));
                        dataArray.push(value.CodCode);
                        dataArray.push(value.CodName);
                        var companyname = value.ClientCompanyName + (IsNullOrEmpty(value.CliAbbr) ? "" : ("-" + value.CliAbbr));
                        dataArray.push(companyname);
                        dataArray.push(value.Dlv_CcoFirstname + " " + value.Dlv_CcoLastname);
                        dataArray.push(value.CplName);
                        dataArray.push(value.PrjName);
                        dataArray.push("<span  onclick='viewCinItem(\"" + value.CinFId + "\")' style='cursor:pointer;font-weight:bolder;'>" + value.CinCode + "</span>");

                        try {
                            $('#datatable_search_result').dataTable().fnAddData(dataArray);
                        } catch (e) {
                            var test = '';
                        }
                        displaycount++;
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
                SetLanguageBar();
                myApp.hidePleaseWait();
            } else {
                // authentication error
                AuthencationError();

                myApp.hidePleaseWait();
            }
        },
        error: function (data) {
            var test = '';
            myApp.hidePleaseWait();
        }
    });
    return false;
}

function DfoImpAllClick(sender) {
    var ischeck = $(sender).is(':checked');
    var allDfos = $("input[id^='cbx_imp_dfo_']");
    allDfos.each(function () {
        $(this).prop('checked', ischeck);
    });
    if (ischeck) {
        $('#bnt_download_bls').show();
    } else {
        $('#bnt_download_bls').hide();
    }
}

function CheckBoxForImpBtn() {
    var ischeck = false;
    var allDfos = $("input[id^='cbx_imp_dfo_']");
    allDfos.each(function () {
        ischeck = ischeck || $(this).prop('checked');
    });
    if (ischeck) {
        $('#bnt_download_bls').show();
    } else {
        $('#bnt_download_bls').hide();
    }
}



function DfoFacAllClick(sender) {
    var ischeck = $(sender).is(':checked');
    var allDfos = $("input[id^='cbx_inv_dfo_']");
    allDfos.each(function () {
        $(this).prop('checked', ischeck);
    });
    if (ischeck) {
        $('#btn_create_cin_bl').show();
    } else {
        $('#btn_create_cin_bl').hide();
    }
}

function CheckBoxForInvBtn() {
    var ischeck = false;
    var allDfos = $("input[id^='cbx_inv_dfo_']");
    allDfos.each(function () {
        ischeck = ischeck || $(this).prop('checked');
    });
    if (ischeck) {
        $('#btn_create_cin_bl').show();
    } else {
        $('#btn_create_cin_bl').hide();
    }
}

function downloadAllBls() {
    var allDfos = $("input[id^='cbx_imp_dfo_']");
    var idstr = '';
    allDfos.each(function () {
        var id = $(this).attr('dfoId') * 1;
        if ($(this).prop('checked')) {
            idstr += (id + ',');
        }
    });
    //console.log(idstr);
    window.open('../Common/PageDownLoad.aspx?dfoIds=' + idstr, '_blank');
    return false;
}

function CreateCinFromBls() {
    //    MsgPopUpWithResponseChoice('Confirmation',
    //    'Veuillez confirmer, une fois vous le(s) facturez, vous ne le(s) pouvez plus modifier !',
    //    'Facturer',
    //    CreateBls(),
    //    'Annuler');
    var title = 'Confirmation';
    var msg = 'Veuillez confirmer, une fois vous le(s) facturez, vous ne le(s) pouvez plus modifier ! <br/>Si les BLs ont la même commande, voulez-vous les réunir dans la même facture ou créer les factures séparément ?';
    var content = "<div class='box'><div class='box-body' style='height: 100px;'>" +
        "<div class='form-horizontal'>" +
        "<div class='col-md-12' id='div_bankinof'>" +
        "<div class='form-group'>" +
        "<label class='col-sm-4 control-label' style='color: red'>Sélectionner un RIB</label>" +
        "<div class='col-sm-5'><select type='text' class='form-control' id='CinBank' name='CinBank'></select></div>" +
        "<div class='col-sm-3'></div>" +
        "</div>" +
        "</div>" +
        "<div class='col-md-12'>" +
        "<div class='form-group'>" +
        "<div class='col-sm-12' style='text-align:center;font-size: 18pt;'>" + msg + "</div></div></div></div></div>"
        + "<div class='modal-footer center'>" +
        "<button type='button' class='btn btn-default' onclick='closeDialog()'>Annuler</button>" +
        "<button type='button' class='btn btn-inverse' onclick='CreateBls(1)'>Réunir</button>" +
        "<button type='button' class='btn btn-inverse' onclick='CreateBls(0)'>Séparer</button>" +
        "</div></div>";
    bootbox.dialog({
        closeButton: false,
        title: title,
        message: content
    }).find('.modal-content').css({
        'margin-top': function () {
            var w = $(window).height();
            var b = $(".modal-dialog").height();
            // should not be (w-h)/2
            var h = (w - b) * 0.2;
            return h + "px";
        }
    }).find('.modal-header').css({
        //'background-color': '#d2322d',
        'background': 'url(../../img/menu_005_bg.jpg) repeat-x',
        'text-align': 'center',
        'color': '#C0C0C0'
    });

    $.each(allBankInfo, function (order, oneinfo) {
        $('#CinBank').append($("<option>" + oneinfo.RibTitle + "</option>").attr("value", oneinfo.Id));
    });
}

function CreateBls(mode) {
    var allDfos = $("input[id^='cbx_inv_dfo_']");
    var idstr = '';
    var blIds = [];
    var bacId = $('#CinBank :selected').val() * 1;
    allDfos.each(function () {
        var id = $(this).attr('dfoId') * 1;
        if ($(this).prop('checked') && id > 0) {
            blIds.push(id);
            //idstr += (id + ',');
        }
    });
    if (blIds.length > 0) {
        ShowPleaseWait('Création de la facture en cours, veuillez patienter...');
        var dcreate = getToday();
        var jsondata = JSON.stringify({ dfoIds: blIds, dCreate: dcreate, mode: mode, bacId: bacId });
        var url = window.webservicePath + "/CreateCinForDfoSelectedWithDifDfo";
        $.ajax({
            url: url,
            type: 'POST',
            contentType: 'application/json; charset=utf-8',
            data: jsondata,
            dataType: 'json',
            success: function (data) {
                HidePleaseWait();
                var jsdata = data.d;
                var data2Treat = jQuery.parseJSON(jsdata);
                if (data2Treat !== '-1') {
                    if (data2Treat !== '0' && data2Treat !== 0 && data2Treat !== "0") {
                        //window.location = '../ClientInvoice/ClientInvoice.aspx?cinId=' + data2Treat + '&mode=view';
                        $('#btn_create_cin_bl').hide();
                        $('#bnt_download_bls').hide();
                        $('#cbx_all_imp_dfo').prop('checked', false);
                        $('#cbx_all_fac_dfo').prop('checked', false);
                        jsSearchDfo();
                        alert('La création est éffecturée, veuillez les consulter !');
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
    }
    return false;
    //console.log(idstr);
}

function viewDeliveryForm(fId) {
    //ShowPleaseWait();
    var url = 'DeliveryForm.aspx?dfoId=' + fId + "&mode=view";
    //document.location = url;

    var win = window.open(url, '_blank');
    win.focus();
    return false;
}

function viewCinItem(fId) {
    //ShowPleaseWait();
    var url = '../ClientInvoice/ClientInvoice.aspx?cinId=' + fId + "&mode=view";
    var win = window.open(url, '_blank');
    win.focus();
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
            //selectedClientChanged(seltectedClientId);
        },
        minLength: 2
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
