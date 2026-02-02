$(document).ready(initFunc);

function initFunc() {
    js_GetProductMatrixByPtyId();
}


var X_columnCount = 0;
function AddXAttribute() {
    var lastOrder = getNewOrderXY('x');
    var divcontent = "<div class='form-group' id='div_one_attribute_xxx_'><div class='col-sm-2'>" +
        "<input type='text' class='form-control btn-primary' id='PropName_xxx_' name='PropName_xxx_' placeholder='Nom' maxlength='200' required></div>" +
        "<div class='col-sm-1'>" +
        "<input type='text' class='form-control' id='PropUnit_xxx_' name='PropUnit_xxx_' placeholder='Unité' maxlength='200'></div>" +
        "<div class='col-sm-2' style='text-align: center'>" +
        "<input type='checkbox' id='PropIsInTechReport_xxx_' name='PropIsInTechReport_xxx_'  title='S&#39afficher sur le fiche technique?'> | " +
        "<input type='checkbox' id='PropIsImage_xxx_' name='PropIsImage_xxx_' title='Ce valeur contient un image?'> | " +
        "<input type='checkbox' id='PropIsUnitRightSide_xxx_' name='PropIsUnitRightSide_xxx_' title='L&#39unité s&#39affiches à droit?' > | " +
        "<input type='checkbox' id='PropIsTitle_xxx_' name='PropIsTitle_xxx_' title='Ne s&#39afficher que le nom, pas le value dans le fiche technique?'>" +
        "</div>" +
        "<div class='col-sm-1'>" +
        "<input type='number' class='form-control' id='PropSubOrder_xxx_' name='PropSubOrder_xxx_' min='1' step='0.0001' placeholder='Affichage ordre' maxlength='200'></div>" +
        "<div class='col-sm-1'>" +
        "<input disabled type='number' class='form-control' id='PropOrder_xxx_' name='PropOrder_xxx_' min='1' placeholder='Ordre' maxlength='200' value=" + lastOrder + "></div>" +
        "<div class='col-sm-1'>" +
        "<input type='number' class='form-control' id='PropParentOrder_xxx_' name='PropParentOrder_xxx_' min='1' placeholder='Parent ordre' maxlength='200'></div>" +
        "<div class='col-sm-1'>" +
        "<select class='form-control' id='PropType_xxx_' name='PropType_xxx_'><option value='1'>String</option><option value='2'>Int</option><option value='3'>Decimal</option><option value='4'>DateTime</option><option value='5'>Boolean</option></select></div>" +
        "<div class='col-sm-2'>" +
        "<input type='text' class='form-control' id='PropDescription_xxx_' name='PropDescription_xxx_'placeholder='Description' maxlength='200'></div><div class='col-sm-1'>" +
        "<span class='btn btn-danger' id='btn_attr_delete_xxx_' onclick='return delete_xy_attr_click_confirm(this)'><i class='fa fa-times'></i></span></div></div>";

    X_columnCount--;
    var divId = '_xxx_' + X_columnCount;
    divcontent = replaceAll(divcontent, '_xxx_', divId);
    $('#div_X_attributes').append(divcontent);
}



var Y_columnCount = 0;
function AddYAttribute() {
    //var lastOrder = getNewOrderXY('y');
    var divcontent = "<div class='form-group' id='div_one_attribute_yyy_'><div class='col-sm-2'>" +
        "<input type='text' class='form-control btn-warning' id='PropName_yyy_' name='PropName_yyy_' placeholder='Nom' maxlength='200' required></div>" +
        "<div class='col-sm-1'></div>" +
        "<div class='col-sm-2' style='text-align: center'></div>" +
        "<div class='col-sm-1'>" +
        "<input type='number' class='form-control' id='PropSubOrder_yyy_' name='PropSubOrder_yyy_' min='1' placeholder='Affichage ordre' maxlength='200'></div>" +
        "<div class='col-sm-1'></div>" +
        "<div class='col-sm-1'></div>" +
        "<div class='col-sm-1'></div>" +
        "<div class='col-sm-2'>" +
        "<input type='text' class='form-control' id='PropDescription_yyy_' name='PropDescription_yyy_'placeholder='Description' maxlength='200'></div><div class='col-sm-1'>" +
        "<span class='btn btn-danger' id='btn_attr_delete_yyy_' onclick='return delete_xy_attr_click_confirm(this)'><i class='fa fa-times'></i></span></div></div>";

    Y_columnCount--;
    var divId = '_yyy_' + Y_columnCount;
    divcontent = replaceAll(divcontent, '_yyy_', divId);
    $('#div_Y_attributes').append(divcontent);
}



