$(document).ready(initAll);

function initAll() {

    js_getAllCurrency('CurId');
    //js_getAllTVA('VatId');
    getAllTVA();
    var sinId = getUrlVars()['sinId'];
    if (sinId) {
        LoadSupplier(true);
    } else {
        LoadSupplier();
    }
    if (_isView) {
        loadAllLines();
    }
    $.each($('.datepicker'), function(idx, value) {
        $(value).datepicker();
    });
    initMode();
    setClickableLabel();
    if (_isCreate) {
        $('#DateCreation').val(getToday());
    }

    SetLanguageBar();
}

var contactSuppliers = [];
function SupplierChanged(sender) {
    var supId = $(sender).find('option:selected').attr('data-value');
    //alert(supId);
    if (supId) {
        loadAllBankInfo(supId,0);
        var url = window.webservicePath + "/LoadSupplierContactBySupId";
        $('#ScoId').empty();
        $.ajax({
            type: "POST",
            url: url,
            contentType: "application/json; charset=utf-8",
            data: "{supId:'" + supId + "'}",
            dataType: "json",
            success: function (data) {
                var jsdata = data.d;
                var data2Treat = jQuery.parseJSON(jsdata);
                if (data2Treat !== '-1') {
                    if (data2Treat.length > 0) {
                        contactSuppliers = [];
                        contactSuppliers = data2Treat;
                        $.each(contactSuppliers, function (index, value) {
                            if (ScoId && ScoId === value.ScoId) {
                                $('#ScoId').append($("<option></option>").attr("value", value.ScoId).attr("selected", true).text(value.ScoAdresseTitle));
                            } else {
                                $('#ScoId').append($("<option></option>").attr("value", value.ScoId).text(value.ScoAdresseTitle));
                            }
                        });
                        if (_isView) {
                            $('#ScoId').attr("disabled", "");
                        }
                        $('#ScoId').change();
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

var allSupplier = [];
function LoadSupplier(loadSod) {
    var url = window.webservicePath + "/GetAllSuppliers";
    var budgetId = '#SupId';
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
                if (loadSod) {
                    LoadSupplierInvoice();
                }
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

function scoChange(sender) {
    var scoid = $(sender).val() * 1;
    if (scoid > 0) {
        var aSco = searchFieldValueInArray(contactSuppliers, 'ScoId', scoid);
        if (!jQuery.isEmptyObject(aSco)) {
            var ccoRef = 'ScoRef';
            var ccoFirstname = 'ScoFirstname';
            var ccoLastname = 'ScoLastname';
            var ccoAddress1 = 'ScoAddress1';
            var ccoAddress2 = 'ScoAddress2';
            var ccoPostcode = 'ScoPostcode';
            var ccoCity = 'ScoCity';
            var ccoCountry = 'ScoCountry';
            var ccoTel1 = 'ScoTel1';
            var ccoEmail = 'ScoEmail';
            var ccoFax = 'ScoFax';
            var ccoCellphone = 'ScoCellphone';
            $('#' + ccoRef).val(aSco.ScoRef);
            $('#' + ccoFirstname).val(aSco.ScoFirstname);
            $('#' + ccoLastname).val(aSco.ScoLastname);
            $('#' + ccoAddress1).val(aSco.ScoAddress1);
            $('#' + ccoAddress2).val(aSco.ScoAddress2);
            $('#' + ccoPostcode).val(aSco.ScoPostcode);
            $('#' + ccoCity).val(aSco.ScoCity);
            $('#' + ccoCountry).val(aSco.ScoCountry);
            $('#' + ccoTel1).val(aSco.ScoTel1);
            $('#' + ccoEmail).val(aSco.ScoEmail);
            $('#' + ccoFax).val(aSco.ScoFax);
            $('#' + ccoCellphone).val(aSco.ScoCellphone);
        }
    }
}

function js_create_update_item() {
    var checkOK = CheckRequiredFieldInOneDiv('content');
    if (checkOK) {
        var item = Object();
        item.SinName= $('#SinName').val();
        item.SupFId = $('#SupId').find('option:selected').attr('data-value');
        item.CurId = $('#CurId').val();
        item.VatId = $('#VatId').val();
        item.SupplierComment = $('#SupplierComment').val();
        item.InterComment = $('#InterComment').val();
        item.ScoId = $('#ScoId').val();
        item.BacId= $('#BankName').val();
        item._DateStartProduction= $('#_DateStartProduction').val();
        item._DateCompleteProductionPlanned= $('#_DateCompleteProductionPlanned').val();
        item._DateCompleteProduction= $('#_DateCompleteProduction').val();
        item.SinIsPaid = $('#SinIsPaid').is(':checked');
        item.SinStartProduction = $('#SinStartProduction').is(':checked');
        item.SinCompleteProduction = $('#SinCompleteProduction').is(':checked');
        item.SinFId = getUrlVars()['sinId'];
        item.DateCreation = getCreationDate($('#DateCreation').val());


        var jsondata = JSON.stringify({ item: item });
        $.ajax({
            url: 'SupplierInvoice.aspx/CreateUpdateSupplierInvoice',
            type: 'POST',
            contentType: 'application/json; charset=utf-8',
            data: jsondata,
            dataType: 'json',
            success: function (data) {
                var dfoId = data.d;
                var url = 'SupplierInvoice.aspx';
                var newUrl = url + '?sinId=' + dfoId + '&mode=view';
                document.location.href = newUrl;
            },
            error: function (data) {
            }
        });
    }
    return false;
}

var currentItem = [];
var ScoId = 0;
var BacId = 0;
function LoadSupplierInvoice() {
    var sinId= getUrlVars()['sinId'];
    if (sinId) {
        var url = window.webservicePath + "/LoadSin";
        var datastr = "{itemId:'" + sinId+ "'}";
        $.ajax({
            type: "POST",
            url: url,
            contentType: "application/json; charset=utf-8",
            data: datastr,
            dataType: "json",
            success: function (data) {
                var jsdata = data.d;
                var data2Treat = jQuery.parseJSON(jsdata);
                if (data2Treat !== '-1') {
                    var oneItem = data2Treat;
                    currentItem = [];
                    currentItem = oneItem;
                    ScoId = currentItem.ScoId;
                    BacId = currentItem.BacId;
                    if (currentItem.SodId!==0) {
                        $('#li_sod').show();
                    }
                    $.each(currentItem, function (name, value) {
                        if (name === 'Creator') {
                            setFieldValue('CreatorName', value.FullName, true);
                        } else {
                            if (name === 'SinFile') {
                                if (value !== '' && value !== "" && value !== null) {
                                    var src = "../Common/PageForPDF.aspx?type=6&sinId=" + encodeURIComponent(currentItem.SinFId);
                                    $('#iframepdf').attr('src', src);
                                    $('#btn_delete_cod_file').show();
                                } else {
                                    $('#iframepdf').attr('height', '0');
                                    $('#a_collapse').click();
                                    $('#btn_delete_cod_file').hide();
                                }
                            } 
                            else if (name === 'SinBankReceiptFile') {
                                if (value !== '' && value !== "" && value !== null) {
                                    var src = "../Common/PageForPDF.aspx?type=7&sinId=" + encodeURIComponent(currentItem.SinFId);
                                    $('#iframepdf_bank').attr('src', src);
                                    $('#btn_delete_bank_receipt').show();
                                } else {
                                    $('#iframepdf_bank').attr('height', '0');
                                    $('#a_collapse_bank').click();
                                    $('#btn_delete_bank_receipt').hide();
                                }
                            } 
                            else if (name === 'BacId') {
                                setFieldValue('BankName', value, true);
                            } else if (name === '_DateStartProduction' || name === '_DateCompleteProductionPlanned' ||name === '_DateCompleteProduction') {

                            } else if (name === 'SinDateStartProduction') {
                                setFieldValue('_DateStartProduction', value, true, null, true);
                            } else if (name === 'SinDateCompleteProductionPlanned') {
                                setFieldValue('_DateCompleteProductionPlanned', value, true, null, true);
                            } else if (name === 'SinDateCompleteProduction') {
                                setFieldValue('_DateCompleteProduction', value, true, null, true);
                            } else {
                                setFieldValue(name, value, true);
                            }
                        }
                    });
                    $('#SupId').change();

                    //getSupplierProduct(currentItem.SupId);
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

function delete_click() {
    var title = "ATTENTION";
    var content = "<div class='box'><div class='box-body' style='height: 100px;'>" +
        "<div class='form-horizontal'>" +
        "<div class='col-md-12'>" +
        "<div class='form-group'>" +
        "<div class='col-sm-12' style='text-align:center;font-size: 18pt;'>Veuillez confirmer la suppression ! " +
        "<br/>La suppression de Commande fournisseur est irrécupérable, veuillez confirmer !!!</div></div></div></div></div></div>"
        + "<div class='modal-footer center'>" +
        "<button type='button' class='btn btn-default' onclick='closeDialog()'>Annuler</button>" +
        "<button type='button' class='btn btn-inverse' onclick='return deleteItem();'>SUPPRIMER</button></div>";
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

function deleteItem() {

}

var lineCount = 0;
var currentLineId = 0;

function setAddUpdateLine(oneLine, forUpdateCreate) {
    $('#hf_prd_id').text('');
    $('#hf_pit_id').text('');
    var vatId = 1;
    if (currentItem) {
        vatId = currentItem.VatId;
    }
    var create = oneLine ? false : true;
    var LineId = oneLine ? oneLine.SilId : lineCount;
    lineCount--;
    var LineOrder = oneLine ? oneLine.Order : '1';
    var Description = oneLine ? oneLine.Description : '';
    var PrdId = oneLine ? oneLine.PrdId : '';
    var PrdName = oneLine ? oneLine.PrdName : '';
    var PitId = oneLine ? oneLine.PitId : '';
    var PitName = oneLine ? oneLine.PitName : '';
    var Quantity = oneLine ? oneLine.Quantity : '';
    var PrdImgPath = oneLine ? oneLine.PrdImgPath : '';
    var UnitPrice = oneLine ? oneLine.UnitPrice : '';
    vatId = oneLine ? oneLine.VatId : vatId;
    var DiscountAmount = oneLine ? oneLine.DiscountAmount : '';
    var UnitPriceWithDis = oneLine ? oneLine.UnitPriceWithDis : '';
    var TotalPrice = oneLine ? oneLine.TotalPrice : '';
    var TotalCrudePrice = oneLine ? oneLine.TotalCrudePrice : '';
    var PrdDescription = oneLine ? oneLine.PrdDescription : '';

    if (oneLine) {
        $('#hf_prd_id').text(oneLine.PrdFId);
        $('#hf_pit_id').text(oneLine.PitFId);
    }

    var disabled = false ? " disabled " : "";
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
            "<label class='col-sm-2 control-label'>Ordre</label>" +
            "<div class='col-sm-2'><input type='number' " + disabled + "  value='" + LineOrder + "' lineId='" + LineId + "'class='form-control' id='Order_zzz_' name='Order_zzz_' maxlength='3' /></div>" +
            "<label class='col-sm-2 control-label'>Référence du produit</label>" +
            "<div class='col-sm-2'><input class='form-control' id='PrdId_zzz_' " + disabled + "  name='PrdId_zzz_' value='" + PrdName + "' onkeyup='checkContent(this)' lineId='" + LineId + "' required/></div>" +
            "<label class='col-sm-2 control-label sale'>Référence du sous produit</label>" +
            "<div class='col-sm-2 sale'><select id='PitId_zzz_' name='PitId_zzz_' " + disabled + "  class='form-control' lineId='" + LineId + "' onchange='pitChange(this)' required/></select></div>" +
            "</div>" +
            "<div class='form-group variant'><label class='col-sm-2 control-label'>TVA</label>" +
            "<div class='col-sm-2'><select class='form-control' " + disabled + "   lineId='" + LineId + "'' id='VatId_zzz_' name='VatId_zzz_' onchange='CalCulatePrice(this)'></select></div>" +
            "<label class='col-sm-2 control-label'>Quantité</label>" +
            "<div class='col-sm-2'><input type='number' min='1' " + disabled + "  value='" + Quantity + "' lineId='" + LineId + "'class='form-control' id='Quantity_zzz_' name='Quantity_zzz_' maxlength='3' onkeyup='CalCulatePrice(this)' required/></div>" +
            "<label class='col-sm-2 control-label'>Prix d'achat</label>" +
            "<div class='col-sm-2'><input type='number' step='0.01' class='form-control' lineId='" + LineId + "' id='UnitPrice_zzz_' name='UnitPrice_zzz_' min='0' value='" + UnitPrice + "' onkeyup='CalCulatePrice(this)' required/></div>" +
            "</div>" +
            //remise
            "<div class='form-group variant'>" +
            "<label class='col-sm-2 control-label'>Montant de remise</label>" +
            "<div class='col-sm-2'><input type='number' step='1' " + disabled + "  class='form-control' id='DiscountAmount_zzz_'  lineId='" + LineId + "' field='DiscountAmount' name='DiscountAmount_zzz_' min='0' value='" + DiscountAmount + "' onkeyup='CalCulatePrice(this)'/></div>" +
            "<label class='col-sm-2 control-label'>Prix remisé</label>" +
            "<div class='col-sm-2'><input type='number' step='0.01' " + disabled + "  class='form-control' lineId='" + LineId + "' field='UnitPriceWithDis' id='UnitPriceWithDis_zzz_' name='UnitPriceWithDis_zzz_' min='0' value='" + UnitPriceWithDis + "' onkeyup='CalCulatePrice(this)' disabled/></div>" +
            "</div>" +
            // end remise
            "<div class='form-group  variant'><label class='col-sm-2 control-label'>Total H.T.</label>" +
            "<div class='col-sm-2'><input type='number' disabled='' step='0.01' " + disabled + "  class='form-control' lineId='" + LineId + "' id='TotalPrice_zzz_' name='TotalPrice_zzz_' value='" + TotalPrice + "' /></div>" +
            "<label class='col-sm-2 control-label'>Total T.T.C.</label>" +
            "<div class='col-sm-2'><input type='number' disabled step='0.01' " + disabled + "  class='form-control' lineId='" + LineId + "' id='TotalCrudePrice_zzz_' name='TotalCrudePrice_zzz_' value='" + TotalCrudePrice + "' /></div>" +
            "<div class='col-sm-1'></div><div class='col-sm-3' id='div_prd_image'><!-- image -->" +
            (create ? "" : "<img src='../../Services/ShowOutSiteImage.ashx?file=" + PrdImgPath + "' alt=''   class='img-responsive'  style='width: 100%' />") +
            "</div>" +
            "</div>" +
            "<div class='form-group'>" +
            "<label class='col-sm-2 control-label'>Description de produit</label>" +
            "<div class='col-sm-10'><textarea rows='7' disabled cols='1' lineId='" + LineId + "'  id='PrdDescription_zzz_' value='" + PrdDescription + "' name='PrdDescription_zzz_' class='form-control'></textarea>" +
            "</div></div>" +
            "<div class='form-group'>" +
            "<label class='col-sm-2 control-label'>Description</label>" +
            "<div class='col-sm-10'><textarea rows='3' " + disabled + "  cols='1' lineId='" + LineId + "'  id='Description_zzz_' value='" + Description + "' name='Description_zzz_' class='form-control'></textarea></div></div>" +
            // close box
            "</div></div></div></div></div>";

    var btnAddUpdate = "<button class='btn btn-inverse' lineId='" + LineId + "' id='btn_add_update_line_zzz_' name='btn_add_update_line_zzz_' onclick='return AddUpdateOneLine(this)'><span>" + (!create ? "Mettre à jour" : "Ajouter") + "</span></button>";
    var btnDelete = "<button class='btn btn-inverse' lineId='" + LineId + "' id='btn_delete_line_zzz_' name='btn_delete_line_zzz_' onclick='return delete_Line_Confirm(this)'><span>Supprimer</span></button>";
    var btnClose = "<button class='btn btn-default bootbox-close-button' onclick='return false'><span>Annuler</span></button>";

    var btns = "<div class='modal-body center'>" + btnClose+ (false ? "" : btnAddUpdate)  + "</div>";
    var onecontent = startBox + onelineContent + btns + endBox;
    onecontent = replaceAll(onecontent, '_zzz_', '_' + LineId);
    currentLineId = LineId;

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
    setAutoComplete(LineId);
    setLineTva(LineId, vatId);

    if (!create) {
        //currentLineId
        var subPrdId = '#PitId_' + currentLineId;
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
    }
    if (Description) {
        $('#Description_' + currentLineId).text(Description);
    }
    if (PrdDescription) {
        $('#PrdDescription_' + currentLineId).text(PrdDescription);
    }
    
    if (oneLine) {
        preLoadProductInstance(oneLine.PrdId);
    }
}

function checkContent(sender) {
    if (!$(sender).val()) {
        $('#hf_prd_id').text('');
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
function setAutoComplete(lineId) {
    //var url = window.webservicePath + "/GetProductsByRef";
        var url = window.webservicePath + "/GetProductsByRefWithSupplierId";
    $("#PrdId_" + lineId).autocomplete({
        source: function(request, response) {
            $.ajax({
                url: url,
                data: "{ 'prdRef': '" + request.term + "', 'supId':"+currentItem.SupId+"}",
                dataType: "json",
                type: "POST",
                contentType: "application/json; charset=utf-8",
                success: function(data) {
                    var jsdata = data.d;
                    var data2Treat = jQuery.parseJSON(jsdata);
                    response($.map(data2Treat, function(item) {
                        return {
                            label: item.PrdRef,
                            val: item.FId,
                            datavalue: item.PrdImg,
                        }
                    }));
                },
                error: function(response) {
                    //alert(response.responseText);
                },
                failure: function(response) {
                    //alert(response.responseText);
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
            $('#PitId_zzz_').val('');
            $("#hf_pit_id").text('');

            //currentLineId
            var subPrdId = '#PitId_' + currentLineId;
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

function AddUpdateOneLine(sender) {
    var lineId = $(sender).attr('lineId');
    var PrdId = $('#PrdId_' + lineId);
    var PitId = $('#PitId_' + lineId+' option:selected');
    var Quantity = $('#Quantity_' + lineId);
    var Order= $('#Order_' + lineId);
    var Description = $('#Description_' + lineId);
    var UnitPrice = $('#UnitPrice_' + lineId);
    var DiscountAmount= $('#DiscountAmount_' + lineId);
    var UnitPriceWithDis= $('#UnitPriceWithDis_' + lineId);
    var TotalPrice= $('#TotalPrice_' + lineId);
    var TotalCrudePrice= $('#TotalCrudePrice_' + lineId);
    var PrdDescription = $('#PrdDescription_' + lineId);
    
    var checkOK = true;
    checkOK  = CheckRequiredFieldInOneDiv('div_one_line');
    if (checkOK) {
        var order = Order.val() * 1 + 0;
        var prdId = $('#hf_prd_id').text();
        var pitId = $('#hf_pit_id').text();
        var quantity = Quantity.val().replace(' ', '').replace(',', '.') * 1;
        var discountamount = DiscountAmount.val().replace(' ', '').replace(',', '.') * 1;
        var unitprice = UnitPrice.val().replace(' ', '').replace(',', '.') * 1;
        var unitpricewithdis = UnitPriceWithDis.val().replace(' ', '').replace(',', '.') * 1;
        var totalprice = TotalPrice.val().replace(' ', '').replace(',', '.') * 1;
        var totalcrudeprice = TotalCrudePrice.val().replace(' ', '').replace(',', '.') * 1;

        var description = Description.val();

        var oneline = {};
        oneline.SilId= lineId;
        oneline.SinFId= getUrlVars()['sinId'];
        oneline.Order= order;
        oneline.Description = description;
        oneline.PrdDescription = PrdDescription.val();
        oneline.PrdFId = prdId;
        oneline.PitFId = pitId;
        
        oneline.Quantity = quantity;
        oneline.UnitPrice = unitprice;
        oneline.DiscountAmount = discountamount;
        oneline.UnitPriceWithDis = unitpricewithdis;
        oneline.TotalPrice = totalprice;
        oneline.TotalCrudePrice = totalcrudeprice;
        oneline.VatId = $('#VatId').val();

        var jsondata = JSON.stringify({ oneLine: oneline });
        var url =window.webservicePath + "/InsertUpdateSil";
        $.ajax({
            url: url,
            type: 'POST',
            contentType: 'application/json; charset=utf-8',
            data: jsondata,
            dataType: 'json',
            success: function (data) {
                $('.bootbox-close-button').click();
                loadAllLines();
            },
            error: function (data) {
                //alert(data.responseText);
            }
        });

    }
    return false;
}

function pitChange(sender) {
    $("#hf_pit_id").text($(sender).val());
    var pitId = $(sender).val();
    var clnId = $(sender).attr('lineid');
    var onePit = searchFieldValueInArray(productInstances, 'FId', pitId);
    var propdes = "";
    var PrdName = onePit.PrdName;
    var PrdOutsideDiameter = onePit.PrdOutsideDiameter;
    var PrdLength = onePit.PrdLength;
    var PrdWidth = onePit.PrdWidth;
    var PrdHeight = onePit.PrdHeight;
    var PrdDescription = onePit.PrdDescription;
    var Description = onePit.Description;
    //var diameterExt = ontPit.
    $.each(onePit.PitAllInfo, function(order, propvalue) {
        if (propvalue.PropValue) {
            propdes += propvalue.PropName + ": " + propvalue.PropValue + " " + propvalue.PropUnit + "\r\n";
        }
    });
    var additionnalInfo = "";
    if (PrdOutsideDiameter) {
        additionnalInfo += "Diamètre extérieur : " + PrdOutsideDiameter + " mm\r\n";
    }
    if (PrdLength) {
        additionnalInfo += "Longueur : " + PrdLength + " mm\r\n";
    }
    if (PrdWidth) {
        additionnalInfo += "Largeur : " + PrdWidth + " mm\r\n";
    }
    if (PrdHeight) {
        additionnalInfo += "Hauteur : " + PrdHeight + " mm";
    }
    var alldes = PrdName + "\r\n" + propdes.trim() +"\r\n" + additionnalInfo.trim();
    $('#PrdDescription_' + clnId).text(alldes);
}

function setLineTva(lineId, vatId) {
    if (allTVA) {
        var budgetId = '#VatId_' + lineId;
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

var allTVA = [];
function getAllTVA() {
    var url = window.webservicePath + "/GetAllTVA";
    var budgetId = '#VatId';
    $.ajax({
        type: "POST",
        url: url,
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        success: function (data) {
            var jsdata = data.d;
            var data2Treat = jQuery.parseJSON(jsdata);
            if (data2Treat !== '-1') {
                allTVA = [];
                allTVA = data2Treat;
                $(budgetId).empty();
                $.each(data2Treat, function (name, value) {
                    $(budgetId)
                        .append($("<option></option>")
                            .attr("value", value.Key)
                            .text(value.Value));
                });
            } else {
                AuthencationError();
            }
        },
        error: function (data) {
            var test = '';
        }
    });
}

function CalCulatePrice(sender) {
    var lineId = $(sender).attr('lineId');
    var field = $(sender).attr('field');
    var tva = $('#VatId_' + lineId + '  option:selected');
    var quantity = $('#Quantity_' + lineId).val() * 1;
    var unitprice = $('#UnitPrice_' + lineId).val() * 1;
    var disAmount= $('#DiscountAmount_' + lineId).val() * 1;
    var disPrice = $('#UnitPriceWithDis_' + lineId).val() * 1;
    //var purcharsePrice = $('#PurchasePrice_'+ lineId).val() * 1;
    var totalHT = $('#TotalPrice_' + lineId);
    var totalTTC = $('#TotalCrudePrice_' + lineId);
    var tva_value = tva.attr('data-value') * 1;
    disPrice = unitprice - disAmount;
    var _total_ht = quantity * disPrice;
    var _total_ttc = _total_ht * (1 + tva_value / 100);
    _total_ht = _total_ht.toFixed(2);
    _total_ttc = _total_ttc.toFixed(2);

    totalHT.val(_total_ht);
    totalTTC.val(_total_ttc);
    $('#UnitPriceWithDis_' + lineId).val(disPrice.toFixed(2));
}

var itemLines = [];
function loadAllLines() {
    var entityId = getUrlVars()['sinId'];
    var url = window.webservicePath + "/LoadSils";
    $.ajax({
        url: url,
        type: 'POST',
        contentType: 'application/json; charset=utf-8',
        data: "{sinId:'" + entityId + "'}",
        dataType: 'json',
        success: function(data) {
            var jsdata = data.d;
            var jsondata = jQuery.parseJSON(jsdata);
            if (jsondata !== '-1') {
                itemLines = [];
                itemLines = jsondata;
                if (itemLines.length > 0) {
                    $('#btn_generate_pdf').show();
                    $("#btn_validate_costplan").show();
                } else {
                    $('#btn_generate_pdf').hide();
                    $("#btn_validate_costplan").hide();
                }
                var linecount = 1;
                $('#tbody_lines').empty();
                $.each(jsondata, function(name, value) {
                    var lineclass = (linecount % 2 === 1) ? "odd" : "even";
                    var prdname = value.PrdName;
                    var pitname = value.PitName;
                    var quantity = value.Quantity;
                    var description = replaceAll(value.PrdDescription, '\n', '</br>') + '</br>---------------------------</br>' +  replaceAll(value.Description, '\n', '</br>');

                    var itemId = value.SilId;

                    var oneline = "<tr class='" + lineclass + "'>" +
                        "<td class='label_left' style='cursor: pointer;' itemId='" + itemId + "'  onclick='return modify_line_click(this)'>" + value.Order + "</td>" +
                        "<td class='label_left'>" + prdname + "</td>" +
                        "<td class='label_left'>" + pitname + "</td>" +
                        "<td class='label_left'>" + description + "</td>" +
                        "<td>" + (value.PrdImgPath ? ("<img src='../../Services/ShowOutSiteImage.ashx?file=" + value.PrdImgPath + "' height='40' width='40' />") : "") + "</td>" +
                        "<td class='label_right'>" + quantity + "</td>" +
                        "<td class='label_right'>" + value.UnitPrice + "</td>" +
                        "<td class='label_right'>" + value.UnitPriceWithDis + "</td>" +
                        "<td class='label_right'>" + value.TotalPrice + "</td>" +
                        "<td class='label_right'>" + value.TotalCrudePrice + "</td>";

                    var btns = "<td>" +
                        "<button class='btn btn-inverse' title='Modifier' id='" + itemId  + "' itemId='" +itemId  + "' onclick='return modify_line_click(this)'><i class='fa fa-edit'></i></button>" +
                        "<button class='btn btn-inverse' title='Supprimer' id='" + itemId + "' itemId='" + itemId  + "' onclick='return delete_Line_Confirm(this)'><i class='fa fa-times'></i></button>" +
                        "</td>";

                    var endline = "</tr>";

                    oneline += (false ? "" : btns) + endline;

                    linecount ++;
                    $('#tbody_lines').append(oneline);
                });
                //$('#tbody_lines')
            } else {
            }
        },
        error: function(data) {
        }
    });
}

function modify_line_click(sender) {
    var itemId= $(sender).attr('itemId') * 1;
    var oneCln = searchFieldValueInArray(itemLines,'SilId',itemId);
    if (oneCln) {
        setAddUpdateLine(oneCln);
    }
    return false;
}

function delete_Line_Confirm(sender) {
    var itemId = $(sender).attr('itemId');
    var title = "ATTENTION";
    var content = "<div class='box'><div class='box-body' style='height: 100px;'>" +
        "<div class='form-horizontal'>" +
        "<div class='col-md-12'>" +
        "<div class='form-group'>" +
        "<div class='col-sm-12' style='text-align:center;font-size: 18pt;'>Veuillez confirmer la suppression ! " +
        "<br/>La suppression est irrécupérable, veuillez confirmer !!!</div></div></div></div></div></div>"
        + "<div class='modal-footer center'>" +
        "<button type='button' class='btn btn-default' onclick='closeDialog()'>Annuler</button>" +
        "<button type='button' class='btn btn-inverse' itemId='" + itemId + "' onclick='return delete_line(this);'>SUPPRIMER</button></div>";
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
    return false;
}

function delete_line(sender) {
    var itemId = $(sender).attr('itemId') * 1;
    var sinId= getUrlVars()['sinId'];
    var url = window.webservicePath + "/DeleteSil";
    $.ajax({
        type: "POST",
        url: url,
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        data: "{sinId:'" + sinId+ "',silId:" + itemId + "}",
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

function uploadFile(type) {
    var title = "Télécharger un fichier";
    try {
        var bankFile = (type === 7) ? "<span style='color:red; font-size:18pt;'>Le téléchargement de preuve de virement va changer le statut de paiement à 'PAYÉ'</span><br/><br/>" : "";
        var content = "<div class='box'><div class='box-body' style='overflow-y:auto;overflow-x:hidden;'>" +
            "<form enctype='multipart/form-data'>" +
            "<div class='col-md-12'>" +
            // this div is for album photo
            "<div class='row' style='margin-bottom: 20px;'><div class='col-md-12' id='div_album_photo' style='text-align:center;'>" +
            "</div>" +
            // cancel and save buttons
            "</div>" +
            "</div>" +
            // this content contains upload photo
            "<div class='row' id='div_upload_photo'><div class='col-md-12' style='text-align: center;'>" +
            bankFile +
            "<span class='btn btn-inverse fileinput-button'>" +
            "<i class='fa fa-plus'></i>" +
            "<span>Ajouter</span>" +
            "<input type='file' id='iptUploadFilePopUp' name='files[]' accept='application/pdf' onchange='getFileDataPopUp(this);'></span>" +
            "<button type='button' class='btn btn-inverse start' style='display: none;' id='btnSubmitUploadFilePopUp' onclick='return uploadFileClick(" + type + ")'><i class='fa fa-arrow-circle-o-up'></i><span>Télécharger</span></button>" +
            "<button type='reset' class='btn btn-inverse cancel'  style='display: none;' id='btnCancelUploadFilePopUp' onclick='return hideUploadPopUp()'><i class='fa fa-ban'></i><span>Annuler</span></button>" +
            "<button class='btn btn-default bootbox-close-button' style='display:none;' onclick='return false'><span>Annuler</span></button></div> <!-- The global progress information -->" +
            "<div class='col-md-12' style='text-align: center; margin-bottom: 20px;'>" +
            "<div>File Name : <span id='uploadFileNamePopUp'></span></div><br/>" +
            "</div></div></form>" +
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
        'background': 'url(../../img/menu_005_bg.jpg) repeat-x',
        'text-align': 'center',
        'color': '#C0C0C0'
        });

    } catch (e) {
    }
    return false;
}

function uploadFileClick(type) {
    var formData = new FormData();
    formData.append('file', $('#iptUploadFilePopUp')[0].files[0]);
    var itemId = getUrlVars()['sinId'];
    var url = "../../Services/UploadFilesGeneral.ashx?type=" + type + "&sinId=" + encodeURIComponent(itemId);
    if (itemId) {
        ///AJAX request
        $.ajax(
        {
            ///server script to process data
            url: url, //web service
            type: 'POST',
            complete: function() {
                //on complete event     
            },
            progress: function(evt) {
                //progress event    
            },
            ///Ajax events
            beforeSend: function(e) {
                //before event  
            },
            success: function(e) {
                //success event
                $('.bootbox-close-button').click();
                var src = "../Common/PageForPDF.aspx?type=" + type + "&sinId=" + encodeURIComponent(itemId);
                if (type === 6) {
                    $('#iframepdf').attr('height', '1000');
                    $('#iframepdf').attr('src', src);
                    $('#btn_delete_cod_file').show();
                    if ($('#a_collapse').attr('class') === "expand") {
                        $('#a_collapse').click();
                    }
                }else if (type === 7) {
                    $('#iframepdf_bank').attr('height', '1000');
                    $('#iframepdf_bank').attr('src', src);
                    $('#btn_delete_bank_receipt').show();
                    if ($('#a_collapse_bank').attr('class') === "expand") {
                        $('#a_collapse_bank').click();
                    }
                    $('#SinIsPaid').prop('checked', true);
                }


            },
            error: function(e) {
                //errorHandler
            },
            ///Form data
            data: formData,
            ///Options to tell JQuery not to process data or worry about content-type
            cache: false,
            contentType: false,
            processData: false
        });
        ///end AJAX request
    }
}

function delete_file_click(type) {
    var title = "ATTENTION";
    var content = "<div class='box'><div class='box-body' style='height: 100px;'>" +
        "<div class='form-horizontal'>" +
        "<div class='col-md-12'>" +
        "<div class='form-group'>" +
        "<div class='col-sm-12' style='text-align:center;font-size: 18pt;'>Veuillez confirmer la suppression ! " +
        "<br/>La suppression de fichier est irrécupérable, veuillez confirmer !!!</div></div></div></div></div></div>"
        + "<div class='modal-footer center'>" +
        "<button type='button' class='btn btn-default' onclick='closeDialog()'>Annuler</button>" +
        "<button type='button' class='btn btn-inverse' onclick='return deleteFile(" + type + ");'>SUPPRIMER</button></div>";
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
    return false;
}

function deleteFile(type) {
    var sinId= getUrlVars()['sinId'];
    var url = window.webservicePath + "/DeleteSinFile";
    $.ajax({
        type: "POST",
        url: url,
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        data: "{sinId:'" + sinId+ "',type:"+type+"}",
        success: function (data) {
            if (type === 6) {
                $('#iframepdf').attr('height', '0');
                if ($('#a_collapse').attr('class') !== "expand") {
                    $('#a_collapse').click();
                }
                $('#btn_delete_cod_file').hide();
            }
            else if (type === 7) {
                $('#iframepdf_bank').attr('height', '0');
                if ($('#a_collapse_bank').attr('class') !== "expand") {
                    $('#a_collapse_bank').click();
                }
                $('#btn_delete_bank_receipt').hide();
            }
        },
        error: function (data) {
            var test = '';
        }
    });
}

var allBankInfo = [];

function loadAllBankInfo(supId) {
    //var supId = getUrlVars()['supId'];
    $('#BankName').empty();
    if (supId) {
        var url = window.webservicePath + "/GetBankAccountInfo";
        var datastr = "{type:2,fId:'" + supId + "'}";
        $.ajax({
            type: "POST",
            url: url,
            contentType: "application/json; charset=utf-8",
            dataType: "json",
            data: datastr,
            success: function(data) {
                var jsdata = data.d;
                var data2Treat = jQuery.parseJSON(jsdata);
                if (data2Treat !== '-1') {
                    allBankInfo = [];
                    allBankInfo = data2Treat;
                    $.each(allBankInfo, function(name, value) {
                        //$('#BankName').
                        if (BacId && BacId === value.Id) {
                            $('#BankName').append($("<option></option>").attr("value", value.Id).attr("selected", true).text(value.BankName));
                        } else {
                            $('#BankName').append($("<option></option>").attr("value", value.Id).text(value.BankName));
                        }
                    });
                    $('#BankName').change();
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

function BankInfoChange(sender) {
    var bacId = $(sender).val() * 1;
    var bacInfo = searchFieldValueInArray(allBankInfo, 'Id', bacId);
    var isempty = jQuery.isEmptyObject(bacInfo);
    var BankName = isempty ? '' : bacInfo.BankName;
    var BankAdr = isempty ? '' : bacInfo.BankAdr;
    var AccountNumber = isempty ? '' : bacInfo.AccountNumber;
    var Bic = isempty ? '' : bacInfo.Bic;
    var Iban = isempty ? '' : bacInfo.Iban;
    var RibBankCode = isempty ? '' : bacInfo.RibBankCode;
    var RibAgenceCode = isempty ? '' : bacInfo.RibAgenceCode;
    var RibAccountNumber = isempty ? '' : bacInfo.RibAccountNumber;
    var RibKey = isempty ? '' : bacInfo.RibKey;
    var AccountOwner = isempty ? '' : bacInfo.AccountOwner;
    var RibAgencyAdr = isempty ? '' : bacInfo.RibAgencyAdr;
    //$('#BankName').val(BankName);
    $('#BankAdr').val(BankAdr);
    $('#AccountNumber').val(AccountNumber);
    $('#Bic').val(Bic);
    $('#Iban').val(Iban);
    $('#RibBankCode').val(RibBankCode);
    $('#RibAgenceCode').val(RibAgenceCode);
    $('#RibAccountNumber').val(RibAccountNumber);
    $('#RibKey').val(RibKey);
    $('#AccountOwner').val(AccountOwner);
    $('#RibAgencyAdr').val(RibAgencyAdr);
}

function goSod() {
    var sodId = currentItem.SodFId;
    myApp.showPleaseWait();
    var url = '../SupplierOrder/SupplierOrder.aspx?sodId=' + sodId + "&mode=view";
    window.location.href = url;
}

///set clickable lable for externe link
function setClickableLabel() {
    if (_isView) {
        $("#lb_supplier").addClass("animated_menu");
        $("#lb_supplier").prop('title', 'Cliquer pour consulter le fournisseur');
        $('#lb_supplier').css('cursor', 'pointer');
    }
}

function ExternLinkClick(sender) {
    if (_isView && currentItem) {
        ExternLinkBaseClick(sender, currentItem);
    }
}

//var supplierProducts = [];
//function getSupplierProduct(supId) {
//    var url = window.webservicePath + "/GetProductsBySupplierId";
//        $('#ScoId').empty();
//        $.ajax({
//            type: "POST",
//            url: url,
//            contentType: "application/json; charset=utf-8",
//            data: "{supId:'" + supId + "'}",
//            dataType: "json",
//            success: function (data) {
//                var jsdata = data.d;
//                var data2Treat = jQuery.parseJSON(jsdata);
//                if (data2Treat !== '-1') {
//                    if (data2Treat.length > 0) {
//                        supplierProducts = [];
//                        supplierProducts = data2Treat;
//                    }
//                } else {
//                    // authentication error
//                    AuthencationError();
//                }
//            },
//            error: function (data) {
//                var test = '';
//            }
//        });
//}