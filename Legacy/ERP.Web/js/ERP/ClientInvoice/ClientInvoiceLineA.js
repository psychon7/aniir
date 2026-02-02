//$(document).ready(initCostPlanLine);

function iniClientInvoiceLine() {
    ShowPleaseWait();
    getLineTypes();
    if (_isView) {
        loadAllLines();
    }
}
var allLineType = [];
function getLineTypes() {
    var url = window.webservicePath + "/GetLineType";
    $.ajax({
        type: "POST",
        url: url,
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        success: function (data) {
            var jsdata = data.d;
            var data2Treat = jQuery.parseJSON(jsdata);
            if (data2Treat !== '-1') {
                allLineType = [];
                allLineType = data2Treat;
            } else {
                AuthencationError();
            }
            HidePleaseWait();
        },
        error: function (data) {
            var test = '';
            HidePleaseWait();
        }
    });
}

function setAutoComplete(ciiId) {
    var url = window.webservicePath + "/GetProductsByRef";
    $("#PrdId_" + ciiId).autocomplete({
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
                    if (data2Treat.length > 0) {
                        response($.map(data2Treat, function(item) {
                            return {
                                label: item.PrdRef,
                                val: item.FId,
                                datavalue: item.PrdImg,
                            }
                        }));
                    } else {
                        $('#PitId_' + ciiId).empty();
                        $('#CiiPrdDes_' + ciiId).text('');
                        $('#div_tempColor').remove();
                        $('#div_operation').remove();
                    }
                },
                error: function(response) {
                    //alert(response.responseText);
                },
                failure: function(response) {
                    alert(response.responseText);
                }
            });
        },
        select: function(e, i) {
            $("#hf_cii_prd_id").text(i.item.val);
            // show image
            if (i.item.datavalue) {
                $('#div_prd_image').empty();
                var imgContent = "<img src='../../Services/ShowOutSiteImage.ashx?file=" + i.item.datavalue + "' alt=''   class='img-responsive'  style='width: 100%' />";
                $('#div_prd_image').append(imgContent);
            } else {
                $('#div_prd_image').empty();
            }
            $('#PitId_zzz_').val('');
            $("#hf_cii_pit_id").text('');

            //currentCiiId
            var subPrdId = '#PitId_' + currentCiiId;
            var urlpit = window.webservicePath + "/GetPitByRef";
            $.ajax({
                url: urlpit,
                data: "{ 'pitRef': '', prdId:'" + i.item.val + "'}",
                dataType: "json",
                type: "POST",
                contentType: "application/json; charset=utf-8",
                success: function(data) {
                    var jsdata = data.d;
                    var data2Treat = jQuery.parseJSON(jsdata);
                    productInstances = [];
                    productInstances = data2Treat;
                    setCascadeMenu(productInstances);
                    $(subPrdId).empty();
                    if ($.isArray(data2Treat)) {
                        $.each(data2Treat, function(name, pit) {
                            $(subPrdId).append(
                                $("<option></option>")
                                .attr("value", pit.FId)
                                .attr("data-value", pit.PitPurchasePrice)
                                .attr("data-price", pit.PitPrice)
                                .text(pit.PitRef)
                            );
                        });
                    }
                    $(subPrdId).change();
                },
                error: function(response) {
                }
            });
        },
        minLength: 2
    });
}

function setCascadeMenu(prdInst) {
    // todo: cascade menu for sort porudct instance result
    var allPitAllInfo = getValueInArray(prdInst,'PitAllInfo');
    //console.log(allPitAllInfo);
    
    var tempcolorOpration = getPropValueLinked(prdInst, "Température de couleur", "Opération");
    //tempcolorOpration = jQuery.unique(tempcolorOpration);
    tempcolorOpration = reSortPropValue(tempcolorOpration);
    tempcolorOpration = tempcolorOpration.sort(dynamicSort("PropValue1"));
    //console.log(tempcolorOpration);
    var tempColor = getValueInArray(tempcolorOpration, "PropValue1");
    tempColor = jQuery.unique(tempColor);
    tempColor.sort();

    $('#div_ref_prd').empty();
    if (tempColor.length > 0) {
        var tempColorContent = "<div id='div_tempColor'>" +
            "<label class='col-sm-2 control-label'>Température de couleur</label>" +
            "<div class='col-sm-2'><select id='Pit_Temp_Color_" + currentCiiId + "' name='Pit_Temp_Color_" + currentCiiId+ "' class='form-control' ciiId='" + currentCiiId + "' onchange='TempColorChange(this)'/></select>" +
            "</div>" +
            "</div>";
        $('#div_ref_prd').append(tempColorContent);
        $('#Pit_Temp_Color_' + currentCiiId).append(
            $("<option></option>").attr("value", '0').attr('selected', true).text('Sélectionner un couleur')
        );
        tempColor = jQuery.unique(tempColor);
        $.each(tempColor, function(name, value) {
            $('#Pit_Temp_Color_' + currentCiiId).append($("<option></option>").attr("value", value).text(value));
        });
    }
    var operation = getValueInArray(tempcolorOpration, "PropValue2");
    operation = jQuery.unique(operation);
    operation.sort();
    if (tempColor.length > 0) {
        var oprationContent = "<div id='div_operation'>" +
            "<label class='col-sm-2 control-label'>Opération</label>" +
            "<div class='col-sm-2'><select id='Pit_operation_" + currentCiiId + "' name='Pit_operation_" + currentCiiId + "' class='form-control' ciiId='" + currentCiiId + "' onchange='OperationChange(this)'/></select>" +
            "</div>" +
            "</div>";
        $('#div_ref_prd').append(oprationContent);
        $('#Pit_operation_' + currentCiiId).append(
            $("<option></option>").attr("value", '0').attr('selected', true).text('Sélectionner une opération')
        );
        operation = jQuery.unique(operation);
        $.each(operation, function(name, value) {
            $('#Pit_operation_' + currentCiiId).append($("<option></option>").attr("value", value).text(value));
        });
    }
}

function TempColorChange(sender) {
    var tempvalue = $(sender).val();
    var clnid = $(sender).attr('ciiId') * 1;
    var operationvalue = $('#Pit_operation_' + clnid).val();
    TempColorOperationChange(tempvalue,operationvalue, clnid);
}

function OperationChange(sender) {
    var operationvalue = $(sender).val();
    var clnid = $(sender).attr('ciiId') * 1;
    var tempvalue = $('#Pit_Temp_Color_' + clnid).val();
    TempColorOperationChange(tempvalue,operationvalue, clnid);
}

function TempColorOperationChange(tempvalue, operationvalue,clnid) {
var subPrdId = '#PitId_' + clnid;
    var filteredPit = [];
    if (tempvalue === '0' && operationvalue === '0') {
        // no filter reset product instance list
        filteredPit = productInstances;
    } else if (tempvalue === '0') {
        // operation
        filteredPit = FilterPitInfo(productInstances, 'Opération', operationvalue);
        //console.log(pitWithOperation);
    } else if (operationvalue === '0') {
        // temp color
        filteredPit = FilterPitInfo(productInstances, 'Température de couleur', tempvalue);
    } else {
        // both
        var pitWithOperation = FilterPitInfo(productInstances, 'Opération', operationvalue);
        filteredPit = FilterPitInfo(pitWithOperation, 'Température de couleur', tempvalue);
    }
    $(subPrdId).empty();
    $.each(filteredPit, function(name, pit) {
        $(subPrdId).append(
            $("<option></option>")
            .attr("value", pit.FId)
            .attr("data-value", pit.PitPurchasePrice)
            .attr("data-price", pit.PitPrice)
            .attr("description", pit.PitDescription)
            .text(pit.PitRef)
        );
    });
    $(subPrdId).change();
}

