



function createCat() {
    var url = 'Category.aspx?mode=create';
    window.location.href = url;
}



function newSearchCat() {
    $('#dt_cat').empty();
    getAllCategory();
    return false;
}


function getAllCategory() {
    var url = window.webservicePath + "/GetAllCategory";
    $.ajax({
        type: "POST",
        url: url,
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        success: function (data) {
            var searchname = $('#CatName').val().trim();
            var jsdata = data.d;
            var data2Treat = jQuery.parseJSON(jsdata);
            if (data2Treat !== '-1') {
                //$('#CatParentCatId').empty();
                $('#rst_cat').val(data2Treat.length);
                if (data2Treat.length > 0) {
                    $('#div_search_result').show();
                    var title = "<tr>" +
                        "<th class='language_txt'>Nom de catégorie</th>" +
                        "<th class='language_txt'>Image</th>" +
                        "<th class='language_txt'>Activé</th>" +
                        "<th class='language_txt'>Dans Menu</th>" +
                        "<th class='language_txt'>Dans Exposition</th>" +
                        "<th class='language_txt'>Total de produits</th>" +
                        "</tr>";
                    $('#dt_cat').append(title);
                    $.each(data2Treat, function (name, value) {
                        var content = "";
                        if (searchname) {
                            var catnameuppercase = value.CatName.toUpperCase();
                            var searchnameupper = searchname.toUpperCase();
                            if (catnameuppercase.indexOf(searchnameupper) >= 0) {
                                content = "<tr>" +
                                    "<td style='cursor:pointer;'  onclick='viewItem(\"" + value.FId + "\")'><span style='color: red;'>" + value.CatName + "</span></td>" +
                                    "<td style='text-align:center'>" + (value.CatImagePath ? "<img src='../../Services/ShowOutSiteImage.ashx?file=" + value.CatImagePath + "' height='60' width='60' />" : "") + "</td>" +
                                    "<td style='text-align:left'>" + (value.CatIsActived ? "Oui" : "Non") + "</td>" +
                                    "<td style='text-align:left'>" + (value.CatDisplayInMenu ? "Oui" : "Non") + "</td>" +
                                    "<td style='text-align:left'>" + (value.CatDisplayInExhibition ? "Oui" : "Non") + "</td>" +
                                    "<td style='text-align:right'>" + value.PrdCount + "</td>" +
                                    "</tr>";
                            } else {
                                content = "<tr>" +
                                    "<td style='cursor:pointer;'  onclick='viewItem(\"" + value.FId + "\")'><span>" + value.CatName + "</span></td>" +
                                    "<td style='text-align:center'>" + (value.CatImagePath ? "<img src='../../Services/ShowOutSiteImage.ashx?file=" + value.CatImagePath + "' height='60' width='60' />" : "") + "</td>" +
                                    "<td style='text-align:left'>" + (value.CatIsActived ? "Oui" : "Non") + "</td>" +
                                    "<td style='text-align:left'>" + (value.CatDisplayInMenu ? "Oui" : "Non") + "</td>" +
                                    "<td style='text-align:left'>" + (value.CatDisplayInExhibition ? "Oui" : "Non") + "</td>" +
                                    "<td style='text-align:right'>" + value.PrdCount + "</td>" +
                                    "</tr>";
                            }
                        } else {
                            content = "<tr>" +
                                "<td style='cursor:pointer;'  onclick='viewItem(\"" + value.FId + "\")'><span>" + value.CatName + "</span></td>" +
                                    "<td style='text-align:center'>" + (value.CatImagePath ? "<img src='../../Services/ShowOutSiteImage.ashx?file=" + value.CatImagePath + "' height='60' width='60' />" : "") + "</td>" +
                                    "<td style='text-align:left'>" + (value.CatIsActived ? "Oui" : "Non") + "</td>" +
                                    "<td style='text-align:left'>" + (value.CatDisplayInMenu ? "Oui" : "Non") + "</td>" +
                                    "<td style='text-align:left'>" + (value.CatDisplayInExhibition ? "Oui" : "Non") + "</td>" +
                                "<td style='text-align:right'>" + value.PrdCount + "</td>" +
                                "</tr>";
                        }
                        $('#dt_cat').append(content);
                    });

                    SetLanguageBar();
                }
                else {
                    $('#div_search_result').hide();
                    NoResultMsg();
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


var hasSet = false;
function jsSearchCat() {
    var url = window.webservicePath + "/SearchCategory";
    var name = $('#CatName').val().trim();
    var jsondata = JSON.stringify({ catName: name });
    myApp.showPleaseWait();
    $.ajax({
        url: url,
        type: 'POST',
        contentType: 'application/json; charset=utf-8',
        data: jsondata,
        dataType: 'json',
        success: function (data) {
            var jsdata = data.d;
            var jsondata = jQuery.parseJSON(jsdata);
            if (jsondata.length === 0) {
                NoResultMsg();
            }
            viewSearchResult(jsondata);
        },
        error: function (data) {
            myApp.hidePleaseWait();
        }
    });
    return false;
}


function viewSearchResult(data2Treat) {
    var name = '_cat';
    var dt_name = 'dt' + name;
    var div_name = 'div' + name;
    var th_name = 'th' + name;
    var tb_name = 'tb' + name;
    var tf_name = 'tf' + name;
    var rst_name = 'rst' + name;

    var headerFooter = "<tr>" +
        "<th style='text-align:center'>Nom de la catégorie</th>" +
        "<th style='text-align:center'>Image</th>" +
        "<th style='text-align:center'>Sous catégorie</th>" +
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
        $('.searchresult').show();
        $('#' + th_name).empty();
        $('#' + tf_name).empty();

        $('#' + th_name).append(headerFooter);
        $('#' + tf_name).append(headerFooter);

        var titles = new Array();
        titles.push({ "sTitle": "Name" });
        titles.push({ "sTitle": "Image" });
        titles.push({ "sTitle": "SubName" });

        var displaycount = 1;
        $.each(data2Treat, function (name, value) {
            var dataArray = new Array();
            dataArray.push("<span  onclick='viewItem(\"" + value.FId + "\")' style='cursor:pointer'>" + value.CatName + "</span>");
            var image = (value.CatImagePath ? ("<img src='../../Services/ShowOutSiteImage.ashx?file=" + value.CatImagePath + "' height='60' width='60' />") : "");
            dataArray.push(image);
            var subCats = '';

            if (value.SubCategories && value.SubCategories.length > 0) {
                $.each(value.SubCategories, function (order, onesubcat) {
                    subCats += onesubcat.CatName + '<br/>';
                });
            }
            subCats = subCats.trim();
            dataArray.push(subCats);
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
    } else {
        $('.searchresult').hide();
    }
    myApp.hidePleaseWait();
}



function viewItem(fId) {
    myApp.showPleaseWait();
    var url = 'Category.aspx?catId=' + fId + '&mode=view';
    window.location.href = url;
}