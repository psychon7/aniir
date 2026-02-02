$(document).ready(initAll);

function initAll() {
 //   ShowPleaseWait();
    js_getAllCurrencySup('CurId');
    js_getAllTVASup('VatId');
    //getSodCinCoef();
    getAllTVA();
//    $.when(_getCom(dtdGetCommercial)).done(function() {
//        $.when(_getClient(dtdGetclient)).done(function() {





//            if (allclient.length > 0) {
//                $.each(allclient, function(name, value) {
//                    $('#CliId').append($("<option></option>").attr("value", value.Id).attr("data-value", value.FId).text(value.CompanyName));
//                });
//            }
            var sodId = getUrlVars()['sodId'];
            if (sodId) {
                //LoadSupplier(true);
                LoadSupplierOrder();
            } 
//            else {
//                //LoadSupplier();
//            }

            if (sodId && _isView) {
                loadAllLines();
            }

            $.each($('.datepicker'), function(idx, value) {
                $(value).datepicker();
            });
            initMode();
            //setClickableLabel();
//            if (_isCreate) {
//                $('#DateCreation').val(getToday());
//            }
            // set commercial
//            $('#UsrComId').append($("<option>Sélectionner un commercial</option>").attr("value", "0"));
//            $.each(allCommercials, function(order, oneCom) {
//                $('#UsrComId').append($("<option>" + oneCom.FullName + "</option>").attr("value", oneCom.Id).attr("selected", true));
//            });

            var mode = getParameterByName('mode');
            if (mode === 'view') {
                $('#sod_generalinfo').removeClass('col-md-6');
                $('#div_delivery_address').removeClass('col-md-6');
                $('#sod_generalinfo').addClass('col-md-5');
                $('#div_delivery_address').addClass('col-md-5');
            }

//            if ((typeof mode === "undefined") || mode === 'create' || mode === '' || mode === 'modify' ) {
//                setAutoCompleteSup();
//            }

//            if (!jQuery.isEmptyObject(connectedUser) && connectedUser.LoginMode === 1) {
//                $('#DateCreation').prop("disabled", false);
//            }





//        });
//    });
}


function js_getAllCurrencySup(elementId) {
    var url = window.webservicePath + "/GetAllCurrencySup";
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


function js_getAllTVASup(elementId, objname) {
    var url = window.webservicePath + "/GetAllTVASup";
    var budgetId = '#' + elementId;
    GeneralAjax_Select(url, budgetId, objname);
}

function SodMode1Fileds() {
    // 20201023 取消此功能，sub supplier 始终显示
//   if (connectedUser.LoginMode === 1) {
//        $('#div_subSup').show();
//    } else {
//        $('#div_subSup').hide();
//    }
}

var sprlist = [];

function loadSodPayementInfo() {
    var sodId = getUrlVars()['sodId'];
    sprlist = [];
    if (sodId) {
        var url = window.webservicePath + "/GetSodPaymentsListSup";
        var datastr = "{sodId:'" + sodId + "'}";
        $.ajax({
            type: "POST",
            url: url,
            contentType: "application/json; charset=utf-8",
            data: datastr,
            dataType: "json",
            success: function(data) {
                var jsdata = data.d;
                var data2Treat = jQuery.parseJSON(jsdata);
                if (data2Treat !== '-1') {
                    var sprs = data2Treat;
                    sprlist = data2Treat;
                    try {
//                        $('#sod_payment_records').empty();
//                        var title = "<div class='form-group'>" +
//                            "<label class='col-sm-3 control-label' style='text-align:center'>Fichier</label>" +
//                            "<label class='col-sm-2 control-label' style='text-align:center'>Date</label>" +
//                            "<label class='col-sm-2 control-label' style='text-align:center'>Cmt</label>" +
//                            "<label class='col-sm-2 control-label' style='text-align:center'>Payeur</label>" +
//                            "<label class='col-sm-3 control-label' style='text-align:center'>Mnt</label>" +
//                            "</div>";
//                        $('#sod_payment_records').append(title);

                        $.each(sprs, function(name, value) {
                            if (value.Key == 0 && value.Key2 == 0) {
                                //console.log(value);
                                $('#Sod_Amount').text(value.DcValue2.toFixed(3) + ' ' + value.Value);
                                $('#Sod_TotalAmountHt').text(value.DcValue.toFixed(3) + ' ' + value.Value);
                                $('#Sod_Paid').text(value.DcValue4.toFixed(3) + ' ' + value.Value);
                                $('#Sod_LeftToPayer').text(value.DcValue3.toFixed(3) + ' ' + value.Value);
                            } else {
//                                var btnview = (value.Value2 != null && value.Value2.length > 0) ? "<button  class='btn btn-inverse' sprid=" + value.Key + " onclick='return viewSprFile(this)'><i class='fa fa-search-plus'></i></button>" : "";
//                                var btnUpdate = "<button class='btn btn-inverse' sprid=" + value.Key + " onclick='return PaySod(this," + value.DcValue + ")'><i class='fa fa-pencil-square-o'></i></button>";
//                                var btnDelete = (value.Value2 != null && value.Value2.length > 0) ? "<button  class='btn btn-inverse' sprid=" + value.Key + " onclick='return deleteSprFile(this)'><i class='fa fa-times'></i></button>" : "";
//                                var oneContent = "<div class='form-group' style='text-align:center'>" +
//                                    "<div class='col-sm-3'>" + btnview + btnUpdate + btnDelete +
//                                    "</div>" +
//                                    "<label class='col-sm-2 control-label'>" + getDateString(value.DValue2) + "</label>" +
//                                    "<label class='col-sm-2 control-label'>" + value.Value + "</label>" +
//                                    "<label class='col-sm-2 control-label'>" + value.KeyStr1 + "</label>" +
//                                    "<label class='col-sm-3 control-label' style='color:green;'>" + value.DcValue.toFixed(3).toLocaleString() + "</label>" +
//                                    "</div>";
//                                $('#sod_payment_records').append(oneContent);
                            }
                        });
                    } catch (e) {

                    }
                } else {
                    // authentication error
                    AuthencationError();
                }
            },
            error: function(data) {
                var test = '';
            }
        });
    }
}

function viewSprFile(sender) {
    var sodId = getUrlVars()['sodId'];
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

function PaySod(sender,amount) {
    var sprid = $(sender).attr('sprid') * 1;
    var onespr = searchInArray(sprlist, 'Key', sprid)[0];
    var startBox = "<div class='box'><div class='box-body'>";
    var endBox = "</div></div>";
    var dpayment = '';
    var comment = '';
    var payer = '';
    var hasvalue = false;
    if (onespr && sprid!=0) {
        amount = onespr.DcValue;
        dpayment = getDateString(onespr.DValue2);
        comment = onespr.Value;
        hasvalue = true;
        payer = onespr.KeyStr1;
    }
    var onelineContent =
        // start box
        "<div class='form-group' id='div_one_line'>" +
            "<div class='row'>" +
            "<div class='col-md-12'>" +
            "<div class='box-body'>" +
            "<div class='form-horizontal'>" +
            "<div class='form-group'><label class='col-sm-12' style='text-align:center'>Veuillez complèter les information de paiement</label></div>" +
            "<div class='form-group'>" +
            "<label class='col-sm-2 control-label'>Montant</label>" +
            "<div class='col-sm-10'><input type='number' id='SodAmount' class='form-control' value=" + amount + " /></div>" +
            "</div>" +
            // new line
            "<div class='form-group'>" +
            "<label class='col-sm-2 control-label'>Date de paiement</label>" +
            "<div class='col-sm-10'><input type='text' id='SodDate' class='form-control datepicker' value='" + dpayment + "' /></div>" +
            "</div>" +
            // new line
            "<div class='form-group'>" +
            "<label class='col-sm-2 control-label'>Le payeur 支付人</label>" +
            "<div class='col-sm-10'><input type='text' id='SprPayer' class='form-control' value='" + payer + "' /></div>" +
            "</div>" +
            // new line
            "<div class='form-group'>" +
            "<label class='col-sm-2 control-label'>Commentaire</label>" +
            "<div class='col-sm-10'><textarea row='3' id='SodComment' class='form-control' ></textarea></div>" +
            "</div>" +
            "<div class='form-group'>" +
            "<div class='col-sm-12'></div>" +
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
            "</div></div></form>" +
            "</div>" +
            // close box
            "</div></div></div></div></div>";

    var btnAddUpdate = "<button class='btn btn-inverse' id='btn_add_update_discount' name='btn_add_update_discount' sprid='" + sprid + "' onclick='return SaveSodPayment(this)'><span>Sauvegarder</span></button>";
    var btnClose = "<button class='btn btn-default bootbox-close-button' id='btn_close_cin_payment' onclick='return false'><span>Annuler</span></button>";

    var btns = "<div class='modal-body center'>" + btnClose + btnAddUpdate + "</div>";
    var onecontent = startBox + onelineContent + btns + endBox;

    var title = 'PAIEMENT';
    bootbox.dialog({
        title: title,
        message: onecontent
    }).find('.modal-dialog').css({
        'width': '30%'
    }).find('.modal-content').css({
        'margin-top': function () {
            var w = $(window).height();
            var b = $(".modal-dialog").height();
            // should not be (w-h)/2
            var h = (w - b) * 0.15;
            return h + "px";
        }
    }).find('.modal-header').css({
        'background': 'url(../../img/menu_005_bg.jpg) repeat-x',
        'text-align': 'center',
        'color': '#C0C0C0'
    });

    $('#SodDate').datepicker();
    if (hasvalue) {
        $('#SodComment').text(comment);
        $('#SodDate').val(dpayment);
    } else {
        $('#SodDate').val(getToday());
    }

    return false;
}

function deleteSprFile(sender) {
    var sprid = $(sender).attr('sprid');
       var msg = "Veuillez confirmer la suppresion de FICHIER<br/>请确认是否删除!";
    var title = "CONFIRMATION";
    var content = "<div class='box'><div class='box-body' style='height: 100px;'>" +
        "<div class='form-horizontal'>" +
        "<div class='col-md-12'>" +
        "<div class='form-group'>" +
        "<div class='col-sm-12' style='text-align:center;font-size: 18pt;'>" + msg + "</div></div></div></div></div></div>"
        + "<div class='modal-footer center'>" +
        "<button type='button' class='btn btn-default' onclick='closeDialog()'>Annuler</button>" +
        "<button type='button' class='btn btn-inverse' sprid='" + sprid + "' onclick='deleteSprFileClick(this)'>SUPPRIMER</button>" +
        "</div>";
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

function deleteSprFileClick(sender) {
    var sprid = $(sender).attr('sprid') *1 ;
    var sodId = getUrlVars()['sodId'];
    if (sodId) {
        var url = window.webservicePath + "/DeleteSprFile";
        var datastr = "{sodId:'" + sodId + "',sprId:" + sprid + "}";
        $.ajax({
            type: "POST",
            url: url,
            contentType: "application/json; charset=utf-8",
            data: datastr,
            dataType: "json",
            success: function (data) {
                loadSodPayementInfo();
            },
            error: function (data) {
                loadSodPayementInfo();
            }
        });
    }
    closeDialog();
    return false;
}

function SaveSodPayment(sender) {

    ShowPleaseWait();
    var checkAmount = $('#SodAmount').val().replace(' ', '').replace(',', '.') * 1;
    var comment = $('#SodComment').val();
    var soddate = $('#SodDate').val();
    var sprId = $(sender).attr('sprid') * 1;
    var sodId = getUrlVars()['sodId'];
    var sprPayer = $('#SprPayer').val();

    if ($.isNumeric(checkAmount) || !IsNullOrEmpty(soddate)) {
        var sodPayment = [];
        var onespr = {
            Key: 0,
            DcValue: checkAmount,
            Key2: sprId,
            Value: comment,
            Value4: sodId,
            Value3: soddate,
            KeyStr1: sprPayer
        };
        sodPayment.push(onespr);
        if (sodId) {
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
                        $.each(data2Treat, function(name, value) {
                            sprIds += value + ",";
                        });
                        uploadPaymentFileClick(sprIds);
                        //js_search();
                    },
                    error: function(data) {
                        HidePleaseWait();
                        alert(data.responseText);
                    }
                });
            }
        }
    } else {
        if (!$.isNumeric(checkAmount)) {
            $('#SodAmount').addClass('error_border');
            $('#SodAmount').focus();
        } else {
            $('#SodAmount').removeClass('error_border');
        }
        if (IsNullOrEmpty(soddate)) {
            $('#SodDate').addClass('error_border');
            $('#SodDate').focus();
        } else {
            $('#SodDate').removeClass('error_border');
        }
        HidePleaseWait();
    }
    return false;
}

function uploadPaymentFileClick(sprIds) {
    ShowPleaseWait();
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
                    HidePleaseWait();
                    $('#btn_close_cin_payment').click();
                    $('#btn_savepmt_cancel').click();
                    loadSodPayementInfo();
                },
                error: function (e) {
                    //errorHandler
                    HidePleaseWait();
                    $('#btn_close_cin_payment').click();
                    $('#btn_savepmt_cancel').click();
                    loadSodPayementInfo();
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
                    HidePleaseWait();
        $('#btn_close_cin_payment').click();
                    loadSodPayementInfo();
        //loadCinPayementInfo();
    }
}

// Begin Sdc

var sdclist = [];
function loadSodDocInfo() {
    var sodId = getUrlVars()['sodId'];
    sdclist = [];
    if (sodId) {
        var url = window.webservicePath + "/GetSodDocListForSup";
        var datastr = "{sodId:'" + sodId + "'}";
        $.ajax({
            type: "POST",
            url: url,
            contentType: "application/json; charset=utf-8",
            data: datastr,
            dataType: "json",
            success: function(data) {
                var jsdata = data.d;
                var data2Treat = jQuery.parseJSON(jsdata);
                if (data2Treat !== '-1') {
                    var sprs = data2Treat;
                    sdclist = data2Treat;
                    try {
                        $('#sod_docs').empty();
                        var title = "<div class='form-group'>" +
                            "<label class='col-sm-4 control-label' style='text-align:center'>Fichier</label>" +
                            "<label class='col-sm-2 control-label' style='text-align:center'>Date</label>" +
                            "<label class='col-sm-6 control-label' style='text-align:center'>Commentaire</label>" +
                            "</div>";
                        $('#sod_docs').append(title);

                        $.each(sprs, function(name, value) {
                            var comment = replaceAll(value.Value,"'","&apos;");
                            comment = replaceAll(comment ,"\"","&quot;");
                            var btnview = (value.Value2 != null && value.Value2.length > 0) ? "<button class='btn btn-inverse' sdcid=" + value.Key + " comment='" + comment + "' onclick='return viewSdcFile(this)'><i class='fa fa-search-plus'></i></button>" : "";
                            var oneContent = "<div class='form-group' style='text-align:center'>" +
                                "<div class='col-sm-4'>" + btnview + 
                                "</div>" +
                                "<label class='col-sm-2 control-label'>" + getDateString(value.DValue2) + "</label>" +
                                "<label class='col-sm-6 control-label'>" + value.Value + "</label>" +
                                "</div>";
                            $('#sod_docs').append(oneContent);
                        });
                    } catch (e) {

                    }
                } else {
                    // authentication error
                    AuthencationError();
                }
            },
            error: function(data) {
                var test = '';
            }
        });
    }
}

function AddSodDoc(sender) {
    var sdcid = $(sender).attr('sdcid') * 1;
    var onespr = searchInArray(sdclist, 'Key', sdcid)[0];
    var startBox = "<div class='box'><div class='box-body'>";
    var endBox = "</div></div>";
    var dpayment = '';
    var comment = '';
    var hasvalue = false;
    if (onespr && sdcid != 0) {
        dpayment = getDateString(onespr.DValue2);
        comment = onespr.Value;
        hasvalue = true;
    }
    var onelineContent =
        // start box
        "<div class='form-group' id='div_one_line'>" +
            "<div class='row'>" +
            "<div class='col-md-12'>" +
            "<div class='box-body'>" +
            "<div class='form-horizontal'>" +
            "<div class='form-group'><label class='col-sm-12' style='text-align:center'>Veuillez complèter les information 请添加详情</label></div>" +
            // new line
            "<div class='form-group'>" +
            "<label class='col-sm-2 control-label'>Date</label>" +
            "<div class='col-sm-10'><input type='text' id='SdcDate' class='form-control datepicker' value='" + dpayment + "' /></div>" +
            "</div>" +
            // new line
            "<div class='form-group'>" +
            "<label class='col-sm-2 control-label'>Commentaire</label>" +
            "<div class='col-sm-10'><textarea row='3' id='SdcComment' class='form-control' ></textarea></div>" +
            "</div>" +
            "<div class='form-group'>" +
            "<div class='col-sm-12'></div>" +
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
            "<span>Fichier</span>" +
            "<input type='file' id='iptUploadFilePopUp' name='files[]' accept='application/pdf' onchange='getFileDataPopUp(this);'></span>" +
            "<button type='reset' class='btn btn-inverse cancel'  style='display: none;' id='btnCancelUploadFilePopUp' onclick='return hideUploadPopUp()'><i class='fa fa-ban'></i><span>Annuler</span></button>" +
            "<button class='btn btn-inverse bootbox-close-button' style='display:none;' onclick='return false'><span>Annuler</span></button></div> <!-- The global progress information -->" +
            "<div class='col-md-12' style='text-align: center; margin-bottom: 20px;'>" +
            "<div>File Name : <span id='uploadFileNamePopUp'></span></div><br/>" +
            "</div></div></form>" +
            "</div>" +

            // close box
            "</div></div></div></div></div>";

    var btnAddUpdate = "<button class='btn btn-inverse' id='btn_add_update_discount' name='btn_add_update_discount' sdcid='" + sdcid + "' onclick='return SaveSodDoc(this)'><span>Sauvegarder</span></button>";
    var btnClose = "<button class='btn btn-default bootbox-close-button' id='btn_close_cin_payment' onclick='return false'><span>Annuler</span></button>";

    var btns = "<div class='modal-body center'>" + btnClose + btnAddUpdate + "</div>";
    var onecontent = startBox + onelineContent + btns + endBox;

    var title = 'Document 文件';
    bootbox.dialog({
        title: title,
        message: onecontent
    }).find('.modal-dialog').css({
        'width': '30%'
    }).find('.modal-content').css({
        'margin-top': function() {
            var w = $(window).height();
            var b = $(".modal-dialog").height();
            // should not be (w-h)/2
            var h = (w - b) * 0.15;
            return h + "px";
        }
    }).find('.modal-header').css({
        'background': 'url(../../img/menu_005_bg.jpg) repeat-x',
        'text-align': 'center',
        'color': '#C0C0C0'
    });

    $('#SdcDate').datepicker();
    if (hasvalue) {
        $('#SdcComment').text(comment);
        $('#SdcDate').val(dpayment);
    } else {
        $('#SdcDate').val(getToday());
    }

    return false;
}

function SaveSodDoc(sender) {
    var comment = $('#SdcComment').val();
    var sdcdate = $('#SdcDate').val();
    var sdcId = $(sender).attr('sdcid') * 1;
    var sodId = getUrlVars()['sodId'];

    if (!IsNullOrEmpty(sdcdate)) {
        var sodPayment = [];
        var onespr = {
            Key: 0,
            //DcValue: 0,
            Key2: sdcId,
            Value: comment,
            Value4: sodId,
            Value3: sdcdate
        };
        sodPayment.push(onespr);
        if (sodId) {
            ShowPleaseWait();
            if (sodPayment.length) {
                var jsondata = JSON.stringify({ sodsdc: sodPayment });
                var url = window.webservicePath + "/SaveUpdateSodDoc";
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
                        $.each(data2Treat, function(name, value) {
                            sprIds += value + ",";
                        });
                        uploadSdcFileClick(sprIds);
                        //js_search();
                    },
                    error: function(data) {
                        HidePleaseWait();
                        alert(data.responseText);
                    }
                });
            }
        }
    } else {
        if (IsNullOrEmpty(sdcdate)) {
            $('#SdcDate').addClass('error_border');
            $('#SdcDate').focus();
        } else {
            $('#SdcDate').removeClass('error_border');
        }
    }
    return false;
}

