var civilityList = [];
$(document).ready(initFunc);

function initFunc() {
    js_GetCivility(0, 'civilityList');
    setAutoCompleteCon();
}

function CreateConsignee() {
    ShowConsignee(0);
    return false;
}

function jsSearchConsignee() {
    var oneCon = Object();
    ShowPleaseWait();
    consigneeList = [];
    oneCon.ConFirstname = $('#ScFirstname').val().trim();
    oneCon.ConComment = $('#ScComment').val().trim();
    oneCon.ConEmail = $('#ScEmail').val().trim();
    oneCon.ConPostcode = $('#ScPostcode').val().trim();
    oneCon.ConCity = $('#ScCity').val().trim();
    oneCon.ConTel1 = $('#ScTel1').val().trim();
    oneCon.ConAddress1 = $('#ScAddress').val().trim();
    oneCon.ConCompanyname = $('#ScConCompanyname').val().trim();
    var jsondata = JSON.stringify({ oneCon: oneCon });
    var url = window.webservicePath + "/SearchConsignee";
    $.ajax({
        url: url,
        type: 'POST',
        contentType: 'application/json; charset=utf-8',
        data: jsondata,
        dataType: 'json',
        success: function (data) {
            HidePleaseWait();
            var jsdata = data.d;
            var jsondata = jQuery.parseJSON(jsdata);
            if (jsondata.length === 0) {
                NoResultMsg();
            } else {
                //console.log(jsondata);
                consigneeList = jsondata;
                viewConsigneeResult(jsondata);
            }
        },
        error: function (data) {
            HidePleaseWait();
        }
    });
    return false;
}

