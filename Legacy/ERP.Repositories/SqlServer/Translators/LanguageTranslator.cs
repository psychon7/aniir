using System;
using System.Linq.Expressions;
using ERP.Entities;
using ERP.Repositories.DataBase;

namespace ERP.Repositories.SqlServer.Translators
{
    public class LanguageTranslator
    {
        public static Expression<Func<TR_LAN_Language, Language>> RepositoryToEntity()
        {
            return o => new Language
            {
                Id = o.lan_id,
                Label = o.lan_label,
                ShortLabel = o.lan_short_label
            };
        }

        public static TR_LAN_Language EntityToRepository(Language _from, TR_LAN_Language _to, bool create = false)
        {
            if (_to == null || create)
            {
                _to = new TR_LAN_Language();
            }
            _to.lan_label = _from.Label;
            _to.lan_short_label = _from.ShortLabel;
            return _to;
        }
    }
}
