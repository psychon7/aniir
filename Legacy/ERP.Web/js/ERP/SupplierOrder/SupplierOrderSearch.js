$(document).ready(initSearch);

function initSearch() {
    //LoadSupplier();
    setAutoCompleteSup();
    setAutoCompleteClient();
    SetLanguageBar();
    getAllGenStt();
}

var hasSet = false;
function viewSearchResult(data2Treat) {
    var withDetail = $('#cbx_show_detail')[0].checked;
    var name = '_pins';
    var dt_name = 'dt' + name;
    var div_name = 'div' + name;
    var th_name = 'th' + name;
    var tb_name = 'tb' + name;
    var tf_name = 'tf' + name;
    var rst_name = 'rst' + name;

    var headerFooter = "<tr>" +
        "<th style='text-align:center'><input type='checkbox' id='cbx_all_sod' onclick='SodAllClick(this)'/></th>" +
        "<th style='text-align:center' class='language_txt'>Fournisseur</th>" +
        "<th style='text-align:center' class='language_txt'>Client</th>" +
        (connectedUser.LoginMode === 1 ? "<th style='text-align:center' class='language_txt'>Sub Fournisseur</th>" : "") +
        "<th style='text-align:center' class='language_txt'>Nom de cmd.</th>" +
        "<th style='text-align:center' class='language_txt'>Code de cmd.</th>" +
        "<th style='text-align:center' class='language_txt'>Status</th>" +
//"<th style='text-align:center' class='language_txt'>D. Creation</th>" +
//"<th style='text-align:center' class='language_txt'>Commercial</th>" +
        //"<th style='text-align:center'>Client<br/>客户</th>" +
        "<th style='text-align:center; width:30%;' class='language_txt'>Détail</th>" +
        "<th style='text-align:center; width:5%;' class='language_txt'>Montant HT</th>" +
        "<th style='text-align:center; width:5%;'class='language_txt'>Montant TTC</th>" +
        "<th style='text-align:center; width:5%;'class='language_txt'>Payé</th>" +
        "<th style='text-align:center; width:5%;'class='language_txt'>A payer</th>" +
        "<th style='text-align:center; width:5%;'class='language_txt'>Relevé de paiement</th>" +
        "<th style='text-align:center; width:5%;'class='language_txt'>Commentaire de paiement</th>" +
        "<th style='text-align:center; width:8%;'class='language_txt'>Comment</th>" +
        "<th style='text-align:center; width:8%;'class='language_txt'>Facture Client</th>" +
        "<th style='text-align:center; width:8%;'class='language_txt'>Transport</th>" +
        "</tr>";

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
    var resultcount = data2Treat.length;
    $('#' + rst_name).text(resultcount);
    if (resultcount > 0) {
        $('.searchresult').show();
        $('#' + th_name).empty();
        $('#' + tf_name).empty();

        $('#' + th_name).append(headerFooter);
        $('#' + tf_name).append(headerFooter);

        var titles = new Array();
        titles.push({ "sTitle": "btn1" });
        titles.push({ "sTitle": "Supplier" });
        titles.push({ "sTitle": "Client" });
        if (connectedUser.LoginMode === 1) {
            titles.push({ "sTitle": "SubSup" });
        }
        titles.push({ "sTitle": "Name" });
        titles.push({ "sTitle": "Code" });
        titles.push({ "sTitle": "Status" });
//        titles.push({ "sTitle": "CDate" });
//        titles.push({ "sTitle": "Cmc" });
        //titles.push({ "sTitle": "Client" });
        titles.push({ "sTitle": "Detail" });
        titles.push({ "sTitle": "Montant HT" });
        titles.push({ "sTitle": "Montant TTC" });
        titles.push({ "sTitle": "Paid" });
        titles.push({ "sTitle": "Need2Pay" });
        titles.push({ "sTitle": "PaymentRcd" });
        titles.push({ "sTitle": "PaymentCmt" });
        titles.push({ "sTitle": "Cmt" });
        titles.push({ "sTitle": "CinCode" });
        titles.push({ "sTitle": "Trans" });

        var displaycount = 1;
        $.each(data2Treat, function (name, value) {
            var dataArray = new Array();
            // 20210119
            if (value.Need2Pay === 0) {
                dataArray.push("");
            } else {
                dataArray.push("<input type='checkbox' id='cbx_sod_" + value.SodId + "' sodId='" + value.SodId + "' onclick='CheckBoxForAddBtn()'/>");
            }
            dataArray.push("<span  onclick='viewItem(\"" + value.SodFId + "\")' style='cursor:pointer;font-weight:bolder; "+ (value.IsCanceled === true ? "text-decoration: line-through;color:red;":"" ) +"'>" + (IsNullOrEmpty(value.Supplier) ? value.SupplierCompanyName : value.Supplier) + "</span>");

            var companyname = value.Client + (IsNullOrEmpty(value.CliAbbr) ? "" : ("-" + value.CliAbbr));
            dataArray.push("<span  onclick='viewItem(\"" + value.SodFId + "\")' style='cursor:pointer;font-weight:bolder; "+ (value.IsCanceled === true  ? "text-decoration: line-through;color:red;":"" ) +"'>" + companyname + "</span>");
            if (connectedUser.LoginMode === 1) {
                dataArray.push("<span  onclick='viewItem(\"" + value.SodFId + "\")' style='cursor:pointer;font-weight:bolder; "+ (value.IsCanceled === true  ? "text-decoration: line-through;color:red;":"" ) +"'>" + value.Supplier2 + "</span>");
            }

            var soddateExpdelivery = IsNullOrEmpty(value.DateExpDelivery) ? "" : ("\r\n<span style='color: red;' title='Date de livraison estimé 预交期'>" + getDateString(value.DateExpDelivery) + "</span>");
            var sodStatus =
                "<span id='span_status_" + value.SodId + "'>" + ((value.SttId !== 0) ? searchFieldValueInArray(allGenStt, 'Key', value.SttId).Value : "无状态可更新") + "</span>" +
                    "<button class='btn btn-primary btn-xs' title='Mettre à jour le status 更新状态' onclick='return updateSttClick(this)' sodId='" + value.SodId + "' sttId='" + value.SttId + "' sodFId='" + value.SodFId + "'><i class='fa fa-refresh' ></i></button>";
            
            
            dataArray.push("<span  onclick='viewItem(\"" + value.SodFId + "\")' style='cursor:pointer;font-weight:bolder; " + (value.IsCanceled === true ? "text-decoration: line-through;color:red;" : "") + "'>" + value.SodName + soddateExpdelivery + "</span>" );
            dataArray.push("<span  onclick='viewItem(\"" + value.SodFId + "\")' style='cursor:pointer;font-weight:bolder; " + (value.IsCanceled === true ? "text-decoration: line-through;color:red;" : "") + "'>" + value.SodCode + "\r\n" + getDateString(value.DateCreation) + "\r\n" + value.Commercial + "</span>" + ((IsNullOrEmpty(value.SodFile) ? "<i class='fa fa-file-o'></i>" : "<i class='fa fa-file-text' title='cliquer pour voir le PI de fournisseur 点击查看供应商PI' onclick='return viewsodfile(this,\"" + value.SodFId + "\")' sodId='" + value.SodId + "' style='cursor:pointer;'></i>")));
dataArray.push(sodStatus);
            
//            dataArray.push("<span  onclick='viewItem(\"" + value.SodFId + "\")' style='cursor:pointer;font-weight:bolder;'>" + getDateString(value.DateCreation) + "</span>");
//            dataArray.push("<span  onclick='viewItem(\"" + value.SodFId + "\")' style='cursor:pointer;font-weight:bolder;'>" + value.Commercial + "</span>");
            //dataArray.push("<span  onclick='viewItem(\"" + value.SodFId + "\")' style='cursor:pointer'>" + (IsNullOrEmpty(value.SodClient) ? '' : value.SodClient) + "</span>");
            // sol détail
            var oneline = "";
            var transinfo = "";
            var comment = "";

            if (value.PurchaseLines.length > 0) {
                if (withDetail) {
                    oneline += "<table style='font-size : 8pt;width:100%;'>";
                    oneline += "<tr>";
                    oneline += "<th style='border: 1px solid black; text-align:center;width:10%;'>Client</th>";
                    oneline += "<th style='border: 1px solid black; text-align:center;width:20%;'>Produit</th>";
                    oneline += "<th style='border: 1px solid black; text-align:center;width:10%'>Réf</th>";
                    oneline += "<th style='border: 1px solid black; text-align:center;width:30%'>Des.</th>";
                    oneline += "<th style='border: 1px solid black; text-align:center;width:10%;'>Qté</th>";
                    oneline += "<th style='border: 1px solid black; text-align:center;width:10%;'>PU</th>";
                    oneline += "<th style='border: 1px solid black; text-align:center;width:10%;'>TOTAL HT</th>";
                    oneline += "</tr>";
                    $.each(value.PurchaseLines, function (name2, sol) {
                        oneline += "<tr>";
                        oneline += "<td style='border: 1px solid black;width:10%;'>" + sol.Client + "</td>";
                        oneline += "<td style='border: 1px solid black;width:20%;'>" + sol.PrdName + "</td>";
                        oneline += "<td style='border: 1px solid black;width:10%;'>" + sol.PitName + "</td>";
                        oneline += "<td style='border: 1px solid black;width:30%;'>" + sol.Description + "</td>";
                        oneline += "<td style='border: 1px solid black; text-align:center;width:10%;'>" + sol.Quantity + "</td>";
                        oneline += "<td style='border: 1px solid black; text-align:right;width:10%;'>" + sol.UnitPriceWithDis.toFixed(2) + "</td>";
                        oneline += "<td style='border: 1px solid black; text-align:right;width:10%;'>" + sol.TotalPrice.toFixed(2) + "</td>";
                        oneline += "</tr>";

                        $.each(sol.LgsInfos, function (lgsname, lglvalue) {
                            transinfo += "<span onclick='viewLgs(\"" + lglvalue.Value4 + "\")' style='cursor:pointer;font-weight:bolder;'>@" + lglvalue.Key2 + ' * ' + lglvalue.Value + '(' + lglvalue.Value2 + ') | ' + lglvalue.Value3 + '</span><br/>';
                        });
                        if (!IsNullOrEmpty(sol.Comment)) {
                            comment += "✏️ " + sol.Comment + "<br/>";
                        }
                    });
                    oneline += "</table>";
                } else {
                    if (value.CliShowDetail) {
                        $.each(value.PurchaseLines, function(name2, sol) {
                            oneline += (sol.Order + "--> " + sol.Quantity + " * " + sol.PrdName + " | " + sol.UnitPriceWithDis.toFixed(2) + " | " + sol.TotalPrice.toFixed(2) + "<br/>");
                            $.each(sol.LgsInfos, function(lgsname, lglvalue) {
                                transinfo += "<span onclick='viewLgs(\"" + lglvalue.Value4 + "\")' style='cursor:pointer;font-weight:bolder;'>@" + lglvalue.Key2 + ' * ' + lglvalue.Value + '(' + lglvalue.Value2 + ') | ' + lglvalue.Value3 + '</span><br/>';
                            });
                            if (!IsNullOrEmpty(sol.Comment)) {
                                comment += "✏️ " + sol.Comment + "<br/>";
                            }
                        });
                    } else {
                        if (value.PurchaseLines.length > 0) {
                            var divHIdeSol = "<button class='btn btn-inverse' title='show detail' id='btn_show_sol_detail_" + value.SodId + "' sodId='" + value.SodId + "' onclick='return ShowHideSol(this)' ><i class='fa fa-plus'></i></button>";
                            divHIdeSol += "<div id='div_hide_sol_" + value.SodId + "' isshowed='0' style='display:none;'>";
                            var divHideLgl = "<button class='btn btn-inverse' title='show detail' id='btn_show_lgl_detail_" + value.SodId + "' sodId='" + value.SodId + "' onclick='return ShowHideLgl(this)' ><i class='fa fa-plus'></i></button>";
                            divHideLgl += "<div id='div_hide_lgl_" + value.SodId + "' isshowed='0' style='display:none;'>";
                            var solhasLgl = false;
                            $.each(value.PurchaseLines, function(name2, sol) {
                                divHIdeSol += (sol.Order + "--> " + sol.Quantity + " * " + sol.PrdName + " | " + sol.UnitPriceWithDis.toFixed(2) + " | " + sol.TotalPrice.toFixed(2) + "<br/>");
                                $.each(sol.LgsInfos, function (lgsname, lglvalue) {
                                    solhasLgl = true;
                                    divHideLgl += "<span onclick='viewLgs(\"" + lglvalue.Value4 + "\")' style='cursor:pointer;font-weight:bolder;'>@" + lglvalue.Key2 + ' * ' + lglvalue.Value + '(' + lglvalue.Value2 + ') | ' + lglvalue.Value3 + '</span><br/>';
                                });
                                if (!IsNullOrEmpty(sol.Comment)) {
                                    comment += "✏️ " + sol.Comment + "<br/>";
                                }
                            });
                            divHIdeSol += "</div>";
                            divHideLgl += "</div>";
                            oneline += divHIdeSol;
                            if (solhasLgl) {
                                transinfo += divHideLgl;
                            }
                        }
                    }
                }
            }

            dataArray.push(oneline);
            dataArray.push(ReplaceNumberWithCommas(value.TotalAmountHt) + " " + value.CurrencySymbol);
            dataArray.push(ReplaceNumberWithCommas(value.TotalAmountTtc) + " " + value.CurrencySymbol);
            dataArray.push(ReplaceNumberWithCommas(value.Paid) + " " + value.CurrencySymbol);


            var color = value.Need2Pay == 0 ? "green" : "red";
            dataArray.push("<span style='color:" + color + "'>" + ReplaceNumberWithCommas(value.Need2Pay)  + " " + value.CurrencySymbol + "</span>");
            // 支付详情
            dataArray.push(value.SodPaymentRecord);
            //            if (!IsNullOrEmpty(value.CinCode)) {
            //                dataArray.push("<span  onclick='viewCinItem(\"" + value.CinFId + "\")' style='cursor:pointer'>" + value.CinCode + "</span>");
            //            } else {
            //                dataArray.push('');
            //            }
            // 支付comment
            dataArray.push(value.SodPaymentComments);            

            var newline = IsNullOrEmpty(value.SupplierComment) ? "" : "<br/>";

            var allCmt = value.SupplierComment + newline + value.InterComment;

            dataArray.push(allCmt + (IsNullOrEmpty(comment) ? "" : ((IsNullOrEmpty(allCmt) ? comment : ("<br/>" + comment)))));
            if (value.CsoList !== null && value.CsoList.length > 0) {
                var cincontent = "";
                var csoCount = 0;
                var csolen = value.CsoList.length;
                $.each(value.CsoList, function (nm, onecso) {
                    cincontent += "<span  onclick='viewCinItem(\"" + onecso.Value2 + "\")' style='cursor:pointer;font-weight:bolder;'>" + onecso.Value + "</span>&nbsp;&nbsp;<i class='fa fa-save' onclick='downloadCinPdf(\"" + onecso.Value2 + "\")' style='cursor:pointer;font-weight:bolder;' alt='download invoice'></i>";
                    csoCount++;
                    if (csoCount < csolen) {
                        cincontent += "<br/>";
                    }
                });
                dataArray.push(cincontent);
            } else {
                dataArray.push('');
            }

            dataArray.push(transinfo);
            //            if (value.SodHasSin) {
            //                dataArray.push("<span  onclick='viewCinItem(\"" + value.CinFId + "\")' style='cursor:pointer'>" + value.CinCode + "</span>");
            //            } else {
            //                dataArray.push(value.SinCode);
            //            }
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
                    "aoColumns": titles,
                    "sScrollY": "50px",
                    "bScrollCollapse": true
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
    } else {
        $('.searchresult').hide();
    }
    myApp.hidePleaseWait();
}

function downloadCinPdf(cinId) {
    cinId = encodeURIComponent(cinId);
    window.open('../Common/PageDownLoad.aspx?cinId=' + cinId, '_blank');
    return false;
}

function ShowHideSol(sender) {
    var sodId = $(sender).attr('sodId');
    var div_hide_sol = $('#div_hide_sol_' + sodId);
    var isShow = div_hide_sol.attr('isshowed');
    if (isShow === '0') {
        div_hide_sol.show();
        div_hide_sol.attr('isshowed','1');
    } else {
        div_hide_sol.hide();
        div_hide_sol.attr('isshowed', '0');
    }
    return false;
}

function ShowHideLgl(sender) {
    var sodId = $(sender).attr('sodId');
    var div_hide_sol = $('#div_hide_lgl_' + sodId);
    var isShow = div_hide_sol.attr('isshowed');
    if (isShow === '0') {
        div_hide_sol.show();
        div_hide_sol.attr('isshowed', '1');
    } else {
        div_hide_sol.hide();
        div_hide_sol.attr('isshowed', '0');
    }
    return false;
}

function viewItem(fId) {
    //myApp.showPleaseWait();
    var url = 'SupplierOrder.aspx?sodId=' + fId + "&mode=view";
    //window.location.href = url;
    var win = window.open(url, '_blank');
    win.focus();
}

function viewLgs(fId) {
    var url = '../Logistics/Logistics.aspx?lgsId=' + fId + "&mode=view";
    //window.location.href = url;
    var win = window.open(url, '_blank');
    win.focus();
    return false;
}

function viewSinItem(fId) {
    //myApp.showPleaseWait();
    var url = '../SupplierInvoice/SupplierInvoice.aspx?sinId=' + fId + "&mode=view";
    //window.location.href = url;
    var win = window.open(url, '_blank');
    win.focus();
}

function LoadSupplier() {
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
                $.each(data2Treat, function (name, value) {
                    $(budgetId)
                        .append($("<option></option>")
                            .attr("data-value", value.FId)
                            .attr("value", value.Id)
                            .text(value.CompanyName)
                            );
                });
                getClient();
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

var sodresult = [];
function js_search() {
    sodresult = [];
    var url = window.webservicePath + "/SearchSupplierOrder";
    var sod = {};
    sod.SodName = $('#SodName').val().trim();
    sod.SodCode = $('#SodCode').val().trim();
    sod.SupId = seltectedSupId;//$('#SupId').val().trim();
    sod.CliId = seltectedClientId;//$('#Client').find('option:selected').attr('value') * 1;
    // 仅在此处用作搜索
    sod._DateStartProduction = $('#DateCreationFrom').val().trim();
    sod._DateCompleteProduction = $('#DateCreationTo').val().trim();
    sod.SodDiscountAMount = $('#SolQty').val().trim() * 1;
    // 仅在此处用于搜索
    sod.InterComment = $('#PaymentCode').val().trim();

    // 仅在此处用于搜索
    sod.SodFinish = $('#cbx_only_to_pay')[0].checked;
    sod.IsCanceled =  $('#cbx_canceled')[0].checked;
    var sttId = $('#SttId').find('option:selected').attr('value') * 1;
    sod.SttId = sttId;
    // 仅在此处用于搜索
    sod.SodHasSin=  $('#cbx_withoutinvoice')[0].checked;
    

    var jsondata = JSON.stringify({ sod: sod });
    myApp.showPleaseWait();
    $.ajax({
        url: url,
        type: 'POST',
        contentType: 'application/json; charset=utf-8',
        data: jsondata,
        dataType: 'json',
        success: function (data) {
            var jsdata = data.d;
            var jsondata = jQuery.parseJSON(jsdata);
            sodresult = jsondata;
            if (jsondata.length === 0) {
                NoResultMsg();
                $('#bnt_download_rst').hide();
            }
            
            viewSearchResult(jsondata);
            $('#bnt_download_rst').show();
            SetLanguageBar();
        },
        error: function (data) {
            myApp.hidePleaseWait();
        }
    });
    return false;
}

function createItem() {
    ShowPleaseWait();
    var url = "SupplierOrder.aspx";
    var win = window.open(url, '_blank');
    HidePleaseWait();
    win.focus();
}

function SodAllClick(sender) {
    var ischeck = $(sender).is(':checked');
    var allDfos = $("input[id^='cbx_sod_']");
    allDfos.each(function () {
        $(this).prop('checked', ischeck);
    });
    if (ischeck) {
        $('#btn_AddPr').show();
    } else {
        $('#btn_AddPr').hide();
    }
}

function CheckBoxForAddBtn() {
    var ischeck = false;
    var allDfos = $("input[id^='cbx_sod_']");
    allDfos.each(function () {
        ischeck = ischeck || $(this).prop('checked');
    });
    if (ischeck) {
        $('#btn_AddPr').show();
    } else {
        $('#btn_AddPr').hide();
    }
}

function AddPaymentRecord() {
    var sod2Add = [];
    var allDfos = $("input[id^='cbx_sod_']");
    allDfos.each(function () {
        if ($(this).prop('checked')) {
            var sodid = $(this).attr('sodId') * 1;
            var onesod = searchFieldValueInArray(sodresult, 'SodId', sodid);
            if (onesod) {
                sod2Add.push(onesod);
            }
        }
    });
    if (sod2Add.length > 0) {
        ShowSod2Pay(sod2Add);
    }
    return false;
}

function ShowSod2Pay(sods) {

    var lineCount = 1;
    var onetable = "<table style='border: 1px solid black; text-align:center; width:100% !important;'>";
    onetable += "<tr>" +
        "<th style='border: 1px solid black; text-align:center' >Fournisseur</br>供货商</th>" +
        (connectedUser.LoginMode === 1 ? "<th style='text-align:center'>Sub Fournisseur</br>子供货商</th>" : "") +
        "<th style='border: 1px solid black; text-align:center' >Nom de commande</br>订单名</th>" +
        "<th style='border: 1px solid black; text-align:center' >Code de commande</br>订单号</th>" +
        "<th style='border: 1px solid black; text-align:center; width: 30%;' >Détail</br>详情</th>" +
        "<th style='border: 1px solid black; text-align:center' >Montant HT</br>未税总价</th>" +
        "<th style='border: 1px solid black; text-align:center' >Montant TTC</br>含税总价</th>" +
        "<th style='border: 1px solid black; text-align:center' >Payé</br>已支付</th>" +
        "<th style='border: 1px solid black; text-align:center' >A payer</br>需支付</th>" +
        "<th style='border: 1px solid black; text-align:center; width: 10%;' >D. paiement</br>支付日期</th>" +
        "<th style='border: 1px solid black; text-align:center; width: 10%;' >Montant payé cette fois</br>此次支付金额</th>" +
        "<th style='border: 1px solid black; text-align:center; width: 10%;' >Cmt de paiement</br>附言</th>" +
        "</tr>";

    $.each(sods, function (name, value) {
        var style = lineCount % 2 == 0 ? "style='background-color:azure'" : "";
        lineCount++;
        onetable += "<tr " + style + ">";

        onetable += "<td style='border: 1px solid black; text-align:center'>" + (IsNullOrEmpty(value.Supplier) ? value.SupplierCompanyName : value.Supplier) + "</td>";
        if (connectedUser.LoginMode === 1) {
            onetable += "<td style='border: 1px solid black; text-align:center'>" + value.Supplier2 + "</td>";
        }
        onetable += "<td style='border: 1px solid black; text-align:center'>" + value.SodName + "</td>";
        onetable += "<td style='border: 1px solid black; text-align:center'>" + value.SodCode + "</td>";

        // sol détail
        var oneline = "";
        if (value.PurchaseLines.length > 0) {
            oneline += "<table style='font-size : 9pt; width: 100%'>";
            oneline += "<tr>";
            oneline += "<td style='border: 1px solid black; text-align:center'>Client</td>";
            oneline += "<td style='border: 1px solid black; text-align:center'>Produit</td>";
            oneline += "<td style='border: 1px solid black; text-align:center'>Réf</td>";
            oneline += "<td style='border: 1px solid black; text-align:center'>Des.</td>";
            oneline += "<td style='border: 1px solid black; text-align:center'>Qté</td>";
            oneline += "<td style='border: 1px solid black; text-align:center'>PU</td>";
            oneline += "<td style='border: 1px solid black; text-align:center'>TOTAL HT</td>";
            oneline += "</tr>";
            $.each(value.PurchaseLines, function (name2, sol) {
                oneline += "<tr>";
                oneline += "<td style='border: 1px solid black'>" + sol.Client + "</td>";
                oneline += "<td style='border: 1px solid black'>" + sol.PrdName + "</td>";
                oneline += "<td style='border: 1px solid black'>" + sol.PitName + "</td>";
                oneline += "<td style='border: 1px solid black'>" + sol.Description + "</td>";
                oneline += "<td style='border: 1px solid black; text-align:center'>" + sol.Quantity + "</td>";
                oneline += "<td style='border: 1px solid black; text-align:right'>" + sol.UnitPriceWithDis.toFixed(2) + "</td>";
                oneline += "<td style='border: 1px solid black; text-align:right'>" + sol.TotalPrice.toFixed(2) + "</td>";
                oneline += "</tr>";
            });
            oneline += "</table>";
        }

        onetable += "<td style='border: 1px solid black; text-align:center'>" + oneline + "</td>";
        onetable += "<td style='border: 1px solid black; text-align:center'>" + ReplaceNumberWithCommas(value.TotalAmountHt) + "</td>";
        onetable += "<td style='border: 1px solid black; text-align:center'>" + ReplaceNumberWithCommas(value.TotalAmountTtc) + "</td>";
        onetable += "<td style='border: 1px solid black; text-align:center'>" + ReplaceNumberWithCommas(value.Paid) + "</td>";
        onetable += "<td style='border: 1px solid black; text-align:center'>" + ReplaceNumberWithCommas(value.Need2Pay) + "</td>";
        onetable += "<td style='border: 1px solid black; text-align:center'><input id='txbDPay_" + value.SodId + "' sodId='" + value.SodId + "' type='text'  class='form-control datepicker' /></td>";
        onetable += "<td style='border: 1px solid black; text-align:center'><input onkeyup='CalCulateTotalPayment(this)' id='txbAmtPay_" + value.SodId + "' sodId='" + value.SodId + "' type='number'  class='form-control' value='" + value.Need2Pay + "' /></td>";

        onetable += "<td style='border: 1px solid black'><textarea rows='3' cols='1' id='txt_comment_" + value.SodId + "'  name='txt_comment_" + value.SodId + "' sodId='" + value.SodId + "' class='form-control'></textarea></td>";
        onetable += "</tr>";
    });

    // sum line
    onetable += "<tr>" +
        "<td colspan='" + (connectedUser.LoginMode === 1 ? '10' : '9') + "' style='border: 1px solid black'></td>" +
        "<td style='font-size: 12pt;border: 1px solid black'>TOTAL</td>" +
        "<td style='font-size: 12pt;border: 1px solid black'><label class='col-sm-1 control-label' id='lb_total' style='width: 100%'>0,00</label></td>" +
        "</tr>";

    // file
    onetable += "<tr>" +
        "<td colspan='" + (connectedUser.LoginMode === 1 ? '13' : '12') + "' style='border: 1px solid black'>" +
        "<div class='form-group'>" +
        "<label class='col-sm-3 control-label'>Code de paiement (pour recherche le paiement)支付码</label>" +
        "<div class='col-sm-3'><input type='text' id='SprPayment' class='form-control' value=''/></div>" +
        "<label class='col-sm-3 control-label'>Le payeur 支付人</label>" +
        "<div class='col-sm-3'><input type='text' id='SprPayer' class='form-control' value=''/></div>" +
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
        'width': '95%'
    }).find('.modal-content').css({
        'margin-top': function () {
            var w = $(window).height();
            var b = $(".modal-dialog").height();
            // should not be (w-h)/2
            var h = (w - b) * 0.00;
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
        var sodId = $(this).attr('sodId') * 1;
        sodPmt.Key = sodId;
        sodPmt.DValue = getDateStringNullable($('#txbDPay_' + sodId).val());
        sodPmt.Value = $('#txt_comment_' + sodId).val();
        sodPmt.KeyStr2 = $('#SprPayment').val();
        sodPmt.KeyStr1 = $('#SprPayer').val();
        sodPayment.push(sodPmt);
    });
    //console.log(sodPayment);
    //$(sender).prop('disabled', false);

    if (sodPayment.length) {
        $('#btn_AddPr').hide();
        var jsondata = JSON.stringify({ sodprd: sodPayment });
        var url = window.webservicePath + "/SaveSupplierOrderPayment";
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
                js_search();
            },
            error: function (data) {
                HidePleaseWait();
                alert(data.responseText);
            }
        });
    }
}

