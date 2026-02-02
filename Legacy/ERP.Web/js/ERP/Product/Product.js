$(document).ready(initFunc);

var disabled = _isView ? ' disabled ' : '';

function initFunc() {
    getProductTypes();
    js_LoadProduct();
    if (_isView) {
        ShowPleaseWait();
        loadProductImage();
        getSupplier();
        getAllCategories();
        get_all_drv_acc();
        setTimeout(hideAttrForView, 1000);
    }
}

var currentInstanceList = [];
function getProductTypes() {
    var elementId = 'PtyId';
    var url = window.webservicePath + "/GetProductTypes";
    var datastr = '{selectedType:0}';
    var budgetId = '#' + elementId;
    GeneralAjax_Select(url, budgetId, '', datastr, true);
}

// TODO: Global for One Product
var productProps = Object;
var productPropsGeneral = [];
var productPropsSep = [];

function prd_type_change(sender) {
    var ptyId = $(sender).val();
    if (ptyId && ptyId !== "0") {
        //        $('#div_produit_attr_content').show();
        //        $('#div_produit_attr_content_List').show();

        $('#div_attr_general').show();
        $('#div_all_prds_content').empty();
        $('#div_prd_general_attrs').empty();
        var url = window.webservicePath + "/GetOneProductTypeById";
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
                    set_General_PrdType_Fields(onepty);
                    setFieldValue('PtyName', onepty.PtyName);
                    setFieldValue('PrdSubName', onepty.PrdSubName);
                    setFieldValue('PtyDescription', onepty.PtyDescription);
                    var propNames = onepty.PropertyNames;
                    productProps = propNames;
                    productPropsGeneral = [];
                    productPropsSep = [];
                    $.each(propNames, function (ind, value) {
                        //setFieldValue(newname, value, true);
                        set_General_PrdType_Fields(value);
                    });
                    // set datetime picker
                    var allDtpicker = $('input[id^="DT_Picker_"]');
                    $.each(allDtpicker, function (idx, value) {
                        $(value).datepicker();
                    });
                } else {
                }
            },
            error: function (data) {
                var test = '';
            }
        });
    } else {
        $('#div_produit_attr_content').hide();
        $('#div_produit_attr_content_List').hide();
        $('#div_attr_general').hide();
    }
}

