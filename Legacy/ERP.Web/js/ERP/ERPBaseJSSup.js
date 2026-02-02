
$(document).ready(initBase);

function initBase() {
    //ShowPleaseWait();
    getServicePath();
    HideAllFileds();
    GetConnectedUser();
}

function HideAllFileds() {
    $('#header-notification').hide();
    $('#header-tasks').hide();
    //$('#header-user').hide();
    $('#li_profile').hide();
    $('#dashboard').hide();
    $('#li_album').hide();
    $('#li_product').hide();
    $('#li_supplier').hide();
    $('#li_client').hide();
    $('#li_project').hide();
    $('#li_costplan').hide();
    $('#li_clientorder').hide();
    $('#li_deliveryform').hide();
    $('#li_clientinvoice').hide();
    $('#li_logistic').hide();
    $('#li_warehouse').hide();
    $('#li_company').hide();
    $('#li_users').hide();
    $('#li_supplierorder').show();
    $('#sub_searchpin').hide();
    $('#sub_ia_sod_detail').hide();
    $('#sub_searchsod').hide();
    $('#sub_soddetail').hide();
    $('#sub_sodpayment').hide();
    $('#sub_searchsin').hide();
    $('#sub_sodcinpayment').hide();
    $('#sub_sodstatus').hide();
    $('#sub_searchsod_sup').show();
}

var myApp;
myApp = myApp || (function () {
    var pleaseWaitDiv = $('<div class="modal " style="text-align:center; z-index: 10000; background:#808080;opacity:0.3" id="pleaseWaitDialog" data-backdrop="static" data-keyboard="false">' +
        '<div class="modal-header" style="margin-top:200px; border-bottom: 0px !important; color:black"><h1 id="mask_processing">Traitement en cours ...</h1></div>' +
        '<div class="modal-body">' +
        '<img src="../../img/loaders/12.gif"></div></div>');
    return {
        showPleaseWait: function() {
            $('#mask_processing').text('Traitement en cours...');
            try {
                pleaseWaitDiv.modal();
            } catch (e) {

            }
        },
        hidePleaseWait: function() {
            try {
                pleaseWaitDiv.modal('hide');
            } catch (e) {

            }
        },
        showPleaseWaitWithText: function(text) {
            try {
                pleaseWaitDiv.modal();
                $('#mask_processing').text(text);
            } catch (e) {

            }
        },
    };
})();

function HidePleaseWait() {
    myApp.hidePleaseWait();
}

function ShowPleaseWait() {
   myApp.showPleaseWait();
}

function ShowPleaseWaitWithText(text) {
    myApp.showPleaseWaitWithText(text);
}

function SetPleaseWaitText(text) {
    $('#mask_processing').text(text);
}


try {

    $.datepicker.regional['fr'] = { clearText: 'Effacer', clearStatus: '',
        closeText: 'Fermer', closeStatus: 'Fermer sans modifier',
        prevText: '&lt;Préc', prevStatus: 'Voir le mois précédent',
        nextText: 'Suiv&gt;', nextStatus: 'Voir le mois suivant',
        currentText: 'Courant', currentStatus: 'Voir le mois courant',
        monthNames: ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'],
        monthNamesShort: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun',
    'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'],
        monthStatus: 'Voir un autre mois', yearStatus: 'Voir un autre année',
        weekHeader: 'Sm', weekStatus: '',
        dayNames: ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'],
        dayNamesShort: ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'],
        dayNamesMin: ['Di', 'Lu', 'Ma', 'Me', 'Je', 'Ve', 'Sa'],
        dayStatus: 'Utiliser DD comme premier jour de la semaine', dateStatus: 'Choisir le DD, MM d',
        dateFormat: 'dd/mm/yy', firstDay: 0,
        initStatus: 'Choisir la date', isRTL: false
    };
    $.datepicker.setDefaults($.datepicker.regional['fr']);

} catch (e) {

}
var webservicePath = "";

function IsView() {
    //var mode = getUrlVars()['mode'];
    var mode = getParameterByName('mode');
    return mode === 'view';
}
function IsModify() {
    var mode = getParameterByName('mode');
    return mode === 'modify';
}
function IsCreate() {
    var mode = getParameterByName('mode');
    return (mode === undefined || mode === '' || mode === 'create');
}

var _isView = IsView();
var _isModify = IsModify();
var _isCreate = IsCreate();


/* bagin  all variable  */

var _searchClientResult = [];

/* end  all variable  */


function CheckFiledValue(fieldname, fieldtype, isNullable, isCkEditor) {
    var checkOk = false;
    try {
        fieldtype = fieldtype.toLowerCase();
        var thisfieldname = '#' + fieldname;
        // check this field by itself
        //$(thisfieldname)[0].checkValidity();
        var thisfieldvalue = isCkEditor ? CKEDITOR.instances[fieldname].getData() : $(thisfieldname).val();
        if (thisfieldvalue.length == 0) {
            if (isNullable) {
                checkOk = true;
            }
        } else {
            switch (fieldtype) {
                case 'number':
                    {
                        thisfieldvalue = thisfieldvalue.replace(',', '.').replace(" ", "");
                        checkOk = !isNaN(thisfieldvalue);
                    }
                    break;
                case 'date':
                    {

                    }
                    break;
                default:
                    {
                        checkOk = true;
                    }
            }
        }
    } catch (e) {

    }
    return checkOk;
}

function getParameterByName(name) {
    name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
    var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
        results = regex.exec(location.search);
    return results === null ? "" : HTMLEncode(decodeURIComponent(results[1]));
    //return results === null ? "" : Encoder.htmlEncode(decodeURIComponent(results[1]), true);
}

function getParameterByNameNoHtmlCode(string, name) {
    name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
    var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
        results = regex.exec(string);
    return results === null ? "" : decodeURIComponent(results[1]);
    //return results === null ? "" : Encoder.htmlEncode(decodeURIComponent(results[1]), true);
}

