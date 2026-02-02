$(document).ready(init);

function init() {
    ShowPleaseWait();
    setAutoCompleteClient();
    //js_getClient('Client');
    getCom();
    $.each($('.datepicker'), function(idx, value) {
        $(value).datepicker();
    });
    setDefautDate();

    SetLanguageBar();
}

function setDefautDate() {
    $('#CinDateInvoice').val(firstDayInPreviousMonth());
    $('#CinDateFin').val(LastDayInPreviousMonth());
}

var ClientIdeSelected = 0;
//var sodList= [];
function setAutoCompleteClient() {
    var url = window.webservicePath + "/SearchClientByName";
    //var cliFId = $('#cinClient :selected').attr('data-value');
    $("#ClientCompanyName").autocomplete({
        source: function(request, response) {
            $.ajax({
                url: url,
                data: "{ 'client': '" + request.term + "'}",
                dataType: "json",
                type: "POST",
                contentType: "application/json; charset=utf-8",
                success: function(data) {
                    ClientIdeSelected = 0;
                    var jsdata = data.d;
                    var data2Treat = jQuery.parseJSON(jsdata);
                    allclient = [];
                    allclient = data2Treat;
                    if (data2Treat.length > 0) {
                        response($.map(data2Treat, function(item) {
                            return {
                                label: item.Value ,
                                val: item.Key,
                            }
                        }));
                    } else {
                    ClientIdeSelected = 0;
                    }
                },
                error: function(response) {
//                    alert(response.responseText);
//                    console.log(response);
                },
                failure: function(response) {
                    alert(response.responseText);
                }
            });
        },
        select: function(e, i) {
            ClientIdeSelected = i.item.val;
        },
        minLength: 2
    });
}

var allclient = [];
//function js_getClient(elementId) {
//    var url = window.webservicePath + "/GetAllClients";
//    var budgetId = '#' + elementId;
//    $.ajax({
//        type: "POST",
//        url: url,
//        contentType: "application/json; charset=utf-8",
//        dataType: "json",
//        success: function (data) {
//            HidePleaseWait();
//            var jsdata = data.d;
//            var data2Treat = jQuery.parseJSON(jsdata);
//            if (data2Treat !== '-1') {
//                $(budgetId).empty();
//                allclient = [];
//                allclient = data2Treat;
//                $(budgetId).empty();
//                //$(budgetId).append($("<option></option>").attr("value", '0').text('Sélectionner un client'));
//                $.each(data2Treat, function (name, value) {
//                    $(budgetId)
//                        .append($("<option></option>")
//                            .attr("data-value", value.FId)
//                            .attr("value", value.CompanyName));
//                });
//            } else {
//                // authentication error
//                AuthencationError();
//            }
//        },
//        error: function (data) {
//            HidePleaseWait();
//            var test = '';
//        }
//    });
//}

function js_clientLostFocus(sender) {
    var clientCompany = $(sender).val();
//    var oneclient = searchFieldValueInArray(allclient, 'CompanyName', clientCompany);
//    if (!(oneclient && oneclient.Id !== undefined)) {
//        selectedClient = {};
//    }
    if (IsNullOrEmpty(clientCompany)) {
    ClientIdeSelected = 0;
    }
    ClientChange();
}

var selectedClient = {};
function js_clientChange(sender) {
    var clientCompany = $(sender).val();
//    var oneclient = searchFieldValueInArray(allclient, 'CompanyName', clientCompany);
//    if (oneclient && oneclient.Id !== undefined) {
//        selectedClient = oneclient;
//    }
    if (IsNullOrEmpty(clientCompany)) {
    ClientIdeSelected = 0;
    }
    ClientChange();
}

function ClientChange() {
    $('#btn_get_pdf').hide();
    $('#btn_get_pdf_bl').hide();
    $('#btn_excel').hide();
    $('#btn_get_pdf_withoutcin').hide();
}

function GetPdf() {
    var cliId = ClientIdeSelected;
    if (!cliId || cliId === 0) {
        cliId = 0;
    }
    var datecin = $('#CinDateInvoice').val();
    var enddate = $('#CinDateFin').val();
    var comId = $('#UsrCom1 option:selected').val() * 1;
    if (enddate && datecin) {
        cliId = encodeURIComponent(cliId);
        window.open('../Common/PageDownLoad.aspx?cliId=' + cliId + '&datetime=' + datecin + '&enddate=' + enddate + '&comId=' + comId, '_blank');
        return false;
    } else {
        MsgErrorPopUp('Attention', 'Les dates de facture (du/au) sont obligatoires !!!');
    }
}

