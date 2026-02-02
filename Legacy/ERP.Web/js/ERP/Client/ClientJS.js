var clientInPage = Object;
var civilityList = [];

$(document).ready(initFunc);

function initFunc() {
    ShowPleaseWait();
    //js_getClientType('CtyId');
    iniClientType();
    js_getAllCurrency('CurId');
    js_getAllTVA('VatId');
    js_GetPaymentCondition('PcoId');
    js_GetPaymentMode('PmoId');
    js_GetActivity('ActId');
    var mode = getUrlVars()['mode'];
    //    var mode = getUrlVars()['mode'];
    //    if (mode === 'view') {
    //        $('.forview').show();
    //    } else if (mode === undefined || mode === '' || mode === 'create') {
    //        $('.forcreate').show();
    //    } else if (mode === 'modify') {
    //        $('.forupdate').show();
    //    }

    $.each($('.datepicker'), function (idx, value) {
        $(value).datepicker();
    });
    initMode();
    if (_isCreate) {
        $('#DateCreation').val(getToday());
    }
    js_GetCivility(0, 'civilityList');


    $.when(_getCom(dtdGetCommercial)).done(function () {
        $('#UsrIdCom1').append($("<option>Sélectionner un commercial</option>").attr("value", "0").attr("selected", true));
        $.each(allCommercials, function (order, oneCom) {
            $('#UsrIdCom1').append($("<option>" + oneCom.FullName + "</option>").attr("value", oneCom.Id));
        });
        $('#UsrIdCom2').append($("<option>Sélectionner un commercial</option>").attr("value", "0").attr("selected", true));
        $.each(allCommercials, function (order, oneCom) {
            $('#UsrIdCom2').append($("<option>" + oneCom.FullName + "</option>").attr("value", oneCom.Id));
        });

        $('#UsrIdCom3').append($("<option>Sélectionner un commercial</option>").attr("value", "0").attr("selected", true));
        $.each(allCommercials, function (order, oneCom) {
            $('#UsrIdCom3').append($("<option>" + oneCom.FullName + "</option>").attr("value", oneCom.Id));
        });
        js_LoadClientById();
    });
    js_LoadContactClientsByCliId(true);
    SetLanguageBar();
}

