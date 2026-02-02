
$(document).ready(initClientApp);

function initClientApp() {
    ShowPleaseWait();
    getClientApply();
    js_getClient();
    js_GetCivility();

    SetLanguageBar();
}


var allcivility = [];
function js_GetCivility() {
    var url = window.webservicePath + "/GetCivility";
    $.ajax({
        type: "POST",
        url: url,
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        success: function (data) {
            var jsdata = data.d;
            var data2Treat = jQuery.parseJSON(jsdata);
            if (data2Treat !== '-1') {
                allcivility = [];
                allcivility = data2Treat;
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


var allclient = [];
function js_getClient() {
    var url = window.webservicePath + "/GetAllClients";
    $.ajax({
        type: "POST",
        url: url,
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        success: function (data) {
            var jsdata = data.d;
            var data2Treat = jQuery.parseJSON(jsdata);
            if (data2Treat !== '-1') {
                allclient = [];
                allclient = data2Treat;
                HidePleaseWait();
            } else {
                // authentication error
                AuthencationError();
            }
        },
        error: function (data) {
            HidePleaseWait();
            var test = '';
        }
    });
}

function getClientApply() {
    try {
        _getClientApply();
    } catch (e) {

    }
}
var hasSet_Client_Apply = false;

var allSiteClient = [];
function _getClientApply() {
    myApp.showPleaseWait();
    var url = window.webservicePath + "/GetClientToActive";
    $.ajax({
        type: "POST",
        url: url,
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        success: function (data) {
            var jsdata = data.d;
            var data2Treat = jQuery.parseJSON(jsdata);
            if (data2Treat !== '-1') {
                allSiteClient = [];
                allSiteClient = data2Treat;
                var itemName = 'client_app';
                var db_name = 'db_' + itemName;
                var th_name = 'th_' + itemName;
                var tb_name = 'tb_' + itemName;
                var tf_name = 'tf_' + itemName;
                var div_name = 'div_' + itemName;
                var result_name = 'result_' + itemName;
                var headerFooter = "<tr>" +
                    "<th class='language_txt'>Raison sociale</th>" +
                    "<th class='language_txt'>Login</th>" +
                    "<th class='language_txt'>Prénom</th>" +
                    "<th class='language_txt'>Nom</th>" +
                    "<th class='language_txt'>Adresse1</th>" +
                    "<th class='language_txt'>CP</th>" +
                    "<th class='language_txt'>Ville</th>" +
                    "<th class='language_txt'>Tél</th>" +
                    "<th class='language_txt'>Portable</th>" +
                    "<th class='language_txt'>Email</th>" +
                    "<th class='language_txt'>Activer</th>" +
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
                $('#' + result_name).text(resultcount);
                if (resultcount > 0) {
                    $('#' + th_name).empty();
                    $('#' + tf_name).empty();

                    $('#' + th_name).append(headerFooter);
                    $('#' + tf_name).append(headerFooter);

                    var titles = new Array();
                    titles.push({ "sTitle": "Client" });
                    titles.push({ "sTitle": "Login" });
                    titles.push({ "sTitle": "Prénom" });
                    titles.push({ "sTitle": "Nom" });
                    titles.push({ "sTitle": "Adresse1" });
                    titles.push({ "sTitle": "CP" });
                    titles.push({ "sTitle": "Ville" });
                    titles.push({ "sTitle": "Tél" });
                    titles.push({ "sTitle": "Portable" });
                    titles.push({ "sTitle": "Email" });
                    titles.push({ "sTitle": "Active" });

                    var displaycount = 1;
                    $.each(data2Treat, function (name, value) {
                        var dataArray = new Array();
                        dataArray.push(value.CompanyName);
                        dataArray.push(value.Login);
                        dataArray.push(value.FirstName);
                        dataArray.push(value.LastName);
                        dataArray.push(value.Address1);
                        dataArray.push(value.Postcode);
                        dataArray.push(value.City);
                        dataArray.push(value.Tel1);
                        dataArray.push(value.Cellphone);
                        dataArray.push(value.Email);
                        var activebtn = value.Isactive ? "Activé" : "<button type='button' class='btn btn-inverse' onclick='return activeclientConfirm(" + value.SclId + ")'>Activer</button>";
                        dataArray.push(activebtn);
                        try {
                            $('#' + db_name).dataTable().fnAddData(dataArray);
                        } catch (e) {
                            var test = '';
                        }
                        displaycount++;
                    });


                    if (hasSet_Client_Apply) {
                        try {
                            $('#' + db_name).dataTable({
                                "sPaginationType": "bs_full",
                                "bDestroy": true,
                                "bRetrieve": true,
                                "bServerSide": true,
                                "bProcesLgsg": true,
                                "aoColumns": titles
                            });

                        } catch (e) {
                            var testestst = "";
                        }
                    }


                    try {
                        if (!hasSet_Client_Apply) {
                            hasSet_Client_Apply = true;
                        }
                    } catch (e) {

                    }
                }
                myApp.hidePleaseWait();

                SetLanguageBar();
            } else {
                // authentication error
                AuthencationError();

                myApp.hidePleaseWait();
            }
        },
        error: function (data) {
            var test = '';
            myApp.hidePleaseWait();
        }
    });
    return false;
}

function activeclientConfirm(sclId) {
    var onescl = searchFieldValueInArray(allSiteClient, 'SclId', sclId * 1);
    if (!jQuery.isEmptyObject(onescl)) {
        setSiteClient(onescl);
    }
    return false;
}


function setSiteClient(onescl) {
    var sclId = onescl.SclId;
    var disabled = '';
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
            "<label class='col-sm-2 control-label' style='color:red;'>Sélectionner un Client</label>" +
            "<div class='col-sm-2'><select class='form-control' id='Client_zzz_' " + disabled + "  name='Client_zzz_' sclid='" + sclId + "' onchange='ClientChange(this)'></select></div>" +
            "<label class='col-sm-2 control-label fieldRequired'>Raison sociale</label>" +
            "<div class='col-sm-2'><input class='form-control' id='CompanyName_zzz_' " + disabled + "  name='CompanyName_zzz_' value='" + onescl.CompanyName + "' sclid='" + sclId + "' required /></div>" +
            "<label class='col-sm-2 control-label sale'>Login</label>" +
            "<div class='col-sm-2'><input id='Login_zzz_' name='Login_zzz_' disabled   class='form-control' value='" + onescl.Login + "' sclid='" + sclId + "' /></div>" +
            "</div>" +
            "<div class='form-group'>" +
            "<label class='col-sm-2 control-label'>Civilité</label>" +
            "<div class='col-sm-2'><select " + disabled + "  class='form-control' sclid='" + sclId + "' id='Civ_zzz_' name='Civ_zzz_' ></select></div>" +
            "<label class='col-sm-2 control-label'>Prénom</label>" +
            "<div class='col-sm-2'><input type='text' class='form-control' " + disabled + "  sclid='" + sclId + "' id='FirstName_zzz_' name='FirstName_zzz_' value='" + onescl.FirstName + "'  required /></div>" +
            "<label class='col-sm-2 control-label'>Nom</label>" +
            "<div class='col-sm-2'><input type='text' " + disabled + "  class='form-control' id='LastName_zzz_'  sclid='" + sclId + "' name='LastName_zzz_' value='" + onescl.LastName + "'  required /></div>" +
            "</div>" +
            "<div class='form-group'>" +
            "<label class='col-sm-2 control-label'>Siret</label>" +
            "<div class='col-sm-2'><input type='text' " + disabled + " class='form-control' sclid='" + sclId + "' id='Siret_zzz_' name='Siret_zzz_' value='" + onescl.Siret + "' /></div>" +
            "<label class='col-sm-2 control-label'>TVA intracom</label>" +
            "<div class='col-sm-2'><input type='text' " + disabled + "  class='form-control' id='VatIntra_zzz_'  sclid='" + sclId + "' name='VatIntra_zzz_' value='" + onescl.VatIntra + "' /></div>" +
            "<div class='col-sm-4'></div>" +
            "</div>" +
            "<div class='form-group'>" +
            "<label class='col-sm-2 control-label'>Adresse 1</label>" +
            "<div class='col-sm-2'><input type='text' " + disabled + "  class='form-control' sclid='" + sclId + "' id='Address1_zzz_' name='Address1_zzz_' value='" + onescl.Address1 + "' /></div>" +
            "<label class='col-sm-2 control-label'>Adresse 2</label>" +
            "<div class='col-sm-2'><input type='text' " + disabled + "  class='form-control' sclid='" + sclId + "' id='Address2_zzz_' name='Address2_zzz_' value='" + onescl.Address2 + "' /></div>" +
            "<label class='col-sm-2 control-label'>Code postal</label>" +
            "<div class='col-sm-2'><input type='text' " + disabled + "  class='form-control' sclid='" + sclId + "' id='Postcode_zzz_' name='Postcode_zzz_' value='" + onescl.Postcode + "' /></div>" +
            "</div>" +
            "<div class='form-group'>" +
            "<label class='col-sm-2 control-label'>Ville</label>" +
            "<div class='col-sm-2'><input type='text' " + disabled + "  class='form-control' sclid='" + sclId + "' id='City_zzz_' name='City_zzz_' value='" + onescl.City + "' /></div>" +
            "<label class='col-sm-2 control-label'>Téléphone</label>" +
            "<div class='col-sm-2'><input type='text' " + disabled + "  class='form-control' sclid='" + sclId + "' id='Tel1_zzz_' name='Tel1_zzz_' value='" + onescl.Tel1 + "' /></div>" +
            "<label class='col-sm-2 control-label'>Fax</label>" +
            "<div class='col-sm-2'><input type='text' " + disabled + "  class='form-control' sclid='" + sclId + "' id='Fax_zzz_' name='Fax_zzz_' value='" + onescl.Fax + "' /></div>" +
            "</div>" +
            "<div class='form-group'>" +
            "<label class='col-sm-2 control-label'>Portable</label>" +
            "<div class='col-sm-2'><input type='text' " + disabled + "  class='form-control' sclid='" + sclId + "' id='Cellphone_zzz_' name='Cellphone_zzz_' value='" + onescl.Cellphone + "' /></div>" +
            "<label class='col-sm-2 control-label'>Email</label>" +
            "<div class='col-sm-2'><input type='text' " + disabled + "  class='form-control' sclid='" + sclId + "' id='Email_zzz_' name='Email_zzz_' value='" + onescl.Email + "' /></div>" +
            "<div class='col-sm-4'></div>" +
            "</div>" +
            "<div class='form-group'>" +
            "<label class='col-sm-2 control-label'>Commentaire</label>" +
            "<div class='col-sm-10'><textarea rows='3' " + disabled + "  cols='1' sclid='" + sclId + "'  id='Comment4Interne_zzz_' value='" + 0 + "' name='Comment4Interne_zzz_' class='form-control'></textarea></div></div>" +
    // close box
            "</div></div></div></div></div>";

    var btnAddUpdate = "<button class='btn btn-inverse' sclid='" + sclId + "' id='btn_add_update_line_zzz_' name='btn_add_update_line_zzz_' onclick='return activerClient(this)'><span>" + ("Ajouter") + "</span></button>";
    var btnClose = "<button class='btn btn-default bootbox-close-button' onclick='return false'><span>Annuler</span></button>";
    var btns = "<div class='modal-body center'>" + btnClose + btnAddUpdate + "</div>";

    var onecontent = startBox + onelineContent + btns + endBox;


    onecontent = replaceAll(onecontent, 'zzz_', sclId);

    var title = 'Ajouter une ligne';
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
    $('#Client_' + sclId).append($("<option style='color:red;'></option>").attr("data-value", "0").text("Ou créer un nouveau client"));
    $.each(allclient, function (name, value) {
        $('#Client_' + sclId).append($("<option></option>").attr("value", value.FId).text(value.CompanyName));
    });
    $.each(allcivility, function (name, value) {
        if (value.Key === onescl.CivId) {
            $('#Civ_' + sclId).append($("<option></option>").attr("value", value.Key).attr("selected", true).text(value.Value));
        } else {
            $('#Civ_' + sclId).append($("<option></option>").attr("value", value.Key).text(value.Value));
        }
    });
}

function activerClient(sender) {
    var sclid = $(sender).attr('sclid');
    var CompanyName = $('#CompanyName_' + sclid).val();
    var Id = $('#Client_' + sclid).val();
    var CivId = $('#Civ_' + sclid).val();
    var FirstName = $('#FirstName_' + sclid).val();
    var LastName = $('#LastName_' + sclid).val();
    var Siret = $('#Siret_' + sclid).val();
    var VatIntra = $('#VatIntra_' + sclid).val();
    var Address1 = $('#Address1_' + sclid).val();
    var Address2 = $('#Address2_' + sclid).val();
    var Postcode = $('#Postcode_' + sclid).val();
    var City = $('#City_' + sclid).val();
    var Tel1 = $('#Tel1_' + sclid).val();
    var Fax = $('#Fax_' + sclid).val();
    var Cellphone = $('#Cellphone_' + sclid).val();
    var Email = $('#Email_' + sclid).val();
    var Comment4Interne = $('#Comment4Interne_' + sclid).val();


    if (CompanyName) {
        ShowPleaseWait();
        var siteClient = {};
        siteClient.SclId = sclid;
        siteClient.CompanyName = CompanyName;
        siteClient.FId = Id;
        siteClient.CivId = CivId;
        siteClient.FirstName = FirstName;
        siteClient.LastName = LastName;
        siteClient.Siret = Siret;
        siteClient.VatIntra = VatIntra;
        siteClient.Address1 = Address1;
        siteClient.Address2 = Address2;
        siteClient.Postcode = Postcode;
        siteClient.City = City;
        siteClient.Tel1 = Tel1;
        siteClient.Fax = Fax;
        siteClient.Cellphone = Cellphone;
        siteClient.Email = Email;
        siteClient.Comment4Interne = Comment4Interne;

        var jsondata = JSON.stringify({ client: siteClient });
        var url = window.webservicePath + "/ActiverSiteClient";
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
                    var clienturl = 'Client.aspx?cliId=' + data2Treat + '&mode=view';
                    //window.open(clienturl, '_blank');
                    window.location = clienturl;
                } else {
                    // authentication error
                    AuthencationError();
                }
            },
            error: function (data) {
                var test = '';
            }
        });

    } else {
        MsgErrorPopUp('ERREUR', 'Le Raison sociale est obligatoire !');
    }

}


function ClientChange(sender) {
    var sclid = $(sender).attr('sclid');
    var cliId = $(sender).val();
    var selectedCompanyname = $(sender).find('option:selected').text();
    var onescl = searchFieldValueInArray(allSiteClient, 'SclId', sclid * 1);
    if (!jQuery.isEmptyObject(onescl)) {
        if (cliId === 0) {
            $('#CompanyName_' + sclid).val(onescl.CompanyName);
        } else {
            $('#CompanyName_' + sclid).val(selectedCompanyname);
        }
    }
}