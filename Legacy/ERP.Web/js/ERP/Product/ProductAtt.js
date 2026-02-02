$(document).ready(initFunc);

function initFunc() {
    js_GetColor();
    js_LoadPrdAttrId();
    initMode();
    //js_GetProductMatrixByPtyId();

    SetLanguageBar();
}

function js_GetColor() {
    var url = window.webservicePath + "/GetAllColor";
    var budgetId = '#CorId';
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
                                .attr("value", value.Id)
                                .text(value.CorName));
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

function js_search_attr_product() {
    var searchAttr = Object();
    searchAttr.PtyName = $('#PtyName').val();
    searchAttr.PtyDescription = $('#PtyDescription').val();
    var jsondata = JSON.stringify({ searchAttr: searchAttr });

    $.ajax({
        url: 'SearchAttProduct.aspx/SearchProductAttr',
        type: 'POST',
        contentType: 'application/json; charset=utf-8',
        data: jsondata,
        dataType: 'json',
        success: function (data) {
            var jsdata = data.d;
            var jsondata = jQuery.parseJSON(jsdata);
            viewsearchresult(jsondata);
        },
        error: function (data) {
        }
    });
    return false;
}

function createPrdAtt() {
    window.location = "ProductAttribute.aspx";
    return false;
}

var attributeCount = 0;
function AddOneAttribute() {
    var lastOrder = getNewOrder();
    var divcontent = "<div class='form-group' id='div_one_attribute_zzz_'><div class='col-sm-2'>" +
        "<input type='text' class='form-control' id='PropName_zzz_' name='PropName_zzz_' placeholder='Nom' maxlength='200' required></div>" +
        "<div class='col-sm-1'>" +
        "<input type='text' class='form-control' id='PropUnit_zzz_' name='PropUnit_zzz_' placeholder='Unité' maxlength='200'></div>" +
        "<div class='col-sm-2' style='text-align: center'>" +
        "<table style='width:100%' cellpadding='0' cellspacing='0' border='0' class='table-striped table-bordered table-hover'>" +
        "<tr>" +
        "<td><input type='checkbox'  class='form-control' id='PropIsInTechReport_zzz_' name='PropIsInTechReport_zzz_'  title='S&#39afficher sur le fiche technique?'></td>" +
        "<td><input type='checkbox'  class='form-control' id='PropIsImage_zzz_' name='PropIsImage_zzz_' title='Ce valeur contient un image ou un fichier?'></td>" +
        "<td><input type='checkbox'  class='form-control' id='PropIsUnitRightSide_zzz_' name='PropIsUnitRightSide_zzz_' title='L&#39unité s&#39affiches à droit?' ></td>" +
        "<td><input type='checkbox'  class='form-control' id='PropIsTitle_zzz_' name='PropIsTitle_zzz_' title='Ne s&#39afficher que le nom, pas le value dans le fiche technique?'></td>" +
        "<td><input type='checkbox'  class='form-control' id='PropIsSameValue_zzz_' name='PropIsSameValue_zzz_' title='Ce champs est la même pour le produit'></td>" +
        "<td><input type='checkbox'  class='form-control' id='PropIsNullable_zzz_' name='PropIsNullable_zzz_' title='Ce champs est obligatoire'></td>" +
        "<td><input type='checkbox'  class='form-control' id='PropIsSearchField_zzz_' name='PropIsSearchField_zzz_' title='Ce champs s&#39affiche sur la page recherche'></td>" +
        "<td><input type='checkbox'  class='form-control' id='PropIsForPrice_zzz_' name='PropIsForPrice_zzz_' title='Ce champs peut changer le prix'></td>" +
        "</tr></table></div>" +
        "<div class='col-sm-1'>" +
        "<input type='number' class='form-control' id='PropSubOrder_zzz_' name='PropSubOrder_zzz_' min='1' step='0.0001' placeholder='Affichage ordre' maxlength='200'></div>" +
        "<div class='col-sm-1'>" +
        "<input disabled type='number' class='form-control' id='PropOrder_zzz_' name='PropOrder_zzz_' min='1' placeholder='Ordre' maxlength='200' value=" + lastOrder + "></div>" +
        "<div class='col-sm-1'>" +
        "<input type='number' class='form-control' id='PropParentOrder_zzz_' name='PropParentOrder_zzz_' min='1' placeholder='Parent ordre' maxlength='200'></div>" +
        "<div class='col-sm-1'>" +
        "<select class='form-control' id='PropType_zzz_' name='PropType_zzz_'><option value='1'>String</option><option value='2'>Int</option><option value='3'>Decimal</option><option value='4'>DateTime</option><option value='5'>Boolean</option></select></div>" +
        "<div class='col-sm-1'>" +
        "<input type='text' class='form-control' id='PropDescription_zzz_' name='PropDescription_zzz_'placeholder='Description' maxlength='200'></div>" +
         "<div class='col-sm-1'>" +
        "<input type='text' class='form-control' id='PropValue_zzz_' name='PropValue_zzz_'placeholder='Value' maxlength='200'></div>" +
        "<div class='col-sm-1'>" +
        "<span class='btn btn-inverse' id='btn_attr_delete_zzz_' onclick='delete_attr_click_confirm(this)'><i class='fa fa-times'></i></span></div></div>";

    attributeCount--;
    var div_id = '_zzz_' + attributeCount;
    divcontent = replaceAll(divcontent, '_zzz_', div_id);
    $('#div_attributes').append(divcontent);
}

