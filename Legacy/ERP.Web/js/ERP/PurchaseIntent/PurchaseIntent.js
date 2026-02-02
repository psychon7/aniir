$(document).ready(init);

function init() {
    var focus = getUrlVars()['focus'];
    //LoadSupplier();
    ShowPleaseWait();
    $.when(_getCom(dtdGetCommercial)).done(function() {
        HidePleaseWait();
        $.each($('.datepicker'), function(idx, value) {
            $(value).datepicker();
        });
        LoadPin(focus);
        LoadSupplier();
        initMode();
        if (_isCreate) {
            $('#DateCreation').val(getToday());
        }
    });

    SetLanguageBar();
}

var currentItem = [];

var currentItemIsClosed = false;
var currentItemHasOrder = false;
function LoadPin(focus) {
    var pinId = getUrlVars()['pinId'];
    if (pinId) {
        var url = window.webservicePath + "/LoadPin";
        var datastr = "{itemId:'" + pinId + "'}";
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
                    var oneItem = data2Treat;
                    currentItem = [];
                    currentItem = oneItem;
                    currentItemIsClosed = currentItem.PinClosed;
                    currentItemHasOrder = currentItem.PinHasSupplierOrder;
                    if (currentItemHasOrder) {
                        //$('#li_sod').show();
                    }
                    $.each(currentItem, function(name, value) {
                        if (name === 'Creator') {
                            setFieldValue('CreatorName', value.FullName, true);
                        } else {
                            setFieldValue(name, value, true);
                        }
                    });

                    if (currentItemIsClosed || currentItemHasOrder) {
                        if (currentItemIsClosed) {
                            $('.isclosed').hide();
                        }
                        if (currentItemHasOrder) {
                            $('.hasOrder').hide();
                            getSods(focus);
                        } else {
                            $('#div_sols').hide();
                        }
                    } else {
                        $('#div_sols').hide();
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

function js_create_update_item() {
    var item = Object();
    item.PinName = $('#PinName').val();
    item.PinClosed = $('#PinClosed').is(':checked');
    item.SupplierComment = $('#SupplierComment').val();
    item.InterComment = $('#InterComment').val();
    item.PinFId = getUrlVars()['pinId'];
    item.DateCreation = getCreationDate($('#DateCreation').val());

    var jsondata = JSON.stringify({ item: item });
    $.ajax({
        url: 'PurchaseIntent.aspx/CreateUpdatePurchaseIntent',
        type: 'POST',
        contentType: 'application/json; charset=utf-8',
        data: jsondata,
        dataType: 'json',
        success: function (data) {
            var dfoId = data.d;
            var url = 'PurchaseIntent.aspx';
            var newUrl = url + '?pinId=' + dfoId + '&mode=view';
            document.location.href = newUrl;
        },
        error: function (data) {
        }
    });
}

var allCommercials = [];
var dtdGetCommercial = $.Deferred();
var _getCom = function (dtdGetCommercial) {
    var url = window.webservicePath + "/GetSubCommercial";
    $.ajax({
        type: "POST",
        url: url,
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        success: function (data) {
            var jsdata = data.d;
            var data2Treat = jQuery.parseJSON(jsdata);
            if (data2Treat !== '-1') {
                allCommercials = [];
                allCommercials = data2Treat;
                dtdGetCommercial.resolve();
            } else {
                // authentication error
                AuthencationError();
                dtdGetCommercial.resolve();
            }
        },
        error: function (data) {
            var test = '';
            dtdGetCommercial.resolve();
        }
    });
    return dtdGetCommercial.promise();
}





var lineCount = 0;
var currentLineId = 0;
var supplierProducts = [];

function setAddUpdateLine(oneLine, forUpdateCreate) {
    $('#hf_prd_id').text('');
    $('#hf_pit_id').text('');
    var create = oneLine ? false : true;
    var LineId = oneLine ? oneLine.PilId : lineCount;
    lineCount--;
    var LineOrder = oneLine ? oneLine.Order : '1';
    var Description = oneLine ? oneLine.Description : '';
    var Comment = oneLine ? oneLine.Comment : '';
    var PrdId = oneLine ? oneLine.PrdId : '';
    var PrdName = oneLine ? oneLine.PrdName : '';
    PrdName = (PrdName == 'null' || PrdName == null) ? '' : PrdName;
    var PitId = oneLine ? oneLine.PitId : '';
    var PitName = oneLine ? oneLine.PitName : '';
    var Quantity = oneLine ? oneLine.Quantity : '';
    var PrdImgPath = oneLine ? oneLine.PrdImgPath : '';
    var PitSupRef = oneLine ? oneLine.SupplierRef : '';
    var PitSupId = oneLine ? oneLine.SupId : 0;
    //var ThisSupplierProdcuts = oneLine ? oneLine.SupplierProdcuts : [];
    var PrdDescription = oneLine ? oneLine.PrdDescription : '';
    var CliName = oneLine ? oneLine.Client : '';
    var Power = oneLine ? oneLine.Power : '';
    var Driver = oneLine ? oneLine.Driver : '';
    var Length = oneLine ? oneLine.Length : '';
    var Width = oneLine ? oneLine.Width : '';
    var Height = oneLine ? oneLine.Height : '';
    var UGR = oneLine ? oneLine.UGR : '';
    var LumEff = oneLine ? oneLine.Efflum : '';
    var CRI = oneLine ? oneLine.CRI : '';
    var Logistic = oneLine ? oneLine.Logistic : '3';
    var DeadLine = oneLine ? getDateString(oneLine.Deadline) : '';
    var Supplier = oneLine ? oneLine.SupplierCompanyName : '';
    var TempC = oneLine ? oneLine.TempColor : '';
    var FeatureCode = oneLine ? oneLine.FeatureCode : '';
    FeatureCode = FeatureCode == null ? '' : FeatureCode;
    $('#hf_prd_id').text(PrdId);
    $('#hf_pit_id').text(PitId);


//    supplierProducts = [];
//    supplierProducts = ThisSupplierProdcuts ;

    //var supPossible = [];
//    $.each(allSupplier, function(order, oneSup) {
//        if (SupplierProdcuts.indexOf(oneSup.Id) >= 0) {
//            supPossible.push(oneSup);
//        }
//    });

//    $.each(ThisSupplierProdcuts , function(order, supPrd) {
//        var oneSup = searchInArray(allSupplier, 'Id', supPrd.SupId);
//        if (oneSup.length > 0) {
//            $.each(oneSup, function(order2, sup) {
//                supPossible.push(sup);
//            });
//        }
//    });


    var disabled = currentItemIsClosed ? " disabled " : "";
    var startBox = "<div class='box'><div class='box-body'>";
    var endBox = "</div></div>";

    var onelineContent =
        // start box
        "<div class='form-group' id='div_one_line'>" +
            "<div class='row'>" +
            "<div class='col-md-12'>" +
            "<div class='box-body'>" +
            "<div class='form-horizontal'>" +
            "<!--///////////////////new line/////////////////-->" +
            "<div class='form-group variant'>" +
            "<label class='col-sm-2 control-label fieldRequired'>Client</label>" +
            "<div class='col-sm-2'><input class='form-control' required='' id='Cli_zzz_' " + disabled + "  name='Cli_zzz_' value='" + CliName + "' lineId='" + LineId + "' /></div>" +
            "<label class='col-sm-2 control-label'>Deadline</label>" +
            "<div class='col-sm-2'><input class='form-control datepicker' id='Deadl_zzz_' " + disabled + "  name='Deadl_zzz_' value='" + DeadLine + "' lineId='" + LineId + "' /></div>" +
            "<label class='col-sm-2 control-label'>Fournisseur</label>" +
            //"<div class='col-sm-2'><input id='SupName_zzz_' name='SupName_zzz_'  " + disabled + " class='form-control' value='" + Supplier + "' lineId='" + LineId + "' '/></div>" +
            "<div class='col-sm-2'>" +
            "<select class='form-control' id='SupName_zzz_' name='SupName_zzz_' lineId='" + LineId + "' ></select>"+
            "</div>" +
            "</div>" +
            "<!--///////////////////new line/////////////////-->" +
            "<div class='form-group variant'>" +
            "<label class='col-sm-2 control-label fieldRequired'>Référence (Nom) du produit</label>" +
            "<div class='col-sm-2'><input class='form-control' required='' id='PrdId_zzz_' " + disabled + "  name='PrdId_zzz_' value='" + PrdName + "' onkeyup='checkContent(this)' lineId='" + LineId + "' /></div>" +
            "<label class='col-sm-2 control-label sale'>Référence du sous produit</label>" +
            "<div class='col-sm-2 sale'><select id='PitId_zzz_' name='PitId_zzz_' " + disabled + "  class='form-control' lineId='" + LineId + "' onchange='pitChange(this)'/></select></div>" + "<div class='col-sm-4'></div>" +
            "<label class='col-sm-2 control-label fieldRequired'>Quantité</label>" +
            "<div class='col-sm-2'><input type='number' required='' min='1' onkeypress='validateNumber(event)' " + disabled + "  value='" + Quantity + "' lineId='" + LineId + "'class='form-control' id='Quantity_zzz_' name='Quantity_zzz_' maxlength='5' /></div>" +
            "</div>" +
            "<!--///////////////////new line/////////////////-->" +
            "<div class='form-group'>" +
            "<label class='col-sm-2 control-label'>Puissance</label>" +
            "<div class='col-sm-2'><div class='input-group'><input class='form-control' type='number' min='1' id='Power_zzz_' " + disabled + "  name='Power_zzz_' value='" + Power + "' lineId='" + LineId + "' /><span class='input-group-addon'>W</span></div></div>" +
            "<label class='col-sm-2 control-label'>Driver</label>" +
            "<div class='col-sm-2'><input class='form-control' id='Driver_zzz_' " + disabled + "  name='Driver_zzz_' value='" + Driver + "' lineId='" + LineId + "' /></div>" +
            "<label class='col-sm-2 control-label'>Temp Couleur</label>" +
            "<div class='col-sm-2'><div class='input-group'><input class='form-control' id='TempC_zzz_' " + disabled + "  name='TempC_zzz_' value='" + TempC + "' lineId='" + LineId + "' /><span class='input-group-addon'>K</span></div></div>" +
            "</div>" +
            "<!--///////////////////new line/////////////////-->" +
            "<div class='form-group'>" +
            "<label class='col-sm-2 control-label'>Longueur (diamètre)</label>" +
            "<div class='col-sm-2'><div class='input-group'><input class='form-control' type='number' min='1'  id='Length_zzz_' " + disabled + "  name='Length_zzz_' value='" + Length + "' lineId='" + LineId + "' /><span class='input-group-addon'>mm</span></div></div>" +
            "<label class='col-sm-2 control-label'>Largeur</label>" +
            "<div class='col-sm-2'><div class='input-group'><input class='form-control' type='number' min='1' id='Width_zzz_' " + disabled + "  name='Width_zzz_' value='" + Width + "' lineId='" + LineId + "' /><span class='input-group-addon'>mm</span></div></div>" +
            "<label class='col-sm-2 control-label'>Hauteur</label>" +
            "<div class='col-sm-2'><div class='input-group'><input class='form-control' type='number' min='1' id='Height_zzz_' " + disabled + "  name='Height_zzz_' value='" + Height + "' lineId='" + LineId + "' /><span class='input-group-addon'>mm</span></div></div>" +
            "</div>" +
            "<!--///////////////////new line/////////////////-->" +
            "<div class='form-group'>" +
            "<label class='col-sm-2 control-label'>Efficacité lumineuse &ge;</label>" +
            "<div class='col-sm-2'><div class='input-group'><input class='form-control' type='number' min='1' id='LumEff_zzz_' " + disabled + "  name='LumEff_zzz_' value='" + LumEff + "' lineId='" + LineId + "' /><span class='input-group-addon'>lum/w</span></div></div>" +
            "<label class='col-sm-2 control-label'>UGR &le;</label>" +
            "<div class='col-sm-2'><input class='form-control' type='number' min='1' id='UGR_zzz_' " + disabled + "  name='UGR_zzz_' value='" + UGR + "' lineId='" + LineId + "' /></div>" +
            "<label class='col-sm-2 control-label'>CIR &ge;</label>" +
            "<div class='col-sm-2'><input class='form-control' type='number' min='1' id='CRI_zzz_' " + disabled + "  name='CRI_zzz_' value='" + CRI + "' lineId='" + LineId + "' /></div>" +
            "</div>" +
            "<!--///////////////////new line/////////////////-->" +
            "<div class='form-group'>" +
            "<label class='col-sm-2 control-label'>Logistique</label>" +
            "<div class='col-sm-2'><select id='Logs_zzz_' name='Logs_zzz_' " + disabled + "  class='form-control' lineId='" + LineId + "' >" +
            "<option value='1' data-value='1' " + (Logistic == 1 ? "selected='selected'" : "") + " >Avion le plus rapide</option>" +
            "<option value='2' data-value='2' " + (Logistic == 2 ? "selected='selected'" : "") + ">Avion le moins cher</option>" +
            "<option value='3' data-value='3' " + (Logistic == 3 ? "selected='selected'" : "") + ">Bateau</option>" +
            "</select></div>" +
            "<label class='col-sm-2 control-label'>Ordre</label>" +
            "<div class='col-sm-2'><input type='number' " + disabled + "  value='" + LineOrder + "' lineId='" + LineId + "'class='form-control' id='Order_zzz_' name='Order_zzz_' maxlength='3' /></div>" +
            "<label class='col-sm-2 control-label' title='Code de fonction pour faciliter le recherche et le mémoire, 特征码方便查找和记忆用'>Code fonc. 特征码</label>" +
            "<div class='col-sm-2'>" +
            "<input class='form-control' id='FeatureCode_zzz_' name='FeatureCode_zzz_'  value='" + FeatureCode + "' lineId='" + LineId + "' />" +
            "</div>" +
            "</div>" +
            "<!--///////////////////new line/////////////////-->" +
            "<div class='form-group  variant'>" +
            "<label class='col-sm-2 control-label'>Commercial 1</label>" +
            "<div class='col-sm-2'>" +
            "<select class='form-control' id='UsrCom1_zzz_' name='UsrCom1_zzz_' lineId='" + LineId + "' ></select></div>" +
            "<label class='col-sm-2 control-label'>Commercial 2</label>" +
            "<div class='col-sm-2'>" +
            "<select class='form-control' id='UsrCom2_zzz_' name='UsrCom2_zzz_' lineId='" + LineId + "' ></select></div>" +
            "<label class='col-sm-2 control-label'>Commercial 3</label>" +
            "<div class='col-sm-2'>" +
            "<select class='form-control' id='UsrCom3_zzz_' name='UsrCom3_zzz_' lineId='" + LineId + "' ></select>" +
            "</div>" +
            "</div>" +
            "<!--///////////////////new line/////////////////-->" +
            "<div class='form-group  variant'>" +
            "<div class='col-sm-3'></div><div class='col-sm-3' id='div_prd_image'><!-- image -->" +
            (create ? "" : "<img src='../../Services/ShowOutSiteImage.ashx?file=" + PrdImgPath + "' alt=''   class='img-responsive'  style='width: 100%' />") +
            "</div><div class='col-sm-6'></div>" +
            "</div>" +
            "<!--///////////////////new line/////////////////-->" +
            "<div class='form-group'>" +
            "<label class='col-sm-2 control-label'>Description de produit</label>" +
            "<div class='col-sm-10'><textarea rows='7' disabled cols='1' lineId='" + LineId + "'  id='PrdDescription_zzz_' value='" + PrdDescription + "' name='PrdDescription_zzz_' class='form-control'></textarea>" +
            "</div>" +
            "</div>" +
            "<!--///////////////////new line/////////////////-->" +
            "<div class='form-group'>" +
            "<label class='col-sm-2 control-label'>Commentaire de produit</label>" +
            "<div class='col-sm-4'><textarea rows='7' " + disabled + "  cols='1' lineId='" + LineId + "'  id='Description_zzz_' value='" + Description + "' name='Description_zzz_' class='form-control'></textarea>" + "</div>" +
            "<label class='col-sm-2 control-label'>Commentaire</label>" +
            "<div class='col-sm-4'><textarea rows='7' " + disabled + "  cols='1' lineId='" + LineId + "'  id='Comment_zzz_' value='" + Comment + "' name='Comment_zzz_' class='form-control'></textarea>" +
            "</div>" +
            "</div>" +
            // close box
            "</div></div></div></div></div>";

    var btnAddUpdate = "<button class='btn btn-inverse' lineId='" + LineId + "' id='btn_add_update_line_zzz_' name='btn_add_update_line_zzz_' onclick='return AddUpdateOneLine(this)'><span>" + (!create ? "Mettre à jour" : "Ajouter") + "</span></button>";

    var btnDelete = "<button class='btn btn-inverse' lineId='" + LineId + "' id='btn_delete_line_zzz_' name='btn_delete_line_zzz_' onclick='return delete_Line_Confirm(this)'><span>Supprimer</span></button>";
    var btnClose = "<button class='btn btn-default bootbox-close-button' onclick='return false'><span>Annuler</span></button>";

    var btns = "<div class='modal-body center'>" + btnClose + (currentItemIsClosed ? "" : btnAddUpdate) + "</div>";

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
                                    $("<option></option>").attr("value", pit.FId).attr("data-value", pit.PitPurchasePrice).attr("description", pit.PitDescription).attr('selected', true).text(pit.PitRef)
                                );
                            } else {
                                $(subPrdId).append(
                                    $("<option></option>").attr("value", pit.FId).attr("data-value", pit.PitPurchasePrice).attr("description", pit.PitDescription).text(pit.PitRef)
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
    if (Comment) {
        $('#Comment_' + currentLineId).text(Comment);
    }
    if (PrdDescription) {
        $('#PrdDescription_' + currentLineId).text(PrdDescription);
    }

//    if (supPossible.length > 0) {
//        var supplierId = '#SupId_' + LineId;
//        $.each(supPossible, function(order, onesup) {
//            if (onesup.Id === PitSupId) {
//                $(supplierId).append($("<option></option>").attr("value", onesup.Id).attr('data-value',onesup.FId).attr('selected', true).text(onesup.CompanyName));
//            } else {
//                if (!currentItemIsClosed) {
//                    $(supplierId).append($("<option></option>").attr("value", onesup.Id).attr('data-value', onesup.FId).text(onesup.CompanyName));
//                }
//            }
//        });
//        if (!currentItemIsClosed) {
//            $(supplierId).change();
//        }
//    }
    $.each($('.datepicker'), function(idx, value) {
        $(value).datepicker();
    });
    if (oneLine) {
        preLoadProductInstance(oneLine.PrdId);
    }

    // for commercial
    $('#UsrCom1_' + LineId).append($("<option>Sélectionner un commercial</option>").attr("value", "0"));
    $('#UsrCom2_' + LineId).append($("<option>Sélectionner un commercial</option>").attr("value", "0"));
    $('#UsrCom3_' + LineId).append($("<option>Sélectionner un commercial</option>").attr("value", "0"));

    $.each(allCommercials, function(order, oneCom) {
        if (LineId <= 0) {
            if (connectedUser.Id === oneCom.Id) {
                $('#UsrCom1_' + LineId).append($("<option>" + oneCom.FullName + "</option>").attr("value", oneCom.Id).attr("selected", true));
            } else {
                $('#UsrCom1_' + LineId).append($("<option>" + oneCom.FullName + "</option>").attr("value", oneCom.Id));
            }
        } else {
            if (oneLine &&oneLine.UsrIdCom1 == oneCom.Id) {
                $('#UsrCom1_' + LineId).append($("<option>" + oneCom.FullName + "</option>").attr("value", oneCom.Id).attr("selected", true));
            } else {
                $('#UsrCom1_' + LineId).append($("<option>" + oneCom.FullName + "</option>").attr("value", oneCom.Id));
            }
        }
        if (oneLine &&oneLine.UsrIdCom2 == oneCom.Id) {
            $('#UsrCom2_' + LineId).append($("<option>" + oneCom.FullName + "</option>").attr("value", oneCom.Id).attr("selected", true));
        } else {
            $('#UsrCom2_' + LineId).append($("<option>" + oneCom.FullName + "</option>").attr("value", oneCom.Id));
        }

        if (oneLine &&oneLine.UsrIdCom3 == oneCom.Id) {
            $('#UsrCom3_' + LineId).append($("<option>" + oneCom.FullName + "</option>").attr("value", oneCom.Id).attr("selected", true));
        } else {
            $('#UsrCom3_' + LineId).append($("<option>" + oneCom.FullName + "</option>").attr("value", oneCom.Id));
        }

        //$('#UrCom2_' + LineId).append($("<option>" + oneCom.FullName + "</option>").attr("value", oneCom.Id));
        //$('#UsrCom3_' + LineId).append($("<option>" + oneCom.FullName + "</option>").attr("value", oneCom.Id));
    });

    $.each(allSupplier, function(order, oneSup) {
        if (oneLine && oneLine.SupId == oneSup.Id) {
            $('#SupName_' + LineId).append($("<option>" + oneSup.CompanyName + "</option>").attr("value", oneSup.Id).attr("selected", true));
        } else {
            $('#SupName_' + LineId).append($("<option>" + oneSup.CompanyName + "</option>").attr("value", oneSup.Id));
        }
    });
}


//function setAddUpdateLine(oneLine, forUpdateCreate) {
//    $('#hf_prd_id').text('');
//    $('#hf_pit_id').text('');
//    

//    var create = oneLine ? false : true;
//    var LineId = oneLine ? oneLine.PilId : lineCount;
//    lineCount--;
//    var LineOrder = oneLine ? oneLine.Order : '1';
//    var Description = oneLine ? oneLine.Description : '';
//    var PrdId = oneLine ? oneLine.PrdId : '';
//    var PrdName = oneLine ? oneLine.PrdName : '';
//    var PitId = oneLine ? oneLine.PitId : '';
//    var PitName = oneLine ? oneLine.PitName : '';
//    var Quantity = oneLine ? oneLine.Quantity : '';
//    var PrdImgPath = oneLine ? oneLine.PrdImgPath : '';
//    var PitSupRef  =  oneLine ? oneLine.SupplierRef : '';
//    var PitSupId =  oneLine ? oneLine.SupId : 0;
//    var ThisSupplierProdcuts = oneLine ? oneLine.SupplierProdcuts : [];
//    var PrdDescription = oneLine ? oneLine.PrdDescription : '';

//    supplierProducts = [];
//    supplierProducts = ThisSupplierProdcuts ;

//    var supPossible = [];
////    $.each(allSupplier, function(order, oneSup) {
////        if (SupplierProdcuts.indexOf(oneSup.Id) >= 0) {
////            supPossible.push(oneSup);
////        }
////    });

//    $.each(ThisSupplierProdcuts , function(order, supPrd) {
//        var oneSup = searchInArray(allSupplier, 'Id', supPrd.SupId);
//        if (oneSup.length > 0) {
//            $.each(oneSup, function(order2, sup) {
//                supPossible.push(sup);
//            });
//        }
//    });

//    //alert(supPossible[0].Id);
//    

//    if (oneLine) {
//        $('#hf_prd_id').text(oneLine.PrdFId);
//        $('#hf_pit_id').text(oneLine.PitFId);
//    }

//    
//    var disabled = currentItemIsClosed ? " disabled " : "";
//    var startBox = "<div class='box'><div class='box-body'>";
//    var endBox = "</div></div>";
//    var onelineContent =
//    // start box
//        "<div class='form-group' id='div_one_line'>" +
//            "<div class='row'>" +
//            "<div class='col-md-12'>" +
//            "<div class='box-body'>" +
//            "<div class='form-horizontal'>" +
//            "<div class='form-group variant'>" +
//            "<label class='col-sm-3 control-label'>Référence du produit</label>" +
//            "<div class='col-sm-3'><input class='form-control' id='PrdId_zzz_' " + disabled + "  name='PrdId_zzz_' value='" + PrdName + "' onkeyup='checkContent(this)' lineId='" + LineId + "' /></div>" +
//            "<label class='col-sm-3 control-label sale'>Référence du sous produit</label>" +
//            "<div class='col-sm-3 sale'><select id='PitId_zzz_' name='PitId_zzz_' " + disabled + "  class='form-control' lineId='" + LineId + "' onchange='pitChange(this)'/></select></div>" +
//            "</div>" +
//            "<div class='form-group'>" +
//            "<label class='col-sm-3 control-label'>Fournisseur</label>" +
//            "<div class='col-sm-3'><select id='SupId_zzz_' name='SupId_zzz_'  " + disabled + " class='form-control' lineId='" + LineId + "' onchange='supplierPrdchanged(this)'></select></div>" +
//            "<label class='col-sm-3 control-label'>Leur référence</label>" +
//            "<div class='col-sm-3'><input type='text' disabled value='" + PitSupRef + "' lineId='" + LineId + "'class='form-control' id='Sup_ref_zzz_' name='Sup_ref_zzz_' maxlength='3' /></div>" +
//            "</div>" +
//            "<div class='form-group'>" +
//            "<label class='col-sm-3 control-label'>Ordre</label>" +
//            "<div class='col-sm-3'><input type='number' " + disabled + "  value='" + LineOrder + "' lineId='" + LineId + "'class='form-control' id='Order_zzz_' name='Order_zzz_' maxlength='3' /></div>" +
//            "<label class='col-sm-3 control-label'>Quantité</label>" +
//            "<div class='col-sm-3'><input type='number' min='1' onkeypress='validateNumber(event)' " + disabled + "  value='" + Quantity + "' lineId='" + LineId + "'class='form-control' id='Quantity_zzz_' name='Quantity_zzz_' maxlength='3' /></div>" +
//            "</div>" +
//            "<div class='form-group  variant'>" +
//            "<div class='col-sm-3'></div><div class='col-sm-3' id='div_prd_image'><!-- image -->" +
//            (create ? "" : "<img src='../../Services/ShowOutSiteImage.ashx?file=" + PrdImgPath + "' alt=''   class='img-responsive'  style='width: 100%' />") +
//            "</div><div class='col-sm-6'></div>" +
//            "</div>" +
//            "<div class='form-group'>" +
//            "<label class='col-sm-3 control-label'>Description de produit</label>" +
//            "<div class='col-sm-9'><textarea rows='7' disabled cols='1' lineId='" + LineId + "'  id='PrdDescription_zzz_' value='" + PrdDescription + "' name='PrdDescription_zzz_' class='form-control'></textarea>" +
//            "</div>" +
//            "</div>" +
//            "<div class='form-group'>" +
//            "<label class='col-sm-3 control-label'>Commentaire</label>" +
//            "<div class='col-sm-9'><textarea rows='7' " + disabled + "  cols='1' lineId='" + LineId + "'  id='Description_zzz_' value='" + Description + "' name='Description_zzz_' class='form-control'></textarea>" +
//            "</div>" +
//            "</div>" +
//    // close box
//            "</div></div></div></div></div>";

//    var btnAddUpdate = "<button class='btn btn-inverse' lineId='" + LineId + "' id='btn_add_update_line_zzz_' name='btn_add_update_line_zzz_' onclick='return AddUpdateOneLine(this)'><span>" + (!create ? "Mettre à jour" : "Ajouter") + "</span></button>";
//    var btnDelete = "<button class='btn btn-inverse' lineId='" + LineId + "' id='btn_delete_line_zzz_' name='btn_delete_line_zzz_' onclick='return delete_Line_Confirm(this)'><span>Supprimer</span></button>";
//    var btnClose = "<button class='btn btn-default bootbox-close-button' onclick='return false'><span>Annuler</span></button>";

//    var btns = "<div class='modal-body center'>"  + btnClose + (currentItemIsClosed? "" : btnAddUpdate)+ "</div>";

//    var onecontent = startBox + onelineContent + btns + endBox;

//    onecontent = replaceAll(onecontent, '_zzz_', '_' + LineId);
//    currentLineId = LineId;
//    

//    var title = !create ? 'Mettre à jour cette linge' : 'Ajouter une ligne';
//    bootbox.dialog({
//        title: title,
//        message: onecontent
//    }).find('.modal-dialog').css({
//        'width': '70%'
//    }).find('.modal-content').css({
//        'margin-top': function () {
//            var w = $(window).height();
//            var b = $(".modal-dialog").height();
//            // should not be (w-h)/2
//            var h = (w - b) * 0.1;
//            return h + "px";
//        }
//    }).find('.modal-header').css({
//        'background': 'url(../../img/menu_005_bg.jpg) repeat-x',
//        'text-align': 'center',
//        'color': '#C0C0C0'
//    });
//    setAutoComplete(LineId);
//    if (!create) {
//        //currentLineId
//        var subPrdId = '#PitId_' + currentLineId;
//        var urlpit = window.webservicePath + "/GetPitByRef";
//        try {
//            $.ajax({
//                url: urlpit,
//                data: "{ 'pitRef': '', prdId:'" + PrdId + "'}",
//                dataType: "json",
//                type: "POST",
//                contentType: "application/json; charset=utf-8",
//                success: function (data) {
//                    var jsdata2 = data.d;
//                    var data2Treat = jQuery.parseJSON(jsdata2);
//                    $(subPrdId).empty();
//                    if ($.isArray(data2Treat)) {
//                        $.each(data2Treat, function(name, pit) {
//                            if (pit.PitId === PitId) {
//                                $(subPrdId).append(
//                                    $("<option></option>").attr("value", pit.FId).attr("data-value", pit.PitPurchasePrice).attr("description", pit.PitDescription).attr('selected', true).text(pit.PitRef)
//                                );
//                            } else {
//                                $(subPrdId).append(
//                                    $("<option></option>").attr("value", pit.FId).attr("data-value", pit.PitPurchasePrice).attr("description", pit.PitDescription).text(pit.PitRef)
//                                );
//                            }
//                        });
//                    }
//                },
//                error: function (response) {
//                }
//            });
//        } catch (e) {
//            var test = e;
//        }
//    }
//    if (Description) {
//        $('#Description_' + currentLineId).text(Description);
//    }
//    
//    if (PrdDescription) {
//        $('#PrdDescription_' + currentLineId).text(PrdDescription);
//    }

//    if (supPossible.length > 0) {
//        var supplierId = '#SupId_' + LineId;
//        $.each(supPossible, function(order, onesup) {
//            if (onesup.Id === PitSupId) {
//                $(supplierId).append($("<option></option>").attr("value", onesup.Id).attr('data-value',onesup.FId).attr('selected', true).text(onesup.CompanyName));
//            } else {
//                if (!currentItemIsClosed) {
//                    $(supplierId).append($("<option></option>").attr("value", onesup.Id).attr('data-value', onesup.FId).text(onesup.CompanyName));
//                }
//            }
//        });
//        if (!currentItemIsClosed) {
//            $(supplierId).change();
//        }
//    }

//    if (oneLine) {
//        preLoadProductInstance(oneLine.PrdId);
//    }

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

function checkContent(sender) {
    if (!$(sender).val()) {
        $('#hf_prd_id').text('');
    }
}

var productInstances = [];
function setAutoComplete(lineId) {
    var url = window.webservicePath + "/GetProductsByRef";
    $("#PrdId_" + lineId).autocomplete({
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
                    response($.map(data2Treat, function(item) {
                        return {
                            label: item.PrdRef,
                            val: item.FId,
                            datavalue: item.PrdImg,
                        }
                    }));

                    $('#PitId_' + lineId).find('option').remove();
                    $('#PrdDescription_' + lineId).text('');
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
                    productInstances = data2Treat;
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
                    $(subPrdId).change();
                },
                error: function(response) {
                }
            });
            supplierForSelectProduct(i.item.label, lineId);
        },
        minLength: 2
    });
}

