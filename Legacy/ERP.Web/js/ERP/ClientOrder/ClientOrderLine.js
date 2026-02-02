//$(document).ready(initCostPlanLine);

function initClientOrderLine() {
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
        },
        error: function (data) {
            var test = '';
        }
    });
}

function setAutoComplete(colId) {
    var url = window.webservicePath + "/GetProductsByRef";
    $("#PrdId_" + colId).autocomplete({
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
                        $('#PitId_' + colId).empty();
                        $('#ColPrdDes_' + colId).text('');
                        $('#div_tempColor').remove();
                        $('#div_operation').remove();
                    }
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
            $("#hf_col_prd_id").text(i.item.val);
            // show image
            if (i.item.datavalue) {
                $('#div_prd_image').empty();
                var imgContent = "<img src='../../Services/ShowOutSiteImage.ashx?file=" + i.item.datavalue + "' alt=''   class='img-responsive'  style='width: 100%' />";
                $('#div_prd_image').append(imgContent);
            } else {
                $('#div_prd_image').empty();
            }
            $('#PitId_zzz_').val('');
            $("#hf_col_pit_id").text('');

            //currentColId
            var subPrdId = '#PitId_' + currentColId;
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
                                .attr("description", pit.PitDescription)
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
            "<div class='col-sm-2'><select id='Pit_Temp_Color_" + currentColId + "' name='Pit_Temp_Color_" + currentColId+ "' class='form-control' colid='" + currentColId + "' onchange='TempColorChange(this)'/></select>" +
            "</div>" +
            "</div>";
        $('#div_ref_prd').append(tempColorContent);
        $('#Pit_Temp_Color_' + currentColId).append(
            $("<option></option>").attr("value", '0').attr('selected', true).text('Sélectionner un couleur')
        );
        tempColor = jQuery.unique(tempColor);
        $.each(tempColor, function(name, value) {
            $('#Pit_Temp_Color_' + currentColId).append($("<option></option>").attr("value", value).text(value));
        });
    }
    var operation = getValueInArray(tempcolorOpration, "PropValue2");
    operation = jQuery.unique(operation);
    operation.sort();
    if (tempColor.length > 0) {
        var oprationContent = "<div id='div_operation'>" +
            "<label class='col-sm-2 control-label'>Opération</label>" +
            "<div class='col-sm-2'><select id='Pit_operation_" + currentColId + "' name='Pit_operation_" + currentColId + "' class='form-control' colid='" + currentColId + "' onchange='OperationChange(this)'/></select>" +
            "</div>" +
            "</div>";
        $('#div_ref_prd').append(oprationContent);
        $('#Pit_operation_' + currentColId).append(
            $("<option></option>").attr("value", '0').attr('selected', true).text('Sélectionner une opération')
        );
        operation = jQuery.unique(operation);
        $.each(operation, function(name, value) {
            $('#Pit_operation_' + currentColId).append($("<option></option>").attr("value", value).text(value));
        });
    }
}

function TempColorChange(sender) {
    var tempvalue = $(sender).val();
    var clnid = $(sender).attr('colid') * 1;
    var operationvalue = $('#Pit_operation_' + clnid).val();
    TempColorOperationChange(tempvalue,operationvalue, clnid);
}

