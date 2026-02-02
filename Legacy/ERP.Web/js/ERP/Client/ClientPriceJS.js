$(document).ready(initAll);

function initAll() {
    var cliId = getUrlVars()['cliId'];
    var clientname = getParameterByName('cliname');
    $('#sp_client').html(clientname);
    if (cliId) {
        console.log(cliId);
        getProductList(cliId);
    }
}

function getProductList(cliId) {
    var url = window.webservicePath + "/GetClientSoldProducts";
    console.log(window.webservicePath);
    var datastr = "{cliId:'" + cliId + "'}";
    $.ajax({
        type: "POST",
        url: url,
        contentType: "application/json; charset=utf-8",
        data: datastr,
        dataType: "json",
        success: function (data) {
            $('#div_loading_prdlist').hide();
            var jsdata = data.d;
            var data2Treat = jQuery.parseJSON(jsdata);
            if (data2Treat !== '-1') {
                var count = data2Treat.length;
                $('#sp_prd_list_count').text(count);
                var contents = "<div class='form-group'>" +
                    "<div class='form-group'>" +
                    "<div class='col-sm-12'>" +
                    "<table style='width:100%' cellpadding='0' cellspacing='0' border='0' class='datatable table table-striped table-bordered table-hover'>" +
                    "<tr>" +
                    "<th style='text-align:center'>Nom</th>" +
                    "<th style='text-align:center'>Réf</th>" +
                    "<th style='text-align:center'>Vue</th>" +
                    "</tr>";
                if (count > 0) {
                    $.each(data2Treat, function(name, value) {
                        var oneContent = "<tr><td>" + value.PrdName + "</td><td>" + (value.PrdRef !== null ? value.PrdRef : "") + "</td><td style='text-align:center'>" +
                            "<button type='button' class='btn btn-inverse' onclick='return ViewPrice(" + value.PitId + ",\"" + value.PrdName + "\", \"" + value.PrdRef + "\")'><i class='fa fa-eye'></i></button>" +
                            "</td></tr>";
                        contents += oneContent;
                    });
                } else {
                    var oneContent = "<tr><td colspan='3'>Aucun enregistrements correspondants trouvés</td></tr>";
                    contents += oneContent;
                }
                contents += "</table>" +
                    "</div></div></div>";
                $('#div_prd_list').append(contents);
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

function ViewPrice(pitId, prdname, prdRef) {
    var cliId = getUrlVars()['cliId'];
    var prd_ref = ((prdRef !== null && prdRef !== 'null') ? prdRef : "");
    var title = (prd_ref !== "" ? (prd_ref + " - ") : "") + prdname;
    $('#lb_productname').text(title);
    $('#div_loading_price').show();

    $('#div_price_list').empty();

    var url = window.webservicePath + "/GetClientProducts";
    console.log(window.webservicePath);
    var datastr = "{cliId:'" + cliId + "',pitId:" + pitId + ",prdName:'" + prdname + "'}";
    $.ajax({
        type: "POST",
        url: url,
        contentType: "application/json; charset=utf-8",
        data: datastr,
        dataType: "json",
        success: function (data) {
            $('#div_loading_price').hide();
            var jsdata = data.d;
            var data2Treat = jQuery.parseJSON(jsdata);
            if (data2Treat !== '-1') {
                var contents = "<div class='form-group'>" +
                    "<div class='form-group'>" +
                    "<div class='col-sm-12'>" +
                    "<table style='width:100%' cellpadding='0' cellspacing='0' border='0' class='datatable table table-striped table-bordered table-hover'>" +
                    "<tr>" +
                    "<th style='text-align:center'>Facture</th>" +
                    "<th style='text-align:center'>Date</th>" +
                    "<th style='text-align:center'>Qté</th>" +
                    "<th style='text-align:center'>P.U.</th>" +
                    "<th style='text-align:center'>P.U.R.</th>" +
                    "<th style='text-align:center'>P.T. HT</th>" +
                    "<th style='text-align:center'>P.T. TTC</th>" +
                    "</tr>";
                $.each(data2Treat, function (name, value) {
                    var oneContent = "<tr><td><span  onclick='viewItem(\"" + value.Value2 + "\"," + value.Actived + ")' style='cursor:pointer'>" + value.Value + "</span></td>" +
                        "<td>" + getDateString(value.DValue) + "</td>" +
                        "<td style='text-align:right'>" + value.Key2 + "</td>" +
                        "<td style='text-align:right'>" + value.DcValue + "</td>" +
                        "<td style='text-align:right'>" + value.DcValue4 + "</td>" +
                        "<td style='text-align:right'>" + value.DcValue2 + "</td>" +
                        "<td style='text-align:right'>" + value.DcValue3 + "</td>" +
                        "</tr>";
                    contents += oneContent;
                });
                contents += "</table>" +
                    "</div></div></div>";
                $('#div_price_list').append(contents);
            } else {
                // authentication error
                AuthencationError();
            }
        },
        error: function (data) {
            var test = '';
        }
    });

    return false;
}


function viewItem(fId, isInvoice) {
    //ShowPleaseWait();
    var url = "";
    if (isInvoice) {
        url = '../ClientInvoice/ClientInvoice.aspx?cinId=' + fId + "&mode=view";
    } else {
        url = '../ClientInvoice/ClientInvoiceA.aspx?cinId=' + fId + "&mode=view";
    }
    //document.location = url;

    var win = window.open(url, '_blank');
    win.focus();
    return false;
}
