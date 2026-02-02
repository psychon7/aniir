//$(document).ready(initCostPlanLine);

function initCostPlanLine() {
    getLineTypes();
    //getAllTVA();
//    if (_isView) {
//        loadAllLines();
//    }
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

//var allTVA = [];
//function getAllTVA() {
//    var url = window.webservicePath + "/GetAllTVA";
//    $.ajax({
//        type: "POST",
//        url: url,
//        contentType: "application/json; charset=utf-8",
//        dataType: "json",
//        success: function (data) {
//            var jsdata = data.d;
//            var data2Treat = jQuery.parseJSON(jsdata);
//            if (data2Treat !== '-1') {
//                allTVA = [];
//                allTVA = data2Treat;
//            } else {
//                AuthencationError();
//            }
//        },
//        error: function (data) {
//            var test = '';
//        }
//    });
//}

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
function setAutoComplete(clnId) {
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
            $("#hf_cln_prd_id").text(i.item.val);
            // show image
            if (i.item.datavalue) {
                $('#div_prd_image').empty();
                var imgContent = "<img src='../../Services/ShowOutSiteImage.ashx?file=" + i.item.datavalue + "' alt=''   class='img-responsive'  style='width: 100%' />";
                $('#div_prd_image').append(imgContent);
            } else {
                $('#div_prd_image').empty();
            }
            $('#PitId_zzz_').val('');
            $("#hf_cln_pit_id").text('');

            //currentClnId
            var subPrdId = '#PitId_' + currentClnId;
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
                    $(subPrdId).empty();
                    productInstances = [];
                    if ($.isArray(data2Treat)) {
                        productInstances = data2Treat;
                        setCascadeMenu(productInstances);
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
//    var urlpit = window.webservicePath + "/GetPitByRef";
//    $("#PitId_" + clnId).autocomplete({
//        source: function (request, response) {
//            $.ajax({
//                url: urlpit,
//                data: "{ 'pitRef': '" + request.term + "', prdId:'" + $('#hf_cln_prd_id').text() + "'}",
//                dataType: "json",
//                type: "POST",
//                contentType: "application/json; charset=utf-8",
//                success: function (data) {
//                    var jsdata = data.d;
//                    var data2Treat = jQuery.parseJSON(jsdata);
//                    response($.map(data2Treat, function (item) {
//                        return {
//                            label: item.PitRef,
//                            val: item.FId
//                        }
//                    }));
//                },
//                error: function (response) {
//                    alert(response.responseText);
//                },
//                failure: function (response) {
//                    alert(response.responseText);
//                }
//            });
//        },
//        select: function (e, i) {
//            $("#hf_cln_pit_id").text(i.item.val);
//        },
//        minLength: 2
//    });
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
            $("#hf_cln_prd_id").text(i.item.val);
            $('#PitId_zzz_').val('');
            $("#hf_cln_pit_id").text('');
            //console.log(i.item);
            //currentClnId
            var subPrdId = '#PitId_' + currentClnId;
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
            "<div class='col-sm-2'><select id='Pit_Temp_Color_" + currentClnId + "' name='Pit_Temp_Color_" + currentClnId + "' class='form-control' clnid='" + currentClnId + "' onchange='TempColorChange(this)'/></select>" +
            "</div>" +
            "</div>";
        $('#div_ref_prd').append(tempColorContent);
        $('#Pit_Temp_Color_' + currentClnId).append(
            $("<option></option>").attr("value", '0').attr('selected', true).text('Sélectionner un couleur')
        );
        tempColor = jQuery.unique(tempColor);
        $.each(tempColor, function(name, value) {
            $('#Pit_Temp_Color_' + currentClnId).append($("<option></option>").attr("value", value).text(value));
        });
    }
    var operation = getValueInArray(tempcolorOpration, "PropValue2");
    operation = jQuery.unique(operation);
    operation.sort();
    if (tempColor.length > 0) {
        var oprationContent = "<div id='div_operation'>" +
            "<label class='col-sm-2 control-label'>Opération</label>" +
            "<div class='col-sm-2'><select id='Pit_operation_" + currentClnId + "' name='Pit_operation_" + currentClnId + "' class='form-control' clnid='" + currentClnId + "' onchange='OperationChange(this)'/></select>" +
            "</div>" +
            "</div>";
        $('#div_ref_prd').append(oprationContent);
        $('#Pit_operation_' + currentClnId).append(
            $("<option></option>").attr("value", '0').attr('selected', true).text('Sélectionner une opération')
        );
        operation = jQuery.unique(operation);
        $.each(operation, function(name, value) {
            $('#Pit_operation_' + currentClnId).append($("<option></option>").attr("value", value).text(value));
        });
    }
}

function TempColorChange(sender) {
    var tempvalue = $(sender).val();
    var clnid = $(sender).attr('clnid') * 1;
    var operationvalue = $('#Pit_operation_' + clnid).val();
    TempColorOperationChange(tempvalue,operationvalue, clnid);
}

function OperationChange(sender) {
    var operationvalue = $(sender).val();
    var clnid = $(sender).attr('clnid') * 1;
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
    var cplId = getUrlVars()['cplId'];
    var url = window.webservicePath + "/GetAllCostPlanLines";
    $.ajax({
        url: url,
        type: 'POST',
        contentType: 'application/json; charset=utf-8',
        data: "{cplId:'" + cplId + "'}",
        dataType: 'json',
        success: function(data) {
            var jsdata = data.d;
            var jsondata = jQuery.parseJSON(jsdata);
            if (jsondata !== '-1') {
                costPlanLineInPage = [];
                costPlanLineInPage = jsondata;
                if (costPlanLineInPage.length > 0) {
                    if (currentCplCstId !== 2) {
                        $('#btn_send_pdf').show();
                        $("#btn_validate_costplan").show();
                    }
                    $('#btn_generate_pdf').show();
                } else {
                    $('#btn_send_pdf').hide();
                    $('#btn_generate_pdf').hide();
                    $("#btn_validate_costplan").hide();
                }
                var linecount = 1;
                $('#tbody_cost_plan_line').empty();
                var total_quanity = 0;
                var total_ht = 0;
                var total_ttc = 0;
                $.each(jsondata, function(name, value) {
                    var lineclass = (linecount % 2 === 1) ? "odd" : "even";
                    var prdname = (value.LtpId === 2 || value.LtpId === 4) ? value.ClnPrdName : "";
                    var pitname = (value.LtpId === 2 || value.LtpId === 4) ? value.PitName : "";
                    var quantity = (value.LtpId === 2 || value.LtpId === 4) ? value.ClnQuantity : "";
                    total_quanity += (quantity * 1);
                    var purchasePrice = (value.LtpId === 2 || value.LtpId === 4) ? value.ClnPurchasePrice : "";
                    var unitprice = (value.LtpId === 2 || value.LtpId === 4) ? value.ClnUnitPrice : "";
                    var discountprice = (value.LtpId === 2 || value.LtpId === 4) ? value.ClnPriceWithDiscountHt: "";
                    var vatlabel = (value.LtpId === 2 || value.LtpId === 4) ? value.VatLabel : "";
                    var totalht = (value.LtpId === 2 || value.LtpId === 4 || value.LtpId === 5 || value.LtpId === 6) ? value.ClnTotalPrice : "";
                    total_ht += (totalht * 1);
                    var totalttc = (value.LtpId === 2 || value.LtpId === 4 || value.LtpId === 5 || value.LtpId === 6) ? value.ClnTotalCrudePrice : "";
                    total_ttc +=(totalttc * 1);
                    if (value.LtpId === 5) {
                        lineclass += " subTotal";
                    }
                    if (value.LtpId === 6) {
                        lineclass += " total";
                    }
                    var description = replaceAll(value.ClnPrdDes, '\n', '</br>') + '</br>---------------------------</br>' +  replaceAll(value.ClnDescription, '\n', '</br>');

                    var oneline = "<tr class='" + lineclass + "'>" +
                        "<td class='label_left' style='cursor: pointer;' clnId='" + value.ClnId + "'  onclick='return modify_cln_click(this)'>" + value.ClnLevel1 + "." + value.ClnLevel2 + "</td>" +
                        //"<td class='label_left'>" + value.LineType + "</td>" +
                        "<td class='label_left'><span fid='" + value.PrdFId + "' onclick='viewPrd(\"" + value.PrdFId + "\")' style='cursor:pointer'>"  + prdname + "</span></td>" +
                        "<td class='label_left'><span fid='" + value.PrdFId + "' onclick='viewPrd(\"" + value.PrdFId + "\")' style='cursor:pointer'>" + pitname + "</span></td>" +
                        "<td>" + (value.PrdImgPath ? ("<img src='../../Services/ShowOutSiteImage.ashx?file=" + value.PrdImgPath + "' height='40' width='40' />") : "") + "</td>" +
                        "<td class='label_left'>" + description + "</td>" +
                        "<td class='label_right'>" + quantity + "</td>" +
                        "<td class='label_right'>" + purchasePrice + "</td>" +
                        "<td class='label_right'>" + unitprice + "</td>" +
                        "<td class='label_right'>" + discountprice + "</td>" +
                        "<td class='label_right'>" + vatlabel + "</td>" +
                        "<td class='label_right'>" + totalht + "</td>" +
                        "<td class='label_right'>" + totalttc + "</td>";

                    var btnPin = "<button class='btn btn-inverse' title='Intention d&apos;achat' id='" + value.ClnId + "' sodFId='" + value.SodFId + "' pinFId='" + value.PinFId + "' solId='" + value.SolId + "' pilId='" + value.PilId + "' clnId='" + value.ClnId + "' " + (value.PilId != 0 || value.SolId != 0 ? "style='color:#d96666' onclick='return PinConsult(this)'" : "onclick='return Pin_cln_click(this)") + " '><i class='fa fa-dollar'></i></button>";

                    var btns = "<td>" +
                        "<button class='btn btn-inverse' title='Modifier' id='" + value.ClnId + "' clnId='" + value.ClnId + "' onclick='return modify_cln_click(this)'><i class='fa fa-edit'></i></button>" +
                        "<button class='btn btn-inverse' title='Dupliquer' id='" + value.ClnId + "' clnId='" + value.ClnId + "' onclick='return duplicate_cln_click(this)'><i class='fa fa-copy'></i></button>" +
                        btnPin +
                        "<button class='btn btn-inverse' title='Supprimer' id='" + value.ClnId + "' clnId='" + value.ClnId + "' onclick='return delete_Cln_Line_Confirm(this)'><i class='fa fa-times'></i></button>" +
                        "</td>";

                        var endline = "</tr>";

                    oneline += (currentCplCstId === 2 ? "<td>" + btnPin + "</td>" : btns) + endline;

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
                    //(currentCplCstId === 2 ? "":"<td></td>" ) +
                    "<td></td>"+
                    "</tr>" +
                    "";
                //$('#tbody_cost_plan_line')
                    $('#tbody_cost_plan_line').append(totalLine);
            } else {
            }
            HidePleaseWait();
        },
        error: function(data) {
            HidePleaseWait();
        }
    });
}

function duplicate_cln_click(sender) {
    var clnId = $(sender).attr('clnId') * 1;
    MsgPopUpWithResponseChoice('CONFIRMATION', "Veuillez confirmer à dupliquer cette ligne? ", 'Dupliquer', 'duplicateCln(' + clnId + ')', 'Annuler');
    return false;
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
    var ClnId = $(sender).attr('clnId') * 1;
    var oneLine = searchInArray(costPlanLineInPage, 'ClnId', ClnId)[0];
    //console.log(onecln);
    if (!jQuery.isEmptyObject(oneLine)) {
//        var cplVatId = 1;
//    if (currentCpl) {
//        cplVatId = currentCpl.VatId;
//    }
    var create = true;
     ClnId = oneLine.ClnId ;
    var CplId = oneLine ? oneLine.CplId : '';
    var CplFId = oneLine ? oneLine.CplFId : '';
    var ClnLevel1 = oneLine ? oneLine.ClnLevel1 : getNextLevel1();
    var ClnLevel2 = oneLine ? oneLine.ClnLevel2 : '1';
    var ClnDescription = oneLine ? oneLine.ClnDescription : '';
    var PrdId = oneLine ? oneLine.PrdId : '';
    //var PrdId = oneLine ? oneLine.PrdFId : '';
    var PrdName = oneLine ? oneLine.ClnPrdName : '';
    var PitId = oneLine ? oneLine.PitId : '';
    var PitName = oneLine ? oneLine.PitName : '';
    var ClnPurchasePrice = oneLine ? oneLine.ClnPurchasePrice : '';
    var ClnUnitPrice = oneLine ? oneLine.ClnUnitPrice : '';
    var ClnQuantity = oneLine ? oneLine.ClnQuantity : '';
    var ClnTotalPrice = oneLine ? oneLine.ClnTotalPrice : '';
    var ClnTotalCrudePrice = oneLine ? oneLine.ClnTotalCrudePrice : '';
    var VatId = oneLine ? oneLine.VatId : cplVatId;
    var LtpId = oneLine ? oneLine.LtpId : '';
    var LineType = oneLine ? oneLine.LineType : '';
    var PrdImgPath = oneLine ? oneLine.PrdImgPath : '';
    var ClnDiscountPercentage = oneLine ? oneLine.ClnDiscountPercentage : '';
    var ClnDiscountAmount = oneLine ? oneLine.ClnDiscountAmount : '';
    var ClnPriceWithDiscountHt = oneLine ? oneLine.ClnPriceWithDiscountHt : '';
    var ClnMargin = oneLine ? oneLine.ClnMargin : '';
    var ClnPrdDes = oneLine ? oneLine.ClnPrdDes : '';
  
    var disabled =  " disabled ";
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
            "<div class='col-sm-2' style='display:none;' ><select class='form-control' id='LtpId_zzz_' " + disabled + " name='LtpId_zzz_' clnid='" + ClnId + "' onchange='ltpChange(this)'></select></div>" +
            "<label class='col-sm-2 control-label' >Niveau 1</label>" +
            "<div class='col-sm-2' ><input type='text' onkeypress='validateNumber(event)' " + disabled + "  value='" + ClnLevel1 + "' clnid='" + ClnId + "'class='form-control' id='ClnLevel1_zzz_' name='ClnLevel1_zzz_' maxlength='3' /></div>" +
            "<label class='col-sm-2 control-label' >Niveau 2</label>" +
            "<div class='col-sm-2'  ><input type='text' onkeypress='validateNumber(event)' " + disabled + "  value='" + ClnLevel2 + "' clnid='" + ClnId + "'class='form-control' id='ClnLevel2_zzz_' name='ClnLevel2_zzz_' maxlength='3' /></div>" +
            "</div>" +

            "<div class='form-group variant'>" +
            "<label class='col-sm-2 control-label'>Référence du produit</label>" +
            "<div class='col-sm-2'><input class='form-control' id='PrdId_zzz_' " + disabled + "  name='PrdId_zzz_' value='" + PrdName + "' onkeyup='checkContent(this)' clnid='" + ClnId + "' onblur='checkPrdMandatory(this)'/></div>" +
            "<div  id='div_ref_prd'></div></div>" +

            "<div class='form-group variant'>" +
            "<label class='col-sm-2 control-label sale'>Référence du sous produit</label>" +
            "<div class='col-sm-2 sale'><select id='PitId_zzz_' name='PitId_zzz_' " + disabled + "  class='form-control' clnid='" + ClnId + "' onchange='pitChange(this)'/></select></div>" +
         
            "<label class='col-sm-2 control-label'>TVA</label>" +
            "<div class='col-sm-2'><select class='form-control' " + disabled + "  clnid='" + ClnId + "' id='VatId_zzz_' name='VatId_zzz_' onchange='CalCulatePrice(this)'></select></div>" +
            "<div class='col-sm-4  center'></div>" +
            "</div>" +

            "<div class='form-group variant'>" +
             "<label class='col-sm-2 control-label'>Prix d'achat</label>" +
            "<div class='col-sm-2'><input type='number' step='0.01' " + disabled + "  class='form-control' clnid='" + ClnId + "' id='ClnPurchasePrice_zzz_' name='ClnPurchasePrice_zzz_' min='0' value='" + ClnPurchasePrice + "' /></div>" +
            "<label class='col-sm-2 control-label'>Quantité</label>" +
            "<div class='col-sm-2'><input type='number' step='1' " + disabled + "  class='form-control' id='ClnQuantity_zzz_'  clnid='" + ClnId + "' name='ClnQuantity_zzz_' min='0' value='" + ClnQuantity + "' onkeyup='CalCulatePrice(this)'/></div>" +
            "<label class='col-sm-2 control-label'>Prix unitaire</label>" +
            "<div class='col-sm-2'><input type='number' " + disabled + "  step='0.01' class='form-control' clnid='" + ClnId + "' id='ClnUnitPrice_zzz_' name='ClnUnitPrice_zzz_' min='0' value='" + ClnUnitPrice + "' onkeyup='CalCulatePrice(this)'/></div>" +
            "</div>" +

            "<div class='form-group variant'>" +
            "<div class='col-sm-4'></div>" +
            "<label class='col-sm-2 control-label' style='color:#d96666'>Quantité d'achat</label>"+
            "<div class='col-sm-2'><input type='number' step='1' style='color:#d96666' class='form-control' id='ClnPurchaseQty_zzz_'  clnid='" + ClnId + "' name='ClnPurchaseQty_zzz_' min='0' value='" + ClnQuantity + "' /></div>" +
            "<label class='col-sm-2 control-label' style='color:#d96666'>Commentaire</label>"+
             "<div class='col-sm-2'><textarea rows='2'  style='color:#d96666' clnid='" + ClnId + "'  id='ClnPilDes_zzz_' name='ClnPilDes_zzz_' class='form-control'></textarea>" +
            "</div>" +
            "</div>"+

            "<div class='form-group variant'>" +
            "<div class='col-sm-4'></div>" +
            "<label class='col-sm-2 control-label' style='color:#d96666'>Code fonction</label>"+
            "<div class='col-sm-2'><input type='text'  style='color:#d96666' class='form-control' id='FeatureCode_zzz_'  clnid='" + ClnId + "' name='FeatureCode_zzz_'  /></div>" +
            "<div class='col-sm-4'></div>" +
            "</div>"+

            //remise
            "<div class='form-group variant'><label class='col-sm-2 control-label'>Pourcentage de remise</label>" +
            "<div class='col-sm-2'><div class='input-group'><input type='number' " + disabled + "  step='0.01' class='form-control' clnid='" + ClnId + "' field='ClnDiscountPercentage' id='ClnDiscountPercentage_zzz_' name='ClnDiscountPercentage_zzz_' min='0' value='" + ClnDiscountPercentage + "' onkeyup='CalCulatePrice(this)'/><span class='input-group-addon'>%</span></div></div>" +
            "<label class='col-sm-2 control-label'>Montant de remise</label>" +
            "<div class='col-sm-2'><input type='number' step='1' " + disabled + "  class='form-control' id='ClnDiscountAmount_zzz_'  clnid='" + ClnId + "' field='ClnDiscountAmount' name='ClnDiscountAmount_zzz_' min='0' value='" + ClnDiscountAmount + "' onkeyup='CalCulatePrice(this)'/></div>" +
            "<label class='col-sm-2 control-label'>Prix remisé</label>" +
            "<div class='col-sm-2'><input type='number' step='0.01' " + disabled + "  class='form-control' clnid='" + ClnId + "'  field='ClnPriceWithDiscountHt' id='ClnPriceWithDiscountHt_zzz_' name='ClnPriceWithDiscountHt_zzz_' min='0' value='" + ClnPriceWithDiscountHt + "' onkeyup='CalCulatePrice(this)'/></div>" +
            "</div>" +
            // end remise
            "<div class='form-group  variant'><label class='col-sm-2 control-label'>Total H.T.</label>" +
            "<div class='col-sm-2'><input type='number' disabled='' step='0.01' " + disabled + "  class='form-control' clnid='" + ClnId + "' id='ClnTotalPrice_zzz_' name='ClnTotalPrice_zzz_' value='" + ClnTotalPrice + "' /></div>" +
            "<label class='col-sm-2 control-label'>Total T.T.C.</label>" +
            "<div class='col-sm-2'><input type='number' disabled step='0.01' " + disabled + "  class='form-control' clnid='" + ClnId + "' id='ClnTotalCrudePrice_zzz_' name='ClnTotalCrudePrice_zzz_' value='" + ClnTotalCrudePrice + "' /></div>" +
            "<label class='col-sm-2 control-label'>Marge</label>" +
            "<div class='col-sm-2'><input type='number' disabled step='0.01' " + disabled + "  class='form-control' clnid='" + ClnId + "' id='ClnMargin_zzz_' name='ClnMargin_zzz_' value='" + ClnMargin + "' /></div>" +
            "</div>" +
            "<div class='form-group  variant'>" +
            "<div class='col-sm-2'></div><div class='col-sm-2' id='div_prd_image'><!-- image -->" +
            (create ? "" : "<img src='../../Services/ShowOutSiteImage.ashx?file=" + PrdImgPath + "' alt=''   class='img-responsive'  style='width: 100%' />") +
            "</div><div class='col-sm-10'></div>" +
            "</div>" +
            "<div class='form-group'>" +
            "<label class='col-sm-2 control-label'>Description de produit</label>" +
            "<div class='col-sm-10'><textarea rows='7' disabled cols='1' lineId='" + ClnId + "'  id='ClnPrdDes_zzz_' value='" + ClnPrdDes + "' name='ClnPrdDes_zzz_' class='form-control'></textarea>" +
            "</div>" +
            "</div>" +
            "<div class='form-group'>" +
            "<label class='col-sm-2 control-label'>Description</label>" +
            "<div class='col-sm-10'><textarea rows='3' " + disabled + "  cols='1' clnId='" + ClnId + "'  id='ClnDescription_zzz_' value='" + ClnDescription + "' name='ClnDescription_zzz_' class='form-control'></textarea></div></div>" +
            // close box
            "</div></div></div></div></div>";

    var btnAddUpdate = "<button class='btn btn-inverse' clnId='" + ClnId + "' id='btn_add_update_line_zzz_' name='btn_add_update_line_zzz_' onclick='return AddCln2Pin(this)'><span style='color:#d96666'>Ajouter une ligne d'achat</span></button>";
    var btnDelete = "<button class='btn btn-inverse' clnId='" + ClnId + "' id='btn_delete_line_zzz_' name='btn_delete_line_zzz_' onclick='return delete_Cln_Line_Confirm(this)'><span>Supprimer</span></button>";
    var btnClose = "<button class='btn btn-default bootbox-close-button' onclick='return false'><span>Annuler</span></button>";

    var btns = "<div class='modal-body center'>" + btnClose+ btnAddUpdate  + "</div>";

    var onecontent = startBox + onelineContent + btns + endBox;

    onecontent = replaceAll(onecontent, '_zzz_', '_' + ClnId);
    //currentClnId = ClnId;
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
            var h = (w - b) * 0.1;
            return h + "px";
        }
    }).find('.modal-header').css({
        'background': 'url(../../img/menu_005_bg.jpg) repeat-x',
        'text-align': 'center',
        'color': '#C0C0C0'
    });
    setAutoComplete(ClnId);
    setLintType(ClnId, LtpId);
    setLineTva(ClnId, VatId);
    if (create) {
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
                    if($.isArray(data2Treat)) {
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
        $('#LtpId_' + currentClnId).change();
    }
    if (ClnDescription) {
        $('#ClnDescription_' + currentClnId).text(ClnDescription);
    }
    if (ClnPrdDes) {
       $('#ClnPrdDes_' + currentClnId).text(ClnPrdDes);
    }
    
    if (oneLine) {
        preLoadProductInstance(oneLine.PrdId);
    }
    }
    return false;
}


function AddCln2Pin(sender) {
    var clnId = $(sender).attr('clnId') * 1;
    var qty = ($('#ClnPurchaseQty_' + clnId).val() * 1).toFixed(0);
    var comment = $('#ClnPilDes_' + clnId).val();
    var featureCode = $('#FeatureCode_' + clnId).val();
    if (qty > 0) {
        var url = window.webservicePath + "/CreatePinByLine";
        ShowPleaseWait();
        $.ajax({
            type: "POST",
            url: url,
            contentType: "application/json; charset=utf-8",
            dataType: "json",
            data: "{qty:" + qty + ",cmt:'" + comment + "',featureCode:'" + featureCode + "',clnId:" + clnId + ",colId:0,ciiId:0}",
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

function duplicateCln(clnId) {
    var cplId = getUrlVars()['cplId'];
    var url = window.webservicePath + "/DuplicateCln";
    ShowPleaseWait();
    $.ajax({
        type: "POST",
        url: url,
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        data: "{cplId:'" + cplId + "',clnId:" + clnId + "}",
        success: function(data) {
            var jsdata = data.d;
            var data2Treat = jQuery.parseJSON(jsdata);
            if (data2Treat !== '-1') {
                loadAllLines();
                HidePleaseWait();
            } else {
                AuthencationError();
            }
        },
        error: function(data) {
                HidePleaseWait();
            var test = '';
        }
    });    
}

function modify_cln_click(sender) {
    var clnId = $(sender).attr('clnId') * 1;
    var oneCln = searchFieldValueInArray(costPlanLineInPage,'ClnId',clnId);
    if (oneCln) {
        setAddUpdateLine(oneCln);
    }
    return false;
}

function getNextLevel1() {
    var level1 = 1;
    if (costPlanLineInPage && costPlanLineInPage.length > 0) {
        var maxLevel1 = costPlanLineInPage.sort(dynamicSort("-ClnLevel1"));
        level1 = maxLevel1[0].ClnLevel1 * 1 + 1;
    }
    return level1;
}

var prdsForAtCompl = [];
var pitsForAtCompl = [];
var lineCount = 0;

var currentClnId = 0;

function setAddUpdateLine(oneLine, forUpdateCreate) {
    $('#hf_cln_prd_id').text('');
    $('#hf_cln_pit_id').text('');
    var cplVatId = 1;
    if (currentCpl) {
        cplVatId = currentCpl.VatId;
    }

    var create = oneLine ? false : true;
    var ClnId = oneLine ? oneLine.ClnId : lineCount;
    lineCount--;
    var CplId = oneLine ? oneLine.CplId : '';
    var CplFId = oneLine ? oneLine.CplFId : '';
    var ClnLevel1 = oneLine ? oneLine.ClnLevel1 : getNextLevel1();
    var ClnLevel2 = oneLine ? oneLine.ClnLevel2 : '1';
    var ClnDescription = oneLine ? oneLine.ClnDescription : '';
    var PrdId = oneLine ? oneLine.PrdId : '';
    //var PrdId = oneLine ? oneLine.PrdFId : '';
    var PrdName = oneLine ? oneLine.ClnPrdName : '';
    var PitId = oneLine ? oneLine.PitId : '';
    var PitName = oneLine ? oneLine.PitName : '';
    var ClnPurchasePrice = oneLine ? oneLine.ClnPurchasePrice : '';
    var ClnUnitPrice = oneLine ? oneLine.ClnUnitPrice : '';
    var ClnQuantity = oneLine ? oneLine.ClnQuantity : '';
    var ClnTotalPrice = oneLine ? oneLine.ClnTotalPrice : '';
    var ClnTotalCrudePrice = oneLine ? oneLine.ClnTotalCrudePrice : '';
    var VatId = oneLine ? oneLine.VatId : cplVatId;
    var LtpId = oneLine ? oneLine.LtpId : '';
    var LineType = oneLine ? oneLine.LineType : '';
    var PrdImgPath = oneLine ? oneLine.PrdImgPath : '';
    var ClnDiscountPercentage = oneLine ? oneLine.ClnDiscountPercentage : '';
    var ClnDiscountAmount = oneLine ? oneLine.ClnDiscountAmount : '';
    var ClnPriceWithDiscountHt = oneLine ? oneLine.ClnPriceWithDiscountHt : '';
    var ClnMargin = oneLine ? oneLine.ClnMargin : '';
    var ClnPrdDes = oneLine ? oneLine.ClnPrdDes : '';
    if (oneLine) {
        $('#hf_cln_prd_id').text(oneLine.PrdFId);
        $('#hf_cln_pit_id').text(oneLine.PitFId);
    }
    var disabled = currentCplCstId === 2 ? " disabled " : "";
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
            "<div class='col-sm-2' style='' ><select class='form-control' id='LtpId_zzz_' " + disabled + " name='LtpId_zzz_' clnid='" + ClnId + "' onchange='ltpChange(this)'></select></div>" +
            "<label class='col-sm-2 control-label' >Niveau 1</label>" +
            "<div class='col-sm-2' ><input type='text' onkeypress='validateNumber(event)' " + disabled + "  value='" + ClnLevel1 + "' clnid='" + ClnId + "'class='form-control' id='ClnLevel1_zzz_' name='ClnLevel1_zzz_' maxlength='3' /></div>" +
            "<label class='col-sm-2 control-label' >Niveau 2</label>" +
            "<div class='col-sm-2'  ><input type='text' onkeypress='validateNumber(event)' " + disabled + "  value='" + ClnLevel2 + "' clnid='" + ClnId + "'class='form-control' id='ClnLevel2_zzz_' name='ClnLevel2_zzz_' maxlength='3' /></div>" +
            "</div>" +

            "<div class='form-group variant'>" +
            "<label class='col-sm-2 control-label'>Référence du produit</label>" +
            "<div class='col-sm-2'><input class='form-control' id='PrdId_zzz_' " + disabled + "  name='PrdId_zzz_' value='" + PrdName + "' onkeyup='checkContent(this)' clnid='" + ClnId + "' onblur='checkPrdMandatory(this)'/></div>" +
            "<div  id='div_ref_prd'></div></div>" +

            "<div class='form-group variant'>" +
            "<label class='col-sm-2 control-label sale'>Référence du sous produit</label>" +
            "<div class='col-sm-2 sale'><select id='PitId_zzz_' name='PitId_zzz_' " + disabled + "  class='form-control' clnid='" + ClnId + "' onchange='pitChange(this)'/></select></div>" +
         
            "<label class='col-sm-2 control-label'>TVA</label>" +
            "<div class='col-sm-2'><select class='form-control' " + disabled + "  clnid='" + ClnId + "' id='VatId_zzz_' name='VatId_zzz_' onchange='CalCulatePrice(this)'></select></div>" +
            "<div class='col-sm-4  center'><button type='button' class='btn btn-inverse' onclick='return GetSoldPrice()'><i class='fa fa-eye'></i></button></div>" +

           

            "</div>" +

            "<div class='form-group variant'>" +
             "<label class='col-sm-2 control-label'>Prix d'achat</label>" +
            "<div class='col-sm-2'><input type='number' step='0.01' " + disabled + "  class='form-control' clnid='" + ClnId + "' id='ClnPurchasePrice_zzz_' name='ClnPurchasePrice_zzz_' min='0' value='" + ClnPurchasePrice + "' /></div>" +
            "<label class='col-sm-2 control-label'>Quantité</label>" +
            "<div class='col-sm-2'><input type='number' step='1' " + disabled + "  class='form-control' id='ClnQuantity_zzz_'  clnid='" + ClnId + "' name='ClnQuantity_zzz_' min='0' value='" + ClnQuantity + "' onkeyup='CalCulatePrice(this)'/></div>" +
            "<label class='col-sm-2 control-label'>Prix unitaire</label>" +
            "<div class='col-sm-2'><input type='number' " + disabled + "  step='0.01' class='form-control' clnid='" + ClnId + "' id='ClnUnitPrice_zzz_' name='ClnUnitPrice_zzz_' min='0' value='" + ClnUnitPrice + "' onkeyup='CalCulatePrice(this)'/></div>" +
            "</div>" +
            //remise
            "<div class='form-group variant'><label class='col-sm-2 control-label'>Pourcentage de remise</label>" +
            "<div class='col-sm-2'><div class='input-group'><input type='number' " + disabled + "  step='0.01' class='form-control' clnid='" + ClnId + "' field='ClnDiscountPercentage' id='ClnDiscountPercentage_zzz_' name='ClnDiscountPercentage_zzz_' min='0' value='" + ClnDiscountPercentage + "' onkeyup='CalCulatePrice(this)'/><span class='input-group-addon'>%</span></div></div>" +
            "<label class='col-sm-2 control-label'>Montant de remise</label>" +
            "<div class='col-sm-2'><input type='number' step='1' " + disabled + "  class='form-control' id='ClnDiscountAmount_zzz_'  clnid='" + ClnId + "' field='ClnDiscountAmount' name='ClnDiscountAmount_zzz_' min='0' value='" + ClnDiscountAmount + "' onkeyup='CalCulatePrice(this)'/></div>" +
            "<label class='col-sm-2 control-label'>Prix remisé</label>" +
            "<div class='col-sm-2'><input type='number' step='0.01' " + disabled + "  class='form-control' clnid='" + ClnId + "'  field='ClnPriceWithDiscountHt' id='ClnPriceWithDiscountHt_zzz_' name='ClnPriceWithDiscountHt_zzz_' min='0' value='" + ClnPriceWithDiscountHt + "' onkeyup='CalCulatePrice(this)'/></div>" +
            "</div>" +
            // end remise
            "<div class='form-group  variant'><label class='col-sm-2 control-label'>Total H.T.</label>" +
            "<div class='col-sm-2'><input type='number' disabled='' step='0.01' " + disabled + "  class='form-control' clnid='" + ClnId + "' id='ClnTotalPrice_zzz_' name='ClnTotalPrice_zzz_' value='" + ClnTotalPrice + "' /></div>" +
            "<label class='col-sm-2 control-label'>Total T.T.C.</label>" +
            "<div class='col-sm-2'><input type='number' disabled step='0.01' " + disabled + "  class='form-control' clnid='" + ClnId + "' id='ClnTotalCrudePrice_zzz_' name='ClnTotalCrudePrice_zzz_' value='" + ClnTotalCrudePrice + "' /></div>" +
            "<label class='col-sm-2 control-label'>Marge</label>" +
            "<div class='col-sm-2'><input type='number' disabled step='0.01' " + disabled + "  class='form-control' clnid='" + ClnId + "' id='ClnMargin_zzz_' name='ClnMargin_zzz_' value='" + ClnMargin + "' /></div>" +
            "</div>" +
            "<div class='form-group  variant'>" +
            "<div class='col-sm-2'></div><div class='col-sm-2' id='div_prd_image'><!-- image -->" +
            (create ? "" : "<img src='../../Services/ShowOutSiteImage.ashx?file=" + PrdImgPath + "' alt=''   class='img-responsive'  style='width: 100%' />") +
            "</div><div class='col-sm-10'></div>" +
            "</div>" +
            "<div class='form-group'>" +
            "<label class='col-sm-2 control-label'>Description de produit</label>" +
            "<div class='col-sm-10'><textarea rows='7' disabled cols='1' lineId='" + ClnId + "'  id='ClnPrdDes_zzz_' value='" + ClnPrdDes + "' name='ClnPrdDes_zzz_' class='form-control'></textarea>" +
            "</div>" +
            "</div>" +
            "<div class='form-group'>" +
            "<label class='col-sm-2 control-label'>Description</label>" +
            "<div class='col-sm-10'><textarea rows='3' " + disabled + "  cols='1' clnId='" + ClnId + "'  id='ClnDescription_zzz_' value='" + ClnDescription + "' name='ClnDescription_zzz_' class='form-control'></textarea></div></div>" +
            // close box
            "</div></div></div></div></div>";

    var btnAddUpdate = "<button class='btn btn-inverse' clnId='" + ClnId + "' id='btn_add_update_line_zzz_' name='btn_add_update_line_zzz_' onclick='return AddUpdateCostPlanLine(this)'><span>" + (!create ? "Mettre à jour" : "Ajouter") + "</span></button>";
    var btnDelete = "<button class='btn btn-inverse' clnId='" + ClnId + "' id='btn_delete_line_zzz_' name='btn_delete_line_zzz_' onclick='return delete_Cln_Line_Confirm(this)'><span>Supprimer</span></button>";
    var btnClose = "<button class='btn btn-default bootbox-close-button' onclick='return false'><span>Annuler</span></button>";

    var btns = "<div class='modal-body center'>" + btnClose+ (currentCplCstId === 2 ?"": btnAddUpdate)  + "</div>";

    var onecontent = startBox + onelineContent + btns + endBox;

    onecontent = replaceAll(onecontent, '_zzz_', '_' + ClnId);
    currentClnId = ClnId;
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
    setAutoComplete(ClnId);
    setLintType(ClnId, LtpId);
    setLineTva(ClnId, VatId);
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
                    if($.isArray(data2Treat)) {
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
        $('#LtpId_' + currentClnId).change();
    }
    if (ClnDescription) {
        $('#ClnDescription_' + currentClnId).text(ClnDescription);
    }
    if (ClnPrdDes) {
       $('#ClnPrdDes_' + currentClnId).text(ClnPrdDes);
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


function checkPrdMandatory(sender) {
    var prdId = $('#hf_cln_prd_id').text();
    var colid = $(sender).attr('clnid') * 1;
    
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
    $("#hf_cln_pit_id").text($(sender).val());
    var clnId = $(sender).attr('clnId');
    var purchaseprice = $(sender).find(":selected").attr('data-value');
    $('#ClnPurchasePrice_' + clnId).val(purchaseprice);
    var price = $(sender).find(":selected").attr('data-price');
    $('#ClnUnitPrice_' + clnId).val(price);
    var description = $(sender).find(":selected").attr('description');
    $('#ClnDescription_' + clnId).text(description);
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
    var alldes = PrdName + " " +
    ((IsNullOrEmpty(PrdSubName) || PrdName === PrdSubName )? "" : PrdSubName.trim()) +
    (IsNullOrEmpty(propdes) ? "" : ("\r\n" + propdes.trim())) +
    (IsNullOrEmpty(additionnalInfo) ? "" : ("\r\n" + additionnalInfo.trim()));

    $('#ClnPrdDes_' + clnId).text(alldes);
    if (Description) {
        $('#Description_' + clnId).text(Description);
    }
     if (!IsNullOrEmpty(onePit.PitDefaultImage)) {
        $('#div_prd_image').empty();
        var imgContent = "<img src='../../Services/ShowOutSiteImage.ashx?file=" + onePit.PitDefaultImage + "' alt=''   class='img-responsive'  style='width: 100%' />";
        $('#div_prd_image').append(imgContent);
    } else {
        $('#div_prd_image').empty();
    }
}

function setLineTva(clnId, vatId) {
    if (allTVA) {
        var budgetId = '#VatId_' + clnId;
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

function setLintType(clnId, ltpId) {
    if (allLineType) {
        var budgetId = '#LtpId_' + clnId;
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
        $('#hf_cln_prd_id').text('');
    }
}

function AddUpdateCostPlanLine(sender) {
    $(sender).prop('disabled', true);
    var isprdman = checkPrdMandatory(sender);
    if (isprdman) {
        var clnId = $(sender).attr('clnid');

        var LtpId = $('#LtpId_' + clnId).val() * 1;
        var PrdId = $('#PrdId_' + clnId);
        var PitId = $('#PitId_' + clnId + ' option:selected');
        var ClnPurchasePrice = $('#ClnPurchasePrice_' + clnId);
        var VatId = $('#VatId_' + clnId);
        var ClnQuantity = $('#ClnQuantity_' + clnId);
        var ClnUnitPrice = $('#ClnUnitPrice_' + clnId);
        var ClnTotalPrice = $('#ClnTotalPrice_' + clnId);
        var ClnTotalCrudePrice = $('#ClnTotalCrudePrice_' + clnId);
        var ClnLevel1 = $('#ClnLevel1_' + clnId);
        var ClnLevel2 = $('#ClnLevel2_' + clnId);
        var ClnDescription = $('#ClnDescription_' + clnId);

        var ClnDiscountPercentage = $('#ClnDiscountPercentage_' + clnId);
        var ClnDiscountAmount = $('#ClnDiscountAmount_' + clnId);
        var ClnPriceWithDiscountHt = $('#ClnPriceWithDiscountHt_' + clnId);
        var ClnMargin = $('#ClnMargin_' + clnId);
        var ClnPrdDes = $('#ClnPrdDes_' + clnId);


        // LtpId_zzz_
        // PrdId_zzz_
        // PitId_zzz_
        // ClnPurchasePrice_zzz_
        // VatId_zzz_
        // ClnQuantity_zzz_
        // ClnUnitPrice_zzz_
        // ClnTotalPrice_zzz_
        // ClnTotalCrudePrice_zzz_
        // ClnLevel1_zzz_
        // ClnLevel2_zzz_
        // vente

        var checkOK = true;
        if (LtpId === 2 || LtpId === 4) {
            PrdId.attr('required', '');
            ClnQuantity.attr('required', '');
            //ClnUnitPrice.attr('required', '');
            if (LtpId === 2) {
                PitId.attr('required', '');
            } else {
                PitId.removeAttr('required');
            }
        } else {
            PrdId.removeAttr('required');
            PitId.removeAttr('required');
            ClnQuantity.removeAttr('required');
            ClnUnitPrice.removeAttr('required');
        }
        checkOK = CheckRequiredFieldInOneDiv('div_one_line');
        if (checkOK) {
            ShowPleaseWait();
            var ltp_id = LtpId;
            var level1 = ClnLevel1.val() * 1 + 0;
            var level2 = ClnLevel2.val() * 1 + 0;
            var product = PrdId.val();
            var prdId = $('#hf_cln_prd_id').text();
            var pitId = $('#hf_cln_pit_id').text();
            var pitname = PitId.text();
            var purchasePrice = (ClnPurchasePrice.val().replace(',', '.')) * 1;
            var tva = VatId.val();
            var quantity = ClnQuantity.val().replace(',', '.') * 1;
            var unitprice = ClnUnitPrice.val().replace(',', '.') * 1;
            var totalHt = ClnTotalPrice.val().replace(',', '.') * 1;
            var totalTtc = ClnTotalCrudePrice.val().replace(',', '.') * 1;


            var clndiscountPercentage = ClnDiscountPercentage.val().replace(',', '.') * 1;
            var clndiscountAmount = ClnDiscountAmount.val().replace(',', '.') * 1;
            var clnPriceWithDiscount = ClnPriceWithDiscountHt.val().replace(',', '.') * 1;
            var clnMargin = ClnMargin.val().replace(',', '.') * 1;


            var description = ClnDescription.val();

            var oneline = {};
            oneline.ClnId = clnId;
            oneline.CplFId = getUrlVars()['cplId'];
            oneline.ClnLevel1 = level1;
            oneline.ClnLevel2 = level2;
            oneline.ClnDescription = description;
            oneline.PrdFId = prdId;
            oneline.PitFId = pitId;
            oneline.PrdName = product;
            oneline.PitName = pitname;
            oneline.ClnPrdName = product;
            oneline.ClnPurchasePrice = purchasePrice;
            oneline.ClnUnitPrice = unitprice;
            oneline.ClnQuantity = quantity;
            oneline.ClnTotalPrice = totalHt;
            oneline.ClnTotalCrudePrice = totalTtc;

            oneline.ClnDiscountPercentage = clndiscountPercentage;
            oneline.ClnDiscountAmount = clndiscountAmount;
            oneline.ClnPriceWithDiscountHt = clnPriceWithDiscount;
            oneline.ClnMargin = clnMargin;
            oneline.ClnPrdDes = ClnPrdDes.val();

            oneline.VatId = tva;
            oneline.LtpId = ltp_id;
            var jsondata = JSON.stringify({ oneLine: oneline });
            var url = window.webservicePath + "/InsertUpdateCln";
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

function AddUpdateCostPlanLineDrvAcc(sender) {
    $(sender).prop('disabled', true);
    var clnId = $(sender).attr('clnid');
    var LtpId = $('#LtpId_' + clnId).val() * 1;
    var PrdFId = $("#hf_cln_prd_id").text();

    var clns = [];
    var allLines = $("input[id^='ip_drv_acc_qty_']");
    var ClnLevel1 = $('#ClnLevel1_' + clnId);
    var ClnLevel2 = $('#ClnLevel2_' + clnId);
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
            var ClnTotalPrice = quantity * unitprice;
            var ClnTotalCrudePrice = ClnTotalPrice * (1 + tva / 100);
            ClnTotalPrice = ClnTotalPrice.toFixed(2);
            ClnTotalCrudePrice = ClnTotalCrudePrice.toFixed(2);
            var ClnDiscountPercentage = 0;
            var ClnDiscountAmount = 0;
            var ClnPriceWithDiscountHt = ClnTotalPrice;
            var clnMargin = (ClnTotalPrice - purchasePrice) * quantity;
            var description = replaceAll(replaceAll($('#sp_drv_acc_des_' + PitId).html(), '<br>', '\r\n'), '<br/>', '\r\n');
            var oneline = {};
            oneline.FId = PrdFId;
            oneline.PrdFId = PrdFId;
            oneline.ClnId = clnId;
            oneline.CplFId = getUrlVars()['cplId'];

            oneline.ClnLevel1 = level1;
            oneline.ClnLevel2 = level2;
            oneline.ClnDescription = description;
            oneline.PrdId = PrdId;
            oneline.PitId = PitId;
            oneline.PrdName = "";
            oneline.PitName = "";
            oneline.ClnPrdName = "";
            oneline.ClnPurchasePrice = purchasePrice;
            oneline.ClnUnitPrice = unitprice;
            oneline.ClnQuantity = quantity;
            oneline.ClnTotalPrice = ClnTotalPrice;
            oneline.ClnTotalCrudePrice = ClnTotalCrudePrice;

            oneline.ClnDiscountPercentage = 0;
            oneline.ClnDiscountAmount = 0;
            oneline.ClnPriceWithDiscountHt = ClnTotalPrice;
            oneline.ClnMargin = clnMargin;
            oneline.ClnPrdDes = "";

            oneline.VatId = VatId;
            oneline.LtpId = ltp_id;

            clns.push(oneline);
        }
    });

    //console.log(clns);
    $(sender).prop('disabled', false);

    if (clns.length > 0) {
        ShowPleaseWait();
        var jsondata = JSON.stringify({ clns: clns });
        var url = window.webservicePath + "/InsertUpdateClns";
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

function CalCulatePrice(sender) {
    var clnId = $(sender).attr('clnId');
    var field = $(sender).attr('field');
    var tva = $('#VatId_' + clnId + '  option:selected');
    var quantity = $('#ClnQuantity_' + clnId).val() * 1;
    var unitprice = $('#ClnUnitPrice_' + clnId).val() * 1;
    var disPercentage = $('#ClnDiscountPercentage_' + clnId).val() * 1;
    var disAmount= $('#ClnDiscountAmount_' + clnId).val() * 1;
    var disPrice = $('#ClnPriceWithDiscountHt_' + clnId).val() * 1;
    var purcharsePrice = $('#ClnPurchasePrice_'+ clnId).val() * 1;

    if (field === 'ClnDiscountPercentage' || field === 'ClnDiscountAmount' || field === 'ClnPriceWithDiscountHt') {
        if (field === 'ClnDiscountPercentage') {
            disAmount = (disPercentage * unitprice / 100).toFixed(2);
            disPrice = (unitprice - disAmount).toFixed(2);
            //disPrice = ((100 - disPercentage) * unitprice / 100).toFixed(2);
            $('#ClnDiscountAmount_' + clnId).val(disAmount);
            $('#ClnPriceWithDiscountHt_' + clnId).val(disPrice);
        }
        else if (field === 'ClnDiscountAmount') {
            disPercentage = (disAmount * 100 / (unitprice ? unitprice : 1)).toFixed(2);
            disPrice = (unitprice - disAmount).toFixed(2);
            $('#ClnDiscountPercentage_' + clnId).val(disPercentage);
            $('#ClnPriceWithDiscountHt_' + clnId).val(disPrice);
        } else {
            disPercentage = ((unitprice - disPrice )* 100 / (unitprice ? unitprice : 1)).toFixed(2);
            disAmount = (unitprice - disPrice ).toFixed(2);
            $('#ClnDiscountPercentage_' + clnId).val(disPercentage);
            $('#ClnDiscountAmount_' + clnId).val(disAmount);
        }
    } else {
        disAmount = (disPercentage * unitprice / 100).toFixed(2);
        disPrice = (unitprice - disAmount).toFixed(2);
        //disPrice = ((100 - disPercentage) * unitprice / 100).toFixed(2);
        $('#ClnDiscountAmount_' + clnId).val(disAmount);
        $('#ClnPriceWithDiscountHt_' + clnId).val(disPrice);
    }

    var totalHT = $('#ClnTotalPrice_' + clnId);
    var totalTTC = $('#ClnTotalCrudePrice_' + clnId);
    var margin = $('#ClnMargin_' + clnId);

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

function delete_Cln_Line_Confirm(sender) {
    var clnId = $(sender).attr('clnId');
    var title = "ATTENTION";
    var content = "<div class='box'><div class='box-body' style='height: 100px;'>" +
        "<div class='form-horizontal'>" +
        "<div class='col-md-12'>" +
        "<div class='form-group'>" +
        "<div class='col-sm-12' style='text-align:center;font-size: 18pt;'>Veuillez confirmer la suppression ! " +
        "<br/>La suppression est irrécupérable, veuillez confirmer !!!</div></div></div></div></div></div>"
        + "<div class='modal-footer center'>" +
        "<button type='button' class='btn btn-default' onclick='closeDialog()'>Annuler</button>" +
        "<button type='button' class='btn btn-inverse' clnId='"+clnId +"' onclick='return delete_Cln(this);'>SUPPRIMER</button></div>";
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

function delete_Cln(sender) {
    var clnId = $(sender).attr('clnId');
    var cplId = getUrlVars()['cplId'];
    var url = window.webservicePath + "/DeleteCostPlanLine";
    $.ajax({
        type: "POST",
        url: url,
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        data: "{cplId:'" + cplId + "',clnId:" + clnId + "}",
        success: function(data) {
            var jsdata = data.d;
            var data2Treat = jQuery.parseJSON(jsdata);
            if (data2Treat !== '-1') {
                loadAllLines();
            } else {
                AuthencationError();
            }
        },
        error: function(data) {
            var test = '';
        }
    });
}

function viewPrd(id) {
    if (id) {
        var url = '../../Views/Product/Product.aspx?prdId=' + id+ "&mode=view";
        var win = window.open(url, '_black');
        win.focus();
    }
    return false;
}

// add accessory
function addupdateDrvAcc(oneLine) {
    
    $('#hf_cln_prd_id').text('');
    $('#hf_cln_pit_id').text('');
    var cplVatId = 1;
    if (currentCpl) {
        cplVatId = currentCpl.VatId;
    }

    var create = oneLine ? false : true;
    var ClnId = oneLine ? oneLine.ClnId : lineCount;
    lineCount--;
    var CplId = oneLine ? oneLine.CplId : '';
    var CplFId = oneLine ? oneLine.CplFId : '';
    var ClnLevel1 = oneLine ? oneLine.ClnLevel1 : getNextLevel1();
    var ClnLevel2 = oneLine ? oneLine.ClnLevel2 : '1';
    var ClnDescription = oneLine ? oneLine.ClnDescription : '';
    var PrdId = oneLine ? oneLine.PrdId : '';
    //var PrdId = oneLine ? oneLine.PrdFId : '';
    var PrdName = oneLine ? oneLine.ClnPrdName : '';
    var PitId = oneLine ? oneLine.PitId : '';
    var PitName = oneLine ? oneLine.PitName : '';
    var ClnPurchasePrice = oneLine ? oneLine.ClnPurchasePrice : '';
    var ClnUnitPrice = oneLine ? oneLine.ClnUnitPrice : '';
    var ClnQuantity = oneLine ? oneLine.ClnQuantity : '';
    var ClnTotalPrice = oneLine ? oneLine.ClnTotalPrice : '';
    var ClnTotalCrudePrice = oneLine ? oneLine.ClnTotalCrudePrice : '';
    var VatId = oneLine ? oneLine.VatId : cplVatId;
    var LtpId = oneLine ? oneLine.LtpId : '';
    var LineType = oneLine ? oneLine.LineType : '';
    var PrdImgPath = oneLine ? oneLine.PrdImgPath : '';
    var ClnDiscountPercentage = oneLine ? oneLine.ClnDiscountPercentage : '';
    var ClnDiscountAmount = oneLine ? oneLine.ClnDiscountAmount : '';
    var ClnPriceWithDiscountHt = oneLine ? oneLine.ClnPriceWithDiscountHt : '';
    var ClnMargin = oneLine ? oneLine.ClnMargin : '';
    var ClnPrdDes = oneLine ? oneLine.ClnPrdDes : '';
    
    var disabled = currentCplCstId === 2 ? " disabled " : "";
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
            "<div class='col-sm-2' style='display:none;' ><select class='form-control' id='LtpId_zzz_' " + disabled + " name='LtpId_zzz_' clnid='" + ClnId + "' onchange='ltpChange(this)'></select></div>" +
            "<label class='col-sm-2 control-label' style='display:none;' >Niveau 1</label>" +
            "<div class='col-sm-2' style='display:none;' ><input type='text' onkeypress='validateNumber(event)' " + disabled + "  value='" + ClnLevel1 + "' clnid='" + ClnId + "'class='form-control' id='ClnLevel1_zzz_' name='ClnLevel1_zzz_' maxlength='3' /></div>" +
            "<label class='col-sm-2 control-label' style='display:none;' >Niveau 2</label>" +
            "<div class='col-sm-2' style='display:none;' ><input type='text' onkeypress='validateNumber(event)' " + disabled + "  value='" + ClnLevel2 + "' clnid='" + ClnId + "'class='form-control' id='ClnLevel2_zzz_' name='ClnLevel2_zzz_' maxlength='3' /></div>" +
            "</div>" +
            "<div class='form-group variant'>" +
            "<label class='col-sm-4 control-label'>Référence du produit</label>" +
            "<div class='col-sm-4'><input class='form-control' id='PrdId_zzz_' " + disabled + "  name='PrdId_zzz_' value='" + PrdName + "' onkeyup='checkContent(this)' clnid='" + ClnId + "' /></div><div class='col-sm-4'></div>" +
            "</div>" +
            // driver and accessory list
            "<div class='form-group' id='div_drv_acc_list'>" +
            "</div>" +
            // close box
            "</div></div></div></div></div>";

    var btnAddUpdate = "<button class='btn btn-inverse' clnId='" + ClnId + "' id='btn_add_update_line_zzz_' name='btn_add_update_line_zzz_' onclick='return AddUpdateCostPlanLineDrvAcc(this)'><span>" + (!create ? "Mettre à jour" : "Ajouter") + "</span></button>";
    var btnDelete = "<button class='btn btn-inverse' clnId='" + ClnId + "' id='btn_delete_line_zzz_' name='btn_delete_line_zzz_' onclick='return delete_Cln_Line_Confirm(this)'><span>Supprimer</span></button>";
    var btnClose = "<button class='btn btn-default bootbox-close-button' onclick='return false'><span>Annuler</span></button>";

    var btns = "<div class='modal-body center'>" + btnClose + (currentCplCstId === 2 ? "" : btnAddUpdate) + "</div>";

    var onecontent = startBox + onelineContent + btns + endBox;

    onecontent = replaceAll(onecontent, '_zzz_', '_' + ClnId);
    currentClnId = ClnId;
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
    setAutoCompleteForDrvAcc(ClnId);
    setLintType(ClnId, LtpId);
    setLineTva(ClnId, VatId);
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
        $('#LtpId_' + currentClnId).change();
    }

    return false;
}