function GetPdfWithoutCin() {
    var cliId = ClientIdeSelected;
    if (!cliId || cliId === 0) {
        cliId =0;
    }
    var datecin = $('#CinDateInvoice').val();
    var enddate = $('#CinDateFin').val();
    var comId = $('#UsrCom1 option:selected').val() * 1;
    if (enddate && datecin) {
        cliId = encodeURIComponent(cliId);
        window.open('../Common/PageDownLoad.aspx?cliId=' + cliId + '&datetime=' + datecin + '&enddate=' + enddate + '&comId=' + comId+'&SCin=1', '_blank');
        return false;
    } else {
        MsgErrorPopUp('Attention', 'Les dates de facture (du/au) sont obligatoires !!!');
    }
}


function GetBLPdf() {
    var cliId = ClientIdeSelected;
    if (!cliId || cliId === '0') {
        cliId = '';
    }
    var datecin = $('#CinDateInvoice').val();
    var enddate = $('#CinDateFin').val();
    if (enddate && datecin) {
        cliId = encodeURIComponent(cliId);
        window.open('../Common/PageDownLoad.aspx?cliId=' + cliId + '&getbl=1&datetime=' + datecin, '_blank');
        return false;
    } else {
        MsgErrorPopUp('Attention', 'Les dates de facture (du/au) sont obligatoires !!!');
    }
}