function initMode() {
    var mode = getParameterByName('mode');
    if (mode === 'view') {
        $('.forview').show();
    } else if (mode === undefined || mode === '' || mode === 'create') {
        $('.forcreate').show();
    } else if (mode === 'modify') {
        $('.forupdate').show();
    }
    iniTitleMenu();
}

var connectedUser = {};
function GetConnectedUser() {
    ShowPleaseWait();
    var url = window.webservicePath + "/GetCurrentSupplierInfo";
    $.ajax({
        type: "POST",
        url: url,
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        success: function(data) {
            HidePleaseWait();
            var jsdata = data.d;
            //var currentUser= jQuery.parseJSON(jsdata);
            var _currentUser = JSON.parse(jsdata);
            connectedUser = _currentUser;
            if (_currentUser !== "-1") {
                $('#span_user_profil_name').text("[" + _currentUser.Abbreviation + "]");
                if (connectedUser.SocShowLanguageBar) {
                    $('#li_language').show();
                }
            } else {
            HidePleaseWait();
                AuthencationError();
            }
        },
        error: function(data) {
            var test = '';
        }
    });

}


function iniTitleMenu() {
    var _hideHeader = getParameterByName('hideHeader');
    var _hideSideMenu = getParameterByName('hideSideMenu');
    var _hideAllBtn = getParameterByName('hideAllBtn');
    if (_hideHeader === 'yes') {
        hideHeader();
    }
    if (_hideSideMenu === 'yes') {
        hideSideMenu();
    }
    if (_hideAllBtn === 'yes') {
        hideAllButtons();
    }
}

var aryCKEditor2Disabled = [];

function setFieldValue(name, value, isJson, disabled, isDate) {
    try {
        var mode = getParameterByName('mode');
        var thisfieldname = '#' + name;
        var field = $(thisfieldname);

        var fieldSelect = [
            'tci_departure_city_id',
            'tci_destination_country_id'
        ];

        if (field) {
            if (value !== null) {
                if (fieldSelect.indexOf(name) >= 0) {
                    field.val(value);
                } else {
                    if (name.indexOf('Date') >= 0 || name.indexOf('birthday') >= 0 || isDate || name.indexOf('_d') >= 0) {
                        if (isJson || isDate) {
                            field.val(getDateString(value));
                        } else {
                            field.val(value);
                            field.text(value);
                        }
                    } else if (name.indexOf('_img') > 0 && value != null) {
                        field.attr("src", "../../ImageServer.aspx?imagePath=" + value);
                    } else {
                        if (field.prop('type') === 'checkbox') {
                            field.prop('checked', (value === 1 || value === true || value === 'true') ? 'checked' : '');
                        } else {
                            field.val(value);
                            if (field.prop('type') !== 'select-one') {
                                field.text(value);
                            }
                        }
                    }
                }
            } else {
                field.val('');
            }
            if (disabled === undefined || disabled === null) {
                if (mode === 'view') {
                    $(thisfieldname).prop('disabled', true);
                }
            } else {
                if (disabled) {
                    $(thisfieldname).prop('disabled', true);
                }
            }

            field.removeAttr('placeholder');
        }
        if (field.attr('class') === 'ckeditor') {
            aryCKEditor2Disabled.push(name);
        }
    } catch (e) {

    }
}

try {
    CKEDITOR.on('instanceReady', function (evt) {
        var mode = getParameterByName('mode');
        if (mode == 'view') {
            jQuery.each(aryCKEditor2Disabled, function (i, name) {
                CKEDITOR.instances[name].setReadOnly(true);
            });

        }
    });

} catch (e) {

}

// Read a page's GET URL variables and return them as an associative array.
function getUrlVars() {
    var vars = [], hash;
    var hashes = window.location.href.slice(window.location.href.indexOf('?') + 1).split('&');
    for (var i = 0; i < hashes.length; i++) {
        hash = hashes[i].split('=');
        vars.push(hash[0]);
        vars[hash[0]] = hash[1];
    }
    return vars;
}

function getDateString(dateTime) {
    try {
        var date = new Date(parseInt(dateTime.substr(6)));
        var year = date.getFullYear();
        var month = ("0" + (date.getMonth() + 1)).slice(-2);
        var day = ("0" + date.getDate()).slice(-2);
        //    var formatted = date.getFullYear() + "-" +
        //      ("0" + (date.getMonth() + 1)).slice(-2) + "-" +
        //      ("0" + date.getDate()).slice(-2) + " " + date.getHours() + ":" +
        //      date.getMinutes();
        var formatted = day + "/" + month + "/" + year;
        return formatted;
    } catch (e) {
        return "";
    }
}