function supplierForSelectProduct(prdRef,lineId) {
    if (prdRef) {
        var url = window.webservicePath + "/SerachSupplierProduct";
        var CompanyName = '';
        var Reference = prdRef;
        var jsondata = JSON.stringify({ companyName: CompanyName, reference: Reference });
        $.ajax({
            url: url,
            type: 'POST',
            contentType: 'application/json; charset=utf-8',
            data: jsondata,
            dataType: 'json',
            success: function(data) {
                var jsdata = data.d;
                var jsondata = jQuery.parseJSON(jsdata);
                supplierProducts = [];
                supplierProducts = jsondata.sort(dynamicSort("SupplierName"));
                //supplierProducts = jsondata;
                //$('#SupId_' + lineId).change();
            },
            error: function(data) {
            }
        });
    }
}

function AddUpdateOneLine(sender) {
    var lineId = $(sender).attr('lineId');

    var PrdId = $('#PrdId_' + lineId);
    var PitId = $('#PitId_' + lineId + ' option:selected');
    var Quantity = $('#Quantity_' + lineId);
    var Order = $('#Order_' + lineId);
    var Description = $('#Description_' + lineId);
    var PrdDescription = $('#PrdDescription_' + lineId);
    var SupId = $('#SupId_' + lineId);
    //var SupRef = $('#Sup_ref_' + lineId);
    var Client = $('#Cli_' + lineId);
    var Deadline = $('#Deadl_' + lineId);
    var SupName = $('#SupName_' + lineId);
    var Power = $('#Power_' + lineId);
    var Driver = $('#Driver_' + lineId);
    var TempC = $('#TempC_' + lineId);
    var Length = $('#Length_' + lineId);
    var Width = $('#Width_' + lineId);
    var Height = $('#Height_' + lineId);
    var LumEff = $('#LumEff_' + lineId);
    var UGR = $('#UGR_' + lineId);
    var CRI = $('#CRI_' + lineId);
    var Logs = $('#Logs_' + lineId);
    var Comment = $('#Comment_' + lineId);
    var FeatureCode = $('#FeatureCode_' + lineId);
    var UsrIdCom1 = $('#UsrCom1_' + lineId + ' option:selected').val() * 1;
    var UsrIdCom2 = $('#UsrCom2_' + lineId + ' option:selected').val() * 1;
    var UsrIdCom3 = $('#UsrCom3_' + lineId + ' option:selected').val() * 1;
    var SupId = $('#SupName_' + lineId + ' option:selected').val() * 1;

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
//        PrdId.attr('required', '');
//        PitId.attr('required', '');
    checkOK = CheckRequiredFieldInOneDiv('div_one_line');
    if (checkOK) {
        var order = Order.val() * 1 + 0;
        var prdId = $('#hf_prd_id').text();
        var pitId = $('#hf_pit_id').text();
        var quantity = Quantity.val().replace(',', '.') * 1;

        var description = Description.val();

        var oneline = {};
        oneline.PilId = lineId;
        oneline.PinFId = getUrlVars()['pinId'];
        oneline.Order = order;
        oneline.Description = description;
        oneline.PrdDescription = PrdDescription.val();
        oneline.PrdFId = prdId;
        oneline.PitFId = pitId;
        oneline.Quantity = quantity;
        //oneline.SupId = $(SupId).val() * 1;
        //oneline.SupplierRef = $(SupRef).val();
        oneline.Client = Client.val();
        oneline.Deadline =  getCreationDate(Deadline.val());
        oneline.SupplierCompanyName = SupName.val();
        oneline.Power = Power.val().replace(',', '.') * 1;
        oneline.PrdName = PrdId.val();

        oneline.Driver = Driver.val();
        oneline.TempColor = TempC.val();
        oneline.Length = Length.val().replace(',', '.') * 1;
        oneline.Width = Width.val().replace(',', '.') * 1;
        oneline.Height = Height.val().replace(',', '.') * 1;
        oneline.EffLum = LumEff.val().replace(',', '.') * 1;
        oneline.UGR = UGR.val().replace(',', '.') * 1;
        oneline.CRI = CRI.val().replace(',', '.') * 1;
        oneline.Logistic = Logs.val();
        oneline.FeatureCode = FeatureCode.val();
        oneline.Comment = Comment.val();
        oneline.UsrIdCom1 = UsrIdCom1;
        oneline.UsrIdCom2 = UsrIdCom2;
        oneline.UsrIdCom3 = UsrIdCom3;
        oneline.SupId = SupId;


        var jsondata = JSON.stringify({ oneLine: oneline });
        var url = window.webservicePath + "/InsertUpdatePil";
        $.ajax({
            url: url,
            type: 'POST',
            contentType: 'application/json; charset=utf-8',
            data: jsondata,
            dataType: 'json',
            success: function(data) {
                $('.bootbox-close-button').click();
                loadAllLines();
            },
            error: function(data) {
                alert(data.responseText);
            }
        });

    }
    return false;
}

