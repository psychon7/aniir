function UploadProductFile(sender) {
    var propId = $(sender).attr('propId');
    var prdId = getParameterByName('prdId');
    var pitId = $(sender).attr('pitId');
    if (pitId === "undefined" || !pitId) {
        pitId = 0;
    }
    var title = "Télécharger un fichier";
    try {
        var content = "<div class='box'><div class='box-body' style='overflow-y:auto;overflow-x:hidden;'>" +
        "<form action='../../Services/UploadFilesForProductHandler.ashx?prdId=" + prdId + "&pitId=" + pitId + "&propId=" + propId + "'  id='uploadFileFormPopUp' method='POST' enctype='multipart/form-data'>" +
            "<div class='col-md-12'>" +
        // this div is for album photo
            "<div class='row' style='margin-bottom: 20px;'><div class='col-md-12' id='div_album_photo' style='text-align:center;'>" +
            "</div>" +
        // cancel and save buttons
            "<div class='col-md-12' id='div_select_from_album_save_button' style='display:none;'>" +
            "<div class='col-md-6 center'><button type='button' class='btn btn-default' onclick='return closeDialog()'>Annuler</button></div>" +
            "<div class='col-md-6 center'><button type='button' class='btn btn-success' pitId='" + pitId + "' propId='" + propId + "' id='btn_add_update_prd_photo' onclick='return js_Add_Update_Product_Photo(this)'>Ajouter</button></div></div>" +
            "</div>" +
            "</div>" +
        // this content contains upload photo
            "<div class='row' id='div_upload_photo'><div class='col-md-12' style='text-align: center;'>" +
            "<span class='btn btn-inverse fileinput-button'>" +
            "<i class='fa fa-plus'></i>" +
            "<span>Ajouter</span>" +
            "<input type='file' id='iptUploadImagePopUp' name='files[]' accept='*' onchange='getFileDataPopUp(this);'></span>" +
            "<button type='submit' class='btn btn-inverse start' style='display: none;' id='btnSubmitUploadFilePopUp'><i class='fa fa-arrow-circle-o-up'></i><span>Télécharger</span></button>" +
            "<button type='reset' class='btn btn-inverse cancel'  style='display: none;' id='btnCancelUploadFilePopUp' onclick='return hideUploadPopUp()'><i class='fa fa-ban'></i><span>Annuler</span></button></div> <!-- The global progress information -->" +
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


function downloadTheFile(sender) {
    var propId = $(sender).attr('propId');
    var prdId = getUrlVars()['prdId'];
    var pitId = $(sender).attr('pitId');
    if (pitId === "undefined" || !pitId) {
        pitId = 0;
    }
    pitId = pitId.replace('_____', '');
    // Create an IFRAME.
    var iframe = document.createElement("iframe");
    // Point the IFRAME to GenerateFile
    var url = "../Common/PageDownLoad.aspx?prdId=" + prdId + "&propId=" + propId + "&pitId=" + pitId;
    iframe.src = url;
    // This makes the IFRAME invisible to the user.
    iframe.style.display = "none";

    // Add the IFRAME to the page.  This will trigger a request to GenerateFile now.
    document.body.appendChild(iframe);

    return false;
}

function deleteTheFileConfirm(sender) {
    var pitId = $(sender).attr('pitId');
    var propId = $(sender).attr('propid');
    var title = "ATTENTION";
    var content = "<div class='box'><div class='box-body' style='height: 100px;'>" +
        "<div class='form-horizontal'>" +
        "<div class='col-md-12'>" +
        "<div class='form-group'>" +
        "<div class='col-sm-12' style='text-align:center;font-size: 18pt;'>Veuillez confirmer la suppression ! " +
        "<br/>La suppression est irrécupérable, veuillez confirmer !!!</div></div></div></div></div></div>"
        + "<div class='modal-footer center'>" +
        "<button type='button' class='btn btn-default' onclick='closeDialog()'>Annuler</button>" +
        "<button type='button' class='btn btn-inverse' pitId='" + pitId + "' propId='" + propId + "' onclick='return deletePrdPitFile(this);'>SUPPRIMER</button></div>";
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
        //        'background-color': '#d2322d',
        //        'text-align': 'center',
        //        'color': 'white'
        'background': 'url(../../img/menu_005_bg.jpg) repeat-x',
        'text-align': 'center',
        'color': '#C0C0C0'
    });
    return false;
}

function deletePrdPitFile(sender) {
    var pitId = $(sender).attr('pitId');
    var propId = $(sender).attr('propid');
    var prdId = getUrlVars()['prdId'];
    var url = window.webservicePath + "/DeleteProductFile";
    $.ajax({
        url: url,
        type: 'POST',
        contentType: 'application/json; charset=utf-8',
        data: "{prdId:'" + prdId + "',pitId:" + pitId + ",propGuid:'" + propId + "'}",
        dataType: 'json',
        success: function (data) {
            window.location = 'Product.aspx?prdId=' + prdId + "&mode=view";
        },
        error: function (data) {
            alert(data.responseText);
        }
    });
    return false;
}