var consigneeList = [];
var hasSet = false;
function viewConsigneeResult(data2Treat) {
    var name = '_cons';
    var dt_name = 'dt' + name;
    var div_name = 'div' + name;
    var th_name = 'th' + name;
    var tb_name = 'tb' + name;
    var tf_name = 'tf' + name;
    var rst_name = 'rst' + name;
    var headerFooter = "<tr>" +
        "<th style='text-align:center;font-size:11px;vertical-align: middle;'>Raison sociale</br>公司名</th>" +
        "<th style='text-align:center;font-size:11px;vertical-align: middle; width:20%'>Nom</br>姓名</th>" +
        "<th style='text-align:center;font-size:11px;vertical-align: middle;'>Réf</th>" +
        "<th style='text-align:center;font-size:11px;vertical-align: middle;'>Tél</br>电话</th>" +
        "<th style='text-align:center;font-size:11px;vertical-align: middle;'>Portable</br>手机</th>" +
        "<th style='text-align:center;font-size:11px;vertical-align: middle;'>Adr.</br>地址</th>" +
        "<th style='text-align:center;font-size:11px;vertical-align: middle;'>C.P.</br>邮编</th>" +
        "<th style='text-align:center;font-size:11px;vertical-align: middle;'>Ville</br>城市</th>" +
        "<th style='text-align:center;font-size:11px;vertical-align: middle;'>Pays</br>国家</th>" +
        "<th style='text-align:center;font-size:11px;vertical-align: middle;'>Email</th>" +
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
        titles.push({ "sTitle": "Comp" });
        titles.push({ "sTitle": "Nom" });
        titles.push({ "sTitle": "Ref" });
        titles.push({ "sTitle": "Tel" });
        titles.push({ "sTitle": "Portable" });
        titles.push({ "sTitle": "Adr" });
        titles.push({ "sTitle": "CP" });
        titles.push({ "sTitle": "Ville" });
        titles.push({ "sTitle": "Pays" });
        titles.push({ "sTitle": "Email" });

        var displaycount = 1;
        $.each(data2Treat, function (fname, value) {
            var dataArray = new Array();
            dataArray.push("<span  onclick='ShowConsignee(\"" + value.ConId + "\")' style='cursor:pointer'>" + (IsNullOrEmpty(value.ConCompanyname) ? '' : value.ConCompanyname) + "</span>");
            dataArray.push("<span  onclick='ShowConsignee(\"" + value.ConId + "\")' style='cursor:pointer'>" + value.Civility.Value + " " + value.ConFirstname + " " + value.ConLastname + "</span>");
            dataArray.push("<span  onclick='ShowConsignee(\"" + value.ConId + "\")' style='cursor:pointer'>" + value.ConCode + "</span>");
            var tel = "";
            tel = value.ConTel1;
            tel += IsNullOrEmpty(tel) ?
            (IsNullOrEmpty(value.ConTel2) ? "" : value.ConTel2) :
            (IsNullOrEmpty(value.ConTel2) ? "" : ("<br/>" + value.ConTel2));
            dataArray.push("<span  onclick='ShowConsignee(\"" + value.ConId + "\")' style='cursor:pointer'>" + tel + "</span>");
            dataArray.push("<span  onclick='ShowConsignee(\"" + value.ConId + "\")' style='cursor:pointer'>" + value.ConCellphone + "</span>");
            var adr = "";
            adr = value.ConAdresseTitle;
            adr += IsNullOrEmpty(adr) ?
            (IsNullOrEmpty(value.ConAddress1) ? "" : value.ConAddress1) :
            (IsNullOrEmpty(value.ConAddress1) ? "" : ("<br/>" + value.ConAddress1));
            adr += IsNullOrEmpty(adr) ?
            (IsNullOrEmpty(value.ConAddress2) ? "" : value.ConAddress2) :
            (IsNullOrEmpty(value.ConAddress2) ? "" : ("<br/>" + value.ConAddress2));
            adr += IsNullOrEmpty(adr) ?
            (IsNullOrEmpty(value.ConAddress3) ? "" : value.ConAddress3) :
            (IsNullOrEmpty(value.ConAddress3) ? "" : ("<br/>" + value.ConAddress3));
            dataArray.push("<span  onclick='ShowConsignee(\"" + value.ConId + "\")' style='cursor:pointer'>" + adr + "</span>");
            dataArray.push("<span  onclick='ShowConsignee(\"" + value.ConId + "\")' style='cursor:pointer'>" + value.ConPostcode + "</span>");
            dataArray.push("<span  onclick='ShowConsignee(\"" + value.ConId + "\")' style='cursor:pointer'>" + value.ConCity + "</span>");
            dataArray.push("<span  onclick='ShowConsignee(\"" + value.ConId + "\")' style='cursor:pointer'>" + value.ConCountry + "</span>");
            dataArray.push("<span  onclick='ShowConsignee(\"" + value.ConId + "\")' style='cursor:pointer'>" + value.ConEmail + "</span>");
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
}

function ShowConsignee(conId) {
    if (conId === 0) {
        var oneCon = Object;
        //        oneCon.ConAddress1 = clientInPage.Address1;
        //        oneCon.ConAddress2 = clientInPage.Address2;
        //        oneCon.ConPostcode = clientInPage.Postcode;
        //        oneCon.ConCity = clientInPage.City;
        //        oneCon.ConCountry = clientInPage.Country;
        //        oneCon.ConTel1 = clientInPage.Tel1;
        //        oneCon.ConTel2 = clientInPage.Tel2;
        //        oneCon.ConFax = clientInPage.Fax;
        //        oneCon.ConCellphone = clientInPage.Cellphone;
        //        oneCon.ConEmail = clientInPage.Email;
        //        oneCon.ConRecieveNewsletter = clientInPage.RecieveNewsletter;
        //        oneCon.ConNewsletterEmail = clientInPage.NewsletterEmail;
        FillConsignee(oneCon, 'forUCcreate');
    } else {
        viewConsignee(conId);
    }

    return false;
}

function viewConsignee(fconId) {
    //alert(fccoId);
    var onecco = searchFieldValueInArray(consigneeList, 'ConId', (fconId * 1));
    FillConsignee(onecco, 'forUCupdate');
    //alert(onecco.CcoFirstname);
}

function FillConsignee(cons, ucmode) {
    var content = "<div class='box' id='div_contact_client'>" +
        "<div class='box-body'>" +
        "<div class='form-horizontal'>" +
        "<div class='form-group'>" +
        "<label id='ConId' name='ConId' style='display:none;'></label>" +
        "<label id='FConId' name='FConId' style='display:none;'></label>" +
        "<label class='col-sm-2 control-label fieldRequired'>Titre d\'adresse 命名</label>" +
        "<div class='col-sm-4'><input class='form-control' id='ConAdresseTitle' name='ConAdresseTitle' type='text' placeholder='Titre 命名' required></div>" +
        "<label class='col-sm-2 control-label'>Code 编码</label>" +
        "<div class='col-sm-4'><input class='form-control' id='ConCode' name='ConCode' type='text' placeholder='Code 编码' disabled=''></div>" +
        "</div>" +
        "<div class='form-group'>" +
        "<label class='col-sm-2 control-label'>Raison sociale 公司名</label>" +
        "<div class='col-sm-4'><input class='form-control' id='ConCompanyname' name='ConCompanyname' placeholder='S&#39;il y a 如果有' /></div>" +
        "<label class='col-sm-2 control-label'>Civilité 性别</label>" +
        "<div class='col-sm-4'><select class='form-control' id='CivId' name='CivId'></select></div>" +
        "</div>" +
        "<div class='form-group'>" +
        "<label class='col-sm-2 control-label '>Prénom 名</label>" +
        "<div class='col-sm-4'><input class='form-control' id='ConFirstname' name='ConFirstname' type='text' placeholder='Prénom 名'  maxlength='200'></div>" +
        "<label class='col-sm-2 control-label '>Nom de famille 姓</label>" +
        "<div class='col-sm-4'><input class='form-control' id='ConLastname' name='ConLastname' type='text' placeholder='Nom de famille 姓' maxlength='200'></div>" +
        "</div>" +
        "<div class='form-group'>" +
        "<label class='col-sm-2 control-label'>Adresse 1 地址1</label>" +
        "<div class='col-sm-4'><input class='form-control' id='ConAddress1' name='ConAddress1' type='text' placeholder='Adresse 1 地址1'></div>" +
        "<label class='col-sm-2 control-label'>Adresse 2 地址2</label>" +
        "<div class='col-sm-4'><input class='form-control' id='ConAddress2' name='ConAddress2' type='text' placeholder='Adresse 2 地址2'></div>" +
        "</div>" +
        "<div class='form-group'>" +
        "<label class='col-sm-2 control-label'>Adresse 3 地址3</label>" +
        "<div class='col-sm-4'><input class='form-control' id='ConAddress3' name='ConAddress3' type='text' placeholder='Adresse 3 地址3'></div>" +
        "<label class='col-sm-2 control-label'>Code postal 邮编</label>" +
        "<div class='col-sm-4'><input class='form-control' id='ConPostcode' name='ConPostcode' type='text' placeholder='Code postal 邮编' maxlength='10'></div>" +
        "</div>" +
        "<div class='form-group'>" +
        "<label class='col-sm-2 control-label'>Ville 城市</label>" +
        "<div class='col-sm-4'><input type='text' class='form-control' list='ConCity' id='ip_ConCity' placeholder='Ville 城市' maxlength='200'><datalist id='ConCity'></datalist></div>" +
        "<label class='col-sm-2 control-label'>Pays 国家</label>" +
        "<div class='col-sm-4'><input class='form-control' id='ConCountry' name='ConCountry' type='text' placeholder='Pays 国家'></div>" +
        "</div>" +
        "<div class='form-group'>" +
        "<label class='col-sm-2 control-label'>Téléphone 1 电话1</label>" +
        "<div class='col-sm-4'><input class='form-control' id='ConTel1' name='ConTel1' type='text' placeholder='Téléphone 1 电话1'></div>" +
        "<label class='col-sm-2 control-label'>Téléphone 2 电话2</label>" +
        "<div class='col-sm-4'><input class='form-control' id='ConTel2' name='ConTel2' type='text' placeholder='Téléphone 2 电话2'></div>" +
        "</div>" +
        "<div class='form-group'>" +
        "<label class='col-sm-2 control-label'>Fax</label>" +
        "<div class='col-sm-4'><input class='form-control' id='ConFax' name='ConFax' type='text' placeholder='Fax'></div>" +
        "<label class='col-sm-2 control-label'>Portable 手机</label>" +
        "<div class='col-sm-4'><input class='form-control' id='ConCellphone' name='ConCellphone' type='text' placeholder='Portable 手机'></div>" +
        "</div>" +
        "<div class='form-group'>" +
        "<label class='col-sm-2 control-label'>Email</label>" +
        "<div class='col-sm-4'>" +
        "<div class='input-group'><span class='input-group-addon'>@</span><input type='email' id='ConEmail' name='ConEmail' class='form-control' placeholder='Email'maxlength='100'></div>" +
        "</div>" +
        "<label class='col-sm-2 control-label'>Recevoir le Newsletter 推送Email</label>" +
        "<div class='col-sm-4'>" +
        "<div class='row'>" +
        "<div class='col-sm-2'>" +
        "<div class='checker' style='text-align: center;'><span class=''><input type='checkbox' id='ConRecieveNewsletter' name='ConRecieveNewsletter' class='uniform'value=''></span></div>" +
        "</div>" +
        "<div class='col-sm-10'>" +
        "<div class='input-group'><span class='input-group-addon'>@</span><input type='email' id='ConNewsletterEmail' name='ConNewsletterEmail' class='form-control'placeholder='Newsletter Email' maxlength='20'></div>" +
        "</div>" +
        "</div>" +
        "</div>" +
        "</div>" +
        "<div class='form-group'>" +
        "<label class='col-sm-2 control-label'>Adresse livraison 派送地址</label>" +
        "<div class='col-sm-4'>" +
        "<div class='checker' style='text-align: center;'><span class=''><input type='checkbox' id='ConIsDeliveryAdr' name='ConIsDeliveryAdr' class='uniform' value='' checked></span></div>" +
        "</div>" +
        "<label class='col-sm-2 control-label'>Adresse facturation 开票地址</label>" +
        "<div class='col-sm-4'>" +
        "<div class='checker' style='text-align: center;'><span class=''><input type='checkbox' id='ConIsInvoicingAdr' name='ConIsInvoicingAdr' class='uniform' value='' checked></span></div>" +
        "</div>" +
        "</div>" +
        "<div class='form-group'>" +
        "<label class='col-md-2 control-label'>Commentaire 备注</label>" +
        "<div class='col-md-10'><textarea rows='3' cols='5' name='ConComment' class='form-control' id='ConComment'></textarea></div>" +
        "</div>" +
        "<div class='center forUCcreate'>" +
        "<button type='button' class='btn btn-default' onclick='closeDialog()'>Annuler 取消</button>" +
        "<button class='btn btn-inverse' type='button' onclick='return js_InsertUpdateCon();'>Sauvegarder 保存</button></div>" +
        "<div class='modal-footer center forUCview'><button type='button' class='btn btn-default' onclick='closeDialog()'>Annuler 取消</button>" +
        "<button type='button' class='btn btn-inverse' >Modifier </button></div>" +
        "<div class='modal-footer center forUCupdate'><button type='button' class='btn btn-default' >Annuler 取消</button>" +
        "<button type='button' class='btn btn-inverse' onclick='return js_InsertUpdateCon();'>Mettre à jours 更新</button><button type='button' class='btn btn-inverse' onclick='return confirmerDeleteCon()'>Supprimer 删除</button></div>" +
        "</div>" +
        "</div>" +
        "</div>";

    var title = ucmode === 'forUCcreate' ? 'Créer un destinateur 新建收货人' : 'Détail du destinateur 收货人详情';
    contact_client_dialog(title, content, cons, ucmode);
}

function contact_client_dialog(title, content, cons, ucmode) {
    bootbox.dialog({
        title: title,
        message: content
    }).find('.modal-dialog').css({
        'width': '60%'
    }).find('.modal-header').css({
        'background': 'url(../../img/menu_005_bg.jpg) repeat-x',
        'text-align': 'center',
        'color': '#C0C0C0'
    });


    js_FillElement('CivId', civilityList);


    $.each(cons, function (name, value) {
        //console.info(order);   
        var newname = name;
        if (name === 'ConCity') {
            //$('#ip_City').val(value);
            newname = 'ip_ConCity';
        }
        setFieldValue(newname, value, true, false);
    });

    $('.' + ucmode).show();

    return false;
}

function js_InsertUpdateCon() {
    var validated = CheckRequiredFieldInOneDiv('div_contact_client');
    //validated = validated && $('#CcoFirstname')[0].checkValidity();
    if (validated) {
        ShowPleaseWaitWithText('Veuillez patienter ...');
        var aCon = Object();
        //aCon.ConId = $('#ConId').val();
        aCon.FConId = $('#FConId').val();
        //aCon.FCliId = getParameterByName('cliId');
        aCon.ConFirstname = $('#ConFirstname').val();
        aCon.ConLastname = $('#ConLastname').val();
        aCon.CivId = $('#CivId').val();
        //aCon.ConRef = $('#ConRef').val();
        aCon.ConAdresseTitle = $('#ConAdresseTitle').val();
        aCon.ConAddress1 = $('#ConAddress1').val();
        aCon.ConAddress2 = $('#ConAddress2').val();
        aCon.ConAddress3 = $('#ConAddress3').val();
        aCon.ConPostcode = $('#ConPostcode').val();
        aCon.ConCity = $('#ip_ConCity').val();
        aCon.ConCompanyname= $('#ConCompanyname').val();
        var cmu_id = 0;
        $('#ConCity').find('option').each(function (order, value) {
            if ($(value).attr('value').toLowerCase() === aCon.ConCity.toLowerCase()) {
                cmu_id = $(value).attr('data-value');
            }
        });

        aCon.ConCmuId = cmu_id;
        aCon.ConCountry = $('#ConCountry').val();
        aCon.ConTel1 = $('#ConTel1').val();
        aCon.ConTel2 = $('#ConTel2').val();
        aCon.ConFax = $('#ConFax').val();
        aCon.ConCellphone = $('#ConCellphone').val();
        aCon.ConEmail = $('#ConEmail').val();
        aCon.ConRecieveNewsletter = $('#ConRecieveNewsletter')[0].checked;
        aCon.ConNewsletterEmail = $('#ConNewsletterEmail').val();
        aCon.ConIsDeliveryAdr = $('#ConIsDeliveryAdr')[0].checked;
        aCon.ConIsInvoicingAdr = $('#ConIsInvoicingAdr')[0].checked;
        aCon.ConComment = $('#ConComment').val();
        var jsondata = JSON.stringify({ oneConsignee: aCon });
        var url = window.webservicePath + "/CreateUpdateConsignee";
        $.ajax({
            url: url,
            type: 'POST',
            contentType: 'application/json; charset=utf-8',
            data: jsondata,
            dataType: 'json',
            success: function (data) {
                HidePleaseWait();
//                var jsdata = data.d;
//                var data2Treat = jQuery.parseJSON(jsdata);
                closeDialog();
                alert('L\'operation est effecturée ! <br/>操作已完成！');
                setTimeout(function () { $('#dialog_ok2').click(); }, 800);

                $('.searchresult').hide();
                $('#dt_cons').remove();
                //$('#datatable_contact_client').dataTable().fnClearTable();
                //js_LoadconsigneeListByCliId(true);
                //window.location.reload(false); 
            },
            error: function (data) {
                HidePleaseWait();
            }
        });
    }
    return false;
}

var ConSelectedId = 0;
var ConAutoSearchList = [];
function setAutoCompleteCon() {
    var url = window.webservicePath + "/GetConsigneeByKeyword";
    //var cliFId = $('#cinClient :selected').attr('data-value');
    $("#LbConSearch").autocomplete({
        source: function(request, response) {
            //console.log('start');
            ConSelectedId = 0;
            SetSelectedCon();
            $.ajax({
                url: url,
                data: "{ 'keyword': '" + request.term + "'}",
                dataType: "json",
                type: "POST",
                contentType: "application/json; charset=utf-8",
                success: function(data) {
                    ConSelectedId= 0;
                    var jsdata = data.d;
                    var data2Treat = jQuery.parseJSON(jsdata);
                    ConAutoSearchList= [];
                    ConAutoSearchList= data2Treat;
                    if (data2Treat.length > 0) {
                        response($.map(data2Treat, function(item) {
                            return {
                                label: item.ConFirstname +" " + item.ConLastname + " " + item.ConPostcode + " " + item.ConCountry,
                                val: item.ConId,
                            }
                        }));
                    } else {
                    }
                },
                error: function(response) {
//                    alert(response.responseText);
                    //console.log(response);
                },
                failure: function(response) {
                    alert(response.responseText);
                }
            });
        },
        select: function(e, i) {
            ConSelectedId = i.item.val * 1;
            //console.log(ConSelectedId);

            var selectedCon = searchFieldValueInArray(ConAutoSearchList,'ConId',ConSelectedId);
            if (selectedCon) {
                //console.log(selectedCon);
                SetSelectedCon(selectedCon);
            }
        },
        minLength: 2
    });
}

function SetSelectedCon(onecon) {
    var ConFirstname = '';
    var ConLastname = '';
    var ConCode = '';
    var Civility = '';
    var ConAdresseTitle = '';
    var ConAddress1 = '';
    var ConAddress2 = '';
    var ConAddress3 = '';
    var ConPostcode = '';
    var ConCity = '';
    var ConCountry = '';
    var ConTel1 = '';
    var ConTel2 = '';
    var ConFax = '';
    var ConCellphone = '';
    var ConEmail = '';
    var ConRecieveNewsletter = '';
    var ConNewsletterEmail = '';
    var ConIsDeliveryAdr = '';
    var ConIsInvoicingAdr = '';
    var ConComment = '';
    var ConCompanyname = '';
    if (onecon) {
        ConFirstname = IsNullOrEmpty(onecon.ConFirstname) ? '' : onecon.ConFirstname;
        ConLastname = IsNullOrEmpty(onecon.ConLastname) ? '' : onecon.ConLastname;
        ConCode = IsNullOrEmpty(onecon.ConCode) ? '' : onecon.ConCode;
        Civility = IsNullOrEmpty(onecon.Civility.Value) ? '' : onecon.Civility.Value;
        ConAdresseTitle = IsNullOrEmpty(onecon.ConAdresseTitle) ? '' : onecon.ConAdresseTitle;
        ConAddress1 = IsNullOrEmpty(onecon.ConAddress1) ? '' : onecon.ConAddress1;
        ConAddress2 = IsNullOrEmpty(onecon.ConAddress2) ? '' : onecon.ConAddress2;
        ConAddress3 = IsNullOrEmpty(onecon.ConAddress3) ? '' : onecon.ConAddress3;
        ConPostcode = IsNullOrEmpty(onecon.ConPostcode) ? '' : onecon.ConPostcode;
        ConCity = IsNullOrEmpty(onecon.ConCity) ? '' : onecon.ConCity;
        ConCountry = IsNullOrEmpty(onecon.ConCountry) ? '' : onecon.ConCountry;
        ConTel1 = IsNullOrEmpty(onecon.ConTel1) ? '' : onecon.ConTel1;
        ConTel2 = IsNullOrEmpty(onecon.ConTel2) ? '' : onecon.ConTel2;
        ConFax = IsNullOrEmpty(onecon.ConFax) ? '' : onecon.ConFax;
        ConCellphone = IsNullOrEmpty(onecon.ConCellphone) ? '' : onecon.ConCellphone;
        ConEmail = IsNullOrEmpty(onecon.ConEmail) ? '' : onecon.ConEmail;
        ConRecieveNewsletter = IsNullOrEmpty(onecon.ConRecieveNewsletter) ? '' : onecon.ConRecieveNewsletter;
        ConNewsletterEmail = IsNullOrEmpty(onecon.ConNewsletterEmail) ? '' : onecon.ConNewsletterEmail;
        ConIsDeliveryAdr = IsNullOrEmpty(onecon.ConIsDeliveryAdr) ? '' : onecon.ConIsDeliveryAdr;
        ConIsInvoicingAdr = IsNullOrEmpty(onecon.ConIsInvoicingAdr) ? '' : onecon.ConIsInvoicingAdr;
        ConComment = IsNullOrEmpty(onecon.ConComment) ? '' : onecon.ConComment;
        ConCompanyname = IsNullOrEmpty(onecon.ConCompanyname) ? '' : onecon.ConCompanyname;
    }

    $('#LbConFirstname').text(ConFirstname);
    $('#LbConLastname').text(ConLastname);
    $('#LbConCode').text(ConCode);
    $('#Civility').text(Civility);
    $('#LbConAdresseTitle').text(ConAdresseTitle);
    $('#LbConAddress1').text(ConAddress1);
    $('#LbConAddress2').text(ConAddress2);
    $('#LbConAddress3').text(ConAddress3);
    $('#LbConPostcode').text(ConPostcode);
    $('#LbConCity').text(ConCity);
    $('#LbConCountry').text(ConCountry);
    $('#LbConTel1').text(ConTel1);
    $('#LbConTel2').text(ConTel2);
    $('#LbConFax').text(ConFax);
    $('#LbConCellphone').text(ConCellphone);
    $('#LbConEmail').text(ConEmail);
    $('#LbConCompanyname').text(ConCompanyname);
    $('#LbConRecieveNewsletter').text(ConRecieveNewsletter?'YES':'NO');
    $('#LbConNewsletterEmail').text(ConNewsletterEmail);
    $('#LbConIsDeliveryAdr').text(ConIsDeliveryAdr?'YES':'NO');
    $('#LbConIsInvoicingAdr').text(ConIsInvoicingAdr?'YES':'NO');
    $('#LbConComment').text(ConComment);
}