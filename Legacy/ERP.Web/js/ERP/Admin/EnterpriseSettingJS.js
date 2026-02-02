$(document).ready(init);

function init() {
    ShowPleaseWait();
    //js_getAllCurrency('Cur_Id');
    js_getValueWithOrder('Cur_Id', 'GetAllCurrency', "js_getValueWithOrder('Lng_Id','GetAllLanguage','getCurrentSoc()')");
    //js_getAllLanguage('Lng_Id');
    //getCurrentSoc();
    loadAllBankInfo();
}


function js_getValueWithOrder(elementId, funname, nextfunc) {
    var url = window.webservicePath + "/" + funname;
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
                $.each(data2Treat, function (name, value) {
                    $(budgetId)
                        .append($("<option></option>")
                            .attr("value", value.Key)
                            .text(value.Value2 + " " + value.Value));
                });
                if (nextfunc) {
                    eval(nextfunc);
                }
                //nextfunction();
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

function getCurrentSoc() {
    var url = window.webservicePath + "/GetCurrentSociety";
    $.ajax({
        type: "POST",
        url: url,
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        success: function (data) {
            var jsdata = data.d;
            var data2Treat = jQuery.parseJSON(jsdata);
            if (data2Treat !== '-1' && data2Treat !== '-2') {
                $.each(data2Treat, function (name, value) {
                    var newname = name;
                    setFieldValue(newname, value, true);
                });
                // 20230930 Currency
                var allCur = data2Treat.CurList;
                setExchangeLabel(allCur);
                getHeaderFooter();
            } else {
                if (data2Treat === '-2') {
                    MsgPopUpWithResponse('ERREUR', 'Vous avez des droits insuffisants pour accéder à cette page.<br/>Veuillez contacter votre administrateur !', 'BackToHome()');
                } else {
                    // authentication error
                    AuthencationError();
                }
            }
        },
        error: function (data) {
            HidePleaseWait();
            var test = '';
        }
    });
}

function getHeaderFooter() {
    var url = window.webservicePath + "/GetHeaderFooter";
    $.ajax({
        type: "POST",
        url: url,
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        success: function (data) {
            HidePleaseWait();
            var jsdata = data.d;
            var data2Treat = jQuery.parseJSON(jsdata);
            if (data2Treat !== '-1' && data2Treat !== '-2') {
                $.each(data2Treat, function (name, value) {
                    var newname = name;
                    setFieldValue(newname, value, true);
                });
                initMode();
            } else {
                if (data2Treat === '-2') {
                    MsgPopUpWithResponse('ERREUR', 'Vous avez des droits insuffisants pour accéder à cette page.<br/>Veuillez contacter votre administrateur !', 'BackToHome()');
                } else {
                    // authentication error
                    AuthencationError();
                }
            }
        },
        error: function (data) {
            HidePleaseWait();
            var test = '';
        }
    });
}

function UpdateSociety() {
    var checked = CheckRequiredFieldInOneDiv('div_generel_info');
    if (checked) {
        ShowPleaseWait();
        var society = {};
        var textHeaderFooter = {};
        society.Society_Name = $('#Society_Name').val();
        society.Cur_Id = $('#Cur_Id option:selected').val() * 1;
        society.ShortLabel = $('#ShortLabel').val();
        society.Lng_Id = $('#Lng_Id option:selected').val() * 1;
        society.Email_Auto = $('#Email_Auto').is(':checked');
        society.Capital = $('#Capital').val();
        society.Address1 = $('#Address1').val();
        society.Address2 = $('#Address2').val();
        society.PostCode = $('#PostCode').val();
        society.City = $('#City').val();
        society.Country = $('#Country').val();
        society.Telephone = $('#Telephone').val();
        society.Fax = $('#Fax').val();
        society.Cellphone = $('#Cellphone').val();
        society.Siret = $('#Siret').val();
        society.RCS = $('#RCS').val();
        society.TvaIntra = $('#TvaIntra').val();
        society.RibName = $('#RibName').val();
        society.RibAddress = $('#RibAddress').val();
        society.RibBankCode = $('#RibBankCode').val();
        society.RibAgenceCode = $('#RibAgenceCode').val();
        society.RibAccountNumber = $('#RibAccountNumber').val();
        society.RibKey = $('#RibKey').val();
        society.RibDomiciliationAgency = $('#RibDomiciliationAgency').val();
        society.RibCodeIban = $('#RibCodeIban').val();
        society.RibCodeBic = $('#RibCodeBic').val();
        society.RibAbre = $('#RibAbre').val();

        society.RibAbre2 = $('#RibAbre2').val();
        society.RibName2 = $('#RibName2').val();
        society.RibAddress2 = $('#RibAddress2').val();
        society.RibBankCode2 = $('#RibBankCode2').val();
        society.RibAgenceCode2 = $('#RibAgenceCode2').val();
        society.RibAccountNumber2 = $('#RibAccountNumber2').val();
        society.RibKey2 = $('#RibKey2').val();
        society.RibDomiciliationAgency2 = $('#RibDomiciliationAgency2').val();
        society.RibCodeIban2 = $('#RibCodeIban2').val();
        society.RibCodeBic2 = $('#RibCodeBic2').val();


        society.Cnss = $('#Cnss').val();
        society.TaxePro = $('#TaxePro').val();

        society.IsPrdMandatory = $('#IsPrdMandatory').is(':checked');

        textHeaderFooter.CostPlanHeader = $('#CostPlanHeader').val();
        textHeaderFooter.CostPlanFooter = $('#CostPlanFooter').val();
        textHeaderFooter.DeliveryFooterCondition = $('#DeliveryFooterCondition').val();
        textHeaderFooter.DeliveryFooterLaw = $('#DeliveryFooterLaw').val();
        textHeaderFooter.OtherHeader = $('#OtherHeader').val();
        textHeaderFooter.OtherFooter = $('#OtherFooter').val();
        textHeaderFooter.ClientInvoicePenality = $('#ClientInvoicePenality').val();
        textHeaderFooter.ClientInvoiceDiscountForPrepayment = $('#ClientInvoiceDiscountForPrepayment').val();
        textHeaderFooter.ClinetInvoiceEmail = $('#ClinetInvoiceEmail').val();

        society.ShowLanguageBar = $('#ShowLanguageBar').is(':checked');
        society.SocCinLgs = $('#SocCinLgs').is(':checked');

        var jsondata = JSON.stringify({ soc: society, headerfooter: textHeaderFooter });
        var url = window.webservicePath + "/UpdateSocietyAndHeaderFooter";
        $.ajax({
            url: url,
            type: 'POST',
            contentType: 'application/json; charset=utf-8',
            data: jsondata,
            dataType: 'json',
            success: function (data) {
                init();
            },
            error: function (data) {
            }
        });

    }
    return false;
}

function UpdateCurrency() {
    ShowPleaseWait();
    var url = "EnterpriseSetting.aspx/UpdateCurrencyEx";
    var usdmad = 0;
    usdmad = $('#inp_mad').val() * 1;
    var jsondata = JSON.stringify({ usdmad: usdmad });
    $.ajax({
        type: "POST",
        url: url,
        contentType: "application/json; charset=utf-8",
        data: jsondata,
        dataType: "json",
        success: function (data) {
            GetCurrency();
        },
        error: function (data) {
            HidePleaseWait();
            var test = '';
        }
    });
    return false;
}

function GetCurrency() {
    var url = window.webservicePath + "/GetCurrency";
    $.ajax({
        type: "POST",
        url: url,
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        success: function (data) {
            var jsdata = data.d;
            var data2Treat = jQuery.parseJSON(jsdata);
            setExchangeLabel(data2Treat);
            HidePleaseWait();
        },
        error: function (data) {
            HidePleaseWait();
            var test = '';
        }
    });
}

function setExchangeLabel(data2Treat) {
    var updatetime = "";
    $.each(data2Treat, function (name, value) {
        if (value.Name === 'EURO') {
            $('#label_euro').html(value.SellingRate + ' <i class="fa fa-refresh"></i> ' + (1 / value.SellingRate).toFixed(5));
            updatetime = getDateTimeSecString(value.UpdateTime);
        }
        else if (value.Name === 'GBP') {
            $('#label_gbp').html(value.SellingRate + ' <i class="fa fa-refresh"></i> ' + (1 / value.SellingRate).toFixed(5));
        }
        else if (value.Name === 'CNY') {
            $('#label_cny').html(value.SellingRate + ' <i class="fa fa-refresh"></i> ' + (1 / value.SellingRate).toFixed(5));
        }
        else if (value.Name === 'ROUBLE RUSSE') {
            $('#label_rbs').html(value.SellingRate + ' <i class="fa fa-refresh"></i> ' + (1 / value.SellingRate).toFixed(5));
        }
        else if (value.Name === 'DIRHAMS') {
            $('#inp_mad').val(value.SellingRate);
        }
        else if (value.Name === 'HKD') {
            $('#label_hkd').html(value.SellingRate + ' <i class="fa fa-refresh"></i> ' + (1 / value.SellingRate).toFixed(5));
        }
    });
    $("#label_cur_updatetime").text(updatetime);
}


// region bank info

var hasSet_bankinfo = false;

var allBankInfo = [];

function loadAllBankInfo() {
    var url = window.webservicePath + "/GetBankAccountInfo";
    var datastr = "{type:5,fId:'0'}";
    $.ajax({
        type: "POST",
        url: url,
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        data: datastr,
        success: function (data) {
            var jsdata = data.d;
            var data2Treat = jQuery.parseJSON(jsdata);
            if (data2Treat !== '-1') {
                allBankInfo = [];
                allBankInfo = data2Treat;
                var itemName = 'bank_info';
                var db_name = 'db_' + itemName;
                var th_name = 'th_' + itemName;
                var tb_name = 'tb_' + itemName;
                var tf_name = 'tf_' + itemName;
                var div_name = 'div_' + itemName;

                var headerFooter = "<tr>" +
                    "<th>Nom de compte</th>" +
                    "<th>Nom de Banque</th>" +
                    "<th>IBAN</th>" +
                    "<th>BIC (Swift)</th>" +
                    "<th>Code banque</th>" +
                    "<th>Code agence/guichet</th>" +
                    "<th>Numéro de compte</th>" +
                    "<th>Clé RIB</th>" +
                    "<th>Agence de domiciliation</th>" +
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
                var resultcount = data2Treat.length;
                if (resultcount > 0) {
                    $('#' + th_name).empty();
                    $('#' + tf_name).empty();

                    $('#' + th_name).append(headerFooter);
                    $('#' + tf_name).append(headerFooter);

                    var titles = new Array();
                    titles.push({ "sTitle": "Nom de Compte" });
                    titles.push({ "sTitle": "Nom de Banque" });
                    titles.push({ "sTitle": "Iban" });
                    titles.push({ "sTitle": "Bic" });
                    titles.push({ "sTitle": "Code banque" });
                    titles.push({ "sTitle": "Code agence" });
                    titles.push({ "sTitle": "Numéro de compte" });
                    titles.push({ "sTitle": "Clé RIB" });
                    titles.push({ "sTitle": "Agence de domiciliation" });

                    var displaycount = 1;
                    $.each(data2Treat, function (name, value) {
                        var dataArray = new Array();
                        dataArray.push("<span  onclick='viewCreateBankInfo(\"" + value.FId + "\")' style='cursor:pointer; font-weight: bolder;'>" + value.RibTitle + "</span>");
                        dataArray.push("<span  onclick='viewCreateBankInfo(\"" + value.FId + "\")' style='cursor:pointer; font-weight: bolder;'>" + value.BankName + "</span>");
                        dataArray.push(value.Iban);
                        dataArray.push(value.Bic);
                        dataArray.push(value.RibBankCode);
                        dataArray.push(value.RibAgenceCode);
                        dataArray.push(value.RibAccountNumber);
                        dataArray.push(value.RibKey);
                        dataArray.push(value.AccountOwner);
                        try {
                            $('#' + db_name).dataTable().fnAddData(dataArray);
                        } catch (e) {
                            var test = '';
                        }
                        displaycount++;
                    });

                    if (hasSet_bankinfo) {
                        try {
                            $('#' + db_name).dataTable({
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
                        if (!hasSet_bankinfo) {
                            hasSet_bankinfo = true;
                        }
                    } catch (e) {

                    }
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

var baclineCount = 0;
function viewCreateBankInfo(FId) {
    var oneInfo = searchFieldValueInArray(allBankInfo, 'FId', FId);
    var RibTitle = !jQuery.isEmptyObject(oneInfo) ? oneInfo.RibTitle : '';
    var BankName = !jQuery.isEmptyObject(oneInfo) ? oneInfo.BankName : '';
    var BankAdr = !jQuery.isEmptyObject(oneInfo) ? oneInfo.BankAdr : '';
    var AccountNumber = !jQuery.isEmptyObject(oneInfo) ? oneInfo.AccountNumber : '';
    var Bic = !jQuery.isEmptyObject(oneInfo) ? oneInfo.Bic : '';
    var Iban = !jQuery.isEmptyObject(oneInfo) ? oneInfo.Iban : '';
    var RibBankCode = !jQuery.isEmptyObject(oneInfo) ? oneInfo.RibBankCode : '';
    var RibAgenceCode = !jQuery.isEmptyObject(oneInfo) ? oneInfo.RibAgenceCode : '';
    var RibAccountNumber = !jQuery.isEmptyObject(oneInfo) ? oneInfo.RibAccountNumber : '';
    var RibKey = !jQuery.isEmptyObject(oneInfo) ? oneInfo.RibKey : '';
    var AccountOwner = !jQuery.isEmptyObject(oneInfo) ? oneInfo.AccountOwner : '';
    var RibAgencyAdr = !jQuery.isEmptyObject(oneInfo) ? oneInfo.RibAgencyAdr : '';

    var create = !jQuery.isEmptyObject(oneInfo) ? false : true;
    var LineId = !jQuery.isEmptyObject(oneInfo) ? oneInfo.Id : baclineCount;
    baclineCount--;

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
        "<label class='col-sm-3 control-label language_txt'>Nom de compte(Non affiché dans RIB, juste pour les notes)</label>" +
        "<div class='col-sm-3'><input type='text' " + disabled + "  value='" + RibTitle + "' lineId='" + LineId + "'class='form-control' id='RibTitle_zzz_' name='RibTitle_zzz_' required /></div>" +
        "<label class='col-sm-3 control-label language_txt'>Bank Name(Domiciliation)</label>" +
        "<div class='col-sm-3'><input type='text' " + disabled + "  value='" + BankName + "' lineId='" + LineId + "'class='form-control' id='BankName_zzz_' name='BankName_zzz_' required /></div>" +
        "</div > " +
        "<div class='form-group'>" +
        "<label class='col-sm-3 control-label language_txt'>Account Name (Beneficiary Name/Titulaire du compte)</label>" +
        "<div class='col-sm-3'><textarea class='form-control' id='AccountOwner_zzz_' " + disabled + "  name='AccountOwner_zzz_' value='" + AccountOwner + "' lineId='" + LineId + "' required/></textarea></div>" +
        "<label class='col-sm-3 control-label sale language_txt'>Bank Address(Domiciliation complète)</label>" +
        "<div class='col-sm-3 sale'><textarea class='form-control' " + disabled + "   lineId='" + LineId + "'' id='BankAdr_zzz_' name='BankAdr_zzz_' value='" + BankAdr + "'/></textarea></div>" +
        "</div>" +
        "<div class='form-group'>" +
        "<label class='col-sm-3 control-label language_txt'>BIC (SWIFT)</label>" +
        "<div class='col-sm-3'><input type='text' " + disabled + "  value='" + Bic + "' lineId='" + LineId + "'class='form-control' id='Bic_zzz_' name='Bic_zzz_' /></div>" +
        "<label class='col-sm-3 control-label language_txt'>IBAN</label>" +
        "<div class='col-sm-3'><input type='text'  class='form-control' lineId='" + LineId + "' id='Iban_zzz_' name='Iban_zzz_' value='" + Iban + "'/></div>" +
        "</div>" +
        //RIB
        "<div class='form-group'>" +
        "<label class='col-sm-12 control-label language_txt' style='text-align:center'>RIB</label>" +
        "</div>" +
        "<div class='form-group '>" +
        "<label class='col-sm-2 control-label language_txt'>Code banque</label>" +
        "<div class='col-sm-2'><input type='text' " + disabled + "  class='form-control' id='RibBankCode_zzz_'  lineId='" + LineId + "' name='RibBankCode_zzz_'  value='" + RibBankCode + "' /></div>" +
        "<label class='col-sm-2 control-label language_txt'>Code agence/guichet</label>" +
        "<div class='col-sm-2'><input type='text' " + disabled + "  class='form-control' lineId='" + LineId + "' id='RibAgenceCode_zzz_' name='RibAgenceCode_zzz_' value='" + RibAgenceCode + "' /></div>" +
        "<label class='col-sm-2 control-label language_txt'>Numéro de compte</label>" +
        "<div class='col-sm-2'><input type='text'  " + disabled + "  class='form-control' lineId='" + LineId + "' id='RibAccountNumber_zzz_' name='RibAccountNumber_zzz_' value='" + RibAccountNumber + "' /></div>" +
        "</div>" +
        "<div class='form-group  variant'>" +
        "<label class='col-sm-2 control-label language_txt'>Clé RIB</label>" +
        "<div class='col-sm-2'><input type='text' " + disabled + "  class='form-control' lineId='" + LineId + "' id='RibKey_zzz_' name='RibKey_zzz_' value='" + RibKey + "' /></div>" +
        "<label class='col-sm-2 control-label language_txt'>Agence de domiciliation</label>" +
        "<div class='col-sm-2'><input class='form-control' " + disabled + "   lineId='" + LineId + "'' id='RibAgencyAdr_zzz_' name='RibAgencyAdr_zzz_' value='" + RibAgencyAdr + "'></div>" +
        "<label class='col-sm-2 control-label sale language_txt'>Account Number(Utiliser sans IBAN)</label>" +
        "<div class='col-sm-2'><input id='AccountNumber_zzz_' name='AccountNumber_zzz_' " + disabled + "  class='form-control' lineId='" + LineId + "' value='" + AccountNumber + "'></div>" +
        "</div>" +
        // close box
        "</div></div></div></div></div>";

    var btnAddUpdate = "<button class='btn btn-inverse language_txt' lineId='" + LineId + "' id='btn_add_update_line_zzz_' name='btn_add_update_line_zzz_' onclick='return AddUpdateOneLine(this)'><span>" + (!create ? "Mettre à jour" : "Ajouter") + "</span></button>";
    var btnDelete = "<button class='btn btn-inverse language_txt' lineId='" + LineId + "' id='btn_delete_line_zzz_' name='btn_delete_line_zzz_' onclick='return delete_Line_Confirm(this)'><span>Supprimer</span></button>";
    var btnClose = "<button class='btn btn-default bootbox-close-button language_txt' onclick='return false'><span>Annuler</span></button>";

    var btns = "<div class='modal-body center'>" + btnClose + btnAddUpdate + (create ? "" : btnDelete) + "</div>";
    var onecontent = startBox + onelineContent + btns + endBox;
    onecontent = replaceAll(onecontent, '_zzz_', '_' + LineId);

    var title = !create ? 'Mettre à jour' : 'Ajouter';
    bootbox.dialog({
        title: title,
        message: onecontent

    }).find('.modal-dialog').css({
        'width': '95%'
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

    // set content info
    $('#BankAdr_' + LineId).text(BankAdr);
    $('#AccountOwner_' + LineId).text(AccountOwner);

    SetLanguageBar();
    return false;
}

function AddUpdateOneLine(sender) {
    var lineId = $(sender).attr('lineId');
    var checkOK = CheckRequiredFieldInOneDiv('div_one_line');
    if (checkOK) {
        var bckInfo = {};
        bckInfo.RibTitle = $('#RibTitle_' + lineId).val();
        bckInfo.BankName = $('#BankName_' + lineId).val();
        bckInfo.BankAdr = $('#BankAdr_' + lineId).val();
        bckInfo.AccountNumber = $('#AccountNumber_' + lineId).val();
        bckInfo.Bic = $('#Bic_' + lineId).val();
        bckInfo.Iban = $('#Iban_' + lineId).val();
        bckInfo.RibBankCode = $('#RibBankCode_' + lineId).val();
        bckInfo.RibAgenceCode = $('#RibAgenceCode_' + lineId).val();
        bckInfo.RibAccountNumber = $('#RibAccountNumber_' + lineId).val();
        bckInfo.RibKey = $('#RibKey_' + lineId).val();
        bckInfo.AccountOwner = $('#AccountOwner_' + lineId).val();
        bckInfo.RibAgencyAdr = $('#RibAgencyAdr_' + lineId).val();
        bckInfo.FId = lineId;
        bckInfo.TypeId = 5;
        bckInfo.FgFId = '';

        var url = window.webservicePath + '/CreateUpdateSupplierBankAccount';
        var jsondata = JSON.stringify({ bankAccount: bckInfo });
        $.ajax({
            url: url,
            type: 'POST',
            contentType: 'application/json; charset=utf-8',
            data: jsondata,
            dataType: 'json',
            success: function (data) {
                $('.bootbox-close-button').click();
                loadAllBankInfo();
            },
            error: function (data) {
                alert(data.responseText);
            }
        });
    }
    return false;
}

function delete_Line_Confirm(sender) {
    var lineId = $(sender).attr('lineId');
    var title = "ATTENTION";
    var content = "<div class='box'><div class='box-body' style='height: 100px;'>" +
        "<div class='form-horizontal'>" +
        "<div class='col-md-12'>" +
        "<div class='form-group'>" +
        "<div class='col-sm-12' style='text-align:center;font-size: 18pt;'>Veuillez confirmer la suppression ! " +
        "<br/>La suppression est irrécupérable, veuillez confirmer !!!</div></div></div></div></div></div>"
        + "<div class='modal-footer center'>" +
        "<button type='button' class='btn btn-default' onclick='closeDialog()'>Annuler</button>" +
        "<button type='button' class='btn btn-inverse' lineId='" + lineId + "' onclick='return delete_line(this);'>SUPPRIMER</button></div>";
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

function delete_line(sender) {
    var lineId = $(sender).attr('lineId') * 1;
    var bckInfo = {};
    bckInfo.Id = lineId;
    bckInfo.FgFId = getUrlVars()['supId'];
    var url = window.webservicePath + "/DeleteBankAccount";
    var jsondata = JSON.stringify({ bankAccount: bckInfo });
    $.ajax({
        type: "POST",
        url: url,
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        data: jsondata,
        success: function (data) {
            var jsdata = data.d;
            var data2Treat = jQuery.parseJSON(jsdata);
            if (data2Treat) {
                $('.bootbox-close-button').click();
                loadAllBankInfo();
            } else {
                $('.bootbox-close-button').click();
                alert('Item in use !');
                //AuthencationError();
            }
        },
        error: function (data) {
            var test = '';
        }
    });
}

// endregion bank info