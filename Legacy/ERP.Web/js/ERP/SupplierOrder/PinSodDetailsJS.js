

function js_search() {
    var displayall = $('#cbx_displayall')[0].checked;
    var jsondata = JSON.stringify({
        displayall: displayall
    });
    var url = window.webservicePath + "/GetAllPilSol";
    ShowPleaseWait();
    $.ajax({
        url: url,
        type: 'POST',
        contentType: 'application/json; charset=utf-8',
        data: jsondata,
        dataType: 'json',
        success: function (data) {
            //console.log(data);
            var jsdata = data.d;
            //var data2Treat = jQuery.parseJSON(jsdata);
            var data2Treat = [];
            try {
                data2Treat = jQuery.parseJSON(jsdata);
            } catch (e) {
                data2Treat = JSON.parse(jsdata);
            }

            if (data2Treat.length === 0) {
                HidePleaseWait();
                $('#div_search_result').hide();

                //$('#dt_pins').remove();
                NoResultMsg();
            } else {
                viewSearchResult(data2Treat);
            }
        },
        error: function (data) {
            HidePleaseWait();
        }
    });
    return false;
}

var hasSet = false;

var firstclickT = 0;
var lastclickTime = 0;
var isdbclick = false;
function Mltclick(oneclickEvt, twoclickEvt) {
    var datetime = new Date();
    var thistime = datetime.getTime();
    var timedff = thistime - lastclickTime;
    if (timedff >= 50 && timedff <= 900) {
        // 双击事件
        isdbclick = true;
        window.setTimeout(twoclickEvt, 0);
    } else {
        // 单击事件
        if (firstclickT == 0) {
            firstclickT = thistime;
            // 等待900ms，如果900ms内没有点击，表示是单击事件
            window.setTimeout(oneclickEvt, 900);
        } else {
            //单击事件
            firstclickT = 0;
            isdbclick = false;
        }
    }
}


function ViewPinPil(sender) {
    var pinid = $(sender).attr('pinid');
    var pilid = $(sender).attr('pilid');
    if (pinid != '0' && pinid != null && pinid != 'null') {
        var url = '../PurchaseIntent/PurchaseIntent.aspx';
        url = url + '?pinId=' + pinid + '&pilId=' + pilid + '&mode=view';
        //document.location.href = newUrl;
        window.open(url, '_blank');
    }
    return false;
}

function ViewSodSil(sender) {
    var sodid = $(sender).attr('sodid');
    var solid = $(sender).attr('solid');
    if (sodid != '0' && sodid != null && sodid != 'null') {
        var url = 'SupplierOrder.aspx';
        url = url + '?sodId=' + sodid + '&solId=' + solid + '&mode=view';
        //document.location.href = newUrl;
        window.open(url, '_blank');
    }
    return false;
}