function CreateOneAttribute(propValue) {
    var mode = getParameterByName('mode');
    var disabled = _isView ? 'disabled' : '';
    var btnDeleteContent = (_isModify || _isCreate) ? "<span  class='btn btn-inverse' id='btn_attr_delete_zzz_' onclick='delete_attr_click_confirm(this)'><i class='fa fa-times'></i></span>" : "";
    //propValue.PropName = propValue.PropName.replace(' ', '&nbsp;');

    propValue.PropName = HTMLEncode(propValue.PropName);
    propValue.PropDescription = HTMLEncode(propValue.PropDescription);
    propValue.PropValue = HTMLEncode(propValue.PropValue);

    var divcontent = "<div class='form-group' id='div_one_attribute_zzz_'><div class='col-sm-2'>" +
        "<input " + disabled + " type='text' class='form-control' id='PropName_zzz_' name='PropName_zzz_' maxlength='200' required value=" + propValue.PropName + "></div>" +
        "<div class='col-sm-1'>" +
        "<input " + disabled + " type='text' class='form-control' id='PropUnit_zzz_' name='PropUnit_zzz_' maxlength='200' value=" + propValue.PropUnit + "></div>" +
        "<div class='col-sm-2' style='text-align: center'>" +
        "<table style='width:100%' cellpadding='0' cellspacing='0' border='0' class='table-striped table-bordered table-hover'>" +
        "<tr>" +
        "<td><input " + disabled + " type='checkbox'  class='form-control'  id='PropIsInTechReport_zzz_' name='PropIsInTechReport_zzz_' " + (propValue.PropIsInTechReport === true ? 'checked' : '') + " title='S&#39afficher sur le fiche technique?'></td>" +
        "<td><input " + disabled + " type='checkbox'  class='form-control' id='PropIsImage_zzz_' name='PropIsImage_zzz_' " + (propValue.PropIsImage === true ? 'checked' : '') + " title='Ce valeur contient un image ou un fichier?'></td>" +
        "<td><input " + disabled + " type='checkbox'  class='form-control' id='PropIsUnitRightSide_zzz_' name='PropIsUnitRightSide_zzz_' " + (propValue.PropIsUnitRightSide === true ? 'checked' : '') + " title='L&#39unité s&#39affiches à droit?' ></td>" +
        "<td><input " + disabled + " type='checkbox'  class='form-control' id='PropIsTitle_zzz_' name='PropIsTitle_zzz_' " + (propValue.PropIsTitle === true ? 'checked' : '') + " title='Ne s&#39afficher que le nom, pas le value dans le fiche technique?'></td>" +
        "<td><input " + disabled + " type='checkbox'  class='form-control' id='PropIsSameValue_zzz_' name='PropIsSameValue_zzz_' " + (propValue.PropIsSameValue === true ? 'checked' : '') + " title='Ce champs est la même pour le produit'></td>" +
        "<td><input " + disabled + " type='checkbox'  class='form-control' id='PropIsNullable_zzz_' name='PropIsNullable_zzz_' " + (propValue.PropIsNullable === false ? 'checked' : '') + " title='Ce champs est obligatoire'></td>" +
        "<td><input " + disabled + "  type='checkbox'  class='form-control' id='PropIsSearchField_zzz_' name='PropIsSearchField_zzz_' " + (propValue.PropIsSearchField === true ? 'checked' : '') + " title='Ce champs s&#39affiche sur la page recherche'></td>" +
        "<td><input " + disabled + "  type='checkbox'  class='form-control' id='PropIsForPrice_zzz_' name='PropIsForPrice_zzz_' " + (propValue.PropIsForPrice === true ? 'checked' : '') + " title='Ce champs peut changer le prix'></td>" +
        "</tr></table></div>" +
        "<div class='col-sm-1'>" +
        "<input " + disabled + " type='number' class='form-control' id='PropSubOrder_zzz_' name='PropSubOrder_zzz_' min='1' step='0.0001' maxlength='200' value=" + propValue.PropSubOrder + "></div>" +
        "<div class='col-sm-1'>" +
        "<input disabled type='number' class='form-control' id='PropOrder_zzz_' name='PropOrder_zzz_' min='1' maxlength='200' value=" + propValue.PropOrder + " ></div>" +
        "<div class='col-sm-1'>" +
        "<input " + disabled + " type='number' class='form-control' id='PropParentOrder_zzz_' name='PropParentOrder_zzz_' min='1' maxlength='200' value=" + propValue.PropParentOrder + "></div>" +
        "<div class='col-sm-1'>" +
        "<select " + disabled + " class='form-control' id='PropType_zzz_' name='PropType_zzz_'>" +
        "<option value='1' " + (propValue.PropType === "1" ? "selected" : "") + ">String</option>" +
        "<option value='2' " + (propValue.PropType === "2" ? "selected" : "") + ">Int</option>" +
        "<option value='3' " + (propValue.PropType === "3" ? "selected" : "") + ">Decimal</option>" +
        "<option value='4' " + (propValue.PropType === "4" ? "selected" : "") + ">DateTime</option>" +
        "<option value='5' " + (propValue.PropType === "5" ? "selected" : "") + ">Boolean</option></select></div>" +
        "<div class='col-sm-1'>" +
        "<input " + disabled + " type='text' class='form-control' id='PropDescription_zzz_' name='PropDescription_zzz_' maxlength='200' value=" + propValue.PropDescription + "></div>" +
        "<div class='col-sm-1'>" +
        "<input " + disabled + "  type='text' class='form-control' id='PropValue_zzz_' name='PropValue_zzz_' maxlength='200' value=" + propValue.PropValue + "></div>" +
        "<div class='col-sm-1'>" +
        btnDeleteContent +
        "</div></div>";

    var div_id = '_zzz_' + propValue.PropGuid;
    divcontent = replaceAll(divcontent, '_zzz_', div_id);
    $('#div_attributes').append(divcontent);
}