function loadProductTypeForModify() {
    var ptyId = $('#PtyId').val();
    if (ptyId && ptyId !== "0") {
        var url = window.webservicePath + "/GetOneProductTypeById";
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
                    var propNames = onepty.PropertyNames;
                    productProps = propNames;
                    productPropsGeneral = [];
                    productPropsSep = [];
                    $.each(propNames, function (ind, value) {
                        //setFieldValue(newname, value, true);
                        //set_General_PrdType_Fields(value);

                        var isGeneral = value.PropIsSameValue === true;
                        if (isGeneral) {
                            productPropsGeneral.push(value);
                        } else {
                            productPropsSep.push(value);
                        }
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

// product general information
function set_General_PrdType_Fields(propValue) {
    if (propValue.PropName !== undefined) {
        var isNormal = propValue.PropType === "1" ? "class='form-control'" : "";
        var isNumber = propValue.PropType === "2" ? "class='form-control' type='number'" : "";
        var isDecimal = propValue.PropType === "3" ? "class='form-control' type='number' step='0.1'" : "";
        var isDateTime = propValue.PropType === "4" ? "class='form-control' id='PropValue_DT_Picker_" + propValue.PropGuid + "'" : "";
        var isBoolean = propValue.PropType === "5" ? "class='form-control' type='checkbox'" : "";
        var valueType = isNormal + isNumber + isDecimal + isDateTime + isBoolean;
        var inputContent = '';
        var required = propValue.PropIsNullable ? '' : 'required ';
        var inputId = isDateTime ? "" : "id=PropValue_" + propValue.PropGuid;
        var inputvalue = " value='" + propValue.PropValue + "' ";
        if (propValue.PropUnit && !propValue.PropIsImage) {
            var unitRight = propValue.PropIsUnitRightSide ? "<span class='input-group-addon'>" + propValue.PropUnit + "</span>" : "";
            var unitLeft = !propValue.PropIsUnitRightSide ? "<span class='input-group-addon'>" + propValue.PropUnit + "</span>" : "";
            inputContent = "<div class='input-group'>" +
                unitLeft +
                "<input " + required + valueType + " " + inputId + inputvalue + disabled + " />" +
                unitRight +
                "</div>";
        } else {
            if (propValue.PropIsImage) {
                if (_isView) {
                    var download = "<button class='btn btn-inverse' propid='" + propValue.PropGuid + "' pitId='0' onclick='return downloadTheFile(this)' title='Télécharger'><i class='fa fa-arrow-circle-o-down'></i><span>Télécharger</span></button>";
                    var uploadfile = "<button class='btn btn-inverse' propid='" + propValue.PropGuid + "' pitId='0' onclick='return UploadProductFile(this)' title='Upload'><i class='fa fa-arrow-circle-o-up'></i><span>Upload</span></button>";
                    var deletefile = "<button class='btn btn-inverse' propid='" + propValue.PropGuid + "' pitId='0' onclick='return deleteTheFileConfirm(this)' title='Supprimer'><i class='fa fa-times'></i><span>Supprimer</span></button>";
                    inputContent = propValue.PropValue ? (download + uploadfile + deletefile) : uploadfile;
                } else {
                    var emptyValue = "<label  class='col-sm-12 control-label' style='text-align: left;' >L\'opération du fichier fonctionne après l'enregistrement !</label>";
                    inputContent = emptyValue;
                }
            } else {
                inputContent = "<input " + required + valueType + " " + inputId + inputvalue + disabled + " />";
            }
        }
        var normalContent = "<div class='form-horizontal'><div class='form-group'>" +
        "<label class='col-sm-1 control-label'>" + propValue.PropSubOrder + "</label>" +
            "<label class='col-sm-2 control-label'>" + propValue.PropName + "</label>" +
            "<div class='col-sm-9'>" +
            inputContent +
            "</div>" +
            "</div></div>";
        var isGeneral = propValue.PropIsSameValue === true;
        if (isGeneral) {
            productPropsGeneral.push(propValue);
            $('#div_prd_general_attrs').append(normalContent);
        } else {
            productPropsSep.push(propValue);
            //$('#div_prd_attrs').append(normalContent);
        }
    }
}

function AddNewProduct() {
    AddProductPopUp(null, true);
    return false;
}

// set product instance
var prdCount = -1;
function SetProductInProductDiv(sender, isNewPrd, prdInstance) {
    var allProps = isNewPrd ? productPropsSep : sender;
    var contentStart = "<div class='col-md-3' id='div_pit_content_propCountId_'>" +
        "<div class='box border inverse'>" +
        "<div class='box-title' style='text-align: center'>" +
    //        "<h4><i class='fa fa-bars'></i>" +
    //        "<span id='prd_item_title_ref'>Nouveau Produit</span></h4>" +
        "</div>" +
        "<div class='box-body center'>";
    var prdItemContent = "";

    // start item with product instance reference
    var pitRef = prdInstance ? prdInstance.PitRef : (allProps.PitRef ? allProps.PitRef : '');
    var pitRefField = "<div class='form-group'>" +
        "<label class='col-sm-4 control-label' style='font-size: 8pt; text-align: left;'>Référence</label>" +
        "<div class='col-sm-8'>" +
        "<input id='PitRef_propCountId_' class='form-control' name='PitRef_propCountId_' title='Référence' type='text' value='" + pitRef + "' " + disabled + "/>" +
        "</div></div>";
    prdItemContent = pitRefField;


    var setId = isNewPrd ? prdCount : (prdInstance ? prdInstance.PitId : sender.PrdGuid);
    $.each(allProps, function (name, value) {
        // each start
        var propName = value.PropName;
        var propValue = value.PropValue;
        var propDescription = value.PropDescription;
        var propGuid = value.PropGuid;
        propName = HTMLEncode(propName);
        propValue = HTMLEncode(propValue);
        propDescription = HTMLEncode(propDescription);
        var isNormal = value.PropType === "1" ? "class='form-control'" : "";
        var isNumber = value.PropType === "2" ? "class='form-control' type='number'" : "";
        var isDecimal = value.PropType === "3" ? "class='form-control' type='number' step='0.1'" : "";
        //var isDateTime = value.PropType === "4" ? "class='form-control' id='DT_Picker_Prd_Att" + propGuid + "'" : "";
        var isDateTime = value.PropType === "4" ? "class='form-control' " : "";
        var isBoolean = value.PropType === "5" ? "class='form-control' type='checkbox'" : "";
        var valueType = isNormal + isNumber + isDecimal + isDateTime + isBoolean;
        var inputContent = '';
        var required = value.PropIsNullable ? '' : 'required ';
        if (value.PropUnit) {
            var unitRight = value.PropIsUnitRightSide ? "<span class='input-group-addon'>" + value.PropUnit + "</span>" : "";
            var unitLeft = !value.PropIsUnitRightSide ? "<span class='input-group-addon'>" + value.PropUnit + "</span>" : "";
            inputContent = "<div class='input-group'>" +
                unitLeft +
                "<input " + required + valueType + " propid='" + propGuid + "' id='PropValue_propCountId_' name='PropValue_propCountId_' value='" + propValue + "' title='" + propDescription + "' " + disabled + "/>" +
                unitRight +
                "</div>";
        } else {
            if (value.PropIsImage) {
                var download = "<button class='btn btn-inverse' propid='" + propGuid + "' pitId='" + setId + "' onclick='return downloadTheFile(this)' title='Télécharger'><i class='fa fa-arrow-circle-o-down'></i></button>";
                var uploadfile = "<button class='btn btn-inverse' propid='" + propGuid + "' pitId='" + setId + "' onclick='return UploadProductFile(this)' title='Upload'><i class='fa fa-arrow-circle-o-up'></i></button>";
                var deletefile = "<button class='btn btn-inverse' propid='" + propGuid + "' pitId='" + setId + "' onclick='return deleteTheFileConfirm(this)' title='Supprimer'><i class='fa fa-times'></i></button>";
                inputContent = value.PropValue ? (download + uploadfile + deletefile) : uploadfile;
            } else {
                inputContent = "<input " + required + valueType + " propid='" + propGuid + "' id='PropValue_propCountId_' name='PropValue_propCountId_' value='" + propValue + "' title='" + propDescription + "' " + disabled + "/>";
            }
        }

        if (isDateTime) {
            inputContent = replaceAll(inputContent, 'PropValue_', 'PropValue_DT_Picker_');
        }

        var normalContent =
        "<div class='form-group'>" +
            "<label class='col-sm-4 control-label' style='font-size: 8pt; text-align: left;'>" + value.PropSubOrder + " - " + value.PropName + "</label>" +
            "<div class='col-sm-8'>" +
            inputContent +
            "</div></div>";
        prdItemContent += normalContent;

        // each end
    });

    // add purchase price
    var purchasePrice = prdInstance ? prdInstance.PitPurchasePrice : (allProps.PitPurchasePrice ? allProps.PitPurchasePrice : '');
    var price = prdInstance ? prdInstance.PitPrice : (allProps.PitPrice ? allProps.PitPrice : '');
    var description = prdInstance ? prdInstance.PitDescription : (allProps.PitDescription ? allProps.PitDescription : '');
    var purchasePriceContent = "<div class='form-group'>" +
        "<label class='col-sm-4 control-label' style='font-size: 8pt; text-align: left;'>Prix d'achat</label>" +
        "<div class='col-sm-8'>" +
        "<div class='input-group'><span class='input-group-addon'>€</span>" +
        "<input id='PitPurchasePrice_propCountId_' class='form-control' name='PitPurchasePrice_propCountId_' title='Prix d&#39achat' type='number' step='0.1' value='" + purchasePrice + "' " + disabled + "/>" +
        "</div></div></div>";
    // add price
    var priceContent = "<div class='form-group'>" +
        "<label class='col-sm-4 control-label' style='font-size: 8pt; text-align: left;'>Prix de vente</label>" +
        "<div class='col-sm-8'><div class='input-group'><span class='input-group-addon'>€</span>" +
        "<input id='PitPrice_propCountId_' class='form-control' name='PitPrice_propCountId_' title='Prix de vente'  type='number' step='0.1' value='" + price + "' " + disabled + "/>" +
        "</div></div></div>";
    // add description
    var desContent = "<div class='form-group'>" +
        "<label class='col-sm-4 control-label' style='font-size: 8pt; text-align: left;'>Description</label>" +
        "<div class='col-sm-8'>" +
        "<textarea rows='3' cols='5' id='PitDescription_propCountId_' name='PitDescription_propCountId_' class='form-control' " + disabled + "></textarea></div></div>";


    prdItemContent += purchasePriceContent;
    prdItemContent += priceContent;
    prdItemContent += desContent;
    if (prdInstance && prdInstance.PitImages) {
        // add product instance images
        var images = "<div class='form-group' >";
        $.each(prdInstance.PitImages, function (imgIdex, imgValue) {
            var imgContent = "<div class='col-md-12 item' id='div_one_pti_" + imgValue.Key + "'><div class='filter-content'  style='height: 200px !important'>" +
                            "<img src='../../Services/ShowOutSiteImage.ashx?file=" + imgValue.Value + "' alt=''   class='img-responsive'  style='width: 100%' />" +
                            "<div class='hover-content'><h4>" + imgValue.Key2 + " | " + imgValue.Value2 + "</h4>" +
                            "<a class='btn btn-inverse hover-link' ptiId='" + imgValue.Key + "' onclick='deleteImageClick(this)'>" +
                            "<i class='fa fa-times fa-1x'></i></a>" +
                            "<a class='btn btn-inverse hover-link' ptiId='" + imgValue.Key + "' pitId='" + imgValue.Key3 + "' sendtype='3' onclick='AddModifyImage(this)'>" +
                            "<i class='fa fa-edit fa-1x'></i></a>" +
                            "<a class='btn btn-inverse hover-link colorbox-button'href='../../Services/ShowOutSiteImage.ashx?file=" + imgValue.Value + "' title='" + imgValue.Key2 + " | " + imgValue.Value2 + "'>" +
                            "<i class='fa fa-search-plus fa-1x'></i></a>" +
                            "</div></div></div>";

            images += imgContent;
        });
        images += "</div>";
        prdItemContent += images;
    }

    var addupdate = isNewPrd ? 'Ajouter' : 'Mettre à jour';
    var btnUpdate = "<button class='btn btn-block btn-inverse' pitid='propCountId_' id='btn_addupdate_one_product_propCountId_' name='btn_addupdate_one_product_propCountId_' onclick='return setPit2ModeUpdate(this)'><span>Mettre à jour</span></button>";
    var btnUpdateContent = _isView ? btnUpdate : "";
    var btnPitImage = "<button class='btn btn-block btn-inverse' pitid='propCountId_' id='btn_addupdate_one_product_propCountId_' pitId='propCountId_' name='btn_addupdate_one_product_propCountId_' sendtype='3'  onclick='return AddModifyImage(this)'><span>Ajouter une Photo</span></button>";
    var btnPitImageContent = _isView ? btnPitImage : "";
    var contentEnd = btnPitImageContent + btnUpdateContent +
            "<button class='btn btn-block btn-inverse' pitid='propCountId_' id='btn_delete_one_product_propCountId_' name='btn_delete_one_product_propCountId_' onclick='return confirm_delete_one_PIT(this)'><span>Supprimer</span></button>" +
            "</div>" +
            "</div>" +
            "</div>";

    var allcontent = contentStart + prdItemContent + contentEnd;

    allcontent = replaceAll(allcontent, 'propCountId_', setId);
    $('#div_all_prds_content').append(allcontent);
    SetDateTimePicker('div_all_prds_content');
    try {
        $('#PitDescription_' + setId)[0].value = description;
    } catch (e) {
        var testError = '';
    }

    prdCount--;
}

function setPit2ModeUpdate(sender) {
    var pitid = $(sender).attr('pitid');
    var ptyid = $('#PtyId').val();
    var prdid = getParameterByName('prdId');
    if (pitid > 0) {
        var url = window.webservicePath + "/GetProductInstanceForUpdate";
        $.ajax({
            type: "POST",
            url: url,
            contentType: "application/json; charset=utf-8",
            data: "{prdId:'" + prdid + "',pitId:" + pitid + ",ptyId:" + ptyid + "}",
            dataType: "json",
            success: function (data) {
                var jsdata = data.d;
                var jsondata = jQuery.parseJSON(jsdata);
                if (jsondata !== -1) {
                    AddProductPopUp(jsondata.PitAllInfo, false, jsondata);
                } else {
                }
            },
            error: function (data) {
                var test = '';
            }
        });
    }
    return false;
}

////// todo: new set product
function AddProductPopUp(sender, isNewPrd, onePit) {
    var allProps = isNewPrd ? productPropsSep : sender;
    var contentStart = "<div class='row'><div class='col-md-12' id='div_pit_content_propCountId_'>" +
        "<div class='box-body center'><form class='form-horizontal'>";
    var prdItemContent = "";

    var setId = isNewPrd ? prdCount : (onePit ? '_____' + onePit.PitId : sender.PrdGuid);


    var pitref = onePit ? onePit.PitRef : (curentProduct ? curentProduct.PrdRef : '');
    // start item with product instance reference

    var prdreference = $('#PrdRef').val();
    var pitPropref = pitref.replace(prdreference, "");
    var pitRefField = "<div class='form-group'>" +
        "<label class='col-sm-3 control-label' style='font-size: 8pt; text-align: left;'>Référence</label>" +
        "<div class='col-sm-3'><div class='input-group'>" +
        "<span class='input-group-addon'>" + prdreference + "</span>" +
        "<input id='PitRef_propCountId_' class='form-control' name='PitRef_propCountId_' title='Référence' type='text' value='" + pitPropref + "' />" +
        "</div>" +
        "</div>" +
        "<div class='col-sm-6'></div>" +
        "</div>";
    prdItemContent = pitRefField;
    var purchasePriceContent =
        "<label class='col-sm-3 control-label' style='font-size: 8pt; text-align: left;'>Prix d'achat</label>" +
            "<div class='col-sm-3'>" +
            "<div class='input-group'>" +
            "<span class='input-group-addon'>€</span><input id='PitPurchasePrice_propCountId_' class='form-control' name='PitPurchasePrice_propCountId_' title='Prix d&#39achat' type='number' value='" + (onePit ? onePit.PitPurchasePrice : "") + "' step='0.1'/>" +
            "</div>" +
            "</div>";
    // add price
    var priceContent = "<label class='col-sm-3 control-label' style='font-size: 8pt; text-align: left;'>Prix de vente</label>" +
        "<div class='col-sm-3'>" +
        "<div class='input-group'>" +
        "<span class='input-group-addon'>€</span><input id='PitPrice_propCountId_' class='form-control' name='PitPrice_propCountId_' title='Prix de vente'  value='" + (onePit ? onePit.PitPrice : "") + "'   type='number' step='0.1'/>" +
        "</div>" +
        "</div>";
    // add inventory threshold
    var insContent =
        "<label class='col-sm-3 control-label' style='font-size: 8pt; text-align: left;'>Seuil de rupture de stock</label>" +
        "<div class='col-sm-3'>" +
            "<input id='PitInventoryThreshold_propCountId_' class='form-control' name='PitInventoryThreshold_propCountId_' title='Seuil de rupture de stock'  value='" + (onePit ? onePit.PitInventoryThreshold : "0") + "'   type='number' step='1'/>" +
        "</div>";
    // add description
    var desContent = "<label class='col-sm-3 control-label' style='font-size: 8pt; text-align: left;'>Description</label>" +
        "<div class='col-sm-3'>" +
        "<textarea rows='3' cols='5' id='PitDescription_propCountId_' name='PitDescription_propCountId_' class='form-control'></textarea>" +
        "</div>";

    prdItemContent += "<div class='form-group'>";
    prdItemContent += purchasePriceContent;
    prdItemContent += insContent;
    prdItemContent += "</div>";
    prdItemContent += "<div class='form-group'>";
    prdItemContent += priceContent;
    prdItemContent += desContent;
    prdItemContent += "</div>";

    //prdItemContent += "<div class='form-group'>";
    var cellcount = 0;
    var textarea2display = [];
    $.each(allProps, function (name, value) {
        // each start

        var propName = value.PropName;
        var propValue = value.PropValue;
        var propDescription = value.PropDescription;
        var propGuid = value.PropGuid;
        propName = HTMLEncode(propName);
        propValue = HTMLEncode(propValue);
        propDescription = HTMLEncode(propDescription);
        var isNormal = value.PropType === "1" ? "class='form-control'" : "";
        var isNumber = value.PropType === "2" ? "class='form-control' type='number'" : "";
        var isDecimal = value.PropType === "3" ? "class='form-control' type='number' step='0.1'" : "";
        //var isDateTime = value.PropType === "4" ? "class='form-control' id='DT_Picker_Prd_Att" + propGuid + "'" : "";
        var isDateTime = value.PropType === "4" ? "class='form-control' " : "";
        var isBoolean = value.PropType === "5" ? "class='form-control' type='checkbox'" : "";
        var valueType = isNormal + isNumber + isDecimal + isDateTime + isBoolean;
        var inputContent = '';
        var required = value.PropIsNullable ? '' : 'required ';
        if (value.PropUnit) {
            var unitRight = value.PropIsUnitRightSide ? "<span class='input-group-addon'>" + value.PropUnit + "</span>" : "";
            var unitLeft = !value.PropIsUnitRightSide ? "<span class='input-group-addon'>" + value.PropUnit + "</span>" : "";
            if (value.PropType === "1") {
                inputContent = "<div class='input-group'>" +
                    unitLeft +
                    "<textarea " + required + valueType + " propid='" + propGuid + "' id='PropValue_propCountId_' name='PropValue_propCountId_' value='" + propValue + "' title='" + propDescription + "'></textarea>" +
                    unitRight +
                    "</div>";
                textarea2display.push(value);
            } else {
                inputContent = "<div class='input-group'>" +
                    unitLeft +
                    "<input " + required + valueType + " propid='" + propGuid + "' id='PropValue_propCountId_' name='PropValue_propCountId_' value='" + propValue + "' title='" + propDescription + "'/>" +
                    unitRight +
                    "</div>";
            }
        } else {
            if (value.PropIsImage) {
                var emptyValue = "<label  class='col-sm-12 control-label' style='text-align: left;' >L\'opération du fichier fonctionne après l'enregistrement !</label>";
                var download = "<button class='btn btn-inverse' propid='" + propGuid + "' pitId='" + setId + "' onclick='return downloadTheFile(this)' title='Télécharger'><i class='fa fa-arrow-circle-o-down'></i></button>";
                inputContent = value.PropValue ? (download) : emptyValue;
            } else {
                if (value.PropType === "1") {
                    inputContent = "<textarea " + required + valueType + " propid='" + propGuid + "' id='PropValue_propCountId_' name='PropValue_propCountId_' value='" + propValue + "' title='" + propDescription + "'></textarea>";
                    textarea2display.push(value);
                } else {
                    inputContent = "<input " + required + valueType + " propid='" + propGuid + "' id='PropValue_propCountId_' name='PropValue_propCountId_' value='" + propValue + "' title='" + propDescription + "'/>";
                }
            }
        }

        if (isDateTime) {
            inputContent = replaceAll(inputContent, 'PropValue_', 'PropValue_DT_Picker_');
        }

        var normalContent =
            "<label class='col-sm-3 control-label' style='font-size: 8pt; text-align: left;'>" + value.PropSubOrder + " - " + value.PropName + "</label>" +
                "<div class='col-sm-3'>" +
                inputContent +
                "</div>";

        if (cellcount % 2 === 0) {
            prdItemContent += "<div class='form-group'>";
            prdItemContent += normalContent;
        } else {
            prdItemContent += normalContent;
            prdItemContent += "</div>";
        }
        //prdItemContent += normalContent;

        cellcount++;
        // each end
    });
    // add purchase price

    prdItemContent += "</div>";

    var addupdate = onePit ? 'Mettre à jour' : 'Ajouter';
    var description = onePit ? onePit.PitDescription : curentProduct.PrdDescription;

    var contentEnd = "<div class='modal-body center'>" +
        "<div class='form-group' id='div_btns_add_close_addupdate_product_PropCountId_'>" +
        "<button class='btn  btn-default bootbox-close-button' pitid='propCountId_' id='btn_close_addupdateProduct_propCountId_'><span>Annuler</span></button>" +
        "<button type='submit' class='btn btn-inverse' pitid='propCountId_' id='btn_addupdate_one_product_propCountId_' name='btn_addupdate_one_product_propCountId_' onclick='return addUpdateProduct(this)'><span>" + addupdate + "</span></button>" +
        "</div>" +
        "</div>" +
        "</form>" +
        "</div>" +
        "</div>" +
        "</div>";

    var allcontent = contentStart + prdItemContent + contentEnd;

    allcontent = replaceAll(allcontent, 'propCountId_', setId);
    //$('#div_all_prds_content').append(allcontent);
    prdCount--;

    var title = onePit ? "Mis à jour ce produit" : "NOUVEAU PRODUIT";
    bootbox.dialog({
        title: title,
        message: allcontent
    }).find('.modal-dialog').css({
        'width': '80%'
    }).find('.modal-content').css({
        'margin-top': function () {
            var w = $(window).height();
            var b = $(".modal-dialog").height();
            // should not be (w-h)/2
            var h = (w - b) * 0.15;
            return h + "px";
        }
    }).find('.modal-header').css({
        //'background-color': '#a696ce',
        'background': 'url(../../img/menu_005_bg.jpg) repeat-x',
        'text-align': 'center',
        'color': '#C0C0C0'
    });

    var divid = 'div_pit_content_propCountId_'.replace('propCountId_', setId);
    SetDateTimePicker(divid);
    // set textarea
    try {
        //$('#PitDescription_' + setId)[0].value = description;
        //$('#PitDescription_' + setId).innerText = description;
        document.getElementById('PitDescription_' + setId).value = description;
    } catch (e) {
        var testError = '';
    }

    if (textarea2display.length > 0) {
        var propFieldIds = 'PropValue_' + setId;
        var allPropFieldsTextarea = $('textarea[id^="' + propFieldIds + '"]');
        //console.log(allPropFieldsTextarea);
        $.each(allPropFieldsTextarea, function(name, value) {
            var propId = $(value).attr('propid');
            //console.log(propId);
            var propvalue = searchFieldValueInArray(textarea2display, 'PropGuid', propId);
            if (!jQuery.isEmptyObject(propvalue)) {
                $(value).html(propvalue.PropValue);
            }
        });
    }
    //console.log(textarea2display);
    return false;
}

function confirm_delete_one_PIT(sender) {
    var pitid = $(sender).attr('pitid');
    var title = "ATTENTION";
    var content = "<div class='box'><div class='box-body' style='height: 100px;'>" +
        "<div class='form-horizontal'>" +
        "<div class='col-md-12'>" +
        "<div class='form-group'>" +
        "<div class='col-sm-12' style='text-align:center;font-size: 18pt;'>Veuillez confirmer la suppression ! " +
        "<br/>La suppression est irrécupérable, veuillez confirmer !!!</div></div></div></div></div></div>"
        + "<div class='modal-footer center'>" +
        "<button type='button' class='btn btn-default' onclick='closeDialog()'>Annuler</button>" +
        "<button type='button' class='btn btn-inverse' pitid='" + pitid + "' onclick='return delete_one_PIT(this);'>SUPPRIMER</button></div>";
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
        //'background-color': '#a696ce',
        'background': 'url(../../img/menu_005_bg.jpg) repeat-x',
        'text-align': 'center',
        'color': '#C0C0C0'
    });
    return false;
}

function delete_one_PIT(sender) {
    var pitid = $(sender).attr('pitid');
    var prdId = getParameterByName('prdId');
    var url = window.webservicePath + "/DeleteProductInstance";
    if (pitid > 0) {
        // 如果是，说明已经存在product，从数据库删除
        $.ajax({
            url: url,
            type: 'POST',
            contentType: 'application/json; charset=utf-8',
            data: "{prdId:'" + prdId + "',pitId:" + pitid + "}",
            dataType: 'json',
            success: function (data) {
                var deleted = data.d;
                if (deleted) {
                    RemovePITContent(pitid);
                } else {
                    alert('ERROR : DATA IN USE');
                }
            },
            error: function (data) {
                alert(data.responseText);
            }
        });
    } else {
        RemovePITContent(pitid);
    }
}

function RemovePITContent(pitId) {
    //    if (currentSmd === 'img') {
    //        $('#div_pit_content_' + pitId).remove();
    //    } else {
    $('#div_pit_content_' + pitId).remove();
    var removepit = searchFieldValueInArray(currentInstanceList, 'PitId', pitId * 1);
    if (!jQuery.isEmptyObject(removepit)) {
        currentInstanceList = $.grep(currentInstanceList, function (e) {
            return e.PitId !== pitId * 1;
        });
        setPitList(currentInstanceList);
        $('#div_all_prds_content').empty();
        $.each(currentInstanceList, function (ind, value) {
            setProductInstance(value);
        });
    }
    //}
}

function addUpdateProduct(sender) {
    var prdId = getParameterByName('prdId');
    var pitid = $(sender).attr('pitid');
    var allDivId = 'div_pit_content_' + pitid;
    var allRequiredOK = CheckRequiredFieldInOneDiv(allDivId);
    if (allRequiredOK) {
        var oneProduct2Add = JSON.parse(JSON.stringify(productPropsSep));
        var propFieldIds = 'PropValue_' + pitid;
        var allPropFields = $('input[id^="' + propFieldIds + '"]');
        $.each(oneProduct2Add, function (name, value) {
            var guidToCheck = value.PropGuid;
            $.each(allPropFields, function (index, htmlFiled) {
                var propId = $(htmlFiled).attr('propid');
                if (guidToCheck === propId) {
                    value.PropValue = $(htmlFiled).val();
                }
            });
        });
        propFieldIds = 'PropValue_DT_Picker_' + pitid;
        allPropFields = $('input[id^="' + propFieldIds + '"]');
        $.each(oneProduct2Add, function (name, value) {
            var guidToCheck = value.PropGuid;
            $.each(allPropFields, function (index, htmlFiled) {
                var propId = $(htmlFiled).attr('propid');
                if (guidToCheck === propId) {
                    value.PropValue = $(htmlFiled).val();
                }
            });
        });
        propFieldIds = 'PropValue_' + pitid;
        var allPropFieldsTextarea = $('textarea[id^="' + propFieldIds + '"]');
        $.each(oneProduct2Add, function (name, value) {
            var guidToCheck = value.PropGuid;
            $.each(allPropFieldsTextarea, function (index, htmlFiled) {
                var propId = $(htmlFiled).attr('propid');
                if (guidToCheck === propId) {
                    value.PropValue = $(htmlFiled).val();
                }
            });
        });

        oneProduct2Add.PitPurchasePrice = $('#PitPurchasePrice_' + pitid).val();
        oneProduct2Add.PitPrice = $('#PitPrice_' + pitid).val();
        oneProduct2Add.PitDescription = $('#PitDescription_' + pitid).val();
        oneProduct2Add.PitRef = $('#PrdRef').val() + $('#PitRef_' + pitid).val();
        oneProduct2Add.PrdGuid = pitid;
        //if (pitid.indexOf('_____') === 0) {
        if (true) {
            // 在view模式下直接更新此instance, 同时重置所有 product instance
            var newpitid = pitid.replace('_____', "");
            oneProduct2Add.PitId = newpitid;
            oneProduct2Add.FId = getParameterByName('prdId');
            //var url = window.webservicePath + "/UpdateProductInstance";
            var url = window.webservicePath + "/CreateUpdateProductInstance";
            var prdInt = {};
            prdInt.PrdId = 0;
            prdInt.FId = oneProduct2Add.FId;
            prdInt.PtyId = $('#PtyId option:selected').val() * 1;
            prdInt.PitId = oneProduct2Add.PitId;
            prdInt.PitDescription = oneProduct2Add.PitDescription;
            prdInt.PitRef = oneProduct2Add.PitRef;
            prdInt.PitPrice = oneProduct2Add.PitPrice;
            prdInt.PitRef = oneProduct2Add.PitRef;
            prdInt.PitPurchasePrice = oneProduct2Add.PitPurchasePrice;

            var PitInventoryThreshold = $('#PitInventoryThreshold_' + pitid).val();
            PitInventoryThreshold = isNaN(PitInventoryThreshold) ? 0 : (PitInventoryThreshold * 1);
            prdInt.PitInventoryThreshold = PitInventoryThreshold;



            var PitAllInfo = [];
            $.each(oneProduct2Add, function (index, propvalue) {
                var PropertyValue = {};
                PropertyValue.PropGuid = propvalue.PropGuid;
                PropertyValue.PropValue = propvalue.PropValue;
                PitAllInfo.push(PropertyValue);

            });
            prdInt.PitAllInfo = PitAllInfo;

            var jsondata = JSON.stringify({ prdInstance: prdInt });
            $.ajax({
                type: "POST",
                url: url,
                contentType: "application/json; charset=utf-8",
                data: jsondata,
                dataType: "json",
                success: function (data) {
                    var jsdata = data.d;
                    var jsondata = jQuery.parseJSON(jsdata);
                    if (jsondata !== -1) {
                        var InstanceList = jsondata;
                        $('#div_all_prds_content').empty();
                        //                        setPitList(InstanceList);
                        //                        $.each(InstanceList, function (ind, value) {
                        //                            setProductInstance(value);
                        //                        });
                        currentInstanceList = [];
                        currentInstanceList = InstanceList;
                        ShowProductMode(InstanceList);
                    } else {
                    }
                    var btnCloseAddupdateProductPropCountId = 'btn_close_addupdateProduct_' + pitid;
                    $('#' + btnCloseAddupdateProductPropCountId).click();
                },
                error: function (data) {
                    alert(data.responseText);
                }
            });

        } else {
            SetProductInProductDiv(oneProduct2Add, false);
            var btnCloseAddupdateProductPropCountId = 'btn_close_addupdateProduct_' + pitid;
            $('#' + btnCloseAddupdateProductPropCountId).click();
        }



        return false;
    }
    //return false;
}

function SetDateTimePicker(divId) {
    var allDps = $('div[id="' + divId + '"] :input[id^="PropValue_DT_Picker_"]');
    $.each(allDps, function (idx, value) {
        $(value).datepicker();
    });
}

function js_create_update_product() {
    var checkOK = CheckRequiredFieldInOneDiv('div_product_page');
    if (checkOK) {
        ShowPleaseWait();
        var FId = getParameterByName('prdId');
        var PtyId = $('#PtyId option:selected').val();
        var PrdRef = $('#PrdRef').val();
        var PrdRef = $('#PrdRef').val();
        var PrdName = $('#PrdName').val();
        var PrdSubName = $('#PrdSubName').val();
        var PrdDescription = $('#PrdDescription').val();
        var PrdPurchasePrice = $('#PrdPurchasePrice').val();
        var PrdPrice = $('#PrdPrice').val();
        var generalInfoList = getProductGeneralInfo();
        var allPrdInstance = getProductsInstanceInPage();
        var onePrd = {};
        onePrd.FId = FId;
        onePrd.PrdId = 0;
        onePrd.SocId = 0;
        onePrd.PtyId = PtyId;
        onePrd.PrdRef = PrdRef;
        onePrd.PrdName = PrdName;
        onePrd.PrdSubName = PrdSubName;
        onePrd.PrdDescription = PrdDescription;
        onePrd.PrdPurchasePrice = PrdPurchasePrice;
        onePrd.PrdPrice = PrdPrice;
        onePrd.PrdGeneralInfoList = generalInfoList;
        onePrd.InstanceList = allPrdInstance;
        onePrd.PrdInsideDiameter = $('#PrdInsideDiameter').val() * 1;
        onePrd.PrdOutsideDiameter = $('#PrdOutsideDiameter').val() * 1;
        onePrd.PrdLength = $('#PrdLength').val() * 1;
        onePrd.PrdWidth = $('#PrdWidth').val() * 1;
        onePrd.PrdHeight = $('#PrdHeight').val() * 1;
        onePrd.PrdHoleSize = $('#PrdHoleSize').val() * 1;
        onePrd.PrdDepth = $('#PrdDepth').val() * 1;
        onePrd.PrdWeight = $('#PrdWeight').val() * 1;
        onePrd.PrdUnitLength = $('#PrdUnitLength').val() * 1;
        onePrd.PrdUnitWidth = $('#PrdUnitWidth').val() * 1;
        onePrd.PrdUnitHeight = $('#PrdUnitHeight').val() * 1;
        onePrd.PrdUnitWeight = $('#PrdUnitWeight').val() * 1;
        onePrd.PrdQuantityEachCarton = $('#PrdQuantityEachCarton').val() * 1;
        onePrd.PrdCartonLength = $('#PrdCartonLength').val() * 1;
        onePrd.PrdCartonWidth = $('#PrdCartonWidth').val() * 1;
        onePrd.PrdCartonHeight = $('#PrdCartonHeight').val() * 1;
        onePrd.PrdCartonWeight = $('#PrdCartonWeight').val() * 1;

        onePrd.PrdHoleLength = $('#PrdHoleLength').val() * 1;
        onePrd.PrdHoleWidth = $('#PrdHoleWidth').val() * 1;
        onePrd.PrdOutsideLength = $('#PrdOutsideLength').val() * 1;
        onePrd.PrdOutsideWidth = $('#PrdOutsideWidth').val() * 1;
        onePrd.PrdOutsideHeight = $('#PrdOutsideHeight').val() * 1;


        var jsondata = JSON.stringify({ oneProduct: onePrd });
        $.ajax({
            url: 'Product.aspx/CreateUpdateProduct',
            type: 'POST',
            contentType: 'application/json; charset=utf-8',
            data: jsondata,
            dataType: 'json',
            success: function (data) {
                var prdId = data.d;
                var url = window.location.href.split('?')[0];
                var newUrl = url + '?prdId=' + prdId + '&mode=view';
                document.location.href = newUrl;
            },
            error: function (data) {
            }
        });
        return false;
    } else {
        //MsgErrorPopUp('ATTENTION','Veuillez remplir les champs obligatoires !');
        return false;
    }
}

function getProductGeneralInfo() {
    var allPropsContent = $('div[id="div_prd_general_attrs"] :input[id^="PropValue_"]');
    var allProps = [];
    $.each(allPropsContent, function (name, value) {
        var ptyId = $(value).attr('id').replace('PropValue_', '');
        var propvalue = $(value).val();
        var pty = {};
        pty.PropGuid = ptyId;
        pty.PropValue = propvalue;
        allProps.push(pty);
    });
    return allProps;
}

function getProductsInstanceInPage() {
    var allPrdContents = $('div[id="div_all_prds_content"] div[id^="div_pit_content_"]');
    var allPrdInstance = [];
    $.each(allPrdContents, function (name, value) {
        try {
            var pitId = $(value).attr('id').replace('div_pit_content_', '');
            var aPrd = {}; // product instrance
            aPrd.PitId = pitId;
            aPrd.PtyId = $('#PtyId').val();
            aPrd.PitPrice = $('#PitPrice_' + pitId).val();
            aPrd.PitPurchasePrice = $('#PitPurchasePrice_' + pitId).val();
            aPrd.PitDescription = $('#PitDescription_' + pitId).val();
            aPrd.PitRef = $('#PitRef_' + pitId).val();
            var prdInfo = [];
            var allInfos = $('input[id="PropValue_' + pitId + '"]');
            $.each(allInfos, function (indInfo, valueInfo) {
                var propId = $(valueInfo).attr('propid');
                var propvalue = $(valueInfo).val();
                var keyvalue = {};
                keyvalue.PropGuid = propId;
                keyvalue.PropValue = propvalue;
                prdInfo.push(keyvalue);
            });
            var allDateTime = $('input[id="PropValue_DT_Picker_' + pitId + '"]');
            $.each(allDateTime, function (indInfo, valueInfo) {
                var propId = $(valueInfo).attr('propid');
                var propvalue = $(valueInfo).val();
                var keyvalue = {};
                keyvalue.PropGuid = propId;
                keyvalue.PropValue = propvalue;
                prdInfo.push(keyvalue);
            });
            aPrd.PitAllInfo = prdInfo;
            allPrdInstance.push(aPrd);
        } catch (e) {
        }
    });
    return allPrdInstance;
}

var curentProduct = {};
function js_LoadProduct() {
    var prdId = getParameterByName('prdId');
    if (prdId) {
        var url = window.webservicePath + "/LoadProductById";
        $.ajax({
            type: "POST",
            url: url,
            contentType: "application/json; charset=utf-8",
            data: "{prdId:'" + prdId + "'}",
            dataType: "json",
            success: function (data) {
                var jsdata = data.d;
                var jsondata = jQuery.parseJSON(jsdata);
                if (jsondata !== -1) {
                    curentProduct = jsondata;
                    $('#PtyId').val(jsondata.PtyId);
                    $('#PrdName').val(jsondata.PrdName);
                    $('#PrdSubName').val(jsondata.PrdSubName);
                    $('#PtyDescription').text(jsondata.PrdName);
                    $('#PrdName_List').val(jsondata.PrdName);
                    $('#PtyDescription_List').text(jsondata.PrdName);
                    $('#PrdRef').val(jsondata.PrdRef);

                    var newtitle = jsondata.PrdRef + "-" + jsondata.PrdName;
                    document.title = newtitle;

                    $('#PrdPrice').val(jsondata.PrdPrice);
                    $('#PrdPurchasePrice').val(jsondata.PrdPurchasePrice);
                    $('#PrdDescription').val(jsondata.PrdDescription);
                    $('#PrdCode').val(jsondata.PrdCode);
                    ///// dimeters
                    $('#PrdInsideDiameter').val(jsondata.PrdInsideDiameter);
                    $('#PrdOutsideDiameter').val(jsondata.PrdOutsideDiameter);
                    $('#PrdLength').val(jsondata.PrdLength);
                    $('#PrdWidth').val(jsondata.PrdWidth);
                    $('#PrdHeight').val(jsondata.PrdHeight);
                    $('#PrdHoleSize').val(jsondata.PrdHoleSize);
                    $('#PrdDepth').val(jsondata.PrdDepth);
                    $('#PrdWeight').val(jsondata.PrdWeight);
                    $('#PrdUnitLength').val(jsondata.PrdUnitLength);
                    $('#PrdUnitWidth').val(jsondata.PrdUnitWidth);
                    $('#PrdUnitHeight').val(jsondata.PrdUnitHeight);
                    $('#PrdUnitWeight').val(jsondata.PrdUnitWeight);
                    $('#PrdQuantityEachCarton').val(jsondata.PrdQuantityEachCarton);
                    $('#PrdCartonLength').val(jsondata.PrdCartonLength);
                    $('#PrdCartonWidth').val(jsondata.PrdCartonWidth);
                    $('#PrdCartonHeight').val(jsondata.PrdCartonHeight);
                    $('#PrdCartonWeight').val(jsondata.PrdCartonWeight);


                    $('#PrdHoleLength').val(jsondata.PrdHoleLength);
                    $('#PrdHoleWidth').val(jsondata.PrdHoleWidth);
                    $('#PrdOutsideLength').val(jsondata.PrdOutsideLength);
                    $('#PrdOutsideWidth').val(jsondata.PrdOutsideWidth);
                    $('#PrdOutsideHeight').val(jsondata.PrdOutsideHeight);


                    if (_isView) {
                        $('#PtyId').prop('disabled', true);
                        $('#PrdName').prop('disabled', true);
                        $('#PrdSubName').prop('disabled', true);
                        $('#PrdRef').prop('disabled', true);
                        $('#PrdPrice').prop('disabled', true);
                        $('#PrdPurchasePrice').prop('disabled', true);
                        $('#PrdDescription').prop('disabled', true);
                        // diameters
                        $('#PrdInsideDiameter').prop('disabled', true);
                        $('#PrdOutsideDiameter').prop('disabled', true);
                        $('#PrdLength').prop('disabled', true);
                        $('#PrdWidth').prop('disabled', true);
                        $('#PrdHeight').prop('disabled', true);
                        $('#PrdHoleSize').prop('disabled', true);
                        $('#PrdDepth').prop('disabled', true);
                        $('#PrdWeight').prop('disabled', true);
                        $('#PrdUnitLength').prop('disabled', true);
                        $('#PrdUnitWidth').prop('disabled', true);
                        $('#PrdUnitHeight').prop('disabled', true);
                        $('#PrdUnitWeight').prop('disabled', true);
                        $('#PrdQuantityEachCarton').prop('disabled', true);
                        $('#PrdCartonLength').prop('disabled', true);
                        $('#PrdCartonWidth').prop('disabled', true);
                        $('#PrdCartonHeight').prop('disabled', true);
                        $('#PrdCartonWeight').prop('disabled', true);

                        $('#PrdHoleLength').prop('disabled', true);
                        $('#PrdHoleWidth').prop('disabled', true);
                        $('#PrdOutsideLength').prop('disabled', true);
                        $('#PrdOutsideWidth').prop('disabled', true);
                        $('#PrdOutsideHeight').prop('disabled', true);

                    }
                    $('#div_attr_general').show();
                    //                    $('#div_produit_attr_content').show();
                    //                    $('#div_produit_attr_content_List').show();
                    $.each(jsondata.PrdGeneralInfoList, function (ind, value) {
                        //setFieldValue(newname, value, true);
                        set_General_PrdType_Fields(value);
                    });
                    //                    setPitList(jsondata.InstanceList);
                    //                    $.each(jsondata.InstanceList, function (ind, value) {
                    //                        setProductInstance(value);
                    //                    });
                    currentInstanceList = [];
                    currentInstanceList = jsondata.InstanceList;
                    ShowProductMode(jsondata.InstanceList);

                    if (!pageHasSet) {
                        setPageType();
                        pageHasSet = true;
                    }
                    // 读取 product type
                    loadProductTypeForModify();

                } else {
                    if (!pageHasSet) {
                        setPageType();
                        pageHasSet = true;
                    }
                }
            },
            error: function (data) {
                var test = '';
            }
        });
    } else {
        if (!pageHasSet) {
            setPageType();
            pageHasSet = true;
        }
    }
}

function setProductInstance(prodIns) {
    var propList = prodIns.PitAllInfo;
    SetProductInProductDiv(propList, false, prodIns);
}

function delete_product_click_confirm() {
    var title = "ATTENTION";
    var content = "<div class='box'><div class='box-body' style='height: 100px;'>" +
        "<div class='form-horizontal'>" +
        "<div class='col-md-12'>" +
        "<div class='form-group'>" +
        "<div class='col-sm-12' style='text-align:center;font-size: 18pt;'>Veuillez confirmer la suppression ! " +
        "<br/>La suppression est irrécupérable, veuillez confirmer !!!</div></div></div></div></div></div>"
        + "<div class='modal-footer center'>" +
        "<button type='button' class='btn btn-default' onclick='closeDialog()'>Annuler</button>" +
        "<button type='button' class='btn btn-inverse' onclick='return delete_Prd(this);'>SUPPRIMER</button></div>";
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
        //'background-color': '#a696ce',
        'background': 'url(../../img/menu_005_bg.jpg) repeat-x',
        'text-align': 'center',
        'color': '#C0C0C0'
    });
    return false;
}