//connectedUser.LoginMode === 1
function viewSearchResult(data2Treat) {
    var datetime = new Date();
    var todayTime = datetime.getTime();
    var name = '_pins';
    var dt_name = 'dt' + name;
    var div_name = 'div' + name;
    var th_name = 'th' + name;
    var tb_name = 'tb' + name;
    var tf_name = 'tf' + name;
    var rst_name = 'rst' + name;
    var headerFooter = "<tr>" +
        "<th style='text-align:center;font-size:10px;vertical-align: middle;' class='language_txt'>N° I.Achat</th>" +
        "<th style='text-align:center;font-size:10px;vertical-align: middle;' class='language_txt'>Nom I.Achat</th>" +
        "<th style='text-align:center;font-size:10px;vertical-align: middle;' class='language_txt'>N° CF</th>" +
        "<th style='text-align:center;font-size:10px;vertical-align: middle;' class='language_txt'>Nom CF</th>" +
        "<th style='text-align:center;font-size:10px;vertical-align: middle;' class='language_txt'>Client</th>" +
        "<th style='text-align:center;font-size:10px;vertical-align: middle;' class='language_txt'>Fournisseur</th>" +
        (connectedUser.LoginMode === 1 ? "<th style='text-align:center;font-size:10px;vertical-align: middle;' class='language_txt'>Sub Fournisseur</th>" : "") +
        "<th style='text-align:center;font-size:10px;vertical-align: middle;' class='language_txt'>Fonc. code</th>" +
        "<th style='text-align:center;font-size:10px;vertical-align: middle;' class='language_txt'>Commercial</th>" +
        "<th style='text-align:center;font-size:10px;vertical-align: middle;' class='language_txt'>Commentaire</th>" +
        "<th style='text-align:center;font-size:10px;vertical-align: middle;' class='language_txt'>D. C.</th>" +
        "<th style='text-align:center;font-size:10px;vertical-align: middle;' class='language_txt'>Prd.</th>" +
        "<th style='text-align:center;font-size:10px;vertical-align: middle;' class='language_txt'>Descp.</th>" +
        "<th style='text-align:center;font-size:10px;vertical-align: middle;' class='language_txt'>Qty</th>" +
        "<th style='text-align:center;font-size:10px;vertical-align: middle;' class='language_txt'>Stocké</th>" +
        "<th style='text-align:center;font-size:10px;vertical-align: middle;' class='language_txt'>PU</th>" +
        "<th style='text-align:center;font-size:10px;vertical-align: middle;' class='language_txt'>Mnt HT</th>" +
        "<th style='text-align:center;font-size:10px;vertical-align: middle; background-color: #e0c240;' class='language_txt'>D. P.</th>" +
        "<th style='text-align:center;font-size:10px;vertical-align: middle; background-color: #668cd9;' class='language_txt'>D. Pv. Fin</th>" +
        "<th style='text-align:center;font-size:10px;vertical-align: middle; ' class='language_txt'>D. Fin</th>" +
        "<th style='text-align:center;font-size:10px;vertical-align: middle; ' class='language_txt'>D. Expé.</th>" +
        "<th style='text-align:center;font-size:10px;vertical-align: middle; background-color: #4cb052;' class='language_txt'>D. Arr.</th>" +
        "<th style='text-align:center;font-size:10px;vertical-align: middle; background-color: #d96666;' class='language_txt'>Deadline</th>" +
    //        "<th style='text-align:center;font-size:10px;vertical-align: middle;'>Payé 已支付</th>" +
    //        "<th style='text-align:center;font-size:10px;vertical-align: middle;'>Balance 尾款</th>" +
        "<th style='text-align:center;font-size:10px;vertical-align: middle;' class='language_txt'>Expé.</th>" +
        "<th style='text-align:center;font-size:10px;vertical-align: middle;' class='language_txt'>N° Tracking</th>" +
        "<th style='text-align:center;font-size:10px;vertical-align: middle; width:50px;' class='language_txt'>Nofi</th>" +
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
        titles.push({ "sTitle": "PinCode" });
        titles.push({ "sTitle": "PinName" });
        titles.push({ "sTitle": "SuoCode" });
        titles.push({ "sTitle": "SuoName" });
        titles.push({ "sTitle": "Client" });
        titles.push({ "sTitle": "Supplier1" });
        if (connectedUser.LoginMode === 1) {
            titles.push({ "sTitle": "Suppleir2" });
        }
        titles.push({ "sTitle": "CodeF" });
        titles.push({ "sTitle": "Commercial" });
        titles.push({ "sTitle": "Comment" });
        titles.push({ "sTitle": "DCre" });
        titles.push({ "sTitle": "Prod" });
        titles.push({ "sTitle": "Desc" });
        titles.push({ "sTitle": "Qty" });
        titles.push({ "sTitle": "Stock" });
        titles.push({ "sTitle": "PU" });
        titles.push({ "sTitle": "MHT" });
        titles.push({ "sTitle": "DPrd" });
        titles.push({ "sTitle": "DExpDlv" });
        titles.push({ "sTitle": "DDev" });
        titles.push({ "sTitle": "DShip" });
        titles.push({ "sTitle": "DExpAvl" });
        titles.push({ "sTitle": "Deadline" });
        //        titles.push({ "sTitle": "MPaid" });
        //        titles.push({ "sTitle": "MBal" });
        titles.push({ "sTitle": "Transporter" });
        titles.push({ "sTitle": "LogsNbr" });
        titles.push({ "sTitle": "btnup" });

        var displaycount = 1;
        $.each(data2Treat, function (fname, value) {
            var dataArray = new Array();
            var color = value.SolId == 0 ? '#d96666' : ((value.QtyStored === value.Quantity) ? "#4cb052" : "#e0c240");
            dataArray.push("<span style='color:" + color + "; cursor:pointer' pinid='" + value.PinFId + "' pilid='" + value.PilId + "' onclick='ViewPinPil(this)' >" + (value.PinCode != null ? value.PinCode : "") + "</span>");
            dataArray.push("<span style='color:" + color + "; cursor:pointer' pinid='" + value.PinFId + "' pilid='" + value.PilId + "' onclick='ViewPinPil(this)' >" + (value.PinName != null ? value.PinName : "") + "</span>");
            dataArray.push("<span style='color: " + color + "; cursor:pointer' sodid='" + value.SodFId + "' solid='" + value.SolId + "' onclick='ViewSodSil(this)'>" + (value.SodCode != null ? value.SodCode : "") + "</span>");
            dataArray.push("<span style='color: " + color + "; cursor:pointer' sodid='" + value.SodFId + "' solid='" + value.SolId + "' onclick='ViewSodSil(this)'>" + (value.SodName != null ? value.SodName : "") + "</span>");
            dataArray.push(value.Client == null ? "" : value.Client);
            dataArray.push(value.Supplier1 == null ? "" : value.Supplier1);
            if (connectedUser.LoginMode === 1) {
                dataArray.push(value.Supplier2 == null ? "" : value.Supplier2);
            }
            dataArray.push(value.FeatureCode == null ? "" : value.FeatureCode);
            var com1 = value.Commercial1 == null ? "" : value.Commercial1;
            var com2 = value.Commercial2 == null ? "" : value.Commercial2;
            var com3 = value.Commercial3 == null ? "" : value.Commercial3;
            com2 = (com2 == "" ? com1 : (com1 == "" ? com2 : (com1 + "</br>" + com2)));
            com3 = (com3 == "" ? com2 : (com2 == "" ? com3 : (com2 + "</br>" + com3)));
            dataArray.push(com3);
            dataArray.push(value.Comment == null ? "" : value.Comment);
            dataArray.push(getDateString(value.DateCreation));
            // sol détail
            dataArray.push(value.PrdName + " " + value.PitName);
            dataArray.push(value.Description);
            dataArray.push(value.Quantity);
            dataArray.push("<span style='color:" + color + "'>" + (value.QtyStored != null ? value.QtyStored : "") + "</span>");
            dataArray.push(ReplaceNumberWithCommas(value.UnitPriceWithDis));
            dataArray.push(ReplaceNumberWithCommas(value.TotalPrice));

            dataArray.push(getDateString(value.DProduction));
            dataArray.push(getDateString(value.DExpDelivery));
            dataArray.push(getDateString(value.DDelivery));
            dataArray.push(getDateString(value.DShipping));
            dataArray.push(getDateString(value.DExpArrival));

            dataArray.push(getDateString(value.Deadline));
            dataArray.push((value.Transporter == null ? "" : value.Transporter));
            dataArray.push((value.LogsNbr == null ? "" : value.LogsNbr));

            var dpWr = "";
            var dPvfWr = "";
            var dArrWr = "";
            var dDearWr = "";

            if (!IsNullOrEmpty(value.DProduction)) {
                var checkDt = new Date(todayTime - new Date(parseInt(value.DProduction.substr(6)))) / 1000 / 60 / 60 / 24;
                if (checkDt >= -6 && checkDt <= 6) {
                    dpWr = "<span class='label label-warning'>Warning ±5 D.Prod 开始生产日期</span>";
                }
            }
            if (!IsNullOrEmpty(value.DExpDelivery)) {
                var checkDt = new Date(todayTime - new Date(parseInt(value.DExpDelivery.substr(6)))) / 1000 / 60 / 60 / 24;
                if (checkDt >= -6 && checkDt <= 6) {
                    dPvfWr = "<span class='label label-warning'>Warning ±5 D.Pv Fin 预计交期</span>";
                }
            }
            if (!IsNullOrEmpty(value.DExpArrival)) {
                var checkDt = new Date(todayTime - new Date(parseInt(value.DExpArrival.substr(6)))) / 1000 / 60 / 60 / 24;
                if (checkDt >= -6 && checkDt <= 6) {
                    dArrWr = "<span class='label label-warning'>Warning ±5 D.Arr 预计到港</span>";
                }
            }
            if (!IsNullOrEmpty(value.Deadline)) {
                var checkDt = new Date(todayTime - new Date(parseInt(value.Deadline.substr(6)))) / 1000 / 60 / 60 / 24;
                if (checkDt >= -6 && checkDt <= 6) {
                    dDearWr = "<span class='label label-warning'>Warning ±5 Deadline 警戒日期</span>";
                }
            }


            var dperr = IsNullOrEmpty(value.DProduction) ? "<span class='label label-danger'>ERR D.Prod 开始生产日期</span>" : "";
            var dPvFerr = IsNullOrEmpty(value.DExpDelivery) ? "<span class='label label-danger'>ERR D.Pv Fin 预计交期</span>" : "";
            var dArrErr = IsNullOrEmpty(value.DExpArrival) ? "<span class='label label-danger'>ERR D.Arr 预计到港</span>" : "";
            var dDeadErr = IsNullOrEmpty(value.Deadline) ? "<span class='label label-danger'>ERR Deadline 警戒日期</span>" : "";


            //            var btnupdate = "<button class='' solid='" + value.SolId + "' id='btn_upsol_" + value.SolId + "' name='btn_upsol_" + value.SolId + "' sodId='" + value.SodId + "' title='update 更新' onclick='return updateSol(this)' ><i class='fa fa-refresh'></i></button>";
            //            var btnupdateDetail = "<button class='' solid='" + value.SolId + "' id='btn_upDtsol_" + value.SolId + "' name='btn_upsol_" + value.SolId + "' sodId='" + value.SodFId + "' title='view details 细节' onclick='return ViewSolDetail(this)' ><i class='fa fa-book'></i></button>";
            //            dataArray.push(btnupdate + btnupdateDetail);
            dataArray.push(dperr + dPvFerr + dArrErr + dDeadErr + dpWr + dPvfWr + dArrWr + dDearWr);
            //dataArray.push("");


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

    HidePleaseWait();

    SetLanguageBar();

}