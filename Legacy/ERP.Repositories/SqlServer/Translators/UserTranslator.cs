using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Text;
using ERP.Entities;
using ERP.Repositories.DataBase;

namespace ERP.Repositories.SqlServer.Translators
{
    public class UserTranslator
    {
        public static Expression<Func<TM_USR_User, User>> RepositoryToEntity()
        {
            return o => new User
                        {
                            Id = o.usr_id,
                            DUpdate = o.usr_d_update,
                            DCreation = o.usr_d_creation,
                            Fax = o.usr_fax,
                            Cellphone = o.usr_cellphone,
                            Email = o.usr_email,
                            Code_HR = o.usr_code_hr,
                            Is_Active = o.usr_is_actived,
                            Firstname = o.usr_firstname,
                            Lastname = o.usr_lastname,
                            Civility = new KeyValue
                            {
                                Value = o.TR_CIV_Civility.civ_designation
                            },
                            Society = new Society { Society_Name = (o.TR_SOC_Society != null ? o.TR_SOC_Society.soc_society_name : string.Empty) },
                            Title = o.usr_title,
                            City = o.usr_city,
                            UsrCreatorId = o.usr_creator_id,
                            Creator = new KeyValue
                            {
                                Value = o.usr_creator_id != null ?
                                o.TM_USR_User2.usr_firstname + "" + o.TM_USR_User2.usr_lastname
                                : string.Empty
                            },
                            Address1 = o.usr_address1,
                            Address2 = o.usr_address2,
                            Civ_Id = o.civ_id,
                            Country = o.usr_county,
                            PhotoPath = o.usr_photo_path,
                            PostCode = o.usr_postcode,
                            RolId = o.rol_id,
                            RoleName = o.TR_ROL_Role.rol_name,
                            Soc_id = o.soc_id,
                            SuperRight = o.usr_super_right,
                            Telephone = o.usr_tel,
                            UserLogin = o.usr_login,
                            UsrComment = o.usr_comment,
                            RcvPurchaseNotif = o.usr_rcv_purchase_notif ?? false,
                            IsPrdMandatory = o.TR_SOC_Society.soc_is_prd_mandatory ?? false,
                            SocShowLanguageBar = o.TR_SOC_Society.soc_show_language_bar ?? false
                        };
        }

        public static TM_USR_User EntityToRepository(User _from, TM_USR_User _to, bool iscreate = false)
        {
            if (_to == null || iscreate)
            {
                _to = new TM_USR_User();
                _to.usr_d_creation = DateTime.Now;
                _to.soc_id = _from.Soc_id;
                _to.usr_login = _from.UserLogin;
                _to.usr_creator_id = _from.UsrCreatorId;
            }
            _to.usr_d_update = _from.DUpdate;
            _to.usr_tel = _from.Telephone;
            _to.usr_fax = _from.Fax;
            _to.usr_cellphone = _from.Cellphone;
            _to.usr_email = _from.Email;
            _to.usr_code_hr = _from.Code_HR;
            _to.usr_is_actived = _from.Is_Active;
            _to.usr_firstname = _from.Firstname;
            _to.usr_lastname = _from.Lastname;
            _to.civ_id = _from.Civ_Id;
            _to.usr_title = _from.Title;
            _to.usr_city = _from.City;
            _to.usr_address1 = _from.Address1;
            _to.usr_address2 = _from.Address2;
            _to.usr_county = _from.Country;
            _to.usr_postcode = _from.PostCode;
            _to.rol_id = _from.RolId;
            _to.usr_super_right = _from.SuperRight;
            _to.usr_comment = _from.UsrComment;
            _to.usr_rcv_purchase_notif = _from.RcvPurchaseNotif;
            return _to;
        }
    }
}
