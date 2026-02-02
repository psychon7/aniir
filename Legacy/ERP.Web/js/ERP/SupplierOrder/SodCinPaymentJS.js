
$(document).ready(init);

function init() {
    var navbarclass = $('#div-navbar-brand').attr('class');
    if (navbarclass === "navbar-brand") {
        $('#sidebar-collapse').click();
    }
    setAutoCompleteSup();
    setAutoCompleteClient();
}

var seltectedSupId = 0;
var supplierList = [];
function setAutoCompleteSup() {
   var url = window.webservicePath + "/GetSupplierByKeyword";
    //var cliFId = $('#cinClient :selected').attr('data-value');
    $("#SupList").autocomplete({
        source: function(request, response) {
            $.ajax({
                url: url,
                data: "{ 'keyword': '" + request.term + "'}",
                dataType: "json",
                type: "POST",
                contentType: "application/json; charset=utf-8",
                success: function(data) {
                    seltectedSupId = 0;
                    var jsdata = data.d;
                    var data2Treat = jQuery.parseJSON(jsdata);
                    supplierList = [];
                    supplierList = data2Treat;
                    if (data2Treat.length > 0) {
                        response($.map(data2Treat, function(item) {
                            return {
                                label: (item.Abbreviation == null ? (item.CompanyName) : (item.Abbreviation + " | " + item.CompanyName)),
                                val: item.Id,
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
            seltectedSupId = i.item.val * 1;
            //SupplierChangedBySelected(seltectedSupFId, 0);
        },
        minLength: 2
    });
}


var seltectedClientId = 0;
var ClientList = [];
var currentByCin = false;
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
                                //label: item.Value,
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
        },
        minLength: 2
    });
}

function InitSup(sender) {
    var value = $(sender).val().trim();
    if (IsNullOrEmpty(value)) {
        seltectedSupId = 0;
    }
    return false;
}

function InitClient(sender) {
    var value = $(sender).val().trim();
    if (IsNullOrEmpty(value)) {
        seltectedClientId = 0;
    }
    return false;
}


var allResult = [];
function js_search() {
    ShowPleaseWait();
    allResult = [];
    var url = window.webservicePath + "/GetCinSodPaymentInfo";
    var cliId = seltectedClientId * 1;
    var supId = seltectedSupId * 1;
    var dFrom = $('#DateCreationFrom').val();
    var dTo = $('#DateCreationTo').val();
    var byCin = $('#inp_check_cin').is(':checked');
    var code = $('#ip_cmd_name').val().trim();
    currentByCin = byCin;
    var jsondata = JSON.stringify({
        dFrom: dFrom,
        dTo: dTo,
        supId: supId,
        cliId: cliId,
        byCin: byCin,
        code: code
    });
    $.ajax({
        url: url,
        type: 'POST',
        contentType: 'application/json; charset=utf-8',
        data: jsondata,
        dataType: 'json',
        success: function(data) {
            //console.log(data);
            var jsdata = data.d;
            var jsondata = jQuery.parseJSON(jsdata);
            allResult = jsondata;
            //console.log(allResult);
            if (allResult.length === 0) {
                HidePleaseWait();
                $('#div_search_result').hide();
                NoResultMsg();
            } else {
                //console.log(allSodStatus);
                $('#div_search_result').empty();
                $('#div_search_result').show();
                //setAllSodStatus();
                setResult(allResult, byCin);
                HidePleaseWait();
            }
        },
        error: function(data) {
            HidePleaseWait();
        }
    });
    return false;
}

function setResult(results, byCin) {
    if (byCin) {
        setByCinNew(results);
    } else {
        setBySodNew(results);
    }
}

function setBySod(results) {
    var allcontent = "";
    var hfooter = "<tr>" +
        //"<th style='text-align:center'><input type='checkbox' id='cbx_all_cin' onclick='CinAllClick(this)'/></th>" +
        "<th>Code</th>" +
        "<th>Fourniseur</th>" +
        "<th>Detail</th>" +
        "<th>Mnt. total</th>" +
        "<th>Déjà payé</th>" +
        "<th>À payer</th>" +
        "<th>Détail de paiement</th>" +
        "<th>Facture client</th>" +
        "</tr>";

    var dtcontent = "<table id='datatable_search_result' cellpadding='0' cellspacing='0' border='0' class='datatable table table-striped table-bordered table-hover'>" +
        "<thead id='thead_search_result'>" +
        hfooter +
        "</thead>" +
        "<tbody id='tbody_search_result'></tbody>" +
        "<tfoot id='tfoot_search_result'>" +
        hfooter +
        "</tfoot>" +
        "</table>";
    var linecolor = "";
    $.each(results, function(name, onesod) {
        linecolor = onesod.Need2Pay > 0 ? "" : "background-color: #e2efda;";
        var canceldeco = onesod.IsCanceled === true ? ";text-decoration: line-through; color:red;" : "";
        var onecontent = "<tr><td style='" + linecolor + canceldeco + "'>" + onesod.SodCode + "<br/>" + onesod.SodName + "</td>";
        onecontent += "<td style='" + linecolor + canceldeco + "'>" + onesod.SupplierCompanyName + "</td>";
        var cindetails = "";
        var linecount = 0;
        var newline = "<br/>";
        $.each(onesod.PurchaseLines, function(name2, oneline) {
            newline = linecount === 0 ? "" : "<br/>";
            cindetails += newline;
            cindetails += (oneline.Order) + "→";
            cindetails += oneline.PrdName + "→";
            cindetails += oneline.Quantity + " * " + oneline.UnitPriceWithDis + " = " + oneline.TotalPrice + " " + onesod.CurrencySymbol;
            linecount ++;
        });
        onecontent += "<td style='text-align:left !important;" + linecolor + "'>" + cindetails + "</td>";
        onecontent += "<td style='text-align:right !important; " + linecolor + canceldeco + "'>" + onesod.TotalAmountHt + "</td>";
        onecontent += "<td style='text-align:right !important; " + linecolor + canceldeco + "'>" + onesod.Paid + "</td>";
        onecontent += "<td style='text-align:right !important; " + linecolor + canceldeco + "'>" + onesod.Need2Pay + "</td>";
        onecontent += "<td style='text-align:left !important;'>" + onesod.SodPaymentRecord + "</td>";

        // supplier order 
        onecontent += "<td>";
        var sodcolor = "";
        if (onesod.CinInfos.length > 0) {
            onecontent += "<table border='1' style='width:100%;'>" +
                "<tr>" +
                "<th>Facture</th>" +
                "<th>Client</th>" +
                "<th>Détail</th>" +
                "<th>Mnt. total</th>" +
                "<th>Déjà payé</th>" +
                "<th>À payer</th>" +
                "<th>Détail de paiment</th>" +
                "</tr>";

            $.each(onesod.CinInfos, function(name2, onecin) {
                sodcolor = onecin.CinRest2Pay > 0 ? "" : "background-color: #e2efda;";
                onecontent += "<tr>" +
                    "<td style='" + sodcolor + "'>" + onecin.CinCode + "→" + onecin.CinName + "</td>" +
                    "<td style='" + sodcolor + "'>" + onecin.ClientCompanyName + "</td>";
                var sollinecount = 0;
                onecontent += "<td style='text-align:left !important;" + sodcolor + "'>";
                var newline = "<br/>";
                var solcontent = "";
                $.each(onecin.ClientInvoiceLines, function(name3, onecii) {
                    newline = sollinecount === 0 ? "" : "<br/>";
                    solcontent += newline;
                    solcontent += (onecii.CiiLevel1 + "." + onecii.CiiLevel2) + "→";
                    solcontent += onecii.CiiPrdName + "→";
                    solcontent += onecii.CiiQuantity + " * " + onecii.CiiPriceWithDiscountHt + " = " + onecii.CiiTotalPrice + " " + onecin.CurrencySymbol;

                    sollinecount++;
                });
                onecontent += solcontent;
                onecontent += "</td>";

                onecontent += "<td style='" + sodcolor + "'>" + onecin.CinAmount + "</td>";
                onecontent += "<td style='" + sodcolor + "'>" + onecin.CinPaid + "</td>";
                onecontent += "<td style='" + sodcolor + "'>" + onecin.CinRest2Pay + "</td>";
                onecontent += "<td>" + onecin.CinPaymentRecord + "</td>";
                onecontent += "</tr>";
            });
            onecontent += "</table>";
        }
        onecontent += "</td>";
        // allcontent
        allcontent += onecontent;
    });
    $('#div_search_result').append(dtcontent);
    $('#tbody_search_result').append(allcontent);
}


function setBySodNew(results) {
    var allcontent = "";
    var hfooter = "<tr>" +
        //"<th style='text-align:center'><input type='checkbox' id='cbx_all_cin' onclick='CinAllClick(this)'/></th>" +
        "<th>Code</th>" +
        "<th>Fourniseur</th>" +
        "<th>Detail</th>" +
        "<th>Mnt. total</th>" +
        "<th>Déjà payé</th>" +
        "<th>À payer</th>" +
        "<th>Détail de paiement</th>" +
        "<th>Facture client</th>" + // facture client
        "<th>Client</th>" +
        "<th>Détail</th>" +
        "<th>Mnt. total</th>" +
        "<th>Déjà payé</th>" +
        "<th>À payer</th>" +
        "<th>Détail de paiment</th>" +
        "</tr>";

    var dtcontent = "<table id='datatable_search_result' cellpadding='0' cellspacing='0' border='1px solid' style='background-color: white; border-collapse: collapse;' class='datatable table '>" +
        "<thead id='thead_search_result'>" +
        hfooter +
        "</thead>" +
        "<tbody id='tbody_search_result'></tbody>" +
        "<tfoot id='tfoot_search_result'>" +
        hfooter +
        "</tfoot>" +
        "</table>";
    var linecolor = "";
    var linebackgrouncolor = "";
    var alllinecount = 0;
    $.each(results, function(name, onesod) {
        linecolor = onesod.Need2Pay  > 0 ? "" : "color: blue; font-weight: bolder; font-style: italic;";
        linebackgrouncolor = (alllinecount % 2 === 1) ? "background-color: #c5c5c5;" : "";
        var canceldeco = onesod.IsCanceled === true ? ";text-decoration: line-through; color:red;" : "";
        var cincount = onesod.CinInfos.length;
        var rowspandef = " rowspan='" + (cincount === 0 ? 1 : cincount) + "' ";
        var onecontent = "<tr style='" + linebackgrouncolor + "' >" +
            "<td style='font-weight:bolder;cursor:pointer;" + linecolor + canceldeco + "' " + rowspandef + " onclick='viewSodItem(\"" + onesod.SodFId + "\")'>" + onesod.SodCode + "<br/>" + onesod.SodName + "</td>";
        onecontent += "<td style='" + linecolor + canceldeco + "' " + rowspandef + ">" + onesod.SupplierCompanyName + "</td>";
        var cindetails = "";
        var linecount = 0;
        var newline = "<br/>";
        $.each(onesod.PurchaseLines, function(name2, oneline) {
            newline = linecount === 0 ? "" : "<br/>";
            cindetails += newline;
            cindetails += (oneline.Order) + "→";
            cindetails += oneline.PrdName + "→";
            cindetails += oneline.Quantity + " * " + oneline.UnitPriceWithDis + " = " + oneline.TotalPrice + " " + onesod.CurrencySymbol;
            linecount ++;
        });
        onecontent += "<td style='text-align:left !important;" + linecolor + "' " + rowspandef + ">" + cindetails + "</td>";
        onecontent += "<td style='text-align:right !important; " + linecolor + canceldeco + "' " + rowspandef + ">" + onesod.TotalAmountHt + "</td>";
        onecontent += "<td style='text-align:right !important; " + linecolor + canceldeco + "' " + rowspandef + ">" + onesod.Paid + "</td>";
        onecontent += "<td style='text-align:right !important; " + linecolor + canceldeco + "' " + rowspandef + ">" + onesod.Need2Pay + "</td>";
        onecontent += "<td style='text-align:left !important;' " + rowspandef + ">" + onesod.SodPaymentRecord + "</td>";

        // supplier order 
        //onecontent += "<td>";
        var sodcolor = "";
        var allcincount = 0;
        if (onesod.CinInfos.length > 0) {
//            onecontent += "<table border='1' style='width:100%;'>" +
//                "<tr>" +
//                "<th>Facture</th>" +
//                "<th>Client</th>" +
//                "<th>Détail</th>" +
//                "<th>Mnt. total</th>" +
//                "<th>Déjà payé</th>" +
//                "<th>À payer</th>" +
//                "<th>Détail de paiment</th>" +
//                "</tr>";
            $.each(onesod.CinInfos, function(name2, onecin) {
                if (allcincount % 2 === 1) {
                    onecontent += "<tr style='" + linebackgrouncolor + "'>";
                }
                sodcolor = onecin.CinRest2Pay > 0 ? "" : "color: blue; font-weight: bolder; font-style: italic;";
                //onecontent += "<tr>" +
                onecontent += "<td style='" + sodcolor + ";cursor:pointer;' onclick='viewCinItem(\"" + onecin.FId + "\")' >" + onecin.CinCode + "<br/>" + onecin.CinName + "</td>" +
                    "<td style='" + sodcolor + "'>" + onecin.ClientCompanyName + "</td>";
                var sollinecount = 0;
                onecontent += "<td style='text-align:left !important;" + sodcolor + "'>";
                var newline = "<br/>";
                var solcontent = "";
                $.each(onecin.ClientInvoiceLines, function(name3, onecii) {
                    newline = sollinecount === 0 ? "" : "<br/>";
                    solcontent += newline;
                    solcontent += (onecii.CiiLevel1 + "." + onecii.CiiLevel2) + "→";
                    solcontent += onecii.CiiPrdName + "→";
                    solcontent += onecii.CiiQuantity + " * " + onecii.CiiPriceWithDiscountHt + " = " + onecii.CiiTotalPrice + " " + onecin.CurrencySymbol;
                    sollinecount++;
                });
                onecontent += solcontent;
                onecontent += "</td>";
                onecontent += "<td style='" + sodcolor + "'>" + onecin.CinAmount + "</td>";
                onecontent += "<td style='" + sodcolor + "'>" + onecin.CinPaid + "</td>";
                onecontent += "<td style='" + sodcolor + "'>" + onecin.CinRest2Pay + "</td>";
                onecontent += "<td>" + onecin.CinPaymentRecord + "</td>";
                onecontent += "</tr>";
                allcincount++;
            });
            //onecontent += "</table>";
        } else {
            onecontent += "<td colspan='7'></td></tr>";
        }
        //onecontent += "</td>";
        // allcontent
        allcontent += onecontent;
        alllinecount++;
    });
    $('#div_search_result').append(dtcontent);
    $('#tbody_search_result').append(allcontent);
}


function setByCinNew(results) {
    var allcontent = "";
    var hfooter = "<tr style='background-color: #c5c5c5'>" +
        //"<th style='text-align:center'><input type='checkbox' id='cbx_all_cin' onclick='CinAllClick(this)'/></th>" +
        "<th>Code</th>" +
        "<th>Client</th>" +
        "<th>Detail</th>" +
        "<th>Mnt. total</th>" +
        "<th>Déjà payé</th>" +
        "<th>À payer</th>" +
        "<th>Détail de paiement</th>" +
        "<th>Commande fournisseur</th>" + // commande fournisseur
        "<th>Fournisseur</th>" +
        "<th>Détail</th>" +
        "<th>Mnt. total</th>" +
        "<th>Déjà payé</th>" +
        "<th>À payer</th>" +
        "<th>Détail de paiment</th>" +
//            "<th>Fournisseur</th>" +
//            "<th>Detail</th>" +
//            "<th>Mnt. Total</th>" +
//            "<th>Déjà payé</th>" +
//            "<th>À payer</th>" +
        "</tr>";

    var dtcontent = "<table id='datatable_search_result' cellpadding='0' cellspacing='0' border='1px solid' style='background-color: white; border-collapse: collapse;' class='datatable table '>" +
        "<thead id='thead_search_result'>" +
        hfooter +
        "</thead>" +
        "<tbody id='tbody_search_result'></tbody>" +
        "<tfoot id='tfoot_search_result'>" +
        hfooter +
        "</tfoot>" +
        "</table>";
    var linecolor = "";
    var linebackgrouncolor = "";
    var alllinecount = 0;
    $.each(results, function(name, onecin) {
        linecolor = onecin.CinRest2Pay > 0 ? "" : "color: blue; font-weight: bolder; font-style: italic;";
        linebackgrouncolor = (alllinecount % 2 === 1) ? "background-color: #c5c5c5;" : "";
        var sodcount = onecin.SodInfos.length;
        var rowspandef = " rowspan='" + (sodcount===0? 1:sodcount)  + "' ";
        var onecontent = "<tr style='" + linebackgrouncolor + "' >" +
            "<td style='font-weight:bolder;cursor:pointer;" + linecolor + "' " + rowspandef + " onclick='viewCinItem(\"" + onecin.FId + "\")' >" + onecin.CinCode + "<br/>" + onecin.CinName + "</td>";
        onecontent += "<td style='" + linecolor + "' " + rowspandef + ">" + onecin.ClientCompanyName + "</td>";
        var cindetails = "";
        var linecount = 0;
        var newline = "<br/>";
        //console.log(sodcount);
        $.each(onecin.ClientInvoiceLines, function(name2, oneline) {
            newline = linecount === 0 ? "" : "<br/>";
            cindetails += newline;
            cindetails += (oneline.CiiLevel1 + "." + oneline.CiiLevel2) + "→";
            cindetails += oneline.CiiPrdName + "→";
            cindetails += oneline.CiiQuantity + " * " + oneline.CiiPriceWithDiscountHt + " = " + oneline.CiiTotalPrice + " " + onecin.CurrencySymbol;
            linecount ++;
        });
        onecontent += "<td style='text-align:left !important; " + linecolor + "' " + rowspandef + ">" + cindetails + "</td>";
        onecontent += "<td style='text-align:right !important; " + linecolor + "' " + rowspandef + ">" + onecin.CinAmount + "</td>";
        onecontent += "<td style='text-align:right !important; " + linecolor + "' " + rowspandef + ">" + onecin.CinPaid + "</td>";
        onecontent += "<td style='text-align:right !important; " + linecolor + "' " + rowspandef + ">" + onecin.CinRest2Pay + "</td>";
        onecontent += "<td style='text-align:left !important;' " + rowspandef + " " + rowspandef + ">" + onecin.CinPaymentRecord + "</td>";

        // supplier order 
        //onecontent += "<td>";
        var sodcolor = "";
        var allsodcount = 0;
        if (onecin.SodInfos.length > 0) {
//            onecontent += "<table border='1' style='width:100%;'>" +
//                "<tr>" +
//                "<th>Comamnde</th>" +
//                "<th>Fournisseur</th>" +
//                "<th>Détail</th>" +
//                "<th>Mnt. total</th>" +
//                "<th>Déjà payé</th>" +
//                "<th>À payer</th>" +
//                "<th>Détail de paiment</th>" +
//                "</tr>";
            $.each(onecin.SodInfos, function(name2, onesod) {
                if (allsodcount % 2 === 1) {
                    onecontent += "<tr style='" + linebackgrouncolor + "'>";
                }
                sodcolor = onesod.Need2Pay > 0 ? "" : "color: blue; font-weight: bolder; font-style: italic;";
                //onecontent += "<tr>" +
                onecontent += "<td style='" + sodcolor + ";cursor:pointer;'  onclick='viewSodItem(\"" + onesod.SodFId + "\")'>" + onesod.SodCode + "<br/>" + onesod.SodName + "</td>" +
                    "<td style='" + sodcolor + "'>" + onesod.Supplier + "</td>";
                var sollinecount = 0;
                onecontent += "<td style='text-align:left !important;" + sodcolor + "'>";
                var newline = "<br/>";
                var solcontent = "";
                $.each(onesod.PurchaseLines, function(name3, onesol) {
                    newline = sollinecount === 0 ? "" : "<br/>";
                    solcontent += newline;
                    solcontent += onesol.Order + "→";
                    solcontent += onesol.PrdName + "→";
                    solcontent += onesol.Quantity + " * " + onesol.UnitPriceWithDis + " = " + onesol.TotalPrice + " " + onesol.CurSymbol;
                    sollinecount++;
                });
                onecontent += solcontent;
                onecontent += "</td>";
                onecontent += "<td style='" + sodcolor + "'>" + onesod.TotalAmountHt + "</td>";
                onecontent += "<td style='" + sodcolor + "'>" + onesod.Paid + "</td>";
                onecontent += "<td style='" + sodcolor + "'>" + onesod.Need2Pay + "</td>";
                onecontent += "<td>" + onesod.SodPaymentRecord + "</td>";
                onecontent += "</tr>";
                allsodcount++;
            });
            //onecontent += "</table>";
        } else {
            onecontent += "<td colspan='7'></td></tr>";
        }
        //onecontent += "</td>";
        // allcontent
        allcontent += onecontent;
        alllinecount++;
    });
    $('#div_search_result').append(dtcontent);
    $('#tbody_search_result').append(allcontent);
}





function setByCin(results) {
    var allcontent = "";
    var hfooter = "<tr>" +
        //"<th style='text-align:center'><input type='checkbox' id='cbx_all_cin' onclick='CinAllClick(this)'/></th>" +
        "<th>Code</th>" +
        "<th>Client</th>" +
        "<th>Detail</th>" +
        "<th>Mnt. total</th>" +
        "<th>Déjà payé</th>" +
        "<th>À payer</th>" +
        "<th>Détail de paiement</th>" +
        "<th>Commande fournisseur</th>" +
//            "<th>Fournisseur</th>" +
//            "<th>Detail</th>" +
//            "<th>Mnt. Total</th>" +
//            "<th>Déjà payé</th>" +
//            "<th>À payer</th>" +
        "</tr>";

    var dtcontent = "<table id='datatable_search_result' cellpadding='0' cellspacing='0' border='0' class='datatable table table-striped table-bordered table-hover'>" +
        "<thead id='thead_search_result'>" +
        hfooter +
        "</thead>" +
        "<tbody id='tbody_search_result'></tbody>" +
        "<tfoot id='tfoot_search_result'>" +
        hfooter +
        "</tfoot>" +
        "</table>";
    var linecolor = "";
    $.each(results, function(name, onecin) {
        linecolor = onecin.CinRest2Pay > 0 ? "" : "background-color: #e2efda;";
        var onecontent = "<tr><td style='" + linecolor + "'>" + onecin.CinCode + "<br/>" + onecin.CinName + "</td>";
        onecontent += "<td style='" + linecolor + "'>" + onecin.ClientCompanyName + "</td>";
        var cindetails = "";
        var linecount = 0;
        var newline = "<br/>";
        $.each(onecin.ClientInvoiceLines, function(name2, oneline) {
            newline = linecount === 0 ? "" : "<br/>";
            cindetails += newline;
            cindetails += (oneline.CiiLevel1 + "." + oneline.CiiLevel2) + "→";
            cindetails += oneline.CiiPrdName + "→";
            cindetails += oneline.CiiQuantity + " * " + oneline.CiiPriceWithDiscountHt + " = " + oneline.CiiTotalPrice + " " + onecin.CurrencySymbol;
            linecount ++;
        });
        onecontent += "<td style='text-align:left !important; " + linecolor + "'>" + cindetails + "</td>";
        onecontent += "<td style='text-align:right !important; " + linecolor + "'>" + onecin.CinAmount + "</td>";
        onecontent += "<td style='text-align:right !important; " + linecolor + "'>" + onecin.CinPaid + "</td>";
        onecontent += "<td style='text-align:right !important; " + linecolor + "'>" + onecin.CinRest2Pay + "</td>";
        onecontent += "<td style='text-align:left !important;'>" + onecin.CinPaymentRecord + "</td>";

        // supplier order 
        onecontent += "<td>";
        var sodcolor = "";
        if (onecin.SodInfos.length > 0) {
            onecontent += "<table border='1' style='width:100%;'>" +
                "<tr>" +
                "<th>Comamnde</th>" +
                "<th>Fournisseur</th>" +
                "<th>Détail</th>" +
                "<th>Mnt. total</th>" +
                "<th>Déjà payé</th>" +
                "<th>À payer</th>" +
                "<th>Détail de paiment</th>" +
                "</tr>";

            $.each(onecin.SodInfos, function(name2, onesod) {
                sodcolor = onesod.Need2Pay > 0 ? "" : "background-color: #e2efda;";
                onecontent += "<tr>" +
                    "<td style='" + sodcolor + "'>" + onesod.SodCode + "</td>" +
                    "<td style='" + sodcolor + "'>" + onesod.Supplier + "</td>";
                var sollinecount = 0;
                onecontent += "<td style='text-align:left !important;" + sodcolor + "'>";
                var newline = "<br/>";
                var solcontent = "";
                $.each(onesod.PurchaseLines, function(name3, onesol) {
                    newline = sollinecount === 0 ? "" : "<br/>";
                    solcontent += newline;
                    solcontent += onesol.Order + "→";
                    solcontent += onesol.PrdName + "→";
                    solcontent += onesol.Quantity + " * " + onesol.UnitPriceWithDis + " = " + onesol.TotalPrice + " " + onesol.CurSymbol;

                    sollinecount++;
                });
                onecontent += solcontent;
                onecontent += "</td>";

                onecontent += "<td style='" + sodcolor + "'>" + onesod.TotalAmountHt + "</td>";
                onecontent += "<td style='" + sodcolor + "'>" + onesod.Paid + "</td>";
                onecontent += "<td style='" + sodcolor + "'>" + onesod.Need2Pay + "</td>";
                onecontent += "<td>" + onesod.SodPaymentRecord + "</td>";
                onecontent += "</tr>";
            });
            onecontent += "</table>";
        }
        onecontent += "</td>";
        // allcontent
        allcontent += onecontent;
    });
    $('#div_search_result').append(dtcontent);
    $('#tbody_search_result').append(allcontent);
}


function viewCinItem(fId) {
    //ShowPleaseWait();
    var url = '../ClientInvoice/ClientInvoice.aspx?cinId=' + fId + "&mode=view";
    var win = window.open(url, '_blank');
    win.focus();
    return false;
}


function viewSprFile(sodId,sprid) {
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

    var title = 'FICHIER DE PAIEMENT';
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
    //var sprid = $(sender).attr('sprid');
    var src = "../Common/PageForPDF.aspx?type=8&sodId=" + encodeURIComponent(sodId) + "&sprId=" + encodeURIComponent(sprid);
    $('#iframepdfForPayment').attr('src', src);
    return false;
}


function viewCpyFile(cinId, cpyId) {
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
//    var cinId = getUrlVars()['cinId'];
//    var cpyId = $(sender).attr('cpyId');
    var src = "../Common/PageForPDF.aspx?type=4&cinId=" + encodeURIComponent(cinId) + "&cpyId=" + encodeURIComponent(cpyId);
    $('#iframepdfForPayment').attr('src', src);
    return false;
}


function sodoptionchanged(sender) {
    if ($(sender).attr('id') === 'inp_check_sod') {
        $('#lb_cmd_name').text('Nom/Code de la commande');
    } else {
        $('#lb_cmd_name').text('Nom/Code de la facture');
    }
}


function viewSodItem(fId) {
    //myApp.showPleaseWait();
    var url = 'SupplierOrder.aspx?sodId=' + fId + "&mode=view";
    //window.location.href = url;
    var win = window.open(url, '_blank');
    win.focus();
}
