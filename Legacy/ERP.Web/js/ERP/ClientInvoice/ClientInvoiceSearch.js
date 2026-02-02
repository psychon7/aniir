//$(document).ready(init);

$(document).ready(GetSocCinLgs);
var CinLgs = false;
function GetSocCinLgs() {
    var url = window.webservicePath + "/GetSocCinLgs";
    ShowPleaseWait();
    AjaxCall('POST', url, null, function(data) {
        HidePleaseWait();
        CinLgs = data;
        init();
    });
}


function init() {
    ShowPleaseWait();
    setAutoCompleteClient();
    setAutoCompleteSup();
    $.each($('.datepicker'), function(idx, value) {
        $(value).datepicker();
    });
    //$('#CinDateCreationFrom').val(firstDayOfYear());
    $('#CinDateCreationFrom').val(firstDayInPreviousMonths(3));
    $('#CinDateCreationTo').val(getToday());
    getCurrentSoc();

    SetLanguageBar();
}

function createItem() {
    window.location = 'ClientInvoice.aspx';
}

var hasSet = false;

var seltectedClientId = 0;
var ClientList = [];
function setAutoCompleteClient() {
   var url = window.webservicePath + "/SearchClientByName";
    $("#ClientList").autocomplete({
        source: function(request, response) {
            $.ajax({
                url: url,
                data: "{ 'client': '" + request.term + "'}",
                dataType: "json",
                type: "POST",
                contentType: "application/json; charset=utf-8",
                success: function(data) {
                    seltectedClientId = 0;
                    var jsdata = data.d;
                    var data2Treat = jQuery.parseJSON(jsdata);
                    ClientList = [];
                    ClientList = data2Treat;
                    if (data2Treat.length > 0) {
                        response($.map(data2Treat, function(item) {
                            return {
                                //label: item.Value,
                                label: (IsNullOrEmpty(item.Value2)? item.Value: (item.Value + "-" + item.Value2)),
                                val: item.Key,
                            }
                        }));
                    } else {
                    }
                },
                error: function(response) {
                    //alert(response.responseText);
                    //console.log(response);
                },
                failure: function(response) {
                    alert(response.responseText);
                }
            });
        },
        select: function(e, i) {
            seltectedClientId = i.item.val * 1;
            //selectedClientChanged(seltectedClientId);
        },
        minLength: 2
    });
}
function InitSup(sender) {
    var value = $(sender).val().trim();
    if (IsNullOrEmpty(value)) {
        seltectedSupId = 0;
    }
    return false;
}


var seltectedSupId = 0;
var supplierList = [];
function setAutoCompleteSup() {
    var url = window.webservicePath + "/GetSupplierByKeyword";
    //var cliFId = $('#cinClient :selected').attr('data-value');
    $("#SupList").autocomplete({
        source: function (request, response) {
            $.ajax({
                url: url,
                data: "{ 'keyword': '" + request.term + "'}",
                dataType: "json",
                type: "POST",
                contentType: "application/json; charset=utf-8",
                success: function (data) {
                    seltectedSupId = 0;
                    var jsdata = data.d;
                    var data2Treat = jQuery.parseJSON(jsdata);
                    supplierList = [];
                    supplierList = data2Treat;
                    if (data2Treat.length > 0) {
                        response($.map(data2Treat, function (item) {
                            return {
                                label: (item.Abbreviation == null ? (item.CompanyName) : (item.Abbreviation + " | " + item.CompanyName)),
                                val: item.Id,
                            }
                        }));
                    } else {
                    }
                },
                error: function (response) {
                    //                    alert(response.responseText);
                    //console.log(response);
                },
                failure: function (response) {
                    alert(response.responseText);
                }
            });
        },
        select: function (e, i) {
            seltectedSupId = i.item.val * 1;
            //SupplierChangedBySelected(seltectedSupFId, 0);
        },
        minLength: 2
    });
}


