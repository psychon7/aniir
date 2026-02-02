$(document).ready(initAll);

function initAll() {
    ShowPleaseWait();
    $.each($('.datepicker'), function(idx, value) {
        $(value).datepicker();
    });
    var loadLgs = (_isView || _isModify);
    setEachBorder();
    LoadSupplier(loadLgs);
    initMode();
    setClickableLabel();
    if (_isCreate) {
        $('#DateCreation').val(getToday());
    }
    if (_isView) {
        getShelvesList();
        loadDocInfo();
    }
    HidePleaseWait();
}

var allSupplier = [];
function LoadSupplier(loadLgs) {
    var url = window.webservicePath + "/GetAllTransporter";
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
                $(budgetId).append($("<option></option>").attr("data-value", "0").attr("value", "0").text("Veuillez sélectionner un transporteur"));
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
                if (loadLgs) {
                    LoadLgs();
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

var currentLgs = {};
function LoadLgs() {
    var lgsId = getUrlVars()['lgsId'];
    if (lgsId) {
        ShowPleaseWait();
        var url = window.webservicePath + "/LoadLgs";
        var datastr = "{lgsId:'" + lgsId + "'}";
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
                    var oneCpl = data2Treat;
                    currentLgs = {};
                    currentLgs = oneCpl;
                    $.each(oneCpl, function(name, value) {
                        //console.info(order);   
                        var newname = name;
                        var setThisvalue = true;
                        if (name.indexOf('_') === 0) {
                            setThisvalue = false;
                        }
                        if (name === 'LgsDateSend') {
                            newname = '_LgsDateSend';
                        }
                        if (name === 'LgsDateArrivePre') {
                            newname = '_LgsDateArrivePre';
                        }
                        if (name === 'CplDateValidity') {
                            newname = '_dValidityString';
                        }
                        if (name === 'LgsDateArrive') {
                            newname = '_LgsDateArrive';
                        }
                        if (name === 'Creator') {
                            newname = 'CreatorName';
                            value = value.FullName;
                        }
                        if (setThisvalue) {
                            setFieldValue(newname, value, true);
                        }
                    });
                    if (currentLgs.LgsIsSent) {
                        //$('.btn').hide();
                        $('#btn_add_to_container').hide();
                        $('#btn_delete_lgs').hide();
                    } else {
                        $('#btn_send_container').show();
                    }
                    if (currentLgs.LgsIsSent && !currentLgs.LgsIsReceived) {
                        $('#btn_receiveContainer').show();
                        if (_isView) {
                            getWareHouseList();
                        }
                    }
                    // hide all button except pdf
                    if (currentLgs.LgsIsReceived) {
                        $('.btn').hide();
                        $('#btn_generate_pdf').show();
                        $('#btn_generate_file_pdf').show();
                    }

                    if (currentLgs.SodId === 0) {
                        $('#btn_asso_sod').show();
                        $('#btn_view_sod').hide();
                        $('#btn_remove_asso_sod').hide();
                        $('#btn_view_sod').attr('sodId','');
                    } else {
                        $('#btn_view_sod').show();
                        $('#btn_asso_sod').hide();
                        $('#btn_remove_asso_sod').show();
                        $('#btn_view_sod').attr('sodId',currentLgs.SodFId);
                        $('#btn_view_sod').text(currentLgs.SodCode);
                    }

                    //btn_asso_sod

                    // set consignee
                    try {
                        SetSelectedCon(currentLgs.Consignee);
                    } catch (e) {} 
                    if (_isView) {
                        LoadAllLines();
                    }
                    HidePleaseWait();
                } else {
                    // authentication error
                    AuthencationError();
                    HidePleaseWait();
                }
            },
            error: function(data) {
                var test = '';
                    HidePleaseWait();
            }
        });
    }
}

// 设置信息框的宽度
function setEachBorder() {
    if (_isView) {
        $('#sod_generalinfo').removeClass('col-md-7');
        $('#div_delivery_address').removeClass('col-md-5');
        $('#div_general_info').addClass('col-md-5');
        $('#div_consigne').addClass('col-md-4');
    } else {
//        $('#sod_generalinfo').removeClass('col-md-7');
//        $('#div_delivery_address').removeClass('col-md-5');
//        $('#div_general_info').addClass('col-md-5');
//        $('#div_consigne').addClass('col-md-4');
    }
}

function js_create_update_lgs() {
    ShowPleaseWait();
    var checkOK = CheckRequiredFieldInOneDiv('content');
    var lgsId = getUrlVars()['lgsId'];
    //ConSelectedId is in consignee
    if (checkOK && ConSelectedId != 0) {
        var item = {};
        item.LgsName = $('#LgsName').val();
        item.SupFId = $('#SupId').find('option:selected').attr('data-value');
        item._LgsDateSend = $('#_LgsDateSend').val();
        item._LgsDateArrivePre = $('#_LgsDateArrivePre').val();
        item._LgsDateArrive = $('#_LgsDateArrive').val();
        item.LgsIsSent = $('#LgsIsSent').is(':checked');
        item.LgsComment = $('#LgsComment').val();
        item.LgsTrackingNumber = $('#LgsTrackingNumber').val();
        item.LgsComment = $('#LgsComment').val();
        item.LgsIsReceived = $('#LgsIsReceived').is(':checked');
        item.FId = lgsId;
        item.DateCreation = getCreationDate($('#DateCreation').val());
        item.ConId = ConSelectedId;
        var jsondata = JSON.stringify({ oneLgs: item });
        $.ajax({
            url: 'Logistics.aspx/CreateUpdateLgs',
            type: 'POST',
            contentType: 'application/json; charset=utf-8',
            data: jsondata,
            dataType: 'json',
            success: function(data) {
                var cplId = data.d;
                var url = 'Logistics.aspx';
                var newUrl = url + '?lgsId=' + cplId + '&mode=view';
                document.location.href = newUrl;
            },
            error: function(data) {
                HidePleaseWait();
            }
        });
    } else {
        if (ConSelectedId == 0) {
            alert('Sélectionner un destinataire!<br/>请选择一个收件人！');
            setTimeout(function() { $('#dialog_ok2').click(); }, 800);
        }
        HidePleaseWait();
    }
}

var addNewLineBtn = "<div class='col-sm-2 center' id='div_add_lgl_line'><button class='btn btn-inverse' id='btn_add_lgl_line' name='btn_add_lgl_line' onclick='AddNewLglLine(0)'><span>Ajouter une linge</span></button></div>";
//var selectFromSinDiv = "<div class='col-sm-4 center' id='div_select_from_sin'><select class='form-control' id='select_from_sin' onchange='sod_changed(this)'><option data-value='0' value='0'>Sélectionner une PI</option></select></div>";
var selectFromSinDiv = "<div class='col-sm-4 center' id='div_select_from_sin'><input class='form-control' id='select_from_sin' /></div>";

