$(document).ready(initFunc);

var disabled = _isView ? ' disabled ' : '';

function initFunc() {
    getProductTypes();
    js_GetAllSuppliers('SupId');
}
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

        //$('#div_attr_general').show();
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
        //$('#div_attr_general').hide();
    }
}

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

var allSupplier = [];
function js_GetAllSuppliers(elementId) {
    var url = window.webservicePath + "/GetAllSuppliers";
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
                $(budgetId).append($("<option></option>").attr("data-value", "0").attr("value", "0").text("Veuillez sélectionner un fournisseur"));
                allSupplier = [];
                allSupplier = data2Treat;
                $.each(data2Treat, function (name, value) {
                    $(budgetId)
                        .append($("<option></option>")
                            .attr("data-value", value.FId)
                            .attr("value", value.Id)
                            .text(value.CompanyName)
                            );
                });
                //setClientByPrjId();
            } else {
                // authentication error
                AuthencationError();
            }
        },
        error: function (data) {
            var test = '';
        }
    });
}


function colorClick(sender) {
    var colid = $(sender).attr('colid');
    if ($(sender).is(':checked')) {
        $('#ip_' + colid).prop("disabled", false);
    } else {
        $('#ip_' + colid).val('');
        $('#ip_' + colid).prop("disabled", true);
    }
    return false;
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


function js_create_update_product() {
    var checkOK = CheckRequiredFieldInOneDiv('div_product_page');
    if (checkOK) {
        ShowPleaseWait();
        var FId = getParameterByName('prdId');
        var PtyId = $('#PtyId option:selected').val();
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

        onePrd.SupId = $('#SupId').val() * 1;

        var listExp = [];

        // température couleur
        if ($('#cbx_2700').is(':checked')) {
            var keyvalue = {};
            keyvalue.Key = 1;
            keyvalue.Value = 2700;
            keyvalue.Value2 = $('#ip_2700').val();
            listExp.push(keyvalue);
        }
        if ($('#cbx_3000').is(':checked')) {
            var keyvalue = {};
            keyvalue.Key = 1;
            keyvalue.Value = 3000;
            keyvalue.Value2 = $('#ip_3000').val();
            listExp.push(keyvalue);
        }
        if ($('#cbx_4000').is(':checked')) {
            var keyvalue = {};
            keyvalue.Key = 1;
            keyvalue.Value = 4000;
            keyvalue.Value2 = $('#ip_4000').val();
            listExp.push(keyvalue);
        }
        if ($('#cbx_4500').is(':checked')) {
            var keyvalue = {};
            keyvalue.Key = 1;
            keyvalue.Value = 4500;
            keyvalue.Value2 = $('#ip_4500').val();
            listExp.push(keyvalue);
        }
        if ($('#cbx_5000').is(':checked')) {
            var keyvalue = {};
            keyvalue.Key = 1;
            keyvalue.Value = 5000;
            keyvalue.Value2 = $('#ip_5000').val();
            listExp.push(keyvalue);
        }
        if ($('#cbx_5500').is(':checked')) {
            var keyvalue = {};
            keyvalue.Key = 1;
            keyvalue.Value = 5500;
            keyvalue.Value2 = $('#ip_5500').val();
            listExp.push(keyvalue);
        }
        if ($('#cbx_6000').is(':checked')) {
            var keyvalue = {};
            keyvalue.Key = 1;
            keyvalue.Value = 6000;
            keyvalue.Value2 = $('#ip_6000').val();
            listExp.push(keyvalue);
        }
        if ($('#cbx_6500').is(':checked')) {
            var keyvalue = {};
            keyvalue.Key = 1;
            keyvalue.Value = 6500;
            keyvalue.Value2 = $('#ip_6500').val();
            listExp.push(keyvalue);
        }
        if ($('#cbx_rgb').is(':checked')) {
            var keyvalue = {};
            keyvalue.Key = 1;
            keyvalue.Value = 'rgb';
            listExp.push(keyvalue);
        }

        // couleur de produit
        if ($('#ip_col_white').is(':checked')) {
            var keyvalue = {};
            keyvalue.Key = 2;
            keyvalue.Value = 'BLANC';
            keyvalue.Value2 = 'WH';
            listExp.push(keyvalue);
        }
        if ($('#ip_col_black').is(':checked')) {
            var keyvalue = {};
            keyvalue.Key = 2;
            keyvalue.Value = 'NOIR';
            keyvalue.Value2 = 'BK';
            listExp.push(keyvalue);
        }
        if ($('#ip_col_grey').is(':checked')) {
            var keyvalue = {};
            keyvalue.Key = 2;
            keyvalue.Value = 'GRIS';
            keyvalue.Value2 = 'GY';
            listExp.push(keyvalue);
        }
        if ($('#ip_col_orange').is(':checked')) {
            var keyvalue = {};
            keyvalue.Key = 2;
            keyvalue.Value = 'ORANGE';
            keyvalue.Value2 = 'OR';
            listExp.push(keyvalue);
        }
        if ($('#ip_col_green').is(':checked')) {
            var keyvalue = {};
            keyvalue.Key = 2;
            keyvalue.Value = 'VERT';
            keyvalue.Value2 = 'GN';
            listExp.push(keyvalue);
        }

        // opération
        if ($('#ip_opr_normal').is(':checked')) {
            var keyvalue = {};
            keyvalue.Key = 3;
            keyvalue.Value = 'NORMAL';
            keyvalue.Value2 = 'N';
            listExp.push(keyvalue);
        }
        if ($('#ip_opr_dimmable').is(':checked')) {
            var keyvalue = {};
            keyvalue.Key = 3;
            keyvalue.Value = 'DIMMABLE';
            keyvalue.Value2 = 'D';
            listExp.push(keyvalue);
        }
        if ($('#ip_opr_dali').is(':checked')) {
            var keyvalue = {};
            keyvalue.Key = 3;
            keyvalue.Value = 'DALI';
            keyvalue.Value2 = 'L';
            listExp.push(keyvalue);
        }
        if ($('#ip_opr_dg').is(':checked')) {
            var keyvalue = {};
            keyvalue.Key = 3;
            keyvalue.Value = 'DIMMABLE GRADABLE';
            keyvalue.Value2 = 'G';
            listExp.push(keyvalue);
        }

        onePrd.ExpressProps = listExp;

        var jsondata = JSON.stringify({ oneProduct: onePrd });
        $.ajax({
            url: 'ProductExpress.aspx/CreateUpdateProductExpress',
            type: 'POST',
            contentType: 'application/json; charset=utf-8',
            data: jsondata,
            dataType: 'json',
            success: function (data) {
                var prdId = data.d;
                var url = 'Product.aspx';
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

function PrdRefChange(sender) {
    var prdref = $(sender).val();
    var url = window.webservicePath + "/CheckProductRefExisted";

    var jsondata = JSON.stringify({ prdRef: prdref });
    $.ajax({
        url: url,
        type: 'POST',
        contentType: 'application/json; charset=utf-8',
        data: jsondata,
        dataType: 'json',
        success: function (data) {
            var existed= data.d;
            if (existed) {
                MsgErrorPopUp('ATTENTION','La référence a déjà existé ! ');
            }
        },
        error: function (data) {
        }
    });

}