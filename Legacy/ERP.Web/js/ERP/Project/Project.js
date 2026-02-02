$(document).ready(init);

function init() {
    //js_getClient('Client');
    setAutoCompleteClient();
    js_getAllTVA('VatId');
    js_GetPaymentCondition('PcoId');
    js_GetPaymentMode('PmoId');
    $.each($('.datepicker'), function (idx, value) {
        $(value).datepicker();
    });

    loadProject();
    initMode();
    setDeafaultValues();
    getCurrentSoc();

    SetLanguageBar();
}

var allclient = [];



function setDeafaultValues() {
    if (_isCreate) {
        var now = new Date();
        $('#_dCreationString').val(dateToDMY(now));
        $('#_dUpdateString').val(dateToDMY(now));
    }
}

function js_getClient(elementId) {
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
                $.each(data2Treat, function (name, value) {
                    $(budgetId)
                        .append($("<option></option>")
                            .attr("data-value", value.FId)
                            .attr("value", value.CompanyName));
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


var selectedClient = {};

function CreateUpdateProject() {
    var checkOK = CheckRequiredFieldInOneDiv('div_project') && (seltectedClientId !== 0);
    var prjId = getParameterByName('prjId');
    if (checkOK) {
        var PrdName = $('#PrjName').val();
        var CliId = selectedClient.Id !== undefined ? (selectedClient.Id * 1) : 0;
        var ClientCompanyName = $('#ip_Client').val();
        var VatId = $('#VatId').val();
        var PcoId = $('#PcoId').val();
        var PmoId = $('#PmoId').val();
        var FId = prjId;
        var PrjHeaderText = $('#PrjHeaderText').val();
        var PrjFooterText = $('#PrjFooterText').val();
        var PrjClientComment = $('#PrjClientComment').val();
        var PrjInterComment = $('#PrjInterComment').val();
        var _dCreationString = $('#_dCreationString').val();
        var _dUpdateString = $('#_dUpdateString').val();

        //        PrjDUpdate = PrjDUpdate ? PrjDUpdate : new Date().toUTCString(); ;
        //        PrjDCreation = PrjDCreation ? PrjDCreation : new Date().toUTCString();

        //        _dCreationString = dateTimeNowForCSharp();
        //        _dUpdateString = dateTimeNowForCSharp();

        var onePrj = {};
        onePrj.PrjName = PrdName;
        onePrj.CliId = seltectedClientId; //CliId;
        onePrj.FId = FId;
        onePrj.ClientCompanyName = ClientCompanyName;
        onePrj.PcoId = PcoId;
        onePrj.PmoId = PmoId;
        onePrj.VatId = VatId;
        onePrj.PrjHeaderText = PrjHeaderText;
        onePrj.PrjFooterText = PrjFooterText;
        onePrj.PrjClientComment = PrjClientComment;
        onePrj.PrjInterComment = PrjInterComment;
        onePrj._dCreationString = _dCreationString;
        onePrj._dUpdateString = _dUpdateString;
        ShowPleaseWait();
        var jsondata = JSON.stringify({ oneProject: onePrj });
        $.ajax({
            url: 'Project.aspx/CreateUpdateProject',
            type: 'POST',
            contentType: 'application/json; charset=utf-8',
            data: jsondata,
            dataType: 'json',
            success: function(data) {
                var prdId = data.d;
                var url = window.location.href.split('?')[0];
                var newUrl = url + '?prjId=' + prdId + '&mode=view';
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

var currentProject = [];

function loadProject() {
    var prjId = getParameterByName('prjId');
    if (prjId) {
        var url = window.webservicePath + "/LoadProjectByIdWithRight";
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
                if (data2Treat !== '-1' && !jQuery.isEmptyObject(data2Treat)) {
                    var onePrj = data2Treat;
                    currentProject = [];
                    currentProject = onePrj;
                    setFieldValue('PrjName', onePrj.PrjName);
                    setFieldValue('PrjCode', onePrj.PrjCode);
                    setFieldValue('_dCreationString', onePrj.PrjDCreation, null, true, true);
                    setFieldValue('_dUpdateString', onePrj.PrjDUpdate, null, undefined, true);
                    setFieldValue('ClientList', onePrj.ClientCompanyName);
                    selectedClient.Id = onePrj.CliId;
                    seltectedClientId = onePrj.CliId;
                    //setFieldValue('Client', onePrj.CliId);
                    setFieldValue('PcoId', onePrj.PcoId);
                    setFieldValue('PmoId', onePrj.PmoId);
                    setFieldValue('VatId', onePrj.VatId);
                    setFieldValue('PrjHeaderText', onePrj.PrjHeaderText);
                    setFieldValue('PrjFooterText', onePrj.PrjFooterText);
                    setFieldValue('PrjClientComment', onePrj.PrjClientComment);
                    setFieldValue('PrjInterComment', onePrj.PrjInterComment);
                    setClickableLabel();
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
    window.location = 'SearchProject.aspx';
}

function delete_project_confirm() {
    var title = "ATTENTION";
    var content = "<div class='box'><div class='box-body' style='height: 100px;'>" +
        "<div class='form-horizontal'>" +
        "<div class='col-md-12'>" +
        "<div class='form-group'>" +
        "<div class='col-sm-12' style='text-align:center;font-size: 18pt;'>Veuillez confirmer la suppression ! " +
        "<br/>La suppression est irrécupérable, veuillez confirmer !!!</div></div></div></div></div></div>"
        + "<div class='modal-footer center'>" +
        "<button type='button' class='btn btn-default' onclick='closeDialog()'>Annuler</button>" +
        "<button type='button' class='btn btn-inverse' onclick='return delete_Project();'>SUPPRIMER</button></div>";
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

function delete_Project() {
    myApp.showPleaseWait();
    var prjId = getParameterByName('prjId');
    if (prjId) {
        var url = window.webservicePath + "/DeleteProject";
        var datastr = "{prjId:'" + prjId + "'}";
        $.ajax({
            type: "POST",
            url: url,
            contentType: "application/json; charset=utf-8",
            data: datastr,
            dataType: "json",
            success: function (data) {
                var jsdata = data.d;
                if (jsdata) {
                    window.location = 'SearchProject.aspx';
                } else {
                    // authentication error
                    MsgErrorPopUp('Suppression erreur', 'DATA IN USE');
                    //AuthencationError();
                }
            },
            error: function (data) {
                var test = '';
            }
        });
    }
    return false;

}


function ExternLinkClick(sender) {
    if (_isView && currentProject) {
        ExternLinkBaseClick(sender, currentProject);
        //        var page = $(sender).attr('pgid');
        //        var flid = $(sender).attr('flid');
        //        var par = $(sender).attr('prms');
        //        var etid = $(sender).attr('etid');
        //        var id = currentProject[etid];
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
    }
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
                                label: item.Value,
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
            selectedClient = data;
            $('#VatId').val(selectedClient.VatId);
            $('#PcoId').val(selectedClient.PcoId);
            $('#PmoId').val(selectedClient.PmoId);
        } else {
            selectedClient = {};
        }
    });
}

function js_clientChange(sender) {
var value = $(sender).val().trim();
    if (IsNullOrEmpty(value)) {
        seltectedClientId = 0;
    }
    return false;
//    var clientCompany = $(sender).val();
//    var oneclient = searchFieldValueInArray(allclient, 'CompanyName', clientCompany);
//    if (oneclient.Id !== undefined) {
//        $('#VatId').val(oneclient.VatId);
//        $('#PcoId').val(oneclient.PcoId);
//        $('#PmoId').val(oneclient.PmoId);
//        selectedClient = oneclient;
//    } else {
//        selectedClient = {};
//    }
}