function getDateTimeString(dateTime) {
    var milli = dateTime.replace(/\/Date\((-?\d+)\)\//, '$1');
    var d = new Date(parseInt(milli));
    var datestr = d.getDate() + '/' + (d.getMonth() + 1) + '/' + d.getFullYear() + " " + d.getHours() + ":" + (d.getMinutes() === 0 ? "00" : d.getMinutes());
    return datestr;
    //return d;
}

function addSeperator(nStr) {
    nStr = parseFloat(nStr).toFixed(2);
    nStr += '';
    var x = nStr.split('.');
    var x1 = x[0];
    var x2 = x.length > 1 ? '.' + x[1] : '';
    var rgx = /(\d+)(\d{3})/;
    while (rgx.test(x1)) {
        x1 = x1.replace(rgx, '$1' + ' ' + '$2');
    }
    var result = x1 + x2;
    result = result.replace('.', ',');
    return result;
}

function setDatePicker() {
    $.datepicker.regional['fr'] = {
        closeText: 'Fermer',
        prevText: '&#x3c;Préc',
        nextText: 'Suiv&#x3e;',
        currentText: 'Aujourd\'hui',
        monthNames: ['Janvier', 'Fevrier', 'Mars', 'Avril', 'Mai', 'Juin',
		'Juillet', 'Aout', 'Septembre', 'Octobre', 'Novembre', 'Decembre'],
        monthNamesShort: ['Jan', 'Fev', 'Mar', 'Avr', 'Mai', 'Jun',
		'Jul', 'Aou', 'Sep', 'Oct', 'Nov', 'Dec'],
        dayNames: ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'],
        dayNamesShort: ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'],
        dayNamesMin: ['Di', 'Lu', 'Ma', 'Me', 'Je', 'Ve', 'Sa'],
        weekHeader: 'Sm',
        dateFormat: 'dd-mm-yy',
        firstDay: 1,
        isRTL: false,
        showMonthAfterYear: false,
        yearSuffix: '',
        //minDate: 0,
        maxDate: '+12M +0D',
        numberOfMonths: 1,
        showButtonPanel: true
    };
    $.datepicker.setDefaults($.datepicker.regional['fr']);
};

function RelpaceFilePath(sevpath) {
    var fackpath = "";
    try {
        fackpath = sevpath.replace('D:\\SiteFilesFolder\\EurasiaTours', '\\Files');
    } catch (e) {

    }
    return fackpath;
}

function loadingmaskHide() {
    $('#loading_mask').hide();
}

function loadingmaskShow() {
    $('#loading_mask').show();
}

function setloadingmaskmessage(message) {
    $('#message_loading_mask').html(message);
}

function setloadingmaskheight() {
    $('#loading_mask').css('height', $(document).height());
}

function RefreshPage() {
    window.location.href = window.location.href;
}

var hasSetAuthError = false;
function AuthencationError() {
    //alert('Authentication error, please login again !');
    if (!hasSetAuthError) {
        HidePleaseWait();
        MsgPopUpWithResponse('ERREUR', "Veuillez connecter, contacter l'administrateur!", 'BackToLogin()');
        hasSetAuthError = true;
    } else {
    }
}

function BackToHome() {
    window.location = '../../Default.aspx';
}

function BackToLogin() {
    window.location = '../../Account/Login.aspx';
}

function changeViewMode(paramValue) {
    myApp.showPleaseWait();
    var paramName = 'mode';
    var url = window.location.href;
    var hash = location.hash;
    url = url.replace(hash, '');
    if (url.indexOf(paramName + "=") >= 0) {
        var prefix = url.substring(0, url.indexOf(paramName));
        var suffix = url.substring(url.indexOf(paramName));
        suffix = suffix.substring(suffix.indexOf("=") + 1);
        suffix = (suffix.indexOf("&") >= 0) ? suffix.substring(suffix.indexOf("&")) : "";
        url = prefix + paramName + "=" + paramValue + suffix;
    }
    else {
        if (url.indexOf("?") < 0)
            url += "?" + paramName + "=" + paramValue;
        else
            url += "&" + paramName + "=" + paramValue;
    }
    window.location.href = url + hash;
}

/// Begin Array operation

function searchFieldValueInArray(ary, filedname, value) {
    //var obj = Object;
    var obj = {};
    for (var i = 0; i < ary.length; i++) {
        if (ary[i][filedname] === value) {
            obj = ary[i];
        }
    }
    return obj;
}

function searchInArray(ary, filedname, value) {
    var obj = [];
    for (var i = 0; i < ary.length; i++) {
        if (ary[i][filedname] === value) {
            obj.push(ary[i]);
        }
    }
    return obj;
}

function getValueInArray(ary, filedname) {
    var obj = [];
    for (var i = 0; i < ary.length; i++) {
        if (ary[i][filedname]) {
            if (ary[i][filedname].length > 0) {
                if ($.isArray(ary[i][filedname])) {
                    $.each(ary[i][filedname], function(name, value) {
                        obj.push(value);
                    });
                } else {
                    obj.push(ary[i][filedname]);
                }
            }
        }
    }
    return obj;
}

function getPropValue(ary, propName) {
    var obj = [];
    for (var i = 0; i < ary.length; i++) {
        if (ary[i]['PropName'] === propName) {
            obj.push(ary[i]['PropValue']);
        }
    }
    return obj;
}

function getPropValueLinked(ary, propName1, propName2) {
    var obj = [];
    for (var i = 0; i < ary.length; i++) {
        var oneProp = {};
        $.each(ary[i]['PitAllInfo'], function(name, value) {
            if (value['PropName'] === propName1) {
                oneProp.PropName1 = propName1;
                oneProp.PropValue1 = value['PropValue'];
            }
            if (value['PropName'] === propName2) {
                oneProp.PropName2 = propName2;
                oneProp.PropValue2 = value['PropValue'];
            }
        });
        obj.push(oneProp);
//        if (ary[i]['PitAllInfo']['PropName'] === propName1) {
//            oneProp.PropName1 = propName1;
//            oneProp.PropValue1 = ary[i]['PitAllInfo']['PropValue'];
//        }
//        if (ary[i]['PitAllInfo']['PropName'] === propName2) {
//            oneProp.PropName2 = propName2;
//            oneProp.PropValue2 = ary[i]['PitAllInfo']['PropValue'];
//        }
//        obj.push(oneProp);
    }
    return obj;
}

function reSortPropValue(ary) {
    var newAry = [];
    $.each(ary, function(name, value) {
        var arr2Check = searchInArray(newAry, 'PropValue1', value.PropValue1);
        if (arr2Check.length > 0) {
               var arr2Check2 = searchInArray(arr2Check, 'PropValue2', value.PropValue2);
            if (arr2Check2 <= 0) {
                newAry.push(value);
            }
        } else {
            newAry.push(value);
        }
    });
    return newAry;
}

function removeInArray(ary, filedname, value) {
    $.each(ary, function (i, el) {
        if (this[filedname] === value) {
            ary.splice(i, 1);
        }
    });
}


/// End Array operation

/* begin cookie */

function createCookie(name, value, days) {
    var expires;
    if (days) {
        var date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        expires = "; expires=" + date.toGMTString();
    }
    else {
        expires = "";
    }
    document.cookie = name + "=" + value + expires + "; path=/;domain=" + location.hostname + "";
}

function readCookie(name) {
    var nameEQ = name + "=";
    var ca = document.cookie.split(';');
    for (var i = 0; i < ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) === ' ') c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
}

function eraseCookie(name) {
    createCookie(name, "", -1);
}