function pitChange(sender) {
    var pitId = $(sender).val();
    $("#hf_pit_id").text($(sender).val());
    var description = $(sender).find(":selected").attr('description');
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
    if (Description) {
        $('#Description_' + clnId).text(Description);
    }
    $('#SupId_' + clnId).empty();
    if (onePit.ProductSuppliers.length > 0) {
        var suppliers4Prd = [];
        $.each(allSupplier, function(order, oneSup) {
            if (onePit.ProductSuppliers.indexOf(oneSup.FId) >= 0) {
                suppliers4Prd.push(oneSup);
            }
        });
        if (suppliers4Prd.length > 0) {
            $.each(suppliers4Prd, function(name, value) {
                $('#SupId_' + clnId).append($("<option></option>")
                    .attr("data-value", value.FId)
                    .attr("value", value.Id)
                    .text(value.CompanyName));
            });
        }
        $('#SupId_' + clnId).change();
    }
}

var itemLines = [];

function loadAllLines() {
    itemLines = [];
    var pinId = getUrlVars()['pinId'];
    var url = window.webservicePath + "/LoadPils";
    $.ajax({
        url: url,
        type: 'POST',
        contentType: 'application/json; charset=utf-8',
        data: "{pinId:'" + pinId + "'}",
        dataType: 'json',
        success: function(data) {
            var jsdata = data.d;
            var jsondata = jQuery.parseJSON(jsdata);
            if (jsondata !== '-1') {
                itemLines = [];
                itemLines = jsondata;
                if (itemLines.length > 0) {
                    $('#btn_generate_pdf').show();
                    if (!currentItemHasOrder) {
                        $("#btn_validate_costplan").show();
                    }
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
                    var supplier = value.Supplier1;//value.SupplierCompanyName;


                    var CliName = value.Client;
                    var Power = value.Power;
                    var Driver = value.Driver;
                    var Length = value.Length;
                    var Width = value.Width;
                    var Height = value.Height;
                    var UGR = value.UGR;
                    var LumEff = value.Efflum;
                    var CRI = value.CRI;
                    var Logistic = value.Logistic;
                    var TempColor = value.TempColor;
                    Logistic = Logistic == 1 ? 'Avion le plus rapide' : Logistic == 2 ? 'Avion le moins cher' : 'Bateau';
                    var DeadLine = getDateString(value.Deadline);
                    var FeatureCode = value.FeatureCode;


                    var description = replaceAll(value.PrdDescription, '\n', '</br>') + '</br>---------------------------</br>' + replaceAll(value.Description, '\n', '</br>');

                    var otherInfo = (IsNullOrEmpty(Power) ? "" : "Puissance : " + Power + " W</br>") +
                    (IsNullOrEmpty(Driver) ? "" : "Driver : " + Driver + "</br>") +
                    (IsNullOrEmpty(TempColor) ? "" : "Température couleur : " + TempColor + " K</br>") +
                    (IsNullOrEmpty(Length) ? "" : "Longueur : " + Length + " mm</br>") +
                    (IsNullOrEmpty(Width) ? "" : "Largeur : " + Width + " mm</br>") +
                    (IsNullOrEmpty(Height) ? "" : "Hauteur : " + Height + " mm</br>") +
                    (IsNullOrEmpty(LumEff) ? "" : "Efficacité lumineuse ≥ " + LumEff + " lum/w</br>") +
                    (IsNullOrEmpty(UGR) ? "" : "UGR ≤ " + UGR + "</br>") +
                    (IsNullOrEmpty(CRI) ? "" : "CRI ≥ " + CRI + "</br>")+
                    (IsNullOrEmpty(FeatureCode) ? "" : "<span style='color:red;'>Code fonct. 特征码 : " + FeatureCode + "</span></br>");

                    description = otherInfo + description;


                    var oneline = "<tr class='" + lineclass + "'>" +
                        "<td style='cursor: pointer'><input type='checkbox' id='cbx_pil_" + value.PilId + "' pilId='" + value.PilId + "' onclick='display2SupplierOrderButton()'/></td>" +
                        "<td class='label_left' style='cursor: pointer;' itemId='" + value.PilId + "'  onclick='return modify_line_click(this)'>" + value.Order + "</td>" +
                        "<td class='label_left'  style='cursor: pointer;' itemId='" + value.PilId + "'  onclick='return modify_line_click(this)'>" + CliName + "</td>" +
                        "<td class='label_left'  style='cursor: pointer;' itemId='" + value.PilId + "'  onclick='return modify_line_click(this)'>" + DeadLine + "</td>" +
                        "<td class='label_left' style='cursor: pointer;' itemId='" + value.PilId + "'  onclick='return modify_line_click(this)'>" + prdname + "</td>" +
                        "<td class='label_left'>" + pitname + "</td>" +
                        "<td class='label_left'>" + supplier + "</td>" +
                        "<td>" + (value.PrdImgPath ? ("<img src='../../Services/ShowOutSiteImage.ashx?file=" + value.PrdImgPath + "' height='40' width='40' />") : "") + "</td>" +
                        "<td class='label_left'>" + description + "</td>" +
                        "<td class='label_right'>" + quantity + "</td>" +
                        "<td class='label_left'>" + Logistic + "</td>";

                    var btnDuplicate = "<button class='btn btn-inverse' title='Dupliquer' id='" + value.PilId + "' itemId='" + value.PilId + "' onclick='return duplicate_pil_click(this)'><i class='fa fa-copy'></i></button>";

                    var btns = "<td>" +
                        "<button class='btn btn-inverse' id='btnpilmodify_" + value.PilId + "' title='Modifier' id='" + value.PilId + "' itemId='" + value.PilId + "' onclick='return modify_line_click(this)'><i class='fa fa-edit'></i></button>" + btnDuplicate +
                        "<button class='btn btn-inverse' title='Supprimer' id='" + value.PilId + "' itemId='" + value.PilId + "' onclick='return delete_Line_Confirm(this)'><i class='fa fa-times'></i></button>" +
                        (value.SolId == 0 ? "" : "<button class='btn btn-inverse' title='Commande fournisseur' id='" + value.PilId + "' itemId='" + value.PilId + "' onclick='return SolsClick(this)'>CF</button>") +
                        "</td>";

                    var endline = "</tr>";

                    oneline += (currentItemIsClosed ? "" : btns) + endline;

                    linecount ++;
                    $('#tbody_lines').append(oneline);
                });

                var pilId = getUrlVars()['pilId'];
                if (pilId !== "undefined") {
                    try {
                    if (!paraClicked) {
                        $('#btnpilmodify_' + pilId).click();
                        paraClicked = true;
                    }
                    } catch (e) {
                        
                    }
                }
                //$('#tbody_lines')
            } else {
            }
        },
        error: function(data) {
        }
    });
}

