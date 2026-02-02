function js_getClientType(elementId) {
    var url = window.webservicePath + "/GetClientType";
    var budgetId = '#' + elementId;
    GeneralAjax_Select(url, budgetId);
}

function getCommuneName(sender, elementId) {
    var url = window.webservicePath + "/GetAllCommuneNameByPostcode";
    var postcode = $(sender).val();
    var budgetId = '#' + elementId;
    if (postcode.length >= 2) {
        $.ajax({
            type: "POST",
            url: url,
            contentType: "application/json; charset=utf-8",
            data: "{postcode:'" + postcode + "'}",
            dataType: "json",
            success: function (data) {
                var jsdata = data.d;
                var data2Treat = jQuery.parseJSON(jsdata);
                if (data2Treat !== '-1') {
                    $(budgetId).empty();
                    $.each(data2Treat, function (name, value) {
                        $(budgetId)
                            .append($("<option></option>")
                                .attr("data-value", value.Key)
                                .attr("postcode", value.Value2)
                                .attr("value", value.Value));
                    });
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
    }
}

function communeChange(inputId, dListId, postcodeId) {
    var val = document.getElementById(inputId).value;
    var opts = document.getElementById(dListId).childNodes;
    for (var i = 0; i < opts.length; i++) {
        if (opts[i].value === val) {
            // An item was selected from the list!
            // yourCallbackHere()
            var postcode = $(opts[i]).attr('postcode');
            $('#' + postcodeId).val(postcode);
            break;
        }
    }
}

var allCurrency;
function js_getAllCurrency(elementId) {
    var url = window.webservicePath + "/GetAllCurrency";
    var budgetId = '#' + elementId;
    $.ajax({
        type: "POST",
        url: url,
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        success: function (data) {
            var jsdata = data.d;
            var data2Treat = jQuery.parseJSON(jsdata);
            if (data2Treat !== '-1') {
                allCurrency = data2Treat;
                $(budgetId).empty();
                $.each(data2Treat, function (name, value) {
                    $(budgetId)
                        .append($("<option></option>")
                            .attr("value", value.Key)
                            .text(value.Value2 + " " + value.Value));
                });
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
}


function js_getAllLanguage(elementId) {
    var url = window.webservicePath + "/GetAllLanguage";
    var budgetId = '#' + elementId;
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
                $.each(data2Treat, function (name, value) {
                    $(budgetId)
                        .append($("<option></option>")
                            .attr("value", value.Key)
                            .text(value.Value + " / " + value.Value2));
                });
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
}

function js_getAllTVA(elementId, objname) {
    var url = window.webservicePath + "/GetAllTVA";
    var budgetId = '#' + elementId;
    GeneralAjax_Select(url, budgetId, objname);
}

function js_GetPaymentCondition(elementId, objname) {
    var url = window.webservicePath + "/GetPaymentCondition";
    var budgetId = '#' + elementId;
    //GeneralAjax_Select(url, budgetId, objname);

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
}

function js_GetPaymentMode(elementId, objname) {
    var url = window.webservicePath + "/GetPaymentMode";
    var budgetId = '#' + elementId;
    GeneralAjax_Select(url, budgetId, objname);
}

function js_GetActivity(elementId, objname) {
    var url = window.webservicePath + "/GetActivity";
    var budgetId = '#' + elementId;
    GeneralAjax_Select(url, budgetId, objname);
}

function js_GetCivility(elementId, objname) {
    var url = window.webservicePath + "/GetCivility";
    var budgetId = '#' + elementId;
    GeneralAjax_Select(url, budgetId, objname);
}

function GeneralAjax_Select(url, budgetId, objname) {
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
                    $.each(data2Treat, function (name, value) {
                        $(budgetId)
                            .append($("<option></option>")
                                .attr("value", value.Key)
                                .text(value.Value));
                    });
                }
                // 给object 赋值
                else {
                    window[objname] = [];
                    window[objname] = data2Treat;
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
}

function GeneralAjax_Select(url, budgetId, objname, datastr, withdefaulvalue) {
    $.ajax({
        type: "POST",
        url: url,
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        data: datastr,
        success: function (data) {
            var jsdata = data.d;
            var data2Treat = jQuery.parseJSON(jsdata);
            if (data2Treat !== '-1') {
                // 给element 赋值
                if (budgetId !== '#0') {
                    $(budgetId).empty();
                    if (withdefaulvalue) {
                        $(budgetId)
                            .append($("<option></option>")
                                .attr("value", 0)
                                .attr("data-value",0)
                                .text('Veuillez sélectionner'));
                    }
                    $.each(data2Treat, function (name, value) {
                        $(budgetId)
                            .append($("<option></option>")
                                .attr("value", value.Key)
                                .attr("data-value", value.Value2)
                                .text(value.Value));
                    });
                }
                // 给object 赋值
                else {
                    window[objname] = [];
                    window[objname] = data2Treat;
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
}

function js_FillElement(elementId, obj) {
    if (elementId !== 0) {
        var budgetId = '#' + elementId;
        $(budgetId).empty();
        $.each(obj, function (name, value) {
            $(budgetId)
                .append($("<option></option>")
                    .attr("value", value.Key)
                    .text(value.Value));
        });
    }
}

function AjaxCallWithResponse(url, datastr, responseFunc) {
    $.ajax({
        type: "POST",
        url: url,
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        data: datastr,
        success: function (data) {
            var jsdata = data.d;
            //var data2Treat = jQuery.parseJSON(jsdata);
            var data2Treat = [];
            try {
                data2Treat = jQuery.parseJSON(jsdata);
            } catch (e) {
                data2Treat = JSON.parse(jsdata);
            }

            if (data2Treat !== '-1') {
                // 给element 赋值
                responseFunc(data2Treat);
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
}

function closeDialog() {
    $('.close').click();
    HidePleaseWait();
    return false;
}