function delete_Prd(sender) {
    var prdId = getParameterByName('prdId');
    var url = window.webservicePath + "/DeleteProduct";
    // 如果是，说明已经存在product，从数据库删除
    $.ajax({
        url: url,
        type: 'POST',
        contentType: 'application/json; charset=utf-8',
        data: "{prdId:'" + prdId + "'}",
        dataType: 'json',
        success: function (data) {
            var deleted = data.d;
            if (deleted) {
                window.location = 'SearchProduct.aspx';
            } else {
                MsgErrorPopUp('Suppression erreur', 'DATA IN USE');
                //alert('ERROR : DATA IN USE');
            }
        },
        error: function (data) {
            alert(data.responseText);
        }
    });
}

function loadProductImage() {
    var prdId = getUrlVars()['prdId'];
    var url = window.webservicePath + "/LoadProductImages";
    $.ajax({
        type: "POST",
        url: url,
        contentType: "application/json; charset=utf-8",
        data: "{prdId:'" + prdId + "'}",
        dataType: "json",
        success: function (data) {
            var jsdata = data.d;
            var jsondata = jQuery.parseJSON(jsdata);
            if (jsondata !== -1) {
                var pims = jsondata;
                setProductImage(pims, '#div_pims');
            } else {
            }
        },
        error: function (data) {
            var test = '';
        }
    });
}