var paraClicked = false;

function SolsClick(sender) {
    var pilId = $(sender).attr('itemId') * 1;
    if (pilId != 0) {
        ShowPleaseWait();
        
        var jsondata = JSON.stringify({ pilId: pilId });
        var url = window.webservicePath + "/LoadSolByPil";
        $.ajax({
            type: "POST",
            url: url,
            contentType: "application/json; charset=utf-8",
            dataType: "json",
            data: jsondata,
            success: function(data) {
                var jsdata = data.d;
                var data2Treat = jQuery.parseJSON(jsdata);
                if (data2Treat !== '-1') {
                    //HidePleaseWait();
                    setSolContent(data2Treat);
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
    return false;
}

function setSolContent(sols) {
    var startBox = "<div class='box'><div class='box-body'>";
    var endBox = "</div></div>";
    var linecode = "";
    $.each(sols, function(name, value) {
        var prdname = value.PrdName;
        var pitname = value.PitName;
        var quantity = value.Quantity;
        var supPrdref = value.SupplierRef;
        var CliName = value.Client;
        var Power = value.Power;
        var Driver = value.Driver;
        var Length = value.Length;
        var Width = value.Width;
        var Height = value.Height;
        var UGR = value.UGR;
        var LumEff = value.Efflum;
        var CRI = value.CRI;
        var Logistic = value.Logistic;
        var TempColor = value.TempColor;
        Logistic = Logistic == 1 ? 'Avion le plus rapide' : Logistic == 2 ? 'Avion le moins cher' : 'Bateau';
        var desPrd = (value.PrdDescription == "" || value.PrdDescription == '' || value.PrdDescription == null) ?
            '' : value.PrdDescription;
        desPrd = replaceAll(desPrd, '\n', '</br>');
        var newline = (desPrd != '' ? '</br>---------------------------</br>' : '');
        var description = desPrd + newline + replaceAll(value.Description, '\n', '</br>');
        description = (description == "" || description == '' || description == null) ?
            '' : description;
        description = replaceAll(description, '\n', '</br>');
        var otherInfo = (IsNullOrEmpty(Power > 0) ? "" : "Puissance : " + Power + " W</br>") +
        (IsNullOrEmpty(Driver) ? "" : "Driver : " + Driver + "</br>") +
        (IsNullOrEmpty(TempColor) ? "" : "Température couleur : " + TempColor + " K</br>") +
        (IsNullOrEmpty(Length) ? "" : "Longueur : " + Length + " mm</br>") +
        (IsNullOrEmpty(Width) ? "" : "Largeur : " + Width + " mm</br>") +
        (IsNullOrEmpty(Height) ? "" : "Hauteur : " + Height + " mm</br>") +
        (IsNullOrEmpty(LumEff) ? "" : "Efficacité lumineuse ≥ " + LumEff + " lum/w</br>") +
        (IsNullOrEmpty(UGR) ? "" : "UGR ≤ " + UGR + "</br>") +
        (IsNullOrEmpty(CRI) ? "" : "CRI ≥ " + CRI + "</br>");
        newline = (otherInfo != '' ? '</br>---------------------------</br>' : '');
        var infocompl = description + newline + replaceAll(otherInfo, '\n', '</br>');

        var DProduction = getDateString(value.DProduction);
        var DExpDelivery = getDateString(value.DExpDelivery);
        var DDelivery = getDateString(value.DDelivery);
        var DShipping = getDateString(value.DShipping);
        var DExpArrival = getDateString(value.DExpArrival);
        var FeatureCode = value.FeatureCode;
        var Transporter = value.Transporter;
        var LogsNbr = value.LogsNbr;
        var Logistic = value.Logistic;
        Logistic = Logistic == 1 ? 'Avion le plus rapide' : Logistic == 2 ? 'Avion le moins cher' : 'Bateau';

        var infoShipPrd = ("<span style='color:red;'>Logistique 运货方式 : </br>" + Logistic + "</span></br>") +
        (IsNullOrEmpty(DProduction) ? "" : "D.Prod. 开始生产日期 : " + DProduction + "</br>") +
        (IsNullOrEmpty(DExpDelivery) ? "" : "D. achèvmt. prv. 预计交期 : " + DExpDelivery + "</br>") +
        (IsNullOrEmpty(DDelivery) ? "" : "D. achèvmt. rél. 实际交期 : " + DDelivery + "</br>") +
        (IsNullOrEmpty(DShipping) ? "" : "D. expé. 发货日期 : " + DShipping + "</br>") +
        (IsNullOrEmpty(DExpArrival) ? "" : "D. arr. prv. 预计到达日期 : " + DExpArrival + "</br>") +
        (IsNullOrEmpty(Transporter) ? "" : "Transporteur 物流公司 : " + Transporter + "</br>") +
        (IsNullOrEmpty(LogsNbr) ? "" : "Logis Num. 物流编号 : " + LogsNbr + "</br>") +
        (IsNullOrEmpty(FeatureCode) ? "" : "<span style='color:red;'>Code fonct. 特征码 : " + FeatureCode + "</span></br>");

        linecode += "<tr>";
        linecode += "<td>" + value.SodCode + "</td>";
        linecode += "<td>" + value.Client + "</td>";
        linecode += "<td>" + prdname + "</td>";
        linecode += "<td class='label_left'>" + infocompl + "</td>";
        linecode += "<td class='label_left'>" + infoShipPrd + "</td>";
        linecode += "<td class='label_right'>" + quantity + "</td>";
        linecode += "<td class='label_right'>" + value.UnitPrice + "</td>";
        linecode += "<td class='label_right'>" + value.UnitPriceWithDis + "</td>";
        linecode += "<td class='label_right'>" + value.TotalPrice + "</td>";
        linecode += "<td class='label_right'>" + value.TotalCrudePrice + "</td>";
        linecode += "<td><button type='button' class='btn btn-inverse' title='Consulter cette ligne de la commande fournisseur' solId='" + value.SolId + "' sodFId='" + value.SodFId + "' onclick='return ViewSol(this)'><i class='fa fa-eye'></i></button></td>";
        linecode += "</tr>";
    });
    var onelineContent =
        // start box
        "<div class='form-group' id='div_one_line'>" +
            "<div class='row'>" +
            "<div class='col-md-12'>" +
            "<div class='box-body'>" +
            "<div class='form-horizontal'>" +
            "<!--///////////////////new line/////////////////-->" +
            "<div class='form-group variant'>" +
            "<table cellpadding='0' cellspacing='0' border='0' class='table table-striped table-bordered table-hover'><thead><tr role='row'><th rowspan='1' colspan='1'>CF Code</th><th rowspan='1' colspan='1'>Client</th><th rowspan='1' colspan='1'>Produit</th><th rowspan='1' colspan='1'>Description</th><th rowspan='1' colspan='1'>Les détails</th><th rowspan='1' colspan='1'>Quantité</th><th rowspan='1' colspan='1'>Prix d'achat</th><th rowspan='1' colspan='1'>Prix remisé</th><th rowspan='1' colspan='1'>Total H.T</th><th rowspan='1' colspan='1'>Total T.T.C</th><th rowspan='1' colspan='1' class='thBtns'></th></tr></thead>" +
            "<tbody id='tbody_lines' style='text-align: center !important'>" + linecode +
            "</tbody>" +
            "</table>" +
            "</div>" +
            "</div></div></div></div></div>";

    var btnClose = "<button class='btn btn-default bootbox-close-button' id='btn_add_sol_close' onclick='return false'><span>Clôturer</span></button>";

    var btns = "<div class='modal-body center'>" + btnClose + "</div>";
    var onecontent = startBox + onelineContent + btns + endBox;

    var title = "Consulter les lignes de la commande fournisseur";
    bootbox.dialog({
        title: title,
        message: onecontent
    }).find('.modal-dialog').css({
        'width': '95%'
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
    HidePleaseWait();
}

function ViewSol(sender) {
    var solid = $(sender).attr('solId') * 1;
    var sodId = $(sender).attr('sodFId');
    //console.log(sodId);
    var url = '../SupplierOrder/SupplierOrder.aspx?sodId=' + sodId + "&mode=view&solId=" + solid;
    window.open(url, '_blank');
    return false;
}

function CreateSodClick() {
    LoadSupplier("SetCreateSodPopup");
    return false;
}

var selectedPils = [];
function SetCreateSodPopup() {
var startBox = "<div class='box'><div class='box-body'>";
    var endBox = "</div></div>";
    var suppliers = "<option value='0'>Sélectionner un fournisseur</option>";
    $.each(allSupplier, function(name, sup) {
        suppliers += "<option value='" + sup.Id + "'>" + sup.CompanyName + "</option>";
    });
    selectedPils = [];
    var pils_checkbox = $("input[id^='cbx_pil_']:checked");
    $.each(pils_checkbox, function(name, value) {
        var pilid = $(value).attr('pilid') * 1;
        //console.log(pilid );
        var onePil = searchFieldValueInArray(itemLines, 'PilId', pilid);
        if (onePil) {
            selectedPils.push(onePil);
        }
    });
    
    var pilsContent = "";
    $.each(selectedPils, function(name, oneline) {
        var Power = oneline.Power;
        var Driver = oneline.Driver;
        var Length = oneline.Length;
        var Width = oneline.Width;
        var Height = oneline.Height;
        var UGR = oneline.UGR;
        var LumEff = oneline.Efflum;
        var CRI = oneline.CRI;
        var TempColor = oneline.TempColor;
        var description = replaceAll(oneline.PrdDescription, '\n', '</br>') + '</br>---------------------------</br>' + replaceAll(oneline.Description, '\n', '</br>');

        var Logistic = oneline.Logistic;
        Logistic = Logistic == 1 ? 'Avion le plus rapide' : Logistic == 2 ? 'Avion le moins cher' : 'Bateau';

        var otherInfo = (IsNullOrEmpty(Power) ? "" : "Puissance : " + Power + " W</br>") +
        (IsNullOrEmpty(Driver) ? "" : "Driver : " + Driver + "</br>") +
        (IsNullOrEmpty(TempColor) ? "" : "Température couleur : " + TempColor + " K</br>") +
        (IsNullOrEmpty(Length) ? "" : "Longueur : " + Length + " mm</br>") +
        (IsNullOrEmpty(Width) ? "" : "Largeur : " + Width + " mm</br>") +
        (IsNullOrEmpty(Height) ? "" : "Hauteur : " + Height + " mm</br>") +
        (IsNullOrEmpty(LumEff) ? "" : "Efficacité lumineuse ≥ " + LumEff + " lum/w</br>") +
        (IsNullOrEmpty(UGR) ? "" : "UGR ≤ " + UGR + "</br>") +
        (IsNullOrEmpty(CRI) ? "" : "CRI ≥ " + CRI + "</br>");

        description = otherInfo + description;

        pilsContent += "<tr>" +
            "<td class='label_left'>" + oneline.Order + "</td>" +
            "<td class='label_left'>" + oneline.Client + "</td>" +
            "<td class='label_left'>" + getDateString(oneline.Deadline) + "</td>" +
            "<td class='label_left'>" + oneline.PrdName + "</td>" +
            "<td class='label_left'>" + oneline.PitName + "</td>" +
            "<td class='label_left'>" + oneline.SupplierCompanyName + "</td>" +
            "<td class='label_left'>" + (oneline.PrdImgPath ? ("<img src='../../Services/ShowOutSiteImage.ashx?file=" + oneline.PrdImgPath + "' height='40' width='40' />") : "") + "</td>" +
            "<td class='label_left'>" + description + "</td>" +
            "<td class='label_right'>" + oneline.Quantity + "</td>" +
            "<td class='label_left'>" + Logistic + "</td>" +
            "<td class='label_left'></td>" +
            "</tr>";
    });

    var btnCancel = "<button type='button' class='btn btn-default' onclick='closeDialog()'>Annuler</button>";
    var btnCreateSod = "<button type='button' class='btn btn-inverse' onclick='return CreateSod();' id='btn_createCF'>Créer la commande fournisseur</button>";

    var tableContent = "<table cellpadding='0' cellspacing='0' border='0' class='table table-striped table-bordered table-hover'>" +
        "<thead id='thead_cost_plan_line'>" +
        "<tr role='row'>" +
        "<th rowspan='1' colspan='1'>Ordre</th>" +
        "<th rowspan='1' colspan='1'>Client</th>" +
        "<th rowspan='1' colspan='1'>Deadline</th>" +
        "<th rowspan='1' colspan='1'>Produit</th>" +
        "<th rowspan='1' colspan='1'>Notre Réf</th>" +
        "<th rowspan='1' colspan='1'>Fournisseur</th>" +
        "<th rowspan='1' colspan='1'>Image</th>" +
        "<th rowspan='1' colspan='1'>Description</th>" +
        "<th rowspan='1' colspan='1'>Quantité</th>" +
        "<th rowspan='1' colspan='1'>Logistique</th>" +
        "<th rowspan='1' colspan='1'>Commande Fournisseur</th>" +
        "</tr>" +
        "</thead>" +
        "<tbody id='tbody_lines' style='text-align: center !important'>" +
        pilsContent +
        "</tbody>" +
        "</table>";


    var onelineContent =
        // start box
        "<div class='form-group' id='div_one_line'>" +
            "<div class='row'>" +
            "<div class='col-md-12'>" +
            "<div class='box-body'>" +
            "<div class='form-horizontal'>" +
            "<!--///////////////////new line/////////////////-->" +
            "<div class='form-group variant' id='div_create_sod'>" +
            "<label class='col-sm-1 control-label fieldRequired'>Fournisseur</label>" +
            "<div class='col-sm-2'><select id='SltSupplier_' name='SltSupplier_' class='form-control' required='' onchange='SltSupChange(this)' >" + suppliers + "</select></div>" +
            "<div class='col-sm-2 center'><button type='button' class='btn btn-inverse' onclick='return CreateSupplier()'>Créer un fournisseur</button></div>" +
            "<label class='col-sm-2 control-label fieldRequired'>Nom de commande fournisseur</label>" +
            "<div class='col-sm-2'><input id='ip_sodname' name='ip_sodname' class='form-control' required='' /></div>" +
            "<label class='col-sm-1 control-label'>Ajouter dans CF existant</label>" +
            "<div class='col-sm-2'><select id='SltSod_' name='SltSod_' class='form-control' onchange='SltSodChange(this)'></select></div>" +
            "</div>" +
            "<!--///////////////////new line/////////////////-->" +
            "<div class='form-group variant'>" +
            tableContent +
            "</div>" +
            "<!--///////////////////new line/////////////////-->" +
            "<div class='form-group center'>"
            + btnCancel +btnCreateSod+
            "</div>" +
            // close box
            "</div></div></div></div></div>";

    var title = 'Créer la commande fournisseur';
    bootbox.dialog({
        title: title,
        message: (startBox + onelineContent + endBox)
    }).find('.modal-dialog').css({
        'width': '90%'
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
}

function SltSupChange(sender) {
    var supId = $(sender).val();
    ShowPleaseWait();
    var jsondata = JSON.stringify({ supId: supId, isSub: false });
    var url = window.webservicePath + "/GetSodBySupId";
    $.ajax({
        type: "POST",
        url: url,
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        data: jsondata,
        success: function(data) {
            var jsdata = data.d;
            var data2Treat = jQuery.parseJSON(jsdata);
            if (data2Treat !== '-1') {
                HidePleaseWait();
                $('#SltSod_').empty();
                $('#SltSod_').append($("<option></option>").attr("value", 0).text('Sélectionner une CF'));
                $.each(data2Treat, function(name, value) {
                    $('#SltSod_').append($("<option></option>").attr("value", value.SodId).text(value.SodCode + ' | ' + value.TotalAmountTtc.toFixed(2)+ ' $'));
                });

                $('#ip_sodname').prop('required', true);
                $('#ip_sodname').prop('disabled', false);
                $('#btn_createCF').text('Créer la commande fournisseur');
            } else {
                HidePleaseWait();
                AuthencationError();
            }
        },
        error: function(data) {
            HidePleaseWait();
            var test = '';
        }
    });
}

function SltSodChange(sender) {
    var sodId = $(sender).val();
    if (sodId != 0) {
        $('#ip_sodname').prop('required',false);
        $('#ip_sodname').val('');
        $('#ip_sodname').prop('disabled',true);
        $('#btn_createCF').text('Ajouter dans cette commande fournisseur');
    } else {
        $('#ip_sodname').prop('required',true);
        //$('#ip_sodname').val('');
        $('#ip_sodname').prop('disabled',false);
        $('#btn_createCF').text('Créer la commande fournisseur');
    }
}

function CreateSod() {
    var checkOK = CheckRequiredFieldInOneDiv('div_create_sod');
    if (checkOK && selectedPils.length > 0) {
        ShowPleaseWait();
        var sodname = $('#ip_sodname').val();
        var supId = $('#SltSupplier_').find('option:selected').attr('value') * 1;
        var sodId = $('#SltSod_').val() * 1;

        var url = window.webservicePath + "/CreateSodByPils";
        var pinId = getUrlVars()['pinId'];
        var pilIds = [];

        $.each(selectedPils, function(name, value) {
            pilIds.push(value.PilId * 1);
        });

        var jsondata = JSON.stringify({ pinId: pinId, supId: supId, sodName: sodname, sodId: sodId, pilIds: pilIds });

        $.ajax({
            type: "POST",
            url: url,
            contentType: "application/json; charset=utf-8",
            dataType: "json",
            data: jsondata,
            success: function(data) {
                var jsdata = data.d;
                var data2Treat = jQuery.parseJSON(jsdata);
                if (data2Treat !== '-1') {
                    //HidePleaseWait();
                    var sodId = data2Treat;
                    var newUrl = '../SupplierOrder/SupplierOrder.aspx' + '?sodId=' + sodId + '&mode=view';
                    document.location.href = newUrl;
                } else {
                HidePleaseWait();
                    AuthencationError();
                }
            },
            error: function(data) {
                HidePleaseWait();
                var test = '';
            }
        });
    } else {
        alert('Veuillez remplir les champs obligatoires !!!');
    }
    return false;
}

function CreateSupplier() {
    closeDialog();
    var url = '../Supplier/Supplier.aspx?mode=create&hideHeader=yes&hideSideMenu=yes&hideAllBtn=no';
    pageSnapShot(url);
    return false;
}

function selectAllPils(sender) {
    var ischecked = $(sender).is(':checked');
    var pils = $("input[id^='cbx_pil_']");
    $.each(pils , function(name, value) {
        $(value).prop('checked',ischecked);
    });
    display2SupplierOrderButton();
}

function display2SupplierOrderButton() {
    var pils = $("input[id^='cbx_pil_']:checked").length > 0;
    if (pils) {
        $('#btn_create_sod').show();
    } else {
        $('#btn_create_sod').hide();
    }
}

function duplicate_pil_click(sender) {
    var pils = $("input[id^='cbx_pil_']");
    $.each(pils , function(name, value) {
        $(value).prop('checked',false);
    });
    $('#btn_create_sod').hide();
var itemId = $(sender).attr('itemId') * 1;
    MsgPopUpWithResponseChoice('CONFIRMATION', "Veuillez confirmer à dupliquer cette ligne? ", 'Dupliquer', 'dulicatePil(' + itemId + ')', 'Annuler');
    return false;
}

function dulicatePil(pilId) {
    var pinId= getUrlVars()['pinId'];
    var url = window.webservicePath + "/DuplicatePil";
    ShowPleaseWait();
    $.ajax({
        type: "POST",
        url: url,
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        data: "{pinId:'" + pinId + "',pilId:" + pilId + "}",
        success: function(data) {
            var jsdata = data.d;
            var data2Treat = jQuery.parseJSON(jsdata);
            if (data2Treat !== '-1') {
                loadAllLines();
                HidePleaseWait();
            } else {
            HidePleaseWait();
                AuthencationError();
            }
        },
        error: function(data) {
            HidePleaseWait();
            var test = '';
        }
    });
}

function modify_line_click(sender) {
    var pils = $("input[id^='cbx_pil_']");
    $.each(pils , function(name, value) {
        $(value).prop('checked',false);
    });
    $('#btn_create_sod').hide();
    var itemId= $(sender).attr('itemId') * 1;
    var oneCln = searchFieldValueInArray(itemLines,'PilId',itemId);
    if (oneCln) {
        setAddUpdateLine(oneCln);
    }
    return false;
}

function delete_Line_Confirm(sender) {
    var pils = $("input[id^='cbx_pil_']");
    $.each(pils , function(name, value) {
        $(value).prop('checked',false);
    });
    $('#btn_create_sod').hide();
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
    var pinId = getUrlVars()['pinId'];
    var url = window.webservicePath + "/DeletePil";
    $.ajax({
        type: "POST",
        url: url,
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        data: "{pinId:'" + pinId + "',pilId:" + itemId + "}",
        success: function(data) {
            var jsdata = data.d;
            var data2Treat = jQuery.parseJSON(jsdata);
            if (data2Treat !== '-1') {
                loadAllLines();
            } else {
            HidePleaseWait();
                AuthencationError();
            }
        },
        error: function(data) {
            var test = '';
        }
    });
}

function downloadPdf(sender) {
    var dfoId = getUrlVars()['pinId'];
    dfoId = encodeURIComponent(dfoId);
    window.open('../Common/PageDownLoad.aspx?pinId=' + dfoId, '_blank');
    return false;
}

function ValiderPinClick() {
    var title = "CONFIRMER";
    var content = "<div class='box'><div class='box-body' style='height: 200px;'>" +
        "<div class='form-horizontal'>" +
        "<div class='col-md-12'>" +
        "<div class='form-group'>" +
        "<div class='col-sm-12' style='text-align:center;font-size: 15pt;'>Veuillez confirmer la validation et choisir un FOURNISSEUR. <br/> Un fois vous confirmez, cette intention d\'achat n\'est plus modifiable !</div>" +
        "</div>" +
        "</div>" +
        "<div class='form-group'>" +
        "<label class='col-sm-3 control-label fieldRequired'>Fournisseur</label>" +
        "<div class='col-sm-9' style='text-align:center;'><select class='form-control' id='supId' onchange='SupplierChanged(this)'><select>" +
        "</div>" +
        "</div>" +
        "<div class='form-group'>" +
        "<label class='col-sm-3 control-label fieldRequired'>Contact</label>" +
        "<div class='col-sm-9' style='text-align:center;'><select class='form-control' id='scoId'><select>" +
        "</div>" +
        "</div>" +
        "</div></div></div>" +
        "<div class='modal-footer center'>" +
        "<button type='button' class='btn btn-default' onclick='closeDialog()'>Annuler</button>" +
        "<button type='button' class='btn btn-inverse' onclick='return ValiderPIN()'>Valider</button>" +
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

    $.each(allSupplier, function(name, value) {
        $('#supId').append($("<option></option>")
            .attr("data-value", value.FId)
            .attr("value", value.Id)
            .text(value.CompanyName));
    });
    $('#supId').change();
    return false;
}

function NewValiderPinClick() {
    var nullSup = searchInArray(itemLines, 'SupId', null);
    if (nullSup.length > 0) {
        var title = 'ATTENTION';
        var msg = 'Il y a quelque lignes sans fournisseur, confirmez-vous à valider sans ces lignes';
        var content = "<div class='box'><div class='box-body' style='height: 100px;'>" +
            "<div class='form-horizontal'>" +
            "<div class='col-md-12'>" +
            "<div class='form-group'>" +
            "<div class='col-sm-12' style='text-align:center;font-size: 18pt;'>" + msg + "</div></div></div></div></div></div>"
            + "<div class='modal-footer center'>" +
            "<button type='button' class='btn btn-default' onclick='closeDialog()'>Annuler</button>" +
            "<button type='button' class='btn btn-inverse' onclick='PassPin2SodWithSupplier()'>Valider quand même</button></div>";
        bootbox.dialog({
            closeButton: false,
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
    } else {
        //PassPin2SodWithSupplier();
        var title = 'Confirmation';
        var msg = 'Veullez confimer la validation, une fois vous la validez, cette intention n\'est plus modifiable ! ';
        var fun = 'PassPin2SodWithSupplier()';
        var btnname = 'VALIDER';
        var dfbtnname = 'Annuler';
        MsgPopUpWithResponseChoice(title, msg, btnname, fun, dfbtnname);
    }
}

function PassPin2SodWithSupplier() {
    var pinId = getUrlVars()['pinId'];
    if (pinId) {
        myApp.showPleaseWait();
        var url = window.webservicePath + "/PassPin2Sod_New";
        $.ajax({
            type: "POST",
            url: url,
            contentType: "application/json; charset=utf-8",
            data: "{pinId:'" + pinId + "'}",
            dataType: "json",
            success: function(data) {
                var jsdata = data.d;
                var data2Treat = jQuery.parseJSON(jsdata);
                if (data2Treat !== -1) {
                    var msg = data2Treat + ' commandes fournisseur ont été créées! \r\nVeuillez les consulter en bas !';
                    myApp.showPleaseWaitWithText(msg);
                    setTimeout(refrestPageWithFocus, 2500);
                    //getSods(true);
                    //LoadPin(true);
                } else {
                    myApp.hidePleaseWait();
                    // authentication error
                    AuthencationError();
                }
            },
            error: function(data) {
                var test = '';
            }
        });
    }
    return false;
}

function refrestPageWithFocus() {
    var newurl = window.location.href;
    newurl += '&focus=true';
    window.location = newurl;
}

function ValiderPIN() {
    var pinId = getUrlVars()['pinId'];
    var supId = $('#supId').find('option:selected').attr('data-value');
    var scoId = $('#scoId').val() * 1;
    myApp.showPleaseWait();
    var url = window.webservicePath + "/PassPin2Sod";
    $.ajax({
        type: "POST",
        url: url,
        contentType: "application/json; charset=utf-8",
        data: "{pinId:'" + pinId + "',supId:'" + supId + "',scoId:" + scoId + "}",
        dataType: "json",
        success: function(data) {
            var jsdata = data.d;
            var data2Treat = jQuery.parseJSON(jsdata);
            if (data2Treat !== '-1' && data2Treat !== '0') {
                window.location = '../SupplierOrder/SupplierOrder.aspx?sodId=' + data2Treat + '&mode=view';
            } else {
                myApp.hidePleaseWait();
                // authentication error
                AuthencationError();
            }
        },
        error: function(data) {
            var test = '';
        }
    });
    return false;
}

function SupplierChanged(sender) {
    var supId = $(sender).find('option:selected').attr('data-value');
    //alert(supId);
    if (supId) {
        var url = window.webservicePath + "/LoadSupplierContactBySupId";
        $('#scoId').empty();
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
                        $.each(data2Treat, function(index, value) {
                            $('#scoId').append($("<option></option>").attr("value", value.ScoId).text(value.ScoAdresseTitle));
                        });
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
function LoadSupplier(fName) {
    var url = window.webservicePath + "/GetAllSuppliers";
        ShowPleaseWait();
    var budgetId = '#SupId';
    $.ajax({
        type: "POST",
        url: url,
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        success: function(data) {
            HidePleaseWait();
            var jsdata = data.d;
            var data2Treat = jQuery.parseJSON(jsdata);
            if (data2Treat !== '-1') {
                $(budgetId).empty();
                $(budgetId).append($("<option></option>").attr("data-value", "0").attr("value", "0").text("Veuillez sélectionner un fournisseur"));
                allSupplier = [];
                //allSupplier = searchInArray(data2Treat, 'WithSco', true);  // 此行是为了原先的valid功能
                allSupplier = data2Treat;
                if (fName != null) {
                    window[fName]();
                }
            } else {
                // authentication error
                AuthencationError();
            }
        },
        error: function(data) {
            HidePleaseWait();
            var test = '';
        }
    });
}

function delete_pin_confirm() {
        var content = "<div class='box'><div class='box-body' style='height: 100px;'>" +
        "<div class='form-horizontal'>" +
        "<div class='col-md-12'>" +
        "<div class='form-group'>" +
        "<div class='col-sm-12' style='text-align:center;font-size: 18pt;'>La suppression est irrécupérable, veuillez confirmer !!!</div></div></div></div></div></div>"
        + "<div class='modal-footer center'>" +
        "<button type='button' class='btn btn-default' onclick='closeDialog()'>Annuler</button>" +
        "<button type='button' class='btn btn-inverse' onclick='return DeletePin()'>Supprimer</button></div>";
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

function DeletePin() {
    var cplId = getUrlVars()['pinId'];
    myApp.showPleaseWait();
    if (cplId) {
        var url = window.webservicePath + "/DeletePin";
        var datastr = "{pinId:'" + cplId + "'}";
        $.ajax({
            type: "POST",
            url: url,
            contentType: "application/json; charset=utf-8",
            data: datastr,
            dataType: "json",
            success: function(data) {
                var jsdata = data.d;
                if (jsdata) {
                    window.location = 'SearchPurchaseIntent.aspx';
                    //myApp.hidePleaseWait();
                } else {
                    myApp.hidePleaseWait();
                    MsgErrorPopUp('ERREUR', 'Le devis est utilisé, la suppression n\'est pas effecturée!');

                }
            },
            error: function(data) {
                var test = '';
            }
        });

    }
    return false;
}

function goSod() {
    var sodId = currentItem.SodFId;
    myApp.showPleaseWait();
    var url = '../SupplierOrder/SupplierOrder.aspx?sodId=' + sodId + "&mode=view";
    window.location.href = url;
}

//function supplierPrdchanged(sender) {
//    var supId = $(sender).val() * 1;
//    var lineId = $(sender).attr('lineId');
//    var onesupPrd = searchFieldValueInArray(supplierProducts, 'SupId', supId);
//    if (!jQuery.isEmptyObject(onesupPrd)) {
//        $('#Sup_ref_' + lineId).val(onesupPrd.SprPrdRef);
//    }
//}

function GotoSearchSod() {
    ShowPleaseWait();
    window.location = '../SupplierOrder/SearchSupplierOrder.aspx';
}

function getSods(focus) {
    var pinId = getUrlVars()['pinId'];
    if (pinId) {
        var url = window.webservicePath + "/GetPinSods";
        var datastr = "{pinId:'" + pinId + "'}";
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
                    var linecount = 1;
                    $('#tbody_sods').empty();
                    if (data2Treat.length > 0) {
                        $('#div_sols').show();
                    } else {
                        $('#div_sols').hide();
                    }
                    $.each(data2Treat, function(name, value) {
                        var lineclass = (linecount % 2 === 1) ? "odd" : "even";
                        var oneline = "<tr class='" + lineclass + "'>" +
                            "<td class='label_left' style='cursor: pointer;' itemId='" + value.SodFId + "'  onclick='return viewsod(this)'>" + value.OneSupplier.CompanyName + "</td>" +
                            "<td class='label_left'  style='cursor: pointer;' itemId='" + value.SodFId + "'  onclick='return viewsod(this)'>" + value.SodCode + "</td>" +
                            "<td class='label_right'>" + ReplaceNumberWithCommas(value.TotalAmountHt) + "</td>" +
                            "<td class='label_right'>" + ReplaceNumberWithCommas(value.TotalAmountTtc) + "</td>";
                        var endline = "</tr>";
                        oneline += endline;
                        linecount ++;
                        $('#tbody_sods').append(oneline);
                    });
                    if (focus) {
                        $('html, body').animate({ scrollTop: $('#div_sols').offset().top }, 'slow');
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

function viewsod(sender) {
    ShowPleaseWait();
    var sodId = $(sender).attr('itemId');
    var url = '../SupplierOrder/SupplierOrder.aspx?sodId=' + sodId + "&mode=view";
    window.location = url;
//    var win = window.open(url, '_blank');
//    if (win) {
//        //Browser has allowed it to be opened
//        win.focus();
//    } else {
//        //Browser has blocked it
//        alert('Please allow popups for this website');
//    }
}

var allUsers = [];
function GetUsers() {
    allUsers = [];
    var url = window.webservicePath + "/GetUserList";
    $.ajax({
        url: url,
        type: 'POST',
        contentType: 'application/json; charset=utf-8',
        dataType: 'json',
        success: function (data) {
            var jsdata = data.d;
            var jsondata = jQuery.parseJSON(jsdata);
            allUsers = jsondata;
        },
        error: function (data) {
        }
    });
}

function importerExcel() {
    var startBox = "<div class='box'><div class='box-body'>";
    var endBox = "</div></div>";

    var onelineContent =
        // start box
        "<div class='form-group' id='div_one_line'>" +
            "<div class='row'>" +
            "<div class='col-md-12'>" +
            "<div class='box-body'>" +
            "<div class='form-horizontal'>" +
            "<div class='form-group'><label class='col-sm-12' style='text-align:center'>Veuillez coller les contenues d'excel en bas</br>请将Excel表格内容复制到下面</label></div>" +
            "<div class='form-group'>" +
            "<div class='col-sm-12'><textarea row='8' id='SolContent' class='form-control' style='height:400px'></textarea></div>" +
            "</div>"+
    // close box
            "</div></div></div></div></div>";

    var btnAddUpdate = "<button class='btn btn-inverse' id='btn_add_sols' name='btn_add_sols'  onclick='return SaveSolsExcel(this)'><span>Sauvegarder</span></button>";
    var btnClose = "<button class='btn btn-default bootbox-close-button' id='btn_close_cin_payment' onclick='return false'><span>Annuler</span></button>";

    var btns = "<div class='modal-body center'>" + btnClose + btnAddUpdate + "</div>";
    var onecontent = startBox + onelineContent + btns + endBox;

    var title = 'PAIEMENT';
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

function SaveSolsExcel(sender) {
    ShowPleaseWait();
    var sodId = getUrlVars()['pinId'];
    var content = $('#SolContent').val();
    if (!IsNullOrEmpty(content)) {
        var solLines = content.split('\t');
        var alllinecout = solLines.length;
        if (alllinecout < 9) {
            HidePleaseWait();
            alert('Format error !</br>格式错误 ！');
        } else {
            var sols2Insert = [];
            var onesol = {};
            onesol.PinFId = sodId;
            for (var i = 0; i < alllinecout; i++) {
                if (i !== 0 && (i % 9 == 0)) {
                    sols2Insert.push(onesol);
                    onesol = {};
                    onesol.PinFId = sodId;
                }
                if (i % 9 === 0) {
                    var name = replaceAll(solLines[i], '\r\n', '');
                    name = replaceAll(name, '\n', '');
                    name = replaceAll(name, '\r', '');
                    onesol.PrdName = name;
                }
                if (i % 9 === 3) {
                    var description = solLines[i];
                    try {
                        description = description.substring(1);
                        var len = description.length;
                        description = description.substring(0, len - 1);
                    } catch (e) {

                    }
                    onesol.Description = description;
                }
                if (i % 9 === 5) {
                    onesol.Quantity = solLines[i] * 1;
                }
                if (i % 9 === 6) {
                    var up = replaceAll(solLines[i], '€', '');
                    up = replaceAll(up, '$', '');
                    up = replaceAll(up, ' ', '');
                    up = up.replace(',', '.') * 1;
                    onesol.UnitPrice = up;
                }
                if (i % 9 === 8) {
                    var pt = replaceAll(solLines[i], '€', '');
                    pt = replaceAll(pt, '$', '');
                    pt = replaceAll(pt, ' ', '');
                    pt = pt.replace(',', '.') * 1;
                    onesol.TotalPrice = pt;
                }
            }

            //console.log(sols2Insert);
            if (!IsNullOrEmpty(sodId) && sols2Insert.length > 0) {

                var jsondata = JSON.stringify({ lines: sols2Insert });
                var url = window.webservicePath + "/InsertPilsByExcelLines";
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
                        if (data2Treat !== '-1') {
                            if (data2Treat !== '0') {
                                loadAllLines();
                                $('.bootbox-close-button').click();
                            } else {
                                alert('Veuillez contacter l\'administrateur, 请联系管理员');
                            }
                        } else {
                            HidePleaseWait();
                            // authentication error
                            AuthencationError();
                        }
                    },
                    error: function(data) {
                        HidePleaseWait();
                        alert(data.responseText);
                    }
                });

            } else {
            HidePleaseWait();
                alert('Format error !</br>格式错误 ！');
            }
        }
    } else {
            HidePleaseWait();
        alert('Veuillez remplir le TEXTAREA !</br>请填写内容 ！');
    }
    return false;
}