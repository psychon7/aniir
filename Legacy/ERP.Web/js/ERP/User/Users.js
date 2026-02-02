var allUsers = [];
var selectedUsrId = 0;
var allCivility = [];
var allRole = [];
var isAdmin = false;
var isManager = false;
var curUsrId = 0;

$(document).ready(function () {
    GetUserRole();
    js_GetCivility(0, 'allCivility');
    GetRole();
    GetCurrentUser();
    //GetUsers();
});

function GetUserRole() {
    var url = window.webservicePath + "/GetUserRole";
    $.ajax({
        url: url,
        type: 'POST',
        contentType: 'application/json; charset=utf-8',
        dataType: 'json',
        success: function (data) {
            var jsdata = data.d;
            isAdmin = jsdata === 1;
            isManager = jsdata === 2;
            if (isAdmin) {
                $('.admin_right').show();
                $('.manager_right').show();
            } else {
                $('.admin_right').hide();
                $('.manager_right').hide();
            }
            if (isManager) {
                $('.manager_right').show();
            } else {
                $('.manager_right').hide();
            }
        },
        error: function (data) {
        }
    });
}

function GetCurrentUser() {
    var url = window.webservicePath + "/GetCurrentUser";
    $.ajax({
        url: url,
        type: 'POST',
        contentType: 'application/json; charset=utf-8',
        dataType: 'json',
        success: function (data) {
            var jsdata = data.d;
            curUsrId = jsdata;
            GetUsers(curUsrId);
        },
        error: function (data) {
        }
    });
}


function UserNameClick() {
    $('#address-book .slider-content ul li ul li a').click(function (e) {
        e.preventDefault();
        var contact_card = $('#contact-card');
        //Get the name clicked on
        var name = $(this).text();
        //Set the name
        //        $('#contact-card .panel-title').html(name);
        //        $('#contact-card #card-name').val(name);

        var usr_id = $(this)[0].id;
        usr_id = usr_id * 1;
        var oneusr = $.grep(allUsers, function (e) { return e.Id === usr_id; });

        if (oneusr.length === 1) {
            $.each(oneusr[0], function (name, val) {
                if (name === 'Civ_Id' || name === 'RolId' || name === 'Id' || name === 'PhotoPath' || name === 'UsrComment') {
                    if (name === 'RolId') {
                        $('#RolId').empty();
                        $.each(allRole, function (index, onerol) {
                            if (onerol.Key === val) {
                                $('#RolId').append($("<option></option>").attr("value", onerol.Key).attr("selected", true).text(onerol.Value));
                            } else {
                                $('#RolId').append($("<option></option>").attr("value", onerol.Key).text(onerol.Value));
                            }
                        });
                    } else if (name === 'Civ_Id') {
                        $('#Civ_Id').empty();
                        $.each(allCivility, function (index, onerol) {
                            if (onerol.Key === val) {
                                $('#Civ_Id').append($("<option></option>").attr("value", onerol.Key).attr("selected", true).text(onerol.Value));
                            } else {
                                $('#Civ_Id').append($("<option></option>").attr("value", onerol.Key).text(onerol.Value));
                            }
                        });
                    }
                    else if (name === 'Id') {
                        $('#btnSave').attr('usrid', val);
                        $('#btnChangePwd').attr('usrid', val);
                        $('#UserLogin').attr('usrid', val);
                    }
                    else if (name === 'PhotoPath') {
                        $('#div_photoPath').empty();
                        if (val) {
                            var image = "<img src='../../Services/ShowOutSiteImage.ashx?file=" + val + "' alt=''   class='img-responsive'  style='width: 100%' />";
                            var btnDeletePhoto = "<button id='btnDeletePhoto' class='btn btn-inverse' onclick='return DeletePhotoClick(" + oneusr[0].Id + ")'>Supprimer Photo</button>";
                            $('#div_photoPath').append(image + "<br/>" + btnDeletePhoto);
                        }
                    }
                    else if (name === 'UsrComment') {
                        $('#UsrComment').text(val);
                    }
                }
                $('#btnChangePwd').show();
                setFieldValue(name, val, true);
            });
            $('#UserLogin').attr('disabled', '');
        }
        contact_card.removeClass('animated fadeInUp').addClass('animated fadeInUp');
        var wait = window.setTimeout(function () {
            contact_card.removeClass('animated fadeInUp');
        },
            800
        );
    });
}