function addToContainer(oneLgl) {
    var newLgl = jQuery.isEmptyObject(oneLgl);
    if (newLgl) {
        oneLgl = {};
        oneLgl.Id = 0;
        oneLgl.SolId = 0;
        oneLgl.LglGuid = NewGuid();
        oneLgl.LglQuantity = 0;
        oneLgl.LglUnitPrice = 0;
        oneLgl.TotalPrice = 0;
        oneLgl.ProductName = '';
        oneLgl.ProductRef = '';
        oneLgl.LglDescription = '';
        oneLgl.PrdId = 0;
        oneLgl.PitId = 0;
    }
    var fromSin = oneLgl.SolId !== 0 ? "checked='checked' " : "";

    var startBox = "<div class='box'><div class='box-body'>";
    var endBox = "</div></div>";
    var onelineContent =
    // start box
        "<div class='form-group' id='div_one_line'>" +
            "<div class='row'>" +
            "<div class='col-md-12'>" +
            "<div class='box-body'>" +
            "<div class='form-horizontal'>" +
            "<div class='form-group' id='lgl_type_line'>" +
            "<label class='col-sm-2 control-label'>Sélectionner dans une SO</label>" +
            "<div class='col-sm-2'><input type='checkbox' id='selectFromSin ' class='form-control' name='selectFromSin' " + fromSin + " onclick='SelectFromSin(this)' /></div>" +
            (newLgl ? addNewLineBtn : "") +
            "</div>" +
            "<label class='col-sm-12 control-label'>Mettre -1 dans la quantité pour enlever cette ligne. 在数量设为-1，该行将不会被添加</label>"+
            "<div id='lgl_all_lines' style='width: 100%; overflow-x: auto; max-height:500px;'>" +
            "</div>" +
    // close box
            "</div></div></div></div></div>";

    var btnAddUpdate = "<button class='btn btn-inverse' id='btn_add_update_discount' name='btn_add_update_discount' onclick='return SaveLglLines()'><span>Sauvegarder</span></button>";
    var btnClose = "<button class='btn btn-default bootbox-close-button' onclick='return false'><span>Annuler</span></button>";

    var btns = "<div class='modal-body center'>" + btnClose + btnAddUpdate + "</div>";
    var onecontent = startBox + onelineContent + btns + endBox;

    var title = 'Ajouter dans cet envoie/添加进该物流';
    bootbox.dialog({
        title: title,
        message: onecontent
    }).find('.modal-dialog').css({
        'width': '80%'
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
    return false;
}

var SupplierInvoiceLines = [];
function GetSil2Delivery() {
    var url = window.webservicePath + "/GetSin2Delivery";
    var lgsId = getUrlVars()['lgsId'];
    if (SupplierInvoiceLines.length === 0) {
        ShowPleaseWait();
        $.ajax({
            type: "POST",
            url: url,
            contentType: "application/json; charset=utf-8",
            dataType: "json",
            data: "{lgsId: '" + lgsId + "'}",
            success: function(data) {
                var jsdata = data.d;
                var data2Treat = jQuery.parseJSON(jsdata);
                if (data2Treat !== '-1') {
                    SupplierInvoiceLines = [];
                    SupplierInvoiceLines = data2Treat;
                    $.each(SupplierInvoiceLines, function(name, value) {
                        $('#select_from_sin').append($("<option></option>").attr("value", value.SodId).text(value.SodCode + " | " + value.SodName + " | " + value.Supplier));
                    });
                    HidePleaseWait();
                } else {
                    // authentication error
                    AuthencationError();
                    HidePleaseWait();
                }
            },
            error: function(data) {
                var test = '';
                HidePleaseWait();
            }
        });
    } else {
        $.each(SupplierInvoiceLines, function (name, value) {
            $('#select_from_sin').append($("<option></option>").attr("value", value.SodId).text(value.SodCode));
        });

    }
}

var selectedSodId = 0;

function GetAutoSodByKeyword() {
    var url = window.webservicePath + "/GetSodByKeywordSimple";
    $('#lgl_all_lines').empty();
    $("#select_from_sin").autocomplete({
        source: function(request, response) {
            selectedSodId = 0;
            $.ajax({
                url: url,
                data: "{ 'keyword': '" + request.term + "'}",
                dataType: "json",
                type: "POST",
                contentType: "application/json; charset=utf-8",
                success: function(data) {
                    selectedSodId = 0;
                    var jsdata = data.d;
                    var data2Treat = jQuery.parseJSON(jsdata);
                    $('#lgl_all_lines').empty();
                    SupplierInvoiceLines = [];
                    SupplierInvoiceLines = data2Treat;
                    if (data2Treat.length > 0) {
                        response($.map(data2Treat, function(item) {
                            return {
                                label: item.SodCode + " | " + item.OneSupplier.CompanyName,
                                val: item.SodId,
                            }
                        }));
                    } else {
                    }
                },
                error: function(response) {
//                    alert(response.responseText);
                    //console.log(response);
                },
                failure: function(response) {
                    alert(response.responseText);
                }
            });
        },
        select: function(e, i) {
            selectedSodId = i.item.val * 1;
            //console.log(selectedSodId);
            if (selectedSodId !== 0) {
                var oneSin = searchFieldValueInArray(SupplierInvoiceLines, 'SodId', selectedSodId);
                if (!jQuery.isEmptyObject(oneSin)) {
                    $('#lgl_all_lines').empty();
                    $.each(oneSin.PurchaseLines, function(name, value) {
                        AddNewLglLine(0, value);
                    });
                }
            } else {
                $('#lgl_all_lines').empty();
            }
        },
        minLength: 2
    });
}

function AddNewLglLine(oneLgl, oneSil) {
    var newLgl = jQuery.isEmptyObject(oneLgl);
    //console.log(oneSil);
    var hasValue = false;
    if (newLgl && jQuery.isEmptyObject(oneSil)) {
        oneLgl = {};
        oneLgl.Id = 0;
        oneLgl.SolId = 0;
        oneLgl.LglGuid = NewGuid();
        oneLgl.LglUnitPrice = 0;
        oneLgl.TotalPrice = 0;
        oneLgl.ProductName = '';
        oneLgl.ProductRef = '';
        oneLgl.LglDescription = '';
        oneLgl.PrdId = 0;
        oneLgl.PitId = 0;
        oneLgl.LglQuantityTotal = 0;
        oneLgl.LglQuantity = 1;
        oneLgl.LglQuantityDeliveried = 0;

    } else if (!jQuery.isEmptyObject(oneSil)) {
        hasValue = true;
        oneLgl = {};
        oneLgl.Id = oneSil.LglId;
        oneLgl.SolId = oneSil.SolId;
        oneLgl.LglGuid = NewGuid();
        oneLgl.LglUnitPrice = oneSil.UnitPrice;
        oneLgl.TotalPrice = oneSil.TotalPrice;
        oneLgl.ProductName = oneSil.PrdName;
        oneLgl.ProductRef = oneSil.PitName;
        //oneLgl.LglDescription = oneSil.Description;
        oneLgl.LglDescription = oneSil.Description;
        oneLgl.PrdId = oneSil.PrdId;
        oneLgl.PitId = oneSil.PitId;
        oneLgl.LglQuantityDeliveried = oneSil.DeliveriedQuantity;
        oneLgl.LglQuantityTotal = oneSil.Quantity;
        oneLgl.LglQuantity = oneSil.QuantityForLgl;
        oneLgl.PrdDescription = oneSil.PrdDescription;
    }
    oneLgl.LglQuantity = oneLgl.LglQuantityTotal - oneLgl.LglQuantityDeliveried;

    var disabled = oneLgl.SolId !== 0 ? " disabled " : "";
    var display = oneLgl.SolId === 0 ? " style='display:none;'" : "";
    var newline = "<div class='form-group' id='one_lgl_lglguid'  SolId=" + oneLgl.SolId + " style='border-bottom-style: solid;border-bottom-width:1px; border-bottom-color: black; padding: 0px 0px 5px 0px;'>" +
        "<label class='col-sm-2 control-label'>Réf de produit</label>" +
        "<div class='col-md-2'>" +
        "<input  class='form-control' type='text' id='ProductName_lglguid' name='ProductName_lglguid' value='" + oneLgl.ProductName + "' " + disabled + " SolId='" + oneLgl.SolId + "' PrdId='" + oneLgl.PrdId + "' PitId='" + oneLgl.PitId + "' lglid='" + oneLgl.Id + "' />" +
        "</div>" +
        "<label class='col-sm-2 control-label'>Réf de sous prd</label>" +
        "<div class='col-md-2'>" +
        "<select class='form-control' id='ProductRef_lglguid' name='ProductRef_lglguid' value='" + oneLgl.ProductRef + "'  " + disabled + "  SolId='" + oneLgl.SolId + "' guid=" + oneLgl.LglGuid + " onchange='ProductRefChange(this)' ></select>" +
        "</div>" +
        "<label class='col-sm-2 control-label'>Description de la livraison</label>" +
        "<div class='col-md-2'>" +
        "<input class='form-control' type='text' id='LglDescription_lglguid' name='LglDescription_lglguid' value='' SolId='" + oneLgl.SolId + "'  />" +
        "</div>" +
        "<label class='col-sm-2 control-label' " + display + ">Quantité Total</label>" +
        "<div class='col-md-2' " + display + ">" +
        "<input class='form-control' type='number' step='1' min='0' id='LglQuantityTotal_lglguid' name='LglQuantityTotal_lglguid' value='" + oneLgl.LglQuantityTotal + "'  SolId='" + oneLgl.SolId + "'  " + disabled + " />" +
        "</div>" +
        "<label class='col-sm-2 control-label' " + display + ">Quantité livrée/stcoké</label>" +
        "<div class='col-md-2' " + display + ">" +
        "<input class='form-control' type='number' step='1' min='0' id='LglQuantityDeliveried_lglguid' name='LglQuantityDeliveried_lglguid' value='" + oneLgl.LglQuantityDeliveried + "' SolId='" + oneLgl.SolId + "' " + disabled + " />" +
        "</div>" +
        "<label class='col-sm-2 control-label'>Quantité à livrer</label>" +
        "<div class='col-md-2'><input class='form-control' type='number' step='1' min='0' id='LglQuantity_lglguid' name='LglQuantity_lglguid' value='" + oneLgl.LglQuantity + "'  SolId='" + oneLgl.SolId + "' /></div>" +
        "<label class='col-sm-2 control-label'>Description de produit</label>" +
        "<div class='col-md-6'><textarea class='form-control' type='number' rows='4' disabled id='LglPrdDes_lglguid' name='LglPrdDes_lglguid' SolId='" + oneLgl.SolId + "' ></textarea></div>" +
        "</div>";
    newline = replaceAll(newline, 'lglguid', oneLgl.LglGuid);

    $('#lgl_all_lines').append(newline);

    if (!hasValue) {
        setAutoCompletePrd(oneLgl.LglGuid);
    } else {
        $('#ProductRef_' + oneLgl.LglGuid).append($("<option></option>").attr("value", oneLgl.PitId).attr("data-value", oneLgl.PitId).attr("data-price", "0").text(oneLgl.ProductRef));
    }


    // description
    var desPrd = (oneLgl.PrdDescription == "" || oneLgl.PrdDescription == '' || oneLgl.PrdDescription == null) ?
        '' : oneLgl.PrdDescription;
    //desPrd = replaceAll(desPrd, '\n', '</br>');
    var newlinesyb = (desPrd != '' ? '\r\n---------------------------\r\n' : '');
    var description = desPrd + newlinesyb + oneLgl.LglDescription;
    description = (description == "" || description == '' || description == null) ?
        '' : description;
    //description = replaceAll(description, '\n', '</br>');
    var infocompl = description;
    // description

    if (infocompl) {
        $('#LglPrdDes_' + oneLgl.LglGuid).text(infocompl);
    }

    return false;
}

function ProductRefChange(sender) {
    var pitId = $(sender).val();
    var SolId = $(sender).attr('guid');
    var onePit = searchFieldValueInArray(productInstances, 'FId', pitId);

    var PrdName = onePit.PrdName;
    var PrdOutsideDiameter = onePit.PrdOutsideDiameter;
    var PrdLength = onePit.PrdLength;
    var PrdWidth = onePit.PrdWidth;
    var PrdHeight = onePit.PrdHeight;
    //var PrdDescription = onePit.PrdDescription;
    var Description = onePit.Description;
    //var diameterExt = ontPit.

    var propdes = "";
    $.each(onePit.PitAllInfo, function(order, propvalue) {
        if (propvalue.PropValue) {
            propdes += propvalue.PropName + " : " + propvalue.PropValue + " " + propvalue.PropUnit + "\r\n";
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
    $('#LglPrdDes_' + SolId).text(alldes);
}

function SelectFromSin(sender) {
    var fromSin = $(sender).is(':checked');
    if (fromSin) {
        $('#div_add_lgl_line').remove();
        $('#lgl_type_line').append(selectFromSinDiv);
        $('#lgl_all_lines').empty();
        GetAutoSodByKeyword();
        //GetSil2Delivery();
    } else {
        $('#div_select_from_sin').remove();
        $('#lgl_type_line').append(addNewLineBtn);
        $('#lgl_all_lines').empty();
    }
}

var productInstances = [];
function setAutoCompletePrd(lglguid) {
    var url = window.webservicePath + "/GetProductsByRef";
    $("#ProductName_" + lglguid).autocomplete({
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

                    var subPrdId = '#ProductRef_' + lglguid;
                    $(subPrdId).empty();
                    $(subPrdId).append($("<option></option>").attr("value", "0").attr("data-value", "0").attr("data-price", "0").text("Aucun produit"));

                    response($.map(data2Treat, function(item) {
                        return {
                            label: item.PrdRef,
                            val: item.FId,
                            //datavalue: item.PrdImg,
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
            //selectPrdFId = i.item.val;
            $('#ProductName_' + lglguid).attr('prdFId', i.item.val);
            var subPrdId = '#ProductRef_' + lglguid;
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

function sod_changed(sender) {
    var sodId = $(sender).val() * 1;
    if (sodId !== 0) {
        //alert(sinId);
        var oneSin = searchFieldValueInArray(SupplierInvoiceLines, 'SodId', sodId);
        if (!jQuery.isEmptyObject(oneSin)) {

            $('#lgl_all_lines').empty();
            $.each(oneSin.PurchaseLines, function(name, value) {
                AddNewLglLine(0, value);
            });

        }
    } else {
        $('#lgl_all_lines').empty();
    }
}

function SaveLglLines() {
    ShowPleaseWait();
    var checkOK = CheckRequiredFieldInOneDiv('lgl_all_lines');
    var lgsId = getUrlVars()['lgsId'];
    if (checkOK && lgsId) {
        ShowPleaseWait();
        var allLines = $("div[id^='one_lgl_']");
        var lglLines = [];
        $.each(allLines, function(name, value) {
            //var guid = value.LglGuid;
            var guid = $(value).attr('id').replace('one_lgl_', '');
            var oneLine = {};
            oneLine.FId = lgsId;
            oneLine.ProductName = $('#ProductName_' + guid).val();
            oneLine.ProductRef = $('#ProductRef_' + guid + ' option:selected').text();
            oneLine.PrdFId = $('#ProductName_' + guid).attr('prdFId');
            oneLine.PitFId = $('#ProductRef_' + guid).val();
            oneLine.LglDescription = $('#LglDescription_' + guid).val();
            oneLine.LglQuantity = $('#LglQuantity_' + guid).val() * 1;
            oneLine.SolId = $('#ProductName_' + guid).attr('solid') * 1;
            oneLine.PrdId = $('#ProductName_' + guid).attr('prdId') * 1;
            oneLine.PitId = $('#ProductName_' + guid).attr('pitId') * 1;
            oneLine.Id = $('#ProductName_' + guid).attr('lglId') * 1;
            oneLine.PrdDescription = $('#LglPrdDes_' + guid).val();
            if (oneLine.LglQuantity != -1) {
                lglLines.push(oneLine);
            }
        });
        if (lglLines.length > 0) {
            var jsondata = JSON.stringify({ lgls: lglLines });
            var url = window.webservicePath + "/CreateUpdateLogisticsLines";
            $.ajax({
                url: url,
                type: 'POST',
                contentType: 'application/json; charset=utf-8',
                data: jsondata,
                dataType: 'json',
                success: function(data) {
                    $('.bootbox-close-button').click();
                    var jsdata = data.d;
                    var data2Treat = jQuery.parseJSON(jsdata);
                    SupplierInvoiceLines = [];
                    if (data2Treat !== '-1') {
                        allLgLines = [];
                        allLgLines = data2Treat;
                        SetPageLines(data2Treat);
                        HidePleaseWait();
                    } else {
                        // authentication error
                        AuthencationError();
                        HidePleaseWait();
                    }
                },
                error: function(data) {
                    $('.bootbox-close-button').click();
                    alert(data.responseText);
                    HidePleaseWait();
                }
            });
        } else {
            alert('Aucunne ligne pour cette commande<br/>该订单没有产品');
            HidePleaseWait();
        }
    } else {
        HidePleaseWait();
    }
    return false;
}

var allLgLines = [];
function LoadAllLines() {
  var lgsId = getUrlVars()['lgsId'];
    if (lgsId && _isView) {
        ShowPleaseWait();
        var url = window.webservicePath + "/LoadAllLgsLines";
        var datastr = "{lgsId:'" + lgsId + "'}";
        $.ajax({
            type: "POST",
            url: url,
            contentType: "application/json; charset=utf-8",
            data: datastr,
            dataType: "json",
            success: function (data) {
                var jsdata = data.d;
                var data2Treat = jQuery.parseJSON(jsdata);
                allLgLines = [];
                if (data2Treat !== '-1') {
                    allLgLines = data2Treat;
                    SetPageLines(data2Treat);
                    HidePleaseWait();
                } else {
                    // authentication error
                    AuthencationError();
                    HidePleaseWait();
                }
            },
            error: function (data) {
                var test = '';
                    HidePleaseWait();
            }
        });

    }
}

function SetPageLines(lgLines) {
    $('#lgs_all_lines').empty();
    if (lgLines.length > 0) {
        $('#btn_generate_pdf').show();
        $('#btn_generate_file_pdf').show();
        lgLines = jQuery.unique(lgLines);
        var sinIds = Array.from(lgLines, m => m.SodId);
        //var sinIds = Array.from(lgLines, m => m.SodId);
        //sinIds= jQuery.unique(sinIds);
        sinIds = sinIds.filter(function(item, i, a) { return i === a.indexOf(item); });
        //alert(sinIds);

        $.each(sinIds, function(name, value) {
            //console.log(lgLines);
            var linesInSameSin = searchInArray(lgLines, 'SodId', value);
            //alert(sameSin);
            if (linesInSameSin.length > 0) {
                var sinId = linesInSameSin[0].SodId * 1;
                var sodCode = linesInSameSin[0].SodCode;
                var cinCode = linesInSameSin[0].CinCode;

                var title = linesInSameSin[0].SodCode ?
                    ("PI - " + "<span  onclick='viewSod(\"" + linesInSameSin[0].FId + "\")' style='cursor:pointer;font-weight:bolder;'>" + linesInSameSin[0].SodCode + "</span>")
                    : (linesInSameSin[0].CinCode ? ("CI - " + "<span style='color:red;'  onclick='viewCin(\"" + linesInSameSin[0].CinFId+ "\")' style='cursor:pointer;font-weight:bolder;'>" + linesInSameSin[0].CinCode + "</span>") : "SANS PI");

                    var downloadPfd = linesInSameSin[0].SodCode ?
                    ("<div class='tools'><a onclick='return downloadSod(\"" + linesInSameSin[0].FId + "\")'><i class='fa fa-arrow-circle-o-down'></i><i class='fa fa-file-text-o'></i></a></div>")
                    : (linesInSameSin[0].CinCode ? ("<div class='tools'><a onclick='return downloadCin(\"" + linesInSameSin[0].CinFId+ "\")'><i class='fa fa-arrow-circle-o-down'></i><i class='fa fa-file-text-o'></i></a></div>") : "");
                var divclass = currentLgs.LgsIsSent ? "col-sm-3" : "col-sm-2";
                var display =  currentLgs.LgsIsSent ? "style='display :none;'" : "";
                var contentBegin = "<div class='col-md-12' >" +
                    "<div class='box border inverse'>" +
                    "<div class='box-title'>" +
                    "<h4><i class='fa fa-globe'></i>" + title + "</h4>" + downloadPfd +
                    "</div>" +
                    "<div class='box-body'>" +
                    "<div class='form-horizontal' id='div_one_sin_lgl_content_" + sinId + "'>" +
                    "<div class='form-group'>" +
                    "<label class='col-sm-2 control-label' style='text-align: center !important;'>Réf de prd</label>" +
                    "<label class='col-sm-2 control-label' style='text-align: center !important;'>Réf de sous prd</label>" +
                    "<label class='" + divclass + " control-label' style='text-align: center !important;'>Des. de prd</label>" +
                    "<label class='col-sm-1 control-label' style='text-align: center !important;'>Qté Total</label>" +
                    "<label class='col-sm-1 control-label' style='text-align: center !important;'>Qté livré(stocké)</label>" +
                    "<label class='col-sm-1 control-label' style='text-align: center !important;'>Qté à Livrer</label>" +
                    "<label class='col-sm-2 control-label' style='text-align: center !important;'>Description</label>" +
                    "<div class='col-sm-1' " + display + "></div>" +
                    "</div>";
                var content = "";
                $.each(linesInSameSin, function(linename, linevalue) {
                    content += SetOneLineInPage(linevalue);
                });
                var contentEnd1 = "<div class='form-group center'>";

//                var modifyBtn = currentLgs.LgsIsSent ? "" : ("<div class='col-sm-12'>" +
//                    "<button type='button' class='btn btn-inverse'>Modifier</button>" +
//                    "</div>");
                var modifyBtn = "";
                var contentEnd2 = "</div>" +
                    "</div>" +
                    "</div>" +
                    "</div>" +
                    "</div>";

                var lineContent = contentBegin + content + contentEnd1 + modifyBtn + contentEnd2;
                $('#lgs_all_lines').append(lineContent);
            }
        });
    } else {
        $('#btn_generate_pdf').hide();
        $('#btn_generate_file_pdf').hide();
    }
}

function downloadSod(fId) {
   var sodId = encodeURIComponent(fId);
    var lgsId = getUrlVars()['lgsId'];
    lgsId = encodeURIComponent(lgsId);
    window.open('../Common/PageDownLoad.aspx?sodId=' + sodId + '&lgsId=' + lgsId, '_blank');
    return false;
}

function downloadCin(fId) {
    var cinId = encodeURIComponent(fId);
    var lgsId = getUrlVars()['lgsId'];
    lgsId = encodeURIComponent(lgsId);
    window.open('../Common/PageDownLoad.aspx?cinId=' + cinId + '&lgsId=' + lgsId, '_blank');
    return false;
}

function viewSod(fId) {
    var url = '../SupplierOrder/SupplierOrder.aspx?sodId=' + fId + "&mode=view";
    var win = window.open(url, '_blank');
    win.focus();
}

function viewCin(fId) {
    var url = '../ClientInvoice/ClientInvoice.aspx?cinId=' + fId + "&mode=view";
    var win = window.open(url, '_blank');
    win.focus();
}

function SetOneLineInPage(oneLgLine) {
    var btnSave =currentLgs.LgsIsSent?"": "<button class='btn btn-inverse' style='display:none;' id='btn_save_one_lgl_lglid' lglid='" + oneLgLine.Id + "' onclick='return SaveOneLgLine(this)' title='Sauvegarder' ><i class='fa fa-save'></i></button>";
    var btnCancel = currentLgs.LgsIsSent?"":"<button class='btn btn-default' style='display:none;' id='btn_cancel_one_lgl_lglid' lglid='" + oneLgLine.Id + "' onclick='return CancelOneLgLine(this)' title='Annuler' ><i class='fa fa-mail-reply-all'></i></button>";
    var btnUpdate = currentLgs.LgsIsSent?"":"<button class='btn btn-inverse' id='btn_modify_one_lgl_lglid' lglid='" + oneLgLine.Id + "' onclick='return UpdateOneLgLine(this)' title='Modifier' ><i class='fa fa-pencil-square-o'></i></button>";
    var btnDelete = currentLgs.LgsIsSent?"":"<button  class='btn btn-inverse' id='btn_delete_one_lgl_lglid' lglid='" + oneLgLine.Id + "'  title='Supprimer' onclick='return  SaveOneLgLine(this,true)'><i class='fa fa-times'></i></button>";
    var divclass = currentLgs.LgsIsSent ? "col-sm-3" : "col-sm-2";
    var display =  currentLgs.LgsIsSent ? "style='display :none;'" : "";

    var oneContent = "<div class='form-group' sinId='" + oneLgLine.SinId + "' id='div_one_lgline_content_lglid' lglid='" + oneLgLine.Id + "' >" +
        "<div class='col-sm-2'><input value='" + oneLgLine.ProductName + "' type='text' class='form-control'  disabled  lglid='" + oneLgLine.Id + "' id='LglProductName_lglid' /></div>" +
        "<div class='col-sm-2'><select class='form-control' disabled  lglid='" + oneLgLine.Id + "'  id='LglProductRef_lglid' onchange='ProductRefChange(this)' guid='" + oneLgLine.Id + "'><option>" + oneLgLine.ProductRef + "</option></select></div>" +
        "<div class='" + divclass + "'><textarea style='height : 100px;' class='form-control' disabled lglid='" + oneLgLine.Id + "' id='LglPrdDes_lglid' >" + oneLgLine.PrdDescription + "</textarea></div>" +
        "<div class='col-sm-1'><input value='" + oneLgLine.LglQuantityTotal + "' type='number' class='form-control' disabled  lglid='" + oneLgLine.Id + "' /></div>" +
        "<div class='col-sm-1'><input value='" + oneLgLine.LglQuantityDeliveried + "' type='number' class='form-control' disabled  lglid='" + oneLgLine.Id + "'  id='LglQtyDeliveried_lglid' /></div>" +
        "<div class='col-sm-1'><input value='" + oneLgLine.LglQuantity + "' type='number' class='form-control' disabled  lglid='" + oneLgLine.Id + "'  id='LglQuantity_lglid' /></div>" +
        "<div class='col-sm-2'><input value='" + oneLgLine.LglDescription + "' type='text' class='form-control' disabled  lglid='" + oneLgLine.Id + "'  id='LglDescription_lglid' /></div>" +
        "<div class='col-sm-1 center' " + display + ">" + btnSave + btnCancel + btnUpdate + btnDelete + "</div>" +
        "</div>";
    oneContent = replaceAll(oneContent, '_lglid', '_' + oneLgLine.Id);
//    if (oneLgLine.PrdDescription) {
//        $('#LglPrdDes_' + oneLgLine.Id).text(oneLgLine.PrdDescription);
//    }
    return oneContent;
}

function UpdateOneLgLine(sender) {
    var lglId = $(sender).attr('lglid') * 1;
    var LglProductName = '#LglProductName_' + lglId;
    var LglProductRef= '#LglProductRef_' + lglId;
    var LglQuantity= '#LglQuantity_' + lglId;
    var btn_modify_one_lgl = '#btn_modify_one_lgl_' + lglId;
    var btn_delete_one_lgl = '#btn_delete_one_lgl_' + lglId;
    var btn_save_one_lgl = '#btn_save_one_lgl_' + lglId;
    var btn_cancel_one_lgl = '#btn_cancel_one_lgl_' + lglId;
    var div_one_lgline_content = '#div_one_lgline_content_' + lglId;
    var sinId = $(div_one_lgline_content).attr('sinId') * 1;
    var LglDescription = '#LglDescription_' + lglId;

//    $(LglProductName).removeAttr('disabled');
//    $(LglProductRef).removeAttr('disabled');
    $(LglQuantity).removeAttr('disabled');
    $(LglDescription).removeAttr('disabled');
    
    $(btn_save_one_lgl).show();
    $(btn_cancel_one_lgl).show();
    $(btn_modify_one_lgl).hide();
    $(btn_delete_one_lgl).hide();

    if (sinId === 0) {
        $(LglProductName).removeAttr('disabled');
        $(LglProductRef).removeAttr('disabled');

        setAutoCompletePrdForModify(lglId);
    }

    return false;
}

function setAutoCompletePrdForModify(lglguid) {
    var url = window.webservicePath + "/GetProductsByRef";
    $("#LglProductName_" + lglguid).autocomplete({
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

                    var subPrdId = '#LglProductRef_' + lglguid;
                    $(subPrdId).empty();
                    $(subPrdId).append($("<option></option>").attr("value", "0").attr("data-value", "0").attr("data-price", "0").text("Aucun produit"));
                    response($.map(data2Treat, function(item) {
                        return {
                            label: item.PrdRef,
                            val: item.FId,
                            //datavalue: item.PrdImg,
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
            //selectPrdFId = i.item.val;
            $('#LglProductName_' + lglguid).attr('prdFId', i.item.val);
            var subPrdId = '#LglProductRef_' + lglguid;
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
                        if (data2Treat.length > 0) {
                            $(subPrdId).change();
                        }
                    }
                },
                error: function(response) {
                }
            });
        },
        minLength: 2
    });
}

function CancelOneLgLine(sender) {
    var lglId = $(sender).attr('lglid') * 1;
    var LglProductName = '#LglProductName_' + lglId;
    var LglProductRef = '#LglProductRef_' + lglId;
    var LglQuantity = '#LglQuantity_' + lglId;
    var LglDescription = '#LglDescription_' + lglId;
    var btn_modify_one_lgl = '#btn_modify_one_lgl_' + lglId;
    var btn_delete_one_lgl = '#btn_delete_one_lgl_' + lglId;
    var btn_save_one_lgl = '#btn_save_one_lgl_' + lglId;
    var btn_cancel_one_lgl = '#btn_cancel_one_lgl_' + lglId;
    var div_one_lgline_content = '#div_one_lgline_content_' + lglId;
    var sinId = $(div_one_lgline_content).attr('sinId') * 1;

//    $(LglProductName).prop("disabled", true);
//    $(LglProductRef).prop("disabled", true);
    $(LglQuantity).prop("disabled", true);
    $(LglDescription).prop("disabled", true);

    $(btn_save_one_lgl).hide();
    $(btn_cancel_one_lgl).hide();
    $(btn_modify_one_lgl).show();
    $(btn_delete_one_lgl).show();
    if (sinId === 0) {
        $(LglProductName).prop("disabled", true);
        $(LglProductRef).prop("disabled", true);
    }
    return false;
}

function SaveOneLgLine(sender, isDelete) {
    var lglId = $(sender).attr('lglid') * 1;
    if (!isDelete) {
        var quantity = $('#LglQuantity_' + lglId).val() * 1;
        var prdname = $("#LglProductName_" + lglId).val();
        var prdFId = $("#LglProductName_" + lglId).attr('prdFId');
        var pitFId = $('#LglProductRef_' + lglId).val();
        //alert(lglId + "<br/>" + quantity + "<br/>" + prdFId + "<br/>" + pitFId + "<br/>");
        var oneLine = {};
        var lgsId = getUrlVars()['lgsId'];
        oneLine.FId = lgsId;
        oneLine.Id = lglId;
        oneLine.ProductName = prdname;
        oneLine.ProductRef = $('#LglProductRef_' + lglId + ' option:selected').text();
        oneLine.PrdFId = prdFId;
        oneLine.PitFId = pitFId;
        oneLine.LglDescription = $('#LglDescription_' + lglId).val();
        oneLine.LglQuantity = !isDelete ? quantity : 0;
        oneLine.PrdDescription = $('#LglPrdDes_' + lglId).val();

        var url = window.webservicePath + "/UpdateOneLgLine";
        var jsondata = JSON.stringify({ lgLine: oneLine });
        $.ajax({
            url: url,
            type: 'POST',
            contentType: 'application/json; charset=utf-8',
            data: jsondata,
            dataType: 'json',
            success: function(data) {
                var jsdata = data.d;
                var lgLine = jQuery.parseJSON(jsdata);
                LoadAllLines();
            },
            error: function(data) {
            }
        });
    } else {
        var title = 'CONFIRMER';
        var msg = 'Veuillez confirmer la suppression !';
        var btnname = 'Supprimer';
        var fun = 'deleteOneline(' + lglId + ')';
        MsgPopUpWithResponseChoice(title, msg, btnname, fun,'Annuler');
    }
    return false;
}

function deleteOneline(lglId) {
    var oneLine = {};
    var lgsId = getUrlVars()['lgsId'];
    oneLine.FId = lgsId;
    oneLine.Id = lglId;
    oneLine.LglQuantity = 0;
    var url = window.webservicePath + "/UpdateOneLgLine";
    var jsondata = JSON.stringify({ lgLine: oneLine });
    $.ajax({
        url: url,
        type: 'POST',
        contentType: 'application/json; charset=utf-8',
        data: jsondata,
        dataType: 'json',
        success: function(data) {
            var jsdata = data.d;
            var lgLine = jQuery.parseJSON(jsdata);
            LoadAllLines();
        },
        error: function(data) {
        }
    });
    return false;
}

function IsSentClick(sender) {
    var isSent = $(sender).is(':checked');
    if (isSent) {
        var title = 'CONFIRMATION';
        var msg = "Veuillez confimer que ce container est déjà expédié, une fois vous confirmez, vous ne pouvez plus ajouter des produits dans ce container et la suppression de container ne fonctionne plus ! ";
        var content = "<div class='box'><div class='box-body' style='height: 150px;'>" +
            "<div class='form-horizontal'>" +
            "<div class='col-md-12'>" +
            "<div class='form-group'>" +
            "<div class='col-sm-12' style='text-align:center;font-size: 18pt;'>" + msg + "</div></div></div></div></div></div>"
            + "<div class='modal-footer center'>" +
            "<button type='button' class='btn btn-default' onclick='CancelSend()'>Annuler</button>" +
            "<button type='button' class='btn btn-inverse' onclick='closeDialog()' id='btn_default_close'>Confirmer</button>" +
            "</div>";
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
        var _LgsDateSend = $('#_LgsDateSend').val();
        if (!_LgsDateSend) {
            var today = new Date();
            var year = today.getFullYear();
            var month = ("0" + (today.getMonth() + 1)).slice(-2);
            var day = ("0" + today.getDate()).slice(-2);
            var formatted = day + "/" + month + "/" + year;
            $('#_LgsDateSend').val(formatted);
        }
    }
    return false;
}

function CancelSend() {
    closeDialog();
    $('#LgsIsSent').attr('checked', false);
}

function closeDialog() {
    // id = 'btn_default_close'
    $('#btn_default_close').click();
    return false;
}

function downloadPdf() {
    var lgsId= getUrlVars()['lgsId'];
    lgsId= encodeURIComponent(lgsId);
    window.open('../Common/PageDownLoad.aspx?lgsId=' + lgsId + '&pi=0', '_blank');
    return false;
}

function downloadFilePdf() {
    var lgsId= getUrlVars()['lgsId'];
    lgsId= encodeURIComponent(lgsId);
    window.open('../Common/PageDownLoad.aspx?lgsId=' + lgsId + '&pi=1', '_blank');
    return false;
}

///set clickable lable for externe link
function setClickableLabel() {
    if (_isView) {
        $("#lb_supplier").addClass("animated_menu");
        $("#lb_supplier").prop('title', 'Cliquer pour consulter le transporteur');
        $('#lb_supplier').css('cursor', 'pointer');
    }
}

function ExternLinkClick(sender) {
    if (_isView && currentLgs) {
        ExternLinkBaseClick(sender, currentLgs);
    }
}

function deleteLgsConfirme() {
var content = "<div class='box'><div class='box-body' style='height: 100px;'>" +
        "<div class='form-horizontal'>" +
        "<div class='col-md-12'>" +
        "<div class='form-group'>" +
        "<div class='col-sm-12' style='text-align:center;font-size: 18pt;'>La suppression est irrécupérable, veuillez confirmer !!!</div></div></div></div></div></div>"
        + "<div class='modal-footer center'>" +
        "<button type='button' class='btn btn-default' onclick='closeDialog()' id='btn_default_close'>Annuler</button>" +
        "<button type='button' class='btn btn-inverse' onclick='return DeleteLgs()'>Supprimer</button></div>";
    bootbox.dialog({
        title: 'CONFIRMER',
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

function DeleteLgs() {
    ShowPleaseWait();
    var lgsId= getUrlVars()['lgsId'];
    var url = window.webservicePath + "/DeleteLogistic";
    $.ajax({
        type: "POST",
        url: url,
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        data: "{lgsId:'" + lgsId + "'}",
        success: function(data) {
            HidePleaseWait();
            if (data.d !== -1) {
                if (data.d === 0) {
                    MsgErrorPopUp('ERREUR', 'Ce Container est déjà dans l\'entrepôt, la suppression n\'est pas effectuée!');
                } else {
                    window.location = 'SearchLogistics.aspx';
                }
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

function receiveContainer() {
    var div2Add = AddLineForRecept();
    var startBox = "<div class='box'><div class='box-body'>";
    var endBox = "</div></div>";
    var onelineContent =
        // start box
        "<div class='form-group' id='div_one_line'>" +
            "<div class='row'>" +
            "<div class='col-md-12'>" +
            "<div class='box-body'>" +
            "<div class='form-horizontal'><div class='row'>" +
            "<div class='form-group'>" +
            "<label class='col-sm-12 control-label' style='text-align:center; color: red'>Veuillez confirmer la réception de container, une fois vous le confirmez, la modification sera impossiblee !</label>" +
            "</div>" +
            "</div>" +
            "<div class='form-group'><div class='col-sm-3'></div>" +
            "<label class='col-sm-3 control-label'>Date de reçu</label>" +
            "<div class='col-sm-3'>" +
            "<div class='input-group'>" +
            "<input type='text' class='form-control datepicker' id='LgsDateArrivePop' name='LgsDateArrivePop' /><span class='input-group-addon'><i class='fa fa-calendar'></i></span>" +
            "</div>" +
            "</div>" +
            "<div class='col-sm-3'></div></div></div>" +
            div2Add +
            // close box
            "</div></div></div></div></div>";

    var btnAddUpdate = "<button class='btn btn-inverse' id='btn_add_update_discount' name='btn_add_update_discount' onclick='return EnterWarehouseClick()'><span>ENTREPOSER</span></button>";
    var btnClose = "<button class='btn btn-default bootbox-close-button' onclick='return false'><span>Annuler</span></button>";

    var btns = "<div class='modal-body center'>" + btnClose + btnAddUpdate + "</div>";
    var onecontent = startBox + onelineContent + btns + endBox;

    var title = 'Recevoir le container';
    bootbox.dialog({
            title: title,
            message: onecontent
        })
        .find('.modal-dialog').css({
            'width': '95%'
        })
        .find('.modal-content').css({
            'margin-top': function() {
                var w = $(window).height();
                var b = $(".modal-dialog").height();
                // should not be (w-h)/2
                var h = (w - b) * 0.01;
                return h + "px";
            }
        }).find('.modal-header').css({
            'background': 'url(../../img/menu_005_bg.jpg) repeat-x',
            'text-align': 'center',
            'color': '#C0C0C0'
        });

    $('#LgsDateArrivePop').datepicker();
    var today = new Date();
    var year = today.getFullYear();
    var month = ("0" + (today.getMonth() + 1)).slice(-2);
    var day = ("0" + today.getDate()).slice(-2);
    var formatted = day + "/" + month + "/" + year;
    $('#LgsDateArrivePop').val(formatted);
    
    if (WareHouseList && WareHouseList.length > 0) {
        $.each(WareHouseList, function(name, value) {
            $('#WhsId').append($("<option>" + value.WhsName + "</option>").attr("value", value.WhsId));
        });
    }
    //$('#WhsId').change();
    var allsrlWhs = $('select[id^="SrlWhs_"]');
    $.each(allsrlWhs, function(order, onewhs) {
        $(onewhs).empty();
        if (WareHouseList && WareHouseList.length > 0) {
            $.each(WareHouseList, function(name, value) {
                $(onewhs).append($("<option>" + value.WhsName + "</option>").attr("value", value.WhsId));
            });
        }
        $(onewhs).change();
    });


    return false;
}

var WareHouseList = [];
function getWareHouseList() {
    var url = window.webservicePath + "/GetWareHousesList";
    WareHouseList = [];
    $.ajax({
        type: "POST",
        url: url,
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        success: function(data) {
            var jsdata = data.d;
            var data2Treat = jQuery.parseJSON(jsdata);
            if (data2Treat !== '-1') {
                WareHouseList = data2Treat;
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


var shelves = [];
function getShelvesList(sender) {
    //var whsId = $(sender).find('option:selected').val() *1;
    var url = window.webservicePath + "/GetAllShelvesList";
    shelves = [];
    $.ajax({
        type: "POST",
        url: url,
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        success: function(data) {
            var jsdata = data.d;
            var data2Treat = jQuery.parseJSON(jsdata);
            if (data2Treat !== '-1') {
                shelves = data2Treat;
//                var allsrlShes = $('select[id^="SrlShe_"]');
//                $.each(allsrlShes, function(order, oneshe) {
//                    $(oneshe).empty();
//                    $.each(shelves, function(name, value) {
//                        $(oneshe).append($("<option></option>").attr("value", value.SheId).text(value.SheCode + " | ÉTAGE: " + value.SheFloor + " | LIGNE: " + value.SheLine + " | RANGÉE: " + value.SheRow));
//                    });
//                });
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

function AddLineForRecept() {
    var div2Add = "";
    var title = "<div class='row' style='max-height:600px; overflow-y:auto;'><div class='form-group'>" +
        "<label class='col-sm-1 control-label labelCenter11'>Réf de prd</label>" +
        "<label class='col-sm-1 control-label labelCenter11'>Réf de sous prd</label>" +
        "<label class='col-sm-2 control-label labelCenter11'>Des. de prd</label>" +
        "<label class='col-sm-2 control-label labelCenter11'>Des. de container</label>" +
        "<label class='col-sm-1 control-label labelCenter11'>Qté</label>" +
        "<label class='col-sm-1 control-label labelCenter11'>Qté reçu</label>" +
        "<label class='col-sm-1 control-label labelCenter11'>Entrepôt</label>" +
        "<label class='col-sm-1 control-label labelCenter11'>Étagère</label>" +
        "<label class='col-sm-2 control-label labelCenter11'>Commentaire</label>" +
        "</div>";
    div2Add += title;
    if (allLgLines && allLgLines.length > 0) {
        var lgLines = allLgLines;
        lgLines = jQuery.unique(lgLines);
        var sinIds = Array.from(lgLines, m => m.SodId);
        sinIds = sinIds.filter(function(item, i, a) { return i === a.indexOf(item); });
        $.each(sinIds, function(name, value) {
            var linesInSameSin = searchInArray(lgLines, 'SodId', value);
            //alert(sameSin);
            if (linesInSameSin.length > 0) {
                var sinCode = linesInSameSin[0].SodCode ? ("PI - " + linesInSameSin[0].SodCode) : "SANS PI";
                var divclass = currentLgs.LgsIsSent ? "col-sm-3" : "col-sm-2";
                var display = currentLgs.LgsIsSent ? "style='display :none;'" : "";
                var content = "";
                $.each(linesInSameSin, function(linename, oneLgLine) {
                    //content += SetOneLineInPage(linevalue);
                    var oneContent = "<div class='form-group' sinId='" + oneLgLine.SinId + "' lglid='" + oneLgLine.Id + "' >" +
                        "<div class='col-sm-1'><input value='" + oneLgLine.ProductName + "' type='text' class='form-control'  disabled id='SrlPrdName_lglid' /></div>" +
                        "<div class='col-sm-1'><input type='text' class='form-control'  disabled  value='" + oneLgLine.ProductRef + "' /></div>" +
                        "<div class='col-sm-2'><textarea style='height : 100px;' class='form-control' disabled lglid='" + oneLgLine.Id + "' >" + oneLgLine.PrdDescription + "</textarea></div>" +
                        "<div class='col-sm-2'><input value='" + oneLgLine.LglDescription + "' type='text' class='form-control' disabled  lglid='" + oneLgLine.Id + "'  /></div>" +
                        "<div class='col-sm-1'><input value='" + oneLgLine.LglQuantity + "' disabled type='number' class='form-control' lglid='" + oneLgLine.Id + "' /></div>" +
                        "<div class='col-sm-1'><input value='" + oneLgLine.LglQuantity + "' min='0' max='" + oneLgLine.LglQuantity + "' type='number' class='form-control' lglid='" + oneLgLine.Id + "'  id='SrlQuantityReal_lglid' prdid='" + oneLgLine.PrdId + "' pitid='" + oneLgLine.PitId + "' /></div>" +
                        "<div class='col-sm-1'><select class='form-control' id='SrlWhs_lglid' onchange='WhsChange(this)' lglid='" + oneLgLine.Id + "' ></select></div>" +
                        "<div class='col-sm-1'><select class='form-control' id='SrlShe_lglid' lglid='" + oneLgLine.Id + "' ></select></div>" +
                        "<div class='col-sm-2'><textarea style='height : 100px;' class='form-control'  lglid='" + oneLgLine.Id + "' id='SrlDescription_lglid' ></textarea></div>" +
                        "</div>";
                    oneContent = replaceAll(oneContent, '_lglid', '_' + oneLgLine.Id);
                    content += oneContent;
                });
                div2Add += content;
            }
        });
    }
    div2Add += "</div>";
    return div2Add;
}

function EnterWarehouseClick() {
    MsgPopUpWithResponseChoice('CONFIRMER','Confirmez la mis en stocakge, une fois vous le confirmez, toutes les modifications de container seront impossibles ! ','ENTREPOSER','EnterWarehouse()','Annuler');
}

function EnterWarehouse() {

    ShowPleaseWait();
    var srls = $('input[id^="SrlQuantityReal_"]');
    var srlList = [];

    $.each(srls, function(name, value) {
        var lglId = $(value).attr('lglid') * 1;
        var quantity = $(value).val() * 1;
        var description = $('#SrlDescription_' + lglId).val();
        var sheId = $('#SrlShe_' + lglId).find('option:selected').val();
        sheId = isNaN(sheId) ? 0 : (sheId * 1);
        var pitId = $('#SrlQuantityReal_' + lglId).attr('pitid');
        var prdId = $('#SrlQuantityReal_' + lglId).attr('prdid');
        var prdname = $('#SrlPrdName_' + lglId).val();
        var whsId = $('#SrlWhs_'+ lglId).find('option:selected').val();
        whsId = isNaN(whsId) ? 0 : (whsId * 1);

        var oneSrl = {};
        oneSrl.Id = lglId;
        oneSrl.LglQuantity = quantity;
        oneSrl.LglDescription = description;
        oneSrl.SheId = sheId;
        oneSrl.PrdId = isNaN(prdId) ? 0 : (prdId * 1);
        oneSrl.PitId = isNaN(pitId) ? 0 : (pitId * 1);
        oneSrl.SheId = sheId;
        oneSrl.ProductName = prdname;
        oneSrl.WhsId = whsId;

        srlList.push(oneSrl);
    });

    var lgsId = getParameterByName('lgsId');
    //var whsId = $('#WhsId').find('option:selected').val() * 1;
    var receiveTime = $('#LgsDateArrivePop').val();

    var jsondata = JSON.stringify({lgsId: lgsId, receiveTime: receiveTime,lines:srlList});


    var url = window.webservicePath + "/CreateSrvFromLogistic";
    $.ajax({
        type: "POST",
        url: url,
        data: jsondata,
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        success: function(data) {
            location.reload();
        },
        error: function(data) {
            var test = '';
        }
    });
}

function SendContainerClick() {
    if (allLgLines && allLgLines.length > 0) {
        ShowPleaseWait();
        SendContainer();
    } else {
        MsgErrorPopUp('ERREUR','Veuillez ajouter des produits dans le container avant l\'expédier !');
    }
    return false;
}

function SendContainer() {
    var startBox = "<div class='box'><div class='box-body'>";
    var endBox = "</div></div>";
    var onelineContent =
        // start box
        "<div class='form-group' id='div_one_line'>" +
            "<div class='row'>" +
            "<div class='col-md-12'>" +
            "<div class='box-body'>" +
            "<div class='form-horizontal'>" +
            "<div class='form-group'><label class='col-sm-12 control-label ' style='text-align:center !important'>Veuillez confimer que ce container est déjà expédié, une fois vous confirmez, vous ne pouvez plus ajouter des produits dans ce container et la suppression de container ne fonctionne plus !<br/> 请确认商品是否已经发出，一旦发出，物流信息将不能做任何修改和删除！ </label></div>" +
            "<div class='form-group'>" +
            "<label class='col-sm-4 control-label'>Date d'expédié 发货日期</label>" +
            "<div class='col-sm-8'><input type='text' id='popup_LgsDateSend' class='form-control datepicker' /></div>" +
            "</div>" +
            "<div class='form-group'>" +
            "<label class='col-sm-4 control-label'>Date d'arrive prévu 预计到达日期</label>" +
            "<div class='col-sm-8'><input type='text' id='popup_LgsDateArr' class='form-control datepicker' /></div>" +
            "</div>" +
            "<div class='form-group'>" +
            "<label class='col-sm-4 control-label'>Numéro de tracking 物流号码</label>" +
            "<div class='col-sm-8'><input type='text' id='popup_LgsNmb' class='form-control' /></div>" +
            "</div>" +
            // close box
            "</div></div></div></div></div>";

    var btnAddUpdate = "<button class='btn btn-inverse' onclick='return SetSendDate(this)'><span>Expédier</span></button>";
    var btnClose = "<button class='btn btn-default bootbox-close-button' onclick='return false' id='btn_close_senddialog'><span>Annuler</span></button>";

    var btns = "<div class='modal-body center'>" + btnClose + btnAddUpdate + "</div>";
    var onecontent = startBox + onelineContent + btns + endBox;

    var title = 'Container est expédié 货物已发';
    bootbox.dialog({
            title: title,
            message: onecontent
        })
//    .find('.modal-dialog').css({
//        'width': '80%'
//    })
        .find('.modal-content').css({
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
    $('#popup_LgsDateSend').datepicker();
    $('#popup_LgsDateArr').datepicker();
    var today = new Date();
    var year = today.getFullYear();
    var month = ("0" + (today.getMonth() + 1)).slice(-2);
    var monthArr = ("0" + (today.getMonth() + 2)).slice(-2);
    var day = ("0" + today.getDate()).slice(-2);
    var formatted = day + "/" + month + "/" + year;
    var formattedArr = day + "/" + monthArr + "/" + year;
    $('#popup_LgsDateSend').val(formatted);
    $('#popup_LgsDateArr').val(formattedArr);
    HidePleaseWait();
    return false;
}

function SetSendDate(sender) {
    $(sender).prop('disabled', true);
    ShowPleaseWait();
    var popup_LgsDateSend = $('#popup_LgsDateSend').val();
    var popup_LgsDateArr = $('#popup_LgsDateArr').val();
    var popup_LgsNmb = $('#popup_LgsNmb').val();
    var lgsId = getParameterByName('lgsId');
    if (popup_LgsDateSend) {
        var url = window.webservicePath + "/UpdateLogisticSendDate";
        var datastr = "{lgsId:'" + lgsId + "',sendDate:'" + popup_LgsDateSend + "',arrDate:'" + popup_LgsDateArr + "',tracknmb:'" + popup_LgsNmb + "'}";
        $.ajax({
            type: "POST",
            url: url,
            contentType: "application/json; charset=utf-8",
            data: datastr,
            dataType: "json",
            success: function(data) {
                location.reload();
            },
            error: function(data) {
                location.reload();
            }
        });
    } else {
        HidePleaseWait();
        $(sender).prop('disabled', false);
        $('#popup_LgsDateSend').addClass('error_border');
        MsgErrorPopUp('Erreur', 'La date est obligatoire !');
    }
    return false;
}

function WhsChange(sender) {
    var whsId = $(sender).find('option:selected').val() * 1;
    var lglid = $(sender).attr('lglid') * 1;
    var shes = searchInArray(shelves, 'WhsId', whsId);
    var SrlShe_id = "#SrlShe_" + lglid;
    $(SrlShe_id).empty();
    if (shes && shes.length > 0) {
        $.each(shes, function(name, value) {
            $(SrlShe_id).append($("<option></option>").attr("value", value.SheId).text(value.SheCode + " | ÉTAGE: " + value.SheFloor + " | LIGNE: " + value.SheLine + " | RANGÉE: " + value.SheRow));
        });
    }
}


function showSodForAssociation() {
    var fromSin = "";

    var startBox = "<div class='box'><div class='box-body'>";
    var endBox = "</div></div>";
    var onelineContent =
    // start box
        "<div class='form-group' id='div_one_line'>" +
            "<div class='row'>" +
            "<div class='col-md-12'>" +
            "<div class='box-body'>" +
            "<div class='form-horizontal'>" +
            "<div class='form-group' id='lgl_type_line'>" +
            "<label class='col-sm-4 control-label'>Sélectionner un SO 选择该物流对应账单</label>" +
            "<div class='col-sm-8'><input class='form-control' id='select_for_sod_ass' /></div>" +
            "</div>" +
            "<div id='sod_info' style='width: 100%; overflow-x: auto; max-height:500px;'>" +
            "<label class='col-sm-12 control-label'>Veuillez choisir un SO 选择该物流对应账单</label>" +
            "</div>" +
    // close box
            "</div></div></div></div></div>";

    var btnAddUpdate = "<button class='btn btn-inverse' id='btn_ass_sod' name='btn_ass_sod' onclick='return AssocierSod()'><span>Sauvegarder</span></button>";
    var btnClose = "<button class='btn btn-default bootbox-close-button' id='btn_close_ass_sod' onclick='return false'><span>Annuler</span></button>";

    var btns = "<div class='modal-body center'>" + btnClose + btnAddUpdate + "</div>";
    var onecontent = startBox + onelineContent + btns + endBox;

    var title = 'Associer une commande fournisseur 关联物流账单';
    bootbox.dialog({
        title: title,
        message: onecontent
    }).find('.modal-dialog').css({
        'width': '80%'
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
    GetAutoSodAssByKeyword();
    return false;
}




var selectedAssSodId = 0;
var sodAddList = [];
function GetAutoSodAssByKeyword() {
    var url = window.webservicePath + "/GetSodByKeywordForLgsAss";
    var lgsId = getUrlVars()['lgsId'];
    $('#sod_info').empty();
    $("#select_for_sod_ass").autocomplete({
        source: function(request, response) {
            selectedSodId = 0;
            $.ajax({
                url: url,
                data: "{ 'keyword': '" + request.term + "','lgsId':'" + lgsId + "'}",
                dataType: "json",
                type: "POST",
                contentType: "application/json; charset=utf-8",
                success: function(data) {
                    selectedAssSodId = 0;
                    var jsdata = data.d;
                    var data2Treat = jQuery.parseJSON(jsdata);
                    $('#lgl_all_lines').empty();
                    sodAddList = [];
                    sodAddList = data2Treat;
                    if (data2Treat.length > 0) {
                        response($.map(data2Treat, function(item) {
                            return {
                                label: item.SodCode + " | " + item.OneSupplier.CompanyName,
                                val: item.SodId,
                            }
                        }));
                    } else {
                    }
                },
                error: function(response) {
//                    alert(response.responseText);
                    //console.log(response);
                },
                failure: function(response) {
                    alert(response.responseText);
                }
            });
        },
        select: function(e, i) {
            selectedAssSodId = i.item.val * 1;
            //console.log(selectedSodId);
            if (selectedAssSodId !== 0) {
                var oneSin = searchFieldValueInArray(sodAddList, 'SodId', selectedAssSodId);
                if (!jQuery.isEmptyObject(oneSin)) {
                    $('#sod_info').empty();
                    $('#sod_info').append("<label class='col-sm-12 control-label'>Vous avez choisi 您已选择 : " + oneSin.SodCode + " <br> Le fournisseur est 物流商 : " + oneSin.OneSupplier.CompanyName + "</label>");
                    //console.log(oneSin);
                }
            } else {
                $('#sod_info').empty();
            }
        },
        minLength: 5
    });
}


function AssocierSod() {
    if (selectedAssSodId > 0) {
        var lgsId = getUrlVars()['lgsId'];
        var jsondata = JSON.stringify({ lgsId: lgsId, sodId: selectedAssSodId });
        var url = window.webservicePath + "/SetLgsAssSod";
        AjaxCall('post', url, jsondata, function(data) {
            LoadLgs();
            bootbox.alert("La mise à jour est effectuée 已完成");
            setTimeout(function() {
                $(".bootbox").modal("hide");
            }, 1500);
        });
    } else {
        alert('Veuillez sélectionner un SO 请您选择一个账单');
    }
    selectedAssSodId = 0;
    return false;
}


function RemoveAssocierSod() {
    var lgsId = getUrlVars()['lgsId'];
    var jsondata = JSON.stringify({ lgsId: lgsId, sodId: 0 });
    var url = window.webservicePath + "/SetLgsAssSod";
    AjaxCall('post', url, jsondata, function(data) {
        LoadLgs();
        bootbox.alert("La mise à jour est effectuée 已完成");
        setTimeout(function() {
            $(".bootbox").modal("hide");
        }, 1500);
    });
    selectedAssSodId = 0;
    return false;
}

function viewSodClick(sender) {
    var sodId = $(sender).attr('sodId');
    sodId = encodeURIComponent(sodId);
    var url = '../SupplierOrder/SupplierOrder.aspx?sodId=' + sodId + "&mode=view";
    var win = window.open(url, '_blank');
    win.focus();
    return false;
}


function RemoveAssSod() {
    var message = "Veuillez confirmer à enlever l'association de " + currentLgs.SodCode + " <br>请确认是否与该账单取消关联 " + currentLgs.SodCode;
    MsgPopUpWithResponseChoice('CONFIRMATION 请确认', message, 'Enlever 取关', 'RemoveAssocierSod()', 'Annuler 放弃');
}


// 2023-06-11 上传文件

var docList = [];
function loadDocInfo() {
    var lgsId = getUrlVars()['lgsId'];
    docList = [];
    if (lgsId) {
        var url = window.webservicePath + "/GetDocumentList";
        var datastr = "{dtpName:'Logistics',forId:'" + lgsId + "'}";
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
                    var sprs = data2Treat;
                    docList = data2Treat;
                    try {
                        $('#div_docslist').empty();
                        var title = "<div class='form-group'>" +
                            "<label class='col-sm-4 control-label' style='text-align:center'>Fichier</label>" +
                            "<label class='col-sm-2 control-label' style='text-align:center'>Date</label>" +
                            "<label class='col-sm-6 control-label' style='text-align:center'>Commentaire</label>" +
                            "</div>";
                        $('#div_docslist').append(title);
                        var hasefile = false;
                        $.each(sprs, function(name, value) {
                            var comment = replaceAll(value.Value, "'", "&apos;");
                            comment = replaceAll(comment, "\"", "&quot;");
                            var btnview = (value.Value2 != null && value.Value2.length > 0) ? "<button class='btn btn-inverse' docid=" + value.Key + " comment='" + comment + "' onclick='return viewDocFile(this)'><i class='fa fa-search-plus'></i></button>" : "";
                            var btnUpdate = "<button class='btn btn-inverse' docid=" + value.Key + " onclick='return AddLgsDoc(this)'><i class='fa fa-pencil-square-o'></i></button>";
                            var btnDelete = (value.Value2 != null && value.Value2.length > 0) ? "<button  class='btn btn-inverse' docid=" + value.Key + " onclick='return deleteDocFile(this)'><i class='fa fa-times'></i></button>" : "";
                            var oneContent = "<div class='form-group' style='text-align:center'>" +
                                "<div class='col-sm-4'>" + btnview + btnUpdate + btnDelete +
                                "</div>" +
                                "<label class='col-sm-2 control-label'>" + getDateString(value.DValue) + "</label>" +
                                "<label class='col-sm-6 control-label'>" + value.Value + "</label>" +
                                "</div>";
                            hasefile = hasefile | (IsNullOrEmpty(value.Value2) ? false : true);
                            $('#div_docslist').append(oneContent);
                        });
                        if (hasefile > 0) {
                            $('#btn_downloadall').show();
                        } else {
                            $('#btn_downloadall').hide();
                        }
                    } catch (e) {

                    }
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


function AddLgsDoc(sender) {
    var docId = $(sender).attr('docid') * 1;
    var onespr = searchInArray(docList, 'Key', docId)[0];
    var startBox = "<div class='box'><div class='box-body'>";
    var endBox = "</div></div>";
    var dpayment = '';
    var comment = '';
    var hasvalue = false;
    if (onespr && docId !== 0) {
        dpayment = getDateString(onespr.DValue2);
        comment = onespr.Value;
        hasvalue = true;
    }
    var onelineContent =
        // start box
        "<div class='form-group' id='div_one_line'>" +
            "<div class='row'>" +
            "<div class='col-md-12'>" +
            "<div class='box-body'>" +
            "<div class='form-horizontal'>" +
            "<div class='form-group'><label class='col-sm-12' style='text-align:center'>Veuillez complèter les information 请添加详情</label></div>" +
            // new line
            "<div class='form-group'>" +
            "<label class='col-sm-2 control-label'>Date</label>" +
            "<div class='col-sm-10'><input type='text' id='SdcDate' class='form-control datepicker' value='" + dpayment + "' /></div>" +
            "</div>" +
            // new line
            "<div class='form-group'>" +
            "<label class='col-sm-2 control-label'>Commentaire</label>" +
            "<div class='col-sm-10'><textarea row='3' id='SdcComment' class='form-control' ></textarea></div>" +
            "</div>" +
            "<div class='form-group'>" +
            "<div class='col-sm-12'></div>" +
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
            "<span class='btn btn-inverse fileinput-button'>" +
            "<i class='fa fa-plus'></i>" +
            "<span>Fichier</span>" +
            "<input type='file' id='iptUploadFilePopUp' name='files[]' accept='application/pdf' onchange='getFileDataPopUp(this);'></span>" +
            "<button type='reset' class='btn btn-inverse cancel'  style='display: none;' id='btnCancelUploadFilePopUp' onclick='return hideUploadPopUp()'><i class='fa fa-ban'></i><span>Annuler</span></button>" +
            "<button class='btn btn-inverse bootbox-close-button' style='display:none;' onclick='return false'><span>Annuler</span></button></div> <!-- The global progress information -->" +
            "<div class='col-md-12' style='text-align: center; margin-bottom: 20px;'>" +
            "<div>File Name : <span id='uploadFileNamePopUp'></span></div><br/>" +
            "</div></div></form>" +
            "</div>" +

            // close box
            "</div></div></div></div></div>";

    var btnAddUpdate = "<button class='btn btn-inverse' id='btn_add_update_discount' name='btn_add_update_discount' docid='" + docId + "' onclick='return SaveLgsDoc(this)'><span>Sauvegarder</span></button>";
    var btnClose = "<button class='btn btn-default bootbox-close-button' id='btn_close_cin_payment' onclick='return false'><span>Annuler</span></button>";

    var btns = "<div class='modal-body center'>" + btnClose + btnAddUpdate + "</div>";
    var onecontent = startBox + onelineContent + btns + endBox;

    var title = 'Document 文件';
    bootbox.dialog({
        title: title,
        message: onecontent
    }).find('.modal-dialog').css({
        'width': '30%'
    }).find('.modal-content').css({
        'margin-top': function() {
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

    $('#SdcDate').datepicker();
    if (hasvalue) {
        $('#SdcComment').text(comment);
        $('#SdcDate').val(dpayment);
    } else {
        $('#SdcDate').val(getToday());
    }

    return false;
}

function SaveLgsDoc(sender) {
    $(sender).prop('disabled', true);
    var comment = $('#SdcComment').val();
    var docname = $('#uploadFileNamePopUp').text();
    var sdcdate = $('#SdcDate').val();
    var docid = $(sender).attr('docId') * 1;
    var sodId = getUrlVars()['lgsId'];

    if (!IsNullOrEmpty(sdcdate)) {
        var sodPayment = [];
        var onespr = {
            Key: docid,
            //DcValue: 0,
            Key2: 0,
            Value: comment,
            Value4: sodId,
            Value3: sdcdate,
            Value2: docname
        };
        sodPayment.push(onespr);
        var dtpName = "Logistics";
        if (sodId) {
            ShowPleaseWait();
            if (sodPayment.length) {
                var jsondata = JSON.stringify({ dtpName: dtpName, docs: sodPayment });
                var url = window.webservicePath + "/SaveUpdateDocuments";
                $.ajax({
                    url: url,
                    type: 'POST',
                    contentType: 'application/json; charset=utf-8',
                    data: jsondata,
                    dataType: 'json',
                    success: function(data) {
                        var jsdata = data.d;
                        var data2Treat = jQuery.parseJSON(jsdata);
                        HidePleaseWait();
                        var sprIds = data2Treat;
//                        $.each(data2Treat, function(name, value) {
//                            sprIds += value + ",";
//                        });
                        uploadDocFileClick(sprIds);
                        $(sender).prop('disabled', false);
                        //js_search();
                    },
                    error: function(data) {
                        HidePleaseWait();
                        alert(data.responseText);
                        $(sender).prop('disabled', false);
                    }
                });
            }
        }
    } else {
        if (IsNullOrEmpty(sdcdate)) {
            $('#SdcDate').addClass('error_border');
            $('#SdcDate').focus();
        } else {
            $('#SdcDate').removeClass('error_border');
        }
        $(sender).prop('disabled', false);
    }
    return false;
}


function uploadDocFileClick(docId) {
    ///create a new FormData object
    var formData = new FormData(); //var formData = new FormData($('form')[0]);
    ///get the file and append it to the FormData object
    if ($('#iptUploadFilePopUp')[0].files[0]) {
        formData.append('file', $('#iptUploadFilePopUp')[0].files[0]);
        var itemId = getUrlVars()['lgsId'];
        var url = "../../Services/UploadFilesGeneral.ashx?type=15&lgsId=" + encodeURIComponent(itemId) + "&docId=" + encodeURIComponent(docId);
        if (docId) {
            ///AJAX request
            $.ajax(
            {
                ///server script to process data
                url: url, //web service
                type: 'POST',
                complete: function () {
                    //on complete event     
                },
                progress: function (evt) {
                    //progress event    
                },
                ///Ajax events
                beforeSend: function (e) {
                    //before event  
                },
                success: function (e) {
                    //success event
                    $('#btn_close_cin_payment').click();
                    $('#btn_savepmt_cancel').click();
                    loadDocInfo();
                },
                error: function (e) {
                    //errorHandler
                    $('#btn_close_cin_payment').click();
                    $('#btn_savepmt_cancel').click();
                    loadDocInfo();
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
    } else {
        $('#btn_close_cin_payment').click();
        loadDocInfo();
        //loadCinPayementInfo();
    }
}


function viewDocFile(sender) {
    var lgsId = getUrlVars()['lgsId'];
    var startBox = "<div class='box'><div class='box-body'>";
    var endBox = "</div></div>";
    var onelineContent =
    // start box
        "<div class='form-group' id='div_one_line'>" +
            "<div class='row'>" +
            "<div class='col-md-12'>" +
            "<div class='box-body'>" +
            "<div class='form-horizontal'>" +
            "<div class='col-md-12'>" +
    // this div is for album photo
            "<div class='row' style='margin-bottom: 20px;'>" +
            "<div class='col-md-12' id='div_album_photo' style='text-align:center;'>" +
            "<iframe height='600' width='100%' id='iframepdfForDocPdf'></iframe>" +
            "</div>" +
    // cancel and save buttons
            "</div>" +
            "</div>" +

    // close box
            "</div></div></div></div></div>";
    var btnClose = "<button class='btn btn-default bootbox-close-button' id='btn_close_cin_payment' onclick='return false'><span>Clôturer</span></button>";

    var btns = "<div class='modal-body center'>" + btnClose + "</div>";
    var onecontent = startBox + onelineContent + btns + endBox;

    var title = $(sender).attr("comment");
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
            var h = (w - b) * 0.05;
            return h + "px";
        }
    }).find('.modal-header').css({
        'background': 'url(../../img/menu_005_bg.jpg) repeat-x',
        'text-align': 'center',
        'color': 'white'
    });
    var docid = $(sender).attr('docid');
    var src = "../Common/PageForPDF.aspx?type=15&foreignId=" + encodeURIComponent(lgsId) + "&docId=" + encodeURIComponent(docid);
    $('#iframepdfForDocPdf').attr('src', src);
    return false;
}

function deleteDocFile(sender) {
    var docid = $(sender).attr('docid');
    var msg = "Veuillez confirmer la suppresion de FICHIER<br/>请确认是否删除!";
    var title = "CONFIRMATION 确认";
    var content = "<div class='box'><div class='box-body' style='height: 100px;'>" +
        "<div class='form-horizontal'>" +
        "<div class='col-md-12'>" +
        "<div class='form-group'>" +
        "<div class='col-sm-12' style='text-align:center;font-size: 18pt;'>" + msg + "</div></div></div></div></div></div>"
        + "<div class='modal-footer center'>" +
        "<button type='button' class='btn btn-default' onclick='closeDialog()'>Annuler</button>" +
        "<button type='button' class='btn btn-inverse' docid='" + docid + "' onclick='deleteDocFileClick(this)'>SUPPRIMER</button>" +
        "</div>";
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

function deleteDocFileClick(sender) {
    var docid = $(sender).attr('docid') *1 ;
    var forId = getUrlVars()['lgsId'];
    if (forId) {
        var url = window.webservicePath + "/DeleteDocumentFile";
        var datastr = "{dtpName:'Logistics' ,forId:'" + forId + "',docId:" + docid+ "}";
        $.ajax({
            type: "POST",
            url: url,
            contentType: "application/json; charset=utf-8",
            data: datastr,
            dataType: "json",
            success: function (data) {
                loadDocInfo();
            },
            error: function (data) {
                loadDocInfo();
            }
        });
    }
    closeDialog();
    return false;
}


function DownloadAllDocs(sender) {
    var lgsId = getUrlVars()['lgsId'];
    var height = $(window).height();
    var width = $(window).width();
    width = width * 0.8;
    width = width.toFixed(0);
    var url = "../Common/PageForPDF.aspx?type=16&foreignId=" + encodeURIComponent(lgsId);
    window.open(url, 'popupWindow', 'height=' + height + ', width=' + width + ', top=0, left=0, toolbar=no, menubar=no, scrollbars=no, resizable=no,location=no, status=no');

    return false;
}

// 上传文件