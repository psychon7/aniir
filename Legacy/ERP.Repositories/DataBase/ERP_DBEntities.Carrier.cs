using System.Data.Objects;

namespace ERP.Repositories.DataBase
{
    /// <summary>
    /// Partial class extension for ERP_DBEntities to add Carrier support
    /// </summary>
    public partial class ERP_DBEntities
    {
        /// <summary>
        /// Gets the TR_CAR_Carrier ObjectSet
        /// </summary>
        public ObjectSet<TR_CAR_Carrier> TR_CAR_Carrier
        {
            get
            {
                if (_TR_CAR_Carrier == null)
                {
                    _TR_CAR_Carrier = base.CreateObjectSet<TR_CAR_Carrier>("TR_CAR_Carrier");
                }
                return _TR_CAR_Carrier;
            }
        }
        private ObjectSet<TR_CAR_Carrier> _TR_CAR_Carrier;
    }
}
