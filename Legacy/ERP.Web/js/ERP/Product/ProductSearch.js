$(document).ready(initFunc);


function initFunc() {
    getProductTypes();

    SetLanguageBar();
}

function getProductTypes() {
    var elementId = 'PtyId';
    var url = window.webservicePath + "/GetProductTypes";
    var datastr = '{selectedType:0}';
    var budgetId = '#' + elementId;
    GeneralAjax_Select(url, budgetId, '', datastr, true);
}

function prdSearchPtyChange(sender) {
    var url = window.webservicePath + "/GetPtySearchFields";
    var ptyId = $(sender).val();
    var datastr = "{ptyId:" + ptyId + "}";
    $('#divPtySearchFields').empty();
    propForSearch = [];
    //AjaxCallWithResponse(url, datastr, setPropertyForSearch);
}

var propForSearch = [];
function setPropertyForSearch(propValues) {
    propForSearch = [];
    if (propValues) {
        var propCount = propValues.length;
        var lineCount = 1;
        var allSearchContent = "";
        propForSearch = propValues;
        $.each(propValues, function (index, value) {
            var startDiv = "";
            var endDiv = "";
            if (lineCount === 1) {
                startDiv = "<div class='form-group'>";
            }
            var searchLabel = "<label class='col-sm-3 control-label'>" + value.PropName + "</label>";
            var isNormal = value.PropType === "1" ? "class='form-control'" : "";
            var isNumber = value.PropType === "2" ? "class='form-control' type='number'" : "";
            var isDecimal = value.PropType === "3" ? "class='form-control' type='number' step='0.1'" : "";
            var isDateTime = value.PropType === "4" ? "class='form-control' id='PropValue_DT_Picker_" + value.PropGuid + "'" : "";
            var isBoolean = value.PropType === "5" ? "class='form-control' type='checkbox'" : "";
            var valueType = isNormal + isNumber + isDecimal + isDateTime + isBoolean;
            var inputContent = '';
            var required = value.PropIsNullable ? '' : 'required ';
            var inputId = isDateTime ? "" : "id=PropValue_" + value.PropGuid;
            var inputvalue = " placeholder='" + value.PropValue + "' ";
            var propguid = ' propid=' + value.PropGuid + ' ';
            if (value.PropUnit) {
                var unitRight = value.PropIsUnitRightSide ? "<span class='input-group-addon'>" + value.PropUnit + "</span>" : "";
                var unitLeft = !value.PropIsUnitRightSide ? "<span class='input-group-addon'>" + value.PropUnit + "</span>" : "";
                inputContent = "<div class='input-group'>" +
                    unitLeft +
                    "<input " + valueType + " " + inputId + inputvalue + propguid + " />" +
                    unitRight +
                    "</div>";
            } else {
                inputContent = "<input " + valueType + " " + inputId + inputvalue + propguid + " />";
            }
            var searchContent = "<div class='col-sm-3'>" + inputContent + "</div>";

            if (lineCount === 3) {
                endDiv = "</div>";
                lineCount = 1;
            } else {
                lineCount++;
            }
            allSearchContent += startDiv + searchLabel + searchContent + endDiv;
        });

        $('#divPtySearchFields').append(allSearchContent);

    }
}

var hasSet = false;

function jsSearchPrd() {
    //var checkOk = CheckRequiredFieldInOneDiv('divSearchCondition');
    var checkOK = ($('#PtyId').val() !== '0' && $('#PtyId').val() !== "0" && $('#PtyId').val() !== 0)
        || $('#PrdInfo').val() !== '';
    //        || $('#PrdName').val() !== ''
    //        || $('#PrdRef').val() !== '';
    if (checkOK) {
        jsDoSearchPrd();
    } else {
        MsgErrorPopUp('Attention', 'Veuillez remplir \'Type du produit\' ou \'Référence, code, nom du produit\'');
    }
    return false;
}