var searchResult = [];
function jsSearch() {
    myApp.showPleaseWait();
    var oneItem = {};
    oneItem.CinCode = $('#CinCode').val().trim();
    oneItem.CinName= $('#CinName').val().trim();
    oneItem.PrjName = $('#PrjName').val().trim();
    oneItem.PrjCode = $('#PrjCode').val().trim();
    oneItem.ClientCompanyName = $('#ClientList').val().trim();
    oneItem.Inv_CcoFirstname= $('#Inv_CcoFirstname').val().trim();
    oneItem._CinDCreation = $('#CinDateCreationFrom').val();
    oneItem._CinDUpdate = $('#CinDateCreationTo').val();
    oneItem.CliId = seltectedClientId;
    // 仅在此处，用于搜索
    oneItem.PaymentMode = $('#CpyComment').val();
    oneItem.CinInterComment = $('#keyword').val();
    oneItem.CinKeyProject = $('#CinKeyProject').is(':checked');
    oneItem.PrjId = seltectedSupId; // 20250428

    var jsondata = JSON.stringify({ oneCin: oneItem });
    var url = window.webservicePath + "/SearchClientInvoices";
    searchResult = [];
    $.ajax({
        type: "POST",
        url: url,
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        data: jsondata,
        success: function (data) {
            var jsdata = data.d;
            var data2Treat = jQuery.parseJSON(jsdata);
            if (data2Treat !== '-1') {
                if (data2Treat.length === 0) {
                    NoResultMsg();
                }
                searchResult = data2Treat;
                var headerFooter = "<tr>" +
                "<th style='text-align:center'>$¥€<br/><input type='checkbox' id='cbx_all_cin' onclick='CinAllClick(this)'/></th>" +
                "<th style='text-align:center'>IMP.<br/><input type='checkbox' id='cbx_imp_all_cin' onclick='CinImpAllClick(this)' title='Imprimer les factures sélectionnées'/></th>" +
                    "<th>D. C.</th>" +
                    (currentSoc.DpUpd && connectedUser.LoginMode === 1? "<th>D. M.</th>" : "")
                    +
                    "<th>Code</th>" +
                    "<th>Raison sociale</th>" +
                    "<th>Nom</th>" +
                    //"<th>Facturé</th>" +
                    "<th>Mnt. Total</th>" +
                    "<th>Mnt. A Recevoir</th>" +
                    "<th>Relevé Payt.</th>" +
                    "<th>Cmt. de Payt.</th>" +
                    "<th>Nom de l'affaire</th>" +
                    "<th style='width:30%;'>Ligne</th>" +
                    //"<th>Contact</th>" +
                    "<th>Créateur/Commerciaux</th>" + 
                    "<th>Cmd Fournisseur</th>" + 
                    (CinLgs? "<th>Logistics</th>":"")+
                    "</tr>";

                try {
                    $('#datatable_search_result').remove();
                    var datatableContent = "<table id='datatable_search_result' cellpadding='0' cellspacing='0' border='0' class='datatable table table-striped table-bordered table-hover'>" +
                        "<thead id='thead_search_result'>" +
                        headerFooter +
                        "</thead>" +
                        "<tbody id='tbody_search_result'></tbody>" +
                        "<tfoot id='tfoot_search_result'>" +
                        headerFooter +
                        "</tfoot>" +
                        "</table>";
                    $('#div_for_datatable').html(datatableContent);

                } catch (e) {
                    var test = '';
                }
                var resultcount = data2Treat.length;
                $('#result_count').text(resultcount);
                if (resultcount > 0) {
                    $('.searchresult').show();
                    $('#mask_processing').text(resultcount + ' resultats ...');
                    $('#mask_processing').val(resultcount + ' resultats ...');

                    $('#thead_search_result').empty();
                    $('#tfoot_search_result').empty();

                    $('#thead_search_result').append(headerFooter);
                    $('#tfoot_search_result').append(headerFooter);

                    var titles = new Array();
                    titles.push({ "sTitle": "btn1" });
                    titles.push({ "sTitle": "btnImp" });
                    titles.push({ "sTitle": "CreateDate" });
                    if (currentSoc.DpUpd &&connectedUser.LoginMode === 1) {
                        titles.push({ "sTitle": "ModifyDate" });
                    }
                    titles.push({ "sTitle": "Code" });
                    titles.push({ "sTitle": "Raison sociale" });
                    titles.push({ "sTitle": "Nom" });
                    //titles.push({ "sTitle": "Invoiced" });
                    titles.push({ "sTitle": "Montant" });
                    titles.push({ "sTitle": "Montant2Pay" });
                    titles.push({ "sTitle": "PmtRrd" });
                    titles.push({ "sTitle": "PaytCmt" });
                    titles.push({ "sTitle": "Nom de l'affaire" });
                    titles.push({ "sTitle": "Lines" });
                    //titles.push({ "sTitle": "Contact" });
                    titles.push({ "sTitle": "Créateur-Commerciaux" });
                    if (CinLgs) {
                    titles.push({ "sTitle": "Lgs" });
                    }

                    var displaycount = 1;
                    $.each(data2Treat, function(name, value) {
                        $('#mask_processing').text('Traitement en cours ' + displaycount + '/' + resultcount);
                        $('#mask_processing').val('Traitement en cours ' + displaycount + '/' + resultcount);
                        var dataArray = new Array();
                        // 20210119
                        if (value.CinRest2Pay === 0) {
                            dataArray.push("");
                        } else {
                            dataArray.push("<input type='checkbox' id='cbx_cin_" + value.CinId + "' cinId='" + value.CinId + "' onclick='CheckBoxForAddBtnCin()'/>");
                        }
                        dataArray.push("<input type='checkbox' id='cbx_imp_cin_" + value.CinId + "' cinId='" + value.CinId + "' onclick='CheckBoxForAddImpBtnCin()'/>");
                        dataArray.push("<span  onclick='viewItem(\"" + value.FId + "\"," + value.CinIsInvoice + ")' style='font-weight:bolder;cursor:pointer'>" + getDateString(value.CinDCreation) + "</span>");
                        if (currentSoc.DpUpd && connectedUser.LoginMode === 1) {
                            dataArray.push("<span  onclick='viewItem(\"" + value.FId + "\"," + value.CinIsInvoice + ")' style='font-weight:bolder;cursor:pointer'>" + getDateString(value.CinDUpdate) + "</span>");
                        }
                        dataArray.push("<span onclick='viewItem(\"" + value.FId + "\"," + value.CinIsInvoice + ")' style='font-weight:bolder;cursor:pointer'>" +  value.CinCode + "</span>" +
                            "<i class='fa fa-file-text' title='Consulter la facture PDF 查看PDF' onclick='return downloadCinPdf(this)' cinId='" + value.FId + "' style='cursor:pointer;'></i>");
                        var companyname = value.ClientCompanyName + (IsNullOrEmpty(value.CliAbbr) ? "" : ("-" + value.CliAbbr));
                        dataArray.push("<span onclick='viewItem(\"" + value.FId + "\"," + value.CinIsInvoice + ")' style='font-weight:bolder;cursor:pointer'>" + companyname+ "</span>");
                        dataArray.push("<span onclick='viewItem(\"" + value.FId + "\"," + value.CinIsInvoice + ")' style='font-weight:bolder;cursor:pointer'>" + value.CinName+ "</span>");
                        //dataArray.push(value.CinIsInvoiced ? 'OUI' : 'NON');
                        var classAvoir = value.CinAmount < 0 ? "style='color:red;'" : "";
                        //dataArray.push(value.CinAmount);
                        var cinAmount = '';
                        try {
                            cinAmount = value.CinAmount.toLocaleString();
                        } catch (e) {

                        }
                        dataArray.push("<span " + classAvoir + "  >" + cinAmount + " " + value.CurrencySymbol + "</span>");
                        var cinRest2pay = '';
                        try {
                            cinRest2pay = value.CinRest2Pay.toLocaleString();
                        } catch (e) {

                        } 
                        var color = value.CinRest2Pay === 0 ? "green" : "red";
                        dataArray.push("<span style='color:" + color + ";'>" + cinRest2pay + " " + value.CurrencySymbol + "</span>");
                        // 20220420-支付详情
                        dataArray.push(value.CinPaymentRecord);
                        dataArray.push(value.CinPaymentComments);
                        dataArray.push(value.PrjName);

                        
                        // 20231111
                        var oneline = '';
                        if (value.ClientInvoiceLines.length > 0) {
                            $.each(value.ClientInvoiceLines, function (onename, onecln) {
                                oneline += (onecln.CiiLevel1 + "." + onecln.CiiLevel2 + "→ " + onecln.CiiPrdName + "→ " + onecln.CiiQuantity + " * " + onecln.CiiPriceWithDiscountHt + " " + value.CurrencySymbol + " = H.T. " + onecln.CiiTotalPrice.toFixed(2) + " " + value.CurrencySymbol + " = T.T.C. " + onecln.CiiTotalCrudePrice.toFixed(2) + " " + value.CurrencySymbol + "<br/>");
                            });
                        }
                        dataArray.push(oneline);

                        //dataArray.push(value.Inv_CcoFirstname + " " + value.Inv_CcoLastname + "<br/>" + value.Dlv_CcoFirstname + " " + value.Dlv_CcoLastname);

                        var creatorandcommercial = "";
                        creatorandcommercial += 'C:' + value.Creator.FullName;
                        if (value.UsrCommercial1) {
                            creatorandcommercial += '<br/>' + 'C1:' + value.UsrCommercial1;
                        }
                        if (value.UsrCommercial2) {
                            creatorandcommercial += '<br/>' + 'C2:' + value.UsrCommercial2;
                        }
                        if (value.UsrCommercial3) {
                            creatorandcommercial += '<br/>' + 'C3:' + value.UsrCommercial3;
                        }
                        dataArray.push(creatorandcommercial);

                        if (value.CsoList !== null && value.CsoList.length > 0) {
                            var cincontent = "";
                            var csoCount = 0;
                            var csolen = value.CsoList.length;
                            $.each(value.CsoList, function(nm, onecso) {
                                cincontent += "<span onclick='viewSodItem(\"" + onecso.Value2 + "\")' style='cursor:pointer;font-weight:bolder;'>" + onecso.Value + " -  " + onecso.Value3 + "</span>";
                                csoCount++;
                                if (csoCount < csolen) {
                                    cincontent += "</br>";
                                }
                            });
                            dataArray.push(cincontent);
                        } else {
                            dataArray.push('');
                        }


                        if (CinLgs) {
                            if (value.CgsList !== null && value.CgsList.length > 0) {
                                var lgscontent = "";
                                var lgsCount = 1;
                                var lgslen = value.CgsList.length;
                                $.each(value.CgsList, function(nm, onecso) {
                                    lgscontent += "<span onclick='viewLgsItem(\"" + onecso.Value2 + "\")' style='cursor:pointer;font-weight:bolder;'>"+ lgsCount + "=>" + onecso.Key3 + "*" + onecso.Value4 + " | " + onecso.Value + "</span>";
                                    if (lgsCount < lgslen) {
                                        lgscontent += "</br>";
                                    }
                                    lgsCount++;
                                });
                                dataArray.push(lgscontent);
                            } else {
                                dataArray.push('');
                            }
                        }


                        try {
                            $('#datatable_search_result').dataTable().fnAddData(dataArray);
                        } catch (e) {
                            var test = '';
                        }
                        displaycount++;
                    });


                    if (hasSet) {
                        try {

                            $('#datatable_search_result').dataTable({
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
            } else {
                // authentication error
                AuthencationError();

                myApp.hidePleaseWait();
            }
        },
        error: function (data) {
            var test = '';
            myApp.hidePleaseWait();
        }
    });
    return false;

}


function CinAllClick(sender) {
var ischeck = $(sender).is(':checked');
    var allDfos = $("input[id^='cbx_cin_']");
    allDfos.each(function () {
        $(this).prop('checked', ischeck);
    });
    if (ischeck) {
        $('#btn_AddPr').show();
    } else {
        $('#btn_AddPr').hide();
    }
}

function CheckBoxForAddBtnCin() {
    var ischeck = false;
    var allDfos = $("input[id^='cbx_cin_']");
    allDfos.each(function () {
        ischeck = ischeck || $(this).prop('checked');
    });
    if (ischeck) {
        $('#btn_AddPr').show();
    } else {
        $('#btn_AddPr').hide();
    }
}

function CinImpAllClick(sender) {
var ischeck = $(sender).is(':checked');
    var allDfos = $("input[id^='cbx_imp_cin_']");
    allDfos.each(function () {
        $(this).prop('checked', ischeck);
    });
    if (ischeck) {
        $('#btn_Add2Imp').show();
    } else {
        $('#btn_Add2Imp').hide();
    }
}

function CheckBoxForAddImpBtnCin() {
    var ischeck = false;
    var allDfos = $("input[id^='cbx_imp_cin_']");
    allDfos.each(function () {
        ischeck = ischeck || $(this).prop('checked');
    });
    if (ischeck) {
        $('#btn_Add2Imp').show();
    } else {
        $('#btn_Add2Imp').hide();
    }
}

function downloadAllCinsSelected() {
    var allDfos = $("input[id^='cbx_imp_cin_']");
    var idstr = '';
    allDfos.each(function () {
        var id = $(this).attr('cinId') * 1;
        if ($(this).prop('checked')) {
            idstr += (id + ',');
        }
    });
    //console.log(idstr);
    window.open('../Common/PageDownLoad.aspx?cinIds=' + idstr, '_blank');
    return false;
}



function AddPaymentRecord() {
var sod2Add = [];
    var allDfos = $("input[id^='cbx_cin_']");
    allDfos.each(function () {
        if ($(this).prop('checked')) {
            var sodid = $(this).attr('cinId') * 1;
            var onesod = searchFieldValueInArray(searchResult, 'CinId', sodid);
            if (onesod) {
                sod2Add.push(onesod);
            }
        }
    });
    if (sod2Add.length > 0) {
        ShowCin2Pay(sod2Add);
    }
    return false;
}


function ShowCin2Pay(sods) {

    var lineCount = 1;
    var onetable = "<table style='border: 1px solid black; text-align:center; width:100% !important;'>";
    onetable += "<tr>" +
        "<th style='border: 1px solid black; text-align:center' >Client</th>" +
        "<th style='border: 1px solid black; text-align:center' >Nom de facture</th>" +
        "<th style='border: 1px solid black; text-align:center' >Code de facture</th>" +
        "<th style='border: 1px solid black; text-align:center' >Montant HT</th>" +
        "<th style='border: 1px solid black; text-align:center' >Montant TTC</th>" +
        "<th style='border: 1px solid black; text-align:center' >Déjà payé</th>" +
        "<th style='border: 1px solid black; text-align:center' >A Recevoir</th>" +
        "<th style='border: 1px solid black; text-align:center; width: 10%;' >Montant payé cette fois</th>" +
        "<th style='border: 1px solid black; text-align:center' >Commentaire</th>" +
        "</tr>";

    $.each(sods, function (name, value) {
        var style = lineCount % 2 === 0 ? "style='background-color:azure'" : "";
        lineCount++;
        onetable += "<tr " + style + ">";
        onetable += "<td style='border: 1px solid black; text-align:center'>" + value.ClientCompanyName + "</td>";
        onetable += "<td style='border: 1px solid black; text-align:center'>" + value.CinName + "</td>";
        onetable += "<td style='border: 1px solid black; text-align:center'>" + value.CinCode + "</td>";

        // sol détail
        onetable += "<td style='border: 1px solid black; text-align:center'>" + ReplaceNumberWithCommas(value.CinAmount) + "</td>";
        onetable += "<td style='border: 1px solid black; text-align:center'>" + ReplaceNumberWithCommas(value.TotalAmountTtc) + "</td>";
        onetable += "<td style='border: 1px solid black; text-align:center'>" + ReplaceNumberWithCommas(value.CinPaid) + "</td>";
        onetable += "<td style='border: 1px solid black; text-align:center'>" + ReplaceNumberWithCommas(value.CinRest2Pay) + "</td>";
        onetable += "<td style='border: 1px solid black; text-align:center'><input onkeyup='CalCulateTotalPayment(this)' id='txbAmtPay_" + value.CinId + "' cinId='" + value.CinId + "' type='number'  class='form-control' value='" + value.CinRest2Pay + "' /></td>";
        onetable += "<td style='border: 1px solid black; text-align:center'><textarea rows='2' cols='1' id='txt_comment_" + value.CinId + "'  name='txt_comment_" + value.CinId + "' cinId='" + value.CinId + "' class='form-control'></textarea></td>";
        onetable += "</tr>";
    });

    // sum line
    onetable += "<tr>" +
        "<td style='font-size: 12pt;border: 1px solid black' colspan='7'>TOTAL</td>" +
        "<td style='font-size: 12pt;border: 1px solid black'><label class='col-sm-1 control-label' id='lb_total' style='width: 100%'>0,00</label></td><td></td>" +
        "</tr>";

    // file
    onetable += "<tr>" +
        "<td colspan='9' style='border: 1px solid black'>" +
        "<div class='form-group'>" +
        "<label class='col-sm-6 control-label'>Commentaire de paiement (pour recherche le paiement)</label>" +
        "<div class='col-sm-3'><input type='text' id='CpyPaymentCode' class='form-control' value=''/>" +
        "</div>" +
        "</div>" +
        "<div class='form-group'>" +
        "<div class='col-sm-12'>" +
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
        "<span>Fichier de paiement</span>" +
        "<input type='file' id='iptUploadFilePopUp' name='files[]' accept='application/pdf' onchange='getFileDataPopUp(this);'></span>" +
        "<button type='reset' class='btn btn-inverse cancel'  style='display: none;' id='btnCancelUploadFilePopUp' onclick='return hideUploadPopUp()'><i class='fa fa-ban'></i><span>Annuler</span></button>" +
        "<button class='btn btn-inverse bootbox-close-button' style='display:none;' onclick='return false'><span>Annuler</span></button></div> <!-- The global progress information -->" +
        "<div class='col-md-12' style='text-align: center; margin-bottom: 20px;'>" +
        "<div>File Name : <span id='uploadFileNamePopUp'></span></div><br/>" +
        "</div></div>" +
        "</form>" +
        "</div>" + // close col-md-6
        "</div>" + 
        "</td>" +
        "</tr>";



    // commentaire
    //    onetable += "<tr style='background-color:azure'>" +
    //        "<td colspan='2' style='border: 1px solid black'>Commentaire</td>" +
    //        "<td colspan='10' style='border: 1px solid black'><textarea rows='3' cols='1' id='txt_comment' name='txt_comment' class='form-control'></textarea></td>" +
    //        "</tr>";


    onetable += "</table>";

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
            "<div class='col-sm-12'>" + onetable +
            "</div>" +
            "</div>" +
            "</div></div></div></div></div>";

    var btnAddUpdate = "<button class='btn btn-inverse' id='btn_add_sol' name='btn_add_sol' onclick='return SavePaymentClick(this)'><span>Enregistrer ce paiement</span></button>";
    var btnClose = "<button class='btn btn-default bootbox-close-button' onclick='return false' id='btn_savepmt_cancel'><span>Annuler</span></button>";

    var btns = "<div class='modal-body center'>" + btnClose + btnAddUpdate + "</div>";
    var onecontent = startBox + onelineContent + btns + endBox;

    var title = "PAIEMENT";
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
            var h = (w - b) * 0.1;
            return h + "px";
        }
    }).find('.modal-header').css({
        'background': 'url(../../img/menu_005_bg.jpg) repeat-x',
        'text-align': 'center',
        'color': '#C0C0C0'
    });

    // 20210119 correct
    $.each($('[id^=txbDPay_]'), function (idx, value) {
        $(value).datepicker();
        $(value).val(getToday());
    });
    CalCulateTotalPayment();
    return false;
}

function CalCulateTotalPayment(sender) {
    var totalamt = 0;
    var allSods = $("input[id^='txbAmtPay_']");
    allSods.each(function () {
        var thisvalue = $(this).val() * 1;
        totalamt += thisvalue;
    });
    totalamt = ReplaceNumberWithCommas(totalamt);
    $('#lb_total').text(totalamt);
}


function SavePaymentClick(sender) {
ShowPleaseWait();
    $(sender).prop('disabled', true);
    var sodPayment = [];
    var allSods = $("input[id^='txbAmtPay_']");
    allSods.each(function () {
        var thisvalue = $(this).val() * 1;
        var sodPmt = {};
        sodPmt.DcValue = thisvalue;
        var sodId = $(this).attr('cinId') * 1;
        sodPmt.Key = sodId;
        //sodPmt.DValue = getDateStringNullable($('#txbDPay_' + sodId).val());
        //sodPmt.Value = $('#txt_comment_' + sodId).val();
        sodPmt.KeyStr2 = $('#CpyPaymentCode').val();
        sodPmt.Value2 = $('#txt_comment_' + sodId).val();
        sodPayment.push(sodPmt);
    });
    //console.log(sodPayment);
    //$(sender).prop('disabled', false);

    if (sodPayment.length) {
        $('#btn_AddPr').hide();
        var jsondata = JSON.stringify({ cincpys: sodPayment });
        var url = window.webservicePath + "/SaveCinPayments";
        $.ajax({
            url: url,
            type: 'POST',
            contentType: 'application/json; charset=utf-8',
            data: jsondata,
            dataType: 'json',
            success: function (data) {
                var jsdata = data.d;
                var data2Treat = jQuery.parseJSON(jsdata);
                HidePleaseWait();
                var sprIds = "";
                $.each(data2Treat, function (name, value) {
                    sprIds += value + ",";
                });
                uploadPaymentFileClick(sprIds);
                jsSearch();
            },
            error: function (data) {
                HidePleaseWait();
                alert(data.responseText);
            }
        });
    }
}


function uploadPaymentFileClick(cpyIds) {
    ///create a new FormData object
    var formData = new FormData(); //var formData = new FormData($('form')[0]);
    ///get the file and append it to the FormData object
    if ($('#iptUploadFilePopUp')[0].files[0]) {
        formData.append('file', $('#iptUploadFilePopUp')[0].files[0]);
        var url = "../../Services/UploadFilesGeneral.ashx?type=14&cpyIds=" + encodeURIComponent(cpyIds);
        if (cpyIds) {
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
                },
                error: function (e) {
                    //errorHandler
                    $('#btn_close_cin_payment').click();
                    $('#btn_savepmt_cancel').click();
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
        $('#btn_savepmt_cancel').click();
        //loadCinPayementInfo();
    }
}

function viewLgsItem(fId) {
    var url = '../Logistics/Logistics.aspx?lgsId=' + fId + "&mode=view";
    //window.location.href = url;
    HidePleaseWait();
    var win = window.open(url, '_blank');
    win.focus();
}


function viewSodItem(cinFId) {
    ShowPleaseWait();
    var url = '../SupplierOrder/SupplierOrder.aspx' + '?sodId=' + cinFId + '&mode=view';
    HidePleaseWait();
    var win = window.open(url, '_blank');
    win.focus();
}

function viewItem(fId, isInvoice) {
    //ShowPleaseWait();
    var url = "";
    if (isInvoice) {
        url = 'ClientInvoice.aspx?cinId=' + fId + "&mode=view";
    } else {
        url = 'ClientInvoiceA.aspx?cinId=' + fId + "&mode=view";
    }
    //document.location = url;
    
    var win = window.open(url, '_blank');
    win.focus();
    return false;
}

var myApp;
myApp = myApp || (function () {
    var pleaseWaitDiv = $('<div class="modal " style="text-align:center" id="pleaseWaitDialog" data-backdrop="static" data-keyboard="false">' +
        '<div class="modal-header" style="margin-top:200px; border-bottom: 0px !important;"><h1 id="mask_processing">Traitement en cours ...</h1></div>' +
        '<div class="modal-body">' +
        '<img src="../../img/loaders/4.gif"></div></div>');
    return {
        showPleaseWait: function() {
            $('#mask_processing').text('Processing...');
            pleaseWaitDiv.modal();
        },
        hidePleaseWait: function () {
            pleaseWaitDiv.modal('hide');
        },
        showPleaseWaitWithText: function (text) {
            $('#mask_processing').text(text);
            pleaseWaitDiv.modal();
        },

    };
})();


var currentSoc = {};
function getCurrentSoc() {
    var url = window.webservicePath + "/GetCurrentSociety";
    $.ajax({
        type: "POST",
        url: url,
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        success: function (data) {
            HidePleaseWait();
            var jsdata = data.d;
            var data2Treat = jQuery.parseJSON(jsdata);
            currentSoc = data2Treat;
            if (!jQuery.isEmptyObject(connectedUser) && connectedUser.LoginMode === 1) {
                $('#div_for_keyprj').show();
            }
            else {
                $('#div_for_keyprj').hide();
            }
        },
        error: function (data) {
            HidePleaseWait();
            var test = '';
        }
    });
}


function viewCpyFile(cinId, cpyId) {
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
            "<iframe height='600' width='100%' id='iframepdfForPayment'></iframe>" +
            "</div>" +
    // cancel and save buttons
            "</div>" +
            "</div>" +

    // close box
            "</div></div></div></div></div>";
    var btnClose = "<button class='btn btn-default bootbox-close-button' id='btn_close_cin_payment' onclick='return false'><span>Clôturer</span></button>";

    var btns = "<div class='modal-body center'>" + btnClose + "</div>";
    var onecontent = startBox + onelineContent + btns + endBox;

    var title = 'FICHIER DE PAIEMENT CLIENT';
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
//    var cinId = getUrlVars()['cinId'];
//    var cpyId = $(sender).attr('cpyId');
    var src = "../Common/PageForPDF.aspx?type=4&cinId=" + encodeURIComponent(cinId) + "&cpyId=" + encodeURIComponent(cpyId);
    $('#iframepdfForPayment').attr('src', src);
    return false;
}



function downloadCinPdf(sender) {
    var cinId = $(sender).attr('cinId');
    cinId = encodeURIComponent(cinId);
    window.open('../Common/PageDownLoad.aspx?cinId=' + cinId, '_blank');
    return false;
}

var selectedClient = {};
function js_clientChange(sender) {
    var value = $(sender).val().trim();
    if (IsNullOrEmpty(value)) {
        seltectedClientId = 0;
    }
    return false;
}
