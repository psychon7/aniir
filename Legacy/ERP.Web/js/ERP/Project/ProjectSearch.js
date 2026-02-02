function createProject() {
    window.location = 'Project.aspx';
}

var hasSet = false;
function jsSearchPrj() {
    myApp.showPleaseWait();
    var PrjName = $('#PrjName').val().trim();
    var PrjCode = $('#PrjCode').val().trim();
    var ClientCompanyName = $('#ClientCompanyName').val().trim();
    var jsondata = JSON.stringify({ prjName: PrjName, prjCode: PrjCode, clientName: ClientCompanyName });
    var url = window.webservicePath + "/SearchProject";
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
                try {
                    $('#datatable_search_result').remove();
                    var datatableContent = "<table id='datatable_search_result' cellpadding='0' cellspacing='0' border='0' class='datatable table table-striped table-bordered table-hover'>" +
                        "<thead id='thead_search_result'>" +
                        "<tr><th class='language_txt'>Nom du projet</th><th class='language_txt'>Code du projet</th><th class='language_txt'>Raison sociale</th><th> class='language_txt'Montant (Facturé) HT</th></tr>" +
                        "</thead>" +
                        "<tbody id='tbody_search_result'></tbody>" +
                        "<tfoot id='tfoot_search_result'>" +
                        "<tr><th>Nom du projet</th><th>Code du projet</th><th>Raison sociale</th><th>Montant (Facturé) HT</th></tr>" +
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
                    var header_footer = "<tr><th class='language_txt'>Nom du projet</th><th class='language_txt'>Code du projet</th><th class='language_txt'>Raison sociale</th><th class='language_txt'>Montant (Facturé) HT</th></tr>";

                    $('#thead_search_result').empty();
                    $('#tfoot_search_result').empty();

                    $('#thead_search_result').append(header_footer);
                    $('#tfoot_search_result').append(header_footer);

                    var titles = new Array();
                    titles.push({ "sTitle": "Nom du projet" });
                    titles.push({ "sTitle": "Code du projet" });
                    titles.push({ "sTitle": "Raison sociale" });
                    titles.push({ "sTitle": "Montant (Facturé) HT" });


                    var displaycount = 1;
                    $.each(data2Treat, function (name, value) {
                        $('#mask_processing').text('Traitement en cours ' + displaycount + '/' + resultcount);
                        $('#mask_processing').val('Traitement en cours ' + displaycount + '/' + resultcount);
                        var dataArray = new Array();
                        dataArray.push("<span  onclick='viewProject(\"" + value.FId + "\")' style='cursor:pointer'>" + value.PrjName + "</span>");
                        dataArray.push(value.PrjCode);
                        dataArray.push(value.ClientCompanyName);
                        dataArray.push(value.PrdInvoicedAmount);
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
                        //                        $('#datatable_search_result').dataTable({
                        //                            "sPaginationType": "bs_full",
                        //                            "bDestroy": true,
                        //                            "bRetrieve": true,
                        //                            "bServerSide": true,
                        //                            "bProcessing": true
                        //                        });
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

function viewProject(fId) {
    ShowPleaseWait();
    var url = 'Project.aspx?prjId=' + fId + "&mode=view";
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