function delete_attr_click_confirm(sender) {
    var isConf = confirm("Veuillez confirmer la suppression ! \r\nL'attribut supprimé ne sera pas apparaître dans les nouveaux produits !!!");
    if (isConf) {
        delete_attr_click(sender);
    }
}

function delete_attr_click(sender) {
    var senderid = $(sender).attr('id');
    var div_id = senderid.replace('btn_attr_delete_zzz_', 'div_one_attribute_zzz_');
    var propGuid = senderid.replace('btn_attr_delete_zzz_', '');
    //$('#div_attributes').remove('#' + div_id);
    var isGuid = IsGuid(propGuid);
    if (isGuid) {
        var ptyId = getParameterByName('ptyId');
        //js_DeleteProduitAttributePropertyByIdGuid(ptyId, propGuid);
        $('#' + div_id).remove();
    } else {
        $('#' + div_id).remove();
    }
}


function delete_pty_click_confirm(sender) {
    var title = "Confirmez-vous la suppression";
    var content = "<div class='box'><div class='box-body' style='height: 100px;'><div class='form-horizontal'><div class='col-md-12'><div class='form-group'><div class='col-sm-12'>Veuillez confirmer la suppression ! <br/>Une fois les attributs de produit sont supprimés, vous ne pouvez plus créer ce produit !!!</div></div></div></div></div></div>"
    + "<div class='modal-footer center'><button type='button' class='btn btn-inverse' onclick='closeDialog()'>Annuler</button><button type='button' class='btn btn-inverse' onclick='return js_DeleteProduitAttributById();'>SUPPRIMER</button></div>";
    bootbox.dialog({
        title: title,
        message: content
    });
}

