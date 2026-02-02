$(document).ready(init);

var productTypes = [];
function js_getProductTypes() {
    var url = window.webservicePath + "/GetProductTypes";
    $.ajax({
        type: "POST",
        url: url,
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        data : '{selectedType:0}',
        success: function (data) {
            var jsdata = data.d;
            var data2Treat = jQuery.parseJSON(jsdata);
            if (data2Treat !== '-1') {
                productTypes = [];
                productTypes = data2Treat;
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

function init() {
    js_getProductTypes();
    js_getAllCurrency('CurId');

    var supId = getUrlVars()['supId'];
    if (supId) {
        js_LoadSupplier();
        //loadSprs();
    } else {
        js_GetAllSuppliers('SupId');
    }
    initMode();


    SetLanguageBar();
}

var allSprForSup = [];

function loadSprs() {
    var supId = getUrlVars()['supId'];
    if (supId) {
        var url = window.webservicePath + "/GetProductsBySupId";
        var datastr = "{supId:'" + supId + "'}";
        $.ajax({
            type: "POST",
            url: url,
            contentType: "application/json; charset=utf-8",
            data: datastr,
            dataType: "json",
            success: function(data) {
                var jsdata = data.d;
                var data2Treat = jQuery.parseJSON(jsdata);
                if (data2Treat !== '-1') {
                    allSprForSup = [];
                    allSprForSup = data2Treat;
                    setSupplierProducts(data2Treat);
                } else {
                    // authentication error
                    AuthencationError();
                }
            },
            error: function(data) {
                var test = '';
            }
        });
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

function js_LoadSupplier() {
    var url = window.webservicePath + "/LoadSupplierById";
    var budgetId = '#SupId';
    var supId = getUrlVars()['supId'];
    var datastr = "{supId:'" + supId + "'}";
    $.ajax({
        type: "POST",
        url: url,
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        data : datastr,
        success: function (data) {
            var jsdata = data.d;
            var data2Treat = jQuery.parseJSON(jsdata);
            if (data2Treat !== '-1') {
                $(budgetId).empty();
                allSupplier = [];
                allSupplier.push(data2Treat);
                $.each(allSupplier, function (name, value) {
                    $(budgetId).append($("<option></option>").attr("data-value", value.FId).attr("value", value.Id).text(value.CompanyName));
                });
                $(budgetId).change();
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

function SupplierChanged(sender) {
    var supId = $(sender).val();
    if (supId !== 0) {
        var onesupplier = searchFieldValueInArray(allSupplier, 'Id', supId * 1);
        if (!jQuery.isEmptyObject(onesupplier)) {
            $.each(onesupplier, function (name, value) {
                var newname = name;
                setFieldValue(newname, value, true);
            });
            $('#btn_create_product').show();
            loadSprs();

        } else {
            emptyAllField();
            $('#btn_create_product').hide();
        }
    } else {
        emptyAllField();
    }
}

function emptyAllField() {
    var allDiv = $('div[id="div_supplier"] :input[disabled]');
    $.each(allDiv, function (name, value) {
        $(value).val('');
    });
}

function GetProductOfSupplier() {
    var url = window.webservicePath + "/GetProductsBySupId";
    var supId = $('#SupId :selected').attr('data-value');
    $.ajax({
        type: "POST",
        url: url,
        contentType: "application/json; charset=utf-8",
        data: "{supId:'" + supId + "'}",
        dataType: "json",
        success: function (data) {
            var jsdata = data.d;
            var jsondata = jQuery.parseJSON(jsdata);
            if (jsondata !== '-1') {

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

var hasSet = false;
function setSupplierProducts(prds) {
    var headerFooter = "<tr>" +
        "<th>Type</th>" +
        "<th>Leur Réf</th>" +
        "<th>Notre Réf</th>" +
        "<th>Devise</th>" +
        "<th>Prix Normal</th>" +
        "<th>Prix Dimmable</th>" +
        "<th>Prix Dali</th>" +
        "</tr>";

    var name = '_spds';
    var dt_name = 'dt' + name;
    var div_name = 'div' + name;
    var th_name = 'th' + name;
    var tb_name = 'tb' + name;
    var tf_name = 'tf' + name;
    var rst_name = 'rst' + name;

    try {
        $('#' + dt_name).remove();
        var datatableContent = "<table id='" + dt_name + "' cellpadding='0' cellspacing='0' border='0' class='datatable table table-striped table-bordered table-hover'>" +
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
    var resultcount = prds.length;
    $('#' + rst_name).text(resultcount);
    if (resultcount > 0) {
        $('.searchresult').show();
        $('#mask_processing').text(resultcount + ' resultats ...');
        $('#mask_processing').val(resultcount + ' resultats ...');

        $('#' + th_name).empty();
        $('#' + tf_name).empty();

        $('#' + th_name).append(headerFooter);
        $('#' + tf_name).append(headerFooter);

        var titles = new Array();
        titles.push({ "sTitle": "Type" });
        titles.push({ "sTitle": "Ref1" });
        titles.push({ "sTitle": "Ref2" });
        titles.push({ "sTitle": "Devise" });
        titles.push({ "sTitle": "Prix1" });
        titles.push({ "sTitle": "Prix100" });
        titles.push({ "sTitle": "Prix500" });

        var displaycount = 1;
        $.each(prds, function(name, value) {
            $('#mask_processing').text('Traitement en cours ' + displaycount + '/' + resultcount);
            $('#mask_processing').val('Traitement en cours ' + displaycount + '/' + resultcount);
            var dataArray = new Array();
            dataArray.push(value.PrdType);
            dataArray.push("<span  onclick='viewItem(\"" + value.FId + "\")' style='color:red;cursor:pointer' title='"+value.SprComment+"'>" + value.SprPrdRef + "</span>");
            dataArray.push("<span  onclick='viewItem(\"" + value.FId + "\")' style='color:red;cursor:pointer' title='"+value.SprComment+"'>" + value.PrdRef + "</span>");
            dataArray.push(value.Currency);
            dataArray.push(value.SprPrice_1_100);
            dataArray.push(value.SprPrice_100_500);
            dataArray.push(value.SprPrice_500_plus);
            try {
                $('#' + dt_name).dataTable().fnAddData(dataArray);
            } catch (e) {
                var test = '';
            }
            displaycount++;
        });


        if (hasSet) {
            try {

                $('#' + dt_name).dataTable({
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
        } catch (e) {

        }
    }
    myApp.hidePleaseWait();
}

function viewItem(FId) {
    //alert(FId);
    var onespr = searchFieldValueInArray(allSprForSup, 'FId', FId);
    if (!jQuery.isEmptyObject(onespr)) {
        setProduct(onespr);
    }
}

function createProduct() {
    var supId = $('#SupId :selected').val() * 1;
    if (supId !== 0) {
        setProduct();
    } else {
    }
}

function setProduct(prd) {
    var item = Object();
    if (!jQuery.isEmptyObject(prd)) {
        item = prd;
    }

    var contentStart = "<div class='box'><div class='box-body'>";
    var contentPrdGeneral = "<div class='form-horizontal'>" +
        "<div class='form-group'>" +
        "<label class='col-sm-1 control-label'>Fournisseur</label><div class='col-sm-3'><input class='form-control' id='SupplierName' value='" + $('#SupId :selected').text() + "' name='SupplierName' required='' disabled='' /></div>" +
        "<label class='col-sm-1 control-label' style='display:none;'>Type de produit</label><div class='col-sm-3'  style='display:none;'><select class='form-control' id='PtyId' name='PtyId' required=''></select></div>" +
        "<label class='col-sm-1 control-label'>Notre Référence</label><div class='col-sm-3'><input class='form-control' id='PrdRef' name='PrdRef' type='text' placeholder='Nom de produit' required='' maxlength='200' autocomplete='on'></div>" +
        "<label class='col-sm-1 control-label'>Leur Réf</label><div class='col-sm-3'><input type='text' class='form-control' id='SprPrdRef' name='SprPrdRef' ></div>" +
        "</div>" +
        "<div class='form-group'>" +
        "<label class='col-sm-1 control-label'>Prix Normal</label><div class='col-sm-3'><input type='number' class='form-control' id='SprPrice_1_100' name='SprPrice_1_100' ></div>" +
        "<label class='col-sm-1 control-label'>Prix Dimmable</label><div class='col-sm-3'><input type='number' class='form-control' id='SprPrice_100_500' name='SprPrice_100_500' ></div>" +
        "<label class='col-sm-1 control-label'>Prix Dali</label><div class='col-sm-3'><input type='number' class='form-control' id='SprPrice_500_plus' name='SprPrice_500_plus' ></div>" +
        "</div>" +
        "<div class='form-group'>" +
        "<label class='col-sm-1 control-label'>Commentaire</label><div class='col-sm-11'><textarea rows='3' class='form-control' id='SprComment' name='SprComment'></textarea></div>" +
        "</div>" +
        "<div class='form-group'>" +
        "<label class='col-sm-1 control-label'>Nom du produit</label><div class='col-sm-3'><input type='text' class='form-control' id='PrdName' name='PrdName' disabled=''></div>" +
        "<label class='col-sm-1 control-label'>Code du produit</label><div class='col-sm-3'><input type='text' class='form-control' id='PrdCode' name='PrdCode' disabled=''></div>" +
        "<label class='col-md-1 control-label'>Description</label><div class='col-md-3'><textarea rows='3' cols='5' name='PrdDescription' class='form-control' id='PrdDescription'disabled=''></textarea></div>" +
        "</div>" +
        "</div>";

    var btnText = !jQuery.isEmptyObject(item) ? "Mettre à jour" : "AJOUTER";
    var btnDelete = !jQuery.isEmptyObject(item) ?
     "<button type='button' class='btn btn-inverse' sprId='" + (!jQuery.isEmptyObject(item) ? item.FId : 0) + "' id='btn_delete' onclick='return deleteSprClick(this)'>Supprimer</button>"
     : "";
    var contentPrdAttrs = "<div class='form-horizontal'><div class='form-group' id='div_prd_attrs'></div></div>";
    var contentBtns = "<div class='form-horizontal'><div class='form-group'><div class='col-sm-12'><div class='modal-body center'>" +
        "<button type='button' class='btn btn-default bootbox-close-button' id='btn_close' onclick='return false'>Annuler</button>" +
        btnDelete+
        "<button type='button' class='btn btn-inverse' id='btn_add_product' sprId='" + (!jQuery.isEmptyObject(item) ? item.FId : 0) + "' onclick='return AddProduct(this)'style='display: none;'>" + btnText + "</button>" +
        "</div></div></div></div>";
    var contentEnd = "</div></div>";

    var allcontent = contentStart + contentPrdGeneral + contentPrdAttrs + contentBtns + contentEnd;

    var title = !jQuery.isEmptyObject(item) ? "Mis à jour" : "AJOUTER";
    bootbox.dialog({
        title: title,
        message: allcontent
    }).find('.modal-dialog').css({
        'width': '90%'
    }).find('.modal-content').css({
        'margin-top': function() {
            var w = $(window).height();
            var b = $(".modal-dialog").height();
            // should not be (w-h)/2
            var h = (w - b) * 0.1;
            return h + "px";
        }
    }).find('.modal-header').css({
        'background': 'url(../../img/menu_005_bg.jpg) repeat-x',
        'text-align': 'center',
        'color': '#C0C0C0'
    });

    if (productTypes.length > 0) {
        $('#PtyId').empty();
        $.each(productTypes, function(name, value) { $('#PtyId').append($("<option></option>").attr("value", value.Key).text(value.Value)); });
    }
    if (!jQuery.isEmptyObject(item)) {
        $('#PtyId').val(item.PtyId);
        $('#PrdRef').val(item.PrdRef);
        $('#PrdName').val(item.PrdName);

        $('#PtyId').attr('disabled', '');
        $('#PrdRef').attr('disabled', '');
        $('#PrdName').attr('disabled', '');


        $('#SprPrdRef').val(item.SprPrdRef);
        $('#SprPrice_1_100').val(item.SprPrice_1_100);
        $('#SprPrice_100_500').val(item.SprPrice_100_500);
        $('#SprPrice_500_plus').val(item.SprPrice_500_plus);
        $('#SprComment').text(item.SprComment);
        productRefChange(item.PrdRef);
    }

    setAutoCompletePrdRef();
}

var productList = [];
function setAutoCompletePrdRef() {
    var url = window.webservicePath + "/GetProductsByRef";
    //var ptyId = $('#PtyId :selected').val() * 1;
    productList = [];
    $("#PrdRef").autocomplete({
        source: function(request, response) {
            $.ajax({
                url: url,
                data: "{ 'prdRef': '" + request.term + "'}",
                dataType: "json",
                type: "POST",
                contentType: "application/json; charset=utf-8",
                success: function(data) {
                    var jsdata = data.d;
                    var data2Treat = jQuery.parseJSON(jsdata);
                    productList = data2Treat;
                    if (productList.length < 1) {
                    $('#btn_add_product').hide();
                    }
                    response($.map(data2Treat, function(item) {
                        return {
                            label: item.PrdRef,
                            val: item.FId,
                            datavalue: item.PrdImg,
                        }
                    }));
                },
                error: function(response) {
//                    alert(response.responseText);
                },
                failure: function(response) {
                    alert(response.responseText);
                }
            });
        },
        select: function(e, i) {
            $("#hf_prd_id").text(i.item.val);
            // show image
            if (i.item.datavalue) {
                $('#div_prd_image').empty();
                var imgContent = "<img src='../../Services/ShowOutSiteImage.ashx?file=" + i.item.datavalue + "' alt=''   class='img-responsive'  style='width: 100%' />";
                $('#div_prd_image').append(imgContent);
            } else {
                $('#div_prd_image').empty();
            }
            setSelectedPrd(i.item.val);
        },
        minLength: 0
    });
}

function productRefChange(prdRef) {
    var url = window.webservicePath + "/GetProductsByRef";
    $.ajax({
        url: url,
        data: "{ 'prdRef': '" + prdRef + "'}",
        dataType: "json",
        type: "POST",
        contentType: "application/json; charset=utf-8",
        success: function(data) {
            var jsdata = data.d;
            var data2Treat = jQuery.parseJSON(jsdata);
            productList = data2Treat;
            if (productList.length < 1) {
                $('#btn_add_product').hide();
            } else {
                $('#btn_add_product').show();
                setSelectedPrd(productList[0].FId);
            }
        },
        error: function(response) {
            alert(response.responseText);
        },
        failure: function(response) {
            alert(response.responseText);
        }
    });
}


function setSelectedPrd(FId) {
    var prd = searchFieldValueInArray(productList, 'FId', FId);
    if (!jQuery.isEmptyObject(prd)) {
        $('#PrdName').val(prd.PrdName);
        $('#PrdCode').val(prd.PrdCode);
        $('#PrdDescription').text(prd.PrdDescription);
        $('#btn_add_product').show();
        $('#div_prd_attrs').empty();
        getPrdAttrs(prd.FId);
    }
}

function getPrdAttrs(prdId) {
    if (prdId) {
        var url = window.webservicePath + "/LoadProductById";
        $.ajax({
            type: "POST",
            url: url,
            contentType: "application/json; charset=utf-8",
            data: "{prdId:'" + prdId + "'}",
            dataType: "json",
            success: function(data) {
                var jsdata = data.d;
                var jsondata = jQuery.parseJSON(jsdata);
                if (jsondata !== -1) {
                    propCount = 0;
                    $.each(jsondata.PrdGeneralInfoList, function(ind, value) {
                        //setFieldValue(newname, value, true);
                        if (!value.PropIsImage)
                            set_General_PrdType_Fields(value);
                        propCount++;
                    });
                } else {

                }
            },
            error: function(data) {
                var test = '';
            }
        });
    }
}

var propCount = 0;

// product general information
function set_General_PrdType_Fields(propValue) {
    if (propValue.PropName !== undefined) {
        var disabled = 'disabled';
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
//                if (_isView) {
//                    var download = "<button class='btn btn-success' propid='" + propValue.PropGuid + "' pitId='0' onclick='return downloadTheFile(this)' title='Télécharger'><i class='fa fa-arrow-circle-o-down'></i><span>Télécharger</span></button>";
//                    var uploadfile = "<button class='btn btn-purple' propid='" + propValue.PropGuid + "' pitId='0' onclick='return UploadProductFile(this)' title='Upload'><i class='fa fa-arrow-circle-o-up'></i><span>Upload</span></button>";
//                    var deletefile = "<button class='btn btn-danger' propid='" + propValue.PropGuid + "' pitId='0' onclick='return deleteTheFileConfirm(this)' title='Supprimer'><i class='fa fa-times'></i><span>Supprimer</span></button>";
//                    inputContent = propValue.PropValue ? (download + uploadfile + deletefile) : uploadfile;
//                } else {
//                    var emptyValue = "<label  class='col-sm-12 control-label' style='text-align: left;' >L\'opération du fichier fonctionne après l'enregistrement !</label>";
//                    inputContent = emptyValue;
//                }
                var emptyValue = "<label  class='col-sm-3 control-label' style='text-align: left;' >Fichier ou image</label>";
                inputContent = emptyValue;
            } else {
                inputContent = "<input " + required + valueType + " " + inputId + inputvalue + disabled + " />";
            }
        }
        var isnewline = propCount % 3 === 0;
        var isnewlineend = propCount % 3 === 2;
        var newlinestart = isnewline ? "" : "";
        var newlineend = isnewlineend ? "" : "";
        var normalContent = newlinestart +
            "<label class='col-sm-2 control-label'>" + propValue.PropName + "</label>" +
            "<div class='col-sm-2'>" +
            inputContent +
            "</div>" +
            newlineend;
        var isGeneral = propValue.PropIsSameValue === true;
        if (isGeneral) {
            //productPropsGeneral.push(propValue);
            $('#div_prd_attrs').append(normalContent);
        } else {
            //productPropsSep.push(propValue);
            //$('#div_prd_attrs').append(normalContent);
        }
    }
}

function AddProduct(sender) {
    var checkOK = true;

    var sprId = $(sender).attr('sprId');
    var supId = $('#SupId :selected').attr('data-value');
    var prdId = $('#hf_prd_id').text();
    if (supId !== "0" && prdId !== "") {
        checkOK = true;
    } else {
        checkOK = false;
    }

    if (checkOK) {
        var item = {};
        item.SupFId = supId;
        item.PrdFId = prdId;
        item.FId = sprId;
        item.SprPrdRef = $('#SprPrdRef').val();
        item.SprPrice_1_100 = $('#SprPrice_1_100').val().replace(' ', '').replace(',', '.');
        item.SprPrice_100_500 = $('#SprPrice_100_500').val().replace(' ', '').replace(',', '.');
        item.SprPrice_500_plus = $('#SprPrice_500_plus').val().replace(' ', '').replace(',', '.');
        item.SprComment = $('#SprComment').val();


        var jsondata = JSON.stringify({ spr: item });
        $.ajax({
            url: 'SupplierProduct.aspx/CreateUpdateSupplierProduct',
            type: 'POST',
            contentType: 'application/json; charset=utf-8',
            data: jsondata,
            dataType: 'json',
            success: function(data) {
                var codId = data.d;
                var url = 'SupplierProduct.aspx';
                var newUrl = url + '?supId=' + codId + '&mode=view';
                var currentSupId = getUrlVars()['supId'];
                if (currentSupId) {
                    $('.bootbox-close-button').click();
                    loadSprs();
                } else {
                    document.location.href = newUrl;
                }
            },
            error: function(data) {
            }
        });
    }
    return false;
}

function deleteSprClick(sender) {
    var sprId = $(sender).attr('sprId');
    if (sprId) {
        var title = "ATTENTION";
        var content = "<div class='box'><div class='box-body' style='height: 100px;'>" +
            "<div class='form-horizontal'>" +
            "<div class='col-md-12'>" +
            "<div class='form-group'>" +
            "<div class='col-sm-12' style='text-align:center;font-size: 18pt;'>Veuillez confirmer la suppression ! " +
            "<br/>La suppression est irrécupérable, veuillez confirmer !!!</div></div></div></div></div></div>"
            + "<div class='modal-footer center'>" +
            "<button type='button' class='btn btn-default' onclick='closeDialog()'>Annuler</button>" +
            "<button type='button' class='btn btn-inverse' sprId='" + sprId + "' onclick='return deleteSpr(this);'>SUPPRIMER</button></div>";
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
        'background': 'url(../../img/menu_005_bg.jpg) repeat-x',
        'text-align': 'center',
        'color': '#C0C0C0'
        });
    }
    return false;
}

function deleteSpr(sender) {
    var sprId = $(sender).attr('sprId');
    var supId = getUrlVars()['supId'];
    var url = window.webservicePath + "/DeleteSupplierProduct";
    $.ajax({
        type: "POST",
        url: url,
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        data: "{supId:'" + supId + "',sprId:'" + sprId + "'}",
        success: function(data) {
            $('.bootbox-close-button').click();
            loadSprs();
        },
        error: function(data) {
            var test = '';
        }
    });
}