function createCookieJson(name, value) {
    var newvalue = JSON.stringify(value);
    createCookie(name, newvalue);
    //$.cookie(name, JSON.stringify(value));
}

function readCookieJson(name) {
    var jsonStr = readCookie(name);
    return JSON.parse(jsonStr);
}

/* end cookie */

function replaceAll(str, find, replace) {
    if (str) {
        return str.replace(new RegExp(find, 'g'), replace);
    } else {
        return str;
    }
}

function toObject(arr) {
    var rv = {};
    for (var i = 0; i < arr.length; ++i)
        rv[i] = arr[i];
    return rv;
}

function IsGuid(stringToTest) {
    var regexGuid = /^(\{){0,1}[0-9a-fA-F]{8}\-[0-9a-fA-F]{4}\-[0-9a-fA-F]{4}\-[0-9a-fA-F]{4}\-[0-9a-fA-F]{12}(\}){0,1}$/gi;
    return regexGuid.test(stringToTest);
}

function NewGuid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

function HTMLEncode(str) {
    if (str) {
        var i = str.length,
            aRet = [];
        while (i--) {
            var iC = str[i].charCodeAt();
            if (iC < 65 || iC > 127 || (iC > 90 && iC < 97)) {
                aRet[i] = '&#' + iC + ';';
            } else {
                aRet[i] = str[i];
            }
        }
        return aRet.join('');
    }
    else {
        return str;
    }
}

function CheckRequiredFieldInOneDiv(divId) {
    var allRequiredOk = true;
    var allDiv = $('div[id="' + divId + '"] :input[required]');
    $.each(allDiv, function (name, value) {
        var thisvalue = ($(value).val() !== null && $(value).val() !== '' && $(value).val() !== '0' && $(value).val() !== "0" && $(value).val() !== 0);
        if (!thisvalue) {
            $(value).addClass('error_border');
            //$(value).attr('data-errormessage-value-missing', 'Veuillez renseigner ce champs');
            //document.getElementById($(value).attr('id')).setCustomValidity("Veuillez renseigner ce champs");
            $(value).focus();
        } else {
            $(value).removeClass('error_border');
        }
        allRequiredOk = allRequiredOk && thisvalue;
    });
    return allRequiredOk;
}

/// set all input value empty in this div
function setDivValueEmpty(divId) {
    var allDiv = $('div[id="' + divId + '"] :input');
    $.each(allDiv, function (name, value) {
        $(value).val('');
    });
}

function MsgErrorPopUp(title, msg) {
    var content = "<div class='box'><div class='box-body' style='height: 100px;'>" +
        "<div class='form-horizontal'>" +
        "<div class='col-md-12'>" +
        "<div class='form-group'>" +
        "<div class='col-sm-12' style='text-align:center;font-size: 18pt;'>" + msg + "</div></div></div></div></div></div>"
        + "<div class='modal-footer center'>" +
        "<button type='button' class='btn btn-default' id='btn_close_popup' onclick='closeDialog()'>OK</button></div>";
    bootbox.dialog({
        title: title,
        message: content
    }).find('.modal-content').css({
        'margin-top': function() {
            var w = $(window).height();
            var b = $(".modal-dialog").height();
            // should not be (w-h)/2
            var h = (w - b) * 0.3;
            return h + "px";
        }
    }).find('.modal-header').css({
        //'background-color': '#d2322d',
        'background': 'url(../../img/menu_005_bg.jpg) repeat-x',
        'text-align': 'center',
        'color': '#C0C0C0'
    });

    document.onkeydown = function(e) {
        var theEvent = window.event || e;
        var code = theEvent.keyCode || theEvent.which;
        if (code == 13) {
            $("#btn_close_popup").click();
        }
    }
    return false;
}

function dateTimeNowForCSharp() {
    var now = new Date();
    var UTC = now.getTime();
    var localOffset = (-1) * now.getTimezoneOffset() * 60000;
    var currentTime = Math.round(new Date(UTC + localOffset).getTime());
    return currentTime;
}

function dateToDMY(d) {
    var yyyy = d.getFullYear().toString();
    var mm = (d.getMonth() + 101).toString().slice(-2);
    var dd = (d.getDate() + 100).toString().slice(-2);
    return dd + "/" + mm + "/" + yyyy;
}

function setSuperRightCreateFields() {
}

function getUrlVarsInString(string) {
    var vars = [], hash;
    var hashes = string.slice(window.location.href.indexOf('?') + 1).split('&');
    for (var i = 0; i < hashes.length; i++) {
        hash = hashes[i].split('=');
        vars.push(hash[0]);
        vars[hash[0]] = hash[1];
    }
    return vars;
}

function validateNumber(evt) {
    var theEvent = evt || window.event;
    var key = theEvent.keyCode || theEvent.which;
    key = String.fromCharCode(key);
    var regex = /[0-9]|\./;
    if (!regex.test(key)) {
        theEvent.returnValue = false;
        if (theEvent.preventDefault) theEvent.preventDefault();
    }
}

function dynamicSort(property) {
    var sortOrder = 1;
    if (property[0] === "-") {
        sortOrder = -1;
        property = property.substr(1);
    }
    return function (a, b) {
        var result = (a[property] < b[property]) ? -1 : (a[property] > b[property]) ? 1 : 0;
        return result * sortOrder;
    }
}

function MsgPopUpWithResponse(title, msg, fun) {

    var content = "<div class='box'><div class='box-body' style='height: 100px;'>" +
        "<div class='form-horizontal'>" +
        "<div class='col-md-12'>" +
        "<div class='form-group'>" +
        "<div class='col-sm-12' style='text-align:center;font-size: 18pt;'>" + msg + "</div></div></div></div></div></div>"
        + "<div class='modal-footer center'>" +
        "<button type='button' class='btn btn-default' onclick=" + fun + ">OK</button></div>";
    bootbox.dialog({
        closeButton: false,
        title: title,
        message: content
    }).find('.modal-content').css({
        'margin-top': function() {
            var w = $(window).height();
            var b = $(".modal-dialog").height();
            // should not be (w-h)/2
            var h = (w - b) * 0.3;
            return h + "px";
        }
    }).find('.modal-header').css({
        //'background-color': '#d2322d',
        'background': 'url(../../img/menu_005_bg.jpg) repeat-x',
        'text-align': 'center',
        'color': '#C0C0C0'
    });
    return false;
}

