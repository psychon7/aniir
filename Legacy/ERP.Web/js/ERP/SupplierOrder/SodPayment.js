$(document).ready(initAll);

function initAll() {
    initSearch();
    $.each($('.datepicker'), function (idx, value) {
        $(value).datepicker();
    });
    //$('#DateCreationFrom').val(firstDayInPreviousMonth());
    $('#DateCreationTo').val(getToday());

    SetLanguageBar();
}


function initSearch() {
    LoadSupplier();
}
function LoadSupplier() {
    ShowPleaseWait();
    var url = window.webservicePath + "/GetAllSuppliers";
    var budgetId = '#SupId';
    $.ajax({
        type: "POST",
        url: url,
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        success: function (data) {
            HidePleaseWait();
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

function SodMode1Fileds() {
    if (connectedUser.LoginMode === 1) {
        $('#div_subsup').show();
    } else {
        $('#div_subsup').hide();
    }
}

function js_search() {
    var url = window.webservicePath + "/GetSupplierPaiment";
    var subSup = false;
    var sod2Pay = false;
    if (connectedUser.LoginMode === 1) {
        subSup = $('#cbx_sub_sup')[0].checked;
    }
    sod2Pay = $('#cbx_sod2pay')[0].checked;

    var supId = $('#SupId').val().trim();
    // 仅在此处用作搜索(sodsearch也有)
    var dFrom = $('#DateCreationFrom').val().trim();
    var dTo = $('#DateCreationTo').val().trim();

    var jsondata = JSON.stringify({ subSup: subSup, sod2Pay: sod2Pay, supId: supId, dFrom: dFrom, dTo: dTo });
    myApp.showPleaseWait();
    $.ajax({
        url: url,
        type: 'POST',
        contentType: 'application/json; charset=utf-8',
        data: jsondata,
        dataType: 'json',
        success: function (data) {
            var jsdata = data.d;
            var data2Treat = jQuery.parseJSON(jsdata);
            if (data2Treat !== '-1') {
                //sodresult = data2Treat;
                if (jsondata.length === 0) {
                    NoResultMsg();
                }
                viewSearchResult(data2Treat);
            } else {
                // authentication error
                AuthencationError();
            }
        },
        error: function (data) {
            myApp.hidePleaseWait();
        }
    });
    return false;
}

var hasSet = false;
function viewSearchResult(data2Treat) {
    var name = '_pins';
    var dt_name = 'dt' + name;
    var div_name = 'div' + name;
    var th_name = 'th' + name;
    var tb_name = 'tb' + name;
    var tf_name = 'tf' + name;
    var rst_name = 'rst' + name;
    var headerFooter = "<tr>" +
        "<th style='text-align:center;font-size:11px;vertical-align: middle;' class='language_txt'>Fournisseur</th>" +
        (connectedUser.LoginMode === 1 ? "<th style='text-align:center;font-size:11px;vertical-align: middle;' class='language_txt'>Sub Fournisseur</th>" : "") +
        "<th style='text-align:center;font-size:11px;vertical-align: middle;' class='language_txt'>Total HT</th>" +
        "<th style='text-align:center;font-size:11px;vertical-align: middle;'class='language_txt'>Total TTC</th>" +
        "<th style='text-align:center;font-size:11px;vertical-align: middle;'class='language_txt'>Déjà payé</th>" +
        "<th style='text-align:center;font-size:11px;vertical-align: middle;'class='language_txt'>A payer</th>" +
        "<th style='text-align:center;font-size:11px;vertical-align: middle;'></th>" +
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
        titles.push({ "sTitle": "Supplier" });
        if (connectedUser.LoginMode === 1) {
            titles.push({ "sTitle": "SubSup" });
        }
        titles.push({ "sTitle": "TotalHt" });
        titles.push({ "sTitle": "TotalTtc" });
        titles.push({ "sTitle": "Paid" });
        titles.push({ "sTitle": "ToPay" });
        titles.push({ "sTitle": "btns" });

        var displaycount = 1;
        $.each(data2Treat, function (fname, value) {
            var dataArray = new Array();
            dataArray.push("<span supId='" + value.Key + "' style='cursor:pointer; font-weight:bolder' onclick='return consultSods(this,false)' >" + (IsNullOrEmpty(value.Value) ? '' : value.Value) + "</span>");
            if (connectedUser.LoginMode === 1) {
                dataArray.push("<span supId='" + value.Key2 + "' style='cursor:pointer; font-weight:bolder' onclick='return consultSods(this,true)' >" + (IsNullOrEmpty(value.Value2) ? '' : value.Value2) + "</span>");
            }
            dataArray.push(value.DcValue.toFixed(2));
            dataArray.push(value.DcValue2.toFixed(2));
            dataArray.push(value.DcValue3.toFixed(2));
            dataArray.push(value.DcValue4.toFixed(2));
            var btns = "<button  class='btn btn-inverse' supId=" + value.Key + " onclick='return consultSods(this,false)'><i class='fa fa-search-plus'></i></button>";
            btns += "<button  class='btn btn-inverse' supId=" + value.Key + " onclick='return downloadPaymentRecord(this)' title='Téléchargez le relevé de paiement correspondant du fournisseur 下载该供货商对应支付记录'><i class='fa fa-download'></i></button>";
            dataArray.push(btns);

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

    $.each($('.datepicker'), function (idx, value) {
        $(value).datepicker();
    });

    SetLanguageBar();
    myApp.hidePleaseWait();
}

function consultSods(sender, issub) {
    ShowPleaseWait();
    var supId = $(sender).attr('supId') * 1;
    var dStart = $('#DateCreationFrom').val();
    var dEnd = $('#DateCreationTo').val();
    var jsondata = JSON.stringify({ supId: supId, isSub: issub, DStart: dStart, DEnd: dEnd });
    var url = window.webservicePath + "/GetSodBySupIdWithDate";
    $('#tb_sods').empty();
    $('#title_sod').text($(sender).text());
    $('#div_result').removeClass('col-md-4');
    $('#div_result').addClass('col-md-12');
    $('#div_result_sod').hide();
    $('#sp_rst_sod').text('');
    $('#tb_sprs').empty();
    $('#sp_rst_spr').text('');
    $('#div_spr').hide();
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
                $('#sp_rst_sod').text(data2Treat.length);
                var linecode = "";
                var title = "<tr>" +
                    "<th>Code CF</th>" +
                    "<th>Name CF</th>" +
                    "<th>Total HT</th>" +
                    "<th>Total TTC</th>" +
                    "<th>Payé</th>" +
                    "<th>A payer</th>" +
                    "<th></th>" +
                    "</tr>";
                linecode += title;
                $.each(data2Treat, function (name, value) {
                    linecode += "<tr>";
                    linecode += "<td><span sodId='" + value.SodFId + "' style='cursor:pointer; font-weight:bolder' onclick='return consultSprs(this)'>" + value.SodCode + "</span></td>";
                    linecode += "<td><span sodId='" + value.SodFId + "' style='cursor:pointer; font-weight:bolder' onclick='return consultSprs(this)'>" + value.SodName + "</span></td>";
                    linecode += "<td class='label_right'>" + value.TotalAmountHt.toFixed(2) + "</td>";
                    linecode += "<td class='label_right'>" + value.TotalAmountTtc.toFixed(2) + "</td>";
                    linecode += "<td class='label_right'>" + value.Paid.toFixed(2) + "</td>";
                    linecode += "<td class='label_right'>" + value.Need2Pay.toFixed(2) + "</td>";
                    linecode += "<td>" +
                        "<button  class='btn btn-inverse' sodId=" + value.SodFId + " onclick='return consultSprs(this)' title='Détail 明细'><i class='fa fa-search-plus'></i></button><button  class='btn btn-inverse' sodId=" + value.SodFId + " onclick='return ViewSodSil(this)' title='Consulter cette commande 查看该订单'><i class='fa fa-file'></i></button></td>";
                    linecode += "</tr>";
                });
                linecode += title;
                $('#tb_sods').append(linecode);

                $('#div_result').removeClass('col-md-12');
                $('#div_result').addClass('col-md-4');
                $('#div_result_sod').show();
                HidePleaseWait();
            } else {
                HidePleaseWait();
                AuthencationError();
            }
        },
        error: function (data) {
            HidePleaseWait();
            var test = '';
        }
    });

    return false;
}

function consultSprs(sender) {
    ShowPleaseWait();
    var sodId = $(sender).attr('sodId');
    $('#tb_sprs').empty();
    //$('#div_result_sod').hide();
    //$('#div_spr').hide();
    $('#sp_rst_spr').text('');
    $('#tb_sprs').empty();
    if (sodId) {
        var url = window.webservicePath + "/GetSodPaymentsList";
        var datastr = "{sodId:'" + sodId + "'}";
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
                    var sprs = data2Treat;
                    var linecode = "";
                    var title = "<tr>" +
                            "<th>Fichier</th>" +
                            "<th>Date</th>" +
                            "<th>Commentaire</th>" +
                            "<th>Mnt Payé</th>" +
                            "</tr>";
                    $('#tb_sprs').append(title);
                    var oneContent = "";
                    $.each(sprs, function (name, value) {
                        if (value.Key != 0 || value.Key2 != 0) {
                            var btnview = (value.Value2 != null && value.Value2.length > 0) ? "<button  class='btn btn-inverse' sodId='" + sodId + "' sprid=" + value.Key + " onclick='return viewSprFile(this)'><i class='fa fa-search-plus'></i></button>" : "";
                            oneContent += "<tr>" +
                                    "<td>" + btnview + "</td>" +
                                    "<td>" + getDateString(value.DValue2) + "</td>" +
                                    "<td>" + value.Value + "</td>" +
                                    "<td class='label_right'>" + value.DcValue.toFixed(2).toLocaleString() + "</td>" +
                                    "</tr>";

                        }
                    });
                    $('#tb_sprs').append(oneContent);
                    $('#tb_sprs').append(title);
                    $('#sp_rst_spr').text(sprs.length - 1);
                    $('#div_spr').show();

                    HidePleaseWait();

                } else {
                    // authentication error
                    HidePleaseWait();
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

function viewSprFile(sender) {
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
    var sprid = $(sender).attr('sprid');
    var src = "../Common/PageForPDF.aspx?type=8&sodId=" + encodeURIComponent(sodId) + "&sprId=" + encodeURIComponent(sprid);
    $('#iframepdfForPayment').attr('src', src);
    return false;
}
function ViewSodSil(sender) {
    var sodid = $(sender).attr('sodId');
    if (sodid != '0' && sodid != null && sodid != 'null') {
        var url = 'SupplierOrder.aspx';
        url = url + '?sodId=' + sodid + '&mode=view';
        //document.location.href = newUrl;
        window.open(url, '_blank');
    }
    return false;
}


function downloadPaymentRecord(sender) {
    var supId = $(sender).attr('supId') * 1;
    //alert(supId);
    var url = window.webservicePath + "/GetSupplierPaymentDownload";
    var subSup = false;
    var sod2Pay = false;
    if (connectedUser.LoginMode === 1) {
        subSup = $('#cbx_sub_sup')[0].checked;
    }
    sod2Pay = $('#cbx_sod2pay')[0].checked;
    // 仅在此处用作搜索(sodsearch也有)
    var dFrom = $('#DateCreationFrom').val().trim();
    var dTo = $('#DateCreationTo').val().trim();

    var jsondata = JSON.stringify({ subSup: subSup, sod2Pay: sod2Pay, supId: supId, dFrom: dFrom, dTo: dTo });
    myApp.showPleaseWait();
    $.ajax({
        url: url,
        type: 'POST',
        contentType: 'application/json; charset=utf-8',
        data: jsondata,
        dataType: 'json',
        success: function (data) {
            HidePleaseWait();
            var jsdata = data.d;
            var data2Treat = jQuery.parseJSON(jsdata);
            if (data2Treat !== '-1') {
                //console.log(data2Treat);
                var sods = data2Treat;
                try {
                    var csv = "";
                    csv += ";;;Détail de paiement du;" + dFrom + ";au;" + dTo + ";;\r\n";
                    csv += ";;;支付详情从;" + dFrom + ";到;" + dTo + ";;\r\n";
                    csv += "Fournisseur;N°CF;Nom CF;Date de paiement;Montant Total HT; Montant Total TTC;Payé;A payer;Commentaire\r\n";
                    csv += "供货商;订单号;订单名;支付日期;未税总额;含税总额;已支付;未支付;备注\r\n";
                    sods = sods.sort(sort_by('SupplierCompanyName', {
                        name: 'Need2Pay',
                        primer: parseInt,
                        reverse: false
                    }));

                    var lastSup = "";
                    $.each(sods, function (name, value) {
                        if (lastSup != value.SupplierCompanyName) {
                            csv += "\r\n";
                            csv += value.SupplierCompanyName + ";N°CF;Nom CF;Date de paiement;Montant Total HT; Montant Total TTC;Payé;A payer;Commentaire" + "\r\n";
                        }
                        lastSup = value.SupplierCompanyName;
                        csv += value.SupplierCompanyName + ";订单号;订单名;支付日期;";
                        csv += ReplaceNumberWithCommas(value.TotalAmountHt) + ";";
                        csv += ReplaceNumberWithCommas(value.TotalAmountTtc) + ";";
                        csv += ReplaceNumberWithCommas(value.Paid * -1) + ";";
                        csv += ReplaceNumberWithCommas(value.Need2Pay) + "\r\n";

                        var totatPaid = 0;
                        $.each(value.PurchaseLines, function (n2, sol) {
                            csv += sol.SupplierCompanyName + ";";
                            csv += sol.SodCode + ";";
                            csv += sol.SodName + ";";
                            csv += getDateString(sol.DateCreation) + ";";
                            csv += ";";
                            csv += ";";
                            csv += (ReplaceNumberWithCommas(sol.TotalPrice * -1)) + ";";
                            csv += ";";
                            csv += sol.Comment + "\r\n";
                            totatPaid += sol.TotalPrice;
                        });
                        csv += ";;;;;TOTAL;";
                        csv += (ReplaceNumberWithCommas(totatPaid * -1)) + ";";
                        csv += (ReplaceNumberWithCommas(value.TotalAmountTtc - totatPaid)) + ";\r\n";

                    });

                    var csv_content = csv,
            download = document.createElement("a"),
            blob = new Blob(["\ufeff", csv_content], { type: "text/csv;charset=ISO-8859-1" });

                    download.href = window.URL.createObjectURL(blob);
                    var from = $('#DateCreationFrom').val();
                    var to = $('#DateCreationTo').val();
                    download.download = "支付详情" + from + "-" + to + ".csv";

                    var event = document.createEvent("MouseEvents");
                    event.initMouseEvent(
            "click", true, false, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null
        );
                    download.dispatchEvent(event);


                } catch (e) {
                    var test = e;
                }

            } else {
                // authentication error
                AuthencationError();
            }
            //sodresult = data2Treat;

        },
        error: function (data) {
            HidePleaseWait();
        }
    });
    return false;
}