function jsDoSearchPrd() {
    myApp.showPleaseWaitWithText('Recherche en cours...');
    dialogMsg(16, 'Veuillez patienter...', 5000);
    var ptyId = $('#PtyId').val();
    var prdInfo = $('#PrdInfo').val().trim();
    //    var prdRef = $('#PrdRef').val().trim();
    //    var prdCode = $('#PrdCode').val().trim();
    var listSearch = [];
    var props = $('input[id^="PropValue_"]');
    $.each(props, function (name, value) {
        var inputvalue = $(value).val().trim();
        if (inputvalue) {
            var propid = $(value).attr('propid');
            var propValue = {};
            propValue.PropGuid = propid;
            propValue.PropValue = inputvalue.trim();
            listSearch.push(propValue);
        }
    });
    var jsondata = JSON.stringify({ ptyId: ptyId, prdInfo: prdInfo, searchValues: listSearch });
    var url = window.webservicePath + "/SearchProduct";
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
                    closeLayer();
                    NoResultMsg();
                } else {
                    //SetPleaseWaitText('Traitement en cours ...');
                    //closeLayer();
                    dialogMsg(16, 'Les 500 premiers résultats seront affichés', 5000);
                    //ShowPleaseWaitWithText('Setting...');
                    //console.log(data2Treat);
                    setResult(data2Treat);
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
function selectAllPrd(sender) {
    var ischecked = $(sender).is(':checked');
    var cpls = $("input[id^='cbx_trait_prd_']");
    $.each(cpls, function (name, value) {
        $(value).prop('checked', ischecked);
    });
    displayPrdTchSheetButton();
}

function displayPrdTchSheetButton() {
    var cpls = $("input[id^='cbx_trait_prd_']:checked").length > 0;
    if (cpls) {
        $('#btn_exportPdf_prd').show();
    } else {
        $('#btn_exportPdf_prd').hide();
    }
}

function ExportPrdsPdf() {
    var prdIds = '';
    var cplsChecked = $("input[id^='cbx_trait_prd_']:checked");
    $.each(cplsChecked, function (name, value) {
        var prdid = $(value).attr('prdid') * 1;
        prdIds += (prdid + ',');
    });
    if (prdIds) {
        var jsondata = JSON.stringify({ prdIds: prdIds });
        var url = window.webservicePath + "/GenerateProductTchSheetPdf";
        myApp.showPleaseWait();
        $.ajax({
            url: url,
            type: 'POST',
            contentType: 'application/json; charset=utf-8',
            data: jsondata,
            dataType: 'json',
            success: function (data) {
                myApp.hidePleaseWait();
                var url = "../Common/PageDownLoad.aspx?hasprdIds=true";
                var win = window.open(url, '_blank');
                if (win) {
                    //Browser has allowed it to be opened
                    win.focus();
                } else {
                    //Browser has blocked it
                    alert('Please allow popups for this website');
                }
            },
            error: function (data) {
                myApp.hidePleaseWait();
            }
        });
    }
    return false;
}


function setResult(data2Treat) {
    var resultcount = data2Treat.length;
    var header_footer = "<tr>" +
        "<th><input type='checkbox' onclick='selectAllPrd(this)'/></th>" +
        "<th class='language_txt'>Nom du produit</th>" +
        "<th class='language_txt'>Référence du produit</th>" +
        "<th class='language_txt'>Sous Référence</th>" +
        "<th class='language_txt'>Fournisseur</th>" +
        "</tr>";

    try {
        $('#datatable_search_result').remove();
        var datatableContent = "<table id='datatable_search_result' cellpadding='0' cellspacing='0' border='0' class='datatable table table-striped table-bordered table-hover'>" +
                        "<thead id='thead_search_result'>" +
                        header_footer +
                        "</thead>" +
                        "<tbody id='tbody_search_result'></tbody>" +
                        "<tfoot id='tfoot_search_result'>" +
                        header_footer +
                        "</tfoot></table>";
        $('#div_for_datatable').html(datatableContent);
    } catch (e) {
        var test = '';
    }

    $('#result_count').text(resultcount);
    if (resultcount > 0) {
        $('.searchresult').show();
        $('#mask_processing').text(resultcount + ' resultats ...');
        $('#mask_processing').val(resultcount + ' resultats ...');
        //        if (propForSearch && propForSearch.length > 0) {
        //            header_footer += "<th class='language_txt'>Sous Référence</th>";
        //            $.each(propForSearch, function (name, value) {
        //                header_footer += "<th class='language_txt'>" + value.PropName + "</th>";
        //            });
        //        }
        //        header_footer += "</tr>";

        $('#thead_search_result').empty();
        $('#tfoot_search_result').empty();

        $('#thead_search_result').append(header_footer);
        $('#tfoot_search_result').append(header_footer);

        var titles = new Array();
        titles.push({ "sTitle": "SelectAll" });
        titles.push({ "sTitle": "Nom du produit" });
        titles.push({ "sTitle": "Référence du produit" });
        //titles.push({ "sTitle": "Code du produit" });
        titles.push({ "sTitle": "Sous Référence" });
        titles.push({ "sTitle": "Supplier" });

//        if (propForSearch && propForSearch.length > 0) {
//            titles.push({ "sTitle": "Sous Référence" });
//        }
//        $.each(propForSearch, function (name, value) {
//            titles.push({ "sTitle": value.PropName });
//        });

        var displaycount = 1;
        LogTime("start ...");

        $.each(data2Treat, function(name, value) {
            //$('#mask_processing').text('Traitement en cours ' + displaycount + '/' + resultcount);
            //$('#mask_processing').val('Traitement en cours ' + displaycount + '/' + resultcount);
            var dataArray = new Array();
            var supplierName = '';
            var subPrd = '';
            if (value.ProductSuppliers) {
                $.each(value.ProductSuppliers, function(order, supname) {
                    supplierName += supname + '<br />';
                });
            }
            if (value.InstanceList) {
                $.each(value.InstanceList, function(order, onepit) {
                    subPrd += onepit.PitRef + '<br />';
                });
            }
            dataArray.push("<input type='checkbox' id='cbx_trait_prd_" + value.PrdId + "' prdId='" + value.PrdId + "' onclick='displayPrdTchSheetButton()'/>");
            dataArray.push("<span  onclick='viewProduct(\"" + value.FId + "\")' style='cursor:pointer'>" + value.PrdName + "</span>");
            var prdref = value.PrdRef;
            dataArray.push("<span  onclick='viewProduct(\"" + value.FId + "\")' style='cursor:pointer'>" + prdref + "</span>");
            //dataArray.push("<span  onclick='viewProduct(\"" + value.FId + "\")' style='cursor:pointer'>" + value.PrdCode + "</span>");
            dataArray.push("<span  onclick='viewProduct(\"" + value.FId + "\")' style='cursor:pointer'>" + subPrd + "</span>");
            dataArray.push("<span  onclick='viewProduct(\"" + value.FId + "\")' style='cursor:pointer'>" + supplierName + "</span>");

//            if (propForSearch && propForSearch.length > 0) {
//                dataArray.push("<span  onclick='viewProduct(\"" + value.FId + "\")' style='cursor:pointer'>" + value.PitRef + "</span>");
//            }
//            if (value.PitAllInfo) {
//                $.each(value.PitAllInfo, function (index, propV) {
//                    dataArray.push(propV.PropValue);
//                });
//            }
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

        closeLayer();
    } else {
        $('#div_for_datatable').empty();
    }

    SetLanguageBar();
}


function setResult_oldbefore20231112(data2Treat) {
    var resultcount = data2Treat.length;
    var header_footer = "<tr>" +
        "<th><input type='checkbox' onclick='selectAllPrd(this)'/></th>" +
        "<th class='language_txt'>Nom du produit</th>" +
                    "<th class='language_txt'>Référence du produit</th>" +
                    "<th class='language_txt'>Fournisseur</th>" +
                    "<th class='language_txt'>Code du produit</th>";
    try {
        $('#datatable_search_result').remove();
        var datatableContent = "<table id='datatable_search_result' cellpadding='0' cellspacing='0' border='0' class='datatable table table-striped table-bordered table-hover'>" +
                        "<thead id='thead_search_result'>" +
                        header_footer +
                        "</thead>" +
                        "<tbody id='tbody_search_result'></tbody>" +
                        "<tfoot id='tfoot_search_result'>" +
                        header_footer +
                        "</tfoot></table>";
        $('#div_for_datatable').html(datatableContent);
    } catch (e) {
        var test = '';
    }

    $('#result_count').text(resultcount);
    if (resultcount > 0) {
        $('.searchresult').show();
        $('#mask_processing').text(resultcount + ' resultats ...');
        $('#mask_processing').val(resultcount + ' resultats ...');
        if (propForSearch && propForSearch.length > 0) {
            header_footer += "<th class='language_txt'>Sous Référence</th>";
            $.each(propForSearch, function (name, value) {
                header_footer += "<th class='language_txt'>" + value.PropName + "</th>";
            });
        }
        header_footer += "</tr>";

        $('#thead_search_result').empty();
        $('#tfoot_search_result').empty();

        $('#thead_search_result').append(header_footer);
        $('#tfoot_search_result').append(header_footer);

        var titles = new Array();
        titles.push({ "sTitle": "SelectAll" });
        titles.push({ "sTitle": "Nom du produit" });
        titles.push({ "sTitle": "Référence du produit" });
        titles.push({ "sTitle": "Supplier" });
        titles.push({ "sTitle": "Code du produit" });
        //titles.push({ "sTitle": "Sous Référence" });

        if (propForSearch && propForSearch.length > 0) {
            titles.push({ "sTitle": "Sous Référence" });
        }
        $.each(propForSearch, function (name, value) {
            titles.push({ "sTitle": value.PropName });
        });

        var displaycount = 1;
        LogTime("start ...");

        $.each(data2Treat, function (name, value) {
            //$('#mask_processing').text('Traitement en cours ' + displaycount + '/' + resultcount);
            //$('#mask_processing').val('Traitement en cours ' + displaycount + '/' + resultcount);
            var dataArray = new Array();
            var supplierName = '';
            if (value.ProductSuppliers) {
                $.each(value.ProductSuppliers, function (order, supname) {
                    supplierName += supname + '<br />';
                });
            }
            dataArray.push("<input type='checkbox' id='cbx_trait_prd_" + value.PrdId + "' prdId='" + value.PrdId + "' onclick='displayPrdTchSheetButton()'/>");
            var prdref = IsNullOrEmpty(value.PitRef) ? value.PrdRef : value.PitRef;
            dataArray.push("<span  onclick='viewProduct(\"" + value.FId + "\")' style='cursor:pointer'>" + value.PrdName + "</span>");
            dataArray.push("<span  onclick='viewProduct(\"" + value.FId + "\")' style='cursor:pointer'>" + prdref + "</span>");
            dataArray.push("<span  onclick='viewProduct(\"" + value.FId + "\")' style='cursor:pointer'>" + supplierName + "</span>");
            dataArray.push("<span  onclick='viewProduct(\"" + value.FId + "\")' style='cursor:pointer'>" + value.PrdCode + "</span>");
            //dataArray.push("<span  onclick='viewProduct(\"" + value.FId + "\")' style='cursor:pointer'>" + value.PitRef + "</span>");

            if (propForSearch && propForSearch.length > 0) {
                dataArray.push("<span  onclick='viewProduct(\"" + value.FId + "\")' style='cursor:pointer'>" + value.PitRef + "</span>");
            }
            if (value.PitAllInfo) {
                $.each(value.PitAllInfo, function (index, propV) {
                    dataArray.push(propV.PropValue);
                });
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
}


function viewProduct(fId) {
    ShowPleaseWait();
    var url = 'Product.aspx?prdId=' + fId + "&mode=view";
    //window.location = url;
    var win = window.open(url, '_blank');
    win.focus();
    HidePleaseWait();
    return false;
}

function createProduct() {
    var url = 'Product.aspx?mode=create';
    window.location.href = url;
}