function js_DeleteProduitAttributById() {
    var ptyId = getParameterByName('ptyId');
    var url = window.webservicePath + "/DeleteProduitAttributById";
    $.ajax({
        url: url,
        type: 'POST',
        contentType: 'application/json; charset=utf-8',
        data: "{ptyId:'" + ptyId + "'}",
        dataType: 'json',
        success: function (data) {
            var returnvalue = data.d;
            if (returnvalue < 1) {
                alert('Cet attribut de produit est utilisé !\r\nLa suppression n\'a pas effecturé ! ');
            } else {
                window.location = 'SearchAttProduct.aspx';
            }
        },
        error: function (data) {
        }
    });
}

function js_DeleteProduitAttributePropertyByIdGuid(ptyId, propGuid) {
    var url = window.webservicePath + "/DeleteProduitAttributePropertyByIdGuid";
    $.ajax({
        url: url,
        type: 'POST',
        contentType: 'application/json; charset=utf-8',
        data: "{ptyId:'" + ptyId + "',propGuid:'" + propGuid + "'}",
        dataType: 'json',
        success: function (data) {
            var isDeleted = data.d;
            if (isDeleted) {
                $('#div_one_attribute_zzz_' + propGuid).remove();
            }
        },
        error: function (data) {
        }
    });
}


var prd_atts_validated = true;
function js_create_update_attr() {
    prd_atts_validated = $('#PtyName')[0].checkValidity();
    var aPty = Object();
    aPty.FId = getParameterByName('ptyId');
    aPty.PtyName = $('#PtyName').val();
    aPty.PtyDescription = $('#PtyDescription').val();
    aPty.PtyStandards = $('#PtyStandards').val();
    aPty.PtyActived = $('#PtyActived').is(':checked');
    aPty.CorId = $('#CorId').val();
    aPty.PropertyNames = js_get_prd_atts_from_page();
    //aPty.PropertyXNames = js_get_prd_X_atts_from_page();
    //aPty.PropertyYNames = js_get_prd_Y_atts_from_page();
    if (prd_atts_validated) {
        var jsondata = JSON.stringify({ oneProductType: aPty });
        //        setloadingmaskmessage('Veuillez patienter ...');
        //        loadingmaskShow();
        ShowPleaseWait();
        $.ajax({
            url: 'ProductAttribute.aspx/CreateUpdateProductAttr',
            type: 'POST',
            contentType: 'application/json; charset=utf-8',
            data: jsondata,
            dataType: 'json',
            success: function (data) {
                var ptyId = data.d;
                var url = window.location.href.split('?')[0];
                var newUrl = url + '?ptyId=' + ptyId + '&mode=view';
                document.location.href = newUrl;
            },
            error: function (data) {
            }
        });
    }
    return false;
}

