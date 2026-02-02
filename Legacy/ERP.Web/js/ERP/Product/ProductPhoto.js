//////////////////////////////////////////////////////////////////////////////////////////////////
///////// this file create for product page 2017-05-20
/////////////////////////////////////////////////////////////////////////////////////////////////
$(document).ready(initAlbum);

function initAlbum() {
    getAllAlbumForProduct();
}

var allAlbum = [];
function getAllAlbumForProduct() {
    var url = window.webservicePath + "/GetAllAlbum";
    $.ajax({
        type: "POST",
        url: url,
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        success: function (data) {
            var jsdata = data.d;
            var data2Treat = jQuery.parseJSON(jsdata);
            if (data2Treat !== '-1') {
                allAlbum = [];
                allAlbum = data2Treat;
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

function AddModifyImage(sender, iscreate) {
    var pimId = $(sender).attr('pimId');
    if (pimId === "undefined" || !pimId) {
        pimId = 0;
    }
    var pitId = $(sender).attr('pitId');
    if (pitId === "undefined" || !pitId) {
        pitId = 0;
    }
    var palId = $(sender).attr('palId');
    if (palId === "undefined" || !palId) {
        palId = 0;
    }
    var ptiId = $(sender).attr('ptiId');
    if (ptiId === "undefined" || !ptiId) {
        ptiId = 0;
    }
    var type = $(sender).attr('sendtype');
    if (type === "undefined" || !type) {
        type = 2;
    }
    var prdId = getParameterByName('prdId');
    prdId = encodeURIComponent(prdId);
    if (pimId || ptiId || pitId || iscreate) {
        var title = iscreate ? "Ajouter un photo" : "Mettre à jour le photo";
        var content = "<div class='box'><div class='box-body' style='overflow-y:auto;overflow-x:hidden;'>" +
        "<form action='../../Services/UploadFilesHandler.ashx?prdId=" + prdId + "&pimId=" + pimId + "&pitId=" + pitId + "&ptiId=" + ptiId + "&type=" + type + "'  id='uploadFileFormPopUp' method='POST' enctype='multipart/form-data'>" +
            "<div class='col-md-12'>" +
        // this content contains album
"<div class='row' style='margin-bottom: 20px;'><div class=col-md-12>" +
            "<label class='col-sm-4 control-label'>Séléctionner d\'Album</label><div class='col-md-1'><input type='checkbox' id='cbx_select_from_album' onclick='showSelectFormAlbum(this)'/></div>" +
            "<div class='col-md-7'><select id='slt_from_album' class='form-control' style='display:none;' onchange='AlbumChanged(this)'></select></div>" +
            "</div></div>" +
        // this div is for album photo
            "<div class='row' style='margin-bottom: 20px;'><div class='col-md-12' id='div_album_photo' style='text-align:center;'>" +
            "</div>" +
        // image description and image order
            "<div class='col-md-12' style='margin-bottom:20px;'>" +
            "<div class='form-group'><label class='col-sm-4 control-label'>Order</label><div class='col-md-8'><input type='number' id='pimOrder' min='0' value='1' class='form-control' onblur='pimOrderChange(this)' onchange='pimOrderChange(this)'></div></div>" +
            "<div class='form-group'><label class='col-sm-4 control-label'>Description</label><div class='col-md-8'><input type='text' id='pimDescription' class='form-control' onblur='pimDescriptionChange(this)' maxlength='100'></div></div>" +
            "</div>" +
        // cancel and save buttons
            "<div class='col-md-12' id='div_select_from_album_save_button' style='display:none;'>" +
            "<div class='col-md-6 center'><button type='button' class='btn btn-default' onclick='return closeDialog()'>Annuler</button></div>" +
            "<div class='col-md-6 center'><button type='button' class='btn btn-success' palId='" + palId + "' pimId='" + pimId + "' pitId='" + pitId + "' ptiId='" + ptiId + "' id='btn_add_update_prd_photo' onclick='return js_Add_Update_Product_Photo(this)'>Ajouter</button></div></div>" +
            "</div>" +
            "</div>" +
        // this content contains upload photo
            "<div class='row' id='div_upload_photo'><div class='col-md-12' style='text-align: center;'>" +
            "<span class='btn btn-inverse fileinput-button'>" +
            "<i class='fa fa-plus'></i>" +
            "<span>Ajouter</span>" +
            "<input type='file' id='iptUploadImagePopUp' name='files[]' accept='image/*' onchange='getFileDataPopUp(this);'></span>" +
            "<button type='submit' class='btn btn-inverse start' style='display: none;' id='btnSubmitUploadFilePopUp'><i class='fa fa-arrow-circle-o-up'></i><span>Télécharger</span></button>" +
            "<button type='reset' class='btn btn-inverse cancel'  style='display: none;' id='btnCancelUploadFilePopUp' onclick='return hideUploadPopUp()'><i class='fa fa-ban'></i><span>Annuler</span></button></div> <!-- The global progress information -->" +
            "<div class='col-md-12' style='text-align: center; margin-bottom: 20px;'>" +
            "<div>File Name : <span id='uploadFileNamePopUp'></span></div><br/>" +
        //            "<div class='form-group' id='div_description_imagePopUp' style='display: none;'>" +
        //            "<div class='col-sm-1'></div>" +
        //            "<label class='col-sm-4 control-label'>Description d'image</label>" +
        //            "<div class='col-sm-6'>" +
        //            "<input type='text' class='form-control' id='inp_description_image' name='inp_description_image' placeholder='Description d&#39image' popUp='true' onblur='resetUploadFileFormAction(this)' maxlength='200'></div>" +
        //            "<div class='col-sm-1'></div>" +
        //            "</div>" +
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


        try {
            $('#slt_from_album')
                        .append($("<option></option>")
                            .attr("value", 0)
                            .text('Séléctionner d\'Album'));
            $.each(allAlbum, function (name, value) {
                $('#slt_from_album')
                        .append($("<option></option>")
                            .attr("value", value.Key)
                            .text(value.Value));
            });
        } catch (e) {

        }


        $('#pimOrder').change();
    }
    return false;
}

function closeDialog() {
    $('.close').click();
    return false;
}

function showSelectFormAlbum(sender) {
    var show = $(sender).is(':checked');
    if (show) {
        $('#slt_from_album').show();
        $('#div_upload_photo').hide();
        //$('#div_select_from_album_save_button').show();
        $('#div_album_photo').show();
    } else {
        $('#slt_from_album').hide();
        $('#div_upload_photo').show();
        //$('#div_select_from_album_save_button').hide();
        $('#div_album_photo').hide();
        $('#div_select_from_album_save_button').hide();
    }
}

function AlbumChanged(sender) {
    var albId = $(sender).val();
    if (albId) {
        var url = window.webservicePath + "/GetImagesInAlbum";
        $.ajax({
            type: "POST",
            data: '{albId:"' + albId + '"}',
            url: url,
            contentType: "application/json; charset=utf-8",
            dataType: "json",
            success: function (data) {
                var jsdata = data.d;
                var data2Treat = jQuery.parseJSON(jsdata);
                if (data2Treat !== '-1') {
                    $('#div_album_photo').empty();
                    $.each(data2Treat, function (name, value) {
                        var onePht = "<div class='col-md-4' style='margin-bottom : 10px;'>" +
                        "<img src='../../Services/ShowOutSiteImage.ashx?file=" + value.Value + "'  alt='' class='img-responsive' style='width: 100%; max-height:100px;' />" +
                        "<input name='photoInAlbum' type='radio' palId='" + value.Key2 + "' onclick='selectOnePhoto(this)'>" +
                        "</div>";
                        $('#div_album_photo').append(onePht);
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
}

function selectOnePhoto(sender) {
    var palId = $(sender).attr('palId');
    if (palId) {
        $('#div_select_from_album_save_button').show();
        $('#btn_add_update_prd_photo').attr('palId', palId);
    }
}

function js_Add_Update_Product_Photo(sender) {
    var prdId = getUrlVars()['prdId'];
    var palId = $(sender).attr('palId');
    if (palId === "undefined" || !palId) {
        palId = 0;
    }
    var pimId = $(sender).attr('pimId');
    if (pimId === "undefined" || !pimId) {
        pimId = 0;
    }
    var pitId = $(sender).attr('pitId');
    if (pitId === "undefined" || !pitId) {
        pitId = 0;
    }
    var ptiId = $(sender).attr('ptiId');
    if (ptiId === "undefined" || !ptiId) {
        ptiId = 0;
    }
    var order = $('#pimOrder').val();
    var des = HTMLEncode($('#pimDescription').val());
    var jsondata = JSON.stringify({ prdId: prdId, palId: palId, pimId: pimId, des: des, order: order, pitId: pitId, ptiId: ptiId });

    var url = window.webservicePath + "/AddUpdateProductImages";
    $.ajax({
        type: "POST",
        data: jsondata,
        url: url,
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        success: function (data) {
            var jsdata = data.d;
            var data2Treat = jQuery.parseJSON(jsdata);
            if (data2Treat !== '-1') {
                var prdId = data2Treat;
                window.location = 'Product.aspx?prdId=' + prdId + "&mode=view";
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

function pimOrderChange(sender) {
    var order = $(sender).val();
    var formname = '#uploadFileFormPopUp';
    var actionUrl = $(formname).attr('action');
    var palId = getParameterByNameNoHtmlCode(actionUrl, 'palId');
    var pimId = getParameterByNameNoHtmlCode(actionUrl, 'pimId');
    var des = getParameterByNameNoHtmlCode(actionUrl, 'des');
    var pitId = getParameterByNameNoHtmlCode(actionUrl, 'pitId');
    var ptiId = getParameterByNameNoHtmlCode(actionUrl, 'ptiId');
    var type = getParameterByNameNoHtmlCode(actionUrl, 'type');
    var prdId = getUrlVars()['prdId'];
    prdId = encodeURIComponent(prdId);
    palId = palId ? palId : 0;
    var newUrl = actionUrl.split('?')[0];
    newUrl += '?prdId=' + prdId + '&order=' + order + '&pimId=' + pimId + '&palId=' + palId + '&type=' + type + '&pitId=' + pitId + '&ptiId=' + ptiId;
    newUrl += '&des=' + escape(des);
    $(formname).attr('action', newUrl);
}

function pimDescriptionChange(sender) {
    var des = $(sender).val();
    var formname = '#uploadFileFormPopUp';
    var actionUrl = $(formname).attr('action');
    var palId = getParameterByNameNoHtmlCode(actionUrl, 'palId');
    var pimId = getParameterByNameNoHtmlCode(actionUrl, 'pimId');
    var order = getParameterByNameNoHtmlCode(actionUrl, 'order');
    var pitId = getParameterByNameNoHtmlCode(actionUrl, 'pitId');
    var type = getParameterByNameNoHtmlCode(actionUrl, 'type');
    var ptiId = getParameterByNameNoHtmlCode(actionUrl, 'ptiId');
    var prdId = getUrlVars()['prdId'];
    prdId = encodeURIComponent(prdId);
    palId = palId ? palId : 0;
    var newUrl = actionUrl.split('?')[0];
    newUrl += '?prdId=' + prdId + '&order=' + order + '&pimId=' + pimId + '&palId=' + palId + '&type=' + type + '&pitId=' + pitId + '&ptiId=' + ptiId;
    newUrl += '&des=' + escape(des);
    $(formname).attr('action', newUrl);
}

function setProductImage(images, budgetId) {
    $.each(images, function (name, value) {
        var imgContent = "<div class='col-md-4 item' id='div_one_pim_" + value.Key + "'><div class='filter-content'  style='height: 300px !important'>" +
                            "<img src='../../Services/ShowOutSiteImage.ashx?file=" + value.Value + "' alt=''   class='img-responsive'  style='width: 100%' />" +
                            "<div class='hover-content'><h4>" + value.Key2 + " | " + value.Value2 + "</h4>" +
                            "<a class='btn btn-inverse hover-link' pimId='" + value.Key + "' onclick='deleteImageClick(this)'>" +
                            "<i class='fa fa-times fa-1x'></i></a>" +
                            "<a class='btn btn-inverse hover-link' pimId='" + value.Key + "' palId='" + value.Key3 + "' onclick='AddModifyImage(this)'>" +
                            "<i class='fa fa-edit fa-1x'></i></a>" +
                            "<a class='btn btn-inverse hover-link colorbox-button'href='../../Services/ShowOutSiteImage.ashx?file=" + value.Value + "' title='" + value.Key2 + " | " + value.Value2 + "'>" +
                            "<i class='fa fa-search-plus fa-1x'></i></a>" +
                            "</div></div></div>";
        $(budgetId).append(imgContent);
    });
}

function deleteImageClick(sender) {
    var pimId = $(sender).attr('pimId');
    var ptiId = $(sender).attr('ptiId');
    var pitId = $(sender).attr('pitId');
    if (pimId || ptiId) {
        var title = "ATTENTION";
        var content = "<div class='box'><div class='box-body' style='height: 150px;'>" +
        "<div class='form-horizontal'>" +
        "<div class='col-md-12'>" +
        "<div class='form-group'>" +
        "<div class='col-sm-12' style='text-align:center;font-size: 18pt;'>" +
        "Attention !<br/>La suppression est irrécupérable, veuillez confirmer !!!</div></div></div></div></div></div>"
        + "<div class='modal-footer center'>" +
        "<button type='button' class='btn btn-default' onclick='closeDialog()'>Annuler</button>" +
        "<button type='button' class='btn btn-inverse' pimId='" + pimId + "' ptiId='" + ptiId + "' pitId='" + pitId + "' onclick='return deleteImage(this);'>SUPPRIMER</button></div>";
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
    }
    return false;
}

function deleteImage(sender) {
    var pimId = $(sender).attr('pimId');
    if (pimId === "undefined" || !pimId) {
        pimId = 0;
    }
    pimId = pimId * 1;
    var ptiId = $(sender).attr('ptiId');
    if (ptiId === "undefined" || !ptiId) {
        ptiId = 0;
    }
    ptiId = ptiId * 1;

    var pitId = $(sender).attr('pitId');
    if (pitId === "undefined" || !pitId) {
        pitId = 0;
    }
    pitId = pitId * 1;

    var prdId = getUrlVars()['prdId'];
    if (pimId || ptiId) {
        ShowPleaseWait();
        var url = window.webservicePath + "/DeleteProductPhoto";
        $.ajax({
            type: "POST",
            data: '{prdId:"' + prdId + '",pimId:' + pimId + ',ptiId:' + ptiId + '}',
            url: url,
            contentType: "application/json; charset=utf-8",
            dataType: "json",
            success: function (data) {
                HidePleaseWait();
                var jsdata = data.d;
                var data2Treat = jQuery.parseJSON(jsdata);
                if (data2Treat !== '-1') {
                    var prdId = data2Treat;
                    if (pimId !== 0) {
                        $('#div_one_pim_' + pimId).remove();
                    } else {
                        $('#div_pit_imgs_' + pitId).empty();
                        var btnaddimge = "<button type='button' class='btn btn-inverse forview language_txt' pitid='" + pitId + "' onclick='return AddModifyImage(this, true)' title='Ajouter une photo'><i class='fa fa-arrow-circle-o-up'></i></button>";
                        $('#div_pit_imgs_' + pitId).append(btnaddimge);
                    }
                } else {
                    // authentication error
                    HidePleaseWait();
                    AuthencationError();
                }
            },
            error: function (data) {
                HidePleaseWait();
                var test = '';
            }
        });
    }
}

function AddUpdatePitImage(sender) {
    var pitId = $(sender).attr('pitId');
    alert(pitId);
    return false;
}