var allcininfo = [];
function jsSearch() {
    //var cliId = $('#ClientCompanyName option:selected').val();
    var cliId = ClientIdeSelected;
    allcininfo = [];
    //console.log(selectedClient);
    if (!cliId || cliId === 0) {
        cliId = 0;
    }
    //console.log(cliId);
    var datecin = $('#CinDateInvoice').val();
    var enddate = $('#CinDateFin').val();
    var comId = $('#UsrCom1 option:selected').val() * 1;
    //console.log(datecin);
    if (datecin && enddate) {
        ShowPleaseWait();
        var url = window.webservicePath + "/GetClientInvoiceStatmentByClient";
        var jsondata = JSON.stringify({ cliId: cliId, month: datecin, enddate: enddate, comId: comId, forCsv: false });
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
                    allcininfo = [];
                    allcininfo = data2Treat;
                    //console.log(allcininfo);
                    $('#tbody_search_result').empty();
                    if (data2Treat.length > 0) {
                        $('#btn_get_pdf').show();
                        $('#div_search_result').show();
                        $('#btn_get_pdf_bl').show();
                        $('#btn_excel').show();
                        $('#btn_get_pdf_withoutcin').show();
                        var allcontent = "";
                        //                        var totalHt = 0;
                        //                        var totalTtc = 0;
                        //                        var totalPaid = 0;
                        //                        var total2Pay = 0;

                        var symbols = [];
                        // treate symbols
                        $.each(data2Treat, function (name, value) {
                            symbols.push(value.CurrencySymbol);
                        });
                        //console.log(symbols);
                        symbols = symbols.filter(function (itm, i, a) {
                            return i == a.indexOf(itm);
                        });
                        //console.log(symbols);

                        var totalHtList = [];
                        var totalTtcList = [];
                        var totalPaidList = [];
                        var total2PayList = [];

                        $.each(symbols, function (name, value) {
                            var oneTotal1 = {};
                            oneTotal1.symbol = value;
                            oneTotal1.total = 0;
                            var oneTotal2 = {};
                            oneTotal2.symbol = value;
                            oneTotal2.total = 0;
                            var oneTotal3 = {};
                            oneTotal3.symbol = value;
                            oneTotal3.total = 0;
                            var oneTotal4 = {};
                            oneTotal4.symbol = value;
                            oneTotal4.total = 0;
                            totalHtList.push(oneTotal1);
                            totalTtcList.push(oneTotal2);
                            totalPaidList.push(oneTotal3);
                            total2PayList.push(oneTotal4);
                        });

                        $.each(data2Treat, function (name, value) {
                            var oneline = "<tr><td>";
                            oneline += value.ClientCompanyName+"</td>";
                            oneline += "<td><span  onclick='viewItem(\"" + value.FId + "\"," + value.CinIsInvoice + ")' style='cursor:pointer'>" + value.CinCode + "</span>";
                            oneline += "</td>";
                            oneline += "<td>";
                            oneline += getDateString(value.CinDInvoice);
                            oneline += "</td>";
                            oneline += "<td>";
                            oneline += getDateString(value.CinDTerm);
                            oneline += "</td>";
                            var amountHt = 0;
                            var amountTtc = 0;
                            var invoiceAvoir = value.CinIsInvoice ? 1 : -1;
                            $.each(value.ClientInvoiceLines, function (name2, value2) {
                                amountHt += (value2.CiiTotalPrice * invoiceAvoir);
                                amountTtc += (value2.CiiTotalCrudePrice * invoiceAvoir);
                            });
                            //                            totalHt += amountHt;
                            //                            totalTtc += amountTtc;

                            var amountpaid = 0;
                            var amount2pay = 0;

                            amount2pay = value.CinRest2Pay;
                            amountpaid = amountTtc - amount2pay;

                            var onetotalht = searchFieldValueInArray(totalHtList, 'symbol', value.CurrencySymbol);
                            onetotalht.total += amountHt;
                            var onetotalttc = searchFieldValueInArray(totalTtcList, 'symbol', value.CurrencySymbol);
                            onetotalttc.total += amountTtc;
                            var onetotalpaid = searchFieldValueInArray(totalPaidList, 'symbol', value.CurrencySymbol);
                            onetotalpaid.total += amountpaid;
                            var onetotal2pay = searchFieldValueInArray(total2PayList, 'symbol', value.CurrencySymbol);
                            onetotal2pay.total += amount2pay;
                            //                            
                            //                            totalPaid += amountpaid;
                            //                            total2Pay += amount2pay;
                            amountHt = amountHt.toFixed(2).toLocaleString() + ' ' + value.CurrencySymbol;
                            amountTtc = amountTtc.toFixed(2).toLocaleString() + ' ' + value.CurrencySymbol;
                            amount2pay = amount2pay.toFixed(2).toLocaleString() + ' ' + value.CurrencySymbol;
                            amountpaid = amountpaid.toFixed(2).toLocaleString() + ' ' + value.CurrencySymbol;

                            oneline += "<td style='text-align:right;'>";
                            oneline += amountHt;
                            oneline += "</td>";
                            oneline += "<td style='text-align:right;'>";
                            oneline += amountTtc;
                            oneline += "</td>";

                            oneline += "<td style='text-align:right;'>";
                            oneline += amountpaid;
                            oneline += "</td>";
                            oneline += "<td style='text-align:right;'>";
                            oneline += amount2pay;
                            oneline += "</td>";
                            oneline += "<td style='text-align:left;'>";
                            oneline += value.UsrCommercial1;
                            oneline += "</td>";

                            oneline += "</tr>";
                            allcontent += oneline;
                        });

                        $('#tbody_search_result').append(allcontent);
                        //                        totalHt = totalHt.toFixed(2);
                        //                        totalTtc = totalTtc.toFixed(2);
                        //                        totalPaid = totalPaid.toFixed(2);
                        //                        total2Pay = total2Pay.toFixed(2);
                        //                        var totalLine = "<tr>" +
                        //                            "<td colspan='3' style='text-align: center;font-weight: bolder;'>TOTAL RESTAT DÛ</td>" +
                        //                            "<td style='text-align: right;font-weight: bolder;'>" + totalHt + "</td>" +
                        //                            "<td style='text-align: right;    font-weight: bolder;'>" + totalTtc + "</td>" +
                        //                            "<td style='text-align: right;font-weight: bolder;'>" + totalPaid + "</td>" +
                        //                            "<td style='text-align: right;    font-weight: bolder;'>" + total2Pay + "</td>" +
                        //                            "</tr>";
                        //                        $('#tbody_search_result').append(totalLine);
                        $.each(symbols, function (name, value) {
                            var totalHt = 0;
                            var totalTtc = 0;
                            var totalPaid = 0;
                            var total2Pay = 0;

                            var onetotalht = searchFieldValueInArray(totalHtList, 'symbol', value);
                            totalHt = onetotalht.total.toFixed(3);
                            var onetotalttc = searchFieldValueInArray(totalTtcList, 'symbol', value);
                            totalTtc = onetotalttc.total.toFixed(3);
                            var onetotalpaid = searchFieldValueInArray(totalPaidList, 'symbol', value);
                            totalPaid = onetotalpaid.total.toFixed(3);
                            var onetotal2pay = searchFieldValueInArray(total2PayList, 'symbol', value);
                            total2Pay = onetotal2pay.total.toFixed(3);

                            var totalLine = "<tr>" +
                                "<td colspan='4' style='text-align: center;font-weight: bolder;'>TOTAL RESTAT DÛ " + value + "</td>" +
                                "<td style='text-align: right;font-weight: bolder;'>" + totalHt + " " + value + "</td>" +
                                "<td style='text-align: right;    font-weight: bolder;'>" + totalTtc + " " + value + "</td>" +
                                "<td style='text-align: right;font-weight: bolder;'>" + totalPaid + " " + value + "</td>" +
                                "<td style='text-align: right;    font-weight: bolder;'>" + total2Pay + " " + value + "</td>" +
                                "<td></td>" +
                                "</tr>";
                            $('#tbody_search_result').append(totalLine);
                        });
                    } else {
                        $('#btn_get_pdf').hide();
                        $('#btn_get_pdf_bl').hide();
                        $('#btn_excel').hide();
                        $('#btn_get_pdf_withoutcin').hide();
                        $('#div_search_result').show();
                        var emptycontent = "<tr><td colspan='5' style='text-align:center'>Aucun résultat trouvé</td></tr>";
                        $('#tbody_search_result').append(emptycontent);
                    }
                } else {
                    AuthencationError();
                }
            },
            error: function (data) {
                HidePleaseWait();
            }
        });
    } else {
        MsgErrorPopUp('Attention', 'Les dates de facture (du/au) sont obligatoires !!!');
    }
    return false;
}