function uploadSdcFileClick(sdcIds) {
    ///create a new FormData object
    var formData = new FormData(); //var formData = new FormData($('form')[0]);
    ///get the file and append it to the FormData object
    if ($('#iptUploadFilePopUp')[0].files[0]) {
        formData.append('file', $('#iptUploadFilePopUp')[0].files[0]);
        var itemId = getUrlVars()['sodId'];
        var url = "../../Services/UploadFilesGeneral.ashx?type=13&sodId=" + encodeURIComponent(itemId) + "&sdcIds=" + encodeURIComponent(sdcIds);
        if (sdcIds) {
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
                    loadSodDocInfo();
                },
                error: function (e) {
                    //errorHandler
                    $('#btn_close_cin_payment').click();
                    $('#btn_savepmt_cancel').click();
                    loadSodDocInfo();
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
                    loadSodDocInfo();
        //loadCinPayementInfo();
    }
}

function viewSdcFile(sender) {
    var sodId = getUrlVars()['sodId'];
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

    var title = $(sender).attr("comment");
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
    var sdcid = $(sender).attr('sdcid');
    var src = "../Common/PageForPDF.aspx?type=9&sodId=" + encodeURIComponent(sodId) + "&sdcId=" + encodeURIComponent(sdcid);
    $('#iframepdfForPayment').attr('src', src);
    return false;
}

function deleteSdcFile(sender) {
    var sdcid = $(sender).attr('sdcid');
    var msg = "Veuillez confirmer la suppresion de FICHIER<br/>请确认是否删除!";
    var title = "CONFIRMATION 确认";
    var content = "<div class='box'><div class='box-body' style='height: 100px;'>" +
        "<div class='form-horizontal'>" +
        "<div class='col-md-12'>" +
        "<div class='form-group'>" +
        "<div class='col-sm-12' style='text-align:center;font-size: 18pt;'>" + msg + "</div></div></div></div></div></div>"
        + "<div class='modal-footer center'>" +
        "<button type='button' class='btn btn-default' onclick='closeDialog()'>Annuler</button>" +
        "<button type='button' class='btn btn-inverse' sdcid='" + sdcid + "' onclick='deleteSdcFileClick(this)'>SUPPRIMER</button>" +
        "</div>";
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

function deleteSdcFileClick(sender) {
    var sdcid = $(sender).attr('sdcid') *1 ;
    var sodId = getUrlVars()['sodId'];
    if (sodId) {
        var url = window.webservicePath + "/DeleteSdcFile";
        var datastr = "{sodId:'" + sodId + "',sdcId:" + sdcid+ "}";
        $.ajax({
            type: "POST",
            url: url,
            contentType: "application/json; charset=utf-8",
            data: datastr,
            dataType: "json",
            success: function (data) {
                loadSodDocInfo();
            },
            error: function (data) {
                loadSodDocInfo();
            }
        });
    }
    closeDialog();
    return false;
}

// End Sdc


var contactSuppliers = [];
function SupplierChanged(sender) {
    var supId = $(sender).find('option:selected').attr('data-value');
    var sup_id =  $(sender).find('option:selected').attr('value');
    //alert(supId);
    if (supId) {
        var sodId = getUrlVars()['sodId'];
        var mode = getUrlVars()['mode'];
        var oneSup = searchFieldValueInArray(allSupplier, 'FId', supId);
        if (!jQuery.isEmptyObject(oneSup) && mode !== 'view') {
            $('#VatId').val(oneSup.VatId);
            $('#CurId').val(oneSup.CurId);
        }
        var url = window.webservicePath + "/LoadSupplierContactBySupId";
        $('#ScoId').empty();
        $.ajax({
            type: "POST",
            url: url,
            contentType: "application/json; charset=utf-8",
            data: "{supId:'" + supId + "'}",
            dataType: "json",
            success: function(data) {
                var jsdata = data.d;
                var data2Treat = jQuery.parseJSON(jsdata);
                if (data2Treat !== '-1') {
                    if (data2Treat.length > 0) {
                        contactSuppliers = [];
                        contactSuppliers = data2Treat;
                        $.each(contactSuppliers, function(index, value) {
                            if (ScoId && ScoId === value.ScoId) {
                                $('#ScoId').append($("<option></option>").attr("value", value.ScoId).attr("selected", true).text(value.ScoAdresseTitle));
                            } else {
                                $('#ScoId').append($("<option></option>").attr("value", value.ScoId).text(value.ScoAdresseTitle));
                            }
                        });
                        if (_isView) {
                            $('#ScoId').attr("disabled", "");
                        }
                        $('#ScoId').change();
                    }
                } else {
                    // authentication error
                    AuthencationError();
                }
            },
            error: function(data) {
                var test = '';
            }
        });

        if (((mode === 'modify' || typeof mode === "undefined" || mode === 'create' || mode === '') && !initSet) || (typeof mode === "undefined" || mode === 'create' || mode === '')) {
            $('#SubSupId').val(sup_id).change();
        }
        initSet = false;

    }
}

function SupplierChangedBySelected(supFId, supid) {
    var supplierFId = supFId;
    var sup_id = 0;
    if (supid > 0) {
        sup_id = supid;
    } else {
        var supplier = searchInArray(supplierList, 'FId', supplierFId);
        sup_id = supplier[0].Id;
    }

    if (supplierFId) {
        var sodId = getUrlVars()['sodId'];
        var mode = getUrlVars()['mode'];
        var oneSup = searchFieldValueInArray(supplierList, 'FId', supplierFId);
        if (!jQuery.isEmptyObject(oneSup) && mode !== 'view') {
            $('#VatId').val(oneSup.VatId);
            $('#CurId').val(oneSup.CurId);
        }
        var url = window.webservicePath + "/LoadSupplierContactBySupId";
        $('#ScoId').empty();
        $.ajax({
            type: "POST",
            url: url,
            contentType: "application/json; charset=utf-8",
            data: "{supId:'" + supplierFId + "'}",
            dataType: "json",
            success: function(data) {
                var jsdata = data.d;
                var data2Treat = jQuery.parseJSON(jsdata);
                if (data2Treat !== '-1') {
                    if (data2Treat.length > 0) {
                        contactSuppliers = [];
                        contactSuppliers = data2Treat;
                        $.each(contactSuppliers, function(index, value) {
                            if (ScoId && ScoId === value.ScoId) {
                                $('#ScoId').append($("<option></option>").attr("value", value.ScoId).attr("selected", true).text(value.ScoAdresseTitle));
                            } else {
                                $('#ScoId').append($("<option></option>").attr("value", value.ScoId).text(value.ScoAdresseTitle));
                            }
                        });
                        if (_isView) {
                            $('#ScoId').attr("disabled", "");
                        }
                        $('#ScoId').change();
                    }
                } else {
                    // authentication error
                    AuthencationError();
                }
            },
            error: function(data) {
                var test = '';
            }
        });

        if (((mode === 'modify' || typeof mode === "undefined" || mode === 'create' || mode === '') && !initSet) || (typeof mode === "undefined" || mode === 'create' || mode === '')) {
            $('#SubSupId').val(sup_id).change();
        }
        initSet = false;

    }
}


var allSupplier = [];
function LoadSupplier(loadSod) {
    var url = window.webservicePath + "/GetAllSuppliers";
    var budgetId = '#SupId';
    var budgetId2 = '#SubSupId';
    ShowPleaseWait();
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
                $(budgetId2).empty();
                $(budgetId2).append($("<option></option>").attr("data-value", "0").attr("value", "0").text("Veuillez sélectionner un fournisseur"));
                allSupplier = [];
                allSupplier = data2Treat;
                $.each(data2Treat, function(name, value) {
                    $(budgetId)
                        .append($("<option></option>")
                            .attr("data-value", value.FId)
                            .attr("value", value.Id)
                            .text(value.CompanyName)
                        );
                    $(budgetId2)
                        .append($("<option></option>")
                            .attr("data-value", value.FId)
                            .attr("value", value.Id)
                            .text(value.CompanyName)
                        );
                });
                if (loadSod) {
                    //LoadSupplierOrder();
                } 
                //setClientByPrjId();
                HidePleaseWait();
            } else {
                // authentication error
                AuthencationError();
                HidePleaseWait();
            }
        },
        error: function (data) {
            var test = '';
                HidePleaseWait();
        }
    });
}

function scoChange(sender) {
    var scoid = $(sender).val() * 1;
    if (scoid > 0) {
        var aSco = searchFieldValueInArray(contactSuppliers, 'ScoId', scoid);
        if (!jQuery.isEmptyObject(aSco)) {
            var ccoRef = 'ScoRef';
            var ccoFirstname = 'ScoFirstname';
            var ccoLastname = 'ScoLastname';
            var ccoAddress1 = 'ScoAddress1';
            var ccoAddress2 = 'ScoAddress2';
            var ccoPostcode = 'ScoPostcode';
            var ccoCity = 'ScoCity';
            var ccoCountry = 'ScoCountry';
            var ccoTel1 = 'ScoTel1';
            var ccoEmail = 'ScoEmail';
            var ccoFax = 'ScoFax';
            var ccoCellphone = 'ScoCellphone';
            $('#' + ccoRef).val(aSco.ScoRef);
            $('#' + ccoFirstname).val(aSco.ScoFirstname);
            $('#' + ccoLastname).val(aSco.ScoLastname);
            $('#' + ccoAddress1).val(aSco.ScoAddress1);
            $('#' + ccoAddress2).val(aSco.ScoAddress2);
            $('#' + ccoPostcode).val(aSco.ScoPostcode);
            $('#' + ccoCity).val(aSco.ScoCity);
            $('#' + ccoCountry).val(aSco.ScoCountry);
            $('#' + ccoTel1).val(aSco.ScoTel1);
            $('#' + ccoEmail).val(aSco.ScoEmail);
            $('#' + ccoFax).val(aSco.ScoFax);
            $('#' + ccoCellphone).val(aSco.ScoCellphone);
        }
    }
}

function js_create_update_item() {
    var checkOK = CheckRequiredFieldInOneDiv('content');

    if (checkOK && seltectedSupFId !== '' && seltectedSupFId !== '0') {
        ShowPleaseWait();
        var item = Object();
        item.SodName = $('#SodName').val();
        item.SupFId = seltectedSupFId;//$('#SupId').find('option:selected').attr('data-value');
        item.SubSupFId = seltectedSupFId;//$('#SubSupId').find('option:selected').attr('data-value');
        item.CurId = $('#CurId').val();
        item.VatId = $('#VatId').val();
        item.SupplierComment = $('#SupplierComment').val();
        item.InterComment = $('#InterComment').val();
        item.ScoId = $('#ScoId').val();
        item.SodFId = getUrlVars()['sodId'];
        item.DateCreation = getCreationDate($('#DateCreation').val());
        item.SodFinish = $('#SodFinish').is(':checked');
        item.SodNeedSend = $('#SodNeedSend').is(':checked');
        item.SodSupNbr = $('#SodSupNbr').val();
        item.UsrComId = $('#UsrComId option:selected').val() * 1;
        item.SodClient = $("#SodClient").val();
        item.CliId = $('#CliId').find('option:selected').attr('value') * 1;

        var jsondata = JSON.stringify({ item: item });
        $.ajax({
            url: 'SupplierOrder.aspx/CreateUpdateSupplierOrder',
            type: 'POST',
            contentType: 'application/json; charset=utf-8',
            data: jsondata,
            dataType: 'json',
            success: function(data) {
                var dfoId = data.d;
                var url = 'SupplierOrder.aspx';
                var newUrl = url + '?sodId=' + dfoId + '&mode=view';
                document.location.href = newUrl;
            },
            error: function(data) {
            }
        });
    } else {
        if (seltectedSupFId === '' || seltectedSupFId === '0') {
            alert('Veuillez sélectionner un founisseur<br/>请选择一个供货商');
        }
    }

    return false;
}

var currentItem = [];
var ScoId = 0;
var initSet = true;
var sodhasCin = false;
function LoadSupplierOrder() {
    var sodId = getUrlVars()['sodId'];
    if (sodId) {
        ShowPleaseWait();
        var url = window.webservicePath + "/LoadSodSup";
        var datastr = "{itemId:'" + sodId + "'}";
        $.ajax({
            type: "POST",
            url: url,
            contentType: "application/json; charset=utf-8",
            data: datastr,
            dataType: "json",
            success: function(data) {
                var jsdata = data.d;
                var data2Treat = jQuery.parseJSON(jsdata);
                if (data2Treat !== '-1') {
                    loadSodPayementInfo();
                    loadSodDocInfo();
                    var oneItem = data2Treat;
                    currentItem = [];
                    currentItem = oneItem;
                    ScoId = currentItem.ScoId;
                    if (currentItem.SodHasSin) {
                        $('#btn_create_supplier_invoice').hide();
                        $('#li_sin').show();
                    }
                    if (currentItem.PinId !== 0) {
                        $('#li_pin').show();
                    }
                    //console.log(currentItem);
                    $.each(currentItem, function(name, value) {
                        if (name === 'Creator') {
                            setFieldValue('CreatorName', value.FullName, true);
                        } else {
                            if (name === 'SodFile') {
                                if (value !== '' && value !== "" && value !== null) {
                                    var src = "../Common/PageForPDF.aspx?type=5&sodId=" + encodeURIComponent(currentItem.SodFId);
                                    $('#iframepdf').attr('src', src);
                                    $('#btn_delete_cod_file').show();
                                } else {
                                    $('#iframepdf').attr('height', '0');
                                    $('#a_collapse').click();
                                    $('#btn_delete_cod_file').hide();
                                }
                            }
                            else if (name === 'OneSupplier') {
                                setFieldValue('SupList', value.CompanyName, true);
                            } else {
                                setFieldValue(name, value, true);
                            }
                        }
                    });

                    SupplierChangedBySelected(currentItem.SupFId, currentItem.SupId);
                    seltectedSupFId = currentItem.SupFId;

                    //console.log(currentItem.CinId);

                    // 20210118 cso
//                    if (currentItem.CinId === null || currentItem.CinId === 0) {
//                        js_getClient();
//                    }
//                    if (currentItem.CsoList === null || currentItem.CsoList.length === 0) {
//                        js_getClient();
//                    } else {
//                        var mode = getParameterByName('mode');
//                        if (currentItem.CsoList!== null && currentItem.CsoList.length > 0 && mode === 'view') {
//                            var csocontent = "";
//                            $.each(currentItem.CsoList, function(name, cso) {
//                                csocontent += "<button type='button' class='btn btn-inverse' style='color:#d96666' id='btn_view_cin' cinid='" + cso.Value2 + "' onclick='return viewCin(this)'>" + cso.Value + "</button></br>";
//                            });
//                            var content = "<div class='form-group'>" +
//                                "<label class='col-sm-4 control-label'>Facture client 客户发票</label>" +
//                                "<div class='col-sm-8'>" +
//                                csocontent +
//                                //"<button type='button' class='btn btn-inverse' style='color:#d96666' id='btn_view_cin' onclick='return viewCin()'>" + currentItem.CinCode + "</button>" +
//                                "</div>" +
//                                "</div>";
//                            $('#div_btns').after(content);
//                            sodhasCin = true;
//                            $('#btn_create_cin').hide();
//                        }
//                    }

                    LoadComment();
                    $('#SupId').change();
                    HidePleaseWait();
                } else {
                    // authentication error
                    AuthencationError();
                    HidePleaseWait();
                }
            },
            error: function(data) {
                var test = '';
                HidePleaseWait();
            }
        });
    }
}

