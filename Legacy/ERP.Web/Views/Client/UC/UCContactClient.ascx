<%@ Control Language="C#" AutoEventWireup="true" CodeBehind="UCContactClient.ascx.cs"
    Inherits="ERP.Web.Views.Client.UC.UCContactClient" %>
<div id="div_uc_contact_client" style="display: none;">
    <div class="box">
        <div class="box-body">
            <div class="form-horizontal">
                <div class="form-group">
                    <label class="col-sm-3 control-label">
                        Titre d'adresse</label>
                    <div class="col-sm-9">
                        <input class="form-control" id="CcoAdresseTitle" name="CcoAdresseTitle" type="text"
                            placeholder="Titre d'adresse" disabled="">
                    </div>
                </div>
                <div class="form-group">
                    <label class="col-sm-3 control-label">
                        Référence</label>
                    <div class="col-sm-9">
                        <input class="form-control" id="CcoRef" name="CcoRef" type="text" placeholder="Référence"
                            disabled="">
                    </div>
                </div>
                <div class="form-group">
                    <label class="col-sm-3 control-label">
                        Prénom</label>
                    <div class="col-sm-9">
                        <input class="form-control" id="CcoFirstname" name="CcoFirstname" type="text" placeholder="Prénom"
                            required="" maxlength="200">
                    </div>
                </div>
                <div class="form-group">
                    <label class="col-sm-3 control-label">
                        Nom de famille</label>
                    <div class="col-sm-9">
                        <input class="form-control" id="CcoLastname" name="CcoLastname" type="text" placeholder="Nom de famille"
                            required="" maxlength="200">
                    </div>
                </div>
                <div class="form-group">
                    <label class="col-sm-3 control-label">
                        Civilité</label>
                    <div class="col-sm-9">
                        <select class="form-control" id="CivId" name="CivId">
                        </select>
                    </div>
                </div>
                <div class="form-group">
                    <label class="col-sm-3 control-label">
                        Adresse 1</label>
                    <div class="col-sm-9">
                        <input class="form-control" id="CcoAddress1" name="CcoAddress1" type="text" placeholder="Adresse 1">
                    </div>
                </div>
                <div class="form-group">
                    <label class="col-sm-3 control-label">
                        Adresse 2</label>
                    <div class="col-sm-9">
                        <input class="form-control" id="CcoAddress2" name="CcoAddress2" type="text" placeholder="Adresse 2">
                    </div>
                </div>
                <div class="form-group">
                    <label class="col-sm-3 control-label">
                        Code postal</label>
                    <div class="col-sm-9">
                        <input class="form-control" id="CcoPostcode" name="CcoPostcode" type="text" placeholder="Code postal"
                            onkeyup="getCommuneName(this,'CcoCity')" maxlength="10">
                    </div>
                </div>
                <div class="form-group">
                    <label class="col-sm-3 control-label">
                        Ville</label>
                    <div class="col-sm-9">
                        <input type="text" class="form-control" list="CcoCity" id="ip_CcoCity" placeholder="Ville"
                            oninput="communeChange('ip_CcoCity','CcoCity','CcoPostcode')" maxlength="200">
                        <datalist id="CcoCity"></datalist>
                    </div>
                </div>
                <div class="form-group">
                    <label class="col-sm-3 control-label">
                        Pays</label>
                    <div class="col-sm-9">
                        <input class="form-control" id="CcoCountry" name="CcoCountry" type="text" placeholder="Pays">
                    </div>
                </div>
                <div class="form-group">
                    <label class="col-sm-3 control-label">
                        Téléphone 1</label>
                    <div class="col-sm-9">
                        <input class="form-control" id="CcoTel1" name="CcoTel1" type="text" placeholder="Téléphone 1">
                    </div>
                </div>
                <div class="form-group">
                    <label class="col-sm-3 control-label">
                        Téléphone 2</label>
                    <div class="col-sm-9">
                        <input class="form-control" id="CcoTel2" name="CcoTel2" type="text" placeholder="Téléphone 2">
                    </div>
                </div>
                <div class="form-group">
                    <label class="col-sm-3 control-label">
                        Fax</label>
                    <div class="col-sm-9">
                        <input class="form-control" id="CcoFax" name="CcoFax" type="text" placeholder="CcoFax">
                    </div>
                </div>
                <div class="form-group">
                    <label class="col-sm-3 control-label">
                        Portable</label>
                    <div class="col-sm-9">
                        <input class="form-control" id="CcoCellphone" name="CcoCellphone" type="text" placeholder="Portable">
                    </div>
                </div>
                <div class="form-group">
                    <label class="col-sm-3 control-label">
                        Email</label>
                    <div class="col-sm-9">
                        <div class="input-group">
                            <span class="input-group-addon">@</span>
                            <input type="email" id="CcoEmail" name="CcoEmail" class="form-control" placeholder="Email"
                                maxlength="100">
                        </div>
                    </div>
                </div>
                <div class="form-group">
                    <label class="col-sm-3 control-label">
                        Recevoir le Newsletter</label>
                    <div class="col-sm-1">
                        <div class="checker" style="text-align: center;">
                            <span class="">
                                <input type="checkbox" id="CcoRecieveNewsletter" name="CcoRecieveNewsletter" class="uniform"
                                    value="">
                            </span>
                        </div>
                    </div>
                    <div class="col-sm-8">
                        <div class="input-group">
                            <span class="input-group-addon">@</span>
                            <input type="email" id="CcoNewsletterEmail" name="CcoNewsletterEmail" class="form-control"
                                placeholder="Newsletter Email" maxlength="20">
                        </div>
                    </div>
                </div>
                <div class="form-group">
                    <label class="col-sm-3 control-label">
                        Adresse livraison</label>
                    <div class="col-sm-3">
                        <div class="checker" style="text-align: center;">
                            <span class="">
                                <input type="checkbox" id="CcoIsDeliveryAdr" name="CcoIsDeliveryAdr" class="uniform"
                                    value="">
                            </span>
                        </div>
                    </div>
                    <label class="col-sm-3 control-label">
                        Adresse facturation</label>
                    <div class="col-sm-3">
                        <div class="checker" style="text-align: center;">
                            <span class="">
                                <input type="checkbox" id="CcoIsInvoicingAdr" name="CcoIsInvoicingAdr" class="uniform"
                                    value="">
                            </span>
                        </div>
                    </div>
                </div>
                <div class="form-group">
                    <label class="col-md-3 control-label">
                        Commentaire</label>
                    <div class="col-md-9">
                        <textarea rows="3" cols="5" name="CcoComment" class="form-control" id="CcoComment"></textarea></div>
                </div>
                <div class="modal-footer center forcreate">
                    <button type="button" class="btn btn-default">
                        Annuler</button>
                    <button type="button" class="btn btn-danger" onclick="return js_CheckClientExisted_for_create_update('CompanyName');">
                        Sauvegarder</button>
                </div>
                <div class="modal-footer center forview">
                    <button type="button" class="btn btn-success" onclick="changeViewMode('modify')">
                        Modifier</button>
                </div>
                <div class="modal-footer center forupdate">
                    <button type="button" class="btn btn-default" onclick="changeViewMode('view')">
                        Annuler</button>
                    <button type="button" class="btn btn-danger" onclick="return js_CheckClientExisted_for_create_update('CompanyName');">
                        Mettre à jours</button>
                </div>
            </div>
        </div>
    </div>
</div>