function getNewOrderXY(ind) {
    var orderstr = ind === 'x' ? 'input[id^="PropOrder_xxx_"]' : 'input[id^="PropOrder_yyy_"]';
    //var allOrders = $('input[id^="PropOrder_zzz_"]');
    var allOrders = $(orderstr);
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

function delete_xy_attr_click_confirm(sender) {
    var isConf = confirm("Veuillez confirmer la suppression ! \r\nL'attribut supprimé ne sera pas apparaître dans les nouveaux produits !!!");
    if (isConf) {
        delete_xy_attr_click(sender);
    }
    return false;
}


function delete_xy_attr_click(sender) {
    var senderid = $(sender).attr('id');
    var div_id = senderid.replace('btn_attr_delete_', 'div_one_attribute_');
    var btnIdStr = 'btn_attr_delete';
    if (senderid.indexOf('_xxx_') > 1) {
        btnIdStr += '_xxx_';
    } else {
        btnIdStr += '_yyy_';
    }
    var propGuid = senderid.replace(btnIdStr, '');
    //$('#div_attributes').remove('#' + div_id);
    var isGuid = IsGuid(propGuid);
    if (isGuid) {
        var ptyId = getParameterByName('ptyId');
        //js_DeleteProduitAttributePropertyByIdGuid(ptyId, propGuid);
    } else {
        $('#' + div_id).remove();
    }
}


function js_get_prd_X_atts_from_page() {
    var listAtrs = [];
    var allAtrDiv = $('div[id^="div_one_attribute_xxx_"]');
    $.each(allAtrDiv, function (indx, value) {
        var divId = $(value).attr('id');
        var ptyGuid = divId.replace('div_one_attribute_xxx_', '');
        var oneAtr = Object();
        oneAtr.PropName = $('#PropName_xxx_' + ptyGuid).val();
        var order = $('#PropOrder_xxx_' + ptyGuid).val();
        var parentorder = $('#PropParentOrder_xxx_' + ptyGuid).val();
        var suborder = $('#PropSubOrder_xxx_' + ptyGuid).val();
        order = order === '' ? 0 : order;
        parentorder = parentorder === '' ? 0 : parentorder;
        suborder = suborder === '' ? 0 : suborder;
        oneAtr.PropGuid = ptyGuid;
        oneAtr.PropOrder = order;
        oneAtr.PropParentOrder = parentorder;
        oneAtr.PropSubOrder = suborder;
        oneAtr.PropUnit = $('#PropUnit_xxx_' + ptyGuid).val();
        oneAtr.PropDescription = $('#PropDescription_xxx_' + ptyGuid).val();
        oneAtr.PropType = $('#PropType_xxx_' + ptyGuid).val();
        oneAtr.PropIsTitle = $('#PropIsTitle_xxx_' + ptyGuid).is(':checked');
        oneAtr.PropIsInTechReport = $('#PropIsInTechReport_xxx_' + ptyGuid).is(':checked');
        oneAtr.PropIsImage = $('#PropIsImage_xxx_' + ptyGuid).is(':checked');
        oneAtr.PropIsUnitRightSide = $('#PropIsUnitRightSide_xxx_' + ptyGuid).is(':checked');
        prd_atts_validated = prd_atts_validated && $('#PropName_xxx_' + ptyGuid)[0].checkValidity();
        listAtrs.push(oneAtr);
    });
    //var oneObj = Object;
    //oneObj = toObject(listAtrs);
    //return oneObj;
    return listAtrs;
}

function js_get_prd_Y_atts_from_page() {
    var listAtrs = [];
    var allAtrDiv = $('div[id^="div_one_attribute_yyy_"]');
    $.each(allAtrDiv, function (indx, value) {
        var divId = $(value).attr('id');
        var ptyGuid = divId.replace('div_one_attribute_yyy_', '');
        var oneAtr = Object();
        oneAtr.PropName = $('#PropName_yyy_' + ptyGuid).val();
        var order = $('#PropOrder_yyy_' + ptyGuid).val();
        var parentorder = $('#PropParentOrder_yyy_' + ptyGuid).val();
        var suborder = $('#PropSubOrder_yyy_' + ptyGuid).val();
        order = order === '' ? 0 : order;
        parentorder = parentorder === '' ? 0 : parentorder;
        suborder = suborder === '' ? 0 : suborder;
        oneAtr.PropGuid = ptyGuid;
        oneAtr.PropOrder = order;
        oneAtr.PropParentOrder = parentorder;
        oneAtr.PropSubOrder = suborder;
        oneAtr.PropUnit = $('#PropUnit_yyy_' + ptyGuid).val();
        oneAtr.PropDescription = $('#PropDescription_yyy_' + ptyGuid).val();
        oneAtr.PropType = $('#PropType_yyy_' + ptyGuid).val();
        oneAtr.PropIsTitle = $('#PropIsTitle_yyy_' + ptyGuid).is(':checked');
        oneAtr.PropIsInTechReport = $('#PropIsInTechReport_yyy_' + ptyGuid).is(':checked');
        oneAtr.PropIsImage = $('#PropIsImage_yyy_' + ptyGuid).is(':checked');
        oneAtr.PropIsUnitRightSide = $('#PropIsUnitRightSide_yyy_' + ptyGuid).is(':checked');
        prd_atts_validated = prd_atts_validated && $('#PropName_yyy_' + ptyGuid)[0].checkValidity();
        listAtrs.push(oneAtr);
    });
    //var oneObj = Object;
    //oneObj = toObject(listAtrs);
    //return oneObj;
    return listAtrs;
}

function createUpdate_OneMatriceColumnClick(sender) {
    if (sender) {
        return getPropXForUpdate(sender);
    } else {
        return AddOneColumn(sender);
    }
}

function getPropXForUpdate(sender) {
    var xid = sender ? $(sender).attr('xid') : '';
    var ptyId = getParameterByName('ptyId');
    if (ptyId && xid) {
        var url = window.webservicePath + "/GetPorpXById";
        $.ajax({
            url: url,
            type: 'POST',
            contentType: 'application/json; charset=utf-8',
            data: "{ptyId:'" + ptyId + "',propGuid:'" + xid + "'}",
            dataType: 'json',
            success: function (data) {
                var jsdata = data.d;
                var jsondata = jQuery.parseJSON(jsdata);
                //                setAttrPropItemsWithX(jsondata, iscreate, true);
                //                bootbox.hideAll();
                AddOneColumn(false, jsondata);
            },
            error: function (data) {
            }
        });
    }
    return false;
}


var _columnCount = 0;
function AddOneColumn(sender, updateX) {
    //var lastOrder = getNewOrder();
    var xid = sender ? $(sender).attr('xid') : (updateX ? updateX.PropGuid : '');
    var propname = '';
    var propunit = '';
    var propunitright = false;
    var propsuborder = 0;
    var proptype = 1;
    var propdescription = '';
    if (sender) {
        propname = $(sender).attr('PropName');
    }
    if (updateX) {
        propname = updateX.PropName;
        propunit = updateX.PropUnit;
        propunitright = updateX.PropIsUnitRightSide;
        propsuborder = updateX.PropSubOrder;
        proptype = updateX.PropType;
        propdescription = updateX.PropDescription;
        propname = replaceAll(propname, ' ', '&nbsp;');
        propunit = replaceAll(propunit, ' ', '&nbsp;');
        propdescription = replaceAll(propdescription, ' ', '&nbsp;');
    }

    var divcontent = "<form><div class='row'>" +
        "<div class='col-md-12'><div class='form-horizontal'>" +
        "<div class='form-group'><label class='col-sm-2 control-label att_label'>Nom</label>" +
        "<label class='col-sm-1 control-label att_label'>Unité</label>" +
        "<label class='col-sm-3 control-label att_label'>Unité à droit</label>" +
        "<label class='col-sm-1 control-label att_label'>Affichage Odr</label>" +
        "<label class='col-sm-2 control-label att_label'>Type</label>" +
        "<label class='col-sm-3 control-label att_label'>Description</label>" +
        "</div></div>";
    divcontent += "<div class='form-group' id='div_one_attribute_column_'>" +
        "<div class='col-sm-2'>" +
        "<input type='text' class='form-control' id='PropName_column_' name='PropName_column_' placeholder='Nom' maxlength='200' required value='" + propname + "'></div>" +
        "<div class='col-sm-1'>" +
        "<input type='text' class='form-control' id='PropUnit_column_' name='PropUnit_column_' placeholder='Unité' maxlength='200' value='" + propunit + "'></div>" +
        "<div class='col-sm-3' style='text-align: center'>" +
        "<input type='checkbox' class='form-control' id='PropIsUnitRightSide_column_' name='PropIsUnitRightSide_column_' title='L&#39unité s&#39affiches à droit?' " + (propunitright ? "checked" : "") + ">" +
        "</div>" +
        "<div class='col-sm-1'>" +
        "<input type='number' class='form-control' id='PropSubOrder_column_' name='PropSubOrder_column_' min='0' step='1' pattern='[0-9\/]*' placeholder='Affichage ordre' maxlength='200' value='" + propsuborder + "'></div>" +
        "<div class='col-sm-2'>" +
        "<select class='form-control' id='PropType_column_' name='PropType_column_'>" +
        "<option value='1' " + (updateX && updateX.PropType === "1" ? "selected" : "") + ">String</option>" +
        "<option value='2' " + (updateX && updateX.PropType === "2" ? "selected" : "") + ">Int</option>" +
        "<option value='3' " + (updateX && updateX.PropType === "3" ? "selected" : "") + ">Decimal</option>" +
        "<option value='4' " + (updateX && updateX.PropType === "4" ? "selected" : "") + ">DateTime</option>" +
        "<option value='5' " + (updateX && updateX.PropType === "5" ? "selected" : "") + ">Boolean</option></select></div>" +
        "<div class='col-sm-3'>" +
        "<input type='text' class='form-control' id='PropDescription_column_' name='PropDescription_column_'placeholder='Description' maxlength='200' value='" + propdescription + "'></div>" +
        "</div>" +
        "</div></div>";
    var btncontent = "<div class='new-modal-footer'><button data-bb-handler='cancel' onclick='javascript:bootbox.hideAll()'  type='button' class='btn btn-default pull-left'>Annuler</button>" +
        "<button type='submit' id='btn_add_click_column_' class='btn btn-info pull-right' xid='" + xid + "' onclick='return addColumnClick(this)'>" + ((sender || updateX) ? "Mettre à jour" : "Ajouter") + "</button></div></form>";

    divcontent += btncontent;
    _columnCount--;
    var div_id = '_column_' + ((sender || updateX) ? xid : _columnCount);
    divcontent = replaceAll(divcontent, '_column_', div_id);
    var title = (sender || updateX) ? ("Mettre à jous la colonne « <span style='color:red;'>" + propname + "</span> »") : "Ajouter une colonne";
    bootbox.dialog({
        title: title,
        message: divcontent,
        className: 'large-dialog'
    }).find('.modal-content').css({
        'margin-top': function () {
            var w = $(window).height();
            var b = $(".modal-dialog").height();
            // should not be (w-h)/2
            var h = (w - b) / 3;
            return h + "px";
        }
    }).find('.modal-header').css({
        'background-color': '#70afc4'
    }); ;
    return false;
}

function addColumnClick(sender) {
    var senderid = $(sender).attr('id');
    var propname = senderid.replace('btn_add_click_column_', 'PropName_column_');
    var validated = true;
    var xid = sender ? $(sender).attr('xid') : '';
    var ptyId = getParameterByName('ptyId');
    validated = validated && $('#' + propname)[0].checkValidity();
    var url = window.webservicePath + "/CreateUpdateOneProperty";
    var oneAtr = js_get_matrix_column();
    var iscreate = sender ? false : true;
    if (validated && ptyId) {
        if (prd_atts_validated) {
            var jsondata = JSON.stringify({ ptyId: ptyId, propertyNames: oneAtr });
            setloadingmaskmessage('Veuillez patienter ...');
            loadingmaskShow();
            $.ajax({
                url: url,
                type: 'POST',
                contentType: 'application/json; charset=utf-8',
                data: jsondata,
                dataType: 'json',
                success: function (data) {
                    var jsdata = data.d;
                    var jsondata = jQuery.parseJSON(jsdata);
                    setAttrPropItemsWithX(jsondata, iscreate, true);
                    bootbox.hideAll();
                },
                error: function (data) {
                }
            });
        }
    }
    return false;
}

var prd_matrix_column = true;
function js_get_matrix_column() {
    var listAtrs = [];
    var allAtrDiv = $('div[id^="div_one_attribute_column_"]');
    $.each(allAtrDiv, function (indx, value) {
        var divId = $(value).attr('id');
        var ptyGuid = divId.replace('div_one_attribute_column_', '');
        var oneAtr = Object();
        oneAtr.PropName = $('#PropName_column_' + ptyGuid).val();
        var order = '';
        var parentorder = '';
        var suborder = $('#PropSubOrder_column_' + ptyGuid).val();
        order = order === '' ? 0 : order;
        parentorder = parentorder === '' ? 0 : parentorder;
        suborder = suborder === '' ? 0 : suborder;
        oneAtr.PropGuid = ptyGuid;
        oneAtr.PropOrder = order;
        oneAtr.PropParentOrder = parentorder;
        oneAtr.PropSubOrder = suborder;
        oneAtr.PropUnit = $('#PropUnit_column_' + ptyGuid).val();
        oneAtr.PropDescription = $('#PropDescription_column_' + ptyGuid).val();
        oneAtr.PropType = $('#PropType_column_' + ptyGuid).val();
        oneAtr.PropIsTitle = false;
        oneAtr.PropIsInTechReport = false;
        oneAtr.PropIsImage = false;
        oneAtr.PropIsUnitRightSide = $('#PropIsUnitRightSide_column_' + ptyGuid).is(':checked');
        prd_matrix_column = prd_matrix_column && $('#PropName_column_' + ptyGuid)[0].checkValidity();
        listAtrs.push(oneAtr);
    });
    //var oneObj = Object;
    //oneObj = toObject(listAtrs);
    //return oneObj;
    return listAtrs[0];
}

function js_GetProductMatrixByPtyId() {
    var ptyId = getParameterByName('ptyId');
    var url = window.webservicePath + "/GetProductMatrixByPtyId";
    if (ptyId) {
        $.ajax({
            url: url,
            type: 'POST',
            contentType: 'application/json; charset=utf-8',
            data: "{ptyId:'" + ptyId + "'}",
            dataType: 'json',
            success: function (data) {
                var jsdata = data.d;
                var jsondata = jQuery.parseJSON(jsdata);
                $.each(jsondata, setPropItemFrom_GetProductMatrixByPtyId);
            },
            error: function (data) {
            }
        });
    }
}


function setPropItemFrom_GetProductMatrixByPtyId(name, value) {
    setAttrPropItemsWithX(value, true);
}


function confirm_delete_one_prop_info(sender) {
    var isConf = confirm("Veuillez confirmer la suppression ! \r\nL'attribut supprimé ne sera pas apparaître dans les nouveaux produits !!!");
    if (isConf) {
        delete_one_prop_info(sender);
    }
    return false;
}

function delete_one_prop_info(sender) {
    var senderid = $(sender).attr('id');
    var divId = senderid.replace('btn_delete_one_prop_info_', 'div_one_prop_info_');
    var propGuid = senderid.replace('btn_delete_one_prop_info_', '');
    var isGuid = IsGuid(propGuid);
    if (isGuid) {
        var ptyId = getParameterByName('ptyId');
        js_DeleteProduitPropertyByIdGuid(ptyId, propGuid);
        $('#' + divId).remove();
    } else {
        $('#' + divId).remove();
    }
    return false;
}



function js_DeleteProduitPropertyByIdGuid(ptyId, propGuid) {
    var url = window.webservicePath + "/DeleteProduitPropertyByIdGuid";
    $.ajax({
        url: url,
        type: 'POST',
        contentType: 'application/json; charset=utf-8',
        data: "{ptyId:'" + ptyId + "',propGuid:'" + propGuid + "'}",
        dataType: 'json',
        success: function (data) {
            var isDeleted = data.d;
            if (isDeleted) {
                $('#div_one_prop_info_' + propGuid).remove();
            }
        },
        error: function (data) {
        }
    });
}

function add_one_Y_item(sender, isCreate) {
    var senderid = $(sender).attr('id');
    //var divId = senderid.replace('btn_add_one_Y_item_', 'div_one_prop_info_');
    var propGuid = senderid.replace('btn_add_one_Y_item_', '');
    var propName = $(sender).attr('PropName');
    var propYName = $(sender).text();
    var xguid = $(sender).attr('xid');
    var propDes = $(sender).attr('Des');
    var divcontent = "<form><div class='row'>" +
        "<div class='col-md-12'><div class='form-horizontal'>" +
        "<div class='form-group'><label class='col-sm-3 control-label att_label'>Nom</label>" +
        "<label class='col-sm-9 control-label att_label'>Description</label>" +
        "</div></div>";
    var yValue = isCreate ? "" : propYName;
    var yDesciption = isCreate ? "" : propDes;
    if (yValue) {
        yValue = replaceAll(yValue, " ", "&nbsp;");
    } if (yDesciption) {
        yDesciption = replaceAll(yDesciption, " ", "&nbsp;");
    }
    var btnName = isCreate ? "Ajouter" : "Mettre à jour";
    divcontent += "<div class='form-group' id='div_one_attribute_column_'>" +
        "<div class='col-sm-3'>" +
        "<input type='text' class='form-control' id='PropName_column_' name='PropName_column_' placeholder='Nom' maxlength='200' required value=" + yValue + " ></div>" +
        "<div class='col-sm-9'>" +
        "<input type='text' class='form-control' id='PropDescription_column_' name='PropDescription_column_'placeholder='Description' maxlength='200' value=" + yDesciption + "></div>" +
        "</div>" +
        "</div></div>";
    var btncontent = "<div class='new-modal-footer' style='text-align:center'>" +
        "<button data-bb-handler='cancel' onclick='javascript:bootbox.hideAll()' type='button' class='btn btn-default pull-left'>Annuler</button>" +
        "<button data-bb-handler='cancel' onclick='return confirmDeleteYItem(this)' type='button' xid=" + xguid + "  id='btn_delete_one_Y_item_confirm_column_' class='btn btn-danger' style='margin-left: auto;margin-right: auto;'>Supprimer</button>" +
        "<button type='submit' id='btn_add_click_one_item_column_' class='btn btn-info pull-right' xid=" + xguid + " onclick='return addOneItemClick(this," + isCreate + ")'>" + btnName + "</button>" +
        "</div></form>";
    divcontent += btncontent;
    var divId = '_PropY_' + propGuid;
    divcontent = replaceAll(divcontent, '_column_', divId);
    var title = "";
    if (isCreate) {
        title = "Ajouter un objet pour  « <span style='color:red;'>" + propName + "</span> »";
    } else {
        title = "Mettre à jous « <span style='color:red;'>" + propYName + "</span> » pour « <span style='color:red;'>" + propName + "</span> »";
    }
    bootbox.dialog({
        title: title,
        message: divcontent,
        className: 'large-dialog'
    }).find('.modal-content').css({
        'margin-top': function () {
            var w = $(window).height();
            var b = $(".modal-dialog").height();
            // should not be (w-h)/2
            var h = (w - b) / 3;
            return h + "px";
        }
    }).find('.modal-header').css({
        'background-color': '#70afc4'
    }); 
    return false;
}

function addOneItemClick(sender, isCreate) {
    var senderid = $(sender).attr('id');
    var guid = senderid.replace('btn_add_click_one_item_PropY_', '');
    var propName = $('#PropName_PropY_' + guid).val();
    var propDescription = $('#PropDescription_PropY_' + guid).val();
    var ptyId = getParameterByName('ptyId');
    var xguid = $(sender).attr('xid');
    var validated = $('#PropName_PropY_' + guid)[0].checkValidity();
    var url = window.webservicePath + "/AddUpdateOneYItem";
    var oneAtr = Object();
    oneAtr.PropName = propName;
    oneAtr.PropXGuid = isCreate ? guid : xguid;
    oneAtr.PropOrder = 0;
    oneAtr.PropParentOrder = 0;
    oneAtr.PropSubOrder = 0;
    oneAtr.PropGuid = isCreate ? '' : guid;
    // this field is ptyId
    oneAtr.PropUnit = ptyId;
    oneAtr.PropDescription = propDescription;
    if (validated && ptyId) {
        if (prd_atts_validated) {
            var jsondata = JSON.stringify({ propertyName: oneAtr });
            setloadingmaskmessage('Veuillez patienter ...');
            loadingmaskShow();
            $.ajax({
                url: url,
                type: 'POST',
                contentType: 'application/json; charset=utf-8',
                data: jsondata,
                dataType: 'json',
                success: function (data) {
                    var jsdata = data.d;
                    var jsondata = jQuery.parseJSON(jsdata);
                    bootbox.hideAll();
                    setPropWithItems(jsondata);
                },
                error: function (data) {
                }
            });
        }
    } else {

    }
    return false;
}

function setPropWithItems(propValue) {
    setAttrPropItemsWithX(propValue, false);
}

function setAttrPropItemsWithX(propValue, isCreate, isUpdateXValue) {
    var divPropContent = "";
    var guid = propValue.PropGuid;
    var divContentid = "";
    if (isCreate || isUpdateXValue) {
        if (isUpdateXValue) {
            var divId = 'div_one_prop_info_' + propValue.PropGuid;
            $('#' + divId).remove();
        }
        divPropContent = "<div class='col-md-3' id='div_one_prop_info_PropGuid_'><div class='box border blue'>" +
            "<div class='box-title' style='text-align: center'>" +
            "<h4>" +
            "<span id='prd_matrix_item_title'>" + propValue.PropName + "</span>" +
            "</h4></div>" +
            "<div class='box-body center' id='div_prop_items_content_PropGuid_'>";
    } else {
        //$('#prd_matrix_item_title').text(propValue.PropName);
        divContentid = 'div_prop_items_content_' + guid;
        $('#' + divContentid).empty();
    }
    // begin-- for buttons
    var buttonItems = '';
    var propYs = propValue.SubYPropValues;
    if (propYs) {
        $.each(propYs, function (aName, aValue) {
            var oneBtn = "<button class='btn btn-block btn-default' onclick='return add_one_Y_item(this,false)' " + (IsModify() ? "" : "disabled") + " PropName='" + propValue.PropName + "' xid='" + aValue.PropXGuid + "' id='btn_add_one_Y_item_" + aValue.PropGuid + "' des='" + aValue.PropDescription + "'><span>" + aValue.PropName + "</span></button>";
            buttonItems += oneBtn;
        });
    }
    if (IsModify()) {
        buttonItems += "<button class='btn btn-block btn-info' id='btn_add_one_Y_item_PropGuid_' onclick='return add_one_Y_item(this,true)' PropName='" + propValue.PropName + "'><span>Ajouter</span></button>" +
        "<button class='btn btn-block btn-defaut' id='btn_update_one_Y_item_PropGuid_' xid='" + guid + "' onclick='return createUpdate_OneMatriceColumnClick(this)' PropName='" + propValue.PropName + "'><span>Mettre à jour</span></button>" +
        "<button class='btn btn-block btn-danger' id='btn_delete_one_prop_info_PropGuid_' onclick='return confirm_delete_one_prop_info(this)'><span>Supprimer</span></button>";
    }
    divPropContent += buttonItems;
    // end-- for buttons
    if (isCreate || isUpdateXValue) {
        divPropContent += "</div></div></div>";
    }
    divPropContent = replaceAll(divPropContent, 'PropGuid_', propValue.PropGuid);
    if (isCreate || isUpdateXValue) {
        $('#div_prop_matrix').append(divPropContent);
    } else {
        $('#' + divContentid).append(divPropContent);
    }
}

function confirmDeleteYItem(sender) {
    var isConf = confirm("Veuillez confirmer la suppression ! \r\nL'objet supprimé ne sera pas apparaître dans les nouveaux produits !!!");
    if (isConf) {
        js_DeleteYItem(sender);
    }
    return false;
}

function js_DeleteYItem(sender) {
    var senderid = $(sender).attr('id');
    var yguid = senderid.replace('btn_delete_one_Y_item_confirm_PropY_', '');
    var xguid = $(sender).attr('xid');
    var ptyId = getParameterByName('ptyId');
    var url = window.webservicePath + "/DeleteOneYValue";
    var oneAtr = Object();
    oneAtr.PropName = '';
    oneAtr.PropXGuid = xguid;
    oneAtr.PropOrder = 0;
    oneAtr.PropParentOrder = 0;
    oneAtr.PropSubOrder = 0;
    oneAtr.PropGuid = yguid;
    // this field is ptyId
    oneAtr.PropUnit = ptyId;
    oneAtr.PropDescription = '';
    if (ptyId) {
        if (prd_atts_validated) {
            var jsondata = JSON.stringify({ propertyName: oneAtr });
            setloadingmaskmessage('Veuillez patienter ...');
            loadingmaskShow();
            $.ajax({
                url: url,
                type: 'POST',
                contentType: 'application/json; charset=utf-8',
                data: jsondata,
                dataType: 'json',
                success: function (data) {
                    var jsdata = data.d;
                    var jsondata = jQuery.parseJSON(jsdata);
                    bootbox.hideAll();
                    setPropWithItems(jsondata);
                },
                error: function (data) {
                }
            });
        }
    } else {

    }
    return false;
}