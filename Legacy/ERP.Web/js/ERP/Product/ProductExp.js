// create proudct quickly express
// 2024-12-04 by chenglin

function jsCreateProductExpress() {
    try {
        var ptyId = $('#PtyId').val() * 1;
        if (ptyId == 0) {
            alert("🚫Veuillez sélectionner un type de produit🚫");
        }
        else {
            LoadPrdAttr(2);
        }
    } catch (e) {

    }
}



function LoadPrdAttr(fordownload) {
    ShowPleaseWait();
    var url = window.webservicePath + "/LoadProduitAttributeById";
    var ptyId = $('#PtyId').find('option:selected').attr('data-value');
    var jsondata = JSON.stringify({ ptyId: ptyId });
    $.ajax({
        type: "POST",
        url: url,
        contentType: "application/json; charset=utf-8",
        data: jsondata,
        dataType: "json",
        success: function (data) {
            var jsdata = data.d;
            var jsondata = jQuery.parseJSON(jsdata);
            //console.log(jsondata);
            if (fordownload === 1) {
                downloadbulkfile(jsondata);
            } else {
                AddProductParLots(jsondata);
            }
            HidePleaseWait();
        },
        error: function (data) {
            var test = '';
            HidePleaseWait();
        }
    });
    return false;
}

var ptyPropCount = 0;

