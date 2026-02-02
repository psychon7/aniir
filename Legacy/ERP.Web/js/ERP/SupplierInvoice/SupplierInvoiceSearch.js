
$(document).ready(initSearch);

function initSearch() {
    LoadSupplier();

    SetLanguageBar();
}

var hasSet = false;

function viewSearchResult(data2Treat) {
    var name = '_pins';
    var dt_name = 'dt' + name;
    var div_name = 'div' + name;
    var th_name = 'th' + name;
    var tb_name = 'tb' + name;
    var tf_name = 'tf' + name;
    var rst_name = 'rst' + name;

    var headerFooter = "<tr>" +
        "<th style='text-align:center'class='language_txt'>Fournisseur</th>" +
        "<th style='text-align:center'class='language_txt'>Nom de PI</th>" +
        "<th style='text-align:center'class='language_txt'>Code de PI</th>" +
        "<th style='text-align:center'class='language_txt'>Montant HT</th>" +
        "<th style='text-align:center'class='language_txt'>Montant TTC</th>" +
        "<th style='text-align:center'class='language_txt'>Cmd Fourniseur</th>" +
        "<th style='text-align:center'class='language_txt'>Payé</th>" +
        "</tr>";

    try {
        $('#' + dt_name).remove();
        var datatableContent = "<table id='" + dt_name + "' cellpadding='0' cellspacing='0' border='0' class='datatable table table-striped table-bordered table-hover'>" +
                        "<thead id='" + th_name + "'>" +
                        headerFooter +
                        "</thead>" +
                        "<tbody id='" + tb_name + "'></tbody>" +
                        "<tfoot id='" + tf_name + "'>" +
                        headerFooter +
                        "</tfoot>" +
                        "</table>";
        $('#' + div_name).html(datatableContent);

    } catch (e) {
        var test = '';
    }
    var resultcount = data2Treat.length;
    $('#' + rst_name).text(resultcount);
    if (resultcount > 0) {
        $('.searchresult').show();
        $('#' + th_name).empty();
        $('#' + tf_name).empty();

        $('#' + th_name).append(headerFooter);
        $('#' + tf_name).append(headerFooter);

        var titles = new Array();
        titles.push({ "sTitle": "Supplier" });
        titles.push({ "sTitle": "Name" });
        titles.push({ "sTitle": "Code" });
        titles.push({ "sTitle": "Montant HT" });
        titles.push({ "sTitle": "Montant TTC" });
        titles.push({ "sTitle": "SodCode" });
        titles.push({ "sTitle": "Paid" });

        var displaycount = 1;
        $.each(data2Treat, function (name, value) {
            var dataArray = new Array();
            dataArray.push("<span  onclick='viewItem(\"" + value.SinFId + "\")' style='cursor:pointer'>" + value.OneSupplier.CompanyName + "</span>");
            dataArray.push(value.SinName);
            dataArray.push(value.SinCode);
            dataArray.push(ReplaceNumberWithCommas(value.TotalAmountHt));
            dataArray.push(ReplaceNumberWithCommas(value.TotalAmountTtc));
            if (value.SodFId !== 0) {
                dataArray.push("<span  onclick='viewSodItem(\"" + value.SodFId + "\")' style='cursor:pointer'>" + value.SodCode + "</span>");
            } else {
                dataArray.push(value.SodCode);
            }
            dataArray.push(value.SinIsPaid ? "<span style='color:green'>Oui</span>" : "<span style='color:red'>Non</span>");
            try {
                $('#' + dt_name).dataTable().fnAddData(dataArray);
            } catch (e) {
                var test = '';
            }
            displaycount++;
        });

        if (hasSet) {
            try {
                $('#' + dt_name).dataTable({
                    "sPaginationType": "bs_full",
                    "bDestroy": true,
                    "bRetrieve": true,
                    "bServerSide": true,
                    "bProcessing": true,
                    "aoColumns": titles,
                    "sScrollY": "50px",
                    "bScrollCollapse": true
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
    } else {
        $('.searchresult').hide();
    }

    SetLanguageBar();
    myApp.hidePleaseWait();
}

function viewItem(fId) {
    myApp.showPleaseWait();
    var url = 'SupplierInvoice.aspx?sinId=' + fId + "&mode=view";
    window.location.href = url;
}

function viewSodItem(fId) {
    myApp.showPleaseWait();
    var url = '../SupplierOrder/SupplierOrder.aspx?sodId=' + fId + "&mode=view";
    window.location.href = url;
}

function LoadSupplier() {
    var url = window.webservicePath + "/GetAllSuppliers";
    var budgetId = '#SupId';
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
                $(budgetId).append($("<option></option>").attr("data-value", "0").attr("value", "0").text("Veuillez sélectionner un fournisseur"));
                $.each(data2Treat, function (name, value) {
                    $(budgetId)
                        .append($("<option></option>")
                            .attr("data-value", value.FId)
                            .attr("value", value.Id)
                            .text(value.CompanyName)
                            );
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

function js_search() {
    var url = window.webservicePath + "/SearchSupplierInvoice";
    var sod = {};
    sod.SinName = $('#SinName').val().trim();
    sod.SinCode = $('#SinCode').val().trim();
    sod.SupId = $('#SupId').val().trim();

    var jsondata = JSON.stringify({ sin: sod });
    myApp.showPleaseWait();
    $.ajax({
        url: url,
        type: 'POST',
        contentType: 'application/json; charset=utf-8',
        data: jsondata,
        dataType: 'json',
        success: function (data) {
            var jsdata = data.d;
            var jsondata = jQuery.parseJSON(jsdata);
            if (jsondata.length === 0) {
                NoResultMsg();
            }
            viewSearchResult(jsondata);
        },
        error: function (data) {
            myApp.hidePleaseWait();
        }
    });
    return false;
}

function createItem() {
    ShowPleaseWait();
    window.location = "SupplierInvoice.aspx";
}