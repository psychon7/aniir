var supplierInPage = Object;
var civilityList = [];

$(document).ready(initFunc);


document.onkeydown = function (e) {
    var keyCode = e.keyCode || e.which || e.charCode;
    var ctrlKey = e.ctrlKey || e.metaKey;
    // ctrl + Y
    if (ctrlKey && keyCode === 89) {
        //alert('save');
        if (_isView) {
            var supId = getUrlVars()['supId'];
            var height = $(window).height();
            var width = $(window).width();
            width = width * 0.8;
            width = width.toFixed(0);
            var supname = $('#CompanyName').val();
            var url = '../Supplier/SupplierPrice.aspx?supId=' + supId + '&supname=' + supname;
            window.open(url, 'popupWindow', 'height=' + height + ', width=' + width + ', top=0, left=0, toolbar=no, menubar=no, scrollbars=no, resizable=no,location=no, status=no');
        }
        e.preventDefault();
    }
}


function initFunc() {
    js_getAllCurrency('CurId');
    js_getAllTVA('VatId');
    js_GetPaymentCondition('PcoId');
    js_GetPaymentMode('PmoId');
    js_GetSupplierType('StyId');
    js_LoadSupplierById();

    $.each($('.datepicker'), function (idx, value) {
        $(value).datepicker();
    });
    initMode();
    if (_isCreate) {
        $('#DateCreation').val(getToday());
    }
    js_GetCivility(0, 'civilityList');
    js_LoadContactSuppliersByCliId(true);
    loadAllBankInfo();

    SetLanguageBar();
}