function downloadbulkfile(prdtype) {
    try {
        if (!jQuery.isEmptyObject(prdtype)) {
            //console.log(prdtype.PropertyNames);
            var props = prdtype.PropertyNames;
            props = searchInArray(props, 'PropIsSameValue', false);
            props = searchInArray(props, 'PropIsImage', false);
            props = props.sort(dynamicSort('PropSubOrder'));
            var colcount = props.length;

            var checkboxstyle = 'width: 30px; height:30px;';
            var data_type = 'data:application/vnd.ms-excel';
            var tab_text = '<html xmlns:x="urn:schemas-microsoft-com:office:excel">';
            tab_text += '<head><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet>';
            tab_text += '<x:Name>批量插入模板 Modèles insérés en masse</x:Name>';

            tab_text += '<x:WorksheetOptions><x:Panes></x:Panes></x:WorksheetOptions></x:ExcelWorksheet>';
            tab_text += '</x:ExcelWorksheets></x:ExcelWorkbook></xml></head><body>';
            tab_text += "<table border='1px'>";
            var nmlHeight = " height : 30px;display:table-cell; vertical-align:middle; font-size: 13px;";
            var nmlHeightRed = " height : 30px;display:table-cell; vertical-align:middle; font-size: 13px;color:red;";
            var nmlHeightBold = " height : 30px;display:table-cell; vertical-align:middle; font-size: 13px;font-weight: bold;background-color:#f5f5f5";
            var height60 = " height : 80px;display:table-cell; vertical-align:middle; font-size: 16px;";
            var nmlWidth = " width : 120px;display:table-cell; vertical-align:middle;";
            var textcenter = " text-align: center;";
            var bold = "font-weight:bold;";
            var nmlWidth2 = " width : 240px;display:table-cell; vertical-align:middle;";
            var bggreen = "background-color:#c6efce; color:#006100;";
            var bgyellow = "background-color:#ffeb9c; color:#9c5700;";
            var bgred = "background-color:#ffc7ce; color:#9c0006;";
            var thstyle = "text-align:left;";
            var rainbow1 = "#9195F6";
            var rainbow2 = "#B7C9F2";
            var rainbow3 = "#F9F07A";
            var rainbow4 = "#FB88B4";
            ptyPropCount = colcount + 3 + 2;
            //var titleline = "";
            var titleline = "<tr><th colspan='" + ptyPropCount + "' style='height: 30px; font-size: medium; background-color:#E8F2FF;text-align:left;'>Attention! Vous êtes entrain d'ajouter des produits au type</th></tr>"
                + "<tr><th  colspan='" + ptyPropCount + "' style='" + thstyle + ";font-size: medium;'>Type de produit: <span style='color:red;'>" + prdtype.PtyName + "</span></th></tr>";
            //titleline += "<tr><th style='" + thstyle + "'>Nom de produit</th><th style='" + thstyle + "'>" + curentProduct.PrdName + "</th></tr>";
            //titleline += "<tr><th style='" + thstyle + "'>Famille de produit</th><th style='" + thstyle + "'>" + curentProduct.PrdSubName + "</th></tr>";
            //titleline += "<tr><th style='" + thstyle + "'>Référence</th><th style='" + thstyle + "background-color:" + rainbow1 + "; color:#ffffff'>" + curentProduct.PrdRef + "</th></tr>";
            tab_text += titleline;
            tab_text += "<tr><th colspan='" + ptyPropCount + "' style='height: 30px; font-size: medium; background-color:#E8F2FF;text-align:left;'>以下内容是产品详情，每个产品占用一行，请按照产品属性以此填入产品详情，并从<span style='color:red;'>第十行</span>开始复制。</th></tr>";
            tab_text += "<tr><th colspan='" + ptyPropCount + "' style='height: 30px; font-size: medium; background-color:#E8F2FF;text-align:left;'>Le contenu suivant correspond aux détails du produit. Chaque produit occupe une ligne. Veuillez remplir les détails du produit en fonction des attributs du produit et les copier à partir de <span style='color:red;'>LA DIXIÈME LIGNE</span>.</th></tr>";

            tab_text += "<tr><th colspan='" + ptyPropCount + "' style='height: 20px; font-size: small; background-color:#f5f5f5;color:red;text-align:left;'>注意：该文件是XML格式，如果一次没有添加完，请务必另存为xslx的文件，否则所有编辑的内容将会丢失！</th></tr>";
            tab_text += "<tr><th colspan='" + ptyPropCount + "' style='height: 20px; font-size: small; background-color:#f5f5f5;color:red;text-align:left;'>ATTENTION : Ce fichier est au format XML. Si vous n'avez pas fini de l'ajouter immédiatement, assurez-vous de l'enregistrer en tant que fichier xslx, sinon tout le contenu modifié sera perdu !</th></tr>";

            var propnameline = "<td style='" + nmlHeight + textcenter + bold + "'>LE NOM DE PRODUIT</td>" +
                "<td style='" + nmlHeight + textcenter + bold + "'>LA FAMILLE DE PRODUIT</td>" +
                "<td style='" + nmlHeight + textcenter + bold + ";color: red;background-color:#FFE900;height:70px;'>LA RÉFÉRENCE DE PRODUIT" +
                "(Si les références de produits sont identiques, plusieurs produits seront regroupés dans le même produit. " +
                "La référence de produit doit contenir '-', le contenu avant '-' est la référence principale du produit et le contenu après '-' est la référence de chaque sous-produit.)</td>" +
                "<td style='" + nmlHeight + textcenter + bold + "'>PRIX D'ACHAT</td>" +
                "<td style='" + nmlHeight + textcenter + bold + "'>PRIX DE VENTE</td>";

            //var proptypeline = (IsNullOrEmpty(curentProduct.PrdRef)) ? "<td style='" + nmlHeight + textcenter + bold + "'>LA RÉFÉRENCE DE PRODUIT</td>" :
            //    ("<td style='height : 120px;vertical-align:middle;'>Le numéro de modèle du produit ajouté commencera automatiquement par <span style='color:" + rainbow1 + "'>" + curentProduct.PrdRef + "</span>, il n'est donc pas nécessaire d'ajouter <span style='color:" + rainbow1 + "'>" + curentProduct.PrdRef + "</span> devant le numéro de modèle. 所添加的产品型号将会自动以《<span style='color:" + rainbow1 + "'>" + curentProduct.PrdRef + "</span>》为开头，所以不用再在型号前面添加《<span style='color:" + rainbow1 + "'>" + curentProduct.PrdRef + "</span>》。</td>");
            var proptypeline = "<td style='" + nmlHeight + textcenter + bold + "'>产品名称</td>" +
                "<td style='" + nmlHeight + textcenter + bold + "'>产品家族</td>" +
                "<td style='" + nmlHeight + textcenter + bold + ";color: red;background-color:#FFE900;height:70px;'>产品型号（注意，如果产品型号相同，多个产品将会被汇总到同一个产品里面，产品型号必须包含'-'，'-'之前的内容为该产品的主型号，'-'之后的内容为各个子产品的型号。）</td>" +
                "<td style='" + nmlHeight + textcenter + bold + "'>采购价</td>" +
                "<td style='" + nmlHeight + textcenter + bold + "'>销售价</td>";

            var propNullableline = "<td style='" + nmlHeightRed + "'>Mandatory/Obligatoire: YES</td>" + // 产品名称
                "<td style='vertical-align:middle;'>Mandatory/Obligatoire: NO</td>" + // 产品家族
                "<td style='" + nmlHeightRed + "'>Mandatory/Obligatoire: YES</td>" +  // 产品型号
                "<td style='vertical-align:middle;'>Mandatory/Obligatoire: NO</td>" +
                "<td style='vertical-align:middle;'>Mandatory/Obligatoire: NO</td>";

            var propGuidLine = "<td style='" + nmlHeightBold + "'>LE NOM DE PRODUIT</td>" +
                "<td style='" + nmlHeightBold + "'>LA FAMILLE DE PRODUIT</td>" +
                "<td style='" + nmlHeightBold + "'>LA RÉFÉRENCE DE PRODUIT</td>" +
                "<td style='" + nmlHeightBold + "'>PRIX D'ACHAT</td>" +
                "<td style='" + nmlHeightBold + "'>PRIX DE VENTE</td>";

            var proptypes = [];
            proptypes.push({ key: "1", value: "String" });
            proptypes.push({ key: "2", value: "Nombre entier" });
            proptypes.push({ key: "3", value: "Décimal" });
            proptypes.push({ key: "4", value: "DateTime" });
            proptypes.push({ key: "5", value: "Boolean" });
            //console.log(proptype);
            $.each(props, function (name, value) {
                propnameline += "<td style='" + nmlHeight + textcenter + bold + "'>" + value.PropName + (IsNullOrEmpty(value.PropUnit) ? "" : " (" + value.PropUnit + ")") + "</td>";
                proptypeline += "<td style='" + nmlHeight + "'>" + searchFieldValueInArray(proptypes, 'key', value.PropType).value + "</td>";
                propNullableline += "<td style='" + (value.PropIsNullable ? nmlHeight : nmlHeightRed) + "'>Mandatory/Obligatoire: " + (value.PropIsNullable ? "NO" : "YES") + "</td>";
                propGuidLine += "<td style='" + nmlHeightBold + "'>" + value.PropGuid + "</td>";
            });
            tab_text += "<tr>" + propnameline + "</tr>";
            tab_text += "<tr>" + proptypeline + "</tr>";
            tab_text += "<tr>" + propNullableline + "</tr>";
            tab_text += "<tr>" + propGuidLine + "</tr>";

            tab_text += '</table></body></html>';
            var csv_content = tab_text,
                download = document.createElement("a"),
                blob = new Blob(["\ufeff", tab_text], {
                    type: "application/csv;charset=ISO-8859-1;"
                });
            var today = new Date();
            var dd = today.getDate();
            var mm = today.getMonth() + 1; //January is 0!
            var yyyy = today.getFullYear();
            if (dd < 10) {
                dd = '0' + dd;
            }
            if (mm < 10) {
                mm = '0' + mm;
            }
            today = yyyy + mm + dd;
            var datetime = "-V" + today;
            download.href = window.URL.createObjectURL(blob);
            download.download = "批量插入模板 Modèles insérés en masse" + datetime + ".xls";
            var event = document.createEvent("MouseEvents");
            event.initMouseEvent(
                "click", true, false, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null
            );
            download.dispatchEvent(event);
        }
    } catch (e) {

    }
    HidePleaseWait();
}