function ExternLinkBaseClick(sender, obj, newpage) {
    if (_isView && obj) {
        ShowPleaseWaitWithText('Veuillez patienter');
        var page = $(sender).attr('pgid');
        var flid = $(sender).attr('flid');
        var par = $(sender).attr('prms');
        var etid = $(sender).attr('etid');
        var id = obj[etid];
        //alert(id);
        var url = "../" + flid + "/" + page + "?" + par + "=" + id + "&mode=view";
        if (newpage) {
            window.open(url);
        } else {
            document.location.href = url;
        }
        HidePleaseWait();
    }
}

$(function() {
    try {
        $('.searchcriteria').on('keydown', function(e) {
            if (e.which === 13) {
                $('#btn_search').click();
            }
        });
    } catch (e) {

    }
});

function MsgPopUpWithResponseChoice(title, msg, btnname, fun, defaultbtname) {
    defaultbtname = defaultbtname ? defaultbtname : 'OK';
    var content = "<div class='box'><div class='box-body' style='height: 100px;'>" +
        "<div class='form-horizontal'>" +
        "<div class='col-md-12'>" +
        "<div class='form-group'>" +
        "<div class='col-sm-12' style='text-align:center;font-size: 18pt;'>" + msg + "</div></div></div></div></div></div>"
        + "<div class='modal-footer center'>" +
        "<button type='button' class='btn btn-default' onclick='closeDialog()'>" + defaultbtname + "</button>" +
        "<button type='button' class='btn btn-inverse' onclick=" + fun + ">" + btnname + "</button>" +
        "</div>";
    bootbox.dialog({
        closeButton: false,
        title: title,
        message: content
    }).find('.modal-content').css({
        'margin-top': function() {
            var w = $(window).height();
            var b = $(".modal-dialog").height();
            // should not be (w-h)/2
            var h = (w - b) * 0.3;
            return h + "px";
        }
    }).find('.modal-header').css({
        //'background-color': '#d2322d',
        'background': 'url(../../img/menu_005_bg.jpg) repeat-x',
        'text-align': 'center',
        'color': '#C0C0C0'
    });
    return false;
}

function ReplaceNumberWithCommas(yourNumber) {
    //Seperates the components of the number
    var n = "";
    try {
        n = yourNumber.toFixed(2).toString().split(".");
        //Comma-fies the first part
        n[0] = n[0].replace(/\B(?=(\d{3})+(?!\d))/g, " ");
        //Combines the two sections
        n = n.join(",");
    } catch (e) {

    }
    return n;
}

function NoResultMsg(msg) {
    if (IsNullOrEmpty(msg)) {
        msg = "Aucun résultat trouvé !";
    }
    var content = "<div class='box'><div class='box-body' style='height: 50px;'>" +
        "<div class='form-horizontal'>" +
        "<div class='col-md-12'>" +
        "<div class='form-group'>" +
        "<div class='col-sm-12' style='text-align:center;font-size: 18pt;'>"+msg+"</div></div></div></div></div></div>"
        + "<div class='modal-footer center'>" +
        "<button type='button' class='btn btn-default'>OK</button></div>";
    bootbox.dialog({
        title: 'Attention',
        message: content
    }).find('.modal-content').css({
        'margin-top': function() {
            var w = $(window).height();
            var b = $(".modal-dialog").height();
            // should not be (w-h)/2
            var h = (w - b) * 0.3;
            return h + "px";
        }
    }).find('.modal-header').css({
        //'background-color': '#d2322d',
        'background': 'url(../../img/menu_005_bg.jpg) repeat-x',
        'text-align': 'center',
        'color': '#C0C0C0'
    });
    return false;
}

function getToday() {
    var today = new Date();
    var dd = today.getDate();
    var mm = today.getMonth() + 1; //January is 0!
    var yyyy = today.getFullYear();
    if (dd < 10) {
        dd = '0' + dd;
    }
    if (mm < 10) {
        mm = '0' + mm;
    }
    today = dd + '/' + mm + '/' + yyyy;
    return today;
}

function firstDayInPreviousMonth() {
    var d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() - 1);
    //return d;
    var dd = d.getDate();
    var mm = d.getMonth() + 1; //January is 0!
    var yyyy = d.getFullYear();
    if (dd < 10) {
        dd = '0' + dd;
    }
    if (mm < 10) {
        mm = '0' + mm;
    }
    var day = dd + '/' + mm + '/' + yyyy;
    return day;
}

function LastDayInPreviousMonth() {
    var d = new Date();
    d.setDate(1);
    d.setHours(-1);
    //return d;
    var dd = d.getDate();
    var mm = d.getMonth() + 1; //January is 0!
    var yyyy = d.getFullYear();
    if (dd < 10) {
        dd = '0' + dd;
    }
    if (mm < 10) {
        mm = '0' + mm;
    }
    var day = dd + '/' + mm + '/' + yyyy;
    return day;
}


function fortyfiveDaysLater() {
    var d = new Date();
    d.setDate(d.getDate() + 45);
    //return d;
    var dd = d.getDate();
    var mm = d.getMonth()+1; //January is 0!
    var yyyy = d.getFullYear();
    if (dd < 10) {
        dd = '0' + dd;
    }
    if (mm < 10) {
        mm = '0' + mm;
    }
    var day = dd + '/' + mm + '/' + yyyy;
    return day;
}

function firstDayOfYear() {
    var d = new Date();
//    d.setDate(1);
//    d.setMonth(d.getMonth() - 1);
    //return d;
    var yyyy = d.getFullYear();
    var day = '01/01/' + yyyy;
    return day;
}

