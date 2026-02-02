
$(document).ready(initSearch);

function initSearch() {

    SetLanguageBar();
}


//var myApp;
//myApp = myApp || (function () {
//    var pleaseWaitDiv = $('<div class="modal " style="text-align:center" id="pleaseWaitDialog" data-backdrop="static" data-keyboard="false">' +
//        '<div class="modal-header" style="margin-top:200px; border-bottom: 0px !important;"><h1 id="mask_processing">Traitement en cours ...</h1></div>' +
//        '<div class="modal-body">' +
//        '<img src="../../img/loaders/4.gif"></div></div>');
//    return {
//        showPleaseWait: function() {
//            $('#mask_processing').text('Processing...');
//            pleaseWaitDiv.modal();
//        },
//        hidePleaseWait: function () {
//            pleaseWaitDiv.modal('hide');
//        },
//        showPleaseWaitWithText: function (text) {
//            $('#mask_processing').text(text);
//            pleaseWaitDiv.modal();
//        },

//    };
//})();

var hasSet = false;

function viewSearchSupplierResult(data2Treat) {
    var name = '_sprs';
    var dt_name = 'dt' + name;
    var div_name = 'div' + name;
    var th_name = 'th' + name;
    var tb_name = 'tb' + name;
    var tf_name = 'tf' + name;
    var rst_name = 'rst' + name;

    var headerFooter = "<tr>" +
                    "<th class='language_txt'>Fournisseur</th>" +
                    "<th class='language_txt'>Notre Réf</th>" +
                    "<th class='language_txt'>Leur Réf</th>" +
                    "<th class='language_txt'>Nom de produit</th>" +
                    "<th class='language_txt'>Prix Normal</th>" +
                    "<th class='language_txt'>Prix Dimmable</th>" +
                    "<th class='language_txt'>Prix Dali</th>" +
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
        titles.push({ "sTitle": "OurRef" });
        titles.push({ "sTitle": "TheirRef" });
        titles.push({ "sTitle": "PrdName" });
        titles.push({ "sTitle": "Prix1" });
        titles.push({ "sTitle": "Prix100" });
        titles.push({ "sTitle": "Prix500" });

        var displaycount = 1;
        $.each(data2Treat, function(name, value) {
            var dataArray = new Array();
            dataArray.push("<span  onclick='viewSupplier(\"" + value.SupFId + "\")' style='cursor:pointer'>" + value.SupplierName + "</span>");
            dataArray.push(value.PrdRef);
            dataArray.push(value.SprPrdRef);
            dataArray.push(value.PrdName);
            dataArray.push(value.SprPrice_1_100);
            dataArray.push(value.SprPrice_100_500);
            dataArray.push(value.SprPrice_500_plus);
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
    myApp.hidePleaseWait();
}

function viewSupplier(fId) {
    myApp.showPleaseWait();
    var url = 'SupplierProduct.aspx?supId=' + fId + "&mode=view";
    window.location.href = url;
}



function js_search_supplier() {
    var url = window.webservicePath + "/SerachSupplierProduct";
    var CompanyName = $('#CompanyName').val().trim();
    var Reference = $('#Reference').val().trim();
    myApp.showPleaseWait();

    var jsondata = JSON.stringify({ companyName: CompanyName, reference: Reference });
    myApp.showPleaseWait();
    $.ajax({
        url: url,
        type: 'POST',
        contentType: 'application/json; charset=utf-8',
        data: jsondata,
        dataType: 'json',
        success: function (data) {
            myApp.hidePleaseWait();
            var jsdata = data.d;
            var jsondata = jQuery.parseJSON(jsdata);
            if (jsondata.length === 0) {
                NoResultMsg();
            }
            viewSearchSupplierResult(jsondata);

            SetLanguageBar();
        },
        error: function (data) {
        myApp.hidePleaseWait();
        }
    });
    return false;
}

function createItem() {
    ShowPleaseWait();
    window.location = "SupplierProduct.aspx";
}