function AddProductParLots(jsondata) {
    var props = jsondata.PropertyNames;
    props = searchInArray(props, 'PropIsSameValue', false);
    props = searchInArray(props, 'PropIsImage', false);
    props = props.sort(dynamicSort('PropSubOrder'));
    var colcount = props.length;
    ptyPropCount = colcount + 3 + 2;
    var startBox = "<div class='box'><div class='box-body'>";
    var endBox = "</div></div>";

    console.log(jsondata);

    var onelineContent =
        // start box
        "<div class='form-group' id='div_one_line'>" +
        "<div class='row'>" +
        "<div class='col-md-12'>" +
        "<div class='box-body'>" +
        "<div class='form-horizontal'>" +
        "<div class='form-group'><label class='col-sm-12' style='text-align:center'><span style='color:red;'>Attention! Vous êtes entrain d'ajouter des produits au type «" + jsondata.PtyName + "» </span>" +
        "<br/>Veuillez coller les contenues d'excel en bas" +
        "<br/>请将Excel表格内容复制到下面<button type='button' class='btn btn btn-inverse' title='Cliquez sur cette icône pour télécharger le modèle Excel 点击该图标下载Excel模板' onclick='return LoadPrdAttr(1)'><i class='fa fa-file-text-o'></i></button></label></div>" +
        "<div class='form-group'>" +
        "<div class='col-sm-12'><textarea row='8' id='PrdExpressContent' class='form-control' style='height:400px'></textarea></div>" +
        "</div>" +
        // close box
        "</div></div></div></div></div>";

    var btnAddUpdate = "<button class='btn btn-inverse' id='btn_add_pit_lot' name='btn_add_sols'  onclick='return CreatePrdFromExcel(this)'><span>IMPORTER DES PRODUITS</span></button>";
    var btnClose = "<button class='btn btn-default bootbox-close-button' id='btn_close_add_pit_lot' onclick='return false'><span>Annuler</span></button>";

    var btns = "<div class='modal-body center'>" + btnClose + btnAddUpdate + "</div>";
    var onecontent = startBox + onelineContent + btns + endBox;

    var title = 'Insérer des produits par lots';
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

function CreatePrdFromExcel() {
    ShowPleaseWait();
    //var prdId = getUrlVars()['prdId'];
    //var ptyId = $('#PtyId').find('option:selected').attr('data-value') * 1;
    var content = $('#PrdExpressContent').val();
    if (!IsNullOrEmpty(content)) {
        var pitLines = content.split('\n');
        var alllinecout = pitLines.length;
        if (alllinecout !== 0) {
            var checkfiledcount = pitLines[0].split('\t').length;
            if (checkfiledcount !== ptyPropCount) {
                HidePleaseWait();
                alert('Format error, les informations ne correspondent pas !<br/>信息不符 ！');
            } else {
                treatPitByLotAndInsert(pitLines);
            }
        } else {
            HidePleaseWait();
            alert('Format error !<br/>格式错误 ！');
        }
    } else {
        HidePleaseWait();
        alert('Veuillez remplir le TEXTAREA !<br/>请填写内容 ！');
    }
    return false;
}



function treatPitByLotAndInsert(pitLines) {
    var ptyId = $('#PtyId').find('option:selected').attr('data-value');
    console.log(ptyId);
    var pit2Insert = [];
    var propguid = [];
    var lineCount = pitLines.length;
    // treat guid
    var guidLine = pitLines[0].split('\t');
    for (var i = 0; i < ptyPropCount; i++) {
        var oneprop = { order: i, guid: guidLine[i] };
        propguid.push(oneprop);
    }
    //console.log(propguid);
    // treat pit prop
    for (var j = 1; j < lineCount; j++) {
        var onePit = {};
        var onepitline = pitLines[j];
        var pitprops = onepitline.split('\t');
        var pitpropsLen = pitprops.length;
        if (pitpropsLen >= 5) {
            onePit.PitDescription = pitprops[0]; // use decription for product name
            onePit.PitDefaultImage = pitprops[1]; // use PitDefaultImage for famille de produit
            onePit.PitRef = pitprops[2];
            var buyprice = pitprops[3] + '';
            buyprice = replaceAll(buyprice, '€', '');
            buyprice = buyprice.replace(/\$/g, ''); //replaceAll(up, '$', '');
            buyprice = replaceAll(buyprice, ' ', '');
            buyprice = buyprice.replace(',', '.') * 1;
            onePit.PitPurchasePrice = buyprice;
            var sellprice = pitprops[4] + '';
            sellprice = replaceAll(sellprice, '€', '');
            sellprice = sellprice.replace(/\$/g, ''); //replaceAll(up, '$', '');
            sellprice = replaceAll(sellprice, ' ', '');
            sellprice = sellprice.replace(',', '.') * 1;
            onePit.PitPrice = sellprice;

            var pitAllInfo = [];
            for (var k = 5; k < pitpropsLen; k++) {
                var checkProp = searchFieldValueInArray(propguid, 'order', k);
                if (!IsNullOrEmpty(checkProp)) {
                    var propertyvalue = {};
                    propertyvalue.PropValue = pitprops[k];
                    propertyvalue.PropGuid = checkProp.guid;
                    pitAllInfo.push(propertyvalue);
                }
            }
            onePit.PitAllInfo = pitAllInfo;
            pit2Insert.push(onePit);
        }
    }
    //console.log(pit2Insert);
    if (!IsNullOrEmpty(ptyId) && pit2Insert.length > 0) {
        var jsondata = JSON.stringify({ ptyId: ptyId, lines: pit2Insert });
        var url = window.webservicePath + "/CreateProductFromExcelFromSearchPrd";
        $.ajax({
            url: url,
            type: 'POST',
            contentType: 'application/json; charset=utf-8',
            data: jsondata,
            dataType: 'json',
            success: function (data) {
                var jsdata = data.d;
                var data2Treat = jQuery.parseJSON(jsdata);
                HidePleaseWait();
                if (data2Treat !== '-1') {
                    if (data2Treat !== '0') {
                        $('#btn_close_add_pit_lot').click();
                        alert(data2Treat);
                        jsSearchPrd();
                        HidePleaseWait();
                    } else {
                        HidePleaseWait();
                        alert('Veuillez contacter l\'administrateur, 请联系管理员');
                    }
                } else {
                    HidePleaseWait();
                    // authentication error
                    AuthencationError();
                }
            },
            error: function (data) {
                HidePleaseWait();
                alert(data.responseText);
            }
        });

    } else {
        HidePleaseWait();
        alert('Erreur de traitement du format !<br/>格式处理出错！');
    }
    //HidePleaseWait();
}