function OperationChange(sender) {
    var operationvalue = $(sender).val();
    var clnid = $(sender).attr('colid') * 1;
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

var costPlanLineInPage = [];

function loadAllLines() {
    ShowPleaseWait();
    var codId= getUrlVars()['codId'];
    var url = window.webservicePath + "/GetAllClientOrderLines";
    $.ajax({
        url: url,
        type: 'POST',
        contentType: 'application/json; charset=utf-8',
        data: "{codId:'" + codId + "'}",
        dataType: 'json',
        success: function(data) {
            var jsdata = data.d;
            var jsondata = jQuery.parseJSON(jsdata);
            if (jsondata !== '-1') {
                costPlanLineInPage = [];
                costPlanLineInPage = jsondata;
                if (costPlanLineInPage.length > 0) {
                    $('#btn_generate_pdf').show();
                } else {
                    $('#btn_generate_pdf').hide();
                }
                var linecount = 1;
                $('#tbody_cost_plan_line').empty();

                var total_quanity = 0;
                var total_ht = 0;
                var total_ttc = 0;
                $.each(jsondata, function(name, value) {
                    var lineclass = (linecount % 2 === 1) ? "odd" : "even";
                    var prdname = (value.LtpId === 2 || value.LtpId === 4) ? value.ColPrdName : "";
                    var pitname = (value.LtpId === 2 || value.LtpId === 4) ? value.PitName : "";
                    var quantity = (value.LtpId === 2 || value.LtpId === 4) ? value.ColQuantity : "";
                    total_quanity += (quantity * 1);
                    var purchasePrice = (value.LtpId === 2 || value.LtpId === 4) ? value.ColPurchasePrice : "";
                    var unitprice = (value.LtpId === 2 || value.LtpId === 4) ? value.ColUnitPrice : "";
                    var unitpriceDiscount = (value.LtpId === 2 || value.LtpId === 4) ? value.ColPriceWithDiscountHt : "";
                    var vatlabel = (value.LtpId === 2 || value.LtpId === 4) ? value.VatLabel : "";
                    var totalht = (value.LtpId === 2 || value.LtpId === 4 || value.LtpId === 5 || value.LtpId === 6) ? value.ColTotalPrice : "";
                    total_ht += (totalht * 1);
                    var totalttc = (value.LtpId === 2 || value.LtpId === 4 || value.LtpId === 5 || value.LtpId === 6) ? value.ColTotalCrudePrice : "";
                    total_ttc += (totalttc * 1);
                    if (value.LtpId === 5) {
                        lineclass += " subTotal";
                    }
                    if (value.LtpId === 6) {
                        lineclass += " total";
                    }
                    var description = replaceAll(value.ColPrdDes, '\n', '</br>') + '</br>---------------------------</br>' + replaceAll(value.ColDescription, '\n', '</br>');
                    
                    var btnPin = "<button class='btn btn-inverse' title='Intention d&apos;achat' id='" + value.ColId + "' sodFId='" + value.SodFId + "' pinFId='" + value.PinFId + "' solId='" + value.SolId + "' pilId='" + value.PilId + "' colId='" + value.ColId + "' " + (value.PilId != 0 || value.SolId != 0 ? "style='color:#d96666' onclick='return PinConsult(this)'" : "onclick='return Pin_cln_click(this)") + " '><i class='fa fa-dollar'></i></button>";


                    var btns = "<button class='btn btn-inverse' title='Modifier' id='" + value.ColId + "' colId='" + value.ColId + "' onclick='return modify_col_click(this)'><i class='fa fa-edit'></i></button>" +
                        "<button class='btn btn-inverse' title='Supprimer' id='" + value.ColId + "' colId='" + value.ColId + "' onclick='return delete_Col_Line_Confirm(this)'><i class='fa fa-times'></i></button>";
                    var oneline = "<tr class='" + lineclass + "'>" +
                        "<td class='label_left'>" + value.ColLevel1 + "." + value.ColLevel2 + "</td>" +
                        //"<td class='label_left'>" + value.LineType + "</td>" +
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
                        "<td>" +
                        (pageUserRight.RitCreate ? (btns + btnPin) : "")
                        +
                        "</td></tr>";
                    linecount ++;
                    $('#tbody_cost_plan_line').append(oneline);
                });

                total_ht = total_ht.toFixed(2);
                total_ttc = total_ttc.toFixed(2);
                var totalLine = "<tr ><td colspan='5' class='text-align:left; font-weight:bolder;'>TOTAL</td>" +
                    "<td class='label_right' style='color : green; font-weight:bolder;'>" + total_quanity + "</td>" +
                    "<td></td>" +
                    "<td></td>" +
                    "<td></td>" +
                    "<td></td>" +
                    "<td class='label_right' style='color : green; font-weight:bolder;'>" + total_ht + "</td>" +
                    "<td class='label_right' style='color : green; font-weight:bolder;'>" + total_ttc + "</td>" +
                    "<td></td>" +
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


function PinConsult(sender) {
    var pinFId = $(sender).attr('pinFId');
    var sodFId = $(sender).attr('sodFId');
    var pilId =  $(sender).attr('pilId');
    var solId =  $(sender).attr('solId');
    MsgPopUpWithResponseChoice("Consulter la ligne d'achat", "L'intention d'achat / La commande fournisseur a été créé, vous pouvez la consulter","Consulter", "ViewPinSod('" + pinFId + "','" + pilId + "','" + sodFId + "','" + solId + "')", "Annuler");
    return false;
}

function ViewPinSod(pinFId, pilId, sodFId, solId) {
    var url;
    if (solId != 0) {
        url = '../SupplierOrder/SupplierOrder.aspx?sodId=' + sodFId + "&mode=view&solId=" + solId;
        window.open(url, '_blank');
    } else {
        url = '../PurchaseIntent/PurchaseIntent.aspx?pinId=' + pinFId + "&mode=view&pilId=" + pilId;
        window.open(url, '_blank');
    }
    return false;
}

function Pin_cln_click(sender) {

    var ColId = $(sender).attr('colid') * 1;
    var oneLine = searchInArray(costPlanLineInPage, 'ColId', ColId)[0];
    if (!jQuery.isEmptyObject(oneLine)) {
//        var cplVatId = 1;
//        if (currentCod) {
//            cplVatId = currentCod.VatId;
//        }

        var create = true;
        //var ColId = oneLine ? oneLine.ColId : lineCount;
        lineCount--;
        var CplId = oneLine ? oneLine.CplId : '';
        var CplFId = oneLine ? oneLine.CplFId : '';
        var ColLevel1 = oneLine ? oneLine.ColLevel1 : getNextLevel1();
        var ColLevel2 = oneLine ? oneLine.ColLevel2 : '1';
        var ColDescription = oneLine ? oneLine.ColDescription : '';
        var PrdId = oneLine ? oneLine.PrdId : '';
        var PrdName = oneLine ? oneLine.ColPrdName : '';
        var PitId = oneLine ? oneLine.PitId : '';
        var PitName = oneLine ? oneLine.PitName : '';
        var ColPurchasePrice = oneLine ? oneLine.ColPurchasePrice : '';
        var ColUnitPrice = oneLine ? oneLine.ColUnitPrice : '';
        var ColQuantity = oneLine ? oneLine.ColQuantity : '';
        var ColTotalPrice = oneLine ? oneLine.ColTotalPrice : '';
        var ColTotalCrudePrice = oneLine ? oneLine.ColTotalCrudePrice : '';
        var VatId = oneLine ? oneLine.VatId : cplVatId;
        var LtpId = oneLine ? oneLine.LtpId : '';
        var LineType = oneLine ? oneLine.LineType : '';
        var PrdImgPath = oneLine ? oneLine.PrdImgPath : '';
        var ColDiscountPercentage = oneLine ? oneLine.ColDiscountPercentage : '';
        var ColDiscountAmount = oneLine ? oneLine.ColDiscountAmount : '';
        var ColPriceWithDiscountHt = oneLine ? oneLine.ColPriceWithDiscountHt : '';
        var ColMargin = oneLine ? oneLine.ColMargin : '';
        var ColPrdDes = oneLine ? oneLine.ColPrdDes : '';
    


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
                "<label class='col-sm-2 control-label' style='display:none;'>Type de ligne</label>" +
                "<div class='col-sm-2' style='display:none;' ><select class='form-control' disabled id='LtpId_zzz_' name='LtpId_zzz_' colid='" + ColId + "' onchange='ltpChange(this)'></select></div>" +
                "<label class='col-sm-2 control-label' >Niveau 1</label>" +
                "<div class='col-sm-2' ><input type='text' disabled onkeypress='validateNumber(event)' value='" + ColLevel1 + "' colid='" + ColId + "'class='form-control' id='ColLevel1_zzz_' name='ColLevel1_zzz_' maxlength='3' /></div>" +
                "<label class='col-sm-2 control-label' >Niveau 2</label>" +
                "<div class='col-sm-2' ><input type='text'  disabled onkeypress='validateNumber(event)' value='" + ColLevel2 + "' colid='" + ColId + "'class='form-control' id='ColLevel2_zzz_' name='ColLevel2_zzz_' maxlength='3' /></div>" +
                "</div>" +
                "<div class='form-group variant'>" +
                "<label class='col-sm-2 control-label'>Référence du produit</label>" +
                "<div class='col-sm-2'><input class='form-control' disabled  id='PrdId_zzz_' name='PrdId_zzz_' value='" + PrdName + "' onkeyup='checkContent(this)' colid='" + ColId + "' onblur='checkPrdMandatory(this)' /></div>" +
                "<div id='div_ref_prd'></div></div>" +
                "<div class='form-group variant'>" +
                "<label class='col-sm-2 control-label sale'>Référence du sous produit</label>" +
                "<div class='col-sm-2 sale'><select id='PitId_zzz_'  disabled name='PitId_zzz_' class='form-control' colid='" + ColId + "' onchange='pitChange(this)'/></select></div>" +
                "<label class='col-sm-2 control-label'>Prix d'achat</label>" +
                "<div class='col-sm-2'><input type='number' step='0.01' disabled  class='form-control' colid='" + ColId + "' id='ColPurchasePrice_zzz_' name='ColPurchasePrice_zzz_' min='0' value='" + ColPurchasePrice + "' /></div>" +
                "<div class='col-sm-4  center'></div>" +
                "</div>" +
                "<div class='form-group variant'><label class='col-sm-2 control-label'>TVA</label>" +
                "<div class='col-sm-2'><select class='form-control' disabled  colid='" + ColId + "' id='VatId_zzz_' name='VatId_zzz_' onchange='CalCulatePrice(this)'></select></div>" +
                "<label class='col-sm-2 control-label'>Quantité</label>" +
                "<div class='col-sm-2'><input type='number' step='1' disabled  class='form-control' id='ColQuantity_zzz_'  colid='" + ColId + "' name='ColQuantity_zzz_' min='0' value='" + ColQuantity + "' onkeyup='CalCulatePrice(this)'/></div>" +
                "<label class='col-sm-2 control-label'>Prix unitaire</label>" +
                "<div class='col-sm-2'><input type='number' step='0.01' disabled  class='form-control' colid='" + ColId + "' id='ColUnitPrice_zzz_' name='ColUnitPrice_zzz_' min='0' value='" + ColUnitPrice + "' onkeyup='CalCulatePrice(this)'/></div>" +
                "</div>" +
                "<div class='form-group variant'>" +
                "<div class='col-sm-4'></div>" +
                "<label class='col-sm-2 control-label' style='color:#d96666'>Quantité d'achat</label>" +
                "<div class='col-sm-2'><input type='number' step='1' style='color:#d96666' class='form-control' id='ColPurchaseQty_zzz_'  colid='" + ColId + "' name='ColPurchaseQty_zzz_' min='0' value='" + ColQuantity + "' /></div>" +
                "<label class='col-sm-2 control-label' style='color:#d96666'>Commentaire</label>" +
                "<div class='col-sm-2'><textarea rows='2'  style='color:#d96666' colid='" + ColId + "'  id='ColPilDes_zzz_' name='ColPilDes_zzz_' class='form-control'></textarea>" +
                "</div>" +
                "</div>" +
                
            "<div class='form-group variant'>" +
            "<div class='col-sm-4'></div>" +
            "<label class='col-sm-2 control-label' style='color:#d96666'>Code fonction</label>"+
            "<div class='col-sm-2'><input type='text'  style='color:#d96666' class='form-control' id='FeatureCode_zzz_' colid='" + ColId + "' name='FeatureCode_zzz_'  /></div>" +
            "<div class='col-sm-4'></div>" +
            "</div>"+

                //remise
                "<div class='form-group variant'><label class='col-sm-2 control-label'>Pourcentage de remise</label>" +
                "<div class='col-sm-2'><div class='input-group'><input type='number' disabled  step='0.01' class='form-control' colid='" + ColId + "' field='ColDiscountPercentage' id='ColDiscountPercentage_zzz_' name='ColDiscountPercentage_zzz_' min='0' value='" + ColDiscountPercentage + "' onkeyup='CalCulatePrice(this)'/><span class='input-group-addon'>%</span></div></div>" +
                "<label class='col-sm-2 control-label'>Montant de remise</label>" +
                "<div class='col-sm-2'><input type='number' step='1' class='form-control' disabled  id='ColDiscountAmount_zzz_'  colid='" + ColId + "' field='ColDiscountAmount' name='ColDiscountAmount_zzz_' min='0' value='" + ColDiscountAmount + "' onkeyup='CalCulatePrice(this)'/></div>" +
                "<label class='col-sm-2 control-label'>Prix remisé</label>" +
                "<div class='col-sm-2'><input type='number' step='0.01' disabled  class='form-control' colid='" + ColId + "'  field='ColPriceWithDiscountHt' id='ColPriceWithDiscountHt_zzz_' name='ColPriceWithDiscountHt_zzz_' min='0' value='" + ColPriceWithDiscountHt + "' onkeyup='CalCulatePrice(this)'/></div>" +
                "</div>" +
                // end remise
                "<div class='form-group  variant'><label class='col-sm-2 control-label'>Total H.T.</label>" +
                "<div class='col-sm-2'><input type='number' disabled  step='0.01' class='form-control' colid='" + ColId + "' id='ColTotalPrice_zzz_' name='ColTotalPrice_zzz_' value='" + ColTotalPrice + "' /></div>" +
                "<label class='col-sm-2 control-label'>Total T.T.C.</label>" +
                "<div class='col-sm-2'><input type='number' disabled step='0.01' class='form-control' colid='" + ColId + "' id='ColTotalCrudePrice_zzz_' name='ColTotalCrudePrice_zzz_' value='" + ColTotalCrudePrice + "' /></div>" +
                "<label class='col-sm-2 control-label'>Marge</label>" +
                "<div class='col-sm-2'><input type='number' disabled step='0.01' class='form-control' colid='" + ColId + "' id='ColMargin_zzz_' name='ColMargin_zzz_' value='" + ColMargin + "' /></div>" +
                "</div>" +
                "<div class='form-group  variant'>" +
                "<div class='col-sm-2'></div><div class='col-sm-2' id='div_prd_image'><!-- image -->" +
                (create ? "" : "<img src='../../Services/ShowOutSiteImage.ashx?file=" + PrdImgPath + "' alt=''   class='img-responsive'  style='width: 100%' />") +
                "</div><div class='col-sm-10'></div>" +
                "</div>" +
                "<div class='form-group'>" +
                "<label class='col-sm-2 control-label'>Description de produit</label>" +
                "<div class='col-sm-10'><textarea rows='7' disabled cols='1' colId='" + ColId + "'  id='ColPrdDes_zzz_' value='" + ColPrdDes + "' name='ColPrdDes_zzz_' class='form-control'></textarea>" +
                "</div>" +
                "</div>" +
                "<div class='form-group'>" +
                "<label class='col-sm-2 control-label'>Description</label>" +
                "<div class='col-sm-10'><textarea rows='3' cols='1'  disabled colId='" + ColId + "'  id='ColDescription_zzz_' value='" + ColDescription + "' name='ColDescription_zzz_' class='form-control'></textarea></div></div>" +
                // close box
                "</div></div></div></div></div>";

    var btnAddUpdate = "<button class='btn btn-inverse' colId='" + ColId + "' id='btn_add_update_line_zzz_' name='btn_add_update_line_zzz_' onclick='return AddCol2Pin(this)'><span style='color:#d96666'>Ajouter une ligne d'achat</span></button>";
        var btnDelete = "<button class='btn btn-inverse' colId='" + ColId + "' id='btn_delete_line_zzz_' name='btn_delete_line_zzz_' onclick='return delete_Col_Line_Confirm(this)'><span>Supprimer</span></button>";
        var btnClose = "<button class='btn btn-default bootbox-close-button' onclick='return false'><span>Annuler</span></button>";

        var btns = "<div class='modal-body center'>" + btnClose + btnAddUpdate + "</div>";

        var onecontent = startBox + onelineContent + btns + endBox;

        onecontent = replaceAll(onecontent, '_zzz_', '_' + ColId);
        //currentColId = ColId;
        //$('#div_cost_plan_lines').append(onelineContent);
        
        var title = "<span style='color:#d96666'>Ajouter une ligne d'achat</span>";
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
                var h = (w - b) * 0.05;
                return h + "px";
            }
        }).find('.modal-header').css({
            'background': 'url(../../img/menu_005_bg.jpg) repeat-x',
            'text-align': 'center',
            'color': '#C0C0C0'
        });
        setAutoComplete(ColId);
        setLintType(ColId, LtpId);
        setLineTva(ColId, VatId);
        if (create) {
            //currentColId
            var subPrdId = '#PitId_' + currentColId;
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
            $('#LtpId_' + currentColId).change();
        }
        if (ColDescription) {
            $('#ColDescription_' + currentColId).text(ColDescription);
        }

        if (ColPrdDes) {
            $('#ColPrdDes_' + currentColId).text(ColPrdDes);
        }

        if (oneLine) {
            preLoadProductInstance(oneLine.PrdId);
        }
    }
    return false;
}



function AddCol2Pin(sender) {
    var clnId = $(sender).attr('colId') * 1;
    var qty = ($('#ColPurchaseQty_' + clnId).val() * 1).toFixed(0);
    var comment = $('#ColPilDes_' + clnId).val();
    var featureCode = $('#FeatureCode_' + clnId).val();
    if (qty > 0) {
        var url = window.webservicePath + "/CreatePinByLine";
        ShowPleaseWait();
        $.ajax({
            type: "POST",
            url: url,
            contentType: "application/json; charset=utf-8",
            dataType: "json",
            data: "{qty:" + qty + ",cmt:'" + comment + "',featureCode:'" + featureCode + "',clnId:0,colId:" + clnId + ",ciiId:0}",
            success: function(data) {
                var jsdata = data.d;
                var data2Treat = jQuery.parseJSON(jsdata);
                if (data2Treat !== '-1') {
                    HidePleaseWait();
                    alert("La ligne d'achat a été créée !");
                    $('.bootbox-close-button').click();
                    loadAllLines();
                } else {
                    AuthencationError();
                }
            },
            error: function(data) {
                HidePleaseWait();
                var test = '';
            }
        });
    } else {
        alert('La quantité doit être supérieure à 0 !');
    }
    return false;
}

function modify_col_click(sender) {
    var colId = $(sender).attr('id') * 1;
    var oneCol = searchFieldValueInArray(costPlanLineInPage,'ColId',colId);
    if (oneCol) {
        setAddUpdateLine(oneCol);
    }
    return false;
}

function getNextLevel1() {
    var level1 = 1;
    if (costPlanLineInPage && costPlanLineInPage.length > 0) {
        var maxLevel1 = costPlanLineInPage.sort(dynamicSort("-ColLevel1"));
        level1 = maxLevel1[0].ColLevel1 * 1 + 1;
    }
    return level1;
}

var prdsForAtCompl = [];
var pitsForAtCompl = [];
var lineCount = 0;

var currentColId = 0;

function setAddUpdateLine(oneLine, forUpdateCreate) {
    $('#hf_col_prd_id').text('');
    $('#hf_col_pit_id').text('');
    var cplVatId = 1;
    if (currentCod) {
        cplVatId = currentCod.VatId;
    }


    var create = oneLine ? false : true;
    var ColId = oneLine ? oneLine.ColId : lineCount;
    lineCount--;
    var CplId = oneLine ? oneLine.CplId : '';
    var CplFId = oneLine ? oneLine.CplFId : '';
    var ColLevel1 = oneLine ? oneLine.ColLevel1 : getNextLevel1();
    var ColLevel2 = oneLine ? oneLine.ColLevel2 : '1';
    var ColDescription = oneLine ? oneLine.ColDescription : '';
    var PrdId = oneLine ? oneLine.PrdId : '';
    var PrdName = oneLine ? oneLine.ColPrdName : '';
    var PitId = oneLine ? oneLine.PitId : '';
    var PitName = oneLine ? oneLine.PitName : '';
    var ColPurchasePrice = oneLine ? oneLine.ColPurchasePrice : '';
    var ColUnitPrice = oneLine ? oneLine.ColUnitPrice : '';
    var ColQuantity = oneLine ? oneLine.ColQuantity : '';
    var ColTotalPrice = oneLine ? oneLine.ColTotalPrice : '';
    var ColTotalCrudePrice = oneLine ? oneLine.ColTotalCrudePrice : '';
    var VatId = oneLine ? oneLine.VatId : cplVatId;
    var LtpId = oneLine ? oneLine.LtpId : '';
    var LineType = oneLine ? oneLine.LineType : '';
    var PrdImgPath = oneLine ? oneLine.PrdImgPath : '';
    var ColDiscountPercentage = oneLine ? oneLine.ColDiscountPercentage : '';
    var ColDiscountAmount = oneLine ? oneLine.ColDiscountAmount : '';
    var ColPriceWithDiscountHt = oneLine ? oneLine.ColPriceWithDiscountHt : '';
    var ColMargin = oneLine ? oneLine.ColMargin : '';
    var ColPrdDes = oneLine ? oneLine.ColPrdDes : '';
    if (oneLine) {
        $('#hf_col_prd_id').text(oneLine.PrdFId);
        $('#hf_col_pit_id').text(oneLine.PitFId);
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
            "<label class='col-sm-2 control-label' style=''>Type de ligne</label>" +
            "<div class='col-sm-2' style='' ><select class='form-control' id='LtpId_zzz_' name='LtpId_zzz_' colid='" + ColId + "' onchange='ltpChange(this)'></select></div>" +
            "<label class='col-sm-2 control-label' >Niveau 1</label>" +
            "<div class='col-sm-2' ><input type='text' onkeypress='validateNumber(event)' value='" + ColLevel1 + "' colid='" + ColId + "'class='form-control' id='ColLevel1_zzz_' name='ColLevel1_zzz_' maxlength='3' /></div>" +
            "<label class='col-sm-2 control-label' >Niveau 2</label>" +
            "<div class='col-sm-2' ><input type='text' onkeypress='validateNumber(event)' value='" + ColLevel2 + "' colid='" + ColId + "'class='form-control' id='ColLevel2_zzz_' name='ColLevel2_zzz_' maxlength='3' /></div>" +
            "</div>" +
            "<div class='form-group variant'>" +
            "<label class='col-sm-2 control-label'>Référence du produit</label>" +
            "<div class='col-sm-2'><input class='form-control' id='PrdId_zzz_' name='PrdId_zzz_' value='" + PrdName + "' onkeyup='checkContent(this)' colid='" + ColId + "' onblur='checkPrdMandatory(this)' /></div>" +
            "<div id='div_ref_prd'></div></div>" +
            "<div class='form-group variant'>" +
            "<label class='col-sm-2 control-label sale'>Référence du sous produit</label>" +
            "<div class='col-sm-2 sale'><select id='PitId_zzz_' name='PitId_zzz_' class='form-control' colid='" + ColId + "' onchange='pitChange(this)'/></select></div>" +
            "<label class='col-sm-2 control-label'>Prix d'achat</label>" +
            "<div class='col-sm-2'><input type='number' step='0.01' class='form-control' colid='" + ColId + "' id='ColPurchasePrice_zzz_' name='ColPurchasePrice_zzz_' min='0' value='" + ColPurchasePrice + "' /></div>" +
            "<div class='col-sm-4  center'><button type='button' class='btn btn-inverse' onclick='return GetSoldPrice()'><i class='fa fa-eye'></i></button></div>" +
            "</div>" +
            "<div class='form-group variant'><label class='col-sm-2 control-label'>TVA</label>" +
            "<div class='col-sm-2'><select class='form-control' colid='" + ColId + "' id='VatId_zzz_' name='VatId_zzz_' onchange='CalCulatePrice(this)'></select></div>" +
            "<label class='col-sm-2 control-label'>Quantité</label>" +
            "<div class='col-sm-2'><input type='number' step='1' class='form-control' id='ColQuantity_zzz_'  colid='" + ColId + "' name='ColQuantity_zzz_' min='0' value='" + ColQuantity + "' onkeyup='CalCulatePrice(this)'/></div>" +
            "<label class='col-sm-2 control-label'>Prix unitaire</label>" +
            "<div class='col-sm-2'><input type='number' step='0.01' class='form-control' colid='" + ColId + "' id='ColUnitPrice_zzz_' name='ColUnitPrice_zzz_' min='0' value='" + ColUnitPrice + "' onkeyup='CalCulatePrice(this)'/></div>" +
            "</div>" +

            //remise
            "<div class='form-group variant'><label class='col-sm-2 control-label'>Pourcentage de remise</label>" +
            "<div class='col-sm-2'><div class='input-group'><input type='number' step='0.01' class='form-control' colid='" + ColId + "' field='ColDiscountPercentage' id='ColDiscountPercentage_zzz_' name='ColDiscountPercentage_zzz_' min='0' value='" + ColDiscountPercentage + "' onkeyup='CalCulatePrice(this)'/><span class='input-group-addon'>%</span></div></div>" +
            "<label class='col-sm-2 control-label'>Montant de remise</label>" +
            "<div class='col-sm-2'><input type='number' step='1' class='form-control' id='ColDiscountAmount_zzz_'  colid='" + ColId + "' field='ColDiscountAmount' name='ColDiscountAmount_zzz_' min='0' value='" + ColDiscountAmount + "' onkeyup='CalCulatePrice(this)'/></div>" +
            "<label class='col-sm-2 control-label'>Prix remisé</label>" +
            "<div class='col-sm-2'><input type='number' step='0.01' class='form-control' colid='" + ColId + "'  field='ColPriceWithDiscountHt' id='ColPriceWithDiscountHt_zzz_' name='ColPriceWithDiscountHt_zzz_' min='0' value='" + ColPriceWithDiscountHt + "' onkeyup='CalCulatePrice(this)'/></div>" +
            "</div>" +
            // end remise

            "<div class='form-group  variant'><label class='col-sm-2 control-label'>Total H.T.</label>" +
            "<div class='col-sm-2'><input type='number' disabled='' step='0.01' class='form-control' colid='" + ColId + "' id='ColTotalPrice_zzz_' name='ColTotalPrice_zzz_' value='" + ColTotalPrice + "' /></div>" +
            "<label class='col-sm-2 control-label'>Total T.T.C.</label>" +
            "<div class='col-sm-2'><input type='number' disabled step='0.01' class='form-control' colid='" + ColId + "' id='ColTotalCrudePrice_zzz_' name='ColTotalCrudePrice_zzz_' value='" + ColTotalCrudePrice + "' /></div>" +
            "<label class='col-sm-2 control-label'>Marge</label>" +
            "<div class='col-sm-2'><input type='number' disabled step='0.01' class='form-control' colid='" + ColId + "' id='ColMargin_zzz_' name='ColMargin_zzz_' value='"+ColMargin+"' /></div>" +
            "</div>" +
            "<div class='form-group  variant'>" +
            "<div class='col-sm-2'></div><div class='col-sm-2' id='div_prd_image'><!-- image -->" +
            (create ? "" : "<img src='../../Services/ShowOutSiteImage.ashx?file=" + PrdImgPath + "' alt=''   class='img-responsive'  style='width: 100%' />") +
            "</div><div class='col-sm-10'></div>" +
            "</div>"+
            "<div class='form-group'>" +
            "<label class='col-sm-2 control-label'>Description de produit</label>" +
            "<div class='col-sm-10'><textarea rows='7' disabled cols='1' colId='" + ColId + "'  id='ColPrdDes_zzz_' value='" + ColPrdDes + "' name='ColPrdDes_zzz_' class='form-control'></textarea>" +
            "</div>" +
            "</div>" +
            "<div class='form-group'>" +
            "<label class='col-sm-2 control-label'>Description</label>" +
            "<div class='col-sm-10'><textarea rows='3' cols='1' colId='" + ColId + "'  id='ColDescription_zzz_' value='" + ColDescription + "' name='ColDescription_zzz_' class='form-control'></textarea></div></div>" +
            // close box
            "</div></div></div></div></div>";

    var btnAddUpdate = "<button class='btn btn-inverse' colId='" + ColId + "' id='btn_add_update_line_zzz_' name='btn_add_update_line_zzz_' onclick='return AddUpdateClientOrderLine(this)'><span>" + (!create ? "Mettre à jour" : "Ajouter") + "</span></button>";
    var btnDelete = "<button class='btn btn-inverse' colId='" + ColId + "' id='btn_delete_line_zzz_' name='btn_delete_line_zzz_' onclick='return delete_Col_Line_Confirm(this)'><span>Supprimer</span></button>";
    var btnClose = "<button class='btn btn-default bootbox-close-button' onclick='return false'><span>Annuler</span></button>";

    var btns = "<div class='modal-body center'>"  + btnClose + btnAddUpdate+ "</div>";

    var onecontent = startBox + onelineContent + btns + endBox;

    onecontent = replaceAll(onecontent, '_zzz_', '_' + ColId);
    currentColId = ColId;
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
            var h = (w - b) * 0.2;
            return h + "px";
        }
    }).find('.modal-header').css({
        'background': 'url(../../img/menu_005_bg.jpg) repeat-x',
        'text-align': 'center',
        'color': '#C0C0C0'
    });
    setAutoComplete(ColId);
    setLintType(ColId, LtpId);
    setLineTva(ColId, VatId);
    if (!create) {
        //currentColId
        var subPrdId = '#PitId_' + currentColId;
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
        $('#LtpId_' + currentColId).change();
    }
    if (ColDescription) {
        $('#ColDescription_' + currentColId).text(ColDescription);
    }
    
    if (ColPrdDes) {
       $('#ColPrdDes_' + currentColId).text(ColPrdDes);
    }
    
    if (oneLine) {
        preLoadProductInstance(oneLine.PrdId);
    }
}

function checkPrdMandatory(sender) {
    var prdId = $('#hf_col_prd_id').text();
    var colid = $(sender).attr('colid') * 1;
    
    if ((prdId == '' || prdId == "") && connectedUser.IsPrdMandatory && colid === 0) {
        MsgPopUpWithResponse('ATTENTION', 'Veuillez créer ce produit d\'abord', 'OpenProductPage()');
        return false;
    } else {
        return true;
    }
}

function OpenProductPage() {
    var url = '../Product/ProductExpress.aspx';
    pageSnapShot(url);
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

function pitChange(sender) {
    var pitId = $(sender).val();
    $("#hf_col_pit_id").text($(sender).val());
    var colId = $(sender).attr('colId');
    var purchaseprice = $(sender).find(":selected").attr('data-value');
    $('#ColPurchasePrice_' + colId).val(purchaseprice);
    var price  = $(sender).find(":selected").attr('data-price');
    $('#ColUnitPrice_' + colId).val(price);
    var description = $(sender).find(":selected").attr('description');
    $('#ColDescription_' + colId).text(description);
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
    
    $('#ColPrdDes_' + colId).text(alldes);
    if (!IsNullOrEmpty(onePit.PitDefaultImage)) {
        $('#div_prd_image').empty();
        var imgContent = "<img src='../../Services/ShowOutSiteImage.ashx?file=" + onePit.PitDefaultImage + "' alt=''   class='img-responsive'  style='width: 100%' />";
        $('#div_prd_image').append(imgContent);
    } else {
        $('#div_prd_image').empty();
    }
}

function setLineTva(colId, vatId) {
    if (allTVA) {
        var budgetId = '#VatId_' + colId;
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

function setLintType(colId, ltpId) {
    if (allLineType) {
        var budgetId = '#LtpId_' + colId;
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
        $('#hf_col_prd_id').text('');
    }
}

function AddUpdateClientOrderLine(sender) {
    $(sender).prop('disabled', true);
    var isprdman = checkPrdMandatory(sender);
    if (isprdman) {
        var colId = $(sender).attr('colid');

        var LtpId = $('#LtpId_' + colId).val() * 1;
        var PrdId = $('#PrdId_' + colId);
        var PitId = $('#PitId_' + colId + ' option:selected');
        var ColPurchasePrice = $('#ColPurchasePrice_' + colId);
        var VatId = $('#VatId_' + colId);
        var ColQuantity = $('#ColQuantity_' + colId);
        var ColUnitPrice = $('#ColUnitPrice_' + colId);
        var ColTotalPrice = $('#ColTotalPrice_' + colId);
        var ColTotalCrudePrice = $('#ColTotalCrudePrice_' + colId);
        var ColLevel1 = $('#ColLevel1_' + colId);
        var ColLevel2 = $('#ColLevel2_' + colId);
        var ColDescription = $('#ColDescription_' + colId);

        var ColDiscountPercentage = $('#ColDiscountPercentage_' + colId);
        var ColDiscountAmount = $('#ColDiscountAmount_' + colId);
        var ColPriceWithDiscountHt = $('#ColPriceWithDiscountHt_' + colId);
        var ColMargin = $('#ColMargin_' + colId);
        var ColPrdDes = $('#ColPrdDes_' + colId);


        // LtpId_zzz_
        // PrdId_zzz_
        // PitId_zzz_
        // ColPurchasePrice_zzz_
        // VatId_zzz_
        // ColQuantity_zzz_
        // ColUnitPrice_zzz_
        // ColTotalPrice_zzz_
        // ColTotalCrudePrice_zzz_
        // ColLevel1_zzz_
        // ColLevel2_zzz_
        // vente

        var checkOK = true;
        if (LtpId === 2 || LtpId === 4) {
            PrdId.attr('required', '');
            ColQuantity.attr('required', '');
            //ColUnitPrice.attr('required', '');
            if (LtpId === 2) {
                PitId.attr('required', '');
            } else {
                PitId.removeAttr('required');
            }
        } else {
            PrdId.removeAttr('required');
            PitId.removeAttr('required');
            ColQuantity.removeAttr('required');
            ColUnitPrice.removeAttr('required');
        }
        checkOK = CheckRequiredFieldInOneDiv('div_one_line');
        if (checkOK) {
            ShowPleaseWait();
            var ltp_id = LtpId;
            var level1 = ColLevel1.val() * 1 + 0;
            var level2 = ColLevel2.val() * 1 + 0;
            var product = PrdId.val();
            var prdId = $('#hf_col_prd_id').text();
            var pitId = $('#hf_col_pit_id').text();
            var pitname = PitId.text();
            var purchasePrice = (ColPurchasePrice.val().replace(',', '.')) * 1;
            var tva = VatId.val();
            var quantity = ColQuantity.val().replace(',', '.') * 1;
            var unitprice = ColUnitPrice.val().replace(',', '.') * 1;
            unitprice = isNaN(unitprice) ? 0 : (unitprice * 1);
            var totalHt = ColTotalPrice.val().replace(',', '.') * 1;
            var totalTtc = ColTotalCrudePrice.val().replace(',', '.') * 1;


            var coldiscountPercentage = ColDiscountPercentage.val().replace(',', '.') * 1;
            var coldiscountAmount = ColDiscountAmount.val().replace(',', '.') * 1;
            var colPriceWithDiscount = ColPriceWithDiscountHt.val().replace(',', '.') * 1;
            var colMargin = ColMargin.val().replace(',', '.') * 1;


            var description = ColDescription.val();

            var oneline = {};
            oneline.ColId = colId;
            oneline.CodFId = getUrlVars()['codId'];
            oneline.ColLevel1 = level1;
            oneline.ColLevel2 = level2;
            oneline.ColDescription = description;
            oneline.PrdFId = prdId;
            oneline.PitFId = pitId;
            oneline.PrdName = product;
            oneline.PitName = pitname;
            oneline.ColPrdName = product;
            oneline.ColPurchasePrice = purchasePrice;
            oneline.ColUnitPrice = unitprice;
            oneline.ColQuantity = quantity;
            oneline.ColTotalPrice = totalHt;
            oneline.ColTotalCrudePrice = totalTtc;
            oneline.ColPrdDes = ColPrdDes.val();

            oneline.ColDiscountPercentage = coldiscountPercentage;
            oneline.ColDiscountAmount = coldiscountAmount;
            oneline.ColPriceWithDiscountHt = colPriceWithDiscount;
            oneline.ColMargin = colMargin;

            oneline.VatId = tva;
            oneline.LtpId = ltp_id;
            var jsondata = JSON.stringify({ oneLine: oneline });
            var url = window.webservicePath + "/InsertUpdateCol";
            $.ajax({
                url: url,
                type: 'POST',
                contentType: 'application/json; charset=utf-8',
                data: jsondata,
                dataType: 'json',
                success: function(data) {
                    $('.bootbox-close-button').click();
                    loadAllLines();
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
    } else {
        $(sender).prop('disabled', false);
    }
    return false;
}

function CalCulatePrice(sender) {
    var colId = $(sender).attr('colId');
    var field = $(sender).attr('field');
    var tva = $('#VatId_' + colId + '  option:selected');
    var quantity = $('#ColQuantity_' + colId).val() * 1;
    var unitprice = $('#ColUnitPrice_' + colId).val() * 1;
    var disPercentage = $('#ColDiscountPercentage_' + colId).val() * 1;
    var disAmount= $('#ColDiscountAmount_' + colId).val() * 1;
    var disPrice = $('#ColPriceWithDiscountHt_' + colId).val() * 1;
    var purcharsePrice = $('#ColPurchasePrice_'+ colId).val() * 1;

    if (field === 'ColDiscountPercentage' || field === 'ColDiscountAmount' || field === 'ColPriceWithDiscountHt') {
        if (field === 'ColDiscountPercentage') {
            disAmount = (disPercentage * unitprice / 100).toFixed(2);
            disPrice = (unitprice - disAmount).toFixed(2);
            //disPrice = ((100 - disPercentage) * unitprice / 100).toFixed(2);
            $('#ColDiscountAmount_' + colId).val(disAmount);
            $('#ColPriceWithDiscountHt_' + colId).val(disPrice);
        }
        else if (field === 'ColDiscountAmount') {
            disPercentage = (disAmount * 100 / (unitprice ? unitprice : 1)).toFixed(2);
            disPrice = (unitprice - disAmount).toFixed(2);
            $('#ColDiscountPercentage_' + colId).val(disPercentage);
            $('#ColPriceWithDiscountHt_' + colId).val(disPrice);
        } else {
            disPercentage = ((unitprice - disPrice )* 100 / (unitprice ? unitprice : 1)).toFixed(2);
            disAmount = (unitprice - disPrice ).toFixed(2);
            $('#ColDiscountPercentage_' + colId).val(disPercentage);
            $('#ColDiscountAmount_' + colId).val(disAmount);
        }
    } else {
        disAmount = (disPercentage * unitprice / 100).toFixed(2);
        disPrice = (unitprice - disAmount).toFixed(2);
        //disPrice = ((100 - disPercentage) * unitprice / 100).toFixed(2);
        $('#ColDiscountAmount_' + colId).val(disAmount);
        $('#ColPriceWithDiscountHt_' + colId).val(disPrice);
    }

    var totalHT = $('#ColTotalPrice_' + colId);
    var totalTTC = $('#ColTotalCrudePrice_' + colId);
    var margin = $('#ColMargin_' + colId);

    var tva_value = tva.attr('data-value') * 1;
    var _total_ht = quantity * (unitprice - (disAmount ? disAmount : 0));
    var _total_ttc = _total_ht * (1 + tva_value / 100);
    var _margin = (disPrice - purcharsePrice) * quantity;

    _total_ht = _total_ht.toFixed(2);
    _total_ttc = _total_ttc.toFixed(2);
    _margin = _margin.toFixed(2);
    totalHT.val(_total_ht);
    totalTTC.val(_total_ttc);
    margin.val(_margin);
}

function delete_Col_Line_Confirm(sender) {
    var colId = $(sender).attr('colId');
    var title = "ATTENTION";
    var content = "<div class='box'><div class='box-body' style='height: 100px;'>" +
        "<div class='form-horizontal'>" +
        "<div class='col-md-12'>" +
        "<div class='form-group'>" +
        "<div class='col-sm-12' style='text-align:center;font-size: 18pt;'>Veuillez confirmer la suppression ! " +
        "<br/>La suppression est irrécupérable, veuillez confirmer !!!</div></div></div></div></div></div>"
        + "<div class='modal-footer center'>" +
        "<button type='button' class='btn btn-default' onclick='closeDialog()'>Annuler</button>" +
        "<button type='button' class='btn btn-inverse' colId='"+colId +"' onclick='return delete_Col(this);'>SUPPRIMER</button></div>";
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

function delete_Col(sender) {
    var colId = $(sender).attr('colId');
    var codId = getUrlVars()['codId'];
    var url = window.webservicePath + "/DeleteClientOrderLine";
    $.ajax({
        type: "POST",
        url: url,
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        data: "{codId:'" + codId + "',colId:" + colId + "}",
        success: function(data) {
            var jsdata = data.d;
            var data2Treat = jQuery.parseJSON(jsdata);
            if (data2Treat !== '-1') {
                if (data2Treat === '1') {
                    loadAllLines();
                } else {
                    MsgPopUpWithResponse('ERREUR','Cette ligne est utilisée par Bon de Livraison, la suppression n\'est pas effecturée !');
                }
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
    
    $('#hf_col_prd_id').text('');
    $('#hf_col_pit_id').text('');
    var vat_id = 1;
    if (currentCod) {
        vat_id = currentCod.VatId;
    }

    var create = oneLine ? false : true;
    var ColId = oneLine ? oneLine.ColId: lineCount;
    lineCount--;
    
    var CplId = oneLine ? oneLine.CplId : '';
    var CplFId = oneLine ? oneLine.CplFId : '';
    var ColLevel1 = oneLine ? oneLine.ColLevel1 : getNextLevel1();
    var ColLevel2 = oneLine ? oneLine.ColLevel2 : '1';
    var ColDescription = oneLine ? oneLine.ColDescription : '';
    var PrdId = oneLine ? oneLine.PrdId : '';
    var PrdName = oneLine ? oneLine.ColPrdName : '';
    var PitId = oneLine ? oneLine.PitId : '';
    var PitName = oneLine ? oneLine.PitName : '';
    var ColPurchasePrice = oneLine ? oneLine.ColPurchasePrice : '';
    var ColUnitPrice = oneLine ? oneLine.ColUnitPrice : '';
    var ColQuantity = oneLine ? oneLine.ColQuantity : '';
    var ColTotalPrice = oneLine ? oneLine.ColTotalPrice : '';
    var ColTotalCrudePrice = oneLine ? oneLine.ColTotalCrudePrice : '';
    var VatId = oneLine ? oneLine.VatId : vat_id;
    var LtpId = oneLine ? oneLine.LtpId : '';
    var LineType = oneLine ? oneLine.LineType : '';
    var PrdImgPath = oneLine ? oneLine.PrdImgPath : '';
    var ColDiscountPercentage = oneLine ? oneLine.ColDiscountPercentage : '';
    var ColDiscountAmount = oneLine ? oneLine.ColDiscountAmount : '';
    var ColPriceWithDiscountHt = oneLine ? oneLine.ColPriceWithDiscountHt : '';
    var ColMargin = oneLine ? oneLine.ColMargin : '';
    var ColPrdDes = oneLine ? oneLine.ColPrdDes : '';
    if (oneLine) {
        $('#hf_col_prd_id').text(oneLine.PrdFId);
        $('#hf_col_pit_id').text(oneLine.PitFId);
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
            "<div class='col-sm-2' style='display:none;' ><select class='form-control' id='LtpId_zzz_' " + disabled + " name='LtpId_zzz_' colid='" + ColId + "' onchange='ltpChange(this)'></select></div>" +
            "<label class='col-sm-2 control-label' style='display:none;' >Niveau 1</label>" +
            "<div class='col-sm-2' style='display:none;' ><input type='text' onkeypress='validateNumber(event)' " + disabled + "  value='" + ColLevel1 + "' colid='" + ColId + "'class='form-control' id='ClnLevel1_zzz_' name='ClnLevel1_zzz_' maxlength='3' /></div>" +
            "<label class='col-sm-2 control-label' style='display:none;' >Niveau 2</label>" +
            "<div class='col-sm-2' style='display:none;' ><input type='text' onkeypress='validateNumber(event)' " + disabled + "  value='" + ColLevel2 + "' colid='" + ColId + "'class='form-control' id='ClnLevel2_zzz_' name='ClnLevel2_zzz_' maxlength='3' /></div>" +
            "</div>" +
            "<div class='form-group variant'>" +
            "<label class='col-sm-4 control-label'>Référence du produit</label>" +
            "<div class='col-sm-4'><input class='form-control' id='PrdId_zzz_' " + disabled + "  name='PrdId_zzz_' value='" + PrdName + "' onkeyup='checkContent(this)' colid='" + ColId + "' /></div><div class='col-sm-4'></div>" +
            "</div>" +
            // driver and accessory list
            "<div class='form-group' id='div_drv_acc_list'>" +
            "</div>" +
            // close box
            "</div></div></div></div></div>";

    var btnAddUpdate = "<button class='btn btn-inverse' colId='" + ColId + "' id='btn_add_update_line_zzz_' name='btn_add_update_line_zzz_' onclick='return AddUpdateColDrvAcc(this)'><span>" + (!create ? "Mettre à jour" : "Ajouter") + "</span></button>";
    var btnDelete = "<button class='btn btn-inverse' colId='" + ColId + "' id='btn_delete_line_zzz_' name='btn_delete_line_zzz_' onclick='return delete_Cln_Line_Confirm(this)'><span>Supprimer</span></button>";
    var btnClose = "<button class='btn btn-default bootbox-close-button' onclick='return false'><span>Annuler</span></button>";

    var btns = "<div class='modal-body center'>" + btnClose +  btnAddUpdate+ "</div>";

    var onecontent = startBox + onelineContent + btns + endBox;

    onecontent = replaceAll(onecontent, '_zzz_', '_' + ColId);
    currentColId= ColId;
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
    setAutoCompleteForDrvAcc(ColId);
    setLintType(ColId, LtpId);
    setLineTva(ColId, VatId);
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
        $('#LtpId_' + currentColId).change();
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
//                    alert(response.responseText);
                },
                failure: function(response) {
                    alert(response.responseText);
                }
            });
        },
        select: function(e, i) {
            $("#hf_col_prd_id").text(i.item.val);
            $('#PitId_zzz_').val('');
            $("#hf_col_pit_id").text('');
            //console.log(i.item);
            //currentClnId
            var subPrdId = '#PitId_' + currentColId;
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

function AddUpdateColDrvAcc(sender) {
    $(sender).prop('disabled', true);
    var colId = $(sender).attr('colid');
    var LtpId = $('#LtpId_' + colId).val() * 1;
    var PrdFId = $("#hf_col_prd_id").text();

    var clns = [];
    var allLines = $("input[id^='ip_drv_acc_qty_']");
    var ClnLevel1 = $('#ClnLevel1_' + colId);
    var ClnLevel2 = $('#ClnLevel2_' + colId);
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
            var ColTotalPrice = quantity * unitprice;
            var ColTotalCrudePrice = ColTotalPrice * (1 + tva / 100);
            ColTotalPrice = ColTotalPrice.toFixed(2);
            ColTotalCrudePrice = ColTotalCrudePrice.toFixed(2);
            var ColDiscountPercentage = 0;
            var ColDiscountAmount = 0;
            var ColPriceWithDiscountHt = ColTotalPrice;
            var clnMargin = (ColTotalPrice - purchasePrice) * quantity;
            var description = replaceAll(replaceAll($('#sp_drv_acc_des_' + PitId).html(), '<br>', '\r\n'), '<br/>', '\r\n');
            var oneline = {};
            oneline.FId = PrdFId;
            oneline.PrdFId = PrdFId;
            oneline.CodId = 0;
            oneline.CodFId = getUrlVars()['codId'];

            oneline.ColLevel1 = level1;
            oneline.ColLevel2 = level2;
            oneline.ColDescription = description;
            oneline.PrdId = PrdId;
            oneline.PitId = PitId;
            oneline.PrdName = "";
            oneline.PitName = "";
            oneline.ColPrdName = "";
            oneline.ColPurchasePrice = purchasePrice;
            oneline.ColUnitPrice = unitprice;
            oneline.ColQuantity = quantity;
            oneline.ColTotalPrice = ColTotalPrice;
            oneline.ColTotalCrudePrice = ColTotalCrudePrice;

            oneline.ColDiscountPercentage = 0;
            oneline.ColDiscountAmount = 0;
            oneline.ColPriceWithDiscountHt = ColTotalPrice;
            oneline.ColMargin = clnMargin;
            oneline.ColPrdDes = "";

            oneline.VatId = VatId;
            oneline.LtpId = ltp_id;

            clns.push(oneline);
        }
    });

    //console.log(clns);
    $(sender).prop('disabled', false);

    if (clns.length > 0) {
        ShowPleaseWait();
        var jsondata = JSON.stringify({ cols: clns });
        var url = window.webservicePath + "/InsertUpdateCols";
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