var pageHasSet = false;
function setPageType() {
    App.setPage("gallery");  //Set current page
    App.init(); //Initialise plugins and elements
}

function getTechSheet() {
    var prdId = getUrlVars()['prdId'];
    if (prdId) {
        prdId = encodeURIComponent(prdId);
        window.open('../Common/PageDownLoad.aspx?prdId=' + prdId + '&type=1', '_blank');
        return false;
    }


    return false;
}

function downloadTechSheet(color) {
    var prdId = getUrlVars()['prdId'];
    if (prdId) {
        prdId = encodeURIComponent(prdId);
        window.open('../Common/PageDownLoad.aspx?prdId=' + prdId + '&type=1&color=' + color, '_blank');
        return false;
    }
    return false;
}

function getSupplier() {
    var prdid = getParameterByName('prdId');
    if (prdid) {
        var url = window.webservicePath + "/GetSupplierByProductId";
        $.ajax({
            type: "POST",
            url: url,
            contentType: "application/json; charset=utf-8",
            data: "{prdId:'" + prdid + "'}",
            dataType: "json",
            success: function (data) {
                var jsdata = data.d;
                var jsondata = jQuery.parseJSON(jsdata);
                if (jsondata !== '-1') {
                    var suppliers = jsondata;
                    if (suppliers.length > 0) {
                        $('#div_prd_info').removeClass('col-md-12');
                        $('#div_prd_info').addClass('col-md-8');
                        $('#div_prd_supplier').removeClass('col-md-1');
                        $('#div_prd_supplier').addClass('col-md-4');
                        $('#div_prd_supplier').show();

                        var content = '';
                        $.each(suppliers, function (name, value) {
                            var price = "Normal : " + value.SprPrice_1_100 + "<br/>" +
                                "Dimmable : " + value.SprPrice_100_500 + "<br/>" +
                                "Dali : " + value.SprPrice_500_plus;
                            content += "<tr><td style='vertical-align:middle; text-align:left; cursor:pointer;' fid='" + value.FId + "' title='Consulter les détails' onclick='displaySupplierProduct(this)'>" + value.SupplierName + "</td>" +
                                "<td style='vertical-align:middle; text-align:left; cursor:pointer;' fid='" + value.FId + "'  onclick='displaySupplierProduct(this)'>" + value.SprPrdRef + "</td>" +
                                "<td style='vertical-align:middle; text-align:right; cursor:pointer;' fid='" + value.FId + "'  onclick='displaySupplierProduct(this)'>" + price + "</td></tr>";
                        });
                        $('#tbody_suppliers').append(content);
                    } else {
                    }
                    //AddProductPopUp(jsondata.PitAllInfo, false, jsondata);
                } else {
                    AuthencationError();
                }
            },
            error: function (data) {
                var test = '';
            }
        });
    }
    return false;
}

function displaySupplierProduct(sender) {
    var id = $(sender).attr('fid');
    var url = '../Supplier/SupplierProduct.aspx?supId=' + id + '&mode=view&hideHeader=yes&hideSideMenu=yes&hideAllBtn=yes';
    pageSnapShot(url);
}

var categories = [];

