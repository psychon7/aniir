//$(document).keyup(function (event) {
//    if (event.keyCode == 13) {
//        $("#btnSearch").trigger("click");
//    }
//});

//$(document).keydown(function (event) {
//    switch (event.keyCode) {
//        case 13: return false;
//    }
//});

$(document).ready(init);

function init() {
    getClient();

    SetLanguageBar();
}

var sodwithsols = [];
var sodForPayment = [];
function js_search(setcontent, forexcel, forpayment) {
    var navbarclass = $('#div-navbar-brand').attr('class');
    if (navbarclass == "navbar-brand") {
        $('#sidebar-collapse').click();
    }

    var url = window.webservicePath + "/SearchSolDetail";
    if (forpayment) {
        sodForPayment = [];
        url = window.webservicePath + "/SearchSolDetailForPayment";
    }
    //var client = $('#CliName').val().trim();
    var client = '';
    var keyword = $('#Keyword').val().trim();
    var sodname = $('#txbSodName').val().trim();
    var sodcode = $('#txbSodCode').val().trim();
    var sup = $('#txbSup').val().trim();
    var nostart = $('#cbx_no_start')[0].checked;
    var nofinpr = $('#cbx_no_fin_pr')[0].checked;
    var noarrpr = $('#cbx_no_arr_pr')[0].checked;
    var nosend = $('#cbx_fin_no_send')[0].checked;
    var finished = $('#cbx_finished')[0].checked;
    var dFrom = $('#DateCreationFrom').val();
    var dTo = $('#DateCreationTo').val();
    var cliId = $('#CliId').find('option:selected').attr('value') * 1;

    var jsondata = JSON.stringify({
        client: client,
        keyword: keyword,
        sodname: sodname,
        sodcode: sodcode,
        sup: sup,
        nostart: nostart,
        nofinpr: nofinpr,
        noarrpr: noarrpr,
        nosend: nosend,
        dFrom: dFrom,
        dTo: dTo,
        finished: finished,
        cliId: cliId
    });
    myApp.showPleaseWait();
    $.ajax({
        url: url,
        type: 'POST',
        contentType: 'application/json; charset=utf-8',
        data: jsondata,
        dataType: 'json',
        success: function (data) {
            //console.log(data);
            var jsdata = data.d;
            //var jsondata = jQuery.parseJSON(jsdata);
            var jsondata = [];
            sodwithsols = [];
            try {
                jsondata = jQuery.parseJSON(jsdata);
            } catch (e) {
                jsondata = JSON.parse(jsdata);
            }

            if (jsondata.length === 0) {
                HidePleaseWait();
                $('#div_search_result').hide();
                $('#dt_pins').remove();
                NoResultMsg();
            } else {
                if (!forpayment) {
                    sodwithsols = jsondata;
                    if (setcontent) {
                        viewSearchResult(jsondata);
                    } else {
                        if (forexcel) {
                            //Download Excel
                            //console.log('download excel');
                            downloadCsv();
                        }
                        HidePleaseWait();
                    }
                } else {
                    sodForPayment = jsondata;
                    downlaodPayment();
                    HidePleaseWait();
                }
            }
        },
        error: function (data) {
            HidePleaseWait();
        }
    });
    return false;
}

