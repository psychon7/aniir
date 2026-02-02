using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Text;
using ERP.Entities;
using ERP.Repositories.DataBase;

namespace ERP.Repositories.SqlServer.Translators
{
    public class ShippingReceivingTranslator
    {
        public static Expression<Func<TM_SRV_Shipping_Receiving, ShippingReceiving>> RepositoryToEntity()
        {
            return o => new ShippingReceiving
            {
                SrvId = o.srv_id,
                SrvIsRev = o.srv_is_rev,
                SrvTime = o.srv_time,
                SrvCode = o.srv_code,
                SrvDescription = o.srv_description,
                UsrCreatorId = o.usr_creator_id,
                Creator = new User
                {
                    Firstname = o.TM_USR_User.usr_firstname,
                    Lastname = o.TM_USR_User.usr_lastname
                },
                SrvTotalQuantity = o.srv_total_quantity,
                SrvTotalReal = o.srv_total_real,
                SrvIsLend = o.srv_is_lend,
                SrvDLendReturnPre = o.srv_d_lend_return_pre,
                SrvIsReturnClient = o.srv_is_return_client,
                SrvDReturnClient = o.srv_d_return_client,
                SrvIsDestroy = o.srv_is_destroy,
                SrvDDestroy = o.srv_d_destroy,
                SrvIsReturnSupplier = o.srv_is_return_supplier,
                SrvDReturnSupplier = o.srv_d_return_supplier,
                SrvIsDamaged = o.srv_is_damaged,
                SrvDDamaged = o.srv_d_damaged,
                SrvClient = o.srv_client,
                SrvValid = o.srv_valid
                //WhsId = o.whs_id
            };
        }

        public static TM_SRV_Shipping_Receiving EntityToRepository(ShippingReceiving _from, TM_SRV_Shipping_Receiving _to, bool create = false)
        {
            if (create || _to == null)
            {
                _to = new TM_SRV_Shipping_Receiving();
                _to.usr_creator_id = _from.UsrCreatorId;
                _to.srv_code = _from.SrvCode;
                _to.srv_time = _from.SrvTime;
            }
            //_to.whs_id = _from.WhsId;
            _to.srv_is_rev = _from.SrvIsRev;
            _to.srv_description = _from.SrvDescription;
            _to.srv_total_quantity = _from.SrvTotalQuantity;
            _to.srv_total_real = _from.SrvTotalReal;
            _to.srv_is_lend = _from.SrvIsLend;
            _to.srv_d_lend_return_pre = _from.SrvDLendReturnPre;
            _to.srv_is_return_client = _from.SrvIsReturnClient;
            _to.srv_d_return_client = _from.SrvDReturnClient;
            _to.srv_is_destroy = _from.SrvIsDestroy;
            _to.srv_d_destroy = _from.SrvDDestroy;
            _to.srv_is_return_supplier = _from.SrvIsReturnSupplier;
            _to.srv_d_return_supplier = _from.SrvDReturnSupplier;
            _to.srv_is_damaged = _from.SrvIsDamaged;
            _to.srv_d_damaged = _from.SrvDDamaged;
            _to.srv_client = _from.SrvClient;
            return _to;
        }
    }
}
