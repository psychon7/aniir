
var addNewLineBtn = "<div class='col-sm-7 left' id='div_btn_add_lgs'><button class='btn btn-inverse' id='btn_add_lgs' name='btn_add_lgs' onclick='AddNewLgs()'><span>Créer un envoie 新建发货</span></button></div>";
var selectFromLgsDiv = "<div class='col-sm-7 left' id='div_select_from_lgs'><input class='form-control' id='lgsList' name='lgsList' onkeyup='checkContent(this)' /></div>";


var oneSolToSend = [];

function SendSol(sender) {
    var solid = $(sender).attr('solid') * 1;
    var sodid = $(sender).attr('sodid') * 1;
    oneSolToSend = [];
    oneSolToSend = searchFieldValueInArray(sodwithsols, 'SolId', solid);

    var startBox = "<div class='box'><div class='box-body'>";
    var endBox = "</div></div>";
    var onelineContent =
        // start box
        "<div class='form-group' id='div_one_line'>" +
            "<div class='row'>" +
            "<div class='col-md-12'>" +
            "<div class='box-body'>" +
            "<div class='form-horizontal'>" +
            "<div class='form-group' id='lgs_type_line'>" +
            "<label class='col-sm-3 control-label'>Ajouter dans un envoie existant 添加到已有物流</label>" +
            "<div class='col-sm-2'><input type='checkbox' id='selectFromSin ' class='form-control' name='selectFromLgs' onclick='SelectFromLgs(this)' /></div>" +
            addNewLineBtn +
            "</div>" +
            "<div id='lgs_consignee'>" +
            "</div>" +
            "<div id='lgs_all_lines'>" +
            "</div>" +
            "<div id='lgs_sol_info'>" +
            "</div>" +
            // close box
            "</div></div></div></div></div>";

    var btnAddUpdate = "<button class='btn btn-inverse' id='btn_add_update_discount' name='btn_save_send_sol' onclick='return SaveSendSol()'><span>Sauvegarder 保存</span></button>";
    var btnClose = "<button class='btn btn-default bootbox-close-button' id='btn_cancel_send_sol' onclick='return CancelSaveSendSol()'><span>Annuler 取消</span></button>";

    var btns = "<div class='modal-body center'>" + btnClose + btnAddUpdate + "</div>";
    var onecontent = startBox + onelineContent + btns + endBox;

    var title = 'Expédition 发货';
    bootbox.dialog({
        title: title,
        message: onecontent
    }).find('.modal-dialog').css({
        'width': '80%'
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
    var oneline = "";
    if (!jQuery.isEmptyObject(oneSolToSend)) {
        oneline += "<div class='form-group'>";
        oneline += " <label class='col-sm-2 control-label'>Produit 产品</label> ";
        oneline += " <label class='col-sm-2 control-label'>" + oneSolToSend.PrdName + " " + oneSolToSend.PitName + "</label> ";
        oneline += " <label class='col-sm-2 control-label'>PU 单价</label> ";
        oneline += " <label class='col-sm-2 control-label'>" + ReplaceNumberWithCommas(oneSolToSend.UnitPriceWithDis) + "</label> ";
        oneline += " <label class='col-sm-2 control-label'>Mnt HT 总价</label> ";
        oneline += " <label class='col-sm-2 control-label'>" + ReplaceNumberWithCommas(oneSolToSend.TotalPrice) + "</label> ";
        oneline += "</div>";
        oneline += "<div class='form-group'>";
        oneline += " <label class='col-sm-2 control-label'>Total Qté 总数</label> ";
        oneline += " <label class='col-sm-2 control-label'>" + oneSolToSend.Quantity + "</label> ";
        oneline += " <label class='col-sm-2 control-label'>Envoyé 已发</label> ";
        oneline += " <label class='col-sm-2 control-label'>" + (oneSolToSend.Quantity - oneSolToSend.SolQuantity) + "</label> ";
        oneline += " <label class='col-sm-2 control-label fieldRequired'>A envoyer cette fois 本次要发</label> ";
        oneline += " <div class='col-sm-2'><input type='number' step='1' class='form-control' id='SolQty2Send' max='" + oneSolToSend.Quantity + "' min='1' value='" + oneSolToSend.SolQuantity + "'/></div> ";
        oneline += "</div>";
    }
    $('#lgs_sol_info').append(oneline);
    return false;
}

function CancelSaveSendSol() {
    selectedLgsId = '';
    allCurrentLgls = [];
    oneSolToSend = [];
    return false;
}

function SaveSendSol() {
    if (selectedLgsId !== '') {
        ShowPleaseWait();
        var url = window.webservicePath + "/AddSolToLgs";
        var lgsId = selectedLgsId;
        var solId = oneSolToSend.SolId * 1;
        var qty = $('#SolQty2Send').val().trim() * 1;
        // check qty
        if (qty < 1) {
            qty = 1;
        }
        if (qty > oneSolToSend.SolQuantity) {
            qty = oneSolToSend.SolQuantity;
        }

        var jsondata = JSON.stringify({
            lgsId: lgsId,
            solId: solId,
            qty: qty
        });
        $.ajax({
            url: url,
            type: 'POST',
            contentType: 'application/json; charset=utf-8',
            data: jsondata,
            dataType: 'json',
            success: function(data) {
                var jsdata = data.d;
                var data2Treat = jQuery.parseJSON(jsdata);
                if (data2Treat !== '-1') {
                    if (data2Treat !== 0) {
                        HidePleaseWait();
                        alert('Mis à jour est effecturé !');
                        setTimeout(function() {
                            $('#dialog_ok2').click();
                            $('#btn_cancel_send_sol').click();
                            js_search(true, false, false);
                        }, 500);

                    } else {
                        HidePleaseWait();
                        alert('Erreur, veuillez contacter l\'administrateur! 错误，请联系管理员');
                       //setTimeout(function() { $('#dialog_ok2').click(); }, 500);
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
        alert('Veuillez sélectionner un envoie<br/>请选择一个物流');
    }
    return false;
}

function SelectFromLgs(sender) {
    var fromSin = $(sender).is(':checked');
    if (fromSin) {
        $('#div_btn_add_lgs').remove();
        $('#lgs_type_line').append(selectFromLgsDiv);
        $('#lgs_all_lines').empty();

        setLgsAutoComplete();
        //GetSil2Delivery();
    } else {
        $('#div_select_from_lgs').remove();
        $('#lgs_type_line').append(addNewLineBtn);
        $('#lgs_all_lines').empty();
    }
}

function checkContent(sender) {
    return false;
}

var selectedLgsId = '';
var allCurrentLgls = [];
function setLgsAutoComplete() {
    //console.log(selectedLgsId);
    selectedLgsId = '';
    allCurrentLgls = [];
    //console.log($.now());
    $('#lgs_all_lines').empty();
    var url = window.webservicePath + "/GetLogisticsByKeyword";
    $("#lgsList").autocomplete({
        source: function(request, response) {
            $.ajax({
                url: url,
                data: "{ 'keyword': '" + request.term + "'}",
                dataType: "json",
                type: "POST",
                contentType: "application/json; charset=utf-8",
                success: function(data) {
                    var jsdata = data.d;
                    var data2Treat = jQuery.parseJSON(jsdata);
                    if (data2Treat.length > 0) {
                        response($.map(data2Treat, function(item) {
                            return {
                                label: item.LgsCode + ' | ' + item.Supplier.CompanyName + ' | ' + item.LgsTrackingNumber,
                                val: item.FId,
                            }
                        }));
                    } else {
                        selectedLgsId = '';
                        allCurrentLgls = [];
                        $('#lgs_all_lines').empty();
                    }
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
            selectedLgsId = i.item.val;
            //console.log(selectedLgsId);
            var urlpit = window.webservicePath + "/LoadAllLgsLines";
            $.ajax({
                url: urlpit,
                data: "{ 'lgsId':'" + selectedLgsId + "'}",
                dataType: "json",
                type: "POST",
                contentType: "application/json; charset=utf-8",
                success: function(data) {
                    var jsdata = data.d;
                    var data2Treat = jQuery.parseJSON(jsdata);
                    allCurrentLgls = [];
                    allCurrentLgls = data2Treat;
                    //alertWindow('testesttest');
                    var oneline = "<div class='row' style='overflow-y: auto; overflow-x:hidden; max-height:500px;'>" +
                        "<div class='col-md-12'>" +
                        "<div class='box-body'>" +
                        "<div class='form-horizontal'>" +
                        "<div class='form-group'>" +
                        "<label class='col-sm-12 control-label' style='text-align:center !important;'>Détail d'envoie 物流详情</label><br/><br/>";
                    oneline += "<table style='font-size: 12pt; width: 100%;'>";
                    oneline += "<tr>";
                    oneline += "<td style='border: 1px solid black; text-align:center; width: 30%;font-size: 12pt;'>Produit 产品</td>";
                    oneline += "<td style='border: 1px solid black; text-align:center; width: 40%;font-size: 12pt;'>Des. 描述</td>";
                    oneline += "<td style='border: 1px solid black; text-align:center; width: 30%;font-size: 12pt;'>Qté 数量</td>";
                    oneline += "</tr>";
                    $.each(allCurrentLgls, function(name2, sol) {
                        oneline += "<tr>";
                        oneline += "<td style='border: 1px solid black; text-align:left !important;font-size: 12pt;'>" + sol.ProductName + "</td>";
                        oneline += "<td style='border: 1px solid black; text-align:left !important;font-size: 12pt;'>" + sol.LglDescription + "</td>";
                        oneline += "<td style='border: 1px solid black; text-align:right !important;font-size: 12pt;'>" + sol.LglQuantity + "</td>";
                        oneline += "</tr>";
                    });
//                    for (var i = 0; i < 500; i++) {
//                        oneline += "<tr>";
//                        oneline += "<td style='border: 1px solid black; text-align:left !important;font-size: 12pt;'>" + i + "</td>";
//                        oneline += "<td style='border: 1px solid black; text-align:left !important;font-size: 12pt;'>" + i + "</td>";
//                        oneline += "<td style='border: 1px solid black; text-align:right !important;font-size: 12pt;'>" + i + "</td>";
//                        oneline += "</tr>";
//                    }
                    oneline += "</table>";
                    var end1 = "</div>";

                    oneline += end1;
                    var end2 = "</div></div></div></div>";
                    oneline += end2;
                    $('#lgs_all_lines').append(oneline);
                    //alertWindow(oneline);
                },
                error: function(response) {
                }
            });
        },
        minLength: 3
    });
}

function AddNewLgs() {
    var url = '../Logistics/Logistics.aspx';
    pageSnapShot(url);
}