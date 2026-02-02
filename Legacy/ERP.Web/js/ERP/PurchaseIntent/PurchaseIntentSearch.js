
$(document).ready(initSearch);

function initSearch() {

    SetLanguageBar();
}

var hasSet = false;

function viewSearchResult(data2Treat) {
    var name = '_pins';
    var dt_name = 'dt' + name;
    var div_name = 'div' + name;
    var th_name = 'th' + name;
    var tb_name = 'tb' + name;
    var tf_name = 'tf' + name;
    var rst_name = 'rst' + name;

    var headerFooter = "<tr>" +
                    "<th class='language_txt'>Nom d'intention</th>" +
                    "<th class='language_txt'>Code d'intention</th>" +
                    "<th class='language_txt'>Créateur</th>" +
                    "<th class='language_txt'>Clôturé</th>" +
                    "<th class='language_txt'>Date</th>" +
                    "<th class='language_txt'>Cmd Fourniseur</th>" +
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
        titles.push({ "sTitle": "Code" });
        titles.push({ "sTitle": "Closed" });
        titles.push({ "sTitle": "Creater" });
        titles.push({ "sTitle": "Date" });
        titles.push({ "sTitle": "SodCode" });

        var displaycount = 1;
        $.each(data2Treat, function (name, value) {
            var dataArray = new Array();
            dataArray.push("<span  onclick='viewItem(\"" + value.PinFId + "\")' style='cursor:pointer'>" + value.PinName + "</span>");
            dataArray.push(value.PinCode);
            dataArray.push(value.Creator.Firstname + " " + value.Creator.Lastname);
            dataArray.push(value.PinClosed ? "Oui" : "Non");
            dataArray.push(getDateString(value.DateCreation));
            if (value.PinHasSupplierOrder) {
                dataArray.push("<span  onclick='viewSodItem(\"" + value.SodFId + "\")' style='cursor:pointer'>" + value.SodCode + "</span>");
            } else {
                dataArray.push(value.SodCode);
            }

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

    SetLanguageBar();
}


function viewSearchResultDetail(data2Treat) {
    var name = '_pins';
    var dt_name = 'dt' + name;
    var div_name = 'div' + name;
    var th_name = 'th' + name;
    var tb_name = 'tb' + name;
    var tf_name = 'tf' + name;
    var rst_name = 'rst' + name;

    var headerFooter = "<tr>" +
                    "<th class='language_txt'>Code</th>" +
                    "<th class='language_txt'>Client</th>" +
                    "<th class='language_txt'>Créateur</th>" +
                    "<th class='language_txt'>Commercial</th>" +
                    "<th class='language_txt'>Deadline</th>" +
                    "<th class='language_txt'>Produit</th>" +
                    "<th class='language_txt'>Descritpion</th>" +
                    "<th class='language_txt'>Quantité</th>" +
                    "<th class='language_txt'>Logistique</th>" +
                    "<th class='language_txt'>CF</th>" +
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
        titles.push({ "sTitle": "Code" });
        titles.push({ "sTitle": "Client" });
        titles.push({ "sTitle": "Creator" });
        titles.push({ "sTitle": "Commercial" });
        titles.push({ "sTitle": "Deadline" });
        titles.push({ "sTitle": "Produit" });
        titles.push({ "sTitle": "Des" });
        titles.push({ "sTitle": "Qty" });
        titles.push({ "sTitle": "Logi" });
        titles.push({ "sTitle": "CF" });

        var displaycount = 1;
        $.each(data2Treat, function (name, value) {
            var dataArray = new Array();

            var prdname = value.PrdName;
            var quantity = value.Quantity;
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
            Logistic = Logistic == 1 ? 'Avion le plus rapide' : Logistic == 2 ? 'Avion le moins cher' : 'Bateau';
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


            var Logistic = value.Logistic;
            Logistic = Logistic == 1 ? 'Avion le plus rapide' : Logistic == 2 ? 'Avion le moins cher' : 'Bateau';



            dataArray.push("<span style='color: " + (value.SolId != 0 ? "#4cb052" : "#d96666") + "'>" + value.PinCode + "</span>");
            dataArray.push("<span style='color: " + (value.SolId != 0 ? "#4cb052" : "#d96666") + "'>" + value.Client + "</span>");
            dataArray.push("<span style='color: " + (value.SolId != 0 ? "#4cb052" : "#d96666") + "'>" + value.Creator + "</span>");
            dataArray.push("<span style='color: " + (value.SolId != 0 ? "#4cb052" : "#d96666") + "'>" + value.Commercial1+ "</span>");
            dataArray.push("<span style='color: " + (value.SolId != 0 ? "#4cb052" : "#d96666") + "'>" + getDateString(value.Deadline) + "</span>");
            dataArray.push("<span style='color: " + (value.SolId != 0 ? "#4cb052" : "#d96666") + "'>" + prdname + "</span>");
            dataArray.push("<span style='color: " + (value.SolId != 0 ? "#4cb052" : "#d96666") + "'>" + infocompl + "</span>");
            dataArray.push("<span style='color: " + (value.SolId != 0 ? "#4cb052" : "#d96666") + "'>" + quantity + "</span>");
            dataArray.push("<span style='color: " + (value.SolId != 0 ? "#4cb052" : "#d96666") + "'>" + Logistic + "</span>");
            dataArray.push((value.SolId == 0 ? "" : "<button class='btn btn-inverse' title='Commande fournisseur' id='" + value.PilId + "' itemId='" + value.PilId + "' onclick='return SolsClick(this)'>CF</button>"));

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

    SetLanguageBar();
}

function viewItem(fId) {
    myApp.showPleaseWait();
    var url = 'PurchaseIntent.aspx?pinId=' + fId + "&mode=view";
    window.location.href = url;
}

function viewSodItem(fId) {
    myApp.showPleaseWait();
    var url = '../SupplierOrder/SupplierOrder.aspx?sodId=' + fId + "&mode=view";
    window.location.href = url;
}


function SolsClick(sender) {
    var pilId = $(sender).attr('itemId') * 1;
    if (pilId != 0) {
        ShowPleaseWait();

        var jsondata = JSON.stringify({ pilId: pilId });
        var url = window.webservicePath + "/LoadSolByPil";
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
                    //HidePleaseWait();
                    setSolContent(data2Treat);
                } else {
                    AuthencationError();
                }
            },
            error: function (data) {
                HidePleaseWait();
                var test = '';
            }
        });
    }
    return false;
}

