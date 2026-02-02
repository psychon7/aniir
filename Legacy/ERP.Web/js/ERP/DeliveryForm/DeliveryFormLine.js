var deliveryLines2Delivery = [];
var clientOrderLines2Treate = [];
function LoadClientOrderLines() {
    var dfoId = getUrlVars()['dfoId'];
    if (dfoId) {
        var datastr = "{dfoId:'" + dfoId + "'}";
        var url = window.webservicePath + '/GetClientOrderLinesForDelivery';
        $.ajax({
            type: "POST",
            url: url,
            data: datastr,
            contentType: "application/json; charset=utf-8",
            dataType: "json",
            success: function (data) {
                var jsdata = data.d;
                var data2Treat = jQuery.parseJSON(jsdata);
                if (data2Treat !== '-1') {
                    clientOrderLines2Treate = [];
                    clientOrderLines2Treate = data2Treat;
                    deliveryLines2Delivery = [];
                    $('#tbody_clientorder_line').empty();
                    var linecount = 1;
                    $.each(clientOrderLines2Treate, function (name, value) {
                        var lineclass = (linecount % 2 === 1) ? "odd" : "even";
                        var prdname = (value.LtpId === 2 || value.LtpId === 4  || value.LtpId === -1) ? value.ColPrdName : "";
                        var pitname = (value.LtpId === 2 || value.LtpId === 4  || value.LtpId === -1) ? value.PitName : "";
                        var quantity = (value.LtpId === 2 || value.LtpId === 4  || value.LtpId === -1) ? value.ColQuantity : "";
                        var quantity2Delivery = (value.LtpId === 2 || value.LtpId === 4  || value.LtpId === -1) ? value.ColQuantityToDelivery : "";
                        var quantityDeliveried = (value.LtpId === 2 || value.LtpId === 4  || value.LtpId === -1) ? value.ColQuantityDeliveried : "";
                        var purchasePrice = (value.LtpId === 2 || value.LtpId === 4  || value.LtpId === -1) ? value.ColPurchasePrice : "";
                        var unitpriceDiscount = (value.LtpId === 2 || value.LtpId === 4  || value.LtpId === -1) ? value.ColPriceWithDiscountHt : "";
                        var unitprice = (value.LtpId === 2 || value.LtpId === 4  || value.LtpId === -1) ? value.ColUnitPrice : "";
                        var vatlabel = (value.LtpId === 2 || value.LtpId === 4  || value.LtpId === -1) ? value.VatLabel : "";
                        var totalht = (value.LtpId === 2 || value.LtpId === 4  || value.LtpId === -1 || value.LtpId === 5 || value.LtpId === 6) ? value.ColTotalPrice : "";
                        var totalttc = (value.LtpId === 2 || value.LtpId === 4  || value.LtpId === -1 || value.LtpId === 5 || value.LtpId === 6) ? value.ColTotalCrudePrice : "";
                        if (value.LtpId === 5) {
                            lineclass += " subTotal";
                        }
                        if (value.LtpId === 6) {
                            lineclass += " total";
                        }

                        var description = replaceAll(value.ColPrdDes, '\n', '</br>') + '</br>---------------------------</br>' + replaceAll(value.ColDescription, '\n', '</br>');


                        var btn = "<td><button class='btn btn-inverse' title='Livrer ce produit' id='" + value.ColId + "'  DflId='0'  colId='" + value.ColId + "' onclick='return delivery_product(this)'><i class='fa fa-truck'></i></button></td>";
                        var btnEmpty = "<td></td>";
                        var oneline = "<tr class='" + lineclass + "'>" +
                        //                            "<td class='label_left'>" + value.ColLevel1 + "." + value.ColLevel2 + "</td>" +
                        //                            "<td class='label_left'>" + value.LineType + "</td>" +
                            "<td class='label_left'><div style='text-align:left'>" + prdname + "</div></td>" +
                            "<td class='label_left'><div style='text-align:left'>" + pitname + "</div></td>" +
                            "<td class='label_left'><div style='text-align:left'>" + description + "</div></td>" +
                            "<td class='label_right'><div style='text-align:right'>" + quantity + "</div></td>" +
                            "<td class='label_right'><div style='text-align:right'>" + quantityDeliveried + "</div></td>" +
                            "<td class='label_right'><div style='text-align:right'>" + quantity2Delivery + "</div></td>" +
                            "<td class='label_right'><div style='text-align:right'>" + purchasePrice + "</div></td>" +
                            "<td class='label_right'><div style='text-align:right'>" + unitprice + "</div></td>" +
                            "<td class='label_right'><div style='text-align:right'>" + unitpriceDiscount + "</div></td>" +
                            "<td class='label_left'><div style='text-align:left'>" + vatlabel + "</div></td>" +
                            "<td class='label_right'><div style='text-align:right'>" + totalht + "</div></td>" +
                            "<td class='label_right'><div style='text-align:right'>" + totalttc + "</div></td>" +
                        //((quantity2Delivery > 0 && !deliverFormDeliveried) ? btn : (quantity2Delivery > 0 ? "" : btnEmpty)) +
                            ((!deliverFormDeliveried) ? ((quantity2Delivery > 0 ? btn : btnEmpty)) : "") +
                            "</tr>";

                        if (!deliverFormDeliveried && (quantity2Delivery > 0)) {
                            deliveryLines2Delivery.push(value.ColId);
                        }

                        linecount++;
                        $('#tbody_clientorder_line').append(oneline);
                    });
                    LoadDeliveryFormLines();
                    if (!deliverFormDeliveried && deliveryLines2Delivery.length > 0) {
                        $('#btn_delivery_all').show();
                    } else {
                        $('#btn_delivery_all').hide();
                    }
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
}

var DeliveryFormLines = [];
function LoadDeliveryFormLines() {
    var dfoId = getUrlVars()['dfoId'];
    if (dfoId) {
        ShowPleaseWait();
        var datastr = "{dfoId:'" + dfoId + "'}";
        var url = window.webservicePath + '/LoadDflByDfoId';
        $.ajax({
            type: "POST",
            url: url,
            data: datastr,
            contentType: "application/json; charset=utf-8",
            dataType: "json",
            success: function (data) {
                var jsdata = data.d;
                var data2Treat = jQuery.parseJSON(jsdata);
                if (data2Treat !== '-1') {
                    DeliveryFormLines = [];
                    DeliveryFormLines = data2Treat;
                    updateClientOrderLineByDeliveryFormLine(data2Treat);
                    $('#tdoby_delivery_form_lines').empty();
                    var linecount = 1;
                    if (data2Treat.length > 0) {
                        $('#btn_generate_pdf').show();
                        if (currentDfo.HasClientInvoice) {
                            $('#btn_create_client_invoice').hide();
                        } else {
                            if (currentDfo.HasDfl && !currentDfo.HasClientInvoice) {
                                $('#btn_create_cin_check_invoice').show();
                                $('#btn_create_cin_false').hide();
                            } else {
                                $('#btn_create_cin_check_invoice').hide();
                                $('#btn_create_cin_false').show();
                            }
                            //if (pageUserRight.RitValid) {
//                            if (currentDfo.CodAllDeliveried) {
//                                $('#btn_create_client_invoice').show();
//                                $('#btn_create_cin_false').hide();
//                            } else {
//                                $('#btn_create_cin_false').show();
//                                $('#btn_create_client_invoice').hide();
//                            }
                            //}
                        }
                        if (!currentDfo.DfoDeliveried) {
                            if (pageUserRight.RitValid) {
                                //$('#btn_delivery_dfo').show();
                            }
                        } else {
                            //$('#btn_delivery_dfo').hide();
                        }
                    } else {
                        $('#btn_generate_pdf').hide();
                        $('#btn_create_client_invoice').hide();
                    }
                    $.each(data2Treat, function (name, value) {
                        var lineclass = (linecount % 2 === 1) ? "odd" : "even";
                        var prdname = (value.LtpId === 2 || value.LtpId === 4  || value.LtpId === -1) ? value.ColPrdName : "";
                        var pitname = (value.LtpId === 2 || value.LtpId === 4  || value.LtpId === -1) ? value.PitName : "";
                        var quantity = (value.LtpId === 2 || value.LtpId === 4  || value.LtpId === -1) ? value.DflQuantity : "";
                        var purchasePrice = (value.LtpId === 2 || value.LtpId === 4  || value.LtpId === -1) ? value.ColPurchasePrice : "";
                        var unitprice = (value.LtpId === 2 || value.LtpId === 4  || value.LtpId === -1) ? value.ColUnitPrice : "";
                        var unitpriceDiscount = (value.LtpId === 2 || value.LtpId === 4  || value.LtpId === -1) ? value.ColPriceWithDiscountHt : "";
                        var totalht = unitpriceDiscount * quantity;
                        unitprice = unitprice.toFixed(2);
                        unitpriceDiscount = unitpriceDiscount.toFixed(2);
                        totalht = totalht.toFixed(2);
                        if (value.LtpId === 5) {
                            lineclass += " subTotal";
                        }
                        if (value.LtpId === 6) {
                            lineclass += " total";
                        }
                        var ColPrdDes = value ? value.ColPrdDes : '';
                        var ColDescription = value ? value.ColDescription : '';
                        var description = (ColPrdDes === null ? '' : replaceAll(value.ColPrdDes, '\n', '</br>')) + '</br>' + replaceAll(value.ColDescription, '\n', '</br>');
                        description += '</br>---------------------------</br>' + value.DflDescription;
                        var btn = "<td><button class='btn btn-inverse' title='Livrer ce produit' id='" + value.ColId + "' DflId='" + value.DflId + "' colId='" + value.ColId + "' onclick='return delivery_product(this)'><i class='fa fa-truck'></i></button>" +
                            "<button class='btn btn-inverse' id='" + value.ColId + "' DflId='" + value.DflId + "' colId='" + value.ColId + "' onclick='return deleteDeliveryLineClick(this)'><i class='fa fa-times'></i></button>" +
                            "</td>";
                        var oneline = "<tr class='" + lineclass + "'>" +
                        "<td class='label_left'><div style='text-align:left'>" + prdname + "</div></td>" +
                        "<td class='label_left'><div style='text-align:left'>" + pitname + "</div></td>" +
                        "<td class='label_left'><div style='text-align:left'>" + description + "</div></td>" +
                        "<td class='label_right'><div style='text-align:right'>" + quantity + "</div></td>" +
                        "<td class='label_right'><div style='text-align:right'>" + purchasePrice + "</div></td>" +
                        "<td class='label_right'><div style='text-align:right'>" + unitprice + "</div></td>" +
                        "<td class='label_right'><div style='text-align:right'>" + unitpriceDiscount + "</div></td>" +
                        "<td class='label_right'><div style='text-align:right'>" + totalht + "</div></td>" +
                        "" +
                        (!deliverFormDeliveried ? btn : "") +
                        "</tr>";
                        linecount++;
                        $('#tdoby_delivery_form_lines').append(oneline);

                        //HidePleaseWait();
                    });
                } else {
                    // authentication error
                    AuthencationError();
                    //HidePleaseWait();
                }
                HidePleaseWait();
            },
            error: function (data) {
                var test = '';
                HidePleaseWait();
            }
        });
    }
}

// update client order line in page by delivery form line
function updateClientOrderLineByDeliveryFormLine(dfls) {
    $.each(dfls, function (name, value) {
        removeInArray(clientOrderLines2Treate, 'ColId', value.ColId);
        clientOrderLines2Treate.push(value);
    });
}

var lineCount = 0;
function delivery_product(sender) {
    var colId = $(sender).attr('ColId') * 1;
    var dflId = $(sender).attr('DflId') * 1;
    var oneLine = searchFieldValueInArray(clientOrderLines2Treate, 'ColId', colId);
    if (oneLine) {
        var cplVatId = 1;
        if (currentCod) {
            cplVatId = currentCod.VatId;
        }
        var create = oneLine ? false : true;
        var ColId = oneLine ? oneLine.ColId : lineCount;
        lineCount--;
        var CplId = oneLine ? oneLine.CplId : '';
        var CplFId = oneLine ? oneLine.CplFId : '';
        var ColLevel1 = oneLine ? oneLine.ColLevel1 : '1';
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
        var VatLabel = oneLine ? oneLine.VatLabel : '';
        var LtpId = oneLine ? oneLine.LtpId : '';
        var LineType = oneLine ? oneLine.LineType : '';
        var PrdImgPath = oneLine ? oneLine.PrdImgPath : '';
        var ColDiscountPercentage = oneLine ? oneLine.ColDiscountPercentage : '';
        var ColDiscountAmount = oneLine ? oneLine.ColDiscountAmount : '';
        var ColPriceWithDiscountHt = oneLine ? oneLine.ColPriceWithDiscountHt : '';
        var ColMargin = oneLine ? oneLine.ColMargin : '';
        var ColQuantityDeliveried = oneLine ? oneLine.ColQuantityDeliveried : '';
        var DflDescription = oneLine ? (oneLine.DflDescription ? oneLine.DflDescription : '') : '';
        var DflQuantity = oneLine ? (oneLine.DflQuantity ? oneLine.DflQuantity : 0) : 0;
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
            "<div class='form-group variant'>" +
            "<label class='col-sm-2 control-label'>Référence du produit</label>" +
            "<div class='col-sm-2'><input class='form-control' id='PrdId_zzz_' name='PrdId_zzz_' value='" + PrdName + "' disabled colid='" + ColId + "' /></div>" +
            "<label class='col-sm-2 control-label sale'>Référence du sous produit</label>" +
            "<div class='col-sm-2 sale'><input id='PitId_zzz_' name='PitId_zzz_' class='form-control' colid='" + ColId + "' value='" + PitName + "' disabled /></div>" +
            "<label class='col-sm-2 control-label'>Prix d'achat</label>" +
            "<div class='col-sm-2'><input type='number' step='0.01' class='form-control' colid='" + ColId + "' disabled  id='ColPurchasePrice_zzz_' name='ColPurchasePrice_zzz_' min='0' value='" + ColPurchasePrice + "' /></div>" +
            "</div>" +
        // one line
            "<div class='form-group variant'><label class='col-sm-2 control-label'>TVA</label>" +
            "<div class='col-sm-2'><input class='form-control' colid='" + ColId + "' id='VatId_zzz_' disabled  name='VatId_zzz_' value='" + VatLabel + "'></select></div>" +
            "<label class='col-sm-2 control-label' style='color: red'>Quantité total</label>" +
            "<div class='col-sm-2'><input type='number'  style='color: red' step='1' class='form-control' id='ColQuantity_zzz_'  disabled  colid='" + ColId + "' name='ColQuantity_zzz_' min='0' value='" + ColQuantity + "' onkeyup='CalCulatePrice(this)'/></div>" +
            "<label class='col-sm-2 control-label'>Prix unitaire</label>" +
            "<div class='col-sm-2'><input type='number' step='0.01' class='form-control' colid='" + ColId + "' disabled  id='ColUnitPrice_zzz_' name='ColUnitPrice_zzz_' min='0' value='" + ColUnitPrice + "' onkeyup='CalCulatePrice(this)'/></div>" +
            "</div>" +

        //remise
            "<div class='form-group variant'><label class='col-sm-2 control-label'>Pourcentage de remise</label>" +
            "<div class='col-sm-2'><div class='input-group'><input type='number' step='0.01' class='form-control' disabled  colid='" + ColId + "' field='ColDiscountPercentage' id='ColDiscountPercentage_zzz_' name='ColDiscountPercentage_zzz_' min='0' value='" + ColDiscountPercentage + "' onkeyup='CalCulatePrice(this)'/><span class='input-group-addon'>%</span></div></div>" +
            "<label class='col-sm-2 control-label'>Montant de remise</label>" +
            "<div class='col-sm-2'><input type='number' step='1' class='form-control' id='ColDiscountAmount_zzz_'  disabled  colid='" + ColId + "' field='ColDiscountAmount' name='ColDiscountAmount_zzz_' min='0' value='" + ColDiscountAmount + "' onkeyup='CalCulatePrice(this)'/></div>" +
            "<label class='col-sm-2 control-label'>Prix remisé</label>" +
            "<div class='col-sm-2'><input type='number' step='0.01' class='form-control' colid='" + ColId + "'  disabled  field='ColPriceWithDiscountHt' id='ColPriceWithDiscountHt_zzz_' name='ColPriceWithDiscountHt_zzz_' min='0' value='" + ColPriceWithDiscountHt + "' onkeyup='CalCulatePrice(this)'/></div>" +
            "</div>" +
        // end remise

            "<div class='form-group  variant'><label class='col-sm-2 control-label'>Total H.T.</label>" +
            "<div class='col-sm-2'><input type='number' disabled='' step='0.01' class='form-control' colid='" + ColId + "'  disabled id='ColTotalPrice_zzz_' name='ColTotalPrice_zzz_' value='" + ColTotalPrice + "' /></div>" +
            "<label class='col-sm-2 control-label'>Total T.T.C.</label>" +
            "<div class='col-sm-2'><input type='number' disabled step='0.01' class='form-control' colid='" + ColId + "'  disabled id='ColTotalCrudePrice_zzz_' name='ColTotalCrudePrice_zzz_' value='" + ColTotalCrudePrice + "' /></div>" +
            "<label class='col-sm-2 control-label'>Marge</label>" +
            "<div class='col-sm-2'><input type='number' disabled step='0.01' class='form-control' colid='" + ColId + "' disabled  id='ColMargin_zzz_' name='ColMargin_zzz_' value='" + ColMargin + "' /></div>" +
            "</div>" +
            "<div class='form-group'>" +
            "<label class='col-sm-2 control-label'>Description</label>" +
            "<div class='col-sm-10'><textarea rows='5' cols='1' colId='" + ColId + "'  id='ColDescription_zzz_' value='" + ColDescription + "' disabled  name='ColDescription_zzz_' class='form-control'></textarea></div>" +
            "</div>" +
        // delivery
            "<div class='form-group variant'>" +
            "<label class='col-sm-2 control-label'>Quantité déjà livré</label>" +
            "<div class='col-sm-2'><input type='number' style='color:green' step='1' class='form-control' id='ColQuantityDeliveried_zzz_'  disabled  colid='" + ColId + "' name='ColQuantityDeliveried_zzz_' min='0' value='" + ColQuantityDeliveried + "' /></div>" +
            "<label class='col-sm-2 control-label'>Quantité à livrer</label>" +
            "<div class='col-sm-2'><input type='number' step='1' class='form-control'  value='" + DflQuantity + "'  required colid='" + ColId + "'  id='DflQuantity_zzz_' name='DflQuantity_zzz_' min='1'  max='" + (ColQuantity - ColQuantityDeliveried) + "' onkeyup='CalCulatePrice(this)'/></div>" +
            "<div class='col-sm-4'></div></div>" +
            "<div class='form-group'>" +
            "<label class='col-sm-2 control-label'>Description de livraison</label>" +
            "<div class='col-sm-10'><textarea rows='3' cols='1' colId='" + ColId + "'id='DflDescription_zzz_' name='DflDescription_zzz_' class='form-control'></textarea></div>" +
            "</div>" +
        // close box
            "</div></div></div></div></div>";

        var btnAddUpdate = "<button class='btn btn-inverse' colId='" + ColId + "' dflId='" + dflId + "' id='btn_add_update_line_zzz_' name='btn_add_update_line_zzz_' onclick='return AddUpdateDeliveryFormLine(this)'><span>" + (!create ? "Mettre à jour" : "Ajouter") + "</span></button>";
        var btnDelete = "<button class='btn btn-inverse' colId='" + ColId + "' id='btn_delete_line_zzz_' name='btn_delete_line_zzz_' onclick='return deleteDeliveryLineClick(this)'><span>Supprimer</span></button>";
        var btnClose = "<button class='btn btn-default bootbox-close-button' onclick='return false'><span>Annuler</span></button>";

        var btns = "<div class='modal-body center'>" + btnClose + btnAddUpdate + "</div>";

        var onecontent = startBox + onelineContent + btns + endBox;

        onecontent = replaceAll(onecontent, '_zzz_', '_' + ColId);
        var currentColId = ColId;
        //$('#div_cost_plan_lines').append(onelineContent);


        var title = !create ? 'Mettre à jour cette linge' : 'Ajouter une ligne';
        bootbox.dialog({
            title: title,
            message: onecontent
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
            'background': 'url(../../img/menu_005_bg.jpg) repeat-x',
            'text-align': 'center',
            'color': '#C0C0C0'
        });

        var description = (ColPrdDes === null ? '' : ColPrdDes) + '\r\n---------------------------\r\n' + ColDescription;
        $('#ColDescription_' + currentColId).text(description);


        if (DflDescription) {
            $('#DflDescription_' + currentColId).text(DflDescription);
        } else {
            //$('#DflDescription_' + currentColId).text(ColDescription);
        }
    }
    return false;
}

function AddUpdateDeliveryFormLine(sender) {
    var colId = $(sender).attr('colId') * 1;
    var dflId = $(sender).attr('dflId') * 1;
    var dfoId = getUrlVars()['dfoId'];

    var dflDescription = $('#DflDescription_' + colId).val();
    var dflQuantity = $('#DflQuantity_' + colId).val().replace(',', '.') * 1;
    var oneline = {};
    oneline.DfoFId = dfoId;
    oneline.ColId = colId;
    oneline.DflId = dflId;
    oneline.DflDescription = dflDescription;
    oneline.DflQuantity = dflQuantity;

    var jsondata = JSON.stringify({ oneLine: oneline });
    var url = window.webservicePath + "/InsertUpdateDfl";
    $.ajax({
        url: url,
        type: 'POST',
        contentType: 'application/json; charset=utf-8',
        data: jsondata,
        dataType: 'json',
        success: function (data) {
            $('.bootbox-close-button').click();
            //LoadClientOrderLines();
            ShowPleaseWait();
            LoadDeliveryForm();
        },
        error: function (data) {
            alert(data.responseText);
        }
    });
}

function deleteDeliveryLineClick(sender) {
    var dflId = $(sender).attr('dflId');
    var title = "ATTENTION";
    var content = "<div class='box'><div class='box-body' style='height: 100px;'>" +
        "<div class='form-horizontal'>" +
        "<div class='col-md-12'>" +
        "<div class='form-group'>" +
        "<div class='col-sm-12' style='text-align:center;font-size: 18pt;'>Veuillez confirmer la suppression ! " +
        "<br/>La suppression est irrécupérable, veuillez confirmer !!!</div></div></div></div></div></div>"
        + "<div class='modal-footer center'>" +
        "<button type='button' class='btn btn-default' onclick='closeDialog()'>Annuler</button>" +
        "<button type='button' class='btn btn-inverse' dflId='" + dflId + "' onclick='return deleteDeliveryLine(this);'>SUPPRIMER</button></div>";
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

function deleteDeliveryLine(sender) {
    var dfoId = getUrlVars()['dfoId'];
    var dflId = $(sender).attr('dflId'); 
    ShowPleaseWait();
    if (dfoId) {
        var datastr = "{dfoId:'" + dfoId + "',dflId:" + dflId + "}";
        var url = window.webservicePath + '/DeleteDfl';
        $.ajax({
            type: "POST",
            url: url,
            data: datastr,
            contentType: "application/json; charset=utf-8",
            dataType: "json",
            success: function (data) {
                var jsdata = data.d;
                var data2Treat = jQuery.parseJSON(jsdata);
                if (data2Treat !== -1 && data2Treat !== 0) {
                    $('.bootbox-close-button').click();
                    //LoadClientOrderLines();
                    LoadDeliveryForm();
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
    return false;
}

function DeliveryAllLinesClick() {
    if (!deliverFormDeliveried) {
        var colLines = [];
        $.each(deliveryLines2Delivery, function (name, value) {
            var onecol = searchFieldValueInArray(clientOrderLines2Treate, 'ColId', value);
            if (!jQuery.isEmptyObject(onecol)) {
                colLines.push(onecol);
            }
        });

        //console.log(colLines);

        if (colLines.length > 0) {

            var contentStart = "<div class='row' id='div_dup_prd_content'><div class='col-md-12'>" +
        "<div class='box-body center' style='overflow-x:auto;'><form class='form-horizontal'>";

            var content = "<table style='width:100%' cellpadding='0' cellspacing='0' border='0' class='datatable table table-striped table-bordered table-hover'>" +
                "<tr>" +
                "<th>Produit</th>" +
                "<th>Référence</th>" +
                "<th>Des. Prd</th>" +
                "<th>P.U.</th>" +
                "<th>P.R.</th>" +
                "<th>P.T.HT</th>" +
                "<th>P.T.TTC</th>" +
                "<th>Qté Total</th>" +
                "<th>Qté livré</th>" +
                "<th>Qté à livrer</th>" +
                "<th>Des. de livraison</th>" +
                "</tr>";

            $.each(colLines, function (name, value) {
                var onecontent = "";
                //var oneline = searchFieldValueInArray(clientOrderLines2Treate, 'ColId', value);
                //if (!jQuery.isEmptyObject(oneline)) {
                onecontent += "<tr>";
                var prdname = (value.LtpId === 2 || value.LtpId === 4  || value.LtpId === -1) ? value.ColPrdName : "";
                var pitname = (value.LtpId === 2 || value.LtpId === 4  || value.LtpId === -1) ? value.PitName : "";
                var quantity = (value.LtpId === 2 || value.LtpId === 4  || value.LtpId === -1) ? value.ColQuantity : "";
                var quantity2Delivery = (value.LtpId === 2 || value.LtpId === 4  || value.LtpId === -1) ? value.ColQuantityToDelivery : "";
                var quantityDeliveried = (value.LtpId === 2 || value.LtpId === 4  || value.LtpId === -1) ? value.ColQuantityDeliveried : "";
                var purchasePrice = (value.LtpId === 2 || value.LtpId === 4  || value.LtpId === -1) ? value.ColPurchasePrice : "";
                var unitpriceDiscount = (value.LtpId === 2 || value.LtpId === 4  || value.LtpId === -1) ? value.ColPriceWithDiscountHt : "";
                var unitprice = (value.LtpId === 2 || value.LtpId === 4  || value.LtpId === -1) ? value.ColUnitPrice : "";
                var vatlabel = (value.LtpId === 2 || value.LtpId === 4  || value.LtpId === -1) ? value.VatLabel : "";
                var totalht = (value.LtpId === 2 || value.LtpId === 4  || value.LtpId === -1 || value.LtpId === 5 || value.LtpId === 6) ? value.ColTotalPrice : "";
                var totalttc = (value.LtpId === 2 || value.LtpId === 4  || value.LtpId === -1 || value.LtpId === 5 || value.LtpId === 6) ? value.ColTotalCrudePrice : "";
                var description = replaceAll(value.ColPrdDes, '\n', '</br>') + '</br>---------------------------</br>' + replaceAll(value.ColDescription, '\n', '</br>');
                onecontent += "<td class='label_left'><div style='text-align:left'>" + prdname + "</div></td>" +
                    "<td class='label_left'><div style='text-align:left'>" + pitname + "</div></td>" +
                    "<td class='label_left'><div style='text-align:left'>" + description + "</div></td>" +
                    "<td class='label_right'><div style='text-align:right'>" + unitprice + "</div></td>" +
                    "<td class='label_right'><div style='text-align:right'>" + unitpriceDiscount + "</div></td>" +
                    "<td class='label_right'><div style='text-align:right'>" + totalht + "</div></td>" +
                    "<td class='label_right'><div style='text-align:right'>" + totalttc + "</div></td>" +
                    "<td class='label_right'><div style='text-align:right'>" + quantity + "</div></td>" +
                    "<td class='label_right'><div style='text-align:right'>" + quantityDeliveried + "</div></td>" +
                    "<td class='label_right'><div style='text-align:right;width:100px;'><input class='form-control' type='number' value='" + quantity2Delivery + "' id='AllDflQuantity_" + value.ColId + "' colid='" + value.ColId + "'/></div></td>" +
                "<td class='label_right'><textarea rows='3' cols='1' colId='" + value.ColId + "'id='AllDflDescription_" + value.ColId + "' name='AllDflDescription_" + value.ColId + "' class='form-control'></textarea></td>";
                onecontent += "</tr>";
                content += onecontent;
                //}

            });

            content += "</table>";

            var contentEnd = "<div class='form-group' ><button type='submit' class='btn btn-block btn-inverse' id='btn_deliveryAll' name='btn_deliveryAll' onclick='return DeliveryAllLines()'><span>Mettre à jour</span></button>" +
        "<button class='btn btn-block btn-default bootbox-close-button' pitid='propCountId_' id='btn_close_addupdateProduct_propCountId_'><span>Annuler</span></button>" +
        "</div>" +
        "</form>" +
        "</div>" +
        "</div>" +
        "</div>";


            var allcontent = contentStart + content + contentEnd;
            var pagewidth = $(window).width();
            var dialogwidth = pagewidth >= 800 ? '70%' : '95%';

            var title = "Livrer toutes les marchandise";
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
        }
    }
    return false;
}

function DeliveryAllLines() {
    var dfls = [];
    var colLines = $('input[id^="AllDflQuantity_"]');
    //console.log(colLines);

    var dfoId = getUrlVars()['dfoId'];
    $.each(colLines, function (name, value) {

        var oneline = {};
        var colId = $(value).attr('colId') * 1;
        var dflQuantity = $(value).val() * 1;
        var dflDescription = $('#AllDflDescription_' + colId).val();
        oneline.ColId = colId;
        oneline.DflId = 0;
        oneline.DfoFId = dfoId;
        oneline.DflDescription = dflDescription;
        oneline.DflQuantity = dflQuantity;
        dfls.push(oneline);
    });

    if (dfls.length > 0) {
        ShowPleaseWait();
        var jsondata = JSON.stringify({ dfls: dfls });
        var url = window.webservicePath + "/InsertUpdateAllDfl";
        $.ajax({
            url: url,
            type: 'POST',
            contentType: 'application/json; charset=utf-8',
            data: jsondata,
            dataType: 'json',
            success: function (data) {
                $('.bootbox-close-button').click();
                //LoadClientOrderLines();
                ShowPleaseWait();
                LoadDeliveryForm();
            },
            error: function (data) {
                alert(data.responseText);
            }
        });

    }

    //    var colId = $(sender).attr('colId') * 1;
    //    var dflId = $(sender).attr('dflId') * 1;

    //    var dflDescription = $('#DflDescription_' + colId).val();
    //    var dflQuantity = $('#DflQuantity_' + colId).val().replace(',', '.') * 1;
    //    var oneline = {};
    //    oneline.DfoFId = dfoId;
    //    oneline.ColId = colId;
    //    oneline.DflId = dflId;
    //    oneline.DflDescription = dflDescription;
    //    oneline.DflQuantity = dflQuantity;

    //    var jsondata = JSON.stringify({ oneLine: oneline });
    //    var url = window.webservicePath + "/InsertUpdateDfl";
    //    $.ajax({
    //        url: url,
    //        type: 'POST',
    //        contentType: 'application/json; charset=utf-8',
    //        data: jsondata,
    //        dataType: 'json',
    //        success: function (data) {
    //            $('.bootbox-close-button').click();
    //            LoadClientOrderLines();
    //        },
    //        error: function (data) {
    //            alert(data.responseText);
    //        }
    //    });

    return false;
}