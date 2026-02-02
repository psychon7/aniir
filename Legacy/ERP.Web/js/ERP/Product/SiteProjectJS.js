$(document).ready(iniAll);
function iniAll() {
    $.each($('.datepicker'), function (idx, value) {
        $(value).datepicker();
    });
    initMode();

    if (!_isView) {
        $('#div_all_prds').hide();
        $('#div_all_imgs').hide();
        $('#div_project').removeClass('col-md-4');
        $('#div_project').addClass('col-md-12');
    } else {
        $('#div_all_prds').show();
        $('#div_all_imgs').show();
        $('#div_project').addClass('col-md-4');
        $('#div_project').removeClass('col-md-12');
    }
    getAllProjet(0);

    SetLanguageBar();
    setAutoComplete();
}

var AllProject = [];
function getAllProjet(prjId) {
    var url = window.webservicePath + "/GetAllSiteProjects";
    var budgetId = '#PrjId';
    $('#budgetId').empty();
    AllProject = [];
    $.ajax({
        type: "POST",
        url: url,
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        success: function (data) {
            var jsdata = data.d;
            var data2Treat = jQuery.parseJSON(jsdata);
            if (data2Treat !== '-1') {
                AllProject = data2Treat;
                $(budgetId).empty();
                $(budgetId).append($("<option></option>")
                            .attr("value", "0")
                            .text("Sélectionner un projet ou créer un"));
                $.each(data2Treat, function (name, value) {
                    if (prjId && value.PrjId === prjId) {
                        $(budgetId).append($("<option></option>").attr("value", value.PrjId).attr("selected", true).text(value.PrjName));
                    } else {
                        $(budgetId).append($("<option></option>").attr("value", value.PrjId).text(value.PrjName));
                    }
                });
                if (prjId) {
                    $(budgetId).change();
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

function PrjChange(sender) {
    var prjId = $(sender).val();
    prjId = prjId * 1;
    var oneprj = searchFieldValueInArray(AllProject, 'PrjId', prjId);
    if (!jQuery.isEmptyObject(oneprj)) {
        $('#PrjName').val(oneprj.PrjName);
        if (oneprj.PrjActived) {
            $('#PrjActived').prop('checked', true);
        } else {
            //$('#PrjActived').removeAttr('checked');
            $('#PrjActived').prop('checked', false);
        }
        if (oneprj.PrjRecommended) {
            $('#PrjRecommended').prop('checked', true);
        } else {
            //$('#PrjRecommended').removeAttr('checked');
            $('#PrjRecommended').prop('checked', false);
        }
        $('#PrjDate').val(getDateString(oneprj.PrjDate));
        $('#PrjLocation').val(oneprj.PrjLocation);
        $('#PrjClient').val(oneprj.PrjClient);
        $('#PrjDesigner').val(oneprj.PrjDesigner);
        $('#PrjDescription').val(oneprj.PrjDescription);
        $('#div_all_prds').show();
        $('#div_all_imgs').show();
        $('#div_project').addClass('col-md-4');
        $('#div_project').removeClass('col-md-12');

        var tags = "";
        if (oneprj.PrjTags && oneprj.PrjTags.length > 0) {
            $.each(oneprj.PrjTags, function(name, value) {
                tags += value.Value + ';';
            });
        }
        $('#PrjTag').val(tags);

        GetProjectProduct();
        GetPrjImage();
    } else {
        $('#PrjName').val('');
        $('#PrjDate').val('');
        $('#PrjLocation').val('');
        $('#PrjClient').val('');
        $('#PrjDesigner').val('');
        $('#PrjDescription').val('');

        $('#PrjTag').val('');

        $('#div_all_prds').hide();
        $('#div_all_imgs').hide();
        $('#div_project').removeClass('col-md-4');
        $('#div_project').addClass('col-md-12');

        $('#div_prds').empty();
    }
}

function CreateUpdatePrj(sender) {
    var checkOK = CheckRequiredFieldInOneDiv('div_project');
    if (checkOK) {
        var onePrj = {};
        onePrj.PrjId = $('#PrjId').val() * 1;
        onePrj.PrjName = $('#PrjName').val();
        onePrj.PrjActived = $('#PrjActived').is(':checked');
        onePrj.PrjDate = getDateFromStringFr('#PrjDate');
        onePrj.PrjLocation = $('#PrjLocation').val();
        onePrj.PrjClient = $('#PrjClient').val();
        onePrj.PrjDesigner = $('#PrjDesigner').val();
        onePrj.PrjDescription = $('#PrjDescription').val();
        onePrj.PrjRecommended = $('#PrjRecommended').is(':checked');
        onePrj.PrjTag = $('#PrjTag').val();
        var url = window.webservicePath + "/CreateUpdateSiteProject";
        var jsondata = JSON.stringify({ onePrj: onePrj });
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
                    //setPrdRcmd(budgetId, data2Treat);
                    getAllProjet(data2Treat);
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
    return false;
}

function addProduct() {
    var prdname = $('#ProductName').val();
    var prdId = $("#hf_prd_id").text() * 1;
    var prjId = $('#PrjId').val() * 1;
    if (prdname && prdId && prjId) {
        var url = window.webservicePath + '/CreateProjectProduct';
        var datastr = '{prjId:' + prjId + ',prdId:' + prdId + '}';
        $.ajax({
            type: "POST",
            url: url,
            contentType: "application/json; charset=utf-8",
            dataType: "json",
            data: datastr,
            success: function (data) {
                $('#ProductName').val('');
                var jsdata = data.d;
                var data2Treat = jQuery.parseJSON(jsdata);
                if (data2Treat !== '-1') {
                    SetProducts(data2Treat);
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
    return false;
}

function GetProjectProduct() {
    var prjId = $('#PrjId').val() * 1;
    if (prjId) {
        var url = window.webservicePath + '/GetAllSiteProjectProducts';
        var datastr = '{prjId:' + prjId + '}';
        $.ajax({
            type: "POST",
            url: url,
            contentType: "application/json; charset=utf-8",
            dataType: "json",
            data: datastr,
            success: function (data) {
                var jsdata = data.d;
                var data2Treat = jQuery.parseJSON(jsdata);
                if (data2Treat !== '-1') {
                    SetProducts(data2Treat);
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

function SetProducts(prds) {
    var content = "";
    var budgetId = "#div_prds";
    $(budgetId).empty();
    if (prds && prds.length > 0) {
        content += "<table cellpadding='0' cellspacing='0' border='0' class='datatable table table-striped table-bordered table-hover' style='width:100%'>";
        content += "<thead><tr>" +
                    "<th>Produit</th>" + "<th>Réf.</th>" + "<th>Image</th><th style='width:20px;'></th>" +
                    "</tr></thead>";
        $.each(prds, function (name, value) {
            var imgsrc = value.PrdImg ? ('../../Services/ShowOutSiteImage.ashx?file=' + value.PrdImg) : '';
            var imgContent = value.PrdImg ? "<img src='" + imgsrc + "' alt=''   class='img-responsive'  style='width: 100px' />" : '';
            var prd = "<tr><td><a href='Product.aspx?prdId=" + value.FId + "&mode=view' target='_blank'>" + value.PrdName + " " + value.PrdSubName + "</a></td>" +
                "<td><a href='Product.aspx?prdId=" + value.FId + "&mode=view' target='_blank'>" + value.PrdRef + "</a></td>" +
                "<td style='width:100px;'>" + imgContent + "</td>" +
                "<td><button class='btn btn-inverse' prdId='" + value.PrdId + "' title='Ajouter ce produit' onclick='return DeleteProjectProduct(this)'><i class='fa fa-times'></i></button></td>" + "</tr>";

            content += prd;
        });


        content += "</tbody>";
        content += "</table>";

        $(budgetId).append(content);
    } else {

    }
}

function DeleteProjectProduct(sender) {
    var prdId = $(sender).attr('prdId') * 1;
    var prjId = $('#PrjId').val() * 1;
    if (prdId && prjId) {
        var url = window.webservicePath + '/DeleteProjectProduct';
        var datastr = '{prjId:' + prjId + ',prdId:' + prdId + '}';
        $.ajax({
            type: "POST",
            url: url,
            contentType: "application/json; charset=utf-8",
            dataType: "json",
            data: datastr,
            success: function (data) {
                $('#ProductName').val('');
                var jsdata = data.d;
                var data2Treat = jQuery.parseJSON(jsdata);
                if (data2Treat !== '-1') {
                    SetProducts(data2Treat);
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
    return false;
}

function setAutoComplete() {
    var url = window.webservicePath + "/GetProductsByRef";
    $("#ProductName").autocomplete({
        source: function (request, response) {
            $.ajax({
                url: url,
                data: "{ 'prdRef': '" + request.term + "'}",
                dataType: "json",
                type: "POST",
                contentType: "application/json; charset=utf-8",
                success: function (data) {
                    var jsdata = data.d;
                    var data2Treat = jQuery.parseJSON(jsdata);
                    if (data2Treat.length > 0) {
                        response($.map(data2Treat, function (item) {
                            return {
                                label: item.PrdRef,
                                val: item.FId,
                                datavalue: item.PrdId
                                //datavalue: item.PrdImg,
                            }
                        }));
                    } else {
                        $("#hf_prd_id").text('0');
                    }
                },
                error: function (response) {
//                    alert(response.responseText);
                },
                failure: function (response) {
                    alert(response.responseText);
                }
            });
        },
        select: function (e, i) {
            $("#hf_prd_id").text(i.item.datavalue);
        },
        minLength: 2
    });
}


function CreateUpdateImageClick(sender) {
    var pigId = $(sender).attr('pigId');
    var order = $(sender).attr('order');
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
            "<label class='col-sm-4 control-label'>Ordre</label>" +
            "<div class='col-sm-8'><input type='number' id='PigOrder' class='form-control' min='0' value=" + order + " /></div>" +
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
            "<span>Image</span>" +
            "<input type='file' id='btnUpdatePhoto' name='files[]' accept='image/*' onchange='getFileDataPopUp(this);' value='Photo' /></span>" +
            "<button type='reset' class='btn btn-inverse cancel'  style='display: none;' id='btnCancelPhoto' onclick='return CancelPhoto()'><i class='fa fa-ban'></i><span>Annuler</span></button>" +
            "<button class='btn btn-inverse bootbox-close-button' style='display:none;' onclick='return false'><span>Annuler</span></button></div> <!-- The global progress information -->" +
            "<div class='col-md-12' style='text-align: center; margin-bottom: 20px;'>" +
            "<div>File Name : <span id='uploadFileNamePopUp'></span></div><br/>" +
            "</div></div></form>" +
            "</div>" +

    // close box
            "</div></div></div></div></div>";

    var btnAddUpdate = "<button class='btn btn-inverse' id='btnSubmitUploadFilePopUp'  pigId='" + pigId + "' type='button' onclick='CreateUpdateImage(this)'><span>Sauvegarder</span></button>";
    var btnClose = "<button class='btn btn-default bootbox-close-button' id='btnCancelUploadFilePopUp' onclick='return false'><span>Annuler</span></button>";

    var btns = "<div class='modal-body center'>" + btnClose + btnAddUpdate + "</div>";
    var onecontent = startBox + onelineContent + btns + endBox;

    var title = 'IMAGE';
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
    return false;
}

function CreateUpdateImage(sender) {
    var pigId = $(sender).attr('pigId') * 1;
    var prjId = $('#PrjId').val() * 1;
    var order = $('#PigOrder').val() * 1;
    var formData = new FormData();
    formData.append('file', $('#btnUpdatePhoto')[0].files[0]);
    ShowPleaseWait();
    if (prjId) {
        var url = "../../Services/UploadFilesGeneral.ashx?type=10&prjId=" + prjId + "&pigId=" + pigId + "&order=" + order;
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
                    $('#btnCancelUploadFilePopUp').click();
                    GetPrjImage();
                    HidePleaseWait();
                },
                error: function (e) {
                    //errorHandler
                    $('#btnCancelUploadFilePopUp').click();
                    HidePleaseWait();
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

    return false;
}

function getFileDataPopUp() {
    $('#btnCancelPhoto').show();
    var file = $('#btnUpdatePhoto')[0].files[0];
    var filename = file.name;
    $('#uploadFileNamePopUp').text(filename);
}

function CancelPhoto() {
    $('#btnUpdatePhoto').val('');
    $('#btnCancelPhoto').hide();
    return false;
}

function setPageType() {
    App.setPage("gallery"); //Set current page
    App.init(); //Initialise plugins and elements
}

function GetPrjImage() {
    var prjId = $('#PrjId').val();
    if (prjId) {
        $('#div_images').empty();
        var url = window.webservicePath + "/LoadSiteProjectImages";
        var datastr = '{prjId:' + prjId + '}';
        $.ajax({
            type: "POST",
            url: url,
            data: datastr,
            contentType: "application/json; charset=utf-8",
            dataType: "json",
            success: function (data) {
                var jsdata = data.d;
                var data2Treat = jQuery.parseJSON(jsdata);
                if (data2Treat !== '-1') {
                    setProductImage(data2Treat, '#div_images');
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

function setProductImage(images, budgetId) {
    $.each(images, function (name, value) {
        var imgContent = "<div class='col-md-6 item' id='div_one_pig_" + value.PigId + "'><div class='filter-content'  style='height:200px !important;max-height: 300px !important'>" +
            "<img src='../../Services/ShowOutSiteImage.ashx?file=" + value.PigPath + "' alt=''   class='img-responsive'  style='width: 100%' />" +
            "<div class='hover-content'><h4>" + value.PigOrder + "</h4>" +
            "<a class='btn btn-inverse hover-link' pigId='" + value.PigId + "' onclick='deleteImageClick(this)'>" +
            "<i class='fa fa-times fa-1x'></i></a>" +
            "<a class='btn btn-inverse hover-link' pigId='" + value.PigId + "' order='" + value.PigOrder + "' onclick='CreateUpdateImageClick(this)'>" +
            "<i class='fa fa-edit fa-1x'></i></a>" +
            "<a class='btn btn-inverse hover-link colorbox-button'href='../../Services/ShowOutSiteImage.ashx?file=" + value.PigPath + "' title='" + value.PigOrder + "'>" +
            "<i class='fa fa-search-plus fa-1x'></i></a>" +
            "</div></div></div>";
        $(budgetId).append(imgContent);
    });
    setPageType();
}



function deleteImageClick(sender) {
    var pigId = $(sender).attr('pigId');
    if (pigId) {
        var title = "ATTENTION";
        var content = "<div class='box'><div class='box-body' style='height: 150px;'>" +
        "<div class='form-horizontal'>" +
        "<div class='col-md-12'>" +
        "<div class='form-group'>" +
        "<div class='col-sm-12' style='text-align:center;font-size: 18pt;'>" +
        "Attention !<br/>La suppression est irrécupérable, veuillez confirmer !!!</div></div></div></div></div></div>"
        + "<div class='modal-footer center'>" +
        "<button type='button' class='btn btn-default' onclick='closeDialog()'>Annuler</button>" +
        "<button type='button' class='btn btn-inverse' pigId='" + pigId + "' onclick='return deleteImage(this);'>SUPPRIMER</button></div>";
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
    var pigId = $(sender).attr('pigId') * 1;
    var prjId = $('#PrjId').val() * 1;
    if (pigId) {
        ShowPleaseWait();
        var url = window.webservicePath + "/DeleteSiteProjectImages";
        $.ajax({
            type: "POST",
            data: '{prjId:' + prjId + ',pigId:' + pigId + '}',
            url: url,
            contentType: "application/json; charset=utf-8",
            dataType: "json",
            success: function (data) {
                HidePleaseWait();
                var jsdata = data.d;
                var data2Treat = jQuery.parseJSON(jsdata);
                if (data2Treat !== '-1') {
                    HidePleaseWait();
                    GetPrjImage();
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