function js_get_prd_atts_from_page() {
    var listAtrs = [];
    var allAtrDiv = $('div[id^="div_one_attribute_zzz_"]');
    $.each(allAtrDiv, function (indx, value) {
        var divId = $(value).attr('id');
        var ptyGuid = divId.replace('div_one_attribute_zzz_', '');
        var oneAtr = Object();
        oneAtr.PropName = $('#PropName_zzz_' + ptyGuid).val();
        var order = $('#PropOrder_zzz_' + ptyGuid).val();
        var parentorder = $('#PropParentOrder_zzz_' + ptyGuid).val();
        var suborder = $('#PropSubOrder_zzz_' + ptyGuid).val();
        order = order === '' ? 0 : order;
        parentorder = parentorder === '' ? 0 : parentorder;
        suborder = suborder === '' ? 0 : suborder;
        oneAtr.PropGuid = ptyGuid;
        oneAtr.PropOrder = order;
        oneAtr.PropParentOrder = parentorder;
        oneAtr.PropSubOrder = suborder;
        oneAtr.PropUnit = $('#PropUnit_zzz_' + ptyGuid).val();
        oneAtr.PropDescription = $('#PropDescription_zzz_' + ptyGuid).val();
        oneAtr.PropType = $('#PropType_zzz_' + ptyGuid).val();
        oneAtr.PropIsTitle = $('#PropIsTitle_zzz_' + ptyGuid).is(':checked');
        oneAtr.PropIsInTechReport = $('#PropIsInTechReport_zzz_' + ptyGuid).is(':checked');
        oneAtr.PropIsImage = $('#PropIsImage_zzz_' + ptyGuid).is(':checked');
        oneAtr.PropIsUnitRightSide = $('#PropIsUnitRightSide_zzz_' + ptyGuid).is(':checked');
        oneAtr.PropIsSameValue = $('#PropIsSameValue_zzz_' + ptyGuid).is(':checked');
        oneAtr.PropIsNullable = !$('#PropIsNullable_zzz_' + ptyGuid).is(':checked');
        oneAtr.PropIsSearchField = $('#PropIsSearchField_zzz_' + ptyGuid).is(':checked');
        oneAtr.PropIsForPrice = $('#PropIsForPrice_zzz_' + ptyGuid).is(':checked');
        oneAtr.PropValue = $('#PropValue_zzz_' + ptyGuid).val();
        prd_atts_validated = prd_atts_validated && $('#PropName_zzz_' + ptyGuid)[0].checkValidity();
        listAtrs.push(oneAtr);
    });
    //var oneObj = Object;
    //oneObj = toObject(listAtrs);
    //return oneObj;
    return listAtrs;
}

function js_LoadPrdAttrId() {
    var ptyId = getParameterByName('ptyId');
    if (ptyId) {
        var url = window.webservicePath + "/LoadProduitAttributeById";
        $.ajax({
            type: "POST",
            url: url,
            contentType: "application/json; charset=utf-8",
            data: "{ptyId:'" + ptyId + "'}",
            dataType: "json",
            success: function (data) {
                var jsdata = data.d;
                var jsondata = jQuery.parseJSON(jsdata);
                if (jsondata !== -1) {
                    var onepty = jsondata;
                    setFieldValue('PtyName', onepty.PtyName);
                    setFieldValue('PtyDescription', onepty.PtyDescription);
                    setFieldValue('PtyActived', onepty.PtyActived);
                    setFieldValue('CorId', onepty.CorId);
                    setFieldValue('PtyStandards', onepty.PtyStandards);
                    var propNames = onepty.PropertyNames;
                    $.each(propNames, function (ind, value) {
                        //setFieldValue(newname, value, true);
                        CreateOneAttribute(value);
                    });
                } else {
                }
            },
            error: function (data) {
                var test = '';
            }
        });
    }
}


function js_Search_Pty() {
    var ptyName = $('#PtyName').val();
    var ptyDescription = $('#PtyDescription').val();
    myApp.showPleaseWaitWithText('Recherche en cours...');
    $.ajax({
        url: 'SearchAttProduct.aspx/SearchProductAttribute',
        type: 'POST',
        contentType: 'application/json; charset=utf-8',
        data: "{ptyName:'" + ptyName + "',ptyDes:'" + ptyDescription + "'}",
        dataType: 'json',
        success: function (data) {
            var jsdata = data.d;
            var jsondata = jQuery.parseJSON(jsdata);
            if (jsondata.length === 0) {
                NoResultMsg();
            }
            viewSearchPTyResult(jsondata);
            myApp.hidePleaseWait();
        },
        error: function (data) {
            myApp.hidePleaseWait();
        }
    });
    return false;
}