function DeletePhotoClick(usrId) {
    try {
        MsgPopUpWithResponseChoice('SUPPRESSION', 'Supprimez le photo ?', 'Supprimer', 'DeletePhoto(' + usrId + ')', 'Annuler');
    } catch (e) {
        var test = e;
    }
    return false;
}

function DeletePhoto(usrId) {
    //$('#btnUpdatePhoto').val('true');
    $('#div_photoPath').empty();
    var url = window.webservicePath + "/DeleteUserPhoto";
    $.ajax({
        url: url,
        type: 'POST',
        contentType: 'application/json; charset=utf-8',
        dataType: 'json',
        data: '{usrId:' + usrId + '}',
        success: function (data) {
            GetUsers(0);
        },
        error: function (data) {
        }
    });
    return false;
}

function createNewUser() {
    $('#RolId').empty();
    $.each(allRole, function (index, onerol) { $('#RolId').append($("<option></option>").attr("value", onerol.Key).text(onerol.Value)); });
    $('#Civ_Id').empty();
    $.each(allCivility, function (index, onerol) { $('#Civ_Id').append($("<option></option>").attr("value", onerol.Key).text(onerol.Value)); });
    $('#UserLogin').val('');
    $('#UserLogin').prop("disabled", false);
    $('#Title').val('');
    $('#Code_HR').val('');
    $('#Firstname').val('');
    $('#Lastname').val('');
    $('#Address1').val('');
    $('#Address2').val('');
    $('#PostCode').val('');
    $('#City').val('');
    $('#Country').val('');
    $('#Email').val('');
    $('#Telephone').val('');
    $('#Fax').val('');
    $('#Cellphone').val('');
    $('#Is_Active').prop('checked', true);
    $('#SuperRight').prop('checked', false);
    $('#btnSave').attr('usrid', 0);
    $('#btnChangePwd').attr('usrid', 0);
    $('#UserLogin').attr('usrid', 0);
    $('#UsrComment').val('');
    $('#btnChangePwd').hide();
}

function GetUsers(usrId) {
    allUsers = [];
    var url = window.webservicePath + "/GetUserList";
    $.ajax({
        url: url,
        type: 'POST',
        contentType: 'application/json; charset=utf-8',
        dataType: 'json',
        success: function (data) {
            var jsdata = data.d;
            var jsondata = jQuery.parseJSON(jsdata);
            allUsers = jsondata;
            var client_content = "";
            var lastletter = "lastletter";
            $.each(allUsers, function (nmb, value) {
                if (lastletter !== value.NameFirstLetter.toLowerCase()) {
                    if (lastletter !== "lastletter") {
                        client_content += "</ul></li>";
                    }
                    lastletter = value.NameFirstLetter.toLowerCase();
                    // new one
                    client_content += "<li id='" + lastletter + "'><a name='" + lastletter + "' class='title'>" + value.NameFirstLetter + "</a><ul><li><a href='/' id='" + value.Id + "'>" + value.Firstname + " " + value.Lastname.toUpperCase() + " [" + value.UserLogin + "]" + "</a></li>";
                } else {
                    // follow the old one
                    client_content += "<li><a href='/' id='" + value.Id + "'>" + value.Firstname + " " + value.Lastname.toUpperCase() + " [" + value.UserLogin + "]" + "</a></li>";
                }
            });
            client_content += "</ul></li>";
            $('#ul_client_content').empty();
            $('#ul_client_content').append(client_content);
            initAddBook();

            if (usrId > 0) {
                $('a[id="' + usrId + '"]').click();
            }
        },
        error: function (data) {
        }
    });
}

function checkLoginExisted(sender) {
    var usrId = $(sender).attr('usrId') * 1;
    var login = $(sender).val().trim();
    if (login.length > 3) {
        var url = window.webservicePath + "/CheckLoginExisted";
        var datastr = "{usrId:" + usrId + ", login:'" + login + "'}";
        $.ajax({
            url: url,
            type: 'POST',
            contentType: 'application/json; charset=utf-8',
            dataType: 'json',
            data: datastr,
            success: function (data) {
                var jsdata = data.d;
                if (jsdata) {
                    alert('Login existé, veuillez changer le Login !');
                }
            },
            error: function (data) {
            }
        });
    }
}