function FilterPitInfo(pits, infoFieldname, fieldvalue) {
    var filteredPits = [];
    $.each(pits, function(name, value) {
        $.each(value.PitAllInfo, function(propname, propvalue) {
            if (propvalue['PropName'] === infoFieldname && propvalue['PropValue'] === fieldvalue) {
                filteredPits.push(value);
            }
        });
    });
    return filteredPits;
}

var clientOrderLineInPage = [];

function loadAllLines() {
    ShowPleaseWait();
    var cinId = getUrlVars()['cinId'];
    var url = window.webservicePath + "/GetAllClientInvoiceLines";
    $.ajax({
        url: url,
        type: 'POST',
        contentType: 'application/json; charset=utf-8',
        data: "{cinId:'" + cinId + "'}",
        dataType: 'json',
        success: function(data) {
            var jsdata = data.d;
            var jsondata = jQuery.parseJSON(jsdata);
            if (jsondata !== '-1') {
                clientOrderLineInPage = [];
                clientOrderLineInPage = jsondata;
                if (clientOrderLineInPage.length > 0) {
                    $('#btn_generate_pdf').show();
                } else {
                    $('#btn_generate_pdf').hide();
                }
                var linecount = 1;
                $('#tbody_cost_plan_line').empty();

                var total_quanity = 0;
                var total_ht = 0;
                var total_ttc = 0;

                if (!(!currentCin.CinIsInvoiced)) {
                    $('#th_btns').hide();
                    $('#btn_add_line_bottom').hide();
                    $('#btn_add_line_top').hide();
                        $('#btn_add_drv_top').hide();
                        $('#btn_add_drv_bottom').hide();
                }

                $.each(jsondata, function(name, value) {
                    var lineclass = (linecount % 2 === 1) ? "odd" : "even";
                    var prdname = (value.LtpId === 2 || value.LtpId === 4) ? value.CiiPrdName : "";
                    var pitname = (value.LtpId === 2 || value.LtpId === 4) ? value.PitName : "";
                    var quantity = (value.LtpId === 2 || value.LtpId === 4) ? value.CiiQuantity : "";
                    total_quanity += (quantity * 1);
                    var purchasePrice = (value.LtpId === 2 || value.LtpId === 4) ? value.CiiPurchasePrice : "";
                    var unitprice = (value.LtpId === 2 || value.LtpId === 4) ? value.CiiUnitPrice : "";
                    var unitpriceDiscount = (value.LtpId === 2 || value.LtpId === 4) ? value.CiiPriceWithDiscountHt : "";
                    var vatlabel = (value.LtpId === 2 || value.LtpId === 4) ? value.VatLabel : "";
                    var totalht = (value.LtpId === 2 || value.LtpId === 4 || value.LtpId === 5 || value.LtpId === 6) ? value.CiiTotalPrice : "";
                    total_ht += (totalht * 1);
                    var totalttc = (value.LtpId === 2 || value.LtpId === 4 || value.LtpId === 5 || value.LtpId === 6) ? value.CiiTotalCrudePrice : "";
                    total_ttc += (totalttc * 1);
                    if (value.LtpId === 5) {
                        lineclass += " subTotal";
                    }
                    if (value.LtpId === 6) {
                        lineclass += " total";
                    }
                    var prddes = (value.CiiPrdDes == "" || value.CiiPrdDes == '' || value.CiiPrdDes == null) ? '' : value.CiiPrdDes;
                    var des  = (value.CiiDescription == "" || value.CiiDescription == '' || value.CiiDescription == null) ? '' : value.CiiDescription;
                    prddes = replaceAll(prddes, '\n', '</br>');
                    des = replaceAll(des, '\n', '</br>');
                    var newline = ((!IsNullOrEmpty(prddes) && !IsNullOrEmpty(des)) ? '</br>---------------------------</br>' : '');
                    var description = prddes + newline + des;
                    var btns = !currentCin.CinIsInvoiced ? (
                            ("<td><button class='btn btn-inverse' title='Modifier' id='" + value.CiiId + "' ciiId='" + value.CiiId + "' onclick='return modify_cii_click(this)'><i class='fa fa-edit'></i></button>" +
                                "<button class='btn btn-inverse' title='Supprimer' id='" + value.CiiId + "' ciiId='" + value.CiiId + "' onclick='return delete_Cii_Line_Confirm(this)'><i class='fa fa-times'></i></button></td>")
                        )
                        :
                        "";

                    var oneline = "<tr class='" + lineclass + "'>" +
//                        "<td class='label_left'>" + value.CiiLevel1 + "." + value.CiiLevel2 + "</td>" +
//                        "<td class='label_left'>" + value.LineType + "</td>" +
                        "<td class='label_left'>" + prdname + "</td>" +
                        "<td class='label_left'>" + pitname + "</td>" +
                        "<td>" + (value.PrdImgPath ? ("<img src='../../Services/ShowOutSiteImage.ashx?file=" + value.PrdImgPath + "' height='40' width='40' />") : "") + "</td>" +
                        "<td class='label_left'>" + description + "</td>" +
                        "<td class='label_right'>" + quantity + "</td>" +
                        "<td class='label_right'>" + purchasePrice + "</td>" +
                        "<td class='label_right'>" + unitprice + "</td>" +
                        "<td class='label_right'>" + unitpriceDiscount + "</td>" +
                        "<td class='label_left'>" + vatlabel + "</td>" +
                        "<td class='label_right'>" + totalht + "</td>" +
                        "<td class='label_right'>" + totalttc + "</td>" +
                        btns + "</td></tr>";
                    linecount ++;
                    $('#tbody_cost_plan_line').append(oneline);
                });
                var btntd = !currentCin.CinIsInvoiced ? (
                ("<td></td>")) : "";

                total_ht = (0 - total_ht).toFixed(2);
                total_ttc = (0 - total_ttc).toFixed(2);
                total_quanity = (0 - total_quanity).toFixed(0);

                var totalLine = "<tr ><td colspan='4' class='text-align:left; font-weight:bolder;'>TOTAL</td>" +
                    "<td class='label_right' style='color : red; font-weight:bolder;'>" + total_quanity + "</td>" +
                    "<td></td>" +
                    "<td></td>" +
                    "<td></td>" +
                    "<td></td>" +
                    "<td class='label_right' style='color : red; font-weight:bolder;'>" + total_ht + "</td>" +
                    "<td class='label_right' style='color : red; font-weight:bolder;'>" + total_ttc + "</td>" +
                    btntd +
                    "</tr>" +
                    "";
                //$('#tbody_cost_plan_line')
                $('#tbody_cost_plan_line').append(totalLine);
                HidePleaseWait();
            } else {
                HidePleaseWait();
            }
        },
        error: function(data) {
        }
    });
}

function modify_cii_click(sender) {
    var ciiId = $(sender).attr('id') * 1;
    var oneCii = searchFieldValueInArray(clientOrderLineInPage,'CiiId',ciiId);
    if (oneCii) {
        setAddUpdateLine(oneCii);
    }
    return false;
}

function getNextLevel1() {
    var level1 = 1;
    if (clientOrderLineInPage && clientOrderLineInPage.length > 0) {
        var maxLevel1 = clientOrderLineInPage.sort(dynamicSort("-CiiLevel1"));
        level1 = maxLevel1[0].CiiLevel1 * 1 + 1;
    }
    return level1;
}

var prdsForAtCompl = [];
var pitsForAtCompl = [];
var lineCount = 0;

var currentCiiId = 0;