function js_CheckSupplierExisted(sender) {
    var url = window.webservicePath + "/CheckSupplierExisted";
    var CompanyName = $(sender).val();
    var supId = getParameterByName('supId');
    $.ajax({
        type: "POST",
        url: url,
        contentType: "application/json; charset=utf-8",
        data: "{companyName:'" + CompanyName + "',supId:'" + supId + "'}",
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

function js_CheckSupplierExisted_for_create_update(companyId) {
    var url = window.webservicePath + "/CheckSupplierExisted";
    var CompanyName = $('#' + companyId).val();
    var supId = getParameterByName('supId');
    $.ajax({
        type: "POST",
        url: url,
        contentType: "application/json; charset=utf-8",
        data: "{companyName:'" + CompanyName + "',supId:'" + supId + "'}",
        dataType: "json",
        success: function (data) {
            var jsdata = data.d;
            if (jsdata === 1) {
                $("#div_CompanyName").addClass('has-error');
                alert('Raison social est déjà existé!');
                $(sender).focus();
            } else {
                $("#div_CompanyName").removeClass('has-error');
                js_CreateUpdateSupplier();
            }
        },
        error: function (data) {
            var test = '';
        }
    });
}

function js_CreateUpdateSupplier() {
    var validated = true;
    validated = validated && $('#CompanyName')[0].checkValidity();
    if (!validated) {
        $('#CompanyName').addClass('error_border');
        $('#CompanyName').focus();
    } else {
        $('#CompanyName').removeClass('error_border');
    }
    var aSupplier = Object();
    aSupplier.FId = getParameterByName('supId');
    aSupplier.CompanyName = $('#CompanyName').val();
    aSupplier.VatId = $('#VatId').val();
    aSupplier.PcoId = $('#PcoId').val();
    aSupplier.PmoId = $('#PmoId').val();
    aSupplier.ActId = $('#ActId').val();
    aSupplier.Siren = $('#Siren').val();
    aSupplier.Siret = $('#Siret').val();
    aSupplier.VatIntra = $('#VatIntra').val();
    aSupplier.CtyId = $('#CtyId').val();
    aSupplier.CurId = $('#CurId').val();
    aSupplier.Isactive = $('#Isactive')[0].checked;
    aSupplier.Isblocked = $('#Isblocked')[0].checked;
    aSupplier.Address1 = $('#Address1').val();
    aSupplier.Address2 = $('#Address2').val();
    aSupplier.Postcode = $('#Postcode').val();
    aSupplier.City = $('#ip_City').val();
    aSupplier.Country = $('#Country').val();
    aSupplier.FreeOfHarbor = $('#FreeOfHarbor').val();
    aSupplier.Tel1 = $('#Tel1').val();
    aSupplier.Tel2 = $('#Tel2').val();
    aSupplier.Fax = $('#Fax').val();
    aSupplier.Cellphone = $('#Cellphone').val();
    aSupplier.Email = $('#Email').val();
    aSupplier.RecieveNewsletter = $('#RecieveNewsletter')[0].checked;
    aSupplier.NewsletterEmail = $('#NewsletterEmail').val();
    aSupplier.Comment4Interne = $('#Comment4Interne').val();
    aSupplier.Comment4Supplier = $('#Comment4Supplier').val();
    aSupplier.VatIntra = $('#VatIntra').val();
    aSupplier.StyId = $('#StyId').val();
    aSupplier.Abbreviation = $('#Abbreviation').val();
    aSupplier.DateCreation = getCreationDate($('#DateCreation').val());
    aSupplier.SupLogin = $('#SupLogin').val().trim();

    //alert(validated);
    if (validated) {
        var jsondata = JSON.stringify({ oneSupplier: aSupplier });
        //setloadingmaskmessage('Veuillez patienter ...');
        myApp.showPleaseWait();
        $.ajax({
            url: 'Supplier.aspx/CreateUpdateSupplier',
            type: 'POST',
            contentType: 'application/json; charset=utf-8',
            data: jsondata,
            dataType: 'json',
            success: function (data) {
                var supplierId = data.d;
                var url = window.location.href.split('?')[0];
                var newUrl = url + '?supId=' + supplierId + '&mode=view';
                document.location.href = newUrl;
            },
            error: function (data) {
                myApp.hidePleaseWait();
            }
        });
    }
    return false;
}

function js_LoadSupplierById() {
    //var supId = getUrlVars()['supId'];
    var supId = getParameterByName('supId');
    if (supId) {
        var url = window.webservicePath + "/LoadSupplierById";
        $.ajax({
            type: "POST",
            url: url,
            contentType: "application/json; charset=utf-8",
            data: "{supId:'" + supId + "'}",
            dataType: "json",
            success: function (data) {
                var jsdata = data.d;
                var jsondata = jQuery.parseJSON(jsdata);
                if (jsondata !== -1) {
                    supplierInPage = Object;
                    supplierInPage = jsondata;
                    $.each(jsondata, function (name, value) {
                        var newname = name;
                        if (name === 'City') {
                            //$('#ip_City').val(value);
                            newname = 'ip_City';
                        }
                        setFieldValue(newname, value, true);
                    });
                } else {
                }
            },
            error: function (data) {
                var test = '';
            }
        });
    }
}

function display_contact_supplier(scoId) {
    if (scoId === 0) {
        var oneSco = Object;
        oneSco.ScoAddress1 = supplierInPage.Address1;
        oneSco.ScoAddress2 = supplierInPage.Address2;
        oneSco.ScoPostcode = supplierInPage.Postcode;
        oneSco.ScoCity = supplierInPage.City;
        oneSco.ScoCountry = supplierInPage.Country;
        oneSco.ScoTel1 = supplierInPage.Tel1;
        oneSco.ScoTel2 = supplierInPage.Tel2;
        oneSco.ScoFax = supplierInPage.Fax;
        oneSco.ScoCellphone = supplierInPage.Cellphone;
        oneSco.ScoEmail = supplierInPage.Email;
        oneSco.ScoRecieveNewsletter = supplierInPage.RecieveNewsletter;
        oneSco.ScoNewsletterEmail = supplierInPage.NewsletterEmail;
        FillContactSupplier(oneSco, 'forUCcreate');
    } else {
    }

    return false;
}

function FillContactSupplier(contactSupplier, ucmode) {
    var content = "<div class='box'><div class='box-body'><div class='form-horizontal'>" +
        "<div class='form-group'><label id='ScoId' name='ScoId' style='display:none;'></label><label id='FScoId' name='FScoId' style='display:none;'></label><label class='col-sm-2 control-label language_txt'>Titre d\'adresse</label><div class='col-sm-4'><input class='form-control' id='ScoAdresseTitle' name='ScoAdresseTitle' type='text' placeholder='Titre'></div>" +
        "<label class='col-sm-2 control-label language_txt'>Référence</label><div class='col-sm-4'><input class='form-control' id='ScoRef' name='ScoRef' type='text' placeholder='Référence' disabled=''></div></div>" +
        "<div class='form-group'><label class='col-sm-2 control-label language_txt'>Prénom</label><div class='col-sm-4'><input class='form-control' id='ScoFirstname' name='ScoFirstname' type='text' placeholder='Prénom' required='' maxlength='200'></div>" +
        "<label class='col-sm-2 control-label language_txt'>Nom de famille</label><div class='col-sm-4'><input class='form-control' id='ScoLastname' name='ScoLastname' type='text' placeholder='Nom de famille' maxlength='200'></div></div>" +
        "<div class='form-group'><label class='col-sm-2 control-label language_txt'>Civilité</label><div class='col-sm-4'><select class='form-control' id='CivId' name='CivId'></select></div>" +
        "<label class='col-sm-2 control-label language_txt'>Adresse 1</label><div class='col-sm-4'><input class='form-control' id='ScoAddress1' name='ScoAddress1' type='text' placeholder='Adresse 1'></div></div>" +
        "<div class='form-group'><label class='col-sm-2 control-label language_txt'>Adresse 2</label><div class='col-sm-4'><input class='form-control' id='ScoAddress2' name='ScoAddress2' type='text' placeholder='Adresse 2'></div>" +
        "<label class='col-sm-2 control-label language_txt'>Code postal</label><div class='col-sm-4'><input class='form-control' id='ScoPostcode' name='ScoPostcode' type='text' placeholder='Code postal'  onkeyup='getCommuneName(this,\"ScoCity\")' maxlength='10'></div></div>" +
        "<div class='form-group'><label class='col-sm-2 control-label language_txt'>Ville</label><div class='col-sm-4'><input type='text' class='form-control' list='ScoCity' id='ip_ScoCity' placeholder='Ville'oninput='communeChange(\"ip_ScoCity\",\"ScoCity\",\"ScoPostcode\")' maxlength='200'><datalist id='ScoCity'></datalist></div>" +
        "<label class='col-sm-2 control-label language_txt'>Pays</label><div class='col-sm-4'><input class='form-control' id='ScoCountry' name='ScoCountry' type='text' placeholder='Pays'></div></div>" +
        "<div class='form-group'><label class='col-sm-2 control-label language_txt'>Téléphone 1</label><div class='col-sm-4'><input class='form-control' id='ScoTel1' name='ScoTel1' type='text' placeholder='Téléphone 1'></div>" +
        "<label class='col-sm-2 control-label language_txt'>Téléphone 2</label><div class='col-sm-4'><input class='form-control' id='ScoTel2' name='ScoTel2' type='text' placeholder='Téléphone 2'></div></div>" +
        "<div class='form-group'><label class='col-sm-2 control-label language_txt'>Fax</label><div class='col-sm-4'><input class='form-control' id='ScoFax' name='ScoFax' type='text' placeholder='ScoFax'></div>" +
        "<label class='col-sm-2 control-label language_txt'>Portable</label><div class='col-sm-4'><input class='form-control' id='ScoCellphone' name='ScoCellphone' type='text' placeholder='Portable'></div></div>" +
        "<div class='form-group'><label class='col-sm-2 control-label language_txt'>Email</label><div class='col-sm-4'><div class='input-group'><span class='input-group-addon'>@</span><input type='email' id='ScoEmail' name='ScoEmail' class='form-control' placeholder='Email'maxlength='100'></div></div>" +
        "<label class='col-sm-2 control-label language_txt'>Recevoir le Newsletter</label>" +
        "<div class='col-sm-4'><div class='row'><div class='col-sm-2'><div class='checker' style='text-align: center;'><span class=''><input type='checkbox' id='ScoRecieveNewsletter' name='ScoRecieveNewsletter' class='uniform'value=''></span></div></div>" +
        "<div class='col-sm-10'><div class='input-group'><span class='input-group-addon'>@</span><input type='email' id='ScoNewsletterEmail' name='ScoNewsletterEmail' class='form-control'placeholder='Newsletter Email' maxlength='20'></div></div></div></div></div>" +
        "<div class='form-group'><label class='col-md-2 control-label language_txt'>Commentaire</label><div class='col-md-10'><textarea rows='3' cols='5' name='ScoComment' class='form-control' id='ScoComment'></textarea></div></div>" +
        "<div class='modal-footer center forUCcreate'><button type='button' class='btn btn-default language_txt' onclick='closeDialog()'>Annuler</button><button type='button' class='btn btn-inverse language_txt' onclick='return js_InsertUpdateContactSupplier();'>Sauvegarder</button></div>" +
        "<div class='modal-footer center forUCview'><button type='button' class='btn btn-default language_txt' onclick='closeDialog()'>Annuler</button><button type='button' class='btn btn-inverse language_txt' >Modifier</button></div>" +
        "<div class='modal-footer center forUCupdate'><button type='button' class='btn btn-default language_txt' >Annuler</button><button type='button' class='btn btn-inverse language_txt' onclick='return js_InsertUpdateContactSupplier();'>Mettre à jours</button><button type='button' class='btn btn-inverse' onclick='return confirmerDeleteSco()'>Supprimer</button></div></div></div></div>";

    var title = ucmode === '<span class="language_txt">forUCcreate</span>' ? '<span class="language_txt">Créer un contact</span>' : '<span class="language_txt">Détail du contact</span>';
    contact_supplier_dialog(title, content, contactSupplier, ucmode);

    SetLanguageBar();
}

function contact_supplier_dialog(title, content, contactSupplier, ucmode) {
    bootbox.dialog({
        title: title,
        message: content
    }).find('.modal-dialog').css({
        'width': '60%'
    }).find('.modal-header').css({
        //'background-color': '#a696ce',
        'background': 'url(../../img/menu_005_bg.jpg) repeat-x',
        'text-align': 'center',
        'color': '#C0C0C0'
    });


    js_FillElement('CivId', civilityList);


    $.each(contactSupplier, function (name, value) {
        //console.info(order);   
        var newname = name;
        if (name === 'ScoCity') {
            //$('#ip_City').val(value);
            newname = 'ip_ScoCity';
        }
        setFieldValue(newname, value, true, false);
    });

    $('.' + ucmode).show();

    return false;
}

function closeDialog() {
    $(".bootbox").modal("hide");
}

function js_InsertUpdateContactSupplier() {
    var validated = true;
    if (validated) {
        var aContactSupplier = Object();
        aContactSupplier.FScoId = $('#FScoId').val();
        aContactSupplier.FSupId = getUrlVars()['supId'];
        aContactSupplier.ScoFirstname = $('#ScoFirstname').val();
        aContactSupplier.ScoLastname = $('#ScoLastname').val();
        aContactSupplier.CivId = $('#CivId').val();
        aContactSupplier.ScoRef = $('#ScoRef').val();
        aContactSupplier.ScoAdresseTitle = $('#ScoAdresseTitle').val();
        aContactSupplier.ScoAddress1 = $('#ScoAddress1').val();
        aContactSupplier.ScoAddress2 = $('#ScoAddress2').val();
        aContactSupplier.ScoPostcode = $('#ScoPostcode').val();
        aContactSupplier.ScoCity = $('#ip_ScoCity').val();
        aContactSupplier.ScoCountry = $('#ScoCountry').val();
        aContactSupplier.ScoTel1 = $('#ScoTel1').val();
        aContactSupplier.ScoTel2 = $('#ScoTel2').val();
        aContactSupplier.ScoFax = $('#ScoFax').val();
        aContactSupplier.ScoCellphone = $('#ScoCellphone').val();
        aContactSupplier.ScoEmail = $('#ScoEmail').val();
        aContactSupplier.ScoRecieveNewsletter = $('#ScoRecieveNewsletter')[0].checked;
        aContactSupplier.ScoNewsletterEmail = $('#ScoNewsletterEmail').val();
        aContactSupplier.ScoComment = $('#ScoComment').val();

        var jsondata = JSON.stringify({ oneContactSupplier: aContactSupplier });
        //setloadingmaskmessage('Veuillez patienter ...');
        myApp.showPleaseWait();
        $.ajax({
            url: 'Supplier.aspx/CreateUpdateContactSupplier',
            type: 'POST',
            contentType: 'application/json; charset=utf-8',
            data: jsondata,
            dataType: 'json',
            success: function (data) {
                $('#datatable_contact_supplier').dataTable().fnClearTable();
                js_LoadContactSuppliersByCliId(true);
                //window.location.reload(false); 

                myApp.hidePleaseWait();
            },
            error: function (data) {
            }
        });
    }
    return false;
}

var contactSuppliers = [];

function js_LoadContactSuppliersByCliId(reloadAll) {
    var supId = getParameterByName('supId');
    var url = window.webservicePath + "/LoadSupplierContactBySupId";
    var budgetId = '#tbody_contact_supplier';
    if (supId) {
        $.ajax({
            type: "POST",
            url: url,
            contentType: "application/json; charset=utf-8",
            data: "{supId:'" + supId + "'}",
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
                            contactSuppliers = [];
                            contactSuppliers = data2Treat;
                            $.each(data2Treat, function (name, value) {
                                $('#datatable_contact_supplier').dataTable().fnAddData([
                                    "<span  onclick='viewContactSupplier(\"" + value.FScoId + "\")' style='cursor:pointer'>" + value.ScoAdresseTitle + "</span>",
                                    "<span  onclick='viewContactSupplier(\"" + value.FScoId + "\")' style='cursor:pointer'>" + value.ScoRef + "</span>",
                                    "<span  onclick='viewContactSupplier(\"" + value.FScoId + "\")' style='cursor:pointer'>" + value.ScoFirstname + " " + value.ScoLastname + "</span>",
                                    "<span  onclick='viewContactSupplier(\"" + value.FScoId + "\")' style='cursor:pointer'>" + value.ScoTel1 + "/" + value.ScoFax + "</span>",
                                    "<span  onclick='viewContactSupplier(\"" + value.FScoId + "\")' style='cursor:pointer'>" + value.ScoCellphone + "</span>",
                                    "<span  onclick='viewContactSupplier(\"" + value.FScoId + "\")' style='cursor:pointer'>" + value.ScoAddress1 + "</span>",
                                    "<span  onclick='viewContactSupplier(\"" + value.FScoId + "\")' style='cursor:pointer'>" + value.ScoPostcode + "</span>",
                                    "<span  onclick='viewContactSupplier(\"" + value.FScoId + "\")' style='cursor:pointer'>" + value.ScoCity + "</span>",
                                    "<span  onclick='viewContactSupplier(\"" + value.FScoId + "\")' style='cursor:pointer'>" + value.ScoEmail + "</span>"
                                ]);


                            });
                            //$(budgetId).append(content);


                            if (reloadAll) {
                                try {
                                    $('#datatable_contact_supplier').dataTable({
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

function viewContactSupplier(fscoId) {
    //alert(fscoId);
    var onecco = searchFieldValueInArray(contactSuppliers, 'FScoId', fscoId);
    FillContactSupplier(onecco, 'forUCupdate');
    //alert(onecco.ScoFirstname);
}

function confirmerDeleteSco() {
    var scoId = $('#ScoId').val();
    if (scoId) {
        var title = "ATTENTION";
        var content = "<div class='box'><div class='box-body' style='height: 100px;'>" +
        "<div class='form-horizontal'>" +
        "<div class='col-md-12'>" +
        "<div class='form-group'>" +
        "<div class='col-sm-12' style='text-align:center;font-size: 18pt;'>Veuillez confirmer la suppression ! " +
        "<br/>La suppression est irrécupérable, veuillez confirmer !!!</div></div></div></div></div></div>"
        + "<div class='modal-footer center'>" +
        "<button type='button' class='btn btn-default' onclick='closeDialog()'>Annuler</button>" +
        "<button type='button' class='btn btn-inverse' scoId='" + scoId + "' onclick='return deleteSco(this);'>SUPPRIMER</button></div>";
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

function deleteSco(sender) {
    var scoId = $(sender).attr('scoId');
    var datastr = '{scoId: ' + scoId + '}';
    var url = window.webservicePath + "/DeleteSupplierContact";
    if (scoId > 0) {
        $.ajax({
            url: url,
            type: 'POST',
            contentType: 'application/json; charset=utf-8',
            data: datastr,
            dataType: 'json',
            success: function (data) {
                var deleted = data.d;
                if (deleted) {
                    $('#datatable_contact_supplier').dataTable().fnClearTable();
                    js_LoadContactSuppliersByCliId(true);
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

function js_GetSupplierType(elementId, objname) {
    var url = window.webservicePath + "/GetSupplierType";
    var budgetId = '#' + elementId;
    GeneralAjax_Select(url, budgetId, objname);
}

var hasSet_bankinfo = false;

var allBankInfo = [];

function loadAllBankInfo() {
    var supId = getUrlVars()['supId'];
    if (supId) {
        var url = window.webservicePath + "/GetBankAccountInfo";
        var datastr = "{type:2,fId:'" + supId + "'}";
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
                    allBankInfo = [];
                    allBankInfo = data2Treat;
                    var itemName = 'bank_info';
                    var db_name = 'db_' + itemName;
                    var th_name = 'th_' + itemName;
                    var tb_name = 'tb_' + itemName;
                    var tf_name = 'tf_' + itemName;
                    var div_name = 'div_' + itemName;

                    var headerFooter = "<tr>" +
                    "<th>Nom de Banque</th>" +
                    "<th>Iban</th>" +
                    "<th>Bic (Swift)</th>" +
                    "<th>Code banque</th>" +
                    "<th>Code agence</th>" +
                    "<th>Numéro de compte</th>" +
                    "<th>Clé RIB</th>" +
                    "<th>Agence de domiciliation</th>" +
                    "</tr>";

                    try {
                        $('#' + db_name).remove();
                        var datatableContent = "<table id='" + db_name + "' cellpadding='0' cellspacing='0' border='0' class='datatable table table-striped table-bordered table-hover'>" +
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
                    if (resultcount > 0) {
                        $('#' + th_name).empty();
                        $('#' + tf_name).empty();

                        $('#' + th_name).append(headerFooter);
                        $('#' + tf_name).append(headerFooter);

                        var titles = new Array();
                        titles.push({ "sTitle": "Nom de Banque" });
                        titles.push({ "sTitle": "Iban" });
                        titles.push({ "sTitle": "Bic" });
                        titles.push({ "sTitle": "Code banque" });
                        titles.push({ "sTitle": "Code agence" });
                        titles.push({ "sTitle": "Numéro de compte" });
                        titles.push({ "sTitle": "Clé RIB" });
                        titles.push({ "sTitle": "Agence de domiciliation" });

                        var displaycount = 1;
                        $.each(data2Treat, function (name, value) {
                            var dataArray = new Array();
                            dataArray.push("<span  onclick='viewCreateBankInfo(\"" + value.FId + "\")' style='cursor:pointer'>" + value.BankName + "</span>");
                            dataArray.push(value.Iban);
                            dataArray.push(value.Bic);
                            dataArray.push(value.RibBankCode);
                            dataArray.push(value.RibAgenceCode);
                            dataArray.push(value.RibAccountNumber);
                            dataArray.push(value.RibKey);
                            dataArray.push(value.AccountOwner);
                            try {
                                $('#' + db_name).dataTable().fnAddData(dataArray);
                            } catch (e) {
                                var test = '';
                            }
                            displaycount++;
                        });

                        if (hasSet_bankinfo) {
                            try {
                                $('#' + db_name).dataTable({
                                    "sPaginationType": "bs_full",
                                    "bDestroy": true,
                                    "bRetrieve": true,
                                    "bServerSide": true,
                                    "bProcessing": true,
                                    "aoColumns": titles
                                });

                            } catch (e) {
                                var testestst = "";
                            }
                        }


                        try {
                            if (!hasSet_bankinfo) {
                                hasSet_bankinfo = true;
                            }
                        } catch (e) {

                        }
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
}

var baclineCount = 0;
function viewCreateBankInfo(FId) {
    var oneInfo = searchFieldValueInArray(allBankInfo, 'FId', FId);
    var BankName = !jQuery.isEmptyObject(oneInfo) ? oneInfo.BankName : '';
    var BankAdr = !jQuery.isEmptyObject(oneInfo) ? oneInfo.BankAdr : '';
    var AccountNumber = !jQuery.isEmptyObject(oneInfo) ? oneInfo.AccountNumber : '';
    var Bic = !jQuery.isEmptyObject(oneInfo) ? oneInfo.Bic : '';
    var Iban = !jQuery.isEmptyObject(oneInfo) ? oneInfo.Iban : '';
    var RibBankCode = !jQuery.isEmptyObject(oneInfo) ? oneInfo.RibBankCode : '';
    var RibAgenceCode = !jQuery.isEmptyObject(oneInfo) ? oneInfo.RibAgenceCode : '';
    var RibAccountNumber = !jQuery.isEmptyObject(oneInfo) ? oneInfo.RibAccountNumber : '';
    var RibKey = !jQuery.isEmptyObject(oneInfo) ? oneInfo.RibKey : '';
    var AccountOwner = !jQuery.isEmptyObject(oneInfo) ? oneInfo.AccountOwner : '';
    var RibAgencyAdr = !jQuery.isEmptyObject(oneInfo) ? oneInfo.RibAgencyAdr : '';

    var create = !jQuery.isEmptyObject(oneInfo) ? false : true;
    var LineId = !jQuery.isEmptyObject(oneInfo) ? oneInfo.Id : baclineCount;
    baclineCount--;

    var disabled = false ? " disabled " : "";
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
            "<label class='col-sm-3 control-label language_txt'>Bank Name</label>" +
            "<div class='col-sm-3'><input type='text' " + disabled + "  value='" + BankName + "' lineId='" + LineId + "'class='form-control' id='BankName_zzz_' name='BankName_zzz_' required /></div>" +
            "<label class='col-sm-3 control-label sale language_txt'>Bank Address</label>" +
            "<div class='col-sm-3 sale'><input class='form-control' " + disabled + "   lineId='" + LineId + "'' id='BankAdr_zzz_' name='BankAdr_zzz_' value='" + BankAdr + "'></div>" +
             "</div>" +
            "<div class='form-group'>" +
            "<label class='col-sm-3 control-label language_txt'>Account Name (Beneficiary Name)</label>" +
            "<div class='col-sm-3'><input class='form-control' id='AccountOwner_zzz_' " + disabled + "  name='AccountOwner_zzz_' value='" + AccountOwner + "' lineId='" + LineId + "' required/></div>" +
            "<label class='col-sm-3 control-label sale language_txt'>Account Number</label>" +
            "<div class='col-sm-3 sale'><input id='AccountNumber_zzz_' name='AccountNumber_zzz_' " + disabled + "  class='form-control' lineId='" + LineId + "' value='" + AccountNumber + "'></div>" +
            "</div>" +
            "<div class='form-group'>" +
            "<label class='col-sm-3 control-label language_txt'>BIC (SWIFT)</label>" +
            "<div class='col-sm-3'><input type='text' " + disabled + "  value='" + Bic + "' lineId='" + LineId + "'class='form-control' id='Bic_zzz_' name='Bic_zzz_' /></div>" +
            "<label class='col-sm-3 control-label language_txt'>IBAN</label>" +
            "<div class='col-sm-3'><input type='text'  class='form-control' lineId='" + LineId + "' id='Iban_zzz_' name='Iban_zzz_' value='" + Iban + "'/></div>" +
            "</div>" +
    //RIB
    "<div class='form-group'>" +
            "<label class='col-sm-12 control-label language_txt' style='text-align:center'>RIB</label>" +
            "</div>" +
            "<div class='form-group '>" +
            "<label class='col-sm-2 control-label language_txt'>Code banque</label>" +
            "<div class='col-sm-2'><input type='text' " + disabled + "  class='form-control' id='RibBankCode_zzz_'  lineId='" + LineId + "' name='RibBankCode_zzz_'  value='" + RibBankCode + "' /></div>" +
            "<label class='col-sm-2 control-label language_txt'>Code agence</label>" +
            "<div class='col-sm-2'><input type='text' " + disabled + "  class='form-control' lineId='" + LineId + "' id='RibAgenceCode_zzz_' name='RibAgenceCode_zzz_' value='" + RibAgenceCode + "' /></div>" +
            "<label class='col-sm-2 control-label language_txt'>Numéro de compte</label>" +
            "<div class='col-sm-2'><input type='text'  " + disabled + "  class='form-control' lineId='" + LineId + "' id='RibAccountNumber_zzz_' name='RibAccountNumber_zzz_' value='" + RibAccountNumber + "' /></div>" +
            "</div>" +
            "<div class='form-group  variant'>" +
            "<label class='col-sm-2 control-label language_txt'>Clé RIB</label>" +
            "<div class='col-sm-2'><input type='text' " + disabled + "  class='form-control' lineId='" + LineId + "' id='RibKey_zzz_' name='RibKey_zzz_' value='" + RibKey + "' /></div>" +
            "<label class='col-sm-2 control-label language_txt'>Agence de domiciliation</label>" +
            "<div class='col-sm-2'><input class='form-control' " + disabled + "   lineId='" + LineId + "'' id='RibAgencyAdr_zzz_' name='RibAgencyAdr_zzz_' value='" + RibAgencyAdr + "'></div>" +
            "</div>" +
    // close box
            "</div></div></div></div></div>";

    var btnAddUpdate = "<button class='btn btn-inverse language_txt' lineId='" + LineId + "' id='btn_add_update_line_zzz_' name='btn_add_update_line_zzz_' onclick='return AddUpdateOneLine(this)'><span>" + (!create ? "Mettre à jour" : "Ajouter") + "</span></button>";
    var btnDelete = "<button class='btn btn-inverse language_txt' lineId='" + LineId + "' id='btn_delete_line_zzz_' name='btn_delete_line_zzz_' onclick='return delete_Line_Confirm(this)'><span>Supprimer</span></button>";
    var btnClose = "<button class='btn btn-default bootbox-close-button language_txt' onclick='return false'><span>Annuler</span></button>";

    var btns = "<div class='modal-body center'>" + btnClose + btnAddUpdate + (create ? "" : btnDelete) + "</div>";
    var onecontent = startBox + onelineContent + btns + endBox;
    onecontent = replaceAll(onecontent, '_zzz_', '_' + LineId);

    var title = !create ? 'Mettre à jour' : 'Ajouter';
    bootbox.dialog({
        title: title,
        message: onecontent
        
}).find('.modal-dialog').css({
        'width': '70%'
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

    SetLanguageBar();
    return false;
}

function AddUpdateOneLine(sender) {
    var lineId = $(sender).attr('lineId');
    var checkOK = CheckRequiredFieldInOneDiv('div_one_line');
    if (checkOK) {
        var bckInfo = {};
        bckInfo.BankName = $('#BankName_' + lineId).val();
        bckInfo.BankAdr = $('#BankAdr_' + lineId).val();
        bckInfo.AccountNumber = $('#AccountNumber_' + lineId).val();
        bckInfo.Bic = $('#Bic_' + lineId).val();
        bckInfo.Iban = $('#Iban_' + lineId).val();
        bckInfo.RibBankCode = $('#RibBankCode_' + lineId).val();
        bckInfo.RibAgenceCode = $('#RibAgenceCode_' + lineId).val();
        bckInfo.RibAccountNumber = $('#RibAccountNumber_' + lineId).val();
        bckInfo.RibKey = $('#RibKey_' + lineId).val();
        bckInfo.AccountOwner = $('#AccountOwner_' + lineId).val();
        bckInfo.RibAgencyAdr = $('#RibAgencyAdr_' + lineId).val();
        bckInfo.FId = lineId;
        bckInfo.TypeId = 2;
        bckInfo.FgFId = getUrlVars()['supId'];

        var url = window.webservicePath + '/CreateUpdateSupplierBankAccount';
        var jsondata = JSON.stringify({ bankAccount: bckInfo });
        $.ajax({
            url: url,
            type: 'POST',
            contentType: 'application/json; charset=utf-8',
            data: jsondata,
            dataType: 'json',
            success: function (data) {
                $('.bootbox-close-button').click();
                loadAllBankInfo();
            },
            error: function (data) {
                alert(data.responseText);
            }
        });
    }
    return false;
}

function delete_Line_Confirm(sender) {
    var lineId = $(sender).attr('lineId');
    var title = "ATTENTION";
    var content = "<div class='box'><div class='box-body' style='height: 100px;'>" +
        "<div class='form-horizontal'>" +
        "<div class='col-md-12'>" +
        "<div class='form-group'>" +
        "<div class='col-sm-12' style='text-align:center;font-size: 18pt;'>Veuillez confirmer la suppression ! " +
        "<br/>La suppression est irrécupérable, veuillez confirmer !!!</div></div></div></div></div></div>"
        + "<div class='modal-footer center'>" +
        "<button type='button' class='btn btn-default' onclick='closeDialog()'>Annuler</button>" +
        "<button type='button' class='btn btn-inverse' lineId='" + lineId + "' onclick='return delete_line(this);'>SUPPRIMER</button></div>";
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

function delete_line(sender) {
    var lineId = $(sender).attr('lineId') * 1;
    var bckInfo = {};
    bckInfo.Id = lineId;
    bckInfo.FgFId = getUrlVars()['supId'];
    var url = window.webservicePath + "/DeleteBankAccount";
    var jsondata = JSON.stringify({ bankAccount: bckInfo });
    $.ajax({
        type: "POST",
        url: url,
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        data: jsondata,
        success: function (data) {
            var jsdata = data.d;
            var data2Treat = jQuery.parseJSON(jsdata);
            if (data2Treat) {
                $('.bootbox-close-button').click();
                loadAllBankInfo();
            } else {
                $('.bootbox-close-button').click();
                alert('Item in use !');
                //AuthencationError();
            }
        },
        error: function (data) {
            var test = '';
        }
    });
}

function DeleteSupplier() {
    var title = "ATTENTION";
    var content = "<div class='box'><div class='box-body' style='height: 100px;'>" +
        "<div class='form-horizontal'>" +
        "<div class='col-md-12'>" +
        "<div class='form-group'>" +
        "<div class='col-sm-12' style='text-align:center;font-size: 18pt;'>Veuillez confirmer la suppression ! " +
        "<br/>La suppression est irrécupérable, veuillez confirmer !!!</div></div></div></div></div></div>"
        + "<div class='modal-footer center'>" +
        "<button type='button' class='btn btn-default' onclick='closeDialog()'>Annuler</button>" +
        "<button type='button' class='btn btn-inverse' onclick='return deleteSupplierClick();'>SUPPRIMER</button></div>";
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

function deleteSupplierClick() {
    var supId = getUrlVars()['supId'];
    var datastr = "{supId: '" + supId + "'}";
    var url = window.webservicePath + "/DeleteSupplier";
    if (supId) {
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
                    window.location = 'SearchSupplier.aspx';
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


function createSupLogin(mode) {
    var supId = getUrlVars()['supId'];
    var supLogin = $('#SupLogin').val();
    if (!IsNullOrEmpty(supLogin) && mode === 0) {
        alert('Login est déjà existé <br/>Login已存在');
    } else {
        var jsondata = JSON.stringify({ supId: supId, mode: mode });
        var url = window.webservicePath + "/CreateGetSupLogin";
        $.ajax({
            type: "POST",
            url: url,
            contentType: "application/json; charset=utf-8",
            data: jsondata,
            dataType: "json",
            success: function(data) {
                var jsdata = data.d;
                var data2Treat = jQuery.parseJSON(jsdata);
                if (data2Treat !== -1) {
                    if (mode == 0) {
                        location.reload(true);
                    } else {
                        alert(data2Treat);
                    }
                } else {
                    // authentication error
                    AuthencationError();
                }
            },
            error: function(data) {
                var test = '';
            }
        });
    }
    return false;
}