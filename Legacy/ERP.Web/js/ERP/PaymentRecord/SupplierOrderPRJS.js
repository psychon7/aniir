$(document).ready(initAll);

try {

    $.datepicker.regional['fr'] = { clearText: 'Effacer', clearStatus: '',
        closeText: 'Fermer', closeStatus: 'Fermer sans modifier',
        prevText: '&lt;Préc', prevStatus: 'Voir le mois précédent',
        nextText: 'Suiv&gt;', nextStatus: 'Voir le mois suivant',
        currentText: 'Courant', currentStatus: 'Voir le mois courant',
        monthNames: ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'],
        monthNamesShort: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun',
    'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'],
        monthStatus: 'Voir un autre mois', yearStatus: 'Voir un autre année',
        weekHeader: 'Sm', weekStatus: '',
        dayNames: ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'],
        dayNamesShort: ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'],
        dayNamesMin: ['Di', 'Lu', 'Ma', 'Me', 'Je', 'Ve', 'Sa'],
        dayStatus: 'Utiliser DD comme premier jour de la semaine', dateStatus: 'Choisir le DD, MM d',
        dateFormat: 'dd/mm/yy', firstDay: 0,
        initStatus: 'Choisir la date', isRTL: false
    };
    $.datepicker.setDefaults($.datepicker.regional['fr']);

} catch (e) {

}

function initAll() {
    var solId = getUrlVars()['solId'] * 1;
    var sodId = getUrlVars()['sodId'];
    if (solId) {
        LoadAllSolPr(solId, sodId);
        //LoadSupplier(true);
    }
    $.each($('.datepicker'), function(idx, value) {
        $(value).datepicker();
    });
    //initMode();
    //setClickableLabel();
    //    if (_isCreate) {
    //        $('#DateCreation').val(getToday());
    //    }

}

var hasSet = false;
var sprLines = [];
var curSodId = '';
var curSolId = 0;