function getCreationDate(datetime) {
    var date = new Date();
    var day = date.getDate(); // yields date
    var month = date.getMonth() + 1; // yields month (add one as '.getMonth()' is zero indexed)
    var year = date.getFullYear(); // yields year
    var hour = date.getHours(); // yields hours 
    var minute = date.getMinutes(); // yields minutes
    var second = date.getSeconds(); // yields seconds
    if (datetime) {
        var dateStr = datetime.split('/');
        day = dateStr[0];
        month = dateStr[1];
        year =  dateStr[2];
    }
    var time = month + "/" + day + "/" + year + " " + hour + ':' + minute + ':' + second;
    return time;
}

function getDateStringNullable(datetime) {
    var date = new Date();
//    var day = date.getDate(); // yields date
//    var month = date.getMonth() + 1; // yields month (add one as '.getMonth()' is zero indexed)
//    var year = date.getFullYear(); // yields year
    var hour = date.getHours(); // yields hours 
    var minute = date.getMinutes(); // yields minutes
    var second = date.getSeconds(); // yields seconds
    var time = null;
    if (datetime) {
        var dateStr = datetime.split('/');
        var day = dateStr[0];
        var month = dateStr[1];
        var year = dateStr[2];
        time = month + "/" + day + "/" + year + " " + hour + ':' + minute + ':' + second;
    }
    return time;
}


function pageSnapShot(url) {
    var content = "<div>" +
        "<iframe height='600' width='100%' id='iframeSnapShot' frameBorder='0' src='" + url + "' ></iframe>" +
        "<br/>" +
        "<br/>" +
        "<div class='center'>" +
        "<button class='btn btn-inverse bootbox-close-button' onclick='return false'><span>Clôturer</span></button>" +
        "</div>" +
        "</div>";
    var title = '';
    bootbox.dialog({
        title: title,
        message: content
    }).find('.modal-dialog').css({
        'width': '98%'
    }).find('.modal-content').css({
        'margin-top': function () {
            var w = $(window).height();
            var b = $(".modal-dialog").height();
            // should not be (w-h)/2
            var h = (w - b) * 0.05;
            return h + "px";
        }
    }).find('.modal-header').css({
        //'background-color': '#a696ce',
        'background': 'url(../../img/menu_005_bg.jpg) repeat-x',
        'text-align': 'center',
        'color': '#C0C0C0'
    });

    $('#iframeSnapShot').height($(window).height()*0.80);

    return false;
}


function pageSnapShotWithCloseFun(url, func) {
    var content = "<div>" +
        "<iframe height='600' width='100%' id='iframeSnapShot' frameBorder='0' src='" + url + "' ></iframe>" +
        "<br/>" +
        "<br/>" +
        "<div class='center'>" +
        "<button class='btn btn-inverse bootbox-close-button' onclick='return " + func + "'><span>Clôturer</span></button>" +
        "</div>" +
        "</div>";
    var title = '';
    bootbox.dialog({
        title: title,
        message: content
    }).find('.modal-dialog').css({
        'width': '98%'
    }).find('.modal-content').css({
        'margin-top': function () {
            var w = $(window).height();
            var b = $(".modal-dialog").height();
            // should not be (w-h)/2
            var h = (w - b) * 0.05;
            return h + "px";
        }
    }).find('.modal-header').css({
        //'background-color': '#a696ce',
        'background': 'url(../../img/menu_005_bg.jpg) repeat-x',
        'text-align': 'center',
        'color': '#C0C0C0'
    });

    $('#iframeSnapShot').height($(window).height()*0.80);

    return false;
}

function hideHeader() {
    $('#header').hide();
}

function hideSideMenu() {
    $('#sidebar').hide();
    $('#main-content').css('margin-left','0px');
}

function hideAllButtons() {
    $('button').hide();
}

function hideButtons(cls) {
    $('.' + cls).hide();
}

jQuery(window).load(function () {
    setTimeout(function () {
    var _hideAllBtn = getParameterByName('hideAllBtn');
    if (_hideAllBtn === 'yes') {
        hideAllButtons();
    }
    }, 1000);
});

function OpenNewCalender() {
    var url = '../../Views/Calendar/Calendar.aspx';
    window.open(url, '_blank');
    return false;
}

function snapshotCalendar() {
    var url = '../../Views/Calendar/Calendar.aspx';
    pageSnapShot(url);
    return false;
}


function getDateFromStringFr(sender) {
    var str = $(sender).val();
    if (str) {
        if (str.indexOf('/') > 0) {
            var datestr = str.split('/');
//            var date = new Date(datestr[2], datestr[1] - 1, datestr[0]);
//            var UTC = date.getTime();
//            var localOffset = (-1) * date.getTimezoneOffset() * 60000;
//            var currentTime = Math.round(new Date(UTC + localOffset).getTime());
//            return currentTime;
            return new Date(datestr[2], datestr[1] - 1, datestr[0]);;
        }
    } else {
        return null;
    }
}


function RightErrorRedirect(url) {
    MsgPopUpWithResponse('ERREUR', 'Erreur d\'autorisation, vous n\'avez pas des autorisations suffisantes, veuillez contacter votre administrateur !', 'Redirct2Default("' + url + '")');
    return false;
}

function Redirct2Default(url) {
    window.location = url;
}