function getAllCategories() {
    var url = window.webservicePath + "/GetAllCategory";
    $.ajax({
        type: "POST",
        url: url,
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        success: function (data) {
            var jsdata = data.d;
            var data2Treat = jQuery.parseJSON(jsdata);
            if (data2Treat !== '-1') {
                categories = data2Treat;

                getPcas();
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


var productCatList = [];
function AddProductToCategory(pcaId) {
    var oneCat = {};
    if (pcaId) {
        pcaId = pcaId * 1;
        oneCat = searchFieldValueInArray(productCatList, 'Id', pcaId);
    }

    var title = jQuery.isEmptyObject(oneCat) ? "Ajouter dans une catégorie" : "Mettre à jour";
    var content = "<div class='box'>" +
        "<div class='box-body' style='height:200px;'>" +
        "<div class='form-horizontal'>" +
        "<div class='col-md-12'>" +
    // this div is for album photo
        "<div class='row' style='margin-bottom: 20px;'><div class='col-md-12' id='div_add_rpd_2_cat' style='text-align:center;'>" +
        "</div>" +
    // image description and image order
        "<div class='col-md-12' style='margin-bottom:20px;'>" +
        "<div class='form-group'>" +
        "<label class='col-sm-4 control-label'>Catégorie</label>" +
        "<div class='col-md-8'><select id='select_cat_" + pcaId + "'  class='form-control' ></select></div>" +
        "</div>" +
        "<div class='form-group'>" +
        "<label class='col-sm-4 control-label'>Description</label>" +
        "<div class='col-md-8'><textarea id='pcaDescription_" + pcaId + "' class='form-control' row='5'></textarea></div>" +
        "</div>" +
        "</div>" +
    // cancel and save buttons
        "<div class='col-md-12' >" +
        "<div class='col-md-6 center'>" +
        "<button type='button' class='btn btn-default' onclick='return closeDialog()'>Annuler</button>" +
        "</div>" +
        "<div class='col-md-6 center'>" +
        "<button type='button' class='btn btn-inverse' pcaid='" + pcaId + "' onclick='return js_create_update_pca(this)'>Ajouter</button>" +
        "</div></div>" +
        "</div>" +
        "</div>" +
        "</div></div></div>" +
        "</div></div></div>";
    bootbox.dialog({
        title: title,
        message: content
    }).find('.modal-content').css({
        'margin-top': function () {
            var w = $(window).height();
            var b = $(".modal-dialog").height();
            // should not be (w-h)/2
            var h = (w - b) * 0.1;
            return h + "px";
        }
    }).find('.modal-header').css({
        //'background-color': '#a696ce',
        'background': 'url(../../img/menu_005_bg.jpg) repeat-x',
        'text-align': 'center',
        'color': '#C0C0C0'
    });

    $('#select_cat_' + pcaId).empty();

    $('#select_cat_' + pcaId).append($("<option></option>").attr("value", 0).text('Sélectionner une catégorie'));

    $.each(categories, function (name, value) {
        if (value.CatId === pcaId) {
            $('#select_cat_' + pcaId).append($("<option></option>").attr("selected", true).attr("value", value.CatId).text(value.CatName));
        } else {
            $('#select_cat_' + pcaId).append($("<option></option>").attr("value", value.CatId).text(value.CatName));
        }
    });
    return false;
}


function js_create_update_pca(sender) {
    var pcaId = $(sender).attr('pcaid') * 1;
    var catSelected = $('#select_cat_' + pcaId).val() * 1 > 0;
    if (catSelected) {
        var prdId = getParameterByName('prdId');
        var pcaDes = $('#pcaDescription_' + pcaId).val();
        var cat = $('#select_cat_' + pcaId).val() * 1;
        var url = window.webservicePath + "/CreateUpdatePca";
        var datastr = "{pcaId: " + pcaId + ",prdId:'" + prdId + "',catId:'" + cat + "',pcaDes:'" + pcaDes + "',resType:1}";
        closeDialog();
        myApp.showPleaseWait();
        $.ajax({
            url: url,
            type: 'POST',
            contentType: 'application/json; charset=utf-8',
            data: datastr,
            dataType: 'json',
            success: function (data) {
                myApp.hidePleaseWait();
                var jsdata = data.d;
                var jsondata = jQuery.parseJSON(jsdata);
                if (jsondata !== '-1') {
                    setPca(jsondata);
                } else {
                    AuthencationError();
                }
            },
            error: function (data) {
                myApp.hidePleaseWait();
            }
        });
    } else {
        //alert('Veuillez sélectionner une catégorie !');
        MsgErrorPopUp('ATTENTION', 'Veuillez sélectionner une catégorie !');
    }
    return false;
}

function getPcas() {
    var prdId = getParameterByName('prdId');
    if (prdId) {
        var datastr = "{prdId:'" + prdId + "',catId:''}";
        var url = window.webservicePath + "/GetAllPcas";
        $.ajax({
            url: url,
            type: 'POST',
            contentType: 'application/json; charset=utf-8',
            data: datastr,
            dataType: 'json',
            success: function (data) {
                var jsdata = data.d;
                var jsondata = jQuery.parseJSON(jsdata);
                if (jsondata !== '-1') {
                    setPca(jsondata);
                } else {
                    AuthencationError();
                }
            },
            error: function (data) {
                myApp.hidePleaseWait();
            }
        });
    }
    return false;
}

function setPca(pcas) {
    $('#div_pcas').empty();
    if (pcas && pcas.length > 0) {
        $.each(pcas, function (name, value) {
            var pcaId = value.Id;
            var onePca = "<div class='col-md-3'>" +
                "<div class='box border inverse'>" +
                "<div class='box-title' style='text-align:center'>" + value.Category.CatName + "</div>" +
                "<div class='box-body center'>" +
                "<div class='form-group'>" +
                "<div class='col-sm-12'>" +
                "<select id='select_cat_" + pcaId + "' disabled  class='form-control' ></select>" +
                "</div>" +
                "</div>" +
                "<div class='form-group'>" +
                "<div class='col-sm-12'>" +
                "<textarea class='form-control' disabled  id='pcaDescription_" + pcaId + "'></textarea>" +
                "</div>" +
                "</div>" +
                "<div class='form-group'>" +
                "<div class='col-sm-4'>" +
                "<button type='button' class='btn btn-inverse' id='btn_modify_pca_" + pcaId + "' pcaId='" + pcaId + "' onclick='modifyPcaClick(this,true)'><i class='fa fa-edit fa-1x'></i></button>" +
                "<button type='button' class='btn btn-inverse' id='btn_update_pca_" + pcaId + "' pcaId='" + pcaId + "' style='display:none;' onclick='js_create_update_pca(this)'><i class='fa fa-save fa-1x'></i></button>" +
                "</div>" +
                "<div class='col-sm-4'></div>" +
                "<div class='col-sm-4'>" +
                "<button type='button' class='btn btn-inverse'  id='btn_delete_pca_" + pcaId + "' pcaId='" + pcaId + "' onclick='delete_pca_confirm(this)'><i class='fa fa-times fa-1x'></i></button>" +
                "<button type='button' class='btn btn-inverse'  id='btn_cancel_pca_" + pcaId + "' pcaId='" + pcaId + "'  style='display:none;'  onclick='modifyPcaClick(this,false)'><i class='fa fa-times fa-1x'></i></button>" +
                "</div>" +
                "</div>" +
                "</div>" +
                "</div>" +
                "</div>" +
                "</div>";
            $('#div_pcas').append(onePca);
            $('#pcaDescription_' + pcaId).text(value.PcaDescription);

            $.each(categories, function (name, catvalue) {
                if (catvalue.CatId === value.Category.CatId) {
                    $('#select_cat_' + pcaId).append($("<option></option>").attr("selected", true).attr("value", catvalue.CatId).text(catvalue.CatName));
                } else {
                    $('#select_cat_' + pcaId).append($("<option></option>").attr("value", catvalue.CatId).text(catvalue.CatName));
                }
            });
        });
    }
}

function modifyPcaClick(sender, forModify) {
    var pcaId = $(sender).attr('pcaId');
    $('#select_cat_' + pcaId).prop("disabled", !forModify);
    $('#pcaDescription_' + pcaId).prop("disabled", !forModify);
    if (forModify) {
        $('#btn_modify_pca_' + pcaId).hide();
        $('#btn_delete_pca_' + pcaId).hide();
        $('#btn_update_pca_' + pcaId).show();
        $('#btn_cancel_pca_' + pcaId).show();

    } else {
        $('#btn_modify_pca_' + pcaId).show();
        $('#btn_delete_pca_' + pcaId).show();
        $('#btn_update_pca_' + pcaId).hide();
        $('#btn_cancel_pca_' + pcaId).hide();
    }
    return false;
}

function delete_pca_confirm(sender) {
    var pcaId = $(sender).attr('pcaid');

    var title = "ATTENTION";
    var content = "<div class='box'><div class='box-body' style='height: 100px;'>" +
        "<div class='form-horizontal'>" +
        "<div class='col-md-12'>" +
        "<div class='form-group'>" +
        "<div class='col-sm-12' style='text-align:center;font-size: 18pt;'>Veuillez confirmer la suppression ! " +
        "<br/>La suppression est irrécupérable, veuillez confirmer !!!</div></div></div></div></div></div>"
        + "<div class='modal-footer center'>" +
        "<button type='button' class='btn btn-default' onclick='closeDialog()'>Annuler</button>" +
        "<button type='button' class='btn btn-inverse' pcaId='" + pcaId + "' onclick='return deletePca(this);'>SUPPRIMER</button></div>";
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
        //'background-color': '#a696ce',
        'background': 'url(../../img/menu_005_bg.jpg) repeat-x',
        'text-align': 'center',
        'color': '#C0C0C0'
    });
    return false;
}

function deletePca(sender) {
    var pcaId = $(sender).attr('pcaid') * 1;
    var datastr = "{pcaId:" + pcaId + ",prdId:'',catId:''}";
    var url = window.webservicePath + "/DeletePca";
    $.ajax({
        url: url,
        type: 'POST',
        contentType: 'application/json; charset=utf-8',
        data: datastr,
        dataType: 'json',
        success: function (data) {
            getPcas();
        },
        error: function (data) {
            myApp.hidePleaseWait();
        }
    });
}

var hasSet_PitList = false;


function setPitList(pitList) {
    var itemName = 'all_pits_List';
    var db_name = 'db_' + itemName;
    var th_name = 'th_' + itemName;
    var tb_name = 'tb_' + itemName;
    var tf_name = 'tf_' + itemName;
    var div_name = 'div_' + itemName;
    var result_name = 'rst_' + itemName;

    var propsNamelist = [];
    if (pitList && pitList.length > 0) {
        $.each(pitList, function (order, onepit) {
            $.each(onepit.PitAllInfo, function (name, value) {
                var propname = value.PropName;
                if (jQuery.inArray(propname, propsNamelist) < 0) {
                    propsNamelist.push(propname);
                }
            });
        });
    }

    var headerFooterAdd = "";

    $.each(propsNamelist, function (name, value) {
        headerFooterAdd += "<th>" + value + "</th>";
    });

    var headerFooter = "<tr>" +
                    "<th>Référence</th>" +
                    "<th style='width: 20%;'>Image</th>" +
                    "<th>Prix d'achat</th>" +
                    "<th>Prix de vente</th>" +
                    headerFooterAdd +
                    "<th>Description</th>" +
                    "<th>Inventaire</th>" +
                    "<th title='Seuil de rupture de stock'>Seuil</th>" +
                    "<th>Traitement</th>" +
                    "</tr>";

    try {
        $('#' + db_name).remove();
        var datatableContent = "<table id='" + db_name + "' cellpadding='0' cellspacing='0' border='0' class='datatable table table-striped table-bordered table-hover'>" +
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
    var resultcount = pitList.length;
    $('#' + result_name).text(resultcount + " produit" + (resultcount > 1 ? "s" : ""));
    if (resultcount > 0) {
        $('#' + th_name).empty();
        $('#' + tf_name).empty();

        $('#' + th_name).append(headerFooter);
        $('#' + tf_name).append(headerFooter);

        var titles = new Array();
        titles.push({ "sTitle": "Référence" });
        titles.push({ "sTitle": "Image" });
        titles.push({ "sTitle": "Prix d'achat" });
        titles.push({ "sTitle": "Prix de vente" });
        $.each(propsNamelist, function (name, value) {
            titles.push({ "sTitle": value });
        });
        titles.push({ "sTitle": "Description" });
        titles.push({ "sTitle": "Inventaire" });
        titles.push({ "sTitle": "Seuil" });

        var displaycount = 1;
        $.each(pitList, function (name, value) {
            var dataArray = new Array();
            var setId = value.PitId;
            dataArray.push(value.PitRef);
            if (value.PitImages.length > 0) {
                var imagecontent = "";
                $.each(value.PitImages, function (name, value) {
                    //console.log(value);
                    var oneimgContent = "<div  id='div_one_pti_" + value.Key + "'><div class='filter-content'  style=' height: 200px;'>" +
                        "<img src='../../Services/ShowOutSiteImage.ashx?file=" + value.Value + "' alt=''   class='img-responsive'  style='width: 100%' />" +
                        "<div class='hover-content'><h4>" + value.Key2 + " | " + value.Value2 + "</h4>" +
                        "<a class='btn btn-inverse hover-link' ptiId='" + value.Key + "' ptiId='" + setId + "' pitId='" + setId + "' pimId='0'  onclick='deleteImageClick(this)'>" +
                        "<i class='fa fa-times fa-1x'></i></a>" +
                        "<a class='btn btn-inverse hover-link' ptiId='" + value.Key + "' ptiId='" + setId + "' pitId='" + setId + "' pimId='0' palId='" + value.Key3 + "' onclick='AddModifyImage(this)'>" +
                        "<i class='fa fa-edit fa-1x'></i></a>" +
                        "<a class='btn btn-inverse hover-link colorbox-button'href='../../Services/ShowOutSiteImage.ashx?file=" + value.Value + "' title='" + value.Key2 + " | " + value.Value2 + "'>" +
                        "<i class='fa fa-search-plus fa-1x'></i></a>" +
                        "</div></div></div>";
                    imagecontent += oneimgContent;
                });
                dataArray.push("<div id='div_pit_imgs_" + setId + "'>" + imagecontent + "</div>");
            } else {
                dataArray.push("<div id='div_pit_imgs_" + setId + "'><button type='button' class='btn btn-inverse forview language_txt' pitid='" + setId + "' onclick='return AddModifyImage(this, true)' title='Ajouter une photo'><i class='fa fa-arrow-circle-o-up'></i></button></div>");
            }

            dataArray.push(value.PitPurchasePrice);
            dataArray.push(value.PitPrice);


            $.each(propsNamelist, function (order, oneprop) {
                //titles.push({ "sTitle": value });
                var propvalue2add = "";
                if (value.PitAllInfo && value.PitAllInfo.length > 0) {
                    var propvalue = searchFieldValueInArray(value.PitAllInfo, 'PropName', oneprop);
                    if (!jQuery.isEmptyObject(propvalue)) {
                        propvalue2add = propvalue.PropValue;
                        if (propvalue.PropUnit) {
                            var unitRight = propvalue.PropIsUnitRightSide ? propvalue.PropUnit : "";
                            var unitLeft = !propvalue.PropIsUnitRightSide ? propvalue.PropUnit : "";
                            var inputContent = IsNullOrEmpty(propvalue2add)? propvalue2add: (unitLeft + propvalue2add + unitRight);
                            propvalue2add = inputContent;
                        } else {
                            if (propvalue.PropIsImage) {
                                var propGuid = propvalue.PropGuid;
                                var download = "<button class='btn btn-inverse' propid='" + propGuid + "' pitId='" + setId + "' onclick='return downloadTheFile(this)' title='Télécharger'><i class='fa fa-arrow-circle-o-down'></i></button>";
                                var uploadfile = "<button class='btn btn-inverse' propid='" + propGuid + "' pitId='" + setId + "' onclick='return UploadProductFile(this)' title='Upload'><i class='fa fa-arrow-circle-o-up'></i></button>";
                                var deletefile = "<button class='btn btn-inverse' propid='" + propGuid + "' pitId='" + setId + "' onclick='return deleteTheFileConfirm(this)' title='Supprimer'><i class='fa fa-times'></i></button>";
                                inputContent = propvalue.PropValue ? (download + uploadfile + deletefile) : uploadfile;
                                propvalue2add = inputContent;
                            } else {
                                inputContent = propvalue.PropValue;
                                propvalue2add = inputContent;
                            }
                        }
                    }
                }
                dataArray.push(propvalue2add);
            });
            dataArray.push(value.PitDescription);
            dataArray.push("<div style='text-align:right;'><span>" + value.PitInventory + "</span></div>");
            dataArray.push("<div style='text-align:right;'><span>" + value.PitInventoryThreshold + "</span></div>");
            var btnUpdate = "<button class='btn btn-inverse' pitid='" + setId + "' id='btn_addupdate_one_product_propCountId_' name='btn_addupdate_one_product_propCountId_' onclick='return setPit2ModeUpdate(this)' title='Mettre à jour'><i class='fa fa-arrow-circle-o-up'></i></button>";
            var btnDelete = "<button class='btn btn-inverse' pitid='" + setId + "' id='btn_delete_one_product_propCountId_' name='btn_delete_one_product_propCountId_' onclick='return confirm_delete_one_PIT(this)' title='Supprimer'><i class='fa fa-times'></i></button>";

            dataArray.push("<div style='text-align:center'>" + btnUpdate + btnDelete + "</div>");
            try {
                $('#' + db_name).dataTable().fnAddData(dataArray);
            } catch (e) {
                var test = '';
            }
            displaycount++;
        });


        if (hasSet_PitList) {
            try {
                $('#' + db_name).dataTable({
                    "sPaginationType": "bs_full",
                    "bDestroy": true,
                    "bRetrieve": true,
                    "bServerSide": true,
                    "bProcesLgsg": true,
                    "aoColumns": titles
                });

            } catch (e) {
                var testestst = "";
            }
        }


        try {
            if (!hasSet_PitList) {
                hasSet_PitList = true;
            }
        } catch (e) {

        }

        //        try {
        //            $.each(pitList, function(name, value) {
        //                var dataArray = new Array();
        //                var setId = value.PitId;
        //                if (value.PitImages.length > 0) {
        //                    //dataArray.push("<div id='div_pit_imgs_" + setId + "'></div>");
        //                    var budgetId = 'div_pit_imgs_' + setId;
        //                    setProductImage(value.PitImages, budgetId);
        //                } 
        //            });
        //        } catch (e) {

        //        } 
    }
}


var currentSmd = '';
function ShowProductMode(InstanceList) {
    var smd = getParameterByName('smd');
    if (currentSmd === '' || currentSmd === "") {
        if (!smd) {
            smd = 'lst';
        }
        currentSmd = smd;
    }
    $.each(InstanceList, function (ind, value) {
        setProductInstance(value);
    });
    setPitList(InstanceList);
    if (currentSmd === 'img') {
        $('#div_produit_attr_content').show();
    } else {
        $('#div_produit_attr_content_List').show();
        if (!$('#cbx_product_display_mode').is(':checked')) {
            $('#cbx_product_display_mode').click();
        }
    }
}


function hideAttrForView() {
    $('._infoCollapse').click();
    HidePleaseWait();
}


function changeDisplayMode(sender) {
    var isListe = $(sender).is(':checked');
    var smd = currentSmd;
    var paraisListe = smd !== 'img';
    if (isListe !== paraisListe) {
        //        var prdId = getParameterByNameNoHtmlCode(location.search, 'prdId');
        //        var mode = getParameterByName('mode');
        //        var url = 'Product.aspx?prdId=' + prdId + '&mode=' + mode;
        if (isListe) {
            currentSmd = 'lst';
            $('#div_produit_attr_content').hide();
            $('#div_produit_attr_content_List').show();
            //url += '&smd=lst';
        } else {
            currentSmd = 'img';
            $('#div_produit_attr_content').show();
            $('#div_produit_attr_content_List').hide();
            //url += '&smd=img';
        }
        //document.location = url;
    }
}

function createProductExpress() {
    var url = 'ProductExpress.aspx';
    window.location = url;

}

function DuplicateProduct() {
    if (!jQuery.isEmptyObject(curentProduct)) {
        NewProductInfo();
    } else {
        MsgErrorPopUp('ERREUR', 'Le duplicat est échoué, veuillez contacter l\'administrateur');
    }
    return false;
}

function NewProductInfo() {
    var contentStart = "<div class='row' id='div_dup_prd_content'><div class='col-md-12'>" +
        "<div class='box-body center'><form class='form-horizontal'>";
    var prdItemContent = "";


    var pitRefField = "<div class='form-group'>" +
        "<label class='col-sm-4 control-label' style='font-size: 8pt; text-align: left;'>Nouvelle Référence</label>" +
        "<div class='col-sm-8'>" +
        "<input id='NPrdRef' class='form-control' name='NPrdRef' title='Référence' type='text' value='' required />" +
        "</div></div>";
    prdItemContent = pitRefField;

    var normalContent =
        "<div class='form-group'>" +
            "<label class='col-sm-4 control-label' style='font-size: 8pt; text-align: left;'>Nom du produit</label>" +
            "<div class='col-sm-8'>" +
            "<input id='NPrdName' name='NPrdName' type='text' class='form-control' required />" +
            "</div></div>" +
            "<div class='form-group'>" +
            "<label class='col-sm-4 control-label' style='font-size: 8pt; text-align: left;'>Famille du produit</label>" +
            "<div class='col-sm-8'>" +
            "<input id='NPrdSubName' name='NPrdSubName' type='text' class='form-control' required />" +
            "</div></div>";

    prdItemContent += normalContent;

    // add purchase price
    var purchasePriceContent = "<div class='form-group'>" +
        "<label class='col-sm-4 control-label' style='font-size: 8pt; text-align: left;'>Prix d'achat</label>" +
        "<div class='col-sm-8'>" +
        "<div class='input-group'><span class='input-group-addon'>€</span><input id='NPrdPurchasePrice' class='form-control' name='NPrdPurchasePrice' title='Prix d&#39achat' type='number' value='' step='0.1'/>" +
        "</div></div></div>";
    // add price
    var priceContent = "<div class='form-group'>" +
        "<label class='col-sm-4 control-label' style='font-size: 8pt; text-align: left;'>Prix de vente</label>" +
        "<div class='col-sm-8'><div class='input-group'><span class='input-group-addon'>€</span><input id='NPrdPrice' class='form-control' name='NPrdPrice' title='Prix de vente'  value=''   type='number' step='0.1'/>" +
        "</div></div></div>";


    // add purchase price
    var puissance = "<div class='form-group'>" +
        "<label class='col-sm-4 control-label' style='font-size: 8pt; text-align: left;'>Puissance</label>" +
        "<div class='col-sm-8'>" +
        "<div class='input-group'><input id='NPrdPuissance' class='form-control' name='NPrdPuissance'type='number' value='' step='1' min='0' required /><span class='input-group-addon'>W</span>" +
        "</div></div></div>";

    // add purchase price
    var protectionIP = "<div class='form-group'>" +
        "<label class='col-sm-4 control-label' style='font-size: 8pt; text-align: left;'>Protection IP</label>" +
        "<div class='col-sm-8'>" +
        "<div class='input-group'><span class='input-group-addon'>IP</span><input id='NPrdProtectIP' class='form-control' name='NPrdProtectIP'  type='text' value='' required  />" +
        "</div></div></div>";


    var description =
            "<div class='form-group'>" +
            "<label class='col-sm-4 control-label' style='font-size: 8pt; text-align: left;'>Description</label>" +
            "<div class='col-sm-8'>" +
            "<textarea id='NPrdDescription' name='NPrdDescription' type='text' class='form-control'></textarea>" +
            "</div></div>";
    // add description
    prdItemContent += purchasePriceContent;
    prdItemContent += priceContent;
    prdItemContent += puissance;
    prdItemContent += protectionIP;
    prdItemContent += description;


    var size =
        "<div class='col-sm-4'><div class='box'><div class='box-title' style='text-align: center'><h4>Taille du produit</h4></div><div class='box-body center'><div class='form-group'><label class='col-sm-4 control-label' style='font-size: 8pt; text-align: left;'>Longueur</label><div class='col-sm-8'><div class='input-group'><input id='NPrdLength' class='form-control' name='NPrdLength' title='Longueur' placeholder='Longueur'type='number'><span class='input-group-addon'>mm</span></div></div></div><div class='form-group'><label class='col-sm-4 control-label' style='font-size: 8pt; text-align: left;'>Largeur</label><div class='col-sm-8'><div class='input-group'><input id='NPrdWidth' class='form-control' name='NPrdWidth' title='Largeur' placeholder='Largeur'type='number'><span class='input-group-addon'>mm</span></div></div></div><div class='form-group'><label class='col-sm-4 control-label' style='font-size: 8pt; text-align: left;'>Hauteur</label><div class='col-sm-8'><div class='input-group'><input id='NPrdHeight' class='form-control' name='NPrdHeight' title='Hauteur' placeholder='Hauteur'type='number'><span class='input-group-addon'>mm</span></div></div></div><div class='form-group'><label class='col-sm-4 control-label' style='font-size: 8pt; text-align: left;'>Poids</label><div class='col-sm-8'><div class='input-group'><input id='NPrdWeight' class='form-control' name='NPrdWeight' title='Poids' placeholder='Poids'type='number'><span class='input-group-addon'>Kg</span></div></div></div></div></div></div>";
    var sizeInt = "<div class='col-md-4'><div class='box'><div class='box-title' style='text-align: center'><h4>Taille intérieur</h4></div><div class='box-body center'><div class='form-group'><label class='col-sm-4 control-label' style='font-size: 8pt; text-align: left;'>Longueur intérieur</label><div class='col-sm-8'><div class='input-group'><input id='NPrdHoleLength' class='form-control' name='NPrdHoleLength' title='Longueur'placeholder='Longueur' type='number'><span class='input-group-addon'>mm</span></div></div></div><div class='form-group'><label class='col-sm-4 control-label' style='font-size: 8pt; text-align: left;'>Largeur intérieur</label><div class='col-sm-8'><div class='input-group'><input id='NPrdHoleWidth' class='form-control' name='NPrdHoleWidth' title='Largeur'placeholder='Largeur' type='number'><span class='input-group-addon'>mm</span></div></div></div><div class='form-group'><label class='col-sm-4 control-label' style='font-size: 8pt; text-align: left;'>Profondeur</label><div class='col-sm-8'><div class='input-group'><input id='NPrdDepth' class='form-control' name='NPrdDepth' title='Profondeur' placeholder='Profondeur'type='number'><span class='input-group-addon'>mm</span></div></div></div><div class='form-group'><label class='col-sm-4 control-label' style='font-size: 8pt; text-align: left;'>Diamètre intérieur(Ouverture)</label><div class='col-sm-8'><div class='input-group'><input id='NPrdHoleSize' class='form-control' name='NPrdHoleSize' title='Ouverture'placeholder='Ouverture' type='number'><span class='input-group-addon'>mm</span></div></div></div></div></div></div>";

    var sizeExt = "<div class='col-md-4'><div class='box'><div class='box-title' style='text-align: center'><h4>Taille extérieur</h4></div><div class='box-body center'><div class='form-group'><label class='col-sm-4 control-label' style='font-size: 8pt; text-align: left;'>Longueur extérieur</label><div class='col-sm-8'><div class='input-group'><input id='NPrdOutsideLength' class='form-control' name='NPrdOutsideLength' title='Longueur'placeholder='Longueur' type='number'><span class='input-group-addon'>mm</span></div></div></div><div class='form-group'><label class='col-sm-4 control-label' style='font-size: 8pt; text-align: left;'>Largeur extérieur</label><div class='col-sm-8'><div class='input-group'><input id='NPrdOutsideWidth' class='form-control' name='NPrdOutsideWidth' title='Largeur'placeholder='Largeur' type='number'><span class='input-group-addon'>mm</span></div></div></div><div class='form-group'><label class='col-sm-4 control-label' style='font-size: 8pt; text-align: left;'>Épaisseur</label><div class='col-sm-8'><div class='input-group'><input id='NPrdOutsideHeight' class='form-control' name='NPrdOutsideHeight' title='Hauteur'placeholder='Épaisseur' type='number'><span class='input-group-addon'>mm</span></div></div></div><div class='form-group'><label class='col-sm-4 control-label' style='font-size: 8pt; text-align: left;'>Diamètre extérieur</label><div class='col-sm-8'><div class='input-group'><input class='form-control' id='NPrdOutsideDiameter' name='NPrdOutsideDiameter' title=' Diamètre extérieur'placeholder='Diamètre extérieur' type='number'><span class='input-group-addon'>mm</span></div></div></div></div></div></div>";
    var siezUnit = "<div class='col-md-4'><div class='box'><div class='box-title' style='text-align: center'><h4>Taille d'unit</h4></div><div class='box-body center'><div class='form-group'><label class='col-sm-4 control-label' style='font-size: 8pt; text-align: left;'>Longueur</label><div class='col-sm-8'><div class='input-group'><input id='NPrdUnitLength' class='form-control' name='NPrdUnitLength' title='Longueur'placeholder='Longueur' type='number'><span class='input-group-addon'>mm</span></div></div></div><div class='form-group'><label class='col-sm-4 control-label' style='font-size: 8pt; text-align: left;'>Largeur</label><div class='col-sm-8'><div class='input-group'><input id='NPrdUnitWidth' class='form-control' name='NPrdUnitWidth' title='Largeur'placeholder='Largeur' type='number'><span class='input-group-addon'>mm</span></div></div></div><div class='form-group'><label class='col-sm-4 control-label' style='font-size: 8pt; text-align: left;'>Hauteur</label><div class='col-sm-8'><div class='input-group'><input id='NPrdUnitHeight' class='form-control' name='NPrdUnitHeight' title='Hauteur'placeholder='Hauteur' type='number'><span class='input-group-addon'>mm</span></div></div></div><div class='form-group'><label class='col-sm-4 control-label' style='font-size: 8pt; text-align: left;'>Poids</label><div class='col-sm-8'><div class='input-group'><input id='NPrdUnitWeight' class='form-control' name='NPrdUnitWeight' title='Poids'placeholder='Poids' type='number'><span class='input-group-addon'>Kg</span></div></div></div></div></div></div>";

    prdItemContent += ("<div class='form-group'>" + size + sizeInt + sizeExt + "</div>");

    var sizePackage = "<div class='col-md-4'><div class='box'><div class='box-title' style='text-align: center'><h4>Taille du carton</h4></div><div class='box-body center'><div class='form-group'><label class='col-sm-4 control-label' style='font-size: 8pt; text-align: left;'>Longueur</label><div class='col-sm-8'><div class='input-group'><input id='NPrdCartonLength' class='form-control' name='NPrdCartonLength' title='Longueur'placeholder='Longueur' type='number'><span class='input-group-addon'>mm</span></div></div></div><div class='form-group'><label class='col-sm-4 control-label' style='font-size: 8pt; text-align: left;'>Largeur</label><div class='col-sm-8'><div class='input-group'><input id='NPrdCartonWidth' class='form-control' name='NPrdCartonWidth' title='Largeur'placeholder='Largeur' type='number'><span class='input-group-addon'>mm</span></div></div></div><div class='form-group'><label class='col-sm-4 control-label' style='font-size: 8pt; text-align: left;'>Hauteur</label><div class='col-sm-8'><div class='input-group'><input id='NPrdCartonHeight' class='form-control' name='NPrdCartonHeight' title='Hauteur'placeholder='Hauteur' type='number'><span class='input-group-addon'>mm</span></div></div></div><div class='form-group'><label class='col-sm-4 control-label' style='font-size: 8pt; text-align: left;'>Poids</label><div class='col-sm-8'><div class='input-group'><input id='NPrdCartonWeight' class='form-control' name='NPrdCartonWeight' title='Poids'placeholder='Poids' type='number'><span class='input-group-addon'>Kg</span></div></div></div><div class='form-group'><label class='col-sm-4 control-label' style='font-size: 8pt; text-align: left;'>Unit par carton</label><div class='col-sm-8'><input id='NPrdQuantityEachCarton' class='form-control' step='1' name='NPrdQuantityEachCarton'title='Unit par carton' placeholder='Unit par carton' type='number'></div></div></div></div></div>";
    prdItemContent += ("<div class='form-group'>" + siezUnit + sizePackage + "</div>");

    var addupdate = 'Ajouter';

    var contentEnd = "<div class='form-group' id='div_btns_add_close_addupdate_product_PropCountId_'><button type='submit' class='btn btn-block btn-inverse' pitid='propCountId_' id='btn_addupdate_one_product_propCountId_' name='btn_addupdate_one_product_propCountId_' onclick='return DuplicateProductClick()'><span>" + addupdate + "</span></button>" +
        "<button class='btn btn-block btn-default bootbox-close-button' pitid='propCountId_' id='btn_close_addupdateProduct_propCountId_'><span>Annuler</span></button>" +
        "</div>" +
        "</form>" +
        "</div>" +
        "</div>" +
        "</div>";

    var allcontent = contentStart + prdItemContent + contentEnd;

    allcontent = replaceAll(allcontent, 'propCountId_', 0);
    //$('#div_all_prds_content').append(allcontent);
    prdCount--;
    var pagewidth = $(window).width();
    var dialogwidth = pagewidth >= 800 ? '50%' : '95%';

    var title = "Dupliquer produit " + curentProduct.PrdRef;
    bootbox.dialog({
        title: title,
        message: allcontent
    }).find('.modal-dialog').css({
        'width': dialogwidth
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

    setDuplicateContent();
}

function setDuplicateContent() {
    $('#NPrdRef').val(curentProduct.PrdRef);
    $('#NPrdName').val(curentProduct.PrdName);
    $('#NPrdSubName').val(curentProduct.PrdSubName);
    $('#NPrdPurchasePrice').val(curentProduct.PrdPurchasePrice);
    $('#NPrdPrice').val(curentProduct.PrdPrice);
    $('#NPrdLength').val(curentProduct.PrdLength);
    $('#NPrdWidth').val(curentProduct.PrdWidth);
    $('#NPrdHeight').val(curentProduct.PrdHeight);
    $('#NPrdWeight').val(curentProduct.PrdWeight);
    $('#NPrdHoleLength').val(curentProduct.PrdHoleLength);
    $('#NPrdHoleWidth').val(curentProduct.PrdHoleWidth);
    $('#NPrdDepth').val(curentProduct.PrdDepth);
    $('#NPrdHoleSize').val(curentProduct.PrdHoleSize);
    $('#NPrdOutsideLength').val(curentProduct.PrdOutsideLength);
    $('#NPrdOutsideWidth').val(curentProduct.PrdOutsideWidth);
    $('#NPrdOutsideHeight').val(curentProduct.PrdOutsideHeight);
    $('#NPrdOutsideDiameter').val(curentProduct.PrdOutsideDiameter);
    $('#NPrdUnitLength').val(curentProduct.PrdUnitLength);
    $('#NPrdUnitWidth').val(curentProduct.PrdUnitWidth);
    $('#NPrdUnitHeight').val(curentProduct.PrdUnitHeight);
    $('#NPrdUnitWeight').val(curentProduct.PrdUnitWeight);
    $('#NPrdCartonLength').val(curentProduct.PrdCartonLength);
    $('#NPrdCartonWidth').val(curentProduct.PrdCartonWidth);
    $('#NPrdCartonHeight').val(curentProduct.PrdCartonHeight);
    $('#NPrdCartonWeight').val(curentProduct.PrdCartonWeight);
    $('#NPrdQuantityEachCarton').val(curentProduct.PrdQuantityEachCarton);
    $('#NPrdDescription').text(curentProduct.PrdDescription);
}

function DuplicateProductClick() {
    var checkedOK = CheckRequiredFieldInOneDiv('div_dup_prd_content');
    if (checkedOK) {
        ShowPleaseWait();
        var FId = getParameterByName('prdId');
        var PrdRef = $('#NPrdRef').val();
        var PrdName = $('#NPrdName').val();
        var PrdSubName = $('#NPrdSubName').val();
        var PrdDescription = $('#NPrdDescription').val();
        var PrdPurchasePrice = $('#NPrdPurchasePrice').val();
        var PrdPrice = $('#NPrdPrice').val();
        var onePrd = {};
        onePrd.FId = FId;
        onePrd.PrdRef = PrdRef;
        onePrd.PrdName = PrdName;
        onePrd.PrdSubName = PrdSubName;
        onePrd.PrdDescription = PrdDescription;
        onePrd.PrdPurchasePrice = PrdPurchasePrice;
        onePrd.PrdPrice = PrdPrice;
        onePrd.PrdInsideDiameter = $('#NPrdInsideDiameter').val() * 1;
        onePrd.PrdOutsideDiameter = $('#NPrdOutsideDiameter').val() * 1;
        onePrd.PrdLength = $('#NPrdLength').val() * 1;
        onePrd.PrdWidth = $('#NPrdWidth').val() * 1;
        onePrd.PrdHeight = $('#NPrdHeight').val() * 1;
        onePrd.PrdHoleSize = $('#NPrdHoleSize').val() * 1;
        onePrd.PrdDepth = $('#NPrdDepth').val() * 1;
        onePrd.PrdWeight = $('#NPrdWeight').val() * 1;
        onePrd.PrdUnitLength = $('#NPrdUnitLength').val() * 1;
        onePrd.PrdUnitWidth = $('#NPrdUnitWidth').val() * 1;
        onePrd.PrdUnitHeight = $('#NPrdUnitHeight').val() * 1;
        onePrd.PrdUnitWeight = $('#NPrdUnitWeight').val() * 1;
        onePrd.PrdQuantityEachCarton = $('#NPrdQuantityEachCarton').val() * 1;
        onePrd.PrdCartonLength = $('#NPrdCartonLength').val() * 1;
        onePrd.PrdCartonWidth = $('#NPrdCartonWidth').val() * 1;
        onePrd.PrdCartonHeight = $('#NPrdCartonHeight').val() * 1;
        onePrd.PrdCartonWeight = $('#NPrdCartonWeight').val() * 1;

        onePrd.PrdHoleLength = $('#NPrdHoleLength').val() * 1;
        onePrd.PrdHoleWidth = $('#NPrdHoleWidth').val() * 1;
        onePrd.PrdOutsideLength = $('#NPrdOutsideLength').val() * 1;
        onePrd.PrdOutsideWidth = $('#NPrdOutsideWidth').val() * 1;
        onePrd.PrdOutsideHeight = $('#NPrdOutsideHeight').val() * 1;

        var listExp = [];
        var puissance = {};
        puissance.Value = "Puissance";
        puissance.Value2 = $('#NPrdPuissance').val() * 1;
        listExp.push(puissance);
        var protectIP = {};
        protectIP.Value = "Protection IP";
        protectIP.Value2 = $('#NPrdProtectIP').val();
        listExp.push(protectIP);

        onePrd.ExpressProps = listExp;


        var jsondata = JSON.stringify({ oneProduct: onePrd });
        $.ajax({
            url: 'Product.aspx/DuplicateProduct',
            type: 'POST',
            contentType: 'application/json; charset=utf-8',
            data: jsondata,
            dataType: 'json',
            success: function (data) {
                var prdId = data.d;
                var url = window.location.href.split('?')[0];
                var newUrl = url + '?prdId=' + prdId + '&mode=view';
                document.location.href = newUrl;
            },
            error: function (data) {
            }
        });
    }
    return false;
}

function AddUpdate_Driver_Acc(status) {
    ShowPleaseWait();
    var url = window.webservicePath + "/GetDriverAccessory";
    $.ajax({
        type: "POST",
        url: url,
        contentType: "application/json; charset=utf-8",
        data: "{status:" + status + "}",
        dataType: "json",
        success: function (data) {
            var jsdata = data.d;
            var jsondata = jQuery.parseJSON(jsdata);
            if (jsondata !== -1) {
                var prds = jsondata;
                setDriver_Acc(prds, status);
                //console.log(prds);
            } else {
            }


            HidePleaseWait();
        },
        error: function (data) {
            HidePleaseWait();
            var test = '';
        }
    });
}

function setDriver_Acc(prds, status) {
    var contentStart = "<div class='row'><div class='col-md-12' id='div_pit_content_propCountId_'>" +
        "<div class='box-body center'><form class='form-horizontal'>";
    var driver_acc_content = "<div class='form-group'>" +
    "<label class='col-sm-6 control-label' style='text-align:center'>" + (status === 1 ? "TYPE DE DRIVER" : "TYPE D'ACCESSOIRE") + "</label>" +
     "<label class='col-sm-6 control-label' style='text-align:center'>" + (status === 1 ? "DRIVERS" : "ACCESSOIRES") + "</label>" +
        "</div>" +
        "<div class='form-group'><div class='col-sm-6' id='div_drv_type'>" +
        "</div>" +
        "<div class='col-sm-6' id='div_drv_content'>" +
        "</div></div>" +
        "<div class='form-group'><div class='col-sm-12' id='div_drv_detail'></div>" +
        "<div class='form-group'><div class='col-sm-12' id='div_drv_org_price'></div>" +
        "<div class='form-group'><div class='col-sm-12' id='div_drv_description'></div>" +
        "<div class='form-group'><div class='col-sm-12' id='div_drv_sale_price'></div>" +
        "</div>" +
        "</div>";

    var dev_type = "<select id='slt_drv_type' size='10' class='form-control' >";
    $.each(prds, function (name, value) {
        dev_type += "<option prdId='" + value.PrdId + "' onclick='drv_acc_change(this)'>" + value.PrdName + "</option>";
    });
    dev_type += "</select>";

    // add price
    var priceContent = "<div class='form-group' id='div_'>" +
        "</div>";

    var contentEnd = "<div class='form-group' id='div_btns_add_close_addupdate_product_PropCountId_'><button type='submit' class='btn btn-block btn-inverse' id='btn_addupdate_drv_acc' name='btn_addupdate_drv_acc' onclick='return add_update_drv_acc(" + status + ")'><span>Ajouter</span></button>" +
        "<button class='btn btn-block btn-default bootbox-close-button' pitid='propCountId_' id='btn_close_addupdateProduct_propCountId_'><span>Annuler</span></button>" +
        "</div>" +
        "</form>" +
        "</div>" +
        "</div>" +
        "</div>";

    var allcontent = contentStart + driver_acc_content + contentEnd;


    //$('#div_all_prds_content').append(allcontent);
    prdCount--;
    //console.log(status);
    var title = status === 1 ? "DRIVER" : "ACCESSOIRE";
    bootbox.dialog({
        title: title,
        message: allcontent
    }).find('.modal-dialog').css({
        'width': '70%'
    }).find('.modal-content').css({
        'margin-top': function () {
            var w = $(window).height();
            var b = $(".modal-dialog").height();
            // should not be (w-h)/2
            var h = (w - b) * 0.1;
            return h + "px";
        }
    }).find('.modal-header').css({
        //'background-color': '#a696ce',
        'background': 'url(../../img/menu_005_bg.jpg) repeat-x',
        'text-align': 'center',
        'color': '#C0C0C0'
    });

    $('#div_drv_type').append(dev_type);
    return false;
}

function drv_acc_change(sender) {
    var prdId = $(sender).attr('prdId');
    ShowPleaseWait();
    set_drv_acc_list(prdId);
    //console.log(prdId);
    //setTimeout(HidePleaseWait,1000);
}

var pitItems = [];
function set_drv_acc_list(prdId) {
    if (prdId) {
        var url = window.webservicePath + "/GetDrvAcc";
        $.ajax({
            type: "POST",
            url: url,
            contentType: "application/json; charset=utf-8",
            data: "{prdId:" + prdId + "}",
            dataType: "json",
            success: function (data) {
                var jsdata = data.d;
                var jsondata = jQuery.parseJSON(jsdata);
                if (jsondata !== -1) {
                    var pits = jsondata;
                    pitItems = [];
                    pitItems = pits;
                    setDrv_Acc(pits);
                    //console.log(pits);
                } else {
                }
                HidePleaseWait();
            },
            error: function (data) {
                HidePleaseWait();
                var test = '';
            }
        });
    }
}

function setDrv_Acc(pits) {
    var dev_type_content = "<select id='slt_drv_content' size='10' class='form-control' >";
    $.each(pits, function (name, value) {
        dev_type_content += "<option pitId='" + value.PitId + "' onclick='drv_acc_item_click(this)'>" + value.PitRef + "</option>";
    });
    dev_type_content += "</select>";
    $('#div_drv_content').empty();
    $('#div_drv_content').append(dev_type_content);
}

var drv_acc_pit_id = 0;

function drv_acc_item_click(sender) {
    drv_acc_pit_id = 0;
    var pitId = $(sender).attr('pitId');
    var onepit = searchFieldValueInArray(pitItems, 'PitId', pitId * 1);
    var drv_acc_content = "";
    if (!jQuery.isEmptyObject(onepit)) {
        drv_acc_pit_id = onepit.PitId;
        $.each(onepit.PitAllInfo, function (name, value) {
            drv_acc_content += "<label class='col-sm-2 control-label'>" + value.PropName + "</label>";
            var unitRight = value.PropIsUnitRightSide ? "<span class='input-group-addon'>" + value.PropUnit + "</span>" : "";
            var unitLeft = !value.PropIsUnitRightSide ? "<span class='input-group-addon'>" + value.PropUnit + "</span>" : "";
            var inputvalue = " value='" + value.PropValue + "' ";
            var inputContent = "<div class='col-sm-2'><div class='input-group'>" +
                unitLeft +
                "<input class='form-control'" + inputvalue + " disabled />" +
                unitRight +
                "</div></div>";
            drv_acc_content += inputContent;
        });
        $('#div_drv_detail').empty();
        $('#div_drv_detail').append(drv_acc_content);

        var drv_acc_org_price = "<label class='col-sm-2 control-label'>Prix d'achat</label>";
        drv_acc_org_price += "<div class='col-sm-4'><div class='input-group'>" +
            "<span class='input-group-addon'>€</span>" +
            "<input class='form-control' value='" + onepit.PitPurchasePrice + "' disabled />" +
            "</div></div>";
        drv_acc_org_price += "<label class='col-sm-2 control-label'>Prix de vente conseillé</label>";
        drv_acc_org_price += "<div class='col-sm-4'><div class='input-group'>" +
            "<span class='input-group-addon'>€</span>" +
            "<input class='form-control' value='" + onepit.PitPrice + "' disabled />" +
            "</div></div>";

        $('#div_drv_org_price').empty();
        $('#div_drv_org_price').append(drv_acc_org_price);

        var drv_acc_des = "<label class='col-sm-2 control-label'>Description</label>";
        drv_acc_des += "<div class='col-sm-10'>" +
            "<textarea class='form-control' row='5' id='txa_des' disabled ></textarea>" +
            "</div>";
        $('#div_drv_description').empty();
        $('#div_drv_description').append(drv_acc_des);

        try {
            $('#txa_des')[0].value = onepit.PitDescription;
        } catch (e) {
            var testError = '';
        }

        var drv_acc_price = "<div class='col-sm-6'></div>";
        drv_acc_price += "<label class='col-sm-2 control-label'>Prix de vente</label>";
        drv_acc_price += "<div class='col-sm-4'><div class='input-group'>" +
            "<span class='input-group-addon'>€</span>" +
            "<input class='form-control' id='ip_drv_sale_price' value='" + onepit.PitPrice + "' step='0.01' type='number' min='0'/>" +
            "</div></div>";
        $('#div_drv_sale_price').empty();
        $('#div_drv_sale_price').append(drv_acc_price);
    }
}

function add_update_drv_acc(type) {
    var price = $('#ip_drv_sale_price').val() * 1;
    var prdId = $('#slt_drv_type option:selected').attr('prdid') * 1;
    var pitId = $('#slt_drv_content option:selected').attr('pitid') * 1;

    var mainPrdId = getUrlVars()['prdId'];
    var jsondata = JSON.stringify({ prdMainId: mainPrdId, prdRefId: prdId, pitRefId: pitId, type: type, price: price });
    var url = window.webservicePath + "/CreateUpdateDrvAcc";
    ShowPleaseWait();
    closeDialog();
    $.ajax({
        type: "POST",
        url: url,
        contentType: "application/json; charset=utf-8",
        data: jsondata,
        dataType: "json",
        success: function (data) {
            HidePleaseWait();
            var jsdata = data.d;
            var jsondata = jQuery.parseJSON(jsdata);
            if (jsondata !== -1) {
                get_all_drv_acc();
            } else {
            }
        },
        error: function (data) {
            var test = '';
            HidePleaseWait();
        }
    });
    return false;
}

function get_all_drv_acc() {
    var prdId = getParameterByName('prdId');
    var url = window.webservicePath + "/GetProductDrvAcc";
    $('#div_all_driver').empty();
    $('#div_all_acc').empty();
    $('#div_all_opt').empty();
    $.ajax({
        type: "POST",
        url: url,
        contentType: "application/json; charset=utf-8",
        data: "{prdId:'" + prdId + "'}",
        dataType: "json",
        success: function (data) {
            var jsdata = data.d;
            var jsondata = jQuery.parseJSON(jsdata);
            if (jsondata !== -1) {
                var pitList = jsondata;
                var pitDrv = searchInArray(pitList, 'InvId', 1);
                var pitAcc = searchInArray(pitList, 'InvId', 2);
                var pitOpt = searchInArray(pitList, 'InvId', 3);

                // driver
                var allcontent = "<div class='row'>" +
                    "<label class='col-sm-3 control-label' style='text-align:center'>Nom</label>" +
                    "<label class='col-sm-3 control-label' style='text-align:center'>Réf</label>" +
                    "<label class='col-sm-3 control-label' style='text-align:center'>Prix</label>" +
                    "<div class='col-md-3'></div></div>";
                $.each(pitDrv, function (name, value) {
                    var tooltips = "";
                    var tooltipcount = value.PitAllInfo.length;
                    $.each(value.PitAllInfo, function (idx, info) {
                        if (idx === 0) {
                            tooltips += "<span>";
                        }
                        tooltips += info.PropName + " : " + info.PropValue + " " + info.PropUnit + "<br/>";
                        if (idx === tooltipcount - 1) {
                            tooltips += "</span>";
                        }
                    });
                    allcontent += "<div class='row new_tooltips'>" + tooltips;
                    allcontent += "<label class='col-sm-3 control-label' style='text-align:left'>" + value.PrdName + "</label>";
                    allcontent += "<label class='col-sm-3 control-label' style='text-align:left'>" + value.PitRef + "</label>";
                    allcontent += "<div class='col-sm-3'><input type='number' class='form-control' id='ip_price_" + value.PitId + "' value='" + value.PitPrice + "' min='0' step='0.1'></div>";
                    allcontent += "<div class='col-md-3' style='text-align:center'>" +
                        "<button class='btn btn-inverse' onclick='return update_drv_acc(" + value.PitId + ")'><i class='fa fa-arrow-circle-o-up'></i></button>" +
                        "<button class='btn btn-inverse' onclick='return DeleteDrvAccConfirm(" + value.PitId + ")'><i class='fa fa-times'></i></button>" +
                        "</div>" +
                        "</div>";
                });
                $('#div_all_driver').append(allcontent);

                // accessoiry
                var allcontent_acc = "<div class='row'>" +
                    "<label class='col-sm-3 control-label' style='text-align:center'>Nom</label>" +
                    "<label class='col-sm-3 control-label' style='text-align:center'>Réf</label>" +
                    "<label class='col-sm-3 control-label' style='text-align:center'>Prix</label>" +
                    "<div class='col-md-3'></div></div>";
                $.each(pitAcc, function (name, value) {
                    var tooltips = "";
                    var tooltipcount = value.PitAllInfo.length;
                    $.each(value.PitAllInfo, function (idx, info) {
                        if (idx === 0) {
                            tooltips += "<span>";
                        }
                        tooltips += info.PropName + " : " + info.PropValue + " " + info.PropUnit + "<br/>";
                        if (idx === tooltipcount - 1) {
                            tooltips += "</span>";
                        }
                    });
                    allcontent_acc += "<div class='row new_tooltips'>" + tooltips;
                    allcontent_acc += "<label class='col-sm-3 control-label' style='text-align:left'>" + value.PrdName + "</label>";
                    allcontent_acc += "<label class='col-sm-3 control-label' style='text-align:left'>" + value.PitRef + "</label>";
                    allcontent_acc += "<div class='col-sm-3'><input type='number' class='form-control' id='ip_price_" + value.PitId + "' value='" + value.PitPrice + "' min='0' step='0.1'></div>";
                    allcontent_acc += "<div class='col-md-3' style='text-align:center'>" +
                        "<button class='btn btn-inverse' onclick='return update_drv_acc(" + value.PitId + ")'><i class='fa fa-arrow-circle-o-up'></i></button>" +
                        "<button class='btn btn-inverse' onclick='return DeleteDrvAccConfirm(" + value.PitId + ")'><i class='fa fa-times'></i></button>" +
                        "</div>" +
                        "</div>";
                });
                $('#div_all_acc').append(allcontent_acc);

                // option
                var allcontent_opt = "<div class='row'>" +
                    "<label class='col-sm-3 control-label' style='text-align:center'>Nom</label>" +
                    "<label class='col-sm-3 control-label' style='text-align:center'>Réf</label>" +
                    "<label class='col-sm-3 control-label' style='text-align:center'>Prix</label>" +
                    "<div class='col-md-3'></div></div>";
                $.each(pitOpt, function (name, value) {
                    var tooltips = "";
                    var tooltipcount = value.PitAllInfo.length;
                    $.each(value.PitAllInfo, function (idx, info) {
                        if (idx === 0) {
                            tooltips += "<span>";
                        }
                        tooltips += info.PropName + " : " + info.PropValue + " " + info.PropUnit + "<br/>";
                        if (idx === tooltipcount - 1) {
                            tooltips += "</span>";
                        }
                    });
                    allcontent_opt += "<div class='row new_tooltips'>" + tooltips;
                    allcontent_opt += "<label class='col-sm-3 control-label' style='text-align:left'>" + value.PrdName + "</label>";
                    allcontent_opt += "<label class='col-sm-3 control-label' style='text-align:left'>" + value.PitRef + "</label>";
                    allcontent_opt += "<div class='col-sm-3'><input type='number' class='form-control' id='ip_price_" + value.PitId + "' value='" + value.PitPrice + "' min='0' step='0.1'></div>";
                    allcontent_opt += "<div class='col-md-3' style='text-align:center'>" +
                        "<button class='btn btn-inverse' onclick='return update_drv_acc(" + value.PitId + ")'><i class='fa fa-arrow-circle-o-up'></i></button>" +
                        "<button class='btn btn-inverse' onclick='return DeleteDrvAccConfirm(" + value.PitId + ")'><i class='fa fa-times'></i></button>" +
                        "</div>" +
                        "</div>";
                });
                $('#div_all_opt').append(allcontent_opt);

            } else {
            }
        },
        error: function (data) {
            var test = '';
        }
    });
}

function DeleteDrvAccConfirm(pitId) {
    MsgPopUpWithResponseChoice('ATTENTION', 'Confirmez-vous la suppression', 'Supprimer', 'DeleteDrvAcc(' + pitId + ')', 'Annuler');
    return false;
}

function update_drv_acc(pitId) {
    var price = $('#ip_price_' + pitId).val();
    price = price.replace(',', '.');
    price = price * 1;
    var mainPrdId = getUrlVars()['prdId'];


    var jsondata = JSON.stringify({ prdMainId: mainPrdId, prdRefId: 0, pitRefId: pitId, type: 0, price: price });
    var url = window.webservicePath + "/CreateUpdateDrvAcc";
    ShowPleaseWait();
    closeDialog();
    $.ajax({
        type: "POST",
        url: url,
        contentType: "application/json; charset=utf-8",
        data: jsondata,
        dataType: "json",
        success: function (data) {
            HidePleaseWait();
            var jsdata = data.d;
            var jsondata = jQuery.parseJSON(jsdata);
            if (jsondata !== -1) {
                get_all_drv_acc();
            } else {
            }
        },
        error: function (data) {
            var test = '';
            HidePleaseWait();
        }
    });
    return false;
}


function DeleteDrvAcc(pitId) {
    ShowPleaseWait();
    var prdId = getParameterByName('prdId');
    var jsondata = JSON.stringify({ prdMainId: prdId, pitRefId: pitId });
    var url = window.webservicePath + "/DeleteDrvAcc";
    ShowPleaseWait();
    $.ajax({
        type: "POST",
        url: url,
        contentType: "application/json; charset=utf-8",
        data: jsondata,
        dataType: "json",
        success: function (data) {
            get_all_drv_acc();
            HidePleaseWait();
        },
        error: function (data) {
            var test = '';
            HidePleaseWait();
        }
    });
    return false;
}


//2024-07-28 Download Bulk Template
function LoadPrdAttr(fordownload) {
    ShowPleaseWait();
    var url = window.webservicePath + "/LoadProduitAttributeById";
    var ptyId = $('#PtyId').find('option:selected').attr('data-value');
    var jsondata = JSON.stringify({ ptyId: ptyId });
    $.ajax({
        type: "POST",
        url: url,
        contentType: "application/json; charset=utf-8",
        data: jsondata,
        dataType: "json",
        success: function (data) {
            var jsdata = data.d;
            var jsondata = jQuery.parseJSON(jsdata);
            //console.log(jsondata);
            if (fordownload === 1) {
                downloadbulkfile(jsondata);
            } else {
                AddProductParLots(jsondata);
            }
            HidePleaseWait();
        },
        error: function (data) {
            var test = '';
            HidePleaseWait();
        }
    });
    return false;
}

var ptyPropCount = 0;

function downloadbulkfile(prdtype) {
    try {
        if (!jQuery.isEmptyObject(prdtype)) {
            //console.log(prdtype.PropertyNames);
            var props = prdtype.PropertyNames;
            props = searchInArray(props, 'PropIsSameValue', false);
            props = searchInArray(props, 'PropIsImage', false);
            props = props.sort(dynamicSort('PropSubOrder'));
            var colcount = props.length;

            var checkboxstyle = 'width: 30px; height:30px;';
            var data_type = 'data:application/vnd.ms-excel';
            var tab_text = '<html xmlns:x="urn:schemas-microsoft-com:office:excel">';
            tab_text += '<head><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet>';
            tab_text += '<x:Name>批量插入模板 Modèles insérés en masse</x:Name>';

            tab_text += '<x:WorksheetOptions><x:Panes></x:Panes></x:WorksheetOptions></x:ExcelWorksheet>';
            tab_text += '</x:ExcelWorksheets></x:ExcelWorkbook></xml></head><body>';
            tab_text += "<table border='1px'>";
            var nmlHeight = " height : 30px;display:table-cell; vertical-align:middle; font-size: 13px;";
            var nmlHeightRed = " height : 30px;display:table-cell; vertical-align:middle; font-size: 13px;color:red;";
            var nmlHeightBold = " height : 30px;display:table-cell; vertical-align:middle; font-size: 13px;font-weight: bold;background-color:#f5f5f5";
            var height60 = " height : 80px;display:table-cell; vertical-align:middle; font-size: 16px;";
            var nmlWidth = " width : 120px;display:table-cell; vertical-align:middle;";
            var textcenter = " text-align: center;";
            var bold = "font-weight:bold;";
            var nmlWidth2 = " width : 240px;display:table-cell; vertical-align:middle;";
            var bggreen = "background-color:#c6efce; color:#006100;";
            var bgyellow = "background-color:#ffeb9c; color:#9c5700;";
            var bgred = "background-color:#ffc7ce; color:#9c0006;";
            var thstyle = "text-align:left;";
            var rainbow1 = "#9195F6";
            var rainbow2 = "#B7C9F2";
            var rainbow3 = "#F9F07A";
            var rainbow4 = "#FB88B4";
            ptyPropCount = colcount + 3;
            var titleline = "<tr><th style='" + thstyle + "'>Type de produit</th><th style='" + thstyle + "'>" + prdtype.PtyName + "</th></tr>";
            titleline += "<tr><th style='" + thstyle + "'>Nom de produit</th><th style='" + thstyle + "'>" + curentProduct.PrdName + "</th></tr>";
            titleline += "<tr><th style='" + thstyle + "'>Famille de produit</th><th style='" + thstyle + "'>" + curentProduct.PrdSubName + "</th></tr>";
            titleline += "<tr><th style='" + thstyle + "'>Référence</th><th style='" + thstyle + "background-color:" + rainbow1 + "; color:#ffffff'>" + curentProduct.PrdRef + "</th></tr>";
            tab_text += titleline;
            tab_text += "<tr><th colspan='" + ptyPropCount + "' style='height: 30px; font-size: medium; background-color:#E8F2FF;text-align:left;'>以下内容是产品详情，每个产品占用一行，请按照产品属性以此填入产品详情，并从<span style='color:red;'>第十二行</span>开始复制。</th></tr>";
            tab_text += "<tr><th colspan='" + ptyPropCount + "' style='height: 30px; font-size: medium; background-color:#E8F2FF;text-align:left;'>Le contenu suivant correspond aux détails du produit. Chaque produit occupe une ligne. Veuillez remplir les détails du produit en fonction des attributs du produit et les copier à partir de <span style='color:red;'>LA DOUZIÈME LIGNE</span>.</th></tr>";

            tab_text += "<tr><th colspan='" + ptyPropCount + "' style='height: 20px; font-size: small; background-color:#f5f5f5;color:red;text-align:left;'>注意：该文件是XML格式，如果一次没有添加完，请务必另存为xslx的文件，否则所有编辑的内容将会丢失！</th></tr>";
            tab_text += "<tr><th colspan='" + ptyPropCount + "' style='height: 20px; font-size: small; background-color:#f5f5f5;color:red;text-align:left;'>ATTENTION : Ce fichier est au format XML. Si vous n'avez pas fini de l'ajouter immédiatement, assurez-vous de l'enregistrer en tant que fichier xslx, sinon tout le contenu modifié sera perdu !</th></tr>";

            var propnameline = "<td style='" + nmlHeight + textcenter + bold + "'>LA RÉFÉRENCE DE PRODUIT</td><td style='" + nmlHeight + textcenter + bold + "'>PRIX D'ACHAT</td><td style='" + nmlHeight + textcenter + bold + "'>PRIX DE VENTE</td>";

            var proptypeline = (IsNullOrEmpty(curentProduct.PrdRef)) ? "<td style='" + nmlHeight + textcenter + bold + "'>LA RÉFÉRENCE DE PRODUIT</td>" :
            ("<td style='height : 120px;vertical-align:middle;'>Le numéro de modèle du produit ajouté commencera automatiquement par <span style='color:" + rainbow1 + "'>" + curentProduct.PrdRef + "</span>, il n'est donc pas nécessaire d'ajouter <span style='color:" + rainbow1 + "'>" + curentProduct.PrdRef + "</span> devant le numéro de modèle. 所添加的产品型号将会自动以《<span style='color:" + rainbow1 + "'>" + curentProduct.PrdRef + "</span>》为开头，所以不用再在型号前面添加《<span style='color:" + rainbow1 + "'>" + curentProduct.PrdRef + "</span>》。</td>");
            proptypeline += "<td style='" + nmlHeight + textcenter + bold + "'>采购价</td><td style='" + nmlHeight + textcenter + bold + "'>销售价</td>";

            var propNullableline = "<td style='" + nmlHeightRed + "'>Mandatory/Obligatoire: YES</td><td style='vertical-align:middle;'>Mandatory/Obligatoire: NO</td><td style='vertical-align:middle;'>Mandatory/Obligatoire: NO</td>";

            var propGuidLine = "<td style='" + nmlHeightBold + "'>LA RÉFÉRENCE DE PRODUIT</td><td style='" + nmlHeightBold + "'>PRIX D'ACHAT</td><td style='" + nmlHeightBold + "'>PRIX DE VENTE</td>";

            var proptypes = [];
            proptypes.push({ key: "1", value: "String" });
            proptypes.push({ key: "2", value: "Nombre entier" });
            proptypes.push({ key: "3", value: "Décimal" });
            proptypes.push({ key: "4", value: "DateTime" });
            proptypes.push({ key: "5", value: "Boolean" });
            //console.log(proptype);
            $.each(props, function (name, value) {
                propnameline += "<td style='" + nmlHeight + textcenter + bold + "'>" + value.PropName + (IsNullOrEmpty(value.PropUnit) ? "" : " (" + value.PropUnit + ")") + "</td>";
                proptypeline += "<td style='" + nmlHeight + "'>" + searchFieldValueInArray(proptypes, 'key', value.PropType).value + "</td>";
                propNullableline += "<td style='" + (value.PropIsNullable ? nmlHeight : nmlHeightRed) + "'>Mandatory/Obligatoire: " + (value.PropIsNullable ? "NO" : "YES") + "</td>";
                propGuidLine += "<td style='" + nmlHeightBold + "'>" + value.PropGuid + "</td>";
            });
            tab_text += "<tr>" + propnameline + "</tr>";
            tab_text += "<tr>" + proptypeline + "</tr>";
            tab_text += "<tr>" + propNullableline + "</tr>";
            tab_text += "<tr>" + propGuidLine + "</tr>";

            tab_text += '</table></body></html>';
            var csv_content = tab_text,
                download = document.createElement("a"),
                blob = new Blob(["\ufeff", tab_text], {
                    type: "application/csv;charset=ISO-8859-1;"
                });
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
            today = yyyy + mm + dd;
            var datetime = "-V" + today;
            download.href = window.URL.createObjectURL(blob);
            download.download = curentProduct.PrdName + (IsNullOrEmpty(curentProduct.PrdRef) ? "" : "-" + curentProduct.PrdRef) + "-批量插入模板 Modèles insérés en masse" + datetime + ".xls";
            var event = document.createEvent("MouseEvents");
            event.initMouseEvent(
                "click", true, false, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null
            );
            download.dispatchEvent(event);
        }
    } catch (e) {

    }
    HidePleaseWait();
}

function AddProductParLots(jsondata) {

    var props = jsondata.PropertyNames;
    props = searchInArray(props, 'PropIsSameValue', false);
    props = searchInArray(props, 'PropIsImage', false);
    props = props.sort(dynamicSort('PropSubOrder'));
    var colcount = props.length;
    ptyPropCount = colcount + 3;
    var startBox = "<div class='box'><div class='box-body'>";
    var endBox = "</div></div>";

    var onelineContent =
    // start box
                    "<div class='form-group' id='div_one_line'>" +
                        "<div class='row'>" +
                        "<div class='col-md-12'>" +
                        "<div class='box-body'>" +
                        "<div class='form-horizontal'>" +
                        "<div class='form-group'><label class='col-sm-12' style='text-align:center'>Veuillez coller les contenues d'excel en bas<br/>请将Excel表格内容复制到下面<button type='button' class='btn btn-xs btn-inverse' title='Cliquez sur cette icône pour télécharger le modèle Excel 点击该图标下载Excel模板' onclick='return LoadPrdAttr(1)'><i class='fa fa-file-text-o'></i></button></label></div>" +
                        "<div class='form-group'>" +
                        "<div class='col-sm-12'><textarea row='8' id='PrdExpressContent' class='form-control' style='height:400px'></textarea></div>" +
                        "</div>" +
    // close box
                        "</div></div></div></div></div>";

    var btnAddUpdate = "<button class='btn btn-inverse' id='btn_add_pit_lot' name='btn_add_sols'  onclick='return CreatePrdFromExcel(this)'><span>Sauvegarder</span></button>";
    var btnClose = "<button class='btn btn-default bootbox-close-button' id='btn_close_add_pit_lot' onclick='return false'><span>Annuler</span></button>";

    var btns = "<div class='modal-body center'>" + btnClose + btnAddUpdate + "</div>";
    var onecontent = startBox + onelineContent + btns + endBox;

    var title = 'Insérer des instances de produit par lots';
    bootbox.dialog({
        title: title,
        message: onecontent
    }).find('.modal-dialog').css({
        'width': '90%'
    }).find('.modal-content').css({
        'margin-top': function () {
            var w = $(window).height();
            var b = $(".modal-dialog").height();
            // should not be (w-h)/2
            var h = (w - b) * 0.15;
            return h + "px";
        }
    }).find('.modal-header').css({
        'background': 'url(../../img/menu_005_bg.jpg) repeat-x',
        'text-align': 'center',
        'color': '#C0C0C0'
    });

    return false;
}

function CreatePrdFromExcel() {
    ShowPleaseWait();
    var prdId = getUrlVars()['prdId'];
    var content = $('#PrdExpressContent').val();
    if (!IsNullOrEmpty(content)) {
        var pitLines = content.split('\n');
        var alllinecout = pitLines.length;
        if (alllinecout !== 0) {
            var checkfiledcount = pitLines[0].split('\t').length;
            if (checkfiledcount !== ptyPropCount) {
                HidePleaseWait();
                alert('Format error, les informations ne correspondent pas !<br/>信息不符 ！');
            } else {
                treatPitByLotAndInsert(pitLines);
            }
        } else {
            HidePleaseWait();
            alert('Format error !<br/>格式错误 ！');
        }
    } else {
        HidePleaseWait();
        alert('Veuillez remplir le TEXTAREA !<br/>请填写内容 ！');
    }
    return false;
}

function treatPitByLotAndInsert(pitLines) {
    var prdId = getUrlVars()['prdId'];
    var pit2Insert = [];
    var propguid = [];
    var lineCount = pitLines.length;
    // treat guid
    var guidLine = pitLines[0].split('\t');
    for (var i = 0; i < ptyPropCount; i++) {
        var oneprop = { order: i, guid: guidLine[i] };
        propguid.push(oneprop);
    }
    //console.log(propguid);
    // treat pit prop
    for (var j = 1; j < lineCount; j++) {
        var onePit = {};
        var onepitline = pitLines[j];
        var pitprops = onepitline.split('\t');
        var pitpropsLen = pitprops.length;
        if (pitpropsLen >= 3) {
            onePit.PitRef = pitprops[0];
            var buyprice = pitprops[1] + '';
            buyprice = replaceAll(buyprice, '€', '');
            buyprice = buyprice.replace(/\$/g, ''); //replaceAll(up, '$', '');
            buyprice = replaceAll(buyprice, ' ', '');
            buyprice = buyprice.replace(',', '.') * 1;
            onePit.PitPurchasePrice = buyprice;
            var sellprice = pitprops[2] + '';
            sellprice = replaceAll(sellprice, '€', '');
            sellprice = sellprice.replace(/\$/g, ''); //replaceAll(up, '$', '');
            sellprice = replaceAll(sellprice, ' ', '');
            sellprice = sellprice.replace(',', '.') * 1;
            onePit.PitPrice = sellprice;

            var pitAllInfo = [];
            for (var k = 3; k < pitpropsLen; k++) {
                var checkProp = searchFieldValueInArray(propguid, 'order', k);
                if (!IsNullOrEmpty(checkProp)) {
                    var propertyvalue = {};
                    propertyvalue.PropValue = pitprops[k];
                    propertyvalue.PropGuid = checkProp.guid;
                    pitAllInfo.push(propertyvalue);
                }
            }
            onePit.PitAllInfo = pitAllInfo;
            pit2Insert.push(onePit);
        }
    }
    //console.log(pit2Insert);
    if (!IsNullOrEmpty(prdId) && pit2Insert.length > 0) {
        var jsondata = JSON.stringify({ prdId: prdId, lines: pit2Insert });
        var url = window.webservicePath + "/CreateProductFromExcel";
        $.ajax({
            url: url,
            type: 'POST',
            contentType: 'application/json; charset=utf-8',
            data: jsondata,
            dataType: 'json',
            success: function (data) {
                var jsdata = data.d;
                var data2Treat = jQuery.parseJSON(jsdata);
                HidePleaseWait();
                if (data2Treat !== '-1') {
                    if (data2Treat !== '0') {
                        currentInstanceList = [];
                        currentInstanceList = data2Treat;
                        ShowProductMode(data2Treat);
                        $('#btn_close_add_pit_lot').click();
                        HidePleaseWait();
                    } else {
                        HidePleaseWait();
                        alert('Veuillez contacter l\'administrateur, 请联系管理员');
                    }
                } else {
                    HidePleaseWait();
                    // authentication error
                    AuthencationError();
                }
            },
            error: function (data) {
                HidePleaseWait();
                alert(data.responseText);
            }
        });

    } else {
        HidePleaseWait();
        alert('Erreur de traitement du format !<br/>格式处理出错！');
    }
    //HidePleaseWait();
}