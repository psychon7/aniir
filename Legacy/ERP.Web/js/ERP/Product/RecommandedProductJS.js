$(document).ready(iniAll);
function iniAll() {
    GetTopCats();

    SetLanguageBar();
}

function GetTopCats() {
    var elementId = 'CatId';
    var url = window.webservicePath + "/GetTopCategory";
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
                $(budgetId).append($("<option class='language_txt'></option>")
                            .attr("value", "0")
                            .text("Sélectionner une catégorie"));
                $.each(data2Treat, function (name, value) {
                    $(budgetId)
                        .append($("<option></option>")
                            .attr("value", value.CatId)
                            .text(value.CatName));
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

function CatChanged(sender) {
    var catId = $(sender).find('option:selected').val();
    catId = catId * 1;
    //console.log(catId);
    if (catId) {
        getAllProductsInCat(catId);
        getRecmdPrd(catId);
    } else {
        $('#div_prd_in_cat').empty();
        $('#div_prd_rcmd').empty();
    }
}

function getAllProductsInCat(catId) {
    var url = window.webservicePath + "/GetAllProductsInCat";
    var budgetId = '#div_prd_in_cat';
    var datastr = '{catId:' + catId + '}';
    $(budgetId).empty();
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
                var content = "<table cellpadding='0' cellspacing='0' border='0' class='datatable table table-striped table-bordered table-hover' style='width:100%'>";
                content += "<thead><tr>" +
                    "<th class='language_txt'>Produit</th>" + "<th class='language_txt'>Réf.</th>" + "<th class='language_txt'>Image</th><th style='width:20px;'></th>" +
                    "</tr></thead>";
                content += "<tbody>";
                $.each(data2Treat, function (name, value) {
                    var imgsrc = value.PrdImg ? ('../../Services/ShowOutSiteImage.ashx?file=' + value.PrdImg) : '';
                    var imgContent = value.PrdImg ? "<img src='" + imgsrc + "' alt=''   class='img-responsive'  style='width: 100px' />" : '';
                    var prd = "<tr><td><a href='Product.aspx?prdId=" + value.FId + "&mode=view' target='_blank'>" + value.PrdSubName + " " + value.PrdName + "</a></td>" +
                        "<td><a href='Product.aspx?prdId=" + value.FId + "&mode=view' target='_blank'>" + value.PrdRef + "</a></td>" +
                        "<td style='width:100px;'>" + imgContent + "</td>" +
                        "<td><button class='btn btn-inverse' prdId='" + value.PrdId + "' title='Ajouter ce produit' onclick='return AddPrdToRMP(this)'><i class='fa fa-plus'></i></button></td>" +
                        "</tr>";
                    content += prd;
                    //$(budgetId).append(prd);
                });
                content += "</tbody>";
                content += "</table>";
                $(budgetId).append(content);
            } else {
                // authentication error
                AuthencationError();
            }

            SetLanguageBar();
        },
        error: function (data) {
            var test = '';
        }
    });
}

function getRecmdPrd(catId) {
    var url = window.webservicePath + "/GetRecommandedPrd";
    var budgetId = '#div_prd_rcmd';
    var datastr = '{catId:' + catId + '}';
    $(budgetId).empty();
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
                setPrdRcmd(budgetId, data2Treat);
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


function AddPrdToRMP(sender) {
    var prdId = $(sender).attr('prdid');
    var catId = $('#CatId').val();
    //console.log(prdId);
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
            "<div class='col-sm-8'><input type='number' id='RmpOrder' value='1' class='form-control' step='1' /></div>" +
            "</div>" +
    // close box
            "</div></div></div></div></div>";

    var btnAddUpdate = "<button class='btn btn-inverse' id='btn_add_prd' name='btn_add_prd' catId='" + catId + "' prdId='" + prdId + "' onclick='return AddPrd(this)'><span>Sauvegarder</span></button>";
    var btnClose = "<button class='btn btn-default bootbox-close-button' onclick='return false'><span>Annuler</span></button>";

    var btns = "<div class='modal-body center'>" + btnClose + btnAddUpdate + "</div>";
    var onecontent = startBox + onelineContent + btns + endBox;

    var title = 'Ordre de produit';
    bootbox.dialog({
        title: title,
        message: onecontent
    })
    //    .find('.modal-dialog').css({
    //        'width': '70%'
    //    })
    .find('.modal-content').css({
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

function AddPrd(sender) {
    var prdId = $(sender).attr('prdId');
    var catId = $(sender).attr('catId');
    var order = $('#RmpOrder').val() * 1;
    var url = window.webservicePath + "/AddProductInCat";
    var budgetId = '#div_prd_rcmd';
    var datastr = '{catId:' + catId + ',prdId:' + prdId + ',order:' + order + ',actived:true}';
    $(budgetId).empty();
    closeDialog();
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
                setPrdRcmd(budgetId, data2Treat);
            } else {
                // authentication error
                AuthencationError();
            }
        },
        error: function (data) {
            var test = '';
        }
    });
    return false;
}