function GetRole() {
    var url = window.webservicePath + "/GetRoleList";
    $.ajax({
        url: url,
        type: 'POST',
        contentType: 'application/json; charset=utf-8',
        dataType: 'json',
        success: function (data) {
            var jsdata = data.d;
            var jsondata = jQuery.parseJSON(jsdata);
            allRole = [];
            allRole = jsondata;
        },
        error: function (data) {
        }
    });
}

function initAddBook() {
    App.setPage("address_book");  //Set current page
    App.init(); //Initialise plugins and elements
}

function CreateUpdateUser(sender) {
    var usrid = $(sender).attr('usrid') * 1;
    var checkOK = CheckRequiredFieldInOneDiv('div_user_info');
    var login = $('#UserLogin').val().trim();
    if (login.length < 4) {
        alert('Le longueur de Login doit être supérieur 4 lettres !');
    } else {
        if (checkOK) {
            if (login.length > 3) {
                var url = window.webservicePath + "/CheckLoginExisted";
                var datastr = "{usrId:" + usrid + ", login:'" + login + "'}";
                $.ajax({
                    url: url,
                    type: 'POST',
                    contentType: 'application/json; charset=utf-8',
                    dataType: 'json',
                    data: datastr,
                    success: function (data) {
                        var jsdata = data.d;
                        if (jsdata) {
                            alert('Login existé, veuillez changer le Login !');
                        } else {
                            ShowPleaseWait();
                            var oneUser = {};
                            oneUser.Id = usrid;
                            oneUser.UserLogin = login;
                            oneUser.Title = $('#Title').val();
                            oneUser.Civ_Id = $('#Civ_Id').val();
                            oneUser.RolId = $('#RolId').val();
                            oneUser.Code_HR = $('#Code_HR').val();
                            oneUser.Is_Active = $('#Is_Active').is(':checked');
                            oneUser.Firstname = $('#Firstname').val();
                            oneUser.Lastname = $('#Lastname').val();
                            oneUser.Address1 = $('#Address1').val();
                            oneUser.Address2 = $('#Address2').val();
                            oneUser.PostCode = $('#PostCode').val();
                            oneUser.City = $('#City').val();
                            oneUser.Country = $('#Country').val();
                            oneUser.Telephone = $('#Telephone').val();
                            oneUser.Fax = $('#Fax').val();
                            oneUser.Email = $('#Email').val();
                            oneUser.SuperRight = $('#SuperRight').is(':checked');
                            oneUser.UsrComment = $('#UsrComment').val();
                            oneUser.Cellphone = $('#Cellphone').val();
                            oneUser.RcvPurchaseNotif  = $('#RcvPurchaseNotif').is(':checked');

                            var jsondata = JSON.stringify({ oneUser: oneUser });
                            url = window.webservicePath + "/CreateUpdateUser";
                            $.ajax({
                                url: url,
                                type: 'POST',
                                contentType: 'application/json; charset=utf-8',
                                data: jsondata,
                                dataType: 'json',
                                success: function (data) {
                                    var usrId = data.d;
                                    var photovalue = $('#btnUpdatePhoto').val();
                                    if (usrId > 0 && photovalue !== 'true' && photovalue.length > 0) {
                                        CreateUpdateUserPhoto(usrId);
                                    } else {
                                        GetUsers(usrId);
                                        HidePleaseWait();
                                    }
                                },
                                error: function (data) {
                                }
                            });

                        }
                    },
                    error: function (data) {
                    }
                });
            }
        }
    }
    return false;
}

function CreateUpdateUserPhoto(usrId) {
    var formData = new FormData();
    formData.append('file', $('#btnUpdatePhoto')[0].files[0]);
    var itemId = usrId;
    var url = "../../Services/UploadFilesGeneral.ashx?type=9&usrId=" + encodeURIComponent(usrId);
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
                window.location.reload();
            },
            error: function (e) {
                //errorHandler
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
}

function getFileDataPopUp() {
    $('#btnCancelPhoto').show();
}

function CancelPhoto() {
    $('#btnUpdatePhoto').val('');
    $('#btnCancelPhoto').hide();
    return false;
}

function ChangePassword(sender) {
    var usrId = $(sender).attr('usrid') * 1;
    if (usrId === curUsrId) {
        // owner change
        OwnerChangePwd(usrId);
    } else {
        // other change
        AutoChangePwd(usrId);
    }
    return false;
}

