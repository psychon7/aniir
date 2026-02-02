$(document).ready(initFuncZ);

function initFuncZ() {
    js_GetProductMatrixZ();
}

function js_GetProductMatrixZ() {
    var ptyId = getParameterByName('ptyId');
    var url = window.webservicePath + "/GetProductMatrixZPtyId";
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
                $.each(jsondata, setPropZ);
            },
            error: function (data) {
            }
        });
    }
}

function setPropZ(name, oneValue) {
    var propname = replaceAll(oneValue.PropName, ' ', '&nbsp;');
    var propdes = replaceAll(oneValue.PropDescription, ' ', '&nbsp;');
    var content = "<button class='btn btn-default' id='btn_" + oneValue.PropGuid + "' xid='" + oneValue.PropGuid + "' " + (IsModify() ? "" : "disabled") + " title='" + propdes + "' onclick='return getPropZForUpdate(this)'>" + propname + "</button>";
    $('#p_Z_content').append(content);
}


function getPropZForUpdate(sender) {
    var xid = sender ? $(sender).attr('xid') : '';
    var ptyId = getParameterByName('ptyId');
    if (ptyId && xid) {
        var url = window.webservicePath + "/GetPorpZById";
        $.ajax({
            url: url,
            type: 'POST',
            contentType: 'application/json; charset=utf-8',
            data: "{ptyId:'" + ptyId + "',propGuid:'" + xid + "'}",
            dataType: 'json',
            success: function (data) {
                var jsdata = data.d;
                var jsondata = jQuery.parseJSON(jsdata);
                addUpdateZValue(false, jsondata);
            },
            error: function (data) {
            }
        });
    }
    return false;
}


function addUpdateZValue(sender, updateZ) {
    var xid = sender ? $(sender).attr('xid') : (updateZ ? updateZ.PropGuid : '');
    var propname = '';
    var propunit = '';
    var propunitright = false;
    var propsuborder = 0;
    var proptype = 1;
    var propdescription = '';
    if (sender) {
        propname = $(sender).attr('PropName');
    }
    if (updateZ) {
        propname = updateZ.PropName;
        propunit = updateZ.PropUnit;
        propunitright = updateZ.PropIsUnitRightSide;
        propsuborder = updateZ.PropSubOrder;
        proptype = updateZ.PropType;
        propdescription = updateZ.PropDescription;
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
        "<option value='1' " + (updateZ && updateZ.PropType === "1" ? "selected" : "") + ">String</option>" +
        "<option value='2' " + (updateZ && updateZ.PropType === "2" ? "selected" : "") + ">Int</option>" +
        "<option value='3' " + (updateZ && updateZ.PropType === "3" ? "selected" : "") + ">Decimal</option>" +
        "<option value='4' " + (updateZ && updateZ.PropType === "4" ? "selected" : "") + ">DateTime</option>" +
        "<option value='5' " + (updateZ && updateZ.PropType === "5" ? "selected" : "") + ">Boolean</option></select></div>" +
        "<div class='col-sm-3'>" +
        "<input type='text' class='form-control' id='PropDescription_column_' name='PropDescription_column_'placeholder='Description' maxlength='200' value='" + propdescription + "'></div>" +
        "</div>" +
        "</div></div>";
    var btncontent = "<div class='new-modal-footer' style='text-align:center'>" +
        "<button data-bb-handler='cancel' onclick='javascript:bootbox.hideAll()'  type='button' class='btn btn-default pull-left'>Annuler</button>" +
        "<button data-bb-handler='cancel' onclick='return confirmDeleteZItem(this)' type='button' xid=" + xid + "  id='btn_delete_one_Z_item_confirm_column_' class='btn btn-danger' style='margin-left: auto;margin-right: auto; " + ((sender || updateZ) ? "" : "display:none;") + "'>Supprimer</button>" +
            "<button type='submit' id='btn_add_click_column_' class='btn btn-warning pull-right' xid='" + xid + "' onclick='return addUpdateZValueClick(this)'>" + ((sender || updateZ) ? "Mettre à jour" : "Ajouter") + "</button></div></form>";

    divcontent += btncontent;
    _columnCount--;
    var div_id = '_column_' + ((sender || updateZ) ? xid : _columnCount);
    divcontent = replaceAll(divcontent, '_column_', div_id);
    var title = (sender || updateZ) ? ("Mettre à jous la variable « <span style='color:red;'>" + propname + "</span> »") : "Ajouter une varaible";
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
        'background-color': '#f0ad4e'
    }); ;
    return false;
}

function addUpdateZValueClick(sender) {
    var senderid = $(sender).attr('id');
    var iscreate = sender ? false : true;
    var propname = senderid.replace('btn_add_click_column_', 'PropName_column_');
    var ptyId = getParameterByName('ptyId');
    var xguid = $(sender).attr('xid');
    var validated = $('#' + propname)[0].checkValidity();
    var url = window.webservicePath + "/CreateUpdateZValue";
    var oneAtr = js_get_matrix_column();
    if (validated && ptyId) {
        if (prd_atts_validated) {
            var jsondata = JSON.stringify({ ptyId: ptyId, propertyName: oneAtr });
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
                    $('#p_Z_content').empty();
                    $.each(jsondata, setPropZ);
                },
                error: function (data) {
                }
            });
        }
    }
    return false;
}

function confirmDeleteZItem(sender) {
    var isConf = confirm("Veuillez confirmer la suppression ! \r\nLa variable supprimée ne sera pas apparaître dans les nouveaux produits !!!");
    if (isConf) {
        js_DeleteZItem(sender);
    }
    return false;
}

function js_DeleteZItem(sender) {
    var senderid = $(sender).attr('id');
    var xguid = $(sender).attr('xid');
    var ptyId = getParameterByName('ptyId');
    var url = window.webservicePath + "/DeleteZValueByIdGuid";
    if (ptyId) {
        if (prd_atts_validated) {
            setloadingmaskmessage('Veuillez patienter ...');
            loadingmaskShow();
            $.ajax({
                url: url,
                type: 'POST',
                contentType: 'application/json; charset=utf-8',
                data: "{ptyId:'" + ptyId + "',propGuid:'" + xguid + "'}",
                dataType: 'json',
                success: function (data) {
                    var jsdata = data.d;
                    var jsondata = jQuery.parseJSON(jsdata);
                    bootbox.hideAll();
                    if (jsondata) {
                        $('#btn_' + xguid).remove();
                    }
                },
                error: function (data) {
                }
            });
        }
    } else {

    }
    return false;

}