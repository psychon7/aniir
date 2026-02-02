
$(document).ready(initSearch);

function initSearch() {
    //    var mode = getUrlVars()['mode'];
    //    if (mode === 'result') {
    //        viewSearchSupplierResult();
    //    }

    SetLanguageBar();
}

var hasSet = false;

function viewSearchSupplierResult(searchsupplierresult) {
    var budgetId = '#tbody_supplier_result';
    //var searchsupplierresult = readCookieJson('searchsupplierresult0');
    if (hasSet) {
        $('#datatable_supplier_result').dataTable().fnClearTable();
    }
    $('#result_count').text(searchsupplierresult.length);
    if (searchsupplierresult.length > 0) {
        $('.searchresult').show();
        var content = "";
        // 测试用array 是否可行，可行！
        $.each(searchsupplierresult, function (name, value) {
            var testAry = [];
            testAry.push("<span onclick='viewsupplier(\"" + value.FId + "\")' style='cursor:pointer'>" + value.CompanyName + " [" + value.Abbreviation + "]" + "</span>");
            testAry.push(value.Reference);
            testAry.push(value.Postcode);
            testAry.push(value.City);
            testAry.push(value.Tel1);
            testAry.push(value.Fax);
            testAry.push(value.Email);
            $('#datatable_supplier_result').dataTable().fnAddData(testAry);
        });


        //$(budgetId).append(content);
        try {
            if (!hasSet) {
                $('#datatable_supplier_result').dataTable({
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

function viewsupplier(fId) {
    ShowPleaseWait();
    var url = 'Supplier.aspx?supId=' + fId + "&mode=view";
    window.location.href = url;
}

function js_search_supplier() {
    var searchSupplier = Object();
    myApp.showPleaseWait();
    searchSupplier.CompanyName = $('#CompanyName').val().trim();
    searchSupplier.Postcode = $('#Postcode').val().trim();
    searchSupplier.City = $('#City').val().trim();
    searchSupplier.Reference = $('#Reference').val().trim();
    searchSupplier.Email = $('#Email').val().trim();
    searchSupplier.Tel1 = $('#Tel1').val().trim();
    searchSupplier.Tel2 = $('#Tel1').val().trim();

    var jsondata = JSON.stringify({ searchSupplier: searchSupplier });
    $.ajax({
        url: 'SearchSupplier.aspx/SearchSupplierWithCriterion',
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
        },
        error: function (data) {
            myApp.hidePleaseWait();
        }
    });
    return false;
}


function create_supplier_click() {
    ShowPleaseWait();
    window.location = "Supplier.aspx";
}