function OwnerChangePwd(usrId) {
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
            "<label class='col-sm-4 control-label'>Mot de passe</label>" +
            "<div class='col-sm-8'><input type='password' class='form-control' id='IpChangePwd' name='IpChangePwd' required/></div>" +
            "</div>" +
            "<div class='form-group'>" +
            "<label class='col-sm-4 control-label sale'>Confirmer</label>" +
            "<div class='col-sm-8'><input type='password' id='IpConfirmPwd' name='IpConfirmPwd'  required class='form-control'/></div>" +
            "</div>" +
    // close box
            "</div></div></div></div></div>";

    var btnAddUpdate = "<button class='btn btn-inverse' id='btnChangePassword' name='btnChangePassword' onclick='return ChangePasswordClick(" + usrId + ",1)'>Modifier</button>";
    var btnClose = "<button class='btn btn-default bootbox-close-button' onclick='return false'><span>Annuler</span></button>";

    var btns = "<div class='modal-body center'>" + btnClose + btnAddUpdate + "</div>";

    var onecontent = startBox + onelineContent + btns + endBox;

    var title = 'Modifier le mot de passe';
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
            var h = (w - b) * 0.1;
            return h + "px";
        }
    }).find('.modal-header').css({
        'background': 'url(../../img/menu_005_bg.jpg) repeat-x',
        'text-align': 'center',
        'color': '#C0C0C0'
    });
}

function ChangePasswordClick(usrId, type) {
    usrId = usrId * 1;
    var changePwd = false;
    var pwd = '';
    if (type === 1) {
        pwd = $('#IpChangePwd').val();
        var confirmpwd = $('#IpConfirmPwd').val();
        if (pwd.length < 6) {
            alert('Le longueur du mot de passe doit être supérieur à 6 lettres ! ');
        } else {
            if (pwd !== confirmpwd) {
                alert('Veuillez confirmer le mot de passe !');
                $('#IpConfirmPwd').addClass('error_border');
            } else {
                ShowPleaseWait();
                changePwd = true;
            }
        }
    } else {
        ShowPleaseWait();
        changePwd = true;
    }
    if (changePwd) {
        var url = window.webservicePath + "/ChangeUserPassword";
        var datastr = "{usrId: " + usrId + ", pwd:'" + pwd + "'}";
        $.ajax({
            url: url,
            type: 'POST',
            contentType: 'application/json; charset=utf-8',
            dataType: 'json',
            data: datastr,
            success: function (data) {
                var changed = data.d;
                HidePleaseWait();
                if (changed) {
                    closeDialog();
                    MsgErrorPopUp("MESSAGE", "La modification est effectuée !");
                } else {
                    closeDialog();
                    MsgErrorPopUp("ERREUR", "La modification n'est pas effectuée, veuillez contacter l'administrateur !");
                }
            },
            error: function (data) {
            }
        });
    }
    return false;
}

function AutoChangePwd(usrId) {
    var startBox = "<div class='box'><div class='box-body'>";
    var endBox = "</div></div>";
    var onelineContent =
    // start box
        "<div class='form-group' id='div_one_line'>" +
            "<div class='row'>" +
            "<div class='col-md-12'>" +
            "<div class='box-body'>" +
            "<div class='form-horizontal'>" +
            "<div class='col-sm-12' style='text-align:center;font-size: 18pt;'>Le mot de passe sera géneré automatiquement, veuillez confirmer la modification !" +
            "</div>" +
    // close box
            "</div></div></div></div></div>";

    var btnAddUpdate = "<button class='btn btn-inverse' id='btnChangePassword' name='btnChangePassword' onclick='return ChangePasswordClick(" + usrId + ",2)'>Confirmer</button>";
    var btnClose = "<button class='btn btn-default bootbox-close-button' onclick='return false'><span>Annuler</span></button>";

    var btns = "<div class='modal-body center'>" + btnClose + btnAddUpdate + "</div>";

    var onecontent = startBox + onelineContent + btns + endBox;

    var title = 'Modifier le mot de passe';
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
            var h = (w - b) * 0.1;
            return h + "px";
        }
    }).find('.modal-header').css({
        'background': 'url(../../img/menu_005_bg.jpg) repeat-x',
        'text-align': 'center',
        'color': '#C0C0C0'
    });
}