function viewItem(fId, isInvoice) {
    //ShowPleaseWait();
    var url = "";
    if (isInvoice) {
        url = 'ClientInvoice.aspx?cinId=' + fId + "&mode=view";
    } else {
        url = 'ClientInvoiceA.aspx?cinId=' + fId + "&mode=view";
    }
    //document.location = url;

    var win = window.open(url, '_blank');
    win.focus();
    return false;
}

function GetExcel() {
    //ShowPleaseWait();
    //downlaodPayment();


    //var cliId = selectedClient.FId;
    var cliId = ClientIdeSelected;
    if (!cliId || cliId === 0) {
        cliId = 0;
    }
    var datecin = $('#CinDateInvoice').val();
    var enddate = $('#CinDateFin').val();
    var comId = $('#UsrCom1 option:selected').val() * 1;
    if (enddate && datecin) {
        ShowPleaseWait();
        var url = window.webservicePath + "/GetClientInvoiceStatmentByClient";
        var jsondata = JSON.stringify({ cliId: cliId, month: datecin, enddate: enddate, comId: comId, forCsv: true });
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
                    downlaodPayment(data2Treat);
                    //console.log(allcininfo);
                    //$('#tbody_search_result').empty();
                    //                    if (data2Treat.length > 0) {
                    //                        $('#btn_get_pdf').show();
                    //                        $('#div_search_result').show();
                    //                        $('#btn_get_pdf_bl').show();
                    //                        $('#btn_excel').show();
                    //                        var allcontent = "";
                    //                        var totalHt = 0;
                    //                        var totalTtc = 0;
                    //                        var totalPaid = 0;
                    //                        var total2Pay = 0;
                    //                        
                    //                    } else {
                    //                        $('#btn_get_pdf').hide();
                    //                        $('#btn_get_pdf_bl').hide();
                    //                        $('#btn_excel').hide();
                    //                        $('#div_search_result').show();
                    //                        var emptycontent = "<tr><td colspan='5' style='text-align:center'>Aucun résultat trouvé</td></tr>";
                    //                        $('#tbody_search_result').append(emptycontent);
                    //                    }
                } else {
                    HidePleaseWait();
                    AuthencationError();
                }
            },
            error: function (data) {
                HidePleaseWait();
            }
        });
    } else {
        MsgErrorPopUp('Attention', 'Les dates de facture (du/au) sont obligatoires !!!');
    }
    return false;
}