function uploadPaymentFileClick(sprIds) {
    ///create a new FormData object
    var formData = new FormData(); //var formData = new FormData($('form')[0]);
    ///get the file and append it to the FormData object
    if ($('#iptUploadFilePopUp')[0].files[0]) {
        formData.append('file', $('#iptUploadFilePopUp')[0].files[0]);
        var url = "../../Services/UploadFilesGeneral.ashx?type=12&sprIds=" + encodeURIComponent(sprIds);
        if (sprIds) {
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

function viewCinItem(cinFId) {
    ShowPleaseWait();
    var url = '../ClientInvoice/ClientInvoice.aspx' + '?cinId=' + cinFId + '&mode=view';
    HidePleaseWait();
    var win = window.open(url, '_blank');
    win.focus();
}

var allclient = [];
function getClient() {
    ShowPleaseWait();
    var elementId = 'Client';
    var url = window.webservicePath + "/GetAllClients";
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
                allclient = [];
                allclient = data2Treat;
                $(budgetId).append($("<option>Sélectionner un client 选择一个客户</option>").attr("value", "0").attr("data-value", "0"));
                $.each(data2Treat, function (name, value) {
                    $(budgetId).append($("<option></option>").attr("value", value.Id).attr("data-value", value.FId).text(value.CompanyName));
                });
                HidePleaseWait();
            } else {
                HidePleaseWait();
                // authentication error
                AuthencationError();
            }
        },
        error: function (data) {
            var test = '';
            alert(data);
        }
    });

}


