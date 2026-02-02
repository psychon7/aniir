using System;
using System.Linq.Expressions;
using ERP.Entities;
using ERP.Repositories.DataBase;

namespace ERP.Repositories.SqlServer.Translators
{
    public class CarrierTranslator
    {
        public static Expression<Func<TR_CAR_Carrier, Carrier>> RepositoryToEntity()
        {
            return o => new Carrier
            {
                Id = o.car_id,
                Name = o.car_name,
                Code = o.car_code,
                Phone = o.car_phone,
                Email = o.car_email,
                Website = o.car_website,
                TrackingUrl = o.car_tracking_url,
                IsActive = o.car_is_active,
                SocId = o.soc_id
            };
        }

        public static TR_CAR_Carrier EntityToRepository(Carrier _from, TR_CAR_Carrier _to, bool create = false)
        {
            if (_to == null || create)
            {
                _to = new TR_CAR_Carrier { soc_id = _from.SocId };
            }
            _to.car_name = _from.Name;
            _to.car_code = _from.Code;
            _to.car_phone = _from.Phone;
            _to.car_email = _from.Email;
            _to.car_website = _from.Website;
            _to.car_tracking_url = _from.TrackingUrl;
            _to.car_is_active = _from.IsActive;
            return _to;
        }
    }
}
