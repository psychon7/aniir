$(document).ready(init);

////// mask
var myApp;
myApp = myApp || (function () {
    var pleaseWaitDiv = $('<div class="modal " style="text-align:center" id="pleaseWaitDialog" data-backdrop="static" data-keyboard="false">' +
        '<div class="modal-header" style="margin-top:200px; border-bottom: 0px !important;"><h1 id="mask_processing">Traitement en cours ...</h1></div>' +
        '<div class="modal-body">' +
        '<img src="../../img/loaders/4.gif"></div></div>');
    return {
        showPleaseWait: function() {
            $('#mask_processing').text('Traitement en cours ...');
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
////// end mask

function init() {
    getAllStatus();
    //getCplInProgress();
//    getDfo2Delivery();
//    getDfoNoInvoice();
//    getCinNoPaid();
//    getSinNoPaid();
//    getLgsNoSent();
//    getLgsArriving();
//    getCodNotAllDeliveried();
}

function getCplInProgressClick() {
    getCplInProgress();
    return false;
}

var allStatus = [];
function getAllStatus() {
  var url = window.webservicePath + "/GetCplStatus";
    $.ajax({
        type: "POST",
        url: url,
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        success: function (data) {
            var jsdata = data.d;
            var data2Treat = jQuery.parseJSON(jsdata);
            if (data2Treat !== '-1') {
                $.each(data2Treat, function(name, value) {
                    if (value.Key !== 1 && value.Key !== 6) {
                        allStatus.push(value);
                    }
                });
                //allStatus = data2Treat;
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

/////// cost plan
function getCplInProgress() {
    try {
        _getCplInProgress();
    } catch (e) {

    }
}
var hasSet_costplan_inprogress = false;

function _getCplInProgress() {
    myApp.showPleaseWait();
    var url = window.webservicePath + "/GetCostPlansInProgressThisMonthAndLastMonth";
    $.ajax({
        type: "POST",
        url: url,
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        success: function(data) {
            var jsdata = data.d;
            var data2Treat = jQuery.parseJSON(jsdata);
            if (data2Treat !== '-1') {
                var headerFooter = "<tr>" +
                    "<th><input type='checkbox' onclick='selectAllCostPlans(this)'/></th>" +
                    "<th>Client</th>" +
                    "<th>Nom de l'affaire</th>" +
                    "<th>Nom du devis</th>" +
                    "<th>Code du devis</th>" +
                    "<th>Montant</th>" +
                    "<th>D.Création</th>"+
                    "<th>Créateur</th>"+
                    "</tr>";

                try {
                    $('#db_costplan_inprogress').remove();
                    var datatableContent = "<table id='db_costplan_inprogress' cellpadding='0' cellspacing='0' border='0' class='datatable table table-striped table-bordered table-hover'>" +
                        "<thead id='th_costplan_inprogress'>" +
                        headerFooter +
                        "</thead>" +
                        "<tbody id='tb_costplan_inprogress'></tbody>" +
                        "<tfoot id='tf_costplan_inprogress'>" +
                        headerFooter +
                        "</tfoot>" +
                        "</table>";
                    $('#div_costplan_inprogress').html(datatableContent);

                } catch (e) {
                    var test = '';
                }
                var resultcount = data2Treat.length;
                $('#result_costplan_inprogress').text(resultcount);
                if (resultcount > 0) {
                    //                    $('#mask_processing').text(resultcount + ' resultats ...');
                    //                    $('#mask_processing').val(resultcount + ' resultats ...');

                    $('#th_costplan_inprogress').empty();
                    $('#tf_costplan_inprogress').empty();

                    $('#th_costplan_inprogress').append(headerFooter);
                    $('#tf_costplan_inprogress').append(headerFooter);

                    var titles = new Array();
                    titles.push({ "sTitle": "Rien" });
                    titles.push({ "sTitle": "Raison sociale" });
                    titles.push({ "sTitle": "Nom de l'affaire" });
                    titles.push({ "sTitle": "Nom du devis" });
                    titles.push({ "sTitle": "Code du devis" });
                    titles.push({ "sTitle": "Montant" });
                    titles.push({ "sTitle": "Date" });
                    titles.push({ "sTitle": "Creator" });

                    var displaycount = 1;
                    $.each(data2Treat, function(name, value) {
                        var dataArray = new Array();
                        dataArray.push("<input type='checkbox' id='cbx_trait_cpl_" + value.FId + "' onclick='displayCostPlanButton()'/>");
                        dataArray.push("<span id='sp_cp_1_" + value.FId + "' fid='" + value.FId + "' onclick='viewCpl(\"" + value.FId + "\")' style='cursor:pointer'>" + value.ClientCompanyName + "</span>");
                        dataArray.push("<span id='sp_cp_2_" + value.FId + "' fid='" + value.FId + "' onclick='snapshotCPL(\"" + value.FId + "\")' style='cursor:pointer' title='Cliquer pour voir l&apos;instantané'>" + value.PrjName + "</span>");
                        dataArray.push("<span id='sp_cp_3_" + value.FId + "' fid='" + value.FId + "' onclick='viewCpl(\"" + value.FId + "\")' style='cursor:pointer'>" + value.CplName + "</span>");
                        dataArray.push("<span id='sp_cp_4_" + value.FId + "' fid='" + value.FId + "' onclick='viewCpl(\"" + value.FId + "\")' style='cursor:pointer'>" + value.CplCode + "</span>");
                        dataArray.push("<div style='width: 100%; text-align:right;'><span>" + ReplaceNumberWithCommas(value.CplAmount) + "</span></div>");
                        dataArray.push("<div style='width: 100%; text-align:right;'><span>" + getDateString(value.CplDateCreation) + "</span></div>");
                        dataArray.push("<span id='sp_cp_5_" + value.FId + "' fid='" + value.FId + "' onclick='viewCpl(\"" + value.FId + "\")' style='cursor:pointer'>" + value.Creator.FullName + "</span>");
                        try {
                            $('#db_costplan_inprogress').dataTable().fnAddData(dataArray);
                        } catch (e) {
                            var test = '';
                        }
                        displaycount++;
                    });


                    if (hasSet_costplan_inprogress) {
                        try {
                            $('#db_costplan_inprogress').dataTable({
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
                        if (!hasSet_costplan_inprogress) {
                            hasSet_costplan_inprogress = true;
                        }
                    } catch (e) {

                    }
                    // mouse over
//                    try {
//                        $("span[id^='sp_cp_']")
//                            .mouseover(function() {
//                                var fid = $(this).attr('fid');
//                                //alert(fid);
//                                snapshotCPL(fid);
//                            })
//                            .mouseout(function() {
//                            });
//                    } catch (e) {

//                    } 
                    try {
//                        $("span[id^='sp_cp_']")
//                            .mouseover(function() {
//                                var fid = $(this).attr('fid');
//                                //alert(fid);
//                                snapshotCPL(fid);
//                            })
//                            .mouseout(function() {
//                            });

                        $("span[id^='sp_cp_']").on('mouseup', function(e) {

                            switch (e.which) {
                            // Middle click.
                            case 2:
                                var fid = $(this).attr('fid');
                                viewCpl(fid,true);
                                break;
                            }

                            // Pass control back to default handler.
                            return true;
                        });
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
        error: function(data) {
            var test = '';
            myApp.hidePleaseWait();
        }
    });
    return false;
}

function snapshotCPL(fId) {
    var url = 'Views/CostPlan/CostPlan.aspx?cplId=' + fId + "&mode=view&hideHeader=yes&hideSideMenu=yes&hideAllBtn=yes";
    pageSnapShot(url);
    return false;
}

function selectAllCostPlans(sender) {
    var ischecked = $(sender).is(':checked');
    var cpls = $("input[id^='cbx_trait_cpl_']");
    $.each(cpls, function(name, value) {
        $(value).prop('checked',ischecked);
    });
    displayCostPlanButton();
}

function displayCostPlanButton() {
    var cpls = $("input[id^='cbx_trait_cpl_']:checked").length > 0;
    if (cpls) {
        $('#btn_modify_costplan').show();
    } else {
        $('#btn_modify_costplan').hide();
    }
}

function modifyCostPlanClick() {
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
            "<label class='col-sm-4 control-label'>Sélectionner un statut</label>" +
            "<div class='col-sm-6'><select type='text' id='select_cpl_statut' class='form-control' ></select></div>" +
            "<div class='col-sm-2'></div>" +
            "</div>" +
            // close box
            "</div></div></div></div></div>";

    var btnAddUpdate = "<button class='btn btn-inverse' id='btn_add_update_discount' name='btn_add_update_discount' onclick='return ChangeCplStatus()'><span>Sauvegarder</span></button>";
    var btnClose = "<button class='btn btn-default bootbox-close-button' onclick='return false'><span>Annuler</span></button>";

    var btns = "<div class='modal-body center'>" + btnAddUpdate + btnClose + "</div>";
    var onecontent = startBox + onelineContent + btns + endBox;

    var title = 'MODIFIER LE STATUT DE DEVIS';
    bootbox.dialog({
        title: title,
        message: onecontent
    }).find('.modal-dialog').css({
        'width': '50%'
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
        'color': 'white'
    });

    $.each(allStatus, function(name, value) {
        if (value.Key === 2) {
            $('#select_cpl_statut').append($("<option></option>").attr("value", value.Key).attr("style", "color:red;").text(value.Value));
        } else {
            $('#select_cpl_statut').append($("<option></option>").attr("value", value.Key).text(value.Value));
        }
    });
    return false;
}

function ChangeCplStatus() {
    $('.bootbox-close-button').click();
    var cplsChecked = $("input[id^='cbx_trait_cpl_']:checked");
    var status = $('#select_cpl_statut').val() * 1;
    if (status) {
        var cplIds = [];
        $.each(cplsChecked, function(name, value) {
            cplIds.push($(value).attr('id').replace('cbx_trait_cpl_', ''));
        });

        var jsondata = JSON.stringify({ cplIds: cplIds, cstId: status });
        var url = window.webservicePath + "/ChangeCostPlanStatus";
        myApp.showPleaseWait();
        $.ajax({
            url: url,
            type: 'POST',
            contentType: 'application/json; charset=utf-8',
            data: jsondata,
            dataType: 'json',
            success: function(data) {
                myApp.hidePleaseWait();
                getCplInProgress();
            },
            error: function(data) {
                myApp.hidePleaseWait();
            }
        });
    }
    return false;
}

function viewCpl(fId,newpage) {
    myApp.showPleaseWait();
    var url = 'Views/CostPlan/CostPlan.aspx?cplId=' + fId + "&mode=view";
    openPage(url,newpage);
    return false;
}
/////// cost plan


/////// delivery form
function getDfo2Delivery() {
    try {
        _getDfo2Delivery();
    } catch (e) {

    }
    return false;
}
var hasSet_dfo2deilivery = false;
function _getDfo2Delivery() {  
myApp.showPleaseWait();
    var url = window.webservicePath + "/GetDeliveryNoDeliveried";
    $.ajax({
        type: "POST",
        url: url,
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        success: function(data) {
            var jsdata = data.d;
            var data2Treat = jQuery.parseJSON(jsdata);
            if (data2Treat !== '-1') {
                var headerFooter = "<tr>" +
                    "<th>Raison sociale</th>" +
                    "<th>Code de livraison</th>" +
                    "<th>Nom de l'affaire</th>" +
                    "</tr>";

                try {
                    $('#db_dfo2deilivery').remove();
                    var datatableContent = "<table id='db_dfo2deilivery' cellpadding='0' cellspacing='0' border='0' class='datatable table table-striped table-bordered table-hover'>" +
                        "<thead id='th_dfo2deilivery'>" +
                        headerFooter +
                        "</thead>" +
                        "<tbody id='tb_dfo2deilivery'></tbody>" +
                        "<tfoot id='tf_dfo2deilivery'>" +
                        headerFooter +
                        "</tfoot>" +
                        "</table>";
                    $('#div_dfo2delivery').html(datatableContent);

                } catch (e) {
                    var test = '';
                }
                var resultcount = data2Treat.length;
                $('#result_dfo2delivery').text(resultcount);
                if (resultcount > 0) {
                    //                    $('#mask_processing').text(resultcount + ' resultats ...');
                    //                    $('#mask_processing').val(resultcount + ' resultats ...');

                    $('#th_dfo2deilivery').empty();
                    $('#tf_dfo2deilivery').empty();

                    $('#th_dfo2deilivery').append(headerFooter);
                    $('#tf_dfo2deilivery').append(headerFooter);

                    var titles = new Array();
                    titles.push({ "sTitle": "Raison sociale" });
                    titles.push({ "sTitle": "Code de livraison" });
                    titles.push({ "sTitle": "Nom de l'affaire" });

                    var displaycount = 1;
                    $.each(data2Treat, function(name, value) {
                        var dataArray = new Array();
                        dataArray.push("<span  onclick='viewDfo(\"" + value.FId + "\")' style='cursor:pointer'>" + value.ClientCompanyName+ "</span>");
                        dataArray.push("<span  onclick='viewDfo(\"" + value.FId + "\")' style='cursor:pointer'>" + value.DfoCode + "</span>");
                        dataArray.push(value.PrjName);
                        try {
                            $('#db_dfo2deilivery').dataTable().fnAddData(dataArray);
                        } catch (e) {
                            var test = '';
                        }
                        displaycount++;
                    });


                    if (hasSet_dfo2deilivery) {
                        try {
                            $('#db_dfo2deilivery').dataTable({
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
                        if (!hasSet_dfo2deilivery) {
                            hasSet_dfo2deilivery = true;
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
        error: function(data) {
            var test = '';
            myApp.hidePleaseWait();
        }
    });
    return false;
    
}

function viewDfo(fId,newpage) {
    myApp.showPleaseWait();
    var url = 'Views/DeliveryForm/DeliveryForm.aspx?dfoId=' + fId + "&mode=view";
    openPage(url,newpage);
    return false;
}

function getDfoNoInvoice() {
    try {
        _getDfoNoInvoice();
    } catch (e) {

    }
    return false;
}
var hasSet_dfonoinvoice = false;
function _getDfoNoInvoice() {  
myApp.showPleaseWait();
    var url = window.webservicePath + "/GetDeliveryNoInvoice";
    $.ajax({
        type: "POST",
        url: url,
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        success: function(data) {
            var jsdata = data.d;
            var data2Treat = jQuery.parseJSON(jsdata);
            if (data2Treat !== '-1') {
                var itemName = 'dfonoinvoice';
                var db_name = 'db_' + itemName;
                var th_name = 'th_' + itemName;
                var tb_name = 'tb_' + itemName;
                var tf_name = 'tf_' + itemName;
                var div_name = 'div_'+ itemName;
                var result_name = 'result_'+ itemName;
                var headerFooter = "<tr>" +
                    "<th>Raison sociale</th>" +
                    "<th>Code de livraison</th>" +
                    "<th>Nom de l'affaire</th>" +
                    "</tr>";

                try {
                    $('#'+db_name).remove();
                    var datatableContent = "<table id='"+db_name+"' cellpadding='0' cellspacing='0' border='0' class='datatable table table-striped table-bordered table-hover'>" +
                        "<thead id='"+th_name+"'>" +
                        headerFooter +
                        "</thead>" +
                        "<tbody id='"+tb_name+"'></tbody>" +
                        "<tfoot id='"+tf_name+"'>" +
                        headerFooter +
                        "</tfoot>" +
                        "</table>";
                    $('#'+div_name).html(datatableContent);

                } catch (e) {
                    var test = '';
                }
                var resultcount = data2Treat.length;
                $('#'+result_name).text(resultcount);
                if (resultcount > 0) {
                    //                    $('#mask_processing').text(resultcount + ' resultats ...');
                    //                    $('#mask_processing').val(resultcount + ' resultats ...');

                    $('#'+th_name).empty();
                    $('#'+tf_name).empty();

                    $('#'+th_name).append(headerFooter);
                    $('#'+tf_name).append(headerFooter);

                    var titles = new Array();
                    titles.push({ "sTitle": "Raison sociale" });
                    titles.push({ "sTitle": "Code de livraison" });
                    titles.push({ "sTitle": "Nom de l'affaire" });

                    var displaycount = 1;
                    $.each(data2Treat, function(name, value) {
                        var dataArray = new Array();
                        dataArray.push("<span  onclick='viewDfo(\"" + value.FId + "\")' style='cursor:pointer'>" + value.ClientCompanyName + "</span>");
                        dataArray.push("<span  onclick='viewDfo(\"" + value.FId + "\")' style='cursor:pointer'>" + value.DfoCode + "</span>");
                        dataArray.push(value.PrjName);
                        try {
                            $('#'+db_name).dataTable().fnAddData(dataArray);
                        } catch (e) {
                            var test = '';
                        }
                        displaycount++;
                    });


                    if (hasSet_dfonoinvoice) {
                        try {
                            $('#'+db_name).dataTable({
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
                        if (!hasSet_dfonoinvoice) {
                            hasSet_dfonoinvoice = true;
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
        error: function(data) {
            var test = '';
            myApp.hidePleaseWait();
        }
    });
    return false;
    
}
/////// delivery form

/////// client invoice no paid
function getCinNoPaid() {
    try {
        _getCinNoPaid();
    } catch (e) {

    }
    return false;
}
var hasSet_CinNoPaid = false;
function _getCinNoPaid() {  
myApp.showPleaseWait();
    var url = window.webservicePath + "/GetClientInvoiceToPay";
    $.ajax({
        type: "POST",
        url: url,
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        success: function(data) {
            var jsdata = data.d;
            var data2Treat = jQuery.parseJSON(jsdata);
            if (data2Treat !== '-1') {
                var itemName = 'cin_no_paid';
                var db_name = 'db_' + itemName;
                var th_name = 'th_' + itemName;
                var tb_name = 'tb_' + itemName;
                var tf_name = 'tf_' + itemName;
                var div_name = 'div_'+ itemName;
                var result_name = 'result_'+ itemName;
                var headerFooter = "<tr>" +
                    "<th>Client</th>" +
                    "<th>Code</th>" +
                    "<th>Rest à payer</th>" +
                    "<th>Date d'échance</th>" +
                    "</tr>";

                try {
                    $('#'+db_name).remove();
                    var datatableContent = "<table id='"+db_name+"' cellpadding='0' cellspacing='0' border='0' class='datatable table table-striped table-bordered table-hover'>" +
                        "<thead id='"+th_name+"'>" +
                        headerFooter +
                        "</thead>" +
                        "<tbody id='"+tb_name+"'></tbody>" +
                        "<tfoot id='"+tf_name+"'>" +
                        headerFooter +
                        "</tfoot>" +
                        "</table>";
                    $('#'+div_name).html(datatableContent);

                } catch (e) {
                    var test = '';
                }
                var resultcount = data2Treat.length;
                $('#'+result_name).text(resultcount);
                if (resultcount > 0) {
                    //                    $('#mask_processing').text(resultcount + ' resultats ...');
                    //                    $('#mask_processing').val(resultcount + ' resultats ...');

                    $('#'+th_name).empty();
                    $('#'+tf_name).empty();

                    $('#'+th_name).append(headerFooter);
                    $('#'+tf_name).append(headerFooter);

                    var titles = new Array();
                    titles.push({ "sTitle": "Client" });
                    titles.push({ "sTitle": "Code" });
                    titles.push({ "sTitle": "RestToPayer" });
                    titles.push({ "sTitle": "TermDate" });

                    var displaycount = 1;
                    $.each(data2Treat, function(name, value) {
                        var dataArray = new Array();
                        dataArray.push("<span  onclick='viewCin(\"" + value.FId + "\")' style='cursor:pointer'>" + value.ClientCompanyName + "</span>");
                        dataArray.push("<span  onclick='viewCin(\"" + value.FId + "\")' style='cursor:pointer'>" +value.CinCode + "</span>");
                        dataArray.push(ReplaceNumberWithCommas(value.CinRestToPay));
                        dataArray.push(getDateString(value.CinDTerm));

                        try {
                            $('#'+db_name).dataTable().fnAddData(dataArray);
                        } catch (e) {
                            var test = '';
                        }
                        displaycount++;
                    });


                    if (hasSet_CinNoPaid) {
                        try {
                            $('#'+db_name).dataTable({
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
                        if (!hasSet_CinNoPaid) {
                            hasSet_CinNoPaid = true;
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
        error: function(data) {
            var test = '';
            myApp.hidePleaseWait();
        }
    });
    return false;
    
}

function viewCin(fId,newpage) {
    myApp.showPleaseWait();
    var url = 'Views/ClientInvoice/ClientInvoice.aspx?cinId=' + fId + "&mode=view";
    openPage(url,newpage);
    return false;
}

/////// client invoice no paid


function openPage(url, newpage) {
    if (newpage) {
        myApp.hidePleaseWait();
        var win = window.open(url, '_black');
        win.focus();
    } else {
        document.location = url;
    }
}

/////// supplier invoice no paid
function getSinNoPaid() {
    try {
        _getSinNoPaid();
    } catch (e) {

    }
    return false;
}
var hasSet_SinNoPaid = false;
function _getSinNoPaid() {  
myApp.showPleaseWait();
    var url = window.webservicePath + "/GetSupplierInvoiceNoPaid";
    $.ajax({
        type: "POST",
        url: url,
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        success: function(data) {
            var jsdata = data.d;
            var data2Treat = jQuery.parseJSON(jsdata);
            if (data2Treat !== '-1') {
                var itemName = 'sin_no_paid';
                var db_name = 'db_' + itemName;
                var th_name = 'th_' + itemName;
                var tb_name = 'tb_' + itemName;
                var tf_name = 'tf_' + itemName;
                var div_name = 'div_'+ itemName;
                var result_name = 'result_'+ itemName;
                var headerFooter = "<tr>" +
                    "<th>Fournisseur</th>" +
                    "<th>Code</th>" +
                    "<th>Montant TTC</th>" +
                    "</tr>";

                try {
                    $('#'+db_name).remove();
                    var datatableContent = "<table id='"+db_name+"' cellpadding='0' cellspacing='0' border='0' class='datatable table table-striped table-bordered table-hover'>" +
                        "<thead id='"+th_name+"'>" +
                        headerFooter +
                        "</thead>" +
                        "<tbody id='"+tb_name+"'></tbody>" +
                        "<tfoot id='"+tf_name+"'>" +
                        headerFooter +
                        "</tfoot>" +
                        "</table>";
                    $('#'+div_name).html(datatableContent);

                } catch (e) {
                    var test = '';
                }
                var resultcount = data2Treat.length;
                $('#'+result_name).text(resultcount);
                if (resultcount > 0) {
                    $('#'+th_name).empty();
                    $('#'+tf_name).empty();

                    $('#'+th_name).append(headerFooter);
                    $('#'+tf_name).append(headerFooter);

                    var titles = new Array();
                    titles.push({ "sTitle": "Supplier" });
                    titles.push({ "sTitle": "Code" });
                    titles.push({ "sTitle": "AmountTTC" });

                    var displaycount = 1;
                    $.each(data2Treat, function(name, value) {
                        var dataArray = new Array();
                        dataArray.push("<span  onclick='viewSin(\"" + value.SinFId + "\")' style='cursor:pointer'>" + value.OneSupplier.CompanyName + "</span>");
                        dataArray.push("<span  onclick='viewSin(\"" + value.SinFId + "\")' style='cursor:pointer'>" + value.SinCode+ "</span>");
                        dataArray.push(ReplaceNumberWithCommas(value.TotalAmountTtc));
                        try {
                            $('#'+db_name).dataTable().fnAddData(dataArray);
                        } catch (e) {
                            var test = '';
                        }
                        displaycount++;
                    });


                    if (hasSet_SinNoPaid) {
                        try {
                            $('#'+db_name).dataTable({
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
                        if (!hasSet_SinNoPaid) {
                            hasSet_SinNoPaid = true;
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
        error: function(data) {
            var test = '';
            myApp.hidePleaseWait();
        }
    });
    return false;
    
}
function viewSin(fId,newpage) {
    myApp.showPleaseWait();
    var url = 'Views/SupplierInvoice/SupplierInvoice.aspx?sinId=' + fId + "&mode=view";
    openPage(url,newpage);
    return false;
}
/////// supplier invoice no paid


/////// container No Sent
function getLgsNoSent() {
    try {
        _getLgsNoSent();
    } catch (e) {

    }
    return false;
}
var hasSet_LgsNoSent = false;
function _getLgsNoSent() {  
    myApp.showPleaseWait();
    var url = window.webservicePath + "/GetLogisticssNoSent";
    $.ajax({
        type: "POST",
        url: url,
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        success: function(data) {
            var jsdata = data.d;
            var data2Treat = jQuery.parseJSON(jsdata);
            if (data2Treat !== '-1') {
                var itemName = 'lgs_no_sent';
                var db_name = 'db_' + itemName;
                var th_name = 'th_' + itemName;
                var tb_name = 'tb_' + itemName;
                var tf_name = 'tf_' + itemName;
                var div_name = 'div_'+ itemName;
                var result_name = 'result_'+ itemName;
                var headerFooter = "<tr>" +
                    "<th>Transporteur</th>" +
                    "<th>Code</th>" +
                    "<th>Date de Création</th>" +
                    "</tr>";

                try {
                    $('#'+db_name).remove();
                    var datatableContent = "<table id='"+db_name+"' cellpadding='0' cellspacing='0' border='0' class='datatable table table-striped table-bordered table-hover'>" +
                        "<thead id='"+th_name+"'>" +
                        headerFooter +
                        "</thead>" +
                        "<tbody id='"+tb_name+"'></tbody>" +
                        "<tfoot id='"+tf_name+"'>" +
                        headerFooter +
                        "</tfoot>" +
                        "</table>";
                    $('#'+div_name).html(datatableContent);

                } catch (e) {
                    var test = '';
                }
                var resultcount = data2Treat.length;
                $('#'+result_name).text(resultcount);
                if (resultcount > 0) {
                    $('#'+th_name).empty();
                    $('#'+tf_name).empty();

                    $('#'+th_name).append(headerFooter);
                    $('#'+tf_name).append(headerFooter);

                    var titles = new Array();
                    titles.push({ "sTitle": "Supplier" });
                    titles.push({ "sTitle": "Code" });
                    titles.push({ "sTitle": "CreationDate" });

                    var displaycount = 1;
                    $.each(data2Treat, function(name, value) {
                        var dataArray = new Array();
                        dataArray.push("<span  onclick='viewLgs(\"" + value.FId + "\")' style='cursor:pointer'>" + value.Supplier.CompanyName + "</span>");
                        dataArray.push("<span  onclick='viewLgs(\"" + value.FId + "\")' style='cursor:pointer'>" +value.LgsCode + "</span>");
                        dataArray.push(getDateString(value.DateCreation));
                        try {
                            $('#'+db_name).dataTable().fnAddData(dataArray);
                        } catch (e) {
                            var test = '';
                        }
                        displaycount++;
                    });
                    if (hasSet_LgsNoSent) {
                        try {
                            $('#'+db_name).dataTable({
                                "sPaginationType": "bs_full",
                                "bDestroy": true,
                                "bRetrieve": true,
                                "bServerSide": true,
                                "bProcesLgsg": true,
                                "aoColumns": titles
                            });

                        } catch (e) {
                            var testestst = "";
                        }
                    }


                    try {
                        if (!hasSet_LgsNoSent) {
                            hasSet_LgsNoSent = true;
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
        error: function(data) {
            var test = '';
            myApp.hidePleaseWait();
        }
    });
    return false;
    
}
function viewLgs(fId,newpage) {
    myApp.showPleaseWait();
    var url = 'Views/Logistics/Logistics.aspx?lgsId=' + fId + "&mode=view";
    openPage(url,newpage);
    return false;
}
/////// container No sent

/////// container Arriving
function getLgsArriving() {
    try {
        _getLgsArriving();
    } catch (e) {

    }
    return false;
}
var hasSet_LgsArriving = false;
function _getLgsArriving() {  
myApp.showPleaseWait();
    var url = window.webservicePath + "/GetLogisticssArriving";
    $.ajax({
        type: "POST",
        url: url,
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        success: function(data) {
            var jsdata = data.d;
            var data2Treat = jQuery.parseJSON(jsdata);
            if (data2Treat !== '-1') {
                var itemName = 'lgs_arriving';
                var db_name = 'db_' + itemName;
                var th_name = 'th_' + itemName;
                var tb_name = 'tb_' + itemName;
                var tf_name = 'tf_' + itemName;
                var div_name = 'div_'+ itemName;
                var result_name = 'result_'+ itemName;
                var headerFooter = "<tr>" +
                    "<th>Transporteur</th>" +
                    "<th>Code</th>" +
                    "<th>Date d'expédié</th>" +
                    "<th>Date d'arrive prévu</th>" +
                    "</tr>";

                try {
                    $('#'+db_name).remove();
                    var datatableContent = "<table id='"+db_name+"' cellpadding='0' cellspacing='0' border='0' class='datatable table table-striped table-bordered table-hover'>" +
                        "<thead id='"+th_name+"'>" +
                        headerFooter +
                        "</thead>" +
                        "<tbody id='"+tb_name+"'></tbody>" +
                        "<tfoot id='"+tf_name+"'>" +
                        headerFooter +
                        "</tfoot>" +
                        "</table>";
                    $('#'+div_name).html(datatableContent);

                } catch (e) {
                    var test = '';
                }
                var resultcount = data2Treat.length;
                $('#'+result_name).text(resultcount);
                if (resultcount > 0) {
                    $('#'+th_name).empty();
                    $('#'+tf_name).empty();

                    $('#'+th_name).append(headerFooter);
                    $('#'+tf_name).append(headerFooter);

                    var titles = new Array();
                    titles.push({ "sTitle": "Supplier" });
                    titles.push({ "sTitle": "Code" });
                    titles.push({ "sTitle": "SendDate" });
                    titles.push({ "sTitle": "ArriveDatePre" });

                    var displaycount = 1;
                    $.each(data2Treat, function(name, value) {
                        var dataArray = new Array();
                        dataArray.push("<span  onclick='viewLgs(\"" + value.FId + "\")' style='cursor:pointer'>" + value.Supplier.CompanyName + "</span>");
                        dataArray.push("<span  onclick='viewLgs(\"" + value.FId + "\")' style='cursor:pointer'>" + value.LgsCode + "</span>");
                        dataArray.push(getDateString(value.LgsDateSend));
                        dataArray.push(getDateString(value.LgsDateArrivePre));
                        try {
                            $('#'+db_name).dataTable().fnAddData(dataArray);
                        } catch (e) {
                            var test = '';
                        }
                        displaycount++;
                    });


                    if (hasSet_LgsArriving) {
                        try {
                            $('#'+db_name).dataTable({
                                "sPaginationType": "bs_full",
                                "bDestroy": true,
                                "bRetrieve": true,
                                "bServerSide": true,
                                "bProcesLgsg": true,
                                "aoColumns": titles
                            });

                        } catch (e) {
                            var testestst = "";
                        }
                    }


                    try {
                        if (!hasSet_LgsArriving) {
                            hasSet_LgsArriving = true;
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
        error: function(data) {
            var test = '';
            myApp.hidePleaseWait();
        }
    });
    return false;
}
/////// container Arriving


/////// get order not all deliveried
function getCodNotAllDeliveried() {
    try {
        _getCodNotAllDeliveried();
    } catch (e) {

    }
    return false;
}

var hasSet_CodNotAllDeliveried = false;

function _getCodNotAllDeliveried() {
    myApp.showPleaseWait();
    var url = window.webservicePath + "/GetClientOrdersNotCompleteDeliveried";
    $.ajax({
        type: "POST",
        url: url,
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        success: function(data) {
            var jsdata = data.d;
            var data2Treat = jQuery.parseJSON(jsdata);
            if (data2Treat !== '-1') {
                var itemName = 'codnotalldlv';
                var db_name = 'db_' + itemName;
                var th_name = 'th_' + itemName;
                var tb_name = 'tb_' + itemName;
                var tf_name = 'tf_' + itemName;
                var div_name = 'div_' + itemName;
                var result_name = 'result_' + itemName;
                var headerFooter = "<tr>" +
                    "<th>Client (Consulter la commande)</th>" +
                    "<th>Nom de Commande (Créer BL)</th>" +
                    "<th>Code de Commande</th>" +
                    "<th>Produit</th>" +
                    "<th>Quantié Total</th>" +
                    "<th>Quantié À LIVRÉ</th>" +
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
                $('#' + result_name).text(resultcount);
                if (resultcount > 0) {
                    $('#' + th_name).empty();
                    $('#' + tf_name).empty();

                    $('#' + th_name).append(headerFooter);
                    $('#' + tf_name).append(headerFooter);

                    var titles = new Array();
                    titles.push({ "sTitle": "Client" });
                    titles.push({ "sTitle": "OrderName" });
                    titles.push({ "sTitle": "OrderCode" });
                    titles.push({ "sTitle": "Produit" });
                    titles.push({ "sTitle": "TotalQuantity" });
                    titles.push({ "sTitle": "QuantityToDelivery" });

                    var displaycount = 1;
                    $.each(data2Treat, function(name, value) {
                        var dataArray = new Array();
                        dataArray.push("<div style='cursor: pointer' onclick='viewCod(\"" + value.FId + "\")' title='Consulter la commande'>" + value.ClientCompanyName + "</div>");
                        dataArray.push("<div style='cursor: pointer' onclick='createDfo(\"" + value.FId + "\")' title='Créer le bon de livraison'>" + value.CodName+ "</div>");
                        dataArray.push(value.CodCode);
                        var produit = value.PitName ? value.PitName : value.PrdName;
                        dataArray.push(produit);
                        dataArray.push("<div style='width: 100%; text-align:right;'><span>" + value.ColQuantity + "</span></div>");
                        dataArray.push("<div style='width: 100%; text-align:right;'><span>" + value.ColQuantityToDelivery + "</span></div>");
                        try {
                            $('#' + db_name).dataTable().fnAddData(dataArray);
                        } catch (e) {
                            var test = '';
                        }
                        displaycount++;
                    });


                    if (hasSet_CodNotAllDeliveried) {
                        try {
                            $('#' + db_name).dataTable({
                                "sPaginationType": "bs_full",
                                "bDestroy": true,
                                "bRetrieve": true,
                                "bServerSide": true,
                                "bProcesLgsg": true,
                                "aoColumns": titles
                            });

                        } catch (e) {
                            var testestst = "";
                        }
                    }


                    try {
                        if (!hasSet_CodNotAllDeliveried) {
                            hasSet_CodNotAllDeliveried = true;
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
        error: function(data) {
            var test = '';
            myApp.hidePleaseWait();
        }
    });
    return false;
}

function viewCod(fId, newpage) {
    myApp.showPleaseWait();
    var url = 'Views/ClientOrder/ClientOrder.aspx?codId=' + fId + "&mode=view";
    openPage(url, newpage);
    return false;
}


function createDfo(codId) {
    var url = 'Views/DeliveryForm/DeliveryForm.aspx?codId=' + codId + "&mode=create";
    document.location = url;
    return false;
}
/////// get order not all deliveried