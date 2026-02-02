document.onkeydown = function (e) {
    var keyCode = e.keyCode || e.which || e.charCode;
    var ctrlKey = e.ctrlKey || e.metaKey;
    if (ctrlKey && keyCode === 89) {
        //alert('save');
        if (_isView) {
            GetSoldPrice();
        }
        e.preventDefault();
    }
}


function GetSoldPrice() {
    var cliId = currentCod.CliFId;
    var height = $(window).height();
    var width = $(window).width();
    width = width * 0.8;
    width = width.toFixed(0);
    var clientname = $('#ip_Client').val();
    var url = '../Client/ClientPrice.aspx?cliId=' + cliId + '&cliname=' + clientname;
    window.open(url, 'popupWindow', 'height=' + height + ', width=' + width + ', top=0, left=0, toolbar=no, menubar=no, scrollbars=no, resizable=no,location=no, status=no');
    return false;
}

$(document).ready(initAll);
function initAll() {
    setMenu();
    var url = window.location.href.split('?')[0];
    var paras = url.split('/');
    var pagename = paras[paras.length - 1].toLowerCase();
    switch (pagename) {
        case 'clientorderdeliveryformlist.aspx':
            loadDfo();
            break;
        case 'costplanclientinvoicelist.aspx':
            loadInvoice();
            break;
    }
}

function goClientOrder() {
    var prjId = getUrlVars()['codId'];
    var url = 'ClientOrder.aspx?codId=' + prjId + "&mode=view";
    window.location = url;
}


function setMenu() {
    var prjId = getParameterByName('codId');
    if (prjId) {
        $('.prjMenu').show();
    } else {
        $('.prjMenu').hide();
    }
}

function loadDfo() {
    var cplId = getUrlVars()['codId'];
    var url = window.webservicePath + "/GetDeliveryByCodId";
    $.ajax({
        type: "POST",
        url: url,
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        data: "{codId:'" + cplId + "'}",
        success: function (data) {
            var jsdata = data.d;
            var data2Treat = jQuery.parseJSON(jsdata);
            var budgetId = '#tbody_cost_plan';
            if (data2Treat !== '-1') {
                $(budgetId).empty();
                var linecount = 0;
                $('#result_count').text(data2Treat.length);
                $.each(data2Treat, function (name, value) {
                    var trclass = (linecount % 2 === 0) ? "class='odd'" : "class='even'";
                    var content = "<tr " + trclass + ">" +
                        "<td style='text-align: left'><span  onclick='viewDfo(\"" + value.FId + "\")' style='cursor:pointer'>" + value.DfoCode + "</span></td>" +
                        "<td style='text-align: right; " + (value.DfoDeliveried ? "color:green;" : "color:red;") + "'>" + (value.DfoDeliveried ? "Oui" : "Non") + "</td>" +
                        "<td style='text-align: right; " + (value.HasClientInvoice ? "color:green;" : "color:red;") + "'><span  onclick='viewCin(\"" + value.CinFId + "\")' style='cursor:" + (value.DfoDeliveried ? "pointer" : "Auto") + "'>" + (value.HasClientInvoice ? value.CinCode : "Non") + "<span></td>" +
                        "<td style='text-align: left'>" + getDateString(value.DfoDCreation) + "</td>" +
                        "<td style='text-align: left'>" + getDateString(value.DfoDDelivery) + "</td>" +
                        "</tr>";
                    $(budgetId).append(content);
                    linecount++;
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


function viewDfo(fId) {
    ShowPleaseWait();
    var url = '../DeliveryForm/DeliveryForm.aspx?dfoId=' + fId + "&mode=view";
    document.location = url;
    return false;
}


function viewCin(fId) {
    ShowPleaseWait();
    var url = '../ClientInvoice/ClientInvoice.aspx?cinId=' + fId + "&mode=view";
    document.location = url;
    return false;
}

function createDfo() {
    ShowPleaseWait();
    var codId = getUrlVars()['codId'];
    var url = '../DeliveryForm/DeliveryForm.aspx?codId=' + codId + "&mode=create";
    document.location = url;
    return false;
}


function checkOrderAllDeliveried() {
    var codId = getUrlVars()['codId'];
    if (codId) {
        var url = window.webservicePath + "/CheckClientOrderLineNotCompleteDeliveried";
        var datastr = "{codId:'" + codId + "'}";
        $.ajax({
            type: "POST",
            url: url,
            contentType: "application/json; charset=utf-8",
            data: datastr,
            dataType: "json",
            success: function (data) {
                var jsdata = data.d;
                HidePleaseWait();
                var data2Treat = jQuery.parseJSON(jsdata);
                if (data2Treat !== -1) {
                    if (data2Treat === 0) {
                        //MsgErrorPopUp('ERREUR','Toutes les lignes sont déjà livrées, vous ne pouvez plus créer de bon de livraison !');
                        MsgPopUpWithResponseChoice('ERREUR', 'Toutes les lignes sont déjà livrées, vous ne pouvez plus créer de bon de livraison !', 'Consulter les BL', 'goToDeliveryFormList(1)');
                    }
                    else if (data2Treat === -2) {
                        MsgErrorPopUp('ERREUR', 'Veuillez ajouter des lignes de commande, ensuite, créer de bon de livraison !');
                    }
                    else {
                        if (data2Treat === 3) {
                            //                            MsgPopUpWithResponseChoice('CONFIRMATION', 'Veuillez confirmer la création de Bon de livraison, une fois vous le créez, toutes les lignes de commande ne sont plus modifiées !', 'Créer', 'createDfo()', 'Annuler');
                            MsgPopUpCreateDfo('Veuillez confirmer la création de Bon de livraison, une fois vous le créez, toutes les lignes de commande ne sont plus modifiées !');
                        } else {
                            //createDfo();

                            MsgPopUpCreateDfo('Veuillez sélectionner un mode de création');
                        }
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

function MsgPopUpCreateDfo(msg) {
    var title = 'CONFIRMATION';
    //var msg = 'Veuillez confirmer la création de Bon de livraison, une fois vous le créez, toutes les lignes de commande ne sont plus modifiées !';
    var content = "<div class='box'><div class='box-body'>" +
        "<div class='form-horizontal'>" +
        "<div class='col-md-12'>" +
        "<div class='form-group'>" +
        "<div class='col-sm-12' style='text-align:center;font-size: 18pt;'>" + msg + "</div></div></div></div></div>" +
        "<div class='modal-footer center'>" +
        "<button type='button' class='btn btn-default' onclick='closeDialog()'>Annuler</button><br/><br/>" +
        "<button type='button' class='btn btn-inverse' onclick='createDfo()'>Créer un BL</button><br/><br/>" +
        //"<button type='button' class='btn btn-inverse' onclick='createDfo()'>Créer un BL avec une adresse existante</button><br/><br/>" +
        //"<button type='button' class='btn btn-inverse' onclick='createDfoWithEmptyAdr()'>Créer un BL avec une adresse vide</button>" +
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
            var h = (w - b) * 0.3;
            return h + "px";
        }
    }).find('.modal-header').css({
        //'background-color': '#d2322d',
        'background': 'url(../../img/menu_005_bg.jpg) repeat-x',
        'text-align': 'center',
        'color': '#C0C0C0'
    });
    return false;
}

function createDfoWithEmptyAdr() {
    ShowPleaseWait();
    var codId = getUrlVars()['codId'];
    var url = '../DeliveryForm/DeliveryForm.aspx?codId=' + codId + "&mode=create&epadr=1";
    document.location = url;
    return false;
}