var allclient = [];
function getClient() {
    ShowPleaseWait();
    var elementId = 'CliId';
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
        "<th style='text-align:center;font-size:11px;vertical-align: middle;' class='language_txt'>Client</th>" +
        "<th style='text-align:center;font-size:11px;vertical-align: middle;' class='language_txt'>N° CF</th>" +
        "<th style='text-align:center;font-size:11px;vertical-align: middle;' class='language_txt'>Nom CF</th>" +
        "<th style='text-align:center;font-size:11px;vertical-align: middle;' class='language_txt'>Commercial</th>" +
        "<th style='text-align:center;font-size:11px;vertical-align: middle;' class='language_txt'>F.N°</th>" +
        "<th style='text-align:center;font-size:11px;vertical-align: middle;' class='language_txt'>N° Fonction</th>" +
    //"<th style='text-align:center;font-size:10px;vertical-align: middle;'>Commercial</br>销售</th>" +
    //"<th style='text-align:center;font-size:11px;vertical-align: middle;'>Commentaire</br>备注</th>" +
    //"<th style='text-align:center;font-size:11px;vertical-align: middle;'>D. C.</br>建立时间</th>" +
        "<th style='text-align:center;font-size:11px;vertical-align: middle;' class='language_txt'>Prd.</th>" +
        "<th style='text-align:center;font-size:11px;vertical-align: middle;' class='language_txt'>Descp.</th>" +
        "<th style='text-align:center;font-size:11px;vertical-align: middle;' class='language_txt'>Qty | Rest</th>" +
        "<th style='text-align:center;font-size:11px;vertical-align: middle;' class='language_txt'>PU</th>" +
        "<th style='text-align:center;font-size:11px;vertical-align: middle;' class='language_txt'>Mnt HT<</th>" +
    //"<th style='text-align:center;font-size:11px;vertical-align: middle; background-color: #e0c240;'>D. P.</br>开始生产时间</th>" +
        "<th style='text-align:center;font-size:11px;vertical-align: middle; background-color: #668cd9;' class='language_txt'>D. Pv. Fin</th>" +
    //"<th style='text-align:center;font-size:11px;vertical-align: middle; '>D. Fin</br>实际交期</th>" +
    //"<th style='text-align:center;font-size:11px;vertical-align: middle; '>D. Expé.</br>发货日期</th>" +
        "<th style='text-align:center;font-size:11px;vertical-align: middle; background-color: #4cb052;' class='language_txt'>D. Arr.</th>" +
    //"<th style='text-align:center;font-size:11px;vertical-align: middle; background-color: #d96666;'>Deadline</br>警戒日期</th>" +
    //        "<th style='text-align:center;font-size:11px;vertical-align: middle;'>Payé 已支付</th>" +
    //        "<th style='text-align:center;font-size:11px;vertical-align: middle;'>Balance 尾款</th>" +
        "<th style='text-align:center;font-size:11px;vertical-align: middle;' class='language_txt'>Expé.</th>" +
    //        "<th style='text-align:center;font-size:11px;vertical-align: middle;'>N° Tracking</br>物流编号</th>" +
        "<th style='text-align:center;font-size:11px;vertical-align: middle;' title='La commande est terminée 订单已完成' class='language_txt'>TMN</th>" +
        "<th style='text-align:center; width:50px;'></th>" +
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
        titles.push({ "sTitle": "Client" });
        titles.push({ "sTitle": "SuoCode" });
        titles.push({ "sTitle": "SuoName" });
        titles.push({ "sTitle": "Commercial" });
        titles.push({ "sTitle": "SuoSupNbr" });
        titles.push({ "sTitle": "CodeF" });
        //titles.push({ "sTitle": "Commercial" });
        //titles.push({ "sTitle": "Cmt" });
        //titles.push({ "sTitle": "DCre" });
        titles.push({ "sTitle": "Prod" });
        titles.push({ "sTitle": "Desc" });
        titles.push({ "sTitle": "Qty" });
        titles.push({ "sTitle": "PU" });
        titles.push({ "sTitle": "MHT" });
        //titles.push({ "sTitle": "DPrd" });
        titles.push({ "sTitle": "DExpDlv" });
        //titles.push({ "sTitle": "DDev" });
        //titles.push({ "sTitle": "DShip" });
        titles.push({ "sTitle": "DExpAvl" });
        //titles.push({ "sTitle": "Deadline" });
        //        titles.push({ "sTitle": "MPaid" });
        //        titles.push({ "sTitle": "MBal" });
        titles.push({ "sTitle": "Transporter" });
        //        titles.push({ "sTitle": "LogsNbr" });
        titles.push({ "sTitle": "btnup" });
        titles.push({ "sTitle": "Ternimer" });

        var displaycount = 1;
        $.each(data2Treat, function (fname, value) {
            var dataArray = new Array();
            dataArray.push("<span  onclick='viewItem(\"" + value.SodFId + "\")' style='cursor:pointer;font-weight:bolder;'>" + value.SupplierCompanyName + "</span>");
            dataArray.push("<span  onclick='viewItem(\"" + value.SodFId + "\")' style='cursor:pointer;font-weight:bolder;'>" + value.Client + "</span>");
//            dataArray.push(value.SupplierCompanyName);
//            dataArray.push(value.Client);
            //dataArray.push("<input type='text' class='form-control' id='Client_" + value.SolId + "' solid='" + value.SolId + "' value='" + (value.Client == null ? "" : value.Client) + "'/>");
            //dataArray.push(value.SodCode);
            dataArray.push("<span  onclick='viewItem(\"" + value.SodFId + "\")' style='cursor:pointer;font-weight:bolder;'>" + value.SodCode + "</span>");
            //dataArray.push(value.SodName == null ? "" : value.SodName);
            dataArray.push("<span  onclick='viewItem(\"" + value.SodFId + "\")' style='cursor:pointer;font-weight:bolder;'>" + (value.SodName == null ? "" : value.SodName) + "</span>");
            dataArray.push("<span  onclick='viewItem(\"" + value.SodFId + "\")' style='cursor:pointer;font-weight:bolder;'>" + value.Commercial1 + "</span>");
            dataArray.push("<input type='text' class='form-control' id='SodSupNbr_" + value.SolId + "' solid='" + value.SolId + "' value='" + (value.SodSupNbr == null ? "" : value.SodSupNbr) + "'/>");
            dataArray.push("<input type='text' class='form-control' id='FeatureCode_" + value.SolId + "' solid='" + value.SolId + "' value='" + (value.FeatureCode == null ? "" : value.FeatureCode) + "'/>");

            //            var com1 = value.Commercial1 == null ? "" : value.Commercial1;
            //            var com2 = value.Commercial2 == null ? "" : value.Commercial2;
            //            var com3 = value.Commercial3 == null ? "" : value.Commercial3;
            //            com2 = (com2 == "" ? com1 : (com1 == "" ? com2 : (com1 + "</br>" + com2)));
            //            com3 = (com3 == "" ? com2 : (com2 == "" ? com3 : (com2 + "</br>" + com3)));
            //            dataArray.push(com3);
            //dataArray.push(value.Comment == null ? "" : value.Comment);
            //dataArray.push("<input type='text' class='form-control' id='Comment_" + value.SolId + "' solid='" + value.SolId + "' value='" + (value.Comment == null ? "" : value.Comment) + "' title='" + (value.Comment == null ? "" : value.Comment) + "'/>");
            //dataArray.push(getDateString(value.DateCreation));
            // sol détail
            dataArray.push(value.PrdName + " " + value.PitName);
            dataArray.push(value.Description);
            dataArray.push(value.Quantity + ' | ' + value.SolQuantity);
            dataArray.push(ReplaceNumberWithCommas(value.UnitPriceWithDis));
            dataArray.push(ReplaceNumberWithCommas(value.TotalPrice));

            //dataArray.push("<input type='text' class='form-control datepicker' id='DPrd_" + value.SolId + "' solid='" + value.SolId + "' value='" + getDateString(value.DProduction) + "'/>");
            dataArray.push("<input type='text' class='form-control datepicker' id='DExpDev_" + value.SolId + "' solid='" + value.SolId + "' value='" + getDateString(value.DExpDelivery) + "'/>");
            //dataArray.push("<input type='text' class='form-control datepicker' id='DDev_" + value.SolId + "' solid='" + value.SolId + "' value='" + getDateString(value.DDelivery) + "'/>");
            //            dataArray.push("<input type='text' class='form-control datepicker' id='DShip_" + value.SolId + "' solid='" + value.SolId + "' value='" + getDateString(value.DShipping) + "'/>");
            //            dataArray.push("<input type='text' class='form-control datepicker' id='DExpArr_" + value.SolId + "' solid='" + value.SolId + "' value='" + getDateString(value.DExpArrival) + "'/>");
            //dataArray.push(getDateString(value.DShipping));
            dataArray.push("<input type='text' class='form-control datepicker' id='DExpArr_" + value.SolId + "' solid='" + value.SolId + "' value='" + getDateString(value.DExpArrival) + "'/>");


            //dataArray.push("<input type='text' class='form-control datepicker' id='Deadline_" + value.SolId + "' solid='" + value.SolId + "' value='" + getDateString(value.Deadline) + "'/>");
            //            dataArray.push(ReplaceNumberWithCommas(value.Paid));
            //            dataArray.push(ReplaceNumberWithCommas(value.Need2Pay));
            //            dataArray.push("<input type='text' class='form-control' id='Transporter_" + value.SolId + "' value='" + (value.Transporter == null ? "" : value.Transporter) + "'/>");
            //            dataArray.push("<input type='text' class='form-control' id='LogsNbr_" + value.SolId + "' value='" + (value.LogsNbr == null ? "" : value.LogsNbr) + "'/>");

            var transinfo = '';
            $.each(value.LgsInfos, function (lgsname, lglvalue) {
                transinfo += "<span onclick='viewLgs(\"" + lglvalue.Value4 + "\")' style='cursor:pointer;font-weight:bolder;'>@" + lglvalue.Key2 + ' * ' + lglvalue.Value + '(' + lglvalue.Value2 + ') | ' + lglvalue.Value3 + '</span><br/>';
            });


            //dataArray.push(((value.Transporter == null || value.Transporter == "") ? "" : value.Transporter + " : ") + (value.LogsNbr == null ? "" : value.LogsNbr));
            dataArray.push(transinfo    );
            //dataArray.push((value.LogsNbr == null ? "" : value.LogsNbr));
            dataArray.push("<input type='checkbox' class='form-control' id='SodFinish_" + value.SolId + "' solid='" + value.SolId + "' " + (value.SodFinish ? "checked='checked'" : "") + ">");


            var btnupdate = "<button class='btn btn-block btn-inverse' solid='" + value.SolId + "' id='btn_upsol_" + value.SolId + "' name='btn_upsol_" + value.SolId + "' sodId='" + value.SodId + "' title='update 更新' onclick='return updateSol(this)' ><i class='fa fa-refresh'></i></button>";
            var btnupdateDetail = "<button class='btn btn-block btn-inverse' solid='" + value.SolId + "' id='btn_upDtsol_" + value.SolId + "' name='btn_upsol_" + value.SolId + "' sodId='" + value.SodFId + "' title='view details 细节' onclick='return ViewSolDetail(this)' ><i class='fa fa-book'></i></button>";

            var btnSendSol = "<button class='btn btn-block btn-inverse' solid='" + value.SolId + "' id='btn_sendSol_" + value.SolId + "' name='btn_upsol_" + value.SolId + "' sodId='" + value.SodId + "' title='Envoyer 发货 Rest " + value.SolQuantity + "' onclick='return SendSol(this)' ><i class='fa fa-truck'></i></button>";

            dataArray.push(btnupdate + btnupdateDetail + (value.SolQuantity > 0 ? btnSendSol : ''));


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

function viewLgs(fId) {
    var url = '../Logistics/Logistics.aspx?lgsId=' + fId + "&mode=view";
    //window.location.href = url;
    var win = window.open(url, '_blank');
    win.focus();
    return false;
}

function viewItem(fId) {
    //myApp.showPleaseWait();
    var url = 'SupplierOrder.aspx?sodId=' + fId + "&mode=view";
    //window.location.href = url;
    var win = window.open(url, '_blank');
    win.focus();
    return false;
}

var Sol2Update = {};

function updateSol(sender) {
    var solid = $(sender).attr('solid');
    //ShowPleaseWait('Veuillez patienter !!!');
    $(sender).prop('disabled', true);
    //console.log(solid);
    Sol2Update = {};
    var sol = {};
    sol.SolId = solid * 1;
    var onesol = searchInArray(sodwithsols, 'SolId', solid * 1);

    sol.SodId = $(sender).attr('solid') * 1;
    //var Client = $('#Client_' + solid);
    //var Comment = $('#Comment_' + solid);
    var Transporter = $('#Transporter_' + solid);
    var LogsNbr = $('#LogsNbr_' + solid);
    //var _DProduction = $('#DPrd_' + solid);
    var _DExpDelivery = $('#DExpDev_' + solid);
    //var _DDelivery = $('#DDev_' + solid);
    //var _DShipping = $('#DShip_' + solid);
    var _DExpArrival = $('#DExpArr_' + solid);
    //var _Deadline = $('#Deadline_' + solid);
    var FeatureCode = $('#FeatureCode_' + solid);
    var SodSupNbr = $('#SodSupNbr_' + solid);
    //var Comment = $('#Comment_' + solid);
    //sol.Transporter = Transporter.val();
    //sol.LogsNbr = LogsNbr.val().trim();
    //sol._DProduction = _DProduction.val().trim();
    sol._DExpDelivery = _DExpDelivery.val().trim();
    //sol._DDelivery = _DDelivery.val().trim();
    //sol._Deadline = _Deadline.val().trim();
    //    sol._DShipping = _DShipping.val().trim();
    sol._DExpArrival = _DExpArrival.val().trim();
    sol.FeatureCode = FeatureCode.val().trim();
    sol.Client = ''; //Client.val().trim();
    sol.SodSupNbr = SodSupNbr.val().trim();
    //sol.Comment = Comment.val().trim();
    sol.SodFinish = $('#SodFinish_' + solid).is(':checked');
    //console.log($('#SodFinish_' + solid).is(':checked'));

    if (!jQuery.isEmptyObject(onesol)) {
        //var oldDp = getDateString(onesol[0].DProduction);
        var oldDE = getDateString(onesol[0].DExpDelivery);
        //var oldDD = getDateString(onesol[0].DDelivery);
        //var oldDDead = getDateString(onesol[0].Deadline);
        var oldEta = getDateString(onesol[0].DExpArrival);

        var diff = false;
        //        if (oldDp != _DProduction.val().trim()) {
        //            diff = true;
        //            //console.log(1);
        //        }
        if (oldDE != _DExpDelivery.val().trim()) {
            diff = true;
            //console.log(2);
        }
        if (oldEta != _DExpArrival.val().trim()) {
            diff = true;
        }
        //        if (oldDD != _DDelivery.val().trim()) {
        //            diff = true;
        //            //console.log(3);
        //        }
        //        if (oldDDead != _Deadline.val().trim()) {
        //            diff = true;
        //            //console.log(4);
        //        }
        //console.log(diff);
    }
    Sol2Update = sol;
    if (diff) {
        var title = 'ATTENTION 注意';
        var defaultbtname = 'MAJ cett ligne 只更新本行';
        var btnname = 'MAJ TOUTES 更新所有行';
        var msg = 'Vous voulez mettre à jour les dates modifiées que pour cette lignes ou pour toutes les lignes de cette commande founisseur? <br/>希望只更新本行日期还是希望更新该订单下的所有行的日期?';
        var content = "<div class='box'><div class='box-body' style='height: 150px;'>" +
        "<div class='form-horizontal'>" +
        "<div class='col-md-12'>" +
        "<div class='form-group'>" +
        "<div class='col-sm-12' style='text-align:center;font-size: 18pt;'>" + msg + "</div></div></div></div></div></div>"
        + "<div class='modal-footer center'>" +
        "<button type='button' class='btn btn-default' onclick='UpdateSolLite(false)'>" + defaultbtname + "</button>" +
        "<button type='button' class='btn btn-inverse' onclick='UpdateSolLite(true)'>" + btnname + "</button>" +
        "</div>";
        bootbox.dialog({
            closeButton: false,
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
    } else {
        UpdateSolLite(false);
    }
    $(sender).prop('disabled', false);
    return false;
}

function UpdateSolLite(updateAll) {
    var sol = Sol2Update;
    sol.UpdateAllSols = updateAll;
    var jsondata = JSON.stringify({ oneLine: sol });
    var url = window.webservicePath + "/InsertUpdateSolLite";
    $.ajax({
        url: url,
        type: 'POST',
        contentType: 'application/json; charset=utf-8',
        data: jsondata,
        dataType: 'json',
        success: function (data) {
            HidePleaseWait();
            alert('Mis à jour est effecturé !');
            setTimeout(function () { $('#dialog_ok2').click(); }, 500);
            //$(sender).prop('disabled', false);
            js_search(false, false, false);
        },
        error: function (data) {
            HidePleaseWait();
            alert(data.responseText);
        }
    });
    return false;
}

function ViewSolDetail(sender) {
    var solid = $(sender).attr('solId') * 1;
    var sodId = $(sender).attr('sodId');
    //console.log(sodId);
    var url = 'SupplierOrder.aspx?sodId=' + sodId + "&mode=view&solId=" + solid;
    window.open(url, '_blank');
    return false;
}

function js_expExcel() {
    ShowPleaseWait();
    js_search(false, true, false);
    return false;
}

function downloadCsv() {
    try {
        var csv = "";
        // title
        csv += "Commercial;Fournisseur;Client;N°CF;Nom CF;D.PV Fin;D.Arr;Expéditeur;Fournisseur N°;N° Fonction;Prd;Description;Qty;PU;T. Montant\r\n";
        csv += "下单人;供货商;客户;我方订单号;订单名;预计交期;预计到港;发货人;供货商订单号;特征码;产品;产品描述;数量;单价;总价\r\n";

        sodwithsols = sodwithsols.sort(sort_by('Commercial1', {
            name: 'SodCode',
            primer: parseInt,
            reverse: false
        }));

        var lastCommercial = "";
        $.each(sodwithsols, function (name, value) {
            if (lastCommercial != value.Commercial1) {
                csv += "\r\n";
                csv += value.Commercial1 + "\r\n";
            }
            lastCommercial = value.Commercial1;
            csv += value.Commercial1 + ";";
            csv += value.SupplierCompanyName + ";";
            csv += value.Client + ";";
            csv += value.SodCode + ";";
            csv += value.SodName + ";";
            csv += getDateString(value.DExpDelivery) + ";";
            csv += getDateString(value.DExpArrival) + ";";
            csv += (((value.Transporter == null || value.Transporter == "") ? "" : value.Transporter + " : ") + (value.LogsNbr == null ? "" : value.LogsNbr)) + ";";
            //csv += value.SodSupNbr + ";";
            csv += ((value.SodSupNbr == 'null' || value.SodSupNbr == null) ? '' : value.SodSupNbr) + ";";
            csv += ((value.FeatureCode == 'null' || value.FeatureCode == null) ? '' : value.FeatureCode) + ";";
            csv += value.PrdName + ";";
            var description = value.Description;
            // 处理description
            description = replaceAll(description, ";", ":");
            description = replaceAll(description, "\r\n", "---");
            description = replaceAll(description, "\r", "---");
            description = replaceAll(description, "\n", "---");
            csv += description + ";";
            csv += value.Quantity + ";";
            csv += ReplaceNumberWithCommas(value.UnitPriceWithDis) + ";";
            csv += ReplaceNumberWithCommas(value.TotalPrice) + "\r\n";
        });

        var csv_content = csv,
            download = document.createElement("a"),
            blob = new Blob(["\ufeff", csv_content], { type: "text/csv;charset=ISO-8859-1" });

        download.href = window.URL.createObjectURL(blob);
        var from = $('#DateCreationFrom').val();
        var to = $('#DateCreationTo').val();
        download.download = "订单详情" + from + "-" + to + ".csv";

        var event = document.createEvent("MouseEvents");
        event.initMouseEvent(
            "click", true, false, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null
        );
        download.dispatchEvent(event);

    } catch (e) {
    }
}

function js_expPayment() {
    ShowPleaseWait();
    js_search(false, false, true);
    return false;
}

function downlaodPayment() {
    //console.log(sodForPayment);
    try {
        var csv = "";
        // title
        csv += "Fournisseur;Commercial;Client;N°CF;Nom CF;Fournisseur N°;Total TTC;Payé;A payer\r\n";
        csv += "供货商;下单人;客户;我方订单号;订单名;供货商订单号;总款(含税);已支付;未支付\r\n";

        sodForPayment = sodForPayment.sort(sort_by('SupplierCompanyName', {
            name: 'Need2Pay',
            primer: parseInt,
            reverse: false
        }));

        var lastSup = "";
        $.each(sodForPayment, function (name, value) {
            if (lastSup != value.SupplierCompanyName) {
                csv += "\r\n";
                csv += value.SupplierCompanyName + "\r\n";
            }
            lastSup = value.SupplierCompanyName;
            csv += value.SupplierCompanyName + ";";
            csv += value.Commercial + ";";
            csv += value.Client + ";";
            csv += value.SodCode + ";";
            csv += value.SodName + ";";
            csv += value.SodSupNbr + ";";
            csv += ReplaceNumberWithCommas(value.TotalAmountTtc) + ";";
            csv += ReplaceNumberWithCommas(value.Paid) + ";";
            csv += ReplaceNumberWithCommas(value.Need2Pay) + "\r\n";
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
    }
}

function jsMoreInfo() {
    var url = 'SupplierOrderPayment.aspx';
    window.open(url, '_blank');
    return false;
}