function delete_click() {
    var title = "ATTENTION";
    var content = "<div class='box'><div class='box-body' style='height: 100px;'>" +
        "<div class='form-horizontal'>" +
        "<div class='col-md-12'>" +
        "<div class='form-group'>" +
        "<div class='col-sm-12' style='text-align:center;font-size: 18pt;'>Veuillez confirmer la suppression ! " +
        "<br/>La suppression de Commande fournisseur est irrécupérable, veuillez confirmer !!!</div></div></div></div></div></div>"
        + "<div class='modal-footer center'>" +
        "<button type='button' class='btn btn-default' onclick='closeDialog()'>Annuler</button>" +
        "<button type='button' class='btn btn-inverse' onclick='return deleteItem();'>SUPPRIMER</button></div>";
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

function deleteItem() {
    var cplId = getUrlVars()['sodId'];
    myApp.showPleaseWait();
    if (cplId) {
        var url = window.webservicePath + "/DeleteSod";
        var datastr = "{sodId:'" + cplId + "'}";
        $.ajax({
            type: "POST",
            url: url,
            contentType: "application/json; charset=utf-8",
            data: datastr,
            dataType: "json",
            success: function(data) {
                var jsdata = data.d;
                if (jsdata) {
                    window.location = 'SearchSupplierOrder.aspx';
                    //myApp.hidePleaseWait();
                } else {
                    myApp.hidePleaseWait();
                    MsgErrorPopUp('ERREUR', 'Le devis est utilisé, la suppression n\'est pas effecturée!');

                }
            },
            error: function(data) {
                var test = '';
            }
        });

    }
    return false;
}

var lineCount = 0;
var currentLineId = 0;

function setAddUpdateLine(oneLine, forUpdateCreate) {
    $('#hf_prd_id').text('');
    $('#hf_pit_id').text('');
    var vatId = 1;
    if (currentItem) {
        vatId = currentItem.VatId;
    }
    var create = oneLine ? false : true;
    var LineId = oneLine ? oneLine.SolId : lineCount;
    lineCount--;
    var ordercount = itemLines.length;
    var LineOrder = oneLine ? oneLine.Order : ordercount + 1;
    var Description = oneLine ? oneLine.Description : '';
    var PrdId = oneLine ? oneLine.PrdId : '';
    var PrdName = oneLine ? oneLine.PrdName : '';
    var PitId = oneLine ? oneLine.PitId : '';
    var PitName = oneLine ? oneLine.PitName : '';
    var Quantity = oneLine ? oneLine.Quantity : '';
    var PrdImgPath = oneLine ? oneLine.PrdImgPath : '';
    var UnitPrice = oneLine ? oneLine.UnitPrice : '';
    vatId = oneLine ? oneLine.VatId : vatId;
    var DiscountAmount = oneLine ? oneLine.DiscountAmount : '';
    var UnitPriceWithDis = oneLine ? oneLine.UnitPriceWithDis : '';
    var TotalPrice = oneLine ? oneLine.TotalPrice : '';
    var TotalCrudePrice = oneLine ? oneLine.TotalCrudePrice : '';
    var PrdDescription = oneLine ? oneLine.PrdDescription : '';


    var CliName = oneLine ? (oneLine.Client !=null ? oneLine.Client : '') : '';
    var Power = oneLine ? oneLine.Power : '';
    var Driver = oneLine ? (oneLine.Driver == null ? '' : oneLine.Driver) : '';
    var Length = oneLine ? oneLine.Length: '';
    var Width = oneLine ? oneLine.Width : '';
    var Height = oneLine ? oneLine.Height : '';
    var UGR = oneLine ? oneLine.UGR : '';
    var LumEff = oneLine ? oneLine.Efflum : '';
    var CRI = oneLine ? oneLine.CRI : '';
    var Logistic = oneLine? oneLine.Logistic : '3';
    var DeadLine = oneLine ? getDateString(oneLine.Deadline) : '';
    var Supplier = oneLine ? oneLine.SupplierCompanyName : '';
    var TempC = oneLine ? (oneLine.TempColor == null ? '' : oneLine.TempColor) : '';
    $('#hf_prd_id').text(PrdId);
    $('#hf_pit_id').text(PitId);
    
    var DUpdate = oneLine ? getDateString(oneLine.DUpdate) : '';
    var DProduction = oneLine ? getDateString(oneLine.DProduction) : '';
    var DExpDelivery = oneLine ? getDateString(oneLine.DExpDelivery) : '';
    var DDelivery = oneLine ? getDateString(oneLine.DDelivery) : '';
    var DShipping = oneLine ? getDateString(oneLine.DShipping) : '';
    var DExpArrival = oneLine ? getDateString(oneLine.DExpArrival) : '';
    var FeatureCode = oneLine ? oneLine.FeatureCode : '';
    FeatureCode = FeatureCode == null ? '' : FeatureCode;
    var Transporter = oneLine ? oneLine.Transporter : '';
    Transporter = Transporter == null ? '' : Transporter;
    var LogsNbr = oneLine ? oneLine.LogsNbr : '';
    LogsNbr = LogsNbr == null ? '' : LogsNbr;
    var Need2Pay = oneLine ? oneLine.Need2Pay : '';
    Need2Pay = Need2Pay == null ? '' : Need2Pay;
    var Paid = oneLine ? oneLine.Paid : '';
    Paid = Paid == null ? '' : Paid;
    var Comment = oneLine ? oneLine.Comment : '';
    

//    if (oneLine) {
//        $('#hf_prd_id').text(oneLine.PrdFId);
//        $('#hf_pit_id').text(oneLine.PitFId);
//    }

    var disabled = " disabled ";
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
            //"<label class='col-sm-2 control-label'>Client</label>" +
            //"<div class='col-sm-2'><input class='form-control' id='Cli_zzz_' " + disabled + "  name='Cli_zzz_' value='" + CliName + "' lineId='" + LineId + "' /></div>" +
            "<label class='col-sm-2 control-label' style='background-color: #ff0000;display:none;'>Deadline 最迟交期</label>" +
            "<div class='col-sm-2' style='display:none;'><input class='form-control datepicker' id='Deadl_zzz_' " + disabled + "  name='Deadl_zzz_' value='" + DeadLine + "' lineId='" + LineId + "' style='display:none;'/></div>" +
            "<label class='col-sm-2 control-label'>Ordre</label>" +
            "<div class='col-sm-2'><input type='number' " + disabled + "  value='" + LineOrder + "' lineId='" + LineId + "'class='form-control' id='Order_zzz_' name='Order_zzz_' maxlength='3' /></div>" +
            "</div>" +
            "<!--///////////////////new line/////////////////-->" +
            "<div class='form-group'>" +
            "<label class='col-sm-2 control-label fieldRequired'>Référence du produit</label>" +
            "<div class='col-sm-2'><input class='form-control' id='PrdId_zzz_' " + disabled + "  name='PrdId_zzz_' value='" + PrdName + "' onkeyup='checkContent(this)' lineId='" + LineId + "' required/></div>" +
            "<label class='col-sm-2 control-label sale'>Référence du sous produit</label>" +
            "<div class='col-sm-2 sale'><select id='PitId_zzz_' name='PitId_zzz_' " + disabled + "  class='form-control' lineId='" + LineId + "' onchange='pitChange(this)' /></select></div>" +
            "<label class='col-sm-2 control-label'>Référence de Fournisseur</label>" +
            "<div class='col-sm-2'><input class='form-control' disabled  lineId='" + LineId + "'' id='RefSupplier_zzz_' name='RefSupplier_zzz_' /></div>" +
            "</div>" +
            "<div class='form-group'>" +
            "<label class='col-sm-2 control-label'>Description de produit</label>" +
            "<div class='col-sm-10'><textarea rows='4' disabled cols='1' lineId='" + LineId + "'  id='PrdDescription_zzz_' value='" + PrdDescription + "' name='PrdDescription_zzz_' class='form-control'></textarea>" +
            "</div></div>" +
            "<div class='form-group'>" +
            "<label class='col-sm-2 control-label'>Prix 1-100</label>" +
            "<div class='col-sm-2'><input class='form-control' disabled  lineId='" + LineId + "'' id='Prix1_100_zzz_' name='Prix1_100_zzz_' /></div>" +
            "<label class='col-sm-2 control-label'>Prix 100-500</label>" +
            "<div class='col-sm-2'><input class='form-control' disabled  lineId='" + LineId + "'' id='Prix100_500_zzz_' name='Prix100_500_zzz_' /></div>" +
            "<label class='col-sm-2 control-label'>Prix 500+</label>" +
            "<div class='col-sm-2'><input class='form-control' disabled  lineId='" + LineId + "'' id='Prix500plus_zzz_' name='Prix500plus_zzz_' /></div>" +
            "</div>" +
            "<div class='form-group variant'><label class='col-sm-2 control-label'>TVA</label>" +
            "<div class='col-sm-2'><select class='form-control' " + disabled + "   lineId='" + LineId + "'' id='VatId_zzz_' name='VatId_zzz_' onchange='CalCulatePrice(this)'></select></div>" +
            "<label class='col-sm-2 control-label fieldRequired'>Quantité</label>" +
            "<div class='col-sm-2'><input type='number' min='1' " + disabled + "  value='" + Quantity + "' lineId='" + LineId + "'class='form-control' id='Quantity_zzz_' name='Quantity_zzz_' field='Quantity' maxlength='3' onkeyup='CalCulatePrice(this)' required/></div>" +
            "<label class='col-sm-2 control-label '>Prix d'achat</label>" +
            "<div class='col-sm-2'><input type='number' step='0.001' class='form-control' lineId='" + LineId + "'  " + disabled + " id='UnitPrice_zzz_' name='UnitPrice_zzz_' min='0' value='" + UnitPrice + "' onkeyup='CalCulatePrice(this)' /></div>" +
            "</div>" +
            //remise
            "<div class='form-group variant'>" +
            "<label class='col-sm-2 control-label'>Montant de remise</label>" +
            "<div class='col-sm-2'><input type='number' step='1' " + disabled + "  class='form-control' id='DiscountAmount_zzz_'  lineId='" + LineId + "' field='DiscountAmount' name='DiscountAmount_zzz_' min='0' value='" + DiscountAmount + "' onkeyup='CalCulatePrice(this)'/></div>" +
            "<label class='col-sm-2 control-label'>Prix remisé</label>" +
            "<div class='col-sm-2'><input type='number' step='0.001' " + disabled + "  class='form-control' lineId='" + LineId + "' field='UnitPriceWithDis' id='UnitPriceWithDis_zzz_' name='UnitPriceWithDis_zzz_' min='0' value='" + UnitPriceWithDis + "' onkeyup='CalCulatePrice(this)' disabled/></div>" +
            "</div>" +
            // end remise
            "<div class='form-group  variant'><label class='col-sm-2 control-label'>Total H.T.</label>" +
            "<div class='col-sm-2'><input type='number' disabled='' step='0.001' " + disabled + "  class='form-control' lineId='" + LineId + "' id='TotalPrice_zzz_' name='TotalPrice_zzz_' value='" + TotalPrice + "' /></div>" +
            "<label class='col-sm-2 control-label'>Total T.T.C.</label>" +
            "<div class='col-sm-2'><input type='number' disabled step='0.001' " + disabled + "  class='form-control' lineId='" + LineId + "' id='TotalCrudePrice_zzz_' name='TotalCrudePrice_zzz_' value='" + TotalCrudePrice + "' /></div>" +
            "<div class='col-sm-1'></div><div class='col-sm-3' id='div_prd_image'><!-- image -->" +
            (create ? "" : "<img src='../../Services/ShowOutSiteImage.ashx?file=" + PrdImgPath + "' alt=''   class='img-responsive'  style='width: 100%' />") +
            "</div>" +
            "</div>" +
            "<!--///////////////////new line/////////////////-->" +
            "<div class='form-group'>" +
            "<label class='col-sm-2 control-label'>Puissance</label>" +
            "<div class='col-sm-2'><div class='input-group'><input class='form-control' type='number' min='1' id='Power_zzz_' " + disabled + "  name='Power_zzz_' value='" + Power + "' lineId='" + LineId + "' /><span class='input-group-addon'>W</span></div></div>" +
            "<label class='col-sm-2 control-label'>Driver</label>" +
            "<div class='col-sm-2'><input class='form-control' id='Driver_zzz_' " + disabled + "  name='Driver_zzz_' value='" + Driver + "' lineId='" + LineId + "' /></div>" +
            "<label class='col-sm-2 control-label'>Temp Couleur</label>" +
            "<div class='col-sm-2'><div class='input-group'><input class='form-control' id='TempC_zzz_' " + disabled + "  name='TempC_zzz_' value='" + TempC + "' lineId='" + LineId + "' /><span class='input-group-addon'>K</span></div></div>" +
            "</div>" +
            "<!--///////////////////new line/////////////////-->" +
            "<div class='form-group'>" +
            "<label class='col-sm-2 control-label'>Longueur (diamètre)</label>" +
            "<div class='col-sm-2'><div class='input-group'><input class='form-control' type='number' min='1'  id='Length_zzz_' " + disabled + "  name='Length_zzz_' value='" + Length + "' lineId='" + LineId + "' /><span class='input-group-addon'>mm</span></div></div>" +
            "<label class='col-sm-2 control-label'>Largeur</label>" +
            "<div class='col-sm-2'><div class='input-group'><input class='form-control' type='number' min='1' id='Width_zzz_' " + disabled + "  name='Width_zzz_' value='" + Width + "' lineId='" + LineId + "' /><span class='input-group-addon'>mm</span></div></div>" +
            "<label class='col-sm-2 control-label'>Hauteur</label>" +
            "<div class='col-sm-2'><div class='input-group'><input class='form-control' type='number' min='1' id='Height_zzz_' " + disabled + "  name='Height_zzz_' value='" + Height + "' lineId='" + LineId + "' /><span class='input-group-addon'>mm</span></div></div>" +
            "</div>" +
            "<!--///////////////////new line/////////////////-->" +
            "<div class='form-group'>" +
            "<label class='col-sm-2 control-label'>Efficacité lumineuse &ge;</label>" +
            "<div class='col-sm-2'><div class='input-group'><input class='form-control' type='number' min='1' id='LumEff_zzz_' " + disabled + "  name='LumEff_zzz_' value='" + LumEff + "' lineId='" + LineId + "' /><span class='input-group-addon'>lum/w</span></div></div>" +
            "<label class='col-sm-2 control-label'>UGR &le;</label>" +
            "<div class='col-sm-2'><input class='form-control' type='number' min='1' id='UGR_zzz_' " + disabled + "  name='UGR_zzz_' value='" + UGR + "' lineId='" + LineId + "' /></div>" +
            "<label class='col-sm-2 control-label'>CIR &ge;</label>" +
            "<div class='col-sm-2'><input class='form-control' type='number' min='1' id='CRI_zzz_' " + disabled + "  name='CRI_zzz_' value='" + CRI + "' lineId='" + LineId + "' /></div>" +
            "</div>" +
            "<!--///////////////////new line/////////////////-->" +
            "<div class='form-group'>" +
            "<label class='col-sm-2 control-label' style='background-color: #ffff00;display:none;'>D. prod. 开始生产日期</label>" +
            "<div class='col-sm-2' style='display:none;'><div class='input-group'>" +
            "<input class='form-control datepicker' id='DPrd_zzz_' name='DPrd_zzz_' value='" + DProduction + "' lineId='" + LineId + "' />" +
            "<span class='input-group-addon'><i class='fa fa-calendar'></i></span>" +
            "</div></div>" +
            // 预计交期
            "<div class='form-group'>" +
            "<label class='col-sm-2 control-label' style='background-color: #00ffff'>D. achèvmt. prv. 预计交期</label>" +
            "<div class='col-sm-2'><div class='input-group'>" +
            "<input class='form-control datepicker' id='DExpDev_zzz_' name='DExpDev_zzz_'   value='" + DExpDelivery + "' " + disabled + " lineId='" + LineId + "' />" +
            "<span class='input-group-addon'><i class='fa fa-calendar'></i></span>" +
            "</div></div>" +
            // 实际交期
            "<label class='col-sm-2 control-label' style='display:none;'>D. achèvmt. rél. 实际交期</label>" +
            "<div class='col-sm-2' style='display:none;'><div class='input-group'>" +
            "<input class='form-control datepicker' id='DDev_zzz_' name='DDev_zzz_'  value='" + DDelivery + "'  lineId='" + LineId + "'  />" +
            "<span class='input-group-addon'><i class='fa fa-calendar'></i></span>" +
            "</div></div>" +"<div class='form-group'>" +
            "<label class='col-sm-2 control-label'>D. expé. 发货日期</label>" +
            "<div class='col-sm-2'><div class='input-group'>" +
            "<input class='form-control datepicker' id='DShip_zzz_' name='DShip_zzz_'  value='" + DShipping + "' " + disabled + " lineId='" + LineId + "' />" +
            "<span class='input-group-addon'><i class='fa fa-calendar'></i></span>" +
            "</div></div>" +
            "<label class='col-sm-2 control-label' style='background-color: #00ff00'>D. arr. prv. 预计到达日期</label>" +
            "<div class='col-sm-2'><div class='input-group'>" +
            "<input class='form-control datepicker' id='DExpArr_zzz_' name='DExpArr_zzz_'  value='" + DExpArrival + "' " + disabled + " lineId='" + LineId + "' />" +
            "<span class='input-group-addon'><i class='fa fa-calendar'></i></span>" +
            "</div></div>" +
            "</div>" +
            
            "<!--///////////////////new line/////////////////-->" +
            "<div class='form-group'>" +
            "<label class='col-sm-2 control-label fieldRequired'>Logistique</label>" +
            "<div class='col-sm-2'><select id='Logs_zzz_' name='Logs_zzz_' " + disabled + "  class='form-control' lineId='" + LineId + "' >" +
            "<option value='0' data-value='0' " + (Logistic == 0 ? "selected='selected'" : "") + " >N/A 不需运输</option>" +
            "<option value='1' data-value='1' " + (Logistic == 1 ? "selected='selected'" : "") + " >Avion le plus rapide 最快空运快递</option>" +
            "<option value='2' data-value='2' " + (Logistic == 2 ? "selected='selected'" : "") + ">Avion le moins cher 最经济空运</option>" +
            "<option value='3' data-value='3' " + (Logistic == 3 ? "selected='selected'" : "") + ">Bateau 船运</option>" +
            "</select></div>" +
            "<label class='col-sm-2 control-label'>Transporteur 物流公司</label>" +
            "<div class='col-sm-2'>" +
            "<input class='form-control' disabled id='Transporter_zzz_' name='Transporter_zzz_'  value='" + Transporter + "'  lineId='" + LineId + "' />" +
            "</div>" +
            "<label class='col-sm-2 control-label'>Logis Num. 物流编号</label>" +
            "<div class='col-sm-2'>" +
            "<input class='form-control' disabled id='LogsNbr_zzz_' name='LogsNbr_zzz_'  value='" + LogsNbr + "'  lineId='" + LineId + "' />" +
            "</div>" +
            "</div>" +
            "<!--///////////////////end line/////////////////-->" +
            "<!--///////////////////new line/////////////////-->" +
            "<label class='col-sm-2 control-label' title='Code de fonction pour faciliter le recherche et le mémoire, 特征码方便查找和记忆用'>Code fonc. 特征码</label>" +
            "<div class='col-sm-2'>" +
            "<input class='form-control' id='FeatureCode_zzz_' name='FeatureCode_zzz_'  value='" + FeatureCode + "' " + disabled + " lineId='" + LineId + "' />" +
            "</div>" +
            "</div>" +
            "<!--///////////////////end line/////////////////-->" +
            "<!--///////////////////new line/////////////////-->" +
            
            "<label class='col-sm-2 control-label hidden'>Déjà payé 已支付</label>" +
            "<div class='col-sm-2 hidden'>" +
            "<input class='form-control' id='Paid_zzz_' name='Paid_zzz_' disabled  value='" + Paid + "'  lineId='" + LineId + "' />" +
            "</div>" +
            "<label class='col-sm-2 control-label hidden'>Rest à payer 未支付</label>" +
            "<div class='col-sm-2 hidden'>" +
            "<input class='form-control' id='Need2Pay_zzz_' name='Need2Pay_zzz_'  disabled  value='" + Need2Pay + "' lineId='" + LineId + "' />" +
            "</div>" +
            "<div class='col-sm-4 center hidden'>" +
            ((LineId != 0 && LineId != -1) ? "<button class='btn btn-inverse' onclick='return OpenSpr("+LineId+")'><span>Dossier de paiement</span></button>" : "") +
            "</div>" +
            
            "<!--///////////////////end line/////////////////-->" +
            "</div>" +
            "</div>" +
            "<div class='form-group'>" +
            "<label class='col-sm-2 control-label'>Commentaire 说明</br>S'afficheras dans la facture 会在发票中显示</label>" +
            "<div class='col-sm-4'><textarea rows='3' " + disabled + "  cols='1' lineId='" + LineId + "'  id='Description_zzz_' value='" + Description + "' name='Description_zzz_' class='form-control'></textarea></div>" +
            "<label class='col-sm-2 control-label'>Commentaire chinois 中文说明</br>Ne s'afficheras pas dans la facture 不会在发票中显示</label>" +
            "<div class='col-sm-4'><textarea rows='3' " + disabled + "  cols='1' lineId='" + LineId + "'  id='Comment_zzz_' value='" + Comment + "' name='Comment_zzz_' class='form-control'></textarea></div>" +
            "</div>" +
            // close box
            "</div></div></div></div></div>";

    //var btnAddUpdate = "<button class='btn btn-inverse' lineId='" + LineId + "' id='btn_add_update_line_zzz_' name='btn_add_update_line_zzz_' onclick='return AddUpdateOneLine(this)'><span>" + (!create ? "Mettre à jour 更新" : "Ajouter 新建") + "</span></button>";
    var btnDelete = "<button class='btn btn-inverse' lineId='" + LineId + "' id='btn_delete_line_zzz_' name='btn_delete_line_zzz_' onclick='return delete_Line_Confirm(this)'><span>Supprimer 删除</span></button>";
    var btnClose = "<button class='btn btn-default bootbox-close-button' onclick='return false'><span>Clôturer 关闭</span></button>";

    var btns = "<div class='modal-body center'>" + btnClose  + "</div>";
    var onecontent = startBox + onelineContent + btns + endBox;
    onecontent = replaceAll(onecontent, '_zzz_', '_' + LineId);
    currentLineId = LineId;

    var title = 'Consultation 查看';
    bootbox.dialog({
        title: title,
        message: onecontent
    }).find('.modal-dialog').css({
        'width': '85%'
    }).find('.modal-content').css({
        'margin-top': function() {
            var w = $(window).height();
            var b = $(".modal-dialog").height();
            // should not be (w-h)/2
            var h = (w - b) * 0.01;
            return h + "px";
        }
    }).find('.modal-header').css({
        'background': 'url(../../img/menu_005_bg.jpg) repeat-x',
        'text-align': 'center',
        'color': '#C0C0C0'
    });
    setAutoComplete(LineId);
    setLineTva(LineId, vatId);

    if (!create) {
        //currentLineId
        var subPrdId = '#PitId_' + currentLineId;
        var urlpit = window.webservicePath + "/GetPitByRefSup";
        try {
            $.ajax({
                url: urlpit,
                data: "{ 'pitRef': '', prdId:'" + PrdId + "'}",
                dataType: "json",
                type: "POST",
                contentType: "application/json; charset=utf-8",
                success: function(data) {
                    var jsdata2 = data.d;
                    var data2Treat = jQuery.parseJSON(jsdata2);
                    $(subPrdId).empty();
                    try {
                      $.each(data2Treat, function(name, pit) {
                        if (pit.PitId === PitId) {
                            $(subPrdId).append(
                                $("<option></option>").attr("value", pit.FId).attr("data-value", pit.PitPurchasePrice).attr('selected', true).text(pit.PitRef)
                            );
                        } else {
                            $(subPrdId).append(
                                $("<option></option>").attr("value", pit.FId).attr("data-value", pit.PitPurchasePrice).text(pit.PitRef)
                            );
                        }
                    });  
                    } catch (e) {

                    } 
                },
                error: function(response) {
                }
            });
        } catch (e) {
            var test = e;
        }

        var prdId = oneLine.PrdFId;
        getPrdPurchasePrice(prdId);

    }
    if (Description) {
        $('#Description_' + currentLineId).text(Description);
    }
    
    if (PrdDescription) {
        $('#PrdDescription_' + currentLineId).text(PrdDescription);
    }
    
    if (Comment) {
        $('#Comment_' + currentLineId).text(Comment);
    }
    
    if (oneLine) {
        preLoadProductInstance(oneLine.PrdId);
    }
    
    $.each($('.datepicker'), function (idx, value) {
        $(value).datepicker();
    });

}

function checkContent(sender) {
    if (!$(sender).val()) {
        $('#hf_prd_id').text('');
    }
}

var productInstances = [];
function setAutoComplete(lineId) {
    //var url = window.webservicePath + "/GetProductsByRef";
    var url = window.webservicePath + "/GetProductsByRefWithSupplierId";
    $("#PrdId_" + lineId).autocomplete({
        source: function(request, response) {
            $.ajax({
                url: url,
                data: "{ 'prdRef': '" + request.term + "', 'supId':"+currentItem.SupId+"}",
                dataType: "json",
                type: "POST",
                contentType: "application/json; charset=utf-8",
                success: function(data) {
                    var jsdata = data.d;
                    var data2Treat = jQuery.parseJSON(jsdata);
                    response($.map(data2Treat, function(item) {
                        return {
                            label: item.PrdRef,
                            val: item.FId,
                            datavalue: item.PrdImg,
                        }
                    }));
                },
                error: function(response) {
                    //alert(response.responseText);
                },
                failure: function(response) {
                    //alert(response.responseText);
                }
            });
        },
        select: function(e, i) {
            $("#hf_prd_id").text(i.item.val);
            // show image
            if (i.item.datavalue) {
                $('#div_prd_image').empty();
                var imgContent = "<img src='../../Services/ShowOutSiteImage.ashx?file=" + i.item.datavalue + "' alt=''   class='img-responsive'  style='width: 100%' />";
                $('#div_prd_image').append(imgContent);
            } else {
                $('#div_prd_image').empty();
            }
            $('#PitId_zzz_').val('');
            $("#hf_pit_id").text('');

            //currentLineId
            var subPrdId = '#PitId_' + currentLineId;
            var urlpit = window.webservicePath + "/GetPitByRef";
            $.ajax({
                url: urlpit,
                data: "{ 'pitRef': '', prdId:'" + i.item.val + "'}",
                dataType: "json",
                type: "POST",
                contentType: "application/json; charset=utf-8",
                success: function(data) {
                    var jsdata = data.d;
                    var data2Treat = jQuery.parseJSON(jsdata);
                    $(subPrdId).empty();
                    productInstances = [];
                    productInstances = data2Treat;
                    $.each(data2Treat, function(name, pit) {
                        $(subPrdId).append(
                            $("<option></option>")
                            .attr("value", pit.FId)
                            .attr("data-value", pit.PitPurchasePrice)
                            .attr("data-price", pit.PitPrice)
                            .text(pit.PitRef)
                        );
                    });
                    $(subPrdId).change();
                },
                error: function(response) {
                }
            });

            getPrdPurchasePrice(i.item.val);
        },
        minLength: 2
    });
}

var oneSupplierProduct = {};
function getPrdPurchasePrice(prdId) {
    var supId = currentItem.SupId;
    var url = window.webservicePath + "/GetSupplierProduct";
    $.ajax({
        url: url,
        data: "{ 'supId': " + supId + ", prdId:'" + prdId + "'}",
        dataType: "json",
        type: "POST",
        contentType: "application/json; charset=utf-8",
        success: function(data) {
            var jsdata = data.d;
            var data2Treat = [];

            try {
                data2Treat = jQuery.parseJSON(jsdata);
            } catch (e) {
                try {
                    data2Treat = JSON.parse(jsdata);
                } catch (e) {

                }
            }

            //var data2Treat = jQuery.parseJSON(jsdata);
            //var data2Treat = JSON.parse(jsdata);
            oneSupplierProduct = {};
            oneSupplierProduct = data2Treat;
            if (!jQuery.isEmptyObject(data2Treat)) {
                $("input[id^='RefSupplier']").val(data2Treat.SprPrdRef);
                $("input[id^='Prix1_100']").val(data2Treat.SprPrice_1_100);
                $("input[id^='Prix100_500']").val(data2Treat.SprPrice_100_500);
                $("input[id^='Prix500plus']").val(data2Treat.SprPrice_500_plus);
            } else {
                $("input[id^='RefSupplier']").val('');
                $("input[id^='Prix1_100']").val('');
                $("input[id^='Prix100_500']").val('');
                $("input[id^='Prix500plus']").val('');
            }
        },
        error: function(response) {
        }
    });
}

function AddUpdateOneLine(sender) {
    var lineId = $(sender).attr('lineId');
    var PrdId = $('#PrdId_' + lineId);
    var PitId = $('#PitId_' + lineId + ' option:selected');
    var Quantity = $('#Quantity_' + lineId);
    var Order = $('#Order_' + lineId);
    var Description = $('#Description_' + lineId);
    var UnitPrice = $('#UnitPrice_' + lineId);
    var DiscountAmount = $('#DiscountAmount_' + lineId);
    var UnitPriceWithDis = $('#UnitPriceWithDis_' + lineId);
    var TotalPrice = $('#TotalPrice_' + lineId);
    var TotalCrudePrice = $('#TotalCrudePrice_' + lineId);
    var PrdDescription = $('#PrdDescription_' + lineId);

    var Client = $('#Cli_' + lineId);
    var Deadline = $('#Deadl_' + lineId);
    var SupName = $('#SupName_' + lineId);
    var Power = $('#Power_' + lineId);
    var Driver = $('#Driver_' + lineId);
    var TempC = $('#TempC_' + lineId);
    var Length = $('#Length_' + lineId);
    var Width = $('#Width_' + lineId);
    var Height = $('#Height_' + lineId);
    var LumEff = $('#LumEff_' + lineId);
    var UGR = $('#UGR_' + lineId);
    var CRI = $('#CRI_' + lineId);
    var Logs = $('#Logs_' + lineId);
    
    var Transporter = $('#Transporter_' + lineId);
    var LogsNbr = $('#LogsNbr_' + lineId);
    var _DProduction = $('#DPrd_' + lineId);
    var _DExpDelivery = $('#DExpDev_' + lineId);
    var _DDelivery = $('#DDev_' + lineId);
    var _DShipping = $('#DShip_' + lineId);
    var _DExpArrival = $('#DExpArr_' + lineId);
    var FeatureCode = $('#FeatureCode_' + lineId);
    var Comment = $('#Comment_' + lineId);
    var thisVatId = $('#VatId_' + lineId).val() * 1;
    var UsrIdCom1 = $('#UsrCom1_' + lineId + ' option:selected').val() * 1;
    var UsrIdCom2 = $('#UsrCom2_' + lineId + ' option:selected').val() * 1;
    var UsrIdCom3 = $('#UsrCom3_' + lineId + ' option:selected').val() * 1;

    var checkOK = true;
    checkOK = CheckRequiredFieldInOneDiv('div_one_line');
    if (checkOK) {
        var order = Order.val() * 1 + 0;
        var prdId = $('#hf_prd_id').text();
        var pitId = $('#hf_pit_id').text();
        var quantity = Quantity.val().replace(' ', '').replace(',', '.') * 1;
        var discountamount = DiscountAmount.val().replace(' ', '').replace(',', '.') * 1;
        var unitprice = UnitPrice.val().replace(' ', '').replace(',', '.') * 1;
        var unitpricewithdis = UnitPriceWithDis.val().replace(' ', '').replace(',', '.') * 1;
        var totalprice = TotalPrice.val().replace(' ', '').replace(',', '.') * 1;
        var totalcrudeprice = TotalCrudePrice.val().replace(' ', '').replace(',', '.') * 1;

        var description = Description.val();

        var oneline = {};
        oneline.SolId = lineId;
        oneline.SodFId = getUrlVars()['sodId'];
        oneline.Order = order;
        oneline.Description = description;
        oneline.PrdDescription = PrdDescription.val();
        oneline.PrdFId = prdId;
        oneline.PitFId = pitId;

        oneline.Quantity = quantity;
        oneline.UnitPrice = unitprice;
        oneline.DiscountAmount = discountamount;
        oneline.UnitPriceWithDis = unitpricewithdis;
        oneline.TotalPrice = totalprice;
        oneline.TotalCrudePrice = totalcrudeprice;
        oneline.VatId = thisVatId != 0 ? thisVatId : $('#VatId').val();

        
        oneline.Client = Client.val();
        oneline.Deadline =  getCreationDate(Deadline.val());
        oneline.SupplierCompanyName = SupName.val();
        oneline.Power = Power.val().replace(',', '.') * 1;
        oneline.PrdName = PrdId.val();

        oneline.Driver = Driver.val();
        oneline.TempColor = TempC.val();
        oneline.Length = Length.val().replace(',', '.') * 1;
        oneline.Width = Width.val().replace(',', '.') * 1;
        oneline.Height = Height.val().replace(',', '.') * 1;
        oneline.EffLum = LumEff.val().replace(',', '.') * 1;
        oneline.UGR = UGR.val().replace(',', '.') * 1;
        oneline.CRI = CRI.val().replace(',', '.') * 1;
        oneline.Logistic = Logs.val();

        oneline.Transporter = Transporter.val();
        oneline.LogsNbr = LogsNbr.val();
        oneline._DProduction = _DProduction.val();
        oneline._DExpDelivery = _DExpDelivery.val();
        oneline._DDelivery = _DDelivery.val();
        oneline._DShipping = _DShipping.val();
        oneline._DExpArrival = _DExpArrival.val();
        oneline.FeatureCode = FeatureCode.val();
        oneline.Comment = Comment.val();
        
        oneline.UsrIdCom1 = UsrIdCom1;
        oneline.UsrIdCom2 = UsrIdCom2;
        oneline.UsrIdCom3 = UsrIdCom3;


        var jsondata = JSON.stringify({ oneLine: oneline });
        var url = window.webservicePath + "/InsertUpdateSol";
        $.ajax({
            url: url,
            type: 'POST',
            contentType: 'application/json; charset=utf-8',
            data: jsondata,
            dataType: 'json',
            success: function(data) {
                $('.bootbox-close-button').click();
                loadAllLines();
                loadSodPayementInfo();
            },
            error: function(data) {
                alert(data.responseText);
            }
        });
    }
    return false;
}

function pitChange(sender) {
    $("#hf_pit_id").text($(sender).val());
    var pitId = $(sender).val();
    var clnId = $(sender).attr('lineid');
    var onePit = searchFieldValueInArray(productInstances, 'FId', pitId);
    var propdes = "";
    var PrdName = onePit.PrdName;
    var PrdOutsideDiameter = onePit.PrdOutsideDiameter;
    var PrdLength = onePit.PrdLength;
    var PrdWidth = onePit.PrdWidth;
    var PrdHeight = onePit.PrdHeight;
    var PrdDescription = onePit.PrdDescription;
    var Description = onePit.Description;
    //var diameterExt = ontPit.
    $.each(onePit.PitAllInfo, function(order, propvalue) {
        if (propvalue.PropValue) {
            propdes += propvalue.PropName + ": " + propvalue.PropValue + " " + propvalue.PropUnit + "\r\n";
        }
    });
    var additionnalInfo = "";
    if (PrdOutsideDiameter) {
        additionnalInfo += "Diamètre extérieur : " + PrdOutsideDiameter + " mm\r\n";
    }
    if (PrdLength) {
        additionnalInfo += "Longueur : " + PrdLength + " mm\r\n";
    }
    if (PrdWidth) {
        additionnalInfo += "Largeur : " + PrdWidth + " mm\r\n";
    }
    if (PrdHeight) {
        additionnalInfo += "Hauteur : " + PrdHeight + " mm";
    }
    var alldes = PrdName + "\r\n" + propdes.trim() +"\r\n" + additionnalInfo.trim();
    $('#PrdDescription_' + clnId).text(alldes);
    if (Description) {
        $('#Description_' + clnId).text(Description);
    }
}

function preLoadProductInstance(prdId) {
    var urlpit = window.webservicePath + "/GetPitByRef";
    $.ajax({
        url: urlpit,
        data: "{ 'pitRef': '', prdId:'" + prdId + "'}",
        dataType: "json",
        type: "POST",
        contentType: "application/json; charset=utf-8",
        success: function(data) {
            var jsdata = data.d;
            var data2Treat = jQuery.parseJSON(jsdata);
            productInstances = [];
            productInstances = data2Treat;
        },
        error: function(response) {
        }
    });
}

function setLineTva(lineId, vatId) {
    if (allTVA) {
        var budgetId = '#VatId_' + lineId;
        $(budgetId).empty();
        $.each(allTVA, function (name, value) {
            if (vatId && value.Key === vatId) {
                $(budgetId)
                    .append($("<option></option>")
                        .attr("value", value.Key).attr("selected", true).attr("data-value", value.DcValue)
                        .text(value.Value));
            } else {
                $(budgetId)
                    .append($("<option></option>")
                        .attr("value", value.Key)
                        .attr("data-value", value.DcValue)
                        .text(value.Value));
            }
        });
    }
}

var allTVA = [];
function getAllTVA() {
    var url = window.webservicePath + "/GetAllTVASup";
    var budgetId = '#VatId';
    $.ajax({
        type: "POST",
        url: url,
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        success: function (data) {
            var jsdata = data.d;
            var data2Treat = jQuery.parseJSON(jsdata);
            if (data2Treat !== '-1') {
                allTVA = [];
                allTVA = data2Treat;
                $(budgetId).empty();
                $.each(data2Treat, function (name, value) {
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

function CalCulatePrice(sender) {
    var lineId = $(sender).attr('lineId');
    var field = $(sender).attr('field');
    var quantity = $('#Quantity_' + lineId).val() * 1;
    if (field === 'Quantity') {
        //alert('test');
        if (!jQuery.isEmptyObject(oneSupplierProduct)) {
            var purchasepriceSupplirOrder = 0;
            if (quantity <= 100) {
                purchasepriceSupplirOrder = oneSupplierProduct.SprPrice_1_100;
            } else if (quantity > 100 && quantity <= 500) {
                purchasepriceSupplirOrder = oneSupplierProduct.SprPrice_100_500;
            } else {
                purchasepriceSupplirOrder = oneSupplierProduct.SprPrice_500_plus;
            }
            $('#UnitPrice_' + lineId).val(purchasepriceSupplirOrder);
        }
    }
    var tva = $('#VatId_' + lineId + '  option:selected');
    var unitprice = $('#UnitPrice_' + lineId).val() * 1;
    var disAmount = $('#DiscountAmount_' + lineId).val() * 1;
    var disPrice = $('#UnitPriceWithDis_' + lineId).val() * 1;
    //var purcharsePrice = $('#PurchasePrice_'+ lineId).val() * 1;
    var totalHT = $('#TotalPrice_' + lineId);
    var totalTTC = $('#TotalCrudePrice_' + lineId);
    var tva_value = tva.attr('data-value') * 1;
    disPrice = unitprice - disAmount;
    var _total_ht = quantity * disPrice;
    var _total_ttc = _total_ht * (1 + tva_value / 100);
    _total_ht = _total_ht.toFixed(3);
    _total_ttc = _total_ttc.toFixed(3);

    totalHT.val(_total_ht);
    totalTTC.val(_total_ttc);
    $('#UnitPriceWithDis_' + lineId).val(disPrice.toFixed(3));
}

var itemLines = [];
var solIsSet = false;
function loadAllLines() {
    ShowPleaseWait();
    var entityId = getUrlVars()['sodId'];
    var url = window.webservicePath + "/LoadSolsSup";
    $.ajax({
        url: url,
        type: 'POST',
        contentType: 'application/json; charset=utf-8',
        data: "{sodId:'" + entityId + "'}",
        dataType: 'json',
        success: function(data) {
            var jsdata = data.d;
            var jsondata = jQuery.parseJSON(jsdata);
            if (jsondata !== '-1') {
                itemLines = [];
                itemLines = jsondata;
                if (itemLines.length > 0) {
                    $('#btn_generate_pdf').show();
                    if (allclient.length > 0 && !sodhasCin) {
                        $('#btn_create_cin').show();
                    }
                    $('#btn_generate_pdf_sup').show();
                    $("#btn_validate_costplan").show();
                    if (!currentItem.SodHasSin) {
                        //$('#btn_create_supplier_invoice').show();
                        $('#btn_create_supplier_invoice').hide();
                    } else {
                        $('#btn_create_supplier_invoice').hide();
                    }
                } else {
                    $('#btn_delete').show();
                    $('#btn_generate_pdf').hide();
                    //$('#btn_create_cin').hide();
                    $('#btn_generate_pdf_sup').hide();
                    $("#btn_validate_costplan").hide();
                    $('#btn_create_supplier_invoice').hide();
                }
                $('#tbody_lines').empty();
                var hasAnyLgl = setSolLines(jsondata);

                if (hasAnyLgl) {
                    $('#btn_delete').hide();
                } else {
                   $('#btn_delete').show();
                }
                HidePleaseWait();
                var solId = getUrlVars()['solId'];
                if (solId) {
                    var btnupsol = $('#btn_up_sol_' + solId);
                    if (btnupsol.attr('itemId') == solId && !solIsSet && !paraClicked) {
                        solIsSet = true;
                        paraClicked = true;
                        btnupsol.click();
                    }
                }
                //$('#tbody_lines')
            } else {
                HidePleaseWait();
            }
        },
        error: function(data) {
            HidePleaseWait();
        }
    });
}

function changeCF_sol_click(sender) {
    var itemId = $(sender).attr('itemId');
    var title = "CHANGER LA COMMANDE FOURNISSEUR";
    var disabled = false;
    var startBox = "<div class='box'><div class='box-body'>";
    var endBox = "</div></div>";
    var LineId = $(sender).attr('itemId');
    var onelineContent =
        // start box
        "<div class='form-group' id='div_one_line'>" +
            "<div class='row'>" +
            "<div class='col-md-12'>" +
            "<div class='box-body'>" +
            "<div class='form-horizontal'>" +
            "<!--///////////////////new line/////////////////-->" +
            "<div class='form-group variant'>" +
            "<div class='col-sm-2'></div>" +
            "<label class='col-sm-4 control-label'>Sélectionner une commande fournisseur</label>" +
            "<div class='col-sm-4'><input class='form-control' required='' id='SodId_zzz_' " + "  name='SodId_zzz_'  lineId='" + LineId + "' /></div>" +
            "<div class='col-sm-2'></div>" +
            "</div>" +
            "<!--///////////////////new line/////////////////-->" +
            "<div class='form-group' id='div_sod_info'>" +
            "</div>" +
            "<!--///////////////////new line/////////////////-->" +
            "<div class='form-group' id='div_sol_info'>" +
            "</div>" +

            // close box
            "</div></div></div></div></div>";
            

            
    var btnAddUpdate = "<button class='btn btn-inverse' style='display:none' lineId='" + LineId + "' id='btn_change_sod' name='btn_change_sod' onclick='return ChangeSod(this)'><span>CHANGER</span></button>";
    
    var btnClose = "<button class='btn btn-default bootbox-close-button' onclick='return false'><span>Annuler</span></button>";

    var btns = "<div class='modal-body center'>" + btnClose + btnAddUpdate + "</div>";
    var onecontent = startBox + onelineContent + btns + endBox;
    onecontent = replaceAll(onecontent, '_zzz_', '_' + LineId);
    currentLineId = LineId;

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
            var h = (w - b) * 0.1;
            return h + "px";
        }
    }).find('.modal-header').css({
        'background': 'url(../../img/menu_005_bg.jpg) repeat-x',
        'text-align': 'center',
        'color': '#C0C0C0'
    });
    setAutoCompleteSod(LineId);
    return false;
}

var selectedSodId = '';
function setAutoCompleteSod(solId) {
    var sodId = getUrlVars()['sodId'];
    var url = window.webservicePath + "/GetSodByKeyword";
    $("#SodId_" + solId).autocomplete({
        source: function(request, response) {
            $.ajax({
                url: url,
                data: "{ 'keyword': '" + request.term + "','sodId':'" + sodId + "'}",
                dataType: "json",
                type: "POST",
                contentType: "application/json; charset=utf-8",
                success: function(data) {
                    var jsdata = data.d;
                    var data2Treat = jQuery.parseJSON(jsdata);
                    if (data2Treat.length > 0) {
                        response($.map(data2Treat, function(item) {
                            return {
                                label: item.SodCode,
                                val: item.SodFId,
                                datavalue: item.Supplier
                            }
                        }));
                        selectedSodId = '';
                        //$('#btn_change_sod').show();
                    } else {
                        selectedSodId = '';
                        $('#div_sod_info').empty();
                        $('#div_sol_info').empty();
                        $('#btn_change_sod').hide();
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
            $('#div_sod_info').empty();
            $('#btn_change_sod').show();
            selectedSodId = i.item.val;
            var suppliers = i.item.datavalue.split('######');
            var suppliercontent = "";
            if (connectedUser.LoginMode === 1) {
                suppliercontent = "<div class='col-sm-1'></div>"+"<label class='col-sm-2 control-label'>Founisseur :</label>" +
                    "<label class='col-sm-3 control-label'>" + suppliers[0] + "</label>" +
                    "<label class='col-sm-2 control-label'>Sub Founisseur :</label>" +
                    "<label class='col-sm-3 control-label'>" + suppliers[1] + "</label>"+"<div class='col-sm-1'></div>";
            } else {
                suppliercontent = "<div class='col-sm-4'></div><label class='col-sm-2 control-label'>Founisseur :</label>" +
                    "<label class='col-sm-2 control-label'>" + suppliers[0] + "</label>" +
                    "<div class='col-sm-2'></div>";
            }
            $('#div_sod_info').append(suppliercontent);
            $('#div_sol_info').empty();
            var urlpit = window.webservicePath + "/LoadSols";
            ShowPleaseWait();
            $.ajax({
                url: urlpit,
                data: "{ 'sodId':'" + i.item.val + "'}",
                dataType: "json",
                type: "POST",
                contentType: "application/json; charset=utf-8",
                success: function(data) {
                    var jsdata = data.d;
                    var data2Treat = jQuery.parseJSON(jsdata);
                    var table = "<div class='form-horizontal center' style='width: 100%; overflow-x: auto; height:300px;'>" +
                        "<table cellpadding='0' cellspacing='0' border='0' class='table table-striped table-bordered table-hover' >" +
                        "<thead><tr role='row'>" +
                        "<th rowspan='1' colspan='1' class='smallText'>Ordre</th>" +
                        "<th rowspan='1' colspan='1' class='smallText'>Client</th>" +
                        "<th rowspan='1' colspan='1' class='smallText'>Deadline</th>" +
                        "<th rowspan='1' colspan='1' class='smallText'>Produit</th>" +
                        "<th rowspan='1' colspan='1' class='smallText'>Référence</th>" +
                        "<th rowspan='1' colspan='1' class='smallText'>Leur Réf</th>" +
                        "<th rowspan='1' colspan='1' class='smallText'>Description</th>" +
                        "<th rowspan='1' colspan='1' class='smallText'>Les détails</th>" +
                        "<th rowspan='1' colspan='1' class='smallText'>Image</th>" +
                        "<th rowspan='1' colspan='1' class='smallText'>Quantité</th>" +
                        "<th rowspan='1' colspan='1' class='smallText'>Envoyé/stocké</th>" +
                        "<th rowspan='1' colspan='1' class='smallText'>Prix d'achat</th>" +
                        "<th rowspan='1' colspan='1' class='smallText'>Prix remisé</th>" +
                        "<th rowspan='1' colspan='1' class='smallText'>Total H.T</th>" +
                        "<th rowspan='1' colspan='1' class='smallText'>Total T.T.C</th></tr>" +
                        "</thead>" +
                        "<tbody id='tbody_sol_lines' style='text-align: center !important'>" +
                        "</tbody>" +
                        "<tfoot><tr role='row'>" +
                        "<th rowspan='1' colspan='1' class='smallText'>Ordre</th>" +
                        "<th rowspan='1' colspan='1' class='smallText'>Client</th>" +
                        "<th rowspan='1' colspan='1' class='smallText'>Deadline</th>" +
                        "<th rowspan='1' colspan='1' class='smallText'>Produit</th>" +
                        "<th rowspan='1' colspan='1' class='smallText'>Référence</th>" +
                        "<th rowspan='1' colspan='1' class='smallText'>Leur Réf</th>" +
                        "<th rowspan='1' colspan='1' class='smallText'>Description</th>" +
                        "<th rowspan='1' colspan='1' class='smallText'>Les détails</th>" +
                        "<th rowspan='1' colspan='1' class='smallText'>Image</th>" +
                        "<th rowspan='1' colspan='1' class='smallText'>Quantité</th>" +
                        "<th rowspan='1' colspan='1' class='smallText'>Envoyé/stocké</th>" +
                        "<th rowspan='1' colspan='1' class='smallText'>Prix d'achat</th>" +
                        "<th rowspan='1' colspan='1' class='smallText'>Prix remisé</th>" +
                        "<th rowspan='1' colspan='1' class='smallText'>Total H.T</th>" +
                        "<th rowspan='1' colspan='1' class='smallText'>Total T.T.C</th></tr>" +
                        "</tfoot>" +
                        "</table>" +
                        "</div>";
                    if (data2Treat.length > 0) {
                        $('#div_sol_info').append(table);
                        var linecount = 1;
                        var totalht = 0;
                        var totalttc = 10;
                        $.each(data2Treat, function(name, value) {
                            var lineclass = (linecount % 2 === 1) ? "odd" : "even";
                            var prdname = value.PrdName;
                            var pitname = value.PitName;
                            var quantity = value.Quantity;
                            var supPrdref = value.SupplierRef;
                            //var description = replaceAll(value.PrdDescription, '\n', '</br>') + '</br>---------------------------</br>' + replaceAll(value.Description, '\n', '</br>');

                            var itemId = value.SolId;

                            var CliName = value.Client;
                            var Power = value.Power;
                            var Driver = value.Driver;
                            var Length = value.Length;
                            var Width = value.Width;
                            var Height = value.Height;
                            var UGR = value.UGR;
                            var LumEff = value.Efflum;
                            var CRI = value.CRI;
                            var Logistic = value.Logistic;
                            var TempColor = value.TempColor;
                            Logistic = Logistic == 0 ?'N/A 不需运输' :Logistic == 1 ? 'Avion le plus rapide 最快空运快递' : Logistic == 2 ? 'Avion le moins cher 最经济快递' : 'Bateau 船运';
                            var DeadLine = getDateString(value.Deadline);

                            // description
                            var desPrd = (value.PrdDescription == "" || value.PrdDescription == '' || value.PrdDescription == null) ?
                                '' : value.PrdDescription;
                            desPrd = replaceAll(desPrd, '\n', '</br>');
                            var newline = (desPrd != '' ? '</br>---------------------------</br>' : '');
                            var description = desPrd + newline + replaceAll(value.Description, '\n', '</br>');
                            description = (description == "" || description == '' || description == null) ?
                                '' : description;
                            description = replaceAll(description, '\n', '</br>');
                            var otherInfo = (IsNullOrEmpty(Power > 0) ? "" : "Puissance : " + Power + " W</br>") +
                            (IsNullOrEmpty(Driver) ? "" : "Driver : " + Driver + "</br>") +
                            (IsNullOrEmpty(TempColor) ? "" : "Température couleur : " + TempColor + " K</br>") +
                            (IsNullOrEmpty(Length) ? "" : "Longueur : " + Length + " mm</br>") +
                            (IsNullOrEmpty(Width) ? "" : "Largeur : " + Width + " mm</br>") +
                            (IsNullOrEmpty(Height) ? "" : "Hauteur : " + Height + " mm</br>") +
                            (IsNullOrEmpty(LumEff) ? "" : "Efficacité lumineuse ≥ " + LumEff + " lum/w</br>") +
                            (IsNullOrEmpty(UGR) ? "" : "UGR ≤ " + UGR + "</br>") +
                            (IsNullOrEmpty(CRI) ? "" : "CRI ≥ " + CRI + "</br>");
                            newline = (otherInfo != '' ? '</br>---------------------------</br>' : '');
                            var infocompl = description + newline + replaceAll(otherInfo, '\n', '</br>');
                            // description

                            // shipping and production information
                            var DProduction = getDateString(value.DProduction);
                            var DExpDelivery = getDateString(value.DExpDelivery);
                            var DDelivery = getDateString(value.DDelivery);
                            var DShipping = getDateString(value.DShipping);
                            var DExpArrival = getDateString(value.DExpArrival);
                            var FeatureCode = value.FeatureCode;
                            var Transporter = value.Transporter;
                            var LogsNbr = value.LogsNbr;
                            var Logistic = value.Logistic;
                            Logistic =Logistic == 0 ?'N/A 不需运输' : Logistic == 1 ? 'Avion le plus rapide 最快空运快递' : Logistic == 2 ? 'Avion le moins cher 最经济快递' : 'Bateau 船运';

                            var infoShipPrd = ("<span style='color:red;'>Logistique 运货方式 : </br>" + Logistic + "</span></br>") +
                            (IsNullOrEmpty(DProduction) ? "" : "D.Prod. 开始生产日期 : " + DProduction + "</br>") +
                            (IsNullOrEmpty(DExpDelivery) ? "" : "D. achèvmt. prv. 预计交期 : " + DExpDelivery + "</br>") +
                            (IsNullOrEmpty(DDelivery) ? "" : "D. achèvmt. rél. 实际交期 : " + DDelivery + "</br>") +
                            (IsNullOrEmpty(DShipping) ? "" : "D. expé. 发货日期 : " + DShipping + "</br>") +
                            (IsNullOrEmpty(DExpArrival) ? "" : "D. arr. prv. 预计到达日期 : " + DExpArrival + "</br>") +
                            (IsNullOrEmpty(Transporter) ? "" : "Transporteur 物流公司 : " + Transporter + "</br>") +
                            (IsNullOrEmpty(LogsNbr) ? "" : "Logis Num. 物流编号 : " + LogsNbr + "</br>") +
                            (IsNullOrEmpty(FeatureCode) ? "" : "<span style='color:red;'>Code fonct. 特征码 : " + FeatureCode + "</span></br>");


                            var oneline = "<tr class='" + lineclass + "'>" +
                                "<td class='label_left smallTextVt' style='cursor: pointer;' itemId='" + itemId + "'  onclick='return modify_line_click(this)'>" + value.Order + "</td>" +
                                "<td class='label_left smallTextVt'  style='cursor: pointer;' itemId='" + itemId + "'  onclick='return modify_line_click(this)'>" + CliName + "</td>" +
                                "<td class='label_left smallTextVt'  style='cursor: pointer;' itemId='" + itemId + "'  onclick='return modify_line_click(this)'>" + DeadLine + "</td>" +
                                "<td class='label_left smallTextVt' style='cursor: pointer; width:10%;' itemId='" + itemId + "'  onclick='return modify_line_click(this)'>" + prdname + "</td>" +
                                "<td class='label_left smallTextVt'>" + pitname + "</td>" +
                                "<td class='label_left smallTextVt'>" + supPrdref + "</td>" +
                                "<td class='label_left smallTextVt'>" + infocompl + "</td>" +
                                "<td class='label_left smallTextVt'>" + infoShipPrd + "</td>" +
                                "<td>" + (value.PrdImgPath ? ("<img src='../../Services/ShowOutSiteImage.ashx?file=" + value.PrdImgPath + "' height='40' width='40' />") : "") + "</td>" +
                                "<td class='label_right smallTextVt'>" + quantity + "</td>" +
                                "<td class='label_right smallTextVt'><span style='color:red'>" + value.DeliveriedQuantity + "</span></td>" +
                                "<td class='label_right smallTextVt'>" + value.UnitPrice + "</td>" +
                                "<td class='label_right smallTextVt'>" + value.UnitPriceWithDis + "</td>" +
                                "<td class='label_right smallTextVt'>" + value.TotalPrice + "</td>" +
                                "<td class='label_right smallTextVt'>" + value.TotalCrudePrice + "</td>";

                            totalht += value.TotalPrice;
                            totalttc += value.TotalCrudePrice;
                            $('#TotalPriceHT').val(totalht);
                            $('#TotalPriceTTC').val(totalttc);


                            var endline = "</tr>";

                            oneline += endline;

                            linecount ++;
                            $('#tbody_sol_lines').append(oneline);
                            HidePleaseWait();
                        });

                    } else {
                        $('#div_sol_info').append("<div div class='col-sm-12'>Aucune de ligne dans cette commande fournisseur<div>");

                        HidePleaseWait();
                    }
                },
                error: function(response) {
                    HidePleaseWait();
                }
            });
        },
        minLength: 2
    });
}

function ChangeSod(sender) {
    var solId = $(sender).attr('lineId') * 1;
    var sodId = selectedSodId;
    if (IsNullOrEmpty(sodId) || solId <= 0) {
        alert('Veuillez sélectionner une commande fournisseur');
    } else {
        var url = window.webservicePath + "/ChangeSol2NewSod";
        var datastr = "{sodId:'" + sodId + "',solId:" + solId + "}";
        $.ajax({
            type: "POST",
            url: url,
            contentType: "application/json; charset=utf-8",
            data: datastr,
            dataType: "json",
            success: function(data) {
                var jsdata = data.d;
                var data2Treat = jQuery.parseJSON(jsdata);
                if (data2Treat !== '-1') {
                    if (data2Treat == '0') {
                        alert('Erreur, veuillez conntacter l\'administrateur !');
                    } else {
                        var newurl = 'SupplierOrder.aspx';
                        newurl = newurl + '?sodId=' + data2Treat + '&solId=' + sodId + '&mode=view';
                        document.location.href = newurl;
                        //window.open(url, '_blank');        
                    }
                    HidePleaseWait();
                } else {
                    // authentication error
                    AuthencationError();
                    HidePleaseWait();
                }
            },
            error: function(data) {
                var test = '';
                HidePleaseWait();
            }
        });
    }
    return false;
}

function changeCF_SOL(sender) {

    return false;
}

var paraClicked = false;

function duplicate_sol_click(sender) {
    var itemId = $(sender).attr('itemId') * 1;
    MsgPopUpWithResponseChoice('CONFIRMATION', "Veuillez confirmer à dupliquer cette ligne? ", 'Dupliquer', 'dulicateSol(' + itemId + ')', 'Annuler');
    return false;
}

function dulicateSol(solId) {
    var sodId= getUrlVars()['sodId'];
    var url = window.webservicePath + "/DuplicateSol";
    ShowPleaseWait();
    $.ajax({
        type: "POST",
        url: url,
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        data: "{sodId:'" + sodId + "',solId:" + solId + "}",
        success: function(data) {
            var jsdata = data.d;
            var data2Treat = jQuery.parseJSON(jsdata);
            if (data2Treat !== '-1') {
                loadAllLines();
                HidePleaseWait();
            } else {
                AuthencationError();
            }
        },
        error: function(data) {
            HidePleaseWait();
            var test = '';
        }
    });
}
function modify_line_click(sender) {
    var itemId= $(sender).attr('itemId') * 1;
    var oneCln = searchFieldValueInArray(itemLines,'SolId',itemId);
    if (oneCln) {
        setAddUpdateLine(oneCln);
    }
    return false;
}

function delete_Line_Confirm(sender) {
    var itemId = $(sender).attr('itemId');
    var title = "ATTENTION";
    var content = "<div class='box'><div class='box-body' style='height: 100px;'>" +
        "<div class='form-horizontal'>" +
        "<div class='col-md-12'>" +
        "<div class='form-group'>" +
        "<div class='col-sm-12' style='text-align:center;font-size: 18pt;'>Veuillez confirmer la suppression ! " +
        "<br/>La suppression est irrécupérable, veuillez confirmer !!!</div></div></div></div></div></div>"
        + "<div class='modal-footer center'>" +
        "<button type='button' class='btn btn-default' onclick='closeDialog()'>Annuler</button>" +
        "<button type='button' class='btn btn-inverse' itemId='" + itemId + "' onclick='return delete_line(this);'>SUPPRIMER</button></div>";
    bootbox.dialog({
        title: title,
        message: content
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
    return false;
}

function delete_line(sender) {
    var itemId = $(sender).attr('itemId') * 1;
    var sodId= getUrlVars()['sodId'];
    ShowPleaseWait();
    var url = window.webservicePath + "/DeleteSol";
    $.ajax({
        type: "POST",
        url: url,
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        data: "{sodId:'" + sodId+ "',solId:" + itemId + "}",
        success: function(data) {
            var jsdata = data.d;
            var data2Treat = jQuery.parseJSON(jsdata);
            if (data2Treat !== '-1') {
                HidePleaseWait();
                loadAllLines();
                loadSodPayementInfo();
            } else {
                HidePleaseWait();
                AuthencationError();
            }
        },
        error: function(data) {
            var test = '';
        }
    });
}

function uploadFile() {
    var title = "Télécharger un fichier";
    try {
        var content = "<div class='box'><div class='box-body' style='overflow-y:auto;overflow-x:hidden;'>" +
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
            "<span>Ajouter</span>" +
            "<input type='file' id='iptUploadFilePopUp' name='files[]' accept='application/pdf' onchange='getFileDataPopUp(this);'></span>" +
            "<button type='button' class='btn btn-inverse start' style='display: none;' id='btnSubmitUploadFilePopUp' onclick='return uploadFileClick()'><i class='fa fa-arrow-circle-o-up'></i><span>Télécharger</span></button>" +
            "<button type='reset' class='btn btn-inverse cancel'  style='display: none;' id='btnCancelUploadFilePopUp' onclick='return hideUploadPopUp()'><i class='fa fa-ban'></i><span>Annuler</span></button>" +
            "<button class='btn btn-default bootbox-close-button' style='display:none;' onclick='return false'><span>Annuler</span></button></div> <!-- The global progress information -->" +
            "<div class='col-md-12' style='text-align: center; margin-bottom: 20px;'>" +
            "<div>File Name : <span id='uploadFileNamePopUp'></span></div><br/>" +
            "</div></div></form>" +
            "</div></div></div>";

        bootbox.dialog({
            title: title,
            message: content
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

    } catch (e) {
    }
    return false;
}

function uploadFileClick() {
    var formData = new FormData(); 
    formData.append('file', $('#iptUploadFilePopUp')[0].files[0]);
    var itemId = getUrlVars()['sodId'];
    var url = "../../Services/UploadFilesGeneral.ashx?type=5&sodId=" + encodeURIComponent(itemId);
    if (itemId) {
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
                $('.bootbox-close-button').click();
                var src = "../Common/PageForPDF.aspx?type=5&sodId=" + encodeURIComponent(itemId);
                $('#iframepdf').attr('height', '1000');
                $('#iframepdf').attr('src', src);
                $('#btn_delete_cod_file').show();
                if ($('#a_collapse').attr('class') === "expand") {
                    $('#a_collapse').click();
                }
            },
            error: function (e) {
                //errorHandler
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
}

function delete_file_click() {
    var title = "ATTENTION";
    var content = "<div class='box'><div class='box-body' style='height: 100px;'>" +
        "<div class='form-horizontal'>" +
        "<div class='col-md-12'>" +
        "<div class='form-group'>" +
        "<div class='col-sm-12' style='text-align:center;font-size: 18pt;'>Veuillez confirmer la suppression ! " +
        "<br/>La suppression de fichier est irrécupérable, veuillez confirmer !!!</div></div></div></div></div></div>"
        + "<div class='modal-footer center'>" +
        "<button type='button' class='btn btn-default' onclick='closeDialog()'>Annuler</button>" +
        "<button type='button' class='btn btn-inverse' onclick='return deleteFile();'>SUPPRIMER</button></div>";
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

function deleteFile() {
    var sodId= getUrlVars()['sodId'];
    var url = window.webservicePath + "/DeleteSodFile";
    $.ajax({
        type: "POST",
        url: url,
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        data: "{sodId:'" + sodId+ "'}",
        success: function (data) {
            $('#iframepdf').attr('height', '0');
            if ($('#a_collapse').attr('class') !== "expand") {
                $('#a_collapse').click();
            }
            $('#btn_delete_cod_file').hide();
        },
        error: function (data) {
            var test = '';
        }
    });
}

function downloadPdf(sender) {
    var dfoId = getUrlVars()['sodId'];
    dfoId = encodeURIComponent(dfoId);
    window.open('../Common/PageDownLoad.aspx?sodId=' + dfoId, '_blank');
    return false;
}

function downloadPdfSup(sender) {
    var dfoId = getUrlVars()['sodId'];
    dfoId = encodeURIComponent(dfoId);
    window.open('../Common/PageDownLoad.aspx?sodId=' + dfoId+'&forsup=1', '_blank');
    return false;
}

function createSupplierFactureClick() {
 var title = "CONFIRMER";
    var content = "<div class='box'><div class='box-body' style='height: 100px;'>" +
        "<div class='form-horizontal'>" +
        "<div class='col-md-12'>" +
        "<div class='form-group'>" +
        "<div class='col-sm-12' style='text-align:center;font-size: 18pt;'>Veuillez confirmer. Si vous confirmez, la commande n\'est pas modifiables !</div></div></div></div></div></div>"
        + "<div class='modal-footer center'>" +
        "<button type='button' class='btn btn-default' onclick='closeDialog()'>Annuler</button>" +
        "<button type='button' class='btn btn-inverse' onclick='createSupplierInvoice()'>Valider</button></div>";
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

function createSupplierInvoice() {
    var sodId = getUrlVars()['sodId'];
    if (sodId) {
        var url = window.webservicePath + "/PassSod2Sin";
        myApp.showPleaseWait();
        var datastr = "{sodId:'" + sodId + "'}";
        $.ajax({
            type: "POST",
            url: url,
            contentType: "application/json; charset=utf-8",
            data: datastr,
            dataType: "json",
            success: function(data) {
                var jsdata = data.d;
                var data2Treat = jQuery.parseJSON(jsdata);
                if (data2Treat !== '-1') {
                    if (data2Treat !== '0' && data2Treat !== 0 && data2Treat !== "0") {
                        window.location = '../SupplierInvoice/SupplierInvoice.aspx?sinId=' + data2Treat + '&mode=view';
                    } else {
                        myApp.hidePleaseWait();
                        MsgErrorPopUp('Erreur', 'Cette commande est déjà validé, la validation n\'est pas effecturée');
                    }
                } else {
                    // authentication error
                    AuthencationError();
                }
            },
            error: function(data) {
                var test = '';
                myApp.hidePleaseWait();
            }
        });
    }
}

function goPin() {
    var fId = currentItem.PinFId;
    myApp.showPleaseWait();
    var url = '../PurchaseIntent/PurchaseIntent.aspx?pinId=' + fId + "&mode=view";
    window.location.href = url;
}

function consultPil(sender) {
    var pinId = $(sender).attr('pinId');
    var pilId = $(sender).attr('pilId') * 1;
    if (pilId != 0) {
        var url = '../PurchaseIntent/PurchaseIntent.aspx?pinId=' + pinId + "&mode=view&pilId=" + pilId;
        window.open(url, '_blank');
    }
    return false;
}

function goSin() {
    var fId = currentItem.SinFId;
    myApp.showPleaseWait();
    var url = '../SupplierInvoice/SupplierInvoice.aspx?sinId=' + fId + "&mode=view";
    window.location.href = url;
}

///set clickable lable for externe link
function setClickableLabel() {
    if (_isView) {
        $("#lb_supplier").addClass("animated_menu");
        $("#lb_supplier").prop('title', 'Cliquer pour consulter le fournisseur');
        $('#lb_supplier').css('cursor', 'pointer');
        
        $("#lb_subSup").addClass("animated_menu");
        $("#lb_subSup").prop('title', 'Cliquer pour consulter le fournisseur');
        $('#lb_subSup').css('cursor', 'pointer');
    }
}

function ExternLinkClick(sender) {
    if (_isView && currentItem) {
        ExternLinkBaseClick(sender, currentItem);
    }
}

function snapshotSpr(solId) {
    var sodId = getUrlVars()['sodId'];
    var url = '../../Views/PaymentRecord/SupplierOrderPR.aspx?solId=' + solId + '&sodId=' + sodId;
    pageSnapShotWithCloseFun(url,'loadSodPayementInfo()');
    return false;
}

function addSolExprss() {
 // 输入加入行数
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
            "<label class='col-sm-6 control-label fieldRequired'>Combien de ligne voulez-vous ajouter une fois (par défault 5 lignes)?<br>输入需要添加的行数，默认是5行</label>" +
            "<div class='col-sm-6'><input class='form-control' required='' id='sollines2add' type='number' min='0' step='1' name='sollines2add' value='5' /></div>" +
            "</div>" +
                 // close box
            "</div></div></div></div></div>";

    var btnAddUpdate = "<button class='btn btn-inverse' id='btn_add_sol_expr' name='btn_add_sol_expr' onclick='return AddSolExpr()'><span>Ajouter</span></button>";
    var btnClose = "<button class='btn btn-default bootbox-close-button' id='btn_add_sol_close' onclick='return false'><span>Annuler</span></button>";

    var btns = "<div class='modal-body center'>" + btnAddUpdate + btnClose + "</div>";
    var onecontent = startBox + onelineContent + btns + endBox;
    
    var title = "Ajouter Express";
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
            var h = (w - b) * 0.1;
            return h + "px";
        }
    }).find('.modal-header').css({
        'background': 'url(../../img/menu_005_bg.jpg) repeat-x',
        'text-align': 'center',
        'color': '#C0C0C0'
    });   
}

function AddSolExpr() {
    alert("Les champs avec <span style='color:red'>*</span> sont obligatoires, si laissez vide, cette ligne ne pourrais pas être ajoutée!!! <br> 带有<span style='color:red'>*</span>的区域是必填的，如果未填写，该行将不会被添加！！！");

    $('#btn_add_sol_close').click();
    var lineCount = $('#sollines2add').val() * 1;
    lineCount = lineCount > 0 ? lineCount : 5;
    
    // 新建相应行数
    var linecode = "";
    for (var i = 1; i <= lineCount; i++) {
        var style = i % 2 == 0 ? "style='background-color:azure'" : "";
        linecode += "<div class='form-group variant' >";
        
        
        // 1 序号
        linecode += "<div class='col-sm-1'><input " + style + " class='form-control' disabled lineid='" + i + "' id='sol_order_" + i + "' type='number' min='1' step='1' name='sol_order" + i + "' value='" + i + "'/></div>";
        linecode += "<div class='col-sm-1'><input " + style + " class='form-control' lineid='" + i + "' id='Cli_" + i + "' name='Cli_" + i + "' /></div>";
        // 2 品名
        linecode += "<div class='col-sm-2'><input " + style + " class='form-control' lineid='" + i + "' id='PrdId_" + i + "' name='PrdId_" + i + "' /></div>";
        // 3 描述
        linecode += "<div class='col-sm-2'><textarea " + style + " rows='2' class='form-control'  lineid='" + i + "'  id='Description_" + i + "' name='Description_" + i + "' ></textarea></div>";

        
        linecode += "<div class='col-sm-1'><input " + style + " class='form-control' lineid='" + i + "' id='FeatureCode_" + i + "' name='FeatureCode_" + i + "' /></div>";
        linecode += "<div class='col-sm-1 hidden'><input " + style + " class='form-control datepicker' lineid='" + i + "' id='Deadl_" + i + "' name='Deadl_" + i + "' /></div>";
        linecode += "<div class='col-sm-1'>" +
            "<select id='Logs_" + i + "' name='Logs_" + i + "' class='form-control' lineid='" + i + "' >" +
            "<option value='0' data-value='0' >N/A 不需运输</option>" +
            "<option value='1' data-value='1' >Avion le plus rapide 最快空运快递</option>" +
            "<option value='2' data-value='2'>Avion le moins cher 最经济空运</option>" +
            "<option value='3' data-value='3'>Bateau 船运</option>" +
            "</select></div>";

        // 4 数量
        linecode += "<div class='col-sm-1'><input " + style + " class='form-control'  lineid='" + i + "'  type='number' id='Quantity_" + i + "' name='Quantity_" + i + "' onkeyup='CalCulatePriceExp(this)' /></div>";
       
        // 5 单价
        linecode += "<div class='col-sm-1'><input " + style + " class='form-control'  lineid='" + i + "'  type='number' id='UnitPrice_" + i + "' name='UnitPrice_" + i + "' onkeyup='CalCulatePriceExp(this)' /></div>";
       
        // 6 税率 20210319
        linecode += "<div class='col-sm-1'>" +
            "<select id='sol_vat_" + i + "' name='sol_vat_" + i + "' class='form-control' lineid='" + i + "' >" +
            "</select></div>"; 
        // 7 总价
        linecode += "<div class='col-sm-1'><input " + style + " class='form-control'  lineid='" + i + "'  type='number' id='TotalPrice_" + i + "' name='TotalPrice_" + i + "' onkeyup='CalCulatePriceExp(this)' /></div>";
        linecode += "</div>";
    }

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
            "<label class='col-sm-1 control-label fieldRequired' style='text-align:center' >Numéro 序号</label>" +
            "<label class='col-sm-1 control-label ' style='text-align:center' >Client 客户</label>" +
            "<label class='col-sm-2 control-label fieldRequired' style='text-align:center'>Item Nom / Model 产品</label>" +
            "<label class='col-sm-2 control-label ' style='text-align:center'>Description 描述</label>" +
            "<label class='col-sm-1 control-label ' style='text-align:center' title='用于搜索和记忆'>Code function 特征码<i class='fa fa-question-circle'></i></label>" +
            "<label class='col-sm-1 control-label ' style='text-align:center;display:none;'>Deadline 最后期限</label>" +
            "<label class='col-sm-1 control-label ' style='text-align:center'>Logistic 物流方式</label>" +
            "<label class='col-sm-1 control-label fieldRequired' style='text-align:center'>Quantité 数量</label>" +
            "<label class='col-sm-1 control-label fieldRequired' style='text-align:center'>Prix U 单价</label>" +
            "<label class='col-sm-1 control-label fieldRequired' style='text-align:center'>TVA 税率</label>" +
            "<label class='col-sm-1 control-label fieldRequired' style='text-align:center'>Total HT 未税总价</label>" +
            "</div>" +
            linecode+
       
            "</div></div></div></div></div>";

    var btnAddUpdate = "<button class='btn btn-inverse' id='btn_add_sol' name='btn_add_sol' onclick='return addLineExpClick(this)'><span>Ajouter 添加</span></button>";
    var btnClose = "<button class='btn btn-default bootbox-close-button' onclick='return false'><span>Annuler 取消</span></button>";

    var btns = "<div class='modal-body center'>" + btnAddUpdate + btnClose + "</div>";
    var onecontent = startBox + onelineContent + btns + endBox;
    
    var title = "Ajouter Express";
    bootbox.dialog({
        title: title,
        message: onecontent
    }).find('.modal-dialog').css({
        'width': '90%'
    }).find('.modal-content').css({
        'margin-top': function() {
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


    //$("input[id^='RefSupplier']").val(data2Treat.SprPrdRef);
    
    if (allTVA) {
//        var budgetId = '#tva_all';
//        $(budgetId).empty();
        $.each(allTVA, function(name, value) {
            if (value.Key == 4) {
                $("select[id^='sol_vat_']").append($("<option></option>").attr("value", value.Key).attr("data-value", value.DcValue).attr("selected", true).text(value.Value));
            } else {
                $("select[id^='sol_vat_']").append($("<option></option>").attr("value", value.Key).attr("data-value", value.DcValue).text(value.Value));
            }
        });
    }

    $.each($('.datepicker'), function (idx, value) {
        $(value).datepicker();
    });
    return false;
}

function CalCulatePriceExp(sender) {
    var lineId = $(sender).attr('lineId');
    var quantity = $('#Quantity_' + lineId).val() * 1;
    var unitprice = $('#UnitPrice_' + lineId).val() * 1;
    var totalHT = $('#TotalPrice_' + lineId);
    var _total_ht = quantity * unitprice;
    _total_ht = _total_ht.toFixed(3);
    totalHT.val(_total_ht);
}

function addLineExpClick(sender) {
    $(sender).prop('disabled', true);
    var allLines = $("input[id^='sol_order_']");
    var line2add = [];
    $.each(allLines, function(name, value) {
        var lineId = $(value).attr('lineid') * 1;
        var order = $(value).val() * 1;
        var PrdId = $('#PrdId_' + lineId);
        var Quantity = $('#Quantity_' + lineId);
        var Description = $('#Description_' + lineId);
        var UnitPrice = $('#UnitPrice_' + lineId);
        var TotalPrice = $('#TotalPrice_' + lineId);
        var Deadline = $('#Deadl_' + lineId);
        var Logs = $('#Logs_' + lineId);
        var FeatureCode = $('#FeatureCode_' + lineId);
        var Client = $('#Cli_' + lineId);
        var VatId = $('#sol_vat_' + lineId + ' :selected').val() * 1;

        var PrdName = PrdId.val().trim();
        var Qty = Quantity.val().trim() * 1;
        var PU = UnitPrice.val().trim() * 1;
        var PT = TotalPrice.val().trim() * 1;

        if (PrdName != '' && Qty != 0) {
            var PurchaseLineBaseClass = {};
            PurchaseLineBaseClass.Order = order;
            PurchaseLineBaseClass.PrdName = PrdName;
            PurchaseLineBaseClass.Quantity = Qty;
            PurchaseLineBaseClass.UnitPrice = PU;
            PurchaseLineBaseClass.TotalPrice = PT;
            PurchaseLineBaseClass.Description = Description.val().trim();
            PurchaseLineBaseClass.Deadline = getDateStringNullable(Deadline.val());
            PurchaseLineBaseClass.Logistic = Logs.val();
            PurchaseLineBaseClass.FeatureCode = FeatureCode.val().trim();
            PurchaseLineBaseClass.Client = Client.val().trim();
            PurchaseLineBaseClass.VatId = VatId;
            line2add.push(PurchaseLineBaseClass);
        }
    });
    var sodId = getUrlVars()['sodId'];
    if (line2add.length > 0 && sodId) {
        var jsondata = JSON.stringify({ line2add: line2add, sodId: sodId });
        var url = window.webservicePath + "/InsertSolExpress";
        $.ajax({
            url: url,
            type: 'POST',
            contentType: 'application/json; charset=utf-8',
            data: jsondata,
            dataType: 'json',
            success: function(data) {
                $(sender).prop('disabled', false);
                $('.bootbox-close-button').click();
                loadAllLines();
                loadSodPayementInfo();
            },
            error: function(data) {
                $(sender).prop('disabled', false);
                alert(data.responseText);
                loadSodPayementInfo();
                loadSodDocInfo();
            }
        });
    } else {
        $(sender).prop('disabled', false);
    }
    return false;
}

function importerExcel() {
    var startBox = "<div class='box'><div class='box-body'>";
    var endBox = "</div></div>";

    var onelineContent =
        // start box
        "<div class='form-group' id='div_one_line'>" +
            "<div class='row'>" +
            "<div class='col-md-12'>" +
            "<div class='box-body'>" +
            "<div class='form-horizontal'>" +
            "<div class='form-group'><label class='col-sm-12' style='text-align:center'>Veuillez coller les contenues d'excel en bas</br>请将Excel表格内容复制到下面</label></div>" +
            "<div class='form-group'>" +
            "<div class='col-sm-12'><textarea row='8' id='SolContent' class='form-control' style='height:400px'></textarea></div>" +
            "</div>"+
    // close box
            "</div></div></div></div></div>";

    var btnAddUpdate = "<button class='btn btn-inverse' id='btn_add_sols' name='btn_add_sols'  onclick='return SaveSolsExcel(this)'><span>Sauvegarder</span></button>";
    var btnClose = "<button class='btn btn-default bootbox-close-button' id='btn_close_cin_payment' onclick='return false'><span>Annuler</span></button>";

    var btns = "<div class='modal-body center'>" + btnClose + btnAddUpdate + "</div>";
    var onecontent = startBox + onelineContent + btns + endBox;

    var title = 'PAIEMENT';
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
            var h = (w - b) * 0.15;
            return h + "px";
        }
    }).find('.modal-header').css({
        'background': 'url(../../img/menu_005_bg.jpg) repeat-x',
        'text-align': 'center',
        'color': '#C0C0C0'
    });
    
    return false;
}

function SaveSolsExcel(sender) {
    ShowPleaseWait();
    var sodId = getUrlVars()['sodId'];
    var content = $('#SolContent').val();
    if (!IsNullOrEmpty(content)) {
        var solLines = content.split('\t');
        var alllinecout = solLines.length;
        if (alllinecout < 9) {
            HidePleaseWait();
            alert('Format error !</br>格式错误 ！');
        } else {
            var sols2Insert = [];
            var onesol = {};
            onesol.SodFId = sodId;
            for (var i = 0; i < alllinecout; i++) {
                if (i !== 0 && (i % 9 == 0)) {
                    sols2Insert.push(onesol);
                    onesol = {};
                    onesol.SodFId = sodId;
                }
                if (i % 9 === 0) {
                    var name = replaceAll(solLines[i], '\r\n', '');
                    name = replaceAll(name, '\n', '');
                    name = replaceAll(name, '\r', '');
                    onesol.PrdName = name;
                }
                if (i % 9 === 3) {
                    var description = solLines[i];
                    try {
                        description = description.substring(1);
                        var len = description.length;
                        description = description.substring(0, len - 1);
                    } catch (e) {

                    }
                    onesol.Description = description;
                }
                if (i % 9 === 5) {
                    onesol.Quantity = solLines[i] * 1;
                }
                if (i % 9 === 6) {
                    var up = replaceAll(solLines[i], '€', '');
                    up = up.replace(/\$/g, '');//replaceAll(up, '$', '');
                    up = replaceAll(up, ' ', '');
                    up = up.replace(',', '.') * 1;
                    onesol.UnitPrice = up;
                }
                if (i % 9 === 8) {
                    var pt = replaceAll(solLines[i], '€', '');
                    pt = pt.replace(/\$/g, '');//replaceAll(pt, '$', '');
                    pt = replaceAll(pt, ' ', '');
                    pt = pt.replace(',', '.') * 1;
                    onesol.TotalPrice = pt;
                }
            }

            //console.log(sols2Insert);
            if (!IsNullOrEmpty(sodId) && sols2Insert.length > 0) {

                var jsondata = JSON.stringify({ lines: sols2Insert });
                var url = window.webservicePath + "/InsertSolsByExcelLines";
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
                        if (data2Treat !== '-1') {
                            if (data2Treat !== '0') {
                                loadAllLines();
                                loadSodPayementInfo();
                                $('.bootbox-close-button').click();
                            } else {
                                alert('Veuillez contacter l\'administrateur, 请联系管理员');
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
            HidePleaseWait();
                alert('Format error !</br>格式错误 ！');
            }
        }
    } else {
            HidePleaseWait();
        alert('Veuillez remplir le TEXTAREA !</br>请填写内容 ！');
    }
    return false;
}

function OpenSpr(solId) {

   var startBox = "<div class='box'><div class='box-body'>";
    var endBox = "</div></div>";

    var sprcontent = "<div class='col-md-12'><div class='box border inverse' style='max-height: 800px; overflow-y: auto;'><div class='modal-body center'><button type='button' class='btn btn-inverse' onclick='return addSOPayementRecord(0)'>Ajouter un dossier de paiement</button></div><div class='box-body'><div class='form-horizontal' id='div_new_record'></div></div><div class='box-body'><div class='form-horizontal' id='div_done_record'><table id='datatable_search_result' cellpadding='0' cellspacing='0' border='0' class='datatable table table-striped table-bordered table-hover'><thead id='thead_search_result'><tr><th>D. Création 创建日期</th><th>D. MAJ 更新日期</th><th>D. Paiement 支付日期</th><th>Montant de paiement 支付金额</th><th>Commentaire 支付备注</th><th></th></tr></thead><tbody id='tbody_search_result'></tbody><tfoot id='tfoot_search_result'><tr><th>D. Création 创建日期</th><th>D. MAJ 更新日期</th><th>D. Paiement 支付日期</th><th>Montant de paiement 支付金额</th><th>Commentaire 支付备注</th><th></th></tr></tfoot></table></div></div></div></div>";


    var onelineContent =
        // start box
        "<div class='form-group' id='div_one_line'>" +
            "<div class='row'>" +
            "<div class='col-md-12'>" +
            "<div class='box-body'>" +
            "<div class='form-horizontal'>" +
            "<div class='form-group'>" +
            sprcontent+
            "</div>"+
    // close box
            "</div></div></div></div></div>";

    //var btnAddUpdate = "<button class='btn btn-inverse' id='btn_add_sols' name='btn_add_sols'  onclick='return SaveSolsExcel(this)'><span>Sauvegarder</span></button>";
    var btnClose = "<button class='btn btn-default bootbox-close-button' id='btn_close_cin_payment' onclick='return false'><span>Clôturer</span></button>";

    var btns = "<div class='modal-body center'>" + btnClose  + "</div>";
    var onecontent = startBox + onelineContent + btns + endBox;

    var title = 'Dossier de paiement de la commande fournisseur';
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
            var h = (w - b) * 0.15;
            return h + "px";
        }
    }).find('.modal-header').css({
        'background': 'url(../../img/menu_005_bg.jpg) repeat-x',
        'text-align': 'center',
        'color': '#C0C0C0'
    });
    
    
    var sodId = getUrlVars()['sodId'];
        LoadAllSolPr(solId, sodId);

    return false;
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
                    var noresult = "<tr><td colspan='6' style='text-align:center; color:red;'>Aucun résultat trouvé 没有任何支付信息</td></tr>";
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
                            loadSodPayementInfo();
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


var allclient = [];
function js_getClient() {
    var url = window.webservicePath + "/GetAllClients";
    $.ajax({
        type: "POST",
        url: url,
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        success: function (data) {
            var jsdata = data.d;
            var data2Treat = jQuery.parseJSON(jsdata);
            if (data2Treat !== '-1') {
                allclient = [];
                allclient = data2Treat;
                //console.log(allclient);
                getCurrentSoc();
                if (itemLines.length > 0 && !sodhasCin) {
                    $('#btn_create_cin').show();
                } else {
                    $('#btn_create_cin').hide();
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

function createCinClick() {
    var startBox = "<div class='box'><div class='box-body'>";
    var endBox = "</div></div>";
    var onelineContent =
        // start box
        "<div class='form-group' id='div_one_line'>" +
            "<div class='row'>" +
            "<div class='col-md-12'>" +
            "<div class='box-body'>" +
            "<div class='form-horizontal'>" +
            "<div class='form-group'><label class='col-sm-12' style='text-align:center'>Veuillez sélectionner un client 请选择一个客户</label></div>" +
            // new line
            "<div class='form-group'>" +
            "<label class='col-sm-4 control-label fieldRequired'>Client 客户</label>" +
            "<div class='col-sm-5'><select type='text' class='form-control' id='cinClient' name='cinClient' required='' onchange='cinClientChanged(this)'></select></div>" +
            "<div class='col-sm-3'></div>" +
            "</div>" +
            // new line
            "<div class='form-group'>" +
            "<label class='col-sm-4 control-label'>Bank info 银行信息</label>" +
            "<div class='col-sm-5'><select type='text' class='form-control' id='CinBank' name='CinBank'></select></div>" +
            "<div class='col-sm-3'></div>" +
            "</div>" +
            // new line
            "<div class='form-group'>" +
            "<label class='col-sm-4 control-label' title='The invoice unit price will be calculated by multiplying the unit price by the coefficient 发票单价将由单价乘以该系数得出'>U.P Coefficient 单价系数</label>" +
            "<div class='col-sm-5'><input type='number' class='form-control' id='CoefSodCin' name='CoefSodCin' required='' value='" + SodCinCoef + "' step='0.1'/></div>" +
            "<div class='col-sm-3'></div>" +
            "</div>" +
            // new line
            "<div class='form-group'>" +
            "<label class='col-sm-4 control-label'>Sélectionner une facture client si besoin 如有需要选择已有发票</label>" +
            "<div class='col-sm-5'><select type='text' class='form-control' id='ClientInvoiceList' name='ClientInvoiceList' style='display:none'></select><input class='form-control' id='CinList' name='CinList' /></div>" +
            "<div class='col-sm-3'></div>" +
            "</div>" +
            // new line
            "<div class='form-group'>" +
            "<label class='col-sm-4 control-label'>Date de création de la facture (ça décide le code de facture) 选择创建日期，这将决定CI编号</label>" +
            "<div class='col-sm-5'>" +
            "<div class='input-group'>" +
            "<input type='text' class='form-control datepicker ' id='SodCinDCreate' name='SodCinDCreate' disabled/><span class='input-group-addon'><i class='fa fa-calendar'></i></span>" +
            "</div>" +
            "</div>" +
            "<div class='col-sm-3'></div>" +
            "</div>" +
            // close box
            "</div></div></div></div></div>";

    var btnAddUpdate = "<button class='btn btn-inverse' id='btn_cin_create' name='btn_cin_create' onclick='return CreateCin(this)'><span>Créer 新建</span></button>";
    var btnClose = "<button class='btn btn-default bootbox-close-button' id='btn_close_cin_payment' onclick='return false'><span>Annuler 取消</span></button>";

    var btns = "<div class='modal-body center'>" + btnClose + btnAddUpdate + "</div>";
    var onecontent = startBox + onelineContent + btns + endBox;

    var title = 'Créer facture client 新建客户发票';
    bootbox.dialog({
        title: title,
        message: onecontent
    }).find('.modal-dialog').css({
        'width': '50%'
    }).find('.modal-content').css({
        'margin-top': function () {
            var w = $(window).height();
            var b = $(".modal-dialog").height();
            // should not be (w-h)/2
            var h = (w - b) * 0.15;
            return h + "px";
        }
    }).find('.modal-header').css({
        'background': 'url(../../img/menu_005_bg.jpg) repeat-x',
        'text-align': 'center',
        'color': '#C0C0C0'
    });
    $.each(allclient, function(name, value) {
        if (value.Id == currentItem.CliId) {
            $('#cinClient').append($("<option></option>")
                .attr("value", value.Id)
                .attr("data-value", value.FId)
                .text(value.CompanyName).attr("selected", true));
        } else {
            $('#cinClient').append($("<option></option>")
                .attr("value", value.Id)
                .attr("data-value", value.FId)
                .text(value.CompanyName));
        }
    });
    $('#cinClient').change();

    
    $.each($('.datepicker'), function(idx, value) {
        $(value).datepicker();
    });
    var today = getToday();
    $('#SodCinDCreate').val(today);

    $.each(bankinfors, function(order, oneinfo) {
        $('#CinBank').append($("<option>" + oneinfo.RibAbre + "</option>").attr("value", oneinfo.CinBank));
    });

    setAutoCompleteCin();

    if (!jQuery.isEmptyObject(connectedUser) && connectedUser.LoginMode === 1) {
        $('#SodCinDCreate').prop("disabled", false);
    }
    return false;
}

var selectedClientFId = '';
function cinClientChanged(sender) {
    selectedClientFId = $('#cinClient :selected').attr('data-value');
}

var cinFIdseleced = '0';
var cinListForAvoir = [];
function setAutoCompleteCin() {
    var url = window.webservicePath + "/GetCinForAvoirWithCinCode";
    //var cliFId = $('#cinClient :selected').attr('data-value');
    $("#CinList").autocomplete({
        source: function(request, response) {
            $.ajax({
                url: url,
                data: "{ 'cincode': '" + request.term + "', 'cliFId': '" + selectedClientFId + "'}",
                dataType: "json",
                type: "POST",
                contentType: "application/json; charset=utf-8",
                success: function(data) {
                    cinFIdseleced = '0';
                    var jsdata = data.d;
                    var data2Treat = jQuery.parseJSON(jsdata);
                    cinListForAvoir = [];
                    cinListForAvoir = data2Treat;
                    if (data2Treat.length > 0) {
                        response($.map(data2Treat, function(item) {
                            return {
                                label: item.CinCode + " || € " + item.CinAmount.toLocaleString(),
                                val: item.FId,
                            }
                        }));
                    } else {
                    }
                },
                error: function(response) {
//                    alert(response.responseText);
//                    console.log(response);
                },
                failure: function(response) {
                    alert(response.responseText);
                }
            });
        },
        select: function(e, i) {
            cinFIdseleced = i.item.val;
        },
        minLength: 2
    });
}


function CreateCin(sender) {
    $(sender).prop('disabled', true);
    $.each(allclient, function(name, value) {
        $('#cinClient').append($("<option></option>")
            .attr("data-value", value.FId)
            .text(value.CompanyName));
    });
    var cliFId = $('#cinClient :selected').attr('data-value');
    if (typeof cliFId === "undefined") {
        $(sender).prop('disabled', false);
        alert('Veuillez sélectionner un client 请选择一个客户');
    } else {
        ShowPleaseWait();
        var cinBank = $('#CinBank :selected').val();
        if (IsNullOrEmpty(cinBank)) {
            cinBank = 1;
        } else {
            cinBank = cinBank * 1;
        }
        var coef = $('#CoefSodCin').val().replace(',', '.').replace(' ', '') * 1;
        var cinFId = cinFIdseleced;
        var cinInputvalue = $('#CinList').val();
        if (IsNullOrEmpty(cinInputvalue)) {
            cinFId = '';
        }
        var dCreate = $('#SodCinDCreate').val();
        var url = window.webservicePath + "/CreateCinFromSod";
        var sodId = getUrlVars()['sodId'];
        var datastr = "{'sodId':'" + sodId + "','cliId':'" + cliFId + "','cinBank':'" + cinBank + "', 'coef':" + coef + ", 'cinFId':'" + cinFId + "', 'dCreate':'" + dCreate + "', 'cinCode':'" + cinInputvalue + "'}";
        $.ajax({
            type: "POST",
            url: url,
            contentType: "application/json; charset=utf-8",
            data: datastr,
            dataType: "json",
            success: function(data) {
                var jsdata = data.d;
                var data2Treat = jQuery.parseJSON(jsdata);
                if (data2Treat !== '-1') {
                    HidePleaseWait();
                    if (data2Treat !== '0') {
                        var cinId = data2Treat;
                        //var url = 'ClientInvoice.aspx';
                        var newUrl = '../ClientInvoice/ClientInvoice.aspx' + '?cinId=' + cinId + '&mode=view';
                        document.location.href = newUrl;
                    } else {
                        alert('Error !!! Please contact administrator');
                    }
                } else {
                    // authentication error
                    HidePleaseWait();
                    AuthencationError();
                }
            },
            error: function(data) {
                $(sender).prop('disabled', false);
                HidePleaseWait();
                var test = '';
            }
        });
    }
    return false;
}

function viewCin(sender) {
    ShowPleaseWait();
    var cinFId = $(sender).attr('cinid');
    var url = '../ClientInvoice/ClientInvoice.aspx' + '?cinId=' + cinFId + '&mode=view';
    HidePleaseWait();
    var win = window.open(url, '_blank');
    win.focus();
}


var society = [];
var bankinfors = [];
function getCurrentSoc (){
    society = [];
    var url = window.webservicePath + "/GetCurrentSociety";
    $.ajax({
        type: "POST",
        url: url,
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        success: function (data) {
            var jsdata = data.d;
            var data2Treat = jQuery.parseJSON(jsdata);
            society = data2Treat;
            bankinfors = [];
            // for bank info
            var bankinfo1 = [];
            bankinfo1.RibAbre = society.RibAbre;
            bankinfo1.RibName = society.RibName;
            bankinfo1.RibAddress = society.RibAddress;
            bankinfo1.RibCodeIban = society.RibCodeIban;
            bankinfo1.RibCodeBic = society.RibCodeBic;
            bankinfo1.RibBankCode = society.RibBankCode;
            bankinfo1.RibAgenceCode = society.RibAgenceCode;
            bankinfo1.RibAccountNumber = society.RibAccountNumber;
            bankinfo1.RibKey = society.RibKey;
            bankinfo1.RibDomiciliationAgency = society.RibDomiciliationAgency;
            bankinfo1.CinBank = 1;

            var bankinfo2 = [];
            bankinfo2.RibAbre = society.RibAbre2;
            bankinfo2.RibName = society.RibName2;
            bankinfo2.RibAddress = society.RibAddress2;
            bankinfo2.RibCodeIban = society.RibCodeIban2;
            bankinfo2.RibCodeBic = society.RibCodeBic2;
            bankinfo2.RibBankCode = society.RibBankCode2;
            bankinfo2.RibAgenceCode = society.RibAgenceCode2;
            bankinfo2.RibAccountNumber = society.RibAccountNumber2;
            bankinfo2.RibKey = society.RibKey2;
            bankinfo2.RibDomiciliationAgency = society.RibDomiciliationAgency2;
            bankinfo2.CinBank = 2;
            
            bankinfors.push(bankinfo1);
            if (!IsNullOrEmpty(bankinfo2.RibAbre)) {
                bankinfors.push(bankinfo2);
            }
        },
        error: function (data) {
            HidePleaseWait();
            var test = '';
        }
    });
}

function changeAllLog() {
 var startBox = "<div class='box'><div class='box-body'>";
    var endBox = "</div></div>";
    var onelineContent =
        // start box
        "<div class='form-group' id='div_one_line'>" +
            "<div class='row'>" +
            "<div class='col-md-12'>" +
            "<div class='box-body'>" +
            "<div class='form-horizontal'>" +
            "<div class='form-group'><label class='col-sm-12' style='text-align:center'>Veuillez sélectionner un logistique 请选择一个物流</label></div>" +
            // new line
            "<div class='form-group'>" +
            "<label class='col-sm-4 control-label fieldRequired'>Logistique 物流方式</label>" +
            "<div class='col-sm-5'><select id='Logs_all' name='Logs_all' class='form-control' >" +
            "<option value='0' data-value='0' >N/A 不需运输</option>" +
            "<option value='1' data-value='1'  >Avion le plus rapide 最快空运快递</option>" +
            "<option value='2' data-value='2' >Avion le moins cher 最经济空运</option>" +
            "<option value='3' data-value='3' >Bateau 船运</option></select></div>" +
            "<div class='col-sm-3'></div>" +
            "</div>" +
            // close box
            "</div></div></div></div></div>";

    var btnAddUpdate = "<button class='btn btn-inverse' id='btn_modify_log' name='btn_cin_create' onclick='return ChangeAllSodLog()'><span>Changer touts 全部修改</span></button>";
    var btnClose = "<button class='btn btn-default bootbox-close-button' id='btn_changesodlog_cancel' onclick='return false'><span>Annuler 取消</span></button>";

    var btns = "<div class='modal-body center'>" + btnClose + btnAddUpdate + "</div>";
    var onecontent = startBox + onelineContent + btns + endBox;
    
    var title = 'Réinitialiser logistique 重置物流';
    bootbox.dialog({
        title: title,
        message: onecontent
    }).find('.modal-dialog').css({
        'width': '50%'
    }).find('.modal-content').css({
        'margin-top': function () {
            var w = $(window).height();
            var b = $(".modal-dialog").height();
            // should not be (w-h)/2
            var h = (w - b) * 0.15;
            return h + "px";
        }
    }).find('.modal-header').css({
        'background': 'url(../../img/menu_005_bg.jpg) repeat-x',
        'text-align': 'center',
        'color': '#C0C0C0'
    });

    return false;
}

function ChangeAllSodLog() {
    var logId = $('#Logs_all :selected').val() * 1;
    if (IsNullOrEmpty(logId)) {
        logId = 0;
    }
    var sodId = getUrlVars()['sodId'];

    // UpdateSolLogistic
    var url = window.webservicePath + "/UpdateSolLogistic";
    var datastr = "{'sodId':'" + sodId + "','logId':'" + logId + "'}";
    $.ajax({
        type: "POST",
        url: url,
        contentType: "application/json; charset=utf-8",
        data: datastr,
        dataType: "json",
        success: function(data) {
            var jsdata = data.d;
            var jsondata = jQuery.parseJSON(jsdata);
            if (jsondata !== '-1') {
                HidePleaseWait();
                itemLines = [];
                itemLines = jsondata;
                if (itemLines.length > 0 && !sodhasCin) {
                    $('#btn_generate_pdf').show();
                    $('#btn_create_cin').show();
                    $('#btn_generate_pdf_sup').show();
                    $("#btn_validate_costplan").show();
                    if (!currentItem.SodHasSin) {
                        //$('#btn_create_supplier_invoice').show();
                        $('#btn_create_supplier_invoice').hide();
                    } else {
                        $('#btn_create_supplier_invoice').hide();
                    }
                } else {
                    $('#btn_delete').show();
                    $('#btn_generate_pdf').hide();
                    //$('#btn_create_cin').hide();
                    $('#btn_generate_pdf_sup').hide();
                    $("#btn_validate_costplan").hide();
                    $('#btn_create_supplier_invoice').hide();
                }
                $('#tbody_lines').empty();
               var hasAnyLgl= setSolLines(jsondata);

                if (hasAnyLgl) {
                    $('#btn_delete').hide();
                } else {
                    $('#btn_delete').show();
                }
                HidePleaseWait();
                var solId = getUrlVars()['solId'];
                if (solId) {
                    var btnupsol = $('#btn_up_sol_' + solId);
                    if (btnupsol.attr('itemId') == solId && !solIsSet && !paraClicked) {
                        solIsSet = true;
                        paraClicked = true;
                        btnupsol.click();
                    }
                }
                //$('#tbody_lines')

            } else {
                // authentication error
                HidePleaseWait();
                AuthencationError();
            }
        },
        error: function(data) {
            HidePleaseWait();
            var test = '';
        }
    });
    $('#btn_changesodlog_cancel').click();
    return false;
}

function setSolLines(jsondata) {
    var hasAnyLgl = false;
    var linecount = 1;
    var totalht = 0;
    var totalttc = 0;
    $.each(jsondata, function(name, value) {
        var lineclass = (linecount % 2 === 1) ? "odd" : "even";
        var prdname = value.PrdName;
        var pitname = IsNullOrEmpty(value.PitName) ? '' : value.PitName;
        var quantity = value.Quantity;
        var supPrdref = IsNullOrEmpty(value.SupplierRef) ? '' : value.SupplierRef;
        //var description = replaceAll(value.PrdDescription, '\n', '</br>') + '</br>---------------------------</br>' + replaceAll(value.Description, '\n', '</br>');

        var itemId = value.SolId;

        var CliName = IsNullOrEmpty(value.Client) ? '' : value.Client;
        var Power = value.Power;
        var Driver = value.Driver;
        var Length = value.Length;
        var Width = value.Width;
        var Height = value.Height;
        var UGR = value.UGR;
        var LumEff = value.Efflum;
        var CRI = value.CRI;
        var Logistic = value.Logistic;
        var TempColor = value.TempColor;
        Logistic =Logistic == 0 ?'N/A 不需运输' : Logistic == 1 ? 'Avion le plus rapide 最快空运快递' : Logistic == 2 ? 'Avion le moins cher 最经济快递' : 'Bateau 船运';
        var DeadLine = getDateString(value.Deadline);

        // description
        var desPrd = (value.PrdDescription == "" || value.PrdDescription == '' || value.PrdDescription == null) ?
            '' : value.PrdDescription;
        desPrd = replaceAll(desPrd, '\n', '</br>');
        var newline = ((desPrd != '' && desPrd != null && desPrd != 'null') ? '</br>---------------------------</br>' : '');
        var description = desPrd + newline + replaceAll(value.Description, '\n', '</br>');
        var comment = replaceAll(value.Comment, '\n', '</br>');
        comment = (comment != '' && comment != null && comment != 'null') ? comment : '';
        newline = ((comment != '' && comment != null && comment != 'null') ? '</br>---------------------------</br>' : '');
        description += newline + replaceAll(comment, '\n', '</br>');
        description = (description == "" || description == '' || description == null) ? '' : description;
        description = replaceAll(description, '\n', '</br>');
        var otherInfo = (IsNullOrEmpty(Power > 0) ? "" : "Puissance : " + Power + " W</br>") +
        (IsNullOrEmpty(Driver) ? "" : "Driver : " + Driver + "</br>") +
        (IsNullOrEmpty(TempColor) ? "" : "Température couleur : " + TempColor + " K</br>") +
        (IsNullOrEmpty(Length) ? "" : "Longueur : " + Length + " mm</br>") +
        (IsNullOrEmpty(Width) ? "" : "Largeur : " + Width + " mm</br>") +
        (IsNullOrEmpty(Height) ? "" : "Hauteur : " + Height + " mm</br>") +
        (IsNullOrEmpty(LumEff) ? "" : "Efficacité lumineuse ≥ " + LumEff + " lum/w</br>") +
        (IsNullOrEmpty(UGR) ? "" : "UGR ≤ " + UGR + "</br>") +
        (IsNullOrEmpty(CRI) ? "" : "CRI ≥ " + CRI + "</br>");
        newline = (description != '' && otherInfo != '' ? '</br>---------------------------</br>' : '');
        var infocompl = description + newline + replaceAll(otherInfo, '\n', '</br>');
        // description

        // shipping and production information
        var DProduction = getDateString(value.DProduction);
        var DExpDelivery = getDateString(value.DExpDelivery);
        var DDelivery = getDateString(value.DDelivery);
        var DShipping = getDateString(value.DShipping);
        var DExpArrival = getDateString(value.DExpArrival);
        var FeatureCode = value.FeatureCode;
        var Transporter = value.Transporter;
        var LogsNbr = value.LogsNbr;
        var Logistic = value.Logistic;
        Logistic =Logistic == 0 ?'N/A 不需运输' : Logistic == 1 ? 'Avion le plus rapide 最快空运快递' : Logistic == 2 ? 'Avion le moins cher 最经济快递' : 'Bateau 船运';

        var infoShipPrd = ("<span style='color:red;'>Logistique 运货方式 : </br>" + Logistic + "</span></br>") +
        (IsNullOrEmpty(DProduction) ? "" : "D.Prod. 开始生产日期 : " + DProduction + "</br>") +
        (IsNullOrEmpty(DExpDelivery) ? "" : "D. achèvmt. prv. 预计交期 : " + DExpDelivery + "</br>") +
        (IsNullOrEmpty(DDelivery) ? "" : "D. achèvmt. rél. 实际交期 : " + DDelivery + "</br>") +
        (IsNullOrEmpty(DShipping) ? "" : "D. expé. 发货日期 : " + DShipping + "</br>") +
        (IsNullOrEmpty(DExpArrival) ? "" : "D. arr. prv. 预计到达日期 : " + DExpArrival + "</br>") +
        //(IsNullOrEmpty(Transporter) ? "" : "Transporteur 物流公司 : " + Transporter + "</br>") +
        //(IsNullOrEmpty(LogsNbr) ? "" : "Logis Num. 物流编号 : " + LogsNbr + "</br>") +
        (IsNullOrEmpty(FeatureCode) ? "" : "<span style='color:red;'>Code fonct. 特征码 : " + FeatureCode + "</span></br>");


        var transportinfo = '';
        var lgscount = 1;
        $.each(value.LgsInfos, function(lglname, lglvalue) {
            transportinfo += "<span onclick='viewLgs(\"" + lglvalue.Value4 + "\")' style='cursor:pointer;font-weight:bolder;'>" + lgscount + '=>' + lglvalue.Key2 + ' * ' + lglvalue.Value + '(' + lglvalue.Value2 + ') | ' + lglvalue.Value3 + '</span><br/>';
            lgscount ++;
        });

//         (IsNullOrEmpty(Transporter) ? "" : "Transporteur 物流公司 : " + Transporter + "</br>") +
//        (IsNullOrEmpty(LogsNbr) ? "" : "Logis Num. 物流编号 : " + LogsNbr + "</br>") ;

        var oneline = "<tr class='" + lineclass + "'>" +
            "<td class='label_left' style='cursor: pointer;' itemId='" + itemId + "'  onclick='return modify_line_click(this)'>" + value.Order + "</td>" +
            "<td class='label_left'  style='cursor: pointer;' itemId='" + itemId + "'  onclick='return modify_line_click(this)'>" + CliName + "</td>" +
            //"<td class='label_left'  style='cursor: pointer;' itemId='" + itemId + "'  onclick='return modify_line_click(this)'>" + DeadLine + "</td>" +
            "<td class='label_left' style='cursor: pointer; width:10%;' itemId='" + itemId + "'  onclick='return modify_line_click(this)'>" + prdname + "</td>" +
            "<td class='label_left'>" + pitname + "</td>" +
            "<td class='label_left'>" + supPrdref + "</td>" +
            "<td class='label_left'>" + infocompl + "</td>" +
            "<td class='label_left'>" + infoShipPrd + "</td>" +
            "<td>" + (value.PrdImgPath ? ("<img src='../../Services/ShowOutSiteImage.ashx?file=" + value.PrdImgPath + "' height='40' width='40' />") : "") + "</td>" +
            "<td class='label_right'>" + quantity + "</td>" +
            "<td class='label_right'><span style='color:red'>" + value.DeliveriedQuantity + "</span></td>" +
            "<td class='label_right'>" + value.UnitPrice + "</td>" +
            "<td class='label_right'>" + value.UnitPriceWithDis + "</td>" +
            "<td class='label_right'>" + value.TotalPrice + "</td>" +
            "<td class='label_right'>" + (value.TotalCrudePrice - value.TotalPrice).toFixed(3) + "</td>" +
            "<td class='label_right'>" + value.TotalCrudePrice + "</td>" +
            "<td class='label_left'>" + transportinfo + "</td>";
            

        totalht += value.TotalPrice;
        totalttc += value.TotalCrudePrice;
        $('#TotalPriceHT').val(totalht);
        $('#TotalPriceTTC').val(totalttc);

        //var btnDuplicate = "<button class='btn btn-inverse' title='Dupliquer 复制' id='" + itemId + "' itemId='" + itemId + "' onclick='return duplicate_sol_click(this)'><i class='fa fa-copy'></i></button>";
        //var btnConsultPil = value.PilId != 0 ? "<button class='btn btn-inverse' title='Consulter la ligne d&#39achat 查看购买意向' id='" + itemId + "' itemId='" + itemId + "' pilId='" + value.PilId + "' pinId='" + value.PinFId + "' onclick='return consultPil(this)'><i class='fa fa-eye'></i></button>" : "";

        //var btnChangeSod = "<button class='btn btn-inverse' title='Changer à auter CF 换到另一个订单里面' id='" + itemId + "' itemId='" + itemId + "' onclick='return changeCF_sol_click(this)'><i class='fa fa-external-link'></i></button>";

        //var btnSaveUpdate = "<button class='btn btn-inverse' style='height:35px' onclick='return InsUpdPmt(this)' sprId='" + sprId + "' ><i class='" + btnclass + "'></i></button>";

        //var btnPayementR = "<button class='btn btn-inverse' title='Ajouter un dossier de paiement 添加支付信息' onclick='return OpenSpr(" + itemId + ")'><i class='fa fa-money'></i></button>";


//        var btns = "<td>" +
//            "<button class='btn btn-inverse' title='Modifier 更改' id='btn_up_sol_" + itemId + "' itemId='" + itemId + "' onclick='return modify_line_click(this)'><i class='fa fa-edit'></i></button>" + btnDuplicate + btnConsultPil + btnChangeSod + btnPayementR +
//            (value.LglId == 0 ?
//            ("<button class='btn btn-inverse' title='Supprimer 删除' id='" + itemId + "' itemId='" + itemId + "' onclick='return delete_Line_Confirm(this)'><i class='fa fa-times'></i></button>") : "") +
//            "</td>";

        var btns = "<td><button class='btn btn-inverse' title='Consulter 查看' id='btn_up_sol_" + itemId + "' itemId='" + itemId + "' onclick='return modify_line_click(this)'><i class='fa fa-eye'></i></button>";
        
        var endline = "</tr>";
        oneline += (false ? "" : btns) + endline;
        // 20210119 add total
        linecount ++;
        $('#tbody_lines').append(oneline);
        hasAnyLgl = hasAnyLgl || value.LglId != 0;
    });
      var totalline = "<tr><td colspan='12' style='font-weight:bolder;'>TOTAL</td><td class='label_right' style='font-weight:bolder;'>" + totalht.toFixed(3) + "</td><td></td><td class='label_right' style='font-weight:bolder;'>" + totalttc.toFixed(3) + "</td><td colspan='2'></td></tr>";
        $('#tbody_lines').append(totalline);
   
    return hasAnyLgl;
}

function viewLgs(fId) {
    var url = '../Logistics/Logistics.aspx?lgsId=' + fId + "&mode=view";
    //window.location.href = url;
    var win = window.open(url, '_blank');
    win.focus();
    return false;
}


var seltectedSupFId = '';
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
                    seltectedSupFId = '0';
                    $('#ScoId').empty();
                    var jsdata = data.d;
                    var data2Treat = jQuery.parseJSON(jsdata);
                    supplierList = [];
                    supplierList = data2Treat;
                    if (data2Treat.length > 0) {
                        response($.map(data2Treat, function(item) {
                            return {
                                label: (item.Abbreviation == null ? (item.CompanyName) : (item.Abbreviation + " | " + item.CompanyName)),
                                val: item.FId,
                            }
                        }));
                    } else {
                    }
                },
                error: function(response) {
//                    alert(response.responseText);
//                    console.log(response);
                },
                failure: function(response) {
                    alert(response.responseText);
                }
            });
        },
        select: function(e, i) {
            seltectedSupFId = i.item.val;
            SupplierChangedBySelected(seltectedSupFId, 0);
        },
        minLength: 2
    });
}

function changeAllVat() {
 var startBox = "<div class='box'><div class='box-body'>";
    var endBox = "</div></div>";
    var onelineContent =
        // start box
        "<div class='form-group' id='div_one_line'>" +
            "<div class='row'>" +
            "<div class='col-md-12'>" +
            "<div class='box-body'>" +
            "<div class='form-horizontal'>" +
            "<div class='form-group'><label class='col-sm-12' style='text-align:center'>Veuillez sélectionner un TVA 请选择一个税率</label></div>" +
            // new line
            "<div class='form-group'>" +
            "<label class='col-sm-4 control-label fieldRequired'>TVA 税率</label>" +
            "<div class='col-sm-5'><select id='tva_all' name='tva_all' class='form-control' >" +
            "</select></div>" +
            "<div class='col-sm-3'></div>" +
            "</div>" +
            // close box
            "</div></div></div></div></div>";

    var btnAddUpdate = "<button class='btn btn-inverse' id='btn_modify_vat' name='btn_cin_create' onclick='return ChangeAllVatClick()'><span>Changer touts 全部修改</span></button>";
    var btnClose = "<button class='btn btn-default bootbox-close-button' id='btn_changevat_cancel' onclick='return false'><span>Annuler 取消</span></button>";

    var btns = "<div class='modal-body center'>" + btnClose + btnAddUpdate + "</div>";
    var onecontent = startBox + onelineContent + btns + endBox;
    
    var title = 'Réinitialiser TVA 重置税率';
    bootbox.dialog({
        title: title,
        message: onecontent
    }).find('.modal-dialog').css({
        'width': '50%'
    }).find('.modal-content').css({
        'margin-top': function () {
            var w = $(window).height();
            var b = $(".modal-dialog").height();
            // should not be (w-h)/2
            var h = (w - b) * 0.15;
            return h + "px";
        }
    }).find('.modal-header').css({
        'background': 'url(../../img/menu_005_bg.jpg) repeat-x',
        'text-align': 'center',
        'color': '#C0C0C0'
    });

    if (allTVA) {
        var budgetId = '#tva_all';
        $(budgetId).empty();
        $.each(allTVA, function(name, value) {
            $(budgetId)
                .append($("<option></option>")
                    .attr("value", value.Key)
                    .attr("data-value", value.DcValue)
                    .text(value.Value));

        });
    }
    return false;
}

function ChangeAllVatClick() {
    var vatId = $('#tva_all :selected').val() * 1;
    if (IsNullOrEmpty(vatId)) {
        vatId = 4;
    }
    var sodId = getUrlVars()['sodId'];
     var url = window.webservicePath + "/UpdateSolVAT";
    var datastr = "{'sodId':'" + sodId + "','vatId':" + vatId + "}";
    $.ajax({
        type: "POST",
        url: url,
        contentType: "application/json; charset=utf-8",
        data: datastr,
        dataType: "json",
        success: function(data) {
            var jsdata = data.d;
            var jsondata = jQuery.parseJSON(jsdata);
            if (jsondata !== '-1') {
                HidePleaseWait();
                itemLines = [];
                itemLines = jsondata;
                if (itemLines.length > 0 && !sodhasCin) {
                    $('#btn_generate_pdf').show();
                    $('#btn_create_cin').show();
                    $('#btn_generate_pdf_sup').show();
                    $("#btn_validate_costplan").show();
                    if (!currentItem.SodHasSin) {
                        //$('#btn_create_supplier_invoice').show();
                        $('#btn_create_supplier_invoice').hide();
                    } else {
                        $('#btn_create_supplier_invoice').hide();
                    }
                } else {
                    $('#btn_delete').show();
                    $('#btn_generate_pdf').hide();
                    //$('#btn_create_cin').hide();
                    $('#btn_generate_pdf_sup').hide();
                    $("#btn_validate_costplan").hide();
                    $('#btn_create_supplier_invoice').hide();
                }
                $('#tbody_lines').empty();
               var hasAnyLgl= setSolLines(jsondata);

                if (hasAnyLgl) {
                    $('#btn_delete').hide();
                } else {
                    $('#btn_delete').show();
                }
                HidePleaseWait();
                var solId = getUrlVars()['solId'];
                if (solId) {
                    var btnupsol = $('#btn_up_sol_' + solId);
                    if (btnupsol.attr('itemId') == solId && !solIsSet && !paraClicked) {
                        solIsSet = true;
                        paraClicked = true;
                        btnupsol.click();
                    }
                }
                //$('#tbody_lines')

            } else {
                // authentication error
                HidePleaseWait();
                AuthencationError();
            }
        },
        error: function(data) {
            HidePleaseWait();
            var test = '';
        }
    });
    $('#btn_changevat_cancel').click();

    return false;
}

var SodCmtList = [];
function AddSodCmt(sender) {
    var ctaId = $(sender).attr('ctaid') * 1;
    var startBox = "<div class='box'><div class='box-body'>";
    var endBox = "</div></div>";
    var tag = '';
    var comment = '';
    var checked = '';
    if (ctaId) {
    var onecta = searchFieldValueInArray(SodCmtList, 'Key', ctaId);
        comment = onecta.Value;
        tag = onecta.Value2;
        checked = onecta.Actived ? 'checked' : '';
    }
    var onelineContent =
        // start box
        "<div class='form-group' id='div_one_line'>" +
            "<div class='row'>" +
            "<div class='col-md-12'>" +
            "<div class='box-body'>" +
            "<div class='form-horizontal'>" +
            "<div class='form-group'><label class='col-sm-12' style='text-align:center'>Veuillez ajouter le commentaire 请添加注释</label></div>" +
            // new line
            "<div class='form-group'>" +
            "<label class='col-sm-2 control-label'>Commentaire 注释</label>" +
            "<div class='col-sm-10'><textarea row='3' id='CtaComment' class='form-control' disabled></textarea></div>" +
            "</div>" +
            // new line
            "<div class='form-group'>" +
            "<label class='col-sm-2 control-label'>Show in PDF</label>" +
            "<div class='col-sm-10'><input class='form-control' type='checkbox' id='ip_cbx_addpdf' "+ checked +" disabled/></div></div>" +
            "</div>" +
            // close box
            "</div></div></div></div></div>";
            
    var btnAddUpdate = "";
    var btnClose = "<button class='btn btn-default bootbox-close-button' id='btn_close_cin_payment' onclick='return false'><span>Clôturer 关闭</span></button>";

    var btns = "<div class='modal-body center'>" + btnClose + btnAddUpdate + "</div>";
    var onecontent = startBox + onelineContent + btns + endBox;

    var title = 'Commentaire 注释';
    bootbox.dialog({
        title: title,
        message: onecontent
    }).find('.modal-dialog').css({
        'width': '30%'
    }).find('.modal-content').css({
        'margin-top': function() {
            var w = $(window).height();
            var b = $(".modal-dialog").height();
            // should not be (w-h)/2
            var h = (w - b) * 0.15;
            return h + "px";
        }
    }).find('.modal-header').css({
        'background': 'url(../../img/menu_005_bg.jpg) repeat-x',
        'text-align': 'center',
        'color': '#C0C0C0'
    });
    $('#CtaComment').text(comment);
    return false;
}


function SaveSodCta(sender) {
    $(sender).prop('disabled', true);
    var comment = $('#CtaComment').val();
    var catId = $(sender).attr('ctaid') * 1;
    var sodId = getUrlVars()['sodId'];
    var onespr = {
        Key: catId,
        Value: comment,
        Value4: sodId
    };
    if (sodId) {
        ShowPleaseWait();
        var jsondata = JSON.stringify({ oneCta: onespr });
        var url = window.webservicePath + "/InsertUpdateSodCmt";
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
                if (data2Treat !== '-1') {
                    $('#btn_close_cin_payment').click();
                    setSodComment(data2Treat);
                } else {
                    AuthencationError();
                }
            },
            error: function(data) {
                $(sender).prop('disabled', false);
                HidePleaseWait();
                alert(data.responseText);
            }
        });
    }
    return false;
}

function LoadComment() {
    var sodId = getUrlVars()['sodId'];
    if (sodId) {
        ShowPleaseWait();
        var jsondata = JSON.stringify({ sodId: sodId });
        var url = window.webservicePath + "/GetAllSodCmtForSup";
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
                if (data2Treat !== '-1') {
                    setSodComment(data2Treat);
                } else {
                    AuthencationError();
                }
            },
            error: function(data) {
                HidePleaseWait();
                alert(data.responseText);
            }
        });
    }
    return false;
}


function setSodComment(lines) {
    try {
        SodCmtList = [];
        SodCmtList = lines;
        $('#sod_cmt').empty();
        $.each(lines, function(name, value) {
            var comment = replaceAll(value.Value, "'", "&apos;");
            comment = replaceAll(comment, "\"", "&quot;");
            var btnUpdate = "<button class='btn btn-inverse' ctaid=" + value.Key + " onclick='return AddSodCmt(this)'><i class='fa fa-eye'></i></button>";
            var oneContent = "<div class='form-group' style='text-align:center'>" +
                "<div class='col-sm-2'>" + btnUpdate +
                "</div>" +
                "<label class='col-sm-5 control-label labelleft'>" + value.Value3 + "</label>" +
                "<label class='col-sm-5 control-label'>" + getDateString(value.DValue2) + (value.Actived? " <i class='fa fa-file-text'></i>": "")+ "</label>" +
                "<label class='col-sm-12 control-label labelleft'>" + comment + "</label>" +
                "</div><div class='separator'></div>";
            $('#sod_cmt').append(oneContent);
        });
    } catch (e) {

    }
}
