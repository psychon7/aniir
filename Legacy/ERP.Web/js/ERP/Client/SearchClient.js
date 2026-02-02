
$(document).ready(initSearch);

function initSearch() {
    //    var mode = getUrlVars()['mode'];
    //    if (mode === 'result') {
    //        viewSearchClientResult();
    //    }
    var url = window.webservicePath + "/GetClientType";
    var budgetId = '#CtyId';
    $.ajax({
        type: "POST",
        url: url,
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        success: function (data) {
            var jsdata = data.d;
            var data2Treat = jQuery.parseJSON(jsdata);
            if (data2Treat !== '-1') {
                // 给element 赋值
                if (budgetId !== '#0') {
                    $(budgetId).empty();
                    $(budgetId).append($("<option></option>")
                        .attr("data-value", 0)
                        .attr("value", 0)
                        .text('Sélectionner un type'));
                    $.each(data2Treat, function (name, value) {
                        $(budgetId)
                            .append($("<option></option>")
                                .attr("value", value.Key)
                                .attr("data-value", value.ValuePCO)
                                .text(value.Value));
                    });
                }
            }
            else {
                // authentication error
                AuthencationError();
            }
        },
        error: function (data) {
            var test = '';
        }
    });
    SetLanguageBar();
}

var hasSet = false;

function viewSearchClientResult(searchclientresult) {
    var budgetId = '#tbody_client_result';
    //var searchclientresult = readCookieJson('searchclientresult0');
    if (hasSet) {
        $('#datatable_client_result').dataTable().fnClearTable();
    }
    $('#result_count').text(searchclientresult.length);
    if (searchclientresult.length > 0) {
        $('.searchresult').show();
        var content = "";
        //$(budgetId).empty();

        //        $.each(searchclientresult, function (name, value) {
        //            content += "<tr class='gradeA' style='cursor:pointer'>" +
        //                "<td>" + value.CompanyName + "</td>" +
        //                "<td>" + value.Reference + "</td>" +
        //                "<td>" + value.Postcode + "</td>" +
        //                "<td>" + value.City + "</td>" +
        //                "<td class='hidden-xs'>" + value.Tel1 + "</td>" +
        //                "<td class='center'>" + value.Fax + "</td>" +
        //                "<td>" + value.Email + "</td></tr>";

        //        });


        //        $.each(searchclientresult, function (name, value) {
        //            $('#datatable_client_result').dataTable().fnAddData([
        //                "<span  onclick='viewclient(\"" + value.FId + "\")' style='cursor:pointer'>" + value.CompanyName + "</span>",
        //                value.Reference,
        //                value.Postcode,
        //                value.City,
        //                value.Tel1,
        //                value.Fax,
        //                value.Email
        //            ]);
        //        });


        // 测试用array 是否可行，可行！
        $.each(searchclientresult, function (name, value) {
            var testAry = [];
            var companyname = value.CompanyName + (IsNullOrEmpty(value.CliAbbr) ? "" : ("-" + value.CliAbbr));
            testAry.push("<span  onclick='viewclient(\"" + value.FId + "\")' style='cursor:pointer'>" + companyname + "</span>");
            testAry.push("<span  onclick='viewclient(\"" + value.FId + "\")' style='cursor:pointer'>" + value.Reference + "</span>");
            //ClientTypes
            var typecontent = "";
            $.each(value.ClientTypes, function (name2, clienttype) {
                typecontent += (clienttype.Value + '</br>')
            });
            testAry.push(typecontent);
            testAry.push(value.Postcode);
            testAry.push(value.City);
            testAry.push(value.Tel1);
            testAry.push(value.Fax);
            testAry.push(value.Email);
            $('#datatable_client_result').dataTable().fnAddData(testAry);
        });


        //$(budgetId).append(content);
        try {
            if (!hasSet) {
                $('#datatable_client_result').dataTable({
                    "sPaginationType": "bs_full",
                    "bDestroy": true,
                    "bRetrieve": true,
                    "bServerSide": true
                });
                hasSet = true;
            }
        } catch (e) {

        }
    }
}

function viewclient(fId) {
    ShowPleaseWait();
    var url = 'Client.aspx?cliId=' + fId + "&mode=view";
    //window.location.href = url;
    var win = window.open(url, '_blank');
    win.focus();
    HidePleaseWait();
    return false;
}

function js_search_client() {
    var searchClient = Object();
    myApp.showPleaseWait();
    searchClient.CompanyName = $('#CompanyName').val().trim();
    searchClient.Postcode = $('#Postcode').val().trim();
    searchClient.City = $('#City').val().trim();
    searchClient.Reference = $('#Reference').val().trim();
    searchClient.Email = $('#Email').val().trim();
    searchClient.Tel1 = $('#Tel1').val().trim();
    searchClient.Tel2 = $('#Tel1').val().trim();
    searchClient.CtyId = $('#CtyId option:selected').val() * 1;

    var jsondata = JSON.stringify({ searchClient: searchClient });
    $.ajax({
        url: 'SearchClient.aspx/SearchClientWithCriterion',
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
            viewSearchClientResult(jsondata);
            //createCookieJson('searchclientresult0', jsondata);
            //            window._searchClientResult = [];
            //            window._searchClientResult = jsondata;
            //            var url = window.location.href.split('?')[0];
            //            var newUrl = url + '?mode=result';
            //            document.location.href = newUrl;
            //window.location.reload(false);
        },
        error: function (data) {
            myApp.hidePleaseWait();
        }
    });
    return false;
}


function create_client_click() {
    window.location = "Client.aspx";
}