function setSolContent(sols) {
    var startBox = "<div class='box'><div class='box-body'>";
    var endBox = "</div></div>";
    var linecode = "";
    $.each(sols, function (name, value) {
        var prdname = value.PrdName;
        var pitname = value.PitName;
        var quantity = value.Quantity;
        var supPrdref = value.SupplierRef;
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
        Logistic = Logistic == 1 ? 'Avion le plus rapide' : Logistic == 2 ? 'Avion le moins cher' : 'Bateau';
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

        var DProduction = getDateString(value.DProduction);
        var DExpDelivery = getDateString(value.DExpDelivery);
        var DDelivery = getDateString(value.DDelivery);
        var DShipping = getDateString(value.DShipping);
        var DExpArrival = getDateString(value.DExpArrival);
        var FeatureCode = value.FeatureCode;
        var Transporter = value.Transporter;
        var LogsNbr = value.LogsNbr;
        var Logistic = value.Logistic;
        Logistic = Logistic == 1 ? 'Avion le plus rapide' : Logistic == 2 ? 'Avion le moins cher' : 'Bateau';

        var infoShipPrd = ("<span style='color:red;'>Logistique 运货方式 : </br>" + Logistic + "</span></br>") +
        (IsNullOrEmpty(DProduction) ? "" : "D.Prod. 开始生产日期 : " + DProduction + "</br>") +
        (IsNullOrEmpty(DExpDelivery) ? "" : "D. achèvmt. prv. 预计交期 : " + DExpDelivery + "</br>") +
        (IsNullOrEmpty(DDelivery) ? "" : "D. achèvmt. rél. 实际交期 : " + DDelivery + "</br>") +
        (IsNullOrEmpty(DShipping) ? "" : "D. expé. 发货日期 : " + DShipping + "</br>") +
        (IsNullOrEmpty(DExpArrival) ? "" : "D. arr. prv. 预计到达日期 : " + DExpArrival + "</br>") +
        (IsNullOrEmpty(Transporter) ? "" : "Transporteur 物流公司 : " + Transporter + "</br>") +
        (IsNullOrEmpty(LogsNbr) ? "" : "Logis Num. 物流编号 : " + LogsNbr + "</br>") +
        (IsNullOrEmpty(FeatureCode) ? "" : "<span style='color:red;'>Code fonct. 特征码 : " + FeatureCode + "</span></br>");

        linecode += "<tr>";
        linecode += "<td>" + value.SodCode + "</td>";
        linecode += "<td>" + value.Client + "</td>";
        linecode += "<td>" + prdname + "</td>";
        linecode += "<td class='label_left'>" + infocompl + "</td>";
        linecode += "<td class='label_left'>" + infoShipPrd + "</td>";
        linecode += "<td class='label_right'>" + quantity + "</td>";
        linecode += "<td class='label_right'>" + value.UnitPrice + "</td>";
        linecode += "<td class='label_right'>" + value.UnitPriceWithDis + "</td>";
        linecode += "<td class='label_right'>" + value.TotalPrice + "</td>";
        linecode += "<td class='label_right'>" + value.TotalCrudePrice + "</td>";
        linecode += "<td><button type='button' class='btn btn-inverse' title='Consulter cette ligne de la commande fournisseur' solId='" + value.SolId + "' sodFId='" + value.SodFId + "' onclick='return ViewSol(this)'><i class='fa fa-eye'></i></button></td>";
        linecode += "</tr>";
    });
    var onelineContent =
    // start box
        "<div class='form-group' id='div_one_line'>" +
            "<div class='row'>" +
            "<div class='col-md-12'>" +
            "<div class='box-body'>" +
            "<div class='form-horizontal'>" +
            "<!--///////////////////new line/////////////////-->" +
            "<div class='form-group variant'>" +
            "<table cellpadding='0' cellspacing='0' border='0' class='table table-striped table-bordered table-hover'><thead><tr role='row'><th rowspan='1' colspan='1'>CF Code</th><th rowspan='1' colspan='1'>Client</th><th rowspan='1' colspan='1'>Produit</th><th rowspan='1' colspan='1'>Description</th><th rowspan='1' colspan='1'>Les détails</th><th rowspan='1' colspan='1'>Quantité</th><th rowspan='1' colspan='1'>Prix d'achat</th><th rowspan='1' colspan='1'>Prix remisé</th><th rowspan='1' colspan='1'>Total H.T</th><th rowspan='1' colspan='1'>Total T.T.C</th><th rowspan='1' colspan='1' class='thBtns'></th></tr></thead>" +
            "<tbody id='tbody_lines' style='text-align: center !important'>" + linecode +
            "</tbody>" +
            "</table>" +
            "</div>" +
            "</div></div></div></div></div>";

    var btnClose = "<button class='btn btn-default bootbox-close-button' id='btn_add_sol_close' onclick='return false'><span>Clôturer</span></button>";

    var btns = "<div class='modal-body center'>" + btnClose + "</div>";
    var onecontent = startBox + onelineContent + btns + endBox;

    var title = "Consulter les lignes de la commande fournisseur";
    bootbox.dialog({
        title: title,
        message: onecontent
    }).find('.modal-dialog').css({
        'width': '95%'
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
    HidePleaseWait();
}


function js_search(type) {
    var url = type == 0 ? (window.webservicePath + "/SearchPurchaseIntent") : (window.webservicePath + "/GetPurchaseIntentLines");
    var pinName = $('#PinName').val().trim();
    var pinCode = $('#PinCode').val().trim();
    var featureCode = $('#FeatueCode').val().trim();
    var jsondata = JSON.stringify({ pinName: pinName, pinCode: pinCode, featureCode: featureCode });
    myApp.showPleaseWait();
    $.ajax({
        url: url,
        type: 'POST',
        contentType: 'application/json; charset=utf-8',
        data: jsondata,
        dataType: 'json',
        success: function (data) {
            var jsdata = data.d;
            var data2Treate = jQuery.parseJSON(jsdata);
            if (data2Treate.length === 0) {
                NoResultMsg();
            }
            if (type === 0) {
                viewSearchResult(data2Treate);
            } else {
                viewSearchResultDetail(data2Treate);
            }
        },
        error: function (data) {
            myApp.hidePleaseWait();
        }
    });
    return false;
}

function ViewSol(sender) {
    var solid = $(sender).attr('solId') * 1;
    var sodId = $(sender).attr('sodFId');
    //console.log(sodId);
    var url = '../SupplierOrder/SupplierOrder.aspx?sodId=' + sodId + "&mode=view&solId=" + solid;
    window.open(url, '_blank');
    return false;
}

function createItem() {
    window.location = "PurchaseIntent.aspx";
}