function LoadAllSolPr(solId, sodId) {
    curSodId = sodId;
    curSolId = solId;
//    console.log(curSodId);
//    console.log(curSolId);
    //ShowPleaseWait();
    var url = window.webservicePath + "/GetSolPr";
    var datastr = "{solId:'" + solId + "'}";
    $.ajax({
        type: "POST",
        url: url,
        contentType: "application/json; charset=utf-8",
        data: datastr,
        dataType: "json",
        success: function(data) {
            var jsdata = data.d;
            //var data2Treat = jQuery.parseJSON(jsdata);
            var data2Treat = JSON.parse(jsdata);
            sprLines = data2Treat;
            if (data2Treat !== '-1') {
                if (data2Treat.length === 0) {
                    var noresult = "<tr><td colspan='5' style='text-align:center; color:red;'>Aucun résultat trouvé 没有任何支付信息</td></tr>";
                    $('#tbody_search_result').append(noresult);
                } else {
                    var headerFooter = "<tr>" +
                        "<th>D. Création 创建日期</th>" +
                        "<th>D. MAJ 更新日期</th>" +
                        "<th>D. Paiement 支付日期</th>" +
                        "<th>Montant de paiement 支付金额</th>" +
                        "<th>Commentaire 支付备注</th>" +
                        "<th></th>" +
                        "</tr>";
                    try {
                        $('#datatable_search_result').remove();
                        var datatableContent = "<table id='datatable_search_result' cellpadding='0' cellspacing='0' border='0' class='datatable table table-striped table-bordered table-hover'>" +
                            "<thead id='thead_search_result'>" +
                            //headerFooter +
                            "</thead>" +
                            "<tbody id='tbody_search_result'></tbody>" +
                            "<tfoot id='tfoot_search_result'>" +
                            //headerFooter +
                            "</tfoot>" +
                            "</table>";
                        $('#div_done_record').html(datatableContent);

                    } catch (e) {
                        var test = '';
                    }
                    var resultcount = data2Treat.length;
                    //$('#result_count').text(resultcount);
                    if (resultcount > 0) {
                        //$('.searchresult').show();
                        $('#mask_processing').text(resultcount + ' resultats ...');
                        $('#mask_processing').val(resultcount + ' resultats ...');

                        $('#thead_search_result').empty();
                        $('#tfoot_search_result').empty();

                        $('#thead_search_result').append(headerFooter);
                        $('#tfoot_search_result').append(headerFooter);

                        var titles = new Array();
                        titles.push({ "sTitle": "DCreation" });
                        titles.push({ "sTitle": "DUpdate" });
                        titles.push({ "sTitle": "DPayment" });
                        titles.push({ "sTitle": "Amount" });
                        titles.push({ "sTitle": "Comment" });
                        titles.push({ "sTitle": "Buttons" });


                        var displaycount = 1;
                        $.each(data2Treat, function(name, value) {
                            $('#mask_processing').text('Traitement en cours ' + displaycount + '/' + resultcount);
                            $('#mask_processing').val('Traitement en cours ' + displaycount + '/' + resultcount);
                            var dataArray = new Array();
                            dataArray.push("<span sprId='" + value.Key + "' solId='" + value.Key2 + "'>" + getDateString(value.DValue) + "</span>");
                            dataArray.push("<span sprId='" + value.Key + "' solId='" + value.Key2 + "'>" + getDateString(value.DValue3) + "</span>");
                            dataArray.push("<span sprId='" + value.Key + "' solId='" + value.Key2 + "'>" + getDateString(value.DValue2) + "</span>");
                            var amount = value.DcValue;
                            dataArray.push("<span sprId='" + value.Key + "' solId='" + value.Key2 + "'>" + amount + "</span>");
                            dataArray.push("<span sprId='" + value.Key + "' solId='" + value.Key2 + "'>" + value.Value + "</span>");
                            var btnSaveUpdate = "<button class='btn btn-inverse' style='height:35px' onclick='return addSOPayementRecord(" + value.Key + ")' sprId='" + value.Key + "' ><i class='fa fa-refresh'></i></button>";

                            dataArray.push("<div>" + btnSaveUpdate + "</div>");
                            try {
                                $('#datatable_search_result').dataTable().fnAddData(dataArray);
                            } catch (e3) {
                                //console.log(e3);
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
                                    "aoColumns": titles,
                                });

                            } catch (e) {
                                //console.log(e);
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
                }
                myApp.hidePleaseWait();
            } else {
                // authentication error
                AuthencationError();

                myApp.hidePleaseWait();
            }
        },
        error: function(data) {
            var test = '';
        }
    });
}

function addSOPayementRecord(sprId) {
    $('#div_new_record').empty();
    var table = "<table id='table_insertupdate_spr' cellpadding='0' cellspacing='0' border='0' class='datatable table table-striped table-bordered table-hover'>" +
        "<thead>" +
        "<tr>" +
        "<th>D. Paiement 支付日期</th>" +
        "<th>Montant de paiement 支付金额</th>" +
        "<th>Commentaire 支付备注</th>" +
        "<th></th>" +
        "</tr>" +
        "</thead>" +
        "<tbody id='tbody_insertupdate_spr'></tbody>" +
        "</table>";
    $('#div_new_record').append(table);

    var dPayment = getToday();
    var amtPayment = '';
    var cmtPayment = '';

    var oneSpr = searchFieldValueInArray(sprLines, 'Key', sprId);

    if (!jQuery.isEmptyObject(oneSpr)) {
        dPayment = getDateString(oneSpr.DValue2);
        amtPayment = oneSpr.DcValue;
        cmtPayment = oneSpr.Value;
    }
    var btnclass = !jQuery.isEmptyObject(oneSpr) ? 'fa fa-refresh' : 'fa fa-save';
    //var disabled = !jQuery.isEmptyObject(oneSpr)? '' : 'disabled';
    var btnSaveUpdate = "<button class='btn btn-inverse' style='height:35px' onclick='return InsUpdPmt(this)' sprId='" + sprId + "' ><i class='" + btnclass + "'></i></button>";
    var btnDelete = "<button class='btn btn-inverse' style='height:35px' onclick='return DeletePmtClick(this)'  sprId='" + sprId + "' ><i class='fa fa-times'></i></button>";

    var oneline = "<tr>" +
        "<td><input class='form-control datepicker' id='DPmt_zzz_' name='DPmt_zzz_'  value='" + dPayment + "'  sprId='" + sprId + "' /></td>" +
        "<td><input class='form-control' id='AmtPmt_zzz_' name='AmtPmt_zzz_' type='number'  value='" + amtPayment + "'  sprId='" + sprId + "' /></td>" +
        "<td><textarea row='3' class='form-control' id='CmtPmt_zzz_' name='CmtPmt_zzz_' sprId='" + sprId + "' ></textarea></td>" +
        "<td style='width:100px; text-align:center;'>" + btnSaveUpdate + btnDelete + "</td>" +
        "</tr>";
    oneline = replaceAll(oneline, '_zzz_', '_' + sprId);
    $('#tbody_insertupdate_spr').append(oneline);
    $('#DPmt_' + sprId).datepicker();
    $('#CmtPmt_' + sprId).val(cmtPayment);


    return false;
}

function InsUpdPmt(sender) {
    var sprId = $(sender).attr('sprId') * 1;
    $(sender).prop("disabled", true);

    var dPayment = $('#DPmt_' + sprId).val().trim();
    var amtPayment = $('#AmtPmt_' + sprId).val().trim().replace(' ', '').replace(',', '.') * 1;
    var cmtPayment = $('#CmtPmt_' + sprId).val();
    //var sodId = getUrlVars()['sodId'];

    if (dPayment == '' || amtPayment == '' || !$.isNumeric(amtPayment)) {
        alert('La date de paiement et le montant sont obligatoires</br>支付日期和支付金额是必须项！');
        $(sender).prop("disabled", false);
    } else {
        var sodPayment = [];
        var onespr = {
            Key: 0,
            DcValue: amtPayment,
            Key2: sprId,
            Value: cmtPayment,
            Value4: curSodId,
            Value3: dPayment,
            Key3: curSolId
        };
        sodPayment.push(onespr);
        if (curSolId) {
            ShowPleaseWait();
            if (sodPayment.length) {
                var jsondata = JSON.stringify({ sodprd: sodPayment });
                var url = window.webservicePath + "/SaveSupplierOrderPayment";
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
                        var sprIds = "";
                        try {
                            var solId = getUrlVars()['solId'] * 1;
                            var sodId = getUrlVars()['sodId'];
                            $('#tbody_insertupdate_spr').empty();
                            LoadAllSolPr(solId, sodId);
                        } catch (e) {
                            console.log(e);
                        }
//                        $.each(data2Treat, function(name, value) {
//                            sprIds += value + ",";
//                        });
//                        uploadPaymentFileClick(sprIds);
                        //js_search();
                        $(sender).prop("disabled", false);
                    },
                    error: function(data) {
                        HidePleaseWait();
                        alert(data.responseText);
                        $(sender).prop("disabled", false);
                    }
                });
            }
        }
    }
    return false;
}

function DeletePmtClick(sender) {
    $('#tbody_insertupdate_spr').empty();
    return false;
}