var pageUserRight = {};
function getUserPageRight() {
    try {
        var pageParas = window.location.href.split('/');
        var parentpage = pageParas[pageParas.length - 2];
        var page = pageParas[pageParas.length - 1].split('?')[0].split('.')[0];
        page = page.toLowerCase();
        if (page === 'default') {
            parentpage = '';
        }
        var url = window.webservicePath + "/GetUserPageRight";
        var params = "{pageName: '" + page + "',parentName:'" + parentpage + "'}";
        $.ajax({
            type: "POST",
            url: url,
            contentType: "application/json; charset=utf-8",
            dataType: "json",
            data: params,
            success: function(data) {
                var jsdata = data.d;
                //var data2Treat = jQuery.parseJSON(jsdata);
                var data2Treat = JSON.parse(jsdata);
                if (data2Treat !== '-1') {
                    if (!jQuery.isEmptyObject(data2Treat)) {
                        pageUserRight = data2Treat;
                        if (!data2Treat.RitRead) {
                            RightErrorRedirect('../../Default.aspx');
                        } else {
                            if ((!data2Treat.RitModify && !data2Treat.RitCreate && !data2Treat.RitDelete) || !data2Treat.RitSuperRight) {
                                //hideAllButtons();
                                if (!data2Treat.RitModify) {
                                    hideButtons('rt_modify');
                                }
                                if (!data2Treat.RitCreate) {
                                    hideButtons('rt_create');
                                }
                                if (!data2Treat.RitRead) {
                                    hideButtons('rt_read');
                                }
                            } else if (!data2Treat.RitModify && _isModify) {
                                var re = new RegExp("&mode=\\w+");
                                var newUrl = window.location.href.replace(re, '');
                                newUrl += '&mode=view';
                                window.location = newUrl;
                            } else if (!data2Treat.RitCreate && _isCreate) {
                                //var re = new RegExp("&mode=\\w+");
                                //var newUrl = window.location.href.replace(re, '');
                                window.location = '../../Default.aspx';
                                //console.log('create');
                            } else if (!data2Treat.RitRead && _isView) {
                                //var re = new RegExp("&mode=\\w+");
                                //var newUrl = window.location.href.replace(re, '');
                                window.location = '../../Default.aspx';
//                                console.log(data2Treat.RitRead);
//                                console.log('view');
                            }
                        }
                    } else {
                    }
                } else {
                    // authentication error
                    AuthencationError();
                }
            },
            error: function(data) {
                var test = '';
            }
        });
    } catch (e) {

    }
}

function IsNullOrEmpty(value) {
    var checkOK = false;
    if (value == null || value == '' || value == '' || value =='undefined') {
        checkOK = true;
    }
    return checkOK;
}


window.alert = function(msg, callback) {
	var div = document.createElement("div");
    if (msg!=null && msg.length >100) {
        msg = msg.substring(0, 99);
    }
    div.innerHTML = "<style type=\"text/css\">"
			+ ".nbaMask { position: fixed; z-index: 10000; top: 0; right: 0; left: 0; bottom: 0; background: rgba(0, 0, 0, 0.5); }                                                                                                                                                                       "
			+ ".nbaMaskTransparent { position: fixed; z-index: 1000; top: 0; right: 0; left: 0; bottom: 0; }                                                                                                                                                                                            "
			+ ".nbaDialog { position: fixed; z-index: 50000; width: 80%; max-width: 300px; top: 50%; left: 50%; -webkit-transform: translate(-50%, -50%); transform: translate(-50%, -50%); background-color: #fff; text-align: center; border-radius: 8px; overflow: hidden; opacity: 1; color: white; }"
			+ ".nbaDialog .nbaDialogHd { padding: .2rem .27rem .08rem .27rem; }                                                                                                                                                                                                                         "
			+ ".nbaDialog .nbaDialogHd .nbaDialogTitle { font-size: 17px; font-weight: 400; }                                                                                                                                                                                                           "
			+ ".nbaDialog .nbaDialogBd { padding: 2.27rem; font-size: 15px; line-height: 1.8; word-wrap: break-word; word-break: break-all; color: #000000; }                                                                                                                                          "
			+ ".nbaDialog .nbaDialogFt { position: relative; line-height: 48px; font-size: 17px; display: -webkit-box; display: -webkit-flex; display: flex; }                                                                                                                                          "
			+ ".nbaDialog .nbaDialogFt:after { content: \" \"; position: absolute; left: 0; top: 0; right: 0; height: 1px; border-top: 1px solid #e6e6e6; color: #e6e6e6; -webkit-transform-origin: 0 0; transform-origin: 0 0; -webkit-transform: scaleY(0.5); transform: scaleY(0.5); }               "
			+ ".nbaDialog .nbaDialogBtn { display: block; -webkit-box-flex: 1; -webkit-flex: 1; flex: 1; color: black; text-decoration: none; -webkit-tap-highlight-color: transparent; position: relative; margin-bottom: 0; }                                                                       "
			+ ".nbaDialog .nbaDialogBtn:after { content: \" \"; position: absolute; left: 0; top: 0; width: 1px; bottom: 0; border-left: 1px solid #e6e6e6; color: #e6e6e6; -webkit-transform-origin: 0 0; transform-origin: 0 0; -webkit-transform: scaleX(0.5); transform: scaleX(0.5); }             "
			+ ".nbaDialog a { text-decoration: none; -webkit-tap-highlight-color: transparent; }"
			+ "</style>"
			+ "<div id=\"dialogs2\" style=\"display: none\">"
			+ "<div class=\"nbaMask\"></div>"
			+ "<div class=\"nbaDialog\">"
			+ "	<div class=\"nbaDialogHd\">"
			+ "		<strong class=\"nbaDialogTitle\"></strong>"
			+ "	</div>"
			+ "	<div class=\"nbaDialogBd\" id=\"dialog_msg2\">弹窗内容，告知当前状态、信息和解决方法，描述文字尽量控制在三行内</div>"
			+ "	<div class=\"nbaDialogHd\">"
			+ "		<strong class=\"nbaDialogTitle\"></strong>"
			+ "	</div>"
			+ "	<div class=\"nbaDialogFt\">"
			+ "		<a href=\"javascript:;\" class=\"nbaDialogBtn nbaDialogBtnPrimary\" id=\"dialog_ok2\">OK</a>"
			+ "	</div></div></div>";
	document.body.appendChild(div);
 
	var dialogs2 = document.getElementById("dialogs2");
	dialogs2.style.display = 'block';
 
	var dialog_msg2 = document.getElementById("dialog_msg2");
	dialog_msg2.innerHTML = msg;
 
	// var dialog_cancel = document.getElementById("dialog_cancel");
	// dialog_cancel.onclick = function() {
	// dialogs2.style.display = 'none';
	// };
	var dialog_ok2 = document.getElementById("dialog_ok2");
	dialog_ok2.onclick = function() {
		dialogs2.style.display = 'none';
	    callback;
//	    try {
//	        callback();
//	    } catch (e) {

//	    } 
	};
};