function setPrdRcmd(budgetId, products) {
    var content = "<table cellpadding='0' cellspacing='0' border='0' class='datatable table table-striped table-bordered table-hover' style='width:100%'>";
    content += "<thead><tr>" +
        "<th class='language_txt'>Ordre</th>" +
        "<th class='language_txt'>Activé</th>" +
        "<th class='language_txt'>Produit</th>" +
        "<th class='language_txt'>Réf.</th>" +
        "<th class='language_txt'>Image</th><th style='width:20px;'></th>" +
        "</tr></thead>";
    content += "<tbody>";
    $.each(products, function (name, value) {
        var imgsrc = value.PrdImg ? ('../../Services/ShowOutSiteImage.ashx?file=' + value.PrdImg) : '';
        var imgContent = value.PrdImg ? "<img src='" + imgsrc + "' alt=''   class='img-responsive'  style='width: 100px' />" : '';
        var prd = "<tr>" +
            "<td style='width:100px;'><input value='" + value.RmpOrder + "' id='RmpOrder_" + value.PrdId + "' class='form-control' type='number' min='0' step='1'/></td>" +
            "<td style='width:30px;'><input  " + (value.RmpActived ? "checked" : "" )+ " id='RmpActived_" + value.PrdId + "' class='form-control' type='checkbox' /></td>" +
            "<td><a href='Product.aspx?prdId=" + value.FId + "&mode=view' target='_blank'>" + value.PrdSubName + " " + value.PrdName + "</a></td>" +
            "<td><a href='Product.aspx?prdId=" + value.FId + "&mode=view' target='_blank'>" + value.PrdRef + "</a></td>" +
            "<td style='width:100px;'>" + imgContent + "</td>" +
            "<td style='width:100px;'><button class='btn btn-inverse' prdId='" + value.PrdId + "' title='Mettre à jour' onclick='return UpdatePrdToRMP(this)'><i class='fa fa-refresh'></i></button>" +
            "<button class='btn btn-inverse' prdId='" + value.PrdId + "' title='Supprimer' onclick='return deleteRmpClick(this)'><i class='fa fa-times'></i></button></td>" +
            "</tr>";
        content += prd;
        //$(budgetId).append(prd);
    });
    content += "</tbody>";
    content += "</table>";
    $(budgetId).append(content);

    SetLanguageBar();
}

function deleteRmpClick(sender) {
    var prdId = $(sender).attr('prdid');
    prdId = prdId * 1;
    var fun = 'DeleteRmp(' + prdId + ')';
    MsgPopUpWithResponseChoice('SUPPRESSION', 'Veuillez confirmer la suppression', 'Supprimer', fun, 'Annuler');
    return false;
}

function DeleteRmp(prdId) {
    var catId = $('#CatId').val();
    var url = window.webservicePath + "/DeleteProductInCat";
    var datastr = '{catId:' + catId + ',prdId:' + prdId + '}';
    var budgetId = '#div_prd_rcmd';
    $(budgetId).empty();
    closeDialog();
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
                setPrdRcmd(budgetId, data2Treat);
            } else {
                // authentication error
                AuthencationError();
            }
        },
        error: function (data) {
            var test = '';
        }
    });
    return false;
}

function UpdatePrdToRMP(sender) {
    var prdId = $(sender).attr('prdid');
    var catId = $('#CatId').val();
    var actived = $('#RmpActived_' + prdId).is(':checked');
    var order = $('#RmpOrder_' + prdId).val() * 1;
    var url = window.webservicePath + "/AddProductInCat";
    var budgetId = '#div_prd_rcmd';
    var datastr = '{catId:' + catId + ',prdId:' + prdId + ',order:' + order + ',actived:' + actived + '}';
    $(budgetId).empty();
    closeDialog();
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
                setPrdRcmd(budgetId, data2Treat);
            } else {
                // authentication error
                AuthencationError();
            }
        },
        error: function (data) {
            var test = '';
        }
    });

    return false;
}