function downlaodPayment(cinPayment) {
    try {
        var csv = "";
        // title

        var client = $('#ClientCompanyName').val();
        var cindate = $('#CinDateInvoice').val();
        var cindateend = $('#CinDateFin').val();

        var month = cindate.split('/')[1];
        var year = cindate.split('/')[2];
        var date = cindate.split('/')[0];


        var tomonth = '';
        var toyear = '';
        var todate = '';
        if (!IsNullOrEmpty(cindateend)) {
            tomonth = cindateend.split('/')[1];
            toyear = cindateend.split('/')[2];
            todate = cindateend.split('/')[0];
        }
        var title = '';

        if (IsNullOrEmpty(tomonth)) {
            title = "Relevé de facture pour " + client + " de " + year + month + date;
        } else {
            title = "Relevé de facture pour " + client + " de " + year + month + date + " au " + toyear + tomonth + todate;
        }
        csv += title+"\r\n";
        //csv += "Client;N°CI;Nom CI;Total INC;Paid;To pay\r\n";


        var lastSup = "";
        var totalHt = 0;
        var totalTtc = 0;
        var totalPaid = 0;
        var total2Pay = 0;
 csv += "Client;N°CI;Nom CI;Commercial;D.Facture;Total TTC;Payé;A payer;;D.Paiement1;Montant1;D.Paiement2;Montant2;D.Paiement3;Montant3;D.Paiement4;Montant4;D.Paiement5;Montant5\r\n";
           
        $.each(cinPayment, function(name, value) {
            csv += value.ClientCompanyName + ";";
            csv += value.CinName + ";";
            csv += value.CinCode + ";";
            csv += value.UsrCommercial1 + ";";
            csv += getDateString(value.CinDInvoice) + ";";

            var amountHt = 0;
            var amountTtc = 0;
            var invoiceAvoir = value.CinIsInvoice ? 1 : -1;
            $.each(value.ClientInvoiceLines, function(name2, value2) {
                amountHt += (value2.CiiTotalPrice * invoiceAvoir);
                amountTtc += (value2.CiiTotalCrudePrice * invoiceAvoir);
            });
            totalHt += amountHt;
            totalTtc += amountTtc;

            var amountpaid = 0;
            var amount2pay = 0;
            amount2pay = value.CinRest2Pay;
            amountpaid = amountTtc - amount2pay;
            totalPaid += amountpaid;
            total2Pay += amount2pay;
            amount2pay = amount2pay.toFixed(2).toLocaleString();
            amountpaid = amountpaid.toFixed(2).toLocaleString();


            amountHt = amountHt.toFixed(2).toLocaleString();
            amountTtc = amountTtc.toFixed(2).toLocaleString();
            csv += amountTtc + ";";
            csv += amountpaid + ";";
            csv += amount2pay + ";;";


            if (value.ClientInvoicePayments !== null && value.ClientInvoicePayments.length > 0) {
                //csv += "Détail de payment" + ";;;Date;Montant;;\r\n";
                $.each(value.ClientInvoicePayments, function(name3, cpy) {
                    //csv += ";;;";
                    csv += getDateString(cpy.CpyDCreation) + ";";
                    csv += cpy.CpyAmount.toFixed(2).toLocaleString() + ";";
                });
                csv += "\r\n";
            } else {
                csv += "\r\n";
            }

            //csv += "\r\n";
        });

        csv += "\r\n";
        csv += "TOTAL A PAYER;;;;;" + total2Pay.toFixed(2).toLocaleString() + "\r\n";

        var csv_content = csv,
            download = document.createElement("a"),
            blob = new Blob(["\ufeff", csv_content], { type: "text/csv;charset=ISO-8859-1" });

        download.href = window.URL.createObjectURL(blob);
        //download.download = "Relevé de facture-" + client + " de " + year + "-" + month + ".csv";
        download.download = title + ".csv";

        var event = document.createEvent("MouseEvents");
        event.initMouseEvent(
            "click", true, false, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null
        );
        download.dispatchEvent(event);
        HidePleaseWait();
    } catch (e) {
        var test = e;
    }
}

var allCommercials = [];
function getCom() {
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
                $('#UsrCom1').empty();
                $('#UsrCom1').append($("<option>Sélectionner un commercial</option>").attr("value", "0"));
                $.each(allCommercials, function(order, oneCom) {
                    $('#UsrCom1').append($("<option>" + oneCom.FullName + "</option>").attr("value", oneCom.Id));
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
