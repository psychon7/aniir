$(document).ready(initFunc);

var disabled = _isView ? ' disabled ' : '';

function initFunc() {
    if (_isView || _isModify) {
        if (_isModify) {
            getAllCategory(true);
        } else {
            //getProductTypes();
            loadCategory();
            getProductInThisCat();
        }
    } else {
        getAllCategory();
    }
    initMode();
    SetLanguageBar();
}

function loadCategory() {
    var catId = getParameterByName('catId');
    if (catId) {
        var url = window.webservicePath + "/LoadOneCategory";
        var datastr = "{catId:'" + catId + "'}";
        $.ajax({
            type: "POST",
            url: url,
            contentType: "application/json; charset=utf-8",
            data: datastr,
            dataType: "json",
            success: function (data) {
                var jsdata = data.d;
                var data2Treat = jQuery.parseJSON(jsdata);
                if (data2Treat !== '-1') {
                    var oneCat = data2Treat;
                    $.each(oneCat, function (name, value) {
                        var newname = name;
                        if (newname === 'CatParentCatName' || newname === 'CatImagePath') {
                            if (newname === 'CatParentCatName') {
                                if (_isView) {
                                    $('#CatParentCatId').empty();
                                    $('#CatParentCatId').append($("<option></option>").text(value));
                                    $('#CatParentCatId').prop('disabled', true);
                                }
                            } else {
                                if (value) {
                                    var src = "../../Services/ShowOutSiteImage.ashx?file=" + value;
                                    $('#img_cat').attr('src', src);
                                    $('#img_cat').attr('height', '300');
                                    $('#btn_delete_cat_img').show();
                                } else {
                                    $('#img_cat').attr('height', '0');
                                }
                            }
                        } else {
                            setFieldValue(newname, value, true);
                        }
                    });

                    //                    if (oneCat.SubCategories && oneCat.SubCategories.length > 0) {
                    //                        setSubCategory('┝ ', oneCat.SubCategories);
                    //                    }
                    getAllCategoryForConsult(oneCat.FId);
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

function getAllCategory(loadCat) {
    var url = window.webservicePath + "/GetAllCategory";
    $.ajax({
        type: "POST",
        url: url,
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        success: function (data) {
            var jsdata = data.d;
            var data2Treat = jQuery.parseJSON(jsdata);
            if (data2Treat !== '-1') {
                //$('#CatParentCatId').empty();
                $.each(data2Treat, function (name, value) {
                    $('#CatParentCatId').append($("<option></option>").attr("value", value.CatId).text(value.CatName));
                });
                if (loadCat) {
                    loadCategory();
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

function js_create_update_cat() {
    var oneCat = {};
    oneCat.FId = getParameterByName('catId');
    oneCat.CatName = $('#CatName').val();
    //alert(oneCat.CatName);
    if (oneCat.CatName && replaceAll($('#CatName').val(), ' ', '')) {
        $('#CatName').removeClass('error_border');
        oneCat.CatSubName1 = $('#CatSubName1').val();
        oneCat.CatSubName2 = $('#CatSubName2').val();
        oneCat.CatOrder = Math.abs($('#CatOrder ').val()) * 1;
        oneCat.CatIsActived = $('#CatIsActived').is(':checked');
        oneCat.CatDisplayInMenu = $('#CatDisplayInMenu').is(':checked');
        oneCat.CatDisplayInExhibition = $('#CatDisplayInExhibition').is(':checked');
        oneCat.CatParentCatId = $('#CatParentCatId').val() * 1;
        oneCat.CatDescription = $('#CatDescription').val();

        var jsondata = JSON.stringify({ oneCategory: oneCat });

        myApp.showPleaseWait();
        $.ajax({
            url: 'Category.aspx/CreateUpdateCategory',
            type: 'POST',
            contentType: 'application/json; charset=utf-8',
            data: jsondata,
            dataType: 'json',
            success: function (data) {
                var cplId = data.d;
                var url = 'Category.aspx';
                var newUrl = url + '?catId=' + cplId + '&mode=view';
                document.location.href = newUrl;
            },
            error: function (data) {
                myApp.hidePleaseWait();
            }
        });
    } else {
        $('#CatName').addClass('error_border');
    }
    return false;
}

function UploadCatImage(sender) {
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
            "<input type='file' id='iptUploadFilePopUp' name='files[]' accept='image/*' onchange='getFileDataPopUp(this);'></span>" +
            "<button type='button' class='btn btn-inverse start' style='display: none;' id='btnSubmitUploadFilePopUp' onclick='return uploadFileClick()'><i class='fa fa-arrow-circle-o-up'></i><span>Télécharger</span></button>" +
            "<button type='reset' class='btn btn-default cancel'  style='display: none;' id='btnCancelUploadFilePopUp' onclick='return hideUploadPopUp()'><i class='fa fa-ban'></i><span>Annuler</span></button>" +
            "<button class='btn btn-default bootbox-close-button' style='display:none;' onclick='return false'><span>Annuler</span></button></div> <!-- The global progress information -->" +
            "<div class='col-md-12' style='text-align: center; margin-bottom: 20px;'>" +
            "<div>File Name : <span id='uploadFileNamePopUp'></span></div><br/>" +
            "</div></div></form>" +
            "</div></div></div>";

        bootbox.dialog({
            title: title,
            message: content
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

    } catch (e) {
    }
    return false;

}

function uploadFileClick() {
    var formData = new FormData();
    formData.append('file', $('#iptUploadFilePopUp')[0].files[0]);
    var itemId = getUrlVars()['catId'];
    var url = "../../Services/UploadFilesGeneral.ashx?type=8&catId=" + encodeURIComponent(itemId);
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
                if (e) {
                    var src = "../../Services/ShowOutSiteImage.ashx?file=" + e;
                    $('#img_cat').attr('src', src);
                    $('#img_cat').attr('height', '300');
                    $('#btn_delete_cat_img').show();
                } else {
                    $('#img_cat').attr('height', '0');
                    $('#btn_delete_cat_img').hide();
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

function delete_cat_img_click_confirm() {
    var title = "ATTENTION";
    var content = "<div class='box'><div class='box-body' style='height: 50px;'>" +
        "<div class='form-horizontal'>" +
        "<div class='col-md-12'>" +
        "<div class='form-group'>" +
        "<div class='col-sm-12' style='text-align:center;font-size: 18pt;'>Veuillez confirmer la suppression ! " +
        "</div></div></div></div></div></div>"
        + "<div class='modal-footer center'>" +
        "<button type='button' class='btn btn-default' onclick='closeDialog()'>Annuler</button>" +
        "<button type='button' class='btn btn-inverse' onclick='return delete_cat_img();'>SUPPRIMER</button></div>";
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

function delete_cat_img() {
    var catId = getParameterByName('catId');
    if (catId) {
        var url = window.webservicePath + "/DeleteCatFile";
        var datastr = "{catId:'" + catId + "'}";
        $.ajax({
            type: "POST",
            url: url,
            contentType: "application/json; charset=utf-8",
            data: datastr,
            dataType: "json",
            success: function (data) {
                var jsdata = data.d;
                var data2Treat = jQuery.parseJSON(jsdata);
                if (data2Treat !== '-1') {
                    $('#img_cat').attr('height', '0');
                    $('#btn_delete_cat_img').hide();
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

function delete_cat_click_confirm() {
    var title = "ATTENTION";
    var content = "<div class='box'><div class='box-body' style='height: 100px;'>" +
        "<div class='form-horizontal'>" +
        "<div class='col-md-12'>" +
        "<div class='form-group'>" +
        "<div class='col-sm-12' style='text-align:center;font-size: 18pt;'>Veuillez confirmer la suppression ! " +
        "<br/>La suppression est irrécupérable, veuillez confirmer !!!</div></div></div></div></div></div>"
        + "<div class='modal-footer center'>" +
        "<button type='button' class='btn btn-default' onclick='closeDialog()'>Annuler</button>" +
        "<button type='button' class='btn btn-inverse' onclick='return delete_Cat(this);'>SUPPRIMER</button></div>";
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

function delete_Cat(sender) {
    var catId = getParameterByName('catId');
    var url = window.webservicePath + "/DeleteProduct";
    // 如果是，说明已经存在product，从数据库删除
    $.ajax({
        url: url,
        type: 'POST',
        contentType: 'application/json; charset=utf-8',
        data: "{catId:'" + catId + "'}",
        dataType: 'json',
        success: function (data) {
            var deleted = data.d;
            if (deleted) {
                window.location = 'SearchProduct.aspx';
            } else {
                MsgErrorPopUp('Suppression erreur', 'DATA IN USE');
                //alert('ERROR : DATA IN USE');
            }
        },
        error: function (data) {
            alert(data.responseText);
        }
    });
}

function setSubCategory(prefix, subCategories) {
    if (subCategories && subCategories.length > 0) {
        $.each(subCategories, function (order, onecat) {
            var content = "<tr><td style='vertical-align:middle; text-align:left' onclick='viewItem(\"" + onecat.FId + "\")'>" + prefix + onecat.CatName + "</td></tr>";
            $('#tbody_sub_cats').append(content);
            var newprf = '┝ ' + prefix;
            setSubCategory(newprf, onecat.SubCategories);
        });
    }
}

function viewItem(fId) {
    var catId = getParameterByName('catId');
    if (catId !== fId) {
        //        myApp.showPleaseWait();
        //        var url = 'Category.aspx?catId=' + fId + '&mode=view';
        //        window.location.href = url;
        //var url = 'Category.aspx?catId=' + fId + '&mode=view&withoutsub=true&hideHeader=yes&hideSideMenu=yes&hideAllBtn=yes';
        var url = 'Category.aspx?catId=' + fId + '&mode=view';
        window.location = url;
        //pageSnapShot(url);
    }
}

function getAllCategoryForConsult(catFId) {
    var url = window.webservicePath + "/GetAllCategory";
    $.ajax({
        type: "POST",
        url: url,
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        success: function (data) {
            var jsdata = data.d;
            var data2Treat = jQuery.parseJSON(jsdata);
            if (data2Treat !== '-1') {
                //$('#CatParentCatId').empty();
                $('#rst_cat').val(data2Treat.length);
                if (data2Treat.length > 0) {
                    $('#div_search_result').show();
                    var withoutsub = getParameterByName('withoutsub');
                    var pointer = !withoutsub ? "cursor:pointer;" : "";
                    $.each(data2Treat, function (name, value) {
                        var content = "";
                        var clickevent = !withoutsub ? "onclick='viewItem(\"" + value.FId + "\")'" : '';
                        if (value.FId === catFId) {
                            content = "<tr><td style='text-align: left;' ><span style='color: red;'>" + value.CatName + "</span></td></tr>";
                        } else {
                            content = "<tr><td style='" + pointer + " text-align: left;' " + clickevent + "><span>" + value.CatName + "</span></td></tr>";
                        }
                        $('#tbody_sub_cats').append(content);
                    });
                }
            }
        },
        error: function (data) {
            var test = '';
        }
    });
}


var allPcas = [];
function getProductInThisCat() {
    var catId = getParameterByName('catId');
    if (catId) {
        var datastr = "{prdId:'',catId:'" + catId + "'}";
        var url = window.webservicePath + "/GetAllPcas";
        $.ajax({
            url: url,
            type: 'POST',
            contentType: 'application/json; charset=utf-8',
            data: datastr,
            dataType: 'json',
            success: function (data) {
                var jsdata = data.d;
                var jsondata = jQuery.parseJSON(jsdata);
                allPcas = [];
                allPcas = jsondata;
                if (jsondata !== '-1') {
                    setPca(jsondata);
                } else {
                    AuthencationError();
                }
            },
            error: function (data) {
                myApp.hidePleaseWait();
            }
        });
    }
    return false;
}


var hasSet = false;
function setPca(data2Treat) {
    var name = '_pcas';
    var dt_name = 'dt' + name;
    var div_name = 'div' + name;
    var th_name = 'th' + name;
    var tb_name = 'tb' + name;
    var tf_name = 'tf' + name;
    var rst_name = 'rst' + name;

    var headerFooter = "<tr>" +
        "<th style='text-align:center'>Type</th>" +
        "<th style='text-align:center'>Nom</th>" +
        "<th style='text-align:center'>Famille</th>" +
        "<th style='text-align:center'>Réf</th>" +
        "<th style='text-align:center'>Code</th>" +
        "<th style='text-align:center'>Image</th>" +
        "<th style='text-align:center'>Description de produit</th>" +
        "<th style='text-align:center'>Description de catégorie</th>" +
        "<th style='text-align:center; width:7%'></th>" +
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
        $('#' + th_name).empty();
        $('#' + tf_name).empty();

        $('#' + th_name).append(headerFooter);
        $('#' + tf_name).append(headerFooter);

        var titles = new Array();
        titles.push({ "sTitle": "Type" });
        titles.push({ "sTitle": "Nom" });
        titles.push({ "sTitle": "Famille" });
        titles.push({ "sTitle": "Réf" });
        titles.push({ "sTitle": "Code" });
        titles.push({ "sTitle": "Image" });
        titles.push({ "sTitle": "DesPrd" });
        titles.push({ "sTitle": "DesPca" });
        titles.push({ "sTitle": "Delete" });

        var displaycount = 1;
        $.each(data2Treat, function (name, value) {
            var dataArray = new Array();
            dataArray.push("<span style='cursor:pointer' onclick='modifyPca(this)' pcaId='" + value.Id + "'>" + value.Product.ProductType + "</span>");
            dataArray.push("<div style='width:100%;'><span style='cursor:pointer' onclick='viewPrd(this)' pcaId='" + value.Id + "' prdId='" + value.Product.FId + "'><strong>" + value.Product.PrdName + "</strong></span></div>");
            dataArray.push("<div style='width:100%;'><span style='cursor:pointer' onclick='modifyPca(this)' pcaId='" + value.Id + "'>" + value.Product.PrdSubName + "</span></div>");
            dataArray.push("<span style='cursor:pointer' onclick='modifyPca(this)' pcaId='" + value.Id + "'>" + value.Product.PrdRef + "</span>");
            dataArray.push("<span style='cursor:pointer' onclick='modifyPca(this)' pcaId='" + value.Id + "'>" + value.Product.PrdCode + "</span>");
            if (value.Product.PrdImg) {
                dataArray.push("<img src='../../Services/ShowOutSiteImage.ashx?file=" + value.Product.PrdImg + "' alt=''   class='img-responsive'  style='width: 50%' />");
            } else {
                dataArray.push("");
            }


            var PrdOutsideDiameter = value.Product.PrdOutsideDiameter;
            var PrdLength = value.Product.PrdLength;
            var PrdWidth = value.Product.PrdWidth;
            var PrdHeight = value.Product.PrdHeight;
            var additionnalInfo = "";
            if (PrdOutsideDiameter) {
                additionnalInfo += "Diamètre extérieur : " + PrdOutsideDiameter + " mm<br/>";
            }
            if (PrdLength) {
                additionnalInfo += "Longueur : " + PrdLength + " mm<br/>";
            }
            if (PrdWidth) {
                additionnalInfo += "Largeur : " + PrdWidth + " mm<br/>";
            }
            if (PrdHeight) {
                additionnalInfo += "Hauteur : " + PrdHeight + " mm";
            }
            var alldes = (value.Product.PrdDescription!==null?value.Product.PrdDescription.trim() :"")+ "<br/>" + additionnalInfo.trim();

            var pcaDescription = value.PcaDescription;
            pcaDescription = replaceAll(pcaDescription, '\n', '<br/>');
            dataArray.push("<span style='cursor:pointer' onclick='modifyPca(this)' pcaId='" + value.Id + "'>" + alldes + "</span>");
            dataArray.push("<span style='cursor:pointer' onclick='modifyPca(this)' pcaId='" + value.Id + "'>" + pcaDescription + "</span>");
            var btns = "<button class='btn btn-inverse' title='Modifier' pcaId='" + value.Id + "' onclick='return modifyPca(this)'><i class='fa fa-edit'></i></button>" +
            "<button class='btn btn-inverse' onclick='return delete_pca_confirm(this)'  pcaId='" + value.Id + "' title='Supprimer'><i class='fa fa-times'></i></button>";
            dataArray.push(btns);
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
    }
}


function delete_pca_confirm(sender) {
    var pcaId = $(sender).attr('pcaid');
    var title = "ATTENTION";
    var content = "<div class='box'><div class='box-body' style='height: 100px;'>" +
        "<div class='form-horizontal'>" +
        "<div class='col-md-12'>" +
        "<div class='form-group'>" +
        "<div class='col-sm-12' style='text-align:center;font-size: 18pt;'>Veuillez confirmer la suppression ! " +
        "<br/>La suppression est irrécupérable, veuillez confirmer !!!</div></div></div></div></div></div>"
        + "<div class='modal-footer center'>" +
        "<button type='button' class='btn btn-default' onclick='closeDialog()'>Annuler</button>" +
        "<button type='button' class='btn btn-inverse' pcaId='" + pcaId + "' onclick='return deletePca(this);'>SUPPRIMER</button></div>";
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

function deletePca(sender) {
    var pcaId = $(sender).attr('pcaid') *1;
    var datastr = "{pcaId:" + pcaId + ",prdId:'',catId:''}";
    var url = window.webservicePath + "/DeletePca";
    $.ajax({
        url: url,
        type: 'POST',
        contentType: 'application/json; charset=utf-8',
        data: datastr,
        dataType: 'json',
        success: function (data) {
            getProductInThisCat();
        },
        error: function (data) {
            myApp.hidePleaseWait();
        }
    });
}

function modifyPca(sender) {
    var pcaId = $(sender).attr('pcaid') * 1;
    //alert(pcaId);
    var onepca = searchFieldValueInArray(allPcas, 'Id', pcaId);

    var title = jQuery.isEmptyObject(onepca) ? "Ajouter dans cette catégorie" : "Mettre à jour";
    var btnname = jQuery.isEmptyObject(onepca) ? "Ajouter" : "Mettre à jour";
    var prdref = !jQuery.isEmptyObject(onepca) ? onepca.Product.PrdRef : "";
    var prdid = !jQuery.isEmptyObject(onepca) ? onepca.Product.PrdId: '0';
    var content = "<div class='row'><div class='col-md-12'>" +
        "<div class='box-body' style='height: auto;' >" +
        "<div class='form-horizontal'>" +
        "<div class='col-md-12'>" +
        "<div class='row' style='margin-bottom: 20px;'>" +
        "<div class='col-md-12' id='div_add_rpd_2_cat' style='text-align:center;'></div>" +
        "<div class='col-md-12' style='margin-bottom:20px;'>" +
        "<div class='form-group'>" +
        "<label class='col-sm-4 control-label'>Référence de produit</label>" +
        "<div class='col-md-8'><input class='form-control' id='PrdId_" + pcaId + "' value='" +prdref  + "'/></div>" +
        "</div>" +
        "<div class='form-group'>" +
        "<label class='col-sm-4 control-label'>Description</label>" +
        "<div class='col-md-8'><textarea id='prdDescription_" + pcaId + "' disabled class='form-control' row='5' style='height:100px;'></textarea></div>" +
        "</div>" +
        "<div class='form-group'>" +
        "<label class='col-sm-4 control-label'>Description</label>" +
        "<div class='col-md-8'><textarea id='pcaDescription_" + pcaId + "' class='form-control' row='5'  style='height:100px;'></textarea></div>" +
        "</div>" +
        "</div>" +
        "<div class='col-md-12' >" +
        "<div class='col-md-6 center'>" +
        "<button type='button' class='btn btn-default' onclick='return closeDialog()'>Annuler</button>" +  "</div>" +
        "<div class='col-md-6 center'>" +
        "<button type='button' class='btn btn-inverse' id='btn_create_update_pca_" + pcaId + "' prdid='" + prdid + "' pcaid='" + pcaId + "' onclick='return js_create_update_pca(this)'>" + btnname + "</button>" +
        "</div>" +
        "</div>" +
        "</div>" +
        "</div>" +
        "</div></div></div></div>";
    bootbox.dialog({
        title: title,
        message: content
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

//    $('#select_pty_' + pcaId).empty();
//    $.each(prdTypes, function(name, value) {
//        if (onepca.Product.PtyId === value.Key) {
//            $('#select_pty_' + pcaId).append($("<option></option>").attr("selected", true).attr("value", value.Key).text(value.Value));
//        } else {
//            $('#select_pty_' + pcaId).append($("<option></option>").attr("value", value.Key).text(value.Value));
//        }
//    });

    setAutoComplete(pcaId);

    if (!jQuery.isEmptyObject(onepca)) {

        var PrdOutsideDiameter = onepca.Product.PrdOutsideDiameter;
        var PrdLength = onepca.Product.PrdLength;
        var PrdWidth = onepca.Product.PrdWidth;
        var PrdHeight = onepca.Product.PrdHeight;
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
        var alldes = onepca.Product.PrdName.trim() + "\r\n" + (onepca.Product.PrdDescription!==null?onepca.Product.PrdDescription.trim():'') + "\r\n" + additionnalInfo.trim();
        $('#prdDescription_' + pcaId).text(alldes);
        $('#pcaDescription_' + pcaId).text(onepca.PcaDescription);
    }

    return false;
}


var prdTypes = [];
function getProductTypes() {
    var url = window.webservicePath + "/GetProductTypes";
    var datastr = '{selectedType:0}';
    $.ajax({
        type: "POST",
        url: url,
        contentType: "application/json; charset=utf-8",
        data: datastr,
        dataType: "json",
        success: function (data) {
            var jsdata = data.d;
            var data2Treat = jQuery.parseJSON(jsdata);
            if (data2Treat !== '-1') {
                prdTypes = [];
                prdTypes = data2Treat;
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

var productList = [];
function setAutoComplete(pcaId) {
    var url = window.webservicePath + "/GetProductsByRef";
    $("#PrdId_" + pcaId).autocomplete({
        source: function(request, response) {
            $.ajax({
                url: url,
                data: "{ 'prdRef': '" + request.term + "'}",
                dataType: "json",
                type: "POST",
                contentType: "application/json; charset=utf-8",
                success: function(data) {
                    var jsdata = data.d;
                    var data2Treat = jQuery.parseJSON(jsdata);
                    productList = [];
                    productList = data2Treat;
                    if (data2Treat.length > 0) {
                        response($.map(data2Treat, function(item) {
                            return {
                                label: item.PrdRef,
                                val: item.FId,
                                datavalue: item.PrdImg,
                            }
                        }));
                    } else {
                    }
                },
                error: function(response) {
                    //alert(response.responseText);
                },
                failure: function(response) {
                    alert(response.responseText);
                }
            });
        },
        select: function(e, i) {
//            var onePrd = searchFieldValueInArray(productList, 'FId', i.item.val);
//            if (!jQuery.isEmptyObject(onePrd)) {
//                alert(onePrd.PrdName);
//            }
            SetOnePrd(pcaId,i.item.val);
        },
        minLength: 2
    });
}

function SetOnePrd(pcaId,fid) {
    var onePrd = searchFieldValueInArray(productList, 'FId', fid);
    if (!jQuery.isEmptyObject(onePrd)) {
            var PrdOutsideDiameter = onePrd.PrdOutsideDiameter;
            var PrdLength = onePrd.PrdLength;
            var PrdWidth = onePrd.PrdWidth;
            var PrdHeight = onePrd.PrdHeight;
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
        var alldes = onePrd.PrdName.trim() + "\r\n" + (onePrd.PrdDescription !== null ? onePrd.PrdDescription.trim() : "") + "\r\n" + additionnalInfo.trim();
            $('#prdDescription_' + pcaId).text(alldes);
        $('#btn_create_update_pca_' + pcaId).attr('prdid', onePrd.PrdId);
    }
}


function js_create_update_pca(sender) {
    var pcaId = $(sender).attr('pcaId') * 1;
    var prdId = $(sender).attr('prdId') * 1;
    var pcaDes = $('#pcaDescription_' + pcaId).val();
    var cat = getParameterByName('catId');
    var url = window.webservicePath + "/CreateUpdatePca";
    var datastr = "{pcaId: " + pcaId + ",prdId:'" + prdId + "',catId:'" + cat + "',pcaDes:'" + pcaDes + "',resType:2}";
    closeDialog();
    myApp.showPleaseWait();
    //getProductInThisCat();
    $.ajax({
        url: url,
        type: 'POST',
        contentType: 'application/json; charset=utf-8',
        data: datastr,
        dataType: 'json',
        success: function(data) {
            myApp.hidePleaseWait();
            var jsdata = data.d;
            var jsondata = jQuery.parseJSON(jsdata);
            allPcas = [];
            allPcas = jsondata;
            if (jsondata !== '-1') {

                setPca(jsondata);
            } else {
                AuthencationError();
            }
        },
        error: function(data) {
            myApp.hidePleaseWait();
        }
    });
}

function viewPrd(sender) {
    var prdId = $(sender).attr('prdId');
    var url = '../Product/Product.aspx?prdId=' + prdId + "&mode=view";
    //window.location.href = url;
    var win = window.open(url, '_blank');
    win.focus();
    return false;
}