function setAddUpdateLine(oneLine, forUpdateCreate) {
    $('#hf_cii_prd_id').text('');
    $('#hf_cii_pit_id').text('');
    var cplVatId = 1;
    if (currentCin) {
        cplVatId = currentCin.VatId;
    }

    var create = oneLine ? false : true;
    var CiiId = oneLine ? oneLine.CiiId : lineCount;
    lineCount--;
    var CplId = oneLine ? oneLine.CplId : '';
    var CplFId = oneLine ? oneLine.CplFId : '';
    var CiiLevel1 = oneLine ? oneLine.CiiLevel1 : getNextLevel1();
    var CiiLevel2 = oneLine ? oneLine.CiiLevel2 : '1';
    var CiiDescription = oneLine ? oneLine.CiiDescription : '';
    var PrdId = oneLine ? oneLine.PrdId : '';
    var PrdName = oneLine ? oneLine.CiiPrdName : '';
    var PitId = oneLine ? oneLine.PitId : '';
    var PitName = oneLine ? oneLine.PitName : '';
    var CiiPurchasePrice = oneLine ? oneLine.CiiPurchasePrice : '';
    var CiiUnitPrice = oneLine ? oneLine.CiiUnitPrice : '';
    var CiiQuantity = oneLine ? oneLine.CiiQuantity : '';
    var CiiTotalPrice = oneLine ? oneLine.CiiTotalPrice : '';
    var CiiTotalCrudePrice = oneLine ? oneLine.CiiTotalCrudePrice : '';
    var VatId = oneLine ? oneLine.VatId : cplVatId;
    var LtpId = oneLine ? oneLine.LtpId : '';
    var LineType = oneLine ? oneLine.LineType : '';
    var PrdImgPath = oneLine ? oneLine.PrdImgPath : '';
    var CiiDiscountPercentage = oneLine ? oneLine.CiiDiscountPercentage : '';
    var CiiDiscountAmount = oneLine ? oneLine.CiiDiscountAmount : '';
    var CiiPriceWithDiscountHt = oneLine ? oneLine.CiiPriceWithDiscountHt : '';
    var CiiMargin = oneLine ? oneLine.CiiMargin : '';
    var CiiPrdDes = oneLine ? oneLine.CiiPrdDes : '';
    if (oneLine) {
        $('#hf_cii_prd_id').text(oneLine.PrdFId);
        $('#hf_cii_pit_id').text(oneLine.PitFId);
    }


    var startBox = "<div class='box'><div class='box-body'>";
    var endBox = "</div></div>";
    var onelineContent =
        // start box
        "<div class='form-group' id='div_one_line'>" +
            "<div class='row'>" +
            "<div class='col-md-12'>" +
            "<div class='box-body'>" +
            "<div class='form-horizontal'>" +
            "<div class='form-group'>" +
            "<label class='col-sm-2 control-label' style='' >Type de ligne</label>" +
            "<div class='col-sm-2' style='' ><select class='form-control' id='LtpId_zzz_' name='LtpId_zzz_' ciiid='" + CiiId + "' onchange='ltpChange(this)'></select></div>" +
            "<label class='col-sm-2 control-label' style='display:none;' >Niveau 1</label>" +
            "<div class='col-sm-2' style='display:none;' ><input type='text' onkeypress='validateNumber(event)' value='" + CiiLevel1 + "' ciiid='" + CiiId + "'class='form-control' id='CiiLevel1_zzz_' name='CiiLevel1_zzz_' maxlength='3' /></div>" +
            "<label class='col-sm-2 control-label' style='display:none;' >Niveau 2</label>" +
            "<div class='col-sm-2' style='display:none;' ><input type='text' onkeypress='validateNumber(event)' value='" + CiiLevel2 + "' ciiid='" + CiiId + "'class='form-control' id='CiiLevel2_zzz_' name='CiiLevel2_zzz_' maxlength='3' /></div>" +
            "</div>" +
            "<div class='form-group variant'>" +
            "<label class='col-sm-2 control-label'>Référence du produit</label>" +
            "<div class='col-sm-2'><input class='form-control' id='PrdId_zzz_' name='PrdId_zzz_' value='" + PrdName + "' onkeyup='checkContent(this)' ciiid='" + CiiId + "' /></div>" +
            "<div id='div_ref_prd'></div></div>" +
            "<div class='form-group variant'>" +
            "<label class='col-sm-2 control-label sale'>Référence du sous produit</label>" +
            "<div class='col-sm-2 sale'><select id='PitId_zzz_' name='PitId_zzz_' class='form-control' ciiid='" + CiiId + "' onchange='pitChange(this)'/></select></div>" +
            "<label class='col-sm-2 control-label'>Prix d'achat</label>" +
            "<div class='col-sm-2'><input type='number' step='0.01' class='form-control' ciiid='" + CiiId + "' id='CiiPurchasePrice_zzz_' name='CiiPurchasePrice_zzz_' min='0' value='" + CiiPurchasePrice + "' /></div>" +
            "</div>" +
            "<div class='form-group variant'><label class='col-sm-2 control-label'>TVA</label>" +
            "<div class='col-sm-2'><select class='form-control' ciiid='" + CiiId + "' id='VatId_zzz_' name='VatId_zzz_' onchange='CalCulatePrice(this)'></select></div>" +
            "<label class='col-sm-2 control-label'>Quantité</label>" +
            "<div class='col-sm-2'><input type='number' step='1' class='form-control' id='CiiQuantity_zzz_'  ciiid='" + CiiId + "' name='CiiQuantity_zzz_' min='0' value='" + CiiQuantity + "' onkeyup='CalCulatePrice(this)'/></div>" +
            "<label class='col-sm-2 control-label'>Prix unitaire</label>" +
            "<div class='col-sm-2'><input type='number' step='0.01' class='form-control' ciiid='" + CiiId + "' id='CiiUnitPrice_zzz_' name='CiiUnitPrice_zzz_' min='0' value='" + CiiUnitPrice + "' onkeyup='CalCulatePrice(this)'/></div>" +
            "</div>" +

            //remise
            "<div class='form-group variant'><label class='col-sm-2 control-label'>Pourcentage de remise</label>" +
            "<div class='col-sm-2'><div class='input-group'><input type='number' step='0.01' class='form-control' ciiid='" + CiiId + "' field='CiiDiscountPercentage' id='CiiDiscountPercentage_zzz_' name='CiiDiscountPercentage_zzz_' min='0' value='" + CiiDiscountPercentage + "' onkeyup='CalCulatePrice(this)'/><span class='input-group-addon'>%</span></div></div>" +
            "<label class='col-sm-2 control-label'>Montant de remise</label>" +
            "<div class='col-sm-2'><input type='number' step='1' class='form-control' id='CiiDiscountAmount_zzz_'  ciiid='" + CiiId + "' field='CiiDiscountAmount' name='CiiDiscountAmount_zzz_' min='0' value='" + CiiDiscountAmount + "' onkeyup='CalCulatePrice(this)'/></div>" +
            "<label class='col-sm-2 control-label'>Prix remisé</label>" +
            "<div class='col-sm-2'><input type='number' step='0.01' class='form-control' ciiid='" + CiiId + "'  field='CiiPriceWithDiscountHt' id='CiiPriceWithDiscountHt_zzz_' name='CiiPriceWithDiscountHt_zzz_' min='0' value='" + CiiPriceWithDiscountHt + "' onkeyup='CalCulatePrice(this)'/></div>" +
            "</div>" +
            // end remise
            "<div class='form-group  variant'><label class='col-sm-2 control-label'>Total H.T.</label>" +
            "<div class='col-sm-2'><input type='number' disabled='' step='0.01' class='form-control' ciiid='" + CiiId + "' id='CiiTotalPrice_zzz_' name='CiiTotalPrice_zzz_' value='" + CiiTotalPrice + "' /></div>" +
            "<label class='col-sm-2 control-label'>Total T.T.C.</label>" +
            "<div class='col-sm-2'><input type='number' disabled step='0.01' class='form-control' ciiid='" + CiiId + "' id='CiiTotalCrudePrice_zzz_' name='CiiTotalCrudePrice_zzz_' value='" + CiiTotalCrudePrice + "' /></div>" +
            "<label class='col-sm-2 control-label'>Marge</label>" +
            "<div class='col-sm-2'><input type='number' disabled step='0.01' class='form-control' ciiid='" + CiiId + "' id='CiiMargin_zzz_' name='CiiMargin_zzz_' value='" + CiiMargin + "' /></div>" +
            "</div>" +
            "<div class='form-group  variant'>" +
            "<div class='col-sm-2'></div><div class='col-sm-2' id='div_prd_image'><!-- image -->" +
            (create ? "" : "<img src='../../Services/ShowOutSiteImage.ashx?file=" + PrdImgPath + "' alt=''   class='img-responsive'  style='width: 100%' />") +
            "</div><div class='col-sm-10'></div>" +
            "</div>" +
            "<div class='form-group'>" +
            "<label class='col-sm-2 control-label'>Description de produit</label>" +
            "<div class='col-sm-10'><textarea rows='7' disabled cols='1' colId='" + CiiId + "'  id='CiiPrdDes_zzz_' value='" + CiiPrdDes + "' name='CiiPrdDes_zzz_' class='form-control'></textarea>" +
            "</div>" +
            "</div>" +
            "<div class='form-group'>" +
            "<label class='col-sm-2 control-label'>Description</label>" +
            "<div class='col-sm-10'><textarea rows='3' ciis='1' ciiId='" + CiiId + "'  id='CiiDescription_zzz_' value='" + CiiDescription + "' name='CiiDescription_zzz_' class='form-control'></textarea></div></div>" +
            // close box
            "</div></div></div></div></div>";

    var btnAddUpdate = "<button class='btn btn-inverse' ciiId='" + CiiId + "' id='btn_add_update_line_zzz_' name='btn_add_update_line_zzz_' onclick='return AddUpdateClientInvoiceLine(this)'><span>" + (!create ? "Mettre à jour" : "Ajouter") + "</span></button>";
    var btnDelete = "<button class='btn btn-inverse' ciiId='" + CiiId + "' id='btn_delete_line_zzz_' name='btn_delete_line_zzz_' onclick='return delete_Cii_Line_Confirm(this)'><span>Supprimer</span></button>";
    var btnClose = "<button class='btn btn-default bootbox-close-button' onclick='return false'><span>Annuler</span></button>";

    var btns = "<div class='modal-body center'>" + btnClose + btnAddUpdate + "</div>";

    var onecontent = startBox + onelineContent + btns + endBox;

    onecontent = replaceAll(onecontent, '_zzz_', '_' + CiiId);
    currentCiiId = CiiId;
    //$('#div_cost_plan_lines').append(onelineContent);


    var title = !create ? 'Mettre à jour cette linge' : 'Ajouter une ligne';
    bootbox.dialog({
        title: title,
        message: onecontent
    }).find('.modal-dialog').css({
        'width': '70%'
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
    setAutoComplete(CiiId);
    setLintType(CiiId, LtpId);
    setLineTva(CiiId, VatId);
    if (!create) {
        //currentCiiId
        var subPrdId = '#PitId_' + currentCiiId;
        var urlpit = window.webservicePath + "/GetPitByRef";
        try {

            $.ajax({
                url: urlpit,
                data: "{ 'pitRef': '', prdId:'" + PrdId + "'}",
                dataType: "json",
                type: "POST",
                contentType: "application/json; charset=utf-8",
                success: function(data) {
                    var jsdata2 = data.d;
                    var data2Treat = jQuery.parseJSON(jsdata2);
                    $(subPrdId).empty();
                    if ($.isArray(data2Treat)) {
                        $.each(data2Treat, function(name, pit) {
                            if (pit.PitId === PitId) {
                                $(subPrdId).append(
                                    $("<option></option>").attr("value", pit.FId).attr("data-value", pit.PitPurchasePrice).attr('selected', true).text(pit.PitRef)
                                );
                            } else {
                                $(subPrdId).append(
                                    $("<option></option>").attr("value", pit.FId).attr("data-value", pit.PitPurchasePrice).text(pit.PitRef)
                                );
                            }
                        });
                    }
                },
                error: function(response) {
                }
            });
        } catch (e) {
            var test = e;
        }
    } else {
        $('#LtpId_' + currentCiiId).change();
    }
    if (CiiDescription) {
        $('#CiiDescription_' + currentCiiId).text(CiiDescription);
    }
    
    if (CiiPrdDes) {
       $('#CiiPrdDes_' + currentCiiId).text(CiiPrdDes);
    }
    
    if (oneLine) {
        preLoadProductInstance(oneLine.PrdId);
    }
}

function ltpChange(sender) {
    var ltpId = $(sender).val();
    ltpId = ltpId * 1;
    if (ltpId !== 2 && ltpId !== 4) {
        //$('.variant').hide();
    } else {
        $('.variant').show();
        if (ltpId === 4) {
            //$('.sale').hide();
            $('#div_prd_image').empty();
        } else {
            $('.sale').show();
        }
    }
}

function setPriceFieldByLtpId(ltpId) {
    if (ltpId !== 2 && ltpId !== 4) {
        //$('.variant').hide();
    } else {
        $('.variant').show();
        if (ltpId === 4) {
            //$('.sale').hide();
            $('#div_prd_image').empty();
        } else {
            $('.sale').show();
        }
    }
}

function preLoadProductInstance(prdId) {
    var urlpit = window.webservicePath + "/GetPitByRef";
    $.ajax({
        url: urlpit,
        data: "{ 'pitRef': '', prdId:'" + prdId + "'}",
        dataType: "json",
        type: "POST",
        contentType: "application/json; charset=utf-8",
        success: function(data) {
            var jsdata = data.d;
            var data2Treat = jQuery.parseJSON(jsdata);
            productInstances = [];
            productInstances = data2Treat;
        },
        error: function(response) {
        }
    });
}
var productInstances = [];

function pitChange(sender) {
    var pitId = $(sender).val();
    $("#hf_cii_pit_id").text($(sender).val());
    var ciiId = $(sender).attr('ciiId');
    var purchaseprice = $(sender).find(":selected").attr('data-value');
    $('#CiiPurchasePrice_' + ciiId).val(purchaseprice);
    var price  = $(sender).find(":selected").attr('data-price');
    $('#CiiUnitPrice_' + ciiId).val(price);
    //$('#CiiDescription_' + ciiId).text(description);
    var onePit = searchFieldValueInArray(productInstances, 'FId', pitId);
    
    var PrdName = onePit.PrdName;
    var PrdSubName = onePit.PrdSubName;
    var PrdOutsideDiameter = onePit.PrdOutsideDiameter;
    var PrdLength = onePit.PrdLength;
    var PrdWidth = onePit.PrdWidth;
    var PrdHeight = onePit.PrdHeight;
    //var PrdDescription = onePit.PrdDescription;
    var Description = onePit.Description;
    //var diameterExt = ontPit.

    var propdes = "";
    
    $.each(onePit.PitAllInfo, function(order, propvalue) {
        if (propvalue.PropValue && propvalue.PropValue !== null) {
            propdes += propvalue.PropValue + " " + propvalue.PropUnit + " | ";
        }
    });
    var additionnalInfo = "";
    if (PrdOutsideDiameter && PrdOutsideDiameter !== null) {
        additionnalInfo += "Diam : " + PrdOutsideDiameter + " mm | ";
    }
    if (PrdLength && PrdLength !== null) {
        additionnalInfo += "Lon : " + PrdLength + " mm | ";
    }
    if (PrdWidth && PrdWidth !== null) {
        additionnalInfo += "Lar : " + PrdWidth + " mm | ";
    }
    if (PrdHeight && PrdHeight !== null) {
        additionnalInfo += "Haut : " + PrdHeight + " mm";
    }
    //var alldes = PrdName + " " + (PrdSubName && PrdSubName !== null ? PrdSubName : "") + "\r\n" + propdes.trim() + "\r\n" + additionnalInfo.trim();
    var alldes = PrdName + " " +
    ((IsNullOrEmpty(PrdSubName) || PrdName === PrdSubName )? "" : PrdSubName.trim()) +
    (IsNullOrEmpty(propdes) ? "" : ("\r\n" + propdes.trim())) +
    (IsNullOrEmpty(additionnalInfo) ? "" : ("\r\n" + additionnalInfo.trim()));

    $('#CiiPrdDes_' + ciiId).text(alldes);
    if (!IsNullOrEmpty(onePit.PitDefaultImage)) {
        $('#div_prd_image').empty();
        var imgContent = "<img src='../../Services/ShowOutSiteImage.ashx?file=" + onePit.PitDefaultImage + "' alt=''   class='img-responsive'  style='width: 100%' />";
        $('#div_prd_image').append(imgContent);
    } else {
        $('#div_prd_image').empty();
    }
}

function setLineTva(ciiId, vatId) {
    if (allTVA) {
        var budgetId = '#VatId_' + ciiId;
        $(budgetId).empty();
        $.each(allTVA, function (name, value) {
            if (vatId && value.Key === vatId) {
                $(budgetId)
                    .append($("<option></option>")
                        .attr("value", value.Key).attr("selected", true).attr("data-value", value.DcValue)
                        .text(value.Value));
            } else {
                $(budgetId)
                    .append($("<option></option>")
                        .attr("value", value.Key)
                        .attr("data-value", value.DcValue)
                        .text(value.Value));
            }
        });
    }
}

function setLintType(ciiId, ltpId) {
    if (allLineType) {
        var budgetId = '#LtpId_' + ciiId;
        $(budgetId).empty();
        $.each(allLineType, function (name, value) {
            if (ltpId && value.Key === ltpId) {
                $(budgetId)
                    .append($("<option></option>")
                        .attr("value", value.Key).attr("selected", true)
                        .text(value.Value));
            } else {
                $(budgetId)
                    .append($("<option></option>")
                        .attr("value", value.Key)
                        .text(value.Value));
            }
        });
        setPriceFieldByLtpId(ltpId);
    }
}

function checkContent(sender) {
    if (!$(sender).val()) {
        $('#hf_cii_prd_id').text('');
    }
}

function AddUpdateClientInvoiceLine(sender) {
    $(sender).attr('disabled', 'disabled');
    var ciiId = $(sender).attr('ciiId');

    var LtpId = $('#LtpId_' + ciiId).val() * 1;
    var PrdId = $('#PrdId_' + ciiId);
    var PitId = $('#PitId_' + ciiId + ' option:selected');
    var CiiPurchasePrice = $('#CiiPurchasePrice_' + ciiId);
    var VatId = $('#VatId_' + ciiId);
    var CiiQuantity = $('#CiiQuantity_' + ciiId);
    var CiiUnitPrice = $('#CiiUnitPrice_' + ciiId);
    var CiiTotalPrice = $('#CiiTotalPrice_' + ciiId);
    var CiiTotalCrudePrice = $('#CiiTotalCrudePrice_' + ciiId);
    var CiiLevel1 = $('#CiiLevel1_' + ciiId);
    var CiiLevel2 = $('#CiiLevel2_' + ciiId);
    var CiiDescription = $('#CiiDescription_' + ciiId);

    var CiiDiscountPercentage = $('#CiiDiscountPercentage_' + ciiId);
    var CiiDiscountAmount = $('#CiiDiscountAmount_' + ciiId);
    var CiiPriceWithDiscountHt = $('#CiiPriceWithDiscountHt_' + ciiId);
    var CiiMargin = $('#CiiMargin_' + ciiId);
    var CiiPrdDes = $('#CiiPrdDes_' + ciiId);

    // LtpId_zzz_
    // PrdId_zzz_
    // PitId_zzz_
    // CiiPurchasePrice_zzz_
    // VatId_zzz_
    // CiiQuantity_zzz_
    // CiiUnitPrice_zzz_
    // CiiTotalPrice_zzz_
    // CiiTotalCrudePrice_zzz_
    // CiiLevel1_zzz_
    // CiiLevel2_zzz_
    // vente

    var checkOK = true;
    if (LtpId === 2 || LtpId === 4) {
        PrdId.attr('required', '');
        CiiQuantity.attr('required', '');
        //CiiUnitPrice.attr('required', '');
        if (LtpId === 2) {
            PitId.attr('required', '');
        } else {
            PitId.removeAttr('required');
        }
    } else {
        PrdId.removeAttr('required');
        PitId.removeAttr('required');
        CiiQuantity.removeAttr('required');
        CiiUnitPrice.removeAttr('required');
    }
    checkOK = CheckRequiredFieldInOneDiv('div_one_line');
    if (checkOK) {
        ShowPleaseWait();
        var ltp_id = LtpId;
        var level1 = CiiLevel1.val() * 1 + 0;
        var level2 = CiiLevel2.val() * 1 + 0;
        var product = PrdId.val();
        var prdId = $('#hf_cii_prd_id').text();
        var pitId = $('#hf_cii_pit_id').text();
        var pitname = PitId.text();
        var purchasePrice = (CiiPurchasePrice.val().replace(',', '.')) * 1;
        var tva = VatId.val();
        var quantity = CiiQuantity.val().replace(',', '.') * 1;
        var unitprice = CiiUnitPrice.val().replace(',', '.') * 1;
        var totalHt = CiiTotalPrice.val().replace(',', '.') * 1;
        var totalTtc = CiiTotalCrudePrice.val().replace(',', '.') * 1;


        var coldiscountPercentage = CiiDiscountPercentage.val().replace(',', '.') * 1;
        var coldiscountAmount = CiiDiscountAmount.val().replace(',', '.') * 1;
        var colPriceWithDiscount = CiiPriceWithDiscountHt.val().replace(',', '.') * 1;
        var colMargin = CiiMargin.val().replace(',', '.') * 1;


        var description = CiiDescription.val();

        var oneline = {};
        oneline.CiiId = ciiId;
        oneline.CinFId = getUrlVars()['cinId'];
        oneline.CiiLevel1 = level1;
        oneline.CiiLevel2 = level2;
        oneline.CiiDescription = description;
        oneline.PrdFId = prdId;
        oneline.PitFId = pitId;
        oneline.PrdName = product;
        oneline.PitName = pitname;
        oneline.CiiPrdName = product;
        oneline.CiiPurchasePrice = purchasePrice;
        oneline.CiiUnitPrice = unitprice;
        oneline.CiiQuantity = quantity;
        oneline.CiiTotalPrice = totalHt;
        oneline.CiiTotalCrudePrice = totalTtc;
        oneline.CiiPrdDes = CiiPrdDes.val();

        oneline.CiiDiscountPercentage = coldiscountPercentage;
        oneline.CiiDiscountAmount = coldiscountAmount;
        oneline.CiiPriceWithDiscountHt = colPriceWithDiscount;
        oneline.CiiMargin = colMargin;

        oneline.VatId = tva;
        oneline.LtpId = ltp_id;
        var jsondata = JSON.stringify({ oneLine: oneline });
        var url = window.webservicePath + "/InsertUpdateCii";
        $.ajax({
            url: url,
            type: 'POST',
            contentType: 'application/json; charset=utf-8',
            data: jsondata,
            dataType: 'json',
            success: function(data) {
                $('.bootbox-close-button').click();
                loadAllLines();
                loadCinPayementInfo();
                $("button[id^='btn_add_update_line_']").attr('disabled', null);
            },
            error: function(data) {
                alert(data.responseText);
                $("button[id^='btn_add_update_line_']").attr('disabled', null);
            }
        });
    } else {
        $("button[id^='btn_add_update_line_']").attr('disabled', null);
    }
    return false;
}

function CalCulatePrice(sender) {
    var ciiId = $(sender).attr('ciiId');
    var field = $(sender).attr('field');
    var tva = $('#VatId_' + ciiId + '  option:selected');
    var quantity = $('#CiiQuantity_' + ciiId).val() * 1;
    var unitprice = $('#CiiUnitPrice_' + ciiId).val() * 1;
    var disPercentage = $('#CiiDiscountPercentage_' + ciiId).val() * 1;
    var disAmount= $('#CiiDiscountAmount_' + ciiId).val() * 1;
    var disPrice = $('#CiiPriceWithDiscountHt_' + ciiId).val() * 1;
    var purcharsePrice = $('#CiiPurchasePrice_'+ ciiId).val() * 1;

    if (field === 'CiiDiscountPercentage' || field === 'CiiDiscountAmount' || field === 'CiiPriceWithDiscountHt') {
        if (field === 'CiiDiscountPercentage') {
            disAmount = (disPercentage * unitprice / 100).toFixed(4);
            disPrice = (unitprice - disAmount).toFixed(4);
            //disPrice = ((100 - disPercentage) * unitprice / 100).toFixed(4);
            $('#CiiDiscountAmount_' + ciiId).val(disAmount);
            $('#CiiPriceWithDiscountHt_' + ciiId).val(disPrice);
        }
        else if (field === 'CiiDiscountAmount') {
            disPercentage = (disAmount * 100 / (unitprice ? unitprice : 1)).toFixed(4);
            disPrice = (unitprice - disAmount).toFixed(4);
            $('#CiiDiscountPercentage_' + ciiId).val(disPercentage);
            $('#CiiPriceWithDiscountHt_' + ciiId).val(disPrice);
        } else {
            disPercentage = ((unitprice - disPrice )* 100 / (unitprice ? unitprice : 1)).toFixed(4);
            disAmount = (unitprice - disPrice ).toFixed(4);
            $('#CiiDiscountPercentage_' + ciiId).val(disPercentage);
            $('#CiiDiscountAmount_' + ciiId).val(disAmount);
        }
    } else {
        disAmount = (disPercentage * unitprice / 100).toFixed(4);
        disPrice = (unitprice - disAmount).toFixed(4);
        //disPrice = ((100 - disPercentage) * unitprice / 100).toFixed(4);
        $('#CiiDiscountAmount_' + ciiId).val(disAmount);
        $('#CiiPriceWithDiscountHt_' + ciiId).val(disPrice);
    }

    var totalHT = $('#CiiTotalPrice_' + ciiId);
    var totalTTC = $('#CiiTotalCrudePrice_' + ciiId);
    var margin = $('#CiiMargin_' + ciiId);

    var tva_value = tva.attr('data-value') * 1;
    var _total_ht = quantity * (unitprice - (disAmount ? disAmount : 0));
    var _total_ttc = _total_ht * (1 + tva_value / 100);
    var _margin = (disPrice - purcharsePrice) * quantity;

    _total_ht = _total_ht.toFixed(4);
    _total_ttc = _total_ttc.toFixed(4);
    _margin = _margin.toFixed(4);
    totalHT.val(_total_ht);
    totalTTC.val(_total_ttc);
    margin.val(_margin);
}

function delete_Cii_Line_Confirm(sender) {
    var ciiId = $(sender).attr('ciiId');
    var title = "ATTENTION";
    var content = "<div class='box'><div class='box-body' style='height: 100px;'>" +
        "<div class='form-horizontal'>" +
        "<div class='col-md-12'>" +
        "<div class='form-group'>" +
        "<div class='col-sm-12' style='text-align:center;font-size: 18pt;'>Veuillez confirmer la suppression ! " +
        "<br/>La suppression est irrécupérable, veuillez confirmer !!!</div></div></div></div></div></div>"
        + "<div class='modal-footer center'>" +
        "<button type='button' class='btn btn-default' onclick='closeDialog()'>Annuler</button>" +
        "<button type='button' class='btn btn-inverse' ciiId='"+ciiId +"' onclick='return delete_Cii(this);'>SUPPRIMER</button></div>";
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
        'color': '#C0C0C0'
    });
    return false;
}