var hasSet = false;
function viewSearchPTyResult(searchresult) {
    var budgetId = '#tbody_search_result';
    //var searchresult = readCookieJson('searchresult0');
    if (hasSet) {
        $('#datatable_search_result').dataTable().fnClearTable();
    }
    if (searchresult.length > 0) {
        $('.searchresult').show();
        var content = "";
        $.each(searchresult, function (name, value) {
            $('#datatable_search_result').dataTable().fnAddData([
                "<span  onclick='viewresult(\"" + value.FId + "\")' style='cursor:pointer'>" + value.PtyName + "</span>",
                value.PtyActived === true ? 'OUI' : 'NON',
                value.PtyDescription
            ]);

        });
        //$(budgetId).append(content);
        try {
            if (!hasSet) {
                $('#datatable_search_result').dataTable({
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

function viewresult(id) {
    var url = 'ProductAttribute.aspx?ptyId=' + id + "&mode=view";
    window.location.href = url;
}

function getNewOrder() {
    var allOrders = $('input[id^="PropOrder_zzz_"]');
    var neworder = 1;
    if (allOrders.length > 0) {
        var orders = [];
        $.each(allOrders, function (idx, value) {
            var aOrd = $(value).val();
            orders.push(aOrd);
        });
        neworder = (orders.sort(function (a, b) { return b - a })[0] * 1) + 1;
    }
    return neworder;
}


function DuplicateProdType() {
    var pitid = 0;
    var title = "DUPLICATER";
    var content = "<div class='box'><div class='box-body' style='height: 100px;'>" +
        "<div class='form-horizontal'>" +
        "<div class='col-md-12'>" +
        "<div class='form-group'>" +
        "<div class='col-sm-12' style='text-align:center;font-size: 15pt;'>Veuillez remplir nouveau nom du produit ! " +
        "<br/><br/><div class='form-group'>" +
        "<div class='col-sm-12'><input type='text' class='form-control' id='PtyDupName' name='PtyDupName' placeholder='Nom du produit' required maxlength='200'></div></div>" +
        "</div></div></div></div></div></div>"
        + "<div class='modal-footer center'>" +
        "<button type='button' class='btn btn-inverse' onclick='closeDialog()'>Annuler</button>" +
        "<button type='button' class='btn btn-inverse' onclick='return js_DuplicatePty();'>DUPLICATER</button></div>";
    bootbox.dialog({
        title: title,
        message: content
    }).find('.modal-content').css({
        'margin-top': function () {
            var w = $(window).height();
            var b = $(".modal-dialog").height();
            // should not be (w-h)/2
            var h = (w - b) * 0.3;
            return h + "px";
        }
    }).find('.modal-header').css({
        'background': 'url(../../img/menu_005_bg.jpg) repeat-x',
        'text-align': 'center',
        'color': 'white'
    });
    return false;
}

function js_DuplicatePty() {
    var ptyId = getParameterByName('ptyId');
    var ptyDupName = $('#PtyDupName').val();
    var url = window.webservicePath + "/DuplicateProductType";
    $.ajax({
        url: url,
        type: 'POST',
        contentType: 'application/json; charset=utf-8',
        data: "{ptyId:'" + ptyId + "',ptyName:'" + ptyDupName + "'}",
        dataType: 'json',
        success: function (data) {
            var returnvalue = data.d;
            if (returnvalue !== "0" && returnvalue !== "-1" && returnvalue !== "-2") {
                var ptyId = returnvalue;
                var url = window.location.href.split('?')[0];
                var newUrl = url + '?ptyId=' + ptyId + '&mode=view';
                document.location.href = newUrl;
            } else {
                alert('DUPLICATER ERROR');
            }
        },
        error: function (data) {
        }
    });
    return false;
}