var seltectedSupId = 0;
var supplierList = [];
function setAutoCompleteSup() {
   var url = window.webservicePath + "/GetSupplierByKeyword";
    //var cliFId = $('#cinClient :selected').attr('data-value');
    $("#SupList").autocomplete({
        source: function(request, response) {
            $.ajax({
                url: url,
                data: "{ 'keyword': '" + request.term + "'}",
                dataType: "json",
                type: "POST",
                contentType: "application/json; charset=utf-8",
                success: function(data) {
                    seltectedSupId = 0;
                    var jsdata = data.d;
                    var data2Treat = jQuery.parseJSON(jsdata);
                    supplierList = [];
                    supplierList = data2Treat;
                    if (data2Treat.length > 0) {
                        response($.map(data2Treat, function(item) {
                            return {
                                label: (item.Abbreviation == null ? (item.CompanyName) : (item.Abbreviation + " | " + item.CompanyName)),
                                val: item.Id,
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
            seltectedSupId = i.item.val * 1;
            //SupplierChangedBySelected(seltectedSupFId, 0);
        },
        minLength: 2
    });
}


var seltectedClientId = 0;
var ClientList = [];
function setAutoCompleteClient() {
   var url = window.webservicePath + "/SearchClientByName";
    //var cliFId = $('#cinClient :selected').attr('data-value');
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
//                    alert(response.responseText);
                    //console.log(response);
                },
                failure: function(response) {
                    alert(response.responseText);
                }
            });
        },
        select: function(e, i) {
            seltectedClientId = i.item.val * 1;
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

function InitClient(sender) {
    var value = $(sender).val().trim();
    if (IsNullOrEmpty(value)) {
        seltectedClientId = 0;
    }
    return false;
}


function viewSprFile(sodId,sprid) {
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

    var title = 'FICHIER DE PAIEMENT';
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
    //var sprid = $(sender).attr('sprid');
    var src = "../Common/PageForPDF.aspx?type=8&sodId=" + encodeURIComponent(sodId) + "&sprId=" + encodeURIComponent(sprid);
    $('#iframepdfForPayment').attr('src', src);
    return false;
}

function downloadresult_old() {
    try {
        var csv = "";
        // title 
        csv += "CLIENT;INVOICE NO;SO NO;STATUS;SUPPLIER;PRODUCT;TOTAL AMOUNT SALE;REST A PAYER SALE;TOTAL AMOUNT PURCHASE;DEJA PAYE;REST A PAYER;COMMENT;";
        $.each(sodresult, function(name, sodvalue) {
            csv += "\r\n";
            if (sodvalue.CsoList != null && sodvalue.CsoList.length > 0) {
                // client invoice is not empty
                $.each(sodvalue.CsoList, function(name2, cins) {
                    csv += sodvalue.Client + ";";
                    csv += cins.Value.split('-')[0].trim() + ";";
                    csv += sodvalue.SodCode + ";";
                    var sodStatus = ((sodvalue.SttId !== 0) ? searchFieldValueInArray(allGenStt, 'Key', sodvalue.SttId).Value : "无状态可更新");
                    csv += sodStatus + ";";
                    csv += sodvalue.SupplierCompanyName + ";";
                    $.each(sodvalue.PurchaseLines, function(name2, sol) {
                        csv += (sol.Quantity + " * " + sol.PrdName + " | ");
                    });
                    csv += ";";
                    csv += cins.DcValue + ";"; // total amount sale
                    csv += cins.DcValue2 + ";"; // total amount sale rest to pay
                    csv += sodvalue.TotalAmountTtc + ";"; // total amount purchase
                    csv += sodvalue.Paid + ";"; // paid
                    csv += sodvalue.Need2Pay + ";"; // need 2 payer
                    csv += sodvalue.CurrencySymbol + ";"; // devises
                    csv += ";"; // comment
                });
            } else {
                // client invoice is empty
                csv += sodvalue.Client + ";";
                csv += ";";
                csv += sodvalue.SodCode + ";";
                var sodStatus = ((sodvalue.SttId !== 0) ? searchFieldValueInArray(allGenStt, 'Key', sodvalue.SttId).Value : "无状态可更新");
                csv += sodStatus + ";";
                csv += sodvalue.SupplierCompanyName + ";";
                $.each(sodvalue.PurchaseLines, function(name2, sol) {
                    csv += (sol.Quantity + " * " + sol.PrdName + " | ");
                });
                csv += ";";
                csv += ";"; // total amount sale
                csv += ";"; // total amount sale rest to pay
                csv += sodvalue.TotalAmountTtc + ";"; // total amount purchase
                csv += sodvalue.Paid + ";"; // paid
                csv += sodvalue.Need2Pay + ";"; // need 2 payer
                csv += sodvalue.CurrencySymbol + ";"; // devises
                csv += ";"; // comment
            }
        });
        var csv_content = csv,
            download = document.createElement("a"),
            blob = new Blob(["\ufeff", csv_content], { type: "text/csv;charset=ISO-8859-1" });

        download.href = window.URL.createObjectURL(blob);
        download.download = "Details for AFF.csv";
        var event = document.createEvent("MouseEvents");
        event.initMouseEvent(
            "click", true, false, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null
        );
        download.dispatchEvent(event);
    } catch (e) {

    }
}

function downloadresultclick() {
    var buttons = '<button class="btn btn-default bootbox-close-button" onclick="return downloadresultWithDetails()"><span>AVEC 带</span></button>' +
        '<button class="btn btn-default bootbox-close-button" onclick="return downloadresult()"><span>SANS 不带</span></button>';
    PopUpFunc('Télécharger les résultats de recherche<br/>下载搜索结果','<span style="text-align:center">Voulez-vous apporter les détails de la commande? 是否带订单详情？</span>',buttons,'30%','');
    return false;
}

function downloadresult() {
    try {
        //var browserLng = navigator.language;
        //var replacecomma = !browserLng.includes('zh');
        var replacecomma = !jQuery.isEmptyObject(searchFieldValueInSimpleArray(navigator.languages, 'fr-FR'));
        var data_type = 'data:application/vnd.ms-excel';
        var tab_text = '<html xmlns:x="urn:schemas-microsoft-com:office:excel">';
        tab_text += '<head>';
        tab_text += '<xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet>';
        tab_text += '<x:Name>SOResult</x:Name>';
        tab_text += '<x:WorksheetOptions><x:Panes></x:Panes></x:WorksheetOptions></x:ExcelWorksheet>';
        tab_text += '</x:ExcelWorksheets></x:ExcelWorkbook></xml>';
        tab_text += '</head>';
        tab_text += '<body>';
        tab_text += "<table border='1px'>";
        var thstyle = 'height: 40px; font-size: middle; background-color:#E8F2FF';
        var thstylNarrow = 'width:90px;height: 40px; font-size: middle; background-color:#E8F2FF';
        tab_text += "<tr>" +
            "<th style='"+thstyle+"'>CLIENT</th>" +
            "<th style='"+thstyle+"'>INVOICE NO</th>" +
            "<th style='"+thstyle+"'>SO NO</th>" +
            "<th style='"+thstyle+"'>SO NAME</th>" +
            "<th style='"+thstyle+"'>STATUS</th>" +
            "<th style='"+thstyle+"'>SUPPLIER</th>" +
            "<th style='"+thstyle+"'>PRODUCT</th>" +
            "<th style='"+thstylNarrow+"'>TOTAL AMOUNT PURCHASE</th>" +
            "<th style='" + thstylNarrow + "'>DEJA PAYE</th>" +
            "<th style='" + thstylNarrow + "'>RELEVÉ DE PAIEMENT</th>" +
            "<th style='" + thstylNarrow + "'>COMMENTAIRE DE PAIEMENT</th>" +
            "<th style='"+thstylNarrow+"'>REST A PAYER</th>" +
            "<th style='"+thstyle+"'>DEVISE DE SO</th>"+
            "<th style='"+thstyle+"'>DEVISE DE FA</th>" +
            "<th style='"+thstylNarrow+"'>TOTAL AMOUNT SALE</th>" +
            "<th style='"+thstylNarrow+"'>REST A PAYER SALE</th>" +
            "</tr>";
        tab_text += "<tr>" +
            "<th style='" + thstyle + "'>客户</th>" +
            "<th style='" + thstyle + "'>客户发票NO</th>" +
            "<th style='" + thstyle + "'>采购订单NO</th>" +
            "<th style='" + thstyle + "'>采购订单名</th>" +
            "<th style='" + thstyle + "'>订单状态</th>" +
            "<th style='" + thstyle + "'>供货商</th>" +
            "<th style='" + thstyle + "'>产品名称</th>" +
            "<th style='" + thstylNarrow + "'>含税采购总价</th>" +
            "<th style='" + thstylNarrow + "'>采购订单已支付</th>" +
            "<th style='" + thstylNarrow + "'>支付详情</th>" +
            "<th style='" + thstylNarrow + "'>支付备注</th>" +
            "<th style='" + thstylNarrow + "'>采购订单未支付</th>" +
            "<th style='" + thstyle + "'>采购订单货币</th>" +
            "<th style='" + thstyle + "'>客户发票货币</th>" +
            "<th style='" + thstylNarrow + "'>客户发票总价</th>" +
            "<th style='" + thstylNarrow + "'>客户发票未支付</th>" +
            "</tr>";
        var nmlHeight = " height : 20px;display:table-cell; vertical-align:middle; font-size: 16px;";
        var width40 = " width : 90px;display:table-cell; vertical-align:middle; font-size: 16px;";
        var nmlWidth = " width : 120px;display:table-cell; vertical-align:middle; font-size: 15px;";
        var lrgWidth = " width : 240px;display:table-cell; vertical-align:middle;";
        var textcenter = " text-align: center;";
        var textleft = " text-align: left;";
        var textright= " text-align: right;";
        var nmlWidth2 = " width : 50px;display:table-cell; vertical-align:middle;";
        var bggreen = "font-size: middle;;background-color:#fff; color:#000;";
        var bgyellow = "background-color:#ffeb9c; color:#9c5700;";
        var bgred = "background-color:#ffc7ce; color:#9c0006;";

        var csv = "";
        $.each(sodresult, function(name, sodvalue) {
            csv += "\r\n";
                // client invoice is not empty
            var paymentInfo = sodvalue.SodPaymentRecord;
            paymentInfo = replaceAll(paymentInfo, " → ", "\r\n → ");
            var paytcmt = sodvalue.SodPaymentComments;
            if (sodvalue.CsoList != null && sodvalue.CsoList.length > 0) {
                $.each(sodvalue.CsoList, function(name2, cins) {
                    var sodStatus = ((sodvalue.SttId !== 0) ? searchFieldValueInArray(allGenStt, 'Key', sodvalue.SttId).Value : "无状态可更新");
                    var soldetails = "";
                    $.each(sodvalue.PurchaseLines, function(name2, sol) {
                        soldetails += (sol.Quantity + " * " + sol.PrdName + " | ");
                    });
                    if (sodvalue.IsCanceled) {
                        sodStatus = "已取消";
                    }
                    if (IsNullOrEmpty(paymentInfo)) {
                        paymentInfo = "";
                    }
                    if (IsNullOrEmpty(paytcmt)) {
                        paytcmt = "";
                    }

                    tab_text += "<tr>" +
                        "<td style='" + nmlWidth + textleft + bggreen + "'>" + sodvalue.Client + "</td>" +
                        "<td style='" + nmlWidth + textleft + bggreen + "'>" + cins.Value.split('-')[0].trim() + "</td>" +
                        "<td style='" + nmlWidth + textleft + bggreen + "'>" + sodvalue.SodCode + "</td>" +
                        "<td style='" + nmlWidth + textleft + bggreen + "'>" + sodvalue.SodName + "</td>" +
                        "<td style='" + nmlWidth + textleft + bggreen + "'>" + sodStatus + "</td>" +
                        "<td style='" + nmlWidth + textleft + bggreen + "'>" + sodvalue.SupplierCompanyName + "</td>" +
                        "<td style='" + lrgWidth + textleft + bggreen + "'>" + soldetails + "</td>" +
                        "<td style='" + width40 + textright + bggreen + "'>" + (replacecomma ? ReplaceNumberWithCommas(sodvalue.TotalAmountTtc) : sodvalue.TotalAmountTtc) + "</td>" +
                        "<td style='" + width40 + textright + bggreen + "'>" + (replacecomma ? ReplaceNumberWithCommas(sodvalue.Paid) : sodvalue.Paid) + "</td>" +
                        "<td style='" + width40 + textright + bggreen + "'>" + paymentInfo + "</td>" +
                        "<td style='" + width40 + textright + bggreen + "'>" + paytcmt + "</td>" +
                        "<td style='" + width40 + textright + bggreen + "'>" + (replacecomma ? ReplaceNumberWithCommas(sodvalue.Need2Pay) : sodvalue.Need2Pay) + "</td>" +
                        "<td style='" + nmlWidth + textcenter + bggreen + "'>" + sodvalue.CurrencySymbol + "</td>" +
                        "<td style='" + nmlWidth + textcenter + bggreen + "'>" + cins.Value3 + "</td>" +
                        "<td style='" + width40 + textright + bggreen + "'>" + (replacecomma ? ReplaceNumberWithCommas(cins.DcValue) : cins.DcValue) + "</td>" +
                        "<td style='" + width40 + textright + bggreen + "'>" + (replacecomma ? ReplaceNumberWithCommas(cins.DcValue2) : cins.DcValue2) + "</td>" +
                        "</tr>";
                });
            } else {
                var soldetails = "";
                $.each(sodvalue.PurchaseLines, function(name2, sol) {
                    soldetails += (sol.Quantity + " * " + sol.PrdName + " | ");
                });
//                // client invoice is empty
//                csv += sodvalue.Client + ";";
//                csv += ";";
//                csv += sodvalue.SodCode + ";";
                var sodStatus = ((sodvalue.SttId !== 0) ? searchFieldValueInArray(allGenStt, 'Key', sodvalue.SttId).Value : "无状态可更新");
//                csv += sodStatus + ";";
//                csv += sodvalue.SupplierCompanyName + ";";
//                csv += ";";
//                csv += ";"; // total amount sale
//                csv += ";"; // total amount sale rest to pay
//                csv += sodvalue.TotalAmountTtc + ";"; // total amount purchase
//                csv += sodvalue.Paid + ";"; // paid
//                csv += sodvalue.Need2Pay + ";"; // need 2 payer
//                csv += sodvalue.CurrencySymbol + ";"; // devises
//                csv += ";"; // comment

                if (sodvalue.IsCanceled) {
                    sodStatus = "已取消";
                }
                if (IsNullOrEmpty(paymentInfo)) {
                    paymentInfo = "";
                }
                if (IsNullOrEmpty(paytcmt)) {
                    paytcmt = "";
                }
                tab_text += "<tr>" +
                    "<td style='" + nmlWidth + textleft + bggreen + "'>" + sodvalue.Client + "</td>" +
                    "<td style='" + nmlWidth + textleft + bggreen + "'></td>" +
                    "<td style='" + nmlWidth + textleft + bggreen + "'>" + sodvalue.SodCode + "</td>" +
                    "<td style='" + nmlWidth + textleft + bggreen + "'>" + sodvalue.SodName + "</td>" +
                    "<td style='" + nmlWidth + textleft + bggreen + "'>" + sodStatus + "</td>" +
                    "<td style='" + nmlWidth + textleft + bggreen + "'>" + sodvalue.SupplierCompanyName + "</td>" +
                    "<td style='" + lrgWidth + textleft + bggreen + "'>" + soldetails + "</td>" +
                    "<td style='" + width40 + textright + bggreen + "'>" + (replacecomma ? ReplaceNumberWithCommas(sodvalue.TotalAmountTtc) : sodvalue.TotalAmountTtc) + "</td>" +
                    "<td style='" + width40 + textright + bggreen + "'>" + (replacecomma ? ReplaceNumberWithCommas(sodvalue.Paid) : sodvalue.Paid) + "</td>" +
                    "<td style='" + width40 + textright + bggreen + "'>" + paymentInfo + "</td>" +
                    "<td style='" + width40 + textright + bggreen + "'>" + paytcmt + "</td>" +
                    "<td style='" + width40 + textright + bggreen + "'>" + (replacecomma ? ReplaceNumberWithCommas(sodvalue.Need2Pay) : sodvalue.Need2Pay) + "</td>" +
                    "<td style='" + nmlWidth + textcenter + bggreen + "'>" + sodvalue.CurrencySymbol + "</td>" +
                    "<td style='" + nmlWidth + textcenter + bggreen + "'></td>" +
                    "<td style='" + width40 + textright + bggreen + "'></td>" +
                    "<td style='" + width40 + textright + bggreen + "'></td>" +
                    "</tr>";
            }
        });
        tab_text += '</table></body></html>';
        var csv_content = tab_text,
            download = document.createElement("a"),
            blob = new Blob(["\ufeff", tab_text], {
                type: "application/csv;charset=ISO-8859-1;"
            });
        var today = new Date();
        var dd = today.getDate();
        var mm = today.getMonth() + 1; //January is 0!
        var yyyy = today.getFullYear();
        if (dd < 10) {
            dd = '0' + dd;
        }
        if (mm < 10) {
            mm = '0' + mm;
        }
        today = yyyy + mm + dd;
        var nowtime = new Date();
        var datetime = "-V" + today + '-' + nowtime.getHours() + nowtime.getMinutes() + nowtime.getSeconds();

        download.href = window.URL.createObjectURL(blob);
        download.download = "SOResult" + datetime + ".xls";
        var event = document.createEvent("MouseEvents");
        event.initMouseEvent(
            "click", true, false, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null
        );
        download.dispatchEvent(event);

    } catch (e) {

    } 
}

function downloadresultWithDetails() {
    try {
        var replacecomma = !jQuery.isEmptyObject(searchFieldValueInSimpleArray(navigator.languages, 'fr-FR'));
        var data_type = 'data:application/vnd.ms-excel';
        var tab_text = '<html xmlns:x="urn:schemas-microsoft-com:office:excel">';
        tab_text += '<head>';
        tab_text += '<xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet>';
        tab_text += '<x:Name>SOResult</x:Name>';
        tab_text += '<x:WorksheetOptions><x:Panes></x:Panes></x:WorksheetOptions></x:ExcelWorksheet>';
        tab_text += '</x:ExcelWorksheets></x:ExcelWorkbook></xml>';
        tab_text += '</head>';
        tab_text += '<body>';
        tab_text += "<table border='1px'>";
        var thstyle = 'height: 40px; font-size: middle; background-color:#E8F2FF';
        var thstylNarrow = 'width:90px;height: 40px; font-size: middle; background-color:#E8F2FF';
        tab_text += "<tr>" +
            "<th style='"+thstyle+"'>CLIENT</th>" +
            "<th style='"+thstyle+"'>INVOICE NO</th>" +
            "<th style='"+thstyle+"'>SO NO</th>" +
            "<th style='"+thstyle+"'>SO NAME</th>" +
            "<th style='"+thstyle+"'>STATUS</th>" +
            "<th style='"+thstyle+"'>SUPPLIER</th>" +
            "<th style='"+thstyle+"'>PRODUCT</th>" +
            "<th style='"+thstylNarrow+"'>QUANTITY</th>" +
            "<th style='"+thstylNarrow+"'>UNIT PRICE (WITH DISCOUNT)</th>" +
            "<th style='"+thstylNarrow+"'>TOTAL AMOUNT H.T.</th>" +
            "<th style='"+thstylNarrow+"'>TOTAL AMOUNT T.T.C.</th>" +
            "<th style='"+thstylNarrow+"'>TOTAL AMOUNT PURCHASE</th>" +
            "<th style='" + thstylNarrow + "'>DEJA PAYE</th>" +
            "<th style='" + thstylNarrow + "'>RELEVÉ DE PAIEMENT</th>" +
            "<th style='" + thstylNarrow + "'>COMMENTAIRE DE PAIEMENT</th>" +
            "<th style='"+thstylNarrow+"'>REST A PAYER</th>" +
            "<th style='"+thstyle+"'>DEVISE DE SO</th>"+
            "<th style='"+thstyle+"'>DEVISE DE FA</th>" +
            "<th style='"+thstylNarrow+"'>TOTAL AMOUNT SALE</th>" +
            "<th style='"+thstylNarrow+"'>REST A PAYER SALE</th>" +
            "</tr>";
        tab_text += "<tr>" +
            "<th style='" + thstyle + "'>客户</th>" +
            "<th style='" + thstyle + "'>客户发票NO</th>" +
            "<th style='" + thstyle + "'>采购订单NO</th>" +
            "<th style='" + thstyle + "'>采购订单名</th>" +
            "<th style='" + thstyle + "'>订单状态</th>" +
            "<th style='" + thstyle + "'>供货商</th>" +
            "<th style='" + thstyle + "'>产品名称</th>" +
            "<th style='" + thstylNarrow + "'>数量</th>" +
            "<th style='" + thstylNarrow + "'>采购单价（折后价）</th>" +
            "<th style='" + thstylNarrow + "'>未税采购总价</th>" +
            "<th style='" + thstylNarrow + "'>含税采购总价</th>" +
            "<th style='" + thstylNarrow + "'>含税采购总价</th>" +
            "<th style='" + thstylNarrow + "'>采购订单已支付</th>" +
            "<th style='" + thstylNarrow + "'>支付详情</th>" +
            "<th style='" + thstylNarrow + "'>支付备注</th>" +
            "<th style='" + thstylNarrow + "'>采购订单未支付</th>" +
            "<th style='" + thstyle + "'>采购订单货币</th>" +
            "<th style='" + thstyle + "'>客户发票货币</th>" +
            "<th style='" + thstylNarrow + "'>客户发票总价</th>" +
            "<th style='" + thstylNarrow + "'>客户发票未支付</th>" +
            "</tr>";
        var nmlHeight = " height : 20px;display:table-cell; vertical-align:middle; font-size: 16px;";
        var width40 = " width : 90px;display:table-cell; vertical-align:middle; font-size: 16px;";
        var nmlWidth = " width : 120px;display:table-cell; vertical-align:middle; font-size: 15px;";
        var lrgWidth = " width : 240px;display:table-cell; vertical-align:middle;";
        var textcenter = " text-align: center;";
        var textleft = " text-align: left;";
        var textright= " text-align: right;";
        var nmlWidth2 = " width : 50px;display:table-cell; vertical-align:middle;";
        var bggreen = "font-size: middle;;background-color:#fff; color:#000;";
        var bgyellow = "background-color:#ffeb9c; color:#9c5700;";
        var bgred = "background-color:#ffc7ce; color:#9c0006;";

        var csv = "";
        $.each(sodresult, function(name, sodvalue) {
            csv += "\r\n";
            var paymentInfo = sodvalue.SodPaymentRecord;
            paymentInfo = replaceAll(paymentInfo, " → ", "\r\n → ");
            var paytcmt = sodvalue.SodPaymentComments;
            if (sodvalue.CsoList != null && sodvalue.CsoList.length > 0) {
                // client invoice is not empty
                $.each(sodvalue.CsoList, function(name2, cins) {
                    var sodStatus = ((sodvalue.SttId !== 0) ? searchFieldValueInArray(allGenStt, 'Key', sodvalue.SttId).Value : "无状态可更新");
                    if (cins.IsCanceled) {
                        sodStatus = "已取消";
                    }
                    var soldetails = "";
                    var prddetails = "";
                    var qtydetails = "";
                    var unitpricedetails = "";
                    var totalpricedetails = "";
                    var totalpricettcdetails = "";
                    $.each(sodvalue.PurchaseLines, function(name2, sol) {
                        //soldetails += (sol.Quantity + " * " + sol.PrdName + " | ");
                        prddetails += sol.PrdName + "<br/>";
                        qtydetails += sol.Quantity + "<br/>";
                        unitpricedetails += (replacecomma ? ReplaceNumberWithCommas(sol.UnitPrice.toFixed(3)) : sol.UnitPriceWithDis.toFixed(3)) + "<br/>";
                        totalpricedetails += (replacecomma ? ReplaceNumberWithCommas(sol.TotalPrice.toFixed(3)) : sol.TotalPrice.toFixed(3)) + "<br/>";
                        totalpricettcdetails += (replacecomma ? ReplaceNumberWithCommas(sol.TotalCrudePrice.toFixed(3)) : sol.TotalCrudePrice.toFixed(3)) + "<br/>";
                    });
                    tab_text += "<tr>" +
                        "<td style='" + nmlWidth + textleft + bggreen + "'>" + sodvalue.Client + "</td>" +
                        "<td style='" + nmlWidth + textleft + bggreen + "'>" + cins.Value.split('-')[0].trim() + "</td>" +
                        "<td style='" + nmlWidth + textleft + bggreen + "'>" + sodvalue.SodCode + "</td>" +
                        "<td style='" + nmlWidth + textleft + bggreen + "'>" + sodvalue.SodName + "</td>" +
                        "<td style='" + nmlWidth + textleft + bggreen + "'>" + sodStatus + "</td>" +
                        "<td style='" + nmlWidth + textleft + bggreen + "'>" + sodvalue.SupplierCompanyName + "</td>" +
                        "<td style='" + lrgWidth + textleft + bggreen + "'>" + prddetails + "</td>" +
                        "<td style='" + width40 + textright + bggreen + "'>" + qtydetails + "</td>" +
                        "<td style='" + width40 + textright + bggreen + "'>" + unitpricedetails + "</td>" +
                        "<td style='" + width40 + textright + bggreen + "'>" + totalpricedetails + "</td>" +
                        "<td style='" + width40 + textright + bggreen + "'>" + totalpricettcdetails + "</td>" +
                        "<td style='" + width40 + textright + bggreen + "'>" + (replacecomma ? ReplaceNumberWithCommas(sodvalue.TotalAmountTtc) : sodvalue.TotalAmountTtc) + "</td>" +
                        "<td style='" + width40 + textright + bggreen + "'>" + (replacecomma ? ReplaceNumberWithCommas(sodvalue.Paid) : sodvalue.Paid) + "</td>" +
                        "<td style='" + width40 + textright + bggreen + "'>" + paymentInfo + "</td>" +
                        "<td style='" + width40 + textright + bggreen + "'>" + paytcmt + "</td>" +
                        "<td style='" + width40 + textright + bggreen + "'>" + (replacecomma ? ReplaceNumberWithCommas(sodvalue.Need2Pay) : sodvalue.Need2Pay) + "</td>" +
                        "<td style='" + nmlWidth + textcenter + bggreen + "'>" + sodvalue.CurrencySymbol + "</td>" +
                        "<td style='" + nmlWidth + textcenter + bggreen + "'>" + cins.Value3 + "</td>" +
                        "<td style='" + width40 + textright + bggreen + "'>" + (replacecomma ? ReplaceNumberWithCommas(cins.DcValue) : cins.DcValue) + "</td>" +
                        "<td style='" + width40 + textright + bggreen + "'>" + (replacecomma ? ReplaceNumberWithCommas(cins.DcValue2) : cins.DcValue2) + "</td>" +
                        "</tr>";
                });
            } else {
                var soldetails = "";
                var prddetails = "";
                var qtydetails = "";
                var unitpricedetails = "";
                var totalpricedetails = "";
                var totalpricettcdetails = "";
                $.each(sodvalue.PurchaseLines, function(name2, sol) {
                    //soldetails += (sol.Quantity + " * " + sol.PrdName + " | ");
                    prddetails += sol.PrdName + "<br/>";
                    qtydetails += sol.Quantity + "<br/>";
                    unitpricedetails += (replacecomma ? ReplaceNumberWithCommas(sol.UnitPrice.toFixed(3)) : sol.UnitPriceWithDis.toFixed(3)) + "<br/>";
                    totalpricedetails += (replacecomma ? ReplaceNumberWithCommas(sol.TotalPrice.toFixed(3)) : sol.TotalPrice.toFixed(3)) + "<br/>";
                    totalpricettcdetails += (replacecomma ? ReplaceNumberWithCommas(sol.TotalCrudePrice.toFixed(3)) : sol.TotalCrudePrice.toFixed(3)) + "<br/>";
                });
                var sodStatus = ((sodvalue.SttId !== 0) ? searchFieldValueInArray(allGenStt, 'Key', sodvalue.SttId).Value : "无状态可更新");
                if (sodvalue.IsCanceled) {
                    sodStatus = "已取消";
                }
                tab_text += "<tr>" +
                    "<td style='" + nmlWidth + textleft + bggreen + "'>" + sodvalue.Client + "</td>" +
                    "<td style='" + nmlWidth + textleft + bggreen + "'></td>" +
                    "<td style='" + nmlWidth + textleft + bggreen + "'>" + sodvalue.SodCode + "</td>" +
                    "<td style='" + nmlWidth + textleft + bggreen + "'>" + sodvalue.SodName + "</td>" +
                    "<td style='" + nmlWidth + textleft + bggreen + "'>" + sodStatus + "</td>" +
                    "<td style='" + nmlWidth + textleft + bggreen + "'>" + sodvalue.SupplierCompanyName + "</td>" +
                    "<td style='" + lrgWidth + textleft + bggreen + "'>" + prddetails + "</td>" +
                    "<td style='" + width40 + textright + bggreen + "'>" + qtydetails + "</td>" +
                    "<td style='" + width40 + textright + bggreen + "'>" + unitpricedetails + "</td>" +
                    "<td style='" + width40 + textright + bggreen + "'>" + totalpricedetails + "</td>" +
                    "<td style='" + width40 + textright + bggreen + "'>" + totalpricettcdetails + "</td>" +
                    "<td style='" + width40 + textright + bggreen + "'>" + (replacecomma ? ReplaceNumberWithCommas(sodvalue.TotalAmountTtc) : sodvalue.TotalAmountTtc) + "</td>" +
                    "<td style='" + width40 + textright + bggreen + "'>" + (replacecomma ? ReplaceNumberWithCommas(sodvalue.Paid) : sodvalue.Paid) + "</td>" +
                    "<td style='" + width40 + textright + bggreen + "'>" + paymentInfo + "</td>" +
                    "<td style='" + width40 + textright + bggreen + "'>" + paytcmt + "</td>" +
                    "<td style='" + width40 + textright + bggreen + "'>" + (replacecomma ? ReplaceNumberWithCommas(sodvalue.Need2Pay) : sodvalue.Need2Pay) + "</td>" +
                    "<td style='" + nmlWidth + textcenter + bggreen + "'>" + sodvalue.CurrencySymbol + "</td>" +
                    "<td style='" + nmlWidth + textcenter + bggreen + "'></td>" +
                    "<td style='" + width40 + textright + bggreen + "'></td>" +
                    "<td style='" + width40 + textright + bggreen + "'></td>" +
                    "</tr>";
            }
        });
        tab_text += '</table></body></html>';
        var csv_content = tab_text,
            download = document.createElement("a"),
            blob = new Blob(["\ufeff", tab_text], {
                type: "application/csv;charset=ISO-8859-1;"
            });
        var today = new Date();
        var dd = today.getDate();
        var mm = today.getMonth() + 1; //January is 0!
        var yyyy = today.getFullYear();
        if (dd < 10) {
            dd = '0' + dd;
        }
        if (mm < 10) {
            mm = '0' + mm;
        }
        today = yyyy + mm + dd;
        var nowtime = new Date();
        var datetime = "-V" + today + '-' + nowtime.getHours() + nowtime.getMinutes() + nowtime.getSeconds();

        download.href = window.URL.createObjectURL(blob);
        download.download = "SOResult" + datetime + ".xls";
        var event = document.createEvent("MouseEvents");
        event.initMouseEvent(
            "click", true, false, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null
        );
        download.dispatchEvent(event);

    } catch (e) {

    } 
}


function viewsodfile(sender, sodFId) {
    var sodId = $(sender).attr('sodId');
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

    var title = 'Fournisseur PI 供货商PI';
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
            var h = (w - b) * 0.00;
            return h + "px";
        }
    }).find('.modal-header').css({
        'background': 'url(../../img/menu_005_bg.jpg) repeat-x',
        'text-align': 'center',
        'color': 'white'
    });
   var src = "../Common/PageForPDF.aspx?type=5&sodId=" + encodeURIComponent(sodFId);
    $('#iframepdfForPayment').attr('src', src);
    return false;
}


var allGenStt = [];
function getAllGenStt() {
    var url = window.webservicePath + "/GetGeneralStatus";
    var budgetId = '#SttId';
    $.ajax({
        type: "POST",
        url: url,
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        success: function (data) {
            var jsdata = data.d;
            var data2Treat = jQuery.parseJSON(jsdata);
            if (data2Treat !== '-1') {
                allGenStt = [];
                allGenStt = data2Treat;
                $(budgetId).empty();
                 $(budgetId).append($("<option></option>")
                            .attr("value", 0)
                            .text('Tous les statuts 所有状态'));
                $.each(allGenStt, function(name, value) {
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



function updateSttClick(sender) {
    ShowPleaseWait();
    var sodId = $(sender).attr('sodId');
    var sttId = $(sender).attr('sttId');
    var sodFId = $(sender).attr('sodFId');
    var startBox = "<div class='box'><div class='box-body'>";
    var endBox = "</div></div>";
    var onelineContent =
        // start box
        "<div class='form-group' id='div_one_line'>" +
            "<div class='row'>" +
            "<div class='col-md-12'>" +
            "<div class='box-body'>" +
            "<div class='form-horizontal'>" +
            "<div class='form-group'><label class='col-sm-12 control-label ' style='text-align:center !important'>Choisir un statut <br/>请选一个订单状态</label></div>" +
            "<div class='form-group'>" +
            "<label class='col-sm-2 control-label'>Statut 状态</label>" +
            "<div class='col-sm-10'><select id='popup_stt_id' name='popup_stt_id' class='form-control'>" +
            "</select></div>" +
            "</div>" +
            // close box
            "</div></div></div></div></div>";

    var btnAddUpdate = "<button class='btn btn-inverse' onclick='return UpdateSodStt(this)' sodId='" + sodId + "' sodFId='" + sodFId + "'><span>Mettre à jour 更新</span></button>";
    var btnClose = "<button class='btn btn-default bootbox-close-button '><span>Annuler</span></button>";

    var btns = "<div class='modal-body center'>" + btnClose + btnAddUpdate + "</div>";
    var onecontent = startBox + onelineContent + btns + endBox;

    var title = 'Le statut de la commande 订单状态';
    bootbox.dialog({
            title: title,
            message: onecontent
        })
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

    var budgetId = "#popup_stt_id";
    $(budgetId).empty();
    $.each(allGenStt, function(name, value) {
        $(budgetId)
            .append($("<option></option>")
                .attr("value", value.Key)
                .text(value.Value));
    });

    $(budgetId).val(sttId);

    HidePleaseWait();
    return false;
}

function UpdateSodStt(sender) {
    ShowPleaseWait();
    var sodId = $(sender).attr('sodId');
    var sodFId = $(sender).attr('sodFId');
    var sttId = $('#popup_stt_id').find('option:selected').attr('value') * 1;
    var url = window.webservicePath + "/UpdateSodSatus";
    var datastr = "{sodId:'" + sodFId + "',sttId:" + sttId + "}";
    $.ajax({
        type: "POST",
        url: url,
        contentType: "application/json; charset=utf-8",
        data: datastr,
        dataType: "json",
        success: function(data) {
            //location.reload();
            // 更新后，直接在页面处更新内容，不用重新刷新一遍页面
            try {
                var status = searchFieldValueInArray(allGenStt, 'Key', sttId).Value;
                $('#span_status_' + sodId).text(status);
            } catch (e) {

            } 
            closeDialog();
            //js_search();
            //HidePleaseWait();
        },
        error: function(data) {
            //location.reload();
            HidePleaseWait();
        }
    });
    return false;
}