var clienttypesInPage = [];
function iniClientType() {
    var url = window.webservicePath + "/GetClientType";
    $.ajax({
        type: "POST",
        url: url,
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        success: function (data) {
            var jsdata = data.d;
            var data2Treat = jQuery.parseJSON(jsdata);
            if (data2Treat !== '-1') {
                // 给element 赋值
                clienttypesInPage = data2Treat;
                //console.log(clienttypes);
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
function js_CheckClientExisted(sender) {
    var url = window.webservicePath + "/CheckClientExisted";
    var CompanyName = $(sender).val();
    var cliId = getParameterByName('cliId');
    $.ajax({
        type: "POST",
        url: url,
        contentType: "application/json; charset=utf-8",
        data: "{companyName:'" + CompanyName + "',cliId:'" + cliId + "'}",
        dataType: "json",
        success: function (data) {
            var jsdata = data.d;
            if (jsdata === 1) {
                $("#div_CompanyName").addClass('has-error');
                alert('Raison social est déjà existé!');
                //$(sender).focus();
            } else {
                $("#div_CompanyName").removeClass('has-error');
            }
        },
        error: function (data) {
            var test = '';
        }
    });
}

function js_CheckClientExisted_for_create_update(companyId) {
    var url = window.webservicePath + "/CheckClientExisted";
    var CompanyName = $('#' + companyId).val();
    var cliId = getParameterByName('cliId');
    $.ajax({
        type: "POST",
        url: url,
        contentType: "application/json; charset=utf-8",
        data: "{companyName:'" + CompanyName + "',cliId:'" + cliId + "'}",
        dataType: "json",
        success: function (data) {
            var jsdata = data.d;
            if (jsdata === 1) {
                $("#div_CompanyName").addClass('has-error');
                alert('Raison social est déjà existé!');
                $(sender).focus();
            } else {
                $("#div_CompanyName").removeClass('has-error');
                js_CreateUpdateClient();
            }
        },
        error: function (data) {
            var test = '';
        }
    });
}

function js_CreateUpdateClient() {
    var validated = true;
    validated = validated && $('#CompanyName')[0].checkValidity();
    if (!validated) {
        $('#CompanyName').addClass('error_border');
        $('#CompanyName').focus();
    } else {
        $('#CompanyName').removeClass('error_border');
    }
    var aClient = Object();
    aClient.FId = getParameterByName('cliId');
    aClient.CompanyName = $('#CompanyName').val();
    aClient.VatId = $('#VatId').val();
    aClient.PcoId = $('#PcoId').val();
    aClient.PmoId = $('#PmoId').val();
    aClient.ActId = $('#ActId').val();
    aClient.Siren = $('#Siren').val();
    aClient.Siret = $('#Siret').val();
    aClient.VatIntra = $('#VatIntra').val();
    //aClient.CtyId = $('#CtyId').val();
    // 20251208 由于一对多的原因，这个值默认是1，并不再使用
    aClient.CtyId = 1;
    aClient.CurId = $('#CurId').val();
    aClient.Isactive = $('#Isactive')[0].checked;
    aClient.ShowDetail = $('#ShowDetail')[0].checked;
    aClient.Isblocked = $('#Isblocked')[0].checked;
    aClient.Address1 = $('#Address1').val();
    aClient.Address2 = $('#Address2').val();
    aClient.Postcode = $('#Postcode').val();
    aClient.CliPdfVersion = $('#CliPdfVersion').val();
    aClient.City = $('#ip_City').val();
    var cmu_id = 0;
    $('#City').find('option').each(function (order, value) {
        if ($(value).attr('value').toLowerCase() === aClient.City.toLowerCase()) {
            cmu_id = $(value).attr('data-value');
        }
    });
    aClient.CmuId = cmu_id * 1;
    aClient.Country = $('#Country').val();
    aClient.FreeOfHarbor = $('#FreeOfHarbor').val();
    aClient.Tel1 = $('#Tel1').val();
    aClient.Tel2 = $('#Tel2').val();
    aClient.Fax = $('#Fax').val();
    aClient.Cellphone = $('#Cellphone').val();
    aClient.Email = $('#Email').val();
    aClient.UsrIdCom1 = $('#UsrIdCom1').val();
    aClient.Commercial1 = $('#Commercial1').val();
    aClient.UsrIdCom2 = $('#UsrIdCom2').val();
    aClient.Commercial2 = $('#Commercial2').val();
    aClient.UsrIdCom3 = $('#UsrIdCom3').val();
    aClient.Commercial3 = $('#Commercial3').val();
    aClient.RecieveNewsletter = $('#RecieveNewsletter')[0].checked;
    aClient.NewsletterEmail = $('#NewsletterEmail').val();
    aClient.Comment4Interne = $('#Comment4Interne').val();
    aClient.Comment4Client = $('#Comment4Client').val();
    aClient.VatIntra = $('#VatIntra').val();
    aClient.InvoiceDay = $('#InvoiceDay').val();
    aClient.CliAbbr = $('#CliAbbr').val();
    aClient.CliAccountingEmail = $('#CliAccountingEmail').val();
    aClient.InvoiceDayIsLastDay = $('#InvoiceDayIsLastDay')[0].checked;
    var _ClientTypes = [];
    var allCtybox = $("input[id^='ip_ctl_']");
    $.each(allCtybox, function (name, value) {
        var oneline = {};
        oneline.Key = $(value).attr('ctlId');
        oneline.Key2 = $(value).attr('ctyId');
        oneline.Actived = $(value).prop('checked')
        _ClientTypes.push(oneline);
    });
    aClient.ClientTypes = _ClientTypes;
    aClient.DateCreation = getCreationDate($('#DateCreation').val());

    //alert(validated);
    if (validated) {

        myApp.showPleaseWait();
        var jsondata = JSON.stringify({ oneClient: aClient });
        setloadingmaskmessage('Veuillez patienter ...');
        loadingmaskShow();
        $.ajax({
            url: 'Client.aspx/CreateUpdateClient',
            type: 'POST',
            contentType: 'application/json; charset=utf-8',
            data: jsondata,
            dataType: 'json',
            success: function (data) {
                var clientId = data.d;
                var url = window.location.href.split('?')[0];
                var newUrl = url + '?cliId=' + clientId + '&mode=view';
                document.location.href = newUrl;
            },
            error: function (data) {
                myApp.hidePleaseWait();
            }
        });
    }
    return false;
}

function js_LoadClientById() {
    //var cliId = getUrlVars()['cliId'];
    var cliId = getParameterByName('cliId');
    if (cliId) {
        var isclient = false;
        var isProspect = false;
        var isDelegator = false;
        var url = window.webservicePath + "/LoadClientById";
        $.ajax({
            type: "POST",
            url: url,
            contentType: "application/json; charset=utf-8",
            data: "{cliId:'" + cliId + "'}",
            dataType: "json",
            success: function (data) {
                var jsdata = data.d;
                var jsondata = jQuery.parseJSON(jsdata);
                if (jsondata !== -1) {
                    clientInPage = Object;
                    clientInPage = jsondata;
                    $.each(jsondata, function (name, value) {
                        //console.info(order);   
                        var newname = name;
                        if (name === 'City') {
                            //$('#ip_City').val(value);
                            newname = 'ip_City';
                        }
                        setFieldValue(newname, value, true);
                        // 20251126 for delegator
                        if (newname == 'ClientTypes') {
                            isclient = !jQuery.isEmptyObject(searchFieldValueInArray(value, 'Key2', 1));
                            isProspect = !jQuery.isEmptyObject(searchFieldValueInArray(value, 'Key2', 2));
                            isDelegator = !jQuery.isEmptyObject(searchFieldValueInArray(value, 'Key2', 3));
                            //console.log('isclient ' + isclient);
                            //console.log('isProspect ' + isProspect);
                            //console.log('isDelegator ' + isDelegator);
                            //var pagetitle = value == 3 ? "Délégataire" : "Client";
                            var pagetitle = (isclient ? "Client" : "");
                            pagetitle += (isDelegator ? (((IsNullOrEmpty(pagetitle) ? "" : " & ") + (isDelegator ? "Délégataire" : ""))) : "");
                            pagetitle += (isProspect ? ((IsNullOrEmpty(pagetitle) ? "" : " & ") + (isProspect ? "Prospect" : "")) : "");
                            var titlecolor = isDelegator ? "red" : "";
                            //span_client_deleg_title
                            var listtitle = isDelegator ? "La liste des clients du délégataire" : "La liste des délégataires du client";
                            var btnname = isDelegator ? "Mettre à jour les clients" : "Mettre à jour les délégataires";
                            $('#span_pagetitle').html(pagetitle);
                            $('#span_pagetitle').css('color', titlecolor);
                            $('#span_client_deleg_title').html(listtitle);
                            $('#span_client_deleg_title').css('color', titlecolor);
                            $('#btn_update_client_delegator').text(btnname);
                        }
                    });
                    setClientTypes(clientInPage.ClientTypes);
                    if (_isView) {
                        loadclientdelegatorlist(0, 0);
                        if (isclient && isDelegator) {
                            $('#div_delegatorOfclient').show();
                            loadclientdelegatorlist(1, 1);
                        }
                    }
                } else {
                }
                HidePleaseWait();
            },
            error: function (data) {
                var test = '';
            }
        });
    } else {
        setClientTypes('');
        HidePleaseWait();
    }
}

function setClientTypes(clientstypes) {
    // set client type
    var content = "";
    var mode = _isView ? " disabled " : "";
    var ctlId = 0;
    $.each(clienttypesInPage, function (name, value) {
        var selected = false;
        var ctlIdinLine = ctlId;
        if (!jQuery.isEmptyObject(clientstypes)) {
            var oneclienttype = searchFieldValueInArray(clientstypes, 'Key2', value.Key);
            if (!jQuery.isEmptyObject(oneclienttype)) {
                selected = true;
                ctlIdinLine = oneclienttype.Key;
            }
        }
        var oneline = "<label class='col-sm-5 control-label'>" + value.Value + "</label>";
        oneline += "<div class='col-sm-7'><input type='checkbox' id='ip_ctl_" + ctlIdinLine + "' ctlId='" + ctlIdinLine + "' ctyId='" + value.Key + "' class='form-control' " + (selected ? " checked " : "") + (mode) + " /></div></br>";
        content += oneline;
        ctlId--;
    });
    $('#div_cty').append(content);
}

function display_contact_client(ccoId) {
    if (ccoId === 0) {
        var oneCco = Object;
        oneCco.CcoAddress1 = clientInPage.Address1;
        oneCco.CcoAddress2 = clientInPage.Address2;
        oneCco.CcoPostcode = clientInPage.Postcode;
        oneCco.CcoCity = clientInPage.City;
        oneCco.CcoCountry = clientInPage.Country;
        oneCco.CcoTel1 = clientInPage.Tel1;
        oneCco.CcoTel2 = clientInPage.Tel2;
        oneCco.CcoFax = clientInPage.Fax;
        oneCco.CcoCellphone = clientInPage.Cellphone;
        oneCco.CcoEmail = clientInPage.Email;
        oneCco.CcoRecieveNewsletter = clientInPage.RecieveNewsletter;
        oneCco.CcoNewsletterEmail = clientInPage.NewsletterEmail;
        FillContactClient(oneCco, 'forUCcreate');
    } else {
    }

    return false;
}

function FillContactClient(contactClient, ucmode) {
    var content = "<div class='box' id='div_contact_client'>" +
        "<div class='box-body'>" +
        "<div class='form-horizontal'>" +
        "<div class='form-group'>" +
        "<label id='CcoId' name='CcoId' style='display:none;'></label>" +
        "<label id='FCcoId' name='FCcoId' style='display:none;'></label>" +
        "<label class='col-sm-2 control-label fieldRequired'>Titre d\'adresse</label>" +
        "<div class='col-sm-4'><input class='form-control' id='CcoAdresseTitle' name='CcoAdresseTitle' type='text' placeholder='Titre'></div>" +
        "<label class='col-sm-2 control-label'>Référence</label>" +
        "<div class='col-sm-4'><input class='form-control' id='CcoRef' name='CcoRef' type='text' placeholder='Référence' disabled=''></div>" +
        "</div>" +
        "<div class='form-group'>" +
        "<label class='col-sm-2 control-label '>Prénom</label>" +
        "<div class='col-sm-4'><input class='form-control' id='CcoFirstname' name='CcoFirstname' type='text' placeholder='Prénom'  maxlength='200'></div>" +
        "<label class='col-sm-2 control-label '>Nom de famille</label>" +
        "<div class='col-sm-4'><input class='form-control' id='CcoLastname' name='CcoLastname' type='text' placeholder='Nom de famille' maxlength='200'></div>" +
        "</div>" +
        "<div class='form-group'>" +
        "<label class='col-sm-2 control-label'>Civilité</label>" +
        "<div class='col-sm-4'><select class='form-control' id='CivId' name='CivId'></select></div>" +
        "<label class='col-sm-2 control-label'>Adresse 1</label>" +
        "<div class='col-sm-4'><input class='form-control' id='CcoAddress1' name='CcoAddress1' type='text' placeholder='Adresse 1'></div>" +
        "</div>" +
        "<div class='form-group'>" +
        "<label class='col-sm-2 control-label'>Adresse 2</label>" +
        "<div class='col-sm-4'><input class='form-control' id='CcoAddress2' name='CcoAddress2' type='text' placeholder='Adresse 2'></div>" +
        "<label class='col-sm-2 control-label'>Code postal</label>" +
        "<div class='col-sm-4'><input class='form-control' id='CcoPostcode' name='CcoPostcode' type='text' placeholder='Code postal'  onkeyup='getCommuneName(this,\"CcoCity\")' maxlength='10'></div>" +
        "</div>" +
        "<div class='form-group'>" +
        "<label class='col-sm-2 control-label'>Ville</label>" +
        "<div class='col-sm-4'><input type='text' class='form-control' list='CcoCity' id='ip_CcoCity' placeholder='Ville'oninput='communeChange(\"ip_CcoCity\",\"CcoCity\",\"CcoPostcode\")' maxlength='200'><datalist id='CcoCity'></datalist></div>" +
        "<label class='col-sm-2 control-label'>Pays</label>" +
        "<div class='col-sm-4'><input class='form-control' id='CcoCountry' name='CcoCountry' type='text' placeholder='Pays'></div>" +
        "</div>" +
        "<div class='form-group'>" +
        "<label class='col-sm-2 control-label'>Téléphone 1</label>" +
        "<div class='col-sm-4'><input class='form-control' id='CcoTel1' name='CcoTel1' type='text' placeholder='Téléphone 1'></div>" +
        "<label class='col-sm-2 control-label'>Téléphone 2</label>" +
        "<div class='col-sm-4'><input class='form-control' id='CcoTel2' name='CcoTel2' type='text' placeholder='Téléphone 2'></div>" +
        "</div>" +
        "<div class='form-group'>" +
        "<label class='col-sm-2 control-label'>Fax</label>" +
        "<div class='col-sm-4'><input class='form-control' id='CcoFax' name='CcoFax' type='text' placeholder='CcoFax'></div>" +
        "<label class='col-sm-2 control-label'>Portable</label>" +
        "<div class='col-sm-4'><input class='form-control' id='CcoCellphone' name='CcoCellphone' type='text' placeholder='Portable'></div>" +
        "</div>" +
        "<div class='form-group'>" +
        "<label class='col-sm-2 control-label'>Email</label>" +
        "<div class='col-sm-4'>" +
        "<div class='input-group'><span class='input-group-addon'>@</span><input type='email' id='CcoEmail' name='CcoEmail' class='form-control' placeholder='Email'maxlength='100'></div>" +
        "</div>" +
        "<label class='col-sm-2 control-label'>Recevoir le Newsletter</label>" +
        "<div class='col-sm-4'>" +
        "<div class='row'>" +
        "<div class='col-sm-2'>" +
        "<div class='checker' style='text-align: center;'><span class=''><input type='checkbox' class='form-control' id='CcoRecieveNewsletter' name='CcoRecieveNewsletter' class='uniform'value=''></span></div>" +
        "</div>" +
        "<div class='col-sm-10'>" +
        "<div class='input-group'><span class='input-group-addon'>@</span><input type='email' id='CcoNewsletterEmail' name='CcoNewsletterEmail' class='form-control'placeholder='Newsletter Email' maxlength='20'></div>" +
        "</div>" +
        "</div>" +
        "</div>" +
        "</div>" +
        "<div class='form-group'>" +
        "<label class='col-sm-2 control-label'>Adresse livraison</label>" +
        "<div class='col-sm-4'>" +
        "<div class='checker' style='text-align: center;'><span class=''><input class='form-control' type='checkbox' class='form-control'  id='CcoIsDeliveryAdr' name='CcoIsDeliveryAdr' class='uniform' value='' checked></span></div>" +
        "</div>" +
        "<label class='col-sm-2 control-label'>Adresse facturation</label>" +
        "<div class='col-sm-4'>" +
        "<div class='checker' style='text-align: center;'><span class=''><input class='form-control' type='checkbox' class='form-control'  id='CcoIsInvoicingAdr' name='CcoIsInvoicingAdr' class='uniform' value='' checked></span></div>" +
        "</div>" +
        "</div>" +
        "<div class='form-group'>" +
        "<label class='col-md-2 control-label'>Commentaire</label>" +
        "<div class='col-md-10'><textarea rows='3' cols='5' name='CcoComment' class='form-control' id='CcoComment'></textarea></div>" +
        "</div>" +
        "<div class='modal-footer center forUCcreate'><button type='button' class='btn btn-default' onclick='closeDialog()'>Annuler</button><button type='button' class='btn btn-inverse' onclick='return js_InsertUpdateContactClient();'>Sauvegarder</button></div>" +
        "<div class='modal-footer center forUCview'><button type='button' class='btn btn-default' onclick='closeDialog()'>Annuler</button><button type='button' class='btn btn-inverse' >Modifier</button></div>" +
        "<div class='modal-footer center forUCupdate'><button type='button' class='btn btn-default' >Annuler</button><button type='button' class='btn btn-inverse' onclick='return js_InsertUpdateContactClient();'>Mettre à jours</button><button type='button' class='btn btn-inverse' onclick='return confirmerDeleteCco()'>Supprimer</button></div>" +
        "</div>" +
        "</div>" +
        "</div>";

    var title = ucmode === 'forUCcreate' ? 'Créer un commercial' : 'Détail du commercial';
    contact_client_dialog(title, content, contactClient, ucmode);
}

function contact_client_dialog(title, content, contactClient, ucmode) {
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


    $.each(contactClient, function (name, value) {
        //console.info(order);   
        var newname = name;
        if (name === 'CcoCity') {
            //$('#ip_City').val(value);
            newname = 'ip_CcoCity';
        }
        setFieldValue(newname, value, true, false);
    });

    $('.' + ucmode).show();

    return false;
}

function closeDialog() {
    $(".bootbox").modal("hide");
}

function js_InsertUpdateContactClient() {
    var validated = CheckRequiredFieldInOneDiv('div_contact_client');
    //validated = validated && $('#CcoFirstname')[0].checkValidity();
    if (validated) {
        ShowPleaseWaitWithText('Veuillez patienter ...');
        var aContactClient = Object();
        //aContactClient.CcoId = $('#CcoId').val();
        aContactClient.FCcoId = $('#FCcoId').val();
        aContactClient.FCliId = getParameterByName('cliId');
        aContactClient.CcoFirstname = $('#CcoFirstname').val();
        aContactClient.CcoLastname = $('#CcoLastname').val();
        aContactClient.CivId = $('#CivId').val();
        aContactClient.CcoRef = $('#CcoRef').val();
        aContactClient.CcoAdresseTitle = $('#CcoAdresseTitle').val();
        aContactClient.CcoAddress1 = $('#CcoAddress1').val();
        aContactClient.CcoAddress2 = $('#CcoAddress2').val();
        aContactClient.CcoPostcode = $('#CcoPostcode').val();
        aContactClient.CcoCity = $('#ip_CcoCity').val();

        var cmu_id = 0;
        $('#CcoCity').find('option').each(function (order, value) {
            if ($(value).attr('value').toLowerCase() === aContactClient.CcoCity.toLowerCase()) {
                cmu_id = $(value).attr('data-value');
            }
        });

        aContactClient.CcoCmuId = cmu_id;

        aContactClient.CcoCountry = $('#CcoCountry').val();
        aContactClient.CcoTel1 = $('#CcoTel1').val();
        aContactClient.CcoTel2 = $('#CcoTel2').val();
        aContactClient.CcoFax = $('#CcoFax').val();
        aContactClient.CcoCellphone = $('#CcoCellphone').val();
        aContactClient.CcoEmail = $('#CcoEmail').val();
        aContactClient.CcoRecieveNewsletter = $('#CcoRecieveNewsletter')[0].checked;
        aContactClient.CcoNewsletterEmail = $('#CcoNewsletterEmail').val();
        aContactClient.CcoIsDeliveryAdr = $('#CcoIsDeliveryAdr')[0].checked;
        aContactClient.CcoIsInvoicingAdr = $('#CcoIsInvoicingAdr')[0].checked;
        aContactClient.CcoComment = $('#CcoComment').val();


        var jsondata = JSON.stringify({ oneContactClient: aContactClient });
        //        setloadingmaskmessage('Veuillez patienter ...');
        //        loadingmaskShow();
        $.ajax({
            url: 'Client.aspx/CreateUpdateContactClient',
            type: 'POST',
            contentType: 'application/json; charset=utf-8',
            data: jsondata,
            dataType: 'json',
            success: function (data) {
                myApp.hidePleaseWait();
                //var clientId = data.d;
                //                var url = window.location.href.split('?')[0];
                //                var newUrl = url + '?cliId=' + clientId + '&mode=view';
                //                document.location.href = newUrl;


                //js_LoadContactClientsByCliId(false);


                //                var jsdata = data.d;
                //                var value = jQuery.parseJSON(jsdata);


                //                var content = "<tr class='gradeA'><td>" + value.CcoFirstname + " " + value.CcoLastname + "</td>" +
                //                            "<td>" + value.CcoTel1 + "/" + value.CcoFax + "</td>" +
                //                            "<td>" + value.CcoCellphone + "</td>" +
                //                            "<td class='hidden-xs'>" + value.CcoAddress1 + "</td>" +
                //                            "<td class='center'>" + value.CcoPostcode + "</td>" +
                //                            "<td>" + value.CcoCity + "</td>" +
                //                            "<td class='center hidden-xs'>" + value.CcoEmail + "</td></tr>";


                //                var t = $('#datatable_contact_client').DataTable();
                //                t.row.add(content).draw(false);

                //                contentToAddTable = content;

                //                $('#addRow').click();

                $('#datatable_contact_client').dataTable().fnClearTable();
                js_LoadContactClientsByCliId(true);
                //window.location.reload(false); 
            },
            error: function (data) {
                myApp.hidePleaseWait();
            }
        });
    }
    return false;
}

//var contentToAddTable = "";

//$(document).ready(function () {
//    var t = $('#datatable_contact_client').DataTable();


//    $('#addRow').on('click', function () {
//        t.row.add(contentToAddTable).draw(false);
//    });

//});

var contactClients = [];

function js_LoadContactClientsByCliId(reloadAll) {
    var cliId = getParameterByName('cliId');
    var url = window.webservicePath + "/LoadContactClientsByCliId";
    var budgetId = '#tbody_contact_client';
    if (cliId) {
        $.ajax({
            type: "POST",
            url: url,
            contentType: "application/json; charset=utf-8",
            data: "{cliId:'" + cliId + "'}",
            dataType: "json",
            success: function (data) {
                var jsdata = data.d;
                var data2Treat = jQuery.parseJSON(jsdata);
                if (data2Treat !== '-1') {
                    if (data2Treat.length > 0)
                    // 给element 赋值
                    {
                        if (budgetId !== '#0') {
                            //$(budgetId).empty();
                            var content = "";
                            //Contact	Tél/Fax	Portable	Adresse	CP	Ville	Email
                            contactClients = [];
                            contactClients = data2Treat;
                            $.each(data2Treat, function (name, value) {
                                //                            content += "<tr class='gradeA'  ondblclick='viewContactClient(\"" + value.FCcoId + "\")' style='cursor:pointer'>" +
                                //                            "<td>" + value.CcoAdresseTitle + "</td>" +
                                //                                "<td>" + value.CcoFirstname + " " + value.CcoLastname + "</td>" +
                                //                            "<td>" + value.CcoTel1 + "/" + value.CcoFax + "</td>" +
                                //                            "<td>" + value.CcoCellphone + "</td>" +
                                //                            "<td><input type='checkbox' class='uniform' " + (value.CcoIsInvoicingAdr === true ? 'checked = true' : '') + " disabled></td>" +
                                //                            "<td><input type='checkbox' class='uniform' " + (value.CcoIsDeliveryAdr === true ? 'checked = true' : '') + " disabled></td>+" +
                                //                             "<td class='hidden-xs'>" + value.CcoAddress1 + "</td>" +
                                //                            "<td class='center'>" + value.CcoPostcode + "</td>" +
                                //                            "<td>" + value.CcoCity + "</td>" +
                                //                            "<td class='center hidden-xs'>" + value.CcoEmail + "</td></tr>";


                                var createLogin = value.Login
                                    ? "<span  onclick='viewContactClient(\"" + value.FCcoId + "\")' style='cursor:pointer'>" + value.Login + "</span>"
                                    : "<button type='button' class='btn btn-inverse' ccoid='" + value.CcoId + "' onclick='return createLoginClick(this);'>Créer Login</button>";
                                $('#datatable_contact_client').dataTable().fnAddData([
                                    "<span  onclick='viewContactClient(\"" + value.FCcoId + "\")' style='cursor:pointer;font-weight:bolder; '>" + value.CcoAdresseTitle + "</span>",
                                    "<span  onclick='viewContactClient(\"" + value.FCcoId + "\")' style='cursor:pointer;font-weight:bolder; '>" + value.CcoRef + "</span>",
                                    "<span  onclick='viewContactClient(\"" + value.FCcoId + "\")' style='cursor:pointer;font-weight:bolder; '>" + value.CcoFirstname + " " + value.CcoLastname + "</span>",
                                    "<span  onclick='viewContactClient(\"" + value.FCcoId + "\")' style='cursor:pointer'>" + value.CcoTel1 + "/" + value.CcoFax + "</span>",
                                    "<span  onclick='viewContactClient(\"" + value.FCcoId + "\")' style='cursor:pointer'>" + value.CcoCellphone + "</span>",
                                    "<span  onclick='viewContactClient(\"" + value.FCcoId + "\")' style='cursor:pointer'><input type='checkbox'  class='form-control'  class='uniform' " + (value.CcoIsInvoicingAdr === true ? 'checked = true' : '') + " disabled></span>",
                                    "<span  onclick='viewContactClient(\"" + value.FCcoId + "\")' style='cursor:pointer'><input type='checkbox'  class='form-control'  class='uniform' " + (value.CcoIsDeliveryAdr === true ? 'checked = true' : '') + " disabled></span>",
                                    "<span  onclick='viewContactClient(\"" + value.FCcoId + "\")' style='cursor:pointer'>" + value.CcoAddress1 + "</span>",
                                    "<span  onclick='viewContactClient(\"" + value.FCcoId + "\")' style='cursor:pointer'>" + value.CcoPostcode + "</span>",
                                    "<span  onclick='viewContactClient(\"" + value.FCcoId + "\")' style='cursor:pointer'>" + value.CcoCity + "</span>",
                                    "<span  onclick='viewContactClient(\"" + value.FCcoId + "\")' style='cursor:pointer'>" + value.CcoEmail + "</span>",
                                    createLogin
                                ]);


                            });
                            //$(budgetId).append(content);


                            if (reloadAll) {
                                try {
                                    $('#datatable_contact_client').dataTable({
                                        "sPaginationType": "bs_full",
                                        "bDestroy": true,
                                        "bRetrieve": true,
                                        "bServerSide": true
                                    });
                                } catch (e) {

                                }
                            }

                        }
                    }
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
}
function viewContactClient(fccoId) {
    //alert(fccoId);
    var onecco = searchFieldValueInArray(contactClients, 'FCcoId', fccoId);
    FillContactClient(onecco, 'forUCupdate');
    //alert(onecco.CcoFirstname);
}

function confirmerDeleteCco() {
    var ccoId = $('#CcoId').val();
    if (ccoId) {
        var title = "ATTENTION";
        var content = "<div class='box'><div class='box-body' style='height: 100px;'>" +
            "<div class='form-horizontal'>" +
            "<div class='col-md-12'>" +
            "<div class='form-group'>" +
            "<div class='col-sm-12' style='text-align:center;font-size: 18pt;'>Veuillez confirmer la suppression ! " +
            "<br/>La suppression est irrécupérable, veuillez confirmer !!!</div></div></div></div></div></div>"
            + "<div class='modal-footer center'>" +
            "<button type='button' class='btn btn-default' onclick='closeDialog()'>Annuler</button>" +
            "<button type='button' class='btn btn-inverse' ccoId='" + ccoId + "' onclick='return deleteCco(this);'>SUPPRIMER</button></div>";
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

function deleteCco(sender) {
    var ccoId = $(sender).attr('ccoId');
    var datastr = '{ccoId: ' + ccoId + '}';
    var url = window.webservicePath + "/DeleteContactClient";
    if (ccoId > 0) {
        $.ajax({
            url: url,
            type: 'POST',
            contentType: 'application/json; charset=utf-8',
            data: datastr,
            dataType: 'json',
            success: function (data) {
                var deleted = data.d;
                if (deleted) {
                    $('#datatable_contact_client').dataTable().fnClearTable();
                    js_LoadContactClientsByCliId(true);
                } else {
                    alert('ERROR : DATA IN USE');
                }
            },
            error: function (data) {
                alert(data.responseText);
            }
        });
    }
}

function js_getAllTVA(elementId, objname) {
    var url = window.webservicePath + "/GetAllTVA";
    var budgetId = '#' + elementId;
    GeneralAjax_Select(url, budgetId, objname);
}

function js_GetPaymentCondition(elementId, objname) {
    var url = window.webservicePath + "/GetPaymentCondition";
    var budgetId = '#' + elementId;
    GeneralAjax_Select(url, budgetId, objname);
}

function js_GetPaymentMode(elementId, objname) {
    var url = window.webservicePath + "/GetPaymentMode";
    var budgetId = '#' + elementId;
    GeneralAjax_Select(url, budgetId, objname);
}

function delete_client_confirm() {

    var title = "ATTENTION";
    var content = "<div class='box'><div class='box-body' style='height: 100px;'>" +
        "<div class='form-horizontal'>" +
        "<div class='col-md-12'>" +
        "<div class='form-group'>" +
        "<div class='col-sm-12' style='text-align:center;font-size: 18pt;'>Veuillez confirmer la suppression ! " +
        "<br/>La suppression est irrécupérable, veuillez confirmer !!!</div></div></div></div></div></div>"
        + "<div class='modal-footer center'>" +
        "<button type='button' class='btn btn-default' onclick='closeDialog()'>Annuler</button>" +
        "<button type='button' class='btn btn-inverse'  onclick='return deleteClient()'>SUPPRIMER</button></div>";
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
    return false;
}

function deleteClient() {
    var cliId = getUrlVars()['cliId'];
    var datastr = "{cliId: '" + cliId + "'}";
    var url = window.webservicePath + "/DeteleClient";
    if (cliId) {
        myApp.showPleaseWait();
        $.ajax({
            url: url,
            type: 'POST',
            contentType: 'application/json; charset=utf-8',
            data: datastr,
            dataType: 'json',
            success: function (data) {
                var deleted = data.d;
                if (deleted) {
                    window.location = 'SearchClient.aspx';
                    //myApp.hidePleaseWait();
                } else {
                    MsgErrorPopUp('ERREUR', 'DATA IN USE');

                    myApp.hidePleaseWait();
                }
            },
            error: function (data) {
                myApp.hidePleaseWait();
                alert(data.responseText);
            }
        });
    }
}

function createLoginClick(sender) {
    var ccoId = $(sender).attr('ccoid');
    //alert(ccoId);
    var func = 'createLogin(' + ccoId + ')';
    MsgPopUpWithResponseChoice('Création le Login', 'Veuillez confirmer la création de Login pour ce contact, <br/>le Login sera généré automatiquement', 'Créer', func, 'Annuler');
    return false;
}

function createLogin(ccoId) {
    var cliId = getParameterByName('cliId');
    if (cliId) {
        var url = window.webservicePath + "/CreatSiteClientByContactClient";
        $.ajax({
            type: "POST",
            url: url,
            contentType: "application/json; charset=utf-8",
            data: "{cliId:'" + cliId + "', ccoId:" + ccoId + "}",
            dataType: "json",
            success: function (data) {
                var jsdata = data.d;
                var jsondata = jQuery.parseJSON(jsdata);
                if (jsondata !== '-1') {
                    location.reload();
                } else {
                }
            },
            error: function (data) {
                var test = '';
            }
        });
    }
}


var allCommercials = [];
var dtdGetCommercial = $.Deferred();
var _getCom = function (dtdGetCommercial) {
    var url = window.webservicePath + "/GetSubCommercial";
    $.ajax({
        type: "POST",
        url: url,
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        success: function (data) {
            var jsdata = data.d;
            var data2Treat = jQuery.parseJSON(jsdata);
            if (data2Treat !== '-1') {
                allCommercials = [];
                allCommercials = data2Treat;
                dtdGetCommercial.resolve();
            } else {
                // authentication error
                AuthencationError();
                dtdGetCommercial.resolve();
            }
        },
        error: function (data) {
            var test = '';
            dtdGetCommercial.resolve();
        }
    });
    return dtdGetCommercial.promise();
}




function downloadbulkfile() {
    try {

        //console.log(prdtype.PropertyNames);
        //var props = prdtype.PropertyNames;
        //props = searchInArray(props, 'PropIsSameValue', false);
        //props = searchInArray(props, 'PropIsImage', false);
        //props = props.sort(dynamicSort('PropSubOrder'));
        //var colcount = props.length;

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
        //ptyPropCount = colcount + 3 + 2;
        //var titleline = "";
        var titleline = "<tr><th colspan='16' style='height: 30px; font-size: medium; background-color:#E8F2FF;text-align:left;'>Attention! Vous êtes entrain d'ajouter des contact au client</th></tr>"
            + "<tr><th colspan='16' style='" + thstyle + ";font-size: medium;'><span style='color:red;'>" + clientInPage.CompanyName + "</span></th></tr>";
        tab_text += titleline;
        tab_text += "<tr><th colspan='16' style='height: 30px; font-size: medium; background-color:#E8F2FF;text-align:left;'>一个联系人只能占用一行，所有表格内都<span style='color:red;'>不能含有回车键</span>。注意，TITRE, PRENOM, NOM DE FAMILLE这三项是必须的。并从<span style='color:red;'>第九行</span>开始复制。</th></tr>";
        tab_text += "<tr><th colspan='16' style='height: 30px; font-size: medium; background-color:#E8F2FF;text-align:left;'>Un contact ne peut occuper qu'une seule ligne et aucune table <span style='color:red;'>ne peut contenir la touche Entrée</span>. Veuillez noter que TITRE, PRENOM et NOM DE FAMILLE sont obligatoires et les copier à partir de <span style='color:red;'>LA NEUFIÈME LIGNE</span>.</th></tr>";

        tab_text += "<tr><th colspan='16' style='height: 30px; font-size: medium; background-color:#f5f5f5;color:red;text-align:left;'>注意：该文件是XML格式，如果一次没有添加完，请务必另存为xslx的文件，否则所有编辑的内容将会丢失！</th></tr>";
        tab_text += "<tr><th colspan='16' style='height: 30px; font-size: medium; background-color:#f5f5f5;color:red;text-align:left;'>ATTENTION : Ce fichier est au format XML. Si vous n'avez pas fini de l'ajouter immédiatement, assurez-vous de l'enregistrer en tant que fichier xslx, sinon tout le contenu modifié sera perdu !</th></tr>";

        var propnameline = "<td style='" + nmlHeight + textcenter + bold + ";color: red;background-color:#FFE900;height:70px;'>TITRE D'ADRESSE</td>" +
            "<td style='" + nmlHeight + textcenter + bold + ";color: red;background-color:#FFE900;height:70px;'>PRÉNOM</td>" +
            "<td style='" + nmlHeight + textcenter + bold + ";color: red;background-color:#FFE900;height:70px;'>NOM DE FAMILLE</td>" +
            "<td style='" + nmlHeight + textcenter + bold + "'>ADRESSE 1</td>" +
            "<td style='" + nmlHeight + textcenter + bold + "'>ADRESSE 2</td>" +
            "<td style='" + nmlHeight + textcenter + bold + "'>CODE POSTAL</td>" +
            "<td style='" + nmlHeight + textcenter + bold + "'>VILLE</td>" +
            "<td style='" + nmlHeight + textcenter + bold + "'>PAYS</td>" +
            "<td style='" + nmlHeight + textcenter + bold + "'>TÉLÉPHONE 1</td>" +
            "<td style='" + nmlHeight + textcenter + bold + "'>TÉLÉPHONE 2</td>" +
            "<td style='" + nmlHeight + textcenter + bold + "'>FAX</td>" +
            "<td style='" + nmlHeight + textcenter + bold + "'>MOBILE</td>" +
            "<td style='" + nmlHeight + textcenter + bold + "'>EMAIL</td>" +
            "<td style='" + nmlHeight + textcenter + bold + "'>EST-CE <span style='color:red;'>L'ADRESSE DE LIVRAISON</span>? SI OUI, ÉCRIVEZ 1, SI NON, ÉCRIVEZ 0</td>" +
            "<td style='" + nmlHeight + textcenter + bold + "'>EST-CE <span style='color:red;'>L'ADRESSE DE FACTURATION</span>? SI OUI, ÉCRIVEZ 1, SI NON, ÉCRIVEZ 0</td>" +
            "<td style='" + nmlHeight + textcenter + bold + "'>COMMENTAIRE</td>";

        var propNullableline = "<td style='" + nmlHeightRed + "'>Mandatory/Obligatoire: YES</td>" +
            "<td style='" + nmlHeightRed + "'>Mandatory/Obligatoire: YES</td>" +
            "<td style='" + nmlHeightRed + "'>Mandatory/Obligatoire: YES</td>" +
            "<td style='vertical-align:middle;'>Mandatory/Obligatoire: NO</td>" +
            "<td style='vertical-align:middle;'>Mandatory/Obligatoire: NO</td>" +
            "<td style='vertical-align:middle;'>Mandatory/Obligatoire: NO</td>" +
            "<td style='vertical-align:middle;'>Mandatory/Obligatoire: NO</td>" +
            "<td style='vertical-align:middle;'>Mandatory/Obligatoire: NO</td>" +
            "<td style='vertical-align:middle;'>Mandatory/Obligatoire: NO</td>" +
            "<td style='vertical-align:middle;'>Mandatory/Obligatoire: NO</td>" +
            "<td style='vertical-align:middle;'>Mandatory/Obligatoire: NO</td>" +
            "<td style='vertical-align:middle;'>Mandatory/Obligatoire: NO</td>" +
            "<td style='vertical-align:middle;'>Mandatory/Obligatoire: NO</td>" +
            "<td style='vertical-align:middle;'>Mandatory/Obligatoire: NO</td>" +
            "<td style='vertical-align:middle;'>Mandatory/Obligatoire: NO</td>" +
            "<td style='vertical-align:middle;'>Mandatory/Obligatoire: NO</td>";

        tab_text += "<tr>" + propnameline + "</tr>";
        //tab_text += "<tr>" + proptypeline + "</tr>";
        tab_text += "<tr>" + propNullableline + "</tr>";
        //tab_text += "<tr>" + propGuidLine + "</tr>";

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
        download.download = "Contact Client 批量插入模板 Modèles insérés en masse" + datetime + ".xls";
        var event = document.createEvent("MouseEvents");
        event.initMouseEvent(
            "click", true, false, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null
        );
        download.dispatchEvent(event);
    } catch (e) {

    }
    HidePleaseWait();
}

function AddProductParLots() {
    var startBox = "<div class='box'><div class='box-body'>";
    var endBox = "</div></div>";

    //console.log(jsondata);

    var onelineContent =
        // start box
        "<div class='form-group' id='div_one_line'>" +
        "<div class='row'>" +
        "<div class='col-md-12'>" +
        "<div class='box-body'>" +
        "<div class='form-horizontal'>" +
        "<div class='form-group'><label class='col-sm-12' style='text-align:center'>Attention! Vous êtes entrain d'ajouter des contact au client <span style='color:red;'>«" + clientInPage.CompanyName + "» </span>" +
        "<br/>Veuillez coller les contenues d'excel en bas" +
        "<br/>请将Excel表格内容复制到下面<button type='button' class='btn btn btn-inverse' title='Cliquez sur cette icône pour télécharger le modèle Excel 点击该图标下载Excel模板' onclick='return downloadbulkfile()'><i class='fa fa-file-text-o'></i></button></label></div>" +
        "<div class='form-group'>" +
        "<div class='col-sm-12'><textarea row='8' id='PrdExpressContent' class='form-control' style='height:400px'></textarea></div>" +
        "</div>" +
        // close box
        "</div></div></div></div></div>";

    var btnAddUpdate = "<button class='btn btn-inverse' id='btn_add_pit_lot' name='btn_add_sols'  onclick='return CreateCcoFromExcel(this)'><span>IMPORTER DES CONTACTS</span></button>";
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

function CreateCcoFromExcel() {
    ShowPleaseWait();
    //var prdId = getUrlVars()['prdId'];
    //var ptyId = $('#PtyId').find('option:selected').attr('data-value') * 1;
    var content = $('#PrdExpressContent').val();
    if (!IsNullOrEmpty(content)) {
        var pitLines = content.split('\n');
        var alllinecout = pitLines.length;
        if (alllinecout !== 0) {
            var checkfiledcount = pitLines[0].split('\t').length;
            if (checkfiledcount !== 16) {
                HidePleaseWait();
                alert('Format error, les informations ne correspondent pas !<br/>信息不符 ！');
            } else {
                treatCcoByLotAndInsert(pitLines);
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


function treatCcoByLotAndInsert(pitLines) {
    var coo2Insert = [];
    var lineCount = pitLines.length;
    var cliId = getParameterByName('cliId');
    for (var j = 0; j < lineCount; j++) {
        var oneCco = {};
        var onepitline = pitLines[j];
        var pitprops = onepitline.split('\t');
        var pitpropsLen = pitprops.length;
        if (pitpropsLen == 16) {
            oneCco.FCliId = cliId;
            oneCco.CivId = 1;
            oneCco.CcoAdresseTitle = pitprops[0];
            oneCco.CcoFirstname = pitprops[1];
            oneCco.CcoLastname = pitprops[2];
            oneCco.CcoAddress1 = pitprops[3];
            oneCco.CcoAddress2 = pitprops[4];
            oneCco.CcoPostcode = pitprops[5];
            oneCco.CcoCity = pitprops[6];
            oneCco.CcoCountry = pitprops[7];
            oneCco.CcoTel1 = pitprops[8];
            oneCco.CcoTel2 = pitprops[9];
            oneCco.CcoFax = pitprops[10];
            oneCco.CcoCellphone = pitprops[11];
            oneCco.CcoEmail = pitprops[12];
            oneCco.CmuId = null;
            var livraison = false;
            var facturation = false;
            // check livraison
            if ($.isNumeric(pitprops[13])) {
                var livnb = pitprops[13] * 1;
                livraison = livnb >= 1;
            }
            // check facturation
            if ($.isNumeric(pitprops[14])) {
                var facnb = pitprops[14] * 1;
                facturation = facnb >= 1;
            }
            oneCco.CcoIsDeliveryAdr = livraison;
            oneCco.CcoIsInvoicingAdr = facturation;
            oneCco.CcoComment = pitprops[15];

            if (!IsNullOrEmpty(oneCco.CcoAdresseTitle) && !IsNullOrEmpty(oneCco.CcoFirstname) && !IsNullOrEmpty(oneCco.CcoLastname)) {
                coo2Insert.push(oneCco);
            }
        }
    }
    if (coo2Insert.length > 0) {
        var jsondata = JSON.stringify({ CcoList: coo2Insert });
        var url = window.webservicePath + "/CreateCcoFromExcel";
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
                        js_LoadContactClientsByCliId(true);
                        HidePleaseWait();
                    } else {
                        HidePleaseWait();
                        alert('Veuillez contacter l\'administrateur, 请联系管理员 \r\n Error code: CCO INSERT');
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

        //console.log(coo2Insert);

    } else {
        HidePleaseWait();
        alert('Erreur de traitement du format !<br/>格式处理出错！');
    }
    //HidePleaseWait();
}

function loadclientdelegatorlist(bugId, typeId) {
    var ctyId = clientInPage.CtyId;
    //var type = ctyId == 3 ? 2 : 1; // 1 client; 2 delegator
    var isDelegator = !jQuery.isEmptyObject(searchFieldValueInArray(clientInPage.ClientTypes, 'Key2', 3));
    var type = typeId > 0 ? typeId : isDelegator ? 2 : 1;
    var cliId = clientInPage.FId;
    var delegatorId = 0;
    var jsondata = JSON.stringify({ cliId: cliId, delegatorId: delegatorId });
    var funcname = type == 1 ? '/SearchDelegatorOfClient' : '/SearchClientsOfDelegator';
    $.ajax({
        url: window.webservicePath + funcname,
        type: 'POST',
        contentType: 'application/json; charset=utf-8',
        data: jsondata,
        dataType: 'json',
        success: function (data) {
            var jsdata = data.d;
            var data2Treat = jQuery.parseJSON(jsdata);
            setclientdelegList(data2Treat, type, bugId);
            //console.log(data2Treat);
        },
        error: function (data) {
        }
    });
}

function setclientdelegList(data2Treat, type, bugId) {
    var tablecontent = "<table cellpadding='0' cellspacing='0' border='0' class='table table-striped table-bordered table-hover' >";
    var th = "<tr role='row'>" +
        "<th rowspan='1' colspan='1' class='smallText'>" + (type == 1 ? "Délégataire" : "Client") + "</th>" +
        "<th rowspan='1' colspan='1' class='smallText'>Email</th>";
    var header = "<thead>" + th + "</thead>";
    var footer = "<tfoot>" + th + "</tfoot>";
    var content = "";
    var linecount = 1;
    $.each(data2Treat, function (name, value) {
        var lineclass = (linecount % 2 === 1) ? "odd" : "even";
        var oneline = "<tr class='" + lineclass + "'>" +
            "<td class='label_left smallTextVt' style='cursor: pointer;font-weight: bolder;' onclick='viewclient(\"" + value.KeyStr1 + "\")'  cliFId='" + value.KeyStr1 + "' cliId='" + value.Key + "' >" + (IsNullOrEmpty(value.Value2) ? value.Value : ("[" + value.Value2 + "] " + value.Value)) + "</td>" +
            "<td class='label_left smallTextVt' style='cursor: pointer;' cliFId='" + value.KeyStr1 + "' cliId='" + value.Key + "' >" + value.Value3 + "</td>" +
            "</tr>";
        content += oneline;
        linecount++;
    });
    tablecontent += header + content + footer + "</table>";
    //$('#div_cli_deleg').empty();
    //$('#div_cli_deleg').append(tablecontent);
    var bugetId = bugId === 1 ? "div_cli_deleg2" : "div_cli_deleg";
    $('#' + bugetId).empty();
    $('#' + bugetId).append(tablecontent);
}

function viewclient(fId) {
    ShowPleaseWait();
    var url = 'Client.aspx?cliId=' + fId + "&mode=view";
    //window.location.href = url;
    var win = window.open(url, '_blank');
    win.focus();
    HidePleaseWait();
    return false;
}


function updateclientdelegatorclick(typeId, bugId) {
    var ctyId = clientInPage.CtyId;
    //var type = ctyId == 3 ? 2 : 1; // 1 client; 2 delegator
    var isDelegator = !jQuery.isEmptyObject(searchFieldValueInArray(clientInPage.ClientTypes, 'Key2', 3));
    var type = typeId > 0 ? typeId : isDelegator ? 2 : 1;
    var cliId = clientInPage.Id;
    var jsondata = JSON.stringify({ cliId: cliId, type: type });
    var funcname = '/GetAllClientsDelegator';
    $.ajax({
        url: window.webservicePath + funcname,
        type: 'POST',
        contentType: 'application/json; charset=utf-8',
        data: jsondata,
        dataType: 'json',
        success: function (data) {
            var jsdata = data.d;
            var data2Treat = jQuery.parseJSON(jsdata);
            //console.log(data2Treat);
            //var bugetId = bugId === 1 ? "div_cli_deleg2" : "div_cli_deleg";
            updatepPopup(data2Treat, typeId, bugId);
        },
        error: function (data) {
        }
    });
    return false;
}

function updatepPopup(client, typeId, bugId) {
    var ctyId = clientInPage.CtyId;
    //var type = ctyId == 3 ? 2 : 1; // 1 client page; 2 delegator page
    var isDelegator = !jQuery.isEmptyObject(searchFieldValueInArray(clientInPage.ClientTypes, 'Key2', 3));
    var type = typeId > 0 ? typeId : (isDelegator ? 2 : 1);
    var startBox = "<div class='box'><div class='box-body' style='max-height: 800px; overflow-y: auto; overflow-x:auto;'>";
    var content = "" +
        "<table cellpadding='0' cellspacing='0' border='0' class='table table-striped table-bordered table-hover'>";
    var th = "<th rowspan='1' colspan='1' class='smallText' style='background-color:#D8DDFF;'></th>" +
        "<th rowspan='1' colspan='1' class='smallText'>" + (type == 1 ? "Délégataire" : "Client") + "</th>" +
        "<th rowspan='1' colspan='1' class='smallText'>Email</th>";
    th += th;
    //th += th;
    th += th;
    var header = "<thead><tr role='row'>" + th + "</tr></thead>";
    content += header;
    var footer = "<tfoot><tr role='row'>" + th + "</tr></tfoot>";
    var linecount = 1;
    $.each(client, function (name, value) {
        var newline = linecount % 4;
        var lineclass = (newline === 1) ? "odd" : "even";
        content += (newline == 1 ? "<tr class='" + lineclass + "'>" : "");
        //content += "<div class='col-sm-3'>";
        content += "<td><input type='checkbox' class='form-control' id='ip_cli_deleg_" + value.Key + "' clidelegId='" + value.KeyStr1 + "' onclick='clientdelegatorselectClick(this, " + typeId + "," + bugId + ");' " + (value.Actived ? "checked" : "") + "/></td>";
        content += "<td><label class='control-label'>" + (IsNullOrEmpty(value.Value2) ? value.Value : ("[" + value.Value2 + "] " + value.Value)) + "</label></td>";
        content += "<td><label class='control-label'>" + value.Value3 + "</label></td>";
        //content += "</div>";
        //content += (newline === 1 ? "</tr>" : "");
        linecount++;
    });
    content += footer;
    content += "</table>";
    //content += "</div>";
    var btnClose = "<button class='btn btn-default bootbox-close-button' onclick='return false'><span>Clôturer</span></button>";
    var btns = "<div class='modal-body center'>" + btnClose + "</div>";
    var endBox = "</div>" + btns + "</div>";
    var allcontent = startBox + content + endBox;

    var title = 'Mettre à jour les ' + (type == 1 ? "délégataires" : "clients");
    bootbox.dialog({
        title: title,
        message: allcontent
    }).find('.modal-dialog').css({
        'width': '75%',
        'left': '-12%'
    }).find('.modal-content').css({
        'margin-top': function () {
            var w = $(window).height();
            var b = $(".modal-dialog").height();
            // should not be (w-h)/2
            var h = (w - b) * 0.01;
            return h + "px";
        }
    }).find('.modal-header').css({
        'background': 'url(../../img/menu_005_bg.jpg) repeat-x',
        'text-align': 'center',
        'color': '#C0C0C0'
    });
}

function clientdelegatorselectClick(sender, typeId, bugId) {
    var cliId = "";
    var delegId = "";
    //var bugId = "div_cli_deleg";
    var ctyId = clientInPage.CtyId;
    //var type = ctyId == 3 ? 2 : 1; // 1 client page; 2 delegator page
    var isDelegator = !jQuery.isEmptyObject(searchFieldValueInArray(clientInPage.ClientTypes, 'Key2', 3));
    //var type = isDelegator ? 2 : 1;
    var type = typeId > 0 ? typeId : (isDelegator ? 2 : 1);
    if (type == 1) {
        cliId = getParameterByName('cliId');
        delegId = $(sender).attr('clidelegId');
    }
    else {
        cliId = $(sender).attr('clidelegId');
        delegId = getParameterByName('cliId');
    }
    var jsondata = JSON.stringify({ cliId: cliId, delgId: delegId, type: type });
    var funcname = '/RelateDeleteClientDelegator';
    $.ajax({
        url: window.webservicePath + funcname,
        type: 'POST',
        contentType: 'application/json; charset=utf-8',
        data: jsondata,
        dataType: 'json',
        success: function (data) {
            var jsdata = data.d;
            var data2Treat = jQuery.parseJSON(jsdata);
            //var bugetId = bugId === 1 ? "div_cli_deleg2" : "div_cli_deleg";
            setclientdelegList(data2Treat, type, bugId);
        },
        error: function (data) {
        }
    });
}