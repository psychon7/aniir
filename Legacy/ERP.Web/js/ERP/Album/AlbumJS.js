$(document).ready(initAlbum);

function initAlbum() {
    GetAllAlbum();
    SetLanguageBar();
}

function GetAllAlbum() {
    var url = window.webservicePath + "/GetAllAlbum";
    var budgetId = '#div_album_names';
    var defaultBtn = "<div class='col-md-2'><a class='btn btn-inverse btn-icon input-block-level' onclick='return createUpdate_Album(this)'><div title='' style='overflow: hidden;'>Créer un Album</div></a></div>";
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
                $(budgetId).append(defaultBtn);
                $.each(data2Treat, function (name, value) {
                    var btnContent = "<div class='col-md-2' id='div_one_album_" + value.Key + "'>" +
                        "<a class='btn btn-inverse btn-icon input-block-level' id='createupdateAlbum_" + value.Key + "' albId='" + value.Key + "' albName='" + HTMLEncode(value.Value) + "' albDes='" + HTMLEncode(value.Value2) + "' onclick='return createUpdate_Album(this)'>" +
                        "<div title='" + value.Value + "' style='overflow: hidden;'>" + HTMLEncode(value.Value) + "</div><span class='label label-right label-info'>" + value.Key2 + "</span> </a></div>";
                    $(budgetId).append(btnContent);
                });

                LoadImageFromPageLoad();
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

function LoadImageFromPageLoad() {
    var albId = getUrlVars()['albId'];
    if (albId) {
        LoadImages(albId);
    } else {
        reInitPage();
    }
}

function createUpdate_Album(sender) {
    var albId = $(sender).attr('albId');
    if (!albId) {
        //MsgErrorPopUp('test', 'this is a test');
        $('#uploadFileForm').hide();
        $('#div_images_in_album').empty();
        albumContent();
    } else {
        //LoadImages(albId);
        window.location = 'Album.aspx?albId=' + albId;
    }
    return false;
}

var currentAlbId = 0;
function LoadImages(albId) {
    if (albId) {
        currentAlbId = albId;
        $('#uploadFileForm').show();
        var budgetId = '#div_images_in_album';
        $(budgetId).empty();
        $('#file2update').attr('albId', albId);
        $('#iptUploadFile').attr('albId', albId);
        var actionUrl = $('#uploadFileForm').attr('action');
        actionUrl = actionUrl.split('?')[0];
        actionUrl = actionUrl + '?albId=' + albId + '&type=1';
        $('#uploadFileForm').attr('action', actionUrl);

        var createupdateAlbum_ = '#createupdateAlbum_' + albId;
        $('#spanAlbumName').text($(createupdateAlbum_).attr('albName'));
        $('#btnUpdateAlbum').attr('albName', $(createupdateAlbum_).attr('albName'));
        $('#btnDeleteAlbum').attr('albName', $(createupdateAlbum_).attr('albName'));
        $('#btnUpdateAlbum').attr('albId', albId);
        $('#btnDeleteAlbum').attr('albId', albId);


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
                    $(budgetId).empty();
                    setAlbumImage(data2Treat, budgetId);
                    reInitPage();
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

function UpdateAlbum(sender) {
    var albId = $(sender).attr('albId');
    var oneAlb = Object();
    oneAlb.AlbId = albId;

    var createupdateAlbum_ = '#createupdateAlbum_' + albId;
    oneAlb.AlbName = $(createupdateAlbum_).attr('albName');
    oneAlb.AlbDes = $(createupdateAlbum_).attr('albDes');
    albumContent(oneAlb);
    //oneAlb.
    return false;
}

function albumContent(oneAlb) {
    var title = oneAlb ? 'Mettre à jour l&#39Album' : 'Créer un Album';
    var btnCreate = oneAlb ? 'Mettre à jour' : 'Créer';
    var albname = oneAlb ? oneAlb.AlbName : '';
    var albdes = oneAlb ? oneAlb.AlbDes : '';
    var albId = oneAlb ? oneAlb.AlbId : '0';
    var content = "<div class='box' id='divCreateUpdateAlb'><div class='box-body'><div class='form-horizontal'>" +
        "<div class='form-group'><label class='col-sm-3 control-label'>Nom d'album</label>" +
        "<div class='col-sm-9'><input class='form-control' id='AlbName_#albId#' name='AlbName_#albId#' value='" + albname + "' required='' type='text' placeholder='Nom d&#39album' ></div>" +
        "</div>" +
        "<div class='form-group'><label class='col-sm-3 control-label'>Description d'album</label>" +
        "<div class='col-sm-9'><textarea rows='5' cols='5' class='form-control' id='AlbDes_#albId#' name='AlbDes_#albId#' type='text' placeholder='Description d&#39album' ></textarea></div>" +
        "</div>" +
        "<button class='btn btn-block btn-inverse' albId='#albId#' onclick='return createUpdateOneAlbum(this)'><span>" + btnCreate + "</span></button>" +
        "<button class='btn btn-block btn-inverse bootbox-close-button' ><span>Cancel</span></button>" +
        "</div></div></div>";
    content = replaceAll(content, '#albId#', albId);
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
        //'background-color': '#db5e8c',
        'background': 'url(../../img/menu_005_bg.jpg) repeat-x',
        'text-align': 'center',
        'color': '#C0C0C0'
    });

    try {
        $('#AlbDes_' + albId)[0].value = albdes;
    } catch (e) {
        var testError = '';
    }
}

function createUpdateOneAlbum(sender) {
    var checkOK = CheckRequiredFieldInOneDiv('divCreateUpdateAlb');
    if (checkOK) {
        var albId = $(sender).attr('albId');
        var AlbName = $('#AlbName_' + albId).val();
        var AlbDes = $('#AlbDes_' + albId).val();
        //alert(AlbName + AlbDes);
        var url = 'Album.aspx/CreateUpdateAlbum';
        var aAlb = Object();
        aAlb.Key = albId;
        aAlb.Value = AlbName;
        aAlb.Value2 = AlbDes;
        var jsondata = JSON.stringify({ oneAlbum: aAlb });
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
                    //                    var albId = data2Treat.Key;
                    //                    var div_one_album_ = '#div_one_album_' + albId;
                    //                    try {
                    //                        $(div_one_album_).remove();
                    //                    } catch (e) {

                    //                    }
                    //                    var btnContent = "<div class='col-md-2' id='div_one_album_" + data2Treat.Key + "'>" +
                    //                        "<a class='btn btn-pink btn-icon input-block-level' albId='" + data2Treat.Key + "' onclick='return createUpdate_Album(this)'>" +
                    //                        "<div title='" + data2Treat.Value + "' style='overflow: hidden;'>" + data2Treat.Value + "</div><span class='label label-right label-info'>" + data2Treat.Key2 + "</span> </a></div>";
                    //                    var budgetId = '#div_album_names';
                    //                    $(budgetId).append(btnContent);

                    //                    $('.bootbox-close-button').click();
                    //                    GetAllAlbum();
                    var albId = data2Treat.Key;
                    window.location = 'Album.aspx?albId=' + albId;
                }
            },
            error: function (data) {
            }
        });
    }
    return false;
}

