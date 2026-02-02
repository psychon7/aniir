$(document).ready(init);

function init() {
    ShowPleaseWait();
    getCurrentSoc();
    $.each($('.datepicker'), function (idx, value) {
        $(value).datepicker();
    });
    //$('#CodDateCreationFrom').val(firstDayOfYear());
    $('#CodDateCreationFrom').val(firstDayInPreviousMonths(3));
    $('#CodDateCreationTo').val(getToday());

    setAutoCompleteClient();
    SetLanguageBar();
}


function createClientOrder() {
    window.location = 'ClientOrder.aspx';
}

var hasSet = false;

function jsSearchCpl() {
    myApp.showPleaseWait();
    var order = Object();
    order.PrjName = $('#PrjName').val().trim();
    order.PrjCode = $('#PrjCode').val().trim();
    order.CodName = $('#CodName').val().trim();
    order.CodCode = $('#CodCode').val().trim();
    //order.ClientCompanyName = $('#ClientCompanyName').val().trim();
    order.ClientCompanyName = $('#ClientList').val().trim();
    order.CplName = $('#CplName').val().trim();
    order.CplCode = $('#CplCode').val().trim();
    order.Inv_CcoFirstname = $('#CcoName').val().trim();
    order._dCreationString = $('#CodDateCreationFrom').val();
    order._dUpdateString = $('#CodDateCreationTo').val();
    order.CodInterComment = $('#keyword').val();
    order.CodKeyProject = $('#CodKeyProject').is(':checked');


    var jsondata = JSON.stringify({ oneCod: order });
    var url = window.webservicePath + "/SearchClientOrder";
    $.ajax({
        type: "POST",
        url: url,
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        data: jsondata,
        success: function(data) {
            var jsdata = data.d;
            var data2Treat = jQuery.parseJSON(jsdata);
            if (data2Treat !== '-1') {

                if (data2Treat.length === 0) {
                    NoResultMsg();
                }
                var headerFooter = "<tr>" +
                    "<th class='language_txt'>D. C.</th>" +
                    (currentSoc.DpUpd && connectedUser.LoginMode === 1 ? "<th class='language_txt'>D. M.</th>" : "")
                    +
                    "<th class='language_txt'>Code</th>" +
                    "<th class='language_txt'>Nom</th>" +
                    "<th class='language_txt'>Raison sociale</th>" +
                    //"<th>Contact</th>" +
                    "<th class='language_txt'>Nom du devis</th>" +
                    "<th class='language_txt'>Nom de l'affaire</th>" +
                    "<th class='language_txt'>Montant HT</th>" +
                    "<th style='width: 30%;'>Lignes</th>" +
                    "<th class='language_txt'>BL</th>" +
                    "<th class='language_txt'>FAC</th>" +
                    "<th class='language_txt'>Créateur/Commerciaux</th>" +
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
                    titles.push({ "sTitle": "CreateDate" });
                    if (currentSoc.DpUpd && connectedUser.LoginMode === 1) {
                        titles.push({ "sTitle": "ModifyDate" });
                    }
                    titles.push({ "sTitle": "Code" });
                    titles.push({ "sTitle": "Nom" });
                    titles.push({ "sTitle": "Raison sociale" });
                    //titles.push({ "sTitle": "Contact" });
                    titles.push({ "sTitle": "Nom du devis" });
                    titles.push({ "sTitle": "Nom de l'affaire" });
                    titles.push({ "sTitle": "Montant HT" });
                    titles.push({ "sTitle": "Lines" });
                    titles.push({ "sTitle": "BL" });
                    titles.push({ "sTitle": "FAC" });
                    titles.push({ "sTitle": "Créateur-Commerciaux" });


                    var displaycount = 1;
                    $.each(data2Treat, function(name, value) {
                        $('#mask_processing').text('Traitement en cours ' + displaycount + '/' + resultcount);
                        $('#mask_processing').val('Traitement en cours ' + displaycount + '/' + resultcount);
                        var dataArray = new Array();
                        dataArray.push("<span  onclick='viewClientOrder(\"" + value.FId + "\")' style='cursor:pointer;font-weight:bolder;'>" + getDateString(value.CodDateCreation) + "</span>");
                        if (currentSoc.DpUpd && connectedUser.LoginMode === 1) {
                            dataArray.push("<span  onclick='viewClientOrder(\"" + value.FId + "\")' style='cursor:pointer;font-weight:bolder;'>" + getDateString(value.CodDateUpdate) + "</span>");
                        }
                        dataArray.push("<span  onclick='viewClientOrder(\"" + value.FId + "\")' style='cursor:pointer;font-weight:bolder;'>" + value.CodCode + "</span>");
                        dataArray.push("<span  onclick='viewClientOrder(\"" + value.FId + "\")' style='cursor:pointer;font-weight:bolder;'>" + value.CodName + "</span>");
                        var companyname = value.ClientCompanyName + (IsNullOrEmpty(value.CliAbbr) ? "" : ("-" + value.CliAbbr));
                        dataArray.push(companyname);
                        //dataArray.push(value.Inv_CcoFirstname + " " + value.Inv_CcoLastname + "<br/>" + value.Dlv_CcoFirstname + " " + value.Dlv_CcoLastname);
                        dataArray.push(value.CplName);
                        dataArray.push(value.PrjName);
                        dataArray.push(value.CodAmount + " " + value.CurrencySymbol);

                        // 20231111
                        var oneline = '';
                        if (value.ClientOrderLines.length > 0) {
                            $.each(value.ClientOrderLines, function (onename, onecln) {
                                oneline += (onecln.ColLevel1 + "." + onecln.ColLevel2 + "→ " + onecln.ColPrdName + "→ " + onecln.ColQuantity + " * " + onecln.ColPriceWithDiscountHt + " " + value.CurrencySymbol + " = H.T. " + onecln.ColTotalPrice.toFixed(2) + " " + value.CurrencySymbol + " = T.T.C. " + onecln.ColTotalCrudePrice.toFixed(2) + " " + value.CurrencySymbol + "<br/>");
                            });
                        }
                        dataArray.push(oneline);


                        dataArray.push(value.DflCount);
                        dataArray.push(value.CinCount);
                        var creatorandcommercial = "";
                        creatorandcommercial += 'C:' + value.Creator.FullName;
                        if (value.UsrCommercial1) {
                            creatorandcommercial += '<br/>' + 'C1:' + value.UsrCommercial1;
                        }
                        if (value.UsrCommercial2) {
                            creatorandcommercial += '<br/>' + 'C2:' + value.UsrCommercial2;
                        }
                        if (value.UsrCommercial3) {
                            creatorandcommercial += '<br/>' + 'C3:' + value.UsrCommercial3;
                        }
                        dataArray.push(creatorandcommercial);
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
                var list = $(".language_txt");

                myApp.hidePleaseWait();
                SetLanguageBar();


            } else {
                // authentication error
                AuthencationError();

                myApp.hidePleaseWait();
            }
        },
        error: function(data) {
            var test = '';
            myApp.hidePleaseWait();
        }
    });
    return false;
}

function viewClientOrder(fId) {
    //ShowPleaseWait();
    var url = 'ClientOrder.aspx?codId=' + fId + "&mode=view";
    //document.location = url;

    var win = window.open(url, '_blank');
    win.focus();
    return false;
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
            if (!jQuery.isEmptyObject(connectedUser) && connectedUser.LoginMode === 1) {
                $('#div_for_keyprj').show();
            }
            else {
                $('#div_for_keyprj').hide();
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
