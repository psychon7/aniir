function createCostPlan() {
    window.location = 'CostPlan.aspx';
}

$(document).ready(init);

function init() {
    $.each($('.datepicker'), function(idx, value) {
        $(value).datepicker();
    });
    ShowPleaseWait();
    get_status();
    //$('#CplDateCreationFrom').val(firstDayOfYear());
    $('#CplDateCreationFrom').val(firstDayInPreviousMonths(3));
    $('#CplDateCreationTo').val(getToday());

    setAutoCompleteClient();
    SetLanguageBar();
}

function get_status() {
    var url = window.webservicePath + "/GetCplStatus";
    var budgetId = '#CstId';
    $.ajax({
        type: "POST",
        url: url,
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        success: function(data) {
            var jsdata = data.d;
            var data2Treat = jQuery.parseJSON(jsdata);
            if (data2Treat !== '-1') {
                $(budgetId).empty();
                $(budgetId).append($("<option></option>").attr("value", '0').attr("selected", true).text('Tous les statuts'));
                $.each(data2Treat, function(name, value) {
//                    if (value.Key === 1) {
//                        $(budgetId).append($("<option></option>").attr("value", value.Key).attr("selected", true).text(value.Value));
//                    } else {
                        $(budgetId).append($("<option></option>").attr("value", value.Key).text(value.Value));
                    //}
                });
                //HidePleaseWait();
                getCurrentSoc();
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


var hasSet = false;
function jsSearchCpl() {
    myApp.showPleaseWait();
    var PrjName = $('#PrjName').val().trim();
    var PrjCode = $('#PrjCode').val().trim();
    //var ClientCompanyName = $('#ClientCompanyName').val().trim();
    var ClientCompanyName = $('#ClientList').val().trim();

    var CplName = $('#CplName').val().trim();
    var CplCode = $('#CplCode').val().trim();
    var CcoName = $('#CcoName').val().trim();
    var keyword = $('#keyword').val().trim();
    var cstId = $('#CstId').val() * 1;
    var flag = "";
    var comment = "";
    var dateFrom = $('#CplDateCreationFrom').val();
    var dateTo = $('#CplDateCreationTo').val();
    var fromsite = $('#cbx_from_site')[0].checked;
    var isKeyprj = false;

    if (!jQuery.isEmptyObject(connectedUser) && connectedUser.LoginMode === 1) {
        var btnSelectStar = $('#btnSelectStar');
        if (btnSelectStar.attr('id')) {
            var btnclass = $('#btnSelectStar').attr('class');
            btnclass = replaceAll(btnclass, 'btn', '');
            btnclass = replaceAll(btnclass, '-', '');
            flag = replaceAll(btnclass, ' ', '');
            if (flag === 'default') {
                flag = "";
            }
            isKeyprj = $('#CplKeyProject').is(':checked');
        }
        var ipcomment = $('#ipComment');
        if (ipcomment.attr('id')) {
            comment = ipcomment.val();
        }
    }

    var jsondata = JSON.stringify({
        prjName: PrjName,
        prjCode: PrjCode,
        clientName: ClientCompanyName,
        CplName: CplName,
        CplCode: CplCode,
        CcoName: CcoName,
        cstId: cstId,
        flag: flag,
        comment: comment,
        dateFrom: dateFrom,
        dateTo: dateTo,
        keyword: keyword,
        fromsite: fromsite,
        isKeyprj: isKeyprj
    });
    var url = window.webservicePath + "/SearchCostPlan";
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
                var thSuperMode = "";
                if (!jQuery.isEmptyObject(connectedUser) && connectedUser.LoginMode === 1) {
                    thSuperMode = "<th></th>";
                }
                var headerFooter = "<tr>" +
                    "<th><input type='checkbox' onclick='selectAllCostPlans(this)'/></th>" +
                    "<th>D. C.</th>" +
                    (currentSoc.DpUpd && connectedUser.LoginMode === 1 ? "<th>D. M.</th>" : "")
                    +
                    "<th>Nom du devis</th>" +
                    "<th>Code du devis</th>" +
                    "<th>Raison sociale</th>" +
                    //"<th>Contact</th>" +
                    "<th>Nom du projet</th>" +
                    "<th>Code du projet</th>" +
                    "<th>Montant HT</th>" +
                    "<th>Montant (Facturé) HT</th>" +
                    "<th style='width:30%'>Lignes</th>" +
                    "<th>Status</th>" +
                    "<th>Créateur/Commerciaux</th>" +
                    thSuperMode +
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
                    titles.push({ "sTitle": "Check" });
                    titles.push({ "sTitle": "CreationDate" });
                    if (currentSoc.DpUpd && connectedUser.LoginMode === 1) {
                        titles.push({ "sTitle": "modificationDate" });
                    }
                    titles.push({ "sTitle": "Nom du devis" });
                    titles.push({ "sTitle": "Code du devis" });
                    titles.push({ "sTitle": "Raison sociale" });
                    //titles.push({ "sTitle": "Contact" });
                    titles.push({ "sTitle": "Nom du projet" });
                    titles.push({ "sTitle": "Code du projet" });
                    titles.push({ "sTitle": "Montant HT" });
                    titles.push({ "sTitle": "Montant (Facturé) HT" });
                    titles.push({ "sTitle": "Lines" });
                    titles.push({ "sTitle": "Status" });
                    titles.push({ "sTitle": "Créateur-Commerciaux" });
                    if (!jQuery.isEmptyObject(connectedUser) && connectedUser.LoginMode === 1) {
                    titles.push({ "sTitle": "Comment" });
                    }


                    var displaycount = 1;
                    
                    $.each(data2Treat, function (name, value) {
                        var color = value.CplFromSite ? 'color:#0077FF' : '';
                        $('#mask_processing').text('Traitement en cours ' + displaycount + '/' + resultcount);
                        $('#mask_processing').val('Traitement en cours ' + displaycount + '/' + resultcount);
                        var dataArray = new Array();
                        dataArray.push("<input type='checkbox' style='" + color + "' id='cbx_trait_cpl_" + value.CplId + "' cplid='" + value.CplId + "' onclick='displayCostPlanButton()'/>");
                        dataArray.push("<span  onclick='viewCostPlan(\"" + value.FId + "\")' style='cursor:pointer;font-weight:bolder;" + color + "'>" + getDateString(value.CplDateCreation) + "</span>");
                        if (currentSoc.DpUpd && connectedUser.LoginMode === 1) {
                            dataArray.push("<span  onclick='viewCostPlan(\"" + value.FId + "\")' style='cursor:pointer;font-weight:bolder;" + color + "'>" + getDateString(value.CplDateUpdate) + "</span>");
                        }
                        dataArray.push("<span  onclick='viewCostPlan(\"" + value.FId + "\")' style='cursor:pointer;font-weight:bolder;" + color + "'>" + value.CplName + "</span>");
                        dataArray.push("<span  onclick='viewCostPlan(\"" + value.FId + "\")' style='cursor:pointer;font-weight:bolder;" + color + "'>" + value.CplCode + "</span>");
                        //dataArray.push(value.CplCode);
                        var companyname = value.ClientCompanyName + (IsNullOrEmpty(value.CliAbbr) ? "" : ("-" + value.CliAbbr));
                        dataArray.push(companyname);
                        //dataArray.push(value.Inv_CcoFirstname + " " + value.Inv_CcoLastname + "<br/>" + value.Dlv_CcoFirstname + " " + value.Dlv_CcoLastname);
                        dataArray.push(value.PrjName);
                        dataArray.push(value.PrjCode);
                        dataArray.push(value.CplAmount + " " + value.CurrencySymbol);
                        dataArray.push( IsNullOrEmpty(value.CplInvoicedAmount) ? "":  (value.CplInvoicedAmount+ " " + value.CurrencySymbol));
                        // 20231111 添加cln行

                        var oneline = '';
                        if (value.CostPlanLines.length > 0) {
                            $.each(value.CostPlanLines, function(onename, onecln) {
                                oneline += (onecln.ClnLevel1 + "." + onecln.ClnLevel2 + "→ " + onecln.ClnPrdName + "→ " + onecln.ClnQuantity + " * " + onecln.ClnPriceWithDiscountHt + " " + value.CurrencySymbol + " = H.T. " + onecln.ClnTotalPrice.toFixed(2) + " " + value.CurrencySymbol + " = T.T.C. " + onecln.ClnTotalCrudePrice.toFixed(2) + " " + value.CurrencySymbol + "<br/>");
                            });
                        }
                        dataArray.push(oneline);

                        dataArray.push(value.CostPlanStatut);
                        var creatorandcommercial = "";
                        creatorandcommercial += 'C:'+value.Creator.FullName;
                        if (value.UsrCommercial1) {
                            creatorandcommercial += '<br/>' + 'C1:'+value.UsrCommercial1;
                        }
                        if (value.UsrCommercial2) {
                            creatorandcommercial += '<br/>' + 'C2:'+value.UsrCommercial2;
                        }
                        if (value.UsrCommercial3) {
                            creatorandcommercial += '<br/>' + 'C3:'+value.UsrCommercial3;
                        }
                        dataArray.push(creatorandcommercial);
                        if (!jQuery.isEmptyObject(connectedUser) && connectedUser.LoginMode === 1) {
                            if (value.UserFlag && value.UserComment) {
                                var btnwithcomment = "<button onclick='return false' type='button' class='btn btn-" + value.UserFlag + "'>" + value.UserComment + "</button>";
                                dataArray.push(btnwithcomment);
                            } else {
                            dataArray.push("");
                            }
                        }
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


function selectAllCostPlans(sender) {
    var ischecked = $(sender).is(':checked');
    var cpls = $("input[id^='cbx_trait_cpl_']");
    $.each(cpls, function(name, value) {
        $(value).prop('checked',ischecked);
    });
    displayCostPlanButton();
}

function displayCostPlanButton() {
    var cpls = $("input[id^='cbx_trait_cpl_']:checked").length > 0;
    if (cpls) {
        $('#btn_exportPdf_costplan').show();
    } else {
        $('#btn_exportPdf_costplan').hide();
    }
}

function ExportCplsPdf() {
    var cplIds = '';
    var cplsChecked = $("input[id^='cbx_trait_cpl_']:checked");
    $.each(cplsChecked, function(name, value) {
        var cplid = $(value).attr('cplid') * 1;
        cplIds += (cplid + ',');
    });
    if (cplIds) {
        var jsondata = JSON.stringify({ cplIds: cplIds });
        var url = window.webservicePath + "/GenerateCostPlanPdf";
        myApp.showPleaseWait();
        $.ajax({
            url: url,
            type: 'POST',
            contentType: 'application/json; charset=utf-8',
            data: jsondata,
            dataType: 'json',
            success: function(data) {
                myApp.hidePleaseWait();
                var url = "../Common/PageDownLoad.aspx?hascplIds=true";
                var win = window.open(url, '_blank');
                if (win) {
                    //Browser has allowed it to be opened
                    win.focus();
                } else {
                    //Browser has blocked it
                    alert('Please allow popups for this website');
                }
            },
            error: function(data) {
                myApp.hidePleaseWait();
            }
        });
    }
    return false;
}

function viewCostPlan(fId) {
    //ShowPleaseWait();
    var url = 'CostPlan.aspx?cplId=' + fId + "&mode=view";
    //document.location = url;
    
    var win = window.open(url, '_blank');
    win.focus();
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


function setCplSearchField() {
    if (!jQuery.isEmptyObject(connectedUser) && connectedUser.LoginMode === 1) {
        var lbStar = "<label class='col-sm-1 control-label'>Drapeau</label>";
        var btnSelectStar = "<div class='col-sm-2 center'>" +
            "<button type='button' class='btn btn-default' id='btnSelectStar' onclick='return SetFlagClick()'>Drapeau couleur</button>" +
            "</div>";
        var lbComment = "<label class='col-sm-1 control-label'>Commentaire</label>";
        var ipComment = "<div class='col-sm-2 center'>" +
            "<input type='text' class='form-control' id='ipComment' />" +
            "</div>";


        var lbKeyPrj = "<label class='col-sm-1 control-label' style='color:red;'>Projet important</label>";
        var btnKeyPrj = "<div class='col-sm-2 center'>" +
            "<input class='form-control' type='checkbox' id='CplKeyProject' name='CplKeyProject' />" +
            "</div>";
        $('#divCommentSearchFields').append(lbStar);
        $('#divCommentSearchFields').append(btnSelectStar);
        $('#divCommentSearchFields').append(lbComment);
        $('#divCommentSearchFields').append(ipComment);
        $('#divCommentSearchFields').append(lbKeyPrj);
        $('#divCommentSearchFields').append(btnKeyPrj);
    }
}



function SetFlagClick() {
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
            "<div class='col-sm-4 center'><button type='button' class='btn btn-danger' onclick='return SetFlagButton(this)'><i class='fa fa-star'></i></button></div>" +
            "<div class='col-sm-4 center'><button type='button' class='btn btn-purple' onclick='return SetFlagButton(this)'><i class='fa fa-star'></i></button></div>" +
            "<div class='col-sm-4 center'><button type='button' class='btn btn-pink' onclick='return SetFlagButton(this)'><i class='fa fa-star'></i></button></div>" +
            "</div>" +
            "<div class='form-group'>" +
            "<div class='col-sm-4 center'><button type='button' class='btn btn-yellow' onclick='return SetFlagButton(this)'><i class='fa fa-star'></i></button></div>" +
            "<div class='col-sm-4 center'><button type='button' class='btn btn-info' onclick='return SetFlagButton(this)'><i class='fa fa-star'></i></button></div>" +
            "<div class='col-sm-4 center'><button type='button' class='btn btn-primary' onclick='return SetFlagButton(this)'><i class='fa fa-star'></i></button></div>" +
            "</div>" +
            "<div class='form-group'>" +
            "<div class='col-sm-4 center'><button type='button' class='btn btn-success' onclick='return SetFlagButton(this)'><i class='fa fa-star'></i></button></div>" +
            "<div class='col-sm-4 center'><button type='button' class='btn btn-file' onclick='return SetFlagButton(this)'><i class='fa fa-star'></i></button></div>" +
            "<div class='col-sm-4 center'><button type='button' class='btn btn-inverse' onclick='return SetFlagButton(this)'><i class='fa fa-star'></i></button></div>" +
            "</div>" +
    // close box
            "</div></div></div></div></div>";
    var removeBtn = "<div class='form-group center'><button type='button' class='btn btn-default' onclick='return closeDialog()'>Clôturer</button>" +
        "<button type='button' class='btn btn-inverse' remove='remove' onclick='return SetFlagButton(this)'>Enlever le drapeau</button></div>";
    onecontent = startBox + onelineContent + removeBtn + endBox;

    var title = 'DRAPEAU COULEUR';
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

function SetFlagButton(sender) {
    var btnclass = $(sender).attr('class');
    btnclass = replaceAll(btnclass, 'btn', '');
    btnclass = replaceAll(btnclass, '-', '');
    btnclass = replaceAll(btnclass, ' ', '');
    var remove = $(sender).attr('remove') === 'remove';
    if (remove) {
        $('#btnSelectStar').removeAttr('class');
        $('#btnSelectStar').addClass('btn btn-default');
    } else {
        $('#btnSelectStar').removeAttr('class');
        $('#btnSelectStar').addClass('btn btn-' + btnclass);
    }
}

var currentSoc = {};
function getCurrentSoc() {
    var url = window.webservicePath + "/GetCurrentSociety";
    $.ajax({
        type: "POST",
        url: url,
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        success: function (data) {
            HidePleaseWait();
            var jsdata = data.d;
            var data2Treat = jQuery.parseJSON(jsdata);
            currentSoc = data2Treat;
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