function delete_Cii(sender) {
    var ciiId = $(sender).attr('ciiId');
    var cinId = getUrlVars()['cinId'];
    var url = window.webservicePath + "/DeleteClientInvoiceLine";
    $.ajax({
        type: "POST",
        url: url,
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        data: "{cinId:'" + cinId + "',ciiId:" + ciiId + "}",
        success: function(data) {
            var jsdata = data.d;
            var data2Treat = jQuery.parseJSON(jsdata);
            if (data2Treat !== '-1') {
                loadAllLines();
                loadCinPayementInfo();
            } else {
                AuthencationError();
            }
        },
        error: function(data) {
            var test = '';
        }
    });
}

function addupdateDrvAcc(oneLine) {
    
    $('#hf_cii_prd_id').text('');
    $('#hf_cii_pit_id').text('');
    var vat_id = 1;
    if (currentCin) {
        vat_id = currentCin.VatId;
    }

    var create = oneLine ? false : true;
    var CiiId = oneLine ? oneLine.CiiId: lineCount;
    lineCount--;
    var CiiLevel1 = oneLine ? oneLine.CiiLevel1 : getNextLevel1();
    var CiiLevel2 = oneLine ? oneLine.CiiLevel2 : '1';
    var PrdId = oneLine ? oneLine.PrdId : '';
    var PrdName = oneLine ? oneLine.CiiPrdName : '';
    var PitId = oneLine ? oneLine.PitId : '';
    var VatId = oneLine ? oneLine.VatId : vat_id;
    var LtpId = oneLine ? oneLine.LtpId : '';
    if (oneLine) {
        $('#hf_cii_prd_id').text(oneLine.PrdFId);
        $('#hf_cii_pit_id').text(oneLine.PitFId);
    }
    
    var disabled =  "";
    var startBox = "<div class='box'><div class='box-body'>";
    var endBox = "</div></div>";
    var onelineContent =
        // start box
        "<div class='form-group' id='div_one_line'>" +
            "<div class='row'>" +
            "<div class='col-md-12'>" +
            "<div class='box-body'>" +
            "<div class='form-horizontal'>" +
            "<div class='form-group'>" +
            "<label class='col-sm-2 control-label' style='display:none;' >Type de ligne</label>" +
            "<div class='col-sm-2' style='display:none;' ><select class='form-control' id='LtpId_zzz_' " + disabled + " name='LtpId_zzz_' ciiId='" + CiiId + "' onchange='ltpChange(this)'></select></div>" +
            "<label class='col-sm-2 control-label' style='display:none;' >Niveau 1</label>" +
            "<div class='col-sm-2' style='display:none;' ><input type='text' onkeypress='validateNumber(event)' " + disabled + "  value='" + CiiLevel1 + "' ciiId='" + CiiId + "'class='form-control' id='ClnLevel1_zzz_' name='ClnLevel1_zzz_' maxlength='3' /></div>" +
            "<label class='col-sm-2 control-label' style='display:none;' >Niveau 2</label>" +
            "<div class='col-sm-2' style='display:none;' ><input type='text' onkeypress='validateNumber(event)' " + disabled + "  value='" + CiiLevel2 + "' ciiId='" + CiiId + "'class='form-control' id='ClnLevel2_zzz_' name='ClnLevel2_zzz_' maxlength='3' /></div>" +
            "</div>" +
            "<div class='form-group variant'>" +
            "<label class='col-sm-4 control-label'>Référence du produit</label>" +
            "<div class='col-sm-4'><input class='form-control' id='PrdId_zzz_' " + disabled + "  name='PrdId_zzz_' value='" + PrdName + "' onkeyup='checkContent(this)' ciiId='" + CiiId + "' /></div><div class='col-sm-4'></div>" +
            "</div>" +
            // driver and accessory list
            "<div class='form-group' id='div_drv_acc_list'>" +
            "</div>" +
            // close box
            "</div></div></div></div></div>";

    var btnAddUpdate = "<button class='btn btn-inverse' ciiId='" + CiiId + "' id='btn_add_update_line_zzz_' name='btn_add_update_line_zzz_' onclick='return AddUpdateCiiDrvAcc(this)'><span>" + (!create ? "Mettre à jour" : "Ajouter") + "</span></button>";
    var btnDelete = "<button class='btn btn-inverse' ciiId='" + CiiId + "' id='btn_delete_line_zzz_' name='btn_delete_line_zzz_' onclick='return delete_Cln_Line_Confirm(this)'><span>Supprimer</span></button>";
    var btnClose = "<button class='btn btn-default bootbox-close-button' onclick='return false'><span>Annuler</span></button>";

    var btns = "<div class='modal-body center'>" + btnClose +  btnAddUpdate+ "</div>";

    var onecontent = startBox + onelineContent + btns + endBox;

    onecontent = replaceAll(onecontent, '_zzz_', '_' + CiiId);
    currentCiiId= CiiId;
    //$('#div_cost_plan_lines').append(onelineContent);


    var title = !create ? 'Mettre à jour cette linge' : 'Ajouter une ligne';
    bootbox.dialog({
        title: title,
        message: onecontent
    }).find('.modal-dialog').css({
        'width': '70%'
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
    setAutoCompleteForDrvAcc(CiiId);
    setLintType(CiiId, LtpId);
    setLineTva(CiiId, VatId);
    if (!create) {
        //currentClnId
        var subPrdId = '#PitId_' + currentClnId;
        var urlpit = window.webservicePath + "/GetPitByRef";
        try {
            $.ajax({
                url: urlpit,
                data: "{ 'pitRef': '', prdId:'" + PrdId + "'}",
                dataType: "json",
                type: "POST",
                contentType: "application/json; charset=utf-8",
                success: function(data) {
                    var jsdata2 = data.d;
                    var data2Treat = jQuery.parseJSON(jsdata2);
                    $(subPrdId).empty();
                    if ($.isArray(data2Treat)) {
                        $.each(data2Treat, function(name, pit) {
                            if (pit.PitId === PitId) {
                                $(subPrdId).append(
                                    $("<option></option>").attr("value", pit.FId).attr("data-value", pit.PitPurchasePrice).attr('selected', true).text(pit.PitRef)
                                );
                            } else {
                                $(subPrdId).append(
                                    $("<option></option>").attr("value", pit.FId).attr("data-value", pit.PitPurchasePrice).text(pit.PitRef)
                                );
                            }
                        });
                    }
                },
                error: function(response) {
                }
            });
        } catch (e) {
            var test = e;
        }
    } else {
        $('#LtpId_' + currentCiiId).change();
    }

    return false;
}

function setAutoCompleteForDrvAcc(clnId) {
    var url = window.webservicePath + "/GetProductsByRef";
    $("#PrdId_" + clnId).autocomplete({
        source: function(request, response) {
            $.ajax({
                url: url,
                data: "{ 'prdRef': '" + request.term + "'}",
                dataType: "json",
                type: "POST",
                contentType: "application/json; charset=utf-8",
                success: function(data) {

                    $('#div_drv_acc_list').empty();
                    var jsdata = data.d;
                    var data2Treat = jQuery.parseJSON(jsdata);
                    if (data2Treat.length > 0) {
                        response($.map(data2Treat, function(item) {
                            return {
                                label: item.PrdRef,
                                val: item.FId,
                                prdId: item.PrdId,
                                datavalue: item.PrdImg,
                            }
                        }));
                    } else {
                        $('#PitId_' + clnId).empty();
                        $('#ClnPrdDes_' + clnId).text('');
                        $('#div_tempColor').remove();
                        $('#div_operation').remove();
                    }
                },
                error: function(response) {
                    //alert(response.responseText);
                },
                failure: function(response) {
                    alert(response.responseText);
                }
            });
        },
        select: function(e, i) {
            $("#hf_cii_prd_id").text(i.item.val);
            $('#PitId_zzz_').val('');
            $("#hf_cii_pit_id").text('');
            //console.log(i.item);
            //currentClnId
            var subPrdId = '#PitId_' + currentCiiId;
            var urlpit = window.webservicePath + "/GetProductDrvAcc";
            $.ajax({
                url: urlpit,
                data: "{ prdId:'" + i.item.val + "'}",
                dataType: "json",
                type: "POST",
                contentType: "application/json; charset=utf-8",
                success: function(data) {
                    var jsdata = data.d;
                    var data2Treat = jQuery.parseJSON(jsdata);
                    $(subPrdId).empty();
                    productInstances = [];
                    if ($.isArray(data2Treat)) {
                        productInstances = data2Treat;
                        //console.log(productInstances);
                        //div_drv_acc_list
                        var titlecontent = "<div class='row'><div class='col-sm-12'>" +
                            "<table cellpadding='0' cellspacing='0' border='0' class='datatable table table-striped table-bordered table-hover'>" +
                            "<tr>" +
                            "<th style='width :40%'>Réf</th>" +
                            "<th style='width :10%'>Prix d'achat</th>" +
                            "<th style='width :10%'>Prix de vente</th>" +
                            "<th style='width :10%'>TVA</th>" +
                            "<th style='width :10%'>Qté</th>" +
                            "<th style='width :10%'>P.T. HT</th>" +
                            "<th style='width :10%'>P.T. TTC</th>" +
                            "</tr>" +
                            "</table>" +
                            "</div></div>";

                        $('#div_drv_acc_list').append(titlecontent);

                        var drv_acc_content = "<div class='row'><div class='col-sm-12' style='max-height:300px;overflow-y:auto;'>" +
                            "<table cellpadding='0' cellspacing='0' border='0' class='datatable table table-striped table-bordered table-hover'>";

                        $.each(productInstances, function(name, value) {
                            var tooltips = "";
                            var tooltipcount = value.PitAllInfo.length;
                            $.each(value.PitAllInfo, function(idx, info) {
                                if (idx === 0) {
                                    var tooltitle = (value.InvId === 1 ? ("DRIVER de " + i.item.label + "<br>") : (value.InvId === 2 ? ("ACCESSOIRE de " + i.item.label + "<br>") : ""));
                                    tooltips += "<span id='sp_drv_acc_des_" + value.PitId + "'>" + tooltitle ;
                                }
                                tooltips += info.PropName + " : " + info.PropValue + " " + info.PropUnit + "<br/>";
                                if (idx === tooltipcount - 1) {
                                    tooltips += value.PitDescription;
                                    tooltips += "</span>";
                                }
                            });

                            var onecontent = "<tr>";
                            onecontent += "<td style='width :40%' class='row new_tooltips'>" + tooltips + value.PrdName + " - " + value.PitRef + "</td>";
                            onecontent += "<td style='width :10%'><label id='lb_purchase_price_" + value.PitId + "'>" + value.PitPurchasePrice + "</label></td>";
                            onecontent += "<td style='width :10%'><input type='number' class='form-control' min='0' value='" + value.PitPrice + "' prdId='" + value.PrdId + "' pitId='" + value.PitId + "'  id='ip_drv_acc_price_" + value.PitId + "' onkeyup='CalCulateDrvAccPrice(this)' /></td>";
                            onecontent += "<td style='width :10%'><select class='form-control' id='VatId_" + value.PitId + "' name='VatId_" + value.PitId + "' prdId='" + value.PrdId + "' pitId='" + value.PitId + "' onchange='CalCulateDrvAccPrice(this)'></select></td>";
                            onecontent += "<td style='width :10%'><input type='number' class='form-control' min='0' id='ip_drv_acc_qty_" + value.PitId + "' prdId='" + value.PrdId + "' pitId='" + value.PitId + "'  onkeyup='CalCulateDrvAccPrice(this)'/></td>";
                            onecontent += "<td style='width :10%'><label id='lb_ht_" + value.PitId + "'></label></td>";
                            onecontent += "<td style='width :10%'><label id='lb_ttc_" + value.PitId + "'></label></td>";
                            onecontent += "</tr>";
                            drv_acc_content += onecontent;

                        });
                        drv_acc_content += "</tr>" + "</table>" + "</div></div>";
                        $('#div_drv_acc_list').append(drv_acc_content);

                        $.each(productInstances, function(name, value) {
                            var vatId = 0;
                            var budgetId = '#VatId_' + value.PitId;
                            $(budgetId).empty();
                            $.each(allTVA, function(inx, tvaVal) {
                                if (vatId && tvaVal.Key === vatId) {
                                    $(budgetId)
                                        .append($("<option></option>")
                                            .attr("value", tvaVal.Key).attr("selected", true).attr("data-value", tvaVal.DcValue)
                                            .text(tvaVal.Value));
                                } else {
                                    $(budgetId)
                                        .append($("<option></option>")
                                            .attr("value", tvaVal.Key)
                                            .attr("data-value", tvaVal.DcValue)
                                            .text(tvaVal.Value));
                                }
                            });
                        });
                    }
                    $(subPrdId).change();
                },
                error: function(response) {
                }
            });
        },
        minLength: 2
    });
}

function CalCulateDrvAccPrice(sender) {
    var pitId = $(sender).attr('pitId');
    var tva = $('#VatId_' + pitId + '  option:selected');
    var quantity = $('#ip_drv_acc_qty_' + pitId).val() * 1;
    var unitprice = $('#ip_drv_acc_price_' + pitId).val() * 1;
    var totalHT = $('#lb_ht_' + pitId);
    var totalTTC = $('#lb_ttc_' + pitId);
    
    var tva_value = tva.attr('data-value') * 1;
    var _total_ht = quantity * (unitprice);
    var _total_ttc = _total_ht * (1 + tva_value / 100);
    
    _total_ht = _total_ht.toFixed(2);
    _total_ttc = _total_ttc.toFixed(2);
    totalHT.text(_total_ht);
    totalTTC.text(_total_ttc);
}

function AddUpdateCiiDrvAcc(sender) {
    $(sender).prop('disabled', true);
    var ciiId = $(sender).attr('ciiid');
    var LtpId = $('#LtpId_' + ciiId).val() * 1;
    var PrdFId = $("#hf_cii_prd_id").text();

    var clns = [];
    var allLines = $("input[id^='ip_drv_acc_qty_']");
    var ClnLevel1 = $('#ClnLevel1_' + ciiId);
    var ClnLevel2 = $('#ClnLevel2_' + ciiId);
    var ClnDescription = "";
    
    var ltp_id = LtpId;
    var level1 = ClnLevel1.val() * 1 + 0;
    var level2 = ClnLevel2.val() * 1 + 0;

    $.each(allLines, function(name, value) {
        var qty = $(value).val() * 1;
        if (qty) {
            var PrdId = $(value).attr('prdId') * 1;
            var PitId = $(value).attr('pitId') * 1;
            var tva = $('#VatId_' + PitId + '  option:selected').attr('data-value') * 1;
            var VatId = $('#VatId_' + PitId + '  option:selected').val() * 1;

            var quantity = $('#ip_drv_acc_qty_' + PitId).val().replace(',', '.') * 1;
            var unitprice = $('#ip_drv_acc_price_' + PitId).val().replace(',', '.') * 1;
            var purchasePrice = $('#lb_purchase_price_' + PitId).text().replace(',', '.') * 1;
            var CiiTotalPrice = quantity * unitprice;
            var CiiTotalCrudePrice = CiiTotalPrice * (1 + tva / 100);
            CiiTotalPrice = CiiTotalPrice.toFixed(2);
            CiiTotalCrudePrice = CiiTotalCrudePrice.toFixed(2);
            var CiiDiscountPercentage = 0;
            var CiiDiscountAmount = 0;
            var CiiPriceWithDiscountHt = CiiTotalPrice;
            var clnMargin = (CiiTotalPrice - purchasePrice) * quantity;
            var description = replaceAll(replaceAll($('#sp_drv_acc_des_' + PitId).html(), '<br>', '\r\n'), '<br/>', '\r\n');
            var oneline = {};
            oneline.FId = PrdFId;
            oneline.PrdFId = PrdFId;
            oneline.CinId = 0;
            oneline.CinFId = getUrlVars()['cinId'];

            oneline.CiiLevel1 = level1;
            oneline.CiiLevel2 = level2;
            oneline.CiiDescription = description;
            oneline.PrdId = PrdId;
            oneline.PitId = PitId;
            oneline.PrdName = "";
            oneline.PitName = "";
            oneline.CiiPrdName = "";
            oneline.CiiPurchasePrice = purchasePrice;
            oneline.CiiUnitPrice = unitprice;
            oneline.CiiQuantity = quantity;
            oneline.CiiTotalPrice = CiiTotalPrice;
            oneline.CiiTotalCrudePrice = CiiTotalCrudePrice;

            oneline.CiiDiscountPercentage = 0;
            oneline.CiiDiscountAmount = 0;
            oneline.CiiPriceWithDiscountHt = CiiTotalPrice;
            oneline.CiiMargin = clnMargin;
            oneline.CiiPrdDes = "";

            oneline.VatId = VatId;
            oneline.LtpId = ltp_id;

            clns.push(oneline);
        }
    });

    //console.log(clns);
    $(sender).prop('disabled', false);

    if (clns.length > 0) {
        ShowPleaseWait();
        var jsondata = JSON.stringify({ ciis: clns });
        var url = window.webservicePath + "/InsertUpdateCiis";
        $.ajax({
            url: url,
            type: 'POST',
            contentType: 'application/json; charset=utf-8',
            data: jsondata,
            dataType: 'json',
            success: function(data) {
                $('.bootbox-close-button').click();
                $(sender).prop('disabled', false);
                loadAllLines();
            },
            error: function(data) {
                alert(data.responseText);
                $(sender).prop('disabled', false);
            }
        });
    }
    return false;
}