function addModifyImage(sender) {
}

function resetUploadFileFormAction(sender) {
    var description = $(sender).val();
    var popUp = $(sender).attr('popUp');
    var formname = popUp ? '#uploadFileFormPopUp' : '#uploadFileForm';
    var actionUrl = $(formname).attr('action');
    var albId = getParameterByNameNoHtmlCode(actionUrl, 'albId');
    albId = encodeURIComponent(albId);
    var palId = getParameterByNameNoHtmlCode(actionUrl, 'palId');
    palId = encodeURIComponent(palId);
    var typeId = getParameterByNameNoHtmlCode(actionUrl, 'type');
    palId = palId ? palId : 0;
    var newUrl = actionUrl.split('?')[0];
    newUrl += '?albId=' + albId + '&palId=' + palId + '&type=' + typeId;
    newUrl += '&des=' + encodeURIComponent(description);
    $(formname).attr('action', newUrl);
}



function deleteImageClick(sender) {
    var palId = $(sender).attr('palId');
    if (palId) {
        var title = "ATTENTION";
        var content = "<div class='box'><div class='box-body' style='height: 150px;'>" +
        "<div class='form-horizontal'>" +
        "<div class='col-md-12'>" +
        "<div class='form-group'>" +
        "<div class='col-sm-12' style='text-align:center;font-size: 18pt;'>" +
        "Attention !<br/> Si vous supprimez, cela entrainera la suppression automatique de cette même photo de tous les fichiers où elle est enregistrée.<br/>Veuillez confirmer !!!</div></div></div></div></div></div>"
        + "<div class='modal-footer center'>" +
        "<button type='button' class='btn btn-default' onclick='closeDialog()'>Annuler</button>" +
        "<button type='button' class='btn btn-inverse' palId='" + palId + "' onclick='return deleteImage(this);'>SUPPRIMER</button></div>";
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
    var palId = $(sender).attr('palId');
    if (palId) {
        var budgetId = '#div_images_in_album';
        var url = window.webservicePath + "/DeleteOnePhoto";
        $.ajax({
            type: "POST",
            data: '{albId:' + currentAlbId + ',palId:' + palId + '}',
            url: url,
            contentType: "application/json; charset=utf-8",
            dataType: "json",
            success: function (data) {
                var jsdata = data.d;
                var data2Treat = jQuery.parseJSON(jsdata);
                if (data2Treat !== '-1') {
                    //$(budgetId).empty();
                    //setAlbumImage(data2Treat, budgetId);

                    //                    GetAllAlbum();
                    //                    reInitPage();
                    location.reload();
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


function setAlbumImage(images, budgetId) {
    $.each(images, function (name, value) {
        var filename = value.Value;
        filename = replaceAll(filename, '\'', '&quot;');
        //filename = replaceAll(filename, '&plus;', '');
        filename = filename.replace(/\+/g, '加号');
        filename = filename.replace(/\>/g, '大于');
        filename = filename.replace(/\</g, '小于');
        var imgContent = "<div class='col-md-2 item'><div class='filter-content'  style='height: 200px !important'>" +
                            "<img src='../../Services/ShowOutSiteImage.ashx?file=" + filename + "' alt=''   class='img-responsive'  style='width: 100%' />" +
                            "<div class='hover-content'><h4>" + value.Value2 + "</h4>" +
                            "<a class='btn btn-inverse hover-link' palId='" + value.Key2 + "' onclick='deleteImageClick(this)'>" +
                            "<i class='fa fa-times fa-1x'></i></a>" +
                            "<a class='btn btn-inverse hover-link' palId='" + value.Key2 + "' onclick='ModifyImage(this)'>" +
                            "<i class='fa fa-edit fa-1x'></i></a>" +
                            "<a class='btn btn-inverse hover-link colorbox-button'href='../../Services/ShowOutSiteImage.ashx?file=" + filename + "' title='" + value.Value2 + "'>" +
                            "<i class='fa fa-search-plus fa-1x'></i></a>" +
                            "</div></div></div>";
        $(budgetId).append(imgContent);
    });
}

function ModifyImage(sender) {
    var palId = $(sender).attr('palId');
    if (palId) {
        var title = "Mettre à jour le photo";
        var content = "<div class='box'><div class='box-body' style='height: 150px;'>" +
        "<form action='../../Services/UploadFilesHandler.ashx?albId=" + currentAlbId + "&palId=" + palId + "&type=1' id='uploadFileFormPopUp' method='POST' enctype='multipart/form-data'>" +
            "<div class='col-md-12'>" +
            "<div class='col-md-12' style='text-align: center;'>" +
            "<span class='btn btn-inverse fileinput-button'>" +
            "<i class='fa fa-plus'></i>" +
            "<span>Ajouter</span>" +
            "<input type='file' id='iptUploadImagePopUp' name='files[]' accept='image/*' onchange='getFileDataPopUp(this);'></span>" +
            "<button type='submit' class='btn btn-inverse start' style='display: none;' id='btnSubmitUploadFilePopUp'><i class='fa fa-arrow-circle-o-up'></i><span>Télécharger</span></button>" +
            "<button type='reset' class='btn btn-inverse cancel'  style='display: none;' id='btnCancelUploadFilePopUp' onclick='return hideUploadPopUp()'><i class='fa fa-ban'></i><span>Annuler</span></button></div> <!-- The global progress information -->" +
            "<div class='col-md-12' style='text-align: center; margin-bottom: 20px;'>" +
            "<div>File Name : <span id='uploadFileNamePopUp'></span></div><br/>" +
            "<div class='form-group' id='div_description_imagePopUp' style='display: none;'>" +
            "<div class='col-sm-1'></div>" +
            "<label class='col-sm-4 control-label'>Description d'image</label>" +
            "<div class='col-sm-6'>" +
            "<input type='text' class='form-control' id='inp_description_image' name='inp_description_image' placeholder='Description d&#39image' popUp='true' onblur='resetUploadFileFormAction(this)' maxlength='200'></div>" +
            "<div class='col-sm-1'></div></div></div></div></form>" +
            "</div></div>";
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

function DeleteAlbumClick(sender) {
    var albId = $(sender).attr('albId');
    if (albId) {
        var title = "ATTENTION";
        var content = "<div class='box'><div class='box-body' style='height: 150px;'>" +
        "<div class='form-horizontal'>" +
        "<div class='col-md-12'>" +
        "<div class='form-group'>" +
        "<div class='col-sm-12' style='text-align:center;font-size: 18pt;'>" +
        "Attention !<br/> Si vous supprimez, cela entrainera la suppression automatique de cet album de tous les fichiers où il est enregistré.<br/>Veuillez confirmer !!!</div></div></div></div></div></div>"
        + "<div class='modal-footer center'>" +
        "<button type='button' class='btn btn-default' onclick='closeDialog()'>Annuler</button>" +
        "<button type='button' class='btn btn-inverse' albId='" + albId + "' onclick='return DeleteAlbum(this);'>SUPPRIMER</button></div>";
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

function DeleteAlbum(sender) {
    var albId = $(sender).attr('albId');
    if (albId) {
        var url = window.webservicePath + "/DeleteAlbum";
        $.ajax({
            type: "POST",
            data: '{albId:' + albId + '}',
            url: url,
            contentType: "application/json; charset=utf-8",
            dataType: "json",
            success: function (data) {
                window.location = 'Album.aspx';
            },
            error: function (data) {
                var test = '';
            }
        });
    }
}

function reInitPage() {
    App.setPage("gallery");  //Set current page
    App.init(); //Initialise plugins and elements
}