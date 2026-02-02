
$(document).ready(initSearch);

function initSearch() {
//    LoadSupplier();
//    getClient();

    SetLanguageBar();
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
        //"<th style='text-align:center'><input type='checkbox' id='cbx_all_sod' onclick='SodAllClick(this)'/></th>" +
        "<th style='text-align:center' class='language_txt'>Fournisseur</th>" +
//        "<th style='text-align:center' class='language_txt'>Client</th>" +
        //(connectedUser.LoginMode === 1 ? "<th style='text-align:center' class='language_txt'>Sub Fournisseur</th>" : "") +
        "<th style='text-align:center' class='language_txt'>Nom de cmd.</th>" +
        "<th style='text-align:center' class='language_txt'>Code de cmd.</th>" +
        "<th style='text-align:center' class='language_txt'>D. Creation</th>" +
 //       "<th style='text-align:center' class='language_txt'>Commercial</th>" +
    //"<th style='text-align:center'>Client<br/>客户</th>" +
        "<th style='text-align:center; width:30%;' class='language_txt'>Détail</th>" +
        "<th style='text-align:center; width:5%;' class='language_txt'>Montant HT</th>" +
        "<th style='text-align:center; width:5%;'class='language_txt'>Montant TTC</th>" +
        "<th style='text-align:center; width:5%;'class='language_txt'>Payé</th>" +
        "<th style='text-align:center; width:5%;'class='language_txt'>A payer</th>" +
        "<th style='text-align:center; width:8%;'class='language_txt'>Comment</th>" +
//        "<th style='text-align:center; width:8%;'class='language_txt'>Facture Client</th>" +
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
//        titles.push({ "sTitle": "btn1" });
        titles.push({ "sTitle": "Supplier" });
//        titles.push({ "sTitle": "Client" });
//        if (connectedUser.LoginMode === 1) {
//            titles.push({ "sTitle": "SubSup" });
//        }
        titles.push({ "sTitle": "Name" });
        titles.push({ "sTitle": "Code" });
        titles.push({ "sTitle": "CDate" });
//        titles.push({ "sTitle": "Cmc" });
        //titles.push({ "sTitle": "Client" });
        titles.push({ "sTitle": "Detail" });
        titles.push({ "sTitle": "Montant HT" });
        titles.push({ "sTitle": "Montant TTC" });
        titles.push({ "sTitle": "Paid" });
        titles.push({ "sTitle": "Need2Pay" });
        titles.push({ "sTitle": "Cmt" });
//        titles.push({ "sTitle": "CinCode" });
        titles.push({ "sTitle": "Trans" });

        var displaycount = 1;
        $.each(data2Treat, function (name, value) {
            var dataArray = new Array();
            // 20210119
//            if (value.Need2Pay === 0) {
//                dataArray.push("");
//            } else {
//                dataArray.push("<input type='checkbox' id='cbx_sod_" + value.SodId + "' sodId='" + value.SodId + "' onclick='CheckBoxForAddBtn()'/>");
//            }
            dataArray.push("<span  onclick='viewItem(\"" + value.SodFId + "\")' style='cursor:pointer;font-weight:bolder;'>" + (IsNullOrEmpty(value.Supplier) ? value.SupplierCompanyName : value.Supplier) + "</span>");
//            dataArray.push("<span  onclick='viewItem(\"" + value.SodFId + "\")' style='cursor:pointer;font-weight:bolder;'>" + value.Client + "</span>");
//            if (connectedUser.LoginMode === 1) {
//                dataArray.push("<span  onclick='viewItem(\"" + value.SodFId + "\")' style='cursor:pointer;font-weight:bolder;'>" + value.Supplier2 + "</span>");
//            }
            dataArray.push("<span  onclick='viewItem(\"" + value.SodFId + "\")' style='cursor:pointer;font-weight:bolder;'>" + value.SodName + "</span>");
            dataArray.push("<span  onclick='viewItem(\"" + value.SodFId + "\")' style='cursor:pointer;font-weight:bolder;'>" + value.SodCode + "</span>");
            dataArray.push("<span  onclick='viewItem(\"" + value.SodFId + "\")' style='cursor:pointer;font-weight:bolder;'>" + getDateString(value.DateCreation) + "</span>");
//            dataArray.push("<span  onclick='viewItem(\"" + value.SodFId + "\")' style='cursor:pointer;font-weight:bolder;'>" + value.Commercial + "</span>");
            //dataArray.push("<span  onclick='viewItem(\"" + value.SodFId + "\")' style='cursor:pointer'>" + (IsNullOrEmpty(value.SodClient) ? '' : value.SodClient) + "</span>");
            // sol détail
            var oneline = "";
            var transinfo = "";
            if (value.PurchaseLines.length > 0) {
                if (withDetail) {
                    oneline += "<table style='font-size : 8pt;width:100%;'>";
                    oneline += "<tr>";
                    oneline += "<th style='border: 1px solid black; text-align:center;width:20%;'>Produit</th>";
                    oneline += "<th style='border: 1px solid black; text-align:center;width:10%'>Réf</th>";
                    oneline += "<th style='border: 1px solid black; text-align:center;width:30%'>Des.</th>";
                    oneline += "<th style='border: 1px solid black; text-align:center;width:10%;'>Qté</th>";
                    oneline += "<th style='border: 1px solid black; text-align:center;width:10%;'>PU</th>";
                    oneline += "<th style='border: 1px solid black; text-align:center;width:10%;'>TOTAL HT</th>";
                    oneline += "</tr>";
                    $.each(value.PurchaseLines, function (name2, sol) {
                        oneline += "<tr>";
                        oneline += "<td style='border: 1px solid black;width:20%;'>" + sol.PrdName + "</td>";
                        oneline += "<td style='border: 1px solid black;width:10%;'>" + sol.PitName + "</td>";
                        oneline += "<td style='border: 1px solid black;width:30%;'>" + sol.Description + "</td>";
                        oneline += "<td style='border: 1px solid black; text-align:center;width:10%;'>" + sol.Quantity + "</td>";
                        oneline += "<td style='border: 1px solid black; text-align:right;width:10%;'>" + sol.UnitPriceWithDis.toFixed(2) + "</td>";
                        oneline += "<td style='border: 1px solid black; text-align:right;width:10%;'>" + sol.TotalPrice.toFixed(2) + "</td>";
                        oneline += "</tr>";

                        $.each(sol.LgsInfos, function (lgsname, lglvalue) {
                            transinfo += "<span style='font-weight:bolder;'>@" + lglvalue.Key2 + ' * ' + lglvalue.Value + '(' + lglvalue.Value2 + ') | ' + lglvalue.Value3 + '</span><br/>';
                        });
                    });
                    oneline += "</table>";
                } else {
                    if (value.CliShowDetail) {
                        $.each(value.PurchaseLines, function(name2, sol) {
                            oneline += (sol.Order + "--> " + sol.Quantity + " * " + sol.PrdName + " | " + sol.UnitPriceWithDis.toFixed(2) + " | " + sol.TotalPrice.toFixed(2) + "<br/>");
                            $.each(sol.LgsInfos, function(lgsname, lglvalue) {
                                transinfo += "<span style='font-weight:bolder;'>@" + lglvalue.Key2 + ' * ' + lglvalue.Value + '(' + lglvalue.Value2 + ') | ' + lglvalue.Value3 + '</span><br/>';
                            });
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
                                    divHideLgl += "<span style='font-weight:bolder;'>@" + lglvalue.Key2 + ' * ' + lglvalue.Value + '(' + lglvalue.Value2 + ') | ' + lglvalue.Value3 + '</span><br/>';
                                });
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
            dataArray.push(ReplaceNumberWithCommas(value.TotalAmountHt));
            dataArray.push(ReplaceNumberWithCommas(value.TotalAmountTtc));
            dataArray.push(ReplaceNumberWithCommas(value.Paid));


            var color = value.Need2Pay == 0 ? "green" : "red";
            dataArray.push("<span style='color:" + color + "'>" + ReplaceNumberWithCommas(value.Need2Pay) + "</span>");
            //            if (!IsNullOrEmpty(value.CinCode)) {
            //                dataArray.push("<span  onclick='viewCinItem(\"" + value.CinFId + "\")' style='cursor:pointer'>" + value.CinCode + "</span>");
            //            } else {
            //                dataArray.push('');
            //            }

            //var newline = IsNullOrEmpty(value.SupplierComment) ? "" : "<br/>";

            dataArray.push(value.SupplierComment);
//            if (value.CsoList !== null && value.CsoList.length > 0) {
//                var cincontent = "";
//                var csoCount = 0;
//                var csolen = value.CsoList.length;
//                $.each(value.CsoList, function (nm, onecso) {
//                    cincontent += "<span  onclick='viewCinItem(\"" + onecso.Value2 + "\")' style='cursor:pointer;font-weight:bolder;'>" + onecso.Value + "</span>";
//                    csoCount++;
//                    if (csoCount < csolen) {
//                        cincontent += "</br>";
//                    }
//                });
//                dataArray.push(cincontent);
//            } else {
//                dataArray.push('');
//            }

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
    var url = 'SupplierOrderSup.aspx?sodId=' + fId + "&mode=view";
    //window.location.href = url;
    var win = window.open(url, '_blank');
    win.focus();
}

var sodresult = [];
function js_search() {
    sodresult = [];
    var url = window.webservicePath + "/SearchSupplierOrderSup";
    var sod = {};
    sod.SodName = $('#SodName').val().trim();
    sod.SodCode = $('#SodCode').val().trim();
    sod.SupId = 0;
    sod.CliId = 0;
    // 仅在此处用作搜索
    sod._DateStartProduction = $('#DateCreationFrom').val().trim();
    sod._DateCompleteProduction = $('#DateCreationTo').val().trim();
    sod.SodDiscountAMount = $('#SolQty').val().trim() * 1;

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
            }
            viewSearchResult(jsondata);

            SetLanguageBar();
        },
        error: function (data) {
            myApp.hidePleaseWait();
        }
    });
    return false;
}