window.alertWindow = function(msg, callback) {
	var div = document.createElement("div");
//    if (msg!=null && msg.length >100) {
//        msg = msg.substring(0, 99);
//    }
    div.innerHTML = "<style type=\"text/css\">"
			+ ".nbaMask { position: fixed; z-index: 10000; top: 0; right: 0; left: 0; bottom: 0; background: rgba(0, 0, 0, 0.5); }                                                                                                                                                                       "
			+ ".nbaMaskTransparent { position: fixed; z-index: 1000; top: 0; right: 0; left: 0; bottom: 0; }                                                                                                                                                                                            "
			+ ".nbaDialog { position: fixed; z-index: 50000; width: 60%; max-width: 80%; top: 50%; left: 50%; -webkit-transform: translate(-50%, -50%); transform: translate(-50%, -50%); background-color: #fff; text-align: center; border-radius: 8px; overflow: hidden; opacity: 1; color: white; }"
			+ ".nbaDialog .nbaDialogHd { padding: .2rem .27rem .08rem .27rem; }                                                                                                                                                                                                                         "
			+ ".nbaDialog .nbaDialogHd .nbaDialogTitle { font-size: 17px; font-weight: 400; }                                                                                                                                                                                                           "
			+ ".nbaDialog .nbaDialogBd {height: 30%; max-height: 400px;overflow: auto; padding: 2.27rem; font-size: 15px; line-height: 1.8; word-wrap: break-word; word-break: break-all; color: #000000; }                                                                                                                                          "
			+ ".nbaDialog .nbaDialogFt { position: relative; line-height: 48px; font-size: 17px; display: -webkit-box; display: -webkit-flex; display: flex; }                                                                                                                                          "
			+ ".nbaDialog .nbaDialogFt:after { content: \" \"; position: absolute; left: 0; top: 0; right: 0; height: 1px; border-top: 1px solid #e6e6e6; color: #e6e6e6; -webkit-transform-origin: 0 0; transform-origin: 0 0; -webkit-transform: scaleY(0.5); transform: scaleY(0.5); }               "
			+ ".nbaDialog .nbaDialogBtn { display: block; -webkit-box-flex: 1; -webkit-flex: 1; flex: 1; color: black; text-decoration: none; -webkit-tap-highlight-color: transparent; position: relative; margin-bottom: 0; }                                                                       "
			+ ".nbaDialog .nbaDialogBtn:after { content: \" \"; position: absolute; left: 0; top: 0; width: 1px; bottom: 0; border-left: 1px solid #e6e6e6; color: #e6e6e6; -webkit-transform-origin: 0 0; transform-origin: 0 0; -webkit-transform: scaleX(0.5); transform: scaleX(0.5); }             "
			+ ".nbaDialog a { text-decoration: none; -webkit-tap-highlight-color: transparent; }"
			+ "</style>"
			+ "<div id=\"dialogs2\" style=\"display: none\">"
			+ "<div class=\"nbaMask\"></div>"
			+ "<div class=\"nbaDialog\">"
			+ "	<div class=\"nbaDialogHd\">"
			+ "		<strong class=\"nbaDialogTitle\"></strong>"
			+ "	</div>"
			+ "	<div class=\"nbaDialogBd\" id=\"dialog_msg2\">弹窗内容，告知当前状态、信息和解决方法，描述文字尽量控制在三行内</div>"
			+ "	<div class=\"nbaDialogHd\">"
			+ "		<strong class=\"nbaDialogTitle\"></strong>"
			+ "	</div>"
			+ "	<div class=\"nbaDialogFt\">"
			+ "		<a href=\"javascript:;\" class=\"nbaDialogBtn nbaDialogBtnPrimary\" id=\"dialog_ok2\">OK</a>"
			+ "	</div></div></div>";
	document.body.appendChild(div);
 
	var dialogs2 = document.getElementById("dialogs2");
	dialogs2.style.display = 'block';
 
	var dialog_msg2 = document.getElementById("dialog_msg2");
	dialog_msg2.innerHTML = msg;
 
	// var dialog_cancel = document.getElementById("dialog_cancel");
	// dialog_cancel.onclick = function() {
	// dialogs2.style.display = 'none';
	// };
	var dialog_ok2 = document.getElementById("dialog_ok2");
	dialog_ok2.onclick = function() {
		dialogs2.style.display = 'none';
	    callback;
//	    try {
//	        callback();
//	    } catch (e) {

//	    } 
	};
};


function LogTime(text) {
    var d = new Date();
    var n = d.toISOString();
    text = text + n;
    console.log(text);
}

var sort_by;
(function () {
    // utility functions
    var default_cmp = function (a, b) {
        if (a == b) return 0;
        return a < b ? -1 : 1;
    },
        getCmpFunc = function (primer, reverse) {
            var cmp = default_cmp;
            if (primer) {
                cmp = function (a, b) {
                    return default_cmp(primer(a,16), primer(b,16));
                };
            }
            if (reverse) {
                return function (a, b) {
                    return -1 * cmp(a, b);
                };
            }
            return cmp;
        };

    // actual implementation
    sort_by = function () {
        var fields = [],
            n_fields = arguments.length,
            field, name, reverse, cmp;

        // preprocess sorting options
        for (var i = 0; i < n_fields; i++) {
            field = arguments[i];
            if (typeof field === 'string') {
                name = field;
                cmp = default_cmp;
            }
            else {
                name = field.name;
                cmp = getCmpFunc(field.primer, field.reverse);
            }
            fields.push({
                name: name,
                cmp: cmp
            });
        }

        return function (A, B) {
            var a, b, name, cmp, result;
            for (var i = 0, l = n_fields; i < l; i++) {
                result = 0;
                field = fields[i];
                name = field.name;
                cmp = field.cmp;

                result = cmp(A[name], B[name]);
                if (result !== 0) break;
            }
            return result;
        }
    }
} ());


function SetLanguageBar() {
    try {
        var list = $(".language_txt");
        list.each(function() {
            $(this).html($language_get[$(this).html()]);
        });
    } catch (e) {
    }
}